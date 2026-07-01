/**
 * Product Templates Studio — Visual Gallery Template Selector
 * استوديو قوالب المنتجات — معرض بصري لاختيار القالب
 *
 * Beautiful gallery of fashion templates with preview cards.
 * Each template shows: default BOM, stages, estimated cost/duration.
 */

import { useState, useMemo } from "react";
import { useLanguage } from "../context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Check, Clock, DollarSign, Layers, Wrench,
  Scissors, X, Zap, Archive,
  Shirt, Gem, Scissors as ScissorsIcon, Footprints,
  Sparkles, Crown, Heart, Star,
} from "lucide-react";
import {
  PRODUCT_TEMPLATES, type ProductTemplate, type MfgStage,
  calculateTotalCost,
} from "../lib/furniture-engine";

interface Props {
  onSelect: (template: ProductTemplate) => void;
  onClose: () => void;
  onScratch: () => void;
}

const TEMPLATE_META: Record<string, {
  icon: React.ElementType;
  color: string;
  gradient: string;
  estimatedDays: string;
  estimatedLabor: string;
  estimatedWaste: string;
}> = {
  dress:          { icon: Shirt,     color: "#8C6FAE", gradient: "from-violet-500 to-purple-600", estimatedDays: "3–5 days", estimatedLabor: "2–4 workers", estimatedWaste: "5–8%" },
  suit:           { icon: Crown,     color: "#2D3139", gradient: "from-slate-600 to-zinc-800", estimatedDays: "5–8 days", estimatedLabor: "3–5 workers", estimatedWaste: "4–7%" },
  tshirt:         { icon: Shirt,     color: "#10B981", gradient: "from-emerald-500 to-teal-600", estimatedDays: "1–2 days", estimatedLabor: "1–2 workers", estimatedWaste: "4–6%" },
  trousers:       { icon: Scissors,  color: "#3B82F6", gradient: "from-blue-500 to-indigo-600", estimatedDays: "2–3 days", estimatedLabor: "1–2 workers", estimatedWaste: "5–7%" },
  outerwear:      { icon: Heart,     color: "#F97316", gradient: "from-orange-500 to-red-600", estimatedDays: "4–6 days", estimatedLabor: "2–3 workers", estimatedWaste: "5–8%" },
  bridal:         { icon: Sparkles,  color: "#EC4899", gradient: "from-pink-500 to-rose-600", estimatedDays: "7–14 days", estimatedLabor: "3–5 workers", estimatedWaste: "6–10%" },
  activewear:     { icon: Zap,       color: "#0EA5E9", gradient: "from-sky-500 to-blue-600", estimatedDays: "1–2 days", estimatedLabor: "1–2 workers", estimatedWaste: "4–6%" },
  accessories:    { icon: Gem,       color: "#F59E0B", gradient: "from-amber-500 to-orange-600", estimatedDays: "2–3 days", estimatedLabor: "1–2 workers", estimatedWaste: "3–5%" },
  custom_garment: { icon: Wrench,    color: "#94A3B8", gradient: "from-slate-400 to-slate-600", estimatedDays: "Varies", estimatedLabor: "Varies", estimatedWaste: "Varies" },
};

