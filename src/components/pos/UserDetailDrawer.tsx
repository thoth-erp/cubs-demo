import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import {
  MODULES, PERMISSION_LABELS, ROLE_TEMPLATES, type PermissionMap, type PermissionAction,
  countPermissions, countDangerousPermissions,
} from "../../lib/permissions";
import { DEPARTMENTS } from "../../lib/access-control";
import {
  X, Shield, User, Mail, Phone, Building2, Clock, Key, AlertTriangle,
  Check, ChevronDown, ChevronRight, Eye, Edit3, Trash2, Lock,
  Smartphone, Monitor, Globe, LogOut, Activity, Star, Briefcase,
  Fingerprint, ShieldCheck, ShieldAlert, Ban, History, Settings,
} from "lucide-react";

const inputCls = "w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20";
const labelCls = "text-[11px] text-muted-foreground font-medium mb-1 block";

interface Member {
  id: string;
  user_id: string;
  role: string;
  department?: string;
  display_name?: string;
  status: string;
  email?: string;
  phone?: string;
  permissions?: PermissionMap;
  joined_at?: string;
  last_active?: string;
  avatar_url?: string;
  two_factor?: boolean;
  branch_access?: string[];
  login_count?: number;
}

interface Session {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  last_active: string;
  current: boolean;
}

interface ActivityLogEntry {
  id: string;
  action: string;
  target: string;
  timestamp: string;
  details: string;
}

const MOCK_SESSIONS: Session[] = [
  { id: "s1", device: "MacBook Pro", browser: "Chrome 126", ip: "192.168.1.45", location: "Cairo, Egypt", last_active: "Just now", current: true },
  { id: "s2", device: "iPhone 15", browser: "Safari Mobile", ip: "192.168.1.78", location: "Cairo, Egypt", last_active: "2 hours ago", current: false },
  { id: "s3", device: "Windows Desktop", browser: "Firefox 128", ip: "10.0.0.12", location: "Alexandria, Egypt", last_active: "3 days ago", current: false },
];

const MOCK_ACTIVITY: ActivityLogEntry[] = [
  { id: "a1", action: "login", target: "System", timestamp: "2 min ago", details: "Logged in from Chrome on MacBook" },
  { id: "a2", action: "view", target: "Sales Orders", timestamp: "15 min ago", details: "Viewed 12 order records" },
  { id: "a3", action: "edit", target: "Order #SO-2024-089", timestamp: "1 hour ago", details: "Updated delivery date" },
  { id: "a4", action: "create", target: "Quotation #QT-045", timestamp: "3 hours ago", details: "Created new quotation for Meridian Corp" },
  { id: "a5", action: "approve", target: "Purchase Order #PO-012", timestamp: "Yesterday", details: "Approved budget allocation" },
  { id: "a6", action: "export", target: "Finance Report", timestamp: "Yesterday", details: "Exported monthly P&L as PDF" },
  { id: "a7", action: "delete", target: "Draft Quotation #QT-038", timestamp: "2 days ago", details: "Removed duplicate quotation" },
  { id: "a8", action: "settings", target: "Branch Settings", timestamp: "3 days ago", details: "Updated Showroom Olaya working hours" },
];

