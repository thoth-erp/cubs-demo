/**
 * HR Performance Management — إدارة أداء الموارد البشرية
 *
 * Goals tracking, performance reviews, 360 feedback, and analytics
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { HR_EMPLOYEES } from "../lib/hr-data";
import {
  HR_PERFORMANCE_GOALS,
  HR_PERFORMANCE_REVIEWS,
  HR_FEEDBACK_360,
  type PerformanceGoal,
  type PerformanceReview,
  type Feedback360,
} from "../lib/hr-data-full";
import {
  Target, TrendingUp, CheckCircle2, MessageSquare, Star,
  ChevronDown, ChevronRight, X, Search, Filter, BarChart3,
  Calendar, Award, AlertTriangle, Eye, EyeOff, ArrowUpRight,
  ArrowDownRight, Minus, Zap, Users, Briefcase,
} from "lucide-react";

function scoreColor(score: number) {
  if (score >= 90) return "text-emerald-400";
  if (score >= 75) return "text-amber-400";
  if (score >= 60) return "text-orange-400";
  return "text-red-400";
}

function scoreBg(score: number) {
  if (score >= 90) return "bg-emerald-500/15 border-emerald-500/30";
  if (score >= 75) return "bg-amber-500/15 border-amber-500/30";
  if (score >= 60) return "bg-orange-500/15 border-orange-500/30";
  return "bg-red-500/15 border-red-500/30";
}

function progressColor(pct: number) {
  if (pct >= 90) return "bg-emerald-500";
  if (pct >= 70) return "bg-amber-500";
  if (pct >= 50) return "bg-orange-500";
  return "bg-red-500";
}

function statusBadge(status: string, ar: boolean) {
  const labels: Record<string, { en: string; ar: string; cls: string }> = {
    completed: { en: "Completed", ar: "مكتمل", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    in_progress: { en: "In Progress", ar: "قيد التنفيذ", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
    acknowledged: { en: "Acknowledged", ar: "معترف به", cls: "bg-violet-500/15 text-violet-400 border-violet-500/30" },
    draft: { en: "Draft", ar: "مسودة", cls: "bg-gray-500/15 text-gray-400 border-gray-500/30" },
    self_review: { en: "Self Review", ar: "تقييم ذاتي", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
    manager_review: { en: "Manager Review", ar: "تقييم المدير", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
    hr_review: { en: "HR Review", ar: "تقييم الموارد البشرية", cls: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
    not_started: { en: "Not Started", ar: "لم يبدأ", cls: "bg-gray-500/15 text-gray-400 border-gray-500/30" },
    missed: { en: "Missed", ar: "فائت", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
  };
  const s = labels[status] || { en: status, ar: status, cls: "bg-gray-500/15 text-gray-400 border-gray-500/30" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.cls}`}>
      {ar ? s.ar : s.en}
    </span>
  );
}

const categoryMeta: Record<string, { en: string; ar: string; icon: string; color: string }> = {
  sales: { en: "Sales", ar: "المبيعات", icon: "💰", color: "#E07A5F" },
  production: { en: "Production", ar: "الإنتاج", icon: "🏭", color: "#3B82F6" },
  quality: { en: "Quality", ar: "الجودة", icon: "✅", color: "#10B981" },
  customer: { en: "Customer", ar: "العملاء", icon: "👥", color: "#EC4899" },
  growth: { en: "Growth", ar: "النمو", icon: "📈", color: "#F59E0B" },
};

const relationshipMeta: Record<string, { en: string; ar: string }> = {
  manager: { en: "Manager", ar: "المدير" },
  peer: { en: "Peer", ar: "زميل" },
  direct_report: { en: "Direct Report", ar: "مرؤوس مباشر" },
  client: { en: "Client", ar: "عميل" },
};

const categoryFBMeta: Record<string, { en: string; ar: string }> = {
  communication: { en: "Communication", ar: "التواصل" },
  teamwork: { en: "Teamwork", ar: "العمل الجماعي" },
  leadership: { en: "Leadership", ar: "القيادة" },
  technical: { en: "Technical", ar: "الخبرة التقنية" },
  reliability: { en: "Reliability", ar: "الموثوقية" },
};

const DEPTS = [
  { key: "all", en: "All Departments", ar: "جميع الأقسام" },
  { key: "management", en: "Management", ar: "الإدارة العليا" },
  { key: "sales", en: "Sales", ar: "المبيعات" },
  { key: "production", en: "Production", ar: "الإنتاج" },
  { key: "design", en: "Design", ar: "التصميم" },
  { key: "warehouse", en: "Warehouse", ar: "المخزن" },
  { key: "delivery", en: "Delivery", ar: "التوصيل" },
  { key: "admin", en: "Admin", ar: "الإدارة" },
];

const STATUSES = [
  { key: "all", en: "All Statuses", ar: "جميع الحالات" },
  { key: "completed", en: "Completed", ar: "مكتمل" },
  { key: "in_progress", en: "In Progress", ar: "قيد التنفيذ" },
  { key: "not_started", en: "Not Started", ar: "لم يبدأ" },
  { key: "missed", en: "Missed", ar: "فائت" },
];

export default function HRPerformance() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);
  const [tab, setTab] = useState<"goals" | "reviews" | "feedback" | "chart">("goals");

  const empMap = useMemo(() => {
    const m = new Map<string, typeof HR_EMPLOYEES[0]>();
    HR_EMPLOYEES.forEach((e) => m.set(e.id, e));
    return m;
  }, []);

  const empDept = (id: string) => empMap.get(id)?.department ?? "";
  const empName = (id: string) => {
    const e = empMap.get(id);
    return e ? (ar ? e.full_name_ar : e.full_name) : "—";
  };

  const filteredGoals = useMemo(() => {
    let g = HR_PERFORMANCE_GOALS;
    if (deptFilter !== "all") g = g.filter((x) => empDept(x.employee_id) === deptFilter);
    if (statusFilter !== "all") g = g.filter((x) => x.status === statusFilter);
    return g;
  }, [deptFilter, statusFilter]);

  const filteredReviews = useMemo(() => {
    let r = HR_PERFORMANCE_REVIEWS;
    if (deptFilter !== "all") r = r.filter((x) => empDept(x.employee_id) === deptFilter);
    return r;
  }, [deptFilter]);

  const filteredFeedback = useMemo(() => {
    let f = HR_FEEDBACK_360;
    if (deptFilter !== "all") f = f.filter((x) => empDept(x.employee_id) === deptFilter);
    return f;
  }, [deptFilter]);

  const kpis = useMemo(() => {
    const reviews = filteredReviews;
    const goals = filteredGoals;
    const fb = filteredFeedback;
    const avgScore = reviews.length ? Math.round(reviews.reduce((s, r) => s + r.final_score, 0) / reviews.length) : 0;
    const onTrack = goals.length ? Math.round((goals.filter((g) => g.status !== "missed").length / goals.length) * 100) : 0;
    const completed = reviews.filter((r) => r.status === "completed" || r.status === "acknowledged").length;
    return { avgScore, onTrack, completed, feedbackCount: fb.length };
  }, [filteredGoals, filteredReviews, filteredFeedback]);

  const distribution = useMemo(() => {
    const ranges = [
      { label: "90-100", min: 90, max: 101, color: "bg-emerald-500" },
      { label: "80-89", min: 80, max: 90, color: "bg-blue-500" },
      { label: "70-79", min: 70, max: 80, color: "bg-amber-500" },
      { label: "60-69", min: 60, max: 70, color: "bg-orange-500" },
      { label: "< 60", min: 0, max: 60, color: "bg-red-500" },
    ];
    return ranges.map((r) => ({
      ...r,
      count: filteredReviews.filter((rev) => rev.final_score >= r.min && rev.final_score < r.max).length,
    }));
  }, [filteredReviews]);

  const maxDist = Math.max(...distribution.map((d) => d.count), 1);

  const cardV = {
    hidden: { opacity: 0, y: 12 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }),
  } satisfies Variants;

  const tabs = [
    { key: "goals" as const, label: "Goals", label_ar: "الأهداف", icon: Target },
    { key: "reviews" as const, label: "Reviews", label_ar: "التقييمات", icon: CheckCircle2 },
    { key: "feedback" as const, label: "360 Feedback", label_ar: "التغذية الراجعة", icon: MessageSquare },
    { key: "chart" as const, label: "Distribution", label_ar: "التوزيع", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0a0e1a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  {ar ? "إدارة الأداء" : "Performance Management"}
                </h1>
                <p className="text-xs text-white/40">
                  {ar ? "تتبع الأهداف والتقييمات والتغذية الراجعة" : "Track goals, reviews & feedback"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                <Filter className="w-3.5 h-3.5 text-white/40" />
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="bg-transparent text-xs text-white/80 outline-none cursor-pointer appearance-none pr-1"
                >
                  {DEPTS.map((d) => (
                    <option key={d.key} value={d.key} className="bg-[#1a1f2e] text-white">
                      {ar ? d.ar : d.en}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-xs text-white/80 outline-none cursor-pointer appearance-none pr-1"
                >
                  {STATUSES.map((s) => (
                    <option key={s.key} value={s.key} className="bg-[#1a1f2e] text-white">
                      {ar ? s.ar : s.en}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: ar ? "متوسط الأداء" : "Avg Performance Score",
              value: kpis.avgScore,
              suffix: "/100",
              icon: Award,
              gradient: "from-violet-500/20 to-indigo-500/20",
              border: "border-violet-500/20",
              iconBg: "bg-violet-500/20",
            },
            {
              label: ar ? "الأهداف على المسار" : "Goals On Track",
              value: `${kpis.onTrack}%`,
              suffix: "",
              icon: Target,
              gradient: "from-emerald-500/20 to-teal-500/20",
              border: "border-emerald-500/20",
              iconBg: "bg-emerald-500/20",
            },
            {
              label: ar ? "التقييمات المكتملة" : "Reviews Completed",
              value: kpis.completed,
              suffix: `/${filteredReviews.length}`,
              icon: CheckCircle2,
              gradient: "from-blue-500/20 to-cyan-500/20",
              border: "border-blue-500/20",
              iconBg: "bg-blue-500/20",
            },
            {
              label: ar ? "التغذية الراجعة 360" : "360 Feedback Count",
              value: kpis.feedbackCount,
              suffix: "",
              icon: MessageSquare,
              gradient: "from-amber-500/20 to-orange-500/20",
              border: "border-amber-500/20",
              iconBg: "bg-amber-500/20",
            },
          ].map((kpi, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={cardV}
              initial="hidden"
              animate="visible"
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${kpi.gradient} border ${kpi.border} p-4`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl ${kpi.iconBg} flex items-center justify-center`}>
                  <kpi.icon className="w-4.5 h-4.5 text-white/80" />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold tracking-tight">{kpi.value}</span>
                {kpi.suffix && <span className="text-sm text-white/40">{kpi.suffix}</span>}
              </div>
              <p className="text-xs text-white/50 mt-1">{kpi.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/10 w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tab === t.key
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {ar ? t.label_ar : t.label}
            </button>
          ))}
        </div>

        {/* Goals Tab */}
        {tab === "goals" && (
          <div className="space-y-3">
            {filteredGoals.length === 0 ? (
              <div className="text-center py-12 text-white/30 text-sm">
                {ar ? "لا توجد أهداف" : "No goals found"}
              </div>
            ) : (
              filteredGoals.map((g, i) => {
                const pct = Math.round((g.current_value / g.target_value) * 100);
                const emp = empMap.get(g.employee_id);
                return (
                  <motion.div
                    key={g.id}
                    custom={i}
                    variants={cardV}
                    initial="hidden"
                    animate="visible"
                    className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Left: Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ backgroundColor: (categoryMeta[g.category]?.color ?? "#666") + "20" }}>
                            {categoryMeta[g.category]?.icon ?? "📊"}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-white/90 truncate">
                              {ar ? g.title_ar : g.title}
                            </h3>
                            <p className="text-xs text-white/40 mt-0.5">
                              {emp ? (ar ? emp.full_name_ar : emp.full_name) : "—"}
                              {" · "}
                              <span style={{ color: categoryMeta[g.category]?.color }}>
                                {ar ? categoryMeta[g.category]?.ar : categoryMeta[g.category]?.en}
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="ml-11">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-white/50">
                              {g.current_value.toLocaleString()} {ar ? "من" : "of"} {g.target_value.toLocaleString()} {g.unit}
                            </span>
                            <span className={`font-semibold ${scoreColor(pct)}`}>
                              {pct}%
                            </span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(pct, 100)}%` }}
                              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.05 }}
                              className={`h-full rounded-full ${progressColor(pct)}`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Right: Meta */}
                      <div className="flex items-center gap-4 lg:gap-6 ml-11 lg:ml-0 shrink-0">
                        <div className="text-center">
                          <p className="text-[10px] text-white/30 uppercase tracking-wider">{ar ? "الوزن" : "Weight"}</p>
                          <p className="text-sm font-semibold text-white/80">{g.weight}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-white/30 uppercase tracking-wider">{ar ? "النوع" : "Type"}</p>
                          <p className="text-xs text-white/70 capitalize">{ar ? (g.type === "individual" ? "فردي" : g.type === "team" ? "فريق" : "شركة") : g.type}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-white/30 uppercase tracking-wider">{ar ? "الموعد" : "Due"}</p>
                          <p className="text-xs text-white/70">{g.due_date}</p>
                        </div>
                        {statusBadge(g.status, ar)}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {tab === "reviews" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredReviews.length === 0 ? (
              <div className="text-center py-12 text-white/30 text-sm col-span-2">
                {ar ? "لا توجد تقييمات" : "No reviews found"}
              </div>
            ) : (
              filteredReviews.map((r, i) => {
                const emp = empMap.get(r.employee_id);
                return (
                  <motion.div
                    key={r.id}
                    custom={i}
                    variants={cardV}
                    initial="hidden"
                    animate="visible"
                    onClick={() => setSelectedReview(r)}
                    className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 cursor-pointer hover:bg-white/[0.06] hover:border-white/10 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                          style={{ backgroundColor: emp?.avatar_color ?? "#666" }}
                        >
                          {emp ? (ar ? emp.full_name_ar[0] : emp.full_name[0]) : "?"}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white/90">
                            {emp ? (ar ? emp.full_name_ar : emp.full_name) : "—"}
                          </h3>
                          <p className="text-xs text-white/40">{r.period}</p>
                        </div>
                      </div>
                      <Eye className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[
                        { label: ar ? "تقييم ذاتي" : "Self", value: r.self_score },
                        { label: ar ? "تقييم المدير" : "Manager", value: r.manager_score },
                        { label: ar ? "النهائي" : "Final", value: r.final_score },
                      ].map((s) => (
                        <div key={s.label} className="text-center p-2 rounded-xl bg-white/[0.03]">
                          <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">{s.label}</p>
                          <p className={`text-lg font-bold ${scoreColor(s.value)}`}>{s.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      {statusBadge(r.status, ar)}
                      <p className="text-xs text-white/30">
                        {ar ? "المراجع:" : "Reviewer:"} {ar ? r.reviewer_ar : r.reviewer}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* 360 Feedback Tab */}
        {tab === "feedback" && (
          <div className="space-y-3">
            {filteredFeedback.length === 0 ? (
              <div className="text-center py-12 text-white/30 text-sm">
                {ar ? "لا توجد تغذية راجعة" : "No feedback found"}
              </div>
            ) : (
              filteredFeedback.map((f, i) => {
                const emp = empMap.get(f.employee_id);
                return (
                  <motion.div
                    key={f.id}
                    custom={i}
                    variants={cardV}
                    initial="hidden"
                    animate="visible"
                    className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ backgroundColor: emp?.avatar_color ?? "#666" }}
                        >
                          {emp ? (ar ? emp.full_name_ar[0] : emp.full_name[0]) : "?"}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-white/90 truncate">
                            {emp ? (ar ? emp.full_name_ar : emp.full_name) : "—"}
                          </h3>
                          <p className="text-xs text-white/40 truncate">
                            {ar ? relationshipMeta[f.relationship]?.ar : relationshipMeta[f.relationship]?.en}
                            {" · "}
                            {ar ? categoryFBMeta[f.category]?.ar : categoryFBMeta[f.category]?.en}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {f.anonymous && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 text-[10px] font-medium border border-violet-500/30">
                            <EyeOff className="w-2.5 h-2.5" />
                            {ar ? "مجهول" : "Anonymous"}
                          </span>
                        )}
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }, (_, si) => (
                            <Star
                              key={si}
                              className={`w-3.5 h-3.5 ${si < f.score ? "text-amber-400 fill-amber-400" : "text-white/10"}`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-semibold text-white/60">{f.score}/5</span>
                      </div>
                    </div>
                    <div className="ml-12 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                      <p className="text-xs text-white/60 leading-relaxed italic">
                        "{ar ? f.comments_ar : f.comments}"
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* Distribution Chart Tab */}
        {tab === "chart" && (
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
            <h3 className="text-sm font-semibold text-white/80 mb-6">
              {ar ? "توزيع درجات الأداء" : "Performance Score Distribution"}
            </h3>
            <div className="space-y-4">
              {distribution.map((d, i) => (
                <div key={d.label} className="flex items-center gap-4">
                  <span className="text-xs text-white/50 w-12 text-right font-mono">{d.label}</span>
                  <div className="flex-1 h-8 bg-white/5 rounded-lg overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(d.count / maxDist) * 100}%` }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
                      className={`h-full rounded-lg ${d.color} flex items-center justify-end pr-3`}
                    >
                      {d.count > 0 && (
                        <span className="text-xs font-bold text-white">{d.count}</span>
                      )}
                    </motion.div>
                  </div>
                  <span className="text-xs text-white/40 w-8 text-center">
                    {d.count} {ar ? "موظف" : "emp"}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-400">
                  {filteredReviews.filter((r) => r.final_score >= 90).length}
                </p>
                <p className="text-xs text-white/40">{ar ? "ممتاز (90+)" : "Excellent (90+)"}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-400">
                  {filteredReviews.filter((r) => r.final_score >= 75 && r.final_score < 90).length}
                </p>
                <p className="text-xs text-white/40">{ar ? "جيد جداً (75-89)" : "Good (75-89)"}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-400">
                  {filteredReviews.filter((r) => r.final_score >= 60 && r.final_score < 75).length}
                </p>
                <p className="text-xs text-white/40">{ar ? "مقبول (60-74)" : "Fair (60-74)"}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400">
                  {filteredReviews.filter((r) => r.final_score < 60).length}
                </p>
                <p className="text-xs text-white/40">{ar ? "يحتاج تحسين (<60)" : "Needs Work (<60)"}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Review Detail Modal */}
      <AnimatePresence>
        {selectedReview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedReview(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-[#12162a] border border-white/10 shadow-2xl shadow-black/40"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-white/5 bg-[#12162a]/95 backdrop-blur-sm rounded-t-2xl">
                <div className="flex items-center gap-3">
                  {(() => {
                    const emp = empMap.get(selectedReview.employee_id);
                    return (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                        style={{ backgroundColor: emp?.avatar_color ?? "#666" }}
                      >
                        {emp ? (ar ? emp.full_name_ar[0] : emp.full_name[0]) : "?"}
                      </div>
                    );
                  })()}
                  <div>
                    <h2 className="text-base font-bold text-white/90">
                      {empName(selectedReview.employee_id)}
                    </h2>
                    <p className="text-xs text-white/40">{selectedReview.period}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReview(null)}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Score Cards */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: ar ? "تقييم ذاتي" : "Self Review", value: selectedReview.self_score },
                    { label: ar ? "تقييم المدير" : "Manager Review", value: selectedReview.manager_score },
                    { label: ar ? "النتيجة النهائية" : "Final Score", value: selectedReview.final_score },
                  ].map((s) => (
                    <div key={s.label} className={`text-center p-4 rounded-xl border ${scoreBg(s.value)}`}>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">{s.label}</p>
                      <p className={`text-2xl font-bold ${scoreColor(s.value)}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Reviewer */}
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <Users className="w-3.5 h-3.5" />
                  <span>{ar ? "المراجع:" : "Reviewer:"} {ar ? selectedReview.reviewer_ar : selectedReview.reviewer}</span>
                  <span className="mx-1">·</span>
                  {statusBadge(selectedReview.status, ar)}
                </div>

                {/* Strengths */}
                <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                      {ar ? "نقاط القوة" : "Strengths"}
                    </h4>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed">
                    {ar ? selectedReview.strengths_ar : selectedReview.strengths}
                  </p>
                </div>

                {/* Improvements */}
                <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                      {ar ? "نقاط التحسين" : "Areas for Improvement"}
                    </h4>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed">
                    {ar ? selectedReview.improvements_ar : selectedReview.improvements}
                  </p>
                </div>

                {/* Goals Next */}
                <div className="rounded-xl bg-blue-500/5 border border-blue-500/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-blue-400" />
                    <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                      {ar ? "الأهداف القادمة" : "Goals for Next Period"}
                    </h4>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed">
                    {ar ? selectedReview.goals_next_ar : selectedReview.goals_next}
                  </p>
                </div>

                {/* Timeline */}
                <div className="flex items-center justify-between text-xs text-white/30 pt-2 border-t border-white/5">
                  <span>{ar ? "أنشئ:" : "Created:"} {selectedReview.created_at.slice(0, 10)}</span>
                  {selectedReview.completed_at && (
                    <span>{ar ? "اكتمل:" : "Completed:"} {selectedReview.completed_at.slice(0, 10)}</span>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
