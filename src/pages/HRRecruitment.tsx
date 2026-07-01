/**
 * Recruitment / ATS — التوظيف ومتابعة المرشحين
 *
 * Job openings, candidates pipeline, interview scheduling, and evaluation
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { useLocation } from "wouter";
import {
  HR_JOB_OPENINGS, HR_CANDIDATES, HR_INTERVIEWS,
  type JobOpening, type Candidate, type InterviewSchedule,
} from "../lib/hr-data-full";
import {
  Briefcase, Users, Plus, Search, ChevronRight, Star, Phone, Mail,
  FileText, CheckCircle2, XCircle, Clock, Eye, Filter, Target,
  ArrowUpRight, ArrowDownRight, UserPlus, MapPin, Building2,
  Calendar, Timer, TrendingUp, ExternalLink, X, ChevronDown,
  Linkedin, Globe, UserCheck, Handshake, Award, MessageSquare,
} from "lucide-react";

/* ─── Helpers ──────────────────────────────────────────────── */

function formatEGP(n: number) {
  return new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", minimumFractionDigits: 0 }).format(n);
}

const EASE = [0.16, 1, 0.3, 1] as const;
const serif: React.CSSProperties = { fontFamily: "var(--app-font-serif)" };

/* ─── Animation Variants ───────────────────────────────────── */

const cardV: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.04, duration: 0.35, ease: EASE },
  }),
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: EASE } },
};

/* ─── Stage Metadata ───────────────────────────────────────── */

const ALL_STAGES: Candidate["stage"][] = [
  "applied", "screening", "phone_screen", "interview_1", "interview_2",
  "evaluation", "offer", "hired", "rejected",
];

const STAGE_META: Record<Candidate["stage"], { en: string; ar: string; color: string; bgHex: string; borderHex: string; textHex: string }> = {
  applied:       { en: "Applied",       ar: "تقدم",       color: "text-slate-600",    bgHex: "#f8fafc", borderHex: "#e2e8f0", textHex: "#475569" },
  screening:     { en: "Screening",     ar: "مراجعة",     color: "text-violet-600",   bgHex: "#f5f3ff", borderHex: "#ddd6fe", textHex: "#7c3aed" },
  phone_screen:  { en: "Phone Screen",  ar: "مقابلة هاتف", color: "text-sky-600",     bgHex: "#f0f9ff", borderHex: "#bae6fd", textHex: "#0284c7" },
  interview_1:   { en: "Interview 1",   ar: "مقابلة ١",   color: "text-amber-600",    bgHex: "#fffbeb", borderHex: "#fde68a", textHex: "#d97706" },
  interview_2:   { en: "Interview 2",   ar: "مقابلة ٢",   color: "text-orange-600",   bgHex: "#fff7ed", borderHex: "#fed7aa", textHex: "#ea580c" },
  evaluation:    { en: "Evaluation",    ar: "تقييم",      color: "text-cyan-600",     bgHex: "#ecfeff", borderHex: "#a5f3fc", textHex: "#0891b2" },
  offer:         { en: "Offer",         ar: "عرض",        color: "text-emerald-600",  bgHex: "#ecfdf5", borderHex: "#a7f3d0", textHex: "#059669" },
  hired:         { en: "Hired",         ar: "تم التعيين",  color: "text-green-700",   bgHex: "#f0fdf4", borderHex: "#86efac", textHex: "#15803d" },
  rejected:      { en: "Rejected",      ar: "مرفوض",      color: "text-rose-600",     bgHex: "#fff1f2", borderHex: "#fecdd3", textHex: "#e11d48" },
};

const STAGE_PIPE = ["applied", "screening", "phone_screen", "interview_1", "interview_2", "evaluation", "offer", "hired"] as const;

/* ─── Source Badge ─────────────────────────────────────────── */

