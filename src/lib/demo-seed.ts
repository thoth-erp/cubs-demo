/**
 * Demo Seed Data — بيانات تجريبية للعرض
 *
 * Realistic fashion/garment manufacturing data that tells a coherent story:
 * Customers → Consultations → Measurements → Designs → Production → QC → Delivery → Fitting
 *
 * All IDs are stable and cross-referenced across entities.
 * Linked to existing demo organizations (o02 Meridian, o03 Al-Noor) and deals.
 */

import type { Database } from "./database.types";

type T<K extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][K]["Row"];

const W = "demo";
const now = new Date().toISOString();
const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
const ts = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString();

// ─── Branches ────────────────────────────────────────────

export const DEMO_BRANCHES: T<"branches">[] = [
  {
    id: "br-01", workspace_id: W, branch_code: "HQ", name: "Main Atelier", name_ar: "المشغل الرئيسي",
    address: "Industrial Area, Riyadh", phone: "+966-11-200-1000", manager_name: "Ahmad Khalil",
    branch_type: "factory", is_active: true, metadata: {}, created_at: ts(180), updated_at: ts(5),
  },
  {
    id: "br-02", workspace_id: W, branch_code: "SH1", name: "Showroom Olaya", name_ar: "معرض العليا",
    address: "Olaya St, Riyadh", phone: "+966-11-200-2000", manager_name: "Sara Ahmed",
    branch_type: "showroom", is_active: true, metadata: {}, created_at: ts(180), updated_at: ts(10),
  },
  {
    id: "br-03", workspace_id: W, branch_code: "WH1", name: "Warehouse North", name_ar: "مخزن الشمال",
    address: "Northern Ring, Riyadh", phone: "+966-11-200-3000", manager_name: "Fahd Mansour",
    branch_type: "warehouse", is_active: true, metadata: {}, created_at: ts(150), updated_at: ts(15),
  },
];

// ─── Employees ───────────────────────────────────────────

export const DEMO_EMPLOYEES: T<"employees">[] = [
  {
    id: "emp-01", workspace_id: W, employee_number: "E-001", full_name: "Ahmad Khalil", full_name_ar: "أحمد خليل",
    phone: "+966-55-001-0001", email: "ahmad@demo.com", national_id: null,
    department: "management", job_title: "Factory Manager", job_title_ar: "مدير المصنع",
    employment_type: "full_time", status: "active", hire_date: d(730), termination_date: null,
    salary: 18000, salary_type: "monthly", photo_url: null,
    emergency_contact: "Khalid Khalil", emergency_phone: "+966-55-999-0001",
    address: "Riyadh, King Fahd District", skills: ["management", "planning", "quality"], documents: [],
    notes: null, metadata: {}, created_at: ts(730), updated_at: ts(5),
  },
  {
    id: "emp-02", workspace_id: W, employee_number: "E-002", full_name: "Omar Hassan", full_name_ar: "عمر حسن",
    phone: "+966-55-001-0002", email: "omar@demo.com", national_id: null,
    department: "production", job_title: "Senior Pattern Maker", job_title_ar: "خبير نمذجة",
    employment_type: "full_time", status: "active", hire_date: d(540), termination_date: null,
    salary: 8500, salary_type: "monthly", photo_url: null,
    emergency_contact: null, emergency_phone: null,
    address: "Riyadh", skills: ["cutting", "assembly", "edgebanding", "cnc"], documents: [],
    notes: null, metadata: {}, created_at: ts(540), updated_at: ts(2),
  },
  {
    id: "emp-03", workspace_id: W, employee_number: "E-003", full_name: "Youssef Ali", full_name_ar: "يوسف علي",
    phone: "+966-55-001-0003", email: "youssef@demo.com", national_id: null,
    department: "production", job_title: "Sewing Machine Operator", job_title_ar: "مشغل ماكينة خياطة",
    employment_type: "full_time", status: "active", hire_date: d(365), termination_date: null,
    salary: 7000, salary_type: "monthly", photo_url: null,
    emergency_contact: null, emergency_phone: null,
    address: "Riyadh", skills: ["cnc", "drilling", "programming"], documents: [],
    notes: null, metadata: {}, created_at: ts(365), updated_at: ts(3),
  },
  {
    id: "emp-04", workspace_id: W, employee_number: "E-004", full_name: "Fatima Nasser", full_name_ar: "فاطمة ناصر",
    phone: "+966-55-001-0004", email: "fatima@demo.com", national_id: null,
    department: "design", job_title: "Fashion Designer", job_title_ar: "مصممة أزياء",
    employment_type: "full_time", status: "active", hire_date: d(450), termination_date: null,
    salary: 10000, salary_type: "monthly", photo_url: null,
    emergency_contact: null, emergency_phone: null,
    address: "Riyadh", skills: ["autocad", "3dmax", "design", "client-management"], documents: [],
    notes: null, metadata: {}, created_at: ts(450), updated_at: ts(1),
  },
  {
    id: "emp-05", workspace_id: W, employee_number: "E-005", full_name: "Hassan Younis", full_name_ar: "حسن يونس",
    phone: "+966-55-001-0005", email: "hassan@demo.com", national_id: null,
    department: "delivery", job_title: "Logistics Coordinator", job_title_ar: "منسق اللوجستيات",
    employment_type: "full_time", status: "active", hire_date: d(300), termination_date: null,
    salary: 6500, salary_type: "monthly", photo_url: null,
    emergency_contact: null, emergency_phone: null,
    address: "Riyadh", skills: ["driving", "installation", "logistics"], documents: [],
    notes: null, metadata: {}, created_at: ts(300), updated_at: ts(8),
  },
  {
    id: "emp-06", workspace_id: W, employee_number: "E-006", full_name: "Khaled Mansour", full_name_ar: "خالد منصور",
    phone: "+966-55-001-0006", email: "khaled@demo.com", national_id: null,
    department: "production", job_title: "Finishing Specialist", job_title_ar: "أخصائي التشطيبات",
    employment_type: "full_time", status: "active", hire_date: d(200), termination_date: null,
    salary: 7500, salary_type: "monthly", photo_url: null,
    emergency_contact: null, emergency_phone: null,
    address: "Riyadh", skills: ["painting", "lacquer", "finishing", "polishing"], documents: [],
    notes: null, metadata: {}, created_at: ts(200), updated_at: ts(4),
  },
  {
    id: "emp-07", workspace_id: W, employee_number: "E-007", full_name: "Nadia Ibrahim", full_name_ar: "نادية إبراهيم",
    phone: "+966-55-001-0007", email: "nadia@demo.com", national_id: null,
    department: "sales", job_title: "Sales Executive", job_title_ar: "مسؤولة مبيعات",
    employment_type: "full_time", status: "active", hire_date: d(400), termination_date: null,
    salary: 9000, salary_type: "monthly", photo_url: null,
    emergency_contact: null, emergency_phone: null,
    address: "Riyadh", skills: ["sales", "crm", "client-relations"], documents: [],
    notes: null, metadata: {}, created_at: ts(400), updated_at: ts(6),
  },
  {
    id: "emp-08", workspace_id: W, employee_number: "E-008", full_name: "Rami Saad", full_name_ar: "رامي سعد",
    phone: "+966-55-001-0008", email: "rami@demo.com", national_id: null,
    department: "production", job_title: "Garment Technician", job_title_ar: "فني ملابس",
    employment_type: "full_time", status: "active", hire_date: d(260), termination_date: null,
    salary: 6000, salary_type: "monthly", photo_url: null,
    emergency_contact: null, emergency_phone: null,
    address: "Riyadh", skills: ["assembly", "hardware", "alignment"], documents: [],
    notes: null, metadata: {}, created_at: ts(260), updated_at: ts(7),
  },
  {
    id: "emp-09", workspace_id: W, employee_number: "E-009", full_name: "Layla Qasim", full_name_ar: "ليلى قاسم",
    phone: "+966-55-001-0009", email: "layla@demo.com", national_id: null,
    department: "admin", job_title: "QC Inspector", job_title_ar: "مفتشة جودة",
    employment_type: "full_time", status: "active", hire_date: d(320), termination_date: null,
    salary: 8000, salary_type: "monthly", photo_url: null,
    emergency_contact: null, emergency_phone: null,
    address: "Riyadh", skills: ["quality-control", "inspection", "reporting"], documents: [],
    notes: null, metadata: {}, created_at: ts(320), updated_at: ts(3),
  },
  {
    id: "emp-10", workspace_id: W, employee_number: "E-010", full_name: "Tariq Zaki", full_name_ar: "طارق زكي",
    phone: "+966-55-001-0010", email: "tariq@demo.com", national_id: null,
    department: "warehouse", job_title: "Warehouse Keeper", job_title_ar: "أمين المخزن",
    employment_type: "full_time", status: "active", hire_date: d(280), termination_date: null,
    salary: 5500, salary_type: "monthly", photo_url: null,
    emergency_contact: null, emergency_phone: null,
    address: "Riyadh", skills: ["inventory", "logistics", "forklift"], documents: [],
    notes: null, metadata: {}, created_at: ts(280), updated_at: ts(9),
  },
  {
    id: "emp-11", workspace_id: W, employee_number: "E-011", full_name: "Salman Rizq", full_name_ar: "سلمان رزق",
    phone: "+966-55-001-0011", email: null, national_id: null,
    department: "production", job_title: "Embroidery Specialist", job_title_ar: "أخصائي تطريز",
    employment_type: "daily", status: "active", hire_date: d(90), termination_date: null,
    salary: 200, salary_type: "daily", photo_url: null,
    emergency_contact: null, emergency_phone: null,
    address: null, skills: ["edgebanding"], documents: [],
    notes: null, metadata: {}, created_at: ts(90), updated_at: ts(10),
  },
  {
    id: "emp-12", workspace_id: W, employee_number: "E-012", full_name: "Mona Saleh", full_name_ar: "منى صالح",
    phone: "+966-55-001-0012", email: "mona@demo.com", national_id: null,
    department: "admin", job_title: "HR Coordinator", job_title_ar: "منسقة موارد بشرية",
    employment_type: "full_time", status: "on_leave", hire_date: d(500), termination_date: null,
    salary: 7000, salary_type: "monthly", photo_url: null,
    emergency_contact: null, emergency_phone: null,
    address: "Riyadh", skills: ["hr", "payroll", "administration"], documents: [],
    notes: "Currently on annual leave", metadata: {}, created_at: ts(500), updated_at: ts(1),
  },
];

// ─── Attendance (last 7 days for all active employees) ───

function generateAttendance(): T<"attendance">[] {
  const rows: T<"attendance">[] = [];
  const active = DEMO_EMPLOYEES.filter(e => e.status === "active");
  for (let day = 0; day < 7; day++) {
    const date = d(day);
    const isWeekend = [5, 6].includes(new Date(date).getDay()); // Fri-Sat
    if (isWeekend) continue;
    for (const emp of active) {
      const absent = day === 3 && emp.id === "emp-08"; // Rami absent 3 days ago
      const late = day === 1 && emp.id === "emp-11";   // Salman late yesterday
      rows.push({
        id: `att-${emp.id}-${day}`, workspace_id: W, employee_id: emp.id,
        date,
        check_in: absent ? null : late ? `${date}T09:22:00` : `${date}T07:${String(50 + Math.floor(Math.random() * 10)).slice(0, 2)}:00`,
        check_out: absent ? null : day === 0 ? null : `${date}T16:${String(30 + Math.floor(Math.random() * 30)).slice(0, 2)}:00`,
        status: absent ? "absent" : late ? "late" : "present",
        overtime_hours: day === 2 && emp.department === "production" ? 2 : 0,
        notes: absent ? "No call no show" : null,
        metadata: {}, created_at: ts(day), updated_at: ts(day),
      });
    }
  }
  return rows;
}

export const DEMO_ATTENDANCE = generateAttendance();

// ─── Leave Requests ──────────────────────────────────────

export const DEMO_LEAVE_REQUESTS: T<"leave_requests">[] = [
  {
    id: "lv-01", workspace_id: W, employee_id: "emp-12", leave_type: "annual",
    start_date: d(5), end_date: d(-9), days: 14, reason: "Annual family vacation",
    status: "approved", approved_by: "Ahmad Khalil", approved_at: ts(20),
    metadata: {}, created_at: ts(25), updated_at: ts(20),
  },
  {
    id: "lv-02", workspace_id: W, employee_id: "emp-08", leave_type: "sick",
    start_date: d(3), end_date: d(3), days: 1, reason: "Medical appointment",
    status: "approved", approved_by: "Ahmad Khalil", approved_at: ts(4),
    metadata: {}, created_at: ts(4), updated_at: ts(4),
  },
  {
    id: "lv-03", workspace_id: W, employee_id: "emp-05", leave_type: "annual",
    start_date: d(-14), end_date: d(-10), days: 5, reason: "Personal travel",
    status: "pending", approved_by: null, approved_at: null,
    metadata: {}, created_at: ts(2), updated_at: ts(2),
  },
  {
    id: "lv-04", workspace_id: W, employee_id: "emp-04", leave_type: "sick",
    start_date: d(30), end_date: d(29), days: 2, reason: "Flu recovery",
    status: "approved", approved_by: "Ahmad Khalil", approved_at: ts(31),
    metadata: {}, created_at: ts(32), updated_at: ts(31),
  },
];

// ─── Site Visits ─────────────────────────────────────────

