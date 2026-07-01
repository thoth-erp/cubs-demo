/**
 * Finance Full Module Data — بيانات شاملة للوحدة المالية
 *
 * Covers all finance areas:
 * 1. Invoices & Billing
 * 2. Payments & Receipts
 * 3. Expenses & Budgets
 * 4. Financial Reports (P&L, Balance Sheet, Cash Flow)
 * 5. Bank Accounts & Reconciliation
 * 6. Tax Management
 * 7. Accounts Receivable & Payable
 */

const W = "demo";
const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
const ts = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString();

function formatEGP(n: number) {
  return new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", minimumFractionDigits: 0 }).format(n);
}

// ═══════════════════════════════════════════════════════════
// 1. INVOICES & BILLING
// ═══════════════════════════════════════════════════════════

export interface FinanceInvoice {
  id: string; workspace_id: string; invoice_number: string;
  customer_id: string; customer_name: string; customer_name_ar: string;
  customer_email: string; customer_phone: string;
  title: string; title_ar: string;
  items: { description: string; description_ar: string; quantity: number; unit_price: number; total: number }[];
  subtotal: number; tax_rate: number; tax_amount: number; discount: number;
  total: number; currency: string;
  status: "draft" | "sent" | "viewed" | "partial" | "paid" | "overdue" | "cancelled";
  issue_date: string; due_date: string; paid_date: string | null;
  paid_amount: number; balance: number;
  payment_terms: string; payment_terms_ar: string;
  notes: string; notes_ar: string;
  created_by: string; created_by_id: string; created_at: string;
  branch: string; salesperson: string; salesperson_id: string;
}

