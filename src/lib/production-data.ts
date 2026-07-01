/**
 * Production Module — Data Layer (Furniture Manufacturing)
 * Complete production tracking: orders, stages, rate, QC, materials, costs, alerts
 */

// ─── Types ────────────────────────────────────────────────

export type StageStatus = "not_started" | "waiting" | "in_progress" | "paused" | "blocked" | "completed" | "failed_qc" | "rework_required";
export type ProductionStatus = "planned" | "in_progress" | "delayed" | "on_hold" | "completed" | "cancelled";
export type Priority = "critical" | "urgent" | "high" | "medium" | "low";

export interface ProductionStage {
  id: string;
  order_id: string;
  stage_key: string;
  stage_name_en: string;
  stage_name_ar: string;
  status: StageStatus;
  started_at: string | null;
  finished_at: string | null;
  planned_duration_hours: number;
  actual_duration_hours: number | null;
  completed_qty: number;
  remaining_qty: number;
  rejected_qty: number;
  rework_qty: number;
  assigned_team: string;
  assigned_operator: string;
  notes: string;
  sequence: number;
}

export interface ProductionOrder {
  id: string;
  order_number: string;
  product_name: string;
  product_sku: string;
  sales_order_ref: string;
  customer_name: string;
  priority: Priority;
  status: ProductionStatus;
  current_stage: string;
  current_stage_en: string;
  current_stage_ar: string;
  planned_qty: number;
  completed_qty: number;
  remaining_qty: number;
  rejected_qty: number;
  rework_qty: number;
  waste_qty: number;
  passed_qty: number;
  progress_pct: number;
  production_rate_per_hour: number;
  production_rate_per_day: number;
  efficiency_pct: number;
  planned_rate_per_hour: number;
  start_date: string;
  due_date: string;
  estimated_completion: string;
  is_delayed: boolean;
  delay_days: number;
  delay_reason: string;
  assigned_team: string;
  assigned_lead: string;
  workstation: string;
  material_status: "available" | "partial" | "shortage";
  qc_status: "pending" | "in_progress" | "passed" | "failed" | "conditional";
  estimated_cost: number;
  actual_cost: number;
  material_cost: number;
  labor_cost: number;
  notes: string;
  created_at: string;
  updated_at: string;
  stages: ProductionStage[];
  materials: ProductionMaterial[];
  qc_checks: QCCheck[];
  activity_log: ActivityLogEntry[];
}

export interface ProductionMaterial {
  id: string;
  name: string;
  required_qty: number;
  reserved_qty: number;
  used_qty: number;
  remaining_qty: number;
  unit: string;
  status: "available" | "reserved" | "partial" | "shortage";
  supplier: string;
  warehouse_location: string;
}

export interface QCCheck {
  id: string;
  stage: string;
  inspector: string;
  status: "pending" | "passed" | "failed" | "conditional";
  passed_qty: number;
  failed_qty: number;
  defect_type: string;
  defect_pct: number;
  notes: string;
  checked_at: string;
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  description_en: string;
  description_ar: string;
  user: string;
  timestamp: string;
  type: "stage_change" | "quantity_update" | "qc" | "material" | "comment" | "file" | "delay" | "completion" | "status_change";
}

export interface ProductionAlert {
  id: string;
  order_id: string;
  order_number: string;
  type: "rate_low" | "deadline_risk" | "material_shortage" | "qc_failure" | "stage_stuck" | "rework_risk" | "machine_down" | "quantity_mismatch";
  severity: "info" | "warning" | "critical";
  message_en: string;
  message_ar: string;
  created_at: string;
  dismissed: boolean;
}

export interface WorkstationInfo {
  id: string;
  name: string;
  status: "active" | "idle" | "maintenance" | "down";
  current_order: string | null;
  operator: string;
  capacity: number;
  queue_count: number;
  last_maintenance: string;
}

// ─── Default Stage Template (Furniture Manufacturing) ──────

export const DEFAULT_STAGES = [
  { key: "order_created",       en: "Order Created",       ar: "إنشاء الأمر",         sequence: 0 },
  { key: "materials_reserved",  en: "Materials Reserved",  ar: "تحديد المواد",        sequence: 1 },
  { key: "cutting",             en: "Cutting",             ar: "التقطيع",            sequence: 2 },
  { key: "edgebanding",         en: "Edgebanding",         ar: "الكنار",             sequence: 3 },
  { key: "drilling",            en: "Drilling / CNC",      ar: "التخريم / CNC",      sequence: 4 },
  { key: "assembly",            en: "Assembly",            ar: "التجميع",            sequence: 5 },
  { key: "finishing",           en: "Finishing / Painting", ar: "التشطيب / الدهان",   sequence: 6 },
  { key: "quality_control",     en: "Quality Control",     ar: "مراقبة الجودة",       sequence: 7 },
  { key: "packaging",           en: "Packaging",           ar: "التغليف",            sequence: 8 },
  { key: "ready_dispatch",      en: "Ready for Dispatch",  ar: "جاهز للتسليم",       sequence: 9 },
  { key: "completed",           en: "Completed",           ar: "مكتمل",              sequence: 10 },
] as const;

// ─── Demo Data ────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function tsAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));
  return d.toISOString();
}

