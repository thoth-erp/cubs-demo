/**
 * Connected Fashion Engine — Shared Types, Constants & Calculations
 *
 * محرك الأزياء المتصل — الأنواع والثوابت والحسابات المشتركة
 */

// ─── Priority System ─────────────────────────────────────

export const PRIORITIES = [
  { value: "critical", en: "Critical", ar: "عاجل جدًا", color: "bg-rose-100 text-rose-700", ring: "ring-rose-300", dot: "bg-rose-500" },
  { value: "high",     en: "High",     ar: "مهم",       color: "bg-orange-100 text-orange-700", ring: "ring-orange-300", dot: "bg-orange-500" },
  { value: "medium",   en: "Medium",   ar: "متوسط",     color: "bg-blue-100 text-blue-700", ring: "ring-blue-300", dot: "bg-blue-500" },
  { value: "low",      en: "Low",      ar: "عادي",      color: "bg-zinc-100 text-zinc-600", ring: "ring-zinc-300", dot: "bg-zinc-400" },
] as const;

export type Priority = typeof PRIORITIES[number]["value"];

// ─── Manufacturing Departments ───────────────────────────

export const DEPARTMENTS = [
  { value: "pattern",       en: "Pattern Making",     ar: "تصميم القالب",      icon: "scissors" },
  { value: "cutting",       en: "Cutting",            ar: "التقطيع",         icon: "scissors" },
  { value: "sewing",        en: "Sewing",             ar: "الخياطة",         icon: "scissors" },
  { value: "embroidery",    en: "Embroidery",         ar: "التطريز",         icon: "sparkles" },
  { value: "finishing",     en: "Finishing",           ar: "التشطيب",         icon: "paintbrush" },
  { value: "pressing",      en: "Pressing & Ironing", ar: "الكوي",           icon: "flame" },
  { value: "quality",       en: "Quality Control",    ar: "مراقبة الجودة",   icon: "clipboard-check" },
  { value: "packing",       en: "Packing",            ar: "التغليف",         icon: "package" },
  { value: "shipping",      en: "Shipping",           ar: "الشحن",           icon: "truck" },
  { value: "customization", en: "Customization",      ar: "التخصيص",         icon: "wand-2" },
  { value: "beading",       en: "Beading & Trim",     ar: "الحبة والتشطيبات", icon: "gem" },
  { value: "dyeing",        en: "Dyeing & Printing",  ar: "الصباغة والطباعة", icon: "palette" },
  { value: "tailoring",     en: "Tailoring",          ar: "الخياطة المفصلة",  icon: "ruler" },
] as const;

// ─── Product Categories ──────────────────────────────────

export const PRODUCT_CATEGORIES = [
  { en: "Dresses",       ar: "فساتين" },
  { en: "Tops",          ar: "بلوزات وتيشيرتات" },
  { en: "Bottoms",       ar: "بناطيل وتنانير" },
  { en: "Outerwear",     ar: "أزياء خارجية" },
  { en: "Suits",         ar: "بِدلات" },
  { en: "Sportswear",    ar: "ملابس رياضية" },
  { en: "Activewear",    ar: "ملابس نشطة" },
  { en: "Bridal",        ar: "فساتين أعراس" },
  { en: "Evening Wear",  ar: "فساتين سهرة" },
  { en: "Accessories",   ar: "إكسسوارات" },
  { en: "Leather Goods", ar: "منتجات جلدية" },
  { en: "Knitwear",      ar: "ملابس تريكو" },
  { en: "Uniforms",      ar: "زي موحد" },
  { en: "Children",      ar: "أطفال" },
  { en: "Custom",        ar: "تفصيل خاص" },
] as const;

export const MATERIALS = [
  "Cotton", "Polyester", "Nylon", "Silk", "Wool", "Linen",
  "Viscose", "Rayon", "Chiffon", "Satin", "Taffeta", "Tulle",
  "Denim", "Jersey", "Fleece", "Velvet", "Corduroy", "Tweed",
  "Leather", "Faux Leather", "Suede", "Neoprene",
  "Organza", "Crepe", "Georgette", "Chambray",
  "Spandex", "Lycra", "Elastane",
  "Mesh", "Lace", "Embellished Fabric",
] as const;

