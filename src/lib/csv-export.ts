/**
 * CSV Export Utility
 *
 * Exports workspace data tables as CSV files.
 * Works entirely client-side — no server round-trip needed.
 */

type Row = Record<string, unknown>;

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = typeof value === "object" ? JSON.stringify(value) : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Strip internal columns that aren't useful in exports */
const INTERNAL_COLS = new Set(["workspace_id", "metadata", "id"]);

export function exportCSV(rows: Row[], filename: string, columns?: string[]): void {
  if (rows.length === 0) return;

  const cols = columns ?? Object.keys(rows[0]).filter((k) => !INTERNAL_COLS.has(k));

  const header = cols.join(",");
  const body = rows.map((row) => cols.map((col) => escapeCSV(row[col])).join(",")).join("\n");
  const csv = header + "\n" + body;

  downloadFile(csv, filename, "text/csv;charset=utf-8;");
}

/** Download a string as a file */
function downloadFile(content: string, filename: string, mime: string): void {
  const blob = new Blob(["﻿" + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Download a CSV template (just headers, no data) */
export function downloadTemplate(headers: string[], filename: string): void {
  downloadFile(headers.join(",") + "\n", filename, "text/csv;charset=utf-8;");
}

/** Parse a CSV string into rows */
export function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return { headers: [], rows: [] };

  // Remove BOM if present
  const headerLine = lines[0].replace(/^﻿/, "");
  const headers = parseLine(headerLine);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] ?? "").trim();
    });
    rows.push(row);
  }

  return { headers, rows };
}

/** Parse a single CSV line handling quoted fields */
function parseLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        result.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

// ─── Import templates ─────────────────────────────────────

export interface ImportTemplate {
  id: string;
  labelEn: string;
  labelAr: string;
  headers: string[];
  requiredHeaders: string[];
  mapRow: (row: Record<string, string>) => Record<string, unknown>;
}