export const DEMO_SITE_VISITS: T<"site_visits">[] = [
  {
    id: "sv-01", workspace_id: W, visit_number: "SV-2026-001",
    sales_order_id: null, customer_id: "o02", customer_name: "Meridian Trading",
    site_address: "King Fahd Rd, Al-Olaya District, Riyadh", assigned_technician: "Hassan Younis",
    visit_date: d(45), status: "completed",
    notes: "Full kitchen + master bedroom wardrobe measurement",
    preferred_colors: "White, Warm Grey", preferred_materials: "MDF Lacquer, HPL",
    preferred_style: "modern", special_notes: "Client wants handleless design for kitchen",
    installation_notes: "Elevator access, 3rd floor. Parking available.",
    checklist: [
      { id: "measurements", label_en: "Measurements captured", label_ar: "المقاسات اتاخدت", checked: true },
      { id: "photos", label_en: "Photos captured", label_ar: "الصور اتصورت", checked: true },
      { id: "electrical", label_en: "Electrical points checked", label_ar: "النقط الكهربائية اتراجعت", checked: true },
      { id: "plumbing", label_en: "Plumbing checked", label_ar: "السباكة اتراجعت", checked: true },
      { id: "access", label_en: "Access route checked", label_ar: "مدخل التركيب اتراجع", checked: true },
      { id: "installation", label_en: "Installation conditions reviewed", label_ar: "ظروف التركيب اتراجعت", checked: true },
    ],
    metadata: {}, created_at: ts(45), updated_at: ts(44),
  },
  {
    id: "sv-02", workspace_id: W, visit_number: "SV-2026-002",
    sales_order_id: null, customer_id: "o03", customer_name: "Al-Noor Furniture",
    site_address: "Prince Sultan Rd, Al-Sulaimaniyah, Riyadh", assigned_technician: "Hassan Younis",
    visit_date: d(30), status: "completed",
    notes: "Office reception + CEO office furniture",
    preferred_colors: "Dark Walnut, Black", preferred_materials: "Veneer, Solid Wood",
    preferred_style: "luxury", special_notes: "CEO wants integrated cable management in desk",
    installation_notes: "Ground floor, wide entrance. Coordinate with building security.",
    checklist: [
      { id: "measurements", label_en: "Measurements captured", label_ar: "المقاسات اتاخدت", checked: true },
      { id: "photos", label_en: "Photos captured", label_ar: "الصور اتصورت", checked: true },
      { id: "electrical", label_en: "Electrical points checked", label_ar: "النقط الكهربائية اتراجعت", checked: true },
      { id: "plumbing", label_en: "Plumbing checked", label_ar: "السباكة اتراجعت", checked: false },
      { id: "access", label_en: "Access route checked", label_ar: "مدخل التركيب اتراجع", checked: true },
      { id: "installation", label_en: "Installation conditions reviewed", label_ar: "ظروف التركيب اتراجعت", checked: true },
    ],
    metadata: {}, created_at: ts(30), updated_at: ts(29),
  },
  {
    id: "sv-03", workspace_id: W, visit_number: "SV-2026-003",
    sales_order_id: null, customer_id: null, customer_name: "Mohammed Al-Rashidi",
    site_address: "Al-Yasmin District, Villa 42, Riyadh", assigned_technician: "Nadia Ibrahim",
    visit_date: d(10), status: "completed",
    notes: "Full villa project — kitchen, 3 bedrooms, living room TV unit",
    preferred_colors: "Beige, Cream, Gold accents", preferred_materials: "MDF, HPL, Acrylic",
    preferred_style: "classic", special_notes: "Client budget ~150K SAR total",
    installation_notes: "Villa, easy ground-floor access",
    checklist: [
      { id: "measurements", label_en: "Measurements captured", label_ar: "المقاسات اتاخدت", checked: true },
      { id: "photos", label_en: "Photos captured", label_ar: "الصور اتصورت", checked: true },
      { id: "electrical", label_en: "Electrical points checked", label_ar: "النقط الكهربائية اتراجعت", checked: true },
      { id: "plumbing", label_en: "Plumbing checked", label_ar: "السباكة اتراجعت", checked: true },
      { id: "access", label_en: "Access route checked", label_ar: "مدخل التركيب اتراجع", checked: true },
      { id: "installation", label_en: "Installation conditions reviewed", label_ar: "ظروف التركيب اتراجعت", checked: true },
    ],
    metadata: {}, created_at: ts(10), updated_at: ts(9),
  },
  {
    id: "sv-04", workspace_id: W, visit_number: "SV-2026-004",
    sales_order_id: null, customer_id: null, customer_name: "Layla Al-Harthi",
    site_address: "Al-Narjis District, Apt 7B, Riyadh", assigned_technician: "Hassan Younis",
    visit_date: d(3), status: "scheduled",
    notes: "Kitchen renovation — small apartment",
    preferred_colors: null, preferred_materials: null,
    preferred_style: null, special_notes: "Reschedule if building maintenance blocks access",
    installation_notes: null,
    checklist: [
      { id: "measurements", label_en: "Measurements captured", label_ar: "المقاسات اتاخدت", checked: false },
      { id: "photos", label_en: "Photos captured", label_ar: "الصور اتصورت", checked: false },
      { id: "electrical", label_en: "Electrical points checked", label_ar: "النقط الكهربائية اتراجعت", checked: false },
      { id: "plumbing", label_en: "Plumbing checked", label_ar: "السباكة اتراجعت", checked: false },
      { id: "access", label_en: "Access route checked", label_ar: "مدخل التركيب اتراجع", checked: false },
      { id: "installation", label_en: "Installation conditions reviewed", label_ar: "ظروف التركيب اتراجعت", checked: false },
    ],
    metadata: {}, created_at: ts(5), updated_at: ts(3),
  },
  {
    id: "sv-05", workspace_id: W, visit_number: "SV-2026-005",
    sales_order_id: null, customer_id: "o02", customer_name: "Meridian Trading",
    site_address: "Tahlia St, Meridian Branch Office, Jeddah", assigned_technician: "Nadia Ibrahim",
    visit_date: d(1), status: "in_progress",
    notes: "Branch office renovation — reception + 4 workstations",
    preferred_colors: "Brand Blue, White", preferred_materials: "Melamine, Steel Frame",
    preferred_style: "modern", special_notes: "Must match existing Meridian brand colours",
    installation_notes: null,
    checklist: [
      { id: "measurements", label_en: "Measurements captured", label_ar: "المقاسات اتاخدت", checked: true },
      { id: "photos", label_en: "Photos captured", label_ar: "الصور اتصورت", checked: true },
      { id: "electrical", label_en: "Electrical points checked", label_ar: "النقط الكهربائية اتراجعت", checked: false },
      { id: "plumbing", label_en: "Plumbing checked", label_ar: "السباكة اتراجعت", checked: false },
      { id: "access", label_en: "Access route checked", label_ar: "مدخل التركيب اتراجع", checked: false },
      { id: "installation", label_en: "Installation conditions reviewed", label_ar: "ظروف التركيب اتراجعت", checked: false },
    ],
    metadata: {}, created_at: ts(3), updated_at: ts(1),
  },
];

// ─── Measurements ────────────────────────────────────────

export const DEMO_MEASUREMENTS: T<"measurements">[] = [
  // SV-01: Meridian kitchen + bedroom
  {
    id: "ms-01", workspace_id: W, site_visit_id: "sv-01", room_name: "Kitchen",
    room_type: "kitchen", label: "Main Kitchen", width: 4200, height: 2700, depth: 600, length: 3800,
    ceiling_height: 2800, notes: "L-shaped layout. Plumbing on left wall.",
    approval_status: "approved", approved_by: "Ahmad Khalil", approved_at: ts(43),
    metadata: {}, created_at: ts(44), updated_at: ts(43),
  },
  {
    id: "ms-02", workspace_id: W, site_visit_id: "sv-01", room_name: "Master Bedroom",
    room_type: "bedroom", label: "Master Wardrobe Wall", width: 3600, height: 2500, depth: 600, length: null,
    ceiling_height: 2800, notes: "Full wall wardrobe with sliding doors",
    approval_status: "approved", approved_by: "Ahmad Khalil", approved_at: ts(43),
    metadata: {}, created_at: ts(44), updated_at: ts(43),
  },
  // SV-02: Al-Noor office
  {
    id: "ms-03", workspace_id: W, site_visit_id: "sv-02", room_name: "Reception Area",
    room_type: "reception", label: "Main Reception Desk", width: 3000, height: 1100, depth: 700, length: 5000,
    ceiling_height: 3200, notes: "Curved front panel with integrated lighting",
    approval_status: "approved", approved_by: "Ahmad Khalil", approved_at: ts(28),
    metadata: {}, created_at: ts(29), updated_at: ts(28),
  },
  {
    id: "ms-04", workspace_id: W, site_visit_id: "sv-02", room_name: "CEO Office",
    room_type: "office", label: "Executive Desk + Credenza", width: 2400, height: 760, depth: 900, length: 6000,
    ceiling_height: 3200, notes: "L-desk with return. Cable management required.",
    approval_status: "approved", approved_by: "Ahmad Khalil", approved_at: ts(28),
    metadata: {}, created_at: ts(29), updated_at: ts(28),
  },
  // SV-03: Villa project
  {
    id: "ms-05", workspace_id: W, site_visit_id: "sv-03", room_name: "Kitchen",
    room_type: "kitchen", label: "Villa Kitchen", width: 5000, height: 2700, depth: 650, length: 4500,
    ceiling_height: 3000, notes: "U-shaped with island. Gas connection on right wall.",
    approval_status: "submitted", approved_by: null, approved_at: null,
    metadata: {}, created_at: ts(9), updated_at: ts(8),
  },
  {
    id: "ms-06", workspace_id: W, site_visit_id: "sv-03", room_name: "Master Bedroom",
    room_type: "bedroom", label: "Walk-in Closet", width: 3200, height: 2500, depth: 600, length: 2800,
    ceiling_height: 3000, notes: "His & hers sections with center island",
    approval_status: "submitted", approved_by: null, approved_at: null,
    metadata: {}, created_at: ts(9), updated_at: ts(8),
  },
  {
    id: "ms-07", workspace_id: W, site_visit_id: "sv-03", room_name: "Living Room",
    room_type: "living_room", label: "TV Unit Wall", width: 4000, height: 2200, depth: 450, length: null,
    ceiling_height: 3000, notes: "Full wall entertainment unit with fireplace cutout",
    approval_status: "draft", approved_by: null, approved_at: null,
    metadata: {}, created_at: ts(9), updated_at: ts(9),
  },
  // SV-05: Meridian Jeddah branch
  {
    id: "ms-08", workspace_id: W, site_visit_id: "sv-05", room_name: "Reception",
    room_type: "reception", label: "Branch Reception Counter", width: 2400, height: 1050, depth: 600, length: 3000,
    ceiling_height: 2800, notes: "Compact L-shaped counter",
    approval_status: "draft", approved_by: null, approved_at: null,
    metadata: {}, created_at: ts(1), updated_at: ts(1),
  },
];

// ─── Design Briefs ───────────────────────────────────────

export const DEMO_DESIGN_BRIEFS: T<"design_briefs">[] = [
  {
    id: "db-01", workspace_id: W, brief_number: "DB-2026-001", title: "Meridian Kitchen — Modern Handleless",
    sales_order_id: null, site_visit_id: "sv-01", customer_id: "o02", customer_name: "Meridian Trading",
    assigned_designer: "Fatima Nasser", design_type: "kitchen", style: "modern",
    dimensions_summary: { rooms: ["Kitchen 4200x3800mm L-shaped"] },
    preferred_colors: "White, Warm Grey", preferred_materials: "MDF Lacquer, HPL",
    special_notes: "Handleless push-to-open. Soft-close Blum hinges.",
    status: "approved", version: 2, approved_by: "Ahmad Khalil", approved_at: ts(35),
    revision_notes: "V1 had wrong hob cutout size, revised in V2",
    start_date: d(42), due_date: d(35), completed_date: d(36),
    metadata: {}, created_at: ts(42), updated_at: ts(35),
  },
  {
    id: "db-02", workspace_id: W, brief_number: "DB-2026-002", title: "Al-Noor CEO Office Suite",
    sales_order_id: null, site_visit_id: "sv-02", customer_id: "o03", customer_name: "Al-Noor Furniture",
    assigned_designer: "Fatima Nasser", design_type: "office", style: "luxury",
    dimensions_summary: { rooms: ["Executive Desk 2400x900mm", "Reception 3000x5000mm curved"] },
    preferred_colors: "Dark Walnut, Black", preferred_materials: "Veneer, Solid Wood",
    special_notes: "Integrated cable management. Hidden wireless charger in desk surface.",
    status: "in_progress", version: 1, approved_by: null, approved_at: null,
    revision_notes: null,
    start_date: d(25), due_date: d(15), completed_date: null,
    metadata: {}, created_at: ts(25), updated_at: ts(5),
  },
  {
    id: "db-03", workspace_id: W, brief_number: "DB-2026-003", title: "Meridian Master Wardrobe",
    sales_order_id: null, site_visit_id: "sv-01", customer_id: "o02", customer_name: "Meridian Trading",
    assigned_designer: "Fatima Nasser", design_type: "wardrobe", style: "modern",
    dimensions_summary: { rooms: ["Full wall wardrobe 3600x2500mm"] },
    preferred_colors: "White, Warm Grey", preferred_materials: "MDF Lacquer",
    special_notes: "Sliding doors with soft-close. LED strip inside.",
    status: "approved", version: 1, approved_by: "Ahmad Khalil", approved_at: ts(38),
    revision_notes: null,
    start_date: d(41), due_date: d(36), completed_date: d(38),
    metadata: {}, created_at: ts(41), updated_at: ts(38),
  },
  {
    id: "db-04", workspace_id: W, brief_number: "DB-2026-004", title: "Al-Rashidi Villa Kitchen",
    sales_order_id: null, site_visit_id: "sv-03", customer_id: null, customer_name: "Mohammed Al-Rashidi",
    assigned_designer: "Fatima Nasser", design_type: "kitchen", style: "classic",
    dimensions_summary: { rooms: ["U-kitchen 5000x4500mm with island"] },
    preferred_colors: "Beige, Cream, Gold accents", preferred_materials: "MDF, HPL, Acrylic",
    special_notes: "Classic door profile with gold handles. Island with breakfast bar.",
    status: "client_review", version: 1, approved_by: null, approved_at: null,
    revision_notes: null,
    start_date: d(7), due_date: d(2), completed_date: null,
    metadata: {}, created_at: ts(7), updated_at: ts(2),
  },
  {
    id: "db-05", workspace_id: W, brief_number: "DB-2026-005", title: "Al-Noor Reception Counter",
    sales_order_id: null, site_visit_id: "sv-02", customer_id: "o03", customer_name: "Al-Noor Furniture",
    assigned_designer: "Fatima Nasser", design_type: "reception", style: "luxury",
    dimensions_summary: { rooms: ["Curved reception 3000x5000mm"] },
    preferred_colors: "Dark Walnut, Black, Brass accents", preferred_materials: "Veneer, Corian top",
    special_notes: "Curved front with backlit logo panel. ADA-compliant height section.",
    status: "internal_review", version: 1, approved_by: null, approved_at: null,
    revision_notes: null,
    start_date: d(20), due_date: d(12), completed_date: null,
    metadata: {}, created_at: ts(20), updated_at: ts(6),
  },
];

// ─── Design Files ────────────────────────────────────────

export const DEMO_DESIGN_FILES: T<"design_files">[] = [
  { id: "df-01", workspace_id: W, design_brief_id: "db-01", file_url: "#", file_name: "Meridian-Kitchen-V2-Plan.dwg", file_type: "technical_drawing", file_format: "dwg", file_size: 2450000, version: 2, notes: "Final approved floor plan", metadata: {}, created_at: ts(36), updated_at: ts(36) },
  { id: "df-02", workspace_id: W, design_brief_id: "db-01", file_url: "#", file_name: "Meridian-Kitchen-V2-3D.png", file_type: "3d_render", file_format: "png", file_size: 8200000, version: 2, notes: "3D render for client approval", metadata: {}, created_at: ts(36), updated_at: ts(36) },
  { id: "df-03", workspace_id: W, design_brief_id: "db-01", file_url: "#", file_name: "Meridian-Kitchen-Elevation-A.pdf", file_type: "elevation", file_format: "pdf", file_size: 1800000, version: 2, notes: "Wall A elevation with dimensions", metadata: {}, created_at: ts(36), updated_at: ts(36) },
  { id: "df-04", workspace_id: W, design_brief_id: "db-02", file_url: "#", file_name: "AlNoor-CEO-Desk-V1.dwg", file_type: "technical_drawing", file_format: "dwg", file_size: 1900000, version: 1, notes: "Executive desk with cable management detail", metadata: {}, created_at: ts(18), updated_at: ts(18) },
  { id: "df-05", workspace_id: W, design_brief_id: "db-02", file_url: "#", file_name: "AlNoor-CEO-Office-3D.png", file_type: "3d_render", file_format: "png", file_size: 6500000, version: 1, notes: null, metadata: {}, created_at: ts(18), updated_at: ts(18) },
  { id: "df-06", workspace_id: W, design_brief_id: "db-03", file_url: "#", file_name: "Meridian-Wardrobe-Plan.dwg", file_type: "technical_drawing", file_format: "dwg", file_size: 1600000, version: 1, notes: "Full wall wardrobe floor plan", metadata: {}, created_at: ts(39), updated_at: ts(39) },
  { id: "df-07", workspace_id: W, design_brief_id: "db-04", file_url: "#", file_name: "AlRashidi-Kitchen-V1-3D.png", file_type: "3d_render", file_format: "png", file_size: 9100000, version: 1, notes: "Awaiting client feedback", metadata: {}, created_at: ts(4), updated_at: ts(4) },
  { id: "df-08", workspace_id: W, design_brief_id: "db-05", file_url: "#", file_name: "AlNoor-Reception-Concept.pdf", file_type: "reference", file_format: "pdf", file_size: 3200000, version: 1, notes: "Concept mood board + sketches", metadata: {}, created_at: ts(15), updated_at: ts(15) },
];

// ─── Design Comments ─────────────────────────────────────