export const FINISHES = [
  "Washed", "Stone Washed", "Enzyme Washed",
  "Garment Dyed", "Piece Dyed", "Yarn Dyed",
  "Screen Printed", "Digital Printed", "Sublimation Printed",
  "Embroidered", "Hand Embroidered", "Beaded",
  "Beaten", "Crinkled", "Pleated", "Gathered",
  "Raw Edge", "Distressed", "Burnished",
  "Waterproof Coated", "Stain Resistant",
  "Natural", "Unfinished",
] as const;

export const BOM_UNITS = ["pcs", "m²", "m", "kg", "ltr", "roll", "set", "yard", "bolt"] as const;

// ─── Stage Dependency Types ──────────────────────────────

export type DependencyType = "sequential" | "parallel" | "blocking" | "optional";

// ─── Enhanced Manufacturing Stage ────────────────────────

export interface MfgStage {
  id: string;
  name: string;
  name_ar?: string;
  order: number;
  department: string;
  team?: string;
  machine?: string;
  duration_hours: number;
  labor_cost: number;
  machine_cost: number;
  material_waste_pct: number;
  overhead_cost: number;
  dependency_type: DependencyType;
  depends_on: string[];
  checklist: string[];
  notes?: string;
  // Manufacturing Intelligence fields
  capacity_units_per_day?: number;
  required_skill?: string;
  can_run_parallel?: boolean;
  blocks_next?: boolean;
  quality_checkpoint?: boolean;
  approval_required?: boolean;
  estimated_setup_time?: number; // minutes
  tooling_required?: string[];
}

// ─── Enhanced BOM Line ───────────────────────────────────

export interface BOMLine {
  id: string;
  material: string;
  sku?: string;
  qty: number;
  unit: string;
  costPerUnit: number;
  inventory_item_id?: string;
  in_stock?: number;
}

// ─── Enhanced Product Metadata ───────────────────────────

export interface ProductMeta {
  product_type?: string;
  sku?: string;
  category?: string;
  description?: string;
  active?: boolean;
  // Dimensions
  width?: number;
  height?: number;
  depth?: number;
  thickness?: number;
  weight?: number;
  // Materials
  main_material?: string;
  secondary_material?: string;
  finish?: string;
  paint?: string;
  hardware?: string;
  edge_banding?: string;
  // BOM & Stages
  bom?: BOMLine[];
  stages?: MfgStage[];
  // Costing (auto-calculated from stages + BOM)
  material_cost?: number;
  labor_cost?: number;
  machine_cost?: number;
  overhead_cost?: number;
  total_cost?: number;
  suggested_price?: number;
  // Priority
  priority?: Priority;
}

// ─── Enhanced Sales Order Metadata ───────────────────────

export interface SOItem {
  id: string;
  product_id?: string;
  product_name: string;
  product_sku?: string;
  description?: string;
  qty: number;
  unitPrice: number;
  width?: number;
  height?: number;
  depth?: number;
  material?: string;
  finish?: string;
  color?: string;
  accessories?: string;
  bom_snapshot?: BOMLine[];
  stages_snapshot?: MfgStage[];
}

export interface SOPayment {
  id: string;
  amount: number;
  date: string;
  method: string;
  reference?: string;
  notes?: string;
}

export interface SOMeta {
  so_number?: string;
  subtotal?: number;
  order_discount?: number;
  order_discount_type?: "pct" | "fixed";
  tax_rate?: number;
  customer_type?: string;
  customer_id?: string;
  customer_name?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  company_name?: string;
  project_name?: string;
  priority?: Priority;
  items?: SOItem[];
  payments?: SOPayment[];
  // Readiness
  customer_confirmed?: boolean;
  measurements_done?: boolean;
  design_approved?: boolean;
  materials_available?: boolean;
  deposit_received?: boolean;
  // Calculated
  total_amount?: number;
  total_paid?: number;
  estimated_days?: number;
  estimated_cost?: number;
  // Manufacturing route
  manufacturing_route?: string;
}

// ─── Stage Timeframe Calculations ────────────────────────

