/**
 * Fabrics Inventory — Dedicated fabric management page
 *
 * إدارة الأقمشة — صفحة مخصصة لإدارة مخزون الأقمشة
 * Rich UI with fabric swatches, stock levels, usage analytics
 */

import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { getDataSource } from "../lib/data-source";
import { exportCSV } from "../lib/csv-export";
import { generateCode, peekNextCode, type CodeSettings, loadCodeSettings } from "../lib/code-generator";
import type { Database } from "../lib/database.types";
import {
  Package, Plus, Search, X, Loader2, Download, ArrowLeft,
  ChevronRight, TrendingDown, TrendingUp, AlertTriangle,
  CheckCircle2, Palette, Ruler, Weight, Eye, Edit3, Trash2,
  Archive, BarChart3, Filter, Upload, Sparkles,
} from "lucide-react";
import { ConfirmDeleteModal } from "../components/ConfirmDeleteModal";
import { CsvImport } from "../components/CsvImport";
import { type ImportTemplate } from "../lib/csv-export";

type Resource = Database["public"]["Tables"]["resources"]["Row"];

const inputCls = "w-full h-10 rounded-xl border border-border/60 bg-background px-3.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition placeholder:text-muted-foreground/50";
const selectCls = inputCls + " appearance-none cursor-pointer";
const labelCls = "text-[11px] font-medium text-muted-foreground mb-1 block";
const btnPrimary = "flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-foreground text-background text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50";
const btnSecondary = "inline-flex items-center justify-center gap-1.5 rounded-xl border border-border/60 text-[11px] font-medium px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors";

const FABRIC_CATEGORIES = ["Cotton", "Polyester", "Silk", "Wool", "Linen", "Nylon", "Viscose", "Chiffon", "Satin", "Denim", "Jersey", "Fleece", "Velvet", "Lace", "Leather", "Suede", "Neoprene", "Organza", "Crepe", "Georgette", "Taffeta", "Tulle", "Corduroy", "Tweed", "Spandex", "Mesh"];
const UOMS = ["m", "yard", "roll", "bolt", "kg"];
const FABRIC_STATUSES = [
  { value: "in_stock", en: "In Stock", ar: "متوفر", pill: "bg-emerald-100 text-emerald-700" },
  { value: "low_stock", en: "Low Stock", ar: "كمية قليلة", pill: "bg-amber-100 text-amber-700" },
  { value: "out_of_stock", en: "Out of Stock", ar: "نفذ", pill: "bg-rose-100 text-rose-600" },
];

const FABRIC_COLORS = ["#1a1a1a", "#ffffff", "#f5f5dc", "#8B4513", "#FF6347", "#4169E1", "#228B22", "#FFD700", "#C0C0C0", "#800080", "#FF69B4", "#00CED1", "#FF8C00", "#2F4F4F", "#DC143C"];

interface FabricMeta {
  sku?: string;
  barcode?: string;
  category?: string;
  composition?: string;
  gsm?: number;
  width_cm?: number;
  color?: string;
  pattern?: string;
  supplier?: string;
  brand?: string;
  moq?: number;
  quantity?: number;
  uom?: string;
  unit_cost?: number;
  reorder_level?: number;
  max_level?: number;
  location?: string;
  inv_status?: string;
  notes?: string;
}

function getFabricMeta(r: Resource): FabricMeta {
  const m = (r.metadata ?? {}) as Record<string, unknown>;
  return {
    sku: m.sku as string, barcode: m.barcode as string, category: m.category as string,
    composition: m.composition as string, gsm: m.gsm as number, width_cm: m.width_cm as number,
    color: m.color as string, pattern: m.pattern as string, supplier: m.supplier as string,
    brand: m.brand as string, moq: m.moq as number, quantity: m.quantity as number,
    uom: m.uom as string, unit_cost: m.unit_cost as number, reorder_level: m.reorder_level as number,
    max_level: m.max_level as number, location: m.location as string, inv_status: m.inv_status as string,
    notes: m.notes as string,
  };
}

function computeStatus(qty: number, reorder: number): string {
  if (qty <= 0) return "out_of_stock";
  if (qty <= reorder) return "low_stock";
  return "in_stock";
}

