/**
 * Breadcrumbs — Context-aware navigation breadcrumbs + recently visited tracking
 * التنقل — عرض المسار بين الصفحات مع تتبع الصفحات الأخيرة
 */

import { useLocation } from "wouter";
import { ChevronRight, ArrowLeft, Home } from "lucide-react";
import { motion } from "framer-motion";

export interface Crumb {
  label: string;
  path?: string;
}

interface Props {
  items: Crumb[];
  backLabel?: string;
  backPath?: string;
}

// ─── Route label mapping ─────────────────────────────────

const ROUTE_LABELS: Record<string, { en: string; ar: string }> = {
  "/": { en: "Dashboard", ar: "لوحة التحكم" },
  "/today": { en: "Today", ar: "اليوم" },
  "/activity": { en: "Activity", ar: "النشاط" },
  "/organizations": { en: "Customers", ar: "العملاء" },
  "/people": { en: "Contacts", ar: "جهات الاتصال" },
  "/products": { en: "Products", ar: "المنتجات" },
  "/quotations": { en: "Quotations", ar: "عروض الأسعار" },
  "/orders": { en: "Orders", ar: "طلبات العملاء" },
  "/site-visits": { en: "Site Visits", ar: "المعاينات" },
  "/designs": { en: "Designs", ar: "التصميمات" },
  "/production": { en: "Production", ar: "تخطيط الإنتاج" },
  "/quality": { en: "Quality", ar: "مراقبة الجودة" },
  "/delivery": { en: "Delivery", ar: "التسليم والتركيب" },
  "/hr": { en: "HR", ar: "الموارد البشرية" },
  "/inventory": { en: "Inventory", ar: "المخزن" },
  "/purchasing": { en: "Purchasing", ar: "المشتريات" },
  "/finance": { en: "Finance", ar: "الحسابات" },
  "/reports": { en: "Reports", ar: "التقارير" },
  "/analytics": { en: "Analytics", ar: "التحليلات" },
  "/users": { en: "Users & Access", ar: "المستخدمين" },
  "/settings": { en: "Settings", ar: "الإعدادات" },
  "/queue": { en: "Work Queue", ar: "أوامر التشغيل" },
  "/forecast": { en: "Forecast", ar: "التوقعات" },
  "/risk": { en: "Alerts", ar: "تنبيهات مهمة" },
  "/rhythms": { en: "Rhythms", ar: "الإيقاعات" },
  "/exec": { en: "Executive", ar: "التنفيذي" },
  "/intelligence": { en: "Intelligence", ar: "الذكاء" },
  "/memory": { en: "Memory", ar: "الذاكرة" },
  "/decisions": { en: "Decisions", ar: "القرارات" },
  "/data": { en: "Data", ar: "إدارة البيانات" },
  "/roadmap": { en: "Roadmap", ar: "خارطة الطريق" },
  "/sales": { en: "Sales", ar: "المبيعات" },
  "/work": { en: "Work", ar: "العمل" },
};

// ─── Recently visited tracking ───────────────────────────

const RECENT_KEY = "thoth_recent_pages";
const MAX_RECENT = 8;

export function trackPageVisit(path: string) {
  try {
    const stored = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]") as string[];
    const filtered = stored.filter(p => p !== path);
    filtered.unshift(path);
    localStorage.setItem(RECENT_KEY, JSON.stringify(filtered.slice(0, MAX_RECENT)));
  } catch { /* noop */ }
}

export function getRecentPages(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]") as string[];
  } catch { return []; }
}

export function getRouteLabel(path: string, lang: string): string {
  const labels = ROUTE_LABELS[path];
  if (labels) return lang === "ar" ? labels.ar : labels.en;
  return path.replace(/^\//, "").replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "Home";
}

// ─── Component ───────────────────────────────────────────

export default function Breadcrumbs({ items, backLabel, backPath }: Props) {
  const [, navigate] = useLocation();

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex items-center gap-1.5 text-[12px] mb-1"
    >
      {backPath && (
        <button onClick={() => navigate(backPath)} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors group mr-1">
          <ArrowLeft size={12} strokeWidth={2} className="group-hover:-translate-x-0.5 transition-transform" />
          {backLabel}
        </button>
      )}
      {items.map((crumb, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="inline-flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={11} className="text-muted-foreground/40" />}
            {crumb.path && !isLast ? (
              <button onClick={() => navigate(crumb.path!)} className="text-muted-foreground hover:text-foreground transition-colors">{crumb.label}</button>
            ) : (
              <span className={isLast ? "text-foreground/70 truncate max-w-[200px]" : "text-muted-foreground"}>{crumb.label}</span>
            )}
          </span>
        );
      })}
    </motion.div>
  );
}
