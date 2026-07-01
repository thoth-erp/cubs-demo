/**
 * Studio Module Data — بيانات وحدة الاستوديو
 *
 * THOTH Studio: The intelligent workspace for business documentation,
 * knowledge management, and live ERP integration.
 *
 * Core philosophy: Everything is a Page.
 */

const W = "demo";
const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
const ts = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString();

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export type BlockType =
  | "text" | "h1" | "h2" | "h3" | "h4" | "bullet_list" | "numbered_list" | "checklist"
  | "divider" | "quote" | "toggle" | "callout" | "table" | "image" | "video"
  | "audio" | "pdf" | "code" | "embed" | "bookmark" | "formula" | "ai_block"
  | "button" | "columns" | "gallery" | "kanban" | "calendar" | "timeline"
  | "database" | "chart" | "whiteboard" | "synced_block" | "erp_widget"
  | "file" | "divider";

export type PageType = "note" | "meeting" | "sop" | "wiki" | "document" | "project" | "brainstorm" | "database" | "task_hub" | "knowledge" | "handbook" | "brief" | "spec" | "template";

export type PageStatus = "draft" | "in_progress" | "review" | "published" | "archived";

export type DatabaseViewType = "table" | "gallery" | "board" | "calendar" | "timeline" | "list";

export type PropertyType = "text" | "number" | "status" | "select" | "multi_select" | "person" | "relation" | "rollup" | "formula" | "date" | "checkbox" | "url" | "email" | "phone" | "currency" | "rating" | "progress" | "tags";

export type PermissionRole = "admin" | "manager" | "editor" | "commenter" | "viewer" | "guest";

export interface StudioPage {
  id: string; workspace_id: string;
  title: string; title_ar: string;
  icon: string; cover_image: string | null;
  type: PageType; status: PageStatus;
  parent_id: string | null;
  owner_id: string; owner_name: string; owner_name_ar: string;
  owner_avatar: string;
  tags: string[];
  is_favorite: boolean; is_template: boolean; is_public: boolean;
  published_url: string | null;
  properties: Record<string, any>;
  created_at: string; updated_at: string;
  last_edited_by: string;
  view_count: number;
  word_count: number;
}

export interface StudioBlock {
  id: string; workspace_id: string; page_id: string;
  type: BlockType;
  content: string; content_ar: string;
  order: number;
  parent_block_id: string | null;
  children: string[];
  metadata: Record<string, any>;
  created_at: string; updated_at: string;
}

export interface StudioComment {
  id: string; workspace_id: string;
  page_id: string; block_id: string | null;
  author: string; author_ar: string;
  author_avatar: string;
  content: string; content_ar: string;
  mentions: string[];
  reactions: { emoji: string; users: string[] }[];
  resolved: boolean;
  parent_comment_id: string | null;
  created_at: string;
  replies: StudioComment[];
}

export interface StudioTemplate {
  id: string; workspace_id: string;
  name: string; name_ar: string;
  description: string; description_ar: string;
  icon: string; category: string;
  color: string;
  blocks: { type: BlockType; content: string; content_ar: string; metadata?: Record<string, any> }[];
  is_builtin: boolean; usage_count: number;
}

export interface StudioDatabase {
  id: string; workspace_id: string;
  page_id: string;
  name: string; name_ar: string;
  icon: string;
  properties: StudioDatabaseProperty[];
  views: StudioDatabaseView[];
  created_at: string;
}

export interface StudioDatabaseProperty {
  id: string; name: string; name_ar: string;
  type: PropertyType;
  options?: { label: string; label_ar: string; color: string }[];
  related_database_id?: string;
  formula?: string;
}

export interface StudioDatabaseView {
  id: string; name: string; name_ar: string;
  type: DatabaseViewType;
  filters: { property: string; operator: string; value: string }[];
  sorts: { property: string; direction: "asc" | "desc" }[];
  visible_properties: string[];
}

export interface StudioDatabaseRow {
  id: string; workspace_id: string; database_id: string;
  properties: Record<string, any>;
  created_at: string; updated_at: string;
}

export interface StudioMedia {
  id: string; workspace_id: string;
  name: string; type: "image" | "pdf" | "video" | "audio" | "document" | "other";
  url: string; thumbnail_url: string;
  size: number; mime_type: string;
  uploaded_by: string; uploaded_at: string;
  page_id: string | null;
  tags: string[];
}

export interface StudioMember {
  id: string; workspace_id: string;
  name: string; name_ar: string;
  email: string; avatar: string;
  role: PermissionRole;
  last_active: string;
  status: "active" | "pending" | "inactive";
}

export interface StudioInvite {
  id: string; workspace_id: string;
  email: string; name: string;
  role: PermissionRole;
  invited_by: string;
  invited_at: string;
  status: "pending" | "accepted" | "expired";
}

export interface StudioVersion {
  id: string; page_id: string;
  title: string; title_ar: string;
  author: string; author_ar: string;
  summary: string; summary_ar: string;
  created_at: string;
  block_count: number;
}

// ═══════════════════════════════════════════════════════════
// PAGES
// ═══════════════════════════════════════════════════════════

export const STUDIO_PAGES: StudioPage[] = [
  { id: "p01", workspace_id: W, title: "THOTH Knowledge Base", title_ar: "قاعدة معرفة ثوت", icon: "📚", cover_image: null, type: "knowledge", status: "published", parent_id: null, owner_id: "e01", owner_name: "Ahmed Ali", owner_name_ar: "أحمد علي", owner_avatar: "#1E3A5F", tags: ["knowledge", "company"], is_favorite: true, is_template: false, is_public: true, published_url: "/public/kb", properties: { department: "All", priority: "high" }, created_at: d(90), updated_at: d(1), last_edited_by: "Ahmed Ali", view_count: 245, word_count: 3200 },
  { id: "p02", workspace_id: W, title: "HR Handbook", title_ar: "دليل الموارد البشرية", icon: "📋", cover_image: null, type: "handbook", status: "published", parent_id: "p01", owner_id: "e08", owner_name: "Mona Saad", owner_name_ar: "منى سعد", owner_avatar: "#10B981", tags: ["hr", "policies", "onboarding"], is_favorite: true, is_template: false, is_public: false, published_url: null, properties: { department: "HR", priority: "high", status: "published" }, created_at: d(60), updated_at: d(5), last_edited_by: "Mona Saad", view_count: 89, word_count: 5400 },
  { id: "p03", workspace_id: W, title: "Marketing Plan 2026", title_ar: "خطة التسويق ٢٠٢٦", icon: "📊", cover_image: null, type: "project", status: "in_progress", parent_id: null, owner_id: "e02", owner_name: "Sara Mahmoud", owner_name_ar: "سارة محمود", owner_avatar: "#E07A5F", tags: ["marketing", "strategy", "2026"], is_favorite: false, is_template: false, is_public: false, published_url: null, properties: { department: "Sales", priority: "high", budget: "500,000 EGP" }, created_at: d(30), updated_at: d(0), last_edited_by: "Sara Mahmoud", view_count: 42, word_count: 1800 },
  { id: "p04", workspace_id: W, title: "Sales SOP", title_ar: "إجراءات المبيعات", icon: "💰", cover_image: null, type: "sop", status: "published", parent_id: "p01", owner_id: "e02", owner_name: "Sara Mahmoud", owner_name_ar: "سارة محمود", owner_avatar: "#E07A5F", tags: ["sales", "sop", "process"], is_favorite: false, is_template: false, is_public: false, published_url: null, properties: { department: "Sales", priority: "medium", review_date: "2026-09-01" }, created_at: d(45), updated_at: d(10), last_edited_by: "Sara Mahmoud", view_count: 34, word_count: 1200 },
  { id: "p05", workspace_id: W, title: "Warehouse SOP", title_ar: "إجراءات المخزن", icon: "🏭", cover_image: null, type: "sop", status: "published", parent_id: "p01", owner_id: "e05", owner_name: "Omar Salah", owner_name_ar: "عمر صلاح", owner_avatar: "#F59E0B", tags: ["warehouse", "sop", "operations"], is_favorite: false, is_template: false, is_public: false, published_url: null, properties: { department: "Operations", priority: "medium" }, created_at: d(40), updated_at: d(8), last_edited_by: "Omar Salah", view_count: 28, word_count: 980 },
  { id: "p06", workspace_id: W, title: "Product Roadmap Q2-Q3", title_ar: "خارطة طريق المنتجات Q2-Q3", icon: "🗺️", cover_image: null, type: "project", status: "in_progress", parent_id: null, owner_id: "e04", owner_name: "Fatma Hassan", owner_name_ar: "فاطمة حسن", owner_avatar: "#EC4899", tags: ["product", "roadmap", "design"], is_favorite: true, is_template: false, is_public: false, published_url: null, properties: { department: "Design", priority: "high" }, created_at: d(20), updated_at: d(0), last_edited_by: "Fatma Hassan", view_count: 56, word_count: 2100 },
  { id: "p07", workspace_id: W, title: "Team Meeting — June 10", title_ar: "اجتماع الفريق — ١٠ يونيو", icon: "📅", cover_image: null, type: "meeting", status: "published", parent_id: null, owner_id: "e01", owner_name: "Ahmed Ali", owner_name_ar: "أحمد علي", owner_avatar: "#1E3A5F", tags: ["meeting", "team"], is_favorite: false, is_template: false, is_public: false, published_url: null, properties: { date: "2026-06-10", attendees: "All managers" }, created_at: d(4), updated_at: d(4), last_edited_by: "Ahmed Ali", view_count: 12, word_count: 650 },
  { id: "p08", workspace_id: W, title: "Brand Guidelines", title_ar: "إرشادات العلامة التجارية", icon: "🎨", cover_image: null, type: "document", status: "published", parent_id: "p01", owner_id: "e04", owner_name: "Fatma Hassan", owner_name_ar: "فاطمة حسن", owner_avatar: "#EC4899", tags: ["brand", "design", "guidelines"], is_favorite: true, is_template: false, is_public: true, published_url: "/public/brand", properties: { department: "Design", priority: "high" }, created_at: d(90), updated_at: d(15), last_edited_by: "Fatma Hassan", view_count: 120, word_count: 1500 },
  { id: "p09", workspace_id: W, title: "CRM SOP — Customer Follow-up", title_ar: "إجراءات CRM — متابعة العملاء", icon: "🤝", cover_image: null, type: "sop", status: "published", parent_id: "p01", owner_id: "e08", owner_name: "Mona Saad", owner_name_ar: "منى سعد", owner_avatar: "#10B981", tags: ["crm", "sop", "customer"], is_favorite: false, is_template: false, is_public: false, published_url: null, properties: { department: "Sales", priority: "medium" }, created_at: d(35), updated_at: d(12), last_edited_by: "Mona Saad", view_count: 18, word_count: 800 },
  { id: "p10", workspace_id: W, title: "Production Quality Checklist", title_ar: "قائمة جودة الإنتاج", icon: "✅", cover_image: null, type: "sop", status: "published", parent_id: "p01", owner_id: "e03", owner_name: "Mohamed Gamal", owner_name_ar: "محمد جمال", owner_avatar: "#3B82F6", tags: ["production", "quality", "checklist"], is_favorite: false, is_template: false, is_public: false, published_url: null, properties: { department: "Production", priority: "high" }, created_at: d(50), updated_at: d(3), last_edited_by: "Mohamed Gamal", view_count: 45, word_count: 600 },
  { id: "p11", workspace_id: W, title: "Summer Collection Brief", title_ar: "بريف مجموعة الصيف", icon: "☀️", cover_image: null, type: "brief", status: "in_progress", parent_id: null, owner_id: "e04", owner_name: "Fatma Hassan", owner_name_ar: "فاطمة حسن", owner_avatar: "#EC4899", tags: ["collection", "summer", "design"], is_favorite: false, is_template: false, is_public: false, published_url: null, properties: { department: "Design", priority: "high", deadline: "2026-07-15" }, created_at: d(10), updated_at: d(0), last_edited_by: "Fatma Hassan", view_count: 22, word_count: 1100 },
  { id: "p12", workspace_id: W, title: "Employee Onboarding Guide", title_ar: "دليل تأهيل الموظف الجديد", icon: "🎓", cover_image: null, type: "handbook", status: "published", parent_id: "p02", owner_id: "e08", owner_name: "Mona Saad", owner_name_ar: "منى سعد", owner_avatar: "#10B981", tags: ["hr", "onboarding", "guide"], is_favorite: false, is_template: false, is_public: false, published_url: null, properties: { department: "HR", priority: "medium" }, created_at: d(55), updated_at: d(7), last_edited_by: "Mona Saad", view_count: 15, word_count: 750 },
  { id: "p13", workspace_id: W, title: "Brand Identity 2026", title_ar: "هوية العلامة التجارية ٢٠٢٦", icon: "✨", cover_image: null, type: "document", status: "in_progress", parent_id: "p08", owner_id: "e04", owner_name: "Fatma Hassan", owner_name_ar: "فاطمة حسن", owner_avatar: "#EC4899", tags: ["brand", "identity", "2026"], is_favorite: false, is_template: false, is_public: false, published_url: null, properties: { department: "Design", priority: "high" }, created_at: d(15), updated_at: d(1), last_edited_by: "Fatma Hassan", view_count: 33, word_count: 900 },
  { id: "p14", workspace_id: W, title: "Client Welcome Kit", title_ar: "حزمة ترحيب العملاء", icon: "🎁", cover_image: null, type: "template", status: "published", parent_id: null, owner_id: "e02", owner_name: "Sara Mahmoud", owner_name_ar: "سارة محمود", owner_avatar: "#E07A5F", tags: ["client", "welcome", "template"], is_favorite: false, is_template: true, is_public: false, published_url: null, properties: { department: "Sales", priority: "medium" }, created_at: d(25), updated_at: d(10), last_edited_by: "Sara Mahmoud", view_count: 8, word_count: 500 },
  { id: "p15", workspace_id: W, title: "Shooting Notes — June", title_ar: "ملاحظات التصوير — يونيو", icon: "📸", cover_image: null, type: "meeting", status: "draft", parent_id: null, owner_id: "e04", owner_name: "Fatma Hassan", owner_name_ar: "فاطمة حسن", owner_avatar: "#EC4899", tags: ["photo", "shooting", "june"], is_favorite: false, is_template: false, is_public: false, published_url: null, properties: { department: "Design", priority: "medium", date: "2026-06-20" }, created_at: d(2), updated_at: d(0), last_edited_by: "Fatma Hassan", view_count: 5, word_count: 300 },
];

