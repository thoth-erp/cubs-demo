/**
 * HR Full Module Data — بيانات شاملة لوحدة الموارد البشرية
 *
 * Covers all 7 HR departments:
 * 1. Recruitment & Selection
 * 2. Compensation & Benefits
 * 3. Training & Development
 * 4. Performance Management
 * 5. Employee Relations
 * 6. Employment Law & Compliance
 * 7. HR Analytics & Strategy
 */

// Payroll data lives in hr-data; re-export so consumers importing it from this
// module resolve correctly (was undefined → runtime crash on HR_PAYROLL.filter).
export { HR_PAYROLL } from "./hr-data";

const W = "demo";
const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
const ts = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString();

// ═══════════════════════════════════════════════════════════
// 1. RECRUITMENT & SELECTION
// ═══════════════════════════════════════════════════════════

export interface JobOpening {
  id: string; workspace_id: string; title: string; title_ar: string;
  department: string; branch: string; employment_type: string;
  salary_min: number; salary_max: number; description: string; description_ar: string;
  requirements: string[]; status: "open" | "closed" | "on_hold" | "draft";
  applicants_count: number; created_at: string; deadline: string;
}

export interface Candidate {
  id: string; workspace_id: string; job_id: string;
  name: string; name_ar: string; phone: string; email: string;
  resume_url: string; stage: "applied" | "screening" | "phone_screen" | "interview_1" | "interview_2" | "evaluation" | "offer" | "hired" | "rejected";
  rating: number | null; notes: string; notes_ar: string;
  source: "linkedin" | "website" | "referral" | "agency" | "walk_in" | "job_fair";
  applied_at: string; screening_date: string | null; interview_dates: string[];
  offer_amount: number | null; offer_status: "pending" | "accepted" | "declined" | null;
}

export interface InterviewSchedule {
  id: string; workspace_id: string; candidate_id: string; job_id: string;
  type: "phone_screen" | "technical" | "hr" | "manager" | "final";
  interviewer: string; interviewer_ar: string; date: string; time: string;
  location: string; status: "scheduled" | "completed" | "cancelled" | "no_show";
  feedback: string | null; rating: number | null;
}

export const HR_JOB_OPENINGS: JobOpening[] = [
  { id: "jo01", workspace_id: W, title: "Senior Sales Associate", title_ar: "مندوبة مبيعات أولى", department: "sales", branch: "Nasr City", employment_type: "full_time", salary_min: 10000, salary_max: 15000, description: "Lead sales team, manage VIP clients, achieve monthly targets", description_ar: "قيادة فريق المبيعات وإدارة عملاء VIP وتحقيق الأهداف الشهرية", requirements: ["3+ years retail sales", "Fluent English", "VIP client management"], status: "open", applicants_count: 12, created_at: d(20), deadline: d(-5) },
  { id: "jo02", workspace_id: W, title: "Production Supervisor", title_ar: "مشرف إنتاج", department: "production", branch: "10th Ramadan", employment_type: "full_time", salary_min: 15000, salary_max: 22000, description: "Oversee production line, ensure quality standards, manage 20+ workers", description_ar: "إشراف على خط الإنتاج وضمان معايير الجودة وإدارة أكثر من ٢٠ عامل", requirements: ["5+ years production", "Team leadership", "Quality management"], status: "open", applicants_count: 8, created_at: d(15), deadline: d(10) },
  { id: "jo03", workspace_id: W, title: "Fashion Designer", title_ar: "مصمم أزياء", department: "design", branch: "Nasr City", employment_type: "full_time", salary_min: 12000, salary_max: 20000, description: "Create seasonal collections, trend research, pattern development", description_ar: "إنشاء مجموعات موسمية وبحث في الاتجاهات وتطوير الأنماط", requirements: ["Fashion degree", "Adobe Creative Suite", "Portfolio required"], status: "open", applicants_count: 15, created_at: d(10), deadline: d(15) },
  { id: "jo04", workspace_id: W, title: "HR Coordinator", title_ar: "منسق موارد بشرية", department: "admin", branch: "Nasr City", employment_type: "full_time", salary_min: 10000, salary_max: 14000, description: "Manage employee records, coordinate recruitment, handle onboarding", description_ar: "إدارة سجلات الموظفين وتنسيق التوظيف والتعامل مع التأهيل", requirements: ["HR degree preferred", "MS Office", "Arabic & English"], status: "open", applicants_count: 20, created_at: d(8), deadline: d(20) },
  { id: "jo05", workspace_id: W, title: "Warehouse Worker", title_ar: "عامل مخزن", department: "warehouse", branch: "10th Ramadan", employment_type: "full_time", salary_min: 6000, salary_max: 8000, description: "Inventory management, order picking, stock organization", description_ar: "إدارة المخزون وجمع الطلبات وتنظيم المخزن", requirements: ["Physical fitness", "Forklift license preferred"], status: "closed", applicants_count: 25, created_at: d(30), deadline: d(0) },
];