export default function InventoryFabricsPage() {
  const { lang } = useLanguage();
  const { workspace } = useAuth();
  const ar = lang === "ar";
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<Resource | null>(null);
  const [deleteItem, setDeleteItem] = useState<Resource | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [codeSettings] = useState<CodeSettings>(() => loadCodeSettings());

  useEffect(() => {
    loadFabrics();
  }, []);

  const wid = workspace?.id || "demo";

  async function loadFabrics() {
    setLoading(true);
    try {
      const all = await getDataSource().resources.list(wid);
      const fabrics = all.filter(r =>
        (r.type === "inventory" || (r.skills ?? []).includes("fabric")) && (r.skills ?? []).includes("inventory")
      );
      setItems(fabrics);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    return items.filter(r => {
      const meta = getFabricMeta(r);
      if (search) {
        const q = search.toLowerCase();
        if (!r.name_en.toLowerCase().includes(q) && !(meta.sku ?? "").toLowerCase().includes(q) && !(meta.color ?? "").toLowerCase().includes(q) && !(meta.supplier ?? "").toLowerCase().includes(q)) return false;
      }
      if (filterCategory && meta.category !== filterCategory) return false;
      if (filterStatus) {
        const status = computeStatus(meta.quantity ?? 0, meta.reorder_level ?? 0);
        if (status !== filterStatus) return false;
      }
      return true;
    });
  }, [items, search, filterCategory, filterStatus]);

  const stats = useMemo(() => {
    let totalQty = 0, totalValue = 0, lowStock = 0, outOfStock = 0;
    items.forEach(r => {
      const m = getFabricMeta(r);
      totalQty += m.quantity ?? 0;
      totalValue += (m.quantity ?? 0) * (m.unit_cost ?? 0);
      const s = computeStatus(m.quantity ?? 0, m.reorder_level ?? 0);
      if (s === "low_stock") lowStock++;
      if (s === "out_of_stock") outOfStock++;
    });
    return { totalQty, totalValue, lowStock, outOfStock, total: items.length };
  }, [items]);

  const fabricImportTemplate: ImportTemplate = {
    id: "fabrics",
    labelEn: "Fabrics",
    labelAr: "الأقمشة",
    headers: ["name", "sku", "category", "color", "composition", "gsm", "width_cm", "quantity", "uom", "unit_cost", "supplier", "brand", "location"],
    requiredHeaders: ["name", "quantity"],
    mapRow: (r) => ({
      name_en: r.name,
      name_ar: r.name,
      type: "inventory",
      skills: ["inventory", "fabric"],
      metadata: {
        sku: r.sku || generateCode("fabric", codeSettings),
        category: r.category || "",
        color: r.color || "",
        composition: r.composition || "",
        gsm: parseFloat(r.gsm) || null,
        width_cm: parseFloat(r.width_cm) || null,
        quantity: parseFloat(r.quantity) || 0,
        uom: r.uom || "m",
        unit_cost: parseFloat(r.unit_cost) || 0,
        supplier: r.supplier || "",
        brand: r.brand || "",
        location: r.location || "",
        reorder_level: 0,
        inv_status: "in_stock",
      },
    }),
  };

  async function handleDelete() {
    if (!deleteItem) return;
    await getDataSource().resources.remove(wid, deleteItem.id);
    setItems(prev => prev.filter(i => i.id !== deleteItem.id));
    setDeleteItem(null);
  }

  function handleSaved(r: Resource) {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === r.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = r; return next; }
      return [r, ...prev];
    });
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[1200px] mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Link href="/inventory" className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-muted transition-colors">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1 className="text-[22px] font-semibold flex items-center gap-2.5" style={{ fontFamily: "var(--app-font-serif)" }}>
                <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                  <Palette size={16} className="text-violet-600" />
                </div>
                {ar ? "الأقمشة" : "Fabrics"}
              </h1>
              <p className="text-[13px] text-muted-foreground mt-1 ml-[46px]">
                {ar ? `${items.length} نوع قماش` : `${items.length} fabric types`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowImport(true)} className={btnSecondary}><Upload size={13} />{ar ? "استيراد" : "Import"}</button>
            <button onClick={() => exportCSV(items.map(r => { const m = getFabricMeta(r); return { Name: r.name_en, SKU: m.sku, Category: m.category, Color: m.color, Quantity: m.quantity, UoM: m.uom, Cost: m.unit_cost, Supplier: m.supplier, Location: m.location }; }), "fabrics-export")} className={btnSecondary}><Download size={13} />{ar ? "تصدير" : "Export"}</button>
            <button onClick={() => setShowCreate(true)} className={btnPrimary}><Plus size={14} />{ar ? "إضافة قماش" : "Add Fabric"}</button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: ar ? "إجمالي الأنواع" : "Total Types", value: stats.total, icon: Package, color: "bg-violet-100 text-violet-600" },
            { label: ar ? "الكمية الإجمالية" : "Total Stock", value: `${stats.totalQty.toLocaleString()} m`, icon: Ruler, color: "bg-blue-100 text-blue-600" },
            { label: ar ? "كمية قليلة" : "Low Stock", value: stats.lowStock, icon: AlertTriangle, color: "bg-amber-100 text-amber-700" },
            { label: ar ? "القيمة الإجمالية" : "Total Value", value: stats.totalValue.toLocaleString(), icon: TrendingUp, color: "bg-emerald-100 text-emerald-700" },
          ].map((s, i) => (
            <div key={i} className="p-4 rounded-xl border border-border/40 bg-background">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${s.color}`}><s.icon size={13} /></div>
                <span className="text-[11px] text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-[18px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-[300px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={ar ? "بحث في الأقمشة..." : "Search fabrics..."} className={inputCls + " h-9 pl-9 text-[12px]"} />
          </div>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className={selectCls + " h-9 w-[160px] text-[12px]"}>
            <option value="">{ar ? "كل الفئات" : "All Categories"}</option>
            {FABRIC_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selectCls + " h-9 w-[140px] text-[12px]"}>
            <option value="">{ar ? "كل الحالات" : "All Statuses"}</option>
            {FABRIC_STATUSES.map(s => <option key={s.value} value={s.value}>{ar ? s.ar : s.en}</option>)}
          </select>
        </div>

        {/* Fabric Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={20} className="animate-spin text-muted-foreground/40" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Package size={32} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-[14px] text-muted-foreground">{ar ? "لا توجد أقمشة" : "No fabrics found"}</p>
            <p className="text-[12px] text-muted-foreground/60 mt-1">{ar ? "اضغط 'إضافة قماش' لبدء الإضافة" : "Click 'Add Fabric' to get started"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(r => {
              const m = getFabricMeta(r);
              const status = computeStatus(m.quantity ?? 0, m.reorder_level ?? 0);
              const statusDef = FABRIC_STATUSES.find(s => s.value === status);
              const stockPct = m.max_level ? Math.min(((m.quantity ?? 0) / m.max_level) * 100, 100) : 0;

              return (
                <div key={r.id} className="group p-4 rounded-xl border border-border/40 bg-background hover:border-border/60 hover:shadow-sm transition-all cursor-pointer" onClick={() => setEditItem(r)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      {m.color && (
                        <div className="w-8 h-8 rounded-lg border border-border/30" style={{ backgroundColor: m.color }} />
                      )}
                      <div>
                        <p className="text-[13px] font-medium leading-tight">{r.name_en}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{m.sku || "No SKU"}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusDef?.pill || ""}`}>{ar ? statusDef?.ar : statusDef?.en}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[10px] mb-3">
                    <div><span className="text-muted-foreground">{ar ? "الفئة" : "Category"}</span><p className="font-medium">{m.category || "-"}</p></div>
                    <div><span className="text-muted-foreground">{ar ? "العرض" : "Width"}</span><p className="font-medium">{m.width_cm ? `${m.width_cm} cm` : "-"}</p></div>
                    <div><span className="text-muted-foreground">{ar ? "GSM" : "GSM"}</span><p className="font-medium">{m.gsm || "-"}</p></div>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <div>
                      <span className="text-muted-foreground">{ar ? "المخزون" : "Stock"}</span>
                      <span className="ml-1 font-medium">{m.quantity ?? 0} {m.uom || "m"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={e => { e.stopPropagation(); setEditItem(r); }} className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"><Edit3 size={11} /></button>
                      <button onClick={e => { e.stopPropagation(); setDeleteItem(r); }} className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-rose-50 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={11} /></button>
                    </div>
                  </div>

                  {m.max_level ? (
                    <div className="mt-2 h-1.5 rounded-full bg-muted/60 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${stockPct}%`, backgroundColor: status === "out_of_stock" ? "#ef4444" : status === "low_stock" ? "#f59e0b" : "#10b981" }} />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit */}
      {(showCreate || editItem) && (
        <FabricModal
          initial={editItem ?? undefined}
          nextSku={peekNextCode("fabric", codeSettings)}
          ar={ar}
          wid={wid}
          onClose={() => { setShowCreate(false); setEditItem(null); }}
          onSaved={handleSaved}
        />
      )}

      {/* Import Dialog */}
      {showImport && (
        <CsvImport open={showImport} onClose={() => setShowImport(false)} template={fabricImportTemplate} adapter={getDataSource().resources} ar={ar} onComplete={() => { setShowImport(false); loadFabrics(); }} />
      )}

      {/* Delete Confirmation */}
      {deleteItem && (
        <ConfirmDeleteModal open onConfirm={handleDelete} onCancel={() => setDeleteItem(null)} ar={ar} title={ar ? "حذف القماش" : "Delete Fabric"} itemName={deleteItem.name_en} />
      )}
    </div>
  );
}

// ─── Create / Edit Fabric modal ──────────────────────────

function FabricModal({ initial, nextSku, ar, wid, onClose, onSaved }: {
  initial?: Resource; nextSku: string; ar: boolean; wid: string;
  onClose: () => void; onSaved: (r: Resource) => void;
}) {
  const m = initial ? getFabricMeta(initial) : undefined;
  const [form, setForm] = useState({
    name: initial?.name_en ?? "",
    sku: m?.sku ?? nextSku,
    category: m?.category ?? FABRIC_CATEGORIES[0],
    color: m?.color ?? "",
    composition: m?.composition ?? "",
    gsm: m?.gsm?.toString() ?? "",
    width_cm: m?.width_cm?.toString() ?? "",
    quantity: m?.quantity?.toString() ?? "",
    uom: m?.uom ?? "m",
    unit_cost: m?.unit_cost?.toString() ?? "",
    reorder_level: m?.reorder_level?.toString() ?? "",
    supplier: m?.supplier ?? "",
    location: m?.location ?? "",
    notes: m?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const qty = parseFloat(form.quantity) || 0;
      const reorder = parseFloat(form.reorder_level) || 0;
      const metadata = {
        sku: form.sku || generateCode("fabric"),
        category: form.category, color: form.color, composition: form.composition,
        gsm: parseFloat(form.gsm) || null, width_cm: parseFloat(form.width_cm) || null,
        quantity: qty, uom: form.uom, unit_cost: parseFloat(form.unit_cost) || 0,
        reorder_level: reorder, supplier: form.supplier, location: form.location,
        notes: form.notes, inv_status: computeStatus(qty, reorder),
      };
      const payload = { name_en: form.name.trim(), name_ar: form.name.trim(), type: "inventory", skills: ["inventory", "fabric"], metadata: metadata as Resource["metadata"] };
      const ds = getDataSource();
      if (initial) {
        await ds.resources.update(wid, initial.id, payload);
        onSaved({ ...initial, ...payload } as Resource);
      } else {
        const created = await ds.resources.create(wid, payload);
        onSaved((created ?? { ...payload, id: `demo-${Date.now()}` }) as Resource);
      }
      onClose();
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-background rounded-2xl border border-border/60 shadow-xl w-full max-w-[560px] max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-background/95 backdrop-blur px-6 py-4 border-b border-border/40 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>{initial ? (ar ? "تعديل القماش" : "Edit Fabric") : (ar ? "إضافة قماش" : "Add Fabric")}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted"><X size={15} /></button>
        </div>
        <form onSubmit={submit} className="p-6 grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className={labelCls}>{ar ? "الاسم" : "Name"} <span className="text-rose-400">*</span></label>
            <input value={form.name} onChange={e => set("name", e.target.value)} autoFocus className={inputCls} placeholder={ar ? "مثال: قطن مصري" : "e.g. Egyptian Cotton"} /></div>
          <div><label className={labelCls}>SKU</label><input value={form.sku} onChange={e => set("sku", e.target.value)} className={inputCls + " font-mono"} /></div>
          <div><label className={labelCls}>{ar ? "الفئة" : "Category"}</label>
            <select value={form.category} onChange={e => set("category", e.target.value)} className={selectCls}>{FABRIC_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          <div><label className={labelCls}>{ar ? "اللون" : "Color"}</label>
            <div className="flex gap-1.5 items-center">
              <input value={form.color} onChange={e => set("color", e.target.value)} className={inputCls} placeholder="#1a1a1a" />
              {form.color && <span className="w-9 h-9 rounded-lg border border-border/40 shrink-0" style={{ background: form.color }} />}
            </div></div>
          <div><label className={labelCls}>{ar ? "التركيب" : "Composition"}</label><input value={form.composition} onChange={e => set("composition", e.target.value)} className={inputCls} placeholder="100% Cotton" /></div>
          <div><label className={labelCls}>GSM</label><input type="number" value={form.gsm} onChange={e => set("gsm", e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>{ar ? "العرض (سم)" : "Width (cm)"}</label><input type="number" value={form.width_cm} onChange={e => set("width_cm", e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>{ar ? "الكمية" : "Quantity"}</label><input type="number" value={form.quantity} onChange={e => set("quantity", e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>{ar ? "الوحدة" : "Unit"}</label>
            <select value={form.uom} onChange={e => set("uom", e.target.value)} className={selectCls}>{UOMS.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
          <div><label className={labelCls}>{ar ? "سعر الوحدة" : "Unit Cost"}</label><input type="number" value={form.unit_cost} onChange={e => set("unit_cost", e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>{ar ? "حد إعادة الطلب" : "Reorder Level"}</label><input type="number" value={form.reorder_level} onChange={e => set("reorder_level", e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>{ar ? "المورّد" : "Supplier"}</label><input value={form.supplier} onChange={e => set("supplier", e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>{ar ? "الموقع" : "Location"}</label><input value={form.location} onChange={e => set("location", e.target.value)} className={inputCls} /></div>
          <div className="col-span-2 flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className={btnSecondary}>{ar ? "إلغاء" : "Cancel"}</button>
            <button type="submit" disabled={saving} className={btnPrimary}>{saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}{initial ? (ar ? "حفظ" : "Save") : (ar ? "إضافة" : "Add Fabric")}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
