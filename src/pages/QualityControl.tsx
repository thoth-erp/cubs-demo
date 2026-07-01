/**
 * Quality Control — مراقبة الجودة
 *
 * Production Order → QC Inspection → Pass/Fail → Defect Logging → Rework → Re-inspect
 *
 * Uses qc_inspections + qc_defects tables.
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { getDataSource } from "../lib/data-source";
import { exportCSV } from "../lib/csv-export";
import type { Database } from "../lib/database.types";
import {
  Plus, Search, X, Loader2, AlertCircle, Download, Upload,
  CheckCircle2, Clock, ChevronRight, Calendar, Eye,
  Edit3, Trash2, FileText, Check, XCircle, RotateCcw,
  User, Building2, ClipboardCheck, Camera, AlertTriangle,
  ThumbsUp, ThumbsDown, ShieldCheck, ShieldAlert, Bug,
} from "lucide-react";

type QCInspection = Database["public"]["Tables"]["qc_inspections"]["Row"];
type QCDefect = Database["public"]["Tables"]["qc_defects"]["Row"];
type ProdOrder = Database["public"]["Tables"]["production_orders"]["Row"];

// ─── Constants ────────────────────────────────────────────

const INSPECTION_STATUSES = [
  { value: "pending",     en: "Pending",     ar: "في الانتظار",  pill: "bg-zinc-100 text-zinc-600",    icon: Clock },
  { value: "in_progress", en: "In Progress", ar: "جاري الفحص",  pill: "bg-blue-50 text-blue-600",     icon: Eye },
  { value: "passed",      en: "Passed",      ar: "ناجح",        pill: "bg-emerald-50 text-emerald-600", icon: ThumbsUp },
  { value: "failed",      en: "Failed",      ar: "فاشل",        pill: "bg-rose-50 text-rose-600",     icon: ThumbsDown },
  { value: "conditional", en: "Conditional",  ar: "مشروط",       pill: "bg-amber-50 text-amber-600",   icon: AlertTriangle },
] as const;

const INSPECTION_TYPES = [
  { value: "in_process",    en: "In-Process",    ar: "أثناء التصنيع" },
  { value: "pre_assembly",  en: "Pre-Assembly",  ar: "قبل التجميع" },
  { value: "final",         en: "Final",         ar: "فحص نهائي" },
  { value: "pre_delivery",  en: "Pre-Delivery",  ar: "قبل التسليم" },
  { value: "re_inspection", en: "Re-Inspection", ar: "إعادة فحص" },
] as const;

const SEVERITIES = [
  { value: "critical", en: "Critical", ar: "حرج",    color: "bg-rose-100 text-rose-700" },
  { value: "major",    en: "Major",    ar: "كبير",   color: "bg-orange-100 text-orange-700" },
  { value: "minor",    en: "Minor",    ar: "صغير",   color: "bg-amber-100 text-amber-700" },
  { value: "cosmetic", en: "Cosmetic", ar: "تجميلي", color: "bg-zinc-100 text-zinc-600" },
] as const;

const DEFECT_CATEGORIES = [
  { value: "dimension", en: "Dimension",  ar: "مقاسات" },
  { value: "surface",   en: "Surface",    ar: "سطح" },
  { value: "material",  en: "Material",   ar: "خامة" },
  { value: "assembly",  en: "Assembly",   ar: "تجميع" },
  { value: "finish",    en: "Finish",     ar: "دهان" },
  { value: "hardware",  en: "Hardware",   ar: "إكسسوارات" },
  { value: "edge",      en: "Edge",       ar: "كنار" },
  { value: "color",     en: "Color",      ar: "لون" },
  { value: "other",     en: "Other",      ar: "أخرى" },
] as const;

const DEFECT_STATUSES = [
  { value: "open",          en: "Open",          ar: "مفتوح",       color: "bg-rose-50 text-rose-600" },
  { value: "rework",        en: "In Rework",     ar: "جاري الإصلاح", color: "bg-amber-50 text-amber-600" },
  { value: "re_inspected",  en: "Re-Inspected",  ar: "تم إعادة الفحص", color: "bg-blue-50 text-blue-600" },
  { value: "accepted",      en: "Accepted",      ar: "مقبول",       color: "bg-emerald-50 text-emerald-600" },
  { value: "rejected",      en: "Rejected",      ar: "مرفوض",       color: "bg-rose-100 text-rose-700" },
] as const;

const DEFAULT_CHECKLIST = [
  { id: "dimensions",   label_en: "Dimensions match drawings",       label_ar: "المقاسات مطابقة للرسومات",    passed: null as boolean | null, notes: "" },
  { id: "surface",      label_en: "Surface quality acceptable",      label_ar: "جودة السطح مقبولة",           passed: null, notes: "" },
  { id: "edges",        label_en: "Edge banding quality",            label_ar: "جودة الكنار",                 passed: null, notes: "" },
  { id: "color",        label_en: "Color matches specification",     label_ar: "اللون مطابق للمطلوب",          passed: null, notes: "" },
  { id: "hardware",     label_en: "Hardware installed correctly",    label_ar: "الإكسسوارات مركبة صح",         passed: null, notes: "" },
  { id: "assembly",     label_en: "Assembly tight and aligned",     label_ar: "التجميع محكم ومظبوط",          passed: null, notes: "" },
  { id: "finish",       label_en: "Finish/Paint quality",           label_ar: "جودة الدهان/التشطيب",          passed: null, notes: "" },
  { id: "functionality", label_en: "Doors/drawers function properly", label_ar: "الأبواب والأدراج شغالة",     passed: null, notes: "" },
  { id: "cleanliness",  label_en: "Clean and free of debris",       label_ar: "نظيف ومفيش بقايا",            passed: null, notes: "" },
  { id: "packaging",    label_en: "Ready for safe packaging",       label_ar: "جاهز للتغليف الآمن",           passed: null, notes: "" },
];

// ─── Helpers ──────────────────────────────────────────────

const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium px-5 hover:opacity-90 transition-opacity disabled:opacity-40";
const inputCls = "w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20";
const labelCls = "text-[11.5px] text-muted-foreground font-medium mb-1 block";

function genInspNumber(): string {
  const d = new Date();
  const seq = Math.floor(Math.random() * 9000) + 1000;
  return `QC-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}-${seq}`;
}

async function logActivity(wid: string, type: string, eid: string, en: string, arTxt: string) {
  const ds = getDataSource();
  try { await ds.activity_events.create(wid, { workspace_id: wid, event_type: type, entity_type: "qc_inspection", entity_id: eid, description_en: en, description_ar: arTxt, metadata: {} } as any); } catch {}
}

// ─── Create Inspection Modal ──────────────────────────────

function InspectionModal({ onClose, onSaved, prodOrders, ar, workspaceId }: {
  onClose: () => void; onSaved: () => void;
  prodOrders: ProdOrder[]; ar: boolean; workspaceId: string;
}) {
  const [inspNumber, setInspNumber] = useState(genInspNumber());
  const [poId, setPOId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [inspectorName, setInspectorName] = useState("");
  const [inspType, setInspType] = useState("final");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handlePOSelect(id: string) {
    setPOId(id);
    const po = prodOrders.find(p => p.id === id);
    if (po?.customer_name && !customerName) setCustomerName(po.customer_name);
  }

  async function handleSubmit() {
    if (!inspNumber.trim()) { setError(ar ? "رقم الفحص مطلوب" : "Inspection number required"); return; }
    setLoading(true); setError("");
    const ds = getDataSource();
    const po = prodOrders.find(p => p.id === poId);
    await ds.qc_inspections.create(workspaceId, {
      workspace_id: workspaceId, inspection_number: inspNumber.trim(),
      production_order_id: poId || null, sales_order_id: po?.sales_order_id || null,
      customer_name: customerName || null, inspector_name: inspectorName || null,
      inspection_type: inspType as any, status: "pending",
      checklist: DEFAULT_CHECKLIST, metadata: {},
    } as any);
    await logActivity(workspaceId, "qc_created", inspNumber,
      `QC inspection ${inspNumber} created`, `تم إنشاء فحص الجودة ${inspNumber}`);
    setLoading(false); onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background rounded-2xl border border-border/60 shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-border/40 shrink-0 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>{ar ? "فحص جودة جديد" : "New QC Inspection"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>{ar ? "رقم الفحص" : "Inspection #"}</label>
              <input className={inputCls} value={inspNumber} onChange={e => setInspNumber(e.target.value)} /></div>
            <div><label className={labelCls}>{ar ? "النوع" : "Type"}</label>
              <select className={inputCls} value={inspType} onChange={e => setInspType(e.target.value)}>
                {INSPECTION_TYPES.map(t => <option key={t.value} value={t.value}>{ar ? t.ar : t.en}</option>)}
              </select></div>
          </div>
          <div><label className={labelCls}>{ar ? "أمر التشغيل" : "Production Order"}</label>
            <select className={inputCls} value={poId} onChange={e => handlePOSelect(e.target.value)}>
              <option value="">{ar ? "— اختر —" : "— Select —"}</option>
              {prodOrders.filter(p => !["cancelled","delivered"].includes(p.status)).map(p => (
                <option key={p.id} value={p.id}>{p.po_number} — {p.title}</option>
              ))}
            </select></div>
          <div><label className={labelCls}>{ar ? "العميل" : "Customer"}</label>
            <input className={inputCls} value={customerName} onChange={e => setCustomerName(e.target.value)} /></div>
          <div><label className={labelCls}>{ar ? "المفتش" : "Inspector"}</label>
            <input className={inputCls} value={inspectorName} onChange={e => setInspectorName(e.target.value)} /></div>
          {error && <p className="text-[12px] text-rose-500 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
        </div>
        <div className="px-6 py-4 border-t border-border/40 shrink-0 flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border/60 text-[13px] font-medium hover:bg-muted/50">{ar ? "إلغاء" : "Cancel"}</button>
          <button onClick={handleSubmit} disabled={loading} className={btnPrimary + " flex-1 h-10"}>
            {loading && <Loader2 size={12} className="animate-spin" />} {ar ? "أنشئ الفحص" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Defect Modal ─────────────────────────────────────────

function DefectModal({ onClose, onSaved, inspectionId, editDefect, ar, workspaceId }: {
  onClose: () => void; onSaved: () => void;
  inspectionId: string; editDefect: QCDefect | null; ar: boolean; workspaceId: string;
}) {
  const [title, setTitle] = useState(editDefect?.title || "");
  const [severity, setSeverity] = useState(editDefect?.severity || "minor");
  const [category, setCategory] = useState(editDefect?.category || "other");
  const [description, setDescription] = useState(editDefect?.description || "");
  const [location, setLocation] = useState(editDefect?.location || "");
  const [photoUrl, setPhotoUrl] = useState(editDefect?.photo_url || "");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;
    const path = `${workspaceId}/${inspectionId}/${Date.now()}-${file.name}`;
    const { data } = await supabase.storage.from("qc-photos").upload(path, file);
    if (data) {
      const { data: urlData } = supabase.storage.from("qc-photos").getPublicUrl(data.path);
      setPhotoUrl(urlData.publicUrl);
    }
  }

  async function handleSave() {
    if (!title.trim()) return;
    setLoading(true);
    const ds = getDataSource();
    const defNum = `DEF-${Math.floor(Math.random() * 9000) + 1000}`;
    const payload: any = {
      workspace_id: workspaceId, inspection_id: inspectionId,
      defect_number: editDefect?.defect_number || defNum,
      title: title.trim(), severity, category,
      description: description || null, location: location || null,
      photo_url: photoUrl || null, status: editDefect ? undefined : "open",
      metadata: {},
    };
    if (editDefect) await ds.qc_defects.update(workspaceId, editDefect.id, payload);
    else await ds.qc_defects.create(workspaceId, payload);
    setLoading(false); onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background rounded-2xl border border-border/60 shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-border/40 shrink-0 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>
            {editDefect ? (ar ? "تعديل العيب" : "Edit Defect") : (ar ? "تسجيل عيب" : "Log Defect")}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          <div><label className={labelCls}>{ar ? "العيب" : "Defect Title"}</label>
            <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder={ar ? "مثال: خدش على السطح" : "e.g. Surface scratch"} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>{ar ? "الخطورة" : "Severity"}</label>
              <select className={inputCls} value={severity} onChange={e => setSeverity(e.target.value as never)}>
                {SEVERITIES.map(s => <option key={s.value} value={s.value}>{ar ? s.ar : s.en}</option>)}
              </select></div>
            <div><label className={labelCls}>{ar ? "التصنيف" : "Category"}</label>
              <select className={inputCls} value={category} onChange={e => setCategory(e.target.value as never)}>
                {DEFECT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{ar ? c.ar : c.en}</option>)}
              </select></div>
          </div>
          <div><label className={labelCls}>{ar ? "المكان" : "Location"}</label>
            <input className={inputCls} value={location} onChange={e => setLocation(e.target.value)} placeholder={ar ? "مثال: الباب العلوي الأيمن" : "e.g. Upper right door"} /></div>
          <div><label className={labelCls}>{ar ? "الوصف" : "Description"}</label>
            <textarea className={inputCls + " h-16 py-2 resize-none"} value={description} onChange={e => setDescription(e.target.value)} /></div>
          <div><label className={labelCls}>{ar ? "صورة العيب" : "Defect Photo"}</label>
            <div className="flex items-center gap-3">
              <label className="text-[11px] text-blue-600 font-medium cursor-pointer hover:opacity-70 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-blue-200">
                <Camera size={11} /> {ar ? "رفع صورة" : "Upload"}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
              {photoUrl && <img src={photoUrl} alt="" className="w-12 h-12 rounded-lg object-cover border" />}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border/40 shrink-0 flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border/60 text-[13px] font-medium hover:bg-muted/50">{ar ? "إلغاء" : "Cancel"}</button>
          <button onClick={handleSave} disabled={loading || !title.trim()} className={btnPrimary + " flex-1 h-10"}>
            {loading && <Loader2 size={12} className="animate-spin" />} {ar ? "حفظ" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Inspection Detail ────────────────────────────────────

function InspectionDetail({ insp, onBack, ar, workspaceId, prodOrders, onRefresh }: {
  insp: QCInspection; onBack: () => void; ar: boolean;
  workspaceId: string; prodOrders: ProdOrder[]; onRefresh: () => void;
}) {
  const [defects, setDefects] = useState<QCDefect[]>([]);
  const [loading, setLoading] = useState(true);
  const [defModal, setDefModal] = useState(false);
  const [editDef, setEditDef] = useState<QCDefect | null>(null);
  const [tab, setTab] = useState<"checklist" | "defects">("checklist");

  async function loadDefects() {
    const ds = getDataSource();
    const d = await ds.qc_defects.list(workspaceId, { inspection_id: insp.id });
    setDefects(d as QCDefect[]);
    setLoading(false);
  }

  useEffect(() => { loadDefects(); }, [insp.id]);

  const checklist: any[] = Array.isArray(insp.checklist) ? insp.checklist as any[] : [];

  async function toggleChecklistItem(itemId: string, passed: boolean | null) {
    const updated = checklist.map((c: any) => c.id === itemId ? { ...c, passed } : c);
    const ds = getDataSource();
    await ds.qc_inspections.update(workspaceId, insp.id, { checklist: updated } as any);
    // Calculate score
    const total = updated.length;
    const passedCount = updated.filter((c: any) => c.passed === true).length;
    const score = Math.round((passedCount / total) * 100);
    await ds.qc_inspections.update(workspaceId, insp.id, { overall_score: score } as any);
    onRefresh();
  }

  async function updateStatus(status: string) {
    const ds = getDataSource();
    const payload: any = { status };
    if (status === "in_progress") payload.inspected_at = null;
    if (["passed","failed","conditional"].includes(status)) {
      payload.inspected_at = new Date().toISOString();
    }
    await ds.qc_inspections.update(workspaceId, insp.id, payload);
    if (status === "passed") {
      await logActivity(workspaceId, "qc_passed", insp.id,
        `QC ${insp.inspection_number} passed`, `فحص الجودة ${insp.inspection_number} ناجح`);
    }
    if (status === "failed") {
      await logActivity(workspaceId, "qc_failed", insp.id,
        `QC ${insp.inspection_number} failed`, `فحص الجودة ${insp.inspection_number} فاشل`);
    }
    onRefresh();
  }

  async function updateDefectStatus(defId: string, status: string) {
    const ds = getDataSource();
    const payload: any = { status };
    if (status === "rework") payload.reworked_at = null;
    if (status === "accepted" || status === "rejected") {
      payload.reworked_at = new Date().toISOString();
    }
    await ds.qc_defects.update(workspaceId, defId, payload);
    loadDefects();
  }

  async function deleteDefect(defId: string) {
    const ds = getDataSource();
    await ds.qc_defects.remove(workspaceId, defId);
    loadDefects();
  }

  const st = INSPECTION_STATUSES.find(s => s.value === insp.status)!;
  const typeDef = INSPECTION_TYPES.find(t => t.value === insp.inspection_type);
  const po = prodOrders.find(p => p.id === insp.production_order_id);
  const passedItems = checklist.filter((c: any) => c.passed === true).length;
  const failedItems = checklist.filter((c: any) => c.passed === false).length;
  const openDefects = defects.filter(d => d.status === "open" || d.status === "rework").length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-muted/50"><ChevronRight size={16} className="rotate-180" /></button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[11px] font-mono text-muted-foreground">{insp.inspection_number}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.pill}`}>{ar ? st.ar : st.en}</span>
            {typeDef && <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{ar ? typeDef.ar : typeDef.en}</span>}
            {insp.overall_score != null && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${insp.overall_score >= 80 ? "bg-emerald-50 text-emerald-600" : insp.overall_score >= 60 ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"}`}>
                {insp.overall_score}%
              </span>
            )}
          </div>
          <h2 className="text-[18px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>
            {po ? po.title : insp.customer_name || insp.inspection_number}
          </h2>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
            {insp.customer_name && <span className="flex items-center gap-1"><Building2 size={10} />{insp.customer_name}</span>}
            {insp.inspector_name && <span className="flex items-center gap-1"><User size={10} />{insp.inspector_name}</span>}
            {po && <span className="flex items-center gap-1"><FileText size={10} />{po.po_number}</span>}
          </div>
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap">
          {insp.status === "pending" && <button onClick={() => updateStatus("in_progress")} className="text-[11px] text-blue-600 font-medium hover:opacity-70 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-blue-200"><Eye size={11} /> {ar ? "ابدأ الفحص" : "Start"}</button>}
          {insp.status === "in_progress" && (
            <>
              <button onClick={() => updateStatus("passed")} className="text-[11px] text-emerald-600 font-medium hover:opacity-70 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-200"><ThumbsUp size={11} /> {ar ? "ناجح" : "Pass"}</button>
              <button onClick={() => updateStatus("failed")} className="text-[11px] text-rose-600 font-medium hover:opacity-70 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200"><ThumbsDown size={11} /> {ar ? "فاشل" : "Fail"}</button>
              <button onClick={() => updateStatus("conditional")} className="text-[11px] text-amber-600 font-medium hover:opacity-70 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-200"><AlertTriangle size={11} /> {ar ? "مشروط" : "Conditional"}</button>
            </>
          )}
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <span className="text-[11px] bg-emerald-50 text-emerald-600 rounded-lg px-3 py-1.5 flex items-center gap-1"><CheckCircle2 size={10} />{passedItems} {ar ? "ناجح" : "passed"}</span>
        {failedItems > 0 && <span className="text-[11px] bg-rose-50 text-rose-600 rounded-lg px-3 py-1.5 flex items-center gap-1"><XCircle size={10} />{failedItems} {ar ? "فاشل" : "failed"}</span>}
        {openDefects > 0 && <span className="text-[11px] bg-amber-50 text-amber-600 rounded-lg px-3 py-1.5 flex items-center gap-1"><Bug size={10} />{openDefects} {ar ? "عيب مفتوح" : "open defects"}</span>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-border/30 pb-3">
        {[
          { id: "checklist" as const, en: "Checklist", ar: "قائمة الفحص", icon: ClipboardCheck },
          { id: "defects" as const, en: `Defects (${defects.length})`, ar: `العيوب (${defects.length})`, icon: Bug },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-2 rounded-lg text-[12px] font-medium transition-colors flex items-center gap-1.5
              ${tab === t.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"}`}>
            <t.icon size={13} />{ar ? t.ar : t.en}
          </button>
        ))}
      </div>

      {loading && tab === "defects" ? (
        <div className="py-16 flex justify-center"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {/* ── Checklist ── */}
          {tab === "checklist" && (
            <div className="space-y-2">
              {checklist.map((item: any) => (
                <div key={item.id} className={`flex items-center gap-3 px-4 py-3 border rounded-xl transition-colors ${
                  item.passed === true ? "border-emerald-200 bg-emerald-50/30" :
                  item.passed === false ? "border-rose-200 bg-rose-50/30" :
                  "border-border/30 bg-muted/10"
                }`}>
                  <div className="flex gap-1">
                    <button onClick={() => toggleChecklistItem(item.id, item.passed === true ? null : true)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${item.passed === true ? "bg-emerald-100 text-emerald-600" : "bg-muted text-muted-foreground/30 hover:bg-emerald-50"}`}>
                      <CheckCircle2 size={13} />
                    </button>
                    <button onClick={() => toggleChecklistItem(item.id, item.passed === false ? null : false)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${item.passed === false ? "bg-rose-100 text-rose-600" : "bg-muted text-muted-foreground/30 hover:bg-rose-50"}`}>
                      <XCircle size={13} />
                    </button>
                  </div>
                  <span className="text-[12.5px] flex-1">{ar ? item.label_ar : item.label_en}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Defects ── */}
          {tab === "defects" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[14px] font-semibold">{ar ? "سجل العيوب" : "Defect Log"}</h3>
                <button onClick={() => { setEditDef(null); setDefModal(true); }} className={btnPrimary + " h-9 text-[12px]"}><Plus size={13} /> {ar ? "سجّل عيب" : "Log Defect"}</button>
              </div>
              {defects.length === 0 ? (
                <div className="py-12 text-center">
                  <ShieldCheck size={28} className="text-emerald-300 mx-auto mb-2" />
                  <p className="text-[13px] text-muted-foreground/50">{ar ? "مفيش عيوب — ممتاز!" : "No defects — excellent!"}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {defects.map(d => {
                    const sevDef = SEVERITIES.find(s => s.value === d.severity)!;
                    const catDef = DEFECT_CATEGORIES.find(c => c.value === d.category);
                    const dstDef = DEFECT_STATUSES.find(s => s.value === d.status)!;
                    return (
                      <div key={d.id} className="border border-border/40 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          {d.photo_url && <img src={d.photo_url} alt="" className="w-16 h-16 rounded-lg object-cover border shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-[10px] font-mono text-muted-foreground">{d.defect_number}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${sevDef.color}`}>{ar ? sevDef.ar : sevDef.en}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${dstDef.color}`}>{ar ? dstDef.ar : dstDef.en}</span>
                              {catDef && <span className="text-[9px] text-muted-foreground">{ar ? catDef.ar : catDef.en}</span>}
                            </div>
                            <p className="text-[13px] font-medium">{d.title}</p>
                            {d.location && <p className="text-[10.5px] text-muted-foreground mt-0.5">{ar ? "المكان:" : "Location:"} {d.location}</p>}
                            {d.description && <p className="text-[10.5px] text-muted-foreground mt-0.5">{d.description}</p>}
                            {d.rework_notes && <p className="text-[10.5px] text-amber-600 mt-1">{ar ? "ملاحظات الإصلاح:" : "Rework:"} {d.rework_notes}</p>}
                          </div>
                          <div className="flex flex-col gap-1 shrink-0">
                            {d.status === "open" && <button onClick={() => updateDefectStatus(d.id, "rework")} className="text-[10px] text-amber-600 px-2 py-1 rounded border border-amber-200 hover:opacity-70">{ar ? "إصلاح" : "Rework"}</button>}
                            {d.status === "rework" && <button onClick={() => updateDefectStatus(d.id, "re_inspected")} className="text-[10px] text-blue-600 px-2 py-1 rounded border border-blue-200 hover:opacity-70">{ar ? "إعادة فحص" : "Re-inspect"}</button>}
                            {d.status === "re_inspected" && (
                              <>
                                <button onClick={() => updateDefectStatus(d.id, "accepted")} className="text-[10px] text-emerald-600 px-2 py-1 rounded border border-emerald-200 hover:opacity-70">{ar ? "مقبول" : "Accept"}</button>
                                <button onClick={() => updateDefectStatus(d.id, "rejected")} className="text-[10px] text-rose-600 px-2 py-1 rounded border border-rose-200 hover:opacity-70">{ar ? "مرفوض" : "Reject"}</button>
                              </>
                            )}
                            <button onClick={() => { setEditDef(d); setDefModal(true); }} className="text-[10px] text-muted-foreground px-2 py-1 rounded border border-border/60 hover:opacity-70">{ar ? "تعديل" : "Edit"}</button>
                            <button onClick={() => deleteDefect(d.id)} className="text-[10px] text-rose-400 px-2 py-1 rounded hover:opacity-70">{ar ? "حذف" : "Delete"}</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {defModal && (
        <DefectModal onClose={() => { setDefModal(false); setEditDef(null); }} onSaved={() => { setDefModal(false); setEditDef(null); loadDefects(); }}
          inspectionId={insp.id} editDefect={editDef} ar={ar} workspaceId={workspaceId} />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────

export default function QualityControl() {
  const { lang } = useLanguage();
  const { workspace } = useAuth();
  const ar = lang === "ar";

  const [loading, setLoading] = useState(true);
  const [inspections, setInspections] = useState<QCInspection[]>([]);
  const [prodOrders, setProdOrders] = useState<ProdOrder[]>([]);
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState<QCInspection | null>(null);

  async function loadAll() {
    const wid = workspace?.id || "demo";
    const ds = getDataSource();
    const [i, p] = await Promise.all([
      ds.qc_inspections.list(wid),
      ds.production_orders.list(wid),
    ]);
    setInspections(i as QCInspection[]);
    setProdOrders(p as ProdOrder[]);
    setLoading(false);
    if (selected) {
      const u = (i as QCInspection[]).find(x => x.id === selected.id);
      if (u) setSelected(u);
    }
  }

  useEffect(() => { loadAll(); }, [workspace?.id]);

  const filtered = useMemo(() => {
    let list = inspections;
    if (filterStatus !== "all") list = list.filter(i => i.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        i.inspection_number.toLowerCase().includes(q) ||
        (i.customer_name || "").toLowerCase().includes(q) ||
        (i.inspector_name || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [inspections, filterStatus, search]);

  const pending = inspections.filter(i => i.status === "pending").length;
  const inProgress = inspections.filter(i => i.status === "in_progress").length;
  const passed = inspections.filter(i => i.status === "passed").length;
  const failed = inspections.filter(i => i.status === "failed" || i.status === "conditional").length;

  function handleExport() {
    exportCSV(inspections.map(i => ({
      inspection_number: i.inspection_number, customer_name: i.customer_name,
      inspector_name: i.inspector_name, inspection_type: i.inspection_type,
      status: i.status, overall_score: i.overall_score,
    })), `thoth-qc-inspections-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  if (selected) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <InspectionDetail insp={selected} onBack={() => { setSelected(null); loadAll(); }} ar={ar} workspaceId={workspace?.id || ""} prodOrders={prodOrders} onRefresh={loadAll} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight" style={{ fontFamily: "var(--app-font-serif)" }}>
            {ar ? "مراقبة الجودة" : "Quality Control"}
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">{ar ? "فحوصات الجودة وتتبع العيوب" : "QC Inspections & Defect Tracking"}</p>
        </div>
        <button onClick={() => setModal(true)} className={btnPrimary + " h-10"}><Plus size={14} /> {ar ? "فحص جديد" : "New Inspection"}</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: ar ? "في الانتظار" : "Pending", value: pending, color: "text-zinc-600" },
          { label: ar ? "جاري الفحص" : "In Progress", value: inProgress, color: "text-blue-600" },
          { label: ar ? "ناجح" : "Passed", value: passed, color: "text-emerald-600" },
          { label: ar ? "فاشل/مشروط" : "Failed/Conditional", value: failed, color: failed > 0 ? "text-rose-600" : "text-zinc-400" },
        ].map((s, i) => (
          <div key={i} className="border border-border/40 rounded-xl p-4 bg-background">
            <p className="text-[11px] text-muted-foreground mb-1">{s.label}</p>
            <p className={`text-[20px] font-semibold tabular-nums ${s.color}`} style={{ fontFamily: "var(--app-font-serif)" }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
          <input className={inputCls + " pl-9"} placeholder={ar ? "بحث..." : "Search..."} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1">
          {[{ v: "all", en: "All", ar: "الكل" }, ...INSPECTION_STATUSES.map(s => ({ v: s.value, en: s.en, ar: s.ar }))].map(g => (
            <button key={g.v} onClick={() => setFilterStatus(g.v)} className={`px-3 py-2 rounded-lg text-[11px] font-medium ${filterStatus === g.v ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"}`}>{ar ? g.ar : g.en}</button>
          ))}
        </div>
        <button onClick={handleExport} className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground"><Download size={14} /></button>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
      ) : inspections.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-4"><ShieldCheck size={22} className="text-muted-foreground/30" /></div>
          <h3 className="text-[15px] font-semibold mb-1" style={{ fontFamily: "var(--app-font-serif)" }}>{ar ? "مفيش فحوصات لسه" : "No inspections yet"}</h3>
          <p className="text-[13px] text-muted-foreground">{ar ? "أنشئ أول فحص جودة لأمر تشغيل." : "Create your first QC inspection for a production order."}</p>
          <button onClick={() => setModal(true)} className={btnPrimary + " h-10 mt-4"}><Plus size={14} /> {ar ? "فحص جديد" : "New Inspection"}</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-[13px] text-muted-foreground/50">{ar ? "مفيش نتائج" : "No results"}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(insp => {
            const st = INSPECTION_STATUSES.find(s => s.value === insp.status)!;
            const StIcon = st.icon;
            const typeDef = INSPECTION_TYPES.find(t => t.value === insp.inspection_type);
            const po = prodOrders.find(p => p.id === insp.production_order_id);

            return (
              <button key={insp.id} onClick={() => setSelected(insp)}
                className="w-full text-left bg-background border border-border/40 rounded-xl p-5 hover:shadow-sm hover:border-border/70 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-[10.5px] font-mono text-muted-foreground">{insp.inspection_number}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.pill}`}>{ar ? st.ar : st.en}</span>
                      {typeDef && <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{ar ? typeDef.ar : typeDef.en}</span>}
                      {insp.overall_score != null && <span className={`text-[10px] font-medium ${insp.overall_score >= 80 ? "text-emerald-600" : insp.overall_score >= 60 ? "text-amber-600" : "text-rose-600"}`}>{insp.overall_score}%</span>}
                    </div>
                    <p className="text-[15px] font-medium" style={{ fontFamily: "var(--app-font-serif)" }}>
                      {po ? po.title : insp.customer_name || insp.inspection_number}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
                      {insp.customer_name && <span className="flex items-center gap-1"><Building2 size={9} />{insp.customer_name}</span>}
                      {insp.inspector_name && <span className="flex items-center gap-1"><User size={9} />{insp.inspector_name}</span>}
                      {po && <span className="flex items-center gap-1"><FileText size={9} />{po.po_number}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StIcon size={16} className={st.pill.split(" ")[1]} />
                    <ChevronRight size={14} className="text-muted-foreground/30" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {modal && (
        <InspectionModal onClose={() => setModal(false)} onSaved={() => { setModal(false); loadAll(); }}
          prodOrders={prodOrders} ar={ar} workspaceId={workspace?.id || ""} />
      )}
    </div>
  );
}
