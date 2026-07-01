/**
 * Data Adapter Layer
 *
 * Unified interface that switches transparently between demo data
 * (static arrays) and live Supabase data based on env vars.
 *
 * Table mapping (schema → adapter key):
 *   work_items      → ds.work_items
 *   activity_events → ds.activity_events
 *   (all others match their Supabase table names exactly)
 */

import { supabase, isDemoMode } from "./supabase";
import { loadDeals } from "../data/sales";
import { loadWorkItems } from "../data/work";
import { loadInvoices, loadPayments, loadExpenses } from "../data/finance";
import { PEOPLE } from "../data/people";
import { ORGANIZATIONS } from "../data/organizations";
import { loadResources } from "../data/resources";
import type { Database } from "./database.types";
import {
  DEMO_BRANCHES, DEMO_EMPLOYEES, DEMO_ATTENDANCE, DEMO_LEAVE_REQUESTS,
  DEMO_SITE_VISITS, DEMO_MEASUREMENTS, DEMO_DESIGN_BRIEFS, DEMO_DESIGN_FILES,
  DEMO_DESIGN_COMMENTS, DEMO_PRODUCTION_ORDERS, DEMO_CUTTING_ITEMS, DEMO_STAGE_LOG,
  DEMO_QC_INSPECTIONS, DEMO_QC_DEFECTS, DEMO_DELIVERIES, DEMO_INSTALLATIONS,
  DEMO_COST_ENTRIES, DEMO_MATERIAL_REQUIREMENTS, DEMO_ACTIVITY_EVENTS,
  DEMO_SALES_ORDERS, DEMO_QUOTATIONS, DEMO_PURCHASE_ITEMS,
  DEMO_VENDORS, DEMO_INVENTORY, DEMO_STOCK_MOVEMENTS, DEMO_MAINTENANCE,
  DEMO_PRODUCTS, DEMO_POS_REGISTERS, DEMO_POS_TRANSACTIONS, DEMO_POS_TXN_ITEMS,
  DEMO_BRANCH_INVENTORY,
} from "./demo-seed";

type Tables = Database["public"]["Tables"];

// ─── Demo data converters ─────────────────────────────────
// Convert static data shapes → DB Row shapes so all pages
// can use ONE field convention (name_en, name_ar, metadata).

