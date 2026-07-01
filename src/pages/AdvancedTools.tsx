/**
 * Advanced Tools — أدوات متقدمة
 *
 * Five-tab page:
 *   1. Cost Analysis — per-order cost breakdown (material/labor/overhead)
 *   2. Profit Reports — margin analysis
 *   3. Documents — print-ready quotation/invoice/delivery note templates
 *   4. Workshop Board — mobile-optimized production status board
 *   5. Branches — multi-branch management
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { isDemoMode } from "../lib/supabase";
import { getDataSource } from "../lib/data-source";
import { exportCSV } from "../lib/csv-export";
import type { Database } from "../lib/database.types";
import {
  Plus, Search, X, Loader2, AlertCircle, Download,
  CheckCircle2, Clock, ChevronRight, DollarSign, TrendingUp,
  FileText, Printer, Building2, MapPin, Phone, User,
  Edit3, Trash2, BarChart3, PieChart, Factory,
  Package, Hammer, Eye, ArrowUpRight, ArrowDownRight,
  Layers, Calculator, Receipt, Truck, Award,
} from "lucide-react";

type CostEntry = Database["public"]["Tables"]["cost_entries"]["Row"];
type Branch = Database["public"]["Tables"]["branches"]["Row"];
type ProdOrder = Database["public"]["Tables"]["production_orders"]["Row"];
type WorkItem = Database["public"]["Tables"]["work_items"]["Row"];

const COST_TYPES = [
  { value: "material",    en: "Material",     ar: "خامات",     color: "bg-blue-50 text-blue-600",    icon: Package },
  { value: "labor",       en: "Labor",        ar: "عمالة",     color: "bg-amber-50 text-amber-600",  icon: User },
  { value: "overhead",    en: "Overhead",     ar: "مصاريف عامة", color: "bg-purple-50 text-purple-600", icon: Building2 },
  { value: "subcontract", en: "Subcontract",  ar: "مقاولة باطن", color: "bg-cyan-50 text-cyan-600",   icon: Hammer },
  { value: "transport",   en: "Transport",    ar: "نقل",       color: "bg-indigo-50 text-indigo-600", icon: Truck },
  { value: "other",       en: "Other",        ar: "أخرى",      color: "bg-zinc-100 text-zinc-600",   icon: Layers },
] as const;

const BRANCH_TYPES = [
  { value: "factory",   en: "Factory",   ar: "مصنع" },
  { value: "showroom",  en: "Showroom",  ar: "معرض" },
  { value: "warehouse", en: "Warehouse", ar: "مخزن" },
  { value: "office",    en: "Office",    ar: "مكتب" },
] as const;

const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium px-5 hover:opacity-90 transition-opacity disabled:opacity-40";
const inputCls = "w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20";
const labelCls = "text-[11.5px] text-muted-foreground font-medium mb-1 block";

function fmtMoney(n: number) { return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }

// ─── Cost Entry Modal ─────────────────────────────────────

function CostModal({ onClose, onSaved, prodOrders, salesOrders, ar, wid }: {
  onClose: () => void; onSaved: () => void;
  prodOrders: ProdOrder[]; salesOrders: WorkItem[]; ar: boolean; wid: string;
}) {
  const [costType, setCostType] = useState("material");
  const [desc, setDesc] = useState("");
  const [qty, setQty] = useState("1");
  const [unitCost, setUnitCost] = useState("");
  const [soId, setSOId] = useState("");
  const [poId, setPOId] = useState("");
  const [supplier, setSupplier] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const total = (parseFloat(qty) || 0) * (parseFloat(unitCost) || 0);

  async function handleSave() {
    if (!desc.trim() || !unitCost) return;
    setLoading(true);
    const ds = getDataSource();
    await ds.cost_entries.create(wid, {
      workspace_id: wid, cost_type: costType, description: desc.trim(),
      quantity: parseFloat(qty) || 1, unit_cost: parseFloat(unitCost) || 0,
      total_cost: total, currency: "EGP", date: date || null,
      sales_order_id: soId || null, production_order_id: poId || null,
      supplier: supplier || null, notes: notes || null, metadata: {},
    } as any);
    setLoading(false); onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background rounded-2xl border border-border/60 shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-border/40 shrink-0 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>{ar ? "بند تكلفة جديد" : "New Cost Entry"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>{ar ? "النوع" : "Type"}</label>
              <select className={inputCls} value={costType} onChange={e => setCostType(e.target.value)}>
                {COST_TYPES.map(t => <option key={t.value} value={t.value}>{ar ? t.ar : t.en}</option>)}
              </select></div>
            <div><label className={labelCls}>{ar ? "التاريخ" : "Date"}</label>
              <input type="date" className={inputCls} value={date} onChange={e => setDate(e.target.value)} /></div>
          </div>
          <div><label className={labelCls}>{ar ? "الوصف" : "Description"}</label>
            <input className={inputCls} value={desc} onChange={e => setDesc(e.target.value)} placeholder={ar ? "مثال: خشب MDF 18mm" : "e.g. MDF 18mm board"} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className={labelCls}>{ar ? "الكمية" : "Qty"}</label>
              <input type="number" className={inputCls} value={qty} onChange={e => setQty(e.target.value)} /></div>
            <div><label className={labelCls}>{ar ? "سعر الوحدة" : "Unit Cost"}</label>
              <input type="number" className={inputCls} value={unitCost} onChange={e => setUnitCost(e.target.value)} /></div>
            <div><label className={labelCls}>{ar ? "الإجمالي" : "Total"}</label>
              <input className={inputCls + " bg-muted/30 font-medium"} value={`${fmtMoney(total)} EGP`} readOnly /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>{ar ? "أمر البيع" : "Sales Order"}</label>
              <select className={inputCls} value={soId} onChange={e => setSOId(e.target.value)}>
                <option value="">{ar ? "— اختياري —" : "— Optional —"}</option>
                {salesOrders.map(s => <option key={s.id} value={s.id}>{(s as any).order_number || s.id.slice(0, 8)} — {s.title}</option>)}
              </select></div>
            <div><label className={labelCls}>{ar ? "أمر الإنتاج" : "Production Order"}</label>
              <select className={inputCls} value={poId} onChange={e => setPOId(e.target.value)}>
                <option value="">{ar ? "— اختياري —" : "— Optional —"}</option>
                {prodOrders.map(p => <option key={p.id} value={p.id}>{p.po_number} — {p.title}</option>)}
              </select></div>
          </div>
          <div><label className={labelCls}>{ar ? "المورد" : "Supplier"}</label>
            <input className={inputCls} value={supplier} onChange={e => setSupplier(e.target.value)} /></div>
          <div><label className={labelCls}>{ar ? "ملاحظات" : "Notes"}</label>
            <input className={inputCls} value={notes} onChange={e => setNotes(e.target.value)} /></div>
        </div>
        <div className="px-6 py-4 border-t border-border/40 shrink-0 flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border/60 text-[13px] font-medium hover:bg-muted/50">{ar ? "إلغاء" : "Cancel"}</button>
          <button onClick={handleSave} disabled={loading || !desc.trim() || !unitCost} className={btnPrimary + " flex-1 h-10"}>
            {loading && <Loader2 size={12} className="animate-spin" />} {ar ? "حفظ" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Branch Modal ─────────────────────────────────────────

function BranchModal({ onClose, onSaved, editBranch, ar, wid }: {
  onClose: () => void; onSaved: () => void;
  editBranch: Branch | null; ar: boolean; wid: string;
}) {
  const [code, setCode] = useState(editBranch?.branch_code || "");
  const [name, setName] = useState(editBranch?.name || "");
  const [nameAr, setNameAr] = useState(editBranch?.name_ar || "");
  const [address, setAddress] = useState(editBranch?.address || "");
  const [phone, setPhone] = useState(editBranch?.phone || "");
  const [manager, setManager] = useState(editBranch?.manager_name || "");
  const [bType, setBType] = useState(editBranch?.branch_type || "factory");
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!name.trim() || !code.trim()) return;
    setLoading(true);
    const ds = getDataSource();
    const payload: any = {
      workspace_id: wid, branch_code: code.trim(), name: name.trim(),
      name_ar: nameAr || null, address: address || null,
      phone: phone || null, manager_name: manager || null,
      branch_type: bType, is_active: true, metadata: {},
    };
    if (editBranch) await ds.branches.update(wid, editBranch.id, payload);
    else await ds.branches.create(wid, payload);
    setLoading(false); onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background rounded-2xl border border-border/60 shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-border/40 shrink-0 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>
            {editBranch ? (ar ? "تعديل فرع" : "Edit Branch") : (ar ? "فرع جديد" : "New Branch")}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>{ar ? "كود الفرع" : "Branch Code"}</label>
              <input className={inputCls} value={code} onChange={e => setCode(e.target.value)} placeholder="BR-01" /></div>
            <div><label className={labelCls}>{ar ? "النوع" : "Type"}</label>
              <select className={inputCls} value={bType} onChange={e => setBType(e.target.value)}>
                {BRANCH_TYPES.map(t => <option key={t.value} value={t.value}>{ar ? t.ar : t.en}</option>)}
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>{ar ? "الاسم (EN)" : "Name"}</label>
              <input className={inputCls} value={name} onChange={e => setName(e.target.value)} /></div>
            <div><label className={labelCls}>{ar ? "الاسم (AR)" : "Name (Arabic)"}</label>
              <input className={inputCls} dir="rtl" value={nameAr} onChange={e => setNameAr(e.target.value)} /></div>
          </div>
          <div><label className={labelCls}>{ar ? "العنوان" : "Address"}</label>
            <input className={inputCls} value={address} onChange={e => setAddress(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>{ar ? "الهاتف" : "Phone"}</label>
              <input className={inputCls} value={phone} onChange={e => setPhone(e.target.value)} /></div>
            <div><label className={labelCls}>{ar ? "المدير" : "Manager"}</label>
              <input className={inputCls} value={manager} onChange={e => setManager(e.target.value)} /></div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border/40 shrink-0 flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border/60 text-[13px] font-medium hover:bg-muted/50">{ar ? "إلغاء" : "Cancel"}</button>
          <button onClick={handleSave} disabled={loading || !name.trim() || !code.trim()} className={btnPrimary + " flex-1 h-10"}>
            {loading && <Loader2 size={12} className="animate-spin" />} {ar ? "حفظ" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Document Generator ───────────────────────────────────

function DocumentGenerator({ salesOrders, costEntries, ar }: {
  salesOrders: WorkItem[]; costEntries: CostEntry[]; ar: boolean;
}) {
  const [selSO, setSelSO] = useState("");
  const so = salesOrders.find(s => s.id === selSO);
  const costs = costEntries.filter(c => c.sales_order_id === selSO);
  const totalCost = costs.reduce((s, c) => s + c.total_cost, 0);

  function handlePrint() {
    window.print();
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <select className={inputCls + " max-w-xs"} value={selSO} onChange={e => setSelSO(e.target.value)}>
          <option value="">{ar ? "— اختر أمر بيع —" : "— Select Sales Order —"}</option>
          {salesOrders.map(s => <option key={s.id} value={s.id}>{(s as any).order_number || s.id.slice(0, 8)} — {s.title}</option>)}
        </select>
        {selSO && <button onClick={handlePrint} className={btnPrimary + " h-10"}><Printer size={14} /> {ar ? "طباعة" : "Print"}</button>}
      </div>
      {so ? (
        <div className="border border-border/40 rounded-xl p-6 bg-white print:border-0 print:shadow-none print:p-0" id="print-area">
          <div className="flex items-start justify-between mb-6 pb-4 border-b border-border/30">
            <div>
              <h2 className="text-[20px] font-bold" style={{ fontFamily: "var(--app-font-serif)" }}>THOTH</h2>
              <p className="text-[11px] text-muted-foreground">{ar ? "نظام إدارة مصانع الأثاث" : "Furniture Manufacturing ERP"}</p>
            </div>
            <div className="text-right">
              <p className="text-[16px] font-semibold">{ar ? "فاتورة / كشف حساب" : "Invoice / Statement"}</p>
              <p className="text-[11px] text-muted-foreground">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-[10px] text-muted-foreground mb-1">{ar ? "العميل" : "Customer"}</p>
              <p className="text-[14px] font-medium">{(so as any).customer_name || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-1">{ar ? "رقم الأمر" : "Order #"}</p>
              <p className="text-[14px] font-medium">{(so as any).order_number || so.id.slice(0, 8)}</p>
            </div>
          </div>
          <p className="text-[13px] font-semibold mb-2">{so.title}</p>
          {costs.length > 0 && (
            <table className="w-full text-[12px] mb-4">
              <thead>
                <tr className="border-b border-border/40 text-muted-foreground text-left">
                  <th className="py-2 font-medium">{ar ? "البند" : "Item"}</th>
                  <th className="py-2 font-medium">{ar ? "النوع" : "Type"}</th>
                  <th className="py-2 font-medium text-right">{ar ? "الكمية" : "Qty"}</th>
                  <th className="py-2 font-medium text-right">{ar ? "السعر" : "Unit"}</th>
                  <th className="py-2 font-medium text-right">{ar ? "الإجمالي" : "Total"}</th>
                </tr>
              </thead>
              <tbody>
                {costs.map(c => {
                  const ct = COST_TYPES.find(t => t.value === c.cost_type);
                  return (
                    <tr key={c.id} className="border-b border-border/20">
                      <td className="py-2">{c.description}</td>
                      <td className="py-2">{ct ? (ar ? ct.ar : ct.en) : c.cost_type}</td>
                      <td className="py-2 text-right">{c.quantity}</td>
                      <td className="py-2 text-right">{fmtMoney(c.unit_cost)}</td>
                      <td className="py-2 text-right font-medium">{fmtMoney(c.total_cost)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border/60">
                  <td colSpan={4} className="py-2 font-semibold text-right">{ar ? "الإجمالي" : "Total"}</td>
                  <td className="py-2 font-bold text-right">{fmtMoney(totalCost)} EGP</td>
                </tr>
              </tfoot>
            </table>
          )}
          {costs.length === 0 && <p className="text-[12px] text-muted-foreground py-4">{ar ? "مفيش بنود تكلفة مسجلة لهذا الأمر" : "No cost entries for this order"}</p>}
        </div>
      ) : (
        <div className="py-16 text-center">
          <FileText size={28} className="text-muted-foreground/20 mx-auto mb-2" />
          <p className="text-[13px] text-muted-foreground/50">{ar ? "اختر أمر بيع لإنشاء المستند" : "Select a sales order to generate document"}</p>
        </div>
      )}
    </div>
  );
}

// ─── Workshop Board ───────────────────────────────────────

function WorkshopBoard({ prodOrders, ar }: { prodOrders: ProdOrder[]; ar: boolean }) {
  const stages = [
    { key: "cutting",     en: "Cutting",      ar: "التقطيع",   color: "border-blue-300 bg-blue-50" },
    { key: "edgebanding", en: "Edgebanding",   ar: "الكنار",    color: "border-amber-300 bg-amber-50" },
    { key: "drilling",    en: "Drilling",      ar: "التخريم",   color: "border-purple-300 bg-purple-50" },
    { key: "assembly",    en: "Assembly",      ar: "التجميع",   color: "border-cyan-300 bg-cyan-50" },
    { key: "finishing",   en: "Finishing",      ar: "الدهان",    color: "border-orange-300 bg-orange-50" },
    { key: "qc",          en: "QC",            ar: "الجودة",    color: "border-emerald-300 bg-emerald-50" },
    { key: "packing",     en: "Packing",       ar: "التغليف",   color: "border-indigo-300 bg-indigo-50" },
  ];

  const activeOrders = prodOrders.filter(p => !["pending","cancelled","delivered"].includes(p.status));

  function getStage(po: ProdOrder): string {
    return po.status || "pending";
  }

  return (
    <div>
      <p className="text-[12px] text-muted-foreground mb-4">{ar ? "لوحة الورشة — عرض مباشر لحالة الإنتاج" : "Workshop Board — live production status overview"}</p>
      {activeOrders.length === 0 ? (
        <div className="py-16 text-center">
          <Factory size={28} className="text-muted-foreground/20 mx-auto mb-2" />
          <p className="text-[13px] text-muted-foreground/50">{ar ? "مفيش أوامر إنتاج نشطة" : "No active production orders"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {stages.map(stage => {
            const orders = activeOrders.filter(p => getStage(p) === stage.key);
            return (
              <div key={stage.key} className={`border-2 rounded-xl p-3 min-h-[120px] ${stage.color}`}>
                <p className="text-[11px] font-semibold mb-2 text-center">{ar ? stage.ar : stage.en}</p>
                <p className="text-[18px] font-bold text-center mb-2" style={{ fontFamily: "var(--app-font-serif)" }}>{orders.length}</p>
                {orders.slice(0, 3).map(o => (
                  <div key={o.id} className="bg-white/80 rounded-lg px-2 py-1.5 mb-1.5 border border-white">
                    <p className="text-[10px] font-mono text-muted-foreground">{o.po_number}</p>
                    <p className="text-[11px] font-medium truncate">{o.title}</p>
                    {o.customer_name && <p className="text-[9px] text-muted-foreground truncate">{o.customer_name}</p>}
                  </div>
                ))}
                {orders.length > 3 && <p className="text-[9px] text-center text-muted-foreground">+{orders.length - 3} {ar ? "أكثر" : "more"}</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* Summary bar */}
      <div className="mt-6 flex items-center gap-4 flex-wrap">
        <span className="text-[12px] font-medium">{ar ? "إجمالي نشط:" : "Total Active:"} {activeOrders.length}</span>
        {stages.map(s => {
          const c = activeOrders.filter(p => getStage(p) === s.key).length;
          if (c === 0) return null;
          return <span key={s.key} className="text-[11px] text-muted-foreground">{ar ? s.ar : s.en}: {c}</span>;
        })}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────

