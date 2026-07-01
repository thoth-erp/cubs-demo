/**
 * Stock Control Engine — Connects BOM, Inventory, Production, Purchasing
 *
 * محرك المخزن — يربط قائمة الخامات والمخزون والتشغيل والمشتريات
 */

import type { BOMLine } from "./furniture-engine";

// ─── Stock Item (from resources metadata) ──────────────────

export interface StockItem {
  id: string;
  name: string;
  name_ar?: string;
  sku?: string;
  current_qty: number;
  reserved_qty: number;
  available_qty: number; // current - reserved
  reorder_level: number;
  incoming_qty: number; // from pending POs
  unit: string;
  unit_cost: number;
  total_value: number; // current_qty * unit_cost
  supplier_id?: string;
  supplier_name?: string;
  location?: string;
  last_counted_at?: string;
}

export interface StockMovement {
  id: string;
  item_id: string;
  item_name: string;
  movement_type: "stock_in" | "stock_out" | "reservation" | "adjustment" | "transfer" | "consumption";
  quantity: number;
  unit: string;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
  performed_by?: string;
  created_at: string;
}

export const MOVEMENT_TYPES = [
  { value: "stock_in", en: "Stock In", ar: "إدخال مخزن", color: "text-emerald-600", icon: "↓" },
  { value: "stock_out", en: "Stock Out", ar: "إخراج مخزن", color: "text-rose-600", icon: "↑" },
  { value: "reservation", en: "Reservation", ar: "حجز", color: "text-amber-600", icon: "◆" },
  { value: "adjustment", en: "Adjustment", ar: "تسوية", color: "text-blue-600", icon: "⟲" },
  { value: "transfer", en: "Transfer", ar: "تحويل", color: "text-violet-600", icon: "→" },
  { value: "consumption", en: "Consumption", ar: "استهلاك تصنيع", color: "text-orange-600", icon: "▼" },
];

// ─── Material Requirements Calculation ──────────���───────────

export interface MaterialRequirement {
  material: string;
  sku?: string;
  required_qty: number;
  available_qty: number;
  shortage: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
  status: "available" | "partial" | "shortage" | "not_in_stock";
  supplier?: string;
}

/**
 * Calculate material requirements for a set of BOM lines against current stock
 */
export function calculateMaterialRequirements(
  bomLines: BOMLine[],
  stockItems: StockItem[],
  wastePct: number = 5
): MaterialRequirement[] {
  return bomLines.map(line => {
    const requiredWithWaste = line.qty * (1 + wastePct / 100);
    const stockItem = stockItems.find(s =>
      s.sku === line.sku || s.name.toLowerCase() === line.material.toLowerCase()
    );
    const available = stockItem?.available_qty ?? 0;
    const shortage = Math.max(0, requiredWithWaste - available);

    let status: MaterialRequirement["status"] = "available";
    if (!stockItem) status = "not_in_stock";
    else if (shortage > 0 && available > 0) status = "partial";
    else if (shortage > 0) status = "shortage";

    return {
      material: line.material,
      sku: line.sku,
      required_qty: Math.ceil(requiredWithWaste),
      available_qty: available,
      shortage: Math.ceil(shortage),
      unit: line.unit,
      unit_cost: line.costPerUnit,
      total_cost: Math.ceil(requiredWithWaste) * line.costPerUnit,
      status,
      supplier: stockItem?.supplier_name,
    };
  });
}

/**
 * Get stock alerts for items below reorder level
 */
export function getStockAlerts(stockItems: StockItem[]): { item: StockItem; type: "low" | "out" | "over_reserved" }[] {
  const alerts: { item: StockItem; type: "low" | "out" | "over_reserved" }[] = [];

  stockItems.forEach(item => {
    if (item.current_qty <= 0) {
      alerts.push({ item, type: "out" });
    } else if (item.current_qty <= item.reorder_level) {
      alerts.push({ item, type: "low" });
    }
    if (item.reserved_qty > item.current_qty) {
      alerts.push({ item, type: "over_reserved" });
    }
  });

  return alerts;
}

/**
 * Generate purchase suggestion based on shortages
 */
export function generatePurchaseSuggestions(requirements: MaterialRequirement[]): { material: string; qty: number; unit: string; estimated_cost: number; supplier?: string }[] {
  return requirements
    .filter(r => r.shortage > 0)
    .map(r => ({
      material: r.material,
      qty: r.shortage,
      unit: r.unit,
      estimated_cost: r.shortage * r.unit_cost,
      supplier: r.supplier,
    }));
}

export const STOCK_ALERT_LABELS = {
  low: { en: "Low Stock", ar: "مخزون منخفض", color: "text-amber-600 bg-amber-50 border-amber-200" },
  out: { en: "Out of Stock", ar: "نفد من المخزن", color: "text-rose-600 bg-rose-50 border-rose-200" },
  over_reserved: { en: "Over-Reserved", ar: "محجوز أكتر من المتاح", color: "text-violet-600 bg-violet-50 border-violet-200" },
};
