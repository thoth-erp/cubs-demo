/**
 * Products — CUBS finished goods.
 *
 * CUBS-recommended products + custom BOM (materials OR custom line items).
 * Export/import, validation alarms, info tooltips.
 */

import { useMemo, useState, useRef } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { useLocation } from "wouter";
import {
  Package, Plus, Search, Trash2, Edit3, Layers, ShoppingCart, Sparkles,
  Boxes, AlertTriangle, CheckCircle2, Info, Upload, Download, Tag, Check,
} from "lucide-react";
import { CATEGORIES, categoryById, tx, type Bi } from "../../lib/cubs/catalog";
import {
  useCubs, addProduct, updateProduct, removeProduct, productMaterialCost, buildability,
  type Product, type BOMLine, type RawMaterial,
} from "../../lib/cubs/store";
import {
  PageHeader, Modal, EmptyState, inputCls, inputErrorCls, selectCls, labelCls, btnPrimary, btnSecondary, btnGhost, cardCls, chipCls, money, FieldError,
} from "../../components/cubs/ui";
import { categoryById as catById } from "../../lib/cubs/catalog";

// ─── Info tooltips ──────────────────────────────────────────

const FIELD_INFO: Record<string, { en: string; ar: string }> = {
  name:      { en: "Product name shown to customers and in orders.", ar: "اسم المنتج الذي يظهر للعملاء وفي الطلبات." },
  category:  { en: "Product category (bags, swimwear, shoes, slippers).", ar: "فئة المنتج (شنط، ملابس سباحة، أحذية، شباشب)." },
  price:     { en: "Selling price per unit. Used in sales orders and margin calculation.", ar: "سعر البيع لكل وحدة. يُستخدم في أوامر البيع وحساب الهامش." },
  description:{ en: "Detailed product description for internal reference.", ar: "وصف تفصيلي للمنتج للمرجع الداخلي." },
  bom:       { en: "Bill of Materials — list all materials or custom items needed to make one unit. Linked materials auto-track stock.", ar: "قائمة المواد — ا列出 جميع المواد أو البنود المخصصة اللازمة لصنع وحدة واحدة. المواد المرتبطة تتتبع المخزون تلقائياً." },
  bomCustom: { en: "Add a custom item not in your raw materials list (e.g. packaging, labels, outsourced work).", ar: "أضف بنداً مخصصاً غير موجود في قائمة المواد الخام (مثل التغليف، الليبلات، العمل外协)." },
};

function InfoTip({ field, lang }: { field: string; lang: "en" | "ar" }) {
  const info = FIELD_INFO[field];
  if (!info) return null;
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex">
      <button type="button" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
        onClick={() => setShow((s) => !s)} className="text-muted-foreground/50 hover:text-primary transition-colors">
        <Info size={12} />
      </button>
      {show && (
        <span className="absolute z-[110] bottom-full mb-2 start-1/2 -translate-x-1/2 w-[260px] p-3 rounded-xl bg-popover border border-border text-[11.5px] text-foreground shadow-xl leading-relaxed" dir={lang === "ar" ? "rtl" : "ltr"}>
          {lang === "ar" ? info.ar : info.en}
        </span>
      )}
    </span>
  );
}

// ─── Export/Import ──────────────────────────────────────────

function exportCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── CUBS recommended products ──────────────────────────────

interface Reco { name: Bi; categoryId: string; price: number }
const RECOMMENDED: Reco[] = [
  { name: { en: "Weekender Duffel", ar: "حقيبة سفر ويكندر" }, categoryId: "bags", price: 850 },
  { name: { en: "City Backpack", ar: "شنطة ظهر" }, categoryId: "bags", price: 720 },
  { name: { en: "Everyday Tote", ar: "شنطة يد" }, categoryId: "bags", price: 540 },
  { name: { en: "Crossbody Bag", ar: "شنطة كروس" }, categoryId: "bags", price: 460 },
  { name: { en: "One-Piece Swimsuit", ar: "مايوه قطعة واحدة" }, categoryId: "swimwear", price: 620 },
  { name: { en: "Two-Piece Bikini", ar: "بكيني قطعتين" }, categoryId: "swimwear", price: 580 },
  { name: { en: "Board Shorts", ar: "شورت بحر" }, categoryId: "swimwear", price: 390 },
  { name: { en: "Running Sneakers", ar: "حذاء رياضي" }, categoryId: "shoes", price: 980 },
  { name: { en: "Casual Loafers", ar: "حذاء كاجوال" }, categoryId: "shoes", price: 860 },
  { name: { en: "Beach Slides", ar: "شبشب شاطئ" }, categoryId: "slippers", price: 240 },
  { name: { en: "Home Slippers", ar: "شبشب منزل" }, categoryId: "slippers", price: 180 },
];