export const FIN_INVOICES: FinanceInvoice[] = [
  { id: "fi01", workspace_id: W, invoice_number: "INV-2026-001", customer_id: "c01", customer_name: "Nora Al-Farsi", customer_name_ar: "نورة الفارسي", customer_email: "nora.alfarsi@gmail.com", customer_phone: "+20-100-123-4567", title: "Bridal Package - Full", title_ar: "باقة العروس - كاملة", items: [{ description: "Bridal Dress", description_ar: "فستان عروس", quantity: 1, unit_price: 8000, total: 8000 }, { description: "Veil", description_ar: "حجاب", quantity: 1, unit_price: 2000, total: 2000 }, { description: "Accessories", description_ar: "إكسسوارات", quantity: 1, unit_price: 2000, total: 2000 }], subtotal: 12000, tax_rate: 14, tax_amount: 1680, discount: 0, total: 13680, currency: "EGP", status: "paid", issue_date: d(30), due_date: d(0), paid_date: d(5), paid_amount: 13680, balance: 0, payment_terms: "Net 30", payment_terms_ar: "صافي ٣٠", notes: "Full bridal package for June wedding", notes_ar: "باقة عروس كاملة لزفاف يونيو", created_by: "Ahmed", created_by_id: "e01", created_at: d(30), branch: "Nasr City", salesperson: "Ahmed", salesperson_id: "e01" },
  { id: "fi02", workspace_id: W, invoice_number: "INV-2026-002", customer_id: "c04", customer_name: "Khalid Al-Mansouri", customer_name_ar: "خالد المنصوري", customer_email: "khalid.m@corp.sa", customer_phone: "+966-50-123-4567", title: "International Wholesale Order", title_ar: "طلب بالجملة الدولي", items: [{ description: "Abayas (Black)", description_ar: "عباءات (سوداء)", quantity: 100, unit_price: 500, total: 50000 }, { description: "Kaftans", description_ar: "قفاطين", quantity: 50, unit_price: 700, total: 35000 }], subtotal: 85000, tax_rate: 0, tax_amount: 0, discount: 5000, total: 80000, currency: "EGP", status: "paid", issue_date: d(45), due_date: d(-15), paid_date: d(10), paid_amount: 80000, balance: 0, payment_terms: "Net 30", payment_terms_ar: "صافي ٣٠", notes: "Wholesale order for Saudi market", notes_ar: "طلب بالجملة للسوق السعودي", created_by: "Ahmed", created_by_id: "e01", created_at: d(45), branch: "Nasr City", salesperson: "Ahmed", salesperson_id: "e01" },
  { id: "fi03", workspace_id: W, invoice_number: "INV-2026-003", customer_id: "c03", customer_name: "Sara Mahmoud", customer_name_ar: "سارة محمود", customer_email: "sara.m@company.eg", customer_phone: "+20-122-345-6789", title: "Corporate Uniforms - Batch 1", title_ar: "أزياء موحدة - الدفعة الأولى", items: [{ description: "Corporate Uniform Set", description_ar: "طقم زي موحد", quantity: 50, unit_price: 400, total: 20000 }, { description: "Embroidery", description_ar: "تطريز", quantity: 50, unit_price: 50, total: 2500 }], subtotal: 22500, tax_rate: 14, tax_amount: 3150, discount: 0, total: 25650, currency: "EGP", status: "overdue", issue_date: d(60), due_date: d(-30), paid_date: null, paid_amount: 0, balance: 25650, payment_terms: "Net 30", payment_terms_ar: "صافي ٣٠", notes: "Corporate uniforms for 50 employees", notes_ar: "أزياء موحدة لـ ٥٠ موظف", created_by: "Sara", created_by_id: "e02", created_at: d(60), branch: "Nasr City", salesperson: "Sara", salesperson_id: "e02" },
  { id: "fi04", workspace_id: W, invoice_number: "INV-2026-004", customer_id: "c02", customer_name: "Layla Hassan", customer_name_ar: "ليلى حسن", customer_email: "layla.h@outlook.com", customer_phone: "+20-111-234-5678", title: "Evening Wear Collection", title_ar: "مجموعة ملابس سهرة", items: [{ description: "Evening Dress", description_ar: "فستان سهرة", quantity: 2, unit_price: 3500, total: 7000 }, { description: "Clutch Bag", description_ar: "حقيبة كلاتش", quantity: 2, unit_price: 800, total: 1600 }], subtotal: 8600, tax_rate: 14, tax_amount: 1204, discount: 500, total: 9304, currency: "EGP", status: "sent", issue_date: d(15), due_date: d(15), paid_date: null, paid_amount: 0, balance: 9304, payment_terms: "Net 30", payment_terms_ar: "صافي ٣٠", notes: "Online order via Shopify", notes_ar: "طلب أونلاين عبر شوبيفاي", created_by: "System", created_by_id: "", created_at: d(15), branch: "Online", salesperson: "—", salesperson_id: "" },
  { id: "fi05", workspace_id: W, invoice_number: "INV-2026-005", customer_id: "c12", customer_name: "Tamer Hosny", customer_name_ar: "تامر حسني", customer_email: "tamer.h@music.com", customer_phone: "+20-120-222-3333", title: "Celebrity Custom Collection", title_ar: "مجموعة مشاهير مخصصة", items: [{ description: "Custom Evening Wear", description_ar: "ملابس سهرة مخصصة", quantity: 3, unit_price: 12000, total: 36000 }, { description: "Styling Session", description_ar: "جلسة تنسيق", quantity: 1, unit_price: 5000, total: 5000 }], subtotal: 41000, tax_rate: 14, tax_amount: 5740, discount: 0, total: 46740, currency: "EGP", status: "partial", issue_date: d(20), due_date: d(-10), paid_date: null, paid_amount: 20000, balance: 26740, payment_terms: "Net 30", payment_terms_ar: "صافي ٣٠", notes: "VIP celebrity client - priority production", notes_ar: "عميل VIP مشهور - إنتاج ذو أولوية", created_by: "Ahmed", created_by_id: "e01", created_at: d(20), branch: "Nasr City", salesperson: "Ahmed", salesperson_id: "e01" },
  { id: "fi06", workspace_id: W, invoice_number: "INV-2026-006", customer_id: "c14", customer_name: "Rania Mostafa", customer_name_ar: "رانيا مصطفى", customer_email: "rania.m@law.eg", customer_phone: "+20-140-444-5555", title: "Professional Evening Wear", title_ar: "ملابس سهرة مهنية", items: [{ description: "Professional Suit", description_ar: "بدلة مهنية", quantity: 2, unit_price: 4500, total: 9000 }, { description: "Blouse Set", description_ar: "طقم بلوزات", quantity: 3, unit_price: 1200, total: 3600 }], subtotal: 12600, tax_rate: 14, tax_amount: 1764, discount: 0, total: 14364, currency: "EGP", status: "overdue", issue_date: d(45), due_date: d(-15), paid_date: null, paid_amount: 0, balance: 14364, payment_terms: "Net 30", payment_terms_ar: "صافي ٣٠", notes: "Corporate client - law firm", notes_ar: "عميل شركات - مكتب محاماة", created_by: "Mohamed", created_by_id: "e03", created_at: d(45), branch: "Nasr City", salesperson: "Mohamed", salesperson_id: "e03" },
  { id: "fi07", workspace_id: W, invoice_number: "INV-2026-007", customer_id: "c20", customer_name: "Yasmin Adel", customer_name_ar: "ياسمين عادل", customer_email: "yasmin.a@wedding.com", customer_phone: "+20-105-000-1111", title: "Bridal Package - Premium", title_ar: "باقة العروس - فاخرة", items: [{ description: "Premium Bridal Dress", description_ar: "فستان عروس فاخر", quantity: 1, unit_price: 15000, total: 15000 }, { description: "Accessories Set", description_ar: "طقم إكسسوارات", quantity: 1, unit_price: 3000, total: 3000 }, { description: "Styling Session", description_ar: "جلسة تنسيق", quantity: 2, unit_price: 2500, total: 5000 }], subtotal: 23000, tax_rate: 14, tax_amount: 3220, discount: 1000, total: 25220, currency: "EGP", status: "draft", issue_date: d(3), due_date: d(27), paid_date: null, paid_amount: 0, balance: 25220, payment_terms: "Net 30", payment_terms_ar: "صافي ٣٠", notes: "Premium bridal package for June wedding", notes_ar: "باقة عروس فاخرة لزفاف يونيو", created_by: "Sara", created_by_id: "e02", created_at: d(3), branch: "Nasr City", salesperson: "Sara", salesperson_id: "e02" },
  { id: "fi08", workspace_id: W, invoice_number: "INV-2026-008", customer_id: "c15", customer_name: "Hassan Barakat", customer_name_ar: "حسن بركات", customer_email: "hassan.b@import.com", customer_phone: "+971-4-333-4444", title: "UAE Wholesale Order", title_ar: "طلب بالجملة الإمارات", items: [{ description: "Abayas Collection", description_ar: "مجموعة عباءات", quantity: 80, unit_price: 600, total: 48000 }, { description: "Scarves", description_ar: "أوشحة", quantity: 100, unit_price: 200, total: 20000 }], subtotal: 68000, tax_rate: 0, tax_amount: 0, discount: 3000, total: 65000, currency: "EGP", status: "paid", issue_date: d(40), due_date: d(-10), paid_date: d(5), paid_amount: 65000, balance: 0, payment_terms: "Net 30", payment_terms_ar: "صافي ٣٠", notes: "International wholesale - UAE market", notes_ar: "بالجملة الدولي - السوق الإماراتي", created_by: "Ahmed", created_by_id: "e01", created_at: d(40), branch: "Nasr City", salesperson: "Ahmed", salesperson_id: "e01" },
];

