/**
 * Production Planning — تخطيط الإنتاج وأوامر التشغيل
 *
 * Approved Design → Production Order → Cutting → Edgebanding → Drilling →
 * Assembly → Finishing → QC → Packing → Ready
 *
 * Uses production_orders + cutting_list_items + production_stage_log tables.
 */

import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { getDataSource } from "../lib/data-source";
import { exportCSV } from "../lib/csv-export";
import type { Database } from "../lib/database.types";
import {
  Plus, Search, X, Loader2, AlertCircle, Download,
  CheckCircle2, Clock, ChevronRight, Calendar,
  Edit3, Trash2, FileText, Play, Pause, Check,
  User, Building2, Layers, Package, Scissors,
  Wrench, Box, Paintbrush, ClipboardCheck, Truck,
  AlertTriangle, ArrowRight, Timer, XCircle,
} from "lucide-react";

type ProdOrder = Database["public"]["Tables"]["production_orders"]["Row"];
type CuttingItem = Database["public"]["Tables"]["cutting_list_items"]["Row"];
type StageLog = Database["public"]["Tables"]["production_stage_log"]["Row"];
type WorkItem = Database["public"]["Tables"]["work_items"]["Row"];
type DesignBrief = Database["public"]["Tables"]["design_briefs"]["Row"];

// ─── Constants ────────────────────────────────────────────

const STAGES = [
  { value: "pending",       en: "Pending",       ar: "في الانتظار",    icon: Clock,          color: "bg-zinc-100 text-zinc-600" },
  { value: "cutting",       en: "Cutting",       ar: "التقطيع",       icon: Scissors,       color: "bg-blue-50 text-blue-600" },
  { value: "edgebanding",   en: "Edgebanding",   ar: "الكنار",        icon: Layers,         color: "bg-indigo-50 text-indigo-600" },
  { value: "drilling",      en: "Drilling",      ar: "التخريم",       icon: Wrench,         color: "bg-violet-50 text-violet-600" },
  { value: "assembly",      en: "Assembly",      ar: "التجميع",       icon: Box,            color: "bg-cyan-50 text-cyan-600" },
  { value: "finishing",     en: "Finishing",      ar: "الدهان/التشطيب", icon: Paintbrush,     color: "bg-amber-50 text-amber-600" },
  { value: "quality_check", en: "Quality Check",  ar: "مراقبة الجودة",  icon: ClipboardCheck, color: "bg-orange-50 text-orange-600" },
  { value: "packing",       en: "Packing",       ar: "التغليف",       icon: Package,        color: "bg-teal-50 text-teal-600" },
  { value: "ready",         en: "Ready",         ar: "جاهز للتسليم",   icon: CheckCircle2,   color: "bg-emerald-50 text-emerald-600" },
  { value: "delivered",     en: "Delivered",     ar: "تم التسليم",     icon: Truck,          color: "bg-emerald-100 text-emerald-700" },
  { value: "cancelled",     en: "Cancelled",     ar: "ملغي",          icon: XCircle,        color: "bg-rose-50 text-rose-600" },
] as const;

const PRIORITIES = [
  { value: "critical", en: "Critical", ar: "حرج",    color: "bg-rose-100 text-rose-700" },
  { value: "urgent",   en: "Urgent",   ar: "عاجل",   color: "bg-orange-100 text-orange-700" },
  { value: "high",     en: "High",     ar: "عالي",   color: "bg-amber-100 text-amber-700" },
  { value: "medium",   en: "Medium",   ar: "متوسط",  color: "bg-blue-100 text-blue-700" },
  { value: "low",      en: "Low",      ar: "منخفض",  color: "bg-zinc-100 text-zinc-600" },
] as const;

const GRAIN_DIRS = [
  { value: "horizontal", en: "Horizontal", ar: "أفقي" },
  { value: "vertical",   en: "Vertical",   ar: "رأسي" },
  { value: "none",       en: "None",       ar: "بدون" },
] as const;

// ─── Helpers ──────────────────────────────────────────────

const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium px-5 hover:opacity-90 transition-opacity disabled:opacity-40";
const inputCls = "w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20";
const labelCls = "text-[11.5px] text-muted-foreground font-medium mb-1 block";

function genPONumber(): string {
  const d = new Date();
  const seq = Math.floor(Math.random() * 9000) + 1000;
  return `PO-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}-${seq}`;
}

async function logActivity(wid: string, type: string, eid: string, en: string, ar: string) {
  const ds = getDataSource();
  try { await ds.activity_events.create(wid, { workspace_id: wid, event_type: type, entity_type: "production_order", entity_id: eid, description_en: en, description_ar: ar, metadata: {} } as any); } catch {}
}

// ─── Create / Edit PO Modal ───────────────────────────────