export const HR_CANDIDATES: Candidate[] = [
  { id: "cn01", workspace_id: W, job_id: "jo01", name: "Mariam Youssef", name_ar: "مريم يوسف", phone: "+20-200-111-2222", email: "mariam.y@gmail.com", resume_url: "#", stage: "interview_2", rating: 4, notes: "Strong retail experience, bilingual, excellent presentation skills", notes_ar: "خبرة تجزئة قوية، ثنائية اللغة، مهارات عرض ممتازة", source: "linkedin", applied_at: d(18), screening_date: d(15), interview_dates: [d(12), d(5)], offer_amount: null, offer_status: null },
  { id: "cn02", workspace_id: W, job_id: "jo01", name: "Salma Ahmed", name_ar: "سلمى أحمد", phone: "+20-200-333-4444", email: "salma.a@outlook.com", resume_url: "#", stage: "screening", rating: null, notes: "Fresh graduate from Cairo University Business School", notes_ar: "خريجة حديثة من كلية التجارة جامعة القاهرة", source: "website", applied_at: d(12), screening_date: null, interview_dates: [], offer_amount: null, offer_status: null },
  { id: "cn03", workspace_id: W, job_id: "jo01", name: "Nour Hassan", name_ar: "نور حسن", phone: "+20-200-555-6666", email: "nour.h@yahoo.com", resume_url: "#", stage: "offer", rating: 5, notes: "5 years luxury retail, bilingual Arabic/French, perfect cultural fit", notes_ar: "٥ سنوات تجزئة فاخرة، ثنائية اللغة العربية/الفرنسية، توافق ثقافي ممتاز", source: "referral", applied_at: d(25), screening_date: d(22), interview_dates: [d(18), d(10), d(3)], offer_amount: 14000, offer_status: "pending" },
  { id: "cn04", workspace_id: W, job_id: "jo02", name: "Mahmoud Ali", name_ar: "محمود علي", phone: "+20-200-777-8888", email: "mahmoud.a@gmail.com", resume_url: "#", stage: "interview_1", rating: 4, notes: "8 years CNC experience, certified operator, team lead background", notes_ar: "٨ سنوات خبرة في CNC، مشغل معتمد، خلفية في قيادة الفرق", source: "agency", applied_at: d(14), screening_date: d(12), interview_dates: [d(8)], offer_amount: null, offer_status: null },
  { id: "cn05", workspace_id: W, job_id: "jo02", name: "Tarek Nabil", name_ar: "طارق نبيل", phone: "+20-200-999-0000", email: "tarek.n@gmail.com", resume_url: "#", stage: "rejected", rating: 2, notes: "Limited experience, poor interview performance", notes_ar: "خبرة محدودة، أداء مقابلة ضعيف", source: "walk_in", applied_at: d(10), screening_date: d(9), interview_dates: [d(7)], offer_amount: null, offer_status: null },
  { id: "cn06", workspace_id: W, job_id: "jo03", name: "Yasmin Adel", name_ar: "ياسمين عادل", phone: "+20-201-111-2222", email: "yasmin.a@gmail.com", resume_url: "#", stage: "evaluation", rating: 4, notes: "Strong portfolio, experienced in bridal and evening wear design", notes_ar: "محفوظات قوية، خبرة في تصميم عروس وملابس سهرة", source: "linkedin", applied_at: d(8), screening_date: d(7), interview_dates: [d(5), d(2)], offer_amount: null, offer_status: null },
  { id: "cn07", workspace_id: W, job_id: "jo03", name: "Hany El-Behiri", name_ar: "هاني البهيري", phone: "+20-201-333-4444", email: "hany.b@gmail.com", resume_url: "#", stage: "hired", rating: 5, notes: "Creative Director level, 15+ years experience, luxury brand background", notes_ar: "مستوى مدير إبداعي، أكثر من ١٥ سنة خبرة، خلفية علامات تجارية فاخرة", source: "referral", applied_at: d(45), screening_date: d(42), interview_dates: [d(38), d(30), d(22)], offer_amount: 35000, offer_status: "accepted" },
  { id: "cn08", workspace_id: W, job_id: "jo04", name: "Nadia Sherif", name_ar: "نادية شريف", phone: "+20-201-555-6666", email: "nadia.s@gmail.com", resume_url: "#", stage: "interview_1", rating: 3, notes: "2 years HR experience, organized, detail-oriented", notes_ar: "سنتان خبرة في الموارد البشرية، منظمة، تركز على التفاصيل", source: "website", applied_at: d(5), screening_date: d(4), interview_dates: [d(2)], offer_amount: null, offer_status: null },
  { id: "cn09", workspace_id: W, job_id: "jo04", name: "Amira Khaled", name_ar: "أميرة خالد", phone: "+20-201-777-8888", email: "amira.k@gmail.com", resume_url: "#", stage: "phone_screen", rating: null, notes: "Fresh HR graduate, eager to learn, good communication", notes_ar: "خريجة موارد بشرية حديثة، حريصة على التعلم، تواصل جيد", source: "job_fair", applied_at: d(6), screening_date: null, interview_dates: [], offer_amount: null, offer_status: null },
  { id: "cn10", workspace_id: W, job_id: "jo04", name: "Fatma Hassan", name_ar: "فاطمة حسن", phone: "+20-201-999-0000", email: "fatma.h@gmail.com", resume_url: "#", stage: "screening", rating: null, notes: "5 years HR experience in manufacturing, SHRM certified", notes_ar: "٥ سنوات خبرة في الموارد البشرية في التصنيع، معتمدة SHRM", source: "linkedin", applied_at: d(4), screening_date: null, interview_dates: [], offer_amount: null, offer_status: null },
  { id: "cn11", workspace_id: W, job_id: "jo03", name: "Salma Farouk", name_ar: "سلمى فاروق", phone: "+20-202-111-2222", email: "salma.f@gmail.com", resume_url: "#", stage: "rejected", rating: 2, notes: "Junior designer, limited portfolio, not aligned with brand aesthetic", notes_ar: "مصممة مبتدئة، محفوظات محدودة، غير متوافقة مع جماليات العلامة", source: "walk_in", applied_at: d(20), screening_date: d(18), interview_dates: [d(15)], offer_amount: null, offer_status: null },
];

export const HR_INTERVIEWS: InterviewSchedule[] = [
  { id: "iv01", workspace_id: W, candidate_id: "cn01", job_id: "jo01", type: "hr", interviewer: "Mona Saad", interviewer_ar: "منى سعد", date: d(12), time: "10:00", location: "Nasr City Office", status: "completed", feedback: "Strong communication skills, good cultural fit", rating: 4 },
  { id: "iv02", workspace_id: W, candidate_id: "cn01", job_id: "jo01", type: "manager", interviewer: "Sara Mahmoud", interviewer_ar: "سارة محمود", date: d(5), time: "14:00", location: "Nasr City Office", status: "completed", feedback: "Excellent sales instincts, knows luxury market", rating: 4 },
  { id: "iv03", workspace_id: W, candidate_id: "cn03", job_id: "jo01", type: "final", interviewer: "Ahmed Ali", interviewer_ar: "أحمد علي", date: d(3), time: "11:00", location: "Nasr City Office", status: "completed", feedback: "Outstanding candidate, offer recommended", rating: 5 },
  { id: "iv04", workspace_id: W, candidate_id: "cn04", job_id: "jo02", type: "technical", interviewer: "Mohamed Gamal", interviewer_ar: "محمد جمال", date: d(8), time: "09:00", location: "10th Ramadan Factory", status: "completed", feedback: "Good technical skills, needs training on new machines", rating: 4 },
  { id: "iv05", workspace_id: W, candidate_id: "cn06", job_id: "jo03", type: "hr", interviewer: "Mona Saad", interviewer_ar: "منى سعد", date: d(5), time: "13:00", location: "Nasr City Office", status: "completed", feedback: "Creative portfolio, good understanding of fashion trends", rating: 4 },
  { id: "iv06", workspace_id: W, candidate_id: "cn06", job_id: "jo03", type: "manager", interviewer: "Fatma Hassan", interviewer_ar: "فاطمة حسن", date: d(2), time: "10:00", location: "Nasr City Office", status: "completed", feedback: "Strong design skills, good team player", rating: 4 },
  { id: "iv07", workspace_id: W, candidate_id: "cn08", job_id: "jo04", type: "technical", interviewer: "Mona Saad", interviewer_ar: "منى سعد", date: d(2), time: "11:00", location: "Nasr City Office", status: "completed", feedback: "Decent HR knowledge, needs more experience", rating: 3 },
  { id: "iv08", workspace_id: W, candidate_id: "cn04", job_id: "jo02", type: "manager", interviewer: "Mohamed Gamal", interviewer_ar: "محمد جمال", date: d(1), time: "09:00", location: "10th Ramadan Factory", status: "scheduled", feedback: null, rating: null },
];

// ═══════════════════════════════════════════════════════════
// 2. COMPENSATION & BENEFITS
// ═══════════════════════════════════════════════════════════

export interface SalaryStructure {
  id: string; workspace_id: string; grade: string; grade_ar: string;
  min_salary: number; max_salary: number; mid_point: number;
  allowances: { name: string; name_ar: string; type: "fixed" | "percentage"; amount: number }[];
}

export interface Benefit {
  id: string; workspace_id: string; name: string; name_ar: string;
  description: string; description_ar: string;
  type: "insurance" | "retirement" | "leave" | "perk" | "wellness" | "education";
  provider: string; cost_per_employee: number; company_contribution: number;
  employee_contribution: number; eligibility: string; eligibility_ar: string;
  status: "active" | "inactive" | "pending_renewal";
}

export interface Payslip {
  id: string; workspace_id: string; employee_id: string; employee_name: string;
  employee_name_ar: string; period: string; basic_salary: number;
  housing_allowance: number; transport_allowance: number; food_allowance: number;
  overtime_pay: number; bonus: number; commission: number;
  social_insurance: number; tax: number; advances: number; other_deductions: number;
  net_salary: number; status: "draft" | "pending_approval" | "approved" | "paid";
  paid_at: string | null; created_at: string;
}

export interface SalaryStructure {
  id: string; workspace_id: string; grade: string; grade_ar: string;
  min_salary: number; max_salary: number; mid_point: number;
  allowances: { name: string; name_ar: string; type: "fixed" | "percentage"; amount: number }[];
}

