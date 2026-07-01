/**
 * App Configuration — Full configuration page for THOTH mobile apps
 * إعدادات التطبيق — صفحة الإعدادات الكاملة للتطبيقات المحمولة
 */

import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, Palette, Puzzle, Link2, Store, Hammer,
  Globe, Smartphone, ChevronDown, Upload, Check, X,
  ExternalLink, Wifi, WifiOff, Shield, Clock, Download,
  Plus, Trash2, Search, Eye, RefreshCw, AlertCircle,
  ArrowRight, Zap, Crown, Lock, Image as ImageIcon,
  Play, Square, ToggleLeft, ToggleRight, Copy,
} from "lucide-react";
import {
  MOBILE_APPS, APP_FEATURES, DEEP_LINKS, APP_BUILDS,
  type AppFeature, type DeepLink, type AppBuild,
} from "../lib/mobile-app-data";

type Tab = "general" | "branding" | "features" | "deeplinks" | "appstore" | "build";

const TABS: { id: Tab; en: string; ar: string; icon: React.ElementType }[] = [
  { id: "general",   en: "General",   ar: "عام",       icon: Settings },
  { id: "branding",  en: "Branding",  ar: "العلامة التجارية", icon: Palette },
  { id: "features",  en: "Features",  ar: "المميزات",  icon: Puzzle },
  { id: "deeplinks", en: "Deep Links", ar: "الروابط العميقة", icon: Link2 },
  { id: "appstore",  en: "App Store", ar: "متجر التطبيقات", icon: Store },
  { id: "build",     en: "Build",     ar: "البناء",     icon: Hammer },
];

const EASE_OUT_QUINT = [0.22, 1, 0.36, 1] as const;
const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT_QUINT } } };
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

const STATUS_META: Record<string, { en: string; ar: string; color: string; bg: string }> = {
  draft:        { en: "Draft",        ar: "مسودة",  color: "text-muted-foreground",  bg: "bg-muted/50" },
  configuring:  { en: "Configuring",  ar: "قيد الإعداد", color: "text-blue-600",   bg: "bg-blue-50" },
  building:     { en: "Building",     ar: "قيد البناء",  color: "text-amber-600",   bg: "bg-amber-50" },
  review:       { en: "In Review",    ar: "قيد المراجعة", color: "text-violet-600", bg: "bg-violet-50" },
  published:    { en: "Published",    ar: "منشور",   color: "text-emerald-600",  bg: "bg-emerald-50" },
  rejected:     { en: "Rejected",     ar: "مرفوض",   color: "text-rose-500",     bg: "bg-rose-50" },
  paused:       { en: "Paused",       ar: "متوقف",   color: "text-amber-600",    bg: "bg-amber-50" },
};

const BUILD_STATUS_META: Record<string, { en: string; ar: string; color: string; bg: string }> = {
  pending:  { en: "Pending",   ar: "قيد الانتظار", color: "text-muted-foreground", bg: "bg-muted/50" },
  building: { en: "Building",  ar: "قيد البناء",   color: "text-amber-600",       bg: "bg-amber-50" },
  testing:  { en: "Testing",   ar: "قيد الاختبار", color: "text-blue-600",        bg: "bg-blue-50" },
  ready:    { en: "Ready",     ar: "جاهز",        color: "text-emerald-600",     bg: "bg-emerald-50" },
  failed:   { en: "Failed",    ar: "فشل",         color: "text-rose-500",        bg: "bg-rose-50" },
};

const FEATURE_CATEGORIES = ["all", "core", "engagement", "commerce", "analytics", "integration"] as const;

// ═══════════════════════════════════════════════════════════