// ═══════════════════════════════════════════════════════════
// BLOCKS
// ═══════════════════════════════════════════════════════════

export const STUDIO_BLOCKS: StudioBlock[] = [
  // HR Handbook
  { id: "b01", workspace_id: W, page_id: "p02", type: "h1", content: "THOTH HR Handbook", content_ar: "دليل ثوت للموارد البشرية", order: 0, parent_block_id: null, children: [], metadata: {}, created_at: d(60), updated_at: d(5) },
  { id: "b02", workspace_id: W, page_id: "p02", type: "text", content: "Welcome to THOTH Fashion. This handbook covers everything you need to know about working with us.", content_ar: "مرحباً بكم في ثوت فاشون. يغطي هذا الدليل كل ما تحتاج معرفته عن العمل معنا.", order: 1, parent_block_id: null, children: [], metadata: {}, created_at: d(60), updated_at: d(5) },
  { id: "b03", workspace_id: W, page_id: "p02", type: "h2", content: "1. Company Overview", content_ar: "١. نظرة عامة على الشركة", order: 2, parent_block_id: null, children: [], metadata: {}, created_at: d(60), updated_at: d(5) },
  { id: "b04", workspace_id: W, page_id: "p02", type: "text", content: "THOTH Fashion is a premium Egyptian fashion house specializing in bridal, evening wear, and custom tailoring. Founded in 2020, we operate from Nasr City (showroom) and 10th Ramadan (factory).", content_ar: "ثوت فاشون هي دار أزياء مصرية فاخرة متخصصة في أزياء العروس وملابس السهرة والخياطة المخصصة. تأسست في ٢٠٢٠، نعمل من مدينة نصر (معرض) والعاشر من رمضان (مصنع).", order: 3, parent_block_id: null, children: [], metadata: {}, created_at: d(60), updated_at: d(5) },
  { id: "b05", workspace_id: W, page_id: "p02", type: "callout", content: "Our mission: To create timeless fashion that empowers every woman to feel confident and beautiful.", content_ar: "مهمتنا: إنشاء أزياء خالدة تمكن كل امرأة من الشعور بالثقة والجمال.", order: 4, parent_block_id: null, children: [], metadata: { icon: "💡", color: "primary" }, created_at: d(60), updated_at: d(5) },
  { id: "b06", workspace_id: W, page_id: "p02", type: "h2", content: "2. Leave Policy", content_ar: "٢. سياسة الإجازات", order: 5, parent_block_id: null, children: [], metadata: {}, created_at: d(60), updated_at: d(5) },
  { id: "b07", workspace_id: W, page_id: "p02", type: "bullet_list", content: "Annual Leave: 21 days per year (increases to 28 after 3 years)", content_ar: "إجازة سنوية: ٢١ يوماً في السنة (تزيد إلى ٢٨ بعد ٣ سنوات)", order: 6, parent_block_id: null, children: [], metadata: {}, created_at: d(60), updated_at: d(5) },
  { id: "b08", workspace_id: W, page_id: "p02", type: "bullet_list", content: "Sick Leave: 15 days per year (requires medical certificate)", content_ar: "إجازة مرضية: ١٥ يوماً في السنة (تتطلب شهادة طبية)", order: 7, parent_block_id: null, children: [], metadata: {}, created_at: d(60), updated_at: d(5) },
  { id: "b09", workspace_id: W, page_id: "p02", type: "bullet_list", content: "Emergency Leave: 5 days per year", content_ar: "إجازة طارئة: ٥ أيام في السنة", order: 8, parent_block_id: null, children: [], metadata: {}, created_at: d(60), updated_at: d(5) },
  { id: "b10", workspace_id: W, page_id: "p02", type: "bullet_list", content: "Paternity Leave: 3 days (per Egyptian labor law)", content_ar: "إجازة أبوة: ٣ أيام (وفق قانون العمل المصري)", order: 9, parent_block_id: null, children: [], metadata: {}, created_at: d(60), updated_at: d(5) },
  { id: "b11", workspace_id: W, page_id: "p02", type: "divider", content: "", content_ar: "", order: 10, parent_block_id: null, children: [], metadata: {}, created_at: d(60), updated_at: d(5) },
  { id: "b12", workspace_id: W, page_id: "p02", type: "h2", content: "3. Working Hours", content_ar: "٣. ساعات العمل", order: 11, parent_block_id: null, children: [], metadata: {}, created_at: d(60), updated_at: d(5) },
  { id: "b13", workspace_id: W, page_id: "p02", type: "text", content: "Showroom (Nasr City): Sunday–Thursday, 10:00 AM – 7:00 PM\nFactory (10th Ramadan): Sunday–Thursday, 8:00 AM – 5:00 PM\nFriday & Saturday: Off", content_ar: "المعرض (مدينة نصر): الأحد–الخميس، ١٠ صباحاً – ٧ مساءً\nالمصنع (العاشر من رمضان): الأحد–الخميس، ٨ صباحاً – ٥ مساءً\nالجمعة والسبت: عطلة", order: 12, parent_block_id: null, children: [], metadata: {}, created_at: d(60), updated_at: d(5) },
  { id: "b14", workspace_id: W, page_id: "p02", type: "toggle", content: "Dress Code Policy", content_ar: "سياسة الملابس", order: 13, parent_block_id: null, children: ["b15"], metadata: { expanded: false }, created_at: d(60), updated_at: d(5) },
  { id: "b15", workspace_id: W, page_id: "p02", type: "text", content: "Smart casual for showroom staff. Factory staff must wear safety gear and closed-toe shoes. No jewelry near machines.", content_ar: "أنيق كاجوال لموظفي المعرض. يجب على موظفي المصنع ارتداء معدات السلامة وأحذية مغلقة. لا مجوهرات بالقرب من الآلات.", order: 14, parent_block_id: "b14", children: [], metadata: {}, created_at: d(60), updated_at: d(5) },
  { id: "b16", workspace_id: W, page_id: "p02", type: "checklist", content: "Read and sign this handbook", content_ar: "اقرأ ووقّع هذا الدليل", order: 15, parent_block_id: null, children: [], metadata: { checked: false }, created_at: d(60), updated_at: d(5) },
  { id: "b17", workspace_id: W, page_id: "p02", type: "checklist", content: "Complete safety training", content_ar: "أكمل تدريب السلامة", order: 16, parent_block_id: null, children: [], metadata: { checked: true }, created_at: d(60), updated_at: d(5) },
  { id: "b18", workspace_id: W, page_id: "p02", type: "quote", content: "The strength of the team is each individual member. The strength of each member is the team. — Phil Jackson", content_ar: "قوة الفريق هي كل فرد. قوة كل فرد هي الفريق. — فيل جاكسون", order: 17, parent_block_id: null, children: [], metadata: {}, created_at: d(60), updated_at: d(5) },

  // Sales SOP
  { id: "b19", workspace_id: W, page_id: "p04", type: "h1", content: "Sales SOP — Customer Follow-up Process", content_ar: "إجراءات المبيعات — عملية متابعة العملاء", order: 0, parent_block_id: null, children: [], metadata: {}, created_at: d(45), updated_at: d(10) },
  { id: "b20", workspace_id: W, page_id: "p04", type: "callout", content: "This SOP defines the standard process for following up with customers from initial contact to post-sale support.", content_ar: "تُعرّف هذه الإجراءات العملية المعيارية للمتابعة مع العملاء من الاتصال الأولي حتى ما بعد البيع.", order: 1, parent_block_id: null, children: [], metadata: { icon: "📋", color: "blue" }, created_at: d(45), updated_at: d(10) },
  { id: "b21", workspace_id: W, page_id: "p04", type: "h2", content: "Step 1: Initial Contact", content_ar: "الخطوة ١: الاتصال الأولي", order: 2, parent_block_id: null, children: [], metadata: {}, created_at: d(45), updated_at: d(10) },
  { id: "b22", workspace_id: W, page_id: "p04", type: "numbered_list", content: "Respond to inquiry within 2 hours", content_ar: "الرد على الاستفسار خلال ساعتين", order: 3, parent_block_id: null, children: [], metadata: {}, created_at: d(45), updated_at: d(10) },
  { id: "b23", workspace_id: W, page_id: "p04", type: "numbered_list", content: "Gather customer requirements", content_ar: "جمع متطلبات العميل", order: 4, parent_block_id: null, children: [], metadata: {}, created_at: d(45), updated_at: d(10) },
  { id: "b24", workspace_id: W, page_id: "p04", type: "numbered_list", content: "Create quotation within 24 hours", content_ar: "إنشاء عرض سعر خلال ٢٤ ساعة", order: 5, parent_block_id: null, children: [], metadata: {}, created_at: d(45), updated_at: d(10) },
  { id: "b25", workspace_id: W, page_id: "p04", type: "h2", content: "Step 2: Follow-up Schedule", content_ar: "الخطوة ٢: جدول المتابعة", order: 6, parent_block_id: null, children: [], metadata: {}, created_at: d(45), updated_at: d(10) },
  { id: "b26", workspace_id: W, page_id: "p04", type: "callout", content: "Always follow up within 48 hours of sending a quotation. Use WhatsApp first, then phone call if no response.", content_ar: "تابع دائماً خلال ٤٨ ساعة من إرسال عرض السعر. استخدم واتساب أولاً، ثم الاتصال الهاتفي إذا لم يكن هناك رد.", order: 7, parent_block_id: null, children: [], metadata: { icon: "⚠️", color: "amber" }, created_at: d(45), updated_at: d(10) },

  // Meeting Notes
  { id: "b27", workspace_id: W, page_id: "p07", type: "h1", content: "Team Meeting — June 10, 2026", content_ar: "اجتماع الفريق — ١٠ يونيو ٢٠٢٦", order: 0, parent_block_id: null, children: [], metadata: {}, created_at: d(4), updated_at: d(4) },
  { id: "b28", workspace_id: W, page_id: "p07", type: "text", content: "Attendees: Ahmed Ali, Sara Mahmoud, Mohamed Gamal, Fatma Hassan, Mona Saad", content_ar: "الحضور: أحمد علي، سارة محمود، محمد جمال، فاطمة حسن، منى سعد", order: 1, parent_block_id: null, children: [], metadata: {}, created_at: d(4), updated_at: d(4) },
  { id: "b29", workspace_id: W, page_id: "p07", type: "h2", content: "Agenda", content_ar: "جدول الأعمال", order: 2, parent_block_id: null, children: [], metadata: {}, created_at: d(4), updated_at: d(4) },
  { id: "b30", workspace_id: W, page_id: "p07", type: "checklist", content: "Review Q2 sales targets", content_ar: "مراجعة أهداف مبيعات Q2", order: 3, parent_block_id: null, children: [], metadata: { checked: true }, created_at: d(4), updated_at: d(4) },
  { id: "b31", workspace_id: W, page_id: "p07", type: "checklist", content: "Discuss summer collection launch", content_ar: "مناقشة إطلاق مجموعة الصيف", order: 4, parent_block_id: null, children: [], metadata: { checked: true }, created_at: d(4), updated_at: d(4) },
  { id: "b32", workspace_id: W, page_id: "p07", type: "checklist", content: "Factory ventilation issue update", content_ar: "تحديث مشكلة تهوية المصنع", order: 5, parent_block_id: null, children: [], metadata: { checked: true }, created_at: d(4), updated_at: d(4) },
  { id: "b33", workspace_id: W, page_id: "p07", type: "h2", content: "Action Items", content_ar: "الإجراءات المطلوبة", order: 6, parent_block_id: null, children: [], metadata: {}, created_at: d(4), updated_at: d(4) },
  { id: "b34", workspace_id: W, page_id: "p07", type: "checklist", content: "[@Sara] Send summer collection preview to VIP clients by June 15", content_ar: "@sara أرسل معاينة مجموعة الصيف لعملاء VIP بحلول ١٥ يونيو", order: 7, parent_block_id: null, children: [], metadata: { checked: false, assignee: "Sara Mahmoud" }, created_at: d(4), updated_at: d(4) },
  { id: "b35", workspace_id: W, page_id: "p07", type: "checklist", content: "[@Mohamed] Fix factory ventilation by June 20", content_ar: "@mohamed أصلح تهوية المصنع بحلول ٢٠ يونيو", order: 8, parent_block_id: null, children: [], metadata: { checked: false, assignee: "Mohamed Gamal" }, created_at: d(4), updated_at: d(4) },
  { id: "b36", workspace_id: W, page_id: "p07", type: "checklist", content: "[@Mona] Complete Heba's probation review", content_ar: "@mona أكمل مراجعة فترة تجربة هبة", order: 9, parent_block_id: null, children: [], metadata: { checked: false, assignee: "Mona Saad" }, created_at: d(4), updated_at: d(4) },

  // Brand Guidelines
  { id: "b37", workspace_id: W, page_id: "p08", type: "h1", content: "THOTH Brand Guidelines", content_ar: "إرشادات علامة ثوت التجارية", order: 0, parent_block_id: null, children: [], metadata: {}, created_at: d(90), updated_at: d(15) },
  { id: "b38", workspace_id: W, page_id: "p08", type: "h2", content: "Logo Usage", content_ar: "استخدام الشعار", order: 1, parent_block_id: null, children: [], metadata: {}, created_at: d(90), updated_at: d(15) },
  { id: "b39", workspace_id: W, page_id: "p08", type: "text", content: "The THOTH logo should always be used with sufficient whitespace. Minimum size: 24px height for digital, 15mm for print.", content_ar: "يجب استخدام شعار ثوت دائماً مع مساحة كافية. الحد الأدنى للحجم: ٢٤ بكسل للرقمي، ١٥ ملم للطباعة.", order: 2, parent_block_id: null, children: [], metadata: {}, created_at: d(90), updated_at: d(15) },
  { id: "b40", workspace_id: W, page_id: "p08", type: "h2", content: "Color Palette", content_ar: "لوحة الألوان", order: 3, parent_block_id: null, children: [], metadata: {}, created_at: d(90), updated_at: d(15) },
  { id: "b41", workspace_id: W, page_id: "p08", type: "text", content: "Primary: #1E3A5F (Navy)\nSecondary: #C9A96E (Gold)\nAccent: #E8D5B7 (Champagne)\nNeutral: #F5F2ED (Ivory)\nText: #2C2C2C", content_ar: "الأساسي: #1E3A5F (كحلي)\nالثانوي: #C9A96E (ذهبي)\nالتمييز: #E8D5B7 (شمبانيا)\nالمحايد: #F5F2ED (عاجي)\nالنص: #2C2C2C", order: 4, parent_block_id: null, children: [], metadata: {}, created_at: d(90), updated_at: d(15) },
  { id: "b42", workspace_id: W, page_id: "p08", type: "h2", content: "Typography", content_ar: "الطباعة", order: 5, parent_block_id: null, children: [], metadata: {}, created_at: d(90), updated_at: d(15) },
  { id: "b43", workspace_id: W, page_id: "p08", type: "text", content: "Headlines: Playfair Display (serif)\nBody: Inter (sans-serif)\nArabic: Noto Kufi Arabic", content_ar: "العناوين: Playfair Display (سيريف)\nالنص: Inter (سانس سيريف)\nالعربي: Noto Kufi Arabic", order: 6, parent_block_id: null, children: [], metadata: {}, created_at: d(90), updated_at: d(15) },

  // Summer Brief
  { id: "b44", workspace_id: W, page_id: "p11", type: "h1", content: "Summer 2026 Collection Brief", content_ar: "بريف مجموعة صيف ٢٠٢٦", order: 0, parent_block_id: null, children: [], metadata: {}, created_at: d(10), updated_at: d(0) },
  { id: "b45", workspace_id: W, page_id: "p11", type: "callout", content: "Deadline: July 15, 2026 — Production must start by July 20", content_ar: "الموعد النهائي: ١٥ يوليو ٢٠٢٦ — يجب بدء الإنتاج بحلول ٢٠ يوليو", order: 1, parent_block_id: null, children: [], metadata: { icon: "⏰", color: "red" }, created_at: d(10), updated_at: d(0) },
  { id: "b46", workspace_id: W, page_id: "p11", type: "h2", content: "Theme", content_ar: "الموضوع", order: 2, parent_block_id: null, children: [], metadata: {}, created_at: d(10), updated_at: d(0) },
  { id: "b47", workspace_id: W, page_id: "p11", type: "text", content: "\"Mediterranean Breeze\" — Light fabrics, flowing silhouettes, earthy tones with gold accents. Inspired by Egyptian coastal towns.", content_ar: "\"نسيم البحر المتوسط\" — أقمشة خفيفة، خطوط دائرية، ألوان ترابية مع لمسات ذهبية. مستوحاة من المدن الساحلية المصرية.", order: 3, parent_block_id: null, children: [], metadata: {}, created_at: d(10), updated_at: d(0) },
  { id: "b48", workspace_id: W, page_id: "p11", type: "h2", content: "Key Pieces", content_ar: "القطع الأساسية", order: 4, parent_block_id: null, children: [], metadata: {}, created_at: d(10), updated_at: d(0) },
  { id: "b49", workspace_id: W, page_id: "p11", type: "bullet_list", content: "Maxi dresses (3 designs)", content_ar: "فساتين ماكسي (٣ تصاميم)", order: 5, parent_block_id: null, children: [], metadata: {}, created_at: d(10), updated_at: d(0) },
  { id: "b50", workspace_id: W, page_id: "p11", type: "bullet_list", content: "Kaftans (2 designs)", content_ar: "قفاطين (٢ تصميم)", order: 6, parent_block_id: null, children: [], metadata: {}, created_at: d(10), updated_at: d(0) },
  { id: "b51", workspace_id: W, page_id: "p11", type: "bullet_list", content: "Abayas (2 designs)", content_ar: "عباءات (٢ تصميم)", order: 7, parent_block_id: null, children: [], metadata: {}, created_at: d(10), updated_at: d(0) },
  { id: "b52", workspace_id: W, page_id: "p11", type: "bullet_list", content: "Accessories set", content_ar: "طقم إكسسوارات", order: 8, parent_block_id: null, children: [], metadata: {}, created_at: d(10), updated_at: d(0) },
];