export const HR_SALARY_GRADES: SalaryStructure[] = [
  { id: "sg01", workspace_id: W, grade: "Grade 1 - Entry", grade_ar: "المستوى ١ - مبتدئ", min_salary: 5000, max_salary: 8000, mid_point: 6500, allowances: [{ name: "Housing", name_ar: "سكن", type: "fixed", amount: 500 }, { name: "Transport", name_ar: "مواصلات", type: "fixed", amount: 300 }] },
  { id: "sg02", workspace_id: W, grade: "Grade 2 - Junior", grade_ar: "المستوى ٢ - مبتدئ+", min_salary: 8000, max_salary: 12000, mid_point: 10000, allowances: [{ name: "Housing", name_ar: "سكن", type: "fixed", amount: 800 }, { name: "Transport", name_ar: "مواصلات", type: "fixed", amount: 400 }] },
  { id: "sg03", workspace_id: W, grade: "Grade 3 - Mid", grade_ar: "المستوى ٣ - متوسط", min_salary: 12000, max_salary: 18000, mid_point: 15000, allowances: [{ name: "Housing", name_ar: "سكن", type: "fixed", amount: 1200 }, { name: "Transport", name_ar: "مواصلات", type: "fixed", amount: 500 }, { name: "Phone", name_ar: "هاتف", type: "fixed", amount: 300 }] },
  { id: "sg04", workspace_id: W, grade: "Grade 4 - Senior", grade_ar: "المستوى ٤ - أول", min_salary: 18000, max_salary: 28000, mid_point: 23000, allowances: [{ name: "Housing", name_ar: "سكن", type: "fixed", amount: 2000 }, { name: "Transport", name_ar: "مواصلات", type: "fixed", amount: 800 }, { name: "Phone", name_ar: "هاتف", type: "fixed", amount: 500 }, { name: "Fuel", name_ar: "وقود", type: "fixed", amount: 500 }] },
  { id: "sg05", workspace_id: W, grade: "Grade 5 - Manager", grade_ar: "المستوى ٥ - مدير", min_salary: 28000, max_salary: 45000, mid_point: 36500, allowances: [{ name: "Housing", name_ar: "سكن", type: "fixed", amount: 3500 }, { name: "Transport", name_ar: "مواصلات", type: "fixed", amount: 1500 }, { name: "Phone", name_ar: "هاتف", type: "fixed", amount: 800 }, { name: "Fuel", name_ar: "وقود", type: "fixed", amount: 1000 }, { name: "Entertainment", name_ar: "ترفيه", type: "fixed", amount: 1500 }] },
  { id: "sg06", workspace_id: W, grade: "Grade 6 - Executive", grade_ar: "المستوى ٦ - تنفيذي", min_salary: 45000, max_salary: 80000, mid_point: 62500, allowances: [{ name: "Housing", name_ar: "سكن", type: "fixed", amount: 5000 }, { name: "Transport", name_ar: "مواصلات", type: "fixed", amount: 3000 }, { name: "Phone", name_ar: "هاتف", type: "fixed", amount: 1000 }, { name: "Fuel", name_ar: "وقود", type: "fixed", amount: 2000 }, { name: "Entertainment", name_ar: "ترفيه", type: "fixed", amount: 3000 }] },
];

export const HR_BENEFITS: Benefit[] = [
  { id: "bn01", workspace_id: W, name: "Medical Insurance", name_ar: "تأمين صحي", description: "Comprehensive health insurance for employee + family", description_ar: "تأمين صحي شامل للموظف + العائلة", type: "insurance", provider: "AXA Egypt", cost_per_employee: 8000, company_contribution: 6400, employee_contribution: 1600, eligibility: "All full-time employees after probation", eligibility_ar: "جميع موظفي الدوام الكامل بعد فترة التجربة", status: "active" },
  { id: "bn02", workspace_id: W, name: "Social Insurance", name_ar: "تأمين اجتماعي", description: "Government-mandated social insurance", description_ar: "التأمين الاجتماعي الإلزامي", type: "insurance", provider: "NOSI", cost_per_employee: 0, company_contribution: 0, employee_contribution: 0, eligibility: "All employees", eligibility_ar: "جميع الموظفين", status: "active" },
  { id: "bn03", workspace_id: W, name: "Annual Leave", name_ar: "إجازة سنوية", description: "21 days annual leave (increases with tenure)", description_ar: "٢١ يوم إجازة سنوية (تزيد مع الخدمة)", type: "leave", provider: "Internal", cost_per_employee: 0, company_contribution: 0, employee_contribution: 0, eligibility: "All employees after 6 months", eligibility_ar: "جميع الموظفين بعد ٦ أشهر", status: "active" },
  { id: "bn04", workspace_id: W, name: "Transportation", name_ar: "مواصلات", description: "Company bus service or transport allowance", description_ar: "خدمة حافلات الشركة أو بدل مواصلات", type: "perk", provider: "Internal", cost_per_employee: 6000, company_contribution: 6000, employee_contribution: 0, eligibility: "Employees at 10th Ramadan branch", eligibility_ar: "موظفو فرع العاشر من رمضان", status: "active" },
  { id: "bn05", workspace_id: W, name: "Staff Discount", name_ar: "خصم موظفين", description: "30% discount on all THOTH products", description_ar: "خصم ٣٠٪ على جميع منتجات ثوت", type: "perk", provider: "Internal", cost_per_employee: 0, company_contribution: 0, employee_contribution: 0, eligibility: "All employees", eligibility_ar: "جميع الموظفين", status: "active" },
  { id: "bn06", workspace_id: W, name: "Training Budget", name_ar: "ميزانية التدريب", description: "Annual training budget per employee", description_ar: "ميزانية تدريب سنوية لكل موظف", type: "education", provider: "Internal", cost_per_employee: 5000, company_contribution: 5000, employee_contribution: 0, eligibility: "Grade 3+ employees", eligibility_ar: "موظفو المستوى ٣ فما فوق", status: "active" },
  { id: "bn07", workspace_id: W, name: "End of Service", name_ar: "مكافأة نهاية الخدمة", description: "Gratuity per Egyptian labor law", description_ar: "مكافأة وفقاً لقانون العمل المصري", type: "retirement", provider: "Internal", cost_per_employee: 0, company_contribution: 0, employee_contribution: 0, eligibility: "All employees after 1 year", eligibility_ar: "جميع الموظفين بعد سنة", status: "active" },
  { id: "bn08", workspace_id: W, name: "Life Insurance", name_ar: "تأمين على الحياة", description: "Group life insurance coverage", description_ar: "تغطية تأمين جماعي على الحياة", type: "insurance", provider: "MetLife Egypt", cost_per_employee: 2400, company_contribution: 2400, employee_contribution: 0, eligibility: "Grade 4+ employees", eligibility_ar: "موظفو المستوى ٤ فما فوق", status: "active" },
];

