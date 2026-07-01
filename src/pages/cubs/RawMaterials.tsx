/**
 * Raw Materials — CUBS inventory sub-module.
 *
 * Full taxonomy: Category → Family → Subtype → Variants (size × colour → SKU).
 * Now with: image upload, validation alarms, info tooltips, search in dropdowns.
 */

import { useMemo, useState, useRef } from "react";
import { useLanguage } from "../../context/LanguageContext";
import {
  Layers, Plus, Search, Trash2, Edit3, Package, AlertTriangle, ShoppingCart,
  ChevronDown, ChevronRight, Wand2, ImageOff, Boxes, Info, Upload,
  Download, Filter,
} from "lucide-react";
import { useLocation } from "wouter";
import {
  CATEGORIES, categoryById, familiesForCategory, familyById, subtypeById,
  coloursFor, tx, variantCode, ZIPPER_COLOR_CODES, type Colour, type Lang,
} from "../../lib/cubs/catalog";
import {
  useCubs, addRawMaterial, updateRawMaterial, removeRawMaterial, buildVariant,
  lowStock, type RawMaterial, type RMVariant,
} from "../../lib/cubs/store";
import {
  PageHeader, Modal, EmptyState, inputCls, inputErrorCls, selectCls, labelCls, btnPrimary, btnSecondary, btnGhost, cardCls, chipCls, money, FieldError,
} from "../../components/cubs/ui";

// ─── Info tooltip ──────────────────────────────────────────

const FIELD_INFO: Record<string, { en: string; ar: string }> = {
  category:    { en: "The product group this material belongs to (bags, shoes, etc.). Choosing the right category unlocks the correct material families.", ar: "مجموعة المنتجات التي تنتمي إليها هذه المادة (شنط، أحذية، إلخ). اختيار الفئة الصحيحة يفتح عائلات المواد المناسبة." },
  productType: { en: "The material family within the category (e.g. zipper, fabric). Determines available subtypes and units.", ar: "عائلة المادة داخل الفئة (مثل سوستة، قماش). يحدد الأنواع الفرعية والوحدات المتاحة." },
  type:        { en: "Specific material variant (e.g. nylon zipper, polyester fabric). Each type has its own colour palette and sizing.", ar: "نوع محدد من المادة (مثل سوستة نايلون، قماش بوليستر). لكل نوع لوحة ألوان ومقاسات خاصة." },
  name:        { en: "Descriptive name shown across the system. Use the product type + material for clarity.", ar: "اسم وصفي يظهر في جميع أنحاء النظام. استخدم نوع المنتج + المادة لوضوح أكبر." },
  supplier:    { en: "Who supplies this material. Used for purchase orders and reordering.", ar: "مورد هذه المادة. يُستخدم لأوامر الشراء وإعادة الطلب." },
  unit:        { en: "Measurement unit for stocking and costing (meter, piece, kg, etc.).", ar: "وحدة القياس للمخزون والتسعير (متر، قطعة، كيلو، إلخ)." },
  description: { en: "Detailed notes about quality, usage, or specifications.", ar: "ملاحظات تفصيلية عن الجودة والاستخدام المواصفات." },
  cost:        { en: "Cost per single unit. Multiplied by quantity to get line total.", ar: "التكلفة لكل وحدة. تُضرب في الكمية للحصول على الإجمالي." },
  stock:       { en: "Current on-hand quantity in the selected unit.", ar: "الكمية المتوفرة حالياً بالوحدة المحددة." },
  reorder:     { en: "When stock drops to this level, a low-stock alert triggers a PO suggestion.", ar: "عندما ينخفض المخزون لهذا المستوى، يظهر تنبيه مقترحأمر شراء." },
  image:       { en: "Upload a photo of the material for easy identification in the warehouse.", ar: "ارفع صورة للمادة للتعرف عليها بسهولة في المستودع." },
  colours:     { en: "Select all available colours. Each colour becomes a separate variant with its own SKU.", ar: "اختر جميع الألوان المتاحة. كل لون يصبح متغيراً منفصلاً ب SKU خاص." },
  sizes:       { en: "Select all available sizes/gauges. Each size × colour combo generates a unique SKU.", ar: "اختر جميع المقاسات المتاحة. كل مقاس × لون يُولّد SKU فريداً." },
};

function InfoTip({ field, lang }: { field: string; lang: "en" | "ar" }) {
  const info = FIELD_INFO[field];
  if (!info) return null;
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex">
      <button type="button" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
        onClick={() => setShow((s) => !s)} className="text-muted-foreground/50 hover:text-primary transition-colors">
        <Info size={12} />
      </button>
      {show && (
        <span className="absolute z-[110] bottom-full mb-2 start-1/2 -translate-x-1/2 w-[260px] p-3 rounded-xl bg-popover border border-border text-[11.5px] text-foreground shadow-xl leading-relaxed" dir={lang === "ar" ? "rtl" : "ltr"}>
          {lang === "ar" ? info.ar : info.en}
        </span>
      )}
    </span>
  );
}

function FieldLabel({ label, info, ar }: { label: string; info?: string; ar: boolean }) {
  return (
    <label className="text-[11px] font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
      {label}
      {info && <InfoTip field={info} lang={ar ? "ar" : "en"} />}
    </label>
  );
}

// ─── Validation alarm ──────────────────────────────────────

