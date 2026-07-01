/**
 * Loyalty Transactions — Global transaction list with filters
 * معاملات الولاء — قائمة المعاملات العامة مع الفلاتر
 */

import { useState, useMemo } from "react";
import { useLanguage } from "../context/LanguageContext";
import {
  loadLoyaltyMembers, loadLoyaltyTransactions,
  TX_TYPE_META, SOURCE_META, fmtPts, fmtCurrency,
  type LoyaltyMemberDemo, type LoyaltyTransactionDemo,
  type TransactionType, type TransactionSource,
} from "../data/loyalty";
import {
  Search, X, ShoppingBag, Store, Shield, Cpu, Download,
} from "lucide-react";

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

function formatDateTime(dateStr: string, ar: boolean): string {
  return new Date(dateStr).toLocaleDateString(ar ? "ar-EG" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const SOURCE_ICONS: Record<string, React.ElementType> = {
  shopify: ShoppingBag, store: Store, admin: Shield, system: Cpu,
};

const TYPE_FILTERS: { value: TransactionType | "all"; en: string; ar: string }[] = [
  { value: "all",      en: "All",       ar: "الكل" },
  { value: "earned",   en: "Earned",    ar: "مكتسبة" },
  { value: "redeemed", en: "Redeemed",  ar: "مستبدلة" },
  { value: "adjusted", en: "Adjusted",  ar: "تعديل" },
  { value: "bonus",    en: "Bonus",     ar: "مكافأة" },
  { value: "expired",  en: "Expired",   ar: "منتهية" },
  { value: "reversed", en: "Reversed",  ar: "معكوسة" },
];

const SOURCE_FILTERS: { value: TransactionSource | "all"; en: string; ar: string }[] = [
  { value: "all",     en: "All Sources", ar: "كل المصادر" },
  { value: "shopify", en: "Shopify",     ar: "شوبيفاي" },
  { value: "store",   en: "Store",       ar: "المتجر" },
  { value: "admin",   en: "Admin",       ar: "الإدارة" },
  { value: "system",  en: "System",      ar: "النظام" },
];

export default function LoyaltyTransactions() {
  const { lang } = useLanguage();
  const ar = lang === "ar";

  const [members] = useState(loadLoyaltyMembers);
  const [transactions] = useState(loadLoyaltyTransactions);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TransactionType | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<TransactionSource | "all">("all");

  const memberMap = useMemo(() => {
    const map = new Map<string, LoyaltyMemberDemo>();
    members.forEach(m => map.set(m.id, m));
    return map;
  }, [members]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let txs = [...transactions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (typeFilter !== "all") txs = txs.filter(t => t.type === typeFilter);
    if (sourceFilter !== "all") txs = txs.filter(t => t.source === sourceFilter);
    if (q) {
      txs = txs.filter(t => {
        const member = memberMap.get(t.memberId);
        return (member?.nameEn.toLowerCase().includes(q) || member?.nameAr.includes(q) ||
          member?.phone.includes(q) || t.orderId?.toLowerCase().includes(q) ||
          t.staffName?.toLowerCase().includes(q) || t.notes?.toLowerCase().includes(q));
      });
    }
    return txs;
  }, [transactions, search, typeFilter, sourceFilter, memberMap]);

  const hasFilters = search !== "" || typeFilter !== "all" || sourceFilter !== "all";
  function clearFilters() { setSearch(""); setTypeFilter("all"); setSourceFilter("all"); }

  // Summary
  const earnedTotal = filtered.filter(t => t.points > 0).reduce((s, t) => s + t.points, 0);
  const deductedTotal = filtered.filter(t => t.points < 0).reduce((s, t) => s + Math.abs(t.points), 0);

  return (
    <div className="min-h-full py-8 px-7 md:px-10 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="text-[11px] text-muted-foreground/60 tracking-[0.08em] uppercase mb-2">{ar ? "برنامج الولاء" : "Loyalty Program"}</p>
        <h1 className="text-[26px] font-medium text-foreground leading-tight" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.025em" }}>
          {ar ? "سجل المعاملات" : "Points Transactions"}
        </h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-background border border-border/40 rounded-xl px-4 py-3.5">
          <p className="text-[10px] text-muted-foreground mb-1">{ar ? "المعاملات" : "Transactions"}</p>
          <p className="text-[20px] font-medium text-foreground tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>{filtered.length}</p>
        </div>
        <div className="bg-background border border-border/40 rounded-xl px-4 py-3.5">
          <p className="text-[10px] text-muted-foreground mb-1">{ar ? "نقاط صادرة" : "Points Issued"}</p>
          <p className="text-[20px] font-medium text-emerald-600 tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>+{fmtPts(earnedTotal)}</p>
        </div>
        <div className="bg-background border border-border/40 rounded-xl px-4 py-3.5">
          <p className="text-[10px] text-muted-foreground mb-1">{ar ? "نقاط مخصومة" : "Points Deducted"}</p>
          <p className="text-[20px] font-medium text-foreground tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>-{fmtPts(deductedTotal)}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5 mb-5">
        <div className="relative min-w-[200px] flex-1 max-w-[280px]">
          <Search size={13} strokeWidth={1.75} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={ar ? "بحث…" : "Search member, order, staff…"}
            className="w-full h-9 ps-8 pe-4 rounded-xl border border-border/80 bg-card text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
          />
        </div>
        <div className="h-5 w-px bg-border/60 hidden sm:block" />

        <div className="flex items-center gap-1.5 flex-wrap">
          {TYPE_FILTERS.map(f => (
            <button key={f.value} onClick={() => setTypeFilter(f.value as TransactionType | "all")}
              className={`h-7 px-3 rounded-lg text-[12px] font-medium border transition-all ${typeFilter === f.value ? "bg-primary/8 text-primary border-primary/25" : "bg-card border-border text-muted-foreground hover:text-foreground"}`}>
              {ar ? f.ar : f.en}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-border/60 hidden sm:block" />

        <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value as TransactionSource | "all")}
          className="h-7 ps-2.5 pe-6 rounded-lg border border-border bg-card text-[12px] text-muted-foreground focus:outline-none appearance-none cursor-pointer">
          {SOURCE_FILTERS.map(f => <option key={f.value} value={f.value}>{ar ? f.ar : f.en}</option>)}
        </select>

        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-[12px] text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent hover:border-border transition-all">
            <X size={11} strokeWidth={2} />{ar ? "مسح" : "Clear"}
          </button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="border border-border/40 rounded-xl py-16 text-center bg-background">
          <p className="text-[13px] font-medium text-foreground">{ar ? "لا توجد معاملات" : "No transactions found"}</p>
          <p className="text-[12px] text-muted-foreground mt-1">{ar ? "جرب تغيير الفلاتر" : "Try adjusting filters"}</p>
        </div>
      ) : (
        <div className="border border-border/40 rounded-xl overflow-hidden bg-background divide-y divide-border/25">
          {filtered.map(tx => {
            const member = memberMap.get(tx.memberId);
            const meta = TX_TYPE_META[tx.type];
            const srcMeta = SOURCE_META[tx.source];
            const SrcIcon = SOURCE_ICONS[tx.source] || Cpu;
            const isPositive = tx.points > 0;

            return (
              <div key={tx.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${meta.dot}`} />
                {member && (
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-semibold text-white shrink-0" style={{ backgroundColor: member.avatarColor }}>
                    {initials(ar ? member.nameAr : member.nameEn)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[13px] font-medium text-foreground truncate">{ar ? (member?.nameAr || "—") : (member?.nameEn || "—")}</span>
                    <span className="text-[10px] text-muted-foreground">{ar ? meta.ar : meta.en}</span>
                    {tx.orderId && <span className="text-[10px] text-muted-foreground font-mono hidden sm:inline">{tx.orderId}</span>}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><SrcIcon size={9} />{ar ? srcMeta.ar : srcMeta.en}</span>
                    {tx.staffName && <span>· {tx.staffName}</span>}
                    {tx.orderAmount && <span>· {fmtCurrency(tx.orderAmount)}</span>}
                  </div>
                </div>
                <div className="text-end shrink-0">
                  <p className={`text-[14px] font-medium tabular-nums ${isPositive ? "text-emerald-600" : "text-foreground"}`}>
                    {isPositive ? "+" : ""}{fmtPts(tx.points)}
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground tabular-nums shrink-0 hidden md:block w-[100px] text-end">
                  {formatDateTime(tx.createdAt, ar)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
