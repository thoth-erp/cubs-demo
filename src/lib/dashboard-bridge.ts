/**
 * Dashboard Data Bridge
 *
 * Holds live data loaded from getDataSource() (Supabase).
 * The existing loader functions (loadDeals, loadWorkItems, etc.)
 * check here first — if live data exists, they return it instead
 * of their hardcoded defaults.
 *
 * This approach lets the 3,000+ lines of intelligence code
 * work unchanged — they call the same loaders, which now
 * transparently serve real data in production mode.
 */

import type { Deal } from "../data/sales";
import type { WorkItem } from "../data/work";
import type { Invoice, Expense } from "../data/finance";
import type { Resource } from "../data/resources";
import type { Organization } from "../data/organizations";
import type { Person } from "../data/people";

// ─── Module-level state ──────────────────────────────────

let _deals: Deal[] | null = null;
let _workItems: WorkItem[] | null = null;
let _invoices: Invoice[] | null = null;
let _expenses: Expense[] | null = null;
let _resources: Resource[] | null = null;
let _organizations: Organization[] | null = null;
let _people: Person[] | null = null;

// ─── Getters (used by loader functions) ──────────────────

export function getLiveDeals(): Deal[] | null { return _deals; }
export function getLiveWorkItems(): WorkItem[] | null { return _workItems; }
export function getLiveInvoices(): Invoice[] | null { return _invoices; }
export function getLiveExpenses(): Expense[] | null { return _expenses; }
export function getLiveResources(): Resource[] | null { return _resources; }
export function getLiveOrganizations(): Organization[] | null { return _organizations; }
export function getLivePeople(): Person[] | null { return _people; }

// ─── Bulk setter ─────────────────────────────────────────

export interface LiveDataBundle {
  deals: Deal[];
  workItems: WorkItem[];
  invoices: Invoice[];
  expenses: Expense[];
  resources: Resource[];
  organizations: Organization[];
  people: Person[];
}

export function setLiveData(bundle: LiveDataBundle): void {
  _deals = bundle.deals;
  _workItems = bundle.workItems;
  _invoices = bundle.invoices;
  _expenses = bundle.expenses;
  _resources = bundle.resources;
  _organizations = bundle.organizations;
  _people = bundle.people;
}

export function clearLiveData(): void {
  _deals = null;
  _workItems = null;
  _invoices = null;
  _expenses = null;
  _resources = null;
  _organizations = null;
  _people = null;
}

export function isLiveDataLoaded(): boolean {
  return _deals !== null;
}
