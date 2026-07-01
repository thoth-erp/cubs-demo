import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "wouter";
import {
  CRM_CUSTOMERS, CRM_TASKS, CRM_ALERTS, CRM_ACTIVITY_FEED, CRM_LEADS,
  type CRMCustomer, type CRMTask, type CRMAlert,
} from "../lib/crm-data";
import { Skeleton } from "../components/ui/skeleton";
import {
  Users, TrendingUp, AlertTriangle, Clock, Phone, Mail, MessageSquare,
  Star, ShoppingBag, CreditCard, ArrowUpRight, ArrowDownRight,
  CheckCircle2, Circle, Calendar, DollarSign, Zap, Eye, ChevronRight,
  Package, Truck, Target, Shield, Gift, Send, Plus, Sparkles, UserPlus,
  BarChart3, Activity, Bell, Heart, FileText, ShoppingCart,
  Filter, Search, X, Check, ArrowRight, Repeat, MapPin,
} from "lucide-react";

function formatEGP(n: number) {
  return new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", minimumFractionDigits: 0 }).format(n);
}

const cardV: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.3, ease: [0.22, 1, 0.36, 1] } }),
};

// ─── Mini Chart Component ──────────────────────────────────
function MiniBarChart({ data, color, height = 60 }: { data: number[]; color: string; height?: number }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((v, i) => (
        <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${(v / max) * 100}%` }}
          transition={{ delay: i * 0.05, duration: 0.4 }}
          className="flex-1 rounded-t-sm" style={{ backgroundColor: color, minHeight: v > 0 ? 3 : 1 }} />
      ))}
    </div>
  );
}

// ─── Donut Chart Component ─────────────────────────────────
function DonutChart({ segments, size = 100 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={10} opacity={0.3} />
        {segments.filter(s => s.value > 0).map((seg, i) => {
          const frac = seg.value / total;
          const dash = frac * circ;
          const offset = -acc * circ;
          acc += frac;
          return <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={seg.color} strokeWidth={10} strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={offset} strokeLinecap="round" />;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[14px] font-bold" style={{ fontFamily: "var(--app-font-serif)" }}>{total}</span>
      </div>
    </div>
  );
}

// ─── Funnel Component ──────────────────────────────────────
function FunnelChart({ stages, ar }: { stages: { label: string; labelAr: string; value: number; color: string }[]; ar: boolean }) {
  const max = Math.max(...stages.map(s => s.value), 1);
  return (
    <div className="space-y-1.5">
      {stages.map((stage, i) => {
        const pct = (stage.value / max) * 100;
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground w-20 text-right shrink-0">{ar ? stage.labelAr : stage.label}</span>
            <div className="flex-1 h-6 rounded-lg bg-muted/30 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="h-full rounded-lg flex items-center justify-end px-2" style={{ backgroundColor: stage.color }}>
                <span className="text-[9px] font-medium text-white">{stage.value}</span>
              </motion.div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function CRM() {
  const { lang } = useLanguage();
  const { workspace } = useAuth();
  const ar = lang === "ar";
  const [, navigate] = useLocation();
  const [activeQuickAction, setActiveQuickAction] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  // Demo data is instant — no artificial loading delay.
  const [loading] = useState(false);

  // ─── Computed Data ───────────────────────────────────────
  const stats = useMemo(() => {
    const active = CRM_CUSTOMERS.filter(c => c.status === "active").length;
    const vip = CRM_CUSTOMERS.filter(c => c.vip_level !== "none").length;
    const totalRevenue = CRM_CUSTOMERS.reduce((s, c) => s + c.total_spend, 0);
    const openLeads = CRM_LEADS.filter(l => l.stage !== "won" && l.stage !== "lost").length;
    const pendingTasks = CRM_TASKS.filter(t => (t.status === "pending" || t.status === "overdue") && !completedTasks.has(t.id)).length;
    const overdueInvoices = CRM_CUSTOMERS.reduce((s, c) => s + c.open_invoices, 0);
    const criticalAlerts = CRM_ALERTS.filter(a => a.severity === "critical" && !a.dismissed).length;
    const wonLeads = CRM_LEADS.filter(l => l.stage === "won");
    const lostLeads = CRM_LEADS.filter(l => l.stage === "lost");
    const conversionRate = wonLeads.length + lostLeads.length > 0 ? Math.round((wonLeads.length / (wonLeads.length + lostLeads.length)) * 100) : 0;
    const avgDealSize = openLeads > 0 ? CRM_LEADS.filter(l => l.stage !== "won" && l.stage !== "lost").reduce((s, l) => s + l.value, 0) / openLeads : 0;
    return { active, vip, totalRevenue, openLeads, pendingTasks, overdueInvoices, criticalAlerts, wonLeads, conversionRate, avgDealSize };
  }, [completedTasks]);

  // Revenue trend (mock monthly data)
  const revenueTrend = [180000, 220000, 195000, 280000, 310000, 275000, 350000, 320000, 380000, 290000, 420000, 385000];
  const months = ar ? ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"] : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Customer segments
  const segments = useMemo(() => [
    { label: "Platinum", labelAr: "بلاتيني", value: CRM_CUSTOMERS.filter(c => c.vip_level === "platinum").length, color: "#8B5CF6" },
    { label: "Gold", labelAr: "ذهبي", value: CRM_CUSTOMERS.filter(c => c.vip_level === "gold").length, color: "#F59E0B" },
    { label: "Silver", labelAr: "فضي", value: CRM_CUSTOMERS.filter(c => c.vip_level === "silver").length, color: "#94A3B8" },
    { label: "Regular", labelAr: "عادي", value: CRM_CUSTOMERS.filter(c => c.vip_level === "none").length, color: "#CBD5E1" },
  ], []);

  // Pipeline funnel
  const funnelStages = useMemo(() => [
    { label: "New", labelAr: "جديد", value: CRM_LEADS.filter(l => l.stage === "new").length, color: "#3B82F6" },
    { label: "Qualified", labelAr: "مؤهل", value: CRM_LEADS.filter(l => l.stage === "qualified").length, color: "#8B5CF6" },
    { label: "Meeting", labelAr: "اجتماع", value: CRM_LEADS.filter(l => l.stage === "meeting").length, color: "#F59E0B" },
    { label: "Quotation", labelAr: "عرض سعر", value: CRM_LEADS.filter(l => l.stage === "quotation").length, color: "#06B6D4" },
    { label: "Negotiation", labelAr: "تفاوض", value: CRM_LEADS.filter(l => l.stage === "negotiation").length, color: "#F97316" },
    { label: "Won", labelAr: "مكتسب", value: CRM_LEADS.filter(l => l.stage === "won").length, color: "#10B981" },
  ], []);

  // Top customers by spend
  const topCustomers = useMemo(() =>
    [...CRM_CUSTOMERS].sort((a, b) => b.total_spend - a.total_spend).slice(0, 5), []);

  const todayTasks = CRM_TASKS.filter(t => t.due_date <= new Date().toISOString().slice(0, 10) && t.status !== "completed" && !completedTasks.has(t.id));

  function completeTask(taskId: string) {
    setCompletedTasks(prev => new Set([...prev, taskId]));
  }

  // Loading skeleton — placed AFTER all hooks so hook order stays stable
  // across renders (otherwise React throws minified error #310).
  if (loading) {
    return (
      <div className="min-h-full px-6 md:px-8 py-6 max-w-[1400px] mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-48 rounded-xl md:col-span-2" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full px-6 md:px-8 py-6 max-w-[1400px] mx-auto space-y-5">
      {/* Greeting */}
      <motion.div variants={cardV} custom={0} initial="hidden" animate="visible" className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>
            {ar ? "مرحباً بك في CRM" : "Welcome to CRM"}
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            {ar ? "ماذا يحتاج انتباهك الآن؟" : "What needs your attention right now?"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/crm/customers")}
            className="h-9 px-4 rounded-xl border border-border/60 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex items-center gap-1.5">
            <Users size={12} /> {ar ? "العملاء" : "Customers"}
          </button>
          <button onClick={() => navigate("/crm/pipeline")}
            className="h-9 px-4 rounded-xl border border-border/60 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex items-center gap-1.5">
            <Target size={12} /> {ar ? "الصفقات" : "Pipeline"}
          </button>
          <button onClick={() => navigate("/crm/customers/new")}
            className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-[11px] font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5">
            <Plus size={12} /> {ar ? "عميل جديد" : "New Customer"}
          </button>
          <button onClick={() => navigate("/crm/pipeline?new=true")}
            className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-[11px] font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5">
            <Target size={12} /> {ar ? "صفقة جديدة" : "New Deal"}
          </button>
          <button onClick={() => navigate("/crm/customers/new?contact=true")}
            className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-[11px] font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5">
            <UserPlus size={12} /> {ar ? "جهة اتصال" : "New Contact"}
          </button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: ar ? "إجمالي الإيرادات" : "Total Revenue", value: formatEGP(stats.totalRevenue), icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50/80", change: "+18%", up: true },
          { label: ar ? "العملاء النشطون" : "Active Customers", value: stats.active, icon: Users, color: "text-primary", bg: "bg-primary/5", change: "+3", up: true },
          { label: ar ? "صفقات مفتوحة" : "Open Deals", value: stats.openLeads, icon: Target, color: "text-violet-600", bg: "bg-violet-50/80", change: formatEGP(stats.avgDealSize), up: true },
          { label: ar ? "معدل التحويل" : "Conversion", value: `${stats.conversionRate}%`, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50/80", change: "+5%", up: true },
        ].map((kpi, i) => (
          <motion.div key={i} variants={cardV} custom={i + 1} initial="hidden" animate="visible"
            className={`${kpi.bg} rounded-xl p-4 border border-border/30`}>
            <div className="flex items-center justify-between mb-2">
              <kpi.icon size={15} className={kpi.color} />
              <span className={`text-[9px] font-medium flex items-center gap-0.5 ${kpi.up ? "text-emerald-600" : "text-rose-500"}`}>
                {kpi.up ? <ArrowUpRight size={9} /> : <ArrowDownRight size={9} />}
                {kpi.change}
              </span>
            </div>
            <p className="text-[20px] font-bold text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>{kpi.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Alerts */}
      {stats.criticalAlerts > 0 && (
        <motion.div variants={cardV} custom={5} initial="hidden" animate="visible">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-[13px] font-semibold flex items-center gap-2">
              <AlertTriangle size={14} className="text-rose-500" />
              {ar ? "تنبيهات حرجة" : "Critical Alerts"}
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600 font-medium">{stats.criticalAlerts}</span>
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {CRM_ALERTS.filter(a => !a.dismissed && a.severity === "critical").slice(0, 3).map(alert => (
              <div key={alert.id} className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                    <AlertTriangle size={12} className="text-rose-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-foreground">{ar ? alert.title_ar : alert.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{ar ? alert.description_ar : alert.description}</p>
                    <p className="text-[9px] text-primary mt-1.5 font-medium flex items-center gap-1">
                      <Zap size={8} /> {ar ? alert.suggested_action_ar : alert.suggested_action}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Revenue Trend */}
        <motion.div variants={cardV} custom={6} initial="hidden" animate="visible" className="md:col-span-2 p-5 rounded-xl border border-border/40 bg-background">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold flex items-center gap-2">
              <BarChart3 size={14} className="text-primary" />
              {ar ? "اتجاه الإيرادات" : "Revenue Trend"}
            </h3>
            <span className="text-[10px] text-muted-foreground">{ar ? "آخر ١٢ شهر" : "Last 12 months"}</span>
          </div>
          <MiniBarChart data={revenueTrend} color="hsl(var(--primary))" height={80} />
          <div className="flex justify-between mt-2">
            {months.filter((_, i) => i % 2 === 0).map(m => (
              <span key={m} className="text-[8px] text-muted-foreground/60">{m}</span>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/30">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-[10px] text-muted-foreground">{ar ? "إجمالي" : "Total"}</span>
            </div>
            <div className="text-[11px] font-medium text-foreground">{formatEGP(revenueTrend.reduce((s, v) => s + v, 0))}</div>
            <div className="text-[10px] text-emerald-600 flex items-center gap-0.5"><ArrowUpRight size={9} /> +12%</div>
          </div>
        </motion.div>

        {/* Customer Segments */}
        <motion.div variants={cardV} custom={7} initial="hidden" animate="visible" className="p-5 rounded-xl border border-border/40 bg-background">
          <h3 className="text-[13px] font-semibold flex items-center gap-2 mb-4">
            <Star size={14} className="text-amber-500" />
            {ar ? "شرائح العملاء" : "Customer Segments"}
          </h3>
          <div className="flex justify-center mb-4">
            <DonutChart segments={segments} size={110} />
          </div>
          <div className="space-y-2">
            {segments.map((seg, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                  <span className="text-[11px] text-foreground">{ar ? seg.labelAr : seg.label}</span>
                </div>
                <span className="text-[11px] font-medium">{seg.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Pipeline Funnel + Top Customers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Conversion Funnel */}
        <motion.div variants={cardV} custom={8} initial="hidden" animate="visible" className="p-5 rounded-xl border border-border/40 bg-background">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold flex items-center gap-2">
              <Target size={14} className="text-violet-500" />
              {ar ? "قمع التحويل" : "Conversion Funnel"}
            </h3>
            <button onClick={() => navigate("/crm/pipeline")} className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
              {ar ? "عرض" : "View"} <ChevronRight size={10} />
            </button>
          </div>
          <FunnelChart stages={funnelStages} ar={ar} />
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
            <span className="text-[10px] text-muted-foreground">{ar ? "معدل التحويل" : "Conversion Rate"}</span>
            <span className="text-[14px] font-bold text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>{stats.conversionRate}%</span>
          </div>
        </motion.div>

        {/* Top Customers */}
        <motion.div variants={cardV} custom={9} initial="hidden" animate="visible" className="p-5 rounded-xl border border-border/40 bg-background">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold flex items-center gap-2">
              <TrendingUp size={14} className="text-emerald-500" />
              {ar ? "أكبر العملاء" : "Top Customers"}
            </h3>
            <button onClick={() => navigate("/crm/customers")} className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
              {ar ? "الكل" : "All"} <ChevronRight size={10} />
            </button>
          </div>
          <div className="space-y-2.5">
            {topCustomers.map((c, i) => (
              <div key={c.id} onClick={() => navigate(`/crm/customers/${c.id}`)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
                <span className="text-[10px] text-muted-foreground w-4 text-center font-medium">{i + 1}</span>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: c.avatar_color }}>
                  {c.name.split(" ").map(w => w[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground truncate">{c.name}</p>
                  <p className="text-[9px] text-muted-foreground">{c.total_orders} {ar ? "طلب" : "orders"}</p>
                </div>
                <span className="text-[11px] font-semibold text-foreground">{formatEGP(c.total_spend)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Tasks + Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Today's Tasks */}
        <motion.div variants={cardV} custom={10} initial="hidden" animate="visible" className="p-5 rounded-xl border border-border/40 bg-background">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold flex items-center gap-2">
              <Calendar size={14} className="text-blue-500" />
              {ar ? "مهام اليوم" : "Today's Tasks"}
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 font-medium">{todayTasks.length}</span>
            </h3>
          </div>
          <div className="space-y-1.5">
            <AnimatePresence>
              {todayTasks.map(task => {
                const isOverdue = task.status === "overdue";
                const isCompleted = completedTasks.has(task.id);
                return (
                  <motion.div key={task.id} layout
                    exit={{ opacity: 0, height: 0, marginTop: 0, padding: 0 }}
                    className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${isOverdue ? "bg-rose-50/50" : "hover:bg-muted/30"} ${isCompleted ? "opacity-50" : ""}`}>
                    <button onClick={() => completeTask(task.id)}
                      className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${isCompleted ? "border-emerald-500 bg-emerald-500" : "border-border/60 hover:border-primary"}`}>
                      {isCompleted && <Check size={10} className="text-white" strokeWidth={3} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[11px] font-medium ${isCompleted ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {ar ? task.title_ar : task.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] text-muted-foreground">{task.customer_name}</span>
                        <span className={`w-1.5 h-1.5 rounded-full ${task.priority === "urgent" ? "bg-rose-500" : task.priority === "high" ? "bg-amber-500" : "bg-blue-500"}`} />
                        {isOverdue && <span className="text-[8px] text-rose-500 font-medium">{ar ? "متأخر" : "Overdue"}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); }} className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground/40 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"><Phone size={10} /></button>
                      <button onClick={(e) => { e.stopPropagation(); }} className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground/40 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"><MessageSquare size={10} /></button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={cardV} custom={11} initial="hidden" animate="visible" className="p-5 rounded-xl border border-border/40 bg-background">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold flex items-center gap-2">
              <Activity size={14} className="text-cyan-500" />
              {ar ? "آخر النشاطات" : "Recent Activity"}
            </h3>
          </div>
          <div className="space-y-0">
            {CRM_ACTIVITY_FEED.slice(0, 8).map((item, i) => (
              <div key={item.id} className="flex gap-3 py-2 relative">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground">
                    {item.type === "deal" ? <Target size={10} /> : item.type === "order" ? <ShoppingBag size={10} /> : item.type === "quotation" ? <FileText size={10} /> : item.type === "invoice" ? <CreditCard size={10} /> : item.type === "loyalty" ? <Gift size={10} /> : item.type === "delivery" ? <Truck size={10} /> : item.type === "shopify" ? <ShoppingCart size={10} /> : <Activity size={10} />}
                  </div>
                  {i < CRM_ACTIVITY_FEED.slice(0, 8).length - 1 && <div className="w-px flex-1 bg-border/30 my-0.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px]">
                    <span className="font-medium">{item.user}</span>{" "}
                    <span className="text-muted-foreground">{ar ? item.action_ar : item.action}</span>{" "}
                    <span className="font-medium text-primary cursor-pointer hover:underline" onClick={() => navigate(`/crm/customers/${item.customer_id}`)}>{item.customer_name}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[8px] text-muted-foreground">{item.timestamp}</span>
                    {item.amount && <span className="text-[8px] font-medium text-foreground">{formatEGP(item.amount)}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Stats Footer */}
      <motion.div variants={cardV} custom={12} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: ar ? "عملاء VIP" : "VIP Customers", value: stats.vip, icon: Star, color: "text-amber-600" },
          { label: ar ? "فواتير متأخرة" : "Overdue Invoices", value: stats.overdueInvoices, icon: AlertTriangle, color: "text-rose-600" },
          { label: ar ? "صفقات مكتسبة" : "Won Deals", value: stats.wonLeads.length, icon: CheckCircle2, color: "text-emerald-600" },
          { label: ar ? "مهام معلقة" : "Pending Tasks", value: stats.pendingTasks, icon: Clock, color: "text-blue-600" },
          { label: ar ? "تنبيهات" : "Alerts", value: stats.criticalAlerts, icon: Bell, color: "text-rose-600" },
        ].map((item, i) => (
          <div key={i} className="p-3 rounded-xl border border-border/40 bg-background text-center">
            <item.icon size={14} className={`${item.color} mx-auto mb-1.5`} />
            <p className="text-[16px] font-bold text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>{item.value}</p>
            <p className="text-[9px] text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
