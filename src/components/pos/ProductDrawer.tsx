import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { getDataSource } from "../../lib/data-source";
import type { Database } from "../../lib/database.types";
import {
  X, Package, Tag, DollarSign, BarChart3, Clock, Store,
  TrendingDown, AlertTriangle, ShoppingCart, Info,
} from "lucide-react";

type BranchInv = Database["public"]["Tables"]["branch_inventory"]["Row"];

function formatEGP(n: number) {
  return new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", minimumFractionDigits: 2 }).format(n);
}

export function ProductDrawer({ product, onClose }: { product: Partial<BranchInv> & { product_id: string; product_name: string; sku: string | null; quantity: number; reserved_quantity: number; reorder_level: number; unit_cost: number; unit_price: number; branch_id: string; }; onClose: () => void }) {
  const { lang } = useLanguage();
  const ds = useMemo(() => getDataSource(), []);
  const [allInventory, setAllInventory] = useState<BranchInv[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"details" | "stock" | "sales">("details");

  useEffect(() => {
    async function load() {
      const all = await ds.branch_inventory.list("demo");
      setAllInventory(all as BranchInv[]);
      setLoading(false);
    }
    load();
  }, [ds]);

  const sameProduct = useMemo(
    () => allInventory.filter((i) => i.product_id === product.product_id),
    [allInventory, product]
  );

  const totalStock = sameProduct.reduce((s, i) => s + i.quantity, 0);
  const totalReserved = sameProduct.reduce((s, i) => s + i.reserved_quantity, 0);
  const totalValue = sameProduct.reduce((s, i) => s + i.quantity * i.unit_cost, 0);
  const totalRetail = sameProduct.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const margin = totalRetail > 0 ? ((totalRetail - totalValue) / totalRetail) * 100 : 0;

  const tabs = [
    { id: "details" as const, labelEn: "Details", labelAr: "التفاصيل" },
    { id: "stock" as const, labelEn: "Stock", labelAr: "المخزون" },
    { id: "sales" as const, labelEn: "Analytics", labelAr: "التحليلات" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-[440px] bg-background border-l border-border shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 px-5 py-4 border-b border-border/40">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>
              {lang === "ar" ? "تفاصيل المنتج" : "Product Details"}
            </h3>
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
              <X size={14} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Package size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-foreground truncate">{product.product_name}</p>
              <p className="text-[11px] text-muted-foreground font-mono">{product.sku || "—"}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="shrink-0 px-5 border-b border-border/40 flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2.5 text-[12px] font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {lang === "ar" ? tab.labelAr : tab.labelEn}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {activeTab === "details" && (
            <>
              {/* Price */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-muted/30">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{lang === "ar" ? "سعر البيع" : "Retail Price"}</p>
                  <p className="text-[16px] font-bold text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>{formatEGP(product.unit_price)}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{lang === "ar" ? "تكلفة الشراء" : "Cost Price"}</p>
                  <p className="text-[16px] font-bold text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>{formatEGP(product.unit_cost)}</p>
                </div>
              </div>

              {/* Margin */}
              <div className="p-3 rounded-xl border border-border/40">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-muted-foreground">{lang === "ar" ? "هامش الربح" : "Profit Margin"}</span>
                  <span className={`text-[12px] font-semibold ${margin > 50 ? "text-emerald-600" : margin > 30 ? "text-amber-600" : "text-rose-600"}`}>
                    {margin.toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min(margin, 100)}%` }} />
                </div>
              </div>

              {/* Stock Summary */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-xl bg-muted/30 text-center">
                  <p className="text-[14px] font-bold text-foreground">{totalStock}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{lang === "ar" ? "إجمالي" : "Total Stock"}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 text-center">
                  <p className="text-[14px] font-bold text-foreground">{totalReserved}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{lang === "ar" ? "محجوز" : "Reserved"}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 text-center">
                  <p className="text-[14px] font-bold text-foreground">{totalStock - totalReserved}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{lang === "ar" ? "متاح" : "Available"}</p>
                </div>
              </div>

              {/* Reorder Alert */}
              {sameProduct.some((i) => i.quantity <= i.reorder_level) && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
                  <AlertTriangle size={14} />
                  <span className="text-[11px]">{lang === "ar" ? "بعض الفروع بحاجة لإعادة تعبئة" : "Some branches need restocking"}</span>
                </div>
              )}
            </>
          )}

          {activeTab === "stock" && (
            <>
              <p className="text-[12px] text-muted-foreground">{lang === "ar" ? "المخزون حسب الفرع" : "Stock by Branch"}</p>
              {sameProduct.map((inv) => {
                const available = inv.quantity - inv.reserved_quantity;
                const isLow = inv.quantity <= inv.reorder_level;
                return (
                  <div key={inv.id} className="p-3 rounded-xl border border-border/40">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Store size={12} className="text-muted-foreground/50" />
                        <span className="text-[12px] font-medium text-foreground">{inv.branch_id}</span>
                      </div>
                      {isLow && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Low</span>}
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <p className="text-[12px] font-semibold">{inv.quantity}</p>
                        <p className="text-[9px] text-muted-foreground">{lang === "ar" ? "إجمالي" : "Total"}</p>
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold">{inv.reserved_quantity}</p>
                        <p className="text-[9px] text-muted-foreground">{lang === "ar" ? "محجوز" : "Held"}</p>
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-emerald-600">{available}</p>
                        <p className="text-[9px] text-muted-foreground">{lang === "ar" ? "متاح" : "Free"}</p>
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold">{inv.reorder_level}</p>
                        <p className="text-[9px] text-muted-foreground">{lang === "ar" ? "حد إعادة الطلب" : "Reorder"}</p>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-muted/60 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isLow ? "bg-amber-500" : "bg-emerald-500"}`}
                        style={{ width: `${Math.min((inv.quantity / Math.max(inv.reorder_level * 3, 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {activeTab === "sales" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-muted/30">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{lang === "ar" ? "قيمة المخزون (التكلفة)" : "Inventory Value (Cost)"}</p>
                  <p className="text-[14px] font-bold text-foreground">{formatEGP(totalValue)}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{lang === "ar" ? "قيمة المخزون ( البيع)" : "Inventory Value (Retail)"}</p>
                  <p className="text-[14px] font-bold text-foreground">{formatEGP(totalRetail)}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-border/40">
                <p className="text-[11px] text-muted-foreground mb-2">{lang === "ar" ? "الأداء" : "Performance"}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-muted-foreground">{lang === "ar" ? "هامش الربح الصافي" : "Net Margin"}</span>
                    <span className="font-medium text-emerald-600">{margin.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-muted-foreground">{lang === "ar" ? "معدل دوران المخزون" : "Turnover Rate"}</span>
                    <span className="font-medium">4.2x</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-muted-foreground">{lang === "ar" ? "أيام المخزون" : "Days of Stock"}</span>
                    <span className="font-medium">~87 days</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-muted-foreground">{lang === "ar" ? "معدل البيع اليومي" : "Daily Sell Rate"}</span>
                    <span className="font-medium">~0.3 units/day</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-[11px] text-primary font-medium mb-1">{lang === "ar" ? "اقتراح ذكي" : "Smart Suggestion"}</p>
                <p className="text-[11px] text-muted-foreground">
                  {lang === "ar"
                    ? "هذا المنتج يحقق هامش ربح جيد. فكّر في زيادة العرض في فروع المبيعات."
                    : "This product has a strong margin. Consider increasing display stock in retail branches."}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
