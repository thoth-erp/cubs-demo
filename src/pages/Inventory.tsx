/**
 * Inventory & Assets — Pro Edition
 *
 * Analytical inventory + fixed-asset management:
 * dashboard charts (stock health, value by category, movement flow, ABC),
 * smart insights (reorder, dead stock, warranty, overdue maintenance),
 * detail drawer with images/files, valuation & straight-line depreciation,
 * quick stock adjustments with auto status sync.
 *
 * Uses `resources` table with metadata for inventory/asset fields,
 * and `work_items` with type stock_movement/maintenance.
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { getDataSource } from "../lib/data-source";
import { exportCSV } from "../lib/csv-export";
import { uploadFile, BUCKETS } from "../lib/storage";
import { isDemoMode } from "../lib/supabase";
import type { Database } from "../lib/database.types";
import {
  Package, Box, Wrench, MapPin, Plus, Search, X, Loader2,
  AlertCircle, Download, AlertTriangle, CheckCircle2, ArrowDownUp,
  DollarSign, Monitor, Car, Hammer, Building2, Key, Armchair, Trash2,
  Image as ImageIcon, Pencil, TrendingDown, Clock,
  ShieldAlert, Sparkles, ChevronRight, History, FileText, Upload,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { ConfirmDeleteModal } from "../components/ConfirmDeleteModal";
import { MaterialsDashboard } from "../components/MaterialsDashboard";

type Resource = Database["public"]["Tables"]["resources"]["Row"];
type WorkItem = Database["public"]["Tables"]["work_items"]["Row"];

// ─── Metadata shapes ─────────────────────────────────────

interface FileAttachment { name: string; url: string; size?: number; kind?: string }

interface InvMeta {
  category?: string;
  sku?: string;
  barcode?: string;
  uom?: string;
  quantity?: number;
  reorder_level?: number;
  max_level?: number;
  unit_cost?: number;
  vendor_name?: string;
  brand?: string;
  location?: string;
  inv_status?: string;
  notes?: string;
  asset_tag?: string;
  serial_no?: string;
  assigned_to?: string;
  assigned_dept?: string;
  purchase_date?: string;
  purchase_cost?: number;
  current_value?: number;
  useful_life_years?: number;
  salvage_value?: number;
  condition?: string;
  warranty_expiry?: string;
  asset_status?: string;
  images?: string[];
  files?: FileAttachment[];
}

function getMeta(r: Resource): InvMeta {
  const m = (r.metadata ?? {}) as Record<string, unknown>;
  return {
    category: m.category as string, sku: m.sku as string,
    barcode: m.barcode as string, uom: m.uom as string,
    quantity: m.quantity as number, reorder_level: m.reorder_level as number,
    max_level: m.max_level as number,
    unit_cost: m.unit_cost as number, vendor_name: m.vendor_name as string,
    brand: m.brand as string,
    location: m.location as string, inv_status: m.inv_status as string,
    notes: m.notes as string,
    asset_tag: m.asset_tag as string, serial_no: m.serial_no as string,
    assigned_to: m.assigned_to as string,
    assigned_dept: m.assigned_dept as string, purchase_date: m.purchase_date as string,
    purchase_cost: m.purchase_cost as number, current_value: m.current_value as number,
    useful_life_years: m.useful_life_years as number, salvage_value: m.salvage_value as number,
    condition: m.condition as string, warranty_expiry: m.warranty_expiry as string,
    asset_status: m.asset_status as string,
    images: (m.images as string[]) ?? [],
    files: (m.files as FileAttachment[]) ?? [],
  };
}

interface MoveMeta {
  resource_id?: string; resource_name?: string; move_qty?: number;
  move_type?: string; from_location?: string; to_location?: string; reason?: string;
}
function getMoveMeta(w: WorkItem): MoveMeta {
  const m = (w.metadata ?? {}) as Record<string, unknown>;
  return { resource_id: m.resource_id as string, resource_name: m.resource_name as string, move_qty: m.move_qty as number, move_type: m.move_type as string, from_location: m.from_location as string, to_location: m.to_location as string, reason: m.reason as string };
}

interface MaintMeta {
  resource_id?: string; resource_name?: string; maint_type?: string;
  cost?: number; vendor_name?: string; notes?: string; completed_date?: string;
}
function getMaintMeta(w: WorkItem): MaintMeta {
  const m = (w.metadata ?? {}) as Record<string, unknown>;
  return { resource_id: m.resource_id as string, resource_name: m.resource_name as string, maint_type: m.maint_type as string, cost: m.cost as number, vendor_name: m.vendor_name as string, notes: m.notes as string, completed_date: m.completed_date as string };
}

// ─── Constants ───────────────────────────────────────────

const RESOURCE_CATEGORIES: { value: string; en: string; ar: string; icon: React.ElementType; color: string; hex: string }[] = [
  { value: "inventory", en: "Inventory", ar: "مخزون", icon: Box, color: "bg-violet-100 text-violet-600", hex: "#8b5cf6" },
  { value: "equipment", en: "Equipment", ar: "معدات", icon: Monitor, color: "bg-amber-100 text-amber-700", hex: "#d97706" },
  { value: "vehicle", en: "Vehicle", ar: "مركبة", icon: Car, color: "bg-blue-100 text-blue-600", hex: "#3b82f6" },
  { value: "tool", en: "Tool", ar: "أداة", icon: Hammer, color: "bg-orange-100 text-orange-600", hex: "#ea580c" },
  { value: "furniture", en: "Furniture", ar: "أثاث", icon: Armchair, color: "bg-emerald-100 text-emerald-700", hex: "#059669" },
  { value: "license", en: "Software License", ar: "رخصة برمجية", icon: Key, color: "bg-cyan-100 text-cyan-700", hex: "#0891b2" },
  { value: "facility", en: "Facility", ar: "منشأة", icon: Building2, color: "bg-rose-100 text-rose-600", hex: "#e11d48" },
  { value: "other", en: "Other", ar: "أخرى", icon: Package, color: "bg-slate-100 text-slate-600", hex: "#64748b" },
];

const INV_STATUSES = [
  { value: "in_stock", en: "In Stock", ar: "متوفر", pill: "bg-emerald-100 text-emerald-700" },
  { value: "low_stock", en: "Low Stock", ar: "الكمية قليلة", pill: "bg-amber-100 text-amber-700" },
  { value: "out_of_stock", en: "Out of Stock", ar: "خلص من المخزون", pill: "bg-rose-100 text-rose-600" },
  { value: "discontinued", en: "Discontinued", ar: "متوقف", pill: "bg-muted text-muted-foreground" },
];

const ASSET_STATUSES = [
  { value: "active", en: "Active", ar: "نشط", pill: "bg-emerald-100 text-emerald-700" },
  { value: "assigned", en: "Assigned", ar: "مخصص", pill: "bg-blue-100 text-blue-600" },
  { value: "maintenance", en: "In Maintenance", ar: "صيانة", pill: "bg-amber-100 text-amber-700" },
  { value: "retired", en: "Retired", ar: "متقاعد", pill: "bg-slate-100 text-slate-500" },
  { value: "lost", en: "Lost", ar: "مفقود", pill: "bg-rose-100 text-rose-600" },
];

const MOVE_TYPES = [
  { value: "stock_in", en: "Stock In", ar: "إضافة للمخزون" },
  { value: "stock_out", en: "Stock Out", ar: "صرف من المخزون" },
  { value: "adjustment", en: "Adjustment", ar: "تعديل" },
  { value: "transfer", en: "Transfer", ar: "نقل" },
];

const MAINT_STATUSES = [
  { value: "planned", en: "Scheduled", ar: "مجدولة", pill: "bg-blue-100 text-blue-600" },
  { value: "in_progress", en: "In Progress", ar: "جارية", pill: "bg-amber-100 text-amber-700" },
  { value: "done", en: "Completed", ar: "مكتملة", pill: "bg-emerald-100 text-emerald-700" },
  { value: "blocked", en: "Overdue", ar: "متأخرة", pill: "bg-rose-100 text-rose-600" },
  { value: "cancelled", en: "Cancelled", ar: "ملغية", pill: "bg-muted text-muted-foreground" },
];

const UOMS = [
  { value: "pcs", en: "Pieces", ar: "قطعة" },
  { value: "box", en: "Box", ar: "صندوق" },
  { value: "set", en: "Set", ar: "طقم" },
  { value: "kg", en: "Kilogram", ar: "كجم" },
  { value: "m", en: "Meter", ar: "متر" },
  { value: "m2", en: "Sq. Meter", ar: "م²" },
  { value: "l", en: "Liter", ar: "لتر" },
  { value: "roll", en: "Roll", ar: "لفة" },
  { value: "sheet", en: "Sheet", ar: "لوح" },
];

const ABC_STYLES: Record<string, string> = {
  A: "bg-violet-100 text-violet-700",
  B: "bg-blue-100 text-blue-600",
  C: "bg-slate-100 text-slate-500",
};

// ─── Helpers ─────────────────────────────────────────────

function computeInvStatus(qty: number, reorder: number): string {
  if (qty <= 0) return "out_of_stock";
  if (qty <= reorder) return "low_stock";
  return "in_stock";
}

/** Straight-line depreciation from purchase date over useful life. */
function depreciation(m: InvMeta): { book: number; annual: number; agePct: number; depreciated: number } {
  const cost = m.purchase_cost || 0;
  const salvage = m.salvage_value || 0;
  const life = m.useful_life_years || 5;
  if (!cost || !m.purchase_date) {
    return { book: m.current_value ?? cost, annual: 0, agePct: 0, depreciated: 0 };
  }
  const ageYears = Math.max(0, (Date.now() - new Date(m.purchase_date).getTime()) / (365.25 * 24 * 3600 * 1000));
  const annual = (cost - salvage) / life;
  const depreciated = Math.min(annual * ageYears, cost - salvage);
  return { book: Math.max(cost - depreciated, salvage), annual, agePct: Math.min(ageYears / life, 1), depreciated };
}

function isInventoryItem(r: Resource): boolean {
  return (r.skills ?? []).includes("inventory") || r.type === "inventory";
}

function isProduct(r: Resource): boolean {
  return r.type === "product" || (r.skills ?? []).includes("product");
}

/** Demo mode → base64 data URL (survives the session); live → Supabase storage. */
async function attachFile(workspaceId: string, file: File, asImage: boolean): Promise<FileAttachment | null> {
  if (isDemoMode) {
    if (file.size > 2.5 * 1024 * 1024) return null; // keep demo payloads small
    const url = await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
    return { name: file.name, url, size: file.size, kind: file.type };
  }
  const res = await uploadFile(asImage ? BUCKETS.IMAGES : BUCKETS.ATTACHMENTS, workspaceId, file);
  if (!res.url) return null;
  return { name: file.name, url: res.url, size: file.size, kind: file.type };
}

