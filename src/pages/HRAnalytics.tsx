/**
 * HR Analytics & Strategy — 数据分析与战略
 *
 * Comprehensive analytics dashboard with workforce insights,
 * headcount trends, turnover analysis, and AI-powered recommendations.
 */

import { useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import {
  HR_METRICS, HR_HEADCOUNT_TREND, HR_TURNOVER_BY_DEPT,
} from "../lib/hr-data-full";
import {
  Users, UserPlus, TrendingDown, Clock, DollarSign, BarChart3,
  Brain, Lightbulb, AlertTriangle, Target, ArrowUpRight,
  Activity, Briefcase, GraduationCap, Gauge, Percent,
} from "lucide-react";

/* ─── Helpers ──────────────────────────────────────────────── */

function formatEGP(n: number) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency", currency: "EGP", minimumFractionDigits: 0,
  }).format(n);
}

const EASE = [0.16, 1, 0.3, 1] as const;

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

/* ─── Donut Chart (pure SVG) ──────────────────────────────── */

function DonutChart({
  segments,
  size = 140,
  thickness = 28,
}: {
  segments: { value: number; color: string; label: string; labelAr: string }[];
  size?: number;
  thickness?: number;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  let accumulated = 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} className="-rotate-90">
        {segments.map((seg, i) => {
          const pct = total > 0 ? seg.value / total : 0;
          const dashLen = circumference * pct;
          const dashOffset = circumference * accumulated;
          accumulated += pct;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeDasharray={`${dashLen} ${circumference - dashLen}`}
              strokeDashoffset={-dashOffset}
              strokeLinecap="round"
              style={{ transition: "all 0.6s ease" }}
            />
          );
        })}
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-current text-sm font-semibold"
          style={{ fontSize: "14px" }}
        >
          {total}
        </text>
      </svg>
    </div>
  );
}

/* ─── Horizontal Bar ──────────────────────────────────────── */

function HorizontalBar({
  value,
  max,
  color,
  label,
  labelAr,
  displayValue,
  ar,
}: {
  value: number;
  max: number;
  color: string;
  label: string;
  labelAr: string;
  displayValue: string;
  ar: boolean;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 text-xs font-medium text-gray-600 dark:text-gray-400 text-right shrink-0">
        {ar ? labelAr : label}
      </div>
      <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: EASE }}
        />
      </div>
      <div className="w-14 text-xs font-semibold text-gray-700 dark:text-gray-300 shrink-0">
        {displayValue}
      </div>
    </div>
  );
}

