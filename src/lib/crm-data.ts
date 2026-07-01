/**
 * CRM Demo Data — بيانات CRM تجريبية
 *
 * Realistic Egyptian fashion business CRM data:
 * 20 customers, leads, timeline events, tasks, loyalty, alerts
 */

const W = "demo";
const now = new Date().toISOString();
const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
const ts = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString();
const dt = (hoursAgo: number) => new Date(Date.now() - hoursAgo * 3600000).toISOString();

// ─── CRM Customer ─────────────────────────────────────────

export interface CRMCustomer {
  id: string;
  workspace_id: string;
  name: string;
  name_ar: string;
  phone: string;
  email: string;
  city: string;
  country: string;
  vip_level: "none" | "silver" | "gold" | "platinum";
  loyalty_points: number;
  lifetime_points: number;
  total_orders: number;
  total_spend: number;
  average_order: number;
  last_order_date: string | null;
  last_activity: string;
  created_at: string;
  tags: string[];
  source: "shopify" | "pos" | "website" | "referral" | "manual";
  assigned_to: string;
  assigned_to_id: string;
  churn_risk: "low" | "medium" | "high";
  likelihood_to_buy: number;
  avatar_color: string;
  notes_count: number;
  open_invoices: number;
  open_quotations: number;
  communication_preference: "whatsapp" | "email" | "phone" | "sms";
  status: "active" | "inactive" | "new";
}