function fmtBytes(n?: number): string {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

// ─── Shared UI ───────────────────────────────────────────

const inputCls = "w-full h-10 rounded-xl border border-border/60 bg-background px-3.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition placeholder:text-muted-foreground/50";
const selectCls = inputCls + " appearance-none cursor-pointer";
const labelCls = "text-[11px] font-medium text-muted-foreground mb-1 block";
const btnPrimary = "flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-foreground text-background text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50";
const cardCls = "bg-background border border-border/40 rounded-xl";

function ModalShell({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-[3px]" onClick={onClose} />
      <div className={`relative bg-background border border-border/60 rounded-2xl shadow-xl w-full ${wide ? "max-w-[560px]" : "max-w-[500px]"} max-h-[85vh] overflow-auto`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-border/40 sticky top-0 bg-background z-10">
          <h2 className="text-[16px] font-medium" style={{ fontFamily: "var(--app-font-serif)" }}>{title}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"><X size={14} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Chart primitives (match LoyaltyAnalytics / SectionGraphs style) ──

function Donut({ segments, centerValue, centerLabel, size = 148 }: {
  segments: { label: string; value: number; color: string }[];
  centerValue: string; centerLabel: string; size?: number;
}) {
  const total = Math.max(segments.reduce((s, x) => s + x.value, 0), 1);
  const r = (size - 22) / 2;
  const circ = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={13} opacity={0.5} />
        {segments.filter((s) => s.value > 0).map((s, i) => {
          const frac = s.value / total;
          const dash = frac * circ;
          const offset = -acc * circ;
          acc += frac;
          return (
            <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color}
              strokeWidth={13} strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={offset}
              strokeLinecap="butt" className="transition-all duration-700" />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-[19px] font-medium leading-none tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>{centerValue}</p>
        <p className="text-[9.5px] text-muted-foreground mt-1">{centerLabel}</p>
      </div>
    </div>
  );
}

function HBarList({ rows, fmt }: { rows: { label: string; value: number; color: string; sub?: string }[]; fmt: (v: number) => string }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="space-y-2.5">
      {rows.map((r, i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[11px] text-foreground/80 truncate">{r.label}{r.sub && <span className="text-muted-foreground/60"> · {r.sub}</span>}</p>
            <p className="text-[11px] font-medium tabular-nums shrink-0">{fmt(r.value)}</p>
          </div>
          <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(r.value / max) * 100}%`, backgroundColor: r.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function FlowColumns({ months, ar }: { months: { label: string; inn: number; out: number }[]; ar: boolean }) {
  const max = Math.max(...months.flatMap((m) => [m.inn, m.out]), 1);
  const H = 110;
  return (
    <div>
      <div className="flex items-end gap-2" style={{ height: H }}>
        {months.map((m, i) => (
          <div key={i} className="flex-1 flex items-end justify-center gap-1">
            <div className="w-full max-w-[14px] rounded-t-[4px] bg-emerald-400/80 transition-all duration-700" style={{ height: Math.max((m.inn / max) * (H - 10), m.inn > 0 ? 3 : 1) }} title={`${m.inn}`} />
            <div className="w-full max-w-[14px] rounded-t-[4px] bg-rose-300/90 transition-all duration-700" style={{ height: Math.max((m.out / max) * (H - 10), m.out > 0 ? 3 : 1) }} title={`${m.out}`} />
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-1.5">
        {months.map((m, i) => <p key={i} className="flex-1 text-center text-[9px] text-muted-foreground/60">{m.label}</p>)}
      </div>
      <div className="flex items-center gap-4 mt-2.5">
        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><span className="w-2 h-2 rounded-full bg-emerald-400/80" />{ar ? "وارد" : "Stock In"}</span>
        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><span className="w-2 h-2 rounded-full bg-rose-300/90" />{ar ? "صادر" : "Stock Out"}</span>
      </div>
    </div>
  );
}

function ChartCard({ title, sub, children, className }: { title: string; sub?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`${cardCls} p-5 ${className ?? ""}`}>
      <div className="mb-4">
        <h3 className="text-[13px] font-medium" style={{ fontFamily: "var(--app-font-serif)" }}>{title}</h3>
        {sub && <p className="text-[10.5px] text-muted-foreground/70 mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

// ─── Add / Edit Item Modal ───────────────────────────────

function ItemModal({ onClose, onSaved, ar, currency, mode, initial }: {
  onClose: () => void; onSaved: (r: Resource) => void; ar: boolean; currency: string;
  mode: "inventory" | "asset"; initial?: Resource;
}) {
  const { workspace } = useAuth();
  const isInv = mode === "inventory";
  const im = initial ? getMeta(initial) : undefined;
  const [form, setForm] = useState({
    name: initial?.name_en ?? "",
    type: initial?.type ?? (isInv ? "inventory" : "equipment"),
    sku: im?.sku ?? "", barcode: im?.barcode ?? "", uom: im?.uom ?? "pcs",
    quantity: im?.quantity?.toString() ?? "", reorderLevel: im?.reorder_level?.toString() ?? "",
    maxLevel: im?.max_level?.toString() ?? "", unitCost: im?.unit_cost?.toString() ?? "",
    location: im?.location ?? "", department: im?.assigned_dept ?? initial?.department ?? "",
    vendor: im?.vendor_name ?? "", brand: im?.brand ?? "",
    assetTag: im?.asset_tag ?? "", serialNo: im?.serial_no ?? "", assignedTo: im?.assigned_to ?? "",
    condition: im?.condition ?? "good", purchaseDate: im?.purchase_date ?? "",
    purchaseCost: im?.purchase_cost?.toString() ?? "", usefulLife: im?.useful_life_years?.toString() ?? "",
    warrantyExpiry: im?.warranty_expiry ?? "", notes: im?.notes ?? "",
    status: (isInv ? im?.inv_status : im?.asset_status) ?? (isInv ? "in_stock" : "active"),
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!workspace || !form.name.trim()) return;
    setLoading(true); setError(null);
    try {
      const wid = workspace?.id || "demo";
      const qty = parseInt(form.quantity) || 0;
      const reorder = parseInt(form.reorderLevel) || 0;
      const meta: Record<string, unknown> = {
        ...(initial ? (initial.metadata as Record<string, unknown>) : {}),
        category: form.type, location: form.location || null,
        vendor_name: form.vendor || null, brand: form.brand || null,
        notes: form.notes || null,
      };
      if (isInv) {
        meta.sku = form.sku || null;
        meta.barcode = form.barcode || null;
        meta.uom = form.uom;
        meta.quantity = qty;
        meta.reorder_level = reorder;
        meta.max_level = parseInt(form.maxLevel) || 0;
        meta.unit_cost = parseFloat(form.unitCost) || 0;
        meta.inv_status = form.status === "discontinued" ? "discontinued" : computeInvStatus(qty, reorder);
      } else {
        meta.asset_tag = form.assetTag || null;
        meta.serial_no = form.serialNo || null;
        meta.assigned_to = form.assignedTo || null;
        meta.assigned_dept = form.department || null;
        meta.purchase_date = form.purchaseDate || null;
        meta.purchase_cost = parseFloat(form.purchaseCost) || 0;
        meta.current_value = (initial ? (im?.current_value ?? 0) : 0) || parseFloat(form.purchaseCost) || 0;
        meta.useful_life_years = parseInt(form.usefulLife) || 5;
        meta.condition = form.condition;
        meta.warranty_expiry = form.warrantyExpiry || null;
        meta.asset_status = form.status;
      }
      if (imageFile) {
        const att = await attachFile(wid, imageFile, true);
        if (att) meta.images = [...((meta.images as string[]) ?? []), att.url];
      }

      const ds = getDataSource();
      const payload = {
        name_en: form.name.trim(), name_ar: form.name.trim(),
        type: form.type,
        utilization: isInv ? (qty > 0 ? Math.min(100, Math.round((qty / Math.max(qty, reorder || qty)) * 100)) : 0) : 0,
        department: form.department || null,
        skills: isInv ? ["inventory"] : ["asset"],
        metadata: meta as Resource["metadata"],
      };
      if (initial) {
        await ds.resources.update(wid, initial.id, payload);
        onSaved({ ...initial, ...payload } as Resource);
      } else {
        const created = await ds.resources.create(wid, payload);
        if (created) onSaved(created as Resource);
      }
      onClose();
    } catch { setError(ar ? "فشل الحفظ" : "Failed to save."); }
    finally { setLoading(false); }
  }

  const editTitle = isInv ? (ar ? "عدّل صنف المخزون" : "Edit Inventory Item") : (ar ? "عدّل الأصل" : "Edit Asset");
  const addTitle = isInv ? (ar ? "ضيف صنف مخزون" : "Add Inventory Item") : (ar ? "ضيف أصل" : "Add Asset");

  return (
    <ModalShell wide title={initial ? editTitle : addTitle} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className={labelCls}>{ar ? "الاسم" : "Name"} <span className="text-rose-400">*</span></label>
          <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required autoFocus className={inputCls} placeholder={isInv ? (ar ? "مثال: خشب MDF 18مم" : "e.g. MDF Board 18mm") : (ar ? "مثال: منشار CNC" : "e.g. CNC Router")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>{ar ? "التصنيف" : "Category"}</label>
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className={selectCls}>
              {RESOURCE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{ar ? c.ar : c.en}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>{isInv ? "SKU" : (ar ? "رقم الأصل" : "Asset Tag")}</label>
            <input type="text" value={isInv ? form.sku : form.assetTag} onChange={(e) => setForm((f) => isInv ? ({ ...f, sku: e.target.value }) : ({ ...f, assetTag: e.target.value }))} className={inputCls} placeholder={isInv ? "SKU-001" : "AST-001"} />
          </div>
        </div>
        {isInv ? (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>{ar ? "الكمية" : "Quantity"}</label>
                <input type="number" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} min="0" className={inputCls} placeholder="0" />
              </div>
              <div>
                <label className={labelCls}>{ar ? "وحدة القياس" : "Unit (UoM)"}</label>
                <select value={form.uom} onChange={(e) => setForm((f) => ({ ...f, uom: e.target.value }))} className={selectCls}>
                  {UOMS.map((u) => <option key={u.value} value={u.value}>{ar ? u.ar : u.en}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>{ar ? `سعر الوحدة (${currency})` : `Unit Cost (${currency})`}</label>
                <input type="number" value={form.unitCost} onChange={(e) => setForm((f) => ({ ...f, unitCost: e.target.value }))} min="0" step="any" className={inputCls} placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>{ar ? "حد إعادة الطلب" : "Reorder Level"}</label>
                <input type="number" value={form.reorderLevel} onChange={(e) => setForm((f) => ({ ...f, reorderLevel: e.target.value }))} min="0" className={inputCls} placeholder="0" />
              </div>
              <div>
                <label className={labelCls}>{ar ? "الحد الأقصى" : "Max Level"}</label>
                <input type="number" value={form.maxLevel} onChange={(e) => setForm((f) => ({ ...f, maxLevel: e.target.value }))} min="0" className={inputCls} placeholder="0" />
              </div>
              <div>
                <label className={labelCls}>{ar ? "الباركود" : "Barcode"}</label>
                <input type="text" value={form.barcode} onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))} className={inputCls} placeholder="690…" />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>{ar ? "الرقم التسلسلي" : "Serial No."}</label>
                <input type="text" value={form.serialNo} onChange={(e) => setForm((f) => ({ ...f, serialNo: e.target.value }))} className={inputCls} placeholder="SN-…" />
              </div>
              <div>
                <label className={labelCls}>{ar ? "مخصص لـ" : "Assigned To"}</label>
                <input type="text" value={form.assignedTo} onChange={(e) => setForm((f) => ({ ...f, assignedTo: e.target.value }))} className={inputCls} placeholder={ar ? "اسم الشخص" : "Person name"} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>{ar ? "تاريخ الشراء" : "Purchase Date"}</label>
                <input type="date" value={form.purchaseDate} onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{ar ? `تكلفة الشراء (${currency})` : `Purchase Cost (${currency})`}</label>
                <input type="number" value={form.purchaseCost} onChange={(e) => setForm((f) => ({ ...f, purchaseCost: e.target.value }))} min="0" step="any" className={inputCls} placeholder="0" />
              </div>
              <div>
                <label className={labelCls}>{ar ? "العمر الإنتاجي (سنين)" : "Useful Life (yrs)"}</label>
                <input type="number" value={form.usefulLife} onChange={(e) => setForm((f) => ({ ...f, usefulLife: e.target.value }))} min="1" className={inputCls} placeholder="5" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>{ar ? "انتهاء الضمان" : "Warranty Expiry"}</label>
                <input type="date" value={form.warrantyExpiry} onChange={(e) => setForm((f) => ({ ...f, warrantyExpiry: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{ar ? "الحالة الفنية" : "Condition"}</label>
                <select value={form.condition} onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))} className={selectCls}>
                  <option value="excellent">{ar ? "ممتازة" : "Excellent"}</option>
                  <option value="good">{ar ? "كويسة" : "Good"}</option>
                  <option value="fair">{ar ? "مقبولة" : "Fair"}</option>
                  <option value="poor">{ar ? "ضعيفة" : "Poor"}</option>
                </select>
              </div>
            </div>
          </>
        )}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>{ar ? "الموقع" : "Location"}</label>
            <input type="text" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className={inputCls} placeholder={ar ? "المخزن الرئيسي" : "Main Warehouse"} />
          </div>
          <div>
            <label className={labelCls}>{ar ? "العلامة / المورد" : "Brand / Vendor"}</label>
            <input type="text" value={form.vendor} onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))} className={inputCls} placeholder={ar ? "اختياري" : "Optional"} />
          </div>
          <div>
            <label className={labelCls}>{ar ? "الحالة" : "Status"}</label>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className={selectCls}>
              {(isInv ? INV_STATUSES : ASSET_STATUSES).map((s) => <option key={s.value} value={s.value}>{ar ? s.ar : s.en}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>{ar ? "ملاحظات" : "Notes"}</label>
          <input type="text" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className={inputCls} placeholder={ar ? "اختياري" : "Optional"} />
        </div>
        <div>
          <label className={labelCls}>{ar ? "صورة (اختياري)" : "Photo (optional)"}</label>
          <label className="flex items-center gap-2.5 h-10 px-3.5 rounded-xl border border-dashed border-border/70 text-[12px] text-muted-foreground cursor-pointer hover:bg-muted/40 transition-colors">
            <ImageIcon size={13} />
            <span className="truncate">{imageFile ? imageFile.name : (ar ? "اختار صورة..." : "Choose an image…")}</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
          </label>
        </div>
        {error && <p className="text-[12px] text-rose-500 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 h-10 rounded-xl border border-border/60 text-[13px] font-medium hover:bg-muted/50 transition-colors">{ar ? "إلغاء" : "Cancel"}</button>
          <button type="submit" disabled={loading || !form.name.trim()} className={btnPrimary + " flex-1 h-10"}>
            {loading && <Loader2 size={12} className="animate-spin" />} {initial ? (ar ? "احفظ" : "Save") : (ar ? "ضيف" : "Add")}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ─── Stock Movement Modal ────────────────────────────────

function AddMovementModal({ onClose, onAdd, onResourceUpdate, ar, resources }: {
  onClose: () => void; onAdd: (w: WorkItem) => void; onResourceUpdate: (r: Resource) => void;
  ar: boolean; resources: Resource[];
}) {
  const { workspace } = useAuth();
  const [form, setForm] = useState({ resource: "", moveType: "stock_in", quantity: "", from: "", to: "", reason: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!workspace || !form.resource || !form.quantity) return;
    setLoading(true); setError(null);
    const res = resources.find((r) => r.id === form.resource);
    const moveLabel = MOVE_TYPES.find((m) => m.value === form.moveType);
    try {
      const wid = workspace?.id || "demo";
      const ds = getDataSource();
      const qty = parseInt(form.quantity) || 0;
      const created = await ds.work_items.create(wid, {
        title_en: `${moveLabel?.en || form.moveType}: ${res?.name_en || "Item"} (${form.quantity})`,
        title_ar: `${moveLabel?.ar || form.moveType}: ${res?.name_en || "Item"} (${form.quantity})`,
        type: "stock_movement" as WorkItem["type"],
        status: "done" as WorkItem["status"],
        priority: "medium" as WorkItem["priority"],
        progress: 100, tags: ["inventory"],
        metadata: {
          resource_id: form.resource, resource_name: res?.name_en,
          move_qty: qty, move_type: form.moveType,
          from_location: form.from || null, to_location: form.to || null,
          reason: form.reason || null,
        },
      });
      if (created) onAdd(created as WorkItem);

      // Sync item quantity + status (the part most ERPs get right and demos skip)
      if (res) {
        const m = getMeta(res);
        const cur = m.quantity ?? 0;
        let next = cur;
        if (form.moveType === "stock_in") next = cur + qty;
        else if (form.moveType === "stock_out") next = Math.max(0, cur - qty);
        else if (form.moveType === "adjustment") next = Math.max(0, qty);
        const newMeta = {
          ...(res.metadata as Record<string, unknown>),
          quantity: next,
          inv_status: m.inv_status === "discontinued" ? "discontinued" : computeInvStatus(next, m.reorder_level ?? 0),
          ...(form.moveType === "transfer" && form.to ? { location: form.to } : {}),
        };
        await ds.resources.update(wid, res.id, { metadata: newMeta as Resource["metadata"] });
        onResourceUpdate({ ...res, metadata: newMeta } as Resource);
      }
      onClose();
    } catch { setError(ar ? "فشل الحفظ" : "Failed to save."); }
    finally { setLoading(false); }
  }

  const isAdj = form.moveType === "adjustment";
  return (
    <ModalShell title={ar ? "حركة مخزون" : "Stock Movement"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className={labelCls}>{ar ? "الصنف" : "Item"} <span className="text-rose-400">*</span></label>
          <select value={form.resource} onChange={(e) => setForm((f) => ({ ...f, resource: e.target.value }))} className={selectCls} required>
            <option value="">{ar ? "اختار..." : "Select..."}</option>
            {resources.map((r) => <option key={r.id} value={r.id}>{r.name_en}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>{ar ? "نوع الحركة" : "Movement Type"} <span className="text-rose-400">*</span></label>
            <select value={form.moveType} onChange={(e) => setForm((f) => ({ ...f, moveType: e.target.value }))} className={selectCls}>
              {MOVE_TYPES.map((m) => <option key={m.value} value={m.value}>{ar ? m.ar : m.en}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>{isAdj ? (ar ? "الكمية الجديدة" : "New Quantity") : (ar ? "الكمية" : "Quantity")} <span className="text-rose-400">*</span></label>
            <input type="number" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} min={isAdj ? "0" : "1"} required className={inputCls} />
          </div>
        </div>
        {(form.moveType === "transfer") && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{ar ? "من" : "From"}</label>
              <input type="text" value={form.from} onChange={(e) => setForm((f) => ({ ...f, from: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{ar ? "إلى" : "To"}</label>
              <input type="text" value={form.to} onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))} className={inputCls} />
            </div>
          </div>
        )}
        <div>
          <label className={labelCls}>{ar ? "السبب" : "Reason"}</label>
          <input type="text" value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} className={inputCls} placeholder={ar ? "اختياري" : "Optional"} />
        </div>
        {error && <p className="text-[12px] text-rose-500 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 h-10 rounded-xl border border-border/60 text-[13px] font-medium hover:bg-muted/50 transition-colors">{ar ? "إلغاء" : "Cancel"}</button>
          <button type="submit" disabled={loading || !form.resource || !form.quantity} className={btnPrimary + " flex-1 h-10"}>
            {loading && <Loader2 size={12} className="animate-spin" />} {ar ? "سجّل" : "Record"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ─── Maintenance Modal ───────────────────────────────────

function AddMaintenanceModal({ onClose, onAdd, ar, resources, currency }: { onClose: () => void; onAdd: (w: WorkItem) => void; ar: boolean; resources: Resource[]; currency: string }) {
  const { workspace } = useAuth();
  const [form, setForm] = useState({ resource: "", maintType: "preventive", dueDate: "", cost: "", vendor: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!workspace || !form.resource) return;
    setLoading(true); setError(null);
    const res = resources.find((r) => r.id === form.resource);
    try {
      const created = await getDataSource().work_items.create(workspace?.id || "demo", {
        title_en: `Maintenance: ${res?.name_en || "Asset"}`,
        title_ar: `صيانة: ${res?.name_en || "أصل"}`,
        type: "maintenance" as WorkItem["type"],
        status: "planned" as WorkItem["status"],
        priority: "medium" as WorkItem["priority"],
        due_date: form.dueDate || null,
        progress: 0, tags: ["maintenance"],
        metadata: {
          resource_id: form.resource, resource_name: res?.name_en,
          maint_type: form.maintType, cost: parseFloat(form.cost) || 0,
          vendor_name: form.vendor || null, notes: form.notes || null,
          currency,
        },
      });
      if (created) onAdd(created as WorkItem);
      onClose();
    } catch { setError(ar ? "فشل الحفظ" : "Failed to save."); }
    finally { setLoading(false); }
  }

  return (
    <ModalShell title={ar ? "سجّل صيانة" : "Schedule Maintenance"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className={labelCls}>{ar ? "الأصل / المعدة" : "Asset"} <span className="text-rose-400">*</span></label>
          <select value={form.resource} onChange={(e) => setForm((f) => ({ ...f, resource: e.target.value }))} className={selectCls} required>
            <option value="">{ar ? "اختار..." : "Select..."}</option>
            {resources.filter((r) => !isInventoryItem(r)).map((r) => <option key={r.id} value={r.id}>{r.name_en}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>{ar ? "نوع الصيانة" : "Type"}</label>
            <select value={form.maintType} onChange={(e) => setForm((f) => ({ ...f, maintType: e.target.value }))} className={selectCls}>
              <option value="preventive">{ar ? "وقائية" : "Preventive"}</option>
              <option value="corrective">{ar ? "تصحيحية" : "Corrective"}</option>
              <option value="inspection">{ar ? "فحص" : "Inspection"}</option>
              <option value="emergency">{ar ? "طارئة" : "Emergency"}</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>{ar ? "التاريخ المجدول" : "Scheduled Date"}</label>
            <input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>{ar ? `التكلفة (${currency})` : `Cost (${currency})`}</label>
            <input type="number" value={form.cost} onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))} min="0" className={inputCls} placeholder="0" />
          </div>
          <div>
            <label className={labelCls}>{ar ? "المورد" : "Vendor"}</label>
            <input type="text" value={form.vendor} onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))} className={inputCls} placeholder={ar ? "اختياري" : "Optional"} />
          </div>
        </div>
        <div>
          <label className={labelCls}>{ar ? "ملاحظات" : "Notes"}</label>
          <input type="text" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className={inputCls} />
        </div>
        {error && <p className="text-[12px] text-rose-500 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 h-10 rounded-xl border border-border/60 text-[13px] font-medium hover:bg-muted/50 transition-colors">{ar ? "إلغاء" : "Cancel"}</button>
          <button type="submit" disabled={loading || !form.resource} className={btnPrimary + " flex-1 h-10"}>
            {loading && <Loader2 size={12} className="animate-spin" />} {ar ? "سجّل" : "Schedule"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ─── Detail Drawer ───────────────────────────────────────

function DetailDrawer({ resource, ar, currency, movements, maintenance, abc, onClose, onEdit, onUpdated, onQuickMove }: {
  resource: Resource; ar: boolean; currency: string;
  movements: WorkItem[]; maintenance: WorkItem[]; abc?: "A" | "B" | "C";
  onClose: () => void; onEdit: () => void;
  onUpdated: (r: Resource) => void;
  onQuickMove: (r: Resource, type: "stock_in" | "stock_out", qty: number) => Promise<void>;
}) {
  const { workspace } = useAuth();
  const m = getMeta(resource);
  const isInv = isInventoryItem(resource);
  const cat = RESOURCE_CATEGORIES.find((c) => c.value === resource.type) ?? RESOURCE_CATEGORIES[RESOURCE_CATEGORIES.length - 1];
  const CatIcon = cat.icon;
  const fmtVal = (v: number) => new Intl.NumberFormat(ar ? "ar-SA" : "en-SA", { style: "currency", currency, maximumFractionDigits: 0 }).format(v);
  const dep = depreciation(m);
  const qty = m.quantity ?? 0;
  const [adjQty, setAdjQty] = useState("");
  const [adjLoading, setAdjLoading] = useState<"in" | "out" | null>(null);
  const [uploading, setUploading] = useState<"image" | "file" | null>(null);
  const imgInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [activeImg, setActiveImg] = useState(0);

  const itemMoves = movements.filter((w) => getMoveMeta(w).resource_id === resource.id).slice(0, 8);
  const itemMaint = maintenance.filter((w) => getMaintMeta(w).resource_id === resource.id).slice(0, 8);
  const images = m.images ?? [];
  const files = m.files ?? [];

  async function saveMeta(patch: Record<string, unknown>) {
    const wid = workspace?.id || "demo";
    const newMeta = { ...(resource.metadata as Record<string, unknown>), ...patch };
    await getDataSource().resources.update(wid, resource.id, { metadata: newMeta as Resource["metadata"] });
    onUpdated({ ...resource, metadata: newMeta } as Resource);
  }

  async function handleUpload(kind: "image" | "file", file: File | undefined | null) {
    if (!file) return;
    setUploading(kind);
    try {
      const att = await attachFile(workspace?.id || "demo", file, kind === "image");
      if (!att) return;
      if (kind === "image") await saveMeta({ images: [...images, att.url] });
      else await saveMeta({ files: [...files, att] });
    } finally { setUploading(null); }
  }

  async function quickAdjust(dir: "in" | "out") {
    const q = parseInt(adjQty) || 0;
    if (q <= 0) return;
    setAdjLoading(dir);
    try { await onQuickMove(resource, dir === "in" ? "stock_in" : "stock_out", q); setAdjQty(""); }
    finally { setAdjLoading(null); }
  }

  const stockTarget = Math.max(m.max_level || 0, (m.reorder_level || 0) * 2, qty, 1);
  const stockPct = Math.min(qty / stockTarget, 1);
  const st = isInv
    ? (INV_STATUSES.find((s) => s.value === (m.inv_status === "discontinued" ? "discontinued" : computeInvStatus(qty, m.reorder_level ?? 0))) ?? INV_STATUSES[0])
    : (ASSET_STATUSES.find((s) => s.value === m.asset_status) ?? ASSET_STATUSES[0]);

  const detailRows: { label: string; value?: string | null }[] = isInv ? [
    { label: ar ? "الباركود" : "Barcode", value: m.barcode },
    { label: ar ? "وحدة القياس" : "Unit", value: UOMS.find((u) => u.value === m.uom) ? (ar ? UOMS.find((u) => u.value === m.uom)!.ar : UOMS.find((u) => u.value === m.uom)!.en) : m.uom },
    { label: ar ? "الموقع" : "Location", value: m.location },
    { label: ar ? "العلامة / المورد" : "Brand / Vendor", value: m.brand || m.vendor_name },
    { label: ar ? "حد إعادة الطلب" : "Reorder Level", value: m.reorder_level?.toString() },
    { label: ar ? "الحد الأقصى" : "Max Level", value: m.max_level ? m.max_level.toString() : undefined },
    { label: ar ? "ملاحظات" : "Notes", value: m.notes },
  ] : [
    { label: ar ? "الرقم التسلسلي" : "Serial No.", value: m.serial_no },
    { label: ar ? "مخصص لـ" : "Assigned To", value: m.assigned_to },
    { label: ar ? "القسم" : "Department", value: m.assigned_dept || resource.department },
    { label: ar ? "الموقع" : "Location", value: m.location },
    { label: ar ? "العلامة / المورد" : "Brand / Vendor", value: m.brand || m.vendor_name },
    { label: ar ? "تاريخ الشراء" : "Purchase Date", value: m.purchase_date },
    { label: ar ? "انتهاء الضمان" : "Warranty Expiry", value: m.warranty_expiry },
    { label: ar ? "الحالة الفنية" : "Condition", value: m.condition },
    { label: ar ? "ملاحظات" : "Notes", value: m.notes },
  ];

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px]" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 w-full max-w-[480px] bg-background border-l rtl:border-l-0 rtl:border-r border-border/60 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/40 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cat.color}`}><CatIcon size={14} /></div>
            <div className="min-w-0">
              <p className="text-[14px] font-medium truncate" style={{ fontFamily: "var(--app-font-serif)" }}>{resource.name_en}</p>
              <p className="text-[10px] text-muted-foreground font-mono truncate">{isInv ? (m.sku || "—") : (m.asset_tag || "—")}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={onEdit} title={ar ? "تعديل" : "Edit"} className="w-8 h-8 rounded-lg flex items-center justify-center border border-border/60 hover:bg-muted/50 transition-colors"><Pencil size={13} /></button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"><X size={14} /></button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Image gallery */}
          <div>
            {images.length > 0 ? (
              <div>
                <div className="rounded-xl overflow-hidden border border-border/40 bg-muted/30 aspect-[16/9]">
                  <img src={images[Math.min(activeImg, images.length - 1)]} alt={resource.name_en} className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {images.map((src, i) => (
                    <button key={i} onClick={() => setActiveImg(i)} className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === activeImg ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"}`}>
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                  <button onClick={() => imgInput.current?.click()} disabled={uploading === "image"} className="w-12 h-12 rounded-lg border border-dashed border-border/70 flex items-center justify-center text-muted-foreground hover:bg-muted/40 transition-colors">
                    {uploading === "image" ? <Loader2 size={13} className="animate-spin" /> : <Plus size={14} />}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => imgInput.current?.click()} disabled={uploading === "image"} className="w-full rounded-xl border border-dashed border-border/70 aspect-[16/7] flex flex-col items-center justify-center gap-2 text-muted-foreground/60 hover:bg-muted/30 transition-colors">
                {uploading === "image" ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={18} strokeWidth={1.5} />}
                <span className="text-[11px]">{ar ? "ضيف صورة للصنف" : "Add a photo"}</span>
              </button>
            )}
            <input ref={imgInput} type="file" accept="image/*" className="hidden" onChange={(e) => { handleUpload("image", e.target.files?.[0]); e.target.value = ""; }} />
          </div>

          {/* KPI strip */}
          <div className="grid grid-cols-3 gap-2.5">
            {isInv ? (
              <>
                <div className={cardCls + " px-3 py-2.5"}>
                  <p className="text-[15px] font-medium tabular-nums leading-none" style={{ fontFamily: "var(--app-font-serif)" }}>{qty}</p>
                  <p className="text-[9px] text-muted-foreground mt-1">{ar ? "الكمية" : "On Hand"}{m.uom ? ` (${m.uom})` : ""}</p>
                </div>
                <div className={cardCls + " px-3 py-2.5"}>
                  <p className="text-[15px] font-medium tabular-nums leading-none" style={{ fontFamily: "var(--app-font-serif)" }}>{fmtVal(m.unit_cost || 0)}</p>
                  <p className="text-[9px] text-muted-foreground mt-1">{ar ? "سعر الوحدة" : "Unit Cost"}</p>
                </div>
                <div className={cardCls + " px-3 py-2.5"}>
                  <p className="text-[15px] font-medium tabular-nums leading-none" style={{ fontFamily: "var(--app-font-serif)" }}>{fmtVal(qty * (m.unit_cost || 0))}</p>
                  <p className="text-[9px] text-muted-foreground mt-1">{ar ? "القيمة الإجمالية" : "Total Value"}</p>
                </div>
              </>
            ) : (
              <>
                <div className={cardCls + " px-3 py-2.5"}>
                  <p className="text-[15px] font-medium tabular-nums leading-none" style={{ fontFamily: "var(--app-font-serif)" }}>{fmtVal(m.purchase_cost || 0)}</p>
                  <p className="text-[9px] text-muted-foreground mt-1">{ar ? "تكلفة الشراء" : "Purchase Cost"}</p>
                </div>
                <div className={cardCls + " px-3 py-2.5"}>
                  <p className="text-[15px] font-medium tabular-nums leading-none text-emerald-700" style={{ fontFamily: "var(--app-font-serif)" }}>{fmtVal(dep.book)}</p>
                  <p className="text-[9px] text-muted-foreground mt-1">{ar ? "القيمة الدفترية" : "Book Value"}</p>
                </div>
                <div className={cardCls + " px-3 py-2.5"}>
                  <p className="text-[15px] font-medium tabular-nums leading-none" style={{ fontFamily: "var(--app-font-serif)" }}>{Math.round(dep.agePct * 100)}%</p>
                  <p className="text-[9px] text-muted-foreground mt-1">{ar ? "نسبة الإهلاك" : "Depreciated"}</p>
                </div>
              </>
            )}
          </div>

          {/* Status + ABC */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.pill}`}>{ar ? st.ar : st.en}</span>
            {isInv && abc && <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ABC_STYLES[abc]}`}>{ar ? `تصنيف ${abc}` : `Class ${abc}`}</span>}
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{ar ? cat.ar : cat.en}</span>
          </div>

          {/* Stock level bar + quick adjust */}
          {isInv && (
            <div className={cardCls + " p-4"}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-medium text-muted-foreground">{ar ? "مستوى المخزون" : "Stock Level"}</p>
                <p className="text-[10px] text-muted-foreground tabular-nums">{qty} / {stockTarget}</p>
              </div>
              <div className="h-2 rounded-full bg-muted/60 overflow-hidden mb-4">
                <div className={`h-full rounded-full transition-all duration-700 ${qty === 0 ? "bg-rose-400" : qty <= (m.reorder_level || 0) ? "bg-amber-400" : "bg-emerald-400"}`} style={{ width: `${stockPct * 100}%` }} />
              </div>
              <div className="flex items-center gap-2">
                <input type="number" min="1" value={adjQty} onChange={(e) => setAdjQty(e.target.value)} placeholder={ar ? "كمية" : "Qty"} className="h-9 w-20 rounded-xl border border-border/60 bg-background px-3 text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/20" />
                <button onClick={() => quickAdjust("in")} disabled={!adjQty || !!adjLoading} className="flex-1 h-9 rounded-xl border border-emerald-200/70 bg-emerald-50/50 text-emerald-700 text-[11.5px] font-medium hover:bg-emerald-50 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40">
                  {adjLoading === "in" ? <Loader2 size={11} className="animate-spin" /> : <ArrowUpRight size={12} />} {ar ? "وارد" : "Stock In"}
                </button>
                <button onClick={() => quickAdjust("out")} disabled={!adjQty || !!adjLoading} className="flex-1 h-9 rounded-xl border border-rose-200/70 bg-rose-50/50 text-rose-600 text-[11.5px] font-medium hover:bg-rose-50 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40">
                  {adjLoading === "out" ? <Loader2 size={11} className="animate-spin" /> : <ArrowDownRight size={12} />} {ar ? "صادر" : "Stock Out"}
                </button>
              </div>
            </div>
          )}

          {/* Depreciation card */}
          {!isInv && (m.purchase_cost || 0) > 0 && m.purchase_date && (
            <div className={cardCls + " p-4"}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown size={13} className="text-muted-foreground" />
                <p className="text-[11px] font-medium text-muted-foreground">{ar ? "الإهلاك (قسط ثابت)" : "Depreciation (Straight-line)"}</p>
              </div>
              <div className="h-2 rounded-full bg-muted/60 overflow-hidden mb-3">
                <div className="h-full rounded-full bg-violet-400 transition-all duration-700" style={{ width: `${dep.agePct * 100}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div><p className="text-[12px] font-medium tabular-nums">{fmtVal(dep.annual)}</p><p className="text-[9px] text-muted-foreground">{ar ? "سنوياً" : "Annual"}</p></div>
                <div><p className="text-[12px] font-medium tabular-nums">{fmtVal(dep.depreciated)}</p><p className="text-[9px] text-muted-foreground">{ar ? "مُهلك" : "Accumulated"}</p></div>
                <div><p className="text-[12px] font-medium tabular-nums">{m.useful_life_years || 5} {ar ? "سنين" : "yrs"}</p><p className="text-[9px] text-muted-foreground">{ar ? "العمر الإنتاجي" : "Useful Life"}</p></div>
              </div>
            </div>
          )}

          {/* Details */}
          <div>
            <h4 className="text-[12px] font-medium mb-2.5" style={{ fontFamily: "var(--app-font-serif)" }}>{ar ? "التفاصيل" : "Details"}</h4>
            <div className={cardCls + " divide-y divide-border/30"}>
              {detailRows.filter((d) => d.value).map((d, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5">
                  <p className="text-[11px] text-muted-foreground">{d.label}</p>
                  <p className="text-[11.5px] font-medium text-end max-w-[60%] truncate">{d.value}</p>
                </div>
              ))}
              {detailRows.filter((d) => d.value).length === 0 && <p className="text-[11px] text-muted-foreground/50 px-4 py-3">{ar ? "مفيش تفاصيل إضافية" : "No extra details"}</p>}
            </div>
          </div>

          {/* Files */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-[12px] font-medium" style={{ fontFamily: "var(--app-font-serif)" }}>{ar ? "المرفقات" : "Files"} {files.length > 0 && <span className="text-muted-foreground/60">({files.length})</span>}</h4>
              <button onClick={() => fileInput.current?.click()} disabled={uploading === "file"} className="flex items-center gap-1.5 text-[11px] font-medium text-primary hover:opacity-70 transition-opacity">
                {uploading === "file" ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />} {ar ? "ارفع ملف" : "Upload"}
              </button>
              <input ref={fileInput} type="file" className="hidden" onChange={(e) => { handleUpload("file", e.target.files?.[0]); e.target.value = ""; }} />
            </div>
            {files.length === 0 ? (
              <p className="text-[11px] text-muted-foreground/50 py-2">{ar ? "مفيش ملفات مرفقة — فواتير، ضمانات، كتالوجات..." : "No files yet — invoices, warranties, datasheets…"}</p>
            ) : (
              <div className="space-y-1.5">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-border/40 bg-background">
                    <FileText size={13} className="text-muted-foreground shrink-0" />
                    <a href={f.url} target="_blank" rel="noreferrer" className="flex-1 min-w-0 text-[12px] font-medium truncate hover:underline">{f.name}</a>
                    <span className="text-[10px] text-muted-foreground shrink-0">{fmtBytes(f.size)}</span>
                    <button onClick={() => saveMeta({ files: files.filter((_, j) => j !== i) })} className="p-1 rounded-md hover:bg-rose-50 text-rose-400 transition-colors shrink-0"><X size={11} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* History */}
          <div>
            <h4 className="text-[12px] font-medium mb-2.5 flex items-center gap-1.5" style={{ fontFamily: "var(--app-font-serif)" }}>
              <History size={12} className="text-muted-foreground" /> {isInv ? (ar ? "آخر الحركات" : "Recent Movements") : (ar ? "سجل الصيانة" : "Maintenance History")}
            </h4>
            {isInv ? (
              itemMoves.length === 0 ? <p className="text-[11px] text-muted-foreground/50 py-2">{ar ? "مفيش حركات لسه" : "No movements yet"}</p> : (
                <div className="space-y-1.5">
                  {itemMoves.map((w) => {
                    const mm = getMoveMeta(w);
                    const mt = MOVE_TYPES.find((t) => t.value === mm.move_type);
                    const isOut = mm.move_type === "stock_out";
                    return (
                      <div key={w.id} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-border/40">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${isOut ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-700"}`}>{mt ? (ar ? mt.ar : mt.en) : mm.move_type}</span>
                        <p className="flex-1 text-[11px] text-muted-foreground truncate">{mm.reason || w.created_at.slice(0, 10)}</p>
                        <p className="text-[12.5px] font-semibold tabular-nums shrink-0" style={{ fontFamily: "var(--app-font-serif)" }}>{isOut ? "-" : "+"}{mm.move_qty}</p>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              itemMaint.length === 0 ? <p className="text-[11px] text-muted-foreground/50 py-2">{ar ? "مفيش صيانة مسجلة" : "No maintenance recorded"}</p> : (
                <div className="space-y-1.5">
                  {itemMaint.map((w) => {
                    const mm = getMaintMeta(w);
                    const stx = MAINT_STATUSES.find((s) => s.value === w.status) ?? MAINT_STATUSES[0];
                    return (
                      <div key={w.id} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-border/40">
                        <Wrench size={12} className="text-amber-500 shrink-0" />
                        <p className="flex-1 text-[11px] truncate">{mm.maint_type}{w.due_date ? ` · ${w.due_date.slice(0, 10)}` : ""}</p>
                        {mm.cost ? <p className="text-[11px] font-medium tabular-nums shrink-0">{fmtVal(mm.cost)}</p> : null}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${stx.pill}`}>{ar ? stx.ar : stx.en}</span>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────

type InvTab = "dashboard" | "materials" | "inventory" | "assets" | "movements" | "maintenance";
type SortKey = "value" | "qty" | "name";

export default function Inventory() {
  const { lang } = useLanguage();
  const { workspace } = useAuth();
  const ar = lang === "ar";
  const settings = workspace?.settings as Record<string, unknown> | undefined;
  const currency = (settings?.currency as string) || "SAR";

  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [tab, setTab] = useState<InvTab>("dashboard");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [invModal, setInvModal] = useState(false);
  const [assetModal, setAssetModal] = useState(false);
  const [moveModal, setMoveModal] = useState(false);
  const [maintModal, setMaintModal] = useState(false);
  const [selected, setSelected] = useState<Resource | null>(null);
  const [editTarget, setEditTarget] = useState<Resource | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const wid = workspace?.id || "demo";
    const ds = getDataSource();
    Promise.all([ds.resources.list(wid), ds.work_items.list(wid)])
      .then(([r, w]) => { setResources(r as Resource[]); setWorkItems(w as WorkItem[]); })
      .finally(() => setLoading(false));
  }, [workspace?.id]);

  const invItems = useMemo(() => resources.filter(isInventoryItem), [resources]);
  const products = useMemo(() => resources.filter(isProduct), [resources]);
  const assets = useMemo(() => resources.filter((r) => !isInventoryItem(r) && !isProduct(r)), [resources]);
  const movements = useMemo(() => workItems.filter((w) => w.type === "stock_movement"), [workItems]);
  const maintenance = useMemo(() => workItems.filter((w) => w.type === "maintenance"), [workItems]);

  const fmtVal = (v: number) => new Intl.NumberFormat(ar ? "ar-SA" : "en-SA", { style: "currency", currency, maximumFractionDigits: 0 }).format(v);
  const fmtCompact = (v: number) => new Intl.NumberFormat(ar ? "ar-SA" : "en-SA", { style: "currency", currency, notation: "compact", maximumFractionDigits: 1 }).format(v);

  // ── Metrics ──
  const totalStockValue = invItems.reduce((s, r) => { const m = getMeta(r); return s + ((m.quantity || 0) * (m.unit_cost || 0)); }, 0);
  const lowStock = invItems.filter((r) => { const m = getMeta(r); return (m.quantity || 0) > 0 && (m.quantity || 0) <= (m.reorder_level || 0); });
  const outOfStock = invItems.filter((r) => { const m = getMeta(r); return (m.quantity ?? 0) === 0 || m.inv_status === "out_of_stock"; });
  const inMaintenance = maintenance.filter((m) => ["planned", "in_progress"].includes(m.status));
  const assignedAssets = assets.filter((r) => getMeta(r).asset_status === "assigned" || getMeta(r).assigned_to);
  const totalAssetValue = assets.reduce((s, r) => s + (getMeta(r).purchase_cost || 0), 0);
  const totalBookValue = assets.reduce((s, r) => s + depreciation(getMeta(r)).book, 0);

  // ── ABC analysis (80/15/5 of inventory value) ──
  const abcMap = useMemo(() => {
    const vals = invItems
      .map((r) => { const m = getMeta(r); return { id: r.id, v: (m.quantity || 0) * (m.unit_cost || 0) }; })
      .sort((a, b) => b.v - a.v);
    const total = vals.reduce((s, x) => s + x.v, 0);
    const map: Record<string, "A" | "B" | "C"> = {};
    if (total <= 0) return map;
    let cum = 0;
    for (const x of vals) {
      cum += x.v;
      map[x.id] = cum / total <= 0.8 ? "A" : cum / total <= 0.95 ? "B" : "C";
    }
    return map;
  }, [invItems]);

  const abcSummary = useMemo(() => {
    const sum = { A: { n: 0, v: 0 }, B: { n: 0, v: 0 }, C: { n: 0, v: 0 } };
    for (const r of invItems) {
      const cls = abcMap[r.id]; if (!cls) continue;
      const m = getMeta(r);
      sum[cls].n += 1; sum[cls].v += (m.quantity || 0) * (m.unit_cost || 0);
    }
    return sum;
  }, [invItems, abcMap]);

  // ── Chart data ──
  const invByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of invItems) { const m = getMeta(r); map.set(r.type, (map.get(r.type) || 0) + (m.quantity || 0) * (m.unit_cost || 0)); }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([type, v]) => {
      const c = RESOURCE_CATEGORIES.find((x) => x.value === type) ?? RESOURCE_CATEGORIES[RESOURCE_CATEGORIES.length - 1];
      return { label: ar ? c.ar : c.en, value: v, color: c.hex };
    });
  }, [invItems, ar]);

  const assetsByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of assets) map.set(r.type, (map.get(r.type) || 0) + depreciation(getMeta(r)).book);
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([type, v]) => {
      const c = RESOURCE_CATEGORIES.find((x) => x.value === type) ?? RESOURCE_CATEGORIES[RESOURCE_CATEGORIES.length - 1];
      return { label: ar ? c.ar : c.en, value: v, color: c.hex };
    });
  }, [assets, ar]);

  const topValueItems = useMemo(() =>
    invItems
      .map((r) => { const m = getMeta(r); return { r, v: (m.quantity || 0) * (m.unit_cost || 0) }; })
      .sort((a, b) => b.v - a.v).slice(0, 5)
      .map((x) => ({ label: x.r.name_en, value: x.v, color: "#8b5cf6", sub: getMeta(x.r).sku })),
  [invItems]);

  const flowMonths = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string; inn: number; out: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: new Intl.DateTimeFormat(ar ? "ar" : "en", { month: "short" }).format(d),
        inn: 0, out: 0,
      });
    }
    for (const w of movements) {
      const d = new Date(w.created_at);
      const slot = months.find((m) => m.key === `${d.getFullYear()}-${d.getMonth()}`);
      if (!slot) continue;
      const mm = getMoveMeta(w);
      const q = mm.move_qty || 0;
      if (mm.move_type === "stock_out") slot.out += q;
      else if (mm.move_type === "stock_in") slot.inn += q;
    }
    return months;
  }, [movements, ar]);

  // ── Smart insights ──
  const insights = useMemo(() => {
    const now = Date.now();
    const out: { icon: React.ElementType; tone: string; title: string; desc: string }[] = [];
    // Reorder suggestions with suggested order qty
    for (const r of [...outOfStock, ...lowStock].slice(0, 4)) {
      const m = getMeta(r);
      const target = Math.max(m.max_level || 0, (m.reorder_level || 0) * 2);
      const suggested = Math.max(target - (m.quantity || 0), m.reorder_level || 1);
      out.push({
        icon: AlertTriangle, tone: (m.quantity ?? 0) === 0 ? "text-rose-500 bg-rose-50/60 border-rose-200/40" : "text-amber-600 bg-amber-50/60 border-amber-200/40",
        title: ar ? `اطلب ${r.name_en}` : `Reorder ${r.name_en}`,
        desc: ar ? `الكمية ${m.quantity ?? 0} — الكمية المقترحة للطلب: ${suggested}${m.vendor_name ? ` من ${m.vendor_name}` : ""}` : `On hand ${m.quantity ?? 0} — suggested order qty: ${suggested}${m.vendor_name ? ` from ${m.vendor_name}` : ""}`,
      });
    }
    // Dead stock: qty > 0, no movement in 90 days
    const ninety = 90 * 24 * 3600 * 1000;
    const deadStock = invItems.filter((r) => {
      const m = getMeta(r);
      if ((m.quantity || 0) <= 0) return false;
      const last = movements.filter((w) => getMoveMeta(w).resource_id === r.id)
        .map((w) => new Date(w.created_at).getTime()).sort((a, b) => b - a)[0];
      const ref = last ?? new Date(r.created_at).getTime();
      return now - ref > ninety;
    });
    if (deadStock.length > 0) {
      const v = deadStock.reduce((s, r) => { const m = getMeta(r); return s + (m.quantity || 0) * (m.unit_cost || 0); }, 0);
      out.push({
        icon: Clock, tone: "text-slate-600 bg-slate-50/60 border-slate-200/50",
        title: ar ? `${deadStock.length} صنف راكد` : `${deadStock.length} slow-moving item${deadStock.length > 1 ? "s" : ""}`,
        desc: ar ? `مفيش حركة من ٩٠ يوم — قيمة محتجزة ${fmtVal(v)}` : `No movement in 90+ days — ${fmtVal(v)} tied up`,
      });
    }
    // Warranty expiring within 60 days
    for (const r of assets) {
      const m = getMeta(r);
      if (!m.warranty_expiry) continue;
      const days = Math.ceil((new Date(m.warranty_expiry).getTime() - now) / (24 * 3600 * 1000));
      if (days > 0 && days <= 60) {
        out.push({
          icon: ShieldAlert, tone: "text-blue-600 bg-blue-50/60 border-blue-200/40",
          title: ar ? `ضمان ${r.name_en} بينتهي قريب` : `${r.name_en} warranty expiring`,
          desc: ar ? `باقي ${days} يوم على انتهاء الضمان` : `${days} day${days > 1 ? "s" : ""} left on warranty`,
        });
      }
    }
    // Overdue maintenance
    const overdue = maintenance.filter((w) => w.status === "planned" && w.due_date && new Date(w.due_date).getTime() < now);
    for (const w of overdue.slice(0, 3)) {
      const mm = getMaintMeta(w);
      out.push({
        icon: Wrench, tone: "text-rose-500 bg-rose-50/60 border-rose-200/40",
        title: ar ? `صيانة متأخرة: ${mm.resource_name || w.title_en}` : `Overdue maintenance: ${mm.resource_name || w.title_en}`,
        desc: ar ? `كانت مجدولة ${w.due_date?.slice(0, 10)}` : `Was scheduled for ${w.due_date?.slice(0, 10)}`,
      });
    }
    return out.slice(0, 7);
  }, [invItems, assets, movements, maintenance, lowStock, outOfStock, ar]); // eslint-disable-line react-hooks/exhaustive-deps

  const maintCostTotal = maintenance.reduce((s, w) => s + (getMaintMeta(w).cost || 0), 0);

  // ── Reorder planner (procurement view) ──
  const reorderPlan = useMemo(() =>
    [...outOfStock, ...lowStock].map((r) => {
      const m = getMeta(r);
      const qty = m.quantity ?? 0;
      const target = Math.max(m.max_level || 0, (m.reorder_level || 0) * 2);
      const suggested = Math.max(target - qty, m.reorder_level || 1);
      return { name: r.name_en, qty, suggested, vendor: m.vendor_name, cost: suggested * (m.unit_cost || 0) };
    }).sort((a, b) => b.cost - a.cost),
  [outOfStock, lowStock]); // eslint-disable-line react-hooks/exhaustive-deps
  const reorderBudget = reorderPlan.reduce((s, x) => s + x.cost, 0);

  const hasData = resources.length > 0 || movements.length > 0 || maintenance.length > 0;

  // ── Filtering + sorting ──
  function applyFilters(list: Resource[], isInv: boolean): Resource[] {
    const q = search.toLowerCase().trim();
    let res = list;
    if (q) res = res.filter((r) => {
      const m = getMeta(r);
      return r.name_en.toLowerCase().includes(q) || (m.sku ?? "").toLowerCase().includes(q) || (m.asset_tag ?? "").toLowerCase().includes(q) || (m.barcode ?? "").toLowerCase().includes(q) || (m.location ?? "").toLowerCase().includes(q);
    });
    if (catFilter !== "all") res = res.filter((r) => r.type === catFilter);
    if (statusFilter !== "all") res = res.filter((r) => {
      const m = getMeta(r);
      if (isInv) {
        const st = m.inv_status === "discontinued" ? "discontinued" : computeInvStatus(m.quantity ?? 0, m.reorder_level ?? 0);
        return st === statusFilter;
      }
      return (m.asset_status ?? "active") === statusFilter;
    });
    const val = (r: Resource) => { const m = getMeta(r); return isInv ? (m.quantity || 0) * (m.unit_cost || 0) : depreciation(m).book; };
    return [...res].sort((a, b) =>
      sortKey === "name" ? a.name_en.localeCompare(b.name_en)
      : sortKey === "qty" ? (getMeta(a).quantity || 0) - (getMeta(b).quantity || 0)
      : val(b) - val(a));
  }
  const filteredInv = useMemo(() => applyFilters(invItems, true), [invItems, search, catFilter, statusFilter, sortKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const filteredAssets = useMemo(() => applyFilters(assets, false), [assets, search, catFilter, statusFilter, sortKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const presentCats = useMemo(() => {
    const list = tab === "assets" ? assets : invItems;
    return RESOURCE_CATEGORIES.filter((c) => list.some((r) => r.type === c.value));
  }, [tab, assets, invItems]);

  // ── Actions ──
  function patchResource(updated: Resource) {
    setResources((prev) => prev.map((r) => r.id === updated.id ? updated : r));
    setSelected((cur) => cur?.id === updated.id ? updated : cur);
  }

  async function quickMove(r: Resource, type: "stock_in" | "stock_out", qty: number) {
    const wid = workspace?.id || "demo";
    const ds = getDataSource();
    const moveLabel = MOVE_TYPES.find((m) => m.value === type);
    const created = await ds.work_items.create(wid, {
      title_en: `${moveLabel?.en}: ${r.name_en} (${qty})`,
      title_ar: `${moveLabel?.ar}: ${r.name_en} (${qty})`,
      type: "stock_movement" as WorkItem["type"], status: "done" as WorkItem["status"],
      priority: "medium" as WorkItem["priority"], progress: 100, tags: ["inventory"],
      metadata: { resource_id: r.id, resource_name: r.name_en, move_qty: qty, move_type: type, reason: ar ? "تعديل سريع" : "Quick adjust" },
    });
    if (created) setWorkItems((prev) => [created as WorkItem, ...prev]);
    const m = getMeta(r);
    const cur = m.quantity ?? 0;
    const next = type === "stock_in" ? cur + qty : Math.max(0, cur - qty);
    const newMeta = {
      ...(r.metadata as Record<string, unknown>),
      quantity: next,
      inv_status: m.inv_status === "discontinued" ? "discontinued" : computeInvStatus(next, m.reorder_level ?? 0),
    };
    await ds.resources.update(wid, r.id, { metadata: newMeta as Resource["metadata"] });
    patchResource({ ...r, metadata: newMeta } as Resource);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    await getDataSource().resources.remove(workspace?.id || "demo", deleteTarget.id);
    setResources((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    if (selected?.id === deleteTarget.id) setSelected(null);
    setDeleteLoading(false);
    setDeleteTarget(null);
  }

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 size={20} className="animate-spin text-muted-foreground/40" /></div>;

  const stockHealthSegments = [
    { label: ar ? "متوفر" : "In Stock", value: invItems.length - lowStock.length - outOfStock.length, color: "#34d399" },
    { label: ar ? "قليل" : "Low", value: lowStock.length, color: "#fbbf24" },
    { label: ar ? "خلص" : "Out", value: outOfStock.length, color: "#fb7185" },
  ];

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="border-b border-border/40 px-7 md:px-10 py-7" style={{ background: "linear-gradient(160deg, hsl(var(--muted)/0.3) 0%, hsl(var(--background)) 60%)" }}>
        <div className="max-w-[1100px]">
          <div className="flex items-center gap-2.5 mb-2">
            <Package size={14} className="text-primary" />
            <p className="text-[11px] text-muted-foreground/60 tracking-[0.08em] uppercase">{ar ? "المخزون والأصول" : "Inventory & Assets"}</p>
          </div>
          <div className="flex items-start justify-between gap-4 mb-5">
            <h1 className="text-[26px] font-medium text-foreground leading-tight" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.025em" }}>
              {ar ? "المخزون والأصول" : "Inventory & Assets"}
            </h1>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setMoveModal(true)} className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border/60 text-[12px] font-medium hover:bg-muted/50 transition-colors">
                <ArrowDownUp size={13} /> {ar ? "حركة مخزون" : "Movement"}
              </button>
              <button onClick={() => setMaintModal(true)} className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border/60 text-[12px] font-medium hover:bg-muted/50 transition-colors">
                <Wrench size={13} /> {ar ? "صيانة" : "Maintenance"}
              </button>
              <button onClick={() => setInvModal(true)} className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border/60 text-[12px] font-medium hover:bg-muted/50 transition-colors">
                <Box size={13} /> {ar ? "صنف مخزون" : "Inventory"}
              </button>
              <button onClick={() => setAssetModal(true)} className={btnPrimary + " h-9"}>
                <Plus size={14} /> {ar ? "أصل جديد" : "New Asset"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {[
              { icon: Box, value: invItems.length, label: ar ? "أصناف المخزون" : "Inventory Items", color: "text-violet-600" },
              { icon: DollarSign, value: fmtVal(totalStockValue), label: ar ? "قيمة المخزون" : "Stock Value", color: "text-primary" },
              { icon: AlertTriangle, value: lowStock.length, label: ar ? "كمية قليلة" : "Low Stock", color: lowStock.length > 0 ? "text-amber-600" : "text-slate-400" },
              { icon: Package, value: assets.length, label: ar ? "الأصول" : "Assets", color: "text-blue-600" },
              { icon: DollarSign, value: fmtVal(totalAssetValue), label: ar ? "تكلفة الأصول" : "Asset Cost", color: "text-foreground" },
              { icon: TrendingDown, value: fmtVal(totalBookValue), label: ar ? "القيمة الدفترية" : "Book Value", color: "text-emerald-700" },
              { icon: Wrench, value: inMaintenance.length, label: ar ? "في الصيانة" : "In Maintenance", color: inMaintenance.length > 0 ? "text-amber-600" : "text-slate-400" },
              { icon: CheckCircle2, value: assignedAssets.length, label: ar ? "مخصصة" : "Assigned", color: "text-emerald-600" },
            ].map((m, i) => (
              <div key={i} className="bg-background border border-border/40 rounded-xl px-3.5 py-3">
                <m.icon size={13} strokeWidth={1.75} className={m.color + " mb-1.5"} />
                <p className="text-[15px] font-medium text-foreground leading-none tabular-nums mb-0.5 truncate" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.02em" }}>
                  {m.value}
                </p>
                <p className="text-[9px] text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/40">
        <div className="px-7 md:px-10 flex items-center gap-0 overflow-x-auto">
          {([
            { id: "dashboard" as const, en: "Analytics", ar: "التحليلات" },
            { id: "materials" as const, en: `Materials & BOM (${products.length})`, ar: `الخامات والمكونات (${products.length})` },
            { id: "inventory" as const, en: `Inventory (${invItems.length})`, ar: `المخزون (${invItems.length})` },
            { id: "assets" as const, en: `Assets (${assets.length})`, ar: `الأصول (${assets.length})` },
            { id: "movements" as const, en: `Movements (${movements.length})`, ar: `الحركات (${movements.length})` },
            { id: "maintenance" as const, en: `Maintenance (${maintenance.length})`, ar: `الصيانة (${maintenance.length})` },
          ]).map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id); setSearch(""); setCatFilter("all"); setStatusFilter("all"); }}
              className={`px-4 py-3 text-[12px] font-medium border-b-2 whitespace-nowrap transition-all ${tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {ar ? t.ar : t.en}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-7 md:px-10 py-6 max-w-[1100px]">
        {!hasData && tab === "dashboard" ? (
          <div className="flex flex-col items-center justify-center py-20 gap-5">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center"><Package size={24} className="text-muted-foreground/40" /></div>
            <div className="text-center max-w-[400px]">
              <p className="text-[15px] font-medium mb-1" style={{ fontFamily: "var(--app-font-serif)" }}>{ar ? "مفيش بيانات مخزون أو أصول لسه" : "No inventory or assets yet"}</p>
              <p className="text-[13px] text-muted-foreground leading-relaxed">{ar ? "ضيف أول صنف مخزون أو أصل عشان تبدأ." : "Add your first inventory item or asset to get started."}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setInvModal(true)} className={btnPrimary + " h-10"}><Box size={14} /> {ar ? "صنف مخزون" : "Add Inventory"}</button>
              <button onClick={() => setAssetModal(true)} className="flex items-center gap-2 h-10 px-5 rounded-xl border border-border/60 text-[13px] font-medium hover:bg-muted/50 transition-colors"><Package size={14} /> {ar ? "أصل جديد" : "Add Asset"}</button>
            </div>
          </div>
        ) : tab === "dashboard" ? (
          <div className="space-y-5">
            {/* Row 1: stock health + value by category */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <ChartCard title={ar ? "صحة المخزون" : "Stock Health"} sub={ar ? "توزيع حالات الأصناف" : "Item availability split"}>
                <div className="flex items-center gap-5">
                  <Donut segments={stockHealthSegments} centerValue={`${invItems.length}`} centerLabel={ar ? "صنف" : "items"} />
                  <div className="space-y-2 flex-1">
                    {stockHealthSegments.map((s, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                        <p className="text-[11px] text-muted-foreground flex-1">{s.label}</p>
                        <p className="text-[11.5px] font-medium tabular-nums">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </ChartCard>
              <ChartCard title={ar ? "قيمة المخزون حسب التصنيف" : "Stock Value by Category"} sub={fmtVal(totalStockValue)}>
                {invByCategory.length === 0 ? <p className="text-[11px] text-muted-foreground/50 py-6 text-center">{ar ? "مفيش بيانات" : "No data"}</p> : <HBarList rows={invByCategory} fmt={fmtCompact} />}
              </ChartCard>
              <ChartCard title={ar ? "قيمة الأصول حسب التصنيف" : "Asset Value by Category"} sub={`${ar ? "القيمة الدفترية" : "Book value"} ${fmtVal(totalBookValue)}`}>
                {assetsByCategory.length === 0 ? <p className="text-[11px] text-muted-foreground/50 py-6 text-center">{ar ? "مفيش بيانات" : "No data"}</p> : <HBarList rows={assetsByCategory} fmt={fmtCompact} />}
              </ChartCard>
            </div>

            {/* Row 2: movement flow + ABC + maintenance */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <ChartCard title={ar ? "حركة المخزون" : "Movement Flow"} sub={ar ? "آخر ٦ شهور" : "Last 6 months"}>
                <FlowColumns months={flowMonths} ar={ar} />
              </ChartCard>
              <ChartCard title={ar ? "تحليل ABC" : "ABC Analysis"} sub={ar ? "تصنيف الأصناف حسب القيمة" : "Items classified by value share"}>
                <div className="h-2.5 rounded-full overflow-hidden flex mb-4">
                  {(["A", "B", "C"] as const).map((k) => {
                    const total = abcSummary.A.v + abcSummary.B.v + abcSummary.C.v;
                    const pct = total > 0 ? (abcSummary[k].v / total) * 100 : 0;
                    const colors = { A: "#8b5cf6", B: "#3b82f6", C: "#94a3b8" };
                    return <div key={k} style={{ width: `${pct}%`, backgroundColor: colors[k] }} className="h-full transition-all duration-700" />;
                  })}
                </div>
                <div className="space-y-2.5">
                  {(["A", "B", "C"] as const).map((k) => (
                    <div key={k} className="flex items-center gap-2.5">
                      <span className={`text-[10px] w-6 h-6 rounded-lg flex items-center justify-center font-semibold ${ABC_STYLES[k]}`}>{k}</span>
                      <p className="text-[11px] text-muted-foreground flex-1">
                        {abcSummary[k].n} {ar ? "صنف" : `item${abcSummary[k].n === 1 ? "" : "s"}`}
                        <span className="text-muted-foreground/50"> · {k === "A" ? (ar ? "أعلى ٨٠٪ من القيمة" : "top 80% of value") : k === "B" ? (ar ? "١٥٪ التالية" : "next 15%") : (ar ? "آخر ٥٪" : "last 5%")}</span>
                      </p>
                      <p className="text-[11.5px] font-medium tabular-nums">{fmtCompact(abcSummary[k].v)}</p>
                    </div>
                  ))}
                </div>
              </ChartCard>
              <ChartCard title={ar ? "الصيانة والضمانات" : "Maintenance & Warranty"} sub={`${ar ? "إجمالي تكلفة الصيانة" : "Total maintenance spend"} ${fmtVal(maintCostTotal)}`}>
                <div className="space-y-2">
                  {inMaintenance.length === 0 ? (
                    <div className="p-3.5 rounded-xl border border-emerald-200/40 bg-emerald-50/20 text-center">
                      <CheckCircle2 size={16} className="mx-auto text-emerald-500 mb-1.5" />
                      <p className="text-[11px] text-emerald-700">{ar ? "مفيش صيانة جارية" : "No open maintenance"}</p>
                    </div>
                  ) : inMaintenance.slice(0, 4).map((w) => {
                    const mm = getMaintMeta(w);
                    const stx = MAINT_STATUSES.find((s) => s.value === w.status) ?? MAINT_STATUSES[0];
                    return (
                      <div key={w.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border/40">
                        <Wrench size={12} className="text-amber-500 shrink-0" />
                        <p className="flex-1 text-[11px] font-medium truncate">{mm.resource_name || w.title_en}</p>
                        <span className={`text-[9.5px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${stx.pill}`}>{ar ? stx.ar : stx.en}</span>
                      </div>
                    );
                  })}
                </div>
              </ChartCard>
            </div>

            {/* Row 3: insights + reorder planner + top items */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <ChartCard title={ar ? "رؤى ذكية" : "Smart Insights"} sub={ar ? "اقتراحات إعادة طلب وتنبيهات" : "Reorder suggestions, dead stock & warnings"}>
                {insights.length === 0 ? (
                  <div className="flex items-center gap-2.5 p-4 rounded-xl border border-emerald-200/40 bg-emerald-50/20">
                    <Sparkles size={14} className="text-emerald-500" />
                    <p className="text-[12px] text-emerald-700">{ar ? "كل حاجة تمام — مفيش تنبيهات دلوقتي" : "All clear — nothing needs your attention right now"}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {insights.map((ins, i) => {
                      const Icon = ins.icon;
                      return (
                        <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${ins.tone.split(" ").slice(1).join(" ")}`}>
                          <Icon size={14} className={`${ins.tone.split(" ")[0]} mt-0.5 shrink-0`} />
                          <div className="min-w-0">
                            <p className="text-[12px] font-medium truncate">{ins.title}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{ins.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ChartCard>
              <ChartCard title={ar ? "خطة إعادة الطلب" : "Reorder Planner"} sub={reorderPlan.length === 0 ? (ar ? "كل الأصناف فوق حد الطلب" : "All items above reorder level") : `${ar ? "ميزانية الشراء المقترحة" : "Suggested purchase budget"} ${fmtVal(reorderBudget)}`}>
                {reorderPlan.length === 0 ? (
                  <div className="p-3.5 rounded-xl border border-emerald-200/40 bg-emerald-50/20 text-center">
                    <CheckCircle2 size={16} className="mx-auto text-emerald-500 mb-1.5" />
                    <p className="text-[11px] text-emerald-700">{ar ? "مفيش طلبات شراء مطلوبة" : "Nothing to reorder right now"}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {reorderPlan.slice(0, 5).map((rp, i) => (
                      <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border/40">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${rp.qty === 0 ? "bg-rose-400" : "bg-amber-400"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium truncate">{rp.name}</p>
                          <p className="text-[9.5px] text-muted-foreground truncate">
                            {ar ? "متاح" : "On hand"} {rp.qty} · {ar ? "اطلب" : "order"} <span className="font-medium text-foreground">{rp.suggested}</span>{rp.vendor ? ` ${ar ? "من" : "from"} ${rp.vendor}` : ""}
                          </p>
                        </div>
                        <p className="text-[10.5px] font-medium tabular-nums shrink-0">{fmtCompact(rp.cost)}</p>
                      </div>
                    ))}
                    {reorderPlan.length > 5 && <p className="text-[9.5px] text-muted-foreground/60 text-center pt-0.5">+{reorderPlan.length - 5} {ar ? "أصناف كمان" : "more items"}</p>}
                  </div>
                )}
              </ChartCard>
              <ChartCard title={ar ? "أعلى الأصناف قيمة" : "Top Value Items"} sub={ar ? "أكتر ٥ أصناف رابطة قيمة في المخزون" : "Top 5 items by stock value"}>
                {topValueItems.length === 0 ? <p className="text-[11px] text-muted-foreground/50 py-6 text-center">{ar ? "مفيش بيانات" : "No data"}</p> : <HBarList rows={topValueItems} fmt={fmtCompact} />}
              </ChartCard>
            </div>
          </div>
        ) : tab === "materials" ? (
          <MaterialsDashboard products={products} invItems={invItems} ar={ar} fmtVal={fmtVal} fmtCompact={fmtCompact} />
        ) : tab === "inventory" || tab === "assets" ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="relative flex-1 max-w-[280px] min-w-[180px]">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={ar ? "اسم، SKU، باركود، موقع..." : "Name, SKU, barcode, location…"} className="w-full h-9 pl-9 pr-4 rounded-xl border border-border/60 bg-background text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/30" />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 rounded-xl border border-border/60 bg-background px-3 text-[12px] cursor-pointer focus:outline-none">
                <option value="all">{ar ? "كل الحالات" : "All statuses"}</option>
                {(tab === "inventory" ? INV_STATUSES : ASSET_STATUSES).map((s) => <option key={s.value} value={s.value}>{ar ? s.ar : s.en}</option>)}
              </select>
              <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className="h-9 rounded-xl border border-border/60 bg-background px-3 text-[12px] cursor-pointer focus:outline-none">
                <option value="value">{ar ? "ترتيب: القيمة" : "Sort: Value"}</option>
                {tab === "inventory" && <option value="qty">{ar ? "ترتيب: الكمية" : "Sort: Quantity"}</option>}
                <option value="name">{ar ? "ترتيب: الاسم" : "Sort: Name"}</option>
              </select>
              <div className="flex-1" />
              {(tab === "inventory" ? invItems : assets).length > 0 && (
                <button onClick={() => exportCSV(tab === "inventory" ? invItems : assets, `thoth-${tab}-${new Date().toISOString().slice(0, 10)}.csv`)} className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border/60 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"><Download size={13} /> {ar ? "صدّر" : "Export"}</button>
              )}
              <button onClick={() => tab === "inventory" ? setInvModal(true) : setAssetModal(true)} className={btnPrimary + " h-9"}><Plus size={14} /> {ar ? "ضيف" : "Add"}</button>
            </div>

            {/* Category chips */}
            {presentCats.length > 1 && (
              <div className="flex items-center gap-2 mb-5 flex-wrap">
                <button onClick={() => setCatFilter("all")} className={`h-7 px-3 rounded-full text-[11px] font-medium transition-colors ${catFilter === "all" ? "bg-foreground text-background" : "border border-border/60 text-muted-foreground hover:bg-muted/50"}`}>
                  {ar ? "الكل" : "All"}
                </button>
                {presentCats.map((c) => (
                  <button key={c.value} onClick={() => setCatFilter(catFilter === c.value ? "all" : c.value)} className={`h-7 px-3 rounded-full text-[11px] font-medium transition-colors flex items-center gap-1.5 ${catFilter === c.value ? "bg-foreground text-background" : "border border-border/60 text-muted-foreground hover:bg-muted/50"}`}>
                    <c.icon size={11} /> {ar ? c.ar : c.en}
                  </button>
                ))}
              </div>
            )}

            {tab === "inventory" ? (
              filteredInv.length === 0 ? (
                <div className="py-16 text-center text-[13px] text-muted-foreground/50">{search || catFilter !== "all" || statusFilter !== "all" ? (ar ? "مفيش نتائج" : "No results") : (ar ? "مفيش أصناف مخزون" : "No inventory items")}</div>
              ) : (
                <div className="space-y-2">
                  {filteredInv.map((r) => {
                    const m = getMeta(r);
                    const qty = m.quantity ?? 0;
                    const isLow = qty > 0 && qty <= (m.reorder_level || 0);
                    const isOut = qty === 0;
                    const value = qty * (m.unit_cost || 0);
                    const target = Math.max(m.max_level || 0, (m.reorder_level || 0) * 2, qty, 1);
                    const img = (m.images ?? [])[0];
                    const cat = RESOURCE_CATEGORIES.find((c) => c.value === r.type) ?? RESOURCE_CATEGORIES[RESOURCE_CATEGORIES.length - 1];
                    const CatIcon = cat.icon;
                    const abc = abcMap[r.id];
                    return (
                      <div key={r.id} role="button" tabIndex={0} onClick={() => setSelected(r)} onKeyDown={(e) => e.key === "Enter" && setSelected(r)}
                        className="flex items-center gap-4 p-3.5 rounded-xl border border-border/40 bg-background hover:shadow-sm hover:border-border/70 transition-all cursor-pointer">
                        {img ? (
                          <img src={img} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0 border border-border/30" />
                        ) : (
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${cat.color}`}><CatIcon size={16} /></div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            {m.sku && <span className="text-[10.5px] font-mono text-muted-foreground">{m.sku}</span>}
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isOut ? "bg-rose-100 text-rose-600" : isLow ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                              {isOut ? (ar ? "خلص" : "Out of Stock") : isLow ? (ar ? "قليل" : "Low Stock") : (ar ? "متوفر" : "In Stock")}
                            </span>
                            {abc && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${ABC_STYLES[abc]}`}>{abc}</span>}
                          </div>
                          <p className="text-[14px] font-medium truncate" style={{ fontFamily: "var(--app-font-serif)" }}>{r.name_en}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <div className="h-1 rounded-full bg-muted/60 overflow-hidden w-28">
                              <div className={`h-full rounded-full ${isOut ? "bg-rose-400" : isLow ? "bg-amber-400" : "bg-emerald-400"}`} style={{ width: `${Math.min(qty / target, 1) * 100}%` }} />
                            </div>
                            <p className="text-[10.5px] text-muted-foreground truncate">{m.location || ""}{m.vendor_name ? ` · ${m.vendor_name}` : ""}</p>
                          </div>
                        </div>
                        <div className="text-end shrink-0 w-16">
                          <p className="text-[15px] font-semibold tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>{qty}</p>
                          <p className="text-[9.5px] text-muted-foreground">{m.uom || (ar ? "كمية" : "qty")}</p>
                        </div>
                        <div className="text-end shrink-0 w-24 hidden sm:block">
                          <p className="text-[13px] font-medium tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>{fmtVal(value)}</p>
                          {m.unit_cost ? <p className="text-[9.5px] text-muted-foreground tabular-nums">@{fmtVal(m.unit_cost)}</p> : null}
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(r); }} title={ar ? "حذف" : "Delete"} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-400 transition-colors shrink-0">
                          <Trash2 size={12} />
                        </button>
                        <ChevronRight size={13} className="text-muted-foreground/40 shrink-0 rtl:rotate-180" />
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              filteredAssets.length === 0 ? (
                <div className="py-16 text-center text-[13px] text-muted-foreground/50">{search || catFilter !== "all" || statusFilter !== "all" ? (ar ? "مفيش نتائج" : "No results") : (ar ? "مفيش أصول" : "No assets")}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredAssets.map((r) => {
                    const m = getMeta(r);
                    const cat = RESOURCE_CATEGORIES.find((c) => c.value === r.type) ?? RESOURCE_CATEGORIES[RESOURCE_CATEGORIES.length - 1];
                    const st = ASSET_STATUSES.find((s) => s.value === m.asset_status) ?? ASSET_STATUSES[0];
                    const CatIcon = cat.icon;
                    const dep = depreciation(m);
                    const img = (m.images ?? [])[0];
                    const warrantyDays = m.warranty_expiry ? Math.ceil((new Date(m.warranty_expiry).getTime() - Date.now()) / 86400000) : null;
                    return (
                      <div key={r.id} role="button" tabIndex={0} onClick={() => setSelected(r)} onKeyDown={(e) => e.key === "Enter" && setSelected(r)}
                        className="bg-background border border-border/40 rounded-xl overflow-hidden hover:shadow-sm hover:border-border/70 transition-all cursor-pointer">
                        {img && <div className="h-28 bg-muted/30 border-b border-border/30"><img src={img} alt="" className="w-full h-full object-cover" /></div>}
                        <div className="p-5">
                          <div className="flex items-start gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cat.color}`}>
                              <CatIcon size={17} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[14px] font-medium truncate" style={{ fontFamily: "var(--app-font-serif)" }}>{r.name_en}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {m.asset_tag && <span className="text-[10px] font-mono text-muted-foreground">{m.asset_tag}</span>}
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.pill}`}>{ar ? st.ar : st.en}</span>
                                {warrantyDays !== null && warrantyDays > 0 && warrantyDays <= 60 && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-600 flex items-center gap-1"><ShieldAlert size={9} />{ar ? `ضمان ${warrantyDays}ي` : `${warrantyDays}d warranty`}</span>
                                )}
                              </div>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(r); }} title={ar ? "حذف" : "Delete"} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-400 transition-colors shrink-0">
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <div className="flex flex-col gap-1 text-[11px] text-muted-foreground mb-3">
                            {m.assigned_to && <span>{ar ? "متسلمها" : "Assigned to"}: {m.assigned_to}</span>}
                            {m.location && <span><MapPin size={10} className="inline mr-1" />{m.location}</span>}
                          </div>
                          {(m.purchase_cost || 0) > 0 && (
                            <div className="pt-3 border-t border-border/30">
                              <div className="flex items-center justify-between mb-1.5">
                                <p className="text-[10px] text-muted-foreground">{ar ? "القيمة الدفترية" : "Book value"}</p>
                                <p className="text-[12px] font-medium tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>{fmtVal(dep.book)} <span className="text-[9.5px] text-muted-foreground font-normal">/ {fmtVal(m.purchase_cost || 0)}</span></p>
                              </div>
                              <div className="h-1 rounded-full bg-muted/60 overflow-hidden">
                                <div className="h-full rounded-full bg-violet-400" style={{ width: `${(1 - dep.agePct) * 100}%` }} />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </>
        ) : tab === "movements" ? (
          <>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1" />
              <button onClick={() => setMoveModal(true)} className={btnPrimary + " h-9"}><Plus size={14} /> {ar ? "حركة جديدة" : "New Movement"}</button>
            </div>
            {movements.length === 0 ? (
              <div className="py-16 text-center text-[13px] text-muted-foreground/50">{ar ? "مفيش حركات مخزون" : "No stock movements"}</div>
            ) : (
              <div className="space-y-2">
                {movements.map((w) => {
                  const m = getMoveMeta(w);
                  const mt = MOVE_TYPES.find((t) => t.value === m.move_type);
                  return (
                    <div key={w.id} className="flex items-center gap-4 p-4 rounded-xl border border-border/40 bg-background">
                      <ArrowDownUp size={14} className="text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/8 text-primary font-medium">{mt ? (ar ? mt.ar : mt.en) : m.move_type}</span>
                        </div>
                        <p className="text-[13px] font-medium truncate">{m.resource_name || w.title_en}</p>
                        <p className="text-[11px] text-muted-foreground">{m.reason || ""} · {w.created_at.slice(0, 10)}</p>
                      </div>
                      <p className="text-[16px] font-semibold tabular-nums shrink-0" style={{ fontFamily: "var(--app-font-serif)" }}>
                        {m.move_type === "stock_out" ? "-" : "+"}{m.move_qty}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          /* Maintenance tab */
          <>
            <div className="flex items-center gap-3 mb-5">
              {maintCostTotal > 0 && <p className="text-[12px] text-muted-foreground">{ar ? "إجمالي تكلفة الصيانة:" : "Total maintenance spend:"} <span className="font-medium text-foreground tabular-nums">{fmtVal(maintCostTotal)}</span></p>}
              <div className="flex-1" />
              <button onClick={() => setMaintModal(true)} className={btnPrimary + " h-9"}><Plus size={14} /> {ar ? "سجّل صيانة" : "Schedule"}</button>
            </div>
            {maintenance.length === 0 ? (
              <div className="py-16 text-center text-[13px] text-muted-foreground/50">{ar ? "مفيش سجلات صيانة" : "No maintenance records"}</div>
            ) : (
              <div className="space-y-2">
                {maintenance.map((w) => {
                  const m = getMaintMeta(w);
                  const st = MAINT_STATUSES.find((s) => s.value === w.status) ?? MAINT_STATUSES[0];
                  return (
                    <div key={w.id} className="flex items-center gap-4 p-4 rounded-xl border border-border/40 bg-background hover:shadow-sm transition-all">
                      <Wrench size={14} className="text-amber-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.pill}`}>{ar ? st.ar : st.en}</span>
                          <span className="text-[10px] text-muted-foreground">{m.maint_type}</span>
                        </div>
                        <p className="text-[13px] font-medium truncate">{m.resource_name || w.title_en}</p>
                        <p className="text-[11px] text-muted-foreground">{m.vendor_name || ""}{w.due_date ? ` · ${w.due_date.slice(0, 10)}` : ""}</p>
                      </div>
                      {m.cost ? <p className="text-[13px] font-medium tabular-nums shrink-0">{fmtVal(m.cost)}</p> : null}
                      {w.status === "planned" && (
                        <button onClick={async () => { await getDataSource().work_items.update(workspace?.id ?? "", w.id, { status: "done", progress: 100 }); setWorkItems((prev) => prev.map((i) => i.id === w.id ? { ...i, status: "done" as WorkItem["status"], progress: 100 } : i)); }}
                          className="text-[11px] text-emerald-600 font-medium hover:opacity-70 shrink-0">{ar ? "اكتمل" : "Complete"}</button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals & drawer */}
      {invModal && <ItemModal mode="inventory" ar={ar} currency={currency} onClose={() => setInvModal(false)} onSaved={(r) => setResources((prev) => [r, ...prev])} />}
      {assetModal && <ItemModal mode="asset" ar={ar} currency={currency} onClose={() => setAssetModal(false)} onSaved={(r) => setResources((prev) => [r, ...prev])} />}
      {editTarget && (
        <ItemModal mode={isInventoryItem(editTarget) ? "inventory" : "asset"} initial={editTarget} ar={ar} currency={currency}
          onClose={() => setEditTarget(null)} onSaved={patchResource} />
      )}
      {moveModal && <AddMovementModal ar={ar} resources={invItems} onClose={() => setMoveModal(false)} onAdd={(w) => setWorkItems((prev) => [w, ...prev])} onResourceUpdate={patchResource} />}
      {maintModal && <AddMaintenanceModal ar={ar} resources={resources} currency={currency} onClose={() => setMaintModal(false)} onAdd={(w) => setWorkItems((prev) => [w, ...prev])} />}

      {selected && !editTarget && (
        <DetailDrawer
          resource={selected} ar={ar} currency={currency}
          movements={movements} maintenance={maintenance} abc={abcMap[selected.id]}
          onClose={() => setSelected(null)}
          onEdit={() => setEditTarget(selected)}
          onUpdated={patchResource}
          onQuickMove={quickMove}
        />
      )}

      <ConfirmDeleteModal
        open={!!deleteTarget}
        ar={ar}
        title={deleteTarget && isInventoryItem(deleteTarget) ? (ar ? "حذف صنف المخزون" : "Delete Inventory Item") : (ar ? "حذف الأصل" : "Delete Asset")}
        itemName={deleteTarget?.name_en || ""}
        loading={deleteLoading}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
