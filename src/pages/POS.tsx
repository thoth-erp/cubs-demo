import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ShoppingCart, CreditCard, Banknote, Smartphone, X, Plus, Minus,
  Trash2, Receipt, RotateCcw, ChevronDown, User, Tag, Check, Clock,
  Store, MapPin, AlertTriangle, Star, Wifi, WifiOff,   Pause, Users,
  BarChart3, History, Filter, ArrowUpDown, Grid3X3,
  List, Percent, Gift, ArrowLeftRight, Undo2, Printer, Wallet,
  TrendingUp, Package, Info, Eye, ShoppingBag,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { getDataSource } from "../lib/data-source";
import { CustomerDrawer } from "../components/pos/CustomerDrawer";
import { ProductDrawer } from "../components/pos/ProductDrawer";
import { ReportsPanel } from "../components/pos/ReportsPanel";
import { TransactionDrawer } from "../components/pos/TransactionDrawer";
import { HoldTransactions } from "../components/pos/HoldTransactions";

type Branch = { id: string; branch_code: string; name: string; name_ar: string | null; branch_type: string; is_active: boolean; };
type Register = { id: string; branch_id: string; register_code: string; name: string; name_ar: string | null; status: string; opened_by: string | null; opened_at: string | null; float_amount: number; current_cash: number; metadata: Record<string, unknown>; };
type BranchInv = { id: string; branch_id: string; product_id: string; product_name: string; sku: string | null; quantity: number; reserved_quantity: number; reorder_level: number; unit_cost: number; unit_price: number; metadata?: Record<string, unknown>; };
type TxnItem = { product_id: string | null; product_name: string; product_name_ar: string | null; sku: string | null; quantity: number; unit_price: number; discount_percent: number; cost_price: number; };

const TAX_RATE = 0.15;

function formatEGP(n: number) {
  return new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", minimumFractionDigits: 2 }).format(n);
}

const PAYMENT_METHODS = [
  { id: "cash", icon: Banknote, labelEn: "Cash", labelAr: "نقداً", color: "text-emerald-600" },
  { id: "card", icon: CreditCard, labelEn: "Card", labelAr: "بطاقة", color: "text-blue-600" },
  { id: "mobile_wallet", icon: Smartphone, labelEn: "Mobile", labelAr: "موبايل", color: "text-violet-600" },
  { id: "split", icon: ArrowLeftRight, labelEn: "Split", labelAr: "مقسم", color: "text-amber-600" },
] as const;

const SORT_OPTIONS = [
  { id: "name", labelEn: "Name", labelAr: "الاسم" },
  { id: "price_low", labelEn: "Price ↑", labelAr: "السعر ↑" },
  { id: "price_high", labelEn: "Price ↓", labelAr: "السعر ↓" },
  { id: "stock", labelEn: "Stock ↓", labelAr: "المخزون ↓" },
] as const;

interface HeldTxn {
  id: string;
  customerName: string;
  items: TxnItem[];
  total: number;
  heldAt: Date;
  note: string;
}

