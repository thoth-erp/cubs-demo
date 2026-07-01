/**
 * CUBS store — in-memory reactive store (no persistence).
 *
 * Raw Materials, Products and Procurement all share ONE state object,
 * so a change in one module is instantly visible in the others.
 *
 * Consumed with the `useCubs()` hook (useSyncExternalStore).
 */

import { useSyncExternalStore } from "react";
import type { Bi } from "./catalog";
import {
  baseCode, variantCode, makeBarcode, FAMILIES, categoryById, subtypeById,
} from "./catalog";

// ─── Types ──────────────────────────────────────────────────

export interface RMVariant {
  id: string;
  sizeId?: string;
  sizeCode?: string;
  colourId?: string;
  colourCode?: string;
  colourName?: Bi;
  colourHex?: string;
  colourCard?: string;
  colorNo?: string;
  indexNo?: string;
  sku: string;
  barcode: string;
  cost: number;
  stock: number;
  reorderPoint: number;
}

export interface RawMaterial {
  id: string;
  categoryId: string;
  familyId: string;
  subtypeId: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  unitEn: string;
  unitAr: string;
  supplier?: string;
  baseCode: string;
  variants: RMVariant[];
  images?: string[];
  createdAt: string;
}

export interface BOMLine {
  rawMaterialId: string;
  variantId: string;
  qty: number;
  /** Custom (non-RM) line — set when refType is "custom" */
  refType?: "material" | "custom";
  customName?: string;
  customNameAr?: string;
  customCost?: number;
  customUnit?: string;
}

export interface Product {
  id: string;
  name: string;
  nameAr?: string;
  categoryId: string;
  sku: string;
  price: number;
  description?: string;
  descriptionAr?: string;
  bom: BOMLine[];
  status: "active" | "draft";
  createdAt: string;
}

export type OrderKind = "purchase" | "sales";
export type OrderStatus = "draft" | "confirmed" | "received" | "fulfilled" | "cancelled";

export interface OrderLine {
  id: string;
  refType: "product" | "material" | "custom";
  refId?: string;
  variantId?: string;
  name: string;
  sku?: string;
  unit?: string;
  qty: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  kind: OrderKind;
  number: string;
  party: string;
  status: OrderStatus;
  lines: OrderLine[];
  notes?: string;
  expectedDate?: string;
  createdAt: string;
}

export interface CubsState {
  rawMaterials: RawMaterial[];
  products: Product[];
  orders: Order[];
}

// ─── In-memory state ────────────────────────────────────────

let state: CubsState = seed();
const listeners = new Set<() => void>();

function emit() { listeners.forEach((l) => l()); }
function set(next: CubsState) { state = next; emit(); }

export function subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); }
export function getState(): CubsState { return state; }

export function useCubs(): CubsState {
  return useSyncExternalStore(subscribe, getState, getState);
}

