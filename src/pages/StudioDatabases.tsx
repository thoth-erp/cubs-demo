import { useState, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Table, LayoutGrid, Columns3, CalendarDays, List,
  ArrowUpDown, Filter, ChevronDown, ChevronRight, Search,
  MoreHorizontal, Trash2, Edit3, Eye, X, ArrowUp, ArrowDown,
  Settings2, Tag, User, Hash, Calendar, CheckSquare, Link,
  DollarSign, Star, BarChart3, Type, Layers,
  Database, Rows3, GalleryHorizontalEnd, GanttChart,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import {
  STUDIO_DATABASES, STUDIO_DATABASE_ROWS,
  type StudioDatabase, type StudioDatabaseRow, type DatabaseViewType,
  type StudioDatabaseProperty,
} from "../lib/studio-data";

const EASE_OUT_QUINT = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT_QUINT } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};

const VIEW_ICONS: Record<DatabaseViewType, typeof Table> = {
  table: Table, gallery: LayoutGrid, board: Columns3,
  calendar: CalendarDays, list: List, timeline: Layers,
};

const VIEW_LABELS: Record<DatabaseViewType, { en: string; ar: string }> = {
  table: { en: "Table", ar: "جدول" }, gallery: { en: "Gallery", ar: "معرض" },
  board: { en: "Board", ar: "لوحة" }, calendar: { en: "Calendar", ar: "تقويم" },
  list: { en: "List", ar: "قائمة" }, timeline: { en: "Timeline", ar: "الجدول الزمني" },
};

const PROP_ICONS: Record<string, typeof Type> = {
  text: Type, number: Hash, status: Tag, select: Tag, multi_select: Layers,
  person: User, relation: Link, rollup: BarChart3, formula: BarChart3,
  date: Calendar, checkbox: CheckSquare, url: Link, email: Link,
  phone: Hash, currency: DollarSign, rating: Star, progress: BarChart3, tags: Tag,
};

function getStatusColor(color: string) {
  return `${color}20`;
}

function getPropertyLabel(prop: StudioDatabaseProperty, ar: boolean) {
  return ar ? prop.name_ar : prop.name;
}

