import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { getDataSource } from "../../lib/data-source";
import type { Database } from "../../lib/database.types";
import {
  X, Search, Clock, CreditCard, Banknote, Smartphone, Check,
  RotateCcw, Printer, ChevronDown, Filter, ArrowUpDown,
} from "lucide-react";

type Txn = Database["public"]["Tables"]["pos_transactions"]["Row"];
type TxnItem = Database["public"]["Tables"]["pos_transaction_items"]["Row"];

function formatEGP(n: number) {
  return new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", minimumFractionDigits: 2 }).format(n);
}

export function TransactionDrawer({ branchId, onClose }: { branchId: string; onClose: () => void }) {
  const { lang } = useLanguage();
  const ds = useMemo(() => getDataSource(), []);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [txnItems, setTxnItems] = useState<TxnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "voided">("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [selectedTxn, setSelectedTxn] = useState<Txn | null>(null);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");

  useEffect(() => {
    async function load() {
      const [t, items] = await Promise.all([
        ds.pos_transactions.list("demo"),
        ds.pos_transaction_items.list("demo"),
      ]);
      setTxns((t as Txn[]).filter((x) => x.branch_id === branchId));
      setTxnItems(items as TxnItem[]);
      setLoading(false);
    }
    load();
  }, [ds, branchId]);

  const filtered = useMemo(() => {
    let list = txns;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((t) =>
        t.transaction_number.toLowerCase().includes(q) ||
        t.customer_name?.toLowerCase().includes(q) ||
        t.customer_phone?.includes(q) ||
        t.cashier_name?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") list = list.filter((t) => t.status === statusFilter);
    if (paymentFilter !== "all") list = list.filter((t) => t.payment_method === paymentFilter);
    list = [...list].sort((a, b) => {
      switch (sortOrder) {
        case "newest": return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "highest": return b.total - a.total;
        case "lowest": return a.total - b.total;
      }
    });
    return list;
  }, [txns, searchQuery, statusFilter, paymentFilter, sortOrder]);

  const items = useMemo(
    () => selectedTxn ? txnItems.filter((i) => i.transaction_id === selectedTxn.id) : [],
    [txnItems, selectedTxn]
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-[480px] bg-background border-l border-border shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 px-5 py-4 border-b border-border/40">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>
              {selectedTxn ? selectedTxn.transaction_number : (lang === "ar" ? "سجل المعاملات" : "Transaction History")}
            </h3>
            <div className="flex items-center gap-1.5">
              {selectedTxn && (
                <button onClick={() => setSelectedTxn(null)} className="text-[11px] text-primary hover:underline">
                  {lang === "ar" ? "العودة" : "Back"}
                </button>
              )}
              <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
                <X size={14} />
              </button>
            </div>
          </div>

          {!selectedTxn && (
            <div className="space-y-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={lang === "ar" ? "بحث بالرقم أو اسم العميل..." : "Search by number, customer, or cashier..."}
                  className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-background text-[13px] placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
              <div className="flex gap-1.5">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="h-7 px-2 rounded-md border border-border bg-background text-[11px] appearance-none cursor-pointer"
                >
                  <option value="all">{lang === "ar" ? "الكل" : "All Status"}</option>
                  <option value="completed">{lang === "ar" ? "مكتملة" : "Completed"}</option>
                  <option value="voided">{lang === "ar" ? "ملغاة" : "Voided"}</option>
                </select>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="h-7 px-2 rounded-md border border-border bg-background text-[11px] appearance-none cursor-pointer"
                >
                  <option value="all">{lang === "ar" ? "كل الدفعات" : "All Payments"}</option>
                  <option value="cash">{lang === "ar" ? "نقداً" : "Cash"}</option>
                  <option value="card">{lang === "ar" ? "بطاقة" : "Card"}</option>
                  <option value="mobile_wallet">{lang === "ar" ? "موبايل" : "Mobile"}</option>
                  <option value="split">{lang === "ar" ? "مقسم" : "Split"}</option>
                </select>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
                  className="h-7 px-2 rounded-md border border-border bg-background text-[11px] appearance-none cursor-pointer"
                >
                  <option value="newest">{lang === "ar" ? "الأحدث" : "Newest"}</option>
                  <option value="oldest">{lang === "ar" ? "الأقدم" : "Oldest"}</option>
                  <option value="highest">{lang === "ar" ? "الأعلى" : "Highest"}</option>
                  <option value="lowest">{lang === "ar" ? "الأدنى" : "Lowest"}</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-pulse text-[13px] text-muted-foreground">{lang === "ar" ? "جاري التحميل..." : "Loading..."}</div>
            </div>
          ) : selectedTxn ? (
            /* Transaction Detail */
            <div className="p-5 space-y-4">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${
                  selectedTxn.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"
                }`}>
                  {selectedTxn.status === "completed" ? (lang === "ar" ? "مكتملة" : "Completed") : (lang === "ar" ? "ملغاة" : "Voided")}
                </span>
                <span className="text-[11px] text-muted-foreground">{new Date(selectedTxn.created_at).toLocaleString()}</span>
              </div>

              {/* Customer */}
              <div className="p-3 rounded-xl bg-muted/30">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{lang === "ar" ? "العميل" : "Customer"}</p>
                <p className="text-[13px] font-medium text-foreground">{selectedTxn.customer_name || (lang === "ar" ? "عميل عادي" : "Walk-in")}</p>
                {selectedTxn.customer_phone && <p className="text-[11px] text-muted-foreground">{selectedTxn.customer_phone}</p>}
              </div>

              {/* Items */}
              <div>
                <p className="text-[11px] text-muted-foreground mb-2">{lang === "ar" ? "المنتجات" : "Items"}</p>
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-foreground truncate">{item.product_name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {item.quantity} × {formatEGP(item.unit_price)}
                        {item.discount_percent > 0 && <span className="text-rose-500"> (-{item.discount_percent}%)</span>}
                      </p>
                    </div>
                    <span className="text-[12px] font-semibold text-foreground shrink-0">{formatEGP(item.total)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1.5 pt-2 border-t border-border/40">
                <div className="flex justify-between text-[12px]">
                  <span className="text-muted-foreground">{lang === "ar" ? "المجموع الفرعي" : "Subtotal"}</span>
                  <span className="text-foreground">{formatEGP(selectedTxn.subtotal)}</span>
                </div>
                {selectedTxn.discount_amount > 0 && (
                  <div className="flex justify-between text-[12px]">
                    <span className="text-muted-foreground">{lang === "ar" ? "الخصم" : "Discount"}</span>
                    <span className="text-rose-500">-{formatEGP(selectedTxn.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[12px]">
                  <span className="text-muted-foreground">{lang === "ar" ? "الضريبة" : "Tax"}</span>
                  <span className="text-foreground">{formatEGP(selectedTxn.tax_amount)}</span>
                </div>
                <div className="flex justify-between text-[14px] font-semibold pt-1.5 border-t border-border/40">
                  <span className="text-foreground">{lang === "ar" ? "الإجمالي" : "Total"}</span>
                  <span className="text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>{formatEGP(selectedTxn.total)}</span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="p-3 rounded-xl bg-muted/30 space-y-1.5">
                <div className="flex items-center gap-2">
                  {selectedTxn.payment_method === "cash" ? <Banknote size={12} /> :
                   selectedTxn.payment_method === "card" ? <CreditCard size={12} /> :
                   <Smartphone size={12} />}
                  <span className="text-[11px] text-muted-foreground capitalize">{selectedTxn.payment_method?.replace("_", " ")}</span>
                </div>
                {selectedTxn.payment_method === "cash" && selectedTxn.payment_details && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">{lang === "ar" ? "المبلغ المستلم" : "Cash Received"}</span>
                    <span>{formatEGP(((selectedTxn.payment_details as Record<string, unknown>)?.cash_received as number) || 0)}</span>
                  </div>
                )}
                {selectedTxn.loyalty_points_earned > 0 && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">{lang === "ar" ? "نقاط الولاء" : "Loyalty Points"}</span>
                    <span className="text-primary">+{selectedTxn.loyalty_points_earned}</span>
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedTxn.notes && (
                <div className="p-3 rounded-xl border border-border/40">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{lang === "ar" ? "ملاحظات" : "Notes"}</p>
                  <p className="text-[12px] text-foreground">{selectedTxn.notes}</p>
                </div>
              )}

              {/* Cashier */}
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>{lang === "ar" ? "الكاشير" : "Cashier"}: {selectedTxn.cashier_name}</span>
              </div>
            </div>
          ) : (
            /* Transaction List */
            <div className="p-3 space-y-1.5">
              {filtered.length === 0 ? (
                <div className="text-center py-12">
                  <Clock size={24} className="mx-auto text-muted-foreground/20 mb-2" />
                  <p className="text-[12px] text-muted-foreground">{lang === "ar" ? "لا توجد معاملات" : "No transactions"}</p>
                </div>
              ) : (
                filtered.map((txn) => (
                  <button
                    key={txn.id}
                    onClick={() => setSelectedTxn(txn)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-border/30 hover:bg-muted/40 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      {txn.payment_method === "cash" ? <Banknote size={14} /> :
                       txn.payment_method === "card" ? <CreditCard size={14} /> :
                       <Smartphone size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[12px] font-medium text-foreground truncate">{txn.customer_name || (lang === "ar" ? "عميل" : "Walk-in")}</p>
                        {txn.status === "voided" && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600">{lang === "ar" ? "ملغاة" : "Voided"}</span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">{txn.transaction_number} • {new Date(txn.created_at).toLocaleString()}</p>
                    </div>
                    <span className={`text-[13px] font-semibold shrink-0 ${txn.status === "voided" ? "text-rose-500 line-through" : "text-foreground"}`}>
                      {formatEGP(txn.total)}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
