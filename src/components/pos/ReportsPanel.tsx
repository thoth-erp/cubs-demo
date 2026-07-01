import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { getDataSource } from "../../lib/data-source";
import type { Database } from "../../lib/database.types";
import {
  X, TrendingUp, TrendingDown, ShoppingBag, CreditCard, Banknote,
  Smartphone, Clock, BarChart3, ArrowUpRight, ArrowDownRight, RefreshCw,
} from "lucide-react";

type Txn = Database["public"]["Tables"]["pos_transactions"]["Row"];
type TxnItem = Database["public"]["Tables"]["pos_transaction_items"]["Row"];

function formatEGP(n: number) {
  return new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", minimumFractionDigits: 2 }).format(n);
}

export function ReportsPanel({ branchId, onClose }: { branchId: string; onClose: () => void }) {
  const { lang } = useLanguage();
  const ds = useMemo(() => getDataSource(), []);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [txnItems, setTxnItems] = useState<TxnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"today" | "week" | "month">("today");

  useEffect(() => {
    async function load() {
      const [t, items] = await Promise.all([
        ds.pos_transactions.list("demo"),
        ds.pos_transaction_items.list("demo"),
      ]);
      setTxns(t as Txn[]);
      setTxnItems(items as TxnItem[]);
      setLoading(false);
    }
    load();
  }, [ds]);

  const filteredTxns = useMemo(() => {
    const now = new Date();
    const cutoff = period === "today"
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
      : period === "week"
        ? new Date(now.getTime() - 7 * 86400000)
        : new Date(now.getTime() - 30 * 86400000);
    return txns.filter((t) => t.branch_id === branchId && new Date(t.created_at) >= cutoff && t.status === "completed");
  }, [txns, branchId, period]);

  const stats = useMemo(() => {
    const total = filteredTxns.reduce((s, t) => s + t.total, 0);
    const count = filteredTxns.length;
    const avg = count ? total / count : 0;
    const cash = filteredTxns.filter((t) => t.payment_method === "cash").reduce((s, t) => s + t.total, 0);
    const card = filteredTxns.filter((t) => t.payment_method === "card").reduce((s, t) => s + t.total, 0);
    const mobile = filteredTxns.filter((t) => t.payment_method === "mobile_wallet").reduce((s, t) => s + t.total, 0);
    const split = filteredTxns.filter((t) => t.payment_method === "split").reduce((s, t) => s + t.total, 0);
    const discount = filteredTxns.reduce((s, t) => s + t.discount_amount, 0);
    const tax = filteredTxns.reduce((s, t) => s + t.tax_amount, 0);
    const loyalty = filteredTxns.reduce((s, t) => s + t.loyalty_points_earned, 0);
    return { total, count, avg, cash, card, mobile, split, discount, tax, loyalty };
  }, [filteredTxns]);

  const topProducts = useMemo(() => {
    const relevantItems = txnItems.filter((item) => filteredTxns.some((t) => t.id === item.transaction_id));
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    relevantItems.forEach((item) => {
      const existing = map.get(item.product_name) || { name: item.product_name, qty: 0, revenue: 0 };
      existing.qty += item.quantity;
      existing.revenue += item.total;
      map.set(item.product_name, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [txnItems, filteredTxns]);

  const paymentMethods = [
    { label: "Cash", labelAr: "نقداً", value: stats.cash, icon: Banknote, color: "bg-emerald-500" },
    { label: "Card", labelAr: "بطاقة", value: stats.card, icon: CreditCard, color: "bg-blue-500" },
    { label: "Mobile", labelAr: "موبايل", value: stats.mobile, icon: Smartphone, color: "bg-violet-500" },
    { label: "Split", labelAr: "مقسم", value: stats.split, icon: RefreshCw, color: "bg-amber-500" },
  ];

  const periods = [
    { id: "today" as const, labelEn: "Today", labelAr: "اليوم" },
    { id: "week" as const, labelEn: "7 Days", labelAr: "7 أيام" },
    { id: "month" as const, labelEn: "30 Days", labelAr: "30 يوم" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-[460px] bg-background border-l border-border shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 px-5 py-4 border-b border-border/40">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>
              {lang === "ar" ? "التقارير" : "Sales Reports"}
            </h3>
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
              <X size={14} />
            </button>
          </div>
          <div className="flex gap-1 bg-muted/50 rounded-lg p-0.5">
            {periods.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`flex-1 h-7 rounded-md text-[11px] font-medium transition-colors ${
                  period === p.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {lang === "ar" ? p.labelAr : p.labelEn}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-pulse text-[13px] text-muted-foreground">{lang === "ar" ? "جاري التحميل..." : "Loading..."}</div>
            </div>
          ) : (
            <>
              {/* Revenue Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={14} className="text-primary" />
                  <span className="text-[11px] text-primary font-medium">{lang === "ar" ? "إجمالي الإيرادات" : "Total Revenue"}</span>
                </div>
                <p className="text-[28px] font-bold text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>
                  {formatEGP(stats.total)}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-[11px] text-muted-foreground">{stats.count} {lang === "ar" ? "معاملة" : "transactions"}</span>
                  <span className="text-[11px] text-muted-foreground">•</span>
                  <span className="text-[11px] text-muted-foreground">{lang === "ar" ? "متوسط" : "avg"} {formatEGP(stats.avg)}</span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-xl bg-muted/30 text-center">
                  <p className="text-[12px] font-bold text-foreground">{formatEGP(stats.discount)}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{lang === "ar" ? "الخصومات" : "Discounts"}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 text-center">
                  <p className="text-[12px] font-bold text-foreground">{formatEGP(stats.tax)}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{lang === "ar" ? "الضريبة" : "Tax"}</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/5 text-center">
                  <p className="text-[12px] font-bold text-primary">{stats.loyalty}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{lang === "ar" ? "نقاط" : "Points"}</p>
                </div>
              </div>

              {/* Payment Breakdown */}
              <div>
                <h4 className="text-[12px] font-medium text-foreground mb-3">{lang === "ar" ? "طرق الدفع" : "Payment Methods"}</h4>
                <div className="space-y-2">
                  {paymentMethods.map((pm) => {
                    const pct = stats.total > 0 ? (pm.value / stats.total) * 100 : 0;
                    return (
                      <div key={pm.label} className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${pm.color}`} />
                        <span className="text-[11px] text-muted-foreground w-16">{lang === "ar" ? pm.labelAr : pm.label}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-muted/60 overflow-hidden">
                          <div className={`h-full rounded-full ${pm.color}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[11px] font-medium text-foreground w-20 text-right">{formatEGP(pm.value)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Products */}
              <div>
                <h4 className="text-[12px] font-medium text-foreground mb-3">{lang === "ar" ? "الأكثر مبيعاً" : "Top Products"}</h4>
                {topProducts.length > 0 ? (
                  <div className="space-y-2">
                    {topProducts.map((p, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                        <span className="w-5 h-5 rounded-md bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-foreground truncate">{p.name}</p>
                          <p className="text-[10px] text-muted-foreground">{p.qty} {lang === "ar" ? "قطع" : "units"}</p>
                        </div>
                        <span className="text-[12px] font-semibold text-foreground">{formatEGP(p.revenue)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <BarChart3 size={18} className="mx-auto text-muted-foreground/20 mb-2" />
                    <p className="text-[11px] text-muted-foreground">{lang === "ar" ? "لا توجد بيانات" : "No data"}</p>
                  </div>
                )}
              </div>

              {/* Recent Transactions */}
              <div>
                <h4 className="text-[12px] font-medium text-foreground mb-3">{lang === "ar" ? "آخر المعاملات" : "Recent Transactions"}</h4>
                <div className="space-y-2">
                  {filteredTxns.slice(0, 5).map((txn) => (
                    <div key={txn.id} className="flex items-center justify-between p-2.5 rounded-xl border border-border/30">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          {txn.payment_method === "cash" ? <Banknote size={12} /> :
                           txn.payment_method === "card" ? <CreditCard size={12} /> :
                           <Smartphone size={12} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium text-foreground truncate">{txn.customer_name || lang === "ar" ? "عميل" : "Walk-in"}</p>
                          <p className="text-[10px] text-muted-foreground">{txn.transaction_number}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[12px] font-semibold text-foreground">{formatEGP(txn.total)}</p>
                        <p className="text-[9px] text-muted-foreground">{new Date(txn.created_at).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
