/**
 * Finance Dashboard — لوحة المالية
 *
 * Comprehensive financial command center for THOTH Fashion.
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { useLocation } from "wouter";
import {
  FIN_METRICS, FIN_INVOICES, FIN_PAYMENTS, FIN_EXPENSES,
  FIN_ACCOUNTS_RECEIVABLE,
} from "../lib/finance-data";
import {
  DollarSign, TrendingUp, TrendingDown, Wallet, Landmark,
  Clock, AlertTriangle, FileText, CreditCard, BarChart3,
  ChevronRight, ArrowUpRight, ArrowDownRight, Receipt,
  PiggyBank, WalletCards, CheckCircle2, XCircle, Search,
  Plus, Filter, Eye, Send, Banknote, Activity, ShieldCheck,
} from "lucide-react";

/* ─── Helpers ──────────────────────────────────────────────── */

function formatEGP(n: number) {
  return new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", minimumFractionDigits: 0 }).format(n);
}

const EASE = [0.16, 1, 0.3, 1] as const;
const serif: React.CSSProperties = { fontFamily: "var(--app-font-serif)" };

/* ─── Animation Variants ───────────────────────────────────── */

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

const cardV: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.35, ease: EASE },
  }),
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: EASE } },
};

/* ─── Status Badge Colors ──────────────────────────────────── */

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  draft:   { bg: "bg-slate-50",   text: "text-slate-600",   dot: "bg-slate-400" },
  sent:    { bg: "bg-blue-50",    text: "text-blue-600",    dot: "bg-blue-400" },
  viewed:  { bg: "bg-indigo-50",  text: "text-indigo-600",  dot: "bg-indigo-400" },
  partial: { bg: "bg-amber-50",   text: "text-amber-600",   dot: "bg-amber-400" },
  paid:    { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-400" },
  overdue: { bg: "bg-rose-50",    text: "text-rose-600",    dot: "bg-rose-400" },
  cancelled: { bg: "bg-zinc-50",  text: "text-zinc-500",    dot: "bg-zinc-400" },
  completed: { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-400" },
  pending:   { bg: "bg-amber-50",   text: "text-amber-600",   dot: "bg-amber-400" },
  failed:    { bg: "bg-rose-50",    text: "text-rose-600",    dot: "bg-rose-400" },
  reversed:  { bg: "bg-orange-50",  text: "text-orange-600",  dot: "bg-orange-400" },
};

const METHOD_LABELS: Record<string, { en: string; ar: string }> = {
  cash: { en: "Cash", ar: "نقدي" },
  bank_transfer: { en: "Bank Transfer", ar: "تحويل بنكي" },
  card: { en: "Card", ar: "بطاقة" },
  mobile_wallet: { en: "Mobile Wallet", ar: "محفظة إلكترونية" },
  cheque: { en: "Cheque", ar: "شيك" },
  online: { en: "Online", ar: "أونلاين" },
};

const EXPENSE_CAT_COLORS: Record<string, string> = {
  salaries: "#3b82f6",
  rent: "#8b5cf6",
  supplies: "#f59e0b",
  marketing: "#ec4899",
  utilities: "#06b6d4",
  technology: "#10b981",
  insurance: "#6366f1",
  maintenance: "#f97316",
  travel: "#14b8a6",
  professional: "#64748b",
  other: "#94a3b8",
};

const REVENUE_CAT_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899"];

/* ─── Donut Chart (SVG) ────────────────────────────────────── */

function DonutChart({ segments, size = 140 }: { segments: { value: number; color: string }[]; size?: number }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;

  const r = (size - 20) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg width={size} height={size} className="-rotate-90">
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const dashLen = pct * circ;
        const dashOff = -offset;
        offset += dashLen;
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={18}
            strokeDasharray={`${dashLen} ${circ - dashLen}`}
            strokeDashoffset={dashOff}
            strokeLinecap="butt"
            className="transition-all duration-700"
          />
        );
      })}
      <circle cx={cx} cy={cy} r={r - 12} fill="hsl(var(--background))" />
    </svg>
  );
}

