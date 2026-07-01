import { useState, useMemo } from "react";
import { useLanguage } from "../context/LanguageContext";
import { FIN_EXPENSES, FIN_BUDGETS, type FinanceExpense } from "../lib/finance-data";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, X, Filter, DollarSign, Clock, CheckCircle2,
  CreditCard, TrendingUp, AlertTriangle, ChevronDown,
  MoreHorizontal, Edit3, Trash2, Eye, Send, FileText,
  Building2, Calendar, Receipt, ArrowUpRight,
} from "lucide-react";

// ─── Constants ─────────────────────────────────────────────

const CATEGORY_META: Record<string, { en: string; ar: string; color: string; bg: string }> = {
  rent:          { en: "Rent",          ar: "الإيجار",         color: "text-blue-600",   bg: "bg-blue-50 border-blue-200" },
  utilities:     { en: "Utilities",     ar: "المرافق",         color: "text-cyan-600",   bg: "bg-cyan-50 border-cyan-200" },
  salaries:      { en: "Salaries",      ar: "الرواتب",         color: "text-violet-600", bg: "bg-violet-50 border-violet-200" },
  marketing:     { en: "Marketing",     ar: "التسويق",         color: "text-amber-600",  bg: "bg-amber-50 border-amber-200" },
  supplies:      { en: "Supplies",      ar: "المستلزمات",      color: "text-emerald-600",bg: "bg-emerald-50 border-emerald-200" },
  travel:        { en: "Travel",        ar: "السفر",           color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
  insurance:     { en: "Insurance",     ar: "التأمين",         color: "text-rose-600",   bg: "bg-rose-50 border-rose-200" },
  maintenance:   { en: "Maintenance",   ar: "الصيانة",         color: "text-teal-600",   bg: "bg-teal-50 border-teal-200" },
  technology:    { en: "Technology",    ar: "التكنولوجيا",     color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-200" },
  professional:  { en: "Professional",  ar: "الخدمات المهنية",  color: "text-slate-600",  bg: "bg-slate-50 border-slate-200" },
  other:         { en: "Other",         ar: "أخرى",            color: "text-gray-600",   bg: "bg-gray-50 border-gray-200" },
};

const STATUS_META: Record<string, { en: string; ar: string; color: string; bg: string }> = {
  draft:    { en: "Draft",    ar: "مسودة",    color: "text-gray-600",    bg: "bg-gray-50 border-gray-200" },
  pending:  { en: "Pending",  ar: "قيد المراجعة", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  approved: { en: "Approved", ar: "تمت الموافقة", color: "text-blue-600",  bg: "bg-blue-50 border-blue-200" },
  paid:     { en: "Paid",     ar: "مدفوع",    color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
  rejected: { en: "Rejected", ar: "مرفوض",    color: "text-red-600",     bg: "bg-red-50 border-red-200" },
};

const CATEGORY_OPTIONS = [
  { value: "all", en: "All Categories", ar: "كل الفئات" },
  { value: "rent", en: "Rent", ar: "الإيجار" },
  { value: "utilities", en: "Utilities", ar: "المرافق" },
  { value: "salaries", en: "Salaries", ar: "الرواتب" },
  { value: "marketing", en: "Marketing", ar: "التسويق" },
  { value: "supplies", en: "Supplies", ar: "المستلزمات" },
  { value: "travel", en: "Travel", ar: "السفر" },
  { value: "insurance", en: "Insurance", ar: "التأمين" },
  { value: "maintenance", en: "Maintenance", ar: "الصيانة" },
  { value: "technology", en: "Technology", ar: "التكنولوجيا" },
  { value: "professional", en: "Professional", ar: "الخدمات المهنية" },
  { value: "other", en: "Other", ar: "أخرى" },
];

const STATUS_OPTIONS = [
  { value: "all", en: "All Statuses", ar: "كل الحالات" },
  { value: "draft", en: "Draft", ar: "مسودة" },
  { value: "pending", en: "Pending", ar: "قيد المراجعة" },
  { value: "approved", en: "Approved", ar: "تمت الموافقة" },
  { value: "paid", en: "Paid", ar: "مدفوع" },
  { value: "rejected", en: "Rejected", ar: "مرفوض" },
];

function fmtEGP(n: number) {
  return new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", minimumFractionDigits: 0 }).format(n);
}

// ─── KPI Card ──────────────────────────────────────────────

function KpiCard({ icon: Icon, labelEn, labelAr, value, sub, color }: {
  icon: React.ElementType; labelEn: string; labelAr: string; value: string; sub?: string; color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/40 bg-card p-5 relative overflow-hidden group hover:shadow-md transition-shadow"
    >
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.04] -translate-y-8 translate-x-8" style={{ background: color }} />
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center`} style={{ background: `${color}12` }}>
          <Icon size={17} style={{ color }} strokeWidth={1.8} />
        </div>
        <ArrowUpRight size={14} className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
      </div>
      <p className="text-[11px] text-muted-foreground tracking-wide uppercase mb-1">{labelEn}</p>
      <p className="text-[22px] font-semibold text-foreground tracking-tight">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
    </motion.div>
  );
}

// ─── Add Expense Modal ─────────────────────────────────────

function AddExpenseModal({ open, onClose, onAdd, lang }: {
  open: boolean; onClose: () => void; onAdd: (e: Omit<FinanceExpense, "id" | "workspace_id">) => void; lang: "en" | "ar";
}) {
  const ar = lang === "ar";
  const [vendor, setVendor] = useState("");
  const [vendorAr, setVendorAr] = useState("");
  const [category, setCategory] = useState<FinanceExpense["category"]>("supplies");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");

  if (!open) return null;

  const handleSubmit = () => {
    if (!vendor.trim() || !amount) return;
    onAdd({
      vendor: vendor.trim(),
      vendor_ar: vendorAr.trim() || vendor.trim(),
      category,
      description: description.trim(),
      description_ar: descriptionAr.trim() || description.trim(),
      amount: Number(amount),
      currency: "EGP",
      status: "draft",
      date,
      due_date: date,
      approved_by: null,
      approved_at: null,
      paid_at: null,
      payment_method: "bank_transfer",
      receipt_url: null,
      branch: "All",
      recurring: false,
    });
    setVendor(""); setVendorAr(""); setCategory("supplies"); setAmount(""); setDate(new Date().toISOString().slice(0, 10)); setDescription(""); setDescriptionAr("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-foreground/20 backdrop-blur-[3px]" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="relative bg-background border border-border/60 rounded-2xl shadow-xl w-full max-w-[560px] overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
          <h2 className="text-[15px] font-medium text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>
            {ar ? "إضافة مصروف" : "Add Expense"}
          </h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X size={14} strokeWidth={2} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-muted-foreground tracking-wide uppercase mb-1.5 block">{ar ? "المورد" : "Vendor"} *</label>
              <input value={vendor} onChange={(e) => setVendor(e.target.value)} className="w-full h-9 px-3 rounded-xl border border-border/80 bg-card text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors" placeholder={ar ? "اسم المورد" : "Vendor name"} />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground tracking-wide uppercase mb-1.5 block">{ar ? "المورد (عربي)" : "Vendor (Arabic)"}</label>
              <input value={vendorAr} onChange={(e) => setVendorAr(e.target.value)} className="w-full h-9 px-3 rounded-xl border border-border/80 bg-card text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors" placeholder={ar ? "اسم المورد بالعربي" : "Arabic vendor name"} dir="rtl" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-muted-foreground tracking-wide uppercase mb-1.5 block">{ar ? "الفئة" : "Category"} *</label>
              <div className="relative">
                <select value={category} onChange={(e) => setCategory(e.target.value as FinanceExpense["category"])} className="w-full h-9 px-3 pr-8 rounded-xl border border-border/80 bg-card text-[13px] text-foreground focus:outline-none focus:border-primary/40 transition-colors appearance-none cursor-pointer">
                  {CATEGORY_OPTIONS.filter((c) => c.value !== "all").map((c) => (
                    <option key={c.value} value={c.value}>{ar ? c.ar : c.en}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground tracking-wide uppercase mb-1.5 block">{ar ? "المبلغ" : "Amount"} (EGP) *</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full h-9 px-3 rounded-xl border border-border/80 bg-card text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors" placeholder="0" min="0" />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground tracking-wide uppercase mb-1.5 block">{ar ? "التاريخ" : "Date"} *</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full h-9 px-3 rounded-xl border border-border/80 bg-card text-[13px] text-foreground focus:outline-none focus:border-primary/40 transition-colors" />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground tracking-wide uppercase mb-1.5 block">{ar ? "الوصف" : "Description"}</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full px-3 py-2.5 rounded-xl border border-border/80 bg-card text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 resize-none transition-colors" placeholder={ar ? "وصف المصروف" : "Expense description"} />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground tracking-wide uppercase mb-1.5 block">{ar ? "الوصف (عربي)" : "Description (Arabic)"}</label>
            <textarea value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} rows={2} className="w-full px-3 py-2.5 rounded-xl border border-border/80 bg-card text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 resize-none transition-colors" placeholder={ar ? "وصف المصروف بالعربي" : "Arabic description"} dir="rtl" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border/40 flex justify-end gap-3">
          <button onClick={onClose} className="h-9 px-5 rounded-xl border border-border text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">{ar ? "إلغاء" : "Cancel"}</button>
          <button onClick={handleSubmit} disabled={!vendor.trim() || !amount} className="h-9 px-5 rounded-xl bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-90 transition-opacity disabled:opacity-40">{ar ? "إضافة مصروف" : "Add Expense"}</button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Approval Action Modal ─────────────────────────────────

function ApprovalModal({ open, onClose, onApprove, onReject, lang }: {
  open: boolean; onClose: () => void; onApprove: (by: string) => void; onReject: (by: string, reason: string) => void; lang: "en" | "ar";
}) {
  const ar = lang === "ar";
  const [mode, setMode] = useState<"approve" | "reject">("approve");
  const [approver, setApprover] = useState("Ahmed");
  const [reason, setReason] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-foreground/20 backdrop-blur-[3px]" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="relative bg-background border border-border/60 rounded-2xl shadow-xl w-full max-w-[420px] overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
          <h2 className="text-[15px] font-medium text-foreground">{ar ? "إجراء الموافقة" : "Approval Action"}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><X size={14} strokeWidth={2} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex gap-3">
            <button onClick={() => setMode("approve")} className={`flex-1 h-10 rounded-xl text-[12px] font-medium border transition-all ${mode === "approve" ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "border-border text-muted-foreground hover:bg-muted"}`}>
              <CheckCircle2 size={14} className="inline mr-1.5 -mt-0.5" /> {ar ? "موافقة" : "Approve"}
            </button>
            <button onClick={() => setMode("reject")} className={`flex-1 h-10 rounded-xl text-[12px] font-medium border transition-all ${mode === "reject" ? "bg-red-50 border-red-300 text-red-700" : "border-border text-muted-foreground hover:bg-muted"}`}>
              <X size={14} className="inline mr-1.5 -mt-0.5" /> {ar ? "رفض" : "Reject"}
            </button>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground tracking-wide uppercase mb-1.5 block">{ar ? "الموافق" : "Approved By"}</label>
            <input value={approver} onChange={(e) => setApprover(e.target.value)} className="w-full h-9 px-3 rounded-xl border border-border/80 bg-card text-[13px] text-foreground focus:outline-none focus:border-primary/40 transition-colors" />
          </div>
          {mode === "reject" && (
            <div>
              <label className="text-[11px] text-muted-foreground tracking-wide uppercase mb-1.5 block">{ar ? "سبب الرفض" : "Rejection Reason"}</label>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="w-full px-3 py-2.5 rounded-xl border border-border/80 bg-card text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 resize-none transition-colors" placeholder={ar ? "سبب الرفض…" : "Rejection reason…"} />
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-border/40 flex justify-end gap-3">
          <button onClick={onClose} className="h-9 px-5 rounded-xl border border-border text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">{ar ? "إلغاء" : "Cancel"}</button>
          <button
            onClick={() => {
              if (mode === "approve") onApprove(approver);
              else onReject(approver, reason);
              setApprover("Ahmed"); setReason(""); onClose();
            }}
            disabled={!approver.trim()}
            className={`h-9 px-5 rounded-xl text-[12px] font-medium hover:opacity-90 transition-opacity disabled:opacity-40 ${mode === "approve" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}
          >
            {mode === "approve" ? (ar ? "تأكيد الموافقة" : "Confirm Approval") : (ar ? "تأكيد الرفض" : "Confirm Rejection")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Expense Detail Drawer ─────────────────────────────────

function ExpenseDrawer({ expense, onClose, lang }: {
  expense: FinanceExpense; onClose: () => void; lang: "en" | "ar";
}) {
  const ar = lang === "ar";
  const cat = CATEGORY_META[expense.category] ?? CATEGORY_META.other;
  const status = STATUS_META[expense.status] ?? STATUS_META.draft;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" aria-modal="true">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-foreground/20 backdrop-blur-[3px]" onClick={onClose} />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 350 }}
        className="relative w-full max-w-[480px] bg-background border-l border-border/40 shadow-2xl overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 sticky top-0 bg-background/95 backdrop-blur-md z-10">
          <h2 className="text-[15px] font-medium text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>
            {ar ? "تفاصيل المصروف" : "Expense Details"}
          </h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><X size={14} strokeWidth={2} /></button>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${cat.color === "text-blue-600" ? "#3b82f6" : "#8b5cf6"}12` }}>
              <FileText size={18} className={cat.color} />
            </div>
            <div>
              <p className="text-[14px] font-medium text-foreground">{ar ? expense.vendor_ar : expense.vendor}</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${cat.bg} ${cat.color} mt-1`}>
                {ar ? cat.ar : cat.en}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-border/40 overflow-hidden">
            {[
              { label: ar ? "المبلغ" : "Amount", value: fmtEGP(expense.amount) },
              { label: ar ? "الحالة" : "Status", value: <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${status.bg} ${status.color}`}>{ar ? status.ar : status.en}</span> },
              { label: ar ? "التاريخ" : "Date", value: expense.date },
              { label: ar ? "تاريخ الاستحقاق" : "Due Date", value: expense.due_date },
              { label: ar ? "الفرع" : "Branch", value: expense.branch },
              { label: ar ? "دوري" : "Recurring", value: expense.recurring ? (ar ? "نعم" : "Yes") : (ar ? "لا" : "No") },
              { label: ar ? "طريقة الدفع" : "Payment Method", value: expense.payment_method?.replace("_", " ") || "—" },
              { label: ar ? "الوصف" : "Description", value: ar ? expense.description_ar : expense.description },
            ].map((row, i) => (
              <div key={i} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? "border-t border-border/30" : ""}`}>
                <span className="text-[11px] text-muted-foreground">{row.label}</span>
                <span className="text-[13px] text-foreground font-medium text-right">{row.value}</span>
              </div>
            ))}
          </div>

          {expense.approved_by && (
            <div className="rounded-xl border border-border/40 p-4">
              <p className="text-[11px] text-muted-foreground tracking-wide uppercase mb-2">{ar ? "الموافقة" : "Approval"}</p>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span className="text-[13px] text-foreground">{ar ? `تمت الموافقة بواسطة ${expense.approved_by}` : `Approved by ${expense.approved_by}`}</span>
              </div>
              {expense.approved_at && <p className="text-[11px] text-muted-foreground mt-1">{expense.approved_at}</p>}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════

export default function FinanceExpenses() {
  const { lang } = useLanguage();
  const ar = lang === "ar";

  const [expenses, setExpenses] = useState<FinanceExpense[]>(FIN_EXPENSES);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<FinanceExpense | null>(null);
  const [drawerExpense, setDrawerExpense] = useState<FinanceExpense | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  // ── KPI calculations ──
  const totalExpenses = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const pendingCount = useMemo(() => expenses.filter((e) => e.status === "pending").length, [expenses]);
  const approvedMonth = useMemo(() => expenses.filter((e) => e.status === "approved").reduce((s, e) => s + e.amount, 0), [expenses]);
  const paidMonth = useMemo(() => expenses.filter((e) => e.status === "paid").reduce((s, e) => s + e.amount, 0), [expenses]);
  const totalBudget = useMemo(() => FIN_BUDGETS.reduce((s, b) => s + b.budgeted, 0), []);
  const totalActual = useMemo(() => FIN_BUDGETS.reduce((s, b) => s + b.actual, 0), []);
  const budgetUtil = totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0;

  // ── Filtered expenses ──
  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const matchSearch = !search || e.vendor.toLowerCase().includes(search.toLowerCase()) || e.description.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === "all" || e.category === catFilter;
      const matchStatus = statusFilter === "all" || e.status === statusFilter;
      return matchSearch && matchCat && matchStatus;
    });
  }, [expenses, search, catFilter, statusFilter]);

  // ── Handlers ──
  const handleAdd = (data: Omit<FinanceExpense, "id" | "workspace_id">) => {
    const id = `fe${String(expenses.length + 1).padStart(2, "0")}`;
    setExpenses((prev) => [{ ...data, id, workspace_id: "demo" }, ...prev]);
    showToast(ar ? "تمت إضافة المصروف بنجاح" : "Expense added successfully");
  };

  const handleApprove = (by: string) => {
    if (!selectedExpense) return;
    setExpenses((prev) => prev.map((e) => e.id === selectedExpense.id ? { ...e, status: "approved" as const, approved_by: by, approved_at: new Date().toISOString() } : e));
    showToast(ar ? "تمت الموافقة على المصروف" : "Expense approved");
  };

  const handleReject = (by: string, _reason: string) => {
    if (!selectedExpense) return;
    setExpenses((prev) => prev.map((e) => e.id === selectedExpense.id ? { ...e, status: "rejected" as const, approved_by: by } : e));
    showToast(ar ? "تم رفض المصروف" : "Expense rejected");
  };

  const handleMarkPaid = (id: string) => {
    setExpenses((prev) => prev.map((e) => e.id === id ? { ...e, status: "paid" as const, paid_at: new Date().toISOString() } : e));
    showToast(ar ? "تم تسجيل الدفع" : "Payment recorded");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/30">
        <div className="px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[20px] font-semibold text-foreground tracking-tight" style={{ fontFamily: "var(--app-font-serif)" }}>
                {ar ? "المصروفات" : "Expenses"}
              </h1>
              <p className="text-[12px] text-muted-foreground mt-0.5">{ar ? "إدارة مصروفات وميزانيات الشركة" : "Manage company expenses & budgets"}</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setAddModalOpen(true)}
              className="flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-90 transition-opacity"
            >
              <Plus size={15} strokeWidth={2} />
              {ar ? "إضافة مصروف" : "Add Expense"}
            </motion.button>
          </div>
        </div>
      </div>

      <div className="px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <KpiCard icon={DollarSign} labelEn="Total Expenses" labelAr="إجمالي المصروفات" value={fmtEGP(totalExpenses)} color="#6366f1" />
          <KpiCard icon={Clock} labelEn="Pending Approval" labelAr="قيد الموافقة" value={String(pendingCount)} sub={ar ? "مصروفات" : "expenses"} color="#f59e0b" />
          <KpiCard icon={CheckCircle2} labelEn="Approved This Month" labelAr="معتمد هذا الشهر" value={fmtEGP(approvedMonth)} color="#3b82f6" />
          <KpiCard icon={CreditCard} labelEn="Paid This Month" labelAr="مدفوع هذا الشهر" value={fmtEGP(paidMonth)} color="#10b981" />
          <KpiCard icon={TrendingUp} labelEn="Budget Utilization" labelAr="نسبة استهلاك الميزانية" value={`${budgetUtil}%`} sub={`${fmtEGP(totalActual)} / ${fmtEGP(totalBudget)}`} color="#8b5cf6" />
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px] max-w-[400px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={ar ? "بحث بالاسم أو الوصف…" : "Search by vendor or description…"}
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-border/60 bg-card text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-border/60 bg-card text-[12px] text-muted-foreground hover:text-foreground hover:border-border transition-colors">
            <Filter size={13} />
            {ar ? "فلتر" : "Filters"}
            {(catFilter !== "all" || statusFilter !== "all") && <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-medium">!</span>}
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-4 py-3 px-4 rounded-xl border border-border/40 bg-card/50">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wide">{ar ? "الفئة" : "Category"}</label>
                  <div className="relative">
                    <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="h-8 px-3 pr-7 rounded-lg border border-border/60 bg-card text-[12px] text-foreground focus:outline-none focus:border-primary/40 appearance-none cursor-pointer">
                      {CATEGORY_OPTIONS.map((c) => (<option key={c.value} value={c.value}>{ar ? c.ar : c.en}</option>))}
                    </select>
                    <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wide">{ar ? "الحالة" : "Status"}</label>
                  <div className="relative">
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-8 px-3 pr-7 rounded-lg border border-border/60 bg-card text-[12px] text-foreground focus:outline-none focus:border-primary/40 appearance-none cursor-pointer">
                      {STATUS_OPTIONS.map((s) => (<option key={s.value} value={s.value}>{ar ? s.ar : s.en}</option>))}
                    </select>
                    <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                {(catFilter !== "all" || statusFilter !== "all") && (
                  <button onClick={() => { setCatFilter("all"); setStatusFilter("all"); }} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
                    {ar ? "مسح الفلتر" : "Clear filters"}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expenses Table */}
        <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border/40">
                  {[
                    ar ? "المورد" : "Vendor",
                    ar ? "الفئة" : "Category",
                    ar ? "الوصف" : "Description",
                    ar ? "المبلغ" : "Amount",
                    ar ? "التاريخ" : "Date",
                    ar ? "الحالة" : "Status",
                    ar ? "تمت الموافقة بواسطة" : "Approved By",
                    ar ? "إجراءات" : "Actions",
                  ].map((h, i) => (
                    <th key={i} className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground tracking-[0.06em] uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-[13px] text-muted-foreground">
                      {ar ? "لا توجد مصروفات" : "No expenses found"}
                    </td>
                  </tr>
                ) : (
                  filtered.map((expense) => {
                    const cat = CATEGORY_META[expense.category] ?? CATEGORY_META.other;
                    const status = STATUS_META[expense.status] ?? STATUS_META.draft;
                    return (
                      <motion.tr
                        key={expense.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b border-border/20 hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => setDrawerExpense(expense)}
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                              <Building2 size={13} className="text-muted-foreground" />
                            </div>
                            <div>
                              <p className="text-[13px] font-medium text-foreground leading-tight">{ar ? expense.vendor_ar : expense.vendor}</p>
                              <p className="text-[10px] text-muted-foreground">{expense.branch}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${cat.bg} ${cat.color}`}>
                            {ar ? cat.ar : cat.en}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-[12px] text-foreground max-w-[200px] truncate">{ar ? expense.description_ar : expense.description}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-[13px] font-semibold text-foreground tabular-nums">{fmtEGP(expense.amount)}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                            <Calendar size={11} />
                            {expense.date}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${status.bg} ${status.color}`}>
                            {ar ? status.ar : status.en}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-[12px] text-muted-foreground">{expense.approved_by || "—"}</span>
                        </td>
                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            {expense.status === "draft" && (
                              <button
                                onClick={() => { setSelectedExpense(expense); setApprovalModalOpen(true); }}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                title={ar ? "إرسال للموافقة" : "Submit for approval"}
                              >
                                <Send size={12} />
                              </button>
                            )}
                            {expense.status === "approved" && (
                              <button
                                onClick={() => handleMarkPaid(expense.id)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                title={ar ? "تسجيل الدفع" : "Mark as paid"}
                              >
                                <CreditCard size={12} />
                              </button>
                            )}
                            <button
                              onClick={() => setDrawerExpense(expense)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                              <Eye size={12} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/30">
              <p className="text-[11px] text-muted-foreground">
                {ar ? `عرض ${filtered.length} من ${expenses.length}` : `Showing ${filtered.length} of ${expenses.length}`}
              </p>
              <p className="text-[11px] font-medium text-foreground">
                {ar ? "الإجمالي:" : "Total:"} {fmtEGP(filtered.reduce((s, e) => s + e.amount, 0))}
              </p>
            </div>
          )}
        </div>

        {/* Budget Overview */}
        <div>
          <h2 className="text-[14px] font-semibold text-foreground mb-4 tracking-tight" style={{ fontFamily: "var(--app-font-serif)" }}>
            {ar ? "نظرة على الميزانية" : "Budget Overview"}
          </h2>
          <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border/40">
                  {[ar ? "الفئة" : "Category", ar ? "الميزانية" : "Budget", ar ? "الفعلي" : "Actual", ar ? "نسبة الاستهلاك" : "Utilization", ar ? "الحالة" : "Status"].map((h, i) => (
                    <th key={i} className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground tracking-[0.06em] uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FIN_BUDGETS.map((budget) => {
                  const budgetStatusColor = budget.status === "critical" ? "text-red-600" : budget.status === "over" ? "text-amber-600" : budget.status === "on_track" ? "text-emerald-600" : "text-blue-600";
                  const budgetStatusBg = budget.status === "critical" ? "bg-red-50 border-red-200" : budget.status === "over" ? "bg-amber-50 border-amber-200" : budget.status === "on_track" ? "bg-emerald-50 border-emerald-200" : "bg-blue-50 border-blue-200";
                  const budgetStatusEn = budget.status === "critical" ? "Critical" : budget.status === "over" ? "Over Budget" : budget.status === "on_track" ? "On Track" : "Under Budget";
                  const budgetStatusAr = budget.status === "critical" ? "حرج" : budget.status === "over" ? "تجاوز الميزانية" : budget.status === "on_track" ? "ضمن الميزانية" : "أقل من الميزانية";
                  const progressColor = budget.utilization_pct >= 90 ? "#ef4444" : budget.utilization_pct >= 70 ? "#f59e0b" : "#10b981";

                  return (
                    <tr key={budget.id} className="border-b border-border/20 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-4">
                        <p className="text-[13px] font-medium text-foreground">{ar ? budget.category_ar : budget.category}</p>
                        <p className="text-[10px] text-muted-foreground">{budget.period}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[13px] text-foreground tabular-nums">{fmtEGP(budget.budgeted)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[13px] font-medium text-foreground tabular-nums">{fmtEGP(budget.actual)}</span>
                      </td>
                      <td className="px-4 py-4 min-w-[180px]">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(budget.utilization_pct, 100)}%` }}
                              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                              className="h-full rounded-full"
                              style={{ background: progressColor }}
                            />
                          </div>
                          <span className="text-[12px] font-medium tabular-nums min-w-[32px] text-right" style={{ color: progressColor }}>
                            {budget.utilization_pct}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${budgetStatusBg} ${budgetStatusColor}`}>
                          {ar ? budgetStatusAr : budgetStatusEn}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-4 py-2.5 rounded-xl bg-foreground text-background text-[12px] font-medium shadow-lg"
          >
            <CheckCircle2 size={14} />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AddExpenseModal open={addModalOpen} onClose={() => setAddModalOpen(false)} onAdd={handleAdd} lang={lang} />
      <ApprovalModal open={approvalModalOpen} onClose={() => { setApprovalModalOpen(false); setSelectedExpense(null); }} onApprove={handleApprove} onReject={handleReject} lang={lang} />
      {drawerExpense && <ExpenseDrawer expense={drawerExpense} onClose={() => setDrawerExpense(null)} lang={lang} />}
    </div>
  );
}