export const HR_PAYSLIPS: Payslip[] = [
  { id: "ps01", workspace_id: W, employee_id: "e01", employee_name: "Ahmed Ali", employee_name_ar: "أحمد علي", period: "2026-05", basic_salary: 45000, housing_allowance: 5000, transport_allowance: 3000, food_allowance: 1000, overtime_pay: 0, bonus: 2000, commission: 0, social_insurance: 2400, tax: 800, advances: 0, other_deductions: 0, net_salary: 52800, status: "paid", paid_at: d(5), created_at: d(10) },
  { id: "ps02", workspace_id: W, employee_id: "e02", employee_name: "Sara Mahmoud", employee_name_ar: "سارة محمود", period: "2026-05", basic_salary: 28000, housing_allowance: 3500, transport_allowance: 1500, food_allowance: 500, overtime_pay: 500, bonus: 1000, commission: 3000, social_insurance: 1500, tax: 400, advances: 0, other_deductions: 0, net_salary: 36100, status: "paid", paid_at: d(5), created_at: d(10) },
  { id: "ps03", workspace_id: W, employee_id: "e03", employee_name: "Mohamed Gamal", employee_name_ar: "محمد جمال", period: "2026-05", basic_salary: 18000, housing_allowance: 2000, transport_allowance: 800, food_allowance: 400, overtime_pay: 1200, bonus: 0, commission: 0, social_insurance: 1000, tax: 200, advances: 500, other_deductions: 0, net_salary: 20700, status: "paid", paid_at: d(5), created_at: d(10) },
  { id: "ps04", workspace_id: W, employee_id: "e04", employee_name: "Fatma Hassan", employee_name_ar: "فاطمة حسن", period: "2026-05", basic_salary: 22000, housing_allowance: 2500, transport_allowance: 800, food_allowance: 400, overtime_pay: 0, bonus: 3000, commission: 0, social_insurance: 1200, tax: 300, advances: 0, other_deductions: 0, net_salary: 27200, status: "paid", paid_at: d(5), created_at: d(10) },
  { id: "ps05", workspace_id: W, employee_id: "e06", employee_name: "Nora Al-Farsi", employee_name_ar: "نورة الفارسي", period: "2026-05", basic_salary: 12000, housing_allowance: 1200, transport_allowance: 500, food_allowance: 300, overtime_pay: 0, bonus: 2000, commission: 5000, social_insurance: 700, tax: 150, advances: 0, other_deductions: 0, net_salary: 20150, status: "paid", paid_at: d(5), created_at: d(10) },
  { id: "ps06", workspace_id: W, employee_id: "e01", employee_name: "Ahmed Ali", employee_name_ar: "أحمد علي", period: "2026-06", basic_salary: 45000, housing_allowance: 5000, transport_allowance: 3000, food_allowance: 1000, overtime_pay: 0, bonus: 0, commission: 0, social_insurance: 2400, tax: 800, advances: 0, other_deductions: 0, net_salary: 50800, status: "pending_approval", paid_at: null, created_at: d(0) },
  { id: "ps07", workspace_id: W, employee_id: "e02", employee_name: "Sara Mahmoud", employee_name_ar: "سارة محمود", period: "2026-06", basic_salary: 28000, housing_allowance: 3500, transport_allowance: 1500, food_allowance: 500, overtime_pay: 1000, bonus: 0, commission: 2000, social_insurance: 1500, tax: 400, advances: 0, other_deductions: 0, net_salary: 34600, status: "pending_approval", paid_at: null, created_at: d(0) },
];

// ═══════════════════════════════════════════════════════════
// 3. TRAINING & DEVELOPMENT
// ═══════════════════════════════════════════════════════════

export interface TrainingCourse {
  id: string; workspace_id: string; title: string; title_ar: string;
  description: string; description_ar: string;
  type: "orientation" | "technical" | "leadership" | "compliance" | "soft_skills" | "safety";
  instructor: string; instructor_ar: string;
  duration_hours: number; max_participants: number;
  location: string; cost: number;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  start_date: string; end_date: string;
  materials: string[]; materials_ar: string[];
}

export interface TrainingEnrollment {
  id: string; workspace_id: string; course_id: string; employee_id: string;
  employee_name: string; employee_name_ar: string;
  status: "enrolled" | "in_progress" | "completed" | "dropped";
  progress: number; score: number | null;
  certificate_url: string | null; enrolled_at: string; completed_at: string | null;
}

export interface Certification {
  id: string; workspace_id: string; employee_id: string;
  name: string; name_ar: string; issuer: string;
  issue_date: string; expiry_date: string | null;
  certificate_number: string; status: "valid" | "expired" | "expiring_soon";
}

export const HR_TRAINING_COURSES: TrainingCourse[] = [
  { id: "tc01", workspace_id: W, title: "New Employee Orientation", title_ar: "تأهيل الموظف الجديد", description: "Company culture, policies, safety basics, team introductions", description_ar: "ثقافة الشركة والسياسات وأساسيات السلامة وتعريف الفريق", type: "orientation", instructor: "Mona Saad", instructor_ar: "منى سعد", duration_hours: 8, max_participants: 15, location: "Nasr City HQ", cost: 0, status: "in_progress", start_date: d(0), end_date: d(0), materials: ["Employee Handbook", "Safety Manual", "Org Chart"], materials_ar: ["دليل الموظف", "دليل السلامة", "المخطط التنظيمي"] },
  { id: "tc02", workspace_id: W, title: "Advanced Sales Techniques", title_ar: "تقنيات المبيعات المتقدمة", description: "Luxury retail selling, upselling, client relationship management", description_ar: "مبيعات التجزئة الفاخرة وزيادة المبيعات وإدارة علاقات العملاء", type: "technical", instructor: "Sara Mahmoud", instructor_ar: "سارة محمود", duration_hours: 12, max_participants: 10, location: "Nasr City HQ", cost: 5000, status: "scheduled", start_date: d(7), end_date: d(5), materials: ["Sales Playbook", "Client Scripts"], materials_ar: ["كتيب المبيعات", "نصوص العملاء"] },
  { id: "tc03", workspace_id: W, title: "Workplace Safety Training", title_ar: "تدريب سلامة العمل", description: "Factory safety, machine operation, emergency procedures, PPE usage", description_ar: "سلامة المصنع وتشغيل الآلات وإجراءات الطوارئ واستخدام معدات الحماية", type: "safety", instructor: "Mohamed Gamal", instructor_ar: "محمد جمال", duration_hours: 6, max_participants: 20, location: "10th Ramadan Factory", cost: 0, status: "completed", start_date: d(30), end_date: d(30), materials: ["Safety Guidelines", "PPE Manual"], materials_ar: ["إرشادات السلامة", "دليل معدات الحماية"] },
  { id: "tc04", workspace_id: W, title: "Leadership Development Program", title_ar: "برنامج تطوير القيادة", description: "Managing teams, conflict resolution, performance coaching", description_ar: "إدارة الفرق وحل النزاعات وتوجيه الأداء", type: "leadership", instructor: "External - Merit Institute", instructor_ar: "خارجي - معهد ميريت", duration_hours: 24, max_participants: 8, location: "External Venue", cost: 45000, status: "scheduled", start_date: d(14), end_date: d(7), materials: ["Leadership Book", "Workbook"], materials_ar: ["كتاب القيادة", "دفتر العمل"] },
  { id: "tc05", workspace_id: W, title: "Egyptian Labor Law Compliance", title_ar: "التوافق مع قانون العمل المصري", description: "Employment contracts, working hours, leave entitlements, termination", description_ar: "عقود العمل وساعات العمل واستحقاقات الإجازات والإنهاء", type: "compliance", instructor: "HR Consultant", instructor_ar: "مستشار موارد بشرية", duration_hours: 4, max_participants: 15, location: "Nasr City HQ", cost: 8000, status: "completed", start_date: d(60), end_date: d(60), materials: ["Labor Law Summary", "Compliance Checklist"], materials_ar: ["ملخص قانون العمل", "قائمة التحقق"] },
  { id: "tc06", workspace_id: W, title: "Customer Service Excellence", title_ar: "التميز في خدمة العملاء", description: "Handling complaints, communication skills, brand representation", description_ar: "معالجة الشكاوى ومهارات التواصل وتمثيل العلامة التجارية", type: "soft_skills", instructor: "External Trainer", instructor_ar: "مدرب خارجي", duration_hours: 8, max_participants: 12, location: "Nasr City HQ", cost: 12000, status: "in_progress", start_date: d(0), end_date: d(-2), materials: ["Customer Service Guide", "Role Play Scripts"], materials_ar: ["دليل خدمة العملاء", "نصوص التمثيل"] },
];

