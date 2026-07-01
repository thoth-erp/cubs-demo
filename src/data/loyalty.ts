// ─── Loyalty Program — Types, Meta Maps, Demo Data ────────

export type LoyaltyTierSlug = "bronze" | "silver" | "gold" | "vip";
export type TransactionType = "earned" | "redeemed" | "adjusted" | "expired" | "reversed" | "bonus";
export type TransactionSource = "shopify" | "store" | "admin" | "system";
export type RedemptionChannel = "online" | "offline";

// ─── Meta maps ────────────────────────────────────────────

export const TIER_META: Record<LoyaltyTierSlug, {
  en: string; ar: string; color: string; bg: string; pill: string; gradient: string;
  minSpend: number; multiplier: number;
}> = {
  bronze: {
    en: "Bronze", ar: "برونزي",
    color: "#CD7F32", bg: "bg-amber-800/8", pill: "bg-amber-50 text-amber-700 border border-amber-200",
    gradient: "from-amber-700/20 to-amber-900/5",
    minSpend: 0, multiplier: 1.0,
  },
  silver: {
    en: "Silver", ar: "فضي",
    color: "#94A3B8", bg: "bg-slate-400/8", pill: "bg-slate-100 text-slate-600 border border-slate-200",
    gradient: "from-slate-400/20 to-slate-500/5",
    minSpend: 5000, multiplier: 1.25,
  },
  gold: {
    en: "Gold", ar: "ذهبي",
    color: "#D4A017", bg: "bg-yellow-500/8", pill: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    gradient: "from-yellow-500/20 to-amber-600/5",
    minSpend: 15000, multiplier: 1.5,
  },
  vip: {
    en: "VIP", ar: "كبار العملاء",
    color: "#1a1a1a", bg: "bg-foreground/5", pill: "bg-foreground text-background border border-foreground/80",
    gradient: "from-foreground/15 to-foreground/3",
    minSpend: 50000, multiplier: 2.0,
  },
};

export const TIER_ORDER: LoyaltyTierSlug[] = ["bronze", "silver", "gold", "vip"];

export const TX_TYPE_META: Record<TransactionType, {
  en: string; ar: string; dot: string; sign: "+" | "-" | "±";
}> = {
  earned:   { en: "Earned",   ar: "مكتسبة",  dot: "bg-emerald-500", sign: "+" },
  redeemed: { en: "Redeemed", ar: "مستبدلة",  dot: "bg-primary",     sign: "-" },
  adjusted: { en: "Adjusted", ar: "تعديل",    dot: "bg-amber-500",   sign: "±" },
  expired:  { en: "Expired",  ar: "منتهية",   dot: "bg-muted-foreground/40", sign: "-" },
  reversed: { en: "Reversed", ar: "معكوسة",   dot: "bg-rose-500",    sign: "-" },
  bonus:    { en: "Bonus",    ar: "مكافأة",    dot: "bg-violet-500",  sign: "+" },
};

export const SOURCE_META: Record<TransactionSource, { en: string; ar: string; icon: string }> = {
  shopify: { en: "Shopify",  ar: "شوبيفاي", icon: "ShoppingBag" },
  store:   { en: "Store",    ar: "المتجر",   icon: "Store" },
  admin:   { en: "Admin",    ar: "الإدارة",  icon: "Shield" },
  system:  { en: "System",   ar: "النظام",   icon: "Cpu" },
};

// ─── Helpers ──────────────────────────────────────────────

export function fmtPts(pts: number): string {
  return Math.abs(pts).toLocaleString("en");
}