const DEMO_STAGES: ProductionStage[] = [
  // PO-01: Meridian Kitchen — Modern Handleless
  { id: "s1-1", order_id: "po-01", stage_key: "order_created", stage_name_en: "Order Created", stage_name_ar: "إنشاء الأمر", status: "completed", started_at: daysAgo(30), finished_at: daysAgo(30), planned_duration_hours: 1, actual_duration_hours: 0.5, completed_qty: 1, remaining_qty: 0, rejected_qty: 0, rework_qty: 0, assigned_team: "Operations", assigned_operator: "System", notes: "", sequence: 0 },
  { id: "s1-2", order_id: "po-01", stage_key: "materials_reserved", stage_name_en: "Materials Reserved", stage_name_ar: "تحديد المواد", status: "completed", started_at: daysAgo(30), finished_at: daysAgo(28), planned_duration_hours: 8, actual_duration_hours: 10, completed_qty: 1, remaining_qty: 0, rejected_qty: 0, rework_qty: 0, assigned_team: "Warehouse", assigned_operator: "Tariq Hassan", notes: "18 sheets MDF, 45m edgeband, 28 hinges, 12 slides reserved", sequence: 1 },
  { id: "s1-3", order_id: "po-01", stage_key: "cutting", stage_name_en: "Cutting", stage_name_ar: "التقطيع", status: "completed", started_at: daysAgo(28), finished_at: daysAgo(25), planned_duration_hours: 24, actual_duration_hours: 28, completed_qty: 1, remaining_qty: 0, rejected_qty: 0, rework_qty: 0, assigned_team: "Cutting Team", assigned_operator: "Ahmad Khalil", notes: "CNC cutting — 5 pieces had edge defects, recut", sequence: 2 },
  { id: "s1-4", order_id: "po-01", stage_key: "edgebanding", stage_name_en: "Edgebanding", stage_name_ar: "الكنار", status: "completed", started_at: daysAgo(25), finished_at: daysAgo(22), planned_duration_hours: 16, actual_duration_hours: 18, completed_qty: 1, remaining_qty: 0, rejected_qty: 0, rework_qty: 0, assigned_team: "Edgebanding", assigned_operator: "Salman Rizq", notes: "1mm and 2mm edgeband applied", sequence: 3 },
  { id: "s1-5", order_id: "po-01", stage_key: "drilling", stage_name_en: "Drilling / CNC", stage_name_ar: "التخريم / CNC", status: "completed", started_at: daysAgo(22), finished_at: daysAgo(20), planned_duration_hours: 12, actual_duration_hours: 10, completed_qty: 1, remaining_qty: 0, rejected_qty: 0, rework_qty: 0, assigned_team: "CNC Team", assigned_operator: "Youssef Ali", notes: "Push-to-open drilling pattern applied", sequence: 4 },
  { id: "s1-6", order_id: "po-01", stage_key: "assembly", stage_name_en: "Assembly", stage_name_ar: "التجميع", status: "completed", started_at: daysAgo(20), finished_at: daysAgo(16), planned_duration_hours: 32, actual_duration_hours: 36, completed_qty: 1, remaining_qty: 0, rejected_qty: 0, rework_qty: 0, assigned_team: "Assembly A", assigned_operator: "Rami Saad", notes: "Blum tip-on hardware installed", sequence: 5 },
  { id: "s1-7", order_id: "po-01", stage_key: "finishing", stage_name_en: "Finishing / Painting", stage_name_ar: "التشطيب / الدهان", status: "completed", started_at: daysAgo(16), finished_at: daysAgo(12), planned_duration_hours: 20, actual_duration_hours: 22, completed_qty: 1, remaining_qty: 0, rejected_qty: 0, rework_qty: 0, assigned_team: "Finishing", assigned_operator: "Khaled Mansour", notes: "Lacquer spray coat — 2 coats applied", sequence: 6 },
  { id: "s1-8", order_id: "po-01", stage_key: "quality_control", stage_name_en: "Quality Control", stage_name_ar: "مراقبة الجودة", status: "completed", started_at: daysAgo(12), finished_at: daysAgo(10), planned_duration_hours: 8, actual_duration_hours: 6, completed_qty: 1, remaining_qty: 0, rejected_qty: 0, rework_qty: 0, assigned_team: "QC Team", assigned_operator: "Layla Qasim", notes: "All panels within spec — minor edge chip on piece #7 acceptable", sequence: 7 },
  { id: "s1-9", order_id: "po-01", stage_key: "packaging", stage_name_en: "Packaging", stage_name_ar: "التغليف", status: "in_progress", started_at: daysAgo(10), finished_at: null, planned_duration_hours: 8, actual_duration_hours: null, completed_qty: 0, remaining_qty: 1, rejected_qty: 0, rework_qty: 0, assigned_team: "Packing", assigned_operator: "Omar Hassan", notes: "Awaiting final hardware kit", sequence: 8 },

  // PO-02: Meridian Master Wardrobe
  { id: "s2-1", order_id: "po-02", stage_key: "order_created", stage_name_en: "Order Created", stage_name_ar: "إنشاء الأمر", status: "completed", started_at: daysAgo(28), finished_at: daysAgo(28), planned_duration_hours: 1, actual_duration_hours: 0.5, completed_qty: 1, remaining_qty: 0, rejected_qty: 0, rework_qty: 0, assigned_team: "Operations", assigned_operator: "System", notes: "", sequence: 0 },
  { id: "s2-2", order_id: "po-02", stage_key: "materials_reserved", stage_name_en: "Materials Reserved", stage_name_ar: "تحديد المواد", status: "completed", started_at: daysAgo(28), finished_at: daysAgo(26), planned_duration_hours: 8, actual_duration_hours: 12, completed_qty: 1, remaining_qty: 0, rejected_qty: 0, rework_qty: 0, assigned_team: "Warehouse", assigned_operator: "Tariq Hassan", notes: "12 sheets, 30m edgeband, sliding door tracks ordered", sequence: 1 },
  { id: "s2-3", order_id: "po-02", stage_key: "cutting", stage_name_en: "Cutting", stage_name_ar: "التقطيع", status: "completed", started_at: daysAgo(26), finished_at: daysAgo(23), planned_duration_hours: 20, actual_duration_hours: 22, completed_qty: 1, remaining_qty: 0, rejected_qty: 0, rework_qty: 0, assigned_team: "Cutting Team", assigned_operator: "Ahmad Khalil", notes: "", sequence: 2 },
  { id: "s2-4", order_id: "po-02", stage_key: "edgebanding", stage_name_en: "Edgebanding", stage_name_ar: "الكنار", status: "completed", started_at: daysAgo(23), finished_at: daysAgo(20), planned_duration_hours: 14, actual_duration_hours: 12, completed_qty: 1, remaining_qty: 0, rejected_qty: 0, rework_qty: 0, assigned_team: "Edgebanding", assigned_operator: "Salman Rizq", notes: "", sequence: 3 },
  { id: "s2-5", order_id: "po-02", stage_key: "drilling", stage_name_en: "Drilling / CNC", stage_name_ar: "التخريم / CNC", status: "completed", started_at: daysAgo(20), finished_at: daysAgo(18), planned_duration_hours: 10, actual_duration_hours: 8, completed_qty: 1, remaining_qty: 0, rejected_qty: 0, rework_qty: 0, assigned_team: "CNC Team", assigned_operator: "Youssef Ali", notes: "", sequence: 4 },
  { id: "s2-6", order_id: "po-02", stage_key: "assembly", stage_name_en: "Assembly", stage_name_ar: "التجميع", status: "in_progress", started_at: daysAgo(18), finished_at: null, planned_duration_hours: 28, actual_duration_hours: null, completed_qty: 0, remaining_qty: 1, rejected_qty: 0, rework_qty: 0, assigned_team: "Assembly B", assigned_operator: "Rami Saad", notes: "Waiting for sliding door tracks from supplier", sequence: 5 },

  // PO-03: Al-Noor Reception Counter (Curved)
  { id: "s3-1", order_id: "po-03", stage_key: "order_created", stage_name_en: "Order Created", stage_name_ar: "إنشاء الأمر", status: "completed", started_at: daysAgo(15), finished_at: daysAgo(15), planned_duration_hours: 1, actual_duration_hours: 0.5, completed_qty: 1, remaining_qty: 0, rejected_qty: 0, rework_qty: 0, assigned_team: "Operations", assigned_operator: "System", notes: "", sequence: 0 },
  { id: "s3-2", order_id: "po-03", stage_key: "materials_reserved", stage_name_en: "Materials Reserved", stage_name_ar: "تحديد المواد", status: "completed", started_at: daysAgo(15), finished_at: daysAgo(13), planned_duration_hours: 8, actual_duration_hours: 14, completed_qty: 1, remaining_qty: 0, rejected_qty: 0, rework_qty: 0, assigned_team: "Warehouse", assigned_operator: "Tariq Hassan", notes: "Walnut veneer + Corian from external supplier delayed 1 day", sequence: 1 },
  { id: "s3-3", order_id: "po-03", stage_key: "cutting", stage_name_en: "Cutting", stage_name_ar: "التقطيع", status: "in_progress", started_at: daysAgo(13), finished_at: null, planned_duration_hours: 20, actual_duration_hours: null, completed_qty: 0, remaining_qty: 1, rejected_qty: 0, rework_qty: 0, assigned_team: "Cutting Team", assigned_operator: "Ahmad Khalil", notes: "Curved panels — CNC routing required", sequence: 2 },

  // PO-04: Villa Al-Rashidi TV Unit
  { id: "s4-1", order_id: "po-04", stage_key: "order_created", stage_name_en: "Order Created", stage_name_ar: "إنشاء الأمر", status: "completed", started_at: daysAgo(5), finished_at: daysAgo(5), planned_duration_hours: 1, actual_duration_hours: 0.5, completed_qty: 1, remaining_qty: 0, rejected_qty: 0, rework_qty: 0, assigned_team: "Operations", assigned_operator: "System", notes: "", sequence: 0 },
  { id: "s4-2", order_id: "po-04", stage_key: "materials_reserved", stage_name_en: "Materials Reserved", stage_name_ar: "تحديد المواد", status: "waiting", started_at: null, finished_at: null, planned_duration_hours: 4, actual_duration_hours: null, completed_qty: 0, remaining_qty: 1, rejected_qty: 0, rework_qty: 0, assigned_team: "Warehouse", assigned_operator: "", notes: "Waiting for design approval — classic profile moulding needed", sequence: 1 },

  // PO-05: Residential Kitchen — Al-Hamra Villa (COMPLETED)
  { id: "s5-1", order_id: "po-05", stage_key: "order_created", stage_name_en: "Order Created", stage_name_ar: "إنشاء الأمر", status: "completed", started_at: daysAgo(60), finished_at: daysAgo(60), planned_duration_hours: 1, actual_duration_hours: 0.5, completed_qty: 1, remaining_qty: 0, rejected_qty: 0, rework_qty: 0, assigned_team: "Operations", assigned_operator: "System", notes: "", sequence: 0 },
  { id: "s5-2", order_id: "po-05", stage_key: "materials_reserved", stage_name_en: "Materials Reserved", stage_name_ar: "تحديد المواد", status: "completed", started_at: daysAgo(60), finished_at: daysAgo(58), planned_duration_hours: 8, actual_duration_hours: 6, completed_qty: 1, remaining_qty: 0, rejected_qty: 0, rework_qty: 0, assigned_team: "Warehouse", assigned_operator: "Tariq Hassan", notes: "", sequence: 1 },
  { id: "s5-3", order_id: "po-05", stage_key: "cutting", stage_name_en: "Cutting", stage_name_ar: "التقطيع", status: "completed", started_at: daysAgo(58), finished_at: daysAgo(55), planned_duration_hours: 24, actual_duration_hours: 22, completed_qty: 1, remaining_qty: 0, rejected_qty: 0, rework_qty: 0, assigned_team: "Cutting Team", assigned_operator: "Ahmad Khalil", notes: "", sequence: 2 },
  { id: "s5-4", order_id: "po-05", stage_key: "edgebanding", stage_name_en: "Edgebanding", stage_name_ar: "الكنار", status: "completed", started_at: daysAgo(55), finished_at: daysAgo(52), planned_duration_hours: 16, actual_duration_hours: 14, completed_qty: 1, remaining_qty: 0, rejected_qty: 0, rework_qty: 0, assigned_team: "Edgebanding", assigned_operator: "Salman Rizq", notes: "", sequence: 3 },
  { id: "s5-5", order_id: "po-05", stage_key: "drilling", stage_name_en: "Drilling / CNC", stage_name_ar: "التخريم / CNC", status: "completed", started_at: daysAgo(52), finished_at: daysAgo(50), planned_duration_hours: 12, actual_duration_hours: 10, completed_qty: 1, remaining_qty: 0, rejected_qty: 0, rework_qty: 0, assigned_team: "CNC Team", assigned_operator: "Youssef Ali", notes: "", sequence: 4 },
  { id: "s5-6", order_id: "po-05", stage_key: "assembly", stage_name_en: "Assembly", stage_name_ar: "التجميع", status: "completed", started_at: daysAgo(50), finished_at: daysAgo(45), planned_duration_hours: 36, actual_duration_hours: 34, completed_qty: 1, remaining_qty: 0, rejected_qty: 0, rework_qty: 0, assigned_team: "Assembly A", assigned_operator: "Rami Saad", notes: "", sequence: 5 },
  { id: "s5-7", order_id: "po-05", stage_key: "finishing", stage_name_en: "Finishing / Painting", stage_name_ar: "التشطيب / الدهان", status: "completed", started_at: daysAgo(45), finished_at: daysAgo(40), planned_duration_hours: 20, actual_duration_hours: 18, completed_qty: 1, remaining_qty: 0, rejected_qty: 0, rework_qty: 0, assigned_team: "Finishing", assigned_operator: "Khaled Mansour", notes: "", sequence: 6 },
  { id: "s5-8", order_id: "po-05", stage_key: "quality_control", stage_name_en: "Quality Control", stage_name_ar: "مراقبة الجودة", status: "completed", started_at: daysAgo(40), finished_at: daysAgo(38), planned_duration_hours: 8, actual_duration_hours: 6, completed_qty: 1, remaining_qty: 0, rejected_qty: 0, rework_qty: 0, assigned_team: "QC Team", assigned_operator: "Layla Qasim", notes: "", sequence: 7 },
  { id: "s5-9", order_id: "po-05", stage_key: "packaging", stage_name_en: "Packaging", stage_name_ar: "التغليف", status: "completed", started_at: daysAgo(38), finished_at: daysAgo(36), planned_duration_hours: 8, actual_duration_hours: 6, completed_qty: 1, remaining_qty: 0, rejected_qty: 0, rework_qty: 0, assigned_team: "Packing", assigned_operator: "Omar Hassan", notes: "22 packages ready", sequence: 8 },
  { id: "s5-10", order_id: "po-05", stage_key: "ready_dispatch", stage_name_en: "Ready for Dispatch", stage_name_ar: "جاهز للتسليم", status: "completed", started_at: daysAgo(36), finished_at: daysAgo(36), planned_duration_hours: 1, actual_duration_hours: 0.5, completed_qty: 1, remaining_qty: 0, rejected_qty: 0, rework_qty: 0, assigned_team: "Logistics", assigned_operator: "Khaled Mansour", notes: "", sequence: 9 },
];

