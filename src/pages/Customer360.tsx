/**
 * Customer 360 — Connected Customer Profile
 *
 * العميل 360 — صفحة العميل المتصلة بكل الأقسام
 *
 * Shows: info, contacts, quotations, sales orders, purchase orders,
 * products, site visits, production orders, invoices/payments,
 * activity history, notes, analysis dashboard
 */

import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { isDemoMode } from "../lib/supabase";
import { getDataSource } from "../lib/data-source";
import Breadcrumbs from "../components/Breadcrumbs";
import { WarningList, WorkflowBlockerCard } from "../components/SmartAlerts";
import type { Database } from "../lib/database.types";
import type { SOMeta, SOItem, ProductMeta } from "../lib/furniture-engine";
import { PRIORITIES, getSOWarnings } from "../lib/furniture-engine";
import {
  Building2, User, Phone, Mail, MapPin, Globe, ArrowLeft,
  Plus, Edit3, FileText, ClipboardCheck, Package, Truck,
  DollarSign, Clock, Calendar, CheckCircle2, AlertTriangle,
  Wrench, Loader2, ChevronRight, X, Check, Activity,
  ShoppingCart, PenTool, Eye, Star, StickyNote, Factory,
  Gift,
} from "lucide-react";
import {
  loadLoyaltyMembers, loadLoyaltyTransactions,
  TIER_META, TX_TYPE_META, fmtPts, tierProgress,
  type LoyaltyMemberDemo, type LoyaltyTransactionDemo,
} from "../data/loyalty";

type Org = Database["public"]["Tables"]["organizations"]["Row"];
type Person = Database["public"]["Tables"]["people"]["Row"];
type WorkItem = Database["public"]["Tables"]["work_items"]["Row"];
type Resource = Database["public"]["Tables"]["resources"]["Row"];
type ProdOrder = Database["public"]["Tables"]["production_orders"]["Row"];

// ─── Helpers ─────────────────────────────────────────────

const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-[12px] font-medium px-3.5 py-1.5 hover:opacity-90 transition-opacity";
const btnSecondary = "inline-flex items-center justify-center gap-1.5 rounded-xl border border-border/60 text-[11px] font-medium px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors";

function initials(name: string) { return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase(); }
function fmt(n: number) { return n.toLocaleString("en", { maximumFractionDigits: 0 }); }

type Tab = "overview" | "orders" | "quotations" | "products" | "production" | "purchasing" | "contacts" | "loyalty" | "activity" | "analysis";

const TABS: { id: Tab; en: string; ar: string; icon: React.ElementType }[] = [
  { id: "overview",    en: "Overview",     ar: "نظرة عامة",      icon: Eye },
  { id: "orders",      en: "Orders",       ar: "الطلبات",        icon: ClipboardCheck },
  { id: "quotations",  en: "Quotations",   ar: "عروض الأسعار",   icon: FileText },
  { id: "products",    en: "Products",     ar: "المنتجات",       icon: Package },
  { id: "production",  en: "Production",   ar: "التصنيع",        icon: Factory },
  { id: "purchasing",  en: "Purchasing",   ar: "المشتريات",      icon: ShoppingCart },
  { id: "contacts",    en: "Contacts",     ar: "جهات الاتصال",   icon: User },
  { id: "loyalty",     en: "Loyalty",      ar: "الولاء",         icon: Gift },
  { id: "activity",    en: "Activity",     ar: "سجل الحركة",     icon: Activity },
  { id: "analysis",    en: "Analysis",     ar: "التحليل",        icon: Star },
];

// ─── Edit Customer Modal ─────────────────────────────────

