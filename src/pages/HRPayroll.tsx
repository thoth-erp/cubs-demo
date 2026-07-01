/**
 * Payroll — الرواتب والمكافآت
 *
 * Salary structure, payslips, deductions, and approvals
 */

import { useState, useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { useLocation } from "wouter";
import {
  HR_EMPLOYEES, HR_PAYROLL,
  type HRPayrollRecord,
} from "../lib/hr-data";
import {
  DollarSign, Users, Search, Filter, CheckCircle2, Clock, Download,
  Eye, ChevronRight, ArrowUpRight, ArrowDownRight, FileText, TrendingUp,
  X,
} from "lucide-react";

function formatEGP(n: number) {
  return new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", minimumFractionDigits: 0 }).format(n);
}

const cardV: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.3, ease: [0.22, 1, 0.36, 1] } }),
};

const STATUS_META: Record<string, { en: string; ar: string; pill: string }> = {
  draft: { en: "Draft", ar: "مسودة", pill: "bg-zinc-100 text-zinc-500" },
  pending: { en: "Pending", ar: "معلق", pill: "bg-amber-100 text-amber-700" },
  approved: { en: "Approved", ar: "موافق", pill: "bg-blue-100 text-blue-600" },
  paid: { en: "Paid", ar: "مدفوع", pill: "bg-emerald-100 text-emerald-700" },
};