export default function AppConfiguration() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [tab, setTab] = useState<Tab>("general");
  const app = MOBILE_APPS[0];

  return (
    <div className="min-h-full py-8 px-7 md:px-10 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="text-[11px] text-muted-foreground/60 tracking-[0.08em] uppercase mb-2">{ar ? "منشئ التطبيق المحمول" : "Mobile App Builder"}</p>
        <div className="flex items-center gap-3">
          <h1 className="text-[26px] font-medium text-foreground leading-tight" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.025em" }}>
            {ar ? "إعدادات التطبيق" : "App Configuration"}
          </h1>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${STATUS_META[app.status].bg} ${STATUS_META[app.status].color}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {ar ? STATUS_META[app.status].ar : STATUS_META[app.status].en}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border/40 mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-3 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.id ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"}`}>
            <t.icon size={14} strokeWidth={1.75} />
            {ar ? t.ar : t.en}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "general" && <motion.div key="general" variants={fadeUp} initial="hidden" animate="visible" exit="hidden"><GeneralTab ar={ar} app={app} /></motion.div>}
        {tab === "branding" && <motion.div key="branding" variants={fadeUp} initial="hidden" animate="visible" exit="hidden"><BrandingTab ar={ar} app={app} /></motion.div>}
        {tab === "features" && <motion.div key="features" variants={fadeUp} initial="hidden" animate="visible" exit="hidden"><FeaturesTab ar={ar} /></motion.div>}
        {tab === "deeplinks" && <motion.div key="deeplinks" variants={fadeUp} initial="hidden" animate="visible" exit="hidden"><DeepLinksTab ar={ar} /></motion.div>}
        {tab === "appstore" && <motion.div key="appstore" variants={fadeUp} initial="hidden" animate="visible" exit="hidden"><AppStoreTab ar={ar} app={app} /></motion.div>}
        {tab === "build" && <motion.div key="build" variants={fadeUp} initial="hidden" animate="visible" exit="hidden"><BuildTab ar={ar} app={app} /></motion.div>}
      </AnimatePresence>
    </div>
  );
}

// ─── General Tab ──────────────────────────────────────────

function GeneralTab({ ar, app }: { ar: boolean; app: typeof MOBILE_APPS[0] }) {
  const [platform, setPlatform] = useState<string>(app.platform);

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      {/* App Info */}
      <SectionCard title={ar ? "معلومات التطبيق" : "App Information"} icon={Smartphone}>
        <SettingRow label={ar ? "اسم التطبيق" : "App Name"} value={app.name} />
        <SettingRow label={ar ? "الرابط" : "Website URL"} value={app.website_url} icon={<ExternalLink size={12} />} />
        <div className="py-3.5 border-b border-border/25">
          <p className="text-[13px] font-medium text-foreground mb-2">{ar ? "المنصة" : "Platform"}</p>
          <div className="flex gap-2">
            {(["ios", "android", "both"] as const).map(p => (
              <button key={p} onClick={() => setPlatform(p)}
                className={`px-3.5 py-2 rounded-lg text-[12px] font-medium border transition-colors ${platform === p ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border/60 text-muted-foreground hover:border-border"}`}>
                {p === "ios" ? "iOS" : p === "android" ? "Android" : (ar ? "الاثنين" : "Both")}
              </button>
            ))}
          </div>
        </div>
        <SettingRow label={ar ? "الإصدار" : "Version"} value={app.app_version} />
        <div className="py-3.5 last:border-0">
          <p className="text-[13px] font-medium text-foreground">{ar ? "حالة التطبيق" : "App Status"}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${STATUS_META[app.status].bg} ${STATUS_META[app.status].color}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {ar ? STATUS_META[app.status].ar : STATUS_META[app.status].en}
            </span>
            <span className="text-[11px] text-muted-foreground/60">{ar ? `آخر تحديث: ${app.updated_at}` : `Last updated: ${app.updated_at}`}</span>
          </div>
        </div>
      </SectionCard>

      {/* Shopify Integration */}
      <SectionCard title={ar ? "تكامل شوبيفاي" : "Shopify Integration"} icon={Store}>
        <div className="py-3.5 border-b border-border/25">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium text-foreground">{ar ? "حالة الاتصال" : "Connection Status"}</p>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${app.shopify_connected ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}>
              {app.shopify_connected ? <Wifi size={12} /> : <WifiOff size={12} />}
              {app.shopify_connected ? (ar ? "متصل" : "Connected") : (ar ? "غير متصل" : "Disconnected")}
            </span>
          </div>
        </div>
        <SettingRow label={ar ? "رابط المتجر" : "Store URL"} value={app.shopify_store_url || "—"} />
        <SettingRow label={ar ? "مفتاح API" : "API Key"} value={app.shopify_api_key ? "••••" + app.shopify_api_key.slice(-4) : "—"} icon={<Shield size={12} />} />
        <SettingRow label={ar ? "سر Webhook" : "Webhook Secret"} value={app.shopify_webhook_secret ? "••••" + app.shopify_webhook_secret.slice(-4) : "—"} icon={<Shield size={12} />} />
        <div className="py-3.5 last:border-0">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium hover:bg-primary/90 transition-colors">
            {app.shopify_connected ? (ar ? "إعادة الاتصال" : "Reconnect") : (ar ? "الاتصال" : "Connect")}
            <ArrowRight size={13} />
          </button>
        </div>
      </SectionCard>
    </motion.div>
  );
}

