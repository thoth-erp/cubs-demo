/**
 * Granular Permission System
 * نظام الصلاحيات التفصيلي
 *
 * Each module has specific permission actions.
 * Role templates auto-assign recommended permissions.
 * Custom per-user overrides stored in workspace_members.permissions JSONB.
 */

// ─── Module definitions with granular permissions ─────────

export interface ModuleDef {
  key: string;
  en: string;
  ar: string;
  permissions: PermissionAction[];
}

export type PermissionAction = "view" | "create" | "edit" | "delete" | "export" | "import" | "approve" | "release" | "assign" | "manage_settings";

export const PERMISSION_LABELS: Record<PermissionAction, { en: string; ar: string }> = {
  view:            { en: "View",     ar: "عرض" },
  create:          { en: "Create",   ar: "إنشاء" },
  edit:            { en: "Edit",     ar: "تعديل" },
  delete:          { en: "Delete",   ar: "حذف" },
  export:          { en: "Export",   ar: "تصدير" },
  import:          { en: "Import",   ar: "استيراد" },
  approve:         { en: "Approve",  ar: "اعتماد" },
  release:         { en: "Release",  ar: "إطلاق" },
  assign:          { en: "Assign",   ar: "تعيين" },
  manage_settings: { en: "Settings", ar: "إعدادات" },
};

export const MODULES: ModuleDef[] = [
  { key: "customers",    en: "Customers",             ar: "العملاء",            permissions: ["view", "create", "edit", "delete", "export", "import", "assign"] },
  { key: "contacts",     en: "Contacts",              ar: "جهات الاتصال",       permissions: ["view", "create", "edit", "delete", "export"] },
  { key: "quotations",   en: "Quotations",            ar: "عروض الأسعار",       permissions: ["view", "create", "edit", "delete", "export", "approve"] },
  { key: "orders",       en: "Sales Orders",          ar: "طلبات العملاء",       permissions: ["view", "create", "edit", "delete", "export", "approve", "release"] },
  { key: "products",     en: "Products",              ar: "المنتجات",           permissions: ["view", "create", "edit", "delete", "export", "import"] },
  { key: "bom",          en: "BOM",                   ar: "قائمة المواد",        permissions: ["view", "create", "edit", "delete"] },
  { key: "inventory",    en: "Inventory",             ar: "المخزن",             permissions: ["view", "create", "edit", "delete", "export", "import", "approve"] },
  { key: "purchasing",   en: "Purchasing",            ar: "المشتريات",          permissions: ["view", "create", "edit", "delete", "export", "approve", "release"] },
  { key: "production",   en: "Production",            ar: "الإنتاج",            permissions: ["view", "create", "edit", "delete", "assign", "release"] },
  { key: "stages",       en: "Manufacturing Stages",  ar: "مراحل التصنيع",      permissions: ["view", "create", "edit", "delete", "assign"] },
  { key: "quality",      en: "Quality Control",       ar: "مراقبة الجودة",      permissions: ["view", "create", "edit", "approve"] },
  { key: "delivery",     en: "Delivery & Installation", ar: "التسليم والتركيب", permissions: ["view", "create", "edit", "assign"] },
  { key: "finance",      en: "Finance",               ar: "الحسابات",           permissions: ["view", "create", "edit", "delete", "export", "approve", "release"] },
  { key: "reports",      en: "Reports",               ar: "التقارير",           permissions: ["view", "export"] },
  { key: "analytics",    en: "Analytics",             ar: "التحليلات",          permissions: ["view", "export"] },
  { key: "settings",     en: "Settings",              ar: "الإعدادات",          permissions: ["view", "edit", "manage_settings"] },
  { key: "users",        en: "Users & Access",        ar: "المستخدمين",         permissions: ["view", "create", "edit", "delete", "manage_settings"] },
];

// ─── Permission map type ──────────────────────────────────

export type PermissionMap = Record<string, PermissionAction[]>;

// ─── Role templates ───────────────────────────────────────

export interface RoleTemplate {
  id: string;
  en: string;
  ar: string;
  color: string;
  description: string;
  descriptionAr: string;
  permissions: PermissionMap;
  risk: "low" | "medium" | "high";
}

