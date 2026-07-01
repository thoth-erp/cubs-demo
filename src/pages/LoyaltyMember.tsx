/**
 * Loyalty Member Profile — Full loyalty detail page for a member
 * ملف عضو الولاء — صفحة تفاصيل كاملة لعضو الولاء
 */

import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useLanguage } from "../context/LanguageContext";
import {
  loadLoyaltyMembers, loadLoyaltyTransactions,
  TIER_META, TX_TYPE_META, SOURCE_META, fmtPts, fmtCurrency, tierProgress,
  type LoyaltyMemberDemo, type LoyaltyTransactionDemo, type LoyaltyTierSlug, type TransactionType,
} from "../data/loyalty";
import {
  ArrowLeft, Phone, Mail, Star, Crown, Gift, Clock,
  ShoppingBag, Store, Shield, Cpu, ChevronRight,
  Calendar, Tag, Award, TrendingUp, Wallet,
} from "lucide-react";

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

function formatDate(dateStr: string, ar: boolean): string {
  return new Date(dateStr).toLocaleDateString(ar ? "ar-EG" : "en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(dateStr: string, ar: boolean): string {
  return new Date(dateStr).toLocaleDateString(ar ? "ar-EG" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const SOURCE_ICONS: Record<string, React.ElementType> = {
  shopify: ShoppingBag, store: Store, admin: Shield, system: Cpu,
};

type Tab = "overview" | "transactions" | "rewards";

const TABS: { id: Tab; en: string; ar: string }[] = [
  { id: "overview",     en: "Overview",     ar: "نظرة عامة" },
  { id: "transactions", en: "Transactions", ar: "المعاملات" },
  { id: "rewards",      en: "Rewards",      ar: "المكافآت" },
];

// ─── Filter options ────────────────────────────────────────

const TX_FILTERS: { value: TransactionType | "all"; en: string; ar: string }[] = [
  { value: "all",      en: "All",      ar: "الكل" },
  { value: "earned",   en: "Earned",   ar: "مكتسبة" },
  { value: "redeemed", en: "Redeemed", ar: "مستبدلة" },
  { value: "adjusted", en: "Adjusted", ar: "تعديل" },
  { value: "bonus",    en: "Bonus",    ar: "مكافأة" },
  { value: "expired",  en: "Expired",  ar: "منتهية" },
  { value: "reversed", en: "Reversed", ar: "معكوسة" },
];

export default function LoyaltyMember() {
  const { lang } = useLanguage();
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const ar = lang === "ar";

  const [members] = useState(loadLoyaltyMembers);
  const [allTransactions] = useState(loadLoyaltyTransactions);
  const [tab, setTab] = useState<Tab>("overview");
  const [txFilter, setTxFilter] = useState<TransactionType | "all">("all");

  const member = useMemo(() => members.find(m => m.id === params.id), [members, params.id]);
  const transactions = useMemo(() => {
    if (!member) return [];
    let txs = allTransactions.filter(t => t.memberId === member.id);
    if (txFilter !== "all") txs = txs.filter(t => t.type === txFilter);
    return txs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [member, allTransactions, txFilter]);

  if (!member) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-[14px] text-muted-foreground">{ar ? "العضو غير موجود" : "Member not found"}</p>
          <button onClick={() => navigate("/loyalty")} className="text-[12px] text-primary hover:underline mt-2">{ar ? "عودة" : "Go back"}</button>
        </div>
      </div>
    );
  }

  const tm = TIER_META[member.tier];
  const prog = tierProgress(member.totalSpend, member.tier);

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className={`border-b border-border/40 px-8 md:px-10 py-8 bg-gradient-to-br ${tm.gradient}`}>
        <div className="max-w-[900px]">
          <button onClick={() => navigate("/loyalty")}
            className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground mb-5 transition-colors">
            <ArrowLeft size={14} />{ar ? "لوحة الولاء" : "Loyalty Dashboard"}
          </button>

          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-[20px] font-bold text-white shadow-md shrink-0" style={{ backgroundColor: member.avatarColor }}>
              {initials(ar ? member.nameAr : member.nameEn)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-[24px] font-medium text-foreground leading-tight" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.025em" }}>
                  {ar ? member.nameAr : member.nameEn}
                </h1>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide ${tm.pill}`}>
                  {member.tier === "vip" ? <Crown size={10} className="inline -mt-0.5 me-1" /> : <Star size={10} className="inline -mt-0.5 me-1" />}
                  {ar ? tm.ar : tm.en}
                </span>
              </div>
              <p className="text-[12px] text-muted-foreground font-mono">{member.memberNumber}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Phone size={10} />{member.phone}</span>
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Mail size={10} />{member.email}</span>
                {member.shopifyCustomerId && (
                  <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><ShoppingBag size={10} />Shopify</span>
                )}
              </div>
            </div>
            <div className="text-end shrink-0">
              <p className="text-[32px] font-medium text-foreground leading-none tabular-nums" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.03em" }}>
                {fmtPts(member.currentPoints)}
              </p>
              <p className="text-[12px] text-muted-foreground mt-1">{ar ? "نقطة متاحة" : "points available"}</p>
            </div>
          </div>

          {/* Tier progress */}
          {prog.next && (
            <div className="mt-5 max-w-[400px]">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                <span>{ar ? tm.ar : tm.en}</span>
                <span>{ar ? TIER_META[prog.next].ar : TIER_META[prog.next].en}</span>
              </div>
              <div className="h-2 rounded-full bg-border/40 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${prog.pct}%`, backgroundColor: tm.color }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {fmtCurrency(prog.remaining)} {ar ? `حتى ${TIER_META[prog.next].ar}` : `until ${TIER_META[prog.next].en}`}
              </p>
            </div>
          )}

          {/* Stats strip */}
          <div className="flex items-center gap-6 mt-5 pt-4 border-t border-border/20">
            {[
              { labelEn: "Total Spend", labelAr: "إجمالي الإنفاق", value: fmtCurrency(member.totalSpend) },
              { labelEn: "Orders", labelAr: "الطلبات", value: String(member.orderCount) },
              { labelEn: "Lifetime Points", labelAr: "النقاط الكلية", value: fmtPts(member.lifetimePoints) },
              { labelEn: "Redeemed", labelAr: "مستبدلة", value: fmtPts(member.redeemedPoints) },
              { labelEn: "Expired", labelAr: "منتهية", value: fmtPts(member.expiredPoints) },
              { labelEn: "Last Purchase", labelAr: "آخر شراء", value: formatDate(member.lastPurchaseAt, ar) },
            ].map((s, i) => (
              <div key={i}>
                <p className="text-[10px] text-muted-foreground">{ar ? s.labelAr : s.labelEn}</p>
                <p className="text-[13px] font-medium text-foreground tabular-nums mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border/40 px-8 md:px-10">
        <div className="max-w-[900px] flex items-center gap-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-[13px] font-medium border-b-2 transition-colors ${tab === t.id ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"}`}>
              {ar ? t.ar : t.en}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-8 md:px-10 py-6 max-w-[900px]">
        {tab === "overview" && (
          <div className="space-y-6">
            {/* Favorite categories */}
            {member.favoriteCategories.length > 0 && (
              <div>
                <h3 className="text-[13px] font-medium text-foreground mb-3" style={{ fontFamily: "var(--app-font-serif)" }}>
                  {ar ? "الفئات المفضلة" : "Favorite Categories"}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {member.favoriteCategories.map(c => (
                    <span key={c} className="text-[11px] px-3 py-1.5 rounded-full bg-muted text-muted-foreground border border-border/40 flex items-center gap-1.5">
                      <Tag size={10} />{c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Points summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-background border border-border/40 rounded-xl px-4 py-3.5">
                <div className="flex items-center gap-2 mb-1.5"><TrendingUp size={13} className="text-emerald-600" /><p className="text-[10px] text-muted-foreground">{ar ? "مكتسبة" : "Earned"}</p></div>
                <p className="text-[18px] font-medium text-foreground tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>{fmtPts(member.lifetimePoints)}</p>
              </div>
              <div className="bg-background border border-border/40 rounded-xl px-4 py-3.5">
                <div className="flex items-center gap-2 mb-1.5"><Gift size={13} className="text-primary" /><p className="text-[10px] text-muted-foreground">{ar ? "مستبدلة" : "Redeemed"}</p></div>
                <p className="text-[18px] font-medium text-foreground tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>{fmtPts(member.redeemedPoints)}</p>
              </div>
              <div className="bg-background border border-border/40 rounded-xl px-4 py-3.5">
                <div className="flex items-center gap-2 mb-1.5"><Clock size={13} className="text-muted-foreground/50" /><p className="text-[10px] text-muted-foreground">{ar ? "منتهية" : "Expired"}</p></div>
                <p className="text-[18px] font-medium text-foreground tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>{fmtPts(member.expiredPoints)}</p>
              </div>
              <div className="bg-background border border-border/40 rounded-xl px-4 py-3.5">
                <div className="flex items-center gap-2 mb-1.5"><Wallet size={13} className="text-amber-500" /><p className="text-[10px] text-muted-foreground">{ar ? "الرصيد" : "Balance"}</p></div>
                <p className="text-[18px] font-medium text-foreground tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>{fmtPts(member.currentPoints)}</p>
              </div>
            </div>

            {/* Recent transactions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-medium text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>
                  {ar ? "آخر المعاملات" : "Recent Transactions"}
                </h3>
                <button onClick={() => setTab("transactions")} className="text-[11px] text-primary hover:underline flex items-center gap-1">
                  {ar ? "عرض الكل" : "View all"}<ChevronRight size={12} />
                </button>
              </div>
              <TransactionList transactions={transactions.slice(0, 5)} lang={lang} />
            </div>
          </div>
        )}

        {tab === "transactions" && (
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 flex-wrap">
              {TX_FILTERS.map(f => (
                <button key={f.value} onClick={() => setTxFilter(f.value as TransactionType | "all")}
                  className={`h-7 px-3 rounded-lg text-[12px] font-medium border transition-all ${txFilter === f.value ? "bg-primary/8 text-primary border-primary/25" : "bg-card border-border text-muted-foreground hover:text-foreground"}`}>
                  {ar ? f.ar : f.en}
                </button>
              ))}
            </div>

            <p className="text-[12px] text-muted-foreground">
              {transactions.length} {ar ? "معاملة" : `transaction${transactions.length !== 1 ? "s" : ""}`}
            </p>

            <TransactionList transactions={transactions} lang={lang} />
          </div>
        )}

        {tab === "rewards" && (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-xl bg-muted mx-auto mb-4 flex items-center justify-center">
              <Award size={20} className="text-muted-foreground" strokeWidth={1.5} />
            </div>
            <p className="text-[14px] font-medium text-foreground mb-1">{ar ? "المكافآت قريبًا" : "Rewards Coming Soon"}</p>
            <p className="text-[12px] text-muted-foreground">{ar ? "كتالوج المكافآت قيد الإنشاء" : "Rewards catalog is being built"}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Transaction list component ──────────────────────────

function TransactionList({ transactions, lang }: { transactions: LoyaltyTransactionDemo[]; lang: "en" | "ar" }) {
  const ar = lang === "ar";

  if (transactions.length === 0) {
    return (
      <div className="border border-border/40 rounded-xl py-12 text-center bg-background">
        <p className="text-[13px] text-muted-foreground">{ar ? "لا توجد معاملات" : "No transactions found"}</p>
      </div>
    );
  }

  return (
    <div className="border border-border/40 rounded-xl overflow-hidden bg-background divide-y divide-border/25">
      {transactions.map(tx => {
        const meta = TX_TYPE_META[tx.type];
        const srcMeta = SOURCE_META[tx.source];
        const SrcIcon = SOURCE_ICONS[tx.source] || Cpu;
        const isPositive = tx.points > 0;

        return (
          <div key={tx.id} className="flex items-center gap-4 px-5 py-3.5">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${meta.dot}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[13px] font-medium text-foreground">{ar ? meta.ar : meta.en}</span>
                {tx.orderId && <span className="text-[11px] text-muted-foreground font-mono">{tx.orderId}</span>}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><SrcIcon size={10} />{ar ? srcMeta.ar : srcMeta.en}</span>
                {tx.staffName && <span>· {tx.staffName}</span>}
                {tx.orderAmount && <span>· {fmtCurrency(tx.orderAmount)}</span>}
                <span>· {formatDateTime(tx.createdAt, ar)}</span>
              </div>
              {tx.notes && <p className="text-[10px] text-muted-foreground/60 mt-0.5 italic">{tx.notes}</p>}
            </div>
            <div className="text-end shrink-0">
              <p className={`text-[14px] font-medium tabular-nums ${isPositive ? "text-emerald-600" : "text-foreground"}`}>
                {isPositive ? "+" : ""}{fmtPts(tx.points)}
              </p>
              <p className="text-[10px] text-muted-foreground tabular-nums">{ar ? "رصيد:" : "bal:"} {fmtPts(tx.balanceAfter)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
