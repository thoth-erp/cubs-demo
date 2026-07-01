/**
 * Loyalty Analytics — Program performance, cohorts, redemption rates
 * تحليلات الولاء — أداء البرنامج، الفئات، معدلات الاستبدال
 *
 * All numbers derived from demo data — no fake AI.
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
  BarChart3, TrendingUp, TrendingDown, Users, Gift,
  ArrowUp, ArrowDown, ChevronRight, ShoppingBag, Store,
  Award, Wallet, Clock, Repeat, Sparkles, PieChart,
  ArrowUpRight, Target, Zap, Calendar, Star,
} from "lucide-react";

// ─── Derived analytics from real data ────────────────────

function computeAnalytics(members: LoyaltyMemberDemo[], transactions: LoyaltyTransactionDemo[]) {
  const stats = computeLoyaltyStats(members, transactions);

  // ── Channel split ──
  const earnTxs = transactions.filter(t => t.type === "earned");
  const shopifyEarn = earnTxs.filter(t => t.source === "shopify");
  const storeEarn = earnTxs.filter(t => t.source === "store");
  const shopifyPts = shopifyEarn.reduce((s, t) => s + t.points, 0);
  const storePts = storeEarn.reduce((s, t) => s + t.points, 0);
  const totalEarnPts = shopifyPts + storePts;
  const shopifyPct = totalEarnPts > 0 ? Math.round((shopifyPts / totalEarnPts) * 100) : 0;
  const storePct = 100 - shopifyPct;

  // ── Revenue from top-up ──
  const totalRevenue = earnTxs.reduce((s, t) => s + (t.orderAmount || 0), 0);

  // ── Avg order value ──
  const ordersWithAmount = earnTxs.filter(t => t.orderAmount && t.orderAmount > 0);
  const aov = ordersWithAmount.length > 0 ? totalRevenue / ordersWithAmount.length : 0;

  // ── Avg points per member ──
  const avgLifetime = members.length > 0 ? Math.round(members.reduce((s, m) => s + m.lifetimePoints, 0) / members.length) : 0;
  const avgCurrent = members.length > 0 ? Math.round(members.reduce((s, m) => s + m.currentPoints, 0) / members.length) : 0;

  // ── Points liability (outstanding points × redemption value) ──
  const pointsLiability = stats.outstanding / 100; // 100pts = 1 EGP

  // ── Repeat purchase (members with >1 order) ──
  const repeatMembers = members.filter(m => m.orderCount > 1).length;
  const repeatRate = members.length > 0 ? Math.round((repeatMembers / members.length) * 100) : 0;

  // ── Tier distribution ──
  const tierDist = TIER_ORDER.map(slug => ({
    slug,
    count: stats.tierDist[slug],
    pct: members.length > 0 ? Math.round((stats.tierDist[slug] / members.length) * 100) : 0,
  }));

  // ── Monthly trend (simulated from transaction dates) ──
  const monthMap: Record<string, { earned: number; redeemed: number; members: Set<string> }> = {};
  transactions.forEach(t => {
    const key = t.createdAt.substring(0, 7); // "2026-06"
    if (!monthMap[key]) monthMap[key] = { earned: 0, redeemed: 0, members: new Set() };
    if (t.type === "earned" || t.type === "bonus") monthMap[key].earned += t.points;
    if (t.type === "redeemed") monthMap[key].redeemed += Math.abs(t.points);
    monthMap[key].members.add(t.memberId);
  });
  const monthlyTrend = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, earned: data.earned, redeemed: data.redeemed, activeMembers: data.members.size }));

  // ── Top earners ──
  const topEarners = [...members].sort((a, b) => b.lifetimePoints - a.lifetimePoints).slice(0, 5);

  // ── Top redeemers ──
  const topRedeemers = [...members].sort((a, b) => b.redeemedPoints - a.redeemedPoints).slice(0, 5);

  // ── Category breakdown from member favorites ──
  const catMap: Record<string, number> = {};
  members.forEach(m => m.favoriteCategories.forEach(c => { catMap[c] = (catMap[c] || 0) + 1; }));
  const categories = Object.entries(catMap).sort(([, a], [, b]) => b - a).slice(0, 6)
    .map(([name, count]) => ({ name, count, pct: Math.round((count / members.length) * 100) }));

  return {
    ...stats,
    shopifyPct, storePct, shopifyPts, storePts,
    totalRevenue, aov, avgLifetime, avgCurrent,
    pointsLiability, repeatRate, repeatMembers,
    tierDist, monthlyTrend, topEarners, topRedeemers, categories,
  };
}

// ─── Simple bar component ────────────────────────────────

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════

export default function LoyaltyAnalyticsPage() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [, navigate] = useLocation();

  const members = loadLoyaltyMembers();
  const transactions = loadLoyaltyTransactions();
  const a = useMemo(() => computeAnalytics(members, transactions), [members, transactions]);

  const maxLifetime = Math.max(...members.map(m => m.lifetimePoints));

  return (
    <div className="min-h-full py-8 px-7 md:px-10 max-w-[1060px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="text-[11px] text-muted-foreground/60 tracking-[0.08em] uppercase mb-2">{ar ? "برنامج الولاء" : "Loyalty Program"}</p>
        <h1 className="text-[26px] font-medium text-foreground leading-tight" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.025em" }}>
          {ar ? "التحليلات" : "Analytics"}
        </h1>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { value: fmtPts(a.totalIssued), label: ar ? "إجمالي النقاط المصدرة" : "Total Points Issued", icon: Award, color: "text-primary", sub: `${a.totalMembers} ${ar ? "عضو" : "members"}` },
          { value: `${a.redemptionRate}%`, label: ar ? "معدل الاستبدال" : "Redemption Rate", icon: Target, color: "text-emerald-600", sub: `${fmtPts(a.totalRedeemed)} ${ar ? "مستبدلة" : "redeemed"}` },
          { value: fmtCurrency(a.pointsLiability), label: ar ? "الالتزامات المستحقة" : "Points Liability", icon: Wallet, color: "text-amber-500", sub: `${fmtPts(a.outstanding)} ${ar ? "نقطة معلقة" : "outstanding pts"}` },
          { value: `${a.repeatRate}%`, label: ar ? "تكرار الشراء" : "Repeat Purchase", icon: Repeat, color: "text-violet-500", sub: `${a.repeatMembers}/${a.totalMembers} ${ar ? "عضو" : "members"}` },
        ].map((kpi, i) => (
          <div key={i} className="border border-border/40 rounded-xl p-4 bg-background">
            <kpi.icon size={14} className={`${kpi.color} mb-2`} />
            <p className={`text-[22px] font-medium tabular-nums ${kpi.color}`} style={{ fontFamily: "var(--app-font-serif)" }}>{kpi.value}</p>
            <p className="text-[10.5px] text-muted-foreground mt-0.5">{kpi.label}</p>
            <p className="text-[9.5px] text-muted-foreground/60 mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Revenue + Channel + AOV ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {/* Total tracked revenue */}
        <div className="border border-border/40 rounded-xl p-5 bg-background">
          <h3 className="text-[12px] font-medium text-muted-foreground mb-3">{ar ? "إيرادات مرتبطة بالولاء" : "Loyalty-Linked Revenue"}</h3>
          <p className="text-[26px] font-medium text-foreground tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>{fmtCurrency(a.totalRevenue)}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{ar ? "من" : "From"} {transactions.filter(t => t.orderAmount).length} {ar ? "طلب مسجل" : "tracked orders"}</p>
        </div>

        {/* Channel split */}
        <div className="border border-border/40 rounded-xl p-5 bg-background">
          <h3 className="text-[12px] font-medium text-muted-foreground mb-3">{ar ? "توزيع القنوات" : "Channel Split"}</h3>
          <div className="flex gap-4 mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <ShoppingBag size={10} className="text-violet-500" />
                <span className="text-[10px] text-muted-foreground">{ar ? "أونلاين" : "Online"}</span>
              </div>
              <p className="text-[18px] font-medium tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>{a.shopifyPct}%</p>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <Store size={10} className="text-amber-500" />
                <span className="text-[10px] text-muted-foreground">{ar ? "المتجر" : "In-Store"}</span>
              </div>
              <p className="text-[18px] font-medium tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>{a.storePct}%</p>
            </div>
          </div>
          <div className="h-2.5 bg-muted/30 rounded-full overflow-hidden flex">
            <div className="h-full bg-violet-500 rounded-l-full" style={{ width: `${a.shopifyPct}%` }} />
            <div className="h-full bg-amber-400 rounded-r-full" style={{ width: `${a.storePct}%` }} />
          </div>
        </div>

        {/* AOV */}
        <div className="border border-border/40 rounded-xl p-5 bg-background">
          <h3 className="text-[12px] font-medium text-muted-foreground mb-3">{ar ? "متوسط قيمة الطلب" : "Average Order Value"}</h3>
          <p className="text-[26px] font-medium text-foreground tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>{fmtCurrency(Math.round(a.aov))}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{ar ? "متوسط نقاط لكل عضو:" : "Avg pts/member:"} {fmtPts(a.avgLifetime)}</p>
        </div>
      </div>

      {/* ── Tier Distribution + Monthly Trend ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {/* Tier distribution */}
        <div className="border border-border/40 rounded-xl p-5 bg-background">
          <h3 className="text-[13px] font-medium text-foreground mb-4" style={{ fontFamily: "var(--app-font-serif)" }}>
            {ar ? "توزيع المستويات" : "Tier Distribution"}
          </h3>
          <div className="space-y-3">
            {a.tierDist.map(td => {
              const tm = TIER_META[td.slug];
              return (
                <div key={td.slug}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tm.pill}`}>{ar ? tm.ar : tm.en}</span>
                      <span className="text-[11px] font-medium tabular-nums">{td.count}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{td.pct}%</span>
                  </div>
                  <div className="h-2 bg-muted/25 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${td.pct}%`, background: tm.color }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-border/20 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{ar ? "متوسط الإنفاق لكل عضو" : "Avg spend/member"}</span>
            <span className="font-medium text-foreground tabular-nums">
              {fmtCurrency(Math.round(members.reduce((s, m) => s + m.totalSpend, 0) / members.length))}
            </span>
          </div>
        </div>

        {/* Monthly trend */}
        <div className="border border-border/40 rounded-xl p-5 bg-background">
          <h3 className="text-[13px] font-medium text-foreground mb-4" style={{ fontFamily: "var(--app-font-serif)" }}>
            {ar ? "الاتجاه الشهري" : "Monthly Trend"}
          </h3>
          {a.monthlyTrend.length === 0 ? (
            <p className="text-[12px] text-muted-foreground py-6 text-center">{ar ? "لا توجد بيانات كافية" : "Insufficient data"}</p>
          ) : (
            <div className="space-y-4">
              {a.monthlyTrend.map(m => {
                const maxVal = Math.max(...a.monthlyTrend.map(x => Math.max(x.earned, x.redeemed)));
                const [year, month] = m.month.split("-");
                const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
                return (
                  <div key={m.month}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-medium">{monthName}</span>
                      <span className="text-[9.5px] text-muted-foreground">{m.activeMembers} {ar ? "عضو نشط" : "active"}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] text-emerald-600 w-12 shrink-0">{ar ? "مكتسبة" : "Earned"}</span>
                        <div className="flex-1 h-2 bg-muted/25 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${maxVal > 0 ? (m.earned / maxVal) * 100 : 0}%` }} />
                        </div>
                        <span className="text-[9px] text-muted-foreground tabular-nums w-14 text-end">{fmtPts(m.earned)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] text-primary w-12 shrink-0">{ar ? "مستبدلة" : "Redeemed"}</span>
                        <div className="flex-1 h-2 bg-muted/25 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${maxVal > 0 ? (m.redeemed / maxVal) * 100 : 0}%` }} />
                        </div>
                        <span className="text-[9px] text-muted-foreground tabular-nums w-14 text-end">{fmtPts(m.redeemed)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Top Earners + Top Redeemers ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {/* Top earners */}
        <div className="border border-border/40 rounded-xl bg-background">
          <div className="px-5 py-4 border-b border-border/25 flex items-center justify-between">
            <h3 className="text-[13px] font-medium text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>
              {ar ? "أعلى المكتسبين" : "Top Earners"}
            </h3>
            <TrendingUp size={13} className="text-emerald-500" />
          </div>
          <div className="divide-y divide-border/20">
            {a.topEarners.map((m, i) => {
              const tm = TIER_META[m.tier];
              return (
                <button key={m.id} onClick={() => navigate(`/loyalty/members/${m.id}`)}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-muted/10 transition-colors text-start">
                  <span className="text-[10px] font-bold text-muted-foreground/40 w-4">{i + 1}</span>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-semibold text-white shrink-0" style={{ background: m.avatarColor }}>
                    {m.nameEn.split(" ").map(w => w[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium truncate">{ar ? m.nameAr : m.nameEn}</p>
                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${tm.pill}`}>{ar ? tm.ar : tm.en}</span>
                  </div>
                  <div className="text-end">
                    <p className="text-[12px] font-medium text-emerald-600 tabular-nums">{fmtPts(m.lifetimePoints)}</p>
                    <p className="text-[9px] text-muted-foreground">{ar ? "نقطة" : "pts"}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Top redeemers */}
        <div className="border border-border/40 rounded-xl bg-background">
          <div className="px-5 py-4 border-b border-border/25 flex items-center justify-between">
            <h3 className="text-[13px] font-medium text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>
              {ar ? "أعلى المستبدلين" : "Top Redeemers"}
            </h3>
            <Gift size={13} className="text-primary" />
          </div>
          <div className="divide-y divide-border/20">
            {a.topRedeemers.map((m, i) => {
              const tm = TIER_META[m.tier];
              const rdRate = m.lifetimePoints > 0 ? Math.round((m.redeemedPoints / m.lifetimePoints) * 100) : 0;
              return (
                <button key={m.id} onClick={() => navigate(`/loyalty/members/${m.id}`)}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-muted/10 transition-colors text-start">
                  <span className="text-[10px] font-bold text-muted-foreground/40 w-4">{i + 1}</span>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-semibold text-white shrink-0" style={{ background: m.avatarColor }}>
                    {m.nameEn.split(" ").map(w => w[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium truncate">{ar ? m.nameAr : m.nameEn}</p>
                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${tm.pill}`}>{ar ? tm.ar : tm.en}</span>
                  </div>
                  <div className="text-end">
                    <p className="text-[12px] font-medium text-primary tabular-nums">{fmtPts(m.redeemedPoints)}</p>
                    <p className="text-[9px] text-muted-foreground">{rdRate}% {ar ? "استبدال" : "redeemed"}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Category Affinity ── */}
      <div className="border border-border/40 rounded-xl p-5 bg-background mb-6">
        <h3 className="text-[13px] font-medium text-foreground mb-4" style={{ fontFamily: "var(--app-font-serif)" }}>
          {ar ? "الفئات المفضلة" : "Category Affinity"}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {a.categories.map(cat => (
            <div key={cat.name} className="flex items-center gap-3 p-3 rounded-xl bg-muted/15">
              <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center">
                <PieChart size={13} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium truncate">{cat.name}</p>
                <p className="text-[10px] text-muted-foreground">{cat.count} {ar ? "عضو" : "members"} · {cat.pct}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Points Health Summary ── */}
      <div className="bg-muted/15 border border-border/30 rounded-xl p-5">
        <h3 className="text-[13px] font-medium text-foreground mb-4" style={{ fontFamily: "var(--app-font-serif)" }}>
          {ar ? "صحة النقاط" : "Points Health"}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: ar ? "إجمالي الإصدار" : "Total Issued", value: fmtPts(a.totalIssued), color: "text-foreground" },
            { label: ar ? "مستبدلة" : "Redeemed", value: fmtPts(a.totalRedeemed), color: "text-primary" },
            { label: ar ? "منتهية" : "Expired", value: fmtPts(a.totalExpired), color: "text-muted-foreground" },
            { label: ar ? "قائمة" : "Outstanding", value: fmtPts(a.outstanding), color: "text-amber-600" },
            { label: ar ? "الالتزام المالي" : "Liability", value: fmtCurrency(a.pointsLiability), color: "text-rose-500" },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <p className="text-[10px] text-muted-foreground mb-1">{item.label}</p>
              <p className={`text-[16px] font-medium tabular-nums ${item.color}`} style={{ fontFamily: "var(--app-font-serif)" }}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* Visual flow bar */}
        <div className="mt-4 pt-3 border-t border-border/20">
          <div className="h-3 bg-muted/30 rounded-full overflow-hidden flex">
            <div className="h-full bg-primary" style={{ width: `${a.redemptionRate}%` }} title={`${ar ? "مستبدلة" : "Redeemed"} ${a.redemptionRate}%`} />
            <div className="h-full bg-muted-foreground/30" style={{ width: `${a.totalIssued > 0 ? Math.round((a.totalExpired / a.totalIssued) * 100) : 0}%` }} title={`${ar ? "منتهية" : "Expired"}`} />
            <div className="h-full bg-amber-400" style={{ width: `${a.totalIssued > 0 ? Math.round((a.outstanding / a.totalIssued) * 100) : 0}%` }} title={`${ar ? "قائمة" : "Outstanding"}`} />
          </div>
          <div className="flex justify-between mt-1.5 text-[8.5px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-primary inline-block" />{ar ? "مستبدلة" : "Redeemed"}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-muted-foreground/30 inline-block" />{ar ? "منتهية" : "Expired"}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-400 inline-block" />{ar ? "قائمة" : "Outstanding"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