export default function ProductTemplatesStudio({ onSelect, onClose, onScratch }: Props) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState<string | null>(null);

  const selected = PRODUCT_TEMPLATES.find(t => t.key === selectedKey);
  const preview = PRODUCT_TEMPLATES.find(t => t.key === previewKey);
  const previewMeta = previewKey ? TEMPLATE_META[previewKey] : null;

  const previewStages = useMemo(() => {
    if (!preview) return [];
    return preview.stages();
  }, [previewKey]);

  const previewCost = useMemo(() => {
    if (!previewStages.length && !preview?.suggestedBOM.length) return null;
    const materialCost = (preview?.suggestedBOM || []).reduce((s, b) => s + b.qty * b.costPerUnit, 0);
    const laborCost = previewStages.reduce((s, st) => s + st.labor_cost, 0);
    const machineCost = previewStages.reduce((s, st) => s + st.machine_cost, 0);
    const overheadCost = previewStages.reduce((s, st) => s + st.overhead_cost, 0);
    return { materialCost, laborCost, machineCost, overheadCost, total: materialCost + laborCost + machineCost + overheadCost };
  }, [preview, previewStages]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-background rounded-3xl border border-border/40 shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-7 py-5 border-b border-border/30 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-[20px] font-bold tracking-tight" style={{ fontFamily: "var(--app-font-serif)", letterSpacing: "-0.02em" }}>
              {ar ? "استوديو القوالب" : "Product Templates Studio"}
            </h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {ar ? "اختار قالب جاهز — كل قالب يحتوي على مكونات ومراحل تصنيع وتكاليف" : "Choose a template — each includes BOM, stages, and cost estimates"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onScratch && (
              <button
                onClick={onScratch}
                className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-border/50 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <Package size={13} />
                {ar ? "ابدأ من الصفر" : "Start from Scratch"}
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted/50 transition-colors">
              <X size={18} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Template Gallery */}
          <div className={`flex-1 overflow-y-auto p-6 ${previewKey ? "hidden md:block" : ""}`}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {PRODUCT_TEMPLATES.map((tmpl, i) => {
                const meta = TEMPLATE_META[tmpl.key] || TEMPLATE_META.custom_garment;
                const Icon = meta.icon;
                const isSelected = selectedKey === tmpl.key;
                const isPreviewing = previewKey === tmpl.key;

                return (
                  <div
                    key={tmpl.key}
                    onClick={() => setPreviewKey(tmpl.key)}
                    className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-100 hover:scale-[1.02] hover:-translate-y-0.5 ${
                      isPreviewing ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" :
                      isSelected ? "border-emerald-500 bg-emerald-50/50" :
                      "border-border/30 hover:border-border/60 bg-background"
                    }`}
                  >
                    {isSelected && (
                      <div
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center z-10"
                      >
                        <Check size={12} className="text-white" strokeWidth={3} />
                      </div>
                    )}

                    <div className={`w-12 h-12 rounded-xl mb-3 flex items-center justify-center bg-gradient-to-br ${meta.gradient}`}>
                      <Icon size={22} className="text-white" />
                    </div>
                    <p className="text-[13px] font-semibold mb-0.5">{ar ? tmpl.ar : tmpl.en}</p>
                    <p className="text-[10px] text-muted-foreground">{tmpl.category}</p>

                    <div className="flex items-center gap-2 mt-2.5">
                      <span className="text-[9px] text-muted-foreground/60 flex items-center gap-0.5">
                        <Clock size={8} /> {meta.estimatedDays}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preview panel */}
          <AnimatePresence>
            {previewKey && preview && previewMeta && (
              <motion.div
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-full md:w-[380px] border-l border-border/30 overflow-y-auto bg-muted/10 shrink-0"
              >
                <div className="p-6 space-y-5">
                  {/* Template header */}
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${previewMeta.gradient}`}>
                      <previewMeta.icon size={26} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-[16px] font-bold">{ar ? preview.ar : preview.en}</h3>
                      <p className="text-[11px] text-muted-foreground">{preview.category}</p>
                    </div>
                  </div>

                  {/* Quick stats */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: ar ? "المدة" : "Duration", value: previewMeta.estimatedDays, icon: Clock },
                      { label: ar ? "العمالة" : "Labor", value: previewMeta.estimatedLabor, icon: Wrench },
                      { label: ar ? "الهدر" : "Waste", value: previewMeta.estimatedWaste, icon: Scissors },
                    ].map((stat, i) => (
                      <div key={i} className="p-2.5 rounded-xl border border-border/30 text-center">
                        <stat.icon size={12} className="text-muted-foreground/40 mx-auto mb-1" />
                        <p className="text-[10px] font-semibold">{stat.value}</p>
                        <p className="text-[8px] text-muted-foreground">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* BOM Preview */}
                  {preview.suggestedBOM.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground tracking-[0.06em] uppercase mb-2 flex items-center gap-1">
                        <Layers size={9} /> {ar ? "المكونات الافتراضية" : "Default BOM"}
                      </p>
                      <div className="space-y-1.5">
                        {preview.suggestedBOM.map((bom, i) => (
                          <div key={i} className="flex items-center justify-between text-[10.5px] px-2.5 py-1.5 rounded-lg bg-background border border-border/20">
                            <span className="text-muted-foreground truncate max-w-[160px]">{bom.material}</span>
                            <span className="font-medium tabular-nums">{bom.qty} {bom.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stages Preview */}
                  {previewStages.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground tracking-[0.06em] uppercase mb-2 flex items-center gap-1">
                        <Wrench size={9} /> {ar ? "مراحل التصنيع" : "Manufacturing Stages"}
                      </p>
                      <div className="space-y-0">
                        {previewStages.map((stage, i) => (
                          <div key={stage.id}>
                            <div className="flex items-center gap-2.5 py-1.5">
                              <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary">
                                {i + 1}
                              </div>
                              <span className="text-[10.5px] font-medium flex-1">{ar ? (stage.name_ar || stage.name) : stage.name}</span>
                              <span className="text-[9px] text-muted-foreground">{stage.duration_hours}h</span>
                            </div>
                            {i < previewStages.length - 1 && (
                              <div className="ml-2.5 h-2 border-l border-dashed border-border/30" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cost estimate */}
                  {previewCost && previewCost.total > 0 && (
                    <div className="p-3 rounded-xl border border-border/30 bg-background">
                      <p className="text-[10px] font-semibold text-muted-foreground tracking-[0.06em] uppercase mb-2 flex items-center gap-1">
                        <DollarSign size={9} /> {ar ? "التكلفة التقديرية" : "Estimated Cost"}
                      </p>
                      <div className="space-y-1 text-[10.5px]">
                        <div className="flex justify-between"><span className="text-muted-foreground">{ar ? "خامات" : "Materials"}</span><span className="font-medium tabular-nums">{previewCost.materialCost.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">{ar ? "عمالة" : "Labor"}</span><span className="font-medium tabular-nums">{previewCost.laborCost.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">{ar ? "ماكينات" : "Machine"}</span><span className="font-medium tabular-nums">{previewCost.machineCost.toLocaleString()}</span></div>
                        <div className="h-px bg-border/30 my-1" />
                        <div className="flex justify-between font-semibold">
                          <span>{ar ? "الإجمالي" : "Total"}</span>
                          <span className="text-primary tabular-nums">{previewCost.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Select button */}
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setSelectedKey(previewKey);
                      onSelect(preview);
                    }}
                    className="w-full py-3 rounded-2xl bg-primary text-primary-foreground text-[13px] font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                  >
                    <Zap size={14} />
                    {ar ? `استخدم قالب ${preview.ar}` : `Use ${preview.en} Template`}
                  </motion.button>

                  {/* Back on mobile */}
                  <button
                    onClick={() => setPreviewKey(null)}
                    className="w-full md:hidden text-center text-[12px] text-muted-foreground hover:text-foreground py-2"
                  >
                    {ar ? "← رجوع للمعرض" : "← Back to gallery"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