const DEMO_ORDERS: ProductionOrder[] = [
  {
    id: "po-01", order_number: "PO-2026-001", product_name: "Meridian Kitchen — Modern Handleless", product_sku: "KIT-MHD-001",
    sales_order_ref: "SO-2026-089", customer_name: "Meridian Trading", priority: "high", status: "in_progress",
    current_stage: "packaging", current_stage_en: "Packaging", current_stage_ar: "التغليف",
    planned_qty: 1, completed_qty: 0, remaining_qty: 1, rejected_qty: 0, rework_qty: 0, waste_qty: 0,
    passed_qty: 1, progress_pct: 85, production_rate_per_hour: 0.12, production_rate_per_day: 1,
    efficiency_pct: 87, planned_rate_per_hour: 0.14, start_date: daysAgo(30), due_date: daysFromNow(5),
    estimated_completion: daysFromNow(4), is_delayed: false, delay_days: 0, delay_reason: "",
    assigned_team: "Assembly A", assigned_lead: "Rami Saad", workstation: "Station A",
    material_status: "available", qc_status: "passed", estimated_cost: 45000, actual_cost: 42800,
    material_cost: 28000, labor_cost: 14800, notes: "Push-to-open system — verify Blum tip-on compatibility",
    created_at: tsAgo(30), updated_at: tsAgo(2),
    stages: DEMO_STAGES.filter(s => s.order_id === "po-01"),
    materials: [
      { id: "mat1-1", name: "White MDF 18mm", required_qty: 18, reserved_qty: 18, used_qty: 18, remaining_qty: 0, unit: "sheets", status: "available", supplier: "MDF Egypt", warehouse_location: "A-12" },
      { id: "mat1-2", name: "Edgeband 1mm White", required_qty: 30, reserved_qty: 30, used_qty: 28, remaining_qty: 2, unit: "meters", status: "available", supplier: "Rehau", warehouse_location: "B-03" },
      { id: "mat1-3", name: "Edgeband 2mm Grey", required_qty: 15, reserved_qty: 15, used_qty: 14, remaining_qty: 1, unit: "meters", status: "available", supplier: "Rehau", warehouse_location: "B-03" },
      { id: "mat1-4", name: "Blum Tip-On Hardware", required_qty: 28, reserved_qty: 28, used_qty: 28, remaining_qty: 0, unit: "sets", status: "available", supplier: "Blum", warehouse_location: "C-07" },
      { id: "mat1-5", name: "Hinges 110°", required_qty: 28, reserved_qty: 28, used_qty: 28, remaining_qty: 0, unit: "pcs", status: "available", supplier: "Blum", warehouse_location: "C-07" },
      { id: "mat1-6", name: "Drawer Slides 500mm", required_qty: 12, reserved_qty: 12, used_qty: 12, remaining_qty: 0, unit: "pairs", status: "available", supplier: "Blum", warehouse_location: "C-07" },
    ],
    qc_checks: [
      { id: "qc1-1", stage: "quality_control", inspector: "Layla Qasim", status: "passed", passed_qty: 1, failed_qty: 0, defect_type: "", defect_pct: 0, notes: "All panels within spec — minor edge chip on piece #7 acceptable", checked_at: tsAgo(10) },
    ],
    activity_log: [
      { id: "al1-1", action: "created", description_en: "Production order PO-2026-001 created for Meridian Kitchen", description_ar: "تم إنشاء أمر التشغيل PO-2026-001 لمطبخ ميريديان", user: "System", timestamp: tsAgo(30), type: "status_change" },
      { id: "al1-2", action: "materials_reserved", description_en: "All materials reserved — 18 MDF sheets, edgeband, Blum hardware", description_ar: "تم حجز جميع المواد — 18 لوح MDF، كنار، يورونات Blum", user: "Tariq Hassan", timestamp: tsAgo(28), type: "material" },
      { id: "al1-3", action: "stage_completed", description_en: "Cutting completed — 50 panels cut on CNC", description_ar: "اكتمل التقطيع — 50 لوحة تم قطعها على CNC", user: "Ahmad Khalil", timestamp: tsAgo(25), type: "stage_change" },
      { id: "al1-4", action: "stage_completed", description_en: "Edgebanding completed — all panels banded", description_ar: "اكتمل الكنار — جميع الألواح بالكبار", user: "Salman Rizq", timestamp: tsAgo(22), type: "stage_change" },
      { id: "al1-5", action: "stage_completed", description_en: "Drilling completed — push-to-open pattern applied", description_ar: "اكتمل التخريم — نمط فتح بالضغط تم تطبيقه", user: "Youssef Ali", timestamp: tsAgo(20), type: "stage_change" },
      { id: "al1-6", action: "stage_completed", description_en: "Assembly completed — Blum tip-on hardware installed", description_ar: "اكتمل التجميع — يورونات Blum تم تركيبها", user: "Rami Saad", timestamp: tsAgo(16), type: "stage_change" },
      { id: "al1-7", action: "stage_completed", description_en: "Finishing completed — 2 coats lacquer applied", description_ar: "اكتمل التشطيب — طبقتين لتر تم تطبيقهما", user: "Khaled Mansour", timestamp: tsAgo(12), type: "stage_change" },
      { id: "al1-8", action: "qc_check", description_en: "QC passed — all panels within spec", description_ar: "اجتاز فحص الجودة — جميع الألواح ضمن المواصفات", user: "Layla Qasim", timestamp: tsAgo(10), type: "qc" },
    ],
  },
  {
    id: "po-02", order_number: "PO-2026-002", product_name: "Meridian Master Wardrobe", product_sku: "WRD-MST-003",
    sales_order_ref: "SO-2026-090", customer_name: "Meridian Trading", priority: "medium", status: "in_progress",
    current_stage: "assembly", current_stage_en: "Assembly", current_stage_ar: "التجميع",
    planned_qty: 1, completed_qty: 0, remaining_qty: 1, rejected_qty: 0, rework_qty: 0, waste_qty: 0,
    passed_qty: 0, progress_pct: 55, production_rate_per_hour: 0.1, production_rate_per_day: 0.8,
    efficiency_pct: 82, planned_rate_per_hour: 0.12, start_date: daysAgo(28), due_date: daysFromNow(8),
    estimated_completion: daysFromNow(10), is_delayed: false, delay_days: 0, delay_reason: "",
    assigned_team: "Assembly B", assigned_lead: "Rami Saad", workstation: "Station B",
    material_status: "partial", qc_status: "pending", estimated_cost: 38000, actual_cost: 22000,
    material_cost: 15000, labor_cost: 7000, notes: "Sliding door tracks from supplier — confirm delivery",
    created_at: tsAgo(28), updated_at: tsAgo(3),
    stages: DEMO_STAGES.filter(s => s.order_id === "po-02"),
    materials: [
      { id: "mat2-1", name: "White MDF 18mm", required_qty: 12, reserved_qty: 12, used_qty: 12, remaining_qty: 0, unit: "sheets", status: "available", supplier: "MDF Egypt", warehouse_location: "A-12" },
      { id: "mat2-2", name: "Edgeband 1mm White", required_qty: 20, reserved_qty: 20, used_qty: 20, remaining_qty: 0, unit: "meters", status: "available", supplier: "Rehau", warehouse_location: "B-03" },
      { id: "mat2-3", name: "Sliding Door Track 2400mm", required_qty: 3, reserved_qty: 1, used_qty: 0, remaining_qty: 2, unit: "pcs", status: "partial", supplier: "Hettich", warehouse_location: "C-05" },
      { id: "mat2-4", name: "LED Strip 2m", required_qty: 2, reserved_qty: 2, used_qty: 0, remaining_qty: 2, unit: "pcs", status: "available", supplier: "LED Plus", warehouse_location: "D-02" },
    ],
    qc_checks: [],
    activity_log: [
      { id: "al2-1", action: "created", description_en: "Production order PO-2026-002 created", description_ar: "تم إنشاء أمر التشغيل PO-2026-002", user: "System", timestamp: tsAgo(28), type: "status_change" },
      { id: "al2-2", action: "stage_started", description_en: "Assembly started — waiting for sliding door tracks", description_ar: "بدأ التجميع — في انتظار سكك الأبواب المنزلقة", user: "Rami Saad", timestamp: tsAgo(18), type: "stage_change" },
    ],
  },
  {
    id: "po-03", order_number: "PO-2026-003", product_name: "Al-Noor Reception Counter (Curved)", product_sku: "RCT-ALN-001",
    sales_order_ref: "SO-2026-095", customer_name: "Al-Noor Furniture", priority: "urgent", status: "in_progress",
    current_stage: "cutting", current_stage_en: "Cutting", current_stage_ar: "التقطيع",
    planned_qty: 1, completed_qty: 0, remaining_qty: 1, rejected_qty: 0, rework_qty: 0, waste_qty: 0,
    passed_qty: 0, progress_pct: 15, production_rate_per_hour: 0.05, production_rate_per_day: 0.4,
    efficiency_pct: 75, planned_rate_per_hour: 0.08, start_date: daysAgo(15), due_date: daysFromNow(10),
    estimated_completion: daysFromNow(14), is_delayed: true, delay_days: 3, delay_reason: "Corian top from external supplier delayed 2 days",
    assigned_team: "Cutting Team", assigned_lead: "Ahmad Khalil", workstation: "Station A",
    material_status: "partial", qc_status: "pending", estimated_cost: 62000, actual_cost: 12000,
    material_cost: 12000, labor_cost: 0, notes: "Curved panels — CNC routing required. Corian top from external supplier.",
    created_at: tsAgo(15), updated_at: tsAgo(1),
    stages: DEMO_STAGES.filter(s => s.order_id === "po-03"),
    materials: [
      { id: "mat3-1", name: "Walnut Veneer MDF 18mm", required_qty: 8, reserved_qty: 8, used_qty: 0, remaining_qty: 8, unit: "sheets", status: "available", supplier: "VeneerCo", warehouse_location: "A-05" },
      { id: "mat3-2", name: "Corian Glacier White 12mm", required_qty: 4, reserved_qty: 2, used_qty: 0, remaining_qty: 2, unit: "sqm", status: "partial", supplier: "Corian Egypt", warehouse_location: "" },
      { id: "mat3-3", name: "Edgeband Walnut 1mm", required_qty: 10, reserved_qty: 10, used_qty: 0, remaining_qty: 10, unit: "meters", status: "available", supplier: "Rehau", warehouse_location: "B-03" },
    ],
    qc_checks: [],
    activity_log: [
      { id: "al3-1", action: "created", description_en: "Production order PO-2026-003 created — URGENT", description_ar: "تم إنشاء أمر التشغيل PO-2026-003 — عاجل", user: "System", timestamp: tsAgo(15), type: "status_change" },
      { id: "al3-2", action: "delay_detected", description_en: "Corian top delivery delayed 2 days from supplier", description_ar: "تأخر تسليم تاج الكوريان من المورد بيومين", user: "System", timestamp: tsAgo(5), type: "delay" },
      { id: "al3-3", action: "stage_started", description_en: "Cutting started — curved CNC routing in progress", description_ar: "بدأ التقطيع — تقطيع منحني CNC جارٍ", user: "Ahmad Khalil", timestamp: tsAgo(3), type: "stage_change" },
    ],
  },
  {
    id: "po-04", order_number: "PO-2026-004", product_name: "Villa Al-Rashidi TV Unit", product_sku: "TVU-ALR-001",
    sales_order_ref: "SO-2026-100", customer_name: "Mohammed Al-Rashidi", priority: "low", status: "planned",
    current_stage: "materials_reserved", current_stage_en: "Materials Reserved", current_stage_ar: "تحديد المواد",
    planned_qty: 1, completed_qty: 0, remaining_qty: 1, rejected_qty: 0, rework_qty: 0, waste_qty: 0,
    passed_qty: 0, progress_pct: 0, production_rate_per_hour: 0, production_rate_per_day: 0,
    efficiency_pct: 0, planned_rate_per_hour: 0.1, start_date: daysFromNow(3), due_date: daysFromNow(20),
    estimated_completion: daysFromNow(20), is_delayed: false, delay_days: 0, delay_reason: "",
    assigned_team: "", assigned_lead: "", workstation: "",
    material_status: "shortage", qc_status: "pending", estimated_cost: 18000, actual_cost: 0,
    material_cost: 0, labor_cost: 0, notes: "Waiting for design approval. Classic profile moulding needed.",
    created_at: tsAgo(5), updated_at: tsAgo(5),
    stages: DEMO_STAGES.filter(s => s.order_id === "po-04"),
    materials: [
      { id: "mat4-1", name: "Walnut MDF 18mm", required_qty: 6, reserved_qty: 0, used_qty: 0, remaining_qty: 6, unit: "sheets", status: "shortage", supplier: "MDF Egypt", warehouse_location: "" },
      { id: "mat4-2", name: "Classic Profile Moulding", required_qty: 8, reserved_qty: 0, used_qty: 0, remaining_qty: 8, unit: "meters", status: "shortage", supplier: "MouldingCo", warehouse_location: "" },
    ],
    qc_checks: [],
    activity_log: [
      { id: "al4-1", action: "created", description_en: "Production order PO-2026-004 created — waiting for design", description_ar: "تم إنشاء أمر التشغيل PO-2026-004 — في انتظار التصميم", user: "System", timestamp: tsAgo(5), type: "status_change" },
    ],
  },
  {
    id: "po-05", order_number: "PO-2025-098", product_name: "Residential Kitchen — Al-Hamra Villa", product_sku: "KIT-AHV-012",
    sales_order_ref: "SO-2025-142", customer_name: "Faisal Al-Hamra", priority: "high", status: "completed",
    current_stage: "ready_dispatch", current_stage_en: "Ready for Dispatch", current_stage_ar: "جاهز للتسليم",
    planned_qty: 1, completed_qty: 1, remaining_qty: 0, rejected_qty: 0, rework_qty: 0, waste_qty: 0,
    passed_qty: 1, progress_pct: 100, production_rate_per_hour: 0.15, production_rate_per_day: 1.2,
    efficiency_pct: 92, planned_rate_per_hour: 0.14, start_date: daysAgo(60), due_date: daysAgo(10),
    estimated_completion: daysAgo(8), is_delayed: false, delay_days: 0, delay_reason: "",
    assigned_team: "Assembly A", assigned_lead: "Rami Saad", workstation: "Station A",
    material_status: "available", qc_status: "passed", estimated_cost: 52000, actual_cost: 48000,
    material_cost: 32000, labor_cost: 16000, notes: "Complete — awaiting delivery scheduling",
    created_at: tsAgo(60), updated_at: tsAgo(8),
    stages: DEMO_STAGES.filter(s => s.order_id === "po-05"),
    materials: [
      { id: "mat5-1", name: "White MDF 18mm", required_qty: 22, reserved_qty: 22, used_qty: 22, remaining_qty: 0, unit: "sheets", status: "available", supplier: "MDF Egypt", warehouse_location: "A-12" },
      { id: "mat5-2", name: "Edgeband 1mm White", required_qty: 35, reserved_qty: 35, used_qty: 34, remaining_qty: 1, unit: "meters", status: "available", supplier: "Rehau", warehouse_location: "B-03" },
      { id: "mat5-3", name: "Edgeband 2mm White", required_qty: 20, reserved_qty: 20, used_qty: 19, remaining_qty: 1, unit: "meters", status: "available", supplier: "Rehau", warehouse_location: "B-03" },
      { id: "mat5-4", name: "Hinges 110° Soft-Close", required_qty: 36, reserved_qty: 36, used_qty: 36, remaining_qty: 0, unit: "pcs", status: "available", supplier: "Blum", warehouse_location: "C-07" },
      { id: "mat5-5", name: "Drawer Slides 600mm", required_qty: 16, reserved_qty: 16, used_qty: 16, remaining_qty: 0, unit: "pairs", status: "available", supplier: "Blum", warehouse_location: "C-07" },
    ],
    qc_checks: [
      { id: "qc5-1", stage: "quality_control", inspector: "Layla Qasim", status: "passed", passed_qty: 1, failed_qty: 0, defect_type: "", defect_pct: 0, notes: "Excellent quality — all panels and hardware verified", checked_at: tsAgo(38) },
    ],
    activity_log: [
      { id: "al5-1", action: "completed", description_en: "Production completed — kitchen ready for delivery", description_ar: "اكتمل الإنتاج — المطبخ جاهز للتسليم", user: "Rami Saad", timestamp: tsAgo(8), type: "completion" },
    ],
  },
];

