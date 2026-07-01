import { useState, useMemo, useCallback, useRef } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useLocation, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ChevronRight, Clock, Tag, User, Building2,
  Flag, Calendar, Edit3, MoreHorizontal, Share2, Download,
  FolderInput, Trash2, Sparkles, FileText, CheckSquare,
  ListOrdered, MessageSquare, History, ChevronDown, ChevronUp,
  Image, Star, Eye, ExternalLink, Upload, X, FileIcon,
  Copy, ImagePlus, RefreshCw, LayoutTemplate,
} from "lucide-react";
import StudioEditor from "../components/StudioEditor";
import { useToast } from "../hooks/use-toast";
import {
  STUDIO_PAGES, STUDIO_BLOCKS, STUDIO_COMMENTS, STUDIO_VERSIONS, STUDIO_MEDIA,
  type StudioPage as StudioPageType, type StudioBlock, type StudioComment,
} from "../lib/studio-data";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  review: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  published: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  archived: "bg-muted text-muted-foreground",
};

const STATUS_LABELS: Record<string, { en: string; ar: string }> = {
  draft: { en: "Draft", ar: "مسودة" },
  in_progress: { en: "In Progress", ar: "قيد التنفيذ" },
  review: { en: "Review", ar: "مراجعة" },
  published: { en: "Published", ar: "منشور" },
  archived: { en: "Archived", ar: "مؤرشف" },
};

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  medium: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  low: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
};

const EMOJI_OPTIONS = ["📚", "📋", "📊", "💰", "🏭", "🗺️", "📅", "🎨", "🤝", "✅", "☀️", "🎓", "✨", "🎁", "📸", "📝", "💡", "🚀", "🎯", "🔥", "💎", "👑", "🌟", "🏆"];

function Breadcrumbs({ page, isRtl }: { page: StudioPageType; isRtl: boolean }) {
  const pages = [page];
  let current = page;
  while (current.parent_id) {
    const parent = STUDIO_PAGES.find((p) => p.id === current.parent_id);
    if (parent) {
      pages.unshift(parent);
      current = parent;
    } else break;
  }

  return (
    <nav className="flex items-center gap-1 text-[12px] text-muted-foreground mb-4 flex-wrap">
      <span className="hover:text-foreground cursor-pointer transition-colors">
        {isRtl ? "الاستوديو" : "Studio"}
      </span>
      {pages.map((p) => (
        <span key={p.id} className="flex items-center gap-1">
          <ChevronRight size={12} className={isRtl ? "rotate-180" : ""} />
          <span className="hover:text-foreground cursor-pointer transition-colors">
            {p.icon} {isRtl ? p.title_ar : p.title}
          </span>
        </span>
      ))}
    </nav>
  );
}