// ═══════════════════════════════════════════════════════════
// 2. PAYMENTS & RECEIPTS
// ═══════════════════════════════════════════════════════════

export interface FinancePayment {
  id: string; workspace_id: string; invoice_id: string; invoice_number: string;
  customer_name: string; customer_name_ar: string;
  amount: number; currency: string;
  method: "cash" | "bank_transfer" | "card" | "mobile_wallet" | "cheque" | "online";
  reference: string; bank_name: string;
  date: string; recorded_by: string; recorded_by_id: string;
  status: "completed" | "pending" | "failed" | "reversed";
  notes: string; notes_ar: string;
}

export const FIN_PAYMENTS: FinancePayment[] = [
  { id: "fp01", workspace_id: W, invoice_id: "fi01", invoice_number: "INV-2026-001", customer_name: "Nora Al-Farsi", customer_name_ar: "نورة الفارسي", amount: 6840, currency: "EGP", method: "bank_transfer", reference: "TRF-2026-001", bank_name: "CIB", date: d(20), recorded_by: "Ahmed", recorded_by_id: "e01", status: "completed", notes: "First installment", notes_ar: "القسط الأول" },
  { id: "fp02", workspace_id: W, invoice_id: "fi01", invoice_number: "INV-2026-001", customer_name: "Nora Al-Farsi", customer_name_ar: "نورة الفارسي", amount: 6840, currency: "EGP", method: "bank_transfer", reference: "TRF-2026-002", bank_name: "CIB", date: d(5), recorded_by: "Ahmed", recorded_by_id: "e01", status: "completed", notes: "Final payment", notes_ar: "الدفعة النهائية" },
  { id: "fp03", workspace_id: W, invoice_id: "fi02", invoice_number: "INV-2026-002", customer_name: "Khalid Al-Mansouri", customer_name_ar: "خالد المنصوري", amount: 80000, currency: "EGP", method: "bank_transfer", reference: "TRF-INT-001", bank_name: "Al Rajhi Bank", date: d(10), recorded_by: "Ahmed", recorded_by_id: "e01", status: "completed", notes: "International wire transfer", notes_ar: "تحويل بنكي دولي" },
  { id: "fp04", workspace_id: W, invoice_id: "fi05", invoice_number: "INV-2026-005", customer_name: "Tamer Hosny", customer_name_ar: "تامر حسني", amount: 20000, currency: "EGP", method: "cash", reference: "CASH-001", bank_name: "—", date: d(15), recorded_by: "Ahmed", recorded_by_id: "e01", status: "completed", notes: "Deposit payment", notes_ar: "دفعة عربون" },
  { id: "fp05", workspace_id: W, invoice_id: "fi08", invoice_number: "INV-2026-008", customer_name: "Hassan Barakat", customer_name_ar: "حسن بركات", amount: 65000, currency: "EGP", method: "bank_transfer", reference: "TRF-UAE-001", bank_name: "Emirates NBD", date: d(5), recorded_by: "Ahmed", recorded_by_id: "e01", status: "completed", notes: "Full payment - UAE transfer", notes_ar: "دفعة كاملة - تحويل الإمارات" },
  { id: "fp06", workspace_id: W, invoice_id: "fi04", invoice_number: "INV-2026-004", customer_name: "Layla Hassan", customer_name_ar: "ليلى حسن", amount: 9304, currency: "EGP", method: "online", reference: "SHOPIFY-7892", bank_name: "Stripe", date: d(14), recorded_by: "System", recorded_by_id: "", status: "pending", notes: "Shopify payment processing", notes_ar: "معالجة دفع شوبيفاي" },
];

