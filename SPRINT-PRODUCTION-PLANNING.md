# SPRINT — Production Planning Foundation

## Status: COMPLETE

## Summary

Complete furniture manufacturing production workflow: Production Orders created from approved designs, Cutting Lists with full part specifications (material, dimensions, edge banding, grain direction, CNC programs), 7-stage production line with Start/Done controls, auto-calculated time tracking and progress, and timeline visualization.

---

## Changed Files

### New Files
| File | Purpose |
|------|---------|
| `src/pages/ProductionPlanning.tsx` | Full production planning page (~750 lines) |
| `supabase/production-planning-foundation.sql` | Migration: production_orders, cutting_list_items, production_stage_log |

### Modified Files
| File | Changes |
|------|---------|
| `src/lib/database.types.ts` | +3 table types |
| `src/lib/data-source.ts` | +3 CRUD adapters |
| `src/App.tsx` | +1 route (`/production`) |
| `src/components/Sidebar.tsx` | +1 nav item (تخطيط الإنتاج with Factory icon) |

---

## Features

### Production Orders (أوامر التشغيل)
- PO Number, Title, Customer, Sales Order link, Design Brief link
- Auto-fill from approved design briefs
- Station/Workshop assignment
- Priority: Critical, Urgent, High, Medium, Low
- Start/Due dates, progress tracking

### 7-Stage Production Line
```
Pending → Cutting (التقطيع) → Edgebanding (الكنار) → Drilling (التخريم) →
Assembly (التجميع) → Finishing (الدهان/التشطيب) → Quality Check (مراقبة الجودة) →
Packing (التغليف) → Ready (جاهز للتسليم) → Delivered (تم التسليم)
```
- Sequential stage progression (can't skip stages)
- Start/Done buttons per stage
- Visual indicators: pending (gray), in-progress (blue pulse), completed (green)
- Auto-creates all 7 stage log entries on PO creation

### Cutting List (قائمة التقطيع)
- Part name, Material, Thickness, Width, Length, Quantity
- Edge banding: Top, Bottom, Left, Right
- Grain direction: Horizontal, Vertical, None
- CNC program reference
- Checkbox to mark pieces as completed
- Table view with sortable columns

### Time Tracking
- Auto-calculated duration per stage (start → done)
- Total production time
- Timeline view with visual connector dots

### Dashboard Stats
- Pending, Active (in any manufacturing stage), Ready, Overdue
- Live data from Supabase

### Activity Events
- production_created, production_stage_started, production_completed

### CSV Export
- Export all production orders

### Egyptian Furniture Language
- التقطيع, الكنار, التخريم, التجميع, الدهان/التشطيب, مراقبة الجودة, التغليف
- أمر تشغيل, قائمة التقطيع, خط الإنتاج

---

## Architecture

```
Approved Design (design_briefs, status=approved)
    ↓ auto-fill
Production Order (production_orders)
    ├── Cutting List (cutting_list_items) — per piece
    └── Stage Log (production_stage_log) — 7 stages auto-created
         Cutting → Edgebanding → Drilling → Assembly →
         Finishing → QC → Packing → Ready
```

## Migration

Run `supabase/production-planning-foundation.sql` against your Supabase instance.

## Verification
- Vite compilation: ✅
- All 4 components: ✅ (POModal, CuttingModal, PODetail, ProductionPlanning)
- Route `/production`: ✅
- Sidebar nav: ✅