function PropertiesPanel({
  page, isRtl, isOpen, onToggle, onPropertyChange,
}: {
  page: StudioPageType; isRtl: boolean; isOpen: boolean; onToggle: () => void;
  onPropertyChange: (key: string, value: any) => void;
}) {
  const t = (en: string, ar: string) => (isRtl ? ar : en);

  const properties = [
    { icon: FileText, label: t("Status", "الحالة"), value: page.status, style: STATUS_STYLES[page.status] || "", key: "status", editable: true },
    { icon: User, label: t("Owner", "المالك"), value: isRtl ? page.owner_name_ar : page.owner_name, key: "owner" },
    { icon: Building2, label: t("Department", "القسم"), value: page.properties?.department || "—", key: "department", editable: true },
    { icon: Flag, label: t("Priority", "الأولوية"), value: page.properties?.priority || "medium", style: PRIORITY_STYLES[page.properties?.priority || "medium"] || "", key: "priority", editable: true },
    { icon: Tag, label: t("Tags", "الوسوم"), value: page.tags.join(", ") || "—", key: "tags" },
    { icon: Calendar, label: t("Created", "أنشئ"), value: new Date(page.created_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US"), key: "created_at" },
    { icon: Clock, label: t("Updated", "حدّث"), value: new Date(page.updated_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US"), key: "updated_at" },
    { icon: Eye, label: t("Views", "المشاهدات"), value: page.view_count.toLocaleString(), key: "view_count" },
    { icon: FileText, label: t("Words", "الكلمات"), value: page.word_count.toLocaleString(), key: "word_count" },
  ];

  return (
    <div className="border border-border/30 rounded-xl overflow-hidden mb-8">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 text-[13px] font-medium text-muted-foreground hover:bg-muted/30 transition-colors"
      >
        <span>{t("Page Properties", "خصائص الصفحة")}</span>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 grid grid-cols-2 gap-x-6 gap-y-2.5">
              {properties.map((prop) => (
                <div key={prop.label} className="flex items-center gap-2 text-[12px]">
                  <prop.icon size={13} className="text-muted-foreground/60 shrink-0" />
                  <span className="text-muted-foreground">{prop.label}:</span>
                  {prop.editable ? (
                    <select
                      value={String(prop.value)}
                      onChange={(e) => onPropertyChange(prop.key, e.target.value)}
                      className="font-medium truncate px-1.5 py-0.5 rounded-full text-[11px] bg-transparent border border-border/40 outline-none cursor-pointer hover:bg-muted/30 transition-colors"
                    >
                      {prop.key === "status" && Object.entries(STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{isRtl ? v.ar : v.en}</option>
                      ))}
                      {prop.key === "priority" && ["high", "medium", "low"].map((p) => (
                        <option key={p} value={p}>{t(p.charAt(0).toUpperCase() + p.slice(1), p === "high" ? "عالية" : p === "medium" ? "متوسطة" : "منخفضة")}</option>
                      ))}
                      {prop.key === "department" && ["All", "HR", "Sales", "Operations", "Design", "Production", "Marketing"].map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`font-medium truncate ${prop.style ? `px-1.5 py-0.5 rounded-full text-[11px] ${prop.style}` : ""}`}>
                      {prop.value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CommentsSection({ pageId, isRtl, comments }: { pageId: string; isRtl: boolean; comments: StudioComment[] }) {
  const t = (en: string, ar: string) => (isRtl ? ar : en);
  const [newComment, setNewComment] = useState("");

  const rootComments = comments.filter((c) => !c.parent_comment_id);

  if (rootComments.length === 0 && !newComment) return null;

  return (
    <div className="mt-10 pt-8 border-t border-border/30">
      <h3 className="text-[15px] font-semibold mb-4 flex items-center gap-2">
        <MessageSquare size={16} className="text-muted-foreground" />
        {t("Comments", "التعليقات")}
        <span className="text-[12px] font-normal text-muted-foreground">({rootComments.length})</span>
      </h3>
      <div className="space-y-4">
        {rootComments.map((comment) => {
          const replies = comments.filter((c) => c.parent_comment_id === comment.id);
          return (
            <div key={comment.id}>
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-medium text-primary shrink-0">
                  {(isRtl ? comment.author_ar : comment.author).charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[12.5px] font-medium">{isRtl ? comment.author_ar : comment.author}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {timeAgo(comment.created_at, isRtl)}
                    </span>
                  </div>
                  <p className="text-[13px] leading-relaxed text-foreground/80">
                    {isRtl ? comment.content_ar : comment.content}
                  </p>
                  {comment.reactions.length > 0 && (
                    <div className="flex gap-1 mt-1.5">
                      {comment.reactions.map((r, i) => (
                        <button key={i} className="text-[12px] px-1.5 py-0.5 bg-muted/50 rounded-full hover:bg-muted/80 transition-colors">
                          {r.emoji} <span className="text-[10px] text-muted-foreground">{r.users.length}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {replies.length > 0 && (
                    <div className="mt-3 ml-4 space-y-3">
                      {replies.map((reply) => (
                        <div key={reply.id} className="flex gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium shrink-0">
                            {(isRtl ? reply.author_ar : reply.author).charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[12px] font-medium">{isRtl ? reply.author_ar : reply.author}</span>
                              <span className="text-[10.5px] text-muted-foreground">
                                {timeAgo(reply.created_at, isRtl)}
                              </span>
                            </div>
                            <p className="text-[12.5px] leading-relaxed text-foreground/75">
                              {isRtl ? reply.content_ar : reply.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex gap-3">
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-medium text-primary shrink-0">
          A
        </div>
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={t("Add a comment...", "أضف تعليقاً...")}
          className="flex-1 text-[13px] bg-muted/40 border border-border/30 rounded-xl px-3.5 py-2 outline-none focus:ring-1 focus:ring-primary/30 transition-shadow placeholder:text-muted-foreground/50"
        />
      </div>
    </div>
  );
}

function VersionHistorySidebar({ isRtl, isOpen, onClose, pageId }: { isRtl: boolean; isOpen: boolean; onClose: () => void; pageId: string }) {
  const t = (en: string, ar: string) => (isRtl ? ar : en);
  const versions = useMemo(() => STUDIO_VERSIONS.filter((v) => v.page_id === pageId), [pageId]);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: isRtl ? -320 : 320 }}
            animate={{ x: 0 }}
            exit={{ x: isRtl ? -320 : 320 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 bottom-0 w-80 bg-background border-l border-border/30 shadow-2xl z-50 flex flex-col"
            style={{ [isRtl ? "right" : "left"]: 0 }}
          >
            <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between shrink-0">
              <h3 className="text-[14px] font-semibold flex items-center gap-2">
                <History size={15} />
                {t("Version History", "سجل التغييرات")}
              </h3>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-[18px] leading-none">
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {versions.length === 0 && (
                <div className="text-center py-8 text-[13px] text-muted-foreground">
                  {t("No versions saved yet", "لا توجد إصدارات محفوظة بعد")}
                </div>
              )}
              {versions.map((v, i) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVersion(v.id === selectedVersion ? null : v.id)}
                  className={`w-full text-left px-3.5 py-3 rounded-xl transition-colors ${
                    i === 0 ? "bg-primary/5 border border-primary/10" : selectedVersion === v.id ? "bg-muted/60" : "hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12.5px] font-medium">{isRtl ? v.title_ar : v.title}</span>
                    <span className="text-[11px] text-muted-foreground">{timeAgo(v.created_at, isRtl)}</span>
                  </div>
                  <div className="text-[11.5px] text-muted-foreground mb-1">
                    {isRtl ? v.author_ar : v.author} · {v.block_count} {t("blocks", "كتلة")}
                  </div>
                  <div className="text-[11px] text-muted-foreground/70 leading-relaxed">
                    {isRtl ? v.summary_ar : v.summary}
                  </div>
                  {selectedVersion === v.id && i !== 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-2 pt-2 border-t border-border/30"
                    >
                      <button className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11.5px] font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/15 transition-colors">
                        <RefreshCw size={12} />
                        {t("Restore this version", "استعادة هذا الإصدار")}
                      </button>
                    </motion.div>
                  )}
                </button>
              ))}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function FileUploadArea({ isRtl, media }: { isRtl: boolean; media: typeof STUDIO_MEDIA }) {
  const t = (en: string, ar: string) => (isRtl ? ar : en);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const fileTypeIcons: Record<string, string> = {
    image: "🖼️",
    pdf: "📄",
    video: "🎬",
    audio: "🎵",
    document: "📝",
    other: "📎",
  };

  return (
    <div className="mt-8 pt-6 border-t border-border/30">
      <h3 className="text-[15px] font-semibold mb-4 flex items-center gap-2">
        <FileIcon size={16} className="text-muted-foreground" />
        {t("Files", "الملفات")}
        {media.length > 0 && <span className="text-[12px] font-normal text-muted-foreground">({media.length})</span>}
      </h3>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border/40 hover:border-border/60 hover:bg-muted/20"
        }`}
      >
        <input ref={fileInputRef} type="file" multiple className="hidden" />
        <Upload size={24} className="mx-auto mb-2 text-muted-foreground/50" />
        <p className="text-[13px] text-muted-foreground">
          {t("Drop files here or click to upload", "اسحب الملفات هنا أو انقر للرفع")}
        </p>
        <p className="text-[11px] text-muted-foreground/60 mt-1">
          {t("Images, PDFs, documents", "صور، PDFs، مستندات")}
        </p>
      </div>

      {media.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
          {media.map((file) => (
            <div key={file.id} className="group relative border border-border/30 rounded-xl overflow-hidden hover:border-border/50 transition-colors">
              <div className="aspect-[4/3] bg-muted/30 flex items-center justify-center">
                {file.type === "image" ? (
                  <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <Image size={24} className="text-primary/30" />
                  </div>
                ) : (
                  <span className="text-3xl">{fileTypeIcons[file.type] || "📎"}</span>
                )}
              </div>
              <div className="p-2.5">
                <p className="text-[11.5px] font-medium truncate">{file.name}</p>
                <p className="text-[10.5px] text-muted-foreground mt-0.5">
                  {formatSize(file.size)} · {timeAgo(file.uploaded_at, isRtl)}
                </p>
              </div>
              <button className="absolute top-2 right-2 p-1 rounded-lg bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function timeAgo(dateStr: string, isRtl: boolean): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (isRtl) {
    if (mins < 60) return `منذ ${mins} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${days} يوم`;
  }
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function StudioPage() {
  const { lang } = useLanguage();
  const isRtl = lang === "ar";
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const pageId = params?.id || "p02";
  const { toast } = useToast();

  const page = useMemo(() => STUDIO_PAGES.find((p) => p.id === pageId) || STUDIO_PAGES[0], [pageId]);
  const pageBlocks = useMemo(() => STUDIO_BLOCKS.filter((b) => b.page_id === page.id).sort((a, b) => a.order - b.order), [page.id]);
  const pageComments = useMemo(() => STUDIO_COMMENTS.filter((c) => c.page_id === page.id), [page.id]);
  const pageMedia = useMemo(() => STUDIO_MEDIA.filter((m) => m.page_id === page.id), [page.id]);
  const pageVersions = useMemo(() => STUDIO_VERSIONS.filter((v) => v.page_id === page.id), [page.id]);

  const [title, setTitle] = useState(isRtl ? page.title_ar : page.title);
  const [blocks, setBlocks] = useState<StudioBlock[]>(pageBlocks);
  const [currentPage, setCurrentPage] = useState(page);
  const [propsOpen, setPropsOpen] = useState(false);
  const [versionOpen, setVersionOpen] = useState(false);
  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [coverExpanded, setCoverExpanded] = useState(false);

  const t = (en: string, ar: string) => (isRtl ? ar : en);

  const handlePropertyChange = useCallback((key: string, value: any) => {
    setCurrentPage((prev) => ({
      ...prev,
      [key === "status" ? "status" : "properties"]: key === "status" ? value : { ...prev.properties, [key]: value },
    }));
  }, []);

  const handleAiAction = useCallback((action: string) => {
    setAiMenuOpen(false);
    const labels: Record<string, { en: string; ar: string }> = {
      summarize: { en: "Page summarized by AI", ar: "تم تلخيص الصفحة بالذكاء الاصطناعي" },
      tasks: { en: "Tasks extracted from page", ar: "تم استخراج المهام من الصفحة" },
      checklist: { en: "Checklist generated from page", ar: "تم إنشاء قائمة التحقق من الصفحة" },
    };
    const label = labels[action] || { en: "Action completed", ar: "تمت العملية" };
    toast({
      title: "✨ " + t("AI Action", "إجراء AI"),
      description: t(label.en, label.ar),
    });
  }, [toast, t]);

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-[860px] mx-auto px-6 lg:px-10 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setLocation("/studio")}
            className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={15} className={isRtl ? "rotate-180" : ""} />
            {t("Back", "رجوع")}
          </button>
          <div className="flex items-center gap-2">
            {/* Comments count badge */}
            {pageComments.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/40 text-[11px] text-muted-foreground">
                <MessageSquare size={12} />
                {pageComments.length}
              </div>
            )}
            {/* Share button */}
            <button
              onClick={() => toast({ title: t("Share link copied", "تم نسخ رابط المشاركة"), description: t("Link copied to clipboard", "تم نسخ الرابط") })}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
            >
              <Share2 size={13} />
              {t("Share", "مشاركة")}
            </button>
            {/* AI actions */}
            <div className="relative">
              <button
                onClick={() => { setAiMenuOpen(!aiMenuOpen); setActionsMenuOpen(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
              >
                <Sparkles size={13} />
                {t("AI Actions", "إجراءات AI")}
                <ChevronDown size={12} />
              </button>
              <AnimatePresence>
                {aiMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full mt-1 w-52 bg-popover border border-popover-border rounded-xl shadow-xl p-1 z-50"
                    style={{ [isRtl ? "right" : "left"]: 0 }}
                  >
                    {[
                      { icon: FileText, label: t("Summarize", "تلخيص"), action: "summarize" },
                      { icon: CheckSquare, label: t("Extract Tasks", "استخراج المهام"), action: "tasks" },
                      { icon: ListOrdered, label: t("Generate Checklist", "إنشاء قائمة تحقق"), action: "checklist" },
                    ].map((item) => (
                      <button
                        key={item.action}
                        onClick={() => handleAiAction(item.action)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] rounded-lg hover:bg-accent/60 transition-colors"
                      >
                        <item.icon size={14} className="text-primary/70" />
                        {item.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* More menu */}
            <div className="relative">
              <button
                onClick={() => { setActionsMenuOpen(!actionsMenuOpen); setAiMenuOpen(false); }}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
              >
                <MoreHorizontal size={16} />
              </button>
              <AnimatePresence>
                {actionsMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full mt-1 w-48 bg-popover border border-popover-border rounded-xl shadow-xl p-1 z-50"
                    style={{ [isRtl ? "right" : "left"]: 0 }}
                  >
                    {[
                      { icon: Download, label: t("Export", "تصدير") },
                      { icon: FolderInput, label: t("Move to", "نقل إلى") },
                      { icon: Copy, label: t("Duplicate", "تكرار") },
                      { icon: History, label: t("Version History", "السجل"), action: () => { setVersionOpen(true); setActionsMenuOpen(false); } },
                      { icon: Trash2, label: t("Delete", "حذف"), destructive: true },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => { item.action?.(); setActionsMenuOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] rounded-lg hover:bg-accent/60 transition-colors ${
                          item.destructive ? "text-destructive hover:bg-destructive/5" : ""
                        }`}
                      >
                        <item.icon size={14} />
                        {item.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <Breadcrumbs page={currentPage} isRtl={isRtl} />

        {/* Cover image area */}
        <div
          className="w-full h-48 rounded-2xl bg-muted/20 border border-border/20 mb-6 overflow-hidden flex items-center justify-center relative group cursor-pointer"
          onClick={() => setCoverExpanded(!coverExpanded)}
        >
          {currentPage.cover_image ? (
            <img src={currentPage.cover_image} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground/40">
              <ImagePlus size={32} />
              <span className="text-[12px]">{t("Add cover image", "أضف صورة غلاف")}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </div>

        {/* Page icon + Title */}
        <div className="mb-2 relative">
          <div className="relative inline-block">
            <button
              onClick={() => setIconPickerOpen(!iconPickerOpen)}
              className="text-[36px] hover:bg-muted/40 rounded-xl px-2 py-1 transition-colors leading-none mb-1"
            >
              {currentPage.icon}
            </button>
            <AnimatePresence>
              {iconPickerOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute top-full left-0 mt-2 w-64 bg-popover border border-popover-border rounded-xl shadow-xl p-3 z-50"
                >
                  <p className="text-[11px] text-muted-foreground mb-2">{t("Choose icon", "اختر أيقونة")}</p>
                  <div className="grid grid-cols-8 gap-1">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          setCurrentPage((prev) => ({ ...prev, icon: emoji }));
                          setIconPickerOpen(false);
                        }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted/60 transition-colors text-[16px]"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-[32px] font-bold tracking-tight bg-transparent border-0 outline-none placeholder:text-muted-foreground/30"
            style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.03em" }}
            placeholder={isRtl ? "عنوان الصفحة..." : "Page title..."}
          />
          {/* Status badge */}
          <div className="mt-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-medium ${STATUS_STYLES[currentPage.status] || ""}`}>
              {STATUS_LABELS[currentPage.status]?.[isRtl ? "ar" : "en"] || currentPage.status}
            </span>
          </div>
        </div>

        {/* Properties panel */}
        <PropertiesPanel
          page={currentPage}
          isRtl={isRtl}
          isOpen={propsOpen}
          onToggle={() => setPropsOpen(!propsOpen)}
          onPropertyChange={handlePropertyChange}
        />

        {/* Editor */}
        <StudioEditor blocks={blocks} onBlocksChange={setBlocks} />

        {/* File upload area */}
        <FileUploadArea isRtl={isRtl} media={pageMedia} />

        {/* Comments */}
        <CommentsSection pageId={currentPage.id} isRtl={isRtl} comments={pageComments} />
      </div>

      {/* Version history sidebar */}
      <VersionHistorySidebar
        isRtl={isRtl}
        isOpen={versionOpen}
        onClose={() => setVersionOpen(false)}
        pageId={currentPage.id}
      />

      {/* Click outside to close menus */}
      {(aiMenuOpen || actionsMenuOpen || iconPickerOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setAiMenuOpen(false); setActionsMenuOpen(false); setIconPickerOpen(false); }}
        />
      )}
    </div>
  );
}
