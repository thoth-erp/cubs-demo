# SPRINT — Quality Control Foundation

## Status: COMPLETE

## Summary

Full QC inspection and defect tracking module for furniture manufacturing: inspections linked to production orders, 10-point bilingual checklist with pass/fail per item, auto-scoring, defect logging with severity/category/photos, rework workflow (open→rework→re-inspect→accept/reject), dashboard stats, CSV export, Egyptian Arabic.

---

## Changed Files

### New Files
| File | Purpose |
|------|---------|
| `src/pages/QualityControl.tsx` | Full QC page (~500 lines) |
| `supabase/quality-control-foundation.sql` | Migration: qc_inspections, qc_defects |

### Modified Files
| File | Changes |
|------|---------|
| `src/lib/database.types.ts` | +2 table types (qc_inspections, qc_defects) |
| `src/lib/data-source.ts` | +2 CRUD adapters |
| `src/App.tsx` | +1 route (`/quality`), +1 import |
| `src/components/Sidebar.tsx` | +1 nav item (مراقبة الجودة with ShieldCheck icon) |

---

## Features

### QC Inspections (فحوصات الجودة)
- Inspection number, type (in-process/pre-assembly/final/pre-delivery/re-inspection)
- Link to Production Order and Customer
- Inspector assignment
- Status flow: Pending → In Progress → Passed/Failed/Conditional
- Dashboard stats: pending, in progress, passed, failed/conditional

### 10-Point Bilingual Checklist
- Dimensions, Surface, Edges, Color, Hardware, Assembly, Finish, Functionality, Cleanliness, Packaging
- Pass/Fail toggle per item with green/red visual feedback
- Auto-calculated overall score (percentage)

### Defect Logging (سجل العيوب)
- Defect number, title, description, location
- Severity: Critical (حرج), Major (كبير), Minor (صغير), Cosmetic (تجميلي)
- Categories: Dimension, Surface, Material, Assembly, Finish, Hardware, Edge, Color, Other
- Photo upload to Supabase Storage (qc-photos bucket)
- Rework workflow: Open → Rework → Re-Inspected → Accepted/Rejected

### Integration
- Production Orders linked via production_order_id
- Sales Orders linked via sales_order_id
- Activity events: qc_created, qc_passed, qc_failed

### Egyptian Arabic
- مراقبة الجودة, فحص الجودة, سجل العيوب
- مقاسات, سطح, كنار, لون, إكسسوارات, تجميع, دهان
- حرج, كبير, صغير, تجميلي
- مفتوح, جاري الإصلاح, تم إعادة الفحص, مقبول, مرفوض

---

## Architecture

```
Production Order (production_orders)
    ↓ link
QC Inspection (qc_inspections)
    ├── 10-point Checklist (JSONB) → auto-score
    └── Defects (qc_defects)
         └── Rework workflow: Open → Rework → Re-inspect → Accept/Reject
```

## Migration

Run `supabase/quality-control-foundation.sql` against your Supabase instance.

## Verification
- Vite compilation: ✅
- Route `/quality`: ✅
- Sidebar nav: ✅
