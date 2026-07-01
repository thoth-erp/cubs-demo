/**
 * Training & Development — التدريب والتطوير
 *
 * Courses, enrollments, certifications, and training KPIs
 */

import { useState, useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { useLocation } from "wouter";
import {
  HR_TRAINING_COURSES,
  HR_TRAINING_ENROLLMENTS,
  HR_CERTIFICATIONS,
  HR_METRICS,
  type TrainingCourse,
  type TrainingEnrollment,
  type Certification,
} from "../lib/hr-data-full";
import {
  GraduationCap, Users, TrendingUp, Clock, DollarSign, Award,
  Plus, Search, Filter, BookOpen, Play, CheckCircle2, AlertTriangle,
  X, Eye, FileText, Download, ChevronRight, Calendar, Building2,
  User, BarChart3, Target, Shield, ArrowUpRight, ArrowDownRight,
  ExternalLink, Briefcase, Star, Percent,
} from "lucide-react";

/* ─── Helpers ──────────────────────────────────────────────── */

function formatEGP(n: number) {
  return new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", minimumFractionDigits: 0 }).format(n);
}

const EASE = [0.16, 1, 0.3, 1] as const;
const serif: React.CSSProperties = { fontFamily: "var(--app-font-serif)" };

/* ─── Animation Variants ───────────────────────────────────── */

const cardV: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.35, ease: EASE },
  }),
};

/* ─── Metadata Maps ────────────────────────────────────────── */

const COURSE_TYPE_META: Record<string, { en: string; ar: string; color: string; bg: string }> = {
  orientation: { en: "Orientation", ar: "تأهيل", color: "text-blue-600", bg: "bg-blue-50" },
  technical: { en: "Technical", ar: "تقني", color: "text-violet-600", bg: "bg-violet-50" },
  leadership: { en: "Leadership", ar: "قيادة", color: "text-amber-600", bg: "bg-amber-50" },
  compliance: { en: "Compliance", ar: "امتثال", color: "text-rose-600", bg: "bg-rose-50" },
  soft_skills: { en: "Soft Skills", ar: "مهارات ناعمة", color: "text-teal-600", bg: "bg-teal-50" },
  safety: { en: "Safety", ar: "سلامة", color: "text-emerald-600", bg: "bg-emerald-50" },
};

const COURSE_STATUS_META: Record<string, { en: string; ar: string; pill: string }> = {
  scheduled: { en: "Scheduled", ar: "مجدول", pill: "bg-blue-100 text-blue-700" },
  in_progress: { en: "In Progress", ar: "قيد التنفيذ", pill: "bg-amber-100 text-amber-700" },
  completed: { en: "Completed", ar: "مكتمل", pill: "bg-emerald-100 text-emerald-700" },
  cancelled: { en: "Cancelled", ar: "ملغي", pill: "bg-zinc-100 text-zinc-500" },
};

const ENROLL_STATUS_META: Record<string, { en: string; ar: string; pill: string }> = {
  enrolled: { en: "Enrolled", ar: "مسجل", pill: "bg-blue-100 text-blue-700" },
  in_progress: { en: "In Progress", ar: "قيد التنفيذ", pill: "bg-amber-100 text-amber-700" },
  completed: { en: "Completed", ar: "مكتمل", pill: "bg-emerald-100 text-emerald-700" },
  dropped: { en: "Dropped", ar: "منسحب", pill: "bg-rose-100 text-rose-600" },
};

const CERT_STATUS_META: Record<string, { en: string; ar: string; color: string; bg: string }> = {
  valid: { en: "Valid", ar: "صالح", color: "text-emerald-700", bg: "bg-emerald-100" },
  expired: { en: "Expired", ar: "منتهي", color: "text-rose-600", bg: "bg-rose-100" },
  expiring_soon: { en: "Expiring Soon", ar: "ينتهي قريباً", color: "text-amber-600", bg: "bg-amber-100" },
};

