/**
 * Loyalty Rewards Catalog — Redeemable rewards management
 * كتالوج مكافآت الولاء — إدارة المكافآت القابلة للاستبدال
 */

import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { TIER_META, fmtPts, fmtCurrency, type LoyaltyTierSlug } from "../data/loyalty";
import {
  Gift, Plus, Search, X, Check, Star, Tag,
  Edit3, Trash2, ToggleLeft, ToggleRight,
  Sparkles, Percent, ShoppingBag, Truck,
  Crown, Package, Coffee, Palette,
} from "lucide-react";

// ─── Types & Demo Data ───────────────────────────────────

type RewardType = "discount" | "free_product" | "free_shipping" | "experience" | "upgrade";
type RewardStatus = "active" | "paused" | "out_of_stock";

interface RewardItem {
  id: string;
  nameEn: string;
  nameAr: string;
  type: RewardType;
  status: RewardStatus;
  descEn: string;
  descAr: string;
  pointsCost: number;
  discountValue?: number;
  discountPct?: number;
  minTier: LoyaltyTierSlug;
  stock?: number;
  totalRedeemed: number;
  imageEmoji: string;
}

const REWARD_TYPE_META: Record<RewardType, { en: string; ar: string; icon: React.ElementType; color: string; bg: string }> = {
  discount:      { en: "Discount",      ar: "خصم",         icon: Percent,     color: "text-emerald-600",  bg: "bg-emerald-50" },
  free_product:  { en: "Free Product",  ar: "منتج مجاني",  icon: Package,     color: "text-violet-600",   bg: "bg-violet-50" },
  free_shipping: { en: "Free Shipping", ar: "شحن مجاني",   icon: Truck,       color: "text-blue-600",     bg: "bg-blue-50" },
  experience:    { en: "Experience",    ar: "تجربة",       icon: Sparkles,    color: "text-amber-600",    bg: "bg-amber-50" },
  upgrade:       { en: "Tier Upgrade",  ar: "ترقية مستوى", icon: Crown,       color: "text-pink-600",     bg: "bg-pink-50" },
};

const STATUS_META: Record<RewardStatus, { en: string; ar: string; dot: string }> = {
  active:       { en: "Active",       ar: "نشط",      dot: "bg-emerald-500" },
  paused:       { en: "Paused",       ar: "متوقف",    dot: "bg-muted-foreground/40" },
  out_of_stock: { en: "Out of Stock", ar: "نفد المخزون", dot: "bg-rose-400" },
};