export function calculateCriticalPath(stages: MfgStage[]): {
  totalDays: number;
  criticalPath: string[];
  parallelSavings: number;
} {
  if (!stages.length) return { totalDays: 0, criticalPath: [], parallelSavings: 0 };

  const sequentialTotal = stages.reduce((s, st) => s + st.duration_hours, 0);
  const stageMap = new Map(stages.map(s => [s.id, s]));

  // Build dependency graph and calculate earliest start/finish
  const earliest = new Map<string, { start: number; finish: number }>();

  function getEarliestFinish(stageId: string): number {
    if (earliest.has(stageId)) return earliest.get(stageId)!.finish;
    const stage = stageMap.get(stageId);
    if (!stage) return 0;

    let start = 0;
    if (stage.depends_on.length > 0) {
      if (stage.dependency_type === "parallel") {
        start = 0;
        for (const depId of stage.depends_on) {
          const depStage = stageMap.get(depId);
          if (depStage) {
            const depEarliest = earliest.get(depId);
            start = Math.max(start, depEarliest?.start ?? 0);
          }
        }
      } else {
        for (const depId of stage.depends_on) {
          start = Math.max(start, getEarliestFinish(depId));
        }
      }
    }

    const finish = start + stage.duration_hours;
    earliest.set(stageId, { start, finish });
    return finish;
  }

  // Process stages in order
  const sorted = [...stages].sort((a, b) => a.order - b.order);
  for (const s of sorted) getEarliestFinish(s.id);

  let maxFinish = 0;
  let lastStageId = "";
  for (const [id, timing] of earliest) {
    if (timing.finish > maxFinish) { maxFinish = timing.finish; lastStageId = id; }
  }

  // Trace critical path backwards
  const criticalPath: string[] = [];
  let current = lastStageId;
  while (current) {
    criticalPath.unshift(current);
    const stage = stageMap.get(current);
    if (!stage?.depends_on.length) break;
    let maxDep = "";
    let maxDepFinish = -1;
    for (const depId of stage.depends_on) {
      const depFinish = earliest.get(depId)?.finish ?? 0;
      if (depFinish > maxDepFinish) { maxDepFinish = depFinish; maxDep = depId; }
    }
    current = maxDep;
  }

  const totalDays = Math.ceil(maxFinish / 8); // 8h work day
  const sequentialDays = Math.ceil(sequentialTotal / 8);
  const parallelSavings = sequentialDays - totalDays;

  return { totalDays, criticalPath, parallelSavings };
}

// ─── Stage Cost Calculations ─────────────────────────────

export function calculateStageCosts(stages: MfgStage[], materialCost: number): {
  laborTotal: number;
  machineTotal: number;
  wasteTotal: number;
  overheadTotal: number;
  grandTotal: number;
  perStage: Array<{ id: string; name: string; total: number }>;
} {
  let laborTotal = 0, machineTotal = 0, wasteTotal = 0, overheadTotal = 0;
  const perStage: Array<{ id: string; name: string; total: number }> = [];

  for (const s of stages) {
    const waste = materialCost * (s.material_waste_pct / 100);
    const stageTotal = s.labor_cost + s.machine_cost + waste + s.overhead_cost;
    laborTotal += s.labor_cost;
    machineTotal += s.machine_cost;
    wasteTotal += waste;
    overheadTotal += s.overhead_cost;
    perStage.push({ id: s.id, name: s.name, total: stageTotal });
  }

  return {
    laborTotal, machineTotal, wasteTotal, overheadTotal,
    grandTotal: laborTotal + machineTotal + wasteTotal + overheadTotal,
    perStage,
  };
}

// ─── BOM Cost Calculation ────────────────────────────────

export function calculateBOMCost(bom: BOMLine[]): number {
  return bom.reduce((sum, line) => sum + line.qty * line.costPerUnit, 0);
}

// ─── Total Product Cost ──────────────────────────────────

export function calculateTotalCost(bom: BOMLine[], stages: MfgStage[]): {
  materialCost: number;
  stageCosts: ReturnType<typeof calculateStageCosts>;
  totalCost: number;
} {
  const materialCost = calculateBOMCost(bom);
  const stageCosts = calculateStageCosts(stages, materialCost);
  return { materialCost, stageCosts, totalCost: materialCost + stageCosts.grandTotal };
}

// ─── Warnings / Intelligence ─────────────────────────────

export interface EngineWarning {
  type: "error" | "warning" | "info";
  code: string;
  en: string;
  ar: string;
}