function uid(p: string) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`; }

// ─── Variant builder ────────────────────────────────────────

export function buildVariant(input: {
  categoryId: string; familyId: string; subtypeId: string;
  sizeId?: string; sizeCode?: string;
  colourId?: string; colourCode?: string; colourName?: Bi; colourHex?: string; colourCard?: string;
  colorNo?: string; indexNo?: string;
  cost?: number; stock?: number; reorderPoint?: number;
}): RMVariant {
  const sku = variantCode({
    categoryId: input.categoryId, familyId: input.familyId, subtypeId: input.subtypeId,
    sizeCode: input.sizeCode, colourCode: input.colourCode,
  });
  return {
    id: uid("var"),
    sizeId: input.sizeId,
    sizeCode: input.sizeCode,
    colourId: input.colourId,
    colourCode: input.colourCode,
    colourName: input.colourName,
    colourHex: input.colourHex,
    colourCard: input.colourCard,
    colorNo: input.colorNo,
    indexNo: input.indexNo,
    sku,
    barcode: makeBarcode(sku + Math.random().toString(36).slice(2, 5)),
    cost: input.cost ?? 0,
    stock: input.stock ?? 0,
    reorderPoint: input.reorderPoint ?? 0,
  };
}

// ─── Raw material mutations ─────────────────────────────────

export function addRawMaterial(rm: Omit<RawMaterial, "id" | "createdAt" | "baseCode">): RawMaterial {
  const created: RawMaterial = {
    ...rm,
    id: uid("rm"),
    baseCode: baseCode(rm.categoryId, rm.familyId, rm.subtypeId),
    createdAt: new Date().toISOString(),
  };
  set({ ...state, rawMaterials: [created, ...state.rawMaterials] });
  return created;
}
export function updateRawMaterial(id: string, patch: Partial<RawMaterial>) {
  set({ ...state, rawMaterials: state.rawMaterials.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
}
export function removeRawMaterial(id: string) {
  set({ ...state, rawMaterials: state.rawMaterials.filter((r) => r.id !== id) });
}

// ─── Product mutations ──────────────────────────────────────

export function addProduct(p: Omit<Product, "id" | "createdAt">): Product {
  const created: Product = { ...p, id: uid("prd"), createdAt: new Date().toISOString() };
  set({ ...state, products: [created, ...state.products] });
  return created;
}
export function updateProduct(id: string, patch: Partial<Product>) {
  set({ ...state, products: state.products.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
}
export function removeProduct(id: string) {
  set({ ...state, products: state.products.filter((p) => p.id !== id) });
}

// ─── Order mutations ────────────────────────────────────────

export function nextOrderNumber(kind: OrderKind): string {
  const prefix = kind === "purchase" ? "PO" : "SO";
  const n = state.orders.filter((o) => o.kind === kind).length + 1001;
  return `${prefix}-${n}`;
}

export function addOrder(o: Omit<Order, "id" | "createdAt">): Order {
  const created: Order = { ...o, id: uid("ord"), createdAt: new Date().toISOString() };
  set({ ...state, orders: [created, ...state.orders] });
  return created;
}
export function updateOrder(id: string, patch: Partial<Order>) {
  set({ ...state, orders: state.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)) });
}
export function removeOrder(id: string) {
  set({ ...state, orders: state.orders.filter((o) => o.id !== id) });
}

export function adjustStock(rawMaterialId: string, variantId: string, delta: number) {
  set({
    ...state,
    rawMaterials: state.rawMaterials.map((r) =>
      r.id !== rawMaterialId ? r : {
        ...r,
        variants: r.variants.map((v) => (v.id === variantId ? { ...v, stock: Math.max(0, v.stock + delta) } : v)),
      }
    ),
  });
}

/**
 * Move an order to a stock-affecting state and apply inventory effects:
 *  - Receiving a Purchase Order → adds material stock for material lines.
 *  - Fulfilling a Sales Order   → consumes material stock via each product's BOM.
 */
export function applyOrder(id: string) {
  const order = state.orders.find((o) => o.id === id);
  if (!order) return;

  let rms = state.rawMaterials;

  const bump = (rmId: string, varId: string, delta: number) => {
    rms = rms.map((r) =>
      r.id !== rmId ? r : {
        ...r,
        variants: r.variants.map((v) => (v.id === varId ? { ...v, stock: Math.max(0, v.stock + delta) } : v)),
      }
    );
  };

  if (order.kind === "purchase") {
    for (const l of order.lines) {
      if (l.refType === "material" && l.refId && l.variantId) bump(l.refId, l.variantId, l.qty);
    }
  } else {
    for (const l of order.lines) {
      if (l.refType === "material" && l.refId && l.variantId) {
        bump(l.refId, l.variantId, -l.qty);
      } else if (l.refType === "product" && l.refId) {
        const product = state.products.find((p) => p.id === l.refId);
        product?.bom.forEach((b) => bump(b.rawMaterialId, b.variantId, -(b.qty * l.qty)));
      }
    }
  }

  set({
    ...state,
    rawMaterials: rms,
    orders: state.orders.map((o) => (o.id === id ? { ...o, status: order.kind === "purchase" ? "received" : "fulfilled" } : o)),
  });
}

// ─── Cross-module intelligence selectors ────────────────────

export interface VariantRef {
  rm: RawMaterial;
  variant: RMVariant;
}

export function allVariants(s: CubsState = state): VariantRef[] {
  return s.rawMaterials.flatMap((rm) => rm.variants.map((variant) => ({ rm, variant })));
}

export interface StockAlert extends VariantRef { deficit: number }
export function lowStock(s: CubsState = state): StockAlert[] {
  return allVariants(s)
    .filter(({ variant }) => variant.reorderPoint > 0 && variant.stock <= variant.reorderPoint)
    .map((r) => ({ ...r, deficit: Math.max(1, r.variant.reorderPoint * 2 - r.variant.stock) }))
    .sort((a, b) => a.variant.stock - b.variant.stock);
}

export function productMaterialCost(p: Product, s: CubsState = state): number {
  return p.bom.reduce((sum, b) => {
    if (b.refType === "custom") return sum + ((b.customCost || 0) * b.qty);
    const rm = s.rawMaterials.find((r) => r.id === b.rawMaterialId);
    const v = rm?.variants.find((vr) => vr.id === b.variantId);
    return sum + (v ? v.cost * b.qty : 0);
  }, 0);
}

export function buildability(p: Product, qty: number, s: CubsState = state): { ok: boolean; shortfalls: { name: string; need: number; have: number }[] } {
  const shortfalls: { name: string; need: number; have: number }[] = [];
  for (const b of p.bom) {
    const rm = s.rawMaterials.find((r) => r.id === b.rawMaterialId);
    const v = rm?.variants.find((vr) => vr.id === b.variantId);
    if (!rm || !v) continue;
    const need = b.qty * qty;
    if (v.stock < need) shortfalls.push({ name: `${rm.name} · ${v.sku}`, need, have: v.stock });
  }
  return { ok: shortfalls.length === 0, shortfalls };
}

// ─── Seed data (empty — user adds everything) ──────────────

function seed(): CubsState {
  return { rawMaterials: [], products: [], orders: [] };
}
