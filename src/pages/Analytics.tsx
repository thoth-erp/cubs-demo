/**
 * Analytics Command Center — 7-Level Analytics Dashboard
 * مركز قيادة التحليلات — ٧ مستويات تحليلية
 *
 * Levels: Executive · Sales · Production · Inventory · Purchasing · Finance · Customer
 * All insights from real data only — no fake numbers.
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { isDemoMode } from "../lib/supabase";
import { getDataSource } from "../lib/data-source";
import type { Database } from "../lib/database.types";
import {
  BarChart3, TrendingUp, Package, DollarSign, Clock,
  AlertTriangle, Users, ShoppingCart, Factory, Loader2,
  CheckCircle2, XCircle, ArrowUp, ArrowDown, Boxes,
  Download, Filter, Target, Zap, Truck,
  Activity, PieChart, Lightbulb, Layers,
} from "lucide-react";

type WorkItem = Database["public"]["Tables"]["work_items"]["Row"];
type Resource = Database["public"]["Tables"]["resources"]["Row"];
type Org = Database["public"]["Tables"]["organizations"]["Row"];
type ProdOrder = Database["public"]["Tables"]["production_orders"]["Row"];

type Tab = "executive" | "sales" | "production" | "inventory" | "purchasing" | "finance" | "customer";

const TABS: { id: Tab; en: string; ar: string; icon: React.ElementType }[] = [
  { id: "executive",  en: "Executive",  ar: "نظرة عامة",  icon: BarChart3 },
  { id: "sales",      en: "Sales",      ar: "المبيعات",   icon: TrendingUp },
  { id: "production", en: "Production", ar: "الإنتاج",    icon: Factory },
  { id: "inventory",  en: "Inventory",  ar: "المخزن",     icon: Boxes },
  { id: "purchasing", en: "Purchasing", ar: "المشتريات",  icon: ShoppingCart },
  { id: "finance",    en: "Finance",    ar: "المالية",    icon: DollarSign },
  { id: "customer",   en: "Customer",   ar: "العملاء",    icon: Users },
];

function fmt(n: number) { return n.toLocaleString("en", { maximumFractionDigits: 0 }); }
function pct(a: number, b: number) { return b > 0 ? Math.round((a / b) * 100) : 0; }

// ═══════════════════════════════════════════════════════════
// KPI METRIC CARD
// ═══════════════════════════════════════════════════════════

function MetricCard({ value, label, icon: Icon, color, trend, sub }: {
  value: string | number; label: string; icon: React.ElementType; color: string; trend?: number; sub?: string;
}) {
  return (
    <div className="border border-border/40 rounded-xl p-4 bg-background hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <Icon size={15} className={color} />
        {trend !== undefined && (
          <span className={`text-[10px] font-medium flex items-center gap-0.5 ${trend >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
            {trend >= 0 ? <ArrowUp size={9} /> : <ArrowDown size={9} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className={`text-[22px] font-medium tabular-nums ${color}`} style={{ fontFamily: "var(--app-font-serif)" }}>{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-[9px] text-muted-foreground/60 mt-0.5">{sub}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PROGRESS BAR
// ═══════════════════════════════════════════════════════════

function ProgressBar({ value, max, label, color = "bg-primary" }: { value: number; max: number; label: string; color?: string }) {
  const p = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-muted-foreground w-[120px] truncate">{label}</span>
      <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${p}%` }} />
      </div>
      <span className="text-[11px] font-medium tabular-nums w-12 text-right">{value}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// DONUT CHART (CSS-based)
// ═══════════════════════════════════════════════════════════

function DonutChart({ segments, size = 120, label }: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  label?: string;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;

  let cumulative = 0;
  const gradientParts = segments.map(seg => {
    const start = (cumulative / total) * 360;
    cumulative += seg.value;
    const end = (cumulative / total) * 360;
    return `${seg.color} ${start}deg ${end}deg`;
  });

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="rounded-full relative"
        style={{
          width: size, height: size,
          background: `conic-gradient(${gradientParts.join(", ")})`,
        }}
      >
        <div className="absolute inset-[25%] rounded-full bg-background flex items-center justify-center">
          <span className="text-[13px] font-bold" style={{ fontFamily: "var(--app-font-serif)" }}>{fmt(total)}</span>
        </div>
      </div>
      {label && <p className="text-[10px] text-muted-foreground">{label}</p>}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
        {segments.filter(s => s.value > 0).map(seg => (
          <div key={seg.label} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: seg.color }} />
            <span className="text-[9px] text-muted-foreground">{seg.label}: {seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PROGRESS RING
// ═══════════════════════════════════════════════════════════

function ProgressRing({ value, max, label, color = "hsl(var(--primary))", size = 80 }: {
  value: number; max: number; label: string; color?: string; size?: number;
}) {
  const p = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  const dash = (p / 100) * c;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={4} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={`${dash} ${c - dash}`} strokeLinecap="round" />
      </svg>
      <p className="text-[14px] font-bold -mt-[calc(50%+8px)]" style={{ fontFamily: "var(--app-font-serif)", position: "relative" }}>
        {Math.round(p)}%
      </p>
      <p className="text-[9px] text-muted-foreground mt-4">{label}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// HORIZONTAL BAR CHART
// ═══════════════════════════════════════════════════════════

function HBarChart({ items, color = "bg-primary", currency }: {
  items: { label: string; value: number }[];
  color?: string;
  currency?: string;
}) {
  const max = Math.max(...items.map(i => i.value), 1);
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-[10.5px] text-muted-foreground w-[110px] truncate">{item.label}</span>
          <div className="flex-1 h-3 bg-muted/40 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${color}`}
              initial={{ width: 0 }}
              animate={{ width: `${pct(item.value, max)}%` }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            />
          </div>
          <span className="text-[10.5px] font-medium tabular-nums w-16 text-right">
            {fmt(item.value)}{currency ? ` ${currency}` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SMART INSIGHT CARD
// ═══════════════════════════════════════════════════════════

function InsightCard({ text, type = "info" }: { text: string; type?: "info" | "warning" | "success" }) {
  const colors = {
    info: "bg-blue-50 border-blue-200/60 text-blue-700",
    warning: "bg-amber-50 border-amber-200/60 text-amber-700",
    success: "bg-emerald-50 border-emerald-200/60 text-emerald-700",
  };
  const icons = { info: Lightbulb, warning: AlertTriangle, success: CheckCircle2 };
  const Icon = icons[type];
  return (
    <div className={`px-3 py-2.5 rounded-xl border text-[11px] flex items-start gap-2 ${colors[type]}`}>
      <Icon size={12} className="shrink-0 mt-0.5" /><span>{text}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SECTION CARD
// ═══════════════════════════════════════════════════════════

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="border border-border/40 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold text-muted-foreground tracking-[0.06em] uppercase">{title}</p>
        {action}
      </div>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CSV EXPORT HELPER
// ═══════════════════════════════════════════════════════════

function exportCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export default function Analytics() {
  const { lang } = useLanguage();
  const { workspace } = useAuth();
  const ar = lang === "ar";
  const settings = workspace?.settings as Record<string, unknown> | undefined;
  const currency = (settings?.currency as string) || "EGP";

  const [loading, setLoading] = useState(true);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [prodOrders, setProdOrders] = useState<ProdOrder[]>([]);
  const [tab, setTab] = useState<Tab>("executive");

  useEffect(() => {
    const wid = workspace?.id || "demo";
    Promise.all([
      getDataSource().work_items.list(wid),
      getDataSource().resources.list(wid),
      getDataSource().organizations.list(wid),
      getDataSource().production_orders.list(wid),
    ]).then(([wi, res, org, po]) => {
      setWorkItems(wi); setResources(res); setOrgs(org); setProdOrders(po);
    }).finally(() => setLoading(false));
  }, [workspace?.id]);

  // ─── Computed data ──────────────────────────────────────
  const orders = useMemo(() => workItems.filter(w => w.type === "sales_order"), [workItems]);
  const quotations = useMemo(() => workItems.filter(w => w.type === "quotation"), [workItems]);
  const purchaseOrders = useMemo(() => workItems.filter(w => w.type === "purchase_request" || w.type === "purchase_order"), [workItems]);
  const products = useMemo(() => resources.filter(r => r.type === "product"), [resources]);
  const inventory = useMemo(() => resources.filter(r => r.type === "inventory" || r.type === "raw_material"), [resources]);
  const customers = useMemo(() => orgs.filter(o => !(o.tags ?? []).includes("vendor")), [orgs]);
  const vendors = useMemo(() => orgs.filter(o => (o.tags ?? []).includes("vendor")), [orgs]);

  const totalRevenue = orders.reduce((s, o) => s + ((o.metadata as any)?.total_amount || o.total_amount || 0), 0);
  const totalPaid = orders.reduce((s, o) => s + (((o.metadata as any)?.payments || []).reduce((ps: number, p: any) => ps + (p.amount || 0), 0)), 0);
  const unpaid = totalRevenue - totalPaid;
  const activeOrders = orders.filter(o => !["done", "cancelled"].includes(o.status));
  const overdueOrders = orders.filter(o => o.due_date && !["done", "cancelled"].includes(o.status) && new Date(o.due_date) < new Date());
  const completedOrders = orders.filter(o => o.status === "done");
  const cancelledOrders = orders.filter(o => o.status === "cancelled");
  const readyForProd = orders.filter(o => o.status === "approved");

  const ordersByStatus = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach(o => { map[o.status] = (map[o.status] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [orders]);

  const prodByStatus = useMemo(() => {
    const map: Record<string, number> = {};
    prodOrders.forEach(p => { map[p.status] = (map[p.status] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [prodOrders]);

  const lowStockItems = inventory.filter(r => {
    const m = (r.metadata ?? {}) as any;
    return m.current_qty !== undefined && m.reorder_level !== undefined && m.current_qty <= m.reorder_level;
  });

  const topCustomers = useMemo(() => {
    const map: Record<string, { name: string; total: number; count: number }> = {};
    orders.forEach(o => {
      const m = (o.metadata as any);
      const cid = m?.customer_id || m?.customer_name || "Unknown";
      const name = m?.customer_name || cid;
      if (!map[cid]) map[cid] = { name, total: 0, count: 0 };
      map[cid].total += m?.total_amount || o.total_amount || 0;
      map[cid].count++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 8);
  }, [orders]);

  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; count: number; revenue: number }> = {};
    orders.forEach(o => {
      const items = ((o.metadata as any)?.items || []) as any[];
      items.forEach(item => {
        const pid = item.product_id || item.name || "Unknown";
        if (!map[pid]) map[pid] = { name: item.name || pid, count: 0, revenue: 0 };
        map[pid].count += item.qty || 1;
        map[pid].revenue += (item.qty || 1) * (item.unit_price || 0);
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [orders]);

  const poByStatus = useMemo(() => {
    const map: Record<string, number> = {};
    purchaseOrders.forEach(p => { map[p.status] = (map[p.status] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [purchaseOrders]);

  const totalPurchaseValue = purchaseOrders.reduce((s, p) => s + ((p.metadata as any)?.total_amount || p.total_amount || 0), 0);

  // ─── Smart insights (real data only) ────────────────────
  const insights: { text: string; type: "info" | "warning" | "success" }[] = [];

  if (overdueOrders.length > 0) insights.push({ text: ar ? `${overdueOrders.length} طلبات متأخرة عن الموعد — تحتاج متابعة فورية` : `${overdueOrders.length} orders are past due — need immediate follow-up`, type: "warning" });
  if (lowStockItems.length > 0) insights.push({ text: ar ? `${lowStockItems.length} خامات تحت حد إعادة الطلب` : `${lowStockItems.length} items below reorder level`, type: "warning" });
  if (unpaid > 0 && totalRevenue > 0) insights.push({ text: ar ? `نسبة التحصيل ${pct(totalPaid, totalRevenue)}% — ${fmt(unpaid)} ${currency} متبقي` : `Collection rate ${pct(totalPaid, totalRevenue)}% — ${fmt(unpaid)} ${currency} outstanding`, type: totalPaid / totalRevenue > 0.7 ? "info" : "warning" });
  if (completedOrders.length > 0 && orders.length > 0) insights.push({ text: ar ? `${pct(completedOrders.length, orders.length)}% من الطلبات مكتملة` : `${pct(completedOrders.length, orders.length)}% of orders completed`, type: "success" });
  if (cancelledOrders.length > orders.length * 0.2 && orders.length >= 5) insights.push({ text: ar ? `${pct(cancelledOrders.length, orders.length)}% طلبات ملغية — نسبة عالية` : `${pct(cancelledOrders.length, orders.length)}% cancellation rate — investigate`, type: "warning" });

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 size={20} className="animate-spin text-muted-foreground/40" /></div>;

  const noData = orders.length === 0 && products.length === 0;

  // Status colors for donut
  const statusColors: Record<string, string> = {
    draft: "#94a3b8", pending: "#f59e0b", approved: "#3b82f6", in_progress: "#8b5cf6",
    done: "#22c55e", completed: "#22c55e", cancelled: "#ef4444", blocked: "#ef4444",
    on_hold: "#f97316", review: "#06b6d4",
  };

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="px-8 md:px-10 pt-8 pb-5 border-b border-border/40" style={{ background: "linear-gradient(160deg, hsl(var(--muted)/0.3) 0%, hsl(var(--background)) 60%)" }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[24px] font-medium mb-1" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.02em" }}>
              {ar ? "مركز التحليلات" : "Analytics Command Center"}
            </h1>
            <p className="text-[12px] text-muted-foreground">{ar ? "بيانات حقيقية من النظام — قرارات أسرع" : "Real data from your system — faster decisions"}</p>
          </div>
          {!noData && (
            <button
              onClick={() => exportCSV(
                "analytics-summary.csv",
                ["Metric", "Value"],
                [["Revenue", totalRevenue], ["Paid", totalPaid], ["Outstanding", unpaid], ["Orders", orders.length], ["Active Orders", activeOrders.length], ["Customers", customers.length], ["Products", products.length], ["Production Orders", prodOrders.length]],
              )}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border border-border/60 text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              <Download size={11} /> CSV
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 mt-4 overflow-x-auto pb-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11.5px] font-medium whitespace-nowrap transition-all ${
                tab === t.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/50"
              }`}>
              <t.icon size={12} />{ar ? t.ar : t.en}
            </button>
          ))}
        </div>
      </div>

      <div className="px-8 md:px-10 py-6 max-w-[1100px]">
        {noData && (
          <div className="py-16 text-center border border-dashed border-border/40 rounded-xl">
            <BarChart3 size={24} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-[14px] font-medium" style={{ fontFamily: "var(--app-font-serif)" }}>{ar ? "مفيش بيانات لسه" : "No data yet"}</p>
            <p className="text-[12px] text-muted-foreground mt-1">{ar ? "ابدأ بإنشاء طلبات ومنتجات وهتظهر التحليلات تلقائي" : "Start creating orders and products — analytics will appear automatically"}</p>
          </div>
        )}

        {!noData && (
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

              {/* ═══ EXECUTIVE ═══ */}
              {tab === "executive" && (
                <div className="space-y-6">
                  {/* KPIs */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MetricCard value={fmt(totalRevenue)} label={ar ? `إجمالي الإيراد (${currency})` : `Total Revenue (${currency})`} icon={DollarSign} color="text-foreground" />
                    <MetricCard value={activeOrders.length} label={ar ? "طلبات نشطة" : "Active Orders"} icon={Package} color="text-violet-600" />
                    <MetricCard value={overdueOrders.length} label={ar ? "طلبات متأخرة" : "Overdue"} icon={AlertTriangle} color={overdueOrders.length > 0 ? "text-rose-500" : "text-emerald-600"} />
                    <MetricCard value={customers.length} label={ar ? "العملاء" : "Customers"} icon={Users} color="text-primary" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MetricCard value={products.length} label={ar ? "المنتجات" : "Products"} icon={Package} color="text-amber-600" />
                    <MetricCard value={prodOrders.length} label={ar ? "أوامر تشغيل" : "Production Orders"} icon={Factory} color="text-orange-600" />
                    <MetricCard value={fmt(unpaid)} label={ar ? `غير مدفوع (${currency})` : `Outstanding (${currency})`} icon={DollarSign} color={unpaid > 0 ? "text-rose-500" : "text-emerald-600"} />
                    <MetricCard value={lowStockItems.length} label={ar ? "خامات ناقصة" : "Low Stock"} icon={Boxes} color={lowStockItems.length > 0 ? "text-amber-600" : "text-emerald-600"} />
                  </div>

                  {/* Charts row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Section title={ar ? "توزيع الطلبات" : "Order Distribution"}>
                      <DonutChart
                        segments={ordersByStatus.map(([status, count]) => ({
                          label: status.replace("_", " "),
                          value: count,
                          color: statusColors[status] || "#94a3b8",
                        }))}
                        label={ar ? "إجمالي الطلبات" : "Total Orders"}
                      />
                    </Section>
                    <Section title={ar ? "أفضل العملاء" : "Top Customers"}>
                      {topCustomers.length === 0
                        ? <p className="text-[11px] text-muted-foreground/50 py-4 text-center">{ar ? "مفيش بيانات" : "No data"}</p>
                        : <HBarChart items={topCustomers.slice(0, 5).map(c => ({ label: c.name, value: c.total }))} currency={currency} />
                      }
                    </Section>
                    <Section title={ar ? "الحالة المالية" : "Financial Health"}>
                      <div className="flex justify-center gap-6 py-2">
                        <ProgressRing value={totalPaid} max={totalRevenue} label={ar ? "نسبة التحصيل" : "Collection"} color="hsl(142, 71%, 45%)" />
                        <ProgressRing value={completedOrders.length} max={orders.length} label={ar ? "نسبة الإكمال" : "Completion"} color="hsl(250, 60%, 55%)" />
                      </div>
                    </Section>
                  </div>

                  {/* Insights */}
                  {insights.length > 0 && (
                    <Section title={ar ? "تحليلات ذكية" : "Smart Insights"}>
                      <div className="space-y-2">
                        {insights.map((ins, i) => <InsightCard key={i} text={ins.text} type={ins.type} />)}
                      </div>
                    </Section>
                  )}
                </div>
              )}

              {/* ═══ SALES ═══ */}
              {tab === "sales" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MetricCard value={orders.length} label={ar ? "إجمالي الطلبات" : "Total Orders"} icon={Package} color="text-primary" />
                    <MetricCard value={quotations.length} label={ar ? "عروض الأسعار" : "Quotations"} icon={TrendingUp} color="text-cyan-600" />
                    <MetricCard value={readyForProd.length} label={ar ? "جاهز للتصنيع" : "Ready for Production"} icon={CheckCircle2} color="text-emerald-600" />
                    <MetricCard value={fmt(totalRevenue)} label={`${ar ? "الإيراد" : "Revenue"} (${currency})`} icon={DollarSign} color="text-foreground" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Section title={ar ? "القمع التجاري" : "Sales Funnel"}
                      action={<button onClick={() => exportCSV("sales-by-status.csv", ["Status", "Count"], ordersByStatus)} className="text-[9px] text-muted-foreground hover:text-foreground"><Download size={10} /></button>}
                    >
                      <div className="space-y-2">
                        {ordersByStatus.map(([status, count], i) => {
                          const maxW = 100 - i * 8;
                          return (
                            <div key={status} className="flex items-center gap-2">
                              <div className="flex-1 flex justify-center">
                                <motion.div
                                  className="h-7 rounded-lg flex items-center justify-center text-[10px] font-medium text-white"
                                  style={{ background: statusColors[status] || "#94a3b8", width: `${Math.max(20, maxW)}%` }}
                                  initial={{ width: 0 }} animate={{ width: `${Math.max(20, maxW)}%` }}
                                  transition={{ duration: 0.4, delay: i * 0.05 }}
                                >
                                  {status.replace("_", " ")} ({count})
                                </motion.div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Section>

                    <Section title={ar ? "أفضل المنتجات" : "Top Products by Revenue"}>
                      {topProducts.length === 0
                        ? <p className="text-[11px] text-muted-foreground/50 py-4 text-center">{ar ? "مفيش بيانات" : "No data"}</p>
                        : <HBarChart items={topProducts.slice(0, 5).map(p => ({ label: p.name, value: p.revenue }))} color="bg-cyan-500" currency={currency} />
                      }
                    </Section>
                  </div>

                  <Section title={ar ? "العملاء حسب القيمة" : "Customers by Value"}>
                    <HBarChart items={topCustomers.map(c => ({ label: c.name, value: c.total }))} currency={currency} />
                  </Section>

                  {/* Conversion insight */}
                  {quotations.length > 0 && orders.length > 0 && (
                    <InsightCard
                      text={ar
                        ? `معدل التحويل: ${quotations.length} عرض سعر → ${orders.length} طلب (${pct(orders.length, quotations.length)}%)`
                        : `Conversion: ${quotations.length} quotes → ${orders.length} orders (${pct(orders.length, quotations.length)}%)`
                      }
                      type="info"
                    />
                  )}
                </div>
              )}

              {/* ═══ PRODUCTION ═══ */}
              {tab === "production" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MetricCard value={prodOrders.length} label={ar ? "أوامر التشغيل" : "Production Orders"} icon={Factory} color="text-orange-600" />
                    <MetricCard value={prodOrders.filter(p => ["cutting","edgebanding","drilling","assembly","finishing","quality_check","packing"].includes(p.status)).length} label={ar ? "قيد التنفيذ" : "In Progress"} icon={Activity} color="text-violet-600" />
                    <MetricCard value={prodOrders.filter(p => ["completed", "done"].includes(p.status)).length} label={ar ? "مكتمل" : "Completed"} icon={CheckCircle2} color="text-emerald-600" />
                    <MetricCard value={readyForProd.length} label={ar ? "بانتظار التشغيل" : "Awaiting Production"} icon={Clock} color="text-amber-600" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Section title={ar ? "حالة الإنتاج" : "Production Status"}>
                      <DonutChart
                        segments={prodByStatus.map(([status, count]) => ({
                          label: status.replace("_", " "),
                          value: count,
                          color: statusColors[status] || "#94a3b8",
                        }))}
                        label={ar ? "أوامر التشغيل" : "Production Orders"}
                      />
                    </Section>

                    <Section title={ar ? "كفاءة الإنتاج" : "Production Efficiency"}>
                      <div className="flex justify-center gap-6 py-4">
                        <ProgressRing
                          value={prodOrders.filter(p => ["completed", "done"].includes(p.status)).length}
                          max={prodOrders.length}
                          label={ar ? "نسبة الإكمال" : "Completion"}
                          color="hsl(142, 71%, 45%)"
                        />
                        <ProgressRing
                          value={prodOrders.filter(p => ["cutting","edgebanding","drilling","assembly","finishing","quality_check","packing"].includes(p.status)).length}
                          max={prodOrders.length}
                          label={ar ? "قيد التنفيذ" : "In Progress"}
                          color="hsl(250, 60%, 55%)"
                        />
                      </div>
                    </Section>
                  </div>

                  {prodOrders.length === 0 && (
                    <div className="py-10 text-center text-[12px] text-muted-foreground/50 border border-dashed border-border/40 rounded-xl">
                      {ar ? "مفيش أوامر تشغيل — أنشئ طلب وابدأ الإنتاج" : "No production orders — create an order and start production"}
                    </div>
                  )}
                </div>
              )}

              {/* ═══ INVENTORY ═══ */}
              {tab === "inventory" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MetricCard value={inventory.length} label={ar ? "أصناف المخزن" : "Stock Items"} icon={Boxes} color="text-primary" />
                    <MetricCard value={lowStockItems.length} label={ar ? "تحت الحد" : "Low Stock"} icon={AlertTriangle} color={lowStockItems.length > 0 ? "text-amber-600" : "text-emerald-600"} />
                    <MetricCard value={products.length} label={ar ? "المنتجات" : "Products"} icon={Package} color="text-violet-600" />
                    <MetricCard value={vendors.length} label={ar ? "الموردين" : "Vendors"} icon={Users} color="text-cyan-600" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Section title={ar ? "خامات تحتاج شراء" : "Items Needing Reorder"}
                      action={lowStockItems.length > 0 ? <button onClick={() => exportCSV("low-stock.csv", ["Item", "Current", "Reorder Level"], lowStockItems.map(i => [(i.name_en || ""), ((i.metadata as any)?.current_qty || 0), ((i.metadata as any)?.reorder_level || 0)]))} className="text-[9px] text-muted-foreground hover:text-foreground"><Download size={10} /></button> : undefined}
                    >
                      {lowStockItems.length === 0
                        ? <p className="text-[11px] text-muted-foreground/50 text-center py-4">{ar ? "الكل فوق الحد ✓" : "All items above reorder level ✓"}</p>
                        : <div className="space-y-2">{lowStockItems.slice(0, 10).map(item => {
                            const m = (item.metadata ?? {}) as any;
                            return (
                              <div key={item.id} className="flex items-center justify-between text-[11px]">
                                <span className="truncate max-w-[150px]">{ar ? (item.name_ar || item.name_en) : item.name_en}</span>
                                <span className="text-rose-500 font-medium">{m.current_qty || 0} / {m.reorder_level || "?"}</span>
                              </div>
                            );
                          })}</div>
                      }
                    </Section>

                    <Section title={ar ? "توزيع المخزن" : "Stock Distribution"}>
                      <DonutChart
                        segments={[
                          { label: ar ? "فوق الحد" : "Adequate", value: inventory.length - lowStockItems.length, color: "#22c55e" },
                          { label: ar ? "تحت الحد" : "Low", value: lowStockItems.length, color: "#ef4444" },
                        ]}
                        size={100}
                      />
                    </Section>
                  </div>

                  {inventory.length === 0 && (
                    <div className="py-10 text-center text-[12px] text-muted-foreground/50 border border-dashed border-border/40 rounded-xl">
                      {ar ? "أضف خامات في المخزن لتتبع الكميات" : "Add inventory items to track quantities"}
                    </div>
                  )}
                </div>
              )}

              {/* ═══ PURCHASING ═══ */}
              {tab === "purchasing" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MetricCard value={purchaseOrders.length} label={ar ? "أوامر الشراء" : "Purchase Orders"} icon={ShoppingCart} color="text-primary" />
                    <MetricCard value={fmt(totalPurchaseValue)} label={ar ? `قيمة المشتريات (${currency})` : `Purchase Value (${currency})`} icon={DollarSign} color="text-orange-600" />
                    <MetricCard value={vendors.length} label={ar ? "الموردين" : "Vendors"} icon={Users} color="text-violet-600" />
                    <MetricCard value={lowStockItems.length} label={ar ? "خامات ناقصة" : "Needs Reorder"} icon={AlertTriangle} color={lowStockItems.length > 0 ? "text-amber-600" : "text-emerald-600"} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Section title={ar ? "حالة أوامر الشراء" : "PO by Status"}>
                      {poByStatus.length === 0
                        ? <p className="text-[11px] text-muted-foreground/50 text-center py-4">{ar ? "مفيش أوامر شراء" : "No purchase orders"}</p>
                        : <div className="space-y-2">{poByStatus.map(([status, count]) => (
                            <ProgressBar key={status} value={count} max={purchaseOrders.length} label={status.replace("_", " ")} color={statusColors[status] ? `bg-[${statusColors[status]}]` : "bg-primary"} />
                          ))}</div>
                      }
                    </Section>

                    <Section title={ar ? "ملخص المشتريات" : "Purchasing Summary"}>
                      <div className="flex justify-center py-4">
                        <DonutChart
                          segments={poByStatus.map(([status, count]) => ({
                            label: status.replace("_", " "),
                            value: count,
                            color: statusColors[status] || "#94a3b8",
                          }))}
                          size={100}
                        />
                      </div>
                    </Section>
                  </div>
                </div>
              )}

              {/* ═══ FINANCE ═══ */}
              {tab === "finance" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MetricCard value={fmt(totalRevenue)} label={ar ? "الإيراد" : "Revenue"} icon={DollarSign} color="text-foreground" />
                    <MetricCard value={fmt(totalPaid)} label={ar ? "المحصّل" : "Collected"} icon={CheckCircle2} color="text-emerald-600" />
                    <MetricCard value={fmt(unpaid)} label={ar ? "المتبقي" : "Outstanding"} icon={AlertTriangle} color={unpaid > 0 ? "text-rose-500" : "text-emerald-600"} />
                    <MetricCard value={totalRevenue > 0 ? `${pct(totalPaid, totalRevenue)}%` : "0%"} label={ar ? "نسبة التحصيل" : "Collection Rate"} icon={TrendingUp} color="text-primary" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Section title={ar ? "التدفق النقدي" : "Cash Flow"}>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="text-muted-foreground">{ar ? "الإيراد" : "Revenue"}</span>
                          <span className="font-semibold text-emerald-600">+{fmt(totalRevenue)} {currency}</span>
                        </div>
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="text-muted-foreground">{ar ? "المشتريات" : "Purchases"}</span>
                          <span className="font-semibold text-rose-500">-{fmt(totalPurchaseValue)} {currency}</span>
                        </div>
                        <div className="h-px bg-border/60 my-1" />
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="font-medium">{ar ? "الصافي" : "Net"}</span>
                          <span className={`font-bold ${totalRevenue - totalPurchaseValue >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                            {fmt(totalRevenue - totalPurchaseValue)} {currency}
                          </span>
                        </div>
                      </div>
                    </Section>

                    <Section title={ar ? "نسبة التحصيل" : "Collection Progress"}>
                      <div className="flex justify-center py-4">
                        <ProgressRing value={totalPaid} max={totalRevenue} label={ar ? "محصّل" : "Collected"} color="hsl(142, 71%, 45%)" size={100} />
                      </div>
                      <div className="h-3 bg-muted/50 rounded-full overflow-hidden mt-2">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct(totalPaid, totalRevenue)}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
                        <span>{ar ? "مدفوع" : "Paid"}: {fmt(totalPaid)}</span>
                        <span>{ar ? "متبقي" : "Remaining"}: {fmt(unpaid)}</span>
                      </div>
                    </Section>
                  </div>

                  {/* Gross margin insight */}
                  {totalRevenue > 0 && totalPurchaseValue > 0 && (
                    <InsightCard
                      text={ar
                        ? `هامش الربح الإجمالي: ${pct(totalRevenue - totalPurchaseValue, totalRevenue)}% (${fmt(totalRevenue - totalPurchaseValue)} ${currency})`
                        : `Gross margin: ${pct(totalRevenue - totalPurchaseValue, totalRevenue)}% (${fmt(totalRevenue - totalPurchaseValue)} ${currency})`
                      }
                      type={totalRevenue - totalPurchaseValue > 0 ? "success" : "warning"}
                    />
                  )}
                </div>
              )}

              {/* ═══ CUSTOMER ═══ */}
              {tab === "customer" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MetricCard value={customers.length} label={ar ? "إجمالي العملاء" : "Total Customers"} icon={Users} color="text-primary" />
                    <MetricCard value={topCustomers.length > 0 ? topCustomers.filter(c => c.count > 1).length : 0} label={ar ? "عملاء متكررين" : "Repeat Customers"} icon={Target} color="text-violet-600" />
                    <MetricCard value={orders.length > 0 && customers.length > 0 ? (orders.length / customers.length).toFixed(1) : "0"} label={ar ? "طلبات / عميل" : "Orders / Customer"} icon={Package} color="text-cyan-600" />
                    <MetricCard value={totalRevenue > 0 && customers.length > 0 ? fmt(Math.round(totalRevenue / customers.length)) : "0"} label={ar ? `متوسط القيمة (${currency})` : `Avg Value (${currency})`} icon={DollarSign} color="text-amber-600" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Section title={ar ? "أفضل العملاء بالقيمة" : "Top Customers by Revenue"}
                      action={<button onClick={() => exportCSV("top-customers.csv", ["Customer", "Revenue", "Orders"], topCustomers.map(c => [c.name, c.total, c.count]))} className="text-[9px] text-muted-foreground hover:text-foreground"><Download size={10} /></button>}
                    >
                      <HBarChart items={topCustomers.map(c => ({ label: c.name, value: c.total }))} currency={currency} />
                    </Section>

                    <Section title={ar ? "أفضل العملاء بعدد الطلبات" : "Top Customers by Orders"}>
                      <HBarChart items={topCustomers.sort((a, b) => b.count - a.count).map(c => ({ label: c.name, value: c.count }))} color="bg-violet-500" />
                    </Section>
                  </div>

                  {customers.length === 0 && (
                    <div className="py-10 text-center text-[12px] text-muted-foreground/50 border border-dashed border-border/40 rounded-xl">
                      {ar ? "أضف عملاء لتحليل الأداء" : "Add customers to analyze performance"}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