/* ─── Main Component ───────────────────────────────────────── */

export default function FinanceDashboard() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"overview" | "invoices" | "payments" | "expenses">("overview");

  /* ─── Derived Data ──────────────────────────────────────── */

  const kpis = useMemo(() => [
    {
      label: ar ? "إجمالي الإيرادات" : "Total Revenue",
      value: formatEGP(FIN_METRICS.total_revenue),
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      change: "+12.4%",
      changePositive: true,
    },
    {
      label: ar ? "إجمالي المصروفات" : "Total Expenses",
      value: formatEGP(FIN_METRICS.total_expenses),
      icon: TrendingDown,
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-100",
      change: "+8.2%",
      changePositive: false,
    },
    {
      label: ar ? "صافي الربح" : "Net Profit",
      value: formatEGP(FIN_METRICS.net_profit),
      icon: Wallet,
      color: "text-violet-600",
      bg: "bg-violet-50",
      border: "border-violet-100",
      change: `${FIN_METRICS.net_margin}%`,
      changePositive: FIN_METRICS.net_profit > 0,
    },
    {
      label: ar ? "هامش الربح الإجمالي" : "Gross Margin %",
      value: `${FIN_METRICS.gross_margin}%`,
      icon: Activity,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
      change: ar ? "جيد" : "Good",
      changePositive: true,
    },
    {
      label: ar ? "الرصيد النقدي" : "Cash Balance",
      value: formatEGP(FIN_METRICS.cash_balance),
      icon: PiggyBank,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
      change: ar ? "متاح" : "Available",
      changePositive: true,
    },
    {
      label: ar ? "الرصيد البنكي" : "Bank Balance",
      value: formatEGP(FIN_METRICS.bank_balance),
      icon: Landmark,
      color: "text-teal-600",
      bg: "bg-teal-50",
      border: "border-teal-100",
      change: ar ? "4 حسابات" : "4 accounts",
      changePositive: true,
    },
    {
      label: ar ? "الحسابات المدينة" : "Accounts Receivable",
      value: formatEGP(FIN_METRICS.accounts_receivable),
      icon: CreditCard,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-100",
      change: `${FIN_METRICS.avg_collection_days} ${ar ? "يوم" : "days"}`,
      changePositive: true,
    },
    {
      label: ar ? "المبالغ المتأخرة" : "Overdue Amount",
      value: formatEGP(FIN_METRICS.overdue_amount),
      icon: AlertTriangle,
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-100",
      change: `${FIN_METRICS.overdue_invoices} ${ar ? "فواتير" : "invoices"}`,
      changePositive: false,
    },
  ], [ar]);

  const recentInvoices = FIN_INVOICES.slice(0, 6);
  const pendingPayments = FIN_PAYMENTS.filter((p) => p.status === "pending");

  const agingBuckets = useMemo(() => {
    const buckets = { current: 0, "1-30": 0, "31-60": 0, "61-90": 0 };
    FIN_ACCOUNTS_RECEIVABLE.forEach((ar) => {
      if (ar.aging_bucket === "Current") buckets.current += ar.balance;
      else if (ar.aging_bucket === "1-30 days") buckets["1-30"] += ar.balance;
      else if (ar.aging_bucket === "31-60 days") buckets["31-60"] += ar.balance;
      else if (ar.aging_bucket === "61-90 days") buckets["61-90"] += ar.balance;
    });
    return buckets;
  }, []);

  const agingMax = Math.max(agingBuckets.current, agingBuckets["1-30"], agingBuckets["31-60"], agingBuckets["61-90"], 1);

  /* ─── Revenue Trend Chart Data ──────────────────────────── */

  const monthlyData = FIN_METRICS.monthly_revenue_trend;
  const maxMonthly = Math.max(...monthlyData.map((m) => Math.max(m.revenue, m.expenses)));

  /* ─── Revenue Donut ─────────────────────────────────────── */

  const revenueSegments = FIN_METRICS.revenue_by_category.map((c, i) => ({
    value: c.amount,
    color: REVENUE_CAT_COLORS[i % REVENUE_CAT_COLORS.length],
  }));

  const totalRevenue = FIN_METRICS.revenue_by_category.reduce((s, c) => s + c.amount, 0);

  /* ─── Expense Donut ─────────────────────────────────────── */

  const expenseSegments = FIN_METRICS.expense_by_category.map((c) => ({
    value: c.amount,
    color: EXPENSE_CAT_COLORS[c.category.toLowerCase()] || "#94a3b8",
  }));

  const totalExpense = FIN_METRICS.expense_by_category.reduce((s, c) => s + c.amount, 0);

  /* ─── Render ─────────────────────────────────────────────── */

  return (
    <div className="min-h-full px-6 md:px-8 py-6 max-w-[1440px] mx-auto space-y-6">

      {/* ── Header ────────────────────────────────────────── */}
      <motion.div
        variants={cardV}
        custom={0}
        initial="hidden"
        animate="visible"
        className="flex items-center justify-between"
      >
        <div>
          <h1
            className="text-[24px] font-semibold tracking-tight"
            style={serif}
          >
            {ar ? "لوحة المالية" : "Finance Dashboard"}
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            {ar ? "نظرة شاملة على الوضع المالي" : "Comprehensive financial overview"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[
            { label: ar ? "فاتورة جديدة" : "New Invoice", icon: FileText, path: "/finance", color: "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100" },
            { label: ar ? "تسجيل دفعة" : "Record Payment", icon: CreditCard, path: "/finance", color: "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100" },
            { label: ar ? "عرض التقارير" : "View Reports", icon: BarChart3, path: "/reports", color: "bg-violet-50 text-violet-600 border-violet-100 hover:bg-violet-100" },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={() => navigate(btn.path)}
              className={`h-9 px-4 rounded-xl border text-[11px] font-medium flex items-center gap-1.5 transition-all duration-200 ${btn.color}`}
            >
              <btn.icon size={12} />
              {btn.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Tab Navigation ─────────────────────────────────── */}
      <motion.div variants={cardV} custom={1} initial="hidden" animate="visible">
        <div className="flex items-center gap-1 bg-muted/30 rounded-xl p-1 w-fit">
          {(["overview", "invoices", "payments", "expenses"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-[11px] font-medium transition-all duration-200 ${
                activeTab === tab
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "overview" ? (ar ? "نظرة عامة" : "Overview") :
               tab === "invoices" ? (ar ? "الفواتير" : "Invoices") :
               tab === "payments" ? (ar ? "المدفوعات" : "Payments") :
               (ar ? "المصروفات" : "Expenses")}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── KPI Cards (8 metrics, 2 rows) ──────────────────── */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {kpis.map((kpi, i) => (
          <motion.div
            key={i}
            variants={fadeUp}
            className={`${kpi.bg} rounded-2xl p-4 border ${kpi.border} hover:shadow-md transition-shadow duration-200 cursor-default`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-8 h-8 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                <kpi.icon size={15} className={kpi.color} />
              </div>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                kpi.changePositive ? "bg-emerald-100/60 text-emerald-600" : "bg-rose-100/60 text-rose-600"
              }`}>
                {kpi.change}
              </span>
            </div>
            <p
              className="text-[20px] font-bold text-foreground leading-none"
              style={serif}
            >
              {kpi.value}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">
              {kpi.label}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Overview Tab ───────────────────────────────────── */}
      {activeTab === "overview" && (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* ── Charts Row ──────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Revenue vs Expenses Bar Chart */}
            <motion.div
              variants={fadeUp}
              className="lg:col-span-2 p-5 rounded-2xl border border-border/40 bg-background shadow-sm"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[13px] font-semibold flex items-center gap-2">
                  <BarChart3 size={14} className="text-blue-500" />
                  {ar ? "الإيرادات مقابل المصروفات" : "Revenue vs Expenses"}
                </h3>
                <span className="text-[10px] text-muted-foreground">2026</span>
              </div>

              {/* Bar chart */}
              <div className="flex items-end gap-3 h-44 mb-3">
                {monthlyData.map((m, i) => {
                  const revH = (m.revenue / maxMonthly) * 100;
                  const expH = (m.expenses / maxMonthly) * 100;
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                      <div className="flex items-end gap-1 w-full h-full">
                        {/* Revenue bar */}
                        <div className="flex-1 flex flex-col justify-end h-full">
                          <motion.div
                            className="w-full rounded-t-md bg-emerald-400"
                            initial={{ height: 0 }}
                            animate={{ height: `${revH}%` }}
                            transition={{ duration: 0.6, delay: i * 0.08, ease: EASE }}
                            title={`${ar ? "الإيرادات" : "Revenue"}: ${formatEGP(m.revenue)}`}
                          />
                        </div>
                        {/* Expense bar */}
                        <div className="flex-1 flex flex-col justify-end h-full">
                          <motion.div
                            className="w-full rounded-t-md bg-rose-300"
                            initial={{ height: 0 }}
                            animate={{ height: `${expH}%` }}
                            transition={{ duration: 0.6, delay: i * 0.08 + 0.1, ease: EASE }}
                            title={`${ar ? "المصروفات" : "Expenses"}: ${formatEGP(m.expenses)}`}
                          />
                        </div>
                      </div>
                      <span className="text-[9px] text-muted-foreground font-medium">{m.month}</span>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-5 pt-3 border-t border-border/30">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
                  <span className="text-[10px] text-muted-foreground">{ar ? "الإيرادات" : "Revenue"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-rose-300" />
                  <span className="text-[10px] text-muted-foreground">{ar ? "المصروفات" : "Expenses"}</span>
                </div>
              </div>
            </motion.div>

            {/* Revenue by Category Donut */}
            <motion.div
              variants={fadeUp}
              className="p-5 rounded-2xl border border-border/40 bg-background shadow-sm"
            >
              <h3 className="text-[13px] font-semibold flex items-center gap-2 mb-4">
                <PieChartIcon size={14} className="text-emerald-500" />
                {ar ? "الإيرادات حسب الفئة" : "Revenue by Category"}
              </h3>

              <div className="flex justify-center mb-4">
                <DonutChart segments={revenueSegments} size={140} />
              </div>

              <div className="space-y-2">
                {FIN_METRICS.revenue_by_category.map((cat, i) => (
                  <div key={cat.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: REVENUE_CAT_COLORS[i % REVENUE_CAT_COLORS.length] }}
                      />
                      <span className="text-[11px] text-foreground">
                        {ar ? cat.category_ar : cat.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-foreground tabular-nums">
                        {formatEGP(cat.amount)}
                      </span>
                      <span className="text-[9px] text-muted-foreground tabular-nums w-8 text-right">
                        {Math.round((cat.amount / totalRevenue) * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ── Expense Breakdown + AR Aging ─────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Expense by Category */}
            <motion.div
              variants={fadeUp}
              className="p-5 rounded-2xl border border-border/40 bg-background shadow-sm"
            >
              <h3 className="text-[13px] font-semibold flex items-center gap-2 mb-4">
                <Receipt size={14} className="text-rose-500" />
                {ar ? "المصروفات حسب الفئة" : "Expense by Category"}
              </h3>
              <div className="space-y-3">
                {FIN_METRICS.expense_by_category.map((cat) => {
                  const pct = Math.round((cat.amount / totalExpense) * 100);
                  const color = EXPENSE_CAT_COLORS[cat.category.toLowerCase()] || "#94a3b8";
                  return (
                    <div key={cat.category}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <span className="text-[11px] font-medium text-foreground">
                            {ar ? cat.category_ar : cat.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium tabular-nums text-foreground">
                            {formatEGP(cat.amount)}
                          </span>
                          <span className="text-[9px] text-muted-foreground tabular-nums w-8 text-right">
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: EASE }}
                          style={{ backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Accounts Receivable Aging */}
            <motion.div
              variants={fadeUp}
              className="p-5 rounded-2xl border border-border/40 bg-background shadow-sm"
            >
              <h3 className="text-[13px] font-semibold flex items-center gap-2 mb-4">
                <Clock size={14} className="text-amber-500" />
                {ar ? "أعمار الحسابات المدينة" : "Accounts Receivable Aging"}
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: ar ? "Current" : "Current", value: agingBuckets.current, color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
                  { label: "1-30 " + (ar ? "يوم" : "days"), value: agingBuckets["1-30"], color: "bg-amber-50 text-amber-600 border-amber-100" },
                  { label: "31-60 " + (ar ? "يوم" : "days"), value: agingBuckets["31-60"], color: "bg-orange-50 text-orange-600 border-orange-100" },
                  { label: "61-90 " + (ar ? "يوم" : "days"), value: agingBuckets["61-90"], color: "bg-rose-50 text-rose-600 border-rose-100" },
                ].map((bucket, i) => (
                  <div
                    key={bucket.label}
                    className={`p-3 rounded-xl border ${bucket.color}`}
                  >
                    <p className="text-[10px] font-medium opacity-70">{bucket.label}</p>
                    <p
                      className="text-[18px] font-bold mt-1 leading-none"
                      style={serif}
                    >
                      {formatEGP(bucket.value)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Aging bar visualization */}
              <div className="space-y-2">
                {[
                  { label: ar ? "Current" : "Current", value: agingBuckets.current, color: "#10b981" },
                  { label: "1-30d", value: agingBuckets["1-30"], color: "#f59e0b" },
                  { label: "31-60d", value: agingBuckets["31-60"], color: "#f97316" },
                  { label: "61-90d", value: agingBuckets["61-90"], color: "#ef4444" },
                ].map((b, i) => (
                  <div key={b.label} className="flex items-center gap-3">
                    <span className="text-[10px] text-muted-foreground w-12 shrink-0">{b.label}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(b.value / agingMax) * 100}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1, ease: EASE }}
                        style={{ backgroundColor: b.color }}
                      />
                    </div>
                    <span className="text-[10px] font-medium tabular-nums text-foreground w-20 text-right">
                      {formatEGP(b.value)}
                    </span>
                  </div>
                ))}
              </div>

              {/* AR Items */}
              <div className="mt-4 space-y-2 border-t border-border/30 pt-3">
                {FIN_ACCOUNTS_RECEIVABLE.map((arItem) => (
                  <div key={arItem.id} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        arItem.status === "current" ? "bg-emerald-400" : "bg-rose-400"
                      }`} />
                      <span className="text-[11px] text-foreground truncate">
                        {arItem.customer_name}
                      </span>
                      <span className="text-[9px] text-muted-foreground">
                        {arItem.invoice_number}
                      </span>
                    </div>
                    <span className={`text-[11px] font-medium tabular-nums ${
                      arItem.days_overdue > 0 ? "text-rose-600" : "text-foreground"
                    }`}>
                      {formatEGP(arItem.balance)}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ── Recent Invoices ─────────────────────────────── */}
          <motion.div
            variants={fadeUp}
            className="p-5 rounded-2xl border border-border/40 bg-background shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-semibold flex items-center gap-2">
                <FileText size={14} className="text-blue-500" />
                {ar ? "الفواتير الأخيرة" : "Recent Invoices"}
              </h3>
              <button
                onClick={() => navigate("/finance")}
                className="text-[11px] text-primary hover:opacity-70 flex items-center gap-1"
              >
                {ar ? "عرض الكل" : "View all"} <ChevronRight size={11} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/30">
                    {[
                      ar ? "رقم الفاتورة" : "Invoice #",
                      ar ? "العميل" : "Customer",
                      ar ? "المبلغ" : "Amount",
                      ar ? "التاريخ" : "Date",
                      ar ? "الحالة" : "Status",
                      ar ? "المتبقي" : "Balance",
                    ].map((h) => (
                      <th key={h} className="text-[10px] font-medium text-muted-foreground text-left pb-2 pr-4 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((inv) => {
                    const st = STATUS_STYLES[inv.status] || STATUS_STYLES.draft;
                    return (
                      <tr
                        key={inv.id}
                        className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                        onClick={() => navigate("/finance")}
                      >
                        <td className="py-2.5 pr-4">
                          <span className="text-[11px] font-medium text-foreground tabular-nums">
                            {inv.invoice_number}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className="text-[11px] text-foreground">
                            {ar ? inv.customer_name_ar : inv.customer_name}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className="text-[11px] font-medium tabular-nums text-foreground">
                            {formatEGP(inv.total)}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className="text-[11px] text-muted-foreground tabular-nums">
                            {inv.issue_date}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>
                            <span className={`w-1 h-1 rounded-full ${st.dot}`} />
                            {ar ? (inv.status === "paid" ? "مدفوعة" : inv.status === "overdue" ? "متأخرة" : inv.status === "sent" ? "مُرسلة" : inv.status === "draft" ? "مسودة" : inv.status === "partial" ? "جزئية" : inv.status) : inv.status}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className={`text-[11px] font-medium tabular-nums ${
                            inv.balance > 0 ? "text-rose-600" : "text-emerald-600"
                          }`}>
                            {formatEGP(inv.balance)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* ── Pending Payments + Quick Actions ─────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Pending Payments */}
            <motion.div
              variants={fadeUp}
              className="p-5 rounded-2xl border border-border/40 bg-background shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[13px] font-semibold flex items-center gap-2">
                  <WalletCards size={14} className="text-amber-500" />
                  {ar ? "المدفوعات المعلقة" : "Pending Payments"}
                </h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 font-medium">
                  {pendingPayments.length}
                </span>
              </div>
              {pendingPayments.length === 0 ? (
                <p className="text-[11px] text-muted-foreground text-center py-6">
                  {ar ? "لا توجد مدفوعات معلقة" : "No pending payments"}
                </p>
              ) : (
                <div className="space-y-2">
                  {pendingPayments.map((pay) => {
                    const st = STATUS_STYLES[pay.status] || STATUS_STYLES.pending;
                    const method = METHOD_LABELS[pay.method] || { en: pay.method, ar: pay.method };
                    return (
                      <div
                        key={pay.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-border/30 hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                            <CreditCard size={13} className="text-amber-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium text-foreground truncate">
                              {ar ? pay.customer_name_ar : pay.customer_name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] text-muted-foreground">
                                {ar ? method.ar : method.en}
                              </span>
                              <span className="text-[9px] text-muted-foreground">·</span>
                              <span className="text-[9px] text-muted-foreground tabular-nums">
                                {pay.date}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="text-[12px] font-semibold tabular-nums text-foreground shrink-0 ml-3">
                          {formatEGP(pay.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              variants={fadeUp}
              className="p-5 rounded-2xl border border-border/40 bg-background shadow-sm"
            >
              <h3 className="text-[13px] font-semibold flex items-center gap-2 mb-4">
                <Zap size={14} className="text-violet-500" />
                {ar ? "إجراءات سريعة" : "Quick Actions"}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: ar ? "إنشاء فاتورة" : "Create Invoice", icon: FileText, path: "/finance", color: "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100" },
                  { label: ar ? "تسجيل دفعة" : "Record Payment", icon: CreditCard, path: "/finance", color: "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100" },
                  { label: ar ? "إضافة مصروف" : "Add Expense", icon: Receipt, path: "/finance", color: "bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100" },
                  { label: ar ? "عرض التقارير" : "View Reports", icon: BarChart3, path: "/reports", color: "bg-violet-50 text-violet-600 border-violet-100 hover:bg-violet-100" },
                  { label: ar ? "تسوية بنكية" : "Bank Reconciliation", icon: Landmark, path: "/finance", color: "bg-teal-50 text-teal-600 border-teal-100 hover:bg-teal-100" },
                ].map((action) => (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.path)}
                    className={`h-10 px-3.5 rounded-xl border text-[11px] font-medium flex items-center gap-2 transition-all duration-200 ${action.color}`}
                  >
                    <action.icon size={13} />
                    {action.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* ── Invoices Tab ───────────────────────────────────── */}
      {activeTab === "invoices" && (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          <motion.div
            variants={fadeUp}
            className="p-5 rounded-2xl border border-border/40 bg-background shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-semibold flex items-center gap-2">
                <FileText size={14} className="text-blue-500" />
                {ar ? "جميع الفواتير" : "All Invoices"}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">
                  {FIN_INVOICES.length} {ar ? "فواتير" : "invoices"}
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/30">
                    {[
                      ar ? "رقم" : "#",
                      ar ? "العميل" : "Customer",
                      ar ? "العنوان" : "Title",
                      ar ? "المبلغ" : "Amount",
                      ar ? "المدفوع" : "Paid",
                      ar ? "المتبقي" : "Balance",
                      ar ? "تاريخ الاستحقاق" : "Due Date",
                      ar ? "الحالة" : "Status",
                    ].map((h) => (
                      <th key={h} className="text-[10px] font-medium text-muted-foreground text-left pb-2 pr-4 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FIN_INVOICES.map((inv) => {
                    const st = STATUS_STYLES[inv.status] || STATUS_STYLES.draft;
                    return (
                      <tr
                        key={inv.id}
                        className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                        onClick={() => navigate("/finance")}
                      >
                        <td className="py-2.5 pr-4">
                          <span className="text-[11px] font-medium text-foreground tabular-nums">
                            {inv.invoice_number}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className="text-[11px] text-foreground">
                            {ar ? inv.customer_name_ar : inv.customer_name}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className="text-[11px] text-muted-foreground truncate max-w-[180px] block">
                            {ar ? inv.title_ar : inv.title}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className="text-[11px] font-medium tabular-nums text-foreground">
                            {formatEGP(inv.total)}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className="text-[11px] tabular-nums text-emerald-600">
                            {formatEGP(inv.paid_amount)}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className={`text-[11px] font-medium tabular-nums ${
                            inv.balance > 0 ? "text-rose-600" : "text-emerald-600"
                          }`}>
                            {formatEGP(inv.balance)}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className="text-[11px] text-muted-foreground tabular-nums">
                            {inv.due_date}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>
                            <span className={`w-1 h-1 rounded-full ${st.dot}`} />
                            {ar ? (inv.status === "paid" ? "مدفوعة" : inv.status === "overdue" ? "متأخرة" : inv.status === "sent" ? "مُرسلة" : inv.status === "draft" ? "مسودة" : inv.status === "partial" ? "جزئية" : inv.status) : inv.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ── Payments Tab ───────────────────────────────────── */}
      {activeTab === "payments" && (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          <motion.div
            variants={fadeUp}
            className="p-5 rounded-2xl border border-border/40 bg-background shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-semibold flex items-center gap-2">
                <CreditCard size={14} className="text-emerald-500" />
                {ar ? "جميع المدفوعات" : "All Payments"}
              </h3>
              <span className="text-[10px] text-muted-foreground">
                {FIN_PAYMENTS.length} {ar ? "مدفوعات" : "payments"}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/30">
                    {[
                      ar ? "رقم المرجع" : "Reference",
                      ar ? "العميل" : "Customer",
                      ar ? "الفاتورة" : "Invoice",
                      ar ? "المبلغ" : "Amount",
                      ar ? "الطريقة" : "Method",
                      ar ? "التاريخ" : "Date",
                      ar ? "الحالة" : "Status",
                    ].map((h) => (
                      <th key={h} className="text-[10px] font-medium text-muted-foreground text-left pb-2 pr-4 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FIN_PAYMENTS.map((pay) => {
                    const st = STATUS_STYLES[pay.status] || STATUS_STYLES.pending;
                    const method = METHOD_LABELS[pay.method] || { en: pay.method, ar: pay.method };
                    return (
                      <tr
                        key={pay.id}
                        className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                        onClick={() => navigate("/finance")}
                      >
                        <td className="py-2.5 pr-4">
                          <span className="text-[11px] font-medium text-foreground tabular-nums">
                            {pay.reference}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className="text-[11px] text-foreground">
                            {ar ? pay.customer_name_ar : pay.customer_name}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className="text-[11px] text-muted-foreground tabular-nums">
                            {pay.invoice_number}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className="text-[11px] font-medium tabular-nums text-foreground">
                            {formatEGP(pay.amount)}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className="text-[11px] text-muted-foreground">
                            {ar ? method.ar : method.en}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className="text-[11px] text-muted-foreground tabular-nums">
                            {pay.date}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>
                            <span className={`w-1 h-1 rounded-full ${st.dot}`} />
                            {ar ? (pay.status === "completed" ? "مكتملة" : pay.status === "pending" ? "معلقة" : pay.status === "failed" ? "فاشلة" : pay.status) : pay.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ── Expenses Tab ───────────────────────────────────── */}
      {activeTab === "expenses" && (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          <motion.div
            variants={fadeUp}
            className="p-5 rounded-2xl border border-border/40 bg-background shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-semibold flex items-center gap-2">
                <Receipt size={14} className="text-rose-500" />
                {ar ? "جميع المصروفات" : "All Expenses"}
              </h3>
              <span className="text-[10px] text-muted-foreground">
                {FIN_EXPENSES.length} {ar ? "مصروفات" : "expenses"}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/30">
                    {[
                      ar ? "المورد" : "Vendor",
                      ar ? "الفئة" : "Category",
                      ar ? "الوصف" : "Description",
                      ar ? "المبلغ" : "Amount",
                      ar ? "التاريخ" : "Date",
                      ar ? "الحالة" : "Status",
                      ar ? "متكرر" : "Recurring",
                    ].map((h) => (
                      <th key={h} className="text-[10px] font-medium text-muted-foreground text-left pb-2 pr-4 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FIN_EXPENSES.map((exp) => {
                    const st = STATUS_STYLES[exp.status] || STATUS_STYLES.draft;
                    return (
                      <tr
                        key={exp.id}
                        className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                        onClick={() => navigate("/finance")}
                      >
                        <td className="py-2.5 pr-4">
                          <span className="text-[11px] text-foreground">
                            {ar ? exp.vendor_ar : exp.vendor}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: EXPENSE_CAT_COLORS[exp.category] || "#94a3b8" }}
                            />
                            <span className="text-[11px] text-muted-foreground capitalize">
                              {ar ? (exp.category === "rent" ? "الإيجار" : exp.category === "salaries" ? "الرواتب" : exp.category === "utilities" ? "المرافق" : exp.category === "marketing" ? "التسويق" : exp.category === "supplies" ? "المستلزمات" : exp.category === "technology" ? "التكنولوجيا" : exp.category === "insurance" ? "التأمين" : exp.category === "maintenance" ? "الصيانة" : exp.category) : exp.category}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className="text-[11px] text-muted-foreground truncate max-w-[200px] block">
                            {ar ? exp.description_ar : exp.description}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className="text-[11px] font-medium tabular-nums text-foreground">
                            {formatEGP(exp.amount)}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className="text-[11px] text-muted-foreground tabular-nums">
                            {exp.date}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>
                            <span className={`w-1 h-1 rounded-full ${st.dot}`} />
                            {ar ? (exp.status === "paid" ? "مدفوع" : exp.status === "pending" ? "معلق" : exp.status === "approved" ? "معتمد" : exp.status === "draft" ? "مسودة" : exp.status) : exp.status}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          {exp.recurring ? (
                            <CheckCircle2 size={12} className="text-emerald-500" />
                          ) : (
                            <XCircle size={12} className="text-muted-foreground/30" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

/* ─── Pie Chart Icon (replaces missing lucide icon) ──────── */

function PieChartIcon({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  );
}

/* ─── Zap Icon (inline since lucide Zap may not be imported) ── */

function Zap({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
