/**
 * Procurement — Purchase Orders (buy raw materials) & Sales Orders (sell products).
 *
 * Line items can be picked from THREE sources, which is the heart of the brief:
 *   • a Product  (from the Products module)
 *   • a Material variant (from Raw Materials)
 *   • a Custom one-off item
 *
 * Confirming + receiving a PO adds stock; fulfilling a SO consumes stock through
 * each product's BOM — so Procurement drives Inventory in real time. A smart
 * layer suggests POs from low stock and pre-fills SOs from a product.
 */

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import {
  ShoppingCart, Plus, Trash2, Edit3, Sparkles, PackageCheck, Truck as TruckIcon,
  ArrowRight, CheckCircle2, Clock, XCircle, Boxes, Wand2, FileText, Download, Search, Info, AlertTriangle,
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

// ─── Line editor ────────────────────────────────────────────

function LineEditor({ kind, lines, setLines, products, rawMaterials, lang }: {
  kind: OrderKind; lines: OrderLine[]; setLines: (l: OrderLine[]) => void;
  products: Product[]; rawMaterials: RawMaterial[]; lang: "en" | "ar";
}) {
  const ar = lang === "ar";
  const [refType, setRefType] = useState<"product" | "material" | "custom">(kind === "sales" ? "product" : "material");
  const [refId, setRefId] = useState("");
  const [varId, setVarId] = useState("");
  const [customName, setCustomName] = useState("");
  const [qty, setQty] = useState<number>(1);
  const [price, setPrice] = useState<number>(0);
  const [prodSearch, setProdSearch] = useState("");
  const [rmSearch, setRmSearch] = useState("");
  const [varSearch, setVarSearch] = useState("");

  const rm = rawMaterials.find((r) => r.id === refId);
  const product = products.find((p) => p.id === refId);

  // Default price from the chosen source.
  useEffect(() => {
    if (refType === "product" && product) setPrice(product.price);
    else if (refType === "material" && rm) { const v = rm.variants.find((x) => x.id === varId); if (v) setPrice(v.cost); }
  }, [refType, refId, varId]); // eslint-disable-line

  const add = () => {
    let line: OrderLine | null = null;
    if (refType === "product" && product) {
      line = { id: uidLine(), refType, refId: product.id, name: ar ? (product.nameAr || product.name) : product.name, sku: product.sku, qty, unitPrice: price };
    } else if (refType === "material" && rm && varId) {
      const v = rm.variants.find((x) => x.id === varId);
      line = { id: uidLine(), refType, refId: rm.id, variantId: varId, name: `${ar ? (rm.nameAr || rm.name) : rm.name} · ${v?.colourName ? tx(v.colourName, lang) : ""}${v?.sizeCode ? " " + v.sizeCode : ""}`.trim(), sku: v?.sku, unit: ar ? rm.unitAr : rm.unitEn, qty, unitPrice: price };
    } else if (refType === "custom" && customName) {
      line = { id: uidLine(), refType, name: customName, qty, unitPrice: price };
    }
    if (!line) return;
    setLines([...lines, line]);
    setRefId(""); setVarId(""); setCustomName(""); setQty(1); setPrice(0);
  };

  const total = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);

  return (
    <div className="rounded-xl border border-border/60 overflow-hidden">
      <div className="px-4 py-2.5 bg-muted/40 border-b border-border/50 flex items-center gap-2">
        <Boxes size={15} className="text-primary" />
        <span className="text-[13px] font-semibold">{ar ? "بنود الطلب" : "Order lines"}</span>
      </div>
      <div className="p-4 space-y-3">
        {/* source selector */}
        <div className="inline-flex rounded-lg border border-border/60 p-0.5 bg-muted/30">
          {(["product", "material", "custom"] as const).map((t) => (
            <button key={t} type="button" onClick={() => { setRefType(t); setRefId(""); setVarId(""); }}
              className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition ${refType === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>
              {t === "product" ? (ar ? "منتج" : "Product") : t === "material" ? (ar ? "مادة خام" : "Material") : (ar ? "بند مخصص" : "Custom")}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto_auto] gap-2 items-end">
          {refType === "product" && (
            <div className="sm:col-span-2">
              <label className={labelCls}>{ar ? "المنتج" : "Product"}</label>
              <div className="relative">
                <Search size={13} className="absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 z-10" />
                <select className={selectCls + " ps-8"} value={refId} onChange={(e) => setRefId(e.target.value)}>
                  <option value="">{ar ? "اختر منتج" : "Select product"}</option>
                  {products.filter((p) => !prodSearch || p.name.toLowerCase().includes(prodSearch.toLowerCase()) || (p.nameAr || "").includes(prodSearch)).map((p) => <option key={p.id} value={p.id}>{ar ? (p.nameAr || p.name) : p.name} · {p.sku}</option>)}
                </select>
              </div>
            </div>
          )}
          {refType === "material" && <>
            <div>
              <label className={labelCls}>{ar ? "المادة الخام" : "Raw material"}</label>
              <div className="relative">
                <Search size={13} className="absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 z-10" />
                <select className={selectCls + " ps-8"} value={refId} onChange={(e) => { setRefId(e.target.value); setVarId(""); }}>
                  <option value="">{ar ? "اختر" : "Select"}</option>
                  {rawMaterials.filter((r) => !rmSearch || r.name.toLowerCase().includes(rmSearch.toLowerCase()) || (r.nameAr || "").includes(rmSearch)).map((r) => <option key={r.id} value={r.id}>{ar ? (r.nameAr || r.name) : r.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>{ar ? "المتغير" : "Variant"}</label>
              <select className={selectCls} value={varId} disabled={!rm} onChange={(e) => setVarId(e.target.value)}>
                <option value="">{ar ? "اختر" : "Select"}</option>
                {rm?.variants.filter((v) => !varSearch || v.sku.toLowerCase().includes(varSearch.toLowerCase())).map((v) => <option key={v.id} value={v.id}>{v.sku}</option>)}
              </select>
            </div>
          </>}
          {refType === "custom" && (
            <div className="sm:col-span-2">
              <label className={labelCls}>{ar ? "اسم البند" : "Item name"}</label>
              <input className={inputCls} value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder={ar ? "بند مخصص..." : "Custom item…"} />
            </div>
          )}
          <div className="w-20"><label className={labelCls}>{ar ? "الكمية" : "Qty"}</label><input type="number" className={inputCls} value={qty || ""} onChange={(e) => setQty(Number(e.target.value))} /></div>
          <div className="w-24"><label className={labelCls}>{ar ? "السعر" : "Price"}</label><input type="number" className={inputCls} value={price || ""} onChange={(e) => setPrice(Number(e.target.value))} /></div>
          <button type="button" className={btnPrimary + " h-10"} onClick={add}><Plus size={14} />{ar ? "إضافة" : "Add"}</button>
        </div>

        {lines.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-border/50">
            <table className="w-full text-[12px]">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-start [&>th]:font-medium">
                  <th>{ar ? "البند" : "Item"}</th><th>{ar ? "النوع" : "Type"}</th><th>{ar ? "الكمية" : "Qty"}</th><th>{ar ? "السعر" : "Unit"}</th><th>{ar ? "الإجمالي" : "Total"}</th><th></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {lines.map((l) => (
                  <tr key={l.id} className="[&>td]:px-3 [&>td]:py-2">
                    <td><span className="font-medium">{l.name}</span>{l.sku && <span className="ms-1.5 font-mono text-[10.5px] text-muted-foreground">{l.sku}</span>}</td>
                    <td><span className={chipCls + " text-[10px] py-0.5"}>{l.refType === "product" ? (ar ? "منتج" : "Product") : l.refType === "material" ? (ar ? "خام" : "Material") : (ar ? "مخصص" : "Custom")}</span></td>
                    <td>{l.qty}{l.unit ? " " + l.unit : ""}</td>
                    <td>{money(l.unitPrice, lang)}</td>
                    <td className="font-medium">{money(l.qty * l.unitPrice, lang)}</td>
                    <td><button className={btnGhost} onClick={() => setLines(lines.filter((x) => x.id !== l.id))}><Trash2 size={13} /></button></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border/50 bg-muted/20"><td colSpan={4} className="px-3 py-2 text-end font-medium">{ar ? "الإجمالي" : "Total"}</td><td className="px-3 py-2 font-semibold">{money(total, lang)}</td><td /></tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Order modal ────────────────────────────────────────────

interface Draft { kind: OrderKind; party: string; expectedDate: string; notes: string; lines: OrderLine[]; status: OrderStatus }

function OrderModal({ open, onClose, editing, initial }: { open: boolean; onClose: () => void; editing: Order | null; initial: Partial<Draft> | null }) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const { products, rawMaterials } = useCubs();
  const [d, setD] = useState<Draft>({ kind: "purchase", party: "", expectedDate: "", notes: "", lines: [], status: "draft" });
  const [inited, setInited] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  if (open && !inited) {
    if (editing) setD({ kind: editing.kind, party: editing.party, expectedDate: editing.expectedDate || "", notes: editing.notes || "", lines: editing.lines, status: editing.status });
    else setD({ kind: initial?.kind || "purchase", party: initial?.party || "", expectedDate: "", notes: initial?.notes || "", lines: initial?.lines || [], status: "draft" });
    setInited(true); setShowErrors(false);
  }
  if (!open && inited) setInited(false);

  const total = d.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);

  const save = () => {
    setShowErrors(true);
    if (!d.party || d.lines.length === 0) return;
    if (editing) updateOrder(editing.id, { kind: d.kind, party: d.party, expectedDate: d.expectedDate, notes: d.notes, lines: d.lines });
    else addOrder({ kind: d.kind, number: nextOrderNumber(d.kind), party: d.party, status: "draft", lines: d.lines, notes: d.notes, expectedDate: d.expectedDate });
    onClose();
  };

  const isPO = d.kind === "purchase";

  return (
    <Modal open={open} onClose={onClose} wide
      title={editing ? "Edit Order" : (isPO ? "New Purchase Order" : "New Sales Order")}
      titleAr={editing ? "تعديل طلب" : (isPO ? "أمر شراء جديد" : "أمر بيع جديد")}
      footer={<>
        <span className="me-auto text-[13px]">{ar ? "الإجمالي:" : "Total:"} <b>{money(total, lang)}</b></span>
        <button className={btnSecondary} onClick={onClose}>{ar ? "إلغاء" : "Cancel"}</button>
        <button className={btnPrimary} onClick={save}>{ar ? "حفظ الطلب" : "Save order"}</button>
      </>}>
      <div className="space-y-4">
        {showErrors && (!d.party || d.lines.length === 0) && (
          <div className="rounded-xl border border-red-300/50 bg-red-50/60 dark:bg-red-500/5 p-3 space-y-1.5">
            {!d.party && <div className="flex items-start gap-2 text-[12px] text-red-600"><AlertTriangle size={13} className="shrink-0 mt-0.5" /><span>{ar ? "يجب إدخال اسم المورّد أو العميل" : "Supplier/Customer name is required"}</span></div>}
            {d.lines.length === 0 && <div className="flex items-start gap-2 text-[12px] text-red-600"><AlertTriangle size={13} className="shrink-0 mt-0.5" /><span>{ar ? "يجب إضافة بند واحد على الأقل" : "At least one line item is required"}</span></div>}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>{ar ? "نوع الطلب" : "Order type"}</label>
            <div className="inline-flex rounded-lg border border-border/60 p-0.5 bg-muted/30 w-full">
              {(["purchase", "sales"] as const).map((k) => (
                <button key={k} type="button" disabled={!!editing} onClick={() => setD({ ...d, kind: k })}
                  className={`flex-1 px-3 py-1.5 rounded-md text-[12px] font-medium transition ${d.kind === k ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>
                  {k === "purchase" ? (ar ? "أمر شراء (مورّد)" : "Purchase (supplier)") : (ar ? "أمر بيع (عميل)" : "Sales (customer)")}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>{isPO ? (ar ? "المورّد" : "Supplier") : (ar ? "العميل" : "Customer")}</label>
            <input className={showErrors && !d.party ? inputErrorCls : inputCls} value={d.party} onChange={(e) => setD({ ...d, party: e.target.value })} placeholder={isPO ? "YKK Egypt" : "Zamalek Outfitters"} />
            {showErrors && !d.party && <FieldError message={ar ? "يجب إدخال الاسم" : "Name is required"} ar={ar} />}
          </div>
          <div>
            <label className={labelCls}>{ar ? "التاريخ المتوقع" : "Expected date"}</label>
            <input type="date" className={inputCls} value={d.expectedDate} onChange={(e) => setD({ ...d, expectedDate: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>{ar ? "ملاحظات" : "Notes"}</label>
            <input className={inputCls} value={d.notes} onChange={(e) => setD({ ...d, notes: e.target.value })} placeholder={ar ? "ملاحظة..." : "Note…"} />
          </div>
        </div>
        <LineEditor kind={d.kind} lines={d.lines} setLines={(l) => setD({ ...d, lines: l })} products={products} rawMaterials={rawMaterials} lang={lang} />
      </div>
    </Modal>
  );
}

// ─── Status pill + order card ───────────────────────────────

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

function OrderCard({ o, onEdit }: { o: Order; onEdit: (o: Order) => void }) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const total = o.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const isPO = o.kind === "purchase";

  return (
    <div className={cardCls + " p-4"}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] font-semibold ${isPO ? "bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300" : "bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300"}`}>
              {isPO ? <ShoppingCart size={11} /> : <TruckIcon size={11} />}{isPO ? (ar ? "شراء" : "PO") : (ar ? "بيع" : "SO")}
            </span>
            <span className="font-mono text-[12px] font-semibold text-foreground">{o.number}</span>
            <StatusPill status={o.status} lang={lang} />
          </div>
          <p className="text-[13.5px] font-medium text-foreground truncate">{o.party}</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {o.lines.length} {ar ? "بند" : "line(s)"} · {money(total, lang)}{o.expectedDate ? ` · ${o.expectedDate}` : ""}
          </p>
          {o.notes && <p className="text-[11.5px] text-muted-foreground/80 mt-1 italic line-clamp-1">{o.notes}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button className={btnGhost} onClick={() => onEdit(o)}><Edit3 size={14} /></button>
          <button className={btnGhost} onClick={() => { if (confirm(ar ? "حذف الطلب؟" : "Delete order?")) removeOrder(o.id); }}><Trash2 size={14} /></button>
        </div>
      </div>

      {/* line preview */}
      <div className="mt-3 space-y-1">
        {o.lines.slice(0, 3).map((l) => (
          <div key={l.id} className="flex items-center justify-between text-[12px] text-muted-foreground">
            <span className="truncate">{l.qty}× {l.name}</span>
            <span className="shrink-0 ms-2">{money(l.qty * l.unitPrice, lang)}</span>
          </div>
        ))}
        {o.lines.length > 3 && <p className="text-[11px] text-muted-foreground/60">+{o.lines.length - 3} {ar ? "المزيد" : "more"}</p>}
      </div>

      {/* status actions */}
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

  // Smart deep-links: /procurement?suggest=1 (draft PO from low stock) · ?so=<productId> (SO for a product)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("suggest") === "1" && alerts.length) { draftReorderPO(); window.history.replaceState({}, "", "/procurement"); }
    else if (q.get("so")) {
      const p = products.find((x) => x.id === q.get("so"));
      if (p) { openNew({ kind: "sales", party: "", lines: [{ id: uidLine(), refType: "product", refId: p.id, name: ar ? (p.nameAr || p.name) : p.name, sku: p.sku, qty: 1, unitPrice: p.price }] }); window.history.replaceState({}, "", "/procurement"); }
    }
  }, []); // eslint-disable-line

  const openNew = (init?: Partial<Draft>) => { setEditing(null); setInitial(init || null); setModal(true); };
  const openEdit = (o: Order) => { setInitial(null); setEditing(o); setModal(true); };

  function draftReorderPO() {
    const lines: OrderLine[] = alerts.map(({ rm, variant, deficit }) => ({
      id: uidLine(), refType: "material", refId: rm.id, variantId: variant.id,
      name: `${rm.name} · ${variant.colourName ? tx(variant.colourName, lang) : ""}${variant.sizeCode ? " " + variant.sizeCode : ""}`.trim(),
      sku: variant.sku, unit: rm.unitEn, qty: deficit, unitPrice: variant.cost,
    }));
    const supplier = alerts[0]?.rm.supplier || "";
    openNew({ kind: "purchase", party: supplier, notes: ar ? "إعادة تعبئة تلقائية للمواد تحت حد الطلب" : "Auto reorder for materials below reorder point", lines });
  }

  const list = useMemo(() => orders.filter((o) => tab === "all" || o.kind === tab), [orders, tab]);

  // Sales-order fulfilment feasibility hints
  const unbuildable = useMemo(() => orders.filter((o) => o.kind === "sales" && o.status === "confirmed").flatMap((o) =>
    o.lines.filter((l) => l.refType === "product" && l.refId).map((l) => {
      const p = products.find((x) => x.id === l.refId); if (!p) return null;
      const b = buildability(p, l.qty); return b.ok ? null : { order: o, product: p, shortfalls: b.shortfalls };
    }).filter(Boolean)
  ), [orders, products, rawMaterials]);

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

      {/* Smart layer */}
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

      {/* tabs */}
      <div className="inline-flex rounded-lg border border-border/60 p-0.5 bg-muted/30 mb-4">
        {(["all", "purchase", "sales"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3.5 py-1.5 rounded-md text-[12.5px] font-medium transition ${tab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>
            {t === "all" ? (ar ? "الكل" : "All") : t === "purchase" ? (ar ? "أوامر شراء" : "Purchase") : (ar ? "أوامر بيع" : "Sales")}
          </button>
        ))}
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
