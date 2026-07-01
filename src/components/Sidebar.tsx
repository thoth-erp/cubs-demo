import { Link, useLocation } from "wouter";
import { Logo } from "./Logo";
import {
  Layers, Archive, ShoppingCart, Gift, Wrench,
  ChevronLeft, ChevronRight, X,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useState } from "react";

// ─── Nav structure ────────────────────────────────────────

type Leaf = { id: string; icon: React.ElementType; labelEn: string; labelAr: string; path: string };

interface TreeNode {
  id: string; icon: React.ElementType; labelEn: string; labelAr: string;
  path?: string;
  children?: Leaf[];
}

const MENU: TreeNode[] = [
  { id: "products", icon: Layers, labelEn: "Products", labelAr: "المنتجات", path: "/products" },
  { id: "g-inventory", icon: Archive, labelEn: "Inventory", labelAr: "المخزون", children: [
    { id: "inv-raw", icon: Layers, labelEn: "Raw Materials", labelAr: "المواد الخام", path: "/inventory/raw-materials" },
    { id: "inv-assets", icon: Wrench, labelEn: "Assets", labelAr: "الأصول", path: "/inventory/assets" },
  ] },
  { id: "procurement", icon: ShoppingCart, labelEn: "Procurement", labelAr: "المشتريات", path: "/procurement" },
  { id: "g-loyalty", icon: Gift, labelEn: "Loyalty", labelAr: "الولاء", children: [
    { id: "loyalty", icon: Gift, labelEn: "Dashboard", labelAr: "لوحة الولاء", path: "/loyalty" },
    { id: "loyalty-lookup", icon: Layers, labelEn: "Staff Lookup", labelAr: "بحث العملاء", path: "/loyalty/lookup" },
    { id: "loyalty-tx", icon: Layers, labelEn: "Transactions", labelAr: "المعاملات", path: "/loyalty/transactions" },
    { id: "loyalty-rules", icon: Layers, labelEn: "Rules", labelAr: "القواعد", path: "/loyalty/rules" },
    { id: "loyalty-redemptions", icon: Layers, labelEn: "Redemptions", labelAr: "الاستبدال", path: "/loyalty/redemptions" },
    { id: "loyalty-campaigns", icon: Layers, labelEn: "Campaigns", labelAr: "الحملات", path: "/loyalty/campaigns" },
    { id: "loyalty-rewards", icon: Layers, labelEn: "Rewards", labelAr: "المكافآت", path: "/loyalty/rewards" },
    { id: "loyalty-analytics", icon: Layers, labelEn: "Analytics", labelAr: "التحليلات", path: "/loyalty/analytics" },
    { id: "loyalty-merge", icon: Layers, labelEn: "Merge", labelAr: "الدمج", path: "/loyalty/merge" },
    { id: "loyalty-notify", icon: Layers, labelEn: "Notifications", labelAr: "الإشعارات", path: "/loyalty/notifications" },
    { id: "loyalty-shopify", icon: Layers, labelEn: "Shopify", labelAr: "شوبيفاي", path: "/loyalty/shopify" },
    { id: "loyalty-settings", icon: Layers, labelEn: "Settings", labelAr: "الإعدادات", path: "/loyalty/settings" },
  ] },
];

// ─── Nav item ─────────────────────────────────────────────

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  path: string;
  isActive: boolean;
  collapsed: boolean;
  onClick?: () => void;
}

function NavItem({ icon: Icon, label, path, isActive, collapsed, onClick }: NavItemProps) {
  return (
    <Link
      href={path}
      onClick={onClick}
      className={`
        group relative flex items-center gap-2.5 px-3 py-2 rounded-lg
        transition-all duration-150 select-none
        ${collapsed ? "justify-center" : ""}
        ${isActive
          ? "thoth-primary-selected text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
        }
      `}
    >
      <Icon size={15} strokeWidth={isActive ? 2 : 1.75} className="shrink-0" />
      {!collapsed && <span className="text-[13px] leading-none truncate">{label}</span>}
      {collapsed && (
        <div className="pointer-events-none absolute start-full ms-2.5 z-50 px-2.5 py-1.5 rounded-lg bg-popover border border-border text-foreground shadow-md text-[12px] whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-0 transition-opacity duration-150">
          {label}
        </div>
      )}
    </Link>
  );
}

// ─── Collapsible parent group ─────────────────────────────

