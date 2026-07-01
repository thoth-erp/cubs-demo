# SPRINT — Delivery & Installation Foundation

## Status: COMPLETE

## Summary

Full delivery scheduling and installation management for furniture manufacturing: delivery dispatch with status tracking (Scheduled→Loading→In Transit→Delivered), installation team assignment with 10-point bilingual checklist, snag/punch list, photo uploads, customer rating (1-5 stars), Egyptian Arabic throughout.

---

## Changed Files

### New Files
| File | Purpose |
|------|---------|
| `src/pages/DeliveryInstallation.tsx` | Full delivery & installation page (~800 lines) |
| `supabase/delivery-installation-foundation.sql` | Migration: deliveries, installations |

### Modified Files
| File | Changes |
|------|---------|
| `src/lib/database.types.ts` | +2 table types (deliveries, installations) |
| `src/lib/data-source.ts` | +2 CRUD adapters |
| `src/App.tsx` | +1 route (`/delivery`), +1 import |
| `src/components/Sidebar.tsx` | +1 nav item (التسليم والتركيب with Truck icon) |

---

## Features

### Deliveries (التسليمات)
- Delivery number, linked to Production Order
- Customer name, phone, delivery address
- Date & time slot scheduling (5 time slots)
- Driver & vehicle assignment
- Piece/package count
- Status flow: Scheduled → Loading → In Transit → Delivered / Failed
- Visual status timeline
- Detail view with info grid

### Installations (التركيبات)
- Installation number, linked to Delivery
- Customer info, site address
- Team leader + team members (comma-separated)
- 10-point bilingual checklist:
  - Site ready, pieces check, no damage, level/plumb, doors/drawers
  - Hardware, handles/knobs, worktop, cleanup, customer walkthrough
- Snag/punch list with severity (minor/major/critical) and resolve toggle
- Photo uploads to Supabase Storage (installation-photos bucket)
- Customer rating (1-5 stars)
- Status flow: Scheduled → In Progress → Completed / On Hold

### Two-Tab Interface
- Top-level tabs: Deliveries / Installations
- Dashboard stats per tab
- Search & status filters
- CSV export per tab

### Activity Events
- delivery_scheduled, delivery_delivered, installation_scheduled, installation_completed

### Egyptian Arabic
- التسليمات, التركيبات, جاري التحميل, في الطريق, تم التسليم
- جاري التركيب, تم التركيب, ملاحظات, فريق التركيب
- رئيس الفريق, السائق, السيارة, عنوان التسليم

---

## Architecture

```
Production Order (ready/packing)
    ↓ link
Delivery (deliveries)
    ├── Scheduled → Loading → In Transit → Delivered
    └── link
Installation (installations)
    ├── Team: Leader + Members
    ├── 10-point Checklist (JSONB)
    ├── Snag List (JSONB)
    ├── Photos (JSONB → Supabase Storage)
    └── Customer Rating (1-5 stars)
```

## Migration

Run `supabase/delivery-installation-foundation.sql` against your Supabase instance.

## Verification
- Vite compilation: ✅
- Route `/delivery`: ✅
- Sidebar nav: ✅