export function fmtCurrency(amount: number, currency = "EGP", locale = "en-EG"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

export function nextTier(current: LoyaltyTierSlug): LoyaltyTierSlug | null {
  const idx = TIER_ORDER.indexOf(current);
  return idx < TIER_ORDER.length - 1 ? TIER_ORDER[idx + 1] : null;
}

export function tierProgress(totalSpend: number, currentTier: LoyaltyTierSlug): { pct: number; remaining: number; next: LoyaltyTierSlug | null } {
  const next = nextTier(currentTier);
  if (!next) return { pct: 100, remaining: 0, next: null };
  const currentMin = TIER_META[currentTier].minSpend;
  const nextMin = TIER_META[next].minSpend;
  const range = nextMin - currentMin;
  const progress = totalSpend - currentMin;
  return {
    pct: Math.min(100, Math.round((progress / range) * 100)),
    remaining: Math.max(0, nextMin - totalSpend),
    next,
  };
}

// ─── Demo data ────────────────────────────────────────────

export interface LoyaltyMemberDemo {
  id: string;
  memberNumber: string;
  nameEn: string;
  nameAr: string;
  email: string;
  phone: string;
  tier: LoyaltyTierSlug;
  currentPoints: number;
  lifetimePoints: number;
  redeemedPoints: number;
  expiredPoints: number;
  totalSpend: number;
  orderCount: number;
  lastPurchaseAt: string;
  avatarColor: string;
  favoriteCategories: string[];
  shopifyCustomerId?: string;
  personId?: string;
  organizationId?: string;
}

export interface LoyaltyTransactionDemo {
  id: string;
  memberId: string;
  type: TransactionType;
  points: number;
  balanceAfter: number;
  source: TransactionSource;
  orderId?: string;
  orderAmount?: number;
  staffName?: string;
  notes?: string;
  createdAt: string;
}

const MEMBERS: LoyaltyMemberDemo[] = [
  {
    id: "lm-001", memberNumber: "LYL-00001",
    nameEn: "Ahmed Mohamed", nameAr: "أحمد محمد",
    email: "ahmed@email.com", phone: "01012345678",
    tier: "gold", currentPoints: 12450, lifetimePoints: 38200,
    redeemedPoints: 24500, expiredPoints: 1250,
    totalSpend: 41500, orderCount: 12, lastPurchaseAt: "2026-06-07",
    avatarColor: "#3B82F6",
    favoriteCategories: ["Furniture", "Lighting"],
    shopifyCustomerId: "gid://shopify/Customer/7001",
  },
  {
    id: "lm-002", memberNumber: "LYL-00002",
    nameEn: "Sara Al-Rashid", nameAr: "سارة الراشد",
    email: "sara.r@email.com", phone: "01198765432",
    tier: "vip", currentPoints: 45800, lifetimePoints: 112000,
    redeemedPoints: 62000, expiredPoints: 4200,
    totalSpend: 87600, orderCount: 34, lastPurchaseAt: "2026-06-09",
    avatarColor: "#8B5CF6",
    favoriteCategories: ["Sofas", "Rugs", "Accessories"],
    shopifyCustomerId: "gid://shopify/Customer/7002",
  },
  {
    id: "lm-003", memberNumber: "LYL-00003",
    nameEn: "Omar Farouk", nameAr: "عمر فاروق",
    email: "omar.f@email.com", phone: "01234567890",
    tier: "silver", currentPoints: 3200, lifetimePoints: 8700,
    redeemedPoints: 5000, expiredPoints: 500,
    totalSpend: 8200, orderCount: 5, lastPurchaseAt: "2026-05-22",
    avatarColor: "#10B981",
    favoriteCategories: ["Office", "Desks"],
  },
  {
    id: "lm-004", memberNumber: "LYL-00004",
    nameEn: "Fatima Hassan", nameAr: "فاطمة حسن",
    email: "fatima.h@email.com", phone: "01087654321",
    tier: "bronze", currentPoints: 850, lifetimePoints: 2100,
    redeemedPoints: 1000, expiredPoints: 250,
    totalSpend: 2300, orderCount: 3, lastPurchaseAt: "2026-06-01",
    avatarColor: "#F59E0B",
    favoriteCategories: ["Bedroom", "Textiles"],
  },
  {
    id: "lm-005", memberNumber: "LYL-00005",
    nameEn: "Youssef Nabil", nameAr: "يوسف نبيل",
    email: "youssef.n@email.com", phone: "01156781234",
    tier: "gold", currentPoints: 18900, lifetimePoints: 42300,
    redeemedPoints: 21400, expiredPoints: 2000,
    totalSpend: 38700, orderCount: 18, lastPurchaseAt: "2026-06-08",
    avatarColor: "#EF4444",
    favoriteCategories: ["Living Room", "Dining"],
    shopifyCustomerId: "gid://shopify/Customer/7005",
  },
  {
    id: "lm-006", memberNumber: "LYL-00006",
    nameEn: "Layla Ibrahim", nameAr: "ليلى إبراهيم",
    email: "layla.i@email.com", phone: "01067891234",
    tier: "silver", currentPoints: 6100, lifetimePoints: 14500,
    redeemedPoints: 8000, expiredPoints: 400,
    totalSpend: 12800, orderCount: 8, lastPurchaseAt: "2026-06-05",
    avatarColor: "#EC4899",
    favoriteCategories: ["Accessories", "Decor"],
  },
  {
    id: "lm-007", memberNumber: "LYL-00007",
    nameEn: "Karim Mostafa", nameAr: "كريم مصطفى",
    email: "karim.m@email.com", phone: "01278901234",
    tier: "bronze", currentPoints: 1500, lifetimePoints: 3200,
    redeemedPoints: 1500, expiredPoints: 200,
    totalSpend: 3400, orderCount: 4, lastPurchaseAt: "2026-05-15",
    avatarColor: "#14B8A6",
    favoriteCategories: ["Kitchen", "Storage"],
  },
  {
    id: "lm-008", memberNumber: "LYL-00008",
    nameEn: "Nour El-Din", nameAr: "نور الدين",
    email: "nour.d@email.com", phone: "01145678901",
    tier: "gold", currentPoints: 22100, lifetimePoints: 56800,
    redeemedPoints: 31200, expiredPoints: 3500,
    totalSpend: 46200, orderCount: 22, lastPurchaseAt: "2026-06-10",
    avatarColor: "#6366F1",
    favoriteCategories: ["Outdoor", "Garden"],
    shopifyCustomerId: "gid://shopify/Customer/7008",
  },
];

const TRANSACTIONS: LoyaltyTransactionDemo[] = [
  // Ahmed Mohamed
  { id: "lt-001", memberId: "lm-001", type: "earned", points: 5000, balanceAfter: 12450, source: "store", orderAmount: 500, staffName: "Mohamed Ali", createdAt: "2026-06-07T14:30:00Z" },
  { id: "lt-002", memberId: "lm-001", type: "redeemed", points: -2000, balanceAfter: 7450, source: "shopify", orderId: "SHP-4521", createdAt: "2026-06-03T10:15:00Z" },
  { id: "lt-003", memberId: "lm-001", type: "earned", points: 3200, balanceAfter: 9450, source: "shopify", orderId: "SHP-4498", orderAmount: 320, createdAt: "2026-05-28T16:45:00Z" },
  { id: "lt-004", memberId: "lm-001", type: "bonus", points: 1000, balanceAfter: 6250, source: "system", notes: "Birthday bonus", createdAt: "2026-05-15T00:00:00Z" },
  { id: "lt-005", memberId: "lm-001", type: "earned", points: 8500, balanceAfter: 5250, source: "store", orderAmount: 850, staffName: "Hana Khalil", createdAt: "2026-05-10T11:20:00Z" },
  // Sara Al-Rashid
  { id: "lt-006", memberId: "lm-002", type: "earned", points: 12000, balanceAfter: 45800, source: "shopify", orderId: "SHP-4530", orderAmount: 1200, createdAt: "2026-06-09T09:00:00Z" },
  { id: "lt-007", memberId: "lm-002", type: "earned", points: 6500, balanceAfter: 33800, source: "store", orderAmount: 650, staffName: "Mohamed Ali", createdAt: "2026-06-06T15:30:00Z" },
  { id: "lt-008", memberId: "lm-002", type: "redeemed", points: -10000, balanceAfter: 27300, source: "store", staffName: "Hana Khalil", createdAt: "2026-06-04T12:00:00Z" },
  // Omar Farouk
  { id: "lt-009", memberId: "lm-003", type: "earned", points: 2000, balanceAfter: 3200, source: "shopify", orderId: "SHP-4410", orderAmount: 200, createdAt: "2026-05-22T14:00:00Z" },
  { id: "lt-010", memberId: "lm-003", type: "adjusted", points: 500, balanceAfter: 1200, source: "admin", notes: "Goodwill adjustment — delivery delay", staffName: "Admin", createdAt: "2026-05-18T10:00:00Z" },
  // Fatima Hassan
  { id: "lt-011", memberId: "lm-004", type: "earned", points: 1500, balanceAfter: 850, source: "store", orderAmount: 150, staffName: "Mohamed Ali", createdAt: "2026-06-01T17:00:00Z" },
  { id: "lt-012", memberId: "lm-004", type: "expired", points: -250, balanceAfter: -350, source: "system", notes: "Points expired (90-day policy)", createdAt: "2026-05-30T00:00:00Z" },
  // Youssef Nabil
  { id: "lt-013", memberId: "lm-005", type: "earned", points: 7500, balanceAfter: 18900, source: "shopify", orderId: "SHP-4525", orderAmount: 750, createdAt: "2026-06-08T11:00:00Z" },
  { id: "lt-014", memberId: "lm-005", type: "redeemed", points: -5000, balanceAfter: 11400, source: "store", staffName: "Hana Khalil", createdAt: "2026-06-02T14:30:00Z" },
  // Layla Ibrahim
  { id: "lt-015", memberId: "lm-006", type: "earned", points: 3000, balanceAfter: 6100, source: "store", orderAmount: 300, staffName: "Mohamed Ali", createdAt: "2026-06-05T16:00:00Z" },
  // Nour El-Din
  { id: "lt-016", memberId: "lm-008", type: "earned", points: 4800, balanceAfter: 22100, source: "shopify", orderId: "SHP-4535", orderAmount: 480, createdAt: "2026-06-10T08:30:00Z" },
  { id: "lt-017", memberId: "lm-008", type: "reversed", points: -1200, balanceAfter: 17300, source: "system", orderId: "SHP-4488", notes: "Order SHP-4488 refunded", createdAt: "2026-06-03T09:00:00Z" },
];

export function loadLoyaltyMembers(): LoyaltyMemberDemo[] {
  return MEMBERS;
}

export function loadLoyaltyTransactions(): LoyaltyTransactionDemo[] {
  return TRANSACTIONS;
}

// ─── Rules ───────────────────────────────────────────────

export type RuleType = "spend" | "category_bonus" | "first_purchase" | "birthday" | "campaign" | "referral" | "threshold";
export type RuleStatus = "active" | "scheduled" | "paused" | "expired";

export interface LoyaltyRuleDemo {
  id: string;
  nameEn: string;
  nameAr: string;
  type: RuleType;
  status: RuleStatus;
  descEn: string;
  descAr: string;
  // Rule config
  pointsAwarded?: number;
  multiplier?: number;
  minAmount?: number;
  categoryFilter?: string[];
  startsAt?: string;
  endsAt?: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export const RULE_TYPE_META: Record<RuleType, { en: string; ar: string; pill: string; icon: string }> = {
  spend:          { en: "Spend",          ar: "إنفاق",      pill: "bg-emerald-50 text-emerald-700 border border-emerald-200", icon: "DollarSign" },
  category_bonus: { en: "Category",      ar: "فئة",         pill: "bg-blue-50 text-blue-700 border border-blue-200",         icon: "Tag" },
  first_purchase: { en: "First Purchase", ar: "أول شراء",   pill: "bg-violet-50 text-violet-700 border border-violet-200",   icon: "Gift" },
  birthday:       { en: "Birthday",       ar: "عيد ميلاد",  pill: "bg-pink-50 text-pink-700 border border-pink-200",         icon: "Cake" },
  campaign:       { en: "Campaign",       ar: "حملة",       pill: "bg-amber-50 text-amber-700 border border-amber-200",      icon: "Megaphone" },
  referral:       { en: "Referral",       ar: "إحالة",      pill: "bg-cyan-50 text-cyan-700 border border-cyan-200",         icon: "UserPlus" },
  threshold:      { en: "Threshold",      ar: "حد إنفاق",   pill: "bg-orange-50 text-orange-700 border border-orange-200",   icon: "TrendingUp" },
};

export const RULE_STATUS_META: Record<RuleStatus, { en: string; ar: string; dot: string }> = {
  active:    { en: "Active",    ar: "نشط",    dot: "bg-emerald-500" },
  scheduled: { en: "Scheduled", ar: "مجدول",   dot: "bg-amber-500" },
  paused:    { en: "Paused",    ar: "متوقف",   dot: "bg-muted-foreground/40" },
  expired:   { en: "Expired",   ar: "منتهي",   dot: "bg-rose-400" },
};

const RULES: LoyaltyRuleDemo[] = [
  {
    id: "lr-001", nameEn: "Base Spend Rule", nameAr: "قاعدة الإنفاق الأساسية",
    type: "spend", status: "active",
    descEn: "100 points per 10 EGP spent. Applied to all purchases across all channels.",
    descAr: "100 نقطة لكل 10 ج.م. تُطبق على جميع المشتريات في كل القنوات.",
    pointsAwarded: 100, minAmount: 10, priority: 0,
    createdAt: "2026-01-15T10:00:00Z", updatedAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "lr-002", nameEn: "Furniture 1.5x Bonus", nameAr: "مكافأة الأثاث 1.5x",
    type: "category_bonus", status: "active",
    descEn: "1.5x points on all furniture category purchases. Stacks with base spend rule.",
    descAr: "1.5x نقاط على جميع مشتريات فئة الأثاث. تتراكم مع قاعدة الإنفاق الأساسية.",
    multiplier: 1.5, categoryFilter: ["Furniture", "Sofas", "Dining"], priority: 10,
    createdAt: "2026-02-01T10:00:00Z", updatedAt: "2026-03-10T14:00:00Z",
  },
  {
    id: "lr-003", nameEn: "First Purchase Bonus", nameAr: "مكافأة أول شراء",
    type: "first_purchase", status: "active",
    descEn: "500 bonus points awarded on first ever purchase. One-time per member.",
    descAr: "500 نقطة مكافأة عند أول عملية شراء. مرة واحدة لكل عضو.",
    pointsAwarded: 500, priority: 20,
    createdAt: "2026-01-15T10:00:00Z", updatedAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "lr-004", nameEn: "Birthday Reward", nameAr: "مكافأة عيد الميلاد",
    type: "birthday", status: "active",
    descEn: "1,000 bonus points awarded on member's birthday month. Automatic via system.",
    descAr: "1,000 نقطة مكافأة في شهر عيد ميلاد العضو. تلقائي عبر النظام.",
    pointsAwarded: 1000, priority: 15,
    createdAt: "2026-02-10T10:00:00Z", updatedAt: "2026-02-10T10:00:00Z",
  },
  {
    id: "lr-005", nameEn: "Eid Al-Adha Double Points", nameAr: "نقاط مضاعفة في عيد الأضحى",
    type: "campaign", status: "scheduled",
    descEn: "2x points on all purchases during Eid Al-Adha week. June 15–22, 2026.",
    descAr: "نقاط مضاعفة على جميع المشتريات خلال أسبوع عيد الأضحى. 15-22 يونيو 2026.",
    multiplier: 2.0, startsAt: "2026-06-15T00:00:00Z", endsAt: "2026-06-22T23:59:59Z", priority: 50,
    createdAt: "2026-05-20T10:00:00Z", updatedAt: "2026-06-01T09:00:00Z",
  },
  {
    id: "lr-006", nameEn: "Refer a Friend", nameAr: "أحل صديق",
    type: "referral", status: "active",
    descEn: "Both referrer and referred get 750 points when the new member makes their first purchase.",
    descAr: "يحصل المُحيل والمُحال كلاهما على 750 نقطة عند أول شراء للعضو الجديد.",
    pointsAwarded: 750, priority: 25,
    createdAt: "2026-03-01T10:00:00Z", updatedAt: "2026-03-01T10:00:00Z",
  },
  {
    id: "lr-007", nameEn: "VIP Threshold Bonus", nameAr: "مكافأة حد الـ VIP",
    type: "threshold", status: "active",
    descEn: "3,000 bonus points when cumulative spend reaches 50,000 EGP (VIP threshold).",
    descAr: "3,000 نقطة مكافأة عند وصول الإنفاق التراكمي إلى 50,000 ج.م (حد VIP).",
    pointsAwarded: 3000, minAmount: 50000, priority: 30,
    createdAt: "2026-01-15T10:00:00Z", updatedAt: "2026-04-12T11:00:00Z",
  },
  {
    id: "lr-008", nameEn: "Ramadan Campaign 2026", nameAr: "حملة رمضان 2026",
    type: "campaign", status: "expired",
    descEn: "1.5x points during Ramadan 2026. Campaign ended March 30, 2026.",
    descAr: "1.5x نقاط خلال رمضان 2026. انتهت الحملة في 30 مارس 2026.",
    multiplier: 1.5, startsAt: "2026-03-01T00:00:00Z", endsAt: "2026-03-30T23:59:59Z", priority: 50,
    createdAt: "2026-02-15T10:00:00Z", updatedAt: "2026-03-30T23:59:59Z",
  },
];

export function loadLoyaltyRules(): LoyaltyRuleDemo[] {
  return RULES;
}

// ─── Sync Logs ───────────────────────────────────────────

export type SyncEventType = "order_created" | "order_updated" | "order_refunded" | "customer_created" | "customer_updated" | "points_awarded" | "points_reversed" | "webhook_received" | "connection_test" | "metafield_synced" | "products_pulled" | "products_pushed" | "inventory_pulled" | "inventory_pushed" | "orders_pulled" | "customers_pulled" | "config_saved";
export type SyncEventStatus = "success" | "failed" | "skipped" | "pending";

export interface ShopifySyncLogDemo {
  id: string;
  eventType: SyncEventType;
  status: SyncEventStatus;
  shopifyOrderId?: string;
  shopifyCustomerId?: string;
  memberName?: string;
  pointsDelta?: number;
  details: string;
  errorMessage?: string;
  createdAt: string;
}

export const SYNC_EVENT_META: Record<SyncEventType, { en: string; ar: string; icon: string }> = {
  order_created:    { en: "Order Created",    ar: "طلب جديد",       icon: "ShoppingCart" },
  order_updated:    { en: "Order Updated",    ar: "تحديث طلب",      icon: "RefreshCw" },
  order_refunded:   { en: "Order Refunded",   ar: "استرجاع طلب",    icon: "RotateCcw" },
  customer_created: { en: "Customer Created", ar: "عميل جديد",      icon: "UserPlus" },
  customer_updated: { en: "Customer Updated", ar: "تحديث عميل",     icon: "UserCheck" },
  points_awarded:   { en: "Points Awarded",   ar: "نقاط مكتسبة",    icon: "Star" },
  points_reversed:  { en: "Points Reversed",  ar: "نقاط معكوسة",    icon: "RotateCcw" },
  webhook_received: { en: "Webhook Received", ar: "ويب هوك",        icon: "Webhook" },
  connection_test:  { en: "Connection Test",  ar: "اختبار اتصال",    icon: "Wifi" },
  metafield_synced: { en: "Metafield Synced", ar: "مزامنة حقل",     icon: "ArrowUpDown" },
  products_pulled:  { en: "Products Imported",  ar: "استيراد منتجات",  icon: "ArrowUpDown" },
  products_pushed:  { en: "Products Published", ar: "نشر منتجات",      icon: "ArrowUpDown" },
  inventory_pulled: { en: "Stock Imported",     ar: "استيراد مخزون",   icon: "ArrowUpDown" },
  inventory_pushed: { en: "Stock Pushed",       ar: "تصدير مخزون",     icon: "ArrowUpDown" },
  orders_pulled:    { en: "Orders Imported",    ar: "استيراد طلبات",   icon: "ShoppingCart" },
  customers_pulled: { en: "Customers Imported", ar: "استيراد عملاء",   icon: "UserPlus" },
  config_saved:     { en: "Settings Saved",     ar: "حفظ الإعدادات",   icon: "RefreshCw" },
};

export const SYNC_STATUS_META: Record<SyncEventStatus, { en: string; ar: string; dot: string; pill: string }> = {
  success: { en: "Success", ar: "ناجح",    dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700" },
  failed:  { en: "Failed",  ar: "فشل",     dot: "bg-rose-500",    pill: "bg-rose-50 text-rose-700" },
  skipped: { en: "Skipped", ar: "تم تخطيه", dot: "bg-amber-400",   pill: "bg-amber-50 text-amber-700" },
  pending: { en: "Pending", ar: "قيد الانتظار", dot: "bg-blue-400", pill: "bg-blue-50 text-blue-700" },
};

const SYNC_LOGS: ShopifySyncLogDemo[] = [
  { id: "sl-001", eventType: "webhook_received", status: "success", details: "orders/create webhook validated (HMAC OK)", createdAt: "2026-06-10T08:30:15Z" },
  { id: "sl-002", eventType: "order_created", status: "success", shopifyOrderId: "SHP-4535", shopifyCustomerId: "gid://shopify/Customer/7008", memberName: "Nour El-Din", pointsDelta: 4800, details: "Order SHP-4535 processed. 4,800 pts awarded to Nour El-Din (Gold, 2.0x multiplier from Eid preview).", createdAt: "2026-06-10T08:30:16Z" },
  { id: "sl-003", eventType: "points_awarded", status: "success", memberName: "Nour El-Din", pointsDelta: 4800, details: "Points balance updated: 17,300 → 22,100", createdAt: "2026-06-10T08:30:17Z" },
  { id: "sl-004", eventType: "metafield_synced", status: "success", shopifyCustomerId: "gid://shopify/Customer/7008", details: "Metafield loyalty.points_balance synced → 22,100", createdAt: "2026-06-10T08:30:18Z" },
  { id: "sl-005", eventType: "webhook_received", status: "success", details: "orders/create webhook validated (HMAC OK)", createdAt: "2026-06-09T09:00:02Z" },
  { id: "sl-006", eventType: "order_created", status: "success", shopifyOrderId: "SHP-4530", shopifyCustomerId: "gid://shopify/Customer/7002", memberName: "Sara Al-Rashid", pointsDelta: 12000, details: "Order SHP-4530 processed. 12,000 pts awarded to Sara Al-Rashid (VIP, 2.0x multiplier).", createdAt: "2026-06-09T09:00:03Z" },
  { id: "sl-007", eventType: "points_awarded", status: "success", memberName: "Sara Al-Rashid", pointsDelta: 12000, details: "Points balance updated: 33,800 → 45,800", createdAt: "2026-06-09T09:00:04Z" },
  { id: "sl-008", eventType: "webhook_received", status: "success", details: "orders/create webhook validated (HMAC OK)", createdAt: "2026-06-08T11:00:01Z" },
  { id: "sl-009", eventType: "order_created", status: "success", shopifyOrderId: "SHP-4525", shopifyCustomerId: "gid://shopify/Customer/7005", memberName: "Youssef Nabil", pointsDelta: 7500, details: "Order SHP-4525 processed. 7,500 pts awarded to Youssef Nabil (Gold, 1.5x multiplier).", createdAt: "2026-06-08T11:00:02Z" },
  { id: "sl-010", eventType: "order_refunded", status: "success", shopifyOrderId: "SHP-4488", memberName: "Nour El-Din", pointsDelta: -1200, details: "Refund on SHP-4488. 1,200 pts reversed from Nour El-Din.", createdAt: "2026-06-03T09:00:05Z" },
  { id: "sl-011", eventType: "points_reversed", status: "success", memberName: "Nour El-Din", pointsDelta: -1200, details: "Points balance updated: 18,500 → 17,300", createdAt: "2026-06-03T09:00:06Z" },
  { id: "sl-012", eventType: "customer_created", status: "success", shopifyCustomerId: "gid://shopify/Customer/7010", details: "New Shopify customer detected. No matching THOTH member — created pending match.", createdAt: "2026-06-02T16:30:00Z" },
  { id: "sl-013", eventType: "webhook_received", status: "failed", details: "HMAC validation failed — request rejected", errorMessage: "Invalid HMAC signature. Expected sha256=abc... got sha256=xyz...", createdAt: "2026-06-01T03:15:00Z" },
  { id: "sl-014", eventType: "order_created", status: "skipped", shopifyOrderId: "SHP-4400", details: "Order total 0 EGP (free sample). Skipped — no points awarded for zero-value orders.", createdAt: "2026-05-28T14:20:00Z" },
  { id: "sl-015", eventType: "connection_test", status: "success", details: "Shopify API connection test passed. Store: my-store.myshopify.com, API version: 2024-01", createdAt: "2026-05-25T10:00:00Z" },
];

export function loadShopifySyncLogs(): ShopifySyncLogDemo[] {
  return SYNC_LOGS;
}

// ─── Summary stats ────────────────────────────────────────

export function computeLoyaltyStats(members: LoyaltyMemberDemo[], transactions: LoyaltyTransactionDemo[]) {
  const totalMembers = members.length;
  const activeMembers = members.filter(m => {
    const last = new Date(m.lastPurchaseAt);
    const ago90 = new Date(); ago90.setDate(ago90.getDate() - 90);
    return last >= ago90;
  }).length;

  const totalIssued = members.reduce((s, m) => s + m.lifetimePoints, 0);
  const totalRedeemed = members.reduce((s, m) => s + m.redeemedPoints, 0);
  const outstanding = members.reduce((s, m) => s + m.currentPoints, 0);
  const totalExpired = members.reduce((s, m) => s + m.expiredPoints, 0);

  const onlineTx = transactions.filter(t => t.source === "shopify").length;
  const storeTx = transactions.filter(t => t.source === "store").length;

  const redemptionRate = totalIssued > 0 ? Math.round((totalRedeemed / totalIssued) * 100) : 0;

  const tierDist: Record<LoyaltyTierSlug, number> = { bronze: 0, silver: 0, gold: 0, vip: 0 };
  members.forEach(m => { tierDist[m.tier]++; });

  return {
    totalMembers, activeMembers,
    totalIssued, totalRedeemed, outstanding, totalExpired,
    onlineTx, storeTx, redemptionRate, tierDist,
  };
}
