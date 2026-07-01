/**
 * Delivery & Installation — التسليم والتركيب
 *
 * Two-tab page:
 *   1. Deliveries — schedule, dispatch, track, confirm receipt
 *   2. Installations — schedule team, checklist, snag list, customer sign-off
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { getDataSource } from "../lib/data-source";
import { exportCSV } from "../lib/csv-export";
import type { Database } from "../lib/database.types";
import {
  Plus, Search, X, Loader2, AlertCircle, Download,
  CheckCircle2, Clock, ChevronRight, Eye, Truck, Hammer,
  MapPin, Phone, User, Building2, Calendar, Package,
  Camera, Star, FileText, XCircle, AlertTriangle,
  Play, Check, RotateCcw, Pause, Navigation, Trash2,
} from "lucide-react";
import { ConfirmDeleteModal } from "../components/ConfirmDeleteModal";

type Delivery = Database["public"]["Tables"]["deliveries"]["Row"];
type Installation = Database["public"]["Tables"]["installations"]["Row"];
type ProdOrder = Database["public"]["Tables"]["production_orders"]["Row"];

// ─── Constants ────────────────────────────────────────────

const DELIVERY_STATUSES = [
  { value: "scheduled",   en: "Scheduled",   ar: "مجدول",       pill: "bg-blue-50 text-blue-600",      icon: Calendar },
  { value: "loading",     en: "Loading",     ar: "جاري التحميل", pill: "bg-amber-50 text-amber-600",    icon: Package },
  { value: "in_transit",  en: "In Transit",  ar: "في الطريق",   pill: "bg-indigo-50 text-indigo-600",  icon: Truck },
  { value: "delivered",   en: "Delivered",   ar: "تم التسليم",  pill: "bg-emerald-50 text-emerald-600", icon: CheckCircle2 },
  { value: "failed",      en: "Failed",      ar: "فشل التسليم", pill: "bg-rose-50 text-rose-600",      icon: XCircle },
  { value: "cancelled",   en: "Cancelled",   ar: "ملغي",        pill: "bg-zinc-100 text-zinc-500",     icon: X },
] as const;

const INSTALL_STATUSES = [
  { value: "scheduled",    en: "Scheduled",    ar: "مجدول",       pill: "bg-blue-50 text-blue-600",      icon: Calendar },
  { value: "in_progress",  en: "In Progress",  ar: "جاري التركيب", pill: "bg-amber-50 text-amber-600",   icon: Hammer },
  { value: "completed",    en: "Completed",    ar: "تم التركيب",  pill: "bg-emerald-50 text-emerald-600", icon: CheckCircle2 },
  { value: "on_hold",      en: "On Hold",      ar: "متوقف",       pill: "bg-zinc-100 text-zinc-500",     icon: Pause },
  { value: "cancelled",    en: "Cancelled",    ar: "ملغي",        pill: "bg-zinc-100 text-zinc-500",     icon: X },
] as const;

const DEFAULT_INSTALL_CHECKLIST = [
  { id: "site_ready",    label_en: "Site is ready & clean",            label_ar: "الموقع جاهز ونظيف",         passed: null as boolean | null, notes: "" },
  { id: "pieces_check",  label_en: "All pieces accounted for",        label_ar: "كل القطع موجودة",            passed: null, notes: "" },
  { id: "no_damage",     label_en: "No transport damage",             label_ar: "مفيش تلف من النقل",          passed: null, notes: "" },
  { id: "level_plumb",   label_en: "Units level and plumb",           label_ar: "الوحدات مستوية ومظبوطة",     passed: null, notes: "" },
  { id: "doors_drawers", label_en: "Doors & drawers aligned",         label_ar: "الأبواب والأدراج مظبوطة",    passed: null, notes: "" },
  { id: "hardware",      label_en: "All hardware installed",          label_ar: "كل الإكسسوارات مركبة",       passed: null, notes: "" },
  { id: "handles",       label_en: "Handles & knobs fitted",          label_ar: "الأيادي والمقابض مركبة",     passed: null, notes: "" },
  { id: "worktop",       label_en: "Worktop fitted & sealed",         label_ar: "السطح مركب ومعزول",          passed: null, notes: "" },
  { id: "cleanup",       label_en: "Site cleaned after install",      label_ar: "الموقع اتنظف بعد التركيب",   passed: null, notes: "" },
  { id: "walkthrough",   label_en: "Customer walkthrough done",       label_ar: "تم شرح كل حاجة للعميل",     passed: null, notes: "" },
];

const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium px-5 hover:opacity-90 transition-opacity disabled:opacity-40";
const inputCls = "w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20";
const labelCls = "text-[11.5px] text-muted-foreground font-medium mb-1 block";

function genNum(prefix: string): string {
  const d = new Date();
  const seq = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}-${seq}`;
}

async function logActivity(wid: string, type: string, eid: string, en: string, arTxt: string) {
  const ds = getDataSource();
  try { await ds.activity_events.create(wid, { workspace_id: wid, event_type: type, entity_type: "delivery", entity_id: eid, description_en: en, description_ar: arTxt, metadata: {} } as any); } catch {}
}

// ─── Delivery Modal ───────────────────────────────────────

function DeliveryModal({ onClose, onSaved, prodOrders, ar, wid }: {
  onClose: () => void; onSaved: () => void;
  prodOrders: ProdOrder[]; ar: boolean; wid: string;
}) {
  const [num] = useState(genNum("DEL"));
  const [poId, setPOId] = useState("");
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [timeSlot, setTimeSlot] = useState("10:00-12:00");
  const [driver, setDriver] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [pieces, setPieces] = useState("0");
  const [packages, setPackages] = useState("0");
  const [loading, setLoading] = useState(false);

  function handlePO(id: string) {
    setPOId(id);
    const po = prodOrders.find(p => p.id === id);
    if (po?.customer_name && !customer) setCustomer(po.customer_name);
  }

  async function handleSave() {
    setLoading(true);
    const ds = getDataSource();
    const po = prodOrders.find(p => p.id === poId);
    await ds.deliveries.create(wid, {
      workspace_id: wid, delivery_number: num,
      production_order_id: poId || null, sales_order_id: po?.sales_order_id || null,
      customer_name: customer || null, customer_phone: phone || null,
      delivery_address: address || null, delivery_date: date || null,
      delivery_time_slot: timeSlot || null, driver_name: driver || null,
      vehicle_info: vehicle || null, status: "scheduled",
      num_pieces: parseInt(pieces) || 0, num_packages: parseInt(packages) || 0,
      metadata: {},
    } as any);
    await logActivity(wid, "delivery_scheduled", num,
      `Delivery ${num} scheduled`, `تم جدولة التسليم ${num}`);
    setLoading(false); onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background rounded-2xl border border-border/60 shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-border/40 shrink-0 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>{ar ? "تسليم جديد" : "New Delivery"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>{ar ? "رقم التسليم" : "Delivery #"}</label>
              <input className={inputCls + " bg-muted/30"} value={num} readOnly /></div>
            <div><label className={labelCls}>{ar ? "أمر التشغيل" : "Production Order"}</label>
              <select className={inputCls} value={poId} onChange={e => handlePO(e.target.value)}>
                <option value="">{ar ? "— اختر —" : "— Select —"}</option>
                {prodOrders.filter(p => ["packing","ready"].includes(p.status)).map(p => (
                  <option key={p.id} value={p.id}>{p.po_number} — {p.title}</option>
                ))}
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>{ar ? "العميل" : "Customer"}</label>
              <input className={inputCls} value={customer} onChange={e => setCustomer(e.target.value)} /></div>
            <div><label className={labelCls}>{ar ? "الهاتف" : "Phone"}</label>
              <input className={inputCls} value={phone} onChange={e => setPhone(e.target.value)} /></div>
          </div>
          <div><label className={labelCls}>{ar ? "عنوان التسليم" : "Delivery Address"}</label>
            <textarea className={inputCls + " h-16 py-2 resize-none"} value={address} onChange={e => setAddress(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>{ar ? "تاريخ التسليم" : "Date"}</label>
              <input type="date" className={inputCls} value={date} onChange={e => setDate(e.target.value)} /></div>
            <div><label className={labelCls}>{ar ? "الميعاد" : "Time Slot"}</label>
              <select className={inputCls} value={timeSlot} onChange={e => setTimeSlot(e.target.value)}>
                {["08:00-10:00","10:00-12:00","12:00-14:00","14:00-16:00","16:00-18:00"].map(t => <option key={t} value={t}>{t}</option>)}
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>{ar ? "السائق" : "Driver"}</label>
              <input className={inputCls} value={driver} onChange={e => setDriver(e.target.value)} /></div>
            <div><label className={labelCls}>{ar ? "السيارة" : "Vehicle"}</label>
              <input className={inputCls} value={vehicle} onChange={e => setVehicle(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>{ar ? "عدد القطع" : "Pieces"}</label>
              <input type="number" className={inputCls} value={pieces} onChange={e => setPieces(e.target.value)} /></div>
            <div><label className={labelCls}>{ar ? "عدد الطرود" : "Packages"}</label>
              <input type="number" className={inputCls} value={packages} onChange={e => setPackages(e.target.value)} /></div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border/40 shrink-0 flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border/60 text-[13px] font-medium hover:bg-muted/50">{ar ? "إلغاء" : "Cancel"}</button>
          <button onClick={handleSave} disabled={loading} className={btnPrimary + " flex-1 h-10"}>
            {loading && <Loader2 size={12} className="animate-spin" />} {ar ? "جدول التسليم" : "Schedule"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Installation Modal ───────────────────────────────────

function InstallModal({ onClose, onSaved, deliveries, ar, wid }: {
  onClose: () => void; onSaved: () => void;
  deliveries: Delivery[]; ar: boolean; wid: string;
}) {
  const [num] = useState(genNum("INS"));
  const [delId, setDelId] = useState("");
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [timeSlot, setTimeSlot] = useState("10:00-12:00");
  const [leader, setLeader] = useState("");
  const [members, setMembers] = useState("");
  const [loading, setLoading] = useState(false);

  function handleDel(id: string) {
    setDelId(id);
    const d = deliveries.find(dl => dl.id === id);
    if (d?.customer_name && !customer) setCustomer(d.customer_name);
    if (d?.customer_phone && !phone) setPhone(d.customer_phone);
    if (d?.delivery_address && !address) setAddress(d.delivery_address);
  }

  async function handleSave() {
    setLoading(true);
    const ds = getDataSource();
    const del = deliveries.find(d => d.id === delId);
    await ds.installations.create(wid, {
      workspace_id: wid, installation_number: num,
      delivery_id: delId || null, sales_order_id: del?.sales_order_id || null,
      customer_name: customer || null, customer_phone: phone || null,
      site_address: address || null, scheduled_date: date || null,
      scheduled_time_slot: timeSlot || null, team_leader: leader || null,
      team_members: members ? members.split(",").map(m => m.trim()) : [],
      status: "scheduled", checklist: DEFAULT_INSTALL_CHECKLIST,
      snag_list: [], photos: [], metadata: {},
    } as any);
    await logActivity(wid, "installation_scheduled", num,
      `Installation ${num} scheduled`, `تم جدولة التركيب ${num}`);
    setLoading(false); onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background rounded-2xl border border-border/60 shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-border/40 shrink-0 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>{ar ? "تركيب جديد" : "New Installation"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>{ar ? "رقم التركيب" : "Installation #"}</label>
              <input className={inputCls + " bg-muted/30"} value={num} readOnly /></div>
            <div><label className={labelCls}>{ar ? "التسليم" : "Delivery"}</label>
              <select className={inputCls} value={delId} onChange={e => handleDel(e.target.value)}>
                <option value="">{ar ? "— اختر —" : "— Select —"}</option>
                {deliveries.filter(d => d.status === "delivered").map(d => (
                  <option key={d.id} value={d.id}>{d.delivery_number} — {d.customer_name}</option>
                ))}
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>{ar ? "العميل" : "Customer"}</label>
              <input className={inputCls} value={customer} onChange={e => setCustomer(e.target.value)} /></div>
            <div><label className={labelCls}>{ar ? "الهاتف" : "Phone"}</label>
              <input className={inputCls} value={phone} onChange={e => setPhone(e.target.value)} /></div>
          </div>
          <div><label className={labelCls}>{ar ? "عنوان الموقع" : "Site Address"}</label>
            <textarea className={inputCls + " h-16 py-2 resize-none"} value={address} onChange={e => setAddress(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>{ar ? "تاريخ التركيب" : "Date"}</label>
              <input type="date" className={inputCls} value={date} onChange={e => setDate(e.target.value)} /></div>
            <div><label className={labelCls}>{ar ? "الميعاد" : "Time Slot"}</label>
              <select className={inputCls} value={timeSlot} onChange={e => setTimeSlot(e.target.value)}>
                {["08:00-10:00","10:00-12:00","12:00-14:00","14:00-16:00","16:00-18:00"].map(t => <option key={t} value={t}>{t}</option>)}
              </select></div>
          </div>
          <div><label className={labelCls}>{ar ? "رئيس الفريق" : "Team Leader"}</label>
            <input className={inputCls} value={leader} onChange={e => setLeader(e.target.value)} /></div>
          <div><label className={labelCls}>{ar ? "أعضاء الفريق (بفاصلة)" : "Team Members (comma separated)"}</label>
            <input className={inputCls} value={members} onChange={e => setMembers(e.target.value)} placeholder={ar ? "أحمد, محمد, حسن" : "Ahmed, Mohamed, Hassan"} /></div>
        </div>
        <div className="px-6 py-4 border-t border-border/40 shrink-0 flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border/60 text-[13px] font-medium hover:bg-muted/50">{ar ? "إلغاء" : "Cancel"}</button>
          <button onClick={handleSave} disabled={loading} className={btnPrimary + " flex-1 h-10"}>
            {loading && <Loader2 size={12} className="animate-spin" />} {ar ? "جدول التركيب" : "Schedule"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delivery Detail ──────────────────────────────────────

function DeliveryDetail({ del, onBack, ar, wid, onRefresh }: {
  del: Delivery; onBack: () => void; ar: boolean; wid: string; onRefresh: () => void;
}) {
  const st = DELIVERY_STATUSES.find(s => s.value === del.status)!;

  async function updateStatus(status: string) {
    const ds = getDataSource();
    const payload: any = { status };
    if (status === "delivered") payload.delivered_at = new Date().toISOString();
    await ds.deliveries.update(wid, del.id, payload);
    const label = status === "delivered" ? "delivered" : status;
    await logActivity(wid, `delivery_${label}`, del.id,
      `Delivery ${del.delivery_number} → ${status}`, `تسليم ${del.delivery_number} → ${status}`);
    onRefresh();
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-muted/50"><ChevronRight size={16} className="rotate-180" /></button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[11px] font-mono text-muted-foreground">{del.delivery_number}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.pill}`}>{ar ? st.ar : st.en}</span>
          </div>
          <h2 className="text-[18px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>
            {del.customer_name || del.delivery_number}
          </h2>
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap">
          {del.status === "scheduled" && <button onClick={() => updateStatus("loading")} className="text-[11px] text-amber-600 font-medium hover:opacity-70 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-200"><Package size={11} /> {ar ? "بدأ التحميل" : "Start Loading"}</button>}
          {del.status === "loading" && <button onClick={() => updateStatus("in_transit")} className="text-[11px] text-indigo-600 font-medium hover:opacity-70 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-indigo-200"><Truck size={11} /> {ar ? "خرج للتسليم" : "Dispatch"}</button>}
          {del.status === "in_transit" && (
            <>
              <button onClick={() => updateStatus("delivered")} className="text-[11px] text-emerald-600 font-medium hover:opacity-70 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-200"><CheckCircle2 size={11} /> {ar ? "تم التسليم" : "Delivered"}</button>
              <button onClick={() => updateStatus("failed")} className="text-[11px] text-rose-600 font-medium hover:opacity-70 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200"><XCircle size={11} /> {ar ? "فشل" : "Failed"}</button>
            </>
          )}
        </div>
      </div>

      {/* Status timeline */}
      <div className="flex items-center gap-1 mb-6">
        {DELIVERY_STATUSES.filter(s => !["failed","cancelled"].includes(s.value)).map((s, i, arr) => {
          const idx = arr.findIndex(x => x.value === del.status);
          const thisIdx = i;
          const done = thisIdx < idx;
          const active = thisIdx === idx;
          return (
            <div key={s.value} className="flex items-center gap-1 flex-1">
              <div className={`h-1.5 flex-1 rounded-full ${done ? "bg-emerald-400" : active ? "bg-primary" : "bg-muted"}`} />
              <span className={`text-[9px] font-medium ${done ? "text-emerald-600" : active ? "text-primary" : "text-muted-foreground/40"}`}>{ar ? s.ar : s.en}</span>
            </div>
          );
        })}
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          { icon: Building2, label: ar ? "العميل" : "Customer", value: del.customer_name },
          { icon: Phone, label: ar ? "الهاتف" : "Phone", value: del.customer_phone },
          { icon: MapPin, label: ar ? "العنوان" : "Address", value: del.delivery_address },
          { icon: Calendar, label: ar ? "التاريخ" : "Date", value: del.delivery_date },
          { icon: Clock, label: ar ? "الميعاد" : "Time", value: del.delivery_time_slot },
          { icon: User, label: ar ? "السائق" : "Driver", value: del.driver_name },
          { icon: Truck, label: ar ? "السيارة" : "Vehicle", value: del.vehicle_info },
          { icon: Package, label: ar ? "القطع/الطرود" : "Pieces/Packages", value: `${del.num_pieces} / ${del.num_packages}` },
        ].filter(f => f.value).map((f, i) => (
          <div key={i} className="flex items-start gap-2.5 p-3 border border-border/30 rounded-xl">
            <f.icon size={13} className="text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground">{f.label}</p>
              <p className="text-[13px]">{f.value}</p>
            </div>
          </div>
        ))}
      </div>

      {del.delivered_at && (
        <div className="p-4 border border-emerald-200 bg-emerald-50/30 rounded-xl flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
          <div>
            <p className="text-[12px] font-medium text-emerald-700">{ar ? "تم التسليم" : "Delivered"}</p>
            <p className="text-[11px] text-emerald-600">{new Date(del.delivered_at).toLocaleString()}</p>
            {del.recipient_name && <p className="text-[11px] text-emerald-600">{ar ? "المستلم:" : "Recipient:"} {del.recipient_name}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Installation Detail ──────────────────────────────────

function InstallDetail({ inst, onBack, ar, wid, onRefresh }: {
  inst: Installation; onBack: () => void; ar: boolean; wid: string; onRefresh: () => void;
}) {
  const [tab, setTab] = useState<"checklist" | "snags" | "photos">("checklist");
  const [snagTitle, setSnagTitle] = useState("");
  const [snagSeverity, setSnagSeverity] = useState("minor");
  const st = INSTALL_STATUSES.find(s => s.value === inst.status)!;
  const checklist: any[] = Array.isArray(inst.checklist) ? inst.checklist as any[] : [];
  const snagList: any[] = Array.isArray(inst.snag_list) ? inst.snag_list as any[] : [];
  const photos: any[] = Array.isArray(inst.photos) ? inst.photos as any[] : [];
  const fileRef = useRef<HTMLInputElement>(null);

  async function updateStatus(status: string) {
    const ds = getDataSource();
    const payload: any = { status };
    if (status === "in_progress") payload.started_at = new Date().toISOString();
    if (status === "completed") payload.completed_at = new Date().toISOString();
    await ds.installations.update(wid, inst.id, payload);
    await logActivity(wid, `installation_${status}`, inst.id,
      `Installation ${inst.installation_number} → ${status}`, `تركيب ${inst.installation_number} → ${status}`);
    onRefresh();
  }

  async function toggleChecklist(itemId: string, passed: boolean | null) {
    const updated = checklist.map((c: any) => c.id === itemId ? { ...c, passed } : c);
    const ds = getDataSource();
    await ds.installations.update(wid, inst.id, { checklist: updated } as any);
    onRefresh();
  }

  async function addSnag() {
    if (!snagTitle.trim()) return;
    const newSnag = { id: `snag-${Date.now()}`, title: snagTitle.trim(), severity: snagSeverity, status: "open", photo_url: null, notes: "" };
    const ds = getDataSource();
    await ds.installations.update(wid, inst.id, { snag_list: [...snagList, newSnag] } as any);
    setSnagTitle(""); onRefresh();
  }

  async function resolveSnag(snagId: string) {
    const updated = snagList.map((s: any) => s.id === snagId ? { ...s, status: s.status === "open" ? "resolved" : "open" } : s);
    const ds = getDataSource();
    await ds.installations.update(wid, inst.id, { snag_list: updated } as any);
    onRefresh();
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;
    const path = `${wid}/${inst.id}/${Date.now()}-${file.name}`;
    const { data } = await supabase.storage.from("installation-photos").upload(path, file);
    if (data) {
      const { data: urlData } = supabase.storage.from("installation-photos").getPublicUrl(data.path);
      const ds = getDataSource();
      await ds.installations.update(wid, inst.id, {
        photos: [...photos, { url: urlData.publicUrl, caption: file.name, type: "installation" }]
      } as any);
      onRefresh();
    }
  }

  async function setRating(rating: number) {
    const ds = getDataSource();
    await ds.installations.update(wid, inst.id, { customer_rating: rating } as any);
    onRefresh();
  }

  const passedItems = checklist.filter((c: any) => c.passed === true).length;
  const openSnags = snagList.filter((s: any) => s.status === "open").length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-muted/50"><ChevronRight size={16} className="rotate-180" /></button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[11px] font-mono text-muted-foreground">{inst.installation_number}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.pill}`}>{ar ? st.ar : st.en}</span>
          </div>
          <h2 className="text-[18px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>
            {inst.customer_name || inst.installation_number}
          </h2>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
            {inst.site_address && <span className="flex items-center gap-1"><MapPin size={10} />{inst.site_address}</span>}
            {inst.team_leader && <span className="flex items-center gap-1"><User size={10} />{inst.team_leader}</span>}
            {inst.scheduled_date && <span className="flex items-center gap-1"><Calendar size={10} />{inst.scheduled_date}</span>}
          </div>
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap">
          {inst.status === "scheduled" && <button onClick={() => updateStatus("in_progress")} className="text-[11px] text-amber-600 font-medium hover:opacity-70 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-200"><Play size={11} /> {ar ? "ابدأ التركيب" : "Start"}</button>}
          {inst.status === "in_progress" && (
            <>
              <button onClick={() => updateStatus("completed")} className="text-[11px] text-emerald-600 font-medium hover:opacity-70 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-200"><CheckCircle2 size={11} /> {ar ? "تم التركيب" : "Complete"}</button>
              <button onClick={() => updateStatus("on_hold")} className="text-[11px] text-zinc-500 font-medium hover:opacity-70 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-200"><Pause size={11} /> {ar ? "إيقاف" : "Hold"}</button>
            </>
          )}
          {inst.status === "on_hold" && <button onClick={() => updateStatus("in_progress")} className="text-[11px] text-amber-600 font-medium hover:opacity-70 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-200"><Play size={11} /> {ar ? "استأنف" : "Resume"}</button>}
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <span className="text-[11px] bg-emerald-50 text-emerald-600 rounded-lg px-3 py-1.5 flex items-center gap-1"><CheckCircle2 size={10} />{passedItems}/{checklist.length} {ar ? "بنود" : "items"}</span>
        {openSnags > 0 && <span className="text-[11px] bg-amber-50 text-amber-600 rounded-lg px-3 py-1.5 flex items-center gap-1"><AlertTriangle size={10} />{openSnags} {ar ? "ملاحظات مفتوحة" : "open snags"}</span>}
        {photos.length > 0 && <span className="text-[11px] bg-blue-50 text-blue-600 rounded-lg px-3 py-1.5 flex items-center gap-1"><Camera size={10} />{photos.length} {ar ? "صور" : "photos"}</span>}
        {inst.customer_rating && (
          <span className="text-[11px] bg-amber-50 text-amber-600 rounded-lg px-3 py-1.5 flex items-center gap-1">
            <Star size={10} />{inst.customer_rating}/5
          </span>
        )}
      </div>

      {/* Team */}
      {(inst.team_leader || (Array.isArray(inst.team_members) && (inst.team_members as string[]).length > 0)) && (
        <div className="mb-5 p-3 border border-border/30 rounded-xl">
          <p className="text-[11px] text-muted-foreground mb-1">{ar ? "فريق التركيب" : "Installation Team"}</p>
          <div className="flex items-center gap-2 flex-wrap">
            {inst.team_leader && <span className="text-[12px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{inst.team_leader} ({ar ? "رئيس" : "Lead"})</span>}
            {Array.isArray(inst.team_members) && (inst.team_members as string[]).map((m, i) => (
              <span key={i} className="text-[12px] bg-muted px-2 py-0.5 rounded-full">{m}</span>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-border/30 pb-3">
        {[
          { id: "checklist" as const, en: "Checklist", ar: "قائمة التركيب", icon: CheckCircle2 },
          { id: "snags" as const, en: `Snags (${snagList.length})`, ar: `ملاحظات (${snagList.length})`, icon: AlertTriangle },
          { id: "photos" as const, en: `Photos (${photos.length})`, ar: `صور (${photos.length})`, icon: Camera },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-2 rounded-lg text-[12px] font-medium transition-colors flex items-center gap-1.5
              ${tab === t.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"}`}>
            <t.icon size={13} />{ar ? t.ar : t.en}
          </button>
        ))}
      </div>

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
                <button onClick={() => toggleChecklist(item.id, item.passed === true ? null : true)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${item.passed === true ? "bg-emerald-100 text-emerald-600" : "bg-muted text-muted-foreground/30 hover:bg-emerald-50"}`}>
                  <CheckCircle2 size={13} />
                </button>
                <button onClick={() => toggleChecklist(item.id, item.passed === false ? null : false)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${item.passed === false ? "bg-rose-100 text-rose-600" : "bg-muted text-muted-foreground/30 hover:bg-rose-50"}`}>
                  <XCircle size={13} />
                </button>
              </div>
              <span className="text-[12.5px] flex-1">{ar ? item.label_ar : item.label_en}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Snag List ── */}
      {tab === "snags" && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <input className={inputCls + " flex-1"} value={snagTitle} onChange={e => setSnagTitle(e.target.value)}
              placeholder={ar ? "ملاحظة جديدة..." : "New snag..."} onKeyDown={e => e.key === "Enter" && addSnag()} />
            <select className={inputCls + " w-28"} value={snagSeverity} onChange={e => setSnagSeverity(e.target.value)}>
              <option value="minor">{ar ? "صغير" : "Minor"}</option>
              <option value="major">{ar ? "كبير" : "Major"}</option>
              <option value="critical">{ar ? "حرج" : "Critical"}</option>
            </select>
            <button onClick={addSnag} disabled={!snagTitle.trim()} className={btnPrimary + " h-10 px-3"}><Plus size={14} /></button>
          </div>
          {snagList.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle2 size={24} className="text-emerald-300 mx-auto mb-2" />
              <p className="text-[13px] text-muted-foreground/50">{ar ? "مفيش ملاحظات — ممتاز!" : "No snags — excellent!"}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {snagList.map((s: any) => (
                <div key={s.id} className={`flex items-center gap-3 px-4 py-3 border rounded-xl ${s.status === "resolved" ? "border-emerald-200 bg-emerald-50/20" : "border-amber-200 bg-amber-50/20"}`}>
                  <button onClick={() => resolveSnag(s.id)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${s.status === "resolved" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
                    {s.status === "resolved" ? <Check size={13} /> : <AlertTriangle size={13} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] ${s.status === "resolved" ? "line-through text-muted-foreground" : ""}`}>{s.title}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                      s.severity === "critical" ? "bg-rose-100 text-rose-700" :
                      s.severity === "major" ? "bg-orange-100 text-orange-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>{s.severity}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Photos ── */}
      {tab === "photos" && (
        <div>
          <label className="flex items-center gap-2 text-[12px] text-blue-600 font-medium cursor-pointer hover:opacity-70 px-3 py-2 rounded-lg border border-blue-200 w-fit mb-4">
            <Camera size={13} /> {ar ? "رفع صورة" : "Upload Photo"}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </label>
          {photos.length === 0 ? (
            <div className="py-12 text-center text-[13px] text-muted-foreground/50">{ar ? "مفيش صور لسه" : "No photos yet"}</div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {photos.map((p: any, i: number) => (
                <div key={i} className="aspect-square rounded-xl border overflow-hidden">
                  <img src={p.url} alt={p.caption || ""} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Customer Rating */}
      {inst.status === "completed" && (
        <div className="mt-6 p-4 border border-border/40 rounded-xl">
          <p className="text-[12px] font-medium mb-2">{ar ? "تقييم العميل" : "Customer Rating"}</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setRating(n)}
                className={`p-1 ${(inst.customer_rating || 0) >= n ? "text-amber-400" : "text-muted-foreground/20"}`}>
                <Star size={20} fill={(inst.customer_rating || 0) >= n ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────

export default function DeliveryInstallation() {
  const { lang } = useLanguage();
  const { workspace } = useAuth();
  const ar = lang === "ar";

  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [prodOrders, setProdOrders] = useState<ProdOrder[]>([]);
  const [topTab, setTopTab] = useState<"deliveries" | "installations">("deliveries");
  const [search, setSearch] = useState("");
  const [delModal, setDelModal] = useState(false);
  const [instModal, setInstModal] = useState(false);
  const [selectedDel, setSelectedDel] = useState<Delivery | null>(null);
  const [selectedInst, setSelectedInst] = useState<Installation | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; num: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function loadAll() {
    const wid = workspace?.id || "demo";
    const ds = getDataSource();
    const [d, i, p] = await Promise.all([
      ds.deliveries.list(wid),
      ds.installations.list(wid),
      ds.production_orders.list(wid),
    ]);
    setDeliveries(d as Delivery[]);
    setInstallations(i as Installation[]);
    setProdOrders(p as ProdOrder[]);
    setLoading(false);
    if (selectedDel) { const u = (d as Delivery[]).find(x => x.id === selectedDel.id); if (u) setSelectedDel(u); }
    if (selectedInst) { const u = (i as Installation[]).find(x => x.id === selectedInst.id); if (u) setSelectedInst(u); }
  }

  useEffect(() => { loadAll(); }, [workspace?.id]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const wid = workspace?.id || "demo";
    const ds = getDataSource();
    if (topTab === "deliveries") {
      await ds.deliveries.remove(wid, deleteTarget.id);
      setDeliveries(prev => prev.filter(d => d.id !== deleteTarget.id));
    } else {
      await ds.installations.remove(wid, deleteTarget.id);
      setInstallations(prev => prev.filter(i => i.id !== deleteTarget.id));
    }
    setDeleteLoading(false);
    setDeleteTarget(null);
  }

  const statuses = topTab === "deliveries" ? DELIVERY_STATUSES : INSTALL_STATUSES;
  const items = topTab === "deliveries" ? deliveries : installations;

  const filtered = useMemo(() => {
    let list = items as any[];
    if (filterStatus !== "all") list = list.filter((i: any) => i.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i: any) =>
        (i.delivery_number || i.installation_number || "").toLowerCase().includes(q) ||
        (i.customer_name || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, filterStatus, search]);

  // Dashboard stats
  const delScheduled = deliveries.filter(d => d.status === "scheduled").length;
  const delInTransit = deliveries.filter(d => d.status === "in_transit" || d.status === "loading").length;
  const delDelivered = deliveries.filter(d => d.status === "delivered").length;
  const instScheduled = installations.filter(i => i.status === "scheduled").length;
  const instActive = installations.filter(i => i.status === "in_progress").length;
  const instCompleted = installations.filter(i => i.status === "completed").length;

  function handleExport() {
    if (topTab === "deliveries") {
      exportCSV(deliveries.map(d => ({
        delivery_number: d.delivery_number, customer: d.customer_name, status: d.status,
        date: d.delivery_date, driver: d.driver_name, pieces: d.num_pieces,
      })), `thoth-deliveries-${new Date().toISOString().slice(0, 10)}.csv`);
    } else {
      exportCSV(installations.map(i => ({
        installation_number: i.installation_number, customer: i.customer_name, status: i.status,
        date: i.scheduled_date, team_leader: i.team_leader, rating: i.customer_rating,
      })), `thoth-installations-${new Date().toISOString().slice(0, 10)}.csv`);
    }
  }

  // Detail views
  if (selectedDel) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <DeliveryDetail del={selectedDel} onBack={() => { setSelectedDel(null); loadAll(); }} ar={ar} wid={workspace?.id || ""} onRefresh={loadAll} />
      </div>
    );
  }
  if (selectedInst) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <InstallDetail inst={selectedInst} onBack={() => { setSelectedInst(null); loadAll(); }} ar={ar} wid={workspace?.id || ""} onRefresh={loadAll} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight" style={{ fontFamily: "var(--app-font-serif)" }}>
            {ar ? "التسليم والتركيب" : "Delivery & Installation"}
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">{ar ? "جدولة وتتبع التسليمات والتركيبات" : "Schedule & track deliveries and installations"}</p>
        </div>
        <button onClick={() => topTab === "deliveries" ? setDelModal(true) : setInstModal(true)} className={btnPrimary + " h-10"}>
          <Plus size={14} /> {topTab === "deliveries" ? (ar ? "تسليم جديد" : "New Delivery") : (ar ? "تركيب جديد" : "New Installation")}
        </button>
      </div>

      {/* Top tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: "deliveries" as const, en: "Deliveries", ar: "التسليمات", icon: Truck, count: deliveries.length },
          { id: "installations" as const, en: "Installations", ar: "التركيبات", icon: Hammer, count: installations.length },
        ].map(t => (
          <button key={t.id} onClick={() => { setTopTab(t.id); setFilterStatus("all"); }}
            className={`px-4 py-2.5 rounded-xl text-[13px] font-medium transition-colors flex items-center gap-2
              ${topTab === t.id ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}>
            <t.icon size={15} />{ar ? t.ar : t.en} <span className="text-[10px] opacity-70">({t.count})</span>
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {(() => {
          const statsArr = topTab === "deliveries" ? [
            { label: ar ? "مجدول" : "Scheduled", value: delScheduled, color: "text-blue-600" },
            { label: ar ? "في الطريق" : "In Transit", value: delInTransit, color: "text-indigo-600" },
            { label: ar ? "تم التسليم" : "Delivered", value: delDelivered, color: "text-emerald-600" },
          ] : [
            { label: ar ? "مجدول" : "Scheduled", value: instScheduled, color: "text-blue-600" },
            { label: ar ? "جاري التركيب" : "Active", value: instActive, color: "text-amber-600" },
            { label: ar ? "تم التركيب" : "Completed", value: instCompleted, color: "text-emerald-600" },
          ];
          return statsArr.map((s, i) => (
          <div key={i} className="border border-border/40 rounded-xl p-4 bg-background">
            <p className="text-[11px] text-muted-foreground mb-1">{s.label}</p>
            <p className={`text-[20px] font-semibold tabular-nums ${s.color}`} style={{ fontFamily: "var(--app-font-serif)" }}>{s.value}</p>
          </div>
        ));
        })()}
      </div>

      {/* Search & filter */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
          <input className={inputCls + " pl-9"} placeholder={ar ? "بحث..." : "Search..."} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1">
          {[{ v: "all", en: "All", ar: "الكل" }, ...statuses.map(s => ({ v: s.value, en: s.en, ar: s.ar }))].map(g => (
            <button key={g.v} onClick={() => setFilterStatus(g.v)} className={`px-2.5 py-2 rounded-lg text-[11px] font-medium ${filterStatus === g.v ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"}`}>{ar ? g.ar : g.en}</button>
          ))}
        </div>
        <button onClick={handleExport} className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground"><Download size={14} /></button>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-4">
            {topTab === "deliveries" ? <Truck size={22} className="text-muted-foreground/30" /> : <Hammer size={22} className="text-muted-foreground/30" />}
          </div>
          <h3 className="text-[15px] font-semibold mb-1" style={{ fontFamily: "var(--app-font-serif)" }}>
            {topTab === "deliveries" ? (ar ? "مفيش تسليمات لسه" : "No deliveries yet") : (ar ? "مفيش تركيبات لسه" : "No installations yet")}
          </h3>
          <button onClick={() => topTab === "deliveries" ? setDelModal(true) : setInstModal(true)} className={btnPrimary + " h-10 mt-4"}>
            <Plus size={14} /> {topTab === "deliveries" ? (ar ? "تسليم جديد" : "New Delivery") : (ar ? "تركيب جديد" : "New Installation")}
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-[13px] text-muted-foreground/50">{ar ? "مفيش نتائج" : "No results"}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item: any) => {
            const isDel = topTab === "deliveries";
            const sts = (isDel ? DELIVERY_STATUSES : INSTALL_STATUSES).find(s => s.value === item.status)!;
            const StIcon = sts.icon;
            const num = isDel ? item.delivery_number : item.installation_number;

            return (
              <div key={item.id} role="button" tabIndex={0} onClick={() => isDel ? setSelectedDel(item) : setSelectedInst(item)}
                onKeyDown={e => { if (e.key === "Enter") (isDel ? setSelectedDel(item) : setSelectedInst(item)); }}
                className="w-full text-left bg-background border border-border/40 rounded-xl p-5 hover:shadow-sm hover:border-border/70 transition-all cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-[10.5px] font-mono text-muted-foreground">{num}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${sts.pill}`}>{ar ? sts.ar : sts.en}</span>
                      {isDel && item.delivery_date && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Calendar size={9} />{item.delivery_date}</span>}
                      {!isDel && item.scheduled_date && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Calendar size={9} />{item.scheduled_date}</span>}
                    </div>
                    <p className="text-[15px] font-medium" style={{ fontFamily: "var(--app-font-serif)" }}>
                      {item.customer_name || num}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
                      {isDel && item.driver_name && <span className="flex items-center gap-1"><User size={9} />{item.driver_name}</span>}
                      {isDel && <span className="flex items-center gap-1"><Package size={9} />{item.num_pieces} {ar ? "قطعة" : "pcs"}</span>}
                      {!isDel && item.team_leader && <span className="flex items-center gap-1"><User size={9} />{item.team_leader}</span>}
                      {!isDel && item.customer_rating && <span className="flex items-center gap-1"><Star size={9} fill="currentColor" className="text-amber-400" />{item.customer_rating}/5</span>}
                      {item.delivery_address || item.site_address ? <span className="flex items-center gap-1 truncate max-w-[200px]"><MapPin size={9} />{item.delivery_address || item.site_address}</span> : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={e => { e.stopPropagation(); setDeleteTarget({ id: item.id, num }); }} title={ar ? "حذف" : "Delete"}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-400 transition-colors">
                      <Trash2 size={12} />
                    </button>
                    <StIcon size={16} className={sts.pill.split(" ")[1]} />
                    <ChevronRight size={14} className="text-muted-foreground/30" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {delModal && <DeliveryModal onClose={() => setDelModal(false)} onSaved={() => { setDelModal(false); loadAll(); }} prodOrders={prodOrders} ar={ar} wid={workspace?.id || ""} />}
      {instModal && <InstallModal onClose={() => setInstModal(false)} onSaved={() => { setInstModal(false); loadAll(); }} deliveries={deliveries} ar={ar} wid={workspace?.id || ""} />}

      <ConfirmDeleteModal
        open={!!deleteTarget}
        ar={ar}
        title={topTab === "deliveries" ? (ar ? "حذف التسليم" : "Delete Delivery") : (ar ? "حذف التركيب" : "Delete Installation")}
        itemName={deleteTarget?.num || ""}
        loading={deleteLoading}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
