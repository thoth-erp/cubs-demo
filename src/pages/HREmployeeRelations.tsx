import { useState, useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import {
  HR_GRIEVANCES, HR_PULSE_SURVEYS, HR_TEAM_MORALE,
  type Grievance,
} from "../lib/hr-data-full";
import {
  AlertTriangle, Clock, Heart, BarChart3, Filter, X, CheckCircle2,
  ChevronDown, Users, Shield, TrendingUp, FileText, Search,
  MessageSquare, Star, ArrowUpRight, ArrowDownRight, AlertCircle,
  Scale, Briefcase, ShieldAlert,
} from "lucide-react";

const cardV: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.3, ease: [0.22, 1, 0.36, 1] } }),
};

const SEVERITY_META: Record<string, { en: string; ar: string; pill: string }> = {
  low: { en: "Low", ar: "منخفض", pill: "bg-emerald-100 text-emerald-700" },
  medium: { en: "Medium", ar: "متوسط", pill: "bg-amber-100 text-amber-700" },
  high: { en: "High", ar: "عالي", pill: "bg-red-100 text-red-700" },
  critical: { en: "Critical", ar: "حرج", pill: "bg-red-900 text-red-100" },
};

const STATUS_META: Record<string, { en: string; ar: string; pill: string }> = {
  filed: { en: "Filed", ar: "مُقدَّم", pill: "bg-blue-100 text-blue-600" },
  investigating: { en: "Investigating", ar: "قيد التحقيق", pill: "bg-amber-100 text-amber-700" },
  mediation: { en: "Mediation", ar: "وساطة", pill: "bg-violet-100 text-violet-600" },
  resolved: { en: "Resolved", ar: "تم الحل", pill: "bg-emerald-100 text-emerald-700" },
  escalated: { en: "Escalated", ar: "تم التصعيد", pill: "bg-red-100 text-red-700" },
  closed: { en: "Closed", ar: "مغلق", pill: "bg-zinc-100 text-zinc-500" },
};

const SURVEY_STATUS_META: Record<string, { en: string; ar: string; pill: string }> = {
  active: { en: "Active", ar: "نشط", pill: "bg-emerald-100 text-emerald-700" },
  closed: { en: "Closed", ar: "مغلق", pill: "bg-zinc-100 text-zinc-500" },
  draft: { en: "Draft", ar: "مسودة", pill: "bg-amber-100 text-amber-700" },
};

const TYPE_META: Record<string, { en: string; ar: string }> = {
  workplace: { en: "Workplace", ar: "بيئة العمل" },
  harassment: { en: "Harassment", ar: "تحرش" },
  discrimination: { en: "Discrimination", ar: "تمييز" },
  pay: { en: "Pay", ar: "أجر" },
  manager: { en: "Manager", ar: "مدير" },
  policy: { en: "Policy", ar: "سياسة" },
  safety: { en: "Safety", ar: "سلامة" },
};

const DEPT_META: Record<string, { en: string; ar: string; color: string }> = {
  sales: { en: "Sales", ar: "المبيعات", color: "#E07A5F" },
  production: { en: "Production", ar: "الإنتاج", color: "#3B82F6" },
  design: { en: "Design", ar: "التصميم", color: "#EC4899" },
  warehouse: { en: "Warehouse", ar: "المخزن", color: "#F59E0B" },
  admin: { en: "Admin", ar: "الإدارة", color: "#10B981" },
};

