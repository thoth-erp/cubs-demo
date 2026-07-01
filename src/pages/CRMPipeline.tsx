import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { CRM_LEADS, type CRMLead } from "../lib/crm-data";
import {
  GripVertical, DollarSign, Clock, User, Tag, ChevronRight,
  Plus, Filter, ArrowUpDown, Target, TrendingUp, Phone, Mail,
  MessageSquare, X, CheckCircle2,
} from "lucide-react";

function formatEGP(n: number) {
  return new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", minimumFractionDigits: 0 }).format(n);
}

const STAGES = [
  { id: "new", en: "New", ar: "جديد", color: "bg-blue-500", bgColor: "bg-blue-50/50" },
  { id: "qualified", en: "Qualified", ar: "مؤهل", color: "bg-violet-500", bgColor: "bg-violet-50/50" },
  { id: "meeting", en: "Meeting", ar: "اجتماع", color: "bg-amber-500", bgColor: "bg-amber-50/50" },
  { id: "quotation", en: "Quotation", ar: "عرض سعر", color: "bg-cyan-500", bgColor: "bg-cyan-50/50" },
  { id: "negotiation", en: "Negotiation", ar: "تفاوض", color: "bg-orange-500", bgColor: "bg-orange-50/50" },
  { id: "won", en: "Won", ar: "مكتسب", color: "bg-emerald-500", bgColor: "bg-emerald-50/50" },
  { id: "lost", en: "Lost", ar: "خاسر", color: "bg-rose-500", bgColor: "bg-rose-50/50" },
];