export const CRM_CUSTOMERS: CRMCustomer[] = [
  { id: "c01", workspace_id: W, name: "Nora Al-Farsi", name_ar: "نورة الفارسي", phone: "+20-100-123-4567", email: "nora.alfarsi@gmail.com", city: "Cairo", country: "Egypt", vip_level: "platinum", loyalty_points: 12500, lifetime_points: 18000, total_orders: 28, total_spend: 185000, average_order: 6607, last_order_date: d(3), last_activity: dt(2), created_at: d(730), tags: ["VIP", "Bridal", "Regular"], source: "referral", assigned_to: "Ahmed", assigned_to_id: "e01", churn_risk: "low", likelihood_to_buy: 92, avatar_color: "#8C6FAE", notes_count: 12, open_invoices: 0, open_quotations: 1, communication_preference: "whatsapp", status: "active" },
  { id: "c02", workspace_id: W, name: "Layla Hassan", name_ar: "ليلى حسن", phone: "+20-111-234-5678", email: "layla.h@outlook.com", city: "Giza", country: "Egypt", vip_level: "gold", loyalty_points: 8200, lifetime_points: 11000, total_orders: 19, total_spend: 124000, average_order: 6526, last_order_date: d(12), last_activity: d(1), created_at: d(540), tags: ["VIP", "Evening Wear"], source: "shopify", assigned_to: "Ahmed", assigned_to_id: "e01", churn_risk: "low", likelihood_to_buy: 78, avatar_color: "#E07A5F", notes_count: 8, open_invoices: 1, open_quotations: 0, communication_preference: "whatsapp", status: "active" },
  { id: "c03", workspace_id: W, name: "Sara Mahmoud", name_ar: "سارة محمود", phone: "+20-122-345-6789", email: "sara.m@company.eg", city: "Alexandria", country: "Egypt", vip_level: "gold", loyalty_points: 6700, lifetime_points: 9200, total_orders: 14, total_spend: 98000, average_order: 7000, last_order_date: d(25), last_activity: d(3), created_at: d(450), tags: ["Corporate", "Bulk"], source: "pos", assigned_to: "Sara", assigned_to_id: "e02", churn_risk: "medium", likelihood_to_buy: 55, avatar_color: "#3B82F6", notes_count: 5, open_invoices: 2, open_quotations: 1, communication_preference: "email", status: "active" },
  { id: "c04", workspace_id: W, name: "Khalid Al-Mansouri", name_ar: "خالد المنصوري", phone: "+20-133-456-7890", email: "khalid.m@corp.sa", city: "Riyadh", country: "Saudi Arabia", vip_level: "platinum", loyalty_points: 15200, lifetime_points: 22000, total_orders: 35, total_spend: 320000, average_order: 9143, last_order_date: d(5), last_activity: dt(6), created_at: d(900), tags: ["VIP", "International", "Corporate"], source: "referral", assigned_to: "Ahmed", assigned_to_id: "e01", churn_risk: "low", likelihood_to_buy: 95, avatar_color: "#10B981", notes_count: 18, open_invoices: 0, open_quotations: 2, communication_preference: "whatsapp", status: "active" },
  { id: "c05", workspace_id: W, name: "Fatima Al-Zahra", name_ar: "فاطمة الزهراء", phone: "+20-144-567-8901", email: "fatima.z@yahoo.com", city: "Cairo", country: "Egypt", vip_level: "silver", loyalty_points: 3200, lifetime_points: 4500, total_orders: 7, total_spend: 42000, average_order: 6000, last_order_date: d(45), last_activity: d(15), created_at: d(365), tags: ["Bridal"], source: "pos", assigned_to: "Sara", assigned_to_id: "e02", churn_risk: "high", likelihood_to_buy: 25, avatar_color: "#F59E0B", notes_count: 3, open_invoices: 0, open_quotations: 0, communication_preference: "phone", status: "inactive" },
  { id: "c06", workspace_id: W, name: "Ahmed Khalil", name_ar: "أحمد خليل", phone: "+20-155-678-9012", email: "ahmed.k@factory.com", city: "6th October", country: "Egypt", vip_level: "none", loyalty_points: 1800, lifetime_points: 2400, total_orders: 4, total_spend: 18000, average_order: 4500, last_order_date: d(60), last_activity: d(30), created_at: d(200), tags: ["New"], source: "website", assigned_to: "Mohamed", assigned_to_id: "e03", churn_risk: "medium", likelihood_to_buy: 40, avatar_color: "#6366F1", notes_count: 2, open_invoices: 1, open_quotations: 0, communication_preference: "email", status: "active" },
  { id: "c07", workspace_id: W, name: "Mona Saad", name_ar: "منى سعد", phone: "+20-166-789-0123", email: "mona.saad@hotmail.com", city: "Mansoura", country: "Egypt", vip_level: "gold", loyalty_points: 7100, lifetime_points: 9800, total_orders: 16, total_spend: 112000, average_order: 7000, last_order_date: d(8), last_activity: d(2), created_at: d(600), tags: ["VIP", "Loyal"], source: "referral", assigned_to: "Sara", assigned_to_id: "e02", churn_risk: "low", likelihood_to_buy: 85, avatar_color: "#EC4899", notes_count: 10, open_invoices: 0, open_quotations: 0, communication_preference: "whatsapp", status: "active" },
  { id: "c08", workspace_id: W, name: "Youssef Ali", name_ar: "يوسف علي", phone: "+20-177-890-1234", email: "youssef.ali@gmail.com", city: "Tanta", country: "Egypt", vip_level: "none", loyalty_points: 900, lifetime_points: 1200, total_orders: 2, total_spend: 8500, average_order: 4250, last_order_date: d(90), last_activity: d(60), created_at: d(150), tags: ["Inactive"], source: "pos", assigned_to: "Mohamed", assigned_to_id: "e03", churn_risk: "high", likelihood_to_buy: 10, avatar_color: "#64748B", notes_count: 1, open_invoices: 0, open_quotations: 0, communication_preference: "phone", status: "inactive" },
  { id: "c09", workspace_id: W, name: "Heba Nabil", name_ar: "هبة نبيل", phone: "+20-188-901-2345", email: "heba.n@design.co", city: "Cairo", country: "Egypt", vip_level: "silver", loyalty_points: 4500, lifetime_points: 6200, total_orders: 9, total_spend: 58000, average_order: 6444, last_order_date: d(18), last_activity: d(5), created_at: d(300), tags: ["Designer", "Regular"], source: "website", assigned_to: "Ahmed", assigned_to_id: "e01", churn_risk: "low", likelihood_to_buy: 72, avatar_color: "#06B6D4", notes_count: 6, open_invoices: 0, open_quotations: 1, communication_preference: "email", status: "active" },
  { id: "c10", workspace_id: W, name: "Omar Salah", name_ar: "عمر صلاح", phone: "+20-199-012-3456", email: "omar.s@retail.eg", city: "Luxor", country: "Egypt", vip_level: "none", loyalty_points: 2100, lifetime_points: 3000, total_orders: 5, total_spend: 28000, average_order: 5600, last_order_date: d(35), last_activity: d(10), created_at: d(180), tags: ["Tourism"], source: "shopify", assigned_to: "Sara", assigned_to_id: "e02", churn_risk: "medium", likelihood_to_buy: 45, avatar_color: "#F97316", notes_count: 2, open_invoices: 0, open_quotations: 0, communication_preference: "whatsapp", status: "active" },
  { id: "c11", workspace_id: W, name: "Dina Ragab", name_ar: "دينا رجب", phone: "+20-110-111-2222", email: "dina.r@fashion.eg", city: "Giza", country: "Egypt", vip_level: "platinum", loyalty_points: 14000, lifetime_points: 20000, total_orders: 32, total_spend: 280000, average_order: 8750, last_order_date: d(2), last_activity: dt(1), created_at: d(1100), tags: ["VIP", "Loyal", "Bridal"], source: "referral", assigned_to: "Ahmed", assigned_to_id: "e01", churn_risk: "low", likelihood_to_buy: 98, avatar_color: "#A855F7", notes_count: 22, open_invoices: 0, open_quotations: 0, communication_preference: "whatsapp", status: "active" },
  { id: "c12", workspace_id: W, name: "Tamer Hosny", name_ar: "تامر حسني", phone: "+20-120-222-3333", email: "tamer.h@music.com", city: "Cairo", country: "Egypt", vip_level: "platinum", loyalty_points: 18000, lifetime_points: 28000, total_orders: 42, total_spend: 450000, average_order: 10714, last_order_date: d(1), last_activity: dt(3), created_at: d(1400), tags: ["VIP", "Celebrity", "Corporate"], source: "manual", assigned_to: "Ahmed", assigned_to_id: "e01", churn_risk: "low", likelihood_to_buy: 99, avatar_color: "#DC2626", notes_count: 30, open_invoices: 0, open_quotations: 3, communication_preference: "whatsapp", status: "active" },
  { id: "c13", workspace_id: W, name: "Amira Khaled", name_ar: "أميرة خالد", phone: "+20-130-333-4444", email: "amira.k@school.edu", city: "Ismailia", country: "Egypt", vip_level: "none", loyalty_points: 600, lifetime_points: 800, total_orders: 1, total_spend: 3500, average_order: 3500, last_order_date: d(120), last_activity: d(120), created_at: d(120), tags: ["New"], source: "pos", assigned_to: "Sara", assigned_to_id: "e02", churn_risk: "high", likelihood_to_buy: 5, avatar_color: "#0EA5E9", notes_count: 0, open_invoices: 0, open_quotations: 0, communication_preference: "sms", status: "inactive" },
  { id: "c14", workspace_id: W, name: "Rania Mostafa", name_ar: "رانيا مصطفى", phone: "+20-140-444-5555", email: "rania.m@law.eg", city: "Cairo", country: "Egypt", vip_level: "gold", loyalty_points: 5800, lifetime_points: 8000, total_orders: 11, total_spend: 78000, average_order: 7091, last_order_date: d(20), last_activity: d(4), created_at: d(400), tags: ["Professional", "Evening Wear"], source: "website", assigned_to: "Mohamed", assigned_to_id: "e03", churn_risk: "low", likelihood_to_buy: 68, avatar_color: "#8B5CF6", notes_count: 7, open_invoices: 1, open_quotations: 0, communication_preference: "email", status: "active" },
  { id: "c15", workspace_id: W, name: "Hassan Barakat", name_ar: "حسن بركات", phone: "+20-150-555-6666", email: "hassan.b@import.com", city: "Dubai", country: "UAE", vip_level: "gold", loyalty_points: 9500, lifetime_points: 13000, total_orders: 22, total_spend: 195000, average_order: 8864, last_order_date: d(10), last_activity: d(2), created_at: d(500), tags: ["International", "Wholesale"], source: "referral", assigned_to: "Ahmed", assigned_to_id: "e01", churn_risk: "low", likelihood_to_buy: 82, avatar_color: "#059669", notes_count: 14, open_invoices: 0, open_quotations: 1, communication_preference: "email", status: "active" },
  { id: "c16", workspace_id: W, name: "Salma Farouk", name_ar: "سلمى فاروق", phone: "+20-160-666-7777", email: "salma.f@beauty.eg", city: "Alexandria", country: "Egypt", vip_level: "silver", loyalty_points: 3800, lifetime_points: 5200, total_orders: 8, total_spend: 52000, average_order: 6500, last_order_date: d(15), last_activity: d(3), created_at: d(280), tags: ["Beauty", "Regular"], source: "shopify", assigned_to: "Sara", assigned_to_id: "e02", churn_risk: "medium", likelihood_to_buy: 58, avatar_color: "#F472B6", notes_count: 4, open_invoices: 0, open_quotations: 0, communication_preference: "whatsapp", status: "active" },
  { id: "c17", workspace_id: W, name: "Mohamed Gamal", name_ar: "محمد جمال", phone: "+20-170-777-8888", email: "mo.gamal@tech.io", city: "Cairo", country: "Egypt", vip_level: "none", loyalty_points: 1200, lifetime_points: 1600, total_orders: 3, total_spend: 15000, average_order: 5000, last_order_date: d(75), last_activity: d(40), created_at: d(100), tags: ["New"], source: "website", assigned_to: "Mohamed", assigned_to_id: "e03", churn_risk: "medium", likelihood_to_buy: 35, avatar_color: "#14B8A6", notes_count: 1, open_invoices: 0, open_quotations: 0, communication_preference: "email", status: "active" },
  { id: "c18", workspace_id: W, name: "Nadia Sherif", name_ar: "نادية شريف", phone: "+20-180-888-9999", email: "nadia.s@media.tv", city: "Cairo", country: "Egypt", vip_level: "platinum", loyalty_points: 11000, lifetime_points: 16000, total_orders: 25, total_spend: 210000, average_order: 8400, last_order_date: d(7), last_activity: d(1), created_at: d(800), tags: ["VIP", "Celebrity", "Bridal"], source: "referral", assigned_to: "Ahmed", assigned_to_id: "e01", churn_risk: "low", likelihood_to_buy: 90, avatar_color: "#D946EF", notes_count: 16, open_invoices: 0, open_quotations: 0, communication_preference: "whatsapp", status: "active" },
  { id: "c19", workspace_id: W, name: "Walid Nasser", name_ar: "وليد ناصر", phone: "+20-190-999-0000", email: "walid.n@supply.eg", city: "Mansoura", country: "Egypt", vip_level: "silver", loyalty_points: 2800, lifetime_points: 3800, total_orders: 6, total_spend: 38000, average_order: 6333, last_order_date: d(28), last_activity: d(8), created_at: d(250), tags: ["Supplier"], source: "pos", assigned_to: "Mohamed", assigned_to_id: "e03", churn_risk: "medium", likelihood_to_buy: 50, avatar_color: "#78716C", notes_count: 3, open_invoices: 1, open_quotations: 0, communication_preference: "phone", status: "active" },
  { id: "c20", workspace_id: W, name: "Yasmin Adel", name_ar: "ياسمين عادل", phone: "+20-105-000-1111", email: "yasmin.a@wedding.com", city: "Giza", country: "Egypt", vip_level: "gold", loyalty_points: 6200, lifetime_points: 8500, total_orders: 13, total_spend: 88000, average_order: 6769, last_order_date: d(14), last_activity: d(6), created_at: d(350), tags: ["Bridal", "VIP"], source: "referral", assigned_to: "Sara", assigned_to_id: "e02", churn_risk: "low", likelihood_to_buy: 75, avatar_color: "#BE185D", notes_count: 9, open_invoices: 0, open_quotations: 2, communication_preference: "whatsapp", status: "active" },
];