/* ─── Progress Bar Component ───────────────────────────────── */

function ProgressBar({ value, color }: { value: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: EASE }}
          className={`h-full rounded-full ${color || (value >= 80 ? "bg-emerald-500" : value >= 50 ? "bg-amber-500" : "bg-blue-500")}`}
        />
      </div>
      <span className="text-[10px] font-medium text-muted-foreground w-8 text-right">{value}%</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* Main Component                                             */
/* ═══════════════════════════════════════════════════════════ */

export default function HRTraining() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [, navigate] = useLocation();

  const [searchQ, setSearchQ] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedCourse, setSelectedCourse] = useState<TrainingCourse | null>(null);
  const [activeTab, setActiveTab] = useState<"courses" | "enrollments" | "certifications">("courses");

  /* ─── Computed Data ───────────────────────────────────────── */

  const filteredCourses = useMemo(() => {
    let list = [...HR_TRAINING_COURSES];
    if (filterType !== "all") list = list.filter(c => c.type === filterType);
    if (filterStatus !== "all") list = list.filter(c => c.status === filterStatus);
    if (searchQ) {
      const q = searchQ.toLowerCase();
      list = list.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.title_ar.includes(searchQ) ||
        c.instructor.toLowerCase().includes(q) ||
        c.instructor_ar.includes(searchQ)
      );
    }
    return list;
  }, [searchQ, filterType, filterStatus]);

  const filteredEnrollments = useMemo(() => {
    let list = [...HR_TRAINING_ENROLLMENTS];
    if (searchQ) {
      const q = searchQ.toLowerCase();
      list = list.filter(e =>
        e.employee_name.toLowerCase().includes(q) ||
        e.employee_name_ar.includes(searchQ)
      );
    }
    return list;
  }, [searchQ]);

  const filteredCertifications = useMemo(() => {
    let list = [...HR_CERTIFICATIONS];
    if (searchQ) {
      const q = searchQ.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.name_ar.includes(searchQ) ||
        c.issuer.toLowerCase().includes(q)
      );
    }
    return list;
  }, [searchQ]);

  /* ─── KPIs ────────────────────────────────────────────────── */

  const activeCourses = HR_TRAINING_COURSES.filter(c => c.status === "in_progress" || c.status === "scheduled").length;
  const totalEnrollments = HR_TRAINING_ENROLLMENTS.length;
  const completedEnrollments = HR_TRAINING_ENROLLMENTS.filter(e => e.status === "completed").length;
  const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;
  const trainingHoursYTD = HR_METRICS.training_hours_ytd;
  const budgetUsed = HR_METRICS.training_budget_used;
  const budgetTotal = HR_METRICS.training_budget_total;
  const budgetPct = budgetTotal > 0 ? Math.round((budgetUsed / budgetTotal) * 100) : 0;
  const certsExpiring = HR_CERTIFICATIONS.filter(c => c.status === "expiring_soon" || c.status === "expired").length;

  const kpis = [
    {
      label: ar ? "الدورات النشطة" : "Active Courses",
      value: activeCourses,
      icon: BookOpen,
      color: "text-blue-600",
      bg: "bg-blue-50/80",
    },
    {
      label: ar ? "إجمالي التسجيلات" : "Total Enrollments",
      value: totalEnrollments,
      icon: Users,
      color: "text-violet-600",
      bg: "bg-violet-50/80",
    },
    {
      label: ar ? "نسبة الإكمال" : "Completion Rate",
      value: `${completionRate}%`,
      icon: Target,
      color: "text-emerald-600",
      bg: "bg-emerald-50/80",
    },
    {
      label: ar ? "ساعات التدريب" : "Training Hours YTD",
      value: trainingHoursYTD,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50/80",
    },
    {
      label: ar ? "الميزانية المستخدمة" : "Budget Used",
      value: `${formatEGP(budgetUsed)} / ${formatEGP(budgetTotal)}`,
      icon: DollarSign,
      color: budgetPct > 80 ? "text-rose-600" : "text-primary",
      bg: budgetPct > 80 ? "bg-rose-50/80" : "bg-primary/5",
      sub: `${budgetPct}% ${ar ? "من الإجمالي" : "of total"}`,
    },
    {
      label: ar ? "شهادات منتهية" : "Certs Expiring",
      value: certsExpiring,
      icon: AlertTriangle,
      color: certsExpiring > 0 ? "text-rose-600" : "text-emerald-600",
      bg: certsExpiring > 0 ? "bg-rose-50/80" : "bg-emerald-50/80",
    },
  ];

  /* ─── Course Detail Modal Data ────────────────────────────── */

  const courseEnrollments = useMemo(() => {
    if (!selectedCourse) return [];
    return HR_TRAINING_ENROLLMENTS.filter(e => e.course_id === selectedCourse.id);
  }, [selectedCourse]);

  /* ═══════════════════════════════════════════════════════════ */
  /* Render                                                     */
  /* ═══════════════════════════════════════════════════════════ */

  return (
    <div className="min-h-full px-6 md:px-8 py-6 max-w-[1400px] mx-auto space-y-5">

      {/* ─── Header ─────────────────────────────────────────── */}
      <motion.div variants={cardV} custom={0} initial="hidden" animate="visible" className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold" style={serif}>
            {ar ? "التدريب والتطوير" : "Training & Development"}
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            {ar ? "إدارة الدورات والتسجيلات والشهادات" : "Manage courses, enrollments, and certifications"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-9 px-4 rounded-xl border border-border/60 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex items-center gap-1.5">
            <Download size={12} /> {ar ? "تصدير" : "Export"}
          </button>
          <button className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-[11px] font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5">
            <Plus size={13} /> {ar ? "دورة جديدة" : "New Course"}
          </button>
        </div>
      </motion.div>

      {/* ─── KPI Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi, i) => (
          <motion.div key={i} variants={cardV} custom={i + 1} initial="hidden" animate="visible"
            className={`${kpi.bg} rounded-xl p-4 border border-border/30`}>
            <div className="flex items-center justify-between mb-2">
              <kpi.icon size={15} className={kpi.color} />
            </div>
            <p className="text-[18px] font-bold text-foreground" style={serif}>{kpi.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.label}</p>
            {"sub" in kpi && kpi.sub && (
              <p className="text-[9px] text-muted-foreground/60 mt-0.5">{kpi.sub}</p>
            )}
          </motion.div>
        ))}
      </div>

      {/* ─── Filters & Tabs ─────────────────────────────────── */}
      <motion.div variants={cardV} custom={7} initial="hidden" animate="visible"
        className="flex flex-wrap items-center gap-3">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-1">
          {(["courses", "enrollments", "certifications"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`h-8 px-4 rounded-lg text-[11px] font-medium transition-all ${
                activeTab === tab
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}>
              {tab === "courses" ? (ar ? "الدورات" : "Courses")
                : tab === "enrollments" ? (ar ? "التسجيلات" : "Enrollments")
                : (ar ? "الشهادات" : "Certifications")}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
            className="w-52 h-8 pl-8 pr-3 rounded-lg border border-border bg-background text-[11px] placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30"
            placeholder={ar ? "بحث..." : "Search..."} />
        </div>

        {/* Type filter (courses tab) */}
        {activeTab === "courses" && (
          <>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="h-8 px-2 rounded-lg border border-border bg-background text-[11px] cursor-pointer">
              <option value="all">{ar ? "كل الأنواع" : "All Types"}</option>
              {Object.entries(COURSE_TYPE_META).map(([key, meta]) => (
                <option key={key} value={key}>{ar ? meta.ar : meta.en}</option>
              ))}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="h-8 px-2 rounded-lg border border-border bg-background text-[11px] cursor-pointer">
              <option value="all">{ar ? "كل الحالات" : "All Status"}</option>
              {Object.entries(COURSE_STATUS_META).map(([key, meta]) => (
                <option key={key} value={key}>{ar ? meta.ar : meta.en}</option>
              ))}
            </select>
          </>
        )}
      </motion.div>

      {/* ─── Tab: Courses ───────────────────────────────────── */}
      {activeTab === "courses" && (
        <motion.div variants={cardV} custom={8} initial="hidden" animate="visible"
          className="p-5 rounded-xl border border-border/40 bg-background">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold flex items-center gap-2">
              <BookOpen size={14} className="text-primary" />
              {ar ? "الدورات التدريبية" : "Training Courses"}
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                {filteredCourses.length}
              </span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCourses.map((course) => {
              const typeMeta = COURSE_TYPE_META[course.type];
              const statusMeta = COURSE_STATUS_META[course.status];
              const enrolled = HR_TRAINING_ENROLLMENTS.filter(e => e.course_id === course.id).length;
              return (
                <div key={course.id}
                  onClick={() => setSelectedCourse(course)}
                  className="p-4 rounded-xl border border-border/40 bg-background cursor-pointer hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${typeMeta.bg} ${typeMeta.color}`}>
                      {ar ? typeMeta.ar : typeMeta.en}
                    </span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${statusMeta.pill}`}>
                      {ar ? statusMeta.ar : statusMeta.en}
                    </span>
                  </div>

                  <h4 className="text-[13px] font-medium mb-1 group-hover:text-primary transition-colors">
                    {ar ? course.title_ar : course.title}
                  </h4>
                  <p className="text-[10px] text-muted-foreground line-clamp-2 mb-3">
                    {ar ? course.description_ar : course.description}
                  </p>

                  <div className="space-y-2 text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <User size={10} />
                      <span>{ar ? course.instructor_ar : course.instructor}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={10} />
                      <span>{course.duration_hours} {ar ? "ساعة" : "hours"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Building2 size={10} />
                      <span>{course.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users size={10} />
                      <span>{enrolled}/{course.max_participants} {ar ? "مشارك" : "participants"}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                    <span className="text-[10px] text-muted-foreground">
                      <Calendar size={10} className="inline mr-1" />
                      {course.start_date} → {course.end_date}
                    </span>
                    {course.cost > 0 ? (
                      <span className="text-[10px] font-medium text-primary">{formatEGP(course.cost)}</span>
                    ) : (
                      <span className="text-[10px] font-medium text-emerald-600">{ar ? "مجاني" : "Free"}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-12 text-[12px] text-muted-foreground/40">
              {ar ? "لا توجد دورات" : "No courses found"}
            </div>
          )}
        </motion.div>
      )}

      {/* ─── Tab: Enrollments ───────────────────────────────── */}
      {activeTab === "enrollments" && (
        <motion.div variants={cardV} custom={8} initial="hidden" animate="visible"
          className="rounded-xl border border-border/40 bg-background overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
            <h3 className="text-[13px] font-semibold flex items-center gap-2">
              <GraduationCap size={14} className="text-violet-500" />
              {ar ? "تسجيلات الدورات" : "Course Enrollments"}
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                {filteredEnrollments.length}
              </span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-border/30 bg-muted/20">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">{ar ? "الموظف" : "Employee"}</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">{ar ? "الدورة" : "Course"}</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground min-w-[180px]">{ar ? "التقدم" : "Progress"}</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">{ar ? "الدرجة" : "Score"}</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">{ar ? "الحالة" : "Status"}</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">{ar ? "الشهادة" : "Certificate"}</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnrollments.map((enrollment) => {
                  const course = HR_TRAINING_COURSES.find(c => c.id === enrollment.course_id);
                  const statusMeta = ENROLL_STATUS_META[enrollment.status];
                  return (
                    <tr key={enrollment.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold shrink-0">
                            {enrollment.employee_name.split(" ").map(w => w[0]).join("")}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{ar ? enrollment.employee_name_ar : enrollment.employee_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-foreground">{course ? (ar ? course.title_ar : course.title) : "—"}</span>
                      </td>
                      <td className="px-5 py-3">
                        <ProgressBar value={enrollment.progress} />
                      </td>
                      <td className="px-5 py-3">
                        {enrollment.score !== null ? (
                          <span className={`font-medium ${enrollment.score >= 80 ? "text-emerald-600" : enrollment.score >= 60 ? "text-amber-600" : "text-rose-600"}`}>
                            {enrollment.score}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${statusMeta.pill}`}>
                          {ar ? statusMeta.ar : statusMeta.en}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {enrollment.certificate_url ? (
                          <a href={enrollment.certificate_url}
                            className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline">
                            <ExternalLink size={10} />
                            {ar ? "عرض" : "View"}
                          </a>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredEnrollments.length === 0 && (
            <div className="text-center py-12 text-[12px] text-muted-foreground/40">
              {ar ? "لا توجد تسجيلات" : "No enrollments found"}
            </div>
          )}
        </motion.div>
      )}

      {/* ─── Tab: Certifications ────────────────────────────── */}
      {activeTab === "certifications" && (
        <motion.div variants={cardV} custom={8} initial="hidden" animate="visible"
          className="rounded-xl border border-border/40 bg-background overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
            <h3 className="text-[13px] font-semibold flex items-center gap-2">
              <Award size={14} className="text-amber-500" />
              {ar ? "الشهادات المهنية" : "Professional Certifications"}
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                {filteredCertifications.length}
              </span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-border/30 bg-muted/20">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">{ar ? "الموظف" : "Employee"}</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">{ar ? "الشهادة" : "Certification"}</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">{ar ? "الجهة المصدرة" : "Issuer"}</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">{ar ? "تاريخ الإصدار" : "Issue Date"}</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">{ar ? "تاريخ الانتهاء" : "Expiry Date"}</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">{ar ? "الحالة" : "Status"}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCertifications.map((cert) => {
                  const statusMeta = CERT_STATUS_META[cert.status];
                  return (
                    <tr key={cert.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                      <td className="px-5 py-3">
                        <span className="font-medium text-foreground">{cert.employee_id}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div>
                          <p className="font-medium text-foreground">{ar ? cert.name_ar : cert.name}</p>
                          <p className="text-[9px] text-muted-foreground/60 mt-0.5">{cert.certificate_number}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{cert.issuer}</td>
                      <td className="px-5 py-3 text-muted-foreground">{cert.issue_date}</td>
                      <td className="px-5 py-3 text-muted-foreground">{cert.expiry_date || "—"}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-medium ${statusMeta.bg} ${statusMeta.color}`}>
                          {cert.status === "expired" && <AlertTriangle size={9} />}
                          {cert.status === "expiring_soon" && <Clock size={9} />}
                          {cert.status === "valid" && <CheckCircle2 size={9} />}
                          {ar ? statusMeta.ar : statusMeta.en}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredCertifications.length === 0 && (
            <div className="text-center py-12 text-[12px] text-muted-foreground/40">
              {ar ? "لا توجد شهادات" : "No certifications found"}
            </div>
          )}
        </motion.div>
      )}

      {/* ─── Course Detail Modal ────────────────────────────── */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedCourse(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="relative w-full max-w-lg bg-background rounded-2xl border border-border shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BookOpen size={18} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold" style={serif}>
                    {ar ? selectedCourse.title_ar : selectedCourse.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${COURSE_TYPE_META[selectedCourse.type].bg} ${COURSE_TYPE_META[selectedCourse.type].color}`}>
                      {ar ? COURSE_TYPE_META[selectedCourse.type].ar : COURSE_TYPE_META[selectedCourse.type].en}
                    </span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${COURSE_STATUS_META[selectedCourse.status].pill}`}>
                      {ar ? COURSE_STATUS_META[selectedCourse.status].ar : COURSE_STATUS_META[selectedCourse.status].en}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedCourse(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 overflow-y-auto flex-1">
              {/* Description */}
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">{ar ? "الوصف" : "Description"}</p>
                <p className="text-[12px] text-foreground">{ar ? selectedCourse.description_ar : selectedCourse.description}</p>
              </div>

              {/* Course Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-muted/30">
                  <p className="text-[9px] text-muted-foreground mb-1">{ar ? "المدرب" : "Instructor"}</p>
                  <p className="text-[11px] font-medium">{ar ? selectedCourse.instructor_ar : selectedCourse.instructor}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30">
                  <p className="text-[9px] text-muted-foreground mb-1">{ar ? "المدة" : "Duration"}</p>
                  <p className="text-[11px] font-medium">{selectedCourse.duration_hours} {ar ? "ساعة" : "hours"}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30">
                  <p className="text-[9px] text-muted-foreground mb-1">{ar ? "المكان" : "Location"}</p>
                  <p className="text-[11px] font-medium">{selectedCourse.location}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30">
                  <p className="text-[9px] text-muted-foreground mb-1">{ar ? "التكلفة" : "Cost"}</p>
                  <p className="text-[11px] font-medium">
                    {selectedCourse.cost > 0 ? formatEGP(selectedCourse.cost) : (ar ? "مجاني" : "Free")}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30">
                  <p className="text-[9px] text-muted-foreground mb-1">{ar ? "التواريخ" : "Dates"}</p>
                  <p className="text-[11px] font-medium">{selectedCourse.start_date} → {selectedCourse.end_date}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30">
                  <p className="text-[9px] text-muted-foreground mb-1">{ar ? "المسجلين" : "Enrolled"}</p>
                  <p className="text-[11px] font-medium">{courseEnrollments.length}/{selectedCourse.max_participants}</p>
                </div>
              </div>

              {/* Materials */}
              <div>
                <h4 className="text-[12px] font-semibold mb-2 flex items-center gap-1.5">
                  <FileText size={13} className="text-primary" />
                  {ar ? "المواد التدريبية" : "Training Materials"}
                </h4>
                <div className="space-y-1.5">
                  {(ar ? selectedCourse.materials_ar : selectedCourse.materials).map((mat, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/20 text-[11px]">
                      <BookOpen size={11} className="text-primary/60 shrink-0" />
                      <span>{mat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enrolled Participants */}
              <div>
                <h4 className="text-[12px] font-semibold mb-2 flex items-center gap-1.5">
                  <Users size={13} className="text-violet-500" />
                  {ar ? "المسجلون" : "Enrolled Participants"}
                </h4>
                {courseEnrollments.length > 0 ? (
                  <div className="space-y-2">
                    {courseEnrollments.map((enrollment) => {
                      const enrollMeta = ENROLL_STATUS_META[enrollment.status];
                      return (
                        <div key={enrollment.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold shrink-0">
                              {enrollment.employee_name.split(" ").map(w => w[0]).join("")}
                            </div>
                            <div>
                              <p className="text-[11px] font-medium">{ar ? enrollment.employee_name_ar : enrollment.employee_name}</p>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${enrollMeta.pill}`}>
                                {ar ? enrollMeta.ar : enrollMeta.en}
                              </span>
                            </div>
                          </div>
                          <div className="w-24">
                            <ProgressBar value={enrollment.progress} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-[11px] text-muted-foreground/40 rounded-xl bg-muted/10">
                    {ar ? "لا يوجد مسجلون بعد" : "No enrollments yet"}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-border/40 flex items-center justify-between shrink-0">
              <button onClick={() => setSelectedCourse(null)}
                className="h-9 px-4 rounded-xl border border-border text-[11px] font-medium text-muted-foreground hover:bg-muted transition-colors">
                {ar ? "إغلاق" : "Close"}
              </button>
              <button className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-[11px] font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5">
                <Plus size={12} /> {ar ? "تسجيل موظف" : "Enroll Employee"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