export const HR_TRAINING_ENROLLMENTS: TrainingEnrollment[] = [
  { id: "te01", workspace_id: W, course_id: "tc01", employee_id: "e12", employee_name: "Heba Nabil", employee_name_ar: "هبة نبيل", status: "in_progress", progress: 50, score: null, certificate_url: null, enrolled_at: d(1), completed_at: null },
  { id: "te02", workspace_id: W, course_id: "tc01", employee_id: "e16", employee_name: "Salma Farouk", employee_name_ar: "سلمى فاروق", status: "in_progress", progress: 25, score: null, certificate_url: null, enrolled_at: d(1), completed_at: null },
  { id: "te03", workspace_id: W, course_id: "tc03", employee_id: "e07", employee_name: "Khaled Nabil", employee_name_ar: "خالد نبيل", status: "completed", progress: 100, score: 85, certificate_url: "#", enrolled_at: d(30), completed_at: d(30) },
  { id: "te04", workspace_id: W, course_id: "tc03", employee_id: "e11", employee_name: "Youssef Ali", employee_name_ar: "يوسف علي", status: "completed", progress: 100, score: 78, certificate_url: "#", enrolled_at: d(30), completed_at: d(30) },
  { id: "te05", workspace_id: W, course_id: "tc03", employee_id: "e15", employee_name: "Walid Nasser", employee_name_ar: "وليد ناصر", status: "completed", progress: 100, score: 72, certificate_url: "#", enrolled_at: d(30), completed_at: d(30) },
  { id: "te06", workspace_id: W, course_id: "tc05", employee_id: "e08", employee_name: "Mona Saad", employee_name_ar: "منى سعد", status: "completed", progress: 100, score: 95, certificate_url: "#", enrolled_at: d(60), completed_at: d(60) },
  { id: "te07", workspace_id: W, course_id: "tc06", employee_id: "e06", employee_name: "Nora Al-Farsi", employee_name_ar: "نورة الفارسي", status: "in_progress", progress: 60, score: null, certificate_url: null, enrolled_at: d(5), completed_at: null },
  { id: "te08", workspace_id: W, course_id: "tc06", employee_id: "e10", employee_name: "Dina Ragab", employee_name_ar: "دينا رجب", status: "in_progress", progress: 40, score: null, certificate_url: null, enrolled_at: d(5), completed_at: null },
];

export const HR_CERTIFICATIONS: Certification[] = [
  { id: "cr01", workspace_id: W, employee_id: "e08", name: "SHRM Certified Professional", name_ar: "محترف موارد بشرية معتمد SHRM", issuer: "SHRM", issue_date: d(730), expiry_date: d(-730), certificate_number: "SHRM-CP-2024-1234", status: "expired" },
  { id: "cr02", workspace_id: W, employee_id: "e03", name: "OSHA Safety Certification", name_ar: "شهادة سلامة OSHA", issuer: "OSHA", issue_date: d(365), expiry_date: d(-365), certificate_number: "OSHA-2025-5678", status: "expired" },
  { id: "cr03", workspace_id: W, employee_id: "e04", name: "Adobe Certified Expert", name_ar: "خبير Adobe معتمد", issuer: "Adobe", issue_date: d(180), expiry_date: null, certificate_number: "ACE-2026-9012", status: "valid" },
  { id: "cr04", workspace_id: W, employee_id: "e09", name: "Commercial Driving License", name_ar: "رخصة قيادة مركبات تجارية", issuer: "Egyptian Traffic Authority", issue_date: d(1095), expiry_date: d(365), certificate_number: "CDL-2023-3456", status: "valid" },
  { id: "cr05", workspace_id: W, employee_id: "e17", name: "First Aid Certification", name_ar: "شهادة الإسعافات الأولية", issuer: "Egyptian Red Crescent", issue_date: d(365), expiry_date: d(-365), certificate_number: "FA-2025-7890", status: "expired" },
];

// ═══════════════════════════════════════════════════════════
// 4. PERFORMANCE MANAGEMENT
// ═══════════════════════════════════════════════════════════

export interface PerformanceGoal {
  id: string; workspace_id: string; employee_id: string;
  title: string; title_ar: string; description: string; description_ar: string;
  type: "individual" | "team" | "company";
  category: "sales" | "production" | "quality" | "customer" | "growth";
  target_value: number; current_value: number; unit: string;
  weight: number; start_date: string; due_date: string;
  status: "not_started" | "in_progress" | "completed" | "missed";
}

export interface PerformanceReview {
  id: string; workspace_id: string; employee_id: string;
  period: string; reviewer: string; reviewer_ar: string;
  self_score: number; manager_score: number; final_score: number;
  strengths: string; strengths_ar: string;
  improvements: string; improvements_ar: string;
  goals_next: string; goals_next_ar: string;
  status: "draft" | "self_review" | "manager_review" | "hr_review" | "completed" | "acknowledged";
  created_at: string; completed_at: string | null;
}

export interface Feedback360 {
  id: string; workspace_id: string; employee_id: string;
  reviewer_id: string; reviewer_name: string; reviewer_name_ar: string;
  relationship: "manager" | "peer" | "direct_report" | "client";
  category: "communication" | "teamwork" | "leadership" | "technical" | "reliability";
  score: number; comments: string; comments_ar: string;
  anonymous: boolean; created_at: string;
}

export const HR_PERFORMANCE_GOALS: PerformanceGoal[] = [
  { id: "pg01", workspace_id: W, employee_id: "e02", title: "Achieve 2M EGP monthly sales", title_ar: "تحقيق مبيعات ٢ مليون ج.م شهرياً", description: "Total team sales target for the month", description_ar: "هدف المبيعات الإجمالي للفريق للشهر", type: "team", category: "sales", target_value: 2000000, current_value: 1650000, unit: "EGP", weight: 30, start_date: d(30), due_date: d(0), status: "in_progress" },
  { id: "pg02", workspace_id: W, employee_id: "e02", title: "Reduce customer complaints by 50%", title_ar: "تخفيض شكاوى العملاء بنسبة ٥٠٪", description: "Improve customer satisfaction score", description_ar: "تحسين درجة رضا العملاء", type: "team", category: "customer", target_value: 50, current_value: 35, unit: "%", weight: 20, start_date: d(30), due_date: d(0), status: "in_progress" },
  { id: "pg03", workspace_id: W, employee_id: "e06", title: "Close 5 VIP accounts this quarter", title_ar: "إغلاق ٥ حسابات VIP هذا الربع", description: "New VIP client acquisition", description_ar: "الحصول على عملاء VIP جدد", type: "individual", category: "sales", target_value: 5, current_value: 3, unit: "accounts", weight: 25, start_date: d(90), due_date: d(0), status: "in_progress" },
  { id: "pg04", workspace_id: W, employee_id: "e04", title: "Launch summer collection 2 weeks early", title_ar: "إطلاق مجموعة الصيف قبل أسبوعين", description: "Complete summer collection design and production", description_ar: "إكمال تصميم وإنتاج مجموعة الصيف", type: "individual", category: "production", target_value: 100, current_value: 85, unit: "%", weight: 30, start_date: d(60), due_date: d(-14), status: "in_progress" },
  { id: "pg05", workspace_id: W, employee_id: "e03", title: "Maintain 95% production quality rate", title_ar: "الحفاظ على معدل جودة الإنتاج ٩٥٪", description: "Zero defect rate on finished products", description_ar: "معدل عيوب صفر على المنتجات النهائية", type: "team", category: "quality", target_value: 95, current_value: 92, unit: "%", weight: 25, start_date: d(30), due_date: d(0), status: "in_progress" },
  { id: "pg06", workspace_id: W, employee_id: "e03", title: "Reduce overtime by 20%", title_ar: "تخفيض الوقت الإضافي بنسبة ٢٠٪", description: "Optimize production scheduling", description_ar: "تحسين جدولة الإنتاج", type: "team", category: "production", target_value: 20, current_value: 15, unit: "%", weight: 20, start_date: d(30), due_date: d(0), status: "in_progress" },
  { id: "pg07", workspace_id: W, employee_id: "e01", title: "Expand to 3 new branches", title_ar: "التوسع في ٣ فروع جديدة", description: "Open 3 new retail locations", description_ar: "فتح ٣ مواقع تجزئة جديدة", type: "individual", category: "growth", target_value: 3, current_value: 1, unit: "branches", weight: 20, start_date: d(365), due_date: d(0), status: "in_progress" },
  { id: "pg08", workspace_id: W, employee_id: "e01", title: "Increase revenue 25%", title_ar: "زيادة الإيرادات بنسبة ٢٥٪", description: "Year-over-year revenue growth", description_ar: "نمو الإيرادات من سنة لأخرى", type: "company", category: "sales", target_value: 25, current_value: 18, unit: "%", weight: 30, start_date: d(365), due_date: d(0), status: "in_progress" },
];