// ═══════════════════════════════════════════════════════════
// COMMENTS
// ═══════════════════════════════════════════════════════════

export const STUDIO_COMMENTS: StudioComment[] = [
  { id: "cm01", workspace_id: W, page_id: "p02", block_id: "b07", author: "Sara Mahmoud", author_ar: "سارة محمود", author_avatar: "#E07A5F", content: "Should we add paternity leave to this policy?", content_ar: "هل يجب إضافة إجازة الأبوة لهذه السياسة؟", mentions: [], reactions: [{ emoji: "👍", users: ["Mona Saad"] }], resolved: false, parent_comment_id: null, created_at: d(20), replies: [
    { id: "cm02", workspace_id: W, page_id: "p02", block_id: "b07", author: "Mona Saad", author_ar: "منى سعد", author_avatar: "#10B981", content: "Good point! I'll add it in the next update. Egyptian law allows 3 days paternity leave.", content_ar: "نقطة جيدة! سأضيفها في التحديث التالي. القانون المصري يسمح بـ ٣ أيام إجازة أبوة.", mentions: [], reactions: [], resolved: false, parent_comment_id: "cm01", created_at: d(19), replies: [] },
  ]},
  { id: "cm03", workspace_id: W, page_id: "p11", block_id: "b45", author: "Ahmed Ali", author_ar: "أحمد علي", author_avatar: "#1E3A5F", content: "This deadline is tight. Can we get an extension?", content_ar: "هذا الموعد النهائي ضيق. هل يمكننا الحصول على تمديد؟", mentions: ["Fatma Hassan"], reactions: [{ emoji: "⏰", users: ["Fatma Hassan"] }], resolved: false, parent_comment_id: null, created_at: d(5), replies: [] },
  { id: "cm04", workspace_id: W, page_id: "p07", block_id: "b34", author: "Ahmed Ali", author_ar: "أحمد علي", author_avatar: "#1E3A5F", content: "Please prioritize the VIP clients first — they drive 60% of our revenue.", content_ar: "يرجى أولوية عملاء VIP أولاً — يمثلون ٦٠٪ من إيراداتنا.", mentions: ["Sara Mahmoud"], reactions: [{ emoji: "✅", users: ["Sara Mahmoud"] }], resolved: false, parent_comment_id: null, created_at: d(3), replies: [] },
];

// ═══════════════════════════════════════════════════════════
// TEMPLATES
// ═══════════════════════════════════════════════════════════