function skuFor(categoryId: string, existing: Product[]): string {
  const code = categoryById(categoryId)?.code ?? "PR";
  const n = existing.filter((p) => p.categoryId === categoryId).length + 1;
  return `${code}-${String(n).padStart(3, "0")}`;
}

// ─── BOM line editor — Visual card-based picker ───────────

function BomEditor({ bom, setBom, rawMaterials, lang }: {
  bom: BOMLine[]; setBom: (b: BOMLine[]) => void; rawMaterials: RawMaterial[]; lang: "en" | "ar";
}) {
  const ar = lang === "ar";
  const [mode, setMode] = useState<"material" | "custom">("material");
  const [rmId, setRmId] = useState("");
  const [varId, setVarId] = useState("");
  const [qty, setQty] = useState<number>(1);
  const [customName, setCustomName] = useState("");
  const [customNameAr, setCustomNameAr] = useState("");
  const [customCost, setCustomCost] = useState<number>(0);
  const [customUnit, setCustomUnit] = useState("pc");
  const [rmSearch, setRmSearch] = useState("");
  const [expandedRm, setExpandedRm] = useState<string | null>(null);

  const rm = rawMaterials.find((r) => r.id === rmId);
  const filteredRms = rawMaterials.filter((r) => !rmSearch || r.name.toLowerCase().includes(rmSearch.toLowerCase()) || (r.nameAr || "").includes(rmSearch));

  const addMaterial = () => {
    if (!rmId || !varId || qty <= 0) return;
    if (bom.some((b) => b.rawMaterialId === rmId && b.variantId === varId)) return;
    setBom([...bom, { rawMaterialId: rmId, variantId: varId, qty, refType: "material" }]);
    setVarId(""); setQty(1);
  };

  const addCustom = () => {
    if (!customName.trim() || qty <= 0) return;
    setBom([...bom, { rawMaterialId: "", variantId: "", qty, refType: "custom", customName, customNameAr, customCost, customUnit }]);
    setCustomName(""); setCustomNameAr(""); setCustomCost(0); setQty(1);
  };

  return (
    <div className="rounded-2xl border border-border/60 overflow-hidden">
      <div className="px-4 py-3 bg-muted/40 border-b border-border/50 flex items-center gap-2">
        <Boxes size={15} className="text-primary" />
        <span className="text-[13px] font-semibold">{ar ? "قائمة المواد (BOM)" : "Bill of materials"}</span>
        {bom.length > 0 && <span className="text-[11px] text-muted-foreground">· {bom.length} {ar ? "بنود" : "items"}</span>}
      </div>
      <div className="p-4 space-y-4">
        {/* Mode tabs */}
        <div className="flex gap-2">
          <button type="button" onClick={() => setMode("material")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-[12.5px] font-medium transition-all ${mode === "material" ? "border-primary bg-primary/5 text-foreground shadow-sm" : "border-border/50 text-muted-foreground hover:border-border"}`}>
            <Layers size={14} />{ar ? "مادة خام" : "Raw Material"}
          </button>
          <button type="button" onClick={() => setMode("custom")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-[12.5px] font-medium transition-all ${mode === "custom" ? "border-amber-400 bg-amber-50 dark:bg-amber-500/10 text-foreground shadow-sm" : "border-border/50 text-muted-foreground hover:border-border"}`}>
            <Tag size={14} />{ar ? "بند مخصص" : "Custom item"}
          </button>
        </div>

        {mode === "material" ? (
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <input className={inputCls + " ps-9"} placeholder={ar ? "بحث في المواد الخام..." : "Search raw materials..."} value={rmSearch} onChange={(e) => setRmSearch(e.target.value)} />
            </div>

            {/* Material cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[240px] overflow-y-auto">
              {filteredRms.map((r) => {
                const active = rmId === r.id;
                const totalStock = r.variants.reduce((s, v) => s + v.stock, 0);
                return (
                  <button key={r.id} type="button" onClick={() => { setRmId(r.id); setVarId(""); }}
                    className={`relative flex items-center gap-3 p-3 rounded-xl border-2 text-start transition-all ${active ? "border-primary bg-primary/5 shadow-sm" : "border-border/40 hover:border-border hover:bg-muted/20"}`}>
                    {active && <div className="absolute top-2 end-2 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><Check size={12} /></div>}
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Layers size={16} className="text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] font-semibold text-foreground truncate">{ar ? (r.nameAr || r.name) : r.name}</p>
                      <p className="text-[11px] text-muted-foreground">{r.variants.length} {ar ? "متغيرات" : "vars"} · {totalStock.toLocaleString()} {ar ? r.unitAr : r.unitEn}</p>
                    </div>
                  </button>
                );
              })}
              {filteredRms.length === 0 && (
                <div className="sm:col-span-2 text-center py-6 text-[12px] text-muted-foreground">
                  {ar ? "لا توجد مواد خام" : "No raw materials found"}
                </div>
              )}
            </div>

            {/* Variant selector */}
            {rm && (
              <div className="rounded-xl border border-border/50 bg-muted/20 p-3 space-y-2">
                <p className="text-[11px] font-medium text-muted-foreground">{ar ? "اختر المتغير" : "Select variant"} — <span className="font-semibold text-foreground">{ar ? (rm.nameAr || rm.name) : rm.name}</span></p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-[120px] overflow-y-auto">
                  {rm.variants.map((v) => {
                    const active = varId === v.id;
                    const low = v.reorderPoint > 0 && v.stock <= v.reorderPoint;
                    return (
                      <button key={v.id} type="button" onClick={() => setVarId(v.id)}
                        className={`relative flex items-center gap-2 px-2.5 py-2 rounded-lg border text-[11px] transition ${active ? "border-primary bg-primary/5" : "border-border/40 hover:border-border"}`}>
                        {v.colourHex && <span className="w-4 h-4 rounded border border-border/50 shrink-0" style={{ backgroundColor: v.colourHex }} />}
                        <div className="min-w-0 text-start">
                          <p className="font-mono font-semibold truncate">{v.sku}</p>
                          <p className="text-muted-foreground">{v.stock} {ar ? rm.unitAr : rm.unitEn} · {money(v.cost, lang)}</p>
                        </div>
                        {low && <span className="absolute top-0.5 end-0.5 w-1.5 h-1.5 rounded-full bg-amber-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Qty + Add */}
            {varId && (
              <div className="flex items-end gap-3">
                <div className="w-24">
                  <label className={labelCls}>{ar ? "الكمية" : "Qty"}</label>
                  <input type="number" className={inputCls} value={qty || ""} onChange={(e) => setQty(Number(e.target.value))} min="1" />
                </div>
                <button type="button" className={btnPrimary + " h-10"} onClick={addMaterial}><Plus size={14} />{ar ? "إضافة" : "Add"}</button>
              </div>
            )}
          </div>
        ) : (
          /* Custom item */
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className={labelCls}>{ar ? "اسم البند" : "Item name"}</label>
              <input className={inputCls} value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder={ar ? "مثال: تغليف، ليبل" : "e.g. Packaging, Labels"} />
            </div>
            <div>
              <label className={labelCls}>{ar ? "التكلفة" : "Cost"}</label>
              <input type="number" className={inputCls} value={customCost || ""} onChange={(e) => setCustomCost(Number(e.target.value))} placeholder="0" />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className={labelCls}>{ar ? "الكمية" : "Qty"}</label>
                <input type="number" className={inputCls} value={qty || ""} onChange={(e) => setQty(Number(e.target.value))} min="1" />
              </div>
              <button type="button" className={btnPrimary + " h-10"} disabled={!customName.trim()} onClick={addCustom}><Plus size={14} /></button>
            </div>
          </div>
        )}

        {/* BOM items list */}
        {bom.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground">{ar ? "البنود المضافة" : "Added items"}</p>
            {bom.map((b, i) => {
              if (b.refType === "custom") {
                return (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-500/5 border border-amber-200/50">
                    <span className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center shrink-0"><Tag size={13} className="text-amber-600" /></span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium truncate">{ar ? (b.customNameAr || b.customName) : b.customName}</p>
                      <p className="text-[11px] text-muted-foreground">{b.qty} × {money(b.customCost || 0, lang)} = {money((b.customCost || 0) * b.qty, lang)}</p>
                    </div>
                    <button className="text-muted-foreground hover:text-red-500 transition" onClick={() => setBom(bom.filter((_, j) => j !== i))}><Trash2 size={13} /></button>
                  </div>
                );
              }
              const r = rawMaterials.find((x) => x.id === b.rawMaterialId);
              const v = r?.variants.find((x) => x.id === b.variantId);
              return (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-violet-50/50 dark:bg-violet-500/5 border border-violet-200/50">
                  {v?.colourHex && <span className="w-8 h-8 rounded-lg border border-border/50 shrink-0" style={{ backgroundColor: v.colourHex }} />}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium truncate">{r ? (ar ? (r.nameAr || r.name) : r.name) : "—"}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{v?.sku} · {b.qty} × {money(v?.cost || 0, lang)} = {money((v?.cost || 0) * b.qty, lang)}</p>
                  </div>
                  <button className="text-muted-foreground hover:text-red-500 transition" onClick={() => setBom(bom.filter((_, j) => j !== i))}><Trash2 size={13} /></button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Product modal ──────────────────────────────────────────

interface Draft { name: string; nameAr: string; categoryId: string; price: number; description: string; descriptionAr: string; bom: BOMLine[]; status: "active" | "draft"; }
const empty: Draft = { name: "", nameAr: "", categoryId: "bags", price: 0, description: "", descriptionAr: "", bom: [], status: "active" };

function ProductModal({ open, onClose, editing, preset }: { open: boolean; onClose: () => void; editing: Product | null; preset: Reco | null }) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const { rawMaterials, products } = useCubs();
  const [d, setD] = useState<Draft>(empty);
  const [inited, setInited] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  if (open && !inited) {
    if (editing) setD({ name: editing.name, nameAr: editing.nameAr || "", categoryId: editing.categoryId, price: editing.price, description: editing.description || "", descriptionAr: editing.descriptionAr || "", bom: editing.bom, status: editing.status });
    else if (preset) setD({ ...empty, name: preset.name.en, nameAr: preset.name.ar, categoryId: preset.categoryId, price: preset.price });
    else setD(empty);
    setInited(true); setShowErrors(false);
  }
  if (!open && inited) setInited(false);

  const matCost = productMaterialCost({ ...d, id: "", sku: "", createdAt: "" } as Product);
  const margin = d.price - matCost;
  const marginPct = d.price > 0 ? (margin / d.price) * 100 : 0;

  const errors: string[] = [];
  if (showErrors) {
    if (!d.name.trim()) errors.push(ar ? "يجب إدخال اسم المنتج" : "Product name is required");
    if (!d.categoryId) errors.push(ar ? "يجب اختيار الفئة" : "Category is required");
    if (d.price <= 0) errors.push(ar ? "يجب إدخال سعر البيع" : "Selling price is required");
  }

  const save = () => {
    setShowErrors(true);
    if (!d.name || !d.categoryId || d.price <= 0) return;
    const payload = { name: d.name, nameAr: d.nameAr, categoryId: d.categoryId, price: d.price, description: d.description, descriptionAr: d.descriptionAr, bom: d.bom, status: d.status,
      sku: editing?.sku ?? skuFor(d.categoryId, products) };
    if (editing) updateProduct(editing.id, payload);
    else addProduct(payload);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} wide title={editing ? "Edit Product" : "New Product"} titleAr={editing ? "تعديل منتج" : "منتج جديد"}
      footer={<>
        <div className="me-auto flex items-center gap-3 text-[12px] flex-wrap">
          <span className="text-muted-foreground">{ar ? "تكلفة الخامات:" : "Material cost:"} <b className="text-foreground">{money(matCost, lang)}</b></span>
          <span className={margin >= 0 ? "text-emerald-600" : "text-red-600"}>{ar ? "الهامش:" : "Margin:"} <b>{money(margin, lang)}</b> ({marginPct.toFixed(0)}%)</span>
        </div>
        <button className={btnSecondary} onClick={onClose}>{ar ? "إلغاء" : "Cancel"}</button>
        <button className={btnPrimary} onClick={save}>{ar ? "حفظ المنتج" : "Save product"}</button>
      </>}>
      <div className="space-y-4">
        {/* Validation */}
        {showErrors && errors.length > 0 && (
          <div className="rounded-xl border border-red-300/50 bg-red-50/60 dark:bg-red-500/5 p-3 space-y-1.5">
            {errors.map((e, i) => (
              <div key={i} className="flex items-start gap-2 text-[12px] text-red-600">
                <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                <span>{e}</span>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">{ar ? "اسم المنتج (EN)" : "Product name (EN)"} <InfoTip field="name" lang={lang} /></label>
            <input className={showErrors && !d.name.trim() ? inputErrorCls : inputCls} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} placeholder="Weekender Duffel" />
            {showErrors && !d.name.trim() && <FieldError message={ar ? "يجب إدخال اسم المنتج" : "Product name is required"} ar={ar} />}
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">{ar ? "اسم المنتج (AR)" : "Product name (AR)"} <InfoTip field="name" lang={lang} /></label>
            <input className={inputCls} dir="rtl" value={d.nameAr} onChange={(e) => setD({ ...d, nameAr: e.target.value })} placeholder="حقيبة سفر" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">{ar ? "الفئة" : "Category"} <InfoTip field="category" lang={lang} /></label>
            <select className={showErrors && !d.categoryId ? selectCls.replace(inputCls, inputErrorCls) : selectCls} value={d.categoryId} onChange={(e) => setD({ ...d, categoryId: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{tx(c.name, lang)}</option>)}
            </select>
            {showErrors && !d.categoryId && <FieldError message={ar ? "يجب اختيار الفئة" : "Category is required"} ar={ar} />}
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">{ar ? "سعر البيع" : "Selling price"} <InfoTip field="price" lang={lang} /></label>
            <input type="number" className={showErrors && d.price <= 0 ? inputErrorCls : inputCls} value={d.price || ""} onChange={(e) => setD({ ...d, price: Number(e.target.value) })} placeholder="0.00" />
            {showErrors && d.price <= 0 && <FieldError message={ar ? "يجب إدخال سعر البيع" : "Selling price is required"} ar={ar} />}
          </div>
          <div className="sm:col-span-2">
            <label className="text-[11px] font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">{ar ? "الوصف" : "Description"} <InfoTip field="description" lang={lang} /></label>
            <textarea className={inputCls + " h-16 py-2 resize-none"} dir={ar ? "rtl" : "ltr"} value={ar ? d.descriptionAr : d.description} onChange={(e) => setD(ar ? { ...d, descriptionAr: e.target.value } : { ...d, description: e.target.value })} placeholder={ar ? "وصف المنتج..." : "Describe the product…"} />
          </div>
        </div>
        <BomEditor bom={d.bom} setBom={(b) => setD({ ...d, bom: b })} rawMaterials={rawMaterials} lang={lang} />
      </div>
    </Modal>
  );
}

// ─── Product card ───────────────────────────────────────────

function ProductCard({ p, onEdit }: { p: Product; onEdit: (p: Product) => void }) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [, navigate] = useLocation();
  const cost = productMaterialCost(p);
  const margin = p.price - cost;
  const marginPct = p.price > 0 ? (margin / p.price) * 100 : 0;
  const build = buildability(p, 1);
  const cat = categoryById(p.categoryId);

  return (
    <div className={cardCls + " p-4"}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={chipCls}>{tx(cat?.name, lang)}</span>
            <span className="font-mono text-[11px] font-semibold text-primary">{p.sku}</span>
            {p.status === "draft" && <span className="text-[10.5px] text-muted-foreground">({ar ? "مسودة" : "draft"})</span>}
          </div>
          <p className="text-[14px] font-semibold text-foreground truncate">{ar ? (p.nameAr || p.name) : p.name}</p>
          <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-1">{ar ? (p.descriptionAr || p.description) : p.description}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button className={btnGhost} onClick={() => onEdit(p)}><Edit3 size={14} /></button>
          <button className={btnGhost} onClick={() => { if (confirm(ar ? "حذف المنتج؟" : "Delete product?")) removeProduct(p.id); }}><Trash2 size={14} /></button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-3">
        <Mini label={ar ? "السعر" : "Price"} value={money(p.price, lang)} />
        <Mini label={ar ? "الخامات" : "Materials"} value={money(cost, lang)} />
        <Mini label={ar ? "الهامش" : "Margin"} value={`${marginPct.toFixed(0)}%`} tone={margin >= 0 ? "good" : "bad"} />
        <Mini label={ar ? "المواد" : "BOM"} value={`${p.bom.length}`} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
        {p.bom.length === 0 ? (
          <span className="text-[11.5px] text-muted-foreground inline-flex items-center gap-1"><AlertTriangle size={12} className="text-amber-500" />{ar ? "لا توجد مواد مرتبطة" : "No materials linked"}</span>
        ) : build.ok ? (
          <span className="text-[11.5px] text-emerald-600 inline-flex items-center gap-1"><CheckCircle2 size={12} />{ar ? "قابل للتصنيع من المخزون" : "Buildable from stock"}</span>
        ) : (
          <span className="text-[11.5px] text-amber-600 inline-flex items-center gap-1"><AlertTriangle size={12} />{ar ? `نقص: ${build.shortfalls.length} مادة` : `Short: ${build.shortfalls.length} material(s)`}</span>
        )}
        <button className={btnSecondary} onClick={() => navigate("/procurement?so=" + p.id)}>
          <ShoppingCart size={13} />{ar ? "أمر بيع" : "Sales order"}
        </button>
      </div>
    </div>
  );
}

function Mini({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-lg bg-muted/40 px-2.5 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">{label}</p>
      <p className={`text-[13px] font-semibold mt-0.5 truncate ${tone === "good" ? "text-emerald-600" : tone === "bad" ? "text-red-600" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────

export default function ProductsPage() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const { products } = useCubs();
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [preset, setPreset] = useState<Reco | null>(null);

  const filtered = useMemo(() => products.filter((p) => {
    if (cat && p.categoryId !== cat) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.nameAr || "").includes(search) || p.sku.toLowerCase().includes(q);
  }), [products, search, cat]);

  const openNew = () => { setEditing(null); setPreset(null); setModal(true); };
  const openPreset = (r: Reco) => { setEditing(null); setPreset(r); setModal(true); };
  const openEdit = (p: Product) => { setPreset(null); setEditing(p); setModal(true); };

  return (
    <div className="p-5 sm:p-6 max-w-[1200px] mx-auto">
      <PageHeader icon={<Layers size={18} />}
        title="Products" titleAr="المنتجات"
        subtitle="Finished goods built from your raw materials" subtitleAr="المنتجات النهائية المبنية من موادك الخام"
        actions={<>
          <button className={btnSecondary} onClick={() => exportCSV(filtered.map((p) => ({ name: p.name, nameAr: p.nameAr, category: p.categoryId, sku: p.sku, price: p.price, bomLines: p.bom.length, status: p.status })), "products.csv")}><Download size={14} />{ar ? "تصدير" : "Export"}</button>
          <button className={btnPrimary} onClick={openNew}><Plus size={15} />{ar ? "منتج جديد" : "New Product"}</button>
        </>}
      />

      {/* Recommended products */}
      <div className="mb-5 rounded-2xl border border-border/60 bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={15} className="text-primary" />
          <span className="text-[13px] font-semibold">{ar ? "منتجات CUBS المقترحة" : "CUBS recommended products"}</span>
          <span className="text-[11.5px] text-muted-foreground">— {ar ? "اضغط للبدء بمنتج جاهز" : "click to start from a ready product"}</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {RECOMMENDED.map((r, i) => (
            <button key={i} onClick={() => openPreset(r)} className="group inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background px-3 py-2 text-[12.5px] hover:border-primary/50 hover:bg-primary/5 transition">
              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Package size={12} /></span>
              <span className="font-medium">{tx(r.name, lang)}</span>
              <span className="text-muted-foreground/70">{tx(categoryById(r.categoryId)?.name, lang)}</span>
              <Plus size={13} className="text-muted-foreground group-hover:text-primary" />
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
          <input className={inputCls + " ps-9"} placeholder={ar ? "بحث عن منتج..." : "Search products…"} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className={selectCls + " w-auto min-w-[140px]"} value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">{ar ? "كل الفئات" : "All categories"}</option>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{tx(c.name, lang)}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className={cardCls}>
          <EmptyState icon={<Package size={20} />} title="No products yet" titleAr="لا توجد منتجات بعد"
            hint="Start from a recommended product above, or build your own from raw materials." hintAr="ابدأ بمنتج مقترح بالأعلى، أو ابنِ منتجك من المواد الخام."
            action={<button className={btnPrimary} onClick={openNew}><Plus size={15} />{ar ? "منتج جديد" : "New Product"}</button>} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((p) => <ProductCard key={p.id} p={p} onEdit={openEdit} />)}
        </div>
      )}

      <ProductModal open={modal} onClose={() => setModal(false)} editing={editing} preset={preset} />
    </div>
  );
}
