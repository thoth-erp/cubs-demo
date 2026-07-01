/**
 * Compensation & Benefits — التعويضات والمزايا
 *
 * Salary grades, benefits catalog, payslips overview
 */

import { useState, useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import {
  HR_SALARY_GRADES, HR_BENEFITS, HR_PAYSLIPS,
  type SalaryStructure, type Benefit, type Payslip,
} from "../lib/hr-data-full";
import {
  DollarSign, TrendingUp, Users, Clock, Download, Eye, X, ChevronRight,
  Shield, Heart, Briefcase, GraduationCap, Gift, Leaf, BadgeCheck,
  Building2, CreditCard, AlertCircle, FileText,
} from "lucide-react";

function formatEGP(n: number) {
  return new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", minimumFractionDigits: 0 }).format(n);
}

const cardV: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.3, ease: [0.22, 1, 0.36, 1] } }),
};

const PAYSLIP_STATUS: Record<string, { en: string; ar: string; pill: string }> = {
  draft: { en: "Draft", ar: "مسودة", pill: "bg-zinc-100 text-zinc-500" },
  pending_approval: { en: "Pending", ar: "معلق", pill: "bg-amber-100 text-amber-700" },
  approved: { en: "Approved", ar: "موافق", pill: "bg-blue-100 text-blue-600" },
  paid: { en: "Paid", ar: "مدفوع", pill: "bg-emerald-100 text-emerald-700" },
};

const BENEFIT_TYPE_META: Record<string, { en: string; ar: string; icon: React.ElementType; color: string; bg: string }> = {
  insurance: { en: "Insurance", ar: "تأمين", icon: Shield, color: "text-blue-600", bg: "bg-blue-50" },
  retirement: { en: "Retirement", ar: "تقاعد", icon: Building2, color: "text-violet-600", bg: "bg-violet-50" },
  leave: { en: "Leave", ar: "إجازة", icon: Leaf, color: "text-emerald-600", bg: "bg-emerald-50" },
  perk: { en: "Perk", ar: "مزايا", icon: Gift, color: "text-amber-600", bg: "bg-amber-50" },
  wellness: { en: "Wellness", ar: "صحة", icon: Heart, color: "text-rose-600", bg: "bg-rose-50" },
  education: { en: "Education", ar: "تعليم", icon: GraduationCap, color: "text-cyan-600", bg: "bg-cyan-50" },
};

const BENEFIT_STATUS: Record<string, { en: string; ar: string; pill: string }> = {
  active: { en: "Active", ar: "نشط", pill: "bg-emerald-100 text-emerald-700" },
  inactive: { en: "Inactive", ar: "غير نشط", pill: "bg-zinc-100 text-zinc-500" },
  pending_renewal: { en: "Renewal", ar: "تجديد", pill: "bg-amber-100 text-amber-700" },
};