const REWARDS: RewardItem[] = [
  {
    id: "rw-001", nameEn: "10% Off Next Order", nameAr: "خصم 10% على الطلب القادم",
    type: "discount", status: "active",
    descEn: "Get 10% off your next purchase (max EGP 500).", descAr: "خصم 10% على مشترياتك القادمة (حد أقصى 500 ج.م).",
    pointsCost: 2000, discountPct: 10, minTier: "bronze", totalRedeemed: 24, imageEmoji: "🏷️",
  },
  {
    id: "rw-002", nameEn: "EGP 100 Voucher", nameAr: "قسيمة 100 ج.م",
    type: "discount", status: "active",
    descEn: "Fixed EGP 100 discount on any order over EGP 500.", descAr: "خصم ثابت 100 ج.م على أي طلب أكثر من 500 ج.م.",
    pointsCost: 5000, discountValue: 100, minTier: "bronze", totalRedeemed: 18, imageEmoji: "💰",
  },
  {
    id: "rw-003", nameEn: "Free Cushion Set", nameAr: "طقم وسائد مجاني",
    type: "free_product", status: "active",
    descEn: "Complimentary 3-piece cushion set in your choice of color.", descAr: "طقم وسائد 3 قطع مجاني بلونك المفضل.",
    pointsCost: 8000, minTier: "silver", stock: 15, totalRedeemed: 7, imageEmoji: "🛋️",
  },
  {
    id: "rw-004", nameEn: "Free Delivery", nameAr: "توصيل مجاني",
    type: "free_shipping", status: "active",
    descEn: "Free delivery on your next order anywhere in Egypt.", descAr: "توصيل مجاني على طلبك القادم في أي مكان في مصر.",
    pointsCost: 3000, minTier: "bronze", totalRedeemed: 32, imageEmoji: "🚚",
  },
  {
    id: "rw-005", nameEn: "Interior Design Consultation", nameAr: "استشارة تصميم داخلي",
    type: "experience", status: "active",
    descEn: "30-minute virtual consultation with our design team.", descAr: "استشارة افتراضية 30 دقيقة مع فريق التصميم لدينا.",
    pointsCost: 15000, minTier: "gold", stock: 5, totalRedeemed: 3, imageEmoji: "🎨",
  },
  {
    id: "rw-006", nameEn: "Priority Delivery", nameAr: "توصيل أولوية",
    type: "experience", status: "active",
    descEn: "Jump the delivery queue — next-day delivery on your next order.", descAr: "تخطي طابور التوصيل — توصيل في اليوم التالي على طلبك القادم.",
    pointsCost: 5000, minTier: "silver", totalRedeemed: 11, imageEmoji: "⚡",
  },
  {
    id: "rw-007", nameEn: "VIP Tier Fast-Track", nameAr: "ترقية سريعة لـ VIP",
    type: "upgrade", status: "active",
    descEn: "Instant upgrade to VIP tier for 6 months (if Gold or above).", descAr: "ترقية فورية لمستوى VIP لمدة 6 أشهر (للذهبي وأعلى).",
    pointsCost: 30000, minTier: "gold", stock: 3, totalRedeemed: 1, imageEmoji: "👑",
  },
  {
    id: "rw-008", nameEn: "Seasonal Gift Box", nameAr: "صندوق هدايا موسمي",
    type: "free_product", status: "out_of_stock",
    descEn: "Curated gift box with seasonal home accessories.", descAr: "صندوق هدايا مختار من إكسسوارات المنزل الموسمية.",
    pointsCost: 12000, minTier: "silver", stock: 0, totalRedeemed: 10, imageEmoji: "🎁",
  },
];

// ─── Reward Modal ────────────────────────────────────────

