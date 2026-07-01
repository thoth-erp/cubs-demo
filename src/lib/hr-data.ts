/**
 * HR Module Demo Data — بيانات تجريبية للموارد البشرية
 *
 * Comprehensive Egyptian fashion business HR data:
 * 25 employees, attendance, leaves, payroll, performance, recruitment, assets, timeline, alerts
 */

const W = "demo";
const now = new Date().toISOString();
const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
const ts = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString();
const dt = (hoursAgo: number) => new Date(Date.now() - hoursAgo * 3600000).toISOString();

// ─── Employee ─────────────────────────────────────────────

export interface HREmployee {
  id: string;
  workspace_id: string;
  employee_number: string;
  full_name: string;
  full_name_ar: string;
  phone: string;
  email: string;
  department: string;
  job_title: string;
  job_title_ar: string;
  employment_type: "full_time" | "part_time" | "contract" | "daily";
  status: "active" | "on_leave" | "suspended" | "terminated" | "probation";
  hire_date: string;
  contract_end_date: string | null;
  salary: number;
  salary_type: "monthly" | "daily" | "hourly";
  branch: string;
  manager_id: string | null;
  manager_name: string;
  address: string;
  emergency_contact: string;
  emergency_phone: string;
  avatar_color: string;
  skills: { skill: string; level: number }[];
  leave_balance: number;
  attendance_risk: "low" | "medium" | "high";
  probation_end_date: string | null;
  last_review_date: string | null;
  next_review_date: string | null;
  performance_score: number | null;
  documents: { name: string; type: string; uploaded_at: string }[];
  equipment: { item: string; assigned_at: string; status: "assigned" | "returned" }[];
  metadata: Record<string, any>;
}