// ─── CRM Tasks ────────────────────────────────────────────

export interface CRMTask {
  id: string;
  workspace_id: string;
  customer_id: string;
  customer_name: string;
  title: string;
  title_ar: string;
  type: "call" | "email" | "whatsapp" | "meeting" | "follow_up" | "quotation" | "delivery" | "payment";
  status: "pending" | "in_progress" | "completed" | "overdue";
  priority: "low" | "medium" | "high" | "urgent";
  due_date: string;
  assigned_to: string;
  created_at: string;
  completed_at: string | null;
}

export const CRM_TASKS: CRMTask[] = [
  { id: "t01", workspace_id: W, customer_id: "c01", customer_name: "Nora Al-Farsi", title: "Confirm bridal fitting appointment", title_ar: "تأكيد موعد قياس الفستان", type: "follow_up", status: "pending", priority: "high", due_date: d(0), assigned_to: "Ahmed", created_at: d(1), completed_at: null },
  { id: "t02", workspace_id: W, customer_id: "c03", customer_name: "Sara Mahmoud", title: "Send corporate order quotation", title_ar: "إرسال عرض أسعر طلب الشركات", type: "quotation", status: "pending", priority: "high", due_date: d(0), assigned_to: "Sara", created_at: d(2), completed_at: null },
  { id: "t03", workspace_id: W, customer_id: "c05", customer_name: "Fatima Al-Zahra", title: "Follow up on delivery complaint", title_ar: "متابعة شكوى التوصيل", type: "call", status: "overdue", priority: "urgent", due_date: d(-2), assigned_to: "Sara", created_at: d(5), completed_at: null },
  { id: "t04", workspace_id: W, customer_id: "c02", customer_name: "Layla Hassan", title: "Send overdue invoice reminder", title_ar: "إرسال تذكير فاتورة متأخرة", type: "email", status: "pending", priority: "high", due_date: d(0), assigned_to: "Ahmed", created_at: d(3), completed_at: null },
  { id: "t05", workspace_id: W, customer_id: "c09", customer_name: "Heba Nabil", title: "Schedule design consultation", title_ar: "جدولة استشارة تصميم", type: "meeting", status: "pending", priority: "medium", due_date: d(1), assigned_to: "Ahmed", created_at: d(2), completed_at: null },
  { id: "t06", workspace_id: W, customer_id: "c14", customer_name: "Rania Mostafa", title: "Collect overdue payment", title_ar: "تحصيل دفعة متأخرة", type: "payment", status: "overdue", priority: "urgent", due_date: d(-3), assigned_to: "Mohamed", created_at: d(7), completed_at: null },
  { id: "t07", workspace_id: W, customer_id: "c12", customer_name: "Tamer Hosny", title: "Send new collection lookbook", title_ar: "إرسال كتالوج المجموعة الجديدة", type: "whatsapp", status: "pending", priority: "medium", due_date: d(0), assigned_to: "Ahmed", created_at: d(1), completed_at: null },
  { id: "t08", workspace_id: W, customer_id: "c04", customer_name: "Khalid Al-Mansouri", title: "Confirm bulk order delivery date", title_ar: "تأكيد تاريخ توصيل الطلب بالجملة", type: "call", status: "pending", priority: "high", due_date: d(0), assigned_to: "Ahmed", created_at: d(1), completed_at: null },
  { id: "t09", workspace_id: W, customer_id: "c06", customer_name: "Ahmed Khalil", title: "Welcome call for new customer", title_ar: "مكالمة ترحيب بعميل جديد", type: "call", status: "completed", priority: "medium", due_date: d(-1), assigned_to: "Mohamed", created_at: d(5), completed_at: d(-1) },
  { id: "t10", workspace_id: W, customer_id: "c20", customer_name: "Yasmin Adel", title: "Send bridal package quotation", title_ar: "إرسال عرض أسعر باقة العروس", type: "quotation", status: "pending", priority: "high", due_date: d(0), assigned_to: "Sara", created_at: d(2), completed_at: null },
];

// ─── CRM Timeline Events ──────────────────────────────────