const SOURCE_META: Record<Candidate["source"], { en: string; ar: string; icon: React.ElementType; color: string; bg: string }> = {
  linkedin: { en: "LinkedIn", ar: "لينكدإن", icon: Linkedin, color: "text-blue-600", bg: "bg-blue-50" },
  website:  { en: "Website",  ar: "الموقع",  icon: Globe,    color: "text-violet-600", bg: "bg-violet-50" },
  referral: { en: "Referral", ar: "إحالة",   icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
  agency:   { en: "Agency",   ar: "وكالة",   icon: Briefcase, color: "text-amber-600", bg: "bg-amber-50" },
  walk_in:  { en: "Walk-in",  ar: "حضور",    icon: Users,     color: "text-orange-600", bg: "bg-orange-50" },
  job_fair: { en: "Job Fair", ar: "معرض عمل", icon: Building2, color: "text-cyan-600", bg: "bg-cyan-50" },
};

/* ─── Interview Type Labels ────────────────────────────────── */

const INTERVIEW_TYPE_META: Record<string, { en: string; ar: string; color: string }> = {
  phone_screen: { en: "Phone Screen", ar: "مقابلة هاتف", color: "bg-sky-100 text-sky-700" },
  technical:    { en: "Technical",    ar: "تقنية",       color: "bg-violet-100 text-violet-700" },
  hr:           { en: "HR",          ar: "موارد بشرية",  color: "bg-emerald-100 text-emerald-700" },
  manager:      { en: "Manager",     ar: "مدير",         color: "bg-amber-100 text-amber-700" },
  final:        { en: "Final",       ar: "نهائي",        color: "bg-rose-100 text-rose-700" },
};

/* ─── Main Component ───────────────────────────────────────── */

export default function HRRecruitment() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [, navigate] = useLocation();
  const [searchQ, setSearchQ] = useState("");
  const [filterJob, setFilterJob] = useState<string>("all");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [modalStage, setModalStage] = useState<Candidate["stage"] | null>(null);

  /* ─── Filtered Candidates ─────────────────────────────────── */

  const filteredCandidates = useMemo(() => {
    let list = [...HR_CANDIDATES];
    if (filterJob !== "all") list = list.filter(c => c.job_id === filterJob);
    if (searchQ) {
      const q = searchQ.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.name_ar.includes(searchQ) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q)
      );
    }
    return list;
  }, [searchQ, filterJob]);

  /* ─── KPI Stats ──────────────────────────────────────────── */

  const stats = useMemo(() => {
    const openPositions = HR_JOB_OPENINGS.filter(j => j.status === "open").length;
    const totalCandidates = HR_CANDIDATES.length;
    const hiredCount = HR_CANDIDATES.filter(c => c.stage === "hired").length;
    const conversionRate = totalCandidates > 0 ? Math.round((hiredCount / totalCandidates) * 100) : 0;
    const acceptedOffers = HR_CANDIDATES.filter(c => c.offer_status === "accepted").length;
    const totalOffers = HR_CANDIDATES.filter(c => c.offer_amount !== null).length;
    const offerAcceptanceRate = totalOffers > 0 ? Math.round((acceptedOffers / totalOffers) * 100) : 0;
    return { openPositions, totalCandidates, hiredCount, conversionRate, offerAcceptanceRate };
  }, []);

  /* ─── Kanban Data ────────────────────────────────────────── */

  const stageData = useMemo(() => {
    return STAGE_PIPE.map(stage => ({
      ...STAGE_META[stage],
      key: stage,
      candidates: filteredCandidates.filter(c => c.stage === stage),
    }));
  }, [filteredCandidates]);

  const rejectedCandidates = useMemo(
    () => filteredCandidates.filter(c => c.stage === "rejected"),
    [filteredCandidates]
  );

  /* ─── Upcoming Interviews ────────────────────────────────── */

  const upcomingInterviews = useMemo(() => {
    return HR_INTERVIEWS
      .filter(iv => iv.status === "scheduled")
      .sort((a, b) => a.date.localeCompare(b.date));
  }, []);

  const completedInterviews = useMemo(() => {
    return HR_INTERVIEWS.filter(iv => iv.status === "completed");
  }, []);

  /* ─── Candidate Job Title ────────────────────────────────── */

  const getJobTitle = (jobId: string) => {
    const job = HR_JOB_OPENINGS.find(j => j.id === jobId);
    return job ? (ar ? job.title_ar : job.title) : jobId;
  };

  /* ─── Format Date ────────────────────────────────────────── */

  const fmtDate = (d: string) => {
    return new Date(d).toLocaleDateString(ar ? "ar-EG" : "en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  };

  /* ─── Open Modal ─────────────────────────────────────────── */

  const openCandidateModal = (c: Candidate) => {
    setSelectedCandidate(c);
    setModalStage(c.stage);
  };

  /* ─── Render ─────────────────────────────────────────────── */

  return (
    <div className="min-h-full px-6 md:px-8 py-6 max-w-[1440px] mx-auto space-y-5">

      {/* ═══ HEADER ═══ */}
      <motion.div variants={cardV} custom={0} initial="hidden" animate="visible"
        className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight" style={serif}>
            {ar ? "التوظيف" : "Recruitment"}
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            {ar ? "إدارة الوظائف والمرشحين وجدولة المقابلات" : "Manage job openings, candidate pipeline, and interviews"}
          </p>
        </div>
        <button className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-[11px] font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5">
          <Plus size={13} /> {ar ? "وظيفة جديدة" : "New Opening"}
        </button>
      </motion.div>

      {/* ═══ KPI CARDS ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: ar ? "فتحات مفتوحة" : "Open Positions", value: stats.openPositions, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50/80" },
          { label: ar ? "إجمالي المرشحين" : "Total Candidates", value: stats.totalCandidates, icon: Users, color: "text-violet-600", bg: "bg-violet-50/80" },
          { label: ar ? "تم التعيين" : "Hired", value: stats.hiredCount, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50/80" },
          { label: ar ? "معدل التحويل" : "Conversion Rate", value: `${stats.conversionRate}%`, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50/80" },
          { label: ar ? "متوسط ملء الوظيفة" : "Avg Time to Fill", value: "32d", icon: Timer, color: "text-cyan-600", bg: "bg-cyan-50/80" },
          { label: ar ? "معدل قبول العروض" : "Offer Acceptance", value: `${stats.offerAcceptanceRate}%`, icon: Award, color: "text-rose-600", bg: "bg-rose-50/80" },
        ].map((kpi, i) => (
          <motion.div key={i} variants={cardV} custom={i + 1} initial="hidden" animate="visible"
            className={`${kpi.bg} rounded-xl p-4 border border-border/30`}>
            <div className="flex items-center justify-between mb-2">
              <kpi.icon size={15} className={kpi.color} />
            </div>
            <p className="text-[20px] font-bold text-foreground" style={serif}>{kpi.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ═══ JOB OPENINGS ═══ */}
      <motion.div variants={cardV} custom={5} initial="hidden" animate="visible"
        className="p-5 rounded-xl border border-border/40 bg-background">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[13px] font-semibold flex items-center gap-2">
            <Briefcase size={14} className="text-blue-500" />
            {ar ? "الوظائف المفتوحة" : "Job Openings"}
          </h3>
          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {HR_JOB_OPENINGS.filter(j => j.status === "open").length} {ar ? "مفتوحة" : "open"}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {HR_JOB_OPENINGS.map((job, idx) => (
            <motion.div key={job.id} variants={cardV} custom={idx} initial="hidden" animate="visible"
              className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md group ${
                job.status === "open"
                  ? "border-border/40 bg-background hover:border-border/60"
                  : "border-border/20 bg-muted/20 opacity-60"
              }`}>
              <div className="flex items-center justify-between mb-2.5">
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                  job.status === "open" ? "bg-emerald-100 text-emerald-700"
                    : job.status === "closed" ? "bg-zinc-100 text-zinc-500"
                    : job.status === "on_hold" ? "bg-amber-100 text-amber-700"
                    : "bg-slate-100 text-slate-500"
                }`}>
                  {job.status === "open" ? (ar ? "مفتوحة" : "Open")
                    : job.status === "closed" ? (ar ? "مغلقة" : "Closed")
                    : job.status === "on_hold" ? (ar ? "معلقة" : "On Hold")
                    : (ar ? "مسودة" : "Draft")}
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Users size={9} />
                  {job.applicants_count}
                </span>
              </div>
              <h4 className="text-[12px] font-medium mb-1.5 leading-snug group-hover:text-primary transition-colors">
                {ar ? job.title_ar : job.title}
              </h4>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-2">
                <Building2 size={9} />
                <span>{job.department}</span>
                <span className="text-border">·</span>
                <MapPin size={9} />
                <span>{job.branch}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/30">
                <p className="text-[10px] font-medium text-primary">
                  {formatEGP(job.salary_min)} — {formatEGP(job.salary_max)}
                </p>
                <p className="text-[9px] text-muted-foreground">
                  {fmtDate(job.deadline)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ═══ CANDIDATES PIPELINE — KANBAN ═══ */}
      <motion.div variants={cardV} custom={6} initial="hidden" animate="visible">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[13px] font-semibold flex items-center gap-2">
            <Users size={14} className="text-violet-500" />
            {ar ? "قناة المرشحين" : "Candidates Pipeline"}
          </h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
              <input
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                className="w-48 h-8 pl-8 pr-3 rounded-lg border border-border bg-background text-[11px] placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30"
                placeholder={ar ? "بحث..." : "Search..."}
              />
            </div>
            <select
              value={filterJob}
              onChange={e => setFilterJob(e.target.value)}
              className="h-8 px-2 rounded-lg border border-border bg-background text-[11px] cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/30"
            >
              <option value="all">{ar ? "كل الوظائف" : "All Jobs"}</option>
              {HR_JOB_OPENINGS.map(j => (
                <option key={j.id} value={j.id}>{ar ? j.title_ar : j.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
          {stageData.map(stage => (
            <div key={stage.key} className="w-[260px] shrink-0">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-2.5 px-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: stage.textHex }}
                  />
                  <span className="text-[12px] font-semibold">{ar ? stage.ar : stage.en}</span>
                </div>
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full font-medium">
                  {stage.candidates.length}
                </span>
              </div>

              {/* Column Body */}
              <div
                className="space-y-2 min-h-[160px] p-2 rounded-xl border border-transparent"
                style={{ backgroundColor: stage.bgHex, borderColor: `${stage.borderHex}60` }}
              >
                {stage.candidates.map(candidate => {
                  const source = SOURCE_META[candidate.source];
                  const SourceIcon = source.icon;
                  return (
                    <div
                      key={candidate.id}
                      onClick={() => openCandidateModal(candidate)}
                      className="p-3.5 rounded-xl bg-background border border-border/40 cursor-pointer hover:shadow-md transition-all group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0">
                          <p className="text-[12px] font-medium truncate">
                            {ar ? candidate.name_ar : candidate.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {candidate.phone}
                          </p>
                        </div>
                        {candidate.rating != null && candidate.rating > 0 && (
                          <div className="flex items-center gap-0.5 shrink-0">
                            <Star size={10} className="text-amber-500 fill-amber-500" />
                            <span className="text-[10px] font-medium">{candidate.rating}</span>
                          </div>
                        )}
                      </div>

                      <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
                        {ar ? candidate.notes_ar : candidate.notes}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-border/30">
                        <span className={`inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full ${source.color} ${source.bg}`}>
                          <SourceIcon size={8} />
                          {ar ? source.ar : source.en}
                        </span>
                        <span className="text-[9px] text-muted-foreground">{fmtDate(candidate.applied_at)}</span>
                      </div>
                    </div>
                  );
                })}

                {stage.candidates.length === 0 && (
                  <div className="text-center py-10 text-[10px] text-muted-foreground/40">
                    {ar ? "لا يوجد مرشحين" : "No candidates"}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Rejected Column */}
          <div className="w-[260px] shrink-0">
            <div className="flex items-center justify-between mb-2.5 px-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: STAGE_META.rejected.textHex }}
                />
                <span className="text-[12px] font-semibold">{ar ? STAGE_META.rejected.ar : STAGE_META.rejected.en}</span>
              </div>
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full font-medium">
                {rejectedCandidates.length}
              </span>
            </div>
            <div
              className="space-y-2 min-h-[160px] p-2 rounded-xl border border-transparent"
              style={{ backgroundColor: STAGE_META.rejected.bgHex, borderColor: `${STAGE_META.rejected.borderHex}60` }}
            >
              {rejectedCandidates.map(candidate => {
                const source = SOURCE_META[candidate.source];
                const SourceIcon = source.icon;
                return (
                  <div
                    key={candidate.id}
                    onClick={() => openCandidateModal(candidate)}
                    className="p-3.5 rounded-xl bg-background border border-border/40 cursor-pointer hover:shadow-md transition-all opacity-75 hover:opacity-100"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0">
                        <p className="text-[12px] font-medium truncate">{ar ? candidate.name_ar : candidate.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{candidate.phone}</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2">{ar ? candidate.notes_ar : candidate.notes}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-border/30">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full ${source.color} ${source.bg}`}>
                        <SourceIcon size={8} />
                        {ar ? source.ar : source.en}
                      </span>
                      <span className="text-[9px] text-muted-foreground">{fmtDate(candidate.applied_at)}</span>
                    </div>
                  </div>
                );
              })}
              {rejectedCandidates.length === 0 && (
                <div className="text-center py-10 text-[10px] text-muted-foreground/40">
                  {ar ? "لا يوجد مرشحين مرفوضين" : "No rejected candidates"}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ INTERVIEW SCHEDULE ═══ */}
      <motion.div variants={cardV} custom={7} initial="hidden" animate="visible"
        className="p-5 rounded-xl border border-border/40 bg-background">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[13px] font-semibold flex items-center gap-2">
            <Calendar size={14} className="text-cyan-500" />
            {ar ? "جدولة المقابلات" : "Interview Schedule"}
          </h3>
        </div>

        {/* Upcoming */}
        {upcomingInterviews.length > 0 && (
          <div className="mb-5">
            <p className="text-[11px] font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
              <Clock size={11} />
              {ar ? "المقابلات القادمة" : "Upcoming Interviews"}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {upcomingInterviews.map((iv, idx) => {
                const candidate = HR_CANDIDATES.find(c => c.id === iv.candidate_id);
                const typeMeta = INTERVIEW_TYPE_META[iv.type] || INTERVIEW_TYPE_META.hr;
                return (
                  <motion.div key={iv.id} variants={cardV} custom={idx} initial="hidden" animate="visible"
                    className="p-4 rounded-xl border border-border/40 bg-background hover:shadow-sm transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${typeMeta.color}`}>
                        {ar ? typeMeta.ar : typeMeta.en}
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                        {ar ? "قادمة" : "Scheduled"}
                      </span>
                    </div>
                    <p className="text-[12px] font-medium mb-1">
                      {candidate ? (ar ? candidate.name_ar : candidate.name) : iv.candidate_id}
                    </p>
                    <p className="text-[10px] text-muted-foreground mb-2">
                      {getJobTitle(iv.job_id)}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar size={9} />{fmtDate(iv.date)}</span>
                      <span className="flex items-center gap-1"><Clock size={9} />{iv.time}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <MapPin size={9} />
                      <span>{iv.location}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <UserCheck size={9} />
                      <span>{ar ? iv.interviewer_ar : iv.interviewer}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed */}
        {completedInterviews.length > 0 && (
          <div>
            <p className="text-[11px] font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
              <CheckCircle2 size={11} className="text-emerald-500" />
              {ar ? "المقابلات المكتملة" : "Completed Interviews"}
            </p>
            <div className="space-y-2">
              {completedInterviews.map(iv => {
                const candidate = HR_CANDIDATES.find(c => c.id === iv.candidate_id);
                const typeMeta = INTERVIEW_TYPE_META[iv.type] || INTERVIEW_TYPE_META.hr;
                return (
                  <div key={iv.id}
                    className="flex items-center gap-4 p-3 rounded-xl border border-border/30 bg-muted/10 hover:bg-muted/30 transition-all">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[9px] font-bold shrink-0">
                      {candidate ? candidate.name.split(" ").map(w => w[0]).join("") : "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[11px] font-medium truncate">
                          {candidate ? (ar ? candidate.name_ar : candidate.name) : iv.candidate_id}
                        </p>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${typeMeta.color}`}>
                          {ar ? typeMeta.ar : typeMeta.en}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {iv.feedback || (ar ? "لا توجد ملاحظات" : "No feedback")}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {iv.rating != null && (
                        <div className="flex items-center gap-0.5 justify-end mb-0.5">
                          {[1, 2, 3, 4, 5].map(n => (
                            <Star key={n} size={8} className={n <= iv.rating! ? "text-amber-500 fill-amber-500" : "text-muted-foreground/20"} />
                          ))}
                        </div>
                      )}
                      <p className="text-[9px] text-muted-foreground">{fmtDate(iv.date)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>

      {/* ═══ CANDIDATE DETAIL MODAL ═══ */}
      <AnimatePresence>
        {selectedCandidate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedCandidate(null)} />
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="relative w-full max-w-lg bg-background rounded-2xl border border-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 shrink-0">
                <h3 className="text-[15px] font-semibold" style={serif}>
                  {ar ? selectedCandidate.name_ar : selectedCandidate.name}
                </h3>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                {/* Profile Row */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-[16px] font-bold shrink-0">
                    {selectedCandidate.name.split(" ").map(w => w[0]).join("")}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium">{ar ? selectedCandidate.name_ar : selectedCandidate.name}</p>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1"><Phone size={10} />{selectedCandidate.phone}</span>
                      <span className="flex items-center gap-1"><Mail size={10} />{selectedCandidate.email}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {getJobTitle(selectedCandidate.job_id)}
                    </p>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Stage */}
                  <div className="p-3 rounded-xl bg-muted/30">
                    <p className="text-[10px] text-muted-foreground mb-1">{ar ? "المرحلة" : "Stage"}</p>
                    <span className={`text-[11px] font-medium ${STAGE_META[selectedCandidate.stage]?.color}`}>
                      {ar ? STAGE_META[selectedCandidate.stage]?.ar : STAGE_META[selectedCandidate.stage]?.en}
                    </span>
                  </div>
                  {/* Rating */}
                  <div className="p-3 rounded-xl bg-muted/30">
                    <p className="text-[10px] text-muted-foreground mb-1">{ar ? "التقييم" : "Rating"}</p>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star key={n} size={12}
                          className={n <= (selectedCandidate.rating || 0)
                            ? "text-amber-500 fill-amber-500"
                            : "text-muted-foreground/20"}
                        />
                      ))}
                    </div>
                  </div>
                  {/* Source */}
                  <div className="p-3 rounded-xl bg-muted/30">
                    <p className="text-[10px] text-muted-foreground mb-1">{ar ? "المصدر" : "Source"}</p>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${SOURCE_META[selectedCandidate.source]?.color}`}>
                      {(() => { const S = SOURCE_META[selectedCandidate.source]?.icon; return S ? <S size={10} /> : null; })()}
                      {ar ? SOURCE_META[selectedCandidate.source]?.ar : SOURCE_META[selectedCandidate.source]?.en}
                    </span>
                  </div>
                  {/* Applied Date */}
                  <div className="p-3 rounded-xl bg-muted/30">
                    <p className="text-[10px] text-muted-foreground mb-1">{ar ? "تاريخ التقديم" : "Applied"}</p>
                    <p className="text-[11px] font-medium">{fmtDate(selectedCandidate.applied_at)}</p>
                  </div>
                  {/* Offer Amount */}
                  {selectedCandidate.offer_amount != null && (
                    <div className="p-3 rounded-xl bg-muted/30">
                      <p className="text-[10px] text-muted-foreground mb-1">{ar ? "مبلغ العرض" : "Offer Amount"}</p>
                      <p className="text-[11px] font-medium text-emerald-600">{formatEGP(selectedCandidate.offer_amount)}</p>
                    </div>
                  )}
                  {/* Offer Status */}
                  {selectedCandidate.offer_status != null && (
                    <div className="p-3 rounded-xl bg-muted/30">
                      <p className="text-[10px] text-muted-foreground mb-1">{ar ? "حالة العرض" : "Offer Status"}</p>
                      <span className={`text-[11px] font-medium ${
                        selectedCandidate.offer_status === "accepted" ? "text-emerald-600"
                          : selectedCandidate.offer_status === "declined" ? "text-rose-600"
                          : "text-amber-600"
                      }`}>
                        {selectedCandidate.offer_status === "accepted" ? (ar ? "مقبول" : "Accepted")
                          : selectedCandidate.offer_status === "declined" ? (ar ? "مرفوض" : "Declined")
                          : (ar ? "قيد المراجعة" : "Pending")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Stage Selector */}
                <div>
                  <p className="text-[11px] text-muted-foreground mb-2">{ar ? "تغيير المرحلة" : "Change Stage"}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_STAGES.map(stage => (
                      <button
                        key={stage}
                        onClick={() => setModalStage(stage)}
                        className={`text-[9px] px-2.5 py-1 rounded-lg font-medium transition-all ${
                          modalStage === stage
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {ar ? STAGE_META[stage].ar : STAGE_META[stage].en}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <MessageSquare size={11} />
                    {ar ? "ملاحظات" : "Notes"}
                  </p>
                  <p className="text-[12px] text-foreground leading-relaxed bg-muted/20 p-3 rounded-xl">
                    {ar ? selectedCandidate.notes_ar : selectedCandidate.notes}
                  </p>
                </div>

                {/* Interview Dates */}
                {selectedCandidate.interview_dates.length > 0 && (
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1.5 flex items-center gap-1.5">
                      <Calendar size={11} />
                      {ar ? "تواريخ المقابلات" : "Interview Dates"}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCandidate.interview_dates.map((d, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 font-medium">
                          {fmtDate(d)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-border/40 flex gap-2 shrink-0">
                <button className="flex-1 h-10 rounded-xl bg-emerald-500 text-white text-[12px] font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={13} /> {ar ? "تقدم" : "Move Forward"}
                </button>
                <button className="h-10 px-4 rounded-xl border border-rose-200 text-rose-500 text-[12px] font-medium hover:bg-rose-50 transition-colors flex items-center justify-center gap-1.5">
                  <XCircle size={13} /> {ar ? "رفض" : "Reject"}
                </button>
                <button className="h-10 px-4 rounded-xl border border-border text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex items-center justify-center gap-1.5">
                  <Phone size={12} /> {ar ? "اتصال" : "Call"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