export const HR_EMPLOYEES: HREmployee[] = [
  { id: "e01", workspace_id: W, employee_number: "EMP-1001", full_name: "Ahmed Ali", full_name_ar: "أحمد علي", phone: "+20-100-111-2222", email: "ahmed.ali@thoth.com", department: "management", job_title: "General Manager", job_title_ar: "المدير العام", employment_type: "full_time", status: "active", hire_date: d(1800), contract_end_date: null, salary: 45000, salary_type: "monthly", branch: "Nasr City", manager_id: null, manager_name: "—", address: "Nasr City, Cairo", emergency_contact: "Fatma Ali", emergency_phone: "+20-100-333-4444", avatar_color: "#1E3A5F", skills: [{ skill: "supervision", level: 5 }, { skill: "design_cad", level: 3 }], leave_balance: 18, attendance_risk: "low", probation_end_date: null, last_review_date: d(60), next_review_date: d(-30), performance_score: 92, documents: [{ name: "Employment Contract", type: "contract", uploaded_at: d(1800) }, { name: "National ID", type: "id", uploaded_at: d(1800) }], equipment: [{ item: "MacBook Pro", assigned_at: d(1800), status: "assigned" }, { item: "iPhone 15", assigned_at: d(300), status: "assigned" }], metadata: {} },
  { id: "e02", workspace_id: W, employee_number: "EMP-1002", full_name: "Sara Mahmoud", full_name_ar: "سارة محمود", phone: "+20-111-222-3333", email: "sara.m@thoth.com", department: "sales", job_title: "Sales Manager", job_title_ar: "مديرة المبيعات", employment_type: "full_time", status: "active", hire_date: d(1200), contract_end_date: d(-180), salary: 28000, salary_type: "monthly", branch: "Nasr City", manager_id: "e01", manager_name: "Ahmed Ali", address: "Maadi, Cairo", emergency_contact: "Mahmoud Hassan", emergency_phone: "+20-111-444-5555", avatar_color: "#E07A5F", skills: [{ skill: "supervision", level: 4 }, { skill: "quality_control", level: 3 }], leave_balance: 15, attendance_risk: "low", probation_end_date: null, last_review_date: d(30), next_review_date: d(-60), performance_score: 88, documents: [{ name: "Employment Contract", type: "contract", uploaded_at: d(1200) }], equipment: [{ item: "MacBook Air", assigned_at: d(1200), status: "assigned" }], metadata: {} },
  { id: "e03", workspace_id: W, employee_number: "EMP-1003", full_name: "Mohamed Gamal", full_name_ar: "محمد جمال", phone: "+20-122-333-4444", email: "mo.gamal@thoth.com", department: "production", job_title: "Production Supervisor", job_title_ar: "مشرف الإنتاج", employment_type: "full_time", status: "active", hire_date: d(900), contract_end_date: d(-90), salary: 18000, salary_type: "monthly", branch: "10th Ramadan", manager_id: "e01", manager_name: "Ahmed Ali", address: "Heliopolis, Cairo", emergency_contact: "Gamal Hassan", emergency_phone: "+20-122-555-6666", avatar_color: "#3B82F6", skills: [{ skill: "cnc_operator", level: 5 }, { skill: "cutting", level: 4 }, { skill: "supervision", level: 4 }], leave_balance: 12, attendance_risk: "low", probation_end_date: null, last_review_date: d(45), next_review_date: d(-15), performance_score: 85, documents: [{ name: "Employment Contract", type: "contract", uploaded_at: d(900) }], equipment: [{ item: "Samsung Phone", assigned_at: d(900), status: "assigned" }], metadata: {} },
  { id: "e04", workspace_id: W, employee_number: "EMP-1004", full_name: "Fatma Hassan", full_name_ar: "فاطمة حسن", phone: "+20-133-444-5555", email: "fatma.h@thoth.com", department: "design", job_title: "Senior Designer", job_title_ar: "مصممة أولى", employment_type: "full_time", status: "active", hire_date: d(750), contract_end_date: null, salary: 22000, salary_type: "monthly", branch: "Nasr City", manager_id: "e01", manager_name: "Ahmed Ali", address: "6th October, Giza", emergency_contact: "Hassan Ali", emergency_phone: "+20-133-666-7777", avatar_color: "#EC4899", skills: [{ skill: "design_cad", level: 5 }, { skill: "upholstery", level: 3 }], leave_balance: 14, attendance_risk: "low", probation_end_date: null, last_review_date: d(20), next_review_date: d(-70), performance_score: 94, documents: [{ name: "Employment Contract", type: "contract", uploaded_at: d(750) }, { name: "Design Certificate", type: "certificate", uploaded_at: d(750) }], equipment: [{ item: "MacBook Pro", assigned_at: d(750), status: "assigned" }, { item: "Wacom Tablet", assigned_at: d(750), status: "assigned" }], metadata: {} },
  { id: "e05", workspace_id: W, employee_number: "EMP-1005", full_name: "Omar Salah", full_name_ar: "عمر صلاح", phone: "+20-144-555-6666", email: "omar.s@thoth.com", department: "warehouse", job_title: "Warehouse Manager", job_title_ar: "مدير المخزن", employment_type: "full_time", status: "active", hire_date: d(600), contract_end_date: d(-30), salary: 15000, salary_type: "monthly", branch: "10th Ramadan", manager_id: "e03", manager_name: "Mohamed Gamal", address: "Shubra, Cairo", emergency_contact: "Salah Omar", emergency_phone: "+20-144-777-8888", avatar_color: "#F59E0B", skills: [{ skill: "quality_control", level: 4 }, { skill: "supervision", level: 3 }], leave_balance: 10, attendance_risk: "medium", probation_end_date: null, last_review_date: d(90), next_review_date: d(60), performance_score: 72, documents: [{ name: "Employment Contract", type: "contract", uploaded_at: d(600) }], equipment: [{ item: "Samsung Phone", assigned_at: d(600), status: "assigned" }], metadata: {} },
  { id: "e06", workspace_id: W, employee_number: "EMP-1006", full_name: "Nora Al-Farsi", full_name_ar: "نورة الفارسي", phone: "+20-155-666-7777", email: "nora.f@thoth.com", department: "sales", job_title: "Senior Sales Associate", job_title_ar: "مندوبة مبيعات أولى", employment_type: "full_time", status: "active", hire_date: d(500), contract_end_date: null, salary: 12000, salary_type: "monthly", branch: "Nasr City", manager_id: "e02", manager_name: "Sara Mahmoud", address: "Nasr City, Cairo", emergency_contact: "Al-Farsi Hassan", emergency_phone: "+20-155-888-9999", avatar_color: "#8B5CF6", skills: [{ skill: "supervision", level: 3 }], leave_balance: 16, attendance_risk: "low", probation_end_date: null, last_review_date: d(15), next_review_date: d(-45), performance_score: 91, documents: [{ name: "Employment Contract", type: "contract", uploaded_at: d(500) }], equipment: [{ item: "iPhone 14", assigned_at: d(500), status: "assigned" }], metadata: {} },
  { id: "e07", workspace_id: W, employee_number: "EMP-1007", full_name: "Khaled Nabil", full_name_ar: "خالد نبيل", phone: "+20-166-777-8888", email: "khaled.n@thoth.com", department: "production", job_title: "CNC Operator", job_title_ar: "مشغل CNC", employment_type: "full_time", status: "active", hire_date: d(400), contract_end_date: d(120), salary: 8000, salary_type: "monthly", branch: "10th Ramadan", manager_id: "e03", manager_name: "Mohamed Gamal", address: "Ain Shams, Cairo", emergency_contact: "Nabil Khaled", emergency_phone: "+20-166-999-0000", avatar_color: "#06B6D4", skills: [{ skill: "cnc_operator", level: 4 }, { skill: "drilling", level: 3 }], leave_balance: 8, attendance_risk: "high", probation_end_date: null, last_review_date: d(120), next_review_date: d(30), performance_score: 65, documents: [{ name: "Employment Contract", type: "contract", uploaded_at: d(400) }], equipment: [{ item: "Safety Gear", assigned_at: d(400), status: "assigned" }], metadata: {} },
  { id: "e08", workspace_id: W, employee_number: "EMP-1008", full_name: "Mona Saad", full_name_ar: "منى سعد", phone: "+20-177-888-9999", email: "mona.s@thoth.com", department: "admin", job_title: "HR Coordinator", job_title_ar: "منسقة الموارد البشرية", employment_type: "full_time", status: "active", hire_date: d(350), contract_end_date: null, salary: 14000, salary_type: "monthly", branch: "Nasr City", manager_id: "e01", manager_name: "Ahmed Ali", address: "Mohandessin, Giza", emergency_contact: "Saad Mona", emergency_phone: "+20-177-000-1111", avatar_color: "#10B981", skills: [{ skill: "supervision", level: 3 }], leave_balance: 14, attendance_risk: "low", probation_end_date: null, last_review_date: d(10), next_review_date: d(-80), performance_score: 87, documents: [{ name: "Employment Contract", type: "contract", uploaded_at: d(350) }], equipment: [{ item: "MacBook Air", assigned_at: d(350), status: "assigned" }], metadata: {} },
  { id: "e09", workspace_id: W, employee_number: "EMP-1009", full_name: "Tamer Hosny", full_name_ar: "تامر حسني", phone: "+20-188-999-0000", email: "tamer.h@thoth.com", department: "delivery", job_title: "Delivery Driver", job_title_ar: "سائق توصيل", employment_type: "full_time", status: "active", hire_date: d(300), contract_end_date: d(60), salary: 7000, salary_type: "monthly", branch: "10th Ramadan", manager_id: "e05", manager_name: "Omar Salah", address: "Marg, Cairo", emergency_contact: "Hosny Tamer", emergency_phone: "+20-188-111-2222", avatar_color: "#F97316", skills: [{ skill: "driving", level: 5 }], leave_balance: 6, attendance_risk: "medium", probation_end_date: null, last_review_date: d(60), next_review_date: d(-30), performance_score: 74, documents: [{ name: "Employment Contract", type: "contract", uploaded_at: d(300) }, { name: "Driving License", type: "permit", uploaded_at: d(300) }], equipment: [{ item: "Delivery Van", assigned_at: d(300), status: "assigned" }, { item: "Samsung Phone", assigned_at: d(300), status: "assigned" }], metadata: {} },
  { id: "e10", workspace_id: W, employee_number: "EMP-1010", full_name: "Dina Ragab", full_name_ar: "دينا رجب", phone: "+20-190-000-1111", email: "dina.r@thoth.com", department: "sales", job_title: "Sales Associate", job_title_ar: "مندوبة مبيعات", employment_type: "full_time", status: "on_leave", hire_date: d(250), contract_end_date: null, salary: 10000, salary_type: "monthly", branch: "Nasr City", manager_id: "e02", manager_name: "Sara Mahmoud", address: "Dokki, Giza", emergency_contact: "Ragab Dina", emergency_phone: "+20-190-222-3333", avatar_color: "#A855F7", skills: [{ skill: "supervision", level: 2 }], leave_balance: 10, attendance_risk: "low", probation_end_date: null, last_review_date: d(30), next_review_date: d(-60), performance_score: 80, documents: [{ name: "Employment Contract", type: "contract", uploaded_at: d(250) }], equipment: [{ item: "iPhone 13", assigned_at: d(250), status: "assigned" }], metadata: {} },
  { id: "e11", workspace_id: W, employee_number: "EMP-1011", full_name: "Youssef Ali", full_name_ar: "يوسف علي", phone: "+20-101-222-3333", email: "youssef.a@thoth.com", department: "production", job_title: "Edge Banding Operator", job_title_ar: "مشغل كنار", employment_type: "full_time", status: "active", hire_date: d(200), contract_end_date: d(180), salary: 7500, salary_type: "monthly", branch: "10th Ramadan", manager_id: "e03", manager_name: "Mohamed Gamal", address: "Tanta, Gharbia", emergency_contact: "Ali Youssef", emergency_phone: "+20-101-444-5555", avatar_color: "#6366F1", skills: [{ skill: "edge_banding", level: 4 }, { skill: "cutting", level: 3 }], leave_balance: 8, attendance_risk: "low", probation_end_date: null, last_review_date: d(45), next_review_date: d(-45), performance_score: 78, documents: [{ name: "Employment Contract", type: "contract", uploaded_at: d(200) }], equipment: [{ item: "Safety Gear", assigned_at: d(200), status: "assigned" }], metadata: {} },
  { id: "e12", workspace_id: W, employee_number: "EMP-1012", full_name: "Heba Nabil", full_name_ar: "هبة نبيل", phone: "+20-102-333-4444", email: "heba.n@thoth.com", department: "design", job_title: "Junior Designer", job_title_ar: "مصممة مبتدئة", employment_type: "full_time", status: "probation", hire_date: d(45), contract_end_date: null, salary: 9000, salary_type: "monthly", branch: "Nasr City", manager_id: "e04", manager_name: "Fatma Hassan", address: "Sheraton, Cairo", emergency_contact: "Nabil Heba", emergency_phone: "+20-102-555-6666", avatar_color: "#0EA5E9", skills: [{ skill: "design_cad", level: 2 }], leave_balance: 0, attendance_risk: "low", probation_end_date: d(-45), last_review_date: null, next_review_date: d(-45), performance_score: null, documents: [{ name: "Employment Contract", type: "contract", uploaded_at: d(45) }], equipment: [{ item: "MacBook Air", assigned_at: d(45), status: "assigned" }], metadata: {} },
  { id: "e13", workspace_id: W, employee_number: "EMP-1013", full_name: "Amira Khaled", full_name_ar: "أميرة خالد", phone: "+20-103-444-5555", email: "amira.k@thoth.com", department: "production", job_title: "Assembly Worker", job_title_ar: "عاملة تجميع", employment_type: "full_time", status: "active", hire_date: d(150), contract_end_date: d(210), salary: 6500, salary_type: "monthly", branch: "10th Ramadan", manager_id: "e03", manager_name: "Mohamed Gamal", address: "Shubra, Cairo", emergency_contact: "Khaled Amira", emergency_phone: "+20-103-666-7777", avatar_color: "#D946EF", skills: [{ skill: "assembly", level: 3 }, { skill: "upholstery", level: 2 }], leave_balance: 6, attendance_risk: "medium", probation_end_date: null, last_review_date: d(30), next_review_date: d(-60), performance_score: 70, documents: [{ name: "Employment Contract", type: "contract", uploaded_at: d(150) }], equipment: [{ item: "Safety Gear", assigned_at: d(150), status: "assigned" }], metadata: {} },
  { id: "e14", workspace_id: W, employee_number: "EMP-1014", full_name: "Rania Mostafa", full_name_ar: "رانيا مصطفى", phone: "+20-104-555-6666", email: "rania.m@thoth.com", department: "admin", job_title: "Finance Officer", job_title_ar: "مسئول المالية", employment_type: "full_time", status: "active", hire_date: d(500), contract_end_date: null, salary: 16000, salary_type: "monthly", branch: "Nasr City", manager_id: "e01", manager_name: "Ahmed Ali", address: "Zamalek, Cairo", emergency_contact: "Mostafa Rania", emergency_phone: "+20-104-777-8888", avatar_color: "#8B5CF6", skills: [{ skill: "quality_control", level: 3 }], leave_balance: 12, attendance_risk: "low", probation_end_date: null, last_review_date: d(25), next_review_date: d(-65), performance_score: 89, documents: [{ name: "Employment Contract", type: "contract", uploaded_at: d(500) }, { name: "Accounting Certificate", type: "certificate", uploaded_at: d(500) }], equipment: [{ item: "MacBook Air", assigned_at: d(500), status: "assigned" }], metadata: {} },
  { id: "e15", workspace_id: W, employee_number: "EMP-1015", full_name: "Walid Nasser", full_name_ar: "وليد ناصر", phone: "+20-105-666-7777", email: "walid.n@thoth.com", department: "production", job_title: "Painting Specialist", job_title_ar: "متخصص دهان", employment_type: "full_time", status: "active", hire_date: d(100), contract_end_date: d(260), salary: 7000, salary_type: "monthly", branch: "10th Ramadan", manager_id: "e03", manager_name: "Mohamed Gamal", address: "Bulaq, Cairo", emergency_contact: "Nasser Walid", emergency_phone: "+20-105-888-9999", avatar_color: "#78716C", skills: [{ skill: "painting", level: 4 }], leave_balance: 4, attendance_risk: "high", probation_end_date: null, last_review_date: d(90), next_review_date: d(0), performance_score: 62, documents: [{ name: "Employment Contract", type: "contract", uploaded_at: d(100) }], equipment: [{ item: "Safety Gear", assigned_at: d(100), status: "assigned" }], metadata: {} },
  { id: "e16", workspace_id: W, employee_number: "EMP-1016", full_name: "Salma Farouk", full_name_ar: "سلمى فاروق", phone: "+20-106-777-8888", email: "salma.f@thoth.com", department: "sales", job_title: "Sales Associate", job_title_ar: "مندوبة مبيعات", employment_type: "part_time", status: "active", hire_date: d(80), contract_end_date: d(280), salary: 5000, salary_type: "monthly", branch: "Nasr City", manager_id: "e02", manager_name: "Sara Mahmoud", address: "Heliopolis, Cairo", emergency_contact: "Farouk Salma", emergency_phone: "+20-106-999-0000", avatar_color: "#F472B6", skills: [], leave_balance: 4, attendance_risk: "low", probation_end_date: d(-10), last_review_date: null, next_review_date: d(-80), performance_score: null, documents: [{ name: "Employment Contract", type: "contract", uploaded_at: d(80) }], equipment: [], metadata: {} },
  { id: "e17", workspace_id: W, employee_number: "EMP-1017", full_name: "Hassan Barakat", full_name_ar: "حسن بركات", phone: "+20-107-888-9999", email: "hassan.b@thoth.com", department: "delivery", job_title: "Delivery Supervisor", job_title_ar: "مشرف التوصيل", employment_type: "full_time", status: "active", hire_date: d(450), contract_end_date: null, salary: 11000, salary_type: "monthly", branch: "10th Ramadan", manager_id: "e05", manager_name: "Omar Salah", address: "Ein Shams, Cairo", emergency_contact: "Barakat Hassan", emergency_phone: "+20-107-000-1111", avatar_color: "#059669", skills: [{ skill: "driving", level: 4 }, { skill: "supervision", level: 3 }], leave_balance: 10, attendance_risk: "low", probation_end_date: null, last_review_date: d(30), next_review_date: d(-60), performance_score: 82, documents: [{ name: "Employment Contract", type: "contract", uploaded_at: d(450) }, { name: "Driving License", type: "permit", uploaded_at: d(450) }], equipment: [{ item: "Delivery Van", assigned_at: d(450), status: "assigned" }, { item: "Samsung Phone", assigned_at: d(450), status: "assigned" }], metadata: {} },
  { id: "e18", workspace_id: W, employee_number: "EMP-1018", full_name: "Yasmin Adel", full_name_ar: "ياسمين عادل", phone: "+20-108-999-0000", email: "yasmin.a@thoth.com", department: "production", job_title: "Quality Control", job_title_ar: "مراقبة جودة", employment_type: "full_time", status: "active", hire_date: d(320), contract_end_date: d(40), salary: 9500, salary_type: "monthly", branch: "10th Ramadan", manager_id: "e03", manager_name: "Mohamed Gamal", address: "Nasr City, Cairo", emergency_contact: "Adel Yasmin", emergency_phone: "+20-108-111-2222", avatar_color: "#BE185D", skills: [{ skill: "quality_control", level: 5 }, { skill: "assembly", level: 3 }], leave_balance: 9, attendance_risk: "low", probation_end_date: null, last_review_date: d(15), next_review_date: d(-75), performance_score: 90, documents: [{ name: "Employment Contract", type: "contract", uploaded_at: d(320) }], equipment: [{ item: "Samsung Phone", assigned_at: d(320), status: "assigned" }], metadata: {} },
  { id: "e19", workspace_id: W, employee_number: "EMP-1019", full_name: "Mariam Hassan", full_name_ar: "مريم حسن", phone: "+20-109-000-1111", email: "mariam.h@thoth.com", department: "sales", job_title: "Senior Sales Associate", job_title_ar: "مندوبة مبيعات أولى", employment_type: "full_time", status: "active", hire_date: d(650), contract_end_date: null, salary: 13000, salary_type: "monthly", branch: "Nasr City", manager_id: "e02", manager_name: "Sara Mahmoud", address: "Nasr City, Cairo", emergency_contact: "Hassan Mariam", emergency_phone: "+20-109-222-3333", avatar_color: "#DC2626", skills: [{ skill: "supervision", level: 3 }], leave_balance: 14, attendance_risk: "medium", probation_end_date: null, last_review_date: d(10), next_review_date: d(-80), performance_score: 86, documents: [{ name: "Employment Contract", type: "contract", uploaded_at: d(650) }], equipment: [{ item: "iPhone 14", assigned_at: d(650), status: "assigned" }], metadata: {} },
  { id: "e20", workspace_id: W, employee_number: "EMP-1020", full_name: "Nadia Sherif", full_name_ar: "نادية شريف", phone: "+20-110-111-2222", email: "nadia.s@thoth.com", department: "admin", job_title: "Admin Assistant", job_title_ar: "مساعدة إدارية", employment_type: "full_time", status: "active", hire_date: d(180), contract_end_date: d(180), salary: 8000, salary_type: "monthly", branch: "Nasr City", manager_id: "e08", manager_name: "Mona Saad", address: "Mohandessin, Giza", emergency_contact: "Sherif Nadia", emergency_phone: "+20-110-333-4444", avatar_color: "#BE185D", skills: [], leave_balance: 6, attendance_risk: "low", probation_end_date: null, last_review_date: d(30), next_review_date: d(-60), performance_score: 76, documents: [{ name: "Employment Contract", type: "contract", uploaded_at: d(180) }], equipment: [{ item: "Samsung Phone", assigned_at: d(180), status: "assigned" }], metadata: {} },
  { id: "e21", workspace_id: W, employee_number: "EMP-1021", full_name: "Tamer Adel", full_name_ar: "تامر عادل", phone: "+20-111-222-3333", email: "tamer.a@thoth.com", department: "production", job_title: "Assembly Worker", job_title_ar: "عامل تجميع", employment_type: "daily", status: "terminated", hire_date: d(120), contract_end_date: null, salary: 300, salary_type: "daily", branch: "10th Ramadan", manager_id: "e03", manager_name: "Mohamed Gamal", address: "Shubra, Cairo", emergency_contact: "Adel Tamer", emergency_phone: "+20-111-444-5555", avatar_color: "#64748B", skills: [{ skill: "assembly", level: 2 }], leave_balance: 0, attendance_risk: "high", probation_end_date: null, last_review_date: d(60), next_review_date: null, performance_score: 45, documents: [{ name: "Employment Contract", type: "contract", uploaded_at: d(120) }], equipment: [{ item: "Safety Gear", assigned_at: d(120), status: "returned" }], metadata: {} },
  { id: "e22", workspace_id: W, employee_number: "EMP-1022", full_name: "Layla Hassan", full_name_ar: "ليلى حسن", phone: "+20-112-333-4444", email: "layla.h@thoth.com", department: "production", job_title: "Upholstery Worker", job_title_ar: "عاملة تنجيد", employment_type: "full_time", status: "active", hire_date: d(90), contract_end_date: d(270), salary: 7000, salary_type: "monthly", branch: "10th Ramadan", manager_id: "e03", manager_name: "Mohamed Gamal", address: "Imbaba, Giza", emergency_contact: "Hassan Layla", emergency_phone: "+20-112-555-6666", avatar_color: "#EC4899", skills: [{ skill: "upholstery", level: 3 }], leave_balance: 4, attendance_risk: "low", probation_end_date: null, last_review_date: d(60), next_review_date: d(-30), performance_score: 75, documents: [{ name: "Employment Contract", type: "contract", uploaded_at: d(90) }], equipment: [{ item: "Safety Gear", assigned_at: d(90), status: "assigned" }], metadata: {} },
  { id: "e23", workspace_id: W, employee_number: "EMP-1023", full_name: "Hany El-Behiri", full_name_ar: "هاني البهيري", phone: "+20-113-444-5555", email: "hany.b@thoth.com", department: "design", job_title: "Creative Director", job_title_ar: "المدير الإبداعي", employment_type: "contract", status: "active", hire_date: d(200), contract_end_date: d(160), salary: 35000, salary_type: "monthly", branch: "Nasr City", manager_id: "e01", manager_name: "Ahmed Ali", address: "Zamalek, Cairo", emergency_contact: "El-Behiri Hany", emergency_phone: "+20-113-666-7777", avatar_color: "#F59E0B", skills: [{ skill: "design_cad", level: 5 }, { skill: "upholstery", level: 4 }], leave_balance: 8, attendance_risk: "low", probation_end_date: null, last_review_date: d(45), next_review_date: d(-45), performance_score: 96, documents: [{ name: "Contract Agreement", type: "contract", uploaded_at: d(200) }], equipment: [{ item: "MacBook Pro", assigned_at: d(200), status: "assigned" }, { item: "iPhone 15 Pro", assigned_at: d(200), status: "assigned" }], metadata: {} },
  { id: "e24", workspace_id: W, employee_number: "EMP-1024", full_name: "Sherif Adel", full_name_ar: "شريف عادل", phone: "+20-114-555-6666", email: "sherif.a@thoth.com", department: "warehouse", job_title: "Warehouse Worker", job_title_ar: "عامل مخزن", employment_type: "full_time", status: "suspended", hire_date: d(150), contract_end_date: d(210), salary: 6000, salary_type: "monthly", branch: "10th Ramadan", manager_id: "e05", manager_name: "Omar Salah", address: "Bulaq, Cairo", emergency_contact: "Adel Sherif", emergency_phone: "+20-114-777-8888", avatar_color: "#64748B", skills: [], leave_balance: 4, attendance_risk: "high", probation_end_date: null, last_review_date: d(30), next_review_date: null, performance_score: 40, documents: [{ name: "Employment Contract", type: "contract", uploaded_at: d(150) }], equipment: [{ item: "Samsung Phone", assigned_at: d(150), status: "returned" }], metadata: {} },
  { id: "e25", workspace_id: W, employee_number: "EMP-1025", full_name: "Mariam Adel", full_name_ar: "مريم عادل", phone: "+20-115-666-7777", email: "mariam.a@thoth.com", department: "production", job_title: "Drilling Operator", job_title_ar: "_OPERATR_TR", employment_type: "full_time", status: "active", hire_date: d(60), contract_end_date: d(300), salary: 7500, salary_type: "monthly", branch: "10th Ramadan", manager_id: "e03", manager_name: "Mohamed Gamal", address: "Shubra, Cairo", emergency_contact: "Adel Mariam", emergency_phone: "+20-115-888-9999", avatar_color: "#BE185D", skills: [{ skill: "drilling", level: 3 }], leave_balance: 2, attendance_risk: "low", probation_end_date: d(-30), last_review_date: null, next_review_date: d(-60), performance_score: null, documents: [{ name: "Employment Contract", type: "contract", uploaded_at: d(60) }], equipment: [{ item: "Safety Gear", assigned_at: d(60), status: "assigned" }], metadata: {} },
];

