/**
 * SectionGraphs — Reusable visual chart cards
 * رسوم بيانية قابلة لإعادة الاستخدام
 */

import { useLanguage } from "../context/LanguageContext";

// ─── Mini Bar Chart ──────────────────────────────────────

interface BarItem { label: string; value: number; color?: string }

export function MiniBarChart({ data, title, titleAr, height = 120 }: { data: BarItem[]; title: string; titleAr?: string; height?: number }) {
  const { lang } = useLanguage();
  const max = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="bg-background border border-border/40 rounded-xl p-4">
      <p className="text-[11px] font-medium text-muted-foreground mb-3">{lang === "ar" && titleAr ? titleAr : title}</p>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[9px] font-medium text-foreground/70">{d.value}</span>
            <div
              className="w-full rounded-t-md transition-all duration-500"
              style={{
                height: `${(d.value / max) * (height - 28)}px`,
                backgroundColor: d.color || "var(--color-primary, hsl(142 40% 50%))",
                minHeight: 2,
              }}
            />
            <span className="text-[8px] text-muted-foreground/60 truncate w-full text-center">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Progress Ring ───────────────────────────────────────

export function ProgressRing({ value, max = 100, label, labelAr, size = 80, color }: {
  value: number; max?: number; label: string; labelAr?: string; size?: number; color?: string;
}) {
  const { lang } = useLanguage();
  const pct = Math.min(value / max, 1);
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const clr = color || "var(--color-primary, hsl(142 40% 50%))";

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-border, #e5e5e5)" strokeWidth={6} opacity={0.3} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={clr} strokeWidth={6}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-700" />
      </svg>
      <div className="text-center -mt-[calc(50%+12px)] mb-4">
        <p className="text-[16px] font-bold" style={{ color: clr }}>{Math.round(pct * 100)}%</p>
      </div>
      <p className="text-[10px] text-muted-foreground text-center">{lang === "ar" && labelAr ? labelAr : label}</p>
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────

export function StatCard({ value, label, labelAr, icon: Icon, trend, color }: {
  value: string | number; label: string; labelAr?: string;
  icon?: React.ElementType; trend?: number; color?: string;
}) {
  const { lang } = useLanguage();
  return (
    <div className="bg-background border border-border/40 rounded-xl p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[20px] font-bold" style={{ color: color || "inherit", fontFamily: "var(--app-font-serif)" }}>{value}</p>
          <p className="text-[11px] text-muted-foreground mt-1">{lang === "ar" && labelAr ? labelAr : label}</p>
        </div>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
            <Icon size={14} className="text-muted-foreground" />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <p className={`text-[10px] mt-2 font-medium ${trend >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}% {lang === "ar" ? "من الشهر الماضي" : "vs last month"}
        </p>
      )}
    </div>
  );
}

// ─── Horizontal Stacked Bar ─────────────────────────────

export function StackedBar({ segments, title, titleAr }: {
  segments: { label: string; value: number; color: string }[];
  title: string; titleAr?: string;
}) {
  const { lang } = useLanguage();
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;

  return (
    <div className="bg-background border border-border/40 rounded-xl p-4">
      <p className="text-[11px] font-medium text-muted-foreground mb-3">{lang === "ar" && titleAr ? titleAr : title}</p>
      <div className="flex rounded-full h-3 overflow-hidden gap-0.5">
        {segments.map((seg, i) => (
          <div key={i} style={{ width: `${(seg.value / total) * 100}%`, backgroundColor: seg.color }} className="transition-all duration-500 first:rounded-s-full last:rounded-e-full" />
        ))}
      </div>
      <div className="flex flex-wrap gap-3 mt-3">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-[10px] text-muted-foreground">{seg.label}: {seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Timeline / Flow Steps ──────────────────────────────

export function FlowTimeline({ steps, title, titleAr }: {
  steps: { label: string; status: "done" | "active" | "pending"; time?: string }[];
  title: string; titleAr?: string;
}) {
  const { lang } = useLanguage();
  return (
    <div className="bg-background border border-border/40 rounded-xl p-4">
      <p className="text-[11px] font-medium text-muted-foreground mb-3">{lang === "ar" && titleAr ? titleAr : title}</p>
      <div className="space-y-0">
        {steps.map((s, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${
                s.status === "done" ? "bg-emerald-500 border-emerald-500" :
                s.status === "active" ? "bg-primary border-primary animate-pulse" :
                "bg-background border-border"
              }`} />
              {i < steps.length - 1 && <div className={`w-0.5 h-6 ${s.status === "done" ? "bg-emerald-300" : "bg-border/40"}`} />}
            </div>
            <div className="-mt-0.5">
              <p className={`text-[11px] font-medium ${s.status === "pending" ? "text-muted-foreground/50" : "text-foreground"}`}>{s.label}</p>
              {s.time && <p className="text-[9px] text-muted-foreground/40">{s.time}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