export default function StudioDatabases() {
  const { lang, isRtl } = useLanguage();
  const [, navigate] = useLocation();
  const ar = lang === "ar";

  const [selectedDbId, setSelectedDbId] = useState<string | null>(STUDIO_DATABASES[0]?.id ?? null);
  const [activeViewType, setActiveViewType] = useState<DatabaseViewType>("table");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filterText, setFilterText] = useState("");
  const [showProperties, setShowProperties] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddRow, setShowAddRow] = useState(false);
  const [newRowText, setNewRowText] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());

  const database = useMemo(
    () => STUDIO_DATABASES.find(d => d.id === selectedDbId) ?? null,
    [selectedDbId]
  );

  const rows = useMemo(
    () => STUDIO_DATABASE_ROWS.filter(r => r.database_id === selectedDbId),
    [selectedDbId]
  );

  const filteredRows = useMemo(() => {
    let result = [...rows];
    if (filterText) {
      const q = filterText.toLowerCase();
      result = result.filter(r =>
        Object.values(r.properties).some(v =>
          String(v).toLowerCase().includes(q)
        )
      );
    }
    if (sortColumn && database) {
      result.sort((a, b) => {
        const av = String(a.properties[sortColumn] ?? "");
        const bv = String(b.properties[sortColumn] ?? "");
        const cmp = av.localeCompare(bv);
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return result;
  }, [rows, filterText, sortColumn, sortDir, database]);

  const visibleProps = useMemo(() => {
    if (!database) return [];
    const view = database.views.find(v => v.type === activeViewType) ?? database.views[0];
    if (!view?.visible_properties?.length) return database.properties;
    return database.properties.filter(p => view.visible_properties.includes(p.id));
  }, [database, activeViewType]);

  const boardColumns = useMemo(() => {
    if (!database || activeViewType !== "board") return [];
    const statusProp = database.properties.find(p => p.type === "status" || p.type === "select");
    if (!statusProp?.options) return [];
    return statusProp.options.map(opt => ({
      ...opt,
      rows: filteredRows.filter(r => r.properties[statusProp.id] === opt.label),
    }));
  }, [database, filteredRows, activeViewType]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const dateProp = database?.properties.find(p => p.type === "date");
    const days: { day: number; items: StudioDatabaseRow[]; isCurrentMonth: boolean }[] = [];
    for (let i = 0; i < firstDay; i++) {
      const prevDays = new Date(calendarYear, calendarMonth, 0).getDate();
      days.push({ day: prevDays - firstDay + i + 1, items: [], isCurrentMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayRows = dateProp ? filteredRows.filter(r => r.properties[dateProp.id] === dateStr) : [];
      days.push({ day: d, items: dayRows, isCurrentMonth: true });
    }
    while (days.length % 7 !== 0) {
      days.push({ day: days.length - (firstDay + daysInMonth) + 1, items: [], isCurrentMonth: false });
    }
    return days;
  }, [database, filteredRows, calendarMonth, calendarYear]);

  const handleSort = useCallback((propId: string) => {
    if (sortColumn === propId) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(propId);
      setSortDir("asc");
    }
  }, [sortColumn]);

  const handleAddRow = useCallback(() => {
    if (!database || !newRowText.trim()) return;
    setNewRowText("");
    setShowAddRow(false);
  }, [database, newRowText]);

  const monthNames = ar
    ? ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]
    : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ar ? ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const now = new Date();

  return (
    <div className="min-h-full py-8 px-7 md:px-10 max-w-[1200px] mx-auto space-y-6">
      {/* Database Selector */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="space-y-1">
        <p className="text-[11px] text-muted-foreground/60 tracking-[0.08em] uppercase mb-2">
          {ar ? "قواعد البيانات" : "Databases"}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {STUDIO_DATABASES.map(db => (
            <button
              key={db.id}
              onClick={() => { setSelectedDbId(db.id); setActiveViewType(db.views[0]?.type ?? "table"); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 border ${
                selectedDbId === db.id
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-card/40 border-border/30 text-muted-foreground hover:bg-accent/30 hover:text-foreground"
              }`}
            >
              <span className="text-base">{db.icon}</span>
              <span>{ar ? db.name_ar : db.name}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {database && (
        <>
          {/* Database Header */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{database.icon}</span>
              <div>
                <h1
                  className="text-[22px] font-medium text-foreground"
                  style={{ fontFamily: "var(--app-font-serif)" }}
                >
                  {ar ? database.name_ar : database.name}
                </h1>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                  {rows.length} {ar ? "صف" : "rows"} · {database.properties.length} {ar ? "خصائص" : "properties"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowProperties(!showProperties)}
                className={`h-8 px-3 rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition-all border ${
                  showProperties
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-card/40 border-border/30 text-muted-foreground hover:bg-accent/30"
                }`}
              >
                <Settings2 size={13} />
                {ar ? "الخصائص" : "Properties"}
              </button>
            </div>
          </motion.div>

          <div className="flex gap-6">
            {/* Main Content */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* Toolbar */}
              <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex items-center gap-3 flex-wrap">
                {/* View Switcher */}
                <div className="flex items-center gap-1 bg-card/40 border border-border/30 rounded-xl p-1">
                  {database.views.map(view => {
                    const Icon = VIEW_ICONS[view.type] ?? Table;
                    return (
                      <button
                        key={view.id}
                        onClick={() => setActiveViewType(view.type)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                          activeViewType === view.type
                            ? "bg-background shadow-sm text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Icon size={13} />
                        <span className="hidden sm:inline">{ar ? view.name_ar : view.name}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex-1" />

                {/* Search/Filter */}
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                  <input
                    type="text"
                    value={filterText}
                    onChange={e => setFilterText(e.target.value)}
                    placeholder={ar ? "تصفية..." : "Filter..."}
                    className="h-8 w-40 pl-8 pr-3 rounded-lg border border-border/40 bg-background text-[12px] focus:outline-none focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground/50"
                  />
                  {filterText && (
                    <button
                      onClick={() => setFilterText("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`h-8 px-3 rounded-lg text-[12px] font-medium flex items-center gap-1.5 border transition-all ${
                    showFilters
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-card/40 border-border/30 text-muted-foreground hover:bg-accent/30"
                  }`}
                >
                  <Filter size={12} />
                  {ar ? "فلتر" : "Filter"}
                </button>

                <button
                  onClick={() => setShowAddRow(true)}
                  className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium flex items-center gap-1.5 hover:bg-primary/90 transition-colors"
                >
                  <Plus size={13} />
                  {ar ? "إضافة صف" : "Add Row"}
                </button>
              </motion.div>

              {/* Add Row Inline */}
              <AnimatePresence>
                {showAddRow && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-2 p-3 rounded-xl border border-dashed border-primary/30 bg-primary/5">
                      <input
                        type="text"
                        value={newRowText}
                        onChange={e => setNewRowText(e.target.value)}
                        placeholder={ar ? "اسم الصف الجديد..." : "New row name..."}
                        className="flex-1 h-8 px-3 rounded-lg border border-border/40 bg-background text-[12px] focus:outline-none focus:ring-1 focus:ring-primary/20"
                        autoFocus
                        onKeyDown={e => e.key === "Enter" && handleAddRow()}
                      />
                      <button
                        onClick={handleAddRow}
                        className="h-8 px-4 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium hover:bg-primary/90 transition-colors"
                      >
                        {ar ? "إضافة" : "Add"}
                      </button>
                      <button
                        onClick={() => { setShowAddRow(false); setNewRowText(""); }}
                        className="h-8 px-2 rounded-lg text-muted-foreground hover:bg-accent/30 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* TABLE VIEW */}
              {activeViewType === "table" && (
                <motion.div initial="hidden" animate="visible" variants={stagger} className="rounded-xl border border-border/40 bg-card/40 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-[12.5px]">
                      <thead>
                        <tr className="border-b border-border/30">
                          <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider w-10">#</th>
                          {visibleProps.map(prop => (
                            <th
                              key={prop.id}
                              onClick={() => handleSort(prop.id)}
                              className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors select-none group"
                            >
                              <div className="flex items-center gap-1.5">
                                {getPropertyLabel(prop, ar)}
                                {sortColumn === prop.id ? (
                                  sortDir === "asc" ? <ArrowUp size={10} className="text-primary" /> : <ArrowDown size={10} className="text-primary" />
                                ) : (
                                  <ArrowUpDown size={10} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                                )}
                              </div>
                            </th>
                          ))}
                          <th className="w-10" />
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRows.map((row, i) => (
                          <tr key={row.id} className="border-b border-border/20 hover:bg-accent/20 transition-colors group">
                            <td className="px-4 py-2.5 text-muted-foreground/40 tabular-nums">{i + 1}</td>
                            {visibleProps.map(prop => (
                              <td key={prop.id} className="px-4 py-2.5">
                                <CellRenderer value={row.properties[prop.id]} property={prop} ar={ar} />
                              </td>
                            ))}
                            <td className="px-2 py-2.5">
                              <button className="p-1 rounded-md text-muted-foreground/30 hover:text-foreground hover:bg-accent/30 opacity-0 group-hover:opacity-100 transition-all">
                                <MoreHorizontal size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {filteredRows.length === 0 && (
                          <tr>
                            <td colSpan={visibleProps.length + 2} className="px-4 py-12 text-center text-muted-foreground/50 text-[13px]">
                              {ar ? "لا توجد بيانات" : "No data found"}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* GALLERY VIEW */}
              {activeViewType === "gallery" && (
                <motion.div initial="hidden" animate="visible" variants={stagger} className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredRows.map(row => (
                    <motion.div
                      key={row.id}
                      variants={fadeUp}
                      className="rounded-xl border border-border/30 bg-card/50 p-4 hover:border-border/50 hover:shadow-sm transition-all duration-200 group cursor-pointer"
                    >
                      <div className="w-full h-28 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-border/20 flex items-center justify-center mb-3">
                        <span className="text-3xl opacity-30">{database.icon}</span>
                      </div>
                      <p className="text-[13px] font-medium truncate mb-1">
                        {String(Object.values(row.properties)[0] ?? "")}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {visibleProps.slice(1, 4).map(prop => (
                          <span key={prop.id} className="text-[10px] text-muted-foreground/60">
                            {getPropertyLabel(prop, ar)}: {String(row.properties[prop.id] ?? "—")}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                  {filteredRows.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground/50 text-[13px]">
                      {ar ? "لا توجد بيانات" : "No data found"}
                    </div>
                  )}
                </motion.div>
              )}

              {/* BOARD VIEW */}
              {activeViewType === "board" && (
                <motion.div initial="hidden" animate="visible" variants={stagger} className="flex gap-4 overflow-x-auto pb-2">
                  {boardColumns.map(col => (
                    <motion.div key={col.label} variants={fadeUp} className="min-w-[260px] flex-1">
                      <div className="flex items-center gap-2 mb-3 px-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                        <span className="text-[12px] font-semibold text-muted-foreground">
                          {ar ? col.label_ar : col.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground/50 tabular-nums bg-muted/50 px-1.5 py-0.5 rounded">
                          {col.rows.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {col.rows.map(row => (
                          <div
                            key={row.id}
                            className="rounded-xl border border-border/30 bg-card/60 p-3 hover:border-border/50 hover:shadow-sm transition-all duration-150 cursor-pointer group"
                          >
                            <p className="text-[12.5px] font-medium mb-2 group-hover:text-primary transition-colors">
                              {String(Object.values(row.properties)[0] ?? "")}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              {visibleProps.slice(1, 4).map(prop => {
                                const val = row.properties[prop.id];
                                if (!val) return null;
                                return (
                                  <span key={prop.id} className="text-[10px] text-muted-foreground/60 bg-muted/30 px-1.5 py-0.5 rounded">
                                    {String(val)}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                        {col.rows.length === 0 && (
                          <div className="rounded-xl border border-dashed border-border/30 p-4 text-center text-[11px] text-muted-foreground/40">
                            {ar ? "فارغ" : "Empty"}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* CALENDAR VIEW */}
              {activeViewType === "calendar" && (
                <motion.div initial="hidden" animate="visible" variants={fadeUp} className="rounded-xl border border-border/40 bg-card/40 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[14px] font-medium">
                      {monthNames[calendarMonth]} {calendarYear}
                    </h3>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(y => y - 1); }
                          else setCalendarMonth(m => m - 1);
                        }}
                        className="p-1.5 rounded-lg hover:bg-accent/30 text-muted-foreground transition-colors"
                      >
                        <ChevronRight size={14} className={isRtl ? "" : "rotate-180"} />
                      </button>
                      <button
                        onClick={() => {
                          if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(y => y + 1); }
                          else setCalendarMonth(m => m + 1);
                        }}
                        className="p-1.5 rounded-lg hover:bg-accent/30 text-muted-foreground transition-colors"
                      >
                        <ChevronRight size={14} className={isRtl ? "rotate-180" : ""} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-px">
                    {dayNames.map(d => (
                      <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider py-2">
                        {d}
                      </div>
                    ))}
                    {calendarDays.map((d, i) => (
                      <div
                        key={i}
                        className={`min-h-[80px] p-1.5 rounded-lg border border-border/10 ${
                          d.isCurrentMonth ? "bg-background/50" : "bg-muted/10 text-muted-foreground/30"
                        } ${d.day === now.getDate() && d.isCurrentMonth && calendarMonth === now.getMonth() && calendarYear === now.getFullYear() ? "ring-1 ring-primary/30 bg-primary/5" : ""}`}
                      >
                        <span className={`text-[11px] tabular-nums ${d.isCurrentMonth ? "text-foreground" : "text-muted-foreground/30"}`}>
                          {d.day}
                        </span>
                        {d.items.map(item => (
                          <div
                            key={item.id}
                            className="mt-0.5 px-1 py-0.5 rounded text-[10px] bg-primary/10 text-primary truncate cursor-pointer hover:bg-primary/20 transition-colors"
                          >
                            {String(Object.values(item.properties)[0] ?? "")}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* LIST VIEW */}
              {activeViewType === "list" && (
                <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-1">
                  {filteredRows.map((row, i) => (
                    <motion.div
                      key={row.id}
                      variants={fadeUp}
                      className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-accent/20 transition-colors group cursor-pointer border border-transparent hover:border-border/20"
                    >
                      <span className="text-[11px] text-muted-foreground/40 tabular-nums w-6">{i + 1}</span>
                      <span className="text-sm">{database.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium truncate group-hover:text-primary transition-colors">
                          {String(Object.values(row.properties)[0] ?? "")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {visibleProps.slice(1, 4).map(prop => (
                          <span key={prop.id} className="text-[10px] text-muted-foreground/60">
                            <CellRenderer value={row.properties[prop.id]} property={prop} ar={ar} />
                          </span>
                        ))}
                      </div>
                      <button className="p-1 rounded-md text-muted-foreground/30 hover:text-foreground hover:bg-accent/30 opacity-0 group-hover:opacity-100 transition-all">
                        <MoreHorizontal size={14} />
                      </button>
                    </motion.div>
                  ))}
                  {filteredRows.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground/50 text-[13px]">
                      {ar ? "لا توجد بيانات" : "No data found"}
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Properties Panel */}
            <AnimatePresence>
              {showProperties && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 260, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: EASE_OUT_QUINT }}
                  className="shrink-0 overflow-hidden"
                >
                  <div className="w-[260px] rounded-xl border border-border/30 bg-card/50 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {ar ? "الخصائص" : "Properties"}
                      </h3>
                      <button
                        onClick={() => setShowProperties(false)}
                        className="p-1 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-accent/30 transition-colors"
                      >
                        <X size={13} />
                      </button>
                    </div>

                    <div className="space-y-1">
                      {database.properties.map(prop => {
                        const Icon = PROP_ICONS[prop.type] ?? Type;
                        return (
                          <div
                            key={prop.id}
                            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-accent/20 transition-colors group cursor-pointer"
                          >
                            <Icon size={13} className="text-muted-foreground/50 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-medium truncate">{getPropertyLabel(prop, ar)}</p>
                              <p className="text-[10px] text-muted-foreground/50 capitalize">{prop.type.replace("_", " ")}</p>
                            </div>
                            {prop.options && (
                              <div className="flex items-center gap-0.5">
                                {prop.options.slice(0, 3).map(opt => (
                                  <div
                                    key={opt.label}
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: opt.color }}
                                    title={ar ? opt.label_ar : opt.label}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-border/30 text-[11px] text-muted-foreground/60 hover:text-foreground hover:border-border/50 hover:bg-accent/20 transition-all">
                      <Plus size={12} />
                      {ar ? "إضافة خاصية" : "Add Property"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      {!database && (
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="text-center py-20">
          <Database size={40} className="mx-auto text-muted-foreground/20 mb-4" />
          <p className="text-sm text-muted-foreground/60">
            {ar ? "اختر قاعدة بيانات" : "Select a database"}
          </p>
        </motion.div>
      )}
    </div>
  );
}

function CellRenderer({ value, property, ar }: { value: any; property: StudioDatabaseProperty; ar: boolean }) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground/30">—</span>;
  }

  if (property.type === "status" || property.type === "select") {
    const opt = property.options?.find(o => o.label === value);
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
        style={{
          backgroundColor: getStatusColor(opt?.color ?? "#94A3B8"),
          color: opt?.color ?? "#94A3B8",
        }}
      >
        {ar ? opt?.label_ar ?? value : value}
      </span>
    );
  }

  if (property.type === "multi_select" && Array.isArray(value)) {
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {value.map((v: string) => {
          const opt = property.options?.find(o => o.label === v);
          return (
            <span
              key={v}
              className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium"
              style={{
                backgroundColor: getStatusColor(opt?.color ?? "#94A3B8"),
                color: opt?.color ?? "#94A3B8",
              }}
            >
              {ar ? opt?.label_ar ?? v : v}
            </span>
          );
        })}
      </div>
    );
  }

  if (property.type === "checkbox") {
    return (
      <div className={`w-4 h-4 rounded border flex items-center justify-center ${value ? "bg-primary border-primary" : "border-border/50"}`}>
        {value && <CheckSquare size={10} className="text-primary-foreground" />}
      </div>
    );
  }

  if (property.type === "currency" && typeof value === "number") {
    return <span className="tabular-nums">{value.toLocaleString()} EGP</span>;
  }

  if (property.type === "date") {
    return <span className="tabular-nums text-muted-foreground">{value}</span>;
  }

  return <span className="truncate">{String(value)}</span>;
}