const DEMO_ALERTS: ProductionAlert[] = [
  { id: "alert-1", order_id: "po-03", order_number: "PO-2026-003", type: "deadline_risk", severity: "warning", message_en: "Corian top delayed — may impact curved counter delivery", message_ar: "تأخر تاج الكوريان — قد يؤثر على تسليم العداد المنحني", created_at: tsAgo(1), dismissed: false },
  { id: "alert-2", order_id: "po-02", order_number: "PO-2026-002", type: "material_shortage", severity: "warning", message_en: "Sliding door tracks — only 1 of 3 delivered, 2 pending", message_ar: "سكك الأبواب المنزلقة — تم تسليم 1 من 3، 2 معلقة", created_at: tsAgo(5), dismissed: false },
  { id: "alert-3", order_id: "po-04", order_number: "PO-2026-004", type: "material_shortage", severity: "info", message_en: "Design approval pending — cannot reserve materials", message_ar: "موافقة التصميم معلقة — لا يمكن حجز المواد", created_at: tsAgo(5), dismissed: false },
  { id: "alert-4", order_id: "po-03", order_number: "PO-2026-003", type: "stage_stuck", severity: "warning", message_en: "Cutting stage taking longer than planned — CNC routing complexity", message_ar: "مرحلة التقطيع تستغرق وقتاً أطول — تعقيد التقطيع CNC", created_at: tsAgo(2), dismissed: false },
];