function RewardModal({ reward, ar, onClose, onSave }: {
  reward?: RewardItem; ar: boolean; onClose: () => void;
  onSave: (data: Partial<RewardItem>) => void;
}) {
  const isEdit = !!reward;
  const [nameEn, setNameEn] = useState(reward?.nameEn || "");
  const [nameAr, setNameAr] = useState(reward?.nameAr || "");
  const [type, setType] = useState<RewardType>(reward?.type || "discount");
  const [descEn, setDescEn] = useState(reward?.descEn || "");
  const [descAr, setDescAr] = useState(reward?.descAr || "");
  const [pointsCost, setPointsCost] = useState(String(reward?.pointsCost || ""));
  const [discountValue, setDiscountValue] = useState(String(reward?.discountValue || ""));
  const [discountPct, setDiscountPct] = useState(String(reward?.discountPct || ""));
  const [minTier, setMinTier] = useState<LoyaltyTierSlug>(reward?.minTier || "bronze");
  const [stock, setStock] = useState(String(reward?.stock ?? ""));

  const inputCls = "w-full h-9 px-3 rounded-xl border border-border/80 bg-card text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors";
  const labelCls = "block text-[11px] font-medium text-muted-foreground mb-1.5";

  function handleSave() {
    if (!nameEn.trim() || !pointsCost) return;
    onSave({
      nameEn: nameEn.trim(),
      nameAr: nameAr.trim(),
      type,
      descEn: descEn.trim(),
      descAr: descAr.trim(),
      pointsCost: parseInt(pointsCost) || 0,
      discountValue: parseFloat(discountValue) || undefined,
      discountPct: parseFloat(discountPct) || undefined,
      minTier,
      stock: stock ? parseInt(stock) : undefined,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-background border border-border/40 rounded-2xl shadow-2xl w-full max-w-[520px] max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between sticky top-0 bg-background z-10">
          <h2 className="text-[16px] font-medium" style={{ fontFamily: "var(--app-font-serif)" }}>
            {isEdit ? (ar ? "تعديل المكافأة" : "Edit Reward") : (ar ? "مكافأة جديدة" : "New Reward")}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted"><X size={16} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Type */}
          <div>
            <label className={labelCls}>{ar ? "النوع" : "Type"}</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(REWARD_TYPE_META) as RewardType[]).slice(0, 3).map(t => {
                const meta = REWARD_TYPE_META[t];
                const Icon = meta.icon;
                return (
                  <button key={t} onClick={() => setType(t)}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-[10.5px] font-medium transition-all ${type === t ? "border-primary bg-primary/5 text-primary" : "border-border/60 bg-card text-muted-foreground hover:border-border"}`}>
                    <Icon size={11} />{ar ? meta.ar : meta.en}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {(Object.keys(REWARD_TYPE_META) as RewardType[]).slice(3).map(t => {
                const meta = REWARD_TYPE_META[t];
                const Icon = meta.icon;
                return (
                  <button key={t} onClick={() => setType(t)}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-[10.5px] font-medium transition-all ${type === t ? "border-primary bg-primary/5 text-primary" : "border-border/60 bg-card text-muted-foreground hover:border-border"}`}>
                    <Icon size={11} />{ar ? meta.ar : meta.en}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{ar ? "الاسم (EN)" : "Name (EN)"}</label>
              <input value={nameEn} onChange={e => setNameEn(e.target.value)} className={inputCls} placeholder="e.g. 10% Off" />
            </div>
            <div>
              <label className={labelCls}>{ar ? "الاسم (AR)" : "Name (AR)"}</label>
              <input value={nameAr} onChange={e => setNameAr(e.target.value)} className={inputCls} dir="rtl" placeholder="خصم 10%" />
            </div>
          </div>

          {/* Description */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Description (EN)</label>
              <textarea value={descEn} onChange={e => setDescEn(e.target.value)} rows={2} className={`${inputCls} h-auto py-2`} />
            </div>
            <div>
              <label className={labelCls}>{ar ? "الوصف (AR)" : "Description (AR)"}</label>
              <textarea value={descAr} onChange={e => setDescAr(e.target.value)} rows={2} className={`${inputCls} h-auto py-2`} dir="rtl" />
            </div>
          </div>

          {/* Points + Value */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>{ar ? "تكلفة النقاط" : "Points Cost"}</label>
              <input type="number" value={pointsCost} onChange={e => setPointsCost(e.target.value)} className={inputCls} placeholder="5000" />
            </div>
            {type === "discount" && (
              <>
                <div>
                  <label className={labelCls}>{ar ? "قيمة ثابتة" : "Fixed Value"}</label>
                  <input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} className={inputCls} placeholder="EGP" />
                </div>
                <div>
                  <label className={labelCls}>{ar ? "نسبة مئوية" : "Percentage"}</label>
                  <input type="number" value={discountPct} onChange={e => setDiscountPct(e.target.value)} className={inputCls} placeholder="%" />
                </div>
              </>
            )}
            {type !== "discount" && (
              <div>
                <label className={labelCls}>{ar ? "المخزون" : "Stock"}</label>
                <input type="number" value={stock} onChange={e => setStock(e.target.value)} className={inputCls} placeholder={ar ? "فارغ = غير محدود" : "Empty = unlimited"} />
              </div>
            )}
          </div>

          {/* Min tier */}
          <div>
            <label className={labelCls}>{ar ? "الحد الأدنى للمستوى" : "Minimum Tier"}</label>
            <div className="grid grid-cols-4 gap-2">
              {(["bronze", "silver", "gold", "vip"] as LoyaltyTierSlug[]).map(t => {
                const tm = TIER_META[t];
                return (
                  <button key={t} onClick={() => setMinTier(t)}
                    className={`flex items-center justify-center gap-1 px-2 py-2 rounded-xl border text-[10px] font-medium transition-all ${minTier === t ? `border-2 ${tm.pill}` : "border-border/60 bg-card text-muted-foreground"}`}>
                    {ar ? tm.ar : tm.en}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border/40 flex justify-end gap-3 sticky bottom-0 bg-background">
          <button onClick={onClose} className="h-9 px-4 rounded-xl border border-border text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            {ar ? "إلغاء" : "Cancel"}
          </button>
          <button onClick={handleSave} disabled={!nameEn.trim() || !pointsCost}
            className="h-9 px-5 rounded-xl bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-90 transition-opacity disabled:opacity-40">
            {isEdit ? (ar ? "حفظ" : "Save") : (ar ? "إنشاء" : "Create")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════

export default function LoyaltyRewardsPage() {
  const { lang } = useLanguage();
  const ar = lang === "ar";

  const [rewards, setRewards] = useState<RewardItem[]>(REWARDS);
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingReward, setEditingReward] = useState<RewardItem | undefined>();
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 2200); }

  const filtered = rewards.filter(r => {
    if (filterType !== "all" && r.type !== filterType) return false;
    if (search.length >= 2) {
      const q = search.toLowerCase();
      return r.nameEn.toLowerCase().includes(q) || r.nameAr.includes(q);
    }
    return true;
  });

  const activeRewards = rewards.filter(r => r.status === "active").length;
  const totalRedeemed = rewards.reduce((s, r) => s + r.totalRedeemed, 0);

  function handleSave(data: Partial<RewardItem>) {
    if (editingReward) {
      setRewards(prev => prev.map(r => r.id === editingReward.id ? { ...r, ...data } as RewardItem : r));
      showToast(ar ? "تم تحديث المكافأة" : "Reward updated");
    } else {
      const newReward: RewardItem = {
        id: `rw-${Date.now()}`,
        status: "active",
        totalRedeemed: 0,
        imageEmoji: "🎁",
        ...data,
      } as RewardItem;
      setRewards(prev => [newReward, ...prev]);
      showToast(ar ? "تمت إضافة المكافأة" : "Reward added");
    }
    setEditingReward(undefined);
  }

  function handleToggle(id: string) {
    setRewards(prev => prev.map(r => {
      if (r.id !== id) return r;
      return { ...r, status: r.status === "active" ? "paused" : "active" as RewardStatus };
    }));
    showToast(ar ? "تم تغيير الحالة" : "Status updated");
  }

  function handleDelete(id: string) {
    setRewards(prev => prev.filter(r => r.id !== id));
    showToast(ar ? "تم حذف المكافأة" : "Reward removed");
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
            {ar ? "كتالوج المكافآت" : "Rewards Catalog"}
          </h1>
        </div>
        <button onClick={() => { setEditingReward(undefined); setShowModal(true); }}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 transition-opacity">
          <Plus size={14} />{ar ? "مكافأة جديدة" : "New Reward"}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="border border-border/40 rounded-xl p-4 bg-background">
          <Gift size={14} className="text-primary mb-2" />
          <p className="text-[20px] font-medium tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>{rewards.length}</p>
          <p className="text-[10px] text-muted-foreground">{ar ? "إجمالي المكافآت" : "Total Rewards"}</p>
        </div>
        <div className="border border-border/40 rounded-xl p-4 bg-background">
          <Star size={14} className="text-emerald-500 mb-2" />
          <p className="text-[20px] font-medium tabular-nums text-emerald-600" style={{ fontFamily: "var(--app-font-serif)" }}>{activeRewards}</p>
          <p className="text-[10px] text-muted-foreground">{ar ? "نشطة" : "Active"}</p>
        </div>
        <div className="border border-border/40 rounded-xl p-4 bg-background">
          <Tag size={14} className="text-violet-500 mb-2" />
          <p className="text-[20px] font-medium tabular-nums text-violet-600" style={{ fontFamily: "var(--app-font-serif)" }}>{totalRedeemed}</p>
          <p className="text-[10px] text-muted-foreground">{ar ? "مرات الاستبدال" : "Times Redeemed"}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-[240px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={ar ? "بحث..." : "Search rewards..."}
            className="w-full h-9 pl-8 pr-3 rounded-xl border border-border/60 bg-card text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="h-9 px-3 rounded-xl border border-border/60 bg-card text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
          <option value="all">{ar ? "كل الأنواع" : "All Types"}</option>
          {(Object.keys(REWARD_TYPE_META) as RewardType[]).map(t => (
            <option key={t} value={t}>{ar ? REWARD_TYPE_META[t].ar : REWARD_TYPE_META[t].en}</option>
          ))}
        </select>
        <span className="text-[11px] text-muted-foreground ms-auto">{filtered.length} {ar ? "مكافأة" : "rewards"}</span>
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.length === 0 ? (
          <div className="col-span-2 py-14 text-center border border-border/40 rounded-xl">
            <Gift size={22} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-[13px] text-muted-foreground">{ar ? "لا توجد مكافآت" : "No rewards found"}</p>
          </div>
        ) : filtered.map(rw => {
          const tm = REWARD_TYPE_META[rw.type];
          const sm = STATUS_META[rw.status];
          const tierMeta = TIER_META[rw.minTier];
          const Icon = tm.icon;
          const isActive = rw.status === "active";

          return (
            <div key={rw.id}
              className={`border rounded-xl bg-background overflow-hidden transition-all hover:shadow-sm group ${isActive ? "border-border/40" : "border-border/25 opacity-75"}`}>
              {/* Header strip */}
              <div className={`px-5 py-3 ${tm.bg} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className="text-[20px]">{rw.imageEmoji}</span>
                  <div>
                    <h3 className="text-[13px] font-medium text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>
                      {ar ? rw.nameAr : rw.nameEn}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${tm.bg} ${tm.color}`}>
                        {ar ? tm.ar : tm.en}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
                        <span className="text-[9px] text-muted-foreground">{ar ? sm.ar : sm.en}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleToggle(rw.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/60" title={isActive ? "Pause" : "Activate"}>
                    {isActive ? <ToggleRight size={14} className="text-emerald-500" /> : <ToggleLeft size={14} className="text-muted-foreground" />}
                  </button>
                  <button onClick={() => { setEditingReward(rw); setShowModal(true); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/60 text-muted-foreground"><Edit3 size={12} /></button>
                  <button onClick={() => handleDelete(rw.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-rose-100 text-muted-foreground hover:text-rose-500"><Trash2 size={12} /></button>
                </div>
              </div>

              {/* Body */}
              <div className="px-5 py-3.5">
                <p className="text-[11px] text-muted-foreground mb-3 line-clamp-2">{ar ? rw.descAr : rw.descEn}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-[18px] font-medium text-primary tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>{fmtPts(rw.pointsCost)}</p>
                      <p className="text-[9px] text-muted-foreground">{ar ? "نقطة" : "points"}</p>
                    </div>
                    {rw.discountValue && (
                      <div className="text-center px-2 border-l border-border/30">
                        <p className="text-[14px] font-medium text-emerald-600 tabular-nums">{fmtCurrency(rw.discountValue)}</p>
                        <p className="text-[9px] text-muted-foreground">{ar ? "خصم" : "off"}</p>
                      </div>
                    )}
                    {rw.discountPct && (
                      <div className="text-center px-2 border-l border-border/30">
                        <p className="text-[14px] font-medium text-emerald-600 tabular-nums">{rw.discountPct}%</p>
                        <p className="text-[9px] text-muted-foreground">{ar ? "خصم" : "off"}</p>
                      </div>
                    )}
                  </div>

                  <div className="text-end">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${tierMeta.pill}`}>{ar ? tierMeta.ar : tierMeta.en}+</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[9.5px] text-muted-foreground">
                      {rw.stock !== undefined && <span>{rw.stock} {ar ? "متبقي" : "left"}</span>}
                      <span>{rw.totalRedeemed} {ar ? "مستبدل" : "redeemed"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <RewardModal
          reward={editingReward}
          ar={ar}
          onClose={() => { setShowModal(false); setEditingReward(undefined); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