/* ─── Metric Card ─────────────────────────────────────────── */

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
  detail,
  index,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  bg: string;
  detail: string;
  index: number;
}) {
  return (
    <motion.div
      custom={index}
      variants={cardV}
      initial="hidden"
      animate="visible"
      className={`${bg} rounded-2xl p-5 border border-white/60 dark:border-white/10 flex flex-col gap-2`}
    >
      <div className="flex items-center gap-2">
        <div className={`${color} p-2 rounded-xl bg-white/70 dark:bg-white/10`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-400 dark:text-gray-500">{detail}</div>
    </motion.div>
  );
}

/* ─── Main Component ──────────────────────────────────────── */

export default function HRAnalytics() {
  const { lang } = useLanguage();
  const ar = lang === "ar";

  const metrics = HR_METRICS;
  const headcount = HR_HEADCOUNT_TREND;
  const turnover = HR_TURNOVER_BY_DEPT;

  const maxHeadcount = useMemo(() => Math.max(...headcount.map((h) => h.headcount), 1), [headcount]);
  const maxTurnover = useMemo(() => Math.max(...turnover.map((t) => t.rate), 1), [turnover]);

  const genderTotal = metrics.diversity_ratio.male + metrics.diversity_ratio.female;
  const ageTotal = Object.values(metrics.age_distribution).reduce((a, b) => a + b, 0);
  const tenureTotal = Object.values(metrics.tenure_distribution).reduce((a, b) => a + b, 0);

  const genderSegments = [
    { value: metrics.diversity_ratio.male, color: "#3B82F6", label: "Male", labelAr: "ذكور" },
    { value: metrics.diversity_ratio.female, color: "#EC4899", label: "Female", labelAr: "إناث" },
  ];

  const ageSegments = [
    { value: metrics.age_distribution["18-25"], color: "#10B981", label: "18–25", labelAr: "١٨–٢٥" },
    { value: metrics.age_distribution["26-35"], color: "#3B82F6", label: "26–35", labelAr: "٢٦–٣٥" },
    { value: metrics.age_distribution["36-45"], color: "#F59E0B", label: "36–45", labelAr: "٣٦–٤٥" },
    { value: metrics.age_distribution["46+"], color: "#EF4444", label: "46+", labelAr: "٤٦+" },
  ];

  const tenureSegments = [
    { value: metrics.tenure_distribution["<1yr"], color: "#8B5CF6", label: "<1yr", labelAr: "أقل من سنة" },
    { value: metrics.tenure_distribution["1-3yr"], color: "#3B82F6", label: "1–3yr", labelAr: "١–٣ سنوات" },
    { value: metrics.tenure_distribution["3-5yr"], color: "#10B981", label: "3–5yr", labelAr: "٣–٥ سنوات" },
    { value: metrics.tenure_distribution["5+yr"], color: "#F59E0B", label: "5+yr", labelAr: "أكثر من ٥ سنوات" },
  ];

  const trainingUtilization = Math.round(
    (metrics.training_budget_used / metrics.training_budget_total) * 100
  );

  const insights = [
    {
      icon: AlertTriangle,
      text: ar
        ? "قسم الإنتاج لديه أعلى معدل دوران بنسبة 12.5% — يوصى ببرنامج احتفاظ"
        : "Production department has highest turnover at 12.5% — recommend retention program",
      severity: "warning",
    },
    {
      icon: GraduationCap,
      text: ar
        ? `ميزانية التدريب مستخدمة بنسبة ${trainingUtilization}% مع ٦ أشهر متبقية`
        : `Training budget is ${trainingUtilization}% utilized with 6 months remaining`,
      severity: "info",
    },
    {
      icon: Clock,
      text: ar
        ? `متوسط ملء الوظائف ${metrics.time_to_fill_days} يوم — معيار الصناعة 28 يوم`
        : `Average time to fill is ${metrics.time_to_fill_days} days — industry benchmark is 28 days`,
      severity: "warning",
    },
    {
      icon: Users,
      text: ar
        ? `نسبة التنوع 64% ذكور و 36% إناث — فرص تحسين التوازن`
        : `Diversity ratio is 64% male and 36% female — opportunity to improve balance`,
      severity: "info",
    },
    {
      icon: Activity,
      text: ar
        ? `ساعات العمل الإضافية الشهرية ${metrics.overtime_hours_monthly} ساعة — مراجعة الجدولة`
        : `Monthly overtime is ${metrics.overtime_hours_monthly} hours — review scheduling`,
      severity: "warning",
    },
    {
      icon: Target,
      text: ar
        ? `رضا الموظفين ${metrics.employee_satisfaction}/5 — أعلى من متوسط الصناعة 3.8`
        : `Employee satisfaction at ${metrics.employee_satisfaction}/5 — above industry average 3.8`,
      severity: "success",
    },
  ];

  /* ─── KPI Cards ──────────────────────────────────────────── */

  const kpis = [
    {
      icon: Users,
      label: ar ? "إجمالي العدد" : "Total Headcount",
      value: metrics.total_headcount,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      detail: `${metrics.active_employees} ${ar ? "نشط" : "active"}`,
    },
    {
      icon: Users,
      label: ar ? "الموظفون النشطون" : "Active Employees",
      value: metrics.active_employees,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      detail: `${metrics.total_headcount - metrics.active_employees} ${ar ? "غير نشط" : "inactive"}`,
    },
    {
      icon: UserPlus,
      label: ar ? "توظيفات العام" : "New Hires YTD",
      value: metrics.new_hires_ytd,
      color: "text-violet-600",
      bg: "bg-violet-50 dark:bg-violet-950/30",
      detail: `${ar ? "متوسط مدة التوظيف" : "Avg time to fill"}: ${metrics.time_to_fill_days}d`,
    },
    {
      icon: TrendingDown,
      label: ar ? "نسبة الدوران" : "Turnover Rate",
      value: `${metrics.turnover_rate}%`,
      color: "text-rose-600",
      bg: "bg-rose-50 dark:bg-rose-950/30",
      detail: `${turnover.filter((t) => t.rate > 0).length} ${ar ? "أقسام" : "depts affected"}`,
    },
    {
      icon: Clock,
      label: ar ? "متوسط الخدمة" : "Avg Tenure",
      value: `${metrics.avg_tenure_months}mo`,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      detail: `${ar ? "≈" : "≈"} ${(metrics.avg_tenure_months / 12).toFixed(1)} ${ar ? "سنوات" : "years"}`,
    },
    {
      icon: DollarSign,
      label: ar ? "متوسط الراتب" : "Avg Salary",
      value: formatEGP(metrics.avg_salary),
      color: "text-teal-600",
      bg: "bg-teal-50 dark:bg-teal-950/30",
      detail: `${formatEGP(metrics.total_payroll_monthly)} ${ar ? "شهرياً" : "/mo total"}`,
    },
  ];

  /* ─── Render ─────────────────────────────────────────────── */

  return (
    <div className="min-h-full px-6 md:px-8 py-6 max-w-[1440px] mx-auto space-y-6">
      {/* ── Header ────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {ar ? "تحليلات واستراتيجية الموارد البشرية" : "HR Analytics & Strategy"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {ar
              ? "رؤى شاملة لأداء القوى العاملة واستراتيجيات الموارد البشرية"
              : "Comprehensive workforce performance insights and HR strategies"}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/30 rounded-full border border-purple-100 dark:border-purple-800/40">
          <Brain className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-medium text-purple-600">
            {ar ? "مدعوم بالذكاء الاصطناعي" : "AI-Powered Insights"}
          </span>
        </div>
      </motion.div>

      {/* ── Key Metrics ───────────────────────────────────── */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
      >
        {kpis.map((kpi, i) => (
          <MetricCard key={i} index={i} {...kpi} />
        ))}
      </motion.div>

      {/* ── Headcount Trend ───────────────────────────────── */}
      <motion.div
        variants={cardV}
        custom={7}
        initial="hidden"
        animate="visible"
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800"
      >
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {ar ? "اتجاه عدد الموظفين" : "Headcount Trend"}
          </h2>
        </div>

        <div className="flex items-end gap-1 h-48">
          {headcount.map((m, i) => {
            const barH = (m.headcount / maxHeadcount) * 100;
            const hireH = (m.new_hires / maxHeadcount) * 100;
            const exitH = (m.exits / maxHeadcount) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="relative w-full flex items-end justify-center" style={{ height: "140px" }}>
                  {/* Main headcount bar */}
                  <motion.div
                    className="w-8 rounded-t-lg bg-gradient-to-t from-blue-500 to-blue-400 relative"
                    initial={{ height: 0 }}
                    animate={{ height: `${barH}%` }}
                    transition={{ duration: 0.6, delay: i * 0.1, ease: EASE }}
                  >
                    {/* Hires overlay */}
                    {hireH > 0 && (
                      <div
                        className="absolute bottom-0 left-0 right-0 rounded-t-md bg-emerald-400/60"
                        style={{ height: `${(hireH / barH) * 100}%` }}
                      />
                    )}
                    {/* Exits overlay */}
                    {exitH > 0 && (
                      <div
                        className="absolute top-0 left-0 right-0 rounded-b-md bg-rose-400/60"
                        style={{ height: `${(exitH / barH) * 100}%` }}
                      />
                    )}
                    {/* Tooltip on hover */}
                    <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      {ar ? "عدد" : "Count"}: {m.headcount}
                      {m.new_hires > 0 && ` · ${ar ? "توظيف" : "Hires"}: +${m.new_hires}`}
                      {m.exits > 0 && ` · ${ar ? "مغادرة" : "Exits"}: -${m.exits}`}
                    </div>
                  </motion.div>
                </div>
                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-1">
                  {m.month}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-5 mt-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-gradient-to-t from-blue-500 to-blue-400" />
            <span>{ar ? "عدد الموظفين" : "Headcount"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-400" />
            <span>{ar ? "توظيفات جديدة" : "New Hires"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-rose-400" />
            <span>{ar ? "المغادرون" : "Exits"}</span>
          </div>
        </div>
      </motion.div>

      {/* ── Two Column: Turnover + Composition ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Turnover by Department */}
        <motion.div
          variants={cardV}
          custom={8}
          initial="hidden"
          animate="visible"
          className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800"
        >
          <div className="flex items-center gap-2 mb-5">
            <TrendingDown className="w-5 h-5 text-rose-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {ar ? "الدوران حسب القسم" : "Turnover by Department"}
            </h2>
          </div>
          <div className="space-y-3">
            {turnover.map((t, i) => {
              const colors = [
                "#EF4444", "#3B82F6", "#EC4899", "#F59E0B",
                "#F97316", "#10B981", "#8B5CF6",
              ];
              return (
                <HorizontalBar
                  key={i}
                  value={t.rate}
                  max={maxTurnover}
                  color={colors[i % colors.length]}
                  label={t.department}
                  labelAr={t.department_ar}
                  displayValue={`${t.rate}%`}
                  ar={ar}
                />
              );
            })}
          </div>
        </motion.div>

        {/* Workforce Composition - 3 Donut Charts */}
        <motion.div
          variants={cardV}
          custom={9}
          initial="hidden"
          animate="visible"
          className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800"
        >
          <div className="flex items-center gap-2 mb-5">
            <Users className="w-5 h-5 text-violet-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {ar ? "تكوين القوى العاملة" : "Workforce Composition"}
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {/* Gender */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {ar ? "الجنس" : "Gender"}
              </span>
              <DonutChart segments={genderSegments} size={110} thickness={22} />
              <div className="flex flex-col items-center gap-1 mt-1">
                {genderSegments.map((s, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[10px]">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-gray-600 dark:text-gray-400">
                      {ar ? s.labelAr : s.label}: {s.value} ({genderTotal > 0 ? Math.round((s.value / genderTotal) * 100) : 0}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Age */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {ar ? "العمر" : "Age"}
              </span>
              <DonutChart segments={ageSegments} size={110} thickness={22} />
              <div className="flex flex-col items-center gap-1 mt-1">
                {ageSegments.map((s, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[10px]">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-gray-600 dark:text-gray-400">
                      {ar ? s.labelAr : s.label}: {s.value} ({ageTotal > 0 ? Math.round((s.value / ageTotal) * 100) : 0}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tenure */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {ar ? "مدة الخدمة" : "Tenure"}
              </span>
              <DonutChart segments={tenureSegments} size={110} thickness={22} />
              <div className="flex flex-col items-center gap-1 mt-1">
                {tenureSegments.map((s, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[10px]">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-gray-600 dark:text-gray-400">
                      {ar ? s.labelAr : s.label}: {s.value} ({tenureTotal > 0 ? Math.round((s.value / tenureTotal) * 100) : 0}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── HR Efficiency Metrics ─────────────────────────── */}
      <motion.div
        variants={cardV}
        custom={10}
        initial="hidden"
        animate="visible"
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800"
      >
        <div className="flex items-center gap-2 mb-5">
          <Gauge className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {ar ? "مقاييس كفاءة الموارد البشرية" : "HR Efficiency Metrics"}
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            {
              icon: Clock,
              label: ar ? "مدة التوظيف" : "Time to Fill",
              value: `${metrics.time_to_fill_days}d`,
              benchmark: ar ? "المعيار: 28 يوم" : "Benchmark: 28 days",
              status: metrics.time_to_fill_days > 28 ? "warning" : "good",
            },
            {
              icon: Percent,
              label: ar ? "معدل قبول العروض" : "Offer Acceptance Rate",
              value: `${metrics.offer_acceptance_rate}%`,
              benchmark: ar ? "المعيار: 90%" : "Benchmark: 90%",
              status: metrics.offer_acceptance_rate >= 90 ? "good" : "warning",
            },
            {
              icon: GraduationCap,
              label: ar ? "استغلال ميزانية التدريب" : "Training Budget Utilization",
              value: `${trainingUtilization}%`,
              benchmark: `${formatEGP(metrics.training_budget_used)} / ${formatEGP(metrics.training_budget_total)}`,
              status: trainingUtilization >= 70 ? "good" : "warning",
            },
            {
              icon: Activity,
              label: ar ? "نسبة الغياب" : "Absenteeism Rate",
              value: `${metrics.absenteeism_rate}%`,
              benchmark: ar ? "المعيار: 3%" : "Benchmark: 3%",
              status: metrics.absenteeism_rate <= 3 ? "good" : "warning",
            },
            {
              icon: BarChart3,
              label: ar ? "ساعات العمل الإضافي" : "Overtime Hours",
              value: `${metrics.overtime_hours_monthly}h`,
              benchmark: ar ? "شهرياً" : "monthly",
              status: metrics.overtime_hours_monthly <= 200 ? "good" : "warning",
            },
          ].map((item, i) => {
            const statusColor = item.status === "good"
              ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-800/40"
              : "text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-800/40";
            return (
              <div
                key={i}
                className={`rounded-xl p-4 border ${statusColor} flex flex-col gap-2`}
              >
                <item.icon className="w-5 h-5 opacity-60" />
                <span className="text-xs font-medium opacity-80">{item.label}</span>
                <span className="text-xl font-bold">{item.value}</span>
                <span className="text-[10px] opacity-60">{item.benchmark}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Strategic Insights ────────────────────────────── */}
      <motion.div
        variants={cardV}
        custom={11}
        initial="hidden"
        animate="visible"
        className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-2xl p-6 border border-purple-100 dark:border-purple-800/30"
      >
        <div className="flex items-center gap-2 mb-5">
          <Lightbulb className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {ar ? "رؤى استراتيجية" : "Strategic Insights"}
          </h2>
          <span className="ml-auto text-[10px] text-purple-500 bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 rounded-full">
            {ar ? "مُولَّدة بالذكاء الاصطناعي" : "AI-Generated"}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {insights.map((insight, i) => {
            const severityStyles = {
              warning: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/30 text-amber-800 dark:text-amber-200",
              info: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/30 text-blue-800 dark:text-blue-200",
              success: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-200",
            };
            const iconColors = {
              warning: "text-amber-600",
              info: "text-blue-600",
              success: "text-emerald-600",
            };
            return (
              <div
                key={i}
                className={`flex items-start gap-3 p-4 rounded-xl border ${severityStyles[insight.severity as keyof typeof severityStyles]}`}
              >
                <insight.icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColors[insight.severity as keyof typeof iconColors]}`} />
                <span className="text-sm leading-relaxed">{insight.text}</span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