const DEMO_WORKSTATIONS: WorkstationInfo[] = [
  { id: "ws-1", name: "Station A — CNC Cutting", status: "active", current_order: "po-03", operator: "Ahmad Khalil", capacity: 85, queue_count: 1, last_maintenance: daysAgo(10) },
  { id: "ws-2", name: "Station B — CNC Cutting", status: "idle", current_order: null, operator: "", capacity: 100, queue_count: 0, last_maintenance: daysAgo(8) },
  { id: "ws-3", name: "Edgebanding Station", status: "active", current_order: null, operator: "Salman Rizq", capacity: 90, queue_count: 0, last_maintenance: daysAgo(12) },
  { id: "ws-4", name: "CNC Drilling", status: "active", current_order: null, operator: "Youssef Ali", capacity: 95, queue_count: 0, last_maintenance: daysAgo(7) },
  { id: "ws-5", name: "Assembly Bay A", status: "active", current_order: "po-01", operator: "Rami Saad", capacity: 80, queue_count: 0, last_maintenance: daysAgo(15) },
  { id: "ws-6", name: "Assembly Bay B", status: "active", current_order: "po-02", operator: "Rami Saad", capacity: 70, queue_count: 1, last_maintenance: daysAgo(15) },
  { id: "ws-7", name: "Paint / Lacquer Booth", status: "active", current_order: null, operator: "Khaled Mansour", capacity: 88, queue_count: 0, last_maintenance: daysAgo(5) },
  { id: "ws-8", name: "QC Station", status: "active", current_order: null, operator: "Layla Qasim", capacity: 100, queue_count: 0, last_maintenance: daysAgo(7) },
  { id: "ws-9", name: "Packing Bay", status: "maintenance", current_order: null, operator: "", capacity: 0, queue_count: 1, last_maintenance: daysAgo(30) },
];

