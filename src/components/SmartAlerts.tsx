/**
 * SmartAlerts — Clean premium alert cards
 * تنبيهات ذكية — كروت تنبيه مميزة
 */

import { AlertTriangle, AlertCircle, Info, CheckCircle2, X } from "lucide-react";
import type { EngineWarning } from "../lib/furniture-engine";

const TYPE_STYLES = {
  error:   { icon: AlertCircle,   bg: "bg-rose-50 border-rose-200",    text: "text-rose-700",   iconColor: "text-rose-500" },
  warning: { icon: AlertTriangle, bg: "bg-amber-50 border-amber-200",  text: "text-amber-700",  iconColor: "text-amber-500" },
  info:    { icon: Info,          bg: "bg-blue-50 border-blue-200",     text: "text-blue-700",   iconColor: "text-blue-500" },
  success: { icon: CheckCircle2,  bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", iconColor: "text-emerald-500" },
};

interface AlertItem {
  type: "error" | "warning" | "info" | "success";
  message: string;
  detail?: string;
  action?: { label: string; onClick: () => void };
}

// ─── Single Alert Card ───────────────────────────────────

export function AlertCard({ alert, onDismiss }: { alert: AlertItem; onDismiss?: () => void }) {
  const style = TYPE_STYLES[alert.type];
  const Icon = style.icon;

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${style.bg} ${style.text}`}>
      <Icon size={14} className={`mt-0.5 shrink-0 ${style.iconColor}`} />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium">{alert.message}</p>
        {alert.detail && <p className="text-[11px] opacity-80 mt-0.5">{alert.detail}</p>}
        {alert.action && (
          <button onClick={alert.action.onClick} className="text-[11px] font-medium underline mt-1 hover:opacity-70">{alert.action.label}</button>
        )}
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="shrink-0 opacity-40 hover:opacity-70"><X size={12} /></button>
      )}
    </div>
  );
}

// ─── Alert List from EngineWarnings ──────────────────────

export function WarningList({ warnings, ar }: { warnings: EngineWarning[]; ar?: boolean }) {
  if (!warnings.length) return null;
  return (
    <div className="space-y-2">
      {warnings.map((w, i) => (
        <AlertCard key={i} alert={{ type: w.type, message: ar ? w.ar : w.en }} />
      ))}
    </div>
  );
}

// ─── Workflow Blocker ────────────────────────────────────

export interface WorkflowBlocker {
  key: string;
  met: boolean;
  en: string;
  ar: string;
}

export function WorkflowBlockerCard({ blockers, ar, title }: {
  blockers: WorkflowBlocker[];
  ar?: boolean;
  title?: string;
}) {
  const unmet = blockers.filter(b => !b.met);
  const allMet = unmet.length === 0;

  return (
    <div className={`rounded-xl border p-4 ${allMet ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
      <div className="flex items-center gap-2 mb-3">
        {allMet ? <CheckCircle2 size={14} className="text-emerald-600" /> : <AlertTriangle size={14} className="text-amber-600" />}
        <span className={`text-[13px] font-medium ${allMet ? "text-emerald-700" : "text-amber-700"}`}>
          {title || (allMet ? (ar ? "جاهز للتشغيل ✓" : "Ready for Production ✓") : (ar ? "مش جاهز للتشغيل" : "Not Ready for Production"))}
        </span>
        <span className="text-[10px] ml-auto tabular-nums opacity-60">{blockers.filter(b => b.met).length}/{blockers.length}</span>
      </div>
      <div className="space-y-1.5">
        {blockers.map(b => (
          <div key={b.key} className={`flex items-center gap-2 text-[11.5px] ${b.met ? "text-emerald-600" : "text-amber-700"}`}>
            {b.met ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
            <span>{ar ? b.ar : b.en}</span>
          </div>
        ))}
      </div>
      {!allMet && unmet.length > 0 && (
        <div className="mt-3 pt-2 border-t border-amber-200/50">
          <p className="text-[10.5px] text-amber-600 font-medium">
            {ar ? `واقف بسبب: ${unmet.map(b => b.ar).join("، ")}` : `Blocked: ${unmet.map(b => b.en).join(", ")}`}
          </p>
        </div>
      )}
    </div>
  );
}