export const IMPORT_TEMPLATES: ImportTemplate[] = [
  {
    id: "organizations",
    labelEn: "Organizations",
    labelAr: "الشركات",
    headers: ["name_en", "name_ar", "sector", "website", "health_score"],
    requiredHeaders: ["name_en"],
    mapRow: (r) => ({
      name_en: r.name_en,
      name_ar: r.name_ar || r.name_en,
      sector: r.sector || null,
      website: r.website || null,
      health_score: parseInt(r.health_score) || 70,
      tags: [],
      metadata: {},
    }),
  },
  {
    id: "people",
    labelEn: "People",
    labelAr: "الأشخاص",
    headers: ["name_en", "name_ar", "email", "phone", "role_en", "role_ar"],
    requiredHeaders: ["name_en"],
    mapRow: (r) => ({
      name_en: r.name_en,
      name_ar: r.name_ar || r.name_en,
      email: r.email || null,
      phone: r.phone || null,
      role_en: r.role_en || null,
      role_ar: r.role_ar || r.role_en || null,
      tags: [],
      metadata: {},
    }),
  },
  {
    id: "employees",
    labelEn: "Employees",
    labelAr: "الموظفين",
    headers: ["name_en", "name_ar", "email", "phone", "job_title", "department", "employee_type", "status"],
    requiredHeaders: ["name_en"],
    mapRow: (r) => ({
      name_en: r.name_en,
      name_ar: r.name_ar || r.name_en,
      email: r.email || null,
      phone: r.phone || null,
      role_en: r.job_title || null,
      role_ar: r.job_title || null,
      tags: ["team"],
      metadata: {
        is_team_member: true,
        job_title: r.job_title || null,
        department: r.department || null,
        employee_type: r.employee_type || "employee",
        status: (["active", "on_leave", "inactive"].includes(r.status) ? r.status : "active"),
        joined_date: new Date().toISOString().slice(0, 10),
      },
    }),
  },
  {
    id: "deals",
    labelEn: "Deals",
    labelAr: "الصفقات",
    headers: ["title_en", "title_ar", "value", "currency", "stage", "probability", "org_name_en", "contact_name_en"],
    requiredHeaders: ["title_en"],
    mapRow: (r) => ({
      title_en: r.title_en,
      title_ar: r.title_ar || r.title_en,
      value: parseFloat(r.value) || 0,
      currency: r.currency || "SAR",
      stage: r.stage || "lead",
      probability: parseInt(r.probability) || 25,
      org_name_en: r.org_name_en || null,
      org_name_ar: r.org_name_en || null,
      contact_name_en: r.contact_name_en || null,
      contact_name_ar: r.contact_name_en || null,
      tags: [],
      metadata: {},
    }),
  },
  {
    id: "work_items",
    labelEn: "Work Items",
    labelAr: "المهام",
    headers: ["title_en", "title_ar", "type", "status", "priority", "due_date", "progress"],
    requiredHeaders: ["title_en"],
    mapRow: (r) => ({
      title_en: r.title_en,
      title_ar: r.title_ar || r.title_en,
      type: (["task", "project", "milestone", "action", "initiative", "ticket", "request"].includes(r.type) ? r.type : "task"),
      status: (["backlog", "planned", "todo", "in_progress", "review", "done", "blocked"].includes(r.status) ? r.status : "todo"),
      priority: (["critical", "urgent", "high", "medium", "low"].includes(r.priority) ? r.priority : "medium"),
      due_date: r.due_date || null,
      progress: Math.min(100, Math.max(0, parseInt(r.progress) || 0)),
      tags: [],
      metadata: {},
    }),
  },
  {
    id: "invoices",
    labelEn: "Invoices",
    labelAr: "الفواتير",
    headers: ["number", "org_name_en", "amount", "currency", "status", "due_date"],
    requiredHeaders: ["number", "org_name_en"],
    mapRow: (r) => ({
      number: r.number,
      org_name_en: r.org_name_en,
      org_name_ar: r.org_name_en,
      amount: parseFloat(r.amount) || 0,
      currency: r.currency || "SAR",
      status: (["draft", "sent", "paid", "overdue", "cancelled"].includes(r.status) ? r.status : "draft"),
      due_date: r.due_date || null,
      metadata: {},
    }),
  },
  {
    id: "expenses",
    labelEn: "Expenses",
    labelAr: "المصاريف",
    headers: ["description_en", "description_ar", "amount", "currency", "category", "date"],
    requiredHeaders: ["description_en", "amount"],
    mapRow: (r) => ({
      description_en: r.description_en,
      description_ar: r.description_ar || r.description_en,
      amount: parseFloat(r.amount) || 0,
      currency: r.currency || "SAR",
      category: r.category || null,
      date: r.date || null,
      metadata: {},
    }),
  },
  {
    id: "inventory_items",
    labelEn: "Inventory Items",
    labelAr: "أصناف المخزون",
    headers: ["name_en", "name_ar", "type", "sku", "quantity", "reorder_level", "unit_cost", "location", "vendor_name"],
    requiredHeaders: ["name_en"],
    mapRow: (r) => ({
      name_en: r.name_en,
      name_ar: r.name_ar || r.name_en,
      type: r.type || "inventory",
      utilization: 0,
      department: null,
      skills: ["inventory"],
      metadata: {
        category: r.type || "inventory", sku: r.sku || null,
        quantity: parseInt(r.quantity) || 0, reorder_level: parseInt(r.reorder_level) || 0,
        unit_cost: parseFloat(r.unit_cost) || 0, location: r.location || null,
        vendor_name: r.vendor_name || null, inv_status: "in_stock",
      },
    }),
  },
  {
    id: "assets",
    labelEn: "Assets",
    labelAr: "الأصول",
    headers: ["name_en", "name_ar", "type", "asset_tag", "assigned_to", "department", "location", "purchase_cost", "condition"],
    requiredHeaders: ["name_en"],
    mapRow: (r) => ({
      name_en: r.name_en,
      name_ar: r.name_ar || r.name_en,
      type: r.type || "equipment",
      utilization: 0,
      department: r.department || null,
      skills: ["asset"],
      metadata: {
        category: r.type || "equipment", asset_tag: r.asset_tag || null,
        assigned_to: r.assigned_to || null, assigned_dept: r.department || null,
        location: r.location || null, purchase_cost: parseFloat(r.purchase_cost) || 0,
        current_value: parseFloat(r.purchase_cost) || 0, condition: r.condition || "good",
        asset_status: r.assigned_to ? "assigned" : "active",
      },
    }),
  },
  {
    id: "vendors",
    labelEn: "Vendors",
    labelAr: "الموردين",
    headers: ["name_en", "name_ar", "sector", "website", "vendor_category", "payment_terms", "country", "city"],
    requiredHeaders: ["name_en"],
    mapRow: (r) => ({
      name_en: r.name_en,
      name_ar: r.name_ar || r.name_en,
      sector: r.sector || null,
      website: r.website || null,
      health_score: 70,
      tags: ["vendor"],
      metadata: {
        org_type: "vendor",
        vendor_category: r.vendor_category || null,
        payment_terms: r.payment_terms || null,
        country: r.country || null,
        city: r.city || null,
      },
    }),
  },
  {
    id: "quotations",
    labelEn: "Quotations",
    labelAr: "عروض الأسعار",
    headers: ["quotation_number", "customer_name", "project_name", "product", "description", "qty", "unit_price", "width_cm", "height_cm", "depth_cm", "material", "finish", "color"],
    requiredHeaders: ["quotation_number", "product"],
    mapRow: (r) => ({
      title_en: r.project_name || r.quotation_number,
      title_ar: r.project_name || r.quotation_number,
      type: "quotation",
      status: "draft",
      priority: "medium",
      progress: 0,
      tags: ["quotation"],
      metadata: {
        quotation_number: r.quotation_number,
        customer_name: r.customer_name || null,
        project_name: r.project_name || null,
        quotation_date: new Date().toISOString().slice(0, 10),
        items: [{
          id: "1", product: r.product, description: r.description || "",
          qty: parseInt(r.qty) || 1, unitPrice: parseFloat(r.unit_price) || 0,
          width: parseFloat(r.width_cm) || undefined,
          height: parseFloat(r.height_cm) || undefined,
          depth: parseFloat(r.depth_cm) || undefined,
          material: r.material || undefined,
          finish: r.finish || undefined,
          color: r.color || undefined,
        }],
        currency: "EGP",
      },
    }),
  },
  {
    id: "site_visits",
    labelEn: "Site Visits",
    labelAr: "المعاينات",
    headers: ["visit_number", "customer_name", "site_address", "assigned_technician", "visit_date", "notes", "preferred_style"],
    requiredHeaders: ["visit_number"],
    mapRow: (r) => ({
      visit_number: r.visit_number,
      customer_name: r.customer_name || null,
      site_address: r.site_address || null,
      assigned_technician: r.assigned_technician || null,
      visit_date: r.visit_date || null,
      notes: r.notes || null,
      preferred_style: (["modern", "classic", "minimal", "luxury", "custom"].includes(r.preferred_style) ? r.preferred_style : null),
      status: "scheduled",
      checklist: [
        { id: "measurements", label_en: "Measurements captured", label_ar: "المقاسات اتاخدت", checked: false },
        { id: "photos", label_en: "Photos captured", label_ar: "الصور اتصورت", checked: false },
        { id: "electrical", label_en: "Electrical points checked", label_ar: "النقط الكهربائية اتراجعت", checked: false },
        { id: "plumbing", label_en: "Plumbing checked", label_ar: "السباكة اتراجعت", checked: false },
        { id: "access", label_en: "Access route checked", label_ar: "مدخل التركيب اتراجع", checked: false },
        { id: "installation", label_en: "Installation conditions reviewed", label_ar: "ظروف التركيب اتراجعت", checked: false },
      ],
      metadata: {},
    }),
  },
  {
    id: "products",
    labelEn: "Products",
    labelAr: "المنتجات",
    headers: ["name_en", "sku", "category", "main_material", "finish", "width", "height", "depth", "suggested_price"],
    requiredHeaders: ["name_en"],
    mapRow: (r) => ({
      name_en: r.name_en,
      name_ar: r.name_en,
      type: "product",
      utilization: 0,
      department: r.category || "Custom",
      skills: ["product"],
      metadata: {
        product_type: "product", sku: r.sku || null,
        category: r.category || "Custom", active: true,
        main_material: r.main_material || null, finish: r.finish || null,
        width: parseFloat(r.width) || null, height: parseFloat(r.height) || null,
        depth: parseFloat(r.depth) || null,
        suggested_price: parseFloat(r.suggested_price) || null,
        bom: [], stages: [],
      },
    }),
  },
];
