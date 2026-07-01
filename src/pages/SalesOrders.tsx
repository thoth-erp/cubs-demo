/**
 * Sales Orders — Connected Furniture Engine
 *
 * طلبات العملاء — ويزارد 6 خطوات متصل بالمنتجات والمصنع
 * 6-Step Wizard: Customer → Product Selection → Details → Mfg Route → Cost/Time → Confirm
 */

import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { isDemoMode } from "../lib/supabase";
import { getDataSource } from "../lib/data-source";
import { generateCode } from "../lib/code-generator";
import { exportCSV } from "../lib/csv-export";
import type { Database } from "../lib/database.types";
import ConnectedSearch, { type SearchResult } from "../components/ConnectedSearch";
import {
  type SOItem, type SOMeta, type SOPayment, type ProductMeta, type Priority,
  PRIORITIES, PRODUCT_CATEGORIES, calculateTotalCost, calculateCriticalPath,
  getSOWarnings, uid,
} from "../lib/furniture-engine";
import {
  Plus, Search, X, Loader2, AlertCircle, Download, Info,
  CheckCircle2, Clock, ChevronRight, ChevronLeft, Calendar,
  FileText, User, Building2, Package, DollarSign,
  Wrench, Truck, ClipboardCheck, AlertTriangle, Trash2,
} from "lucide-react";
import { ConfirmDeleteModal } from "../components/ConfirmDeleteModal";
import VisualStages from "../components/VisualStages";
import { WarningList, WorkflowBlockerCard, type WorkflowBlocker } from "../components/SmartAlerts";

type WorkItem = Database["public"]["Tables"]["work_items"]["Row"];
type Org = Database["public"]["Tables"]["organizations"]["Row"];
type Resource = Database["public"]["Tables"]["resources"]["Row"];
type Person = Database["public"]["Tables"]["people"]["Row"];

// ─── Status & Helpers ────────────────────────────────────

const SO_STATUSES = [
  { value: "draft",       en: "Draft",         ar: "مسودة",         pill: "bg-slate-100 text-slate-600" },
  { value: "approved",    en: "Confirmed",      ar: "مؤكد",          pill: "bg-blue-100 text-blue-600" },
  { value: "in_progress", en: "In Production",  ar: "في التصنيع",    pill: "bg-violet-100 text-violet-600" },
  { value: "review",      en: "Ready",          ar: "جاهز للتسليم",  pill: "bg-amber-100 text-amber-700" },
  { value: "sent",        en: "Delivered",      ar: "تم التسليم",    pill: "bg-emerald-100 text-emerald-700" },
  { value: "done",        en: "Closed",         ar: "مقفول",         pill: "bg-emerald-200 text-emerald-800" },
  { value: "cancelled",   en: "Cancelled",      ar: "ملغي",          pill: "bg-muted text-muted-foreground" },
];

const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium px-5 hover:opacity-90 transition-opacity disabled:opacity-40";
const inputCls = "w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20";
const labelCls = "text-[11.5px] text-muted-foreground font-medium mb-1 block";
const smallInput = "w-full h-8 px-2.5 rounded-lg border border-border/50 bg-background text-[12px] focus:outline-none focus:ring-1 focus:ring-primary/20";

function getM(w: WorkItem): SOMeta { return (w.metadata ?? {}) as SOMeta; }

function calcTotal(items: SOItem[]): number { return items.reduce((s, i) => s + i.qty * i.unitPrice, 0); }
function calcPaid(payments: SOPayment[]): number { return payments.reduce((s, p) => s + p.amount, 0); }

function genSONumber(): string {
  const d = new Date();
  const seq = Math.floor(Math.random() * 9000) + 1000;
  return `SO-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}-${seq}`;
}

function fmt(n: number): string { return n.toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }

// ─── Wizard Steps ────────────────────────────────────────

const WIZARD_STEPS = [
  { en: "Customer",         ar: "العميل",            icon: User },
  { en: "Products",         ar: "المنتجات",          icon: Package },
  { en: "Details",          ar: "التفاصيل",          icon: FileText },
  { en: "Mfg Route",        ar: "خط التصنيع",        icon: Wrench },
  { en: "Cost & Time",      ar: "التكلفة والوقت",    icon: DollarSign },
  { en: "Confirm",          ar: "تأكيد",             icon: CheckCircle2 },
];

// ─── Sales Order Wizard ──────────────────────────────────

