import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, FileText, Database, LayoutTemplate, ArrowRight,
  Clock, Command, CornerDownLeft, ArrowUp, ArrowDown,
  Sparkles, Zap, BookOpen,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { searchStudio, STUDIO_TEMPLATES, type StudioSearchResult } from "../lib/studio-data";

const EASE_OUT_QUINT = [0.22, 1, 0.36, 1] as const;

const TYPE_BADGES: Record<string, { en: string; ar: string; color: string }> = {
  page: { en: "Page", ar: "صفحة", color: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  block: { en: "Block", ar: "كتلة", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  database: { en: "Database", ar: "قاعدة بيانات", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  template: { en: "Template", ar: "قالب", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
};

const TYPE_ICONS: Record<string, typeof FileText> = {
  page: FileText, block: Zap, database: Database, template: LayoutTemplate,
};

const MAX_RECENT = 5;
const RECENT_KEY = "thoth_studio_search_recent";

function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  const recent = getRecentSearches().filter(r => r !== query);
  recent.unshift(query);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

const SUGGESTIONS = [
  { icon: BookOpen, en: "HR Handbook", ar: "دليل الموارد البشرية" },
  { icon: Sparkles, en: "Brand Guidelines", ar: "إرشادات العلامة التجارية" },
  { icon: LayoutTemplate, en: "Meeting Notes", ar: "محضر اجتماع" },
];

interface StudioSearchProps {
  open: boolean;
  onClose: () => void;
}

export default function StudioSearch({ open, onClose }: StudioSearchProps) {
  const { lang, isRtl } = useLanguage();
  const ar = lang === "ar";
  const [, navigate] = useLocation();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>(getRecentSearches);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return searchStudio(query);
  }, [query]);

  const templateResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return STUDIO_TEMPLATES.filter(t =>
      t.name.toLowerCase().includes(q) || t.name_ar.includes(query) ||
      t.description.toLowerCase().includes(q) || t.description_ar.includes(query)
    ).map(t => ({
      id: `tpl-${t.id}`, type: "template" as const, title: t.name, title_ar: t.name_ar,
      snippet: t.description, snippet_ar: t.description_ar,
      page_id: t.id, route: `/studio/home`, icon: t.icon, match_type: "title" as const,
    }));
  }, [query]);

  const allResults = useMemo(() => {
    const combined = [...results, ...templateResults];
    const seen = new Set<string>();
    return combined.filter(r => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
  }, [results, templateResults]);

  const grouped = useMemo(() => {
    const groups: Record<string, StudioSearchResult[]> = {};
    for (const r of allResults) {
      if (!groups[r.type]) groups[r.type] = [];
      groups[r.type].push(r);
    }
    return groups;
  }, [allResults]);

  const flatResults = useMemo(() => allResults, [allResults]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = useCallback((result: StudioSearchResult) => {
    saveRecentSearch(query);
    setRecentSearches(getRecentSearches());
    onClose();
    navigate(result.route);
  }, [query, onClose, navigate]);

  const handleRecentClick = useCallback((term: string) => {
    setQuery(term);
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, flatResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && flatResults[selectedIndex]) {
      e.preventDefault();
      handleSelect(flatResults[selectedIndex]);
    } else if (e.key === "Escape") {
      onClose();
    }
  }, [flatResults, selectedIndex, handleSelect, onClose]);

  useEffect(() => {
    if (selectedIndex > 0 && listRef.current) {
      const item = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  useEffect(() => {
    const handler = () => {
      if (open) onClose();
    };
    window.addEventListener("studio:search-toggle", handler as EventListener);
    return () => window.removeEventListener("studio:search-toggle", handler as EventListener);
  }, [open, onClose]);

  if (!open) return null;

  let flatIndex = -1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/60 backdrop-blur-md" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.2, ease: EASE_OUT_QUINT }}
            className="relative w-full max-w-[620px] mx-4 rounded-2xl border border-border/40 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border/30">
              <Search size={18} className="text-muted-foreground/50 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={ar ? "ابحث في الاستوديو..." : "Search Studio..."}
                className="flex-1 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="p-1 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-accent/30 transition-colors"
                >
                  <X size={15} />
                </button>
              )}
              <button
                onClick={onClose}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/50 text-[11px] text-muted-foreground/60 font-medium"
              >
                ESC
              </button>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[420px] overflow-y-auto p-2">
              {/* No query — show recent */}
              {!query.trim() && recentSearches.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <Clock size={12} className="text-muted-foreground/50" />
                    <span className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                      {ar ? "البحث الأخير" : "Recent Searches"}
                    </span>
                  </div>
                  {recentSearches.map(term => (
                    <button
                      key={term}
                      onClick={() => handleRecentClick(term)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-muted-foreground hover:bg-accent/30 hover:text-foreground transition-colors text-start"
                    >
                      <Clock size={13} className="text-muted-foreground/40 shrink-0" />
                      <span className="flex-1 truncate">{term}</span>
                      <ArrowRight size={12} className={`${isRtl ? "rotate-180" : ""} text-muted-foreground/30`} />
                    </button>
                  ))}
                </div>
              )}

              {/* No query — show suggestions */}
              {!query.trim() && (
                <div className="space-y-1 mt-2">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <Sparkles size={12} className="text-muted-foreground/50" />
                    <span className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                      {ar ? "اقتراحات" : "Suggestions"}
                    </span>
                  </div>
                  {SUGGESTIONS.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        saveRecentSearch(ar ? sug.ar : sug.en);
                        onClose();
                        navigate("/studio/home");
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/30 transition-colors text-start group"
                    >
                      <sug.icon size={15} className="text-primary/60 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium truncate group-hover:text-primary transition-colors">
                          {ar ? sug.ar : sug.en}
                        </p>
                      </div>
                      <ArrowRight size={12} className={`${isRtl ? "rotate-180" : ""} text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity`} />
                    </button>
                  ))}
                </div>
              )}

              {/* No query — show popular templates */}
              {!query.trim() && (
                <div className="space-y-1 mt-2">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <LayoutTemplate size={12} className="text-muted-foreground/50" />
                    <span className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                      {ar ? "القوالب الشائعة" : "Popular Templates"}
                    </span>
                  </div>
                  {STUDIO_TEMPLATES.slice(0, 4).map(tmpl => (
                    <button
                      key={tmpl.id}
                      onClick={() => {
                        saveRecentSearch(ar ? tmpl.name_ar : tmpl.name);
                        onClose();
                        navigate("/studio/home");
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/30 transition-colors text-start group"
                    >
                      <span className="text-lg">{tmpl.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium truncate group-hover:text-primary transition-colors">
                          {ar ? tmpl.name_ar : tmpl.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground/50 truncate">
                          {ar ? tmpl.description_ar : tmpl.description}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${TYPE_BADGES.template.color}`}>
                        {ar ? "قالب" : "Template"}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Query with results */}
              {query.trim() && flatResults.length > 0 && (
                <div className="space-y-3">
                  {Object.entries(grouped).map(([type, items]) => {
                    const badge = TYPE_BADGES[type] ?? TYPE_BADGES.page;
                    const TypeIcon = TYPE_ICONS[type] ?? FileText;
                    return (
                      <div key={type} className="space-y-0.5">
                        <div className="flex items-center gap-2 px-3 py-1.5">
                          <TypeIcon size={11} className="text-muted-foreground/40" />
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${badge.color}`}>
                            {ar ? badge.ar : badge.en}
                          </span>
                          <span className="text-[10px] text-muted-foreground/40 tabular-nums">{items.length}</span>
                        </div>
                        {items.map(item => {
                          flatIndex++;
                          const idx = flatIndex;
                          return (
                            <button
                              key={item.id}
                              data-index={idx}
                              onClick={() => handleSelect(item)}
                              onMouseEnter={() => setSelectedIndex(idx)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-start transition-colors group ${
                                selectedIndex === idx
                                  ? "bg-accent/50"
                                  : "hover:bg-accent/20"
                              }`}
                            >
                              <span className="text-lg shrink-0">{item.icon}</span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-[13px] font-medium truncate ${
                                  selectedIndex === idx ? "text-primary" : "group-hover:text-primary transition-colors"
                                }`}>
                                  {ar ? item.title_ar : item.title}
                                </p>
                                <p className="text-[11px] text-muted-foreground/50 truncate mt-0.5">
                                  {ar ? item.snippet_ar : item.snippet}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${badge.color}`}>
                                  {ar ? badge.ar : badge.en}
                                </span>
                                {selectedIndex === idx && (
                                  <CornerDownLeft size={11} className="text-muted-foreground/40" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Empty state */}
              {query.trim() && flatResults.length === 0 && (
                <div className="text-center py-12">
                  <Search size={32} className="mx-auto text-muted-foreground/20 mb-3" />
                  <p className="text-[13px] text-muted-foreground/60 mb-1">
                    {ar ? "لا توجد نتائج" : "No results found"}
                  </p>
                  <p className="text-[11px] text-muted-foreground/40">
                    {ar ? "جرب كلمات بحث مختلفة" : "Try different search terms"}
                  </p>
                </div>
              )}
            </div>

            {/* Footer hints */}
            <div className="flex items-center gap-4 px-5 py-2.5 border-t border-border/20 bg-muted/20">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/40">
                <ArrowUp size={10} /><ArrowDown size={10} />
                <span>{ar ? "للتنقل" : "Navigate"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/40">
                <CornerDownLeft size={10} />
                <span>{ar ? "لاختيار" : "Select"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/40">
                <Command size={10} />
                <span>K</span>
                <span>{ar ? "للبحث" : "Search"}</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
