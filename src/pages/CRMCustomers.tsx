import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { useLocation } from "wouter";
import { CRM_CUSTOMERS, type CRMCustomer } from "../lib/crm-data";
import {
  Search, Filter, Grid3X3, List, Star, Phone, MessageSquare, Mail,
  Eye, ChevronRight, ArrowUpDown, Plus, TrendingUp, TrendingDown,
  ShoppingCart, Clock, MapPin, Tag, X, AlertTriangle, Users,
} from "lucide-react";

function formatEGP(n: number) {
  return new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", minimumFractionDigits: 0 }).format(n);
}

const VIP_COLORS: Record<string, string> = {
  platinum: "bg-violet-100 text-violet-700",
  gold: "bg-amber-100 text-amber-700",
  silver: "bg-slate-100 text-slate-600",
  none: "bg-muted text-muted-foreground",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-rose-100 text-rose-600",
  new: "bg-blue-100 text-blue-600",
};

export default function CRMCustomers() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [, navigate] = useLocation();

  const [searchQ, setSearchQ] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "spend" | "orders" | "points" | "last_activity">("name");
  const [vipFilter, setVipFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    let list = [...CRM_CUSTOMERS];
    if (searchQ) {
      const q = searchQ.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) || c.name_ar.includes(searchQ) ||
        c.phone.includes(q) || c.email.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) || c.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (vipFilter !== "all") list = list.filter(c => c.vip_level === vipFilter);
    if (statusFilter !== "all") list = list.filter(c => c.status === statusFilter);
    if (riskFilter !== "all") list = list.filter(c => c.churn_risk === riskFilter);
    list.sort((a, b) => {
      switch (sortBy) {
        case "spend": return b.total_spend - a.total_spend;
        case "orders": return b.total_orders - a.total_orders;
        case "points": return b.loyalty_points - a.loyalty_points;
        case "last_activity": return new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime();
        default: return a.name.localeCompare(b.name);
      }
    });
    return list;
  }, [searchQ, vipFilter, statusFilter, riskFilter, sortBy]);

  return (
    <div className="min-h-full px-6 md:px-8 py-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>
            {ar ? "العملاء" : "Customers"}
          </h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">{filtered.length} {ar ? "عميل" : "customers"}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
              className="w-64 h-9 pl-9 pr-3 rounded-lg border border-border bg-background text-[12px] placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30"
              placeholder={ar ? "بحث بالاسم، الهاتف، المدينة..." : "Search name, phone, city..."} />
          </div>
          <button onClick={() => setFilterOpen(!filterOpen)} className={`h-9 px-3 rounded-lg border text-[11px] font-medium flex items-center gap-1.5 transition-colors ${filterOpen ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>
            <Filter size={12} /> {ar ? "فلتر" : "Filter"}
          </button>
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button onClick={() => setViewMode("grid")} className={`w-8 h-9 flex items-center justify-center ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}><Grid3X3 size={13} /></button>
            <button onClick={() => setViewMode("list")} className={`w-8 h-9 flex items-center justify-center ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}><List size={13} /></button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {filterOpen && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mb-4 p-4 rounded-xl border border-border/40 bg-muted/20 overflow-hidden">
          <div className="flex items-center gap-3 flex-wrap">
            <select value={vipFilter} onChange={e => setVipFilter(e.target.value)} className="h-8 px-2 rounded-lg border border-border bg-background text-[11px] appearance-none cursor-pointer">
              <option value="all">{ar ? "كل المستويات" : "All VIP Levels"}</option>
              <option value="platinum">Platinum</option>
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
              <option value="none">None</option>
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-8 px-2 rounded-lg border border-border bg-background text-[11px] appearance-none cursor-pointer">
              <option value="all">{ar ? "كل الحالات" : "All Status"}</option>
              <option value="active">{ar ? "نشط" : "Active"}</option>
              <option value="inactive">{ar ? "غير نشط" : "Inactive"}</option>
              <option value="new">{ar ? "جديد" : "New"}</option>
            </select>
            <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} className="h-8 px-2 rounded-lg border border-border bg-background text-[11px] appearance-none cursor-pointer">
              <option value="all">{ar ? "كل المخاطر" : "All Risk"}</option>
              <option value="low">{ar ? "منخفض" : "Low"}</option>
              <option value="medium">{ar ? "متوسط" : "Medium"}</option>
              <option value="high">{ar ? "عالي" : "High"}</option>
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} className="h-8 px-2 rounded-lg border border-border bg-background text-[11px] appearance-none cursor-pointer">
              <option value="name">{ar ? "الاسم" : "Name"}</option>
              <option value="spend">{ar ? "إجمالي المشتريات" : "Total Spend"}</option>
              <option value="orders">{ar ? "عدد الطلبات" : "Orders"}</option>
              <option value="points">{ar ? "نقاط الولاء" : "Loyalty Points"}</option>
              <option value="last_activity">{ar ? "آخر نشاط" : "Last Activity"}</option>
            </select>
          </div>
        </motion.div>
      )}

      {/* Customer Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              onClick={() => navigate(`/crm/customers/${c.id}`)}
              className="p-4 rounded-xl border border-border/40 hover:shadow-md hover:border-border/60 transition-all cursor-pointer group">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ backgroundColor: c.avatar_color }}>
                  {c.name.split(" ").map(w => w[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground truncate">{c.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{c.phone}</p>
                </div>
                {c.vip_level !== "none" && <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-semibold uppercase ${VIP_COLORS[c.vip_level]}`}>{c.vip_level}</span>}
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center">
                  <p className="text-[12px] font-semibold text-foreground">{formatEGP(c.total_spend)}</p>
                  <p className="text-[8px] text-muted-foreground">{ar ? "الإجمالي" : "Spend"}</p>
                </div>
                <div className="text-center">
                  <p className="text-[12px] font-semibold text-foreground">{c.total_orders}</p>
                  <p className="text-[8px] text-muted-foreground">{ar ? "طلبات" : "Orders"}</p>
                </div>
                <div className="text-center">
                  <p className="text-[12px] font-semibold text-primary">{c.loyalty_points.toLocaleString()}</p>
                  <p className="text-[8px] text-muted-foreground">{ar ? "نقاط" : "Points"}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap mb-2">
                {c.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="text-[8px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{tag}</span>
                ))}
                {c.churn_risk === "high" && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600">{ar ? "خطر" : "Risk"}</span>}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/30">
                <div className="flex items-center gap-1">
                  <button onClick={e => e.stopPropagation()} className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 transition-colors"><Phone size={11} /></button>
                  <button onClick={e => e.stopPropagation()} className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 transition-colors"><MessageSquare size={11} /></button>
                  <button onClick={e => e.stopPropagation()} className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-colors"><Mail size={11} /></button>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${c.status === "active" ? "bg-emerald-500" : c.status === "new" ? "bg-blue-500" : "bg-muted"}`} />
                  <span className="text-[9px] text-muted-foreground">{c.last_activity}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              onClick={() => navigate(`/crm/customers/${c.id}`)}
              className="flex items-center gap-4 p-3.5 rounded-xl border border-border/40 hover:shadow-sm hover:border-border/60 transition-all cursor-pointer">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ backgroundColor: c.avatar_color }}>
                {c.name.split(" ").map(w => w[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium">{c.name}</span>
                  {c.vip_level !== "none" && <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-semibold uppercase ${VIP_COLORS[c.vip_level]}`}>{c.vip_level}</span>}
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                  <span>{c.phone}</span>
                  <span>{c.email}</span>
                  <span className="flex items-center gap-0.5"><MapPin size={8} />{c.city}</span>
                </div>
              </div>
              <div className="text-right shrink-0 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[12px] font-semibold">{formatEGP(c.total_spend)}</p>
                  <p className="text-[8px] text-muted-foreground">{ar ? "الإجمالي" : "Spend"}</p>
                </div>
                <div>
                  <p className="text-[12px] font-semibold">{c.total_orders}</p>
                  <p className="text-[8px] text-muted-foreground">{ar ? "طلبات" : "Orders"}</p>
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-primary">{c.loyalty_points.toLocaleString()}</p>
                  <p className="text-[8px] text-muted-foreground">{ar ? "نقاط" : "Points"}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={e => e.stopPropagation()} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 transition-colors"><Phone size={12} /></button>
                <button onClick={e => e.stopPropagation()} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 transition-colors"><MessageSquare size={12} /></button>
                <ChevronRight size={14} className="text-muted-foreground/30" />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Users size={32} className="mx-auto text-muted-foreground/20 mb-3" />
          <p className="text-[13px] text-muted-foreground mb-1">{ar ? "لا يوجد عملاء" : "No customers found"}</p>
          <p className="text-[11px] text-muted-foreground/60 mb-4">{searchQ ? (ar ? "جرب البحث بكلمات مختلفة" : "Try different search terms") : (ar ? "ابدأ بإضافة عميل جديد" : "Start by adding a new customer")}</p>
          {!searchQ && (
            <button className="h-8 px-4 rounded-lg bg-primary text-primary-foreground text-[11px] font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 mx-auto">
              <Plus size={12} /> {ar ? "إضافة عميل" : "Add Customer"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