export default function HREmployeeRelations() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const filteredGrievances = useMemo(() => {
    let list = [...HR_GRIEVANCES];
    if (filterType !== "all") list = list.filter(g => g.type === filterType);
    if (filterStatus !== "all") list = list.filter(g => g.status === filterStatus);
    return list;
  }, [filterType, filterStatus]);

  const stats = useMemo(() => {
    const openGrievances = HR_GRIEVANCES.filter(g => g.status !== "resolved" && g.status !== "closed").length;
    const resolvedGrievances = HR_GRIEVANCES.filter(g => g.status === "resolved" || g.status === "closed");
    const avgResolutionDays = resolvedGrievances.length > 0
      ? Math.round(resolvedGrievances.reduce((s, g) => {
        if (!g.resolved_at || !g.filed_at) return s;
        return s + (new Date(g.resolved_at).getTime() - new Date(g.filed_at).getTime()) / 86400000;
      }, 0) / resolvedGrievances.length)
      : 0;
    const activeSurveys = HR_PULSE_SURVEYS.filter(s => s.status === "active");
    const avgSatisfaction = activeSurveys.length > 0
      ? activeSurveys.reduce((s, sv) => s + sv.avg_satisfaction, 0) / activeSurveys.length
      : 0;
    const totalResponses = HR_PULSE_SURVEYS.reduce((s, sv) => s + sv.responses_count, 0);
    const totalEmployees = 25;
    const responseRate = totalEmployees > 0 ? Math.round((totalResponses / totalEmployees) * 100) : 0;
    const avgMorale = HR_TEAM_MORALE.length > 0
      ? HR_TEAM_MORALE.reduce((s, m) => s + m.score, 0) / HR_TEAM_MORALE.length
      : 0;
    return { openGrievances, avgResolutionDays, avgMorale: avgMorale.toFixed(1), responseRate, totalResponses };
  }, []);

  return (
    <div className="min-h-full px-6 md:px-8 py-6 max-w-[1400px] mx-auto space-y-5">
      {/* Header */}
      <motion.div variants={cardV} custom={0} initial="hidden" animate="visible" className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>
            {ar ? "علاقات الموظفين" : "Employee Relations"}
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            {ar ? "إدارة الشكاوى، استبيانات الرضا، ومعنويات الفريق" : "Manage grievances, pulse surveys, and team morale"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(!showFilters)}
            className={`h-9 px-4 rounded-xl border text-[11px] font-medium transition-colors flex items-center gap-1.5 ${showFilters ? "border-primary bg-primary/5 text-primary" : "border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
            <Filter size={12} /> {ar ? "الفلاتر" : "Filters"}
          </button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: ar ? "شكاوى مفتوحة" : "Open Grievances", value: stats.openGrievances, icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-50/80" },
          { label: ar ? "متوسط وقت الحل" : "Avg Resolution Time", value: `${stats.avgResolutionDays} ${ar ? "يوم" : "days"}`, icon: Clock, color: "text-amber-600", bg: "bg-amber-50/80" },
          { label: ar ? "معاملة الفريق" : "Team Morale Score", value: `${stats.avgMorale}/5`, icon: Heart, color: "text-violet-600", bg: "bg-violet-50/80" },
          { label: ar ? "نسبة استجابة الاستبيان" : "Pulse Survey Response Rate", value: `${stats.responseRate}%`, icon: BarChart3, color: "text-emerald-600", bg: "bg-emerald-50/80" },
        ].map((kpi, i) => (
          <motion.div key={i} variants={cardV} custom={i + 1} initial="hidden" animate="visible"
            className={`${kpi.bg} rounded-xl p-4 border border-border/30`}>
            <div className="flex items-center justify-between mb-2">
              <kpi.icon size={15} className={kpi.color} />
            </div>
            <p className="text-[20px] font-bold text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>{kpi.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters Bar */}
      {showFilters && (
        <motion.div variants={cardV} custom={5} initial="hidden" animate="visible"
          className="p-3 rounded-xl border border-border/40 bg-card flex items-center gap-3 flex-wrap">
          <span className="text-[11px] font-medium text-muted-foreground">{ar ? "فلاتر:" : "Filters:"}</span>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="h-8 px-3 rounded-lg border border-border/60 bg-background text-[11px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="all">{ar ? "جميع الأنواع" : "All Types"}</option>
            {Object.entries(TYPE_META).map(([key, meta]) => (
              <option key={key} value={key}>{ar ? meta.ar : meta.en}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="h-8 px-3 rounded-lg border border-border/60 bg-background text-[11px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="all">{ar ? "جميع الحالات" : "All Statuses"}</option>
            {Object.entries(STATUS_META).map(([key, meta]) => (
              <option key={key} value={key}>{ar ? meta.ar : meta.en}</option>
            ))}
          </select>
          {(filterType !== "all" || filterStatus !== "all") && (
            <button onClick={() => { setFilterType("all"); setFilterStatus("all"); }}
              className="h-8 px-3 rounded-lg text-[11px] text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1">
              <X size={10} /> {ar ? "مسح الفلاتر" : "Clear"}
            </button>
          )}
        </motion.div>
      )}

      {/* Grievances Section */}
      <motion.div variants={cardV} custom={6} initial="hidden" animate="visible">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-semibold flex items-center gap-2">
            <AlertTriangle size={14} className="text-rose-500" />
            {ar ? "شكاوى الموظفين" : "Employee Grievances"}
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600 font-medium">{filteredGrievances.length}</span>
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredGrievances.map((g, i) => {
            const severity = SEVERITY_META[g.severity];
            const status = STATUS_META[g.status];
            const type = TYPE_META[g.type];
            return (
              <motion.div key={g.id} variants={cardV} custom={i + 7} initial="hidden" animate="visible"
                onClick={() => setSelectedGrievance(g)}
                className="p-4 rounded-xl border border-border/40 bg-card hover:shadow-md transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
                      {g.employee_name.split(" ").map(w => w[0]).join("")}
                    </div>
                    <div>
                      <p className="text-[12px] font-medium text-foreground">{ar ? g.employee_name_ar : g.employee_name}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(g.filed_at).toLocaleDateString(ar ? "ar-EG" : "en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${severity.pill}`}>{ar ? severity.ar : severity.en}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${status.pill}`}>{ar ? status.ar : status.en}</span>
                  </div>
                </div>
                <p className="text-[12px] font-medium text-foreground mb-1">{ar ? g.title_ar : g.title}</p>
                <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2.5">{ar ? g.description_ar : g.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{ar ? type.ar : type.en}</span>
                  <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                    <Users size={9} /> {ar ? g.assigned_to_ar : g.assigned_to}
                  </span>
                </div>
              </motion.div>
            );
          })}
          {filteredGrievances.length === 0 && (
            <div className="col-span-2 text-center py-8">
              <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-2" />
              <p className="text-[12px] text-muted-foreground">{ar ? "لا توجد شكاوى مطابقة" : "No matching grievances"}</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Pulse Surveys Section */}
      <motion.div variants={cardV} custom={12} initial="hidden" animate="visible">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-semibold flex items-center gap-2">
            <BarChart3 size={14} className="text-emerald-500" />
            {ar ? "استبيانات النبض" : "Pulse Surveys"}
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {HR_PULSE_SURVEYS.map((survey, i) => {
            const surveyStatus = SURVEY_STATUS_META[survey.status];
            return (
              <motion.div key={survey.id} variants={cardV} custom={i + 13} initial="hidden" animate="visible"
                className="p-4 rounded-xl border border-border/40 bg-card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[12px] font-medium text-foreground">{ar ? survey.title_ar : survey.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{survey.questions.length} {ar ? "أسئلة" : "questions"}</p>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${surveyStatus.pill}`}>{ar ? surveyStatus.ar : surveyStatus.en}</span>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center">
                    <p className="text-[16px] font-bold text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>{survey.responses_count}</p>
                    <p className="text-[9px] text-muted-foreground">{ar ? "الردود" : "Responses"}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[16px] font-bold text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>{survey.avg_satisfaction.toFixed(1)}</p>
                    <p className="text-[9px] text-muted-foreground">{ar ? "الرضا" : "Satisfaction"}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      {Array.from({ length: 5 }, (_, j) => (
                        <Star key={j} size={10} className={j < Math.round(survey.avg_satisfaction) ? "text-amber-400 fill-amber-400" : "text-zinc-200"} />
                      ))}
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-1">{ar ? "التقييم" : "Rating"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {survey.questions.slice(0, 3).map((q, j) => (
                    <span key={j} className="text-[8px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{ar ? q.category : q.category}</span>
                  ))}
                  {survey.questions.length > 3 && (
                    <span className="text-[8px] text-muted-foreground">+{survey.questions.length - 3}</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Team Morale by Department */}
      <motion.div variants={cardV} custom={15} initial="hidden" animate="visible" className="p-5 rounded-xl border border-border/40 bg-background">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[13px] font-semibold flex items-center gap-2">
            <Heart size={14} className="text-violet-500" />
            {ar ? "معنويات الفريق حسب القسم" : "Team Morale by Department"}
          </h3>
          <span className="text-[10px] text-muted-foreground">{HR_TEAM_MORALE[0]?.month}</span>
        </div>
        <div className="space-y-3">
          {HR_TEAM_MORALE.map((item) => {
            const dept = DEPT_META[item.department];
            if (!dept) return null;
            const pct = (item.score / 5) * 100;
            const barColor = item.score >= 4.0 ? "#10B981" : item.score >= 3.0 ? "#F59E0B" : "#EF4444";
            return (
              <div key={item.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dept.color }} />
                    <span className="text-[11px] font-medium">{ar ? dept.ar : dept.en}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold">{item.score.toFixed(1)}</span>
                    <span className="text-[9px] text-muted-foreground">({item.responses} {ar ? "رد" : "resp"})</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: barColor }}
                  />
                </div>
                <p className="text-[9px] text-muted-foreground">{ar ? item.highlights_ar : item.highlights}</p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Grievance Detail Modal */}
      {selectedGrievance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedGrievance(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-lg bg-card rounded-2xl border border-border/40 shadow-2xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-border/40">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary">
                    {selectedGrievance.employee_name.split(" ").map(w => w[0]).join("")}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">{ar ? selectedGrievance.employee_name_ar : selectedGrievance.employee_name}</p>
                    <p className="text-[11px] text-muted-foreground">{ar ? selectedGrievance.title_ar : selectedGrievance.title}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedGrievance(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${SEVERITY_META[selectedGrievance.severity].pill}`}>
                  {ar ? SEVERITY_META[selectedGrievance.severity].ar : SEVERITY_META[selectedGrievance.severity].en}
                </span>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${STATUS_META[selectedGrievance.status].pill}`}>
                  {ar ? STATUS_META[selectedGrievance.status].ar : STATUS_META[selectedGrievance.status].en}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {ar ? TYPE_META[selectedGrievance.type].ar : TYPE_META[selectedGrievance.type].en}
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{ar ? "الوصف" : "Description"}</p>
                <p className="text-[12px] text-foreground leading-relaxed">{ar ? selectedGrievance.description_ar : selectedGrievance.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{ar ? "مُقدَّم من" : "Filed By"}</p>
                  <p className="text-[12px] font-medium text-foreground">{ar ? selectedGrievance.filed_by_ar : selectedGrievance.filed_by}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{ar ? "مسؤول التحقيق" : "Assigned To"}</p>
                  <p className="text-[12px] font-medium text-foreground">{ar ? selectedGrievance.assigned_to_ar : selectedGrievance.assigned_to}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{ar ? "تاريخ التقديم" : "Filed Date"}</p>
                  <p className="text-[12px] text-foreground">{new Date(selectedGrievance.filed_at).toLocaleDateString(ar ? "ar-EG" : "en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
                {selectedGrievance.resolved_at && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{ar ? "تاريخ الحل" : "Resolved Date"}</p>
                    <p className="text-[12px] text-foreground">{new Date(selectedGrievance.resolved_at).toLocaleDateString(ar ? "ar-EG" : "en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                  </div>
                )}
              </div>
              {selectedGrievance.resolution && (
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/60">
                  <p className="text-[10px] text-emerald-600 uppercase tracking-wide mb-1 font-medium">{ar ? "الحل" : "Resolution"}</p>
                  <p className="text-[12px] text-emerald-800">{selectedGrievance.resolution}</p>
                </div>
              )}
            </div>

            {/* Modal Footer - Status Update Buttons */}
            <div className="p-4 border-t border-border/40 flex items-center gap-2 flex-wrap">
              {selectedGrievance.status === "filed" && (
                <button className="h-8 px-3 rounded-lg bg-amber-100 text-amber-700 text-[11px] font-medium hover:bg-amber-200 transition-colors flex items-center gap-1">
                  <Search size={11} /> {ar ? "بدء التحقيق" : "Start Investigation"}
                </button>
              )}
              {selectedGrievance.status === "investigating" && (
                <button className="h-8 px-3 rounded-lg bg-violet-100 text-violet-600 text-[11px] font-medium hover:bg-violet-200 transition-colors flex items-center gap-1">
                  <MessageSquare size={11} /> {ar ? "بدء الوساطة" : "Start Mediation"}
                </button>
              )}
              {(selectedGrievance.status === "investigating" || selectedGrievance.status === "mediation") && (
                <>
                  <button className="h-8 px-3 rounded-lg bg-emerald-100 text-emerald-700 text-[11px] font-medium hover:bg-emerald-200 transition-colors flex items-center gap-1">
                    <CheckCircle2 size={11} /> {ar ? "تم الحل" : "Mark Resolved"}
                  </button>
                  <button className="h-8 px-3 rounded-lg bg-red-100 text-red-700 text-[11px] font-medium hover:bg-red-200 transition-colors flex items-center gap-1">
                    <ArrowUpRight size={11} /> {ar ? "تصعيد" : "Escalate"}
                  </button>
                </>
              )}
              {selectedGrievance.status === "resolved" && (
                <button className="h-8 px-3 rounded-lg bg-zinc-100 text-zinc-500 text-[11px] font-medium hover:bg-zinc-200 transition-colors flex items-center gap-1">
                  <CheckCircle2 size={11} /> {ar ? "إغلاق" : "Close Case"}
                </button>
              )}
              <div className="flex-1" />
              <button onClick={() => setSelectedGrievance(null)}
                className="h-8 px-3 rounded-lg border border-border/60 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                {ar ? "إغلاق" : "Close"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