function NavGroup({ node, collapsed, currentPath, ar, onNavClick }: {
  node: TreeNode; collapsed: boolean; currentPath: string; ar: boolean; onNavClick?: () => void;
}) {
  const Icon = node.icon;
  const children = node.children || [];
  const anyActive = children.some((c) => currentPath.startsWith(c.path));
  const [open, setOpen] = useState(anyActive);

  if (collapsed) {
    return (
      <>
        {children.map((c) => (
          <NavItem key={c.id} icon={c.icon} label={ar ? c.labelAr : c.labelEn}
            path={c.path} isActive={currentPath.startsWith(c.path)} collapsed onClick={onNavClick} />
        ))}
      </>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`group w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 select-none ${anyActive && !open ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"}`}
      >
        <Icon size={15} strokeWidth={anyActive ? 2 : 1.75} className="shrink-0" />
        <span className="text-[13px] leading-none truncate flex-1 text-start">{ar ? node.labelAr : node.labelEn}</span>
        <ChevronRight size={13} className={`shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""} ${ar ? "rotate-180" : ""}`} style={ar ? { transform: open ? "rotate(90deg)" : "rotate(180deg)" } : undefined} />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${open ? "max-h-[640px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="ms-3.5 ps-2.5 border-s border-border/40 mt-0.5 space-y-0.5 py-0.5">
          {children.map((c) => (
            <NavItem key={c.id} icon={c.icon} label={ar ? c.labelAr : c.labelEn}
              path={c.path} isActive={currentPath.startsWith(c.path)} collapsed={false} onClick={onNavClick} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Section label ────────────────────────────────────────

function SectionLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) return <div className="my-1 border-t border-border/30 mx-1" />;
  return <p className="px-3 pt-3 pb-1 text-[9px] text-muted-foreground/40 tracking-[0.1em] uppercase font-medium">{label}</p>;
}

// ─── Sidebar content ──────────────────────────────────────

function SidebarContent({ collapsed, setCollapsed, onNavClick }: {
  collapsed: boolean; setCollapsed: (v: boolean) => void; onNavClick?: () => void;
}) {
  const { lang, isRtl } = useLanguage();
  const [location] = useLocation();
  const ar = lang === "ar";

  function isActive(path: string) {
    return path === "/" ? location === "/" : location.startsWith(path);
  }

  return (
    <div className="flex flex-col h-full thoth-glass relative">
      {/* Logo row */}
      <div className="h-[56px] flex items-center px-4 shrink-0 overflow-hidden">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Logo variant="mark" size={22} />
          {!collapsed && <Logo variant="wordmark" size={15} />}
        </div>
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} aria-label="Collapse sidebar"
            className="hidden md:flex w-6 h-6 rounded-md shrink-0 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors duration-150">
            {isRtl ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 flex flex-col gap-0.5">
        <SectionLabel label={ar ? "مساحة العمل" : "Workspace"} collapsed={collapsed} />
        {MENU.map((node) => (
          node.children
            ? <NavGroup key={node.id} node={node} collapsed={collapsed} currentPath={location} ar={ar} onNavClick={onNavClick} />
            : <NavItem key={node.id} icon={node.icon}
                label={ar ? node.labelAr : node.labelEn}
                path={node.path!} isActive={isActive(node.path!)} collapsed={collapsed} onClick={onNavClick} />
        ))}
      </nav>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button onClick={() => setCollapsed(false)} aria-label="Expand sidebar"
          className="hidden md:flex mx-auto mb-2 w-7 h-7 rounded-lg items-center justify-center text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors duration-150">
          {isRtl ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
        </button>
      )}

      {/* Company area */}
      <div className="p-3 border-t border-border/40 shrink-0 flex items-center gap-2.5 overflow-hidden">
        <div className="w-8 h-8 rounded-lg shrink-0 bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold tracking-wide select-none">
          CB
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-[12.5px] font-medium text-foreground truncate leading-tight">CUBS</span>
            <span className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">Manufacturing ERP</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden md:block h-full shrink-0 border-e border-sidebar-border/60 transition-all duration-300 ease-in-out ${collapsed ? "w-[60px]" : "w-[220px]"}`}>
        <SidebarContent collapsed={collapsed} setCollapsed={setCollapsed} />
      </aside>

      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-foreground/20 backdrop-blur-[2px] md:hidden transition-opacity duration-200 ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setMobileOpen(false)} aria-hidden="true"
      />

      {/* Mobile drawer */}
      <aside className={`fixed top-0 start-0 bottom-0 z-50 w-[260px] md:hidden transition-transform duration-300 ease-in-out border-e border-sidebar-border/60 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`} style={{ direction: "inherit" }}>
        <button onClick={() => setMobileOpen(false)} aria-label="Close menu"
          className="absolute top-4 end-4 z-10 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors">
          <X size={15} />
        </button>
        <SidebarContent collapsed={false} setCollapsed={() => {}} onNavClick={() => setMobileOpen(false)} />
      </aside>
    </>
  );
}