export const STUDIO_TEMPLATES: StudioTemplate[] = [
  // ═══════════════════════════════════════════════════════════
  // MEETING NOTES — Rich Template
  // ═══════════════════════════════════════════════════════════
  {
    id: "t01", workspace_id: W, name: "Meeting Notes", name_ar: "محضر اجتماع",
    description: "Comprehensive meeting notes with agenda, discussion, decisions, action items, and follow-up tracking",
    description_ar: "محضر اجتماع شامل مع جدول الأعمال والنقاش والقرارات والإجراءات المطلوبة ومتابعة التنفيذ",
    icon: "📅", category: "meetings", color: "#3B82F6",
    blocks: [
      { type: "h1", content: "📋 Meeting Notes — [Meeting Title]", content_ar: "📋 محضر اجتماع — [عنوان الاجتماع]" },
      { type: "divider", content: "", content_ar: "" },
      { type: "callout", content: "Meeting Details:\n• Date: [DATE]\n• Time: [START TIME] — [END TIME]\n• Location: [ROOM / VIDEO LINK]\n• Organizer: [NAME]\n• Duration: [XX] minutes", content_ar: "تفاصيل الاجتماع:\n• التاريخ: [التاريخ]\n• الوقت: [وقت البداية] — [وقت النهاية]\n• المكان: [القاعة / رابط الفيديو]\n• المنظم: [الاسم]\n• المدة: [XX] دقيقة", metadata: { icon: "📌", color: "blue" } },
      { type: "h2", content: "👥 Attendees", content_ar: "👥 الحضور" },
      { type: "text", content: "Present:\n• [NAME 1] — [ROLE] ✓\n• [NAME 2] — [ROLE] ✓\n• [NAME 3] — [ROLE] ✓\n\nAbsent:\n• [NAME 4] — [ROLE] (excused)\n\nNote-taker: [NAME]", content_ar: "الحاضرون:\n• [الاسم ١] — [الدور] ✓\n• [الاسم ٢] — [الدور] ✓\n• [الاسم ٣] — [الدور] ✓\n\nالغائون:\n• [الاسم ٤] — [الدور] (معذور)\n\nكاتب الملاحظات: [الاسم]" },
      { type: "divider", content: "", content_ar: "" },
      { type: "h2", content: "📌 Agenda Items", content_ar: "📌 بنود جدول الأعمال" },
      { type: "numbered_list", content: "[TOPIC 1] — Presenter: [NAME] — Status: ✅ Completed", content_ar: "[الموضوع ١] — المتحدث: [الاسم] — الحالة: ✅ مكتمل" },
      { type: "numbered_list", content: "[TOPIC 2] — Presenter: [NAME] — Status: 🔄 In Progress", content_ar: "[الموضوع ٢] — المتحدث: [الاسم] — الحالة: 🔄 قيد التنفيذ" },
      { type: "numbered_list", content: "[TOPIC 3] — Presenter: [NAME] — Status: ⏸️ Deferred", content_ar: "[الموضوع ٣] — المتحدث: [الاسم] — الحالة: ⏸️ مؤجل" },
      { type: "divider", content: "", content_ar: "" },
      { type: "h2", content: "💬 Discussion Notes", content_ar: "💬 ملاحظات النقاش" },
      { type: "h3", content: "Topic 1: [Title]", content_ar: "الموضوع ١: [العنوان]" },
      { type: "bullet_list", content: "[Key point discussed]", content_ar: "[النقطة الرئيسية المناقشة]" },
      { type: "bullet_list", content: "[Another point]", content_ar: "[نقطة أخرى]" },
      { type: "quote", content: "[Important quote or decision from discussion]", content_ar: "[اقتباس أو قرار مهم من النقاش]" },
      { type: "h3", content: "Topic 2: [Title]", content_ar: "الموضوع ٢: [العنوان]" },
      { type: "bullet_list", content: "[Key point discussed]", content_ar: "[النقطة الرئيسية المناقشة]" },
      { type: "divider", content: "", content_ar: "" },
      { type: "h2", content: "✅ Decisions Made", content_ar: "✅ القرارات المتخذة" },
      { type: "callout", content: "Decision 1: [Description]\nDecision 2: [Description]\nDecision 3: [Description]", content_ar: "القرار ١: [الوصف]\nالقرار ٢: [الوصف]\nالقرار ٣: [الوصف]", metadata: { icon: "⚖️", color: "green" } },
      { type: "divider", content: "", content_ar: "" },
      { type: "h2", content: "🎯 Action Items", content_ar: "🎯 الإجراءات المطلوبة" },
      { type: "checklist", content: "[@Person 1] [Task description] — Due: [DATE] — Priority: High", content_ar: "[@الشخص ١] [وصف المهمة] — الموعد: [التاريخ] — الأولوية: عالية" },
      { type: "checklist", content: "[@Person 2] [Task description] — Due: [DATE] — Priority: Medium", content_ar: "[@الشخص ٢] [وصف المهمة] — الموعد: [التاريخ] — الأولوية: متوسطة" },
      { type: "checklist", content: "[@Person 3] [Task description] — Due: [DATE] — Priority: Low", content_ar: "[@الشخص ٣] [وصف المهمة] — الموعد: [التاريخ] — الأولوية: منخفضة" },
      { type: "divider", content: "", content_ar: "" },
      { type: "h2", content: "📅 Next Meeting", content_ar: "📅 الاجتماع القادم" },
      { type: "text", content: "Date: [DATE]\nTime: [TIME]\nLocation: [LOCATION]\nTentative Agenda:\n1. [TOPIC]\n2. [TOPIC]", content_ar: "التاريخ: [التاريخ]\nالوقت: [الوقت]\nالمكان: [المكان]\nجدول الأعمال المبدئي:\n١. [الموضوع]\n٢. [الموضوع]" },
    ],
    is_builtin: true, usage_count: 24,
  },

  // ═══════════════════════════════════════════════════════════
  // WEEKLY REPORT — Rich Template
  // ═══════════════════════════════════════════════════════════
  {
    id: "t02", workspace_id: W, name: "Weekly Report", name_ar: "تقرير أسبوعي",
    description: "Detailed weekly status report with highlights, metrics, blockers, and next week plan",
    description_ar: "تقرير حالة أسبوعي تفصيلي مع أبرز النقاط والمؤشرات والعقبات وخطة الأسبوع القادم",
    icon: "📊", category: "reports", color: "#8B5CF6",
    blocks: [
      { type: "h1", content: "📊 Weekly Report — [WEEK DATES]", content_ar: "📊 التقرير الأسبوعي — [تواريخ الأسبوع]" },
      { type: "divider", content: "", content_ar: "" },
      { type: "callout", content: "Report by: [NAME]\nDepartment: [DEPARTMENT]\nWeek: [XX] of [YEAR]", content_ar: "إعداد: [الاسم]\nالقسم: [القسم]\nالأسبوع: [XX] من [السنة]", metadata: { icon: "📝", color: "purple" } },
      { type: "h2", content: "🏆 Weekly Highlights", content_ar: "🏆 أبرز الإنجازات الأسبوعية" },
      { type: "bullet_list", content: "[Major achievement 1 — e.g., Closed 3 new deals worth 150K EGP]", content_ar: "[إنجاز رئيسي ١ — مثال: إغلاق ٣ صفقات جديدة بقيمة ١٥٠ ألف ج.م]" },
      { type: "bullet_list", content: "[Major achievement 2 — e.g., Launched summer collection preview]", content_ar: "[إنجاز رئيسي ٢ — مثال: إطلاق معاينة مجموعة الصيف]" },
      { type: "bullet_list", content: "[Major achievement 3 — e.g., Resolved customer complaint in 24 hours]", content_ar: "[إنجاز رئيسي ٣ — مثال: حل شكوى عميل خلال ٢٤ ساعة]" },
      { type: "divider", content: "", content_ar: "" },
      { type: "h2", content: "📈 Key Metrics", content_ar: "📈 المؤشرات الرئيسية" },
      { type: "text", content: "• Revenue: [AMOUNT] EGP ([+/-]% vs last week)\n• Orders: [NUMBER] ([+/-]% vs last week)\n• New Customers: [NUMBER]\n• Customer Satisfaction: [SCORE]/5\n• Tasks Completed: [NUMBER]/[TOTAL]", content_ar: "• الإيرادات: [المبلغ] ج.م ([+/-]% مقارنة بالأسبوع الماضي)\n• الطلبات: [العدد] ([+/-]% مقارنة بالأسبوع الماضي)\n• عملاء جدد: [العدد]\n• رضا العملاء: [الدرجة]/٥\n• المهام المكتملة: [العدد]/[الإجمالي]" },
      { type: "divider", content: "", content_ar: "" },
      { type: "h2", content: "✅ Completed Tasks", content_ar: "✅ المهام المكتملة" },
      { type: "checklist", content: "[Task 1] — Completed by [NAME] on [DATE]", content_ar: "[المهمة ١] — أنجزها [الاسم] في [التاريخ]" },
      { type: "checklist", content: "[Task 2] — Completed by [NAME] on [DATE]", content_ar: "[المهمة ٢] — أنجزها [الاسم] في [التاريخ]" },
      { type: "checklist", content: "[Task 3] — Completed by [NAME] on [DATE]", content_ar: "[المهمة ٣] — أنجزها [الاسم] في [التاريخ]" },
      { type: "divider", content: "", content_ar: "" },
      { type: "h2", content: "🔄 In Progress", content_ar: "🔄 قيد التنفيذ" },
      { type: "text", content: "• [Task 1] — Progress: [XX]% — Owner: [NAME]\n• [Task 2] — Progress: [XX]% — Owner: [NAME]\n• [Task 3] — Progress: [XX]% — Owner: [NAME]", content_ar: "• [المهمة ١] — التقدم: [XX]% — المسؤول: [الاسم]\n• [المهمة ٢] — التقدم: [XX]% — المسؤول: [الاسم]\n• [المهمة ٣] — التقدم: [XX]% — المسؤول: [الاسم]" },
      { type: "divider", content: "", content_ar: "" },
      { type: "h2", content: "🚧 Blockers & Challenges", content_ar: "🚧 العقبات والتحديات" },
      { type: "callout", content: "Blocker 1: [Description] — Impact: [HIGH/MEDIUM/LOW] — Mitigation: [Action taken]\nBlocker 2: [Description] — Impact: [HIGH/MEDIUM/LOW] — Mitigation: [Action taken]", content_ar: "العقبة ١: [الوصف] — التأثير: [عالي/متوسط/منخفض] — التخفيف: [الإجراء المتخذ]\nالعقبة ٢: [الوصف] — التأثير: [عالي/متوسط/منخفض] — التخفيف: [الإجراء المتخذ]", metadata: { icon: "⚠️", color: "amber" } },
      { type: "divider", content: "", content_ar: "" },
      { type: "h2", content: "📋 Next Week Plan", content_ar: "📋 خطة الأسبوع القادم" },
      { type: "numbered_list", content: "[Priority 1] — Owner: [NAME] — Due: [DATE]", content_ar: "[الأولوية ١] — المسؤول: [الاسم] — الموعد: [التاريخ]" },
      { type: "numbered_list", content: "[Priority 2] — Owner: [NAME] — Due: [DATE]", content_ar: "[الأولوية ٢] — المسؤول: [الاسم] — الموعد: [التاريخ]" },
      { type: "numbered_list", content: "[Priority 3] — Owner: [NAME] — Due: [DATE]", content_ar: "[الأولوية ٣] — المسؤول: [الاسم] — الموعد: [التاريخ]" },
      { type: "divider", content: "", content_ar: "" },
      { type: "h2", content: "💡 Notes & Observations", content_ar: "💡 ملاحظات وملاحظات" },
      { type: "text", content: "[Any additional observations, suggestions, or context for the team]", content_ar: "[أي ملاحظات أو اقتراحات أو سياق إضافي للفريق]" },
    ],
    is_builtin: true, usage_count: 18,
  },

  // ═══════════════════════════════════════════════════════════
  // SOP — Rich Template
  // ═══════════════════════════════════════════════════════════
  {
    id: "t03", workspace_id: W, name: "Standard Operating Procedure", name_ar: "إجراءات عملياتية معيارية",
    description: "Complete SOP template with purpose, scope, step-by-step procedure, safety notes, and revision history",
    description_ar: "قالب إجراءات عملياتية معيارية شامل مع الغرض والنطاق والخطوات التفصيلية وملاحظات السلامة وسجل المراجعات",
    icon: "📋", category: "process", color: "#F59E0B",
    blocks: [
      { type: "h1", content: "📋 SOP: [Procedure Title]", content_ar: "📋 إجراء: [عنوان الإجراء]" },
      { type: "divider", content: "", content_ar: "" },
      { type: "callout", content: "Document Control:\n• SOP Number: [SOP-XXX]\n• Version: [1.0]\n• Effective Date: [DATE]\n• Review Date: [DATE]\n• Author: [NAME]\n• Approved by: [NAME]\n• Status: [Draft / Active / Under Review]", content_ar: "التحكم في المستند:\n• رقم الإجراء: [SOP-XXX]\n• الإصدار: [١٫٠]\n• تاريخ النفاذ: [التاريخ]\n• تاريخ المراجعة: [التاريخ]\n• المؤلف: [الاسم]\n• تمت الموافقة من: [الاسم]\n• الحالة: [مسودة / نشط / قيد المراجعة]", metadata: { icon: "📄", color: "blue" } },
      { type: "h2", content: "1. Purpose", content_ar: "١. الغرض" },
      { type: "text", content: "This SOP establishes the standard procedure for [PROCEDURE NAME]. It ensures consistency, quality, and compliance across all operations.", content_ar: "يُحدد هذا الإجراء العملية المعيارية لـ [اسم الإجراء]. يضمن الاتجاه والجودة والامتثال عبر جميع العمليات." },
      { type: "h2", content: "2. Scope", content_ar: "٢. النطاق" },
      { type: "text", content: "This procedure applies to:\n• All [DEPARTMENT] staff\n• All [LOCATION] branches\n• All [PROCESS] activities", content_ar: "ينطبق هذا الإجراء على:\n• جميع موظفي [القسم]\n• جميع فروع [المكان]\n• جميع أنشطة [العملية]" },
      { type: "h2", content: "3. Responsibilities", content_ar: "٣. المسؤوليات" },
      { type: "text", content: "• [ROLE 1]: Responsible for [TASK]\n• [ROLE 2]: Responsible for [TASK]\n• [ROLE 3]: Responsible for [TASK]\n• [ROLE 4]: Reviews and approves", content_ar: "• [الدور ١]: مسؤول عن [المهمة]\n• [الدور ٢]: مسؤول عن [المهمة]\n• [الدور ٣]: مسؤول عن [المهمة]\n• [الدور ٤]: يراجع ويوافق" },
      { type: "h2", content: "4. Procedure Steps", content_ar: "٤. خطوات الإجراء" },
      { type: "callout", content: "⚠️ SAFETY NOTE: [Important safety precautions before starting]", content_ar: "⚠️ ملاحظة سلامة: [احتياطات السلامة المهمة قبل البدء]", metadata: { icon: "🛡️", color: "red" } },
      { type: "h3", content: "Step 1: Preparation", content_ar: "الخطوة ١: التحضير" },
      { type: "checklist", content: "[Preparation task 1]", content_ar: "[مهمة التحضير ١]" },
      { type: "checklist", content: "[Preparation task 2]", content_ar: "[مهمة التحضير ٢]" },
      { type: "checklist", content: "[Preparation task 3]", content_ar: "[مهمة التحضير ٣]" },
      { type: "callout", content: "💡 TIP: [Helpful tip for this step]", content_ar: "💡 نصيحة: [نصيحة مفيدة لهذه الخطوة]", metadata: { icon: "💡", color: "green" } },
      { type: "h3", content: "Step 2: Execution", content_ar: "الخطوة ٢: التنفيذ" },
      { type: "numbered_list", content: "[Detailed instruction 1]", content_ar: "[تعليم تفصيلي ١]" },
      { type: "numbered_list", content: "[Detailed instruction 2]", content_ar: "[تعليم تفصيلي ٢]" },
      { type: "numbered_list", content: "[Detailed instruction 3]", content_ar: "[تعليم تفصيلي ٣]" },
      { type: "h3", content: "Step 3: Quality Check", content_ar: "الخطوة ٣: فحص الجودة" },
      { type: "checklist", content: "[Quality check item 1]", content_ar: "[عنصر فحص الجودة ١]" },
      { type: "checklist", content: "[Quality check item 2]", content_ar: "[عنصر فحص الجودة ٢]" },
      { type: "h3", content: "Step 4: Completion", content_ar: "الخطوة ٤: الإنجاز" },
      { type: "numbered_list", content: "[Completion step 1]", content_ar: "[خطوة الإنجاز ١]" },
      { type: "numbered_list", content: "[Completion step 2]", content_ar: "[خطوة الإنجاز ٢]" },
      { type: "h2", content: "5. Exceptions & Escalation", content_ar: "٥. الاستثناءات والتصعيد" },
      { type: "text", content: "If [EXCEPTION OCCURS]:\n1. [Escalation step 1]\n2. [Escalation step 2]\n3. Contact [ROLE] immediately", content_ar: "إذا [حدوث استثناء]:\n١. [خطوة التصعيد ١]\n٢. [خطوة التصعيد ٢]\n٣. اتصل بـ [الدور] فوراً" },
      { type: "h2", content: "6. References", content_ar: "٦. المراجع" },
      { type: "bullet_list", content: "[Related document 1]", content_ar: "[مستند مرتبط ١]" },
      { type: "bullet_list", content: "[Related document 2]", content_ar: "[مستند مرتبط ٢]" },
      { type: "divider", content: "", content_ar: "" },
      { type: "h2", content: "7. Revision History", content_ar: "٧. سجل المراجعات" },
      { type: "text", content: "| Version | Date | Author | Changes |\n|---------|------|--------|----------|\n| 1.0 | [DATE] | [NAME] | Initial release |\n| 1.1 | [DATE] | [NAME] | [Description of changes] |", content_ar: "| الإصدار | التاريخ | المؤلف | التغييرات |\n|---------|--------|--------|----------|\n| ١٫٠ | [التاريخ] | [الاسم] | الإصدار الأولي |\n| ١٫١ | [التاريخ] | [الاسم] | [وصف التغييرات] |" },
    ],
    is_builtin: true, usage_count: 12,
  },

  // ═══════════════════════════════════════════════════════════
  // PROJECT PLAN — Rich Template
  // ═══════════════════════════════════════════════════════════
  {
    id: "t04", workspace_id: W, name: "Project Plan", name_ar: "خطة مشروع",
    description: "Comprehensive project plan with objectives, milestones, resources, risks, budget, and timeline",
    description_ar: "خطة مشروع شاملة مع الأهداف والمعالم والموارد والمخاطر والميزانية والجدول الزمني",
    icon: "🗺️", category: "projects", color: "#10B981",
    blocks: [
      { type: "h1", content: "🗺️ Project: [Project Name]", content_ar: "🗺️ المشروع: [اسم المشروع]" },
      { type: "divider", content: "", content_ar: "" },
      { type: "callout", content: "Project Overview:\n• Project Manager: [NAME]\n• Sponsor: [NAME]\n• Start Date: [DATE]\n• End Date: [DATE]\n• Status: [Planning / Active / On Hold / Completed]\n• Budget: [AMOUNT] EGP", content_ar: "نظرة عامة على المشروع:\n• مدير المشروع: [الاسم]\n• الراعي: [الاسم]\n• تاريخ البداية: [التاريخ]\n• تاريخ النهاية: [التاريخ]\n• الحالة: [تخطيط / نشط / معلق / مكتمل]\n• الميزانية: [المبلغ] ج.م", metadata: { icon: "📌", color: "green" } },
      { type: "h2", content: "1. Project Objective", content_ar: "١. هدف المشروع" },
      { type: "text", content: "[Clear, measurable objective statement]\n\nSuccess Criteria:\n• [Criterion 1]\n• [Criterion 2]\n• [Criterion 3]", content_ar: "[بيان هدف واضح وقابل للقياس]\n\nمعايير النجاح:\n• [المعيار ١]\n• [المعيار ٢]\n• [المعيار ٣]" },
      { type: "h2", content: "2. Team & Roles", content_ar: "٢. الفريق والأدوار" },
      { type: "text", content: "• Project Manager: [NAME] — Overall responsibility\n• Technical Lead: [NAME] — Technical decisions\n• Design Lead: [NAME] — UI/UX decisions\n• QA Lead: [NAME] — Quality assurance\n• Stakeholder: [NAME] — Approvals & feedback", content_ar: "• مدير المشروع: [الاسم] — المسؤولية العامة\n• القائد التقني: [الاسم] — القرارات التقنية\n• قائد التصميم: [الاسم] — قرارات واجهة المستخدم\n• قائد الجودة: [الاسم] — ضمان الجودة\n• صاحب المصلحة: [الاسم] — الموافقات والملاحظات" },
      { type: "h2", content: "3. Milestones & Timeline", content_ar: "٣. المعالم والجدول الزمني" },
      { type: "checklist", content: "Milestone 1: [Description] — Due: [DATE] — Owner: [NAME]", content_ar: "المعلم ١: [الوصف] — الموعد: [التاريخ] — المسؤول: [الاسم]" },
      { type: "checklist", content: "Milestone 2: [Description] — Due: [DATE] — Owner: [NAME]", content_ar: "المعلم ٢: [الوصف] — الموعد: [التاريخ] — المسؤول: [الاسم]" },
      { type: "checklist", content: "Milestone 3: [Description] — Due: [DATE] — Owner: [NAME]", content_ar: "المعلم ٣: [الوصف] — الموعد: [التاريخ] — المسؤول: [الاسم]" },
      { type: "checklist", content: "Milestone 4: [Description] — Due: [DATE] — Owner: [NAME]", content_ar: "المعلم ٤: [الوصف] — الموعد: [التاريخ] — Responsibilities: [المسؤوليات]" },
      { type: "h2", content: "4. Budget & Resources", content_ar: "٤. الميزانية والموارد" },
      { type: "text", content: "Budget Breakdown:\n• Personnel: [AMOUNT] EGP\n• Tools & Software: [AMOUNT] EGP\n• Marketing: [AMOUNT] EGP\n• Contingency (10%): [AMOUNT] EGP\n• Total: [AMOUNT] EGP", content_ar: "تفصيل الميزانية:\n• الأفراد: [المبلغ] ج.م\n• الأدوات والبرمجيات: [المبلغ] ج.م\n• التسويق: [المبلغ] ج.م\n• الطوارئ (١٠٪): [المبلغ] ج.م\n• الإجمالي: [المبلغ] ج.م" },
      { type: "h2", content: "5. Risks & Mitigation", content_ar: "٥. المخاطر والتخفيف" },
      { type: "callout", content: "Risk 1: [Description] — Probability: [High/Medium/Low] — Impact: [High/Medium/Low] — Mitigation: [Action]\n\nRisk 2: [Description] — Probability: [High/Medium/Low] — Impact: [High/Medium/Low] — Mitigation: [Action]\n\nRisk 3: [Description] — Probability: [High/Medium/Low] — Impact: [High/Medium/Low] — Mitigation: [Action]", content_ar: "المخاطرة ١: [الوصف] — الاحتمالية: [عالية/متوسطة/منخفضة] — التأثير: [عالي/متوسط/منخفض] — التخفيف: [الإجراء]\n\nالمخاطرة ٢: [الوصف] — الاحتمالية: [عالية/متوسطة/منخفضة] — التأثير: [عالي/متوسط/منخفض] — التخفيف: [الإجراء]\n\nالمخاطرة ٣: [الوصف] — الاحتمالية: [عالية/متوسطة/منخفضة] — التأثير: [عالي/متوسط/منخفض] — التخفيف: [الإجراء]", metadata: { icon: "⚠️", color: "amber" } },
      { type: "h2", content: "6. Communication Plan", content_ar: "٦. خطة الاتصال" },
      { type: "bullet_list", content: "Daily Standup: [TIME] — [DURATION] — [ATTENDEES]", content_ar: "اجتماع يومي: [الوقت] — [المدة] — [الحضور]" },
      { type: "bullet_list", content: "Weekly Status Review: [DAY] [TIME] — [ATTENDEES]", content_ar: "مراجعة حالة أسبوعية: [اليوم] [الوقت] — [الحضور]" },
      { type: "bullet_list", content: "Stakeholder Update: [FREQUENCY] — [ATTENDEES]", content_ar: "تحديث أصحاب المصلحة: [التردد] — [الحضور]" },
      { type: "h2", content: "7. Deliverables", content_ar: "٧. المخرجات" },
      { type: "checklist", content: "[Deliverable 1] — Due: [DATE]", content_ar: "[المخرج ١] — الموعد: [التاريخ]" },
      { type: "checklist", content: "[Deliverable 2] — Due: [DATE]", content_ar: "[المخرج ٢] — الموعد: [التاريخ]" },
      { type: "checklist", content: "[Deliverable 3] — Due: [DATE]", content_ar: "[المخرج ٣] — الموعد: [التاريخ]" },
      { type: "divider", content: "", content_ar: "" },
      { type: "h2", content: "8. Approval", content_ar: "٨. الموافقة" },
      { type: "text", content: "Approved by: [NAME] — Date: [DATE]\nSignature: ___________________", content_ar: "تمت الموافقة من: [الاسم] — التاريخ: [التاريخ]\nالتوقيع: ___________________" },
    ],
    is_builtin: true, usage_count: 8,
  },

  // ═══════════════════════════════════════════════════════════
  // MARKETING BRIEF — Rich Template
  // ═══════════════════════════════════════════════════════════
  {
    id: "t05", workspace_id: W, name: "Marketing Campaign Brief", name_ar: "بريف حملة تسويقية",
    description: "Complete marketing brief with objectives, audience, channels, budget, timeline, and KPIs",
    description_ar: "بريف تسويقي شامل مع الأهداف والجمهور والقنوات والميزانية والجدول الزمني ومؤشرات الأداء",
    icon: "📣", category: "marketing", color: "#EC4899",
    blocks: [
      { type: "h1", content: "📣 Marketing Campaign Brief", content_ar: "📣 بريف حملة تسويقية" },
      { type: "divider", content: "", content_ar: "" },
      { type: "callout", content: "Campaign Details:\n• Campaign Name: [NAME]\n• Campaign Type: [Brand / Product / Seasonal / Event]\n• Start Date: [DATE]\n• End Date: [DATE]\n• Budget: [AMOUNT] EGP\n• Requested by: [NAME]\n• Approved by: [NAME]", content_ar: "تفاصيل الحملة:\n• اسم الحملة: [الاسم]\n• نوع الحملة: [علامة تجارية / منتج / موسمية / حدث]\n• تاريخ البداية: [التاريخ]\n• تاريخ النهاية: [التاريخ]\n• الميزانية: [المبلغ] ج.م\n• طلبها: [الاسم]\n• تمت الموافقة من: [الاسم]", metadata: { icon: "📋", color: "pink" } },
      { type: "h2", content: "1. Campaign Objective", content_ar: "١. هدف الحملة" },
      { type: "text", content: "Primary Objective: [Increase brand awareness / Drive sales / Launch product / Build loyalty]\n\nSpecific Goal: [Measurable target, e.g., Generate 500 leads, Achieve 2M EGP in sales, Reach 100K people]", content_ar: "الهدف الأساسي: [زيادة الوعي بالعلامة / تعزيز المبيعات / إطلاق منتج / بناء الولاء]\n\nالهدف المحدد: [هدف قابل للقياس، مثال: توليد ٥٠٠ عميل محتمل، تحقيق ٢ مليون ج.م مبيعات، الوصول إلى ١٠٠ ألف شخص]" },
      { type: "h2", content: "2. Target Audience", content_ar: "٢. الجمهور المستهدف" },
      { type: "text", content: "Primary Audience:\n• Demographics: [Age, Gender, Location, Income]\n• Psychographics: [Interests, Values, Lifestyle]\n• Pain Points: [What problems do they have?]\n• Goals: [What do they want to achieve?]\n\nSecondary Audience:\n• [Description]", content_ar: "الجمهور الأساسي:\n• الديموغرافيا: [العمر، الجنس، الموقع، الدخل]\n• السيكولوجيا: [الاهتمامات، القيم، نمط الحياة]\n• نقاط الألم: [ما هي المشاكل التي يواجهونها؟]\n• الأهداف: [ماذا يريدون تحقيقه؟]\n\nالجمهور الثانوي:\n• [الوصف]" },
      { type: "h2", content: "3. Key Message", content_ar: "٣. الرسالة الرئيسية" },
      { type: "callout", content: "Core Message: [The ONE thing we want our audience to remember]\n\nSupporting Points:\n1. [Benefit 1]\n2. [Benefit 2]\n3. [Benefit 3]\n\nTone: [Professional / Playful / Luxurious / Urgent / Educational]", content_ar: "الرسالة الأساسية: [الشيء الواحد الذي نريد جمهورنا يتذكره]\n\nالنقاط الداعمة:\n١. [الفائدة ١]\n٢. [الفائدة ٢]\n٣. [الفائدة ٣]\n\nالنبرة: [مهنية / مرحة / فاخرة / عاجلة / تعليمية]", metadata: { icon: "💬", color: "blue" } },
      { type: "h2", content: "4. Channels & Tactics", content_ar: "٤. القنوات والأساليب" },
      { type: "text", content: "• Instagram: [Posts count] feed posts, [Stories count] stories, [Reels count] reels\n• Facebook: [Ads type], [Budget allocation]\n• WhatsApp: [Broadcast lists], [Messages count]\n• Email: [Emails count], [Subject lines]\n• Website: [Landing page], [Banner placement]\n• In-store: [Materials], [Display locations]\n• Other: [PR, Influencers, Events]", content_ar: "• انستغرام: [عدد المنشورات] منشور، [عدد القصص] قصة، [عدد الريلز] ريلز\n• فيسبوك: [نوع الإعلانات], [توزيع الميزانية]\n• واتساب: [قوائم البث], [عدد الرسائل]\n• البريد الإلكتروني: [عدد الرسائل], [عناوين الموضوع]\n• الموقع: [صفحة الهبوط], [موضع البانر]\n• في المتجر: [المواد], [مواقع العرض]\n• أخرى: [ Relations العامة، المؤثرون، الفعاليات]" },
      { type: "h2", content: "5. Budget Allocation", content_ar: "٥. توزيع الميزانية" },
      { type: "text", content: "Total Budget: [AMOUNT] EGP\n\n• Instagram Ads: [AMOUNT] ([XX]%)\n• Facebook Ads: [AMOUNT] ([XX]%)\n• Content Creation: [AMOUNT] ([XX]%)\n• Influencer Partnerships: [AMOUNT] ([XX]%)\n• Print Materials: [AMOUNT] ([XX]%)\n• Contingency: [AMOUNT] ([XX]%)", content_ar: "إجمالي الميزانية: [المبلغ] ج.م\n\n• إعلانات انستغرام: [المبلغ] ([XX]٪)\n• إعلانات فيسبوك: [المبلغ] ([XX]٪)\n• إنشاء المحتوى: [المبلغ] ([XX]٪)\n• شراكات المؤثرين: [المبلغ] ([XX]٪)\n• مواد مطبوعة: [المبلغ] ([XX]٪)\n• الطوارئ: [المبلغ] ([XX]٪)" },
      { type: "h2", content: "6. Timeline", content_ar: "٦. الجدول الزمني" },
      { type: "numbered_list", content: "Week 1: [Phase — e.g., Content creation & asset preparation]", content_ar: "الأسبوع ١: [المرحلة — مثال: إنشاء المحتوى وتحضير المواد]" },
      { type: "numbered_list", content: "Week 2: [Phase — e.g., Campaign launch & initial ads]", content_ar: "الأسبوع ٢: [المرحلة — مثال: إطلاق الحملة والإعلانات الأولية]" },
      { type: "numbered_list", content: "Week 3: [Phase — e.g., Optimization & scaling]", content_ar: "الأسبوع ٣: [المرحلة — مثال: التحسين والتوسيع]" },
      { type: "numbered_list", content: "Week 4: [Phase — e.g., Wrap-up & reporting]", content_ar: "الأسبوع ٤: [المرحلة — مثال: الإنهاء والتقارير]" },
      { type: "h2", content: "7. KPIs & Success Metrics", content_ar: "٧. مؤشرات الأداء ومقاييس النجاح" },
      { type: "text", content: "• Reach: [TARGET] people\n• Impressions: [TARGET]\n• Engagement Rate: [TARGET]%\n• Click-through Rate: [TARGET]%\n• Conversions: [TARGET]\n• ROI: [TARGET]%\n• Revenue Generated: [TARGET] EGP", content_ar: "• الوصول: [الهدف] شخص\n• الظهور: [الهدف]\n• معدل التفاعل: [الهدف]٪\n• معدل النقر: [الهدف]٪\n• التحويلات: [الهدف]\n• العائد على الاستثمار: [الهدف]٪\n• الإيرادات المحققة: [الهدف] ج.م" },
      { type: "h2", content: "8. Creative Requirements", content_ar: "٨. المتطلبات الإبداعية" },
      { type: "bullet_list", content: "Brand guidelines: [Link or reference]", content_ar: "إرشادات العلامة التجارية: [الرابط أو المرجع]" },
      { type: "bullet_list", content: "Visual style: [Description]", content_ar: "النمط البصري: [الوصف]" },
      { type: "bullet_list", content: "Copywriting tone: [Description]", content_ar: "نبرة الكتابة: [الوصف]" },
      { type: "bullet_list", content: "Required assets: [List]", content_ar: "المواد المطلوبة: [القائمة]" },
      { type: "divider", content: "", content_ar: "" },
      { type: "h2", content: "9. Approval", content_ar: "٩. الموافقة" },
      { type: "text", content: "Marketing Manager: [NAME] — Date: [DATE]\nBrand Manager: [NAME] — Date: [DATE]\nFinance: [NAME] — Date: [DATE]", content_ar: "مدير التسويق: [الاسم] — التاريخ: [التاريخ]\nمدير العلامة التجارية: [الاسم] — التاريخ: [التاريخ]\nالمالية: [الاسم] — التاريخ: [التاريخ]" },
    ],
    is_builtin: true, usage_count: 5,
  },

  // ═══════════════════════════════════════════════════════════
  // PRODUCT LAUNCH — Rich Template
  // ═══════════════════════════════════════════════════════════
  {
    id: "t06", workspace_id: W, name: "Product Launch Checklist", name_ar: "قائمة التحقق من إطلاق المنتج",
    description: "Complete product launch checklist with pre-launch, launch day, and post-launch phases",
    description_ar: "قائمة تحقق شاملة لإطلاق المنتج مع مراحل ما قبل الإطلاق ويوم الإطلاق وما بعد الإطلاق",
    icon: "🚀", category: "marketing", color: "#EF4444",
    blocks: [
      { type: "h1", content: "🚀 Product Launch: [Product Name]", content_ar: "🚀 إطلاق المنتج: [اسم المنتج]" },
      { type: "divider", content: "", content_ar: "" },
      { type: "callout", content: "Launch Details:\n• Product: [NAME]\n• Launch Date: [DATE]\n• Category: [CATEGORY]\n• Price: [AMOUNT] EGP\n• Target Audience: [DESCRIPTION]\n• Launch Owner: [NAME]\n• Status: [Planning / Ready / Live / Complete]", content_ar: "تفاصيل الإطلاق:\n• المنتج: [الاسم]\n• تاريخ الإطلاق: [التاريخ]\n• الفئة: [الفئة]\n• السعر: [المبلغ] ج.م\n• الجمهور المستهدف: [الوصف]\n• مسؤول الإطلاق: [الاسم]\n• الحالة: [تخطيط / جاهز / مباشر / مكتمل]", metadata: { icon: "🎯", color: "red" } },
      { type: "h2", content: "📦 Pre-Launch (4 weeks before)", content_ar: "📦 ما قبل الإطلاق (٤ أسابيع قبل)" },
      { type: "h3", content: "Product Readiness", content_ar: "جاهزية المنتج" },
      { type: "checklist", content: "Final product photos taken and edited", content_ar: "تم التقاط وتعديل صور المنتج النهائية" },
      { type: "checklist", content: "Product descriptions written (EN + AR)", content_ar: "كتبت أوصاف المنتج (إنجليزي + عربي)" },
      { type: "checklist", content: "Pricing finalized", content_ar: "تم تثبيت الأسعار" },
      { type: "checklist", content: "Inventory confirmed", content_ar: "تم تأكيد المخزون" },
      { type: "checklist", content: "Quality check passed", content_ar: "اجتاز فحص الجودة" },
      { type: "h3", content: "Marketing Preparation", content_ar: "التحضير التسويقي" },
      { type: "checklist", content: "Social media content calendar created", content_ar: "تم إنشاء تقويم محتوى وسائل التواصل" },
      { type: "checklist", content: "Product page live on website", content_ar: "صفحة المنتج مباشرة على الموقع" },
      { type: "checklist", content: "Shopify listing updated", content_ar: "تم تحديث قائمة شوبيفاي" },
      { type: "checklist", content: "Email campaign designed", content_ar: "صميم حملة البريد الإلكتروني" },
      { type: "checklist", content: "WhatsApp broadcast list prepared", content_ar: "تم إعداد قائمة بث واتساب" },
      { type: "checklist", content: "Influencer partnerships confirmed", content_ar: "تم تأكيد شراكات المؤثرين" },
      { type: "h3", content: "Operations", content_ar: "العمليات" },
      { type: "checklist", content: "Warehouse team briefed", content_ar: "تم تدريب فريق المخزن" },
      { type: "checklist", content: "Delivery logistics confirmed", content_ar: "تم تأكيد لوجستيات التوصيل" },
      { type: "checklist", content: "Customer service team prepared", content_ar: "تم تحضير فريق خدمة العملاء" },
      { type: "h2", content: "🎯 Launch Day", content_ar: "🎯 يوم الإطلاق" },
      { type: "checklist", content: "Social media posts published", content_ar: "تم نشر منشورات التواصل الاجتماعي" },
      { type: "checklist", content: "Email blast sent", content_ar: "تم إرسال حملة البريد الإلكتروني" },
      { type: "checklist", content: "WhatsApp broadcast sent", content_ar: "تم إرسال البث عبر واتساب" },
      { type: "checklist", content: "Website updated with launch banner", content_ar: "تم تحديث الموقع ببانر الإطلاق" },
      { type: "checklist", content: "In-store displays set up", content_ar: "تم إعداد عروض المتجر" },
      { type: "checklist", content: "Monitor social media engagement", content_ar: "مراقبة التفاعل على وسائل التواصل" },
      { type: "checklist", content: "Respond to customer inquiries", content_ar: "الرد على استفسارات العملاء" },
      { type: "h2", content: "📈 Post-Launch (2 weeks after)", content_ar: "📈 ما بعد الإطلاق (أسبوعان بعد)" },
      { type: "checklist", content: "Review sales data vs targets", content_ar: "مراجعة بيانات المبيعات مقارنة بالأهداف" },
      { type: "checklist", content: "Analyze social media metrics", content_ar: "تحليل مقاييس التواصل الاجتماعي" },
      { type: "checklist", content: "Collect customer feedback", content_ar: "جمع ملاحظات العملاء" },
      { type: "checklist", content: "Send thank-you messages to VIP customers", content_ar: "إرسال رسائل شكر لعملاء VIP" },
      { type: "checklist", content: "Create launch performance report", content_ar: "إنشاء تقرير أداء الإطلاق" },
      { type: "checklist", content: "Document lessons learned", content_ar: "توثيق الدروس المستفادة" },
      { type: "checklist", content: "Plan follow-up campaign", content_ar: "تخطيط حملة المتابعة" },
      { type: "divider", content: "", content_ar: "" },
      { type: "h2", content: "📊 Launch Metrics", content_ar: "📊 مقاييس الإطلاق" },
      { type: "text", content: "• Units Sold: [NUMBER]\n• Revenue: [AMOUNT] EGP\n• Website Traffic: [NUMBER] visits\n• Social Media Reach: [NUMBER] people\n• Customer Reviews: [NUMBER] reviews (avg [X]/5)\n• Returns/Exchanges: [NUMBER]", content_ar: "• الوحدات المباعة: [العدد]\n• الإيرادات: [المبلغ] ج.م\n• زيارات الموقع: [العدد]\n• وصول التواصل الاجتماعي: [العدد] شخص\n• تقييمات العملاء: [العدد] تقييم (متوسط [X]/٥)\n• المرتجعات/الاستبدالات: [العدد]" },
    ],
    is_builtin: true, usage_count: 3,
  },

  // ═══════════════════════════════════════════════════════════
  // HIRING PROCESS — Rich Template
  // ═══════════════════════════════════════════════════════════
  {
    id: "t07", workspace_id: W, name: "Hiring Process", name_ar: "عملية التوظيف",
    description: "Complete hiring process with job description, interview stages, evaluation criteria, and onboarding",
    description_ar: "عملية توظيف شاملة مع وصف الوظيفة ومراحل المقابلة ومعايير التقييم والتأهيل",
    icon: "👥", category: "hr", color: "#06B6D4",
    blocks: [
      { type: "h1", content: "👥 Hiring: [Position Title]", content_ar: "👥 التوظيف: [المنصب]" },
      { type: "divider", content: "", content_ar: "" },
      { type: "callout", content: "Hiring Details:\n• Position: [TITLE]\n• Department: [DEPARTMENT]\n• Branch: [LOCATION]\n• Employment Type: [Full-time / Part-time / Contract]\n• Salary Range: [MIN] — [MAX] EGP\n• Hiring Manager: [NAME]\n• HR Contact: [NAME]\n• Posted Date: [DATE]\n• Deadline: [DATE]", content_ar: "تفاصيل التوظيف:\n• المنصب: [العنوان]\n• القسم: [القسم]\n• الفرع: [المكان]\n• نوع التوظيف: [دوام كامل / دوام جزئي / عقد]\n• نطاق الراتب: [الحد الأدنى] — [الحد الأعلى] ج.م\n• المدير المعني: [الاسم]\n• جهة اتصال الموارد البشرية: [الاسم]\n• تاريخ النشر: [التاريخ]\n• الموعد النهائي: [التاريخ]", metadata: { icon: "📋", color: "cyan" } },
      { type: "h2", content: "1. Job Description", content_ar: "١. وصف الوظيفة" },
      { type: "h3", content: "Responsibilities", content_ar: "المسؤوليات" },
      { type: "bullet_list", content: "[Key responsibility 1]", content_ar: "[المسؤولية الرئيسية ١]" },
      { type: "bullet_list", content: "[Key responsibility 2]", content_ar: "[المسؤولية الرئيسية ٢]" },
      { type: "bullet_list", content: "[Key responsibility 3]", content_ar: "[المسؤولية الرئيسية ٣]" },
      { type: "h3", content: "Requirements", content_ar: "المتطلبات" },
      { type: "bullet_list", content: "[Required qualification 1]", content_ar: "[المؤهل المطلوب ١]" },
      { type: "bullet_list", content: "[Required qualification 2]", content_ar: "[المؤهل المطلوب ٢]" },
      { type: "bullet_list", content: "[Required experience]", content_ar: "[الخبرة المطلوبة]" },
      { type: "h3", content: "Nice to Have", content_ar: "مفضّل" },
      { type: "bullet_list", content: "[Preferred qualification 1]", content_ar: "[المؤهل المفضل ١]" },
      { type: "bullet_list", content: "[Preferred qualification 2]", content_ar: "[المؤهل المفضل ٢]" },
      { type: "h2", content: "2. Interview Stages", content_ar: "٢. مراحل المقابلة" },
      { type: "h3", content: "Stage 1: Phone Screening (15 min)", content_ar: "المرحلة ١: المقابلة الهاتفية (١٥ دقيقة)" },
      { type: "checklist", content: "Verify basic qualifications", content_ar: "التحقق من المؤهلات الأساسية" },
      { type: "checklist", content: "Check salary expectations", content_ar: "التحقق من توقعات الراتب" },
      { type: "checklist", content: "Assess communication skills", content_ar: "تقييم مهارات التواصل" },
      { type: "h3", content: "Stage 2: Technical Interview (45 min)", content_ar: "المرحلة ٢: المقابلة التقنية (٤٥ دقيقة)" },
      { type: "checklist", content: "Skills assessment", content_ar: "تقييم المهارات" },
      { type: "checklist", content: "Portfolio review (if applicable)", content_ar: "مراجعة المحفظة (إذا كان ذلك مطبقاً)" },
      { type: "checklist", content: "Problem-solving exercise", content_ar: "تمرين حل المشكلات" },
      { type: "h3", content: "Stage 3: Culture Fit Interview (30 min)", content_ar: "المرحلة ٣: مقابلة التوافق الثقافي (٣٠ دقيقة)" },
      { type: "checklist", content: "Team dynamics assessment", content_ar: "تقييم ديناميكيات الفريق" },
      { type: "checklist", content: "Values alignment check", content_ar: "التحقق من التوافق مع القيم" },
      { type: "checklist", content: "Growth potential discussion", content_ar: "مناقشة الإمكانات النموية" },
      { type: "h3", content: "Stage 4: Final Decision", content_ar: "المرحلة ٤: القرار النهائي" },
      { type: "checklist", content: "Reference checks", content_ar: "التحقق من المراجع" },
      { type: "checklist", content: "Offer preparation", content_ar: "تحضير العرض" },
      { type: "checklist", content: "Salary negotiation", content_ar: "تفاوض الراتب" },
      { type: "h2", content: "3. Evaluation Scorecard", content_ar: "٣. بطاقة التقييم" },
      { type: "text", content: "Candidate: [NAME]\n\n| Criteria | Weight | Score (1-5) | Weighted Score |\n|----------|--------|-------------|----------------|\n| Technical Skills | 30% | [X] | [X] |\n| Communication | 20% | [X] | [X] |\n| Cultural Fit | 20% | [X] | [X] |\n| Experience | 20% | [X] | [X] |\n| Growth Potential | 10% | [X] | [X] |\n| Total | 100% | — | [X]/5.0 |", content_ar: "المرشح: [الاسم]\n\n| المعيار | الوزن | الدرجة (١-٥) | الدرجة الموزونة |\n|---------|--------|-------------|----------------|\n| المهارات التقنية | ٣٠٪ | [X] | [X] |\n| التواصل | ٢٠٪ | [X] | [X] |\n| التوافق الثقافي | ٢٠٪ | [X] | [X] |\n| الخبرة | ٢٠٪ | [X] | [X] |\n| إمكانات النمو | ١٠٪ | [X] | [X] |\n| الإجمالي | ١٠٠٪ | — | [X]/٥٫٠ |" },
      { type: "h2", content: "4. Offer & Onboarding", content_ar: "٤. العرض والتأهيل" },
      { type: "checklist", content: "Send offer letter", content_ar: "إرسال خطاب العرض" },
      { type: "checklist", content: "Contract signed", content_ar: "تم توقيع العقد" },
      { type: "checklist", content: "Workspace setup (laptop, phone, email)", content_ar: "إعداد مكان العمل (لابتوب، هاتف، بريد إلكتروني)" },
      { type: "checklist", content: "Orientation session scheduled", content_ar: "تم جدولة جلسة التوجيه" },
      { type: "checklist", content: "Team introduction meeting", content_ar: "اجتماع تعريف الفريق" },
      { type: "checklist", content: "Training plan created", content_ar: "تم إنشاء خطة التدريب" },
    ],
    is_builtin: true, usage_count: 4,
  },

  // ═══════════════════════════════════════════════════════════
  // CLIENT PROPOSAL — Rich Template
  // ═══════════════════════════════════════════════════════════
  {
    id: "t08", workspace_id: W, name: "Client Proposal", name_ar: "عرض عميل",
    description: "Professional client proposal with executive summary, solution, pricing, timeline, and terms",
    description_ar: "عرض عميل احترافي مع ملخص تنفيذي وحل وتسعير وجداول زمنية وشروط",
    icon: "💼", category: "sales", color: "#1E3A5F",
    blocks: [
      { type: "h1", content: "💼 Proposal: [Client Name]", content_ar: "💼 عرض: [اسم العميل]" },
      { type: "divider", content: "", content_ar: "" },
      { type: "text", content: "Prepared for: [CLIENT NAME]\nPrepared by: [YOUR NAME]\nDate: [DATE]\nProposal Valid Until: [DATE]\nProposal Reference: [PROP-XXX]", content_ar: "إعداد لـ: [اسم العميل]\nإعداد: [اسمك]\nالتاريخ: [التاريخ]\nالعرض ساري حتى: [التاريخ]\nمرجع العرض: [PROP-XXX]" },
      { type: "divider", content: "", content_ar: "" },
      { type: "h2", content: "1. Executive Summary", content_ar: "١. الملخص التنفيذي" },
      { type: "text", content: "Dear [CLIENT NAME],\n\nThank you for the opportunity to present our proposal for [PROJECT/PRODUCT]. We understand your need for [DESCRIPTION OF NEED] and are confident our solution will deliver [KEY BENEFIT].\n\nOur team has extensive experience in [RELEVANT AREA] and we are committed to delivering [QUALITY/VALUE] that exceeds your expectations.", content_ar: "عزيزي [اسم العميل],\n\nشكراً على الفرصة لتقديم عرضنا لـ [المشروع/المنتج]. نحن نفهم حاجتكم لـ [وصف الحاجة] واثقون من أن حلنا سيقدم [الفائدة الرئيسية].\n\nفريقنا لديه خبرة واسعة في [ال_area ذات الصلة] وملتزمون بتقديم [الجودة/القيمة] الذي يفوق توقعاتكم." },
      { type: "h2", content: "2. Understanding Your Needs", content_ar: "٢. فهم احتياجاتكم" },
      { type: "bullet_list", content: "[Need 1 — from client's perspective]", content_ar: "[الحاجة ١ — من منظور العميل]" },
      { type: "bullet_list", content: "[Need 2 — from client's perspective]", content_ar: "[الحاجة ٢ — من منظور العميل]" },
      { type: "bullet_list", content: "[Need 3 — from client's perspective]", content_ar: "[الحاجة ٣ — من منظور العميل]" },
      { type: "h2", content: "3. Our Solution", content_ar: "٣. حلنا" },
      { type: "text", content: "We propose the following solution:\n\n[Description of the overall approach]\n\nKey Features:\n• [Feature 1]\n• [Feature 2]\n• [Feature 3]\n• [Feature 4]", content_ar: "نقترح الحل التالي:\n\n[وصف النهج العام]\n\nالميزات الرئيسية:\n• [الميزة ١]\n• [الميزة ٢]\n• [الميزة ٣]\n• [الميزة ٤]" },
      { type: "h2", content: "4. Pricing", content_ar: "٤. التسعير" },
      { type: "text", content: "| Item | Description | Quantity | Unit Price | Total |\n|------|-------------|----------|------------|-------|\n| [Item 1] | [Description] | [Qty] | [Price] EGP | [Total] EGP |\n| [Item 2] | [Description] | [Qty] | [Price] EGP | [Total] EGP |\n| [Item 3] | [Description] | [Qty] | [Price] EGP | [Total] EGP |\n| | | | **Subtotal** | **[Amount] EGP** |\n| | | | VAT (14%) | [Amount] EGP |\n| | | | **Total** | **[Amount] EGP** |", content_ar: "| البند | الوصف | الكمية | سعر الوحدة | الإجمالي |\n|-------|--------|--------|------------|----------|\n| [البند ١] | [الوصف] | [الكمية] | [السعر] ج.م | [الإجمالي] ج.م |\n| [البند ٢] | [الوصف] | [الكمية] | [السعر] ج.م | [الإجمالي] ج.م |\n| [البند ٣] | [الوصف] | [الكمية] | [السعر] ج.م | [الإجمالي] ج.م |\n| | | | **المجموع الفرعي** | **[المبلغ] ج.م** |\n| | | | ضريبة القيمة المضافة (١٤٪) | [المبلغ] ج.م |\n| | | | **الإجمالي** | **[المبلغ] ج.م** |" },
      { type: "h2", content: "5. Timeline", content_ar: "٥. الجدول الزمني" },
      { type: "numbered_list", content: "Phase 1: [Name] — [Duration] — [Deliverables]", content_ar: "المرحلة ١: [الاسم] — [المدة] — [المخرجات]" },
      { type: "numbered_list", content: "Phase 2: [Name] — [Duration] — [Deliverables]", content_ar: "المرحلة ٢: [الاسم] — [المدة] — [المخرجات]" },
      { type: "numbered_list", content: "Phase 3: [Name] — [Duration] — [Deliverables]", content_ar: "المرحلة ٣: [الاسم] — [المدة] — [المخرجات]" },
      { type: "h2", content: "6. Why Choose Us", content_ar: "٦. لماذا تختارنا" },
      { type: "bullet_list", content: "[Differentiator 1 — e.g., 10+ years experience in fashion]", content_ar: "[التمييز ١ — مثال: أكثر من ١٠ سنوات خبرة في الموضة]" },
      { type: "bullet_list", content: "[Differentiator 2 — e.g., Premium quality materials]", content_ar: "[التمييز ٢ — مثال: مواد عالية الجودة]" },
      { type: "bullet_list", content: "[Differentiator 3 — e.g., Dedicated project manager]", content_ar: "[التمييز ٣ — مثال: مدير مشروع مخصص]" },
      { type: "h2", content: "7. Terms & Conditions", content_ar: "٧. الشروط والأحكام" },
      { type: "bullet_list", content: "Payment: 50% upfront, 50% upon delivery", content_ar: "الدفع: ٥٠٪ مقدماً، ٥٠٪ عند التسليم" },
      { type: "bullet_list", content: "Delivery: Within [XX] business days of payment", content_ar: "التسليم: خلال [XX] يوم عمل من الدفع" },
      { type: "bullet_list", content: "Warranty: [XX] months on all products", content_ar: "الضمان: [XX] شهر على جميع المنتجات" },
      { type: "bullet_list", content: "Cancellation: [Terms]", content_ar: "الإلغاء: [الشروط]" },
      { type: "h2", content: "8. Next Steps", content_ar: "٨. الخطوات التالية" },
      { type: "numbered_list", content: "Review this proposal", content_ar: "مراجعة هذا العرض" },
      { type: "numbered_list", content: "Schedule a call to discuss questions", content_ar: "جدولة مكالمة لمناقشة الأسئلة" },
      { type: "numbered_list", content: "Sign agreement and make initial payment", content_ar: "توقيع الاتفاقية وتقديم الدفعة الأولية" },
      { type: "numbered_list", content: "Project kickoff", content_ar: "بدء المشروع" },
      { type: "divider", content: "", content_ar: "" },
      { type: "text", content: "We look forward to working with you.\n\nBest regards,\n[NAME]\n[TITLE]\n[COMPANY]\n[PHONE] | [EMAIL]", content_ar: "نتطلع للعمل معكم.\n\nمع أطيب التحيات،\n[الاسم]\n[المنصب]\n[الشركة]\n[الهاتف] | [البريد الإلكتروني]" },
    ],
    is_builtin: true, usage_count: 7,
  },

  // ═══════════════════════════════════════════════════════════
  // DAILY NOTES — Rich Template
  // ═══════════════════════════════════════════════════════════
  {
    id: "t09", workspace_id: W, name: "Daily Journal", name_ar: "دفتر يومي",
    description: "Daily journaling template with focus, gratitude, accomplishments, and reflection",
    description_ar: "قالب تدوين يومي مع التركيز والامتنان والإنجازات والتأمل",
    icon: "📝", category: "personal", color: "#64748B",
    blocks: [
      { type: "h1", content: "📝 [DATE] — Daily Journal", content_ar: "📝 [التاريخ] — الدفتر اليومي" },
      { type: "divider", content: "", content_ar: "" },
      { type: "callout", content: "🌅 Morning Intention:\nToday I will focus on...", content_ar: "🌅 نية الصباح:\nاليوم سأركز على...", metadata: { icon: "☀️", color: "amber" } },
      { type: "h2", content: "🎯 Today's Top 3 Priorities", content_ar: "🎯 أولويات اليوم الثلاث" },
      { type: "numbered_list", content: "[Priority 1 — Most important task]", content_ar: "[الأولوية ١ — أهم مهمة]" },
      { type: "numbered_list", content: "[Priority 2 — Important task]", content_ar: "[الأولوية ٢ — مهمة مهمة]" },
      { type: "numbered_list", content: "[Priority 3 — Nice to complete]", content_ar: "[الأولوية ٣ — جيدة للإنجاز]" },
      { type: "h2", content: "✅ Accomplishments", content_ar: "✅ الإنجازات" },
      { type: "checklist", content: "[Task completed 1]", content_ar: "[مهمة مكتملة ١]" },
      { type: "checklist", content: "[Task completed 2]", content_ar: "[مهمة مكتملة ٢]" },
      { type: "checklist", content: "[Task completed 3]", content_ar: "[مهمة مكتملة ٣]" },
      { type: "h2", content: "🙏 Gratitude", content_ar: "🙏 الامتنان" },
      { type: "bullet_list", content: "[Something I'm grateful for today]", content_ar: "[شيء أشكر الله عليه اليوم]" },
      { type: "bullet_list", content: "[Something I'm grateful for today]", content_ar: "[شيء أشكر الله عليه اليوم]" },
      { type: "bullet_list", content: "[Something I'm grateful for today]", content_ar: "[شيء أشكر الله عليه اليوم]" },
      { type: "h2", content: "💭 Reflections & Notes", content_ar: "💭 التأملات والملاحظات" },
      { type: "text", content: "[What went well today?]\n\n[What could be improved?]\n\n[What did I learn?]", content_ar: "[ما الذي مر بشكل جيد اليوم؟]\n\n[ما الذي يمكن تحسينه؟]\n\n[ما الذي تعلمته؟]" },
      { type: "h2", content: "🌙 Evening Review", content_ar: "🌙 مراجعة المساء" },
      { type: "text", content: "Energy level today: [1-10]\nMood: [Description]\nSleep last night: [Quality]\nExercise: [Yes/No — What?]", content_ar: "مستوى الطاقة اليوم: [١-١٠]\nالمزاج: [الوصف]\nالنوم الليلة الماضية: [الجودة]\nالتمارين الرياضية: [نعم/لا — ماذا؟]" },
      { type: "h2", content: "📅 Tomorrow's Plan", content_ar: "📅 خطة الغد" },
      { type: "checklist", content: "[Task for tomorrow 1]", content_ar: "[مهمة للغد ١]" },
      { type: "checklist", content: "[Task for tomorrow 2]", content_ar: "[مهمة للغد ٢]" },
      { type: "checklist", content: "[Task for tomorrow 3]", content_ar: "[مهمة للغد ٣]" },
    ],
    is_builtin: true, usage_count: 32,
  },

  // ═══════════════════════════════════════════════════════════
  // EMPTY PAGE
  // ═══════════════════════════════════════════════════════════
  {
    id: "t10", workspace_id: W, name: "Empty Page", name_ar: "صفحة فارغة",
    description: "Start with a blank page — perfect for freeform notes and ideas",
    description_ar: "ابدأ بصفحة فارغة — مثالية للملاحظات والأفكار الحرّة",
    icon: "📄", category: "general", color: "#94A3B8",
    blocks: [],
    is_builtin: true, usage_count: 45,
  },
];

