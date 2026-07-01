/**
 * Materials & BOM Dashboard — المواد الخام والتركيب
 *
 * Procurement / stock-manager / accounting view inside Inventory:
 *  - Every product with its raw-material composition (BOM)
 *  - Aggregate material demand vs. stock on hand (coverage)
 *  - Click a product → full breakdown drawer with a quantity
 *    multiplier (per-unit and ×N quantities + costs), stock
 *    coverage per line, shortages and estimated purchase cost.
 *
 * Products = resources(type "product") with metadata.bom: BOMLine[].
 * BOM lines link to inventory items via inventory_item_id, with a
 * name-based fallback so unlinked lines still resolve stock.
 */

import { useMemo, useState } from "react";
import type { Database } from "../lib/database.types";
import {
  Package, Search, X, Layers, Boxes, Factory, Hammer,
  AlertTriangle, CheckCircle2, ChevronRight, Minus, Plus,
  ShoppingCart, Wallet, Percent, ImageIcon,
} from "lucide-react";

type Resource = Database["public"]["Tables"]["resources"]["Row"];

interface BOMLine {
  id?: string;
  material: string;
  sku?: string;
  qty: number;
  unit: string;
  costPerUnit: number;
  inventory_item_id?: string;
}

interface ProductMeta {
  sku?: string;
  category?: string;
  bom?: BOMLine[];
  material_cost?: number;
  labor_cost?: number;
  machine_cost?: number;
  overhead_cost?: number;
  total_cost?: number;
  suggested_price?: number;
  images?: { url: string }[] | string[];
}

interface InvMeta {
  sku?: string;
  quantity?: number;
  unit_cost?: number;
  reorder_level?: number;
  vendor_name?: string;
  images?: { url: string }[] | string[];
}

const MATERIAL_PALETTE = ["#8b5cf6", "#3b82f6", "#f59e0b", "#10b981", "#f43f5e", "#06b6d4", "#a16207", "#94a3b8"];

function getPM(r: Resource): ProductMeta { return (r.metadata ?? {}) as ProductMeta; }
function getIM(r: Resource): InvMeta { return (r.metadata ?? {}) as InvMeta; }

function firstImage(meta: { images?: { url: string }[] | string[] }): string | null {
  const imgs = meta.images;
  if (!imgs || imgs.length === 0) return null;
  const f = imgs[0] as { url: string } | string;
  return typeof f === "string" ? f : f.url;
}

/** Resolve a BOM line to a live inventory item: explicit link first, then name match. */
function resolveStockItem(line: BOMLine, invItems: Resource[]): Resource | null {
  if (line.inventory_item_id) {
    const hit = invItems.find((r) => r.id === line.inventory_item_id);
    if (hit) return hit;
  }
  const name = line.material.toLowerCase();
  return invItems.find((r) => {
    const rn = r.name_en.toLowerCase();
    const sku = (getIM(r).sku ?? "").toLowerCase();
    return rn.includes(name) || name.includes(rn) || (!!line.sku && sku === line.sku.toLowerCase());
  }) ?? null;
}

function Thumb({ src, size = 36, rounded = "rounded-lg" }: { src: string | null; size?: number; rounded?: string }) {
  if (src) return <img src={src} alt="" width={size} height={size} className={`${rounded} object-cover border border-border/40 shrink-0`} style={{ width: size, height: size }} />;
  return (
    <div className={`${rounded} bg-muted/60 border border-border/40 flex items-center justify-center shrink-0`} style={{ width: size, height: size }}>
      <ImageIcon size={size * 0.4} className="text-muted-foreground/40" />
    </div>
  );
}

function CoverageBar({ pct }: { pct: number }) {
  const color = pct >= 1 ? "#34d399" : pct >= 0.5 ? "#fbbf24" : "#fb7185";
  return (
    <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden w-full">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(pct, 1) * 100}%`, backgroundColor: color }} />
    </div>
  );
}

