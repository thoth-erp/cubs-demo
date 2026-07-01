import { Menu, Search, Languages } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useLocation } from "wouter";

const routeLabels: Record<string, { en: string; ar: string }> = {
  "/":                    { en: "Products",         ar: "المنتجات" },
  "/products":            { en: "Products",         ar: "المنتجات" },
  "/inventory":           { en: "Inventory",        ar: "المخزون" },
  "/inventory/raw-materials": { en: "Raw Materials", ar: "المواد الخام" },
  "/inventory/assets":    { en: "Assets",           ar: "الأصول" },
  "/procurement":         { en: "Procurement",      ar: "المشتريات والطلبات" },
  "/loyalty":             { en: "Loyalty",          ar: "الولاء" },
  "/loyalty/lookup":      { en: "Staff Lookup",     ar: "بحث العملاء" },
  "/loyalty/transactions":{ en: "Transactions",     ar: "المعاملات" },
  "/loyalty/rules":       { en: "Rules",            ar: "القواعد" },
  "/loyalty/redemptions": { en: "Redemptions",      ar: "الاستبدال" },
  "/loyalty/campaigns":   { en: "Campaigns",        ar: "الحملات" },
  "/loyalty/rewards":     { en: "Rewards",          ar: "المكافآت" },
  "/loyalty/analytics":   { en: "Analytics",        ar: "التحليلات" },
  "/loyalty/merge":       { en: "Merge",            ar: "الدمج" },
  "/loyalty/notifications":{ en: "Notifications",   ar: "الإشعارات" },
  "/loyalty/shopify":     { en: "Shopify",          ar: "شوبيفاي" },
  "/loyalty/settings":    { en: "Settings",         ar: "الإعدادات" },
};

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { lang, setLang } = useLanguage();
  const [location] = useLocation();
  const ar = lang === "ar";

  const pageLabel = routeLabels[location]
    ?? Object.entries(routeLabels).find(([path]) => path !== "/" && location.startsWith(path + "/"))?.[1]
    ?? { en: "CUBS", ar: "كابس" };

  return (
    <header className="h-[56px] shrink-0 flex items-center px-4 gap-3 thoth-glass border-b sticky top-0 z-30">
      {/* Left: Hamburger + breadcrumb */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <button onClick={onMenuClick} aria-label="Menu"
          className="md:hidden w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <Menu size={17} strokeWidth={1.75} />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <span className="thoth-eyebrow hidden sm:inline select-none">CUBS</span>
          <span className="text-border/80 text-xs hidden sm:inline select-none">/</span>
          <h1 className="text-[13px] font-medium text-foreground truncate" style={{ letterSpacing: "-0.01em" }}>
            {ar ? pageLabel.ar : pageLabel.en}
          </h1>
        </div>
      </div>

      {/* Right: Language toggle */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setLang(lang === "en" ? "ar" : "en")}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border/60 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title={ar ? "تغيير اللغة" : "Switch language"}
        >
          <Languages size={14} />
          <span className="hidden sm:inline">{ar ? "EN" : "عربي"}</span>
        </button>
      </div>
    </header>
  );
}
