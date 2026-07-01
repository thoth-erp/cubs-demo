/**
 * Production Module — Full Dashboard
 * Dashboard • List View • Kanban • Order Detail • Reports • Alerts • AI
 */

import { useState, useMemo } from "react";
import { useLanguage } from "../context/LanguageContext";
import {
  getProductionOrders, getProductionOrder, getProductionStats, getProductionAlerts,
  getAIInsights, getWorkstations, dismissAlert,
  DEFAULT_STAGES,
  type ProductionOrder, type ProductionStage, type AIInsight, type ProductionAlert, type WorkstationInfo,
} from "../lib/production-data";
import {
  Plus, Search, X, Factory, AlertTriangle, CheckCircle2, Clock, Package,
  ChevronRight, Calendar, TrendingUp, Users, BarChart3, Filter,
  Download, Eye, Layers, ArrowRight, Timer, AlertCircle, Sparkles,
  LayoutGrid, List, Target, Zap, Truck, ClipboardCheck, Wrench,
  Play, Pause, Ban, RefreshCw, Bell, ShieldCheck, DollarSign,
  FileText, Brain, Lightbulb, TrendingDown, Activity, Box,
  CircleDot, Settings, GripVertical, Maximize2, Minimize2,
  ChevronDown, ChevronUp, MoreHorizontal,
} from "lucide-react";

// ─── i18n helper ──────────────────────────────────────────

function t(ar: boolean, en: string, arText: string) { return ar ? arText : en; }

// ─── Constants ────────────────────────────────────────────

type ViewMode = "dashboard" | "list" | "kanban" | "detail" | "reports" | "alerts" | "ai";

const STAGE_COLORS: Record<string, string> = {
  order_created: "bg-zinc-100 text-zinc-600",
  materials_reserved: "bg-amber-50 text-amber-600",
  cutting: "bg-blue-50 text-blue-600",
  edgebanding: "bg-indigo-50 text-indigo-600",
  drilling: "bg-violet-50 text-violet-600",
  assembly: "bg-cyan-50 text-cyan-600",
  finishing: "bg-purple-50 text-purple-600",
  quality_control: "bg-orange-50 text-orange-600",
  packaging: "bg-teal-50 text-teal-600",
  ready_dispatch: "bg-emerald-50 text-emerald-600",
  completed: "bg-emerald-100 text-emerald-700",
};

const STAGE_DOT: Record<string, string> = {
  order_created: "bg-zinc-400",
  materials_reserved: "bg-amber-400",
  cutting: "bg-blue-500",
  edgebanding: "bg-indigo-500",
  drilling: "bg-violet-500",
  assembly: "bg-cyan-500",
  finishing: "bg-purple-500",
  quality_control: "bg-orange-500",
  packaging: "bg-teal-500",
  ready_dispatch: "bg-emerald-500",
  completed: "bg-emerald-600",
};

const STATUS_COLORS: Record<string, string> = {
  planned: "bg-zinc-100 text-zinc-600",
  in_progress: "bg-blue-100 text-blue-700",
  delayed: "bg-rose-100 text-rose-700",
  on_hold: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-zinc-100 text-zinc-500",
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-rose-100 text-rose-700",
  urgent: "bg-orange-100 text-orange-700",
  high: "bg-amber-100 text-amber-700",
  medium: "bg-blue-100 text-blue-700",
  low: "bg-zinc-100 text-zinc-600",
};

const ALERT_SEVERITY: Record<string, string> = {
  info: "bg-blue-50 text-blue-700 border-blue-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  critical: "bg-rose-50 text-rose-700 border-rose-200",
};

const AI_SEVERITY: Record<string, string> = {
  info: "border-l-blue-400",
  warning: "border-l-amber-400",
  critical: "border-l-rose-400",
};

const AI_TYPE_ICON: Record<string, typeof Brain> = {
  summary: BarChart3,
  bottleneck: AlertTriangle,
  prediction: TrendingUp,
  recommendation: Lightbulb,
  risk: ShieldCheck,
};

const VIEW_TABS: { id: ViewMode; icon: typeof Factory; en: string; ar: string }[] = [
  { id: "dashboard", icon: LayoutGrid, en: "Dashboard", ar: "لوحة التحكم" },
  { id: "list", icon: List, en: "List", ar: "القائمة" },
  { id: "kanban", icon: GripVertical, en: "Kanban", ar: "كانبان" },
  { id: "alerts", icon: Bell, en: "Alerts", ar: "التنبيهات" },
  { id: "ai", icon: Brain, en: "AI Insights", ar: "رؤى الذكاء" },
  { id: "reports", icon: BarChart3, en: "Reports", ar: "التقارير" },
];

const LIST_FILTERS = [
  { id: "all", en: "All", ar: "الكل" },
  { id: "in_progress", en: "In Progress", ar: "جاري" },
  { id: "delayed", en: "Delayed", ar: "متأخر" },
  { id: "planned", en: "Planned", ar: "مخطط" },
  { id: "completed", en: "Completed", ar: "مكتمل" },
  { id: "material_shortage", en: "Material Shortage", ar: "نقص مواد" },
  { id: "qc_failed", en: "QC Failed", ar: "فشل جودة" },
  { id: "high_priority", en: "High Priority", ar: "أولوية عالية" },
];

const REPORTS = [
  { id: "daily", icon: Calendar, en: "Daily Production Report", ar: "تقرير الإنتاج اليومي" },
  { id: "weekly", icon: BarChart3, en: "Weekly Production Report", ar: "تقرير الإنتاج الأسبوعي" },
  { id: "efficiency", icon: Zap, en: "Efficiency Report", ar: "تقرير الكفاءة" },
  { id: "qc_defect", icon: ShieldCheck, en: "QC Defect Report", ar: "تقرير عيوب الجودة" },
  { id: "delay", icon: AlertTriangle, en: "Delayed Orders Report", ar: "تقرير الأوامر المتأخرة" },
  { id: "cost", icon: DollarSign, en: "Cost Variance Report", ar: "تقرير تباين التكاليف" },
  { id: "worker", icon: Users, en: "Worker Productivity Report", ar: "تقرير إنتاجية العمال" },
  { id: "material", icon: Package, en: "Material Usage Report", ar: "تقرير استخدام المواد" },
];

