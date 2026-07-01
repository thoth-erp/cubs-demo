/**
 * ConnectedSearch — Reusable entity search/picker
 * بحث متصل — يبحث في العملاء والمنتجات والموردين
 */

import { useState, useEffect, useRef, useMemo } from "react";
import { Search, X, Building2, User, Package, Truck } from "lucide-react";

export interface SearchResult {
  id: string;
  type: "organization" | "person" | "product" | "vendor";
  name: string;
  name_ar?: string;
  subtitle?: string;
  phone?: string;
  email?: string;
  sku?: string;
  tags?: string[];
  raw: unknown;
}

interface Props {
  results: SearchResult[];
  value?: string;
  placeholder?: string;
  onSelect: (result: SearchResult) => void;
  onClear?: () => void;
  filterTypes?: SearchResult["type"][];
  ar?: boolean;
  className?: string;
}

const TYPE_ICONS = { organization: Building2, person: User, product: Package, vendor: Truck };
const TYPE_LABELS = {
  organization: { en: "Company", ar: "شركة" },
  person: { en: "Person", ar: "شخص" },
  product: { en: "Product", ar: "منتج" },
  vendor: { en: "Vendor", ar: "مورّد" },
};

export default function ConnectedSearch({ results, value, placeholder, onSelect, onClear, filterTypes, ar, className }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return results.slice(0, 20);
    return results.filter(r => {
      if (filterTypes?.length && !filterTypes.includes(r.type)) return false;
      return (
        r.name.toLowerCase().includes(q) ||
        (r.name_ar ?? "").toLowerCase().includes(q) ||
        (r.phone ?? "").includes(q) ||
        (r.email ?? "").toLowerCase().includes(q) ||
        (r.sku ?? "").toLowerCase().includes(q) ||
        (r.subtitle ?? "").toLowerCase().includes(q)
      );
    }).slice(0, 20);
  }, [results, query, filterTypes]);

  if (value) {
    return (
      <div className={"flex items-center gap-2 h-10 px-3 rounded-xl border border-primary/30 bg-primary/5 text-[13px] " + (className || "")}>
        <span className="flex-1 truncate font-medium">{value}</span>
        {onClear && <button type="button" onClick={onClear} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>}
      </div>
    );
  }

  return (
    <div ref={ref} className={"relative " + (className || "")}>
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder || (ar ? "ابحث بالاسم أو الموبايل أو الكود..." : "Search by name, phone, SKU...")}
          className="w-full h-10 pl-9 pr-4 rounded-xl border border-border/60 bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-background border border-border/60 rounded-xl shadow-lg max-h-[280px] overflow-auto">
          {filtered.map(r => {
            const Icon = TYPE_ICONS[r.type];
            const label = TYPE_LABELS[r.type];
            return (
              <button
                key={`${r.type}-${r.id}`}
                type="button"
                onClick={() => { onSelect(r); setQuery(""); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 text-left transition-colors"
              >
                <Icon size={14} className="text-muted-foreground/60 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium truncate">{ar ? (r.name_ar || r.name) : r.name}</p>
                  <p className="text-[10.5px] text-muted-foreground truncate">
                    {ar ? label.ar : label.en}
                    {r.phone && ` · ${r.phone}`}
                    {r.sku && ` · ${r.sku}`}
                    {r.subtitle && ` · ${r.subtitle}`}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
      {open && query && filtered.length === 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-background border border-border/60 rounded-xl shadow-lg p-4 text-center text-[12px] text-muted-foreground">
          {ar ? "مفيش نتائج" : "No results found"}
        </div>
      )}
    </div>
  );
}