export const HR_PERFORMANCE_REVIEWS: PerformanceReview[] = [
  { id: "prv01", workspace_id: W, employee_id: "e01", period: "Q1 2026", reviewer: "Board", reviewer_ar: "مجلس الإدارة", self_score: 90, manager_score: 95, final_score: 92, strengths: "Excellent strategic vision, strong leadership, drives results", strengths_ar: "رؤية استراتيجية ممتازة، قيادة قوية، يحقق النتائج", improvements: "Could improve delegation and work-life balance", improvements_ar: "يمكن تحسين التفويض والتوازن بين العمل والحياة", goals_next: "Expand branches, increase revenue 25%, hire 3 managers", goals_next_ar: "توسيع الفروع وزيادة الإيرادات ٢٥٪ وتوظيف ٣ مديرين", status: "completed", created_at: d(60), completed_at: d(55) },
  { id: "prv02", workspace_id: W, employee_id: "e02", period: "Q1 2026", reviewer: "Ahmed Ali", reviewer_ar: "أحمد علي", self_score: 85, manager_score: 90, final_score: 88, strengths: "Strong team leadership, excellent client relationships", strengths_ar: "قيادة فريق قوية، علاقات ممتازة مع العملاء", improvements: "Needs better reporting cadence and data analysis", improvements_ar: "تحتاج تقرير أفضل وتحليل البيانات", goals_next: "Achieve 2M EGP monthly sales, launch loyalty program", goals_next_ar: "تحقيق مبيعات ٢ مليون شهرياً وإطلاق برنامج الولاء", status: "completed", created_at: d(30), completed_at: d(25) },
  { id: "prv03", workspace_id: W, employee_id: "e04", period: "Q1 2026", reviewer: "Ahmed Ali", reviewer_ar: "أحمد علي", self_score: 92, manager_score: 96, final_score: 94, strengths: "Creative excellence, trend awareness, team mentoring", strengths_ar: "التميز الإبداعي والوعي بالاتجاهات وإرشاد الفريق", improvements: "Time management on multiple projects", improvements_ar: "إدارة الوقت على المشاريع المتعددة", goals_next: "Launch summer collection early, mentor junior designers", goals_next_ar: "إطلاق مجموعة الصيف مبكراً وإرشاد المصممين المبتدئين", status: "completed", created_at: d(20), completed_at: d(18) },
  { id: "prv04", workspace_id: W, employee_id: "e06", period: "Q1 2026", reviewer: "Sara Mahmoud", reviewer_ar: "سارة محمود", self_score: 88, manager_score: 94, final_score: 91, strengths: "Top sales performer, excellent client retention", strengths_ar: "أفضل أداء في المبيعات، احتفاظ ممتاز بالعملاء", improvements: "Cross-selling to existing clients", improvements_ar: "البيع المتبادل للعملاء الحاليين", goals_next: "Close 5 VIP accounts, achieve 500K personal sales", goals_next_ar: "إغلاق ٥ حسابات VIP وتحقيق مبيعات شخصية ٥٠٠ ألف", status: "completed", created_at: d(15), completed_at: d(12) },
];

export const HR_FEEDBACK_360: Feedback360[] = [
  { id: "fb01", workspace_id: W, employee_id: "e02", reviewer_id: "e06", reviewer_name: "Nora Al-Farsi", reviewer_name_ar: "نورة الفارسي", relationship: "direct_report", category: "leadership", score: 4, comments: "Great manager, supportive and clear communicator", comments_ar: "مديرة رائعة، داعية ومṼاصل واضحة", anonymous: true, created_at: d(28) },
  { id: "fb02", workspace_id: W, employee_id: "e02", reviewer_id: "e10", reviewer_name: "Dina Ragab", reviewer_name_ar: "دينا رجب", relationship: "direct_report", category: "teamwork", score: 5, comments: "Always available to help, creates positive team atmosphere", comments_ar: "دائماً متاحة للمساعدة، تخلق أجواء إيجابية في الفريق", anonymous: true, created_at: d(27) },
  { id: "fb03", workspace_id: W, employee_id: "e04", reviewer_id: "e12", reviewer_name: "Heba Nabil", reviewer_name_ar: "هبة نبيل", relationship: "direct_report", category: "technical", score: 5, comments: "Incredible design talent, patient mentor", comments_ar: "موهبة تصميم لا تصدق، مربية صبورة", anonymous: true, created_at: d(18) },
  { id: "fb04", workspace_id: W, employee_id: "e03", reviewer_id: "e07", reviewer_name: "Khaled Nabil", reviewer_name_ar: "خالد نبيل", relationship: "direct_report", category: "communication", score: 3, comments: "Could be more clear with instructions, sometimes unclear", comments_ar: "يمكن أن يكون أكثر وضوحاً في التعليمات، أحياناً غير واضح", anonymous: true, created_at: d(25) },
  { id: "fb05", workspace_id: W, employee_id: "e03", reviewer_id: "e11", reviewer_name: "Youssef Ali", reviewer_name_ar: "يوسف علي", relationship: "direct_report", category: "reliability", score: 4, comments: "Depends on him for production issues, very experienced", comments_ar: "يعتمد عليه في مشاكل الإنتاج، ذو خبرة كبيرة", anonymous: true, created_at: d(24) },
];

// ═══════════════════════════════════════════════════════════
// 5. EMPLOYEE RELATIONS
// ═══════════════════════════════════════════════════════════

export interface Grievance {
  id: string; workspace_id: string; employee_id: string; employee_name: string; employee_name_ar: string;
  type: "workplace" | "harassment" | "discrimination" | "pay" | "manager" | "policy" | "safety";
  title: string; title_ar: string; description: string; description_ar: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "filed" | "investigating" | "mediation" | "resolved" | "escalated" | "closed";
  filed_by: string; filed_by_ar: string; assigned_to: string; assigned_to_ar: string;
  filed_at: string; resolved_at: string | null; resolution: string | null;
}

export interface PulseSurvey {
  id: string; workspace_id: string; title: string; title_ar: string;
  questions: { question: string; question_ar: string; category: string }[];
  status: "active" | "closed" | "draft";
  responses_count: number; avg_satisfaction: number;
  created_at: string; closed_at: string | null;
}

export interface TeamMorale {
  id: string; workspace_id: string; department: string;
  month: string; score: number; responses: number;
  highlights: string; highlights_ar: string;
}

