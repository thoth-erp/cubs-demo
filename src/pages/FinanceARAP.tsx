import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import {
  FIN_ACCOUNTS_RECEIVABLE,
  FIN_EXPENSES,
  FIN_METRICS,
  type FinanceExpense,
} from "../lib/finance-data";
import {
  Search, X, ChevronDown, Filter, Download,
  AlertTriangle, Clock, CheckCircle2, DollarSign,
  TrendingUp, Send, CreditCard, Building2, Calendar,
  ArrowUpRight,
} from "lucide-react";

// ─── Currency ─────────────────────────────────────────────

const fmtEGP = (n: number) =>
  new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", minimumFractionDigits: 0 }).format(n);

// ─── Aging Meta ───────────────────────────────────────────

const AGING_BUCKETS = [
  { key: "Current", en: "Current", ar: "جاري", color: "#10b981", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", bar: "from-emerald-400 to-emerald-500" },
  { key: "1-30 days", en: "1–30 days", ar: "١–٣٠ يوم", color: "#f59e0b", bg: "bg-amber-50 border-amber-200", text: "text-amber-700", bar: "from-amber-400 to-amber-500" },
  { key: "31-60 days", en: "31–60 days", ar: "٣١–٦٠ يوم", color: "#f97316", bg: "bg-orange-50 border-orange-200", text: "text-orange-700", bar: "from-orange-400 to-orange-500" },
  { key: "61-90 days", en: "61–90 days", ar: "٦١–٩٠ يوم", color: "#ef4444", bg: "bg-red-50 border-red-200", text: "text-red-700", bar: "from-red-400 to-red-500" },
];

// ─── Status Meta (AR) ─────────────────────────────────────

const AR_STATUS_META: Record<string, { en: string; ar: string; pill: string; dot: string }> = {
  current:     { en: "Current",     ar: "جاري",       pill: "bg-emerald-100 text-emerald-600",  dot: "bg-emerald-500" },
  overdue_30:  { en: "Overdue",     ar: "متأخر",      pill: "bg-amber-100 text-amber-600",      dot: "bg-amber-500" },
  overdue_60:  { en: "Overdue",     ar: "متأخر",      pill: "bg-orange-100 text-orange-600",    dot: "bg-orange-500" },
  overdue_90:  { en: "Overdue",     ar: "متأخر",      pill: "bg-red-100 text-red-600",          dot: "bg-red-500" },
};

// ─── AP Status Meta ───────────────────────────────────────

const AP_STATUS_META: Record<string, { en: string; ar: string; pill: string; dot: string }> = {
  pending:  { en: "Due",     ar: "مستحق",    pill: "bg-amber-100 text-amber-600",   dot: "bg-amber-500" },
  approved: { en: "Approved", ar: "معتمد",    pill: "bg-blue-100 text-blue-600",     dot: "bg-blue-500" },
  paid:     { en: "Paid",     ar: "مدفوع",    pill: "bg-emerald-100 text-emerald-600", dot: "bg-emerald-500" },
  draft:    { en: "Draft",    ar: "مسودة",    pill: "bg-slate-100 text-slate-600",   dot: "bg-slate-400" },
  rejected: { en: "Rejected", ar: "مرفوض",    pill: "bg-red-100 text-red-600",       dot: "bg-red-500" },
};

// ─── Shared UI ────────────────────────────────────────────

const inputCls = "w-full h-9 ps-8 pe-3 rounded-xl border border-border/80 bg-card text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors";

// ═══════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════

export default function FinanceARAP() {
  const { lang } = useLanguage();
  const ar = lang === "ar";

  const [activeTab, setActiveTab] = useState<"receivable" | "payable">("receivable");
  const [search, setSearch] = useState("");
  const [agingFilter, setAgingFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  // ── AR Data ──
  const arData = FIN_ACCOUNTS_RECEIVABLE;
  const totalAR = arData.reduce((s, r) => s + r.balance, 0);
  const overdueAR = arData.filter((r) => r.days_overdue > 0).reduce((s, r) => s + r.balance, 0);
  const currentAR = arData.filter((r) => r.days_overdue === 0).reduce((s, r) => s + r.balance, 0);
  const avgDaysCollect = FIN_METRICS.avg_collection_days;

  const arAgingData = useMemo(() => {
    return AGING_BUCKETS.map((b) => ({
      ...b,
      amount: arData.filter((r) => r.aging_bucket === b.key).reduce((s, r) => s + r.balance, 0),
      count: arData.filter((r) => r.aging_bucket === b.key).length,
    }));
  }, [arData]);

  const maxAging = Math.max(...arAgingData.map((a) => a.amount), 1);

  // ── AP Data (derived from expenses) ──
  const apData = useMemo(() => {
    return FIN_EXPENSES.filter((e) => e.status !== "rejected").map((e) => {
      const due = new Date(e.due_date);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - due.getTime()) / 86400000);
      const daysOverdue = diffDays > 0 ? diffDays : 0;
      let apStatus: string = e.status;
      if ((e.status as string) === "paid") apStatus = "paid";
      else if (daysOverdue > 0 && e.status !== "paid") apStatus = "pending";
      else if (e.status === "approved") apStatus = "approved";
      else if (e.status === "draft") apStatus = "draft";
      else if (e.status === "pending") apStatus = "pending";

      return {
        ...e,
        days_overdue: daysOverdue,
        apStatus,
      };
    });
  }, []);

  const totalAP = apData.filter((e) => e.apStatus !== "paid").reduce((s, e) => s + e.amount, 0);
  const dueThisMonth = apData.filter((e) => {
    const d = new Date(e.due_date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && e.apStatus !== "paid";
  }).reduce((s, e) => s + e.amount, 0);
  const overdueAP = apData.filter((e) => e.days_overdue > 0 && e.apStatus !== "paid").reduce((s, e) => s + e.amount, 0);
  const upcomingAP = apData.filter((e) => {
    const d = new Date(e.due_date);
    const now = new Date();
    const diff = (d.getTime() - now.getTime()) / 86400000;
    return diff > 0 && diff <= 30 && e.apStatus !== "paid";
  }).reduce((s, e) => s + e.amount, 0);

  // ── Filtering ──
  const filteredAR = useMemo(() => {
    return arData.filter((r) => {
      const q = search.toLowerCase().trim();
      const matchSearch = !q ||
        r.customer_name.toLowerCase().includes(q) ||
        r.customer_name_ar.includes(q) ||
        r.invoice_number.toLowerCase().includes(q);
      const matchAging = agingFilter === "all" || r.aging_bucket === agingFilter;
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      return matchSearch && matchAging && matchStatus;
    });
  }, [arData, search, agingFilter, statusFilter]);

  const filteredAP = useMemo(() => {
    return apData.filter((e) => {
      const q = search.toLowerCase().trim();
      const matchSearch = !q ||
        e.vendor.toLowerCase().includes(q) ||
        e.vendor_ar.includes(q) ||
        e.description.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || e.apStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [apData, search, statusFilter]);

  const handleSendReminder = (name: string) => {
    showToast(ar ? `تم إرسال تذكير لـ ${name}` : `Reminder sent to ${name}`);
  };

  const handlePay = (vendor: string) => {
    showToast(ar ? `جاري معالجة الدفع لـ ${vendor}` : `Processing payment to ${vendor}`);
  };

  // ── KPIs ──
  const arKpis = [
    { label: ar ? "إجمالي المدينة" : "Total AR", value: fmtEGP(totalAR), icon: DollarSign, color: "#6366f1", bg: "bg-indigo-50" },
    { label: ar ? "المتأخر" : "Overdue Amount", value: fmtEGP(overdueAR), icon: AlertTriangle, color: "#ef4444", bg: "bg-red-50" },
    { label: ar ? "الحالي" : "Current Amount", value: fmtEGP(currentAR), icon: CheckCircle2, color: "#10b981", bg: "bg-emerald-50" },
    { label: ar ? "متوسط أيام التحصيل" : "Avg Days to Collect", value: `${avgDaysCollect} ${ar ? "يوم" : "days"}`, icon: Clock, color: "#f59e0b", bg: "bg-amber-50" },
  ];

  const apKpis = [
    { label: ar ? "إجمالي الدائن" : "Total AP", value: fmtEGP(totalAP), icon: DollarSign, color: "#8b5cf6", bg: "bg-violet-50" },
    { label: ar ? "مستحق هذا الشهر" : "Due This Month", value: fmtEGP(dueThisMonth), icon: Calendar, color: "#f59e0b", bg: "bg-amber-50" },
    { label: ar ? "المتأخر" : "Overdue", value: fmtEGP(overdueAP), icon: AlertTriangle, color: "#ef4444", bg: "bg-red-50" },
    { label: ar ? "القادم" : "Upcoming", value: fmtEGP(upcomingAP), icon: TrendingUp, color: "#3b82f6", bg: "bg-blue-50" },
  ];

  const tabItems = [
    { key: "receivable" as const, en: "Accounts Receivable", ar: "الحسابات المدينة", icon: TrendingUp },
    { key: "payable" as const, en: "Accounts Payable", ar: "الحسابات الدائنة", icon: CreditCard },
  ];

  const arStatusFilters = [
    { value: "all", en: "All", ar: "الكل" },
    { value: "current", en: "Current", ar: "جاري" },
    { value: "overdue_30", en: "Overdue 30", ar: "متأخر ٣٠" },
    { value: "overdue_60", en: "Overdue 60", ar: "متأخر ٦٠" },
    { value: "overdue_90", en: "Overdue 90", ar: "متأخر ٩٠" },
  ];

  const apStatusFilters = [
    { value: "all", en: "All", ar: "الكل" },
    { value: "pending", en: "Due", ar: "مستحق" },
    { value: "approved", en: "Approved", ar: "معتمد" },
    { value: "paid", en: "Paid", ar: "مدفوع" },
    { value: "draft", en: "Draft", ar: "مسودة" },
  ];

  return (
    <div className="min-h-full">
      {/* ── Header ── */}
      <div className="border-b border-border/40 px-8 md:px-10 py-8"
        style={{ background: "linear-gradient(160deg, hsl(var(--muted)/0.3) 0%, hsl(var(--background)) 60%)" }}>
        <div className="max-w-[1280px]">
          <p className="text-[11px] text-muted-foreground/60 tracking-[0.08em] uppercase mb-2">
            {ar ? "المالية" : "Finance"}
          </p>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-[26px] font-medium text-foreground leading-tight"
                style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.025em" }}>
                {ar ? "الحسابات المدينة والدائن" : "Receivable & Payable"}
              </h1>
              <p className="text-[12px] text-muted-foreground mt-1">
                {ar ? "إدارة الحسابات المدينة والدائن" : "Manage accounts receivable & payable"}
              </p>
            </div>
            <button className="flex items-center gap-2 h-9 px-3.5 rounded-xl border border-border/60 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Download size={13} strokeWidth={1.75} />
              {ar ? "تصدير" : "Export"}
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/40 border border-border/30 w-fit">
            {tabItems.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setSearch(""); setAgingFilter("all"); setStatusFilter("all"); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                  activeTab === tab.key
                    ? "bg-background text-foreground shadow-sm border border-border/40"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon size={14} strokeWidth={1.75} />
                {ar ? tab.ar : tab.en}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-8 md:px-10 py-6 max-w-[1280px] space-y-6">
        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(activeTab === "receivable" ? arKpis : apKpis).map((kpi, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-background border border-border/40 rounded-xl px-5 py-4 relative overflow-hidden group hover:shadow-md transition-shadow"
            >
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.04] -translate-y-8 translate-x-8"
                style={{ background: kpi.color }} />
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                  <kpi.icon size={17} strokeWidth={1.75} style={{ color: kpi.color }} />
                </div>
                <ArrowUpRight size={14} className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
              </div>
              <p className="text-[17px] font-medium text-foreground leading-none tabular-nums mb-1"
                style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.02em" }}>
                {kpi.value}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{kpi.label}</p>
            </motion.div>
          ))}
        </div>

        {/* ── AR Aging Breakdown ── */}
        {activeTab === "receivable" && (
          <div className="bg-background border border-border/40 rounded-xl px-5 py-5">
            <h3 className="text-[13px] font-semibold text-foreground mb-4"
              style={{ fontFamily: "var(--app-font-serif)" }}>
              {ar ? "تقسيم الأعمار المدينة" : "AR Aging Breakdown"}
            </h3>
            <div className="space-y-3">
              {arAgingData.map((aging, i) => (
                <div key={aging.key} className="flex items-center gap-4">
                  <div className="w-[100px] shrink-0">
                    <p className="text-[11px] font-medium text-foreground">{ar ? aging.ar : aging.en}</p>
                    <p className="text-[10px] text-muted-foreground">{aging.count} {ar ? "فواتير" : "invoices"}</p>
                  </div>
                  <div className="flex-1 h-7 rounded-lg bg-muted/30 overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(aging.amount / maxAging) * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.1 }}
                      className={`h-full rounded-lg bg-gradient-to-r ${aging.bar} relative`}
                    >
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-white tabular-nums drop-shadow-sm">
                        {fmtEGP(aging.amount)}
                      </span>
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Filters ── */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative min-w-[200px] flex-1 max-w-[320px]">
            <Search size={13} strokeWidth={1.75} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                activeTab === "receivable"
                  ? (ar ? "بحث بالعميل أو رقم الفاتورة…" : "Search customer or invoice…")
                  : (ar ? "بحث بالمورد أو الوصف…" : "Search vendor or description…")
              }
              className={inputCls}
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-border/60 bg-card text-[12px] font-medium text-muted-foreground hover:text-foreground hover:border-border transition-colors"
          >
            <Filter size={13} />
            {ar ? "فلتر" : "Filters"}
            {(agingFilter !== "all" || statusFilter !== "all") && (
              <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-medium">!</span>
            )}
          </button>

          {(agingFilter !== "all" || statusFilter !== "all" || search) && (
            <button
              onClick={() => { setSearch(""); setAgingFilter("all"); setStatusFilter("all"); }}
              className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-[12px] text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent hover:border-border transition-all"
            >
              <X size={11} strokeWidth={2} /> {ar ? "مسح" : "Clear"}
            </button>
          )}
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
              <div className="flex items-center gap-4 py-3 px-4 rounded-xl border border-border/40 bg-card/50 flex-wrap">
                {activeTab === "receivable" && (
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-muted-foreground uppercase tracking-wide">{ar ? "الأعمار" : "Aging"}</label>
                    <div className="relative">
                      <select
                        value={agingFilter}
                        onChange={(e) => setAgingFilter(e.target.value)}
                        className="h-8 px-3 pr-7 rounded-lg border border-border/60 bg-card text-[12px] text-foreground focus:outline-none focus:border-primary/40 appearance-none cursor-pointer"
                      >
                        <option value="all">{ar ? "كل الأعمار" : "All Aging"}</option>
                        {AGING_BUCKETS.map((b) => (
                          <option key={b.key} value={b.key}>{ar ? b.ar : b.en}</option>
                        ))}
                      </select>
                      <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wide">{ar ? "الحالة" : "Status"}</label>
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="h-8 px-3 pr-7 rounded-lg border border-border/60 bg-card text-[12px] text-foreground focus:outline-none focus:border-primary/40 appearance-none cursor-pointer"
                    >
                      {(activeTab === "receivable" ? arStatusFilters : apStatusFilters).map((f) => (
                        <option key={f.value} value={f.value}>{ar ? f.ar : f.en}</option>
                      ))}
                    </select>
                    <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                {(agingFilter !== "all" || statusFilter !== "all") && (
                  <button
                    onClick={() => { setAgingFilter("all"); setStatusFilter("all"); }}
                    className="text-[11px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                  >
                    {ar ? "مسح الفلتر" : "Clear filters"}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── AR Table ── */}
        {activeTab === "receivable" && (
          <div className="border border-border/40 rounded-xl overflow-hidden bg-background">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-muted/30 border-b border-border/30">
                    {[ar ? "العميل" : "Customer",
                      ar ? "رقم الفاتورة" : "Invoice #",
                      ar ? "الإجمالي" : "Total",
                      ar ? "المدفوع" : "Paid",
                      ar ? "المتبقي" : "Balance",
                      ar ? "الاستحقاق" : "Due Date",
                      ar ? "أيام التأخر" : "Days Overdue",
                      ar ? "الحالة" : "Status",
                      ar ? "الأعمار" : "Aging Bucket",
                      ar ? "إجراءات" : "Actions",
                    ].map((h, i) => (
                      <th key={i} className="text-start px-4 py-3 font-medium text-muted-foreground whitespace-nowrap text-[10px] tracking-[0.06em] uppercase">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {filteredAR.map((row) => {
                    const statusMeta = AR_STATUS_META[row.status] ?? AR_STATUS_META.current;
                    const agingMeta = AGING_BUCKETS.find((b) => b.key === row.aging_bucket) ?? AGING_BUCKETS[0];
                    return (
                      <motion.tr
                        key={row.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-muted/15 transition-colors"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                              <Building2 size={13} strokeWidth={1.75} className="text-primary" />
                            </div>
                            <div>
                              <p className="text-[12px] font-medium text-foreground truncate max-w-[150px]">
                                {ar ? row.customer_name_ar : row.customer_name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-foreground">{row.invoice_number}</span>
                        </td>
                        <td className="px-4 py-3.5 text-end font-medium text-foreground tabular-nums whitespace-nowrap"
                          style={{ fontFamily: "var(--app-font-serif)" }}>
                          {fmtEGP(row.total)}
                        </td>
                        <td className="px-4 py-3.5 text-end text-emerald-600 tabular-nums whitespace-nowrap">
                          {row.paid > 0 ? fmtEGP(row.paid) : "—"}
                        </td>
                        <td className="px-4 py-3.5 text-end tabular-nums whitespace-nowrap font-medium"
                          style={{ color: row.balance > 0 ? "var(--foreground)" : "var(--muted-foreground)" }}>
                          {fmtEGP(row.balance)}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground tabular-nums whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={10} />
                            {row.due_date}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {row.days_overdue > 0 ? (
                            <span className="text-[11px] font-medium text-red-600">
                              {row.days_overdue} {ar ? "يوم" : "days"}
                            </span>
                          ) : (
                            <span className="text-[11px] text-emerald-600">{ar ? "جاري" : "Current"}</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full ${statusMeta.pill}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                            {ar ? statusMeta.ar : statusMeta.en}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full border ${agingMeta.bg} ${agingMeta.text}`}>
                            {ar ? agingMeta.ar : agingMeta.en}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => handleSendReminder(ar ? row.customer_name_ar : row.customer_name)}
                            className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-border/60 text-[11px] font-medium text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all"
                          >
                            <Send size={10} strokeWidth={2} />
                            {ar ? "تذكير" : "Remind"}
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                  {filteredAR.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-6 py-14 text-center">
                        <p className="text-[13px] text-muted-foreground/60">
                          {ar ? "لا توجد حسابات مدينة" : "No receivable accounts found"}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {filteredAR.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border/30 bg-muted/10">
                <p className="text-[11px] text-muted-foreground">
                  {ar ? `${filteredAR.length} من ${arData.length}` : `${filteredAR.length} of ${arData.length}`}
                </p>
                <p className="text-[11px] font-medium text-foreground tabular-nums">
                  {ar ? "الإجمالي:" : "Total:"} {fmtEGP(filteredAR.reduce((s, r) => s + r.balance, 0))}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── AP Table ── */}
        {activeTab === "payable" && (
          <div className="border border-border/40 rounded-xl overflow-hidden bg-background">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-muted/30 border-b border-border/30">
                    {[ar ? "المورد" : "Vendor",
                      ar ? "الفئة" : "Category",
                      ar ? "الوصف" : "Description",
                      ar ? "المبلغ" : "Amount",
                      ar ? "الاستحقاق" : "Due Date",
                      ar ? "أيام التأخر" : "Days Overdue",
                      ar ? "الحالة" : "Status",
                      ar ? "إجراءات" : "Actions",
                    ].map((h, i) => (
                      <th key={i} className="text-start px-4 py-3 font-medium text-muted-foreground whitespace-nowrap text-[10px] tracking-[0.06em] uppercase">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {filteredAP.map((row) => {
                    const statusMeta = AP_STATUS_META[row.apStatus] ?? AP_STATUS_META.pending;
                    return (
                      <motion.tr
                        key={row.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-muted/15 transition-colors"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                              <Building2 size={13} strokeWidth={1.75} className="text-violet-600" />
                            </div>
                            <div>
                              <p className="text-[12px] font-medium text-foreground truncate max-w-[160px]">
                                {ar ? row.vendor_ar : row.vendor}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-[11px] text-muted-foreground capitalize">{row.category}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-[12px] text-foreground max-w-[200px] truncate">
                            {ar ? row.description_ar : row.description}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 text-end font-medium text-foreground tabular-nums whitespace-nowrap"
                          style={{ fontFamily: "var(--app-font-serif)" }}>
                          {fmtEGP(row.amount)}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground tabular-nums whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={10} />
                            {row.due_date}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {row.days_overdue > 0 ? (
                            <span className="text-[11px] font-medium text-red-600">
                              {row.days_overdue} {ar ? "يوم" : "days"}
                            </span>
                          ) : (
                            <span className="text-[11px] text-emerald-600">{ar ? "جاري" : "Current"}</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full ${statusMeta.pill}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                            {ar ? statusMeta.ar : statusMeta.en}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {row.apStatus !== "paid" ? (
                            <button
                              onClick={() => handlePay(ar ? row.vendor_ar : row.vendor)}
                              className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-foreground text-background text-[11px] font-medium hover:opacity-90 transition-opacity"
                            >
                              <CreditCard size={10} strokeWidth={2} />
                              {ar ? "دفع" : "Pay"}
                            </button>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] text-emerald-600">
                              <CheckCircle2 size={11} />
                              {ar ? "مدفوع" : "Paid"}
                            </span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                  {filteredAP.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-14 text-center">
                        <p className="text-[13px] text-muted-foreground/60">
                          {ar ? "لا توجد حسابات دائنة" : "No payable accounts found"}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {filteredAP.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border/30 bg-muted/10">
                <p className="text-[11px] text-muted-foreground">
                  {ar ? `${filteredAP.length} من ${apData.length}` : `${filteredAP.length} of ${apData.length}`}
                </p>
                <p className="text-[11px] font-medium text-foreground tabular-nums">
                  {ar ? "الإجمالي:" : "Total:"} {fmtEGP(filteredAP.reduce((s, e) => s + e.amount, 0))}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Toast ── */}
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
    </div>
  );
}
