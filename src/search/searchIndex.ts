import { loadWorkItems } from "../data/work";
import { loadDeals } from "../data/sales";
import { loadInvoices } from "../data/finance";
import { loadResources } from "../data/resources";
import { PEOPLE } from "../data/people";
import { ORGANIZATIONS } from "../data/organizations";
import { CRM_CUSTOMERS, CRM_TASKS, CRM_NOTES, CRM_LEADS } from "../lib/crm-data";
import { HR_EMPLOYEES } from "../lib/hr-data";
import { STUDIO_PAGES } from "../lib/studio-data";
import { FIN_INVOICES, FIN_EXPENSES, FIN_PAYMENTS } from "../lib/finance-data";

export type SearchResultType =
  | "work"
  | "deal"
  | "person"
  | "organization"
  | "invoice"
  | "resource"
  | "crm_customer"
  | "crm_task"
  | "crm_note"
  | "crm_lead"
  | "hr_employee"
  | "studio_page"
  | "finance_payment"
  | "finance_expense";

export interface SearchResult {
  id: string;
  type: SearchResultType;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  route: string;
  badge?: string;
}

function fuzzyMatch(query: string, text: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(q)) return true;
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

export function buildSearchIndex(): SearchResult[] {
  const results: SearchResult[] = [];

  loadWorkItems().forEach((w) => {
    results.push({
      id: `work-${w.id}`,
      type: "work",
      titleEn: w.titleEn,
      titleAr: w.titleAr,
      subtitleEn: w.status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      subtitleAr: w.titleAr,
      route: `/work/${w.id}`,
      badge: w.priority,
    });
  });

  loadDeals().forEach((d) => {
    results.push({
      id: `deal-${d.id}`,
      type: "deal",
      titleEn: d.titleEn,
      titleAr: d.titleAr,
      subtitleEn: d.orgNameEn || d.contactNameEn,
      subtitleAr: d.orgNameAr || d.contactNameAr,
      route: `/sales/${d.id}`,
      badge: d.stage,
    });
  });

  PEOPLE.forEach((p) => {
    results.push({
      id: `person-${p.id}`,
      type: "person",
      titleEn: p.name,
      titleAr: p.nameAr,
      subtitleEn: p.company || p.role,
      subtitleAr: p.companyAr || p.roleAr,
      route: `/people/${p.id}`,
      badge: p.type,
    });
  });

  ORGANIZATIONS.forEach((o) => {
    results.push({
      id: `org-${o.id}`,
      type: "organization",
      titleEn: o.nameEn,
      titleAr: o.nameAr,
      subtitleEn: o.industryEn,
      subtitleAr: o.industryAr,
      route: `/organizations/${o.id}`,
      badge: o.relationship,
    });
  });

  loadInvoices().forEach((inv) => {
    results.push({
      id: `invoice-${inv.id}`,
      type: "invoice",
      titleEn: `${inv.number} — ${inv.titleEn}`,
      titleAr: `${inv.number} — ${inv.titleAr}`,
      subtitleEn: inv.orgNameEn,
      subtitleAr: inv.orgNameAr,
      route: `/finance/${inv.id}`,
      badge: inv.status,
    });
  });

  loadResources().forEach((r) => {
    results.push({
      id: `resource-${r.id}`,
      type: "resource",
      titleEn: r.nameEn,
      titleAr: r.nameAr,
      subtitleEn: r.type,
      subtitleAr: r.nameAr,
      route: `/resources/${r.id}`,
      badge: r.status,
    });
  });

  // CRM Customers
  CRM_CUSTOMERS.forEach((c) => {
    results.push({
      id: `crm-customer-${c.id}`,
      type: "crm_customer",
      titleEn: c.name,
      titleAr: c.name_ar,
      subtitleEn: `${c.phone} · ${c.city}`,
      subtitleAr: `${c.phone} · ${c.city}`,
      route: `/crm/customers/${c.id}`,
      badge: c.vip_level !== "none" ? c.vip_level : c.status,
    });
  });

  // CRM Tasks
  CRM_TASKS.forEach((t) => {
    results.push({
      id: `crm-task-${t.id}`,
      type: "crm_task",
      titleEn: t.title,
      titleAr: t.title_ar,
      subtitleEn: `${t.customer_name} · ${t.due_date}`,
      subtitleAr: `${t.customer_name} · ${t.due_date}`,
      route: `/crm/customers/${t.customer_id}`,
      badge: t.status,
    });
  });

  // CRM Notes
  CRM_NOTES.forEach((n) => {
    results.push({
      id: `crm-note-${n.id}`,
      type: "crm_note",
      titleEn: n.content.slice(0, 60) + (n.content.length > 60 ? "..." : ""),
      titleAr: n.content_ar.slice(0, 60) + (n.content_ar.length > 60 ? "..." : ""),
      subtitleEn: `Note by ${n.author}`,
      subtitleAr: `ملاحظة بواسطة ${n.author}`,
      route: `/crm/customers/${n.customer_id}`,
      badge: n.type,
    });
  });

  // CRM Leads
  CRM_LEADS.forEach((l) => {
    results.push({
      id: `crm-lead-${l.id}`,
      type: "crm_lead",
      titleEn: l.title,
      titleAr: l.title_ar,
      subtitleEn: `${l.customer_name} · ${l.value.toLocaleString()} EGP`,
      subtitleAr: `${l.customer_name_ar} · ${l.value.toLocaleString()} ج.م`,
      route: `/crm/pipeline`,
      badge: l.stage,
    });
  });

  // HR Employees
  HR_EMPLOYEES.forEach((e) => {
    results.push({
      id: `hr-employee-${e.id}`,
      type: "hr_employee",
      titleEn: e.full_name,
      titleAr: e.full_name_ar,
      subtitleEn: `${e.job_title} · ${e.department}`,
      subtitleAr: `${e.job_title_ar} · ${e.department}`,
      route: `/hr/employees/${e.id}`,
      badge: e.status,
    });
  });

  // Studio Pages
  STUDIO_PAGES.forEach((p) => {
    results.push({
      id: `studio-page-${p.id}`,
      type: "studio_page",
      titleEn: p.title,
      titleAr: p.title_ar,
      subtitleEn: `${p.type} · ${p.status}`,
      subtitleAr: `${p.type} · ${p.status}`,
      route: `/studio/${p.id}`,
      badge: p.type,
    });
  });

  // Finance Payments
  FIN_PAYMENTS.forEach((p) => {
    results.push({
      id: `finance-payment-${p.id}`,
      type: "finance_payment",
      titleEn: `Payment: ${p.invoice_number}`,
      titleAr: `دفعة: ${p.invoice_number}`,
      subtitleEn: `${p.customer_name} · ${p.amount.toLocaleString()} EGP`,
      subtitleAr: `${p.customer_name_ar} · ${p.amount.toLocaleString()} ج.م`,
      route: `/finance`,
      badge: p.method,
    });
  });

  // Finance Expenses
  FIN_EXPENSES.forEach((e) => {
    results.push({
      id: `finance-expense-${e.id}`,
      type: "finance_expense",
      titleEn: `${e.vendor} — ${e.description}`,
      titleAr: `${e.vendor_ar} — ${e.description_ar}`,
      subtitleEn: `${e.category} · ${e.amount.toLocaleString()} EGP`,
      subtitleAr: `${e.category} · ${e.amount.toLocaleString()} ج.م`,
      route: `/finance/expenses`,
      badge: e.status,
    });
  });

  return results;
}

export function searchIndex(query: string, index: SearchResult[]): SearchResult[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return index.filter((item) =>
    fuzzyMatch(query, item.titleEn) ||
    fuzzyMatch(query, item.titleAr) ||
    fuzzyMatch(query, item.subtitleEn) ||
    fuzzyMatch(query, item.subtitleAr) ||
    fuzzyMatch(query, item.badge || "")
  );
}

export function groupByType(results: SearchResult[]): Record<SearchResultType, SearchResult[]> {
  const groups: Record<string, SearchResult[]> = {};
  for (const r of results) {
    if (!groups[r.type]) groups[r.type] = [];
    groups[r.type].push(r);
  }
  return groups as Record<SearchResultType, SearchResult[]>;
}
