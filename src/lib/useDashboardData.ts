/**
 * useDashboardData — Load real data into the intelligence bridge
 *
 * In demo mode: no-op (existing static loaders work fine)
 * In production mode: loads from Supabase via getDataSource(),
 *   converts DB rows → intelligence types, populates the bridge.
 *   Intelligence functions then read real data transparently.
 */

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { isDemoMode } from "./supabase";
import { getDataSource } from "./data-source";
import { setLiveData, isLiveDataLoaded } from "./dashboard-bridge";

import type { Deal, DealStage, DealPriority } from "../data/sales";
import type { WorkItem, WorkStatus, WorkPriority, WorkKind } from "../data/work";
import type { Invoice, InvoiceStatus, Expense, ExpenseCategory, ExpenseStatus } from "../data/finance";
import type { Resource } from "../data/resources";
import type { Organization, OrgType, OrgStatus, OrgRelationship, OrgLifecycle } from "../data/organizations";
import type { Person, PersonType, Status as PersonStatus } from "../data/people";

// ─── DB Row → Intelligence type converters ───────────────

function rowToDeal(row: Record<string, unknown>): Deal {
  const meta = (row.metadata || {}) as Record<string, unknown>;
  return {
    id: (row.id as string) || "",
    titleEn: (row.title_en as string) || "",
    titleAr: (row.title_ar as string) || "",
    descEn: (meta.descEn as string) || "",
    descAr: (meta.descAr as string) || "",
    stage: ((row.stage as string) || "lead") as DealStage,
    priority: ((meta.priority as string) || "medium") as DealPriority,
    value: (row.value as number) || 0,
    currency: (row.currency as string) || "SAR",
    probability: (row.probability as number) || 0,
    ownerEn: (row.owner_en as string) || (meta.ownerEn as string) || "",
    ownerAr: (row.owner_ar as string) || (meta.ownerAr as string) || "",
    contactNameEn: (row.contact_name_en as string) || "",
    contactNameAr: (row.contact_name_ar as string) || "",
    contactRole: (meta.contactRole as string) || undefined,
    orgId: (row.organization_id as string) || undefined,
    orgNameEn: (row.org_name_en as string) || "",
    orgNameAr: (row.org_name_ar as string) || "",
    expectedCloseDateEn: (meta.expectedCloseDateEn as string) || "",
    expectedCloseDateAr: (meta.expectedCloseDateAr as string) || "",
    expectedCloseDateISO: (row.expected_close_date as string) || (row.expected_close as string) || "",
    createdEn: (meta.createdEn as string) || formatDateEn(row.created_at as string),
    createdAr: (meta.createdAr as string) || "",
    relatedWorkIds: (meta.relatedWorkIds as string[]) || [],
  };
}

function rowToWorkItem(row: Record<string, unknown>): WorkItem {
  const meta = (row.metadata || {}) as Record<string, unknown>;
  const status = (row.status as string) || "backlog";
  // Map extended statuses to the 5 basic ones intelligence uses
  const statusMap: Record<string, WorkStatus> = {
    backlog: "backlog", planned: "planned", todo: "planned",
    in_progress: "in_progress", review: "review", done: "done",
    blocked: "in_progress", cancelled: "done",
    draft: "backlog", submitted: "planned", approved: "planned",
    rejected: "done", ordered: "in_progress", sent: "in_progress",
    partially_received: "in_progress", received: "done",
    expired: "done", converted: "done",
  };
  const kind = (row.type as string) || "task";
  const kindMap: Record<string, WorkKind> = {
    task: "task", project: "task", milestone: "task", action: "task",
    initiative: "task", ticket: "ticket", request: "request",
    purchase_request: "request", purchase_order: "work_order",
    stock_movement: "work_order", maintenance: "service_order",
    quotation: "work_order", sales_order: "work_order",
    production_order: "production_order", service_order: "service_order",
    work_order: "work_order",
  };
  return {
    id: (row.id as string) || "",
    titleEn: (row.title_en as string) || "",
    titleAr: (row.title_ar as string) || "",
    descEn: (meta.descEn as string) || "",
    descAr: (meta.descAr as string) || "",
    status: statusMap[status] || "backlog",
    priority: ((row.priority as string) || "medium") as WorkPriority,
    kind: kindMap[kind] || "task",
    assigneeEn: (meta.assigneeEn as string) || "",
    assigneeAr: (meta.assigneeAr as string) || "",
    relatedPersonId: (meta.relatedPersonId as string) || undefined,
    relatedPersonNameEn: (meta.relatedPersonNameEn as string) || undefined,
    relatedPersonNameAr: (meta.relatedPersonNameAr as string) || undefined,
    relatedOrgId: (row.organization_id as string) || undefined,
    relatedOrgNameEn: (meta.relatedOrgNameEn as string) || undefined,
    relatedOrgNameAr: (meta.relatedOrgNameAr as string) || undefined,
    dueDateEn: (meta.dueDateEn as string) || "",
    dueDateAr: (meta.dueDateAr as string) || "",
    dueDateISO: (row.due_date as string) || undefined,
    createdEn: (meta.createdEn as string) || formatDateEn(row.created_at as string),
    createdAr: (meta.createdAr as string) || "",
    progress: (row.progress as number) || 0,
  };
}