export function getProductWarnings(meta: ProductMeta): EngineWarning[] {
  const warnings: EngineWarning[] = [];
  if (!meta.bom?.length)
    warnings.push({ type: "warning", code: "no_bom", en: "No BOM defined — cost will be incomplete", ar: "مفيش مكونات — التكلفة هتبقى ناقصة" });
  if (!meta.stages?.length)
    warnings.push({ type: "warning", code: "no_stages", en: "No manufacturing stages — can't estimate time", ar: "مفيش مراحل تصنيع — مش هنقدر نحسب الوقت" });
  if (meta.bom?.length && meta.stages?.length) {
    const { totalCost } = calculateTotalCost(meta.bom, meta.stages);
    if (meta.suggested_price && meta.suggested_price < totalCost)
      warnings.push({ type: "error", code: "negative_margin", en: `Selling price (${meta.suggested_price}) is below cost (${Math.round(totalCost)})`, ar: `سعر البيع (${meta.suggested_price}) أقل من التكلفة (${Math.round(totalCost)})` });
    if (meta.suggested_price && meta.suggested_price > 0) {
      const margin = ((meta.suggested_price - totalCost) / meta.suggested_price) * 100;
      if (margin < 15)
        warnings.push({ type: "warning", code: "low_margin", en: `Margin is only ${Math.round(margin)}% — consider reviewing`, ar: `هامش الربح ${Math.round(margin)}% بس — راجع السعر` });
    }
  }
  const hasBlockingWithoutDep = meta.stages?.filter(s => s.dependency_type === "blocking" && !s.depends_on.length);
  if (hasBlockingWithoutDep?.length)
    warnings.push({ type: "info", code: "blocking_no_dep", en: "Blocking stages without dependencies", ar: "مراحل حاجزة من غير تبعيات" });
  return warnings;
}

export function getSOWarnings(meta: SOMeta): EngineWarning[] {
  const warnings: EngineWarning[] = [];
  if (!meta.items?.length)
    warnings.push({ type: "warning", code: "no_items", en: "No items in order", ar: "مفيش منتجات في الطلب" });
  if (meta.items?.some(i => !i.product_id))
    warnings.push({ type: "info", code: "unlinked_product", en: "Some items not linked to product catalog", ar: "بعض المنتجات مش متوصلة بالكتالوج" });
  const total = meta.items?.reduce((s, i) => s + i.qty * i.unitPrice, 0) || 0;
  const paid = meta.total_paid || 0;
  if (total > 0 && paid < total * 0.3)
    warnings.push({ type: "warning", code: "low_deposit", en: `Only ${Math.round((paid / total) * 100)}% paid — usual minimum is 30%`, ar: `اتدفع ${Math.round((paid / total) * 100)}% بس — الحد الأدنى المعتاد 30%` });
  if (!meta.customer_confirmed)
    warnings.push({ type: "info", code: "not_confirmed", en: "Customer hasn't confirmed yet", ar: "العميل لسه ما أكدش" });
  if (!meta.measurements_done)
    warnings.push({ type: "info", code: "no_measurements", en: "Measurements not done", ar: "المقاسات لسه ما اتاخدتش" });
  return warnings;
}

// ─── Default Kitchen Stages ──────────────────────────────

let _stageIdCounter = 0;
function stageId(): string { return `stg_${Date.now()}_${++_stageIdCounter}`; }

