/**
 * Assets — Dedicated fixed-asset management (equipment, vehicles, facilities, licenses)
 *
 * إدارة الأصول — صفحة مخصصة للأصول الثابتة (معدات، مركبات، منشآت، تراخيص)
 *
 * Separated from inventory/fabrics. Rich UI: valuation, straight-line
 * depreciation, condition tracking, warranty & maintenance alerts,
 * assignment, and CSV import/export with a downloadable sample.
 *
 * Shares the `resources` table + metadata shape with Inventory.tsx so data
 * stays consistent (assets carry skills:["asset"], type equipment/vehicle/…).
 */

import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { getDataSource } from "../lib/data-source";
import { exportCSV, type ImportTemplate } from "../lib/csv-export";
import { generateCode, peekNextCode, type CodeSettings, loadCodeSettings } from "../lib/code-generator";
import type { Database } from "../lib/database.types";
import {
  Wrench, Car, Building2, Key, Box, Plus, Search, X, Loader2, Download,
  ArrowLeft, Upload, Edit3, Trash2, AlertTriangle, ShieldAlert, Clock,
  TrendingDown, DollarSign, CheckCircle2, Activity, Hash,
} from "lucide-react";
import { ConfirmDeleteModal } from "../components/ConfirmDeleteModal";
import { CsvImport } from "../components/CsvImport";

type Resource = Database["public"]["Tables"]["resources"]["Row"];

const inputCls = "w-full h-10 rounded-xl border border-border/60 bg-background px-3.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition placeholder:text-muted-foreground/50";
const selectCls = inputCls + " appearance-none cursor-pointer";
const labelCls = "text-[11px] font-medium text-muted-foreground mb-1 block";
const btnPrimary = "flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-foreground text-background text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50";
const btnSecondary = "inline-flex items-center justify-center gap-1.5 rounded-xl border border-border/60 text-[11px] font-medium px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors";

// ─── Taxonomy ────────────────────────────────────────────

const ASSET_TYPES = [
  { value: "equipment", en: "Equipment", ar: "معدات",  icon: Wrench,    color: "bg-blue-100 text-blue-600" },
  { value: "vehicle",   en: "Vehicle",   ar: "مركبة",  icon: Car,       color: "bg-cyan-100 text-cyan-600" },
  { value: "facility",  en: "Facility",  ar: "منشأة",  icon: Building2,  color: "bg-violet-100 text-violet-600" },
  { value: "license",   en: "License",   ar: "ترخيص",  icon: Key,        color: "bg-emerald-100 text-emerald-700" },
  { value: "other",     en: "Other",     ar: "أخرى",   icon: Box,        color: "bg-slate-100 text-slate-600" },
] as const;

const ASSET_STATUSES = [
  { value: "active",      en: "Active",      ar: "نشط",    pill: "bg-emerald-100 text-emerald-700" },
  { value: "idle",        en: "Idle",        ar: "خامل",   pill: "bg-slate-100 text-slate-600" },
  { value: "maintenance", en: "Maintenance", ar: "صيانة",  pill: "bg-amber-100 text-amber-700" },
  { value: "retired",     en: "Retired",     ar: "متقاعد", pill: "bg-rose-100 text-rose-600" },
];

const CONDITIONS = [
  { value: "excellent", en: "Excellent", ar: "ممتاز" },
  { value: "good",      en: "Good",      ar: "جيد" },
  { value: "fair",      en: "Fair",      ar: "مقبول" },
  { value: "poor",      en: "Poor",      ar: "سيئ" },
];

// ─── Metadata ────────────────────────────────────────────

interface AssetMeta {
  asset_tag?: string;
  serial_no?: string;
  assigned_to?: string;
  assigned_dept?: string;
  location?: string;
  purchase_date?: string;
  purchase_cost?: number;
  useful_life_years?: number;
  salvage_value?: number;
  condition?: string;
  warranty_expiry?: string;
  asset_status?: string;
  supplier?: string;
  notes?: string;
}

