/**
 * HR & Workforce — الموارد البشرية
 *
 * Three-tab page:
 *   1. Employees — directory, profiles, skills, documents
 *   2. Attendance — daily check-in/out, status tracking
 *   3. Leave — requests, approval workflow
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { getDataSource } from "../lib/data-source";
import { exportCSV } from "../lib/csv-export";
import type { Database } from "../lib/database.types";
import {
  Plus, Search, X, Loader2, AlertCircle, Download,
  CheckCircle2, Clock, ChevronRight, Eye, User, Users,
  Phone, Mail, MapPin, Calendar, Star, FileText,
  XCircle, AlertTriangle, Building2, Briefcase,
  Award, Shield, Camera, Edit3, Trash2, Check,
  LogIn, LogOut, Coffee, Pause, Play,
} from "lucide-react";

type Employee = Database["public"]["Tables"]["employees"]["Row"];
type Attendance = Database["public"]["Tables"]["attendance"]["Row"];
type LeaveRequest = Database["public"]["Tables"]["leave_requests"]["Row"];

// ─── Constants ────────────────────────────────────────────

const DEPARTMENTS = [
  { value: "production",  en: "Production",  ar: "الإنتاج" },
  { value: "finishing",   en: "Finishing",    ar: "التشطيب" },
  { value: "assembly",    en: "Assembly",     ar: "التجميع" },
  { value: "design",      en: "Design",       ar: "التصميم" },
  { value: "sales",       en: "Sales",        ar: "المبيعات" },
  { value: "admin",       en: "Admin",        ar: "الإدارة" },
  { value: "warehouse",   en: "Warehouse",    ar: "المخزن" },
  { value: "delivery",    en: "Delivery",     ar: "التوصيل" },
  { value: "management",  en: "Management",   ar: "الإدارة العليا" },
] as const;

const EMP_STATUSES = [
  { value: "active",      en: "Active",      ar: "نشط",      pill: "bg-emerald-50 text-emerald-600" },
  { value: "on_leave",    en: "On Leave",    ar: "إجازة",    pill: "bg-amber-50 text-amber-600" },
  { value: "suspended",   en: "Suspended",   ar: "موقوف",    pill: "bg-rose-50 text-rose-600" },
  { value: "terminated",  en: "Terminated",  ar: "منتهي",    pill: "bg-zinc-100 text-zinc-500" },
] as const;

const EMP_TYPES = [
  { value: "full_time", en: "Full Time", ar: "دوام كامل" },
  { value: "part_time", en: "Part Time", ar: "دوام جزئي" },
  { value: "contract",  en: "Contract",  ar: "عقد مؤقت" },
  { value: "daily",     en: "Daily",     ar: "يومية" },
] as const;

const ATTEND_STATUSES = [
  { value: "present",      en: "Present",      ar: "حاضر",      pill: "bg-emerald-50 text-emerald-600" },
  { value: "absent",       en: "Absent",       ar: "غائب",      pill: "bg-rose-50 text-rose-600" },
  { value: "late",         en: "Late",         ar: "متأخر",     pill: "bg-amber-50 text-amber-600" },
  { value: "half_day",     en: "Half Day",     ar: "نص يوم",    pill: "bg-blue-50 text-blue-600" },
  { value: "holiday",      en: "Holiday",      ar: "عطلة",      pill: "bg-indigo-50 text-indigo-600" },
  { value: "sick_leave",   en: "Sick Leave",   ar: "إجازة مرضية", pill: "bg-orange-50 text-orange-600" },
  { value: "annual_leave", en: "Annual Leave", ar: "إجازة سنوية", pill: "bg-cyan-50 text-cyan-600" },
  { value: "excused",      en: "Excused",      ar: "مأذون",     pill: "bg-zinc-100 text-zinc-500" },
] as const;

const LEAVE_TYPES = [
  { value: "annual",    en: "Annual",    ar: "سنوية" },
  { value: "sick",      en: "Sick",      ar: "مرضية" },
  { value: "unpaid",    en: "Unpaid",    ar: "بدون مرتب" },
  { value: "emergency", en: "Emergency", ar: "طارئة" },
  { value: "maternity", en: "Maternity", ar: "أمومة" },
  { value: "other",     en: "Other",     ar: "أخرى" },
] as const;

const LEAVE_STATUSES = [
  { value: "pending",   en: "Pending",   ar: "في الانتظار", pill: "bg-amber-50 text-amber-600" },
  { value: "approved",  en: "Approved",  ar: "موافق عليها", pill: "bg-emerald-50 text-emerald-600" },
  { value: "rejected",  en: "Rejected",  ar: "مرفوضة",     pill: "bg-rose-50 text-rose-600" },
  { value: "cancelled", en: "Cancelled", ar: "ملغاة",      pill: "bg-zinc-100 text-zinc-500" },
] as const;

const SKILLS_CATALOG = [
  { value: "cnc_operator",    en: "CNC Operator",     ar: "مشغل CNC" },
  { value: "edge_banding",    en: "Edge Banding",     ar: "كنار" },
  { value: "painting",        en: "Painting/Finish",  ar: "دهان/تشطيب" },
  { value: "assembly",        en: "Assembly",         ar: "تجميع" },
  { value: "cutting",         en: "Cutting",          ar: "تقطيع" },
  { value: "drilling",        en: "Drilling",         ar: "تخريم" },
  { value: "upholstery",      en: "Upholstery",       ar: "تنجيد" },
  { value: "installation",    en: "Installation",     ar: "تركيب" },
  { value: "design_cad",      en: "Design/CAD",       ar: "تصميم/CAD" },
  { value: "quality_control",  en: "Quality Control",  ar: "مراقبة جودة" },
  { value: "driving",         en: "Driving",          ar: "قيادة" },
  { value: "supervision",     en: "Supervision",      ar: "إشراف" },
] as const;

const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium px-5 hover:opacity-90 transition-opacity disabled:opacity-40";
const inputCls = "w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20";
const labelCls = "text-[11.5px] text-muted-foreground font-medium mb-1 block";

function genNum(prefix: string): string {
  const seq = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${seq}`;
}

async function logActivity(wid: string, type: string, eid: string, en: string, arTxt: string) {
  const ds = getDataSource();
  try { await ds.activity_events.create(wid, { workspace_id: wid, event_type: type, entity_type: "employee", entity_id: eid, description_en: en, description_ar: arTxt, metadata: {} } as any); } catch {}
}

// ─── Employee Modal ───────────────────────────────────────

function EmployeeModal({ onClose, onSaved, editEmp, ar, wid }: {
  onClose: () => void; onSaved: () => void;
  editEmp: Employee | null; ar: boolean; wid: string;
}) {
  const [empNum, setEmpNum] = useState(editEmp?.employee_number || genNum("EMP"));
  const [name, setName] = useState(editEmp?.full_name || "");
  const [nameAr, setNameAr] = useState(editEmp?.full_name_ar || "");
  const [phone, setPhone] = useState(editEmp?.phone || "");
  const [email, setEmail] = useState(editEmp?.email || "");
  const [dept, setDept] = useState(editEmp?.department || "production");
  const [title, setTitle] = useState(editEmp?.job_title || "");
  const [titleAr, setTitleAr] = useState(editEmp?.job_title_ar || "");
  const [empType, setEmpType] = useState(editEmp?.employment_type || "full_time");
  const [hireDate, setHireDate] = useState(editEmp?.hire_date || new Date().toISOString().slice(0, 10));
  const [salary, setSalary] = useState(editEmp?.salary?.toString() || "");
  const [salaryType, setSalaryType] = useState(editEmp?.salary_type || "monthly");
  const [emergencyContact, setEmergencyContact] = useState(editEmp?.emergency_contact || "");
  const [emergencyPhone, setEmergencyPhone] = useState(editEmp?.emergency_phone || "");
  const [address, setAddress] = useState(editEmp?.address || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!name.trim()) { setError(ar ? "الاسم مطلوب" : "Name required"); return; }
    setLoading(true); setError("");
    const ds = getDataSource();
    const payload: any = {
      workspace_id: wid, employee_number: empNum.trim(), full_name: name.trim(),
      full_name_ar: nameAr || null, phone: phone || null, email: email || null,
      department: dept, job_title: title || null, job_title_ar: titleAr || null,
      employment_type: empType, hire_date: hireDate || null,
      salary: salary ? parseFloat(salary) : null, salary_type: salaryType,
      emergency_contact: emergencyContact || null, emergency_phone: emergencyPhone || null,
      address: address || null, metadata: {},
    };
    if (editEmp) {
      await ds.employees.update(wid, editEmp.id, payload);
    } else {
      payload.status = "active";
      payload.skills = [];
      payload.documents = [];
      await ds.employees.create(wid, payload);
      await logActivity(wid, "employee_added", empNum, `Employee ${name} added`, `تم إضافة الموظف ${name}`);
    }
    setLoading(false); onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background rounded-2xl border border-border/60 shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-border/40 shrink-0 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>
            {editEmp ? (ar ? "تعديل موظف" : "Edit Employee") : (ar ? "موظف جديد" : "New Employee")}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>{ar ? "رقم الموظف" : "Employee #"}</label>
              <input className={inputCls} value={empNum} onChange={e => setEmpNum(e.target.value)} /></div>
            <div><label className={labelCls}>{ar ? "القسم" : "Department"}</label>
              <select className={inputCls} value={dept} onChange={e => setDept(e.target.value)}>
                {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{ar ? d.ar : d.en}</option>)}
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>{ar ? "الاسم (EN)" : "Full Name"}</label>
              <input className={inputCls} value={name} onChange={e => setName(e.target.value)} /></div>
            <div><label className={labelCls}>{ar ? "الاسم (AR)" : "Name (Arabic)"}</label>
              <input className={inputCls} dir="rtl" value={nameAr} onChange={e => setNameAr(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>{ar ? "المسمى الوظيفي" : "Job Title"}</label>
              <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} /></div>
            <div><label className={labelCls}>{ar ? "المسمى (AR)" : "Title (Arabic)"}</label>
              <input className={inputCls} dir="rtl" value={titleAr} onChange={e => setTitleAr(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>{ar ? "الهاتف" : "Phone"}</label>
              <input className={inputCls} value={phone} onChange={e => setPhone(e.target.value)} /></div>
            <div><label className={labelCls}>{ar ? "الإيميل" : "Email"}</label>
              <input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className={labelCls}>{ar ? "نوع التعيين" : "Type"}</label>
              <select className={inputCls} value={empType} onChange={e => setEmpType(e.target.value)}>
                {EMP_TYPES.map(t => <option key={t.value} value={t.value}>{ar ? t.ar : t.en}</option>)}
              </select></div>
            <div><label className={labelCls}>{ar ? "تاريخ التعيين" : "Hire Date"}</label>
              <input type="date" className={inputCls} value={hireDate} onChange={e => setHireDate(e.target.value)} /></div>
            <div><label className={labelCls}>{ar ? "المرتب" : "Salary"}</label>
              <input type="number" className={inputCls} value={salary} onChange={e => setSalary(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>{ar ? "جهة اتصال طوارئ" : "Emergency Contact"}</label>
              <input className={inputCls} value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} /></div>
            <div><label className={labelCls}>{ar ? "هاتف الطوارئ" : "Emergency Phone"}</label>
              <input className={inputCls} value={emergencyPhone} onChange={e => setEmergencyPhone(e.target.value)} /></div>
          </div>
          <div><label className={labelCls}>{ar ? "العنوان" : "Address"}</label>
            <input className={inputCls} value={address} onChange={e => setAddress(e.target.value)} /></div>
          {error && <p className="text-[12px] text-rose-500 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
        </div>
        <div className="px-6 py-4 border-t border-border/40 shrink-0 flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border/60 text-[13px] font-medium hover:bg-muted/50">{ar ? "إلغاء" : "Cancel"}</button>
          <button onClick={handleSave} disabled={loading} className={btnPrimary + " flex-1 h-10"}>
            {loading && <Loader2 size={12} className="animate-spin" />} {ar ? "حفظ" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Employee Detail ──────────────────────────────────────

function EmployeeDetail({ emp, onBack, ar, wid, onRefresh }: {
  emp: Employee; onBack: () => void; ar: boolean; wid: string; onRefresh: () => void;
}) {
  const [tab, setTab] = useState<"info" | "skills" | "attendance" | "leaves">("info");
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loadingSub, setLoadingSub] = useState(false);
  const [editModal, setEditModal] = useState(false);

  const st = EMP_STATUSES.find(s => s.value === emp.status)!;
  const deptDef = DEPARTMENTS.find(d => d.value === emp.department);
  const typeDef = EMP_TYPES.find(t => t.value === emp.employment_type);
  const skills: any[] = Array.isArray(emp.skills) ? emp.skills as any[] : [];

  async function loadSub() {
    setLoadingSub(true);
    const ds = getDataSource();
    const [a, l] = await Promise.all([
      ds.attendance.list(wid, { employee_id: emp.id }),
      ds.leave_requests.list(wid, { employee_id: emp.id }),
    ]);
    setAttendance(a as Attendance[]);
    setLeaves(l as LeaveRequest[]);
    setLoadingSub(false);
  }

  useEffect(() => { loadSub(); }, [emp.id]);

  async function addSkill(skill: string, level: number) {
    const existing = skills.filter((s: any) => s.skill !== skill);
    const updated = [...existing, { skill, level }];
    const ds = getDataSource();
    await ds.employees.update(wid, emp.id, { skills: updated } as any);
    onRefresh();
  }

  async function removeSkill(skill: string) {
    const updated = skills.filter((s: any) => s.skill !== skill);
    const ds = getDataSource();
    await ds.employees.update(wid, emp.id, { skills: updated } as any);
    onRefresh();
  }

  async function markAttendance(status: string) {
    const ds = getDataSource();
    const today = new Date().toISOString().slice(0, 10);
    const existing = attendance.find(a => a.date === today);
    if (existing) {
      const payload: any = { status };
      if (status === "present" && !existing.check_in) payload.check_in = new Date().toISOString();
      await ds.attendance.update(wid, existing.id, payload);
    } else {
      await ds.attendance.create(wid, {
        workspace_id: wid, employee_id: emp.id, date: today, status,
        check_in: status === "present" ? new Date().toISOString() : null,
        overtime_hours: 0, metadata: {},
      } as any);
    }
    loadSub();
  }

  async function checkOut() {
    const today = new Date().toISOString().slice(0, 10);
    const existing = attendance.find(a => a.date === today);
    if (existing) {
      await getDataSource().attendance.update(wid, existing.id, { check_out: new Date().toISOString() } as any);
      loadSub();
    }
  }

  const todayAtt = attendance.find(a => a.date === new Date().toISOString().slice(0, 10));

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-muted/50"><ChevronRight size={16} className="rotate-180" /></button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[11px] font-mono text-muted-foreground">{emp.employee_number}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.pill}`}>{ar ? st.ar : st.en}</span>
            {deptDef && <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{ar ? deptDef.ar : deptDef.en}</span>}
          </div>
          <h2 className="text-[18px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>
            {ar && emp.full_name_ar ? emp.full_name_ar : emp.full_name}
          </h2>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
            {emp.job_title && <span className="flex items-center gap-1"><Briefcase size={10} />{ar && emp.job_title_ar ? emp.job_title_ar : emp.job_title}</span>}
            {typeDef && <span>{ar ? typeDef.ar : typeDef.en}</span>}
            {emp.hire_date && <span className="flex items-center gap-1"><Calendar size={10} />{emp.hire_date}</span>}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => setEditModal(true)} className="text-[11px] text-muted-foreground px-3 py-1.5 rounded-lg border border-border/60 hover:bg-muted/50 flex items-center gap-1"><Edit3 size={11} /> {ar ? "تعديل" : "Edit"}</button>
        </div>
      </div>

      {/* Quick attendance */}
      <div className="mb-5 p-4 border border-border/40 rounded-xl flex items-center gap-3 flex-wrap">
        <span className="text-[12px] font-medium">{ar ? "حضور اليوم:" : "Today:"}</span>
        {todayAtt ? (
          <>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ATTEND_STATUSES.find(s => s.value === todayAtt.status)?.pill}`}>
              {ar ? ATTEND_STATUSES.find(s => s.value === todayAtt.status)?.ar : todayAtt.status}
            </span>
            {todayAtt.check_in && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><LogIn size={9} />{new Date(todayAtt.check_in).toLocaleTimeString()}</span>}
            {todayAtt.check_out && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><LogOut size={9} />{new Date(todayAtt.check_out).toLocaleTimeString()}</span>}
            {!todayAtt.check_out && todayAtt.status === "present" && (
              <button onClick={checkOut} className="text-[10px] text-blue-600 px-2 py-1 rounded border border-blue-200 hover:opacity-70 flex items-center gap-1"><LogOut size={9} />{ar ? "انصراف" : "Check Out"}</button>
            )}
          </>
        ) : (
          <div className="flex gap-1">
            <button onClick={() => markAttendance("present")} className="text-[10px] text-emerald-600 px-2 py-1 rounded border border-emerald-200 hover:opacity-70">{ar ? "حاضر" : "Present"}</button>
            <button onClick={() => markAttendance("absent")} className="text-[10px] text-rose-600 px-2 py-1 rounded border border-rose-200 hover:opacity-70">{ar ? "غائب" : "Absent"}</button>
            <button onClick={() => markAttendance("late")} className="text-[10px] text-amber-600 px-2 py-1 rounded border border-amber-200 hover:opacity-70">{ar ? "متأخر" : "Late"}</button>
            <button onClick={() => markAttendance("sick_leave")} className="text-[10px] text-orange-600 px-2 py-1 rounded border border-orange-200 hover:opacity-70">{ar ? "مرضي" : "Sick"}</button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-border/30 pb-3">
        {[
          { id: "info" as const, en: "Info", ar: "بيانات", icon: User },
          { id: "skills" as const, en: "Skills", ar: "المهارات", icon: Award },
          { id: "attendance" as const, en: `Attendance (${attendance.length})`, ar: `الحضور (${attendance.length})`, icon: Clock },
          { id: "leaves" as const, en: `Leaves (${leaves.length})`, ar: `الإجازات (${leaves.length})`, icon: Coffee },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-2 rounded-lg text-[12px] font-medium transition-colors flex items-center gap-1.5
              ${tab === t.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"}`}>
            <t.icon size={13} />{ar ? t.ar : t.en}
          </button>
        ))}
      </div>

      {/* ── Info ── */}
      {tab === "info" && (
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: Phone, label: ar ? "الهاتف" : "Phone", value: emp.phone },
            { icon: Mail, label: ar ? "الإيميل" : "Email", value: emp.email },
            { icon: MapPin, label: ar ? "العنوان" : "Address", value: emp.address },
            { icon: Calendar, label: ar ? "تاريخ التعيين" : "Hire Date", value: emp.hire_date },
            { icon: AlertTriangle, label: ar ? "جهة طوارئ" : "Emergency", value: emp.emergency_contact ? `${emp.emergency_contact} (${emp.emergency_phone || ""})` : null },
          ].filter(f => f.value).map((f, i) => (
            <div key={i} className="flex items-start gap-2.5 p-3 border border-border/30 rounded-xl">
              <f.icon size={13} className="text-muted-foreground mt-0.5 shrink-0" />
              <div><p className="text-[10px] text-muted-foreground">{f.label}</p><p className="text-[13px]">{f.value}</p></div>
            </div>
          ))}
        </div>
      )}

      {/* ── Skills ── */}
      {tab === "skills" && (
        <div>
          <div className="space-y-2 mb-4">
            {skills.map((s: any) => {
              const def = SKILLS_CATALOG.find(c => c.value === s.skill);
              return (
                <div key={s.skill} className="flex items-center gap-3 px-4 py-3 border border-border/30 rounded-xl">
                  <Award size={13} className="text-primary shrink-0" />
                  <span className="text-[13px] flex-1">{def ? (ar ? def.ar : def.en) : s.skill}</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => addSkill(s.skill, n)}
                        className={`w-5 h-5 rounded ${n <= s.level ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground/20"} text-[9px] font-bold`}>
                        {n}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => removeSkill(s.skill)} className="text-rose-400 hover:opacity-70 p-1"><X size={12} /></button>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground mb-2">{ar ? "إضافة مهارة:" : "Add skill:"}</p>
          <div className="flex flex-wrap gap-1.5">
            {SKILLS_CATALOG.filter(c => !skills.some((s: any) => s.skill === c.value)).map(c => (
              <button key={c.value} onClick={() => addSkill(c.value, 1)}
                className="text-[10px] px-2.5 py-1 rounded-full border border-border/60 text-muted-foreground hover:bg-primary/10 hover:text-primary">
                + {ar ? c.ar : c.en}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Attendance ── */}
      {tab === "attendance" && (
        loadingSub ? <div className="py-12 flex justify-center"><Loader2 size={16} className="animate-spin text-muted-foreground" /></div> :
        attendance.length === 0 ? <div className="py-12 text-center text-[13px] text-muted-foreground/50">{ar ? "مفيش سجلات حضور" : "No attendance records"}</div> :
        <div className="space-y-2">
          {attendance.slice(0, 30).map(a => {
            const ast = ATTEND_STATUSES.find(s => s.value === a.status)!;
            return (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3 border border-border/30 rounded-xl">
                <span className="text-[12px] font-mono text-muted-foreground w-24">{a.date}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ast.pill}`}>{ar ? ast.ar : ast.en}</span>
                {a.check_in && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><LogIn size={9} />{new Date(a.check_in).toLocaleTimeString()}</span>}
                {a.check_out && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><LogOut size={9} />{new Date(a.check_out).toLocaleTimeString()}</span>}
                {a.overtime_hours > 0 && <span className="text-[10px] text-amber-600">+{a.overtime_hours}h OT</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Leaves ── */}
      {tab === "leaves" && (
        loadingSub ? <div className="py-12 flex justify-center"><Loader2 size={16} className="animate-spin text-muted-foreground" /></div> :
        leaves.length === 0 ? <div className="py-12 text-center text-[13px] text-muted-foreground/50">{ar ? "مفيش طلبات إجازات" : "No leave requests"}</div> :
        <div className="space-y-2">
          {leaves.map(l => {
            const lst = LEAVE_STATUSES.find(s => s.value === l.status)!;
            const lt = LEAVE_TYPES.find(t => t.value === l.leave_type);
            return (
              <div key={l.id} className="flex items-center gap-3 px-4 py-3 border border-border/30 rounded-xl flex-wrap">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${lst.pill}`}>{ar ? lst.ar : lst.en}</span>
                {lt && <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{ar ? lt.ar : lt.en}</span>}
                <span className="text-[12px]">{l.start_date} → {l.end_date}</span>
                <span className="text-[10px] text-muted-foreground">{l.days} {ar ? "يوم" : "days"}</span>
                {l.reason && <span className="text-[11px] text-muted-foreground flex-1 truncate">{l.reason}</span>}
              </div>
            );
          })}
        </div>
      )}

      {editModal && <EmployeeModal onClose={() => setEditModal(false)} onSaved={() => { setEditModal(false); onRefresh(); }} editEmp={emp} ar={ar} wid={wid} />}
    </div>
  );
}

// ─── Leave Request Modal ──────────────────────────────────

function LeaveModal({ onClose, onSaved, employees, ar, wid }: {
  onClose: () => void; onSaved: () => void;
  employees: Employee[]; ar: boolean; wid: string;
}) {
  const [empId, setEmpId] = useState("");
  const [leaveType, setLeaveType] = useState("annual");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const days = useMemo(() => {
    const s = new Date(startDate); const e = new Date(endDate);
    return Math.max(1, Math.ceil((e.getTime() - s.getTime()) / 86400000) + 1);
  }, [startDate, endDate]);

  async function handleSave() {
    if (!empId) return;
    setLoading(true);
    const ds = getDataSource();
    await ds.leave_requests.create(wid, {
      workspace_id: wid, employee_id: empId, leave_type: leaveType,
      start_date: startDate, end_date: endDate, days,
      reason: reason || null, status: "pending", metadata: {},
    } as any);
    setLoading(false); onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background rounded-2xl border border-border/60 shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-border/40 shrink-0 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>{ar ? "طلب إجازة" : "Leave Request"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          <div><label className={labelCls}>{ar ? "الموظف" : "Employee"}</label>
            <select className={inputCls} value={empId} onChange={e => setEmpId(e.target.value)}>
              <option value="">{ar ? "— اختر —" : "— Select —"}</option>
              {employees.filter(e => e.status === "active").map(e => (
                <option key={e.id} value={e.id}>{e.employee_number} — {e.full_name}</option>
              ))}
            </select></div>
          <div><label className={labelCls}>{ar ? "نوع الإجازة" : "Leave Type"}</label>
            <select className={inputCls} value={leaveType} onChange={e => setLeaveType(e.target.value)}>
              {LEAVE_TYPES.map(t => <option key={t.value} value={t.value}>{ar ? t.ar : t.en}</option>)}
            </select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>{ar ? "من" : "From"}</label>
              <input type="date" className={inputCls} value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
            <div><label className={labelCls}>{ar ? "إلى" : "To"}</label>
              <input type="date" className={inputCls} value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
          </div>
          <p className="text-[11px] text-muted-foreground">{days} {ar ? "يوم" : "day(s)"}</p>
          <div><label className={labelCls}>{ar ? "السبب" : "Reason"}</label>
            <textarea className={inputCls + " h-16 py-2 resize-none"} value={reason} onChange={e => setReason(e.target.value)} /></div>
        </div>
        <div className="px-6 py-4 border-t border-border/40 shrink-0 flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border/60 text-[13px] font-medium hover:bg-muted/50">{ar ? "إلغاء" : "Cancel"}</button>
          <button onClick={handleSave} disabled={loading || !empId} className={btnPrimary + " flex-1 h-10"}>
            {loading && <Loader2 size={12} className="animate-spin" />} {ar ? "إرسال الطلب" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────

export default function HRWorkforce() {
  const { lang } = useLanguage();
  const { workspace } = useAuth();
  const ar = lang === "ar";

  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [empModal, setEmpModal] = useState(false);
  const [editEmp, setEditEmp] = useState<Employee | null>(null);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [leaveModal, setLeaveModal] = useState(false);
  const [topTab, setTopTab] = useState<"employees" | "leaves">("employees");

  async function loadAll() {
    const wid = workspace?.id || "demo";
    const ds = getDataSource();
    const [e, l] = await Promise.all([
      ds.employees.list(wid),
      ds.leave_requests.list(wid),
    ]);
    setEmployees(e as Employee[]);
    setLeaves(l as LeaveRequest[]);
    setLoading(false);
    if (selectedEmp) {
      const u = (e as Employee[]).find(x => x.id === selectedEmp.id);
      if (u) setSelectedEmp(u);
    }
  }

  useEffect(() => { loadAll(); }, [workspace?.id]);

  const filteredEmps = useMemo(() => {
    let list = employees;
    if (filterDept !== "all") list = list.filter(e => e.department === filterDept);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.full_name.toLowerCase().includes(q) ||
        (e.full_name_ar || "").toLowerCase().includes(q) ||
        e.employee_number.toLowerCase().includes(q) ||
        (e.job_title || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [employees, filterDept, search]);

  const activeCount = employees.filter(e => e.status === "active").length;
  const onLeaveCount = employees.filter(e => e.status === "on_leave").length;
  const pendingLeaves = leaves.filter(l => l.status === "pending").length;

  async function approveLeave(id: string) {
    const ds = getDataSource();
    await ds.leave_requests.update(workspace?.id || "", id, { status: "approved", approved_at: new Date().toISOString() } as any);
    loadAll();
  }

  async function rejectLeave(id: string) {
    const ds = getDataSource();
    await ds.leave_requests.update(workspace?.id || "", id, { status: "rejected" } as any);
    loadAll();
  }

  function handleExport() {
    exportCSV(employees.map(e => ({
      employee_number: e.employee_number, full_name: e.full_name,
      department: e.department, job_title: e.job_title, status: e.status,
      hire_date: e.hire_date, employment_type: e.employment_type,
    })), `thoth-employees-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  if (selectedEmp) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <EmployeeDetail emp={selectedEmp} onBack={() => { setSelectedEmp(null); loadAll(); }} ar={ar} wid={workspace?.id || ""} onRefresh={loadAll} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight" style={{ fontFamily: "var(--app-font-serif)" }}>
            {ar ? "الموارد البشرية" : "HR & Workforce"}
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">{ar ? "إدارة الموظفين والحضور والإجازات" : "Employees, Attendance & Leave Management"}</p>
        </div>
        <button onClick={() => topTab === "employees" ? setEmpModal(true) : setLeaveModal(true)} className={btnPrimary + " h-10"}>
          <Plus size={14} /> {topTab === "employees" ? (ar ? "موظف جديد" : "New Employee") : (ar ? "طلب إجازة" : "Leave Request")}
        </button>
      </div>

      {/* Top tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: "employees" as const, en: "Employees", ar: "الموظفين", icon: Users, count: employees.length },
          { id: "leaves" as const, en: "Leave Requests", ar: "الإجازات", icon: Coffee, count: leaves.length },
        ].map(t => (
          <button key={t.id} onClick={() => setTopTab(t.id)}
            className={`px-4 py-2.5 rounded-xl text-[13px] font-medium transition-colors flex items-center gap-2
              ${topTab === t.id ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}>
            <t.icon size={15} />{ar ? t.ar : t.en} <span className="text-[10px] opacity-70">({t.count})</span>
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: ar ? "نشط" : "Active", value: activeCount, color: "text-emerald-600" },
          { label: ar ? "في إجازة" : "On Leave", value: onLeaveCount, color: "text-amber-600" },
          { label: ar ? "طلبات معلقة" : "Pending Leaves", value: pendingLeaves, color: pendingLeaves > 0 ? "text-rose-600" : "text-zinc-400" },
        ].map((s, i) => (
          <div key={i} className="border border-border/40 rounded-xl p-4 bg-background">
            <p className="text-[11px] text-muted-foreground mb-1">{s.label}</p>
            <p className={`text-[20px] font-semibold tabular-nums ${s.color}`} style={{ fontFamily: "var(--app-font-serif)" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Employees Tab ── */}
      {topTab === "employees" && (
        <>
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
              <input className={inputCls + " pl-9"} placeholder={ar ? "بحث..." : "Search..."} value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-1 overflow-x-auto">
              {[{ v: "all", en: "All", ar: "الكل" }, ...DEPARTMENTS.map(d => ({ v: d.value, en: d.en, ar: d.ar }))].map(g => (
                <button key={g.v} onClick={() => setFilterDept(g.v)} className={`px-2.5 py-2 rounded-lg text-[11px] font-medium whitespace-nowrap ${filterDept === g.v ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"}`}>{ar ? g.ar : g.en}</button>
              ))}
            </div>
            <button onClick={handleExport} className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground"><Download size={14} /></button>
          </div>

          {loading ? (
            <div className="py-16 flex justify-center"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
          ) : employees.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-4"><Users size={22} className="text-muted-foreground/30" /></div>
              <h3 className="text-[15px] font-semibold mb-1" style={{ fontFamily: "var(--app-font-serif)" }}>{ar ? "مفيش موظفين لسه" : "No employees yet"}</h3>
              <button onClick={() => setEmpModal(true)} className={btnPrimary + " h-10 mt-4"}><Plus size={14} /> {ar ? "أضف موظف" : "Add Employee"}</button>
            </div>
          ) : filteredEmps.length === 0 ? (
            <div className="py-16 text-center text-[13px] text-muted-foreground/50">{ar ? "مفيش نتائج" : "No results"}</div>
          ) : (
            <div className="space-y-3">
              {filteredEmps.map(emp => {
                const st = EMP_STATUSES.find(s => s.value === emp.status)!;
                const deptDef = DEPARTMENTS.find(d => d.value === emp.department);
                const skills: any[] = Array.isArray(emp.skills) ? emp.skills as any[] : [];
                return (
                  <button key={emp.id} onClick={() => setSelectedEmp(emp)}
                    className="w-full text-left bg-background border border-border/40 rounded-xl p-5 hover:shadow-sm hover:border-border/70 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-[10.5px] font-mono text-muted-foreground">{emp.employee_number}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.pill}`}>{ar ? st.ar : st.en}</span>
                          {deptDef && <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{ar ? deptDef.ar : deptDef.en}</span>}
                        </div>
                        <p className="text-[15px] font-medium" style={{ fontFamily: "var(--app-font-serif)" }}>
                          {ar && emp.full_name_ar ? emp.full_name_ar : emp.full_name}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
                          {emp.job_title && <span className="flex items-center gap-1"><Briefcase size={9} />{ar && emp.job_title_ar ? emp.job_title_ar : emp.job_title}</span>}
                          {emp.phone && <span className="flex items-center gap-1"><Phone size={9} />{emp.phone}</span>}
                          {skills.length > 0 && <span className="flex items-center gap-1"><Award size={9} />{skills.length} {ar ? "مهارات" : "skills"}</span>}
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-muted-foreground/30 mt-2 shrink-0" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Leaves Tab ── */}
      {topTab === "leaves" && (
        loading ? (
          <div className="py-16 flex justify-center"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
        ) : leaves.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-4"><Coffee size={22} className="text-muted-foreground/30" /></div>
            <h3 className="text-[15px] font-semibold mb-1" style={{ fontFamily: "var(--app-font-serif)" }}>{ar ? "مفيش طلبات إجازات" : "No leave requests"}</h3>
            <button onClick={() => setLeaveModal(true)} className={btnPrimary + " h-10 mt-4"}><Plus size={14} /> {ar ? "طلب إجازة" : "New Request"}</button>
          </div>
        ) : (
          <div className="space-y-3">
            {leaves.map(l => {
              const lst = LEAVE_STATUSES.find(s => s.value === l.status)!;
              const lt = LEAVE_TYPES.find(t => t.value === l.leave_type);
              const emp = employees.find(e => e.id === l.employee_id);
              return (
                <div key={l.id} className="bg-background border border-border/40 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${lst.pill}`}>{ar ? lst.ar : lst.en}</span>
                        {lt && <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{ar ? lt.ar : lt.en}</span>}
                        <span className="text-[10px] text-muted-foreground">{l.days} {ar ? "يوم" : "days"}</span>
                      </div>
                      <p className="text-[14px] font-medium" style={{ fontFamily: "var(--app-font-serif)" }}>
                        {emp ? (ar && emp.full_name_ar ? emp.full_name_ar : emp.full_name) : "—"}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Calendar size={10} />{l.start_date} → {l.end_date}
                      </p>
                      {l.reason && <p className="text-[11px] text-muted-foreground mt-1">{l.reason}</p>}
                    </div>
                    {l.status === "pending" && (
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => approveLeave(l.id)} className="text-[10px] text-emerald-600 px-2.5 py-1.5 rounded-lg border border-emerald-200 hover:opacity-70 flex items-center gap-1"><Check size={10} />{ar ? "موافقة" : "Approve"}</button>
                        <button onClick={() => rejectLeave(l.id)} className="text-[10px] text-rose-600 px-2.5 py-1.5 rounded-lg border border-rose-200 hover:opacity-70 flex items-center gap-1"><XCircle size={10} />{ar ? "رفض" : "Reject"}</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {empModal && <EmployeeModal onClose={() => { setEmpModal(false); setEditEmp(null); }} onSaved={() => { setEmpModal(false); setEditEmp(null); loadAll(); }} editEmp={editEmp} ar={ar} wid={workspace?.id || ""} />}
      {leaveModal && <LeaveModal onClose={() => setLeaveModal(false)} onSaved={() => { setLeaveModal(false); loadAll(); }} employees={employees} ar={ar} wid={workspace?.id || ""} />}
    </div>
  );
}