export function defaultDressStages(): MfgStage[] {
  const ids = Array.from({ length: 10 }, () => stageId());
  return [
    { id: ids[0], name: "Pattern Making", name_ar: "تصميم القالب", order: 1, department: "pattern", duration_hours: 4, labor_cost: 150, machine_cost: 0, material_waste_pct: 0, overhead_cost: 20, dependency_type: "sequential", depends_on: [], checklist: ["Draft pattern", "Create toile", "Fit test on model", "Finalize pattern"] },
    { id: ids[1], name: "Fabric Cutting", name_ar: "تقطيع القماش", order: 2, department: "cutting", duration_hours: 3, labor_cost: 100, machine_cost: 30, material_waste_pct: 8, overhead_cost: 15, dependency_type: "sequential", depends_on: [ids[0]], checklist: ["Lay fabric", "Mark pattern", "Cut pieces", "Number all pieces"] },
    { id: ids[2], name: "Sewing — Main Body", name_ar: "خياطة الجسم الرئيسي", order: 3, department: "sewing", duration_hours: 8, labor_cost: 300, machine_cost: 40, material_waste_pct: 0, overhead_cost: 30, dependency_type: "sequential", depends_on: [ids[1]], checklist: ["Join seams", "Insert zipper", "Attach lining", "Press seams"] },
    { id: ids[3], name: "Embroidery / Beading", name_ar: "تطريز / حبكة", order: 4, department: "embroidery", duration_hours: 6, labor_cost: 250, machine_cost: 20, material_waste_pct: 2, overhead_cost: 20, dependency_type: "parallel", depends_on: [ids[1]], checklist: ["Set up machine", "Embroider panels", "Hand-finish details"] },
    { id: ids[4], name: "Sleeves & Collar", name_ar: "الأكمام والياقة", order: 5, department: "sewing", duration_hours: 4, labor_cost: 150, machine_cost: 20, material_waste_pct: 0, overhead_cost: 15, dependency_type: "sequential", depends_on: [ids[2]], checklist: ["Set sleeves", "Attach collar", "Top-stitch edges"] },
    { id: ids[5], name: "Finishing & Trimming", name_ar: "التشطيب والقص", order: 6, department: "finishing", duration_hours: 3, labor_cost: 100, machine_cost: 10, material_waste_pct: 0, overhead_cost: 10, dependency_type: "sequential", depends_on: [ids[3], ids[4]], checklist: ["Trim threads", "Attach buttons", "Attach labels", "Final press"] },
    { id: ids[6], name: "Pressing & Ironing", name_ar: "الكوي", order: 7, department: "pressing", duration_hours: 2, labor_cost: 60, machine_cost: 15, material_waste_pct: 0, overhead_cost: 8, dependency_type: "sequential", depends_on: [ids[5]], checklist: ["Steam press", "Final touch-up", "Hang garment"] },
    { id: ids[7], name: "Quality Control", name_ar: "فحص الجودة", order: 8, department: "quality", duration_hours: 2, labor_cost: 80, machine_cost: 0, material_waste_pct: 0, overhead_cost: 10, dependency_type: "sequential", depends_on: [ids[6]], checklist: ["Check measurements", "Check stitching", "Check symmetry", "Grade A/B/C"] },
    { id: ids[8], name: "Packing", name_ar: "التغليف", order: 9, department: "packing", duration_hours: 2, labor_cost: 50, machine_cost: 0, material_waste_pct: 0, overhead_cost: 8, dependency_type: "sequential", depends_on: [ids[7]], checklist: ["Fold garment", "Tag & label", "Bag & box"] },
    { id: ids[9], name: "Shipping", name_ar: "الشحن", order: 10, department: "shipping", duration_hours: 3, labor_cost: 80, machine_cost: 0, material_waste_pct: 0, overhead_cost: 15, dependency_type: "sequential", depends_on: [ids[8]], checklist: ["Pack shipment", "Generate label", "Dispatch"] },
  ];
}