export const DEMO_DESIGN_COMMENTS: T<"design_comments">[] = [
  { id: "dc-01", workspace_id: W, design_brief_id: "db-01", author_name: "Fatima Nasser", author_role: "designer", comment: "V1 complete — please review the hob and sink positions", comment_type: "general", resolved: true, metadata: {}, created_at: ts(40), updated_at: ts(40) },
  { id: "dc-02", workspace_id: W, design_brief_id: "db-01", author_name: "Ahmad Khalil", author_role: "manager", comment: "Hob cutout is 580mm but spec says 560mm. Please revise.", comment_type: "revision_request", resolved: true, metadata: {}, created_at: ts(39), updated_at: ts(37) },
  { id: "dc-03", workspace_id: W, design_brief_id: "db-01", author_name: "Fatima Nasser", author_role: "designer", comment: "Fixed in V2. All cutouts verified against appliance specs.", comment_type: "general", resolved: true, metadata: {}, created_at: ts(37), updated_at: ts(37) },
  { id: "dc-04", workspace_id: W, design_brief_id: "db-01", author_name: "Ahmad Khalil", author_role: "manager", comment: "Approved. Good to go to production.", comment_type: "approval", resolved: false, metadata: {}, created_at: ts(35), updated_at: ts(35) },
  { id: "dc-05", workspace_id: W, design_brief_id: "db-02", author_name: "Fatima Nasser", author_role: "designer", comment: "Desk cable channel routing — need input on preferred orientation", comment_type: "question", resolved: false, metadata: {}, created_at: ts(15), updated_at: ts(15) },
  { id: "dc-06", workspace_id: W, design_brief_id: "db-04", author_name: "Mohammed Al-Rashidi", author_role: "client", comment: "Can we make the island slightly bigger? We need 4 bar stools.", comment_type: "revision_request", resolved: false, metadata: {}, created_at: ts(1), updated_at: ts(1) },
];

// ─── Production Orders ───────────────────────────────────

export const DEMO_PRODUCTION_ORDERS: T<"production_orders">[] = [
  {
    id: "po-01", workspace_id: W, po_number: "PO-2026-001", title: "Meridian Kitchen — Modern Handleless",
    sales_order_id: null, design_brief_id: "db-01", customer_id: "o02", customer_name: "Meridian Trading",
    assigned_station: "Station A", assigned_workers: ["Omar Hassan", "Youssef Ali"],
    priority: "high", start_date: d(30), due_date: d(10), completed_date: null,
    status: "finishing", current_stage: "finishing", progress: 75,
    materials_summary: { sheets: 18, edgeband_meters: 45, hardware_sets: 3, hinges: 28, slides: 12 },
    notes: "Push-to-open system — verify Blum tip-on compatibility",
    metadata: {}, created_at: ts(30), updated_at: ts(2),
  },
  {
    id: "po-02", workspace_id: W, po_number: "PO-2026-002", title: "Meridian Master Wardrobe",
    sales_order_id: null, design_brief_id: "db-03", customer_id: "o02", customer_name: "Meridian Trading",
    assigned_station: "Station B", assigned_workers: ["Omar Hassan", "Rami Saad"],
    priority: "medium", start_date: d(28), due_date: d(12), completed_date: null,
    status: "assembly", current_stage: "assembly", progress: 60,
    materials_summary: { sheets: 12, edgeband_meters: 30, sliding_doors: 3, led_strips: 2, hinges: 8 },
    notes: "Sliding door tracks from supplier — confirm delivery",
    metadata: {}, created_at: ts(28), updated_at: ts(3),
  },
  {
    id: "po-03", workspace_id: W, po_number: "PO-2026-003", title: "Al-Noor Reception Counter (Curved)",
    sales_order_id: null, design_brief_id: "db-05", customer_id: "o03", customer_name: "Al-Noor Furniture",
    assigned_station: "Station A", assigned_workers: ["Omar Hassan", "Khaled Mansour"],
    priority: "urgent", start_date: d(15), due_date: d(5), completed_date: null,
    status: "cutting", current_stage: "cutting", progress: 20,
    materials_summary: { sheets: 8, veneer_sqm: 12, corian_sqm: 4, hardware_sets: 1 },
    notes: "Curved panels — CNC routing required. Corian top from external supplier.",
    metadata: {}, created_at: ts(15), updated_at: ts(1),
  },
  {
    id: "po-04", workspace_id: W, po_number: "PO-2026-004", title: "Villa Al-Rashidi TV Unit",
    sales_order_id: null, design_brief_id: null, customer_id: null, customer_name: "Mohammed Al-Rashidi",
    assigned_station: null, assigned_workers: [],
    priority: "low", start_date: null, due_date: d(-5), completed_date: null,
    status: "pending", current_stage: null, progress: 0,
    materials_summary: {},
    notes: "Waiting for design approval. Classic profile moulding needed.",
    metadata: {}, created_at: ts(5), updated_at: ts(5),
  },
  {
    id: "po-05", workspace_id: W, po_number: "PO-2025-098", title: "Residential Kitchen — Al-Hamra Villa",
    sales_order_id: null, design_brief_id: null, customer_id: null, customer_name: "Faisal Al-Hamra",
    assigned_station: "Station A", assigned_workers: ["Omar Hassan", "Rami Saad", "Khaled Mansour"],
    priority: "high", start_date: d(60), due_date: d(35), completed_date: d(33),
    status: "ready", current_stage: "packing", progress: 100,
    materials_summary: { sheets: 22, edgeband_meters: 55, hardware_sets: 4, hinges: 36, slides: 16 },
    notes: "Complete — awaiting delivery scheduling",
    metadata: {}, created_at: ts(60), updated_at: ts(33),
  },
];

// ─── Cutting List Items ──────────────────────────────────

export const DEMO_CUTTING_ITEMS: T<"cutting_list_items">[] = [
  // PO-01: Meridian Kitchen
  { id: "cl-01", workspace_id: W, production_order_id: "po-01", piece_number: 1, part_name: "Base Cabinet Side", material: "White MDF 18mm", thickness: 18, width: 580, length: 720, qty: 12, edge_top: "1mm White", edge_bottom: null, edge_left: "1mm White", edge_right: null, grain_direction: "none", cnc_program: null, notes: null, completed: true, metadata: {}, created_at: ts(29), updated_at: ts(25) },
  { id: "cl-02", workspace_id: W, production_order_id: "po-01", piece_number: 2, part_name: "Base Cabinet Bottom", material: "White MDF 18mm", thickness: 18, width: 560, length: 580, qty: 6, edge_top: "1mm White", edge_bottom: "1mm White", edge_left: null, edge_right: null, grain_direction: "none", cnc_program: null, notes: null, completed: true, metadata: {}, created_at: ts(29), updated_at: ts(25) },
  { id: "cl-03", workspace_id: W, production_order_id: "po-01", piece_number: 3, part_name: "Wall Cabinet Door", material: "White Lacquer MDF 18mm", thickness: 18, width: 400, length: 720, qty: 10, edge_top: null, edge_bottom: null, edge_left: null, edge_right: null, grain_direction: "none", cnc_program: "DOOR-PUSH-01", notes: "Push-to-open, no handle bore", completed: true, metadata: {}, created_at: ts(29), updated_at: ts(22) },
  { id: "cl-04", workspace_id: W, production_order_id: "po-01", piece_number: 4, part_name: "Countertop Panel", material: "HPL Grey 30mm", thickness: 30, width: 620, length: 4200, qty: 1, edge_top: "2mm Grey", edge_bottom: null, edge_left: "2mm Grey", edge_right: "2mm Grey", grain_direction: "horizontal", cnc_program: "HOB-CUTOUT-01", notes: "Hob cutout 560mm — confirm before cutting", completed: true, metadata: {}, created_at: ts(29), updated_at: ts(20) },
  { id: "cl-05", workspace_id: W, production_order_id: "po-01", piece_number: 5, part_name: "Tall Pantry Side", material: "White MDF 18mm", thickness: 18, width: 580, length: 2200, qty: 2, edge_top: "1mm White", edge_bottom: null, edge_left: "1mm White", edge_right: null, grain_direction: "vertical", cnc_program: null, notes: null, completed: true, metadata: {}, created_at: ts(29), updated_at: ts(24) },
  // PO-03: Al-Noor Reception
  { id: "cl-06", workspace_id: W, production_order_id: "po-03", piece_number: 1, part_name: "Curved Front Panel", material: "Walnut Veneer MDF 18mm", thickness: 18, width: 1100, length: 2500, qty: 2, edge_top: null, edge_bottom: null, edge_left: null, edge_right: null, grain_direction: "horizontal", cnc_program: "CURVE-RECEPTION-01", notes: "CNC curved routing — verify template", completed: false, metadata: {}, created_at: ts(14), updated_at: ts(14) },
  { id: "cl-07", workspace_id: W, production_order_id: "po-03", piece_number: 2, part_name: "Counter Top Surface", material: "Corian Glacier White 12mm", thickness: 12, width: 700, length: 3000, qty: 1, edge_top: null, edge_bottom: null, edge_left: null, edge_right: null, grain_direction: "none", cnc_program: null, notes: "External supplier — Corian fabrication", completed: false, metadata: {}, created_at: ts(14), updated_at: ts(14) },
  { id: "cl-08", workspace_id: W, production_order_id: "po-03", piece_number: 3, part_name: "Internal Shelf", material: "Walnut Veneer MDF 18mm", thickness: 18, width: 400, length: 900, qty: 6, edge_top: "Walnut 1mm", edge_bottom: null, edge_left: "Walnut 1mm", edge_right: null, grain_direction: "horizontal", cnc_program: null, notes: null, completed: false, metadata: {}, created_at: ts(14), updated_at: ts(14) },
];

// ─── Production Stage Log ────────────────────────────────

export const DEMO_STAGE_LOG: T<"production_stage_log">[] = [
  // PO-01 stages
  { id: "sl-01", workspace_id: W, production_order_id: "po-01", stage: "cutting", status: "completed", started_at: ts(30), completed_at: ts(27), duration_minutes: 480, worker_name: "Omar Hassan", station: "Station A", notes: null, metadata: {}, created_at: ts(30), updated_at: ts(27) },
  { id: "sl-02", workspace_id: W, production_order_id: "po-01", stage: "edgebanding", status: "completed", started_at: ts(27), completed_at: ts(24), duration_minutes: 360, worker_name: "Salman Rizq", station: "Edge Station", notes: null, metadata: {}, created_at: ts(27), updated_at: ts(24) },
  { id: "sl-03", workspace_id: W, production_order_id: "po-01", stage: "drilling", status: "completed", started_at: ts(24), completed_at: ts(21), duration_minutes: 300, worker_name: "Youssef Ali", station: "CNC-1", notes: "Push-to-open drilling pattern applied", metadata: {}, created_at: ts(24), updated_at: ts(21) },
  { id: "sl-04", workspace_id: W, production_order_id: "po-01", stage: "assembly", status: "completed", started_at: ts(21), completed_at: ts(16), duration_minutes: 720, worker_name: "Rami Saad", station: "Station A", notes: null, metadata: {}, created_at: ts(21), updated_at: ts(16) },
  { id: "sl-05", workspace_id: W, production_order_id: "po-01", stage: "finishing", status: "in_progress", started_at: ts(16), completed_at: null, duration_minutes: null, worker_name: "Khaled Mansour", station: "Finishing Bay", notes: "Lacquer spray coat 1 of 2 done", metadata: {}, created_at: ts(16), updated_at: ts(2) },
  // PO-02 stages
  { id: "sl-06", workspace_id: W, production_order_id: "po-02", stage: "cutting", status: "completed", started_at: ts(28), completed_at: ts(26), duration_minutes: 300, worker_name: "Omar Hassan", station: "Station B", notes: null, metadata: {}, created_at: ts(28), updated_at: ts(26) },
  { id: "sl-07", workspace_id: W, production_order_id: "po-02", stage: "edgebanding", status: "completed", started_at: ts(26), completed_at: ts(23), duration_minutes: 240, worker_name: "Salman Rizq", station: "Edge Station", notes: null, metadata: {}, created_at: ts(26), updated_at: ts(23) },
  { id: "sl-08", workspace_id: W, production_order_id: "po-02", stage: "drilling", status: "completed", started_at: ts(23), completed_at: ts(20), duration_minutes: 180, worker_name: "Youssef Ali", station: "CNC-1", notes: null, metadata: {}, created_at: ts(23), updated_at: ts(20) },
  { id: "sl-09", workspace_id: W, production_order_id: "po-02", stage: "assembly", status: "in_progress", started_at: ts(20), completed_at: null, duration_minutes: null, worker_name: "Rami Saad", station: "Station B", notes: "Waiting for sliding door tracks", metadata: {}, created_at: ts(20), updated_at: ts(3) },
  // PO-03 stages
  { id: "sl-10", workspace_id: W, production_order_id: "po-03", stage: "cutting", status: "in_progress", started_at: ts(3), completed_at: null, duration_minutes: null, worker_name: "Omar Hassan", station: "Station A", notes: "Curved panels in progress", metadata: {}, created_at: ts(3), updated_at: ts(1) },
  // PO-05 stages (completed)
  { id: "sl-11", workspace_id: W, production_order_id: "po-05", stage: "cutting", status: "completed", started_at: ts(58), completed_at: ts(55), duration_minutes: 540, worker_name: "Omar Hassan", station: "Station A", notes: null, metadata: {}, created_at: ts(58), updated_at: ts(55) },
  { id: "sl-12", workspace_id: W, production_order_id: "po-05", stage: "packing", status: "completed", started_at: ts(36), completed_at: ts(34), duration_minutes: 180, worker_name: "Tariq Zaki", station: "Packing Bay", notes: "22 packages ready", metadata: {}, created_at: ts(36), updated_at: ts(34) },
];

// ─── QC Inspections ──────────────────────────────────────

export const DEMO_QC_INSPECTIONS: T<"qc_inspections">[] = [
  {
    id: "qc-01", workspace_id: W, inspection_number: "QC-2026-001",
    production_order_id: "po-01", sales_order_id: null, customer_name: "Meridian Trading",
    inspector_name: "Layla Qasim", inspection_type: "in_process", status: "passed",
    checklist: [
      { item: "Panel dimensions within tolerance (±1mm)", passed: true },
      { item: "Edge banding adhesion", passed: true },
      { item: "Surface finish quality", passed: true },
      { item: "Drill hole alignment", passed: true },
    ],
    overall_score: 92, result_notes: "All panels within spec. Minor edge chip on piece #7 — acceptable.",
    inspected_at: ts(18), metadata: {}, created_at: ts(18), updated_at: ts(18),
  },
  {
    id: "qc-02", workspace_id: W, inspection_number: "QC-2026-002",
    production_order_id: "po-02", sales_order_id: null, customer_name: "Meridian Trading",
    inspector_name: "Layla Qasim", inspection_type: "pre_assembly", status: "conditional",
    checklist: [
      { item: "Panel dimensions within tolerance (±1mm)", passed: true },
      { item: "Edge banding adhesion", passed: true },
      { item: "Surface finish quality", passed: false },
      { item: "Hardware fitment", passed: true },
    ],
    overall_score: 78, result_notes: "Surface scratch on one wardrobe side panel. Needs touch-up before assembly.",
    inspected_at: ts(19), metadata: {}, created_at: ts(19), updated_at: ts(19),
  },
  {
    id: "qc-03", workspace_id: W, inspection_number: "QC-2025-045",
    production_order_id: "po-05", sales_order_id: null, customer_name: "Faisal Al-Hamra",
    inspector_name: "Layla Qasim", inspection_type: "final", status: "passed",
    checklist: [
      { item: "All pieces accounted for", passed: true },
      { item: "Doors & drawers aligned", passed: true },
      { item: "Hardware functioning", passed: true },
      { item: "Surface finish quality", passed: true },
      { item: "Packaging adequate", passed: true },
    ],
    overall_score: 96, result_notes: "Excellent quality. Ready for delivery.",
    inspected_at: ts(34), metadata: {}, created_at: ts(34), updated_at: ts(34),
  },
  {
    id: "qc-04", workspace_id: W, inspection_number: "QC-2026-003",
    production_order_id: "po-03", sales_order_id: null, customer_name: "Al-Noor Furniture",
    inspector_name: "Layla Qasim", inspection_type: "in_process", status: "pending",
    checklist: [],
    overall_score: null, result_notes: null,
    inspected_at: null, metadata: {}, created_at: ts(1), updated_at: ts(1),
  },
];

// ─── QC Defects ──────────────────────────────────────────