export default function CRMPipeline() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [leads, setLeads] = useState<CRMLead[]>(CRM_LEADS);
  const [draggedLead, setDraggedLead] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null);

  const stageData = useMemo(() => {
    return STAGES.map(stage => ({
      ...stage,
      leads: leads.filter(l => l.stage === stage.id),
      totalValue: leads.filter(l => l.stage === stage.id).reduce((s, l) => s + l.value, 0),
    }));
  }, [leads]);

  const totalPipeline = leads.filter(l => l.stage !== "won" && l.stage !== "lost").reduce((s, l) => s + l.value, 0);
  const wonValue = leads.filter(l => l.stage === "won").reduce((s, l) => s + l.value, 0);

  function handleDragStart(leadId: string) {
    setDraggedLead(leadId);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(e: React.DragEvent, targetStage: string) {
    e.preventDefault();
    if (draggedLead) {
      setLeads(prev => prev.map(l => l.id === draggedLead ? { ...l, stage: targetStage as CRMLead["stage"] } : l));
      setDraggedLead(null);
    }
  }

  return (
    <div className="min-h-full px-6 md:px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>
            {ar ? "دليل المبيعات" : "Sales Pipeline"}
          </h1>
          <div className="flex items-center gap-4 mt-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><Target size={11} /> {leads.filter(l => l.stage !== "won" && l.stage !== "lost").length} {ar ? "صفقة مفتوحة" : "open deals"}</span>
            <span className="flex items-center gap-1"><DollarSign size={11} /> {formatEGP(totalPipeline)} {ar ? "قيمة معلقة" : "pipeline"}</span>
            <span className="flex items-center gap-1 text-emerald-600"><TrendingUp size={11} /> {formatEGP(wonValue)} {ar ? "مكتسب" : "won"}</span>
          </div>
        </div>
        <button className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-[12px] font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity">
          <Plus size={13} /> {ar ? "lead جديد" : "New Lead"}
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
        {stageData.map(stage => (
          <div key={stage.id} className="w-[280px] shrink-0"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.id)}>
            {/* Stage Header */}
            <div className="flex items-center justify-between mb-2.5 px-1">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                <span className="text-[12px] font-semibold">{ar ? stage.ar : stage.en}</span>
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{stage.leads.length}</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">{formatEGP(stage.totalValue)}</span>
            </div>

            {/* Lead Cards */}
            <div className={`space-y-2 min-h-[200px] p-2 rounded-xl ${stage.bgColor} border border-transparent transition-colors ${draggedLead ? "border-dashed border-border/60" : ""}`}>
              {stage.leads.map(lead => (
                <motion.div key={lead.id} layout
                  draggable
                  onDragStart={() => handleDragStart(lead.id)}
                  onClick={() => setSelectedLead(lead)}
                  className="p-3.5 rounded-xl bg-background border border-border/40 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group"
                  whileHover={{ y: -2 }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <GripVertical size={12} className="text-muted-foreground/30 group-hover:text-muted-foreground/60 shrink-0" />
                      <span className="text-[12px] font-medium text-foreground">{lead.customer_name}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-foreground">{formatEGP(lead.value)}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-2 pl-5">{ar ? lead.title_ar : lead.title}</p>
                  <div className="flex items-center gap-1.5 flex-wrap mb-2 pl-5">
                    {lead.tags.map(tag => (
                      <span key={tag} className="text-[8px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{tag}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pl-5 pt-2 border-t border-border/30">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary">
                        {lead.assigned_to.charAt(0)}
                      </div>
                      <span className="text-[9px] text-muted-foreground">{lead.assigned_to}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-muted-foreground">{lead.probability}%</span>
                      <div className="w-8 h-1 rounded-full bg-muted/60 overflow-hidden">
                        <div className="h-full rounded-full bg-primary/60" style={{ width: `${lead.probability}%` }} />
                      </div>
                    </div>
                  </div>
                  {lead.next_followup && (
                    <div className="flex items-center gap-1 mt-2 pl-5">
                      <Clock size={9} className="text-muted-foreground/40" />
                      <span className="text-[9px] text-muted-foreground">{ar ? "متابعة" : "Follow-up"}: {lead.next_followup}</span>
                    </div>
                  )}
                </motion.div>
              ))}
              {stage.leads.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center mx-auto mb-2">
                    <Target size={16} className="text-muted-foreground/30" />
                  </div>
                  <p className="text-[10px] text-muted-foreground/50 mb-2">{ar ? "لا توجد صفقات" : "No deals yet"}</p>
                  <button className="text-[9px] text-primary hover:underline flex items-center gap-1 mx-auto">
                    <Plus size={10} /> {ar ? "إضافة lead" : "Add lead"}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ─── Lead Details Modal ─── */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedLead(null)} />
          <div className="relative w-full max-w-lg bg-background rounded-2xl border border-border shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
              <h3 className="text-[15px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>
                {ar ? selectedLead.title_ar : selectedLead.title}
              </h3>
              <button onClick={() => setSelectedLead(null)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"><X size={14} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Customer */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[11px] font-bold">
                  {selectedLead.customer_name.split(" ").map(w => w[0]).join("")}
                </div>
                <div>
                  <p className="text-[13px] font-medium">{selectedLead.customer_name}</p>
                  <p className="text-[11px] text-muted-foreground">{selectedLead.customer_name_ar}</p>
                </div>
              </div>

              {/* Value & Stage */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-muted/30">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{ar ? "القيمة" : "Value"}</p>
                  <p className="text-[18px] font-bold text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>{formatEGP(selectedLead.value)}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{ar ? "المرحلة" : "Stage"}</p>
                  <p className="text-[13px] font-medium capitalize">{ar ? STAGES.find(s => s.id === selectedLead.stage)?.ar : selectedLead.stage}</p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2.5">
                {[
                  { label: ar ? "المصادر" : "Source", value: selectedLead.source },
                  { label: ar ? "المسؤول" : "Assigned", value: selectedLead.assigned_to },
                  { label: ar ? "احتمال النجاح" : "Probability", value: `${selectedLead.probability}%` },
                  { label: ar ? "آخر نشاط" : "Last Activity", value: selectedLead.last_activity },
                  { label: ar ? "متابعة القادمة" : "Next Follow-up", value: selectedLead.next_followup || "—" },
                  { label: ar ? "تاريخ الإنشاء" : "Created", value: selectedLead.created_at },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
                    <span className="text-[11px] text-muted-foreground">{row.label}</span>
                    <span className="text-[11px] font-medium text-foreground">{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {selectedLead.tags.map(tag => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{tag}</span>
                ))}
              </div>

              {/* Probability Bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-muted-foreground">{ar ? "احتمال الإغلاق" : "Close Probability"}</span>
                  <span className="text-[11px] font-medium">{selectedLead.probability}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${selectedLead.probability}%` }} />
                </div>
              </div>

              {/* Expected Value */}
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-[10px] text-muted-foreground mb-1">{ar ? "القيمة المتوقعة" : "Expected Value"}</p>
                <p className="text-[16px] font-bold text-primary" style={{ fontFamily: "var(--app-font-serif)" }}>
                  {formatEGP(selectedLead.value * selectedLead.probability / 100)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button onClick={() => {
                  setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, stage: "won" } : l));
                  setSelectedLead(null);
                }} className="flex-1 h-10 rounded-xl bg-emerald-500 text-white text-[12px] font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={13} /> {ar ? "تم الفوز" : "Mark Won"}
                </button>
                <button onClick={() => {
                  setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, stage: "lost" } : l));
                  setSelectedLead(null);
                }} className="h-10 px-4 rounded-xl border border-rose-200 text-rose-500 text-[12px] font-medium hover:bg-rose-50 transition-colors">
                  {ar ? "خاسر" : "Lost"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
