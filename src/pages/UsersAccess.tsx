import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { isDemoMode, getSupabaseClient } from "../lib/supabase";
import { DEPARTMENTS } from "../lib/access-control";
import {
  MODULES, PERMISSION_LABELS, ROLE_TEMPLATES, type PermissionMap, type PermissionAction,
  hasPermission, countPermissions, countDangerousPermissions, getTemplateById,
} from "../lib/permissions";
import { UserDetailDrawer } from "../components/pos/UserDetailDrawer";
import { InviteUserModal } from "../components/pos/InviteUserModal";
import {
  Users, Plus, X, Shield, Clock, CheckCircle2, AlertCircle, Loader2,
  Check, UserPlus, Building2, Eye, Edit3, Trash2, AlertTriangle,
  Lock, Key, Briefcase, ChevronDown, ChevronRight, Search,
  Filter, ArrowUpDown, Mail, Phone, Activity, Star, Send,
  Download, Upload, MoreHorizontal, UserCheck, UserX, Copy,
  BarChart3, TrendingUp,   ShieldCheck, ShieldAlert, Fingerprint, Globe,
  Smartphone, Monitor, LogOut, History, Settings, EyeOff,
  Grid3X3, List, RefreshCw, Link, Calendar, Ban,
} from "lucide-react";

const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-[12px] font-medium px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-40";
const btnSecondary = "inline-flex items-center justify-center gap-1.5 rounded-xl border border-border/60 text-[11px] font-medium px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors";
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

interface PendingInvite {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string;
  sent_at: string;
  status: "pending" | "accepted" | "expired";
}

type Tab = "dashboard" | "members" | "invites" | "roles" | "audit";

const DEMO_MEMBERS: Member[] = [
  { id: "1", user_id: "u1", role: "owner", department: "management", display_name: "Admin User", status: "active", email: "admin@thoth.app", phone: "+20-100-000-0001", joined_at: "2024-01-01", last_active: "Just now", login_count: 342, two_factor: true, branch_access: ["br-01", "br-02"] },
  { id: "2", user_id: "u2", role: "sales", department: "sales", display_name: "Ahmed Hassan", status: "active", email: "ahmed@thoth.app", phone: "+20-100-000-0002", joined_at: "2024-02-15", last_active: "5 min ago", login_count: 189, two_factor: true, branch_access: ["br-02"] },
  { id: "3", user_id: "u3", role: "production_manager", department: "production", display_name: "Mohamed Ali", status: "active", email: "mohamed@thoth.app", phone: "+20-100-000-0003", joined_at: "2024-03-01", last_active: "1 hour ago", login_count: 156, two_factor: false, branch_access: ["br-01"] },
  { id: "4", user_id: "u4", role: "finance", department: "finance", display_name: "Sara Ibrahim", status: "active", email: "sara@thoth.app", phone: "+20-100-000-0004", joined_at: "2024-03-15", last_active: "2 hours ago", login_count: 98, two_factor: true, branch_access: ["br-01", "br-02", "br-03"] },
  { id: "5", user_id: "u5", role: "warehouse", department: "warehouse", display_name: "Khalid Mansour", status: "active", email: "khalid@thoth.app", phone: "+20-100-000-0005", joined_at: "2024-04-01", last_active: "Yesterday", login_count: 67, two_factor: false, branch_access: ["br-01", "br-03"] },
  { id: "6", user_id: "u6", role: "qc", department: "quality", display_name: "Fatma Nour", status: "active", email: "fatma@thoth.app", phone: "+20-100-000-0006", joined_at: "2024-04-10", last_active: "3 days ago", login_count: 45, two_factor: false, branch_access: ["br-01"] },
  { id: "7", user_id: "u7", role: "viewer", department: "sales", display_name: "Youssef Karim", status: "inactive", email: "youssef@thoth.app", phone: "+20-100-000-0007", joined_at: "2024-05-01", last_active: "2 weeks ago", login_count: 12, two_factor: false, branch_access: [] },
  { id: "8", user_id: "u8", role: "delivery", department: "delivery", display_name: "Omar Salah", status: "active", email: "omar@thoth.app", phone: "+20-100-000-0008", joined_at: "2024-05-15", last_active: "Today", login_count: 34, two_factor: false, branch_access: ["br-02"] },
];