// ─── Attendance ───────────────────────────────────────────

export interface HRAttendance {
  id: string;
  workspace_id: string;
  employee_id: string;
  date: string;
  status: "present" | "absent" | "late" | "half_day" | "holiday" | "sick_leave" | "annual_leave" | "excused";
  check_in: string | null;
  check_out: string | null;
  overtime_hours: number;
}

export const HR_ATTENDANCE: HRAttendance[] = [
  { id: "att01", workspace_id: W, employee_id: "e01", date: d(0), status: "present", check_in: dt(8), check_out: null, overtime_hours: 0 },
  { id: "att02", workspace_id: W, employee_id: "e02", date: d(0), status: "present", check_in: dt(7.5), check_out: null, overtime_hours: 0 },
  { id: "att03", workspace_id: W, employee_id: "e03", date: d(0), status: "late", check_in: dt(7), check_out: null, overtime_hours: 0 },
  { id: "att04", workspace_id: W, employee_id: "e04", date: d(0), status: "present", check_in: dt(8.5), check_out: null, overtime_hours: 0 },
  { id: "att05", workspace_id: W, employee_id: "e05", date: d(0), status: "present", check_in: dt(7), check_out: null, overtime_hours: 0 },
  { id: "att06", workspace_id: W, employee_id: "e06", date: d(0), status: "present", check_in: dt(8), check_out: null, overtime_hours: 0 },
  { id: "att07", workspace_id: W, employee_id: "e07", date: d(0), status: "absent", check_in: null, check_out: null, overtime_hours: 0 },
  { id: "att08", workspace_id: W, employee_id: "e08", date: d(0), status: "present", check_in: dt(8), check_out: null, overtime_hours: 0 },
  { id: "att09", workspace_id: W, employee_id: "e09", date: d(0), status: "present", check_in: dt(7), check_out: null, overtime_hours: 0 },
  { id: "att10", workspace_id: W, employee_id: "e10", date: d(0), status: "annual_leave", check_in: null, check_out: null, overtime_hours: 0 },
  { id: "att11", workspace_id: W, employee_id: "e11", date: d(0), status: "present", check_in: dt(8), check_out: null, overtime_hours: 0 },
  { id: "att12", workspace_id: W, employee_id: "e12", date: d(0), status: "present", check_in: dt(8.5), check_out: null, overtime_hours: 0 },
  { id: "att13", workspace_id: W, employee_id: "e13", date: d(0), status: "late", check_in: dt(6.5), check_out: null, overtime_hours: 0 },
  { id: "att14", workspace_id: W, employee_id: "e14", date: d(0), status: "present", check_in: dt(8), check_out: null, overtime_hours: 0 },
  { id: "att15", workspace_id: W, employee_id: "e15", date: d(0), status: "absent", check_in: null, check_out: null, overtime_hours: 0 },
  { id: "att16", workspace_id: W, employee_id: "e16", date: d(0), status: "present", check_in: dt(9), check_out: null, overtime_hours: 0 },
  { id: "att17", workspace_id: W, employee_id: "e17", date: d(0), status: "present", check_in: dt(7), check_out: null, overtime_hours: 0 },
  { id: "att18", workspace_id: W, employee_id: "e18", date: d(0), status: "present", check_in: dt(8), check_out: null, overtime_hours: 0 },
  { id: "att19", workspace_id: W, employee_id: "e19", date: d(0), status: "late", check_in: dt(7.5), check_out: null, overtime_hours: 0 },
  { id: "att20", workspace_id: W, employee_id: "e20", date: d(0), status: "present", check_in: dt(8), check_out: null, overtime_hours: 0 },
  { id: "att21", workspace_id: W, employee_id: "e22", date: d(0), status: "present", check_in: dt(8), check_out: null, overtime_hours: 0 },
  { id: "att22", workspace_id: W, employee_id: "e23", date: d(0), status: "present", check_in: dt(9), check_out: null, overtime_hours: 0 },
  { id: "att23", workspace_id: W, employee_id: "e25", date: d(0), status: "present", check_in: dt(8), check_out: null, overtime_hours: 0 },
];