export default function HRCompensation() {
  const { lang } = useLanguage();
  const ar = lang === "ar";

  const [filterPeriod, setFilterPeriod] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);

  const periods = useMemo(() => {
    const set = new Set(HR_PAYSLIPS.map(p => p.period));
    return Array.from(set).sort().reverse();
  }, []);

  const filteredPayslips = useMemo(() => {
    let list = [...HR_PAYSLIPS];
    if (filterPeriod !== "all") list = list.filter(p => p.period === filterPeriod);
    if (filterStatus !== "all") list = list.filter(p => p.status === filterStatus);
    return list.sort((a, b) => b.period.localeCompare(a.period) || b.employee_name.localeCompare(a.employee_name));
  }, [filterPeriod, filterStatus]);

  const kpis = useMemo(() => {
    const totalPayroll = HR_PAYSLIPS.reduce((s, p) => s + p.net_salary, 0);
    const avgSalary = HR_PAYSLIPS.length > 0 ? HR_PAYSLIPS.reduce((s, p) => s + p.basic_salary, 0) / HR_PAYSLIPS.length : 0;
    const benefitsCost = HR_BENEFITS.filter(b => b.status === "active").reduce((s, b) => s + b.company_contribution, 0);
    const pendingCount = HR_PAYSLIPS.filter(p => p.status === "pending_approval" || p.status === "draft").length;
    return { totalPayroll, avgSalary, benefitsCost, pendingCount };
  }, []);

  const maxGradeSalary = useMemo(() => Math.max(...HR_SALARY_GRADES.map(g => g.max_salary)), []);

  return (
    <div className="min-h-full px-6 md:px-8 py-6 max-w-[1400px] mx-auto space-y-5">
      {/* Header */}
      <motion.div variants={cardV} custom={0} initial="hidden" animate="visible" className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>
            {ar ? "التعويضات والمزايا" : "Compensation & Benefits"}
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            {ar ? "هيكل الرواتب، المزايا، وكراسات الرواتب" : "Salary structures, benefits, and payslips"}
          </p>
        </div>
        <button className="h-9 px-4 rounded-xl border border-border/60 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex items-center gap-1.5">
          <Download size={12} /> {ar ? "تصدير" : "Export"}
        </button>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: ar ? "إجمالي الرواتب الشهرية" : "Total Payroll Monthly", value: formatEGP(kpis.totalPayroll), icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50/80" },
          { label: ar ? "متوسط الراتب الأساسي" : "Avg Basic Salary", value: formatEGP(kpis.avgSalary), icon: TrendingUp, color: "text-primary", bg: "bg-primary/5" },
          { label: ar ? "تكلفة المزايا" : "Benefits Cost (Company)", value: formatEGP(kpis.benefitsCost), icon: Heart, color: "text-rose-600", bg: "bg-rose-50/80" },
          { label: ar ? "كراسات معلقة" : "Pending Payslips", value: kpis.pendingCount, icon: Clock, color: "text-amber-600", bg: "bg-amber-50/80" },
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

      {/* Salary Grades */}
      <motion.div variants={cardV} custom={5} initial="hidden" animate="visible" className="p-5 rounded-xl border border-border/40 bg-background">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard size={14} className="text-primary" />
          <h3 className="text-[13px] font-semibold">{ar ? "المستويات الوظيفية" : "Salary Grades"}</h3>
        </div>
        <div className="space-y-3">
          {HR_SALARY_GRADES.map((grade, i) => {
            const minPct = (grade.min_salary / maxGradeSalary) * 100;
            const midPct = (grade.mid_point / maxGradeSalary) * 100;
            const maxPct = (grade.max_salary / maxGradeSalary) * 100;
            return (
              <div key={grade.id} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-medium">{ar ? grade.grade_ar : grade.grade}</span>
                  <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                    <span>{formatEGP(grade.min_salary)}</span>
                    <span className="text-primary font-medium">{formatEGP(grade.mid_point)}</span>
                    <span>{formatEGP(grade.max_salary)}</span>
                  </div>
                </div>
                <div className="relative h-3 rounded-full bg-muted/30 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary/30 to-primary/60 transition-all duration-500"
                    style={{ width: `${maxPct}%` }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary border-2 border-background shadow-sm transition-all duration-500"
                    style={{ left: `${midPct}%`, transform: "translate(-50%, -50%)" }}
                  />
                </div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {grade.allowances.map((a, j) => (
                    <span key={j} className="text-[8px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {ar ? a.name_ar : a.name} {formatEGP(a.amount)}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Benefits Catalog */}
      <motion.div variants={cardV} custom={6} initial="hidden" animate="visible">
        <div className="flex items-center gap-2 mb-3">
          <Heart size={14} className="text-rose-500" />
          <h3 className="text-[13px] font-semibold">{ar ? "كتالوج المزايا" : "Benefits Catalog"}</h3>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{HR_BENEFITS.length}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {HR_BENEFITS.map((benefit, i) => {
            const meta = BENEFIT_TYPE_META[benefit.type] || BENEFIT_TYPE_META.perk;
            const st = BENEFIT_STATUS[benefit.status] || BENEFIT_STATUS.active;
            const Icon = meta.icon;
            return (
              <motion.div key={benefit.id} variants={cardV} custom={i} initial="hidden" animate="visible"
                className="p-4 rounded-xl border border-border/40 bg-background hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center`}>
                    <Icon size={14} className={meta.color} />
                  </div>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${st.pill}`}>{ar ? st.ar : st.en}</span>
                </div>
                <h4 className="text-[12px] font-semibold mb-1">{ar ? benefit.name_ar : benefit.name}</h4>
                <p className="text-[9px] text-muted-foreground mb-3 line-clamp-2">{ar ? benefit.description_ar : benefit.description}</p>
                <div className="flex items-center gap-1.5 mb-3">
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${meta.bg} ${meta.color} font-medium`}>{ar ? meta.ar : meta.en}</span>
                  <span className="text-[8px] text-muted-foreground">{benefit.provider}</span>
                </div>
                {benefit.cost_per_employee > 0 && (
                  <div className="space-y-1.5 pt-2.5 border-t border-border/30">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-muted-foreground">{ar ? "الشركة" : "Company"}</span>
                      <span className="text-[10px] font-medium text-emerald-600">{formatEGP(benefit.company_contribution)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-muted-foreground">{ar ? "الموظف" : "Employee"}</span>
                      <span className="text-[10px] font-medium text-rose-500">{formatEGP(benefit.employee_contribution)}</span>
                    </div>
                  </div>
                )}
                <div className="mt-3 pt-2 border-t border-border/30">
                  <p className="text-[8px] text-muted-foreground flex items-center gap-1">
                    <BadgeCheck size={9} className="shrink-0" />
                    {ar ? benefit.eligibility_ar : benefit.eligibility}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Payslips */}
      <motion.div variants={cardV} custom={7} initial="hidden" animate="visible">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-blue-500" />
            <h3 className="text-[13px] font-semibold">{ar ? "كراسات الرواتب" : "Payslips"}</h3>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)}
            className="h-9 px-3 rounded-xl border border-border/60 bg-card text-[12px] cursor-pointer">
            <option value="all">{ar ? "كل الفترات" : "All Periods"}</option>
            {periods.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="h-9 px-3 rounded-xl border border-border/60 bg-card text-[12px] cursor-pointer">
            <option value="all">{ar ? "كل الحالات" : "All Status"}</option>
            {Object.entries(PAYSLIP_STATUS).map(([k, v]) => <option key={k} value={k}>{ar ? v.ar : v.en}</option>)}
          </select>
        </div>

        <div className="border border-border/40 rounded-xl overflow-hidden bg-background">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground">{ar ? "الموظف" : "Employee"}</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground">{ar ? "الفترة" : "Period"}</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-muted-foreground">{ar ? "الأساسي" : "Basic"}</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-muted-foreground">{ar ? "البدلات" : "Allow."}</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-muted-foreground">{ar ? "الخصومات" : "Ded."}</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-muted-foreground">{ar ? "الصافي" : "Net"}</th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold text-muted-foreground">{ar ? "الحالة" : "Status"}</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filteredPayslips.map(ps => {
                  const allowances = ps.housing_allowance + ps.transport_allowance + ps.food_allowance + ps.overtime_pay + ps.bonus + ps.commission;
                  const deductions = ps.social_insurance + ps.tax + ps.advances + ps.other_deductions;
                  const st = PAYSLIP_STATUS[ps.status] || PAYSLIP_STATUS.draft;
                  return (
                    <tr key={ps.id} className="border-b border-border/20 hover:bg-muted/20 cursor-pointer transition-colors"
                      onClick={() => setSelectedPayslip(ps)}>
                      <td className="px-4 py-3">
                        <p className="text-[12px] font-medium">{ar ? ps.employee_name_ar : ps.employee_name}</p>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-muted-foreground">{ps.period}</td>
                      <td className="px-4 py-3 text-[12px] text-right font-medium">{formatEGP(ps.basic_salary)}</td>
                      <td className="px-4 py-3 text-[12px] text-right text-emerald-600">+{formatEGP(allowances)}</td>
                      <td className="px-4 py-3 text-[12px] text-right text-rose-500">-{formatEGP(deductions)}</td>
                      <td className="px-4 py-3 text-[13px] text-right font-bold" style={{ fontFamily: "var(--app-font-serif)" }}>{formatEGP(ps.net_salary)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${st.pill}`}>{ar ? st.ar : st.en}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Eye size={14} className="text-muted-foreground/30" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredPayslips.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle size={24} className="mx-auto text-muted-foreground/20 mb-2" />
              <p className="text-[12px] text-muted-foreground">{ar ? "لا توجد سجلات" : "No payslips found"}</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Payslip Detail Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedPayslip(null)} />
          <div className="relative w-full max-w-md bg-background rounded-2xl border border-border shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
              <h3 className="text-[15px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>
                {ar ? "كشف راتب" : "Payslip"} — {selectedPayslip.period}
              </h3>
              <button onClick={() => setSelectedPayslip(null)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted">
                <X size={14} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-border/30">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-[12px] font-bold text-primary">
                  {(ar ? selectedPayslip.employee_name_ar : selectedPayslip.employee_name).split(" ").map(w => w[0]).join("")}
                </div>
                <div>
                  <p className="text-[13px] font-medium">{ar ? selectedPayslip.employee_name_ar : selectedPayslip.employee_name}</p>
                  <p className="text-[10px] text-muted-foreground">{ar ? "الرقم الوظافي" : "ID"}: {selectedPayslip.employee_id}</p>
                </div>
              </div>

              {/* Earnings */}
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{ar ? "الإيرادات" : "Earnings"}</p>
                <div className="space-y-1.5">
                  {[
                    { label: ar ? "المرتب الأساسي" : "Basic Salary", value: selectedPayslip.basic_salary, color: "" },
                    { label: ar ? "بدل السكن" : "Housing Allowance", value: selectedPayslip.housing_allowance, color: "text-emerald-600" },
                    { label: ar ? "بدل المواصلات" : "Transport Allowance", value: selectedPayslip.transport_allowance, color: "text-emerald-600" },
                    { label: ar ? "بدل الطعام" : "Food Allowance", value: selectedPayslip.food_allowance, color: "text-emerald-600" },
                    { label: ar ? "الوقت الإضافي" : "Overtime", value: selectedPayslip.overtime_pay, color: "text-emerald-600" },
                    { label: ar ? "المكافأة" : "Bonus", value: selectedPayslip.bonus, color: "text-emerald-600" },
                    { label: ar ? "العمولة" : "Commission", value: selectedPayslip.commission, color: "text-emerald-600" },
                  ].filter(r => r.value > 0).map((row, i) => (
                    <div key={i} className="flex items-center justify-between py-1">
                      <span className="text-[11px] text-muted-foreground">{row.label}</span>
                      <span className={`text-[12px] font-medium ${row.color}`}>{formatEGP(row.value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deductions */}
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{ar ? "الخصومات" : "Deductions"}</p>
                <div className="space-y-1.5">
                  {[
                    { label: ar ? "التأمين الاجتماعي" : "Social Insurance", value: selectedPayslip.social_insurance },
                    { label: ar ? "الضريبة" : "Tax", value: selectedPayslip.tax },
                    { label: ar ? "السلف" : "Advances", value: selectedPayslip.advances },
                    { label: ar ? "خصومات أخرى" : "Other Deductions", value: selectedPayslip.other_deductions },
                  ].filter(r => r.value > 0).map((row, i) => (
                    <div key={i} className="flex items-center justify-between py-1">
                      <span className="text-[11px] text-muted-foreground">{row.label}</span>
                      <span className="text-[12px] font-medium text-rose-500">-{formatEGP(row.value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between pt-3 border-t border-border/40">
                <span className="text-[13px] font-semibold">{ar ? "صافي الراتب" : "Net Salary"}</span>
                <span className="text-[18px] font-bold text-primary" style={{ fontFamily: "var(--app-font-serif)" }}>{formatEGP(selectedPayslip.net_salary)}</span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                <span>{ar ? "حالة الدفع" : "Payment Status"}</span>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${(PAYSLIP_STATUS[selectedPayslip.status] || PAYSLIP_STATUS.draft).pill}`}>
                  {ar ? (PAYSLIP_STATUS[selectedPayslip.status] || PAYSLIP_STATUS.draft).ar : (PAYSLIP_STATUS[selectedPayslip.status] || PAYSLIP_STATUS.draft).en}
                </span>
              </div>
              {selectedPayslip.paid_at && (
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{ar ? "تاريخ الدفع" : "Paid At"}</span>
                  <span>{new Date(selectedPayslip.paid_at).toLocaleDateString(ar ? "ar-EG" : "en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
