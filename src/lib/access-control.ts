/**
 * Access Control & Release Flow Engine
 *
 * التحكم في الوصول ومسار الاعتماد
 */

// ─── Role Definitions ─────────────────────────────────────

export type Role = "owner" | "admin" | "manager" | "finance" | "sales" | "production" | "warehouse" | "viewer";

export interface RoleDef {
  value: Role;
  en: string;
  ar: string;
  color: string;
  modules: string[];
  canApprove: boolean;
  canCreate: boolean;
  canDelete: boolean;
}

export const ROLES: RoleDef[] = [
  { value: "owner", en: "Owner", ar: "مالك", color: "bg-amber-100 text-amber-700", modules: ["*"], canApprove: true, canCreate: true, canDelete: true },
  { value: "admin", en: "Admin", ar: "مسؤول النظام", color: "bg-violet-100 text-violet-700", modules: ["*"], canApprove: true, canCreate: true, canDelete: true },
  { value: "manager", en: "Manager", ar: "مدير", color: "bg-blue-100 text-blue-700", modules: ["*"], canApprove: true, canCreate: true, canDelete: false },
  { value: "finance", en: "Finance", ar: "الحسابات", color: "bg-emerald-100 text-emerald-700", modules: ["finance", "invoices", "payments", "expenses", "reports", "customers"], canApprove: true, canCreate: true, canDelete: false },
  { value: "sales", en: "Sales", ar: "المبيعات", color: "bg-cyan-100 text-cyan-700", modules: ["customers", "quotations", "orders", "products", "site-visits", "designs"], canApprove: false, canCreate: true, canDelete: false },
  { value: "production", en: "Production", ar: "التصنيع", color: "bg-orange-100 text-orange-700", modules: ["production", "quality", "products", "inventory", "orders"], canApprove: false, canCreate: true, canDelete: false },
  { value: "warehouse", en: "Warehouse", ar: "المخزن", color: "bg-teal-100 text-teal-700", modules: ["inventory", "purchasing", "products", "production"], canApprove: false, canCreate: true, canDelete: false },
  { value: "viewer", en: "Viewer", ar: "مشاهد فقط", color: "bg-slate-100 text-slate-600", modules: ["*"], canApprove: false, canCreate: false, canDelete: false },
];

export const DEPARTMENTS = [
  { value: "management", en: "Management", ar: "الإدارة" },
  { value: "sales", en: "Sales", ar: "المبيعات" },
  { value: "finance", en: "Finance & Accounting", ar: "الحسابات" },
  { value: "production", en: "Production", ar: "التصنيع" },
  { value: "warehouse", en: "Warehouse", ar: "المخزن" },
  { value: "purchasing", en: "Purchasing", ar: "المشتريات" },
  { value: "design", en: "Design", ar: "التصميم" },
  { value: "delivery", en: "Delivery & Installation", ar: "التوصيل والتركيب" },
  { value: "quality", en: "Quality Control", ar: "الجودة" },
  { value: "hr", en: "HR", ar: "الموارد البشرية" },
];

export function hasModuleAccess(role: Role, module: string): boolean {
  const def = ROLES.find(r => r.value === role);
  if (!def) return false;
  if (def.modules.includes("*")) return true;
  return def.modules.includes(module);
}

export function canPerformAction(role: Role, action: "create" | "approve" | "delete"): boolean {
  const def = ROLES.find(r => r.value === role);
  if (!def) return false;
  if (action === "create") return def.canCreate;
  if (action === "approve") return def.canApprove;
  if (action === "delete") return def.canDelete;
  return false;
}

// ─── Release Flow ─────────────────────────────────────────

export type ReleaseStatus = "draft" | "waiting_approval" | "released" | "blocked" | "rejected";

export interface ReleaseStep {
  key: string;
  role: Role;
  en: string;
  ar: string;
  required: boolean;
}

export interface ReleaseAction {
  role: Role;
  user_id?: string;
  user_name?: string;
  action: "approved" | "rejected" | "blocked";
  timestamp: string;
  note?: string;
}

// Sales Order release steps
export const SO_RELEASE_STEPS: ReleaseStep[] = [
  { key: "sales_confirm", role: "sales", en: "Sales confirms customer & order", ar: "المبيعات تأكد العميل والطلب", required: true },
  { key: "finance_deposit", role: "finance", en: "Finance verifies deposit/payment", ar: "الحسابات تأكد العربون/الدفع", required: true },
  { key: "production_bom", role: "production", en: "Production confirms BOM & stages", ar: "التصنيع يأكد الخامات والمراحل", required: true },
  { key: "warehouse_materials", role: "warehouse", en: "Warehouse confirms materials available", ar: "المخزن يأكد الخامات متوفرة", required: true },
  { key: "manager_final", role: "manager", en: "Manager final approval", ar: "موافقة المدير النهائية", required: false },
];