export default function HRPayrollPage() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [, navigate] = useLocation();
  const [searchQ, setSearchQ] = useState("");
  const [filterPeriod, setFilterPeriod] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedRecord, setSelectedRecord] = useState<HRPayrollRecord | null>(null);

  const periods = useMemo(() => {
    const set = new Set(HR_PAYROLL.map(p => p.period));
    return Array.from(set).sort().reverse();
  }, []);

  const filtered = useMemo(() => {
    let list = [...HR_PAYROLL];
    if (filterPeriod !== "all") list = list.filter(p => p.period === filterPeriod);
    if (filterStatus !== "all") list = list.filter(p => p.status === filterStatus);
    if (searchQ) {
      const q = searchQ.toLowerCase();
      list = list.filter(p => {
        const emp = HR_EMPLOYEES.find(e => e.id === p.employee_id);
        return emp?.full_name.toLowerCase().includes(q) || emp?.employee_number.toLowerCase().includes(q);
      });
    }
    return list.sort((a, b) => b.period.localeCompare(a.period));
  }, [searchQ, filterPeriod, filterStatus]);

  const stats = useMemo(() => {
    const totalPaid = HR_PAYROLL.filter(p => p.status === "paid").reduce((s, p) => s + p.net_salary, 0);
    const totalPending = HR_PAYROLL.filter(p => p.status === "pending" || p.status === "draft").reduce((s, p) => s + p.net_salary, 0);
    const avgSalary = HR_PAYROLL.length > 0 ? HR_PAYROLL.reduce((s, p) => s + p.net_salary, 0) / HR_PAYROLL.length : 0;
    const paidCount = HR_PAYROLL.filter(p => p.status === "paid").length;
    return { totalPaid, totalPending, avgSalary, paidCount };
  }, []);

  return (
    <div className="min-h-full px-6 md:px-8 py-6 max-w-[1400px] mx-auto space-y-5">
      {/* Header */}
      <motion.div variants={cardV} custom={0} initial="hidden" animate="visible" className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>
            {ar ? "الرواتب" : "Payroll"}
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            {ar ? "إدارة الرواتب والمكافآت والخصومات" : "Manage salaries, bonuses, and deductions"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-9 px-4 rounded-xl border border-border/60 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex items-center gap-1.5">
            <Download size={12} /> {ar ? "تصدير" : "Export"}
          </button>
          <button className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-[11px] font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5">
            <FileText size={12} /> {ar ? "إنشاء كشف رواتب" : "Generate Payslip"}
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: ar ? "إجمالي المدفوع" : "Total Paid", value: formatEGP(stats.totalPaid), icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50/80" },
          { label: ar ? "معلق / مسودة" : "Pending/Draft", value: formatEGP(stats.totalPending), icon: Clock, color: "text-amber-600", bg: "bg-amber-50/80" },
          { label: ar ? "متوسط المرتب" : "Avg Salary", value: formatEGP(stats.avgSalary), icon: TrendingUp, color: "text-primary", bg: "bg-primary/5" },
          { label: ar ? "سجلات مدفوعة" : "Paid Records", value: stats.paidCount, icon: CheckCircle2, color: "text-violet-600", bg: "bg-violet-50/80" },
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

      {/* Filters */}
      <motion.div variants={cardV} custom={5} initial="hidden" animate="visible" className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder={ar ? "بحث بالاسم أو الرقم..." : "Search by name or number..."}
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-border/60 bg-card text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)}
          className="h-9 px-3 rounded-xl border border-border/60 bg-card text-[12px] cursor-pointer">
          <option value="all">{ar ? "كل الفترات" : "All Periods"}</option>
          {periods.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="h-9 px-3 rounded-xl border border-border/60 bg-card text-[12px] cursor-pointer">
          <option value="all">{ar ? "كل الحالات" : "All Status"}</option>
          {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{ar ? v.ar : v.en}</option>)}
        </select>
      </motion.div>

      {/* Payroll Table */}
      <motion.div variants={cardV} custom={6} initial="hidden" animate="visible" className="border border-border/40 rounded-xl overflow-hidden bg-background">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground">{ar ? "الموظف" : "Employee"}</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground">{ar ? "الفترة" : "Period"}</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-muted-foreground">{ar ? "الأساسي" : "Basic"}</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-muted-foreground">{ar ? "البدلات" : "Allow."}</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-muted-foreground">{ar ? "الخصومات" : "Ded."}</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-muted-foreground">{ar ? "الإجمالي" : "Net"}</th>
                <th className="text-center px-4 py-3 text-[11px] font-semibold text-muted-foreground">{ar ? "الحالة" : "Status"}</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(record => {
                const emp = HR_EMPLOYEES.find(e => e.id === record.employee_id);
                const st = STATUS_META[record.status] || STATUS_META.draft;
                return (
                  <tr key={record.id} className="border-b border-border/20 hover:bg-muted/20 cursor-pointer transition-colors"
                    onClick={() => setSelectedRecord(record)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ backgroundColor: emp?.avatar_color || "#6B7280" }}>
                          {emp?.full_name.split(" ").map(w => w[0]).join("")}
                        </div>
                        <div>
                          <p className="text-[12px] font-medium">{emp ? (ar && emp.full_name_ar ? emp.full_name_ar : emp.full_name) : "—"}</p>
                          <p className="text-[9px] text-muted-foreground font-mono">{emp?.employee_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-muted-foreground">{record.period}</td>
                    <td className="px-4 py-3 text-[12px] text-right font-medium">{formatEGP(record.basic_salary)}</td>
                    <td className="px-4 py-3 text-[12px] text-right text-emerald-600">+{formatEGP(record.allowances + record.overtime_pay + record.bonus)}</td>
                    <td className="px-4 py-3 text-[12px] text-right text-rose-500">-{formatEGP(record.deductions)}</td>
                    <td className="px-4 py-3 text-[13px] text-right font-bold" style={{ fontFamily: "var(--app-font-serif)" }}>{formatEGP(record.net_salary)}</td>
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
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <DollarSign size={24} className="mx-auto text-muted-foreground/20 mb-2" />
            <p className="text-[12px] text-muted-foreground">{ar ? "لا توجد سجلات" : "No records found"}</p>
          </div>
        )}
      </motion.div>

      {/* Payslip Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedRecord(null)} />
          <div className="relative w-full max-w-md bg-background rounded-2xl border border-border shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
              <h3 className="text-[15px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>
                {ar ? "كشف راتب" : "Payslip"} — {selectedRecord.period}
              </h3>
              <button onClick={() => setSelectedRecord(null)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted"><X size={14} /></button>
            </div>
            <div className="p-5 space-y-4">
              {(() => {
                const emp = HR_EMPLOYEES.find(e => e.id === selectedRecord.employee_id);
                return emp ? (
                  <div className="flex items-center gap-3 pb-4 border-b border-border/30">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[12px] font-bold text-white" style={{ backgroundColor: emp.avatar_color }}>
                      {emp.full_name.split(" ").map(w => w[0]).join("")}
                    </div>
                    <div>
                      <p className="text-[13px] font-medium">{ar && emp.full_name_ar ? emp.full_name_ar : emp.full_name}</p>
                      <p className="text-[10px] text-muted-foreground">{emp.job_title} · {emp.employee_number}</p>
                    </div>
                  </div>
                ) : null;
              })()}
              <div className="space-y-2">
                {[
                  { label: ar ? "المرتب الأساسي" : "Basic Salary", value: selectedRecord.basic_salary, color: "" },
                  { label: ar ? "البدلات" : "Allowances", value: selectedRecord.allowances, color: "text-emerald-600" },
                  { label: ar ? "الوقت الإضافي" : "Overtime", value: selectedRecord.overtime_pay, color: "text-emerald-600" },
                  { label: ar ? "المكافآت" : "Bonus", value: selectedRecord.bonus, color: "text-emerald-600" },
                  { label: ar ? "الخصومات" : "Deductions", value: -selectedRecord.deductions, color: "text-rose-500" },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
                    <span className="text-[11px] text-muted-foreground">{row.label}</span>
                    <span className={`text-[12px] font-medium ${row.color}`}>{formatEGP(Math.abs(row.value))}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border/40">
                <span className="text-[13px] font-semibold">{ar ? "صافي الراتب" : "Net Salary"}</span>
                <span className="text-[18px] font-bold text-primary" style={{ fontFamily: "var(--app-font-serif)" }}>{formatEGP(selectedRecord.net_salary)}</span>
              </div>
              <div className="flex gap-2 pt-2">
                <button className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5">
                  <Download size={13} /> {ar ? "تحميل PDF" : "Download PDF"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
