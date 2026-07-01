import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { getDataSource } from "../lib/data-source";
import { CsvImport } from "../components/CsvImport";
import { IMPORT_TEMPLATES, exportCSV } from "../lib/csv-export";
import {
  ORG_TYPE_META, ORG_STATUS_META,
  type OrgType, type OrgStatus,
} from "../data/organizations";
import type { Database } from "../lib/database.types";
import {
  Search, Plus, X, LayoutGrid, List, Upload, Download,
  ChevronLeft, ChevronRight, MapPin, Users, GitBranch, Layers,
  Loader2,
} from "lucide-react";

const ORG_IMPORT = IMPORT_TEMPLATES.find((t) => t.id === "organizations")!;

type OrgRow = Database["public"]["Tables"]["organizations"]["Row"];
type OrgMeta = Record<string, unknown>;
function om(o: OrgRow): OrgMeta { return (o.metadata ?? {}) as OrgMeta; }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function omBranches(o: OrgRow): any[] { return (om(o).branches as any[]) || []; }
function omHeadcount(o: OrgRow): number { return (o.headcount ?? (om(o).headcount as number) ?? 0); }
function omDepts(o: OrgRow): number {
  const branches = omBranches(o);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return branches.reduce((s: number, b: any) => s + ((b.departments as any[])?.length || 0), 0);
}
function omTeams(o: OrgRow): number {
  const branches = omBranches(o);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return branches.reduce((s: number, b: any) => s + ((b.departments as any[])?.reduce((ts: number, d: any) => ts + ((d.teams as any[])?.length || 0), 0) || 0), 0);
}

// ─── Helpers ──────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

// ─── Filter options ───────────────────────────────────────

const TYPE_FILTERS: { value: OrgType | "all"; en: string; ar: string }[] = [
  { value: "all",        en: "All",            ar: "الكل" },
  { value: "company",    en: "Companies",       ar: "الشركات" },
  { value: "subsidiary", en: "Subsidiaries",   ar: "الشركات التابعة" },
  { value: "jv",         en: "Joint Ventures", ar: "المشاريع المشتركة" },
];

const STATUS_FILTERS: { value: OrgStatus | "all"; en: string; ar: string }[] = [
  { value: "all",      en: "All Status", ar: "كل الحالات" },
  { value: "active",   en: "Active",     ar: "نشطة" },
  { value: "inactive", en: "Inactive",   ar: "غير نشطة" },
  { value: "forming",  en: "Forming",    ar: "قيد التأسيس" },
];

// ─── Org card ─────────────────────────────────────────────