function SOWizard({ ar, currency, searchResults, products, onClose, onAdd }: {
  ar: boolean; currency: string;
  searchResults: SearchResult[];
  products: Resource[];
  onClose: () => void;
  onAdd: (w: WorkItem) => void;
}) {
  const { workspace } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 0: Customer
  const [customerType, setCustomerType] = useState<"company" | "individual">("company");
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [companyName, setCompanyName] = useState("");

  // Step 1: Products
  const [items, setItems] = useState<SOItem[]>([]);

  // Step 2: Details
  const [soNumber] = useState(() => generateCode("sales_order"));
  const [projectName, setProjectName] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  // Step 3: Manufacturing route
  const [mfgRoute, setMfgRoute] = useState("standard");

  // Discount & tax
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [orderDiscountType, setOrderDiscountType] = useState<"pct" | "fixed">("pct");
  const [taxRate, setTaxRate] = useState(0);

  // Step 4: Payments
  const [payments, setPayments] = useState<SOPayment[]>([]);

  // Step 5: Readiness
  const [customerConfirmed, setCustomerConfirmed] = useState(false);
  const [measurementsDone, setMeasurementsDone] = useState(false);
  const [designApproved, setDesignApproved] = useState(false);
  const [materialsAvailable, setMaterialsAvailable] = useState(false);
  const [depositReceived, setDepositReceived] = useState(false);

  const subtotal = useMemo(() => calcTotal(items), [items]);
  const orderDiscAmt = useMemo(() => {
    if (orderDiscount <= 0) return 0;
    return orderDiscountType === "fixed" ? Math.min(orderDiscount, subtotal) : subtotal * (Math.min(orderDiscount, 100) / 100);
  }, [orderDiscount, orderDiscountType, subtotal]);
  const taxAmt = useMemo(() => (subtotal - orderDiscAmt) * ((taxRate || 0) / 100), [subtotal, orderDiscAmt, taxRate]);
  const totalAmount = useMemo(() => subtotal - orderDiscAmt + taxAmt, [subtotal, orderDiscAmt, taxAmt]);
  const totalPaid = useMemo(() => calcPaid(payments), [payments]);

  // Estimate time from product stages
  const estimatedDays = useMemo(() => {
    let maxDays = 0;
    for (const item of items) {
      if (item.stages_snapshot?.length) {
        const cp = calculateCriticalPath(item.stages_snapshot);
        maxDays = Math.max(maxDays, cp.totalDays * item.qty);
      }
    }
    return maxDays || 0;
  }, [items]);

  const estimatedCost = useMemo(() => {
    let total = 0;
    for (const item of items) {
      if (item.bom_snapshot?.length && item.stages_snapshot?.length) {
        const c = calculateTotalCost(item.bom_snapshot, item.stages_snapshot);
        total += c.totalCost * item.qty;
      }
    }
    return total;
  }, [items]);

  const warnings = useMemo(() => {
    const meta: SOMeta = { items, total_paid: totalPaid, customer_confirmed: customerConfirmed, measurements_done: measurementsDone };
    return getSOWarnings(meta);
  }, [items, totalPaid, customerConfirmed, measurementsDone]);

  function handleCustomerSelect(result: SearchResult) {
    setCustomerId(result.id);
    setCustomerName(result.name);
    if (result.phone) setPhone(result.phone);
    if (result.email) setEmail(result.email);
    if (result.type === "organization") {
      setCustomerType("company");
      setCompanyName(result.name);
    } else {
      setCustomerType("individual");
    }
  }

  function addProductFromCatalog(product: Resource) {
    const pm = (product.metadata ?? {}) as ProductMeta;
    setItems(prev => [...prev, {
      id: uid(),
      product_id: product.id,
      product_name: ar ? (product.name_ar || product.name_en) : product.name_en,
      product_sku: pm.sku,
      description: pm.description,
      qty: 1,
      unitPrice: pm.suggested_price || 0,
      width: pm.width,
      height: pm.height,
      depth: pm.depth,
      material: pm.main_material,
      finish: pm.finish,
      bom_snapshot: pm.bom,
      stages_snapshot: pm.stages,
    }]);
  }

  function addManualItem() {
    setItems(prev => [...prev, {
      id: uid(), product_name: "", qty: 1, unitPrice: 0,
    }]);
  }

  function removeItem(i: number) { setItems(prev => prev.filter((_, idx) => idx !== i)); }
  function updateItem(i: number, item: SOItem) { setItems(prev => prev.map((it, idx) => idx === i ? item : it)); }

  function addPayment() {
    setPayments(prev => [...prev, { id: uid(), amount: 0, date: new Date().toISOString().slice(0, 10), method: "cash" }]);
  }
  function removePayment(i: number) { setPayments(prev => prev.filter((_, idx) => idx !== i)); }
  function updatePayment(i: number, p: SOPayment) { setPayments(prev => prev.map((pay, idx) => idx === i ? p : pay)); }

  async function handleSubmit() {
    if (!workspace?.id && !isDemoMode) return;
    setLoading(true);
    setError("");
    try {
      const meta: SOMeta = {
        so_number: soNumber, customer_type: customerType,
        customer_id: customerId, customer_name: customerName,
        contact_person: contactPerson, phone, email, address, city,
        company_name: companyName, project_name: projectName,
        priority, items, payments,
        customer_confirmed: customerConfirmed, measurements_done: measurementsDone,
        design_approved: designApproved, materials_available: materialsAvailable,
        deposit_received: depositReceived,
        subtotal, order_discount: orderDiscount, order_discount_type: orderDiscountType, tax_rate: taxRate,
        total_amount: totalAmount, total_paid: totalPaid,
        estimated_days: estimatedDays, estimated_cost: estimatedCost,
        manufacturing_route: mfgRoute,
      };
      const res = await getDataSource().work_items.create(workspace?.id || "demo", {
        workspace_id: workspace?.id || "demo",
        title_en: `${soNumber} — ${customerName || projectName}`,
        title_ar: null, type: "sales_order", status: "draft",
        priority: priority === "critical" ? "critical" : priority === "high" ? "urgent" : priority,
        due_date: dueDate || null, total_amount: totalAmount,
        metadata: meta as any,
      } as any);
      if (res) { onAdd(res); onClose(); }
      else setError(ar ? "حصل خطأ" : "Failed to create order");
    } catch { setError(ar ? "حصل خطأ" : "Error creating order"); }
    setLoading(false);
  }

  // Product search for step 1
  const [productSearch, setProductSearch] = useState("");
  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase().trim();
    if (!q) return products.slice(0, 10);
    return products.filter(p => {
      const pm = (p.metadata ?? {}) as ProductMeta;
      return p.name_en.toLowerCase().includes(q) || (pm.sku ?? "").toLowerCase().includes(q) || (pm.category ?? "").toLowerCase().includes(q);
    }).slice(0, 10);
  }, [products, productSearch]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-background border border-border/40 rounded-2xl shadow-2xl w-full max-w-[800px] max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-border/40 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-medium" style={{ fontFamily: "var(--app-font-serif)" }}>
              {ar ? "طلب عميل جديد — الويزارد المتصل" : "New Sales Order — Connected Wizard"}
            </h2>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted"><X size={16} /></button>
          </div>
          <div className="flex items-center gap-1">
            {WIZARD_STEPS.map((s, i) => {
              const Icon = s.icon;
              const active = i === step;
              const done = i < step;
              return (
                <button key={i} onClick={() => { if (i <= step) setStep(i); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${active ? "bg-primary text-primary-foreground" : done ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"}`}>
                  {done ? <CheckCircle2 size={12} /> : <Icon size={12} />}
                  <span className="hidden md:inline">{ar ? s.ar : s.en}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto px-6 py-5 space-y-4">

          {/* Step 0: Customer */}
          {step === 0 && (
            <>
              <div className="flex gap-3 mb-3">
                {(["company", "individual"] as const).map(t => (
                  <button key={t} type="button" onClick={() => setCustomerType(t)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-medium border transition-all ${customerType === t ? "border-primary bg-primary/5 text-primary" : "border-border/60 text-muted-foreground hover:bg-muted/50"}`}>
                    {t === "company" ? <Building2 size={13} /> : <User size={13} />}
                    {t === "company" ? (ar ? "شركة" : "Company") : (ar ? "فرد" : "Individual")}
                  </button>
                ))}
              </div>
              <div>
                <label className={labelCls}>{ar ? "ابحث عن العميل" : "Search Customer"}</label>
                <ConnectedSearch
                  results={searchResults.filter(r => r.type === "organization" || r.type === "person")}
                  value={customerId ? customerName : undefined}
                  onSelect={handleCustomerSelect}
                  onClear={() => { setCustomerId(""); setCustomerName(""); }}
                  ar={ar}
                />
              </div>
              <p className="text-[10.5px] text-muted-foreground text-center">{ar ? "أو أدخل البيانات يدوي" : "Or enter manually below"}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>{ar ? "اسم العميل" : "Customer Name"}</label>
                  <input value={customerName} onChange={e => setCustomerName(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{ar ? "جهة الاتصال" : "Contact Person"}</label>
                  <input value={contactPerson} onChange={e => setContactPerson(e.target.value)} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>{ar ? "الموبايل" : "Phone"}</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} placeholder="01xxxxxxxxx" />
                </div>
                <div>
                  <label className={labelCls}>{ar ? "الإيميل" : "Email"}</label>
                  <input value={email} onChange={e => setEmail(e.target.value)} type="email" className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>{ar ? "العنوان" : "Address"}</label>
                  <input value={address} onChange={e => setAddress(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{ar ? "المدينة" : "City"}</label>
                  <input value={city} onChange={e => setCity(e.target.value)} className={inputCls} />
                </div>
              </div>
            </>
          )}

          {/* Step 1: Products */}
          {step === 1 && (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[13px] font-medium">{ar ? "اختر المنتجات من الكتالوج" : "Select Products from Catalog"}</p>
                <button type="button" onClick={addManualItem} className="flex items-center gap-1 text-[11px] text-primary font-medium hover:opacity-70"><Plus size={12} /> {ar ? "صنف يدوي" : "Manual Item"}</button>
              </div>

              {/* Product catalog picker */}
              <div className="relative mb-3">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                <input value={productSearch} onChange={e => setProductSearch(e.target.value)}
                  placeholder={ar ? "ابحث في المنتجات بالاسم أو الكود..." : "Search products by name or SKU..."}
                  className="w-full h-9 pl-9 pr-4 rounded-xl border border-border/60 bg-background text-[12px] focus:outline-none focus:ring-1 focus:ring-primary/20" />
              </div>
              {filteredProducts.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {filteredProducts.map(p => {
                    const pm = (p.metadata ?? {}) as ProductMeta;
                    const already = items.some(i => i.product_id === p.id);
                    return (
                      <button key={p.id} type="button" onClick={() => !already && addProductFromCatalog(p)}
                        disabled={already}
                        className={`text-left p-3 rounded-xl border transition-all ${already ? "border-primary/30 bg-primary/5 opacity-60" : "border-border/40 hover:border-primary/40 hover:bg-muted/30"}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {pm.sku && <span className="text-[9px] font-mono text-muted-foreground">{pm.sku}</span>}
                          {pm.category && <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/8 text-primary">{pm.category}</span>}
                        </div>
                        <p className="text-[12px] font-medium truncate">{ar ? (p.name_ar || p.name_en) : p.name_en}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                          {pm.suggested_price && <span>{fmt(pm.suggested_price)} {currency}</span>}
                          {pm.stages?.length && <span>· {calculateCriticalPath(pm.stages).totalDays}d</span>}
                          {already && <span className="text-primary font-medium">{ar ? "✓ تم الإضافة" : "✓ Added"}</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Selected items */}
              {items.length > 0 && (
                <div className="border-t border-border/30 pt-3">
                  <p className="text-[12px] text-muted-foreground mb-2">{ar ? "الأصناف المختارة" : "Selected Items"} ({items.length})</p>
                  <div className="space-y-2">
                    {items.map((item, i) => (
                      <div key={item.id} className="border border-border/30 rounded-xl p-3 bg-muted/10">
                        <div className="flex items-center gap-2 mb-2">
                          {item.product_id ? (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">{ar ? "من الكتالوج" : "Catalog"}</span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">{ar ? "يدوي" : "Manual"}</span>
                          )}
                          {item.product_sku && <span className="text-[9px] font-mono text-muted-foreground">{item.product_sku}</span>}
                          <div className="flex-1" />
                          <button onClick={() => removeItem(i)} className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-50"><X size={11} /></button>
                        </div>
                        <div className="grid grid-cols-12 gap-2">
                          <div className="col-span-5">
                            <input value={item.product_name} onChange={e => updateItem(i, { ...item, product_name: e.target.value })}
                              className={smallInput} placeholder={ar ? "اسم المنتج" : "Product name"} readOnly={!!item.product_id} />
                          </div>
                          <div className="col-span-2">
                            <input type="number" value={item.qty} onChange={e => updateItem(i, { ...item, qty: parseInt(e.target.value) || 1 })} min={1} className={smallInput} />
                          </div>
                          <div className="col-span-3">
                            <input type="number" value={item.unitPrice} onChange={e => updateItem(i, { ...item, unitPrice: parseFloat(e.target.value) || 0 })} min={0} className={smallInput} placeholder={ar ? "السعر" : "Price"} />
                          </div>
                          <div className="col-span-2 flex items-center justify-end text-[12px] font-medium tabular-nums">
                            {fmt(item.qty * item.unitPrice)}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-end text-[13px] font-medium pt-2">
                      <span className="text-muted-foreground mr-3">{ar ? "الإجمالي:" : "Total:"}</span>
                      <span className="tabular-nums">{fmt(totalAmount)} {currency}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{ar ? "رقم الطلب" : "SO Number"}</label>
                  <input value={soNumber} readOnly className={inputCls + " bg-muted/30 text-muted-foreground"} />
                </div>
                <div>
                  <label className={labelCls}>{ar ? "اسم المشروع" : "Project Name"}</label>
                  <input value={projectName} onChange={e => setProjectName(e.target.value)} className={inputCls} placeholder={ar ? "مطبخ فيلا المعادي" : "e.g. Maadi Villa Kitchen"} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{ar ? "الأولوية" : "Priority"}</label>
                  <select value={priority} onChange={e => setPriority(e.target.value as Priority)} className={inputCls + " appearance-none cursor-pointer"}>
                    {PRIORITIES.map(p => <option key={p.value} value={p.value}>{ar ? p.ar : p.en}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{ar ? "تاريخ التسليم المطلوب" : "Required Delivery Date"}</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>{ar ? "ملاحظات" : "Notes"}</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={inputCls + " h-auto py-2"} />
              </div>
            </>
          )}

          {/* Step 3: Manufacturing Route */}
          {step === 3 && (
            <>
              <p className="text-[12px] text-muted-foreground mb-3">
                {ar ? "اختر خط التصنيع المناسب للطلب" : "Choose the manufacturing route for this order"}
              </p>
              {[
                { value: "standard", en: "Standard — Sequential production", ar: "قياسي — إنتاج متتابع", desc: ar ? "كل مرحلة بعد اللي قبلها" : "Each stage after the previous" },
                { value: "express", en: "Express — Parallel where possible", ar: "سريع — توازي قدر الإمكان", desc: ar ? "مراحل متوازية لتقليل الوقت" : "Parallel stages to reduce time" },
                { value: "custom", en: "Custom — Manual stage control", ar: "مخصص — تحكم يدوي في المراحل", desc: ar ? "تحكم كامل في كل مرحلة" : "Full control over each stage" },
              ].map(route => (
                <button key={route.value} type="button" onClick={() => setMfgRoute(route.value)}
                  className={`w-full text-left p-4 rounded-xl border mb-2 transition-all ${mfgRoute === route.value ? "border-primary bg-primary/5" : "border-border/40 hover:border-border/70"}`}>
                  <p className="text-[13px] font-medium">{ar ? route.ar : route.en}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{route.desc}</p>
                </button>
              ))}

              {/* Product stage summary */}
              {items.filter(i => i.stages_snapshot?.length).length > 0 && (
                <div className="border-t border-border/30 pt-3 mt-3">
                  <p className="text-[12px] font-medium mb-2">{ar ? "مراحل التصنيع لكل منتج" : "Manufacturing stages per product"}</p>
                  {items.filter(i => i.stages_snapshot?.length).map(item => {
                    const cp = calculateCriticalPath(item.stages_snapshot!);
                    return (
                      <div key={item.id} className="bg-muted/20 rounded-lg p-3 mb-2">
                        <p className="text-[12px] font-medium">{item.product_name} × {item.qty}</p>
                        <div className="flex items-center gap-3 mt-1 text-[10.5px] text-muted-foreground">
                          <span>{item.stages_snapshot!.length} {ar ? "مرحلة" : "stages"}</span>
                          <span>{cp.totalDays} {ar ? "يوم عمل" : "work days"}</span>
                          {cp.parallelSavings > 0 && <span className="text-emerald-600">{ar ? `وفر ${cp.parallelSavings} يوم` : `saves ${cp.parallelSavings}d`}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Step 4: Cost & Time */}
          {step === 4 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <p className="text-[13px] font-medium">{ar ? "ملخص التكلفة" : "Cost Summary"}</p>
                  {/* Discount & tax controls */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground">{ar ? "خصم" : "Discount"}</label>
                      <div className="flex gap-1">
                        <input type="number" min={0} value={orderDiscount || ""} onChange={e => setOrderDiscount(parseFloat(e.target.value) || 0)} className={smallInput} placeholder="0" />
                        <div className="flex rounded-lg border border-border/60 overflow-hidden shrink-0">
                          {(["pct", "fixed"] as const).map(t => (
                            <button key={t} type="button" onClick={() => setOrderDiscountType(t)} className={`px-2 text-[11px] font-medium ${orderDiscountType === t ? "bg-foreground text-background" : "text-muted-foreground"}`}>{t === "pct" ? "%" : currency}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">{ar ? "ضريبة %" : "Tax %"}</label>
                      <input type="number" min={0} value={taxRate || ""} onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} className={smallInput} placeholder="0" />
                    </div>
                  </div>
                  <div className="bg-muted/20 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-[12px]">
                      <span className="text-muted-foreground">{ar ? "الإجمالي الفرعي" : "Subtotal"}</span>
                      <span className="font-medium tabular-nums">{fmt(subtotal)} {currency}</span>
                    </div>
                    {orderDiscAmt > 0 && (
                      <div className="flex justify-between text-[12px] text-rose-500">
                        <span>{ar ? "الخصم" : "Discount"}</span>
                        <span className="font-medium tabular-nums">− {fmt(Math.round(orderDiscAmt))} {currency}</span>
                      </div>
                    )}
                    {taxAmt > 0 && (
                      <div className="flex justify-between text-[12px] text-muted-foreground">
                        <span>{ar ? "الضريبة" : "Tax"} ({taxRate}%)</span>
                        <span className="font-medium tabular-nums">+ {fmt(Math.round(taxAmt))} {currency}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[13px] font-semibold border-t border-border/30 pt-2">
                      <span>{ar ? "قيمة الطلب" : "Order Total"}</span>
                      <span className="tabular-nums text-emerald-600">{fmt(Math.round(totalAmount))} {currency}</span>
                    </div>
                    {estimatedCost > 0 && (
                      <>
                        <div className="flex justify-between text-[12px]">
                          <span className="text-muted-foreground">{ar ? "تكلفة التصنيع المتوقعة" : "Est. Mfg Cost"}</span>
                          <span className="font-medium tabular-nums">{fmt(Math.round(estimatedCost))} {currency}</span>
                        </div>
                        <div className="flex justify-between text-[12px] border-t border-border/30 pt-2">
                          <span className="font-medium">{ar ? "هامش الربح المتوقع" : "Est. Margin"}</span>
                          <span className={`font-medium tabular-nums ${(totalAmount - estimatedCost) >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                            {totalAmount > 0 ? Math.round(((totalAmount - estimatedCost) / totalAmount) * 100) : 0}%
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Time */}
                  <div className="bg-muted/20 rounded-xl p-4">
                    <p className="text-[11px] text-muted-foreground mb-1">{ar ? "مدة التصنيع المتوقعة" : "Est. Manufacturing Time"}</p>
                    <p className="text-[20px] font-medium tabular-nums">{estimatedDays || "—"} {estimatedDays ? (ar ? "يوم عمل" : "work days") : ""}</p>
                    {dueDate && estimatedDays > 0 && (
                      <p className={`text-[10.5px] mt-1 ${estimatedDays > Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000) ? "text-rose-500" : "text-emerald-600"}`}>
                        {estimatedDays > Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000)
                          ? (ar ? "⚠ الوقت مش كافي للتسليم في الميعاد!" : "⚠ Not enough time for deadline!")
                          : (ar ? "✓ ممكن نلحق الميعاد" : "✓ Can meet deadline")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-medium">{ar ? "الدفعات" : "Payments"}</p>
                    <button type="button" onClick={addPayment} className="flex items-center gap-1 text-[11px] text-primary font-medium hover:opacity-70"><Plus size={12} /> {ar ? "دفعة" : "Add"}</button>
                  </div>
                  {payments.map((p, i) => (
                    <div key={p.id} className="border border-border/30 rounded-lg p-2.5 bg-muted/10">
                      <div className="grid grid-cols-3 gap-2">
                        <input type="number" value={p.amount} onChange={e => updatePayment(i, { ...p, amount: parseFloat(e.target.value) || 0 })} min={0} className={smallInput} placeholder={ar ? "المبلغ" : "Amount"} />
                        <input type="date" value={p.date} onChange={e => updatePayment(i, { ...p, date: e.target.value })} className={smallInput} />
                        <div className="flex gap-1">
                          <select value={p.method} onChange={e => updatePayment(i, { ...p, method: e.target.value })} className={smallInput + " appearance-none cursor-pointer flex-1"}>
                            <option value="cash">{ar ? "كاش" : "Cash"}</option>
                            <option value="bank">{ar ? "تحويل بنكي" : "Bank"}</option>
                            <option value="check">{ar ? "شيك" : "Check"}</option>
                          </select>
                          <button onClick={() => removePayment(i)} className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground/40 hover:text-rose-500"><X size={11} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {totalPaid > 0 && (
                    <div className="flex justify-between text-[12px] font-medium">
                      <span className="text-muted-foreground">{ar ? "إجمالي المدفوع:" : "Total Paid:"}</span>
                      <span className="tabular-nums">{fmt(totalPaid)} / {fmt(totalAmount)} {currency} ({totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0}%)</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Step 5: Confirm */}
          {step === 5 && (
            <>
              <div className="bg-muted/20 rounded-xl p-4 space-y-3">
                <p className="text-[13px] font-medium">{ar ? "ملخص الطلب" : "Order Summary"}</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[12px]">
                  <div className="flex justify-between"><span className="text-muted-foreground">{ar ? "رقم الطلب" : "SO#"}</span><span className="font-mono">{soNumber}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{ar ? "العميل" : "Customer"}</span><span>{customerName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{ar ? "المشروع" : "Project"}</span><span>{projectName || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{ar ? "الأولوية" : "Priority"}</span><span>{PRIORITIES.find(p => p.value === priority)?.[ar ? "ar" : "en"]}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{ar ? "عدد الأصناف" : "Items"}</span><span>{items.length}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{ar ? "القيمة" : "Value"}</span><span className="font-medium">{fmt(totalAmount)} {currency}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{ar ? "المدفوع" : "Paid"}</span><span>{fmt(totalPaid)} {currency}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{ar ? "مدة التصنيع" : "Mfg Time"}</span><span>{estimatedDays || "—"} {ar ? "يوم" : "days"}</span></div>
                </div>
              </div>

              {/* Readiness checklist */}
              <div className="border-t border-border/30 pt-4">
                <p className="text-[12px] font-medium mb-3">{ar ? "قائمة الجاهزية" : "Readiness Checklist"}</p>
                <div className="space-y-2">
                  {[
                    { val: customerConfirmed, set: setCustomerConfirmed, en: "Customer confirmed", ar: "العميل أكد" },
                    { val: measurementsDone, set: setMeasurementsDone, en: "Measurements done", ar: "المقاسات اتاخدت" },
                    { val: designApproved, set: setDesignApproved, en: "Design approved", ar: "التصميم اتوافق عليه" },
                    { val: materialsAvailable, set: setMaterialsAvailable, en: "Materials available", ar: "الخامات متوفرة" },
                    { val: depositReceived, set: setDepositReceived, en: "Deposit received", ar: "العربون اتدفع" },
                  ].map(chk => (
                    <button key={chk.en} type="button" onClick={() => chk.set(!chk.val)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-[12px] text-left transition-all ${chk.val ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-border/40 text-muted-foreground hover:bg-muted/30"}`}>
                      <CheckCircle2 size={14} className={chk.val ? "text-emerald-500" : "text-muted-foreground/30"} />
                      <span>{ar ? chk.ar : chk.en}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Warnings */}
              {warnings.length > 0 && (
                <div className="border-t border-border/30 pt-3 mt-3">
                  <p className="text-[12px] font-medium mb-2 flex items-center gap-1.5"><AlertTriangle size={12} className="text-amber-500" /> {ar ? "تنبيهات" : "Warnings"}</p>
                  <div className="space-y-1.5">
                    {warnings.map((w, i) => (
                      <div key={i} className={`flex items-start gap-2 text-[11.5px] px-3 py-2 rounded-lg ${w.type === "error" ? "bg-rose-50 text-rose-700" : w.type === "warning" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>
                        {w.type === "error" ? <AlertCircle size={12} className="mt-0.5 shrink-0" /> : <Info size={12} className="mt-0.5 shrink-0" />}
                        <span>{ar ? w.ar : w.en}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {error && <p className="text-[12px] text-rose-500 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/40 shrink-0 flex items-center gap-3">
          {step > 0 && (
            <button type="button" onClick={() => setStep(s => s - 1)} className="flex items-center gap-1.5 h-10 px-4 rounded-xl border border-border/60 text-[13px] font-medium hover:bg-muted/50">
              <ChevronLeft size={14} /> {ar ? "السابق" : "Back"}
            </button>
          )}
          <div className="flex-1" />
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-xl border border-border/60 text-[13px] font-medium hover:bg-muted/50">{ar ? "إلغاء" : "Cancel"}</button>
          {step < 5 ? (
            <button onClick={() => setStep(s => s + 1)} className={btnPrimary + " h-10"}>
              {ar ? "التالي" : "Next"} <ChevronRight size={14} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading || !customerName.trim()} className={btnPrimary + " h-10"}>
              {loading && <Loader2 size={12} className="animate-spin" />} {ar ? "أنشئ الطلب" : "Create Order"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────

export default function SalesOrders() {
  const { lang } = useLanguage();
  const { workspace } = useAuth();
  const ar = lang === "ar";
  const settings = workspace?.settings as Record<string, unknown> | undefined;
  const currency = (settings?.currency as string) || "EGP";

  const [loading, setLoading] = useState(true);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [customers, setCustomers] = useState<Org[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [products, setProducts] = useState<Resource[]>([]);
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<WorkItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const wid = workspace?.id || "demo";
    Promise.all([
      getDataSource().work_items.list(wid),
      getDataSource().organizations.list(wid),
      getDataSource().people.list(wid),
      getDataSource().resources.list(wid),
    ]).then(([wi, orgs, ppl, res]) => {
      setWorkItems(wi as WorkItem[]);
      setCustomers(orgs as Org[]);
      setPeople(ppl as Person[]);
      setProducts((res as Resource[]).filter(r => r.type === "product" || (r.skills ?? []).includes("product")));
    }).finally(() => setLoading(false));
  }, [workspace?.id]);

  const orders = useMemo(() => workItems.filter(w => w.type === "sales_order"), [workItems]);
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return orders.filter(o => {
      const m = getM(o);
      const ms = !q || (m.so_number ?? "").toLowerCase().includes(q) || (m.customer_name ?? "").toLowerCase().includes(q) || (m.project_name ?? "").toLowerCase().includes(q) || (o.title_en ?? "").toLowerCase().includes(q);
      const fs = filterStatus === "all" || o.status === filterStatus;
      return ms && fs;
    });
  }, [orders, search, filterStatus]);

  // Build search results for ConnectedSearch
  const searchResults: SearchResult[] = useMemo(() => {
    const results: SearchResult[] = [];
    for (const org of customers) {
      results.push({
        id: org.id, type: (org.tags ?? []).includes("vendor") ? "vendor" : "organization",
        name: org.name_en, name_ar: org.name_ar || undefined,
        phone: org.phone || undefined, email: org.email || undefined,
        raw: org,
      });
    }
    for (const p of people) {
      results.push({
        id: p.id, type: "person", name: p.name_en, name_ar: p.name_ar || undefined,
        phone: p.phone || undefined, email: p.email || undefined, raw: p,
      });
    }
    return results;
  }, [customers, people]);

  const confirmed = orders.filter(o => o.status === "approved").length;
  const inProd = orders.filter(o => o.status === "in_progress").length;
  const ready = orders.filter(o => o.status === "review").length;
  const overdue = orders.filter(o => o.due_date && !["done", "cancelled", "sent"].includes(o.status) && new Date(o.due_date) < new Date(new Date().toDateString())).length;
  const totalValue = orders.reduce((s, o) => s + calcTotal(getM(o).items || []), 0);

  async function updateStatus(id: string, newStatus: string) {
    await getDataSource().work_items.update(workspace?.id ?? "", id, { status: newStatus as never });
    setWorkItems(prev => prev.map(w => w.id === id ? { ...w, status: newStatus as WorkItem["status"] } : w));
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    await getDataSource().work_items.remove(workspace?.id || "demo", deleteTarget.id);
    setWorkItems(prev => prev.filter(w => w.id !== deleteTarget.id));
    setDeleteLoading(false);
    setDeleteTarget(null);
  }

  async function toggleReadiness(id: string, field: string) {
    const item = workItems.find(w => w.id === id);
    if (!item) return;
    const m = getM(item);
    const updated = { ...m, [field]: !(m as Record<string, unknown>)[field] };
    await getDataSource().work_items.update(workspace?.id ?? "", id, { metadata: updated } as Partial<WorkItem>);
    setWorkItems(prev => prev.map(w => w.id === id ? { ...w, metadata: updated as any } : w));
  }

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 size={20} className="animate-spin text-muted-foreground/40" /></div>;

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="border-b border-border/40 px-7 md:px-10 py-7" style={{ background: "linear-gradient(160deg, hsl(var(--muted)/0.3) 0%, hsl(var(--background)) 60%)" }}>
        <div className="max-w-[1100px]">
          <div className="flex items-center gap-2.5 mb-2">
            <ClipboardCheck size={14} className="text-primary" />
            <p className="text-[11px] text-muted-foreground/60 tracking-[0.08em] uppercase">{ar ? "طلبات العملاء" : "Sales Orders"}</p>
          </div>
          <div className="flex items-start justify-between gap-4 mb-5">
            <h1 className="text-[26px] font-medium text-foreground leading-tight" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.025em" }}>
              {ar ? "طلبات العملاء" : "Sales Orders"}
            </h1>
            <div className="flex items-center gap-2 shrink-0">
              {orders.length > 0 && (
                <button onClick={() => {
                  const rows = orders.map(o => { const m = getM(o); return { so_number: m.so_number, customer: m.customer_name, project: m.project_name, priority: m.priority, items: (m.items||[]).length, total: calcTotal(m.items||[]), paid: calcPaid(m.payments||[]), status: o.status }; });
                  exportCSV(rows, `thoth-sales-orders-${new Date().toISOString().slice(0,10)}.csv`);
                }} className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border/60 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                  <Download size={13} /> {ar ? "صدّر" : "Export"}
                </button>
              )}
              <button onClick={() => setModal(true)} className={btnPrimary + " h-9"}>
                <Plus size={14} /> {ar ? "طلب جديد" : "New Order"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { icon: FileText, value: orders.length, label: ar ? "إجمالي الطلبات" : "Total Orders", color: "text-primary" },
              { icon: CheckCircle2, value: confirmed, label: ar ? "مؤكد" : "Confirmed", color: "text-blue-600" },
              { icon: Wrench, value: inProd, label: ar ? "في التصنيع" : "In Production", color: "text-violet-600" },
              { icon: Truck, value: ready, label: ar ? "جاهز للتسليم" : "Ready", color: "text-amber-600" },
              { icon: AlertCircle, value: overdue, label: ar ? "متأخر" : "Overdue", color: overdue > 0 ? "text-rose-500" : "text-emerald-600" },
              { icon: DollarSign, value: fmt(totalValue), label: ar ? "القيمة الإجمالية" : "Total Value", color: "text-foreground" },
            ].map((m, i) => (
              <div key={i} className="bg-background border border-border/40 rounded-xl px-4 py-3.5">
                <m.icon size={14} strokeWidth={1.75} className={m.color + " mb-2"} />
                <p className="text-[17px] font-medium text-foreground leading-none tabular-nums mb-1" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.02em" }}>{m.value}</p>
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-7 md:px-10 py-4 border-b border-border/30 bg-background/95 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-[1100px] flex items-center gap-3">
          <div className="relative flex-1 max-w-[300px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={ar ? "ابحث بالرقم أو العميل أو المشروع..." : "Search by SO#, customer, project..."} className="w-full h-9 pl-9 pr-4 rounded-xl border border-border/60 bg-background text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/30" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-9 px-3 rounded-xl border border-border/60 bg-background text-[12px] appearance-none cursor-pointer">
            <option value="all">{ar ? "كل الحالات" : "All Status"}</option>
            {SO_STATUSES.map(s => <option key={s.value} value={s.value}>{ar ? s.ar : s.en}</option>)}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="px-7 md:px-10 py-6 max-w-[1100px]">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-5">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <ClipboardCheck size={24} className="text-muted-foreground/40" />
            </div>
            <div className="text-center max-w-[400px]">
              <p className="text-[15px] font-medium mb-1" style={{ fontFamily: "var(--app-font-serif)" }}>{ar ? "مفيش طلبات لسه" : "No sales orders yet"}</p>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                {ar ? "أنشئ طلب عميل جديد بالويزارد المتصل." : "Create a new order with the connected wizard."}
              </p>
            </div>
            <button onClick={() => setModal(true)} className={btnPrimary + " h-10"}><Plus size={14} /> {ar ? "طلب جديد" : "New Order"}</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-muted-foreground/50">{ar ? "مفيش نتائج" : "No results"}</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(o => {
              const m = getM(o);
              const st = SO_STATUSES.find(s => s.value === o.status) ?? SO_STATUSES[0];
              const pri = PRIORITIES.find(p => p.value === m.priority);
              const itemsTotal = calcTotal(m.items || []);
              const paidTotal = calcPaid(m.payments || []);
              const remaining = itemsTotal - paidTotal;
              const isOd = o.due_date && !["done", "cancelled", "sent"].includes(o.status) && new Date(o.due_date) < new Date(new Date().toDateString());
              const readyCount = [m.customer_confirmed, m.measurements_done, m.design_approved, m.materials_available, m.deposit_received].filter(Boolean).length;
              const linkedProducts = (m.items || []).filter(i => i.product_id).length;

              return (
                <div key={o.id} className="bg-background border border-border/40 rounded-xl p-5 hover:shadow-sm hover:border-border/70 transition-all">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[10.5px] font-mono text-muted-foreground">{m.so_number}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.pill}`}>{ar ? st.ar : st.en}</span>
                        {pri && <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${pri.color}`}>{ar ? pri.ar : pri.en}</span>}
                        {isOd && <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-rose-100 text-rose-600">{ar ? "متأخر" : "Overdue"}</span>}
                        {m.customer_type === "individual" && <User size={10} className="text-muted-foreground/40" />}
                        {m.customer_type === "company" && <Building2 size={10} className="text-muted-foreground/40" />}
                      </div>
                      <p className="text-[15px] font-medium" style={{ fontFamily: "var(--app-font-serif)" }}>
                        {m.project_name || m.customer_name || o.title_en}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                        {m.customer_name && <span>{m.customer_name}</span>}
                        {(m.items||[]).length > 0 && <span>{(m.items||[]).length} {ar ? "صنف" : "items"}</span>}
                        {linkedProducts > 0 && <span className="text-primary">{linkedProducts} {ar ? "متصل بالكتالوج" : "linked"}</span>}
                        {m.estimated_days && <span><Clock size={9} className="inline mr-0.5" />{m.estimated_days}d</span>}
                        {o.due_date && <span><Calendar size={9} className="inline mr-0.5" />{o.due_date}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[16px] font-semibold tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>{fmt(itemsTotal)}</p>
                      {paidTotal > 0 && <p className="text-[10.5px] text-emerald-600 mt-0.5">{fmt(paidTotal)} {ar ? "مدفوع" : "paid"}</p>}
                      {remaining > 0 && paidTotal > 0 && <p className="text-[10px] text-muted-foreground">{fmt(remaining)} {ar ? "متبقي" : "remaining"}</p>}
                    </div>
                  </div>

                  {/* Readiness bar */}
                  {o.status !== "done" && o.status !== "cancelled" && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex gap-1">
                        {[
                          { key: "customer_confirmed", tip: ar ? "العميل أكد" : "Confirmed" },
                          { key: "measurements_done", tip: ar ? "المقاسات" : "Measured" },
                          { key: "design_approved", tip: ar ? "التصميم" : "Design" },
                          { key: "materials_available", tip: ar ? "الخامات" : "Materials" },
                          { key: "deposit_received", tip: ar ? "العربون" : "Deposit" },
                        ].map(chk => (
                          <button key={chk.key} onClick={() => toggleReadiness(o.id, chk.key)} title={chk.tip}
                            className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${(m as Record<string,unknown>)[chk.key] ? "bg-emerald-100 text-emerald-600" : "bg-muted text-muted-foreground/30 hover:bg-muted/80"}`}>
                            <CheckCircle2 size={11} />
                          </button>
                        ))}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{readyCount}/5 {ar ? "جاهز" : "ready"}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-border/30">
                    {o.status === "draft" && <button onClick={() => updateStatus(o.id, "approved")} className="text-[11px] text-blue-600 font-medium hover:opacity-70 flex items-center gap-1"><CheckCircle2 size={11} /> {ar ? "تأكيد" : "Confirm"}</button>}
                    {o.status === "approved" && <button onClick={() => updateStatus(o.id, "in_progress")} className="text-[11px] text-violet-600 font-medium hover:opacity-70 flex items-center gap-1"><Wrench size={11} /> {ar ? "ابدأ التصنيع" : "Start Production"}</button>}
                    {o.status === "in_progress" && <button onClick={() => updateStatus(o.id, "review")} className="text-[11px] text-amber-600 font-medium hover:opacity-70 flex items-center gap-1"><Package size={11} /> {ar ? "جاهز للتسليم" : "Ready"}</button>}
                    {o.status === "review" && <button onClick={() => updateStatus(o.id, "sent")} className="text-[11px] text-emerald-600 font-medium hover:opacity-70 flex items-center gap-1"><Truck size={11} /> {ar ? "تم التسليم" : "Delivered"}</button>}
                    {o.status === "sent" && <button onClick={() => updateStatus(o.id, "done")} className="text-[11px] text-emerald-600 font-medium hover:opacity-70 flex items-center gap-1"><CheckCircle2 size={11} /> {ar ? "اقفل الطلب" : "Close"}</button>}
                    <button onClick={() => setDeleteTarget(o)} title={ar ? "حذف" : "Delete"} className="ms-auto p-1.5 rounded-lg hover:bg-rose-50 text-rose-400 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modal && <SOWizard ar={ar} currency={currency} searchResults={searchResults} products={products} onClose={() => setModal(false)} onAdd={w => setWorkItems(prev => [w, ...prev])} />}

      <ConfirmDeleteModal
        open={!!deleteTarget}
        ar={ar}
        title={ar ? "حذف أمر البيع" : "Delete Sales Order"}
        itemName={deleteTarget ? (getM(deleteTarget).so_number || deleteTarget.title_en) : ""}
        loading={deleteLoading}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
