/**
 * Inventory Landing — hub linking Raw Materials and Assets.
 */

import { useLanguage } from "../../context/LanguageContext";
import { Link } from "wouter";
import { Layers, Wrench, Package, AlertTriangle } from "lucide-react";
import { useCubs, lowStock } from "../../lib/cubs/store";

export default function InventoryLanding() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const { rawMaterials } = useCubs();
  const alerts = lowStock();

  const totalVariants = rawMaterials.reduce((s, r) => s + r.variants.length, 0);
  const totalStock = rawMaterials.reduce((s, r) => s + r.variants.reduce((vs, v) => vs + v.stock, 0), 0);

  return (
    <div className="p-5 sm:p-6 max-w-[1200px] mx-auto">
      <div className="mb-6">
        <h1 className="text-[18px] font-semibold text-foreground mb-1">{ar ? "المخزون" : "Inventory"}</h1>
        <p className="text-[12.5px] text-muted-foreground">{ar ? "إدارة المواد الخام والأصول" : "Manage raw materials and assets"}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl bg-muted/40 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">{ar ? "أنواع المواد" : "Material types"}</p>
          <p className="text-[16px] font-semibold text-foreground mt-0.5">{rawMaterials.length}</p>
        </div>
        <div className="rounded-xl bg-muted/40 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">{ar ? "المتغيرات" : "Variants"}</p>
          <p className="text-[16px] font-semibold text-foreground mt-0.5">{totalVariants}</p>
        </div>
        <div className="rounded-xl bg-muted/40 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">{ar ? "إجمالي المخزون" : "Total stock"}</p>
          <p className="text-[16px] font-semibold text-foreground mt-0.5">{totalStock.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-muted/40 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">{ar ? "تنبيهات" : "Alerts"}</p>
          <p className={`text-[16px] font-semibold mt-0.5 ${alerts.length > 0 ? "text-amber-600" : "text-foreground"}`}>{alerts.length}</p>
        </div>
      </div>

      {/* Module cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/inventory/raw-materials">
          <div className="group rounded-2xl border border-border/60 bg-card p-6 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:bg-primary/15 transition">
              <Layers size={18} />
            </div>
            <h3 className="text-[15px] font-semibold text-foreground mb-1">{ar ? "المواد الخام" : "Raw Materials"}</h3>
            <p className="text-[12.5px] text-muted-foreground leading-relaxed">
              {ar ? "سوست، أقمشة، إكسسوارات — بألوان ومقاسات وأكواد تلقائية" : "Zippers, fabrics, hardware — with colours, sizes and auto-generated SKUs"}
            </p>
            <div className="mt-4 flex items-center gap-3 text-[12px] text-muted-foreground">
              <span className="flex items-center gap-1"><Package size={12} />{rawMaterials.length} {ar ? "أنواع" : "types"}</span>
              {alerts.length > 0 && <span className="flex items-center gap-1 text-amber-600"><AlertTriangle size={12} />{alerts.length} {ar ? "منخفض" : "low"}</span>}
            </div>
          </div>
        </Link>

        <Link href="/inventory/assets">
          <div className="group rounded-2xl border border-border/60 bg-card p-6 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:bg-primary/15 transition">
              <Wrench size={18} />
            </div>
            <h3 className="text-[15px] font-semibold text-foreground mb-1">{ar ? "الأصول والمعدات" : "Assets & Equipment"}</h3>
            <p className="text-[12.5px] text-muted-foreground leading-relaxed">
              {ar ? "آلات الخياطة، الأدوات، المعدات الثابتة" : "Sewing machines, tools, fixed equipment — track cost, value and maintenance"}
            </p>
            <div className="mt-4 flex items-center gap-3 text-[12px] text-muted-foreground">
              <span className="flex items-center gap-1"><Wrench size={12} />{ar ? "إدارة الأصول" : "Asset management"}</span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