const DEMO_INVITES: PendingInvite[] = [
  { id: "inv-1", email: "newuser@thoth.app", name: "Nadia Farouk", role: "sales", department: "sales", sent_at: "2 hours ago", status: "pending" },
  { id: "inv-2", email: "contractor@external.com", name: "External Consultant", role: "viewer", department: "", sent_at: "1 day ago", status: "pending" },
  { id: "inv-3", email: "old@thoth.app", name: "Former Employee", role: "viewer", department: "production", sent_at: "2 weeks ago", status: "expired" },
];

export default function UsersAccess() {
  const { lang } = useLanguage();
  const { workspace } = useAuth();
  const ar = lang === "ar";

  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [toast, setToast] = useState<string | null>(null);

  // Filters
  const [searchQ, setSearchQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"name" | "role" | "joined" | "last_active">("name");
  const [showFilters, setShowFilters] = useState(false);

  // View
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // Drawers
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Create user form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "", email: "", department: "", role: "viewer", jobTitle: "", password: "",
  });
  const [creating, setCreating] = useState(false);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 2500); }

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setMembers(DEMO_MEMBERS);
      setInvites(DEMO_INVITES);
      setLoading(false);
    }, 600);
  }, []);

  // Filtered members
  const filteredMembers = useMemo(() => {
    let list = [...members];
    if (searchQ) {
      const q = searchQ.toLowerCase();
      list = list.filter(m =>
        (m.display_name || "").toLowerCase().includes(q) ||
        (m.email || "").toLowerCase().includes(q) ||
        (m.phone || "").includes(q) ||
        (m.department || "").toLowerCase().includes(q)
      );
    }
    if (roleFilter !== "all") list = list.filter(m => m.role === roleFilter);
    if (deptFilter !== "all") list = list.filter(m => m.department === deptFilter);
    if (statusFilter !== "all") list = list.filter(m => m.status === statusFilter);
    list.sort((a, b) => {
      switch (sortBy) {
        case "name": return (a.display_name || "").localeCompare(b.display_name || "");
        case "role": return a.role.localeCompare(b.role);
        case "joined": return new Date(b.joined_at || 0).getTime() - new Date(a.joined_at || 0).getTime();
        case "last_active": return 0;
        default: return 0;
      }
    });
    return list;
  }, [members, searchQ, roleFilter, deptFilter, statusFilter, sortBy]);

  // Stats
  const stats = useMemo(() => {
    const total = members.length;
    const active = members.filter(m => m.status === "active").length;
    const inactive = total - active;
    const with2fa = members.filter(m => m.two_factor).length;
    const byRole = ROLE_TEMPLATES.map(t => ({
      ...t,
      count: members.filter(m => m.role === t.id).length,
    })).filter(t => t.count > 0);
    const byDept = DEPARTMENTS.map(d => ({
      ...d,
      count: members.filter(m => m.department === d.value).length,
    })).filter(d => d.count > 0);
    return { total, active, inactive, with2fa, byRole, byDept };
  }, [members]);

  const handleCreateUser = useCallback(async () => {
    if (!createForm.name || !createForm.email) return;
    setCreating(true);
    await new Promise(r => setTimeout(r, 1000));
    const newMember: Member = {
      id: `m-${Date.now()}`,
      user_id: `u-${Date.now()}`,
      role: createForm.role,
      department: createForm.department,
      display_name: createForm.name,
      status: "active",
      email: createForm.email,
      joined_at: new Date().toISOString().slice(0, 10),
      last_active: "Just now",
      login_count: 0,
      two_factor: false,
      branch_access: [],
    };
    setMembers(prev => [newMember, ...prev]);
    setCreating(false);
    setShowCreateForm(false);
    setCreateForm({ name: "", email: "", department: "", role: "viewer", jobTitle: "", password: "" });
    showToast(ar ? "تم إنشاء المستخدم ✓" : "User created ✓");
  }, [createForm, ar]);

  const handleUpdateMember = useCallback((updated: Member) => {
    setMembers(prev => prev.map(m => m.id === updated.id ? updated : m));
    setSelectedMember(null);
    showToast(ar ? "تم التحديث ✓" : "Updated ✓");
  }, [ar]);

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 size={24} className="mx-auto text-primary animate-spin" />
          <p className="text-[12px] text-muted-foreground">{ar ? "جاري التحميل..." : "Loading..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-xl bg-foreground text-background text-[13px] font-medium shadow-lg flex items-center gap-2">
          <Check size={14} />{toast}
        </div>
      )}

      {/* Header */}
      <div className="px-6 md:px-8 pt-6 pb-5 border-b border-border/40" style={{ background: "linear-gradient(160deg, hsl(var(--muted)/0.3) 0%, hsl(var(--background)) 60%)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-[22px] font-semibold" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.02em" }}>
              {ar ? "إدارة المستخدمين والصلاحيات" : "Users & Access Control"}
            </h1>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {ar ? "إدارة الفريق وصلاحيات الوصول والأمان" : "Manage team, permissions, and security"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowInviteModal(true)} className={btnPrimary}>
              <Send size={13} /> {ar ? "دعوة مستخدم" : "Invite User"}
            </button>
            <button onClick={() => setShowCreateForm(!showCreateForm)} className={btnSecondary}>
              <UserPlus size={12} /> {ar ? "إنشاء مباشر" : "Create Directly"}
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border border-border/40">
            <Users size={12} className="text-muted-foreground" />
            <span className="text-[11px] font-medium">{stats.total}</span>
            <span className="text-[10px] text-muted-foreground">{ar ? "مستخدم" : "users"}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/60">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-medium text-emerald-700">{stats.active}</span>
            <span className="text-[10px] text-emerald-600">{ar ? "نشط" : "active"}</span>
          </div>
          {stats.inactive > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted border border-border/40">
              <span className="text-[11px] font-medium">{stats.inactive}</span>
              <span className="text-[10px] text-muted-foreground">{ar ? "غير نشط" : "inactive"}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10">
            <Fingerprint size={12} className="text-primary" />
            <span className="text-[11px] font-medium text-primary">{stats.with2fa}</span>
            <span className="text-[10px] text-primary/70">2FA</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200/60">
            <Send size={12} className="text-amber-600" />
            <span className="text-[11px] font-medium text-amber-700">{invites.filter(i => i.status === "pending").length}</span>
            <span className="text-[10px] text-amber-600">{ar ? "بانتظار" : "pending"}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1">
          {([
            { id: "dashboard" as Tab, en: "Overview", ar: "نظرة عامة", icon: BarChart3 },
            { id: "members" as Tab, en: "Members", ar: "الأعضاء", icon: Users },
            { id: "invites" as Tab, en: "Invitations", ar: "الدعوات", icon: Send },
            { id: "roles" as Tab, en: "Roles", ar: "الأدوار", icon: Shield },
            { id: "audit" as Tab, en: "Audit Log", ar: "سجل المراجعة", icon: History },
          ]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-3.5 py-2 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-all ${
              tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/50"
            }`}>
              <t.icon size={12} />{ar ? t.ar : t.en}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 md:px-8 py-5">
        <AnimatePresence mode="wait">

          {/* ═══ DASHBOARD ═══ */}
          {tab === "dashboard" && (
            <motion.div key="dash" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
              {/* Role Distribution */}
              <div>
                <h3 className="text-[13px] font-semibold mb-3">{ar ? "توزيع الأدوار" : "Role Distribution"}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {stats.byRole.map(r => (
                    <div key={r.id} className="p-3 rounded-xl border border-border/40 hover:shadow-sm transition-shadow cursor-pointer" onClick={() => { setRoleFilter(r.id); setTab("members"); }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${r.color}`}>{ar ? r.ar : r.en}</span>
                        <span className="text-[16px] font-bold" style={{ fontFamily: "var(--app-font-serif)" }}>{r.count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
                        <div className="h-full rounded-full bg-primary/60" style={{ width: `${(r.count / stats.total) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Department Distribution */}
              <div>
                <h3 className="text-[13px] font-semibold mb-3">{ar ? "الأقسام" : "Departments"}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {stats.byDept.map(d => (
                    <div key={d.value} className="p-3 rounded-xl border border-border/40 hover:shadow-sm transition-shadow cursor-pointer" onClick={() => { setDeptFilter(d.value); setTab("members"); }}>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium truncate">{ar ? d.ar : d.en}</span>
                        <span className="text-[14px] font-bold" style={{ fontFamily: "var(--app-font-serif)" }}>{d.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-[13px] font-semibold mb-3">{ar ? "آخر النشاطات" : "Recent Activity"}</h3>
                <div className="space-y-2">
                  {[
                    { user: "Ahmed Hassan", action: "logged in", time: "5 min ago", icon: Key, color: "text-blue-500" },
                    { user: "Sara Ibrahim", action: "approved PO-012", time: "2 hours ago", icon: ShieldCheck, color: "text-emerald-500" },
                    { user: "Mohamed Ali", action: "updated production order", time: "3 hours ago", icon: Edit3, color: "text-amber-500" },
                    { user: "Admin User", action: "changed permissions for Khalid", time: "Yesterday", icon: Shield, color: "text-violet-500" },
                  ].map((entry, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors">
                      <div className={`w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center ${entry.color}`}>
                        <entry.icon size={12} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px]"><span className="font-medium">{entry.user}</span> <span className="text-muted-foreground">{entry.action}</span></p>
                      </div>
                      <span className="text-[9px] text-muted-foreground shrink-0">{entry.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ MEMBERS ═══ */}
          {tab === "members" && (
            <motion.div key="members" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Inline Create Form */}
              <AnimatePresence>
                {showCreateForm && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-5">
                    <div className="p-5 rounded-xl border border-border/40 bg-muted/20 space-y-3">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-[13px] font-semibold">{ar ? "إنشاء مستخدم جديد" : "Create New User"}</h3>
                        <button onClick={() => setShowCreateForm(false)}><X size={14} className="text-muted-foreground" /></button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className={labelCls}>{ar ? "الاسم" : "Name"} *</label>
                          <input value={createForm.name} onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))} className={inputCls} placeholder={ar ? "الاسم الكامل" : "Full name"} />
                        </div>
                        <div>
                          <label className={labelCls}>{ar ? "الإيميل" : "Email"} *</label>
                          <input type="email" value={createForm.email} onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} className={inputCls} placeholder="user@company.com" />
                        </div>
                        <div>
                          <label className={labelCls}>{ar ? "القسم" : "Department"}</label>
                          <select value={createForm.department} onChange={e => setCreateForm(p => ({ ...p, department: e.target.value }))} className={inputCls + " appearance-none cursor-pointer"}>
                            <option value="">{ar ? "اختر..." : "Select..."}</option>
                            {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{ar ? d.ar : d.en}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>{ar ? "الدور" : "Role"}</label>
                          <select value={createForm.role} onChange={e => setCreateForm(p => ({ ...p, role: e.target.value }))} className={inputCls + " appearance-none cursor-pointer"}>
                            {ROLE_TEMPLATES.map(t => <option key={t.id} value={t.id}>{ar ? t.ar : t.en}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button onClick={handleCreateUser} disabled={creating || !createForm.name || !createForm.email} className={btnPrimary + " px-5"}>
                          {creating ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
                          {ar ? "إنشاء" : "Create"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Toolbar */}
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                  <input value={searchQ} onChange={e => setSearchQ(e.target.value)} className={inputCls + " pl-9 h-9"} placeholder={ar ? "بحث بالاسم، الإيميل، الهاتف..." : "Search name, email, phone..."} />
                </div>
                <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="h-9 px-2 rounded-lg border border-border bg-background text-[11px] appearance-none cursor-pointer">
                  <option value="all">{ar ? "كل الأدوار" : "All Roles"}</option>
                  {ROLE_TEMPLATES.map(t => <option key={t.id} value={t.id}>{ar ? t.ar : t.en}</option>)}
                </select>
                <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="h-9 px-2 rounded-lg border border-border bg-background text-[11px] appearance-none cursor-pointer">
                  <option value="all">{ar ? "كل الأقسام" : "All Departments"}</option>
                  {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{ar ? d.ar : d.en}</option>)}
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)} className="h-9 px-2 rounded-lg border border-border bg-background text-[11px] appearance-none cursor-pointer">
                  <option value="all">{ar ? "الكل" : "All Status"}</option>
                  <option value="active">{ar ? "نشط" : "Active"}</option>
                  <option value="inactive">{ar ? "غير نشط" : "Inactive"}</option>
                </select>
                <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} className="h-9 px-2 rounded-lg border border-border bg-background text-[11px] appearance-none cursor-pointer">
                  <option value="name">{ar ? "الاسم" : "Name"}</option>
                  <option value="role">{ar ? "الدور" : "Role"}</option>
                  <option value="joined">{ar ? "تاريخ الانضمام" : "Join Date"}</option>
                </select>
                <div className="flex border border-border rounded-lg overflow-hidden">
                  <button onClick={() => setViewMode("list")} className={`w-8 h-9 flex items-center justify-center ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}><List size={13} /></button>
                  <button onClick={() => setViewMode("grid")} className={`w-8 h-9 flex items-center justify-center ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}><Grid3X3 size={13} /></button>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground mb-3">{filteredMembers.length} {ar ? "نتيجة" : "results"}</p>

              {/* Member List */}
              {viewMode === "list" ? (
                <div className="space-y-2">
                  {filteredMembers.map(m => {
                    const tmpl = ROLE_TEMPLATES.find(t => t.id === m.role) || ROLE_TEMPLATES[ROLE_TEMPLATES.length - 1];
                    const dept = DEPARTMENTS.find(d => d.value === m.department);
                    const perms = m.permissions ? countPermissions(m.permissions) : countPermissions(tmpl.permissions);
                    return (
                      <div key={m.id} className="flex items-center gap-4 p-3.5 rounded-xl border border-border/40 hover:shadow-sm hover:border-border/60 transition-all cursor-pointer group" onClick={() => setSelectedMember(m)}>
                        <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center text-[13px] font-semibold text-primary shrink-0">
                          {(m.display_name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[13px] font-medium">{m.display_name}</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${tmpl.color}`}>{ar ? tmpl.ar : tmpl.en}</span>
                            <div className={`w-2 h-2 rounded-full ${m.status === "active" ? "bg-emerald-500" : "bg-muted"}`} />
                            {m.two_factor && <Fingerprint size={10} className="text-primary" />}
                          </div>
                          <div className="flex items-center gap-3 text-[10.5px] text-muted-foreground">
                            {m.email && <span className="flex items-center gap-1"><Mail size={9} />{m.email}</span>}
                            {dept && <span className="flex items-center gap-1"><Building2 size={9} />{ar ? dept.ar : dept.en}</span>}
                            {m.last_active && <span className="flex items-center gap-1"><Clock size={9} />{m.last_active}</span>}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[11px] font-medium">{perms} {ar ? "صلاحية" : "perms"}</p>
                          <p className="text-[9px] text-muted-foreground">{m.login_count || 0} {ar ? "دخول" : "logins"}</p>
                        </div>
                        <ChevronRight size={14} className="text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredMembers.map(m => {
                    const tmpl = ROLE_TEMPLATES.find(t => t.id === m.role) || ROLE_TEMPLATES[ROLE_TEMPLATES.length - 1];
                    const dept = DEPARTMENTS.find(d => d.value === m.department);
                    return (
                      <div key={m.id} className="p-4 rounded-xl border border-border/40 hover:shadow-sm hover:border-border/60 transition-all cursor-pointer" onClick={() => setSelectedMember(m)}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center text-[13px] font-semibold text-primary">
                            {(m.display_name || "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12px] font-medium truncate">{m.display_name}</p>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${tmpl.color}`}>{ar ? tmpl.ar : tmpl.en}</span>
                          </div>
                        </div>
                        <div className="space-y-1 text-[10px] text-muted-foreground">
                          {m.email && <p className="truncate">{m.email}</p>}
                          {dept && <p>{ar ? dept.ar : dept.en}</p>}
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/30">
                          <div className={`w-2 h-2 rounded-full ${m.status === "active" ? "bg-emerald-500" : "bg-muted"}`} />
                          <span className="text-[9px] text-muted-foreground">{m.last_active}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ═══ INVITES ═══ */}
          {tab === "invites" && (
            <motion.div key="invites" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[13px] font-semibold">{ar ? "الدعوات المعلقة" : "Pending Invitations"}</h3>
                <button onClick={() => setShowInviteModal(true)} className={btnPrimary + " text-[11px] px-3 py-1.5"}>
                  <Send size={11} /> {ar ? "دعوة جديدة" : "New Invite"}
                </button>
              </div>
              <div className="space-y-2">
                {invites.map(inv => {
                  const tmpl = ROLE_TEMPLATES.find(t => t.id === inv.role);
                  const statusColor = inv.status === "pending" ? "bg-amber-100 text-amber-700" : inv.status === "accepted" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground";
                  return (
                    <div key={inv.id} className="flex items-center gap-4 p-3.5 rounded-xl border border-border/40">
                      <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center text-[13px] font-semibold text-muted-foreground">
                        <Mail size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[13px] font-medium">{inv.name || inv.email}</span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${statusColor}`}>{inv.status}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[10.5px] text-muted-foreground">
                          <span>{inv.email}</span>
                          {tmpl && <span className="flex items-center gap-1"><Shield size={9} />{ar ? tmpl.ar : tmpl.en}</span>}
                          <span className="flex items-center gap-1"><Clock size={9} />{inv.sent_at}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button className="h-7 px-2.5 rounded-lg border border-border/60 text-[10px] font-medium hover:bg-muted transition-colors flex items-center gap-1">
                          <RefreshCw size={10} /> {ar ? "إعادة" : "Resend"}
                        </button>
                        <button className="h-7 px-2.5 rounded-lg border border-rose-200 text-rose-500 text-[10px] font-medium hover:bg-rose-50 transition-colors">
                          {ar ? "إلغاء" : "Revoke"}
                        </button>
                      </div>
                    </div>
                  );
                })}
                {invites.length === 0 && (
                  <div className="text-center py-12">
                    <Send size={24} className="mx-auto text-muted-foreground/20 mb-2" />
                    <p className="text-[12px] text-muted-foreground">{ar ? "لا توجد دعوات معلقة" : "No pending invitations"}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ═══ ROLES ═══ */}
          {tab === "roles" && (
            <motion.div key="roles" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h3 className="text-[13px] font-semibold mb-3">{ar ? "قوالب الأدوار" : "Role Templates"}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {ROLE_TEMPLATES.map(t => {
                  const count = members.filter(m => m.role === t.id).length;
                  const dangerCount = countDangerousPermissions(t.permissions);
                  return (
                    <div key={t.id} className="p-4 rounded-xl border border-border/40 hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${t.color}`}>{ar ? t.ar : t.en}</span>
                        <span className="text-[16px] font-bold" style={{ fontFamily: "var(--app-font-serif)" }}>{count}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mb-3">{ar ? t.descriptionAr : t.description}</p>
                      <div className="flex items-center justify-between text-[9px] text-muted-foreground mb-2">
                        <span>{countPermissions(t.permissions)} {ar ? "صلاحية" : "perms"}</span>
                        {dangerCount > 0 && <span className="text-rose-500 flex items-center gap-0.5"><AlertTriangle size={8} />{dangerCount}</span>}
                      </div>
                      <div className="h-1 rounded-full bg-muted/60 overflow-hidden">
                        <div className="h-full rounded-full bg-primary/50" style={{ width: `${(countPermissions(t.permissions) / 170) * 100}%` }} />
                      </div>
                      {t.risk === "high" && (
                        <span className="text-[8px] text-rose-500 flex items-center gap-0.5 mt-2">
                          <ShieldAlert size={8} /> {ar ? "خطر عالي" : "High risk"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Custom Role */}
              <div className="mt-5 p-4 rounded-xl border border-dashed border-border/60 text-center">
                <p className="text-[11px] text-muted-foreground mb-2">{ar ? "أو أنشئ دور مخصص" : "Or create a custom role"}</p>
                <button className={btnPrimary + " text-[11px] px-4 py-1.5"}>
                  <Plus size={11} /> {ar ? "دور مخصص" : "Custom Role"}
                </button>
              </div>
            </motion.div>
          )}

          {/* ═══ AUDIT LOG ═══ */}
          {tab === "audit" && (
            <motion.div key="audit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[13px] font-semibold">{ar ? "سجل مراجعة الصلاحيات" : "Permission Audit Log"}</h3>
                <button className={btnSecondary}><Download size={11} /> {ar ? "تصدير" : "Export"}</button>
              </div>
              <div className="space-y-0">
                {[
                  { time: "Today, 2:15 PM", user: "Admin", action: "Changed role", target: "Ahmed Hassan", detail: "viewer → sales", icon: Shield, color: "text-violet-500" },
                  { time: "Today, 11:30 AM", user: "Admin", action: "Added permission", target: "Sara Ibrahim", detail: "finance: approve", icon: Plus, color: "text-emerald-500" },
                  { time: "Yesterday, 4:20 PM", user: "Admin", action: "Revoked session", target: "Khalid Mansour", detail: "iPhone Safari session terminated", icon: LogOut, color: "text-rose-500" },
                  { time: "Yesterday, 9:00 AM", user: "Admin", action: "Created user", target: "Omar Salah", detail: "Role: delivery, Department: delivery", icon: UserPlus, color: "text-blue-500" },
                  { time: "Jun 10, 3:45 PM", user: "Admin", action: "Disabled 2FA bypass", target: "Fatma Nour", detail: "Enforced 2FA requirement", icon: Fingerprint, color: "text-amber-500" },
                  { time: "Jun 9, 10:15 AM", user: "Admin", action: "Changed department", target: "Youssef Karim", detail: "production → sales", icon: Building2, color: "text-cyan-500" },
                  { time: "Jun 8, 2:30 PM", user: "Admin", action: "Sent invitation", target: "newuser@thoth.app", detail: "Role: sales, Department: sales", icon: Send, color: "text-primary" },
                  { time: "Jun 7, 11:00 AM", user: "Admin", action: "Suspended user", target: "Youssef Karim", detail: "Account deactivated", icon: Ban, color: "text-rose-500" },
                ].map((entry, i) => (
                  <div key={i} className="flex gap-3 relative py-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center ${entry.color}`}>
                        <entry.icon size={12} />
                      </div>
                      {i < 7 && <div className="w-px flex-1 bg-border/40 my-1" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[11px] font-medium">{entry.action} <span className="text-primary">{entry.target}</span></span>
                        <span className="text-[9px] text-muted-foreground">{entry.time}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{entry.detail}</p>
                      <p className="text-[9px] text-muted-foreground/60 mt-0.5">{ar ? "بواسطة" : "by"} {entry.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Drawers */}
      {selectedMember && (
        <UserDetailDrawer
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          onSave={handleUpdateMember}
        />
      )}
      {showInviteModal && (
        <InviteUserModal
          onClose={() => setShowInviteModal(false)}
          onInvited={() => { showToast(ar ? "تم إرسال الدعوات ✓" : "Invitations sent ✓"); }}
        />
      )}
    </div>
  );
}
