/**
 * Employee 360 Profile — الملف الشخصي الشامل للموظف
 *
 * Timeline-first employee view with all HR dimensions
 */

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { useLocation } from "wouter";
import {
  HR_EMPLOYEES, HR_ATTENDANCE, HR_LEAVES, HR_PAYROLL, HR_PERFORMANCE_REVIEWS,
  HR_TIMELINE, HR_ALERTS, HR_DEPARTMENTS,
  type HREmployee, type HRTimelineEvent,
} from "../lib/hr-data";
import {
  ArrowLeft, Phone, Mail, MapPin, Calendar, DollarSign, Clock, Briefcase,
  Users, Star, Shield, FileText, Award, Gift, AlertTriangle, CheckCircle2,
  TrendingUp, ChevronRight, Eye, Edit3, Plus, LogIn, LogOut, Coffee,
  Target, Zap, Heart, Package, Laptop, Smartphone, X, Building2,
} from "lucide-react";

function formatEGP(n: number) {
  return new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", minimumFractionDigits: 0 }).format(n);
}

const DEPT_META: Record<string, { en: string; ar: string; color: string }> = {
  management: { en: "Management", ar: "الإدارة العليا", color: "#1E3A5F" },
  sales: { en: "Sales", ar: "المبيعات", color: "#E07A5F" },
  production: { en: "Production", ar: "الإنتاج", color: "#3B82F6" },
  design: { en: "Design", ar: "التصميم", color: "#EC4899" },
  warehouse: { en: "Warehouse", ar: "المخزن", color: "#F59E0B" },
  delivery: { en: "Delivery", ar: "التوصيل", color: "#F97316" },
  admin: { en: "Admin", ar: "الإدارة", color: "#10B981" },
};

const STATUS_META: Record<string, { en: string; ar: string; pill: string }> = {
  active: { en: "Active", ar: "نشط", pill: "bg-emerald-100 text-emerald-700" },
  on_leave: { en: "On Leave", ar: "إجازة", pill: "bg-amber-100 text-amber-700" },
  suspended: { en: "Suspended", ar: "موقوف", pill: "bg-rose-100 text-rose-600" },
  terminated: { en: "Terminated", ar: "منتهي", pill: "bg-zinc-100 text-zinc-500" },
  probation: { en: "Probation", ar: "فترة تجربة", pill: "bg-blue-100 text-blue-600" },
};

