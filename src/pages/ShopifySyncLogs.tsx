/**
 * Shopify Sync Logs — Event log viewer for Shopify webhook events
 * سجل مزامنة شوبيفاي — عارض أحداث الويب هوك
 */

import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { supabase, isDemoMode } from "../lib/supabase";
import {
  loadShopifySyncLogs,
  SYNC_EVENT_META, SYNC_STATUS_META,
  type ShopifySyncLogDemo, type SyncEventType, type SyncEventStatus,
} from "../data/loyalty";
import {
  Search, Filter, Activity, RefreshCw, Clock,
  ShoppingCart, RotateCcw, UserPlus, UserCheck, Star,
  Wifi, ArrowUpDown, ChevronDown, ChevronRight,
  CheckCircle2, XCircle, AlertTriangle, Loader2,
  X, Webhook,
} from "lucide-react";

const EVENT_ICONS: Record<string, React.ElementType> = {
  ShoppingCart, RefreshCw, RotateCcw, UserPlus, UserCheck, Star, Wifi, ArrowUpDown, Webhook,
};

// ─── Detail Panel ─────────────────────────────────────────

function LogDetail({ log, ar, onClose }: { log: ShopifySyncLogDemo; ar: boolean; onClose: () => void }) {
  const evt = SYNC_EVENT_META[log.eventType];
  const sts = SYNC_STATUS_META[log.status];
  const Icon = EVENT_ICONS[evt.icon] || Activity;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-background border border-border/40 rounded-2xl shadow-2xl w-full max-w-[520px]" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              log.status === "success" ? "bg-emerald-50" : log.status === "failed" ? "bg-rose-50" : "bg-muted"
            }`}>
              <Icon size={14} className={log.status === "success" ? "text-emerald-600" : log.status === "failed" ? "text-rose-500" : "text-muted-foreground"} />
            </div>
            <div>
              <p className="text-[14px] font-medium" style={{ fontFamily: "var(--app-font-serif)" }}>{ar ? evt.ar : evt.en}</p>
              <p className="text-[10px] text-muted-foreground">{log.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted"><X size={16} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${sts.dot}`} />
            <span className={`text-[12px] font-medium px-2.5 py-0.5 rounded-full ${sts.pill}`}>{ar ? sts.ar : sts.en}</span>
            <span className="text-[11px] text-muted-foreground ms-auto">
              {new Date(log.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          </div>

          {/* Details */}
          <div className="bg-muted/20 rounded-xl p-4">
            <p className="text-[11px] font-medium text-muted-foreground mb-1">{ar ? "التفاصيل" : "Details"}</p>
            <p className="text-[12px] text-foreground leading-relaxed">{log.details}</p>
          </div>

          {/* Error */}
          {log.errorMessage && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <XCircle size={12} className="text-rose-500" />
                <p className="text-[11px] font-medium text-rose-700">{ar ? "رسالة الخطأ" : "Error Message"}</p>
              </div>
              <p className="text-[12px] text-rose-600 font-mono">{log.errorMessage}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3">
            {log.shopifyOrderId && (
              <div className="bg-background border border-border/40 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground mb-0.5">{ar ? "رقم الطلب" : "Order ID"}</p>
                <p className="text-[12px] font-medium font-mono">{log.shopifyOrderId}</p>
              </div>
            )}
            {log.shopifyCustomerId && (
              <div className="bg-background border border-border/40 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground mb-0.5">{ar ? "معرف العميل" : "Customer ID"}</p>
                <p className="text-[11px] font-medium font-mono truncate">{log.shopifyCustomerId.replace("gid://shopify/Customer/", "")}</p>
              </div>
            )}
            {log.memberName && (
              <div className="bg-background border border-border/40 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground mb-0.5">{ar ? "العضو" : "Member"}</p>
                <p className="text-[12px] font-medium">{log.memberName}</p>
              </div>
            )}
            {log.pointsDelta !== undefined && (
              <div className="bg-background border border-border/40 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground mb-0.5">{ar ? "النقاط" : "Points"}</p>
                <p className={`text-[12px] font-medium tabular-nums ${log.pointsDelta > 0 ? "text-emerald-600" : "text-rose-500"}`}>
                  {log.pointsDelta > 0 ? "+" : ""}{log.pointsDelta.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════

export default function ShopifySyncLogsPage() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const { workspace } = useAuth();

  const [logs, setLogs] = useState<ShopifySyncLogDemo[]>(() => isDemoMode ? loadShopifySyncLogs() : []);
  const [search, setSearch] = useState("");

  // Live mode: read the real shopify_sync_log written by webhooks & syncs
  useEffect(() => {
    if (isDemoMode || !supabase || !workspace) return;
    supabase
      .from("shopify_sync_log")
      .select("id, event_type, status, shopify_order_id, shopify_customer_id, member_name, points_delta, details, error_message, created_at")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        const rows = (data ?? []) as unknown as Record<string, unknown>[];
        setLogs(rows.map((r) => ({
          id: r.id as string,
          eventType: (SYNC_EVENT_META[r.event_type as SyncEventType] ? r.event_type : "webhook_received") as SyncEventType,
          status: (["success", "failed", "skipped", "pending"].includes(r.status as string) ? r.status : "pending") as SyncEventStatus,
          shopifyOrderId: (r.shopify_order_id as string) ?? undefined,
          shopifyCustomerId: (r.shopify_customer_id as string) ?? undefined,
          memberName: (r.member_name as string) ?? undefined,
          pointsDelta: (r.points_delta as number) ?? undefined,
          details: (r.details as string) ?? "",
          errorMessage: (r.error_message as string) ?? undefined,
          createdAt: r.created_at as string,
        })));
      });
  }, [workspace]);
  const [filterEvent, setFilterEvent] = useState<SyncEventType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<SyncEventStatus | "all">("all");
  const [selectedLog, setSelectedLog] = useState<ShopifySyncLogDemo | null>(null);

  const filtered = logs.filter(l => {
    if (filterEvent !== "all" && l.eventType !== filterEvent) return false;
    if (filterStatus !== "all" && l.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return l.details.toLowerCase().includes(q) ||
        (l.memberName || "").toLowerCase().includes(q) ||
        (l.shopifyOrderId || "").toLowerCase().includes(q);
    }
    return true;
  });

  const successCount = logs.filter(l => l.status === "success").length;
  const failedCount = logs.filter(l => l.status === "failed").length;
  const totalPoints = logs.reduce((s, l) => s + (l.pointsDelta && l.pointsDelta > 0 ? l.pointsDelta : 0), 0);

  return (
    <div className="min-h-full py-8 px-7 md:px-10 max-w-[960px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[11px] text-muted-foreground/60 tracking-[0.08em] uppercase mb-2">{ar ? "شوبيفاي" : "Shopify"}</p>
          <h1 className="text-[26px] font-medium text-foreground leading-tight" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.025em" }}>
            {ar ? "سجل المزامنة" : "Sync Logs"}
          </h1>
        </div>
        <button className="h-9 px-4 rounded-xl border border-border/60 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-2 transition-colors">
          <RefreshCw size={13} />{ar ? "تحديث" : "Refresh"}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { icon: Activity, value: String(logs.length), label: ar ? "إجمالي الأحداث" : "Total Events", color: "text-foreground" },
          { icon: CheckCircle2, value: String(successCount), label: ar ? "ناجح" : "Successful", color: "text-emerald-600" },
          { icon: XCircle, value: String(failedCount), label: ar ? "فشل" : "Failed", color: "text-rose-500" },
          { icon: Star, value: totalPoints.toLocaleString(), label: ar ? "نقاط مكتسبة" : "Points Awarded", color: "text-primary" },
        ].map((c, i) => (
          <div key={i} className="border border-border/40 rounded-xl p-4 bg-background">
            <c.icon size={14} className={`${c.color} mb-2`} />
            <p className={`text-[20px] font-medium tabular-nums ${c.color}`} style={{ fontFamily: "var(--app-font-serif)" }}>{c.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={ar ? "بحث..." : "Search logs..."}
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-border/60 bg-card text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        <select value={filterEvent} onChange={e => setFilterEvent(e.target.value as SyncEventType | "all")}
          className="h-9 px-3 rounded-xl border border-border/60 bg-card text-[12px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
          <option value="all">{ar ? "كل الأحداث" : "All Events"}</option>
          {(Object.keys(SYNC_EVENT_META) as SyncEventType[]).map(t => (
            <option key={t} value={t}>{ar ? SYNC_EVENT_META[t].ar : SYNC_EVENT_META[t].en}</option>
          ))}
        </select>

        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as SyncEventStatus | "all")}
          className="h-9 px-3 rounded-xl border border-border/60 bg-card text-[12px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
          <option value="all">{ar ? "كل الحالات" : "All Status"}</option>
          {(Object.keys(SYNC_STATUS_META) as SyncEventStatus[]).map(s => (
            <option key={s} value={s}>{ar ? SYNC_STATUS_META[s].ar : SYNC_STATUS_META[s].en}</option>
          ))}
        </select>

        <span className="text-[11px] text-muted-foreground ms-auto">{filtered.length} {ar ? "حدث" : "events"}</span>
      </div>

      {/* Log Timeline */}
      <div className="border border-border/40 rounded-xl overflow-hidden bg-background">
        {filtered.length === 0 ? (
          <div className="py-14 text-center">
            <Activity size={22} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-[13px] text-muted-foreground">{ar ? "لا توجد أحداث مطابقة" : "No events match your filters"}</p>
          </div>
        ) : (
          <div className="divide-y divide-border/25">
            {filtered.map(log => {
              const evt = SYNC_EVENT_META[log.eventType];
              const sts = SYNC_STATUS_META[log.status];
              const Icon = EVENT_ICONS[evt.icon] || Activity;

              return (
                <button key={log.id} onClick={() => setSelectedLog(log)}
                  className="w-full flex items-center gap-3.5 px-5 py-3.5 hover:bg-muted/15 transition-colors text-start group">
                  {/* Status dot + icon */}
                  <div className="relative shrink-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      log.status === "success" ? "bg-emerald-50" :
                      log.status === "failed" ? "bg-rose-50" :
                      log.status === "skipped" ? "bg-amber-50" : "bg-blue-50"
                    }`}>
                      <Icon size={14} className={
                        log.status === "success" ? "text-emerald-600" :
                        log.status === "failed" ? "text-rose-500" :
                        log.status === "skipped" ? "text-amber-600" : "text-blue-500"
                      } />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${sts.pill}`}>{ar ? sts.ar : sts.en}</span>
                      <span className="text-[12px] font-medium text-foreground">{ar ? evt.ar : evt.en}</span>
                      {log.shopifyOrderId && <code className="text-[10px] font-mono text-muted-foreground">{log.shopifyOrderId}</code>}
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">{log.details}</p>
                  </div>

                  {/* Points delta */}
                  {log.pointsDelta !== undefined && (
                    <span className={`text-[12px] font-medium tabular-nums shrink-0 ${log.pointsDelta > 0 ? "text-emerald-600" : "text-rose-500"}`}>
                      {log.pointsDelta > 0 ? "+" : ""}{log.pointsDelta.toLocaleString()} {ar ? "نقطة" : "pts"}
                    </span>
                  )}

                  {/* Timestamp */}
                  <span className="text-[10px] text-muted-foreground tabular-nums shrink-0 w-[80px] text-end">
                    {new Date(log.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    <br />
                    <span className="text-muted-foreground/50">
                      {new Date(log.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </span>

                  <ChevronRight size={12} className="text-muted-foreground/30 group-hover:text-primary/50 shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selectedLog && <LogDetail log={selectedLog} ar={ar} onClose={() => setSelectedLog(null)} />}
    </div>
  );
}
