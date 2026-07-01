/**
 * Loyalty Redemptions — History + Online Discount Code Generation
 * استبدال الولاء — السجل + إنشاء أكواد الخصم
 */

import { useState, useCallback } from "react";
import { useLanguage } from "../context/LanguageContext";
import {
  loadLoyaltyMembers, loadLoyaltyTransactions,
  TIER_META, fmtPts, fmtCurrency,
  type LoyaltyMemberDemo,
} from "../data/loyalty";
import {
  Gift, Search, Ticket, Check, X, Copy, Clock,
  ShoppingBag, Store, ChevronRight, User,
  CheckCircle2, XCircle, AlertTriangle, Loader2,
  ArrowRight, ExternalLink, QrCode,
} from "lucide-react";

// ─── Demo redemption data ────────────────────────────────

interface RedemptionRecord {
  id: string;
  memberId: string;
  memberName: string;
  channel: "online" | "offline";
  pointsRedeemed: number;
  discountAmount: number;
  discountCode?: string;
  status: "active" | "used" | "expired" | "cancelled";
  shopifyOrderId?: string;
  staffName?: string;
  expiresAt?: string;
  createdAt: string;
}

const DEMO_REDEMPTIONS: RedemptionRecord[] = [
  { id: "rd-001", memberId: "lm-002", memberName: "Sara Al-Rashid", channel: "online", pointsRedeemed: 10000, discountAmount: 100, discountCode: "THOTH-LM00-R1A2B3", status: "used", shopifyOrderId: "SHP-4528", createdAt: "2026-06-04T12:00:00Z" },
  { id: "rd-002", memberId: "lm-001", memberName: "Ahmed Mohamed", channel: "online", pointsRedeemed: 2000, discountAmount: 20, discountCode: "THOTH-LM00-X4Y5Z6", status: "active", expiresAt: "2026-07-04T12:00:00Z", createdAt: "2026-06-03T10:15:00Z" },
  { id: "rd-003", memberId: "lm-005", memberName: "Youssef Nabil", channel: "offline", pointsRedeemed: 5000, discountAmount: 50, status: "used", staffName: "Hana Khalil", createdAt: "2026-06-02T14:30:00Z" },
  { id: "rd-004", memberId: "lm-002", memberName: "Sara Al-Rashid", channel: "offline", pointsRedeemed: 10000, discountAmount: 100, status: "used", staffName: "Hana Khalil", createdAt: "2026-06-04T12:00:00Z" },
  { id: "rd-005", memberId: "lm-008", memberName: "Nour El-Din", channel: "online", pointsRedeemed: 3000, discountAmount: 30, discountCode: "THOTH-LM00-W7V8U9", status: "expired", expiresAt: "2026-05-25T00:00:00Z", createdAt: "2026-04-25T10:00:00Z" },
  { id: "rd-006", memberId: "lm-003", memberName: "Omar Farouk", channel: "online", pointsRedeemed: 1500, discountAmount: 15, discountCode: "THOTH-LM00-K1L2M3", status: "active", expiresAt: "2026-07-10T00:00:00Z", createdAt: "2026-06-10T09:00:00Z" },
];