export function defaultGarmentStages(): MfgStage[] {
  const ids = Array.from({ length: 7 }, () => stageId());
  return [
    { id: ids[0], name: "Pattern & Marking", name_ar: "القصة والتعليم", order: 1, department: "pattern", duration_hours: 3, labor_cost: 100, machine_cost: 0, material_waste_pct: 0, overhead_cost: 10, dependency_type: "sequential", depends_on: [], checklist: ["Draft/grade pattern", "Mark fabric"] },
    { id: ids[1], name: "Cutting", name_ar: "التقطيع", order: 2, department: "cutting", duration_hours: 3, labor_cost: 80, machine_cost: 20, material_waste_pct: 6, overhead_cost: 10, dependency_type: "sequential", depends_on: [ids[0]], checklist: ["Cut fabric", "Sort pieces", "Bundle by size"] },
    { id: ids[2], name: "Sewing", name_ar: "الخياطة", order: 3, department: "sewing", duration_hours: 6, labor_cost: 200, machine_cost: 30, material_waste_pct: 0, overhead_cost: 20, dependency_type: "sequential", depends_on: [ids[1]], checklist: ["Stitch seams", "Attach trims", "Press as you go"] },
    { id: ids[3], name: "Finishing", name_ar: "التشطيب", order: 4, department: "finishing", duration_hours: 3, labor_cost: 100, machine_cost: 10, material_waste_pct: 0, overhead_cost: 10, dependency_type: "sequential", depends_on: [ids[2]], checklist: ["Trim threads", "Attach labels", "Final press"] },
    { id: ids[4], name: "Quality Check", name_ar: "فحص الجودة", order: 5, department: "quality", duration_hours: 2, labor_cost: 60, machine_cost: 0, material_waste_pct: 0, overhead_cost: 8, dependency_type: "sequential", depends_on: [ids[3]], checklist: ["Inspect stitches", "Check measurements", "Grade quality"] },
    { id: ids[5], name: "Packing", name_ar: "التغليف", order: 6, department: "packing", duration_hours: 2, labor_cost: 50, machine_cost: 0, material_waste_pct: 0, overhead_cost: 5, dependency_type: "sequential", depends_on: [ids[4]], checklist: ["Fold", "Tag", "Bag"] },
    { id: ids[6], name: "Shipping", name_ar: "الشحن", order: 7, department: "shipping", duration_hours: 3, labor_cost: 80, machine_cost: 0, material_waste_pct: 0, overhead_cost: 10, dependency_type: "sequential", depends_on: [ids[5]], checklist: ["Pack shipment", "Dispatch"] },
  ];
}

// ─── Product Templates ───────────────────────────────────

export interface ProductTemplate {
  key: string;
  en: string;
  ar: string;
  category: string;
  suggestedBOM: Array<{ material: string; qty: number; unit: string; costPerUnit: number }>;
  stages: () => MfgStage[];
}

export function defaultSuitStages(): MfgStage[] {
  const ids = Array.from({ length: 8 }, () => stageId());
  return [
    { id: ids[0], name: "Pattern Making", name_ar: "تصميم القالب", order: 1, department: "pattern", duration_hours: 6, labor_cost: 250, machine_cost: 0, material_waste_pct: 0, overhead_cost: 25, dependency_type: "sequential", depends_on: [], checklist: ["Draft suit pattern", "Create muslin toile", "Fit adjustments", "Finalize pattern"] },
    { id: ids[1], name: "Cutting", name_ar: "التقطيع", order: 2, department: "cutting", duration_hours: 4, labor_cost: 120, machine_cost: 30, material_waste_pct: 7, overhead_cost: 15, dependency_type: "sequential", depends_on: [ids[0]], checklist: ["Lay fabric with nap", "Cut jacket pieces", "Cut trouser pieces", "Cut lining"] },
    { id: ids[2], name: "Sewing — Jacket", name_ar: "خياطة السترة", order: 3, department: "sewing", duration_hours: 10, labor_cost: 400, machine_cost: 50, material_waste_pct: 0, overhead_cost: 40, dependency_type: "sequential", depends_on: [ids[1]], checklist: ["Join front panels", "Set shoulder pads", "Attach lapel", "Set sleeves"] },
    { id: ids[3], name: "Sewing — Trousers", name_ar: "خياطة البناطيل", order: 4, department: "sewing", duration_hours: 6, labor_cost: 200, machine_cost: 30, material_waste_pct: 0, overhead_cost: 20, dependency_type: "parallel", depends_on: [ids[1]], checklist: ["Join seams", "Set fly", "Attach waistband", "Hem"] },
    { id: ids[4], name: "Pressing & Shaping", name_ar: "الكوي والتشكيل", order: 5, department: "pressing", duration_hours: 4, labor_cost: 150, machine_cost: 20, material_waste_pct: 0, overhead_cost: 15, dependency_type: "sequential", depends_on: [ids[2], ids[3]], checklist: ["Shape lapels", "Press seams open", "Steam finish"] },
    { id: ids[5], name: "Finishing & Lining", name_ar: "البطانة والتشطيب", order: 6, department: "finishing", duration_hours: 4, labor_cost: 150, machine_cost: 15, material_waste_pct: 0, overhead_cost: 12, dependency_type: "sequential", depends_on: [ids[4]], checklist: ["Attach lining", "Set buttons", "Bar-tack stress points", "Final trim"] },
    { id: ids[6], name: "Quality Control", name_ar: "فحص الجودة", order: 7, department: "quality", duration_hours: 3, labor_cost: 100, machine_cost: 0, material_waste_pct: 0, overhead_cost: 10, dependency_type: "sequential", depends_on: [ids[5]], checklist: ["Check fit on form", "Inspect stitching", "Check symmetry", "Grade quality"] },
    { id: ids[7], name: "Packing & Shipping", name_ar: "التغليف والشحن", order: 8, department: "packing", duration_hours: 2, labor_cost: 60, machine_cost: 0, material_waste_pct: 0, overhead_cost: 8, dependency_type: "sequential", depends_on: [ids[6]], checklist: ["Hang on suit hanger", "Cover with garment bag", "Box & ship"] },
  ];
}

