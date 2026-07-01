/**
 * Product Catalog — Connected Fashion Engine
 *
 * المنتجات · كتالوج المنتجات مع ويزارد 6 خطوات
 * 6-Step Product Creation Wizard:
 *   1. Basic Info  2. Dimensions  3. Materials & BOM  4. Manufacturing Stages  5. Stage Dependencies  6. Cost & Review
 */

import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { isDemoMode } from "../lib/supabase";
import { getDataSource } from "../lib/data-source";
import { maybePushProductsToShopify } from "../lib/shopify-push";
import { exportCSV, IMPORT_TEMPLATES } from "../lib/csv-export";
import { CsvImport } from "../components/CsvImport";
import type { Database } from "../lib/database.types";
import {
  Package, Plus, Search, X, Loader2, AlertCircle, Download, Upload,
  ChevronRight, ChevronLeft, Layers, Ruler, DollarSign,
  CheckCircle2, AlertTriangle, ListTree, Wrench,
  Trash2, GripVertical, ArrowRight, Info, Clock,
  Scissors, Box, Paintbrush, ClipboardCheck, Truck as TruckIcon,
  Sparkles, FileText, Copy, ToggleLeft, Image, Edit3, ExternalLink,
} from "lucide-react";

const PRODUCTS_IMPORT = IMPORT_TEMPLATES.find((t) => t.id === "products")!;
import {
  type MfgStage, type BOMLine, type ProductMeta, type Priority, type DependencyType,
  type ProductTemplate,
  PRODUCT_CATEGORIES, MATERIALS, FINISHES, BOM_UNITS, DEPARTMENTS, PRIORITIES,
  defaultDressStages, defaultGarmentStages,
  calculateTotalCost, calculateCriticalPath, getProductWarnings, uid,
  PRODUCT_TEMPLATES,
} from "../lib/furniture-engine";
import VisualStages from "../components/VisualStages";
import ProductTemplatesStudio from "../components/ProductTemplatesStudio";

type Resource = Database["public"]["Tables"]["resources"]["Row"];

function getPM(r: Resource): ProductMeta {
  return (r.metadata ?? {}) as ProductMeta;
}

// ─── Shared CSS ──────────────────────────────────────────

const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium px-5 hover:opacity-90 transition-opacity disabled:opacity-40";
const inputCls = "w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20";
const labelCls = "text-[11.5px] text-muted-foreground font-medium mb-1 block";
const smallInput = "w-full h-8 px-2.5 rounded-lg border border-border/50 bg-background text-[12px] focus:outline-none focus:ring-1 focus:ring-primary/20";

// ─── Wizard Steps ────────────────────────────────────────

const WIZARD_STEPS = [
  { en: "Basic Info",       ar: "المعلومات الأساسية", icon: Package },
  { en: "Dimensions",       ar: "الأبعاد",            icon: Ruler },
  { en: "Materials & BOM",  ar: "الخامات والمكونات",  icon: Layers },
  { en: "Mfg Stages",       ar: "مراحل التصنيع",      icon: Wrench },
  { en: "Dependencies",     ar: "التبعيات",           icon: ArrowRight },
  { en: "Cost & Review",    ar: "التكلفة والمراجعة",  icon: DollarSign },
];

// ─── Product Wizard ──────────────────────────────────────