// ─── In-memory store (demo mode) ──────────────────────────

let _orders = [...DEMO_ORDERS];
let _alerts = [...DEMO_ALERTS];
let _workstations = [...DEMO_WORKSTATIONS];

// ─── Public API ───────────────────────────────────────────

export function getProductionOrders(): ProductionOrder[] {
  return _orders;
}

export function getProductionOrder(id: string): ProductionOrder | undefined {
  return _orders.find(o => o.id === id);
}

export function getProductionAlerts(): ProductionAlert[] {
  return _alerts.filter(a => !a.dismissed);
}

export function getWorkstations(): WorkstationInfo[] {
  return _workstations;
}

export function dismissAlert(id: string) {
  _alerts = _alerts.map(a => a.id === id ? { ...a, dismissed: true } : a);
}

// ─── Computed Stats ───────────────────────────────────────

export function getProductionStats() {
  const orders = _orders;
  const active = orders.filter(o => o.status === "in_progress");
  const planned = orders.filter(o => o.status === "planned");
  const delayed = orders.filter(o => o.status === "delayed" || o.is_delayed);
  const completedToday = orders.filter(o => o.status === "completed" && o.updated_at >= new Date(new Date().toDateString()).toISOString());
  const waitingMaterials = orders.filter(o => o.material_status === "shortage" || o.material_status === "partial");
  const waitingQC = orders.filter(o => o.qc_status === "pending" && o.completed_qty > 0);
  const needsRework = orders.filter(o => o.rework_qty > 0);

  const totalCompleted = orders.reduce((s, o) => s + o.completed_qty, 0);
  const totalPlanned = orders.reduce((s, o) => s + o.planned_qty, 0);
  const avgRate = active.length > 0 ? Math.round(active.reduce((s, o) => s + o.production_rate_per_hour, 0) / active.length * 100) / 100 : 0;
  const avgEfficiency = active.length > 0 ? Math.round(active.reduce((s, o) => s + o.efficiency_pct, 0) / active.length) : 0;

  return {
    totalOrders: orders.length,
    activeOrders: active.length,
    plannedOrders: planned.length,
    delayedOrders: delayed.length,
    completedOrders: orders.filter(o => o.status === "completed").length,
    completedToday: completedToday.length,
    waitingMaterials: waitingMaterials.length,
    waitingQC: waitingQC.length,
    needsRework: needsRework.length,
    totalPlannedQty: totalPlanned,
    totalCompletedQty: totalCompleted,
    totalRemainingQty: totalPlanned - totalCompleted,
    avgProductionRate: avgRate,
    avgEfficiency,
    dailyOutput: orders.reduce((s, o) => s + o.production_rate_per_day, 0),
    onTimeRate: totalPlanned > 0 ? Math.round(((totalPlanned - delayed.reduce((s, o) => s + o.planned_qty, 0)) / totalPlanned) * 100) : 100,
  };
}

