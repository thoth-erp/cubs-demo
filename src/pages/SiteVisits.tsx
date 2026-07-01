/**
 * Site Visits & Measurements Foundation — المعاينات والمقاسات
 *
 * Sales Order → Site Visit → Measurements → Design → Production
 *
 * Uses dedicated site_visits + measurements tables.
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { getDataSource } from "../lib/data-source";
import { exportCSV, downloadTemplate } from "../lib/csv-export";
import type { Database } from "../lib/database.types";
import {
  Plus, Search, X, Loader2, AlertCircle, Download, Upload,
  CheckCircle2, Clock, MapPin, User, ChevronRight, ChevronDown,
  Calendar, Camera, Ruler, ClipboardCheck, Eye, Edit3,
  Trash2, Home, Building2, FileText, ArrowRight,
  Check, XCircle, RotateCcw, Send,
} from "lucide-react";

type SiteVisit = Database["public"]["Tables"]["site_visits"]["Row"];
type Measurement = Database["public"]["Tables"]["measurements"]["Row"];
type Attachment = Database["public"]["Tables"]["measurement_attachments"]["Row"];
type WorkItem = Database["public"]["Tables"]["work_items"]["Row"];
type Org = Database["public"]["Tables"]["organizations"]["Row"];

// ─── Constants ────────────────────────────────────────────

const VISIT_STATUSES = [
  { value: "scheduled",   en: "Scheduled",   ar: "مجدولة",    pill: "bg-blue-50 text-blue-600",    icon: Clock },
  { value: "in_progress", en: "In Progress", ar: "جارية",     pill: "bg-amber-50 text-amber-600",  icon: Ruler },
  { value: "completed",   en: "Completed",   ar: "مكتملة",    pill: "bg-emerald-50 text-emerald-600", icon: CheckCircle2 },
  { value: "cancelled",   en: "Cancelled",   ar: "ملغية",     pill: "bg-rose-50 text-rose-600",    icon: XCircle },
] as const;

const APPROVAL_STATUSES = [
  { value: "draft",          en: "Draft",          ar: "مسودة",            pill: "bg-zinc-100 text-zinc-600" },
  { value: "submitted",      en: "Submitted",      ar: "تم الإرسال",       pill: "bg-blue-50 text-blue-600" },
  { value: "approved",       en: "Approved",       ar: "تم اعتماد المقاسات", pill: "bg-emerald-50 text-emerald-600" },
  { value: "needs_revision", en: "Needs Revision", ar: "محتاجة تعديل",     pill: "bg-amber-50 text-amber-600" },
] as const;

const ROOM_TYPES = [
  { value: "kitchen",     en: "Kitchen",     ar: "مطبخ" },
  { value: "bedroom",     en: "Bedroom",     ar: "غرفة نوم" },
  { value: "living_room", en: "Living Room", ar: "غرفة معيشة" },
  { value: "office",      en: "Office",      ar: "مكتب" },
  { value: "reception",   en: "Reception",   ar: "ريسبشن" },
  { value: "bathroom",    en: "Bathroom",    ar: "حمام" },
  { value: "custom",      en: "Custom Area", ar: "منطقة مخصصة" },
] as const;

const STYLES = [
  { value: "modern",  en: "Modern",  ar: "مودرن" },
  { value: "classic", en: "Classic", ar: "كلاسيك" },
  { value: "minimal", en: "Minimal", ar: "مينمال" },
  { value: "luxury",  en: "Luxury",  ar: "لاكجري" },
  { value: "custom",  en: "Custom",  ar: "مخصص" },
] as const;

const DEFAULT_CHECKLIST = [
  { id: "measurements",  label_en: "Measurements captured",        label_ar: "المقاسات اتاخدت",         checked: false },
  { id: "photos",        label_en: "Photos captured",              label_ar: "الصور اتصورت",            checked: false },
  { id: "electrical",    label_en: "Electrical points checked",    label_ar: "النقط الكهربائية اتراجعت", checked: false },
  { id: "plumbing",      label_en: "Plumbing checked",             label_ar: "السباكة اتراجعت",          checked: false },
  { id: "access",        label_en: "Access route checked",         label_ar: "مدخل التركيب اتراجع",     checked: false },
  { id: "installation",  label_en: "Installation conditions reviewed", label_ar: "ظروف التركيب اتراجعت", checked: false },
];

const FILE_TYPES = [
  { value: "site_photo",        en: "Site Photo",        ar: "صورة الموقع" },
  { value: "measurement_photo", en: "Measurement Photo", ar: "صورة المقاسات" },
  { value: "reference_image",   en: "Reference Image",   ar: "صورة مرجعية" },
  { value: "notes_image",       en: "Notes Image",       ar: "صورة ملاحظات" },
] as const;

// ─── Helpers ──────────────────────────────────────────────

const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium px-5 hover:opacity-90 transition-opacity disabled:opacity-40";
const inputCls = "w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20";
const labelCls = "text-[11.5px] text-muted-foreground font-medium mb-1 block";

function genVisitNumber(): string {
  const d = new Date();
  const seq = Math.floor(Math.random() * 9000) + 1000;
  return `SV-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}-${seq}`;
}

async function logActivity(workspaceId: string, type: string, entityType: string, entityId: string, descEn: string, descAr: string) {
  const ds = getDataSource();
  try {
    await ds.activity_events.create(workspaceId, {
      workspace_id: workspaceId,
      event_type: type,
      entity_type: entityType,
      entity_id: entityId,
      description_en: descEn,
      description_ar: descAr,
      metadata: {},
    } as any);
  } catch { /* non-critical */ }
}