const ALL_ACTIONS: PermissionAction[] = ["view", "create", "edit", "delete", "export", "import", "approve", "release", "assign", "manage_settings"];
const READ_ONLY: PermissionAction[] = ["view"];
const CRUD: PermissionAction[] = ["view", "create", "edit"];
const CRUD_EXPORT: PermissionAction[] = ["view", "create", "edit", "export"];
const FULL_NO_DELETE: PermissionAction[] = ["view", "create", "edit", "export", "import", "approve", "release", "assign"];

function allModulesWithPerms(perms: PermissionAction[]): PermissionMap {
  const map: PermissionMap = {};
  for (const m of MODULES) {
    map[m.key] = perms.filter(p => m.permissions.includes(p));
  }
  return map;
}

export const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    id: "owner", en: "Owner", ar: "مالك",
    color: "bg-amber-100 text-amber-700",
    description: "Full access to everything", descriptionAr: "صلاحيات كاملة لكل شيء",
    permissions: allModulesWithPerms(ALL_ACTIONS),
    risk: "high",
  },
  {
    id: "admin", en: "Admin", ar: "مسؤول النظام",
    color: "bg-violet-100 text-violet-700",
    description: "Full access, cannot delete workspace", descriptionAr: "صلاحيات كاملة، لا يمكنه حذف المساحة",
    permissions: allModulesWithPerms(ALL_ACTIONS),
    risk: "high",
  },
  {
    id: "sales", en: "Sales", ar: "المبيعات",
    color: "bg-cyan-100 text-cyan-700",
    description: "Customers, quotations, orders", descriptionAr: "العملاء وعروض الأسعار والطلبات",
    permissions: {
      customers: CRUD_EXPORT, contacts: CRUD_EXPORT, quotations: [...CRUD_EXPORT, "approve"],
      orders: CRUD_EXPORT, products: ["view", "export"], bom: READ_ONLY,
      inventory: READ_ONLY, purchasing: READ_ONLY, production: READ_ONLY,
      stages: READ_ONLY, quality: READ_ONLY, delivery: ["view"],
      finance: READ_ONLY, reports: ["view", "export"], analytics: ["view"],
      settings: READ_ONLY, users: READ_ONLY,
    },
    risk: "medium",
  },
  {
    id: "finance", en: "Finance", ar: "الحسابات",
    color: "bg-emerald-100 text-emerald-700",
    description: "Invoices, payments, approvals", descriptionAr: "فواتير ومدفوعات وموافقات",
    permissions: {
      customers: ["view", "export"], contacts: READ_ONLY,
      quotations: ["view", "approve"], orders: ["view", "approve", "export"],
      products: READ_ONLY, bom: READ_ONLY, inventory: ["view", "export"],
      purchasing: ["view", "approve", "export"], production: READ_ONLY,
      stages: READ_ONLY, quality: READ_ONLY, delivery: READ_ONLY,
      finance: [...CRUD_EXPORT, "approve", "release"],
      reports: ["view", "export"], analytics: ["view", "export"],
      settings: READ_ONLY, users: READ_ONLY,
    },
    risk: "medium",
  },
  {
    id: "production_manager", en: "Production Manager", ar: "مدير الإنتاج",
    color: "bg-orange-100 text-orange-700",
    description: "Production, stages, quality", descriptionAr: "الإنتاج والمراحل والجودة",
    permissions: {
      customers: READ_ONLY, contacts: READ_ONLY,
      quotations: READ_ONLY, orders: ["view", "export"],
      products: CRUD_EXPORT, bom: CRUD, inventory: ["view", "export"],
      purchasing: ["view", "create"], production: [...CRUD_EXPORT, "assign", "release"],
      stages: [...CRUD, "assign"], quality: [...CRUD, "approve"],
      delivery: ["view", "assign"], finance: READ_ONLY,
      reports: ["view", "export"], analytics: ["view"],
      settings: READ_ONLY, users: READ_ONLY,
    },
    risk: "medium",
  },
  {
    id: "warehouse", en: "Warehouse", ar: "المخزن",
    color: "bg-teal-100 text-teal-700",
    description: "Inventory, stock, purchasing", descriptionAr: "المخزن والخامات والمشتريات",
    permissions: {
      customers: READ_ONLY, contacts: READ_ONLY,
      quotations: READ_ONLY, orders: READ_ONLY,
      products: ["view"], bom: ["view"],
      inventory: [...CRUD_EXPORT, "import", "approve"],
      purchasing: [...CRUD_EXPORT, "approve"],
      production: READ_ONLY, stages: READ_ONLY,
      quality: READ_ONLY, delivery: ["view"],
      finance: READ_ONLY, reports: ["view", "export"],
      analytics: ["view"], settings: READ_ONLY, users: READ_ONLY,
    },
    risk: "low",
  },
  {
    id: "purchasing", en: "Purchasing", ar: "المشتريات",
    color: "bg-indigo-100 text-indigo-700",
    description: "Purchase orders, suppliers", descriptionAr: "أوامر الشراء والموردين",
    permissions: {
      customers: READ_ONLY, contacts: CRUD,
      quotations: READ_ONLY, orders: READ_ONLY,
      products: READ_ONLY, bom: READ_ONLY,
      inventory: ["view", "export"], purchasing: [...CRUD_EXPORT, "approve"],
      production: READ_ONLY, stages: READ_ONLY,
      quality: READ_ONLY, delivery: READ_ONLY,
      finance: READ_ONLY, reports: ["view", "export"],
      analytics: ["view"], settings: READ_ONLY, users: READ_ONLY,
    },
    risk: "low",
  },
  {
    id: "qc", en: "Quality Control", ar: "مراقبة الجودة",
    color: "bg-green-100 text-green-700",
    description: "Quality checks, inspections", descriptionAr: "فحص الجودة والتفتيش",
    permissions: {
      customers: READ_ONLY, contacts: READ_ONLY,
      quotations: READ_ONLY, orders: READ_ONLY,
      products: READ_ONLY, bom: READ_ONLY,
      inventory: READ_ONLY, purchasing: READ_ONLY,
      production: ["view"], stages: ["view"],
      quality: [...CRUD, "approve"], delivery: READ_ONLY,
      finance: READ_ONLY, reports: ["view"],
      analytics: ["view"], settings: READ_ONLY, users: READ_ONLY,
    },
    risk: "low",
  },
  {
    id: "delivery", en: "Delivery", ar: "التوصيل",
    color: "bg-blue-100 text-blue-700",
    description: "Delivery, installation", descriptionAr: "التوصيل والتركيب",
    permissions: {
      customers: ["view"], contacts: ["view"],
      quotations: READ_ONLY, orders: ["view"],
      products: READ_ONLY, bom: READ_ONLY,
      inventory: READ_ONLY, purchasing: READ_ONLY,
      production: READ_ONLY, stages: READ_ONLY,
      quality: READ_ONLY, delivery: [...CRUD, "assign"],
      finance: READ_ONLY, reports: ["view"],
      analytics: ["view"], settings: READ_ONLY, users: READ_ONLY,
    },
    risk: "low",
  },
  {
    id: "viewer", en: "Viewer", ar: "مشاهد فقط",
    color: "bg-slate-100 text-slate-600",
    description: "Read-only access to everything", descriptionAr: "عرض فقط بدون تعديل",
    permissions: allModulesWithPerms(["view"]),
    risk: "low",
  },
];

// ─── Permission checking helpers ──────────────────────────

export function hasPermission(
  permissions: PermissionMap | undefined,
  module: string,
  action: PermissionAction,
): boolean {
  if (!permissions) return false;
  const modulePerms = permissions[module];
  if (!modulePerms) return false;
  return modulePerms.includes(action);
}

export function countPermissions(permissions: PermissionMap): number {
  return Object.values(permissions).reduce((sum, acts) => sum + acts.length, 0);
}

export function countDangerousPermissions(permissions: PermissionMap): number {
  const dangerous: PermissionAction[] = ["delete", "manage_settings", "release", "approve"];
  return Object.values(permissions).reduce(
    (sum, acts) => sum + acts.filter(a => dangerous.includes(a)).length,
    0,
  );
}

export function getTemplateById(id: string): RoleTemplate | undefined {
  return ROLE_TEMPLATES.find(t => t.id === id);
}
