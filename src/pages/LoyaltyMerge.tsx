/**
 * Loyalty Customer Merge Tool — Deduplicate & merge loyalty profiles
 * أداة دمج العملاء — إزالة التكرار ودمج ملفات الولاء
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "../context/LanguageContext";
import {
  loadLoyaltyMembers, TIER_META, TIER_ORDER,
  fmtPts, fmtCurrency,
  type LoyaltyMemberDemo, type LoyaltyTierSlug,
} from "../data/loyalty";
import {
  Users, Search, GitMerge, Check, X, AlertTriangle,
  ChevronRight, Phone, Mail, ShoppingBag, ArrowRight,
  Crown, Shield, Star, Eye,
} from "lucide-react";

// ─── Potential duplicate detection ──────────────────────

interface DuplicateCandidate {
  id: string;
  member1: LoyaltyMemberDemo;
  member2: LoyaltyMemberDemo;
  matchReason: string;
  matchReasonAr: string;
  confidence: "high" | "medium" | "low";
  status: "pending" | "merged" | "dismissed";
}

function detectDuplicates(members: LoyaltyMemberDemo[]): DuplicateCandidate[] {
  const candidates: DuplicateCandidate[] = [];

  // Demo duplicates for illustration — in production this runs server-side
  // with Levenshtein on names, phone normalization, email domain matching

  // Simulated potential duplicates based on demo data patterns:
  if (members.length >= 7) {
    candidates.push({
      id: "dup-001",
      member1: members[2], // Omar Farouk
      member2: members[6], // Karim Mostafa
      matchReason: "Similar order patterns + overlapping categories (Office, Desks)",
      matchReasonAr: "أنماط طلبات متشابهة + تداخل في الفئات (مكتب، مكاتب)",
      confidence: "low",
      status: "pending",
    });
  }

  // Add a high-confidence match for demo
  if (members.length >= 6) {
    candidates.push({
      id: "dup-002",
      member1: members[4], // Youssef Nabil
      member2: { ...members[4], id: "lm-phantom", nameEn: "Youssef N.", nameAr: "يوسف ن.", email: "y.nabil@email.com", phone: "01156781235", currentPoints: 450, lifetimePoints: 1200, totalSpend: 1100, orderCount: 2, memberNumber: "LYL-00099", tier: "bronze" as LoyaltyTierSlug, redeemedPoints: 500, expiredPoints: 250, lastPurchaseAt: "2026-04-10", avatarColor: "#EF4444", favoriteCategories: ["Living Room"] },
      matchReason: "Name fuzzy match (Youssef Nabil ↔ Youssef N.) + same phone prefix",
      matchReasonAr: "تطابق تقريبي للاسم (يوسف نبيل ↔ يوسف ن.) + نفس بداية الهاتف",
      confidence: "high",
      status: "pending",
    });
  }

  if (members.length >= 4) {
    candidates.push({
      id: "dup-003",
      member1: members[3], // Fatima Hassan
      member2: { ...members[3], id: "lm-phantom2", nameEn: "Fatima H.", nameAr: "فاطمة ح.", email: "fatima.hassan@gmail.com", phone: "01087654322", currentPoints: 200, lifetimePoints: 600, totalSpend: 580, orderCount: 1, memberNumber: "LYL-00088", tier: "bronze" as LoyaltyTierSlug, redeemedPoints: 0, expiredPoints: 0, lastPurchaseAt: "2026-05-20", avatarColor: "#F59E0B", favoriteCategories: ["Textiles"] },
      matchReason: "Name match (Fatima Hassan ↔ Fatima H.) + similar email",
      matchReasonAr: "تطابق الاسم (فاطمة حسن ↔ فاطمة ح.) + بريد مشابه",
      confidence: "medium",
      status: "pending",
    });
  }

  return candidates;
}

// ─── Merge Preview ───────────────────────────────────────

function MergePreviewModal({ candidate, ar, onClose, onMerge, onDismiss }: {
  candidate: DuplicateCandidate; ar: boolean;
  onClose: () => void; onMerge: () => void; onDismiss: () => void;
}) {
  const m1 = candidate.member1;
  const m2 = candidate.member2;
  const t1 = TIER_META[m1.tier];
  const t2 = TIER_META[m2.tier];

  // Merge result: keep higher tier, sum points/spend, keep older record as primary
  const mergedTier = TIER_ORDER.indexOf(m1.tier) >= TIER_ORDER.indexOf(m2.tier) ? m1.tier : m2.tier;
  const mergedPoints = m1.currentPoints + m2.currentPoints;
  const mergedLifetime = m1.lifetimePoints + m2.lifetimePoints;
  const mergedSpend = m1.totalSpend + m2.totalSpend;
  const mergedOrders = m1.orderCount + m2.orderCount;
  const mt = TIER_META[mergedTier];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-background border border-border/40 rounded-2xl shadow-2xl w-full max-w-[600px] max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between sticky top-0 bg-background z-10">
          <h2 className="text-[16px] font-medium flex items-center gap-2" style={{ fontFamily: "var(--app-font-serif)" }}>
            <GitMerge size={16} className="text-primary" />
            {ar ? "معاينة الدمج" : "Merge Preview"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted"><X size={16} /></button>
        </div>

        <div className="px-6 py-5">
          {/* Two profiles side by side */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            {[{ m: m1, t: t1, label: ar ? "الملف الأول (أساسي)" : "Profile A (Primary)" }, { m: m2, t: t2, label: ar ? "الملف الثاني" : "Profile B" }].map(({ m, t, label }, i) => (
              <div key={i} className="border border-border/40 rounded-xl p-4">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide mb-2">{label}</p>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-semibold text-white" style={{ background: m.avatarColor }}>
                    {m.nameEn.split(" ").map(w => w[0]).join("")}
                  </div>
                  <div>
                    <p className="text-[12px] font-medium">{ar ? m.nameAr : m.nameEn}</p>
                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${t.pill}`}>{ar ? t.ar : t.en}</span>
                  </div>
                </div>
                <div className="space-y-1 text-[10.5px]">
                  <div className="flex items-center gap-2 text-muted-foreground"><Mail size={9} />{m.email}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Phone size={9} />{m.phone}</div>
                  <div className="flex justify-between mt-2 pt-2 border-t border-border/20">
                    <span className="text-muted-foreground">{ar ? "النقاط" : "Points"}</span>
                    <span className="font-medium">{fmtPts(m.currentPoints)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{ar ? "الإنفاق" : "Spend"}</span>
                    <span className="font-medium">{fmtCurrency(m.totalSpend)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{ar ? "الطلبات" : "Orders"}</span>
                    <span className="font-medium">{m.orderCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Arrow + merged result */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px flex-1 bg-border/40" />
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <GitMerge size={14} className="text-primary" />
            </div>
            <div className="h-px flex-1 bg-border/40" />
          </div>

          {/* Merged result */}
          <div className="border-2 border-primary/30 rounded-xl p-5 bg-primary/3">
            <p className="text-[9px] text-primary uppercase tracking-wide font-medium mb-3">{ar ? "النتيجة بعد الدمج" : "Merged Result"}</p>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[12px] font-semibold text-white" style={{ background: m1.avatarColor }}>
                {m1.nameEn.split(" ").map(w => w[0]).join("")}
              </div>
              <div>
                <p className="text-[14px] font-medium" style={{ fontFamily: "var(--app-font-serif)" }}>{ar ? m1.nameAr : m1.nameEn}</p>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${mt.pill}`}>{ar ? mt.ar : mt.en}</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {[
                { label: ar ? "النقاط" : "Points", value: fmtPts(mergedPoints), color: "text-primary" },
                { label: ar ? "الإنفاق" : "Spend", value: fmtCurrency(mergedSpend), color: "text-foreground" },
                { label: ar ? "الطلبات" : "Orders", value: String(mergedOrders), color: "text-foreground" },
                { label: ar ? "المستوى" : "Tier", value: ar ? mt.ar : mt.en, color: "text-foreground" },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                  <p className={`text-[14px] font-medium tabular-nums ${item.color}`} style={{ fontFamily: "var(--app-font-serif)" }}>{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-primary/15 text-[10px] text-muted-foreground space-y-1">
              <p>• {ar ? "يتم الاحتفاظ بجميع المعاملات من كلا الملفين" : "All transactions from both profiles are preserved"}</p>
              <p>• {ar ? "بيانات الاتصال: يتم الاحتفاظ بالبريد والهاتف من كلا الملفين" : "Contact info: email & phone from both profiles are kept"}</p>
              <p>• {ar ? "يتم استخدام المستوى الأعلى" : "Higher tier is applied"}</p>
              <p>• {ar ? "الملف الثاني يتم إلغاء تفعيله (لا يُحذف)" : "Profile B is deactivated (not deleted)"}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border/40 flex items-center justify-between sticky bottom-0 bg-background">
          <button onClick={onDismiss}
            className="h-9 px-4 rounded-xl border border-border text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1.5">
            <X size={12} />{ar ? "ليس تكرار" : "Not a Duplicate"}
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="h-9 px-4 rounded-xl border border-border text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              {ar ? "إلغاء" : "Cancel"}
            </button>
            <button onClick={onMerge}
              className="h-9 px-5 rounded-xl bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
              <GitMerge size={13} />{ar ? "تأكيد الدمج" : "Confirm Merge"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════

export default function LoyaltyMergePage() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [, navigate] = useLocation();

  const members = loadLoyaltyMembers();
  const [candidates, setCandidates] = useState<DuplicateCandidate[]>(() => detectDuplicates(members));
  const [selectedCandidate, setSelectedCandidate] = useState<DuplicateCandidate | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 2200); }

  const pending = candidates.filter(c => c.status === "pending");
  const merged = candidates.filter(c => c.status === "merged");
  const dismissed = candidates.filter(c => c.status === "dismissed");

  function handleMerge() {
    if (!selectedCandidate) return;
    setCandidates(prev => prev.map(c => c.id === selectedCandidate.id ? { ...c, status: "merged" as const } : c));
    setSelectedCandidate(null);
    showToast(ar ? "تم دمج الملفات بنجاح" : "Profiles merged successfully");
  }

  function handleDismiss() {
    if (!selectedCandidate) return;
    setCandidates(prev => prev.map(c => c.id === selectedCandidate.id ? { ...c, status: "dismissed" as const } : c));
    setSelectedCandidate(null);
    showToast(ar ? "تم تجاهل التكرار" : "Duplicate dismissed");
  }

  const confMeta = {
    high: { en: "High", ar: "عالي", color: "text-rose-600", bg: "bg-rose-50 border-rose-200" },
    medium: { en: "Medium", ar: "متوسط", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
    low: { en: "Low", ar: "منخفض", color: "text-muted-foreground", bg: "bg-muted border-border/40" },
  };

  return (
    <div className="min-h-full py-8 px-7 md:px-10 max-w-[960px] mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-xl bg-foreground text-background text-[13px] font-medium shadow-lg flex items-center gap-2">
          <Check size={14} />{toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <p className="text-[11px] text-muted-foreground/60 tracking-[0.08em] uppercase mb-2">{ar ? "برنامج الولاء" : "Loyalty Program"}</p>
        <h1 className="text-[26px] font-medium text-foreground leading-tight" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.025em" }}>
          {ar ? "دمج العملاء" : "Customer Merge"}
        </h1>
        <p className="text-[12px] text-muted-foreground mt-1">{ar ? "اكتشاف ودمج الملفات المكررة في برنامج الولاء" : "Detect and merge duplicate loyalty profiles"}</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="border border-border/40 rounded-xl p-4 bg-background">
          <AlertTriangle size={14} className="text-amber-500 mb-2" />
          <p className="text-[20px] font-medium tabular-nums text-amber-600" style={{ fontFamily: "var(--app-font-serif)" }}>{pending.length}</p>
          <p className="text-[10px] text-muted-foreground">{ar ? "تكرار محتمل" : "Pending Review"}</p>
        </div>
        <div className="border border-border/40 rounded-xl p-4 bg-background">
          <GitMerge size={14} className="text-emerald-500 mb-2" />
          <p className="text-[20px] font-medium tabular-nums text-emerald-600" style={{ fontFamily: "var(--app-font-serif)" }}>{merged.length}</p>
          <p className="text-[10px] text-muted-foreground">{ar ? "تم الدمج" : "Merged"}</p>
        </div>
        <div className="border border-border/40 rounded-xl p-4 bg-background">
          <X size={14} className="text-muted-foreground mb-2" />
          <p className="text-[20px] font-medium tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>{dismissed.length}</p>
          <p className="text-[10px] text-muted-foreground">{ar ? "تم التجاهل" : "Dismissed"}</p>
        </div>
      </div>

      {/* Candidates list */}
      <div className="space-y-3">
        {pending.length === 0 && merged.length === 0 && dismissed.length === 0 ? (
          <div className="py-14 text-center border border-border/40 rounded-xl">
            <Users size={22} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-[13px] text-muted-foreground">{ar ? "لا توجد تكرارات محتملة" : "No potential duplicates found"}</p>
          </div>
        ) : (
          <>
            {/* Pending */}
            {pending.length > 0 && (
              <div>
                <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">{ar ? "يحتاج مراجعة" : "Needs Review"}</h3>
                {pending.map(c => {
                  const cm = confMeta[c.confidence];
                  return (
                    <button key={c.id} onClick={() => setSelectedCandidate(c)}
                      className="w-full border border-border/40 rounded-xl p-4 bg-background hover:border-primary/30 hover:shadow-sm transition-all mb-2 text-start">
                      <div className="flex items-center gap-4">
                        {/* Two avatars overlapping */}
                        <div className="relative w-12 h-9 shrink-0">
                          <div className="absolute left-0 top-0 w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-semibold text-white border-2 border-background z-10" style={{ background: c.member1.avatarColor }}>
                            {c.member1.nameEn.split(" ").map(w => w[0]).join("")}
                          </div>
                          <div className="absolute left-4 top-1 w-7 h-7 rounded-lg flex items-center justify-center text-[8px] font-semibold text-white border-2 border-background" style={{ background: c.member2.avatarColor }}>
                            {c.member2.nameEn.split(" ").map(w => w[0]).join("")}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-[12px] font-medium">{ar ? c.member1.nameAr : c.member1.nameEn}</p>
                            <ArrowRight size={10} className="text-muted-foreground/40" />
                            <p className="text-[12px] font-medium">{ar ? c.member2.nameAr : c.member2.nameEn}</p>
                          </div>
                          <p className="text-[10.5px] text-muted-foreground truncate">{ar ? c.matchReasonAr : c.matchReason}</p>
                        </div>

                        <span className={`text-[9px] font-semibold px-2 py-1 rounded-full border ${cm.bg} ${cm.color}`}>
                          {ar ? cm.ar : cm.en}
                        </span>

                        <ChevronRight size={14} className="text-muted-foreground/30" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Resolved */}
            {(merged.length > 0 || dismissed.length > 0) && (
              <div className="mt-4">
                <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">{ar ? "تم المعالجة" : "Resolved"}</h3>
                {[...merged, ...dismissed].map(c => (
                  <div key={c.id} className="border border-border/25 rounded-xl p-3 bg-muted/10 mb-2 opacity-60">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${c.status === "merged" ? "bg-emerald-50" : "bg-muted/50"}`}>
                        {c.status === "merged" ? <GitMerge size={11} className="text-emerald-500" /> : <X size={11} className="text-muted-foreground" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground flex-1">
                        {ar ? c.member1.nameAr : c.member1.nameEn} ↔ {ar ? c.member2.nameAr : c.member2.nameEn}
                      </p>
                      <span className="text-[9px] text-muted-foreground">{c.status === "merged" ? (ar ? "مدمج" : "Merged") : (ar ? "مُتجاهل" : "Dismissed")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* How it works */}
      <div className="mt-6 bg-muted/15 border border-border/30 rounded-xl p-5">
        <h3 className="text-[13px] font-medium text-foreground mb-3" style={{ fontFamily: "var(--app-font-serif)" }}>
          {ar ? "كيف يعمل الدمج" : "How Merge Works"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[10.5px]">
          <div className="flex gap-2">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">1</div>
            <div>
              <p className="font-medium text-foreground">{ar ? "الكشف" : "Detection"}</p>
              <p className="text-muted-foreground">{ar ? "مطابقة بالاسم والهاتف والبريد مع تحليل أنماط الشراء" : "Fuzzy matching on name, phone, email + purchase pattern analysis"}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">2</div>
            <div>
              <p className="font-medium text-foreground">{ar ? "المراجعة" : "Review"}</p>
              <p className="text-muted-foreground">{ar ? "مراجعة كل حالة يدوياً مع معاينة النتيجة قبل الدمج" : "Manual review with merge preview before confirming"}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">3</div>
            <div>
              <p className="font-medium text-foreground">{ar ? "الدمج" : "Merge"}</p>
              <p className="text-muted-foreground">{ar ? "تجميع النقاط والمعاملات، المستوى الأعلى، إلغاء الملف المكرر" : "Sum points & transactions, keep higher tier, deactivate duplicate"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Merge Preview Modal */}
      {selectedCandidate && (
        <MergePreviewModal
          candidate={selectedCandidate}
          ar={ar}
          onClose={() => setSelectedCandidate(null)}
          onMerge={handleMerge}
          onDismiss={handleDismiss}
        />
      )}
    </div>
  );
}
