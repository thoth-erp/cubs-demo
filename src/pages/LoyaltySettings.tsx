/**
 * Loyalty Settings — Program configuration, tiers, rules, Shopify connection
 * إعدادات الولاء — إعدادات البرنامج والمستويات والقواعد واتصال شوبيفاي
 */

import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import {
  TIER_META, TIER_ORDER, fmtCurrency,
  type LoyaltyTierSlug,
} from "../data/loyalty";
import {
  Settings, Star, Crown, Gift, ShoppingBag, Zap,
  Check, AlertCircle, ExternalLink, Wifi, WifiOff,
  ArrowRight, Edit3, Clock, Shield,
} from "lucide-react";

type Tab = "program" | "tiers" | "rules" | "shopify";

const TABS: { id: Tab; en: string; ar: string; icon: React.ElementType }[] = [
  { id: "program", en: "Program",  ar: "البرنامج",  icon: Settings },
  { id: "tiers",   en: "Tiers",    ar: "المستويات", icon: Crown },
  { id: "rules",   en: "Rules",    ar: "القواعد",   icon: Zap },
  { id: "shopify", en: "Shopify",  ar: "شوبيفاي",   icon: ShoppingBag },
];

// ─── Editable field ───────────────────────────────────────

function SettingRow({ label, description, value, type = "text" }: {
  label: string; description?: string; value: string; type?: "text" | "number";
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-border/25 last:border-0">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-foreground">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <input type={type} defaultValue={value} readOnly
        className="w-[140px] h-8 px-3 rounded-lg border border-border/80 bg-card text-[13px] text-foreground text-end tabular-nums focus:outline-none focus:border-primary/40 transition-colors"
      />
    </div>
  );
}

function ToggleRow({ label, description, defaultChecked = false }: {
  label: string; description?: string; defaultChecked?: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-border/25 last:border-0">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-foreground">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <button onClick={() => setChecked(!checked)}
        className={`w-10 h-5.5 rounded-full transition-colors relative ${checked ? "bg-primary" : "bg-border"}`}
        style={{ minWidth: 40, height: 22 }}>
        <div className={`absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[19px]" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════

export default function LoyaltySettings() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [tab, setTab] = useState<Tab>("program");

  return (
    <div className="min-h-full py-8 px-7 md:px-10 max-w-[900px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="text-[11px] text-muted-foreground/60 tracking-[0.08em] uppercase mb-2">{ar ? "برنامج الولاء" : "Loyalty Program"}</p>
        <h1 className="text-[26px] font-medium text-foreground leading-tight" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.025em" }}>
          {ar ? "إعدادات الولاء" : "Loyalty Settings"}
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border/40 mb-6">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-3 text-[13px] font-medium border-b-2 transition-colors ${tab === t.id ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"}`}>
            <t.icon size={14} strokeWidth={1.75} />
            {ar ? t.ar : t.en}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "program" && <ProgramTab ar={ar} />}
      {tab === "tiers" && <TiersTab ar={ar} />}
      {tab === "rules" && <RulesTab ar={ar} />}
      {tab === "shopify" && <ShopifyTab ar={ar} />}
    </div>
  );
}

// ─── Program tab ──────────────────────────────────────────