export function UserDetailDrawer({ member, onClose, onSave }: {
  member: Member;
  onClose: () => void;
  onSave: (updated: Member) => void;
}) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [tab, setTab] = useState<"overview" | "permissions" | "sessions" | "activity" | "security">("overview");
  const [permissions, setPermissions] = useState<PermissionMap>(member.permissions || {});
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    display_name: member.display_name || "",
    email: member.email || "",
    phone: member.phone || "",
    department: member.department || "",
    role: member.role || "member",
  });

  const tmpl = ROLE_TEMPLATES.find(t => t.id === member.role) || ROLE_TEMPLATES[ROLE_TEMPLATES.length - 1];
  const dept = DEPARTMENTS.find(d => d.value === member.department);

  const tabs = [
    { id: "overview" as const, en: "Overview", ar: "نظرة عامة", icon: User },
    { id: "permissions" as const, en: "Permissions", ar: "الصلاحيات", icon: Shield },
    { id: "sessions" as const, en: "Sessions", ar: "الجلسات", icon: Monitor },
    { id: "activity" as const, en: "Activity", ar: "النشاط", icon: Activity },
    { id: "security" as const, en: "Security", ar: "الأمان", icon: ShieldCheck },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative w-[520px] bg-background border-l border-border shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="shrink-0 px-5 py-4 border-b border-border/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-[14px] font-bold text-primary">
                {(member.display_name || "?").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-[15px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>{member.display_name}</p>
                <p className="text-[11px] text-muted-foreground">{member.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setEditing(!editing)} className="w-8 h-8 rounded-lg border border-border/60 flex items-center justify-center hover:bg-muted transition-colors">
                <Edit3 size={13} />
              </button>
              <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
                <X size={14} />
              </button>
            </div>
          </div>
          {/* Tabs */}
          <div className="flex gap-0.5 bg-muted/50 rounded-lg p-0.5">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 h-8 rounded-md text-[11px] font-medium flex items-center justify-center gap-1 transition-all ${
                  tab === t.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <t.icon size={11} />
                {ar ? t.ar : t.en}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* Overview Tab */}
            {tab === "overview" && (
              <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5 space-y-5">
                {editing ? (
                  <div className="space-y-3">
                    <div>
                      <label className={labelCls}>{ar ? "الاسم" : "Name"}</label>
                      <input value={form.display_name} onChange={e => setForm(p => ({ ...p, display_name: e.target.value }))} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>{ar ? "الإيميل" : "Email"}</label>
                      <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>{ar ? "الهاتف" : "Phone"}</label>
                      <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className={inputCls} placeholder="+20 ..." />
                    </div>
                    <div>
                      <label className={labelCls}>{ar ? "القسم" : "Department"}</label>
                      <select value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} className={inputCls + " appearance-none cursor-pointer"}>
                        <option value="">{ar ? "اختر..." : "Select..."}</option>
                        {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{ar ? d.ar : d.en}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>{ar ? "الدور" : "Role"}</label>
                      <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className={inputCls + " appearance-none cursor-pointer"}>
                        {ROLE_TEMPLATES.map(t => <option key={t.id} value={t.id}>{ar ? t.ar : t.en}</option>)}
                      </select>
                    </div>
                    <button
                      onClick={() => {
                        onSave({ ...member, ...form });
                        setEditing(false);
                      }}
                      className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-90 transition-opacity"
                    >
                      {ar ? "حفظ" : "Save Changes"}
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Info Cards */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-3 rounded-xl bg-muted/30">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Building2 size={11} className="text-muted-foreground/50" />
                          <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{ar ? "القسم" : "Department"}</span>
                        </div>
                        <p className="text-[12px] font-medium">{dept ? (ar ? dept.ar : dept.en) : "—"}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/30">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Briefcase size={11} className="text-muted-foreground/50" />
                          <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{ar ? "الدور" : "Role"}</span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${tmpl.color}`}>{ar ? tmpl.ar : tmpl.en}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/30">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Clock size={11} className="text-muted-foreground/50" />
                          <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{ar ? "تاريخ الانضمام" : "Joined"}</span>
                        </div>
                        <p className="text-[12px] font-medium">{member.joined_at?.slice(0, 10) || "—"}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/30">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Activity size={11} className="text-muted-foreground/50" />
                          <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{ar ? "آخر نشاط" : "Last Active"}</span>
                        </div>
                        <p className="text-[12px] font-medium">{member.last_active || "Unknown"}</p>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between p-3 rounded-xl border border-border/40">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${member.status === "active" ? "bg-emerald-500" : "bg-muted"}`} />
                        <span className="text-[12px] font-medium">{ar ? (member.status === "active" ? "نشط" : "غير نشط") : (member.status === "active" ? "Active" : "Inactive")}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{member.login_count || 0} {ar ? "تسجيل دخول" : "logins"}</span>
                    </div>

                    {/* Quick Permission Summary */}
                    <div>
                      <h4 className="text-[12px] font-medium mb-2">{ar ? "ملخص الصلاحيات" : "Permission Summary"}</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {MODULES.filter(m => (permissions[m.key] || []).length > 0).slice(0, 8).map(m => (
                          <span key={m.key} className="text-[10px] px-2 py-1 rounded-lg bg-primary/10 text-primary font-medium">
                            {ar ? m.ar : m.en}: {(permissions[m.key] || []).length}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* Permissions Tab */}
            {tab === "permissions" && (
              <motion.div key="permissions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5">
                <PermissionEditor permissions={permissions} onChange={setPermissions} ar={ar} />
              </motion.div>
            )}

            {/* Sessions Tab */}
            {tab === "sessions" && (
              <motion.div key="sessions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[12px] font-medium">{ar ? "الجلسات النشطة" : "Active Sessions"}</h4>
                  <span className="text-[10px] text-muted-foreground">{MOCK_SESSIONS.length} {ar ? "جهاز" : "devices"}</span>
                </div>
                {MOCK_SESSIONS.map(s => (
                  <div key={s.id} className={`p-3.5 rounded-xl border ${s.current ? "border-primary/30 bg-primary/5" : "border-border/40"}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        {s.device.includes("iPhone") ? <Smartphone size={16} className="text-muted-foreground" /> : <Monitor size={16} className="text-muted-foreground" />}
                        <div>
                          <p className="text-[12px] font-medium">{s.device}</p>
                          <p className="text-[10px] text-muted-foreground">{s.browser}</p>
                        </div>
                      </div>
                      {s.current ? (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">{ar ? "الحالية" : "Current"}</span>
                      ) : (
                        <button className="text-[10px] text-rose-500 hover:underline flex items-center gap-1">
                          <LogOut size={10} /> {ar ? "إنهاء" : "Revoke"}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Globe size={9} /> {s.ip}</span>
                      <span className="flex items-center gap-1"><Building2 size={9} /> {s.location}</span>
                      <span className="flex items-center gap-1"><Clock size={9} /> {s.last_active}</span>
                    </div>
                  </div>
                ))}
                <button className="w-full h-9 rounded-lg border border-rose-200 text-rose-500 text-[11px] font-medium hover:bg-rose-50 transition-colors flex items-center justify-center gap-1.5 mt-3">
                  <LogOut size={12} /> {ar ? "إنهاء جميع الجلسات الأخرى" : "Revoke All Other Sessions"}
                </button>
              </motion.div>
            )}

            {/* Activity Tab */}
            {tab === "activity" && (
              <motion.div key="activity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5">
                <h4 className="text-[12px] font-medium mb-3">{ar ? "سجل النشاط" : "Activity Log"}</h4>
                <div className="space-y-0">
                  {MOCK_ACTIVITY.map((entry, i) => {
                    const actionIcon = entry.action === "login" ? Key : entry.action === "view" ? Eye : entry.action === "edit" ? Edit3 : entry.action === "create" ? Star : entry.action === "delete" ? Trash2 : entry.action === "approve" ? ShieldCheck : entry.action === "export" ? Activity : Settings;
                    const actionColor = entry.action === "delete" ? "text-rose-500" : entry.action === "approve" ? "text-emerald-500" : entry.action === "login" ? "text-blue-500" : "text-muted-foreground";
                    return (
                      <div key={entry.id} className="flex gap-3 relative">
                        <div className="flex flex-col items-center">
                          <div className={`w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center ${actionColor}`}>
                            {(() => { const Icon = actionIcon; return <Icon size={11} />; })()}
                          </div>
                          {i < MOCK_ACTIVITY.length - 1 && <div className="w-px flex-1 bg-border/40 my-1" />}
                        </div>
                        <div className="pb-4 flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[11px] font-medium capitalize">{entry.action}</span>
                            <span className="text-[9px] text-muted-foreground">{entry.timestamp}</span>
                          </div>
                          <p className="text-[11px] text-foreground">{entry.target}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{entry.details}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Security Tab */}
            {tab === "security" && (
              <motion.div key="security" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5 space-y-4">
                <h4 className="text-[12px] font-medium">{ar ? "إعدادات الأمان" : "Security Settings"}</h4>

                {/* 2FA */}
                <div className="p-3.5 rounded-xl border border-border/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${member.two_factor ? "bg-emerald-100" : "bg-muted"}`}>
                      <Fingerprint size={16} className={member.two_factor ? "text-emerald-600" : "text-muted-foreground"} />
                    </div>
                    <div>
                      <p className="text-[12px] font-medium">{ar ? "المصادقة الثنائية" : "Two-Factor Auth"}</p>
                      <p className="text-[10px] text-muted-foreground">{ar ? "طبقة حماية إضافية للحساب" : "Extra layer of account protection"}</p>
                    </div>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${member.two_factor ? "bg-emerald-500" : "bg-muted"}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${member.two_factor ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                </div>

                {/* Password */}
                <div className="p-3.5 rounded-xl border border-border/40">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                        <Key size={16} className="text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-[12px] font-medium">{ar ? "كلمة المرور" : "Password"}</p>
                        <p className="text-[10px] text-muted-foreground">{ar ? "آخر تغيير: منذ 30 يوم" : "Last changed: 30 days ago"}</p>
                      </div>
                    </div>
                    <button className="text-[10px] text-primary hover:underline">{ar ? "تغيير" : "Change"}</button>
                  </div>
                </div>

                {/* Login Restrictions */}
                <div className="p-3.5 rounded-xl border border-border/40">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                        <Ban size={16} className="text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-[12px] font-medium">{ar ? "قيود تسجيل الدخول" : "Login Restrictions"}</p>
                        <p className="text-[10px] text-muted-foreground">{ar ? "تحديد الأوقات والأجهزة" : "Limit devices and hours"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="rounded border-border" defaultChecked />
                      <span className="text-[11px] text-muted-foreground">{ar ? "سماح بالدخول من أجهزة فقط" : "Allow login from registered devices only"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="rounded border-border" />
                      <span className="text-[11px] text-muted-foreground">{ar ? "تقييد ساعات العمل (8 صباحاً - 6 مساءً)" : "Restrict to business hours (8AM - 6PM)"}</span>
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50">
                  <h5 className="text-[11px] font-semibold text-rose-600 mb-2 flex items-center gap-1.5">
                    <AlertTriangle size={11} /> {ar ? "منطقة الخطر" : "Danger Zone"}
                  </h5>
                  <div className="space-y-2">
                    <button className="w-full h-8 rounded-lg border border-rose-200 text-rose-600 text-[11px] font-medium hover:bg-rose-100 transition-colors">
                      {ar ? "إيقاف الحساب" : "Suspend Account"}
                    </button>
                    <button className="w-full h-8 rounded-lg border border-rose-200 text-rose-600 text-[11px] font-medium hover:bg-rose-100 transition-colors">
                      {ar ? "حذف المستخدم" : "Delete User"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Permission Editor (used in drawer) ────────────────────

function PermissionEditor({ permissions, onChange, ar }: {
  permissions: PermissionMap;
  onChange: (p: PermissionMap) => void;
  ar: boolean;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  function toggle(moduleKey: string, action: PermissionAction) {
    const current = permissions[moduleKey] || [];
    const next = current.includes(action) ? current.filter(a => a !== action) : [...current, action];
    onChange({ ...permissions, [moduleKey]: next });
  }

  function toggleAll(moduleKey: string) {
    const mod = MODULES.find(m => m.key === moduleKey);
    if (!mod) return;
    const current = permissions[moduleKey] || [];
    const allChecked = mod.permissions.every(p => current.includes(p));
    onChange({ ...permissions, [moduleKey]: allChecked ? [] : [...mod.permissions] });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Shield size={13} className="text-primary" />
          <span className="text-[12px] font-semibold">{ar ? "مصفوفة الصلاحيات" : "Permission Matrix"}</span>
        </div>
        <span className="text-[10px] text-muted-foreground">{countPermissions(permissions)} {ar ? "مفعّل" : "active"}</span>
      </div>
      <div className="divide-y divide-border/25 border border-border/40 rounded-xl overflow-hidden">
        {MODULES.map(mod => {
          const modPerms = permissions[mod.key] || [];
          const allChecked = mod.permissions.every(p => modPerms.includes(p));
          const someChecked = modPerms.length > 0;
          const isExpanded = expanded === mod.key;
          return (
            <div key={mod.key}>
              <button
                onClick={() => setExpanded(isExpanded ? null : mod.key)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors text-left"
              >
                <button
                  onClick={e => { e.stopPropagation(); toggleAll(mod.key); }}
                  className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                    allChecked ? "bg-primary border-primary" : someChecked ? "bg-primary/30 border-primary/50" : "border-border/60"
                  }`}
                >
                  {(allChecked || someChecked) && <Check size={10} className="text-white" />}
                </button>
                <span className="text-[11px] font-medium flex-1">{ar ? mod.ar : mod.en}</span>
                <span className="text-[9px] text-muted-foreground tabular-nums">{modPerms.length}/{mod.permissions.length}</span>
                <ChevronDown size={12} className={`text-muted-foreground/40 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="px-4 pb-3 pt-1 flex flex-wrap gap-1.5">
                      {mod.permissions.map(action => {
                        const checked = modPerms.includes(action);
                        const isDangerous = ["delete", "manage_settings", "release", "approve"].includes(action);
                        return (
                          <button
                            key={action}
                            onClick={() => toggle(mod.key, action)}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium border transition-all ${
                              checked
                                ? isDangerous ? "border-rose-300 bg-rose-50 text-rose-700" : "border-primary/40 bg-primary/10 text-primary"
                                : "border-border/40 text-muted-foreground hover:border-border/80"
                            }`}
                          >
                            <div className={`w-3 h-3 rounded-sm flex items-center justify-center ${checked ? (isDangerous ? "bg-rose-500" : "bg-primary") : "border border-border/60"}`}>
                              {checked && <Check size={7} className="text-white" />}
                            </div>
                            {ar ? PERMISSION_LABELS[action].ar : PERMISSION_LABELS[action].en}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