export default function AdvancedTools() {
  const { lang } = useLanguage();
  const { workspace } = useAuth();
  const ar = lang === "ar";

  const [loading, setLoading] = useState(true);
  const [costEntries, setCostEntries] = useState<CostEntry[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [prodOrders, setProdOrders] = useState<ProdOrder[]>([]);
  const [salesOrders, setSalesOrders] = useState<WorkItem[]>([]);
  const [tab, setTab] = useState<"costs" | "profit" | "docs" | "workshop" | "branches">("costs");
  const [costModal, setCostModal] = useState(false);
  const [branchModal, setBranchModal] = useState(false);
  const [editBranch, setEditBranch] = useState<Branch | null>(null);
  const [filterType, setFilterType] = useState("all");

  async function loadAll() {
    if (isDemoMode || !workspace?.id) { setLoading(false); return; }
    const ds = getDataSource();
    const [c, b, p, s] = await Promise.all([
      ds.cost_entries.list(workspace.id),
      ds.branches.list(workspace.id),
      ds.production_orders.list(workspace.id),
      ds.work_items.list(workspace.id),
    ]);
    setCostEntries(c as CostEntry[]);
    setBranches(b as Branch[]);
    setProdOrders(p as ProdOrder[]);
    setSalesOrders((s as WorkItem[]).filter((w: any) => w.type === "sales_order"));
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, [workspace?.id]);

  // Cost analysis
  const filteredCosts = useMemo(() => {
    if (filterType === "all") return costEntries;
    return costEntries.filter(c => c.cost_type === filterType);
  }, [costEntries, filterType]);

  const totalCosts = costEntries.reduce((s, c) => s + c.total_cost, 0);
  const costByType = COST_TYPES.map(t => ({
    ...t,
    total: costEntries.filter(c => c.cost_type === t.value).reduce((s, c) => s + c.total_cost, 0),
    count: costEntries.filter(c => c.cost_type === t.value).length,
  }));

  // Profit analysis
  const soRevenue = salesOrders.reduce((s, so) => s + ((so as any).total_amount || 0), 0);
  const grossProfit = soRevenue - totalCosts;
  const marginPct = soRevenue > 0 ? Math.round((grossProfit / soRevenue) * 100) : 0;

  function handleExportCosts() {
    exportCSV(costEntries.map(c => ({
      date: c.date, type: c.cost_type, description: c.description,
      quantity: c.quantity, unit_cost: c.unit_cost, total: c.total_cost,
      supplier: c.supplier,
    })), `thoth-costs-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  async function deleteBranch(id: string) {
    const ds = getDataSource();
    await ds.branches.remove(workspace?.id || "", id);
    loadAll();
  }

  async function deleteCost(id: string) {
    const ds = getDataSource();
    await ds.cost_entries.remove(workspace?.id || "", id);
    loadAll();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight" style={{ fontFamily: "var(--app-font-serif)" }}>
            {ar ? "أدوات متقدمة" : "Advanced Tools"}
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">{ar ? "تحليل التكاليف والأرباح والمستندات" : "Cost Analysis, Profit Reports & Documents"}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {[
          { id: "costs" as const, en: "Cost Analysis", ar: "تحليل التكاليف", icon: Calculator },
          { id: "profit" as const, en: "Profit Reports", ar: "تقارير الأرباح", icon: TrendingUp },
          { id: "docs" as const, en: "Documents", ar: "المستندات", icon: FileText },
          { id: "workshop" as const, en: "Workshop Board", ar: "لوحة الورشة", icon: Factory },
          { id: "branches" as const, en: "Branches", ar: "الفروع", icon: Building2 },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 rounded-xl text-[13px] font-medium transition-colors flex items-center gap-2 whitespace-nowrap
              ${tab === t.id ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}>
            <t.icon size={15} />{ar ? t.ar : t.en}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {/* ══ Cost Analysis ══ */}
          {tab === "costs" && (
            <div>
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                {costByType.map(ct => {
                  const CtIcon = ct.icon;
                  return (
                    <div key={ct.value} className={`border rounded-xl p-3 ${ct.color}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <CtIcon size={12} />
                        <span className="text-[10px] font-medium">{ar ? ct.ar : ct.en}</span>
                      </div>
                      <p className="text-[16px] font-bold tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>{fmtMoney(ct.total)}</p>
                      <p className="text-[9px] opacity-60">{ct.count} {ar ? "بند" : "entries"}</p>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-1 overflow-x-auto">
                  {[{ v: "all", en: "All", ar: "الكل" }, ...COST_TYPES.map(t => ({ v: t.value, en: t.en, ar: t.ar }))].map(g => (
                    <button key={g.v} onClick={() => setFilterType(g.v)} className={`px-2.5 py-2 rounded-lg text-[11px] font-medium whitespace-nowrap ${filterType === g.v ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"}`}>{ar ? g.ar : g.en}</button>
                  ))}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={handleExportCosts} className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground"><Download size={14} /></button>
                  <button onClick={() => setCostModal(true)} className={btnPrimary + " h-10"}><Plus size={14} /> {ar ? "بند جديد" : "Add Cost"}</button>
                </div>
              </div>

              {filteredCosts.length === 0 ? (
                <div className="py-16 text-center">
                  <Calculator size={28} className="text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-[13px] text-muted-foreground/50">{ar ? "مفيش بنود تكاليف لسه" : "No cost entries yet"}</p>
                  <button onClick={() => setCostModal(true)} className={btnPrimary + " h-10 mt-4"}><Plus size={14} /> {ar ? "أضف بند" : "Add Entry"}</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredCosts.map(c => {
                    const ct = COST_TYPES.find(t => t.value === c.cost_type)!;
                    const CtIcon = ct.icon;
                    return (
                      <div key={c.id} className="flex items-center gap-3 px-4 py-3 border border-border/40 rounded-xl bg-background">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${ct.color}`}><CtIcon size={14} /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium">{c.description}</p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span>{ar ? ct.ar : ct.en}</span>
                            {c.supplier && <span>• {c.supplier}</span>}
                            {c.date && <span>• {c.date}</span>}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[14px] font-semibold tabular-nums">{fmtMoney(c.total_cost)} <span className="text-[10px] text-muted-foreground">EGP</span></p>
                          <p className="text-[9px] text-muted-foreground">{c.quantity} × {fmtMoney(c.unit_cost)}</p>
                        </div>
                        <button onClick={() => deleteCost(c.id)} className="text-rose-400 hover:opacity-70 p-1 shrink-0"><Trash2 size={12} /></button>
                      </div>
                    );
                  })}
                  <div className="flex justify-end pt-2">
                    <span className="text-[14px] font-bold">{ar ? "الإجمالي:" : "Total:"} {fmtMoney(filteredCosts.reduce((s, c) => s + c.total_cost, 0))} EGP</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ Profit Reports ══ */}
          {tab === "profit" && (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="border border-border/40 rounded-xl p-4 bg-background">
                  <p className="text-[11px] text-muted-foreground mb-1">{ar ? "إجمالي الإيرادات" : "Total Revenue"}</p>
                  <p className="text-[20px] font-semibold tabular-nums text-emerald-600" style={{ fontFamily: "var(--app-font-serif)" }}>{fmtMoney(soRevenue)}</p>
                  <p className="text-[9px] text-muted-foreground">{salesOrders.length} {ar ? "أمر بيع" : "orders"}</p>
                </div>
                <div className="border border-border/40 rounded-xl p-4 bg-background">
                  <p className="text-[11px] text-muted-foreground mb-1">{ar ? "إجمالي التكاليف" : "Total Costs"}</p>
                  <p className="text-[20px] font-semibold tabular-nums text-rose-600" style={{ fontFamily: "var(--app-font-serif)" }}>{fmtMoney(totalCosts)}</p>
                  <p className="text-[9px] text-muted-foreground">{costEntries.length} {ar ? "بند" : "entries"}</p>
                </div>
                <div className="border border-border/40 rounded-xl p-4 bg-background">
                  <p className="text-[11px] text-muted-foreground mb-1">{ar ? "صافي الربح" : "Gross Profit"}</p>
                  <p className={`text-[20px] font-semibold tabular-nums ${grossProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`} style={{ fontFamily: "var(--app-font-serif)" }}>
                    {fmtMoney(grossProfit)}
                  </p>
                  <p className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                    {grossProfit >= 0 ? <ArrowUpRight size={9} className="text-emerald-500" /> : <ArrowDownRight size={9} className="text-rose-500" />}
                    EGP
                  </p>
                </div>
                <div className="border border-border/40 rounded-xl p-4 bg-background">
                  <p className="text-[11px] text-muted-foreground mb-1">{ar ? "هامش الربح" : "Profit Margin"}</p>
                  <p className={`text-[20px] font-semibold tabular-nums ${marginPct >= 20 ? "text-emerald-600" : marginPct >= 10 ? "text-amber-600" : "text-rose-600"}`} style={{ fontFamily: "var(--app-font-serif)" }}>
                    {marginPct}%
                  </p>
                  <p className="text-[9px] text-muted-foreground">{marginPct >= 20 ? (ar ? "ممتاز" : "Healthy") : marginPct >= 10 ? (ar ? "مقبول" : "Fair") : (ar ? "منخفض" : "Low")}</p>
                </div>
              </div>

              {/* Cost breakdown bar */}
              <div className="border border-border/40 rounded-xl p-5 mb-6">
                <h3 className="text-[14px] font-semibold mb-3" style={{ fontFamily: "var(--app-font-serif)" }}>{ar ? "توزيع التكاليف" : "Cost Breakdown"}</h3>
                {totalCosts > 0 ? (
                  <div className="space-y-3">
                    {costByType.filter(ct => ct.total > 0).sort((a, b) => b.total - a.total).map(ct => {
                      const pct = Math.round((ct.total / totalCosts) * 100);
                      return (
                        <div key={ct.value}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[12px] font-medium">{ar ? ct.ar : ct.en}</span>
                            <span className="text-[12px] text-muted-foreground">{fmtMoney(ct.total)} EGP ({pct}%)</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${ct.color.split(" ")[0].replace("50", "400")}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[12px] text-muted-foreground/50 py-4">{ar ? "أضف بنود تكلفة لعرض التوزيع" : "Add cost entries to see breakdown"}</p>
                )}
              </div>

              {/* Per-order profit */}
              <div className="border border-border/40 rounded-xl p-5">
                <h3 className="text-[14px] font-semibold mb-3" style={{ fontFamily: "var(--app-font-serif)" }}>{ar ? "ربح كل أمر" : "Per-Order Profit"}</h3>
                {salesOrders.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground/50 py-4">{ar ? "مفيش أوامر بيع" : "No sales orders"}</p>
                ) : (
                  <div className="space-y-2">
                    {salesOrders.slice(0, 10).map(so => {
                      const rev = (so as any).total_amount || 0;
                      const cost = costEntries.filter(c => c.sales_order_id === so.id).reduce((s, c) => s + c.total_cost, 0);
                      const profit = rev - cost;
                      const margin = rev > 0 ? Math.round((profit / rev) * 100) : 0;
                      return (
                        <div key={so.id} className="flex items-center gap-3 px-4 py-3 border border-border/30 rounded-xl">
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium truncate">{so.title}</p>
                            <p className="text-[10px] text-muted-foreground">{(so as any).order_number || so.id.slice(0, 8)}</p>
                          </div>
                          <div className="text-right text-[11px] space-y-0.5">
                            <p className="text-emerald-600">{ar ? "إيراد:" : "Rev:"} {fmtMoney(rev)}</p>
                            <p className="text-rose-500">{ar ? "تكلفة:" : "Cost:"} {fmtMoney(cost)}</p>
                          </div>
                          <div className="text-right shrink-0 w-20">
                            <p className={`text-[14px] font-bold tabular-nums ${profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{fmtMoney(profit)}</p>
                            <p className={`text-[10px] ${margin >= 20 ? "text-emerald-500" : "text-amber-500"}`}>{margin}%</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ Documents ══ */}
          {tab === "docs" && <DocumentGenerator salesOrders={salesOrders} costEntries={costEntries} ar={ar} />}

          {/* ══ Workshop Board ══ */}
          {tab === "workshop" && <WorkshopBoard prodOrders={prodOrders} ar={ar} />}

          {/* ══ Branches ══ */}
          {tab === "branches" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[14px] font-semibold">{ar ? "إدارة الفروع" : "Branch Management"}</h3>
                <button onClick={() => { setEditBranch(null); setBranchModal(true); }} className={btnPrimary + " h-10"}><Plus size={14} /> {ar ? "فرع جديد" : "New Branch"}</button>
              </div>
              {branches.length === 0 ? (
                <div className="py-16 text-center">
                  <Building2 size={28} className="text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-[13px] text-muted-foreground/50">{ar ? "مفيش فروع لسه" : "No branches yet"}</p>
                  <button onClick={() => setBranchModal(true)} className={btnPrimary + " h-10 mt-4"}><Plus size={14} /> {ar ? "أضف فرع" : "Add Branch"}</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {branches.map(b => {
                    const bt = BRANCH_TYPES.find(t => t.value === b.branch_type);
                    return (
                      <div key={b.id} className="border border-border/40 rounded-xl p-5 bg-background">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-mono text-muted-foreground">{b.branch_code}</span>
                              {bt && <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{ar ? bt.ar : bt.en}</span>}
                              {!b.is_active && <span className="text-[10px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full">{ar ? "غير نشط" : "Inactive"}</span>}
                            </div>
                            <p className="text-[15px] font-medium" style={{ fontFamily: "var(--app-font-serif)" }}>{ar && b.name_ar ? b.name_ar : b.name}</p>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => { setEditBranch(b); setBranchModal(true); }} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground"><Edit3 size={12} /></button>
                            <button onClick={() => deleteBranch(b.id)} className="p-1.5 rounded-lg hover:bg-muted/50 text-rose-400"><Trash2 size={12} /></button>
                          </div>
                        </div>
                        <div className="space-y-1 text-[11px] text-muted-foreground">
                          {b.address && <p className="flex items-center gap-1"><MapPin size={10} />{b.address}</p>}
                          {b.phone && <p className="flex items-center gap-1"><Phone size={10} />{b.phone}</p>}
                          {b.manager_name && <p className="flex items-center gap-1"><User size={10} />{b.manager_name}</p>}
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

      {costModal && <CostModal onClose={() => setCostModal(false)} onSaved={() => { setCostModal(false); loadAll(); }} prodOrders={prodOrders} salesOrders={salesOrders} ar={ar} wid={workspace?.id || ""} />}
      {branchModal && <BranchModal onClose={() => { setBranchModal(false); setEditBranch(null); }} onSaved={() => { setBranchModal(false); setEditBranch(null); loadAll(); }} editBranch={editBranch} ar={ar} wid={workspace?.id || ""} />}
    </div>
  );
}