function ProgramTab({ ar }: { ar: boolean }) {
  return (
    <div className="space-y-6">
      <div className="bg-background border border-border/40 rounded-xl px-5">
        <h3 className="text-[14px] font-medium text-foreground py-4 border-b border-border/30" style={{ fontFamily: "var(--app-font-serif)" }}>
          {ar ? "قواعد الاكتساب" : "Earning Rules"}
        </h3>
        <SettingRow label={ar ? "النقاط لكل مبلغ" : "Points per amount"} description={ar ? "عدد النقاط المكتسبة" : "Points earned per currency unit"} value="100" type="number" />
        <SettingRow label={ar ? "المبلغ لكل نقطة" : "Amount per points"} description={ar ? "المبلغ المطلوب لاكتساب النقاط (ج.م)" : "Currency amount required (EGP)"} value="10" type="number" />
        <SettingRow label={ar ? "العملة" : "Currency"} value="EGP" />
      </div>

      <div className="bg-background border border-border/40 rounded-xl px-5">
        <h3 className="text-[14px] font-medium text-foreground py-4 border-b border-border/30" style={{ fontFamily: "var(--app-font-serif)" }}>
          {ar ? "قواعد الاستبدال" : "Redemption Rules"}
        </h3>
        <SettingRow label={ar ? "نقاط الاستبدال" : "Points to redeem"} description={ar ? "النقاط المطلوبة للخصم" : "Points required for discount"} value="1000" type="number" />
        <SettingRow label={ar ? "قيمة الخصم" : "Discount value"} description={ar ? "قيمة الخصم بالجنيه" : "Discount amount (EGP)"} value="10" type="number" />
        <SettingRow label={ar ? "الحد الأدنى للاستبدال" : "Minimum redemption"} description={ar ? "أقل عدد نقاط" : "Minimum points"} value="500" type="number" />
        <SettingRow label={ar ? "الحد الأقصى للخصم" : "Maximum discount"} description={ar ? "أقصى خصم بالجنيه (فارغ = بلا حد)" : "Max discount (EGP, empty = no limit)"} value="" />
      </div>

      <div className="bg-background border border-border/40 rounded-xl px-5">
        <h3 className="text-[14px] font-medium text-foreground py-4 border-b border-border/30" style={{ fontFamily: "var(--app-font-serif)" }}>
          {ar ? "القنوات" : "Channels"}
        </h3>
        <ToggleRow label={ar ? "اكتساب أونلاين" : "Earn Online"} description={ar ? "اكتساب النقاط من طلبات شوبيفاي" : "Earn points from Shopify orders"} defaultChecked />
        <ToggleRow label={ar ? "اكتساب في المتجر" : "Earn In-Store"} description={ar ? "اكتساب النقاط من المشتريات المباشرة" : "Earn points from in-store purchases"} defaultChecked />
        <ToggleRow label={ar ? "استبدال أونلاين" : "Redeem Online"} description={ar ? "استبدال النقاط على شوبيفاي" : "Redeem points on Shopify"} defaultChecked />
        <ToggleRow label={ar ? "استبدال في المتجر" : "Redeem In-Store"} description={ar ? "استبدال النقاط في المتجر" : "Redeem points at physical store"} defaultChecked />
      </div>

      <div className="bg-background border border-border/40 rounded-xl px-5">
        <h3 className="text-[14px] font-medium text-foreground py-4 border-b border-border/30" style={{ fontFamily: "var(--app-font-serif)" }}>
          {ar ? "انتهاء صلاحية النقاط" : "Points Expiry"}
        </h3>
        <ToggleRow label={ar ? "تفعيل انتهاء الصلاحية" : "Enable expiry"} description={ar ? "حذف النقاط غير المستخدمة بعد فترة محددة" : "Remove unused points after a set period"} defaultChecked={false} />
        <SettingRow label={ar ? "مدة الصلاحية (بالأيام)" : "Expiry period (days)"} description={ar ? "عدد الأيام قبل انتهاء صلاحية النقاط غير المستخدمة" : "Days before unused points expire"} value="365" type="number" />
        <SettingRow label={ar ? "الحد الأدنى للرصيد المحمي" : "Protected balance"} description={ar ? "لا تنتهي النقاط إذا كان الرصيد أقل من هذا الحد" : "Points won't expire if balance is below this threshold"} value="500" type="number" />
        <ToggleRow label={ar ? "إشعار قبل الانتهاء" : "Expiry warning"} description={ar ? "إرسال تنبيه للعميل قبل 14 يوم من انتهاء الصلاحية" : "Notify customer 14 days before points expire"} defaultChecked />
        <SettingRow label={ar ? "أيام التنبيه المسبق" : "Warning days"} description={ar ? "عدد الأيام لإرسال التنبيه قبل الانتهاء" : "Days before expiry to send the warning"} value="14" type="number" />
      </div>
    </div>
  );
}

// ─── Tiers tab ────────────────────────────────────────────

