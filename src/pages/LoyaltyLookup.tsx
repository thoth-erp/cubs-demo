/**
 * Loyalty Staff Lookup — POS-style customer search for store staff
 * بحث الولاء — بحث سريع عن العملاء للموظفين في المتجر
 *
 * Design: Apple Wallet–style membership card, large search bar, fast results
 */

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "../context/LanguageContext";
import {
  loadLoyaltyMembers, loadLoyaltyTransactions,
  TIER_META, TX_TYPE_META, fmtPts, fmtCurrency, tierProgress,
  type LoyaltyMemberDemo, type LoyaltyTransactionDemo, type LoyaltyTierSlug,
} from "../data/loyalty";
import {
  Search, X, ChevronRight, Phone, Mail, Gift, Plus, Minus,
  ShoppingBag, Clock, CheckCircle2, AlertCircle, ArrowLeft,
  Star, Crown, Sparkles, Receipt, User,
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
  return ar ? `منذ ${Math.floor(diff / 7)} أسبوع` : `${Math.floor(diff / 7)}w ago`;
}

// ─── Membership card ──────────────────────────────────────

function MemberCard({ member, lang }: { member: LoyaltyMemberDemo; lang: "en" | "ar" }) {
  const ar = lang === "ar";
  const tm = TIER_META[member.tier];
  const prog = tierProgress(member.totalSpend, member.tier);

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${tm.gradient} border border-border/40 p-6`}>
      {/* Decorative */}
      <div className="absolute top-0 end-0 w-40 h-40 rounded-full opacity-[0.04]" style={{ backgroundColor: tm.color, filter: "blur(40px)" }} />

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[14px] font-bold text-white shadow-sm" style={{ backgroundColor: member.avatarColor }}>
            {initials(ar ? member.nameAr : member.nameEn)}
          </div>
          <div>
            <h2 className="text-[18px] font-medium text-foreground leading-tight" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.02em" }}>
              {ar ? member.nameAr : member.nameEn}
            </h2>
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{member.memberNumber}</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide ${tm.pill}`}>
          {member.tier === "vip" ? <Crown size={11} className="inline -mt-0.5 me-1" /> : <Star size={11} className="inline -mt-0.5 me-1" />}
          {ar ? tm.ar : tm.en}
        </div>
      </div>

      {/* Points */}
      <div className="mb-5">
        <p className="text-[11px] text-muted-foreground mb-1">{ar ? "الرصيد الحالي" : "Current Balance"}</p>
        <p className="text-[36px] font-medium text-foreground leading-none tabular-nums" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.03em" }}>
          {fmtPts(member.currentPoints)}
        </p>
        <p className="text-[12px] text-muted-foreground mt-1">{ar ? "نقطة" : "points"}</p>
      </div>

      {/* Tier progress */}
      {prog.next && (
        <div className="mb-5">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
            <span>{ar ? tm.ar : tm.en}</span>
            <span>{ar ? TIER_META[prog.next].ar : TIER_META[prog.next].en}</span>
          </div>
          <div className="h-2 rounded-full bg-border/40 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${prog.pct}%`, backgroundColor: tm.color }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">
            {fmtCurrency(prog.remaining)} {ar ? `حتى ${TIER_META[prog.next].ar}` : `until ${TIER_META[prog.next].en}`}
          </p>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border/30">
        <div>
          <p className="text-[10px] text-muted-foreground">{ar ? "إجمالي الإنفاق" : "Total Spend"}</p>
          <p className="text-[14px] font-medium text-foreground tabular-nums">{fmtCurrency(member.totalSpend)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">{ar ? "الطلبات" : "Orders"}</p>
          <p className="text-[14px] font-medium text-foreground tabular-nums">{member.orderCount}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">{ar ? "آخر شراء" : "Last Purchase"}</p>
          <p className="text-[14px] font-medium text-foreground">{timeAgo(member.lastPurchaseAt, ar)}</p>
        </div>
      </div>

      {/* Contact */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/20">
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Phone size={10} strokeWidth={1.75} />{member.phone}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Mail size={10} strokeWidth={1.75} />{member.email}
        </span>
      </div>
    </div>
  );
}

// ─── Action modals ────────────────────────────────────────

function RedeemModal({ member, open, onClose, onConfirm, lang }: {
  member: LoyaltyMemberDemo; open: boolean; onClose: () => void;
  onConfirm: (points: number) => void; lang: "en" | "ar";
}) {
  const ar = lang === "ar";
  const [points, setPoints] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setPoints(""); setConfirmed(false); setTimeout(() => inputRef.current?.focus(), 80); }
  }, [open]);

  const numPoints = parseInt(points) || 0;
  const discount = numPoints / 100; // 1000 pts = 10 EGP
  const valid = numPoints >= 500 && numPoints <= member.currentPoints;
  const tooLow = numPoints > 0 && numPoints < 500;
  const tooHigh = numPoints > member.currentPoints;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setConfirmed(true);
    setTimeout(() => { onConfirm(numPoints); onClose(); }, 800);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-[3px]" onClick={onClose} />
      <div className="relative bg-background border border-border/60 rounded-2xl shadow-xl w-full max-w-[420px] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border/40">
          <h2 className="text-[17px] font-medium text-foreground" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.02em" }}>
            <Gift size={16} className="inline -mt-0.5 me-2 text-primary" />
            {ar ? "استبدال النقاط" : "Redeem Points"}
          </h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 space-y-4">
            <div className="bg-muted/30 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-[12px] text-muted-foreground">{ar ? "الرصيد المتاح" : "Available"}</span>
              <span className="text-[15px] font-medium text-foreground tabular-nums">{fmtPts(member.currentPoints)} {ar ? "نقطة" : "pts"}</span>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">
                {ar ? "النقاط المراد استبدالها" : "Points to Redeem"}
              </label>
              <input ref={inputRef} type="number" value={points} onChange={e => setPoints(e.target.value)}
                placeholder={ar ? "مثال: 5000" : "e.g., 5000"} min={500} max={member.currentPoints}
                className={`w-full h-11 px-4 rounded-xl border bg-card text-[15px] text-foreground tabular-nums placeholder:text-muted-foreground focus:outline-none transition-colors ${tooLow || tooHigh ? "border-rose-400" : "border-border/80 focus:border-primary/40"}`}
              />
              {tooLow && <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1"><AlertCircle size={10} />{ar ? "الحد الأدنى 500 نقطة" : "Minimum 500 points"}</p>}
              {tooHigh && <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1"><AlertCircle size={10} />{ar ? "يتجاوز الرصيد المتاح" : "Exceeds available balance"}</p>}
            </div>

            {numPoints >= 500 && !tooHigh && (
              <div className="bg-primary/5 border border-primary/15 rounded-xl px-4 py-3">
                <p className="text-[13px] font-medium text-primary">{fmtCurrency(discount)} {ar ? "خصم" : "discount"}</p>
                <p className="text-[10px] text-primary/70 mt-0.5">
                  {fmtPts(numPoints)} {ar ? "نقطة" : "points"} → {fmtCurrency(discount)} {ar ? "خصم" : "off"}
                </p>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-border/40 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="h-9 px-4 rounded-xl border border-border text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              {ar ? "إلغاء" : "Cancel"}
            </button>
            <button type="submit" disabled={!valid || confirmed}
              className="h-9 px-5 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity">
              {confirmed
                ? <><CheckCircle2 size={14} />{ar ? "تم" : "Done"}</>
                : <><Gift size={14} />{ar ? "تأكيد الاستبدال" : "Confirm Redeem"}</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddPurchaseModal({ member, open, onClose, onConfirm, lang }: {
  member: LoyaltyMemberDemo; open: boolean; onClose: () => void;
  onConfirm: (amount: number, receipt?: string) => void; lang: "en" | "ar";
}) {
  const ar = lang === "ar";
  const [amount, setAmount] = useState("");
  const [receipt, setReceipt] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setAmount(""); setReceipt(""); setConfirmed(false); setTimeout(() => inputRef.current?.focus(), 80); }
  }, [open]);

  const numAmount = parseFloat(amount) || 0;
  const pointsEarned = Math.floor(numAmount / 10) * 100; // 10 EGP = 100 pts
  const multiplier = TIER_META[member.tier].multiplier;
  const finalPoints = Math.floor(pointsEarned * multiplier);
  const valid = numAmount >= 10;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setConfirmed(true);
    setTimeout(() => { onConfirm(numAmount, receipt || undefined); onClose(); }, 800);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-[3px]" onClick={onClose} />
      <div className="relative bg-background border border-border/60 rounded-2xl shadow-xl w-full max-w-[420px] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border/40">
          <h2 className="text-[17px] font-medium text-foreground" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.02em" }}>
            <Receipt size={16} className="inline -mt-0.5 me-2 text-emerald-600" />
            {ar ? "إضافة عملية شراء" : "Add Purchase"}
          </h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">
                {ar ? "مبلغ الشراء (ج.م)" : "Purchase Amount (EGP)"}
              </label>
              <input ref={inputRef} type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder={ar ? "مثال: 500" : "e.g., 500"} min={10} step="0.01"
                className="w-full h-11 px-4 rounded-xl border border-border/80 bg-card text-[15px] text-foreground tabular-nums placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">
                {ar ? "رقم الإيصال (اختياري)" : "Receipt Number (optional)"}
              </label>
              <input type="text" value={receipt} onChange={e => setReceipt(e.target.value)}
                placeholder={ar ? "مثال: REC-0042" : "e.g., REC-0042"}
                className="w-full h-9 px-3 rounded-xl border border-border/80 bg-card text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
              />
            </div>

            {numAmount >= 10 && (
              <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl px-4 py-3">
                <p className="text-[13px] font-medium text-emerald-700">+{fmtPts(finalPoints)} {ar ? "نقطة" : "points"}</p>
                <p className="text-[10px] text-emerald-600/70 mt-0.5">
                  {fmtCurrency(numAmount)} × {multiplier > 1 ? `${multiplier}x (${ar ? TIER_META[member.tier].ar : TIER_META[member.tier].en})` : "1x"}
                </p>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-border/40 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="h-9 px-4 rounded-xl border border-border text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              {ar ? "إلغاء" : "Cancel"}
            </button>
            <button type="submit" disabled={!valid || confirmed}
              className="h-9 px-5 rounded-xl bg-emerald-600 text-white text-[13px] font-medium flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity">
              {confirmed
                ? <><CheckCircle2 size={14} />{ar ? "تم" : "Done"}</>
                : <><Plus size={14} />{ar ? "تأكيد" : "Confirm"}</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Transaction list (mini) ──────────────────────────────

function MemberTransactions({ transactions, lang }: { transactions: LoyaltyTransactionDemo[]; lang: "en" | "ar" }) {
  const ar = lang === "ar";
  if (transactions.length === 0) return (
    <p className="text-[12px] text-muted-foreground/50 text-center py-6">{ar ? "لا توجد معاملات" : "No transactions yet"}</p>
  );

  return (
    <div className="divide-y divide-border/25">
      {transactions.map(tx => {
        const meta = TX_TYPE_META[tx.type];
        const isPositive = tx.points > 0;
        return (
          <div key={tx.id} className="flex items-center gap-3 px-1 py-3">
            <div className={`w-2 h-2 rounded-full shrink-0 ${meta.dot}`} />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-foreground">
                {ar ? meta.ar : meta.en}
                {tx.orderId && <span className="text-muted-foreground"> · {tx.orderId}</span>}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {tx.staffName && <span>{tx.staffName} · </span>}
                {timeAgo(tx.createdAt, ar)}
                {tx.orderAmount && <span> · {fmtCurrency(tx.orderAmount)}</span>}
              </p>
            </div>
            <span className={`text-[13px] font-medium tabular-nums ${isPositive ? "text-emerald-600" : "text-foreground"}`}>
              {isPositive ? "+" : ""}{fmtPts(tx.points)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Main lookup page
// ═══════════════════════════════════════════════════════════

export default function LoyaltyLookup() {
  const { lang } = useLanguage();
  const [, navigate] = useLocation();
  const ar = lang === "ar";

  const [members] = useState(loadLoyaltyMembers);
  const [transactions] = useState(loadLoyaltyTransactions);
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<LoyaltyMemberDemo | null>(null);
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { searchRef.current?.focus(); }, []);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return members.filter(m =>
      m.phone.includes(q) || m.email.toLowerCase().includes(q) ||
      m.nameEn.toLowerCase().includes(q) || m.nameAr.includes(q) ||
      m.memberNumber.toLowerCase().includes(q)
    );
  }, [members, search]);

  const memberTx = useMemo(() => {
    if (!selectedMember) return [];
    return transactions
      .filter(t => t.memberId === selectedMember.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [selectedMember, transactions]);

  const handleRedeem = useCallback((points: number) => {
    if (!selectedMember) return;
    // In real app: API call → loyalty_transaction
    setSelectedMember(prev => prev ? { ...prev, currentPoints: prev.currentPoints - points, redeemedPoints: prev.redeemedPoints + points } : null);
  }, [selectedMember]);

  const handlePurchase = useCallback((amount: number) => {
    if (!selectedMember) return;
    const pointsEarned = Math.floor((amount / 10) * 100 * TIER_META[selectedMember.tier].multiplier);
    setSelectedMember(prev => prev ? {
      ...prev,
      currentPoints: prev.currentPoints + pointsEarned,
      lifetimePoints: prev.lifetimePoints + pointsEarned,
      totalSpend: prev.totalSpend + amount,
      orderCount: prev.orderCount + 1,
      lastPurchaseAt: new Date().toISOString().slice(0, 10),
    } : null);
  }, [selectedMember]);

  // ─── Selected member view ──────────────────────────────
  if (selectedMember) {
    return (
      <>
        <div className="min-h-full py-6 px-6 md:px-10 max-w-[600px] mx-auto">
          {/* Back */}
          <button onClick={() => setSelectedMember(null)}
            className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground mb-5 transition-colors">
            <ArrowLeft size={14} />{ar ? "عودة للبحث" : "Back to search"}
          </button>

          {/* Card */}
          <MemberCard member={selectedMember} lang={lang} />

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 mt-5">
            <button onClick={() => setRedeemOpen(true)}
              className="h-12 rounded-xl bg-primary text-primary-foreground text-[14px] font-medium flex items-center justify-center gap-2.5 hover:opacity-90 active:opacity-80 transition-opacity shadow-sm">
              <Gift size={16} strokeWidth={2} />
              {ar ? "استبدال النقاط" : "Redeem Points"}
            </button>
            <button onClick={() => setPurchaseOpen(true)}
              className="h-12 rounded-xl bg-emerald-600 text-white text-[14px] font-medium flex items-center justify-center gap-2.5 hover:opacity-90 active:opacity-80 transition-opacity shadow-sm">
              <Plus size={16} strokeWidth={2} />
              {ar ? "إضافة شراء" : "Add Purchase"}
            </button>
          </div>

          {/* Favorite categories */}
          {selectedMember.favoriteCategories.length > 0 && (
            <div className="mt-5">
              <p className="text-[11px] text-muted-foreground mb-2">{ar ? "الفئات المفضلة" : "Favorite Categories"}</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedMember.favoriteCategories.map(c => (
                  <span key={c} className="text-[10px] px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border/40">{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Points breakdown */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="bg-background border border-border/40 rounded-xl px-3 py-3 text-center">
              <p className="text-[10px] text-muted-foreground">{ar ? "مكتسبة" : "Lifetime"}</p>
              <p className="text-[14px] font-medium text-foreground tabular-nums mt-1">{fmtPts(selectedMember.lifetimePoints)}</p>
            </div>
            <div className="bg-background border border-border/40 rounded-xl px-3 py-3 text-center">
              <p className="text-[10px] text-muted-foreground">{ar ? "مستبدلة" : "Redeemed"}</p>
              <p className="text-[14px] font-medium text-foreground tabular-nums mt-1">{fmtPts(selectedMember.redeemedPoints)}</p>
            </div>
            <div className="bg-background border border-border/40 rounded-xl px-3 py-3 text-center">
              <p className="text-[10px] text-muted-foreground">{ar ? "منتهية" : "Expired"}</p>
              <p className="text-[14px] font-medium text-foreground tabular-nums mt-1">{fmtPts(selectedMember.expiredPoints)}</p>
            </div>
          </div>

          {/* Recent transactions */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-medium text-foreground" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.01em" }}>
                {ar ? "سجل النقاط" : "Points History"}
              </h3>
              <button onClick={() => navigate(`/loyalty/members/${selectedMember.id}`)} className="text-[11px] text-primary hover:underline flex items-center gap-1">
                {ar ? "عرض الكل" : "View all"}<ChevronRight size={12} />
              </button>
            </div>
            <div className="bg-background border border-border/40 rounded-xl px-4">
              <MemberTransactions transactions={memberTx.slice(0, 5)} lang={lang} />
            </div>
          </div>
        </div>

        <RedeemModal member={selectedMember} open={redeemOpen} onClose={() => setRedeemOpen(false)} onConfirm={handleRedeem} lang={lang} />
        <AddPurchaseModal member={selectedMember} open={purchaseOpen} onClose={() => setPurchaseOpen(false)} onConfirm={handlePurchase} lang={lang} />
      </>
    );
  }

  // ─── Search view ───────────────────────────────────────
  return (
    <div className="min-h-full flex flex-col items-center py-12 px-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-4">
          <User size={24} strokeWidth={1.5} className="text-primary" />
        </div>
        <h1 className="text-[24px] font-medium text-foreground" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.025em" }}>
          {ar ? "بحث عن عميل" : "Customer Lookup"}
        </h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          {ar ? "ابحث برقم الهاتف، البريد الإلكتروني، أو الاسم" : "Search by phone, email, or name"}
        </p>
      </div>

      {/* Search bar */}
      <div className="w-full max-w-[480px] mb-6">
        <div className="relative">
          <Search size={18} strokeWidth={1.75} className="absolute start-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            ref={searchRef}
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={ar ? "01012345678" : "01012345678"}
            className="w-full h-14 ps-12 pe-12 rounded-2xl border-2 border-border/80 bg-card text-[17px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-colors tabular-nums"
            autoComplete="off"
          />
          {search && (
            <button onClick={() => { setSearch(""); searchRef.current?.focus(); }}
              className="absolute end-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="w-full max-w-[480px]">
        {search.trim().length >= 2 && results.length === 0 && (
          <div className="text-center py-10">
            <p className="text-[13px] text-muted-foreground">{ar ? "لم يتم العثور على نتائج" : "No members found"}</p>
            <p className="text-[11px] text-muted-foreground/50 mt-1">{ar ? "تحقق من رقم الهاتف أو البريد الإلكتروني" : "Check the phone number or email"}</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="border border-border/40 rounded-xl overflow-hidden bg-background divide-y divide-border/25">
            {results.map(m => {
              const tm = TIER_META[m.tier];
              return (
                <button key={m.id} onClick={() => setSelectedMember(m)}
                  className="flex items-center gap-3.5 px-5 py-4 w-full text-start hover:bg-muted/20 transition-colors group">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[12px] font-bold text-white shrink-0" style={{ backgroundColor: m.avatarColor }}>
                    {initials(ar ? m.nameAr : m.nameEn)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[14px] font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {ar ? m.nameAr : m.nameEn}
                      </p>
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${tm.pill}`}>
                        {ar ? tm.ar : tm.en}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{m.phone} · {m.email}</p>
                  </div>
                  <div className="text-end shrink-0">
                    <p className="text-[14px] font-medium text-foreground tabular-nums">{fmtPts(m.currentPoints)}</p>
                    <p className="text-[10px] text-muted-foreground">{ar ? "نقطة" : "pts"}</p>
                  </div>
                  <ChevronRight size={16} strokeWidth={1.75} className="text-muted-foreground/30 group-hover:text-primary/50 transition-colors shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        {/* Hint when empty */}
        {search.trim().length < 2 && (
          <div className="text-center pt-4">
            <p className="text-[12px] text-muted-foreground/40">{ar ? "اكتب رقم الهاتف للبحث" : "Type a phone number to search"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
