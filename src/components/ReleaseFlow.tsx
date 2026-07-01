/**
 * Release Flow — Visual approval workflow
 * مسار الاعتماد — عرض مرئي لخطوات الموافقة
 */

import { useState } from "react";
import {
  type ReleaseStep, type ReleaseAction, type ReleaseStatus,
  RELEASE_STATUS_LABELS, getReleaseBlockers, isFullyReleased, ROLES,
} from "../lib/access-control";
import { CheckCircle2, AlertCircle, Clock, X, Shield, MessageSquare } from "lucide-react";

interface Props {
  steps: ReleaseStep[];
  history: ReleaseAction[];
  status: ReleaseStatus;
  ar?: boolean;
  currentUserRole?: string;
  onApprove?: (step: ReleaseStep, note?: string) => void;
  onReject?: (step: ReleaseStep, note?: string) => void;
}

export default function ReleaseFlow({ steps, history, status, ar, currentUserRole, onApprove, onReject }: Props) {
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const blockers = getReleaseBlockers(steps, history);
  const released = isFullyReleased(steps, history);
  const statusLabel = RELEASE_STATUS_LABELS[status];

  return (
    <div className="border border-border/40 rounded-xl overflow-hidden">
      {/* Header */}
      <div className={`px-5 py-3 flex items-center justify-between ${released ? "bg-emerald-50 border-b border-emerald-200" : "bg-amber-50/50 border-b border-amber-200/50"}`}>
        <div className="flex items-center gap-2">
          {released ? <CheckCircle2 size={14} className="text-emerald-600" /> : <Clock size={14} className="text-amber-600" />}
          <span className={`text-[13px] font-medium ${released ? "text-emerald-700" : "text-amber-700"}`}>
            {released ? (ar ? "تم الاعتماد ✓" : "Fully Released ✓") : (ar ? "مسار الاعتماد" : "Release Flow")}
          </span>
        </div>
        <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${statusLabel.color}`}>
          {ar ? statusLabel.ar : statusLabel.en}
        </span>
      </div>

      {/* Steps */}
      <div className="px-5 py-4 space-y-3">
        {blockers.map(({ step, met }) => {
          const roleDef = ROLES.find(r => r.value === step.role);
          const canAct = currentUserRole === step.role || currentUserRole === "owner" || currentUserRole === "admin" || currentUserRole === "manager";
          const historyEntry = history.find(h => h.role === step.role && h.action === "approved");

          return (
            <div key={step.key} className="flex items-center gap-3">
              {/* Icon */}
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${met ? "bg-emerald-100" : "bg-muted/50"}`}>
                {met ? <CheckCircle2 size={13} className="text-emerald-600" /> : <AlertCircle size={13} className="text-muted-foreground" />}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[12px] font-medium ${met ? "text-emerald-700" : "text-foreground"}`}>
                    {ar ? step.ar : step.en}
                  </span>
                  {roleDef && <span className={`text-[9px] px-1.5 py-0.5 rounded ${roleDef.color}`}>{ar ? roleDef.ar : roleDef.en}</span>}
                  {!step.required && <span className="text-[9px] text-muted-foreground">{ar ? "(اختياري)" : "(optional)"}</span>}
                </div>
                {met && historyEntry && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {historyEntry.user_name} · {new Date(historyEntry.timestamp).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              {!met && canAct && onApprove && (
                <div className="flex items-center gap-1.5">
                  {noteFor === step.key ? (
                    <div className="flex items-center gap-1">
                      <input value={note} onChange={e => setNote(e.target.value)} placeholder={ar ? "ملاحظة..." : "Note..."} className="h-7 px-2 text-[11px] rounded border border-border/60 w-24" />
                      <button onClick={() => { onApprove(step, note); setNoteFor(null); setNote(""); }} className="h-7 px-2 rounded bg-emerald-600 text-white text-[10px]">{ar ? "اعتمد" : "OK"}</button>
                      <button onClick={() => setNoteFor(null)} className="h-7 px-1.5 rounded hover:bg-muted"><X size={10} /></button>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => setNoteFor(step.key)} className="h-7 px-2.5 rounded-lg bg-emerald-600 text-white text-[10px] font-medium hover:bg-emerald-700">
                        {ar ? "اعتمد" : "Approve"}
                      </button>
                      {onReject && (
                        <button onClick={() => onReject(step)} className="h-7 px-2.5 rounded-lg border border-rose-200 text-rose-600 text-[10px] font-medium hover:bg-rose-50">
                          {ar ? "ارفض" : "Reject"}
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary footer */}
      <div className="px-5 py-2.5 bg-muted/20 border-t border-border/30 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {blockers.filter(b => b.met).length}/{steps.length} {ar ? "خطوات مكتملة" : "steps complete"}
        </span>
        {!released && (
          <span className="text-[10px] text-amber-600 font-medium">
            {ar ? `واقف بسبب: ${blockers.filter(b => !b.met && b.step.required).map(b => ar ? b.step.ar : b.step.en).slice(0, 2).join("، ")}` :
              `Blocked: ${blockers.filter(b => !b.met && b.step.required).map(b => b.step.en).slice(0, 2).join(", ")}`}
          </span>
        )}
      </div>
    </div>
  );
}