export const DEMO_QC_DEFECTS: T<"qc_defects">[] = [
  {
    id: "qd-01", workspace_id: W, inspection_id: "qc-01", defect_number: "DEF-001",
    title: "Minor edge chip on base panel #7", severity: "cosmetic", category: "edge",
    description: "Small chip on bottom edge of base cabinet side panel. Not visible when installed.",
    location: "Base Cabinet #7, bottom edge", photo_url: null,
    status: "accepted", rework_notes: "Accepted — not visible in final installation",
    reworked_by: null, reworked_at: null,
    metadata: {}, created_at: ts(18), updated_at: ts(18),
  },
  {
    id: "qd-02", workspace_id: W, inspection_id: "qc-02", defect_number: "DEF-002",
    title: "Surface scratch on wardrobe side panel", severity: "minor", category: "surface",
    description: "15cm scratch on outer face of left side panel. Likely from handling during edgebanding.",
    location: "Wardrobe Left Side, outer face", photo_url: null,
    status: "rework", rework_notes: "Sand and re-lacquer affected area",
    reworked_by: "Khaled Mansour", reworked_at: null,
    metadata: {}, created_at: ts(19), updated_at: ts(15),
  },
  {
    id: "qd-03", workspace_id: W, inspection_id: "qc-02", defect_number: "DEF-003",
    title: "Edge banding slight gap on shelf", severity: "cosmetic", category: "edge",
    description: "0.5mm gap between edge band and substrate on one internal shelf",
    location: "Internal shelf #3", photo_url: null,
    status: "re_inspected", rework_notes: "Re-applied edge band. Passed re-inspection.",
    reworked_by: "Salman Rizq", reworked_at: ts(16),
    metadata: {}, created_at: ts(19), updated_at: ts(16),
  },
];

// ─── Deliveries ──────────────────────────────────────────

export const DEMO_DELIVERIES: T<"deliveries">[] = [
  {
    id: "del-01", workspace_id: W, delivery_number: "DEL-2025-045",
    production_order_id: "po-05", sales_order_id: null,
    customer_name: "Faisal Al-Hamra", customer_phone: "+966-55-444-1234",
    delivery_address: "Al-Hamra District, Villa 18, Riyadh",
    delivery_date: d(30), delivery_time_slot: "09:00-12:00",
    driver_name: "Hassan Younis", vehicle_info: "Truck 3-ton (Plate: 1234 ABC)",
    status: "delivered",
    loading_notes: "22 packages. Handle tall pantry panels carefully.",
    delivery_notes: "Client signed. All pieces confirmed.",
    recipient_name: "Faisal Al-Hamra", recipient_phone: "+966-55-444-1234",
    delivered_at: ts(30), delivery_photo_url: null,
    num_pieces: 38, num_packages: 22,
    metadata: {}, created_at: ts(32), updated_at: ts(30),
  },
  {
    id: "del-02", workspace_id: W, delivery_number: "DEL-2026-001",
    production_order_id: "po-01", sales_order_id: null,
    customer_name: "Meridian Trading", customer_phone: "+966-55-222-1000",
    delivery_address: "King Fahd Rd, Al-Olaya District, Riyadh",
    delivery_date: d(-3), delivery_time_slot: "10:00-13:00",
    driver_name: "Hassan Younis", vehicle_info: "Truck 3-ton (Plate: 1234 ABC)",
    status: "scheduled",
    loading_notes: null, delivery_notes: null,
    recipient_name: null, recipient_phone: null,
    delivered_at: null, delivery_photo_url: null,
    num_pieces: 31, num_packages: 18,
    metadata: {}, created_at: ts(5), updated_at: ts(2),
  },
  {
    id: "del-03", workspace_id: W, delivery_number: "DEL-2026-002",
    production_order_id: "po-02", sales_order_id: null,
    customer_name: "Meridian Trading", customer_phone: "+966-55-222-1000",
    delivery_address: "King Fahd Rd, Al-Olaya District, Riyadh",
    delivery_date: d(-5), delivery_time_slot: "14:00-17:00",
    driver_name: null, vehicle_info: null,
    status: "scheduled",
    loading_notes: null, delivery_notes: null,
    recipient_name: null, recipient_phone: null,
    delivered_at: null, delivery_photo_url: null,
    num_pieces: 24, num_packages: 14,
    metadata: {}, created_at: ts(3), updated_at: ts(3),
  },
];

// ─── Installations ───────────────────────────────────────

export const DEMO_INSTALLATIONS: T<"installations">[] = [
  {
    id: "ins-01", workspace_id: W, installation_number: "INS-2025-045",
    delivery_id: "del-01", sales_order_id: null,
    customer_name: "Faisal Al-Hamra", customer_phone: "+966-55-444-1234",
    site_address: "Al-Hamra District, Villa 18, Riyadh",
    scheduled_date: d(29), scheduled_time_slot: "08:00-17:00",
    team_leader: "Hassan Younis", team_members: ["Rami Saad", "Omar Hassan"],
    status: "completed",
    checklist: [
      { id: "site_ready", label_en: "Site is ready & clean", passed: true, notes: "" },
      { id: "pieces_check", label_en: "All pieces accounted for", passed: true, notes: "" },
      { id: "no_damage", label_en: "No transport damage", passed: true, notes: "" },
      { id: "level_plumb", label_en: "Units level and plumb", passed: true, notes: "" },
      { id: "doors_drawers", label_en: "Doors & drawers aligned", passed: true, notes: "" },
      { id: "hardware", label_en: "All hardware installed", passed: true, notes: "" },
      { id: "handles", label_en: "Handles & knobs fitted", passed: true, notes: "" },
      { id: "worktop", label_en: "Worktop fitted & sealed", passed: true, notes: "" },
      { id: "cleanup", label_en: "Site cleaned after install", passed: true, notes: "" },
      { id: "walkthrough", label_en: "Customer walkthrough done", passed: true, notes: "" },
    ],
    snag_list: [],
    completion_notes: "Installed in one day. Client very satisfied.",
    customer_rating: 5, customer_feedback: "Excellent work, very professional team",
    signature_url: null,
    started_at: ts(29), completed_at: ts(29),
    photos: [],
    metadata: {}, created_at: ts(30), updated_at: ts(29),
  },
  {
    id: "ins-02", workspace_id: W, installation_number: "INS-2026-001",
    delivery_id: "del-02", sales_order_id: null,
    customer_name: "Meridian Trading", customer_phone: "+966-55-222-1000",
    site_address: "King Fahd Rd, Al-Olaya District, Riyadh",
    scheduled_date: d(-2), scheduled_time_slot: "09:00-18:00",
    team_leader: "Hassan Younis", team_members: ["Rami Saad"],
    status: "scheduled",
    checklist: [], snag_list: [],
    completion_notes: null, customer_rating: null, customer_feedback: null, signature_url: null,
    started_at: null, completed_at: null, photos: [],
    metadata: {}, created_at: ts(5), updated_at: ts(2),
  },
];

// ─── Cost Entries ────────────────────────────────────────

export const DEMO_COST_ENTRIES: T<"cost_entries">[] = [
  { id: "ce-01", workspace_id: W, sales_order_id: null, production_order_id: "po-01", cost_type: "material", description: "White MDF 18mm sheets x18", quantity: 18, unit_cost: 120, total_cost: 2160, currency: "SAR", date: d(30), supplier: "Saudi MDF Co.", notes: null, metadata: {}, created_at: ts(30), updated_at: ts(30) },
  { id: "ce-02", workspace_id: W, sales_order_id: null, production_order_id: "po-01", cost_type: "material", description: "White Lacquer MDF sheets x10", quantity: 10, unit_cost: 180, total_cost: 1800, currency: "SAR", date: d(30), supplier: "Saudi MDF Co.", notes: null, metadata: {}, created_at: ts(30), updated_at: ts(30) },
  { id: "ce-03", workspace_id: W, sales_order_id: null, production_order_id: "po-01", cost_type: "material", description: "HPL Grey Countertop 30mm", quantity: 1, unit_cost: 850, total_cost: 850, currency: "SAR", date: d(29), supplier: "Al-Qahtani Surfaces", notes: null, metadata: {}, created_at: ts(29), updated_at: ts(29) },
  { id: "ce-04", workspace_id: W, sales_order_id: null, production_order_id: "po-01", cost_type: "hardware", description: "Blum Tip-On hinges", quantity: 28, unit_cost: 22, total_cost: 616, currency: "SAR", date: d(28), supplier: "Blum KSA", notes: null, metadata: {}, created_at: ts(28), updated_at: ts(28) },
  { id: "ce-05", workspace_id: W, sales_order_id: null, production_order_id: "po-01", cost_type: "hardware", description: "Soft-close drawer slides", quantity: 12, unit_cost: 45, total_cost: 540, currency: "SAR", date: d(28), supplier: "Blum KSA", notes: null, metadata: {}, created_at: ts(28), updated_at: ts(28) },
  { id: "ce-06", workspace_id: W, sales_order_id: null, production_order_id: "po-01", cost_type: "labor", description: "CNC programming & setup", quantity: 1, unit_cost: 500, total_cost: 500, currency: "SAR", date: d(27), supplier: null, notes: null, metadata: {}, created_at: ts(27), updated_at: ts(27) },
  { id: "ce-07", workspace_id: W, sales_order_id: null, production_order_id: "po-02", cost_type: "material", description: "White MDF 18mm sheets x12", quantity: 12, unit_cost: 120, total_cost: 1440, currency: "SAR", date: d(28), supplier: "Saudi MDF Co.", notes: null, metadata: {}, created_at: ts(28), updated_at: ts(28) },
  { id: "ce-08", workspace_id: W, sales_order_id: null, production_order_id: "po-02", cost_type: "hardware", description: "Sliding door tracks + rollers x3", quantity: 3, unit_cost: 350, total_cost: 1050, currency: "SAR", date: d(25), supplier: "Hafele KSA", notes: "Delivery delayed 3 days", metadata: {}, created_at: ts(25), updated_at: ts(25) },
  { id: "ce-09", workspace_id: W, sales_order_id: null, production_order_id: "po-03", cost_type: "material", description: "Walnut Veneer MDF 18mm", quantity: 8, unit_cost: 280, total_cost: 2240, currency: "SAR", date: d(14), supplier: "Premium Wood KSA", notes: null, metadata: {}, created_at: ts(14), updated_at: ts(14) },
  { id: "ce-10", workspace_id: W, sales_order_id: null, production_order_id: "po-03", cost_type: "material", description: "Corian Glacier White fabrication", quantity: 4, unit_cost: 800, total_cost: 3200, currency: "SAR", date: d(12), supplier: "Corian Fabricators", notes: "External fabrication — 10 day lead", metadata: {}, created_at: ts(12), updated_at: ts(12) },
  { id: "ce-11", workspace_id: W, sales_order_id: null, production_order_id: "po-05", cost_type: "material", description: "Kitchen material bundle", quantity: 1, unit_cost: 4500, total_cost: 4500, currency: "SAR", date: d(58), supplier: "Saudi MDF Co.", notes: null, metadata: {}, created_at: ts(58), updated_at: ts(58) },
  { id: "ce-12", workspace_id: W, sales_order_id: null, production_order_id: "po-05", cost_type: "hardware", description: "Hardware bundle (hinges, slides, handles)", quantity: 1, unit_cost: 2200, total_cost: 2200, currency: "SAR", date: d(55), supplier: "Blum KSA", notes: null, metadata: {}, created_at: ts(55), updated_at: ts(55) },
];

// ─── Material Requirements ───────────────────────────────

export const DEMO_MATERIAL_REQUIREMENTS: T<"material_requirements">[] = [
  {
    id: "mr-01", workspace_id: W, source_type: "production_order", source_id: "po-01",
    material_name: "White MDF 18mm (2440x1220)", sku: "MDF-W18-2440",
    quantity_required: 18, quantity_available: 25, quantity_reserved: 18, quantity_to_purchase: 0,
    unit: "sheet", unit_cost: 120, total_cost: 2160, status: "fulfilled",
    purchase_request_id: null, inventory_item_id: null, priority: "high",
    notes: null, metadata: {}, created_at: ts(30), updated_at: ts(30),
  },
  {
    id: "mr-02", workspace_id: W, source_type: "production_order", source_id: "po-01",
    material_name: "White Lacquer MDF 18mm (2440x1220)", sku: "MDF-WL18-2440",
    quantity_required: 10, quantity_available: 6, quantity_reserved: 6, quantity_to_purchase: 4,
    unit: "sheet", unit_cost: 180, total_cost: 1800, status: "partial",
    purchase_request_id: null, inventory_item_id: null, priority: "high",
    notes: "4 sheets on order — ETA 3 days", metadata: {}, created_at: ts(30), updated_at: ts(28),
  },
  {
    id: "mr-03", workspace_id: W, source_type: "production_order", source_id: "po-03",
    material_name: "Walnut Veneer MDF 18mm (2440x1220)", sku: "MDF-WV18-2440",
    quantity_required: 8, quantity_available: 3, quantity_reserved: 3, quantity_to_purchase: 5,
    unit: "sheet", unit_cost: 280, total_cost: 2240, status: "partial",
    purchase_request_id: null, inventory_item_id: null, priority: "urgent",
    notes: "Urgent — production starting this week", metadata: {}, created_at: ts(15), updated_at: ts(3),
  },
  {
    id: "mr-04", workspace_id: W, source_type: "production_order", source_id: "po-03",
    material_name: "Corian Glacier White 12mm", sku: "COR-GW12",
    quantity_required: 4, quantity_available: 0, quantity_reserved: 0, quantity_to_purchase: 4,
    unit: "sqm", unit_cost: 800, total_cost: 3200, status: "pending",
    purchase_request_id: null, inventory_item_id: null, priority: "urgent",
    notes: "External fabricator — 10 day lead time", metadata: {}, created_at: ts(15), updated_at: ts(12),
  },
  {
    id: "mr-05", workspace_id: W, source_type: "production_order", source_id: "po-02",
    material_name: "Sliding Door Tracks 2500mm", sku: "HDW-SDT-2500",
    quantity_required: 3, quantity_available: 0, quantity_reserved: 0, quantity_to_purchase: 3,
    unit: "set", unit_cost: 350, total_cost: 1050, status: "ordered",
    purchase_request_id: null, inventory_item_id: null, priority: "medium",
    notes: "Hafele — delayed, ETA this week", metadata: {}, created_at: ts(28), updated_at: ts(8),
  },
  {
    id: "mr-06", workspace_id: W, source_type: "production_order", source_id: "po-04",
    material_name: "Classic Profile Moulding (per meter)", sku: "MOULD-CL-01",
    quantity_required: 25, quantity_available: 0, quantity_reserved: 0, quantity_to_purchase: 25,
    unit: "meter", unit_cost: 35, total_cost: 875, status: "pending",
    purchase_request_id: null, inventory_item_id: null, priority: "low",
    notes: "Not needed until design approval", metadata: {}, created_at: ts(5), updated_at: ts(5),
  },
];

// ─── Activity Events ─────────────────────────────────────

export const DEMO_ACTIVITY_EVENTS: T<"activity_events">[] = [
  { id: "ae-01", workspace_id: W, actor_id: "emp-04", action: "created", entity_type: "design_brief", entity_id: "db-01", description_en: "Created design brief DB-2026-001 for Meridian Kitchen", description_ar: "تم إنشاء ملف تصميم DB-2026-001 لمطبخ ميريديان", metadata: {}, created_at: ts(42) },
  { id: "ae-02", workspace_id: W, actor_id: "emp-01", action: "approved", entity_type: "design_brief", entity_id: "db-01", description_en: "Approved design brief DB-2026-001 (V2)", description_ar: "تم اعتماد ملف تصميم DB-2026-001 (V2)", metadata: {}, created_at: ts(35) },
  { id: "ae-03", workspace_id: W, actor_id: "emp-01", action: "created", entity_type: "production_order", entity_id: "po-01", description_en: "Created production order PO-2026-001 for Meridian Kitchen", description_ar: "تم إنشاء أمر إنتاج PO-2026-001 لمطبخ ميريديان", metadata: {}, created_at: ts(30) },
  { id: "ae-04", workspace_id: W, actor_id: "emp-02", action: "stage_completed", entity_type: "production_order", entity_id: "po-01", description_en: "Cutting stage completed for PO-2026-001", description_ar: "تم اكتمال مرحلة التقطيع لأمر PO-2026-001", metadata: {}, created_at: ts(27) },
  { id: "ae-05", workspace_id: W, actor_id: "emp-09", action: "inspected", entity_type: "qc_inspection", entity_id: "qc-01", description_en: "QC inspection QC-2026-001 passed (score: 92)", description_ar: "فحص الجودة QC-2026-001 ناجح (درجة: 92)", metadata: {}, created_at: ts(18) },
  { id: "ae-06", workspace_id: W, actor_id: "emp-05", action: "delivered", entity_type: "delivery", entity_id: "del-01", description_en: "Delivered Al-Hamra Kitchen (22 packages)", description_ar: "تم توصيل مطبخ الحمرا (22 طرد)", metadata: {}, created_at: ts(30) },
  { id: "ae-07", workspace_id: W, actor_id: "emp-05", action: "installed", entity_type: "installation", entity_id: "ins-01", description_en: "Installation completed for Al-Hamra Kitchen (5★)", description_ar: "تم تركيب مطبخ الحمرا (5★)", metadata: {}, created_at: ts(29) },
  { id: "ae-08", workspace_id: W, actor_id: "emp-04", action: "created", entity_type: "design_brief", entity_id: "db-04", description_en: "Created design brief for Al-Rashidi Villa Kitchen", description_ar: "تم إنشاء ملف تصميم لمطبخ فيلا الراشدي", metadata: {}, created_at: ts(7) },
  { id: "ae-09", workspace_id: W, actor_id: "emp-07", action: "created", entity_type: "site_visit", entity_id: "sv-05", description_en: "Scheduled site visit SV-2026-005 for Meridian Jeddah", description_ar: "تم جدولة معاينة SV-2026-005 لميريديان جدة", metadata: {}, created_at: ts(3) },
  { id: "ae-10", workspace_id: W, actor_id: "emp-02", action: "stage_started", entity_type: "production_order", entity_id: "po-03", description_en: "Started cutting for Al-Noor Reception Counter", description_ar: "بدء التقطيع لكاونتر استقبال النور", metadata: {}, created_at: ts(3) },
];

