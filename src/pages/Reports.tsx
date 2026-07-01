/**
 * Reports & Analytics Foundation + Report Builder
 *
 * Executive-grade reporting hub. All data from live Supabase.
 * 7 report sections + Report Builder + Filters + Saved Views
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { isDemoMode } from "../lib/supabase";
import { getDataSource } from "../lib/data-source";
import { exportCSV } from "../lib/csv-export";
import type { Database } from "../lib/database.types";
import {
  BarChart3, TrendingUp, DollarSign, FileText, Briefcase, Users,
  ShoppingCart, Package, AlertTriangle, CheckCircle2, Clock, Loader2,
  Download, ChevronRight, Building2, Receipt, Shield, Zap,
  ArrowUpRight, ArrowDownRight, Target, Layers,
  Filter, X, Save, Plus, Trash2, ChevronDown, Search, PieChart,
} from "lucide-react";

type Tables = Database["public"]["Tables"];
type Deal = Tables["deals"]["Row"];
type Invoice = Tables["invoices"]["Row"];
type Expense = Tables["expenses"]["Row"];
type WorkItem = Tables["work_items"]["Row"];
type Person = Tables["people"]["Row"];
type Org = Tables["organizations"]["Row"];
type Resource = Tables["resources"]["Row"];

type ReportTab = "executive" | "sales" | "finance" | "operations" | "hr" | "purchasing" | "inventory" | "builder";

// ─── Helpers ─────────────────────────────────────────────

function fmtC(v: number, currency: string, ar: boolean): string {
  return new Intl.NumberFormat(ar ? "ar-SA" : "en-SA", { style: "currency", currency, maximumFractionDigits: 0 }).format(v);
}

function pct(num: number, den: number): string {
  if (den === 0) return "0%";
  return Math.round((num / den) * 100) + "%";
}

function isOverdue(w: WorkItem): boolean {
  return !!w.due_date && !["done", "cancelled"].includes(w.status) && new Date(w.due_date) < new Date(new Date().toDateString());
}

function getHR(p: Person): Record<string, unknown> {
  return (p.metadata ?? {}) as Record<string, unknown>;
}

function getPM(w: WorkItem): Record<string, unknown> {
  return (w.metadata ?? {}) as Record<string, unknown>;
}

// ─── Shared components ───────────────────────────────────

const labelCls = "text-[11px] text-muted-foreground font-medium mb-1 block";
const inputCls = "w-full h-9 px-3 rounded-xl border border-border/60 bg-background text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/20";
const selectCls = inputCls + " appearance-none cursor-pointer";

function KPI({ icon: Icon, value, label, color, sub }: { icon: React.ElementType; value: string | number; label: string; color: string; sub?: string }) {
  return (
    <div className="bg-background border border-border/40 rounded-xl px-4 py-4">
      <Icon size={14} strokeWidth={1.75} className={color + " mb-2"} />
      <p className="text-[20px] font-medium text-foreground leading-none tabular-nums mb-1" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.02em" }}>{value}</p>
      <p className="text-[10.5px] text-muted-foreground">{label}</p>
      {sub && <p className="text-[10px] text-muted-foreground/50 mt-0.5">{sub}</p>}
    </div>
  );
}

function SectionTitle({ en, ar, isAr }: { en: string; ar: string; isAr: boolean }) {
  return (
    <div className="flex items-center gap-3 mb-4 mt-8 first:mt-0">
      <h3 className="text-[11px] font-semibold text-muted-foreground tracking-[0.08em] uppercase shrink-0">{isAr ? ar : en}</h3>
      <div className="flex-1 h-px bg-border/40" />
    </div>
  );
}

function BreakdownTable({ rows, ar }: { rows: { label: string; value: string | number; sub?: string; color?: string }[]; ar: boolean }) {
  if (rows.length === 0) return <p className="text-[12px] text-muted-foreground/40 py-4 text-center">{ar ? "لا توجد بيانات" : "No data"}</p>;
  return (
    <div className="border border-border/40 rounded-xl overflow-hidden divide-y divide-border/30">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center justify-between px-4 py-3 bg-background hover:bg-muted/10 transition-colors">
          <div className="flex items-center gap-2 min-w-0">
            {r.color && <div className={`w-2 h-2 rounded-full shrink-0 ${r.color}`} />}
            <span className="text-[12.5px] text-foreground truncate">{r.label}</span>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[13px] font-medium tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>{r.value}</span>
            {r.sub && <span className="text-[10px] text-muted-foreground ml-1.5">{r.sub}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function AttentionItem({ icon: Icon, text, severity }: { icon: React.ElementType; text: string; severity: "red" | "amber" | "blue" }) {
  const cls = severity === "red" ? "border-rose-200/50 bg-rose-50/30 text-rose-600" : severity === "amber" ? "border-amber-200/50 bg-amber-50/30 text-amber-600" : "border-blue-200/50 bg-blue-50/30 text-blue-600";
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${cls}`}>
      <Icon size={14} strokeWidth={1.75} className="shrink-0" />
      <span className="text-[12.5px] text-foreground">{text}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// REPORT BUILDER
// ═══════════════════════════════════════════════════════════

interface ReportConfig {
  name: string;
  dataSource: string;
  dateRange: string;
  groupBy: string;
  metric: string;
  chartType: string;
  filters: ReportFilter[];
}

interface ReportFilter {
  field: string;
  operator: string;
  value: string;
}

const DATA_SOURCES = [
  { id: "orders", en: "Sales Orders", ar: "طلبات العملاء" },
  { id: "quotations", en: "Quotations", ar: "عروض الأسعار" },
  { id: "production", en: "Production Orders", ar: "أوامر التشغيل" },
  { id: "inventory", en: "Inventory", ar: "المخزن" },
  { id: "purchasing", en: "Purchase Orders", ar: "أوامر الشراء" },
  { id: "customers", en: "Customers", ar: "العملاء" },
  { id: "products", en: "Products", ar: "المنتجات" },
  { id: "invoices", en: "Invoices", ar: "الفواتير" },
  { id: "expenses", en: "Expenses", ar: "المصاريف" },
];

const DATE_RANGES = [
  { id: "all", en: "All Time", ar: "كل الأوقات" },
  { id: "today", en: "Today", ar: "اليوم" },
  { id: "7d", en: "Last 7 Days", ar: "آخر ٧ أيام" },
  { id: "30d", en: "Last 30 Days", ar: "آخر ٣٠ يوم" },
  { id: "90d", en: "Last 90 Days", ar: "آخر ٩٠ يوم" },
  { id: "year", en: "This Year", ar: "هذه السنة" },
];

const GROUP_BY_OPTIONS = [
  { id: "none", en: "None", ar: "بدون" },
  { id: "status", en: "Status", ar: "الحالة" },
  { id: "priority", en: "Priority", ar: "الأولوية" },
  { id: "department", en: "Department", ar: "القسم" },
  { id: "customer", en: "Customer", ar: "العميل" },
  { id: "product", en: "Product", ar: "المنتج" },
  { id: "stage", en: "Stage", ar: "المرحلة" },
  { id: "type", en: "Type", ar: "النوع" },
];

const METRICS = [
  { id: "count", en: "Count", ar: "العدد" },
  { id: "total_amount", en: "Total Amount", ar: "المبلغ الإجمالي" },
  { id: "avg_amount", en: "Average Amount", ar: "المتوسط" },
];

const CHART_TYPES = [
  { id: "table", en: "Table", ar: "جدول" },
  { id: "bar", en: "Bar Chart", ar: "مخطط أعمدة" },
  { id: "donut", en: "Donut Chart", ar: "مخطط دائري" },
];

const FILTER_FIELDS = [
  { id: "status", en: "Status", ar: "الحالة" },
  { id: "priority", en: "Priority", ar: "الأولوية" },
  { id: "customer", en: "Customer", ar: "العميل" },
  { id: "product", en: "Product", ar: "المنتج" },
  { id: "department", en: "Department", ar: "القسم" },
  { id: "stage", en: "Stage", ar: "المرحلة" },
  { id: "supplier", en: "Supplier", ar: "المورد" },
  { id: "user", en: "User", ar: "المستخدم" },
  { id: "material", en: "Material", ar: "الخامة" },
];

const FILTER_OPERATORS = [
  { id: "eq", en: "equals", ar: "يساوي" },
  { id: "neq", en: "not equals", ar: "لا يساوي" },
  { id: "contains", en: "contains", ar: "يحتوي" },
];

interface SavedReport { id: string; name: string; config: ReportConfig; createdAt: string; }

function ReportBuilder({ ar, workItems, resources, orgs, currency }: {
  ar: boolean;
  workItems: WorkItem[];
  resources: Resource[];
  orgs: Org[];
  currency: string;
}) {
  const [config, setConfig] = useState<ReportConfig>({
    name: "", dataSource: "orders", dateRange: "all", groupBy: "status", metric: "count", chartType: "table", filters: [],
  });
  const [savedReports, setSavedReports] = useState<SavedReport[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("thoth_saved_reports") || "[]");
    } catch { return []; }
  });
  const [activeReport, setActiveReport] = useState<string | null>(null);

  function saveReport() {
    if (!config.name) return;
    const report: SavedReport = { id: crypto.randomUUID(), name: config.name, config: { ...config }, createdAt: new Date().toISOString() };
    const next = [...savedReports, report];
    setSavedReports(next);
    localStorage.setItem("thoth_saved_reports", JSON.stringify(next));
    setActiveReport(report.id);
  }

  function deleteReport(id: string) {
    const next = savedReports.filter(r => r.id !== id);
    setSavedReports(next);
    localStorage.setItem("thoth_saved_reports", JSON.stringify(next));
    if (activeReport === id) setActiveReport(null);
  }

  function loadReport(report: SavedReport) {
    setConfig(report.config);
    setActiveReport(report.id);
  }

  function addFilter() {
    setConfig(p => ({ ...p, filters: [...p.filters, { field: "status", operator: "eq", value: "" }] }));
  }

  function removeFilter(idx: number) {
    setConfig(p => ({ ...p, filters: p.filters.filter((_, i) => i !== idx) }));
  }

  function updateFilter(idx: number, key: keyof ReportFilter, val: string) {
    setConfig(p => ({ ...p, filters: p.filters.map((f, i) => i === idx ? { ...f, [key]: val } : f) }));
  }

  // Build report data
  const reportData = useMemo(() => {
    let data: any[] = [];

    // Select data source
    switch (config.dataSource) {
      case "orders": data = workItems.filter(w => w.type === "sales_order"); break;
      case "quotations": data = workItems.filter(w => w.type === "quotation"); break;
      case "production": data = workItems.filter(w => w.type === "production_order"); break;
      case "purchasing": data = workItems.filter(w => w.type === "purchase_request" || w.type === "purchase_order"); break;
      case "inventory": data = resources.filter(r => r.type === "inventory" || r.type === "raw_material"); break;
      case "customers": data = orgs.filter(o => !(o.tags ?? []).includes("vendor")); break;
      case "products": data = resources.filter(r => r.type === "product"); break;
      default: data = workItems; break;
    }

    // Date filter
    if (config.dateRange !== "all") {
      const now = new Date();
      let cutoff = new Date();
      switch (config.dateRange) {
        case "today": cutoff.setHours(0, 0, 0, 0); break;
        case "7d": cutoff.setDate(now.getDate() - 7); break;
        case "30d": cutoff.setDate(now.getDate() - 30); break;
        case "90d": cutoff.setDate(now.getDate() - 90); break;
        case "year": cutoff = new Date(now.getFullYear(), 0, 1); break;
      }
      data = data.filter(d => {
        const created = d.created_at ? new Date(d.created_at) : null;
        return created && created >= cutoff;
      });
    }

    // Custom filters
    config.filters.forEach(f => {
      if (!f.value) return;
      data = data.filter(d => {
        const fieldVal = String(d[f.field] || (d.metadata as any)?.[f.field] || "").toLowerCase();
        const filterVal = f.value.toLowerCase();
        if (f.operator === "eq") return fieldVal === filterVal;
        if (f.operator === "neq") return fieldVal !== filterVal;
        if (f.operator === "contains") return fieldVal.includes(filterVal);
        return true;
      });
    });

    // Group by
    if (config.groupBy === "none") {
      return [{ label: ar ? "الكل" : "All", count: data.length, total: data.reduce((s: number, d: any) => s + ((d.metadata as any)?.total_amount || d.total_amount || Number(d.amount || d.value || 0)), 0) }];
    }

    const groups: Record<string, { count: number; total: number }> = {};
    data.forEach(d => {
      const key = String(d[config.groupBy] || (d.metadata as any)?.[config.groupBy] || "Other");
      if (!groups[key]) groups[key] = { count: 0, total: 0 };
      groups[key].count++;
      groups[key].total += (d.metadata as any)?.total_amount || d.total_amount || Number(d.amount || d.value || 0);
    });

    return Object.entries(groups)
      .map(([label, g]) => ({ label, count: g.count, total: g.total }))
      .sort((a, b) => b.count - a.count);
  }, [config, workItems, resources, orgs, ar]);

  const metricValue = (row: { count: number; total: number }) => {
    if (config.metric === "count") return row.count;
    if (config.metric === "total_amount") return row.total;
    if (config.metric === "avg_amount") return row.count > 0 ? Math.round(row.total / row.count) : 0;
    return row.count;
  };

  const statusColors: Record<string, string> = {
    draft: "#94a3b8", pending: "#f59e0b", approved: "#3b82f6", in_progress: "#8b5cf6",
    done: "#22c55e", completed: "#22c55e", cancelled: "#ef4444", blocked: "#ef4444",
  };

  return (
    <div className="space-y-6">
      {/* Saved Reports */}
      {savedReports.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground tracking-[0.06em] uppercase mb-2">{ar ? "التقارير المحفوظة" : "Saved Reports"}</p>
          <div className="flex flex-wrap gap-2">
            {savedReports.map(r => (
              <div key={r.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-medium cursor-pointer transition-all ${activeReport === r.id ? "border-primary bg-primary/5 text-primary" : "border-border/40 text-muted-foreground hover:border-border/80"}`}>
                <button onClick={() => loadReport(r)}>{r.name}</button>
                <button onClick={() => deleteReport(r.id)} className="text-muted-foreground/40 hover:text-rose-500"><X size={10} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Configuration */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div>
          <label className={labelCls}>{ar ? "اسم التقرير" : "Report Name"}</label>
          <input value={config.name} onChange={e => setConfig(p => ({ ...p, name: e.target.value }))} className={inputCls} placeholder={ar ? "تقرير مخصص" : "Custom Report"} />
        </div>
        <div>
          <label className={labelCls}>{ar ? "مصدر البيانات" : "Data Source"}</label>
          <select value={config.dataSource} onChange={e => setConfig(p => ({ ...p, dataSource: e.target.value }))} className={selectCls}>
            {DATA_SOURCES.map(ds => <option key={ds.id} value={ds.id}>{ar ? ds.ar : ds.en}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>{ar ? "الفترة" : "Date Range"}</label>
          <select value={config.dateRange} onChange={e => setConfig(p => ({ ...p, dateRange: e.target.value }))} className={selectCls}>
            {DATE_RANGES.map(dr => <option key={dr.id} value={dr.id}>{ar ? dr.ar : dr.en}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>{ar ? "تجميع حسب" : "Group By"}</label>
          <select value={config.groupBy} onChange={e => setConfig(p => ({ ...p, groupBy: e.target.value }))} className={selectCls}>
            {GROUP_BY_OPTIONS.map(g => <option key={g.id} value={g.id}>{ar ? g.ar : g.en}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>{ar ? "المقياس" : "Metric"}</label>
          <select value={config.metric} onChange={e => setConfig(p => ({ ...p, metric: e.target.value }))} className={selectCls}>
            {METRICS.map(m => <option key={m.id} value={m.id}>{ar ? m.ar : m.en}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>{ar ? "نوع الرسم" : "Chart Type"}</label>
          <select value={config.chartType} onChange={e => setConfig(p => ({ ...p, chartType: e.target.value }))} className={selectCls}>
            {CHART_TYPES.map(ct => <option key={ct.id} value={ct.id}>{ar ? ct.ar : ct.en}</option>)}
          </select>
        </div>
      </div>

      {/* Filters */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-semibold text-muted-foreground tracking-[0.06em] uppercase flex items-center gap-1.5">
            <Filter size={10} /> {ar ? "الفلاتر" : "Filters"} {config.filters.length > 0 && <span className="text-primary">({config.filters.length})</span>}
          </p>
          <button onClick={addFilter} className="text-[10px] text-primary hover:underline flex items-center gap-1"><Plus size={9} /> {ar ? "إضافة فلتر" : "Add Filter"}</button>
        </div>
        {config.filters.length > 0 && (
          <div className="space-y-2">
            {config.filters.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <select value={f.field} onChange={e => updateFilter(i, "field", e.target.value)} className={selectCls + " max-w-[140px]"}>
                  {FILTER_FIELDS.map(ff => <option key={ff.id} value={ff.id}>{ar ? ff.ar : ff.en}</option>)}
                </select>
                <select value={f.operator} onChange={e => updateFilter(i, "operator", e.target.value)} className={selectCls + " max-w-[120px]"}>
                  {FILTER_OPERATORS.map(op => <option key={op.id} value={op.id}>{ar ? op.ar : op.en}</option>)}
                </select>
                <input value={f.value} onChange={e => updateFilter(i, "value", e.target.value)} className={inputCls + " max-w-[180px]"} placeholder={ar ? "القيمة..." : "Value..."} />
                <button onClick={() => removeFilter(i)} className="text-muted-foreground/40 hover:text-rose-500 p-1"><X size={12} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button onClick={saveReport} disabled={!config.name} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40">
          <Save size={10} /> {ar ? "حفظ" : "Save"}
        </button>
        <button onClick={() => {
          const headers = ["Group", config.metric === "count" ? "Count" : "Amount"];
          const rows = reportData.map(r => [r.label, metricValue(r)]);
          const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
          const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a"); a.href = url; a.download = `report-${config.name || "custom"}.csv`; a.click();
          URL.revokeObjectURL(url);
        }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border border-border/60 text-muted-foreground hover:text-foreground">
          <Download size={10} /> CSV
        </button>
      </div>

      {/* Results */}
      <div className="border border-border/40 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground">{ar ? "النتائج" : "Results"}</span>
          <span className="text-[10px] text-muted-foreground">{reportData.length} {ar ? "صف" : "rows"} · {reportData.reduce((s, r) => s + r.count, 0)} {ar ? "سجل" : "records"}</span>
        </div>

        {reportData.length === 0 ? (
          <div className="py-8 text-center text-[12px] text-muted-foreground/50">{ar ? "لا توجد نتائج" : "No results"}</div>
        ) : config.chartType === "table" ? (
          <div className="divide-y divide-border/25">
            {reportData.map((row, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-muted/10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: statusColors[row.label] || `hsl(${(i * 47) % 360}, 60%, 55%)` }} />
                  <span className="text-[12px]">{row.label}</span>
                </div>
                <span className="text-[13px] font-medium tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>
                  {config.metric === "count" ? row.count : fmtC(metricValue(row), currency, ar)}
                </span>
              </div>
            ))}
          </div>
        ) : config.chartType === "bar" ? (
          <div className="p-4 space-y-2">
            {reportData.map((row, i) => {
              const max = Math.max(...reportData.map(r => metricValue(r)), 1);
              const val = metricValue(row);
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[10.5px] text-muted-foreground w-[100px] truncate">{row.label}</span>
                  <div className="flex-1 h-3 bg-muted/40 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: statusColors[row.label] || `hsl(${(i * 47) % 360}, 60%, 55%)` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(3, (val / max) * 100)}%` }}
                      transition={{ duration: 0.4, delay: i * 0.05 }}
                    />
                  </div>
                  <span className="text-[10.5px] font-medium tabular-nums w-14 text-right">
                    {config.metric === "count" ? val : fmtC(val, currency, ar)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : config.chartType === "donut" ? (
          <div className="p-6 flex flex-col items-center">
            {(() => {
              const total = reportData.reduce((s, r) => s + metricValue(r), 0);
              if (total === 0) return <p className="text-[11px] text-muted-foreground/50">{ar ? "مفيش بيانات" : "No data"}</p>;
              let cum = 0;
              const parts = reportData.map((row, i) => {
                const start = (cum / total) * 360;
                cum += metricValue(row);
                const end = (cum / total) * 360;
                return `${statusColors[row.label] || `hsl(${(i * 47) % 360}, 60%, 55%)`} ${start}deg ${end}deg`;
              });
              return (
                <>
                  <div className="rounded-full relative" style={{ width: 140, height: 140, background: `conic-gradient(${parts.join(", ")})` }}>
                    <div className="absolute inset-[28%] rounded-full bg-background flex items-center justify-center">
                      <span className="text-[15px] font-bold" style={{ fontFamily: "var(--app-font-serif)" }}>
                        {config.metric === "count" ? total : fmtC(total, currency, ar)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-3">
                    {reportData.filter(r => metricValue(r) > 0).map((row, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ background: statusColors[row.label] || `hsl(${(i * 47) % 360}, 60%, 55%)` }} />
                        <span className="text-[9px] text-muted-foreground">{row.label}: {metricValue(row)}</span>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════

export default function Reports() {
  const { lang } = useLanguage();
  const { workspace } = useAuth();
  const ar = lang === "ar";
  const settings = workspace?.settings as Record<string, unknown> | undefined;
  const currency = (settings?.currency as string) || "SAR";
  const fmt = (v: number) => fmtC(v, currency, ar);

  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ReportTab>("executive");
  const [deals, setDeals] = useState<Deal[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);

  useEffect(() => {
    if (isDemoMode || !workspace?.id) { setLoading(false); return; }
    const ds = getDataSource();
    const w = workspace.id;
    Promise.all([
      ds.deals.list(w), ds.invoices.list(w), ds.expenses.list(w),
      ds.work_items.list(w), ds.people.list(w), ds.organizations.list(w), ds.resources.list(w),
    ]).then(([d, i, ex, wi, p, o, r]) => {
      setDeals(d as Deal[]); setInvoices(i as Invoice[]); setExpenses(ex as Expense[]);
      setWorkItems(wi as WorkItem[]); setPeople(p as Person[]); setOrgs(o as Org[]); setResources(r as Resource[]);
    }).finally(() => setLoading(false));
  }, [workspace?.id]);

  // ── Computed metrics ──────────────────────────────────

  const revenue = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.amount), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const profit = revenue - totalExpenses;
  const outstanding = invoices.filter((i) => ["sent", "overdue"].includes(i.status)).reduce((s, i) => s + Number(i.amount), 0);
  const overdueInv = invoices.filter((i) => i.status === "overdue");
  const paidInv = invoices.filter((i) => i.status === "paid");

  const activeDeals = deals.filter((d) => !["won", "lost"].includes(d.stage));
  const wonDeals = deals.filter((d) => d.stage === "won");
  const lostDeals = deals.filter((d) => d.stage === "lost");
  const pipeline = activeDeals.reduce((s, d) => s + Number(d.value) * (d.probability / 100), 0);

  const allWork = workItems.filter((w) => !["purchase_request", "purchase_order"].includes(w.type));
  const openWork = allWork.filter((w) => !["done", "cancelled"].includes(w.status));
  const overdueWork = allWork.filter(isOverdue);
  const doneWork = allWork.filter((w) => w.status === "done");

  const teamMembers = people.filter((p) => (p.tags ?? []).includes("team"));
  const activeEmployees = teamMembers.filter((p) => getHR(p).status !== "inactive");

  const vendors = orgs.filter((o) => (o.tags ?? []).includes("vendor"));
  const purchaseRequests = workItems.filter((w) => w.type === "purchase_request");
  const purchaseOrders = workItems.filter((w) => w.type === "purchase_order");
  const pendingPRs = purchaseRequests.filter((p) => p.status === "submitted");

  const lowStock = resources.filter((r) => {
    const m = (r.metadata ?? {}) as Record<string, unknown>;
    const qty = Number(m.quantity_on_hand ?? r.utilization ?? 0);
    const reorder = Number(m.reorder_level ?? 10);
    return qty > 0 && qty <= reorder;
  });

  const dealsByStage = useMemo(() => {
    const map: Record<string, { count: number; value: number }> = {};
    deals.forEach((d) => { if (!map[d.stage]) map[d.stage] = { count: 0, value: 0 }; map[d.stage].count++; map[d.stage].value += Number(d.value); });
    return Object.entries(map).sort((a, b) => b[1].value - a[1].value);
  }, [deals]);

  const workByStatus = useMemo(() => {
    const map: Record<string, number> = {};
    allWork.forEach((w) => { map[w.status] = (map[w.status] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [allWork]);

  const workByPriority = useMemo(() => {
    const map: Record<string, number> = {};
    openWork.forEach((w) => { map[w.priority] = (map[w.priority] || 0) + 1; });
    const order = ["critical", "urgent", "high", "medium", "low"];
    return Object.entries(map).sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
  }, [openWork]);

  const empByDept = useMemo(() => {
    const map: Record<string, number> = {};
    teamMembers.forEach((p) => { const dept = (getHR(p).department as string) || "Other"; map[dept] = (map[dept] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [teamMembers]);

  const topCustomers = useMemo(() => {
    const map: Record<string, number> = {};
    deals.forEach((d) => { const name = d.org_name_en || "Unknown"; map[name] = (map[name] || 0) + Number(d.value); });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [deals]);

  const topVendors = useMemo(() => {
    const map: Record<string, number> = {};
    purchaseOrders.forEach((po) => { const m = getPM(po); const name = (m.vendor_name as string) || "Unknown"; map[name] = (map[name] || 0) + Number(m.estimated_amount ?? 0); });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [purchaseOrders]);

  const attentionItems = useMemo(() => {
    const items: { icon: React.ElementType; text: string; severity: "red" | "amber" | "blue" }[] = [];
    if (overdueInv.length > 0) items.push({ icon: AlertTriangle, text: ar ? `${overdueInv.length} فاتورة متأخرة` : `${overdueInv.length} overdue invoices`, severity: "red" });
    if (overdueWork.length > 0) items.push({ icon: Clock, text: ar ? `${overdueWork.length} مهمة متأخرة` : `${overdueWork.length} overdue work items`, severity: "red" });
    if (pendingPRs.length > 0) items.push({ icon: ShoppingCart, text: ar ? `${pendingPRs.length} طلب شراء مستني موافقة` : `${pendingPRs.length} purchase requests pending approval`, severity: "amber" });
    if (lowStock.length > 0) items.push({ icon: Package, text: ar ? `${lowStock.length} صنف مخزون قليل` : `${lowStock.length} low stock items`, severity: "amber" });
    const blockedWork = allWork.filter((w) => w.status === "blocked");
    if (blockedWork.length > 0) items.push({ icon: Shield, text: ar ? `${blockedWork.length} مهمة متوقفة` : `${blockedWork.length} blocked work items`, severity: "amber" });
    return items;
  }, [overdueInv, overdueWork, pendingPRs, lowStock, allWork, ar]);

  const TABS: { id: ReportTab; en: string; ar: string; icon: React.ElementType }[] = [
    { id: "executive", en: "Executive", ar: "تنفيذي", icon: BarChart3 },
    { id: "sales", en: "Sales", ar: "المبيعات", icon: TrendingUp },
    { id: "finance", en: "Finance", ar: "الحسابات", icon: DollarSign },
    { id: "operations", en: "Operations", ar: "العمليات", icon: Briefcase },
    { id: "hr", en: "HR", ar: "الفريق", icon: Users },
    { id: "purchasing", en: "Purchasing", ar: "المشتريات", icon: ShoppingCart },
    { id: "inventory", en: "Inventory", ar: "المخزون", icon: Package },
    { id: "builder", en: "Report Builder", ar: "منشئ التقارير", icon: PieChart },
  ];

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 size={20} className="animate-spin text-muted-foreground/40" /></div>;

  const totalRecords = deals.length + invoices.length + expenses.length + workItems.length + people.length + orgs.length + resources.length;

  return (
    <div className="min-h-full">
      {/* ── Header ── */}
      <div className="border-b border-border/40 px-7 md:px-10 py-7" style={{ background: "linear-gradient(160deg, hsl(var(--muted)/0.3) 0%, hsl(var(--background)) 60%)" }}>
        <div className="max-w-[1100px]">
          <div className="flex items-center gap-2.5 mb-2">
            <BarChart3 size={14} className="text-primary" />
            <p className="text-[11px] text-muted-foreground/60 tracking-[0.08em] uppercase">{ar ? "التقارير والتحليلات" : "Reports & Analytics"}</p>
          </div>
          <h1 className="text-[26px] font-medium text-foreground leading-tight mb-1" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.025em" }}>
            {ar ? "التقارير" : "Reports"}
          </h1>
          <p className="text-[13px] text-muted-foreground">
            {totalRecords > 0
              ? (ar ? `تحليلات مبنية على ${totalRecords} سجل حقيقي` : `Analytics built from ${totalRecords} real records`)
              : (ar ? "ضيف بيانات عشان تشوف التقارير" : "Add data to see reports")}
          </p>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/40">
        <div className="px-7 md:px-10 flex items-center gap-0 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3.5 py-3 text-[12px] font-medium border-b-2 transition-all whitespace-nowrap ${tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <t.icon size={12} strokeWidth={1.75} />
              {ar ? t.ar : t.en}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-7 md:px-10 py-6 max-w-[1100px]">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

        {/* ═══ REPORT BUILDER ═══ */}
        {tab === "builder" && (
          <ReportBuilder ar={ar} workItems={workItems} resources={resources} orgs={orgs} currency={currency} />
        )}

        {/* ═══ EXECUTIVE ═══ */}
        {tab === "executive" && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
              <KPI icon={DollarSign} value={fmt(revenue)} label={ar ? "الإيرادات" : "Revenue"} color="text-emerald-600" />
              <KPI icon={Receipt} value={fmt(totalExpenses)} label={ar ? "المصاريف" : "Expenses"} color="text-rose-500" />
              <KPI icon={TrendingUp} value={fmt(profit)} label={ar ? "صافي الربح" : "Profit"} color={profit >= 0 ? "text-emerald-600" : "text-rose-500"} />
              <KPI icon={FileText} value={fmt(outstanding)} label={ar ? "مستحقات" : "Outstanding"} color="text-amber-600" sub={`${overdueInv.length} ${ar ? "متأخر" : "overdue"}`} />
              <KPI icon={TrendingUp} value={fmt(pipeline)} label={ar ? "الصفقات" : "Pipeline"} color="text-blue-600" sub={`${activeDeals.length} ${ar ? "نشط" : "active"}`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              <KPI icon={Briefcase} value={openWork.length} label={ar ? "شغل مفتوح" : "Open Work"} color="text-blue-600" />
              <KPI icon={AlertTriangle} value={overdueWork.length} label={ar ? "متأخر" : "Overdue"} color={overdueWork.length > 0 ? "text-rose-500" : "text-emerald-600"} />
              <KPI icon={Users} value={activeEmployees.length} label={ar ? "موظفين نشطين" : "Active Employees"} color="text-violet-600" />
              <KPI icon={ShoppingCart} value={pendingPRs.length} label={ar ? "مستني موافقة" : "Pending PRs"} color="text-amber-600" />
              <KPI icon={Package} value={resources.length} label={ar ? "الأصول" : "Assets"} color="text-orange-600" />
            </div>

            {attentionItems.length > 0 && (
              <>
                <SectionTitle en="Needs Attention" ar="محتاج متابعة" isAr={ar} />
                <div className="space-y-2 mb-6">
                  {attentionItems.map((item, i) => <AttentionItem key={i} {...item} />)}
                </div>
              </>
            )}

            {(wonDeals.length > 0 || topCustomers.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {topCustomers.length > 0 && (
                  <div>
                    <SectionTitle en="Top Customers" ar="أكبر العملاء" isAr={ar} />
                    <BreakdownTable ar={ar} rows={topCustomers.map(([name, val]) => ({ label: name, value: fmt(val), color: "bg-primary" }))} />
                  </div>
                )}
                {dealsByStage.length > 0 && (
                  <div>
                    <SectionTitle en="Deals by Stage" ar="الصفقات حسب المرحلة" isAr={ar} />
                    <BreakdownTable ar={ar} rows={dealsByStage.map(([stage, d]) => ({ label: stage.charAt(0).toUpperCase() + stage.slice(1), value: d.count, sub: fmt(d.value), color: stage === "won" ? "bg-emerald-500" : stage === "lost" ? "bg-rose-500" : "bg-blue-500" }))} />
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ═══ SALES ═══ */}
        {tab === "sales" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div />
              {deals.length > 0 && (
                <button onClick={() => exportCSV(deals, `thoth-sales-report-${new Date().toISOString().slice(0,10)}.csv`)}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border/60 text-[11.5px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                  <Download size={12} /> {ar ? "صدّر" : "Export"}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <KPI icon={TrendingUp} value={fmt(pipeline)} label={ar ? "قيمة الصفقات" : "Pipeline Value"} color="text-blue-600" />
              <KPI icon={CheckCircle2} value={wonDeals.length} label={ar ? "صفقات مكسوبة" : "Won Deals"} color="text-emerald-600" sub={fmt(wonDeals.reduce((s, d) => s + Number(d.value), 0))} />
              <KPI icon={ArrowDownRight} value={lostDeals.length} label={ar ? "صفقات خسرانة" : "Lost Deals"} color="text-rose-500" />
              <KPI icon={Target} value={pct(wonDeals.length, wonDeals.length + lostDeals.length)} label={ar ? "معدل التحويل" : "Conversion Rate"} color="text-primary" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <SectionTitle en="Deals by Stage" ar="حسب المرحلة" isAr={ar} />
                <BreakdownTable ar={ar} rows={dealsByStage.map(([stage, d]) => ({ label: stage.charAt(0).toUpperCase() + stage.slice(1), value: d.count, sub: fmt(d.value), color: stage === "won" ? "bg-emerald-500" : stage === "lost" ? "bg-rose-500" : "bg-blue-500" }))} />
              </div>
              <div>
                <SectionTitle en="Top Customers" ar="أكبر العملاء" isAr={ar} />
                <BreakdownTable ar={ar} rows={topCustomers.map(([name, val]) => ({ label: name, value: fmt(val), color: "bg-amber-500" }))} />
              </div>
            </div>
          </>
        )}

        {/* ═══ FINANCE ═══ */}
        {tab === "finance" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div />
              {invoices.length > 0 && (
                <button onClick={() => exportCSV(invoices, `thoth-finance-report-${new Date().toISOString().slice(0,10)}.csv`)}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border/60 text-[11.5px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                  <Download size={12} /> {ar ? "صدّر" : "Export"}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              <KPI icon={DollarSign} value={fmt(revenue)} label={ar ? "الإيرادات" : "Revenue"} color="text-emerald-600" />
              <KPI icon={Receipt} value={fmt(totalExpenses)} label={ar ? "المصاريف" : "Expenses"} color="text-rose-500" />
              <KPI icon={TrendingUp} value={fmt(profit)} label={ar ? "صافي الربح" : "Net Profit"} color={profit >= 0 ? "text-emerald-600" : "text-rose-500"} />
              <KPI icon={FileText} value={fmt(outstanding)} label={ar ? "مستحقات" : "Outstanding"} color="text-amber-600" />
              <KPI icon={CheckCircle2} value={paidInv.length} label={ar ? "مدفوعة" : "Paid"} color="text-emerald-600" />
              <KPI icon={AlertTriangle} value={overdueInv.length} label={ar ? "متأخرة" : "Overdue"} color={overdueInv.length > 0 ? "text-rose-500" : "text-emerald-600"} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <SectionTitle en="Invoices by Status" ar="الفواتير حسب الحالة" isAr={ar} />
                <BreakdownTable ar={ar} rows={(() => {
                  const map: Record<string, { count: number; value: number }> = {};
                  invoices.forEach((i) => { if (!map[i.status]) map[i.status] = { count: 0, value: 0 }; map[i.status].count++; map[i.status].value += Number(i.amount); });
                  const colors: Record<string, string> = { paid: "bg-emerald-500", sent: "bg-blue-500", overdue: "bg-rose-500", draft: "bg-slate-400", cancelled: "bg-muted-foreground" };
                  return Object.entries(map).sort((a, b) => b[1].value - a[1].value).map(([st, d]) => ({ label: st.charAt(0).toUpperCase() + st.slice(1), value: d.count, sub: fmt(d.value), color: colors[st] || "bg-muted-foreground" }));
                })()} />
              </div>
              <div>
                <SectionTitle en="Expenses by Category" ar="المصاريف حسب التصنيف" isAr={ar} />
                <BreakdownTable ar={ar} rows={(() => {
                  const map: Record<string, number> = {};
                  expenses.forEach((e) => { const cat = e.category || "Other"; map[cat] = (map[cat] || 0) + Number(e.amount); });
                  return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([cat, val]) => ({ label: cat, value: fmt(val), color: "bg-rose-400" }));
                })()} />
              </div>
            </div>
          </>
        )}

        {/* ═══ OPERATIONS ═══ */}
        {tab === "operations" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div />
              {allWork.length > 0 && (
                <button onClick={() => exportCSV(allWork, `thoth-operations-report-${new Date().toISOString().slice(0,10)}.csv`)}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border/60 text-[11.5px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                  <Download size={12} /> {ar ? "صدّر" : "Export"}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <KPI icon={Layers} value={openWork.length} label={ar ? "شغل مفتوح" : "Open Work"} color="text-blue-600" />
              <KPI icon={CheckCircle2} value={doneWork.length} label={ar ? "مكتمل" : "Completed"} color="text-emerald-600" />
              <KPI icon={AlertTriangle} value={overdueWork.length} label={ar ? "متأخر" : "Overdue"} color={overdueWork.length > 0 ? "text-rose-500" : "text-emerald-600"} />
              <KPI icon={Target} value={pct(doneWork.length, allWork.length)} label={ar ? "معدل الإنجاز" : "Completion Rate"} color="text-primary" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <SectionTitle en="Work by Status" ar="حسب الحالة" isAr={ar} />
                <BreakdownTable ar={ar} rows={workByStatus.map(([st, count]) => {
                  const colors: Record<string, string> = { done: "bg-emerald-500", in_progress: "bg-blue-500", review: "bg-violet-500", todo: "bg-slate-400", backlog: "bg-slate-300", blocked: "bg-rose-500", planned: "bg-indigo-400" };
                  return { label: st.replace("_", " "), value: count, color: colors[st] || "bg-muted-foreground" };
                })} />
              </div>
              <div>
                <SectionTitle en="Work by Priority" ar="حسب الأولوية" isAr={ar} />
                <BreakdownTable ar={ar} rows={workByPriority.map(([p, count]) => {
                  const colors: Record<string, string> = { critical: "bg-red-500", urgent: "bg-rose-500", high: "bg-orange-500", medium: "bg-amber-500", low: "bg-slate-400" };
                  return { label: p.charAt(0).toUpperCase() + p.slice(1), value: count, color: colors[p] || "bg-muted-foreground" };
                })} />
              </div>
            </div>
          </>
        )}

        {/* ═══ HR ═══ */}
        {tab === "hr" && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <KPI icon={Users} value={teamMembers.length} label={ar ? "إجمالي الفريق" : "Team Size"} color="text-violet-600" />
              <KPI icon={CheckCircle2} value={activeEmployees.length} label={ar ? "نشط" : "Active"} color="text-emerald-600" />
              <KPI icon={Building2} value={empByDept.length} label={ar ? "أقسام" : "Departments"} color="text-blue-600" />
              <KPI icon={Briefcase} value={openWork.length} label={ar ? "مهام مفتوحة" : "Open Tasks"} color="text-amber-600" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <SectionTitle en="Employees by Department" ar="الموظفين حسب القسم" isAr={ar} />
                <BreakdownTable ar={ar} rows={empByDept.map(([dept, count]) => ({ label: dept, value: count, color: "bg-violet-400" }))} />
              </div>
              <div>
                <SectionTitle en="Team Capacity" ar="قدرة الفريق" isAr={ar} />
                <BreakdownTable ar={ar} rows={[
                  { label: ar ? "مهام مفتوحة" : "Open tasks", value: openWork.length, color: "bg-blue-500" },
                  { label: ar ? "متأخرة" : "Overdue", value: overdueWork.length, color: "bg-rose-500" },
                  { label: ar ? "مكتملة" : "Completed", value: doneWork.length, color: "bg-emerald-500" },
                  { label: ar ? "متوسط لكل موظف" : "Avg per employee", value: activeEmployees.length > 0 ? Math.round(openWork.length / activeEmployees.length) : 0, color: "bg-amber-500" },
                ]} />
              </div>
            </div>
          </>
        )}

        {/* ═══ PURCHASING ═══ */}
        {tab === "purchasing" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div />
              {purchaseOrders.length > 0 && (
                <button onClick={() => { const rows = purchaseOrders.map((p) => { const m = getPM(p); return { po_number: m.po_number, title: p.title_en, vendor: m.vendor_name, amount: m.estimated_amount, status: p.status, created_at: p.created_at }; }); exportCSV(rows, `thoth-purchasing-report-${new Date().toISOString().slice(0,10)}.csv`); }}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border/60 text-[11.5px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                  <Download size={12} /> {ar ? "صدّر" : "Export"}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <KPI icon={Building2} value={vendors.length} label={ar ? "الموردين" : "Vendors"} color="text-violet-600" />
              <KPI icon={FileText} value={purchaseRequests.length} label={ar ? "طلبات شراء" : "Purchase Requests"} color="text-blue-600" />
              <KPI icon={Clock} value={pendingPRs.length} label={ar ? "مستني موافقة" : "Pending Approval"} color="text-amber-600" />
              <KPI icon={ShoppingCart} value={purchaseOrders.length} label={ar ? "أوامر شراء" : "Purchase Orders"} color="text-primary" />
            </div>
            {topVendors.length > 0 && (
              <>
                <SectionTitle en="Top Vendors by Spend" ar="أكبر الموردين" isAr={ar} />
                <BreakdownTable ar={ar} rows={topVendors.map(([name, val]) => ({ label: name, value: fmt(val), color: "bg-violet-400" }))} />
              </>
            )}
          </>
        )}

        {/* ═══ INVENTORY ═══ */}
        {tab === "inventory" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div />
              {resources.length > 0 && (
                <button onClick={() => exportCSV(resources, `thoth-inventory-report-${new Date().toISOString().slice(0,10)}.csv`)}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border/60 text-[11.5px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                  <Download size={12} /> {ar ? "صدّر" : "Export"}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <KPI icon={Package} value={resources.length} label={ar ? "إجمالي الأصول" : "Total Assets"} color="text-orange-600" />
              <KPI icon={AlertTriangle} value={lowStock.length} label={ar ? "مخزون قليل" : "Low Stock"} color={lowStock.length > 0 ? "text-amber-600" : "text-emerald-600"} />
              <KPI icon={Briefcase} value={resources.filter((r) => r.utilization > 0).length} label={ar ? "قيد الاستخدام" : "In Use"} color="text-blue-600" />
              <KPI icon={Target} value={resources.length > 0 ? Math.round(resources.reduce((s, r) => s + r.utilization, 0) / resources.length) + "%" : "0%"} label={ar ? "متوسط الاستخدام" : "Avg Utilization"} color="text-primary" />
            </div>
            {(() => {
              const byType: Record<string, number> = {};
              resources.forEach((r) => { byType[r.type] = (byType[r.type] || 0) + 1; });
              const rows = Object.entries(byType).sort((a, b) => b[1] - a[1]);
              return rows.length > 0 ? (
                <>
                  <SectionTitle en="Assets by Type" ar="الأصول حسب النوع" isAr={ar} />
                  <BreakdownTable ar={ar} rows={rows.map(([type, count]) => ({ label: type.charAt(0).toUpperCase() + type.slice(1), value: count, color: "bg-orange-400" }))} />
                </>
              ) : null;
            })()}
          </>
        )}

        {/* No data fallback */}
        {totalRecords === 0 && tab !== "builder" && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <BarChart3 size={24} className="text-muted-foreground/40" />
            </div>
            <div className="text-center max-w-[400px]">
              <p className="text-[15px] font-medium mb-1" style={{ fontFamily: "var(--app-font-serif)" }}>
                {ar ? "مفيش بيانات لسه" : "No data yet"}
              </p>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                {ar ? "ضيف بيانات في أي قسم عشان تشوف التقارير والتحليلات هنا." : "Add data to any module to see reports and analytics here."}
              </p>
            </div>
          </div>
        )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
