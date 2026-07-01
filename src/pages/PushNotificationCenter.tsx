/**
 * Push Notification Center — Create and manage push notifications
 * مركز الإشعارات الفورية — إنشاء وإدارة الإشعارات الفورية
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useLanguage } from "../context/LanguageContext";
import {
  MOBILE_APPS, PUSH_NOTIFICATIONS, NOTIFICATION_SEGMENTS,
  type PushNotification, type NotificationType, type NotificationStatus,
} from "../lib/mobile-app-data";
import {
  Send, Bell, Clock, Users, Eye, MousePointerClick,
  Plus, Filter, ChevronDown, ArrowLeft, Trash2, Copy,
  BarChart3, TrendingUp, AlertCircle,
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function timeAgo(dateStr: string | null, ar: boolean): string {
  if (!dateStr) return ar ? "—" : "—";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return ar ? "اليوم" : "Today";
  if (diff === 1) return ar ? "أمس" : "Yesterday";
  if (diff < 7) return ar ? `منذ ${diff} أيام` : `${diff} days ago`;
  return ar ? `منذ ${Math.floor(diff / 30)} شهر` : `${Math.floor(diff / 30)}mo ago`;
}

const typeMeta: Record<string, { en: string; ar: string; color: string; bg: string; icon: string }> = {
  promo: { en: "Promo", ar: "عرض", color: "text-purple-500", bg: "bg-purple-500/10", icon: "🎯" },
  order: { en: "Order", ar: "طلب", color: "text-blue-500", bg: "bg-blue-500/10", icon: "📦" },
  abandoned_cart: { en: "Cart Recovery", ar: "استرداد السلة", color: "text-orange-500", bg: "bg-orange-500/10", icon: "🛒" },
  back_in_stock: { en: "Back in Stock", ar: "عاد للمخزون", color: "text-emerald-500", bg: "bg-emerald-500/10", icon: "🔔" },
  price_drop: { en: "Price Drop", ar: "انخفاض السعر", color: "text-amber-500", bg: "bg-amber-500/10", icon: "💰" },
  loyalty: { en: "Loyalty", ar: "ولاء", color: "text-pink-500", bg: "bg-pink-500/10", icon: "🎁" },
  custom: { en: "Custom", ar: "مخصص", color: "text-gray-500", bg: "bg-gray-500/10", icon: "✏️" },
};

const statusMeta: Record<string, { en: string; ar: string; color: string; bg: string }> = {
  draft: { en: "Draft", ar: "مسودة", color: "text-muted-foreground", bg: "bg-muted/40" },
  scheduled: { en: "Scheduled", ar: "مجدول", color: "text-blue-500", bg: "bg-blue-500/10" },
  sent: { en: "Sent", ar: "مرسل", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  failed: { en: "Failed", ar: "فشل", color: "text-red-500", bg: "bg-red-500/10" },
};

const audienceLabels: Record<string, { en: string; ar: string }> = {
  all: { en: "All Users", ar: "جميع المستخدمين" },
  ios: { en: "iOS Only", ar: "iOS فقط" },
  android: { en: "Android Only", ar: "Android فقط" },
  segment: { en: "Segment", ar: "شريحة" },
};

// ─── Metric Card ────────────────────────────────────────────

function MetricCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string; color: string;
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
    </div>
  );
}

// ─── Notification Card ──────────────────────────────────────

function NotificationCard({ notif, ar, index }: { notif: PushNotification; ar: boolean; index: number }) {
  const tm = typeMeta[notif.type] || typeMeta.custom;
  const sm = statusMeta[notif.status] || statusMeta.draft;
  const openRate = notif.delivered_count > 0 ? Math.round((notif.opened_count / notif.delivered_count) * 100) : 0;
  const clickRate = notif.opened_count > 0 ? Math.round((notif.clicked_count / notif.opened_count) * 100) : 0;
  const al = audienceLabels[notif.target_audience] || audienceLabels.all;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="bg-background border border-border/40 rounded-xl p-5 hover:border-border/60 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <span className="text-xl shrink-0 mt-0.5">{tm.icon}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <p className="text-[14px] font-medium text-foreground truncate" style={{ fontFamily: "var(--app-font-serif)" }}>
                {ar ? notif.title_ar : notif.title}
              </p>
              <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${tm.color} ${tm.bg}`}>
                {ar ? tm.ar : tm.en}
              </span>
              <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${sm.color} ${sm.bg}`}>
                {ar ? sm.ar : sm.en}
              </span>
            </div>
            <p className="text-[12px] text-muted-foreground line-clamp-2">{ar ? notif.message_ar : notif.message}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-3">
          <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted/30 transition-colors" title="Duplicate">
            <Copy size={12} className="text-muted-foreground" />
          </button>
          <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted/30 transition-colors" title="Delete">
            <Trash2 size={12} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 pt-3 border-t border-border/25">
        <div className="flex items-center gap-1.5">
          <Send size={10} className="text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">{ar ? "مرسل" : "Sent"}</span>
          <span className="text-[11px] font-medium text-foreground tabular-nums">{formatNumber(notif.sent_count)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Eye size={10} className="text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">{ar ? "وصل" : "Delivered"}</span>
          <span className="text-[11px] font-medium text-foreground tabular-nums">{formatNumber(notif.delivered_count)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MousePointerClick size={10} className="text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">{ar ? "فتح" : "Opened"}</span>
          <span className="text-[11px] font-medium text-emerald-500 tabular-nums">{openRate}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MousePointerClick size={10} className="text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">{ar ? "نقر" : "Clicked"}</span>
          <span className="text-[11px] font-medium text-blue-500 tabular-nums">{clickRate}%</span>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <Users size={10} className="text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">{ar ? al.ar : al.en}</span>
        </div>
      </div>

      {/* Schedule info */}
      {(notif.scheduled_at || notif.sent_at) && (
        <div className="flex items-center gap-1.5 mt-2.5">
          <Clock size={10} className="text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">
            {notif.sent_at
              ? `${ar ? "أرسل" : "Sent"} ${timeAgo(notif.sent_at, ar)}`
              : `${ar ? "مجدول" : "Scheduled"} ${timeAgo(notif.scheduled_at, ar)}`
            }
          </span>
        </div>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export default function PushNotificationCenter() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [, navigate] = useLocation();
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const stats = useMemo(() => {
    const total = PUSH_NOTIFICATIONS.length;
    const sent = PUSH_NOTIFICATIONS.filter(n => n.status === "sent");
    const totalSent = sent.reduce((s, n) => s + n.sent_count, 0);
    const totalDelivered = sent.reduce((s, n) => s + n.delivered_count, 0);
    const totalOpened = sent.reduce((s, n) => s + n.opened_count, 0);
    const avgOpenRate = totalDelivered > 0 ? Math.round((totalOpened / totalDelivered) * 100) : 0;
    return { total, totalSent, totalDelivered, totalOpened, avgOpenRate };
  }, []);

  const filtered = useMemo(() => {
    if (typeFilter === "all") return PUSH_NOTIFICATIONS;
    return PUSH_NOTIFICATIONS.filter(n => n.type === typeFilter);
  }, [typeFilter]);

  const typeFilters = ["all", "promo", "order", "abandoned_cart", "price_drop", "loyalty", "custom"] as const;

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
              {ar ? "مركز الإشعارات" : "Push Notifications"}
            </h1>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {ar ? "إنشاء وإدارة الإشعارات الفورية" : "Create and manage push notifications"}
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={15} />
          {ar ? "إشعار جديد" : "New Notification"}
        </motion.button>
      </div>

      {/* ─── Stats ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard icon={Bell} label={ar ? "إجمالي الإشعارات" : "Total Notifications"} value={String(stats.total)} color="text-primary" />
        <MetricCard icon={Send} label={ar ? "مرسل" : "Sent"} value={formatNumber(stats.totalSent)} color="text-emerald-500" />
        <MetricCard icon={Eye} label={ar ? "وصل" : "Delivered"} value={formatNumber(stats.totalDelivered)} color="text-blue-500" />
        <MetricCard icon={MousePointerClick} label={ar ? "تم الفتح" : "Opened"} value={formatNumber(stats.totalOpened)} color="text-amber-500" />
        <MetricCard icon={TrendingUp} label={ar ? "معدل الفتح" : "Avg Open Rate"} value={`${stats.avgOpenRate}%`} color="text-purple-500" />
      </div>

      {/* ─── Filters ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {typeFilters.map(tf => (
          <button
            key={tf}
            onClick={() => setTypeFilter(tf)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
              typeFilter === tf
                ? "bg-primary text-primary-foreground"
                : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
            }`}
          >
            {tf === "all" ? (ar ? "الكل" : "All") :
             typeMeta[tf] ? (ar ? typeMeta[tf].ar : typeMeta[tf].en) : tf}
          </button>
        ))}
      </div>

      {/* ─── Notification List ──────────────────────────── */}
      <div className="space-y-3">
        {filtered.map((notif, i) => (
          <NotificationCard key={notif.id} notif={notif} ar={ar} index={i} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Bell size={24} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-[13px] text-muted-foreground">{ar ? "لا توجد إشعارات" : "No notifications found"}</p>
          </div>
        )}
      </div>

      {/* ─── Segments ────────────────────────────────────── */}
      <div className="bg-background border border-border/40 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border/30 flex items-center gap-2">
          <Users size={14} strokeWidth={1.75} className="text-primary" />
          <h3 className="text-[13px] font-medium text-foreground" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.01em" }}>
            {ar ? "شرائح الجمهور" : "Audience Segments"}
          </h3>
        </div>
        <div className="divide-y divide-border/25">
          {NOTIFICATION_SEGMENTS.map((seg, i) => (
            <div key={seg.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/15 transition-colors">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10">
                <Users size={14} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-foreground">{ar ? seg.name_ar : seg.name}</p>
                <p className="text-[10px] text-muted-foreground">{ar ? seg.description_ar : seg.description}</p>
              </div>
              <span className="text-[12px] font-medium text-foreground tabular-nums">{formatNumber(seg.user_count)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
