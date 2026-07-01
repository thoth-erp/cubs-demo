import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { FIN_INVOICES, FIN_PAYMENTS, type FinanceInvoice } from "../lib/finance-data";
import {
  FileText, Plus, Search, X, ChevronDown, ChevronUp,
  Download, Filter, ArrowUpDown, DollarSign, TrendingUp,
  Clock, AlertTriangle, CheckCircle2, Eye, Edit3,
  Receipt, Users, Percent, Calendar, CreditCard,
  Package, Tag, ArrowRight, Trash2,
} from "lucide-react";

// ─── Currency ─────────────────────────────────────────────

const fmtEGP = (n: number) =>
  new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", minimumFractionDigits: 0 }).format(n);

// ─── Status Meta ──────────────────────────────────────────

const STATUS_META: Record<string, { en: string; ar: string; pill: string; dot: string }> = {
  draft:     { en: "Draft",     ar: "مسودة",   pill: "bg-slate-100 text-slate-600",  dot: "bg-slate-400" },
  sent:      { en: "Sent",      ar: "مُرسلة",  pill: "bg-blue-100 text-blue-600",    dot: "bg-blue-500" },
  viewed:    { en: "Viewed",    ar: "تمت المشاهدة", pill: "bg-blue-100 text-blue-500", dot: "bg-blue-400" },
  partial:   { en: "Partial",   ar: "مدفوعة جزئياً", pill: "bg-amber-100 text-amber-600", dot: "bg-amber-500" },
  paid:      { en: "Paid",      ar: "مدفوعة",  pill: "bg-emerald-100 text-emerald-600", dot: "bg-emerald-500" },
  overdue:   { en: "Overdue",   ar: "متأخرة",  pill: "bg-rose-100 text-rose-600",    dot: "bg-rose-500" },
  cancelled: { en: "Cancelled", ar: "ملغاة",   pill: "bg-slate-100 text-slate-500",  dot: "bg-slate-400" },
};

const STATUS_FILTERS: { value: string; en: string; ar: string }[] = [
  { value: "all",       en: "All",       ar: "الكل" },
  { value: "draft",     en: "Draft",     ar: "مسودة" },
  { value: "sent",      en: "Sent",      ar: "مُرسلة" },
  { value: "paid",      en: "Paid",      ar: "مدفوعة" },
  { value: "overdue",   en: "Overdue",   ar: "متأخرة" },
  { value: "partial",   en: "Partial",   ar: "جزئي" },
  { value: "cancelled", en: "Cancelled", ar: "ملغاة" },
];

// ─── Shared UI ────────────────────────────────────────────

const inputCls = "w-full h-10 rounded-xl border border-border/60 bg-background px-3.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition placeholder:text-muted-foreground/50";
const labelCls = "text-[11px] font-medium text-muted-foreground mb-1 block";
const btnPrimary = "flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-foreground text-background text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50";

// ═══════════════════════════════════════════════════════════
// Detail Modal
// ═══════════════════════════════════════════════════════════