function ValidationAlarm({ errors, ar }: { errors: string[]; ar: boolean }) {
  if (errors.length === 0) return null;
  return (
    <div className="rounded-xl border border-red-300/50 bg-red-50/60 dark:bg-red-500/5 p-3 space-y-1.5">
      {errors.map((e, i) => (
        <div key={i} className="flex items-start gap-2 text-[12px] text-red-600">
          <AlertTriangle size={13} className="shrink-0 mt-0.5" />
          <span>{e}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Searchable select ─────────────────────────────────────

function SearchableSelect({ value, onChange, options, placeholder, disabled, lang, error }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string; disabled?: boolean; lang: "en" | "ar"; error?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const ar = lang === "ar";

  const filtered = options.filter((o) => !q || o.label.toLowerCase().includes(q.toLowerCase()));
  const selected = options.find((o) => o.value === value);

  const borderCls = error
    ? "border-2 border-red-400 bg-red-50/30"
    : "border border-border/60 bg-background";

  return (
    <div className="relative" ref={ref}>
      <button type="button" disabled={disabled} onClick={() => setOpen((o) => !o)}
        className={`w-full h-10 rounded-xl ${borderCls} px-3.5 text-[13px] text-start flex items-center justify-between gap-2 transition ${disabled ? "opacity-40 cursor-not-allowed" : "hover:border-border"}`}>
        <span className={selected ? "text-foreground" : error ? "text-red-400" : "text-muted-foreground/50"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={14} className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-[110] top-full mt-1 w-full rounded-xl border border-border/60 bg-card shadow-xl overflow-hidden">
          <div className="p-2 border-b border-border/50">
            <div className="relative">
              <Search size={13} className="absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <input className="w-full h-8 rounded-lg border-0 bg-muted/40 ps-8 pe-2 text-[12px] focus:outline-none" placeholder={ar ? "بحث..." : "Search..."} value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
            </div>
          </div>
          <div className="max-h-[200px] overflow-y-auto py-1">
            {filtered.length === 0 && <p className="px-3 py-2 text-[12px] text-muted-foreground">{ar ? "لا نتائج" : "No results"}</p>}
            {filtered.map((o) => (
              <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false); setQ(""); }}
                className={`w-full px-3 py-2 text-[12.5px] text-start hover:bg-muted/60 transition ${value === o.value ? "bg-primary/5 text-primary font-medium" : "text-foreground"}`}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {open && <div className="fixed inset-0 z-[105]" onClick={() => { setOpen(false); setQ(""); }} />}
    </div>
  );
}

// ─── Image upload ──────────────────────────────────────────

function ImageUpload({ images, onChange, lang }: { images: string[]; onChange: (imgs: string[]) => void; lang: "en" | "ar" }) {
  const ar = lang === "ar";
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const next = [...images];
    for (const f of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = () => { next.push(reader.result as string); onChange([...next]); };
      reader.readAsDataURL(f);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap">
        {images.map((img, i) => (
          <div key={i} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-border/60">
            <img src={img} alt="" className="w-full h-full object-cover" />
            <button type="button" onClick={() => onChange(images.filter((_, j) => j !== i))}
              className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <Trash2 size={14} className="text-white" />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => fileRef.current?.click()}
          className="w-16 h-16 rounded-lg border-2 border-dashed border-border/60 flex flex-col items-center justify-center text-muted-foreground/50 hover:border-primary/40 hover:text-primary transition">
          <Upload size={14} />
          <span className="text-[8px] mt-0.5">{ar ? "رفع" : "Upload"}</span>
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
    </div>
  );
}

// ─── Export/Import helpers ─────────────────────────────────

function exportCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function importCSV(text: string): Record<string, string>[] {
  const lines = text.split("\n").filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    const vals = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
    return obj;
  });
}

// ─── Colour swatch + reference-card picker ──────────────────

function Swatch({ colour, size = 20 }: { colour: { hex?: string; card?: string; name?: { en: string; ar: string } }; size?: number }) {
  return (
    <span
      className="inline-block rounded-md border border-border/60 shrink-0 bg-cover bg-center"
      style={{ width: size, height: size, backgroundColor: colour.hex || "#ddd", backgroundImage: colour.card ? `url(${colour.card})` : undefined }}
      title={colour.name?.en}
    />
  );
}

function ColourPicker({ source, selected, onToggle, lang, selectedColorCode, onColorCodeSelect }: {
  source: "zipper" | "fabric" | "hardware" | "none";
  selected: string[];
  onToggle: (id: string) => void;
  lang: Lang;
  selectedColorCode?: string;
  onColorCodeSelect?: (code: string, index: string) => void;
}) {
  const [zoom, setZoom] = useState<string | null>(null);
  const [colourSearch, setColourSearch] = useState("");
  const [codeSearch, setCodeSearch] = useState("");
  const colours = coloursFor(source);
  const filtered = colours.filter((c) => !colourSearch || tx(c.name, lang).toLowerCase().includes(colourSearch.toLowerCase()));
  const filteredCodes = ZIPPER_COLOR_CODES.filter((c) =>
    !codeSearch || c.colorNo.toLowerCase().includes(codeSearch.toLowerCase()) || c.indexNo.toLowerCase().includes(codeSearch.toLowerCase())
  );
  if (source === "none") return null;

  const isZipper = source === "zipper";

  return (
    <div className="space-y-4">
      {/* Colour name picker */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <p className="text-[10.5px] uppercase tracking-wide text-muted-foreground/70">
            {lang === "ar" ? "اختر اللون" : "Pick colour"} <span className="text-muted-foreground/50">({selected.length}/{colours.length})</span>
          </p>
          <InfoTip field="colours" lang={lang} />
        </div>
        <div className="relative mb-2">
          <Search size={13} className="absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
          <input className="w-full h-8 rounded-lg border border-border/60 bg-background ps-8 pe-2 text-[12px] focus:outline-none" placeholder={lang === "ar" ? "بحث لون..." : "Search colour..."} value={colourSearch} onChange={(e) => setColourSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {filtered.map((col) => {
            const on = selected.includes(col.id);
            return (
              <button key={col.id} type="button" onClick={() => onToggle(col.id)}
                className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-[12px] transition ${on ? "border-primary bg-primary/5 text-foreground" : "border-border/60 text-muted-foreground hover:border-border"}`}>
                <Swatch colour={col} size={18} />
                {tx(col.name, lang)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Colour code picker (zipper only) */}
      {isZipper && onColorCodeSelect && (
        <div className="rounded-xl border border-border/60 overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/40 border-b border-border/50 flex items-center gap-2">
            <span className="text-[13px] font-semibold">{lang === "ar" ? "كود اللون (السوستة)" : "Zipper Colour Code"}</span>
            <span className="text-[11px] text-muted-foreground">— {lang === "ar" ? "اختر من فهرس الألوان" : "pick from supplier colour index"}</span>
          </div>
          <div className="p-3 space-y-2">
            <div className="relative">
              <Search size={13} className="absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <input className="w-full h-8 rounded-lg border border-border/60 bg-background ps-8 pe-2 text-[12px] focus:outline-none"
                placeholder={lang === "ar" ? "بحث بالكود (S001, B-7)..." : "Search by code (S001, B-7)..."}
                value={codeSearch} onChange={(e) => setCodeSearch(e.target.value)} />
            </div>
            <div className="max-h-[180px] overflow-y-auto rounded-lg border border-border/50">
              <table className="w-full text-[11.5px]">
                <thead className="bg-muted/30 text-muted-foreground sticky top-0">
                  <tr>
                    <th className="px-2.5 py-1.5 text-start font-medium">{lang === "ar" ? "كود اللون" : "Color No"}</th>
                    <th className="px-2.5 py-1.5 text-start font-medium">{lang === "ar" ? "الفهرس" : "Index"}</th>
                    <th className="px-2.5 py-1.5 text-start font-medium">{lang === "ar" ? "الاختيار" : "Pick"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredCodes.slice(0, 50).map((c) => {
                    const isActive = selectedColorCode === c.colorNo;
                    return (
                      <tr key={c.colorNo} className={`hover:bg-muted/30 transition ${isActive ? "bg-primary/5" : ""}`}>
                        <td className="px-2.5 py-1.5 font-mono font-semibold">{c.colorNo}</td>
                        <td className="px-2.5 py-1.5 font-mono">{c.indexNo}</td>
                        <td className="px-2.5 py-1.5">
                          <button type="button" onClick={() => onColorCodeSelect(c.colorNo, c.indexNo)}
                            className={`text-[11px] font-medium px-2 py-0.5 rounded-md transition ${isActive ? "bg-primary text-primary-foreground" : "text-primary hover:bg-primary/10"}`}>
                            {isActive ? (lang === "ar" ? "مختار" : "Selected") : (lang === "ar" ? "اختيار" : "Pick")}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredCodes.length > 50 && <p className="text-[10.5px] text-muted-foreground text-center">{lang === "ar" ? `عرض ٥٠ من ${filteredCodes.length}` : `Showing 50 of ${filteredCodes.length}`}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Add / edit modal ───────────────────────────────────────

interface Draft {
  categoryId: string; familyId: string; subtypeId: string;
  name: string; nameAr: string; description: string; descriptionAr: string;
  supplier: string; unitEn: string; unitAr: string;
  variants: RMVariant[];
  images: string[];
}

const emptyDraft: Draft = {
  categoryId: "", familyId: "", subtypeId: "",
  name: "", nameAr: "", description: "", descriptionAr: "",
  supplier: "", unitEn: "", unitAr: "", variants: [], images: [],
};

function RawMaterialModal({ open, onClose, editing }: { open: boolean; onClose: () => void; editing: RawMaterial | null }) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [d, setD] = useState<Draft>(emptyDraft);
  const [selSizes, setSelSizes] = useState<string[]>([]);
  const [selColours, setSelColours] = useState<string[]>([]);
  const [selColorCode, setSelColorCode] = useState("");
  const [selIndexNo, setSelIndexNo] = useState("");
  const [defCost, setDefCost] = useState<number>(0);
  const [defStock, setDefStock] = useState<number>(0);
  const [defReorder, setDefReorder] = useState<number>(0);
  const [inited, setInited] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [genErrors, setGenErrors] = useState<string[]>([]);

  const family = d.familyId ? familyById(d.familyId) : undefined;
  const category = d.categoryId ? categoryById(d.categoryId) : undefined;
  const subtype = d.familyId && d.subtypeId ? subtypeById(d.familyId, d.subtypeId) : undefined;

  if (open && !inited) {
    if (editing) {
      setD({
        categoryId: editing.categoryId, familyId: editing.familyId, subtypeId: editing.subtypeId,
        name: editing.name, nameAr: editing.nameAr || "", description: editing.description || "", descriptionAr: editing.descriptionAr || "",
        supplier: editing.supplier || "", unitEn: editing.unitEn, unitAr: editing.unitAr, variants: editing.variants,
        images: editing.images || [],
      });
    } else {
      setD(emptyDraft);
    }
    setSelSizes([]); setSelColours([]); setSelColorCode(""); setSelIndexNo(""); setDefCost(0); setDefStock(0); setDefReorder(0);
    setInited(true); setShowErrors(false); setGenErrors([]);
  }
  if (!open && inited) setInited(false);

  const setCategory = (categoryId: string) => setD({ ...d, categoryId, familyId: "", subtypeId: "", variants: editing ? d.variants : [] });
  const setFamily = (familyId: string) => {
    const fam = familyById(familyId);
    setD({ ...d, familyId, subtypeId: "", unitEn: fam?.unit.en || "", unitAr: fam?.unit.ar || "" });
    setSelSizes([]); setSelColours([]);
  };
  const setSubtype = (subtypeId: string) => {
    const cat = categoryById(d.categoryId); const fam = familyById(d.familyId); const sub = subtypeById(d.familyId, subtypeId);
    const autoName = cat && fam && sub ? `${cat.name.en} ${sub.name.en}` : d.name;
    const autoNameAr = cat && fam && sub ? `${sub.name.ar} ${cat.name.ar}` : d.nameAr;
    setD({ ...d, subtypeId, name: d.name || autoName, nameAr: d.nameAr || autoNameAr });
  };

  const toggleIn = (id: string) => (prev: string[]) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const previewSku = useMemo(() => {
    if (!d.categoryId || !d.familyId || !d.subtypeId) return "";
    const sizeCode = family?.sizes.length ? (family.sizes.find((s) => s.id === selSizes[0])?.code) : undefined;
    const colourCode = family && family.colour !== "none" ? (coloursFor(family.colour).find((c) => c.id === selColours[0])?.code) : undefined;
    return variantCode({ categoryId: d.categoryId, familyId: d.familyId, subtypeId: d.subtypeId, sizeCode, colourCode });
  }, [d.categoryId, d.familyId, d.subtypeId, selSizes, selColours, family]);

  const canGenerate = d.categoryId && d.familyId && d.subtypeId;

  function generate() {
    if (!family || !category) return;
    const errs: string[] = [];
    if (family.sizes.length && selSizes.length === 0) errs.push(ar ? "يجب اختيار مقاس واحد على الأقل" : "Select at least one size");
    if (family.colour !== "none" && selColours.length === 0) errs.push(ar ? "يجب اختيار لون واحد على الأقل" : "Select at least one colour");
    if (defCost <= 0) errs.push(ar ? "يجب إدخال التكلفة" : "Cost per unit is required");
    if (errs.length > 0) { setGenErrors(errs); return; }
    setGenErrors([]);

    const sizeIds = family.sizes.length ? (selSizes.length ? selSizes : []) : [undefined];
    const colourIds = family.colour !== "none" ? (selColours.length ? selColours : []) : [undefined];

    const cols = coloursFor(family.colour);
    const next: RMVariant[] = [...d.variants];
    for (const sid of sizeIds) {
      for (const cid of colourIds) {
        const size = sid ? family.sizes.find((s) => s.id === sid) : undefined;
        const colour: Colour | undefined = cid ? cols.find((c) => c.id === cid) : undefined;
        const v = buildVariant({
          categoryId: d.categoryId, familyId: d.familyId, subtypeId: d.subtypeId,
          sizeId: size?.id, sizeCode: size?.code,
          colourId: colour?.id, colourCode: colour?.code, colourName: colour?.name, colourHex: colour?.hex, colourCard: colour?.card,
          colorNo: selColorCode, indexNo: selIndexNo,
          cost: defCost, stock: defStock, reorderPoint: defReorder,
        });
        if (!next.some((x) => x.sku === v.sku)) next.push(v);
      }
    }
    setD({ ...d, variants: next });
  }

  const editVariant = (id: string, patch: Partial<RMVariant>) =>
    setD({ ...d, variants: d.variants.map((v) => (v.id === id ? { ...v, ...patch } : v)) });
  const dropVariant = (id: string) => setD({ ...d, variants: d.variants.filter((v) => v.id !== id) });

  // Validation
  const errors: string[] = [];
  if (showErrors) {
    if (!d.categoryId) errors.push(ar ? "يجب اختيار الفئة" : "Category is required");
    if (!d.familyId) errors.push(ar ? "يجب اختيار نوع المنتج" : "Product type is required");
    if (!d.subtypeId) errors.push(ar ? "يجب اختيار النوع الفرعي" : "Type is required");
    if (!d.name.trim()) errors.push(ar ? "يجب إدخال الاسم" : "Name is required");
    if (d.variants.length === 0) errors.push(ar ? "يجب إضافة متغير واحد على الأقل" : "At least one variant is required");
  }

  function save() {
    setShowErrors(true);
    if (!d.categoryId || !d.familyId || !d.subtypeId || !d.name.trim() || d.variants.length === 0) return;
    const payload = {
      categoryId: d.categoryId, familyId: d.familyId, subtypeId: d.subtypeId,
      name: d.name, nameAr: d.nameAr, description: d.description, descriptionAr: d.descriptionAr,
      supplier: d.supplier, unitEn: d.unitEn, unitAr: d.unitAr, variants: d.variants,
    };
    if (editing) updateRawMaterial(editing.id, { ...payload, images: d.images });
    else addRawMaterial({ ...payload, images: d.images });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} wide
      title={editing ? "Edit Raw Material" : "Add Raw Material"} titleAr={editing ? "تعديل مادة خام" : "إضافة مادة خام"}
      footer={<>
        <button className={btnSecondary} onClick={onClose}>{ar ? "إلغاء" : "Cancel"}</button>
        <button className={btnPrimary} onClick={save}>
          {ar ? "حفظ المادة" : "Save material"} {d.variants.length > 0 && `· ${d.variants.length} ${ar ? "متغيرات" : "variants"}`}
        </button>
      </>}>
      <div className="space-y-5">
        <ValidationAlarm errors={errors} ar={ar} />

        {/* Taxonomy cascade */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <FieldLabel label={`1 · ${ar ? "الفئة" : "Category"}`} info="category" ar={ar} />
            <SearchableSelect value={d.categoryId} onChange={setCategory} lang={lang} error={showErrors && !d.categoryId}
              placeholder={ar ? "اختر الفئة" : "Select category"}
              options={CATEGORIES.map((c) => ({ value: c.id, label: tx(c.name, lang) }))} />
            {showErrors && !d.categoryId && <FieldError message={ar ? "يجب اختيار الفئة" : "Category is required"} ar={ar} />}
          </div>
          <div>
            <FieldLabel label={`2 · ${ar ? "نوع المنتج" : "Product type"}`} info="productType" ar={ar} />
            <SearchableSelect value={d.familyId} onChange={setFamily} lang={lang} disabled={!d.categoryId} error={showErrors && !d.familyId && !!d.categoryId}
              placeholder={ar ? "اختر النوع" : "Select type"}
              options={familiesForCategory(d.categoryId).map((f) => ({ value: f.id, label: tx(f.name, lang) }))} />
            {showErrors && !d.familyId && !!d.categoryId && <FieldError message={ar ? "يجب اختيار نوع المنتج" : "Product type is required"} ar={ar} />}
          </div>
          <div>
            <FieldLabel label={`3 · ${ar ? "النوع الفرعي" : "Type"}`} info="type" ar={ar} />
            <SearchableSelect value={d.subtypeId} onChange={setSubtype} lang={lang} disabled={!d.familyId} error={showErrors && !d.subtypeId && !!d.familyId}
              placeholder={ar ? "اختر" : "Select"}
              options={(family?.subtypes || []).map((s) => ({ value: s.id, label: tx(s.name, lang) }))} />
            {showErrors && !d.subtypeId && !!d.familyId && <FieldError message={ar ? "يجب اختيار النوع الفرعي" : "Type is required"} ar={ar} />}
          </div>
        </div>

        {subtype && (
          <div className="rounded-xl bg-muted/40 border border-border/50 px-3.5 py-2.5 flex items-center gap-3 flex-wrap text-[12px]">
            <span className="font-mono font-semibold text-primary">{category?.code}{family?.code}{subtype.code}</span>
            <span className="text-muted-foreground">{ar ? "الكود الأساسي · وحدة القياس:" : "Base code · unit:"}</span>
            <span className={chipCls}>{ar ? d.unitAr : d.unitEn}</span>
          </div>
        )}

        {/* Descriptive fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <FieldLabel label={`${ar ? "الاسم (EN)" : "Name (EN)"}`} info="name" ar={ar} />
            <input className={showErrors && !d.name.trim() ? inputErrorCls : inputCls} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} placeholder="Bags Nylon zipper" />
            {showErrors && !d.name.trim() && <FieldError message={ar ? "يجب إدخال الاسم" : "Name is required"} ar={ar} />}
          </div>
          <div>
            <FieldLabel label={`${ar ? "الاسم (AR)" : "Name (AR)"}`} info="name" ar={ar} />
            <input className={inputCls} value={d.nameAr} onChange={(e) => setD({ ...d, nameAr: e.target.value })} placeholder="سوستة نايلون شنط" dir="rtl" />
          </div>
          <div>
            <FieldLabel label={`${ar ? "المورّد" : "Supplier"}`} info="supplier" ar={ar} />
            <input className={inputCls} value={d.supplier} onChange={(e) => setD({ ...d, supplier: e.target.value })} placeholder="YKK Egypt" />
          </div>
          <div>
            <FieldLabel label={`${ar ? "وحدة القياس" : "Unit"}`} info="unit" ar={ar} />
            <SearchableSelect value={d.unitEn} onChange={(v) => {
              const u = family?.units.find((x) => x.en === v);
              setD({ ...d, unitEn: u?.en || v, unitAr: u?.ar || d.unitAr });
            }} lang={lang} disabled={!family}
              placeholder={ar ? "اختر" : "Select"}
              options={(family?.units || []).map((u) => ({ value: u.en, label: ar ? u.ar : u.en }))} />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel label={`${ar ? "الوصف" : "Description"}`} info="description" ar={ar} />
            <textarea className={inputCls + " h-16 py-2 resize-none"} value={ar ? d.descriptionAr : d.description}
              onChange={(e) => setD(ar ? { ...d, descriptionAr: e.target.value } : { ...d, description: e.target.value })}
              placeholder={ar ? "وصف المادة الخام..." : "Describe the raw material…"} dir={ar ? "rtl" : "ltr"} />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel label={`${ar ? "صور المادة" : "Material images"}`} info="image" ar={ar} />
            <ImageUpload images={d.images} onChange={(imgs) => setD({ ...d, images: imgs })} lang={lang} />
          </div>
        </div>

        {/* Variant builder */}
        {subtype && (
          <div className={`rounded-xl border overflow-hidden ${showErrors && d.variants.length === 0 ? "border-red-400 bg-red-50/20" : "border-border/60"}`}>
            <div className="px-4 py-2.5 bg-muted/40 border-b border-border/50 flex items-center gap-2">
              <Boxes size={15} className={showErrors && d.variants.length === 0 ? "text-red-500" : "text-primary"} />
              <span className="text-[13px] font-semibold">{ar ? "المتغيرات (الألوان والمقاسات)" : "Variants (colours & sizes)"}</span>
              <InfoTip field="colours" lang={lang} />
              {showErrors && d.variants.length === 0 && <span className="text-[11px] text-red-500 font-medium">{ar ? "⚠ مطلوب" : "⚠ Required"}</span>}
            </div>
            <div className="p-4 space-y-4">
              {family && family.sizes.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <label className="text-[11px] font-medium text-muted-foreground">{tx(family.sizeLabel, lang) || (ar ? "المقاس" : "Size")}</label>
                    <InfoTip field="sizes" lang={lang} />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {family.sizes.map((s) => {
                      const on = selSizes.includes(s.id);
                      return (
                        <button key={s.id} type="button" onClick={() => setSelSizes(toggleIn(s.id))}
                          className={`rounded-lg border px-3 py-1.5 text-[12px] transition ${on ? "border-primary bg-primary/5 text-foreground" : "border-border/60 text-muted-foreground hover:border-border"}`}>
                          {tx(s.label, lang)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {family && family.colour !== "none" && (
                <ColourPicker source={family.colour} selected={selColours} lang={lang}
                  onToggle={(id) => setSelColours(toggleIn(id))}
                  selectedColorCode={selColorCode}
                  onColorCodeSelect={(code, index) => { setSelColorCode(code); setSelIndexNo(index); }} />
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
                <div>
                  <FieldLabel label={`${ar ? "التكلفة/وحدة" : "Cost / unit"}`} info="cost" ar={ar} />
                  <input type="number" className={inputCls} value={defCost || ""} onChange={(e) => setDefCost(Number(e.target.value))} placeholder="0.00" />
                </div>
                <div>
                  <FieldLabel label={`${ar ? "المخزون" : "Stock"}`} info="stock" ar={ar} />
                  <input type="number" className={inputCls} value={defStock || ""} onChange={(e) => setDefStock(Number(e.target.value))} placeholder="0" />
                </div>
                <div>
                  <FieldLabel label={`${ar ? "حد إعادة الطلب" : "Reorder pt"}`} info="reorder" ar={ar} />
                  <input type="number" className={inputCls} value={defReorder || ""} onChange={(e) => setDefReorder(Number(e.target.value))} placeholder="0" />
                </div>
                <button type="button" className={btnPrimary + " h-10"} disabled={!canGenerate} onClick={generate}>
                  <Wand2 size={14} /> {ar ? "توليد" : "Generate"}
                </button>
              </div>

              {genErrors.length > 0 && (
                <div className="rounded-xl border border-red-300/50 bg-red-50/60 dark:bg-red-500/5 p-3 space-y-1.5">
                  {genErrors.map((e, i) => (
                    <div key={i} className="flex items-start gap-2 text-[12px] text-red-600">
                      <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                      <span>{e}</span>
                    </div>
                  ))}
                </div>
              )}

              {previewSku && (
                <p className="text-[11.5px] text-muted-foreground">
                  {ar ? "معاينة الكود:" : "SKU preview:"} <span className="font-mono font-semibold text-foreground">{previewSku}</span>
                  <span className="mx-1.5 text-muted-foreground/40">·</span>
                  {ar ? "يتولّد تلقائياً لكل تركيبة" : "auto-generated per combination"}
                </p>
              )}

              {/* Variant matrix */}
              {d.variants.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-border/50">
                  <table className="w-full text-[12px]">
                    <thead className="bg-muted/40 text-muted-foreground">
                      <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-start [&>th]:font-medium">
                        <th>{ar ? "المتغير" : "Variant"}</th>
                        <th>{ar ? "الكود" : "SKU"}</th>
                        {family?.colour === "zipper" && <th>{ar ? "كود اللون" : "Colour Code"}</th>}
                        <th>{ar ? "الباركود" : "Barcode"}</th>
                        <th>{ar ? "التكلفة" : "Cost"}</th>
                        <th>{ar ? "المخزون" : "Stock"}</th>
                        <th>{ar ? "إعادة الطلب" : "Reorder"}</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {d.variants.map((v) => (
                        <tr key={v.id} className="[&>td]:px-3 [&>td]:py-2">
                          <td>
                            <div className="flex items-center gap-2">
                              {v.colourHex && <Swatch colour={{ hex: v.colourHex, card: v.colourCard, name: v.colourName }} size={18} />}
                              <span>{v.colourName ? tx(v.colourName, lang) : "—"}{v.sizeCode ? ` · ${v.sizeCode}` : ""}</span>
                            </div>
                          </td>
                          <td className="font-mono text-[11px]">{v.sku}</td>
                          {family?.colour === "zipper" && (
                            <td className="font-mono text-[11px]">
                              {v.colorNo ? <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">{v.colorNo}</span> : "—"}
                              {v.indexNo && <span className="ms-1 text-muted-foreground">{v.indexNo}</span>}
                            </td>
                          )}
                          <td className="font-mono text-[11px] text-muted-foreground">{v.barcode}</td>
                          <td><input type="number" className="w-20 h-8 rounded-md border border-border/50 bg-background px-2 text-[12px]" value={v.cost || ""} onChange={(e) => editVariant(v.id, { cost: Number(e.target.value) })} /></td>
                          <td><input type="number" className="w-20 h-8 rounded-md border border-border/50 bg-background px-2 text-[12px]" value={v.stock || ""} onChange={(e) => editVariant(v.id, { stock: Number(e.target.value) })} /></td>
                          <td><input type="number" className="w-20 h-8 rounded-md border border-border/50 bg-background px-2 text-[12px]" value={v.reorderPoint || ""} onChange={(e) => editVariant(v.id, { reorderPoint: Number(e.target.value) })} /></td>
                          <td><button className={btnGhost} onClick={() => dropVariant(v.id)}><Trash2 size={13} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── Material card ──────────────────────────────────────────

function RawMaterialCard({ rm, onEdit }: { rm: RawMaterial; onEdit: (rm: RawMaterial) => void }) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [open, setOpen] = useState(false);
  const cat = categoryById(rm.categoryId);
  const fam = familyById(rm.familyId);
  const sub = subtypeById(rm.familyId, rm.subtypeId);
  const totalStock = rm.variants.reduce((s, v) => s + v.stock, 0);
  const lowCount = rm.variants.filter((v) => v.reorderPoint > 0 && v.stock <= v.reorderPoint).length;
  const avgCost = rm.variants.length ? rm.variants.reduce((s, v) => s + v.cost, 0) / rm.variants.length : 0;
  const images = rm.images || [];

  return (
    <div className={cardCls + " overflow-hidden"}>
      <div className="p-4">
        {images.length > 0 && (
          <div className="flex gap-1.5 mb-3 overflow-x-auto">
            {images.slice(0, 4).map((img: string, i: number) => (
              <img key={i} src={img} alt="" className="w-12 h-12 rounded-lg object-cover border border-border/50" />
            ))}
            {images.length > 4 && <span className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-[10px] text-muted-foreground">+{images.length - 4}</span>}
          </div>
        )}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={chipCls}>{tx(cat?.name, lang)}</span>
              <span className="font-mono text-[11px] font-semibold text-primary">{rm.baseCode}</span>
              {lowCount > 0 && <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-amber-600"><AlertTriangle size={12} />{lowCount} {ar ? "منخفض" : "low"}</span>}
            </div>
            <p className="text-[14px] font-semibold text-foreground truncate">{ar ? (rm.nameAr || rm.name) : rm.name}</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {tx(fam?.name, lang)} · {tx(sub?.name, lang)}{rm.supplier ? ` · ${rm.supplier}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button className={btnGhost} onClick={() => onEdit(rm)}><Edit3 size={14} /></button>
            <button className={btnGhost} onClick={() => { if (confirm(ar ? "حذف هذه المادة؟" : "Delete this material?")) removeRawMaterial(rm.id); }}><Trash2 size={14} /></button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3">
          <Stat label={ar ? "المتغيرات" : "Variants"} value={String(rm.variants.length)} />
          <Stat label={ar ? "إجمالي المخزون" : "Total stock"} value={`${totalStock.toLocaleString()} ${ar ? rm.unitAr : rm.unitEn}`} />
          <Stat label={ar ? "متوسط التكلفة" : "Avg cost"} value={money(avgCost, lang)} />
        </div>
      </div>

      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between px-4 py-2 border-t border-border/50 text-[12px] text-muted-foreground hover:bg-muted/40 transition">
        <span className="flex items-center gap-1.5">{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}{ar ? "عرض المتغيرات" : "Show variants"}</span>
        <span className="flex -space-x-1.5">
          {rm.variants.slice(0, 6).map((v) => v.colourHex ? <Swatch key={v.id} colour={{ hex: v.colourHex, card: v.colourCard }} size={16} /> : null)}
        </span>
      </button>

      {open && (
        <div className="overflow-x-auto border-t border-border/50">
          <table className="w-full text-[12px]">
            <thead className="bg-muted/30 text-muted-foreground">
              <tr className="[&>th]:px-4 [&>th]:py-2 [&>th]:text-start [&>th]:font-medium">
                <th>{ar ? "اللون / المقاس" : "Colour / Size"}</th>
                <th>{ar ? "الكود" : "SKU"}</th>
                <th>{ar ? "الباركود" : "Barcode"}</th>
                <th>{ar ? "التكلفة" : "Cost"}</th>
                <th>{ar ? "المخزون" : "Stock"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {rm.variants.map((v) => {
                const low = v.reorderPoint > 0 && v.stock <= v.reorderPoint;
                return (
                  <tr key={v.id} className="[&>td]:px-4 [&>td]:py-2">
                    <td>
                      <div className="flex items-center gap-2">
                        {v.colourHex ? <Swatch colour={{ hex: v.colourHex, card: v.colourCard, name: v.colourName }} size={18} /> : <span className="w-[18px] h-[18px] rounded-md bg-muted inline-flex items-center justify-center text-muted-foreground"><ImageOff size={10} /></span>}
                        <span>{v.colourName ? tx(v.colourName, lang) : "—"}{v.sizeCode ? ` · ${v.sizeCode}` : ""}</span>
                      </div>
                    </td>
                    <td className="font-mono text-[11px]">{v.sku}</td>
                    <td className="font-mono text-[11px] text-muted-foreground">{v.barcode}</td>
                    <td>{money(v.cost, lang)}</td>
                    <td>
                      <span className={low ? "text-amber-600 font-medium" : ""}>{v.stock.toLocaleString()}</span>
                      {low && <span className="text-[10px] text-amber-600 ms-1">({ar ? "أعد الطلب" : "reorder"})</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 px-2.5 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">{label}</p>
      <p className="text-[13px] font-semibold text-foreground mt-0.5 truncate">{value}</p>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────

export default function RawMaterialsPage() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const { rawMaterials } = useCubs();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<RawMaterial | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const alerts = lowStock();

  const filtered = useMemo(() => rawMaterials.filter((r) => {
    if (cat && r.categoryId !== cat) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return r.name.toLowerCase().includes(q) || (r.nameAr || "").includes(search) || r.baseCode.toLowerCase().includes(q) ||
      r.variants.some((v) => v.sku.toLowerCase().includes(q) || v.barcode.includes(search));
  }), [rawMaterials, search, cat]);

  const openAdd = () => { setEditing(null); setModal(true); };
  const openEdit = (rm: RawMaterial) => { setEditing(rm); setModal(true); };

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const rows = importCSV(reader.result as string);
      rows.forEach((r) => {
        if (r.name && r.category) {
          const catObj = CATEGORIES.find((c) => c.id === r.category || tx(c.name, lang).toLowerCase() === r.category?.toLowerCase());
          if (catObj) addRawMaterial({
            categoryId: catObj.id, familyId: r.family || "", subtypeId: r.subtype || "",
            name: r.name, nameAr: r.nameAr || r.name, description: r.description || "",
            supplier: r.supplier || "", unitEn: r.unit || "piece", unitAr: r.unitAr || "قطعة",
            variants: [], images: [],
          });
        }
      });
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="p-5 sm:p-6 max-w-[1200px] mx-auto">
      <PageHeader icon={<Layers size={18} />}
        title="Raw Materials" titleAr="المواد الخام"
        subtitle="Zippers, fabrics, hardware — with auto SKUs & variant matrix" subtitleAr="سوست، أقمشة، إكسسوارات — بأكواد ومتغيرات تلقائية"
        actions={<>
          <button className={btnSecondary} onClick={() => fileRef.current?.click()}><Upload size={14} />{ar ? "استيراد" : "Import"}</button>
          <button className={btnSecondary} onClick={() => exportCSV(filtered.map((r) => ({ name: r.name, nameAr: r.nameAr, category: r.categoryId, family: r.familyId, subtype: r.subtypeId, supplier: r.supplier, baseCode: r.baseCode, variants: r.variants.length })), "raw-materials.csv")}><Download size={14} />{ar ? "تصدير" : "Export"}</button>
          <button className={btnPrimary} onClick={openAdd}><Plus size={15} />{ar ? "إضافة مادة خام" : "Add Raw Material"}</button>
        </>}
      />
      <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />

      {/* Smart low-stock strip → procurement */}
      {alerts.length > 0 && (
        <div className="mb-5 rounded-2xl border border-amber-300/50 bg-amber-50/60 dark:bg-amber-500/5 p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0"><AlertTriangle size={16} /></div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-foreground">{ar ? `${alerts.length} متغيّر تحت حد إعادة الطلب` : `${alerts.length} variants below reorder point`}</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                {alerts.slice(0, 3).map(({ rm, variant }) => `${rm.name} · ${variant.sku} (${variant.stock})`).join("  ·  ")}
                {alerts.length > 3 && ` +${alerts.length - 3}`}
              </p>
            </div>
            <button className={btnSecondary + " shrink-0"} onClick={() => navigate("/procurement?suggest=1")}>
              <ShoppingCart size={13} />{ar ? "إنشاء أمر شراء" : "Create PO"}
            </button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
          <input className={inputCls + " ps-9"} placeholder={ar ? "بحث بالاسم أو الكود أو الباركود..." : "Search name, SKU or barcode…"} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className={selectCls + " w-auto min-w-[140px]"} value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">{ar ? "كل الفئات" : "All categories"}</option>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{tx(c.name, lang)}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className={cardCls}>
          <EmptyState icon={<Package size={20} />}
            title="No raw materials yet" titleAr="لا توجد مواد خام بعد"
            hint="Add zippers, fabrics and hardware — each with colours, sizes and auto codes." hintAr="أضف السوست والأقمشة والإكسسوارات — بألوان ومقاسات وأكواد تلقائية."
            action={<button className={btnPrimary} onClick={openAdd}><Plus size={15} />{ar ? "إضافة مادة خام" : "Add Raw Material"}</button>} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((rm) => <RawMaterialCard key={rm.id} rm={rm} onEdit={openEdit} />)}
        </div>
      )}

      <RawMaterialModal open={modal} onClose={() => setModal(false)} editing={editing} />
    </div>
  );
}