export default function POS() {
  const { lang, isRtl } = useLanguage();
  const { workspace } = useAuth();
  const wsId = workspace?.id || "demo";
  const ds = useMemo(() => getDataSource(), []);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [registers, setRegisters] = useState<Register[]>([]);
  const [branchInventory, setBranchInventory] = useState<BranchInv[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedRegister, setSelectedRegister] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [showFilters, setShowFilters] = useState(false);

  const [cart, setCart] = useState<TxnItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [cashierName, setCashierName] = useState("Fatima Nasser");
  const [notes, setNotes] = useState("");

  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState<null | { txnNumber: string; total: number; items: TxnItem[] }>(null);
  const [isOffline, setIsOffline] = useState(false);

  // Drawers
  const [showCustomerDrawer, setShowCustomerDrawer] = useState(false);
  const [showProductDrawer, setShowProductDrawer] = useState<BranchInv | null>(null);
  const [showReports, setShowReports] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [showHeld, setShowHeld] = useState(false);
  const [heldTransactions, setHeldTransactions] = useState<HeldTxn[]>([]);

  // Split payment
  const [splitCash, setSplitCash] = useState("");
  const [splitCard, setSplitCard] = useState("");

  // Quick discount presets
  const DISCOUNT_PRESETS = [5, 10, 15, 20, 25, 50];

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [b, r, bi] = await Promise.all([
        ds.branches.list(wsId),
        ds.pos_registers.list(wsId),
        ds.branch_inventory.list(wsId),
      ]);
      setBranches(b.filter((x: Branch) => x.is_active));
      setRegisters(r as Register[]);
      setBranchInventory(bi as BranchInv[]);
      if (b.length > 0) setSelectedBranch(b[0].id);
      setLoading(false);
    }
    load();
  }, [wsId, ds]);

  useEffect(() => {
    const online = () => setIsOffline(false);
    const offline = () => setIsOffline(true);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    setIsOffline(!navigator.onLine);
    return () => { window.removeEventListener("online", online); window.removeEventListener("offline", offline); };
  }, []);

  const activeRegisters = useMemo(
    () => registers.filter((r) => r.branch_id === selectedBranch && r.status === "active"),
    [registers, selectedBranch]
  );

  useEffect(() => {
    if (activeRegisters.length > 0 && !activeRegisters.find((r) => r.id === selectedRegister)) {
      setSelectedRegister(activeRegisters[0].id);
    }
  }, [activeRegisters, selectedRegister]);

  const products = useMemo(() => {
    if (!selectedBranch) return [];
    return branchInventory.filter((bi) => bi.branch_id === selectedBranch && bi.quantity - bi.reserved_quantity > 0);
  }, [branchInventory, selectedBranch]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      const cat = (p.metadata as Record<string, unknown>)?.category as string || "General";
      cats.add(cat);
    });
    return ["all", ...Array.from(cats)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => p.product_name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)));
    }
    if (activeCategory !== "all") {
      list = list.filter((p) => ((p.metadata as Record<string, unknown>)?.category as string || "General") === activeCategory);
    }
    list = list.filter((p) => p.unit_price >= priceRange[0] && p.unit_price <= priceRange[1]);
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "price_low": return a.unit_price - b.unit_price;
        case "price_high": return b.unit_price - a.unit_price;
        case "stock": return (b.quantity - b.reserved_quantity) - (a.quantity - a.reserved_quantity);
        default: return a.product_name.localeCompare(b.product_name);
      }
    });
    return list;
  }, [products, searchQuery, activeCategory, sortBy, priceRange]);

  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
    const discount = subtotal * (discountPercent / 100);
    const afterDiscount = subtotal - discount;
    const tax = afterDiscount * TAX_RATE;
    const total = afterDiscount + tax;
    return { subtotal, discount, tax, total, itemCount: cart.reduce((s, i) => s + i.quantity, 0), savings: cart.reduce((s, i) => s + i.cost_price * i.quantity, 0) };
  }, [cart, discountPercent]);

  const addToCart = useCallback((product: BranchInv) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.product_id);
      if (existing) {
        if (existing.quantity >= product.quantity - product.reserved_quantity) return prev;
        return prev.map((i) => i.product_id === product.product_id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        product_id: product.product_id,
        product_name: product.product_name,
        product_name_ar: product.product_name,
        sku: product.sku,
        quantity: 1,
        unit_price: product.unit_price,
        discount_percent: 0,
        cost_price: product.unit_cost,
      }];
    });
  }, []);

  const updateQuantity = useCallback((idx: number, delta: number) => {
    setCart((prev) => {
      const item = prev[idx];
      if (!item) return prev;
      const newQty = item.quantity + delta;
      if (newQty <= 0) return prev.filter((_, j) => j !== idx);
      const prod = products.find((p) => p.product_id === item.product_id);
      if (prod && newQty > prod.quantity - prod.reserved_quantity) return prev;
      return prev.map((it, i) => i === idx ? { ...it, quantity: newQty } : it);
    });
  }, [products]);

  const updateItemDiscount = useCallback((idx: number, pct: number) => {
    setCart((prev) => prev.map((item, i) => i === idx ? { ...item, discount_percent: Math.min(100, Math.max(0, pct)) } : item));
  }, []);

  const removeItem = useCallback((idx: number) => {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const holdTransaction = useCallback(() => {
    if (cart.length === 0) return;
    const held: HeldTxn = {
      id: `held-${Date.now()}`,
      customerName,
      items: [...cart],
      total: cartTotals.total,
      heldAt: new Date(),
      note: notes,
    };
    setHeldTransactions((prev) => [...prev, held]);
    setCart([]);
    setDiscountPercent(0);
    setCustomerName("");
    setCustomerPhone("");
    setNotes("");
  }, [cart, cartTotals, customerName, notes]);

  const recallHeld = useCallback((id: string) => {
    const held = heldTransactions.find((h) => h.id === id);
    if (!held) return;
    setCart(held.items);
    setCustomerName(held.customerName);
    setNotes(held.note);
    setHeldTransactions((prev) => prev.filter((h) => h.id !== id));
    setShowHeld(false);
  }, [heldTransactions]);

  const discardHeld = useCallback((id: string) => {
    setHeldTransactions((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const processPayment = useCallback(async () => {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1200));
    const txnNumber = `TXN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    await ds.pos_transactions.create(wsId, {
      branch_id: selectedBranch,
      register_id: selectedRegister,
      transaction_number: txnNumber,
      customer_name: customerName || null,
      customer_phone: customerPhone || null,
      subtotal: cartTotals.subtotal,
      discount_amount: cartTotals.discount,
      discount_percent: discountPercent,
      tax_amount: cartTotals.tax,
      tax_rate: TAX_RATE * 100,
      total: cartTotals.total,
      currency: "EGP",
      payment_method: paymentMethod as "cash" | "card" | "mobile_wallet" | "split",
      payment_details: paymentMethod === "cash" ? { cash_received: Number(cashReceived), change: Number(cashReceived) - cartTotals.total }
        : paymentMethod === "split" ? { cash: Number(splitCash), card: Number(splitCard) }
        : {},
      status: "completed",
      cashier_name: cashierName,
      notes: notes || null,
      receipt_printed: false,
      loyalty_points_earned: Math.floor(cartTotals.subtotal),
      loyalty_points_redeemed: 0,
      metadata: {},
    });
    for (const item of cart) {
      await ds.pos_transaction_items.create(wsId, {
        transaction_id: txnNumber,
        product_id: item.product_id,
        product_name: item.product_name,
        product_name_ar: item.product_name_ar,
        sku: item.sku,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_amount: item.unit_price * item.quantity * (item.discount_percent / 100),
        discount_percent: item.discount_percent,
        total: item.unit_price * item.quantity * (1 - item.discount_percent / 100),
        cost_price: item.cost_price,
        branch_id: selectedBranch,
        metadata: {},
      });
    }
    setReceipt({ txnNumber, total: cartTotals.total, items: [...cart] });
    setProcessing(false);
    setShowPayment(false);
    setCart([]);
    setDiscountPercent(0);
    setCustomerName("");
    setCustomerPhone("");
    setCashReceived("");
    setSplitCash("");
    setSplitCard("");
    setNotes("");
  }, [cart, cartTotals, paymentMethod, cashReceived, splitCash, splitCard, selectedBranch, selectedRegister, customerName, customerPhone, cashierName, notes, discountPercent, wsId, ds]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <Store size={24} className="mx-auto text-muted-foreground/40 animate-pulse" />
          <p className="text-[13px] text-muted-foreground">{lang === "ar" ? "جاري التحميل..." : "Loading POS..."}</p>
        </div>
      </div>
    );
  }

  if (receipt) {
    return (
      <div className="h-full flex items-center justify-center bg-background p-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm">
          <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
              <Check size={24} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-[16px] font-semibold text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>
                {lang === "ar" ? "تم بنجاح" : "Payment Successful"}
              </p>
              <p className="text-[12px] text-muted-foreground mt-1">{receipt.txnNumber}</p>
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{lang === "ar" ? "المبلغ" : "Total"}</p>
              <p className="text-[22px] font-bold text-foreground mt-1" style={{ fontFamily: "var(--app-font-serif)" }}>
                {formatEGP(receipt.total)}
              </p>
            </div>
            <div className="border-t border-border pt-3 space-y-1.5 text-left">
              {receipt.items.map((item, i) => (
                <div key={i} className="flex justify-between text-[12px]">
                  <span className="text-muted-foreground">{item.product_name} × {item.quantity}</span>
                  <span className="text-foreground font-medium">{formatEGP(item.unit_price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setReceipt(null)} className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5">
                <Plus size={13} /> {lang === "ar" ? "بيع جديد" : "New Sale"}
              </button>
              <button onClick={() => setReceipt(null)} className="h-10 px-4 rounded-xl border border-border text-[13px] text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1.5">
                <Printer size={13} /> {lang === "ar" ? "طباعة" : "Print"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-56px)] flex overflow-hidden bg-background">
      {/* ─── Left: Product Grid ─── */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-border/40">
        {/* Top Bar */}
        <div className="shrink-0 px-4 py-3 border-b border-border/40 bg-card/50">
          {/* Quick Actions Row */}
          <div className="flex items-center gap-1.5 mb-3">
            <button onClick={() => setShowCustomerDrawer(true)} className="h-8 px-3 rounded-lg bg-muted/50 hover:bg-muted text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
              <Users size={12} /> {lang === "ar" ? "العملاء" : "Customers"}
            </button>
            <button onClick={() => setShowReports(true)} className="h-8 px-3 rounded-lg bg-muted/50 hover:bg-muted text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
              <BarChart3 size={12} /> {lang === "ar" ? "التقارير" : "Reports"}
            </button>
            <button onClick={() => setShowTransactions(true)} className="h-8 px-3 rounded-lg bg-muted/50 hover:bg-muted text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
              <History size={12} /> {lang === "ar" ? "السجل" : "History"}
            </button>
            <button onClick={() => { holdTransaction(); }} className="h-8 px-3 rounded-lg bg-muted/50 hover:bg-muted text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5" disabled={cart.length === 0}>
              <Pause size={12} /> {lang === "ar" ? "تعليق" : "Hold"}
            </button>
            {heldTransactions.length > 0 && (
              <button onClick={() => setShowHeld(true)} className="h-8 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 text-[11px] font-medium text-amber-700 transition-colors flex items-center gap-1.5 relative">
                <Pause size={12} />
                {heldTransactions.length}
              </button>
            )}
            <div className="ml-auto flex items-center gap-1.5">
              <button onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")} className="w-8 h-8 rounded-lg bg-muted/50 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                {viewMode === "grid" ? <List size={13} /> : <Grid3X3 size={13} />}
              </button>
              <button onClick={() => setShowFilters(!showFilters)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${showFilters ? "bg-primary/10 text-primary" : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"}`}>
                <Filter size={13} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Branch Selector */}
            <div className="relative">
              <select
                value={selectedBranch}
                onChange={(e) => { setSelectedBranch(e.target.value); setCart([]); }}
                className="h-9 pl-8 pr-8 rounded-lg border border-border bg-background text-[13px] text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <MapPin size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none" />
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none" />
            </div>

            {/* Register Selector */}
            <div className="relative">
              <select
                value={selectedRegister}
                onChange={(e) => setSelectedRegister(e.target.value)}
                className="h-9 pl-8 pr-8 rounded-lg border border-border bg-background text-[13px] text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                {activeRegisters.length === 0 && <option>{lang === "ar" ? "لا يوجد كاشير" : "No registers"}</option>}
                {activeRegisters.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <Store size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none" />
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none" />
            </div>

            {/* Status */}
            <div className="ml-auto flex items-center gap-2">
              {isOffline ? (
                <span className="flex items-center gap-1.5 text-[11px] text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  <WifiOff size={11} />
                  {lang === "ar" ? "غير متصل" : "Offline"}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[11px] text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <Wifi size={11} />
                  {lang === "ar" ? "متصل" : "Online"}
                </span>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 mt-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === "ar" ? "بحث بالاسم، SKU، الباركود..." : "Search by name, SKU, barcode..."}
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-background text-[13px] placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-9 px-2 rounded-lg border border-border bg-background text-[11px] appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/30"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>{lang === "ar" ? opt.labelAr : opt.labelEn}</option>
              ))}
            </select>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="pt-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-muted-foreground w-16">{lang === "ar" ? "السعر" : "Price"}</span>
                    <input
                      type="range"
                      min={0}
                      max={10000}
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([0, Number(e.target.value)])}
                      className="flex-1 h-1 accent-primary"
                    />
                    <span className="text-[11px] text-foreground font-medium w-20 text-right">≤ {formatEGP(priceRange[1])}</span>
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`shrink-0 h-7 px-3 rounded-full text-[11px] font-medium transition-all ${
                          activeCategory === cat
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {cat === "all" ? (lang === "ar" ? "الكل" : "All") : cat}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Categories (compact) */}
          {!showFilters && (
            <div className="flex gap-1.5 mt-2.5 overflow-x-auto no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 h-7 px-3 rounded-full text-[11px] font-medium transition-all ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {cat === "all" ? (lang === "ar" ? "الكل" : "All") : cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredProducts.map((product) => {
                const available = product.quantity - product.reserved_quantity;
                const inCart = cart.find((i) => i.product_id === product.product_id);
                return (
                  <motion.button
                    key={product.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => addToCart(product)}
                    onContextMenu={(e) => { e.preventDefault(); setShowProductDrawer(product); }}
                    className="relative bg-card border border-border/60 rounded-xl p-3 text-left hover:border-primary/30 hover:shadow-sm transition-all group"
                  >
                    <div className="w-full aspect-square rounded-lg bg-muted/50 mb-2 flex items-center justify-center relative">
                      <ShoppingCart size={20} className="text-muted-foreground/30 group-hover:text-primary/40 transition-colors" />
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowProductDrawer(product); }}
                        className="absolute top-1.5 left-1.5 w-5 h-5 rounded-md bg-background/80 border border-border/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Eye size={10} className="text-muted-foreground" />
                      </button>
                    </div>
                    <p className="text-[12px] font-medium text-foreground leading-tight truncate">{product.product_name}</p>
                    {product.sku && <p className="text-[10px] text-muted-foreground/60 mt-0.5 font-mono">{product.sku}</p>}
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-[13px] font-semibold text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>
                        {formatEGP(product.unit_price)}
                      </p>
                      {inCart && (
                        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                          {inCart.quantity}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${available <= product.reorder_level ? "bg-amber-500" : "bg-emerald-500"}`} />
                      <p className="text-[10px] text-muted-foreground/60">
                        {available} {lang === "ar" ? "متوفر" : "in stock"}
                      </p>
                      {available <= product.reorder_level && (
                        <AlertTriangle size={9} className="text-amber-500" />
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredProducts.map((product) => {
                const available = product.quantity - product.reserved_quantity;
                const inCart = cart.find((i) => i.product_id === product.product_id);
                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    onContextMenu={(e) => { e.preventDefault(); setShowProductDrawer(product); }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/40 hover:border-primary/30 hover:shadow-sm transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                      <ShoppingCart size={16} className="text-muted-foreground/30" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-foreground truncate">{product.product_name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{product.sku || "—"}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-[12px] font-semibold text-foreground">{formatEGP(product.unit_price)}</p>
                        <div className="flex items-center gap-1 justify-end">
                          <div className={`w-1.5 h-1.5 rounded-full ${available <= product.reorder_level ? "bg-amber-500" : "bg-emerald-500"}`} />
                          <span className="text-[10px] text-muted-foreground">{available}</span>
                        </div>
                      </div>
                      {inCart && (
                        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                          {inCart.quantity}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <ShoppingCart size={24} className="text-muted-foreground/30 mb-2" />
              <p className="text-[13px] text-muted-foreground">
                {lang === "ar" ? "لا توجد منتجات" : "No products found"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Right: Cart ─── */}
      <div className="w-[380px] shrink-0 flex flex-col bg-card">
        {/* Cart Header */}
        <div className="shrink-0 px-4 py-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart size={15} className="text-muted-foreground" />
              <span className="text-[13px] font-medium text-foreground">
                {lang === "ar" ? "سلة المشتريات" : "Cart"}
              </span>
              {cart.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                  {cartTotals.itemCount}
                </span>
              )}
            </div>
            {cart.length > 0 && (
              <button onClick={() => { setCart([]); setDiscountPercent(0); }} className="text-[11px] text-muted-foreground hover:text-rose-500 transition-colors">
                {lang === "ar" ? "مسح الكل" : "Clear"}
              </button>
            )}
          </div>
        </div>

        {/* Customer Info */}
        <div className="shrink-0 px-4 py-3 border-b border-border/40 space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={lang === "ar" ? "اسم العميل" : "Customer name"}
                className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-background text-[12px] placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <button onClick={() => setShowCustomerDrawer(true)} className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors shrink-0">
              <Search size={12} className="text-muted-foreground" />
            </button>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-[12px]">+20</span>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder={lang === "ar" ? "رقم الهاتف" : "Phone number"}
              className="w-full h-8 pl-12 pr-3 rounded-lg border border-border bg-background text-[12px] placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          <AnimatePresence mode="popLayout">
            {cart.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-2">
                  <Receipt size={18} className="text-muted-foreground/40" />
                </div>
                <p className="text-[12px] text-muted-foreground">{lang === "ar" ? "أضف منتجات للبدء" : "Add products to start"}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">{lang === "ar" ? "انقر على منتج لإضافته" : "Click a product to add"}</p>
              </motion.div>
            ) : (
              cart.map((item, idx) => (
                <motion.div
                  key={`${item.product_id}-${idx}`}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-start gap-3 py-2.5 border-b border-border/30 last:border-0"
                >
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <ShoppingCart size={14} className="text-muted-foreground/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] font-medium text-foreground truncate">{item.product_name}</p>
                      {item.discount_percent > 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600 shrink-0 ml-1">-{item.discount_percent}%</span>
                      )}
                    </div>
                    {item.sku && <p className="text-[10px] text-muted-foreground/60 font-mono">{item.sku}</p>}
                    <div className="flex items-center gap-2 mt-1.5">
                      <button onClick={() => updateQuantity(idx, -1)} className="w-6 h-6 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors">
                        <Minus size={11} />
                      </button>
                      <span className="text-[12px] font-medium w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(idx, 1)} className="w-6 h-6 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors">
                        <Plus size={11} />
                      </button>
                      <div className="ml-auto flex items-center gap-1">
                        <Percent size={9} className="text-muted-foreground/40" />
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={item.discount_percent}
                          onChange={(e) => updateItemDiscount(idx, Number(e.target.value))}
                          className="w-10 h-5 px-1 rounded border border-border bg-background text-[10px] text-center focus:outline-none focus:ring-1 focus:ring-primary/30"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[12px] font-semibold text-foreground">
                      {item.discount_percent > 0
                        ? formatEGP(item.unit_price * item.quantity * (1 - item.discount_percent / 100))
                        : formatEGP(item.unit_price * item.quantity)}
                    </p>
                    {item.discount_percent > 0 && (
                      <p className="text-[9px] text-muted-foreground line-through">{formatEGP(item.unit_price * item.quantity)}</p>
                    )}
                    <button onClick={() => removeItem(idx)} className="mt-1 text-muted-foreground/40 hover:text-rose-500 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Discount + Totals */}
        {cart.length > 0 && (
          <div className="shrink-0 border-t border-border/40 px-4 py-3 space-y-3">
            {/* Quick Discount Presets */}
            <div className="flex items-center gap-1.5">
              <Tag size={12} className="text-muted-foreground/50 shrink-0" />
              <div className="flex gap-1 overflow-x-auto no-scrollbar flex-1">
                {DISCOUNT_PRESETS.map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setDiscountPercent(pct === discountPercent ? 0 : pct)}
                    className={`shrink-0 h-6 px-2 rounded-md text-[10px] font-medium transition-all ${
                      discountPercent === pct
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={0}
                max={100}
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                className="w-12 h-6 px-1 rounded-md border border-border bg-background text-[10px] text-right focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>

            {/* Notes */}
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={lang === "ar" ? "ملاحظات (اختياري)" : "Notes (optional)"}
              className="w-full h-8 px-3 rounded-lg border border-border bg-background text-[12px] placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />

            {/* Totals */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[12px]">
                <span className="text-muted-foreground">{lang === "ar" ? "المجموع الفرعي" : "Subtotal"}</span>
                <span className="text-foreground">{formatEGP(cartTotals.subtotal)}</span>
              </div>
              {cartTotals.discount > 0 && (
                <div className="flex justify-between text-[12px]">
                  <span className="text-muted-foreground">{lang === "ar" ? "الخصم" : "Discount"} ({discountPercent}%)</span>
                  <span className="text-rose-500">-{formatEGP(cartTotals.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[12px]">
                <span className="text-muted-foreground">{lang === "ar" ? "الضريبة (15%)" : "VAT (15%)"}</span>
                <span className="text-foreground">{formatEGP(cartTotals.tax)}</span>
              </div>
              <div className="flex justify-between text-[14px] font-semibold pt-1.5 border-t border-border/40">
                <span className="text-foreground">{lang === "ar" ? "الإجمالي" : "Total"}</span>
                <span className="text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>{formatEGP(cartTotals.total)}</span>
              </div>
            </div>

            {/* Loyalty Points Preview */}
            <div className="flex items-center gap-1.5 text-[10px] text-primary">
              <Star size={10} className="fill-primary" />
              <span>{lang === "ar" ? "سيكسب العميل" : "Customer earns"} {Math.floor(cartTotals.subtotal)} {lang === "ar" ? "نقطة ولاء" : "loyalty points"}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={holdTransaction}
                className="h-10 px-3 rounded-xl border border-border text-[12px] font-medium text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Pause size={12} /> {lang === "ar" ? "تعليق" : "Hold"}
              </button>
              <button
                onClick={() => setShowPayment(true)}
                className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <CreditCard size={15} />
                {lang === "ar" ? "دفع" : "Pay"} — {formatEGP(cartTotals.total)}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Payment Modal ─── */}
      <AnimatePresence>
        {showPayment && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => !processing && setShowPayment(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card rounded-2xl border border-border shadow-xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
                <h3 className="text-[15px] font-semibold text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>
                  {lang === "ar" ? "إتمام الدفع" : "Complete Payment"}
                </h3>
                <button onClick={() => !processing && setShowPayment(false)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
                  <X size={14} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Total */}
                <div className="text-center py-3 bg-muted/30 rounded-xl">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{lang === "ar" ? "المبلغ المستحق" : "Amount Due"}</p>
                  <p className="text-[26px] font-bold text-foreground mt-1" style={{ fontFamily: "var(--app-font-serif)" }}>
                    {formatEGP(cartTotals.total)}
                  </p>
                </div>

                {/* Payment Methods */}
                <div className="grid grid-cols-4 gap-2">
                  {PAYMENT_METHODS.map((pm) => {
                    const Icon = pm.icon;
                    return (
                      <button
                        key={pm.id}
                        onClick={() => setPaymentMethod(pm.id)}
                        className={`h-16 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all ${
                          paymentMethod === pm.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-border/80"
                        }`}
                      >
                        <Icon size={18} className={paymentMethod === pm.id ? "text-primary" : "text-muted-foreground"} />
                        <span className={`text-[10px] font-medium ${paymentMethod === pm.id ? "text-primary" : "text-muted-foreground"}`}>
                          {lang === "ar" ? pm.labelAr : pm.labelEn}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Cash Input */}
                {paymentMethod === "cash" && (
                  <div className="space-y-2">
                    <label className="text-[11px] text-muted-foreground uppercase tracking-wider">{lang === "ar" ? "المبلغ المستلم" : "Cash Received"}</label>
                    <input
                      type="number"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      placeholder={cartTotals.total.toFixed(2)}
                      className="w-full h-11 px-4 rounded-xl border border-border bg-background text-[16px] font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      autoFocus
                    />
                    {Number(cashReceived) >= cartTotals.total && (
                      <div className="flex justify-between text-[13px] bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg border border-emerald-200">
                        <span>{lang === "ar" ? "المصروف" : "Change"}</span>
                        <span className="font-semibold">{formatEGP(Number(cashReceived) - cartTotals.total)}</span>
                      </div>
                    )}
                    {/* Quick cash buttons */}
                    <div className="flex gap-1.5">
                      {[cartTotals.total, Math.ceil(cartTotals.total / 50) * 50, Math.ceil(cartTotals.total / 100) * 100].filter((v, i, a) => a.indexOf(v) === i).map((amt) => (
                        <button
                          key={amt}
                          onClick={() => setCashReceived(String(amt))}
                          className="flex-1 h-7 rounded-md bg-muted text-[10px] font-medium text-muted-foreground hover:bg-muted/80 transition-colors"
                        >
                          {formatEGP(amt)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Split Payment */}
                {paymentMethod === "split" && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1 block">{lang === "ar" ? "نقداً" : "Cash Amount"}</label>
                      <input
                        type="number"
                        value={splitCash}
                        onChange={(e) => { setSplitCash(e.target.value); setSplitCard(String(Math.max(0, cartTotals.total - Number(e.target.value)))); }}
                        placeholder="0"
                        className="w-full h-10 px-3 rounded-xl border border-border bg-background text-[14px] font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1 block">{lang === "ar" ? "بطاقة" : "Card Amount"}</label>
                      <input
                        type="number"
                        value={splitCard}
                        onChange={(e) => { setSplitCard(e.target.value); setSplitCash(String(Math.max(0, cartTotals.total - Number(e.target.value)))); }}
                        placeholder="0"
                        className="w-full h-10 px-3 rounded-xl border border-border bg-background text-[14px] font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div className="flex justify-between text-[12px] text-muted-foreground">
                      <span>{lang === "ar" ? "المجموع" : "Total"}</span>
                      <span className="font-medium text-foreground">{formatEGP(Number(splitCash || 0) + Number(splitCard || 0))}</span>
                    </div>
                  </div>
                )}

                {/* Process Button */}
                <button
                  onClick={processPayment}
                  disabled={processing || (paymentMethod === "cash" && Number(cashReceived) < cartTotals.total) || (paymentMethod === "split" && (Number(splitCash || 0) + Number(splitCard || 0)) < cartTotals.total)}
                  className="w-full h-12 rounded-xl bg-primary text-primary-foreground text-[14px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <RotateCcw size={15} className="animate-spin" />
                      {lang === "ar" ? "جاري المعالجة..." : "Processing..."}
                    </>
                  ) : (
                    <>
                      <Check size={15} />
                      {lang === "ar" ? "تأكيد الدفع" : "Confirm Payment"}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Drawers ─── */}
      {showCustomerDrawer && <CustomerDrawer onClose={() => setShowCustomerDrawer(false)} />}
      {showProductDrawer && <ProductDrawer product={showProductDrawer} onClose={() => setShowProductDrawer(null)} />}
      {showReports && <ReportsPanel branchId={selectedBranch} onClose={() => setShowReports(false)} />}
      {showTransactions && <TransactionDrawer branchId={selectedBranch} onClose={() => setShowTransactions(false)} />}
      {showHeld && (
        <HoldTransactions
          held={heldTransactions}
          onRecall={recallHeld}
          onDiscard={discardHeld}
          onClose={() => setShowHeld(false)}
        />
      )}
    </div>
  );
}
