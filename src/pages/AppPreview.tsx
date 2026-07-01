/**
 * App Preview — Live preview of how the mobile app will look
 * معاينة التطبيق — معاينة مباشرة لشكل التطبيق المحمول
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useLanguage } from "../context/LanguageContext";
import {
  MOBILE_APPS, APP_FEATURES, APP_BUILDS,
  type MobileApp,
} from "../lib/mobile-app-data";
import {
  Smartphone, Eye, Star, CheckCircle2, XCircle, Hammer,
  Send, ExternalLink, Package, ArrowLeft, Shield,
  Globe, Bell, Wifi, Gift, MessageSquare, CreditCard,
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function timeAgo(dateStr: string | null, ar: boolean): string {
  if (!dateStr) return ar ? "لم يتم البناء" : "Never built";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return ar ? "اليوم" : "Today";
  if (diff === 1) return ar ? "أمس" : "Yesterday";
  if (diff < 7) return ar ? `منذ ${diff} أيام` : `${diff} days ago`;
  if (diff < 30) return ar ? `منذ ${Math.floor(diff / 7)} أسابيع` : `${Math.floor(diff / 7)}w ago`;
  return ar ? `منذ ${Math.floor(diff / 30)} شهر` : `${Math.floor(diff / 30)}mo ago`;
}

const buildStatusMeta: Record<string, { en: string; ar: string; color: string; bg: string; dot: string }> = {
  pending: { en: "Pending", ar: "قيد الانتظار", color: "text-muted-foreground", bg: "bg-muted/40", dot: "bg-muted-foreground" },
  building: { en: "Building", ar: "جارٍ البناء", color: "text-blue-500", bg: "bg-blue-500/10", dot: "bg-blue-500 animate-pulse" },
  testing: { en: "Testing", ar: "جارٍ الاختبار", color: "text-amber-500", bg: "bg-amber-500/10", dot: "bg-amber-500 animate-pulse" },
  ready: { en: "Ready", ar: "جاهز", color: "text-emerald-500", bg: "bg-emerald-500/10", dot: "bg-emerald-500" },
  failed: { en: "Failed", ar: "فشل", color: "text-red-500", bg: "bg-red-500/10", dot: "bg-red-500" },
};

const featureIconMap: Record<string, React.ElementType> = {
  "🔔": Bell, "🔗": ExternalLink, "📡": Wifi, "🎁": Gift, "💬": MessageSquare,
  "📊": Eye, "⭐": Star, "❤️": Star, "📏": Package, "📱": Smartphone,
  "🔐": Shield, "🌐": Globe, "🌙": Eye, "📷": Eye, "💳": CreditCard, "🎤": Send,
};

// ─── iPhone Mockup ──────────────────────────────────────────

function IPhoneMockup({ app }: { app: MobileApp }) {
  return (
    <div className="relative mx-auto w-[280px]">
      {/* Phone frame */}
      <div className="relative rounded-[40px] bg-gray-900 p-[12px] shadow-2xl">
        {/* Notch */}
        <div className="absolute top-[12px] left-1/2 -translate-x-1/2 w-[100px] h-[28px] bg-gray-900 rounded-b-2xl z-10" />

        {/* Screen */}
        <div className="rounded-[30px] overflow-hidden bg-white" style={{ aspectRatio: "9/19.5" }}>
          {/* Status bar */}
          <div className="h-[44px] flex items-end justify-between px-6 pb-1" style={{ backgroundColor: app.primary_color }}>
            <span className="text-[10px] text-white/80 font-medium">9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-3.5 h-2 border border-white/60 rounded-sm" />
              <div className="w-1 h-2 bg-white/60 rounded-sm" />
              <div className="w-6 h-3 border border-white/60 rounded-sm relative">
                <div className="absolute inset-[1px] bg-white/60 rounded-[1px]" style={{ width: "70%" }} />
              </div>
            </div>
          </div>

          {/* App header */}
          <div className="px-4 py-3" style={{ backgroundColor: app.primary_color }}>
            <p className="text-[14px] font-bold text-white" style={{ fontFamily: "var(--app-font-serif)" }}>
              {app.name}
            </p>
            <p className="text-[10px] text-white/70 mt-0.5">{app.app_store_name}</p>
          </div>

          {/* Fake content */}
          <div className="p-3 space-y-3">
            {/* Hero banner */}
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: app.secondary_color + "30", height: 90 }}>
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-[10px] font-medium" style={{ color: app.primary_color }}>
                  {ar ? "مجموعة الصيف ٢٠٢٦" : "Summer 2026 Collection"}
                </span>
              </div>
            </div>

            {/* Product cards */}
            <div className="flex gap-2">
              {[1, 2].map(i => (
                <div key={i} className="flex-1 rounded-lg border border-gray-100 overflow-hidden">
                  <div className="h-16 bg-gray-100" />
                  <div className="p-2">
                    <div className="h-2 bg-gray-200 rounded w-3/4 mb-1" />
                    <div className="h-2 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>

            {/* Category pills */}
            <div className="flex gap-1.5">
              {["All", "Bridal", "Evening"].map((cat, i) => (
                <span
                  key={cat}
                  className="px-2.5 py-1 rounded-full text-[8px] font-medium"
                  style={{
                    backgroundColor: i === 0 ? app.primary_color : app.primary_color + "15",
                    color: i === 0 ? "white" : app.primary_color,
                  }}
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom nav */}
          <div className="absolute bottom-0 left-0 right-0 h-[50px] bg-white border-t border-gray-100 flex items-center justify-around px-4">
            {["🏠", "🔍", "🛒", "👤"].map((icon, i) => (
              <span key={i} className="text-[16px]">{icon}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const ar = false; // Will be overridden below

// ─── Feature Checklist ──────────────────────────────────────

function FeatureChecklist({ app, ar }: { app: MobileApp; ar: boolean }) {
  const features = [
    { key: "push_notifications_enabled", labelEn: "Push Notifications", labelAr: "الإشعارات الفورية", icon: Bell },
    { key: "deep_linking_enabled", labelEn: "Deep Linking", labelAr: "الربط العميق", icon: ExternalLink },
    { key: "offline_mode_enabled", labelEn: "Offline Mode", labelAr: "وضع عدم الاتصال", icon: Wifi },
    { key: "in_app_purchases_enabled", labelEn: "In-App Purchases", labelAr: "الشراء داخل التطبيق", icon: CreditCard },
    { key: "loyalty_integration", labelEn: "Loyalty Integration", labelAr: "تكامل الولاء", icon: Gift },
    { key: "chat_support_enabled", labelEn: "Chat Support", labelAr: "دعم المحادثة", icon: MessageSquare },
    { key: "analytics_enabled", labelEn: "Analytics", labelAr: "التحليلات", icon: Eye },
  ] as const;

  return (
    <div className="bg-background border border-border/40 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle2 size={14} strokeWidth={1.75} className="text-emerald-500" />
        <h3 className="text-[13px] font-medium text-foreground" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.01em" }}>
          {ar ? "قائمة المميزات" : "Feature Checklist"}
        </h3>
      </div>
      <div className="space-y-2.5">
        {features.map(({ key, labelEn, labelAr, icon: Icon }) => {
          const enabled = app[key as keyof MobileApp] as boolean;
          return (
            <div key={key} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/20 transition-colors">
              <Icon size={13} className={enabled ? "text-emerald-500" : "text-muted-foreground/40"} />
              <span className={`flex-1 text-[12px] ${enabled ? "text-foreground" : "text-muted-foreground/50 line-through"}`}>
                {ar ? labelAr : labelEn}
              </span>
              {enabled ? (
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
              ) : (
                <XCircle size={14} className="text-muted-foreground/30 shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── App Store Listing Preview ──────────────────────────────

function AppStoreListing({ app, ar }: { app: MobileApp; ar: boolean }) {
  return (
    <div className="bg-background border border-border/40 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Package size={14} strokeWidth={1.75} className="text-blue-500" />
        <h3 className="text-[13px] font-medium text-foreground" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.01em" }}>
          {ar ? "معاينة متجر التطبيقات" : "App Store Listing"}
        </h3>
      </div>

      {/* Store preview card */}
      <div className="rounded-xl border border-border/30 p-4 bg-muted/10">
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-14 h-14 rounded-[14px] flex items-center justify-center text-2xl shrink-0"
            style={{ backgroundColor: app.primary_color + "15", border: `1px solid ${app.primary_color}30` }}
          >
            👗
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-foreground truncate" style={{ fontFamily: "var(--app-font-serif)" }}>
              {ar ? app.app_store_name_ar : app.app_store_name}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{app.app_category}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={10} className={s <= 4 ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"} />
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground">4.8 (2.1K)</span>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
          {ar ? app.app_description_ar : app.app_description}
        </p>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {app.app_keywords.slice(0, 6).map((kw, i) => (
            <span key={i} className="px-2 py-0.5 rounded-full bg-muted/40 text-[9px] text-muted-foreground">
              {kw}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/25">
          <span className="text-[10px] text-muted-foreground">v{app.app_version}</span>
          <span className="text-[10px] text-muted-foreground">•</span>
          <span className="text-[10px] text-muted-foreground">{app.platform.toUpperCase()}</span>
          <span className="text-[10px] text-muted-foreground">•</span>
          <span className="text-[10px] text-muted-foreground">{formatNumber(app.total_downloads)} {ar ? "تنزيل" : "downloads"}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Build Status ───────────────────────────────────────────

function BuildStatusIndicator({ app, ar }: { app: MobileApp; ar: boolean }) {
  const latestBuild = APP_BUILDS.find(b => b.app_id === app.id && b.status === "ready");
  const bsm = buildStatusMeta[app.last_build_status] || buildStatusMeta.pending;

  return (
    <div className="bg-background border border-border/40 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Hammer size={14} strokeWidth={1.75} className="text-blue-500" />
        <h3 className="text-[13px] font-medium text-foreground" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.01em" }}>
          {ar ? "حالة البناء" : "Build Status"}
        </h3>
      </div>

      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 mb-3">
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${bsm.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[12px] font-medium ${bsm.color}`}>
              {ar ? bsm.ar : bsm.en}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">v{app.app_version}</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {ar ? "آخر بناء:" : "Last build:"} {timeAgo(app.last_build_date, ar)}
          </p>
        </div>
      </div>

      {latestBuild && (
        <div className="space-y-2 text-[11px] text-muted-foreground">
          <div className="flex justify-between">
            <span>{ar ? "حجم البناء" : "Build Size"}</span>
            <span className="font-medium text-foreground tabular-nums">
              {latestBuild.build_size ? `${(latestBuild.build_size / 1_000_000).toFixed(1)} MB` : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>{ar ? "المنصة" : "Platform"}</span>
            <span className="font-medium text-foreground">{latestBuild.platform === "both" ? "iOS + Android" : latestBuild.platform.toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span>{ar ? "أنشأه" : "Triggered by"}</span>
            <span className="font-medium text-foreground">{latestBuild.triggered_by}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export default function AppPreview() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [, navigate] = useLocation();
  const [selectedAppId, setSelectedAppId] = useState<string>(MOBILE_APPS[0]?.id || "");

  const app = MOBILE_APPS.find(a => a.id === selectedAppId) || MOBILE_APPS[0];

  if (!app) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <p className="text-[13px] text-muted-foreground">{ar ? "لا توجد تطبيقات" : "No apps found"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-full px-6 md:px-8 py-6 max-w-[1400px] mx-auto space-y-6">

      {/* ─── Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/mobile-apps")}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted/30 transition-colors"
          >
            <ArrowLeft size={16} className="text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-[22px] font-medium text-foreground" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.02em" }}>
              {ar ? "معاينة التطبيق" : "App Preview"}
            </h1>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {ar ? "كيف يبدو تطبيقك على الهاتف" : "How your app looks on mobile"}
            </p>
          </div>
        </div>

        {/* App selector */}
        {MOBILE_APPS.length > 1 && (
          <select
            value={selectedAppId}
            onChange={e => setSelectedAppId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-background border border-border/40 text-[12px] text-foreground"
          >
            {MOBILE_APPS.map(a => (
              <option key={a.id} value={a.id}>{ar ? a.name_ar : a.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* ─── Main Grid ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Phone mockup */}
        <div className="lg:col-span-1 flex flex-col items-center gap-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <IPhoneMockup app={app} />
          </motion.div>

          {/* Quick actions */}
          <div className="w-full max-w-[280px] space-y-2">
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-90 transition-opacity"
            >
              <Hammer size={14} />
              {ar ? "بناء التطبيق" : "Build App"}
            </motion.button>
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 text-[11px] font-medium hover:bg-emerald-500/20 transition-colors"
              >
                <ExternalLink size={12} />
                {ar ? "نشر" : "Publish"}
              </motion.button>
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 text-blue-600 text-[11px] font-medium hover:bg-blue-500/20 transition-colors"
              >
                <Send size={12} />
                {ar ? "إشعار تجريبي" : "Test Push"}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Right: Details */}
        <div className="lg:col-span-2 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <AppStoreListing app={app} ar={ar} />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              <FeatureChecklist app={app} ar={ar} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <BuildStatusIndicator app={app} ar={ar} />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
