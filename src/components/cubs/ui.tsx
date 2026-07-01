/**
 * Shared CUBS UI atoms — tokens, page header, modal, small helpers.
 * Keeps the Raw Materials / Products / Procurement pages visually consistent.
 */
import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export const inputCls = "w-full h-10 rounded-xl border border-border/60 bg-background px-3.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/25 transition placeholder:text-muted-foreground/50";
export const inputErrorCls = "w-full h-10 rounded-xl border-2 border-red-400 bg-red-50/30 px-3.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-red-300/40 transition placeholder:text-muted-foreground/50";
export const selectCls = inputCls + " appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";
export const selectErrorCls = inputErrorCls + " appearance-none cursor-pointer";
export const labelCls = "text-[11px] font-medium text-muted-foreground mb-1.5 block";
export const btnPrimary = "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-foreground text-background text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed";
export const btnSecondary = "inline-flex items-center justify-center gap-1.5 rounded-xl border border-border/60 text-[12px] font-medium px-3.5 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors";
export const btnGhost = "inline-flex items-center justify-center gap-1.5 rounded-lg text-[12px] font-medium px-2.5 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors";
export const cardCls = "rounded-2xl border border-border/60 bg-card";
export const chipCls = "inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-[11px] font-medium";

export function money(n: number, lang: "en" | "ar" = "en") {
  const v = (n || 0).toLocaleString(lang === "ar" ? "ar-EG" : "en-US", { maximumFractionDigits: 2 });
  return lang === "ar" ? `${v} ج.م` : `EGP ${v}`;
}

export function PageHeader({ title, titleAr, subtitle, subtitleAr, actions, icon }: {
  title: string; titleAr: string; subtitle?: string; subtitleAr?: string; actions?: ReactNode; icon?: ReactNode;
}) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
      <div className="flex items-start gap-3 min-w-0">
        {icon && <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">{icon}</div>}
        <div className="min-w-0">
          <h1 className="text-[20px] font-semibold text-foreground leading-tight" style={{ fontFamily: "var(--app-font-serif)" }}>
            {ar ? titleAr : title}
          </h1>
          {(subtitle || subtitleAr) && (
            <p className="text-[13px] text-muted-foreground mt-0.5">{ar ? subtitleAr : subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, titleAr, children, footer, wide }: {
  open: boolean; onClose: () => void; title: string; titleAr: string; children: ReactNode; footer?: ReactNode; wide?: boolean;
}) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:p-6 overflow-y-auto" dir={ar ? "rtl" : "ltr"}>
      <div className="fixed inset-0 bg-foreground/25 backdrop-blur-[3px]" onClick={onClose} />
      <div className={`relative z-10 w-full ${wide ? "max-w-4xl" : "max-w-2xl"} my-4 rounded-2xl border border-border/60 bg-card shadow-xl`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 sticky top-0 bg-card rounded-t-2xl z-10">
          <h2 className="text-[15px] font-semibold text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>{ar ? titleAr : title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border/50 sticky bottom-0 bg-card rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, titleAr, hint, hintAr, action }: {
  icon: ReactNode; title: string; titleAr: string; hint?: string; hintAr?: string; action?: ReactNode;
}) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-4">{icon}</div>
      <p className="text-[14px] font-medium text-foreground">{ar ? titleAr : title}</p>
      {(hint || hintAr) && <p className="text-[12.5px] text-muted-foreground mt-1 max-w-[340px]">{ar ? hintAr : hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function FieldError({ message, ar }: { message?: string; ar: boolean }) {
  if (!message) return null;
  return (
    <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
      <span className="inline-block w-1 h-1 rounded-full bg-red-400 shrink-0" />
      {message}
    </p>
  );
}