function convertPeople(): Tables["people"]["Row"][] {
  return PEOPLE.map(p => ({
    id: p.id,
    workspace_id: "demo",
    name_en: p.name,
    name_ar: p.nameAr || null,
    email: p.email,
    phone: p.phone,
    type: p.type,
    status: p.status,
    tags: [p.type],
    metadata: {
      company: p.company, companyAr: p.companyAr,
      role: p.role, roleAr: p.roleAr,
      avatarColor: p.avatarColor,
      address: p.address, addressAr: p.addressAr,
      city: p.city, cityAr: p.cityAr,
      country: p.country, countryAr: p.countryAr,
      website: p.website, linkedin: p.linkedin,
      bioEn: p.bioEn, bioAr: p.bioAr,
      lastContactEn: p.lastContactEn, lastContactAr: p.lastContactAr,
      roles: p.roles, metrics: p.metrics,
      activity: p.activity, notes: p.notes,
      files: p.files, related: p.related,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })) as unknown as Tables["people"]["Row"][];
}

function convertOrganizations(): Tables["organizations"]["Row"][] {
  return ORGANIZATIONS.map(o => ({
    id: o.id,
    workspace_id: "demo",
    name_en: o.nameEn,
    name_ar: o.nameAr || null,
    type: o.type,
    status: o.status,
    industry: o.industryEn,
    website: o.website || null,
    email: o.email || null,
    phone: o.phone || null,
    tags: [o.relationship, o.lifecycle],
    metadata: {
      relationship: o.relationship,
      lifecycle: o.lifecycle,
      industryAr: o.industryAr,
      founded: o.founded, headcount: o.headcount,
      healthScore: o.healthScore,
      addressEn: o.addressEn, addressAr: o.addressAr,
      ownerEn: o.ownerEn, ownerAr: o.ownerAr,
      descEn: o.descEn, descAr: o.descAr,
      avatarColor: o.avatarColor,
      branches: o.branches,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })) as unknown as Tables["organizations"]["Row"][];
}

function convertDeals(): Tables["deals"]["Row"][] {
  return loadDeals().map(d => ({
    id: d.id,
    workspace_id: "demo",
    title_en: d.titleEn,
    title_ar: d.titleAr || null,
    value: d.value,
    currency: d.currency || "SAR",
    stage: d.stage,
    probability: d.probability,
    org_name_en: d.orgNameEn || null,
    org_name_ar: d.orgNameAr || null,
    contact_name_en: d.contactNameEn || null,
    contact_name_ar: d.contactNameAr || null,
    owner_en: d.ownerEn || null,
    owner_ar: d.ownerAr || null,
    expected_close: d.expectedCloseDateISO || null,
    organization_id: d.orgId || null,
    tags: [],
    metadata: {
      descEn: d.descEn, descAr: d.descAr,
      priority: d.priority,
      contactRole: d.contactRole,
      relatedWorkIds: d.relatedWorkIds,
      expectedCloseDateEn: d.expectedCloseDateEn,
      expectedCloseDateAr: d.expectedCloseDateAr,
      createdEn: d.createdEn, createdAr: d.createdAr,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })) as unknown as Tables["deals"]["Row"][];
}

function convertWorkItems(): Tables["work_items"]["Row"][] {
  return loadWorkItems().map(w => ({
    id: w.id,
    workspace_id: "demo",
    title_en: w.titleEn,
    title_ar: w.titleAr || null,
    type: w.kind as Tables["work_items"]["Row"]["type"],
    status: w.status as Tables["work_items"]["Row"]["status"],
    priority: w.priority as Tables["work_items"]["Row"]["priority"],
    progress: w.progress,
    due_date: w.dueDateISO || null,
    assignee_id: null,
    organization_id: w.relatedOrgId || null,
    tags: [w.kind],
    metadata: {
      descEn: w.descEn, descAr: w.descAr,
      assigneeEn: w.assigneeEn, assigneeAr: w.assigneeAr,
      relatedPersonId: w.relatedPersonId,
      relatedPersonNameEn: w.relatedPersonNameEn,
      relatedPersonNameAr: w.relatedPersonNameAr,
      relatedOrgNameEn: w.relatedOrgNameEn,
      relatedOrgNameAr: w.relatedOrgNameAr,
      dueDateEn: w.dueDateEn, dueDateAr: w.dueDateAr,
      createdEn: w.createdEn, createdAr: w.createdAr,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })) as unknown as Tables["work_items"]["Row"][];
}

function convertInvoices(): Tables["invoices"]["Row"][] {
  return loadInvoices().map(i => ({
    id: i.id,
    workspace_id: "demo",
    number: i.number,
    org_name_en: i.orgNameEn,
    org_name_ar: i.orgNameAr || null,
    organization_id: i.orgId || null,
    deal_id: i.relatedDealId || null,
    amount: i.amount,
    currency: i.currency || "SAR",
    status: i.status,
    paid_amount: i.paidAmount || 0,
    issue_date: i.issueDateEn || null,
    due_date: i.dueDateISO || null,
    tags: [],
    metadata: {
      titleEn: i.titleEn, titleAr: i.titleAr,
      contactNameEn: i.contactNameEn, contactNameAr: i.contactNameAr,
      dueDateEn: i.dueDateEn, dueDateAr: i.dueDateAr,
      issueDateEn: i.issueDateEn, issueDateAr: i.issueDateAr,
      noteEn: i.noteEn, noteAr: i.noteAr,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })) as unknown as Tables["invoices"]["Row"][];
}

function convertPayments(): Tables["payments"]["Row"][] {
  return loadPayments().map(p => ({
    id: p.id,
    workspace_id: "demo",
    invoice_id: p.invoiceId,
    amount: p.amount,
    currency: p.currency || "SAR",
    method: p.method,
    date: p.dateEn,
    reference: p.referenceEn || null,
    metadata: {
      invoiceNumber: p.invoiceNumber,
      dateAr: p.dateAr,
      referenceAr: p.referenceAr,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })) as unknown as Tables["payments"]["Row"][];
}

function convertExpenses(): Tables["expenses"]["Row"][] {
  return loadExpenses().map(e => ({
    id: e.id,
    workspace_id: "demo",
    vendor_en: e.vendorEn,
    vendor_ar: e.vendorAr || null,
    category: e.category,
    amount: e.amount,
    currency: e.currency || "SAR",
    status: e.status,
    date: e.dateEn,
    description_en: e.descEn,
    description_ar: e.descAr || null,
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })) as unknown as Tables["expenses"]["Row"][];
}

function convertResources(): Tables["resources"]["Row"][] {
  return loadResources().map(r => ({
    id: r.id,
    workspace_id: "demo",
    name_en: r.nameEn,
    name_ar: r.nameAr || null,
    type: r.type,
    utilization: r.utilization,
    department: null,
    skills: [],
    metadata: {
      status: r.status,
      descEn: r.descEn, descAr: r.descAr,
      ownerEn: r.ownerEn, ownerAr: r.ownerAr,
      locationEn: r.locationEn, locationAr: r.locationAr,
      value: r.value, currency: r.currency,
      sku: r.sku, quantity: r.quantity, unitCost: r.unitCost,
      assignedToEn: r.assignedToEn, assignedToAr: r.assignedToAr,
      relatedWorkId: r.relatedWorkId,
      purchaseDateEn: r.purchaseDateEn, purchaseDateAr: r.purchaseDateAr,
      maintenance: r.maintenance,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })) as unknown as Tables["resources"]["Row"][];
}

// ─── Generic CRUD shape ────────────────────────────────────

export interface EntityAdapter<T> {
  list(workspaceId: string, filters?: Record<string, unknown>): Promise<T[]>;
  get(workspaceId: string, id: string): Promise<T | null>;
  create(workspaceId: string, data: Partial<T>): Promise<T | null>;
  update(workspaceId: string, id: string, data: Partial<T>): Promise<T | null>;
  remove(workspaceId: string, id: string): Promise<boolean>;
}

// ─── Supabase adapter factory ──────────────────────────────

function makeSupabaseAdapter<T extends { id: string; workspace_id: string }>(
  table: keyof Tables
): EntityAdapter<T> {
  return {
    async list(workspaceId, filters) {
      if (!supabase) return [];
      let query = supabase.from(table as string).select("*").eq("workspace_id", workspaceId);
      if (filters) {
        for (const [k, v] of Object.entries(filters)) {
          query = query.eq(k, v as string);
        }
      }
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) { console.error(`[DS] ${table} list error`, error); return []; }
      return (data ?? []) as T[];
    },

    async get(workspaceId, id) {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from(table as string)
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("id", id)
        .single();
      if (error) { console.error(`[DS] ${table} get error`, error); return null; }
      return data as T;
    },

    async create(workspaceId, payload) {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from(table as string)
        .insert({ ...payload, workspace_id: workspaceId } as never)
        .select()
        .single();
      if (error) { console.error(`[DS] ${table} create error`, error); return null; }
      return data as T;
    },

    async update(workspaceId, id, payload) {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from(table as string)
        .update({ ...payload, updated_at: new Date().toISOString() } as never)
        .eq("workspace_id", workspaceId)
        .eq("id", id)
        .select()
        .single();
      if (error) { console.error(`[DS] ${table} update error`, error); return null; }
      return data as T;
    },

    async remove(workspaceId, id) {
      if (!supabase) return false;
      const { error } = await supabase
        .from(table as string)
        .delete()
        .eq("workspace_id", workspaceId)
        .eq("id", id);
      if (error) { console.error(`[DS] ${table} delete error`, error); return false; }
      return true;
    },
  };
}

// ─── Demo adapters (wrap static data as async) ────────────

function makeDemoAdapter<T>(loader: () => T[]): EntityAdapter<T> {
  return {
    async list() { return loader(); },
    async get(_ws, id) { return loader().find((r: unknown) => (r as { id: string }).id === id) ?? null; },
    async create(_ws, data) {
      console.warn("[DS] Demo mode — create is ephemeral");
      return { ...data, id: `demo-${Date.now()}` } as T;
    },
    async update(_ws, _id, data) {
      console.warn("[DS] Demo mode — update is ephemeral");
      return data as T;
    },
    async remove() {
      console.warn("[DS] Demo mode — delete is ephemeral");
      return true;
    },
  };
}

// ─── DataSource interface ──────────────────────────────────

export interface DataSource {
  mode: "demo" | "live";
  deals:           EntityAdapter<Tables["deals"]["Row"]>;
  invoices:        EntityAdapter<Tables["invoices"]["Row"]>;
  payments:        EntityAdapter<Tables["payments"]["Row"]>;
  expenses:        EntityAdapter<Tables["expenses"]["Row"]>;
  people:          EntityAdapter<Tables["people"]["Row"]>;
  organizations:   EntityAdapter<Tables["organizations"]["Row"]>;
  work_items:      EntityAdapter<Tables["work_items"]["Row"]>;
  resources:       EntityAdapter<Tables["resources"]["Row"]>;
  activity_events: EntityAdapter<Tables["activity_events"]["Row"]>;
  site_visits: EntityAdapter<Tables["site_visits"]["Row"]>;
  measurements: EntityAdapter<Tables["measurements"]["Row"]>;
  measurement_attachments: EntityAdapter<Tables["measurement_attachments"]["Row"]>;
  design_briefs: EntityAdapter<Tables["design_briefs"]["Row"]>;
  design_files: EntityAdapter<Tables["design_files"]["Row"]>;
  design_comments: EntityAdapter<Tables["design_comments"]["Row"]>;
  production_orders: EntityAdapter<Tables["production_orders"]["Row"]>;
  cutting_list_items: EntityAdapter<Tables["cutting_list_items"]["Row"]>;
  production_stage_log: EntityAdapter<Tables["production_stage_log"]["Row"]>;
  qc_inspections: EntityAdapter<Tables["qc_inspections"]["Row"]>;
  qc_defects: EntityAdapter<Tables["qc_defects"]["Row"]>;
  deliveries: EntityAdapter<Tables["deliveries"]["Row"]>;
  installations: EntityAdapter<Tables["installations"]["Row"]>;
  employees: EntityAdapter<Tables["employees"]["Row"]>;
  attendance: EntityAdapter<Tables["attendance"]["Row"]>;
  leave_requests: EntityAdapter<Tables["leave_requests"]["Row"]>;
  cost_entries: EntityAdapter<Tables["cost_entries"]["Row"]>;
  branches: EntityAdapter<Tables["branches"]["Row"]>;
  material_requirements: EntityAdapter<Tables["material_requirements"]["Row"]>;
  pos_registers: EntityAdapter<Tables["pos_registers"]["Row"]>;
  pos_transactions: EntityAdapter<Tables["pos_transactions"]["Row"]>;
  pos_transaction_items: EntityAdapter<Tables["pos_transaction_items"]["Row"]>;
  branch_inventory: EntityAdapter<Tables["branch_inventory"]["Row"]>;
  stock_movements: EntityAdapter<any>;
  workspace_invitations: EntityAdapter<any>;
  notifications: EntityAdapter<any>;
}

// ─── Demo DataSource ───────────────────────────────────────

const demoDataSource: DataSource = {
  mode: "demo",
  deals:           makeDemoAdapter(convertDeals),
  invoices:        makeDemoAdapter(convertInvoices),
  payments:        makeDemoAdapter(convertPayments),
  expenses:        makeDemoAdapter(convertExpenses),
  people:          makeDemoAdapter(convertPeople),
  organizations:   makeDemoAdapter(() => [...convertOrganizations(), ...DEMO_VENDORS]),
  resources:       makeDemoAdapter(() => [...convertResources(), ...DEMO_INVENTORY, ...DEMO_PRODUCTS]),
  work_items:      makeDemoAdapter(() => [...convertWorkItems(), ...DEMO_SALES_ORDERS, ...DEMO_QUOTATIONS, ...DEMO_PURCHASE_ITEMS, ...DEMO_STOCK_MOVEMENTS, ...DEMO_MAINTENANCE]),
  activity_events: makeDemoAdapter(() => DEMO_ACTIVITY_EVENTS),
  site_visits: makeDemoAdapter(() => DEMO_SITE_VISITS),
  measurements: makeDemoAdapter(() => DEMO_MEASUREMENTS),
  measurement_attachments: makeDemoAdapter(() => []),
  design_briefs: makeDemoAdapter(() => DEMO_DESIGN_BRIEFS),
  design_files: makeDemoAdapter(() => DEMO_DESIGN_FILES),
  design_comments: makeDemoAdapter(() => DEMO_DESIGN_COMMENTS),
  production_orders: makeDemoAdapter(() => DEMO_PRODUCTION_ORDERS),
  cutting_list_items: makeDemoAdapter(() => DEMO_CUTTING_ITEMS),
  production_stage_log: makeDemoAdapter(() => DEMO_STAGE_LOG),
  qc_inspections: makeDemoAdapter(() => DEMO_QC_INSPECTIONS),
  qc_defects: makeDemoAdapter(() => DEMO_QC_DEFECTS),
  deliveries: makeDemoAdapter(() => DEMO_DELIVERIES),
  installations: makeDemoAdapter(() => DEMO_INSTALLATIONS),
  employees: makeDemoAdapter(() => DEMO_EMPLOYEES),
  attendance: makeDemoAdapter(() => DEMO_ATTENDANCE),
  leave_requests: makeDemoAdapter(() => DEMO_LEAVE_REQUESTS),
  cost_entries: makeDemoAdapter(() => DEMO_COST_ENTRIES),
  branches: makeDemoAdapter(() => DEMO_BRANCHES),
  material_requirements: makeDemoAdapter(() => DEMO_MATERIAL_REQUIREMENTS),
  pos_registers: makeDemoAdapter(() => DEMO_POS_REGISTERS),
  pos_transactions: makeDemoAdapter(() => DEMO_POS_TRANSACTIONS),
  pos_transaction_items: makeDemoAdapter(() => DEMO_POS_TXN_ITEMS),
  branch_inventory: makeDemoAdapter(() => DEMO_BRANCH_INVENTORY),
  stock_movements: makeDemoAdapter(() => []),
  workspace_invitations: makeDemoAdapter(() => []),
  notifications: makeDemoAdapter(() => []),
};

// ─── Live DataSource ───────────────────────────────────────

const liveDataSource: DataSource = {
  mode: "live",
  deals:           makeSupabaseAdapter("deals"),
  invoices:        makeSupabaseAdapter("invoices"),
  payments:        makeSupabaseAdapter("payments"),
  expenses:        makeSupabaseAdapter("expenses"),
  people:          makeSupabaseAdapter("people"),
  organizations:   makeSupabaseAdapter("organizations"),
  work_items:      makeSupabaseAdapter("work_items"),
  resources:       makeSupabaseAdapter("resources"),
  activity_events: makeSupabaseAdapter("activity_events"),
  site_visits: makeSupabaseAdapter("site_visits"),
  measurements: makeSupabaseAdapter("measurements"),
  measurement_attachments: makeSupabaseAdapter("measurement_attachments"),
  design_briefs: makeSupabaseAdapter("design_briefs"),
  design_files: makeSupabaseAdapter("design_files"),
  design_comments: makeSupabaseAdapter("design_comments"),
  production_orders: makeSupabaseAdapter("production_orders"),
  cutting_list_items: makeSupabaseAdapter("cutting_list_items"),
  production_stage_log: makeSupabaseAdapter("production_stage_log"),
  qc_inspections: makeSupabaseAdapter("qc_inspections"),
  qc_defects: makeSupabaseAdapter("qc_defects"),
  deliveries: makeSupabaseAdapter("deliveries"),
  installations: makeSupabaseAdapter("installations"),
  employees: makeSupabaseAdapter("employees"),
  attendance: makeSupabaseAdapter("attendance"),
  leave_requests: makeSupabaseAdapter("leave_requests"),
  cost_entries: makeSupabaseAdapter("cost_entries"),
  branches: makeSupabaseAdapter("branches"),
  material_requirements: makeSupabaseAdapter("material_requirements"),
  pos_registers: makeSupabaseAdapter("pos_registers"),
  pos_transactions: makeSupabaseAdapter("pos_transactions"),
  pos_transaction_items: makeSupabaseAdapter("pos_transaction_items"),
  branch_inventory: makeSupabaseAdapter("branch_inventory"),
  stock_movements: makeSupabaseAdapter("stock_movements" as never),
  workspace_invitations: makeSupabaseAdapter("workspace_invitations" as never),
  notifications: makeSupabaseAdapter("notifications" as never),
};

// ─── Public API ────────────────────────────────────────────

export function getDataSource(): DataSource {
  return isDemoMode ? demoDataSource : liveDataSource;
}

export { isDemoMode };
