/**
 * Loyalty Notifications — WhatsApp + SMS notification templates & config
 * إشعارات الولاء — قوالب ال WhatsApp والرسائل النصية والإعدادات
 */

import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import {
  MessageCircle, Bell, Check, X, Send, Plus,
  Edit3, Trash2, ToggleLeft, ToggleRight,
  Smartphone, Clock, Gift, Star, Crown,
  TrendingUp, Calendar, AlertTriangle, Zap,
  ChevronRight, Eye, Shield,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────

type NotificationChannel = "whatsapp" | "sms";
type NotificationTrigger = "points_earned" | "tier_upgrade" | "points_expiring" | "birthday" | "redemption" | "campaign_start" | "welcome";

interface NotificationTemplate {
  id: string;
  nameEn: string;
  nameAr: string;
  trigger: NotificationTrigger;
  channel: NotificationChannel;
  enabled: boolean;
  templateEn: string;
  templateAr: string;
  lastSent?: string;
  totalSent: number;
}

const TRIGGER_META: Record<NotificationTrigger, { en: string; ar: string; icon: React.ElementType; color: string; bg: string }> = {
  points_earned:   { en: "Points Earned",     ar: "نقاط مكتسبة",    icon: Star,          color: "text-emerald-600",  bg: "bg-emerald-50" },
  tier_upgrade:    { en: "Tier Upgrade",       ar: "ترقية مستوى",    icon: Crown,         color: "text-amber-600",    bg: "bg-amber-50" },
  points_expiring: { en: "Points Expiring",    ar: "نقاط ستنتهي",    icon: AlertTriangle, color: "text-rose-500",     bg: "bg-rose-50" },
  birthday:        { en: "Birthday",           ar: "عيد ميلاد",      icon: Gift,          color: "text-pink-600",     bg: "bg-pink-50" },
  redemption:      { en: "Redemption",         ar: "استبدال",        icon: Gift,          color: "text-violet-600",   bg: "bg-violet-50" },
  campaign_start:  { en: "Campaign Start",     ar: "بدء حملة",       icon: Calendar,      color: "text-blue-600",     bg: "bg-blue-50" },
  welcome:         { en: "Welcome",            ar: "ترحيب",          icon: MessageCircle, color: "text-primary",      bg: "bg-primary/10" },
};

const TEMPLATES: NotificationTemplate[] = [
  {
    id: "nt-001",
    nameEn: "Points Earned Confirmation",
    nameAr: "تأكيد اكتساب النقاط",
    trigger: "points_earned",
    channel: "whatsapp",
    enabled: true,
    templateEn: "Hi {{name}}! 🎉 You earned {{points}} points from your recent purchase. Your balance is now {{balance}} points. Keep shopping to earn more!",
    templateAr: "مرحبا {{name}}! 🎉 لقد اكتسبت {{points}} نقطة من عملية الشراء الأخيرة. رصيدك الآن {{balance}} نقطة. واصل التسوق لاكتساب المزيد!",
    lastSent: "2026-06-10T08:30:00Z",
    totalSent: 156,
  },
  {
    id: "nt-002",
    nameEn: "Tier Upgrade Celebration",
    nameAr: "احتفال ترقية المستوى",
    trigger: "tier_upgrade",
    channel: "whatsapp",
    enabled: true,
    templateEn: "Congratulations {{name}}! 👑 You've been upgraded to {{tier}} tier! You now earn {{multiplier}}x points on every purchase. Thank you for your loyalty!",
    templateAr: "مبروك {{name}}! 👑 تمت ترقيتك إلى مستوى {{tier}}! أنت الآن تكسب {{multiplier}}x نقاط على كل عملية شراء. شكرًا لولائك!",
    lastSent: "2026-06-08T14:00:00Z",
    totalSent: 12,
  },
  {
    id: "nt-003",
    nameEn: "Points Expiry Warning",
    nameAr: "تحذير انتهاء النقاط",
    trigger: "points_expiring",
    channel: "whatsapp",
    enabled: true,
    templateEn: "Hi {{name}}, {{points}} of your loyalty points will expire on {{date}}. Redeem them now at our store or online! 🛍️",
    templateAr: "مرحبا {{name}}، {{points}} من نقاط الولاء ستنتهي في {{date}}. استبدلها الآن في متجرنا أو أونلاين! 🛍️",
    totalSent: 34,
  },
  {
    id: "nt-004",
    nameEn: "Birthday Bonus",
    nameAr: "مكافأة عيد الميلاد",
    trigger: "birthday",
    channel: "whatsapp",
    enabled: true,
    templateEn: "Happy Birthday {{name}}! 🎂 We've added {{points}} bonus points to your account as our gift to you. Enjoy your special day!",
    templateAr: "عيد ميلاد سعيد {{name}}! 🎂 أضفنا {{points}} نقطة مكافأة لحسابك كهدية منا لك. استمتع بيومك المميز!",
    lastSent: "2026-06-05T00:00:00Z",
    totalSent: 8,
  },
  {
    id: "nt-005",
    nameEn: "Redemption Confirmation",
    nameAr: "تأكيد الاستبدال",
    trigger: "redemption",
    channel: "sms",
    enabled: true,
    templateEn: "{{name}}: You redeemed {{points}} pts for {{discount}} discount. Code: {{code}}. Valid until {{expiry}}.",
    templateAr: "{{name}}: استبدلت {{points}} نقطة بخصم {{discount}}. الكود: {{code}}. صالح حتى {{expiry}}.",
    lastSent: "2026-06-10T12:00:00Z",
    totalSent: 42,
  },
  {
    id: "nt-006",
    nameEn: "Campaign Announcement",
    nameAr: "إعلان حملة",
    trigger: "campaign_start",
    channel: "whatsapp",
    enabled: false,
    templateEn: "Exciting news {{name}}! 🔥 {{campaign_name}} is live! Earn {{multiplier}}x points from {{start_date}} to {{end_date}}. Don't miss out!",
    templateAr: "خبر مثير {{name}}! 🔥 {{campaign_name}} بدأت! اكسب {{multiplier}}x نقاط من {{start_date}} إلى {{end_date}}. لا تفوت الفرصة!",
    totalSent: 0,
  },
  {
    id: "nt-007",
    nameEn: "Welcome to Loyalty",
    nameAr: "ترحيب ببرنامج الولاء",
    trigger: "welcome",
    channel: "whatsapp",
    enabled: true,
    templateEn: "Welcome to our loyalty program {{name}}! 🌟 Your member number is {{member_number}}. Start earning points with every purchase. Visit our store or shop online!",
    templateAr: "مرحبا بك في برنامج الولاء {{name}}! 🌟 رقم عضويتك {{member_number}}. ابدأ اكتساب النقاط مع كل عملية شراء. زر متجرنا أو تسوق أونلاين!",
    lastSent: "2026-06-09T16:00:00Z",
    totalSent: 8,
  },
];

// ─── Template Preview Modal ─────────────────────────────

function TemplatePreviewModal({ template, ar, onClose }: {
  template: NotificationTemplate; ar: boolean; onClose: () => void;
}) {
  const [previewLang, setPreviewLang] = useState<"en" | "ar">("en");
  const tm = TRIGGER_META[template.trigger];
  const Icon = tm.icon;

  // Replace vars with sample data
  function renderPreview(text: string): string {
    return text
      .replace(/\{\{name\}\}/g, previewLang === "en" ? "Ahmed" : "أحمد")
      .replace(/\{\{points\}\}/g, "5,000")
      .replace(/\{\{balance\}\}/g, "12,450")
      .replace(/\{\{tier\}\}/g, previewLang === "en" ? "Gold" : "ذهبي")
      .replace(/\{\{multiplier\}\}/g, "1.5")
      .replace(/\{\{discount\}\}/g, "EGP 50")
      .replace(/\{\{code\}\}/g, "THOTH-LM00-X4Y5Z6")
      .replace(/\{\{expiry\}\}/g, "Jul 4, 2026")
      .replace(/\{\{date\}\}/g, "Jun 25, 2026")
      .replace(/\{\{campaign_name\}\}/g, previewLang === "en" ? "Eid Double Points" : "نقاط مضاعفة في العيد")
      .replace(/\{\{start_date\}\}/g, "Jun 15")
      .replace(/\{\{end_date\}\}/g, "Jun 22")
      .replace(/\{\{member_number\}\}/g, "LYL-00001");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-background border border-border/40 rounded-2xl shadow-2xl w-full max-w-[420px]" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
          <h2 className="text-[14px] font-medium flex items-center gap-2" style={{ fontFamily: "var(--app-font-serif)" }}>
            <Eye size={14} className="text-muted-foreground" />
            {ar ? "معاينة الرسالة" : "Message Preview"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted"><X size={16} /></button>
        </div>

        <div className="px-6 py-5">
          {/* Language toggle */}
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setPreviewLang("en")}
              className={`text-[11px] px-3 py-1.5 rounded-lg ${previewLang === "en" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>EN</button>
            <button onClick={() => setPreviewLang("ar")}
              className={`text-[11px] px-3 py-1.5 rounded-lg ${previewLang === "ar" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>AR</button>
          </div>

          {/* WhatsApp-style bubble */}
          <div className={`${template.channel === "whatsapp" ? "bg-[#DCF8C6]" : "bg-blue-50"} rounded-xl rounded-tl-sm p-4 max-w-[320px] shadow-sm`}>
            <p className={`text-[13px] leading-relaxed text-foreground ${previewLang === "ar" ? "text-right" : ""}`} dir={previewLang === "ar" ? "rtl" : "ltr"}>
              {renderPreview(previewLang === "en" ? template.templateEn : template.templateAr)}
            </p>
            <p className="text-[9px] text-muted-foreground/60 text-right mt-2 tabular-nums">
              {template.channel === "whatsapp" ? "WhatsApp" : "SMS"} · 10:30 AM
            </p>
          </div>

          {/* Variables legend */}
          <div className="mt-4 pt-3 border-t border-border/20">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wide mb-2">{ar ? "المتغيرات المتاحة" : "Available Variables"}</p>
            <div className="flex flex-wrap gap-1.5">
              {["{{name}}", "{{points}}", "{{balance}}", "{{tier}}", "{{code}}", "{{date}}"].map(v => (
                <code key={v} className="text-[9px] bg-muted/40 px-1.5 py-0.5 rounded font-mono text-muted-foreground">{v}</code>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════

export default function LoyaltyNotificationsPage() {
  const { lang } = useLanguage();
  const ar = lang === "ar";

  const [templates, setTemplates] = useState<NotificationTemplate[]>(TEMPLATES);
  const [previewTemplate, setPreviewTemplate] = useState<NotificationTemplate | null>(null);
  const [filterTrigger, setFilterTrigger] = useState<string>("all");
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 2200); }

  const filtered = filterTrigger === "all" ? templates : templates.filter(t => t.trigger === filterTrigger);
  const enabledCount = templates.filter(t => t.enabled).length;
  const totalSent = templates.reduce((s, t) => s + t.totalSent, 0);
  const whatsappCount = templates.filter(t => t.channel === "whatsapp").length;

  function handleToggle(id: string) {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t));
    showToast(ar ? "تم تحديث الحالة" : "Status updated");
  }

  return (
    <div className="min-h-full py-8 px-7 md:px-10 max-w-[960px] mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-xl bg-foreground text-background text-[13px] font-medium shadow-lg flex items-center gap-2">
          <Check size={14} />{toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[11px] text-muted-foreground/60 tracking-[0.08em] uppercase mb-2">{ar ? "برنامج الولاء" : "Loyalty Program"}</p>
          <h1 className="text-[26px] font-medium text-foreground leading-tight" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.025em" }}>
            {ar ? "الإشعارات" : "Notifications"}
          </h1>
        </div>
      </div>

      {/* Connection status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {/* WhatsApp */}
        <div className="border border-border/40 rounded-xl p-4 bg-background">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#25D366]/10 flex items-center justify-center">
              <MessageCircle size={18} className="text-[#25D366]" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-medium">WhatsApp Business API</p>
              <p className="text-[10.5px] text-muted-foreground">{ar ? "غير متصل — يتطلب إعداد Meta Business" : "Not connected — requires Meta Business setup"}</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-amber-400" />
          </div>
          <p className="text-[9.5px] text-muted-foreground/60 mt-2 ms-[52px]">{ar ? "سيعمل عبر Supabase Edge Function عند التفعيل" : "Will run via Supabase Edge Function when configured"}</p>
        </div>

        {/* SMS */}
        <div className="border border-border/40 rounded-xl p-4 bg-background">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Smartphone size={18} className="text-blue-500" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-medium">SMS Gateway</p>
              <p className="text-[10.5px] text-muted-foreground">{ar ? "غير متصل — يتطلب إعداد Twilio أو بديل محلي" : "Not connected — requires Twilio or local gateway"}</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-amber-400" />
          </div>
          <p className="text-[9.5px] text-muted-foreground/60 mt-2 ms-[52px]">{ar ? "قوالب الرسائل جاهزة — فقط أضف بيانات الاتصال" : "Templates ready — just add API credentials"}</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="border border-border/40 rounded-xl p-4 bg-background">
          <Bell size={14} className="text-primary mb-2" />
          <p className="text-[20px] font-medium tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>{enabledCount}/{templates.length}</p>
          <p className="text-[10px] text-muted-foreground">{ar ? "قوالب مفعلة" : "Templates Active"}</p>
        </div>
        <div className="border border-border/40 rounded-xl p-4 bg-background">
          <Send size={14} className="text-emerald-500 mb-2" />
          <p className="text-[20px] font-medium tabular-nums text-emerald-600" style={{ fontFamily: "var(--app-font-serif)" }}>{totalSent}</p>
          <p className="text-[10px] text-muted-foreground">{ar ? "إجمالي المرسل" : "Total Sent"}</p>
        </div>
        <div className="border border-border/40 rounded-xl p-4 bg-background">
          <MessageCircle size={14} className="text-[#25D366] mb-2" />
          <p className="text-[20px] font-medium tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>{whatsappCount}</p>
          <p className="text-[10px] text-muted-foreground">{ar ? "قوالب واتساب" : "WhatsApp Templates"}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <select value={filterTrigger} onChange={e => setFilterTrigger(e.target.value)}
          className="h-9 px-3 rounded-xl border border-border/60 bg-card text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
          <option value="all">{ar ? "كل المحفزات" : "All Triggers"}</option>
          {(Object.keys(TRIGGER_META) as NotificationTrigger[]).map(t => (
            <option key={t} value={t}>{ar ? TRIGGER_META[t].ar : TRIGGER_META[t].en}</option>
          ))}
        </select>
        <span className="text-[11px] text-muted-foreground ms-auto">{filtered.length} {ar ? "قالب" : "templates"}</span>
      </div>

      {/* Templates list */}
      <div className="space-y-2">
        {filtered.map(tpl => {
          const tm = TRIGGER_META[tpl.trigger];
          const Icon = tm.icon;
          return (
            <div key={tpl.id}
              className={`border rounded-xl p-4 bg-background transition-all hover:shadow-sm group ${tpl.enabled ? "border-border/40" : "border-border/25 opacity-60"}`}>
              <div className="flex items-center gap-4">
                {/* Trigger icon */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tm.bg}`}>
                  <Icon size={15} className={tm.color} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-[13px] font-medium truncate">{ar ? tpl.nameAr : tpl.nameEn}</h3>
                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${tpl.channel === "whatsapp" ? "bg-[#25D366]/10 text-[#25D366]" : "bg-blue-50 text-blue-600"}`}>
                      {tpl.channel === "whatsapp" ? "WhatsApp" : "SMS"}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-muted-foreground truncate max-w-[400px]">
                    {ar ? tpl.templateAr.substring(0, 80) : tpl.templateEn.substring(0, 80)}...
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-[9.5px] text-muted-foreground">
                    <span>{tpl.totalSent} {ar ? "مرسل" : "sent"}</span>
                    {tpl.lastSent && (
                      <span className="flex items-center gap-1">
                        <Clock size={8} />
                        {ar ? "آخر إرسال" : "Last"}: {new Date(tpl.lastSent).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setPreviewTemplate(tpl)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye size={13} />
                  </button>
                  <button onClick={() => handleToggle(tpl.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted">
                    {tpl.enabled ? <ToggleRight size={16} className="text-emerald-500" /> : <ToggleLeft size={16} className="text-muted-foreground" />}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Integration notes */}
      <div className="mt-6 bg-muted/15 border border-border/30 rounded-xl p-5">
        <h3 className="text-[13px] font-medium text-foreground mb-3" style={{ fontFamily: "var(--app-font-serif)" }}>
          {ar ? "إعداد التكامل" : "Integration Setup"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10.5px]">
          <div>
            <p className="font-medium text-foreground mb-1 flex items-center gap-1.5">
              <MessageCircle size={11} className="text-[#25D366]" />WhatsApp Business API
            </p>
            <ol className="space-y-1 text-muted-foreground list-decimal list-inside">
              <li>{ar ? "إنشاء حساب Meta Business" : "Create Meta Business account"}</li>
              <li>{ar ? "إعداد WhatsApp Business API" : "Set up WhatsApp Business API"}</li>
              <li>{ar ? "إضافة رقم الهاتف وتأكيده" : "Add and verify phone number"}</li>
              <li>{ar ? "تقديم القوالب للموافقة من Meta" : "Submit templates for Meta approval"}</li>
              <li>{ar ? "إضافة API Token في إعدادات THOTH" : "Add API Token in THOTH settings"}</li>
            </ol>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1 flex items-center gap-1.5">
              <Smartphone size={11} className="text-blue-500" />SMS Gateway
            </p>
            <ol className="space-y-1 text-muted-foreground list-decimal list-inside">
              <li>{ar ? "اختر مزود SMS (Twilio، Vonage، أو محلي)" : "Choose SMS provider (Twilio, Vonage, or local)"}</li>
              <li>{ar ? "إنشاء حساب وإضافة رصيد" : "Create account and add credits"}</li>
              <li>{ar ? "إضافة API credentials في Edge Function" : "Add API credentials to Edge Function"}</li>
              <li>{ar ? "اختبار الإرسال" : "Test sending"}</li>
            </ol>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border/20 flex items-center gap-2 text-[10px] text-muted-foreground">
          <Shield size={10} />
          {ar ? "جميع بيانات الاتصال مشفرة ومخزنة في Supabase. لا تُرسل أي رسائل بدون موافقة العميل." : "All credentials encrypted in Supabase. No messages sent without customer opt-in consent."}
        </div>
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          ar={ar}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </div>
  );
}