function getMeta(r: Resource): AssetMeta {
  const m = (r.metadata ?? {}) as Record<string, unknown>;
  // Fall back to the demo seed's field names (value/status/assignedToEn/…) so
  // existing sample assets show real numbers, not blanks.
  return {
    asset_tag: (m.asset_tag ?? m.sku) as string, serial_no: m.serial_no as string,
    assigned_to: (m.assigned_to ?? m.assignedToEn) as string, assigned_dept: m.assigned_dept as string,
    location: (m.location ?? m.locationEn) as string, purchase_date: (m.purchase_date ?? m.purchaseDateEn) as string,
    purchase_cost: (m.purchase_cost ?? m.value) as number, useful_life_years: m.useful_life_years as number,
    salvage_value: m.salvage_value as number, condition: m.condition as string,
    warranty_expiry: m.warranty_expiry as string, asset_status: (m.asset_status ?? m.status) as string,
    supplier: m.supplier as string, notes: (m.notes ?? m.descEn) as string,
  };
}

/** Straight-line depreciation from purchase date over useful life. */
function depreciation(m: AssetMeta): { book: number; annual: number; agePct: number; depreciated: number } {
  const cost = m.purchase_cost || 0;
  const salvage = m.salvage_value || 0;
  const life = m.useful_life_years || 5;
  const purchaseMs = m.purchase_date ? new Date(m.purchase_date).getTime() : NaN;
  if (!cost || isNaN(purchaseMs)) return { book: cost, annual: 0, agePct: 0, depreciated: 0 };
  const ageYears = Math.max(0, (Date.now() - purchaseMs) / (365.25 * 24 * 3600 * 1000));
  const annual = (cost - salvage) / life;
  const depreciated = Math.min(annual * ageYears, cost - salvage);
  return { book: Math.max(cost - depreciated, salvage), annual, agePct: Math.min(ageYears / life, 1), depreciated };
}

function daysUntil(date?: string): number | null {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / (24 * 3600 * 1000));
}

const assetImportTemplate: ImportTemplate = {
  id: "assets",
  labelEn: "Assets",
  labelAr: "الأصول",
  headers: ["name_en", "type", "asset_tag", "serial_no", "purchase_date", "purchase_cost", "useful_life_years", "salvage_value", "condition", "assigned_to", "location", "warranty_expiry"],
  requiredHeaders: ["name_en"],
  mapRow: (r) => ({
    name_en: r.name_en,
    name_ar: r.name_ar || r.name_en,
    type: (["equipment", "vehicle", "facility", "license", "other"].includes(r.type) ? r.type : "equipment"),
    skills: ["asset"],
    metadata: {
      asset_tag: r.asset_tag || generateCode("asset"),
      serial_no: r.serial_no || null,
      purchase_date: r.purchase_date || null,
      purchase_cost: parseFloat(r.purchase_cost) || 0,
      useful_life_years: parseInt(r.useful_life_years) || 5,
      salvage_value: parseFloat(r.salvage_value) || 0,
      condition: r.condition || "good",
      assigned_to: r.assigned_to || null,
      location: r.location || null,
      warranty_expiry: r.warranty_expiry || null,
      asset_status: "active",
    },
  }),
};

// ═══════════════════════════════════════════════════════════
// Create / Edit Modal
// ═══════════════════════════════════════════════════════════

interface FormState {
  name: string; type: string; assetTag: string; serialNo: string;
  purchaseDate: string; purchaseCost: string; usefulLife: string; salvageValue: string;
  condition: string; status: string; assignedTo: string; assignedDept: string;
  location: string; warrantyExpiry: string; supplier: string; notes: string;
}

function emptyForm(nextTag: string): FormState {
  return {
    name: "", type: "equipment", assetTag: nextTag, serialNo: "",
    purchaseDate: "", purchaseCost: "", usefulLife: "5", salvageValue: "",
    condition: "good", status: "active", assignedTo: "", assignedDept: "",
    location: "", warrantyExpiry: "", supplier: "", notes: "",
  };
}

