/**
 * Procurement — Purchase Orders & Sales Orders.
 *
 * Smart, modern order creation with:
 * - Intelligent supplier suggestions from raw materials
 * - Quick-add low-stock items
 * - Priority, payment terms, tax, discounts
 * - Rich line items with colour swatches & SKU previews
 * - Order summary with breakdown
 */

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import {
  ShoppingCart, Plus, Trash2, Edit3, Sparkles, PackageCheck, Truck as TruckIcon,
  ArrowRight, CheckCircle2, Clock, XCircle, Boxes, Wand2, FileText, Download, Search, Info,
  AlertTriangle, Zap, Tag, CreditCard, MapPin, Calendar, Percent, DollarSign,
  ChevronDown, ChevronRight, Package,
} from "lucide-react";
import { categoryById, tx } from "../../lib/cubs/catalog";
import {
  useCubs, addOrder, updateOrder, removeOrder, applyOrder, nextOrderNumber, lowStock, buildability,
  type Order, type OrderKind, type OrderLine, type OrderStatus, type Product, type RawMaterial,
} from "../../lib/cubs/store";
import {
  PageHeader, Modal, EmptyState, inputCls, inputErrorCls, selectCls, labelCls, btnPrimary, btnSecondary, btnGhost, cardCls, chipCls, money, FieldError,
} from "../../components/cubs/ui";

