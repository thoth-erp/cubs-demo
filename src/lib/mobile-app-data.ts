/**
 * Mobile App Builder Data — بيانات منشئ التطبيق المحمول
 *
 * Turn any ecommerce website (Shopify, WooCommerce, custom) into a native mobile app.
 * Similar to Web2Native, Webs2App, MobiLoud, etc.
 *
 * Features:
 * - Website mirroring with native shell
 * - Push notifications
 * - Deep linking
 * - Offline caching
 * - App store publishing
 * - Analytics
 * - In-app purchases
 * - Loyalty integration
 */

const W = "demo";
const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
const ts = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString();

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export type AppPlatform = "ios" | "android" | "both";
export type AppStatus = "draft" | "configuring" | "building" | "review" | "published" | "rejected" | "paused";
export type BuildStatus = "pending" | "building" | "testing" | "ready" | "failed";
export type NotificationType = "promo" | "order" | "abandoned_cart" | "back_in_stock" | "price_drop" | "loyalty" | "custom";
export type NotificationStatus = "draft" | "scheduled" | "sent" | "failed";
export type DeepLinkType = "product" | "collection" | "category" | "page" | "promo" | "checkout";

export interface MobileApp {
  id: string; workspace_id: string;
  name: string; name_ar: string;
  website_url: string;
  platform: AppPlatform;
  status: AppStatus;
  // Branding
  app_icon_url: string;
  splash_screen_color: string;
  primary_color: string;
  secondary_color: string;
  splash_screen_type: "image" | "color" | "animated";
  splash_screen_url: string;
  // App Store
  app_store_name: string;
  app_store_name_ar: string;
  app_description: string;
  app_description_ar: string;
  app_keywords: string[];
  app_category: string;
  app_version: string;
  // Features
  push_notifications_enabled: boolean;
  deep_linking_enabled: boolean;
  offline_mode_enabled: boolean;
  in_app_purchases_enabled: boolean;
  loyalty_integration: boolean;
  chat_support_enabled: boolean;
  analytics_enabled: boolean;
  // Shopify
  shopify_store_url: string;
  shopify_api_key: string;
  shopify_webhook_secret: string;
  shopify_connected: boolean;
  // Build
  last_build_date: string | null;
  last_build_status: BuildStatus;
  build_count: number;
  // Stats
  total_downloads: number;
  active_users: number;
  daily_active_users: number;
  monthly_active_users: number;
  avg_session_duration: number;
  retention_rate_7d: number;
  retention_rate_30d: number;
  // Meta
  created_at: string; updated_at: string;
}