// ═══════════════════════════════════════════════════════════
// 3. EXPENSES & BUDGETS
// ═══════════════════════════════════════════════════════════

export interface FinanceExpense {
  id: string; workspace_id: string;
  vendor: string; vendor_ar: string;
  category: "rent" | "utilities" | "salaries" | "marketing" | "supplies" | "travel" | "insurance" | "maintenance" | "technology" | "professional" | "other";
  description: string; description_ar: string;
  amount: number; currency: string;
  status: "draft" | "pending" | "approved" | "paid" | "rejected";
  date: string; due_date: string;
  approved_by: string | null; approved_at: string | null;
  paid_at: string | null; payment_method: string;
  receipt_url: string | null;
  branch: string; recurring: boolean;
}

export interface FinanceBudget {
  id: string; workspace_id: string;
  category: string; category_ar: string;
  period: string; budgeted: number; actual: number;
  variance: number; utilization_pct: number;
  status: "under" | "on_track" | "over" | "critical";
}

export const FIN_EXPENSES: FinanceExpense[] = [
  { id: "fe01", workspace_id: W, vendor: "Nasr City Rent", vendor_ar: "إيجار مدينة نصر", category: "rent", description: "Monthly showroom rent", description_ar: "إيجار المعرض الشهري", amount: 85000, currency: "EGP", status: "paid", date: d(1), due_date: d(0), approved_by: "Ahmed", approved_at: d(5), paid_at: d(1), payment_method: "bank_transfer", receipt_url: null, branch: "Nasr City", recurring: true },
  { id: "fe02", workspace_id: W, vendor: "10th Ramadan Factory Rent", vendor_ar: "إيجار مصنع العاشر", category: "rent", description: "Monthly factory rent", description_ar: "إيجار المصنع الشهري", amount: 120000, currency: "EGP", status: "paid", date: d(1), due_date: d(0), approved_by: "Ahmed", approved_at: d(5), paid_at: d(1), payment_method: "bank_transfer", receipt_url: null, branch: "10th Ramadan", recurring: true },
  { id: "fe03", workspace_id: W, vendor: "Staff Salaries - May", vendor_ar: "رواتب الموظفين - مايو", category: "salaries", description: "Monthly payroll for 25 employees", description_ar: "رواتب شهرية لـ ٢٥ موظف", amount: 380000, currency: "EGP", status: "paid", date: d(5), due_date: d(0), approved_by: "Ahmed", approved_at: d(6), paid_at: d(5), payment_method: "bank_transfer", receipt_url: null, branch: "All", recurring: true },
  { id: "fe04", workspace_id: W, vendor: "Facebook Ads", vendor_ar: "إعلانات فيسبوك", category: "marketing", description: "Social media advertising - June", description_ar: "إعلانات وسائل التواصل - يونيو", amount: 25000, currency: "EGP", status: "approved", date: d(10), due_date: d(-5), approved_by: "Sara", approved_at: d(8), paid_at: null, payment_method: "card", receipt_url: null, branch: "All", recurring: true },
  { id: "fe05", workspace_id: W, vendor: "Fabric Supplier - Al-Mehwar", vendor_ar: "مورد الأقمشة - المحور", category: "supplies", description: "Bulk fabric order - summer collection", description_ar: "طلب أقمشة بالجملة - مجموعة الصيف", amount: 450000, currency: "EGP", status: "paid", date: d(15), due_date: d(-5), approved_by: "Ahmed", approved_at: d(16), paid_at: d(10), payment_method: "bank_transfer", receipt_url: null, branch: "10th Ramadan", recurring: false },
  { id: "fe06", workspace_id: W, vendor: "Egyptian Electric Company", vendor_ar: "شركة الكهرباء المصرية", category: "utilities", description: "Factory electricity - May", description_ar: "كهرباء المصنع - مايو", amount: 35000, currency: "EGP", status: "paid", date: d(5), due_date: d(0), approved_by: "Mohamed", approved_at: d(6), paid_at: d(5), payment_method: "bank_transfer", receipt_url: null, branch: "10th Ramadan", recurring: true },
  { id: "fe07", workspace_id: W, vendor: "AXA Insurance", vendor_ar: "تأمين AXA", category: "insurance", description: "Annual group medical insurance renewal", description_ar: "تجديد التأمين الطبي الجماعي السنوي", amount: 200000, currency: "EGP", status: "pending", date: d(0), due_date: d(30), approved_by: null, approved_at: null, paid_at: null, payment_method: "bank_transfer", receipt_url: null, branch: "All", recurring: false },
  { id: "fe08", workspace_id: W, vendor: "IT Solutions Co.", vendor_ar: "شركة حلول تكنولوجيا المعلومات", category: "technology", description: "ERP system annual license", description_ar: "ترخيص نظام ERP السنوي", amount: 180000, currency: "EGP", status: "paid", date: d(60), due_date: d(-30), approved_by: "Ahmed", approved_at: d(65), paid_at: d(60), payment_method: "bank_transfer", receipt_url: null, branch: "All", recurring: false },
  { id: "fe09", workspace_id: W, vendor: "Delivery Van Maintenance", vendor_ar: "صيانة شاحنة التوصيل", category: "maintenance", description: "Monthly van service and repairs", description_ar: "صيانة وإصلاح الشاحنة الشهرية", amount: 8500, currency: "EGP", status: "approved", date: d(3), due_date: d(5), approved_by: "Mohamed", approved_at: d(2), paid_at: null, payment_method: "cash", receipt_url: null, branch: "10th Ramadan", recurring: true },
  { id: "fe10", workspace_id: W, vendor: "Legal Consultant", vendor_ar: "مستشار قانوني", category: "professional", description: "Contract review and legal consultation", description_ar: "مراجعة العقود والاستشارة القانونية", amount: 15000, currency: "EGP", status: "draft", date: d(1), due_date: d(15), approved_by: null, approved_at: null, paid_at: null, payment_method: "bank_transfer", receipt_url: null, branch: "All", recurring: false },
];