function AssetModal({ initial, nextTag, ar, currency, onClose, onSaved }: {
  initial?: Resource; nextTag: string; ar: boolean; currency: string;
  onClose: () => void; onSaved: (r: Resource) => void;
}) {
  const { workspace } = useAuth();
  const m = initial ? getMeta(initial) : undefined;
  const [form, setForm] = useState<FormState>(() => initial ? {
    name: initial.name_en, type: initial.type ?? "equipment",
    assetTag: m?.asset_tag ?? nextTag, serialNo: m?.serial_no ?? "",
    purchaseDate: m?.purchase_date ?? "", purchaseCost: m?.purchase_cost?.toString() ?? "",
    usefulLife: m?.useful_life_years?.toString() ?? "5", salvageValue: m?.salvage_value?.toString() ?? "",
    condition: m?.condition ?? "good", status: m?.asset_status ?? "active",
    assignedTo: m?.assigned_to ?? "", assignedDept: m?.assigned_dept ?? "",
    location: m?.location ?? "", warrantyExpiry: m?.warranty_expiry ?? "",
    supplier: m?.supplier ?? "", notes: m?.notes ?? "",
  } : emptyForm(nextTag));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (patch: Partial<FormState>) => setForm(f => ({ ...f, ...patch }));

  // Live depreciation preview
  const preview = useMemo(() => depreciation({
    purchase_cost: parseFloat(form.purchaseCost) || 0,
    salvage_value: parseFloat(form.salvageValue) || 0,
    useful_life_years: parseInt(form.usefulLife) || 5,
    purchase_date: form.purchaseDate,
  }), [form.purchaseCost, form.salvageValue, form.usefulLife, form.purchaseDate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError(ar ? "الاسم مطلوب" : "Name is required"); return; }
    setSaving(true);
    try {
      const wid = workspace?.id || "demo";
      const ds = getDataSource();
      const metadata = {
        asset_tag: form.assetTag || generateCode("asset"),
        serial_no: form.serialNo || null,
        purchase_date: form.purchaseDate || null,
        purchase_cost: parseFloat(form.purchaseCost) || 0,
        useful_life_years: parseInt(form.usefulLife) || 5,
        salvage_value: parseFloat(form.salvageValue) || 0,
        condition: form.condition,
        asset_status: form.status,
        assigned_to: form.assignedTo || null,
        assigned_dept: form.assignedDept || null,
        location: form.location || null,
        warranty_expiry: form.warrantyExpiry || null,
        supplier: form.supplier || null,
        notes: form.notes || null,
      };
      const payload = {
        name_en: form.name.trim(), name_ar: form.name.trim(),
        type: form.type, skills: ["asset"],
        metadata: metadata as Resource["metadata"],
      };
      if (initial) {
        await ds.resources.update(wid, initial.id, payload);
        onSaved({ ...initial, ...payload } as Resource);
      } else {
        const created = await ds.resources.create(wid, payload);
        onSaved((created ?? { ...payload, id: `demo-${Date.now()}` }) as Resource);
      }
      onClose();
    } catch { setError(ar ? "فشل الحفظ" : "Failed to save."); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-background rounded-2xl border border-border/60 shadow-xl w-full max-w-[640px] max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-background/95 backdrop-blur px-6 py-4 border-b border-border/40 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>
            {initial ? (ar ? "تعديل الأصل" : "Edit Asset") : (ar ? "إضافة أصل" : "Add Asset")}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted"><X size={15} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="text-[12px] text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelCls}>{ar ? "الاسم" : "Name"} <span className="text-rose-400">*</span></label>
              <input value={form.name} onChange={e => set({ name: e.target.value })} autoFocus className={inputCls} placeholder={ar ? "مثال: ماكينة قص ليزر" : "e.g. Laser Cutter"} />
            </div>
            <div>
              <label className={labelCls}>{ar ? "النوع" : "Type"}</label>
              <select value={form.type} onChange={e => set({ type: e.target.value })} className={selectCls}>
                {ASSET_TYPES.map(t => <option key={t.value} value={t.value}>{ar ? t.ar : t.en}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>{ar ? "رقم الأصل" : "Asset Tag"}</label>
              <div className="relative">
                <Hash size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                <input value={form.assetTag} onChange={e => set({ assetTag: e.target.value })} className={inputCls + " pl-8 font-mono"} placeholder="AST-00001" />
              </div>
            </div>
            <div>
              <label className={labelCls}>{ar ? "الرقم التسلسلي" : "Serial No."}</label>
              <input value={form.serialNo} onChange={e => set({ serialNo: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{ar ? "المورّد" : "Supplier"}</label>
              <input value={form.supplier} onChange={e => set({ supplier: e.target.value })} className={inputCls} />
            </div>
          </div>

          {/* Financials */}
          <div className="pt-2 border-t border-border/30">
            <p className="text-[11px] font-semibold text-muted-foreground mb-2.5">{ar ? "القيمة والإهلاك" : "Value & Depreciation"}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>{ar ? "تاريخ الشراء" : "Purchase Date"}</label>
                <input type="date" value={form.purchaseDate} onChange={e => set({ purchaseDate: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{ar ? `تكلفة الشراء (${currency})` : `Purchase Cost (${currency})`}</label>
                <input type="number" min="0" step="any" value={form.purchaseCost} onChange={e => set({ purchaseCost: e.target.value })} className={inputCls} placeholder="0" />
              </div>
              <div>
                <label className={labelCls}>{ar ? "العمر الإنتاجي (سنوات)" : "Useful Life (years)"}</label>
                <input type="number" min="1" value={form.usefulLife} onChange={e => set({ usefulLife: e.target.value })} className={inputCls} placeholder="5" />
              </div>
              <div>
                <label className={labelCls}>{ar ? `القيمة المتبقية (${currency})` : `Salvage Value (${currency})`}</label>
                <input type="number" min="0" step="any" value={form.salvageValue} onChange={e => set({ salvageValue: e.target.value })} className={inputCls} placeholder="0" />
              </div>
            </div>
            {(parseFloat(form.purchaseCost) > 0 && form.purchaseDate) && (
              <div className="mt-3 p-3 rounded-xl bg-muted/40 border border-border/30 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] text-muted-foreground">{ar ? "القيمة الدفترية" : "Book Value"}</p>
                  <p className="text-[14px] font-semibold text-emerald-600">{currency} {Math.round(preview.book).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">{ar ? "الإهلاك السنوي" : "Annual Dep."}</p>
                  <p className="text-[14px] font-semibold">{currency} {Math.round(preview.annual).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">{ar ? "نسبة العمر" : "Life Used"}</p>
                  <p className="text-[14px] font-semibold">{Math.round(preview.agePct * 100)}%</p>
                </div>
              </div>
            )}
          </div>

          {/* Status & assignment */}
          <div className="pt-2 border-t border-border/30">
            <p className="text-[11px] font-semibold text-muted-foreground mb-2.5">{ar ? "الحالة والتخصيص" : "Status & Assignment"}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>{ar ? "الحالة" : "Status"}</label>
                <select value={form.status} onChange={e => set({ status: e.target.value })} className={selectCls}>
                  {ASSET_STATUSES.map(s => <option key={s.value} value={s.value}>{ar ? s.ar : s.en}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>{ar ? "الحالة الفنية" : "Condition"}</label>
                <select value={form.condition} onChange={e => set({ condition: e.target.value })} className={selectCls}>
                  {CONDITIONS.map(c => <option key={c.value} value={c.value}>{ar ? c.ar : c.en}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>{ar ? "مُخصص لـ" : "Assigned To"}</label>
                <input value={form.assignedTo} onChange={e => set({ assignedTo: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{ar ? "القسم" : "Department"}</label>
                <input value={form.assignedDept} onChange={e => set({ assignedDept: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{ar ? "الموقع" : "Location"}</label>
                <input value={form.location} onChange={e => set({ location: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{ar ? "انتهاء الضمان" : "Warranty Expiry"}</label>
                <input type="date" value={form.warrantyExpiry} onChange={e => set({ warrantyExpiry: e.target.value })} className={inputCls} />
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>{ar ? "ملاحظات" : "Notes"}</label>
            <textarea value={form.notes} onChange={e => set({ notes: e.target.value })} rows={2} className={inputCls + " h-auto py-2 resize-none"} />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className={btnSecondary}>{ar ? "إلغاء" : "Cancel"}</button>
            <button type="submit" disabled={saving} className={btnPrimary}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              {initial ? (ar ? "حفظ" : "Save") : (ar ? "إضافة الأصل" : "Add Asset")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Page
// ═══════════════════════════════════════════════════════════

export default function InventoryEquipmentPage() {
  const { lang } = useLanguage();
  const { workspace } = useAuth();
  const ar = lang === "ar";
  const currency = "EGP";
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<Resource | null>(null);
  const [deleteItem, setDeleteItem] = useState<Resource | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [codeSettings] = useState<CodeSettings>(() => loadCodeSettings());

  useEffect(() => { loadAssets(); }, []);

  async function loadAssets() {
    setLoading(true);
    try {
      const ds = getDataSource();
      const all = await ds.resources.list(workspace?.id || "demo");
      // Assets = explicitly tagged asset, OR a fixed-asset type that isn't inventory/product
      const assets = all.filter(r => {
        const skills = r.skills ?? [];
        if (skills.includes("inventory") || skills.includes("product")) return false;
        return skills.includes("asset") || ["equipment", "vehicle", "facility", "license"].includes(r.type ?? "");
      });
      setItems(assets);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const filtered = useMemo(() => items.filter(r => {
    const m = getMeta(r);
    if (search) {
      const q = search.toLowerCase();
      if (![r.name_en, m.asset_tag, m.serial_no, m.assigned_to, m.location].some(v => (v ?? "").toLowerCase().includes(q))) return false;
    }
    if (filterType && r.type !== filterType) return false;
    if (filterStatus && (m.asset_status ?? "active") !== filterStatus) return false;
    return true;
  }), [items, search, filterType, filterStatus]);

  const stats = useMemo(() => {
    let bookValue = 0, annualDep = 0, maintenance = 0, alerts = 0;
    items.forEach(r => {
      const m = getMeta(r);
      const d = depreciation(m);
      bookValue += d.book;
      annualDep += d.annual;
      if ((m.asset_status ?? "active") === "maintenance") maintenance++;
      const wd = daysUntil(m.warranty_expiry);
      if (wd !== null && wd <= 30) alerts++;
    });
    return { total: items.length, bookValue, annualDep, maintenance, alerts };
  }, [items]);

  function handleSaved(r: Resource) {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === r.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = r; return next; }
      return [r, ...prev];
    });
  }

  async function handleDelete() {
    if (!deleteItem) return;
    const ds = getDataSource();
    await ds.resources.remove(workspace?.id || "demo", deleteItem.id);
    setItems(prev => prev.filter(i => i.id !== deleteItem.id));
    setDeleteItem(null);
  }

  const nextTag = peekNextCode("asset", codeSettings);

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[1200px] mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Link href="/inventory" className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-muted transition-colors">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1 className="text-[22px] font-semibold flex items-center gap-2.5" style={{ fontFamily: "var(--app-font-serif)" }}>
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Wrench size={16} className="text-blue-600" />
                </div>
                {ar ? "الأصول" : "Assets"}
              </h1>
              <p className="text-[13px] text-muted-foreground mt-1 ml-[46px]">
                {ar ? `${items.length} أصل ثابت` : `${items.length} fixed assets`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowImport(true)} className={btnSecondary}><Upload size={13} />{ar ? "استيراد" : "Import"}</button>
            <button onClick={() => exportCSV(items.map(r => { const m = getMeta(r); const d = depreciation(m); return { Name: r.name_en, Type: r.type, Tag: m.asset_tag, Serial: m.serial_no, PurchaseDate: m.purchase_date, Cost: m.purchase_cost, BookValue: Math.round(d.book), Condition: m.condition, Status: m.asset_status, AssignedTo: m.assigned_to, Location: m.location }; }), "assets-export")} className={btnSecondary}><Download size={13} />{ar ? "تصدير" : "Export"}</button>
            <button onClick={() => setShowCreate(true)} className={btnPrimary}><Plus size={14} />{ar ? "إضافة أصل" : "Add Asset"}</button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: ar ? "إجمالي الأصول" : "Total Assets", value: stats.total, icon: Box, color: "bg-blue-100 text-blue-600" },
            { label: ar ? "القيمة الدفترية" : "Book Value", value: `${currency} ${Math.round(stats.bookValue).toLocaleString()}`, icon: DollarSign, color: "bg-emerald-100 text-emerald-700" },
            { label: ar ? "الإهلاك السنوي" : "Annual Depreciation", value: `${currency} ${Math.round(stats.annualDep).toLocaleString()}`, icon: TrendingDown, color: "bg-amber-100 text-amber-700" },
            { label: ar ? "تنبيهات" : "Alerts", value: stats.maintenance + stats.alerts, icon: ShieldAlert, color: "bg-rose-100 text-rose-600" },
          ].map((s, i) => (
            <div key={i} className="p-4 rounded-xl border border-border/40 bg-background">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${s.color}`}><s.icon size={13} /></div>
                <span className="text-[11px] text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-[18px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-[300px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={ar ? "بحث في الأصول..." : "Search assets..."} className={inputCls + " h-9 pl-9 text-[12px]"} />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className={selectCls + " h-9 w-[150px] text-[12px]"}>
            <option value="">{ar ? "كل الأنواع" : "All Types"}</option>
            {ASSET_TYPES.map(t => <option key={t.value} value={t.value}>{ar ? t.ar : t.en}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selectCls + " h-9 w-[140px] text-[12px]"}>
            <option value="">{ar ? "كل الحالات" : "All Statuses"}</option>
            {ASSET_STATUSES.map(s => <option key={s.value} value={s.value}>{ar ? s.ar : s.en}</option>)}
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={20} className="animate-spin text-muted-foreground/40" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Wrench size={32} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-[14px] text-muted-foreground">{ar ? "لا توجد أصول" : "No assets found"}</p>
            <p className="text-[12px] text-muted-foreground/60 mt-1">{ar ? "اضغط 'إضافة أصل' للبدء" : "Click 'Add Asset' to get started"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(r => {
              const m = getMeta(r);
              const typeDef = ASSET_TYPES.find(t => t.value === r.type) ?? ASSET_TYPES[0];
              const statusDef = ASSET_STATUSES.find(s => s.value === (m.asset_status ?? "active"));
              const d = depreciation(m);
              const Icon = typeDef.icon;
              const warrantyDays = daysUntil(m.warranty_expiry);

              return (
                <div key={r.id} className="group p-4 rounded-xl border border-border/40 bg-background hover:border-border/60 hover:shadow-sm transition-all cursor-pointer" onClick={() => setEditItem(r)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${typeDef.color}`}><Icon size={15} /></div>
                      <div>
                        <p className="text-[13px] font-medium leading-tight">{r.name_en}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{m.asset_tag || "No tag"}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusDef?.pill || ""}`}>{ar ? statusDef?.ar : statusDef?.en}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] mb-3">
                    <div><span className="text-muted-foreground">{ar ? "القيمة الدفترية" : "Book Value"}</span><p className="font-semibold text-[12px]">{m.purchase_cost ? `${currency} ${Math.round(d.book).toLocaleString()}` : "-"}</p></div>
                    <div><span className="text-muted-foreground">{ar ? "مُخصص لـ" : "Assigned"}</span><p className="font-medium truncate">{m.assigned_to || m.assigned_dept || "-"}</p></div>
                  </div>

                  {m.purchase_cost ? (
                    <div className="mb-2.5">
                      <div className="flex items-center justify-between text-[9px] text-muted-foreground mb-1">
                        <span>{ar ? "الإهلاك" : "Depreciation"}</span>
                        <span>{Math.round(d.agePct * 100)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
                        <div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.round(d.agePct * 100)}%` }} />
                      </div>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      {warrantyDays !== null && warrantyDays <= 30 ? (
                        <span className="inline-flex items-center gap-1 text-amber-600"><Clock size={10} />{warrantyDays < 0 ? (ar ? "ضمان منتهٍ" : "Warranty ended") : `${warrantyDays}${ar ? "ي ضمان" : "d warranty"}`}</span>
                      ) : m.condition ? (
                        <span className="inline-flex items-center gap-1"><Activity size={10} />{CONDITIONS.find(c => c.value === m.condition)?.[ar ? "ar" : "en"]}</span>
                      ) : <span />}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={e => { e.stopPropagation(); setEditItem(r); }} className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"><Edit3 size={11} /></button>
                      <button onClick={e => { e.stopPropagation(); setDeleteItem(r); }} className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-rose-50 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={11} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {(showCreate || editItem) && (
        <AssetModal
          initial={editItem ?? undefined}
          nextTag={nextTag}
          ar={ar}
          currency={currency}
          onClose={() => { setShowCreate(false); setEditItem(null); }}
          onSaved={handleSaved}
        />
      )}

      {showImport && (
        <CsvImport
          open={showImport}
          onClose={() => setShowImport(false)}
          template={assetImportTemplate}
          adapter={getDataSource().resources}
          ar={ar}
          onComplete={() => { setShowImport(false); loadAssets(); }}
        />
      )}

      {deleteItem && (
        <ConfirmDeleteModal
          open
          onConfirm={handleDelete}
          onCancel={() => setDeleteItem(null)}
          ar={ar}
          title={ar ? "حذف الأصل" : "Delete Asset"}
          itemName={deleteItem.name_en}
        />
      )}
    </div>
  );
}
