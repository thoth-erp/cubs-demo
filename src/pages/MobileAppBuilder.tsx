/**
 * Mobile App Builder — Convert websites into native mobile apps
 * منشئ التطبيق المحمول — تحويل المواقع إلى تطبيقات أصلية
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useLanguage } from "../context/LanguageContext";
import {
  MOBILE_APPS, PUSH_NOTIFICATIONS, APP_FEATURES, APP_ANALYTICS, APP_BUILDS,
  type MobileApp, type PushNotification, type AppFeature, type AppBuild, type AppPlatform, type BuildStatus, type NotificationType, type NotificationStatus,
} from "../lib/mobile-app-data";
import {
  Smartphone, Plus, ExternalLink, Download, Users, Clock, Send,
  Bell, Link2, Store, BarChart3, Hammer, ChevronRight, Globe,
  Shield, Eye, ShoppingCart, Zap, Settings, Star, Crown,
  CheckCircle2, XCircle, AlertCircle, Timer, TrendingUp,
  ArrowUpRight, Wifi, WifiOff, MessageSquare, Gift, CreditCard,
  ScanLine, Moon, Globe2, Mic, ToggleLeft, ToggleRight,
  Smartphone as Phone, AppWindow, Package, Tag,
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(0)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}

function timeAgo(dateStr: string, ar: boolean): string {
  if (!dateStr) return ar ? "—" : "—";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return ar ? "اليوم" : "Today";
  if (diff === 1) return ar ? "أمس" : "Yesterday";
  if (diff < 7) return ar ? `منذ ${diff} أيام` : `${diff} days ago`;
  if (diff < 30) return ar ? `منذ ${Math.floor(diff / 7)} أسابيع` : `${Math.floor(diff / 7)}w ago`;
  return ar ? `منذ ${Math.floor(diff / 30)} شهر` : `${Math.floor(diff / 30)}mo ago`;
}

function formatDate(dateStr: string | null, ar: boolean): string {
  if (!dateStr) return ar ? "لم يتم البناء" : "Never built";
  const d = new Date(dateStr);
  return d.toLocaleDateString(ar ? "ar-EG" : "en-US", { year: "numeric", month: "short", day: "numeric" });
}

function formatTime(dateStr: string | null, ar: boolean): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString(ar ? "ar-EG" : "en-US", { month: "short", day: "numeric" });
}

const platformIcon: Record<string, string> = { ios: "🍎", android: "🤖", both: "📱" };

const statusMeta: Record<string, { en: string; ar: string; color: string; bg: string }> = {
  draft: { en: "Draft", ar: "مسودة", color: "text-muted-foreground", bg: "bg-muted/40" },
  configuring: { en: "Configuring", ar: "إعداد", color: "text-blue-500", bg: "bg-blue-500/10" },
  building: { en: "Building", ar: "جارٍ البناء", color: "text-amber-500", bg: "bg-amber-500/10" },
  review: { en: "In Review", ar: "قيد المراجعة", color: "text-purple-500", bg: "bg-purple-500/10" },
  published: { en: "Published", ar: "منشور", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  rejected: { en: "Rejected", ar: "مرفوض", color: "text-red-500", bg: "bg-red-500/10" },
  paused: { en: "Paused", ar: "متوقف", color: "text-orange-500", bg: "bg-orange-500/10" },
};

const buildStatusMeta: Record<string, { en: string; ar: string; color: string; bg: string }> = {
  pending: { en: "Pending", ar: "قيد الانتظار", color: "text-muted-foreground", bg: "bg-muted/40" },
  building: { en: "Building", ar: "جارٍ البناء", color: "text-blue-500", bg: "bg-blue-500/10" },
  testing: { en: "Testing", ar: "جارٍ الاختبار", color: "text-amber-500", bg: "bg-amber-500/10" },
  ready: { en: "Ready", ar: "جاهز", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  failed: { en: "Failed", ar: "فشل", color: "text-red-500", bg: "bg-red-500/10" },
};

const notifTypeMeta: Record<string, { en: string; ar: string; color: string; bg: string; icon: string }> = {
  promo: { en: "Promo", ar: "عرض", color: "text-purple-500", bg: "bg-purple-500/10", icon: "🎯" },
  order: { en: "Order", ar: "طلب", color: "text-blue-500", bg: "bg-blue-500/10", icon: "📦" },
  abandoned_cart: { en: "Cart Recovery", ar: "استرداد السلة", color: "text-orange-500", bg: "bg-orange-500/10", icon: "🛒" },
  back_in_stock: { en: "Back in Stock", ar: "عاد للمخزون", color: "text-emerald-500", bg: "bg-emerald-500/10", icon: "🔔" },
  price_drop: { en: "Price Drop", ar: "انخفاض السعر", color: "text-amber-500", bg: "bg-amber-500/10", icon: "💰" },
  loyalty: { en: "Loyalty", ar: "ولاء", color: "text-pink-500", bg: "bg-pink-500/10", icon: "🎁" },
  custom: { en: "Custom", ar: "مخصص", color: "text-gray-500", bg: "bg-gray-500/10", icon: "✏️" },
};

const notifStatusMeta: Record<string, { en: string; ar: string; color: string; bg: string }> = {
  draft: { en: "Draft", ar: "مسودة", color: "text-muted-foreground", bg: "bg-muted/40" },
  scheduled: { en: "Scheduled", ar: "مجدول", color: "text-blue-500", bg: "bg-blue-500/10" },
  sent: { en: "Sent", ar: "مرسل", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  failed: { en: "Failed", ar: "فشل", color: "text-red-500", bg: "bg-red-500/10" },
};

const featureCategories = ["all", "core", "engagement", "commerce", "analytics", "integration"] as const;

const featureIcons: Record<string, React.ElementType> = {
  "🔔": Bell, "🔗": Link2, "📡": Wifi, "🎁": Gift, "💬": MessageSquare,
  "📊": BarChart3, "⭐": Star, "❤️": Heart, "📏": ScanLine, "📱": Smartphone,
  "🔐": Shield, "🌐": Globe2, "🌙": Moon, "📷": ScanLine, "💳": CreditCard, "🎤": Mic,
};

function Heart(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>;
}

// ─── Metric Card ────────────────────────────────────────────

function MetricCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="bg-background border border-border/40 rounded-xl px-5 py-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} strokeWidth={1.75} className={color} />
        <p className="text-[10px] text-muted-foreground tracking-wide">{label}</p>
      </div>
      <p className="text-[22px] font-medium text-foreground leading-none tabular-nums" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.02em" }}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

// ─── App Card ───────────────────────────────────────────────

function AppCard({ app, ar, index, onNavigate }: { app: MobileApp; ar: boolean; index: number; onNavigate: (path: string) => void }) {
  const sm = statusMeta[app.status] || statusMeta.draft;
  const bsm = buildStatusMeta[app.last_build_status] || buildStatusMeta.pending;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="bg-background border border-border/40 rounded-xl p-5 hover:border-border/60 transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: app.primary_color + "15", border: `1px solid ${app.primary_color}30` }}>
            {platformIcon[app.platform] || "📱"}
          </div>
          <div>
            <p className="text-[14px] font-medium text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>
              {ar ? app.name_ar : app.name}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${sm.color} ${sm.bg}`}>
                {ar ? sm.ar : sm.en}
              </span>
              <span className="text-[10px] text-muted-foreground">{app.platform.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mb-4 text-[10px] text-muted-foreground">
        <Globe size={10} />
        <span className="truncate">{app.website_url}</span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <p className="text-[16px] font-medium text-foreground tabular-nums">{formatNumber(app.total_downloads)}</p>
          <p className="text-[9px] text-muted-foreground">{ar ? "تنزيلات" : "Downloads"}</p>
        </div>
        <div className="text-center">
          <p className="text-[16px] font-medium text-foreground tabular-nums">{formatNumber(app.active_users)}</p>
          <p className="text-[9px] text-muted-foreground">{ar ? "مستخدمون نشطون" : "Active Users"}</p>
        </div>
        <div className="text-center">
          <p className="text-[16px] font-medium text-foreground tabular-nums">{app.avg_session_duration}m</p>
          <p className="text-[9px] text-muted-foreground">{ar ? "مدة الجلسة" : "Session"}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/25">
        <div className="flex items-center gap-2">
          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${bsm.color} ${bsm.bg}`}>
            {ar ? bsm.ar : bsm.en}
          </span>
          {app.last_build_date && (
            <span className="text-[10px] text-muted-foreground">{formatDate(app.last_build_date, ar)}</span>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground">v{app.app_version}</span>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => onNavigate("/mobile-apps/analytics")} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-primary text-[11px] font-medium hover:bg-primary/20 transition-colors">
          <BarChart3 size={12} />
          {ar ? "التحليلات" : "Analytics"}
        </button>
        <button onClick={() => onNavigate("/mobile-apps/notifications")} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-muted/40 text-foreground text-[11px] font-medium hover:bg-muted/60 transition-colors">
          <Send size={12} />
          {ar ? "إشعار" : "Notify"}
        </button>
        <button onClick={() => onNavigate(`/mobile-apps/config/${app.id}`)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-muted/40 text-foreground text-[11px] font-medium hover:bg-muted/60 transition-colors">
          <Settings size={12} />
          {ar ? "المميزات" : "Features"}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Notification Row ───────────────────────────────────────

function NotificationRow({ notif, ar, index, onNavigate }: { notif: PushNotification; ar: boolean; index: number; onNavigate: (path: string) => void }) {
  const tm = notifTypeMeta[notif.type] || notifTypeMeta.custom;
  const sm = notifStatusMeta[notif.status] || notifStatusMeta.draft;
  const openRate = notif.delivered_count > 0 ? Math.round((notif.opened_count / notif.delivered_count) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/15 transition-colors cursor-pointer"
      onClick={() => onNavigate("/mobile-apps/notifications")}
    >
      <span className="text-lg shrink-0">{tm.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-[13px] font-medium text-foreground truncate">{ar ? notif.title_ar : notif.title}</p>
          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${tm.color} ${tm.bg}`}>
            {ar ? tm.ar : tm.en}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground truncate">{ar ? notif.message_ar : notif.message}</p>
      </div>
      <div className="text-end shrink-0">
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="tabular-nums">{formatNumber(notif.sent_count)} {ar ? "مرسل" : "sent"}</span>
          <span className="tabular-nums">{formatNumber(notif.delivered_count)} {ar ? "وصل" : "del"}</span>
          <span className="tabular-nums font-medium text-foreground">{openRate}%</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${sm.color} ${sm.bg}`}>
            {ar ? sm.ar : sm.en}
          </span>
          <span className="text-[10px] text-muted-foreground">{formatTime(notif.sent_at || notif.scheduled_at, ar)}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Feature Card ───────────────────────────────────────────

function FeatureCard({ feature, ar, index }: { feature: AppFeature; ar: boolean; index: number }) {
  const FeatureIcon = featureIcons[feature.icon] || Smartphone;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className={`bg-background border border-border/40 rounded-xl p-4 transition-all hover:border-border/60 ${!feature.enabled ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-muted/40">
            <span className="text-base">{feature.icon}</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[13px] font-medium text-foreground">{ar ? feature.name_ar : feature.name}</p>
              {feature.premium && (
                <Crown size={10} className="text-amber-500" />
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">{ar ? feature.description_ar : feature.description}</p>
          </div>
        </div>
        <button className={`relative w-9 h-5 rounded-full transition-colors ${feature.enabled ? "bg-primary" : "bg-muted"}`}>
          <motion.div
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
            animate={{ left: feature.enabled ? "18px" : "2px" }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Build Row ──────────────────────────────────────────────

function BuildRow({ build, ar, index }: { build: AppBuild; ar: boolean; index: number }) {
  const bsm = buildStatusMeta[build.status] || buildStatusMeta.pending;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/15 transition-colors"
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-muted/40">
        <Hammer size={14} className="text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-[13px] font-medium text-foreground font-mono">v{build.version}</p>
          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${bsm.color} ${bsm.bg}`}>
            {ar ? bsm.ar : bsm.en}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {platformIcon[build.platform] || "📱"} {build.platform === "both" ? (ar ? "iOS + Android" : "iOS + Android") : build.platform.toUpperCase()}
          {build.build_size ? ` · ${formatBytes(build.build_size)}` : ""}
        </p>
      </div>
      <div className="text-end shrink-0">
        <p className="text-[11px] text-muted-foreground">{formatDate(build.completed_at || build.started_at, ar)}</p>
        <p className="text-[10px] text-muted-foreground/60">{build.triggered_by}</p>
      </div>
    </motion.div>
  );
}

// ─── Quick Action Button ────────────────────────────────────

function QuickActionBtn({ icon: Icon, label, labelAr, color, onClick }: {
  icon: React.ElementType; label: string; labelAr: string; color: string; onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex flex-col items-center gap-2.5 p-4 rounded-xl bg-background border border-border/40 hover:border-border/60 transition-all text-center"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={18} strokeWidth={1.75} />
      </div>
      <span className="text-[11px] font-medium text-foreground">{labelAr}</span>
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export default function MobileAppBuilder() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [, navigate] = useLocation();
  const [featureFilter, setFeatureFilter] = useState<string>("all");

  const stats = useMemo(() => {
    const totalDownloads = MOBILE_APPS.reduce((s, a) => s + a.total_downloads, 0);
    const activeUsers = MOBILE_APPS.reduce((s, a) => s + a.active_users, 0);
    const dau = MOBILE_APPS.reduce((s, a) => s + a.daily_active_users, 0);
    return {
      totalDownloads,
      activeUsers,
      dau,
      pushOpenRate: APP_ANALYTICS.push_open_rate,
      revenue: APP_ANALYTICS.revenue,
    };
  }, []);

  const filteredFeatures = useMemo(() => {
    if (featureFilter === "all") return APP_FEATURES;
    return APP_FEATURES.filter(f => f.category === featureFilter);
  }, [featureFilter]);

  return (
    <div className="min-h-full px-6 md:px-8 py-6 max-w-[1400px] mx-auto space-y-6">

      {/* ─── Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-medium text-foreground" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.02em" }}>
            {ar ? "منشئ التطبيق المحمول" : "Mobile App Builder"}
          </h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {ar ? "تحويل مواقع التجارة الإلكترونية إلى تطبيقات أصلية" : "Convert ecommerce websites into native mobile apps"}
          </p>
        </div>
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/mobile-apps/config/new")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={15} />
          {ar ? "إنشاء تطبيق جديد" : "Create New App"}
        </motion.button>
      </div>

      {/* ─── App Overview Cards ──────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MOBILE_APPS.map((app, i) => (
          <AppCard key={app.id} app={app} ar={ar} index={i} onNavigate={navigate} />
        ))}
      </div>

      {/* ─── Quick Stats Row ─────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard
          icon={Download}
          label={ar ? "إجمالي التنزيلات" : "Total Downloads"}
          value={formatNumber(stats.totalDownloads)}
          color="text-primary"
        />
        <MetricCard
          icon={Users}
          label={ar ? "المستخدمون النشطون" : "Active Users"}
          value={formatNumber(stats.activeUsers)}
          color="text-emerald-500"
        />
        <MetricCard
          icon={TrendingUp}
          label={ar ? "المستخدمون اليوميون" : "Daily Active Users"}
          value={formatNumber(stats.dau)}
          color="text-blue-500"
        />
        <MetricCard
          icon={Bell}
          label={ar ? "معدل فتح الإشعارات" : "Push Open Rate"}
          value={`${stats.pushOpenRate}%`}
          color="text-amber-500"
        />
        <MetricCard
          icon={CreditCard}
          label={ar ? "الإيرادات عبر التطبيق" : "Revenue via App"}
          value={formatNumber(stats.revenue)}
          sub={ar ? "ج.م" : "EGP"}
          color="text-purple-500"
        />
      </div>

      {/* ─── Two-Column Layout: Notifications + Features ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ─── Recent Push Notifications ─────────────────── */}
        <div className="bg-background border border-border/40 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={14} strokeWidth={1.75} className="text-primary" />
              <h3 className="text-[13px] font-medium text-foreground" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.01em" }}>
                {ar ? "الإشعارات الأخيرة" : "Recent Push Notifications"}
              </h3>
            </div>
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/mobile-apps/notifications")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[11px] font-medium hover:bg-primary/20 transition-colors"
            >
              <Send size={11} />
              {ar ? "إرسال إشعار جديد" : "Send New"}
            </motion.button>
          </div>
          <div className="divide-y divide-border/25">
            {PUSH_NOTIFICATIONS.map((notif, i) => (
              <NotificationRow key={notif.id} notif={notif} ar={ar} index={i} onNavigate={navigate} />
            ))}
          </div>
        </div>

        {/* ─── App Features Grid ─────────────────────────── */}
        <div className="bg-background border border-border/40 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap size={14} strokeWidth={1.75} className="text-amber-500" />
                <h3 className="text-[13px] font-medium text-foreground" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.01em" }}>
                  {ar ? "مميزات التطبيق" : "App Features"}
                </h3>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {APP_FEATURES.filter(f => f.enabled).length}/{APP_FEATURES.length} {ar ? "مفعل" : "enabled"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {featureCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFeatureFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-colors ${
                    featureFilter === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {cat === "all" ? (ar ? "الكل" : "All") :
                   cat === "core" ? (ar ? "أساسي" : "Core") :
                   cat === "engagement" ? (ar ? "تفاعل" : "Engagement") :
                   cat === "commerce" ? (ar ? "تجارة" : "Commerce") :
                   cat === "analytics" ? (ar ? "تحليلات" : "Analytics") :
                   (ar ? "تكامل" : "Integration")}
                </button>
              ))}
            </div>
          </div>
          <div className="p-4 grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto">
            {filteredFeatures.map((feature, i) => (
              <FeatureCard key={feature.id} feature={feature} ar={ar} index={i} />
            ))}
          </div>
        </div>
      </div>

      {/* ─── Build History ──────────────────────────────── */}
      <div className="bg-background border border-border/40 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hammer size={14} strokeWidth={1.75} className="text-blue-500" />
            <h3 className="text-[13px] font-medium text-foreground" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.01em" }}>
              {ar ? "سجل البناء" : "Build History"}
            </h3>
          </div>
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[11px] font-medium hover:bg-primary/20 transition-colors"
          >
            <Hammer size={11} />
            {ar ? "بناء جديد" : "Trigger New Build"}
          </motion.button>
        </div>
        <div className="divide-y divide-border/25">
          {APP_BUILDS.map((build, i) => (
            <BuildRow key={build.id} build={build} ar={ar} index={i} />
          ))}
        </div>
      </div>

      {/* ─── Quick Actions ──────────────────────────────── */}
      <div>
        <h3 className="text-[13px] font-medium text-foreground mb-3" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.01em" }}>
          {ar ? "إجراءات سريعة" : "Quick Actions"}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <QuickActionBtn
            icon={Send}
            label="Send Push Notification"
            labelAr={ar ? "إرسال إشعار فوري" : "Send Push Notification"}
            color="bg-primary/10 text-primary"
            onClick={() => navigate("/mobile-apps/notifications")}
          />
          <QuickActionBtn
            icon={Link2}
            label="Configure Deep Links"
            labelAr={ar ? "إعداد الروابط العميقة" : "Configure Deep Links"}
            color="bg-emerald-500/10 text-emerald-500"
            onClick={() => navigate("/mobile-apps/config/app01")}
          />
          <QuickActionBtn
            icon={Store}
            label="Manage App Store"
            labelAr={ar ? "إدارة متجر التطبيقات" : "Manage App Store Listing"}
            color="bg-blue-500/10 text-blue-500"
            onClick={() => navigate("/mobile-apps/config/app01")}
          />
          <QuickActionBtn
            icon={BarChart3}
            label="View Analytics"
            labelAr={ar ? "عرض التحليلات" : "View Analytics"}
            color="bg-purple-500/10 text-purple-500"
            onClick={() => navigate("/mobile-apps/analytics")}
          />
          <QuickActionBtn
            icon={Hammer}
            label="Build App"
            labelAr={ar ? "بناء التطبيق" : "Build App"}
            color="bg-amber-500/10 text-amber-500"
            onClick={() => navigate("/mobile-apps/config/app01")}
          />
        </div>
      </div>
    </div>
  );
}