export const HR_GRIEVANCES: Grievance[] = [
  { id: "gr01", workspace_id: W, employee_id: "e07", employee_name: "Khaled Nabil", employee_name_ar: "خالد نبيل", type: "manager", title: "Unfair treatment by supervisor", title_ar: "معاملة غير عادلة من المشرف", description: "Feels singled out for criticism compared to colleagues", description_ar: "يشعر بأنه مستهدف بالمقارنة بزملائه", severity: "medium", status: "mediation", filed_by: "Khaled Nabil", filed_by_ar: "خالد نبيل", assigned_to: "Mona Saad", assigned_to_ar: "منى سعد", filed_at: d(10), resolved_at: null, resolution: null },
  { id: "gr02", workspace_id: W, employee_id: "e15", employee_name: "Walid Nasser", employee_name_ar: "وليد ناصر", type: "pay", title: "Overtime pay discrepancy", title_ar: "فرق في أجر الوقت الإضافي", description: "Believes overtime hours were not fully counted last month", description_ar: "يعتقد أن ساعات الوقت الإضافي لم تُحسب بالكامل الشهر الماضي", severity: "medium", status: "investigating", filed_by: "Walid Nasser", filed_by_ar: "وليد ناصر", assigned_to: "Rania Mostafa", assigned_to_ar: "رانيا مصطفى", filed_at: d(5), resolved_at: null, resolution: null },
  { id: "gr03", workspace_id: W, employee_id: "e24", employee_name: "Sherif Adel", employee_name_ar: "شريف عادل", type: "safety", title: "Unsafe working conditions", title_ar: "ظروف عمل غير آمنة", description: "Broken ventilation in warehouse area, reports breathing issues", description_ar: "تهوية مكسورة في منطقة المخزن، ي_report مشاكل في التنفس", severity: "high", status: "escalated", filed_by: "Sherif Adel", filed_by_ar: "شريف عادل", assigned_to: "Mohamed Gamal", assigned_to_ar: "محمد جمال", filed_at: d(3), resolved_at: null, resolution: null },
  { id: "gr04", workspace_id: W, employee_id: "e13", employee_name: "Amira Khaled", employee_name_ar: "أميرة خالد", type: "workplace", title: "Workload distribution unfair", title_ar: "توزيع عبء العمل غير عادل", description: "Feels assigned more tasks than other team members", description_ar: "يشعر بأنه تم تكليفه بمزيد من المهام من أعضاء الفريق الآخرين", severity: "low", status: "resolved", filed_by: "Amira Khaled", filed_by_ar: "أميرة خالد", assigned_to: "Mohamed Gamal", assigned_to_ar: "محمد جمال", filed_at: d(15), resolved_at: d(12), resolution: "Tasks redistributed equally among team members" },
];

export const HR_PULSE_SURVEYS: PulseSurvey[] = [
  { id: "ps01", workspace_id: W, title: "Q1 2026 Employee Satisfaction", title_ar: "رضا الموظفين Q1 2026", questions: [
    { question: "How satisfied are you with your role?", question_ar: "ما مدى رضاك عن دورك؟", category: "satisfaction" },
    { question: "Do you feel valued by your manager?", question_ar: "هل تشعر بالتقدير من مديرك؟", category: "management" },
    { question: "How is the work-life balance?", question_ar: "كيف التوازن بين العمل والحياة؟", category: "wellbeing" },
    { question: "Do you have the tools to do your job well?", question_ar: "هل لديك الأدوات للقيام بعملك جيداً؟", category: "resources" },
    { question: "Would you recommend THOTH as a workplace?", question_ar: "هل توصي بثوت ك مكان عمل؟", category: "engagement" },
  ], status: "closed", responses_count: 20, avg_satisfaction: 4.1, created_at: d(90), closed_at: d(80) },
  { id: "ps02", workspace_id: W, title: "Q2 2026 Employee Satisfaction", title_ar: "رضا الموظفين Q2 2026", questions: [
    { question: "How satisfied are you with your role?", question_ar: "ما مدى رضاك عن دورك؟", category: "satisfaction" },
    { question: "Do you feel valued by your manager?", question_ar: "هل تشعر بالتقدير من مديرك؟", category: "management" },
    { question: "How is the work-life balance?", question_ar: "كيف التوازن بين العمل والحياة؟", category: "wellbeing" },
    { question: "Do you have the tools to do your job well?", question_ar: "هل لديك الأدوات للقيام بعملك جيداً؟", category: "resources" },
    { question: "Would you recommend THOTH as a workplace?", question_ar: "هل توصي بثوت ك مكان عمل؟", category: "engagement" },
  ], status: "active", responses_count: 12, avg_satisfaction: 4.3, created_at: d(5), closed_at: null },
];

export const HR_TEAM_MORALE: TeamMorale[] = [
  { id: "tm01", workspace_id: W, department: "sales", month: "2026-05", score: 4.5, responses: 5, highlights: "Strong team spirit, celebrating targets met", highlights_ar: "روح فريق قوية، احتفال بتحقيق الأهداف" },
  { id: "tm02", workspace_id: W, department: "production", month: "2026-05", score: 3.2, responses: 9, highlights: "Concerns about overtime, ventilation issues reported", highlights_ar: "مخاوف بشأن الوقت الإضافي، مشاكل التهوية" },
  { id: "tm03", workspace_id: W, department: "design", month: "2026-05", score: 4.7, responses: 3, highlights: "Creative energy high, successful collection preview", highlights_ar: "الطاقة الإبداعية مرتفعة، عرض مجموعة ناجح" },
  { id: "tm04", workspace_id: W, department: "warehouse", month: "2026-05", score: 3.0, responses: 2, highlights: "Staffing concerns, needs more workers", highlights_ar: "مخاوف بشأن التوظيف، يحتاج المزيد من العمال" },
  { id: "tm05", workspace_id: W, department: "admin", month: "2026-05", score: 4.0, responses: 3, highlights: "Smooth operations, new HR system welcomed", highlights_ar: "عمليات سلسة، ترحيب بنظام الموارد البشرية الجديد" },
];

// ═══════════════════════════════════════════════════════════
// 6. EMPLOYMENT LAW & COMPLIANCE
// ═══════════════════════════════════════════════════════════

export interface ComplianceItem {
  id: string; workspace_id: string; type: "contract" | "document" | "safety" | "insurance" | "tax" | "inspection";
  title: string; title_ar: string; description: string; description_ar: string;
  entity: string; entity_ar: string;
  due_date: string; status: "compliant" | "expiring" | "overdue" | "non_compliant";
  priority: "low" | "medium" | "high" | "critical";
  last_checked: string; next_check: string;
  notes: string; notes_ar: string;
}

export interface SafetyIncident {
  id: string; workspace_id: string; employee_id: string; employee_name: string;
  type: "injury" | "near_miss" | "property_damage" | "environmental";
  title: string; title_ar: string; description: string; description_ar: string;
  severity: "minor" | "moderate" | "major" | "critical";
  location: string; date: string; time: string;
  reported_by: string; investigated_by: string;
  status: "reported" | "investigating" | "resolved" | "closed";
  corrective_actions: string; corrective_actions_ar: string;
  lost_days: number;
}