// ═══════════════════════════════════════════════════════════
// DATABASES
// ═══════════════════════════════════════════════════════════

export const STUDIO_DATABASES: StudioDatabase[] = [
  {
    id: "db01", workspace_id: W, page_id: "p06", name: "Product Roadmap", name_ar: "خارطة طريق المنتجات", icon: "🗺️",
    properties: [
      { id: "dp01", name: "Feature", name_ar: "الميزة", type: "text" },
      { id: "dp02", name: "Status", name_ar: "الحالة", type: "status", options: [{ label: "Planned", label_ar: "مخطط", color: "#94A3B8" }, { label: "In Progress", label_ar: "قيد التنفيذ", color: "#3B82F6" }, { label: "Review", label_ar: "مراجعة", color: "#F59E0B" }, { label: "Done", label_ar: "مكتمل", color: "#10B981" }] },
      { id: "dp03", name: "Priority", name_ar: "الأولوية", type: "select", options: [{ label: "High", label_ar: "عالية", color: "#EF4444" }, { label: "Medium", label_ar: "متوسطة", color: "#F59E0B" }, { label: "Low", label_ar: "منخفضة", color: "#10B981" }] },
      { id: "dp04", name: "Assignee", name_ar: "المسؤول", type: "person" },
      { id: "dp05", name: "Due Date", name_ar: "الموعد", type: "date" },
    ],
    views: [
      { id: "dv01", name: "Board", name_ar: "لوحة", type: "board", filters: [], sorts: [], visible_properties: ["dp01", "dp02", "dp03", "dp04"] },
      { id: "dv02", name: "Table", name_ar: "جدول", type: "table", filters: [], sorts: [{ property: "dp05", direction: "asc" }], visible_properties: ["dp01", "dp02", "dp03", "dp04", "dp05"] },
    ],
    created_at: d(20),
  },
  {
    id: "db02", workspace_id: W, page_id: "p03", name: "Marketing Tasks", name_ar: "مهام التسويق", icon: "📣",
    properties: [
      { id: "dp06", name: "Task", name_ar: "المهمة", type: "text" },
      { id: "dp07", name: "Status", name_ar: "الحالة", type: "status", options: [{ label: "To Do", label_ar: "للتنفيذ", color: "#94A3B8" }, { label: "In Progress", label_ar: "قيد التنفيذ", color: "#3B82F6" }, { label: "Done", label_ar: "مكتمل", color: "#10B981" }] },
      { id: "dp08", name: "Channel", name_ar: "القناة", type: "multi_select", options: [{ label: "Instagram", label_ar: "انستغرام", color: "#E1306C" }, { label: "Facebook", label_ar: "فيسبوك", color: "#1877F2" }, { label: "WhatsApp", label_ar: "واتساب", color: "#25D366" }, { label: "Email", label_ar: "بريد", color: "#3B82F6" }] },
      { id: "dp09", name: "Budget", name_ar: "الميزانية", type: "currency" },
      { id: "dp10", name: "Due Date", name_ar: "الموعد", type: "date" },
    ],
    views: [
      { id: "dv03", name: "Board", name_ar: "لوحة", type: "board", filters: [], sorts: [], visible_properties: ["dp06", "dp07", "dp08", "dp10"] },
      { id: "dv04", name: "Calendar", name_ar: "تقويم", type: "calendar", filters: [], sorts: [{ property: "dp10", direction: "asc" }], visible_properties: ["dp06", "dp07"] },
    ],
    created_at: d(30),
  },
];