export interface PushNotification {
  id: string; workspace_id: string; app_id: string;
  title: string; title_ar: string;
  message: string; message_ar: string;
  image_url: string | null;
  deep_link_url: string | null;
  type: NotificationType;
  status: NotificationStatus;
  // Targeting
  target_audience: "all" | "ios" | "android" | "segment";
  segment: string | null;
  // Stats
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  // Schedule
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface AppFeature {
  id: string;
  name: string; name_ar: string;
  description: string; description_ar: string;
  icon: string;
  category: "core" | "engagement" | "commerce" | "analytics" | "integration";
  enabled: boolean;
  premium: boolean;
  config: Record<string, any>;
}

export interface AppAnalytics {
  period: string;
  downloads: number;
  active_users: number;
  sessions: number;
  avg_session_duration: number;
  screen_views: number;
  top_screens: { screen: string; screen_ar: string; views: number; avg_time: number }[];
  device_breakdown: { ios: number; android: number };
  geo_breakdown: { country: string; country_ar: string; users: number }[];
  revenue: number;
  conversion_rate: number;
  push_open_rate: number;
}

export interface DeepLink {
  id: string; workspace_id: string; app_id: string;
  name: string; name_ar: string;
  type: DeepLinkType;
  url_pattern: string;
  target_url: string;
  fallback_url: string;
  active: boolean;
  usage_count: number;
  created_at: string;
}

export interface AppBuild {
  id: string; workspace_id: string; app_id: string;
  version: string;
  status: BuildStatus;
  platform: AppPlatform;
  build_size: number | null;
  build_url: string | null;
  error_log: string | null;
  started_at: string;
  completed_at: string | null;
  triggered_by: string;
}

// ═══════════════════════════════════════════════════════════
// MOBILE APPS
// ═══════════════════════════════════════════════════════════

export const MOBILE_APPS: MobileApp[] = [
  {
    id: "app01", workspace_id: W, name: "THOTH Fashion", name_ar: "ثوت فاشون",
    website_url: "https://thothfashion.com", platform: "both", status: "published",
    app_icon_url: "/app-icon.png", splash_screen_color: "#1E3A5F", primary_color: "#1E3A5F", secondary_color: "#C9A96E",
    splash_screen_type: "animated", splash_screen_url: "/splash.mp4",
    app_store_name: "THOTH Fashion — Premium Egyptian Fashion", app_store_name_ar: "ثوت فاشون — أزياء مصرية فاخرة",
    app_description: "Shop the finest Egyptian bridal, evening wear, and custom fashion. Premium quality, timeless elegance.", app_description_ar: "تسوق أرقى الأزياء المصرية للعروس والسهرة والخياطة المخصصة. جودة فاخرة وأناقة خالدة.",
    app_keywords: ["fashion", "egyptian", "bridal", "evening wear", "custom", "premium", "أزياء", "مصرية", "عروس"],
    app_category: "Shopping", app_version: "2.1.0",
    push_notifications_enabled: true, deep_linking_enabled: true, offline_mode_enabled: true,
    in_app_purchases_enabled: false, loyalty_integration: true, chat_support_enabled: true, analytics_enabled: true,
    shopify_store_url: "https://thothfashion.myshopify.com", shopify_api_key: "shp_xxxx", shopify_webhook_secret: "whsec_xxxx", shopify_connected: true,
    last_build_date: d(3), last_build_status: "ready", build_count: 12,
    total_downloads: 8420, active_users: 3200, daily_active_users: 850, monthly_active_users: 3200,
    avg_session_duration: 4.2, retention_rate_7d: 45, retention_rate_30d: 28,
    created_at: d(120), updated_at: d(3),
  },
  {
    id: "app02", workspace_id: W, name: "THOTH Wholesale", name_ar: "ثوت بالجملة",
    website_url: "https://wholesale.thothfashion.com", platform: "both", status: "draft",
    app_icon_url: "/wholesale-icon.png", splash_screen_color: "#059669", primary_color: "#059669", secondary_color: "#10B981",
    splash_screen_type: "color", splash_screen_url: "",
    app_store_name: "THOTH Wholesale Portal", app_store_name_ar: "بوابة ثوت بالجملة",
    app_description: "B2B wholesale portal for THOTH Fashion retailers. Browse catalog, place bulk orders, track shipments.", app_description_ar: "بوابة الجملة لتجار ثوت فاشون. تصفح الكتالوج وطلب بالجملة وتتبع الشحنات.",
    app_keywords: ["wholesale", "b2b", "fashion", "bulk orders", "أزياء", "جملة", "تجزئة"],
    app_category: "Business", app_version: "1.0.0",
    push_notifications_enabled: true, deep_linking_enabled: true, offline_mode_enabled: false,
    in_app_purchases_enabled: false, loyalty_integration: false, chat_support_enabled: false, analytics_enabled: true,
    shopify_store_url: "", shopify_api_key: "", shopify_webhook_secret: "", shopify_connected: false,
    last_build_date: null, last_build_status: "pending", build_count: 0,
    total_downloads: 0, active_users: 0, daily_active_users: 0, monthly_active_users: 0,
    avg_session_duration: 0, retention_rate_7d: 0, retention_rate_30d: 0,
    created_at: d(10), updated_at: d(5),
  },
];

// ═══════════════════════════════════════════════════════════
// PUSH NOTIFICATIONS
// ═══════════════════════════════════════════════════════════

export const PUSH_NOTIFICATIONS: PushNotification[] = [
  { id: "pn01", workspace_id: W, app_id: "app01", title: "Summer Collection is Here! ☀️", title_ar: "مجموعة الصيف وصلت! ☀️", message: "Discover our new Mediterranean Breeze collection. Light fabrics, flowing silhouettes, gold accents.", message_ar: "اكتشف مجموعتنا الجديدة نسيم البحر المتوسط. أقمشة خفيفة، خطوط دائرية، لمسات ذهبية.", image_url: "/summer-collection.jpg", deep_link_url: "/collection/summer-2026", type: "promo", status: "sent", target_audience: "all", segment: null, sent_count: 8420, delivered_count: 7980, opened_count: 3200, clicked_count: 1800, scheduled_at: null, sent_at: d(5), created_at: d(6) },
  { id: "pn02", workspace_id: W, app_id: "app01", title: "Your order is on its way! 🚚", title_ar: "طلبك في الطريق! 🚚", message: "Order #TH-7892 has been shipped. Track your delivery in real-time.", message_ar: "تم شحن الطلب #TH-7892. تتبع التوصيل في الوقت الفعلي.", image_url: null, deep_link_url: "/orders/TH-7892", type: "order", status: "sent", target_audience: "all", segment: null, sent_count: 1, delivered_count: 1, opened_count: 1, clicked_count: 1, scheduled_at: null, sent_at: d(2), created_at: d(2) },
  { id: "pn03", workspace_id: W, app_id: "app01", title: "You left items in your cart 🛒", title_ar: "لديك منتجات في السلة 🛒", message: "Complete your purchase and get 10% off with code SUMMER10.", message_ar: "أكمل عملية الشراء واحصل على خصم ١٠٪ بالكود SUMMER10.", image_url: null, deep_link_url: "/cart", type: "abandoned_cart", status: "sent", target_audience: "segment", segment: "cart_abandoners", sent_count: 450, delivered_count: 430, opened_count: 180, clicked_count: 95, scheduled_at: null, sent_at: d(1), created_at: d(1) },
  { id: "pn04", workspace_id: W, app_id: "app01", title: "Price Drop Alert! 💰", title_ar: "تنبيه انخفاض الأسعار! 💰", message: "The Evening Dress you viewed is now 20% off!", message_ar: "فستان السهرة الذي شاهدته الآن بخصم ٢٠٪!", image_url: null, deep_link_url: "/product/evening-dress-001", type: "price_drop", status: "sent", target_audience: "segment", segment: "price_drop_viewers", sent_count: 320, delivered_count: 300, opened_count: 145, clicked_count: 72, scheduled_at: null, sent_at: d(3), created_at: d(3) },
  { id: "pn05", workspace_id: W, app_id: "app01", title: "Flash Sale — 24 Hours Only! ⚡", title_ar: "عرض خاطف — ٢٤ ساعة فقط! ⚡", message: "Exclusive app-only sale. Up to 40% off on selected items.", message_ar: "عرض حصري للتطبيق فقط. خصم يصل إلى ٤٠٪ على منتجات مختارة.", image_url: "/flash-sale.jpg", deep_link_url: "/sale/flash", type: "promo", status: "scheduled", target_audience: "all", segment: null, sent_count: 0, delivered_count: 0, opened_count: 0, clicked_count: 0, scheduled_at: d(-1), sent_at: null, created_at: d(0) },
  { id: "pn06", workspace_id: W, app_id: "app01", title: "Your reward is ready! 🎁", title_ar: "مكافأتك جاهزة! 🎁", message: "You've earned 500 loyalty points. Redeem them for a 50 EGP discount.", message_ar: "لقد كسبت ٥٠٠ نقطة ولاء. استبدلها بخصم ٥٠ ج.م.", image_url: null, deep_link_url: "/loyalty/redeem", type: "loyalty", status: "sent", target_audience: "segment", segment: "loyalty_points_500", sent_count: 280, delivered_count: 265, opened_count: 190, clicked_count: 120, scheduled_at: null, sent_at: d(4), created_at: d(4) },
];

// ═══════════════════════════════════════════════════════════
// APP FEATURES
// ═══════════════════════════════════════════════════════════

export const APP_FEATURES: AppFeature[] = [
  { id: "f01", name: "Push Notifications", name_ar: "الإشعارات الفورية", description: "Send targeted push notifications to users", description_ar: "إرسال إشعارات فورية مستهدفة للمستخدمين", icon: "🔔", category: "engagement", enabled: true, premium: false, config: { max_per_day: 3, quiet_hours_start: "22:00", quiet_hours_end: "08:00" } },
  { id: "f02", name: "Deep Linking", name_ar: "الربط العميق", description: "Direct users to specific content inside the app", description_ar: "توجيه المستخدمين إلى محتوى محدد داخل التطبيق", icon: "🔗", category: "core", enabled: true, premium: false, config: {} },
  { id: "f03", name: "Offline Mode", name_ar: "وضع عدم الاتصال", description: "Cache content for offline browsing", description_ar: "تخزين المحتوى للتصفح بدون اتصال", icon: "📡", category: "core", enabled: true, premium: true, config: { cache_duration: 24, cache_pages: ["home", "products", "collections"] } },
  { id: "f04", name: "Loyalty Integration", name_ar: "تكامل الولاء", description: "Sync THOTH loyalty program with the app", description_ar: "مزامنة برنامج ولاء ثوت مع التطبيق", icon: "🎁", category: "engagement", enabled: true, premium: false, config: { points_per_egp: 10, redeem_enabled: true } },
  { id: "f05", name: "In-App Chat", name_ar: "المحادثة داخل التطبيق", description: "Live chat support for customers", description_ar: "دعم المحادثة المباشرة للعملاء", icon: "💬", category: "engagement", enabled: true, premium: true, config: { auto_reply: true, business_hours: "10:00-19:00" } },
  { id: "f06", name: "Analytics Dashboard", name_ar: "لوحة تحليلات", description: "Track app usage, downloads, and engagement", description_ar: "تتبع استخدام التطبيق والتنزيلات والتفاعل", icon: "📊", category: "analytics", enabled: true, premium: false, config: {} },
  { id: "f07", name: "Product Reviews", name_ar: "تقييمات المنتجات", description: "Allow users to rate and review products in-app", description_ar: "السماح للمستخدمين بتقييم المنتجات داخل التطبيق", icon: "⭐", category: "commerce", enabled: true, premium: false, config: { require_purchase: true } },
  { id: "f08", name: "Wishlist", name_ar: "قائمة الأمنيات", description: "Save products to wishlist for later", description_ar: "حفظ المنتجات في قائمة الأمنيات للشراء لاحقاً", icon: "❤️", category: "commerce", enabled: true, premium: false, config: {} },
  { id: "f09", name: "Size Guide", name_ar: "دليل المقاسات", description: "Interactive size guide for fashion products", description_ar: "دليل مقاسات تفاعلي لمنتجات الأزياء", icon: "📏", category: "commerce", enabled: true, premium: false, config: { units: ["cm", "inch"] } },
  { id: "f10", name: "AR Try-On", name_ar: "التجربة بالواقع المعزز", description: "Virtual try-on for clothing items", description_ar: "تجربة افتراضية لملابس", icon: "📱", category: "commerce", enabled: false, premium: true, config: {} },
  { id: "f11", name: "Social Login", name_ar: "تسجيل الدخول الاجتماعي", description: "Login with Google, Facebook, Apple", description_ar: "تسجيل الدخول بجوجل أو فيسبوك أو آبل", icon: "🔐", category: "core", enabled: true, premium: false, config: { providers: ["google", "facebook", "apple"] } },
  { id: "f12", name: "Multi-Language", name_ar: "تعدد اللغات", description: "Arabic and English support", description_ar: "دعم اللغة العربية والإنجليزية", icon: "🌐", category: "core", enabled: true, premium: false, config: { languages: ["en", "ar"], default: "ar" } },
  { id: "f13", name: "Dark Mode", name_ar: "الوضع الداكن", description: "Dark theme support", description_ar: "دعم السمة الداكنة", icon: "🌙", category: "core", enabled: true, premium: false, config: {} },
  { id: "f14", name: "Barcode Scanner", name_ar: "ماسح الباركود", description: "Scan product barcodes for quick lookup", description_ar: "مسح باركود المنتجات للبحث السريع", icon: "📷", category: "commerce", enabled: false, premium: true, config: {} },
  { id: "f15", name: "In-App Purchases", name_ar: "الشراء داخل التطبيق", description: "Digital products and gift cards", description_ar: "المنتجات الرقمية وبطاقات الهدايا", icon: "💳", category: "commerce", enabled: false, premium: true, config: {} },
  { id: "f16", name: "Siri/Google Assistant", name_ar: "سيري/مساعد جوجل", description: "Voice commands for the app", description_ar: "أوامر صوتية للتطبيق", icon: "🎤", category: "integration", enabled: false, premium: true, config: {} },
];

// ═══════════════════════════════════════════════════════════
// APP ANALYTICS
// ═══════════════════════════════════════════════════════════

export const APP_ANALYTICS: AppAnalytics = {
  period: "2026-06",
  downloads: 8420, active_users: 3200, sessions: 45000,
  avg_session_duration: 4.2, screen_views: 180000,
  top_screens: [
    { screen: "Home", screen_ar: "الرئيسية", views: 45000, avg_time: 1.2 },
    { screen: "Product Detail", screen_ar: "تفاصيل المنتج", views: 38000, avg_time: 2.8 },
    { screen: "Collection", screen_ar: "المجموعة", views: 28000, avg_time: 1.5 },
    { screen: "Cart", screen_ar: "السلة", views: 15000, avg_time: 0.8 },
    { screen: "Checkout", screen_ar: "الدفع", views: 8000, avg_time: 3.2 },
  ],
  device_breakdown: { ios: 3800, android: 4620 },
  geo_breakdown: [
    { country: "Egypt", country_ar: "مصر", users: 6200 },
    { country: "Saudi Arabia", country_ar: "السعودية", users: 1200 },
    { country: "UAE", country_ar: "الإمارات", users: 600 },
    { country: "Kuwait", country_ar: "الكويت", users: 220 },
    { country: "Other", country_ar: "أخرى", users: 200 },
  ],
  revenue: 285000, conversion_rate: 3.8, push_open_rate: 38,
};

// ═══════════════════════════════════════════════════════════
// DEEP LINKS
// ═══════════════════════════════════════════════════════════

export const DEEP_LINKS: DeepLink[] = [
  { id: "dl01", workspace_id: W, app_id: "app01", name: "Home", name_ar: "الرئيسية", type: "page", url_pattern: "thoth://home", target_url: "/", fallback_url: "https://thothfashion.com", active: true, usage_count: 45000, created_at: d(120) },
  { id: "dl02", workspace_id: W, app_id: "app01", name: "Summer Collection", name_ar: "مجموعة الصيف", type: "collection", url_pattern: "thoth://collection/summer-2026", target_url: "/collection/summer-2026", fallback_url: "https://thothfashion.com/collection/summer-2026", active: true, usage_count: 12000, created_at: d(30) },
  { id: "dl03", workspace_id: W, app_id: "app01", name: "Flash Sale", name_ar: "عرض خاطف", type: "promo", url_pattern: "thoth://sale/flash", target_url: "/sale/flash", fallback_url: "https://thothfashion.com/sale", active: true, usage_count: 8500, created_at: d(15) },
  { id: "dl04", workspace_id: W, app_id: "app01", name: "Loyalty Redeem", name_ar: "استبدال النقاط", type: "page", url_pattern: "thoth://loyalty/redeem", target_url: "/loyalty/redeem", fallback_url: "https://thothfashion.com/loyalty", active: true, usage_count: 3200, created_at: d(60) },
  { id: "dl05", workspace_id: W, app_id: "app01", name: "Cart", name_ar: "السلة", type: "checkout", url_pattern: "thoth://cart", target_url: "/cart", fallback_url: "https://thothfashion.com/cart", active: true, usage_count: 15000, created_at: d(120) },
];

// ═══════════════════════════════════════════════════════════
// APP BUILDS
// ═══════════════════════════════════════════════════════════

export const APP_BUILDS: AppBuild[] = [
  { id: "ab01", workspace_id: W, app_id: "app01", version: "2.1.0", status: "ready", platform: "both", build_size: 28500000, build_url: "https://builds.thoth.app/v2.1.0", error_log: null, started_at: d(5), completed_at: d(3), triggered_by: "Ahmed Ali" },
  { id: "ab02", workspace_id: W, app_id: "app01", version: "2.0.0", status: "ready", platform: "both", build_size: 27800000, build_url: "https://builds.thoth.app/v2.0.0", error_log: null, started_at: d(30), completed_at: d(28), triggered_by: "Ahmed Ali" },
  { id: "ab03", workspace_id: W, app_id: "app01", version: "1.9.0", status: "ready", platform: "ios", build_size: 24200000, build_url: "https://builds.thoth.app/v1.9.0-ios", error_log: null, started_at: d(60), completed_at: d(58), triggered_by: "Ahmed Ali" },
  { id: "ab04", workspace_id: W, app_id: "app02", version: "1.0.0", status: "pending", platform: "both", build_size: null, build_url: null, error_log: null, started_at: d(1), completed_at: null, triggered_by: "Sara Mahmoud" },
];

// ═══════════════════════════════════════════════════════════
// NOTIFICATION SEGMENTS
// ═══════════════════════════════════════════════════════════

export interface NotificationSegment {
  id: string; workspace_id: string; app_id: string;
  name: string; name_ar: string;
  description: string; description_ar: string;
  criteria: { field: string; operator: string; value: string }[];
  user_count: number;
  created_at: string;
}

export const NOTIFICATION_SEGMENTS: NotificationSegment[] = [
  { id: "ns01", workspace_id: W, app_id: "app01", name: "VIP Customers", name_ar: "عملاء VIP", description: "Customers with VIP loyalty status", description_ar: "عملاء بحالة ولاء VIP", criteria: [{ field: "loyalty_tier", operator: "in", value: "gold,platinum" }], user_count: 1200, created_at: d(90) },
  { id: "ns02", workspace_id: W, app_id: "app01", name: "Cart Abandoners", name_ar: "متخلي السلة", description: "Users who left items in cart", description_ar: "مستخدمون تركوا منتجات في السلة", criteria: [{ field: "cart_value", operator: ">", value: "0" }, { field: "last_activity", operator: "<", value: "24h" }], user_count: 450, created_at: d(60) },
  { id: "ns03", workspace_id: W, app_id: "app01", name: "Inactive 30 Days", name_ar: "غير نشط ٣٠ يوم", description: "Users inactive for 30+ days", description_ar: "مستخدمون غير نشطين منذ ٣٠+ يوم", criteria: [{ field: "last_active", operator: "<", value: "30d" }], user_count: 800, created_at: d(30) },
  { id: "ns04", workspace_id: W, app_id: "app01", name: "Bridal Interest", name_ar: "مهتم بالعروس", description: "Users who viewed bridal products", description_ar: "مستخدمون شاهدوا منتجات العروس", criteria: [{ field: "viewed_category", operator: "=", value: "bridal" }], user_count: 650, created_at: d(45) },
  { id: "ns05", workspace_id: W, app_id: "app01", name: "High Spenders", name_ar: "مشترون كبار", description: "Customers with 10K+ EGP lifetime spend", description_ar: "عملاء بمشتريات ١٠ آلاف+ ج.م", criteria: [{ field: "lifetime_spend", operator: ">=", value: "10000" }], user_count: 320, created_at: d(60) },
];

// ═══════════════════════════════════════════════════════════
// APP TEMPLATES
// ═══════════════════════════════════════════════════════════

export interface AppTemplate {
  id: string;
  name: string; name_ar: string;
  description: string; description_ar: string;
  icon: string;
  category: string;
  features: string[];
  color: string;
}

export const APP_TEMPLATES: AppTemplate[] = [
  { id: "at01", name: "Fashion Store", name_ar: "متجر أزياء", description: "Full-featured fashion ecommerce app with lookbooks, size guides, and virtual try-on", description_ar: "تطبيق تجارة إلكترونية للأزياء مع كتالوجات ودليل مقاسات وتجربة افتراضية", icon: "👗", category: "ecommerce", features: ["product_catalog", "size_guide", "wishlist", "reviews", "push_notifications", "loyalty"], color: "#EC4899" },
  { id: "at02", name: "Bridal Boutique", name_ar: "بوتيك العروس", description: "Luxury bridal app with appointment booking, portfolio, and consultation scheduling", description_ar: "تطبيق فاخر للعروس مع حجز المواعيد و المحفظة وجدولة الاستشارات", icon: "💍", category: "ecommerce", features: ["appointment_booking", "portfolio", "consultation", "push_notifications"], color: "#8B5CF6" },
  { id: "at03", name: "Wholesale Portal", name_ar: "بوابة الجملة", description: "B2B wholesale app with bulk ordering, catalog, and account management", description_ar: "تطبيق جملة B2B مع الطلب بالجملة والكتالوج وإدارة الحسابات", icon: "📦", category: "b2b", features: ["bulk_ordering", "catalog", "account_management", "push_notifications"], color: "#059669" },
  { id: "at04", name: "Multi-Brand Store", name_ar: "متجر متعدد العلامات", description: "Multi-brand fashion app with brand pages, collections, and cross-selling", description_ar: "تطبيق أزياء متعدد العلامات مع صفحات العلامات والمجموعات والبيع المتبادل", icon: "🏬", category: "ecommerce", features: ["multi_brand", "collections", "cross_selling", "push_notifications"], color: "#F59E0B" },
];
