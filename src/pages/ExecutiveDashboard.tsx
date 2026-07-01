/**
 * Sky Eye — Business Owner Dashboard
 *
 * A comprehensive daily command center. Shows everything a business owner
 * needs to make decisions: revenue, pipeline, orders, production, inventory,
 * customers, risks, and intelligence. Clicking any item opens a detail
 * drawer; "View full" navigates to the complete module page.
 */

import { useMemo, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "../context/LanguageContext";
import { useOnboarding } from "../context/OnboardingContext";
import { useAuth } from "../context/AuthContext";
import { isDemoMode } from "../lib/supabase";
import { useDashboardData } from "../lib/useDashboardData";
import {
  generateExecutiveBriefing,
  generateIntelligenceFeed,
  generateWorkQueue,
  detectAllRisks,
  type FeedItem,
  type FeedItemType,
} from "../data/executiveIntelligence";
import { computeBusinessHealth } from "../data/intelligence";
import { loadDeals, formatCurrency } from "../data/sales";
import { loadWorkItems } from "../data/work";
import { loadInvoices, loadExpenses } from "../data/finance";
import { loadOrganizations } from "../data/organizations";
import { loadResources } from "../data/resources";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2,
  Lightbulb, Zap, Shield, Flame, ChevronRight, Activity,
  Briefcase, ShoppingBag, Landmark, Package, Users, Building2,
  Star, Radio, Target, ArrowRight, X, Eye, Clock,
  CircleDollarSign, Truck, Warehouse, UserCheck, BarChart3,
  ShoppingCart, CalendarDays, ArrowUpRight, Loader2, Factory,
} from "lucide-react";

// ─── Feed type styling ───────────────────────────────────

const FEED_STYLE: Record<FeedItemType, { bg: string; border: string; iconCl: string; icon: React.ElementType; dot: string }> = {
  alert:       { bg: "bg-rose-50",    border: "border-rose-200/60",   iconCl: "text-rose-600",    icon: AlertTriangle, dot: "bg-rose-500" },
  win:         { bg: "bg-emerald-50", border: "border-emerald-200/60",iconCl: "text-emerald-600", icon: CheckCircle2,  dot: "bg-emerald-500" },
  opportunity: { bg: "bg-amber-50",   border: "border-amber-200/60",  iconCl: "text-amber-600",   icon: Lightbulb,     dot: "bg-amber-500" },
  insight:     { bg: "bg-primary/8",  border: "border-primary/20",    iconCl: "text-primary",     icon: Activity,      dot: "bg-primary" },
  risk:        { bg: "bg-orange-50",  border: "border-orange-200/60", iconCl: "text-orange-600",  icon: Shield,        dot: "bg-orange-500" },
  action:      { bg: "bg-violet-50",  border: "border-violet-200/60", iconCl: "text-violet-600",  icon: Zap,           dot: "bg-violet-500" },
};

const MODULE_ICON: Record<string, React.ElementType> = {
  finance: Landmark, sales: ShoppingBag, work: Briefcase,
  resources: Package, organizations: Building2, people: Users,
};

// ─── Shared primitives ───────────────────────────────────

const EASE = [0.16, 1, 0.3, 1] as const;
const serif: React.CSSProperties = { fontFamily: "var(--app-font-serif)" };

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="h-1 w-full bg-muted/50 rounded-full overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.8, ease: EASE }}
      />
    </div>
  );
}

function TrendIcon({ trend }: { trend: "up" | "stable" | "down" }) {
  if (trend === "up") return <TrendingUp size={12} strokeWidth={2} className="text-emerald-500" />;
  if (trend === "down") return <TrendingDown size={12} strokeWidth={2} className="text-rose-500" />;
  return <Minus size={12} strokeWidth={2} className="text-muted-foreground/50" />;
}