export const STUDIO_DATABASE_ROWS: StudioDatabaseRow[] = [
  { id: "dr01", workspace_id: W, database_id: "db01", properties: { dp01: "Summer Collection Launch", dp02: "In Progress", dp03: "High", dp04: "Fatma Hassan", dp05: "2026-07-15" }, created_at: d(20), updated_at: d(0) },
  { id: "dr02", workspace_id: W, database_id: "db01", properties: { dp01: "CRM Module v2", dp02: "Planned", dp03: "High", dp04: "Ahmed Ali", dp05: "2026-08-01" }, created_at: d(15), updated_at: d(5) },
  { id: "dr03", workspace_id: W, database_id: "db01", properties: { dp01: "Shopify Integration", dp02: "In Progress", dp03: "High", dp04: "Mohamed Gamal", dp05: "2026-07-30" }, created_at: d(20), updated_at: d(2) },
  { id: "dr04", workspace_id: W, database_id: "db01", properties: { dp01: "Mobile App", dp02: "Planned", dp03: "Medium", dp04: "Ahmed Ali", dp05: "2026-09-01" }, created_at: d(10), updated_at: d(10) },
  { id: "dr05", workspace_id: W, database_id: "db01", properties: { dp01: "Loyalty Program v2", dp02: "Review", dp03: "Medium", dp04: "Sara Mahmoud", dp05: "2026-07-20" }, created_at: d(25), updated_at: d(1) },
  { id: "dr06", workspace_id: W, database_id: "db01", properties: { dp01: "Warehouse Automation", dp02: "Planned", dp03: "Low", dp04: "Omar Salah", dp05: "2026-10-01" }, created_at: d(10), updated_at: d(10) },
  { id: "dr07", workspace_id: W, database_id: "db02", properties: { dp06: "Summer Collection Instagram Posts", dp07: "In Progress", dp08: ["Instagram"], dp09: 15000, dp10: "2026-06-20" }, created_at: d(10), updated_at: d(0) },
  { id: "dr08", workspace_id: W, database_id: "db02", properties: { dp06: "VIP Client WhatsApp Campaign", dp07: "To Do", dp08: ["WhatsApp", "Email"], dp09: 5000, dp10: "2026-06-25" }, created_at: d(8), updated_at: d(8) },
  { id: "dr09", workspace_id: W, database_id: "db02", properties: { dp06: "Facebook Ad Campaign — Summer", dp07: "To Do", dp08: ["Facebook", "Instagram"], dp09: 25000, dp10: "2026-07-01" }, created_at: d(5), updated_at: d(5) },
  { id: "dr10", workspace_id: W, database_id: "db02", properties: { dp06: "Bridal Fair Booth Design", dp07: "Done", dp08: ["Instagram"], dp09: 45000, dp10: "2026-06-10" }, created_at: d(30), updated_at: d(10) },
  { id: "dr11", workspace_id: W, database_id: "db02", properties: { dp06: "Customer Testimonial Video", dp07: "In Progress", dp08: ["Instagram", "Facebook"], dp09: 8000, dp10: "2026-06-18" }, created_at: d(7), updated_at: d(1) },
];

