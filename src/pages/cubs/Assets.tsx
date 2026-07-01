/**
 * Assets — CUBS equipment & fixed assets tracker.
 *
 * Tracks machinery, tools, fixtures and other capital items.
 * Each asset has: name, category, purchase date, cost, depreciation,
 * maintenance schedule, status, and location.
 */

import { useMemo, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import {
  Wrench, Plus, Search, Trash2, Edit3, AlertTriangle, Calendar,
  MapPin, DollarSign, Activity,
} from "lucide-react";

interface Asset {
  id: string;
  name: string;
  nameAr: string;
  category: string;
  categoryAr: string;
  serialNumber: string;
  purchaseDate: string;
  cost: number;
  currentValue: number;
  location: string;
  locationAr: string;
  status: "active" | "maintenance" | "retired";
  lastMaintenance: string;
  nextMaintenance: string;
  notes: string;
  notesAr: string;
  createdAt: string;
}

const CATEGORIES = [
  { id: "sewing-machine", en: "Sewing Machine", ar: "ماكينة خياطة" },
  { id: "cutting-machine", en: "Cutting Machine", ar: "ماكينة قص" },
  { id: "press-machine", en: "Press / Iron", ar: "مكواة / برس" },
  { id: "embroidery", en: "Embroidery Machine", ar: "ماكينة تطريز" },
  { id: "serger", en: "Serger / Overlock", ar: "ماكينة سيرجر" },
  { id: "pattern-making", en: "Pattern Making", ar: "أدوات تقطيع" },
  { id: "quality-testing", en: "Quality Testing", ar: "أجهزة فحص الجودة" },
  { id: "storage", en: "Storage / Racks", ar: "رفوف / تخزين" },
  { id: "transport", en: "Transport / Cart", ar: "عربة نقل" },
  { id: "computer", en: "Computer / Tablet", ar: "كمبيوتر / تابلت" },
  { id: "other", en: "Other", ar: "أخرى" },
];

const STATUSES = [
  { id: "active", en: "Active", ar: "نشط", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" },
  { id: "maintenance", en: "Under Maintenance", ar: "تحت الصيانة", color: "text-amber-600 bg-amber-50 dark:bg-amber-500/10" },
  { id: "retired", en: "Retired", ar: "متقاعد", color: "text-red-600 bg-red-50 dark:bg-red-500/10" },
] as const;

const uid = () => `ast_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

interface Draft {
  name: string; nameAr: string;
  category: string; categoryAr: string;
  serialNumber: string; purchaseDate: string;
  cost: number; currentValue: number;
  location: string; locationAr: string;
  status: "active" | "maintenance" | "retired";
  lastMaintenance: string; nextMaintenance: string;
  notes: string; notesAr: string;
}

const emptyDraft: Draft = {
  name: "", nameAr: "", category: "", categoryAr: "",
  serialNumber: "", purchaseDate: "", cost: 0, currentValue: 0,
  location: "", locationAr: "", status: "active",
  lastMaintenance: "", nextMaintenance: "", notes: "", notesAr: "",
};

function AssetModal({ open, onClose, editing }: { open: boolean; onClose: () => void; editing: Asset | null }) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [d, setD] = useState<Draft>(emptyDraft);
  const [inited, setInited] = useState(false);

  if (open && !inited) {
    if (editing) {
      setD({
        name: editing.name, nameAr: editing.nameAr, category: editing.category, categoryAr: editing.categoryAr,
        serialNumber: editing.serialNumber, purchaseDate: editing.purchaseDate,
        cost: editing.cost, currentValue: editing.currentValue,
        location: editing.location, locationAr: editing.locationAr,
        status: editing.status, lastMaintenance: editing.lastMaintenance,
        nextMaintenance: editing.nextMaintenance, notes: editing.notes, notesAr: editing.notesAr,
      });
    } else {
      setD(emptyDraft);
    }
    setInited(true);
  }
  if (!open && inited) setInited(false);

  const save = () => {
    if (!d.name || !d.category) return;
    const cat = CATEGORIES.find((c) => c.id === d.category);
    const asset: Asset = {
      id: editing?.id ?? uid(),
      name: d.name, nameAr: d.nameAr || d.name,
      category: d.category, categoryAr: cat?.ar || d.categoryAr,
      serialNumber: d.serialNumber, purchaseDate: d.purchaseDate,
      cost: d.cost, currentValue: d.currentValue,
      location: d.location, locationAr: d.locationAr || d.location,
      status: d.status, lastMaintenance: d.lastMaintenance,
      nextMaintenance: d.nextMaintenance, notes: d.notes, notesAr: d.notesAr,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
    };
    onSave(asset);
    onClose();
  };

  // Inline save handler (state managed at page level)
  const onSave = (a: Asset) => {
    window.dispatchEvent(new CustomEvent("cubs-asset-save", { detail: a }));
  };

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${open ? "" : "hidden"}`}>
      <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-card rounded-2xl shadow-2xl border border-border/60 w-full max-w-[640px] max-h-[85vh] overflow-auto">
        <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">{editing ? (ar ? "تعديل أصل" : "Edit Asset") : (ar ? "إضافة أصل جديد" : "New Asset")}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-[18px] leading-none">&times;</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wide text-muted-foreground/70 mb-1 block">{ar ? "اسم الأصل (EN)" : "Asset name (EN)"}</label>
              <input className="w-full h-9 rounded-lg border border-border/60 bg-background px-3 text-[13px]" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} placeholder="YKK Sewing Machine #3" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wide text-muted-foreground/70 mb-1 block">{ar ? "اسم الأصل (AR)" : "Asset name (AR)"}</label>
              <input className="w-full h-9 rounded-lg border border-border/60 bg-background px-3 text-[13px]" dir="rtl" value={d.nameAr} onChange={(e) => setD({ ...d, nameAr: e.target.value })} placeholder="ماكينة يوكى رقم ٣" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wide text-muted-foreground/70 mb-1 block">{ar ? "الفئة" : "Category"}</label>
              <select className="w-full h-9 rounded-lg border border-border/60 bg-background px-3 text-[13px]" value={d.category} onChange={(e) => setD({ ...d, category: e.target.value })}>
                <option value="">{ar ? "اختر" : "Select"}</option>
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{ar ? c.ar : c.en}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wide text-muted-foreground/70 mb-1 block">{ar ? "رقم التسلسلي" : "Serial number"}</label>
              <input className="w-full h-9 rounded-lg border border-border/60 bg-background px-3 text-[13px] font-mono" value={d.serialNumber} onChange={(e) => setD({ ...d, serialNumber: e.target.value })} />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wide text-muted-foreground/70 mb-1 block">{ar ? "تاريخ الشراء" : "Purchase date"}</label>
              <input type="date" className="w-full h-9 rounded-lg border border-border/60 bg-background px-3 text-[13px]" value={d.purchaseDate} onChange={(e) => setD({ ...d, purchaseDate: e.target.value })} />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wide text-muted-foreground/70 mb-1 block">{ar ? "الحالة" : "Status"}</label>
              <select className="w-full h-9 rounded-lg border border-border/60 bg-background px-3 text-[13px]" value={d.status} onChange={(e) => setD({ ...d, status: e.target.value as Asset["status"] })}>
                {STATUSES.map((s) => <option key={s.id} value={s.id}>{ar ? s.ar : s.en}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wide text-muted-foreground/70 mb-1 block">{ar ? "تكلفة الشراء" : "Purchase cost"}</label>
              <input type="number" className="w-full h-9 rounded-lg border border-border/60 bg-background px-3 text-[13px]" value={d.cost || ""} onChange={(e) => setD({ ...d, cost: Number(e.target.value) })} placeholder="0.00" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wide text-muted-foreground/70 mb-1 block">{ar ? "القيمة الحالية" : "Current value"}</label>
              <input type="number" className="w-full h-9 rounded-lg border border-border/60 bg-background px-3 text-[13px]" value={d.currentValue || ""} onChange={(e) => setD({ ...d, currentValue: Number(e.target.value) })} placeholder="0.00" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wide text-muted-foreground/70 mb-1 block">{ar ? "الموقع (EN)" : "Location (EN)"}</label>
              <input className="w-full h-9 rounded-lg border border-border/60 bg-background px-3 text-[13px]" value={d.location} onChange={(e) => setD({ ...d, location: e.target.value })} placeholder="Factory floor A" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wide text-muted-foreground/70 mb-1 block">{ar ? "الموقع (AR)" : "Location (AR)"}</label>
              <input className="w-full h-9 rounded-lg border border-border/60 bg-background px-3 text-[13px]" dir="rtl" value={d.locationAr} onChange={(e) => setD({ ...d, locationAr: e.target.value })} />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wide text-muted-foreground/70 mb-1 block">{ar ? "آخر صيانة" : "Last maintenance"}</label>
              <input type="date" className="w-full h-9 rounded-lg border border-border/60 bg-background px-3 text-[13px]" value={d.lastMaintenance} onChange={(e) => setD({ ...d, lastMaintenance: e.target.value })} />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wide text-muted-foreground/70 mb-1 block">{ar ? "الصيانة القادمة" : "Next maintenance"}</label>
              <input type="date" className="w-full h-9 rounded-lg border border-border/60 bg-background px-3 text-[13px]" value={d.nextMaintenance} onChange={(e) => setD({ ...d, nextMaintenance: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wide text-muted-foreground/70 mb-1 block">{ar ? "ملاحظات" : "Notes"}</label>
            <textarea className="w-full h-16 rounded-lg border border-border/60 bg-background px-3 py-2 text-[13px] resize-none" value={ar ? d.notesAr : d.notes} onChange={(e) => setD(ar ? { ...d, notesAr: e.target.value } : { ...d, notes: e.target.value })} dir={ar ? "rtl" : "ltr"} />
          </div>
        </div>
        <div className="px-5 py-3 border-t border-border/50 flex items-center justify-end gap-2">
          <button onClick={onClose} className="h-9 px-4 rounded-lg border border-border/60 text-[12.5px] font-medium hover:bg-muted/40 transition">{ar ? "إلغاء" : "Cancel"}</button>
          <button onClick={save} disabled={!d.name || !d.category} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-[12.5px] font-medium hover:bg-primary/90 transition disabled:opacity-50">{ar ? "حفظ" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

export default function AssetsPage() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [assets, setAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);

  // Listen for saves from the modal
  useState(() => {
    const handler = (e: Event) => {
      const a = (e as CustomEvent).detail as Asset;
      setAssets((prev) => {
        const idx = prev.findIndex((x) => x.id === a.id);
        if (idx >= 0) { const next = [...prev]; next[idx] = a; return next; }
        return [a, ...prev];
      });
    };
    window.addEventListener("cubs-asset-save", handler);
    return () => window.removeEventListener("cubs-asset-save", handler);
  });

  const filtered = useMemo(() => assets.filter((a) => {
    if (catFilter && a.category !== catFilter) return false;
    if (statusFilter && a.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return a.name.toLowerCase().includes(q) || (a.nameAr || "").includes(search) || a.serialNumber.toLowerCase().includes(q);
  }), [assets, search, catFilter, statusFilter]);

  const totalValue = assets.reduce((s, a) => s + a.currentValue, 0);
  const maintenanceDue = assets.filter((a) => {
    if (!a.nextMaintenance) return false;
    return new Date(a.nextMaintenance) <= new Date(Date.now() + 7 * 86400000);
  });

  const openAdd = () => { setEditing(null); setModal(true); };
  const openEdit = (a: Asset) => { setEditing(a); setModal(true); };
  const deleteAsset = (id: string) => {
    if (confirm(ar ? "حذف هذا الأصل؟" : "Delete this asset?")) {
      setAssets((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const statusObj = (s: Asset["status"]) => STATUSES.find((x) => x.id === s) ?? STATUSES[0];

  return (
    <div className="p-5 sm:p-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Wrench size={16} /></div>
            <h1 className="text-[18px] font-semibold text-foreground">{ar ? "الأصول والمعدات" : "Assets & Equipment"}</h1>
          </div>
          <p className="text-[12.5px] text-muted-foreground">{ar ? "آلات الخياطة، الأدوات، المعدات الثابتة" : "Sewing machines, tools, fixed equipment"}</p>
        </div>
        <button onClick={openAdd} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-[12.5px] font-medium hover:bg-primary/90 transition flex items-center gap-1.5">
          <Plus size={14} />{ar ? "إضافة أصل" : "Add Asset"}
        </button>
      </div>

      {/* Stats strip */}
      {assets.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="rounded-xl bg-muted/40 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">{ar ? "إجمالي الأصول" : "Total assets"}</p>
            <p className="text-[16px] font-semibold text-foreground mt-0.5">{assets.length}</p>
          </div>
          <div className="rounded-xl bg-muted/40 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">{ar ? "القيمة الإجمالية" : "Total value"}</p>
            <p className="text-[16px] font-semibold text-foreground mt-0.5">{totalValue.toLocaleString()} EGP</p>
          </div>
          <div className="rounded-xl bg-muted/40 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">{ar ? "نشطة" : "Active"}</p>
            <p className="text-[16px] font-semibold text-emerald-600 mt-0.5">{assets.filter((a) => a.status === "active").length}</p>
          </div>
          <div className="rounded-xl bg-muted/40 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">{ar ? "صيانة قادمة" : "Maintenance due"}</p>
            <p className={`text-[16px] font-semibold mt-0.5 ${maintenanceDue.length > 0 ? "text-amber-600" : "text-foreground"}`}>{maintenanceDue.length}</p>
          </div>
        </div>
      )}

      {/* Maintenance alerts */}
      {maintenanceDue.length > 0 && (
        <div className="mb-5 rounded-2xl border border-amber-300/50 bg-amber-50/60 dark:bg-amber-500/5 p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0"><AlertTriangle size={16} /></div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-foreground">{ar ? `صيانة مستحقة خلال ٧ أيام` : `Maintenance due within 7 days`}</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                {maintenanceDue.slice(0, 3).map((a) => ar ? (a.nameAr || a.name) : a.name).join(" · ")}
                {maintenanceDue.length > 3 && ` +${maintenanceDue.length - 3}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
          <input className="w-full h-9 rounded-lg border border-border/60 bg-background ps-9 pe-3 text-[13px]" placeholder={ar ? "بحث بالاسم أو الرقم التسلسلي..." : "Search name or serial..."} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="h-9 rounded-lg border border-border/60 bg-background px-3 text-[12.5px] min-w-[140px]" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
          <option value="">{ar ? "كل الفئات" : "All categories"}</option>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{ar ? c.ar : c.en}</option>)}
        </select>
        <select className="h-9 rounded-lg border border-border/60 bg-background px-3 text-[12.5px] min-w-[120px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">{ar ? "كل الحالات" : "All statuses"}</option>
          {STATUSES.map((s) => <option key={s.id} value={s.id}>{ar ? s.ar : s.en}</option>)}
        </select>
      </div>

      {/* Asset list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card p-10 text-center">
          <div className="w-10 h-10 rounded-xl bg-muted mx-auto flex items-center justify-center mb-3"><Wrench size={18} className="text-muted-foreground/50" /></div>
          <p className="text-[14px] font-medium text-foreground">{ar ? "لا توجد أصول بعد" : "No assets yet"}</p>
          <p className="text-[12px] text-muted-foreground mt-1 mb-4">{ar ? "أضف آلات ومعدات المصنع" : "Add factory machines and equipment"}</p>
          <button onClick={openAdd} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-[12.5px] font-medium hover:bg-primary/90 transition inline-flex items-center gap-1.5"><Plus size={14} />{ar ? "إضافة أصل" : "Add Asset"}</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((a) => {
            const st = statusObj(a.status);
            const cat = CATEGORIES.find((c) => c.id === a.category);
            return (
              <div key={a.id} className="rounded-2xl border border-border/60 bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-medium ${st.color}`}>{ar ? st.ar : st.en}</span>
                      <span className="text-[11px] text-muted-foreground">{cat ? (ar ? cat.ar : cat.en) : ""}</span>
                    </div>
                    <p className="text-[14px] font-semibold text-foreground truncate">{ar ? (a.nameAr || a.name) : a.name}</p>
                    <p className="text-[11.5px] text-muted-foreground mt-0.5 font-mono">{a.serialNumber || "—"}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(a)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition"><Edit3 size={13} /></button>
                    <button onClick={() => deleteAsset(a.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition"><Trash2 size={13} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="rounded-lg bg-muted/40 px-2.5 py-2">
                    <p className="text-[9.5px] uppercase tracking-wide text-muted-foreground/70">{ar ? "التكلفة" : "Cost"}</p>
                    <p className="text-[13px] font-semibold text-foreground mt-0.5">{a.cost.toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 px-2.5 py-2">
                    <p className="text-[9.5px] uppercase tracking-wide text-muted-foreground/70">{ar ? "القيمة" : "Value"}</p>
                    <p className="text-[13px] font-semibold text-foreground mt-0.5">{a.currentValue.toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 px-2.5 py-2">
                    <p className="text-[9.5px] uppercase tracking-wide text-muted-foreground/70">{ar ? "الموقع" : "Location"}</p>
                    <p className="text-[12px] font-medium text-foreground mt-0.5 truncate">{ar ? (a.locationAr || a.location) : a.location || "—"}</p>
                  </div>
                </div>
                {a.nextMaintenance && (
                  <div className="mt-2.5 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                    <Calendar size={12} />
                    <span>{ar ? "الصيانة القادمة:" : "Next maintenance:"} {a.nextMaintenance}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AssetModal open={modal} onClose={() => setModal(false)} editing={editing} />
    </div>
  );
}