const TIMELINE_ICONS: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  joined: { icon: Users, color: "text-emerald-600", bg: "bg-emerald-100" },
  contract_signed: { icon: FileText, color: "text-blue-600", bg: "bg-blue-100" },
  salary_changed: { icon: DollarSign, color: "text-violet-600", bg: "bg-violet-100" },
  promoted: { icon: Star, color: "text-amber-600", bg: "bg-amber-100" },
  leave_taken: { icon: Coffee, color: "text-cyan-600", bg: "bg-cyan-100" },
  warning_issued: { icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-100" },
  bonus_added: { icon: Gift, color: "text-primary", bg: "bg-primary/10" },
  review_completed: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100" },
  equipment_assigned: { icon: Package, color: "text-slate-600", bg: "bg-slate-100" },
  resigned: { icon: ArrowLeft, color: "text-zinc-600", bg: "bg-zinc-100" },
  terminated: { icon: ArrowLeft, color: "text-rose-600", bg: "bg-rose-100" },
  probation_started: { icon: Clock, color: "text-blue-600", bg: "bg-blue-100" },
  "probation Ended": { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100" },
  attendance_issue: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-100" },
  document_uploaded: { icon: FileText, color: "text-slate-600", bg: "bg-slate-100" },
};

export default function HREmployeeProfile() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [location] = useLocation();
  const employeeId = location.split("/").pop();

  const employee = HR_EMPLOYEES.find(e => e.id === employeeId);
  const timeline = HR_TIMELINE.filter(e => e.employee_id === employeeId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const attendance = HR_ATTENDANCE.filter(a => a.employee_id === employeeId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const leaves = HR_LEAVES.filter(l => l.employee_id === employeeId);
  const payroll = HR_PAYROLL.filter(p => p.employee_id === employeeId);
  const reviews = HR_PERFORMANCE_REVIEWS.filter(r => r.employee_id === employeeId);
  const alerts = HR_ALERTS.filter(a => a.employee_id === employeeId && !a.dismissed);

  const [activeTab, setActiveTab] = useState<"timeline" | "attendance" | "leaves" | "payroll" | "performance" | "documents" | "assets">("timeline");

  if (!employee) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <p className="text-[13px] text-muted-foreground">{ar ? "الموظف غير موجود" : "Employee not found"}</p>
      </div>
    );
  }

  const dept = DEPT_META[employee.department] || { en: employee.department, ar: employee.department, color: "#6B7280" };
  const st = STATUS_META[employee.status] || STATUS_META.active;

  const aiSummary = `${employee.full_name} has been with THOTH since ${new Date(employee.hire_date).getFullYear()}. ${employee.status === "active" ? "Currently active" : employee.status}. Performance score: ${employee.performance_score || "N/A"}/100. Attendance risk: ${employee.attendance_risk}.`;

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="px-6 md:px-8 py-5 border-b border-border/40" style={{ background: "linear-gradient(160deg, hsl(var(--muted)/0.2) 0%, hsl(var(--background)) 60%)" }}>
        <div className="flex items-center gap-4">
          <button onClick={() => history.back()} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
            <ArrowLeft size={16} />
          </button>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-[16px] font-bold text-white shrink-0" style={{ backgroundColor: employee.avatar_color }}>
            {employee.full_name.split(" ").map(w => w[0]).join("")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-[18px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>
                {ar && employee.full_name_ar ? employee.full_name_ar : employee.full_name}
              </h1>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${st.pill}`}>{ar ? st.ar : st.en}</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
              <span className="flex items-center gap-1"><Briefcase size={10} />{ar && employee.job_title_ar ? employee.job_title_ar : employee.job_title}</span>
              <span className="flex items-center gap-1"><Building2 size={10} />{ar ? dept.ar : dept.en}</span>
              <span className="flex items-center gap-1"><MapPin size={10} />{employee.branch}</span>
              <span className="font-mono text-[10px]">{employee.employee_number}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button className="h-8 px-3 rounded-lg bg-emerald-500 text-white text-[11px] font-medium flex items-center gap-1.5 hover:bg-emerald-600 transition-colors"><Phone size={11} />{ar ? "اتصال" : "Call"}</button>
            <button className="h-8 px-3 rounded-lg bg-blue-500 text-white text-[11px] font-medium flex items-center gap-1.5 hover:bg-blue-600 transition-colors"><Mail size={11} />{ar ? "بريد" : "Email"}</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 overflow-x-auto no-scrollbar">
          {([
            { id: "timeline" as const, en: "Timeline", ar: "الجدول الزمني", icon: Clock },
            { id: "attendance" as const, en: "Attendance", ar: "الحضور", icon: LogIn },
            { id: "leaves" as const, en: "Leaves", ar: "الإجازات", icon: Coffee },
            { id: "payroll" as const, en: "Payroll", ar: "الرواتب", icon: DollarSign },
            { id: "performance" as const, en: "Performance", ar: "الأداء", icon: TrendingUp },
            { id: "documents" as const, en: "Documents", ar: "المستندات", icon: FileText },
            { id: "assets" as const, en: "Assets", ar: "الأصول", icon: Package },
          ]).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/50"
              }`}>
              <tab.icon size={12} />{ar ? tab.ar : tab.en}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 md:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 max-w-[1200px]">
          {/* Main Content */}
          <div>
            {/* Timeline Tab */}
            {activeTab === "timeline" && (
              <div className="space-y-0">
                {timeline.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock size={24} className="mx-auto text-muted-foreground/20 mb-2" />
                    <p className="text-[12px] text-muted-foreground">{ar ? "لا يوجد نشاط" : "No activity yet"}</p>
                  </div>
                ) : (
                  timeline.map((event, i) => {
                    const meta = TIMELINE_ICONS[event.type] || TIMELINE_ICONS.joined;
                    const Icon = meta.icon;
                    return (
                      <div key={event.id} className="flex gap-3 relative">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full ${meta.bg} flex items-center justify-center ${meta.color} shrink-0`}>
                            <Icon size={14} />
                          </div>
                          {i < timeline.length - 1 && <div className="w-px flex-1 bg-border/40 my-1" />}
                        </div>
                        <div className="pb-5 flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="text-[12px] font-medium text-foreground">{ar ? event.title_ar : event.title}</p>
                            <span className="text-[9px] text-muted-foreground shrink-0">{new Date(event.timestamp).toLocaleDateString(ar ? "ar-EG" : "en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">{ar ? event.details_ar : event.details}</p>
                          <span className="text-[9px] text-muted-foreground/60 mt-1 block">{event.staff}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Attendance Tab */}
            {activeTab === "attendance" && (
              <div className="space-y-2">
                {attendance.length === 0 ? (
                  <div className="text-center py-12">
                    <LogIn size={24} className="mx-auto text-muted-foreground/20 mb-2" />
                    <p className="text-[12px] text-muted-foreground">{ar ? "لا توجد سجلات حضور" : "No attendance records"}</p>
                  </div>
                ) : (
                  attendance.slice(0, 30).map(a => {
                    const statusMeta: Record<string, { en: string; ar: string; pill: string }> = {
                      present: { en: "Present", ar: "حاضر", pill: "bg-emerald-100 text-emerald-700" },
                      absent: { en: "Absent", ar: "غائب", pill: "bg-rose-100 text-rose-600" },
                      late: { en: "Late", ar: "متأخر", pill: "bg-amber-100 text-amber-700" },
                      half_day: { en: "Half Day", ar: "نص يوم", pill: "bg-blue-100 text-blue-600" },
                      holiday: { en: "Holiday", ar: "عطلة", pill: "bg-indigo-100 text-indigo-600" },
                      sick_leave: { en: "Sick Leave", ar: "إجازة مرضية", pill: "bg-orange-100 text-orange-600" },
                      annual_leave: { en: "Annual Leave", ar: "إجازة سنوية", pill: "bg-cyan-100 text-cyan-600" },
                      excused: { en: "Excused", ar: "مأذون", pill: "bg-zinc-100 text-zinc-500" },
                    };
                    const ast = statusMeta[a.status] || statusMeta.present;
                    return (
                      <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/30">
                        <span className="text-[12px] font-mono text-muted-foreground w-24">{a.date}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ast.pill}`}>{ar ? ast.ar : ast.en}</span>
                        {a.check_in && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><LogIn size={9} />{new Date(a.check_in).toLocaleTimeString()}</span>}
                        {a.check_out && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><LogOut size={9} />{new Date(a.check_out).toLocaleTimeString()}</span>}
                        {a.overtime_hours > 0 && <span className="text-[10px] text-amber-600">+{a.overtime_hours}h OT</span>}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Leaves Tab */}
            {activeTab === "leaves" && (
              <div className="space-y-2">
                {leaves.length === 0 ? (
                  <div className="text-center py-12">
                    <Coffee size={24} className="mx-auto text-muted-foreground/20 mb-2" />
                    <p className="text-[12px] text-muted-foreground">{ar ? "لا توجد طلبات إجازات" : "No leave requests"}</p>
                  </div>
                ) : (
                  leaves.map(l => {
                    const leaveTypes: Record<string, { en: string; ar: string }> = {
                      annual: { en: "Annual", ar: "سنوية" }, sick: { en: "Sick", ar: "مرضية" },
                      emergency: { en: "Emergency", ar: "طارئة" }, unpaid: { en: "Unpaid", ar: "بدون مرتب" },
                      maternity: { en: "Maternity", ar: "أمومة" }, other: { en: "Other", ar: "أخرى" },
                    };
                    const lt = leaveTypes[l.leave_type] || leaveTypes.other;
                    const statusMeta: Record<string, { en: string; ar: string; pill: string }> = {
                      pending: { en: "Pending", ar: "معلق", pill: "bg-amber-100 text-amber-700" },
                      approved: { en: "Approved", ar: "موافق", pill: "bg-emerald-100 text-emerald-700" },
                      rejected: { en: "Rejected", ar: "مرفوض", pill: "bg-rose-100 text-rose-600" },
                      cancelled: { en: "Cancelled", ar: "ملغي", pill: "bg-zinc-100 text-zinc-500" },
                    };
                    const lst = statusMeta[l.status] || statusMeta.pending;
                    return (
                      <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/30">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${lst.pill}`}>{ar ? lst.ar : lst.en}</span>
                        <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{ar ? lt.ar : lt.en}</span>
                        <span className="text-[12px] flex-1">{l.start_date} → {l.end_date}</span>
                        <span className="text-[10px] text-muted-foreground">{l.days} {ar ? "يوم" : "days"}</span>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Payroll Tab */}
            {activeTab === "payroll" && (
              <div className="space-y-2">
                {payroll.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign size={24} className="mx-auto text-muted-foreground/20 mb-2" />
                    <p className="text-[12px] text-muted-foreground">{ar ? "لا توجد سجلات رواتب" : "No payroll records"}</p>
                  </div>
                ) : (
                  payroll.map(p => {
                    const statusMeta: Record<string, { en: string; ar: string; pill: string }> = {
                      draft: { en: "Draft", ar: "مسودة", pill: "bg-zinc-100 text-zinc-500" },
                      pending: { en: "Pending", ar: "معلق", pill: "bg-amber-100 text-amber-700" },
                      approved: { en: "Approved", ar: "موافق", pill: "bg-blue-100 text-blue-600" },
                      paid: { en: "Paid", ar: "مدفوع", pill: "bg-emerald-100 text-emerald-700" },
                    };
                    const pst = statusMeta[p.status] || statusMeta.draft;
                    return (
                      <div key={p.id} className="p-4 rounded-xl border border-border/30">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-medium">{p.period}</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${pst.pill}`}>{ar ? pst.ar : pst.en}</span>
                          </div>
                          <span className="text-[14px] font-bold text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>{formatEGP(p.net_salary)}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-[10px]">
                          <div><span className="text-muted-foreground">Basic</span><p className="font-medium">{formatEGP(p.basic_salary)}</p></div>
                          <div><span className="text-muted-foreground">Allowances</span><p className="font-medium text-emerald-600">+{formatEGP(p.allowances)}</p></div>
                          <div><span className="text-muted-foreground">Deductions</span><p className="font-medium text-rose-500">-{formatEGP(p.deductions)}</p></div>
                          <div><span className="text-muted-foreground">Overtime</span><p className="font-medium text-amber-600">+{formatEGP(p.overtime_pay)}</p></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Performance Tab */}
            {activeTab === "performance" && (
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUp size={24} className="mx-auto text-muted-foreground/20 mb-2" />
                    <p className="text-[12px] text-muted-foreground">{ar ? "لا توجد مراجعات أداء" : "No performance reviews"}</p>
                  </div>
                ) : (
                  reviews.map(r => (
                    <div key={r.id} className="p-5 rounded-xl border border-border/30">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="text-[12px] font-medium">{r.review_period}</span>
                          <span className="text-[9px] text-muted-foreground ml-2">by {r.reviewer}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[20px] font-bold" style={{ fontFamily: "var(--app-font-serif)", color: r.score >= 80 ? "#10B981" : r.score >= 60 ? "#F59E0B" : "#EF4444" }}>{r.score}</span>
                          <span className="text-[10px] text-muted-foreground">/100</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-[11px]">
                        <div className="p-3 rounded-lg bg-emerald-50/50">
                          <p className="font-medium text-emerald-700 mb-1">{ar ? "نقاط القوة" : "Strengths"}</p>
                          <p className="text-muted-foreground">{r.strengths}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-amber-50/50">
                          <p className="font-medium text-amber-700 mb-1">{ar ? "مجالات التحسين" : "Improvements"}</p>
                          <p className="text-muted-foreground">{r.improvements}</p>
                        </div>
                      </div>
                      <div className="mt-3 p-3 rounded-lg bg-primary/5">
                        <p className="font-medium text-primary text-[11px] mb-1">{ar ? "الأهداف القادمة" : "Next Goals"}</p>
                        <p className="text-[11px] text-muted-foreground">{r.goals}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === "documents" && (
              <div className="space-y-2">
                {employee.documents.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText size={24} className="mx-auto text-muted-foreground/20 mb-2" />
                    <p className="text-[12px] text-muted-foreground">{ar ? "لا توجد مستندات" : "No documents"}</p>
                  </div>
                ) : (
                  employee.documents.map((doc, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border/30 hover:bg-muted/20 transition-colors cursor-pointer">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText size={14} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium">{doc.name}</p>
                        <p className="text-[10px] text-muted-foreground">{doc.type} · {doc.uploaded_at}</p>
                      </div>
                      <Eye size={14} className="text-muted-foreground/40" />
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Assets Tab */}
            {activeTab === "assets" && (
              <div className="space-y-2">
                {employee.equipment.length === 0 ? (
                  <div className="text-center py-12">
                    <Package size={24} className="mx-auto text-muted-foreground/20 mb-2" />
                    <p className="text-[12px] text-muted-foreground">{ar ? "لا توجد أصول مخصصة" : "No assets assigned"}</p>
                  </div>
                ) : (
                  employee.equipment.map((eq, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border/30">
                      <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                        {eq.item.includes("Mac") || eq.item.includes("Laptop") ? <Laptop size={14} className="text-muted-foreground" /> :
                         eq.item.includes("Phone") || eq.item.includes("iPhone") || eq.item.includes("Samsung") ? <Smartphone size={14} className="text-muted-foreground" /> :
                         <Package size={14} className="text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium">{eq.item}</p>
                        <p className="text-[10px] text-muted-foreground">Assigned: {eq.assigned_at}</p>
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${eq.status === "assigned" ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
                        {eq.status === "assigned" ? (ar ? "مخصص" : "Assigned") : (ar ? "مسترجع" : "Returned")}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Key Metrics */}
            <div className="p-4 rounded-xl border border-border/40 space-y-3">
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{ar ? "المؤشرات" : "Key Metrics"}</h4>
              {[
                { label: ar ? "المرتب" : "Salary", value: formatEGP(employee.salary) + `/${ar ? "شهر" : "mo"}`, icon: DollarSign },
                { label: ar ? "تاريخ التعيين" : "Hire Date", value: employee.hire_date, icon: Calendar },
                { label: ar ? "مدير مباشر" : "Manager", value: employee.manager_name, icon: Users },
                { label: ar ? "رصيد الإجازات" : "Leave Balance", value: `${employee.leave_balance} ${ar ? "أيام" : "days"}`, icon: Coffee },
                { label: ar ? "نوع التعيين" : "Type", value: employee.employment_type.replace("_", " "), icon: Briefcase },
                { label: ar ? "العنوان" : "Address", value: employee.address, icon: MapPin },
              ].map((m, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <m.icon size={12} className="text-muted-foreground/50" />
                    <span className="text-[11px] text-muted-foreground">{m.label}</span>
                  </div>
                  <span className="text-[11px] font-medium text-foreground text-right max-w-[140px] truncate">{m.value}</span>
                </div>
              ))}
            </div>

            {/* Risk & Performance */}
            <div className="p-4 rounded-xl border border-border/40 space-y-3">
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{ar ? "تحليل الأداء" : "Performance"}</h4>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">{ar ? "خطر الحضور" : "Attendance Risk"}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${employee.attendance_risk === "high" ? "bg-rose-100 text-rose-600" : employee.attendance_risk === "medium" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                  {employee.attendance_risk}
                </span>
              </div>
              {employee.performance_score && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-muted-foreground">{ar ? "درجة الأداء" : "Performance Score"}</span>
                    <span className="text-[11px] font-medium">{employee.performance_score}/100</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${employee.performance_score}%`, backgroundColor: employee.performance_score >= 80 ? "#10B981" : employee.performance_score >= 60 ? "#F59E0B" : "#EF4444" }} />
                  </div>
                </div>
              )}
              {employee.contract_end_date && (
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">{ar ? "انتهاء العقد" : "Contract Expires"}</span>
                  <span className="text-[10px] font-medium text-amber-600">{employee.contract_end_date}</span>
                </div>
              )}
              {employee.probation_end_date && (
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">{ar ? "انتهاء التجربة" : "Probation Ends"}</span>
                  <span className="text-[10px] font-medium text-blue-600">{employee.probation_end_date}</span>
                </div>
              )}
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/30 space-y-2">
                <h4 className="text-[11px] font-semibold text-rose-600 flex items-center gap-1.5"><AlertTriangle size={11} /> {ar ? "تنبيهات" : "Alerts"}</h4>
                {alerts.map(alert => (
                  <div key={alert.id} className="text-[11px] text-foreground">
                    <p className="font-medium">{ar ? alert.title_ar : alert.title}</p>
                    <p className="text-muted-foreground text-[10px] mt-0.5">{ar ? alert.suggested_action_ar : alert.suggested_action}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Actions */}
            <div className="p-4 rounded-xl border border-border/40 space-y-2">
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{ar ? "إجراءات سريعة" : "Quick Actions"}</h4>
              {[
                { icon: Coffee, labelEn: "Approve Leave", labelAr: "الموافقة على إجازة", action: () => {} },
                { icon: TrendingUp, labelEn: "Schedule Review", labelAr: "جدولة مراجعة", action: () => {} },
                { icon: FileText, labelEn: "Renew Contract", labelAr: "تجديد العقد", action: () => {} },
                { icon: Gift, labelEn: "Add Bonus", labelAr: "إضافة مكافأة", action: () => {} },
                { icon: AlertTriangle, labelEn: "Issue Warning", labelAr: "إصدار تنبيه", action: () => {} },
                { icon: LogIn, labelEn: "View Attendance", labelAr: "عرض الحضور", action: () => {} },
              ].map((action, i) => (
                <button key={i} onClick={action.action} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] text-foreground hover:bg-muted/50 transition-colors text-left">
                  <action.icon size={12} className="text-muted-foreground/50" />
                  {ar ? action.labelAr : action.labelEn}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