export const FIN_BUDGETS: FinanceBudget[] = [
  { id: "b01", workspace_id: W, category: "Rent", category_ar: "الإيجار", period: "2026-Q2", budgeted: 615000, actual: 205000, variance: 0, utilization_pct: 33, status: "on_track" },
  { id: "b02", workspace_id: W, category: "Salaries", category_ar: "الرواتب", period: "2026-Q2", budgeted: 1140000, actual: 380000, variance: 0, utilization_pct: 33, status: "on_track" },
  { id: "b03", workspace_id: W, category: "Marketing", category_ar: "التسويق", period: "2026-Q2", budgeted: 150000, actual: 75000, variance: 0, utilization_pct: 50, status: "on_track" },
  { id: "b04", workspace_id: W, category: "Supplies", category_ar: "المستلزمات", period: "2026-Q2", budgeted: 900000, actual: 450000, variance: 0, utilization_pct: 50, status: "on_track" },
  { id: "b05", workspace_id: W, category: "Utilities", category_ar: "المرافق", period: "2026-Q2", budgeted: 105000, actual: 35000, variance: 0, utilization_pct: 33, status: "on_track" },
  { id: "b06", workspace_id: W, category: "Technology", category_ar: "التكنولوجيا", period: "2026-Q2", budgeted: 200000, actual: 180000, variance: 0, utilization_pct: 90, status: "critical" },
  { id: "b07", workspace_id: W, category: "Insurance", category_ar: "التأمين", period: "2026-Q2", budgeted: 220000, actual: 0, variance: 0, utilization_pct: 0, status: "under" },
  { id: "b08", workspace_id: W, category: "Maintenance", category_ar: "الصيانة", period: "2026-Q2", budgeted: 50000, actual: 8500, variance: 0, utilization_pct: 17, status: "under" },
];

// ═══════════════════════════════════════════════════════════
// 4. FINANCIAL REPORTS
// ═══════════════════════════════════════════════════════════

export interface ProfitLossData {
  period: string;
  revenue: { label: string; label_ar: string; amount: number }[];
  cost_of_goods: { label: string; label_ar: string; amount: number }[];
  operating_expenses: { label: string; label_ar: string; amount: number }[];
}

export interface CashFlowData {
  period: string;
  operating: { label: string; label_ar: string; amount: number }[];
  investing: { label: string; label_ar: string; amount: number }[];
  financing: { label: string; label_ar: string; amount: number }[];
}

