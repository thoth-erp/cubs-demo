/**
 * HR Dashboard — Comprehensive Command Center
 *
 * People-first operating system: Who needs attention?
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { useLocation } from "wouter";
import {
  HR_EMPLOYEES, HR_ATTENDANCE, HR_LEAVES, HR_ALERTS, HR_DEPARTMENTS, HR_TIMELINE, HR_PAYROLL,
  type HREmployee, type HRAlert,
} from "../lib/hr-data";
import {
  HR_METRICS, HR_HEADCOUNT_TREND, HR_TURNOVER_BY_DEPT,
} from "../lib/hr-data-full";
import {
  Users, UserPlus, Clock, AlertTriangle, Calendar, DollarSign, TrendingUp,
  Briefcase, FileText, CheckCircle2, ChevronRight, Bell, Star, Shield,
  Coffee, Eye, Target, ArrowUpRight, ArrowDownRight,
  Activity, Heart, Zap, MapPin, Search, Building2,
  TrendingDown, Minus, X, Plus, MessageSquare, Banknote, BarChart3,
  UserCheck, Award, Percent, Gauge, SmilePlus, GraduationCap,
} from "lucide-react";

/* ─── Helpers ──────────────────────────────────────────────── */

function formatEGP(n: number) {
  return new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", minimumFractionDigits: 0 }).format(n);
}

const EASE = [0.16, 1, 0.3, 1] as const;
const serif: React.CSSProperties = { fontFamily: "var(--app-font-serif)" };

/* ─── Animation Variants ───────────────────────────────────── */

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

const cardV: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.35, ease: EASE },
  }),
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: EASE } },
};

const slideIn: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: EASE } },
};

/* ─── Department Metadata ──────────────────────────────────── */

const DEPT_META: Record<string, { en: string; ar: string; color: string }> = {
  management: { en: "Management", ar: "الإدارة العليا", color: "#1E3A5F" },
  sales: { en: "Sales", ar: "المبيعات", color: "#E07A5F" },
  production: { en: "Production", ar: "الإنتاج", color: "#3B82F6" },
  design: { en: "Design", ar: "التصميم", color: "#EC4899" },
  warehouse: { en: "Warehouse", ar: "المخزن", color: "#F59E0B" },
  delivery: { en: "Delivery", ar: "التوصيل", color: "#F97316" },
  admin: { en: "Admin", ar: "الإدارة", color: "#10B981" },
};

/* ─── Timeline Event Icons ─────────────────────────────────── */

const TIMELINE_ICONS: Record<string, React.ElementType> = {
  joined: UserPlus, contract_signed: FileText, salary_changed: DollarSign,
  promoted: Star, leave_taken: Coffee, warning_issued: AlertTriangle,
  bonus_added: Award, review_completed: CheckCircle2, equipment_assigned: Shield,
  resigned: ArrowDownRight, terminated: ArrowDownRight,
  probation_started: Clock, "probation Ended": CheckCircle2,
  attendance_issue: AlertTriangle, document_uploaded: FileText,
};

/* ─── Main Component ───────────────────────────────────────── */