// ═══════════════════════════════════════════════════════════
// MEDIA
// ═══════════════════════════════════════════════════════════

export const STUDIO_MEDIA: StudioMedia[] = [
  { id: "m01", workspace_id: W, name: "Brand Logo — Full Color", type: "image", url: "#", thumbnail_url: "#", size: 245000, mime_type: "image/png", uploaded_by: "Fatma Hassan", uploaded_at: d(90), page_id: "p08", tags: ["brand", "logo"] },
  { id: "m02", workspace_id: W, name: "Summer Collection Mood Board", type: "image", url: "#", thumbnail_url: "#", size: 1800000, mime_type: "image/jpeg", uploaded_by: "Fatma Hassan", uploaded_at: d(5), page_id: "p11", tags: ["summer", "moodboard"] },
  { id: "m03", workspace_id: W, name: "HR Handbook PDF", type: "pdf", url: "#", thumbnail_url: "#", size: 520000, mime_type: "application/pdf", uploaded_by: "Mona Saad", uploaded_at: d(55), page_id: "p02", tags: ["hr", "handbook"] },
  { id: "m04", workspace_id: W, name: "Factory Floor Plan", type: "image", url: "#", thumbnail_url: "#", size: 890000, mime_type: "image/png", uploaded_by: "Mohamed Gamal", uploaded_at: d(30), page_id: "p10", tags: ["factory", "layout"] },
  { id: "m05", workspace_id: W, name: "Brand Color Palette", type: "image", url: "#", thumbnail_url: "#", size: 156000, mime_type: "image/png", uploaded_by: "Fatma Hassan", uploaded_at: d(85), page_id: "p08", tags: ["brand", "colors"] },
  { id: "m06", workspace_id: W, name: "Q2 Sales Presentation", type: "pdf", url: "#", thumbnail_url: "#", size: 3200000, mime_type: "application/pdf", uploaded_by: "Sara Mahmoud", uploaded_at: d(15), page_id: "p03", tags: ["sales", "presentation"] },
];

