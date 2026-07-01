/**
 * ProductionFlowMap — Visual production stage flow with arrows, status, and blockers
 * خريطة سير الإنتاج — مراحل التصنيع مع الأسهم والحالة والعوائق
 *
 * Reusable in: product profile, sales order, production planning
 */

import { motion } from "framer-motion";
import {
  Scissors, Cpu, Layers, Box, Paintbrush, Clock, ClipboardCheck, Package, Truck, Wrench,
  Home, CheckCircle2, AlertTriangle, Pause, Play, Lock, ArrowRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────

export interface FlowStage {
  id: string;
  name: string;
  nameAr?: string;
  status: "completed" | "active" | "pending" | "blocked" | "paused";
  duration?: string;         // e.g. "2 days"
  durationAr?: string;
  parallel?: boolean;        // runs in parallel with next
  blockerReason?: string;
  blockerReasonAr?: string;
  progress?: number;         // 0-100 for active stage
}

// ─── Stage icon & color mapping ───────────────────────────

const STAGE_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  cutting:      { icon: Scissors,       color: "#3B82F6", bg: "bg-blue-50" },
  cnc:          { icon: Cpu,            color: "#6366F1", bg: "bg-indigo-50" },
  edgebanding:  { icon: Layers,         color: "#06B6D4", bg: "bg-cyan-50" },
  assembly:     { icon: Box,            color: "#F59E0B", bg: "bg-amber-50" },
  painting:     { icon: Paintbrush,     color: "#F97316", bg: "bg-orange-50" },
  drying:       { icon: Clock,          color: "#8B5CF6", bg: "bg-violet-50" },
  qc:           { icon: ClipboardCheck, color: "#10B981", bg: "bg-emerald-50" },
  packaging:    { icon: Package,        color: "#14B8A6", bg: "bg-teal-50" },
  delivery:     { icon: Truck,          color: "#2563EB", bg: "bg-blue-50" },
  installation: { icon: Wrench,         color: "#059669", bg: "bg-green-50" },
  design:       { icon: Home,           color: "#EC4899", bg: "bg-pink-50" },
};

const STATUS_STYLES: Record<FlowStage["status"], { ring: string; badge: string; badgeText: string; icon: React.ElementType }> = {
  completed: { ring: "ring-emerald-500", badge: "bg-emerald-100 text-emerald-700", badgeText: "Done", icon: CheckCircle2 },
  active:    { ring: "ring-primary",     badge: "bg-primary/15 text-primary",       badgeText: "Active", icon: Play },
  pending:   { ring: "ring-border/40",   badge: "bg-muted text-muted-foreground",   badgeText: "Pending", icon: Clock },
  blocked:   { ring: "ring-rose-500",    badge: "bg-rose-100 text-rose-700",        badgeText: "Blocked", icon: Lock },
  paused:    { ring: "ring-amber-500",   badge: "bg-amber-100 text-amber-700",      badgeText: "Paused", icon: Pause },
};

// ─── Component ────────────────────────────────────────────

interface Props {
  stages: FlowStage[];
  ar?: boolean;
  compact?: boolean;
  className?: string;
}