// ─── Sales Orders (work_items type=sales_order) ──────────

export const DEMO_SALES_ORDERS: T<"work_items">[] = [
  {
    id: "so-01", workspace_id: W,
    title_en: "Meridian Kitchen + Wardrobe Package", title_ar: "باكج مطبخ + دولاب ميريديان",
    type: "sales_order", status: "in_progress", priority: "high",
    assignee_id: "emp-07", parent_id: null, organization_id: "o02",
    due_date: d(10), progress: 65, tags: ["kitchen", "wardrobe"],
    metadata: {
      so_number: "SO-202601-0001", customer_type: "company",
      customer_id: "o02", customer_name: "Meridian Trading",
      contact_person: "Samir Khoury", phone: "+966-55-222-1000",
      email: "samir@meridian.com", address: "King Fahd Rd, Al-Olaya District",
      city: "Riyadh", company_name: "Meridian Trading",
      project_name: "Meridian Apartment Fit-out",
      priority: "high",
      items: [
        { id: "soi-01", product_name: "Modern Handleless Kitchen", description: "L-shaped, white lacquer, push-to-open", qty: 1, unitPrice: 42000, width: 4200, height: 2700, depth: 600, material: "MDF Lacquer", finish: "Matte White", color: "White/Grey" },
        { id: "soi-02", product_name: "Master Wardrobe — Sliding", description: "Full wall wardrobe with LED", qty: 1, unitPrice: 28000, width: 3600, height: 2500, depth: 600, material: "MDF Lacquer", finish: "Matte White", color: "White" },
      ],
      payments: [
        { id: "sp-01", amount: 21000, date: d(40), method: "bank_transfer", reference: "TRF-98231" },
        { id: "sp-02", amount: 14000, date: d(20), method: "bank_transfer", reference: "TRF-98450" },
      ],
      customer_confirmed: true, measurements_done: true, design_approved: true,
      materials_available: true, deposit_received: true,
      total_amount: 70000, total_paid: 35000, estimated_days: 35,
      manufacturing_route: "cutting → edgebanding → drilling → assembly → finishing → qc → packing",
    },
    created_at: ts(45), updated_at: ts(2),
  },
  {
    id: "so-02", workspace_id: W,
    title_en: "Al-Noor CEO Office + Reception", title_ar: "مكتب المدير + استقبال النور",
    type: "sales_order", status: "in_progress", priority: "urgent",
    assignee_id: "emp-07", parent_id: null, organization_id: "o03",
    due_date: d(5), progress: 30, tags: ["office", "reception"],
    metadata: {
      so_number: "SO-202601-0002", customer_type: "company",
      customer_id: "o03", customer_name: "Al-Noor Furniture",
      contact_person: "Tariq Al-Noor", phone: "+966-55-333-2000",
      email: "tariq@alnoor.com", address: "Prince Sultan Rd, Al-Sulaimaniyah",
      city: "Riyadh", company_name: "Al-Noor Furniture",
      project_name: "Al-Noor HQ Renovation",
      priority: "urgent",
      items: [
        { id: "soi-03", product_name: "Executive Desk L-Shape", description: "Walnut veneer with cable management", qty: 1, unitPrice: 18000, width: 2400, height: 760, depth: 900, material: "Solid Wood + Veneer", finish: "Dark Walnut", color: "Walnut/Black" },
        { id: "soi-04", product_name: "Credenza Unit", description: "Matching walnut credenza", qty: 1, unitPrice: 9500, width: 1800, height: 850, depth: 500, material: "Veneer", finish: "Dark Walnut", color: "Walnut" },
        { id: "soi-05", product_name: "Curved Reception Counter", description: "Walnut + Corian top, backlit logo panel", qty: 1, unitPrice: 35000, width: 3000, height: 1100, depth: 700, material: "Veneer + Corian", finish: "Dark Walnut/Brass", color: "Walnut/Black/Brass" },
      ],
      payments: [
        { id: "sp-03", amount: 31250, date: d(25), method: "bank_transfer", reference: "TRF-99001" },
      ],
      customer_confirmed: true, measurements_done: true, design_approved: false,
      materials_available: false, deposit_received: true,
      total_amount: 62500, total_paid: 31250, estimated_days: 30,
    },
    created_at: ts(30), updated_at: ts(1),
  },
  {
    id: "so-03", workspace_id: W,
    title_en: "Al-Rashidi Villa — Full Project", title_ar: "فيلا الراشدي — مشروع كامل",
    type: "sales_order", status: "draft", priority: "medium",
    assignee_id: "emp-07", parent_id: null, organization_id: null,
    due_date: d(-20), progress: 10, tags: ["villa", "kitchen", "wardrobe", "tv-unit"],
    metadata: {
      so_number: "SO-202601-0003", customer_type: "individual",
      customer_name: "Mohammed Al-Rashidi",
      contact_person: "Mohammed Al-Rashidi", phone: "+966-55-888-5555",
      address: "Al-Yasmin District, Villa 42", city: "Riyadh",
      project_name: "Villa Al-Rashidi Full Fit-out",
      priority: "medium",
      items: [
        { id: "soi-06", product_name: "Classic Kitchen U-shape", description: "Classic profile doors, gold handles, island", qty: 1, unitPrice: 65000, width: 5000, height: 2700, depth: 650, material: "MDF + HPL + Acrylic", finish: "Classic Beige", color: "Beige/Cream/Gold" },
        { id: "soi-07", product_name: "Walk-in Closet", description: "His & hers with center island", qty: 1, unitPrice: 38000, width: 3200, height: 2500, depth: 600, material: "MDF", finish: "Matte Cream", color: "Cream" },
        { id: "soi-08", product_name: "TV Entertainment Wall", description: "Full wall unit with fireplace cutout", qty: 1, unitPrice: 22000, width: 4000, height: 2200, depth: 450, material: "MDF + Acrylic", finish: "Classic Beige", color: "Beige/Gold" },
      ],
      payments: [],
      customer_confirmed: false, measurements_done: true, design_approved: false,
      materials_available: false, deposit_received: false,
      total_amount: 125000, total_paid: 0, estimated_days: 60,
    },
    created_at: ts(10), updated_at: ts(2),
  },
  {
    id: "so-04", workspace_id: W,
    title_en: "Al-Hamra Kitchen — Complete", title_ar: "مطبخ الحمرا — مكتمل",
    type: "sales_order", status: "done", priority: "high",
    assignee_id: "emp-07", parent_id: null, organization_id: null,
    due_date: d(35), progress: 100, tags: ["kitchen"],
    metadata: {
      so_number: "SO-202512-0098", customer_type: "individual",
      customer_name: "Faisal Al-Hamra",
      contact_person: "Faisal Al-Hamra", phone: "+966-55-444-1234",
      address: "Al-Hamra District, Villa 18", city: "Riyadh",
      project_name: "Al-Hamra Kitchen Renovation",
      priority: "high",
      items: [
        { id: "soi-09", product_name: "Full Kitchen Package", description: "Modern kitchen with appliance integration", qty: 1, unitPrice: 55000, material: "MDF Lacquer + HPL", finish: "White Matte", color: "White/Grey" },
      ],
      payments: [
        { id: "sp-04", amount: 27500, date: d(65), method: "bank_transfer", reference: "TRF-97100" },
        { id: "sp-05", amount: 27500, date: d(30), method: "bank_transfer", reference: "TRF-97890" },
      ],
      customer_confirmed: true, measurements_done: true, design_approved: true,
      materials_available: true, deposit_received: true,
      total_amount: 55000, total_paid: 55000, estimated_days: 30,
    },
    created_at: ts(70), updated_at: ts(29),
  },
  {
    id: "so-05", workspace_id: W,
    title_en: "Meridian Jeddah Branch — Office", title_ar: "مكتب فرع ميريديان جدة",
    type: "sales_order", status: "draft", priority: "medium",
    assignee_id: "emp-07", parent_id: null, organization_id: "o02",
    due_date: d(-30), progress: 5, tags: ["office"],
    metadata: {
      so_number: "SO-202602-0004", customer_type: "company",
      customer_id: "o02", customer_name: "Meridian Trading",
      contact_person: "Samir Khoury", phone: "+966-55-222-1000",
      address: "Tahlia St, Jeddah", city: "Jeddah",
      company_name: "Meridian Trading",
      project_name: "Meridian Jeddah Branch Fit-out",
      priority: "medium",
      items: [
        { id: "soi-10", product_name: "Reception Counter", description: "Compact L-shaped, brand colours", qty: 1, unitPrice: 15000, material: "Melamine + Steel", finish: "White/Blue", color: "Brand Blue/White" },
        { id: "soi-11", product_name: "Workstation Desk", description: "120x60cm with cable tray", qty: 4, unitPrice: 3500, material: "Melamine + Steel Frame", finish: "White", color: "White" },
      ],
      payments: [],
      customer_confirmed: false, measurements_done: false, design_approved: false,
      materials_available: false, deposit_received: false,
      total_amount: 29000, total_paid: 0, estimated_days: 20,
    },
    created_at: ts(3), updated_at: ts(1),
  },
];

// ─── Quotations (work_items type=quotation) ──────────────

export const DEMO_QUOTATIONS: T<"work_items">[] = [
  {
    id: "qt-01", workspace_id: W,
    title_en: "Quotation — Meridian Kitchen Package", title_ar: "عرض سعر — باكج مطبخ ميريديان",
    type: "quotation", status: "converted", priority: "high",
    assignee_id: "emp-07", parent_id: null, organization_id: "o02",
    due_date: null, progress: 100, tags: ["kitchen", "wardrobe"],
    metadata: {
      quotation_number: "QT-202601-001", customer_id: "o02",
      customer_name: "Meridian Trading", contact_person: "Samir Khoury",
      quotation_date: d(50), validity_date: d(20),
      project_name: "Meridian Apartment Fit-out",
      items: [
        { id: "qi-01", product: "Modern Handleless Kitchen", description: "L-shaped, white lacquer MDF, push-to-open Blum hardware", qty: 1, unitPrice: 42000, width: 4200, height: 2700, depth: 600, material: "MDF Lacquer", finish: "Matte White", color: "White/Grey", installationRequired: true, deliveryRequired: true },
        { id: "qi-02", product: "Sliding Wardrobe", description: "Full wall, 3 sliding doors, LED strip", qty: 1, unitPrice: 28000, width: 3600, height: 2500, depth: 600, material: "MDF Lacquer", finish: "Matte White", color: "White", installationRequired: true, deliveryRequired: true },
      ],
      material_cost: 18000, labor_cost: 12000, accessories_cost: 4500,
      transport_cost: 1500, installation_cost: 4000, currency: "SAR",
      converted_to: "so-01",
    },
    created_at: ts(50), updated_at: ts(45),
  },
  {
    id: "qt-02", workspace_id: W,
    title_en: "Quotation — Al-Noor Office Suite", title_ar: "عرض سعر — مكتب النور",
    type: "quotation", status: "approved", priority: "urgent",
    assignee_id: "emp-07", parent_id: null, organization_id: "o03",
    due_date: null, progress: 100, tags: ["office", "reception"],
    metadata: {
      quotation_number: "QT-202601-002", customer_id: "o03",
      customer_name: "Al-Noor Furniture", contact_person: "Tariq Al-Noor",
      quotation_date: d(35), validity_date: d(5),
      project_name: "Al-Noor HQ Renovation",
      items: [
        { id: "qi-03", product: "Executive L-Desk", description: "Walnut veneer, cable management, wireless charger", qty: 1, unitPrice: 18000, material: "Solid Wood + Veneer", finish: "Dark Walnut" },
        { id: "qi-04", product: "Matching Credenza", description: "1800mm walnut credenza", qty: 1, unitPrice: 9500, material: "Veneer", finish: "Dark Walnut" },
        { id: "qi-05", product: "Curved Reception Counter", description: "5m curved, Corian top, backlit logo", qty: 1, unitPrice: 35000, material: "Veneer + Corian", finish: "Dark Walnut/Brass" },
      ],
      material_cost: 22000, labor_cost: 15000, accessories_cost: 5500,
      transport_cost: 2000, installation_cost: 5000, currency: "SAR",
    },
    created_at: ts(35), updated_at: ts(30),
  },
  {
    id: "qt-03", workspace_id: W,
    title_en: "Quotation — Al-Rashidi Villa Full", title_ar: "عرض سعر — فيلا الراشدي كامل",
    type: "quotation", status: "sent", priority: "medium",
    assignee_id: "emp-07", parent_id: null, organization_id: null,
    due_date: null, progress: 50, tags: ["villa"],
    metadata: {
      quotation_number: "QT-202601-003",
      customer_name: "Mohammed Al-Rashidi", contact_person: "Mohammed Al-Rashidi",
      quotation_date: d(8), validity_date: d(-22),
      project_name: "Villa Al-Rashidi Full Fit-out",
      items: [
        { id: "qi-06", product: "Classic U-Kitchen with Island", description: "Classic profile, gold handles, breakfast bar", qty: 1, unitPrice: 65000, material: "MDF + HPL + Acrylic", finish: "Classic Beige", color: "Beige/Cream/Gold", installationRequired: true, deliveryRequired: true },
        { id: "qi-07", product: "Walk-in Closet", description: "His & hers sections, center island", qty: 1, unitPrice: 38000, material: "MDF", finish: "Matte Cream", installationRequired: true, deliveryRequired: true },
        { id: "qi-08", product: "TV Entertainment Wall", description: "Full wall unit, fireplace cutout", qty: 1, unitPrice: 22000, material: "MDF + Acrylic", finish: "Classic Beige", installationRequired: true, deliveryRequired: true },
      ],
      material_cost: 35000, labor_cost: 25000, accessories_cost: 8000,
      transport_cost: 3000, installation_cost: 9000, currency: "SAR",
    },
    created_at: ts(8), updated_at: ts(8),
  },
  {
    id: "qt-04", workspace_id: W,
    title_en: "Quotation — Jeddah Branch Office", title_ar: "عرض سعر — مكتب فرع جدة",
    type: "quotation", status: "draft", priority: "low",
    assignee_id: "emp-07", parent_id: null, organization_id: "o02",
    due_date: null, progress: 0, tags: ["office"],
    metadata: {
      quotation_number: "QT-202602-004", customer_id: "o02",
      customer_name: "Meridian Trading", contact_person: "Samir Khoury",
      quotation_date: d(2), validity_date: d(-28),
      project_name: "Meridian Jeddah Branch",
      items: [
        { id: "qi-09", product: "Reception Counter (Compact)", description: "L-shaped, brand colours", qty: 1, unitPrice: 15000, material: "Melamine + Steel", finish: "White/Blue" },
        { id: "qi-10", product: "Office Workstation", description: "120x60cm desk with cable tray", qty: 4, unitPrice: 3500, material: "Melamine + Steel Frame", finish: "White" },
      ],
      material_cost: 8000, labor_cost: 5000, accessories_cost: 2000,
      transport_cost: 3500, installation_cost: 2500, currency: "SAR",
    },
    created_at: ts(2), updated_at: ts(2),
  },
];

