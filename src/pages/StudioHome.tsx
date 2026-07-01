import { useMemo } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Plus, Database, Users, LayoutTemplate, ArrowRight, Clock,
  Star, FileText, Lightbulb, Sparkles, BookOpen, TrendingUp,
  Eye, HardDrive, UserPlus, ChevronRight, Zap, BarChart3,
  Crown, Activity, Globe,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import {
  STUDIO_PAGES, STUDIO_TEMPLATES, STUDIO_FOLDERS,
  STUDIO_MEMBERS, STUDIO_ANALYTICS,
} from "../lib/studio-data";

const EASE_OUT_QUINT = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT_QUINT } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: EASE_OUT_QUINT } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const staggerFast = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};

function getGreeting(lang: "en" | "ar"): string {
  const hour = new Date().getHours();
  if (lang === "ar") {
    if (hour < 12) return "صباح الخير";
    if (hour < 17) return "مساء الخير";
    return "مساء النور";
  }
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function timeAgo(dateStr: string, lang: "en" | "ar"): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (lang === "ar") {
    if (mins < 60) return `منذ ${mins} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${days} يوم`;
  }
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

const PAGE_TYPE_LABELS: Record<string, { en: string; ar: string }> = {
  note: { en: "Note", ar: "ملاحظة" },
  meeting: { en: "Meeting", ar: "اجتماع" },
  sop: { en: "SOP", ar: "إجراء" },
  wiki: { en: "Wiki", ar: "ويكي" },
  document: { en: "Document", ar: "مستند" },
  project: { en: "Project", ar: "مشروع" },
  brainstorm: { en: "Brainstorm", ar: "عصف ذهني" },
  database: { en: "Database", ar: "قاعدة بيانات" },
  task_hub: { en: "Task Hub", ar: "مركز المهام" },
  knowledge: { en: "Knowledge", ar: "معرفة" },
  handbook: { en: "Handbook", ar: "دليل" },
  brief: { en: "Brief", ar: "بريف" },
  spec: { en: "Spec", ar: "مواصفات" },
  template: { en: "Template", ar: "قالب" },
};

const ACTIVITY_ICONS: Record<string, string> = {
  edited: "✏️",
  created: "🆕",
  "commented on": "💬",
  updated: "🔄",
  viewed: "👁️",
  shared: "🔗",
};

const COVER_COLORS = [
  "from-violet-500/20 to-indigo-500/20",
  "from-rose-500/20 to-pink-500/20",
  "from-emerald-500/20 to-teal-500/20",
  "from-amber-500/20 to-orange-500/20",
  "from-blue-500/20 to-cyan-500/20",
  "from-fuchsia-500/20 to-purple-500/20",
];

function getMemberStatus(member: { last_active: string }): "online" | "away" | "offline" {
  const diff = Date.now() - new Date(member.last_active).getTime();
  if (diff < 3600000) return "online";
  if (diff < 86400000) return "away";
  return "offline";
}

const STATUS_COLORS = {
  online: "bg-emerald-400",
  away: "bg-amber-400",
  offline: "bg-zinc-400",
};

export default function StudioHome() {
  const { lang, isRtl } = useLanguage();
  const [, setLocation] = useLocation();

  const recentPages = useMemo(
    () => [...STUDIO_PAGES].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 6),
    []
  );

  const favoritePages = useMemo(() => STUDIO_PAGES.filter(p => p.is_favorite), []);

  const popularPages = useMemo(
    () => [...STUDIO_PAGES].sort((a, b) => b.view_count - a.view_count).slice(0, 5),
    []
  );

  const totalPages = STUDIO_PAGES.length;
  const totalViews = STUDIO_ANALYTICS.total_views;
  const activeMembers = STUDIO_MEMBERS.filter(m => m.status === "active").length;
  const storageUsed = useMemo(() => {
    const totalBytes = STUDIO_PAGES.reduce((acc, p) => acc + (p.word_count || 0) * 5, 0);
    return `${(totalBytes / 1024 / 1024).toFixed(1)} MB`;
  }, []);

  const QUICK_ACTIONS = [
    { id: "new-page", icon: Plus, en: "New Page", ar: "صفحة جديدة", color: "from-violet-500 to-indigo-600" },
    { id: "new-db", icon: Database, en: "New Database", ar: "قاعدة بيانات جديدة", color: "from-emerald-500 to-teal-600" },
    { id: "invite", icon: UserPlus, en: "Invite Member", ar: "دعوة عضو", color: "from-rose-500 to-pink-600" },
  ];

  const TIPS = [
    { icon: Lightbulb, en: "Use / to insert blocks — tables, toggles, checklists, and more", ar: "استخدم / لإدراج كتل — جداول، تبديلات، قوائم تحقق، والمزيد" },
    { icon: Sparkles, en: "Highlight text and click AI to rewrite, translate, or summarize", ar: "حدد النص وانقر على AI لإعادة الصياغة أو الترجمة أو التلخيص" },
    { icon: BookOpen, en: "Link pages together with @mentions for a connected knowledge base", ar: "اربط الصفحات ببعضها باستخدام @للإشارة لقاعدة معرفة متصلة" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-12">
      {/* ═══════════════ HERO ═══════════════ */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent border border-border/20 p-8 md:p-10"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/[0.04] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/[0.04] rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

        <motion.div variants={fadeUp} className="relative z-10 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Crown size={16} className="text-primary-foreground" />
            </div>
            <span className="text-[11px] font-semibold text-primary/60 tracking-[0.15em] uppercase">
              {lang === "ar" ? "الاستوديو" : "STUDIO"}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {getGreeting(lang)}, {lang === "ar" ? "أهلاً بك" : "welcome back"}
          </h1>
          <p className="text-muted-foreground text-base max-w-lg leading-relaxed">
            {lang === "ar"
              ? "مرحباً بك في الاستوديو — مساحة عملك الذكية لإنشاء إدارة ومشاركة المعرفة."
              : "Welcome to Studio — your intelligent workspace for creating, managing, and sharing knowledge."}
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerFast}
          className="relative z-10 flex flex-wrap gap-3 mt-6"
        >
          {QUICK_ACTIONS.map(action => (
            <motion.button
              key={action.id}
              variants={scaleIn}
              className="group flex items-center gap-2.5 rounded-xl border border-border/30 bg-card/70 backdrop-blur-sm px-4 py-2.5 text-start hover:border-border/50 hover:bg-card transition-all duration-200 hover:shadow-md"
            >
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center shrink-0`}>
                <action.icon size={14} className="text-white" />
              </div>
              <span className="text-sm font-medium">{lang === "ar" ? action.ar : action.en}</span>
              <ArrowRight
                size={12}
                className={`text-muted-foreground/30 group-hover:text-muted-foreground transition-colors ${isRtl ? "rotate-180" : ""}`}
              />
            </motion.button>
          ))}
        </motion.div>
      </motion.div>

      {/* ═══════════════ QUICK STATS ═══════════════ */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerFast}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {[
          { label: lang === "ar" ? "إجمالي الصفحات" : "Total Pages", value: totalPages, icon: FileText, color: "text-violet-500", bg: "bg-violet-500/10" },
          { label: lang === "ar" ? "إجمالي المشاهدات" : "Total Views", value: totalViews.toLocaleString(), icon: Eye, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: lang === "ar" ? "أعضاء نشطون" : "Active Members", value: activeMembers, icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: lang === "ar" ? "المساحة المستخدمة" : "Storage Used", value: storageUsed, icon: HardDrive, color: "text-amber-500", bg: "bg-amber-500/10" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            variants={fadeUp}
            className="rounded-2xl border border-border/20 bg-card/50 backdrop-blur-sm p-4 hover:border-border/40 transition-all duration-200 hover:shadow-sm group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon size={16} className={stat.color} />
              </div>
              <TrendingUp size={12} className="text-emerald-500/50" />
            </div>
            <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ═══════════════ RECENT ACTIVITY FEED ═══════════════ */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        <div className="flex items-center gap-3 mb-4">
          <Activity size={14} className="text-primary/60" />
          <h2 className="text-[11px] font-semibold text-muted-foreground tracking-[0.1em] uppercase">
            {lang === "ar" ? "النشاط الأخير" : "Recent Activity"}
          </h2>
          <div className="flex-1 h-px bg-border/30" />
        </div>

        <div className="space-y-1">
          {STUDIO_ANALYTICS.recent_activity.map((activity, i) => {
            const member = STUDIO_MEMBERS.find(m => m.name === activity.user);
            return (
              <motion.div
                key={i}
                variants={fadeUp}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent/30 transition-colors group"
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: member?.avatar || "#6B7280" }}
                >
                  {activity.user.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{lang === "ar" ? activity.user_ar : activity.user}</span>
                    <span className="text-muted-foreground/60 mx-1">
                      {lang === "ar" ? activity.action_ar : activity.action}
                    </span>
                    <span className="font-medium text-primary/80 group-hover:text-primary transition-colors">
                      {lang === "ar" ? activity.page_ar : activity.page}
                    </span>
                  </p>
                </div>
                <span className="text-[11px] text-muted-foreground/40 tabular-nums shrink-0">
                  {activity.time}
                </span>
                <span className="text-sm">{ACTIVITY_ICONS[activity.action] || "📝"}</span>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* ═══════════════ FAVORITES ═══════════════ */}
      {favoritePages.length > 0 && (
        <motion.section
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <div className="flex items-center gap-3 mb-4">
            <Star size={14} className="text-amber-500/70" />
            <h2 className="text-[11px] font-semibold text-muted-foreground tracking-[0.1em] uppercase">
              {lang === "ar" ? "المفضلة" : "Favorites"}
            </h2>
            <div className="flex-1 h-px bg-border/30" />
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border/30 scrollbar-track-transparent -mx-1 px-1">
            {favoritePages.map((page, i) => (
              <motion.div
                key={page.id}
                variants={fadeUp}
                onClick={() => setLocation(`/studio/${page.id}`)}
                className={`relative flex-shrink-0 w-56 rounded-2xl bg-gradient-to-br ${COVER_COLORS[i % COVER_COLORS.length]} border border-border/20 p-4 hover:border-border/40 hover:shadow-md cursor-pointer transition-all duration-200 group`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{page.icon}</span>
                  <div className="w-5 h-5 rounded-full bg-amber-400/20 flex items-center justify-center">
                    <Star size={10} className="text-amber-500 fill-amber-500" />
                  </div>
                </div>
                <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors mb-1">
                  {lang === "ar" ? page.title_ar : page.title}
                </p>
                <p className="text-[11px] text-muted-foreground/60">
                  {timeAgo(page.updated_at, lang)}
                </p>
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight size={14} className={`text-muted-foreground/40 ${isRtl ? "rotate-180" : ""}`} />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ═══════════════ MAIN CONTENT AREA ═══════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ─── Recent Pages + Templates (2 cols) ─── */}
        <div className="lg:col-span-2 space-y-10">
          {/* Recent Pages */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <div className="flex items-center gap-3 mb-4">
              <Clock size={14} className="text-muted-foreground/60" />
              <h2 className="text-[11px] font-semibold text-muted-foreground tracking-[0.1em] uppercase">
                {lang === "ar" ? "الصفحات الأخيرة" : "Recent Pages"}
              </h2>
              <div className="flex-1 h-px bg-border/30" />
            </div>

            {recentPages.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border border-dashed border-border/40 bg-card/30">
                <FileText size={32} className="mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground/60">
                  {lang === "ar" ? "لا توجد صفحات بعد — ابدأ بإنشاء صفحة جديدة" : "No pages yet — create your first page"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recentPages.map((page, i) => (
                  <motion.div
                    key={page.id}
                    variants={fadeUp}
                    onClick={() => setLocation(`/studio/${page.id}`)}
                    className="relative rounded-2xl border border-border/20 bg-card/50 backdrop-blur-sm p-4 hover:border-border/40 hover:shadow-sm cursor-pointer transition-all duration-200 group overflow-hidden"
                  >
                    <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${COVER_COLORS[i % COVER_COLORS.length]}`} />
                    <div className="flex items-start gap-3 mt-1">
                      <span className="text-xl mt-0.5">{page.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                          {lang === "ar" ? page.title_ar : page.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="inline-flex items-center rounded-md bg-primary/8 px-2 py-0.5 text-[10px] font-medium text-primary/70">
                            {PAGE_TYPE_LABELS[page.type]?.[lang] || page.type}
                          </span>
                          <span className="text-[11px] text-muted-foreground/50 flex items-center gap-1">
                            <Eye size={10} />
                            {page.view_count}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground/40 tabular-nums shrink-0">
                        {timeAgo(page.updated_at, lang)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>

          {/* Templates Gallery */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <div className="flex items-center gap-3 mb-4">
              <LayoutTemplate size={14} className="text-muted-foreground/60" />
              <h2 className="text-[11px] font-semibold text-muted-foreground tracking-[0.1em] uppercase">
                {lang === "ar" ? "معرض القوالب" : "Templates Gallery"}
              </h2>
              <div className="flex-1 h-px bg-border/30" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {STUDIO_TEMPLATES.map(tmpl => (
                <motion.div
                  key={tmpl.id}
                  variants={fadeUp}
                  className="relative rounded-2xl border border-border/20 bg-card/50 backdrop-blur-sm p-4 hover:border-border/40 hover:shadow-sm transition-all duration-200 group cursor-pointer overflow-hidden"
                >
                  <div
                    className="absolute inset-x-0 top-0 h-1"
                    style={{ background: `linear-gradient(90deg, ${tmpl.color}40, ${tmpl.color}10)` }}
                  />
                  <div className="flex items-start gap-3 mt-1">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ backgroundColor: `${tmpl.color}15` }}
                    >
                      {tmpl.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold group-hover:text-primary transition-colors">
                        {lang === "ar" ? tmpl.name_ar : tmpl.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground/60 line-clamp-2 mt-1 leading-relaxed">
                        {lang === "ar" ? tmpl.description_ar : tmpl.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/10">
                    <span className="text-[10px] text-muted-foreground/40 tabular-nums flex items-center gap-1">
                      <BarChart3 size={10} />
                      {tmpl.usage_count} {lang === "ar" ? "مرة" : "uses"}
                    </span>
                    <button className="text-[11px] font-medium text-primary/70 hover:text-primary transition-colors flex items-center gap-1">
                      {lang === "ar" ? "استخدم" : "Use"}
                      <Zap size={10} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </div>

        {/* ─── Sidebar (1 col) ─── */}
        <div className="space-y-8">
          {/* Popular Pages */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp size={14} className="text-muted-foreground/60" />
              <h2 className="text-[11px] font-semibold text-muted-foreground tracking-[0.1em] uppercase">
                {lang === "ar" ? "الأكثر مشاهدة" : "Popular Pages"}
              </h2>
              <div className="flex-1 h-px bg-border/30" />
            </div>

            <div className="space-y-1">
              {popularPages.map((page, i) => (
                <motion.div
                  key={page.id}
                  variants={fadeUp}
                  onClick={() => setLocation(`/studio/${STUDIO_PAGES.find(p => p.title === page.title)?.id || ""}`)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent/30 cursor-pointer transition-colors group"
                >
                  <span className="text-[11px] font-bold text-muted-foreground/30 w-4 text-center tabular-nums">
                    {i + 1}
                  </span>
                  <span className="text-lg">{page.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate group-hover:text-primary transition-colors">
                      {lang === "ar" ? page.title_ar : page.title}
                    </p>
                  </div>
                  <span className="text-[11px] text-muted-foreground/50 tabular-nums flex items-center gap-1 shrink-0">
                    <Eye size={10} />
                    {page.view_count}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Workspace Members */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <div className="flex items-center gap-3 mb-4">
              <Globe size={14} className="text-muted-foreground/60" />
              <h2 className="text-[11px] font-semibold text-muted-foreground tracking-[0.1em] uppercase">
                {lang === "ar" ? "أعضاء الفريق" : "Workspace Members"}
              </h2>
              <div className="flex-1 h-px bg-border/30" />
            </div>

            <div className="space-y-1">
              {STUDIO_MEMBERS.map(member => {
                const status = getMemberStatus(member);
                return (
                  <motion.div
                    key={member.id}
                    variants={fadeUp}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent/30 transition-colors group"
                  >
                    <div className="relative shrink-0">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: member.avatar }}
                      >
                        {member.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${STATUS_COLORS[status]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate">
                        {lang === "ar" ? member.name_ar : member.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground/50 capitalize">
                        {member.role}
                      </p>
                    </div>
                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                      status === "online"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : status === "away"
                        ? "bg-amber-500/10 text-amber-600"
                        : "bg-zinc-500/10 text-zinc-500"
                    }`}>
                      {lang === "ar"
                        ? (status === "online" ? "متصل" : status === "away" ? "بعيد" : "غير متصل")
                        : status}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>

          {/* Getting Started */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <div className="flex items-center gap-3 mb-4">
              <Lightbulb size={14} className="text-muted-foreground/60" />
              <h2 className="text-[11px] font-semibold text-muted-foreground tracking-[0.1em] uppercase">
                {lang === "ar" ? "ابدأ هنا" : "Getting Started"}
              </h2>
              <div className="flex-1 h-px bg-border/30" />
            </div>

            <div className="space-y-2">
              {TIPS.map((tip, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="flex items-start gap-3 px-4 py-3.5 rounded-xl border border-border/15 bg-card/30 hover:bg-card/50 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
                    <tip.icon size={14} className="text-primary/50" />
                  </div>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">
                    {lang === "ar" ? tip.ar : tip.en}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