export default function ProductionFlowMap({ stages, ar = false, compact = false, className = "" }: Props) {
  if (stages.length === 0) return null;

  return (
    <div className={`${className}`}>
      {compact ? (
        // ── Compact horizontal strip ──
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
          {stages.map((stage, i) => {
            const meta = STAGE_META[stage.id] || { icon: Box, color: "#64748B", bg: "bg-slate-50" };
            const Icon = meta.icon;
            const statusStyle = STATUS_STYLES[stage.status];
            const StatusIcon = statusStyle.icon;

            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="flex items-center gap-1.5 shrink-0"
              >
                <div className={`relative w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center ring-2 ${statusStyle.ring}`}>
                  <Icon size={14} style={{ color: meta.color }} />
                  {stage.status === "completed" && (
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center">
                      <CheckCircle2 size={8} className="text-white" />
                    </div>
                  )}
                  {stage.status === "blocked" && (
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 flex items-center justify-center">
                      <AlertTriangle size={8} className="text-white" />
                    </div>
                  )}
                </div>
                {i < stages.length - 1 && (
                  <div className={`w-4 h-px ${stage.status === "completed" ? "bg-emerald-400" : "bg-border/40"}`} />
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        // ── Full card view ──
        <div className="space-y-3">
          {stages.map((stage, i) => {
            const meta = STAGE_META[stage.id] || { icon: Box, color: "#64748B", bg: "bg-slate-50" };
            const Icon = meta.icon;
            const statusStyle = STATUS_STYLES[stage.status];
            const StatusIcon = statusStyle.icon;

            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className={`flex items-center gap-4 p-3 rounded-xl border ${
                  stage.status === "active" ? "border-primary/40 bg-primary/5" :
                  stage.status === "blocked" ? "border-rose-200 bg-rose-50/50" :
                  stage.status === "completed" ? "border-emerald-200/50 bg-emerald-50/30" :
                  "border-border/30"
                }`}>
                  {/* Stage number + icon */}
                  <div className="flex items-center gap-3">
                    <div className={`relative w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center ring-2 ${statusStyle.ring}`}>
                      <Icon size={18} style={{ color: meta.color }} />
                      {stage.status === "active" && stage.progress !== undefined && (
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 40 40">
                          <circle cx="20" cy="20" r="18" fill="none" stroke="hsl(var(--primary)/0.2)" strokeWidth="2" />
                          <circle cx="20" cy="20" r="18" fill="none" stroke="hsl(var(--primary))" strokeWidth="2"
                            strokeDasharray={`${stage.progress * 1.13} 113`} strokeLinecap="round" transform="rotate(-90 20 20)"
                          />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-semibold">{ar ? (stage.nameAr || stage.name) : stage.name}</span>
                      {stage.parallel && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600 font-medium">
                          {ar ? "متوازي" : "Parallel"}
                        </span>
                      )}
                    </div>
                    {stage.duration && (
                      <span className="text-[10px] text-muted-foreground">{ar ? stage.durationAr || stage.duration : stage.duration}</span>
                    )}
                    {stage.status === "blocked" && stage.blockerReason && (
                      <p className="text-[10px] text-rose-600 mt-0.5 flex items-center gap-1">
                        <AlertTriangle size={9} />
                        {ar ? stage.blockerReasonAr || stage.blockerReason : stage.blockerReason}
                      </p>
                    )}
                  </div>

                  {/* Status badge */}
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium ${statusStyle.badge}`}>
                    <StatusIcon size={10} />
                    {stage.status === "active" && stage.progress !== undefined
                      ? `${stage.progress}%`
                      : ar
                        ? stage.status === "completed" ? "تم" : stage.status === "active" ? "شغّال" : stage.status === "blocked" ? "محجوز" : stage.status === "paused" ? "متوقف" : "منتظر"
                        : statusStyle.badgeText
                    }
                  </div>
                </div>

                {/* Arrow connector */}
                {i < stages.length - 1 && (
                  <div className="flex justify-center py-1">
                    <motion.div
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ delay: i * 0.06 + 0.1 }}
                      className={`w-px h-4 ${stage.status === "completed" ? "bg-emerald-400" : "bg-border/40"}`}
                    />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Helper: convert stage IDs to FlowStage array (for demo use) ──

export function stageIdsToFlow(ids: string[], currentIdx: number = -1): FlowStage[] {
  const STAGE_NAMES: Record<string, { en: string; ar: string }> = {
    cutting: { en: "Cutting", ar: "تقطيع" },
    cnc: { en: "CNC", ar: "CNC" },
    edgebanding: { en: "Edge Banding", ar: "حواف" },
    assembly: { en: "Assembly", ar: "تجميع" },
    painting: { en: "Painting", ar: "دهان" },
    drying: { en: "Drying", ar: "تجفيف" },
    qc: { en: "QC", ar: "فحص الجودة" },
    packaging: { en: "Packaging", ar: "تغليف" },
    delivery: { en: "Delivery", ar: "توصيل" },
    installation: { en: "Installation", ar: "تركيب" },
  };

  return ids.map((id, i) => ({
    id,
    name: STAGE_NAMES[id]?.en || id,
    nameAr: STAGE_NAMES[id]?.ar || id,
    status: i < currentIdx ? "completed" : i === currentIdx ? "active" : "pending",
    progress: i === currentIdx ? 45 : undefined,
  }));
}
