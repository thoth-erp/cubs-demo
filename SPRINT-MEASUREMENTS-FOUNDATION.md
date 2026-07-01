# SPRINT — Measurements & Site Visits Foundation

## Status: COMPLETE

## Summary

Complete furniture-industry workflow for Site Visits, Measurements, Room Data, and Customer Approvals. This bridges Sales Order → Measurements → Design → Production.

---

## Changed Files

### New Files
| File | Purpose |
|------|---------|
| `src/pages/SiteVisits.tsx` | Full site visits & measurements page (Parts 1-12) |
| `supabase/measurements-foundation.sql` | Migration: site_visits, measurements, measurement_attachments tables |
| `.claude/launch.json` | Dev server config |

### Modified Files
| File | Changes |
|------|---------|
| `src/lib/database.types.ts` | Added TypeScript types for site_visits, measurements, measurement_attachments |
| `src/lib/data-source.ts` | Added CRUD adapters for site_visits, measurements, measurement_attachments |
| `src/lib/csv-export.ts` | Added site_visits CSV import template |
| `src/App.tsx` | Added SiteVisits route at `/site-visits` |
| `src/components/Sidebar.tsx` | Added المعاينات nav item with MapPin icon |
| `src/pages/SalesOrders.tsx` | Added `measurements_status` field to SOMeta |

---

## Features Delivered

### Part 1 — Site Visits Module (المعاينات)
- Visit Number, Customer, Sales Order, Site Address, Assigned Technician, Visit Date, Status, Notes
- Statuses: Scheduled (مجدولة) → In Progress (جارية) → Completed (مكتملة) / Cancelled (ملغية)

### Part 2 — Measurements Record (المقاسات)
- Width, Height, Depth, Length, Ceiling Height per entry
- Unlimited entries per visit (Kitchen Wall A, Wardrobe Area, etc.)

### Part 3 — Rooms & Areas
- Room types: Kitchen (مطبخ), Bedroom (غرفة نوم), Living Room (غرفة معيشة), Office (مكتب), Reception (ريسبشن), Bathroom (حمام), Custom Area (منطقة مخصصة)
- Measurements grouped by room with visual room headers

### Part 4 — Photos & Attachments
- File upload to Supabase Storage (site-visit-photos bucket)
- Types: Site Photo, Measurement Photo, Reference Image, Notes Image
- Grid display with thumbnails

### Part 5 — Customer Requirements
- Preferred Colors, Materials, Style (Modern/Classic/Minimal/Luxury/Custom)
- Special Notes, Installation Notes
- Captured during visit creation and editable

### Part 6 — Site Visit Checklist
- Default checklist: Measurements captured, Photos captured, Electrical points, Plumbing, Access route, Installation conditions
- Toggle-able items with progress counter
- Configurable (stored as JSON)

### Part 7 — Approval Workflow
- Measurement statuses: Draft (مسودة) → Submitted (تم الإرسال) → Approved (تم اعتماد المقاسات) / Needs Revision (محتاجة تعديل)
- Submit, Approve, Revision, Resubmit actions per measurement
- Only approved measurements move forward

### Part 8 — Dashboard Integration
- Stats cards: Scheduled, In Progress, Completed, This Week
- Live data from Supabase, no fake data

### Part 9 — Sales Order Integration
- measurements_status field: not_started → scheduled → completed → approved
- Auto-updates when visit completed or measurements approved
- Readiness checklist reflects measurement status

### Part 10 — CSV Import/Export
- Export Site Visits CSV
- Export Measurements CSV
- Download import template

### Part 11 — Activity Events
- site_visit_scheduled — logged on visit creation
- site_visit_completed — logged on status change
- measurements_approved — logged on approval
- measurements_revised — logged on needs_revision

### Part 12 — Egyptian Furniture Language
- Full Arabic translations: معاينة, المقاسات, الفني, غرفة, منطقة, تم اعتماد المقاسات, محتاجة تعديل
- Bilingual UI throughout

### Part 13 — Data Model
- `site_visits` table with RLS, indexes, updated_at trigger
- `measurements` table with approval workflow fields
- `measurement_attachments` table with file type classification
- Storage bucket with upload/read policies
- Multi-tenant (workspace_id on all tables)

### Part 14 — Testing
- Dev server: `pnpm dev --host 0.0.0.0 --port 5174` ✅
- Vite compilation: ✅ No new errors
- SiteVisits module loads: ✅ All 4 components compiled
- Data-source adapters: ✅ site_visits registered
- Route `/site-visits`: ✅ Active
- Sidebar nav: ✅ المعاينات visible

---

## Architecture

```
Sales Order (work_items, type=sales_order)
    ↓ sales_order_id
Site Visit (site_visits)
    ↓ site_visit_id
Measurements (measurements)
    ↓ measurement_id / site_visit_id
Attachments (measurement_attachments)
```

## Migration

Run `supabase/measurements-foundation.sql` against your Supabase instance to create tables.