function rowToInvoice(row: Record<string, unknown>): Invoice {
  const meta = (row.metadata || {}) as Record<string, unknown>;
  return {
    id: (row.id as string) || "",
    number: (row.number as string) || "",
    titleEn: (meta.titleEn as string) || (row.org_name_en as string) || "",
    titleAr: (meta.titleAr as string) || (row.org_name_ar as string) || "",
    orgNameEn: (row.org_name_en as string) || "",
    orgNameAr: (row.org_name_ar as string) || "",
    orgId: (row.organization_id as string) || undefined,
    contactNameEn: (meta.contactNameEn as string) || "",
    contactNameAr: (meta.contactNameAr as string) || "",
    amount: (row.amount as number) || 0,
    currency: (row.currency as string) || "SAR",
    status: ((row.status as string) || "draft") as InvoiceStatus,
    issueDateEn: (meta.issueDateEn as string) || (row.issue_date as string) || formatDateEn(row.created_at as string),
    issueDateAr: (meta.issueDateAr as string) || "",
    dueDateEn: (meta.dueDateEn as string) || "",
    dueDateAr: (meta.dueDateAr as string) || "",
    dueDateISO: (row.due_date as string) || undefined,
    paidAmount: (row.paid_amount as number) || 0,
    relatedDealId: (row.deal_id as string) || undefined,
    noteEn: (meta.noteEn as string) || undefined,
    noteAr: (meta.noteAr as string) || undefined,
  };
}

function rowToExpense(row: Record<string, unknown>): Expense {
  return {
    id: (row.id as string) || "",
    vendorEn: (row.vendor_en as string) || (row.description_en as string) || "",
    vendorAr: (row.vendor_ar as string) || (row.description_ar as string) || "",
    category: ((row.category as string) || "other") as ExpenseCategory,
    amount: (row.amount as number) || 0,
    currency: (row.currency as string) || "SAR",
    status: ((row.status as string) || "pending") as ExpenseStatus,
    dateEn: (row.date as string) || formatDateEn(row.created_at as string),
    dateAr: "",
    descEn: (row.description_en as string) || "",
    descAr: (row.description_ar as string) || "",
  };
}

function rowToResource(row: Record<string, unknown>): Resource {
  const meta = (row.metadata || {}) as Record<string, unknown>;
  return {
    id: (row.id as string) || "",
    nameEn: (row.name_en as string) || "",
    nameAr: (row.name_ar as string) || "",
    type: (row.type as any) || "equipment",
    status: (meta.status as any) || "active",
    utilization: (row.utilization as number) || 0,
    descEn: (meta.descEn as string) || "",
    descAr: (meta.descAr as string) || "",
    ownerEn: (meta.ownerEn as string) || "",
    ownerAr: (meta.ownerAr as string) || "",
    locationEn: (meta.locationEn as string) || "",
    locationAr: (meta.locationAr as string) || "",
    value: (meta.value as number) || 0,
    currency: (meta.currency as string) || "SAR",
    sku: (meta.sku as string) || "",
    quantity: (meta.quantity as number) || 1,
    unitCost: (meta.unitCost as number) || 0,
    assignedToEn: (meta.assignedToEn as string) || "",
    assignedToAr: (meta.assignedToAr as string) || "",
    relatedWorkId: (meta.relatedWorkId as string) || undefined,
    purchaseDateEn: (meta.purchaseDateEn as string) || "",
    purchaseDateAr: (meta.purchaseDateAr as string) || "",
    maintenance: (meta.maintenance as any) || [],
  };
}