function MiniDonut({ segments, size = 120, centerValue, centerLabel }: {
  segments: { label: string; value: number; color: string }[];
  size?: number; centerValue: string; centerLabel: string;
}) {
  const total = Math.max(segments.reduce((s, x) => s + x.value, 0), 1);
  const r = (size - 18) / 2;
  const circ = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={11} opacity={0.5} />
        {segments.filter((s) => s.value > 0).map((s, i) => {
          const frac = s.value / total;
          const dash = frac * circ;
          const offset = -acc * circ;
          acc += frac;
          return <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={11} strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={offset} className="transition-all duration-700" />;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-[15px] font-medium leading-none tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>{centerValue}</p>
        <p className="text-[9px] text-muted-foreground mt-0.5">{centerLabel}</p>
      </div>
    </div>
  );
}

function Card({ title, sub, children, className, right }: { title: string; sub?: string; children: React.ReactNode; className?: string; right?: React.ReactNode }) {
  return (
    <div className={`bg-background border border-border/40 rounded-xl p-5 ${className ?? ""}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[13px] font-medium" style={{ fontFamily: "var(--app-font-serif)" }}>{title}</h3>
          {sub && <p className="text-[10.5px] text-muted-foreground/70 mt-0.5">{sub}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

// ─── Product BOM Drawer ──────────────────────────────────

function ProductDrawer({ product, invItems, ar, fmtVal, onClose }: {
  product: Resource; invItems: Resource[]; ar: boolean;
  fmtVal: (v: number) => string; onClose: () => void;
}) {
  const [n, setN] = useState(1);
  const m = getPM(product);
  const bom = m.bom ?? [];
  const img = firstImage(m);

  const lines = useMemo(() => bom.map((line, i) => {
    const stock = resolveStockItem(line, invItems);
    const sm = stock ? getIM(stock) : null;
    const onHand = sm?.quantity ?? null;
    const unitCost = line.costPerUnit || sm?.unit_cost || 0;
    return {
      line, stock, onHand, unitCost,
      color: MATERIAL_PALETTE[i % MATERIAL_PALETTE.length],
      need: line.qty * n,
      lineCost: line.qty * unitCost,
      coverage: onHand === null ? null : line.qty * n <= 0 ? 1 : onHand / (line.qty * n),
    };
  }), [bom, invItems, n]);

  const matPerUnit = lines.reduce((s, l) => s + l.lineCost, 0);
  const labor = m.labor_cost || 0, machine = m.machine_cost || 0, overhead = m.overhead_cost || 0;
  const totalPerUnit = matPerUnit + labor + machine + overhead;
  const price = m.suggested_price || 0;
  const margin = price > 0 ? ((price - totalPerUnit) / price) * 100 : null;

  const shortages = lines.filter((l) => l.onHand !== null && l.onHand < l.need);
  const shortageCost = shortages.reduce((s, l) => s + (l.need - (l.onHand ?? 0)) * l.unitCost, 0);
  const buildable = lines.reduce((min, l) => {
    if (l.onHand === null || l.line.qty <= 0) return min;
    return Math.min(min, Math.floor(l.onHand / l.line.qty));
  }, Infinity);

  const costSegments = [
    { label: ar ? "خامات" : "Materials", value: matPerUnit, color: "#8b5cf6" },
    { label: ar ? "عمالة" : "Labor", value: labor, color: "#3b82f6" },
    { label: ar ? "ماكينات" : "Machine", value: machine, color: "#f59e0b" },
    { label: ar ? "مصاريف" : "Overhead", value: overhead, color: "#94a3b8" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-[3px]" onClick={onClose} />
      <div className="relative h-full w-full max-w-[620px] bg-background border-s border-border/60 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/40 px-6 py-4 flex items-center gap-4">
          <Thumb src={img} size={44} rounded="rounded-xl" />
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-medium truncate" style={{ fontFamily: "var(--app-font-serif)" }}>{ar ? (product.name_ar || product.name_en) : product.name_en}</p>
            <p className="text-[10.5px] text-muted-foreground font-mono">{m.sku || m.category || ""}</p>
          </div>
          {margin !== null && (
            <span className={`text-[10px] px-2 py-1 rounded-full font-medium shrink-0 ${margin >= 30 ? "bg-emerald-100 text-emerald-700" : margin >= 10 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-600"}`}>
              {ar ? "هامش" : "Margin"} {margin.toFixed(0)}%
            </span>
          )}
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors shrink-0"><X size={14} /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Quantity multiplier */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border/40 bg-muted/20">
            <div>
              <p className="text-[12px] font-medium">{ar ? "احسب لكمية" : "Calculate for quantity"}</p>
              <p className="text-[10.5px] text-muted-foreground mt-0.5">{ar ? "الخامات والتكلفة بتتضاعف تلقائيًا" : "Materials & costs multiply live"}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setN((x) => Math.max(1, x - 1))} className="w-8 h-8 rounded-lg border border-border/60 flex items-center justify-center hover:bg-muted/50 transition-colors"><Minus size={13} /></button>
              <input type="number" min={1} value={n} onChange={(e) => setN(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 h-8 text-center rounded-lg border border-border/60 bg-background text-[14px] font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <button onClick={() => setN((x) => x + 1)} className="w-8 h-8 rounded-lg border border-border/60 flex items-center justify-center hover:bg-muted/50 transition-colors"><Plus size={13} /></button>
            </div>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-border/40">
              <p className="text-[9.5px] text-muted-foreground mb-1">{ar ? `تكلفة الخامات ×${n}` : `Material cost ×${n}`}</p>
              <p className="text-[16px] font-medium tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>{fmtVal(matPerUnit * n)}</p>
            </div>
            <div className="p-3.5 rounded-xl border border-border/40">
              <p className="text-[9.5px] text-muted-foreground mb-1">{ar ? `تكلفة إجمالية ×${n}` : `Total cost ×${n}`}</p>
              <p className="text-[16px] font-medium tabular-nums" style={{ fontFamily: "var(--app-font-serif)" }}>{fmtVal(totalPerUnit * n)}</p>
            </div>
            <div className="p-3.5 rounded-xl border border-border/40">
              <p className="text-[9.5px] text-muted-foreground mb-1">{ar ? "ممكن تتصنع من المخزون" : "Buildable from stock"}</p>
              <p className={`text-[16px] font-medium tabular-nums ${buildable === Infinity ? "text-muted-foreground/50" : buildable >= n ? "text-emerald-600" : "text-rose-500"}`} style={{ fontFamily: "var(--app-font-serif)" }}>
                {buildable === Infinity ? "—" : `${buildable} ${ar ? "وحدة" : "units"}`}
              </p>
            </div>
          </div>

          {/* Shortage warning */}
          {shortages.length > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200/50 bg-amber-50/40">
              <ShoppingCart size={15} className="text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-amber-800">
                  {ar ? `${shortages.length} خامة ناقصة لتصنيع ${n}` : `${shortages.length} material${shortages.length > 1 ? "s" : ""} short for building ${n}`}
                </p>
                <p className="text-[11px] text-amber-700/80 mt-0.5">
                  {shortages.map((l) => `${l.line.material} (${ar ? "ناقص" : "need"} ${(l.need - (l.onHand ?? 0)).toLocaleString()} ${l.line.unit})`).join(" · ")}
                </p>
                <p className="text-[11px] font-medium text-amber-800 mt-1">{ar ? "تكلفة الشراء التقديرية:" : "Est. purchase cost:"} {fmtVal(shortageCost)}</p>
              </div>
            </div>
          )}

          {/* BOM table */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-[12.5px] font-medium" style={{ fontFamily: "var(--app-font-serif)" }}>{ar ? "مكونات الخامات" : "Bill of Materials"}</h4>
              <p className="text-[10px] text-muted-foreground">{bom.length} {ar ? "خامة" : "lines"}</p>
            </div>
            {bom.length === 0 ? (
              <p className="text-[11.5px] text-muted-foreground/60 py-8 text-center border border-dashed border-border/60 rounded-xl">
                {ar ? "المنتج ده ملوش مكونات لسه — ضيفها من صفحة المنتجات" : "No BOM lines yet — add them from the Products page"}
              </p>
            ) : (
              <div className="border border-border/40 rounded-xl overflow-hidden">
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 px-4 py-2 bg-muted/30 text-[9.5px] text-muted-foreground font-medium uppercase tracking-wide">
                  <span>{ar ? "الخامة" : "Material"}</span>
                  <span className="text-end">{ar ? `كمية ×${n}` : `Qty ×${n}`}</span>
                  <span className="text-end">{ar ? "التكلفة" : "Cost"}</span>
                  <span className="text-end w-20">{ar ? "التغطية" : "Stock"}</span>
                </div>
                {lines.map((l, i) => {
                  const sm = l.stock ? getIM(l.stock) : null;
                  return (
                    <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center px-4 py-2.5 border-t border-border/30">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: l.color }} />
                        <Thumb src={l.stock ? firstImage(sm!) : null} size={26} rounded="rounded-md" />
                        <div className="min-w-0">
                          <p className="text-[11.5px] font-medium truncate">{l.line.material}</p>
                          <p className="text-[9.5px] text-muted-foreground truncate">
                            {l.line.qty} {l.line.unit} {ar ? "للوحدة" : "/unit"} · {fmtVal(l.unitCost)}/{l.line.unit}
                          </p>
                        </div>
                      </div>
                      <p className="text-[12px] font-medium tabular-nums text-end">{l.need.toLocaleString()} <span className="text-[9.5px] text-muted-foreground font-normal">{l.line.unit}</span></p>
                      <p className="text-[12px] font-medium tabular-nums text-end">{fmtVal(l.lineCost * n)}</p>
                      <div className="w-20">
                        {l.onHand === null ? (
                          <p className="text-[9.5px] text-muted-foreground/50 text-end">{ar ? "غير مرتبط" : "unlinked"}</p>
                        ) : (
                          <div className="space-y-1">
                            <CoverageBar pct={l.coverage ?? 0} />
                            <p className={`text-[9.5px] text-end tabular-nums ${l.onHand >= l.need ? "text-emerald-600" : "text-rose-500"}`}>{l.onHand} {ar ? "متاح" : "on hand"}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cost composition */}
          {totalPerUnit > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border/40 flex items-center gap-4">
                <MiniDonut segments={costSegments} centerValue={fmtVal(totalPerUnit)} centerLabel={ar ? "للوحدة" : "per unit"} />
                <div className="space-y-1.5 flex-1 min-w-0">
                  {costSegments.filter((s) => s.value > 0).map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      <p className="text-[10.5px] text-muted-foreground flex-1 truncate">{s.label}</p>
                      <p className="text-[10.5px] font-medium tabular-nums">{((s.value / totalPerUnit) * 100).toFixed(0)}%</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-xl border border-border/40 flex flex-col justify-center gap-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-muted-foreground">{ar ? "سعر البيع المقترح" : "Suggested price"}</p>
                  <p className="text-[13px] font-medium tabular-nums">{price ? fmtVal(price) : "—"}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-muted-foreground">{ar ? "تكلفة الوحدة" : "Unit cost"}</p>
                  <p className="text-[13px] font-medium tabular-nums">{fmtVal(totalPerUnit)}</p>
                </div>
                <div className="h-px bg-border/40" />
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-medium">{ar ? `ربح ×${n}` : `Profit ×${n}`}</p>
                  <p className={`text-[14px] font-semibold tabular-nums ${price - totalPerUnit >= 0 ? "text-emerald-600" : "text-rose-500"}`} style={{ fontFamily: "var(--app-font-serif)" }}>
                    {price ? fmtVal((price - totalPerUnit) * n) : "—"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main dashboard ──────────────────────────────────────

export function MaterialsDashboard({ products, invItems, ar, fmtVal, fmtCompact }: {
  products: Resource[]; invItems: Resource[]; ar: boolean;
  fmtVal: (v: number) => string; fmtCompact: (v: number) => string;
}) {
  const [search, setSearch] = useState("");
  const [matSearch, setMatSearch] = useState("");
  const [selected, setSelected] = useState<Resource | null>(null);

  const withBom = useMemo(() => products.filter((p) => (getPM(p).bom ?? []).length > 0), [products]);

  // ── Aggregate material demand across the whole catalog ──
  const materials = useMemo(() => {
    const map = new Map<string, {
      name: string; unit: string; usedIn: number; demandPerCatalog: number;
      avgCost: number; stock: Resource | null; demandValue: number;
    }>();
    for (const p of products) {
      const bom = getPM(p).bom ?? [];
      for (const line of bom) {
        const stock = resolveStockItem(line, invItems);
        const key = stock ? stock.id : line.material.toLowerCase();
        const unitCost = line.costPerUnit || (stock ? getIM(stock).unit_cost || 0 : 0);
        const cur = map.get(key);
        if (cur) {
          cur.usedIn += 1;
          cur.demandPerCatalog += line.qty;
          cur.demandValue += line.qty * unitCost;
          cur.avgCost = cur.demandPerCatalog > 0 ? cur.demandValue / cur.demandPerCatalog : unitCost;
        } else {
          map.set(key, {
            name: stock ? stock.name_en : line.material, unit: line.unit, usedIn: 1,
            demandPerCatalog: line.qty, avgCost: unitCost, stock, demandValue: line.qty * unitCost,
          });
        }
      }
    }
    return [...map.values()].sort((a, b) => b.demandValue - a.demandValue);
  }, [products, invItems]);

  // ── KPIs ──
  const catalogMaterialCost = withBom.reduce((s, p) => {
    const bom = getPM(p).bom ?? [];
    return s + bom.reduce((x, l) => x + l.qty * (l.costPerUnit || 0), 0);
  }, 0);
  const margins = withBom.map((p) => {
    const m = getPM(p);
    const bomCost = (m.bom ?? []).reduce((x, l) => x + l.qty * (l.costPerUnit || 0), 0);
    const total = bomCost + (m.labor_cost || 0) + (m.machine_cost || 0) + (m.overhead_cost || 0);
    return m.suggested_price ? ((m.suggested_price - total) / m.suggested_price) * 100 : null;
  }).filter((x): x is number => x !== null);
  const avgMargin = margins.length ? margins.reduce((s, x) => s + x, 0) / margins.length : null;

  const shortMaterials = materials.filter((m) => m.stock && (getIM(m.stock).quantity ?? 0) < m.demandPerCatalog);

  // Buildable per product (for table)
  const productRows = useMemo(() => {
    const q = search.toLowerCase().trim();
    return products
      .filter((p) => !q || p.name_en.toLowerCase().includes(q) || (getPM(p).sku ?? "").toLowerCase().includes(q) || (getPM(p).category ?? "").toLowerCase().includes(q))
      .map((p) => {
        const m = getPM(p);
        const bom = m.bom ?? [];
        const matCost = bom.reduce((s, l) => s + l.qty * (l.costPerUnit || 0), 0);
        const total = matCost + (m.labor_cost || 0) + (m.machine_cost || 0) + (m.overhead_cost || 0);
        const price = m.suggested_price || 0;
        const margin = price > 0 ? ((price - total) / price) * 100 : null;
        let buildable = Infinity;
        for (const l of bom) {
          const stock = resolveStockItem(l, invItems);
          if (!stock || l.qty <= 0) continue;
          buildable = Math.min(buildable, Math.floor((getIM(stock).quantity ?? 0) / l.qty));
        }
        return { p, m, bomCount: bom.length, matCost, total, price, margin, buildable };
      })
      .sort((a, b) => b.matCost - a.matCost);
  }, [products, invItems, search]);

  // ── Charts ──
  const costShareSegments = materials.slice(0, 6).map((m, i) => ({
    label: m.name, value: m.demandValue, color: MATERIAL_PALETTE[i % MATERIAL_PALETTE.length],
  }));

  const demandVsStock = materials.slice(0, 8).map((m, i) => ({
    name: m.name, unit: m.unit,
    demand: m.demandPerCatalog,
    onHand: m.stock ? (getIM(m.stock).quantity ?? 0) : null,
    color: MATERIAL_PALETTE[i % MATERIAL_PALETTE.length],
  }));
  const demandMax = Math.max(...demandVsStock.flatMap((d) => [d.demand, d.onHand ?? 0]), 1);

  const costStacks = productRows.slice(0, 5).map((row) => ({
    name: row.p.name_en,
    parts: [
      { v: row.matCost, color: "#8b5cf6" },
      { v: row.m.labor_cost || 0, color: "#3b82f6" },
      { v: row.m.machine_cost || 0, color: "#f59e0b" },
      { v: row.m.overhead_cost || 0, color: "#94a3b8" },
    ],
    total: row.total,
  }));
  const stackMax = Math.max(...costStacks.map((s) => s.total), 1);

  const filteredMaterials = useMemo(() => {
    const q = matSearch.toLowerCase().trim();
    return q ? materials.filter((m) => m.name.toLowerCase().includes(q)) : materials;
  }, [materials, matSearch]);

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-5">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center"><Boxes size={24} className="text-muted-foreground/40" /></div>
        <div className="text-center max-w-[420px]">
          <p className="text-[15px] font-medium mb-1" style={{ fontFamily: "var(--app-font-serif)" }}>{ar ? "مفيش منتجات لسه" : "No products yet"}</p>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            {ar ? "ضيف منتجات بمكوناتها من صفحة المنتجات، وهنا هتشوف تحليل الخامات والتكاليف لكل منتج." : "Create products with a bill of materials on the Products page — this dashboard then breaks down every product's raw materials, costs and stock coverage."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { icon: Boxes, value: `${products.length}`, label: ar ? "منتجات" : "Products", color: "text-violet-600" },
          { icon: Layers, value: `${withBom.length}`, label: ar ? "بمكونات خامات" : "With BOM", color: "text-blue-600" },
          { icon: Hammer, value: `${materials.length}`, label: ar ? "خامات مستخدمة" : "Raw Materials", color: "text-amber-600" },
          { icon: Wallet, value: fmtCompact(catalogMaterialCost), label: ar ? "تكلفة خامات الكتالوج" : "Catalog Material Cost", color: "text-primary" },
          { icon: Percent, value: avgMargin === null ? "—" : `${avgMargin.toFixed(0)}%`, label: ar ? "متوسط الهامش" : "Avg Margin", color: avgMargin !== null && avgMargin >= 25 ? "text-emerald-600" : "text-amber-600" },
          { icon: AlertTriangle, value: `${shortMaterials.length}`, label: ar ? "خامات تحت الطلب" : "Materials Short", color: shortMaterials.length > 0 ? "text-rose-500" : "text-slate-400" },
        ].map((k, i) => (
          <div key={i} className="bg-background border border-border/40 rounded-xl px-3.5 py-3">
            <k.icon size={13} strokeWidth={1.75} className={`${k.color} mb-1.5`} />
            <p className="text-[15px] font-medium leading-none tabular-nums mb-0.5 truncate" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.02em" }}>{k.value}</p>
            <p className="text-[9px] text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card title={ar ? "توزيع تكلفة الخامات" : "Material Cost Share"} sub={ar ? "أعلى الخامات قيمة في الكتالوج" : "Top materials by catalog value"}>
          {costShareSegments.length === 0 ? <p className="text-[11px] text-muted-foreground/50 py-6 text-center">{ar ? "مفيش بيانات" : "No data"}</p> : (
            <div className="flex items-center gap-4">
              <MiniDonut segments={costShareSegments} centerValue={fmtCompact(catalogMaterialCost)} centerLabel={ar ? "كتالوج" : "catalog"} size={130} />
              <div className="space-y-1.5 flex-1 min-w-0">
                {costShareSegments.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <p className="text-[10.5px] text-muted-foreground flex-1 truncate">{s.label}</p>
                    <p className="text-[10.5px] font-medium tabular-nums shrink-0">{fmtCompact(s.value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card title={ar ? "الطلب مقابل المخزون" : "Demand vs. Stock"} sub={ar ? "احتياج الكتالوج لكل وحدة مقابل المتاح" : "Catalog need (1× each product) vs. on hand"}>
          {demandVsStock.length === 0 ? <p className="text-[11px] text-muted-foreground/50 py-6 text-center">{ar ? "مفيش بيانات" : "No data"}</p> : (
            <div className="space-y-2.5">
              {demandVsStock.map((d, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10.5px] text-foreground/80 truncate flex-1">{d.name}</p>
                    <p className="text-[10px] tabular-nums text-muted-foreground shrink-0">
                      {d.demand.toLocaleString()} {ar ? "مطلوب" : "need"}{d.onHand !== null && <span className={d.onHand >= d.demand ? " text-emerald-600" : " text-rose-500"}> · {d.onHand} {ar ? "متاح" : "have"}</span>}
                    </p>
                  </div>
                  <div className="relative h-2.5">
                    <div className="absolute inset-0 rounded-full bg-muted/60" />
                    <div className="absolute inset-y-0 start-0 rounded-full opacity-40" style={{ width: `${(d.demand / demandMax) * 100}%`, backgroundColor: d.color }} />
                    {d.onHand !== null && <div className="absolute inset-y-[3px] start-0 rounded-full" style={{ width: `${(Math.min(d.onHand, demandMax) / demandMax) * 100}%`, backgroundColor: d.color }} />}
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-4 pt-1">
                <span className="flex items-center gap-1.5 text-[9.5px] text-muted-foreground"><span className="w-3 h-1.5 rounded-full bg-violet-300/50" />{ar ? "المطلوب" : "Demand"}</span>
                <span className="flex items-center gap-1.5 text-[9.5px] text-muted-foreground"><span className="w-3 h-1.5 rounded-full bg-violet-500" />{ar ? "المتاح" : "On hand"}</span>
              </div>
            </div>
          )}
        </Card>

        <Card title={ar ? "هيكل تكلفة المنتجات" : "Product Cost Structure"} sub={ar ? "خامات / عمالة / ماكينات / مصاريف" : "Materials / labor / machine / overhead"}>
          {costStacks.length === 0 ? <p className="text-[11px] text-muted-foreground/50 py-6 text-center">{ar ? "مفيش بيانات" : "No data"}</p> : (
            <div className="space-y-2.5">
              {costStacks.map((s, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10.5px] text-foreground/80 truncate flex-1">{s.name}</p>
                    <p className="text-[10px] font-medium tabular-nums shrink-0">{fmtCompact(s.total)}</p>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden flex bg-muted/60">
                    {s.parts.filter((p) => p.v > 0).map((p, j) => (
                      <div key={j} className="h-full transition-all duration-700" style={{ width: `${(p.v / stackMax) * 100}%`, backgroundColor: p.color }} />
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                {[[ar ? "خامات" : "Materials", "#8b5cf6"], [ar ? "عمالة" : "Labor", "#3b82f6"], [ar ? "ماكينات" : "Machine", "#f59e0b"], [ar ? "مصاريف" : "Overhead", "#94a3b8"]].map(([l, c], i) => (
                  <span key={i} className="flex items-center gap-1.5 text-[9.5px] text-muted-foreground"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: c as string }} />{l}</span>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Products table */}
      <Card
        title={ar ? "المنتجات ومكوناتها" : "Products & Composition"}
        sub={ar ? "اضغط على منتج لتفاصيل الخامات والتكلفة" : "Click any product for its full material breakdown"}
        right={
          <div className="relative w-52">
            <Search size={12} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={ar ? "ابحث في المنتجات..." : "Search products..."}
              className="w-full h-8 ps-8 pe-3 rounded-lg border border-border/60 bg-background text-[12px] focus:outline-none focus:ring-1 focus:ring-primary/30" />
          </div>
        }>
        <div className="border border-border/40 rounded-xl overflow-hidden overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[minmax(220px,2fr)_repeat(5,minmax(80px,1fr))_70px_24px] gap-x-3 px-4 py-2 bg-muted/30 text-[9.5px] text-muted-foreground font-medium uppercase tracking-wide">
              <span>{ar ? "المنتج" : "Product"}</span>
              <span className="text-end">{ar ? "الخامات" : "BOM"}</span>
              <span className="text-end">{ar ? "تكلفة الخامات" : "Mat. Cost"}</span>
              <span className="text-end">{ar ? "تكلفة إجمالية" : "Total Cost"}</span>
              <span className="text-end">{ar ? "السعر" : "Price"}</span>
              <span className="text-end">{ar ? "الهامش" : "Margin"}</span>
              <span className="text-end">{ar ? "قابل للتصنيع" : "Buildable"}</span>
              <span />
            </div>
            {productRows.map(({ p, m, bomCount, matCost, total, price, margin, buildable }) => (
              <button key={p.id} onClick={() => setSelected(p)}
                className="w-full grid grid-cols-[minmax(220px,2fr)_repeat(5,minmax(80px,1fr))_70px_24px] gap-x-3 items-center px-4 py-2.5 border-t border-border/30 hover:bg-muted/20 transition-colors text-start">
                <div className="flex items-center gap-3 min-w-0">
                  <Thumb src={firstImage(m)} size={34} />
                  <div className="min-w-0">
                    <p className="text-[12px] font-medium truncate">{ar ? (p.name_ar || p.name_en) : p.name_en}</p>
                    <p className="text-[9.5px] text-muted-foreground font-mono truncate">{m.sku || m.category || "—"}</p>
                  </div>
                </div>
                <p className={`text-[11.5px] tabular-nums text-end ${bomCount === 0 ? "text-muted-foreground/40" : ""}`}>{bomCount} {ar ? "خامة" : bomCount === 1 ? "line" : "lines"}</p>
                <p className="text-[11.5px] font-medium tabular-nums text-end">{matCost ? fmtVal(matCost) : "—"}</p>
                <p className="text-[11.5px] font-medium tabular-nums text-end">{total ? fmtVal(total) : "—"}</p>
                <p className="text-[11.5px] tabular-nums text-end">{price ? fmtVal(price) : "—"}</p>
                <div className="flex justify-end">
                  {margin === null ? <span className="text-[10px] text-muted-foreground/40">—</span> : (
                    <span className={`text-[9.5px] px-1.5 py-0.5 rounded-full font-medium ${margin >= 30 ? "bg-emerald-100 text-emerald-700" : margin >= 10 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-600"}`}>{margin.toFixed(0)}%</span>
                  )}
                </div>
                <div className="flex justify-end">
                  {buildable === Infinity ? <span className="text-[10px] text-muted-foreground/40">—</span> : (
                    <span className={`text-[9.5px] px-1.5 py-0.5 rounded-full font-medium tabular-nums ${buildable > 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"}`}>{buildable}</span>
                  )}
                </div>
                <ChevronRight size={13} className={`text-muted-foreground/30 ${ar ? "rotate-180" : ""}`} />
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Materials master table */}
      <Card
        title={ar ? "سجل الخامات" : "Raw Materials Register"}
        sub={ar ? "كل الخامات المستخدمة في المنتجات مع التغطية من المخزون" : "Every material your catalog consumes, with live stock coverage"}
        right={
          <div className="relative w-52">
            <Search size={12} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
            <input value={matSearch} onChange={(e) => setMatSearch(e.target.value)} placeholder={ar ? "ابحث في الخامات..." : "Search materials..."}
              className="w-full h-8 ps-8 pe-3 rounded-lg border border-border/60 bg-background text-[12px] focus:outline-none focus:ring-1 focus:ring-primary/30" />
          </div>
        }>
        {filteredMaterials.length === 0 ? (
          <p className="text-[11.5px] text-muted-foreground/60 py-8 text-center">{ar ? "مفيش خامات — ضيف مكونات للمنتجات الأول" : "No materials yet — add BOM lines to your products first"}</p>
        ) : (
          <div className="border border-border/40 rounded-xl overflow-hidden overflow-x-auto">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-[minmax(200px,2fr)_repeat(4,minmax(80px,1fr))_minmax(110px,1fr)] gap-x-3 px-4 py-2 bg-muted/30 text-[9.5px] text-muted-foreground font-medium uppercase tracking-wide">
                <span>{ar ? "الخامة" : "Material"}</span>
                <span className="text-end">{ar ? "في منتجات" : "Used In"}</span>
                <span className="text-end">{ar ? "احتياج الكتالوج" : "Catalog Need"}</span>
                <span className="text-end">{ar ? "المتاح" : "On Hand"}</span>
                <span className="text-end">{ar ? "قيمة الاحتياج" : "Demand Value"}</span>
                <span className="text-end">{ar ? "التغطية" : "Coverage"}</span>
              </div>
              {filteredMaterials.map((mt, i) => {
                const im = mt.stock ? getIM(mt.stock) : null;
                const onHand = im?.quantity ?? null;
                const coverage = onHand === null ? null : mt.demandPerCatalog <= 0 ? 1 : onHand / mt.demandPerCatalog;
                return (
                  <div key={i} className="grid grid-cols-[minmax(200px,2fr)_repeat(4,minmax(80px,1fr))_minmax(110px,1fr)] gap-x-3 items-center px-4 py-2.5 border-t border-border/30">
                    <div className="flex items-center gap-3 min-w-0">
                      <Thumb src={mt.stock ? firstImage(im!) : null} size={30} rounded="rounded-md" />
                      <div className="min-w-0">
                        <p className="text-[11.5px] font-medium truncate">{mt.name}</p>
                        <p className="text-[9.5px] text-muted-foreground truncate">
                          {fmtVal(mt.avgCost)}/{mt.unit}{im?.vendor_name ? ` · ${im.vendor_name}` : ""}{!mt.stock && (ar ? " · غير مرتبط بالمخزون" : " · not linked to stock")}
                        </p>
                      </div>
                    </div>
                    <p className="text-[11.5px] tabular-nums text-end">{mt.usedIn}</p>
                    <p className="text-[11.5px] font-medium tabular-nums text-end">{mt.demandPerCatalog.toLocaleString()} <span className="text-[9.5px] text-muted-foreground font-normal">{mt.unit}</span></p>
                    <p className={`text-[11.5px] tabular-nums text-end ${onHand === null ? "text-muted-foreground/40" : onHand >= mt.demandPerCatalog ? "text-emerald-600" : "text-rose-500"}`}>
                      {onHand === null ? "—" : onHand.toLocaleString()}
                    </p>
                    <p className="text-[11.5px] font-medium tabular-nums text-end">{fmtVal(mt.demandValue)}</p>
                    <div className="flex items-center gap-2">
                      {coverage === null ? <p className="text-[9.5px] text-muted-foreground/40 w-full text-end">—</p> : (
                        <>
                          <CoverageBar pct={coverage} />
                          <p className="text-[9.5px] tabular-nums text-muted-foreground shrink-0 w-9 text-end">{Math.round(coverage * 100)}%</p>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {selected && <ProductDrawer product={selected} invItems={invItems} ar={ar} fmtVal={fmtVal} onClose={() => setSelected(null)} />}
    </div>
  );
}