function OrgCard({ org, lang, onClick }: { org: OrgRow; lang: "en" | "ar"; onClick: () => void }) {
  const ar = lang === "ar";
  const m = om(org);
  const branches = omBranches(org);
  const typeMeta   = ORG_TYPE_META[((m.type as string) || org.sector || "company") as OrgType] ?? ORG_TYPE_META["company"];
  const statusMeta = ORG_STATUS_META[((m.status as string) || org.lifecycle || "active") as OrgStatus] ?? ORG_STATUS_META["active"];
  const depts  = omDepts(org);
  const teams  = omTeams(org);
  const hq = branches.find((b: Record<string, unknown>) => b.isHQ) || branches[0];

  return (
    <div
      onClick={onClick}
      className="group bg-background border border-border/40 rounded-xl p-5 flex flex-col gap-4 hover:shadow-sm hover:border-border/70 transition-all duration-150 cursor-pointer"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-[11px] font-semibold tracking-wide select-none ${(m.avatarColor as string) || "bg-primary/10 text-primary"}`}>
          {initials(ar ? (org.name_ar || org.name_en) : org.name_en)}
        </div>
        <span className={`text-[10.5px] font-medium px-2.5 py-1 rounded-full ${typeMeta.pill}`}>
          {ar ? typeMeta.ar : typeMeta.en}
        </span>
      </div>

      {/* Name / industry */}
      <div className="min-w-0">
        <h3
          className="text-[14px] font-medium text-foreground leading-snug mb-0.5 group-hover:text-primary transition-colors"
          style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.01em" }}
        >
          {ar ? (org.name_ar || org.name_en) : org.name_en}
        </h3>
        <p className="text-[11.5px] text-muted-foreground truncate">
          {ar ? ((m.industryAr as string) || org.sector || "") : (org.sector || "")}
        </p>
        {hq && (
          <p className="text-[11px] text-muted-foreground/70 mt-0.5 flex items-center gap-1">
            <MapPin size={9.5} strokeWidth={1.75} className="shrink-0" />
            {ar
              ? `${hq.cityAr ?? ""}, ${hq.countryAr ?? ""}`
              : `${hq.cityEn ?? ""}, ${hq.countryEn ?? ""}`
            }
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/40">
        {[
          { icon: Users,     value: omHeadcount(org).toLocaleString(), label: ar ? "موظف" : "People" },
          { icon: GitBranch, value: String(branches.length),            label: ar ? "فرع" : "Branches" },
          { icon: Layers,    value: String(depts),                      label: ar ? "قسم" : "Depts" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="flex flex-col items-start gap-1">
              <Icon size={11} strokeWidth={1.75} className="text-muted-foreground/50" />
              <p className="text-[13.5px] font-medium text-foreground leading-none" style={{ fontFamily: "var(--app-font-serif)" }}>
                {s.value}
              </p>
              <p className="text-[10.5px] text-muted-foreground">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Status footer */}
      <div className="flex items-center gap-1.5 -mt-1">
        <div className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
        <span className="text-[11px] text-muted-foreground">{ar ? statusMeta.ar : statusMeta.en}</span>
        <span className="text-muted-foreground/30 mx-1">·</span>
        <span className="text-[11px] text-muted-foreground">{ar ? `منذ ${(m.founded as string) || ""}` : `Est. ${(m.founded as string) || ""}`}</span>
        {teams > 0 && (
          <>
            <span className="text-muted-foreground/30 mx-1">·</span>
            <span className="text-[11px] text-muted-foreground">{teams} {ar ? "فريق" : "teams"}</span>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Table view ───────────────────────────────────────────

function OrgTable({ orgs, lang, onRowClick }: { orgs: OrgRow[]; lang: "en" | "ar"; onRowClick: (id: string) => void }) {
  const ar = lang === "ar";
  const COLS = [
    { en: "Organization", ar: "المنظمة",  w: "w-[32%]" },
    { en: "Type",         ar: "النوع",    w: "w-[13%]" },
    { en: "Status",       ar: "الحالة",   w: "w-[11%]" },
    { en: "Industry",     ar: "القطاع",   w: "w-[22%]" },
    { en: "People",       ar: "الأشخاص",  w: "w-[10%]" },
    { en: "Branches",     ar: "الفروع",   w: "w-[12%]" },
  ];

  return (
    <div className="border border-border/40 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/50 bg-muted/20">
            {COLS.map((c) => (
              <th key={c.en} className={`${c.w} px-4 py-3 text-start text-[10.5px] font-semibold text-muted-foreground tracking-[0.07em] uppercase`}>
                {ar ? c.ar : c.en}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-background">
          {orgs.map((org, i) => {
            const m = om(org);
            const branches = omBranches(org);
            const hq = branches.find((b: Record<string, unknown>) => b.isHQ) || branches[0];
            const typeMeta   = ORG_TYPE_META[((m.type as string) || org.sector || "company") as OrgType] ?? ORG_TYPE_META["company"];
            const statusMeta = ORG_STATUS_META[((m.status as string) || org.lifecycle || "active") as OrgStatus] ?? ORG_STATUS_META["active"];
            const isLast = i === orgs.length - 1;
            return (
              <tr
                key={org.id}
                onClick={() => onRowClick(org.id)}
                className={`group cursor-pointer hover:bg-muted/20 transition-colors ${!isLast ? "border-b border-border/30" : ""}`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-[9.5px] font-semibold select-none ${(m.avatarColor as string) || "bg-primary/10 text-primary"}`}>
                      {initials(ar ? (org.name_ar || org.name_en) : org.name_en)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-foreground truncate group-hover:text-primary transition-colors" style={{ letterSpacing: "-0.01em" }}>
                        {ar ? (org.name_ar || org.name_en) : org.name_en}
                      </p>
                      {hq && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                          <MapPin size={9} strokeWidth={1.75} />
                          {ar ? (hq.cityAr ?? "") : (hq.cityEn ?? "")}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10.5px] font-medium px-2 py-0.5 rounded-full ${typeMeta.pill}`}>
                    {ar ? typeMeta.ar : typeMeta.en}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                    <span className="text-[12px] text-foreground/80">{ar ? statusMeta.ar : statusMeta.en}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[12px] text-muted-foreground truncate block">
                    {ar ? ((m.industryAr as string) || org.sector || "") : (org.sector || "")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[13px] font-medium text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>
                    {omHeadcount(org).toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[12.5px] text-foreground/70">{branches.length}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────

function Pagination({ page, total, pageSize, onPage, lang }: { page: number; total: number; pageSize: number; onPage: (n: number) => void; lang: "en" | "ar" }) {
  const ar = lang === "ar";
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);
  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-[12px] text-muted-foreground">{ar ? `${from}–${to} من ${total}` : `${from}–${to} of ${total}`}</p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page === 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft size={14} strokeWidth={2} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button key={p} onClick={() => onPage(p)}
            className={`w-8 h-8 rounded-lg text-[12px] font-medium border transition-all ${p === page ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
            {p}
          </button>
        ))}
        <button onClick={() => onPage(page + 1)} disabled={page === totalPages}
          className="w-8 h-8 rounded-lg flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <ChevronRight size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────