function POModal({ onClose, onSaved, orders, designs, editPO, ar, workspaceId }: {
  onClose: () => void; onSaved: () => void;
  orders: WorkItem[]; designs: DesignBrief[];
  editPO: ProdOrder | null; ar: boolean; workspaceId: string;
}) {
  const [poNumber, setPONumber] = useState(editPO?.po_number || genPONumber());
  const [title, setTitle] = useState(editPO?.title || "");
  const [salesOrderId, setSalesOrderId] = useState(editPO?.sales_order_id || "");
  const [designBriefId, setDesignBriefId] = useState(editPO?.design_brief_id || "");
  const [customerName, setCustomerName] = useState(editPO?.customer_name || "");
  const [assignedStation, setAssignedStation] = useState(editPO?.assigned_station || "");
  const [priority, setPriority] = useState(editPO?.priority || "medium");
  const [startDate, setStartDate] = useState(editPO?.start_date || "");
  const [dueDate, setDueDate] = useState(editPO?.due_date || "");
  const [notes, setNotes] = useState(editPO?.notes || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleDesignSelect(did: string) {
    setDesignBriefId(did);
    const d = designs.find(x => x.id === did);
    if (d) {
      if (!title) setTitle(d.title);
      if (!customerName) setCustomerName(d.customer_name || "");
      if (d.sales_order_id && !salesOrderId) setSalesOrderId(d.sales_order_id);
    }
  }

  async function handleSubmit() {
    if (!poNumber.trim() || !title.trim()) { setError(ar ? "الرقم والعنوان مطلوبين" : "Number and title required"); return; }
    setLoading(true); setError("");
    const ds = getDataSource();
    const payload: any = {
      workspace_id: workspaceId, po_number: poNumber.trim(), title: title.trim(),
      sales_order_id: salesOrderId || null, design_brief_id: designBriefId || null,
      customer_name: customerName || null, assigned_station: assignedStation || null,
      priority, start_date: startDate || null, due_date: dueDate || null,
      notes: notes || null, status: editPO ? undefined : "pending",
    };
    try {
      if (editPO) {
        await ds.production_orders.update(workspaceId, editPO.id, payload);
      } else {
        const created = await ds.production_orders.create(workspaceId, payload);
        // Auto-create stage log entries
        if (created) {
          const stageNames = ["cutting","edgebanding","drilling","assembly","finishing","quality_check","packing"];
          for (const stage of stageNames) {
            await ds.production_stage_log.create(workspaceId, {
              workspace_id: workspaceId, production_order_id: created.id,
              stage, status: "pending", metadata: {},
            } as any);
          }
        }
        await logActivity(workspaceId, "production_created", payload.po_number,
          `Production order ${payload.po_number} created`, `تم إنشاء أمر التشغيل ${payload.po_number}`);
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
            {editPO ? (ar ? "تعديل أمر التشغيل" : "Edit Production Order") : (ar ? "أمر تشغيل جديد" : "New Production Order")}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>{ar ? "رقم أمر التشغيل" : "PO Number"}</label>
              <input className={inputCls} value={poNumber} onChange={e => setPONumber(e.target.value)} /></div>
            <div><label className={labelCls}>{ar ? "الأولوية" : "Priority"}</label>
              <select className={inputCls} value={priority} onChange={e => setPriority(e.target.value as never)}>
                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{ar ? p.ar : p.en}</option>)}
              </select></div>
          </div>
          <div><label className={labelCls}>{ar ? "العنوان" : "Title"}</label>
            <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder={ar ? "مثال: مطبخ فيلا المعادي" : "e.g. Villa Maadi Kitchen"} /></div>
          <div><label className={labelCls}>{ar ? "ملف التصميم (لسحب البيانات)" : "Design Brief (auto-fills)"}</label>
            <select className={inputCls} value={designBriefId} onChange={e => handleDesignSelect(e.target.value)}>
              <option value="">{ar ? "— اختر —" : "— Select —"}</option>
              {designs.filter(d => d.status === "approved").map(d => (
                <option key={d.id} value={d.id}>{d.brief_number} — {d.title}</option>
              ))}
            </select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>{ar ? "العميل" : "Customer"}</label>
              <input className={inputCls} value={customerName} onChange={e => setCustomerName(e.target.value)} /></div>
            <div><label className={labelCls}>{ar ? "طلب العميل" : "Sales Order"}</label>
              <select className={inputCls} value={salesOrderId} onChange={e => setSalesOrderId(e.target.value)}>
                <option value="">{ar ? "— اختر —" : "— Select —"}</option>
                {orders.map(o => { const m = (o.metadata as any) || {}; return <option key={o.id} value={o.id}>{m.so_number || o.title_en}</option>; })}
              </select></div>
          </div>
          <div><label className={labelCls}>{ar ? "المحطة / الورشة" : "Station / Workshop"}</label>
            <input className={inputCls} value={assignedStation} onChange={e => setAssignedStation(e.target.value)} placeholder={ar ? "مثال: ورشة 1" : "e.g. Workshop 1"} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>{ar ? "تاريخ البدء" : "Start Date"}</label>
              <input type="date" className={inputCls} value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
            <div><label className={labelCls}>{ar ? "تاريخ التسليم" : "Due Date"}</label>
              <input type="date" className={inputCls} value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
          </div>
          <div><label className={labelCls}>{ar ? "ملاحظات" : "Notes"}</label>
            <textarea className={inputCls + " h-16 py-2 resize-none"} value={notes} onChange={e => setNotes(e.target.value)} /></div>
          {error && <p className="text-[12px] text-rose-500 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
        </div>
        <div className="px-6 py-4 border-t border-border/40 shrink-0 flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border/60 text-[13px] font-medium hover:bg-muted/50">{ar ? "إلغاء" : "Cancel"}</button>
          <button onClick={handleSubmit} disabled={loading || !poNumber.trim() || !title.trim()} className={btnPrimary + " flex-1 h-10"}>
            {loading && <Loader2 size={12} className="animate-spin" />} {editPO ? (ar ? "حفظ" : "Save") : (ar ? "أنشئ الأمر" : "Create Order")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Cutting List Modal ───────────────────────────────────

function CuttingModal({ onClose, onSaved, poId, editItem, ar, workspaceId }: {
  onClose: () => void; onSaved: () => void;
  poId: string; editItem: CuttingItem | null; ar: boolean; workspaceId: string;
}) {
  const [partName, setPartName] = useState(editItem?.part_name || "");
  const [material, setMaterial] = useState(editItem?.material || "");
  const [thickness, setThickness] = useState(editItem?.thickness?.toString() || "");
  const [width, setWidth] = useState(editItem?.width?.toString() || "");
  const [length, setLength] = useState(editItem?.length?.toString() || "");
  const [qty, setQty] = useState(editItem?.qty?.toString() || "1");
  const [edgeTop, setEdgeTop] = useState(editItem?.edge_top || "");
  const [edgeBottom, setEdgeBottom] = useState(editItem?.edge_bottom || "");
  const [edgeLeft, setEdgeLeft] = useState(editItem?.edge_left || "");
  const [edgeRight, setEdgeRight] = useState(editItem?.edge_right || "");
  const [grain, setGrain] = useState(editItem?.grain_direction || "none");
  const [cnc, setCnc] = useState(editItem?.cnc_program || "");
  const [notes, setNotes] = useState(editItem?.notes || "");
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!partName.trim()) return;
    setLoading(true);
    const ds = getDataSource();
    const payload: any = {
      workspace_id: workspaceId, production_order_id: poId,
      part_name: partName.trim(), material: material || null,
      thickness: thickness ? parseFloat(thickness) : null,
      width: width ? parseFloat(width) : null, length: length ? parseFloat(length) : null,
      qty: parseInt(qty) || 1,
      edge_top: edgeTop || null, edge_bottom: edgeBottom || null,
      edge_left: edgeLeft || null, edge_right: edgeRight || null,
      grain_direction: grain || "none", cnc_program: cnc || null,
      notes: notes || null, completed: editItem ? undefined : false,
    };
    if (editItem) await ds.cutting_list_items.update(workspaceId, editItem.id, payload);
    else await ds.cutting_list_items.create(workspaceId, payload);
    setLoading(false); onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background rounded-2xl border border-border/60 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-border/40 shrink-0 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>
            {editItem ? (ar ? "تعديل قطعة" : "Edit Piece") : (ar ? "قطعة جديدة" : "New Cutting Piece")}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>{ar ? "اسم القطعة" : "Part Name"}</label>
              <input className={inputCls} value={partName} onChange={e => setPartName(e.target.value)} placeholder={ar ? "مثال: باب علوي" : "e.g. Upper Door"} /></div>
            <div><label className={labelCls}>{ar ? "الخامة" : "Material"}</label>
              <input className={inputCls} value={material} onChange={e => setMaterial(e.target.value)} placeholder="MDF 18mm" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className={labelCls}>{ar ? "السُمك" : "Thickness"}</label>
              <input type="number" className={inputCls} value={thickness} onChange={e => setThickness(e.target.value)} /></div>
            <div><label className={labelCls}>{ar ? "العرض" : "Width"}</label>
              <input type="number" className={inputCls} value={width} onChange={e => setWidth(e.target.value)} /></div>
            <div><label className={labelCls}>{ar ? "الطول" : "Length"}</label>
              <input type="number" className={inputCls} value={length} onChange={e => setLength(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>{ar ? "الكمية" : "Qty"}</label>
              <input type="number" className={inputCls} value={qty} onChange={e => setQty(e.target.value)} /></div>
            <div><label className={labelCls}>{ar ? "اتجاه الألياف" : "Grain"}</label>
              <select className={inputCls} value={grain} onChange={e => setGrain(e.target.value as never)}>
                {GRAIN_DIRS.map(g => <option key={g.value} value={g.value}>{ar ? g.ar : g.en}</option>)}
              </select></div>
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">{ar ? "الكنار (حواف)" : "Edge Banding"}</p>
          <div className="grid grid-cols-4 gap-2">
            <div><label className={labelCls}>{ar ? "أعلى" : "Top"}</label><input className={inputCls + " text-[11px]"} value={edgeTop} onChange={e => setEdgeTop(e.target.value)} /></div>
            <div><label className={labelCls}>{ar ? "أسفل" : "Bottom"}</label><input className={inputCls + " text-[11px]"} value={edgeBottom} onChange={e => setEdgeBottom(e.target.value)} /></div>
            <div><label className={labelCls}>{ar ? "يسار" : "Left"}</label><input className={inputCls + " text-[11px]"} value={edgeLeft} onChange={e => setEdgeLeft(e.target.value)} /></div>
            <div><label className={labelCls}>{ar ? "يمين" : "Right"}</label><input className={inputCls + " text-[11px]"} value={edgeRight} onChange={e => setEdgeRight(e.target.value)} /></div>
          </div>
          <div><label className={labelCls}>{ar ? "برنامج CNC" : "CNC Program"}</label>
            <input className={inputCls} value={cnc} onChange={e => setCnc(e.target.value)} /></div>
          <div><label className={labelCls}>{ar ? "ملاحظات" : "Notes"}</label>
            <textarea className={inputCls + " h-14 py-2 resize-none"} value={notes} onChange={e => setNotes(e.target.value)} /></div>
        </div>
        <div className="px-6 py-4 border-t border-border/40 shrink-0 flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border/60 text-[13px] font-medium hover:bg-muted/50">{ar ? "إلغاء" : "Cancel"}</button>
          <button onClick={handleSave} disabled={loading || !partName.trim()} className={btnPrimary + " flex-1 h-10"}>
            {loading && <Loader2 size={12} className="animate-spin" />} {ar ? "حفظ" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PO Detail ────────────────────────────────────────────

function PODetail({ po, onBack, ar, workspaceId, orders, onRefresh }: {
  po: ProdOrder; onBack: () => void; ar: boolean;
  workspaceId: string; orders: WorkItem[]; onRefresh: () => void;
}) {
  const [cuttingList, setCuttingList] = useState<CuttingItem[]>([]);
  const [stageLog, setStageLog] = useState<StageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editPO, setEditPO] = useState(false);
  const [cutModal, setCutModal] = useState(false);
  const [editCut, setEditCut] = useState<CuttingItem | null>(null);
  const [tab, setTab] = useState<"stages" | "cutting" | "timeline">("stages");

  async function loadData() {
    const ds = getDataSource();
    const [c, s] = await Promise.all([
      ds.cutting_list_items.list(workspaceId, { production_order_id: po.id }),
      ds.production_stage_log.list(workspaceId, { production_order_id: po.id }),
    ]);
    setCuttingList(c as CuttingItem[]);
    setStageLog(s as StageLog[]);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [po.id]);

  // Stage progression
  const stageOrder = ["cutting","edgebanding","drilling","assembly","finishing","quality_check","packing"];

  async function advanceStage(stage: string, action: "start" | "complete") {
    const ds = getDataSource();
    const log = stageLog.find(s => s.stage === stage);
    if (!log) return;

    if (action === "start") {
      await ds.production_stage_log.update(workspaceId, log.id, {
        status: "in_progress", started_at: new Date().toISOString(),
      } as any);
      await ds.production_orders.update(workspaceId, po.id, {
        status: stage, current_stage: stage,
      } as any);
      await logActivity(workspaceId, "production_stage_started", po.id,
        `${po.po_number}: ${stage} started`, `${po.po_number}: بدأ ${stage}`);
    } else {
      const startedAt = log.started_at ? new Date(log.started_at) : new Date();
      const dur = Math.round((Date.now() - startedAt.getTime()) / 60000);
      await ds.production_stage_log.update(workspaceId, log.id, {
        status: "completed", completed_at: new Date().toISOString(), duration_minutes: dur,
      } as any);

      // Progress calculation
      const idx = stageOrder.indexOf(stage);
      const progress = Math.round(((idx + 1) / stageOrder.length) * 100);
      const isLast = idx === stageOrder.length - 1;

      await ds.production_orders.update(workspaceId, po.id, {
        progress, status: isLast ? "ready" : po.status,
        current_stage: isLast ? "ready" : po.current_stage,
        completed_date: isLast ? new Date().toISOString().slice(0, 10) : null,
      } as any);

      if (isLast) {
        await logActivity(workspaceId, "production_completed", po.id,
          `Production ${po.po_number} completed — ready for delivery`, `أمر التشغيل ${po.po_number} اكتمل — جاهز للتسليم`);
      }
    }
    onRefresh(); loadData();
  }

  async function toggleCuttingComplete(item: CuttingItem) {
    const ds = getDataSource();
    await ds.cutting_list_items.update(workspaceId, item.id, { completed: !item.completed } as any);
    loadData();
  }

  async function deleteCuttingItem(id: string) {
    const ds = getDataSource();
    await ds.cutting_list_items.remove(workspaceId, id);
    loadData();
  }

  const st = STAGES.find(s => s.value === po.status)!;
  const StIcon = st.icon;
  const priDef = PRIORITIES.find(p => p.value === po.priority)!;
  const linkedOrder = orders.find(o => o.id === po.sales_order_id);
  const linkedMeta = linkedOrder ? (linkedOrder.metadata as any || {}) : null;
  const completedCuts = cuttingList.filter(c => c.completed).length;
  const isOverdue = po.due_date && !["ready","delivered","cancelled"].includes(po.status) && new Date(po.due_date) < new Date(new Date().toDateString());

  // Sort stage log by stage order
  const sortedStages = stageOrder.map(s => stageLog.find(l => l.stage === s)).filter(Boolean) as StageLog[];

  const detailTabs = [
    { id: "stages" as const, en: "Production Line", ar: "خط الإنتاج", icon: Wrench },
    { id: "cutting" as const, en: `Cutting List (${cuttingList.length})`, ar: `التقطيع (${cuttingList.length})`, icon: Scissors },
    { id: "timeline" as const, en: "Timeline", ar: "الجدول الزمني", icon: Timer },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-muted/50"><ChevronRight size={16} className="rotate-180" /></button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[11px] font-mono text-muted-foreground">{po.po_number}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.color}`}>{ar ? st.ar : st.en}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priDef.color}`}>{ar ? priDef.ar : priDef.en}</span>
            {isOverdue && <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-rose-100 text-rose-600">{ar ? "متأخر" : "Overdue"}</span>}
          </div>
          <h2 className="text-[18px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>{po.title}</h2>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
            {po.customer_name && <span className="flex items-center gap-1"><Building2 size={10} />{po.customer_name}</span>}
            {po.assigned_station && <span className="flex items-center gap-1"><Wrench size={10} />{po.assigned_station}</span>}
            {linkedMeta?.so_number && <span className="flex items-center gap-1"><FileText size={10} />{linkedMeta.so_number}</span>}
            {po.due_date && <span className="flex items-center gap-1"><Calendar size={10} />{po.due_date}</span>}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${po.progress}%` }} />
            </div>
            <span className="text-[11px] font-medium tabular-nums">{po.progress}%</span>
          </div>
          <button onClick={() => setEditPO(true)} className="text-[11px] text-muted-foreground font-medium hover:opacity-70 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border/60"><Edit3 size={11} /> {ar ? "تعديل" : "Edit"}</button>
        </div>
      </div>

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
          {/* ── Production Stages Tab ── */}
          {tab === "stages" && (
            <div className="space-y-2">
              <h3 className="text-[14px] font-semibold mb-3">{ar ? "مراحل التصنيع" : "Production Stages"}</h3>
              {sortedStages.map((log, i) => {
                const stageDef = STAGES.find(s => s.value === log.stage);
                if (!stageDef) return null;
                const SIcon = stageDef.icon;
                const prevDone = i === 0 || sortedStages[i - 1]?.status === "completed";
                const canStart = log.status === "pending" && prevDone;
                const canComplete = log.status === "in_progress";

                return (
                  <div key={log.id} className={`flex items-center gap-4 px-4 py-3 border rounded-xl transition-all ${
                    log.status === "completed" ? "border-emerald-200 bg-emerald-50/30" :
                    log.status === "in_progress" ? "border-blue-200 bg-blue-50/30" :
                    "border-border/30 bg-muted/10"
                  }`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      log.status === "completed" ? "bg-emerald-100 text-emerald-600" :
                      log.status === "in_progress" ? "bg-blue-100 text-blue-600" :
                      "bg-muted text-muted-foreground/40"
                    }`}>
                      <SIcon size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium">{ar ? stageDef.ar : stageDef.en}</p>
                      <div className="flex items-center gap-3 text-[10.5px] text-muted-foreground mt-0.5">
                        {log.status === "completed" && log.duration_minutes != null && (
                          <span className="flex items-center gap-1"><Timer size={9} />{log.duration_minutes} {ar ? "دقيقة" : "min"}</span>
                        )}
                        {log.worker_name && <span className="flex items-center gap-1"><User size={9} />{log.worker_name}</span>}
                        {log.station && <span>{log.station}</span>}
                        {log.completed_at && <span>{new Date(log.completed_at).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      {log.status === "completed" && <CheckCircle2 size={16} className="text-emerald-500" />}
                      {canStart && (
                        <button onClick={() => advanceStage(log.stage, "start")}
                          className="text-[11px] text-blue-600 font-medium hover:opacity-70 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-blue-200">
                          <Play size={11} /> {ar ? "ابدأ" : "Start"}
                        </button>
                      )}
                      {canComplete && (
                        <button onClick={() => advanceStage(log.stage, "complete")}
                          className="text-[11px] text-emerald-600 font-medium hover:opacity-70 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-200">
                          <Check size={11} /> {ar ? "اكتمل" : "Done"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {sortedStages.length === 0 && (
                <p className="text-[12px] text-muted-foreground/50 py-8 text-center">{ar ? "مفيش مراحل" : "No stages"}</p>
              )}
            </div>
          )}

          {/* ── Cutting List Tab ── */}
          {tab === "cutting" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[14px] font-semibold">{ar ? "قائمة التقطيع" : "Cutting List"}</h3>
                  {cuttingList.length > 0 && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{completedCuts}/{cuttingList.length} {ar ? "مكتمل" : "completed"}</p>
                  )}
                </div>
                <button onClick={() => { setEditCut(null); setCutModal(true); }} className={btnPrimary + " h-9 text-[12px]"}><Plus size={13} /> {ar ? "قطعة جديدة" : "Add Piece"}</button>
              </div>
              {cuttingList.length === 0 ? (
                <div className="py-12 text-center text-[13px] text-muted-foreground/50">{ar ? "مفيش قطع لسه" : "No cutting pieces yet"}</div>
              ) : (
                <div className="border border-border/40 rounded-xl overflow-hidden">
                  {/* Table header */}
                  <div className="grid grid-cols-[40px_1fr_100px_80px_80px_60px_100px_80px] gap-2 px-4 py-2 bg-muted/30 text-[10px] text-muted-foreground font-medium border-b border-border/30">
                    <span>#</span>
                    <span>{ar ? "القطعة" : "Part"}</span>
                    <span>{ar ? "الخامة" : "Material"}</span>
                    <span>{ar ? "سُمك" : "THK"}</span>
                    <span>{ar ? "عرض" : "W"}</span>
                    <span>{ar ? "طول" : "L"}</span>
                    <span>{ar ? "كمية" : "Qty"}</span>
                    <span></span>
                  </div>
                  <div className="divide-y divide-border/20">
                    {cuttingList.sort((a, b) => a.piece_number - b.piece_number).map((item, i) => (
                      <div key={item.id} className={`grid grid-cols-[40px_1fr_100px_80px_80px_60px_100px_80px] gap-2 px-4 py-2.5 items-center ${item.completed ? "bg-emerald-50/30" : ""}`}>
                        <button onClick={() => toggleCuttingComplete(item)} className={`w-5 h-5 rounded flex items-center justify-center ${item.completed ? "bg-emerald-100 text-emerald-600" : "bg-muted text-muted-foreground/30"}`}>
                          <CheckCircle2 size={11} />
                        </button>
                        <div className="min-w-0">
                          <p className={`text-[12px] truncate ${item.completed ? "line-through text-muted-foreground" : "font-medium"}`}>{item.part_name}</p>
                          {item.cnc_program && <span className="text-[9px] text-muted-foreground">CNC: {item.cnc_program}</span>}
                        </div>
                        <span className="text-[11px] text-muted-foreground truncate">{item.material || "—"}</span>
                        <span className="text-[11px] tabular-nums">{item.thickness ?? "—"}</span>
                        <span className="text-[11px] tabular-nums">{item.width ?? "—"}</span>
                        <span className="text-[11px] tabular-nums">{item.length ?? "—"}</span>
                        <span className="text-[11px] tabular-nums">{item.qty}</span>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditCut(item); setCutModal(true); }} className="p-1 rounded hover:bg-muted/50 text-muted-foreground"><Edit3 size={11} /></button>
                          <button onClick={() => deleteCuttingItem(item.id)} className="p-1 rounded hover:bg-rose-50 text-rose-400"><Trash2 size={11} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Timeline Tab ── */}
          {tab === "timeline" && (
            <div>
              <h3 className="text-[14px] font-semibold mb-3">{ar ? "الجدول الزمني" : "Production Timeline"}</h3>
              <div className="space-y-1">
                {sortedStages.map((log, i) => {
                  const stageDef = STAGES.find(s => s.value === log.stage);
                  if (!stageDef) return null;
                  return (
                    <div key={log.id} className="flex items-start gap-3 py-2">
                      {/* Connector line */}
                      <div className="flex flex-col items-center pt-1">
                        <div className={`w-3 h-3 rounded-full shrink-0 ${
                          log.status === "completed" ? "bg-emerald-500" :
                          log.status === "in_progress" ? "bg-blue-500 animate-pulse" :
                          "bg-muted"
                        }`} />
                        {i < sortedStages.length - 1 && <div className="w-px h-8 bg-border/40 mt-1" />}
                      </div>
                      <div className="flex-1 min-w-0 -mt-0.5">
                        <p className="text-[12px] font-medium">{ar ? stageDef.ar : stageDef.en}</p>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                          {log.started_at && <span>{ar ? "بدأ" : "Started"}: {new Date(log.started_at).toLocaleString()}</span>}
                          {log.completed_at && <span>{ar ? "اكتمل" : "Done"}: {new Date(log.completed_at).toLocaleString()}</span>}
                          {log.duration_minutes != null && <span className="font-medium">{log.duration_minutes} {ar ? "د" : "min"}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Total time */}
              {sortedStages.some(s => s.duration_minutes != null) && (
                <div className="mt-4 pt-3 border-t border-border/30 flex items-center gap-2">
                  <Timer size={13} className="text-muted-foreground" />
                  <span className="text-[12px] font-medium">
                    {ar ? "إجمالي الوقت:" : "Total:"} {sortedStages.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)} {ar ? "دقيقة" : "min"}
                  </span>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {cutModal && (
        <CuttingModal onClose={() => { setCutModal(false); setEditCut(null); }} onSaved={() => { setCutModal(false); setEditCut(null); loadData(); }}
          poId={po.id} editItem={editCut} ar={ar} workspaceId={workspaceId} />
      )}
      {editPO && (
        <POModal onClose={() => setEditPO(false)} onSaved={() => { setEditPO(false); onRefresh(); }}
          orders={orders} designs={[]} editPO={po} ar={ar} workspaceId={workspaceId} />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────

export default function ProductionPlanning() {
  const { lang } = useLanguage();
  const { workspace } = useAuth();
  const ar = lang === "ar";

  const [loading, setLoading] = useState(true);
  const [prodOrders, setProdOrders] = useState<ProdOrder[]>([]);
  const [orders, setOrders] = useState<WorkItem[]>([]);
  const [designs, setDesigns] = useState<DesignBrief[]>([]);
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState<ProdOrder | null>(null);

  async function loadAll() {
    const wid = workspace?.id || "demo";
    const ds = getDataSource();
    const [p, w, d] = await Promise.all([
      ds.production_orders.list(wid),
      ds.work_items.list(wid, { type: "sales_order" }),
      ds.design_briefs.list(wid),
    ]);
    setProdOrders(p as ProdOrder[]);
    setOrders(w as WorkItem[]);
    setDesigns(d as DesignBrief[]);
    setLoading(false);
    if (selected) {
      const u = (p as ProdOrder[]).find(x => x.id === selected.id);
      if (u) setSelected(u);
    }
  }

  useEffect(() => { loadAll(); }, [workspace?.id]);

  const filtered = useMemo(() => {
    let list = prodOrders;
    if (filterStatus !== "all") list = list.filter(p => p.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.po_number.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        (p.customer_name || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [prodOrders, filterStatus, search]);

  // Stats
  const pending = prodOrders.filter(p => p.status === "pending").length;
  const active = prodOrders.filter(p => !["pending","ready","delivered","cancelled"].includes(p.status)).length;
  const ready = prodOrders.filter(p => p.status === "ready").length;
  const overdue = prodOrders.filter(p => p.due_date && !["ready","delivered","cancelled"].includes(p.status) && new Date(p.due_date) < new Date(new Date().toDateString())).length;

  function handleExport() {
    exportCSV(prodOrders.map(p => ({
      po_number: p.po_number, title: p.title, customer_name: p.customer_name,
      status: p.status, priority: p.priority, progress: p.progress,
      assigned_station: p.assigned_station, start_date: p.start_date, due_date: p.due_date,
    })), `thoth-production-orders-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  // Quick filter tabs for common groupings
  const filterGroups = [
    { value: "all",      en: "All",       ar: "الكل" },
    { value: "pending",  en: "Pending",   ar: "انتظار" },
    { value: "active",   en: "Active",    ar: "جاري" },
    { value: "ready",    en: "Ready",     ar: "جاهز" },
    { value: "delivered", en: "Delivered", ar: "تسلّم" },
  ];

  const getFiltered = () => {
    if (filterStatus === "active") return prodOrders.filter(p => !["pending","ready","delivered","cancelled"].includes(p.status));
    if (filterStatus === "all") return prodOrders;
    return prodOrders.filter(p => p.status === filterStatus);
  };

  const displayList = useMemo(() => {
    let list = getFiltered();
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.po_number.toLowerCase().includes(q) || p.title.toLowerCase().includes(q) || (p.customer_name || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [prodOrders, filterStatus, search]);

  if (selected) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <PODetail po={selected} onBack={() => { setSelected(null); loadAll(); }} ar={ar} workspaceId={workspace?.id || ""} orders={orders} onRefresh={loadAll} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight" style={{ fontFamily: "var(--app-font-serif)" }}>
            {ar ? "تخطيط الإنتاج" : "Production Planning"}
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">{ar ? "أوامر التشغيل ومراحل التصنيع" : "Production Orders & Manufacturing Stages"}</p>
        </div>
        <button onClick={() => setModal(true)} className={btnPrimary + " h-10"}><Plus size={14} /> {ar ? "أمر تشغيل جديد" : "New Order"}</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: ar ? "في الانتظار" : "Pending", value: pending, color: "text-zinc-600" },
          { label: ar ? "قيد التصنيع" : "Active", value: active, color: "text-blue-600" },
          { label: ar ? "جاهز للتسليم" : "Ready", value: ready, color: "text-emerald-600" },
          { label: ar ? "متأخر" : "Overdue", value: overdue, color: overdue > 0 ? "text-rose-600" : "text-zinc-400" },
        ].map((s, i) => (
          <div key={i} className="border border-border/40 rounded-xl p-4 bg-background">
            <p className="text-[11px] text-muted-foreground mb-1">{s.label}</p>
            <p className={`text-[20px] font-semibold tabular-nums ${s.color}`} style={{ fontFamily: "var(--app-font-serif)" }}>{s.value}</p>
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
        <div className="flex gap-1">
          {filterGroups.map(g => (
            <button key={g.value} onClick={() => setFilterStatus(g.value)} className={`px-3 py-2 rounded-lg text-[11px] font-medium ${filterStatus === g.value ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"}`}>{ar ? g.ar : g.en}</button>
          ))}
        </div>
        <button onClick={handleExport} className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground" title={ar ? "تصدير" : "Export"}><Download size={14} /></button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
      ) : prodOrders.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-4"><Wrench size={22} className="text-muted-foreground/30" /></div>
          <h3 className="text-[15px] font-semibold mb-1" style={{ fontFamily: "var(--app-font-serif)" }}>{ar ? "مفيش أوامر تشغيل لسه" : "No production orders yet"}</h3>
          <p className="text-[13px] text-muted-foreground">{ar ? "أنشئ أول أمر تشغيل من تصميم معتمد." : "Create your first production order from an approved design."}</p>
          <button onClick={() => setModal(true)} className={btnPrimary + " h-10 mt-4"}><Plus size={14} /> {ar ? "أمر تشغيل جديد" : "New Order"}</button>
        </div>
      ) : displayList.length === 0 ? (
        <div className="py-16 text-center text-[13px] text-muted-foreground/50">{ar ? "مفيش نتائج" : "No results"}</div>
      ) : (
        <div className="space-y-3">
          {displayList.map(p => {
            const st = STAGES.find(s => s.value === p.status)!;
            const StIcon = st.icon;
            const priDef = PRIORITIES.find(pr => pr.value === p.priority)!;
            const linkedOrder = orders.find(o => o.id === p.sales_order_id);
            const linkedMeta = linkedOrder ? (linkedOrder.metadata as any || {}) : null;
            const isOd = p.due_date && !["ready","delivered","cancelled"].includes(p.status) && new Date(p.due_date) < new Date(new Date().toDateString());

            return (
              <button key={p.id} onClick={() => setSelected(p)}
                className="w-full text-left bg-background border border-border/40 rounded-xl p-5 hover:shadow-sm hover:border-border/70 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-[10.5px] font-mono text-muted-foreground">{p.po_number}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.color}`}>{ar ? st.ar : st.en}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priDef.color}`}>{ar ? priDef.ar : priDef.en}</span>
                      {isOd && <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-rose-100 text-rose-600">{ar ? "متأخر" : "Overdue"}</span>}
                    </div>
                    <p className="text-[15px] font-medium" style={{ fontFamily: "var(--app-font-serif)" }}>{p.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
                      {p.customer_name && <span className="flex items-center gap-1"><Building2 size={9} />{p.customer_name}</span>}
                      {p.assigned_station && <span className="flex items-center gap-1"><Wrench size={9} />{p.assigned_station}</span>}
                      {linkedMeta?.so_number && <span className="flex items-center gap-1"><FileText size={9} />{linkedMeta.so_number}</span>}
                      {p.due_date && <span className="flex items-center gap-1"><Calendar size={9} />{p.due_date}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className="text-[10px] tabular-nums text-muted-foreground">{p.progress}%</span>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground/30" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {modal && (
        <POModal onClose={() => setModal(false)} onSaved={() => { setModal(false); loadAll(); }}
          orders={orders} designs={designs} editPO={null} ar={ar} workspaceId={workspace?.id || ""} />
      )}
    </div>
  );
}
