import { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { ROLE_TEMPLATES, type PermissionMap, countPermissions } from "../../lib/permissions";
import { DEPARTMENTS } from "../../lib/access-control";
import {
  X, Send, Mail, UserPlus, Copy, Check, Link, Clock,
  AlertCircle, Loader2, Shield, Plus, Trash2,
} from "lucide-react";

const inputCls = "w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20";
const labelCls = "text-[11px] text-muted-foreground font-medium mb-1 block";

interface InviteData {
  email: string;
  name: string;
  role: string;
  department: string;
  message: string;
}

export function InviteUserModal({ onClose, onInvited }: { onClose: () => void; onInvited: () => void }) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [invites, setInvites] = useState<InviteData[]>([
    { email: "", name: "", role: "viewer", department: "", message: "" },
  ]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  function updateInvite(idx: number, patch: Partial<InviteData>) {
    setInvites(prev => prev.map((inv, i) => i === idx ? { ...inv, ...patch } : inv));
  }

  function addInvite() {
    setInvites(prev => [...prev, { email: "", name: "", role: "viewer", department: "", message: "" }]);
  }

  function removeInvite(idx: number) {
    if (invites.length <= 1) return;
    setInvites(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSend() {
    const valid = invites.filter(i => i.email.trim());
    if (!valid.length) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 1500));
    setSending(false);
    setSent(true);
    setTimeout(() => { onInvited(); onClose(); }, 2000);
  }

  function copyInviteLink() {
    const link = `https://thoth.app/invite/${btoa(Date.now().toString()).slice(0, 12)}`;
    navigator.clipboard?.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  if (sent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-sm bg-background rounded-2xl border border-border shadow-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Send size={22} className="text-emerald-600" />
          </div>
          <p className="text-[15px] font-semibold mb-1" style={{ fontFamily: "var(--app-font-serif)" }}>
            {ar ? "تم إرسال الدعوات ✓" : "Invitations Sent ✓"}
          </p>
          <p className="text-[12px] text-muted-foreground">
            {invites.filter(i => i.email.trim()).length} {ar ? "دعوة إلى" : "invites to"} {invites.filter(i => i.email.trim()).map(i => i.email).join(", ")}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-2xl bg-background rounded-2xl border border-border shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="shrink-0 px-6 py-5 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <UserPlus size={18} className="text-primary" />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>
                {ar ? "دعوة مستخدمين" : "Invite Users"}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {ar ? "أرسل دعوات بالبريد الإلكتروني" : "Send email invitations to join"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Quick Link */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border/40">
            <Link size={14} className="text-muted-foreground shrink-0" />
            <span className="text-[11px] text-muted-foreground flex-1">{ar ? "أو شارك رابط الدعوة" : "Or share an invite link"}</span>
            <button
              onClick={copyInviteLink}
              className="h-7 px-3 rounded-lg bg-primary/10 text-primary text-[10px] font-medium flex items-center gap-1 hover:bg-primary/20 transition-colors"
            >
              {copiedLink ? <><Check size={10} /> {ar ? "تم النسخ" : "Copied"}</> : <><Copy size={10} /> {ar ? "نسخ الرابط" : "Copy Link"}</>}
            </button>
          </div>

          {/* Invite List */}
          {invites.map((invite, idx) => {
            const tmpl = ROLE_TEMPLATES.find(t => t.id === invite.role);
            return (
              <div key={idx} className="p-4 rounded-xl border border-border/40 space-y-3 relative">
                {invites.length > 1 && (
                  <button onClick={() => removeInvite(idx)} className="absolute top-3 right-3 w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-50 transition-colors">
                    <Trash2 size={11} />
                  </button>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>{ar ? "الاسم" : "Name"}</label>
                    <input value={invite.name} onChange={e => updateInvite(idx, { name: e.target.value })} className={inputCls} placeholder={ar ? "الاسم الكامل" : "Full name"} />
                  </div>
                  <div>
                    <label className={labelCls}>{ar ? "البريد الإلكتروني" : "Email"} *</label>
                    <div className="relative">
                      <input type="email" value={invite.email} onChange={e => updateInvite(idx, { email: e.target.value })} className={inputCls + " pl-9"} placeholder="user@company.com" />
                      <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>{ar ? "الدور" : "Role"}</label>
                    <select value={invite.role} onChange={e => updateInvite(idx, { role: e.target.value })} className={inputCls + " appearance-none cursor-pointer"}>
                      {ROLE_TEMPLATES.map(t => (
                        <option key={t.id} value={t.id}>{ar ? t.ar : t.en} — {countPermissions(t.permissions)} {ar ? "صلاحية" : "perms"}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>{ar ? "القسم" : "Department"}</label>
                    <select value={invite.department} onChange={e => updateInvite(idx, { department: e.target.value })} className={inputCls + " appearance-none cursor-pointer"}>
                      <option value="">{ar ? "اختر..." : "Select..."}</option>
                      {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{ar ? d.ar : d.en}</option>)}
                    </select>
                  </div>
                </div>
                {tmpl && (
                  <div className="flex items-center gap-2">
                    <Shield size={10} className="text-muted-foreground/50" />
                    <span className="text-[10px] text-muted-foreground">
                      {ar ? "الصلاحيات:" : "Permissions:"}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(tmpl.permissions).filter(([, perms]) => perms.length > 0).slice(0, 4).map(([key]) => (
                        <span key={key} className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{key}</span>
                      ))}
                      {Object.keys(tmpl.permissions).filter(k => (tmpl.permissions[k] || []).length > 0).length > 4 && (
                        <span className="text-[9px] text-muted-foreground">+{Object.keys(tmpl.permissions).filter(k => (tmpl.permissions[k] || []).length > 0).length - 4}</span>
                      )}
                    </div>
                  </div>
                )}
                <div>
                  <label className={labelCls}>{ar ? "رسالة شخصية (اختياري)" : "Personal message (optional)"}</label>
                  <input value={invite.message} onChange={e => updateInvite(idx, { message: e.target.value })} className={inputCls} placeholder={ar ? "مرحباً، أنضم لفريقنا..." : "Hey, join our team on THOTH..."} />
                </div>
              </div>
            );
          })}

          {/* Add More */}
          <button
            onClick={addInvite}
            className="w-full h-10 rounded-xl border border-dashed border-border/60 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-border transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus size={12} /> {ar ? "إضافة شخص آخر" : "Add another person"}
          </button>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-border/40 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            {invites.filter(i => i.email.trim()).length} {ar ? "دعوة" : "invitation(s)"}
          </span>
          <div className="flex gap-2">
            <button onClick={onClose} className="h-10 px-4 rounded-xl border border-border/60 text-[12px] font-medium hover:bg-muted transition-colors">
              {ar ? "إلغاء" : "Cancel"}
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !invites.some(i => i.email.trim())}
              className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-2"
            >
              {sending ? (
                <><Loader2 size={13} className="animate-spin" /> {ar ? "جاري الإرسال..." : "Sending..."}</>
              ) : (
                <><Send size={13} /> {ar ? "إرسال الدعوات" : "Send Invitations"}</>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