// ─── Purchase Requests & Orders (work_items) ─────────────

export const DEMO_PURCHASE_ITEMS: T<"work_items">[] = [
  {
    id: "pr-01", workspace_id: W,
    title_en: "PR — White Lacquer MDF 18mm (4 sheets)", title_ar: "طلب شراء — MDF لاكر أبيض 18مم",
    type: "purchase_request", status: "approved", priority: "high",
    assignee_id: "emp-10", parent_id: null, organization_id: null,
    due_date: d(2), progress: 100, tags: ["material"],
    metadata: {
      po_number: null, vendor_id: "vendor-01", vendor_name: "Saudi MDF Co.",
      items_description: "White Lacquer MDF 18mm (2440x1220) — 4 sheets to complete PO-2026-001",
      estimated_amount: 720, department: "production", currency: "SAR",
      delivery_date: d(-1), approved_by: "Ahmad Khalil", approved_at: ts(5),
    },
    created_at: ts(7), updated_at: ts(5),
  },
  {
    id: "pr-02", workspace_id: W,
    title_en: "PR — Walnut Veneer MDF (5 sheets)", title_ar: "طلب شراء — MDF قشرة جوز",
    type: "purchase_request", status: "submitted", priority: "urgent",
    assignee_id: "emp-10", parent_id: null, organization_id: null,
    due_date: d(1), progress: 50, tags: ["material"],
    metadata: {
      vendor_id: "vendor-02", vendor_name: "Premium Wood KSA",
      items_description: "Walnut Veneer MDF 18mm (2440x1220) — 5 sheets for Al-Noor Reception (PO-2026-003)",
      estimated_amount: 1400, department: "production", currency: "SAR",
      delivery_date: d(-3),
    },
    created_at: ts(4), updated_at: ts(3),
  },
  {
    id: "pr-03", workspace_id: W,
    title_en: "PR — Corian Glacier White Fabrication", title_ar: "طلب شراء — تصنيع كوريان",
    type: "purchase_request", status: "approved", priority: "urgent",
    assignee_id: "emp-10", parent_id: null, organization_id: null,
    due_date: d(-5), progress: 100, tags: ["material", "external"],
    metadata: {
      vendor_id: "vendor-03", vendor_name: "Corian Fabricators",
      items_description: "Corian Glacier White 12mm — 4 sqm fabricated counter top for Al-Noor Reception",
      estimated_amount: 3200, department: "production", currency: "SAR",
      delivery_date: d(-8), approved_by: "Ahmad Khalil", approved_at: ts(10),
    },
    created_at: ts(12), updated_at: ts(10),
  },
  {
    id: "po-p01", workspace_id: W,
    title_en: "PO — Saudi MDF Co. (MDF + Lacquer sheets)", title_ar: "أمر شراء — شركة MDF السعودية",
    type: "purchase_order", status: "received", priority: "high",
    assignee_id: "emp-10", parent_id: null, organization_id: null,
    due_date: d(25), progress: 100, tags: ["material"],
    metadata: {
      po_number: "PUR-2026-001", vendor_id: "vendor-01", vendor_name: "Saudi MDF Co.",
      items_description: "18x White MDF 18mm + 10x White Lacquer MDF 18mm for PO-2026-001 & PO-2026-002",
      estimated_amount: 3960, department: "production", currency: "SAR",
      delivery_date: d(28),
    },
    created_at: ts(32), updated_at: ts(28),
  },
  {
    id: "po-p02", workspace_id: W,
    title_en: "PO — Blum KSA (Hinges + Slides)", title_ar: "أمر شراء — بلوم (مفصلات + سكك)",
    type: "purchase_order", status: "received", priority: "medium",
    assignee_id: "emp-10", parent_id: null, organization_id: null,
    due_date: d(26), progress: 100, tags: ["hardware"],
    metadata: {
      po_number: "PUR-2026-002", vendor_id: "vendor-04", vendor_name: "Blum KSA",
      items_description: "28x Tip-On hinges + 12x Soft-close slides for PO-2026-001",
      estimated_amount: 1156, department: "production", currency: "SAR",
      delivery_date: d(27),
    },
    created_at: ts(30), updated_at: ts(27),
  },
  {
    id: "po-p03", workspace_id: W,
    title_en: "PO — Hafele KSA (Sliding Door Tracks)", title_ar: "أمر شراء — هافيلي (سكك أبواب)",
    type: "purchase_order", status: "ordered", priority: "medium",
    assignee_id: "emp-10", parent_id: null, organization_id: null,
    due_date: d(5), progress: 50, tags: ["hardware"],
    metadata: {
      po_number: "PUR-2026-003", vendor_id: "vendor-05", vendor_name: "Hafele KSA",
      items_description: "3x Sliding door track sets 2500mm for PO-2026-002 (Meridian Wardrobe)",
      estimated_amount: 1050, department: "production", currency: "SAR",
      delivery_date: d(1),
    },
    created_at: ts(25), updated_at: ts(8),
  },
];

// ─── Vendor Organizations ────────────────────────────────

export const DEMO_VENDORS: T<"organizations">[] = [
  {
    id: "vendor-01", workspace_id: W, name_en: "Saudi MDF Co.", name_ar: "شركة MDF السعودية",
    type: "company", status: "active", industry: "Building Materials",
    website: null, email: "orders@saudimdf.com", phone: "+966-11-400-1000",
    tags: ["vendor"], metadata: { org_type: "vendor", vendor_category: "material", payment_terms: "Net 30", country: "Saudi Arabia", city: "Riyadh", notes: "Primary MDF supplier. Good stock levels." },
    created_at: ts(365), updated_at: ts(30),
  },
  {
    id: "vendor-02", workspace_id: W, name_en: "Premium Wood KSA", name_ar: "بريميوم وود",
    type: "company", status: "active", industry: "Building Materials",
    website: null, email: "sales@premwood.sa", phone: "+966-11-400-2000",
    tags: ["vendor"], metadata: { org_type: "vendor", vendor_category: "material", payment_terms: "Net 15", country: "Saudi Arabia", city: "Riyadh", notes: "Veneer and solid wood specialist." },
    created_at: ts(300), updated_at: ts(14),
  },
  {
    id: "vendor-03", workspace_id: W, name_en: "Corian Fabricators", name_ar: "مصنع كوريان",
    type: "company", status: "active", industry: "Fabrication",
    website: null, email: "info@corianfab.sa", phone: "+966-11-400-3000",
    tags: ["vendor"], metadata: { org_type: "vendor", vendor_category: "fabrication", payment_terms: "50% advance", country: "Saudi Arabia", city: "Jeddah", notes: "Corian and solid surface specialist. 10-day lead time." },
    created_at: ts(200), updated_at: ts(12),
  },
  {
    id: "vendor-04", workspace_id: W, name_en: "Blum KSA", name_ar: "بلوم السعودية",
    type: "company", status: "active", industry: "Hardware",
    website: "https://blum.com", email: "orders@blum.sa", phone: "+966-11-400-4000",
    tags: ["vendor"], metadata: { org_type: "vendor", vendor_category: "hardware", payment_terms: "Net 30", country: "Saudi Arabia", city: "Riyadh", notes: "Premium hardware. Hinges, slides, lift systems." },
    created_at: ts(365), updated_at: ts(27),
  },
  {
    id: "vendor-05", workspace_id: W, name_en: "Hafele KSA", name_ar: "هافيلي السعودية",
    type: "company", status: "active", industry: "Hardware",
    website: "https://hafele.com", email: "ksa@hafele.com", phone: "+966-11-400-5000",
    tags: ["vendor"], metadata: { org_type: "vendor", vendor_category: "hardware", payment_terms: "Net 45", country: "Saudi Arabia", city: "Riyadh", notes: "Sliding systems, lighting, fittings. Sometimes slow delivery." },
    created_at: ts(300), updated_at: ts(8),
  },
  {
    id: "vendor-06", workspace_id: W, name_en: "Al-Qahtani Surfaces", name_ar: "القحطاني للأسطح",
    type: "company", status: "active", industry: "Building Materials",
    website: null, email: "info@qahtani-surfaces.sa", phone: "+966-11-400-6000",
    tags: ["vendor"], metadata: { org_type: "vendor", vendor_category: "material", payment_terms: "Net 30", country: "Saudi Arabia", city: "Riyadh", notes: "HPL, laminates, countertop surfaces." },
    created_at: ts(250), updated_at: ts(29),
  },
] as unknown as T<"organizations">[];

// ─── Inventory Resources ─────────────────────────────────

export const DEMO_INVENTORY: T<"resources">[] = [
  // Inventory items (raw materials in stock)
  {
    id: "inv-01", workspace_id: W, name_en: "Cotton Poplin — White", name_ar: "قماش كoton أبيض",
    type: "inventory", utilization: 72, department: "warehouse", skills: ["inventory"],
    metadata: { category: "fabric", sku: "COT-WHT-001", quantity: 120, reorder_level: 50, unit_cost: 35, vendor_name: "Egyptian Cotton Co.", location: "Fabric Rack A1", inv_status: "in_stock" },
    created_at: ts(365), updated_at: ts(2),
  },
  {
    id: "inv-02", workspace_id: W, name_en: "Silk Charmeuse — Ivory", name_ar: "حرير شاموز عاجي",
    type: "inventory", utilization: 33, department: "warehouse", skills: ["inventory"],
    metadata: { category: "fabric", sku: "SLK-IVR-001", quantity: 45, reorder_level: 30, unit_cost: 300, vendor_name: "Premium Textiles", location: "Fabric Rack A2", inv_status: "in_stock" },
    created_at: ts(365), updated_at: ts(5),
  },
  {
    id: "inv-03", workspace_id: W, name_en: "Wool Blend — Charcoal", name_ar: "خليط صوف فحمي",
    type: "inventory", utilization: 25, department: "warehouse", skills: ["inventory"],
    metadata: { category: "fabric", sku: "WOL-CHR-001", quantity: 60, reorder_level: 40, unit_cost: 180, vendor_name: "Italian Fabrics KSA", location: "Fabric Rack A3", inv_status: "in_stock" },
    created_at: ts(300), updated_at: ts(3),
  },
  {
    id: "inv-04", workspace_id: W, name_en: "Invisible Zipper 50cm", name_ar: "سحاب خفي 50سم",
    type: "inventory", utilization: 60, department: "warehouse", skills: ["inventory"],
    metadata: { category: "trims", sku: "ZIP-INV-50", quantity: 200, reorder_level: 80, unit_cost: 12, vendor_name: "YKK KSA", location: "Trims Shelf B1", inv_status: "in_stock" },
    created_at: ts(200), updated_at: ts(10),
  },
  {
    id: "inv-05", workspace_id: W, name_en: "Shoulder Pads — Standard", name_ar: "وسائد كتف — قياسي",
    type: "inventory", utilization: 45, department: "warehouse", skills: ["inventory"],
    metadata: { category: "trims", sku: "SP-STD-001", quantity: 100, reorder_level: 40, unit_cost: 8, vendor_name: "Trim Supply", location: "Trims Shelf C1", inv_status: "in_stock" },
    created_at: ts(365), updated_at: ts(7),
  },
  {
    id: "inv-06", workspace_id: W, name_en: "Sewing Thread — Black", name_ar: "خيط خياطة — أسود",
    type: "inventory", utilization: 50, department: "warehouse", skills: ["inventory"],
    metadata: { category: "trims", sku: "THR-BLK-001", quantity: 50, reorder_level: 20, unit_cost: 15, vendor_name: "Gutermann", location: "Trims Shelf C2", inv_status: "in_stock" },
    created_at: ts(300), updated_at: ts(8),
  },
  {
    id: "inv-07", workspace_id: W, name_en: "Tulle — White 3m roll", name_ar: "تول — أبيض 3م",
    type: "inventory", utilization: 0, department: "warehouse", skills: ["inventory"],
    metadata: { category: "fabric", sku: "TUL-WHT-003", quantity: 25, reorder_level: 15, unit_cost: 40, vendor_name: "Bridal Fabrics", location: "Fabric Shelf D1", inv_status: "in_stock" },
    created_at: ts(100), updated_at: ts(29),
  },
  {
    id: "inv-08", workspace_id: W, name_en: "Lace Trim — 5m roll", name_ar: "شرائط كرنش — 5م",
    type: "inventory", utilization: 70, department: "warehouse", skills: ["inventory"],
    metadata: { category: "trims", sku: "LAC-TRM-005", quantity: 35, reorder_level: 15, unit_cost: 65, vendor_name: "French Laces", location: "Trims Shelf B3", inv_status: "in_stock" },
    created_at: ts(180), updated_at: ts(15),
  },
  {
    id: "inv-09", workspace_id: W, name_en: "Cotton Jersey — Navy", name_ar: "جيرسي قطن — كحلي",
    type: "inventory", utilization: 55, department: "warehouse", skills: ["inventory"],
    metadata: { category: "fabric", sku: "JRS-NVY-001", quantity: 80, reorder_level: 30, unit_cost: 50, vendor_name: "Egyptian Cotton Co.", location: "Fabric Floor D2", inv_status: "in_stock" },
    created_at: ts(150), updated_at: ts(4),
  },
  {
    id: "inv-10", workspace_id: W, name_en: "Buttons — Horn (bag of 50)", name_ar: "أزرار — قرن (كيس 50)",
    type: "inventory", utilization: 40, department: "warehouse", skills: ["inventory"],
    metadata: { category: "trims", sku: "BTN-HRN-050", quantity: 15, reorder_level: 5, unit_cost: 45, vendor_name: "Button World", location: "Trims Shelf B4", inv_status: "in_stock" },
    created_at: ts(120), updated_at: ts(9),
  },
  // Assets (atelier equipment)
  {
    id: "ast-01", workspace_id: W, name_en: "Industrial Sewing Machine — Juki DDL-9000C", name_ar: "ماكينة خياطة جوكي DDL-9000C",
    type: "equipment", utilization: 85, department: "production", skills: ["asset"],
    metadata: { category: "machinery", asset_tag: "AST-SMN-001", assigned_to: "Youssef Ali", assigned_dept: "sewing", purchase_date: d(730), purchase_cost: 85000, current_value: 65000, condition: "good", warranty_expiry: d(-365), asset_status: "in_use", useful_life_years: 10, salvage_value: 10000 },
    created_at: ts(730), updated_at: ts(1),
  },
  {
    id: "ast-02", workspace_id: W, name_en: "Overlock Machine — Pegasus M500", name_ar: "ماكينة سيروfiler بيغاسوس",
    type: "equipment", utilization: 70, department: "production", skills: ["asset"],
    metadata: { category: "machinery", asset_tag: "AST-OVL-001", assigned_to: "Salman Rizq", assigned_dept: "sewing", purchase_date: d(540), purchase_cost: 65000, current_value: 50000, condition: "good", warranty_expiry: d(-180), asset_status: "in_use", useful_life_years: 10, salvage_value: 8000 },
    created_at: ts(540), updated_at: ts(3),
  },
  {
    id: "ast-03", workspace_id: W, name_en: "Fabric Cutting Table — Gerber Cutter", name_ar: "طاولة تقطيع جيربر",
    type: "equipment", utilization: 75, department: "production", skills: ["asset"],
    metadata: { category: "machinery", asset_tag: "AST-CTT-001", assigned_to: "Omar Hassan", assigned_dept: "cutting", purchase_date: d(900), purchase_cost: 120000, current_value: 80000, condition: "fair", warranty_expiry: d(-600), asset_status: "in_use", useful_life_years: 8, salvage_value: 15000 },
    created_at: ts(900), updated_at: ts(5),
  },
  {
    id: "ast-04", workspace_id: W, name_en: "Steam Press — Veit 8362", name_ar: "ماكينة كوي فايت",
    type: "equipment", utilization: 60, department: "production", skills: ["asset"],
    metadata: { category: "machinery", asset_tag: "AST-PRS-001", assigned_to: "Khaled Mansour", assigned_dept: "finishing", purchase_date: d(400), purchase_cost: 45000, current_value: 35000, condition: "good", warranty_expiry: d(-35), asset_status: "in_use", useful_life_years: 12, salvage_value: 5000 },
    created_at: ts(400), updated_at: ts(2),
  },
  {
    id: "ast-05", workspace_id: W, name_en: "Delivery Van — Ford Transit", name_ar: "فان توصيل — فورد ترانزيت",
    type: "vehicle", utilization: 40, department: "shipping", skills: ["asset"],
    metadata: { category: "vehicle", asset_tag: "AST-VAN-001", assigned_to: "Hassan Younis", assigned_dept: "shipping", purchase_date: d(500), purchase_cost: 95000, current_value: 65000, condition: "good", warranty_expiry: d(-200), asset_status: "in_use", useful_life_years: 7, salvage_value: 20000 },
    created_at: ts(500), updated_at: ts(30),
  },
];