export default function HRDashboard() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [, navigate] = useLocation();
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  /* ─── Derived Stats ──────────────────────────────────────── */

  const stats = useMemo(() => {
    const active = HR_EMPLOYEES.filter((e) => e.status === "active").length;
    const onLeave = HR_EMPLOYEES.filter((e) => e.status === "on_leave").length;
    const probation = HR_EMPLOYEES.filter((e) => e.status === "probation").length;
    const suspended = HR_EMPLOYEES.filter((e) => e.status === "suspended").length;
    const terminated = HR_EMPLOYEES.filter((e) => e.status === "terminated").length;
    const pendingLeaves = HR_LEAVES.filter((l) => l.status === "pending").length;
    const totalPayroll = HR_PAYROLL.filter((p) => p.status === "paid").reduce((s, p) => s + p.net_salary, 0);
    const pendingPayroll = HR_PAYROLL.filter((p) => p.status === "pending" || p.status === "draft").length;
    const criticalAlerts = HR_ALERTS.filter((a) => a.severity === "critical" && !dismissedAlerts.has(a.id)).length;
    const warningAlerts = HR_ALERTS.filter((a) => a.severity === "warning" && !dismissedAlerts.has(a.id)).length;
    const infoAlerts = HR_ALERTS.filter((a) => a.severity === "info" && !dismissedAlerts.has(a.id)).length;
    const openJobs = HR_METRICS.open_positions;
    return {
      active, onLeave, probation, suspended, terminated,
      pendingLeaves, totalPayroll, pendingPayroll,
      criticalAlerts, warningAlerts, infoAlerts, openJobs,
    };
  }, [dismissedAlerts]);

  const todayAttendance = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return HR_ATTENDANCE.filter((a) => a.date === today);
  }, []);

  const presentToday = todayAttendance.filter((a) => a.status === "present").length;
  const lateToday = todayAttendance.filter((a) => a.status === "late").length;
  const absentToday = todayAttendance.filter((a) => a.status === "absent").length;
  const onLeaveToday = todayAttendance.filter((a) => a.status === "annual_leave" || a.status === "sick_leave").length;

  const departmentBreakdown = useMemo(() => {
    return Object.entries(DEPT_META)
      .map(([key, meta]) => ({
        ...meta,
        key,
        count: HR_EMPLOYEES.filter((e) => e.department === key && e.status === "active").length,
      }))
      .filter((d) => d.count > 0)
      .sort((a, b) => b.count - a.count);
  }, []);

  const recentTimeline = HR_TIMELINE.slice(0, 8);

  const totalAlerts = HR_ALERTS.filter((a) => !dismissedAlerts.has(a.id)).length;

  /* ─── KPI Data ───────────────────────────────────────────── */

  const kpis = [
    {
      label: ar ? "عدد الموظفين" : "Headcount",
      value: HR_METRICS.total_headcount,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
      detail: `${HR_METRICS.active_employees} ${ar ? "نشط" : "active"}`,
    },
    {
      label: ar ? "توظيفات العام" : "New Hires YTD",
      value: HR_METRICS.new_hires_ytd,
      icon: UserPlus,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      detail: `${ar ? "متوسط مدة التوظيف" : "Avg time to fill"}: ${HR_METRICS.time_to_fill_days}d`,
    },
    {
      label: ar ? "نسبة الدوران" : "Turnover Rate",
      value: `${HR_METRICS.turnover_rate}%`,
      icon: TrendingDown,
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-100",
      detail: `${HR_TURNOVER_BY_DEPT.filter((t) => t.rate > 0).length} ${ar ? "أقسام" : "depts affected"}`,
    },
    {
      label: ar ? "فتحات التوظيف" : "Open Positions",
      value: HR_METRICS.open_positions,
      icon: Briefcase,
      color: "text-violet-600",
      bg: "bg-violet-50",
      border: "border-violet-100",
      detail: `${HR_METRICS.offer_acceptance_rate}% ${ar ? "معدل القبول" : "acceptance"}`,
    },
    {
      label: ar ? "ميزانية التدريب" : "Training Budget",
      value: `${Math.round((HR_METRICS.training_budget_used / HR_METRICS.training_budget_total) * 100)}%`,
      icon: GraduationCap,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
      detail: formatEGP(HR_METRICS.training_budget_used),
    },
    {
      label: ar ? "التوافق" : "Compliance",
      value: `${HR_METRICS.compliance_score}%`,
      icon: Shield,
      color: "text-teal-600",
      bg: "bg-teal-50",
      border: "border-teal-100",
      detail: `${HR_METRICS.safety_incidents_ytd} ${ar ? "حوادث" : "incidents"}`,
    },
    {
      label: ar ? "رضا الموظفين" : "Satisfaction",
      value: `${HR_METRICS.employee_satisfaction}/5`,
      icon: SmilePlus,
      color: "text-pink-600",
      bg: "bg-pink-50",
      border: "border-pink-100",
      detail: `${HR_METRICS.avg_tenure_months} ${ar ? "شهر متوسط" : "mo avg tenure"}`,
    },
    {
      label: ar ? "نسبة الغياب" : "Absenteeism",
      value: `${HR_METRICS.absenteeism_rate}%`,
      icon: Clock,
      color: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-100",
      detail: `${HR_METRICS.overtime_hours_monthly}h ${ar ? "إضافي" : "overtime"}`,
    },
  ];

  /* ─── Render ─────────────────────────────────────────────── */

  return (
    <div className="min-h-full px-6 md:px-8 py-6 max-w-[1440px] mx-auto space-y-6">
      {/* ── Header ────────────────────────────────────────── */}
      <motion.div
        variants={cardV}
        custom={0}
        initial="hidden"
        animate="visible"
        className="flex items-center justify-between"
      >
        <div>
          <h1
            className="text-[24px] font-semibold tracking-tight"
            style={serif}
          >
            {ar ? "لوحة تحكم الموارد البشرية" : "HR Dashboard"}
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            {ar ? "من يحتاج انتباهك الآن؟" : "Who needs your attention right now?"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[
            { label: ar ? "الموظفين" : "Employees", icon: Users, path: "/hr/employees" },
            { label: ar ? "التوظيف" : "Recruitment", icon: Briefcase, path: "/hr/recruitment" },
            { label: ar ? "المؤسسة" : "Org", icon: Target, path: "/hr/org" },
          ].map((btn) => (
            <button
              key={btn.path}
              onClick={() => navigate(btn.path)}
              className="h-9 px-4 rounded-xl border border-border/60 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 flex items-center gap-1.5"
            >
              <btn.icon size={12} />
              {btn.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── KPI Cards (8 metrics) ────────────────────────── */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {kpis.map((kpi, i) => (
          <motion.div
            key={i}
            variants={fadeUp}
            className={`${kpi.bg} rounded-2xl p-4 border ${kpi.border} hover:shadow-md transition-shadow duration-200 cursor-default`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-8 h-8 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                <kpi.icon size={15} className={kpi.color} />
              </div>
            </div>
            <p
              className="text-[22px] font-bold text-foreground leading-none"
              style={serif}
            >
              {kpi.value}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">
              {kpi.label}
            </p>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">
              {kpi.detail}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Quick Actions ─────────────────────────────────── */}
      <motion.div variants={cardV} custom={2} initial="hidden" animate="visible">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-medium text-muted-foreground mr-1">
            {ar ? "إجراءات سريعة:" : "Quick Actions:"}
          </span>
          {[
            { label: ar ? "موظف جديد" : "New Employee", icon: UserPlus, path: "/hr/employees", color: "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100" },
            { label: ar ? "جدولة مقابلة" : "Schedule Interview", icon: Calendar, path: "/hr/recruitment", color: "bg-violet-50 text-violet-600 border-violet-100 hover:bg-violet-100" },
            { label: ar ? "تشغيل المرتبات" : "Run Payroll", icon: Banknote, path: "/hr/payroll", color: "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100" },
            { label: ar ? "عرض التقارير" : "View Reports", icon: BarChart3, path: "/hr/reports", color: "bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100" },
          ].map((action) => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className={`h-8 px-3.5 rounded-xl border text-[11px] font-medium flex items-center gap-1.5 transition-all duration-200 ${action.color}`}
            >
              <action.icon size={12} />
              {action.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Critical Alerts ───────────────────────────────── */}
      {totalAlerts > 0 && (
        <motion.div variants={cardV} custom={3} initial="hidden" animate="visible">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold flex items-center gap-2">
              <AlertTriangle size={14} className="text-rose-500" />
              {ar ? "تنبيهات" : "Alerts"}
              {stats.criticalAlerts > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600 font-medium">
                  {stats.criticalAlerts} {ar ? "حرج" : "critical"}
                </span>
              )}
              {stats.warningAlerts > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 font-medium">
                  {stats.warningAlerts} {ar ? "تحذير" : "warning"}
                </span>
              )}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <AnimatePresence>
              {HR_ALERTS.filter((a) => !dismissedAlerts.has(a.id))
                .sort((a, b) => {
                  const order = { critical: 0, warning: 1, info: 2 };
                  return order[a.severity] - order[b.severity];
                })
                .slice(0, 4)
                .map((alert) => (
                  <motion.div
                    key={alert.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    className={`p-3.5 rounded-xl border hover:shadow-sm transition-shadow ${
                      alert.severity === "critical"
                        ? "border-rose-200 bg-rose-50/40"
                        : alert.severity === "warning"
                        ? "border-amber-200 bg-amber-50/40"
                        : "border-sky-200 bg-sky-50/40"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          alert.severity === "critical"
                            ? "bg-rose-100"
                            : alert.severity === "warning"
                            ? "bg-amber-100"
                            : "bg-sky-100"
                        }`}
                      >
                        <AlertTriangle
                          size={12}
                          className={
                            alert.severity === "critical"
                              ? "text-rose-600"
                              : alert.severity === "warning"
                              ? "text-amber-600"
                              : "text-sky-600"
                          }
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-foreground">
                          {ar ? alert.title_ar : alert.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                          {ar ? alert.description_ar : alert.description}
                        </p>
                        <p className="text-[9px] text-primary mt-1.5 font-medium flex items-center gap-1">
                          <Zap size={8} />
                          {ar ? alert.suggested_action_ar : alert.suggested_action}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setDismissedAlerts((prev) => new Set([...prev, alert.id]))
                        }
                        className="text-muted-foreground/40 hover:text-muted-foreground shrink-0 p-0.5 rounded-md hover:bg-muted/30 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* ── Attendance + Leave Requests ───────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Today's Attendance */}
        <motion.div
          variants={cardV}
          custom={4}
          initial="hidden"
          animate="visible"
          className="p-5 rounded-2xl border border-border/40 bg-background shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold flex items-center gap-2">
              <Clock size={14} className="text-blue-500" />
              {ar ? "حضور اليوم" : "Today's Attendance"}
            </h3>
            <span className="text-[10px] text-muted-foreground">
              {new Date().toLocaleDateString(ar ? "ar-EG" : "en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          {/* Attendance summary cards */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: ar ? "حاضر" : "Present", value: presentToday, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: ar ? "متأخر" : "Late", value: lateToday, color: "text-amber-600", bg: "bg-amber-50" },
              { label: ar ? "غائب" : "Absent", value: absentToday, color: "text-rose-600", bg: "bg-rose-50" },
              { label: ar ? "إجازة" : "On Leave", value: onLeaveToday, color: "text-sky-600", bg: "bg-sky-50" },
            ].map((s, i) => (
              <div key={i} className={`${s.bg} rounded-xl p-3 text-center`}>
                <p
                  className={`text-[20px] font-bold ${s.color}`}
                  style={serif}
                >
                  {s.value}
                </p>
                <p className="text-[9px] text-muted-foreground mt-0.5">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          {/* Attendance progress bar */}
          <div className="mb-4">
            <div className="h-2 rounded-full bg-muted/30 overflow-hidden flex">
              {todayAttendance.length > 0 && (
                <>
                  <div
                    className="h-full bg-emerald-400 transition-all"
                    style={{
                      width: `${(presentToday / todayAttendance.length) * 100}%`,
                    }}
                  />
                  <div
                    className="h-full bg-amber-400 transition-all"
                    style={{
                      width: `${(lateToday / todayAttendance.length) * 100}%`,
                    }}
                  />
                  <div
                    className="h-full bg-rose-400 transition-all"
                    style={{
                      width: `${(absentToday / todayAttendance.length) * 100}%`,
                    }}
                  />
                </>
              )}
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[8px] text-emerald-600 font-medium">
                {todayAttendance.length > 0
                  ? `${Math.round((presentToday / todayAttendance.length) * 100)}%`
                  : "0%"}{" "}
                {ar ? "حضور" : "present"}
              </span>
              <span className="text-[8px] text-muted-foreground">
                {todayAttendance.length} {ar ? "سجل" : "records"}
              </span>
            </div>
          </div>

          {/* Late/Absent employees */}
          <div className="space-y-1.5">
            {todayAttendance
              .filter((a) => a.status === "late" || a.status === "absent")
              .slice(0, 4)
              .map((a) => {
                const emp = HR_EMPLOYEES.find((e) => e.id === a.employee_id);
                if (!emp) return null;
                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/hr/employees/${emp.id}`)}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
                      style={{ backgroundColor: emp.avatar_color }}
                    >
                      {emp.full_name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")}
                    </div>
                    <span className="text-[11px] flex-1 truncate">
                      {ar ? emp.full_name_ar : emp.full_name}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                        a.status === "late"
                          ? "bg-amber-100 text-amber-600"
                          : "bg-rose-100 text-rose-600"
                      }`}
                    >
                      {a.status === "late"
                        ? ar
                          ? "متأخر"
                          : "Late"
                        : ar
                        ? "غائب"
                        : "Absent"}
                    </span>
                  </div>
                );
              })}
          </div>
        </motion.div>

        {/* Pending Leave Requests */}
        <motion.div
          variants={cardV}
          custom={5}
          initial="hidden"
          animate="visible"
          className="p-5 rounded-2xl border border-border/40 bg-background shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold flex items-center gap-2">
              <Calendar size={14} className="text-amber-500" />
              {ar ? "طلبات الإجازات" : "Pending Leave Requests"}
            </h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 font-medium">
              {stats.pendingLeaves}
            </span>
          </div>
          <div className="space-y-2">
            {HR_LEAVES.filter((l) => l.status === "pending").map((leave) => {
              const emp = HR_EMPLOYEES.find((e) => e.id === leave.employee_id);
              if (!emp) return null;
              const leaveTypes: Record<string, { en: string; ar: string }> = {
                annual: { en: "Annual", ar: "سنوية" },
                sick: { en: "Sick", ar: "مرضية" },
                emergency: { en: "Emergency", ar: "طارئة" },
                unpaid: { en: "Unpaid", ar: "بدون مرتب" },
                maternity: { en: "Maternity", ar: "أمومة" },
                paternity: { en: "Paternity", ar: "أبوية" },
                other: { en: "Other", ar: "أخرى" },
              };
              const lt = leaveTypes[leave.leave_type] || leaveTypes.other;
              return (
                <motion.div
                  key={leave.id}
                  variants={slideIn}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border/30 hover:bg-muted/20 transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                    style={{ backgroundColor: emp.avatar_color }}
                  >
                    {emp.full_name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium truncate">
                      {ar ? emp.full_name_ar : emp.full_name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {ar ? lt.ar : lt.en}
                      </span>
                      <span className="text-[9px] text-muted-foreground">
                        {leave.days} {ar ? "أيام" : "days"}
                      </span>
                    </div>
                    <p className="text-[9px] text-muted-foreground/70 mt-0.5 line-clamp-1">
                      {leave.reason}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button className="text-[9px] text-emerald-600 px-2.5 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-50 transition-colors font-medium">
                      {ar ? "موافقة" : "Approve"}
                    </button>
                    <button className="text-[9px] text-rose-600 px-2.5 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 transition-colors font-medium">
                      {ar ? "رفض" : "Reject"}
                    </button>
                  </div>
                </motion.div>
              );
            })}
            {HR_LEAVES.filter((l) => l.status === "pending").length === 0 && (
              <p className="text-[11px] text-muted-foreground text-center py-6">
                {ar ? "لا توجد طلبات معلقة" : "No pending requests"}
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Department Breakdown + Headcount Trend ────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Department Breakdown */}
        <motion.div
          variants={cardV}
          custom={6}
          initial="hidden"
          animate="visible"
          className="p-5 rounded-2xl border border-border/40 bg-background shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold flex items-center gap-2">
              <Building2 size={14} className="text-violet-500" />
              {ar ? "توزيع الأقسام" : "Department Breakdown"}
            </h3>
            <span className="text-[10px] text-muted-foreground">
              {stats.active} {ar ? "نشط" : "active"}
            </span>
          </div>
          <div className="space-y-3">
            {departmentBreakdown.map((dept, i) => (
              <div key={dept.key} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: dept.color + "15" }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: dept.color }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium">
                      {ar ? dept.ar : dept.en}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold">
                        {dept.count}
                      </span>
                      <span className="text-[9px] text-muted-foreground">
                        {Math.round((dept.count / stats.active) * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(dept.count / stats.active) * 100}%`,
                      }}
                      transition={{
                        duration: 0.8,
                        delay: i * 0.08,
                        ease: EASE,
                      }}
                      style={{ backgroundColor: dept.color }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Headcount Trend Mini Chart */}
        <motion.div
          variants={cardV}
          custom={7}
          initial="hidden"
          animate="visible"
          className="p-5 rounded-2xl border border-border/40 bg-background shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold flex items-center gap-2">
              <TrendingUp size={14} className="text-cyan-500" />
              {ar ? "اتجاه عدد الموظفين" : "Headcount Trend"}
            </h3>
          </div>

          {/* Mini bar chart */}
          <div className="flex items-end gap-2 h-32 mb-3">
            {HR_HEADCOUNT_TREND.map((m, i) => {
              const maxHC = Math.max(
                ...HR_HEADCOUNT_TREND.map((t) => t.headcount)
              );
              const barH = (m.headcount / maxHC) * 100;
              return (
                <div
                  key={m.month}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <span className="text-[8px] text-muted-foreground font-medium">
                    {m.headcount}
                  </span>
                  <div className="w-full relative">
                    <motion.div
                      className="w-full rounded-t-md bg-primary/80"
                      initial={{ height: 0 }}
                      animate={{ height: `${barH}%` }}
                      transition={{
                        duration: 0.6,
                        delay: i * 0.08,
                        ease: EASE,
                      }}
                      style={{ height: `${barH}%`, minHeight: "4px" }}
                    />
                    {m.new_hires > 0 && (
                      <div className="absolute -top-1 right-0 w-2 h-2 rounded-full bg-emerald-400" />
                    )}
                    {m.exits > 0 && (
                      <div className="absolute -top-1 left-0 w-2 h-2 rounded-full bg-rose-400" />
                    )}
                  </div>
                  <span className="text-[8px] text-muted-foreground">
                    {m.month}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 pt-2 border-t border-border/30">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary/80" />
              <span className="text-[9px] text-muted-foreground">
                {ar ? "عدد الموظفين" : "Headcount"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[9px] text-muted-foreground">
                {ar ? "توظيفات" : "Hires"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-rose-400" />
              <span className="text-[9px] text-muted-foreground">
                {ar ? "رحيل" : "Exits"}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Recent Activity + Turnover by Dept ────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent Activity Timeline */}
        <motion.div
          variants={cardV}
          custom={8}
          initial="hidden"
          animate="visible"
          className="p-5 rounded-2xl border border-border/40 bg-background shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold flex items-center gap-2">
              <Activity size={14} className="text-cyan-500" />
              {ar ? "آخر النشاطات" : "Recent Activity"}
            </h3>
          </div>
          <div className="space-y-0">
            {recentTimeline.map((event, i) => {
              const emp = HR_EMPLOYEES.find(
                (e) => e.id === event.employee_id
              );
              const Icon = TIMELINE_ICONS[event.type] || Activity;
              return (
                <div key={event.id} className="flex gap-3 py-2 relative">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground">
                      <Icon size={10} />
                    </div>
                    {i < recentTimeline.length - 1 && (
                      <div className="w-px flex-1 bg-border/30 my-0.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px]">
                      {emp && (
                        <span
                          className="font-medium text-primary cursor-pointer hover:underline"
                          onClick={() =>
                            navigate(`/hr/employees/${emp.id}`)
                          }
                        >
                          {ar ? emp.full_name_ar : emp.full_name}
                        </span>
                      )}{" "}
                      <span className="text-muted-foreground">
                        {ar ? event.title_ar : event.title}
                      </span>
                    </p>
                    <span className="text-[8px] text-muted-foreground/60">
                      {new Date(event.timestamp).toLocaleDateString(
                        ar ? "ar-EG" : "en-US",
                        { month: "short", day: "numeric" }
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Turnover by Department */}
        <motion.div
          variants={cardV}
          custom={9}
          initial="hidden"
          animate="visible"
          className="p-5 rounded-2xl border border-border/40 bg-background shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold flex items-center gap-2">
              <TrendingDown size={14} className="text-rose-500" />
              {ar ? "الدوران حسب القسم" : "Turnover by Department"}
            </h3>
          </div>
          <div className="space-y-3">
            {HR_TURNOVER_BY_DEPT.sort((a, b) => b.rate - a.rate).map(
              (dept, i) => (
                <div key={dept.department} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-medium">
                        {ar ? dept.department_ar : dept.department}
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-semibold ${
                            dept.rate > 10
                              ? "text-rose-600"
                              : dept.rate > 0
                              ? "text-amber-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {dept.rate}%
                        </span>
                        <span className="text-[9px] text-muted-foreground">
                          ({dept.count})
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min(dept.rate * 3, 100)}%`,
                        }}
                        transition={{
                          duration: 0.8,
                          delay: i * 0.08,
                          ease: EASE,
                        }}
                        style={{
                          backgroundColor:
                            dept.rate > 10
                              ? "#f43f5e"
                              : dept.rate > 0
                              ? "#f59e0b"
                              : "#10b981",
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Bottom Stats Row ──────────────────────────────── */}
      <motion.div
        variants={cardV}
        custom={10}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-6 gap-3"
      >
        {[
          {
            label: ar ? "تجربة" : "Probation",
            value: stats.probation,
            icon: Clock,
            color: "text-amber-600",
          },
          {
            label: ar ? "موقوف" : "Suspended",
            value: stats.suspended,
            icon: Shield,
            color: "text-rose-600",
          },
          {
            label: ar ? "منتهي" : "Terminated",
            value: stats.terminated,
            icon: ArrowDownRight,
            color: "text-zinc-500",
          },
          {
            label: ar ? "مرتبات معلقة" : "Pending Payroll",
            value: stats.pendingPayroll,
            icon: DollarSign,
            color: "text-violet-600",
          },
          {
            label: ar ? "ساعات تدريب" : "Training Hours",
            value: HR_METRICS.training_hours_ytd,
            icon: Award,
            color: "text-teal-600",
          },
          {
            label: ar ? "فروع" : "Branches",
            value: 2,
            icon: MapPin,
            color: "text-primary",
          },
        ].map((item, i) => (
          <div
            key={i}
            className="p-3 rounded-xl border border-border/40 bg-background text-center hover:shadow-sm transition-shadow"
          >
            <item.icon
              size={14}
              className={`${item.color} mx-auto mb-1.5`}
            />
            <p
              className="text-[16px] font-bold text-foreground"
              style={serif}
            >
              {item.value}
            </p>
            <p className="text-[9px] text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
