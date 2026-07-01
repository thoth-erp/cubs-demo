/**
 * Loyalty Rules — Full CRUD rule management
 * قواعد الولاء — إدارة كاملة لقواعد اكتساب النقاط
 */

import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import {
  loadLoyaltyRules,
  RULE_TYPE_META, RULE_STATUS_META,
  type LoyaltyRuleDemo, type RuleType, type RuleStatus,
} from "../data/loyalty";
import {
  Plus, Search, Filter, Zap, X, Check,
  DollarSign, Tag, Gift, Cake, Megaphone, UserPlus, TrendingUp,
  Calendar, Clock, Edit3, Trash2, ToggleLeft, ToggleRight,
  ChevronDown, ArrowUpDown,
} from "lucide-react";

const RULE_ICONS: Record<string, React.ElementType> = {
  DollarSign, Tag, Gift, Cake, Megaphone, UserPlus, TrendingUp,
};

// ─── Add/Edit Rule Modal ──────────────────────────────────

function RuleModal({ rule, ar, onClose, onSave }: {
  rule?: LoyaltyRuleDemo; ar: boolean; onClose: () => void; onSave: (data: Partial<LoyaltyRuleDemo>) => void;
}) {
  const isEdit = !!rule;
  const [nameEn, setNameEn] = useState(rule?.nameEn || "");
  const [nameAr, setNameAr] = useState(rule?.nameAr || "");
  const [type, setType] = useState<RuleType>(rule?.type || "spend");
  const [descEn, setDescEn] = useState(rule?.descEn || "");
  const [descAr, setDescAr] = useState(rule?.descAr || "");
  const [pointsAwarded, setPointsAwarded] = useState(String(rule?.pointsAwarded || ""));
  const [multiplier, setMultiplier] = useState(String(rule?.multiplier || ""));
  const [minAmount, setMinAmount] = useState(String(rule?.minAmount || ""));
  const [startsAt, setStartsAt] = useState(rule?.startsAt?.split("T")[0] || "");
  const [endsAt, setEndsAt] = useState(rule?.endsAt?.split("T")[0] || "");

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
      pointsAwarded: pointsAwarded ? Number(pointsAwarded) : undefined,
      multiplier: multiplier ? Number(multiplier) : undefined,
      minAmount: minAmount ? Number(minAmount) : undefined,
      startsAt: startsAt || undefined,
      endsAt: endsAt || undefined,
    });
  }

  const showMultiplier = ["category_bonus", "campaign"].includes(type);
  const showDates = ["campaign"].includes(type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-background border border-border/40 rounded-2xl shadow-2xl w-full max-w-[540px] max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between sticky top-0 bg-background z-10">
          <h2 className="text-[16px] font-medium" style={{ fontFamily: "var(--app-font-serif)" }}>
            {isEdit ? (ar ? "تعديل القاعدة" : "Edit Rule") : (ar ? "قاعدة جديدة" : "New Rule")}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted"><X size={16} /></button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">
          {/* Type selector */}
          <div>
            <label className={labelCls}>{ar ? "نوع القاعدة" : "Rule Type"}</label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(RULE_TYPE_META) as RuleType[]).map(t => {
                const meta = RULE_TYPE_META[t];
                const Icon = RULE_ICONS[meta.icon] || Zap;
                const isActive = type === t;
                return (
                  <button key={t} onClick={() => setType(t)}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-[10px] font-medium transition-all ${
                      isActive ? "border-primary bg-primary/5 text-primary" : "border-border/40 text-muted-foreground hover:border-border hover:text-foreground"
                    }`}>
                    <Icon size={14} />
                    {ar ? meta.ar : meta.en}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Names */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{ar ? "الاسم (English)" : "Name (English)"}</label>
              <input value={nameEn} onChange={e => setNameEn(e.target.value)} className={inputCls} placeholder="e.g. Double Points Weekend" />
            </div>
            <div>
              <label className={labelCls}>{ar ? "الاسم (عربي)" : "Name (Arabic)"}</label>
              <input value={nameAr} onChange={e => setNameAr(e.target.value)} className={inputCls} dir="rtl" placeholder="مثال: نقاط مضاعفة" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>{ar ? "الوصف" : "Description"}</label>
            <textarea value={ar ? descAr : descEn} onChange={e => ar ? setDescAr(e.target.value) : setDescEn(e.target.value)} rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-border/80 bg-card text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 resize-none"
              placeholder={ar ? "وصف القاعدة..." : "Describe the rule..."} />
          </div>

          {/* Points / Multiplier / Min Amount */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>{ar ? "النقاط" : "Points"}</label>
              <input type="number" value={pointsAwarded} onChange={e => setPointsAwarded(e.target.value)} className={inputCls} placeholder="e.g. 100" />
            </div>
            {showMultiplier && (
              <div>
                <label className={labelCls}>{ar ? "المضاعف" : "Multiplier"}</label>
                <input type="number" step="0.25" value={multiplier} onChange={e => setMultiplier(e.target.value)} className={inputCls} placeholder="e.g. 1.5" />
              </div>
            )}
            <div>
              <label className={labelCls}>{ar ? "الحد الأدنى (ج.م)" : "Min Amount (EGP)"}</label>
              <input type="number" value={minAmount} onChange={e => setMinAmount(e.target.value)} className={inputCls} placeholder="e.g. 10" />
            </div>
          </div>

          {/* Campaign dates */}
          {showDates && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>{ar ? "يبدأ في" : "Starts At"}</label>
                <input type="date" value={startsAt} onChange={e => setStartsAt(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{ar ? "ينتهي في" : "Ends At"}</label>
                <input type="date" value={endsAt} onChange={e => setEndsAt(e.target.value)} className={inputCls} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/40 flex justify-end gap-3 sticky bottom-0 bg-background">
          <button onClick={onClose} className="h-9 px-4 rounded-xl border border-border text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            {ar ? "إلغاء" : "Cancel"}
          </button>
          <button onClick={handleSave} disabled={!nameEn.trim()}
            className="h-9 px-5 rounded-xl bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-2">
            <Check size={13} />{isEdit ? (ar ? "حفظ" : "Save") : (ar ? "إنشاء" : "Create Rule")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════

export default function LoyaltyRulesPage() {
  const { lang } = useLanguage();
  const ar = lang === "ar";

  const [rules, setRules] = useState<LoyaltyRuleDemo[]>(loadLoyaltyRules);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<RuleType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<RuleStatus | "all">("all");
  const [showModal, setShowModal] = useState(false);
  const [editRule, setEditRule] = useState<LoyaltyRuleDemo | undefined>(undefined);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 2200); }

  const filtered = rules.filter(r => {
    if (filterType !== "all" && r.type !== filterType) return false;
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.nameEn.toLowerCase().includes(q) || r.nameAr.includes(search) || r.descEn.toLowerCase().includes(q);
    }
    return true;
  });

  const activeCount = rules.filter(r => r.status === "active").length;
  const scheduledCount = rules.filter(r => r.status === "scheduled").length;

  function handleSaveRule(data: Partial<LoyaltyRuleDemo>) {
    if (editRule) {
      setRules(prev => prev.map(r => r.id === editRule.id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r));
      showToast(ar ? "تم حفظ التعديلات" : "Rule updated");
    } else {
      const newRule: LoyaltyRuleDemo = {
        id: `lr-${Date.now()}`,
        nameEn: data.nameEn || "",
        nameAr: data.nameAr || "",
        type: data.type || "spend",
        status: "active",
        descEn: data.descEn || "",
        descAr: data.descAr || "",
        pointsAwarded: data.pointsAwarded,
        multiplier: data.multiplier,
        minAmount: data.minAmount,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        priority: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setRules(prev => [...prev, newRule]);
      showToast(ar ? "تم إنشاء القاعدة" : "Rule created");
    }
    setShowModal(false);
    setEditRule(undefined);
  }

  function toggleRuleStatus(id: string) {
    setRules(prev => prev.map(r => {
      if (r.id !== id) return r;
      const next: RuleStatus = r.status === "active" ? "paused" : "active";
      return { ...r, status: next, updatedAt: new Date().toISOString() };
    }));
    showToast(ar ? "تم تحديث الحالة" : "Status updated");
  }

  function deleteRule(id: string) {
    setRules(prev => prev.filter(r => r.id !== id));
    showToast(ar ? "تم حذف القاعدة" : "Rule deleted");
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
            {ar ? "قواعد الاكتساب" : "Earning Rules"}
          </h1>
          <p className="text-[12px] text-muted-foreground mt-1">
            {activeCount} {ar ? "نشط" : "active"} · {scheduledCount} {ar ? "مجدول" : "scheduled"} · {rules.length} {ar ? "إجمالي" : "total"}
          </p>
        </div>
        <button onClick={() => { setEditRule(undefined); setShowModal(true); }}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 transition-opacity">
          <Plus size={14} />{ar ? "قاعدة جديدة" : "New Rule"}
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={ar ? "بحث القواعد..." : "Search rules..."}
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-border/60 bg-card text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        <select value={filterType} onChange={e => setFilterType(e.target.value as RuleType | "all")}
          className="h-9 px-3 rounded-xl border border-border/60 bg-card text-[12px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
          <option value="all">{ar ? "كل الأنواع" : "All Types"}</option>
          {(Object.keys(RULE_TYPE_META) as RuleType[]).map(t => (
            <option key={t} value={t}>{ar ? RULE_TYPE_META[t].ar : RULE_TYPE_META[t].en}</option>
          ))}
        </select>

        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as RuleStatus | "all")}
          className="h-9 px-3 rounded-xl border border-border/60 bg-card text-[12px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
          <option value="all">{ar ? "كل الحالات" : "All Status"}</option>
          {(Object.keys(RULE_STATUS_META) as RuleStatus[]).map(s => (
            <option key={s} value={s}>{ar ? RULE_STATUS_META[s].ar : RULE_STATUS_META[s].en}</option>
          ))}
        </select>
      </div>

      {/* Rules List */}
      <div className="border border-border/40 rounded-xl overflow-hidden bg-background divide-y divide-border/25">
        {filtered.length === 0 ? (
          <div className="py-14 text-center">
            <Zap size={22} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-[13px] text-muted-foreground">{ar ? "لا توجد قواعد مطابقة" : "No rules match your filters"}</p>
          </div>
        ) : filtered.map(rule => {
          const typeMeta = RULE_TYPE_META[rule.type];
          const statusMeta = RULE_STATUS_META[rule.status];
          const Icon = RULE_ICONS[typeMeta.icon] || Zap;

          return (
            <div key={rule.id} className="px-5 py-4 flex items-start gap-4 hover:bg-muted/15 transition-colors group">
              {/* Icon */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${rule.status === "active" ? "bg-primary/8" : "bg-muted/50"}`}>
                <Icon size={16} strokeWidth={1.75} className={rule.status === "active" ? "text-primary" : "text-muted-foreground"} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${typeMeta.pill}`}>
                    {ar ? typeMeta.ar : typeMeta.en}
                  </span>
                  <h4 className="text-[13px] font-medium text-foreground truncate">
                    {ar ? rule.nameAr : rule.nameEn}
                  </h4>
                </div>
                <p className="text-[11.5px] text-muted-foreground line-clamp-1 mb-1.5">
                  {ar ? rule.descAr : rule.descEn}
                </p>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60">
                  {rule.pointsAwarded && <span>{rule.pointsAwarded} {ar ? "نقطة" : "pts"}</span>}
                  {rule.multiplier && <span>{rule.multiplier}x</span>}
                  {rule.minAmount && <span>{ar ? "الحد الأدنى:" : "Min:"} {rule.minAmount.toLocaleString()} {ar ? "ج.م" : "EGP"}</span>}
                  {rule.startsAt && (
                    <span className="flex items-center gap-1">
                      <Calendar size={9} />
                      {new Date(rule.startsAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      {rule.endsAt && ` — ${new Date(rule.endsAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock size={9} />
                    {ar ? "تحديث:" : "Updated:"} {new Date(rule.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                </div>
              </div>

              {/* Status + actions */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                  <span className={`text-[11px] font-medium ${rule.status === "active" ? "text-emerald-600" : rule.status === "scheduled" ? "text-amber-600" : "text-muted-foreground"}`}>
                    {ar ? statusMeta.ar : statusMeta.en}
                  </span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ms-2">
                  <button onClick={() => toggleRuleStatus(rule.id)} title={rule.status === "active" ? "Pause" : "Activate"}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    {rule.status === "active" ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                  </button>
                  <button onClick={() => { setEditRule(rule); setShowModal(true); }} title="Edit"
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    <Edit3 size={13} />
                  </button>
                  <button onClick={() => deleteRule(rule.id)} title="Delete"
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-rose-50 text-muted-foreground hover:text-rose-500 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* How Rules Work */}
      <div className="mt-6 bg-muted/20 border border-border/30 rounded-xl p-5">
        <h3 className="text-[13px] font-medium text-foreground mb-2" style={{ fontFamily: "var(--app-font-serif)" }}>
          {ar ? "كيف تعمل القواعد" : "How Rules Work"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] text-muted-foreground">
          <div>
            <p className="font-medium text-foreground mb-0.5">{ar ? "الأولوية" : "Priority"}</p>
            <p>{ar ? "القواعد ذات الأولوية الأعلى تُفحص أولاً. الحملات تتجاوز القواعد الأساسية." : "Higher priority rules are checked first. Campaigns override base rules."}</p>
          </div>
          <div>
            <p className="font-medium text-foreground mb-0.5">{ar ? "التراكم" : "Stacking"}</p>
            <p>{ar ? "مضاعفات الفئات تتراكم مع قاعدة الإنفاق الأساسية." : "Category multipliers stack with the base spend rule."}</p>
          </div>
          <div>
            <p className="font-medium text-foreground mb-0.5">{ar ? "التطبيق" : "Application"}</p>
            <p>{ar ? "يتم تطبيق القواعد تلقائيًا عند كل عملية شراء عبر جميع القنوات." : "Rules are applied automatically on every purchase across all channels."}</p>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <RuleModal
          rule={editRule}
          ar={ar}
          onClose={() => { setShowModal(false); setEditRule(undefined); }}
          onSave={handleSaveRule}
        />
      )}
    </div>
  );
}