// ─── Branding Tab ─────────────────────────────────────────

function BrandingTab({ ar, app }: { ar: boolean; app: typeof MOBILE_APPS[0] }) {
  const [primaryColor, setPrimaryColor] = useState(app.primary_color);
  const [secondaryColor, setSecondaryColor] = useState(app.secondary_color);

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Icon Upload */}
        <SectionCard title={ar ? "أيقونة التطبيق" : "App Icon"} icon={ImageIcon}>
          <div className="p-4">
            <div className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center hover:border-primary/30 transition-colors cursor-pointer group">
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                <Upload size={24} className="text-primary/60" />
              </div>
              <p className="text-[13px] font-medium text-foreground mb-1">{ar ? "اسحب وأفلت الأيقونة هنا" : "Drag & drop your icon here"}</p>
              <p className="text-[11px] text-muted-foreground/60">PNG, SVG • 1024×1024px</p>
            </div>
          </div>
        </SectionCard>

        {/* Color Pickers */}
        <SectionCard title={ar ? "الألوان" : "Colors"} icon={Palette}>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border/25">
              <div>
                <p className="text-[13px] font-medium text-foreground">{ar ? "اللون الأساسي" : "Primary Color"}</p>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">{ar ? "الأزرار والعناوين الرئيسية" : "Buttons and main headings"}</p>
              </div>
              <div className="flex items-center gap-2">
                <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-border/60 cursor-pointer" />
                <input type="text" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                  className="w-20 h-8 px-2 rounded-lg border border-border/80 bg-card text-[12px] text-foreground text-center font-mono" />
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border/25">
              <div>
                <p className="text-[13px] font-medium text-foreground">{ar ? "اللون الثانوي" : "Secondary Color"}</p>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">{ar ? "التمييز والتأثيرات" : "Accents and highlights"}</p>
              </div>
              <div className="flex items-center gap-2">
                <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-border/60 cursor-pointer" />
                <input type="text" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)}
                  className="w-20 h-8 px-2 rounded-lg border border-border/80 bg-card text-[12px] text-foreground text-center font-mono" />
              </div>
            </div>
            <div className="py-3 last:border-0">
              <p className="text-[13px] font-medium text-foreground mb-2">{ar ? "نوع شاشة البداية" : "Splash Screen Type"}</p>
              <div className="flex gap-2">
                {(["image", "color", "animated"] as const).map(t => (
                  <button key={t} className={`px-3.5 py-2 rounded-lg text-[12px] font-medium border transition-colors ${app.splash_screen_type === t ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border/60 text-muted-foreground"}`}>
                    {t === "image" ? (ar ? "صورة" : "Image") : t === "color" ? (ar ? "لون" : "Color") : (ar ? "متحرك" : "Animated")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Live Preview */}
      <SectionCard title={ar ? "معاينة مباشرة" : "Live Preview"} icon={Eye}>
        <div className="p-6 flex flex-col items-center">
          <div className="flex gap-8 items-start">
            {/* App Icon Preview */}
            <div className="text-center">
              <p className="text-[11px] text-muted-foreground/60 mb-2 uppercase tracking-wider">{ar ? "أيقونة التطبيق" : "App Icon"}</p>
              <div className="w-24 h-24 rounded-[22px] shadow-lg flex items-center justify-center text-white font-bold text-[18px] relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
                <span style={{ fontFamily: "var(--app-font-serif)" }}>TH</span>
              </div>
            </div>

            {/* Splash Screen Preview */}
            <div className="text-center">
              <p className="text-[11px] text-muted-foreground/60 mb-2 uppercase tracking-wider">{ar ? "شاشة البداية" : "Splash Screen"}</p>
              <div className="w-[140px] h-[250px] rounded-3xl shadow-xl border-4 border-foreground/10 flex flex-col items-center justify-center text-white relative overflow-hidden"
                style={{ background: app.splash_screen_type === "color" ? primaryColor : `linear-gradient(180deg, ${primaryColor}, ${secondaryColor})` }}>
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-3 backdrop-blur-sm">
                  <span className="text-[22px] font-bold" style={{ fontFamily: "var(--app-font-serif)" }}>TH</span>
                </div>
                <p className="text-[11px] font-medium tracking-wide opacity-90">{app.name}</p>
                {app.splash_screen_type === "animated" && (
                  <div className="absolute bottom-4 flex items-center gap-1">
                    <Play size={10} className="text-white/60" />
                    <span className="text-[9px] text-white/60">{ar ? "متحرك" : "Animated"}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SectionCard>
    </motion.div>
  );
}

// ─── Features Tab ─────────────────────────────────────────

function FeaturesTab({ ar }: { ar: boolean }) {
  const [features, setFeatures] = useState(APP_FEATURES);
  const [category, setCategory] = useState<string>("all");

  const filtered = category === "all" ? features : features.filter(f => f.category === category);

  const toggleFeature = (id: string) => {
    setFeatures(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      {/* Category Filters */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {FEATURE_CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-3.5 py-2 rounded-lg text-[12px] font-medium border transition-colors ${category === c ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border/60 text-muted-foreground hover:border-border"}`}>
            {c === "all" ? (ar ? "الكل" : "All") : c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {/* Feature Grid */}
      <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <AnimatePresence>
          {filtered.map(f => (
            <motion.div key={f.id} variants={fadeUp} layout
              className={`bg-background border rounded-xl p-4 transition-colors ${f.enabled ? "border-border/40" : "border-border/20 opacity-60"}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-[20px]">{f.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-medium text-foreground">{ar ? f.name_ar : f.name}</p>
                      {f.premium && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-50 text-amber-600">
                          <Crown size={9} /> PRO
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">{ar ? f.description_ar : f.description}</p>
                  </div>
                </div>
                <button onClick={() => toggleFeature(f.id)}
                  className={`flex-shrink-0 w-10 h-[22px] rounded-full transition-colors relative ${f.enabled ? "bg-primary" : "bg-border"}`}>
                  <div className={`absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white shadow transition-transform ${f.enabled ? "translate-x-[19px]" : "translate-x-0.5"}`} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground/50 px-2 py-0.5 rounded-full bg-muted/30">{f.category}</span>
                <span className="text-[10px] text-muted-foreground/50">{ar ? (f.enabled ? "مفعّل" : "معطّل") : (f.enabled ? "Enabled" : "Disabled")}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ─── Deep Links Tab ───────────────────────────────────────

function DeepLinksTab({ ar }: { ar: boolean }) {
  const [links, setLinks] = useState(DEEP_LINKS);

  const removeLink = (id: string) => setLinks(prev => prev.filter(l => l.id !== id));

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-muted-foreground">{ar ? `${links.length} روابط عميقة` : `${links.length} deep links`}</p>
        <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium hover:bg-primary/90 transition-colors">
          <Plus size={13} />
          {ar ? "إضافة رابط" : "Add Deep Link"}
        </button>
      </div>

      <motion.div variants={stagger} className="space-y-2">
        {links.map(link => (
          <motion.div key={link.id} variants={fadeUp} layout
            className="bg-background border border-border/40 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[13px] font-medium text-foreground">{ar ? link.name_ar : link.name}</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground">{link.type}</span>
                {link.active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground/60">
                <code className="font-mono bg-muted/30 px-1.5 py-0.5 rounded">{link.url_pattern}</code>
                <ArrowRight size={10} />
                <span className="truncate">{link.target_url}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground/60">
              <span className="tabular-nums">{link.usage_count.toLocaleString()} {ar ? "استخدام" : "uses"}</span>
              <button className="flex items-center gap-1 px-2 py-1 rounded hover:bg-muted/40 text-primary text-[11px] transition-colors">
                <Search size={11} /> {ar ? "اختبار" : "Test"}
              </button>
              <button onClick={() => removeLink(link.id)} className="p-1 rounded hover:bg-rose-50 text-muted-foreground/40 hover:text-rose-500 transition-colors">
                <Trash2 size={13} />
              </button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

// ─── App Store Tab ────────────────────────────────────────

function AppStoreTab({ ar, app }: { ar: boolean; app: typeof MOBILE_APPS[0] }) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Listing */}
        <SectionCard title={ar ? "بيانات المتجر" : "Store Listing"} icon={Store}>
          <SettingRow label={ar ? "اسم التطبيق" : "App Store Name"} value={app.app_store_name} />
          <div className="py-3.5 border-b border-border/25">
            <p className="text-[13px] font-medium text-foreground mb-1">{ar ? "الوصف" : "Description"}</p>
            <textarea defaultValue={app.app_description} rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border/80 bg-card text-[12px] text-foreground resize-none focus:outline-none focus:border-primary/40 transition-colors" />
          </div>
          <div className="py-3.5 border-b border-border/25">
            <p className="text-[13px] font-medium text-foreground mb-2">{ar ? "الكلمات المفتاحية" : "Keywords"}</p>
            <div className="flex flex-wrap gap-1.5">
              {app.app_keywords.map(kw => (
                <span key={kw} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/8 text-primary text-[11px] font-medium">
                  {kw}
                  <X size={10} className="cursor-pointer hover:text-primary/60" />
                </span>
              ))}
              <button className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-dashed border-border/60 text-[11px] text-muted-foreground hover:border-primary/40">
                <Plus size={10} /> {ar ? "إضافة" : "Add"}
              </button>
            </div>
          </div>
          <SettingRow label={ar ? "الفئة" : "Category"} value={app.app_category} icon={<ChevronDown size={12} />} />
          <SettingRow label={ar ? "رابط سياسة الخصوصية" : "Privacy Policy URL"} value="https://thothfashion.com/privacy" icon={<Shield size={12} />} />
        </SectionCard>

        {/* Screenshots & Preview */}
        <SectionCard title={ar ? "لقطات الشاشة" : "Screenshots"} icon={ImageIcon}>
          <div className="p-4">
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="aspect-[9/19] rounded-xl border-2 border-dashed border-border/40 flex items-center justify-center hover:border-primary/30 transition-colors cursor-pointer group">
                  <div className="text-center">
                    <Upload size={16} className="mx-auto text-muted-foreground/40 group-hover:text-primary/50 mb-1" />
                    <p className="text-[10px] text-muted-foreground/40">{i}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground/60 text-center">{ar ? "اسحب لقطات الشاشة أو انقر للتحميل" : "Drag screenshots or click to upload"}</p>
          </div>
        </SectionCard>
      </div>

      {/* Store Preview Mockup */}
      <SectionCard title={ar ? "معاينة المتجر" : "Store Preview"} icon={Eye}>
        <div className="p-6 flex justify-center">
          <div className="w-[280px] bg-card border border-border/40 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-[14px] font-bold"
                style={{ background: `linear-gradient(135deg, ${app.primary_color}, ${app.secondary_color})` }}>
                TH
              </div>
              <div>
                <p className="text-[14px] font-semibold text-foreground">{app.app_store_name}</p>
                <p className="text-[11px] text-muted-foreground/60">{app.app_category}</p>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground/70 leading-relaxed mb-3">{app.app_description}</p>
            <div className="flex gap-2 mb-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex-1 aspect-[9/16] rounded-lg bg-muted/30" />
              ))}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {app.app_keywords.slice(0, 5).map(kw => (
                <span key={kw} className="px-2 py-0.5 rounded-full bg-muted/30 text-[10px] text-muted-foreground">{kw}</span>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>
    </motion.div>
  );
}

// ─── Build Tab ────────────────────────────────────────────

function BuildTab({ ar, app }: { ar: boolean; app: typeof MOBILE_APPS[0] }) {
  const [building, setBuilding] = useState(false);

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "—";
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      {/* Build Action */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] text-muted-foreground">{ar ? `${APP_BUILDS.length} بناء مسجل` : `${APP_BUILDS.length} builds recorded`}</p>
        </div>
        <button onClick={() => setBuilding(true)}
          disabled={building}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
          {building ? <RefreshCw size={13} className="animate-spin" /> : <Hammer size={13} />}
          {building ? (ar ? "جاري البناء..." : "Building...") : (ar ? "بناء جديد" : "New Build")}
        </button>
      </div>

      {/* Build Progress */}
      {building && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
          className="bg-background border border-border/40 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <RefreshCw size={16} className="animate-spin text-primary" />
            <div>
              <p className="text-[13px] font-medium text-foreground">{ar ? "جاري بناء الإصدار الجديد..." : "Building new version..."}</p>
              <p className="text-[11px] text-muted-foreground/60">{ar ? "يتم تجميع التطبيق وتجميع الحزم" : "Compiling app and bundling packages"}</p>
            </div>
          </div>
          <div className="w-full h-1.5 rounded-full bg-muted/40 overflow-hidden">
            <motion.div className="h-full rounded-full bg-primary"
              initial={{ width: "0%" }} animate={{ width: "65%" }}
              transition={{ duration: 2, ease: "easeOut" }} />
          </div>
        </motion.div>
      )}

      {/* Build History */}
      <div className="bg-background border border-border/40 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border/30">
          <h3 className="text-[14px] font-medium text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>
            {ar ? "سجل البناء" : "Build History"}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/30 text-[11px] text-muted-foreground/60 uppercase tracking-wider">
                <th className="px-5 py-3 text-left font-medium">{ar ? "الإصدار" : "Version"}</th>
                <th className="px-5 py-3 text-left font-medium">{ar ? "الحالة" : "Status"}</th>
                <th className="px-5 py-3 text-left font-medium">{ar ? "المنصة" : "Platform"}</th>
                <th className="px-5 py-3 text-left font-medium">{ar ? "الحجم" : "Size"}</th>
                <th className="px-5 py-3 text-left font-medium">{ar ? "التاريخ" : "Date"}</th>
                <th className="px-5 py-3 text-left font-medium">{ar ? "المُنشئ" : "Triggered by"}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {APP_BUILDS.map(b => {
                const bs = BUILD_STATUS_META[b.status];
                return (
                  <tr key={b.id} className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="text-[13px] font-medium text-foreground tabular-nums">v{b.version}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${bs.bg} ${bs.color}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {ar ? bs.ar : bs.en}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[12px] text-muted-foreground capitalize">{b.platform === "both" ? (ar ? "الاثنين" : "Both") : b.platform}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[12px] text-muted-foreground tabular-nums">{formatSize(b.build_size)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[12px] text-muted-foreground">{b.started_at}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[12px] text-muted-foreground">{b.triggered_by}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      {b.status === "ready" && (
                        <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-[11px] font-medium hover:bg-emerald-100 transition-colors">
                          <Download size={11} /> {ar ? "تحميل" : "Download"}
                        </button>
                      )}
                      {b.status === "failed" && b.error_log && (
                        <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-500 text-[11px] font-medium hover:bg-rose-100 transition-colors">
                          <AlertCircle size={11} /> {ar ? "الخطأ" : "Error"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Shared Components ────────────────────────────────────

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-background border border-border/40 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/30">
        <Icon size={15} strokeWidth={1.75} className="text-muted-foreground/60" />
        <h3 className="text-[14px] font-medium text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>{title}</h3>
      </div>
      <div className="px-5">{children}</div>
    </div>
  );
}

function SettingRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-border/25 last:border-0">
      <div className="flex items-center gap-2 min-w-0">
        {icon && <span className="text-muted-foreground/50">{icon}</span>}
        <p className="text-[13px] font-medium text-foreground">{label}</p>
      </div>
      <input type="text" defaultValue={value} readOnly
        className="max-w-[260px] h-8 px-3 rounded-lg border border-border/80 bg-card text-[13px] text-foreground text-end tabular-nums focus:outline-none focus:border-primary/40 transition-colors" />
    </div>
  );
}
