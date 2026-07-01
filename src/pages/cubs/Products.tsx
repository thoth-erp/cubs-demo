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
  Boxes, AlertTriangle, CheckCircle2, Info, Upload, Download,
} from "lucide-react";
import { CATEGORIES, categoryById, tx, type Bi } from "../../lib/cubs/catalog";
import {
  useCubs, addProduct, updateProduct, removeProduct, productMaterialCost, buildability,
  type Product, type BOMLine, type RawMaterial,
} from "../../lib/cubs/store";
import {
  PageHeader, Modal, EmptyState, inputCls, inputErrorCls, selectCls, labelCls, btnPrimary, btnSecondary, btnGhost, cardCls, chipCls, money, FieldError,
} from "../../components/cubs/ui";

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

// ─── BOM line editor (supports both RM and custom) ─────────

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
  const [varSearch, setVarSearch] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  const rm = rawMaterials.find((r) => r.id === rmId);
  const filteredRms = rawMaterials.filter((r) => !rmSearch || r.name.toLowerCase().includes(rmSearch.toLowerCase()) || (r.nameAr || "").includes(rmSearch));
  const filteredVars = rm?.variants.filter((v) => !varSearch || v.sku.toLowerCase().includes(varSearch.toLowerCase())) || [];

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
    <div className="rounded-xl border border-border/60 overflow-hidden">
      <div className="px-4 py-2.5 bg-muted/40 border-b border-border/50 flex items-center gap-2">
        <Boxes size={15} className="text-primary" />
        <span className="text-[13px] font-semibold">{ar ? "قائمة المواد (BOM)" : "Bill of materials"}</span>
        <InfoTip field="bom" lang={lang} />
      </div>
      <div className="p-4 space-y-3">
        {/* Mode toggle */}
        <div className="inline-flex rounded-lg border border-border/60 p-0.5 bg-muted/30">
          <button type="button" onClick={() => setMode("material")}
            className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition ${mode === "material" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>
            {ar ? "مادة خام" : "Material"}
          </button>
          <button type="button" onClick={() => setMode("custom")}
            className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition ${mode === "custom" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>
            {ar ? "بند مخصص" : "Custom item"} <InfoTip field="bomCustom" lang={lang} />
          </button>
        </div>

        {mode === "material" ? (
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-2 items-end">
            <div>
              <label className={labelCls}>{ar ? "المادة الخام" : "Raw material"}</label>
              <div className="relative">
                <Search size={13} className="absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                <select className={selectCls + " ps-8"} value={rmId} onChange={(e) => { setRmId(e.target.value); setVarId(""); }}>
                  <option value="">{ar ? "اختر" : "Select"}</option>
                  {filteredRms.map((r) => <option key={r.id} value={r.id}>{ar ? (r.nameAr || r.name) : r.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>{ar ? "المتغير" : "Variant"}</label>
              <select className={selectCls} value={varId} disabled={!rm} onChange={(e) => setVarId(e.target.value)}>
                <option value="">{ar ? "اختر" : "Select"}</option>
                {filteredVars.map((v) => <option key={v.id} value={v.id}>{v.sku} · {money(v.cost, lang)}</option>)}
              </select>
            </div>
            <div className="w-24">
              <label className={labelCls}>{ar ? "الكمية" : "Qty"}</label>
              <input type="number" className={inputCls} value={qty || ""} onChange={(e) => setQty(Number(e.target.value))} />
            </div>
            <button type="button" className={btnPrimary + " h-10"} disabled={!varId} onClick={addMaterial}><Plus size={14} />{ar ? "إضافة" : "Add"}</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto_auto] gap-2 items-end">
            <div>
              <label className={labelCls}>{ar ? "اسم البند (EN)" : "Item name (EN)"}</label>
              <input className={inputCls} value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder={ar ? "مثال: تغليف" : "e.g. Packaging"} />
            </div>
            <div>
              <label className={labelCls}>{ar ? "اسم البند (AR)" : "Item name (AR)"}</label>
              <input className={inputCls} dir="rtl" value={customNameAr} onChange={(e) => setCustomNameAr(e.target.value)} />
            </div>
            <div className="w-24">
              <label className={labelCls}>{ar ? "التكلفة" : "Cost"}</label>
              <input type="number" className={inputCls} value={customCost || ""} onChange={(e) => setCustomCost(Number(e.target.value))} placeholder="0" />
            </div>
            <div className="w-20">
              <label className={labelCls}>{ar ? "الكمية" : "Qty"}</label>
              <input type="number" className={inputCls} value={qty || ""} onChange={(e) => setQty(Number(e.target.value))} />
            </div>
            <button type="button" className={btnPrimary + " h-10"} disabled={!customName.trim()} onClick={addCustom}><Plus size={14} />{ar ? "إضافة" : "Add"}</button>
          </div>
        )}

        {bom.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-border/50">
            <table className="w-full text-[12px]">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-start [&>th]:font-medium">
                  <th>{ar ? "البند" : "Item"}</th><th>{ar ? "النوع" : "Type"}</th><th>{ar ? "الكمية/وحدة" : "Qty/unit"}</th><th>{ar ? "تكلفة السطر" : "Line cost"}</th><th></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {bom.map((b, i) => {
                  if (b.refType === "custom") {
                    return (
                      <tr key={i} className="[&>td]:px-3 [&>td]:py-2">
                        <td className="font-medium">{ar ? (b.customNameAr || b.customName) : b.customName}</td>
                        <td><span className={chipCls + " text-[10px] py-0.5"}>{ar ? "مخصص" : "Custom"}</span></td>
                        <td>{b.qty} {b.customUnit || "pc"}</td>
                        <td>{money((b.customCost || 0) * b.qty, lang)}</td>
                        <td><button className={btnGhost} onClick={() => setBom(bom.filter((_, j) => j !== i))}><Trash2 size={13} /></button></td>
                      </tr>
                    );
                  }
                  const r = rawMaterials.find((x) => x.id === b.rawMaterialId);
                  const v = r?.variants.find((x) => x.id === b.variantId);
                  return (
                    <tr key={i} className="[&>td]:px-3 [&>td]:py-2">
                      <td className="flex items-center gap-2">
                        {v?.colourHex && <span className="inline-block w-4 h-4 rounded border border-border/60 bg-cover bg-center" style={{ backgroundColor: v.colourHex, backgroundImage: v.colourCard ? `url(${v.colourCard})` : undefined }} />}
                        {r ? (ar ? (r.nameAr || r.name) : r.name) : "—"}
                      </td>
                      <td><span className={chipCls + " text-[10px] py-0.5"}>{ar ? "خام" : "Material"}</span></td>
                      <td>{b.qty} {r ? (ar ? r.unitAr : r.unitEn) : ""}</td>
                      <td>{money((v?.cost ?? 0) * b.qty, lang)}</td>
                      <td><button className={btnGhost} onClick={() => setBom(bom.filter((_, j) => j !== i))}><Trash2 size={13} /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
