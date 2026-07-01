/**
 * Loyalty Dashboard — Program overview, metrics, top members
 * لوحة الولاء — نظرة عامة على البرنامج والمقاييس وأبرز الأعضاء
 */

import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "../context/LanguageContext";
import {
  loadLoyaltyMembers, loadLoyaltyTransactions, computeLoyaltyStats,
  TIER_META, TIER_ORDER, TX_TYPE_META, fmtPts, fmtCurrency,
  type LoyaltyMemberDemo, type LoyaltyTransactionDemo, type LoyaltyTierSlug,
} from "../data/loyalty";
import {
  Users, Award, TrendingUp, TrendingDown, Gift, Star,
  ChevronRight, ShoppingBag, Store, ArrowUpRight,
  Crown, Sparkles, BarChart3, Clock, Wallet,
  Ticket, Megaphone,
} from "lucide-react";

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

function timeAgo(dateStr: string, ar: boolean): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return ar ? "اليوم" : "Today";
  if (diff === 1) return ar ? "أمس" : "Yesterday";
  if (diff < 7) return ar ? `منذ ${diff} أيام` : `${diff} days ago`;
  if (diff < 30) return ar ? `منذ ${Math.floor(diff / 7)} أسبوع` : `${Math.floor(diff / 7)}w ago`;
  return ar ? `منذ ${Math.floor(diff / 30)} شهر` : `${Math.floor(diff / 30)}mo ago`;
}

// ─── Metric card ──────────────────────────────────────────

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

// ─── Tier distribution bar ────────────────────────────────