function HealthRing({ score, size = 90 }: { score: number; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? "#10b981" : score >= 55 ? "hsl(var(--primary))" : score >= 35 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--border) / 0.25)" strokeWidth={5} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[18px] font-semibold text-foreground tabular-nums leading-none" style={{ ...serif, letterSpacing: "-0.03em" }}>
          {score}
        </span>
        <span className="text-[8px] text-muted-foreground/50 mt-0.5">/100</span>
      </div>
    </div>
  );
}

// ─── Detail Drawer ───────────────────────────────────────

interface DrawerItem {
  title: string;
  desc: string;
  type: string;
  module?: string;
  entityId?: string;
  meta?: Record<string, string>;
}

function DetailDrawer({ item, onClose, onFullView }: {
  item: DrawerItem | null;
  onClose: () => void;
  onFullView: () => void;
}) {
  return (
    <AnimatePresence>
      {item && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            className="fixed top-0 right-0 bottom-0 w-full max-w-[420px] bg-background border-l border-border/60 z-50 shadow-2xl overflow-y-auto"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <div className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border/40 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <Eye size={14} className="text-primary" />
                <span className="text-[12px] font-medium text-foreground">Detail View</span>
              </div>
              <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                <X size={15} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-5">
              {/* Type badge */}
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                item.type === "alert" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                item.type === "win" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                item.type === "risk" ? "bg-orange-50 text-orange-700 border border-orange-200" :
                item.type === "opportunity" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                item.type === "action" ? "bg-violet-50 text-violet-700 border border-violet-200" :
                "bg-primary/10 text-primary border border-primary/20"
              }`}>
                {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
              </span>

              <h3 className="text-[20px] font-medium leading-snug" style={{ ...serif, letterSpacing: "-0.02em" }}>
                {item.title}
              </h3>
              <p className="text-[13.5px] text-muted-foreground leading-relaxed">
                {item.desc}
              </p>

              {/* Meta fields */}
              {item.meta && Object.keys(item.meta).length > 0 && (
                <div className="border border-border/40 rounded-xl divide-y divide-border/25">
                  {Object.entries(item.meta).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between px-4 py-3">
                      <span className="text-[11px] text-muted-foreground">{k}</span>
                      <span className="text-[12px] font-medium text-foreground">{v}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={onFullView}
                  className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-[12.5px] font-medium flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
                >
                  <ArrowUpRight size={13} />
                  View full page
                </button>
                <button
                  onClick={onClose}
                  className="h-10 px-4 rounded-xl border border-border/60 text-[12.5px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Mini bar chart ──────────────────────────────────────

function MiniBarChart({ data, color = "bg-primary" }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[3px] h-[40px]">
      {data.map((v, i) => (
        <motion.div
          key={i}
          className={`flex-1 rounded-t-[2px] ${color}`}
          initial={{ height: 0 }}
          animate={{ height: `${(v / max) * 100}%` }}
          transition={{ duration: 0.5, ease: EASE, delay: i * 0.04 }}
          style={{ opacity: 0.4 + (i / data.length) * 0.6 }}
        />
      ))}
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────

export default function ExecutiveDashboard() {
  const { lang } = useLanguage();
  const { onboardingData } = useOnboarding();
  const { workspace } = useAuth();
  const [, navigate] = useLocation();
  const ar = lang === "ar";
  const { loading: dataLoading } = useDashboardData();
  const [drawer, setDrawer] = useState<DrawerItem | null>(null);

  const openDrawer = useCallback((item: DrawerItem) => setDrawer(item), []);
  const closeDrawer = useCallback(() => setDrawer(null), []);

  const briefing = useMemo(generateExecutiveBriefing, [dataLoading]);
  const feed = useMemo(generateIntelligenceFeed, [dataLoading]);
  const queue = useMemo(generateWorkQueue, [dataLoading]);
  const risks = useMemo(detectAllRisks, [dataLoading]);
  const health = useMemo(computeBusinessHealth, [dataLoading]);
  const deals = useMemo(loadDeals, [dataLoading]);
  const work = useMemo(loadWorkItems, [dataLoading]);
  const invoices = useMemo(loadInvoices, [dataLoading]);
  const expenses = useMemo(loadExpenses, [dataLoading]);
  const orgs = useMemo(loadOrganizations, [dataLoading]);
  const resources = useMemo(loadResources, [dataLoading]);

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <Eye size={20} className="text-primary animate-pulse" />
          <p className="text-[11px] text-muted-foreground">Loading Sky Eye…</p>
        </div>
      </div>
    );
  }

  const companyName = onboardingData?.companyName || workspace?.name || "THOTH";
  const industry = onboardingData?.industry || "";
  const fmt = (v: number) => formatCurrency(v, "SAR");

  // Computed metrics
  const pipeline = deals.filter((d) => !["won", "lost"].includes(d.stage)).reduce((s, d) => s + d.value * d.probability / 100, 0);
  const wonDeals = deals.filter((d) => d.stage === "won");
  const totalRevenue = wonDeals.reduce((s, d) => s + d.value, 0);
  const overdueInvoices = invoices.filter((i) => i.status === "overdue");
  const inFlightWork = work.filter((w) => w.status === "in_progress");
  const doneRate = work.length > 0 ? Math.round(work.filter((w) => w.status === "done").length / work.length * 100) : 0;
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const cashFlow = totalRevenue - totalExpenses;
  const activeRisks = risks.filter((r) => r.severityScore >= 70);

  // Revenue trend (last 6 months simulated)
  const revenueTrend = [120, 180, 150, 220, 280, 320];
  const orderTrend = [8, 12, 10, 15, 18, 22];

  // Top metrics
  const topMetrics = [
    { labelEn: "Pipeline", labelAr: "خط الأنابيب", value: fmt(pipeline), color: "text-amber-500", icon: ShoppingCart, trend: pipeline > 500000 ? "up" as const : "stable" as const },
    { labelEn: "Revenue", labelAr: "الإيرادات", value: fmt(totalRevenue), color: "text-emerald-600", icon: CircleDollarSign, trend: "up" as const },
    { labelEn: "In Progress", labelAr: "قيد التنفيذ", value: `${inFlightWork.length}`, color: "text-blue-500", icon: Factory, trend: "stable" as const },
    { labelEn: "Completion", labelAr: "الإنجاز", value: `${doneRate}%`, color: "text-emerald-600", icon: CheckCircle2, trend: doneRate >= 50 ? "up" as const : "down" as const },
    { labelEn: "Overdue Inv.", labelAr: "فواتير متأخرة", value: `${overdueInvoices.length}`, color: overdueInvoices.length > 0 ? "text-rose-500" : "text-emerald-600", icon: Clock, trend: overdueInvoices.length > 0 ? "down" as const : "up" as const },
    { labelEn: "Health", labelAr: "الصحة", value: `${health.score}`, color: "text-primary", icon: Activity, trend: health.score >= 65 ? "up" as const : "stable" as const },
  ];

  // Sub-metrics for detailed cards
  const cashFlowTrend: "up" | "down" | "stable" = cashFlow > 0 ? "up" : cashFlow < 0 ? "down" : "stable";
  const overdueAmount = overdueInvoices.reduce((s, i) => s + (i.amount || 0), 0);
  const customerCount = orgs.length;
  const resourceCount = resources.length;

  function handleFeedClick(item: FeedItem) {
    openDrawer({
      title: ar ? item.titleAr : item.titleEn,
      desc: ar ? item.descAr : item.descEn,
      type: item.type,
      module: item.module,
      entityId: item.entityId,
      meta: {
        "Module": item.module,
        "Time": ar ? item.timeAgoAr : item.timeAgoEn,
        "Type": item.type,
      },
    });
  }

  function handleQueueClick(q: typeof queue[0]) {
    openDrawer({
      title: ar ? q.titleAr : q.titleEn,
      desc: ar ? q.actionAr : q.actionEn,
      type: "action",
      module: q.module,
      entityId: q.entityId,
      meta: {
        "Priority": `${q.priorityScore}/100`,
        "Category": q.category,
        "Module": q.module,
      },
    });
  }

  function navigateToFull(item: DrawerItem) {
    closeDrawer();
    if (item.module === "finance") navigate("/finance");
    else if (item.module === "sales") navigate("/sales");
    else if (item.module === "work") navigate("/work");
    else if (item.module === "organizations") navigate("/organizations");
    else if (item.module === "resources") navigate("/inventory");
    else if (item.module === "people") navigate("/people");
    else navigate("/analytics");
  }

  // Greeting
  const hour = new Date().getHours();
  const greeting = ar
    ? (hour < 12 ? "صباح الخير" : hour < 17 ? "مساء الخير" : "مساء النور")
    : (hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening");

  return (
    <div className="min-h-full">
      {/* ── Hero ── */}
      <div className="border-b border-border/40 px-8 md:px-10 py-7"
        style={{ background: "linear-gradient(160deg, hsl(var(--muted)/0.35) 0%, hsl(var(--background)) 55%)" }}>
        <div className="max-w-[1200px]">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Eye size={13} strokeWidth={2} className="text-primary" />
                <p className="text-[10px] text-muted-foreground/60 tracking-[0.08em] uppercase">{ar ? "عين السماء" : "Sky Eye"}</p>
              </div>
              <p className="text-[12px] text-muted-foreground/60 mb-0.5">{greeting}</p>
              <h1 className="text-[26px] font-medium text-foreground leading-tight" style={{ ...serif, letterSpacing: "-0.025em" }}>
                {companyName}
              </h1>
              {industry && <p className="text-[12px] text-muted-foreground/60 mt-0.5">{industry}</p>}
            </div>
            <div className="shrink-0 hidden md:flex flex-col items-center">
              <HealthRing score={health.score} />
              <p className="text-[9px] text-muted-foreground/50 mt-1">{ar ? "الصحة" : "Health"}</p>
            </div>
          </div>

          {/* Metrics strip */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5">
            {topMetrics.map((m) => (
              <div key={m.labelEn} className="bg-background/70 border border-border/40 rounded-xl px-3.5 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wide">{ar ? m.labelAr : m.labelEn}</p>
                  <TrendIcon trend={m.trend} />
                </div>
                <p className={`text-[18px] font-semibold tabular-nums leading-none ${m.color}`} style={{ ...serif, letterSpacing: "-0.02em" }}>
                  {m.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-8 md:px-10 py-7 max-w-[1200px]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">

          {/* ── LEFT: 2-col span ── */}
          <div className="lg:col-span-2 space-y-7">

            {/* Executive Briefing */}
            <div className="border border-primary/20 rounded-xl bg-primary/5 px-5 py-4">
              <div className="flex items-center gap-2 mb-2">
                <Star size={13} strokeWidth={1.75} className="text-primary" />
                <p className="text-[10px] text-muted-foreground/60 tracking-wide uppercase">{ar ? "الإحاطة اليومية" : "Daily Briefing"}</p>
                <span className="text-[10px] text-muted-foreground/40">{briefing.dateEn}</span>
              </div>
              <p className="text-[12.5px] text-foreground/80 leading-relaxed">
                {ar ? briefing.summaryAr : briefing.summaryEn}
              </p>
              <div className="flex items-center gap-2 mt-2.5">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${briefing.overallScore >= 70 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : briefing.overallScore >= 50 ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
                  {ar ? briefing.overallLabelAr : briefing.overallLabelEn}
                </span>
                <span className="text-[10px] text-muted-foreground/50">{briefing.overallScore}/100</span>
              </div>
            </div>

            {/* Revenue & Cash Flow */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Revenue card */}
              <div className="border border-border/40 rounded-xl p-4 bg-background">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <CircleDollarSign size={13} className="text-emerald-600" />
                    </div>
                    <p className="text-[11px] font-medium text-foreground">{ar ? "الإيرادات" : "Revenue"}</p>
                  </div>
                  <TrendIcon trend="up" />
                </div>
                <p className="text-[22px] font-semibold tabular-nums" style={{ ...serif, letterSpacing: "-0.02em" }}>{fmt(totalRevenue)}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">{ar ? "من صفقات مبرمة" : "from closed deals"}</p>
                <div className="mt-3">
                  <MiniBarChart data={revenueTrend} color="bg-emerald-500" />
                  <div className="flex justify-between mt-1">
                    <span className="text-[8px] text-muted-foreground/40">6m ago</span>
                    <span className="text-[8px] text-muted-foreground/40">Now</span>
                  </div>
                </div>
              </div>

              {/* Cash flow card */}
              <div className="border border-border/40 rounded-xl p-4 bg-background">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                      <TrendingUp size={13} className="text-blue-600" />
                    </div>
                    <p className="text-[11px] font-medium text-foreground">{ar ? "التدفق النقدي" : "Cash Flow"}</p>
                  </div>
                  <TrendIcon trend={cashFlowTrend} />
                </div>
                <p className={`text-[22px] font-semibold tabular-nums ${cashFlow >= 0 ? "text-emerald-600" : "text-rose-500"}`} style={{ ...serif, letterSpacing: "-0.02em" }}>
                  {cashFlow >= 0 ? "+" : ""}{fmt(cashFlow)}
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">{ar ? "إيرادات ناقص مصروفات" : "revenue minus expenses"}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="bg-emerald-50/50 rounded-lg px-2.5 py-1.5">
                    <p className="text-[9px] text-emerald-700">{ar ? "وارد" : "In"}</p>
                    <p className="text-[12px] font-medium text-emerald-800 tabular-nums">{fmt(totalRevenue)}</p>
                  </div>
                  <div className="bg-rose-50/50 rounded-lg px-2.5 py-1.5">
                    <p className="text-[9px] text-rose-700">{ar ? "صادر" : "Out"}</p>
                    <p className="text-[12px] font-medium text-rose-800 tabular-nums">{fmt(totalExpenses)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Orders & Production */}
            <div className="border border-border/40 rounded-xl p-5 bg-background">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Factory size={14} className="text-blue-500" />
                  <h2 className="text-[13px] font-medium text-foreground">{ar ? "الطلبات والإنتاج" : "Orders & Production"}</h2>
                </div>
                <button className="text-[11px] text-primary hover:opacity-70 flex items-center gap-1" onClick={() => navigate("/orders")}>
                  {ar ? "الكل" : "View all"} <ArrowRight size={11} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { labelEn: "Active Orders", labelAr: "طلبات نشطة", value: deals.filter(d => !["won", "lost"].includes(d.stage)).length, color: "bg-amber-50 text-amber-700", icon: ShoppingCart },
                  { labelEn: "In Production", labelAr: "قيد الإنتاج", value: inFlightWork.length, color: "bg-blue-50 text-blue-700", icon: Factory },
                  { labelEn: "Completed", labelAr: "مكتمل", value: work.filter(w => w.status === "done").length, color: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
                ].map(s => (
                  <div key={s.labelEn} className={`${s.color} rounded-lg px-3 py-2.5 text-center`}>
                    <p className="text-[18px] font-semibold tabular-nums" style={serif}>{s.value}</p>
                    <p className="text-[9px] opacity-70">{ar ? s.labelAr : s.labelEn}</p>
                  </div>
                ))}
              </div>
              {/* Production stages */}
              <div className="flex items-center gap-1">
                {["Pattern", "Cutting", "Sewing", "Assembly", "Pressing", "QC", "Pack"].map((stage, i) => {
                  const pct = [85, 72, 60, 45, 30, 20, 10][i];
                  return (
                    <div key={stage} className="flex-1 text-center">
                      <div className="h-1.5 rounded-full bg-muted/30 mb-1 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, ease: EASE, delay: i * 0.06 }}
                        />
                      </div>
                      <span className="text-[7px] text-muted-foreground/50">{stage}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Intelligence Feed */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Radio size={13} strokeWidth={1.75} className="text-primary" />
                  <h2 className="text-[14px] font-medium text-foreground" style={{ ...serif, letterSpacing: "-0.01em" }}>
                    {ar ? "البث الذكي" : "Intelligence Feed"}
                  </h2>
                </div>
                <button className="text-[11px] text-primary hover:opacity-70 flex items-center gap-1" onClick={() => navigate("/intelligence")}>
                  {ar ? "الكل" : "View all"} <ArrowRight size={11} />
                </button>
              </div>
              <div className="space-y-2">
                {feed.slice(0, 6).map((item) => {
                  const s = FEED_STYLE[item.type];
                  const Icon = s.icon;
                  return (
                    <div key={item.id}
                      className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${s.border} hover:shadow-sm transition-shadow cursor-pointer group`}
                      onClick={() => handleFeedClick(item)}>
                      <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                        <Icon size={13} strokeWidth={1.75} className={s.iconCl} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-medium text-foreground group-hover:text-primary transition-colors truncate">
                          {ar ? item.titleAr : item.titleEn}
                        </p>
                        <p className="text-[11px] text-muted-foreground/70 truncate">{ar ? item.descAr : item.descEn}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-muted-foreground/40">{ar ? item.timeAgoAr : item.timeAgoEn}</span>
                        <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Priorities */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Flame size={13} strokeWidth={1.75} className="text-orange-500" />
                  <h2 className="text-[14px] font-medium text-foreground" style={{ ...serif, letterSpacing: "-0.01em" }}>
                    {ar ? "أولويات اليوم" : "Today's Priorities"}
                  </h2>
                </div>
                <button className="text-[11px] text-primary hover:opacity-70 flex items-center gap-1" onClick={() => navigate("/queue")}>
                  {ar ? "الكل" : "View all"} <ArrowRight size={11} />
                </button>
              </div>
              <div className="border border-border/40 rounded-xl overflow-hidden divide-y divide-border/25">
                {queue.slice(0, 5).map((item, i) => {
                  const ModIcon = MODULE_ICON[item.module] || Briefcase;
                  const catColor: Record<string, string> = {
                    revenue: "text-amber-600 bg-amber-50",
                    operations: "text-blue-600 bg-blue-50",
                    relationships: "text-violet-600 bg-violet-50",
                    risk: "text-rose-600 bg-rose-50",
                  };
                  return (
                    <div key={item.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/10 cursor-pointer group transition-colors"
                      onClick={() => handleQueueClick(item)}>
                      <span className="text-[10px] text-muted-foreground/30 tabular-nums w-4 shrink-0">{i + 1}</span>
                      <div className={`w-7 h-7 rounded-lg ${catColor[item.category]?.split(" ")[1] || "bg-muted"} flex items-center justify-center shrink-0`}>
                        <ModIcon size={13} strokeWidth={1.75} className={catColor[item.category]?.split(" ")[0] || "text-muted-foreground"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-medium text-foreground group-hover:text-primary transition-colors truncate">{ar ? item.titleAr : item.titleEn}</p>
                        <p className="text-[10px] text-muted-foreground/60 truncate">{ar ? item.actionAr : item.actionEn}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-14">
                          <ScoreBar score={item.priorityScore} color={item.priorityScore >= 80 ? "bg-rose-500" : item.priorityScore >= 60 ? "bg-amber-500" : "bg-blue-500"} />
                        </div>
                        <span className="text-[11px] font-semibold tabular-nums text-foreground w-5 text-right">{item.priorityScore}</span>
                        <ChevronRight size={12} strokeWidth={1.75} className="text-muted-foreground/20 group-hover:text-primary/50 transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── RIGHT: sidebar ── */}
          <div className="space-y-5">

            {/* Health Indicators */}
            <div className="border border-border/40 rounded-xl p-4 bg-background">
              <p className="text-[11px] font-medium text-foreground mb-3">{ar ? "مؤشرات الصحة" : "Health Indicators"}</p>
              {[
                { labelEn: "Sales",   labelAr: "المبيعات", score: health.salesScore,    color: "bg-amber-500" },
                { labelEn: "Work",    labelAr: "العمل",    score: health.workScore,     color: "bg-blue-500" },
                { labelEn: "Finance", labelAr: "المالية",  score: health.financeScore,  color: "bg-emerald-500" },
                { labelEn: "Assets",  labelAr: "الأصول",   score: health.resourceScore, color: "bg-violet-500" },
              ].map((s) => (
                <div key={s.labelEn} className="mb-2.5 last:mb-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] text-muted-foreground">{ar ? s.labelAr : s.labelEn}</p>
                    <p className="text-[11px] font-medium tabular-nums text-foreground">{s.score}</p>
                  </div>
                  <ScoreBar score={s.score} color={s.score >= 70 ? "bg-emerald-500" : s.score >= 50 ? s.color : "bg-rose-500"} />
                </div>
              ))}
            </div>

            {/* Overdue Alerts */}
            {overdueInvoices.length > 0 && (
              <div className="border border-rose-200/60 bg-rose-50/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={13} className="text-rose-500" />
                  <p className="text-[11px] font-medium text-foreground">{ar ? "فواتير متأخرة" : "Overdue Invoices"}</p>
                </div>
                <div className="space-y-2">
                  {overdueInvoices.slice(0, 3).map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2 cursor-pointer hover:bg-white transition-colors"
                      onClick={() => openDrawer({
                        title: `Invoice ${inv.number}`,
                        desc: `Overdue payment of ${fmt(inv.amount || 0)}`,
                        type: "alert",
                        module: "finance",
                        entityId: inv.id,
                        meta: { "Amount": fmt(inv.amount || 0), "Status": "Overdue", "Client": inv.orgNameEn },
                      })}>
                      <span className="text-[11px] text-foreground truncate">{inv.orgNameEn || "Client"}</span>
                      <span className="text-[11px] font-semibold text-rose-600 tabular-nums">{fmt(inv.amount || 0)}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-rose-600/70 mt-2">{overdueInvoices.length} total · {fmt(overdueAmount)} outstanding</p>
              </div>
            )}

            {/* Inventory Alerts */}
            <div className="border border-border/40 rounded-xl p-4 bg-background">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Warehouse size={13} className="text-amber-500" />
                  <p className="text-[11px] font-medium text-foreground">{ar ? "تنبيهات المخزن" : "Inventory Alerts"}</p>
                </div>
                <button className="text-[10px] text-primary hover:opacity-70" onClick={() => navigate("/inventory")}>
                  {ar ? "الكل" : "All"}
                </button>
              </div>
              <div className="space-y-2">
                {[
                  { name: "Silk Chiffon", stock: 12, min: 20, unit: "meters" },
                  { name: "Cotton Twill", stock: 8, min: 15, unit: "meters" },
                  { name: "YKK Zippers", stock: 45, min: 100, unit: "pcs" },
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-[11px]">
                    <span className="text-foreground truncate">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-rose-500 font-medium tabular-nums">{item.stock} {item.unit}</span>
                      <span className="text-muted-foreground/40">/ {item.min}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Risks */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield size={13} strokeWidth={1.75} className="text-rose-500" />
                  <h3 className="text-[13px] font-medium text-foreground">{ar ? "أبرز المخاطر" : "Top Risks"}</h3>
                </div>
                <button className="text-[11px] text-primary hover:opacity-70 flex items-center gap-1" onClick={() => navigate("/risk")}>
                  {ar ? "الكل" : "All"} <ArrowRight size={11} />
                </button>
              </div>
              <div className="space-y-2">
                {risks.slice(0, 3).map((r) => (
                  <div key={r.id} className="border border-rose-200/40 bg-rose-50/20 rounded-xl px-4 py-3 cursor-pointer hover:bg-rose-50/40 transition-colors"
                    onClick={() => openDrawer({
                      title: ar ? r.titleAr : r.titleEn,
                      desc: ar ? r.mitigationAr : r.mitigationEn,
                      type: "risk",
                      meta: { "Severity": `${r.severityScore}/100`, "Type": r.type },
                    })}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-[12px] font-medium text-foreground leading-snug">{ar ? r.titleAr : r.titleEn}</p>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${r.severityScore >= 80 ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>
                        {r.severityScore}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/70 leading-relaxed">{ar ? r.mitigationAr : r.mitigationEn}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Opportunities */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={13} strokeWidth={1.75} className="text-amber-500" />
                <h3 className="text-[13px] font-medium text-foreground">{ar ? "الفرص" : "Opportunities"}</h3>
              </div>
              <div className="space-y-2">
                {briefing.opportunities.slice(0, 3).map((opp, i) => (
                  <div key={i} className="border border-amber-200/40 bg-amber-50/20 rounded-xl px-4 py-3 cursor-pointer hover:bg-amber-50/40 transition-colors"
                    onClick={() => openDrawer({
                      title: "Opportunity",
                      desc: ar ? opp.ar : opp.en,
                      type: "opportunity",
                    })}>
                    <p className="text-[11px] text-foreground/80 leading-relaxed">{ar ? opp.ar : opp.en}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Nav */}
            <div className="border border-border/40 rounded-xl p-4 bg-background">
              <p className="text-[11px] font-medium text-foreground mb-3">{ar ? "التنقل السريع" : "Quick Navigation"}</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { labelEn: "Work Queue", labelAr: "قائمة المهام", path: "/queue", icon: Target, color: "text-orange-500 bg-orange-50" },
                  { labelEn: "Risk Radar", labelAr: "رادار المخاطر", path: "/risk", icon: Shield, color: "text-rose-500 bg-rose-50" },
                  { labelEn: "Forecast", labelAr: "التوقعات", path: "/forecast", icon: TrendingUp, color: "text-blue-500 bg-blue-50" },
                  { labelEn: "Analytics", labelAr: "التحليلات", path: "/analytics", icon: BarChart3, color: "text-violet-500 bg-violet-50" },
                  { labelEn: "Finance", labelAr: "المالية", path: "/finance", icon: Landmark, color: "text-emerald-500 bg-emerald-50" },
                  { labelEn: "Inventory", labelAr: "المخزن", path: "/inventory", icon: Package, color: "text-amber-500 bg-amber-50" },
                ].map((t) => {
                  const Icon = t.icon;
                  const [iconCl, bgCl] = t.color.split(" ");
                  return (
                    <button key={t.path}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border/40 hover:bg-muted/20 transition-colors text-left group"
                      onClick={() => navigate(t.path)}>
                      <div className={`w-6 h-6 rounded-md ${bgCl} flex items-center justify-center shrink-0`}>
                        <Icon size={12} strokeWidth={1.75} className={iconCl} />
                      </div>
                      <span className="text-[11px] font-medium text-foreground group-hover:text-primary transition-colors truncate">
                        {ar ? t.labelAr : t.labelEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Today's Schedule */}
            <div className="border border-border/40 rounded-xl p-4 bg-background">
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays size={13} className="text-primary" />
                <p className="text-[11px] font-medium text-foreground">{ar ? "جدول اليوم" : "Today's Schedule"}</p>
              </div>
              <div className="space-y-2">
                {[
                  { time: "09:00", title: "Production review", type: "meeting" },
                  { time: "11:30", title: "Client delivery — SO-1148", type: "delivery" },
                  { time: "14:00", title: "New quotation deadline", type: "deadline" },
                ].map((evt, i) => (
                  <div key={i} className="flex items-center gap-3 text-[11px]">
                    <span className="text-muted-foreground/50 tabular-nums w-10 shrink-0">{evt.time}</span>
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${evt.type === "meeting" ? "bg-blue-400" : evt.type === "delivery" ? "bg-emerald-400" : "bg-amber-400"}`} />
                    <span className="text-foreground truncate">{evt.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Detail Drawer ── */}
      <DetailDrawer item={drawer} onClose={closeDrawer} onFullView={() => navigateToFull(drawer!)} />
    </div>
  );
}
