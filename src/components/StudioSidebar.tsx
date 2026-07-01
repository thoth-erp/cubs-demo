import { useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, ChevronRight, FileText,
  Home, Star, Clock, Users, LayoutTemplate, Brain, FolderClosed,
  Lock, Trash2, GripVertical, PanelLeftClose, PanelLeftOpen,
  Database, StarOff, LayoutGrid,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { STUDIO_FOLDERS, STUDIO_PAGES, STUDIO_MEMBERS } from "../lib/studio-data";

const SIDEBAR_SECTIONS = [
  { id: "home", icon: Home, en: "Home", ar: "الرئيسية", path: "/studio" },
  { id: "favorites", icon: Star, en: "Favorites", ar: "المفضلة", path: "/studio?filter=favorites" },
  { id: "recent", icon: Clock, en: "Recent", ar: "الأخيرة", path: "/studio?filter=recent" },
  { id: "shared", icon: Users, en: "Shared with me", ar: "المشتركة معي", path: "/studio?filter=shared" },
  { id: "templates", icon: LayoutTemplate, en: "Templates", ar: "القوالب", path: "/studio?filter=templates" },
  { id: "knowledge", icon: Brain, en: "Knowledge Base", ar: "قاعدة المعرفة", path: "/studio?filter=knowledge" },
];

const BOTTOM_SECTIONS = [
  { id: "projects", icon: FolderClosed, en: "Projects", ar: "المشاريع", path: "/studio?filter=projects" },
  { id: "private", icon: Lock, en: "Private", ar: "خاص", path: "/studio?filter=private" },
  { id: "trash", icon: Trash2, en: "Trash", ar: "السلة", path: "/studio?filter=trash" },
];

export default function StudioSidebar() {
  const { lang, isRtl } = useLanguage();
  const [location, setLocation] = useLocation();
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    STUDIO_FOLDERS.forEach(f => { if (f.is_expanded) initial[f.id] = true; });
    return initial;
  });
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("studio:search-toggle"));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toggleFolder = useCallback((id: string) => {
    setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const rootFolders = STUDIO_FOLDERS.filter(f => f.parent_id === null);

  const getPageTitle = (pageId: string) => {
    const page = STUDIO_PAGES.find(p => p.id === pageId);
    return page ? (lang === "ar" ? page.title_ar : page.title) : pageId;
  };

  const getPageIcon = (pageId: string) => {
    const page = STUDIO_PAGES.find(p => p.id === pageId);
    return page?.icon ?? "📄";
  };

  const isPageFavorite = (pageId: string) => {
    const page = STUDIO_PAGES.find(p => p.id === pageId);
    return page?.is_favorite ?? false;
  };

  const isActive = (path: string) => {
    if (path === "/studio") return location === "/studio" || location === "/studio/home";
    return location.includes(path);
  };

  if (collapsed) {
    return (
      <div className={`w-14 h-full flex flex-col items-center bg-card/80 backdrop-blur-sm border-r border-border/40 ${isRtl ? "border-r-0 border-l border-l-border/40" : ""}`}>
        <div className="py-4 space-y-1">
          <button
            onClick={() => setCollapsed(false)}
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white"
            title={lang === "ar" ? "توسيع" : "Expand"}
          >
            <PanelLeftOpen size={14} />
          </button>
        </div>
        <div className="flex-1 space-y-1 py-2">
          {SIDEBAR_SECTIONS.map(section => {
            const active = isActive(section.path);
            return (
              <button
                key={section.id}
                onClick={() => setLocation(section.path)}
                title={lang === "ar" ? section.ar : section.en}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 ${
                  active ? "bg-accent/60 text-primary" : "text-muted-foreground hover:bg-accent/30 hover:text-foreground"
                }`}
              >
                <section.icon size={16} />
              </button>
            );
          })}
        </div>
        <div className="py-3 space-y-1">
          {STUDIO_MEMBERS.slice(0, 4).map(member => (
            <div
              key={member.id}
              className="w-7 h-7 rounded-full mx-auto flex items-center justify-center text-[9px] font-bold text-white"
              style={{ backgroundColor: member.avatar }}
              title={lang === "ar" ? member.name_ar : member.name}
            >
              {(lang === "ar" ? member.name_ar : member.name).charAt(0)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-64 h-full flex flex-col bg-card/80 backdrop-blur-sm border-r border-border/40 ${isRtl ? "border-r-0 border-l border-l-border/40" : ""}`}>
      {/* Header */}
      <div className="px-4 py-4 border-b border-border/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm shadow-violet-500/20">
              <span className="text-white text-xs font-bold">S</span>
            </div>
            <span className="text-sm font-semibold tracking-tight">
              {lang === "ar" ? "الاستوديو" : "Studio"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("studio:search-toggle"))}
              className="p-1.5 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors group"
              title={`${lang === "ar" ? "بحث" : "Search"} ⌘K`}
            >
              <Search size={15} />
            </button>
            <button
              onClick={() => setCollapsed(true)}
              className="p-1.5 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors"
              title={lang === "ar" ? "طي" : "Collapse"}
            >
              <PanelLeftClose size={15} />
            </button>
          </div>
        </div>

        {/* Cmd+K hint */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border/30 bg-muted/30 text-muted-foreground/50 text-[11px] cursor-pointer hover:bg-accent/30 hover:text-muted-foreground transition-colors"
          onClick={() => window.dispatchEvent(new CustomEvent("studio:search-toggle"))}
        >
          <Search size={11} />
          <span className="flex-1">{lang === "ar" ? "بحث..." : "Search..."}</span>
          <kbd className="px-1.5 py-0.5 rounded bg-background/60 border border-border/30 text-[9px] font-mono">⌘K</kbd>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-3 py-3 border-b border-border/20">
        <div className="grid grid-cols-2 gap-1.5">
          <button className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-gradient-to-r from-violet-500/8 to-indigo-500/8 border border-violet-500/15 text-[11px] font-medium text-violet-600 dark:text-violet-400 hover:from-violet-500/15 hover:to-indigo-500/15 transition-all">
            <FileText size={12} />
            <span>{lang === "ar" ? "صفحة جديدة" : "New Page"}</span>
          </button>
          <button className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-gradient-to-r from-emerald-500/8 to-teal-500/8 border border-emerald-500/15 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:from-emerald-500/15 hover:to-teal-500/15 transition-all">
            <Database size={12} />
            <span>{lang === "ar" ? "قاعدة بيانات" : "New Database"}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {SIDEBAR_SECTIONS.map(section => {
          const active = isActive(section.path);
          return (
            <button
              key={section.id}
              onClick={() => setLocation(section.path)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 ${
                active
                  ? "bg-accent/60 text-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent/30 hover:text-foreground"
              }`}
            >
              <section.icon size={15} className={active ? "text-primary" : ""} />
              <span>{lang === "ar" ? section.ar : section.en}</span>
            </button>
          );
        })}

        {/* Folder Divider */}
        <div className="my-3 h-px bg-border/30" />

        {/* Folder Tree Header */}
        <div className="px-3 py-1.5">
          <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest">
            {lang === "ar" ? "المجلدات" : "Folders"}
          </span>
        </div>

        {/* Folder Tree */}
        {rootFolders.map(folder => (
          <div key={folder.id}>
            <button
              onClick={() => toggleFolder(folder.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-muted-foreground hover:bg-accent/30 hover:text-foreground transition-colors group relative`}
            >
              {/* Colored left border */}
              <div
                className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full opacity-60"
                style={{ backgroundColor: folder.color }}
              />
              <motion.span
                animate={{ rotate: expandedFolders[folder.id] ? 90 : 0 }}
                transition={{ duration: 0.15 }}
                className="text-muted-foreground/50 ml-1"
              >
                <ChevronRight size={12} />
              </motion.span>
              <span className="text-sm">{folder.icon}</span>
              <span className="flex-1 text-start truncate">{lang === "ar" ? folder.name_ar : folder.name}</span>
              <span className="text-[10px] text-muted-foreground/40 tabular-nums">{folder.page_ids.length}</span>
            </button>

            <AnimatePresence>
              {expandedFolders[folder.id] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className={`${isRtl ? "mr-4" : "ml-4"} space-y-0.5 relative`}>
                    {/* Vertical line */}
                    <div
                      className="absolute top-0 bottom-2 w-[1px] opacity-20"
                      style={{ backgroundColor: folder.color, [isRtl ? "right" : "left"]: "6px" }}
                    />
                    {folder.page_ids.map(pageId => (
                      <button
                        key={pageId}
                        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-[12.5px] text-muted-foreground hover:bg-accent/30 hover:text-foreground transition-colors group"
                      >
                        <GripVertical size={10} className="text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        <span className="text-xs">{getPageIcon(pageId)}</span>
                        <span className="flex-1 truncate text-start">{getPageTitle(pageId)}</span>
                        {isPageFavorite(pageId) && (
                          <Star size={10} className="text-amber-400 fill-amber-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {/* Bottom Divider */}
        <div className="my-3 h-px bg-border/30" />

        {/* Bottom Sections */}
        {BOTTOM_SECTIONS.map(section => {
          const active = isActive(section.path);
          return (
            <button
              key={section.id}
              onClick={() => setLocation(section.path)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 ${
                active
                  ? "bg-accent/60 text-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent/30 hover:text-foreground"
              }`}
            >
              <section.icon size={15} className={active ? "text-primary" : ""} />
              <span>{lang === "ar" ? section.ar : section.en}</span>
            </button>
          );
        })}
      </div>

      {/* Member Avatars */}
      <div className="px-4 py-3 border-t border-border/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
            {lang === "ar" ? "الأعضاء" : "Members"}
          </span>
          <span className="text-[10px] text-muted-foreground/40 tabular-nums">{STUDIO_MEMBERS.length}</span>
        </div>
        <div className="flex items-center -space-x-2">
          {STUDIO_MEMBERS.slice(0, 5).map(member => (
            <div
              key={member.id}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2 border-card/80 relative group cursor-pointer"
              style={{ backgroundColor: member.avatar }}
              title={lang === "ar" ? member.name_ar : member.name}
            >
              {(lang === "ar" ? member.name_ar : member.name).charAt(0)}
              {member.status === "active" && (
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-card/80" />
              )}
            </div>
          ))}
          {STUDIO_MEMBERS.length > 5 && (
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-medium text-muted-foreground bg-muted border-2 border-card/80">
              +{STUDIO_MEMBERS.length - 5}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
