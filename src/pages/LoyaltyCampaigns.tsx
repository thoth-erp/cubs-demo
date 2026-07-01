/**
 * Loyalty Campaigns — Time-bounded multiplier campaigns + automatic bonuses
 * حملات الولاء — حملات المضاعفات المحددة بوقت + المكافآت التلقائية
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "../context/LanguageContext";
import {
  loadLoyaltyRules,
  RULE_TYPE_META, RULE_STATUS_META,
  type LoyaltyRuleDemo, type RuleType, type RuleStatus,
} from "../data/loyalty";
import {
  Megaphone, Plus, Search, Calendar, Clock, X, Check,
  Cake, Gift, Zap, ArrowRight, ChevronRight,
  ToggleLeft, ToggleRight, Edit3, Trash2, Tag,
  TrendingUp, Star, AlertTriangle, Sparkles,
} from "lucide-react";

// ─── Campaign-specific demo data ─────────────────────────

interface CampaignDemo {
  id: string;
  nameEn: string;
  nameAr: string;
  type: "campaign" | "birthday" | "first_purchase";
  status: RuleStatus;
  descEn: string;
  descAr: string;
  multiplier?: number;
  pointsAwarded?: number;
  startsAt?: string;
  endsAt?: string;
  targetTiers?: string[];
  categoryFilter?: string[];
  estimatedImpactEn?: string;
  estimatedImpactAr?: string;
  createdAt: string;
}

const CAMPAIGNS: CampaignDemo[] = [
  {
    id: "cp-001",
    nameEn: "Eid Al-Adha Double Points",
    nameAr: "نقاط مضاعفة في عيد الأضحى",
    type: "campaign",
    status: "scheduled",
    descEn: "2x points on all purchases during Eid Al-Adha week.",
    descAr: "نقاط مضاعفة على جميع المشتريات خلال أسبوع عيد الأضحى.",
    multiplier: 2.0,
    startsAt: "2026-06-15T00:00:00Z",
    endsAt: "2026-06-22T23:59:59Z",
    targetTiers: ["bronze", "silver", "gold", "vip"],
    estimatedImpactEn: "~40 members eligible · est. 85,000 bonus pts",
    estimatedImpactAr: "~40 عضو مؤهل · ~85,000 نقطة إضافية تقديرية",
    createdAt: "2026-05-20T10:00:00Z",
  },
  {
    id: "cp-002",
    nameEn: "Ramadan Campaign 2026",
    nameAr: "حملة رمضان 2026",
    type: "campaign",
    status: "expired",
    descEn: "1.5x points during Ramadan 2026.",
    descAr: "1.5x نقاط خلال رمضان 2026.",
    multiplier: 1.5,
    startsAt: "2026-03-01T00:00:00Z",
    endsAt: "2026-03-30T23:59:59Z",
    targetTiers: ["bronze", "silver", "gold", "vip"],
    estimatedImpactEn: "Completed · 62,400 bonus pts awarded",
    estimatedImpactAr: "مكتملة · 62,400 نقطة إضافية تم منحها",
    createdAt: "2026-02-15T10:00:00Z",
  },
  {
    id: "cp-003",
    nameEn: "Summer Furniture Fest",
    nameAr: "مهرجان الأثاث الصيفي",
    type: "campaign",
    status: "active",
    descEn: "3x points on furniture category purchases all June.",
    descAr: "3x نقاط على مشتريات فئة الأثاث طوال شهر يونيو.",
    multiplier: 3.0,
    startsAt: "2026-06-01T00:00:00Z",
    endsAt: "2026-06-30T23:59:59Z",
    categoryFilter: ["Furniture", "Sofas", "Dining"],
    targetTiers: ["silver", "gold", "vip"],
    estimatedImpactEn: "6 members eligible · 14 days remaining",
    estimatedImpactAr: "6 أعضاء مؤهلون · 14 يوم متبقي",
    createdAt: "2026-05-28T10:00:00Z",
  },
  {
    id: "cp-004",
    nameEn: "Birthday Reward",
    nameAr: "مكافأة عيد الميلاد",
    type: "birthday",
    status: "active",
    descEn: "1,000 bonus points in the member's birthday month. Automatic.",
    descAr: "1,000 نقطة مكافأة في شهر عيد ميلاد العضو. تلقائي.",
    pointsAwarded: 1000,
    estimatedImpactEn: "Always active · 2 birthdays this month",
    estimatedImpactAr: "نشط دائماً · 2 عيد ميلاد هذا الشهر",
    createdAt: "2026-02-10T10:00:00Z",
  },
  {
    id: "cp-005",
    nameEn: "First Purchase Welcome",
    nameAr: "ترحيب بأول شراء",
    type: "first_purchase",
    status: "active",
    descEn: "500 bonus points on first ever purchase. One-time per member.",
    descAr: "500 نقطة مكافأة عند أول عملية شراء. مرة واحدة لكل عضو.",
    pointsAwarded: 500,
    estimatedImpactEn: "Always active · 3 new members this month",
    estimatedImpactAr: "نشط دائماً · 3 أعضاء جدد هذا الشهر",
    createdAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "cp-006",
    nameEn: "Gold Rush Weekend",
    nameAr: "عطلة نقاط ذهبية",
    type: "campaign",
    status: "active",
    descEn: "Gold & VIP members earn 2.5x points this weekend only.",
    descAr: "أعضاء الذهب و VIP يكسبون 2.5x نقاط هذا الأسبوع فقط.",
    multiplier: 2.5,
    startsAt: "2026-06-13T00:00:00Z",
    endsAt: "2026-06-15T23:59:59Z",
    targetTiers: ["gold", "vip"],
    estimatedImpactEn: "4 members eligible · ends in 4 days",
    estimatedImpactAr: "4 أعضاء مؤهلون · ينتهي خلال 4 أيام",
    createdAt: "2026-06-10T10:00:00Z",
  },
];

const CAMPAIGN_TYPE_META: Record<string, { en: string; ar: string; icon: React.ElementType; color: string; bg: string }> = {
  campaign:       { en: "Campaign",       ar: "حملة",     icon: Megaphone, color: "text-amber-600",   bg: "bg-amber-50" },
  birthday:       { en: "Birthday",       ar: "عيد ميلاد", icon: Cake,      color: "text-pink-600",    bg: "bg-pink-50" },
  first_purchase: { en: "First Purchase", ar: "أول شراء",  icon: Gift,      color: "text-violet-600",  bg: "bg-violet-50" },
};

// ─── Campaign Modal ──────────────────────────────────────

function CampaignModal({ campaign, ar, onClose, onSave }: {
  campaign?: CampaignDemo; ar: boolean; onClose: () => void;
  onSave: (data: Partial<CampaignDemo>) => void;
}) {
  const isEdit = !!campaign;
  const [nameEn, setNameEn] = useState(campaign?.nameEn || "");
  const [nameAr, setNameAr] = useState(campaign?.nameAr || "");
  const [type, setType] = useState<"campaign" | "birthday" | "first_purchase">(campaign?.type || "campaign");
  const [descEn, setDescEn] = useState(campaign?.descEn || "");
  const [descAr, setDescAr] = useState(campaign?.descAr || "");
  const [multiplier, setMultiplier] = useState(String(campaign?.multiplier || ""));
  const [pointsAwarded, setPointsAwarded] = useState(String(campaign?.pointsAwarded || ""));
  const [startsAt, setStartsAt] = useState(campaign?.startsAt?.split("T")[0] || "");
  const [endsAt, setEndsAt] = useState(campaign?.endsAt?.split("T")[0] || "");

  const inputCls = "w-full h-9 px-3 rounded-xl border border-border/80 bg-card text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors";
  const labelCls = "block text-[11px] font-medium text-muted-foreground mb-1.5";

  function handleSave() {
    if (!nameEn.trim()) return;
    onSave({
      nameEn: nameEn.trim(),
      nameAr: nameAr.trim(),
      type,
      descEn: descEn.trim(),
      descAr: descAr.trim(),
      multiplier: parseFloat(multiplier) || undefined,
      pointsAwarded: parseInt(pointsAwarded) || undefined,
      startsAt: startsAt ? `${startsAt}T00:00:00Z` : undefined,
      endsAt: endsAt ? `${endsAt}T23:59:59Z` : undefined,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-background border border-border/40 rounded-2xl shadow-2xl w-full max-w-[520px] max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between sticky top-0 bg-background z-10">
          <h2 className="text-[16px] font-medium" style={{ fontFamily: "var(--app-font-serif)" }}>
            {isEdit ? (ar ? "تعديل الحملة" : "Edit Campaign") : (ar ? "حملة جديدة" : "New Campaign")}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted"><X size={16} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Type selector */}
          <div>
            <label className={labelCls}>{ar ? "النوع" : "Type"}</label>
            <div className="grid grid-cols-3 gap-2">
              {(["campaign", "birthday", "first_purchase"] as const).map(t => {
                const meta = CAMPAIGN_TYPE_META[t];
                const Icon = meta.icon;
                return (
                  <button key={t} onClick={() => setType(t)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[11.5px] font-medium transition-all ${type === t ? "border-primary bg-primary/5 text-primary" : "border-border/60 bg-card text-muted-foreground hover:border-border"}`}>
                    <Icon size={13} />
                    {ar ? meta.ar : meta.en}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{ar ? "الاسم (EN)" : "Name (EN)"}</label>
              <input value={nameEn} onChange={e => setNameEn(e.target.value)} className={inputCls} placeholder="e.g. Summer Double Points" />
            </div>
            <div>
              <label className={labelCls}>{ar ? "الاسم (AR)" : "Name (AR)"}</label>
              <input value={nameAr} onChange={e => setNameAr(e.target.value)} className={inputCls} dir="rtl" placeholder="مثال: نقاط صيف مضاعفة" />
            </div>
          </div>

          {/* Description */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{ar ? "الوصف (EN)" : "Description (EN)"}</label>
              <textarea value={descEn} onChange={e => setDescEn(e.target.value)} rows={2}
                className={`${inputCls} h-auto py-2`} placeholder="What this campaign does..." />
            </div>
            <div>
              <label className={labelCls}>{ar ? "الوصف (AR)" : "Description (AR)"}</label>
              <textarea value={descAr} onChange={e => setDescAr(e.target.value)} rows={2}
                className={`${inputCls} h-auto py-2`} dir="rtl" placeholder="ماذا تفعل هذه الحملة..." />
            </div>
          </div>

          {/* Conditional: multiplier or bonus points */}
          {type === "campaign" ? (
            <div>
              <label className={labelCls}>{ar ? "معامل المضاعفة" : "Multiplier"}</label>
              <input type="number" step="0.1" min="1" value={multiplier} onChange={e => setMultiplier(e.target.value)}
                className={inputCls} placeholder="e.g. 2.0" />
              <p className="text-[10px] text-muted-foreground mt-1">{ar ? "1.0 = عادي، 2.0 = مضاعف" : "1.0 = normal, 2.0 = double"}</p>
            </div>
          ) : (
            <div>
              <label className={labelCls}>{ar ? "النقاط الممنوحة" : "Bonus Points"}</label>
              <input type="number" min="0" value={pointsAwarded} onChange={e => setPointsAwarded(e.target.value)}
                className={inputCls} placeholder="e.g. 1000" />
            </div>
          )}

          {/* Dates — only for campaign type */}
          {type === "campaign" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>{ar ? "تاريخ البداية" : "Start Date"}</label>
                <input type="date" value={startsAt} onChange={e => setStartsAt(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{ar ? "تاريخ النهاية" : "End Date"}</label>
                <input type="date" value={endsAt} onChange={e => setEndsAt(e.target.value)} className={inputCls} />
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border/40 flex justify-end gap-3 sticky bottom-0 bg-background">
          <button onClick={onClose} className="h-9 px-4 rounded-xl border border-border text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            {ar ? "إلغاء" : "Cancel"}
          </button>
          <button onClick={handleSave} disabled={!nameEn.trim()}
            className="h-9 px-5 rounded-xl bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-90 transition-opacity disabled:opacity-40">
            {isEdit ? (ar ? "حفظ" : "Save") : (ar ? "إنشاء" : "Create")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════

export default function LoyaltyCampaignsPage() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [, navigate] = useLocation();

  const [campaigns, setCampaigns] = useState<CampaignDemo[]>(CAMPAIGNS);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignDemo | undefined>();
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 2200); }

  const filtered = campaigns.filter(c => {
    if (filterType !== "all" && c.type !== filterType) return false;
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    return true;
  });

  const activeCampaigns = campaigns.filter(c => c.status === "active").length;
  const scheduledCampaigns = campaigns.filter(c => c.status === "scheduled").length;
  const timeBoundedActive = campaigns.filter(c => c.type === "campaign" && (c.status === "active" || c.status === "scheduled")).length;

  // Group: Active campaigns on top, then scheduled, then rest
  const sortedCampaigns = [...filtered].sort((a, b) => {
    const order: Record<string, number> = { active: 0, scheduled: 1, paused: 2, expired: 3 };
    return (order[a.status] || 9) - (order[b.status] || 9);
  });

  function handleSave(data: Partial<CampaignDemo>) {
    if (editingCampaign) {
      setCampaigns(prev => prev.map(c => c.id === editingCampaign.id ? { ...c, ...data } as CampaignDemo : c));
      showToast(ar ? "تم تحديث الحملة" : "Campaign updated");
    } else {
      const newCampaign: CampaignDemo = {
        id: `cp-${Date.now()}`,
        status: data.startsAt && new Date(data.startsAt) > new Date() ? "scheduled" : "active",
        createdAt: new Date().toISOString(),
        ...data,
      } as CampaignDemo;
      setCampaigns(prev => [newCampaign, ...prev]);
      showToast(ar ? "تم إنشاء الحملة" : "Campaign created");
    }
    setEditingCampaign(undefined);
  }

  function handleToggle(id: string) {
    setCampaigns(prev => prev.map(c => {
      if (c.id !== id) return c;
      const newStatus = c.status === "active" ? "paused" : "active";
      return { ...c, status: newStatus };
    }));
    showToast(ar ? "تم تغيير الحالة" : "Status updated");
  }

  function handleDelete(id: string) {
    setCampaigns(prev => prev.filter(c => c.id !== id));
    showToast(ar ? "تم حذف الحملة" : "Campaign deleted");
  }

  function daysLabel(start?: string, end?: string): string {
    if (!start || !end) return ar ? "بدون حد زمني" : "No time limit";
    const now = new Date();
    const s = new Date(start);
    const e = new Date(end);
    if (now < s) {
      const days = Math.ceil((s.getTime() - now.getTime()) / 86400000);
      return ar ? `يبدأ خلال ${days} يوم` : `Starts in ${days} days`;
    }
    if (now > e) return ar ? "انتهت" : "Ended";
    const remaining = Math.ceil((e.getTime() - now.getTime()) / 86400000);
    return ar ? `${remaining} يوم متبقي` : `${remaining} days left`;
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
            {ar ? "الحملات والمكافآت" : "Campaigns & Bonuses"}
          </h1>
        </div>
        <button onClick={() => { setEditingCampaign(undefined); setShowModal(true); }}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 transition-opacity">
          <Plus size={14} />{ar ? "حملة جديدة" : "New Campaign"}
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="border border-border/40 rounded-xl p-4 bg-background">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-muted-foreground">{ar ? "نشطة الآن" : "Active Now"}</span>
          </div>
          <p className="text-[22px] font-medium tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>{activeCampaigns}</p>
        </div>
        <div className="border border-border/40 rounded-xl p-4 bg-background">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-[10px] text-muted-foreground">{ar ? "مجدولة" : "Scheduled"}</span>
          </div>
          <p className="text-[22px] font-medium tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>{scheduledCampaigns}</p>
        </div>
        <div className="border border-border/40 rounded-xl p-4 bg-background">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={10} className="text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">{ar ? "حملات زمنية" : "Time-Bounded"}</span>
          </div>
          <p className="text-[22px] font-medium tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>{timeBoundedActive}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="h-9 px-3 rounded-xl border border-border/60 bg-card text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
          <option value="all">{ar ? "كل الأنواع" : "All Types"}</option>
          <option value="campaign">{ar ? "حملة" : "Campaign"}</option>
          <option value="birthday">{ar ? "عيد ميلاد" : "Birthday"}</option>
          <option value="first_purchase">{ar ? "أول شراء" : "First Purchase"}</option>
        </select>

        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="h-9 px-3 rounded-xl border border-border/60 bg-card text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
          <option value="all">{ar ? "كل الحالات" : "All Status"}</option>
          <option value="active">{ar ? "نشط" : "Active"}</option>
          <option value="scheduled">{ar ? "مجدول" : "Scheduled"}</option>
          <option value="expired">{ar ? "منتهي" : "Expired"}</option>
        </select>

        <span className="text-[11px] text-muted-foreground ms-auto">{filtered.length} {ar ? "حملة" : "campaigns"}</span>
      </div>

      {/* Campaign Cards */}
      <div className="space-y-3">
        {sortedCampaigns.length === 0 ? (
          <div className="py-14 text-center border border-border/40 rounded-xl">
            <Megaphone size={22} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-[13px] text-muted-foreground">{ar ? "لا توجد حملات" : "No campaigns found"}</p>
          </div>
        ) : sortedCampaigns.map(cp => {
          const tm = CAMPAIGN_TYPE_META[cp.type];
          const sm = RULE_STATUS_META[cp.status];
          const Icon = tm.icon;
          const isActive = cp.status === "active";
          const isScheduled = cp.status === "scheduled";

          return (
            <div key={cp.id}
              className={`border rounded-xl p-5 bg-background transition-all hover:shadow-sm group ${isActive ? "border-primary/25" : "border-border/40"}`}>
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tm.bg}`}>
                  <Icon size={18} className={tm.color} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[14px] font-medium truncate" style={{ fontFamily: "var(--app-font-serif)" }}>
                      {ar ? cp.nameAr : cp.nameEn}
                    </h3>
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${RULE_STATUS_META[cp.status].dot.replace("bg-", "text-")} bg-opacity-10`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
                      {ar ? sm.ar : sm.en}
                    </span>
                  </div>

                  <p className="text-[11.5px] text-muted-foreground mb-3">{ar ? cp.descAr : cp.descEn}</p>

                  {/* Metadata chips */}
                  <div className="flex flex-wrap items-center gap-2">
                    {cp.multiplier && (
                      <span className="text-[10px] font-medium px-2 py-1 rounded-lg bg-primary/5 text-primary flex items-center gap-1">
                        <Zap size={9} />{cp.multiplier}x {ar ? "مضاعفة" : "multiplier"}
                      </span>
                    )}
                    {cp.pointsAwarded && (
                      <span className="text-[10px] font-medium px-2 py-1 rounded-lg bg-violet-50 text-violet-700 flex items-center gap-1">
                        <Star size={9} />{cp.pointsAwarded.toLocaleString()} {ar ? "نقطة" : "pts"}
                      </span>
                    )}
                    {cp.startsAt && cp.endsAt && (
                      <span className="text-[10px] font-medium px-2 py-1 rounded-lg bg-muted/40 text-muted-foreground flex items-center gap-1">
                        <Calendar size={9} />
                        {new Date(cp.startsAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        {" – "}
                        {new Date(cp.endsAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    )}
                    {cp.startsAt && cp.endsAt && (
                      <span className={`text-[10px] px-2 py-1 rounded-lg flex items-center gap-1 ${isActive ? "bg-emerald-50 text-emerald-700" : isScheduled ? "bg-amber-50 text-amber-700" : "bg-muted text-muted-foreground"}`}>
                        <Clock size={9} />{daysLabel(cp.startsAt, cp.endsAt)}
                      </span>
                    )}
                    {cp.categoryFilter && (
                      <span className="text-[10px] font-medium px-2 py-1 rounded-lg bg-blue-50 text-blue-700 flex items-center gap-1">
                        <Tag size={9} />{cp.categoryFilter.join(", ")}
                      </span>
                    )}
                  </div>

                  {/* Estimated impact */}
                  {cp.estimatedImpactEn && (
                    <p className="text-[10px] text-muted-foreground/70 mt-2 flex items-center gap-1">
                      <TrendingUp size={9} />{ar ? cp.estimatedImpactAr : cp.estimatedImpactEn}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {cp.status !== "expired" && (
                    <button onClick={() => handleToggle(cp.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground" title={isActive ? "Pause" : "Activate"}>
                      {isActive ? <ToggleRight size={15} className="text-emerald-500" /> : <ToggleLeft size={15} />}
                    </button>
                  )}
                  <button onClick={() => { setEditingCampaign(cp); setShowModal(true); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground">
                    <Edit3 size={13} />
                  </button>
                  <button onClick={() => handleDelete(cp.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-rose-50 text-muted-foreground hover:text-rose-500">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Timeline visualization */}
      {campaigns.filter(c => c.type === "campaign" && c.startsAt && c.endsAt).length > 0 && (
        <div className="mt-8 bg-muted/15 border border-border/30 rounded-xl p-5">
          <h3 className="text-[13px] font-medium text-foreground mb-4" style={{ fontFamily: "var(--app-font-serif)" }}>
            {ar ? "الجدول الزمني للحملات" : "Campaign Timeline"}
          </h3>

          <div className="space-y-3">
            {campaigns.filter(c => c.type === "campaign" && c.startsAt && c.endsAt).sort((a, b) => new Date(a.startsAt!).getTime() - new Date(b.startsAt!).getTime()).map(cp => {
              const start = new Date(cp.startsAt!);
              const end = new Date(cp.endsAt!);
              const now = new Date();
              // Simple timeline bar relative to current month range
              const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
              const monthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
              const range = monthEnd.getTime() - monthStart.getTime();
              const left = Math.max(0, Math.min(100, ((start.getTime() - monthStart.getTime()) / range) * 100));
              const width = Math.max(3, Math.min(100 - left, ((end.getTime() - start.getTime()) / range) * 100));

              const isNowIn = now >= start && now <= end;

              return (
                <div key={cp.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10.5px] font-medium">{ar ? cp.nameAr : cp.nameEn}</span>
                    <span className="text-[9.5px] text-muted-foreground tabular-nums">
                      {start.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – {end.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <div className="h-3 bg-muted/30 rounded-full relative overflow-hidden">
                    <div
                      className={`absolute top-0 h-full rounded-full transition-all ${isNowIn ? "bg-primary" : cp.status === "expired" ? "bg-muted-foreground/25" : "bg-amber-400"}`}
                      style={{ left: `${left}%`, width: `${width}%` }}
                    />
                    {/* Now indicator */}
                    {(() => {
                      const nowPos = ((now.getTime() - monthStart.getTime()) / range) * 100;
                      return nowPos >= 0 && nowPos <= 100 ? (
                        <div className="absolute top-0 h-full w-px bg-foreground/40" style={{ left: `${nowPos}%` }} />
                      ) : null;
                    })()}
                  </div>
                </div>
              );
            })}
            <div className="flex justify-between text-[9px] text-muted-foreground/50 mt-1">
              <span>{new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</span>
              <span>{ar ? "اليوم" : "Today"}</span>
              <span>{new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick link */}
      <div className="mt-4 text-center">
        <button onClick={() => navigate("/loyalty/rules")} className="text-[11px] text-primary hover:underline flex items-center gap-1 mx-auto">
          {ar ? "إدارة كل القواعد" : "Manage all rules"}<ChevronRight size={11} />
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <CampaignModal
          campaign={editingCampaign}
          ar={ar}
          onClose={() => { setShowModal(false); setEditingCampaign(undefined); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