// ═══════════════════════════════════════════════════════════
// MEMBERS
// ═══════════════════════════════════════════════════════════

export const STUDIO_MEMBERS: StudioMember[] = [
  { id: "sm01", workspace_id: W, name: "Ahmed Ali", name_ar: "أحمد علي", email: "ahmed@thoth.com", avatar: "#1E3A5F", role: "admin", last_active: d(0), status: "active" },
  { id: "sm02", workspace_id: W, name: "Sara Mahmoud", name_ar: "سارة محمود", email: "sara@thoth.com", avatar: "#E07A5F", role: "manager", last_active: d(0), status: "active" },
  { id: "sm03", workspace_id: W, name: "Mohamed Gamal", name_ar: "محمد جمال", email: "mohamed@thoth.com", avatar: "#3B82F6", role: "editor", last_active: d(1), status: "active" },
  { id: "sm04", workspace_id: W, name: "Fatma Hassan", name_ar: "فاطمة حسن", email: "fatma@thoth.com", avatar: "#EC4899", role: "editor", last_active: d(0), status: "active" },
  { id: "sm05", workspace_id: W, name: "Mona Saad", name_ar: "منى سعد", email: "mona@thoth.com", avatar: "#10B981", role: "editor", last_active: d(0), status: "active" },
  { id: "sm06", workspace_id: W, name: "Omar Salah", name_ar: "عمر صلاح", email: "omar@thoth.com", avatar: "#F59E0B", role: "commenter", last_active: d(3), status: "active" },
];

export const STUDIO_INVITES: StudioInvite[] = [
  { id: "inv01", workspace_id: W, email: "client@al mansouri.sa", name: "Khalid Al-Mansouri", role: "viewer", invited_by: "Ahmed Ali", invited_at: d(5), status: "accepted" },
  { id: "inv02", workspace_id: W, email: "designer@external.com", name: "External Designer", role: "editor", invited_by: "Fatma Hassan", invited_at: d(2), status: "pending" },
];

// ═══════════════════════════════════════════════════════════
// VERSIONS
// ═══════════════════════════════════════════════════════════

export const STUDIO_VERSIONS: StudioVersion[] = [
  { id: "v01", page_id: "p02", title: "HR Handbook", title_ar: "دليل الموارد البشرية", author: "Mona Saad", author_ar: "منى سعد", summary: "Added paternity leave policy and dress code section", summary_ar: "إضافة سياسة إجازة الأبوة وقسم الملابس", created_at: d(5), block_count: 18 },
  { id: "v02", page_id: "p02", title: "HR Handbook", title_ar: "دليل الموارد البشرية", author: "Mona Saad", author_ar: "منى سعد", summary: "Updated working hours and leave balances", summary_ar: "تحديث ساعات العمل وأرصدة الإجازات", created_at: d(15), block_count: 14 },
  { id: "v03", page_id: "p02", title: "HR Handbook", title_ar: "دليل الموارد البشرية", author: "Ahmed Ali", author_ar: "أحمد علي", summary: "Initial version with company overview", summary_ar: "النسخة الأولية مع نظرة عامة على الشركة", created_at: d(60), block_count: 8 },
];

// ═══════════════════════════════════════════════════════════
// FOLDERS
// ═══════════════════════════════════════════════════════════

export interface StudioFolder {
  id: string; name: string; name_ar: string;
  icon: string; parent_id: string | null;
  page_ids: string[];
  is_expanded: boolean;
  color: string;
}

export const STUDIO_FOLDERS: StudioFolder[] = [
  { id: "f01", name: "Knowledge Base", name_ar: "قاعدة المعرفة", icon: "📚", parent_id: null, page_ids: ["p01", "p08", "p09"], is_expanded: true, color: "#3B82F6" },
  { id: "f02", name: "HR", name_ar: "الموارد البشرية", icon: "👥", parent_id: null, page_ids: ["p02", "p12"], is_expanded: false, color: "#10B981" },
  { id: "f03", name: "Sales", name_ar: "المبيعات", icon: "💰", parent_id: null, page_ids: ["p04", "p14"], is_expanded: false, color: "#F59E0B" },
  { id: "f04", name: "Operations", name_ar: "العمليات", icon: "🏭", parent_id: null, page_ids: ["p05", "p10"], is_expanded: false, color: "#6366F1" },
  { id: "f05", name: "Marketing", name_ar: "التسويق", icon: "📣", parent_id: null, page_ids: ["p03", "p11"], is_expanded: false, color: "#EC4899" },
  { id: "f06", name: "Design", name_ar: "التصميم", icon: "🎨", parent_id: null, page_ids: ["p06", "p13", "p15"], is_expanded: false, color: "#8B5CF6" },
  { id: "f07", name: "Meetings", name_ar: "الاجتماعات", icon: "📅", parent_id: null, page_ids: ["p07"], is_expanded: false, color: "#06B6D4" },
];

// ═══════════════════════════════════════════════════════════
// SEARCH
// ═══════════════════════════════════════════════════════════

export interface StudioSearchResult {
  id: string; type: "page" | "block" | "database" | "template";
  title: string; title_ar: string;
  snippet: string; snippet_ar: string;
  page_id: string; route: string;
  icon: string;
  match_type: "title" | "content" | "tag" | "property";
}

export function searchStudio(query: string): StudioSearchResult[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const results: StudioSearchResult[] = [];

  STUDIO_PAGES.forEach(p => {
    if (p.title.toLowerCase().includes(q) || p.title_ar.includes(query) || p.tags.some(t => t.includes(q))) {
      results.push({ id: `sp-${p.id}`, type: "page", title: p.title, title_ar: p.title_ar, snippet: `Type: ${p.type}`, snippet_ar: `النوع: ${p.type}`, page_id: p.id, route: `/studio/${p.id}`, icon: p.icon, match_type: p.title.toLowerCase().includes(q) ? "title" : "tag" });
    }
  });

  STUDIO_BLOCKS.forEach(b => {
    if (b.content.toLowerCase().includes(q) || b.content_ar.includes(query)) {
      const page = STUDIO_PAGES.find(p => p.id === b.page_id);
      if (page) {
        const snippet = b.content.slice(0, 100) + (b.content.length > 100 ? "..." : "");
        results.push({ id: `sb-${b.id}`, type: "block", title: page.title, title_ar: page.title_ar, snippet, snippet_ar: b.content_ar.slice(0, 100), page_id: b.page_id, route: `/studio/${b.page_id}`, icon: page.icon, match_type: "content" });
      }
    }
  });

  return results.slice(0, 20);
}

// ═══════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════

export interface StudioAnalytics {
  total_pages: number; total_blocks: number;
  total_views: number; total_edits: number;
  active_users: number; avg_edit_time: string;
  most_viewed: { title: string; title_ar: string; views: number; icon: string }[];
  recent_activity: { user: string; user_ar: string; action: string; action_ar: string; page: string; page_ar: string; time: string }[];
  popular_tags: { tag: string; count: number }[];
}

export const STUDIO_ANALYTICS: StudioAnalytics = {
  total_pages: 15, total_blocks: 52,
  total_views: 743, total_edits: 312,
  active_users: 6, avg_edit_time: "12 min",
  most_viewed: [
    { title: "THOTH Knowledge Base", title_ar: "قاعدة معرفة ثوت", views: 245, icon: "📚" },
    { title: "Brand Guidelines", title_ar: "إرشادات العلامة التجارية", views: 120, icon: "🎨" },
    { title: "HR Handbook", title_ar: "دليل الموارد البشرية", views: 89, icon: "📋" },
    { title: "Product Roadmap Q2-Q3", title_ar: "خارطة طريق المنتجات", views: 56, icon: "🗺️" },
    { title: "Production Quality Checklist", title_ar: "قائمة جودة الإنتاج", views: 45, icon: "✅" },
  ],
  recent_activity: [
    { user: "Fatma Hassan", user_ar: "فاطمة حسن", action: "edited", action_ar: "عدّل", page: "Summer Collection Brief", page_ar: "بريف مجموعة الصيف", time: "2 min ago" },
    { user: "Ahmed Ali", user_ar: "أحمد علي", action: "created", action_ar: "أنشأ", page: "Shooting Notes — June", page_ar: "ملاحظات التصوير — يونيو", time: "1 hour ago" },
    { user: "Mona Saad", user_ar: "منى سعد", action: "commented on", action_ar: "علّق على", page: "HR Handbook", page_ar: "دليل الموارد البشرية", time: "3 hours ago" },
    { user: "Sara Mahmoud", user_ar: "سارة محمود", action: "updated", action_ar: "حدّث", page: "Marketing Plan 2026", page_ar: "خطة التسويق ٢٠٢٦", time: "5 hours ago" },
    { user: "Mohamed Gamal", user_ar: "محمد جمال", action: "edited", action_ar: "عدّل", page: "Production Quality Checklist", page_ar: "قائمة جودة الإنتاج", time: "1 day ago" },
  ],
  popular_tags: [
    { tag: "sop", count: 4 }, { tag: "hr", count: 3 }, { tag: "brand", count: 3 },
    { tag: "marketing", count: 2 }, { tag: "design", count: 3 }, { tag: "meeting", count: 2 },
  ],
};
