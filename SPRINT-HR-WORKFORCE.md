# SPRINT — HR & Workforce Foundation

## Status: COMPLETE

## Summary

Full HR module for furniture manufacturing: employee directory with profiles, 9 departments, 12-skill matrix with proficiency levels, daily attendance tracking (check-in/out, overtime), leave request workflow with approval/rejection, two-tab interface, CSV export, Egyptian Arabic.

---

## Changed Files

### New Files
| File | Purpose |
|------|---------|
| `src/pages/HRWorkforce.tsx` | Full HR page (~700 lines) |
| `supabase/hr-workforce-foundation.sql` | Migration: employees, attendance, leave_requests |

### Modified Files
| File | Changes |
|------|---------|
| `src/lib/database.types.ts` | +3 table types (employees, attendance, leave_requests) |
| `src/lib/data-source.ts` | +3 CRUD adapters |
| `src/App.tsx` | +1 route (`/hr`), +1 import |
| `src/components/Sidebar.tsx` | +1 nav item (الموارد البشرية with Users icon) |

---

## Features

### Employees (الموظفين)
- Employee number, bilingual names (EN/AR)
- 9 departments: Production, Finishing, Assembly, Design, Sales, Admin, Warehouse, Delivery, Management
- Job title (EN/AR), employment type (full-time/part-time/contract/daily)
- Status: Active, On Leave, Suspended, Terminated
- Contact info, emergency contact, address
- Salary with type (monthly/weekly/daily/hourly)
- Department filter, search, CSV export

### Skills Matrix (المهارات)
- 12 furniture manufacturing skills:
  CNC Operator, Edge Banding, Painting/Finish, Assembly, Cutting, Drilling, Upholstery, Installation, Design/CAD, Quality Control, Driving, Supervision
- Proficiency levels 1-5 per skill
- Add/remove skills, adjust levels

### Attendance (الحضور)
- Daily check-in/check-out with timestamps
- Status: Present, Absent, Late, Half Day, Holiday, Sick Leave, Annual Leave, Excused
- Overtime hours tracking
- Quick attendance marking from employee detail

### Leave Requests (الإجازات)
- Types: Annual, Sick, Unpaid, Emergency, Maternity, Other
- Auto-calculated days from date range
- Approval workflow: Pending → Approved/Rejected
- Approve/Reject buttons in leave list

### Egyptian Arabic
- الموارد البشرية, الموظفين, الحضور والانصراف, الإجازات
- الإنتاج, التشطيب, التجميع, التصميم, المبيعات, الإدارة
- مشغل CNC, كنار, دهان, تقطيع, تخريم, تنجيد, تركيب
- حاضر, غائب, متأخر, نص يوم, إجازة مرضية, إجازة سنوية

---

## Architecture

```
Employee (employees)
    ├── Skills Matrix (JSONB) — 12 skills × 5 levels
    ├── Attendance (attendance) — daily records
    │    └── Check-in/out, status, overtime
    └── Leave Requests (leave_requests)
         └── Pending → Approved/Rejected
```

## Migration

Run `supabase/hr-workforce-foundation.sql` against your Supabase instance.

## Verification
- Vite compilation: ✅
- Route `/hr`: ✅
- Sidebar nav: ✅
