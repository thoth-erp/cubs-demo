/**
 * App Analytics — Comprehensive mobile app analytics dashboard
 * تحليلات التطبيق — لوحة تحليلات شاملة للتطبيق المحمول
 */

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import {
  MOBILE_APPS, APP_ANALYTICS, APP_BUILDS,
  type AppAnalytics as AppAnalyticsType,
} from "../lib/mobile-app-data";
import {
  Download, Users, Clock, DollarSign, TrendingUp, Eye,
  BarChart3, Globe, Smartphone, MonitorSmartphone,
  ArrowUp, ArrowDown, ChevronDown,
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

function formatDuration(minutes: number): string {
  if (minutes < 1) return `${Math.round(minutes * 60)}s`;
  return `${minutes.toFixed(1)}m`;
}

const countryFlags: Record<string, string> = {
  "Egypt": "🇪🇬", "Saudi Arabia": "🇸🇦", "UAE": "🇦🇪",
  "Kuwait": "🇰🇼", "Other": "🌍",
};

type Period = "7d" | "30d" | "90d";

const periodLabels: Record<Period, { en: string; ar: string }> = {
  "7d": { en: "Last 7 Days", ar: "آخر ٧ أيام" },
  "30d": { en: "Last 30 Days", ar: "آخر ٣٠ يوم" },
  "90d": { en: "Last 90 Days", ar: "آخر ٩٠ يوم" },
};

// Simulated period multipliers for chart data
const periodMultipliers: Record<Period, number> = { "7d": 0.2, "30d": 1, "90d": 2.8 };

// ─── Metric Card ────────────────────────────────────────────

function MetricCard({ icon: Icon, label, value, sub, color, trend }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string; trend?: number;
}) {
  return (
    <div className="bg-background border border-border/40 rounded-xl px-5 py-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={14} strokeWidth={1.75} className={color} />
          <p className="text-[10px] text-muted-foreground tracking-wide">{label}</p>
        </div>
        {trend !== undefined && (
          <span className={`text-[9px] font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${trend >= 0 ? "text-emerald-600 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10"}`}>
            {trend >= 0 ? <ArrowUp size={8} /> : <ArrowDown size={8} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-[22px] font-medium text-foreground leading-none tabular-nums" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.02em" }}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

// ─── Downloads Bar Chart ────────────────────────────────────

function DownloadsChart({ ar, period }: { ar: boolean; period: Period }) {
  const mult = periodMultipliers[period];
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const baseDownloads = Math.round(APP_ANALYTICS.downloads * mult / days);

  const bars = useMemo(() => {
    const result: { label: string; value: number; height: number }[] = [];
    const numBars = period === "7d" ? 7 : period === "30d" ? 30 : 12;
    const maxVal = baseDownloads * 1.4;

    for (let i = 0; i < numBars; i++) {
      const variation = 0.6 + Math.sin(i * 0.8) * 0.3 + Math.random() * 0.2;
      const value = Math.round(baseDownloads * variation);
      const height = (value / maxVal) * 100;
      let label: string;
      if (period === "7d") {
        const d = new Date(Date.now() - (numBars - 1 - i) * 86400000);
        label = d.toLocaleDateString(ar ? "ar-EG" : "en-US", { weekday: "short" });
      } else if (period === "30d") {
        label = `${i + 1}`;
      } else {
        const d = new Date(Date.now() - (numBars - 1 - i) * 30 * 86400000);
        label = d.toLocaleDateString(ar ? "ar-EG" : "en-US", { month: "short" });
      }
      result.push({ label, value, height });
    }
    return result;
  }, [period, baseDownloads, ar]);

  const maxVal = Math.max(...bars.map(b => b.value));

  return (
    <div className="bg-background border border-border/40 rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <BarChart3 size={14} strokeWidth={1.75} className="text-primary" />
          <h3 className="text-[13px] font-medium text-foreground" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.01em" }}>
            {ar ? "趋势 التنزيلات" : "Downloads Trend"}
          </h3>
        </div>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {formatNumber(Math.round(APP_ANALYTICS.downloads * mult))} {ar ? "إجمالي" : "total"}
        </span>
      </div>
      <div className="flex items-end gap-[3px] h-[140px]">
        {bars.map((bar, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-popover border border-border text-[10px] font-medium text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-md">
              {formatNumber(bar.value)}
            </div>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${bar.height}%` }}
              transition={{ delay: i * 0.02, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-full rounded-t-sm bg-primary/70 hover:bg-primary transition-colors"
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2">
        {bars.filter((_, i) => {
          if (period === "7d") return true;
          if (period === "30d") return i % 5 === 0 || i === bars.length - 1;
          return true;
        }).map((bar, i) => (
          <span key={i} className="text-[8px] text-muted-foreground/60 tabular-nums">{bar.label}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Device Donut Chart ─────────────────────────────────────

function DeviceDonut({ data, ar }: { data: { ios: number; android: number }; ar: boolean }) {
  const total = data.ios + data.android;
  if (total === 0) return null;

  const iosPct = Math.round((data.ios / total) * 100);
  const androidPct = 100 - iosPct;

  const iosDeg = (iosPct / 100) * 360;
  const gradient = `conic-gradient(#3B82F6 0deg ${iosDeg}deg, #10B981 ${iosDeg}deg 360deg)`;

  return (
    <div className="bg-background border border-border/40 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-5">
        <MonitorSmartphone size={14} strokeWidth={1.75} className="text-blue-500" />
        <h3 className="text-[13px] font-medium text-foreground" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.01em" }}>
          {ar ? "توزيع الأجهزة" : "Device Breakdown"}
        </h3>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative w-[120px] h-[120px] shrink-0">
          <div className="w-full h-full rounded-full" style={{ background: gradient }} />
          <div className="absolute inset-[22px] rounded-full bg-background flex items-center justify-center">
            <span className="text-[18px] font-medium text-foreground tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>
              {formatNumber(total)}
            </span>
          </div>
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
            <div className="flex-1 flex items-center justify-between">
              <span className="text-[12px] text-foreground">🍎 iOS</span>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-medium text-foreground tabular-nums">{iosPct}%</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">{formatNumber(data.ios)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
            <div className="flex-1 flex items-center justify-between">
              <span className="text-[12px] text-foreground">🤖 Android</span>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-medium text-foreground tabular-nums">{androidPct}%</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">{formatNumber(data.android)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Geographic Breakdown ───────────────────────────────────

function GeoBreakdown({ data, ar }: { data: AppAnalyticsType["geo_breakdown"]; ar: boolean }) {
  const maxUsers = Math.max(...data.map(d => d.users));

  return (
    <div className="bg-background border border-border/40 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-5">
        <Globe size={14} strokeWidth={1.75} className="text-emerald-500" />
        <h3 className="text-[13px] font-medium text-foreground" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.01em" }}>
          {ar ? "التوزيع الجغرافي" : "Geographic Breakdown"}
        </h3>
      </div>
      <div className="space-y-3">
        {data.map((item, i) => {
          const pct = Math.round((item.users / maxUsers) * 100);
          const flag = countryFlags[item.country] || "🌍";
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="text-lg shrink-0">{flag}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] text-foreground">{ar ? item.country_ar : item.country}</span>
                  <span className="text-[11px] font-medium text-foreground tabular-nums">{formatNumber(item.users)}</span>
                </div>
                <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full bg-primary/60"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Top Screens Table ──────────────────────────────────────

function TopScreensTable({ data, ar }: { data: AppAnalyticsType["top_screens"]; ar: boolean }) {
  const maxViews = Math.max(...data.map(d => d.views));

  return (
    <div className="bg-background border border-border/40 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border/30 flex items-center gap-2">
        <Eye size={14} strokeWidth={1.75} className="text-purple-500" />
        <h3 className="text-[13px] font-medium text-foreground" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.01em" }}>
          {ar ? "أكثر الشاشات مشاهدة" : "Top Screens"}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/25">
              <th className="text-left px-5 py-2.5 text-[10px] font-medium text-muted-foreground tracking-wide uppercase">
                {ar ? "الشاشة" : "Screen"}
              </th>
              <th className="text-right px-5 py-2.5 text-[10px] font-medium text-muted-foreground tracking-wide uppercase">
                {ar ? "المشاهدات" : "Views"}
              </th>
              <th className="text-right px-5 py-2.5 text-[10px] font-medium text-muted-foreground tracking-wide uppercase">
                {ar ? "متوسط الوقت" : "Avg Time"}
              </th>
              <th className="text-right px-5 py-2.5 text-[10px] font-medium text-muted-foreground tracking-wide uppercase w-[140px]">
                {ar ? "النسبة" : "Share"}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {data.map((screen, i) => {
              const sharePct = Math.round((screen.views / maxViews) * 100);
              return (
                <tr key={i} className="hover:bg-muted/15 transition-colors">
                  <td className="px-5 py-3">
                    <span className="text-[12px] font-medium text-foreground">{ar ? screen.screen_ar : screen.screen}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-[12px] text-foreground tabular-nums">{formatNumber(screen.views)}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-[12px] text-muted-foreground tabular-nums">{formatDuration(screen.avg_time)}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-[80px] h-1.5 bg-muted/50 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${sharePct}%` }}
                          transition={{ delay: i * 0.06, duration: 0.4 }}
                          className="h-full rounded-full bg-primary/60"
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">{sharePct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Revenue Card ───────────────────────────────────────────

function RevenueCard({ data, ar, period }: { data: AppAnalyticsType; ar: boolean; period: Period }) {
  const mult = periodMultipliers[period];
  const revenue = Math.round(data.revenue * mult);
  const conversionRate = data.conversion_rate;
  const pushOpenRate = data.push_open_rate;

  return (
    <div className="bg-background border border-border/40 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-5">
        <DollarSign size={14} strokeWidth={1.75} className="text-amber-500" />
        <h3 className="text-[13px] font-medium text-foreground" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.01em" }}>
          {ar ? "إيرادات التطبيق" : "Revenue Metrics"}
        </h3>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
          <span className="text-[12px] text-muted-foreground">{ar ? "إجمالي الإيرادات" : "Total Revenue"}</span>
          <span className="text-[16px] font-medium text-foreground tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>
            {formatCurrency(revenue)} <span className="text-[11px] text-muted-foreground">EGP</span>
          </span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
          <span className="text-[12px] text-muted-foreground">{ar ? "معدل التحويل" : "Conversion Rate"}</span>
          <span className="text-[16px] font-medium text-emerald-500 tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>
            {conversionRate}%
          </span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
          <span className="text-[12px] text-muted-foreground">{ar ? "معدل فتح الإشعارات" : "Push Open Rate"}</span>
          <span className="text-[16px] font-medium text-blue-500 tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>
            {pushOpenRate}%
          </span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
          <span className="text-[12px] text-muted-foreground">{ar ? "إجمالي المشاهدات" : "Screen Views"}</span>
          <span className="text-[16px] font-medium text-foreground tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>
            {formatNumber(Math.round(data.screen_views * mult))}
          </span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export default function AppAnalytics() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [period, setPeriod] = useState<Period>("30d");
  const [periodOpen, setPeriodOpen] = useState(false);

  const data = APP_ANALYTICS;

  const stats = useMemo(() => {
    const mult = periodMultipliers[period];
    return {
      downloads: Math.round(data.downloads * mult),
      activeUsers: data.active_users,
      sessions: Math.round(data.sessions * mult),
      avgSessionDuration: data.avg_session_duration,
      revenue: Math.round(data.revenue * mult),
      conversionRate: data.conversion_rate,
      pushOpenRate: data.push_open_rate,
    };
  }, [period, data]);

  return (
    <div className="min-h-full px-6 md:px-8 py-6 max-w-[1400px] mx-auto space-y-6">

      {/* ─── Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-medium text-foreground" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.02em" }}>
            {ar ? "تحليلات التطبيق" : "App Analytics"}
          </h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {ar ? "نظرة عامة على أداء التطبيق المحمول" : "Mobile app performance overview"}
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setPeriodOpen(!periodOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background border border-border/40 text-[12px] font-medium text-foreground hover:border-border/60 transition-colors"
          >
            {periodLabels[period][ar ? "ar" : "en"]}
            <ChevronDown size={13} className={`transition-transform ${periodOpen ? "rotate-180" : ""}`} />
          </button>
          {periodOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute end-0 top-full mt-1 bg-background border border-border/40 rounded-xl shadow-lg z-20 overflow-hidden min-w-[140px]"
            >
              {(["7d", "30d", "90d"] as Period[]).map(p => (
                <button
                  key={p}
                  onClick={() => { setPeriod(p); setPeriodOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-[12px] transition-colors ${
                    period === p ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted/30"
                  }`}
                >
                  {periodLabels[p][ar ? "ar" : "en"]}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* ─── KPI Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <MetricCard
          icon={Download}
          label={ar ? "إجمالي التنزيلات" : "Total Downloads"}
          value={formatNumber(stats.downloads)}
          color="text-primary"
          trend={12}
        />
        <MetricCard
          icon={Users}
          label={ar ? "المستخدمون النشطون" : "Active Users"}
          value={formatNumber(stats.activeUsers)}
          color="text-emerald-500"
          trend={8}
        />
        <MetricCard
          icon={Eye}
          label={ar ? "الجلسات" : "Sessions"}
          value={formatNumber(stats.sessions)}
          color="text-blue-500"
          trend={15}
        />
        <MetricCard
          icon={Clock}
          label={ar ? "متوسط مدة الجلسة" : "Avg Session Duration"}
          value={formatDuration(stats.avgSessionDuration)}
          color="text-amber-500"
          trend={-3}
        />
        <MetricCard
          icon={DollarSign}
          label={ar ? "الإيرادات" : "Revenue"}
          value={`${formatCurrency(stats.revenue)}`}
          sub="EGP"
          color="text-purple-500"
          trend={22}
        />
        <MetricCard
          icon={TrendingUp}
          label={ar ? "معدل التحويل" : "Conversion Rate"}
          value={`${stats.conversionRate}%`}
          color="text-emerald-500"
          trend={5}
        />
        <MetricCard
          icon={Smartphone}
          label={ar ? "معدل فتح الإشعارات" : "Push Open Rate"}
          value={`${stats.pushOpenRate}%`}
          color="text-pink-500"
          trend={-2}
        />
      </div>

      {/* ─── Charts Row ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <DownloadsChart ar={ar} period={period} />
        </div>
        <DeviceDonut data={data.device_breakdown} ar={ar} />
      </div>

      {/* ─── Geo + Revenue ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GeoBreakdown data={data.geo_breakdown} ar={ar} />
        <RevenueCard data={data} ar={ar} period={period} />
      </div>

      {/* ─── Top Screens ─────────────────────────────────── */}
      <TopScreensTable data={data.top_screens} ar={ar} />
    </div>
  );
}