function ProductWizard({ ar, currency, onClose, onAdd, initialTemplate }: {
  ar: boolean; currency: string;
  onClose: () => void;
  onAdd: (r: Resource) => void;
  initialTemplate?: ProductTemplate | null;
}) {
  const { workspace } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fromTemplate, setFromTemplate] = useState<string | null>(initialTemplate?.key ?? null);

  // Step 1: Basic Info — pre-populate from template if provided
  const [name, setName] = useState(initialTemplate?.en ?? "");
  const [nameAr, setNameAr] = useState(initialTemplate?.ar ?? "");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState(initialTemplate?.category ?? "");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");

  // Step 2: Dimensions
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [depth, setDepth] = useState("");
  const [thickness, setThickness] = useState("");
  const [weight, setWeight] = useState("");

  // Step 3: Materials & BOM — pre-populate from template
  const [mainMaterial, setMainMaterial] = useState("");
  const [secondaryMaterial, setSecondaryMaterial] = useState("");
  const [finish, setFinish] = useState("");
  const [paint, setPaint] = useState("");
  const [hardware, setHardware] = useState("");
  const [edgeBanding, setEdgeBanding] = useState("");
  const [bom, setBom] = useState<BOMLine[]>(
    initialTemplate?.suggestedBOM?.map(b => ({ ...b, id: uid() })) ?? []
  );

  // Step 4: Stages — pre-populate from template
  const [stages, setStages] = useState<MfgStage[]>(
    initialTemplate?.stages ? initialTemplate.stages() : []
  );

  // Step 6: Price
  const [suggestedPrice, setSuggestedPrice] = useState("");

  // Calculations
  const bomCost = useMemo(() => bom.reduce((s, l) => s + l.qty * l.costPerUnit, 0), [bom]);
  const costInfo = useMemo(() => calculateTotalCost(bom, stages), [bom, stages]);
  const timeInfo = useMemo(() => calculateCriticalPath(stages), [stages]);

  function addBOMLine() {
    setBom(prev => [...prev, { id: uid(), material: "", qty: 1, unit: "pcs", costPerUnit: 0 }]);
  }
  function removeBOM(i: number) { setBom(prev => prev.filter((_, idx) => idx !== i)); }
  function updateBOM(i: number, line: BOMLine) { setBom(prev => prev.map((l, idx) => idx === i ? line : l)); }

  function addStage() {
    const order = stages.length + 1;
    const lastId = stages.length ? stages[stages.length - 1].id : undefined;
    setStages(prev => [...prev, {
      id: uid(), name: "", name_ar: "", order, department: "cutting",
      duration_hours: 2, labor_cost: 0, machine_cost: 0, material_waste_pct: 0,
      overhead_cost: 0, dependency_type: "sequential" as DependencyType,
      depends_on: lastId ? [lastId] : [], checklist: [], notes: "",
    }]);
  }
  function removeStage(i: number) {
    const removed = stages[i];
    setStages(prev => prev.filter((_, idx) => idx !== i).map((s, idx) => ({
      ...s,
      order: idx + 1,
      depends_on: s.depends_on.filter(d => d !== removed.id),
    })));
  }
  function updateStage(i: number, s: MfgStage) { setStages(prev => prev.map((st, idx) => idx === i ? s : st)); }

  function loadDressTemplate() { setStages(defaultDressStages()); }
  function loadGeneralTemplate() { setStages(defaultGarmentStages()); }

  function canGoNext(): boolean {
    if (step === 0) return !!name.trim();
    return true;
  }

  async function handleSubmit() {
    if (!workspace?.id && !isDemoMode) return;
    setLoading(true);
    setError("");
    try {
      const meta: ProductMeta = {
        product_type: "product", sku, category, description,
        active: true, priority,
        width: parseFloat(width) || undefined, height: parseFloat(height) || undefined,
        depth: parseFloat(depth) || undefined, thickness: parseFloat(thickness) || undefined,
        weight: parseFloat(weight) || undefined,
        main_material: mainMaterial, secondary_material: secondaryMaterial,
        finish, paint, hardware, edge_banding: edgeBanding,
        bom, stages,
        material_cost: costInfo.materialCost,
        labor_cost: costInfo.stageCosts.laborTotal,
        machine_cost: costInfo.stageCosts.machineTotal,
        overhead_cost: costInfo.stageCosts.overheadTotal,
        total_cost: costInfo.totalCost,
        suggested_price: parseFloat(suggestedPrice) || undefined,
      };
      const res = await getDataSource().resources.create(workspace?.id || "demo", {
        workspace_id: workspace?.id || "demo",
        name_en: name, name_ar: nameAr || null,
        type: "product", skills: ["product"],
        metadata: meta as any,
      } as any);
      if (res) { void maybePushProductsToShopify(workspace?.id || ""); onAdd(res); onClose(); }
      else setError(ar ? "حصل خطأ" : "Failed to create product");
    } catch { setError(ar ? "حصل خطأ" : "Error creating product"); }
    setLoading(false);
  }

  // ─── Warnings ──────────────────────────────────────────
  const warnings = useMemo(() => {
    const meta: ProductMeta = { bom, stages, suggested_price: parseFloat(suggestedPrice) || undefined };
    return getProductWarnings(meta);
  }, [bom, stages, suggestedPrice]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
        className="relative bg-background border border-border/40 rounded-2xl shadow-2xl w-full max-w-[800px] max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-border/40 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-[18px] font-medium" style={{ fontFamily: "var(--app-font-serif)" }}>
                {ar ? "منتج جديد — ويزارد التصنيع" : "New Product — Manufacturing Wizard"}
              </h2>
              {fromTemplate && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold"
                >
                  <Sparkles size={10} />
                  {ar ? "من قالب" : "From Template"}
                </motion.span>
              )}
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted"><X size={16} /></button>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-1">
            {WIZARD_STEPS.map((s, i) => {
              const Icon = s.icon;
              const active = i === step;
              const done = i < step;
              return (
                <button key={i} onClick={() => { if (i < step || (i === step + 1 && canGoNext())) setStep(i); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${active ? "bg-primary text-primary-foreground" : done ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"}`}>
                  {done ? <CheckCircle2 size={12} /> : <Icon size={12} />}
                  <span className="hidden md:inline">{ar ? s.ar : s.en}</span>
                </button>
              );
            })}
          </div>

          {/* ─── Live Cost Bar ─── */}
          {(bom.length > 0 || stages.length > 0) && step < 5 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 flex items-center gap-4 px-4 py-2.5 rounded-xl bg-muted/30 border border-border/20 overflow-hidden"
            >
              <DollarSign size={12} className="text-primary shrink-0" />
              <div className="flex items-center gap-4 flex-1 text-[10.5px] overflow-x-auto">
                {bomCost > 0 && (
                  <span className="text-muted-foreground whitespace-nowrap">
                    {ar ? "خامات" : "Materials"}: <span className="font-medium text-foreground tabular-nums">{Math.round(bomCost).toLocaleString()}</span>
                  </span>
                )}
                {costInfo.stageCosts.laborTotal > 0 && (
                  <span className="text-muted-foreground whitespace-nowrap">
                    {ar ? "عمالة" : "Labor"}: <span className="font-medium text-foreground tabular-nums">{Math.round(costInfo.stageCosts.laborTotal).toLocaleString()}</span>
                  </span>
                )}
                {costInfo.stageCosts.machineTotal > 0 && (
                  <span className="text-muted-foreground whitespace-nowrap">
                    {ar ? "ماكينات" : "Machine"}: <span className="font-medium text-foreground tabular-nums">{Math.round(costInfo.stageCosts.machineTotal).toLocaleString()}</span>
                  </span>
                )}
              </div>
              <div className="shrink-0 text-right">
                <span className="text-[10px] text-muted-foreground">{ar ? "الإجمالي" : "Total"}</span>
                <motion.p
                  key={costInfo.totalCost}
                  initial={{ scale: 1.15, color: "hsl(var(--primary))" }}
                  animate={{ scale: 1, color: "hsl(var(--foreground))" }}
                  className="text-[13px] font-semibold tabular-nums leading-tight"
                >
                  {Math.round(costInfo.totalCost).toLocaleString()} {currency}
                </motion.p>
              </div>
              {parseFloat(suggestedPrice) > 0 && costInfo.totalCost > 0 && (
                <div className="shrink-0 pl-3 border-l border-border/30 text-right">
                  <span className="text-[10px] text-muted-foreground">{ar ? "هامش" : "Margin"}</span>
                  <p className={`text-[13px] font-semibold tabular-nums leading-tight ${
                    (parseFloat(suggestedPrice) - costInfo.totalCost) >= 0 ? "text-emerald-600" : "text-rose-500"
                  }`}>
                    {Math.round(((parseFloat(suggestedPrice) - costInfo.totalCost) / parseFloat(suggestedPrice)) * 100)}%
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto px-6 py-5 space-y-4">

          {/* Step 0: Basic Info */}
          {step === 0 && (
            <>
              {/* Template info banner */}
              {fromTemplate && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/15 mb-2"
                >
                  <Sparkles size={14} className="text-primary shrink-0" />
                  <p className="text-[12px] text-primary/80 flex-1">
                    {ar
                      ? `تم تحميل القالب "${name}" — عدّل البيانات حسب احتياجك`
                      : `Loaded from "${name}" template — customize the details below`}
                  </p>
                  <span className="text-[10px] text-primary/50 tabular-nums">
                    {bom.length} BOM · {stages.length} stages
                  </span>
                </motion.div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{ar ? "اسم المنتج (English)" : "Product Name (English)"} *</label>
                  <input value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="e.g. Kitchen Unit - L Shape" />
                </div>
                <div>
                  <label className={labelCls}>{ar ? "الاسم بالعربي" : "Name (Arabic)"}</label>
                  <input value={nameAr} onChange={e => setNameAr(e.target.value)} className={inputCls} placeholder="مثال: مطبخ حرف L" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>{ar ? "كود المنتج (SKU)" : "SKU"}</label>
                  <input value={sku} onChange={e => setSku(e.target.value)} className={inputCls} placeholder="KIT-001" />
                </div>
                <div>
                  <label className={labelCls}>{ar ? "الفئة" : "Category"}</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className={inputCls + " appearance-none cursor-pointer"}>
                    <option value="">{ar ? "اختر..." : "Select..."}</option>
                    {PRODUCT_CATEGORIES.map(c => <option key={c.en} value={c.en}>{ar ? c.ar : c.en}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{ar ? "الأولوية" : "Priority"}</label>
                  <select value={priority} onChange={e => setPriority(e.target.value as Priority)} className={inputCls + " appearance-none cursor-pointer"}>
                    {PRIORITIES.map(p => <option key={p.value} value={p.value}>{ar ? p.ar : p.en}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>{ar ? "وصف" : "Description"}</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={inputCls + " h-auto py-2"} placeholder={ar ? "وصف المنتج..." : "Product description..."} />
              </div>
            </>
          )}

          {/* Step 1: Dimensions */}
          {step === 1 && (
            <>
              <p className="text-[12px] text-muted-foreground">{ar ? "أبعاد المنتج النهائي (بالسنتيمتر)" : "Final product dimensions (cm)"}</p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { val: width, set: setWidth, en: "Width (العرض)", ar: "العرض" },
                  { val: height, set: setHeight, en: "Height (الارتفاع)", ar: "الارتفاع" },
                  { val: depth, set: setDepth, en: "Depth (العمق)", ar: "العمق" },
                ].map(d => (
                  <div key={d.en}>
                    <label className={labelCls}>{ar ? d.ar : d.en}</label>
                    <input type="number" value={d.val} onChange={e => d.set(e.target.value)} min={0} className={inputCls} placeholder="cm" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{ar ? "السُمك" : "Thickness (cm)"}</label>
                  <input type="number" value={thickness} onChange={e => setThickness(e.target.value)} min={0} className={inputCls} placeholder="cm" />
                </div>
                <div>
                  <label className={labelCls}>{ar ? "الوزن التقريبي (كجم)" : "Estimated Weight (kg)"}</label>
                  <input type="number" value={weight} onChange={e => setWeight(e.target.value)} min={0} className={inputCls} placeholder="kg" />
                </div>
              </div>
              {width && height && (
                <div className="bg-muted/30 rounded-xl p-4 text-[12px] text-muted-foreground">
                  {ar ? "المساحة التقريبية:" : "Approx. area:"} {((parseFloat(width) || 0) * (parseFloat(height) || 0) / 10000).toFixed(2)} m²
                  {depth && ` · ${ar ? "الحجم:" : "Volume:"} ${((parseFloat(width) || 0) * (parseFloat(height) || 0) * (parseFloat(depth) || 0) / 1000000).toFixed(3)} m³`}
                </div>
              )}
            </>
          )}

          {/* Step 2: Materials & BOM */}
          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{ar ? "الخامة الأساسية" : "Main Material"}</label>
                  <select value={mainMaterial} onChange={e => setMainMaterial(e.target.value)} className={inputCls + " appearance-none cursor-pointer"}>
                    <option value="">{ar ? "اختر..." : "Select..."}</option>
                    {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{ar ? "خامة ثانوية" : "Secondary Material"}</label>
                  <select value={secondaryMaterial} onChange={e => setSecondaryMaterial(e.target.value)} className={inputCls + " appearance-none cursor-pointer"}>
                    <option value="">{ar ? "اختياري..." : "Optional..."}</option>
                    {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>{ar ? "التشطيب" : "Finish"}</label>
                  <select value={finish} onChange={e => setFinish(e.target.value)} className={inputCls + " appearance-none cursor-pointer"}>
                    <option value="">{ar ? "اختر..." : "Select..."}</option>
                    {FINISHES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{ar ? "الدهان" : "Paint/Color"}</label>
                  <input value={paint} onChange={e => setPaint(e.target.value)} className={inputCls} placeholder={ar ? "اللون..." : "Color..."} />
                </div>
                <div>
                  <label className={labelCls}>{ar ? "العِدد / الهاردوير" : "Hardware"}</label>
                  <input value={hardware} onChange={e => setHardware(e.target.value)} className={inputCls} placeholder={ar ? "مفصلات، مجاري..." : "Hinges, slides..."} />
                </div>
              </div>
              <div>
                <label className={labelCls}>{ar ? "الكنار" : "Edge Banding"}</label>
                <input value={edgeBanding} onChange={e => setEdgeBanding(e.target.value)} className={inputCls} placeholder={ar ? "نوع الكنار..." : "Edge banding type..."} />
              </div>

              {/* BOM */}
              <div className="border-t border-border/30 pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[13px] font-medium">{ar ? "مكونات المنتج (BOM)" : "Bill of Materials (BOM)"}</p>
                  <button type="button" onClick={addBOMLine} className="flex items-center gap-1 text-[11px] text-primary font-medium hover:opacity-70"><Plus size={12} /> {ar ? "خامة" : "Add Line"}</button>
                </div>
                {bom.length === 0 ? (
                  <div className="py-8 text-center text-[12px] text-muted-foreground/50 border border-dashed border-border/40 rounded-xl">
                    {ar ? "مفيش مكونات لسه. ضيف أول خامة." : "No BOM lines yet. Add your first material."}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {bom.map((line, i) => (
                      <div key={line.id} className="grid grid-cols-12 gap-2 items-end border border-border/30 rounded-lg p-2.5 bg-muted/10">
                        <div className="col-span-4">
                          <span className="text-[9px] text-muted-foreground">{ar ? "الخامة" : "Material"}</span>
                          <input value={line.material} onChange={e => updateBOM(i, { ...line, material: e.target.value })} className={smallInput} placeholder={ar ? "MDF 18mm" : "e.g. MDF 18mm"} />
                        </div>
                        <div className="col-span-2">
                          <span className="text-[9px] text-muted-foreground">{ar ? "الكمية" : "Qty"}</span>
                          <input type="number" value={line.qty} onChange={e => updateBOM(i, { ...line, qty: parseFloat(e.target.value) || 0 })} min={0} className={smallInput} />
                        </div>
                        <div className="col-span-2">
                          <span className="text-[9px] text-muted-foreground">{ar ? "الوحدة" : "Unit"}</span>
                          <select value={line.unit} onChange={e => updateBOM(i, { ...line, unit: e.target.value })} className={smallInput + " appearance-none cursor-pointer"}>
                            {BOM_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </div>
                        <div className="col-span-3">
                          <span className="text-[9px] text-muted-foreground">{ar ? "سعر الوحدة" : "Cost/Unit"}</span>
                          <input type="number" value={line.costPerUnit} onChange={e => updateBOM(i, { ...line, costPerUnit: parseFloat(e.target.value) || 0 })} min={0} className={smallInput} />
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button onClick={() => removeBOM(i)} className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-50"><X size={11} /></button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-end text-[12px] font-medium pt-2">
                      <span className="text-muted-foreground mr-2">{ar ? "تكلفة الخامات:" : "Material Cost:"}</span>
                      <span className="tabular-nums">{bomCost.toLocaleString()} {currency}</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Step 3: Manufacturing Stages */}
          {step === 3 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-medium">{ar ? "مراحل التصنيع" : "Manufacturing Stages"}</p>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={loadDressTemplate} className="text-[10.5px] px-2.5 py-1 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50">{ar ? "قالب فستان" : "Dress Template"}</button>
                  <button type="button" onClick={loadGeneralTemplate} className="text-[10.5px] px-2.5 py-1 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50">{ar ? "قالب عام" : "Garment Template"}</button>
                  <button type="button" onClick={addStage} className="flex items-center gap-1 text-[11px] text-primary font-medium hover:opacity-70"><Plus size={12} /> {ar ? "مرحلة" : "Add Stage"}</button>
                </div>
              </div>
              {stages.length === 0 ? (
                <div className="py-10 text-center text-[12px] text-muted-foreground/50 border border-dashed border-border/40 rounded-xl">
                  {ar ? "مفيش مراحل لسه. اختر قالب أو ضيف مرحلة." : "No stages yet. Choose a template or add manually."}
                </div>
              ) : (
                <div className="space-y-2">
                  {stages.map((s, i) => {
                    const dept = DEPARTMENTS.find(d => d.value === s.department);
                    return (
                      <div key={s.id} className="border border-border/30 rounded-xl p-3 bg-muted/10">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] text-muted-foreground/50 tabular-nums w-5">{i + 1}</span>
                          <input value={s.name} onChange={e => updateStage(i, { ...s, name: e.target.value })} className={smallInput + " flex-1"} placeholder={ar ? "اسم المرحلة" : "Stage name"} />
                          <input value={s.name_ar || ""} onChange={e => updateStage(i, { ...s, name_ar: e.target.value })} className={smallInput + " w-[140px]"} placeholder={ar ? "بالعربي" : "Arabic name"} />
                          <button onClick={() => removeStage(i)} className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-50"><Trash2 size={11} /></button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <span className="text-[9px] text-muted-foreground">{ar ? "القسم" : "Department"}</span>
                            <select value={s.department} onChange={e => updateStage(i, { ...s, department: e.target.value })} className={smallInput + " appearance-none cursor-pointer"}>
                              {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{ar ? d.ar : d.en}</option>)}
                            </select>
                          </div>
                          <div>
                            <span className="text-[9px] text-muted-foreground">{ar ? "المدة (ساعات)" : "Duration (hrs)"}</span>
                            <input type="number" value={s.duration_hours} onChange={e => updateStage(i, { ...s, duration_hours: parseFloat(e.target.value) || 0 })} min={0} className={smallInput} />
                          </div>
                          <div>
                            <span className="text-[9px] text-muted-foreground">{ar ? "تكلفة العمالة" : "Labor Cost"}</span>
                            <input type="number" value={s.labor_cost} onChange={e => updateStage(i, { ...s, labor_cost: parseFloat(e.target.value) || 0 })} min={0} className={smallInput} />
                          </div>
                          <div>
                            <span className="text-[9px] text-muted-foreground">{ar ? "تكلفة الماكينة" : "Machine Cost"}</span>
                            <input type="number" value={s.machine_cost} onChange={e => updateStage(i, { ...s, machine_cost: parseFloat(e.target.value) || 0 })} min={0} className={smallInput} />
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2 mt-2">
                          <div>
                            <span className="text-[9px] text-muted-foreground">{ar ? "الفريق" : "Team"}</span>
                            <input value={s.team || ""} onChange={e => updateStage(i, { ...s, team: e.target.value })} className={smallInput} placeholder={ar ? "اختياري" : "Optional"} />
                          </div>
                          <div>
                            <span className="text-[9px] text-muted-foreground">{ar ? "الماكينة" : "Machine"}</span>
                            <input value={s.machine || ""} onChange={e => updateStage(i, { ...s, machine: e.target.value })} className={smallInput} placeholder={ar ? "اختياري" : "Optional"} />
                          </div>
                          <div>
                            <span className="text-[9px] text-muted-foreground">{ar ? "% هالك خامات" : "Waste %"}</span>
                            <input type="number" value={s.material_waste_pct} onChange={e => updateStage(i, { ...s, material_waste_pct: parseFloat(e.target.value) || 0 })} min={0} max={50} className={smallInput} />
                          </div>
                          <div>
                            <span className="text-[9px] text-muted-foreground">{ar ? "مصاريف غير مباشرة" : "Overhead"}</span>
                            <input type="number" value={s.overhead_cost} onChange={e => updateStage(i, { ...s, overhead_cost: parseFloat(e.target.value) || 0 })} min={0} className={smallInput} />
                          </div>
                        </div>
                        {/* Manufacturing Intelligence row */}
                        <div className="flex flex-wrap items-center gap-2 mt-2.5 pt-2 border-t border-border/20">
                          {[
                            { key: "quality_checkpoint", en: "Quality Check", ar: "فحص جودة", icon: ClipboardCheck, active: s.quality_checkpoint },
                            { key: "approval_required", en: "Approval", ar: "موافقة", icon: CheckCircle2, active: s.approval_required },
                            { key: "blocks_next", en: "Blocks Next", ar: "تحجز التالي", icon: AlertTriangle, active: s.blocks_next },
                          ].map(flag => (
                            <button
                              key={flag.key}
                              type="button"
                              onClick={() => updateStage(i, { ...s, [flag.key]: !flag.active })}
                              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-medium border transition-all ${
                                flag.active
                                  ? "border-primary/30 bg-primary/8 text-primary"
                                  : "border-border/30 text-muted-foreground/50 hover:text-muted-foreground hover:border-border/50"
                              }`}
                            >
                              <flag.icon size={9} />
                              {ar ? flag.ar : flag.en}
                            </button>
                          ))}
                          <div className="flex items-center gap-1 ml-auto">
                            <span className="text-[8px] text-muted-foreground">{ar ? "طاقة/يوم" : "Capacity/day"}</span>
                            <input
                              type="number"
                              value={s.capacity_units_per_day || ""}
                              onChange={e => updateStage(i, { ...s, capacity_units_per_day: parseFloat(e.target.value) || undefined })}
                              min={0}
                              className={smallInput + " w-16 text-center"}
                              placeholder="—"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Step 4: Stage Dependencies */}
          {step === 4 && (
            <>
              <p className="text-[12px] text-muted-foreground mb-2">
                {ar ? "حدد علاقة كل مرحلة بالمراحل اللي قبلها (متتابعة / متوازية / حاجزة / اختيارية)" : "Define how each stage relates to previous stages (sequential / parallel / blocking / optional)"}
              </p>
              {stages.length === 0 ? (
                <div className="py-10 text-center text-[12px] text-muted-foreground/50">
                  {ar ? "ارجع للخطوة السابقة وضيف مراحل الأول" : "Go back and add stages first"}
                </div>
              ) : (
                <div className="space-y-2">
                  {stages.map((s, i) => (
                    <div key={s.id} className="border border-border/30 rounded-xl p-3 bg-muted/10">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] text-muted-foreground tabular-nums w-5">{i + 1}</span>
                        <span className="text-[13px] font-medium flex-1">{s.name || `Stage ${i + 1}`}</span>
                        <Clock size={11} className="text-muted-foreground/50" />
                        <span className="text-[10.5px] text-muted-foreground tabular-nums">{s.duration_hours}h</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[9px] text-muted-foreground">{ar ? "نوع التبعية" : "Dependency Type"}</span>
                          <select value={s.dependency_type} onChange={e => updateStage(i, { ...s, dependency_type: e.target.value as DependencyType })}
                            className={smallInput + " appearance-none cursor-pointer"}>
                            <option value="sequential">{ar ? "متتابعة — لازم اللي قبلها تخلص" : "Sequential — must finish previous"}</option>
                            <option value="parallel">{ar ? "متوازية — تشتغل مع اللي قبلها" : "Parallel — runs alongside"}</option>
                            <option value="blocking">{ar ? "حاجزة — لازم تخلص قبل أي حاجة بعدها" : "Blocking — must finish before anything after"}</option>
                            <option value="optional">{ar ? "اختيارية — ممكن تتعدى" : "Optional — can be skipped"}</option>
                          </select>
                        </div>
                        <div>
                          <span className="text-[9px] text-muted-foreground">{ar ? "تعتمد على" : "Depends On"}</span>
                          <select
                            multiple
                            value={s.depends_on}
                            onChange={e => {
                              const selected = Array.from(e.target.selectedOptions).map(o => o.value);
                              updateStage(i, { ...s, depends_on: selected });
                            }}
                            className={smallInput + " h-auto min-h-[32px] py-1"}
                          >
                            {stages.filter((_, idx) => idx < i).map(prev => (
                              <option key={prev.id} value={prev.id}>{prev.name || `Stage ${stages.indexOf(prev) + 1}`}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Timeline summary */}
                  {stages.length > 1 && (
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={13} className="text-primary" />
                        <span className="text-[13px] font-medium">{ar ? "ملخص الجدول الزمني" : "Timeline Summary"}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-[12px]">
                        <div>
                          <span className="text-muted-foreground">{ar ? "إجمالي أيام العمل" : "Total Work Days"}</span>
                          <p className="text-[16px] font-medium tabular-nums">{timeInfo.totalDays}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{ar ? "توفير من التوازي" : "Parallel Savings"}</span>
                          <p className="text-[16px] font-medium tabular-nums text-emerald-600">{timeInfo.parallelSavings > 0 ? `-${timeInfo.parallelSavings} days` : "—"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{ar ? "المراحل الحرجة" : "Critical Path"}</span>
                          <p className="text-[16px] font-medium tabular-nums">{timeInfo.criticalPath.length} {ar ? "مرحلة" : "stages"}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Step 5: Cost & Review */}
          {step === 5 && (
            <>
              {/* Cost breakdown */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-[13px] font-medium mb-2">{ar ? "تحليل التكلفة" : "Cost Breakdown"}</p>
                  {[
                    { label: ar ? "تكلفة الخامات (BOM)" : "Material Cost (BOM)", value: costInfo.materialCost },
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
                  <div className="flex justify-between text-[13px] font-medium border-t border-border/40 pt-2 px-3">
                    <span>{ar ? "إجمالي التكلفة" : "Total Cost"}</span>
                    <span className="tabular-nums">{Math.round(costInfo.totalCost).toLocaleString()} {currency}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>{ar ? "سعر البيع المقترح" : "Suggested Selling Price"}</label>
                    <input type="number" value={suggestedPrice} onChange={e => setSuggestedPrice(e.target.value)} min={0} className={inputCls} placeholder="0" />
                  </div>
                  {parseFloat(suggestedPrice) > 0 && (
                    <div className="bg-muted/30 rounded-xl p-4">
                      <p className="text-[11px] text-muted-foreground mb-1">{ar ? "هامش الربح" : "Profit Margin"}</p>
                      <p className={`text-[22px] font-medium tabular-nums ${(parseFloat(suggestedPrice) - costInfo.totalCost) >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                        {costInfo.totalCost > 0 ? Math.round(((parseFloat(suggestedPrice) - costInfo.totalCost) / parseFloat(suggestedPrice)) * 100) : 0}%
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {ar ? "صافي الربح:" : "Profit:"} {Math.round(parseFloat(suggestedPrice) - costInfo.totalCost).toLocaleString()} {currency}
                      </p>
                    </div>
                  )}

                  {/* Timeline */}
                  <div className="bg-muted/30 rounded-xl p-4">
                    <p className="text-[11px] text-muted-foreground mb-1">{ar ? "مدة التصنيع المتوقعة" : "Estimated Manufacturing Time"}</p>
                    <p className="text-[22px] font-medium tabular-nums">{timeInfo.totalDays} {ar ? "يوم عمل" : "work days"}</p>
                    {timeInfo.parallelSavings > 0 && (
                      <p className="text-[10.5px] text-emerald-600 mt-1">
                        {ar ? `وفرت ${timeInfo.parallelSavings} يوم من التوازي` : `Saved ${timeInfo.parallelSavings} days from parallel stages`}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Warnings */}
              {warnings.length > 0 && (
                <div className="border-t border-border/30 pt-4 mt-3">
                  <p className="text-[12px] font-medium mb-2 flex items-center gap-1.5"><AlertTriangle size={12} className="text-amber-500" /> {ar ? "تنبيهات" : "Warnings"}</p>
                  <div className="space-y-1.5">
                    {warnings.map((w, i) => (
                      <div key={i} className={`flex items-start gap-2 text-[11.5px] px-3 py-2 rounded-lg ${w.type === "error" ? "bg-rose-50 text-rose-700" : w.type === "warning" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>
                        {w.type === "error" ? <AlertCircle size={12} className="mt-0.5 shrink-0" /> : <Info size={12} className="mt-0.5 shrink-0" />}
                        <span>{ar ? w.ar : w.en}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Per-stage cost breakdown */}
              {costInfo.stageCosts.perStage.length > 0 && (
                <div className="border-t border-border/30 pt-4 mt-3">
                  <p className="text-[12px] font-medium mb-2">{ar ? "تكلفة كل مرحلة" : "Per-Stage Cost"}</p>
                  <div className="space-y-1">
                    {costInfo.stageCosts.perStage.map((ps, i) => (
                      <div key={ps.id} className="flex justify-between text-[11px] px-3 py-1.5 rounded bg-muted/10">
                        <span className="text-muted-foreground">{i + 1}. {ps.name}</span>
                        <span className="tabular-nums font-medium">{Math.round(ps.total).toLocaleString()} {currency}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {error && <p className="text-[12px] text-rose-500 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/40 shrink-0 flex items-center gap-3">
          {step > 0 && (
            <button type="button" onClick={() => setStep(s => s - 1)} className="flex items-center gap-1.5 h-10 px-4 rounded-xl border border-border/60 text-[13px] font-medium hover:bg-muted/50">
              <ChevronLeft size={14} /> {ar ? "السابق" : "Back"}
            </button>
          )}
          <div className="flex-1" />
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-xl border border-border/60 text-[13px] font-medium hover:bg-muted/50">{ar ? "إلغاء" : "Cancel"}</button>
          {step < 5 ? (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setStep(s => s + 1)} disabled={!canGoNext()} className={btnPrimary + " h-10"}>
              {ar ? "التالي" : "Next"} <ChevronRight size={14} />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit} disabled={loading || !name.trim()} className={btnPrimary + " h-10"}>
              {loading && <Loader2 size={12} className="animate-spin" />} {ar ? "أنشئ المنتج" : "Create Product"}
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Product Card ────────────────────────────────────────

function ProductCard({ product, ar, currency, onDuplicate, onDelete }: {
  product: Resource; ar: boolean; currency: string;
  onDuplicate: (product: Resource) => void;
  onDelete: (product: Resource) => void;
}) {
  const [, navigate] = useLocation();
  const m = getPM(product);
  const bomCount = (m.bom || []).length;
  const stageCount = (m.stages || []).length;
  const cost = m.total_cost || 0;
  const cat = PRODUCT_CATEGORIES.find(c => c.en === m.category);
  const pri = PRIORITIES.find(p => p.value === m.priority);
  const timeInfo = m.stages?.length ? calculateCriticalPath(m.stages) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3 }}
      onClick={() => navigate(`/products/${product.id}`)}
      className="bg-background border border-border/40 rounded-xl p-5 hover:shadow-md hover:border-border/70 transition-all group cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            {m.sku && <span className="text-[10px] font-mono text-muted-foreground">{m.sku}</span>}
            {cat && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/8 text-primary font-medium">{ar ? cat.ar : cat.en}</span>}
            {pri && <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${pri.color}`}>{ar ? pri.ar : pri.en}</span>}
            {m.active === false && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{ar ? "غير نشط" : "Inactive"}</span>}
          </div>
          <p className="text-[15px] font-medium text-foreground truncate" style={{ fontFamily: "var(--app-font-serif)" }}>
            {ar ? (product.name_ar ?? product.name_en) : product.name_en}
          </p>
          {m.description && <p className="text-[11.5px] text-muted-foreground truncate mt-0.5">{m.description}</p>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-[10.5px] text-muted-foreground mb-3">
        {m.main_material && <span className="flex items-center gap-1"><Package size={10} />{m.main_material}</span>}
        {m.width && m.height && <span className="flex items-center gap-1"><Ruler size={10} />{m.width}×{m.height}{m.depth ? `×${m.depth}` : ""}</span>}
        {m.finish && <span>{m.finish}</span>}
        {timeInfo && <span className="flex items-center gap-1"><Clock size={10} />{timeInfo.totalDays} {ar ? "يوم" : "days"}</span>}
      </div>
      <div className="flex items-center gap-3 pt-3 border-t border-border/30">
        <div className="flex items-center gap-1.5 text-[10.5px]">
          <ListTree size={10} className="text-muted-foreground/50" />
          <span className={bomCount > 0 ? "text-foreground" : "text-amber-500"}>{bomCount} {ar ? "مكون" : "BOM"}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10.5px]">
          <Wrench size={10} className="text-muted-foreground/50" />
          <span className={stageCount > 0 ? "text-foreground" : "text-amber-500"}>{stageCount} {ar ? "مرحلة" : "stages"}</span>
        </div>
        {cost > 0 && (
          <div className="flex items-center gap-1.5 text-[10.5px]">
            <DollarSign size={10} className="text-muted-foreground/50" />
            <span className="tabular-nums">{Math.round(cost).toLocaleString()} {currency}</span>
          </div>
        )}
        {m.suggested_price && m.suggested_price > 0 && cost > 0 && (
          <span className={`text-[10.5px] font-medium tabular-nums ${(m.suggested_price - cost) >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
            {Math.round(((m.suggested_price - cost) / m.suggested_price) * 100)}% {ar ? "ربح" : "margin"}
          </span>
        )}
        {/* Visible action buttons */}
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={e => { e.stopPropagation(); navigate(`/products/${product.id}`); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-primary hover:bg-primary/5 transition-colors"
            title={ar ? "تعديل" : "Edit"}
          >
            <Edit3 size={12} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDuplicate(product); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-primary hover:bg-primary/5 transition-colors"
            title={ar ? "نسخ" : "Duplicate"}
          >
            <Copy size={12} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(product); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-rose-500 hover:bg-rose-50 transition-colors"
            title={ar ? "حذف" : "Delete"}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Duplicate Product Modal ─────────────────────────────

interface DuplicateOption {
  key: string;
  en: string;
  ar: string;
  icon: React.ElementType;
  description_en: string;
  description_ar: string;
  default: boolean;
}

const DUPLICATE_OPTIONS: DuplicateOption[] = [
  { key: "bom",    en: "Bill of Materials",     ar: "قائمة المكونات",     icon: Layers,         description_en: "Copy all BOM lines with quantities and costs", description_ar: "نسخ كل المكونات بالكميات والتكاليف", default: true },
  { key: "stages", en: "Manufacturing Stages",  ar: "مراحل التصنيع",     icon: Wrench,          description_en: "Copy all stages, dependencies, and durations", description_ar: "نسخ كل المراحل والتبعيات والمدد", default: true },
  { key: "dims",   en: "Dimensions & Specs",    ar: "الأبعاد والمواصفات", icon: Ruler,          description_en: "Copy width, height, depth, weight, materials", description_ar: "نسخ العرض والارتفاع والعمق والوزن والخامات", default: true },
  { key: "price",  en: "Pricing",               ar: "التسعير",           icon: DollarSign,      description_en: "Copy suggested price and cost data",           description_ar: "نسخ السعر المقترح وبيانات التكلفة", default: false },
  { key: "variant",en: "Create as Variant",     ar: "إنشاء كمتغير",     icon: Copy,            description_en: "Link to original product as a variant",        description_ar: "ربط بالمنتج الأصلي كمتغير", default: false },
];

function DuplicateProductModal({ product, ar, currency, onClose, onDuplicate }: {
  product: Resource; ar: boolean; currency: string;
  onClose: () => void;
  onDuplicate: (newProduct: Resource) => void;
}) {
  const { workspace } = useAuth();
  const m = getPM(product);
  const [opts, setOpts] = useState<Record<string, boolean>>(
    Object.fromEntries(DUPLICATE_OPTIONS.map(o => [o.key, o.default]))
  );
  const [newName, setNewName] = useState(`${product.name_en} (Copy)`);
  const [loading, setLoading] = useState(false);

  function toggle(key: string) {
    setOpts(prev => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleDuplicate() {
    setLoading(true);
    try {
      const meta: ProductMeta = {
        product_type: "product",
        sku: m.sku ? `${m.sku}-COPY` : undefined,
        category: m.category,
        description: m.description,
        active: true,
        priority: m.priority,
        // Conditional copies
        ...(opts.dims ? {
          width: m.width, height: m.height, depth: m.depth,
          thickness: m.thickness, weight: m.weight,
          main_material: m.main_material, secondary_material: m.secondary_material,
          finish: m.finish, paint: m.paint, hardware: m.hardware,
          edge_banding: m.edge_banding,
        } : {}),
        ...(opts.bom ? { bom: (m.bom || []).map(b => ({ ...b, id: uid() })) } : { bom: [] }),
        ...(opts.stages ? { stages: (m.stages || []).map(s => ({ ...s, id: uid() })) } : { stages: [] }),
        ...(opts.price ? {
          material_cost: m.material_cost, labor_cost: m.labor_cost,
          machine_cost: m.machine_cost, overhead_cost: m.overhead_cost,
          total_cost: m.total_cost, suggested_price: m.suggested_price,
        } : {}),
        ...(opts.variant ? { variant_of: product.id } : {}),
      };

      const res = await getDataSource().resources.create(workspace?.id || "demo", {
        workspace_id: workspace?.id || "demo",
        name_en: newName,
        name_ar: product.name_ar || null,
        type: "product",
        skills: ["product"],
        metadata: meta as any,
      } as any);

      if (res) { void maybePushProductsToShopify(workspace?.id || ""); onDuplicate(res); onClose(); }
    } catch { /* noop */ }
    setLoading(false);
  }

  const selectedCount = Object.values(opts).filter(Boolean).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="relative bg-background border border-border/40 rounded-2xl shadow-2xl w-full max-w-[480px] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-border/40">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[17px] font-medium flex items-center gap-2" style={{ fontFamily: "var(--app-font-serif)" }}>
              <Copy size={16} className="text-primary" />
              {ar ? "نسخ منتج" : "Duplicate Product"}
            </h2>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted">
              <X size={16} />
            </button>
          </div>
          <p className="text-[12px] text-muted-foreground">
            {ar ? `نسخ "${product.name_en}" مع اختيار البيانات المطلوبة` : `Duplicating "${product.name_en}" — choose what to copy`}
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* New name */}
          <div>
            <label className={labelCls}>{ar ? "اسم المنتج الجديد" : "New Product Name"}</label>
            <input value={newName} onChange={e => setNewName(e.target.value)} className={inputCls} />
          </div>

          {/* Options */}
          <div className="space-y-2">
            <p className="text-[11px] font-medium text-muted-foreground tracking-[0.06em] uppercase">
              {ar ? "ماذا تنسخ؟" : "What to copy"}
            </p>
            {DUPLICATE_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const active = opts[opt.key];
              return (
                <motion.button
                  key={opt.key}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => toggle(opt.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                    active
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/30 hover:border-border/50"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground/40"
                  }`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-medium">{ar ? opt.ar : opt.en}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{ar ? opt.description_ar : opt.description_en}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    active ? "border-primary bg-primary" : "border-border/50"
                  }`}>
                    {active && <CheckCircle2 size={12} className="text-white" />}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/40 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            {selectedCount} {ar ? "عنصر محدد" : "items selected"}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="h-9 px-4 rounded-xl border border-border/60 text-[12px] font-medium hover:bg-muted/50">
              {ar ? "إلغاء" : "Cancel"}
            </button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleDuplicate}
              disabled={loading || !newName.trim()}
              className={btnPrimary + " h-9"}
            >
              {loading && <Loader2 size={12} className="animate-spin" />}
              <Copy size={13} />
              {ar ? "نسخ" : "Duplicate"}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────

export default function Products() {
  const { lang } = useLanguage();
  const { workspace } = useAuth();
  const ar = lang === "ar";
  const settings = workspace?.settings as Record<string, unknown> | undefined;
  const currency = (settings?.currency as string) || "EGP";

  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const [modal, setModal] = useState(false);
  const [showTemplateStudio, setShowTemplateStudio] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProductTemplate | null>(null);
  const [duplicateTarget, setDuplicateTarget] = useState<Resource | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [showImport, setShowImport] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Opens the creation flow: template studio first
  function openCreateFlow() {
    setSelectedTemplate(null);
    setShowTemplateStudio(true);
  }

  // Template selected — open wizard pre-populated
  function handleTemplateSelect(template: ProductTemplate) {
    setSelectedTemplate(template);
    setShowTemplateStudio(false);
    setModal(true);
  }

  // Start from scratch — open empty wizard
  function handleScratch() {
    setSelectedTemplate(null);
    setShowTemplateStudio(false);
    setModal(true);
  }

  // Delete product
  async function handleDeleteProduct() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    await getDataSource().resources.remove(workspace?.id || "demo", deleteTarget.id);
    setResources(prev => prev.filter(r => r.id !== deleteTarget.id));
    setDeleteLoading(false);
    setDeleteTarget(null);
  }

  useEffect(() => {
    const wsId = workspace?.id || "demo";
    getDataSource().resources.list(wsId)
      .then(r => setResources(r as Resource[]))
      .finally(() => setLoading(false));
  }, [workspace?.id, reloadKey]);

  const products = useMemo(() => resources.filter(r => r.type === "product" || (r.skills ?? []).includes("product")), [resources]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return products.filter(p => {
      const m = getPM(p);
      const ms = !q || p.name_en.toLowerCase().includes(q) || (m.sku ?? "").toLowerCase().includes(q) || (m.category ?? "").toLowerCase().includes(q);
      const mc = filterCat === "all" || m.category === filterCat;
      return ms && mc;
    });
  }, [products, search, filterCat]);

  const activeProducts = products.filter(p => getPM(p).active !== false);
  const missingBOM = products.filter(p => (getPM(p).bom || []).length === 0);
  const missingStages = products.filter(p => (getPM(p).stages || []).length === 0);

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 size={20} className="animate-spin text-muted-foreground/40" /></div>;

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="border-b border-border/40 px-7 md:px-10 py-7" style={{ background: "linear-gradient(160deg, hsl(var(--muted)/0.3) 0%, hsl(var(--background)) 60%)" }}>
        <div className="max-w-[1100px]">
          <div className="flex items-center gap-2.5 mb-2">
            <Package size={14} className="text-primary" />
            <p className="text-[11px] text-muted-foreground/60 tracking-[0.08em] uppercase">{ar ? "الملابس" : "Garments"}</p>
          </div>
          <div className="flex items-start justify-between gap-4 mb-5">
            <h1 className="text-[26px] font-medium text-foreground leading-tight" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.025em" }}>
              {ar ? "كتالوج الملابس" : "Garment Catalog"}
            </h1>
            <div className="flex items-center gap-2 shrink-0">
              {products.length > 0 && (
                <button onClick={() => {
                  const rows = products.map(p => { const m = getPM(p); return { name: p.name_en, sku: m.sku, category: m.category, main_material: m.main_material, finish: m.finish, width: m.width, height: m.height, depth: m.depth, bom_count: (m.bom||[]).length, cost: m.total_cost, price: m.suggested_price, stages: (m.stages||[]).length, priority: m.priority }; });
                  exportCSV(rows, `thoth-products-${new Date().toISOString().slice(0,10)}.csv`);
                }} className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border/60 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                  <Download size={13} /> {ar ? "صدّر" : "Export"}
                </button>
              )}
              <button onClick={() => setShowImport(true)} className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border/60 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                <Upload size={13} /> {ar ? "استورد" : "Import"}
              </button>
              <button onClick={openCreateFlow} className={btnPrimary + " h-9"}>
                <Plus size={14} /> {ar ? "منتج جديد" : "New Product"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-background border border-border/40 rounded-xl px-4 py-3.5">
              <Package size={14} className="text-primary mb-2" />
              <p className="text-[20px] font-medium tabular-nums mb-1" style={{ fontFamily: "var(--app-font-serif)" }}>{products.length}</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "إجمالي المنتجات" : "Total Products"}</p>
            </div>
            <div className="bg-background border border-border/40 rounded-xl px-4 py-3.5">
              <CheckCircle2 size={14} className="text-emerald-500 mb-2" />
              <p className="text-[20px] font-medium tabular-nums mb-1" style={{ fontFamily: "var(--app-font-serif)" }}>{activeProducts.length}</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "نشط" : "Active"}</p>
            </div>
            <div className="bg-background border border-border/40 rounded-xl px-4 py-3.5">
              <AlertTriangle size={14} className={missingBOM.length > 0 ? "text-amber-500 mb-2" : "text-emerald-500 mb-2"} />
              <p className="text-[20px] font-medium tabular-nums mb-1" style={{ fontFamily: "var(--app-font-serif)" }}>{missingBOM.length}</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "بدون مكونات" : "Missing BOM"}</p>
            </div>
            <div className="bg-background border border-border/40 rounded-xl px-4 py-3.5">
              <Wrench size={14} className={missingStages.length > 0 ? "text-amber-500 mb-2" : "text-emerald-500 mb-2"} />
              <p className="text-[20px] font-medium tabular-nums mb-1" style={{ fontFamily: "var(--app-font-serif)" }}>{missingStages.length}</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "بدون مراحل" : "Missing Stages"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-7 md:px-10 py-4 border-b border-border/30 bg-background/95 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-[1100px] flex items-center gap-3">
          <div className="relative flex-1 max-w-[300px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={ar ? "ابحث بالاسم أو الكود..." : "Search products..."} className="w-full h-9 pl-9 pr-4 rounded-xl border border-border/60 bg-background text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/30" />
          </div>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="h-9 px-3 rounded-xl border border-border/60 bg-background text-[12px] appearance-none cursor-pointer">
            <option value="all">{ar ? "كل الفئات" : "All Categories"}</option>
            {PRODUCT_CATEGORIES.map(c => <option key={c.en} value={c.en}>{ar ? c.ar : c.en}</option>)}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="px-7 md:px-10 py-6 max-w-[1100px]">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-5">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <Package size={24} className="text-muted-foreground/40" />
            </div>
            <div className="text-center max-w-[400px]">
              <p className="text-[15px] font-medium mb-1" style={{ fontFamily: "var(--app-font-serif)" }}>
                {ar ? "مفيش منتجات لسه" : "No products yet"}
              </p>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                {ar ? "أنشئ أول منتج باستخدام ويزارد التصنيع الذكي." : "Create your first product with the smart manufacturing wizard."}
              </p>
            </div>
            <button onClick={openCreateFlow} className={btnPrimary + " h-10"}>
              <Plus size={14} /> {ar ? "منتج جديد" : "New Product"}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-muted-foreground/50">{ar ? "مفيش نتائج" : "No results found"}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(p => <ProductCard key={p.id} product={p} ar={ar} currency={currency} onDuplicate={setDuplicateTarget} onDelete={setDeleteTarget} />)}
          </div>
        )}
      </div>

      {/* Template Studio → then Wizard */}
      <AnimatePresence>
        {showTemplateStudio && (
          <ProductTemplatesStudio
            onSelect={handleTemplateSelect}
            onClose={() => setShowTemplateStudio(false)}
            onScratch={handleScratch}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modal && (
          <ProductWizard
            ar={ar}
            currency={currency}
            onClose={() => { setModal(false); setSelectedTemplate(null); }}
            onAdd={r => setResources(prev => [r, ...prev])}
            initialTemplate={selectedTemplate}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {duplicateTarget && (
          <DuplicateProductModal
            product={duplicateTarget}
            ar={ar}
            currency={currency}
            onClose={() => setDuplicateTarget(null)}
            onDuplicate={r => setResources(prev => [r, ...prev])}
          />
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
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
                {ar ? `هل أنت متأكد من حذف "${deleteTarget.name_en}"؟` : `Are you sure you want to delete "${deleteTarget.name_en}"?`}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)} className="flex-1 h-10 rounded-xl border border-border/60 text-[13px] font-medium hover:bg-muted/50">
                  {ar ? "إلغاء" : "Cancel"}
                </button>
                <button onClick={handleDeleteProduct} disabled={deleteLoading} className="flex-1 h-10 rounded-xl bg-rose-600 text-white text-[13px] font-medium hover:bg-rose-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {deleteLoading && <Loader2 size={12} className="animate-spin" />}
                  <Trash2 size={13} />
                  {ar ? "احذف" : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showImport && (
        <CsvImport
          open={showImport}
          onClose={() => setShowImport(false)}
          template={PRODUCTS_IMPORT}
          adapter={getDataSource().resources}
          ar={ar}
          onComplete={() => { setShowImport(false); setReloadKey((k) => k + 1); }}
        />
      )}
    </div>
  );
}
