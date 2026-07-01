import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { FIN_PROFIT_LOSS, FIN_CASH_FLOW, FIN_TAX_RECORDS, FIN_METRICS } from "../lib/finance-data";
import {
  FileText, TrendingUp, TrendingDown, DollarSign, ArrowDown, ArrowUp,
  BarChart3, Calculator, Receipt, Shield, ChevronDown,
} from "lucide-react";

type ReportTab = "pnl" | "cashflow" | "tax";

const TABS: { id: ReportTab; en: string; ar: string }[] = [
  { id: "pnl", en: "Profit & Loss", ar: "الأرباح والخسائر" },
  { id: "cashflow", en: "Cash Flow", ar: "التدفقات النقدية" },
  { id: "tax", en: "Tax Summary", ar: "ملخص الضرائب" },
];

const PERIODS = ["2026-Q2", "2026-Q1", "2025-Q4", "2025-Q3"];

function fmt(n: number) {
  return new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", minimumFractionDigits: 0 }).format(n);
}

function fmtShort(n: number) {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border/40 rounded-xl bg-background overflow-hidden">
      <div className="px-6 py-4 border-b border-border/30">
        <h3 className="text-[11px] font-semibold text-muted-foreground tracking-[0.08em] uppercase">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function RowItem({ label, amount, indent }: { label: string; amount: number; indent?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-6 py-3 ${indent ? "ps-10" : ""}`}>
      <span className="text-[13px] text-foreground">{label}</span>
      <span className="text-[13px] font-mono tabular-nums text-foreground">{fmt(amount)}</span>
    </div>
  );
}

function TotalRow({ label, amount, positive }: { label: string; amount: number; positive?: boolean }) {
  const color = positive === true ? "text-emerald-600" : positive === false ? "text-rose-500" : "text-foreground";
  return (
    <div className="flex items-center justify-between px-6 py-3.5 bg-muted/20 border-t border-border/30">
      <span className="text-[13px] font-semibold text-foreground">{label}</span>
      <span className={`text-[14px] font-bold tabular-nums ${color}`}>{fmt(amount)}</span>
    </div>
  );
}

function CashFlowRow({ label, amount }: { label: string; amount: number }) {
  const isNegative = amount < 0;
  return (
    <div className="flex items-center justify-between px-6 py-3">
      <span className="text-[13px] text-foreground">{label}</span>
      <span className={`text-[13px] font-mono tabular-nums ${isNegative ? "text-rose-500" : "text-emerald-600"}`}>
        {isNegative ? `(${fmt(Math.abs(amount))})` : fmt(amount)}
      </span>
    </div>
  );
}

const TAX_STATUS: Record<string, { en: string; ar: string; color: string; dot: string }> = {
  paid: { en: "Paid", ar: "مدفوع", color: "text-emerald-600", dot: "bg-emerald-500" },
  pending: { en: "Pending", ar: "قيد الانتظار", color: "text-amber-600", dot: "bg-amber-500" },
  overdue: { en: "Overdue", ar: "متأخرة", color: "text-rose-500", dot: "bg-rose-500" },
  filed: { en: "Filed", ar: "مُقدّمة", color: "text-blue-500", dot: "bg-blue-500" },
};

const TAX_TYPE: Record<string, { en: string; ar: string }> = {
  vat: { en: "VAT", ar: "ضريبة القيمة المضافة" },
  income_tax: { en: "Income Tax", ar: "ضريبة الدخل" },
  social_insurance: { en: "Social Insurance", ar: "التأمينات الاجتماعية" },
  stamp_duty: { en: "Stamp Duty", ar: "ضريبة الدمغة" },
};

export default function FinanceReports() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [activeTab, setActiveTab] = useState<ReportTab>("pnl");
  const [period, setPeriod] = useState(PERIODS[0]);
  const [periodOpen, setPeriodOpen] = useState(false);

  const pl = FIN_PROFIT_LOSS;
  const cf = FIN_CASH_FLOW;
  const metrics = FIN_METRICS;

  const totalRevenue = pl.revenue.reduce((s, r) => s + r.amount, 0);
  const totalCOGS = pl.cost_of_goods.reduce((s, r) => s + r.amount, 0);
  const grossProfit = totalRevenue - totalCOGS;
  const totalOpex = pl.operating_expenses.reduce((s, r) => s + r.amount, 0);
  const netProfit = grossProfit - totalOpex;
  const grossMargin = Math.round((grossProfit / totalRevenue) * 100);
  const netMargin = Math.round((netProfit / totalRevenue) * 100);

  const cfOperating = cf.operating.reduce((s, r) => s + r.amount, 0);
  const cfInvesting = cf.investing.reduce((s, r) => s + r.amount, 0);
  const cfFinancing = cf.financing.reduce((s, r) => s + r.amount, 0);
  const netCashFlow = cfOperating + cfInvesting + cfFinancing;

  const vatRecords = FIN_TAX_RECORDS.filter((r) => r.type === "vat");
  const incomeRecords = FIN_TAX_RECORDS.filter((r) => r.type === "income_tax");
  const socialRecords = FIN_TAX_RECORDS.filter((r) => r.type === "social_insurance");

  const maxRevenue = Math.max(...pl.revenue.map((r) => r.amount));
  const maxExpense = Math.max(...pl.operating_expenses.map((r) => r.amount));

  return (
    <div className="min-h-full">
      {/* ═══ HEADER ═══ */}
      <div className="relative border-b border-border/40" style={{ background: "linear-gradient(160deg, hsl(var(--muted)/0.35) 0%, hsl(var(--background)) 65%)" }}>
        <div className="px-8 md:px-10 pt-6 pb-6 max-w-[960px]">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center"><BarChart3 size={18} strokeWidth={1.75} className="text-primary" /></div>
            <div>
              <h1 className="text-[22px] md:text-[26px] font-medium text-foreground leading-tight" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.03em" }}>
                {ar ? "التقارير المالية" : "Financial Reports"}
              </h1>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                {ar ? "نظرة شاملة على المالية" : "Comprehensive financial overview for your business"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-5 flex-wrap">
            {/* Period Selector */}
            <div className="relative">
              <button
                onClick={() => setPeriodOpen(!periodOpen)}
                className="h-8 px-3.5 rounded-xl border border-border text-[12px] font-medium text-foreground hover:bg-muted flex items-center gap-2 transition-colors"
              >
                <FileText size={13} strokeWidth={1.75} />
                {period}
                <ChevronDown size={12} strokeWidth={2} className="text-muted-foreground" />
              </button>
              {periodOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setPeriodOpen(false)} />
                  <div className="absolute top-full mt-1.5 start-0 z-50 bg-background border border-border/60 rounded-xl shadow-lg py-1.5 min-w-[140px]">
                    {PERIODS.map((p) => (
                      <button
                        key={p}
                        onClick={() => { setPeriod(p); setPeriodOpen(false); }}
                        className={`w-full px-4 py-2 text-[12px] text-start transition-colors ${p === period ? "text-primary bg-primary/5 font-medium" : "text-foreground hover:bg-muted"}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* KPI cards */}
            <div className="flex items-center gap-3 flex-wrap">
              {[
                { label: ar ? "الإيرادات" : "Revenue", value: fmt(totalRevenue), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: ar ? "صافي الربح" : "Net Profit", value: fmt(netProfit), icon: DollarSign, color: netProfit >= 0 ? "text-emerald-600" : "text-rose-500", bg: netProfit >= 0 ? "bg-emerald-50" : "bg-rose-50" },
                { label: ar ? "هامش الربح الصافي" : "Net Margin", value: `${netMargin}%`, icon: Calculator, color: "text-primary", bg: "bg-primary/8" },
              ].map((kpi) => (
                <div key={kpi.label} className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-background border border-border/40">
                  <div className={`w-7 h-7 rounded-lg ${kpi.bg} flex items-center justify-center`}><kpi.icon size={13} strokeWidth={1.75} className={kpi.color} /></div>
                  <div>
                    <p className="text-[10px] text-muted-foreground/70">{kpi.label}</p>
                    <p className="text-[13px] font-semibold text-foreground tabular-nums">{kpi.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ TAB BAR ═══ */}
      <div className="border-b border-border/40 bg-background sticky top-0 z-10">
        <div className="px-8 md:px-10 flex items-center gap-0 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-[12px] font-medium whitespace-nowrap border-b-2 transition-all ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/60"
              }`}
            >
              {ar ? tab.ar : tab.en}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ TAB CONTENT ═══ */}
      <div className="px-8 md:px-10 py-7 max-w-[960px]">

        {/* ── PROFIT & LOSS ── */}
        {activeTab === "pnl" && (
          <div className="space-y-6">
            {/* Revenue */}
            <Section title={ar ? "الإيرادات" : "Revenue"}>
              <div className="divide-y divide-border/25">
                {pl.revenue.map((item) => (
                  <RowItem key={item.label} label={ar ? item.label_ar : item.label} amount={item.amount} />
                ))}
              </div>
              <TotalRow label={ar ? "إجمالي الإيرادات" : "Total Revenue"} amount={totalRevenue} positive />
            </Section>

            {/* COGS */}
            <Section title={ar ? "تكلفة البضاعة المباعة" : "Cost of Goods Sold"}>
              <div className="divide-y divide-border/25">
                {pl.cost_of_goods.map((item) => (
                  <RowItem key={item.label} label={ar ? item.label_ar : item.label} amount={item.amount} />
                ))}
              </div>
              <TotalRow label={ar ? "إجمالي تكلفة البضاعة" : "Total COGS"} amount={totalCOGS} />
            </Section>

            {/* Gross Profit */}
            <div className="border border-border/40 rounded-xl bg-background overflow-hidden">
              <div className="px-6 py-4 flex items-center justify-between bg-emerald-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center"><TrendingUp size={14} strokeWidth={1.75} className="text-emerald-600" /></div>
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">{ar ? "صافي الربح الإجمالي" : "Gross Profit"}</p>
                    <p className="text-[11px] text-muted-foreground/70">{ar ? `هامش ${grossMargin}%` : `${grossMargin}% margin`}</p>
                  </div>
                </div>
                <span className="text-[18px] font-bold text-emerald-600 tabular-nums" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.02em" }}>{fmt(grossProfit)}</span>
              </div>
            </div>

            {/* Operating Expenses */}
            <Section title={ar ? "المصروفات التشغيلية" : "Operating Expenses"}>
              <div className="divide-y divide-border/25">
                {pl.operating_expenses.map((item) => (
                  <RowItem key={item.label} label={ar ? item.label_ar : item.label} amount={item.amount} />
                ))}
              </div>
              <TotalRow label={ar ? "إجمالي المصروفات التشغيلية" : "Total Operating Expenses"} amount={totalOpex} />
            </Section>

            {/* Net Profit */}
            <div className="border border-border/40 rounded-xl bg-background overflow-hidden">
              <div className={`px-6 py-5 flex items-center justify-between ${netProfit >= 0 ? "bg-emerald-50/50" : "bg-rose-50/50"}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${netProfit >= 0 ? "bg-emerald-50" : "bg-rose-50"} flex items-center justify-center`}>
                    <DollarSign size={16} strokeWidth={1.75} className={netProfit >= 0 ? "text-emerald-600" : "text-rose-500"} />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-foreground">{ar ? "صافي الربح" : "Net Profit"}</p>
                    <p className="text-[11px] text-muted-foreground/70">{ar ? `هامش صافي ${netMargin}%` : `Net margin ${netMargin}%`}</p>
                  </div>
                </div>
                <span className={`text-[22px] font-bold tabular-nums ${netProfit >= 0 ? "text-emerald-600" : "text-rose-500"}`} style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.03em" }}>{fmt(netProfit)}</span>
              </div>
            </div>

            {/* Visual bar: Revenue vs Expenses */}
            <Section title={ar ? "مقارنة الإيرادات والمصروفات" : "Revenue vs Expenses"}>
              <div className="px-6 py-5 space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] text-muted-foreground">{ar ? "الإيرادات" : "Revenue"}</span>
                    <span className="text-[12px] font-mono tabular-nums text-emerald-600">{fmt(totalRevenue)}</span>
                  </div>
                  <div className="h-4 rounded-full bg-muted/40 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: "100%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] text-muted-foreground">{ar ? "المصروفات" : "Expenses"}</span>
                    <span className="text-[12px] font-mono tabular-nums text-rose-500">{fmt(totalCOGS + totalOpex)}</span>
                  </div>
                  <div className="h-4 rounded-full bg-muted/40 overflow-hidden">
                    <div className="h-full rounded-full bg-rose-400 transition-all duration-700" style={{ width: `${Math.round(((totalCOGS + totalOpex) / totalRevenue) * 100)}%` }} />
                  </div>
                </div>
                <div className="pt-3 border-t border-border/30">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">{ar ? "الربح الإجمالي" : "Gross Profit"}</p>
                      <p className="text-[14px] font-semibold text-foreground tabular-nums">{fmt(grossProfit)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">{ar ? "صافي الربح" : "Net Profit"}</p>
                      <p className={`text-[14px] font-semibold tabular-nums ${netProfit >= 0 ? "text-emerald-600" : "text-rose-500"}`}>{fmt(netProfit)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">{ar ? "هامش الربح" : "Margin"}</p>
                      <p className={`text-[14px] font-semibold tabular-nums ${netMargin >= 0 ? "text-emerald-600" : "text-rose-500"}`}>{netMargin}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </Section>
          </div>
        )}

        {/* ── CASH FLOW ── */}
        {activeTab === "cashflow" && (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: ar ? "الأنشطة التشغيلية" : "Operating", value: cfOperating, icon: ArrowUp, color: cfOperating >= 0 ? "text-emerald-600" : "text-rose-500", bg: cfOperating >= 0 ? "bg-emerald-50" : "bg-rose-50" },
                { label: ar ? "الأنشطة الاستثمارية" : "Investing", value: cfInvesting, icon: ArrowDown, color: cfInvesting >= 0 ? "text-emerald-600" : "text-rose-500", bg: cfInvesting >= 0 ? "bg-emerald-50" : "bg-rose-50" },
                { label: ar ? "الأنشطة التمويلية" : "Financing", value: cfFinancing, icon: DollarSign, color: cfFinancing >= 0 ? "text-emerald-600" : "text-rose-500", bg: cfFinancing >= 0 ? "bg-emerald-50" : "bg-rose-50" },
              ].map((s) => (
                <div key={s.label} className="border border-border/40 rounded-xl bg-background p-4 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}><s.icon size={15} strokeWidth={1.75} className={s.color} /></div>
                  <div>
                    <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wide">{s.label}</p>
                    <p className={`text-[15px] font-semibold tabular-nums ${s.color}`}>{fmtShort(s.value)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Operating */}
            <Section title={ar ? "الأنشطة التشغيلية" : "Operating Activities"}>
              <div className="divide-y divide-border/25">
                {cf.operating.map((item) => (
                  <CashFlowRow key={item.label} label={ar ? item.label_ar : item.label} amount={item.amount} />
                ))}
              </div>
              <TotalRow label={ar ? "صافي التدفق التشغيلي" : "Net Operating Cash Flow"} amount={cfOperating} positive={cfOperating >= 0} />
            </Section>

            {/* Investing */}
            <Section title={ar ? "الأنشطة الاستثمارية" : "Investing Activities"}>
              <div className="divide-y divide-border/25">
                {cf.investing.map((item) => (
                  <CashFlowRow key={item.label} label={ar ? item.label_ar : item.label} amount={item.amount} />
                ))}
              </div>
              <TotalRow label={ar ? "صافي التدفق الاستثماري" : "Net Investing Cash Flow"} amount={cfInvesting} positive={cfInvesting >= 0} />
            </Section>

            {/* Financing */}
            <Section title={ar ? "الأنشطة التمويلية" : "Financing Activities"}>
              <div className="divide-y divide-border/25">
                {cf.financing.map((item) => (
                  <CashFlowRow key={item.label} label={ar ? item.label_ar : item.label} amount={item.amount} />
                ))}
              </div>
              <TotalRow label={ar ? "صافي التدفق التمويلي" : "Net Financing Cash Flow"} amount={cfFinancing} positive={cfFinancing >= 0} />
            </Section>

            {/* Net Cash Flow */}
            <div className="border border-border/40 rounded-xl bg-background overflow-hidden">
              <div className={`px-6 py-5 flex items-center justify-between ${netCashFlow >= 0 ? "bg-emerald-50/50" : "bg-rose-50/50"}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${netCashFlow >= 0 ? "bg-emerald-50" : "bg-rose-50"} flex items-center justify-center`}>
                    <DollarSign size={16} strokeWidth={1.75} className={netCashFlow >= 0 ? "text-emerald-600" : "text-rose-500"} />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-foreground">{ar ? "صافي التدفق النقدي" : "Net Cash Flow"}</p>
                    <p className="text-[11px] text-muted-foreground/70">{ar ? "للفترة" : "for the period"}</p>
                  </div>
                </div>
                <span className={`text-[22px] font-bold tabular-nums ${netCashFlow >= 0 ? "text-emerald-600" : "text-rose-500"}`} style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.03em" }}>{fmt(netCashFlow)}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── TAX SUMMARY ── */}
        {activeTab === "tax" && (
          <div className="space-y-6">
            {/* Filing Status Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: ar ? "إجمالي الضريبة" : "Total Tax", value: fmt(FIN_TAX_RECORDS.reduce((s, r) => s + r.amount, 0)), icon: Receipt, color: "text-primary", bg: "bg-primary/8" },
                { label: ar ? "مدفوع" : "Paid", value: FIN_TAX_RECORDS.filter((r) => r.status === "paid").length.toString(), icon: Shield, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: ar ? "قيد الانتظار" : "Pending", value: FIN_TAX_RECORDS.filter((r) => r.status === "pending").length.toString(), icon: FileText, color: "text-amber-600", bg: "bg-amber-50" },
                { label: ar ? "متأخرة" : "Overdue", value: FIN_TAX_RECORDS.filter((r) => r.status === "overdue").length.toString(), icon: TrendingDown, color: "text-rose-500", bg: "bg-rose-50" },
              ].map((s) => (
                <div key={s.label} className="border border-border/40 rounded-xl bg-background p-4 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}><s.icon size={14} strokeWidth={1.75} className={s.color} /></div>
                  <div>
                    <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wide">{s.label}</p>
                    <p className="text-[14px] font-semibold text-foreground tabular-nums">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* VAT Records */}
            <Section title={ar ? "سجلات ضريبة القيمة المضافة" : "VAT Records"}>
              <div className="divide-y divide-border/25">
                {vatRecords.map((rec) => {
                  const st = TAX_STATUS[rec.status];
                  return (
                    <div key={rec.id} className="flex items-center justify-between px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${st.dot}`} />
                        <div>
                          <p className="text-[13px] font-medium text-foreground">{rec.period}</p>
                          <p className="text-[11px] text-muted-foreground/60">{rec.reference}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-[11px] font-medium ${st.color}`}>{ar ? st.ar : st.en}</span>
                        <span className="text-[13px] font-mono tabular-nums text-foreground">{fmt(rec.amount)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between px-6 py-3.5 bg-muted/20 border-t border-border/30">
                <span className="text-[13px] font-semibold text-foreground">{ar ? "إجمالي VAT" : "Total VAT"}</span>
                <span className="text-[14px] font-bold text-foreground tabular-nums">{fmt(vatRecords.reduce((s, r) => s + r.amount, 0))}</span>
              </div>
            </Section>

            {/* Income Tax Records */}
            <Section title={ar ? "سجلات ضريبة الدخل" : "Income Tax Records"}>
              <div className="divide-y divide-border/25">
                {incomeRecords.map((rec) => {
                  const st = TAX_STATUS[rec.status];
                  return (
                    <div key={rec.id} className="flex items-center justify-between px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${st.dot}`} />
                        <div>
                          <p className="text-[13px] font-medium text-foreground">{rec.period}</p>
                          <p className="text-[11px] text-muted-foreground/60">{rec.reference}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-[11px] font-medium ${st.color}`}>{ar ? st.ar : st.en}</span>
                        <span className="text-[13px] font-mono tabular-nums text-foreground">{fmt(rec.amount)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>

            {/* Social Insurance Records */}
            <Section title={ar ? "سجلات التأمينات الاجتماعية" : "Social Insurance Records"}>
              <div className="divide-y divide-border/25">
                {socialRecords.map((rec) => {
                  const st = TAX_STATUS[rec.status];
                  return (
                    <div key={rec.id} className="flex items-center justify-between px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${st.dot}`} />
                        <div>
                          <p className="text-[13px] font-medium text-foreground">{rec.period}</p>
                          <p className="text-[11px] text-muted-foreground/60">{rec.reference}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-[11px] font-medium ${st.color}`}>{ar ? st.ar : st.en}</span>
                        <span className="text-[13px] font-mono tabular-nums text-foreground">{fmt(rec.amount)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between px-6 py-3.5 bg-muted/20 border-t border-border/30">
                <span className="text-[13px] font-semibold text-foreground">{ar ? "إجمالي التأمينات" : "Total Social Insurance"}</span>
                <span className="text-[14px] font-bold text-foreground tabular-nums">{fmt(socialRecords.reduce((s, r) => s + r.amount, 0))}</span>
              </div>
            </Section>

            {/* Filing Status & Due Dates */}
            <Section title={ar ? "حالة التقديم والمواعيد النهائية" : "Filing Status & Due Dates"}>
              <div className="divide-y divide-border/25">
                {FIN_TAX_RECORDS.map((rec) => {
                  const st = TAX_STATUS[rec.status];
                  const type = TAX_TYPE[rec.type];
                  return (
                    <div key={rec.id} className="flex items-center justify-between px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${st.dot}/10 flex items-center justify-center`}>
                          <div className={`w-2.5 h-2.5 rounded-full ${st.dot}`} />
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-foreground">{ar ? type.ar : type.en}</p>
                          <p className="text-[11px] text-muted-foreground/60">{rec.period}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-end">
                          <p className="text-[11px] text-muted-foreground/60">{ar ? "الاستحقاق" : "Due"}</p>
                          <p className="text-[12px] font-mono tabular-nums text-foreground">{rec.due_date}</p>
                        </div>
                        <div className="text-end">
                          <p className="text-[11px] text-muted-foreground/60">{ar ? "المبلغ" : "Amount"}</p>
                          <p className="text-[12px] font-mono tabular-nums text-foreground">{fmt(rec.amount)}</p>
                        </div>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${st.color} ${st.dot}/10`}>{ar ? st.ar : st.en}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}
