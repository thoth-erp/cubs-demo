/**
 * Raw Materials — Modern wizard UX.
 * Step-by-step: Category → Type → Subtype → Details → Colour & Variants → Save
 */

import { useMemo, useState, useRef, useCallback } from "react";
import { useLanguage } from "../../context/LanguageContext";
import {
  Layers, Plus, Search, Trash2, Edit3, Package, AlertTriangle, ShoppingCart,
  ChevronDown, ChevronRight, ChevronLeft, Wand2, Boxes, Info, Upload,
  Download, Check, CheckCircle2, Sparkles, X,
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

function InfoTip({ text, lang }: { text: { en: string; ar: string }; lang: "en" | "ar" }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex">
      <button type="button" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
        onClick={() => setShow((s) => !s)} className="text-muted-foreground/40 hover:text-primary transition-colors">
        <Info size={12} />
      </button>
      {show && (
        <span className="absolute z-[110] bottom-full mb-2 start-1/2 -translate-x-1/2 w-[240px] p-2.5 rounded-xl bg-popover border border-border text-[11px] text-foreground shadow-xl leading-relaxed" dir={lang === "ar" ? "rtl" : "ltr"}>
          {lang === "ar" ? text.ar : text.en}
        </span>
      )}
    </span>
  );
}

// ─── Step indicator ────────────────────────────────────────