export function defaultTShirtStages(): MfgStage[] {
  const ids = Array.from({ length: 5 }, () => stageId());
  return [
    { id: ids[0], name: "Pattern & Cutting", name_ar: "القصة والتقطيع", order: 1, department: "cutting", duration_hours: 2, labor_cost: 60, machine_cost: 20, material_waste_pct: 6, overhead_cost: 8, dependency_type: "sequential", depends_on: [], checklist: ["Grade pattern", "Lay fabric", "Cut pieces"] },
    { id: ids[1], name: "Sewing", name_ar: "الخياطة", order: 2, department: "sewing", duration_hours: 4, labor_cost: 120, machine_cost: 25, material_waste_pct: 0, overhead_cost: 12, dependency_type: "sequential", depends_on: [ids[0]], checklist: ["Join shoulder seams", "Set sleeves", "Hem & collar", "Side seams"] },
    { id: ids[2], name: "Print / Embroider", name_ar: "طباعة / تطريز", order: 3, department: "dyeing", duration_hours: 3, labor_cost: 80, machine_cost: 40, material_waste_pct: 0, overhead_cost: 10, dependency_type: "sequential", depends_on: [ids[1]], checklist: ["Set up print", "Print logo", "Cure ink"] },
    { id: ids[3], name: "QC & Press", name_ar: "فحص وكوي", order: 4, department: "quality", duration_hours: 1, labor_cost: 30, machine_cost: 5, material_waste_pct: 0, overhead_cost: 5, dependency_type: "sequential", depends_on: [ids[2]], checklist: ["Check stitching", "Steam press", "Fold"] },
    { id: ids[4], name: "Pack & Ship", name_ar: "تغليف وشحن", order: 5, department: "packing", duration_hours: 1, labor_cost: 25, machine_cost: 0, material_waste_pct: 0, overhead_cost: 5, dependency_type: "sequential", depends_on: [ids[3]], checklist: ["Bag", "Tag", "Box"] },
  ];
}

