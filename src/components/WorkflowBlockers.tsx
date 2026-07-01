/**
 * WorkflowBlockers — Friendly visual blocker/readiness checklist
 * عوائق سير العمل — قائمة جاهزية مرئية
 *
 * Shows required/optional/completed/blocked items
 * Use on: Sales Order detail, Production Order, Product profile
 */

import { motion } from "framer-motion";
import {
  CheckCircle2, AlertTriangle, Circle, Lock,
  Users, Package, Factory, DollarSign, FileText, Truck, Layers, ShoppingCart,
  type LucideIcon,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────

export type BlockerStatus = "completed" | "required" | "optional" | "blocked";

export interface BlockerItem {
  id: string;
  label: string;
  labelAr?: string;
  status: BlockerStatus;
  reason?: string;
  reasonAr?: string;
  icon?: LucideIcon;
}

// ─── Status styles ────────────────────────────────────────

const STATUS_CONFIG: Record<BlockerStatus, { icon: LucideIcon; color: string; bg: string; border: string; label: string; labelAr: string }> = {
  completed: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200/60", label: "Done", labelAr: "تم" },
  required:  { icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200/60", label: "Required", labelAr: "مطلوب" },
  optional:  { icon: Circle, color: "text-muted-foreground", bg: "bg-muted/30", border: "border-border/40", label: "Optional", labelAr: "اختياري" },
  blocked:   { icon: Lock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200/60", label: "Blocked", labelAr: "محجوز" },
};

// ─── Common blocker presets ───────────────────────────────

export const COMMON_BLOCKERS = {
  noCustomer:     (ar: boolean): BlockerItem => ({ id: "customer", label: "Customer assigned", labelAr: "عميل مربوط بالطلب", status: "required", reason: "Order needs a customer", reasonAr: "مفيش عميل مربوط بالطلب", icon: Users }),
  noComponents:   (ar: boolean): BlockerItem => ({ id: "bom", label: "Product has BOM", labelAr: "المنتج له مكونات", status: "required", reason: "Product needs bill of materials", reasonAr: "المنتج ملوش مكونات", icon: Package }),
  noStages:       (ar: boolean): BlockerItem => ({ id: "stages", label: "Manufacturing stages defined", labelAr: "مراحل تصنيع محددة", status: "required", reason: "No production stages", reasonAr: "مفيش مراحل تصنيع", icon: Factory }),
  materialShort:  (ar: boolean): BlockerItem => ({ id: "materials", label: "Materials available", labelAr: "الخامات متوفرة", status: "blocked", reason: "Some materials are short", reasonAr: "الخامات ناقصة", icon: Layers }),
  needsApproval:  (ar: boolean): BlockerItem => ({ id: "approval", label: "Finance approval", labelAr: "موافقة الحسابات", status: "required", reason: "Needs finance sign-off", reasonAr: "محتاج موافقة الحسابات", icon: DollarSign }),
  quoteAccepted:  (ar: boolean): BlockerItem => ({ id: "quote", label: "Quote accepted", labelAr: "عرض السعر مقبول", status: "completed", icon: FileText }),
  deliverySet:    (ar: boolean): BlockerItem => ({ id: "delivery", label: "Delivery date set", labelAr: "موعد التسليم محدد", status: "completed", icon: Truck }),
  poCreated:      (ar: boolean): BlockerItem => ({ id: "po", label: "Purchase orders created", labelAr: "أوامر الشراء جاهزة", status: "optional", icon: ShoppingCart }),
};

// ─── Component ────────────────────────────────────────────

interface Props {
  items: BlockerItem[];
  ar?: boolean;
  title?: string;
  titleAr?: string;
  className?: string;
}

export default function WorkflowBlockers({ items, ar = false, title, titleAr, className = "" }: Props) {
  const completed = items.filter(i => i.status === "completed").length;
  const total = items.filter(i => i.status !== "optional").length;
  const allClear = completed >= total;

  return (
    <div className={`rounded-xl border ${allClear ? "border-emerald-200/60 bg-emerald-50/30" : "border-border/40 bg-background"} ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {allClear ? (
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <CheckCircle2 size={14} className="text-emerald-600" />
            </motion.div>
          ) : (
            <AlertTriangle size={14} className="text-amber-500" />
          )}
          <span className="text-[11.5px] font-semibold">
            {ar
              ? (titleAr || (allClear ? "جاهز للتشغيل ✓" : "مش جاهز للتشغيل"))
              : (title || (allClear ? "Ready to proceed ✓" : "Not ready yet"))
            }
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground font-medium">
          {completed}/{total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="px-4 pt-3 pb-1">
        <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${allClear ? "bg-emerald-500" : "bg-primary"}`}
            initial={{ width: 0 }}
            animate={{ width: total > 0 ? `${(completed / total) * 100}%` : "0%" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      {/* Items */}
      <div className="px-4 py-3 space-y-2">
        {items.map((item, i) => {
          const config = STATUS_CONFIG[item.status];
          const StatusIcon = config.icon;
          const ItemIcon = item.icon;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className={`flex items-start gap-3 p-2.5 rounded-lg ${config.bg} border ${config.border}`}
            >
              <div className="flex items-center gap-2 shrink-0 mt-0.5">
                <StatusIcon size={13} className={config.color} />
                {ItemIcon && <ItemIcon size={12} className="text-muted-foreground/60" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[11.5px] font-medium ${item.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                  {ar ? item.labelAr || item.label : item.label}
                </p>
                {item.reason && item.status !== "completed" && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {ar ? item.reasonAr || item.reason : item.reason}
                  </p>
                )}
              </div>
              <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${config.bg} ${config.color} shrink-0`}>
                {ar ? config.labelAr : config.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