function TierBar({ dist, total, lang }: { dist: Record<LoyaltyTierSlug, number>; total: number; lang: "en" | "ar" }) {
  const ar = lang === "ar";
  if (total === 0) return null;
  return (
    <div className="bg-background border border-border/40 rounded-xl p-5">
      <h3 className="text-[13px] font-medium text-foreground mb-4" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.01em" }}>
        {ar ? "توزيع المستويات" : "Tier Distribution"}
      </h3>
      <div className="flex rounded-full h-3 overflow-hidden gap-0.5">
        {TIER_ORDER.map(slug => {
          const pct = (dist[slug] / total) * 100;
          if (pct === 0) return null;
          return (
            <div key={slug} className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: TIER_META[slug].color }} />
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3">
        {TIER_ORDER.map(slug => (
          <div key={slug} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TIER_META[slug].color }} />
            <span className="text-[11px] text-muted-foreground">{ar ? TIER_META[slug].ar : TIER_META[slug].en}</span>
            <span className="text-[11px] font-medium text-foreground tabular-nums">{dist[slug]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Top members table ────────────────────────────────────

function TopMembers({ members, lang, onNavigate }: {
  members: LoyaltyMemberDemo[]; lang: "en" | "ar"; onNavigate: (id: string) => void;
}) {
  const ar = lang === "ar";
  const top = [...members].sort((a, b) => b.currentPoints - a.currentPoints).slice(0, 5);

  return (
    <div className="bg-background border border-border/40 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between">
        <h3 className="text-[13px] font-medium text-foreground" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.01em" }}>
          {ar ? "أبرز الأعضاء" : "Top Members"}
        </h3>
        <Crown size={14} strokeWidth={1.75} className="text-yellow-500" />
      </div>
      <div className="divide-y divide-border/25">
        {top.map((m, i) => {
          const tm = TIER_META[m.tier];
          return (
            <div key={m.id} onClick={() => onNavigate(m.id)} className="flex items-center gap-3.5 px-5 py-3 hover:bg-muted/20 transition-colors cursor-pointer group">
              <span className="text-[11px] text-muted-foreground/50 tabular-nums w-4 shrink-0">{i + 1}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-semibold text-white shrink-0" style={{ backgroundColor: m.avatarColor }}>
                {initials(ar ? m.nameAr : m.nameEn)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {ar ? m.nameAr : m.nameEn}
                </p>
                <p className="text-[10px] text-muted-foreground">{m.phone}</p>
              </div>
              <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${tm.pill}`}>
                {ar ? tm.ar : tm.en}
              </span>
              <div className="text-end shrink-0">
                <p className="text-[13px] font-medium text-foreground tabular-nums">{fmtPts(m.currentPoints)}</p>
                <p className="text-[10px] text-muted-foreground">{ar ? "نقطة" : "pts"}</p>
              </div>
              <ChevronRight size={14} strokeWidth={1.75} className="text-muted-foreground/30 group-hover:text-primary/50 transition-colors shrink-0" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Recent activity ──────────────────────────────────────

function RecentActivity({ transactions, members, lang }: {
  transactions: LoyaltyTransactionDemo[]; members: LoyaltyMemberDemo[]; lang: "en" | "ar";
}) {
  const ar = lang === "ar";
  const memberMap = useMemo(() => {
    const map = new Map<string, LoyaltyMemberDemo>();
    members.forEach(m => map.set(m.id, m));
    return map;
  }, [members]);

  const recent = [...transactions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);

  return (
    <div className="bg-background border border-border/40 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between">
        <h3 className="text-[13px] font-medium text-foreground" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.01em" }}>
          {ar ? "آخر النشاطات" : "Recent Activity"}
        </h3>
        <Clock size={14} strokeWidth={1.75} className="text-muted-foreground" />
      </div>
      <div className="divide-y divide-border/25">
        {recent.map(tx => {
          const member = memberMap.get(tx.memberId);
          const meta = TX_TYPE_META[tx.type];
          const isPositive = tx.points > 0;
          return (
            <div key={tx.id} className="flex items-center gap-3 px-5 py-3">
              <div className={`w-2 h-2 rounded-full shrink-0 ${meta.dot}`} />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-foreground truncate">
                  <span className="font-medium">{ar ? (member?.nameAr || "—") : (member?.nameEn || "—")}</span>
                  {" · "}
                  <span className="text-muted-foreground">{ar ? meta.ar : meta.en}</span>
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {tx.orderId && <span>{tx.orderId} · </span>}
                  {tx.staffName && <span>{tx.staffName} · </span>}
                  {timeAgo(tx.createdAt, ar)}
                </p>
              </div>
              <span className={`text-[13px] font-medium tabular-nums ${isPositive ? "text-emerald-600" : "text-foreground"}`}>
                {isPositive ? "+" : ""}{fmtPts(tx.points)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Quick actions ────────────────────────────────────────

function QuickActions({ lang, onNavigate }: { lang: "en" | "ar"; onNavigate: (path: string) => void }) {
  const ar = lang === "ar";
  const actions = [
    { icon: Users,       labelEn: "Staff Lookup",   labelAr: "بحث العملاء",   path: "/loyalty/lookup",       color: "text-primary" },
    { icon: BarChart3,   labelEn: "Transactions",   labelAr: "المعاملات",       path: "/loyalty/transactions", color: "text-emerald-600" },
    { icon: Ticket,      labelEn: "Redemptions",     labelAr: "الاستبدال",       path: "/loyalty/redemptions",  color: "text-amber-500" },
    { icon: Megaphone,   labelEn: "Campaigns",       labelAr: "الحملات",         path: "/loyalty/campaigns",    color: "text-violet-500" },
    { icon: Star,        labelEn: "Rules",           labelAr: "قواعد النقاط",   path: "/loyalty/rules",        color: "text-rose-500" },
    { icon: ShoppingBag, labelEn: "Shopify",         labelAr: "شوبيفاي",        path: "/loyalty/shopify",      color: "text-indigo-500" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {actions.map(a => (
        <button key={a.path} onClick={() => onNavigate(a.path)}
          className="bg-background border border-border/40 rounded-xl px-4 py-4 flex items-center gap-3 hover:border-border/70 hover:shadow-sm transition-all group text-start">
          <div className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-primary/8 transition-colors">
            <a.icon size={16} strokeWidth={1.75} className={`${a.color} group-hover:scale-110 transition-transform`} />
          </div>
          <div>
            <p className="text-[13px] font-medium text-foreground group-hover:text-primary transition-colors">{ar ? a.labelAr : a.labelEn}</p>
          </div>
          <ArrowUpRight size={12} className="text-muted-foreground/30 group-hover:text-primary/50 ms-auto transition-colors" />
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Main dashboard
// ═══════════════════════════════════════════════════════════

export default function Loyalty() {
  const { lang } = useLanguage();
  const [, navigate] = useLocation();
  const ar = lang === "ar";

  const [members] = useState(loadLoyaltyMembers);
  const [transactions] = useState(loadLoyaltyTransactions);
  const stats = useMemo(() => computeLoyaltyStats(members, transactions), [members, transactions]);

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="border-b border-border/40 px-8 md:px-10 py-8" style={{ background: "linear-gradient(160deg, hsl(var(--muted)/0.3) 0%, hsl(var(--background)) 60%)" }}>
        <div className="max-w-[1100px]">
          <p className="text-[11px] text-muted-foreground/60 tracking-[0.08em] uppercase mb-2">
            {ar ? "برنامج الولاء" : "Loyalty Program"}
          </p>
          <h1 className="text-[26px] font-medium text-foreground leading-tight mb-6" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.025em" }}>
            {ar ? "لوحة الولاء" : "Loyalty Dashboard"}
          </h1>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <MetricCard icon={Users} label={ar ? "إجمالي الأعضاء" : "Total Members"} value={String(stats.totalMembers)} sub={`${stats.activeMembers} ${ar ? "نشط" : "active"}`} color="text-primary" />
            <MetricCard icon={TrendingUp} label={ar ? "نقاط صادرة" : "Points Issued"} value={fmtPts(stats.totalIssued)} color="text-emerald-600" />
            <MetricCard icon={Gift} label={ar ? "نقاط مستبدلة" : "Points Redeemed"} value={fmtPts(stats.totalRedeemed)} sub={`${stats.redemptionRate}% ${ar ? "معدل الاستبدال" : "redemption rate"}`} color="text-primary" />
            <MetricCard icon={Wallet} label={ar ? "نقاط معلّقة" : "Outstanding"} value={fmtPts(stats.outstanding)} color="text-amber-500" />
            <MetricCard icon={ShoppingBag} label={ar ? "أونلاين" : "Online Tx"} value={String(stats.onlineTx)} color="text-violet-500" />
            <MetricCard icon={Store} label={ar ? "المتجر" : "Store Tx"} value={String(stats.storeTx)} color="text-cyan-600" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 md:px-10 py-6 max-w-[1100px] space-y-6">
        {/* Quick actions */}
        <QuickActions lang={lang} onNavigate={navigate} />

        {/* Tier distribution */}
        <TierBar dist={stats.tierDist} total={stats.totalMembers} lang={lang} />

        {/* Two-column: Top members + Recent activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <TopMembers members={members} lang={lang} onNavigate={(id) => navigate(`/loyalty/members/${id}`)} />
          <RecentActivity transactions={transactions} members={members} lang={lang} />
        </div>
      </div>
    </div>
  );
}