// ─── AI Insights ──────────────────────────────────────────

export interface AIInsight {
  id: string;
  type: "summary" | "bottleneck" | "prediction" | "recommendation" | "risk";
  title_en: string;
  title_ar: string;
  detail_en: string;
  detail_ar: string;
  severity: "info" | "warning" | "critical";
}

export function getAIInsights(): AIInsight[] {
  const stats = getProductionStats();
  const delayedOrders = _orders.filter(o => o.is_delayed);
  const shortageOrders = _orders.filter(o => o.material_status === "shortage");

  return [
    {
      id: "ai-1", type: "summary",
      title_en: "Production Summary", title_ar: "ملخص الإنتاج",
      detail_en: `${stats.activeOrders} orders in progress, ${stats.avgEfficiency}% avg efficiency. ${stats.delayedOrders} orders delayed, ${stats.waitingMaterials} waiting for materials.`,
      detail_ar: `${stats.activeOrders} أوامر قيد التنفيذ، متوسط الكفاءة ${stats.avgEfficiency}%. ${stats.delayedOrders} أوامر متأخرة، ${stats.waitingMaterials} في انتظار المواد.`,
      severity: stats.delayedOrders > 0 ? "warning" : "info",
    },
    {
      id: "ai-2", type: "bottleneck",
      title_en: "Bottleneck: Assembly Stage", title_ar: "عائق: مرحلة التجميع",
      detail_en: "Assembly is the slowest stage across active orders. PO-2026-002 is waiting for sliding door tracks — consider expediting with supplier Hettich.",
      detail_ar: "التجميع هي أبطأ مرحلة في الأوامر النشطة. PO-2026-002 في انتظار سكك الأبواب المنزلقة — فكّر في تسريع التسليم من المورد Hettich.",
      severity: "warning",
    },
    {
      id: "ai-3", type: "prediction",
      title_en: "PO-2026-003: Curved Counter Risk", title_ar: "PO-2026-003: خطر العداد المنحني",
      detail_en: "CNC curved routing is taking 40% longer than planned. Based on current rate, completion estimated 4 days late. Consider assigning second CNC operator.",
      detail_ar: "التقطيع المنحني على CNC يستغرق 40% أكثر من المخطط. بناءً على المعدل الحالي، الإكمال متوقع بتأخير 4 أيام. فكّر في تعيين مشغل CNC ثاني.",
      severity: "warning",
    },
    {
      id: "ai-4", type: "recommendation",
      title_en: "Expedite Sliding Door Tracks", title_ar: "تسريع سكك الأبواب المنزلقة",
      detail_en: "PO-2026-002 assembly is blocked. Only 1 of 3 sliding door tracks delivered from Hettich. Contact supplier for urgent delivery.",
      detail_ar: "تم حظر تجميع PO-2026-002. تم تسليم 1 من 3 سكك من Hettich. اتصل بالمورد للتسليم العاجل.",
      severity: "critical",
    },
    {
      id: "ai-5", type: "recommendation",
      title_en: "Packing Bay Maintenance Overdue", title_ar: "صيانة خليج التغليف متأخرة",
      detail_en: "Packing Bay last maintenance was 30 days ago (recommended: every 14 days). Schedule maintenance to prevent downtime during peak production.",
      detail_ar: "آخر صيانة لخليج التغليف قبل 30 يوماً (الموصى: كل 14 يوماً). جدول الصيانة لمنع التوقف أثناء الذروة.",
      severity: "warning",
    },
  ];
}