// ─── Leave Requests ───────────────────────────────────────

export interface HRLeaveRequest {
  id: string;
  workspace_id: string;
  employee_id: string;
  leave_type: "annual" | "sick" | "unpaid" | "emergency" | "maternity" | "paternity" | "other";
  start_date: string;
  end_date: string;
  days: number;
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

export const HR_LEAVES: HRLeaveRequest[] = [
  { id: "lv01", workspace_id: W, employee_id: "e10", leave_type: "annual", start_date: d(0), end_date: d(5), days: 5, reason: "Family vacation to Hurghada", status: "approved", approved_by: "e02", approved_at: d(2), created_at: d(3) },
  { id: "lv02", workspace_id: W, employee_id: "e07", leave_type: "sick", start_date: d(0), end_date: d(1), days: 2, reason: "Flu and fever", status: "pending", approved_by: null, approved_at: null, created_at: d(0) },
  { id: "lv03", workspace_id: W, employee_id: "e15", leave_type: "emergency", start_date: d(1), end_date: d(1), days: 1, reason: "Family emergency", status: "pending", approved_by: null, approved_at: null, created_at: d(0) },
  { id: "lv04", workspace_id: W, employee_id: "e19", leave_type: "annual", start_date: d(-10), end_date: d(-7), days: 4, reason: "Wedding anniversary trip", status: "approved", approved_by: "e02", approved_at: d(-12), created_at: d(-14) },
  { id: "lv05", workspace_id: W, employee_id: "e13", leave_type: "sick", start_date: d(-20), end_date: d(-18), days: 3, reason: "Dental surgery", status: "approved", approved_by: "e03", approved_at: d(-21), created_at: d(-22) },
  { id: "lv06", workspace_id: W, employee_id: "e09", leave_type: "annual", start_date: d(-30), end_date: d(-28), days: 3, reason: "Personal errands", status: "approved", approved_by: "e05", approved_at: d(-31), created_at: d(-32) },
];

// ─── Payroll ──────────────────────────────────────────────

export interface HRPayrollRecord {
  id: string;
  workspace_id: string;
  employee_id: string;
  period: string;
  basic_salary: number;
  allowances: number;
  deductions: number;
  overtime_pay: number;
  bonus: number;
  net_salary: number;
  status: "draft" | "pending" | "approved" | "paid";
  paid_at: string | null;
  created_at: string;
  finance_expense_id: string | null;
}

export const HR_PAYROLL: HRPayrollRecord[] = [
  { id: "pr01", workspace_id: W, employee_id: "e01", period: "2026-05", basic_salary: 45000, allowances: 5000, deductions: 3200, overtime_pay: 0, bonus: 2000, net_salary: 48800, status: "paid", paid_at: d(5), created_at: d(10), finance_expense_id: "fe03" },
  { id: "pr02", workspace_id: W, employee_id: "e02", period: "2026-05", basic_salary: 28000, allowances: 3000, deductions: 2100, overtime_pay: 500, bonus: 1000, net_salary: 30400, status: "paid", paid_at: d(5), created_at: d(10), finance_expense_id: "fe03" },
  { id: "pr03", workspace_id: W, employee_id: "e03", period: "2026-05", basic_salary: 18000, allowances: 2000, deductions: 1500, overtime_pay: 1200, bonus: 0, net_salary: 19700, status: "paid", paid_at: d(5), created_at: d(10), finance_expense_id: "fe03" },
  { id: "pr04", workspace_id: W, employee_id: "e04", period: "2026-05", basic_salary: 22000, allowances: 2500, deductions: 1800, overtime_pay: 0, bonus: 3000, net_salary: 25700, status: "paid", paid_at: d(5), created_at: d(10), finance_expense_id: "fe03" },
  { id: "pr05", workspace_id: W, employee_id: "e05", period: "2026-05", basic_salary: 15000, allowances: 1500, deductions: 1200, overtime_pay: 800, bonus: 0, net_salary: 16100, status: "paid", paid_at: d(5), created_at: d(10), finance_expense_id: "fe03" },
  { id: "pr06", workspace_id: W, employee_id: "e06", period: "2026-05", basic_salary: 12000, allowances: 1500, deductions: 1000, overtime_pay: 0, bonus: 2000, net_salary: 14500, status: "paid", paid_at: d(5), created_at: d(10), finance_expense_id: "fe03" },
  { id: "pr07", workspace_id: W, employee_id: "e07", period: "2026-05", basic_salary: 8000, allowances: 800, deductions: 700, overtime_pay: 600, bonus: 0, net_salary: 8700, status: "paid", paid_at: d(5), created_at: d(10), finance_expense_id: "fe03" },
  { id: "pr08", workspace_id: W, employee_id: "e08", period: "2026-05", basic_salary: 14000, allowances: 1500, deductions: 1100, overtime_pay: 0, bonus: 500, net_salary: 14900, status: "paid", paid_at: d(5), created_at: d(10), finance_expense_id: "fe03" },
  { id: "pr09", workspace_id: W, employee_id: "e09", period: "2026-05", basic_salary: 7000, allowances: 700, deductions: 600, overtime_pay: 400, bonus: 0, net_salary: 7500, status: "paid", paid_at: d(5), created_at: d(10), finance_expense_id: "fe03" },
  { id: "pr10", workspace_id: W, employee_id: "e10", period: "2026-05", basic_salary: 10000, allowances: 1000, deductions: 800, overtime_pay: 0, bonus: 0, net_salary: 10200, status: "paid", paid_at: d(5), created_at: d(10), finance_expense_id: "fe03" },
  { id: "pr11", workspace_id: W, employee_id: "e01", period: "2026-06", basic_salary: 45000, allowances: 5000, deductions: 3200, overtime_pay: 0, bonus: 0, net_salary: 46800, status: "pending", paid_at: null, created_at: d(0), finance_expense_id: null },
  { id: "pr12", workspace_id: W, employee_id: "e02", period: "2026-06", basic_salary: 28000, allowances: 3000, deductions: 2100, overtime_pay: 1000, bonus: 0, net_salary: 29900, status: "pending", paid_at: null, created_at: d(0), finance_expense_id: null },
  { id: "pr13", workspace_id: W, employee_id: "e03", period: "2026-06", basic_salary: 18000, allowances: 2000, deductions: 1500, overtime_pay: 800, bonus: 0, net_salary: 19300, status: "draft", paid_at: null, created_at: d(0), finance_expense_id: null },
];

// ─── Performance Reviews ──────────────────────────────────

export interface HRPerformanceReview {
  id: string;
  workspace_id: string;
  employee_id: string;
  review_period: string;
  score: number;
  strengths: string;
  improvements: string;
  goals: string;
  reviewer: string;
  status: "draft" | "completed" | "acknowledged";
  created_at: string;
}

export const HR_PERFORMANCE_REVIEWS: HRPerformanceReview[] = [
  { id: "prv01", workspace_id: W, employee_id: "e01", review_period: "Q1 2026", score: 92, strengths: "Excellent leadership, strategic thinking, team management", improvements: "Could delegate more to middle management", goals: "Expand to 3 new branches, increase revenue 25%", reviewer: "Board", status: "completed", created_at: d(60) },
  { id: "prv02", workspace_id: W, employee_id: "e02", review_period: "Q1 2026", score: 88, strengths: "Strong sales team leadership, client relationships", improvements: "Needs better reporting cadence", goals: "Achieve 2M EGP monthly sales target", reviewer: "Ahmed Ali", status: "completed", created_at: d(30) },
  { id: "prv03", workspace_id: W, employee_id: "e04", review_period: "Q1 2026", score: 94, strengths: "Creative vision, trend awareness, team mentoring", improvements: "Time management on multiple projects", goals: "Launch summer collection 2 weeks early", reviewer: "Ahmed Ali", status: "completed", created_at: d(20) },
  { id: "prv04", workspace_id: W, employee_id: "e06", review_period: "Q1 2026", score: 91, strengths: "Top sales performer, client retention", improvements: "Cross-selling to existing clients", goals: "Close 5 VIP accounts this quarter", reviewer: "Sara Mahmoud", status: "completed", created_at: d(15) },
  { id: "prv05", workspace_id: W, employee_id: "e19", review_period: "Q1 2026", score: 86, strengths: "Consistent performance, good client rapport", improvements: "Needs to improve attendance punctuality", goals: "Reduce late arrivals to zero", reviewer: "Sara Mahmoud", status: "completed", created_at: d(10) },
];

// ─── Recruitment ──────────────────────────────────────────

export interface HRJobOpening {
  id: string;
  workspace_id: string;
  title: string;
  title_ar: string;
  department: string;
  branch: string;
  employment_type: string;
  salary_range: string;
  status: "open" | "closed" | "on_hold";
  applicants_count: number;
  created_at: string;
}

export interface HRCandidate {
  id: string;
  workspace_id: string;
  job_id: string;
  name: string;
  name_ar: string;
  phone: string;
  email: string;
  stage: "applied" | "screening" | "interview" | "evaluation" | "offer" | "hired" | "rejected";
  rating: number | null;
  notes: string;
  applied_at: string;
}

export const HR_JOB_OPENINGS: HRJobOpening[] = [
  { id: "jo01", workspace_id: W, title: "Senior Sales Associate", title_ar: "مندوبة مبيعات أولى", department: "sales", branch: "Nasr City", employment_type: "full_time", salary_range: "10,000 - 15,000 EGP", status: "open", applicants_count: 8, created_at: d(15) },
  { id: "jo02", workspace_id: W, title: "CNC Operator", title_ar: "مشغل CNC", department: "production", branch: "10th Ramadan", employment_type: "full_time", salary_range: "7,000 - 10,000 EGP", status: "open", applicants_count: 12, created_at: d(10) },
  { id: "jo03", workspace_id: W, title: "Delivery Driver", title_ar: "سائق توصيل", department: "delivery", branch: "10th Ramadan", employment_type: "full_time", salary_range: "6,000 - 8,000 EGP", status: "open", applicants_count: 15, created_at: d(20) },
  { id: "jo04", workspace_id: W, title: "Quality Inspector", title_ar: "فاحص جودة", department: "production", branch: "10th Ramadan", employment_type: "full_time", salary_range: "8,000 - 12,000 EGP", status: "closed", applicants_count: 6, created_at: d(30) },
];

export const HR_CANDIDATES: HRCandidate[] = [
  { id: "cn01", workspace_id: W, job_id: "jo01", name: "Mariam Youssef", name_ar: "مريم يوسف", phone: "+20-200-111-2222", email: "mariam.y@gmail.com", stage: "interview", rating: 4, notes: "Strong retail experience, good communication", applied_at: d(12) },
  { id: "cn02", workspace_id: W, job_id: "jo01", name: "Salma Ahmed", name_ar: "سلمى أحمد", phone: "+20-200-333-4444", email: "salma.a@outlook.com", stage: "screening", rating: null, notes: "Fresh graduate, enthusiastic", applied_at: d(10) },
  { id: "cn03", workspace_id: W, job_id: "jo01", name: "Nour Hassan", name_ar: "نور حسن", phone: "+20-200-555-6666", email: "nour.h@yahoo.com", stage: "evaluation", rating: 5, notes: "5 years luxury retail experience, bilingual", applied_at: d(8) },
  { id: "cn04", workspace_id: W, job_id: "jo02", name: "Mahmoud Ali", name_ar: "محمود علي", phone: "+20-200-777-8888", email: "mahmoud.a@gmail.com", stage: "offer", rating: 4, notes: "8 years CNC experience, certified operator", applied_at: d(7) },
  { id: "cn05", workspace_id: W, job_id: "jo02", name: "Tarek Nabil", name_ar: "طارق نبيل", phone: "+20-200-999-0000", email: "tarek.n@gmail.com", stage: "interview", rating: 3, notes: "3 years experience, needs training on advanced patterns", applied_at: d(6) },
  { id: "cn06", workspace_id: W, job_id: "jo03", name: "Youssef Gamal", name_ar: "يوسف جمال", phone: "+20-201-111-2222", email: "youssef.g@gmail.com", stage: "hired", rating: 4, notes: "Clean driving record, Cairo roads expert", applied_at: d(18) },
  { id: "cn07", workspace_id: W, job_id: "jo03", name: "Adel Mahmoud", name_ar: "عادل محمود", phone: "+20-201-333-4444", email: "adel.m@gmail.com", stage: "rejected", rating: 2, notes: "No delivery experience, poor interview", applied_at: d(16) },
];

// ─── HR Timeline Events ───────────────────────────────────

export interface HRTimelineEvent {
  id: string;
  workspace_id: string;
  employee_id: string;
  type: "joined" | "contract_signed" | "salary_changed" | "promoted" | "leave_taken" | "warning_issued" | "bonus_added" | "review_completed" | "equipment_assigned" | "resigned" | "terminated" | "probation_started" | "probation Ended" | "attendance_issue" | "document_uploaded";
  title: string;
  title_ar: string;
  timestamp: string;
  details: string;
  details_ar: string;
  staff: string;
}

export const HR_TIMELINE: HRTimelineEvent[] = [
  { id: "ht01", workspace_id: W, employee_id: "e01", type: "joined", title: "Joined THOTH Fashion", title_ar: "انضم إلى ثوت فاشون", timestamp: ts(1800), details: "Hired as General Manager", details_ar: "تم تعيينه كمدير عام", staff: "Board" },
  { id: "ht02", workspace_id: W, employee_id: "e01", type: "salary_changed", title: "Salary increased to 45,000 EGP", title_ar: "زيادة المرتب إلى ٤٥٬٠٠٠ ج.م", timestamp: ts(300), details: "Annual review increase", details_ar: "زيادة مراجعة سنوية", staff: "Board" },
  { id: "ht03", workspace_id: W, employee_id: "e01", type: "review_completed", title: "Q1 2026 Performance Review - 92/100", title_ar: "مراجعة أداء Q1 2026 - ٩٢/١٠٠", timestamp: ts(60), details: "Excellent performance, exceeded targets", details_ar: "أداء ممتاز، تجاوز الأهداف", staff: "Board" },
  { id: "ht04", workspace_id: W, employee_id: "e02", type: "joined", title: "Joined THOTH Fashion", title_ar: "انضمت إلى ثوت فاشون", timestamp: ts(1200), details: "Hired as Sales Manager", details_ar: "تم تعيينها كمديرة مبيعات", staff: "Ahmed Ali" },
  { id: "ht05", workspace_id: W, employee_id: "e02", type: "promoted", title: "Promoted to Sales Manager", title_ar: "ترقيتها إلى مديرة المبيعات", timestamp: ts(600), details: "Promoted from Senior Sales Associate", details_ar: "ترقت من مندوبة مبيعات أولى", staff: "Ahmed Ali" },
  { id: "ht06", workspace_id: W, employee_id: "e03", type: "joined", title: "Joined THOTH Fashion", title_ar: "انضم إلى ثوت فاشون", timestamp: ts(900), details: "Hired as Production Supervisor", details_ar: "تم تعيينه كمشرف إنتاج", staff: "Ahmed Ali" },
  { id: "ht07", workspace_id: W, employee_id: "e04", type: "joined", title: "Joined THOTH Fashion", title_ar: "انضمت إلى ثوت فاشون", timestamp: ts(750), details: "Hired as Senior Designer", details_ar: "تم تعيينها كمصممة أولى", staff: "Ahmed Ali" },
  { id: "ht08", workspace_id: W, employee_id: "e04", type: "bonus_added", title: "Performance bonus - 3,000 EGP", title_ar: "مكافأة أداء - ٣٬٠٠٠ ج.م", timestamp: ts(20), details: "For outstanding Q1 design work", details_ar: "لعمل تصميم ممتاز في Q1", staff: "Ahmed Ali" },
  { id: "ht09", workspace_id: W, employee_id: "e06", type: "joined", title: "Joined THOTH Fashion", title_ar: "انضمت إلى ثوت فاشون", timestamp: ts(500), details: "Hired as Senior Sales Associate", details_ar: "تم تعيينها كمندوبة مبيعات أولى", staff: "Sara Mahmoud" },
  { id: "ht10", workspace_id: W, employee_id: "e06", type: "bonus_added", title: "Sales bonus - 2,000 EGP", title_ar: "مكافأة مبيعات - ٢٬٠٠٠ ج.م", timestamp: ts(15), details: "Top performer March 2026", details_ar: "أفضل أداء في مارس ٢٠٢٦", staff: "Sara Mahmoud" },
  { id: "ht11", workspace_id: W, employee_id: "e07", type: "warning_issued", title: "Warning: Repeated lateness", title_ar: "تنبيه: تأخر متكرر", timestamp: ts(10), details: "Late 5 times in the past month", details_ar: "تأخر ٥ مرات في الشهر الماضي", staff: "Mohamed Gamal" },
  { id: "ht12", workspace_id: W, employee_id: "e10", type: "leave_taken", title: "Annual leave approved - 5 days", title_ar: "موافقة إجازة سنوية - ٥ أيام", timestamp: ts(2), details: "Family vacation to Hurghada", details_ar: "إجازة عائلية في الغردقة", staff: "Sara Mahmoud" },
  { id: "ht13", workspace_id: W, employee_id: "e12", type: "probation_started", title: "Probation period started", title_ar: "بدأ فترة التجربة", timestamp: ts(45), details: "3-month probation as Junior Designer", details_ar: "فترة تجربة ٣ أشهر كمصممة مبتدئة", staff: "Fatma Hassan" },
  { id: "ht14", workspace_id: W, employee_id: "e15", type: "warning_issued", title: "Warning: Attendance issues", title_ar: "تنبيه: مشاكل الحضور", timestamp: ts(5), details: "Absent without leave notice", details_ar: "غياب بدون إشعار إجازة", staff: "Mohamed Gamal" },
  { id: "ht15", workspace_id: W, employee_id: "e21", type: "terminated", title: "Employment terminated", title_ar: "انتهاء الخدمة", timestamp: ts(30), details: "Terminated due to poor performance", details_ar: "انتهاء الخدمة بسبب الأداء الضعيف", staff: "Mohamed Gamal" },
  { id: "ht16", workspace_id: W, employee_id: "e24", type: "warning_issued", title: "Warning: Policy violation", title_ar: "تنبيه: خرق السياسة", timestamp: ts(15), details: "Unauthorized absence for 3 days", details_ar: "غياب غير مصرح به لمدة ٣ أيام", staff: "Omar Salah" },
  { id: "ht17", workspace_id: W, employee_id: "e19", type: "leave_taken", title: "Annual leave approved - 4 days", title_ar: "موافقة إجازة سنوية - ٤ أيام", timestamp: ts(10), details: "Wedding anniversary trip", details_ar: "رحلة ذكرى الزواج", staff: "Sara Mahmoud" },
  { id: "ht18", workspace_id: W, employee_id: "e05", type: "contract_signed", title: "Contract renewed for 1 year", title_ar: "تجديد العقد لمدة سنة", timestamp: ts(30), details: "Warehouse Manager contract", details_ar: "عقد مدير المخزن", staff: "Mona Saad" },
];

// ─── HR Alerts ────────────────────────────────────────────

export interface HRAlert {
  id: string;
  workspace_id: string;
  employee_id: string | null;
  type: "contract_expiring" | "probation_ending" | "absent_today" | "repeated_lateness" | "missing_documents" | "leave_balance_low" | "payroll_not_approved" | "high_turnover" | "upcoming_birthday" | "review_overdue";
  severity: "info" | "warning" | "critical";
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  suggested_action: string;
  suggested_action_ar: string;
  dismissed: boolean;
  created_at: string;
}

export const HR_ALERTS: HRAlert[] = [
  { id: "ha01", workspace_id: W, employee_id: "e07", type: "repeated_lateness", severity: "critical", title: "Khaled Nabil: 5 late arrivals this month", title_ar: "خالد نبيل: ٥ تأخرات هذا الشهر", description: "Attendance risk is HIGH. Consider formal warning.", description_ar: "خطر الحضور مرتفع. يُنظر في إنذار رسمي.", suggested_action: "Issue formal warning and schedule HR meeting", suggested_action_ar: "إصدار تنبيه رسمي وجدولة اجتماع موارد بشرية", dismissed: false, created_at: d(0) },
  { id: "ha02", workspace_id: W, employee_id: "e15", type: "repeated_lateness", severity: "critical", title: "Walid Nasser: Absent without notice", title_ar: "وليد ناصر: غياب بدون إشعار", description: "Absent today without prior leave request.", description_ar: "غياب اليوم بدون طلب إجازة مسبق.", suggested_action: "Contact employee immediately and issue warning", suggested_action_ar: "الاتصال بالموظف فوراً وإصدار تنبيه", dismissed: false, created_at: d(0) },
  { id: "ha03", workspace_id: W, employee_id: "e24", type: "absent_today", severity: "warning", title: "Sherif Adel: Suspended - no access", title_ar: "شريف عادل: موقوف - بدون وصول", description: "Employee is currently suspended.", description_ar: "الموظف موقوف حالياً.", suggested_action: "Review suspension status and decide next steps", suggested_action_ar: "مراجعة حالة الإيقاف واتخاذ الخطوات التالية", dismissed: false, created_at: d(0) },
  { id: "ha04", workspace_id: W, employee_id: "e18", type: "contract_expiring", severity: "warning", title: "Yasmin Adel: Contract expires in 40 days", title_ar: "ياسمين عادل: العقد ينتهي خلال ٤٠ يوم", description: "Contract end date: " + d(-40), description_ar: "تاريخ انتهاء العقد: " + d(-40), suggested_action: "Schedule contract renewal discussion with manager", suggested_action_ar: "جدولة مناقشة تجديد العقد مع المدير", dismissed: false, created_at: d(0) },
  { id: "ha05", workspace_id: W, employee_id: "e07", type: "contract_expiring", severity: "warning", title: "Khaled Nabil: Contract expires in 120 days", title_ar: "خالد نبيل: العقد ينتهي خلال ١٢٠ يوم", description: "Review performance before renewal.", description_ar: "مراجعة الأداء قبل التجديد.", suggested_action: "Performance review before contract decision", suggested_action_ar: "مراجعة الأداء قبل قرار التجديد", dismissed: false, created_at: d(5) },
  { id: "ha06", workspace_id: W, employee_id: "e12", type: "probation_ending", severity: "info", title: "Heba Nabil: Probation period ended", title_ar: "هبة نبيل: انتهت فترة التجربة", description: "Probation ended 45 days ago. Decision pending.", description_ar: "انتهت فترة التجربة منذ ٤٥ يوم. القرار معلق.", suggested_action: "Complete probation review and confirm employment", suggested_action_ar: "إكمال مراجعة فترة التجربة وتأكيد التوظيف", dismissed: false, created_at: d(0) },
  { id: "ha07", workspace_id: W, employee_id: "e01", type: "review_overdue", severity: "warning", title: "Ahmed Ali: Performance review overdue", title_ar: "أحمد علي: مراجعة الأداء متأخرة", description: "Last review was 60 days ago. Next review was 30 days ago.", description_ar: "آخر مراجعة كانت منذ ٦٠ يوم. المراجعة التالية كانت منذ ٣٠ يوم.", suggested_action: "Schedule performance review immediately", suggested_action_ar: "جدولة مراجعة الأداء فوراً", dismissed: false, created_at: d(0) },
  { id: "ha08", workspace_id: W, employee_id: "e02", type: "review_overdue", severity: "warning", title: "Sara Mahmoud: Performance review overdue", title_ar: "سارة محمود: مراجعة الأداء متأخرة", description: "Last review was 30 days ago. Next review was 60 days ago.", description_ar: "آخر مراجعة كانت منذ ٣٠ يوم. المراجعة التالية كانت منذ ٦٠ يوم.", suggested_action: "Schedule performance review", suggested_action_ar: "جدولة مراجعة الأداء", dismissed: false, created_at: d(0) },
  { id: "ha09", workspace_id: W, employee_id: "e11", type: "leave_balance_low", severity: "info", title: "Youssef Ali: Low leave balance (8 days)", title_ar: "يوسف علي: رصيد إجازات منخفض (٨ أيام)", description: "Below average leave balance for tenure.", description_ar: "رصيد إجازات أقل من المتوسط.", suggested_action: "Inform employee about leave balance", suggested_action_ar: "إبلاغ الموظف برصيد الإجازات", dismissed: false, created_at: d(3) },
  { id: "ha10", workspace_id: W, employee_id: null, type: "payroll_not_approved", severity: "critical", title: "June payroll not yet approved", title_ar: "مرتبات يونيو لم تُوافق عليها بعد", description: "3 payroll records in draft/pending status.", description_ar: "٣ سجلات مرتبات في حالة مسودة/معلق.", suggested_action: "Review and approve pending payroll records", suggested_action_ar: "مراجعة و الموافقة على سجلات المرتبات المعلقة", dismissed: false, created_at: d(0) },
];

// ─── Departments ──────────────────────────────────────────

export const HR_DEPARTMENTS = [
  { id: "d01", name: "Management", name_ar: "الإدارة العليا", head: "Ahmed Ali", head_ar: "أحمد علي", employee_count: 1, budget: 50000 },
  { id: "d02", name: "Sales", name_ar: "المبيعات", head: "Sara Mahmoud", head_ar: "سارة محمود", employee_count: 5, budget: 80000 },
  { id: "d03", name: "Production", name_ar: "الإنتاج", head: "Mohamed Gamal", head_ar: "محمد جمال", employee_count: 9, budget: 120000 },
  { id: "d04", name: "Design", name_ar: "التصميم", head: "Fatma Hassan", head_ar: "فاطمة حسن", employee_count: 3, budget: 65000 },
  { id: "d05", name: "Warehouse", name_ar: "المخزن", head: "Omar Salah", head_ar: "عمر صلاح", employee_count: 2, budget: 30000 },
  { id: "d06", name: "Delivery", name_ar: "التوصيل", head: "Hassan Barakat", head_ar: "حسن بركات", employee_count: 2, budget: 25000 },
  { id: "d07", name: "Admin", name_ar: "الإدارة", head: "Mona Saad", head_ar: "منى سعد", employee_count: 3, budget: 45000 },
];

// ─── Branches ─────────────────────────────────────────────

export const HR_BRANCHES = [
  { id: "b01", name: "Nasr City", name_ar: "مدينة نصر", address: "Nasr City, Cairo", employee_count: 14, manager: "Ahmed Ali" },
  { id: "b02", name: "10th Ramadan", name_ar: "العاشر من رمضان", address: "10th Ramadan City, Sharqia", employee_count: 11, manager: "Mohamed Gamal" },
];