function rowToOrganization(row: Record<string, unknown>): Organization {
  const meta = (row.metadata || {}) as Record<string, unknown>;
  return {
    id: (row.id as string) || "",
    nameEn: (row.name_en as string) || "",
    nameAr: (row.name_ar as string) || "",
    type: ((meta.type as string) || (row.type as string) || "company") as OrgType,
    status: ((meta.orgStatus as string) || (row.status as string) || "active") as OrgStatus,
    relationship: ((meta.relationship as string) || "customer") as OrgRelationship,
    lifecycle: ((row.lifecycle as string) || (meta.lifecycle as string) || "active") as OrgLifecycle,
    industryEn: (row.sector as string) || (row.industry as string) || "",
    industryAr: (meta.industryAr as string) || "",
    founded: (meta.founded as string) || "",
    headcount: (row.headcount as number) || (meta.headcount as number) || 0,
    healthScore: (row.health_score as number) || (meta.healthScore as number) || 50,
    website: (row.website as string) || "",
    email: (row.email as string) || "",
    phone: (row.phone as string) || "",
    addressEn: (meta.addressEn as string) || "",
    addressAr: (meta.addressAr as string) || "",
    ownerEn: (meta.ownerEn as string) || "",
    ownerAr: (meta.ownerAr as string) || "",
    descEn: (meta.descEn as string) || "",
    descAr: (meta.descAr as string) || "",
    avatarColor: (meta.avatarColor as string) || "bg-primary/10",
    branches: (meta.branches as Organization["branches"]) || [],
  };
}

function rowToPerson(row: Record<string, unknown>): Person {
  const meta = (row.metadata || {}) as Record<string, unknown>;
  return {
    id: (row.id as string) || "",
    name: (row.name_en as string) || "",
    nameAr: (row.name_ar as string) || "",
    email: (row.email as string) || "",
    phone: (row.phone as string) || "",
    type: ((row.type as string) || (meta.type as string) || "customer") as PersonType,
    status: ((row.status as string) || (meta.status as string) || "active") as PersonStatus,
    company: (meta.company as string) || "",
    companyAr: (meta.companyAr as string) || "",
    role: (row.role_en as string) || (meta.role as string) || "",
    roleAr: (row.role_ar as string) || (meta.roleAr as string) || "",
    avatarColor: (meta.avatarColor as string) || "bg-primary/10",
    address: (meta.address as string) || "",
    addressAr: (meta.addressAr as string) || "",
    city: (meta.city as string) || "",
    cityAr: (meta.cityAr as string) || "",
    country: (meta.country as string) || "",
    countryAr: (meta.countryAr as string) || "",
    website: (meta.website as string) || "",
    linkedin: (meta.linkedin as string) || "",
    bioEn: (meta.bioEn as string) || "",
    bioAr: (meta.bioAr as string) || "",
    lastContactEn: (meta.lastContactEn as string) || "",
    lastContactAr: (meta.lastContactAr as string) || "",
    roles: (meta.roles as Person["roles"]) || [],
    metrics: (meta.metrics as Person["metrics"]) || ({ dealsClosed: 0, totalRevenue: 0, avgResponseTime: "", lastActive: "" } as any),
    activity: (meta.activity as Person["activity"]) || [],
    notes: (meta.notes as Person["notes"]) || [],
    files: (meta.files as Person["files"]) || [],
    related: (meta.related as Person["related"]) || [],
  };
}

// ─── Helper ──────────────────────────────────────────────

function formatDateEn(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch { return ""; }
}

// ─── Hook ────────────────────────────────────────────────

export function useDashboardData() {
  const { workspace } = useAuth();
  const [loading, setLoading] = useState(!isDemoMode);

  useEffect(() => {
    // Demo mode: loaders already read from localStorage/defaults
    if (isDemoMode) return;

    const wsId = workspace?.id || "";
    if (!wsId) { setLoading(false); return; }

    setLoading(true);
    const ds = getDataSource();

    Promise.all([
      ds.deals.list(wsId),
      ds.work_items.list(wsId),
      ds.invoices.list(wsId),
      ds.expenses.list(wsId),
      ds.resources.list(wsId),
      ds.organizations.list(wsId),
      ds.people.list(wsId),
    ]).then(([deals, work, inv, exp, res, orgs, ppl]) => {
      setLiveData({
        deals: (deals as Record<string, unknown>[]).map(rowToDeal),
        workItems: (work as Record<string, unknown>[]).map(rowToWorkItem),
        invoices: (inv as Record<string, unknown>[]).map(rowToInvoice),
        expenses: (exp as Record<string, unknown>[]).map(rowToExpense),
        resources: (res as Record<string, unknown>[]).map(rowToResource),
        organizations: (orgs as Record<string, unknown>[]).map(rowToOrganization),
        people: (ppl as Record<string, unknown>[]).map(rowToPerson),
      });
      setLoading(false);
    }).catch((err) => {
      console.error("[Dashboard] Failed to load live data:", err);
      setLoading(false);
    });
  }, [workspace?.id]);

  return { loading };
}