export interface TimelineEvent {
  id: string;
  workspace_id: string;
  customer_id: string;
  type: "order" | "pos_order" | "invoice" | "payment" | "quotation" | "whatsapp" | "email" | "call" | "note" | "loyalty_points" | "loyalty_redeem" | "delivery" | "return" | "shopify_order" | "follow_up";
  title: string;
  title_ar: string;
  amount: number | null;
  currency: string;
  staff: string;
  timestamp: string;
  details: string;
  details_ar: string;
  finance_payment_id: string | null;
  finance_invoice_id: string | null;
}

export const CRM_TIMELINE: TimelineEvent[] = [
  { id: "ev01", workspace_id: W, customer_id: "c01", type: "order", title: "Bridal package order confirmed", title_ar: "تأكيد طلب باقة العروس", amount: 12000, currency: "EGP", staff: "Ahmed", timestamp: dt(2), details: "Full bridal package: dress + veil + accessories", details_ar: "باقة العروس الكاملة: فستان + حجاب + إكسسوارات", finance_payment_id: null, finance_invoice_id: "fi01" },
  { id: "ev02", workspace_id: W, customer_id: "c01", type: "whatsapp", title: "Sent fitting reminder via WhatsApp", title_ar: "إرسال تذكير القياس عبر واتساب", amount: null, currency: "EGP", staff: "Ahmed", timestamp: dt(5), details: "Reminded about Saturday fitting appointment", details_ar: "تذكير بموعد القياس يوم السبت", finance_payment_id: null, finance_invoice_id: null },
  { id: "ev03", workspace_id: W, customer_id: "c01", type: "payment", title: "Payment received - 6000 EGP", title_ar: "استلام دفعة - ٦٠٠٠ ج.م", amount: 6000, currency: "EGP", staff: "Ahmed", timestamp: dt(8), details: "Bank transfer - first installment", details_ar: "تحويل بنكي - القسط الأول", finance_payment_id: "fp01", finance_invoice_id: "fi01" },
  { id: "ev04", workspace_id: W, customer_id: "c01", type: "quotation", title: "Bridal package quotation sent", title_ar: "إرسال عرض أسعر باقة العروس", amount: 12000, currency: "EGP", staff: "Ahmed", timestamp: d(5), details: "Quotation #QT-045 sent via email", details_ar: "عرض الأسعار #QT-045 أُرسل عبر البريد", finance_payment_id: null, finance_invoice_id: null },
  { id: "ev05", workspace_id: W, customer_id: "c01", type: "loyalty_points", title: "Earned 1200 loyalty points", title_ar: "كسب ١٢٠٠ نقطة ولاء", amount: null, currency: "EGP", staff: "System", timestamp: d(5), details: "Points earned from quotation conversion", details_ar: "نقاط مكتسبة من تحويل عرض الأسعار", finance_payment_id: null, finance_invoice_id: null },
  { id: "ev06", workspace_id: W, customer_id: "c02", type: "shopify_order", title: "Shopify order #SH-7892 synced", title_ar: "مزامنة طلب شوبيفاي #SH-7892", amount: 4500, currency: "EGP", staff: "System", timestamp: d(1), details: "2 evening dresses ordered online", details_ar: "طلب فستانين سهرة عبر الإنترنت", finance_payment_id: "fp06", finance_invoice_id: "fi04" },
  { id: "ev07", workspace_id: W, customer_id: "c02", type: "delivery", title: "Delivery completed", title_ar: "تم التوصيل", amount: null, currency: "EGP", staff: "Omar", timestamp: d(2), details: "Delivered to Giza address - customer confirmed", details_ar: "تم التوصيل إلى عنوان الجيزة - تأكيد العميل", finance_payment_id: null, finance_invoice_id: null },
  { id: "ev08", workspace_id: W, customer_id: "c03", type: "invoice", title: "Corporate invoice created - 28000 EGP", title_ar: "إنشاء فاتورة شركات - ٢٨٠٠٠ ج.م", amount: 28000, currency: "EGP", staff: "Sara", timestamp: d(3), details: "Bulk uniform order for 50 employees", details_ar: "طلب أزياء موحدة لـ ٥٠ موظف", finance_payment_id: null, finance_invoice_id: "fi03" },
  { id: "ev09", workspace_id: W, customer_id: "c03", type: "call", title: "Call with procurement manager", title_ar: "مكالمة مع مدير المشتريات", amount: null, currency: "EGP", staff: "Sara", timestamp: d(5), details: "Discussed fabric options and delivery timeline", details_ar: "نقاش خيارات القماش وجدول التوصيل", finance_payment_id: null, finance_invoice_id: null },
  { id: "ev10", workspace_id: W, customer_id: "c04", type: "order", title: "International wholesale order - 85000 EGP", title_ar: "طلب بالجملة الدولي - ٨٥٠٠٠ ج.م", amount: 85000, currency: "EGP", staff: "Ahmed", timestamp: dt(6), details: "100 abayas + 50 kaftans for Saudi market", details_ar: "١٠٠ عباءة + ٥٠ قفطان للسوق السعودي", finance_payment_id: null, finance_invoice_id: "fi02" },
  { id: "ev11", workspace_id: W, customer_id: "c04", type: "email", title: "Customs documentation sent", title_ar: "إرسال مستندات الجمارك", amount: null, currency: "EGP", staff: "Ahmed", timestamp: d(2), details: "Export documents for Saudi customs clearance", details_ar: "مستندات التصدير لتخليص الجمارك السعودية", finance_payment_id: null, finance_invoice_id: null },
  { id: "ev12", workspace_id: W, customer_id: "c05", type: "note", title: "Customer complained about 3-day delivery delay", title_ar: "شكوى العميل من تأخر ٣ أيام في التوصيل", amount: null, currency: "EGP", staff: "Sara", timestamp: d(7), details: "Bridal fitting was delayed due to fabric shortage", details_ar: "تأخر قياس العروس بسبب نقص القماش", finance_payment_id: null, finance_invoice_id: null },
  { id: "ev13", workspace_id: W, customer_id: "c06", type: "pos_order", title: "POS purchase - 4500 EGP", title_ar: "شراء نقطة بيع - ٤٥٠٠ ج.م", amount: 4500, currency: "EGP", staff: "Fatima", timestamp: d(60), details: "Bought 2 abayas from showroom", details_ar: "شراء عباءتين من المعرض", finance_payment_id: null, finance_invoice_id: null },
  { id: "ev14", workspace_id: W, customer_id: "c07", type: "loyalty_points", title: "Redeemed 500 points for discount", title_ar: "استبدال ٥٠٠ نقطة بخصم", amount: null, currency: "EGP", staff: "System", timestamp: d(10), details: "Customer redeemed 500 points = 50 EGP discount", details_ar: "العميل استبدل ٥٠٠ نقطة = خصم ٥٠ ج.م", finance_payment_id: null, finance_invoice_id: null },
  { id: "ev15", workspace_id: W, customer_id: "c12", type: "order", title: "Celebrity collection order - 45000 EGP", title_ar: "طلب مجموعة المشاهير - ٤٥٠٠٠ ج.م", amount: 45000, currency: "EGP", staff: "Ahmed", timestamp: d(1), details: "Custom evening wear for TV appearance", details_ar: "ملابس سهرة مخصصة لظهور تلفزيوني", finance_payment_id: "fp04", finance_invoice_id: "fi05" },
  { id: "ev16", workspace_id: W, customer_id: "c12", type: "whatsapp", title: "Sent fabric samples via WhatsApp", title_ar: "إرسال عينات أقمشة عبر واتساب", amount: null, currency: "EGP", staff: "Ahmed", timestamp: d(3), details: "Shared 5 fabric options for review", details_ar: "مشاركة ٥ خيارات أقمشة للمراجعة", finance_payment_id: null, finance_invoice_id: null },
  { id: "ev17", workspace_id: W, customer_id: "c11", type: "order", title: "Bridal collection reorder - 18000 EGP", title_ar: "إعادة طلب مجموعة العروس - ١٨٠٠٠ ج.م", amount: 18000, currency: "EGP", staff: "Ahmed", timestamp: dt(1), details: "Reorder of best-selling bridal pieces", details_ar: "إعادة طلب قطع العروس الأكثر مبيعاً", finance_payment_id: null, finance_invoice_id: null },
  { id: "ev18", workspace_id: W, customer_id: "c14", type: "payment", title: "Overdue payment reminder sent", title_ar: "إرسال تذكير دفعة متأخرة", amount: 12000, currency: "EGP", staff: "Mohamed", timestamp: d(4), details: "Invoice #INV-089 is 15 days overdue", details_ar: "الفاتورة #INV-089 متأخرة ١٥ يوم", finance_payment_id: null, finance_invoice_id: "fi06" },
  { id: "ev19", workspace_id: W, customer_id: "c18", type: "shopify_order", title: "Shopify order #SH-8234 synced", title_ar: "مزامنة طلب شوبيفاي #SH-8234", amount: 7200, currency: "EGP", staff: "System", timestamp: d(1), details: "3 luxury scarves ordered online", details_ar: "طلب ٣ وشاح فاخر عبر الإنترنت", finance_payment_id: null, finance_invoice_id: null },
  { id: "ev20", workspace_id: W, customer_id: "c20", type: "quotation", title: "Bridal package quotation sent", title_ar: "إرسال عرض أسعار باقة العروس", amount: 22000, currency: "EGP", staff: "Sara", timestamp: d(3), details: "Premium bridal: dress + accessories + makeup coordination", details_ar: "عروس فاخرة: فستان + إكسسوارات + تنسيق مكياج", finance_payment_id: null, finance_invoice_id: null },
];