export const FIN_PROFIT_LOSS: ProfitLossData = {
  period: "2026-Q2",
  revenue: [
    { label: "Retail Sales", label_ar: "مبيعات التجزئة", amount: 850000 },
    { label: "Wholesale Orders", label_ar: "طلبات بالجملة", amount: 1450000 },
    { label: "Online Sales (Shopify)", label_ar: "مبيعات أونلاين", amount: 320000 },
    { label: "Custom Orders", label_ar: "طلبات مخصصة", amount: 280000 },
    { label: "Alterations & Services", label_ar: "تعديلات وخدمات", amount: 95000 },
  ],
  cost_of_goods: [
    { label: "Raw Materials (Fabric)", label_ar: "مواد خام (أقمشة)", amount: 680000 },
    { label: "Trims & Accessories", label_ar: "أطراف وإكسسوارات", amount: 180000 },
    { label: "Production Labor", label_ar: "عمالة الإنتاج", amount: 420000 },
    { label: "Packaging", label_ar: "التغليف", amount: 45000 },
    { label: "Shipping & Delivery", label_ar: "الشحن والتوصيل", amount: 65000 },
  ],
  operating_expenses: [
    { label: "Rent (Showroom + Factory)", label_ar: "إيجار (معرض + مصنع)", amount: 615000 },
    { label: "Salaries & Benefits", label_ar: "رواتب ومزايا", amount: 1140000 },
    { label: "Marketing & Advertising", label_ar: "التسويق والإعلانات", amount: 75000 },
    { label: "Utilities", label_ar: "المرافق", amount: 35000 },
    { label: "Technology & Software", label_ar: "التكنولوجيا والبرمجيات", amount: 180000 },
    { label: "Insurance", label_ar: "التأمين", amount: 0 },
    { label: "Maintenance", label_ar: "الصيانة", amount: 8500 },
    { label: "Professional Services", label_ar: "الخدمات المهنية", amount: 0 },
  ],
};

export const FIN_CASH_FLOW: CashFlowData = {
  period: "2026-Q2",
  operating: [
    { label: "Customer Payments", label_ar: "مدفوعات العملاء", amount: 1835000 },
    { label: "Supplier Payments", label_ar: "مدفوعات الموردين", amount: -680000 },
    { label: "Salary Payments", label_ar: "دفع الرواتب", amount: -1140000 },
    { label: "Rent Payments", label_ar: "دفع الإيجار", amount: -615000 },
    { label: "Utility Payments", label_ar: "دفع المرافق", amount: -35000 },
    { label: "Marketing Spend", label_ar: "إنفاق التسويق", amount: -75000 },
  ],
  investing: [
    { label: "Equipment Purchase", label_ar: "شراء معدات", amount: -250000 },
    { label: "Vehicle Purchase", label_ar: "شراء مركبة", amount: -350000 },
  ],
  financing: [
    { label: "Bank Loan", label_ar: "قرض بنكي", amount: 500000 },
    { label: "Loan Repayment", label_ar: "سداد القرض", amount: -120000 },
    { label: "Owner Investment", label_ar: "استثمار المالك", amount: 200000 },
  ],
};

// ═══════════════════════════════════════════════════════════
// 5. BANK ACCOUNTS & RECONCILIATION
// ═══════════════════════════════════════════════════════════

export interface BankAccount {
  id: string; workspace_id: string;
  name: string; name_ar: string;
  bank_name: string; bank_name_ar: string;
  account_number: string; swift_code: string;
  currency: string; balance: number;
  last_reconciled: string;
  status: "active" | "inactive" | "frozen";
  type: "current" | "savings" | "petty_cash";
}

export interface BankTransaction {
  id: string; workspace_id: string; account_id: string;
  date: string; description: string; description_ar: string;
  debit: number; credit: number; balance: number;
  category: "customer_payment" | "supplier_payment" | "salary" | "rent" | "utilities" | "loan" | "transfer" | "other";
  reconciled: boolean; reconciled_date: string | null;
  reference: string;
}

export const FIN_BANK_ACCOUNTS: BankAccount[] = [
  { id: "ba01", workspace_id: W, name: "Main Business Account", name_ar: "الحساب الرئيسي", bank_name: "Commercial International Bank", bank_name_ar: "البنك التجاري الدولي", account_number: "****4521", swift_code: "CIBCEGCX", currency: "EGP", balance: 2850000, last_reconciled: d(1), status: "active", type: "current" },
  { id: "ba02", workspace_id: W, name: "Savings Account", name_ar: "حساب التوفير", bank_name: "National Bank of Egypt", bank_name_ar: "البنك الأهلي المصري", account_number: "****7832", swift_code: "NBEGEGCX", currency: "EGP", balance: 1500000, last_reconciled: d(5), status: "active", type: "savings" },
  { id: "ba03", workspace_id: W, name: "Petty Cash", name_ar: "المصروفات النثرية", bank_name: "Internal", bank_name_ar: "داخلي", account_number: "—", swift_code: "—", currency: "EGP", balance: 45000, last_reconciled: d(0), status: "active", type: "petty_cash" },
  { id: "ba04", workspace_id: W, name: "USD Account", name_ar: "حساب الدولار", bank_name: "CIB", bank_name_ar: "البنك التجاري الدولي", account_number: "****9018", swift_code: "CIBCEGCX", currency: "USD", balance: 28500, last_reconciled: d(3), status: "active", type: "current" },
];

