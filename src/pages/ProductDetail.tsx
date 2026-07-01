/**
 * ProductDetail — Product Profile Page
 * تفاصيل المنتج — صفحة ملف المنتج
 *
 * Tabs: Overview, BOM, Manufacturing, Cost, Edit
 */

import { useState, useEffect, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { isDemoMode } from "../lib/supabase";
import { getDataSource } from "../lib/data-source";
import { maybePushProductsToShopify } from "../lib/shopify-push";
import type { Database } from "../lib/database.types";
import Breadcrumbs from "../components/Breadcrumbs";
import VisualStages from "../components/VisualStages";
import {
  Package, Loader2, ArrowLeft, Layers, Wrench, DollarSign,
  Ruler, Clock, CheckCircle2, AlertTriangle, Trash2,
  Copy, Edit3, Save, X, Plus, Info, ListTree, Tag,
} from "lucide-react";
import {
  type MfgStage, type BOMLine, type ProductMeta, type Priority,
  PRODUCT_CATEGORIES, MATERIALS, FINISHES, BOM_UNITS, DEPARTMENTS, PRIORITIES,
  calculateTotalCost, calculateCriticalPath, getProductWarnings, uid,
} from "../lib/furniture-engine";

type Resource = Database["public"]["Tables"]["resources"]["Row"];

function getPM(r: Resource): ProductMeta {
  return (r.metadata ?? {}) as ProductMeta;
}

const inputCls = "w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20";
const smallInput = "w-full h-8 px-2.5 rounded-lg border border-border/50 bg-background text-[12px] focus:outline-none focus:ring-1 focus:ring-primary/20";
const labelCls = "text-[11.5px] text-muted-foreground font-medium mb-1 block";

// ─── Tabs ───────────────────────────────────────────────

const TABS = [
  { key: "overview", en: "Overview", ar: "نظرة عامة", icon: Package },
  { key: "bom", en: "BOM", ar: "المكونات", icon: Layers },
  { key: "manufacturing", en: "Manufacturing", ar: "التصنيع", icon: Wrench },
  { key: "cost", en: "Cost", ar: "التكلفة", icon: DollarSign },
  { key: "edit", en: "Edit", ar: "تعديل", icon: Edit3 },
] as const;

type TabKey = typeof TABS[number]["key"];

// ─── Delete Confirmation ────────────────────────────────

function DeleteConfirm({ ar, name, onConfirm, onCancel, loading }: {
  ar: boolean; name: string; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
        className="relative bg-background rounded-2xl border border-border/40 shadow-2xl p-6 w-full max-w-[400px]"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
            <Trash2 size={18} className="text-rose-600" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold">{ar ? "حذف المنتج" : "Delete Product"}</h3>
            <p className="text-[12px] text-muted-foreground">{ar ? "هذا الإجراء لا يمكن التراجع عنه" : "This action cannot be undone"}</p>
          </div>
        </div>
        <p className="text-[13px] text-muted-foreground mb-6">
          {ar ? `هل أنت متأكد من حذف "${name}"؟ سيتم حذف كل البيانات المرتبطة.` : `Are you sure you want to delete "${name}"? All associated data will be removed.`}
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 h-10 rounded-xl border border-border/60 text-[13px] font-medium hover:bg-muted/50">
            {ar ? "إلغاء" : "Cancel"}
          </button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 h-10 rounded-xl bg-rose-600 text-white text-[13px] font-medium hover:bg-rose-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 size={12} className="animate-spin" />}
            <Trash2 size={13} />
            {ar ? "احذف" : "Delete"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────────────────

export default function ProductDetail() {
  const [, params] = useRoute("/products/:id");
  const [, navigate] = useLocation();
  const { lang } = useLanguage();
  const { workspace } = useAuth();
  const ar = lang === "ar";
  const settings = workspace?.settings as Record<string, unknown> | undefined;
  const currency = (settings?.currency as string) || "EGP";

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Resource | null>(null);
  const [tab, setTab] = useState<TabKey>("overview");
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Edit state
  const [editName, setEditName] = useState("");
  const [editNameAr, setEditNameAr] = useState("");
  const [editSku, setEditSku] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState<Priority>("medium");
  const [editWidth, setEditWidth] = useState("");
  const [editHeight, setEditHeight] = useState("");
  const [editDepth, setEditDepth] = useState("");
  const [editMainMaterial, setEditMainMaterial] = useState("");
  const [editFinish, setEditFinish] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editBom, setEditBom] = useState<BOMLine[]>([]);
  const [editStages, setEditStages] = useState<MfgStage[]>([]);

  useEffect(() => {
    if (!params?.id) return;
    const wsId = workspace?.id || "demo";
    getDataSource().resources.get(wsId, params.id)
      .then(r => {
        if (r) {
          setProduct(r);
          populateEdit(r);
        }
      })
      .finally(() => setLoading(false));
  }, [params?.id, workspace?.id]);

  function populateEdit(r: Resource) {
    const m = getPM(r);
    setEditName(r.name_en);
    setEditNameAr(r.name_ar || "");
    setEditSku(m.sku || "");
    setEditCategory(m.category || "");
    setEditDescription(m.description || "");
    setEditPriority(m.priority || "medium");
    setEditWidth(m.width?.toString() || "");
    setEditHeight(m.height?.toString() || "");
    setEditDepth(m.depth?.toString() || "");
    setEditMainMaterial(m.main_material || "");
    setEditFinish(m.finish || "");
    setEditPrice(m.suggested_price?.toString() || "");
    setEditBom(m.bom || []);
    setEditStages(m.stages || []);
  }

  // ─── Save Edit ─────────────────────────────────────────

  async function handleSave() {
    if (!product) return;
    setSaving(true);
    setSaveMsg("");
    const m = getPM(product);
    const costInfo = calculateTotalCost(editBom, editStages);
    const newMeta: ProductMeta = {
      ...m,
      sku: editSku, category: editCategory, description: editDescription,
      priority: editPriority,
      width: parseFloat(editWidth) || undefined,
      height: parseFloat(editHeight) || undefined,
      depth: parseFloat(editDepth) || undefined,
      main_material: editMainMaterial, finish: editFinish,
      suggested_price: parseFloat(editPrice) || undefined,
      bom: editBom, stages: editStages,
      material_cost: costInfo.materialCost,
      labor_cost: costInfo.stageCosts.laborTotal,
      machine_cost: costInfo.stageCosts.machineTotal,
      overhead_cost: costInfo.stageCosts.overheadTotal,
      total_cost: costInfo.totalCost,
    };
    const updated = await getDataSource().resources.update(
      workspace?.id || "demo", product.id,
      { name_en: editName, name_ar: editNameAr || null, metadata: newMeta as any } as any
    );
    if (updated) {
      setProduct(updated);
      void maybePushProductsToShopify(workspace?.id || "");
      setSaveMsg(ar ? "تم الحفظ" : "Saved");
      setTimeout(() => setSaveMsg(""), 2000);
    }
    setSaving(false);
  }

  // ─── Delete ────────────────────────────────────────────

  async function handleDelete() {
    if (!product) return;
    setDeleting(true);
    await getDataSource().resources.remove(workspace?.id || "demo", product.id);
    setDeleting(false);
    navigate("/products");
  }

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 size={20} className="animate-spin text-muted-foreground/40" /></div>;
  if (!product) return <div className="flex flex-col items-center justify-center py-24 gap-4"><Package size={24} className="text-muted-foreground/30" /><p className="text-[14px] text-muted-foreground">{ar ? "المنتج غير موجود" : "Product not found"}</p><button onClick={() => navigate("/products")} className="text-[13px] text-primary hover:underline">{ar ? "← رجوع للمنتجات" : "← Back to Products"}</button></div>;

  const m = getPM(product);
  const bom = m.bom || [];
  const stages = m.stages || [];
  const costInfo = calculateTotalCost(bom, stages);
  const timeInfo = calculateCriticalPath(stages);
  const warnings = getProductWarnings(m);
  const cat = PRODUCT_CATEGORIES.find(c => c.en === m.category);
  const pri = PRIORITIES.find(p => p.value === m.priority);

  return (
    <div className="min-h-full">
      {/* Breadcrumbs */}
      <div className="px-7 md:px-10 pt-4">
        <Breadcrumbs items={[
          { label: ar ? "المنتجات" : "Products", path: "/products" },
          { label: product.name_en },
        ]} backLabel={ar ? "المنتجات" : "Products"} backPath="/products" />
      </div>

      {/* Header */}
      <div className="border-b border-border/40 px-7 md:px-10 pt-4 pb-5" style={{ background: "linear-gradient(160deg, hsl(var(--muted)/0.3) 0%, hsl(var(--background)) 60%)" }}>
        <div className="max-w-[1100px]">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {m.sku && <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">{m.sku}</span>}
                {cat && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/8 text-primary font-medium">{ar ? cat.ar : cat.en}</span>}
                {pri && <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${pri.color}`}>{ar ? pri.ar : pri.en}</span>}
                {m.active === false && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{ar ? "غير نشط" : "Inactive"}</span>}
              </div>
              <h1 className="text-[26px] font-medium text-foreground leading-tight" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.025em" }}>
                {ar ? (product.name_ar ?? product.name_en) : product.name_en}
              </h1>
              {m.description && <p className="text-[13px] text-muted-foreground mt-1">{m.description}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setTab("edit")} className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border/60 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                <Edit3 size={13} /> {ar ? "تعديل" : "Edit"}
              </button>
              <button onClick={() => setShowDelete(true)} className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-rose-200 text-[12px] font-medium text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors">
                <Trash2 size={13} /> {ar ? "حذف" : "Delete"}
              </button>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-background border border-border/40 rounded-xl px-4 py-3">
              <Layers size={13} className="text-primary mb-1.5" />
              <p className="text-[18px] font-medium tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>{bom.length}</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "مكون" : "BOM Items"}</p>
            </div>
            <div className="bg-background border border-border/40 rounded-xl px-4 py-3">
              <Wrench size={13} className="text-primary mb-1.5" />
              <p className="text-[18px] font-medium tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>{stages.length}</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "مرحلة" : "Stages"}</p>
            </div>
            <div className="bg-background border border-border/40 rounded-xl px-4 py-3">
              <Clock size={13} className="text-primary mb-1.5" />
              <p className="text-[18px] font-medium tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>{timeInfo.totalDays}</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "يوم تصنيع" : "Work Days"}</p>
            </div>
            <div className="bg-background border border-border/40 rounded-xl px-4 py-3">
              <DollarSign size={13} className="text-primary mb-1.5" />
              <p className="text-[18px] font-medium tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>{Math.round(costInfo.totalCost).toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "التكلفة" : "Total Cost"}</p>
            </div>
            {m.suggested_price && m.suggested_price > 0 && costInfo.totalCost > 0 && (
              <div className="bg-background border border-border/40 rounded-xl px-4 py-3">
                <Tag size={13} className="text-emerald-500 mb-1.5" />
                <p className={`text-[18px] font-medium tabular-nums ${(m.suggested_price - costInfo.totalCost) >= 0 ? "text-emerald-600" : "text-rose-500"}`} style={{ fontFamily: "var(--app-font-serif)" }}>
                  {Math.round(((m.suggested_price - costInfo.totalCost) / m.suggested_price) * 100)}%
                </p>
                <p className="text-[10px] text-muted-foreground">{ar ? "هامش الربح" : "Margin"}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-7 md:px-10 border-b border-border/30 bg-background/95 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-[1100px] flex items-center gap-1 -mb-px">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-[12px] font-medium border-b-2 transition-colors ${active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                <Icon size={13} />
                {ar ? t.ar : t.en}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-7 md:px-10 py-6 max-w-[1100px]">
        <AnimatePresence mode="wait">
          {/* ─── Overview ──────────────────────────── */}
          {tab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              {/* Dimensions */}
              {(m.width || m.height || m.depth) && (
                <div>
                  <p className="text-[12px] font-semibold text-muted-foreground tracking-[0.06em] uppercase mb-3 flex items-center gap-1"><Ruler size={11} /> {ar ? "الأبعاد" : "Dimensions"}</p>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    {m.width && <div className="bg-muted/20 rounded-xl px-4 py-3"><p className="text-[10px] text-muted-foreground">{ar ? "العرض" : "Width"}</p><p className="text-[15px] font-medium tabular-nums">{m.width} cm</p></div>}
                    {m.height && <div className="bg-muted/20 rounded-xl px-4 py-3"><p className="text-[10px] text-muted-foreground">{ar ? "الارتفاع" : "Height"}</p><p className="text-[15px] font-medium tabular-nums">{m.height} cm</p></div>}
                    {m.depth && <div className="bg-muted/20 rounded-xl px-4 py-3"><p className="text-[10px] text-muted-foreground">{ar ? "العمق" : "Depth"}</p><p className="text-[15px] font-medium tabular-nums">{m.depth} cm</p></div>}
                    {m.weight && <div className="bg-muted/20 rounded-xl px-4 py-3"><p className="text-[10px] text-muted-foreground">{ar ? "الوزن" : "Weight"}</p><p className="text-[15px] font-medium tabular-nums">{m.weight} kg</p></div>}
                  </div>
                </div>
              )}
              {/* Materials */}
              {(m.main_material || m.finish) && (
                <div>
                  <p className="text-[12px] font-semibold text-muted-foreground tracking-[0.06em] uppercase mb-3">{ar ? "الخامات" : "Materials"}</p>
                  <div className="flex flex-wrap gap-2">
                    {m.main_material && <span className="text-[12px] px-3 py-1.5 rounded-lg bg-muted/30 border border-border/30">{m.main_material}</span>}
                    {m.secondary_material && <span className="text-[12px] px-3 py-1.5 rounded-lg bg-muted/30 border border-border/30">{m.secondary_material}</span>}
                    {m.finish && <span className="text-[12px] px-3 py-1.5 rounded-lg bg-muted/30 border border-border/30">{m.finish}</span>}
                    {m.paint && <span className="text-[12px] px-3 py-1.5 rounded-lg bg-muted/30 border border-border/30">{m.paint}</span>}
                    {m.hardware && <span className="text-[12px] px-3 py-1.5 rounded-lg bg-muted/30 border border-border/30">{m.hardware}</span>}
                  </div>
                </div>
              )}
              {/* Warnings */}
              {warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                  <p className="text-[12px] font-semibold text-amber-700 flex items-center gap-1"><AlertTriangle size={12} /> {ar ? "تنبيهات" : "Warnings"}</p>
                  {warnings.map((w, i) => (
                    <p key={i} className="text-[11px] text-amber-600">{ar ? w.ar : w.en}</p>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ─── BOM ───────────────────────────────── */}
          {tab === "bom" && (
            <motion.div key="bom" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {bom.length === 0 ? (
                <div className="py-12 text-center text-[13px] text-muted-foreground/50">{ar ? "مفيش مكونات لسه" : "No BOM items yet. Edit the product to add materials."}</div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold text-muted-foreground tracking-[0.06em] uppercase px-3 mb-1">
                    <span className="col-span-5">{ar ? "الخامة" : "Material"}</span>
                    <span className="col-span-2">{ar ? "الكمية" : "Qty"}</span>
                    <span className="col-span-2">{ar ? "الوحدة" : "Unit"}</span>
                    <span className="col-span-3 text-right">{ar ? "التكلفة" : "Cost"}</span>
                  </div>
                  {bom.map((line, i) => (
                    <div key={line.id || i} className="grid grid-cols-12 gap-2 items-center px-3 py-2.5 rounded-xl bg-muted/10 border border-border/20 text-[12px]">
                      <span className="col-span-5 font-medium">{line.material || "—"}</span>
                      <span className="col-span-2 tabular-nums">{line.qty}</span>
                      <span className="col-span-2 text-muted-foreground">{line.unit}</span>
                      <span className="col-span-3 text-right font-medium tabular-nums">{Math.round(line.qty * line.costPerUnit).toLocaleString()} {currency}</span>
                    </div>
                  ))}
                  <div className="flex justify-end pt-3 border-t border-border/30">
                    <span className="text-[13px] font-semibold tabular-nums">{ar ? "إجمالي الخامات:" : "Total Materials:"} {Math.round(costInfo.materialCost).toLocaleString()} {currency}</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ─── Manufacturing ─────────────────────── */}
          {tab === "manufacturing" && (
            <motion.div key="mfg" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {stages.length === 0 ? (
                <div className="py-12 text-center text-[13px] text-muted-foreground/50">{ar ? "مفيش مراحل تصنيع" : "No manufacturing stages defined."}</div>
              ) : (
                <VisualStages stages={stages} ar={ar} currency={currency} />
              )}
            </motion.div>
          )}

          {/* ─── Cost ──────────────────────────────── */}
          {tab === "cost" && (
            <motion.div key="cost" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-[13px] font-semibold mb-2">{ar ? "تحليل التكلفة" : "Cost Breakdown"}</p>
                  {[
                    { label: ar ? "تكلفة الخامات" : "Material Cost", value: costInfo.materialCost },
                    { label: ar ? "تكلفة العمالة" : "Labor Cost", value: costInfo.stageCosts.laborTotal },
                    { label: ar ? "تكلفة الماكينات" : "Machine Cost", value: costInfo.stageCosts.machineTotal },
                    { label: ar ? "هالك الخامات" : "Material Waste", value: costInfo.stageCosts.wasteTotal },
                    { label: ar ? "تكاليف غير مباشرة" : "Overhead", value: costInfo.stageCosts.overheadTotal },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between text-[12px] bg-muted/20 rounded-lg px-3 py-2">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-medium tabular-nums">{Math.round(row.value).toLocaleString()} {currency}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-[13px] font-semibold border-t border-border/40 pt-2 px-3">
                    <span>{ar ? "إجمالي التكلفة" : "Total Cost"}</span>
                    <span className="tabular-nums">{Math.round(costInfo.totalCost).toLocaleString()} {currency}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  {m.suggested_price && m.suggested_price > 0 && (
                    <div className="bg-muted/20 rounded-xl p-4">
                      <p className="text-[11px] text-muted-foreground mb-1">{ar ? "سعر البيع" : "Selling Price"}</p>
                      <p className="text-[22px] font-medium tabular-nums">{m.suggested_price.toLocaleString()} {currency}</p>
                    </div>
                  )}
                  {m.suggested_price && m.suggested_price > 0 && costInfo.totalCost > 0 && (
                    <div className="bg-muted/20 rounded-xl p-4">
                      <p className="text-[11px] text-muted-foreground mb-1">{ar ? "هامش الربح" : "Profit Margin"}</p>
                      <p className={`text-[22px] font-medium tabular-nums ${(m.suggested_price - costInfo.totalCost) >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                        {Math.round(((m.suggested_price - costInfo.totalCost) / m.suggested_price) * 100)}%
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">{ar ? "صافي الربح:" : "Profit:"} {Math.round(m.suggested_price - costInfo.totalCost).toLocaleString()} {currency}</p>
                    </div>
                  )}
                  <div className="bg-muted/20 rounded-xl p-4">
                    <p className="text-[11px] text-muted-foreground mb-1">{ar ? "مدة التصنيع" : "Manufacturing Time"}</p>
                    <p className="text-[22px] font-medium tabular-nums">{timeInfo.totalDays} {ar ? "يوم" : "days"}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── Edit ──────────────────────────────── */}
          {tab === "edit" && (
            <motion.div key="edit" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
              {/* Basic fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{ar ? "اسم المنتج" : "Product Name"}</label>
                  <input value={editName} onChange={e => setEditName(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{ar ? "الاسم بالعربي" : "Name (Arabic)"}</label>
                  <input value={editNameAr} onChange={e => setEditNameAr(e.target.value)} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>SKU</label>
                  <input value={editSku} onChange={e => setEditSku(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{ar ? "الفئة" : "Category"}</label>
                  <select value={editCategory} onChange={e => setEditCategory(e.target.value)} className={inputCls + " appearance-none"}>
                    <option value="">{ar ? "اختر..." : "Select..."}</option>
                    {PRODUCT_CATEGORIES.map(c => <option key={c.en} value={c.en}>{ar ? c.ar : c.en}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{ar ? "الأولوية" : "Priority"}</label>
                  <select value={editPriority} onChange={e => setEditPriority(e.target.value as Priority)} className={inputCls + " appearance-none"}>
                    {PRIORITIES.map(p => <option key={p.value} value={p.value}>{ar ? p.ar : p.en}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>{ar ? "الوصف" : "Description"}</label>
                <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={2} className={inputCls + " h-auto py-2"} />
              </div>
              {/* Dimensions */}
              <div className="grid grid-cols-3 gap-4">
                <div><label className={labelCls}>{ar ? "العرض (سم)" : "Width (cm)"}</label><input type="number" value={editWidth} onChange={e => setEditWidth(e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>{ar ? "الارتفاع (سم)" : "Height (cm)"}</label><input type="number" value={editHeight} onChange={e => setEditHeight(e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>{ar ? "العمق (سم)" : "Depth (cm)"}</label><input type="number" value={editDepth} onChange={e => setEditDepth(e.target.value)} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>{ar ? "الخامة الأساسية" : "Main Material"}</label>
                  <select value={editMainMaterial} onChange={e => setEditMainMaterial(e.target.value)} className={inputCls + " appearance-none"}>
                    <option value="">{ar ? "اختر..." : "Select..."}</option>
                    {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{ar ? "التشطيب" : "Finish"}</label>
                  <select value={editFinish} onChange={e => setEditFinish(e.target.value)} className={inputCls + " appearance-none"}>
                    <option value="">{ar ? "اختر..." : "Select..."}</option>
                    {FINISHES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{ar ? "سعر البيع" : "Selling Price"}</label>
                  <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} className={inputCls} />
                </div>
              </div>

              {/* Save */}
              <div className="flex items-center gap-3 pt-4 border-t border-border/30">
                <button onClick={handleSave} disabled={saving || !editName.trim()} className="flex items-center gap-2 h-10 px-6 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 disabled:opacity-50">
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  {ar ? "حفظ التغييرات" : "Save Changes"}
                </button>
                {saveMsg && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[12px] text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={12} /> {saveMsg}
                  </motion.span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete confirmation */}
      <AnimatePresence>
        {showDelete && (
          <DeleteConfirm
            ar={ar}
            name={product.name_en}
            onConfirm={handleDelete}
            onCancel={() => setShowDelete(false)}
            loading={deleting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
