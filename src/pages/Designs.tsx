/**
 * Design & Technical Drawings — التصميمات والرسومات الفنية
 *
 * Approved Measurements → Design Brief → Client Approval → Production
 *
 * Uses dedicated design_briefs + design_files + design_comments tables.
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
  CheckCircle2, Clock, ChevronRight, Calendar, Eye,
  Edit3, Trash2, FileText, Send, Check, RotateCcw, XCircle,
  Palette, PenTool, Image, MessageSquare, Paperclip,
  Ruler, User, Building2, Layers, GitBranch,
} from "lucide-react";

type DesignBrief = Database["public"]["Tables"]["design_briefs"]["Row"];
type DesignFile = Database["public"]["Tables"]["design_files"]["Row"];
type DesignComment = Database["public"]["Tables"]["design_comments"]["Row"];
type WorkItem = Database["public"]["Tables"]["work_items"]["Row"];
type SiteVisit = Database["public"]["Tables"]["site_visits"]["Row"];
type Measurement = Database["public"]["Tables"]["measurements"]["Row"];
type Org = Database["public"]["Tables"]["organizations"]["Row"];

// ─── Constants ────────────────────────────────────────────

const DESIGN_STATUSES = [
  { value: "draft",           en: "Draft",           ar: "مسودة",          pill: "bg-zinc-100 text-zinc-600" },
  { value: "in_progress",     en: "In Progress",     ar: "جاري التصميم",   pill: "bg-blue-50 text-blue-600" },
  { value: "internal_review", en: "Internal Review",  ar: "مراجعة داخلية",  pill: "bg-violet-50 text-violet-600" },
  { value: "client_review",   en: "Client Review",    ar: "مراجعة العميل",  pill: "bg-amber-50 text-amber-600" },
  { value: "revision",        en: "Revision",         ar: "تعديلات",        pill: "bg-orange-50 text-orange-600" },
  { value: "approved",        en: "Approved",         ar: "تم الاعتماد",    pill: "bg-emerald-50 text-emerald-600" },
  { value: "cancelled",       en: "Cancelled",        ar: "ملغي",           pill: "bg-rose-50 text-rose-600" },
] as const;

const DESIGN_TYPES = [
  { value: "kitchen",     en: "Kitchen",      ar: "مطبخ" },
  { value: "wardrobe",    en: "Wardrobe",     ar: "دولاب" },
  { value: "bedroom",     en: "Bedroom",      ar: "غرفة نوم" },
  { value: "living_room", en: "Living Room",  ar: "غرفة معيشة" },
  { value: "office",      en: "Office",       ar: "مكتب" },
  { value: "bathroom",    en: "Bathroom",     ar: "حمام" },
  { value: "reception",   en: "Reception",    ar: "ريسبشن" },
  { value: "custom",      en: "Custom",       ar: "مخصص" },
] as const;

const STYLES = [
  { value: "modern",      en: "Modern",       ar: "مودرن" },
  { value: "classic",     en: "Classic",      ar: "كلاسيك" },
  { value: "minimal",     en: "Minimal",      ar: "مينمال" },
  { value: "luxury",      en: "Luxury",       ar: "لاكجري" },
  { value: "neo_classic", en: "Neo Classic",  ar: "نيو كلاسيك" },
  { value: "industrial",  en: "Industrial",   ar: "إندستريال" },
  { value: "custom",      en: "Custom",       ar: "مخصص" },
] as const;

const FILE_TYPES = [
  { value: "technical_drawing", en: "Technical Drawing", ar: "رسم فني" },
  { value: "3d_render",         en: "3D Render",         ar: "رندر ثلاثي الأبعاد" },
  { value: "floor_plan",        en: "Floor Plan",        ar: "مسقط أفقي" },
  { value: "elevation",         en: "Elevation",         ar: "واجهة" },
  { value: "detail",            en: "Detail Drawing",    ar: "رسم تفصيلي" },
  { value: "reference",         en: "Reference",         ar: "مرجع" },
  { value: "revision",          en: "Revision",          ar: "تعديل" },
  { value: "client_approved",   en: "Client Approved",   ar: "معتمد من العميل" },
] as const;

const COMMENT_TYPES = [
  { value: "general",          en: "Comment",          ar: "تعليق" },
  { value: "revision_request", en: "Revision Request", ar: "طلب تعديل" },
  { value: "approval",         en: "Approval",         ar: "اعتماد" },
  { value: "annotation",       en: "Annotation",       ar: "ملاحظة فنية" },
  { value: "question",         en: "Question",         ar: "سؤال" },
] as const;

const AUTHOR_ROLES = [
  { value: "designer",   en: "Designer",   ar: "المصمم" },
  { value: "manager",    en: "Manager",    ar: "المدير" },
  { value: "client",     en: "Client",     ar: "العميل" },
  { value: "technician", en: "Technician", ar: "الفني" },
] as const;

// ─── Helpers ──────────────────────────────────────────────

const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium px-5 hover:opacity-90 transition-opacity disabled:opacity-40";
const inputCls = "w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20";
const labelCls = "text-[11.5px] text-muted-foreground font-medium mb-1 block";

function genBriefNumber(): string {
  const d = new Date();
  const seq = Math.floor(Math.random() * 9000) + 1000;
  return `DB-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}-${seq}`;
}

async function logActivity(workspaceId: string, type: string, entityType: string, entityId: string, descEn: string, descAr: string) {
  const ds = getDataSource();
  try {
    await ds.activity_events.create(workspaceId, {
      workspace_id: workspaceId, event_type: type, entity_type: entityType,
      entity_id: entityId, description_en: descEn, description_ar: descAr, metadata: {},
    } as any);
  } catch { /* non-critical */ }
}