export const FIN_BANK_TRANSACTIONS: BankTransaction[] = [
  { id: "bt01", workspace_id: W, account_id: "ba01", date: d(1), description: "Nora Al-Farsi - Final payment", description_ar: "نورة الفارسي - الدفعة النهائية", debit: 0, credit: 6840, balance: 2850000, category: "customer_payment", reconciled: true, reconciled_date: d(1), reference: "TRF-2026-002" },
  { id: "bt02", workspace_id: W, account_id: "ba01", date: d(1), description: "Nasr City Rent - June", description_ar: "إيجار مدينة نصر - يونيو", debit: 85000, credit: 0, balance: 2843160, category: "rent", reconciled: true, reconciled_date: d(1), reference: "DD-RENT-001" },
  { id: "bt03", workspace_id: W, account_id: "ba01", date: d(5), description: "Staff Salaries - May", description_ar: "رواتب الموظفين - مايو", debit: 380000, credit: 0, balance: 2463160, category: "salary", reconciled: true, reconciled_date: d(5), reference: "SAL-MAY-2026" },
  { id: "bt04", workspace_id: W, account_id: "ba01", date: d(5), description: "Hassan Barakat - UAE Transfer", description_ar: "حسن بركات - تحويل الإمارات", debit: 0, credit: 65000, balance: 2528160, category: "customer_payment", reconciled: true, reconciled_date: d(5), reference: "TRF-UAE-001" },
  { id: "bt05", workspace_id: W, account_id: "ba01", date: d(10), description: "Fabric Supplier Payment", description_ar: "دفعة مورد الأقمشة", debit: 450000, credit: 0, balance: 2078160, category: "supplier_payment", reconciled: false, reconciled_date: null, reference: "TRF-FAB-001" },
  { id: "bt06", workspace_id: W, account_id: "ba01", date: d(10), description: "Factory Electricity - May", description_ar: "كهرباء المصنع - مايو", debit: 35000, credit: 0, balance: 2043160, category: "utilities", reconciled: false, reconciled_date: null, reference: "DD-ELEC-001" },
  { id: "bt07", workspace_id: W, account_id: "ba01", date: d(15), description: "Tamer Hosny - Deposit", description_ar: "تامر حسني - عربون", debit: 0, credit: 20000, balance: 2063160, category: "customer_payment", reconciled: false, reconciled_date: null, reference: "CASH-001" },
  { id: "bt08", workspace_id: W, account_id: "ba02", date: d(3), description: "Transfer to Savings", description_ar: "تحويل للتوفير", debit: 0, credit: 100000, balance: 1500000, category: "transfer", reconciled: true, reconciled_date: d(3), reference: "TRF-SAV-001" },
];

// ═══════════════════════════════════════════════════════════
// 6. TAX MANAGEMENT
// ═══════════════════════════════════════════════════════════

export interface TaxRecord {
  id: string; workspace_id: string;
  type: "vat" | "income_tax" | "social_insurance" | "stamp_duty";
  period: string; amount: number; status: "filed" | "pending" | "overdue" | "paid";
  due_date: string; filed_date: string | null; paid_date: string | null;
  reference: string;
}

export const FIN_TAX_RECORDS: TaxRecord[] = [
  { id: "tx01", workspace_id: W, type: "vat", period: "2026-05", amount: 85000, status: "paid", due_date: d(15), filed_date: d(10), paid_date: d(10), reference: "VAT-2026-05" },
  { id: "tx02", workspace_id: W, type: "vat", period: "2026-06", amount: 92000, status: "pending", due_date: d(15), filed_date: null, paid_date: null, reference: "VAT-2026-06" },
  { id: "tx03", workspace_id: W, type: "income_tax", period: "2026-Q1", amount: 180000, status: "paid", due_date: d(30), filed_date: d(25), paid_date: d(25), reference: "IT-2026-Q1" },
  { id: "tx04", workspace_id: W, type: "social_insurance", period: "2026-05", amount: 42000, status: "paid", due_date: d(15), filed_date: d(12), paid_date: d(12), reference: "SI-2026-05" },
  { id: "tx05", workspace_id: W, type: "social_insurance", period: "2026-06", amount: 42000, status: "pending", due_date: d(15), filed_date: null, paid_date: null, reference: "SI-2026-06" },
  { id: "tx06", workspace_id: W, type: "stamp_duty", period: "2026-Q2", amount: 8500, status: "filed", due_date: d(0), filed_date: d(0), paid_date: null, reference: "SD-2026-Q2" },
];

