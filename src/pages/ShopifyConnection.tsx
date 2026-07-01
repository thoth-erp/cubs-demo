/**
 * Shopify Integration Hub — Non-technical setup wizard + per-entity sync directions
 * تكامل شوبيفاي — معالج إعداد سهل + اتجاهات مزامنة لكل نوع بيانات
 *
 * 3-step wizard: store credentials (with plain-language guide) →
 * data exchange directions (off / import / export / two-way per entity) →
 * review, conflict policy & connect.
 *
 * Demo mode: persists to localStorage, simulated syncs.
 * Live mode: shopify-sync Edge Function (connect / save_sync_config / pull_* / push_* / run_full_sync).
 */

import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { supabase, isDemoMode } from "../lib/supabase";
import { useLocation } from "wouter";
import {
  Wifi, WifiOff, Shield, ExternalLink,
  Check, RefreshCw, Loader2, AlertTriangle,
  Zap, Clock, CheckCircle2, XCircle, Globe, Key,
  Settings, Activity, Package, Boxes, ShoppingCart,
  Users, Gift, BarChart3, ArrowRight, ArrowLeft,
  ArrowLeftRight, Ban, ChevronLeft, ChevronRight, Sparkles,
  HelpCircle, Store,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";
type SyncDirection = "off" | "import" | "export" | "both";
type EntityKey = "products" | "inventory" | "orders" | "customers" | "loyalty" | "analytics";

interface SyncConfig {
  entities: Record<EntityKey, SyncDirection>;
  conflict_policy: "latest" | "shopify" | "thoth";
  auto_sync: boolean;
  sync_interval_minutes: number;
}

const DEFAULT_CONFIG: SyncConfig = {
  entities: { products: "import", inventory: "off", orders: "import", customers: "import", loyalty: "export", analytics: "import" },
  conflict_policy: "latest",
  auto_sync: true,
  sync_interval_minutes: 30,
};

const PRESETS: { key: string; en: string; ar: string; icon: React.ElementType; entities: Record<EntityKey, SyncDirection> }[] = [
  {
    key: "recommended", en: "Recommended", ar: "الموصى به", icon: Sparkles,
    entities: { products: "both", inventory: "export", orders: "import", customers: "import", loyalty: "export", analytics: "import" },
  },
  {
    key: "readonly", en: "Read-only (safe start)", ar: "قراءة فقط (بداية آمنة)", icon: Shield,
    entities: { products: "import", inventory: "import", orders: "import", customers: "import", loyalty: "off", analytics: "import" },
  },
  {
    key: "full", en: "Everything two-way", ar: "كله باتجاهين", icon: ArrowLeftRight,
    entities: { products: "both", inventory: "both", orders: "import", customers: "both", loyalty: "export", analytics: "import" },
  },
];

interface EntityDef {
  key: EntityKey;
  icon: React.ElementType;
  en: string; ar: string;
  descEn: string; descAr: string;
  canImport: boolean; canExport: boolean;
  importEn: string; importAr: string;   // what import means, in plain words
  exportEn: string; exportAr: string;   // what export means
  noteEn?: string; noteAr?: string;
}

const ENTITIES: EntityDef[] = [
  {
    key: "products", icon: Package, en: "Products & Variants", ar: "المنتجات",
    descEn: "Catalog, prices, images, SKUs", descAr: "الكتالوج والأسعار والصور وأكواد SKU",
    canImport: true, canExport: true,
    importEn: "Bring your Shopify catalog into THOTH", importAr: "استيراد كتالوج شوبيفاي إلى ثوث",
    exportEn: "Publish THOTH products to your store", exportAr: "نشر منتجات ثوث في متجرك",
  },
  {
    key: "inventory", icon: Boxes, en: "Inventory Levels", ar: "مستويات المخزون",
    descEn: "Stock quantities, matched by SKU", descAr: "الكميات — تتطابق بكود SKU",
    canImport: true, canExport: true,
    importEn: "Shopify stock counts update THOTH inventory", importAr: "مخزون شوبيفاي يحدّث مخزون ثوث",
    exportEn: "THOTH stock counts update your store", exportAr: "مخزون ثوث يحدّث متجرك",
  },
  {
    key: "orders", icon: ShoppingCart, en: "Orders & Refunds", ar: "الطلبات والمرتجعات",
    descEn: "Live via webhooks + history backfill", descAr: "مباشر عبر الويب هوك + استيراد القديم",
    canImport: true, canExport: false,
    importEn: "Every store order lands in THOTH instantly", importAr: "كل طلب في المتجر يوصل لثوث فورًا",
    exportEn: "", exportAr: "",
    noteEn: "Orders are placed by customers in Shopify, so they only flow in. Loyalty points are awarded automatically.",
    noteAr: "الطلبات بيعملها العملاء في شوبيفاي، فبتدخل في اتجاه واحد. نقاط الولاء بتتحسب تلقائيًا.",
  },
  {
    key: "customers", icon: Users, en: "Customers", ar: "العملاء",
    descEn: "Profiles, emails, purchase history", descAr: "الملفات والإيميلات وسجل الشراء",
    canImport: true, canExport: true,
    importEn: "Store customers become THOTH contacts", importAr: "عملاء المتجر يبقوا جهات اتصال في ثوث",
    exportEn: "THOTH writes loyalty data to their profiles", exportAr: "ثوث يكتب بيانات الولاء في ملفاتهم",
  },
  {
    key: "loyalty", icon: Gift, en: "Loyalty Program", ar: "برنامج الولاء",
    descEn: "Points, tiers, discount codes", descAr: "النقاط والمستويات وأكواد الخصم",
    canImport: false, canExport: true,
    importEn: "", importAr: "",
    exportEn: "Points & tiers appear on Shopify customer profiles; redemptions create discount codes", exportAr: "النقاط والمستويات تظهر في شوبيفاي، والاستبدالات تنشئ أكواد خصم",
    noteEn: "THOTH owns the loyalty math — it can only flow out.", noteAr: "ثوث هو مصدر حسابات الولاء — بتطلع في اتجاه واحد بس.",
  },
  {
    key: "analytics", icon: BarChart3, en: "Sales Analytics", ar: "تحليلات المبيعات",
    descEn: "Revenue, AOV, top products, channels", descAr: "الإيرادات ومتوسط الطلب وأفضل المنتجات",
    canImport: true, canExport: false,
    importEn: "Store performance feeds THOTH dashboards", importAr: "أداء المتجر يغذي لوحات ثوث",
    exportEn: "", exportAr: "",
    noteEn: "Computed from imported orders — read-only by nature.", noteAr: "محسوبة من الطلبات المستوردة — قراءة فقط بطبيعتها.",
  },
];

const REQUIRED_SCOPES = [
  "read_products", "write_products", "read_inventory", "write_inventory",
  "read_locations", "read_orders", "read_customers", "write_customers",
  "write_price_rules", "write_discounts",
];

const LS_KEY = "thoth_shopify_integration";

/** Accepts my-store.myshopify.com, https://..., or the admin URL
 *  (admin.shopify.com/store/my-store) and returns the API host. */
function normalizeStoreUrl(input: string): string {
  const s = input.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const adminMatch = s.match(/^admin\.shopify\.com\/store\/([^/?#]+)/);
  if (adminMatch) return `${adminMatch[1]}.myshopify.com`;
  return s.split(/[/?#]/)[0];
}

// ─── Small UI helpers ────────────────────────────────────

const cardCls = "border border-border/40 rounded-xl bg-background";

function DirectionPill({ dir, ar }: { dir: SyncDirection; ar: boolean }) {
  const map = {
    off: { icon: Ban, en: "Off", ar: "موقوف", cls: "bg-muted text-muted-foreground" },
    import: { icon: ArrowLeft, en: "Shopify → THOTH", ar: "شوبيفاي ← ثوث", cls: "bg-blue-50 text-blue-600" },
    export: { icon: ArrowRight, en: "THOTH → Shopify", ar: "ثوث ← شوبيفاي", cls: "bg-violet-50 text-violet-600" },
    both: { icon: ArrowLeftRight, en: "Two-way", ar: "اتجاهين", cls: "bg-emerald-50 text-emerald-700" },
  } as const;
  const m = map[dir];
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10.5px] font-medium px-2.5 py-1 rounded-full ${m.cls}`}>
      <Icon size={10} /> {ar ? m.ar : m.en}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════

export default function ShopifyConnectionPage() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const { workspace } = useAuth();
  const [, navigate] = useLocation();

  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [storeUrl, setStoreUrl] = useState("");
  const [authMode, setAuthMode] = useState<"dashboard" | "legacy">("dashboard");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [config, setConfig] = useState<SyncConfig>(DEFAULT_CONFIG);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const [step, setStep] = useState(1);           // wizard step (1-3) when disconnected
  const [editingFlows, setEditingFlows] = useState(false); // re-open direction editor when connected
  const [showGuide, setShowGuide] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);   // 'connect' | entity key | 'all' | 'test'
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 2600); }

  // ── Load existing connection ──
  useEffect(() => {
    if (isDemoMode || !supabase || !workspace) {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        try {
          const s = JSON.parse(saved);
          setStatus(s.status ?? "disconnected");
          setStoreUrl(s.storeUrl ?? "");
          setConfig(s.config ?? DEFAULT_CONFIG);
          setLastSync(s.lastSync ?? null);
        } catch { /* corrupted local state — start fresh */ }
      }
      return;
    }
    supabase
      .from("shopify_connections")
      .select("store_url, is_connected, last_sync_at, sync_config")
      .eq("workspace_id", workspace.id)
      .maybeSingle()
      .then(({ data }) => {
        // shopify_connections isn't in the generated DB types yet
        const row = data as { store_url: string; is_connected: boolean; last_sync_at: string | null; sync_config: SyncConfig | null } | null;
        if (row) {
          setStatus(row.is_connected ? "connected" : "error");
          setStoreUrl(row.store_url);
          if (row.sync_config) setConfig(row.sync_config);
          setLastSync(row.last_sync_at);
        }
      });
  }, [workspace]);

  function persistDemo(next: { status?: ConnectionStatus; storeUrl?: string; config?: SyncConfig; lastSync?: string | null }) {
    const current = { status, storeUrl, config, lastSync, ...next };
    localStorage.setItem(LS_KEY, JSON.stringify(current));
  }

  // ── Actions ──
  async function invokeSync(body: Record<string, unknown>): Promise<{ ok: boolean; error?: string;[k: string]: unknown }> {
    if (!supabase || !workspace) return { ok: false, error: "Not signed in" };
    const { data, error: fnError } = await supabase.functions.invoke("shopify-sync", {
      body: { workspace_id: workspace.id, ...body },
    });
    if (fnError) return { ok: false, error: fnError.message };
    return data as { ok: boolean; error?: string };
  }

  async function handleConnect() {
    setBusy("connect"); setError(null);
    if (isDemoMode) {
      await new Promise((r) => setTimeout(r, 1400));
      const now = new Date().toISOString();
      setStatus("connected"); setLastSync(now);
      persistDemo({ status: "connected", lastSync: now });
      showToast(ar ? "تم الاتصال بنجاح" : "Connected successfully");
      setBusy(null);
      return;
    }
    const result = await invokeSync({
      action: "connect", store_url: storeUrl, sync_config: config,
      ...(authMode === "dashboard"
        ? { client_id: clientId, client_secret: clientSecret }
        : { access_token: accessToken }),
    });
    if (result.ok) {
      setStatus("connected"); setLastSync(new Date().toISOString()); setAccessToken(""); setClientSecret("");
      showToast(ar ? "تم الاتصال بنجاح" : "Connected successfully");
    } else {
      setError(result.error ?? (ar ? "فشل الاتصال" : "Connection failed"));
      setStatus("error");
    }
    setBusy(null);
  }

  async function handleSaveFlows() {
    setBusy("save");
    if (isDemoMode) {
      await new Promise((r) => setTimeout(r, 600));
      persistDemo({ config });
      showToast(ar ? "تم حفظ اتجاهات المزامنة" : "Sync directions saved");
    } else {
      const result = await invokeSync({ action: "save_sync_config", sync_config: config });
      showToast(result.ok ? (ar ? "تم حفظ اتجاهات المزامنة" : "Sync directions saved") : (result.error ?? "Failed"));
    }
    setEditingFlows(false);
    setBusy(null);
  }

  async function handleSyncEntity(key: EntityKey | "all") {
    setBusy(key);
    if (isDemoMode) {
      await new Promise((r) => setTimeout(r, 1600));
      const now = new Date().toISOString();
      setLastSync(now); persistDemo({ lastSync: now });
      const fake = { products: 24, inventory: 18, orders: 156, customers: 89, loyalty: 89, analytics: 156 };
      showToast(key === "all"
        ? (ar ? "اكتملت المزامنة الكاملة" : "Full sync completed")
        : (ar ? `تمت مزامنة ${fake[key]} سجل` : `Synced ${fake[key]} records`));
      setBusy(null);
      return;
    }
    const since = new Date(Date.now() - 30_000).toISOString(); // small back-off for clock skew
    let result; let expected = 1;
    if (key === "all") {
      result = await invokeSync({ action: "run_full_sync" });
    } else {
      const dir = config.entities[key];
      const actions: string[] = [];
      if (dir === "import" || dir === "both") actions.push(`pull_${key === "analytics" ? "orders" : key}`);
      if ((dir === "export" || dir === "both") && (key === "products" || key === "inventory")) actions.push(`push_${key}`);
      expected = Math.max(actions.length, 1);
      for (let i = 0; i < actions.length; i++) {
        result = await invokeSync({ action: actions[i] });
        if (!result?.ok) break;
        // Serialize directions: running pull and push concurrently
        // trips Shopify's 2 req/sec limit and the push gets rejected.
        if ((result as { started?: boolean }).started && i < actions.length - 1) {
          await pollSyncRuns(since, i + 1);
        }
      }
    }
    if (!result?.ok) {
      showToast(typeof result?.error === "string" ? result.error : (ar ? "فشلت المزامنة" : "Sync failed"));
      setBusy(null);
      return;
    }
    if ((result as { started?: boolean }).started) {
      // Long syncs run in the background on the server — follow progress via sync runs
      showToast(ar ? "بدأت المزامنة — شغالة في الخلفية..." : "Sync started — running in the background…");
      const runs = await pollSyncRuns(since, expected);
      if (!runs) {
        showToast(ar ? "المزامنة لسه شغالة — تابع النتيجة في سجل المزامنة" : "Still running — check Sync Logs for the result");
      } else {
        const failed = runs.find((r) => r.status === "failed");
        const pulled = runs.reduce((s, r) => s + (r.records_pulled || 0), 0);
        const pushed = runs.reduce((s, r) => s + (r.records_pushed || 0), 0);
        if (failed) showToast(failed.error_message || (ar ? "فشلت المزامنة" : "Sync failed"));
        else showToast(ar ? `تمت المزامنة — ${pulled} وارد، ${pushed} صادر` : `Synced — ${pulled} pulled, ${pushed} pushed`);
      }
    } else {
      showToast(ar ? "تمت المزامنة" : "Sync completed");
    }
    setLastSync(new Date().toISOString());
    setBusy(null);
  }

  interface SyncRun { entity_type: string; status: string; records_pulled: number; records_pushed: number; error_message: string | null; started_at: string }

  /** Poll shopify_sync_runs until all runs started after `sinceIso` finish.
   *  Two consecutive quiet polls required — a full sync starts runs back-to-back. */
  async function pollSyncRuns(sinceIso: string, minRuns: number): Promise<SyncRun[] | null> {
    if (!supabase || !workspace) return null;
    let quietPolls = 0;
    for (let i = 0; i < 80; i++) { // up to ~4 minutes
      await new Promise((r) => setTimeout(r, 3000));
      const { data } = await supabase
        .from("shopify_sync_runs")
        .select("entity_type, status, records_pulled, records_pushed, error_message, started_at")
        .eq("workspace_id", workspace.id)
        .gte("started_at", sinceIso)
        .order("started_at", { ascending: true });
      const runs = (data ?? []) as unknown as SyncRun[];
      if (runs.length >= minRuns && runs.every((r) => r.status !== "running")) {
        quietPolls++;
        if (quietPolls >= 2) return runs;
      } else {
        quietPolls = 0;
      }
    }
    return null;
  }

  function handleDisconnect() {
    setStatus("disconnected"); setStoreUrl(""); setAccessToken(""); setStep(1);
    if (isDemoMode) persistDemo({ status: "disconnected", storeUrl: "" });
    showToast(ar ? "تم قطع الاتصال" : "Disconnected");
  }

  function setEntityDir(key: EntityKey, dir: SyncDirection) {
    setConfig((c) => ({ ...c, entities: { ...c.entities, [key]: dir } }));
  }

  const isConnected = status === "connected";
  const anyTwoWay = Object.values(config.entities).includes("both");
  const activeFlows = ENTITIES.filter((e) => config.entities[e.key] !== "off");

  // ─── Direction selector (the core "which way?" control) ───
  function DirectionSelector({ ent }: { ent: EntityDef }) {
    const current = config.entities[ent.key];
    const options: { dir: SyncDirection; icon: React.ElementType; en: string; ar: string; enabled: boolean }[] = [
      { dir: "off", icon: Ban, en: "Off", ar: "موقوف", enabled: true },
      { dir: "import", icon: ArrowLeft, en: "Import", ar: "استيراد", enabled: ent.canImport },
      { dir: "export", icon: ArrowRight, en: "Export", ar: "تصدير", enabled: ent.canExport },
      { dir: "both", icon: ArrowLeftRight, en: "Two-way", ar: "اتجاهين", enabled: ent.canImport && ent.canExport },
    ];
    return (
      <div className="flex rounded-xl border border-border/60 overflow-hidden">
        {options.map((o) => {
          const Icon = o.icon;
          const active = current === o.dir;
          return (
            <button key={o.dir} disabled={!o.enabled}
              onClick={() => setEntityDir(ent.key, o.dir)}
              title={!o.enabled ? (ar ? "غير متاح لهذا النوع" : "Not available for this data type") : undefined}
              className={`flex-1 flex items-center justify-center gap-1 px-1.5 py-2 text-[10px] font-medium whitespace-nowrap transition-colors ${
                active ? "bg-foreground text-background" :
                o.enabled ? "text-muted-foreground hover:bg-muted/50" : "text-muted-foreground/30 cursor-not-allowed"
              }`}>
              <Icon size={10} /> {ar ? o.ar : o.en}
            </button>
          );
        })}
      </div>
    );
  }

  // ─── Step 2 content (also reused as flow editor when connected) ───
  function FlowMatrix() {
    return (
      <div className="space-y-4">
        {/* Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-muted-foreground">{ar ? "إعدادات جاهزة:" : "Quick presets:"}</span>
          {PRESETS.map((p) => (
            <button key={p.key} onClick={() => setConfig((c) => ({ ...c, entities: { ...p.entities } }))}
              className="flex items-center gap-1.5 h-7 px-3 rounded-full border border-border/60 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
              <p.icon size={11} /> {ar ? p.ar : p.en}
            </button>
          ))}
        </div>

        {/* Entity cards */}
        <div className="space-y-2.5">
          {ENTITIES.map((ent) => {
            const dir = config.entities[ent.key];
            const Icon = ent.icon;
            return (
              <div key={ent.key} className={`${cardCls} p-4 ${dir !== "off" ? "" : "opacity-70"}`}>
                <div className="flex items-start gap-3.5 flex-wrap md:flex-nowrap">
                  <div className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                    <Icon size={15} className="text-foreground/70" />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-[13px] font-medium" style={{ fontFamily: "var(--app-font-serif)" }}>{ar ? ent.ar : ent.en}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{ar ? ent.descAr : ent.descEn}</p>
                    {/* Plain-language explanation of what the chosen direction does */}
                    {dir !== "off" && (
                      <div className="mt-2 space-y-1">
                        {(dir === "import" || dir === "both") && ent.importEn && (
                          <p className="text-[10.5px] text-blue-600 flex items-center gap-1.5"><ArrowLeft size={9} className="shrink-0" />{ar ? ent.importAr : ent.importEn}</p>
                        )}
                        {(dir === "export" || dir === "both") && ent.exportEn && (
                          <p className="text-[10.5px] text-violet-600 flex items-center gap-1.5"><ArrowRight size={9} className="shrink-0" />{ar ? ent.exportAr : ent.exportEn}</p>
                        )}
                      </div>
                    )}
                    {ent.noteEn && (
                      <p className="text-[10px] text-muted-foreground/70 mt-1.5 flex items-start gap-1"><HelpCircle size={9} className="shrink-0 mt-0.5" />{ar ? ent.noteAr : ent.noteEn}</p>
                    )}
                  </div>
                  <div className="w-full md:w-[300px] shrink-0">
                    <DirectionSelector ent={ent} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  return (
    <div className="min-h-full py-8 px-7 md:px-10 max-w-[900px] mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-xl bg-foreground text-background text-[13px] font-medium shadow-lg flex items-center gap-2">
          <Check size={14} />{toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <p className="text-[11px] text-muted-foreground/60 tracking-[0.08em] uppercase mb-2">{ar ? "التكاملات" : "Integrations"}</p>
        <h1 className="text-[26px] font-medium text-foreground leading-tight" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.025em" }}>
          {ar ? "تكامل شوبيفاي" : "Shopify Integration"}
        </h1>
        <p className="text-[12px] text-muted-foreground mt-1">
          {ar ? "اربط متجرك واختار إيه اللي يتبادل بين ثوث وشوبيفاي — وفي أي اتجاه" : "Connect your store and choose exactly what flows between THOTH and Shopify — and in which direction"}
        </p>
      </div>

      {/* ─── Status card ─────────────────────────────────── */}
      <div className={`border rounded-2xl overflow-hidden mb-6 ${
        isConnected ? "border-emerald-200 bg-gradient-to-br from-emerald-50/40 to-background" :
        status === "error" ? "border-rose-200 bg-gradient-to-br from-rose-50/40 to-background" :
        "border-border/40 bg-background"
      }`}>
        <div className="p-6">
          <div className="flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              isConnected ? "bg-emerald-100" : status === "error" ? "bg-rose-100" : "bg-muted"
            }`}>
              {isConnected ? <Wifi size={24} className="text-emerald-600" /> :
               status === "error" ? <AlertTriangle size={24} className="text-rose-500" /> :
               <WifiOff size={24} className="text-muted-foreground" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2.5 mb-1">
                <h2 className="text-[18px] font-medium text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>
                  {isConnected ? (ar ? "متصل بشوبيفاي" : "Connected to Shopify") :
                   status === "error" ? (ar ? "خطأ في الاتصال" : "Connection Error") :
                   (ar ? "غير متصل" : "Not Connected")}
                </h2>
                <div className={`w-2.5 h-2.5 rounded-full ${
                  isConnected ? "bg-emerald-500 animate-pulse" :
                  status === "error" ? "bg-rose-500" : "bg-muted-foreground/30"
                }`} />
              </div>
              {isConnected ? (
                <div className="flex items-center gap-4 text-[12px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Globe size={11} />{storeUrl}</span>
                  {lastSync && <span className="flex items-center gap-1"><Clock size={11} />{ar ? "آخر مزامنة:" : "Last sync:"} {new Date(lastSync).toLocaleString(ar ? "ar" : "en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>}
                </div>
              ) : (
                <p className="text-[12px] text-muted-foreground">{ar ? "اتبع الخطوات تحت — الإعداد ياخد ٥ دقايق ومش محتاج خبرة تقنية" : "Follow the steps below — setup takes 5 minutes, no technical skills needed"}</p>
              )}
            </div>
            {isConnected && (
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => handleSyncEntity("all")} disabled={!!busy}
                  className="h-8 px-3 rounded-lg bg-foreground text-background text-[11px] font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-50">
                  {busy === "all" ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                  {ar ? "زامن الكل" : "Sync All"}
                </button>
                <button onClick={handleDisconnect}
                  className="h-8 px-3 rounded-lg border border-rose-200 text-[11px] font-medium text-rose-500 hover:bg-rose-50 flex items-center gap-1.5 transition-colors">
                  <XCircle size={12} />{ar ? "قطع" : "Disconnect"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ WIZARD (disconnected) ═══════════════════════════ */}
      {!isConnected && (
        <>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {[
              { n: 1, en: "Your store", ar: "متجرك" },
              { n: 2, en: "What syncs & which way", ar: "إيه يتزامن وفي أي اتجاه" },
              { n: 3, en: "Review & connect", ar: "راجع واتصل" },
            ].map((s, i) => (
              <div key={s.n} className="flex items-center gap-2">
                {i > 0 && <div className={`w-8 h-px ${step > i ? "bg-foreground" : "bg-border"}`} />}
                <button onClick={() => step > s.n && setStep(s.n)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${
                    step === s.n ? "bg-foreground text-background" :
                    step > s.n ? "bg-emerald-50 text-emerald-700 cursor-pointer" : "bg-muted/50 text-muted-foreground"
                  }`}>
                  {step > s.n ? <Check size={11} /> : <span className="w-4 h-4 rounded-full bg-background/20 flex items-center justify-center text-[9px]">{s.n}</span>}
                  {ar ? s.ar : s.en}
                </button>
              </div>
            ))}
          </div>

          {/* ── Step 1: store credentials ── */}
          {step === 1 && (
            <div className={cardCls + " mb-6"}>
              <div className="px-5 py-4 border-b border-border/30 flex items-center gap-2">
                <Store size={14} className="text-muted-foreground" />
                <h3 className="text-[14px] font-medium" style={{ fontFamily: "var(--app-font-serif)" }}>{ar ? "بيانات المتجر" : "Your Store Details"}</h3>
              </div>
              <div className="px-5 py-5 space-y-4">
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">
                    <Globe size={11} className="inline mr-1" />{ar ? "رابط المتجر" : "Store URL"}
                  </label>
                  <input type="text" value={storeUrl} onChange={(e) => setStoreUrl(e.target.value)} placeholder="my-store.myshopify.com"
                    className="w-full h-10 px-3.5 rounded-xl border border-border/80 bg-card text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  <p className="text-[10px] text-muted-foreground mt-1">{ar ? "هو نفس الرابط اللي بتدخل منه على لوحة تحكم شوبيفاي" : "The same address you use to open your Shopify admin"}</p>
                </div>
                {/* Auth method */}
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">
                    <Key size={11} className="inline mr-1" />{ar ? "طريقة الربط" : "Connection Method"}
                  </label>
                  <div className="flex rounded-xl border border-border/60 overflow-hidden mb-3">
                    {([
                      { v: "dashboard" as const, en: "Dev Dashboard app (current)", ar: "تطبيق Dev Dashboard (الحالي)" },
                      { v: "legacy" as const, en: "Legacy access token (shpat_)", ar: "رمز وصول قديم (shpat_)" },
                    ]).map((o) => (
                      <button key={o.v} type="button" onClick={() => setAuthMode(o.v)}
                        className={`flex-1 px-3 py-2 text-[11px] font-medium transition-colors ${authMode === o.v ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted/50"}`}>
                        {ar ? o.ar : o.en}
                      </button>
                    ))}
                  </div>
                  {authMode === "dashboard" ? (
                    <div className="space-y-3">
                      <div>
                        <input type="text" value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder={ar ? "Client ID — معرف العميل" : "Client ID"}
                          className="w-full h-10 px-3.5 rounded-xl border border-border/80 bg-card text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono" />
                      </div>
                      <div>
                        <input type="password" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} placeholder={ar ? "Secret — الرمز السري (shpss_...)" : "Secret (shpss_...)"}
                          className="w-full h-10 px-3.5 rounded-xl border border-border/80 bg-card text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono" />
                      </div>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Shield size={9} />{ar ? "ثوث يبدّلهم تلقائيًا برمز وصول مؤقت ويجدده كل ٢٤ ساعة — في الخادم فقط" : "THOTH exchanges these for a temporary access token and auto-renews it every 24h — server-side only"}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <input type="password" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} placeholder="shpat_xxxxxxxxxxxxx"
                        className="w-full h-10 px-3.5 rounded-xl border border-border/80 bg-card text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono" />
                      <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                        <Shield size={9} />{ar ? "للتطبيقات المخصصة القديمة اللي لسه شغالة — يُخزن مشفرًا في الخادم فقط" : "For older custom apps that still work — stored encrypted server-side only"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Non-tech guide */}
                <button onClick={() => setShowGuide(!showGuide)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-blue-50/50 border border-blue-200/40 text-start hover:bg-blue-50 transition-colors">
                  <span className="flex items-center gap-2 text-[12px] font-medium text-blue-700">
                    <HelpCircle size={13} />{authMode === "dashboard"
                      ? (ar ? "منين أجيب Client ID والـ Secret؟ (دليل خطوة بخطوة)" : "Where do I find my Client ID & Secret? (step-by-step guide)")
                      : (ar ? "منين أجيب رمز الوصول؟ (دليل خطوة بخطوة)" : "Where do I find my access token? (step-by-step guide)")}
                  </span>
                  <ChevronRight size={13} className={`text-blue-500 transition-transform ${showGuide ? "rotate-90" : ""}`} />
                </button>
                {showGuide && (
                  <div className="px-4 py-4 rounded-xl bg-muted/20 border border-border/30 space-y-2.5">
                    {(authMode === "dashboard" ? (ar ? [
                      "افتح dev.shopify.com وسجّل دخول بنفس إيميل متجرك",
                      "من قسم Apps اضغط «Create app» → «Start from Dev Dashboard» وسمّيه THOTH",
                      "في تبويب Versions ضيف صلاحيات Admin API الموجودة تحت، وانشر النسخة (Release)",
                      "من صفحة Home اضغط «Install app» واختار متجرك",
                      "روح Settings → Credentials → انسخ الـ Client ID والـ Secret (shpss_) هنا",
                    ] : [
                      "Open dev.shopify.com and sign in with your store's email",
                      "In Apps, click “Create app” → “Start from Dev Dashboard” and name it THOTH",
                      "In the Versions tab, add the Admin API permissions listed below, then release the version",
                      "From the app's Home page, click “Install app” and pick your store",
                      "Go to Settings → Credentials → copy the Client ID and Secret (shpss_) here",
                    ]) : (ar ? [
                      "ده للتطبيقات المخصصة القديمة اللي اتعملت قبل تحديث شوبيفاي",
                      "لو عندك تطبيق قديم: افتح إعداداته → API credentials → انسخ رمز Admin API (shpat_)",
                      "لو بتبدأ من جديد، استخدم طريقة «Dev Dashboard» — هي الطريقة الحالية المعتمدة من شوبيفاي",
                    ] : [
                      "This is for older custom apps created before Shopify's Dev Dashboard update",
                      "If you have an existing app: open its settings → API credentials → copy the Admin API token (shpat_)",
                      "Starting fresh? Use the “Dev Dashboard app” method instead — it's Shopify's current approach",
                    ])).map((s, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-foreground text-background text-[10px] font-semibold flex items-center justify-center shrink-0">{i + 1}</span>
                        <p className="text-[11.5px] text-foreground/80 leading-relaxed">{s}</p>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-border/30">
                      <p className="text-[10.5px] font-medium text-muted-foreground mb-1.5">{ar ? "صلاحيات Admin API المطلوبة:" : "Admin API permissions THOTH needs:"}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {REQUIRED_SCOPES.map((s) => <code key={s} className="text-[9.5px] font-mono px-2 py-0.5 rounded-md bg-background border border-border/40">{s}</code>)}
                      </div>
                    </div>
                    <a href="https://shopify.dev/docs/apps/build/authentication/access-tokens/generate-app-access-tokens-admin" target="_blank" rel="noopener noreferrer"
                      className="text-[11px] text-primary hover:underline inline-flex items-center gap-1">
                      {ar ? "الدليل الرسمي من شوبيفاي" : "Official Shopify guide"}<ExternalLink size={9} />
                    </a>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button onClick={() => { setStoreUrl(normalizeStoreUrl(storeUrl)); setStep(2); }}
                    disabled={!storeUrl.trim() || (!isDemoMode && (authMode === "dashboard" ? (!clientId.trim() || !clientSecret.trim()) : !accessToken.trim()))}
                    className="h-10 px-6 rounded-xl bg-foreground text-background text-[13px] font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40">
                    {ar ? "التالي: اختار البيانات" : "Next: Choose Data"} <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: directions ── */}
          {step === 2 && (
            <div className="mb-6">
              <div className="mb-4 px-1">
                <h3 className="text-[15px] font-medium mb-1" style={{ fontFamily: "var(--app-font-serif)" }}>
                  {ar ? "إيه اللي يتبادل — وفي أي اتجاه؟" : "What should sync — and which way?"}
                </h3>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  {ar
                    ? "لكل نوع بيانات، اختار: استيراد (شوبيفاي ← ثوث)، تصدير (ثوث ← شوبيفاي)، اتجاهين، أو موقوف. تقدر تغير ده في أي وقت."
                    : "For each data type, choose: Import (Shopify → THOTH), Export (THOTH → Shopify), Two-way, or Off. You can change this anytime."}
                </p>
              </div>
              <FlowMatrix />
              <div className="flex justify-between pt-5">
                <button onClick={() => setStep(1)} className="h-10 px-5 rounded-xl border border-border/60 text-[13px] font-medium hover:bg-muted/50 transition-colors flex items-center gap-2">
                  <ChevronLeft size={14} /> {ar ? "رجوع" : "Back"}
                </button>
                <button onClick={() => setStep(3)} className="h-10 px-6 rounded-xl bg-foreground text-background text-[13px] font-medium flex items-center gap-2 hover:opacity-90 transition-opacity">
                  {ar ? "التالي: راجع" : "Next: Review"} <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: review & connect ── */}
          {step === 3 && (
            <div className="mb-6 space-y-5">
              {/* Flow summary */}
              <div className={cardCls}>
                <div className="px-5 py-4 border-b border-border/30">
                  <h3 className="text-[14px] font-medium" style={{ fontFamily: "var(--app-font-serif)" }}>{ar ? "ملخص تدفق البيانات" : "Data Flow Summary"}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{storeUrl} ⇄ THOTH</p>
                </div>
                <div className="divide-y divide-border/25">
                  {ENTITIES.map((ent) => {
                    const Icon = ent.icon;
                    return (
                      <div key={ent.key} className="flex items-center gap-3 px-5 py-3">
                        <Icon size={14} className="text-muted-foreground shrink-0" />
                        <p className="flex-1 text-[12.5px] font-medium">{ar ? ent.ar : ent.en}</p>
                        <DirectionPill dir={config.entities[ent.key]} ar={ar} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Conflict policy — only matters if something is two-way */}
              {anyTwoWay && (
                <div className={cardCls + " p-5"}>
                  <h3 className="text-[13px] font-medium mb-1" style={{ fontFamily: "var(--app-font-serif)" }}>
                    {ar ? "لو نفس السجل اتعدل في المكانين؟" : "If the same record changed in both places?"}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mb-3">{ar ? "بيحصل أحيانًا مع المزامنة باتجاهين — اختار مين يكسب." : "This happens with two-way sync — choose who wins."}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { v: "latest" as const, en: "Latest edit wins", ar: "آخر تعديل يكسب" },
                      { v: "shopify" as const, en: "Shopify wins", ar: "شوبيفاي يكسب" },
                      { v: "thoth" as const, en: "THOTH wins", ar: "ثوث يكسب" },
                    ]).map((o) => (
                      <button key={o.v} onClick={() => setConfig((c) => ({ ...c, conflict_policy: o.v }))}
                        className={`h-10 rounded-xl text-[12px] font-medium border transition-colors ${
                          config.conflict_policy === o.v ? "bg-foreground text-background border-foreground" : "border-border/60 text-muted-foreground hover:bg-muted/50"
                        }`}>{ar ? o.ar : o.en}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Auto sync */}
              <div className={cardCls + " p-5 flex items-center justify-between gap-4"}>
                <div>
                  <h3 className="text-[13px] font-medium" style={{ fontFamily: "var(--app-font-serif)" }}>{ar ? "مزامنة تلقائية" : "Automatic sync"}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{ar ? "الطلبات بتوصل فورًا عبر الويب هوك — ده للباقي (منتجات، مخزون، عملاء)" : "Orders arrive instantly via webhooks — this covers the rest (products, stock, customers)"}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select value={config.auto_sync ? String(config.sync_interval_minutes) : "off"}
                    onChange={(e) => setConfig((c) => e.target.value === "off" ? { ...c, auto_sync: false } : { ...c, auto_sync: true, sync_interval_minutes: parseInt(e.target.value) })}
                    className="h-9 rounded-xl border border-border/60 bg-background px-3 text-[12px] cursor-pointer focus:outline-none">
                    <option value="15">{ar ? "كل ١٥ دقيقة" : "Every 15 min"}</option>
                    <option value="30">{ar ? "كل ٣٠ دقيقة" : "Every 30 min"}</option>
                    <option value="60">{ar ? "كل ساعة" : "Every hour"}</option>
                    <option value="off">{ar ? "يدوي فقط" : "Manual only"}</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 p-4 rounded-xl border border-rose-200/60 bg-rose-50/40">
                  <AlertTriangle size={14} className="text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-rose-600">{error}</p>
                </div>
              )}

              <div className="flex justify-between">
                <button onClick={() => setStep(2)} className="h-10 px-5 rounded-xl border border-border/60 text-[13px] font-medium hover:bg-muted/50 transition-colors flex items-center gap-2">
                  <ChevronLeft size={14} /> {ar ? "رجوع" : "Back"}
                </button>
                <button onClick={handleConnect} disabled={busy === "connect"}
                  className="h-10 px-7 rounded-xl bg-foreground text-background text-[13px] font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
                  {busy === "connect" ? <Loader2 size={14} className="animate-spin" /> : <Wifi size={14} />}
                  {ar ? "اتصل وفعّل المزامنة" : "Connect & Start Syncing"}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══ CONNECTED VIEW ══════════════════════════════════ */}
      {isConnected && !editingFlows && (
        <>
          {/* Data Flow panel */}
          <div className={cardCls + " mb-6"}>
            <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between">
              <div>
                <h3 className="text-[14px] font-medium" style={{ fontFamily: "var(--app-font-serif)" }}>{ar ? "تدفق البيانات" : "Data Flow"}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">{ar ? `${activeFlows.length} أنواع بيانات نشطة` : `${activeFlows.length} active data flows`}</p>
              </div>
              <button onClick={() => setEditingFlows(true)} className="text-[11px] text-primary hover:underline flex items-center gap-1">
                <Settings size={10} />{ar ? "عدّل الاتجاهات" : "Edit directions"}
              </button>
            </div>
            <div className="divide-y divide-border/25">
              {ENTITIES.map((ent) => {
                const dir = config.entities[ent.key];
                const Icon = ent.icon;
                return (
                  <div key={ent.key} className={`flex items-center gap-3 px-5 py-3.5 ${dir === "off" ? "opacity-45" : ""}`}>
                    <Icon size={14} className="text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-medium">{ar ? ent.ar : ent.en}</p>
                      <p className="text-[10.5px] text-muted-foreground truncate">{ar ? ent.descAr : ent.descEn}</p>
                    </div>
                    <DirectionPill dir={dir} ar={ar} />
                    {dir !== "off" && (
                      <button onClick={() => handleSyncEntity(ent.key)} disabled={!!busy}
                        className="h-7 px-2.5 rounded-lg border border-border/60 text-[10.5px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center gap-1 transition-colors disabled:opacity-40 shrink-0">
                        {busy === ent.key ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                        {ar ? "زامن" : "Sync"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            {[
              { icon: Activity, titleEn: "Sync Logs", titleAr: "سجل المزامنة", descEn: "View all sync events", descAr: "عرض كل أحداث المزامنة", path: "/loyalty/sync-logs" },
              { icon: Zap, titleEn: "Loyalty Rules", titleAr: "قواعد الولاء", descEn: "Manage earning rules", descAr: "إدارة قواعد الاكتساب", path: "/loyalty/rules" },
              { icon: Settings, titleEn: "Loyalty Settings", titleAr: "إعدادات الولاء", descEn: "Program configuration", descAr: "إعدادات البرنامج", path: "/loyalty/settings" },
            ].map((link) => (
              <button key={link.path} onClick={() => navigate(link.path)}
                className="border border-border/40 rounded-xl p-4 text-start hover:border-primary/30 hover:bg-muted/15 transition-all group">
                <link.icon size={16} className="text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                <p className="text-[13px] font-medium text-foreground group-hover:text-primary transition-colors">{ar ? link.titleAr : link.titleEn}</p>
                <p className="text-[11px] text-muted-foreground">{ar ? link.descAr : link.descEn}</p>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Flow editor (connected → edit directions) */}
      {isConnected && editingFlows && (
        <div className="mb-6">
          <div className="mb-4 px-1">
            <h3 className="text-[15px] font-medium mb-1" style={{ fontFamily: "var(--app-font-serif)" }}>
              {ar ? "عدّل اتجاهات المزامنة" : "Edit Sync Directions"}
            </h3>
          </div>
          <FlowMatrix />
          <div className="flex justify-end gap-3 pt-5">
            <button onClick={() => setEditingFlows(false)} className="h-10 px-5 rounded-xl border border-border/60 text-[13px] font-medium hover:bg-muted/50 transition-colors">
              {ar ? "إلغاء" : "Cancel"}
            </button>
            <button onClick={handleSaveFlows} disabled={busy === "save"}
              className="h-10 px-6 rounded-xl bg-foreground text-background text-[13px] font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
              {busy === "save" ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              {ar ? "احفظ" : "Save Directions"}
            </button>
          </div>
        </div>
      )}

      {/* ─── Security note ───────────────────────────────── */}
      <div className="bg-muted/20 border border-border/30 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Shield size={16} className="text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <h3 className="text-[13px] font-medium text-foreground mb-1.5" style={{ fontFamily: "var(--app-font-serif)" }}>
              {ar ? "الأمان والبنية" : "Security & Architecture"}
            </h3>
            <div className="space-y-1.5 text-[11px] text-muted-foreground">
              <p>{ar ? "رمز الوصول يُخزن مشفرًا في قاعدة البيانات ولا يُرسل أبدًا للواجهة الأمامية." : "Access token stored encrypted in database — never sent to frontend."}</p>
              <p>{ar ? "كل مكالمات Shopify API تتم عبر Supabase Edge Functions في الخادم." : "All Shopify API calls go through Supabase Edge Functions (server-side)."}</p>
              <p>{ar ? "الويب هوك محمي بتحقق HMAC — الطلبات غير الموقعة تُرفض." : "Webhooks protected by HMAC validation — unsigned requests are rejected."}</p>
              <p>{ar ? "RLS على كل الجداول — عزل كامل بين المساحات (workspaces)." : "RLS on all tables — full workspace isolation across tenants."}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