const STATUS_META: Record<string, { en: string; ar: string; dot: string; pill: string }> = {
  active:    { en: "Active",    ar: "نشط",     dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700" },
  used:      { en: "Used",      ar: "مستخدم",   dot: "bg-primary",     pill: "bg-primary/10 text-primary" },
  expired:   { en: "Expired",   ar: "منتهي",    dot: "bg-muted-foreground/40", pill: "bg-muted text-muted-foreground" },
  cancelled: { en: "Cancelled", ar: "ملغي",     dot: "bg-rose-400",    pill: "bg-rose-50 text-rose-600" },
};

// ─── Generate Code Modal ─────────────────────────────────

function GenerateCodeModal({ ar, members, onClose, onGenerate }: {
  ar: boolean;
  members: LoyaltyMemberDemo[];
  onClose: () => void;
  onGenerate: (memberId: string, points: number) => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<LoyaltyMemberDemo | null>(null);
  const [points, setPoints] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const filtered = search.length >= 2
    ? members.filter(m =>
        m.nameEn.toLowerCase().includes(search.toLowerCase()) ||
        m.phone.includes(search) ||
        m.email.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const numPoints = parseInt(points) || 0;
  const discount = numPoints / 100; // 1000 pts = 10 EGP
  const isValid = selectedMember && numPoints >= 500 && numPoints <= (selectedMember?.currentPoints || 0);

  function handleGenerate() {
    if (!selectedMember || !isValid) return;
    setGenerating(true);
    // Simulate code generation
    setTimeout(() => {
      const code = `THOTH-${selectedMember.id.substring(3, 7).toUpperCase()}-${Date.now().toString(36).toUpperCase().substring(0, 6)}`;
      setGeneratedCode(code);
      setGenerating(false);
      onGenerate(selectedMember.id, numPoints);
    }, 1200);
  }

  function handleCopy() {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-background border border-border/40 rounded-2xl shadow-2xl w-full max-w-[480px] max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between sticky top-0 bg-background z-10">
          <h2 className="text-[16px] font-medium" style={{ fontFamily: "var(--app-font-serif)" }}>
            {ar ? "إنشاء كود خصم" : "Generate Discount Code"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted"><X size={16} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {!generatedCode ? (
            <>
              {/* Member search */}
              {!selectedMember ? (
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">{ar ? "ابحث عن العضو" : "Search Member"}</label>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                    <input value={search} onChange={e => setSearch(e.target.value)} autoFocus
                      placeholder={ar ? "اسم، هاتف، أو بريد..." : "Name, phone, or email..."}
                      className="w-full h-10 pl-9 pr-3 rounded-xl border border-border/80 bg-card text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  {filtered.length > 0 && (
                    <div className="mt-2 border border-border/40 rounded-xl overflow-hidden divide-y divide-border/25 max-h-[200px] overflow-y-auto">
                      {filtered.map(m => {
                        const tier = TIER_META[m.tier];
                        return (
                          <button key={m.id} onClick={() => setSelectedMember(m)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/15 transition-colors text-start">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-semibold text-white" style={{ background: m.avatarColor }}>
                              {m.nameEn.split(" ").map(w => w[0]).join("")}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-medium truncate">{ar ? m.nameAr : m.nameEn}</p>
                              <p className="text-[10px] text-muted-foreground">{m.phone}</p>
                            </div>
                            <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${tier.pill}`}>{fmtPts(m.currentPoints)} {ar ? "نقطة" : "pts"}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Selected member */}
                  <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-semibold text-white" style={{ background: selectedMember.avatarColor }}>
                      {selectedMember.nameEn.split(" ").map(w => w[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium">{ar ? selectedMember.nameAr : selectedMember.nameEn}</p>
                      <p className="text-[10.5px] text-muted-foreground">{fmtPts(selectedMember.currentPoints)} {ar ? "نقطة متاحة" : "points available"}</p>
                    </div>
                    <button onClick={() => setSelectedMember(null)} className="text-[10px] text-primary hover:underline">{ar ? "تغيير" : "Change"}</button>
                  </div>

                  {/* Points input */}
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">{ar ? "النقاط للاستبدال" : "Points to Redeem"}</label>
                    <input type="number" value={points} onChange={e => setPoints(e.target.value)}
                      placeholder={ar ? "مثال: 5000" : "e.g. 5000"} min={500} max={selectedMember.currentPoints}
                      className="w-full h-10 px-3.5 rounded-xl border border-border/80 bg-card text-[15px] font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    <p className="text-[10px] text-muted-foreground mt-1">{ar ? "الحد الأدنى 500 نقطة" : "Minimum 500 points"} · {ar ? "الحد الأقصى" : "Max"} {fmtPts(selectedMember.currentPoints)}</p>
                  </div>

                  {/* Discount preview */}
                  {numPoints >= 500 && (
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
                      <p className="text-[10px] text-muted-foreground mb-1">{ar ? "قيمة الخصم" : "Discount Value"}</p>
                      <p className="text-[28px] font-medium text-primary tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>{fmtCurrency(discount)}</p>
                      <p className="text-[10.5px] text-muted-foreground mt-1">
                        {fmtPts(numPoints)} {ar ? "نقطة" : "pts"} → {fmtCurrency(discount)} {ar ? "خصم على شوبيفاي" : "Shopify discount"}
                      </p>
                    </div>
                  )}

                  {numPoints > (selectedMember?.currentPoints || 0) && (
                    <p className="text-[11px] text-rose-500 flex items-center gap-1">
                      <AlertTriangle size={11} />{ar ? "رصيد غير كافي" : "Insufficient balance"}
                    </p>
                  )}
                </>
              )}
            </>
          ) : (
            /* Generated code display */
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-emerald-500" />
              </div>
              <p className="text-[14px] font-medium mb-1" style={{ fontFamily: "var(--app-font-serif)" }}>
                {ar ? "تم إنشاء كود الخصم" : "Discount Code Generated"}
              </p>
              <p className="text-[11px] text-muted-foreground mb-4">
                {ar ? "صالح لمدة 30 يوم · استخدام واحد" : "Valid for 30 days · Single use"}
              </p>

              <div className="bg-muted/30 border border-border/40 rounded-xl p-4 mb-4">
                <p className="text-[10px] text-muted-foreground mb-2">{ar ? "كود الخصم" : "Discount Code"}</p>
                <div className="flex items-center justify-center gap-3">
                  <code className="text-[20px] font-bold font-mono tracking-wider text-foreground">{generatedCode}</code>
                  <button onClick={handleCopy}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                </div>
                <p className="text-[12px] text-primary font-medium mt-2">{fmtCurrency(discount)} {ar ? "خصم" : "off"}</p>
              </div>

              <p className="text-[10.5px] text-muted-foreground">
                {ar ? "يمكن للعميل إدخال هذا الكود في صفحة الدفع على شوبيفاي" : "Customer can enter this code at Shopify checkout"}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!generatedCode ? (
          <div className="px-6 py-4 border-t border-border/40 flex justify-end gap-3 sticky bottom-0 bg-background">
            <button onClick={onClose} className="h-9 px-4 rounded-xl border border-border text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              {ar ? "إلغاء" : "Cancel"}
            </button>
            <button onClick={handleGenerate} disabled={!isValid || generating}
              className="h-9 px-5 rounded-xl bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-2">
              {generating ? <Loader2 size={13} className="animate-spin" /> : <Ticket size={13} />}
              {ar ? "إنشاء الكود" : "Generate Code"}
            </button>
          </div>
        ) : (
          <div className="px-6 py-4 border-t border-border/40 flex justify-center sticky bottom-0 bg-background">
            <button onClick={onClose} className="h-9 px-6 rounded-xl bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-90 transition-opacity">
              {ar ? "تم" : "Done"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════

export default function LoyaltyRedemptionsPage() {
  const { lang } = useLanguage();
  const ar = lang === "ar";

  const members = loadLoyaltyMembers();
  const [redemptions, setRedemptions] = useState<RedemptionRecord[]>(DEMO_REDEMPTIONS);
  const [filterChannel, setFilterChannel] = useState<"all" | "online" | "offline">("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showGenerate, setShowGenerate] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 2200); }

  const filtered = redemptions.filter(r => {
    if (filterChannel !== "all" && r.channel !== filterChannel) return false;
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    return true;
  });

  const activeCount = redemptions.filter(r => r.status === "active").length;
  const totalRedeemed = redemptions.reduce((s, r) => s + r.pointsRedeemed, 0);
  const totalDiscount = redemptions.reduce((s, r) => s + r.discountAmount, 0);
  const onlineCount = redemptions.filter(r => r.channel === "online").length;

  function handleGenerate(memberId: string, points: number) {
    const member = members.find(m => m.id === memberId);
    const newRedemption: RedemptionRecord = {
      id: `rd-${Date.now()}`,
      memberId,
      memberName: member?.nameEn || "",
      channel: "online",
      pointsRedeemed: points,
      discountAmount: points / 100,
      discountCode: `THOTH-${memberId.substring(3, 7).toUpperCase()}-${Date.now().toString(36).toUpperCase().substring(0, 6)}`,
      status: "active",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };
    setRedemptions(prev => [newRedemption, ...prev]);
    showToast(ar ? "تم إنشاء كود الخصم" : "Discount code generated");
  }

  return (
    <div className="min-h-full py-8 px-7 md:px-10 max-w-[960px] mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-xl bg-foreground text-background text-[13px] font-medium shadow-lg flex items-center gap-2">
          <Check size={14} />{toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[11px] text-muted-foreground/60 tracking-[0.08em] uppercase mb-2">{ar ? "برنامج الولاء" : "Loyalty Program"}</p>
          <h1 className="text-[26px] font-medium text-foreground leading-tight" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.025em" }}>
            {ar ? "الاستبدال" : "Redemptions"}
          </h1>
        </div>
        <button onClick={() => setShowGenerate(true)}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 transition-opacity">
          <Ticket size={14} />{ar ? "كود خصم جديد" : "New Discount Code"}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { value: String(redemptions.length), label: ar ? "إجمالي الاستبدال" : "Total Redemptions", icon: Gift, color: "text-foreground" },
          { value: fmtPts(totalRedeemed), label: ar ? "نقاط مستبدلة" : "Points Redeemed", icon: Gift, color: "text-primary" },
          { value: fmtCurrency(totalDiscount), label: ar ? "خصومات" : "Discounts Given", icon: Ticket, color: "text-emerald-600" },
          { value: `${activeCount}`, label: ar ? "أكواد نشطة" : "Active Codes", icon: CheckCircle2, color: "text-amber-500" },
        ].map((c, i) => (
          <div key={i} className="border border-border/40 rounded-xl p-4 bg-background">
            <c.icon size={14} className={`${c.color} mb-2`} />
            <p className={`text-[20px] font-medium tabular-nums ${c.color}`} style={{ fontFamily: "var(--app-font-serif)" }}>{c.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <select value={filterChannel} onChange={e => setFilterChannel(e.target.value as any)}
          className="h-9 px-3 rounded-xl border border-border/60 bg-card text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
          <option value="all">{ar ? "كل القنوات" : "All Channels"}</option>
          <option value="online">{ar ? "أونلاين" : "Online"}</option>
          <option value="offline">{ar ? "المتجر" : "In-Store"}</option>
        </select>

        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="h-9 px-3 rounded-xl border border-border/60 bg-card text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
          <option value="all">{ar ? "كل الحالات" : "All Status"}</option>
          <option value="active">{ar ? "نشط" : "Active"}</option>
          <option value="used">{ar ? "مستخدم" : "Used"}</option>
          <option value="expired">{ar ? "منتهي" : "Expired"}</option>
        </select>

        <span className="text-[11px] text-muted-foreground ms-auto">{filtered.length} {ar ? "عملية" : "redemptions"}</span>
      </div>

      {/* Redemptions List */}
      <div className="border border-border/40 rounded-xl overflow-hidden bg-background divide-y divide-border/25">
        {filtered.length === 0 ? (
          <div className="py-14 text-center">
            <Gift size={22} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-[13px] text-muted-foreground">{ar ? "لا توجد عمليات استبدال" : "No redemptions found"}</p>
          </div>
        ) : filtered.map(rd => {
          const sm = STATUS_META[rd.status];
          return (
            <div key={rd.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/10 transition-colors">
              {/* Channel icon */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${rd.channel === "online" ? "bg-violet-50" : "bg-amber-50"}`}>
                {rd.channel === "online" ? <ShoppingBag size={15} className="text-violet-500" /> : <Store size={15} className="text-amber-600" />}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${sm.pill}`}>{ar ? sm.ar : sm.en}</span>
                  <p className="text-[13px] font-medium truncate">{rd.memberName}</p>
                </div>
                <div className="flex items-center gap-3 text-[10.5px] text-muted-foreground">
                  <span>{fmtPts(rd.pointsRedeemed)} {ar ? "نقطة" : "pts"} → {fmtCurrency(rd.discountAmount)}</span>
                  {rd.discountCode && <code className="font-mono text-[9.5px] bg-muted/30 px-1.5 py-0.5 rounded">{rd.discountCode}</code>}
                  {rd.staffName && <span>{rd.staffName}</span>}
                  {rd.shopifyOrderId && <span>{rd.shopifyOrderId}</span>}
                </div>
              </div>

              {/* Date + expiry */}
              <div className="text-end shrink-0">
                <p className="text-[11px] text-foreground tabular-nums">
                  {new Date(rd.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </p>
                {rd.expiresAt && rd.status === "active" && (
                  <p className="text-[9.5px] text-muted-foreground flex items-center gap-1 justify-end mt-0.5">
                    <Clock size={8} />{ar ? "ينتهي" : "Expires"} {new Date(rd.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* How Online Redemption Works */}
      <div className="mt-6 bg-muted/20 border border-border/30 rounded-xl p-5">
        <h3 className="text-[13px] font-medium text-foreground mb-3" style={{ fontFamily: "var(--app-font-serif)" }}>
          {ar ? "كيف يعمل الاستبدال الأونلاين" : "How Online Redemption Works"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { step: "1", titleEn: "Generate Code", titleAr: "إنشاء الكود", descEn: "Staff or system generates a unique discount code from member points.", descAr: "الموظف أو النظام ينشئ كود خصم فريد من نقاط العضو." },
            { step: "2", titleEn: "Share with Customer", titleAr: "مشاركة مع العميل", descEn: "Code is shared via SMS, WhatsApp, or email.", descAr: "يتم مشاركة الكود عبر رسالة أو واتساب أو بريد." },
            { step: "3", titleEn: "Apply at Checkout", titleAr: "التطبيق عند الدفع", descEn: "Customer enters code at Shopify checkout.", descAr: "العميل يدخل الكود في صفحة الدفع." },
            { step: "4", titleEn: "Earn New Points", titleAr: "اكتساب نقاط جديدة", descEn: "Order completes → new points earned on remaining amount.", descAr: "الطلب يكتمل → نقاط جديدة على المبلغ المتبقي." },
          ].map(s => (
            <div key={s.step} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">{s.step}</div>
              <div>
                <p className="text-[11px] font-medium text-foreground mb-0.5">{ar ? s.titleAr : s.titleEn}</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{ar ? s.descAr : s.descEn}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generate Modal */}
      {showGenerate && (
        <GenerateCodeModal
          ar={ar}
          members={members}
          onClose={() => setShowGenerate(false)}
          onGenerate={handleGenerate}
        />
      )}
    </div>
  );
}