function EditModal({ org, ar, onClose, onSave }: { org: Org; ar: boolean; onClose: () => void; onSave: (data: Partial<Org>) => void }) {
  const [name, setName] = useState(org.name_en);
  const [nameAr, setNameAr] = useState(org.name_ar || "");
  const [phone, setPhone] = useState(org.phone || "");
  const [email, setEmail] = useState(org.email || "");
  const [address, setAddress] = useState((org.metadata as any)?.address || "");
  const [website, setWebsite] = useState((org.metadata as any)?.website || "");

  const inputCls = "w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20";
  const labelCls = "text-[11.5px] text-muted-foreground font-medium mb-1 block";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-background border border-border/40 rounded-2xl shadow-2xl w-full max-w-[500px]" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
          <h2 className="text-[16px] font-medium" style={{ fontFamily: "var(--app-font-serif)" }}>
            {ar ? "تعديل بيانات العميل" : "Edit Customer"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted"><X size={16} /></button>
        </div>
        <div className="px-6 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>{ar ? "الاسم (English)" : "Name (English)"}</label><input value={name} onChange={e => setName(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>{ar ? "الاسم (عربي)" : "Name (Arabic)"}</label><input value={nameAr} onChange={e => setNameAr(e.target.value)} className={inputCls} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>{ar ? "الموبايل" : "Phone"}</label><input value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>{ar ? "الإيميل" : "Email"}</label><input value={email} onChange={e => setEmail(e.target.value)} className={inputCls} /></div>
          </div>
          <div><label className={labelCls}>{ar ? "العنوان" : "Address"}</label><input value={address} onChange={e => setAddress(e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>{ar ? "الموقع" : "Website"}</label><input value={website} onChange={e => setWebsite(e.target.value)} className={inputCls} /></div>
        </div>
        <div className="px-6 py-4 border-t border-border/40 flex justify-end gap-3">
          <button onClick={onClose} className={btnSecondary}>{ar ? "إلغاء" : "Cancel"}</button>
          <button onClick={() => onSave({ name_en: name, name_ar: nameAr || null, phone: phone || null, email: email || null, metadata: { ...(org.metadata as any), address, website } })} className={btnPrimary}>
            <Check size={12} /> {ar ? "احفظ" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Customer Loyalty Tab ────────────────────────────────

function CustomerLoyaltyTab({ orgName, ar, navigate }: { orgName: string; ar: boolean; navigate: (p: string) => void }) {
  const members = loadLoyaltyMembers();
  const transactions = loadLoyaltyTransactions();

  // Match loyalty member(s) linked to this org — in demo, match by name substring
  const matched = members.filter(m =>
    m.nameEn.toLowerCase().includes(orgName.split(" ")[0].toLowerCase()) ||
    orgName.toLowerCase().includes(m.nameEn.split(" ")[0].toLowerCase())
  );

  if (matched.length === 0) {
    return (
      <div className="py-14 text-center border border-dashed border-border/40 rounded-xl">
        <Gift size={22} className="mx-auto mb-3 text-muted-foreground/30" />
        <p className="text-[13px] font-medium text-muted-foreground mb-1">{ar ? "لا يوجد عضوية ولاء" : "No Loyalty Membership"}</p>
        <p className="text-[11px] text-muted-foreground/60 mb-4">{ar ? "هذا العميل غير مسجل في برنامج الولاء" : "This customer is not enrolled in the loyalty program"}</p>
        <button onClick={() => navigate("/loyalty/lookup")} className="inline-flex items-center gap-1.5 h-8 px-4 rounded-xl bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-90 transition-opacity">
          <Plus size={13} />{ar ? "تسجيل في الولاء" : "Enroll in Loyalty"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matched.map(member => {
        const tier = TIER_META[member.tier];
        const progress = tierProgress(member.totalSpend, member.tier);
        const memberTx = transactions.filter(t => t.memberId === member.id).slice(0, 6);

        return (
          <div key={member.id} className="space-y-4">
            {/* Membership Card */}
            <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${tier.gradient} border border-border/40`}>
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[13px] font-semibold text-white" style={{ background: member.avatarColor }}>
                      {member.nameEn.split(" ").map(w => w[0]).join("").toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[14px] font-medium" style={{ fontFamily: "var(--app-font-serif)" }}>{ar ? member.nameAr : member.nameEn}</p>
                      <p className="text-[10.5px] text-muted-foreground">{member.memberNumber}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${tier.pill}`}>{ar ? tier.ar : tier.en}</span>
                </div>

                {/* Points */}
                <div className="flex items-baseline gap-1.5 mb-3">
                  <span className="text-[32px] font-medium tabular-nums leading-none" style={{ fontFamily: "var(--app-font-serif)" }}>{fmtPts(member.currentPoints)}</span>
                  <span className="text-[11px] text-muted-foreground">{ar ? "نقطة" : "pts"}</span>
                </div>

                {/* Tier Progress */}
                {progress.next && (
                  <div className="mb-3">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>{ar ? tier.ar : tier.en}</span>
                      <span>{ar ? TIER_META[progress.next].ar : TIER_META[progress.next].en} — {fmtPts(progress.remaining)} {ar ? "متبقي" : "remaining"}</span>
                    </div>
                    <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${progress.pct}%`, background: tier.color }} />
                    </div>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-3 pt-2 border-t border-border/30">
                  {[
                    { v: fmtPts(member.lifetimePoints), l: ar ? "مكتسبة" : "Earned" },
                    { v: fmtPts(member.redeemedPoints), l: ar ? "مستبدلة" : "Redeemed" },
                    { v: String(member.orderCount), l: ar ? "طلبات" : "Orders" },
                    { v: `${fmt(member.totalSpend)}`, l: ar ? "إنفاق" : "Spend" },
                  ].map((s, i) => (
                    <div key={i} className="text-center pt-2">
                      <p className="text-[14px] font-medium tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>{s.v}</p>
                      <p className="text-[9.5px] text-muted-foreground mt-0.5">{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            {memberTx.length > 0 && (
              <div className="border border-border/40 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
                  <p className="text-[11px] font-semibold text-muted-foreground tracking-[0.06em] uppercase">{ar ? "آخر المعاملات" : "Recent Transactions"}</p>
                  <button onClick={() => navigate(`/loyalty/members/${member.id}`)} className="text-[10.5px] text-primary hover:underline">{ar ? "عرض الكل" : "View all"}</button>
                </div>
                <div className="divide-y divide-border/30">
                  {memberTx.map(tx => {
                    const txMeta = TX_TYPE_META[tx.type];
                    const isPositive = txMeta.sign === "+";
                    return (
                      <div key={tx.id} className="flex items-center gap-3 px-4 py-2.5">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${txMeta.dot}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px]">{ar ? txMeta.ar : txMeta.en}{tx.orderId ? ` · ${tx.orderId}` : ""}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
                        </div>
                        <span className={`text-[12px] font-medium tabular-nums ${isPositive ? "text-emerald-600" : "text-rose-500"}`}>
                          {txMeta.sign}{fmtPts(Math.abs(tx.points))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button onClick={() => navigate(`/loyalty/members/${member.id}`)} className="flex-1 h-9 rounded-xl border border-border/60 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                {ar ? "صفحة العضوية" : "Full Profile"}
              </button>
              <button onClick={() => navigate("/loyalty/lookup")} className="flex-1 h-9 rounded-xl bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-90 transition-opacity">
                {ar ? "بحث سريع" : "Staff Lookup"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════

export default function Customer360() {
  const { lang } = useLanguage();
  const { workspace } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const ar = lang === "ar";
  const settings = workspace?.settings as Record<string, unknown> | undefined;
  const currency = (settings?.currency as string) || "EGP";

  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<Org | null>(null);
  const [contacts, setContacts] = useState<Person[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [prodOrders, setProdOrders] = useState<ProdOrder[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [editModal, setEditModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 2200); }

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    const wid = workspace?.id || "demo";
    Promise.all([
      getDataSource().organizations.get(wid, id),
      getDataSource().people.list(wid),
      getDataSource().work_items.list(wid),
      getDataSource().resources.list(wid),
      getDataSource().production_orders.list(wid),
    ]).then(([o, ppl, wi, res, po]) => {
      setOrg(o as Org | null);
      setContacts((ppl as Person[]).filter(p => p.organization_id === id));
      setWorkItems(wi as WorkItem[]);
      setResources(res as Resource[]);
      setProdOrders(po as ProdOrder[]);
    }).finally(() => setLoading(false));
  }, [workspace?.id, id]);

  // ─── Filter data for this customer ─────────────────────
  const orders = useMemo(() => workItems.filter(w => w.type === "sales_order" && ((w.metadata as any)?.customer_id === id || (w.metadata as any)?.customer_name === org?.name_en)), [workItems, id, org]);
  const quotations = useMemo(() => workItems.filter(w => w.type === "quotation" && ((w.metadata as any)?.customer_id === id || (w.metadata as any)?.customer_name === org?.name_en)), [workItems, id, org]);
  const purchaseOrders = useMemo(() => workItems.filter(w => (w.type === "purchase_request" || w.type === "purchase_order") && ((w.metadata as any)?.vendor_id === id)), [workItems, id]);
  const linkedProdOrders = useMemo(() => {
    const soIds = new Set(orders.map(o => o.id));
    return prodOrders.filter(po => po.sales_order_id && soIds.has(po.sales_order_id));
  }, [orders, prodOrders]);
  const products = useMemo(() => {
    const productIds = new Set<string>();
    orders.forEach(o => ((o.metadata as any)?.items || []).forEach((i: any) => { if (i.product_id) productIds.add(i.product_id); }));
    return resources.filter(r => productIds.has(r.id));
  }, [orders, resources]);

  // ─── Analysis metrics ──────────────────────────────────
  const totalOrders = orders.length;
  const activeOrders = orders.filter(o => !["done", "cancelled"].includes(o.status)).length;
  const totalRevenue = orders.reduce((s, o) => s + ((o.metadata as any)?.total_amount || o.total_amount || 0), 0);
  const totalPaid = orders.reduce((s, o) => s + ((o.metadata as any)?.total_paid || 0), 0);
  const unpaid = totalRevenue - totalPaid;
  const openQuotations = quotations.filter(q => !["converted", "rejected", "cancelled", "expired"].includes(q.status)).length;
  const delayedOrders = orders.filter(o => o.due_date && !["done", "cancelled"].includes(o.status) && new Date(o.due_date) < new Date()).length;

  const isVendor = (org?.tags ?? []).includes("vendor");

  async function handleSave(data: Partial<Org>) {
    if (!workspace?.id || !id) return;
    const updated = await getDataSource().organizations.update(workspace.id, id, data);
    if (updated) {
      setOrg(updated as Org);
      showToast(ar ? "تم حفظ التعديلات" : "Changes saved");
      // Log activity
      try {
        await getDataSource().activity_events.create(workspace.id, {
          workspace_id: workspace.id, event_type: "entity_updated", entity_type: "organization", entity_id: id,
          description_en: `Customer "${data.name_en || org?.name_en}" updated`, description_ar: `تم تعديل بيانات العميل "${data.name_ar || org?.name_ar}"`,
          metadata: { changes: Object.keys(data) },
        } as any);
      } catch {}
    }
    setEditModal(false);
  }

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 size={20} className="animate-spin text-muted-foreground/40" /></div>;

  if (!org) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center gap-4 p-8">
        <Building2 size={24} className="text-muted-foreground/40" />
        <p className="text-[15px] font-medium" style={{ fontFamily: "var(--app-font-serif)" }}>{ar ? "العميل مش موجود" : "Customer not found"}</p>
        <button onClick={() => navigate("/organizations")} className="flex items-center gap-1.5 text-[12px] text-primary hover:underline"><ArrowLeft size={12} />{ar ? "العودة" : "Back"}</button>
      </div>
    );
  }

  const meta = (org.metadata ?? {}) as Record<string, any>;

  return (
    <div className="min-h-full">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-xl bg-foreground text-background text-[13px] font-medium shadow-lg flex items-center gap-2">
          <Check size={14} />{toast}
        </div>
      )}

      {/* Hero */}
      <div className="border-b border-border/40" style={{ background: "linear-gradient(160deg, hsl(var(--muted)/0.35) 0%, hsl(var(--background)) 65%)" }}>
        <div className="px-8 md:px-10 pt-6">
          <Breadcrumbs
            backLabel={ar ? "العملاء" : "Customers"}
            backPath="/organizations"
            items={[
              { label: ar ? "العملاء" : "Customers", path: "/organizations" },
              { label: ar ? (org.name_ar || org.name_en) : org.name_en },
            ]}
          />
        </div>

        <div className="px-8 md:px-10 pt-4 pb-6 max-w-[960px]">
          <div className="flex items-start gap-5 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-[16px] font-semibold text-primary shrink-0">
              {initials(ar ? (org.name_ar || org.name_en) : org.name_en)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                {isVendor && <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 font-medium">{ar ? "مورّد" : "Vendor"}</span>}
                {(org.tags ?? []).filter(t => t !== "vendor").map(t => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/8 text-primary font-medium">{t}</span>
                ))}
              </div>
              <h1 className="text-[26px] font-medium text-foreground leading-tight" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.025em" }}>
                {ar ? (org.name_ar || org.name_en) : org.name_en}
              </h1>
              <div className="flex items-center gap-3 mt-1.5 text-[12px] text-muted-foreground flex-wrap">
                {org.phone && <span className="flex items-center gap-1"><Phone size={10} />{org.phone}</span>}
                {org.email && <span className="flex items-center gap-1"><Mail size={10} />{org.email}</span>}
                {meta.address && <span className="flex items-center gap-1"><MapPin size={10} />{meta.address}</span>}
                {meta.website && <span className="flex items-center gap-1"><Globe size={10} />{meta.website}</span>}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <button onClick={() => setEditModal(true)} className={btnSecondary}><Edit3 size={11} /> {ar ? "تعديل" : "Edit"}</button>
            <button onClick={() => navigate("/orders")} className={btnSecondary}><ClipboardCheck size={11} /> {ar ? "طلب جديد" : "New Order"}</button>
            <button onClick={() => navigate("/quotations")} className={btnSecondary}><FileText size={11} /> {ar ? "عرض سعر" : "New Quote"}</button>
            <button onClick={() => navigate("/site-visits")} className={btnSecondary}><MapPin size={11} /> {ar ? "معاينة" : "Site Visit"}</button>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { value: totalOrders, label: ar ? "إجمالي الطلبات" : "Total Orders", color: "text-primary" },
              { value: activeOrders, label: ar ? "طلبات نشطة" : "Active", color: "text-violet-600" },
              { value: fmt(totalRevenue), label: ar ? "الإيراد" : "Revenue", color: "text-foreground" },
              { value: fmt(unpaid), label: ar ? "غير مدفوع" : "Unpaid", color: unpaid > 0 ? "text-rose-500" : "text-emerald-600" },
              { value: openQuotations, label: ar ? "عروض مفتوحة" : "Open Quotes", color: "text-amber-600" },
              { value: delayedOrders, label: ar ? "متأخر" : "Delayed", color: delayedOrders > 0 ? "text-rose-500" : "text-emerald-600" },
            ].map((s, i) => (
              <div key={i} className="bg-background border border-border/40 rounded-xl px-3 py-3">
                <p className={`text-[17px] font-medium tabular-nums mb-0.5 ${s.color}`} style={{ fontFamily: "var(--app-font-serif)" }}>{s.value}</p>
                <p className="text-[9.5px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="border-b border-border/40 bg-background sticky top-0 z-10">
        <div className="px-8 md:px-10 flex items-center gap-0 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-[12px] font-medium whitespace-nowrap border-b-2 transition-all ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <tab.icon size={12} />
              {ar ? tab.ar : tab.en}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-8 md:px-10 py-7 max-w-[960px]">

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Smart alerts */}
            {delayedOrders > 0 && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl border bg-rose-50 border-rose-200 text-rose-700">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <div>
                  <p className="text-[12px] font-medium">{ar ? `${delayedOrders} طلبات متأخرة!` : `${delayedOrders} overdue order(s)!`}</p>
                  <p className="text-[11px] opacity-70">{ar ? "راجع الطلبات المتأخرة فوراً" : "Review overdue orders immediately"}</p>
                </div>
              </div>
            )}
            {unpaid > totalRevenue * 0.5 && totalRevenue > 0 && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl border bg-amber-50 border-amber-200 text-amber-700">
                <DollarSign size={14} className="mt-0.5 shrink-0" />
                <p className="text-[12px] font-medium">{ar ? `العميل عليه ${fmt(unpaid)} ${currency} غير مدفوع (${Math.round((unpaid / totalRevenue) * 100)}%)` : `${fmt(unpaid)} ${currency} unpaid (${Math.round((unpaid / totalRevenue) * 100)}%)`}</p>
              </div>
            )}

            {/* Recent orders */}
            <div className="border border-border/40 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border/30">
                <h3 className="text-[11px] font-semibold text-muted-foreground tracking-[0.08em] uppercase">{ar ? "آخر الطلبات" : "Recent Orders"}</h3>
                <button onClick={() => setActiveTab("orders")} className="text-[11px] text-primary hover:underline">{ar ? "عرض الكل" : "View all"}</button>
              </div>
              {orders.length === 0 ? (
                <div className="px-5 py-10 text-center text-[12px] text-muted-foreground/50">{ar ? "مفيش طلبات لسه" : "No orders yet"}</div>
              ) : (
                <div className="divide-y divide-border/25">
                  {orders.slice(0, 5).map(o => {
                    const m = o.metadata as any;
                    return (
                      <div key={o.id} onClick={() => navigate("/orders")} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/15 cursor-pointer">
                        <ClipboardCheck size={13} className="text-muted-foreground/50 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium truncate">{m?.so_number || o.title_en}</p>
                          <p className="text-[10px] text-muted-foreground">{m?.project_name}</p>
                        </div>
                        <span className="text-[12px] font-medium tabular-nums">{fmt(m?.total_amount || o.total_amount || 0)} {currency}</span>
                        <ChevronRight size={12} className="text-muted-foreground/30" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Contacts */}
            <div className="border border-border/40 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border/30">
                <h3 className="text-[11px] font-semibold text-muted-foreground tracking-[0.08em] uppercase">{ar ? "جهات الاتصال" : "Contacts"}</h3>
                <span className="text-[10px] text-muted-foreground">{contacts.length}</span>
              </div>
              {contacts.length === 0 ? (
                <div className="px-5 py-8 text-center text-[12px] text-muted-foreground/50">{ar ? "مفيش جهات اتصال" : "No contacts"}</div>
              ) : (
                <div className="divide-y divide-border/25">
                  {contacts.slice(0, 5).map(p => (
                    <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center text-[10px] font-semibold text-primary">{initials(p.name_en)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium">{ar ? (p.name_ar || p.name_en) : p.name_en}</p>
                        <p className="text-[10px] text-muted-foreground">{p.role_en}{p.phone ? ` · ${p.phone}` : ""}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ORDERS */}
        {activeTab === "orders" && (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="py-14 text-center text-[12px] text-muted-foreground/50">{ar ? "مفيش طلبات" : "No orders"}</div>
            ) : orders.map(o => {
              const m = o.metadata as SOMeta;
              const pri = PRIORITIES.find(p => p.value === m.priority);
              const total = (m.items || []).reduce((s, i) => s + i.qty * i.unitPrice, 0);
              const paid = (m.payments || []).reduce((s, p) => s + p.amount, 0);
              const isOverdue = o.due_date && !["done", "cancelled"].includes(o.status) && new Date(o.due_date) < new Date();
              return (
                <div key={o.id} className="border border-border/40 rounded-xl p-4 hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono text-muted-foreground">{m.so_number}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-medium">{o.status}</span>
                        {pri && <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${pri.color}`}>{ar ? pri.ar : pri.en}</span>}
                        {isOverdue && <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 font-medium">{ar ? "متأخر" : "Overdue"}</span>}
                      </div>
                      <p className="text-[14px] font-medium" style={{ fontFamily: "var(--app-font-serif)" }}>{m.project_name || o.title_en}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[15px] font-semibold tabular-nums">{fmt(total)} {currency}</p>
                      {paid > 0 && <p className="text-[10px] text-emerald-600">{fmt(paid)} {ar ? "مدفوع" : "paid"}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[10.5px] text-muted-foreground">
                    <span>{(m.items || []).length} {ar ? "صنف" : "items"}</span>
                    {o.due_date && <span><Calendar size={9} className="inline mr-0.5" />{o.due_date}</span>}
                    {m.estimated_days && <span><Clock size={9} className="inline mr-0.5" />{m.estimated_days}d</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* QUOTATIONS */}
        {activeTab === "quotations" && (
          <div className="space-y-3">
            {quotations.length === 0 ? (
              <div className="py-14 text-center text-[12px] text-muted-foreground/50">{ar ? "مفيش عروض أسعار" : "No quotations"}</div>
            ) : quotations.map(q => {
              const m = q.metadata as any;
              return (
                <div key={q.id} className="border border-border/40 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-muted-foreground">{m?.quotation_number}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-medium">{q.status}</span>
                  </div>
                  <p className="text-[13px] font-medium">{m?.project_name || q.title_en}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* PRODUCTS */}
        {activeTab === "products" && (
          <div className="space-y-3">
            {products.length === 0 ? (
              <div className="py-14 text-center text-[12px] text-muted-foreground/50">{ar ? "مفيش منتجات مرتبطة" : "No linked products"}</div>
            ) : products.map(p => {
              const pm = (p.metadata ?? {}) as ProductMeta;
              return (
                <div key={p.id} onClick={() => navigate("/products")} className="border border-border/40 rounded-xl p-4 hover:shadow-sm cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    {pm.sku && <span className="text-[10px] font-mono text-muted-foreground">{pm.sku}</span>}
                    {pm.category && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/8 text-primary font-medium">{pm.category}</span>}
                  </div>
                  <p className="text-[13px] font-medium">{ar ? (p.name_ar || p.name_en) : p.name_en}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10.5px] text-muted-foreground">
                    {pm.main_material && <span>{pm.main_material}</span>}
                    {pm.total_cost && <span>{fmt(pm.total_cost)} {currency} {ar ? "تكلفة" : "cost"}</span>}
                    {pm.suggested_price && <span>{fmt(pm.suggested_price)} {currency} {ar ? "سعر" : "price"}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PRODUCTION */}
        {activeTab === "production" && (
          <div className="space-y-3">
            {linkedProdOrders.length === 0 ? (
              <div className="py-14 text-center text-[12px] text-muted-foreground/50">{ar ? "مفيش أوامر تشغيل" : "No production orders"}</div>
            ) : linkedProdOrders.map(po => (
              <div key={po.id} onClick={() => navigate("/production")} className="border border-border/40 rounded-xl p-4 hover:shadow-sm cursor-pointer">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-muted-foreground">{po.po_number}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-medium">{po.current_stage}</span>
                </div>
                <p className="text-[13px] font-medium">{po.title}</p>
                {po.customer_name && <p className="text-[10.5px] text-muted-foreground mt-0.5">{po.customer_name}</p>}
              </div>
            ))}
          </div>
        )}

        {/* PURCHASING */}
        {activeTab === "purchasing" && (
          <div className="space-y-3">
            {purchaseOrders.length === 0 ? (
              <div className="py-14 text-center text-[12px] text-muted-foreground/50">{ar ? (isVendor ? "مفيش أوامر شراء" : "العميل مش مورّد") : (isVendor ? "No purchase orders" : "Customer is not a vendor")}</div>
            ) : purchaseOrders.map(po => {
              const m = po.metadata as any;
              return (
                <div key={po.id} className="border border-border/40 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-muted-foreground">{m?.po_number}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-medium">{po.status}</span>
                  </div>
                  <p className="text-[13px] font-medium">{po.title_en}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* CONTACTS */}
        {activeTab === "contacts" && (
          <div className="space-y-3">
            {contacts.length === 0 ? (
              <div className="py-14 text-center text-[12px] text-muted-foreground/50">{ar ? "مفيش جهات اتصال" : "No contacts linked"}</div>
            ) : contacts.map(p => (
              <div key={p.id} className="border border-border/40 rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center text-[12px] font-semibold text-primary">{initials(p.name_en)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium">{ar ? (p.name_ar || p.name_en) : p.name_en}</p>
                  <p className="text-[11px] text-muted-foreground">{ar ? (p.role_ar || p.role_en) : p.role_en}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-[10.5px] text-muted-foreground">
                    {p.phone && <span><Phone size={9} className="inline mr-0.5" />{p.phone}</span>}
                    {p.email && <span><Mail size={9} className="inline mr-0.5" />{p.email}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LOYALTY */}
        {activeTab === "loyalty" && <CustomerLoyaltyTab orgName={org?.name_en || ""} ar={ar} navigate={navigate} />}

        {/* ACTIVITY */}
        {activeTab === "activity" && (
          <div className="py-8 text-center text-[12px] text-muted-foreground/50 border border-dashed border-border/40 rounded-xl">
            <Activity size={20} className="mx-auto mb-2 opacity-30" />
            <p>{ar ? "سجل الحركة — قريباً" : "Activity log — coming with live events"}</p>
            <p className="text-[10.5px] mt-1">{ar ? "كل تعديل وحركة هتتسجل هنا تلقائي" : "All changes and actions will be logged here automatically"}</p>
          </div>
        )}

        {/* ANALYSIS */}
        {activeTab === "analysis" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: totalOrders, label: ar ? "إجمالي الطلبات" : "Total Orders", icon: ClipboardCheck, color: "text-primary" },
                { value: fmt(totalRevenue), label: ar ? "إجمالي الإيراد" : "Total Revenue", icon: DollarSign, color: "text-foreground" },
                { value: fmt(totalPaid), label: ar ? "المدفوع" : "Total Paid", icon: CheckCircle2, color: "text-emerald-600" },
                { value: fmt(unpaid), label: ar ? "المتبقي" : "Outstanding", icon: AlertTriangle, color: unpaid > 0 ? "text-rose-500" : "text-emerald-600" },
              ].map((m, i) => (
                <div key={i} className="border border-border/40 rounded-xl p-4 bg-background">
                  <m.icon size={14} className={`${m.color} mb-2`} />
                  <p className={`text-[20px] font-medium tabular-nums ${m.color}`} style={{ fontFamily: "var(--app-font-serif)" }}>{m.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="border border-border/40 rounded-xl p-4">
                <p className="text-[11px] text-muted-foreground mb-2">{ar ? "حالة الطلبات" : "Order Status"}</p>
                {["draft", "approved", "in_progress", "review", "sent", "done", "cancelled"].map(status => {
                  const count = orders.filter(o => o.status === status).length;
                  if (!count) return null;
                  return (
                    <div key={status} className="flex justify-between text-[11px] py-1">
                      <span className="text-muted-foreground capitalize">{status.replace("_", " ")}</span>
                      <span className="font-medium tabular-nums">{count}</span>
                    </div>
                  );
                })}
              </div>
              <div className="border border-border/40 rounded-xl p-4">
                <p className="text-[11px] text-muted-foreground mb-2">{ar ? "ملخص الدفع" : "Payment Summary"}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-muted-foreground">{ar ? "نسبة التحصيل" : "Collection Rate"}</span>
                    <span className={`font-medium ${totalRevenue > 0 && (totalPaid / totalRevenue) < 0.5 ? "text-rose-500" : "text-emerald-600"}`}>
                      {totalRevenue > 0 ? Math.round((totalPaid / totalRevenue) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${totalRevenue > 0 ? (totalPaid / totalRevenue) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Most requested products */}
            {products.length > 0 && (
              <div className="border border-border/40 rounded-xl p-4">
                <p className="text-[11px] text-muted-foreground mb-2">{ar ? "المنتجات المطلوبة" : "Requested Products"}</p>
                {products.map(p => (
                  <div key={p.id} className="flex justify-between text-[11px] py-1.5">
                    <span>{ar ? (p.name_ar || p.name_en) : p.name_en}</span>
                    <span className="text-muted-foreground">{((p.metadata as any)?.sku)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {editModal && <EditModal org={org} ar={ar} onClose={() => setEditModal(false)} onSave={handleSave} />}
    </div>
  );
}