// ═══════════════════════════════════════════════════════════
// 7. ACCOUNTS RECEIVABLE & PAYABLE
// ═══════════════════════════════════════════════════════════

export interface AccountsReceivable {
  id: string; workspace_id: string;
  customer_name: string; customer_name_ar: string;
  invoice_number: string; total: number; paid: number; balance: number;
  due_date: string; days_overdue: number;
  status: "current" | "overdue_30" | "overdue_60" | "overdue_90";
  last_payment_date: string | null;
  aging_bucket: string;
}

export const FIN_ACCOUNTS_RECEIVABLE: AccountsReceivable[] = [
  { id: "ar01", workspace_id: W, customer_name: "Sara Mahmoud", customer_name_ar: "سارة محمود", invoice_number: "INV-2026-003", total: 25650, paid: 0, balance: 25650, due_date: d(-30), days_overdue: 30, status: "overdue_30", last_payment_date: null, aging_bucket: "31-60 days" },
  { id: "ar02", workspace_id: W, customer_name: "Rania Mostafa", customer_name_ar: "رانيا مصطفى", invoice_number: "INV-2026-006", total: 14364, paid: 0, balance: 14364, due_date: d(-15), days_overdue: 15, status: "current", last_payment_date: null, aging_bucket: "1-30 days" },
  { id: "ar03", workspace_id: W, customer_name: "Tamer Hosny", customer_name_ar: "تامر حسني", invoice_number: "INV-2026-005", total: 46740, paid: 20000, balance: 26740, due_date: d(-10), days_overdue: 10, status: "current", last_payment_date: d(15), aging_bucket: "1-30 days" },
  { id: "ar04", workspace_id: W, customer_name: "Layla Hassan", customer_name_ar: "ليلى حسن", invoice_number: "INV-2026-004", total: 9304, paid: 0, balance: 9304, due_date: d(15), days_overdue: 0, status: "current", last_payment_date: null, aging_bucket: "Current" },
  { id: "ar05", workspace_id: W, customer_name: "Yasmin Adel", customer_name_ar: "ياسمين عادل", invoice_number: "INV-2026-007", total: 25220, paid: 0, balance: 25220, due_date: d(27), days_overdue: 0, status: "current", last_payment_date: null, aging_bucket: "Current" },
];

// ═══════════════════════════════════════════════════════════
// 8. FINANCIAL METRICS
// ═══════════════════════════════════════════════════════════

export interface FinanceMetrics {
  total_revenue: number; total_expenses: number; net_profit: number;
  gross_margin: number; net_margin: number;
  accounts_receivable: number; accounts_payable: number;
  cash_balance: number; bank_balance: number;
  overdue_invoices: number; overdue_amount: number;
  avg_collection_days: number; dso: number;
  monthly_revenue_trend: { month: string; revenue: number; expenses: number }[];
  revenue_by_category: { category: string; category_ar: string; amount: number }[];
  expense_by_category: { category: string; category_ar: string; amount: number }[];
}

export const FIN_METRICS: FinanceMetrics = {
  total_revenue: 2995000, total_expenses: 2768500, net_profit: 226500,
  gross_margin: 42, net_margin: 7.6,
  accounts_receivable: 101278, accounts_payable: 200000,
  cash_balance: 3395000, bank_balance: 4395000,
  overdue_invoices: 2, overdue_amount: 40014,
  avg_collection_days: 28, dso: 32,
  monthly_revenue_trend: [
    { month: "Jan", revenue: 420000, expenses: 380000 },
    { month: "Feb", revenue: 380000, expenses: 360000 },
    { month: "Mar", revenue: 520000, expenses: 420000 },
    { month: "Apr", revenue: 480000, expenses: 400000 },
    { month: "May", revenue: 610000, expenses: 480000 },
    { month: "Jun", revenue: 585000, expenses: 520000 },
  ],
  revenue_by_category: [
    { category: "Retail", category_ar: "التجزئة", amount: 850000 },
    { category: "Wholesale", category_ar: "الجملة", amount: 1450000 },
    { category: "Online", category_ar: "أونلاين", amount: 320000 },
    { category: "Custom", category_ar: "مخصص", amount: 280000 },
    { category: "Services", category_ar: "خدمات", amount: 95000 },
  ],
  expense_by_category: [
    { category: "Salaries", category_ar: "الرواتب", amount: 1140000 },
    { category: "Rent", category_ar: "الإيجار", amount: 615000 },
    { category: "Supplies", category_ar: "المستلزمات", amount: 450000 },
    { category: "Technology", category_ar: "التكنولوجيا", amount: 180000 },
    { category: "Marketing", category_ar: "التسويق", amount: 75000 },
    { category: "Other", category_ar: "أخرى", amount: 308500 },
  ],
};