export const PRODUCT_TEMPLATES: ProductTemplate[] = [
  {
    key: "dress", en: "Dress", ar: "فستان", category: "Dresses",
    suggestedBOM: [
      { material: "Cotton", qty: 3, unit: "m", costPerUnit: 80 },
      { material: "Lining (Viscose)", qty: 2.5, unit: "m", costPerUnit: 40 },
      { material: "Zipper", qty: 1, unit: "pcs", costPerUnit: 15 },
      { material: "Buttons", qty: 8, unit: "pcs", costPerUnit: 5 },
      { material: "Thread", qty: 1, unit: "roll", costPerUnit: 8 },
      { material: "Labels", qty: 1, unit: "set", costPerUnit: 3 },
    ],
    stages: defaultDressStages,
  },
  {
    key: "suit", en: "Suit / Blazer", ar: "بِلدة / سترة", category: "Suits",
    suggestedBOM: [
      { material: "Wool", qty: 4, unit: "m", costPerUnit: 200 },
      { material: "Lining (Satin)", qty: 3, unit: "m", costPerUnit: 60 },
      { material: "Shoulder Pads", qty: 2, unit: "pcs", costPerUnit: 25 },
      { material: "Buttons", qty: 6, unit: "pcs", costPerUnit: 12 },
      { material: "Interfacing", qty: 2, unit: "m", costPerUnit: 30 },
      { material: "Thread", qty: 1, unit: "roll", costPerUnit: 10 },
    ],
    stages: defaultSuitStages,
  },
  {
    key: "tshirt", en: "T-Shirt / Polo", ar: "تيشيرت / بولو", category: "Tops",
    suggestedBOM: [
      { material: "Jersey Cotton", qty: 2, unit: "m", costPerUnit: 50 },
      { material: "Ribbing", qty: 0.5, unit: "m", costPerUnit: 15 },
      { material: "Labels", qty: 1, unit: "set", costPerUnit: 3 },
      { material: "Thread", qty: 1, unit: "roll", costPerUnit: 6 },
    ],
    stages: defaultTShirtStages,
  },
  {
    key: "trousers", en: "Trousers", ar: "بناطيل", category: "Bottoms",
    suggestedBOM: [
      { material: "Cotton Twill", qty: 2, unit: "m", costPerUnit: 90 },
      { material: "Zipper", qty: 1, unit: "pcs", costPerUnit: 12 },
      { material: "Buttons", qty: 3, unit: "pcs", costPerUnit: 5 },
      { material: "Interfacing", qty: 0.5, unit: "m", costPerUnit: 15 },
      { material: "Thread", qty: 1, unit: "roll", costPerUnit: 6 },
    ],
    stages: defaultGarmentStages,
  },
  {
    key: "outerwear", en: "Jacket / Coat", ar: "جاكيت / معطف", category: "Outerwear",
    suggestedBOM: [
      { material: "Wool Blend", qty: 3.5, unit: "m", costPerUnit: 180 },
      { material: "Lining", qty: 3, unit: "m", costPerUnit: 50 },
      { material: "Zipper", qty: 1, unit: "pcs", costPerUnit: 35 },
      { material: "Buttons", qty: 5, unit: "pcs", costPerUnit: 15 },
      { material: "Shoulder Pads", qty: 2, unit: "pcs", costPerUnit: 20 },
      { material: "Thread", qty: 1, unit: "roll", costPerUnit: 10 },
    ],
    stages: defaultSuitStages,
  },
  {
    key: "bridal", en: "Bridal / Evening", ar: "فستان عرس / سهرة", category: "Bridal",
    suggestedBOM: [
      { material: "Silk", qty: 5, unit: "m", costPerUnit: 300 },
      { material: "Tulle", qty: 8, unit: "m", costPerUnit: 40 },
      { material: "Chiffon", qty: 4, unit: "m", costPerUnit: 60 },
      { material: "Lace", qty: 3, unit: "m", costPerUnit: 150 },
      { material: "Beading", qty: 1, unit: "set", costPerUnit: 200 },
      { material: "Zipper (invisible)", qty: 1, unit: "pcs", costPerUnit: 20 },
      { material: "Thread", qty: 1, unit: "roll", costPerUnit: 12 },
    ],
    stages: defaultDressStages,
  },
  {
    key: "activewear", en: "Activewear Set", ar: "طقم رياضي", category: "Sportswear",
    suggestedBOM: [
      { material: "Spandex", qty: 2, unit: "m", costPerUnit: 70 },
      { material: "Mesh", qty: 1, unit: "m", costPerUnit: 35 },
      { material: "Elastic", qty: 2, unit: "m", costPerUnit: 10 },
      { material: "Drawstring", qty: 1, unit: "pcs", costPerUnit: 5 },
      { material: "Labels", qty: 1, unit: "set", costPerUnit: 3 },
      { material: "Thread", qty: 1, unit: "roll", costPerUnit: 8 },
    ],
    stages: defaultGarmentStages,
  },
  {
    key: "accessories", en: "Accessories", ar: "إكسسوارات", category: "Accessories",
    suggestedBOM: [
      { material: "Leather", qty: 1, unit: "m²", costPerUnit: 200 },
      { material: "Fittings", qty: 1, unit: "set", costPerUnit: 50 },
      { material: "Thread (nylon)", qty: 1, unit: "roll", costPerUnit: 15 },
      { material: "Labels", qty: 1, unit: "set", costPerUnit: 3 },
    ],
    stages: defaultGarmentStages,
  },
  {
    key: "custom_garment", en: "Custom Garment", ar: "قطعة مخصصة", category: "Custom",
    suggestedBOM: [],
    stages: defaultGarmentStages,
  },
];

// ─── Helper to generate unique IDs ───────────────────────

export function uid(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
