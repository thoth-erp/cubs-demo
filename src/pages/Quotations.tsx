/**
 * Quotations Module — Furniture Manufacturing
 *
 * عروض الأسعار
 * Quotation → Sales Order → Production → Delivery → Installation
 *
 * Uses work_items with type "quotation" / "sales_order".
 * Line items stored in metadata JSON.
 */

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { getDataSource } from "../lib/data-source";
import { exportCSV } from "../lib/csv-export";
import { generateCode, peekNextCode } from "../lib/code-generator";
import type { Database } from "../lib/database.types";
import type { ProductMeta } from "../lib/furniture-engine";
import {
  FileText, Plus, Search, X, Loader2, AlertCircle, Download,
  CheckCircle2, Clock, XCircle, Building2, ChevronRight,
  DollarSign, Ruler, Package, ArrowRight, Layers,
  Edit3, Palette, Box, Trash2,
} from "lucide-react";
import { ConfirmDeleteModal } from "../components/ConfirmDeleteModal";

type WorkItem = Database["public"]["Tables"]["work_items"]["Row"];
type Org = Database["public"]["Tables"]["organizations"]["Row"];
type Resource = Database["public"]["Tables"]["resources"]["Row"];

// ─── Quotation metadata shape ────────────────────────────

interface QuotItem {
  id: string;
  product: string;
  description: string;
  qty: number;
  unitPrice: number;
  discount?: number;            // line discount amount/percent
  discountType?: "pct" | "fixed";
  width?: number;
  height?: number;
  depth?: number;
  material?: string;
  finish?: string;
  color?: string;
  accessories?: string;
  installationRequired?: boolean;
  deliveryRequired?: boolean;
}

interface QuotMeta {
  quotation_number?: string;
  customer_id?: string;
  customer_name?: string;
  contact_person?: string;
  quotation_date?: string;
  validity_date?: string;
  project_name?: string;
  notes?: string;
  items?: QuotItem[];
  material_cost?: number;
  labor_cost?: number;
  accessories_cost?: number;
  transport_cost?: number;
  installation_cost?: number;
  currency?: string;
  order_discount?: number;       // whole-quote discount
  order_discount_type?: "pct" | "fixed";
  tax_rate?: number;             // VAT % applied after discount
  converted_to?: string; // sales_order ID
}

function getQM(w: WorkItem): QuotMeta {
  return (w.metadata ?? {}) as QuotMeta;
}

/** Net amount for a single line after its own discount. */
function lineNet(i: QuotItem): number {
  const gross = i.qty * i.unitPrice;
  if (!i.discount) return gross;
  return i.discountType === "fixed"
    ? Math.max(0, gross - i.discount)
    : gross * (1 - Math.min(i.discount, 100) / 100);
}

/** Subtotal after line discounts (kept as calcTotal for existing call sites). */
function calcTotal(items: QuotItem[]): number {
  return items.reduce((s, i) => s + lineNet(i), 0);
}

/** Full breakdown: subtotal → order discount → tax → grand total. */
function calcBreakdown(m: QuotMeta): { subtotal: number; orderDisc: number; taxable: number; tax: number; grand: number } {
  const subtotal = calcTotal(m.items || []);
  const od = m.order_discount || 0;
  const orderDisc = od <= 0 ? 0 : (m.order_discount_type === "fixed" ? Math.min(od, subtotal) : subtotal * (Math.min(od, 100) / 100));
  const taxable = subtotal - orderDisc;
  const tax = taxable * ((m.tax_rate || 0) / 100);
  return { subtotal, orderDisc, taxable, tax, grand: taxable + tax };
}

/** Grand total for a quotation (used by list + exports). */
function calcGrand(m: QuotMeta): number {
  return calcBreakdown(m).grand;
}

function calcCosts(m: QuotMeta): number {
  return (m.material_cost || 0) + (m.labor_cost || 0) + (m.accessories_cost || 0) + (m.transport_cost || 0) + (m.installation_cost || 0);
}

// ─── Constants ───────────────────────────────────────────

const Q_STATUSES: { value: string; en: string; ar: string; pill: string }[] = [
  { value: "draft",     en: "Draft",     ar: "مسودة",         pill: "bg-slate-100 text-slate-600" },
  { value: "sent",      en: "Sent",      ar: "مُرسل",         pill: "bg-blue-100 text-blue-600" },
  { value: "approved",  en: "Approved",  ar: "تمت الموافقة",  pill: "bg-emerald-100 text-emerald-700" },
  { value: "rejected",  en: "Rejected",  ar: "مرفوض",         pill: "bg-rose-100 text-rose-600" },
  { value: "expired",   en: "Expired",   ar: "منتهي",         pill: "bg-amber-100 text-amber-700" },
  { value: "converted", en: "Converted", ar: "تم التحويل",    pill: "bg-violet-100 text-violet-600" },
  { value: "cancelled", en: "Cancelled", ar: "ملغي",          pill: "bg-muted text-muted-foreground" },
];

const MATERIALS = ["MDF", "Plywood", "Solid Wood", "Particleboard", "Melamine", "Veneer", "Metal", "Glass", "Marble", "Other"];
const FINISHES = ["Matt", "Gloss", "Semi-Gloss", "Lacquer", "Veneer", "Laminate", "PVC Edge", "Natural", "Painted", "Other"];