// ─── Helpers ──────────────────────────────────────────────

function fmt(n: number) { return n.toLocaleString(); }

function clsx(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function ProgressBar({ pct, size = "md" }: { pct: number; size?: "sm" | "md" | "lg" }) {
  const h = size === "sm" ? "h-1" : size === "lg" ? "h-3" : "h-1.5";
  const color = pct >= 100 ? "bg-emerald-500" : pct >= 70 ? "bg-blue-500" : pct >= 40 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className={`w-full ${h} bg-muted rounded-full overflow-hidden`}>
      <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium inline-flex items-center ${className}`}>{children}</span>;
}

// ─── Stat Card ────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, color = "text-foreground" }: {
  label: string; value: string | number; sub?: string; icon: typeof Factory; color?: string;
}) {
  return (
    <div className="bg-background border border-border/40 rounded-xl p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
          <Icon size={15} className="text-muted-foreground" />
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
      <p className={`text-[22px] font-semibold tabular-nums ${color}`} style={{ fontFamily: "var(--app-font-serif)" }}>{value}</p>
      {sub && <p className="text-[10.5px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

// ─── Dashboard View ───────────────────────────────────────

function DashboardView({ ar, onSelectOrder }: { ar: boolean; onSelectOrder: (id: string) => void }) {
  const stats = getProductionStats();
  const orders = getProductionOrders();
  const alerts = getProductionAlerts();
  const workstations = getWorkstations();
  const activeOrders = orders.filter(o => o.status === "in_progress" || o.status === "delayed");
  const recentAlerts = alerts.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label={t(ar, "Active Orders", "أوامر نشطة")} value={stats.activeOrders} icon={Factory} color="text-blue-600" />
        <StatCard label={t(ar, "Delayed", "متأخرة")} value={stats.delayedOrders} icon={AlertTriangle} color={stats.delayedOrders > 0 ? "text-rose-600" : "text-zinc-400"} />
        <StatCard label={t(ar, "Completed", "مكتملة")} value={stats.completedOrders} icon={CheckCircle2} color="text-emerald-600" />
        <StatCard label={t(ar, "Waiting Materials", "انتظار مواد")} value={stats.waitingMaterials} icon={Package} color="text-amber-600" />
        <StatCard label={t(ar, "Avg Rate", "متوسط المعدل")} value={`${stats.avgProductionRate}/hr`} icon={Zap} color="text-violet-600" />
        <StatCard label={t(ar, "Avg Efficiency", "متوسط الكفاءة")} value={`${stats.avgEfficiency}%`} icon={TrendingUp} color={stats.avgEfficiency >= 85 ? "text-emerald-600" : "text-amber-600"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Active Orders */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>{t(ar, "Active Production", "الإنتاج النشط")}</h3>
            <span className="text-[11px] text-muted-foreground">{activeOrders.length} {t(ar, "orders", "أوامر")}</span>
          </div>
          <div className="space-y-2">
            {activeOrders.map(order => (
              <button key={order.id} onClick={() => onSelectOrder(order.id)}
                className="w-full text-left bg-background border border-border/40 rounded-xl p-4 hover:shadow-sm hover:border-border/70 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10.5px] font-mono text-muted-foreground">{order.order_number}</span>
                      <Badge className={STATUS_COLORS[order.status]}>{t(ar, order.status.replace("_", " "), order.status)}</Badge>
                      <Badge className={PRIORITY_COLORS[order.priority]}>{t(ar, order.priority, order.priority)}</Badge>
                      {order.is_delayed && <Badge className="bg-rose-100 text-rose-600">{t(ar, `${order.delay_days}d late`, `تأخر ${order.delay_days} يوم`)}</Badge>}
                    </div>
                    <p className="text-[13px] font-medium" style={{ fontFamily: "var(--app-font-serif)" }}>{order.product_name}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10.5px] text-muted-foreground flex-wrap">
                      <span>{order.customer_name}</span>
                      <span className="flex items-center gap-1"><Box size={9} />{fmt(order.completed_qty)}/{fmt(order.planned_qty)}</span>
                      <span className="flex items-center gap-1"><Zap size={9} />{order.production_rate_per_hour}/hr</span>
                      <span>{order.current_stage_en}</span>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${order.progress_pct}%` }} />
                      </div>
                      <span className="text-[10.5px] tabular-nums font-medium w-8 text-right">{order.progress_pct}%</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">ETA: {order.estimated_completion}</span>
                  </div>
                </div>
              </button>
            ))}
            {activeOrders.length === 0 && (
              <div className="py-8 text-center text-[12px] text-muted-foreground/50">{t(ar, "No active orders", "لا أوامر نشطة")}</div>
            )}
          </div>
        </div>

        {/* Sidebar: Alerts + Workstations */}
        <div className="space-y-5">
          {/* Alerts */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>{t(ar, "Alerts", "التنبيهات")}</h3>
              {alerts.length > 0 && <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 text-[10px] font-medium flex items-center justify-center">{alerts.length}</span>}
            </div>
            <div className="space-y-2">
              {recentAlerts.map(alert => (
                <div key={alert.id} className={`p-3 rounded-lg border text-[11px] ${ALERT_SEVERITY[alert.severity]}`}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">{alert.order_number}</span>
                      <p className="mt-0.5 text-[10.5px] opacity-80">{ar ? alert.message_ar : alert.message_en}</p>
                    </div>
                  </div>
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="py-4 text-center text-[11px] text-muted-foreground/50">{t(ar, "No alerts", "لا تنبيهات")}</div>
              )}
            </div>
          </div>

          {/* Workstations */}
          <div>
            <h3 className="text-[13px] font-semibold mb-3" style={{ fontFamily: "var(--app-font-serif)" }}>{t(ar, "Workstations", "محطات العمل")}</h3>
            <div className="space-y-1.5">
              {workstations.map(ws => (
                <div key={ws.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/20 border border-border/20">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${ws.status === "active" ? "bg-emerald-500" : ws.status === "maintenance" ? "bg-amber-500" : ws.status === "down" ? "bg-rose-500" : "bg-zinc-300"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium truncate">{ws.name}</p>
                    <p className="text-[9.5px] text-muted-foreground">{ws.operator || t(ar, "No operator", "بلا مشغل")}</p>
                  </div>
                  <span className="text-[9px] text-muted-foreground">{ws.capacity}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Production Rate Overview */}
      <div>
        <h3 className="text-[14px] font-semibold mb-3" style={{ fontFamily: "var(--app-font-serif)" }}>{t(ar, "Production Rate Overview", "نظرة عامة على معدل الإنتاج")}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {[
            { label: t(ar, "Daily Output", "الإنتاج اليومي"), value: fmt(stats.dailyOutput), sub: t(ar, "units", "وحدة"), icon: Package },
            { label: t(ar, "On-Time Rate", "معدل التسليم"), value: `${stats.onTimeRate}%`, sub: t(ar, "of orders", "من الأوامر"), icon: Target },
            { label: t(ar, "Total Completed", "إجمالي المنجز"), value: fmt(stats.totalCompletedQty), sub: `/ ${fmt(stats.totalPlannedQty)} ${t(ar, "planned", "مخطط")}`, icon: CheckCircle2 },
            { label: t(ar, "Total Remaining", "المتبقي"), value: fmt(stats.totalRemainingQty), sub: t(ar, "units to produce", "وحدة للإنتاج"), icon: Clock },
          ].map((s, i) => (
            <div key={i} className="bg-background border border-border/40 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon size={13} className="text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-[18px] font-semibold tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── List View ────────────────────────────────────────────

function ListView({ ar, onSelectOrder }: { ar: boolean; onSelectOrder: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const orders = getProductionOrders();

  const filtered = useMemo(() => {
    let list = orders;
    if (filter === "in_progress") list = list.filter(o => o.status === "in_progress");
    else if (filter === "delayed") list = list.filter(o => o.is_delayed || o.status === "delayed");
    else if (filter === "planned") list = list.filter(o => o.status === "planned");
    else if (filter === "completed") list = list.filter(o => o.status === "completed");
    else if (filter === "material_shortage") list = list.filter(o => o.material_status === "shortage" || o.material_status === "partial");
    else if (filter === "qc_failed") list = list.filter(o => o.qc_status === "failed");
    else if (filter === "high_priority") list = list.filter(o => ["critical", "urgent", "high"].includes(o.priority));

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.order_number.toLowerCase().includes(q) ||
        o.product_name.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.product_sku.toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, filter, search]);

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
          <input className="w-full h-9 px-3 pl-9 rounded-xl border border-border/60 bg-background text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder={t(ar, "Search orders...", "بحث في الأوامر...")} value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground"><X size={12} /></button>}
        </div>
        <div className="flex gap-1 flex-wrap">
          {LIST_FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${filter === f.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"}`}>
              {ar ? f.ar : f.en}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-background border border-border/40 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[120px_1fr_80px_100px_80px_80px_90px_80px_80px] gap-2 px-4 py-2.5 bg-muted/30 text-[10px] text-muted-foreground font-medium border-b border-border/30">
          <span>{t(ar, "Order #", "رقم الأمر")}</span>
          <span>{t(ar, "Product / Customer", "المنتج / العميل")}</span>
          <span>{t(ar, "Qty", "الكمية")}</span>
          <span>{t(ar, "Stage", "المرحلة")}</span>
          <span>{t(ar, "Rate", "المعدل")}</span>
          <span>{t(ar, "Progress", "التقدم")}</span>
          <span>{t(ar, "Due Date", "التسليم")}</span>
          <span>{t(ar, "Status", "الحالة")}</span>
          <span>{t(ar, "Priority", "الأولوية")}</span>
        </div>
        {/* Rows */}
        <div className="divide-y divide-border/20">
          {filtered.map(order => (
            <button key={order.id} onClick={() => onSelectOrder(order.id)}
              className="w-full grid grid-cols-[120px_1fr_80px_100px_80px_80px_90px_80px_80px] gap-2 px-4 py-3 items-center text-left hover:bg-muted/20 transition-colors">
              <span className="text-[11px] font-mono text-muted-foreground">{order.order_number}</span>
              <div className="min-w-0">
                <p className="text-[12px] font-medium truncate">{order.product_name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{order.customer_name}</p>
              </div>
              <div className="text-[11px]">
                <span className="font-medium tabular-nums">{fmt(order.completed_qty)}</span>
                <span className="text-muted-foreground">/{fmt(order.planned_qty)}</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STAGE_COLORS[order.current_stage] || "bg-zinc-100 text-zinc-600"}`}>
                {order.current_stage_en}
              </span>
              <span className="text-[11px] tabular-nums flex items-center gap-1">
                <Zap size={9} className="text-muted-foreground" />{order.production_rate_per_hour}/hr
              </span>
              <div className="flex items-center gap-2">
                <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${order.progress_pct}%` }} />
                </div>
                <span className="text-[10px] tabular-nums">{order.progress_pct}%</span>
              </div>
              <div className="flex items-center gap-1 text-[10.5px]">
                <Calendar size={9} className="text-muted-foreground" />
                <span className={order.is_delayed ? "text-rose-600 font-medium" : ""}>{order.due_date}</span>
              </div>
              <Badge className={STATUS_COLORS[order.status]}>{t(ar, order.status.replace("_", " "), order.status)}</Badge>
              <Badge className={PRIORITY_COLORS[order.priority]}>{t(ar, order.priority, order.priority)}</Badge>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-[12px] text-muted-foreground/50">{t(ar, "No orders found", "لا توجد أوامر")}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Kanban View ──────────────────────────────────────────

function KanbanView({ ar, onSelectOrder }: { ar: boolean; onSelectOrder: (id: string) => void }) {
  const orders = getProductionOrders();
  const stageKeys = ["planned", "materials_reserved", "cutting", "edgebanding", "drilling", "assembly", "finishing", "quality_control", "packaging", "ready_dispatch"];
  const stageLabels: Record<string, { en: string; ar: string }> = {
    planned: { en: "Planned", ar: "مخطط" },
    materials_reserved: { en: "Materials", ar: "المواد" },
    cutting: { en: "Cutting", ar: "التقطيع" },
    edgebanding: { en: "Edgebanding", ar: "الكنار" },
    drilling: { en: "Drilling", ar: "التخريم" },
    assembly: { en: "Assembly", ar: "التجميع" },
    finishing: { en: "Finishing", ar: "التشطيب" },
    quality_control: { en: "QC", ar: "الجودة" },
    packaging: { en: "Packaging", ar: "التغليف" },
    ready_dispatch: { en: "Ready", ar: "جاهز" },
  };

  const grouped = useMemo(() => {
    const map: Record<string, ProductionOrder[]> = {};
    for (const key of stageKeys) map[key] = [];
    for (const order of orders) {
      let key = order.status === "completed" ? "ready_dispatch" : order.status === "planned" ? "planned" : order.current_stage;
      if (!map[key]) key = "planned";
      map[key].push(order);
    }
    return map;
  }, [orders]);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: "thin" }}>
      {stageKeys.map(key => (
        <div key={key} className="min-w-[260px] flex-1">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${STAGE_DOT[key] || "bg-zinc-300"}`} />
              <span className="text-[12px] font-medium">{ar ? stageLabels[key]?.ar : stageLabels[key]?.en}</span>
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{grouped[key].length}</span>
            </div>
          </div>
          <div className="space-y-2">
            {grouped[key].map(order => (
              <button key={order.id} onClick={() => onSelectOrder(order.id)}
                className="w-full text-left bg-background border border-border/40 rounded-xl p-3.5 hover:shadow-sm hover:border-border/70 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-muted-foreground">{order.order_number}</span>
                  <Badge className={PRIORITY_COLORS[order.priority]}>{order.priority}</Badge>
                </div>
                <p className="text-[12.5px] font-medium mb-1.5" style={{ fontFamily: "var(--app-font-serif)" }}>{order.product_name}</p>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2">
                  <span>{order.customer_name}</span>
                  <span>{order.completed_qty}/{order.planned_qty}</span>
                </div>
                <ProgressBar pct={order.progress_pct} size="sm" />
                <div className="flex items-center justify-between mt-2 text-[10px]">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Zap size={9} />{order.production_rate_per_hour}/hr
                  </div>
                  {order.is_delayed ? (
                    <span className="text-rose-600 font-medium">{t(ar, `${order.delay_days}d late`, `تأخر ${order.delay_days} يوم`)}</span>
                  ) : (
                    <span className="text-muted-foreground">{order.due_date}</span>
                  )}
                </div>
              </button>
            ))}
            {grouped[key].length === 0 && (
              <div className="py-8 text-center text-[11px] text-muted-foreground/30 border border-dashed border-border/30 rounded-xl">
                {t(ar, "No orders", "لا أوامر")}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Order Detail ─────────────────────────────────────────

function OrderDetail({ orderId, onBack, ar }: { orderId: string; onBack: () => void; ar: boolean }) {
  const order = getProductionOrder(orderId);
  if (!order) return <div className="py-16 text-center text-[13px] text-muted-foreground">{t(ar, "Order not found", "الأمر غير موجود")}</div>;

  const [tab, setTab] = useState<"overview" | "stages" | "materials" | "qc" | "activity">("overview");

  const totalRejected = order.stages.reduce((s, st) => s + st.rejected_qty, 0);
  const totalRework = order.stages.reduce((s, st) => s + st.rework_qty, 0);
  const totalStageTime = order.stages.reduce((s, st) => s + (st.actual_duration_hours || 0), 0);

  const detailTabs = [
    { id: "overview" as const, icon: Layers, en: "Overview", ar: "نظرة عامة" },
    { id: "stages" as const, icon: Timer, en: "Stages", ar: "المراحل" },
    { id: "materials" as const, icon: Package, en: "Materials", ar: "المواد" },
    { id: "qc" as const, icon: ShieldCheck, en: "QC", ar: "الجودة" },
    { id: "activity" as const, icon: Activity, en: "Activity", ar: "النشاط" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-muted/50 mt-1"><ChevronRight size={16} className="rotate-180" /></button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[11px] font-mono text-muted-foreground">{order.order_number}</span>
            <Badge className={STATUS_COLORS[order.status]}>{t(ar, order.status.replace("_", " "), order.status)}</Badge>
            <Badge className={PRIORITY_COLORS[order.priority]}>{t(ar, order.priority, order.priority)}</Badge>
            {order.is_delayed && <Badge className="bg-rose-100 text-rose-600">{t(ar, `${order.delay_days}d late`, `تأخر ${order.delay_days} يوم`)}</Badge>}
            <Badge className={order.material_status === "shortage" ? "bg-rose-100 text-rose-600" : order.material_status === "partial" ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-amber-600"}>
              {order.material_status === "shortage" ? t(ar, "Material Shortage", "نقص مواد") : order.material_status === "partial" ? t(ar, "Partial Materials", "مواد جزئية") : t(ar, "Materials OK", "المواد متوفرة")}
            </Badge>
          </div>
          <h2 className="text-[18px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>{order.product_name}</h2>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><Box size={10} />{order.product_sku}</span>
            <span className="flex items-center gap-1"><Users size={10} />{order.customer_name}</span>
            <span className="flex items-center gap-1"><FileText size={10} />{order.sales_order_ref}</span>
            <span className="flex items-center gap-1"><Calendar size={10} />{t(ar, "Due", "التسليم")}: {order.due_date}</span>
            <span className="flex items-center gap-1"><Users size={10} />{order.assigned_team}</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${order.progress_pct}%` }} />
            </div>
            <span className="text-[13px] font-semibold tabular-nums">{order.progress_pct}%</span>
          </div>
          <p className="text-[10px] text-muted-foreground">{t(ar, "المعدل:", "Rate:")} {order.production_rate_per_hour}/hr ({order.efficiency_pct}% {t(ar, "كفاءة", "eff")})</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border/30 pb-2 overflow-x-auto">
        {detailTabs.map(t2 => (
          <button key={t2.id} onClick={() => setTab(t2.id)}
            className={`px-3 py-2 rounded-lg text-[11.5px] font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${tab === t2.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"}`}>
            <t2.icon size={12} />{ar ? t2.ar : t2.en}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === "overview" && (
        <div className="space-y-5">
          {/* Quantity Summary */}
          <div className="bg-background border border-border/40 rounded-xl p-5">
            <h3 className="text-[13px] font-semibold mb-3" style={{ fontFamily: "var(--app-font-serif)" }}>{t(ar, "Quantity Summary", "ملخص الكميات")}</h3>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
              {[
                { label: t(ar, "Ordered", "المطلوب"), value: fmt(order.planned_qty), color: "text-foreground" },
                { label: t(ar, "Completed", "المكتمل"), value: fmt(order.completed_qty), color: "text-blue-600" },
                { label: t(ar, "Passed", "الناجح"), value: fmt(order.passed_qty), color: "text-emerald-600" },
                { label: t(ar, "Remaining", "المتبقي"), value: fmt(order.remaining_qty), color: "text-amber-600" },
                { label: t(ar, "Rejected", "المرفوض"), value: fmt(order.rejected_qty), color: "text-rose-600" },
                { label: t(ar, "Rework", "إعادة العمل"), value: fmt(order.rework_qty), color: "text-orange-600" },
                { label: t(ar, "Waste", "الهالك"), value: fmt(order.waste_qty), color: "text-zinc-500" },
                { label: t(ar, "Efficiency", "الكفاءة"), value: `${order.efficiency_pct}%`, color: order.efficiency_pct >= 85 ? "text-emerald-600" : "text-amber-600" },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <p className="text-[10px] text-muted-foreground mb-1">{s.label}</p>
                  <p className={`text-[16px] font-semibold tabular-nums ${s.color}`} style={{ fontFamily: "var(--app-font-serif)" }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Production Rate Card */}
          <div className="bg-background border border-border/40 rounded-xl p-5">
            <h3 className="text-[13px] font-semibold mb-3" style={{ fontFamily: "var(--app-font-serif)" }}>{t(ar, "Production Rate", "معدل الإنتاج")}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[
                { label: t(ar, "Current Rate", "المعدل الحالي"), value: `${order.production_rate_per_hour}/hr` },
                { label: t(ar, "Planned Rate", "المعدل المخطط"), value: `${order.planned_rate_per_hour}/hr` },
                { label: t(ar, "Daily Rate", "المعدل اليومي"), value: `${fmt(order.production_rate_per_day)}/day` },
                { label: t(ar, "Efficiency", "الكفاءة"), value: `${order.efficiency_pct}%` },
                { label: t(ar, "ETA", "الانتهاء المتوقع"), value: order.estimated_completion },
              ].map((s, i) => (
                <div key={i}>
                  <p className="text-[10px] text-muted-foreground mb-1">{s.label}</p>
                  <p className="text-[14px] font-semibold tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>{s.value}</p>
                </div>
              ))}
            </div>
            {order.is_delayed && (
              <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-700 flex items-start gap-2">
                <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">{t(ar, "متأخر:", "Delayed:")}</span> {ar ? order.delay_reason : order.delay_reason}
                </div>
              </div>
            )}
          </div>

          {/* Cost Summary */}
          <div className="bg-background border border-border/40 rounded-xl p-5">
            <h3 className="text-[13px] font-semibold mb-3" style={{ fontFamily: "var(--app-font-serif)" }}>{t(ar, "Cost Tracking", "تتبع التكاليف")}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[
                { label: t(ar, "Estimated", "المقدّر"), value: `$${fmt(order.estimated_cost)}` },
                { label: t(ar, "Actual", "الفعلي"), value: `$${fmt(order.actual_cost)}` },
                { label: t(ar, "Material", "المواد"), value: `$${fmt(order.material_cost)}` },
                { label: t(ar, "Labor", "العمالة"), value: `$${fmt(order.labor_cost)}` },
                { label: t(ar, "Variance", "الانحراف"), value: `$${fmt(order.actual_cost - order.estimated_cost)}`, color: order.actual_cost > order.estimated_cost ? "text-rose-600" : "text-emerald-600" },
              ].map((s, i) => (
                <div key={i}>
                  <p className="text-[10px] text-muted-foreground mb-1">{s.label}</p>
                  <p className={`text-[14px] font-semibold tabular-nums ${s.color || "text-foreground"}`} style={{ fontFamily: "var(--app-font-serif)" }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stages Tab */}
      {tab === "stages" && (
        <div className="space-y-3">
          {/* Visual Stage Timeline */}
          <div className="bg-background border border-border/40 rounded-xl p-5">
            <h3 className="text-[13px] font-semibold mb-4" style={{ fontFamily: "var(--app-font-serif)" }}>{t(ar, "Manufacturing Stages", "مراحل التصنيع")}</h3>
            <div className="space-y-1">
              {order.stages.sort((a, b) => a.sequence - b.sequence).map((stage, i) => {
                const isCompleted = stage.status === "completed";
                const isActive = stage.status === "in_progress";
                const isPending = stage.status === "not_started" || stage.status === "waiting";
                return (
                  <div key={stage.id} className="flex items-center gap-3">
                    {/* Connector */}
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full shrink-0 ${isCompleted ? "bg-emerald-500" : isActive ? "bg-blue-500 animate-pulse" : "bg-muted border-2 border-border"}`} />
                      {i < order.stages.length - 1 && <div className={`w-px h-6 ${isCompleted ? "bg-emerald-300" : "bg-border/40"}`} />}
                    </div>
                    {/* Stage Info */}
                    <div className={`flex-1 flex items-center justify-between px-3 py-2 rounded-lg ${isCompleted ? "bg-emerald-50/50" : isActive ? "bg-blue-50/50" : "bg-muted/20"}`}>
                      <div className="flex items-center gap-2.5">
                        <span className={`text-[12px] font-medium ${isCompleted ? "text-emerald-700" : isActive ? "text-blue-700" : "text-muted-foreground"}`}>
                          {ar ? stage.stage_name_ar : stage.stage_name_en}
                        </span>
                        {stage.assigned_operator && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Users size={9} />{stage.assigned_operator}</span>}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        {stage.completed_qty > 0 && <span>{fmt(stage.completed_qty)} {t(ar, "piece", "قطعة")}</span>}
                        {stage.actual_duration_hours != null && <span className="tabular-nums">{stage.actual_duration_hours}h</span>}
                        {isCompleted && <CheckCircle2 size={12} className="text-emerald-500" />}
                        {isActive && <span className="text-blue-600 font-medium">{t(ar, "جاري", "Active")}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stage Details Table */}
          <div className="bg-background border border-border/40 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1fr_80px_80px_80px_80px_80px_80px] gap-2 px-4 py-2 bg-muted/30 text-[10px] text-muted-foreground font-medium border-b border-border/30">
              <span>{t(ar, "المرحلة", "Stage")}</span>
              <span>{t(ar, "الحالة", "Status")}</span>
              <span>{t(ar, "المكتمل", "Done")}</span>
              <span>{t(ar, "المتبقي", "Left")}</span>
              <span>{t(ar, "مرفوض", "Reject")}</span>
              <span>{t(ar, "إعادة", "Rework")}</span>
              <span>{t(ar, "الوقت", "Time")}</span>
            </div>
            <div className="divide-y divide-border/20">
              {order.stages.sort((a, b) => a.sequence - b.sequence).map(stage => (
                <div key={stage.id} className="grid grid-cols-[1fr_80px_80px_80px_80px_80px_80px] gap-2 px-4 py-2.5 items-center text-[11px]">
                  <span className="font-medium">{ar ? stage.stage_name_ar : stage.stage_name_en}</span>
                  <Badge className={STAGE_COLORS[stage.stage_key] || "bg-zinc-100 text-zinc-600"}>{stage.status}</Badge>
                  <span className="tabular-nums">{fmt(stage.completed_qty)}</span>
                  <span className="tabular-nums">{fmt(stage.remaining_qty)}</span>
                  <span className={`tabular-nums ${stage.rejected_qty > 0 ? "text-rose-600" : ""}`}>{fmt(stage.rejected_qty)}</span>
                  <span className={`tabular-nums ${stage.rework_qty > 0 ? "text-orange-600" : ""}`}>{fmt(stage.rework_qty)}</span>
                  <span className="tabular-nums">{stage.actual_duration_hours != null ? `${stage.actual_duration_hours}h` : "—"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Materials Tab */}
      {tab === "materials" && (
        <div className="bg-background border border-border/40 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border/30">
            <h3 className="text-[13px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>{t(ar, "Materials", "المواد")}</h3>
          </div>
          <div className="grid grid-cols-[1fr_80px_80px_80px_80px_80px_100px] gap-2 px-4 py-2 bg-muted/30 text-[10px] text-muted-foreground font-medium border-b border-border/30">
            <span>{t(ar, "المادة", "Material")}</span>
            <span>{t(ar, "المطلوب", "Required")}</span>
            <span>{t(ar, "محجوز", "Reserved")}</span>
            <span>{t(ar, "مستخدم", "Used")}</span>
            <span>{t(ar, "المتبقي", "Remaining")}</span>
            <span>{t(ar, "الحالة", "Status")}</span>
            <span>{t(ar, "المورد", "Supplier")}</span>
          </div>
          <div className="divide-y divide-border/20">
            {order.materials.map(mat => (
              <div key={mat.id} className="grid grid-cols-[1fr_80px_80px_80px_80px_80px_100px] gap-2 px-4 py-2.5 items-center text-[11px]">
                <div>
                  <span className="font-medium">{mat.name}</span>
                  {mat.warehouse_location && <span className="text-[9px] text-muted-foreground block">{mat.warehouse_location}</span>}
                </div>
                <span className="tabular-nums">{fmt(mat.required_qty)} {mat.unit}</span>
                <span className="tabular-nums">{fmt(mat.reserved_qty)}</span>
                <span className="tabular-nums">{fmt(mat.used_qty)}</span>
                <span className={`tabular-nums ${mat.remaining_qty > 0 && mat.status !== "available" ? "text-amber-600" : ""}`}>{fmt(mat.remaining_qty)}</span>
                <Badge className={mat.status === "available" ? "bg-emerald-100 text-emerald-600" : mat.status === "partial" ? "bg-amber-100 text-amber-600" : "bg-rose-100 text-rose-600"}>
                  {mat.status}
                </Badge>
                <span className="text-muted-foreground truncate">{mat.supplier}</span>
              </div>
            ))}
            {order.materials.length === 0 && (
              <div className="py-8 text-center text-[11px] text-muted-foreground/50">{t(ar, "No materials tracked", "لا مواد متعقبة")}</div>
            )}
          </div>
        </div>
      )}

      {/* QC Tab */}
      {tab === "qc" && (
        <div className="space-y-4">
          <div className="bg-background border border-border/40 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>{t(ar, "QC Status", "حالة الجودة")}</h3>
              <Badge className={order.qc_status === "passed" ? "bg-emerald-100 text-emerald-600" : order.qc_status === "failed" ? "bg-rose-100 text-rose-600" : "bg-zinc-100 text-zinc-600"}>
                {order.qc_status}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-muted/20 rounded-lg">
                <p className="text-[10px] text-muted-foreground">{t(ar, "ناجح", "Passed")}</p>
                <p className="text-[16px] font-semibold text-emerald-600">{fmt(order.passed_qty)}</p>
              </div>
              <div className="text-center p-3 bg-muted/20 rounded-lg">
                <p className="text-[10px] text-muted-foreground">{t(ar, "مرفوض", "Failed")}</p>
                <p className="text-[16px] font-semibold text-rose-600">{fmt(order.rejected_qty)}</p>
              </div>
              <div className="text-center p-3 bg-muted/20 rounded-lg">
                <p className="text-[10px] text-muted-foreground">{t(ar, "نسبة العيوب", "Defect %")}</p>
                <p className="text-[16px] font-semibold">{order.planned_qty > 0 ? ((order.rejected_qty / order.planned_qty) * 100).toFixed(1) : 0}%</p>
              </div>
            </div>
          </div>

          {order.qc_checks.length > 0 && (
            <div className="bg-background border border-border/40 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border/30">
                <h3 className="text-[13px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>{t(ar, "QC Checks", "فحوصات الجودة")}</h3>
              </div>
              <div className="divide-y divide-border/20">
                {order.qc_checks.map(qc => (
                  <div key={qc.id} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] font-medium">{qc.stage} — {qc.inspector}</span>
                      <Badge className={qc.status === "passed" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}>{qc.status}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-[10.5px] text-muted-foreground">
                      <span>{qc.passed_qty} {t(ar, "ناجح", "passed")}</span>
                      <span>{qc.failed_qty} {t(ar, "مرفوض", "failed")}</span>
                      {qc.defect_type && <span>{t(ar, "العيوب:", "Defects:")} {qc.defect_type}</span>}
                      <span>{qc.defect_pct}%</span>
                    </div>
                    {qc.notes && <p className="text-[10.5px] text-muted-foreground mt-1">{qc.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Activity Tab */}
      {tab === "activity" && (
        <div className="bg-background border border-border/40 rounded-xl p-5">
          <h3 className="text-[13px] font-semibold mb-4" style={{ fontFamily: "var(--app-font-serif)" }}>{t(ar, "Activity Log", "سجل النشاط")}</h3>
          <div className="space-y-3">
            {order.activity_log.map(entry => {
              const typeColors: Record<string, string> = {
                stage_change: "bg-blue-100 text-blue-600",
                quantity_update: "bg-indigo-100 text-indigo-600",
                qc: "bg-orange-100 text-orange-600",
                material: "bg-amber-100 text-amber-600",
                comment: "bg-zinc-100 text-zinc-600",
                file: "bg-violet-100 text-violet-600",
                delay: "bg-rose-100 text-rose-600",
                completion: "bg-emerald-100 text-emerald-600",
                status_change: "bg-zinc-100 text-zinc-600",
              };
              return (
                <div key={entry.id} className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${typeColors[entry.type] || "bg-zinc-100 text-zinc-600"}`}>
                    <Activity size={12} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px]">{ar ? entry.description_ar : entry.description_en}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                      <span>{entry.user}</span>
                      <span>•</span>
                      <span>{new Date(entry.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Alerts View ──────────────────────────────────────────

function AlertsView({ ar }: { ar: boolean }) {
  const [alerts, setAlerts] = useState(getProductionAlerts());

  function handleDismiss(id: string) {
    dismissAlert(id);
    setAlerts(getProductionAlerts());
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>{t(ar, "Production Alerts", "تنبيهات الإنتاج")}</h3>
        <span className="text-[11px] text-muted-foreground">{alerts.length} {t(ar, "active", "نشطة")}</span>
      </div>
      <div className="space-y-2">
        {alerts.map(alert => (
          <div key={alert.id} className={`p-4 rounded-xl border ${ALERT_SEVERITY[alert.severity]}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-mono font-medium">{alert.order_number}</span>
                    <Badge className={alert.severity === "critical" ? "bg-rose-200 text-rose-800" : alert.severity === "warning" ? "bg-amber-200 text-amber-800" : "bg-blue-200 text-blue-800"}>
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-[12px] font-medium">{ar ? alert.message_ar : alert.message_en}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(alert.created_at).toLocaleString()}</p>
                </div>
              </div>
              <button onClick={() => handleDismiss(alert.id)} className="text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted/50">
                {t(ar, "تجاهل", "Dismiss")}
              </button>
            </div>
          </div>
        ))}
        {alerts.length === 0 && (
          <div className="py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-3"><CheckCircle2 size={20} className="text-emerald-500" /></div>
            <p className="text-[13px] font-medium">{t(ar, "كل شيء تمام!", "All clear!")}</p>
            <p className="text-[11px] text-muted-foreground">{t(ar, "لا توجد تنبيهات حالياً", "No alerts at the moment")}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── AI Insights View ─────────────────────────────────────

function AIInsightsView({ ar }: { ar: boolean }) {
  const insights = getAIInsights();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Brain size={16} className="text-primary" />
        <h3 className="text-[14px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>{t(ar, "THOTH AI — Production Intelligence", "THOTH AI — ذكاء الإنتاج")}</h3>
      </div>

      <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={14} className="text-primary" />
          <span className="text-[12px] font-medium text-primary">{t(ar, "ملخص AI", "AI Summary")}</span>
        </div>
        <p className="text-[12px] text-foreground/80 leading-relaxed">
          {ar
            ? `الإنتاج حالياً: ${getProductionStats().activeOrders} أوامر نشطة بمتوسط كفاءة ${getProductionStats().avgEfficiency}%. ${getProductionStats().delayedOrders} أوامر متأخرة تحتاج انتباه. أبطأ مرحلة هي الخياطة.`
            : `Production status: ${getProductionStats().activeOrders} active orders at ${getProductionStats().avgEfficiency}% avg efficiency. ${getProductionStats().delayedOrders} orders need attention. Sewing is the slowest stage across all active orders.`
          }
        </p>
      </div>

      <div className="space-y-3">
        {insights.map(insight => {
          const Icon = AI_TYPE_ICON[insight.type] || Brain;
          return (
            <div key={insight.id} className={`bg-background border border-border/40 rounded-xl p-4 border-l-4 ${AI_SEVERITY[insight.severity]}`}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold mb-1">{ar ? insight.title_ar : insight.title_en}</p>
                  <p className="text-[11.5px] text-muted-foreground leading-relaxed">{ar ? insight.detail_ar : insight.detail_en}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Reports View ─────────────────────────────────────────

function ReportsView({ ar }: { ar: boolean }) {
  const stats = getProductionStats();
  const orders = getProductionOrders();

  function handleExport(type: string) {
    const csvContent = orders.map(o =>
      `${o.order_number},${o.product_name},${o.customer_name},${o.planned_qty},${o.completed_qty},${o.progress_pct}%,${o.production_rate_per_hour}/hr,${o.efficiency_pct}%,${o.due_date},${o.status},${o.priority}`
    ).join("\n");
    const header = "Order,Product,Customer,Planned,Completed,Progress,Rate,Efficiency,Due,Status,Priority\n";
    const blob = new Blob([header + csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `thoth-production-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <h3 className="text-[14px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>{t(ar, "Production Reports", "تقارير الإنتاج")}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {REPORTS.map(report => (
          <button key={report.id} onClick={() => handleExport(report.id)}
            className="flex items-center gap-4 p-4 bg-background border border-border/40 rounded-xl hover:shadow-sm hover:border-border/70 transition-all text-left">
            <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
              <report.icon size={18} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-medium">{ar ? report.ar : report.en}</p>
              <p className="text-[10.5px] text-muted-foreground mt-0.5">{t(ar, "تصدير CSV", "Export CSV")}</p>
            </div>
            <Download size={14} className="text-muted-foreground shrink-0" />
          </button>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="bg-background border border-border/40 rounded-xl p-5">
        <h4 className="text-[13px] font-semibold mb-3" style={{ fontFamily: "var(--app-font-serif)" }}>{t(ar, "ملخص سريع", "Quick Summary")}</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] text-muted-foreground">{t(ar, "إجمالي الأوامر", "Total Orders")}</p>
            <p className="text-[16px] font-semibold">{stats.totalOrders}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">{t(ar, "معدل الإنجاز", "Completion Rate")}</p>
            <p className="text-[16px] font-semibold">{stats.totalPlannedQty > 0 ? Math.round((stats.totalCompletedQty / stats.totalPlannedQty) * 100) : 0}%</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">{t(ar, "متوسط الكفاءة", "Avg Efficiency")}</p>
            <p className="text-[16px] font-semibold">{stats.avgEfficiency}%</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">{t(ar, "معدل التسليم", "On-Time Rate")}</p>
            <p className="text-[16px] font-semibold">{stats.onTimeRate}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────

export default function ProductionPage() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [view, setView] = useState<ViewMode>("dashboard");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  if (selectedOrderId) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <OrderDetail orderId={selectedOrderId} onBack={() => setSelectedOrderId(null)} ar={ar} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight" style={{ fontFamily: "var(--app-font-serif)" }}>
            {ar ? "الإنتاج" : "Production"}
          </h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {ar ? "تتبع الإنتاج — أوامر، مراحل، معدلات، جودة" : "Track manufacturing — orders, stages, rates, quality"}
          </p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium px-5 h-10 hover:opacity-90 transition-opacity">
          <Plus size={14} />{ar ? "أمر جديد" : "New Order"}
        </button>
      </div>

      {/* View Tabs */}
      <div className="flex gap-1 mb-5 border-b border-border/30 pb-2 overflow-x-auto">
        {VIEW_TABS.map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id)}
            className={`px-3 py-2 rounded-lg text-[12px] font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap
              ${view === tab.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"}`}>
            <tab.icon size={13} />{ar ? tab.ar : tab.en}
            {tab.id === "alerts" && getProductionAlerts().length > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-medium flex items-center justify-center">{getProductionAlerts().length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {view === "dashboard" && <DashboardView ar={ar} onSelectOrder={setSelectedOrderId} />}
      {view === "list" && <ListView ar={ar} onSelectOrder={setSelectedOrderId} />}
      {view === "kanban" && <KanbanView ar={ar} onSelectOrder={setSelectedOrderId} />}
      {view === "alerts" && <AlertsView ar={ar} />}
      {view === "ai" && <AIInsightsView ar={ar} />}
      {view === "reports" && <ReportsView ar={ar} />}
    </div>
  );
}
