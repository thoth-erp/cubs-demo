# SPRINT — Advanced Features

## Status: COMPLETE

## Summary

Five-tool advanced module: per-order cost analysis with 6 cost types, profit margin reports with per-order breakdown, print-ready document generator for invoices, mobile-optimized workshop production board, and multi-branch management (factory/showroom/warehouse/office). Egyptian Arabic throughout.

---

## Changed Files

### New Files
| File | Purpose |
|------|---------|
| `src/pages/AdvancedTools.tsx` | Five-tab advanced tools page (~700 lines) |
| `supabase/advanced-features-foundation.sql` | Migration: cost_entries, branches |

### Modified Files
| File | Changes |
|------|---------|
| `src/lib/database.types.ts` | +2 table types (cost_entries, branches) |
| `src/lib/data-source.ts` | +2 CRUD adapters |
| `src/App.tsx` | +1 route (`/tools`), +1 import |
| `src/components/Sidebar.tsx` | +1 nav item (أدوات متقدمة with Wrench icon) |

---

## Features

### 1. Cost Analysis (تحليل التكاليف)
- 6 cost types: Material (خامات), Labor (عمالة), Overhead (مصاريف عامة), Subcontract (مقاولة باطن), Transport (نقل), Other
- Per-entry: description, quantity, unit cost, auto-calculated total
- Link to Sales Order and/or Production Order
- Supplier tracking
- Summary cards per cost type
- Filter by type, CSV export, delete entries

### 2. Profit Reports (تقارير الأرباح)
- Revenue vs. Costs vs. Gross Profit vs. Margin %
- Health indicators: Healthy (≥20%), Fair (≥10%), Low (<10%)
- Visual cost breakdown bar chart (percentage per type)
- Per-order profit table: revenue, cost, profit, margin for each sales order

### 3. Document Generator (المستندات)
- Select any sales order to generate print-ready invoice/statement
- THOTH-branded header with date
- Customer and order info
- Cost line items table with totals
- Browser print via `window.print()`

### 4. Workshop Board (لوحة الورشة)
- 7-column production stage board: Cutting → Edgebanding → Drilling → Assembly → Finishing → QC → Packing
- Color-coded columns
- Order cards with PO number, title, customer
- Count per stage, overflow indicator
- Summary bar with stage totals

### 5. Branch Management (الفروع)
- Branch code, bilingual name, address, phone, manager
- 4 types: Factory (مصنع), Showroom (معرض), Warehouse (مخزن), Office (مكتب)
- Active/inactive status
- Create, edit, delete
- Grid layout with type badges

### Egyptian Arabic
- تحليل التكاليف, تقارير الأرباح, المستندات, لوحة الورشة, الفروع
- خامات, عمالة, مصاريف عامة, مقاولة باطن, نقل
- إيراد, تكلفة, صافي الربح, هامش الربح
- مصنع, معرض, مخزن, مكتب

---

## Architecture

```
Sales Order (work_items)
    ├── Revenue (total_amount)
    └── Cost Entries (cost_entries)
         ├── Material / Labor / Overhead / Subcontract / Transport / Other
         └── Linked to Production Order (optional)

Branches (branches)
    └── Factory / Showroom / Warehouse / Office

Workshop Board
    └── Reads production_orders → groups by status stage
```

## Migration

Run `supabase/advanced-features-foundation.sql` against your Supabase instance.

## Verification
- Vite compilation: ✅
- Route `/tools`: ✅
- Sidebar nav: ✅