// Production Order release steps
export const PRODUCTION_RELEASE_STEPS: ReleaseStep[] = [
  { key: "customer_exists", role: "sales", en: "Customer confirmed", ar: "العميل مؤكد", required: true },
  { key: "product_bom", role: "production", en: "BOM exists", ar: "قائمة الخامات موجودة", required: true },
  { key: "stages_defined", role: "production", en: "Manufacturing stages defined", ar: "مراحل التصنيع محددة", required: true },
  { key: "materials_ready", role: "warehouse", en: "Materials available/ordered", ar: "الخامات متوفرة أو تم طلبها", required: true },
  { key: "finance_approved", role: "finance", en: "Finance deposit verified", ar: "العربون تم التأكد منه", required: true },
  { key: "design_approved", role: "manager", en: "Design/measurements approved", ar: "التصميم/المقاسات معتمدة", required: false },
];

// Purchase Order release steps
export const PO_RELEASE_STEPS: ReleaseStep[] = [
  { key: "request_created", role: "warehouse", en: "Purchase request created", ar: "طلب الشراء تم إنشاؤه", required: true },
  { key: "manager_approve", role: "manager", en: "Manager approves", ar: "موافقة المدير", required: true },
  { key: "finance_budget", role: "finance", en: "Finance approves budget", ar: "الحسابات توافق على الميزانية", required: true },
  { key: "purchasing_send", role: "warehouse", en: "PO sent to supplier", ar: "أمر الشراء أُرسل للمورّد", required: true },
];

export function getReleaseBlockers(steps: ReleaseStep[], history: ReleaseAction[]): { step: ReleaseStep; met: boolean }[] {
  return steps.map(step => ({
    step,
    met: history.some(h => h.action === "approved" && h.role === step.role),
  }));
}

export function isFullyReleased(steps: ReleaseStep[], history: ReleaseAction[]): boolean {
  return steps.filter(s => s.required).every(s => history.some(h => h.action === "approved" && h.role === s.role));
}

export const RELEASE_STATUS_LABELS: Record<ReleaseStatus, { en: string; ar: string; color: string }> = {
  draft: { en: "Draft", ar: "مسودة", color: "bg-slate-100 text-slate-600" },
  waiting_approval: { en: "Waiting Approval", ar: "في انتظار الاعتماد", color: "bg-amber-100 text-amber-700" },
  released: { en: "Released", ar: "معتمد", color: "bg-emerald-100 text-emerald-700" },
  blocked: { en: "Blocked", ar: "واقف", color: "bg-rose-100 text-rose-700" },
  rejected: { en: "Rejected", ar: "مرفوض", color: "bg-red-100 text-red-700" },
};

// ─── Required Workflow Enforcement ───────────────────────
// SO cannot be released without passing all checks

export interface WorkflowCheck {
  key: string;
  en: string;
  ar: string;
  passed: boolean;
  severity: "required" | "warning";
}

/**
 * Check if a Sales Order meets all requirements for release.
 * Pass the SO metadata and related data to get a list of checks.
 */
export function getSOWorkflowChecks(so: {
  metadata?: Record<string, unknown>;
  customer_id?: string | null;
  has_products?: boolean;
  has_bom?: boolean;
  has_stages?: boolean;
  stock_available?: boolean;
  has_finance_approval?: boolean;
  has_design?: boolean;
}): WorkflowCheck[] {
  return [
    {
      key: "customer",
      en: "Customer assigned",
      ar: "تم تحديد العميل",
      passed: !!so.customer_id,
      severity: "required",
    },
    {
      key: "products",
      en: "Products added to order",
      ar: "تمت إضافة المنتجات للطلب",
      passed: !!so.has_products,
      severity: "required",
    },
    {
      key: "bom",
      en: "BOM defined for all products",
      ar: "قائمة الخامات محددة لكل المنتجات",
      passed: !!so.has_bom,
      severity: "required",
    },
    {
      key: "stages",
      en: "Manufacturing stages assigned",
      ar: "مراحل التصنيع محددة",
      passed: !!so.has_stages,
      severity: "required",
    },
    {
      key: "stock",
      en: "Raw materials available in stock",
      ar: "الخامات متوفرة في المخزن",
      passed: !!so.stock_available,
      severity: "warning",
    },
    {
      key: "finance",
      en: "Finance approval / deposit received",
      ar: "موافقة الحسابات / العربون مدفوع",
      passed: !!so.has_finance_approval,
      severity: "required",
    },
    {
      key: "design",
      en: "Design approved by customer",
      ar: "التصميم معتمد من العميل",
      passed: !!so.has_design,
      severity: "warning",
    },
  ];
}

export function canReleaseOrder(checks: WorkflowCheck[]): boolean {
  return checks.filter(c => c.severity === "required").every(c => c.passed);
}
