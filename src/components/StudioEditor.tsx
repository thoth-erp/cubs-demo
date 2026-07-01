import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLanguage } from "../context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, GripVertical, Trash2, Copy, ArrowRightLeft,
  Type, Heading1, Heading2, Heading3, List, ListOrdered,
  CheckSquare, Minus, Quote, AlertCircle, Code, ChevronRight,
  ChevronDown, Check, Loader2, Search, Image, Video, FileText,
  Music, Calendar, Table2, LayoutGrid, Columns3, GitBranch,
  BarChart3, Palette, Box, Link2, Bookmark, Calculator,
  Sparkles, Zap, Database, Clock, Map, LayoutList,
  CreditCard, Smartphone, Globe, Paperclip, Smile, Mic,
  Users, Package, TrendingUp, Briefcase,
} from "lucide-react";
import type { StudioBlock, BlockType } from "../lib/studio-data";

interface Props {
  blocks: StudioBlock[];
  onBlocksChange: (blocks: StudioBlock[]) => void;
}

// ═══════════════════════════════════════════════════════════
// BLOCK TYPE DEFINITIONS WITH CATEGORIES
// ═══════════════════════════════════════════════════════════

interface BlockTypeDef {
  type: BlockType;
  label: string;
  labelAr: string;
  description: string;
  descriptionAr: string;
  icon: React.ElementType;
  category: string;
  shortcut?: string;
}

const BLOCK_TYPES: BlockTypeDef[] = [
  // Basic
  { type: "text", label: "Text", labelAr: "نص", description: "Plain text block", descriptionAr: "نص عادي", icon: Type, category: "basic", shortcut: "/" },
  { type: "h1", label: "Heading 1", labelAr: "عنوان ١", description: "Large section heading", descriptionAr: "عنوان قسم كبير", icon: Heading1, category: "basic", shortcut: "# " },
  { type: "h2", label: "Heading 2", labelAr: "عنوان ٢", description: "Medium section heading", descriptionAr: "عنوان قسم متوسط", icon: Heading2, category: "basic", shortcut: "## " },
  { type: "h3", label: "Heading 3", labelAr: "عنوان ٣", description: "Small section heading", descriptionAr: "عنوان قسم صغير", icon: Heading3, category: "basic", shortcut: "### " },
  { type: "divider", label: "Divider", labelAr: "فاصل", description: "Visual separator line", descriptionAr: "خط فاصل بصري", icon: Minus, category: "basic", shortcut: "---" },
  { type: "quote", label: "Quote", labelAr: "اقتباس", description: "Capture a quote", descriptionAr: "أcaught اقتباس", icon: Quote, category: "basic", shortcut: "> " },
  { type: "callout", label: "Callout", labelAr: "تنبيه", description: "Highlight important info", descriptionAr: "تمييز معلومات مهمة", icon: AlertCircle, category: "basic" },
  { type: "code", label: "Code", labelAr: "كود", description: "Code snippet with syntax highlighting", descriptionAr: "stice كود مع تمييز بناء الأكواد", icon: Code, category: "basic", shortcut: "```" },
  { type: "toggle", label: "Toggle", labelAr: "طي", description: "Collapsible content", descriptionAr: "محتوى قابل للطي", icon: ChevronRight, category: "basic" },

  // Lists
  { type: "bullet_list", label: "Bullet List", labelAr: "قائمة نقطية", description: "Create a simple list", descriptionAr: "إنشاء قائمة بسيطة", icon: List, category: "list", shortcut: "- " },
  { type: "numbered_list", label: "Numbered List", labelAr: "قائمة مرقمة", description: "Create an ordered list", descriptionAr: "إنشاء قائمة مرتبة", icon: ListOrdered, category: "list", shortcut: "1. " },
  { type: "checklist", label: "Checklist", labelAr: "قائمة تحقق", description: "Track tasks with checkboxes", descriptionAr: "تتبع المهام بخانات التحقق", icon: CheckSquare, category: "list", shortcut: "[] " },

  // Media
  { type: "image", label: "Image", labelAr: "صورة", description: "Upload or embed an image", descriptionAr: "رفع أو تضمين صورة", icon: Image, category: "media" },
  { type: "video", label: "Video", labelAr: "فيديو", description: "Embed a video", descriptionAr: "تضمين فيديو", icon: Video, category: "media" },
  { type: "file", label: "File", labelAr: "ملف", description: "Upload a file", descriptionAr: "رفع ملف", icon: Paperclip, category: "media" },
  { type: "audio", label: "Audio", labelAr: "صوت", description: "Embed audio content", descriptionAr: "تضمين محتوى صوتي", icon: Music, category: "media" },
  { type: "pdf", label: "PDF", labelAr: "PDF", description: "Embed a PDF document", descriptionAr: "تضمين مستند PDF", icon: FileText, category: "media" },
  { type: "embed", label: "Embed", labelAr: "تضمين", description: "Embed external content", descriptionAr: "تضمين محتوى خارجي", icon: Link2, category: "media" },
  { type: "bookmark", label: "Bookmark", labelAr: "علامة مرجعية", description: "Save a web link with preview", descriptionAr: "حفظ رابط ويب مع معاينة", icon: Bookmark, category: "media" },

  // Advanced
  { type: "table", label: "Table", labelAr: "جدول", description: "Create a data table", descriptionAr: "إنشاء جدول بيانات", icon: Table2, category: "advanced" },
  { type: "columns", label: "Columns", labelAr: "أعمدة", description: "Multi-column layout", descriptionAr: "تخطيط متعدد الأعمدة", icon: Columns3, category: "advanced" },
  { type: "gallery", label: "Gallery", labelAr: "معرض", description: "Image gallery grid", descriptionAr: "شبكة معرض الصور", icon: LayoutGrid, category: "advanced" },
  { type: "kanban", label: "Kanban Board", labelAr: "لوحة كانبان", description: "Task board view", descriptionAr: "عرض لوحة المهام", icon: LayoutList, category: "advanced" },
  { type: "timeline", label: "Timeline", labelAr: "جدول زمني", description: "Chronological timeline", descriptionAr: "جدول زمني تسلسلي", icon: Clock, category: "advanced" },
  { type: "chart", label: "Chart", labelAr: "رسم بياني", description: "Data visualization", descriptionAr: "تصور البيانات", icon: BarChart3, category: "advanced" },

  // Database
  { type: "database", label: "Database", labelAr: "قاعدة بيانات", description: "Structured data collection", descriptionAr: "مجموعة بيانات منظمة", icon: Database, category: "database" },

  // AI
  { type: "ai_block", label: "AI Block", labelAr: ":block ذكاء اصطناعي", description: "Generate content with AI", descriptionAr: "إنشاء محتوى بالذكاء الصطناعي", icon: Sparkles, category: "ai" },

  // ERP
  { type: "erp_widget", label: "ERP Widget", labelAr: "أداة ERP", description: "Embed live ERP data", descriptionAr: "تضمين بيانات ERP مباشرة", icon: Zap, category: "erp" },
];