function InvoiceDetailModal({
  invoice, payments, ar, onClose,
}: {
  invoice: FinanceInvoice;
  payments: typeof FIN_PAYMENTS;
  ar: boolean;
  onClose: () => void;
}) {
  const s = STATUS_META[invoice.status] ?? STATUS_META.draft;
  const invPayments = payments.filter((p) => p.invoice_id === invoice.id);
  const payMethods: Record<string, { en: string; ar: string }> = {
    bank_transfer: { en: "Bank Transfer", ar: "تحويل بنكي" },
    cash:          { en: "Cash",          ar: "نقدي" },
    card:          { en: "Card",          ar: "بطاقة" },
    mobile_wallet: { en: "Mobile Wallet", ar: "محفظة إلكترونية" },
    cheque:        { en: "Cheque",        ar: "شيك" },
    online:        { en: "Online",        ar: "أونلاين" },
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-background border border-border/40 rounded-2xl shadow-2xl w-full max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center">
                <Receipt size={16} strokeWidth={1.75} className="text-primary" />
              </div>
              <div>
                <h2 className="text-[16px] font-semibold text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>
                  {invoice.invoice_number}
                </h2>
                <p className="text-[11px] text-muted-foreground">{invoice.title}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
              <X size={16} strokeWidth={1.75} className="text-muted-foreground" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Status + Dates */}
            <div className="flex flex-wrap items-center gap-3">
              <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${s.pill}`}>
                {ar ? s.ar : s.en}
              </span>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Calendar size={10} /> {ar ? "تاريخ الإصدار:" : "Issued:"} {invoice.issue_date}
              </span>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Clock size={10} /> {ar ? "الاستحقاق:" : "Due:"} {invoice.due_date}
              </span>
              {invoice.paid_date && (
                <span className="text-[11px] text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={10} /> {ar ? "تم الدفع:" : "Paid:"} {invoice.paid_date}
                </span>
              )}
            </div>

            {/* Customer */}
            <div className="bg-muted/20 rounded-xl px-4 py-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{ar ? "العميل" : "Customer"}</p>
              <p className="text-[13px] font-medium text-foreground">{ar ? invoice.customer_name_ar : invoice.customer_name}</p>
              <p className="text-[11px] text-muted-foreground">{invoice.customer_email} · {invoice.customer_phone}</p>
            </div>

            {/* Items */}
            <div>
              <p className="text-[11px] font-medium text-foreground mb-2">{ar ? "البنود" : "Items"}</p>
              <div className="border border-border/40 rounded-xl overflow-hidden">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border/30">
                      <th className="text-start px-4 py-2.5 font-medium text-muted-foreground">{ar ? "الوصف" : "Description"}</th>
                      <th className="text-center px-3 py-2.5 font-medium text-muted-foreground">{ar ? "الكمية" : "Qty"}</th>
                      <th className="text-end px-3 py-2.5 font-medium text-muted-foreground">{ar ? "السعر" : "Unit Price"}</th>
                      <th className="text-end px-4 py-2.5 font-medium text-muted-foreground">{ar ? "الإجمالي" : "Total"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {invoice.items.map((item, i) => (
                      <tr key={i} className="hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-2.5 text-foreground">{ar ? item.description_ar : item.description}</td>
                        <td className="text-center px-3 py-2.5 text-muted-foreground tabular-nums">{item.quantity}</td>
                        <td className="text-end px-3 py-2.5 text-muted-foreground tabular-nums">{fmtEGP(item.unit_price)}</td>
                        <td className="text-end px-4 py-2.5 text-foreground font-medium tabular-nums">{fmtEGP(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-[260px] space-y-1.5">
                <div className="flex justify-between text-[12px]">
                  <span className="text-muted-foreground">{ar ? "المجموع الفرعي" : "Subtotal"}</span>
                  <span className="text-foreground tabular-nums">{fmtEGP(invoice.subtotal)}</span>
                </div>
                {invoice.discount > 0 && (
                  <div className="flex justify-between text-[12px]">
                    <span className="text-muted-foreground">{ar ? "الخصم" : "Discount"}</span>
                    <span className="text-rose-500 tabular-nums">-{fmtEGP(invoice.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[12px]">
                  <span className="text-muted-foreground">{ar ? "الضريبة" : "Tax"} ({invoice.tax_rate}%)</span>
                  <span className="text-foreground tabular-nums">{fmtEGP(invoice.tax_amount)}</span>
                </div>
                <div className="border-t border-border/40 pt-1.5 flex justify-between text-[14px]">
                  <span className="font-medium text-foreground">{ar ? "الإجمالي" : "Total"}</span>
                  <span className="font-semibold text-foreground tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>{fmtEGP(invoice.total)}</span>
                </div>
                {invoice.paid_amount > 0 && (
                  <div className="flex justify-between text-[12px]">
                    <span className="text-emerald-600">{ar ? "المدفوع" : "Paid"}</span>
                    <span className="text-emerald-600 tabular-nums">{fmtEGP(invoice.paid_amount)}</span>
                  </div>
                )}
                {invoice.balance > 0 && (
                  <div className="flex justify-between text-[12px]">
                    <span className="text-rose-500">{ar ? "المتبقي" : "Balance"}</span>
                    <span className="text-rose-500 tabular-nums font-medium">{fmtEGP(invoice.balance)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment History */}
            {invPayments.length > 0 && (
              <div>
                <p className="text-[11px] font-medium text-foreground mb-2">{ar ? "سجل الدفع" : "Payment History"}</p>
                <div className="border border-border/40 rounded-xl overflow-hidden">
                  <div className="divide-y divide-border/20">
                    {invPayments.map((pay) => {
                      const pm = payMethods[pay.method] ?? { en: pay.method, ar: pay.method };
                      return (
                        <div key={pay.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/10 transition-colors">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                            <CreditCard size={14} strokeWidth={1.75} className="text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] text-foreground">{ar ? pm.ar : pm.en} · {pay.reference}</p>
                            <p className="text-[10px] text-muted-foreground">{pay.date} · {pay.recorded_by}</p>
                          </div>
                          <p className="text-[13px] font-semibold text-emerald-600 tabular-nums shrink-0">{fmtEGP(pay.amount)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {(invoice.notes || invoice.notes_ar) && (
              <div className="bg-muted/20 rounded-xl px-4 py-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{ar ? "ملاحظات" : "Notes"}</p>
                <p className="text-[12px] text-foreground">{ar ? invoice.notes_ar : invoice.notes}</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════
// Create Invoice Modal
// ═══════════════════════════════════════════════════════════

function CreateInvoiceModal({ ar, onClose }: { ar: boolean; onClose: () => void }) {
  const [customer, setCustomer] = useState("");
  const [title, setTitle] = useState("");
  const [items, setItems] = useState<{ desc: string; qty: string; price: string }[]>([
    { desc: "", qty: "1", price: "" },
  ]);
  const [taxRate, setTaxRate] = useState("14");
  const [discount, setDiscount] = useState("0");

  const subtotal = useMemo(() =>
    items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.price) || 0), 0),
  [items]);
  const taxAmt = subtotal * (Number(taxRate) || 0) / 100;
  const total = subtotal + taxAmt - (Number(discount) || 0);

  const addItem = () => setItems((prev) => [...prev, { desc: "", qty: "1", price: "" }]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, key: string, val: string) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [key]: val } : it)));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="bg-background border border-border/40 rounded-2xl shadow-2xl w-full max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center">
              <Plus size={16} strokeWidth={1.75} className="text-primary" />
            </div>
            <h2 className="text-[16px] font-semibold text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>
              {ar ? "إنشاء فاتورة جديدة" : "Create New Invoice"}
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
            <X size={16} strokeWidth={1.75} className="text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Customer */}
          <div>
            <label className={labelCls}>{ar ? "العميل" : "Customer"} *</label>
            <input value={customer} onChange={(e) => setCustomer(e.target.value)}
              placeholder={ar ? "اسم العميل" : "Customer name"} className={inputCls} />
          </div>

          {/* Title */}
          <div>
            <label className={labelCls}>{ar ? "عنوان الفاتورة" : "Invoice Title"} *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder={ar ? "عنوان الفاتورة" : "Invoice title"} className={inputCls} />
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelCls + " !mb-0"}>{ar ? "البنود" : "Items"}</label>
              <button onClick={addItem}
                className="text-[11px] text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors">
                <Plus size={12} /> {ar ? "إضافة بند" : "Add Item"}
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input value={item.desc} onChange={(e) => updateItem(idx, "desc", e.target.value)}
                    placeholder={ar ? "الوصف" : "Description"}
                    className={inputCls + " flex-1"} />
                  <input type="number" min="1" value={item.qty} onChange={(e) => updateItem(idx, "qty", e.target.value)}
                    className={inputCls + " w-[60px] text-center"} />
                  <input type="number" min="0" value={item.price} onChange={(e) => updateItem(idx, "price", e.target.value)}
                    placeholder={ar ? "السعر" : "Price"}
                    className={inputCls + " w-[100px] text-right"} />
                  {items.length > 1 && (
                    <button onClick={() => removeItem(idx)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-rose-50 text-rose-500 transition-colors shrink-0">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tax + Discount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{ar ? "معدل الضريبة %" : "Tax Rate %"}</label>
              <input type="number" min="0" max="100" value={taxRate} onChange={(e) => setTaxRate(e.target.value)}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{ar ? "الخصم" : "Discount"}</label>
              <input type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)}
                className={inputCls} />
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-border/40 pt-3 space-y-1.5">
            <div className="flex justify-between text-[12px]">
              <span className="text-muted-foreground">{ar ? "المجموع الفرعي" : "Subtotal"}</span>
              <span className="tabular-nums">{fmtEGP(subtotal)}</span>
            </div>
            {(Number(discount) || 0) > 0 && (
              <div className="flex justify-between text-[12px]">
                <span className="text-muted-foreground">{ar ? "الخصم" : "Discount"}</span>
                <span className="text-rose-500 tabular-nums">-{fmtEGP(Number(discount))}</span>
              </div>
            )}
            <div className="flex justify-between text-[12px]">
              <span className="text-muted-foreground">{ar ? "الضريبة" : "Tax"} ({taxRate}%)</span>
              <span className="tabular-nums">{fmtEGP(taxAmt)}</span>
            </div>
            <div className="border-t border-border/40 pt-1.5 flex justify-between text-[15px]">
              <span className="font-medium">{ar ? "الإجمالي" : "Total"}</span>
              <span className="font-semibold tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>{fmtEGP(total)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border/40">
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            {ar ? "إلغاء" : "Cancel"}
          </button>
          <button
            disabled={!customer || !title || items.every((i) => !i.desc)}
            className={btnPrimary + " !bg-primary"}
          >
            {ar ? "إنشاء الفاتورة" : "Create Invoice"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════

export default function FinanceInvoices() {
  const { lang } = useLanguage();
  const ar = lang === "ar";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<"date" | "amount" | "status">("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<FinanceInvoice | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // ── KPIs ──
  const totalInvoiced = useMemo(() => FIN_INVOICES.reduce((s, i) => s + i.total, 0), []);
  const totalCollected = useMemo(() => FIN_INVOICES.reduce((s, i) => s + i.paid_amount, 0), []);
  const totalOutstanding = useMemo(() =>
    FIN_INVOICES.filter((i) => ["sent", "viewed", "partial"].includes(i.status)).reduce((s, i) => s + i.balance, 0),
  []);
  const totalOverdue = useMemo(() =>
    FIN_INVOICES.filter((i) => i.status === "overdue").reduce((s, i) => s + i.balance, 0),
  []);
  const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

  // ── Filtering + Sorting ──
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = FIN_INVOICES.filter((inv) => {
      const matchSearch = !q ||
        inv.invoice_number.toLowerCase().includes(q) ||
        inv.customer_name.toLowerCase().includes(q) ||
        inv.customer_name_ar.includes(q) ||
        inv.title.toLowerCase().includes(q) ||
        inv.title_ar.includes(q);
      const matchStatus = statusFilter === "all" || inv.status === statusFilter;
      return matchSearch && matchStatus;
    });

    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === "date") cmp = a.issue_date.localeCompare(b.issue_date);
      else if (sortField === "amount") cmp = a.total - b.total;
      else if (sortField === "status") cmp = a.status.localeCompare(b.status);
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [search, statusFilter, sortField, sortAsc]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => (
    <span className="inline-flex flex-col -space-y-0.5 ms-1">
      <ChevronUp size={10} className={`${sortField === field && sortAsc ? "text-primary" : "text-muted-foreground/30"}`} />
      <ChevronDown size={10} className={`${sortField === field && !sortAsc ? "text-primary" : "text-muted-foreground/30"}`} />
    </span>
  );

  const kpis = [
    { label: ar ? "إجمالي الفواتير" : "Total Invoiced", value: fmtEGP(totalInvoiced), icon: FileText, color: "text-primary", bg: "bg-primary/8" },
    { label: ar ? "المحصل" : "Total Collected", value: fmtEGP(totalCollected), icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", trend: "+8%", up: true },
    { label: ar ? "المعلق" : "Outstanding", value: fmtEGP(totalOutstanding), icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
    { label: ar ? "المتأخر" : "Overdue", value: fmtEGP(totalOverdue), icon: AlertTriangle, color: "text-rose-500", bg: "bg-rose-50" },
    { label: ar ? "نسبة التحصيل" : "Collection Rate", value: `${collectionRate}%`, icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-50" },
  ];

  return (
    <div className="min-h-full">
      {/* ── Header ── */}
      <div className="border-b border-border/40 px-8 md:px-10 py-8"
        style={{ background: "linear-gradient(160deg, hsl(var(--muted)/0.3) 0%, hsl(var(--background)) 60%)" }}>
        <div className="max-w-[1200px]">
          <p className="text-[11px] text-muted-foreground/60 tracking-[0.08em] uppercase mb-2">
            {ar ? "المالية" : "Finance"}
          </p>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-[26px] font-medium text-foreground leading-tight"
              style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.025em" }}>
              {ar ? "الفواتير" : "Invoices"}
            </h1>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 h-9 px-3.5 rounded-xl border border-border/60 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Download size={13} strokeWidth={1.75} />
                {ar ? "تصدير" : "Export"}
              </button>
              <button onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 h-9 px-4 rounded-xl bg-foreground text-background text-[12px] font-medium hover:opacity-90 transition-opacity">
                <Plus size={13} strokeWidth={2} />
                {ar ? "فاتورة جديدة" : "New Invoice"}
              </button>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {kpis.map((m, i) => (
              <div key={i} className="bg-background border border-border/40 rounded-xl px-4 py-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-7 h-7 rounded-lg ${m.bg} flex items-center justify-center`}>
                    <m.icon size={14} strokeWidth={1.75} className={m.color} />
                  </div>
                  {m.trend && (
                    <span className={`text-[10px] font-medium ${m.up ? "text-emerald-600" : "text-rose-500"}`}>
                      {m.trend}
                    </span>
                  )}
                </div>
                <p className="text-[17px] font-medium text-foreground leading-none tabular-nums mb-1"
                  style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.02em" }}>
                  {m.value}
                </p>
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/40">
        <div className="px-8 md:px-10 py-3 max-w-[1200px]">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[200px] flex-1 max-w-[280px]">
              <Search size={13} strokeWidth={1.75} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder={ar ? "بحث بالفاتورة أو العميل…" : "Search invoices or customers…"}
                className="w-full h-9 ps-8 pe-4 rounded-xl border border-border/80 bg-card text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors" />
            </div>

            <div className="h-5 w-px bg-border/60 hidden sm:block" />
            <div className="flex items-center gap-1.5 flex-wrap">
              {STATUS_FILTERS.map((f) => (
                <button key={f.value} onClick={() => setStatusFilter(f.value)}
                  className={`h-7 px-3 rounded-lg text-[12px] font-medium border transition-all ${statusFilter === f.value ? "bg-primary/8 text-primary border-primary/25" : "bg-card border-border text-muted-foreground hover:text-foreground"}`}>
                  {ar ? f.ar : f.en}
                </button>
              ))}
            </div>

            {search && (
              <button onClick={() => setSearch("")}
                className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-[12px] text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent hover:border-border transition-all">
                <X size={11} strokeWidth={2} />{ar ? "مسح" : "Clear"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="px-8 md:px-10 py-6 max-w-[1200px]">
        <p className="text-[12px] text-muted-foreground mb-4">
          {ar ? `${filtered.length} فاتورة` : `${filtered.length} invoice${filtered.length !== 1 ? "s" : ""}`}
        </p>

        <div className="border border-border/40 rounded-xl overflow-hidden bg-background">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-muted/30 border-b border-border/30">
                  <th className="text-start px-5 py-3 font-medium text-muted-foreground whitespace-nowrap">
                    {ar ? "رقم الفاتورة" : "Invoice #"}
                  </th>
                  <th className="text-start px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                    {ar ? "العميل" : "Customer"}
                  </th>
                  <th className="text-start px-4 py-3 font-medium text-muted-foreground whitespace-nowrap cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => toggleSort("date")}>
                    <span className="inline-flex items-center">{ar ? "التاريخ" : "Date"}<SortIcon field="date" /></span>
                  </th>
                  <th className="text-start px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                    {ar ? "الاستحقاق" : "Due Date"}
                  </th>
                  <th className="text-end px-4 py-3 font-medium text-muted-foreground whitespace-nowrap cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => toggleSort("amount")}>
                    <span className="inline-flex items-center justify-end">{ar ? "المبلغ" : "Amount"}<SortIcon field="amount" /></span>
                  </th>
                  <th className="text-end px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                    {ar ? "المدفوع" : "Paid"}
                  </th>
                  <th className="text-end px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                    {ar ? "المتبقي" : "Balance"}
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground whitespace-nowrap cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => toggleSort("status")}>
                    <span className="inline-flex items-center justify-center">{ar ? "الحالة" : "Status"}<SortIcon field="status" /></span>
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                    {ar ? "إجراءات" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {filtered.map((inv) => {
                  const s = STATUS_META[inv.status] ?? STATUS_META.draft;
                  return (
                    <tr key={inv.id}
                      className="hover:bg-muted/15 transition-colors cursor-pointer group"
                      onClick={() => setSelectedInvoice(inv)}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                            <Receipt size={13} strokeWidth={1.75} className="text-primary" />
                          </div>
                          <span className="font-mono text-foreground group-hover:text-primary transition-colors">{inv.invoice_number}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-[12px] font-medium text-foreground truncate max-w-[140px]">
                          {ar ? inv.customer_name_ar : inv.customer_name}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">{inv.title}</p>
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground tabular-nums whitespace-nowrap">{inv.issue_date}</td>
                      <td className="px-4 py-3.5 text-muted-foreground tabular-nums whitespace-nowrap">{inv.due_date}</td>
                      <td className="px-4 py-3.5 text-end font-medium text-foreground tabular-nums whitespace-nowrap"
                        style={{ fontFamily: "var(--app-font-serif)" }}>
                        {fmtEGP(inv.total)}
                      </td>
                      <td className="px-4 py-3.5 text-end text-emerald-600 tabular-nums whitespace-nowrap">
                        {inv.paid_amount > 0 ? fmtEGP(inv.paid_amount) : "—"}
                      </td>
                      <td className="px-4 py-3.5 text-end tabular-nums whitespace-nowrap font-medium"
                        style={{ color: inv.balance > 0 ? "var(--foreground)" : "var(--muted-foreground)" }}>
                        {fmtEGP(inv.balance)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full ${s.pill}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {ar ? s.ar : s.en}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedInvoice(inv); }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
                            title={ar ? "عرض" : "View"}>
                            <Eye size={13} strokeWidth={1.75} className="text-muted-foreground" />
                          </button>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
                            title={ar ? "تعديل" : "Edit"}>
                            <Edit3 size={13} strokeWidth={1.75} className="text-muted-foreground" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-14 text-center">
                      <p className="text-[13px] text-muted-foreground/60">
                        {ar ? "لا توجد فواتير" : "No invoices found"}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {selectedInvoice && (
          <InvoiceDetailModal
            invoice={selectedInvoice}
            payments={FIN_PAYMENTS}
            ar={ar}
            onClose={() => setSelectedInvoice(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showCreate && (
          <CreateInvoiceModal ar={ar} onClose={() => setShowCreate(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