const CARD_PAGE  = 6;
const TABLE_PAGE = 8;

function OrgsPage() {
  const { lang } = useLanguage();
  const { workspace } = useAuth();
  const wid = workspace?.id || "demo";
  const [, navigate] = useLocation();
  const ar = lang === "ar";

  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]       = useState("");
  const [typeFilter, setTypeFilter]     = useState<OrgType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<OrgStatus | "all">("all");
  const [view, setView]   = useState<"card" | "table">("card");
  const [page, setPage]   = useState(1);
  const [showImport, setShowImport] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ds = getDataSource();
        const rows = await ds.organizations.list(wid);
        if (!cancelled) setOrgs(rows);
      } catch (err) { console.error("Failed to load organizations:", err); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [reloadKey]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return orgs.filter((o) => {
      const m = om(o);
      const branches = omBranches(o);
      const matchSearch = !q
        || o.name_en.toLowerCase().includes(q) || (o.name_ar || "").includes(q)
        || (o.sector || "").toLowerCase().includes(q)
        || branches.some((b: Record<string, unknown>) => ((b.cityEn as string) || "").toLowerCase().includes(q) || ((b.cityAr as string) || "").includes(q));
      const oType = (m.type as string) || o.sector || "";
      const oStatus = (m.status as string) || o.lifecycle || "";
      const matchType   = typeFilter   === "all" || oType   === typeFilter;
      const matchStatus = statusFilter === "all" || oStatus === statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [orgs, search, typeFilter, statusFilter]);

  const pageSize  = view === "card" ? CARD_PAGE : TABLE_PAGE;
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const hasFilters = search !== "" || typeFilter !== "all" || statusFilter !== "all";
  function clearFilters() { setSearch(""); setTypeFilter("all"); setStatusFilter("all"); setPage(1); }

  // Summary stats
  const totalHeadcountVal = orgs.reduce((s, o) => s + omHeadcount(o), 0);
  const totalBranches  = orgs.reduce((s, o) => s + omBranches(o).length, 0);
  const totalDeptsVal  = orgs.reduce((s, o) => s + omDepts(o), 0);

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-full py-8 px-7 md:px-10 max-w-[1100px] mx-auto">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] text-muted-foreground/60 tracking-[0.08em] uppercase mb-2">
            {ar ? "النظام" : "System"}
          </p>
          <h1
            className="text-[26px] font-medium text-foreground leading-tight"
            style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.025em" }}
          >
            {ar ? "المنظمات" : "Organizations"}
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-1">
          <button onClick={() => setShowImport(true)} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border/60 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            <Upload size={13} />{ar ? "استيراد" : "Import"}
          </button>
          <button onClick={() => exportCSV(orgs.map((o) => ({ name_en: o.name_en, name_ar: o.name_ar, sector: o.sector, headcount: omHeadcount(o) })), "customers-export")} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border/60 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            <Download size={13} />{ar ? "تصدير" : "Export"}
          </button>
          <button className="flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium shadow-sm hover:opacity-90 transition-opacity">
            <Plus size={14} strokeWidth={2.5} />
            {ar ? "إضافة منظمة" : "Add Organization"}
          </button>
        </div>
      </div>

      {/* ── Summary strip ── */}
      <div className="grid grid-cols-3 gap-3 mb-7">
        {[
          { value: totalHeadcountVal.toLocaleString(), label: ar ? "إجمالي الأشخاص" : "Total People" },
          { value: String(totalBranches),               label: ar ? "الفروع"          : "Branches" },
          { value: String(totalDeptsVal),                label: ar ? "الأقسام"         : "Departments" },
        ].map((s, i) => (
          <div key={i} className="bg-background border border-border/40 rounded-xl px-5 py-4">
            <p className="text-[22px] font-medium text-foreground leading-none mb-1" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.02em" }}>
              {s.value}
            </p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-2.5 mb-5">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1 max-w-[280px]">
          <Search size={13} strokeWidth={1.75} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={ar ? "بحث…" : "Search organizations…"}
            className="w-full h-9 ps-8 pe-4 rounded-xl border border-border/80 bg-card text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
          />
        </div>

        <div className="h-5 w-px bg-border/60 hidden sm:block" />

        {/* Type pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setTypeFilter(f.value as OrgType | "all"); setPage(1); }}
              className={`h-7 px-3 rounded-lg text-[12px] font-medium border transition-all duration-150 ${typeFilter === f.value ? "bg-primary/8 text-primary border-primary/25" : "bg-card border-border text-muted-foreground hover:text-foreground"}`}
            >
              {ar ? f.ar : f.en}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-border/60 hidden sm:block" />

        {/* Status */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as OrgStatus | "all"); setPage(1); }}
          className="h-7 ps-2.5 pe-6 rounded-lg border border-border bg-card text-[12px] text-muted-foreground focus:outline-none appearance-none cursor-pointer"
        >
          {STATUS_FILTERS.map((f) => <option key={f.value} value={f.value}>{ar ? f.ar : f.en}</option>)}
        </select>

        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-[12px] text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent hover:border-border transition-all">
            <X size={11} strokeWidth={2} />
            {ar ? "مسح" : "Clear"}
          </button>
        )}

        <div className="flex-1" />

        {/* View toggle */}
        <div className="flex items-center border border-border rounded-xl overflow-hidden bg-card">
          <button onClick={() => setView("card")} className={`w-8 h-8 flex items-center justify-center transition-colors ${view === "card" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            <LayoutGrid size={14} strokeWidth={1.75} />
          </button>
          <div className="w-px h-4 bg-border/60" />
          <button onClick={() => setView("table")} className={`w-8 h-8 flex items-center justify-center transition-colors ${view === "table" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            <List size={14} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* ── Count ── */}
      <p className="text-[12px] text-muted-foreground mb-4">
        {ar ? `${filtered.length} منظمة` : `${filtered.length} ${filtered.length === 1 ? "organization" : "organizations"}`}
      </p>

      {/* ── Content ── */}
      {filtered.length === 0 ? (
        <div className="border border-border/40 rounded-xl py-20 text-center bg-background">
          <div className="w-10 h-10 rounded-xl bg-muted mx-auto mb-4 flex items-center justify-center">
            <Search size={16} className="text-muted-foreground" strokeWidth={1.5} />
          </div>
          <p className="text-[13px] font-medium text-foreground mb-1">{ar ? "لا توجد نتائج" : "No results found"}</p>
          <p className="text-[12px] text-muted-foreground">{ar ? "جرب تغيير البحث أو الفلاتر" : "Try adjusting your search or filters"}</p>
          {hasFilters && (
            <button onClick={clearFilters} className="mt-4 text-[12px] text-primary hover:underline">
              {ar ? "مسح الفلاتر" : "Clear filters"}
            </button>
          )}
        </div>
      ) : view === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.map((o) => (
            <OrgCard key={o.id} org={o} lang={lang} onClick={() => navigate(`/organizations/${o.id}`)} />
          ))}
        </div>
      ) : (
        <OrgTable orgs={paginated} lang={lang} onRowClick={(id) => navigate(`/organizations/${id}`)} />
      )}

      {/* ── Pagination ── */}
      {filtered.length > pageSize && (
        <Pagination page={page} total={filtered.length} pageSize={pageSize} onPage={setPage} lang={lang} />
      )}

      {showImport && (
        <CsvImport
          open={showImport}
          onClose={() => setShowImport(false)}
          template={ORG_IMPORT}
          adapter={getDataSource().organizations}
          ar={ar}
          onComplete={() => { setShowImport(false); setReloadKey((k) => k + 1); }}
        />
      )}
    </div>
  );
}

export default function Organizations() {
  return <OrgsPage />;
}