const CATEGORIES = [
  { id: "basic", label: "Basic Blocks", labelAr: "كتل أساسية", icon: Type },
  { id: "list", label: "Lists", labelAr: "قوائم", icon: List },
  { id: "media", label: "Media", labelAr: "وسائط", icon: Image },
  { id: "advanced", label: "Advanced", labelAr: "متقدم", icon: LayoutGrid },
  { id: "database", label: "Database", labelAr: "قاعدة بيانات", icon: Database },
  { id: "ai", label: "AI", labelAr: "ذكاء اصطناعي", icon: Sparkles },
  { id: "erp", label: "ERP", labelAr: "ERP", icon: Zap },
];

let blockIdCounter = 200;
const genBlockId = () => `blk_${++blockIdCounter}`;

// ═══════════════════════════════════════════════════════════
// SLASH COMMAND MENU — Notion-style
// ═══════════════════════════════════════════════════════════

function SlashCommandMenu({
  visible, onClose, onSelect, isRtl, position,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: BlockType) => void;
  isRtl: boolean;
  position: { top: number; left: number };
}) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [filter, setFilter] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible) {
      setFilter("");
      setSelectedIndex(0);
      setActiveCategory(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [visible]);

  const filtered = useMemo(() => {
    let items = BLOCK_TYPES;
    if (activeCategory) {
      items = items.filter(b => b.category === activeCategory);
    }
    if (filter) {
      const q = filter.toLowerCase();
      items = items.filter(b =>
        b.label.toLowerCase().includes(q) ||
        b.labelAr.includes(filter) ||
        b.description.toLowerCase().includes(q) ||
        b.descriptionAr.includes(filter)
      );
    }
    return items;
  }, [filter, activeCategory]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        onSelect(filtered[selectedIndex].type);
        onClose();
      }
    } else if (e.key === "Escape") {
      onClose();
    } else if (e.key === "Backspace" && filter === "") {
      onClose();
    }
  }, [filtered, selectedIndex, onSelect, onClose, filter]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.children[selectedIndex] as HTMLElement;
      if (selected) {
        selected.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  // Group by category for display
  const groupedItems = useMemo(() => {
    if (filter) return [{ category: null, items: filtered }];
    const groups: { category: string | null; items: BlockTypeDef[] }[] = [];
    const seen = new Set<string>();
    for (const item of filtered) {
      if (!seen.has(item.category)) {
        seen.add(item.category);
        groups.push({ category: item.category, items: filtered.filter(b => b.category === item.category) });
      }
    }
    return groups;
  }, [filtered, filter]);

  let flatIndex = 0;

  // Guard placed after all hooks so hook order stays stable (avoids React #310).
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="absolute z-[100] w-[340px] bg-background border border-border/60 rounded-2xl shadow-2xl overflow-hidden"
      style={{ top: position.top, [isRtl ? "right" : "left"]: position.left }}
      onKeyDown={handleKeyDown}
    >
      {/* Search */}
      <div className="p-3 border-b border-border/30">
        <div className="relative">
          <Search size={14} className="absolute top-1/2 -translate-y-1/2 left-3 text-muted-foreground/50" />
          <input
            ref={inputRef}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={ar ? "ابحث عن блок..." : "Search blocks..."}
            className="w-full pl-9 pr-3 py-2.5 text-[13px] bg-muted/40 rounded-xl border-0 outline-none placeholder:text-muted-foreground/50 font-medium"
          />
        </div>
      </div>

      {/* Category Tabs */}
      {!filter && (
        <div className="flex items-center gap-1 px-3 py-2 border-b border-border/20 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all ${
              !activeCategory ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            {ar ? "الكل" : "All"}
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                activeCategory === cat.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <cat.icon size={10} />
              {ar ? cat.labelAr : cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      <div ref={listRef} className="max-h-[320px] overflow-y-auto py-1.5">
        {filtered.length === 0 && (
          <div className="px-4 py-6 text-center">
            <Search size={20} className="mx-auto text-muted-foreground/20 mb-2" />
            <p className="text-[12px] text-muted-foreground/60">{ar ? "لا توجد نتائج" : "No results found"}</p>
          </div>
        )}

        {groupedItems.map((group) => (
          <div key={group.category || "all"}>
            {group.category && !filter && (
              <div className="px-4 pt-2 pb-1">
                <span className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
                  {ar ? CATEGORIES.find(c => c.id === group.category)?.labelAr : CATEGORIES.find(c => c.id === group.category)?.label}
                </span>
              </div>
            )}
            {group.items.map((bt) => {
              const idx = flatIndex++;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={bt.type}
                  onClick={() => { onSelect(bt.type); onClose(); }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    isSelected ? "bg-accent/60" : "hover:bg-accent/30"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground"
                  }`}>
                    <bt.icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground">
                      {ar ? bt.labelAr : bt.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 truncate">
                      {ar ? bt.descriptionAr : bt.description}
                    </p>
                  </div>
                  {bt.shortcut && (
                    <span className="text-[9px] font-mono text-muted-foreground/40 bg-muted/50 px-1.5 py-0.5 rounded shrink-0">
                      {bt.shortcut}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border/20 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[9px] text-muted-foreground/40">
          <span className="px-1.5 py-0.5 rounded bg-muted/50 font-mono">↑↓</span>
          <span>{ar ? "تنقل" : "Navigate"}</span>
          <span className="px-1.5 py-0.5 rounded bg-muted/50 font-mono">↵</span>
          <span>{ar ? "اختيار" : "Select"}</span>
          <span className="px-1.5 py-0.5 rounded bg-muted/50 font-mono">esc</span>
          <span>{ar ? "إغلاق" : "Close"}</span>
        </div>
        <span className="text-[9px] text-muted-foreground/30">{filtered.length} {ar ? "خيار" : "options"}</span>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// BLOCK ACTIONS
// ═══════════════════════════════════════════════════════════

function BlockActions({
  block, onDuplicate, onDelete, onConvert, isRtl,
}: {
  block: StudioBlock;
  onDuplicate: () => void;
  onDelete: () => void;
  onConvert: (type: BlockType) => void;
  isRtl: boolean;
}) {
  const [showConvert, setShowConvert] = useState(false);
  const { lang } = useLanguage();
  const ar = lang === "ar";

  return (
    <div
      className="absolute top-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
      style={{ [isRtl ? "right" : "left"]: "-56px" }}
    >
      <button className="p-1.5 rounded-lg hover:bg-muted/80 text-muted-foreground/50 cursor-grab active:cursor-grabbing transition-colors">
        <GripVertical size={14} />
      </button>
      <div className="relative">
        <button
          onClick={() => setShowConvert(!showConvert)}
          className="p-1.5 rounded-lg hover:bg-muted/80 text-muted-foreground/50 transition-colors"
          title={ar ? "تحويل" : "Convert"}
        >
          <ArrowRightLeft size={13} />
        </button>
        <AnimatePresence>
          {showConvert && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              className="absolute top-full mt-1 w-52 bg-background border border-border/60 rounded-xl shadow-xl p-1.5 z-50"
              style={{ [isRtl ? "right" : "left"]: 0 }}
            >
              <p className="px-2 py-1 text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-wider">{ar ? "تحويل إلى" : "Convert to"}</p>
              {BLOCK_TYPES.filter((bt) => bt.type !== block.type).slice(0, 10).map((bt) => (
                <button
                  key={bt.type}
                  onClick={() => { onConvert(bt.type); setShowConvert(false); }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[12px] rounded-lg hover:bg-accent/60 transition-colors"
                >
                  <bt.icon size={13} className="text-muted-foreground" />
                  {ar ? bt.labelAr : bt.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <button
        onClick={onDuplicate}
        className="p-1.5 rounded-lg hover:bg-muted/80 text-muted-foreground/50 transition-colors"
        title={ar ? "تكرار" : "Duplicate"}
      >
        <Copy size={13} />
      </button>
      <button
        onClick={onDelete}
        className="p-1.5 rounded-lg hover:bg-rose-50 text-muted-foreground/50 hover:text-rose-500 transition-colors"
        title={ar ? "حذف" : "Delete"}
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// BLOCK RENDERER
// ═══════════════════════════════════════════════════════════

function BlockRenderer({
  block, onUpdate, onToggleCheck,
}: {
  block: StudioBlock;
  onUpdate: (content: string) => void;
  onToggleCheck: () => void;
}) {
  const { lang } = useLanguage();
  const isRtl = lang === "ar";
  const text = lang === "ar" ? block.content_ar : block.content;

  const [toggleOpen, setToggleOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [text]);

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  switch (block.type) {
    case "h1":
      return (
        <textarea ref={textareaRef} value={text} onChange={(e) => { onUpdate(e.target.value); autoResize(e.target); }}
          className="w-full text-[28px] font-bold tracking-tight bg-transparent border-0 outline-none resize-none leading-tight placeholder:text-muted-foreground/30"
          style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.03em" }} rows={1}
          placeholder={isRtl ? "عنوان رئيسي" : "Heading 1"} />
      );
    case "h2":
      return (
        <textarea ref={textareaRef} value={text} onChange={(e) => { onUpdate(e.target.value); autoResize(e.target); }}
          className="w-full text-[22px] font-semibold tracking-tight bg-transparent border-0 outline-none resize-none leading-tight placeholder:text-muted-foreground/30"
          style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.02em" }} rows={1}
          placeholder={isRtl ? "عنوان فرعي" : "Heading 2"} />
      );
    case "h3":
      return (
        <textarea ref={textareaRef} value={text} onChange={(e) => { onUpdate(e.target.value); autoResize(e.target); }}
          className="w-full text-[17px] font-semibold bg-transparent border-0 outline-none resize-none leading-snug placeholder:text-muted-foreground/30"
          rows={1} placeholder={isRtl ? "عنوان فرعي" : "Heading 3"} />
      );
    case "bullet_list":
      return (
        <div className="flex items-start gap-2.5">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-foreground/40 shrink-0" />
          <textarea ref={textareaRef} value={text} onChange={(e) => { onUpdate(e.target.value); autoResize(e.target); }}
            className="flex-1 text-[14px] bg-transparent border-0 outline-none resize-none leading-relaxed placeholder:text-muted-foreground/30"
            rows={1} placeholder={isRtl ? "عنصر قائمة" : "List item"} />
        </div>
      );
    case "numbered_list": {
      const num = block.metadata?.number ?? block.order + 1;
      return (
        <div className="flex items-start gap-2">
          <span className="mt-0.5 text-[14px] font-medium text-muted-foreground/60 w-5 text-right shrink-0">{num}.</span>
          <textarea ref={textareaRef} value={text} onChange={(e) => { onUpdate(e.target.value); autoResize(e.target); }}
            className="flex-1 text-[14px] bg-transparent border-0 outline-none resize-none leading-relaxed placeholder:text-muted-foreground/30"
            rows={1} placeholder={isRtl ? "عنصر قائمة" : "List item"} />
        </div>
      );
    }
    case "checklist":
      return (
        <div className="flex items-start gap-2.5">
          <button onClick={onToggleCheck}
            className={`mt-0.5 w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
              block.metadata?.checked
                ? "bg-primary border-primary text-primary-foreground scale-110"
                : "border-muted-foreground/30 hover:border-primary/50"
            }`}>
            {block.metadata?.checked && <Check size={11} strokeWidth={3} />}
          </button>
          <textarea ref={textareaRef} value={text} onChange={(e) => { onUpdate(e.target.value); autoResize(e.target); }}
            className={`flex-1 text-[14px] bg-transparent border-0 outline-none resize-none leading-relaxed placeholder:text-muted-foreground/30 transition-all ${
              block.metadata?.checked ? "line-through text-muted-foreground" : ""
            }`} rows={1} placeholder={isRtl ? "عنصر قائمة تحقق" : "To-do"} />
        </div>
      );
    case "divider":
      return <div className="w-full h-px bg-border/50 my-3" />;
    case "quote":
      return (
        <div className="border-l-[3px] border-primary/40 pl-4 py-1">
          <textarea ref={textareaRef} value={text} onChange={(e) => { onUpdate(e.target.value); autoResize(e.target); }}
            className="w-full text-[14px] italic text-muted-foreground/80 bg-transparent border-0 outline-none resize-none leading-relaxed placeholder:text-muted-foreground/30"
            rows={1} placeholder={isRtl ? "اكتب اقتباس..." : "Type a quote..."} />
        </div>
      );
    case "callout": {
      const icon = block.metadata?.icon || "💡";
      const colorMap: Record<string, string> = {
        primary: "bg-primary/5 border-primary/20",
        amber: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40",
        red: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/40",
        green: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40",
        blue: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/40",
      };
      const colorClass = colorMap[block.metadata?.color || "primary"] || colorMap.primary;
      return (
        <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${colorClass}`}>
          <span className="text-[18px] mt-0.5 shrink-0 cursor-pointer">{icon}</span>
          <textarea ref={textareaRef} value={text} onChange={(e) => { onUpdate(e.target.value); autoResize(e.target); }}
            className="flex-1 text-[13.5px] bg-transparent border-0 outline-none resize-none leading-relaxed placeholder:text-muted-foreground/40"
            rows={1} placeholder={isRtl ? "نص التنبيه..." : "Callout text..."} />
        </div>
      );
    }
    case "code":
      return (
        <div className="bg-zinc-900 dark:bg-zinc-950 rounded-xl p-4 border border-zinc-800/50">
          <textarea ref={textareaRef} value={text} onChange={(e) => { onUpdate(e.target.value); autoResize(e.target); }}
            className="w-full text-[13px] font-mono text-zinc-200 bg-transparent border-0 outline-none resize-none leading-relaxed placeholder:text-zinc-600"
            rows={3} spellCheck={false} placeholder={isRtl ? "أدخل الكود..." : "Enter code..."} />
        </div>
      );
    case "toggle":
      return (
        <div>
          <button onClick={() => setToggleOpen(!toggleOpen)} className="flex items-center gap-1.5 text-[14px] font-medium hover:text-primary transition-colors">
            <motion.span animate={{ rotate: toggleOpen ? 90 : 0 }} transition={{ duration: 0.15 }}>
              <ChevronRight size={15} />
            </motion.span>
            {text || (isRtl ? "عنوان القائمة المطوية..." : "Toggle heading...")}
          </button>
          <AnimatePresence>
            {toggleOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }} className="overflow-hidden ml-6 mt-1">
                <textarea value={block.metadata?.content || ""} onChange={(e) => { onUpdate(text); block.metadata = { ...block.metadata, content: e.target.value }; }}
                  className="w-full text-[13.5px] text-muted-foreground bg-transparent border-0 outline-none resize-none leading-relaxed placeholder:text-muted-foreground/40"
                  rows={2} placeholder={isRtl ? "محتوى مطوي..." : "Collapsed content..."} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    case "image":
      return (
        <div className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer">
          <Image size={24} className="mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-[12px] text-muted-foreground/60">{isRtl ? "اسحب صورة هنا أو انقر للرفع" : "Drag image here or click to upload"}</p>
          <p className="text-[10px] text-muted-foreground/40 mt-1">PNG, JPG, GIF, SVG, WebP</p>
        </div>
      );
    case "video":
      return (
        <div className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer">
          <Video size={24} className="mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-[12px] text-muted-foreground/60">{isRtl ? "أدرج رابط فيديو" : "Embed a video URL"}</p>
          <p className="text-[10px] text-muted-foreground/40 mt-1">YouTube, Vimeo, MP4</p>
        </div>
      );
    case "file":
      return (
        <div className="border-2 border-dashed border-border/50 rounded-xl p-6 text-center hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer">
          <Paperclip size={20} className="mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-[12px] text-muted-foreground/60">{isRtl ? "اسحب ملف هنا أو انقر للرفع" : "Drag file here or click to upload"}</p>
          <p className="text-[10px] text-muted-foreground/40 mt-1">PDF, DOC, XLS, ZIP, etc.</p>
        </div>
      );
    case "embed":
      return (
        <div className="border-2 border-dashed border-border/50 rounded-xl p-6 text-center hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer">
          <Link2 size={20} className="mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-[12px] text-muted-foreground/60">{isRtl ? "أدرج رابط للمحتوى" : "Paste a link to embed content"}</p>
          <p className="text-[10px] text-muted-foreground/40 mt-1">Figma, Google Maps, Twitter, etc.</p>
        </div>
      );
    case "table":
      return (
        <div className="border border-border/40 rounded-xl overflow-hidden">
          <div className="grid grid-cols-3 divide-x divide-border/30">
            {[0, 1, 2].map(col => (
              <div key={col} className="divide-y divide-border/30">
                {[0, 1, 2].map(row => (
                  <div key={row} className="px-3 py-2 min-h-[36px]">
                    {row === 0 && col === 0 && <span className="text-[11px] text-muted-foreground/40">{isRtl ? "العمود ١" : "Column 1"}</span>}
                    {row === 0 && col === 1 && <span className="text-[11px] text-muted-foreground/40">{isRtl ? "العمود ٢" : "Column 2"}</span>}
                    {row === 0 && col === 2 && <span className="text-[11px] text-muted-foreground/40">{isRtl ? "العمود ٣" : "Column 3"}</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      );
    case "database":
      return (
        <div className="border border-border/40 rounded-xl p-5 text-center bg-muted/20">
          <Database size={20} className="mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-[12px] text-muted-foreground/60">{isRtl ? "قاعدة بيانات جديدة" : "New Database"}</p>
          <p className="text-[10px] text-muted-foreground/40 mt-1">{isRtl ? "انقر لإنشاء قاعدة بيانات" : "Click to create a database"}</p>
        </div>
      );
    case "ai_block":
      return (
        <div className="border border-primary/20 rounded-xl p-5 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-primary" />
            <span className="text-[12px] font-medium text-primary">{isRtl ? "مولد الذكاء الاصطناعي" : "AI Generator"}</span>
          </div>
          <textarea ref={textareaRef} value={text} onChange={(e) => { onUpdate(e.target.value); autoResize(e.target); }}
            className="w-full text-[13px] bg-transparent border-0 outline-none resize-none leading-relaxed placeholder:text-primary/40"
            rows={2} placeholder={isRtl ? "اكتب ما تريد إنشاءه..." : "What do you want to generate..."} />
        </div>
      );
    case "erp_widget": {
      const widgetType = block.metadata?.widget_type || "kpi";
      const widgetLabel = block.metadata?.widget_label || (isRtl ? "(widget ERP)" : "(ERP Widget)");
      const widgetConfigs: Record<string, { icon: React.ElementType; label: string; labelAr: string; color: string; data: string }> = {
        kpi: { icon: BarChart3, label: "KPI Widget", labelAr: "مؤشر أداء", color: "primary", data: "Revenue: 2.9M EGP | Customers: 25 | Orders: 142" },
        customer: { icon: Users, label: "Customer Card", labelAr: "بطاقة عميل", color: "emerald", data: "Nora Al-Farsi · Platinum VIP · 185K EGP lifetime" },
        invoice: { icon: CreditCard, label: "Invoice Summary", labelAr: "ملخص فاتورة", color: "blue", data: "INV-2026-001 · 13,680 EGP · Paid" },
        inventory: { icon: Package, label: "Inventory Widget", labelAr: "أداة المخزون", color: "amber", data: "12 items low stock · 3 items out of stock" },
        sales_chart: { icon: TrendingUp, label: "Sales Chart", labelAr: "رسم بياني للمبيعات", color: "violet", data: "Monthly: 420K → 610K (+45%)" },
        task_list: { icon: CheckSquare, label: "Task List", labelAr: "قائمة مهام", color: "cyan", data: "8 pending · 3 overdue · 12 completed" },
        employee: { icon: Briefcase, label: "Employee Card", labelAr: "بطاقة موظف", color: "pink", data: "Ahmed Ali · GM · Active since 2020" },
        product: { icon: Smartphone, label: "Product Card", labelAr: "بطاقة منتج", color: "orange", data: "Summer Collection · 7 designs · 280K EGP" },
      };
      const cfg = widgetConfigs[widgetType] || widgetConfigs.kpi;
      const WidgetIcon = cfg.icon;
      const colorMap: Record<string, string> = {
        primary: "border-primary/20 bg-primary/5", emerald: "border-emerald-200 bg-emerald-50",
        blue: "border-blue-200 bg-blue-50", amber: "border-amber-200 bg-amber-50",
        violet: "border-violet-200 bg-violet-50", cyan: "border-cyan-200 bg-cyan-50",
        pink: "border-pink-200 bg-pink-50", orange: "border-orange-200 bg-orange-50",
      };
      return (
        <div className={`rounded-xl border p-4 ${colorMap[cfg.color] || colorMap.primary}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <WidgetIcon size={14} className={`text-${cfg.color}-600`} />
              <span className="text-[12px] font-semibold text-foreground">{widgetLabel}</span>
            </div>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/60 text-muted-foreground font-medium">LIVE</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{cfg.data}</p>
          <div className="flex items-center gap-1.5 mt-2">
            {Object.entries(widgetConfigs).slice(0, 4).map(([key, w]) => (
              <button key={key} onClick={() => { block.metadata = { ...block.metadata, widget_type: key }; }}
                className={`text-[8px] px-2 py-0.5 rounded-full transition-all ${widgetType === key ? "bg-white/80 text-foreground font-medium" : "bg-white/40 text-muted-foreground hover:bg-white/60"}`}>
                {isRtl ? w.labelAr : w.label}
              </button>
            ))}
          </div>
        </div>
      );
    }
    default:
      return (
        <textarea ref={textareaRef} value={text} onChange={(e) => { onUpdate(e.target.value); autoResize(e.target); }}
          className="w-full text-[14px] bg-transparent border-0 outline-none resize-none leading-relaxed placeholder:text-muted-foreground/30"
          rows={1} placeholder={isRtl ? "اكتب '/' للأوامر..." : "Type '/' for commands..."} />
      );
  }
}

// ═══════════════════════════════════════════════════════════
// MAIN EDITOR
// ═══════════════════════════════════════════════════════════

export default function StudioEditor({ blocks: initialBlocks, onBlocksChange }: Props) {
  const { lang } = useLanguage();
  const isRtl = lang === "ar";
  const ar = lang === "ar";
  const [blocks, setBlocks] = useState<StudioBlock[]>(initialBlocks);
  const [slashMenu, setSlashMenu] = useState<{ visible: boolean; blockId: string; position: { top: number; left: number } }>({
    visible: false, blockId: "", position: { top: 0, left: 0 },
  });
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onBlocksChange(blocks);
  }, [blocks]);

  const triggerSave = useCallback(() => {
    setSaveStatus("unsaved");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      setSaveStatus("saving");
      setTimeout(() => setSaveStatus("saved"), 600);
    }, 800);
  }, []);

  const updateBlock = useCallback((id: string, content: string) => {
    setBlocks((prev) => prev.map((b) => b.id === id ? { ...b, content, content_ar: content, updated_at: new Date().toISOString() } : b));
    triggerSave();
  }, [triggerSave]);

  const toggleCheck = useCallback((id: string) => {
    setBlocks((prev) => prev.map((b) => b.id === id ? { ...b, metadata: { ...b.metadata, checked: !b.metadata?.checked } } : b));
    triggerSave();
  }, [triggerSave]);

  const addBlock = useCallback((type: BlockType, afterId?: string) => {
    const newBlock: StudioBlock = {
      id: genBlockId(), workspace_id: "demo", page_id: "", type,
      content: "", content_ar: "", order: 0, parent_block_id: null, children: [],
      metadata: type === "checklist" ? { checked: false } : type === "callout" ? { icon: "💡", color: "primary" } : {},
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    setBlocks((prev) => {
      const idx = afterId ? prev.findIndex((b) => b.id === afterId) : prev.length - 1;
      const next = [...prev];
      next.splice(idx + 1, 0, newBlock);
      return next.map((b, i) => ({ ...b, order: i }));
    });
    triggerSave();
  }, [triggerSave]);

  const deleteBlock = useCallback((id: string) => {
    setBlocks((prev) => { const next = prev.filter((b) => b.id !== id); return next.map((b, i) => ({ ...b, order: i })); });
    triggerSave();
  }, [triggerSave]);

  const duplicateBlock = useCallback((id: string) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx === -1) return prev;
      const copy = { ...prev[idx], id: genBlockId(), order: idx + 1 };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next.map((b, i) => ({ ...b, order: i }));
    });
    triggerSave();
  }, [triggerSave]);

  const convertBlock = useCallback((id: string, newType: BlockType) => {
    setBlocks((prev) => prev.map((b) => b.id === id ? { ...b, type: newType, updated_at: new Date().toISOString() } : b));
    triggerSave();
  }, [triggerSave]);

  // Handle '/' key to open slash menu
  const handleKeyDown = useCallback((e: React.KeyboardEvent, blockId: string) => {
    if (e.key === "/" && !e.shiftKey) {
      e.preventDefault();
      const blockEl = (e.target as HTMLElement).closest("[data-block-id]");
      if (blockEl) {
        const rect = blockEl.getBoundingClientRect();
        const parentRect = blockEl.parentElement?.getBoundingClientRect();
        const pTop = parentRect?.top ?? 0;
        const pLeft = parentRect?.left ?? 0;
        const pRight = parentRect?.right ?? 0;
        setSlashMenu({
          visible: true, blockId,
          position: {
            top: rect.bottom - pTop + 4,
            left: isRtl ? pRight - rect.right : rect.left - pLeft,
          },
        });
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      const block = blocks.find((b) => b.id === blockId);
      if (block && ["text", "bullet_list", "numbered_list", "checklist"].includes(block.type)) {
        e.preventDefault();
        addBlock(block.type, blockId);
      }
    }
  }, [blocks, addBlock, isRtl]);

  const handleDragOver = (index: number) => setDragOverIndex(index);
  const handleDragLeave = () => setDragOverIndex(null);

  const saveLabel = saveStatus === "saved" ? (ar ? "تم الحفظ" : "Saved") : saveStatus === "saving" ? (ar ? "جارٍ الحفظ..." : "Saving...") : (ar ? "غير محفوظ" : "Unsaved");

  return (
    <div className="relative">
      {/* Autosave indicator */}
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-4">
        {saveStatus === "saving" ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <div className={`w-1.5 h-1.5 rounded-full transition-colors ${saveStatus === "saved" ? "bg-emerald-500" : "bg-amber-500"}`} />
        )}
        <span>{saveLabel}</span>
      </div>

      {/* Blocks */}
      <div className="space-y-0.5">
        {blocks.map((block, index) => (
          <div
            key={block.id}
            data-block-id={block.id}
            className="group relative pl-14 py-1.5 rounded-lg hover:bg-muted/20 transition-colors"
            onDragOver={(e) => { e.preventDefault(); handleDragOver(index); }}
            onDragLeave={handleDragLeave}
          >
            <BlockActions
              block={block}
              onDuplicate={() => duplicateBlock(block.id)}
              onDelete={() => deleteBlock(block.id)}
              onConvert={(type) => convertBlock(block.id, type)}
              isRtl={isRtl}
            />
            <BlockRenderer
              block={block}
              onUpdate={(content) => updateBlock(block.id, content)}
              onToggleCheck={() => toggleCheck(block.id)}
            />
            {dragOverIndex === index && (
              <div className="absolute inset-x-0 -top-0.5 h-0.5 bg-primary rounded-full" />
            )}
          </div>
        ))}
      </div>

      {/* Slash command menu */}
      <AnimatePresence>
        <SlashCommandMenu
          visible={slashMenu.visible}
          isRtl={isRtl}
          position={slashMenu.position}
          onClose={() => setSlashMenu((s) => ({ ...s, visible: false }))}
          onSelect={(type) => addBlock(type, slashMenu.blockId)}
        />
      </AnimatePresence>

      {/* Add block button */}
      <div className="mt-4 pl-14">
        <button
          onClick={() => addBlock("text")}
          className="flex items-center gap-2 text-[13px] text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors group"
        >
          <div className="w-6 h-6 rounded-lg border border-dashed border-border/40 group-hover:border-border/60 flex items-center justify-center transition-colors">
            <Plus size={13} />
          </div>
          <span>{ar ? "إضافة блок" : "Add a block"}</span>
        </button>
      </div>
    </div>
  );
}
