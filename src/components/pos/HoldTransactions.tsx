import { useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { X, Pause, Play, Trash2, Clock, ShoppingBag } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type TxnItem = { product_id: string | null; product_name: string; product_name_ar: string | null; sku: string | null; quantity: number; unit_price: number; discount_percent: number; cost_price: number; };

interface HeldTxn {
  id: string;
  customerName: string;
  items: TxnItem[];
  total: number;
  heldAt: Date;
  note: string;
}

function formatEGP(n: number) {
  return new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", minimumFractionDigits: 2 }).format(n);
}

export function HoldTransactions({ held, onRecall, onDiscard, onClose }: {
  held: HeldTxn[];
  onRecall: (id: string) => void;
  onDiscard: (id: string) => void;
  onClose: () => void;
}) {
  const { lang } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-background rounded-2xl border border-border shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
          <h3 className="text-[15px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>
            {lang === "ar" ? "المعاملات المعلّقة" : "Held Transactions"}
          </h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {held.length === 0 ? (
            <div className="text-center py-8">
              <Pause size={24} className="mx-auto text-muted-foreground/20 mb-2" />
              <p className="text-[12px] text-muted-foreground">
                {lang === "ar" ? "لا توجد معاملات معلّقة" : "No held transactions"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {held.map((h) => (
                <div key={h.id} className="p-4 rounded-xl border border-border/40 bg-muted/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock size={12} className="text-muted-foreground/50" />
                      <span className="text-[11px] text-muted-foreground">
                        {h.heldAt.toLocaleTimeString()} • {h.items.length} {lang === "ar" ? "منتجات" : "items"}
                      </span>
                    </div>
                    <span className="text-[14px] font-bold text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>
                      {formatEGP(h.total)}
                    </span>
                  </div>

                  {h.customerName && (
                    <p className="text-[11px] text-muted-foreground mb-1">{lang === "ar" ? "العميل" : "Customer"}: {h.customerName}</p>
                  )}

                  <div className="flex flex-wrap gap-1 mb-3">
                    {h.items.slice(0, 3).map((item, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-background border border-border/40">
                        {item.product_name} × {item.quantity}
                      </span>
                    ))}
                    {h.items.length > 3 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        +{h.items.length - 3} more
                      </span>
                    )}
                  </div>

                  {h.note && <p className="text-[10px] text-muted-foreground italic mb-2">{h.note}</p>}

                  <div className="flex gap-2">
                    <button
                      onClick={() => onRecall(h.id)}
                      className="flex-1 h-8 rounded-lg bg-primary text-primary-foreground text-[11px] font-medium flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
                    >
                      <Play size={11} /> {lang === "ar" ? "استدعاء" : "Recall"}
                    </button>
                    <button
                      onClick={() => onDiscard(h.id)}
                      className="h-8 px-3 rounded-lg border border-rose-200 text-rose-500 text-[11px] font-medium flex items-center justify-center gap-1.5 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
