/**
 * HR Employment Law & Compliance — قانون العمل والامتثال
 *
 * Compliance tracking, safety incidents, regulatory items, and audits
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import {
  HR_COMPLIANCE,
  HR_SAFETY_INCIDENTS,
  HR_METRICS,
  type ComplianceItem,
  type SafetyIncident,
} from "../lib/hr-data-full";
import {
  ShieldCheck, AlertTriangle, FileText, Clock, X, Search,
  Filter, ChevronDown, Calendar, Eye, HardHat, Building2,
  Scale, BadgeCheck, ShieldAlert, ShieldOff, Landmark,
  Wrench, Ban, CheckCircle2, ArrowUpRight, BarChart3,
  Activity, Users, HeartPulse, Briefcase,
} from "lucide-react";

const serif: React.CSSProperties = { fontFamily: "var(--app-font-serif)" };

const cardV = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
} satisfies Variants;

const TYPE_META: Record<string, { en: string; ar: string; icon: typeof ShieldCheck; color: string; bg: string; border: string }> = {
  contract: { en: "Contract", ar: "عقد", icon: FileText, color: "text-blue-400", bg: "bg-blue-500/15", border: "border-blue-500/30" },
  document: { en: "Document", ar: "مستند", icon: FileText, color: "text-violet-400", bg: "bg-violet-500/15", border: "border-violet-500/30" },
  safety: { en: "Safety", ar: "سلامة", icon: HardHat, color: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/30" },
  insurance: { en: "Insurance", ar: "تأمين", icon: ShieldCheck, color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/30" },
  tax: { en: "Tax", ar: "ضرائب", icon: Landmark, color: "text-cyan-400", bg: "bg-cyan-500/15", border: "border-cyan-500/30" },
  inspection: { en: "Inspection", ar: "تفتيش", icon: Eye, color: "text-rose-400", bg: "bg-rose-500/15", border: "border-rose-500/30" },
};

const STATUS_META: Record<string, { en: string; ar: string; cls: string; dot: string }> = {
  compliant: { en: "Compliant", ar: "ممتثل", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-400" },
  expiring: { en: "Expiring", ar: "ينتهي قريباً", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30", dot: "bg-amber-400" },
  overdue: { en: "Overdue", ar: "متأخر", cls: "bg-red-500/15 text-red-400 border-red-500/30", dot: "bg-red-400" },
  non_compliant: { en: "Non-Compliant", ar: "غير ممتثل", cls: "bg-red-500/15 text-red-400 border-red-500/30", dot: "bg-red-400" },
  reported: { en: "Reported", ar: "تم الإبلاغ", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30", dot: "bg-blue-400" },
  investigating: { en: "Investigating", ar: "قيد التحقيق", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30", dot: "bg-amber-400" },
  resolved: { en: "Resolved", ar: "تم الحل", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-400" },
  closed: { en: "Closed", ar: "مغلق", cls: "bg-gray-500/15 text-gray-400 border-gray-500/30", dot: "bg-gray-400" },
};

const PRIORITY_META: Record<string, { en: string; ar: string; cls: string }> = {
  low: { en: "Low", ar: "منخفض", cls: "bg-gray-500/15 text-gray-400 border-gray-500/30" },
  medium: { en: "Medium", ar: "متوسط", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  high: { en: "High", ar: "عالي", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  critical: { en: "Critical", ar: "حرج", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
};

const SEVERITY_META: Record<string, { en: string; ar: string; cls: string }> = {
  minor: { en: "Minor", ar: "بسيط", cls: "bg-gray-500/15 text-gray-400 border-gray-500/30" },
  moderate: { en: "Moderate", ar: "متوسط", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  major: { en: "Major", ar: "كبير", cls: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  critical: { en: "Critical", ar: "حرج", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
};

const INCIDENT_TYPE_META: Record<string, { en: string; ar: string; icon: typeof Activity }> = {
  injury: { en: "Injury", ar: "إصابة", icon: HeartPulse },
  near_miss: { en: "Near Miss", ar: "شبه حادثة", icon: AlertTriangle },
  property_damage: { en: "Property Damage", ar: "أضرار مادية", icon: Wrench },
  environmental: { en: "Environmental", ar: "بيئي", icon: ShieldAlert },
};

const FILTER_TYPES = [
  { key: "all", en: "All Types", ar: "جميع الأنواع" },
  { key: "contract", en: "Contract", ar: "عقد" },
  { key: "document", en: "Document", ar: "مستند" },
  { key: "safety", en: "Safety", ar: "سلامة" },
  { key: "insurance", en: "Insurance", ar: "تأمين" },
  { key: "tax", en: "Tax", ar: "ضرائب" },
  { key: "inspection", en: "Inspection", ar: "تفتيش" },
];

const FILTER_STATUSES = [
  { key: "all", en: "All Statuses", ar: "جميع الحالات" },
  { key: "compliant", en: "Compliant", ar: "ممتثل" },
  { key: "expiring", en: "Expiring", ar: "ينتهي قريباً" },
  { key: "overdue", en: "Overdue", ar: "متأخر" },
  { key: "non_compliant", en: "Non-Compliant", ar: "غير ممتثل" },
];

function statusBadge(key: string, ar: boolean, size?: "sm" | "md") {
  const s = STATUS_META[key] || STATUS_META.compliant;
  const px = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs";
  return (
    <span className={`inline-flex items-center gap-1.5 ${px} rounded-full font-medium border ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {ar ? s.ar : s.en}
    </span>
  );
}

function priorityBadge(key: string, ar: boolean) {
  const p = PRIORITY_META[key] || PRIORITY_META.low;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${p.cls}`}>
      {ar ? p.ar : p.en}
    </span>
  );
}

function typeBadge(key: string, ar: boolean) {
  const t = TYPE_META[key] || TYPE_META.contract;
  const Icon = t.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${t.bg} ${t.border} ${t.color}`}>
      <Icon size={11} />
      {ar ? t.ar : t.en}
    </span>
  );
}

function severityBadge(key: string, ar: boolean) {
  const s = SEVERITY_META[key] || SEVERITY_META.minor;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${s.cls}`}>
      {ar ? s.ar : s.en}
    </span>
  );
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  const d = new Date(dateStr);
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function fmtDate(dateStr: string, ar: boolean): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(ar ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric" });
}

function daysSinceLastIncident(incidents: SafetyIncident[]): number {
  if (incidents.length === 0) return 999;
  const dates = incidents.map((i) => new Date(i.date).getTime());
  const latest = Math.max(...dates);
  return Math.floor((Date.now() - latest) / (1000 * 60 * 60 * 24));
}

export default function HRCompliance() {
  const { lang } = useLanguage();
  const ar = lang === "ar";

  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState<ComplianceItem | null>(null);
  const [tab, setTab] = useState<"compliance" | "incidents" | "chart">("compliance");

  const filteredItems = useMemo(() => {
    return HR_COMPLIANCE.filter((item) => {
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      return true;
    });
  }, [typeFilter, statusFilter]);

  const expiringCount = HR_COMPLIANCE.filter((i) => i.status === "expiring").length;
  const overdueCount = HR_COMPLIANCE.filter((i) => i.status === "overdue").length;
  const daysSinceLast = daysSinceLastIncident(HR_SAFETY_INCIDENTS);

  const complianceByType = useMemo(() => {
    const map: Record<string, { total: number; compliant: number; expiring: number; overdue: number; non_compliant: number }> = {};
    HR_COMPLIANCE.forEach((item) => {
      if (!map[item.type]) map[item.type] = { total: 0, compliant: 0, expiring: 0, overdue: 0, non_compliant: 0 };
      map[item.type].total++;
      if (item.status === "compliant") map[item.type].compliant++;
      else if (item.status === "expiring") map[item.type].expiring++;
      else if (item.status === "overdue") map[item.type].overdue++;
      else if (item.status === "non_compliant") map[item.type].non_compliant++;
    });
    return map;
  }, []);

  const maxBarValue = useMemo(() => {
    return Math.max(...Object.values(complianceByType).map((v) => v.total), 1);
  }, [complianceByType]);

  const totalItems = filteredItems.length;
  const compliantItems = filteredItems.filter((i) => i.status === "compliant").length;

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      <div className="sticky top-0 z-30 bg-[#0a0e1a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1440px] mx-auto px-6 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30 flex items-center justify-center">
              <ShieldCheck size={18} className="text-violet-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold" style={serif}>
                {ar ? "قانون العمل والامتثال" : "Employment Law & Compliance"}
              </h1>
              <p className="text-[11px] text-white/40">
                {ar ? "تتبع الامتثال التنظيمي وسلامة مكان العمل" : "Regulatory compliance & workplace safety tracking"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(["compliance", "incidents", "chart"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all ${
                  tab === t
                    ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                    : "text-white/40 hover:text-white/60 border border-transparent"
                }`}
              >
                {t === "compliance"
                  ? ar ? "الامتثال" : "Compliance"
                  : t === "incidents"
                    ? ar ? "الحوادث" : "Incidents"
                    : ar ? "التقارير" : "Analytics"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 md:px-8 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            {
              label: ar ? "درجة الامتثال" : "Compliance Score",
              value: `${HR_METRICS.compliance_score}%`,
              icon: BadgeCheck,
              gradient: "from-emerald-500/20 to-teal-500/20",
              border: "border-emerald-500/20",
              iconColor: "text-emerald-400",
            },
            {
              label: ar ? "عناصر تنتهي قريباً" : "Expiring Items",
              value: expiringCount,
              icon: Clock,
              gradient: "from-amber-500/20 to-orange-500/20",
              border: "border-amber-500/20",
              iconColor: "text-amber-400",
            },
            {
              label: ar ? "عناصر متأخرة" : "Overdue Items",
              value: overdueCount,
              icon: AlertTriangle,
              gradient: "from-red-500/20 to-rose-500/20",
              border: "border-red-500/20",
              iconColor: "text-red-400",
            },
            {
              label: ar ? "حوادث السنة" : "Safety Incidents YTD",
              value: HR_METRICS.safety_incidents_ytd,
              icon: ShieldAlert,
              gradient: "from-violet-500/20 to-indigo-500/20",
              border: "border-violet-500/20",
              iconColor: "text-violet-400",
            },
            {
              label: ar ? "أيام منذ آخر حادث" : "Days Since Last Incident",
              value: daysSinceLast,
              icon: Activity,
              gradient: "from-cyan-500/20 to-blue-500/20",
              border: "border-cyan-500/20",
              iconColor: "text-cyan-400",
            },
          ].map((kpi, i) => (
            <motion.div
              key={i}
              variants={cardV}
              custom={i}
              initial="hidden"
              animate="visible"
              className={`rounded-2xl bg-gradient-to-br ${kpi.gradient} border ${kpi.border} p-4 hover:shadow-lg transition-shadow`}
            >
              <kpi.icon size={16} className={`${kpi.iconColor} mb-2`} />
              <p className="text-2xl font-bold" style={serif}>
                {kpi.value}
              </p>
              <p className="text-[11px] text-white/40 mt-1 font-medium">
                {kpi.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        {tab !== "chart" && (
          <motion.div
            variants={cardV}
            custom={5}
            initial="hidden"
            animate="visible"
            className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4"
          >
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-white/40" />
                <span className="text-[11px] text-white/40 font-medium">
                  {ar ? "الفلاتر" : "Filters"}
                </span>
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-8 px-3 rounded-lg border border-white/10 bg-white/5 text-[11px] text-white/80 outline-none focus:border-violet-500/50"
              >
                {FILTER_TYPES.map((t) => (
                  <option key={t.key} value={t.key} className="bg-[#0a0e1a]">
                    {ar ? t.ar : t.en}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 px-3 rounded-lg border border-white/10 bg-white/5 text-[11px] text-white/80 outline-none focus:border-violet-500/50"
              >
                {FILTER_STATUSES.map((s) => (
                  <option key={s.key} value={s.key} className="bg-[#0a0e1a]">
                    {ar ? s.ar : s.en}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-white/30 ml-auto">
                {totalItems} {ar ? "عنصر" : "items"} · {compliantItems} {ar ? "ممتثل" : "compliant"}
              </span>
            </div>
          </motion.div>
        )}

        {/* Tab: Compliance Items */}
        {tab === "compliance" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredItems.map((item, i) => {
              const t = TYPE_META[item.type] || TYPE_META.contract;
              const daysLeft = daysUntil(item.due_date);
              const isUrgent = daysLeft <= 14 && item.status !== "compliant";
              return (
                <motion.div
                  key={item.id}
                  variants={cardV}
                  custom={i + 6}
                  initial="hidden"
                  animate="visible"
                  onClick={() => setSelectedItem(item)}
                  className={`rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 cursor-pointer hover:bg-white/[0.06] transition-all group ${
                    isUrgent ? "ring-1 ring-red-500/20" : ""
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {typeBadge(item.type, ar)}
                      {priorityBadge(item.priority, ar)}
                    </div>
                    {statusBadge(item.status, ar)}
                  </div>
                  <h3 className="text-sm font-semibold text-white/90 mb-1 group-hover:text-white transition-colors">
                    {ar ? item.title_ar : item.title}
                  </h3>
                  <p className="text-[11px] text-white/40 mb-3">
                    {ar ? item.entity_ar : item.entity}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[10px] text-white/30">
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {ar ? "الاستحقاق" : "Due"}: {fmtDate(item.due_date, ar)}
                      </span>
                      <span>
                        {daysLeft > 0
                          ? ar ? `${daysLeft} يوم متبقي` : `${daysLeft}d left`
                          : ar ? `متأخر ${Math.abs(daysLeft)} يوم` : `${Math.abs(daysLeft)}d overdue`}
                      </span>
                    </div>
                    <ArrowUpRight size={14} className="text-white/20 group-hover:text-violet-400 transition-colors" />
                  </div>
                  <div className="mt-2 pt-2 border-t border-white/5 text-[10px] text-white/25">
                    {ar ? "آخر فحص" : "Last checked"}: {fmtDate(item.last_checked, ar)}
                  </div>
                </motion.div>
              );
            })}
            {filteredItems.length === 0 && (
              <div className="col-span-2 text-center py-16 text-white/30 text-sm">
                {ar ? "لا توجد عناصر مطابقة" : "No matching items"}
              </div>
            )}
          </div>
        )}

        {/* Tab: Safety Incidents */}
        {tab === "incidents" && (
          <div className="space-y-3">
            {HR_SAFETY_INCIDENTS.map((incident, i) => {
              const it = INCIDENT_TYPE_META[incident.type] || INCIDENT_TYPE_META.injury;
              const Icon = it.icon;
              return (
                <motion.div
                  key={incident.id}
                  variants={cardV}
                  custom={i + 6}
                  initial="hidden"
                  animate="visible"
                  className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center">
                        <Icon size={18} className="text-white/60" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white/90">
                          {ar ? incident.title_ar : incident.title}
                        </h3>
                        <p className="text-[11px] text-white/40">{incident.employee_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {severityBadge(incident.severity, ar)}
                      {statusBadge(incident.status, ar, "sm")}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                    {[
                      { label: ar ? "النوع" : "Type", value: ar ? it.en : it.en },
                      { label: ar ? "الموقع" : "Location", value: incident.location },
                      { label: ar ? "التاريخ" : "Date", value: fmtDate(incident.date, ar) },
                      { label: ar ? "أيام الغياب" : "Lost Days", value: incident.lost_days },
                      { label: ar ? "أبلغ عنده" : "Reported By", value: incident.reported_by },
                    ].map((field, j) => (
                      <div key={j} className="bg-white/[0.03] rounded-xl px-3 py-2 border border-white/5">
                        <p className="text-[10px] text-white/30 mb-0.5">{field.label}</p>
                        <p className="text-xs text-white/70 font-medium">{field.value}</p>
                      </div>
                    ))}
                  </div>

                  {incident.corrective_actions && (
                    <div className="bg-white/[0.02] rounded-xl px-4 py-3 border border-white/5">
                      <p className="text-[10px] text-white/30 mb-1 font-medium">
                        {ar ? "الإجراءات التصحيحية" : "Corrective Actions"}
                      </p>
                      <p className="text-xs text-white/50 leading-relaxed">
                        {ar ? incident.corrective_actions_ar : incident.corrective_actions}
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Tab: Compliance by Type Chart */}
        {tab === "chart" && (
          <motion.div
            variants={cardV}
            custom={6}
            initial="hidden"
            animate="visible"
            className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 size={16} className="text-violet-400" />
              <h2 className="text-sm font-semibold text-white/80" style={serif}>
                {ar ? "الامتثال حسب النوع" : "Compliance by Type"}
              </h2>
            </div>

            <div className="space-y-4">
              {Object.entries(complianceByType)
                .sort(([, a], [, b]) => b.total - a.total)
                .map(([type, data]) => {
                  const t = TYPE_META[type] || TYPE_META.contract;
                  const Icon = t.icon;
                  const compliantPct = data.total > 0 ? (data.compliant / data.total) * 100 : 0;
                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon size={14} className={t.color} />
                          <span className="text-xs text-white/70 font-medium">
                            {ar ? t.ar : t.en}
                          </span>
                          <span className="text-[10px] text-white/30">({data.total})</span>
                        </div>
                        <span className="text-[11px] text-white/40">
                          {compliantPct.toFixed(0)}% {ar ? "ممتثل" : "compliant"}
                        </span>
                      </div>
                      <div className="h-3 rounded-full bg-white/5 overflow-hidden flex">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(data.compliant / data.total) * 100}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full bg-emerald-500/60 rounded-l-full"
                        />
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(data.expiring / data.total) * 100}%` }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                          className="h-full bg-amber-500/60"
                        />
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(data.overdue / data.total) * 100}%` }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                          className="h-full bg-red-500/60"
                        />
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(data.non_compliant / data.total) * 100}%` }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                          className="h-full bg-red-700/60 rounded-r-full"
                        />
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-white/5">
              {[
                { label: ar ? "ممتثل" : "Compliant", color: "bg-emerald-500/60" },
                { label: ar ? "ينتهي قريباً" : "Expiring", color: "bg-amber-500/60" },
                { label: ar ? "متأخر" : "Overdue", color: "bg-red-500/60" },
                { label: ar ? "غير ممتثل" : "Non-Compliant", color: "bg-red-700/60" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-sm ${l.color}`} />
                  <span className="text-[10px] text-white/40">{l.label}</span>
                </div>
              ))}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-4 border-t border-white/5">
              {[
                { label: ar ? "إجمالي العناصر" : "Total Items", value: HR_COMPLIANCE.length },
                { label: ar ? "ممتثل" : "Compliant", value: HR_COMPLIANCE.filter((i) => i.status === "compliant").length, color: "text-emerald-400" },
                { label: ar ? "ينتهي قريباً" : "Expiring", value: HR_COMPLIANCE.filter((i) => i.status === "expiring").length, color: "text-amber-400" },
                { label: ar ? "متأخر" : "Overdue", value: HR_COMPLIANCE.filter((i) => i.status === "overdue").length, color: "text-red-400" },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <p className={`text-xl font-bold ${s.color || "text-white/80"}`} style={serif}>{s.value}</p>
                  <p className="text-[10px] text-white/30 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl bg-[#111827] border border-white/10 shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <div className="flex items-center gap-3">
                  {(() => {
                    const t = TYPE_META[selectedItem.type] || TYPE_META.contract;
                    const Icon = t.icon;
                    return (
                      <div className={`w-10 h-10 rounded-xl ${t.bg} border ${t.border} flex items-center justify-center`}>
                        <Icon size={18} className={t.color} />
                      </div>
                    );
                  })()}
                  <div>
                    <h3 className="text-sm font-semibold text-white/90" style={serif}>
                      {ar ? selectedItem.title_ar : selectedItem.title}
                    </h3>
                    <p className="text-[11px] text-white/40">
                      {ar ? selectedItem.entity_ar : selectedItem.entity}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  {typeBadge(selectedItem.type, ar)}
                  {statusBadge(selectedItem.status, ar)}
                  {priorityBadge(selectedItem.priority, ar)}
                </div>

                {/* Description */}
                <div className="bg-white/[0.03] rounded-xl px-4 py-3 border border-white/5">
                  <p className="text-[10px] text-white/30 mb-1 font-medium">
                    {ar ? "الوصف" : "Description"}
                  </p>
                  <p className="text-xs text-white/60 leading-relaxed">
                    {ar ? selectedItem.description_ar : selectedItem.description}
                  </p>
                </div>

                {/* Notes */}
                <div className="bg-white/[0.03] rounded-xl px-4 py-3 border border-white/5">
                  <p className="text-[10px] text-white/30 mb-1 font-medium">
                    {ar ? "ملاحظات" : "Notes"}
                  </p>
                  <p className="text-xs text-white/60 leading-relaxed">
                    {ar ? selectedItem.notes_ar : selectedItem.notes}
                  </p>
                </div>

                {/* Dates Grid */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: ar ? "تاريخ الاستحقاق" : "Due Date", value: fmtDate(selectedItem.due_date, ar) },
                    { label: ar ? "آخر فحص" : "Last Checked", value: fmtDate(selectedItem.last_checked, ar) },
                    { label: ar ? "الفحص القادم" : "Next Check", value: fmtDate(selectedItem.next_check, ar) },
                  ].map((d, i) => (
                    <div key={i} className="bg-white/[0.03] rounded-xl px-3 py-2 border border-white/5 text-center">
                      <p className="text-[10px] text-white/30 mb-0.5">{d.label}</p>
                      <p className="text-xs text-white/70 font-medium">{d.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-white/5 flex justify-end">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="h-9 px-5 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-white/60 hover:bg-white/10 transition-all"
                >
                  {ar ? "إغلاق" : "Close"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