// ─── Create / Edit Visit Modal ────────────────────────────

interface VisitForm {
  visitNumber: string;
  customerId: string;
  customerName: string;
  salesOrderId: string;
  siteAddress: string;
  assignedTechnician: string;
  visitDate: string;
  notes: string;
  preferredColors: string;
  preferredMaterials: string;
  preferredStyle: string;
  specialNotes: string;
  installationNotes: string;
}

function emptyForm(): VisitForm {
  return {
    visitNumber: genVisitNumber(),
    customerId: "", customerName: "", salesOrderId: "",
    siteAddress: "", assignedTechnician: "",
    visitDate: new Date().toISOString().slice(0, 10),
    notes: "", preferredColors: "", preferredMaterials: "",
    preferredStyle: "", specialNotes: "", installationNotes: "",
  };
}

function VisitModal({ onClose, onSaved, orgs, orders, editVisit, ar, workspaceId }: {
  onClose: () => void;
  onSaved: () => void;
  orgs: Org[];
  orders: WorkItem[];
  editVisit: SiteVisit | null;
  ar: boolean;
  workspaceId: string;
}) {
  const [form, setForm] = useState<VisitForm>(() => {
    if (editVisit) return {
      visitNumber: editVisit.visit_number,
      customerId: editVisit.customer_id || "",
      customerName: editVisit.customer_name || "",
      salesOrderId: editVisit.sales_order_id || "",
      siteAddress: editVisit.site_address || "",
      assignedTechnician: editVisit.assigned_technician || "",
      visitDate: editVisit.visit_date || "",
      notes: editVisit.notes || "",
      preferredColors: editVisit.preferred_colors || "",
      preferredMaterials: editVisit.preferred_materials || "",
      preferredStyle: editVisit.preferred_style || "",
      specialNotes: editVisit.special_notes || "",
      installationNotes: editVisit.installation_notes || "",
    };
    return emptyForm();
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"info" | "requirements">("info");
  const set = (k: keyof VisitForm, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const tabs = [
    { id: "info" as const, en: "Visit Info", ar: "بيانات المعاينة" },
    { id: "requirements" as const, en: "Requirements", ar: "متطلبات العميل" },
  ];

  async function handleSubmit() {
    if (!form.visitNumber.trim()) { setError(ar ? "رقم المعاينة مطلوب" : "Visit number required"); return; }
    setLoading(true);
    setError("");
    const ds = getDataSource();
    const payload: any = {
      workspace_id: workspaceId,
      visit_number: form.visitNumber.trim(),
      customer_id: form.customerId || null,
      customer_name: form.customerName || (orgs.find((o) => o.id === form.customerId)?.name_en) || null,
      sales_order_id: form.salesOrderId || null,
      site_address: form.siteAddress || null,
      assigned_technician: form.assignedTechnician || null,
      visit_date: form.visitDate || null,
      notes: form.notes || null,
      preferred_colors: form.preferredColors || null,
      preferred_materials: form.preferredMaterials || null,
      preferred_style: form.preferredStyle || null,
      special_notes: form.specialNotes || null,
      installation_notes: form.installationNotes || null,
      checklist: editVisit ? undefined : DEFAULT_CHECKLIST,
      status: editVisit ? undefined : "scheduled",
    };
    try {
      if (editVisit) {
        await ds.site_visits.update(workspaceId, editVisit.id, payload);
      } else {
        await ds.site_visits.create(workspaceId, payload);
        await logActivity(workspaceId, "site_visit_scheduled", "site_visit", payload.visit_number,
          `Site visit ${payload.visit_number} scheduled`, `تم جدولة المعاينة ${payload.visit_number}`);
      }
      onSaved();
    } catch (e: any) {
      setError(e.message || "Error");
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background rounded-2xl border border-border/60 shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-border/40 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-[17px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>
              {editVisit ? (ar ? "تعديل المعاينة" : "Edit Visit") : (ar ? "معاينة جديدة" : "New Site Visit")}
            </h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50"><X size={16} /></button>
          </div>
          <div className="flex gap-1 mt-3">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${tab === t.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"}`}>
                {ar ? t.ar : t.en}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {tab === "info" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>{ar ? "رقم المعاينة" : "Visit Number"}</label>
                  <input className={inputCls} value={form.visitNumber} onChange={(e) => set("visitNumber", e.target.value)} /></div>
                <div><label className={labelCls}>{ar ? "تاريخ المعاينة" : "Visit Date"}</label>
                  <input type="date" className={inputCls} value={form.visitDate} onChange={(e) => set("visitDate", e.target.value)} /></div>
              </div>
              <div><label className={labelCls}>{ar ? "العميل" : "Customer"}</label>
                <select className={inputCls} value={form.customerId} onChange={(e) => { set("customerId", e.target.value); set("customerName", orgs.find((o) => o.id === e.target.value)?.name_en || ""); }}>
                  <option value="">{ar ? "— اختر العميل —" : "— Select Customer —"}</option>
                  {orgs.map((o) => <option key={o.id} value={o.id}>{ar ? (o.name_ar || o.name_en) : o.name_en}</option>)}
                </select>
              </div>
              <div><label className={labelCls}>{ar ? "طلب العميل" : "Sales Order"}</label>
                <select className={inputCls} value={form.salesOrderId} onChange={(e) => set("salesOrderId", e.target.value)}>
                  <option value="">{ar ? "— اختر الطلب —" : "— Select Order —"}</option>
                  {orders.map((o) => {
                    const m = (o.metadata as any) || {};
                    return <option key={o.id} value={o.id}>{m.so_number || o.title_en}</option>;
                  })}
                </select>
              </div>
              <div><label className={labelCls}>{ar ? "عنوان الموقع" : "Site Address"}</label>
                <input className={inputCls} value={form.siteAddress} onChange={(e) => set("siteAddress", e.target.value)} placeholder={ar ? "العنوان بالتفصيل" : "Full address"} /></div>
              <div><label className={labelCls}>{ar ? "الفني المسؤول" : "Assigned Technician"}</label>
                <input className={inputCls} value={form.assignedTechnician} onChange={(e) => set("assignedTechnician", e.target.value)} /></div>
              <div><label className={labelCls}>{ar ? "ملاحظات" : "Notes"}</label>
                <textarea className={inputCls + " h-20 py-2 resize-none"} value={form.notes} onChange={(e) => set("notes", e.target.value)} /></div>
            </>
          )}

          {tab === "requirements" && (
            <>
              <div><label className={labelCls}>{ar ? "الألوان المفضلة" : "Preferred Colors"}</label>
                <input className={inputCls} value={form.preferredColors} onChange={(e) => set("preferredColors", e.target.value)} placeholder={ar ? "أبيض, بيج, رمادي..." : "White, Beige, Gray..."} /></div>
              <div><label className={labelCls}>{ar ? "الخامات المفضلة" : "Preferred Materials"}</label>
                <input className={inputCls} value={form.preferredMaterials} onChange={(e) => set("preferredMaterials", e.target.value)} placeholder={ar ? "MDF, خشب طبيعي..." : "MDF, Solid Wood..."} /></div>
              <div><label className={labelCls}>{ar ? "الستايل" : "Preferred Style"}</label>
                <select className={inputCls} value={form.preferredStyle} onChange={(e) => set("preferredStyle", e.target.value)}>
                  <option value="">{ar ? "— اختر —" : "— Select —"}</option>
                  {STYLES.map((s) => <option key={s.value} value={s.value}>{ar ? s.ar : s.en}</option>)}
                </select>
              </div>
              <div><label className={labelCls}>{ar ? "ملاحظات خاصة" : "Special Notes"}</label>
                <textarea className={inputCls + " h-20 py-2 resize-none"} value={form.specialNotes} onChange={(e) => set("specialNotes", e.target.value)} /></div>
              <div><label className={labelCls}>{ar ? "ملاحظات التركيب" : "Installation Notes"}</label>
                <textarea className={inputCls + " h-20 py-2 resize-none"} value={form.installationNotes} onChange={(e) => set("installationNotes", e.target.value)} /></div>
            </>
          )}

          {error && <p className="text-[12px] text-rose-500 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
        </div>
        <div className="px-6 py-4 border-t border-border/40 shrink-0 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 h-10 rounded-xl border border-border/60 text-[13px] font-medium hover:bg-muted/50 transition-colors">{ar ? "إلغاء" : "Cancel"}</button>
          <button onClick={handleSubmit} disabled={loading || !form.visitNumber.trim()} className={btnPrimary + " flex-1 h-10"}>
            {loading && <Loader2 size={12} className="animate-spin" />} {editVisit ? (ar ? "حفظ" : "Save") : (ar ? "أنشئ المعاينة" : "Create Visit")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Measurement Entry Modal ──────────────────────────────

function MeasurementModal({ onClose, onSaved, visitId, editMeasurement, ar, workspaceId }: {
  onClose: () => void;
  onSaved: () => void;
  visitId: string;
  editMeasurement: Measurement | null;
  ar: boolean;
  workspaceId: string;
}) {
  const [roomName, setRoomName] = useState(editMeasurement?.room_name || "");
  const [roomType, setRoomType] = useState(editMeasurement?.room_type || "custom");
  const [label, setLabel] = useState(editMeasurement?.label || "");
  const [width, setWidth] = useState(editMeasurement?.width?.toString() || "");
  const [height, setHeight] = useState(editMeasurement?.height?.toString() || "");
  const [depth, setDepth] = useState(editMeasurement?.depth?.toString() || "");
  const [length, setLength] = useState(editMeasurement?.length?.toString() || "");
  const [ceilingHeight, setCeilingHeight] = useState(editMeasurement?.ceiling_height?.toString() || "");
  const [notes, setNotes] = useState(editMeasurement?.notes || "");
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!roomName.trim()) return;
    setLoading(true);
    const ds = getDataSource();
    const payload: any = {
      workspace_id: workspaceId,
      site_visit_id: visitId,
      room_name: roomName.trim(),
      room_type: roomType,
      label: label || null,
      width: width ? parseFloat(width) : null,
      height: height ? parseFloat(height) : null,
      depth: depth ? parseFloat(depth) : null,
      length: length ? parseFloat(length) : null,
      ceiling_height: ceilingHeight ? parseFloat(ceilingHeight) : null,
      notes: notes || null,
      approval_status: editMeasurement ? undefined : "draft",
    };
    try {
      if (editMeasurement) {
        await ds.measurements.update(workspaceId, editMeasurement.id, payload);
      } else {
        await ds.measurements.create(workspaceId, payload);
      }
      onSaved();
    } catch { /* ignore */ }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background rounded-2xl border border-border/60 shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-border/40 shrink-0 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>
            {editMeasurement ? (ar ? "تعديل المقاس" : "Edit Measurement") : (ar ? "مقاس جديد" : "New Measurement")}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>{ar ? "الغرفة / المنطقة" : "Room / Area"}</label>
              <input className={inputCls} value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder={ar ? "مثال: المطبخ" : "e.g. Kitchen"} /></div>
            <div><label className={labelCls}>{ar ? "النوع" : "Room Type"}</label>
              <select className={inputCls} value={roomType} onChange={(e) => setRoomType(e.target.value as never)}>
                {ROOM_TYPES.map((r) => <option key={r.value} value={r.value}>{ar ? r.ar : r.en}</option>)}
              </select></div>
          </div>
          <div><label className={labelCls}>{ar ? "الوصف" : "Label"}</label>
            <input className={inputCls} value={label} onChange={(e) => setLabel(e.target.value)} placeholder={ar ? "مثال: حائط A" : "e.g. Wall A"} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>{ar ? "العرض (سم)" : "Width (cm)"}</label>
              <input type="number" className={inputCls} value={width} onChange={(e) => setWidth(e.target.value)} /></div>
            <div><label className={labelCls}>{ar ? "الارتفاع (سم)" : "Height (cm)"}</label>
              <input type="number" className={inputCls} value={height} onChange={(e) => setHeight(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>{ar ? "العمق (سم)" : "Depth (cm)"}</label>
              <input type="number" className={inputCls} value={depth} onChange={(e) => setDepth(e.target.value)} /></div>
            <div><label className={labelCls}>{ar ? "الطول (سم)" : "Length (cm)"}</label>
              <input type="number" className={inputCls} value={length} onChange={(e) => setLength(e.target.value)} /></div>
          </div>
          <div><label className={labelCls}>{ar ? "ارتفاع السقف (سم)" : "Ceiling Height (cm)"}</label>
            <input type="number" className={inputCls} value={ceilingHeight} onChange={(e) => setCeilingHeight(e.target.value)} /></div>
          <div><label className={labelCls}>{ar ? "ملاحظات" : "Notes"}</label>
            <textarea className={inputCls + " h-16 py-2 resize-none"} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </div>
        <div className="px-6 py-4 border-t border-border/40 shrink-0 flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border/60 text-[13px] font-medium hover:bg-muted/50">{ar ? "إلغاء" : "Cancel"}</button>
          <button onClick={handleSave} disabled={loading || !roomName.trim()} className={btnPrimary + " flex-1 h-10"}>
            {loading && <Loader2 size={12} className="animate-spin" />} {ar ? "حفظ" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Visit Detail Panel ───────────────────────────────────

function VisitDetail({ visit, onBack, ar, workspaceId, orders, onRefresh }: {
  visit: SiteVisit;
  onBack: () => void;
  ar: boolean;
  workspaceId: string;
  orders: WorkItem[];
  onRefresh: () => void;
}) {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [measModal, setMeasModal] = useState(false);
  const [editMeas, setEditMeas] = useState<Measurement | null>(null);
  const [editVisit, setEditVisit] = useState(false);
  const [tab, setTab] = useState<"measurements" | "checklist" | "photos" | "requirements">("measurements");
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadData() {
    const ds = getDataSource();
    const [m, a] = await Promise.all([
      ds.measurements.list(workspaceId, { site_visit_id: visit.id }),
      ds.measurement_attachments.list(workspaceId, { site_visit_id: visit.id }),
    ]);
    setMeasurements(m as Measurement[]);
    setAttachments(a as Attachment[]);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [visit.id]);

  const checklist: any[] = Array.isArray(visit.checklist) ? visit.checklist as any[] : [];

  async function toggleChecklist(itemId: string) {
    const updated = checklist.map((c: any) => c.id === itemId ? { ...c, checked: !c.checked } : c);
    const ds = getDataSource();
    await ds.site_visits.update(workspaceId, visit.id, { checklist: updated } as any);
    onRefresh();
  }

  async function updateVisitStatus(status: string) {
    const ds = getDataSource();
    await ds.site_visits.update(workspaceId, visit.id, { status } as any);
    if (status === "completed") {
      await logActivity(workspaceId, "site_visit_completed", "site_visit", visit.id,
        `Site visit ${visit.visit_number} completed`, `المعاينة ${visit.visit_number} اكتملت`);
      // Update sales order measurements_done
      if (visit.sales_order_id) {
        const so = orders.find((o) => o.id === visit.sales_order_id);
        if (so) {
          const meta = { ...(so.metadata as any || {}), measurements_done: true, measurements_status: "completed" };
          await ds.work_items.update(workspaceId, so.id, { metadata: meta } as any);
        }
      }
    }
    onRefresh();
  }

  async function updateMeasurementApproval(measId: string, status: string) {
    const ds = getDataSource();
    const payload: any = { approval_status: status };
    if (status === "approved") {
      payload.approved_at = new Date().toISOString();
    }
    await ds.measurements.update(workspaceId, measId, payload);
    if (status === "approved") {
      await logActivity(workspaceId, "measurements_approved", "measurement", measId,
        `Measurements approved for ${visit.visit_number}`, `تم اعتماد المقاسات للمعاينة ${visit.visit_number}`);
      if (visit.sales_order_id) {
        const so = orders.find((o) => o.id === visit.sales_order_id);
        if (so) {
          const meta = { ...(so.metadata as any || {}), measurements_status: "approved" };
          await ds.work_items.update(workspaceId, so.id, { metadata: meta } as any);
        }
      }
    }
    if (status === "needs_revision") {
      await logActivity(workspaceId, "measurements_revised", "measurement", measId,
        `Measurements need revision for ${visit.visit_number}`, `المقاسات محتاجة تعديل للمعاينة ${visit.visit_number}`);
    }
    loadData();
  }

  async function deleteMeasurement(measId: string) {
    const ds = getDataSource();
    await ds.measurements.remove(workspaceId, measId);
    loadData();
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || !supabase) return;
    const ds = getDataSource();
    for (const file of Array.from(files)) {
      const path = `${workspaceId}/${visit.id}/${Date.now()}-${file.name}`;
      const { data } = await supabase.storage.from("site-visit-photos").upload(path, file);
      if (data) {
        const { data: urlData } = supabase.storage.from("site-visit-photos").getPublicUrl(data.path);
        await ds.measurement_attachments.create(workspaceId, {
          workspace_id: workspaceId,
          site_visit_id: visit.id,
          file_url: urlData.publicUrl,
          file_name: file.name,
          file_type: "site_photo",
          file_size: file.size,
          metadata: {},
        } as any);
      }
    }
    loadData();
    if (fileRef.current) fileRef.current.value = "";
  }

  const roomGroups = useMemo(() => {
    const groups: Record<string, Measurement[]> = {};
    measurements.forEach((m) => {
      const key = m.room_name || "Other";
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });
    return groups;
  }, [measurements]);

  const allApproved = measurements.length > 0 && measurements.every((m) => m.approval_status === "approved");
  const st = VISIT_STATUSES.find((s) => s.value === visit.status)!;
  const linkedOrder = orders.find((o) => o.id === visit.sales_order_id);
  const linkedOrderMeta = linkedOrder ? (linkedOrder.metadata as any || {}) : null;

  const detailTabs = [
    { id: "measurements" as const, en: "Measurements", ar: "المقاسات", icon: Ruler },
    { id: "checklist" as const, en: "Checklist", ar: "قائمة الفحص", icon: ClipboardCheck },
    { id: "photos" as const, en: "Photos", ar: "الصور", icon: Camera },
    { id: "requirements" as const, en: "Requirements", ar: "المتطلبات", icon: FileText },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-muted/50 transition-colors"><ChevronRight size={16} className="rotate-180" /></button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[11px] font-mono text-muted-foreground">{visit.visit_number}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.pill}`}>{ar ? st.ar : st.en}</span>
            {allApproved && <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-600">{ar ? "المقاسات معتمدة" : "All Approved"}</span>}
          </div>
          <h2 className="text-[18px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>
            {visit.customer_name || visit.visit_number}
          </h2>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
            {visit.site_address && <span className="flex items-center gap-1"><MapPin size={10} />{visit.site_address}</span>}
            {visit.visit_date && <span className="flex items-center gap-1"><Calendar size={10} />{visit.visit_date}</span>}
            {visit.assigned_technician && <span className="flex items-center gap-1"><User size={10} />{visit.assigned_technician}</span>}
            {linkedOrderMeta?.so_number && <span className="flex items-center gap-1"><FileText size={10} />{linkedOrderMeta.so_number}</span>}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {visit.status === "scheduled" && <button onClick={() => updateVisitStatus("in_progress")} className="text-[11px] text-amber-600 font-medium hover:opacity-70 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-200"><Ruler size={11} /> {ar ? "ابدأ" : "Start"}</button>}
          {visit.status === "in_progress" && <button onClick={() => updateVisitStatus("completed")} className="text-[11px] text-emerald-600 font-medium hover:opacity-70 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-200"><CheckCircle2 size={11} /> {ar ? "اكتملت" : "Complete"}</button>}
          <button onClick={() => setEditVisit(true)} className="text-[11px] text-muted-foreground font-medium hover:opacity-70 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border/60"><Edit3 size={11} /> {ar ? "تعديل" : "Edit"}</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-border/30 pb-3">
        {detailTabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-2 rounded-lg text-[12px] font-medium transition-colors flex items-center gap-1.5
              ${tab === t.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"}`}>
            <t.icon size={13} />{ar ? t.ar : t.en}
            {t.id === "measurements" && measurements.length > 0 && <span className="text-[10px] bg-muted px-1.5 rounded-full">{measurements.length}</span>}
            {t.id === "photos" && attachments.length > 0 && <span className="text-[10px] bg-muted px-1.5 rounded-full">{attachments.length}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {/* ── Measurements Tab ── */}
          {tab === "measurements" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[14px] font-semibold">{ar ? "المقاسات حسب الغرفة" : "Measurements by Room"}</h3>
                <button onClick={() => { setEditMeas(null); setMeasModal(true); }} className={btnPrimary + " h-9 text-[12px]"}><Plus size={13} /> {ar ? "مقاس جديد" : "Add Measurement"}</button>
              </div>
              {Object.keys(roomGroups).length === 0 ? (
                <div className="py-12 text-center text-[13px] text-muted-foreground/50">{ar ? "مفيش مقاسات لسه" : "No measurements yet"}</div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(roomGroups).map(([room, items]) => {
                    const roomTypeDef = ROOM_TYPES.find((r) => r.value === items[0]?.room_type);
                    return (
                      <div key={room} className="border border-border/40 rounded-xl overflow-hidden">
                        <div className="px-4 py-3 bg-muted/20 flex items-center gap-2 border-b border-border/30">
                          <Home size={13} className="text-muted-foreground" />
                          <span className="text-[13px] font-medium">{room}</span>
                          {roomTypeDef && <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{ar ? roomTypeDef.ar : roomTypeDef.en}</span>}
                          <span className="text-[10px] text-muted-foreground ml-auto">{items.length} {ar ? "مقاس" : "entries"}</span>
                        </div>
                        <div className="divide-y divide-border/20">
                          {items.map((m) => {
                            const appr = APPROVAL_STATUSES.find((a) => a.value === m.approval_status)!;
                            return (
                              <div key={m.id} className="px-4 py-3 flex items-center gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    {m.label && <span className="text-[12px] font-medium">{m.label}</span>}
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${appr.pill}`}>{ar ? appr.ar : appr.en}</span>
                                  </div>
                                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                    {m.width != null && <span>{ar ? "عرض" : "W"}: {m.width}</span>}
                                    {m.height != null && <span>{ar ? "ارتفاع" : "H"}: {m.height}</span>}
                                    {m.depth != null && <span>{ar ? "عمق" : "D"}: {m.depth}</span>}
                                    {m.length != null && <span>{ar ? "طول" : "L"}: {m.length}</span>}
                                    {m.ceiling_height != null && <span>{ar ? "سقف" : "CH"}: {m.ceiling_height}</span>}
                                  </div>
                                  {m.notes && <p className="text-[10.5px] text-muted-foreground mt-1">{m.notes}</p>}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {m.approval_status === "draft" && (
                                    <button onClick={() => updateMeasurementApproval(m.id, "submitted")} title={ar ? "إرسال" : "Submit"} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500"><Send size={12} /></button>
                                  )}
                                  {m.approval_status === "submitted" && (
                                    <>
                                      <button onClick={() => updateMeasurementApproval(m.id, "approved")} title={ar ? "اعتماد" : "Approve"} className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-500"><Check size={12} /></button>
                                      <button onClick={() => updateMeasurementApproval(m.id, "needs_revision")} title={ar ? "تعديل" : "Revision"} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500"><RotateCcw size={12} /></button>
                                    </>
                                  )}
                                  {m.approval_status === "needs_revision" && (
                                    <button onClick={() => updateMeasurementApproval(m.id, "submitted")} title={ar ? "إعادة إرسال" : "Resubmit"} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500"><Send size={12} /></button>
                                  )}
                                  <button onClick={() => { setEditMeas(m); setMeasModal(true); }} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground"><Edit3 size={12} /></button>
                                  <button onClick={() => deleteMeasurement(m.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-400"><Trash2 size={12} /></button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Checklist Tab ── */}
          {tab === "checklist" && (
            <div className="space-y-2">
              <h3 className="text-[14px] font-semibold mb-3">{ar ? "قائمة فحص الموقع" : "Site Visit Checklist"}</h3>
              {checklist.length === 0 ? (
                <p className="text-[12px] text-muted-foreground/50 py-8 text-center">{ar ? "مفيش قائمة فحص" : "No checklist items"}</p>
              ) : checklist.map((item: any) => (
                <button key={item.id} onClick={() => toggleChecklist(item.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-muted/10 border border-border/30 rounded-xl hover:bg-muted/20 transition-colors text-left">
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${item.checked ? "bg-emerald-100 border-emerald-300 text-emerald-600" : "border-border/60 bg-background text-muted-foreground/20"}`}>
                    <CheckCircle2 size={12} />
                  </div>
                  <span className={`text-[12.5px] ${item.checked ? "text-foreground" : "text-muted-foreground"}`}>{ar ? item.label_ar : item.label_en}</span>
                </button>
              ))}
              <p className="text-[10.5px] text-muted-foreground mt-3">
                {checklist.filter((c: any) => c.checked).length}/{checklist.length} {ar ? "مكتمل" : "completed"}
              </p>
            </div>
          )}

          {/* ── Photos Tab ── */}
          {tab === "photos" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[14px] font-semibold">{ar ? "الصور والمرفقات" : "Photos & Attachments"}</h3>
                <label className={btnPrimary + " h-9 text-[12px] cursor-pointer"}>
                  <Upload size={13} /> {ar ? "رفع صور" : "Upload"}
                  <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
              {attachments.length === 0 ? (
                <div className="py-12 text-center text-[13px] text-muted-foreground/50">{ar ? "مفيش صور لسه" : "No photos yet"}</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {attachments.map((a) => (
                    <div key={a.id} className="border border-border/40 rounded-xl overflow-hidden group relative">
                      <img src={a.file_url} alt={a.file_name || ""} className="w-full h-32 object-cover" />
                      <div className="px-2 py-1.5">
                        <p className="text-[10px] text-muted-foreground truncate">{a.file_name}</p>
                        {a.file_type && <span className="text-[9px] text-muted-foreground/50">{FILE_TYPES.find((f) => f.value === a.file_type)?.[ar ? "ar" : "en"]}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Requirements Tab ── */}
          {tab === "requirements" && (
            <div className="space-y-3">
              <h3 className="text-[14px] font-semibold mb-3">{ar ? "متطلبات العميل" : "Customer Requirements"}</h3>
              {[
                { label: ar ? "الألوان المفضلة" : "Preferred Colors", value: visit.preferred_colors },
                { label: ar ? "الخامات المفضلة" : "Preferred Materials", value: visit.preferred_materials },
                { label: ar ? "الستايل" : "Style", value: visit.preferred_style ? (STYLES.find((s) => s.value === visit.preferred_style)?.[ar ? "ar" : "en"]) : null },
                { label: ar ? "ملاحظات خاصة" : "Special Notes", value: visit.special_notes },
                { label: ar ? "ملاحظات التركيب" : "Installation Notes", value: visit.installation_notes },
              ].map((r, i) => (
                <div key={i} className="px-4 py-3 bg-muted/10 border border-border/30 rounded-xl">
                  <p className="text-[11px] text-muted-foreground mb-0.5">{r.label}</p>
                  <p className="text-[13px] text-foreground">{r.value || (ar ? "—" : "—")}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {measModal && (
        <MeasurementModal
          onClose={() => { setMeasModal(false); setEditMeas(null); }}
          onSaved={() => { setMeasModal(false); setEditMeas(null); loadData(); }}
          visitId={visit.id} editMeasurement={editMeas} ar={ar} workspaceId={workspaceId}
        />
      )}
      {editVisit && (
        <VisitModal onClose={() => setEditVisit(false)} onSaved={() => { setEditVisit(false); onRefresh(); }}
          orgs={[]} orders={orders} editVisit={visit} ar={ar} workspaceId={workspaceId} />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────

export default function SiteVisits() {
  const { lang } = useLanguage();
  const { workspace } = useAuth();
  const ar = lang === "ar";

  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [orders, setOrders] = useState<WorkItem[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedVisit, setSelectedVisit] = useState<SiteVisit | null>(null);

  async function loadAll() {
    const wid = workspace?.id || "demo";
    const ds = getDataSource();
    const [v, w, o] = await Promise.all([
      ds.site_visits.list(wid),
      ds.work_items.list(wid, { type: "sales_order" }),
      ds.organizations.list(wid),
    ]);
    setVisits(v as SiteVisit[]);
    setOrders(w as WorkItem[]);
    setOrgs(o as Org[]);
    setLoading(false);
    if (selectedVisit) {
      const updated = (v as SiteVisit[]).find((sv) => sv.id === selectedVisit.id);
      if (updated) setSelectedVisit(updated);
    }
  }

  useEffect(() => { loadAll(); }, [workspace?.id]);

  const filtered = useMemo(() => {
    let list = visits;
    if (filterStatus !== "all") list = list.filter((v) => v.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((v) =>
        v.visit_number.toLowerCase().includes(q) ||
        (v.customer_name || "").toLowerCase().includes(q) ||
        (v.site_address || "").toLowerCase().includes(q) ||
        (v.assigned_technician || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [visits, filterStatus, search]);

  // Dashboard stats
  const scheduled = visits.filter((v) => v.status === "scheduled").length;
  const completed = visits.filter((v) => v.status === "completed").length;
  const inProgress = visits.filter((v) => v.status === "in_progress").length;
  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7);
  const thisWeek = visits.filter((v) => {
    if (!v.visit_date) return false;
    const d = new Date(v.visit_date);
    return d >= weekStart && d < weekEnd;
  }).length;

  function handleExportVisits() {
    const rows = visits.map((v) => ({
      visit_number: v.visit_number, customer_name: v.customer_name,
      site_address: v.site_address, assigned_technician: v.assigned_technician,
      visit_date: v.visit_date, status: v.status,
      preferred_style: v.preferred_style, notes: v.notes,
    }));
    exportCSV(rows, `thoth-site-visits-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  async function handleExportMeasurements() {
    if (!workspace?.id) return;
    const ds = getDataSource();
    const all = await ds.measurements.list(workspace.id);
    const rows = (all as Measurement[]).map((m) => ({
      room_name: m.room_name, room_type: m.room_type, label: m.label,
      width: m.width, height: m.height, depth: m.depth, length: m.length,
      ceiling_height: m.ceiling_height, approval_status: m.approval_status,
      notes: m.notes,
    }));
    exportCSV(rows, `thoth-measurements-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  function handleDownloadTemplate() {
    downloadTemplate(
      ["visit_number", "customer_name", "site_address", "assigned_technician", "visit_date", "notes", "preferred_style"],
      "thoth-site-visits-template.csv"
    );
  }

  if (selectedVisit) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <VisitDetail visit={selectedVisit} onBack={() => { setSelectedVisit(null); loadAll(); }} ar={ar} workspaceId={workspace?.id || ""} orders={orders} onRefresh={loadAll} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight" style={{ fontFamily: "var(--app-font-serif)" }}>
            {ar ? "المعاينات" : "Site Visits"}
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">{ar ? "المعاينات والمقاسات" : "Measurements & Site Visits"}</p>
        </div>
        <button onClick={() => setModal(true)} className={btnPrimary + " h-10"}><Plus size={14} /> {ar ? "معاينة جديدة" : "New Visit"}</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: ar ? "مجدولة" : "Scheduled", value: scheduled, color: "text-blue-600 bg-blue-50" },
          { label: ar ? "جارية" : "In Progress", value: inProgress, color: "text-amber-600 bg-amber-50" },
          { label: ar ? "مكتملة" : "Completed", value: completed, color: "text-emerald-600 bg-emerald-50" },
          { label: ar ? "هذا الأسبوع" : "This Week", value: thisWeek, color: "text-violet-600 bg-violet-50" },
        ].map((s, i) => (
          <div key={i} className="border border-border/40 rounded-xl p-4 bg-background">
            <p className="text-[11px] text-muted-foreground mb-1">{s.label}</p>
            <p className={`text-[20px] font-semibold tabular-nums ${s.color.split(" ")[0]}`} style={{ fontFamily: "var(--app-font-serif)" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
          <input className={inputCls + " pl-9"} placeholder={ar ? "بحث..." : "Search..."} value={search} onChange={(e) => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground"><X size={12} /></button>}
        </div>
        <div className="flex gap-1">
          <button onClick={() => setFilterStatus("all")} className={`px-3 py-2 rounded-lg text-[11px] font-medium ${filterStatus === "all" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"}`}>{ar ? "الكل" : "All"}</button>
          {VISIT_STATUSES.map((s) => (
            <button key={s.value} onClick={() => setFilterStatus(s.value)} className={`px-3 py-2 rounded-lg text-[11px] font-medium ${filterStatus === s.value ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"}`}>{ar ? s.ar : s.en}</button>
          ))}
        </div>
        <div className="flex gap-1">
          <button onClick={handleExportVisits} className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground" title={ar ? "تصدير المعاينات" : "Export Visits"}><Download size={14} /></button>
          <button onClick={handleExportMeasurements} className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground" title={ar ? "تصدير المقاسات" : "Export Measurements"}><Ruler size={14} /></button>
          <button onClick={handleDownloadTemplate} className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground" title={ar ? "تحميل قالب" : "Download Template"}><FileText size={14} /></button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
      ) : visits.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-4"><MapPin size={22} className="text-muted-foreground/30" /></div>
          <h3 className="text-[15px] font-semibold mb-1" style={{ fontFamily: "var(--app-font-serif)" }}>{ar ? "مفيش معاينات لسه" : "No site visits yet"}</h3>
          <p className="text-[13px] text-muted-foreground">{ar ? "أنشئ أول معاينة لبدء أخذ المقاسات." : "Create your first site visit to start capturing measurements."}</p>
          <button onClick={() => setModal(true)} className={btnPrimary + " h-10 mt-4"}><Plus size={14} /> {ar ? "معاينة جديدة" : "New Visit"}</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-[13px] text-muted-foreground/50">{ar ? "مفيش نتائج" : "No results"}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((v) => {
            const st = VISIT_STATUSES.find((s) => s.value === v.status)!;
            const StIcon = st.icon;
            const linkedOrder = orders.find((o) => o.id === v.sales_order_id);
            const linkedMeta = linkedOrder ? (linkedOrder.metadata as any || {}) : null;
            const checklistArr: any[] = Array.isArray(v.checklist) ? v.checklist as any[] : [];
            const checkedCount = checklistArr.filter((c: any) => c.checked).length;

            return (
              <button key={v.id} onClick={() => setSelectedVisit(v)}
                className="w-full text-left bg-background border border-border/40 rounded-xl p-5 hover:shadow-sm hover:border-border/70 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-[10.5px] font-mono text-muted-foreground">{v.visit_number}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.pill}`}>{ar ? st.ar : st.en}</span>
                      {linkedMeta?.so_number && <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5"><FileText size={9} />{linkedMeta.so_number}</span>}
                    </div>
                    <p className="text-[15px] font-medium" style={{ fontFamily: "var(--app-font-serif)" }}>
                      {v.customer_name || v.visit_number}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
                      {v.site_address && <span className="flex items-center gap-1"><MapPin size={9} />{v.site_address}</span>}
                      {v.visit_date && <span className="flex items-center gap-1"><Calendar size={9} />{v.visit_date}</span>}
                      {v.assigned_technician && <span className="flex items-center gap-1"><User size={9} />{v.assigned_technician}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {checklistArr.length > 0 && (
                      <span className="text-[10px] text-muted-foreground">{checkedCount}/{checklistArr.length}</span>
                    )}
                    <StIcon size={16} className={st.pill.split(" ")[1]} />
                    <ChevronRight size={14} className="text-muted-foreground/30" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <VisitModal onClose={() => setModal(false)} onSaved={() => { setModal(false); loadAll(); }}
          orgs={orgs} orders={orders} editVisit={null} ar={ar} workspaceId={workspace?.id || ""} />
      )}
    </div>
  );
}