export const HR_COMPLIANCE: ComplianceItem[] = [
  { id: "ci01", workspace_id: W, type: "contract", title: "Khaled Nabil - Contract Expiring", title_ar: "خالد نبيل - العقد ينتهي", description: "Employment contract expires in 120 days", description_ar: "عقد العمل ينتهي خلال ١٢٠ يوم", entity: "Khaled Nabil", entity_ar: "خالد نبيل", due_date: d(-120), status: "expiring", priority: "medium", last_checked: d(0), next_check: d(7), notes: "Performance review needed before renewal", notes_ar: "مراجعة الأداء مطلوبة قبل التجديد" },
  { id: "ci02", workspace_id: W, type: "contract", title: "Yasmin Adel - Contract Expiring Soon", title_ar: "ياسمين عادل - العقد ينتهي قريباً", description: "Employment contract expires in 40 days", description_ar: "عقد العمل ينتهي خلال ٤٠ يوم", entity: "Yasmin Adel", entity_ar: "ياسمين عادل", due_date: d(-40), status: "expiring", priority: "high", last_checked: d(0), next_check: d(3), notes: "High performer - offer renewal with raise", notes_ar: "أداء عالي - عرض التجديد مع زيادة" },
  { id: "ci03", workspace_id: W, type: "safety", title: "Factory Fire Safety Inspection", title_ar: "فحص السلامة من الحريق بالمصنع", description: "Annual fire safety inspection due", description_ar: "فحص السلامة من الحريق السنوي مستحق", entity: "10th Ramadan Factory", entity_ar: "مصنع العاشر من رمضان", due_date: d(-15), status: "overdue", priority: "critical", last_checked: d(365), next_check: d(0), notes: "Must schedule immediately - regulatory requirement", notes_ar: "يجب الجدولة فوراً - متطلب تنظيمي" },
  { id: "ci04", workspace_id: W, type: "insurance", title: "Group Medical Insurance Renewal", title_ar: "تجديد التأمين الطبي الجماعي", description: "Annual renewal of AXA medical insurance policy", description_ar: "تجديد سنوي لبوليصة التأمين الطبي من AXA", entity: "All Employees", entity_ar: "جميع الموظفين", due_date: d(-30), status: "expiring", priority: "high", last_checked: d(0), next_check: d(5), notes: "Negotiate better rates for 25+ employees", notes_ar: "التفاوض على أسعار أفضل لأكثر من ٢٥ موظف" },
  { id: "ci05", workspace_id: W, type: "tax", title: "Monthly Tax Filing - May 2026", title_ar: "تقديم الضرائب الشهرية - مايو ٢٠٢٦", description: "Monthly income tax and social insurance filing", description_ar: "تقديم ضريبة الدخل والتأمين الاجتماعي الشهري", entity: "Nasr City Branch", entity_ar: "فرع مدينة نصر", due_date: d(15), status: "compliant", priority: "medium", last_checked: d(5), next_check: d(25), notes: "Filed on time, no issues", notes_ar: "قدم في الوقت المحدد، لا توجد مشاكل" },
  { id: "ci06", workspace_id: W, type: "document", title: "Heba Nabil - Probation Decision Pending", title_ar: "هبة نبيل - قرار فترة التجربة معلق", description: "Probation period ended 45 days ago, employment decision needed", description_ar: "انتهت فترة التجربة منذ ٤٥ يوم، قرار التوظيف مطلوب", entity: "Heba Nabil", entity_ar: "هبة نبيل", due_date: d(-45), status: "overdue", priority: "critical", last_checked: d(0), next_check: d(0), notes: "Manager review pending - confirm or terminate", notes_ar: "مراجعة المدير معلقة - تأكيد أو إنهاء" },
  { id: "ci07", workspace_id: W, type: "inspection", title: "Workplace Safety Audit", title_ar: "تدقيق سلامة مكان العمل", description: "Quarterly safety audit by external consultant", description_ar: "تدقيق سلامة ربع سنوي من مستشار خارجي", entity: "All Locations", entity_ar: "جميع المواقع", due_date: d(15), status: "compliant", priority: "medium", last_checked: d(75), next_check: d(15), notes: "Last audit passed with minor findings", notes_ar: "آخر تدقيق اجتاز مع ملاحظات طفيفة" },
];

export const HR_SAFETY_INCIDENTS: SafetyIncident[] = [
  { id: "si01", workspace_id: W, employee_id: "e15", employee_name: "Walid Nasser", type: "injury", title: "Minor cut during painting", title_ar: "جرح بسيط أثناء الدهان", description: "Worker sustained a minor cut while operating paint sprayer", description_ar: "أصيب العامل بجرح بسيط أثناء تشغيل رشاش الطلاء", severity: "minor", location: "10th Ramadan - Paint Shop", date: d(20), time: "10:30", reported_by: "Mohamed Gamal", investigated_by: "Mohamed Gamal", status: "closed", corrective_actions: "First aid applied, reviewed PPE usage with team", corrective_actions_ar: "تم تقديم الإسعافات الأولية ومراجعة استخدام معدات الحماية مع الفريق", lost_days: 0 },
  { id: "si02", workspace_id: W, employee_id: "e24", employee_name: "Sherif Adel", type: "near_miss", title: "Forklift near miss incident", title_ar: "حادث مروحة شاحنة شبه كارثي", description: "Forklift almost hit worker due to poor visibility", description_ar: "شاحنة التحميل كادت تصطدم بعامل بسبب ضعف الرؤية", severity: "moderate", location: "10th Ramadan - Warehouse", date: d(10), time: "14:00", reported_by: "Omar Salah", investigated_by: "Mohamed Gamal", status: "resolved", corrective_actions: "Installed additional lighting, mandatory high-vis vests", corrective_actions_ar: "تركيب إضاءة إضافية، سترات انعكاسية إلزامية", lost_days: 0 },
  { id: "si03", workspace_id: W, employee_id: "e07", employee_name: "Khaled Nabil", type: "injury", title: "Machine operator hand injury", title_ar: "إصابة يد مشغل الآلة", description: "Worker caught fingers in CNC machine guard", description_ar: "أصيب العامل بأصابعه في حارس آلة CNC", severity: "major", location: "10th Ramadan - CNC Shop", date: d(45), time: "08:45", reported_by: "Mohamed Gamal", investigated_by: "Safety Consultant", status: "closed", corrective_actions: "Machine guard replaced, retrained all operators on safety procedures", corrective_actions_ar: "استبدال حارس الآلة، إعادة تدريب جميع المشغلين على إجراءات السلامة", lost_days: 7 },
];

// ═══════════════════════════════════════════════════════════
// 7. HR ANALYTICS & STRATEGY
// ═══════════════════════════════════════════════════════════

export interface HRMetrics {
  total_headcount: number; active_employees: number;
  new_hires_ytd: number; turnover_rate: number;
  avg_tenure_months: number; avg_salary: number;
  total_payroll_monthly: number; training_hours_ytd: number;
  training_budget_used: number; training_budget_total: number;
  open_positions: number; time_to_fill_days: number;
  offer_acceptance_rate: number; employee_satisfaction: number;
  absenteeism_rate: number; overtime_hours_monthly: number;
  compliance_score: number; safety_incidents_ytd: number;
  diversity_ratio: { male: number; female: number };
  age_distribution: { "18-25": number; "26-35": number; "36-45": number; "46+": number };
  tenure_distribution: { "<1yr": number; "1-3yr": number; "3-5yr": number; "5+yr": number };
}

export interface HeadcountTrend {
  month: string; headcount: number; new_hires: number; exits: number;
}

export interface TurnoverData {
  department: string; department_ar: string; rate: number; count: number;
}

export const HR_METRICS: HRMetrics = {
  total_headcount: 25, active_employees: 20, new_hires_ytd: 6,
  turnover_rate: 8.0, avg_tenure_months: 28, avg_salary: 15200,
  total_payroll_monthly: 380000, training_hours_ytd: 156,
  training_budget_used: 70000, training_budget_total: 125000,
  open_positions: 4, time_to_fill_days: 32,
  offer_acceptance_rate: 85, employee_satisfaction: 4.2,
  absenteeism_rate: 4.5, overtime_hours_monthly: 320,
  compliance_score: 82, safety_incidents_ytd: 3,
  diversity_ratio: { male: 16, female: 9 },
  age_distribution: { "18-25": 4, "26-35": 12, "36-45": 7, "46+": 2 },
  tenure_distribution: { "<1yr": 6, "1-3yr": 10, "3-5yr": 6, "5+yr": 3 },
};

export const HR_HEADCOUNT_TREND: HeadcountTrend[] = [
  { month: "Jan", headcount: 22, new_hires: 2, exits: 0 },
  { month: "Feb", headcount: 23, new_hires: 1, exits: 0 },
  { month: "Mar", headcount: 24, new_hires: 2, exits: 1 },
  { month: "Apr", headcount: 25, new_hires: 1, exits: 0 },
  { month: "May", headcount: 25, new_hires: 0, exits: 1 },
  { month: "Jun", headcount: 25, new_hires: 0, exits: 0 },
];

export const HR_TURNOVER_BY_DEPT: TurnoverData[] = [
  { department: "Production", department_ar: "الإنتاج", rate: 12.5, count: 1 },
  { department: "Sales", department_ar: "المبيعات", rate: 0, count: 0 },
  { department: "Design", department_ar: "التصميم", rate: 0, count: 0 },
  { department: "Warehouse", department_ar: "المخزن", rate: 33.3, count: 1 },
  { department: "Delivery", department_ar: "التوصيل", rate: 0, count: 0 },
  { department: "Admin", department_ar: "الإدارة", rate: 0, count: 0 },
  { department: "Management", department_ar: "الإدارة العليا", rate: 0, count: 0 },
];
