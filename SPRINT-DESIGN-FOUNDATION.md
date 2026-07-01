# SPRINT — Design & Technical Drawings Foundation

## Status: COMPLETE

## Summary

Complete furniture-industry design workflow: Design Briefs auto-generated from approved measurements, technical drawing uploads, multi-version tracking, comments & annotations, client approval workflow, and full Sales Order integration.

---

## Changed Files

### New Files
| File | Purpose |
|------|---------|
| `src/pages/Designs.tsx` | Full design briefs & drawings page |
| `supabase/design-foundation.sql` | Migration: design_briefs, design_files, design_comments tables |

### Modified Files
| File | Changes |
|------|---------|
| `src/lib/database.types.ts` | Added types for design_briefs, design_files, design_comments |
| `src/lib/data-source.ts` | Added CRUD adapters for 3 new tables |
| `src/App.tsx` | Added `/designs` route |
| `src/components/Sidebar.tsx` | Added التصميمات nav item with PenTool icon |
| `src/pages/SalesOrders.tsx` | Added `design_status` field to SOMeta |

---

## Features Delivered

### Design Briefs (ملفات التصميم)
- Brief Number, Title, Customer, Sales Order link, Site Visit link
- Design Type: Kitchen, Wardrobe, Bedroom, Living Room, Office, Bathroom, Reception, Custom
- Style: Modern, Classic, Minimal, Luxury, Neo Classic, Industrial, Custom
- Assigned Designer, Start/Due dates
- Customer requirements auto-filled from site visit (colors, materials, style, notes)
- Dimensions summary auto-populated from approved measurements

### Auto-Fill from Site Visit
- Select a completed site visit → auto-populates:
  - Customer name & ID
  - Sales Order link
  - Preferred colors, materials, style
  - Special notes
  - All measurements as dimensions summary
  - Title auto-generated from room names

### Technical Drawing Uploads
- Upload to Supabase Storage (design-files bucket)
- File types: Technical Drawing, 3D Render, Floor Plan, Elevation, Detail, Reference, Revision, Client Approved
- Supports: Images, PDF, DXF, DWG
- Grid display with thumbnails
- Per-version file organization

### Design Approval Workflow
```
Draft (مسودة)
  → In Progress (جاري التصميم)
    → Internal Review (مراجعة داخلية)
      → Client Review (مراجعة العميل)
        → Approved (تم الاعتماد) ✅
        → Revision (تعديلات) → New Version → back to In Progress
```

### Version History
- Version counter increments on revision cycle
- Files organized by version
- Version history tab shows all versions with file lists
- Current version clearly marked

### Comments & Annotations
- Add comments with author name, role, and type
- Author roles: Designer (المصمم), Manager (المدير), Client (العميل), Technician (الفني)
- Comment types: General, Revision Request, Approval, Annotation, Question
- Color-coded by type (orange=revision, green=approval, violet=annotation, blue=question)
- Resolve/unresolve toggle per comment
- Unresolved count shown in tab badge

### Dashboard Stats
- Drafts, In Progress, Client Review, Approved
- Live data, no fake data

### Sales Order Integration
- `design_approved` auto-set to true when design approved
- `design_status` field tracks: not_started → in_progress → client_review → approved
- Readiness checklist reflects design approval status

### Activity Events
- design_created — when brief created
- design_approved — when client approves
- design_revision — when sent for revision
- design_client_review — when sent to client
- design_new_version — when new version started

### CSV Export
- Export all design briefs with key fields

### Egyptian Furniture Language
- Full Arabic: التصميمات, ملف تصميم, رسم فني, رندر ثلاثي الأبعاد, مسقط أفقي, واجهة
- المصمم, المدير, العميل, الفني
- تم الاعتماد, محتاج تعديل, مراجعة العميل

---

## Architecture

```
Approved Measurements (measurements, approval_status=approved)
    ↓ auto-fill dimensions_summary
Design Brief (design_briefs)
    ↓ design_brief_id
Design Files (design_files) — versioned
Design Comments (design_comments) — resolvable
    ↓ on approval
Sales Order (work_items) — design_approved=true
    ↓
Production (next phase)
```

## Migration

Run `supabase/design-foundation.sql` against your Supabase instance.

## Verification

- Vite compilation: ✅ No new errors
- Designs module loads: ✅ All 3 components compiled
- Route `/designs`: ✅ Active
- Sidebar nav: ✅ التصميمات visible