// ─── Stock movements + maintenance (work_items) ──────────
// 30 days of in/out movements referencing DEMO_INVENTORY ids,
// so the Inventory movement-trend chart has real data in demo mode.

export const DEMO_STOCK_MOVEMENTS: T<"work_items">[] = [
  {
    id: "mov-01", workspace_id: W,
    title_en: "Stock In: White MDF 18mm (20)", title_ar: "إضافة للمخزون: MDF أبيض 18مم (20)",
    type: "stock_movement", status: "done", priority: "medium",
    assignee_id: "emp-10", parent_id: null, organization_id: null,
    due_date: null, progress: 100, tags: ["inventory"],
    metadata: { resource_id: "inv-01", resource_name: "White MDF 18mm (2440x1220)", move_qty: 20, move_type: "stock_in", from_location: null, to_location: "Warehouse Rack A1", reason: "PO PUR-2025-088 received" },
    created_at: ts(28), updated_at: ts(28),
  },
  {
    id: "mov-02", workspace_id: W,
    title_en: "Stock Out: White MDF 18mm (8)", title_ar: "صرف من المخزون: MDF أبيض 18مم (8)",
    type: "stock_movement", status: "done", priority: "medium",
    assignee_id: "emp-04", parent_id: null, organization_id: null,
    due_date: null, progress: 100, tags: ["inventory"],
    metadata: { resource_id: "inv-01", resource_name: "White MDF 18mm (2440x1220)", move_qty: 8, move_type: "stock_out", from_location: "Warehouse Rack A1", to_location: null, reason: "Issued to PO-2026-001 cutting" },
    created_at: ts(24), updated_at: ts(24),
  },
  {
    id: "mov-03", workspace_id: W,
    title_en: "Stock Out: Blum Tip-On Hinges (12)", title_ar: "صرف من المخزون: مفصلات بلوم (12)",
    type: "stock_movement", status: "done", priority: "medium",
    assignee_id: "emp-05", parent_id: null, organization_id: null,
    due_date: null, progress: 100, tags: ["inventory"],
    metadata: { resource_id: "inv-05", resource_name: "Blum Tip-On Hinges (pair)", move_qty: 12, move_type: "stock_out", from_location: "Warehouse Shelf C1", to_location: null, reason: "Issued to PO-2026-001 assembly" },
    created_at: ts(20), updated_at: ts(20),
  },
  {
    id: "mov-04", workspace_id: W,
    title_en: "Stock In: Soft-Close Slides (30)", title_ar: "إضافة للمخزون: سكك سوفت كلوز (30)",
    type: "stock_movement", status: "done", priority: "medium",
    assignee_id: "emp-10", parent_id: null, organization_id: null,
    due_date: null, progress: 100, tags: ["inventory"],
    metadata: { resource_id: "inv-06", resource_name: "Soft-Close Drawer Slides 500mm", move_qty: 30, move_type: "stock_in", from_location: null, to_location: "Warehouse Shelf C2", reason: "PO PUR-2026-002 received" },
    created_at: ts(16), updated_at: ts(16),
  },
  {
    id: "mov-05", workspace_id: W,
    title_en: "Stock Out: Edge Band White (3)", title_ar: "صرف من المخزون: كنار أبيض (3)",
    type: "stock_movement", status: "done", priority: "medium",
    assignee_id: "emp-04", parent_id: null, organization_id: null,
    due_date: null, progress: 100, tags: ["inventory"],
    metadata: { resource_id: "inv-04", resource_name: "Edge Band White 1mm (100m roll)", move_qty: 3, move_type: "stock_out", from_location: "Warehouse Shelf B1", to_location: null, reason: "Issued to PO-2026-002 edging" },
    created_at: ts(12), updated_at: ts(12),
  },
  {
    id: "mov-06", workspace_id: W,
    title_en: "Stock Out: White Lacquer MDF (4)", title_ar: "صرف من المخزون: MDF لاكر أبيض (4)",
    type: "stock_movement", status: "done", priority: "high",
    assignee_id: "emp-04", parent_id: null, organization_id: null,
    due_date: null, progress: 100, tags: ["inventory"],
    metadata: { resource_id: "inv-02", resource_name: "White Lacquer MDF 18mm", move_qty: 4, move_type: "stock_out", from_location: "Warehouse Rack A2", to_location: null, reason: "Issued to PO-2026-001 finishing" },
    created_at: ts(8), updated_at: ts(8),
  },
  {
    id: "mov-07", workspace_id: W,
    title_en: "Stock Out: HPL Grey Countertop (2)", title_ar: "صرف من المخزون: سطح HPL رمادي (2)",
    type: "stock_movement", status: "done", priority: "high",
    assignee_id: "emp-05", parent_id: null, organization_id: null,
    due_date: null, progress: 100, tags: ["inventory"],
    metadata: { resource_id: "inv-07", resource_name: "HPL Grey 30mm Countertop", move_qty: 2, move_type: "stock_out", from_location: "Warehouse Floor D1", to_location: null, reason: "Issued to PO-2025-098 — stock depleted" },
    created_at: ts(29), updated_at: ts(29),
  },
  {
    id: "mov-08", workspace_id: W,
    title_en: "Stock In: LED Strip 5m (10)", title_ar: "إضافة للمخزون: شريط LED (10)",
    type: "stock_movement", status: "done", priority: "medium",
    assignee_id: "emp-10", parent_id: null, organization_id: null,
    due_date: null, progress: 100, tags: ["inventory"],
    metadata: { resource_id: "inv-08", resource_name: "LED Strip 5m (Warm White)", move_qty: 10, move_type: "stock_in", from_location: null, to_location: "Warehouse Shelf B3", reason: "PO PUR-2026-002 received" },
    created_at: ts(15), updated_at: ts(15),
  },
  {
    id: "mov-09", workspace_id: W,
    title_en: "Adjustment: Walnut Veneer MDF (-1)", title_ar: "تعديل: MDF قشرة جوز (-1)",
    type: "stock_movement", status: "done", priority: "low",
    assignee_id: "emp-10", parent_id: null, organization_id: null,
    due_date: null, progress: 100, tags: ["inventory"],
    metadata: { resource_id: "inv-03", resource_name: "Walnut Veneer MDF 18mm", move_qty: 1, move_type: "adjustment", from_location: null, to_location: null, reason: "Damaged sheet written off after QC" },
    created_at: ts(6), updated_at: ts(6),
  },
  {
    id: "mov-10", workspace_id: W,
    title_en: "Stock Out: Blum Tip-On Hinges (6)", title_ar: "صرف من المخزون: مفصلات بلوم (6)",
    type: "stock_movement", status: "done", priority: "medium",
    assignee_id: "emp-05", parent_id: null, organization_id: null,
    due_date: null, progress: 100, tags: ["inventory"],
    metadata: { resource_id: "inv-05", resource_name: "Blum Tip-On Hinges (pair)", move_qty: 6, move_type: "stock_out", from_location: "Warehouse Shelf C1", to_location: null, reason: "Issued to PO-2026-002 assembly" },
    created_at: ts(3), updated_at: ts(3),
  },
  {
    id: "mov-11", workspace_id: W,
    title_en: "Stock In: Edge Band White (5)", title_ar: "إضافة للمخزون: كنار أبيض (5)",
    type: "stock_movement", status: "done", priority: "medium",
    assignee_id: "emp-10", parent_id: null, organization_id: null,
    due_date: null, progress: 100, tags: ["inventory"],
    metadata: { resource_id: "inv-04", resource_name: "Edge Band White 1mm (100m roll)", move_qty: 5, move_type: "stock_in", from_location: null, to_location: "Warehouse Shelf B1", reason: "PO PUR-2026-001 received" },
    created_at: ts(2), updated_at: ts(2),
  },
  {
    id: "mov-12", workspace_id: W,
    title_en: "Stock Out: White MDF 18mm (5)", title_ar: "صرف من المخزون: MDF أبيض 18مم (5)",
    type: "stock_movement", status: "done", priority: "medium",
    assignee_id: "emp-04", parent_id: null, organization_id: null,
    due_date: null, progress: 100, tags: ["inventory"],
    metadata: { resource_id: "inv-01", resource_name: "White MDF 18mm (2440x1220)", move_qty: 5, move_type: "stock_out", from_location: "Warehouse Rack A1", to_location: null, reason: "Issued to PO-2026-003 cutting" },
    created_at: ts(1), updated_at: ts(1),
  },
];

export const DEMO_MAINTENANCE: T<"work_items">[] = [
  {
    id: "mnt-01", workspace_id: W,
    title_en: "Preventive: CNC Router — Biesse Rover", title_ar: "صيانة وقائية: ماكينة CNC",
    type: "maintenance", status: "planned", priority: "high",
    assignee_id: "emp-03", parent_id: null, organization_id: null,
    due_date: d(-4), progress: 0, tags: ["maintenance"],
    metadata: { resource_id: "ast-01", resource_name: "CNC Router — Biesse Rover", maint_type: "preventive", cost: 3500, vendor_name: "Biesse Service KSA", notes: "Quarterly spindle calibration + rail lubrication", completed_date: null },
    created_at: ts(10), updated_at: ts(10),
  },
  {
    id: "mnt-02", workspace_id: W,
    title_en: "Repair: Edge Banding Machine — Homag", title_ar: "إصلاح: ماكينة الكنار",
    type: "maintenance", status: "in_progress", priority: "urgent",
    assignee_id: "emp-03", parent_id: null, organization_id: null,
    due_date: d(-1), progress: 60, tags: ["maintenance"],
    metadata: { resource_id: "ast-02", resource_name: "Edge Banding Machine — Homag", maint_type: "corrective", cost: 1800, vendor_name: "Homag Gulf", notes: "Glue pot heater replacement", completed_date: null },
    created_at: ts(4), updated_at: ts(1),
  },
  {
    id: "mnt-03", workspace_id: W,
    title_en: "Service: Delivery Truck 3-Ton", title_ar: "خدمة: شاحنة التوصيل",
    type: "maintenance", status: "done", priority: "medium",
    assignee_id: "emp-09", parent_id: null, organization_id: null,
    due_date: d(14), progress: 100, tags: ["maintenance"],
    metadata: { resource_id: "ast-05", resource_name: "Delivery Truck 3-Ton", maint_type: "preventive", cost: 950, vendor_name: "Al-Jazirah Vehicles", notes: "20,000 km service — oil, filters, brakes", completed_date: d(14) },
    created_at: ts(20), updated_at: ts(14),
  },
];

// ─── Products with bill of materials ─────────────────────
// resources(type "product") whose metadata.bom lines link to
// DEMO_INVENTORY ids — powers the Materials & BOM dashboard
// (composition, stock coverage, buildable units, costing).

export const DEMO_PRODUCTS: T<"resources">[] = [
  {
    id: "prd-01", workspace_id: W, name_en: "Silk Evening Dress — Amira", name_ar: "فستان سهرة حرير — أميرة",
    type: "product", utilization: 0, department: "production", skills: ["product"],
    metadata: {
      sku: "DRS-AMR-001", category: "Dresses", product_type: "dress",
      main_material: "Silk", secondary_material: "Chiffon", finish: "Embroidered",
      bom: [
        { id: "b1", material: "Silk", qty: 3, unit: "m", costPerUnit: 300 },
        { id: "b2", material: "Chiffon", qty: 2, unit: "m", costPerUnit: 60 },
        { id: "b3", material: "Lining (Viscose)", qty: 2.5, unit: "m", costPerUnit: 40 },
        { id: "b4", material: "Invisible Zipper", qty: 1, unit: "pcs", costPerUnit: 20 },
        { id: "b5", material: "Beading Kit", qty: 1, unit: "set", costPerUnit: 150 },
      ],
      labor_cost: 600, machine_cost: 80, overhead_cost: 100, suggested_price: 3200,
      images: ["data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' rx='12' fill='%238C6FAE'/%3E%3Cpath d='M30 18h20l4 20-14 30-14-30z' fill='%23E8EFE8' opacity='0.7'/%3E%3C/svg%3E"],
    },
    created_at: ts(45), updated_at: ts(3),
  },
  {
    id: "prd-02", workspace_id: W, name_en: "Wool Blazer — Nadia", name_ar: "بِلدة صوف — نادية",
    type: "product", utilization: 0, department: "production", skills: ["product"],
    metadata: {
      sku: "BLZ-NAD-001", category: "Suits", product_type: "blazer",
      main_material: "Wool", secondary_material: "Satin Lining", finish: "Tailored",
      bom: [
        { id: "b1", material: "Wool", qty: 3.5, unit: "m", costPerUnit: 200 },
        { id: "b2", material: "Satin Lining", qty: 3, unit: "m", costPerUnit: 60 },
        { id: "b3", material: "Shoulder Pads", qty: 2, unit: "pcs", costPerUnit: 25 },
        { id: "b4", material: "Buttons (horn)", qty: 5, unit: "pcs", costPerUnit: 12 },
        { id: "b5", material: "Interfacing", qty: 2, unit: "m", costPerUnit: 30 },
      ],
      labor_cost: 450, machine_cost: 60, overhead_cost: 80, suggested_price: 2100,
      images: ["data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' rx='12' fill='%232D3139'/%3E%3Cpath d='M28 16h24v8l-4 36H32L28 24z' fill='%237B818E' opacity='0.8'/%3E%3C/svg%3E"],
    },
    created_at: ts(60), updated_at: ts(5),
  },
  {
    id: "prd-03", workspace_id: W, name_en: "Cotton T-Shirt — Cairo", name_ar: "تيشيرت قطن — القاهرة",
    type: "product", utilization: 0, department: "production", skills: ["product"],
    metadata: {
      sku: "TSH-CAI-001", category: "Tops", product_type: "tshirt",
      main_material: "Cotton Jersey", finish: "Screen Printed",
      bom: [
        { id: "b1", material: "Cotton Jersey", qty: 1.5, unit: "m", costPerUnit: 45 },
        { id: "b2", material: "Ribbing", qty: 0.3, unit: "m", costPerUnit: 12 },
        { id: "b3", material: "Labels", qty: 1, unit: "set", costPerUnit: 3 },
      ],
      labor_cost: 35, machine_cost: 10, overhead_cost: 8, suggested_price: 120,
      images: ["data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' rx='12' fill='%23E8EFE8'/%3E%3Cpath d='M26 22h28l-4 10h-6v28H30V32h-6z' fill='%238C6FAE' opacity='0.6'/%3E%3C/svg%3E"],
    },
    created_at: ts(30), updated_at: ts(2),
  },
  {
    id: "prd-04", workspace_id: W, name_en: "Bridal Gown — Leila", name_ar: "فستان عرس ليلى",
    type: "product", utilization: 0, department: "production", skills: ["product"],
    metadata: {
      sku: "BRL-LEI-001", category: "Bridal", product_type: "bridal",
      main_material: "Silk", secondary_material: "Tulle & Lace", finish: "Hand Embroidered",
      bom: [
        { id: "b1", material: "Silk", qty: 5, unit: "m", costPerUnit: 300 },
        { id: "b2", material: "Tulle", qty: 8, unit: "m", costPerUnit: 40 },
        { id: "b3", material: "Lace", qty: 3, unit: "m", costPerUnit: 150 },
        { id: "b4", material: "Beading Kit", qty: 1, unit: "set", costPerUnit: 200 },
        { id: "b5", material: "Invisible Zipper", qty: 1, unit: "pcs", costPerUnit: 20 },
      ],
      labor_cost: 1200, machine_cost: 100, overhead_cost: 200, suggested_price: 8500,
      images: ["data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' rx='12' fill='%23FAF6EE'/%3E%3Cpath d='M30 12h20l6 24-16 40-16-40z' fill='%23DAD6CE' stroke='%238C6FAE' stroke-width='1.5'/%3E%3C/svg%3E"],
    },
    created_at: ts(90), updated_at: ts(7),
  },
];