const uidLine = () => `ln_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

// ─── Smart line editor with cards ──────────────────────────

function LineEditor({ kind, lines, setLines, products, rawMaterials, lang }: {
  kind: OrderKind; lines: OrderLine[]; setLines: (l: OrderLine[]) => void;
  products: Product[]; rawMaterials: RawMaterial[]; lang: "en" | "ar";
}) {
  const ar = lang === "ar";
  const [refType, setRefType] = useState<"product" | "material" | "custom">(kind === "sales" ? "product" : "material");
  const [refId, setRefId] = useState("");
  const [varId, setVarId] = useState("");
  const [customName, setCustomName] = useState("");
  const [customNameAr, setCustomNameAr] = useState("");
  const [qty, setQty] = useState<number>(1);
  const [price, setPrice] = useState<number>(0);
  const [unit, setUnit] = useState("pc");
  const [expanded, setExpanded] = useState(true);

  const rm = rawMaterials.find((r) => r.id === refId);
  const product = products.find((p) => p.id === refId);
  const selectedVariant = rm?.variants.find((v) => v.id === varId);

  useEffect(() => {
    if (refType === "product" && product) setPrice(product.price);
    else if (refType === "material" && rm) {
      const v = rm.variants.find((x) => x.id === varId);
      if (v) { setPrice(v.cost); setUnit(rm.unitEn); }
    }
  }, [refType, refId, varId]);

  const add = () => {
    let line: OrderLine | null = null;
    if (refType === "product" && product) {
      line = { id: uidLine(), refType, refId: product.id, name: ar ? (product.nameAr || product.name) : product.name, sku: product.sku, qty, unitPrice: price };
    } else if (refType === "material" && rm && varId) {
      const v = rm.variants.find((x) => x.id === varId);
      line = { id: uidLine(), refType, refId: rm.id, variantId: varId, name: `${ar ? (rm.nameAr || rm.name) : rm.name} · ${v?.colourName ? tx(v.colourName, lang) : ""}${v?.sizeCode ? " " + v.sizeCode : ""}`.trim(), sku: v?.sku, unit: ar ? rm.unitAr : rm.unitEn, qty, unitPrice: price };
    } else if (refType === "custom" && customName) {
      line = { id: uidLine(), refType, name: ar ? (customNameAr || customName) : customName, qty, unitPrice: price, unit };
    }
    if (!line) return;
    setLines([...lines, line]);
    setRefId(""); setVarId(""); setCustomName(""); setCustomNameAr(""); setQty(1); setPrice(0);
  };

  const total = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const materialTotal = lines.filter((l) => l.refType === "material").reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const productTotal = lines.filter((l) => l.refType === "product").reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const customTotal = lines.filter((l) => l.refType === "custom").reduce((s, l) => s + l.qty * l.unitPrice, 0);

  return (
    <div className="rounded-2xl border border-border/60 overflow-hidden">
      {/* Header */}
      <button type="button" onClick={() => setExpanded((e) => !e)}
        className="w-full px-4 py-3 bg-muted/40 border-b border-border/50 flex items-center gap-2 hover:bg-muted/60 transition">
        <Boxes size={15} className="text-primary" />
        <span className="text-[13px] font-semibold text-start flex-1">{ar ? "بنود الطلب" : "Order lines"}</span>
        <span className="text-[11px] text-muted-foreground">{lines.length} {ar ? "بنود" : "items"} · {money(total, lang)}</span>
        {expanded ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Source tabs */}
          <div className="flex gap-2 flex-wrap">
            {([
              { id: "material" as const, icon: Layers, labelEn: "Raw Material", labelAr: "مادة خام", color: "violet" },
              { id: "product" as const, icon: Package, labelEn: "Product", labelAr: "منتج", color: "teal" },
              { id: "custom" as const, icon: Tag, labelEn: "Custom Item", labelAr: "بند مخصص", color: "amber" },
            ]).map((t) => (
              <button key={t.id} type="button" onClick={() => { setRefType(t.id); setRefId(""); setVarId(""); }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12.5px] font-medium border transition ${refType === t.id
                  ? `border-${t.color}-300 bg-${t.color}-50 dark:bg-${t.color}-500/10 text-foreground`
                  : "border-border/60 text-muted-foreground hover:border-border hover:bg-muted/30"
                }`}>
                <t.icon size={14} />
                {ar ? t.labelAr : t.labelEn}
              </button>
            ))}
          </div>

          {/* Add form */}
          <div className="rounded-xl border border-border/50 bg-muted/20 p-3 space-y-3">
            {refType === "product" && (
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
                <div>
                  <label className={labelCls}>{ar ? "اختر منتج" : "Select product"}</label>
                  <select className={selectCls} value={refId} onChange={(e) => setRefId(e.target.value)}>
                    <option value="">{ar ? "اختر منتج..." : "Select product..."}</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{ar ? (p.nameAr || p.name) : p.name} · {p.sku} · {money(p.price, lang)}</option>)}
                  </select>
                </div>
                {product && (
                  <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card px-3 py-2">
                    <div className="text-[12px]">
                      <p className="font-medium">{ar ? (product.nameAr || product.name) : product.name}</p>
                      <p className="text-muted-foreground">{product.sku} · {money(product.price, lang)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {refType === "material" && (
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr] gap-3">
                <div>
                  <label className={labelCls}>{ar ? "المادة الخام" : "Raw material"}</label>
                  <select className={selectCls} value={refId} onChange={(e) => { setRefId(e.target.value); setVarId(""); }}>
                    <option value="">{ar ? "اختر مادة..." : "Select material..."}</option>
                    {rawMaterials.map((r) => {
                      const lowCount = r.variants.filter((v) => v.reorderPoint > 0 && v.stock <= v.reorderPoint).length;
                      return <option key={r.id} value={r.id}>{ar ? (r.nameAr || r.name) : r.name} {lowCount > 0 ? `⚠️ ${lowCount} low` : ""}</option>;
                    })}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{ar ? "المتغير" : "Variant"}</label>
                  <select className={selectCls} value={varId} disabled={!rm} onChange={(e) => setVarId(e.target.value)}>
                    <option value="">{ar ? "اختر متغير..." : "Select variant..."}</option>
                    {rm?.variants.map((v) => {
                      const low = v.reorderPoint > 0 && v.stock <= v.reorderPoint;
                      return <option key={v.id} value={v.id}>{v.sku} — {v.stock} {ar ? rm.unitAr : rm.unitEn} {low ? "⚠️" : ""}</option>;
                    })}
                  </select>
                </div>
                {selectedVariant && (
                  <div className="sm:col-span-2 flex items-center gap-3 rounded-xl border border-border/50 bg-card px-3 py-2">
                    {selectedVariant.colourHex && (
                      <span className="w-6 h-6 rounded-lg border border-border/60 shrink-0" style={{ backgroundColor: selectedVariant.colourHex }} />
                    )}
                    <div className="text-[12px] flex-1">
                      <p className="font-medium">{selectedVariant.sku}</p>
                      <p className="text-muted-foreground">{money(selectedVariant.cost, lang)}/{ar ? rm?.unitAr : rm?.unitEn} · Stock: {selectedVariant.stock}</p>
                    </div>
                    {selectedVariant.reorderPoint > 0 && selectedVariant.stock <= selectedVariant.reorderPoint && (
                      <span className="text-[10.5px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">{ar ? "منخفض" : "Low stock"}</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {refType === "custom" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>{ar ? "اسم البند (EN)" : "Item name (EN)"}</label>
                  <input className={inputCls} value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder={ar ? "مثال: تغليف" : "e.g. Packaging"} />
                </div>
                <div>
                  <label className={labelCls}>{ar ? "اسم البند (AR)" : "Item name (AR)"}</label>
                  <input className={inputCls} dir="rtl" value={customNameAr} onChange={(e) => setCustomNameAr(e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>{ar ? "الوحدة" : "Unit"}</label>
                  <select className={selectCls} value={unit} onChange={(e) => setUnit(e.target.value)}>
                    <option value="pc">{ar ? "قطعة" : "Piece"}</option>
                    <option value="kg">{ar ? "كيلو" : "Kg"}</option>
                    <option value="m">{ar ? "متر" : "Meter"}</option>
                    <option value="box">{ar ? "كرتونة" : "Box"}</option>
                    <option value="roll">{ar ? "لفة" : "Roll"}</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex items-end gap-3">
              <div className="w-24">
                <label className={labelCls}>{ar ? "الكمية" : "Qty"}</label>
                <input type="number" className={inputCls} value={qty || ""} onChange={(e) => setQty(Number(e.target.value))} min="1" />
              </div>
              <div className="w-32">
                <label className={labelCls}>{ar ? "سعر الوحدة" : "Unit price"}</label>
                <input type="number" className={inputCls} value={price || ""} onChange={(e) => setPrice(Number(e.target.value))} placeholder="0.00" />
              </div>
              <div className="text-[13px] text-muted-foreground pb-2.5">
                {ar ? "الإجمالي:" : "Line total:"} <b className="text-foreground">{money(qty * price, lang)}</b>
              </div>
              <button type="button" className={btnPrimary + " h-10"} onClick={add}
                disabled={refType === "custom" ? !customName : !refId || (refType === "material" && !varId)}>
                <Plus size={14} />{ar ? "إضافة" : "Add"}
              </button>
            </div>
          </div>

          {/* Lines table */}
          {lines.length > 0 && (
            <div className="space-y-2">
              <div className="overflow-x-auto rounded-xl border border-border/50">
                <table className="w-full text-[12px]">
                  <thead className="bg-muted/40 text-muted-foreground">
                    <tr className="[&>th]:px-3 [&>th]:py-2.5 [&>th]:text-start [&>th]:font-medium">
                      <th>{ar ? "البند" : "Item"}</th>
                      <th>{ar ? "النوع" : "Type"}</th>
                      <th className="text-end">{ar ? "الكمية" : "Qty"}</th>
                      <th className="text-end">{ar ? "سعر الوحدة" : "Unit price"}</th>
                      <th className="text-end">{ar ? "الإجمالي" : "Total"}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {lines.map((l) => (
                      <tr key={l.id} className="hover:bg-muted/20 transition">
                        <td className="px-3 py-2.5">
                          <div>
                            <span className="font-medium text-foreground">{l.name}</span>
                            {l.sku && <span className="ms-1.5 font-mono text-[10.5px] text-muted-foreground">{l.sku}</span>}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            l.refType === "product" ? "bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300"
                            : l.refType === "material" ? "bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                          }`}>
                            {l.refType === "product" ? (ar ? "منتج" : "Product") : l.refType === "material" ? (ar ? "خام" : "Material") : (ar ? "مخصص" : "Custom")}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-end">{l.qty} {l.unit || ""}</td>
                        <td className="px-3 py-2.5 text-end">{money(l.unitPrice, lang)}</td>
                        <td className="px-3 py-2.5 text-end font-semibold">{money(l.qty * l.unitPrice, lang)}</td>
                        <td className="px-3 py-2.5"><button className={btnGhost} onClick={() => setLines(lines.filter((x) => x.id !== l.id))}><Trash2 size={13} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary breakdown */}
              <div className="rounded-xl border border-border/50 bg-muted/20 p-3 space-y-1.5">
                {materialTotal > 0 && (
                  <div className="flex justify-between text-[12px]">
                    <span className="text-muted-foreground">{ar ? "المواد الخام" : "Raw materials"}</span>
                    <span className="font-medium">{money(materialTotal, lang)}</span>
                  </div>
                )}
                {productTotal > 0 && (
                  <div className="flex justify-between text-[12px]">
                    <span className="text-muted-foreground">{ar ? "المنتجات" : "Products"}</span>
                    <span className="font-medium">{money(productTotal, lang)}</span>
                  </div>
                )}
                {customTotal > 0 && (
                  <div className="flex justify-between text-[12px]">
                    <span className="text-muted-foreground">{ar ? "بنود مخصصة" : "Custom items"}</span>
                    <span className="font-medium">{money(customTotal, lang)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[14px] font-semibold border-t border-border/50 pt-1.5">
                  <span>{ar ? "الإجمالي" : "Total"}</span>
                  <span>{money(total, lang)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Order modal ────────────────────────────────────────────

interface Draft {
  kind: OrderKind; party: string; expectedDate: string; notes: string;
  lines: OrderLine[]; status: OrderStatus;
  priority: "low" | "normal" | "high" | "urgent";
  paymentTerms: string; deliveryAddress: string;
  taxRate: number; discount: number;
}

function OrderModal({ open, onClose, editing, initial }: { open: boolean; onClose: () => void; editing: Order | null; initial: Partial<Draft> | null }) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const { products, rawMaterials, orders } = useCubs();
  const [d, setD] = useState<Draft>({
    kind: "purchase", party: "", expectedDate: "", notes: "", lines: [], status: "draft",
    priority: "normal", paymentTerms: "", deliveryAddress: "", taxRate: 0, discount: 0,
  });
  const [inited, setInited] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (open && !inited) {
    if (editing) {
      setD({
        kind: editing.kind, party: editing.party, expectedDate: editing.expectedDate || "",
        notes: editing.notes || "", lines: editing.lines, status: editing.status,
        priority: (editing as any).priority || "normal",
        paymentTerms: (editing as any).paymentTerms || "",
        deliveryAddress: (editing as any).deliveryAddress || "",
        taxRate: (editing as any).taxRate || 0,
        discount: (editing as any).discount || 0,
      });
    } else {
      setD({
        kind: initial?.kind || "purchase", party: initial?.party || "",
        expectedDate: "", notes: initial?.notes || "", lines: initial?.lines || [], status: "draft",
        priority: "normal", paymentTerms: "", deliveryAddress: "", taxRate: 0, discount: 0,
      });
    }
    setInited(true); setShowErrors(false); setShowAdvanced(false);
  }
  if (!open && inited) setInited(false);

  const subtotal = d.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const discountAmt = subtotal * (d.discount / 100);
  const taxable = subtotal - discountAmt;
  const taxAmt = taxable * (d.taxRate / 100);
  const total = taxable + taxAmt;

  const isPO = d.kind === "purchase";

  // Smart supplier suggestions from existing raw materials
  const supplierSuggestions = useMemo(() => {
    if (!isPO || d.party) return [];
    const suppliers = new Map<string, number>();
    rawMaterials.forEach((r) => {
      if (r.supplier) suppliers.set(r.supplier, (suppliers.get(r.supplier) || 0) + 1);
    });
    return Array.from(suppliers.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [isPO, d.party, rawMaterials]);

  // Smart customer suggestions from existing sales orders
  const customerSuggestions = useMemo(() => {
    if (isPO || d.party) return [];
    const parties = new Map<string, number>();
    orders.filter((o) => o.kind === "sales").forEach((o) => {
      parties.set(o.party, (parties.get(o.party) || 0) + 1);
    });
    return Array.from(parties.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [isPO, d.party, orders]);

  // Low stock items for quick-add
  const lowStockItems = useMemo(() => lowStock().slice(0, 5), []);

  function quickAddLowStock() {
    const newLines: OrderLine[] = lowStockItems.map(({ rm, variant, deficit }) => ({
      id: uidLine(), refType: "material" as const, refId: rm.id, variantId: variant.id,
      name: `${ar ? (rm.nameAr || rm.name) : rm.name} · ${variant.colourName ? tx(variant.colourName, lang) : ""}${variant.sizeCode ? " " + variant.sizeCode : ""}`.trim(),
      sku: variant.sku, unit: ar ? rm.unitAr : rm.unitEn, qty: deficit, unitPrice: variant.cost,
    }));
    setD({ ...d, lines: [...d.lines, ...newLines] });
  }

  const save = () => {
    setShowErrors(true);
    if (!d.party || d.lines.length === 0) return;
    const payload = {
      kind: d.kind, party: d.party, expectedDate: d.expectedDate, notes: d.notes,
      lines: d.lines, status: d.status,
      priority: d.priority, paymentTerms: d.paymentTerms, deliveryAddress: d.deliveryAddress,
      taxRate: d.taxRate, discount: d.discount,
    };
    if (editing) updateOrder(editing.id, payload);
    else addOrder({ ...payload, number: nextOrderNumber(d.kind) });
    onClose();
  };

  const priorityConfig = {
    low: { en: "Low", ar: "منخفض", cls: "bg-slate-100 text-slate-600 dark:bg-slate-500/10", icon: "🔽" },
    normal: { en: "Normal", ar: "عادي", cls: "bg-blue-100 text-blue-600 dark:bg-blue-500/10", icon: "🔵" },
    high: { en: "High", ar: "مهم", cls: "bg-orange-100 text-orange-600 dark:bg-orange-500/10", icon: "🟠" },
    urgent: { en: "Urgent", ar: "عاجل", cls: "bg-red-100 text-red-600 dark:bg-red-500/10", icon: "🔴" },
  } as const;

  return (
    <Modal open={open} onClose={onClose} wide
      title={editing ? "Edit Order" : (isPO ? "New Purchase Order" : "New Sales Order")}
      titleAr={editing ? "تعديل طلب" : (isPO ? "أمر شراء جديد" : "أمر بيع جديد")}
      footer={<>
        <div className="me-auto flex items-center gap-4 text-[12px] flex-wrap">
          <span className="text-muted-foreground">{ar ? "الفرعي:" : "Subtotal:"} <b className="text-foreground">{money(subtotal, lang)}</b></span>
          {d.discount > 0 && <span className="text-muted-foreground">{ar ? "الخصم:" : "Discount:"} <b className="text-emerald-600">-{money(discountAmt, lang)}</b></span>}
          {d.taxRate > 0 && <span className="text-muted-foreground">{ar ? "الضريبة:" : "Tax:"} <b className="text-foreground">{money(taxAmt, lang)}</b></span>}
          <span className="text-[14px] font-semibold">{ar ? "الإجمالي:" : "Total:"} <b className="text-primary">{money(total, lang)}</b></span>
        </div>
        <button className={btnSecondary} onClick={onClose}>{ar ? "إلغاء" : "Cancel"}</button>
        <button className={btnPrimary} onClick={save}>{ar ? "حفظ الطلب" : "Save order"}</button>
      </>}>
      <div className="space-y-5">
        {/* Validation */}
        {showErrors && (!d.party || d.lines.length === 0) && (
          <div className="rounded-xl border border-red-300/50 bg-red-50/60 dark:bg-red-500/5 p-3 space-y-1.5">
            {!d.party && <div className="flex items-start gap-2 text-[12px] text-red-600"><AlertTriangle size={13} className="shrink-0 mt-0.5" /><span>{ar ? "يجب إدخال اسم المورّد أو العميل" : "Supplier/Customer name is required"}</span></div>}
            {d.lines.length === 0 && <div className="flex items-start gap-2 text-[12px] text-red-600"><AlertTriangle size={13} className="shrink-0 mt-0.5" /><span>{ar ? "يجب إضافة بند واحد على الأقل" : "At least one line item is required"}</span></div>}
          </div>
        )}

        {/* Order type + Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>{ar ? "نوع الطلب" : "Order type"}</label>
            <div className="inline-flex rounded-xl border border-border/60 p-0.5 bg-muted/30 w-full">
              {(["purchase", "sales"] as const).map((k) => (
                <button key={k} type="button" disabled={!!editing} onClick={() => setD({ ...d, kind: k })}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[12.5px] font-medium transition ${d.kind === k ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>
                  {k === "purchase" ? <><ShoppingCart size={14} />{ar ? "شراء" : "Purchase"}</> : <><TruckIcon size={14} />{ar ? "بيع" : "Sales"}</>}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>{ar ? "الأولوية" : "Priority"}</label>
            <div className="inline-flex rounded-xl border border-border/60 p-0.5 bg-muted/30 w-full">
              {(["low", "normal", "high", "urgent"] as const).map((p) => (
                <button key={p} type="button" onClick={() => setD({ ...d, priority: p })}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-[11.5px] font-medium transition ${d.priority === p ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>
                  <span>{priorityConfig[p].icon}</span>
                  <span className="hidden sm:inline">{ar ? priorityConfig[p].ar : priorityConfig[p].en}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Party + Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>{isPO ? (ar ? "المورّد" : "Supplier") : (ar ? "العميل" : "Customer")}</label>
            <input className={showErrors && !d.party ? inputErrorCls : inputCls} value={d.party}
              onChange={(e) => setD({ ...d, party: e.target.value })}
              placeholder={isPO ? (ar ? "اسم المورّد..." : "Supplier name...") : (ar ? "اسم العميل..." : "Customer name...")} />
            {showErrors && !d.party && <FieldError message={ar ? "يجب إدخال الاسم" : "Name is required"} ar={ar} />}

            {/* Smart suggestions */}
            {!d.party && supplierSuggestions.length > 0 && isPO && (
              <div className="mt-1.5 flex gap-1.5 flex-wrap">
                {supplierSuggestions.map(([name]) => (
                  <button key={name} type="button" onClick={() => setD({ ...d, party: name })}
                    className="inline-flex items-center gap-1 text-[11px] text-primary hover:bg-primary/5 px-2 py-1 rounded-lg border border-primary/20 transition">
                    <Sparkles size={10} />{name}
                  </button>
                ))}
              </div>
            )}
            {!d.party && customerSuggestions.length > 0 && !isPO && (
              <div className="mt-1.5 flex gap-1.5 flex-wrap">
                {customerSuggestions.map(([name]) => (
                  <button key={name} type="button" onClick={() => setD({ ...d, party: name })}
                    className="inline-flex items-center gap-1 text-[11px] text-primary hover:bg-primary/5 px-2 py-1 rounded-lg border border-primary/20 transition">
                    <Sparkles size={10} />{name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className={labelCls}>{ar ? "التاريخ المتوقع" : "Expected delivery"}</label>
            <input type="date" className={inputCls} value={d.expectedDate} onChange={(e) => setD({ ...d, expectedDate: e.target.value })} />
          </div>
        </div>

        {/* Smart quick-add banner */}
        {isPO && lowStockItems.length > 0 && d.lines.length === 0 && (
          <div className="rounded-xl border border-amber-300/50 bg-amber-50/60 dark:bg-amber-500/5 p-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Zap size={15} className="text-amber-600" />
              <span className="text-[12.5px] font-medium">{ar ? `${lowStockItems.length} مواد تحت حد إعادة الطلب` : `${lowStockItems.length} materials below reorder point`}</span>
            </div>
            <button type="button" className="text-[12px] font-medium text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/20 transition" onClick={quickAddLowStock}>
              <Wand2 size={12} className="inline me-1" />{ar ? "إضافة تلقائية" : "Quick add all"}
            </button>
          </div>
        )}

        {/* Line editor */}
        <LineEditor kind={d.kind} lines={d.lines} setLines={(l) => setD({ ...d, lines: l })} products={products} rawMaterials={rawMaterials} lang={lang} />

        {/* Advanced options */}
        <div>
          <button type="button" onClick={() => setShowAdvanced((s) => !s)}
            className="flex items-center gap-2 text-[12.5px] text-muted-foreground hover:text-foreground transition">
            {showAdvanced ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            {ar ? "خيارات متقدمة" : "Advanced options"}
          </button>
          {showAdvanced && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl border border-border/50 bg-muted/20">
              <div>
                <label className={labelCls}>{ar ? "شروط الدفع" : "Payment terms"}</label>
                <select className={selectCls} value={d.paymentTerms} onChange={(e) => setD({ ...d, paymentTerms: e.target.value })}>
                  <option value="">{ar ? "اختر..." : "Select..."}</option>
                  <option value="cash">{ar ? "نقداً" : "Cash on delivery"}</option>
                  <option value="net15">{ar ? "صافي ١٥ يوم" : "Net 15 days"}</option>
                  <option value="net30">{ar ? "صافي ٣٠ يوم" : "Net 30 days"}</option>
                  <option value="net60">{ar ? "صافي ٦٠ يوم" : "Net 60 days"}</option>
                  <option value="prepaid">{ar ? "دفع مسبق" : "Prepaid"}</option>
                  <option value="installments">{ar ? "أقساط" : "Installments"}</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>{ar ? "عنوان التوصيل" : "Delivery address"}</label>
                <input className={inputCls} value={d.deliveryAddress} onChange={(e) => setD({ ...d, deliveryAddress: e.target.value })}
                  placeholder={ar ? "المصنع، المنطقة الصناعية..." : "Factory, industrial area..."} />
              </div>
              <div>
                <label className={labelCls}>{ar ? "نسبة الخصم %" : "Discount %"}</label>
                <input type="number" className={inputCls} value={d.discount || ""} onChange={(e) => setD({ ...d, discount: Number(e.target.value) })} placeholder="0" min="0" max="100" />
              </div>
              <div>
                <label className={labelCls}>{ar ? "نسبة الضريبة %" : "Tax %"}</label>
                <input type="number" className={inputCls} value={d.taxRate || ""} onChange={(e) => setD({ ...d, taxRate: Number(e.target.value) })} placeholder="0" min="0" max="100" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>{ar ? "ملاحظات" : "Notes"}</label>
                <textarea className={inputCls + " h-16 py-2 resize-none"} dir={ar ? "rtl" : "ltr"} value={d.notes}
                  onChange={(e) => setD({ ...d, notes: e.target.value })}
                  placeholder={ar ? "ملاحظات إضافية..." : "Additional notes..."} />
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ─── Status pill ───────────────────────────────────────────

function StatusPill({ status, lang }: { status: OrderStatus; lang: "en" | "ar" }) {
  const ar = lang === "ar";
  const map: Record<OrderStatus, { en: string; ar: string; cls: string; icon: React.ElementType }> = {
    draft: { en: "Draft", ar: "مسودة", cls: "bg-muted text-muted-foreground", icon: FileText },
    confirmed: { en: "Confirmed", ar: "مؤكد", cls: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400", icon: Clock },
    received: { en: "Received", ar: "مستلم", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400", icon: PackageCheck },
    fulfilled: { en: "Fulfilled", ar: "منفّذ", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400", icon: CheckCircle2 },
    cancelled: { en: "Cancelled", ar: "ملغى", cls: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400", icon: XCircle },
  };
  const s = map[status]; const Icon = s.icon;
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${s.cls}`}><Icon size={11} />{ar ? s.ar : s.en}</span>;
}

// ─── Order card ────────────────────────────────────────────

function OrderCard({ o, onEdit }: { o: Order; onEdit: (o: Order) => void }) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const total = o.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const isPO = o.kind === "purchase";
  const priority = (o as any).priority || "normal";
  const paymentTerms = (o as any).paymentTerms || "";

  const priorityDot: Record<string, string> = {
    low: "bg-slate-400", normal: "bg-blue-400", high: "bg-orange-400", urgent: "bg-red-400",
  };

  return (
    <div className={cardCls + " p-4 hover:shadow-md transition-shadow"}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`w-2 h-2 rounded-full shrink-0 ${priorityDot[priority] || "bg-blue-400"}`} />
            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] font-semibold ${isPO ? "bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300" : "bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300"}`}>
              {isPO ? <ShoppingCart size={11} /> : <TruckIcon size={11} />}{isPO ? (ar ? "شراء" : "PO") : (ar ? "بيع" : "SO")}
            </span>
            <span className="font-mono text-[12px] font-semibold text-foreground">{o.number}</span>
            <StatusPill status={o.status} lang={lang} />
          </div>
          <p className="text-[14px] font-medium text-foreground truncate">{o.party}</p>
          <div className="flex items-center gap-3 mt-1 text-[11.5px] text-muted-foreground flex-wrap">
            <span>{o.lines.length} {ar ? "بند" : "items"}</span>
            <span>·</span>
            <span className="font-semibold text-foreground">{money(total, lang)}</span>
            {o.expectedDate && <><span>·</span><span className="flex items-center gap-1"><Calendar size={11} />{o.expectedDate}</span></>}
            {paymentTerms && <><span>·</span><span className="flex items-center gap-1"><CreditCard size={11} />{paymentTerms}</span></>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button className={btnGhost} onClick={() => onEdit(o)}><Edit3 size={14} /></button>
          <button className={btnGhost} onClick={() => { if (confirm(ar ? "حذف الطلب؟" : "Delete order?")) removeOrder(o.id); }}><Trash2 size={14} /></button>
        </div>
      </div>

      {/* Line preview */}
      <div className="mt-3 space-y-1">
        {o.lines.slice(0, 3).map((l) => (
          <div key={l.id} className="flex items-center justify-between text-[12px] text-muted-foreground">
            <span className="truncate">{l.qty}× {l.name}</span>
            <span className="shrink-0 ms-2 font-medium">{money(l.qty * l.unitPrice, lang)}</span>
          </div>
        ))}
        {o.lines.length > 3 && <p className="text-[11px] text-muted-foreground/60">+{o.lines.length - 3} {ar ? "المزيد" : "more"}</p>}
      </div>

      {/* Status actions */}
      <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2 flex-wrap">
        {o.status === "draft" && <button className={btnSecondary} onClick={() => updateOrder(o.id, { status: "confirmed" })}><ArrowRight size={13} />{ar ? "تأكيد" : "Confirm"}</button>}
        {o.status === "confirmed" && (
          <button className={btnPrimary} onClick={() => applyOrder(o.id)}>
            {isPO ? <PackageCheck size={14} /> : <CheckCircle2 size={14} />}
            {isPO ? (ar ? "استلام (يضيف للمخزون)" : "Receive (adds stock)") : (ar ? "تنفيذ (يخصم المخزون)" : "Fulfill (consumes stock)")}
          </button>
        )}
        {(o.status === "received" || o.status === "fulfilled") && (
          <span className="text-[12px] text-emerald-600 inline-flex items-center gap-1"><CheckCircle2 size={13} />{ar ? "أثّر على المخزون" : "Inventory updated"}</span>
        )}
        {o.status !== "cancelled" && o.status !== "received" && o.status !== "fulfilled" && (
          <button className={btnGhost} onClick={() => updateOrder(o.id, { status: "cancelled" })}>{ar ? "إلغاء" : "Cancel"}</button>
        )}
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────

export default function ProcurementPage() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const { orders, products, rawMaterials } = useCubs();
  const [tab, setTab] = useState<"all" | OrderKind>("all");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Order | null>(null);
  const [initial, setInitial] = useState<Partial<Draft> | null>(null);

  const alerts = lowStock();

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("suggest") === "1" && alerts.length) { draftReorderPO(); window.history.replaceState({}, "", "/procurement"); }
    else if (q.get("so")) {
      const p = products.find((x) => x.id === q.get("so"));
      if (p) { openNew({ kind: "sales", party: "", lines: [{ id: uidLine(), refType: "product", refId: p.id, name: ar ? (p.nameAr || p.name) : p.name, sku: p.sku, qty: 1, unitPrice: p.price }] }); window.history.replaceState({}, "", "/procurement"); }
    }
  }, []);

  const openNew = (init?: Partial<Draft>) => { setEditing(null); setInitial(init || null); setModal(true); };
  const openEdit = (o: Order) => { setInitial(null); setEditing(o); setModal(true); };

  function draftReorderPO() {
    const lines: OrderLine[] = alerts.map(({ rm, variant, deficit }) => ({
      id: uidLine(), refType: "material", refId: rm.id, variantId: variant.id,
      name: `${rm.name} · ${variant.colourName ? tx(variant.colourName, lang) : ""}${variant.sizeCode ? " " + variant.sizeCode : ""}`.trim(),
      sku: variant.sku, unit: rm.unitEn, qty: deficit, unitPrice: variant.cost,
    }));
    const supplier = alerts[0]?.rm.supplier || "";
    openNew({ kind: "purchase", party: supplier, notes: ar ? "إعادة تعبئة تلقائية" : "Auto reorder", lines, priority: "high" });
  }

  const list = useMemo(() => orders.filter((o) => tab === "all" || o.kind === tab), [orders, tab]);

  const unbuildable = useMemo(() => orders.filter((o) => o.kind === "sales" && o.status === "confirmed").flatMap((o) =>
    o.lines.filter((l) => l.refType === "product" && l.refId).map((l) => {
      const p = products.find((x) => x.id === l.refId); if (!p) return null;
      const b = buildability(p, l.qty); return b.ok ? null : { order: o, product: p, shortfalls: b.shortfalls };
    }).filter(Boolean)
  ), [orders, products, rawMaterials]);

  const totalValue = list.reduce((s, o) => s + o.lines.reduce((ls, l) => ls + l.qty * l.unitPrice, 0), 0);

  return (
    <div className="p-5 sm:p-6 max-w-[1200px] mx-auto">
      <PageHeader icon={<ShoppingCart size={18} />}
        title="Procurement" titleAr="المشتريات والطلبات"
        subtitle="Purchase raw materials · sell finished products — all connected to stock" subtitleAr="اشترِ المواد الخام · بِع المنتجات — كلها مرتبطة بالمخزون"
        actions={<>
          <button className={btnSecondary} onClick={() => {
            const data = list.map((o) => ({ number: o.number, type: o.kind, party: o.party, status: o.status, lines: o.lines.length, total: o.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0), date: o.createdAt }));
            const headers = Object.keys(data[0] || {});
            const rows = data.map((r) => headers.map((h) => JSON.stringify((r as any)[h] ?? "")).join(","));
            const csv = [headers.join(","), ...rows].join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url; a.download = "orders.csv"; a.click();
            URL.revokeObjectURL(url);
          }}><Download size={14} />{ar ? "تصدير" : "Export"}</button>
          <button className={btnSecondary} onClick={() => openNew({ kind: "sales" })}><TruckIcon size={15} />{ar ? "أمر بيع" : "Sales Order"}</button>
          <button className={btnPrimary} onClick={() => openNew({ kind: "purchase" })}><Plus size={15} />{ar ? "أمر شراء" : "Purchase Order"}</button>
        </>}
      />

      {/* Smart suggestions */}
      {(alerts.length > 0 || unbuildable.length > 0) && (
        <div className="mb-5 rounded-2xl border border-primary/25 bg-primary/[0.03] p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-primary" />
            <span className="text-[13px] font-semibold">{ar ? "اقتراحات ذكية" : "Smart suggestions"}</span>
          </div>
          {alerts.length > 0 && (
            <div className="flex items-start justify-between gap-3 flex-wrap rounded-xl bg-card border border-border/50 px-3.5 py-3">
              <div className="min-w-0">
                <p className="text-[12.5px] font-medium">{ar ? `${alerts.length} مادة تحت حد إعادة الطلب` : `${alerts.length} material variants below reorder point`}</p>
                <p className="text-[11.5px] text-muted-foreground mt-0.5 truncate">{alerts.slice(0, 3).map((a) => a.variant.sku).join(" · ")}{alerts.length > 3 ? " …" : ""}</p>
              </div>
              <button className={btnPrimary + " shrink-0"} onClick={draftReorderPO}><Wand2 size={13} />{ar ? "توليد أمر شراء" : "Draft reorder PO"}</button>
            </div>
          )}
          {unbuildable.map((u: any, i) => (
            <div key={i} className="flex items-start justify-between gap-3 flex-wrap rounded-xl bg-card border border-amber-300/40 px-3.5 py-3">
              <div className="min-w-0">
                <p className="text-[12.5px] font-medium">{ar ? `${u.order.number}: لا يوجد مخزون كافٍ لـ ${u.product.name}` : `${u.order.number}: not enough stock to build ${u.product.name}`}</p>
                <p className="text-[11.5px] text-amber-600 mt-0.5 truncate">{u.shortfalls.map((s: any) => `${s.name} (${s.have}/${s.need})`).join(" · ")}</p>
              </div>
              <button className={btnSecondary + " shrink-0"} onClick={draftReorderPO}><ShoppingCart size={13} />{ar ? "اطلب النواقص" : "Reorder shortfalls"}</button>
            </div>
          ))}
        </div>
      )}

      {/* Tabs + stats */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="inline-flex rounded-xl border border-border/60 p-0.5 bg-muted/30">
          {(["all", "purchase", "sales"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-3.5 py-1.5 rounded-lg text-[12.5px] font-medium transition ${tab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>
              {t === "all" ? (ar ? "الكل" : "All") : t === "purchase" ? (ar ? "أوامر شراء" : "Purchase") : (ar ? "أوامر بيع" : "Sales")}
            </button>
          ))}
        </div>
        <div className="text-[12px] text-muted-foreground">
          {list.length} {ar ? "طلب" : "orders"} · {money(totalValue, lang)}
        </div>
      </div>

      {list.length === 0 ? (
        <div className={cardCls}>
          <EmptyState icon={<ShoppingCart size={20} />} title="No orders yet" titleAr="لا توجد طلبات بعد"
            hint="Create a purchase order to restock materials, or a sales order to sell products." hintAr="أنشئ أمر شراء لتعبئة المواد، أو أمر بيع لبيع المنتجات."
            action={<button className={btnPrimary} onClick={() => openNew({ kind: "purchase" })}><Plus size={15} />{ar ? "أمر شراء" : "Purchase Order"}</button>} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {list.map((o) => <OrderCard key={o.id} o={o} onEdit={openEdit} />)}
        </div>
      )}

      <OrderModal open={modal} onClose={() => setModal(false)} editing={editing} initial={initial} />
    </div>
  );
}

function Layers(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>;
}