// ─── CRM Leads (Pipeline) ─────────────────────────────────

export interface CRMLead {
  id: string;
  workspace_id: string;
  customer_id: string;
  customer_name: string;
  customer_name_ar: string;
  title: string;
  title_ar: string;
  stage: "new" | "qualified" | "meeting" | "quotation" | "negotiation" | "won" | "lost";
  value: number;
  currency: string;
  source: string;
  assigned_to: string;
  assigned_to_id: string;
  probability: number;
  next_followup: string;
  last_activity: string;
  tags: string[];
  created_at: string;
}

export const CRM_LEADS: CRMLead[] = [
  { id: "l01", workspace_id: W, customer_id: "c09", customer_name: "Heba Nabil", customer_name_ar: "هبة نبيل", title: "Custom evening wear collection", title_ar: "مجموعة ملابس سهرة مخصصة", stage: "quotation", value: 35000, currency: "EGP", source: "Website", assigned_to: "Ahmed", assigned_to_id: "e01", probability: 65, next_followup: d(0), last_activity: d(2), tags: ["Evening Wear", "Custom"], created_at: d(10) },
  { id: "l02", workspace_id: W, customer_id: "c06", customer_name: "Ahmed Khalil", customer_name_ar: "أحمد خليل", title: "Corporate uniform order", title_ar: "طلب أزياء موحدة للشركات", stage: "qualified", value: 45000, currency: "EGP", source: "Referral", assigned_to: "Mohamed", assigned_to_id: "e03", probability: 40, next_followup: d(1), last_activity: d(5), tags: ["Corporate", "Uniforms"], created_at: d(15) },
  { id: "l03", workspace_id: W, customer_id: "c10", customer_name: "Omar Salah", customer_name_ar: "عمر صلاح", title: "Tourist retail collection", title_ar: "مجموعة تجزئة سياحية", stage: "meeting", value: 15000, currency: "EGP", source: "Shopify", assigned_to: "Sara", assigned_to_id: "e02", probability: 50, next_followup: d(2), last_activity: d(3), tags: ["Tourism", "Retail"], created_at: d(8) },
  { id: "l04", workspace_id: W, customer_id: "c05", customer_name: "Fatima Al-Zahra", customer_name_ar: "فاطمة الزهراء", title: "Wedding dress consultation", title_ar: "استشارة فستان الزفاف", stage: "new", value: 25000, currency: "EGP", source: "POS", assigned_to: "Sara", assigned_to_id: "e02", probability: 20, next_followup: d(0), last_activity: d(7), tags: ["Bridal"], created_at: d(7) },
  { id: "l05", workspace_id: W, customer_id: "c17", customer_name: "Mohamed Gamal", customer_name_ar: "محمد جمال", title: "Tech company merchandise order", title_ar: "طلب منتجات شركة تقنية", stage: "negotiation", value: 28000, currency: "EGP", source: "Website", assigned_to: "Mohamed", assigned_to_id: "e03", probability: 75, next_followup: d(0), last_activity: d(1), tags: ["Corporate", "Merch"], created_at: d(20) },
  { id: "l06", workspace_id: W, customer_id: "c13", customer_name: "Amira Khaled", customer_name_ar: "أميرة خالد", title: "School uniform bulk order", title_ar: "طلب بالجملة أزياء مدرسية", stage: "lost", value: 18000, currency: "EGP", source: "Manual", assigned_to: "Sara", assigned_to_id: "e02", probability: 0, next_followup: "", last_activity: d(90), tags: ["School", "Bulk"], created_at: d(100) },
  { id: "l07", workspace_id: W, customer_id: "c00", customer_name: "New Client - Mariam", customer_name_ar: "عميل جديد - مريم", title: "Luxury abaya collection inquiry", title_ar: "استفسار مجموعة عباءات فاخرة", stage: "new", value: 20000, currency: "EGP", source: "Instagram", assigned_to: "Ahmed", assigned_to_id: "e01", probability: 15, next_followup: d(0), last_activity: d(0), tags: ["Luxury", "New"], created_at: d(0) },
  { id: "l08", workspace_id: W, customer_id: "c19", customer_name: "Walid Nasser", customer_name_ar: "وليد ناصر", title: "Fabric supply partnership", title_ar: "شراكة إمداد الأقمشة", stage: "won", value: 120000, currency: "EGP", source: "Referral", assigned_to: "Mohamed", assigned_to_id: "e03", probability: 100, next_followup: "", last_activity: d(10), tags: ["Partnership", "Supply"], created_at: d(30) },
];