function TiersTab({ ar }: { ar: boolean }) {
  return (
    <div className="space-y-4">
      <p className="text-[12px] text-muted-foreground mb-2">
        {ar ? "يتم ترقية الأعضاء تلقائيًا عند تجاوز الحد الأدنى للإنفاق" : "Members are automatically upgraded when they exceed the minimum spend threshold."}
      </p>

      {TIER_ORDER.map(slug => {
        const tm = TIER_META[slug];
        const isVip = slug === "vip";
        return (
          <div key={slug} className={`bg-background border border-border/40 rounded-xl overflow-hidden bg-gradient-to-r ${tm.gradient}`}>
            <div className="px-5 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: tm.color + "20" }}>
                {isVip ? <Crown size={18} style={{ color: tm.color }} /> : <Star size={18} style={{ color: tm.color }} />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-medium text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>
                    {ar ? tm.ar : tm.en}
                  </h3>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${tm.pill}`}>
                    {tm.multiplier}x
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {slug === "bronze"
                    ? (ar ? "المستوى الافتراضي" : "Default tier")
                    : `${ar ? "الحد الأدنى:" : "Min spend:"} ${fmtCurrency(tm.minSpend)}`
                  }
                </p>
              </div>
              <div className="text-end">
                <p className="text-[11px] text-muted-foreground">{ar ? "مضاعف الاكتساب" : "Earning multiplier"}</p>
                <p className="text-[16px] font-medium text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>{tm.multiplier}x</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Rules tab ────────────────────────────────────────────

function RulesTab({ ar }: { ar: boolean }) {
  const rules = [
    { id: 1, nameEn: "Base Spend Rule", nameAr: "قاعدة الإنفاق الأساسية", type: "spend", statusEn: "Active", statusAr: "نشط", descEn: "100 points per 10 EGP", descAr: "100 نقطة لكل 10 ج.م", active: true },
    { id: 2, nameEn: "Furniture 1.5x Bonus", nameAr: "مكافأة الأثاث 1.5x", type: "category_bonus", statusEn: "Active", statusAr: "نشط", descEn: "1.5x points on furniture category", descAr: "1.5x نقاط على فئة الأثاث", active: true },
    { id: 3, nameEn: "First Purchase Bonus", nameAr: "مكافأة أول شراء", type: "first_purchase", statusEn: "Active", statusAr: "نشط", descEn: "500 bonus points on first order", descAr: "500 نقطة مكافأة على أول طلب", active: true },
    { id: 4, nameEn: "Birthday Reward", nameAr: "مكافأة عيد الميلاد", type: "birthday", statusEn: "Active", statusAr: "نشط", descEn: "1,000 bonus points on birthday", descAr: "1,000 نقطة مكافأة في عيد الميلاد", active: true },
    { id: 5, nameEn: "Eid Double Points", nameAr: "نقاط مضاعفة في العيد", type: "campaign", statusEn: "Scheduled", statusAr: "مجدول", descEn: "2x points during Eid Al-Adha", descAr: "نقاط مضاعفة خلال عيد الأضحى", active: false },
  ];

  const typeLabels: Record<string, { en: string; ar: string; pill: string }> = {
    spend: { en: "Spend", ar: "إنفاق", pill: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
    category_bonus: { en: "Category", ar: "فئة", pill: "bg-blue-50 text-blue-700 border border-blue-200" },
    first_purchase: { en: "First Purchase", ar: "أول شراء", pill: "bg-violet-50 text-violet-700 border border-violet-200" },
    birthday: { en: "Birthday", ar: "عيد ميلاد", pill: "bg-pink-50 text-pink-700 border border-pink-200" },
    campaign: { en: "Campaign", ar: "حملة", pill: "bg-amber-50 text-amber-700 border border-amber-200" },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-muted-foreground">{rules.length} {ar ? "قاعدة" : "rules"}</p>
        <div className="flex items-center gap-4">
          <a href="/loyalty/campaigns" className="text-[11px] text-violet-600 hover:underline flex items-center gap-1">
            {ar ? "الحملات" : "Campaigns"}<ArrowRight size={10} />
          </a>
          <a href="/loyalty/rules" className="text-[11px] text-primary hover:underline flex items-center gap-1">
            {ar ? "إدارة كاملة" : "Full Management"}<ArrowRight size={10} />
          </a>
        </div>
      </div>

      <div className="border border-border/40 rounded-xl overflow-hidden bg-background divide-y divide-border/25">
        {rules.map(rule => {
          const tl = typeLabels[rule.type] || typeLabels.spend;
          return (
            <div key={rule.id} className="flex items-center gap-4 px-5 py-4">
              <div className={`w-2 h-2 rounded-full shrink-0 ${rule.active ? "bg-emerald-500" : "bg-amber-500"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${tl.pill}`}>
                    {ar ? tl.ar : tl.en}
                  </span>
                  <h4 className="text-[13px] font-medium text-foreground truncate">{ar ? rule.nameAr : rule.nameEn}</h4>
                </div>
                <p className="text-[11px] text-muted-foreground">{ar ? rule.descAr : rule.descEn}</p>
              </div>
              <span className={`text-[11px] font-medium ${rule.active ? "text-emerald-600" : "text-amber-600"}`}>
                {ar ? rule.statusAr : rule.statusEn}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Shopify tab ──────────────────────────────────────────

function ShopifyTab({ ar }: { ar: boolean }) {
  const [connected] = useState(false); // Will be dynamic later

  return (
    <div className="space-y-6">
      {/* Link to full Shopify page */}
      <div className="flex justify-end">
        <a href="/loyalty/shopify" className="text-[11px] text-primary hover:underline flex items-center gap-1">
          {ar ? "صفحة الاتصال الكاملة" : "Full Connection Page"}<ArrowRight size={10} />
        </a>
      </div>

      {/* Connection status */}
      <div className={`border rounded-xl p-6 ${connected ? "border-emerald-200 bg-emerald-50/30" : "border-border/40 bg-background"}`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${connected ? "bg-emerald-100" : "bg-muted"}`}>
            {connected ? <Wifi size={20} className="text-emerald-600" /> : <WifiOff size={20} className="text-muted-foreground" />}
          </div>
          <div className="flex-1">
            <h3 className="text-[16px] font-medium text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>
              {connected
                ? (ar ? "متصل بشوبيفاي" : "Connected to Shopify")
                : (ar ? "غير متصل" : "Not Connected")
              }
            </h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {connected
                ? "my-store.myshopify.com"
                : (ar ? "قم بتوصيل متجرك لمزامنة الطلبات والنقاط" : "Connect your store to sync orders and points")
              }
            </p>
          </div>
          <div className={`w-3 h-3 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/30"}`} />
        </div>
      </div>

      {/* Connection form */}
      {!connected && (
        <div className="bg-background border border-border/40 rounded-xl px-5">
          <h3 className="text-[14px] font-medium text-foreground py-4 border-b border-border/30" style={{ fontFamily: "var(--app-font-serif)" }}>
            {ar ? "إعداد الاتصال" : "Connection Setup"}
          </h3>

          <div className="py-4 space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">
                {ar ? "رابط المتجر" : "Store URL"}
              </label>
              <input type="text" placeholder="my-store.myshopify.com"
                className="w-full h-9 px-3 rounded-xl border border-border/80 bg-card text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">
                {ar ? "رمز الوصول" : "Access Token"}
              </label>
              <input type="password" placeholder="shpat_xxxxxxxxxxxxx"
                className="w-full h-9 px-3 rounded-xl border border-border/80 bg-card text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                {ar ? "من إعدادات التطبيقات المخصصة في شوبيفاي" : "From Shopify Admin → Settings → Apps → Custom Apps"}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button className="h-9 px-5 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium flex items-center gap-2 hover:opacity-90 transition-opacity">
                <Wifi size={14} />{ar ? "اتصال" : "Connect"}
              </button>
              <a href="https://shopify.dev/docs/apps/build/authentication/access-tokens" target="_blank" rel="noopener noreferrer"
                className="text-[11px] text-primary hover:underline flex items-center gap-1">
                {ar ? "كيفية الإعداد" : "Setup guide"}<ExternalLink size={10} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Sync settings */}
      <div className="bg-background border border-border/40 rounded-xl px-5">
        <h3 className="text-[14px] font-medium text-foreground py-4 border-b border-border/30" style={{ fontFamily: "var(--app-font-serif)" }}>
          {ar ? "إعدادات المزامنة" : "Sync Settings"}
        </h3>
        <ToggleRow label={ar ? "مزامنة العملاء" : "Sync Customers"} description={ar ? "إنشاء/تحديث العملاء من شوبيفاي" : "Create/update customers from Shopify"} defaultChecked />
        <ToggleRow label={ar ? "مزامنة الطلبات" : "Sync Orders"} description={ar ? "استقبال الطلبات وحساب النقاط" : "Receive orders and calculate points"} defaultChecked />
        <ToggleRow label={ar ? "اكتساب تلقائي" : "Auto Award Points"} description={ar ? "حساب وإضافة النقاط تلقائيًا" : "Automatically calculate and award points"} defaultChecked />
        <ToggleRow label={ar ? "مزامنة الحقول" : "Sync Metafields"} description={ar ? "تحديث رصيد النقاط على شوبيفاي" : "Update points balance on Shopify"} defaultChecked />
      </div>

      {/* Security note */}
      <div className="bg-muted/30 border border-border/30 rounded-xl px-5 py-4 flex items-start gap-3">
        <Shield size={16} className="text-muted-foreground shrink-0 mt-0.5" />
        <div>
          <p className="text-[12px] font-medium text-foreground">{ar ? "ملاحظة أمنية" : "Security Note"}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {ar
              ? "يتم تخزين بيانات الاتصال مشفرة ولا تظهر أبدًا في الواجهة. جميع مكالمات API تتم عبر الخادم."
              : "Connection credentials are stored encrypted and never exposed to the frontend. All Shopify API calls happen server-side via Edge Functions."
            }
          </p>
        </div>
      </div>
    </div>
  );
}