function StepBar({ step, total, labels, lang }: { step: number; total: number; labels: string[]; lang: "en" | "ar" }) {
  const ar = lang === "ar";
  return (
    <div className="flex items-center gap-1 mb-5">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-1 flex-1">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-all ${
            i < step ? "bg-primary text-primary-foreground" : i === step ? "bg-primary/15 text-primary ring-2 ring-primary/30" : "bg-muted text-muted-foreground"
          }`}>
            {i < step ? <Check size={13} /> : i + 1}
          </div>
          {i < total - 1 && <div className={`flex-1 h-0.5 rounded-full transition-all ${i < step ? "bg-primary" : "bg-muted"}`} />}
        </div>
      ))}
    </div>
  );
}

// ─── Visual card selector ──────────────────────────────────

function CardGrid<T extends { id: string; label: string; sub?: string; icon?: React.ReactNode; color?: string }>(
  { items, selected, onSelect, columns = 3 }: { items: T[]; selected: string; onSelect: (id: string) => void; columns?: number }
) {
  return (
    <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {items.map((item) => {
        const active = selected === item.id;
        return (
          <button key={item.id} type="button" onClick={() => onSelect(item.id)}
            className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-center transition-all duration-200 ${
              active
                ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                : "border-border/50 bg-card hover:border-primary/30 hover:bg-muted/30 hover:shadow-sm"
            }`}>
            {active && <div className="absolute top-2 end-2 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><Check size={12} /></div>}
            {item.icon && <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color || "bg-muted"}`}>{item.icon}</div>}
            <span className="text-[13px] font-semibold text-foreground leading-tight">{item.label}</span>
            {item.sub && <span className="text-[11px] text-muted-foreground leading-tight">{item.sub}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ─── Visual colour grid ────────────────────────────────────

function ColourGrid({ colours, selected, onToggle, lang, colorCodes, selectedCode, onCodeSelect }: {
  colours: Colour[]; selected: string[]; onToggle: (id: string) => void; lang: "en" | "ar";
  colorCodes?: boolean; selectedCode?: string; onCodeSelect?: (code: string, index: string) => void;
}) {
  const ar = lang === "ar";
  const [q, setQ] = useState("");

  const filtered = colours.filter((c) => !q || tx(c.name, lang).toLowerCase().includes(q.toLowerCase()));
  const filteredCodes = colorCodes ? ZIPPER_COLOR_CODES.filter((c) => !q || c.colorNo.toLowerCase().includes(q.toLowerCase()) || c.indexNo.toLowerCase().includes(q.toLowerCase())) : [];

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
        <input className="w-full h-9 rounded-xl border border-border/60 bg-background ps-9 pe-3 text-[12.5px] focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder={ar ? "بحث لون أو كود..." : "Search colour or code..."} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {/* Colour name swatches */}
      <div>
        <p className="text-[11px] text-muted-foreground mb-2">{ar ? `الألوان (${selected.length}/${colours.length})` : `Colours (${selected.length}/${colours.length})`}</p>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {filtered.map((col) => {
            const on = selected.includes(col.id);
            return (
              <button key={col.id} type="button" onClick={() => onToggle(col.id)}
                className={`relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${on ? "border-primary bg-primary/5 shadow-sm" : "border-border/40 hover:border-border"}`}>
                {on && <div className="absolute -top-1 -end-1 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><Check size={9} /></div>}
                <span className="w-8 h-8 rounded-lg border border-border/60 shrink-0"
                  style={{ backgroundColor: col.hex, backgroundImage: col.card ? `url(${col.card})` : undefined, backgroundSize: "cover" }} />
                <span className="text-[10px] font-medium text-foreground leading-tight text-center">{tx(col.name, lang)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Colour code table (zipper) */}
      {colorCodes && filteredCodes.length > 0 && (
        <div className="rounded-xl border border-border/50 overflow-hidden">
          <div className="px-3 py-2 bg-muted/30 border-b border-border/50">
            <p className="text-[11px] text-muted-foreground">{ar ? "أكواد الألوان" : "Zipper colour codes"}</p>
          </div>
          <div className="max-h-[160px] overflow-y-auto">
            <table className="w-full text-[11px]">
              <thead className="bg-muted/20 sticky top-0">
                <tr><th className="px-2.5 py-1.5 text-start font-medium">{ar ? "الكود" : "Code"}</th><th className="px-2.5 py-1.5 text-start font-medium">{ar ? "الفهرس" : "Index"}</th><th className="px-2.5 py-1.5"></th></tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredCodes.slice(0, 40).map((c) => (
                  <tr key={c.colorNo} className={`hover:bg-muted/30 transition ${selectedCode === c.colorNo ? "bg-primary/5" : ""}`}>
                    <td className="px-2.5 py-1.5 font-mono font-semibold">{c.colorNo}</td>
                    <td className="px-2.5 py-1.5 font-mono">{c.indexNo}</td>
                    <td className="px-2.5 py-1.5">
                      <button type="button" onClick={() => onCodeSelect?.(c.colorNo, c.indexNo)}
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-md transition ${selectedCode === c.colorNo ? "bg-primary text-primary-foreground" : "text-primary hover:bg-primary/10"}`}>
                        {selectedCode === c.colorNo ? (ar ? "✓ مختار" : "✓ Pick") : (ar ? "اختيار" : "Pick")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Add/Edit wizard modal ─────────────────────────────────

interface Draft {
  categoryId: string; familyId: string; subtypeId: string;
  name: string; nameAr: string; description: string; descriptionAr: string;
  supplier: string; unitEn: string; unitAr: string;
  variants: RMVariant[]; images: string[];
}

const emptyDraft: Draft = { categoryId: "", familyId: "", subtypeId: "", name: "", nameAr: "", description: "", descriptionAr: "", supplier: "", unitEn: "", unitAr: "", variants: [], images: [] };

function RawMaterialWizard({ open, onClose, editing }: { open: boolean; onClose: () => void; editing: RawMaterial | null }) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>(emptyDraft);
  const [selSizes, setSelSizes] = useState<string[]>([]);
  const [selColours, setSelColours] = useState<string[]>([]);
  const [selColorCode, setSelColorCode] = useState("");
  const [selIndexNo, setSelIndexNo] = useState("");
  const [defCost, setDefCost] = useState<number>(0);
  const [defStock, setDefStock] = useState<number>(0);
  const [defReorder, setDefReorder] = useState<number>(0);
  const [inited, setInited] = useState(false);

  const family = d.familyId ? familyById(d.familyId) : undefined;
  const category = d.categoryId ? categoryById(d.categoryId) : undefined;
  const subtype = d.familyId && d.subtypeId ? subtypeById(d.familyId, d.subtypeId) : undefined;

  if (open && !inited) {
    if (editing) {
      setD({ categoryId: editing.categoryId, familyId: editing.familyId, subtypeId: editing.subtypeId, name: editing.name, nameAr: editing.nameAr || "", description: editing.description || "", descriptionAr: editing.descriptionAr || "", supplier: editing.supplier || "", unitEn: editing.unitEn, unitAr: editing.unitAr, variants: editing.variants, images: editing.images || [] });
      setStep(4);
    } else { setD(emptyDraft); setStep(0); }
    setSelSizes([]); setSelColours([]); setSelColorCode(""); setSelIndexNo(""); setDefCost(0); setDefStock(0); setDefReorder(0);
    setInited(true);
  }
  if (!open && inited) setInited(false);

  const steps = [
    ar ? "الفئة" : "Category",
    ar ? "نوع المنتج" : "Material type",
    ar ? "النوع الفرعي" : "Subtype",
    ar ? "البيانات" : "Details",
    ar ? "الألوان والمتغيرات" : "Colours & variants",
  ];

  const toggleIn = (id: string) => (prev: string[]) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  function generateVariants() {
    if (!family || !category) return;
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

  function save() {
    const payload = { categoryId: d.categoryId, familyId: d.familyId, subtypeId: d.subtypeId, name: d.name, nameAr: d.nameAr, description: d.description, descriptionAr: d.descriptionAr, supplier: d.supplier, unitEn: d.unitEn, unitAr: d.unitAr, variants: d.variants, images: d.images };
    if (editing) updateRawMaterial(editing.id, payload);
    else addRawMaterial(payload);
    onClose();
  }

  const canNext = step === 0 ? !!d.categoryId : step === 1 ? !!d.familyId : step === 2 ? !!d.subtypeId : step === 3 ? !!d.name.trim() : d.variants.length > 0;

  return (
    <Modal open={open} onClose={onClose} wide
      title={editing ? (ar ? "تعديل مادة خام" : "Edit Raw Material") : (ar ? "إضافة مادة خام" : "Add Raw Material")}
      titleAr={editing ? "تعديل مادة خام" : "إضافة مادة خام"}
      footer={<>
        <div className="me-auto text-[12px] text-muted-foreground">
          {d.variants.length > 0 && <span>{d.variants.length} {ar ? "متغيرات" : "variants"}</span>}
        </div>
        <button className={btnSecondary} onClick={onClose}>{ar ? "إلغاء" : "Cancel"}</button>
        {step > 0 && <button className={btnSecondary} onClick={() => setStep((s) => s - 1)}><ChevronLeft size={14} />{ar ? "رجوع" : "Back"}</button>}
        {step < 4 ? (
          <button className={btnPrimary} disabled={!canNext} onClick={() => setStep((s) => s + 1)}>{ar ? "التالي" : "Next"}<ChevronRight size={14} /></button>
        ) : (
          <button className={btnPrimary} disabled={d.variants.length === 0} onClick={save}>
            <CheckCircle2 size={14} />{ar ? "حفظ المادة" : "Save material"}{d.variants.length > 0 && ` · ${d.variants.length}`}
          </button>
        )}
      </>}>
      <StepBar step={step} total={5} labels={steps} lang={lang} />

      {/* Step 0: Category */}
      {step === 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-[15px] font-semibold mb-1">{ar ? "اختر فئة المادة" : "Choose material category"}</h3>
            <p className="text-[12.5px] text-muted-foreground mb-4">{ar ? "حدد المجموعة التي تنتمي إليها هذه المادة الخام" : "Select the product group this raw material belongs to"}</p>
          </div>
          <CardGrid
            items={CATEGORIES.map((c) => ({ id: c.id, label: tx(c.name, lang), sub: `${c.families.length} ${ar ? "أنواع" : "types"}`, color: "bg-primary/10" }))}
            selected={d.categoryId}
            onSelect={(id) => setD({ ...d, categoryId: id, familyId: "", subtypeId: "" })}
            columns={2}
          />
        </div>
      )}

      {/* Step 1: Family / Product type */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-[15px] font-semibold mb-1">{ar ? "اختر نوع المادة" : "Choose material type"}</h3>
            <p className="text-[12.5px] text-muted-foreground mb-4">{ar ? `في فئة ${tx(category?.name, lang)}` : `Within ${tx(category?.name, lang)} category`}</p>
          </div>
          <CardGrid
            items={familiesForCategory(d.categoryId).map((f) => ({ id: f.id, label: tx(f.name, lang), sub: `${f.subtypes.length} ${ar ? "أنواع فرعية" : "subtypes"}`, color: "bg-violet-100 dark:bg-violet-500/10" }))}
            selected={d.familyId}
            onSelect={(id) => {
              const fam = familyById(id);
              setD({ ...d, familyId: id, subtypeId: "", unitEn: fam?.unit.en || "", unitAr: fam?.unit.ar || "" });
              setSelSizes([]); setSelColours([]);
            }}
            columns={3}
          />
        </div>
      )}

      {/* Step 2: Subtype */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-[15px] font-semibold mb-1">{ar ? "اختر النوع الفرعي" : "Choose subtype"}</h3>
            <p className="text-[12.5px] text-muted-foreground mb-4">{ar ? `${tx(category?.name, lang)} · ${tx(family?.name, lang)}` : `${tx(category?.name, lang)} · ${tx(family?.name, lang)}`}</p>
          </div>
          <CardGrid
            items={(family?.subtypes || []).map((s) => ({ id: s.id, label: tx(s.name, lang), sub: s.code, color: "bg-teal-100 dark:bg-teal-500/10" }))}
            selected={d.subtypeId}
            onSelect={(id) => {
              const cat = categoryById(d.categoryId); const fam = familyById(d.familyId); const sub = subtypeById(d.familyId, id);
              setD({ ...d, subtypeId: id, name: d.name || `${cat?.name.en} ${sub?.name.en}`, nameAr: d.nameAr || `${sub?.name.ar} ${cat?.name.ar}` });
            }}
            columns={3}
          />
        </div>
      )}

      {/* Step 3: Details */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-[15px] font-semibold mb-1">{ar ? "بيانات المادة" : "Material details"}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-[12px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg">{category?.code}{family?.code}{subtype?.code}</span>
              <span className="text-[12px] text-muted-foreground">{ar ? "الكود الأساسي" : "Base code"}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">{ar ? "الاسم (EN)" : "Name (EN)"}</label>
              <input className={inputCls} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} placeholder="Bags Nylon zipper" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">{ar ? "الاسم (AR)" : "Name (AR)"}</label>
              <input className={inputCls} dir="rtl" value={d.nameAr} onChange={(e) => setD({ ...d, nameAr: e.target.value })} placeholder="سوستة نايلون شنط" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">{ar ? "المورّد" : "Supplier"}</label>
              <input className={inputCls} value={d.supplier} onChange={(e) => setD({ ...d, supplier: e.target.value })} placeholder="YKK Egypt" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">{ar ? "وحدة القياس" : "Unit"}</label>
              <select className={selectCls} value={d.unitEn} onChange={(e) => { const u = family?.units.find((x) => x.en === e.target.value); setD({ ...d, unitEn: u?.en || e.target.value, unitAr: u?.ar || d.unitAr }); }}>
                {family?.units.map((u) => <option key={u.en} value={u.en}>{ar ? u.ar : u.en}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">{ar ? "الوصف" : "Description"}</label>
              <textarea className={inputCls + " h-16 py-2 resize-none"} value={ar ? d.descriptionAr : d.description} onChange={(e) => setD(ar ? { ...d, descriptionAr: e.target.value } : { ...d, description: e.target.value })} dir={ar ? "rtl" : "ltr"} placeholder={ar ? "وصف المادة..." : "Describe the material..."} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">{ar ? "صور المادة" : "Material images"}</label>
              <div className="flex gap-2 flex-wrap">
                {d.images.map((img, i) => (
                  <div key={i} className="relative group w-14 h-14 rounded-xl overflow-hidden border border-border/50">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setD({ ...d, images: d.images.filter((_, j) => j !== i) })}
                      className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <X size={12} className="text-white" />
                    </button>
                  </div>
                ))}
                <label className="w-14 h-14 rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center text-muted-foreground/40 hover:border-primary/40 hover:text-primary transition cursor-pointer">
                  <Upload size={14} />
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => {
                    const files = e.target.files; if (!files) return;
                    const imgs = [...d.images];
                    Array.from(files).forEach((f) => { const r = new FileReader(); r.onload = () => { imgs.push(r.result as string); setD((prev) => ({ ...prev, images: imgs })); }; r.readAsDataURL(f); });
                  }} />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Colours & Variants */}
      {step === 4 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-[15px] font-semibold mb-1">{ar ? "الألوان والمتغيرات" : "Colours & Variants"}</h3>
            <p className="text-[12.5px] text-muted-foreground">{ar ? "اختر الألوان والمقاسات ثم اضغط توليد لإنشاء المتغيرات" : "Select colours and sizes, then tap Generate to create variants"}</p>
          </div>

          {/* Sizes */}
          {family && family.sizes.length > 0 && (
            <div>
              <p className="text-[11px] font-medium text-muted-foreground mb-2">{tx(family.sizeLabel, lang) || (ar ? "المقاسات" : "Sizes")}</p>
              <div className="flex gap-2 flex-wrap">
                {family.sizes.map((s) => {
                  const on = selSizes.includes(s.id);
                  return (
                    <button key={s.id} type="button" onClick={() => setSelSizes(toggleIn(s.id))}
                      className={`relative px-4 py-2 rounded-xl border-2 text-[12.5px] font-medium transition-all ${on ? "border-primary bg-primary/5 text-foreground shadow-sm" : "border-border/50 text-muted-foreground hover:border-border"}`}>
                      {on && <Check size={11} className="absolute top-1 end-1 text-primary" />}
                      {tx(s.label, lang)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Colours */}
          {family && family.colour !== "none" && (
            <ColourGrid
              colours={coloursFor(family.colour)}
              selected={selColours}
              onToggle={(id) => setSelColours(toggleIn(id))}
              lang={lang}
              colorCodes={family.colour === "zipper"}
              selectedCode={selColorCode}
              onCodeSelect={(code, index) => { setSelColorCode(code); setSelIndexNo(index); }}
            />
          )}

          {/* Cost / Stock */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">{ar ? "التكلفة/وحدة" : "Cost / unit"}</label>
              <input type="number" className={inputCls} value={defCost || ""} onChange={(e) => setDefCost(Number(e.target.value))} placeholder="0.00" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">{ar ? "المخزون" : "Stock"}</label>
              <input type="number" className={inputCls} value={defStock || ""} onChange={(e) => setDefStock(Number(e.target.value))} placeholder="0" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">{ar ? "حد إعادة الطلب" : "Reorder pt"}</label>
              <input type="number" className={inputCls} value={defReorder || ""} onChange={(e) => setDefReorder(Number(e.target.value))} placeholder="0" />
            </div>
          </div>

          {/* Generate button */}
          {family && (
            <button type="button" onClick={generateVariants}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-[13px] font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98]">
              <Wand2 size={16} />{ar ? "توليد المتغيرات" : "Generate variants"}
              {selSizes.length > 0 && selColours.length > 0 && <span className="text-primary-foreground/70">({selSizes.length}×{selColours.length} = {selSizes.length * selColours.length})</span>}
            </button>
          )}

          {/* Generated variants table */}
          {d.variants.length > 0 && (
            <div className="rounded-xl border border-border/50 overflow-hidden">
              <div className="px-3 py-2 bg-muted/30 border-b border-border/50 flex items-center justify-between">
                <span className="text-[12px] font-semibold">{ar ? `${d.variants.length} متغيرات` : `${d.variants.length} variants`}</span>
                <button type="button" className="text-[11px] text-red-500 hover:text-red-600 font-medium" onClick={() => setD({ ...d, variants: [] })}>{ar ? "مسح الكل" : "Clear all"}</button>
              </div>
              <div className="max-h-[200px] overflow-y-auto">
                <table className="w-full text-[11px]">
                  <thead className="bg-muted/20 sticky top-0">
                    <tr>
                      <th className="px-2.5 py-1.5 text-start font-medium">{ar ? "اللون" : "Colour"}</th>
                      <th className="px-2.5 py-1.5 text-start font-medium">{ar ? "المقاس" : "Size"}</th>
                      <th className="px-2.5 py-1.5 text-start font-medium">{ar ? "الكود" : "SKU"}</th>
                      {family?.colour === "zipper" && <th className="px-2.5 py-1.5 text-start font-medium">{ar ? "كود اللون" : "Code"}</th>}
                      <th className="px-2.5 py-1.5 text-end font-medium">{ar ? "التكلفة" : "Cost"}</th>
                      <th className="px-2.5 py-1.5 text-end font-medium">{ar ? "المخزون" : "Stock"}</th>
                      <th className="px-2.5 py-1.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {d.variants.map((v) => (
                      <tr key={v.id} className="hover:bg-muted/20">
                        <td className="px-2.5 py-1.5">
                          <div className="flex items-center gap-1.5">
                            {v.colourHex && <span className="w-4 h-4 rounded border border-border/50 shrink-0" style={{ backgroundColor: v.colourHex }} />}
                            <span>{v.colourName ? tx(v.colourName, lang) : "—"}</span>
                          </div>
                        </td>
                        <td className="px-2.5 py-1.5">{v.sizeCode || "—"}</td>
                        <td className="px-2.5 py-1.5 font-mono">{v.sku}</td>
                        {family?.colour === "zipper" && <td className="px-2.5 py-1.5">{v.colorNo ? <span className="font-mono text-primary font-semibold">{v.colorNo}</span> : "—"}</td>}
                        <td className="px-2.5 py-1.5 text-end">{v.cost}</td>
                        <td className="px-2.5 py-1.5 text-end">{v.stock}</td>
                        <td className="px-2.5 py-1.5"><button className="text-muted-foreground hover:text-red-500 transition" onClick={() => setD({ ...d, variants: d.variants.filter((x) => x.id !== v.id) })}><Trash2 size={11} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
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
    <div className={cardCls + " overflow-hidden hover:shadow-md transition-shadow"}>
      {images.length > 0 && (
        <div className="flex gap-1 p-2 bg-muted/20 overflow-x-auto">
          {images.slice(0, 5).map((img: string, i: number) => (
            <img key={i} src={img} alt="" className="w-10 h-10 rounded-lg object-cover border border-border/50 shrink-0" />
          ))}
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={chipCls}>{tx(cat?.name, lang)}</span>
              <span className="font-mono text-[11px] font-bold text-primary">{rm.baseCode}</span>
              {lowCount > 0 && <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-amber-600"><AlertTriangle size={12} />{lowCount}</span>}
            </div>
            <p className="text-[14px] font-semibold text-foreground truncate">{ar ? (rm.nameAr || rm.name) : rm.name}</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">{tx(fam?.name, lang)} · {tx(sub?.name, lang)}{rm.supplier ? ` · ${rm.supplier}` : ""}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button className={btnGhost} onClick={() => onEdit(rm)}><Edit3 size={14} /></button>
            <button className={btnGhost} onClick={() => { if (confirm(ar ? "حذف؟" : "Delete?")) removeRawMaterial(rm.id); }}><Trash2 size={14} /></button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="rounded-lg bg-muted/40 px-2 py-1.5"><p className="text-[9.5px] uppercase text-muted-foreground/70">{ar ? "متغيرات" : "Variants"}</p><p className="text-[13px] font-semibold">{rm.variants.length}</p></div>
          <div className="rounded-lg bg-muted/40 px-2 py-1.5"><p className="text-[9.5px] uppercase text-muted-foreground/70">{ar ? "المخزون" : "Stock"}</p><p className="text-[13px] font-semibold">{totalStock.toLocaleString()}</p></div>
          <div className="rounded-lg bg-muted/40 px-2 py-1.5"><p className="text-[9.5px] uppercase text-muted-foreground/70">{ar ? "متوسط التكلفة" : "Avg cost"}</p><p className="text-[13px] font-semibold">{money(avgCost, lang)}</p></div>
        </div>
      </div>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between px-4 py-2 border-t border-border/50 text-[12px] text-muted-foreground hover:bg-muted/40 transition">
        <span className="flex items-center gap-1.5">{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}{ar ? "المتغيرات" : "Variants"}</span>
        <span className="flex -space-x-1">{rm.variants.slice(0, 6).map((v) => v.colourHex ? <span key={v.id} className="w-4 h-4 rounded-full border-2 border-background" style={{ backgroundColor: v.colourHex }} /> : null)}</span>
      </button>
      {open && (
        <div className="overflow-x-auto border-t border-border/50">
          <table className="w-full text-[11px]">
            <thead className="bg-muted/30 text-muted-foreground"><tr><th className="px-3 py-1.5 text-start font-medium">{ar ? "اللون" : "Colour"}</th><th className="px-3 py-1.5 text-start font-medium">SKU</th><th className="px-3 py-1.5 text-end font-medium">{ar ? "التكلفة" : "Cost"}</th><th className="px-3 py-1.5 text-end font-medium">{ar ? "المخزون" : "Stock"}</th></tr></thead>
            <tbody className="divide-y divide-border/30">
              {rm.variants.map((v) => (
                <tr key={v.id} className="hover:bg-muted/20">
                  <td className="px-3 py-1.5"><div className="flex items-center gap-1.5">{v.colourHex && <span className="w-3.5 h-3.5 rounded border border-border/50" style={{ backgroundColor: v.colourHex }} />}{v.colourName ? tx(v.colourName, lang) : "—"}{v.sizeCode && ` · ${v.sizeCode}`}</div></td>
                  <td className="px-3 py-1.5 font-mono">{v.sku}</td>
                  <td className="px-3 py-1.5 text-end">{money(v.cost, lang)}</td>
                  <td className={`px-3 py-1.5 text-end ${v.reorderPoint > 0 && v.stock <= v.reorderPoint ? "text-amber-600 font-semibold" : ""}`}>{v.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
    return r.name.toLowerCase().includes(q) || (r.nameAr || "").includes(search) || r.baseCode.toLowerCase().includes(q);
  }), [rawMaterials, search, cat]);

  return (
    <div className="p-5 sm:p-6 max-w-[1200px] mx-auto">
      <PageHeader icon={<Layers size={18} />}
        title="Raw Materials" titleAr="المواد الخام"
        subtitle="Zippers, fabrics, hardware — with auto SKUs & variant matrix" subtitleAr="سوست، أقمشة، إكسسوارات — بأكواد ومتغيرات تلقائية"
        actions={<>
          <button className={btnSecondary} onClick={() => fileRef.current?.click()}><Upload size={14} />{ar ? "استيراد" : "Import"}</button>
          <button className={btnSecondary} onClick={() => exportCSV(filtered)}><Download size={14} />{ar ? "تصدير" : "Export"}</button>
          <button className={btnPrimary} onClick={() => { setEditing(null); setModal(true); }}><Plus size={15} />{ar ? "إضافة مادة خام" : "Add Raw Material"}</button>
        </>}
      />
      <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={() => {}} />

      {alerts.length > 0 && (
        <div className="mb-5 rounded-2xl border border-amber-300/50 bg-amber-50/60 dark:bg-amber-500/5 p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0"><AlertTriangle size={16} /></div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold">{alerts.length} {ar ? "متغيّر تحت حد إعادة الطلب" : "variants below reorder point"}</p>
              <p className="text-[12px] text-muted-foreground mt-0.5 truncate">{alerts.slice(0, 3).map((a) => `${a.rm.name} · ${a.variant.sku}`).join(" · ")}</p>
            </div>
            <button className={btnSecondary + " shrink-0"} onClick={() => navigate("/procurement?suggest=1")}><ShoppingCart size={13} />{ar ? "أمر شراء" : "Create PO"}</button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
          <input className={inputCls + " ps-9"} placeholder={ar ? "بحث..." : "Search..."} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className={selectCls + " w-auto min-w-[140px]"} value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">{ar ? "كل الفئات" : "All categories"}</option>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{tx(c.name, lang)}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className={cardCls}>
          <EmptyState icon={<Package size={20} />} title="No raw materials yet" titleAr="لا توجد مواد خام بعد"
            hint="Add zippers, fabrics and hardware — each with colours, sizes and auto codes." hintAr="أضف السوست والأقمشة والإكسسوارات — بألوان ومقاسات وأكواد تلقائية."
            action={<button className={btnPrimary} onClick={() => { setEditing(null); setModal(true); }}><Plus size={15} />{ar ? "إضافة" : "Add"}</button>} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((rm) => <RawMaterialCard key={rm.id} rm={rm} onEdit={(r) => { setEditing(r); setModal(true); }} />)}
        </div>
      )}

      <RawMaterialWizard open={modal} onClose={() => setModal(false)} editing={editing} />
    </div>
  );
}

function exportCSV(data: RawMaterial[]) {
  if (data.length === 0) return;
  const rows = data.map((r) => ({ name: r.name, nameAr: r.nameAr, category: r.categoryId, family: r.familyId, subtype: r.subtypeId, supplier: r.supplier, baseCode: r.baseCode, variants: r.variants.length }));
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => JSON.stringify((r as any)[h] ?? "")).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "raw-materials.csv"; a.click();
  URL.revokeObjectURL(url);
}