// ─── CRM Alerts ───────────────────────────────────────────

export interface CRMAlert {
  id: string;
  workspace_id: string;
  customer_id: string;
  customer_name: string;
  type: "vip_inactive" | "overdue_payment" | "complaint" | "delivery_delayed" | "high_return" | "churn_risk" | "loyalty_reward_ready" | "no_followup" | "duplicate" | "open_quotation_no_followup";
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

export const CRM_ALERTS: CRMAlert[] = [
  { id: "a01", workspace_id: W, customer_id: "c05", customer_name: "Fatima Al-Zahra", type: "vip_inactive", severity: "warning", title: "VIP customer inactive for 45 days", title_ar: "عميل VIP غير نشط منذ ٤٥ يوم", description: "Fatima hasn't ordered or interacted in 45 days", description_ar: "فاطمة لم تطلب أو تتفاعل منذ ٤٥ يوم", suggested_action: "Send personalized WhatsApp message with new collection", suggested_action_ar: "إرسال رسالة واتساب شخصية مع المجموعة الجديدة", dismissed: false, created_at: d(1) },
  { id: "a02", workspace_id: W, customer_id: "c03", customer_name: "Sara Mahmoud", type: "overdue_payment", severity: "critical", title: "2 invoices overdue", title_ar: "فاتورتان متأخرتان", description: "Total overdue: 28000 EGP (15 days)", description_ar: "الإجمالي المتأخر: ٢٨٠٠٠ ج.م (١٥ يوم)", suggested_action: "Call procurement manager to arrange payment", suggested_action_ar: "الاتصال بمدير المشتريات لترتيب الدفع", dismissed: false, created_at: d(0) },
  { id: "a03", workspace_id: W, customer_id: "c05", customer_name: "Fatima Al-Zahra", type: "complaint", severity: "critical", title: "Customer complained about delivery delay", title_ar: "شكوى العميل من تأخر التوصيل", description: "Bridal fitting was delayed 3 days due to fabric shortage", description_ar: "تأخر قياس العروس ٣ أيام بسبب نقص القماش", suggested_action: "Offer complimentary alteration as compensation", suggested_action_ar: "تقديم تعديل مجاني كتعويض", dismissed: false, created_at: d(5) },
  { id: "a04", workspace_id: W, customer_id: "c08", customer_name: "Youssef Ali", type: "churn_risk", severity: "warning", title: "High churn risk - no activity in 60 days", title_ar: "خطر فقدان العميل - لا نشاط منذ ٦٠ يوم", description: "Youssef only placed 2 orders and hasn't returned", description_ar: "يوسف طلب مرتين فقط ولم يعد", suggested_action: "Send exclusive discount offer to re-engage", suggested_action_ar: "إرسال عرض خصم حصري لإعادة التفاعل", dismissed: false, created_at: d(3) },
  { id: "a05", workspace_id: W, customer_id: "c14", customer_name: "Rania Mostafa", type: "overdue_payment", severity: "warning", title: "Payment overdue - 12000 EGP", title_ar: "دفعة متأخرة - ١٢٠٠٠ ج.م", description: "Invoice #INV-089 is 15 days overdue", description_ar: "الفاتورة #INV-089 متأخرة ١٥ يوم", suggested_action: "Send formal payment reminder email", suggested_action_ar: "إرسال بريد إلكتروني رسمي لتذكير بالدفع", dismissed: false, created_at: d(4) },
  { id: "a06", workspace_id: W, customer_id: "c16", customer_name: "Salma Farouk", type: "loyalty_reward_ready", severity: "info", title: "Customer has enough points for reward", title_ar: "العميل لديه نقاط كافية للمكافأة", description: "3800 points available - can redeem up to 380 EGP", description_ar: "٣٨٠٠ نقطة متاحة - يمكن استبدالها حتى ٣٨٠ ج.م", suggested_action: "Notify customer about available rewards", suggested_action_ar: "إبلاغ العميل بالمكافآت المتاحة", dismissed: false, created_at: d(2) },
  { id: "a07", workspace_id: W, customer_id: "c06", customer_name: "Ahmed Khalil", type: "no_followup", severity: "warning", title: "New customer - no follow-up yet", title_ar: "عميل جديد - لا متابعة بعد", description: "Ahmed made his first purchase 60 days ago, no follow-up since", description_ar: "أحمد قام بأول شراء منذ ٦٠ يوم، لا متابعة منذ ذلك", suggested_action: "Schedule welcome call and product recommendations", suggested_action_ar: "جدولة مكالمة ترحيب وتوصيات المنتجات", dismissed: false, created_at: d(1) },
  { id: "a08", workspace_id: W, customer_id: "c01", customer_name: "Nora Al-Farsi", type: "open_quotation_no_followup", severity: "warning", title: "Open quotation - no follow-up in 5 days", title_ar: "عرض سعر مفتوح - لا متابعة منذ ٥ أيام", description: "Quotation #QT-045 sent 5 days ago, customer hasn't responded", description_ar: "عرض الأسعار #QT-045 أُرسل منذ ٥ أيام، العميل لم يرد", suggested_action: "Send follow-up WhatsApp message to check interest", suggested_action_ar: "إرسال رسالة واتساب للمتابعة والتحقق من الاهتمام", dismissed: false, created_at: d(5) },
  { id: "a09", workspace_id: W, customer_id: "c16", customer_name: "Salma Farouk", type: "high_return", severity: "warning", title: "High return rate detected", title_ar: "تم اكتشاف نسبة مرتفعة من المرتجعات", description: "Salma returned 3 items in the last 2 months (37% return rate)", description_ar: "سلمى أعادت ٣ منتجات في آخر شهرين (٣٧٪ نسبة المرتجعات)", suggested_action: "Review return reasons and offer size/style consultation", suggested_action_ar: "مراجعة أسباب المرتجعات وتقديم استشارة المقاسات", dismissed: false, created_at: d(2) },
  { id: "a10", workspace_id: W, customer_id: "c12", customer_name: "Tamer Hosny", type: "duplicate", severity: "info", title: "Possible duplicate customer detected", title_ar: "تم اكتشاف عميل مكرر محتمل", description: "Found similar customer record: 'T. Hosny' with same phone number", description_ar: "تم العثور على سجل عميل مشابه: 'ت. حسني' بنفس رقم الهاتف", suggested_action: "Review and merge duplicate records if confirmed", suggested_action_ar: "مراجعة ودمج السجلات المكررة إذا تم التأكيد", dismissed: false, created_at: d(0) },
];

// ─── CRM Notes ────────────────────────────────────────────

export interface CRMNote {
  id: string;
  workspace_id: string;
  customer_id: string;
  author: string;
  content: string;
  content_ar: string;
  type: "internal" | "customer_facing" | "call_log";
  priority: "low" | "medium" | "high";
  created_at: string;
  mentions: string[];
  attachments: { name: string; type: "image" | "pdf" | "voice" | "document"; url: string; size: string }[];
  follow_up_date: string | null;
  is_completed: boolean;
}

export const CRM_NOTES: CRMNote[] = [
  { id: "n01", workspace_id: W, customer_id: "c01", author: "Ahmed", content: "Nora prefers ivory and champagne colors for bridal. She mentioned wanting a cathedral-length veil.", content_ar: "نورة تفضل ألوان العاج والشمبانيا للعروس. ذكرت إنها عايزة حجاب بطول الكاتدرائية.", type: "customer_facing", priority: "high", created_at: d(5), mentions: ["Sara"], attachments: [{ name: "color_palette.jpg", type: "image", url: "#", size: "2.4 MB" }], follow_up_date: d(-1), is_completed: false },
  { id: "n02", workspace_id: W, customer_id: "c04", author: "Ahmed", content: "Khalid is a repeat wholesale buyer. Always orders in bulk. Prefers black and navy. Ships to Riyadh.", content_ar: "خالد مشتري بالجملة متكرر. دائما يطلب بالجملة. يفضل الأسود والأزرق الداكن. الشحن للرياض.", type: "internal", priority: "medium", created_at: d(2), mentions: [], attachments: [], follow_up_date: null, is_completed: false },
  { id: "n03", workspace_id: W, customer_id: "c05", author: "Sara", content: "Called about delivery delay complaint. Customer is upset but willing to give another chance. Offer free alteration.", content_ar: "اتصلت بشأن شكوى تأخر التوصيل. العميل منزعج لكنه مستعد لإعطاء فرصة أخرى. تعديل مجاني.", type: "call_log", priority: "high", created_at: d(7), mentions: ["Ahmed"], attachments: [{ name: "complaint_call_recording.mp3", type: "voice", url: "#", size: "4.2 MB" }], follow_up_date: d(-2), is_completed: false },
  { id: "n04", workspace_id: W, customer_id: "c12", author: "Ahmed", content: "Tamer needs everything fast. Always calls for updates. VIP treatment essential. Personal shopper assigned.", content_ar: "تامر يحتاج كل شيء بسرعة. دائما يتصل للمتابعة. معاملة VIP ضرورية. تم تعيين مشتري شخصي.", type: "internal", priority: "high", created_at: d(3), mentions: ["Sara", "Mohamed"], attachments: [], follow_up_date: null, is_completed: false },
  { id: "n05", workspace_id: W, customer_id: "c07", author: "Sara", content: "Mona is our most loyal customer in Mansoura. Refers friends regularly. Send her exclusive previews.", content_ar: "منى أكثر عملاء ولاء في المنصورة. ترشد أصدقائها بانتظام. أرسل لها معاينات حصرية.", type: "internal", priority: "medium", created_at: d(10), mentions: [], attachments: [{ name: "referral_list.xlsx", type: "document", url: "#", size: "156 KB" }], follow_up_date: d(2), is_completed: false },
  { id: "n06", workspace_id: W, customer_id: "c20", author: "Sara", content: "Yasmin wants a full bridal package for June wedding. Budget 20-25K. Needs veil, shoes, and accessories.", content_ar: "ياسمين عايزة باقة عروس كاملة لزفاف يونيو. ميزانية ٢٠-٢٥ ألف. تحتاج حجاب وحذاء وإكسسوارات.", type: "customer_facing", priority: "high", created_at: d(3), mentions: ["Ahmed"], attachments: [{ name: "bridal_budget.pdf", type: "pdf", url: "#", size: "890 KB" }], follow_up_date: d(0), is_completed: false },
];

// ─── Loyalty Rewards ──────────────────────────────────────

export interface LoyaltyReward {
  id: string;
  workspace_id: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  points_cost: number;
  discount_amount: number;
  active: boolean;
}

export const LOYALTY_REWARDS: LoyaltyReward[] = [
  { id: "r01", workspace_id: W, name: "50 EGP Discount", name_ar: "خصم ٥٠ ج.م", description: "Get 50 EGP off your next purchase", description_ar: "احصل على خصم ٥٠ ج.م على مشترياتك القادمة", points_cost: 500, discount_amount: 50, active: true },
  { id: "r02", workspace_id: W, name: "100 EGP Discount", name_ar: "خصم ١٠٠ ج.م", description: "Get 100 EGP off your next purchase", description_ar: "احصل على خصم ١٠٠ ج.م على مشترياتك القادمة", points_cost: 1000, discount_amount: 100, active: true },
  { id: "r03", workspace_id: W, name: "Free Styling Session", name_ar: "جلسة تنسيق مجانية", description: "One free personal styling session", description_ar: "جلسة تنسيق شخصي مجاني واحدة", points_cost: 2000, discount_amount: 0, active: true },
  { id: "r04", workspace_id: W, name: "Free Shipping", name_ar: "شحن مجاني", description: "Free delivery on your next order", description_ar: "توصيل مجاني على طلبك القادم", points_cost: 300, discount_amount: 0, active: true },
  { id: "r05", workspace_id: W, name: "250 EGP Discount", name_ar: "خصم ٢٥٠ ج.م", description: "Get 250 EGP off orders over 2000 EGP", description_ar: "احصل على خصم ٢٥٠ ج.م على طلبات أكثر من ٢٠٠٠ ج.م", points_cost: 2500, discount_amount: 250, active: true },
];

// ─── Activity Feed ────────────────────────────────────────

export interface ActivityFeedItem {
  id: string;
  workspace_id: string;
  user: string;
  action: string;
  action_ar: string;
  customer_id: string;
  customer_name: string;
  amount: number | null;
  currency: string;
  timestamp: string;
  type: string;
}

export const CRM_ACTIVITY_FEED: ActivityFeedItem[] = [
  { id: "af01", workspace_id: W, user: "Ahmed", action: "closed deal", action_ar: "أغلق صفقة", customer_id: "c19", customer_name: "Walid Nasser", amount: 120000, currency: "EGP", timestamp: d(10), type: "deal" },
  { id: "af02", workspace_id: W, user: "System", action: "synced Shopify order", action_ar: "مزامنة طلب شوبيفاي", customer_id: "c18", customer_name: "Nadia Sherif", amount: 7200, currency: "EGP", timestamp: d(1), type: "shopify" },
  { id: "af03", workspace_id: W, user: "Ahmed", action: "sent quotation", action_ar: "أرسل عرض سعر", customer_id: "c01", customer_name: "Nora Al-Farsi", amount: 12000, currency: "EGP", timestamp: d(5), type: "quotation" },
  { id: "af04", workspace_id: W, user: "Sara", action: "created invoice", action_ar: "أنشأ فاتورة", customer_id: "c03", customer_name: "Sara Mahmoud", amount: 28000, currency: "EGP", timestamp: d(3), type: "invoice" },
  { id: "af05", workspace_id: W, user: "System", action: "loyalty points redeemed", action_ar: "استبدال نقاط ولاء", customer_id: "c07", customer_name: "Mona Saad", amount: 50, currency: "EGP", timestamp: d(10), type: "loyalty" },
  { id: "af06", workspace_id: W, user: "Ahmed", action: "placed order", action_ar: "أدخل طلب", customer_id: "c12", customer_name: "Tamer Hosny", amount: 45000, currency: "EGP", timestamp: d(1), type: "order" },
  { id: "af07", workspace_id: W, user: "Omar", action: "completed delivery", action_ar: "أكمل التوصيل", customer_id: "c02", customer_name: "Layla Hassan", amount: null, currency: "EGP", timestamp: d(2), type: "delivery" },
  { id: "af08", workspace_id: W, user: "Sara", action: "opened support ticket", action_ar: "فتح تذكرة دعم", customer_id: "c05", customer_name: "Fatima Al-Zahra", amount: null, currency: "EGP", timestamp: d(7), type: "support" },
  { id: "af09", workspace_id: W, user: "Ahmed", action: "added new customer", action_ar: "أضاف عميل جديد", customer_id: "c06", customer_name: "Ahmed Khalil", amount: null, currency: "EGP", timestamp: d(60), type: "customer" },
  { id: "af10", workspace_id: W, user: "System", action: "synced Shopify order", action_ar: "مزامنة طلب شوبيفاي", customer_id: "c02", customer_name: "Layla Hassan", amount: 4500, currency: "EGP", timestamp: d(1), type: "shopify" },
];

// ─── Customer Relationships ───────────────────────────────

export interface CustomerRelationship {
  id: string;
  workspace_id: string;
  customer_id: string;
  related_customer_id: string | null;
  relationship_type: "family" | "company" | "designer" | "contractor" | "referral" | "related" | "spouse" | "parent" | "child" | "sibling";
  related_name: string;
  related_name_ar: string;
  related_phone: string;
  related_email: string;
  notes: string;
  notes_ar: string;
  created_at: string;
}

export const CUSTOMER_RELATIONSHIPS: CustomerRelationship[] = [
  { id: "cr01", workspace_id: W, customer_id: "c01", related_customer_id: "c11", relationship_type: "referral", related_name: "Dina Ragab", related_name_ar: "دينا رجب", related_phone: "+20-110-111-2222", related_email: "dina.r@fashion.eg", notes: "Referred by Dina in 2022", notes_ar: "تم الإحالة من دينا في ٢٠٢٢", created_at: d(730) },
  { id: "cr02", workspace_id: W, customer_id: "c01", related_customer_id: null, relationship_type: "spouse", related_name: "Mohamed Al-Farsi", related_name_ar: "محمد الفارسي", related_phone: "+20-100-987-6543", related_email: "mohamed.f@gmail.com", notes: "Husband - handles payments", notes_ar: "الزوج - يتعامل مع المدفوعات", created_at: d(730) },
  { id: "cr03", workspace_id: W, customer_id: "c03", related_customer_id: null, relationship_type: "company", related_name: "TechCorp Egypt", related_name_ar: "تك كورب مصر", related_phone: "+20-2-2345-6789", related_email: "procurement@techcorp.eg", notes: "Corporate account - 50 employees", notes_ar: "حساب شركات - ٥٠ موظف", created_at: d(450) },
  { id: "cr04", workspace_id: W, customer_id: "c04", related_customer_id: null, relationship_type: "company", related_name: "Al-Mansouri Trading", related_name_ar: " trading المنصوري", related_phone: "+966-50-123-4567", related_email: "khalid@mansouri.sa", notes: "Main wholesale partner in Saudi Arabia", notes_ar: "شريك الجملة الرئيسي في السعودية", created_at: d(900) },
  { id: "cr05", workspace_id: W, customer_id: "c07", related_customer_id: "c01", relationship_type: "referral", related_name: "Nora Al-Farsi", related_name_ar: "نورة الفارسي", related_phone: "+20-100-123-4567", related_email: "nora.alfarsi@gmail.com", notes: "Referred by Nora", notes_ar: "تم الإحالة من نورة", created_at: d(600) },
  { id: "cr06", workspace_id: W, customer_id: "c12", related_customer_id: null, relationship_type: "designer", related_name: "Hany El-Behiri", related_name_ar: "هاني البهيري", related_phone: "+20-120-555-7777", related_email: "hany@designer.eg", notes: "Personal stylist/designer for custom orders", notes_ar: "مصمم شخصي للطلبات المخصصة", created_at: d(1400) },
  { id: "cr07", workspace_id: W, customer_id: "c11", related_customer_id: "c01", relationship_type: "family", related_name: "Nora Al-Farsi", related_name_ar: "نورة الفارسي", related_phone: "+20-100-123-4567", related_email: "nora.alfarsi@gmail.com", notes: "Cousin - shares bridal preferences", notes_ar: "ابن العم - يتشاركان تفضيلات العروس", created_at: d(1100) },
  { id: "cr08", workspace_id: W, customer_id: "c18", related_customer_id: null, relationship_type: "family", related_name: "Sherif Adel", related_name_ar: "شريف عادل", related_phone: "+20-180-777-8888", related_email: "sherif@media.tv", notes: "Husband - media connections", notes_ar: "الزوج - علاقات إعلامية", created_at: d(800) },
  { id: "cr09", workspace_id: W, customer_id: "c20", related_customer_id: null, relationship_type: "family", related_name: "Adel Hassan", related_name_ar: "عادل حسن", related_phone: "+20-105-222-3333", related_email: "adel.h@gmail.com", notes: "Father - paying for bridal package", notes_ar: "الأب - يدفع عن باقة العروس", created_at: d(350) },
  { id: "cr10", workspace_id: W, customer_id: "c15", related_customer_id: null, relationship_type: "contractor", related_name: "Gulf Logistics LLC", related_name_ar: "شركة الخليج للخدمات اللوجستية", related_phone: "+971-4-333-4444", related_email: "ops@gulflogistics.ae", notes: "Shipping contractor for UAE orders", notes_ar: "مقاول الشحن للطلبات الإماراتية", created_at: d(500) },
];