// ─── Create / Edit Brief Modal ────────────────────────────

interface BriefForm {
  briefNumber: string; title: string; salesOrderId: string; siteVisitId: string;
  customerId: string; customerName: string; assignedDesigner: string;
  designType: string; style: string;
  preferredColors: string; preferredMaterials: string; specialNotes: string;
  startDate: string; dueDate: string;
}

function emptyForm(): BriefForm {
  return {
    briefNumber: genBriefNumber(), title: "", salesOrderId: "", siteVisitId: "",
    customerId: "", customerName: "", assignedDesigner: "",
    designType: "custom", style: "",
    preferredColors: "", preferredMaterials: "", specialNotes: "",
    startDate: new Date().toISOString().slice(0, 10), dueDate: "",
  };
}

function BriefModal({ onClose, onSaved, orgs, orders, visits, editBrief, ar, workspaceId }: {
  onClose: () => void; onSaved: () => void;
  orgs: Org[]; orders: WorkItem[]; visits: SiteVisit[];
  editBrief: DesignBrief | null; ar: boolean; workspaceId: string;
}) {
  const [form, setForm] = useState<BriefForm>(() => {
    if (editBrief) return {
      briefNumber: editBrief.brief_number, title: editBrief.title,
      salesOrderId: editBrief.sales_order_id || "", siteVisitId: editBrief.site_visit_id || "",
      customerId: editBrief.customer_id || "", customerName: editBrief.customer_name || "",
      assignedDesigner: editBrief.assigned_designer || "",
      designType: editBrief.design_type || "custom", style: editBrief.style || "",
      preferredColors: editBrief.preferred_colors || "", preferredMaterials: editBrief.preferred_materials || "",
      specialNotes: editBrief.special_notes || "",
      startDate: editBrief.start_date || "", dueDate: editBrief.due_date || "",
    };
    return emptyForm();
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof BriefForm, v: string) => setForm((p) => ({ ...p, [k]: v }));

  // Auto-fill from site visit
  async function handleVisitSelect(visitId: string) {
    set("siteVisitId", visitId);
    if (!visitId) return;
    const visit = visits.find((v) => v.id === visitId);
    if (visit) {
      if (visit.customer_name && !form.customerName) set("customerName", visit.customer_name);
      if (visit.customer_id && !form.customerId) set("customerId", visit.customer_id);
      if (visit.sales_order_id && !form.salesOrderId) set("salesOrderId", visit.sales_order_id);
      if (visit.preferred_colors) set("preferredColors", visit.preferred_colors);
      if (visit.preferred_materials) set("preferredMaterials", visit.preferred_materials);
      if (visit.preferred_style) set("style", visit.preferred_style);
      if (visit.special_notes) set("specialNotes", visit.special_notes);
      // Load measurements as dimensions summary
      const ds = getDataSource();
      const meas = await ds.measurements.list(workspaceId, { site_visit_id: visitId }) as Measurement[];
      if (meas.length > 0 && !form.title) {
        set("title", `${visit.customer_name || visit.visit_number} — ${meas.map(m => m.room_name).filter((v, i, a) => a.indexOf(v) === i).join(", ")}`);
      }
    }
  }

  async function handleSubmit() {
    if (!form.briefNumber.trim() || !form.title.trim()) {
      setError(ar ? "رقم التصميم والعنوان مطلوبين" : "Brief number and title required"); return;
    }
    setLoading(true); setError("");
    const ds = getDataSource();

    // Build dimensions summary from site visit measurements
    let dimSummary: any[] = [];
    if (form.siteVisitId) {
      const meas = await ds.measurements.list(workspaceId, { site_visit_id: form.siteVisitId }) as Measurement[];
      dimSummary = meas.map(m => ({
        room: m.room_name, label: m.label, type: m.room_type,
        width: m.width, height: m.height, depth: m.depth, length: m.length,
        ceiling_height: m.ceiling_height, approval: m.approval_status,
      }));
    }

    const payload: any = {
      workspace_id: workspaceId,
      brief_number: form.briefNumber.trim(), title: form.title.trim(),
      sales_order_id: form.salesOrderId || null, site_visit_id: form.siteVisitId || null,
      customer_id: form.customerId || null,
      customer_name: form.customerName || (orgs.find(o => o.id === form.customerId)?.name_en) || null,
      assigned_designer: form.assignedDesigner || null,
      design_type: form.designType || "custom", style: form.style || null,
      dimensions_summary: dimSummary, preferred_colors: form.preferredColors || null,
      preferred_materials: form.preferredMaterials || null, special_notes: form.specialNotes || null,
      start_date: form.startDate || null, due_date: form.dueDate || null,
      status: editBrief ? undefined : "draft",
    };
    try {
      if (editBrief) {
        await ds.design_briefs.update(workspaceId, editBrief.id, payload);
      } else {
        await ds.design_briefs.create(workspaceId, payload);
        await logActivity(workspaceId, "design_created", "design_brief", payload.brief_number,
          `Design brief ${payload.brief_number} created`, `تم إنشاء ملف التصميم ${payload.brief_number}`);
      }
      onSaved();
    } catch (e: any) { setError(e.message || "Error"); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background rounded-2xl border border-border/60 shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-border/40 shrink-0 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>
            {editBrief ? (ar ? "تعديل التصميم" : "Edit Design Brief") : (ar ? "ملف تصميم جديد" : "New Design Brief")}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>{ar ? "رقم التصميم" : "Brief Number"}</label>
              <input className={inputCls} value={form.briefNumber} onChange={e => set("briefNumber", e.target.value)} /></div>
            <div><label className={labelCls}>{ar ? "النوع" : "Design Type"}</label>
              <select className={inputCls} value={form.designType} onChange={e => set("designType", e.target.value)}>
                {DESIGN_TYPES.map(t => <option key={t.value} value={t.value}>{ar ? t.ar : t.en}</option>)}
              </select></div>
          </div>
          <div><label className={labelCls}>{ar ? "العنوان" : "Title"}</label>
            <input className={inputCls} value={form.title} onChange={e => set("title", e.target.value)} placeholder={ar ? "مثال: مطبخ فيلا المعادي" : "e.g. Villa Maadi Kitchen"} /></div>
          <div><label className={labelCls}>{ar ? "المعاينة (لسحب المقاسات والمتطلبات)" : "Site Visit (auto-fills measurements & requirements)"}</label>
            <select className={inputCls} value={form.siteVisitId} onChange={e => handleVisitSelect(e.target.value)}>
              <option value="">{ar ? "— اختر المعاينة —" : "— Select Visit —"}</option>
              {visits.filter(v => v.status === "completed").map(v => (
                <option key={v.id} value={v.id}>{v.visit_number} — {v.customer_name || "—"}</option>
              ))}
            </select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>{ar ? "العميل" : "Customer"}</label>
              <select className={inputCls} value={form.customerId} onChange={e => { set("customerId", e.target.value); set("customerName", orgs.find(o => o.id === e.target.value)?.name_en || ""); }}>
                <option value="">{ar ? "— اختر —" : "— Select —"}</option>
                {orgs.map(o => <option key={o.id} value={o.id}>{ar ? (o.name_ar || o.name_en) : o.name_en}</option>)}
              </select></div>
            <div><label className={labelCls}>{ar ? "طلب العميل" : "Sales Order"}</label>
              <select className={inputCls} value={form.salesOrderId} onChange={e => set("salesOrderId", e.target.value)}>
                <option value="">{ar ? "— اختر —" : "— Select —"}</option>
                {orders.map(o => { const m = (o.metadata as any) || {}; return <option key={o.id} value={o.id}>{m.so_number || o.title_en}</option>; })}
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>{ar ? "المصمم" : "Assigned Designer"}</label>
              <input className={inputCls} value={form.assignedDesigner} onChange={e => set("assignedDesigner", e.target.value)} /></div>
            <div><label className={labelCls}>{ar ? "الستايل" : "Style"}</label>
              <select className={inputCls} value={form.style} onChange={e => set("style", e.target.value)}>
                <option value="">{ar ? "— اختر —" : "— Select —"}</option>
                {STYLES.map(s => <option key={s.value} value={s.value}>{ar ? s.ar : s.en}</option>)}
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>{ar ? "تاريخ البدء" : "Start Date"}</label>
              <input type="date" className={inputCls} value={form.startDate} onChange={e => set("startDate", e.target.value)} /></div>
            <div><label className={labelCls}>{ar ? "تاريخ التسليم" : "Due Date"}</label>
              <input type="date" className={inputCls} value={form.dueDate} onChange={e => set("dueDate", e.target.value)} /></div>
          </div>
          <div><label className={labelCls}>{ar ? "الألوان" : "Colors"}</label>
            <input className={inputCls} value={form.preferredColors} onChange={e => set("preferredColors", e.target.value)} /></div>
          <div><label className={labelCls}>{ar ? "الخامات" : "Materials"}</label>
            <input className={inputCls} value={form.preferredMaterials} onChange={e => set("preferredMaterials", e.target.value)} /></div>
          <div><label className={labelCls}>{ar ? "ملاحظات" : "Notes"}</label>
            <textarea className={inputCls + " h-20 py-2 resize-none"} value={form.specialNotes} onChange={e => set("specialNotes", e.target.value)} /></div>
          {error && <p className="text-[12px] text-rose-500 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
        </div>
        <div className="px-6 py-4 border-t border-border/40 shrink-0 flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border/60 text-[13px] font-medium hover:bg-muted/50">{ar ? "إلغاء" : "Cancel"}</button>
          <button onClick={handleSubmit} disabled={loading || !form.briefNumber.trim() || !form.title.trim()} className={btnPrimary + " flex-1 h-10"}>
            {loading && <Loader2 size={12} className="animate-spin" />} {editBrief ? (ar ? "حفظ" : "Save") : (ar ? "أنشئ التصميم" : "Create Brief")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Brief Detail Panel ───────────────────────────────────

function BriefDetail({ brief, onBack, ar, workspaceId, orders, onRefresh }: {
  brief: DesignBrief; onBack: () => void; ar: boolean;
  workspaceId: string; orders: WorkItem[]; onRefresh: () => void;
}) {
  const [files, setFiles] = useState<DesignFile[]>([]);
  const [comments, setComments] = useState<DesignComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editBrief, setEditBrief] = useState(false);
  const [tab, setTab] = useState<"drawings" | "dimensions" | "comments" | "history">("drawings");
  const fileRef = useRef<HTMLInputElement>(null);

  // Comment form
  const [commentText, setCommentText] = useState("");
  const [commentType, setCommentType] = useState("general");
  const [commentRole, setCommentRole] = useState("designer");
  const [commentAuthor, setCommentAuthor] = useState("");

  // Upload file type
  const [uploadFileType, setUploadFileType] = useState("technical_drawing");

  async function loadData() {
    const ds = getDataSource();
    const [f, c] = await Promise.all([
      ds.design_files.list(workspaceId, { design_brief_id: brief.id }),
      ds.design_comments.list(workspaceId, { design_brief_id: brief.id }),
    ]);
    setFiles(f as DesignFile[]);
    setComments(c as DesignComment[]);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [brief.id]);

  async function updateStatus(status: string) {
    const ds = getDataSource();
    const payload: any = { status };
    if (status === "approved") {
      payload.approved_at = new Date().toISOString();
      payload.completed_date = new Date().toISOString().slice(0, 10);
    }
    if (status === "in_progress" && !brief.start_date) {
      payload.start_date = new Date().toISOString().slice(0, 10);
    }
    await ds.design_briefs.update(workspaceId, brief.id, payload);

    // Activity & SO integration
    if (status === "approved") {
      await logActivity(workspaceId, "design_approved", "design_brief", brief.id,
        `Design ${brief.brief_number} approved by client`, `تم اعتماد التصميم ${brief.brief_number} من العميل`);
      if (brief.sales_order_id) {
        const so = orders.find(o => o.id === brief.sales_order_id);
        if (so) {
          const meta = { ...(so.metadata as any || {}), design_approved: true, design_status: "approved" };
          await ds.work_items.update(workspaceId, so.id, { metadata: meta } as any);
        }
      }
    }
    if (status === "revision") {
      await logActivity(workspaceId, "design_revision", "design_brief", brief.id,
        `Design ${brief.brief_number} sent for revision`, `التصميم ${brief.brief_number} محتاج تعديل`);
    }
    if (status === "client_review") {
      await logActivity(workspaceId, "design_client_review", "design_brief", brief.id,
        `Design ${brief.brief_number} sent to client for review`, `تم إرسال التصميم ${brief.brief_number} للعميل للمراجعة`);
    }
    onRefresh();
  }

  async function incrementVersion() {
    const ds = getDataSource();
    await ds.design_briefs.update(workspaceId, brief.id, {
      version: brief.version + 1, status: "in_progress", revision_notes: null,
    } as any);
    await logActivity(workspaceId, "design_new_version", "design_brief", brief.id,
      `Design ${brief.brief_number} v${brief.version + 1} started`, `تم بدء النسخة ${brief.version + 1} للتصميم ${brief.brief_number}`);
    onRefresh();
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const inputFiles = e.target.files;
    if (!inputFiles || !supabase) return;
    const ds = getDataSource();
    for (const file of Array.from(inputFiles)) {
      const path = `${workspaceId}/${brief.id}/${Date.now()}-${file.name}`;
      const { data } = await supabase.storage.from("design-files").upload(path, file);
      if (data) {
        const { data: urlData } = supabase.storage.from("design-files").getPublicUrl(data.path);
        const ext = file.name.split(".").pop()?.toLowerCase() || "";
        await ds.design_files.create(workspaceId, {
          workspace_id: workspaceId, design_brief_id: brief.id,
          file_url: urlData.publicUrl, file_name: file.name,
          file_type: uploadFileType as any, file_format: ext,
          file_size: file.size, version: brief.version,
          metadata: {},
        } as any);
      }
    }
    loadData();
    if (fileRef.current) fileRef.current.value = "";
  }

  async function deleteFile(fileId: string) {
    const ds = getDataSource();
    await ds.design_files.remove(workspaceId, fileId);
    loadData();
  }

  async function addComment() {
    if (!commentText.trim() || !commentAuthor.trim()) return;
    const ds = getDataSource();
    await ds.design_comments.create(workspaceId, {
      workspace_id: workspaceId, design_brief_id: brief.id,
      author_name: commentAuthor.trim(), author_role: commentRole as any,
      comment: commentText.trim(), comment_type: commentType as any,
      resolved: false, metadata: {},
    } as any);
    setCommentText(""); setCommentAuthor("");
    loadData();
  }

  async function toggleResolve(commentId: string, current: boolean) {
    const ds = getDataSource();
    await ds.design_comments.update(workspaceId, commentId, { resolved: !current } as any);
    loadData();
  }

  const st = DESIGN_STATUSES.find(s => s.value === brief.status)!;
  const typeDef = DESIGN_TYPES.find(t => t.value === brief.design_type);
  const styleDef = STYLES.find(s => s.value === brief.style);
  const dims: any[] = Array.isArray(brief.dimensions_summary) ? brief.dimensions_summary as any[] : [];
  const linkedOrder = orders.find(o => o.id === brief.sales_order_id);
  const linkedMeta = linkedOrder ? (linkedOrder.metadata as any || {}) : null;

  const filesByVersion = useMemo(() => {
    const groups: Record<number, DesignFile[]> = {};
    files.forEach(f => {
      const v = f.version || 1;
      if (!groups[v]) groups[v] = [];
      groups[v].push(f);
    });
    return groups;
  }, [files]);

  const unresolvedComments = comments.filter(c => !c.resolved).length;

  const detailTabs = [
    { id: "drawings" as const, en: "Drawings", ar: "الرسومات", icon: PenTool },
    { id: "dimensions" as const, en: "Dimensions", ar: "المقاسات", icon: Ruler },
    { id: "comments" as const, en: `Comments${unresolvedComments ? ` (${unresolvedComments})` : ""}`, ar: `التعليقات${unresolvedComments ? ` (${unresolvedComments})` : ""}`, icon: MessageSquare },
    { id: "history" as const, en: "Versions", ar: "النُسخ", icon: GitBranch },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-muted/50"><ChevronRight size={16} className="rotate-180" /></button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[11px] font-mono text-muted-foreground">{brief.brief_number}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.pill}`}>{ar ? st.ar : st.en}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">v{brief.version}</span>
            {typeDef && <span className="text-[10px] text-muted-foreground">{ar ? typeDef.ar : typeDef.en}</span>}
          </div>
          <h2 className="text-[18px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>{brief.title}</h2>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
            {brief.customer_name && <span className="flex items-center gap-1"><Building2 size={10} />{brief.customer_name}</span>}
            {brief.assigned_designer && <span className="flex items-center gap-1"><User size={10} />{brief.assigned_designer}</span>}
            {styleDef && <span className="flex items-center gap-1"><Palette size={10} />{ar ? styleDef.ar : styleDef.en}</span>}
            {linkedMeta?.so_number && <span className="flex items-center gap-1"><FileText size={10} />{linkedMeta.so_number}</span>}
            {brief.due_date && <span className="flex items-center gap-1"><Calendar size={10} />{brief.due_date}</span>}
          </div>
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap">
          {brief.status === "draft" && <button onClick={() => updateStatus("in_progress")} className="text-[11px] text-blue-600 font-medium hover:opacity-70 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-blue-200"><PenTool size={11} /> {ar ? "ابدأ التصميم" : "Start Design"}</button>}
          {brief.status === "in_progress" && <button onClick={() => updateStatus("internal_review")} className="text-[11px] text-violet-600 font-medium hover:opacity-70 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-violet-200"><Eye size={11} /> {ar ? "مراجعة داخلية" : "Internal Review"}</button>}
          {brief.status === "internal_review" && <button onClick={() => updateStatus("client_review")} className="text-[11px] text-amber-600 font-medium hover:opacity-70 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-200"><Send size={11} /> {ar ? "أرسل للعميل" : "Send to Client"}</button>}
          {brief.status === "client_review" && (
            <>
              <button onClick={() => updateStatus("approved")} className="text-[11px] text-emerald-600 font-medium hover:opacity-70 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-200"><CheckCircle2 size={11} /> {ar ? "العميل وافق" : "Client Approved"}</button>
              <button onClick={() => updateStatus("revision")} className="text-[11px] text-orange-600 font-medium hover:opacity-70 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-orange-200"><RotateCcw size={11} /> {ar ? "تعديلات" : "Revision"}</button>
            </>
          )}
          {brief.status === "revision" && <button onClick={incrementVersion} className="text-[11px] text-blue-600 font-medium hover:opacity-70 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-blue-200"><GitBranch size={11} /> {ar ? "نسخة جديدة" : "New Version"}</button>}
          <button onClick={() => setEditBrief(true)} className="text-[11px] text-muted-foreground font-medium hover:opacity-70 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border/60"><Edit3 size={11} /> {ar ? "تعديل" : "Edit"}</button>
        </div>
      </div>

      {/* Requirements summary */}
      {(brief.preferred_colors || brief.preferred_materials) && (
        <div className="flex gap-3 mb-5 flex-wrap">
          {brief.preferred_colors && <span className="text-[11px] bg-muted/30 border border-border/30 rounded-lg px-3 py-1.5"><Palette size={10} className="inline mr-1 text-muted-foreground" />{brief.preferred_colors}</span>}
          {brief.preferred_materials && <span className="text-[11px] bg-muted/30 border border-border/30 rounded-lg px-3 py-1.5"><Layers size={10} className="inline mr-1 text-muted-foreground" />{brief.preferred_materials}</span>}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-border/30 pb-3">
        {detailTabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-2 rounded-lg text-[12px] font-medium transition-colors flex items-center gap-1.5
              ${tab === t.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"}`}>
            <t.icon size={13} />{ar ? t.ar : t.en}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {/* ── Drawings Tab ── */}
          {tab === "drawings" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[14px] font-semibold">{ar ? "الرسومات الفنية" : "Technical Drawings"}</h3>
                <div className="flex items-center gap-2">
                  <select className="h-9 px-2 rounded-lg border border-border/60 text-[11px] bg-background" value={uploadFileType} onChange={e => setUploadFileType(e.target.value)}>
                    {FILE_TYPES.map(t => <option key={t.value} value={t.value}>{ar ? t.ar : t.en}</option>)}
                  </select>
                  <label className={btnPrimary + " h-9 text-[12px] cursor-pointer"}>
                    <Upload size={13} /> {ar ? "رفع" : "Upload"}
                    <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.dxf,.dwg" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
              </div>
              {files.length === 0 ? (
                <div className="py-12 text-center text-[13px] text-muted-foreground/50">{ar ? "مفيش رسومات لسه" : "No drawings yet"}</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {files.filter(f => f.version === brief.version).map(f => {
                    const ftDef = FILE_TYPES.find(t => t.value === f.file_type);
                    const isImage = ["png","jpg","jpeg","gif","webp","svg"].includes(f.file_format || "");
                    return (
                      <div key={f.id} className="border border-border/40 rounded-xl overflow-hidden group">
                        {isImage ? (
                          <img src={f.file_url} alt={f.file_name || ""} className="w-full h-36 object-cover" />
                        ) : (
                          <div className="w-full h-36 bg-muted/20 flex items-center justify-center">
                            <FileText size={28} className="text-muted-foreground/20" />
                          </div>
                        )}
                        <div className="px-3 py-2 flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-medium truncate">{f.file_name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {ftDef && <span className="text-[9px] text-muted-foreground">{ar ? ftDef.ar : ftDef.en}</span>}
                              <span className="text-[9px] text-muted-foreground/50">v{f.version}</span>
                              {f.file_format && <span className="text-[9px] text-muted-foreground/50 uppercase">{f.file_format}</span>}
                            </div>
                          </div>
                          <button onClick={() => deleteFile(f.id)} className="p-1 rounded hover:bg-rose-50 text-rose-400 opacity-0 group-hover:opacity-100"><Trash2 size={11} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Dimensions Tab ── */}
          {tab === "dimensions" && (
            <div>
              <h3 className="text-[14px] font-semibold mb-3">{ar ? "المقاسات من المعاينة" : "Dimensions from Site Visit"}</h3>
              {dims.length === 0 ? (
                <div className="py-12 text-center text-[13px] text-muted-foreground/50">{ar ? "مفيش مقاسات مربوطة" : "No dimensions linked"}</div>
              ) : (
                <div className="space-y-2">
                  {dims.map((d: any, i: number) => {
                    const rtDef = DESIGN_TYPES.find(t => t.value === d.type);
                    return (
                      <div key={i} className="px-4 py-3 bg-muted/10 border border-border/30 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[13px] font-medium">{d.room}</span>
                          {d.label && <span className="text-[11px] text-muted-foreground">— {d.label}</span>}
                          {rtDef && <span className="text-[9px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{ar ? rtDef.ar : rtDef.en}</span>}
                          {d.approval === "approved" && <CheckCircle2 size={11} className="text-emerald-500" />}
                        </div>
                        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                          {d.width != null && <span>{ar ? "عرض" : "W"}: {d.width} cm</span>}
                          {d.height != null && <span>{ar ? "ارتفاع" : "H"}: {d.height} cm</span>}
                          {d.depth != null && <span>{ar ? "عمق" : "D"}: {d.depth} cm</span>}
                          {d.length != null && <span>{ar ? "طول" : "L"}: {d.length} cm</span>}
                          {d.ceiling_height != null && <span>{ar ? "سقف" : "CH"}: {d.ceiling_height} cm</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Comments Tab ── */}
          {tab === "comments" && (
            <div>
              <h3 className="text-[14px] font-semibold mb-3">{ar ? "التعليقات والملاحظات" : "Comments & Annotations"}</h3>

              {/* Add comment form */}
              <div className="border border-border/40 rounded-xl p-4 mb-4 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div><label className={labelCls}>{ar ? "الاسم" : "Name"}</label>
                    <input className={inputCls + " h-9 text-[12px]"} value={commentAuthor} onChange={e => setCommentAuthor(e.target.value)} placeholder={ar ? "اسمك" : "Your name"} /></div>
                  <div><label className={labelCls}>{ar ? "الدور" : "Role"}</label>
                    <select className={inputCls + " h-9 text-[12px]"} value={commentRole} onChange={e => setCommentRole(e.target.value)}>
                      {AUTHOR_ROLES.map(r => <option key={r.value} value={r.value}>{ar ? r.ar : r.en}</option>)}
                    </select></div>
                  <div><label className={labelCls}>{ar ? "النوع" : "Type"}</label>
                    <select className={inputCls + " h-9 text-[12px]"} value={commentType} onChange={e => setCommentType(e.target.value)}>
                      {COMMENT_TYPES.map(t => <option key={t.value} value={t.value}>{ar ? t.ar : t.en}</option>)}
                    </select></div>
                </div>
                <div className="flex gap-2">
                  <textarea className={inputCls + " h-16 py-2 resize-none flex-1 text-[12px]"} value={commentText} onChange={e => setCommentText(e.target.value)} placeholder={ar ? "اكتب تعليقك..." : "Write your comment..."} />
                  <button onClick={addComment} disabled={!commentText.trim() || !commentAuthor.trim()} className={btnPrimary + " h-16 px-4"}><Send size={13} /></button>
                </div>
              </div>

              {/* Comments list */}
              {comments.length === 0 ? (
                <div className="py-8 text-center text-[13px] text-muted-foreground/50">{ar ? "مفيش تعليقات لسه" : "No comments yet"}</div>
              ) : (
                <div className="space-y-2">
                  {comments.map(c => {
                    const ctDef = COMMENT_TYPES.find(t => t.value === c.comment_type);
                    const arDef = AUTHOR_ROLES.find(r => r.value === c.author_role);
                    const typeColors: Record<string, string> = {
                      general: "border-l-zinc-300", revision_request: "border-l-orange-400",
                      approval: "border-l-emerald-400", annotation: "border-l-violet-400", question: "border-l-blue-400",
                    };
                    return (
                      <div key={c.id} className={`px-4 py-3 bg-muted/10 border border-border/30 rounded-xl border-l-4 ${typeColors[c.comment_type] || "border-l-zinc-300"} ${c.resolved ? "opacity-50" : ""}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[12px] font-medium">{c.author_name}</span>
                          {arDef && <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">{ar ? arDef.ar : arDef.en}</span>}
                          {ctDef && <span className="text-[9px] text-muted-foreground">{ar ? ctDef.ar : ctDef.en}</span>}
                          <span className="text-[9px] text-muted-foreground/50 ml-auto">{new Date(c.created_at).toLocaleDateString()}</span>
                          <button onClick={() => toggleResolve(c.id, c.resolved)} title={c.resolved ? "Unresolve" : "Resolve"}
                            className={`p-1 rounded ${c.resolved ? "text-emerald-500" : "text-muted-foreground/30 hover:text-emerald-500"}`}>
                            <CheckCircle2 size={12} />
                          </button>
                        </div>
                        <p className="text-[12px] text-foreground whitespace-pre-wrap">{c.comment}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Versions Tab ── */}
          {tab === "history" && (
            <div>
              <h3 className="text-[14px] font-semibold mb-3">{ar ? "تاريخ النُسخ" : "Version History"}</h3>
              <div className="space-y-4">
                {Object.entries(filesByVersion).sort(([a], [b]) => Number(b) - Number(a)).map(([ver, verFiles]) => (
                  <div key={ver} className="border border-border/40 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-muted/20 flex items-center gap-2 border-b border-border/30">
                      <GitBranch size={13} className="text-muted-foreground" />
                      <span className="text-[13px] font-medium">{ar ? "النسخة" : "Version"} {ver}</span>
                      {Number(ver) === brief.version && <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{ar ? "الحالية" : "Current"}</span>}
                      <span className="text-[10px] text-muted-foreground ml-auto">{verFiles.length} {ar ? "ملف" : "files"}</span>
                    </div>
                    <div className="divide-y divide-border/20">
                      {verFiles.map(f => {
                        const ftDef = FILE_TYPES.find(t => t.value === f.file_type);
                        return (
                          <div key={f.id} className="px-4 py-2.5 flex items-center gap-3">
                            <Paperclip size={12} className="text-muted-foreground/40 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11.5px] truncate">{f.file_name}</p>
                              <span className="text-[9px] text-muted-foreground">{ftDef ? (ar ? ftDef.ar : ftDef.en) : ""} • {f.file_format?.toUpperCase()}</span>
                            </div>
                            <span className="text-[9px] text-muted-foreground/50">{new Date(f.created_at).toLocaleDateString()}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {Object.keys(filesByVersion).length === 0 && (
                  <div className="py-8 text-center text-[13px] text-muted-foreground/50">{ar ? "مفيش ملفات لسه لإظهار التاريخ" : "No files uploaded yet to show history"}</div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit modal */}
      {editBrief && (
        <BriefModal onClose={() => setEditBrief(false)} onSaved={() => { setEditBrief(false); onRefresh(); }}
          orgs={[]} orders={orders} visits={[]} editBrief={brief} ar={ar} workspaceId={workspaceId} />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────

export default function Designs() {
  const { lang } = useLanguage();
  const { workspace } = useAuth();
  const ar = lang === "ar";

  const [loading, setLoading] = useState(true);
  const [briefs, setBriefs] = useState<DesignBrief[]>([]);
  const [orders, setOrders] = useState<WorkItem[]>([]);
  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState<DesignBrief | null>(null);

  async function loadAll() {
    const wid = workspace?.id || "demo";
    const ds = getDataSource();
    const [b, w, v, o] = await Promise.all([
      ds.design_briefs.list(wid),
      ds.work_items.list(wid, { type: "sales_order" }),
      ds.site_visits.list(wid),
      ds.organizations.list(wid),
    ]);
    setBriefs(b as DesignBrief[]);
    setOrders(w as WorkItem[]);
    setVisits(v as SiteVisit[]);
    setOrgs(o as Org[]);
    setLoading(false);
    if (selected) {
      const updated = (b as DesignBrief[]).find(d => d.id === selected.id);
      if (updated) setSelected(updated);
    }
  }

  useEffect(() => { loadAll(); }, [workspace?.id]);

  const filtered = useMemo(() => {
    let list = briefs;
    if (filterStatus !== "all") list = list.filter(b => b.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(b =>
        b.brief_number.toLowerCase().includes(q) ||
        b.title.toLowerCase().includes(q) ||
        (b.customer_name || "").toLowerCase().includes(q) ||
        (b.assigned_designer || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [briefs, filterStatus, search]);

  // Stats
  const drafts = briefs.filter(b => b.status === "draft").length;
  const inProgress = briefs.filter(b => ["in_progress", "internal_review"].includes(b.status)).length;
  const clientReview = briefs.filter(b => b.status === "client_review").length;
  const approved = briefs.filter(b => b.status === "approved").length;

  function handleExport() {
    const rows = briefs.map(b => ({
      brief_number: b.brief_number, title: b.title, customer_name: b.customer_name,
      design_type: b.design_type, style: b.style, status: b.status, version: b.version,
      assigned_designer: b.assigned_designer, start_date: b.start_date, due_date: b.due_date,
    }));
    exportCSV(rows, `thoth-design-briefs-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  if (selected) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <BriefDetail brief={selected} onBack={() => { setSelected(null); loadAll(); }} ar={ar} workspaceId={workspace?.id || ""} orders={orders} onRefresh={loadAll} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight" style={{ fontFamily: "var(--app-font-serif)" }}>
            {ar ? "التصميمات" : "Designs"}
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">{ar ? "ملفات التصميم والرسومات الفنية" : "Design Briefs & Technical Drawings"}</p>
        </div>
        <button onClick={() => setModal(true)} className={btnPrimary + " h-10"}><Plus size={14} /> {ar ? "تصميم جديد" : "New Design"}</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: ar ? "مسودات" : "Drafts", value: drafts, color: "text-zinc-600 bg-zinc-50" },
          { label: ar ? "جاري التصميم" : "In Progress", value: inProgress, color: "text-blue-600 bg-blue-50" },
          { label: ar ? "عند العميل" : "Client Review", value: clientReview, color: "text-amber-600 bg-amber-50" },
          { label: ar ? "معتمد" : "Approved", value: approved, color: "text-emerald-600 bg-emerald-50" },
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
          <input className={inputCls + " pl-9"} placeholder={ar ? "بحث..." : "Search..."} value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground"><X size={12} /></button>}
        </div>
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setFilterStatus("all")} className={`px-3 py-2 rounded-lg text-[11px] font-medium ${filterStatus === "all" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"}`}>{ar ? "الكل" : "All"}</button>
          {DESIGN_STATUSES.slice(0, -1).map(s => (
            <button key={s.value} onClick={() => setFilterStatus(s.value)} className={`px-3 py-2 rounded-lg text-[11px] font-medium ${filterStatus === s.value ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"}`}>{ar ? s.ar : s.en}</button>
          ))}
        </div>
        <button onClick={handleExport} className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground" title={ar ? "تصدير" : "Export"}><Download size={14} /></button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
      ) : briefs.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-4"><PenTool size={22} className="text-muted-foreground/30" /></div>
          <h3 className="text-[15px] font-semibold mb-1" style={{ fontFamily: "var(--app-font-serif)" }}>{ar ? "مفيش تصميمات لسه" : "No designs yet"}</h3>
          <p className="text-[13px] text-muted-foreground">{ar ? "أنشئ أول ملف تصميم من معاينة مكتملة." : "Create your first design brief from a completed site visit."}</p>
          <button onClick={() => setModal(true)} className={btnPrimary + " h-10 mt-4"}><Plus size={14} /> {ar ? "تصميم جديد" : "New Design"}</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-[13px] text-muted-foreground/50">{ar ? "مفيش نتائج" : "No results"}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(b => {
            const st = DESIGN_STATUSES.find(s => s.value === b.status)!;
            const typeDef = DESIGN_TYPES.find(t => t.value === b.design_type);
            const styleDef = STYLES.find(s => s.value === b.style);
            const linkedOrder = orders.find(o => o.id === b.sales_order_id);
            const linkedMeta = linkedOrder ? (linkedOrder.metadata as any || {}) : null;
            const isOverdue = b.due_date && !["approved", "cancelled"].includes(b.status) && new Date(b.due_date) < new Date(new Date().toDateString());

            return (
              <button key={b.id} onClick={() => setSelected(b)}
                className="w-full text-left bg-background border border-border/40 rounded-xl p-5 hover:shadow-sm hover:border-border/70 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-[10.5px] font-mono text-muted-foreground">{b.brief_number}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.pill}`}>{ar ? st.ar : st.en}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">v{b.version}</span>
                      {isOverdue && <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-rose-100 text-rose-600">{ar ? "متأخر" : "Overdue"}</span>}
                    </div>
                    <p className="text-[15px] font-medium" style={{ fontFamily: "var(--app-font-serif)" }}>{b.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
                      {b.customer_name && <span className="flex items-center gap-1"><Building2 size={9} />{b.customer_name}</span>}
                      {b.assigned_designer && <span className="flex items-center gap-1"><User size={9} />{b.assigned_designer}</span>}
                      {typeDef && <span>{ar ? typeDef.ar : typeDef.en}</span>}
                      {styleDef && <span className="flex items-center gap-1"><Palette size={9} />{ar ? styleDef.ar : styleDef.en}</span>}
                      {linkedMeta?.so_number && <span className="flex items-center gap-1"><FileText size={9} />{linkedMeta.so_number}</span>}
                      {b.due_date && <span className="flex items-center gap-1"><Calendar size={9} />{b.due_date}</span>}
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground/30 shrink-0 mt-2" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <BriefModal onClose={() => setModal(false)} onSaved={() => { setModal(false); loadAll(); }}
          orgs={orgs} orders={orders} visits={visits} editBrief={null} ar={ar} workspaceId={workspace?.id || ""} />
      )}
    </div>
  );
}