// ─── POS Registers ────────────────────────────────────────

export const DEMO_POS_REGISTERS: T<"pos_registers">[] = [
  {
    id: "pos-reg-01", workspace_id: W, branch_id: "br-02", register_code: "POS-SH1-01",
    name: "Showroom Main Counter", name_ar: "كاونتر المعرض الرئيسي",
    status: "active", opened_by: "emp-04", opened_at: ts(0), closed_at: null,
    float_amount: 2000, current_cash: 4850,
    metadata: { cashier: "Fatima Nasser" },
    created_at: ts(90), updated_at: ts(0),
  },
  {
    id: "pos-reg-02", workspace_id: W, branch_id: "br-02", register_code: "POS-SH1-02",
    name: "Showroom Fitting Area", name_ar: "منطقة القياس بالمعرض",
    status: "active", opened_by: "emp-02", opened_at: ts(0), closed_at: null,
    float_amount: 1500, current_cash: 3200,
    metadata: { cashier: "Omar Hassan" },
    created_at: ts(60), updated_at: ts(0),
  },
  {
    id: "pos-reg-03", workspace_id: W, branch_id: "br-01", register_code: "POS-HQ-01",
    name: "Factory Outlet Counter", name_ar: "كاونتر ب outlet المصنع",
    status: "inactive", opened_by: null, opened_at: null, closed_at: null,
    float_amount: 1000, current_cash: 1000,
    metadata: {},
    created_at: ts(45), updated_at: ts(30),
  },
];

// ─── POS Transactions ─────────────────────────────────────

export const DEMO_POS_TRANSACTIONS: T<"pos_transactions">[] = [
  {
    id: "pos-txn-01", workspace_id: W, branch_id: "br-02", register_id: "pos-reg-01",
    transaction_number: "TXN-2026-001",
    customer_id: null, customer_name: "Nora Al-Farsi", customer_phone: "+966-55-123-4567",
    loyalty_card_number: "LOY-NOR-001",
    subtotal: 1850, discount_amount: 185, discount_percent: 10,
    tax_amount: 249.75, tax_rate: 15, total: 1914.75, currency: "SAR",
    payment_method: "card", payment_details: { card_last_four: "4521", card_type: "visa" },
    status: "completed", cashier_name: "Fatima Nasser",
    notes: null, receipt_printed: true,
    loyalty_points_earned: 185, loyalty_points_redeemed: 0,
    metadata: {},
    created_at: ts(0), updated_at: ts(0),
  },
  {
    id: "pos-txn-02", workspace_id: W, branch_id: "br-02", register_id: "pos-reg-01",
    transaction_number: "TXN-2026-002",
    customer_id: null, customer_name: "Layla Hassan", customer_phone: "+966-55-234-5678",
    loyalty_card_number: null,
    subtotal: 3200, discount_amount: 0, discount_percent: 0,
    tax_amount: 480, tax_rate: 15, total: 3680, currency: "SAR",
    payment_method: "cash", payment_details: { cash_received: 4000, change: 320 },
    status: "completed", cashier_name: "Fatima Nasser",
    notes: "Custom hemming requested", receipt_printed: true,
    loyalty_points_earned: 320, loyalty_points_redeemed: 0,
    metadata: {},
    created_at: ts(0), updated_at: ts(0),
  },
  {
    id: "pos-txn-03", workspace_id: W, branch_id: "br-02", register_id: "pos-reg-02",
    transaction_number: "TXN-2026-003",
    customer_id: null, customer_name: "Sara Mahmoud", customer_phone: "+966-55-345-6789",
    loyalty_card_number: "LOY-SAR-002",
    subtotal: 750, discount_amount: 75, discount_percent: 10,
    tax_amount: 101.25, tax_rate: 15, total: 776.25, currency: "SAR",
    payment_method: "mobile_wallet", payment_details: { provider: "STC Pay", reference: "STC-78945" },
    status: "completed", cashier_name: "Omar Hassan",
    notes: null, receipt_printed: true,
    loyalty_points_earned: 75, loyalty_points_redeemed: 0,
    metadata: {},
    created_at: ts(0), updated_at: ts(0),
  },
  {
    id: "pos-txn-04", workspace_id: W, branch_id: "br-02", register_id: "pos-reg-01",
    transaction_number: "TXN-2026-004",
    customer_id: null, customer_name: "Khalid Al-Mansouri", customer_phone: "+966-55-456-7890",
    loyalty_card_number: "LOY-KHA-003",
    subtotal: 4500, discount_amount: 450, discount_percent: 10,
    tax_amount: 607.50, tax_rate: 15, total: 4657.50, currency: "SAR",
    payment_method: "split", payment_details: { cash: 2000, card: 2657.50 },
    status: "completed", cashier_name: "Fatima Nasser",
    notes: "VIP customer — loyalty discount applied", receipt_printed: true,
    loyalty_points_earned: 450, loyalty_points_redeemed: 0,
    metadata: {},
    created_at: ts(1), updated_at: ts(1),
  },
  {
    id: "pos-txn-05", workspace_id: W, branch_id: "br-02", register_id: "pos-reg-02",
    transaction_number: "TXN-2026-005",
    customer_id: null, customer_name: "Fatima Al-Zahra", customer_phone: "+966-55-567-8901",
    loyalty_card_number: null,
    subtotal: 950, discount_amount: 0, discount_percent: 0,
    tax_amount: 142.50, tax_rate: 15, total: 1092.50, currency: "SAR",
    payment_method: "card", payment_details: { card_last_four: "8832", card_type: "mastercard" },
    status: "completed", cashier_name: "Omar Hassan",
    notes: null, receipt_printed: true,
    loyalty_points_earned: 95, loyalty_points_redeemed: 0,
    metadata: {},
    created_at: ts(1), updated_at: ts(1),
  },
  {
    id: "pos-txn-06", workspace_id: W, branch_id: "br-02", register_id: "pos-reg-01",
    transaction_number: "TXN-2026-006",
    customer_id: null, customer_name: "Ahmed Khalil", customer_phone: "+966-55-678-9012",
    loyalty_card_number: null,
    subtotal: 2200, discount_amount: 0, discount_percent: 0,
    tax_amount: 330, tax_rate: 15, total: 2530, currency: "SAR",
    payment_method: "cash", payment_details: { cash_received: 2600, change: 70 },
    status: "voided", cashier_name: "Fatima Nasser",
    notes: "Customer changed mind", receipt_printed: false,
    loyalty_points_earned: 0, loyalty_points_redeemed: 0,
    metadata: { voided_at: ts(0), voided_by: "Fatima Nasser", void_reason: "Customer request" },
    created_at: ts(2), updated_at: ts(2),
  },
];

// ─── POS Transaction Items ────────────────────────────────

export const DEMO_POS_TXN_ITEMS: T<"pos_transaction_items">[] = [
  { id: "pos-item-01", workspace_id: W, transaction_id: "pos-txn-01", product_id: "prd-01", product_name: "Abaya — Zahra", product_name_ar: "عباءة زهرة", sku: "ABY-ZAH-001", quantity: 1, unit_price: 1200, discount_amount: 120, discount_percent: 10, total: 1080, cost_price: 650, branch_id: "br-02", metadata: {}, created_at: ts(0), updated_at: ts(0) },
  { id: "pos-item-02", workspace_id: W, transaction_id: "pos-txn-01", product_id: "prd-01", product_name: "Scarf — Midnight", product_name_ar: "وشاح منتصف الليل", sku: "SCF-MID-001", quantity: 1, unit_price: 450, discount_amount: 45, discount_percent: 10, total: 405, cost_price: 180, branch_id: "br-02", metadata: {}, created_at: ts(0), updated_at: ts(0) },
  { id: "pos-item-03", workspace_id: W, transaction_id: "pos-txn-01", product_id: "prd-01", product_name: "Belt — Gold Chain", product_name_ar: "حزام سلسلة ذهبية", sku: "BLT-GLD-001", quantity: 2, unit_price: 185, discount_amount: 18.5, discount_percent: 10, total: 167.5, cost_price: 60, branch_id: "br-02", metadata: {}, created_at: ts(0), updated_at: ts(0) },
  { id: "pos-item-04", workspace_id: W, transaction_id: "pos-txn-02", product_id: "prd-02", product_name: "Kaftan — Nefertiti", product_name_ar: "قفطان نفرتيتي", sku: "KFT-NEF-001", quantity: 1, unit_price: 2800, discount_amount: 0, discount_percent: 0, total: 2800, cost_price: 1400, branch_id: "br-02", metadata: {}, created_at: ts(0), updated_at: ts(0) },
  { id: "pos-item-05", workspace_id: W, transaction_id: "pos-txn-02", product_id: "prd-01", product_name: "Clutch — Velvet", product_name_ar: "كلاتش مخملي", sku: "CLT-VLV-001", quantity: 1, unit_price: 400, discount_amount: 0, discount_percent: 0, total: 400, cost_price: 150, branch_id: "br-02", metadata: {}, created_at: ts(0), updated_at: ts(0) },
  { id: "pos-item-06", workspace_id: W, transaction_id: "pos-txn-03", product_id: "prd-03", product_name: "T-Shirt — Cairo", product_name_ar: "تيشيرت كايرو", sku: "TSH-CAI-001", quantity: 5, unit_price: 150, discount_amount: 75, discount_percent: 10, total: 675, cost_price: 45, branch_id: "br-02", metadata: {}, created_at: ts(0), updated_at: ts(0) },
  { id: "pos-item-07", workspace_id: W, transaction_id: "pos-txn-04", product_id: "prd-02", product_name: "Kaftan — Nefertiti", product_name_ar: "قفطان نفرتيتي", sku: "KFT-NEF-001", quantity: 1, unit_price: 2800, discount_amount: 280, discount_percent: 10, total: 2520, cost_price: 1400, branch_id: "br-02", metadata: {}, created_at: ts(1), updated_at: ts(1) },
  { id: "pos-item-08", workspace_id: W, transaction_id: "pos-txn-04", product_id: "prd-01", product_name: "Abaya — Zahra", product_name_ar: "عباءة زهرة", sku: "ABY-ZAH-001", quantity: 1, unit_price: 1200, discount_amount: 120, discount_percent: 10, total: 1080, cost_price: 650, branch_id: "br-02", metadata: {}, created_at: ts(1), updated_at: ts(1) },
  { id: "pos-item-09", workspace_id: W, transaction_id: "pos-txn-04", product_id: "prd-01", product_name: "Scarf — Midnight", product_name_ar: "وشاح منتصف الليل", sku: "SCF-MID-001", quantity: 1, unit_price: 450, discount_amount: 45, discount_percent: 10, total: 405, cost_price: 180, branch_id: "br-02", metadata: {}, created_at: ts(1), updated_at: ts(1) },
  { id: "pos-item-10", workspace_id: W, transaction_id: "pos-txn-05", product_id: "prd-01", product_name: "Abaya — Zahra", product_name_ar: "عباءة زهرة", sku: "ABY-ZAH-001", quantity: 1, unit_price: 950, discount_amount: 0, discount_percent: 0, total: 950, cost_price: 650, branch_id: "br-02", metadata: {}, created_at: ts(1), updated_at: ts(1) },
];

// ─── Branch Inventory ─────────────────────────────────────

export const DEMO_BRANCH_INVENTORY: T<"branch_inventory">[] = [
  { id: "bi-01", workspace_id: W, branch_id: "br-02", product_id: "prd-01", product_name: "Abaya — Zahra", sku: "ABY-ZAH-001", quantity: 24, reserved_quantity: 2, reorder_level: 5, unit_cost: 650, unit_price: 1200, last_restocked_at: ts(3), metadata: {}, created_at: ts(90), updated_at: ts(0) },
  { id: "bi-02", workspace_id: W, branch_id: "br-02", product_id: "prd-01", product_name: "Scarf — Midnight", sku: "SCF-MID-001", quantity: 45, reserved_quantity: 0, reorder_level: 10, unit_cost: 180, unit_price: 450, last_restocked_at: ts(5), metadata: {}, created_at: ts(90), updated_at: ts(0) },
  { id: "bi-03", workspace_id: W, branch_id: "br-02", product_id: "prd-01", product_name: "Belt — Gold Chain", sku: "BLT-GLD-001", quantity: 30, reserved_quantity: 0, reorder_level: 8, unit_cost: 60, unit_price: 185, last_restocked_at: ts(7), metadata: {}, created_at: ts(90), updated_at: ts(0) },
  { id: "bi-04", workspace_id: W, branch_id: "br-02", product_id: "prd-02", product_name: "Kaftan — Nefertiti", sku: "KFT-NEF-001", quantity: 12, reserved_quantity: 1, reorder_level: 3, unit_cost: 1400, unit_price: 2800, last_restocked_at: ts(2), metadata: {}, created_at: ts(90), updated_at: ts(0) },
  { id: "bi-05", workspace_id: W, branch_id: "br-02", product_id: "prd-01", product_name: "Clutch — Velvet", sku: "CLT-VLV-001", quantity: 18, reserved_quantity: 0, reorder_level: 5, unit_cost: 150, unit_price: 400, last_restocked_at: ts(10), metadata: {}, created_at: ts(90), updated_at: ts(0) },
  { id: "bi-06", workspace_id: W, branch_id: "br-02", product_id: "prd-03", product_name: "T-Shirt — Cairo", sku: "TSH-CAI-001", quantity: 60, reserved_quantity: 0, reorder_level: 15, unit_cost: 45, unit_price: 150, last_restocked_at: ts(1), metadata: {}, created_at: ts(90), updated_at: ts(0) },
  { id: "bi-07", workspace_id: W, branch_id: "br-02", product_id: "prd-04", product_name: "Bridal Gown — Leila", sku: "BRL-LEI-001", quantity: 3, reserved_quantity: 1, reorder_level: 1, unit_cost: 5150, unit_price: 8500, last_restocked_at: ts(15), metadata: {}, created_at: ts(90), updated_at: ts(0) },
  { id: "bi-08", workspace_id: W, branch_id: "br-01", product_id: "prd-01", product_name: "Abaya — Zahra", sku: "ABY-ZAH-001", quantity: 50, reserved_quantity: 0, reorder_level: 10, unit_cost: 650, unit_price: 1200, last_restocked_at: ts(1), metadata: {}, created_at: ts(90), updated_at: ts(0) },
  { id: "bi-09", workspace_id: W, branch_id: "br-01", product_id: "prd-02", product_name: "Kaftan — Nefertiti", sku: "KFT-NEF-001", quantity: 20, reserved_quantity: 0, reorder_level: 5, unit_cost: 1400, unit_price: 2800, last_restocked_at: ts(2), metadata: {}, created_at: ts(90), updated_at: ts(0) },
  { id: "bi-10", workspace_id: W, branch_id: "br-03", product_id: "prd-01", product_name: "Abaya — Zahra", sku: "ABY-ZAH-001", quantity: 100, reserved_quantity: 0, reorder_level: 20, unit_cost: 650, unit_price: 1200, last_restocked_at: ts(5), metadata: {}, created_at: ts(90), updated_at: ts(0) },
  { id: "bi-11", workspace_id: W, branch_id: "br-03", product_id: "prd-02", product_name: "Kaftan — Nefertiti", sku: "KFT-NEF-001", quantity: 40, reserved_quantity: 0, reorder_level: 10, unit_cost: 1400, unit_price: 2800, last_restocked_at: ts(8), metadata: {}, created_at: ts(90), updated_at: ts(0) },
  { id: "bi-12", workspace_id: W, branch_id: "br-03", product_id: "prd-03", product_name: "T-Shirt — Cairo", sku: "TSH-CAI-001", quantity: 200, reserved_quantity: 0, reorder_level: 30, unit_cost: 45, unit_price: 150, last_restocked_at: ts(3), metadata: {}, created_at: ts(90), updated_at: ts(0) },
];