// ─── Shared UI ───────────────────────────────────────────

const inputCls = "w-full h-10 rounded-xl border border-border/60 bg-background px-3.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition placeholder:text-muted-foreground/50";
const selectCls = inputCls + " appearance-none cursor-pointer";
const labelCls = "text-[11px] font-medium text-muted-foreground mb-1 block";
const btnPrimary = "flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-foreground text-background text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50";

// ─── Product Search Dropdown ─────────────────────────────

function ProductSearchDropdown({ products, onSelect, ar }: {
  products: Resource[]; onSelect: (p: Resource) => void; ar: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return products.slice(0, 8);
    const q = query.toLowerCase();
    return products.filter(p => {
      const meta = (p.metadata ?? {}) as ProductMeta;
      return p.name_en.toLowerCase().includes(q)
        || (p.name_ar ?? "").toLowerCase().includes(q)
        || (meta.sku ?? "").toLowerCase().includes(q)
        || (meta.category ?? "").toLowerCase().includes(q);
    }).slice(0, 8);
  }, [products, query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={ar ? "ابحث عن منتج..." : "Search products..."}
          className={inputCls + " h-9 text-[12px] pl-8"}
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border/60 rounded-xl shadow-lg z-30 max-h-[240px] overflow-auto">
          {results.map(p => {
            const meta = (p.metadata ?? {}) as ProductMeta;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => { onSelect(p); setOpen(false); setQuery(""); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors border-b border-border/20 last:border-b-0"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                  <Package size={13} className="text-primary/60" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium truncate">{p.name_en}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    {meta.sku && <span className="font-mono">{meta.sku}</span>}
                    {meta.category && <span>{meta.category}</span>}
                    {meta.main_material && <span>{meta.main_material}</span>}
                  </div>
                </div>
                {meta.suggested_price != null && meta.suggested_price > 0 && (
                  <span className="text-[11px] font-medium tabular-nums text-muted-foreground shrink-0">{meta.suggested_price.toLocaleString()}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
      {open && results.length === 0 && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border/60 rounded-xl shadow-lg z-30 p-4 text-center text-[12px] text-muted-foreground">
          {ar ? "مفيش نتائج" : "No products found"}
        </div>
      )}
    </div>
  );
}

// ─── Inline Edit Product Popup ──────────────────────────

function EditItemPopup({ item, index, onSave, onClose, ar, currency }: {
  item: QuotItem; index: number; onSave: (i: number, item: QuotItem) => void; onClose: () => void; ar: boolean; currency: string;
}) {
  const [draft, setDraft] = useState<QuotItem>({ ...item });
  const set = (key: keyof QuotItem, val: unknown) => setDraft(prev => ({ ...prev, [key]: val }));
  const lineTotal = lineNet(draft);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background border border-border/40 rounded-2xl shadow-2xl w-full max-w-[520px] max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Edit3 size={14} className="text-primary" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold">{ar ? "تعديل المنتج" : "Edit Product"}</h3>
              <p className="text-[11px] text-muted-foreground">{draft.product || (ar ? `صنف ${index + 1}` : `Item ${index + 1}`)}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted"><X size={14} /></button>
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-4">
          {/* Product + Description */}
          <div className="space-y-2">
            <div>
              <label className={labelCls}>{ar ? "اسم المنتج" : "Product Name"}</label>
              <input value={draft.product} onChange={e => set("product", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{ar ? "الوصف" : "Description"}</label>
              <input value={draft.description} onChange={e => set("description", e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Dimensions */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Ruler size={12} className="text-muted-foreground/60" />
              <span className="text-[11px] font-medium text-muted-foreground">{ar ? "الأبعاد (سم)" : "Dimensions (cm)"}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[9px] text-muted-foreground">{ar ? "عرض" : "Width"}</label>
                <input type="number" value={draft.width || ""} onChange={e => set("width", parseFloat(e.target.value) || 0)} className={inputCls + " h-9"} />
              </div>
              <div>
                <label className="text-[9px] text-muted-foreground">{ar ? "ارتفاع" : "Height"}</label>
                <input type="number" value={draft.height || ""} onChange={e => set("height", parseFloat(e.target.value) || 0)} className={inputCls + " h-9"} />
              </div>
              <div>
                <label className="text-[9px] text-muted-foreground">{ar ? "عمق" : "Depth"}</label>
                <input type="number" value={draft.depth || ""} onChange={e => set("depth", parseFloat(e.target.value) || 0)} className={inputCls + " h-9"} />
              </div>
            </div>
          </div>

          {/* Material + Finish */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Palette size={12} className="text-muted-foreground/60" />
              <span className="text-[11px] font-medium text-muted-foreground">{ar ? "الخامات والتشطيب" : "Material & Finish"}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] text-muted-foreground">{ar ? "الخامة" : "Material"}</label>
                <select value={draft.material || ""} onChange={e => set("material", e.target.value)} className={selectCls + " h-9"}>
                  <option value="">{ar ? "اختار..." : "Select..."}</option>
                  {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] text-muted-foreground">{ar ? "التشطيب" : "Finish"}</label>
                <select value={draft.finish || ""} onChange={e => set("finish", e.target.value)} className={selectCls + " h-9"}>
                  <option value="">{ar ? "اختار..." : "Select..."}</option>
                  {FINISHES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Color + Accessories */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>{ar ? "اللون" : "Color"}</label>
              <input value={draft.color || ""} onChange={e => set("color", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{ar ? "الاكسسوارات" : "Accessories"}</label>
              <input value={draft.accessories || ""} onChange={e => set("accessories", e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Qty + Price */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <DollarSign size={12} className="text-muted-foreground/60" />
              <span className="text-[11px] font-medium text-muted-foreground">{ar ? "الكمية والسعر" : "Quantity & Price"}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[9px] text-muted-foreground">{ar ? "الكمية" : "Qty"}</label>
                <input type="number" value={draft.qty} onChange={e => set("qty", parseInt(e.target.value) || 1)} min={1} className={inputCls + " h-9"} />
              </div>
              <div>
                <label className="text-[9px] text-muted-foreground">{ar ? "سعر الوحدة" : "Unit Price"}</label>
                <input type="number" value={draft.unitPrice} onChange={e => set("unitPrice", parseFloat(e.target.value) || 0)} min={0} className={inputCls + " h-9"} />
              </div>
              <div>
                <label className="text-[9px] text-muted-foreground">{ar ? "الإجمالي" : "Total"}</label>
                <div className="h-10 flex items-center px-3 text-[13px] font-semibold bg-primary/5 rounded-xl tabular-nums text-primary">
                  {Math.round(lineTotal).toLocaleString()} {currency}
                </div>
              </div>
            </div>
            {/* Line discount */}
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="col-span-2">
                <label className="text-[9px] text-muted-foreground">{ar ? "خصم الصنف" : "Line Discount"}</label>
                <input type="number" min={0} value={draft.discount ?? ""} onChange={e => set("discount", parseFloat(e.target.value) || 0)} placeholder="0" className={inputCls + " h-9"} />
              </div>
              <div>
                <label className="text-[9px] text-muted-foreground">{ar ? "النوع" : "Type"}</label>
                <div className="flex h-9 rounded-xl border border-border/60 overflow-hidden">
                  {(["pct", "fixed"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => set("discountType", t)}
                      className={`flex-1 text-[12px] font-medium transition-colors ${(draft.discountType ?? "pct") === t ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted/50"}`}>
                      {t === "pct" ? "%" : currency}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Flags */}
          <div className="flex gap-5 text-[12px] text-muted-foreground">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={draft.deliveryRequired || false} onChange={e => set("deliveryRequired", e.target.checked)} className="rounded" />
              {ar ? "توصيل" : "Delivery"}
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={draft.installationRequired || false} onChange={e => set("installationRequired", e.target.checked)} className="rounded" />
              {ar ? "تركيب" : "Installation"}
            </label>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border/40 shrink-0 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 h-10 rounded-xl border border-border/60 text-[13px] font-medium hover:bg-muted/50">
            {ar ? "إلغاء" : "Cancel"}
          </button>
          <button type="button" onClick={() => { onSave(index, draft); onClose(); }} className={btnPrimary + " flex-1 h-10"}>
            <CheckCircle2 size={13} /> {ar ? "حفظ التعديلات" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Item Row (with product search) ─────────────────

function ItemRow({ item, index, onChange, onRemove, onEdit, ar, products, currency }: {
  item: QuotItem; index: number; onChange: (i: number, item: QuotItem) => void; onRemove: (i: number) => void; onEdit: (i: number) => void;
  ar: boolean; products: Resource[]; currency: string;
}) {
  const set = (key: keyof QuotItem, val: unknown) => onChange(index, { ...item, [key]: val });

  const handleProductSelect = useCallback((p: Resource) => {
    const meta = (p.metadata ?? {}) as ProductMeta;
    onChange(index, {
      ...item,
      product: p.name_en,
      description: meta.description || meta.category || "",
      width: meta.width || item.width,
      height: meta.height || item.height,
      depth: meta.depth || item.depth,
      material: meta.main_material || item.material,
      finish: meta.finish || item.finish,
      unitPrice: meta.suggested_price || meta.total_cost || item.unitPrice,
    });
  }, [item, index, onChange]);

  const lineTotal = lineNet(item);

  return (
    <div className="border border-border/40 rounded-xl p-4 bg-muted/10 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">{ar ? `صنف ${index + 1}` : `Item ${index + 1}`}</span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => onEdit(index)} className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-colors" title={ar ? "تعديل" : "Edit"}>
            <Edit3 size={11} />
          </button>
          <button type="button" onClick={() => onRemove(index)} className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-50 transition-colors">
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Product search */}
      {products.length > 0 && !item.product.trim() && (
        <ProductSearchDropdown products={products} onSelect={handleProductSelect} ar={ar} />
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <input value={item.product} onChange={(e) => set("product", e.target.value)} className={inputCls + " h-9 text-[12px]"} placeholder={ar ? "اسم المنتج" : "Product name"} />
        </div>
        <div className="col-span-2">
          <input value={item.description} onChange={(e) => set("description", e.target.value)} className={inputCls + " h-9 text-[12px]"} placeholder={ar ? "الوصف" : "Description"} />
        </div>
      </div>
      {/* Compact spec summary */}
      <div className="flex flex-wrap gap-1.5">
        {item.width ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{item.width}×{item.height || "?"}×{item.depth || "?"} cm</span> : null}
        {item.material ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">{item.material}</span> : null}
        {item.finish ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-600">{item.finish}</span> : null}
        {item.color ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-50 text-pink-600">{item.color}</span> : null}
        {item.accessories ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">{item.accessories}</span> : null}
      </div>
      {/* Qty + Price */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[9px] text-muted-foreground">{ar ? "الكمية" : "Qty"}</label>
          <input type="number" value={item.qty} onChange={(e) => set("qty", parseInt(e.target.value) || 1)} min={1} className={inputCls + " h-8 text-[11px]"} />
        </div>
        <div>
          <label className="text-[9px] text-muted-foreground">{ar ? "سعر الوحدة" : "Unit Price"}</label>
          <input type="number" value={item.unitPrice} onChange={(e) => set("unitPrice", parseFloat(e.target.value) || 0)} min={0} className={inputCls + " h-8 text-[11px]"} />
        </div>
        <div>
          <label className="text-[9px] text-muted-foreground">{ar ? "الإجمالي" : "Total"}</label>
          <div className="h-8 flex items-center px-3 text-[12px] font-medium bg-muted/30 rounded-xl tabular-nums">
            {lineTotal.toLocaleString()} {currency}
          </div>
        </div>
      </div>
      {/* Flags */}
      <div className="flex gap-4 text-[11px] text-muted-foreground">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={item.deliveryRequired || false} onChange={(e) => set("deliveryRequired", e.target.checked)} className="rounded" />
          {ar ? "توصيل" : "Delivery"}
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={item.installationRequired || false} onChange={(e) => set("installationRequired", e.target.checked)} className="rounded" />
          {ar ? "تركيب" : "Installation"}
        </label>
      </div>
    </div>
  );
}

// ─── Create Quotation Modal ──────────────────────────────

function CreateQuotationModal({ onClose, onAdd, ar, customers, currency, products }: {
  onClose: () => void; onAdd: (w: WorkItem) => void; ar: boolean; customers: Org[]; currency: string; products: Resource[];
}) {
  const { workspace } = useAuth();
  const [form, setForm] = useState({
    quotNumber: peekNextCode("quotation"),
    customer: "", contactPerson: "", projectName: "", notes: "",
    orderDiscount: "", orderDiscountType: "pct" as "pct" | "fixed", taxRate: "",
    quotDate: new Date().toISOString().slice(0, 10),
    validityDate: (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); })(),
    materialCost: "", laborCost: "", accessoriesCost: "", transportCost: "", installationCost: "",
  });
  const [items, setItems] = useState<QuotItem[]>([{ id: "1", product: "", description: "", qty: 1, unitPrice: 0 }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  function addItem() {
    setItems((prev) => [...prev, { id: String(Date.now()), product: "", description: "", qty: 1, unitPrice: 0 }]);
  }
  function addFromProduct(p: Resource) {
    const meta = (p.metadata ?? {}) as ProductMeta;
    setItems((prev) => [...prev, {
      id: String(Date.now()),
      product: p.name_en,
      description: meta.description || meta.category || "",
      qty: 1,
      unitPrice: meta.suggested_price || meta.total_cost || 0,
      width: meta.width,
      height: meta.height,
      depth: meta.depth,
      material: meta.main_material,
      finish: meta.finish,
    }]);
  }
  function updateItem(i: number, item: QuotItem) { setItems((prev) => prev.map((it, idx) => idx === i ? item : it)); }
  function removeItem(i: number) { if (items.length > 1) setItems((prev) => prev.filter((_, idx) => idx !== i)); }

  const breakdown = calcBreakdown({
    items,
    order_discount: parseFloat(form.orderDiscount) || 0,
    order_discount_type: form.orderDiscountType,
    tax_rate: parseFloat(form.taxRate) || 0,
  });
  const sellingPrice = breakdown.grand;
  const totalCost = (parseFloat(form.materialCost) || 0) + (parseFloat(form.laborCost) || 0) + (parseFloat(form.accessoriesCost) || 0) + (parseFloat(form.transportCost) || 0) + (parseFloat(form.installationCost) || 0);
  const expectedProfit = sellingPrice - totalCost;

  const customer = customers.find((c) => c.id === form.customer);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!workspace || !form.quotNumber.trim()) return;
    setLoading(true); setError(null);
    try {
      // Mint the code (advancing the counter) only when the auto default is kept.
      const auto = peekNextCode("quotation");
      const quotNumber = form.quotNumber.trim() === auto ? generateCode("quotation") : form.quotNumber.trim();
      const created = await getDataSource().work_items.create(workspace.id, {
        title_en: form.projectName.trim() || quotNumber,
        title_ar: form.projectName.trim() || quotNumber,
        type: "quotation" as WorkItem["type"],
        status: "draft" as WorkItem["status"],
        priority: "medium" as WorkItem["priority"],
        due_date: form.validityDate || null,
        organization_id: form.customer || null,
        progress: 0, tags: ["quotation"],
        metadata: {
          quotation_number: quotNumber,
          customer_id: form.customer || null,
          customer_name: customer?.name_en || null,
          contact_person: form.contactPerson.trim() || null,
          quotation_date: form.quotDate,
          validity_date: form.validityDate,
          project_name: form.projectName.trim() || null,
          notes: form.notes.trim() || null,
          items: items.filter((i) => i.product.trim()),
          material_cost: parseFloat(form.materialCost) || 0,
          labor_cost: parseFloat(form.laborCost) || 0,
          accessories_cost: parseFloat(form.accessoriesCost) || 0,
          transport_cost: parseFloat(form.transportCost) || 0,
          installation_cost: parseFloat(form.installationCost) || 0,
          order_discount: parseFloat(form.orderDiscount) || 0,
          order_discount_type: form.orderDiscountType,
          tax_rate: parseFloat(form.taxRate) || 0,
          currency,
        } as never,
      });
      if (created) onAdd(created as WorkItem);
      onClose();
    } catch { setError(ar ? "فشل الحفظ" : "Failed to save."); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-[3px]" onClick={onClose} />
      <div className="relative bg-background border border-border/60 rounded-2xl shadow-xl w-full max-w-[640px] max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border/40 shrink-0">
          <h2 className="text-[16px] font-medium" style={{ fontFamily: "var(--app-font-serif)" }}>{ar ? "عرض سعر جديد" : "New Quotation"}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"><X size={14} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6 space-y-5">
          {/* Header fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{ar ? "رقم عرض السعر" : "Quotation #"} <span className="text-rose-400">*</span></label>
              <input type="text" value={form.quotNumber} onChange={(e) => setForm((f) => ({ ...f, quotNumber: e.target.value }))} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{ar ? "العميل" : "Customer"}</label>
              <select value={form.customer} onChange={(e) => setForm((f) => ({ ...f, customer: e.target.value }))} className={selectCls}>
                <option value="">{ar ? "اختار عميل..." : "Select customer..."}</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name_en}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>{ar ? "شخص التواصل" : "Contact Person"}</label>
              <input type="text" value={form.contactPerson} onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{ar ? "تاريخ العرض" : "Date"}</label>
              <input type="date" value={form.quotDate} onChange={(e) => setForm((f) => ({ ...f, quotDate: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{ar ? "صالح لغاية" : "Valid Until"}</label>
              <input type="date" value={form.validityDate} onChange={(e) => setForm((f) => ({ ...f, validityDate: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>{ar ? "اسم المشروع" : "Project Name"}</label>
            <input type="text" value={form.projectName} onChange={(e) => setForm((f) => ({ ...f, projectName: e.target.value }))} className={inputCls} placeholder={ar ? "مثال: تجهيز مكتب الإدارة" : "e.g. Executive Office Fit-out"} />
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[12px] font-medium">{ar ? "الأصناف" : "Items"}</h3>
              <div className="flex items-center gap-2">
                {products.length > 0 && (
                  <div className="relative group">
                    <button type="button" className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium hover:opacity-70">
                      <Package size={12} /> {ar ? "إضافة منتج" : "Add Product"}
                    </button>
                    <div className="absolute top-full right-0 mt-1 hidden group-focus-within:block hover:block bg-background border border-border/60 rounded-xl shadow-lg z-30 w-[260px] max-h-[200px] overflow-auto">
                      {products.slice(0, 10).map(p => {
                        const meta = (p.metadata ?? {}) as ProductMeta;
                        return (
                          <button key={p.id} type="button" onClick={() => addFromProduct(p)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/50 border-b border-border/20 last:border-b-0">
                            <Package size={11} className="text-primary/50 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-medium truncate">{p.name_en}</p>
                              <p className="text-[9px] text-muted-foreground">{meta.category || meta.main_material || ""}</p>
                            </div>
                            {(meta.suggested_price ?? 0) > 0 && (
                              <span className="text-[10px] tabular-nums text-muted-foreground">{meta.suggested_price?.toLocaleString()}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <button type="button" onClick={addItem} className="flex items-center gap-1 text-[11px] text-primary font-medium hover:opacity-70">
                  <Plus size={12} /> {ar ? "صنف يدوي" : "Blank Item"}
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {items.map((item, i) => (
                <ItemRow key={item.id} item={item} index={i} onChange={updateItem} onRemove={removeItem} onEdit={setEditingItemIndex} ar={ar} products={products} currency={currency} />
              ))}
            </div>
          </div>

          {/* Edit Item Popup */}
          {editingItemIndex !== null && items[editingItemIndex] && (
            <EditItemPopup
              item={items[editingItemIndex]}
              index={editingItemIndex}
              onSave={updateItem}
              onClose={() => setEditingItemIndex(null)}
              ar={ar}
              currency={currency}
            />
          )}

          {/* Cost breakdown */}
          <div>
            <h3 className="text-[12px] font-medium mb-3">{ar ? "تكاليف التصنيع" : "Cost Breakdown"}</h3>
            <div className="grid grid-cols-5 gap-2">
              {[
                { key: "materialCost", en: "Material", ar: "الخامات" },
                { key: "laborCost", en: "Labor", ar: "العمالة" },
                { key: "accessoriesCost", en: "Accessories", ar: "الاكسسوارات" },
                { key: "transportCost", en: "Transport", ar: "النقل" },
                { key: "installationCost", en: "Installation", ar: "التركيب" },
              ].map((c) => (
                <div key={c.key}>
                  <label className="text-[9px] text-muted-foreground">{ar ? c.ar : c.en}</label>
                  <input type="number" value={(form as Record<string, string>)[c.key]} onChange={(e) => setForm((f) => ({ ...f, [c.key]: e.target.value }))} min={0} className={inputCls + " h-8 text-[11px]"} placeholder="0" />
                </div>
              ))}
            </div>
          </div>

          {/* Discount & tax controls */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{ar ? "خصم على العرض" : "Order Discount"}</label>
              <div className="flex gap-1.5">
                <input type="number" min={0} value={form.orderDiscount} onChange={(e) => setForm((f) => ({ ...f, orderDiscount: e.target.value }))} placeholder="0" className={inputCls + " h-9"} />
                <div className="flex rounded-xl border border-border/60 overflow-hidden shrink-0">
                  {(["pct", "fixed"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setForm((f) => ({ ...f, orderDiscountType: t }))}
                      className={`px-2.5 text-[12px] font-medium transition-colors ${form.orderDiscountType === t ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted/50"}`}>
                      {t === "pct" ? "%" : currency}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className={labelCls}>{ar ? "الضريبة %" : "Tax / VAT %"}</label>
              <input type="number" min={0} value={form.taxRate} onChange={(e) => setForm((f) => ({ ...f, taxRate: e.target.value }))} placeholder="0" className={inputCls + " h-9"} />
            </div>
          </div>

          {/* Live Summary — auto-updates on every item change */}
          <div className="bg-muted/30 rounded-xl p-4 space-y-2 border border-border/30">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{ar ? "حساب مباشر" : "Live Total"}</span>
            </div>
            <div className="flex justify-between text-[12px]">
              <span className="text-muted-foreground">{ar ? "الإجمالي الفرعي" : "Subtotal"} ({items.filter(i => i.product.trim()).length})</span>
              <span className="font-medium tabular-nums">{breakdown.subtotal.toLocaleString()} {currency}</span>
            </div>
            {breakdown.orderDisc > 0 && (
              <div className="flex justify-between text-[12px] text-rose-500">
                <span>{ar ? "الخصم" : "Discount"}{form.orderDiscountType === "pct" ? ` (${form.orderDiscount}%)` : ""}</span>
                <span className="font-medium tabular-nums">− {Math.round(breakdown.orderDisc).toLocaleString()} {currency}</span>
              </div>
            )}
            {breakdown.tax > 0 && (
              <div className="flex justify-between text-[12px] text-muted-foreground">
                <span>{ar ? "الضريبة" : "Tax"} ({form.taxRate}%)</span>
                <span className="font-medium tabular-nums">+ {Math.round(breakdown.tax).toLocaleString()} {currency}</span>
              </div>
            )}
            <div className="flex justify-between text-[15px] font-semibold border-t border-border/40 pt-2">
              <span>{ar ? "الإجمالي" : "Grand Total"}</span>
              <span className="tabular-nums text-emerald-600">{Math.round(breakdown.grand).toLocaleString()} {currency}</span>
            </div>
            {totalCost > 0 && (
              <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
                <span>{ar ? "الربح المتوقع" : "Est. Profit"} {sellingPrice > 0 ? `· ${((expectedProfit / sellingPrice) * 100).toFixed(0)}%` : ""}</span>
                <span className={`tabular-nums ${expectedProfit >= 0 ? "text-emerald-600" : "text-rose-500"}`}>{Math.round(expectedProfit).toLocaleString()} {currency}</span>
              </div>
            )}
          </div>

          <div>
            <label className={labelCls}>{ar ? "ملاحظات" : "Notes"}</label>
            <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className={inputCls + " h-16 py-2.5 resize-none"} />
          </div>

          {error && <p className="text-[12px] text-rose-500 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
        </form>
        <div className="px-6 py-4 border-t border-border/40 shrink-0 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 h-10 rounded-xl border border-border/60 text-[13px] font-medium hover:bg-muted/50 transition-colors">{ar ? "إلغاء" : "Cancel"}</button>
          <button onClick={(e) => { e.preventDefault(); const form2 = document.querySelector("form"); form2?.requestSubmit(); }} disabled={loading} className={btnPrimary + " flex-1 h-10"}>
            {loading && <Loader2 size={12} className="animate-spin" />} {ar ? "أنشئ عرض السعر" : "Create Quotation"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────

export default function Quotations() {
  const { lang } = useLanguage();
  const { workspace } = useAuth();
  const ar = lang === "ar";
  const settings = workspace?.settings as Record<string, unknown> | undefined;
  const currency = (settings?.currency as string) || "EGP";

  const [loading, setLoading] = useState(true);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [products, setProducts] = useState<Resource[]>([]);
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<WorkItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const wid = workspace?.id || "demo";
    const ds = getDataSource();
    Promise.all([
      ds.work_items.list(wid),
      ds.organizations.list(wid),
      ds.resources.list(wid),
    ]).then(([w, o, r]) => {
      setWorkItems(w as WorkItem[]);
      setOrgs(o as Org[]);
      setProducts((r as Resource[]).filter(res => res.type === "product"));
    }).finally(() => setLoading(false));
  }, [workspace?.id]);

  const quotations = useMemo(() => workItems.filter((w) => w.type === "quotation"), [workItems]);
  const customers = useMemo(() => orgs.filter((o) => !(o.tags ?? []).includes("vendor")), [orgs]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return quotations.filter((w) => {
      const m = getQM(w);
      const ms = !q || w.title_en.toLowerCase().includes(q) || (m.quotation_number ?? "").toLowerCase().includes(q) || (m.customer_name ?? "").toLowerCase().includes(q);
      const mst = filterStatus === "all" || w.status === filterStatus;
      return ms && mst;
    });
  }, [quotations, search, filterStatus]);

  const fmt = (v: number) => new Intl.NumberFormat(ar ? "ar-EG" : "en-EG", { style: "currency", currency, maximumFractionDigits: 0 }).format(v);

  // Metrics
  const draftCount = quotations.filter((q) => q.status === "draft").length;
  const sentCount = quotations.filter((q) => q.status === "sent").length;
  const approvedCount = quotations.filter((q) => q.status === "approved").length;
  const totalValue = quotations.reduce((s, q) => s + calcGrand(getQM(q)), 0);

  // Status change
  async function updateStatus(id: string, newStatus: string) {
    await getDataSource().work_items.update(workspace?.id ?? "", id, { status: newStatus as never });
    setWorkItems((prev) => prev.map((w) => w.id === id ? { ...w, status: newStatus as WorkItem["status"] } : w));
  }

  // Delete quotation
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    await getDataSource().work_items.remove(workspace?.id || "demo", deleteTarget.id);
    setWorkItems((prev) => prev.filter((w) => w.id !== deleteTarget.id));
    setDeleteLoading(false);
    setDeleteTarget(null);
  }

  // Convert to sales order
  async function convertToSalesOrder(quot: WorkItem) {
    const m = getQM(quot);
    const created = await getDataSource().work_items.create(workspace?.id ?? "", {
      title_en: `SO - ${m.project_name || quot.title_en}`,
      title_ar: `أمر بيع - ${m.project_name || quot.title_en}`,
      type: "sales_order" as WorkItem["type"],
      status: "approved" as WorkItem["status"],
      priority: quot.priority,
      due_date: quot.due_date,
      organization_id: quot.organization_id,
      progress: 0, tags: ["sales_order"],
      metadata: { ...m, source_quotation: quot.id, source_quotation_number: m.quotation_number } as never,
    });
    if (created) {
      // Mark quotation as converted
      await getDataSource().work_items.update(workspace?.id ?? "", quot.id, {
        status: "converted",
        metadata: { ...m, converted_to: (created as WorkItem).id },
      } as unknown as Partial<WorkItem>);
      setWorkItems((prev) => [created as WorkItem, ...prev.map((w) => w.id === quot.id ? { ...w, status: "converted" as WorkItem["status"] } : w)]);
    }
  }

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 size={20} className="animate-spin text-muted-foreground/40" /></div>;

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="border-b border-border/40 px-7 md:px-10 py-7" style={{ background: "linear-gradient(160deg, hsl(var(--muted)/0.3) 0%, hsl(var(--background)) 60%)" }}>
        <div className="max-w-[1100px]">
          <div className="flex items-center gap-2.5 mb-2">
            <FileText size={14} className="text-primary" />
            <p className="text-[11px] text-muted-foreground/60 tracking-[0.08em] uppercase">{ar ? "عروض الأسعار" : "Quotations"}</p>
          </div>
          <div className="flex items-start justify-between gap-4 mb-5">
            <h1 className="text-[26px] font-medium text-foreground leading-tight" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.025em" }}>
              {ar ? "عروض الأسعار" : "Quotations"}
            </h1>
            <div className="flex items-center gap-2 shrink-0">
              {quotations.length > 0 && (
                <button onClick={() => {
                  const rows = quotations.map((q) => { const m = getQM(q); return { number: m.quotation_number, customer: m.customer_name, project: m.project_name, date: m.quotation_date, valid_until: m.validity_date, total: calcGrand(m), status: q.status }; });
                  exportCSV(rows, `thoth-quotations-${new Date().toISOString().slice(0,10)}.csv`);
                }} className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border/60 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                  <Download size={13} /> {ar ? "صدّر" : "Export"}
                </button>
              )}
              <button onClick={() => setModal(true)} className={btnPrimary + " h-9"}>
                <Plus size={14} /> {ar ? "عرض سعر جديد" : "New Quotation"}
              </button>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-background border border-border/40 rounded-xl px-4 py-3.5">
              <Layers size={14} className="text-slate-500 mb-2" />
              <p className="text-[20px] font-medium tabular-nums mb-1" style={{ fontFamily: "var(--app-font-serif)" }}>{draftCount}</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "مسودة" : "Draft"}</p>
            </div>
            <div className="bg-background border border-border/40 rounded-xl px-4 py-3.5">
              <Clock size={14} className="text-blue-500 mb-2" />
              <p className="text-[20px] font-medium tabular-nums mb-1" style={{ fontFamily: "var(--app-font-serif)" }}>{sentCount}</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "مُرسل" : "Sent"}</p>
            </div>
            <div className="bg-background border border-border/40 rounded-xl px-4 py-3.5">
              <CheckCircle2 size={14} className="text-emerald-500 mb-2" />
              <p className="text-[20px] font-medium tabular-nums mb-1" style={{ fontFamily: "var(--app-font-serif)" }}>{approvedCount}</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "تمت الموافقة" : "Approved"}</p>
            </div>
            <div className="bg-background border border-border/40 rounded-xl px-4 py-3.5">
              <DollarSign size={14} className="text-primary mb-2" />
              <p className="text-[17px] font-medium tabular-nums mb-1" style={{ fontFamily: "var(--app-font-serif)" }}>{fmt(totalValue)}</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "إجمالي العروض" : "Total Value"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-7 md:px-10 py-4 border-b border-border/30 bg-background/95 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-[1100px] flex items-center gap-3">
          <div className="relative flex-1 max-w-[300px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={ar ? "ابحث..." : "Search..."} className="w-full h-9 pl-9 pr-4 rounded-xl border border-border/60 bg-background text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/30" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-9 px-3 rounded-xl border border-border/60 bg-background text-[12px] appearance-none cursor-pointer">
            <option value="all">{ar ? "كل الحالات" : "All Status"}</option>
            {Q_STATUSES.map((s) => <option key={s.value} value={s.value}>{ar ? s.ar : s.en}</option>)}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="px-7 md:px-10 py-6 max-w-[1100px]">
        {quotations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-5">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <FileText size={24} className="text-muted-foreground/40" />
            </div>
            <div className="text-center max-w-[400px]">
              <p className="text-[15px] font-medium mb-1" style={{ fontFamily: "var(--app-font-serif)" }}>
                {ar ? "مفيش عروض أسعار لسه" : "No quotations yet"}
              </p>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                {ar ? "أنشئ أول عرض سعر لعميل. حدد المنتجات والمقاسات والخامات والأسعار." : "Create your first quotation. Define products, measurements, materials, and pricing."}
              </p>
            </div>
            <button onClick={() => setModal(true)} className={btnPrimary + " h-10"}>
              <Plus size={14} /> {ar ? "عرض سعر جديد" : "New Quotation"}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-muted-foreground/50">{ar ? "مفيش نتائج" : "No results found"}</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((q) => {
              const m = getQM(q);
              const st = Q_STATUSES.find((s) => s.value === q.status) ?? Q_STATUSES[0];
              const itemsTotal = calcGrand(m);
              const itemCount = (m.items || []).length;
              const costs = calcCosts(m);
              const profit = itemsTotal - costs;

              return (
                <div key={q.id} className="bg-background border border-border/40 rounded-xl p-5 hover:shadow-sm hover:border-border/70 transition-all">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[10.5px] font-mono text-muted-foreground">{m.quotation_number}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.pill}`}>{ar ? st.ar : st.en}</span>
                        {m.quotation_date && <span className="text-[10.5px] text-muted-foreground">{m.quotation_date}</span>}
                      </div>
                      <p className="text-[15px] font-medium" style={{ fontFamily: "var(--app-font-serif)" }}>
                        {m.project_name || (ar ? (q.title_ar ?? q.title_en) : q.title_en)}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                        {m.customer_name && <span className="flex items-center gap-1"><Building2 size={10} />{m.customer_name}</span>}
                        {itemCount > 0 && <span>{itemCount} {ar ? "صنف" : "items"}</span>}
                        {m.validity_date && <span>{ar ? "صالح لغاية" : "Valid until"} {m.validity_date}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[16px] font-semibold tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>{fmt(itemsTotal)}</p>
                      {costs > 0 && (
                        <p className={`text-[10.5px] mt-0.5 ${profit >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                          {ar ? "ربح" : "Profit"} {fmt(profit)}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-border/30">
                    {q.status === "draft" && (
                      <button onClick={() => updateStatus(q.id, "sent")} className="text-[11px] text-blue-600 font-medium hover:opacity-70 flex items-center gap-1">
                        <ArrowRight size={11} /> {ar ? "أرسل للعميل" : "Send"}
                      </button>
                    )}
                    {q.status === "sent" && (
                      <>
                        <button onClick={() => updateStatus(q.id, "approved")} className="text-[11px] text-emerald-600 font-medium hover:opacity-70 flex items-center gap-1">
                          <CheckCircle2 size={11} /> {ar ? "موافقة" : "Approve"}
                        </button>
                        <button onClick={() => updateStatus(q.id, "rejected")} className="text-[11px] text-rose-500 font-medium hover:opacity-70 flex items-center gap-1">
                          <XCircle size={11} /> {ar ? "رفض" : "Reject"}
                        </button>
                      </>
                    )}
                    {q.status === "approved" && (
                      <button onClick={() => convertToSalesOrder(q)} className="text-[11px] text-primary font-medium hover:opacity-70 flex items-center gap-1">
                        <ArrowRight size={11} /> {ar ? "تحويل لأمر بيع" : "Convert to Sales Order"}
                      </button>
                    )}
                    {q.status === "converted" && (
                      <span className="text-[11px] text-violet-600 flex items-center gap-1"><CheckCircle2 size={11} /> {ar ? "تم التحويل لأمر بيع" : "Converted to Sales Order"}</span>
                    )}
                    <button onClick={() => setDeleteTarget(q)} title={ar ? "حذف" : "Delete"} className="ms-auto p-1.5 rounded-lg hover:bg-rose-50 text-rose-400 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modal && <CreateQuotationModal ar={ar} customers={customers} currency={currency} products={products} onClose={() => setModal(false)} onAdd={(w) => setWorkItems((prev) => [w, ...prev])} />}

      <ConfirmDeleteModal
        open={!!deleteTarget}
        ar={ar}
        title={ar ? "حذف عرض السعر" : "Delete Quotation"}
        itemName={deleteTarget ? (getQM(deleteTarget).quotation_number || deleteTarget.title_en) : ""}
        loading={deleteLoading}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
