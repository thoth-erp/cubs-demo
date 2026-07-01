/**
 * VisualStages — Visual manufacturing stage timeline with icons
 * مراحل التصنيع المرئية — أيقونات وشريط زمني ملون
 */

import {
  Scissors, Cpu, Layers, CircleDot, Box, Paintbrush,
  Armchair, Square, Wrench, ClipboardCheck, Package,
  Truck, Home, Clock, CheckCircle2, AlertTriangle, Pause,
} from "lucide-react";
import type { MfgStage, DependencyType } from "../lib/furniture-engine";

const DEPT_ICONS: Record<string, { icon: React.ElementType; bg: string; color: string }> = {
  cutting:      { icon: Scissors,       bg: "bg-blue-50",     color: "text-blue-600" },
  cnc:          { icon: Cpu,            bg: "bg-indigo-50",   color: "text-indigo-600" },
  edgebanding:  { icon: Layers,         bg: "bg-cyan-50",     color: "text-cyan-600" },
  drilling:     { icon: CircleDot,      bg: "bg-violet-50",   color: "text-violet-600" },
  assembly:     { icon: Box,            bg: "bg-amber-50",    color: "text-amber-600" },
  finishing:    { icon: Paintbrush,     bg: "bg-orange-50",   color: "text-orange-600" },
  upholstery:   { icon: Armchair,       bg: "bg-rose-50",     color: "text-rose-600" },
  glass:        { icon: Square,         bg: "bg-sky-50",      color: "text-sky-600" },
  metal:        { icon: Wrench,         bg: "bg-zinc-100",    color: "text-zinc-600" },
  qc:           { icon: ClipboardCheck, bg: "bg-emerald-50",  color: "text-emerald-600" },
  packing:      { icon: Package,        bg: "bg-teal-50",     color: "text-teal-600" },
  delivery:     { icon: Truck,          bg: "bg-blue-50",     color: "text-blue-600" },
  installation: { icon: Home,           bg: "bg-green-50",    color: "text-green-600" },
};

const DEP_LABELS: Record<DependencyType, { en: string; ar: string; color: string }> = {
  sequential: { en: "Sequential", ar: "متتابعة", color: "text-blue-600" },
  parallel:   { en: "Parallel",   ar: "متوازية", color: "text-emerald-600" },
  blocking:   { en: "Blocking",   ar: "حاجزة",   color: "text-rose-600" },
  optional:   { en: "Optional",   ar: "اختيارية", color: "text-muted-foreground" },
};

interface Props {
  stages: MfgStage[];
  ar?: boolean;
  currency?: string;
  currentStage?: string; // stage id currently active
  compact?: boolean;
}

export default function VisualStages({ stages, ar, currency = "EGP", currentStage, compact }: Props) {
  if (!stages.length) {
    return (
      <div className="py-8 text-center text-[12px] text-muted-foreground/50 border border-dashed border-border/40 rounded-xl">
        {ar ? "مفيش مراحل تصنيع" : "No manufacturing stages defined"}
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {stages.map((s, i) => {
          const dept = DEPT_ICONS[s.department] || DEPT_ICONS.assembly;
          const Icon = dept.icon;
          const isCurrent = s.id === currentStage;
          const isPast = currentStage ? stages.findIndex(st => st.id === currentStage) > i : false;
          return (
            <div key={s.id} className="flex items-center gap-1">
              {i > 0 && <div className={`w-3 h-px ${isPast ? "bg-emerald-400" : "bg-border/50"}`} />}
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isCurrent ? "ring-2 ring-primary ring-offset-1 " + dept.bg : isPast ? "bg-emerald-100" : dept.bg}`}
                title={ar ? (s.name_ar || s.name) : s.name}>
                {isPast ? <CheckCircle2 size={12} className="text-emerald-600" /> : <Icon size={12} className={isCurrent ? "text-primary" : dept.color} />}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {stages.map((s, i) => {
        const dept = DEPT_ICONS[s.department] || DEPT_ICONS.assembly;
        const Icon = dept.icon;
        const dep = DEP_LABELS[s.dependency_type];
        const isCurrent = s.id === currentStage;
        const isPast = currentStage ? stages.findIndex(st => st.id === currentStage) > i : false;
        const isLast = i === stages.length - 1;

        return (
          <div key={s.id} className="flex gap-3">
            {/* Timeline column */}
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${isCurrent ? "ring-2 ring-primary ring-offset-1 " + dept.bg : isPast ? "bg-emerald-100" : dept.bg}`}>
                {isPast ? <CheckCircle2 size={15} className="text-emerald-600" /> : <Icon size={15} className={isCurrent ? "text-primary" : dept.color} />}
              </div>
              {!isLast && (
                <div className={`w-px flex-1 my-1 ${isPast ? "bg-emerald-300" : "bg-border/40"}`} />
              )}
            </div>

            {/* Content */}
            <div className={`flex-1 min-w-0 ${isLast ? "pb-2" : "pb-3"}`}>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[13px] font-medium">{ar ? (s.name_ar || s.name) : s.name}</span>
                {isCurrent && <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">{ar ? "حالي" : "Current"}</span>}
                {isPast && <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium">{ar ? "تم" : "Done"}</span>}
              </div>
              <div className="flex items-center gap-3 text-[10.5px] text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1"><Clock size={9} />{s.duration_hours}h</span>
                {s.labor_cost > 0 && <span>{Math.round(s.labor_cost + s.machine_cost + s.overhead_cost).toLocaleString()} {currency}</span>}
                <span className={dep.color}>{ar ? dep.ar : dep.en}</span>
                {s.team && <span>{s.team}</span>}
                {s.machine && <span>{s.machine}</span>}
                {s.quality_checkpoint && <span className="text-[8.5px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">{ar ? "فحص جودة" : "QC"}</span>}
                {s.approval_required && <span className="text-[8.5px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">{ar ? "موافقة" : "Approval"}</span>}
                {s.blocks_next && <span className="text-[8.5px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-medium">{ar ? "حاجزة" : "Blocks"}</span>}
              </div>
              {s.checklist.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {s.checklist.slice(0, 4).map((c, ci) => (
                    <span key={ci} className="text-[9px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">{c}</span>
                  ))}
                  {s.checklist.length > 4 && <span className="text-[9px] text-muted-foreground/50">+{s.checklist.length - 4}</span>}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Stage Progress Bar ──────────────────────────────────

export function StageProgressBar({ stages, currentStageId, ar }: { stages: MfgStage[]; currentStageId?: string; ar?: boolean }) {
  const currentIdx = currentStageId ? stages.findIndex(s => s.id === currentStageId) : -1;
  const progress = currentIdx >= 0 ? Math.round(((currentIdx + 1) / stages.length) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
        <span>{progress}% {ar ? "مكتمل" : "complete"}</span>
        <span>{currentIdx >= 0 ? (ar ? (stages[currentIdx].name_ar || stages[currentIdx].name) : stages[currentIdx].name) : (ar ? "لم يبدأ" : "Not started")}</span>
      </div>
      <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
