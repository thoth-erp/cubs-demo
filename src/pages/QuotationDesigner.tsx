/**
 * Quotation Designer — Drag & Drop Template Builder + PDF Export
 *
 * مصمم عروض الأسعار — منشئ القوالب بالسحب والإفلات + تصدير PDF
 *
 * Users drag blocks (header, line items, totals, logo, text, terms, signature)
 * onto a canvas to design branded quotation layouts.
 * Templates can be saved, loaded, and used to generate printable PDFs.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import {
  type EntityType, type CodeSettings,
  loadCodeSettings, previewCode, ENTITY_LABELS,
} from "../lib/code-generator";
import {
  ArrowLeft, Plus, Trash2, Download, Save, Eye, Type, Image as ImageIcon,
  Table, Hash, FileText, PenTool, Minus, GripVertical, Settings,
  Palette, ChevronDown, CheckCircle2, LayoutTemplate, Sparkles,
  Move, RotateCcw, Copy, AlignLeft, AlignCenter, AlignRight,
  X, Loader2,
} from "lucide-react";
import { Link } from "wouter";

// ─── Block Types ─────────────────────────────────────────

type BlockType =
  | "header"
  | "logo"
  | "line_items_table"
  | "totals"
  | "text_block"
  | "terms"
  | "signature"
  | "divider"
  | "image"
  | "customer_info"
  | "spacer";

interface BlockConfig {
  id: string;
  type: BlockType;
  x: number;
  y: number;
  width: number;
  height: number;
  style: BlockStyle;
  content?: string;
  visible?: boolean;
}

interface BlockStyle {
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  bgColor?: string;
  textAlign?: "left" | "center" | "right";
  padding?: number;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
}

interface QuotationTemplate {
  id: string;
  name: string;
  nameAr: string;
  blocks: BlockConfig[];
  pageWidth: number;
  pageHeight: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Constants ───────────────────────────────────────────

const BLOCK_TYPES: { type: BlockType; icon: React.ElementType; label: string; labelAr: string; defaultW: number; defaultH: number }[] = [
  { type: "header",           icon: Type,           label: "Header",          labelAr: "العنوان",       defaultW: 520, defaultH: 80 },
  { type: "logo",             icon: ImageIcon,      label: "Logo",            labelAr: "الشعار",        defaultW: 120, defaultH: 60 },
  { type: "customer_info",    icon: FileText,       label: "Customer Info",   labelAr: "بيانات العميل", defaultW: 260, defaultH: 120 },
  { type: "line_items_table", icon: Table,          label: "Line Items",      labelAr: "البنود",        defaultW: 520, defaultH: 200 },
  { type: "totals",           icon: Hash,           label: "Totals",          labelAr: "المجاميع",      defaultW: 280, defaultH: 140 },
  { type: "text_block",       icon: Type,           label: "Text Block",      labelAr: "نص",            defaultW: 300, defaultH: 80 },
  { type: "terms",            icon: FileText,       label: "Terms & Cond.",   labelAr: "الشروط",        defaultW: 520, defaultH: 100 },
  { type: "signature",        icon: PenTool,        label: "Signature",       labelAr: "التوقيع",      defaultW: 200, defaultH: 80 },
  { type: "divider",          icon: Minus,          label: "Divider",         labelAr: "فاصل",          defaultW: 520, defaultH: 2 },
  { type: "image",            icon: ImageIcon,      label: "Image",           labelAr: "صورة",          defaultW: 200, defaultH: 150 },
  { type: "spacer",           icon: Move,           label: "Spacer",          labelAr: "مسافة",         defaultW: 520, defaultH: 30 },
];

const DEFAULT_STYLE: BlockStyle = {
  fontSize: 13,
  fontWeight: "normal",
  color: "#1a1a1a",
  bgColor: "transparent",
  textAlign: "left",
  padding: 8,
  borderRadius: 0,
  borderWidth: 0,
  borderColor: "#e5e5e5",
};

const TEMPLATE_STORAGE_KEY = "thoth_quotation_templates";

const COLORS = ["#1a1a1a", "#ffffff", "#f8f9fa", "#e9ecef", "#dee2e6", "#0d6efd", "#198754", "#dc3545", "#ffc107", "#6f42c1", "#0dcaf0", "#fd7e14"];

// ─── Helpers ─────────────────────────────────────────────

function uid(): string {
  return `b_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadTemplates(): QuotationTemplate[] {
  try {
    const raw = localStorage.getItem(TEMPLATE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveTemplates(templates: QuotationTemplate[]): void {
  localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templates));
}

function getDefaultBlocks(): BlockConfig[] {
  const codeSettings = loadCodeSettings();
  return [
    { id: uid(), type: "header", x: 20, y: 20, width: 520, height: 70, style: { ...DEFAULT_STYLE, fontSize: 22, fontWeight: "bold", textAlign: "center", bgColor: "#0d6efd", color: "#ffffff" }, content: "QUOTATION", visible: true },
    { id: uid(), type: "logo", x: 20, y: 100, width: 100, height: 50, style: { ...DEFAULT_STYLE }, content: "", visible: true },
    { id: uid(), type: "customer_info", x: 300, y: 100, width: 240, height: 110, style: { ...DEFAULT_STYLE, fontSize: 11 }, visible: true },
    { id: uid(), type: "line_items_table", x: 20, y: 220, width: 520, height: 180, style: { ...DEFAULT_STYLE, fontSize: 11 }, visible: true },
    { id: uid(), type: "totals", x: 300, y: 410, width: 240, height: 120, style: { ...DEFAULT_STYLE, fontSize: 12 }, visible: true },
    { id: uid(), type: "terms", x: 20, y: 540, width: 520, height: 80, style: { ...DEFAULT_STYLE, fontSize: 10, color: "#666666" }, content: "Payment: 50% advance, 50% on delivery. Valid for 30 days.", visible: true },
    { id: uid(), type: "signature", x: 20, y: 630, width: 240, height: 70, style: { ...DEFAULT_STYLE, fontSize: 11 }, visible: true },
    { id: uid(), type: "divider", x: 20, y: 710, width: 520, height: 2, style: { ...DEFAULT_STYLE, bgColor: "#dee2e6" }, visible: true },
  ];
}

// ─── Block Renderer ──────────────────────────────────────

function BlockRenderer({ block, isSelected, onClick, codeSettings }: {
  block: BlockConfig; isSelected: boolean; onClick: () => void; codeSettings: CodeSettings;
}) {
  if (!block.visible) return null;

  const baseStyle: React.CSSProperties = {
    position: "absolute",
    left: block.x,
    top: block.y,
    width: block.width,
    height: block.height,
    fontSize: block.style.fontSize,
    fontWeight: block.style.fontWeight as any,
    color: block.style.color,
    backgroundColor: block.style.bgColor,
    textAlign: block.style.textAlign,
    padding: block.style.padding,
    borderRadius: block.style.borderRadius,
    border: block.style.borderWidth ? `${block.style.borderWidth}px solid ${block.style.borderColor}` : "none",
    cursor: "pointer",
    transition: "box-shadow 0.15s",
    zIndex: isSelected ? 20 : 1,
    boxShadow: isSelected ? "0 0 0 2px #0d6efd" : "none",
  };

  function renderContent() {
    switch (block.type) {
      case "header":
        return (
          <div className="flex items-center justify-center h-full">
            <span className="font-semibold">{block.content || "QUOTATION"}</span>
          </div>
        );
      case "logo":
        return (
          <div className="flex items-center justify-center h-full border-2 border-dashed border-border/40 rounded-lg text-[10px] text-muted-foreground">
            {block.content ? <img src={block.content} alt="Logo" className="max-h-full object-contain" /> : "Logo"}
          </div>
        );
      case "customer_info":
        return (
          <div className="h-full text-[10px] leading-relaxed">
            <p className="font-semibold text-[11px] mb-1">Customer Details</p>
            <p>Name: ____________________</p>
            <p>Company: _________________</p>
            <p>Phone: ___________________</p>
            <p>Email: ___________________</p>
            <p>Address: _________________</p>
          </div>
        );
      case "line_items_table":
        return (
          <div className="h-full overflow-hidden">
            <table className="w-full text-[10px] border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-1.5 border border-border/30">#</th>
                  <th className="text-left p-1.5 border border-border/30">Product</th>
                  <th className="text-center p-1.5 border border-border/30">Qty</th>
                  <th className="text-right p-1.5 border border-border/30">Price</th>
                  <th className="text-right p-1.5 border border-border/30">Total</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4].map(i => (
                  <tr key={i} className="hover:bg-muted/20">
                    <td className="p-1.5 border border-border/30">{i}</td>
                    <td className="p-1.5 border border-border/30">Product name here</td>
                    <td className="text-center p-1.5 border border-border/30">1</td>
                    <td className="text-right p-1.5 border border-border/30">1,000</td>
                    <td className="text-right p-1.5 border border-border/30">1,000</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "totals":
        return (
          <div className="h-full p-2 space-y-1.5 text-[11px]">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">4,000</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Discount (10%)</span><span className="text-rose-500">-400</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tax (14%)</span><span>504</span></div>
            <div className="border-t border-border/30 pt-1.5 flex justify-between font-semibold text-[12px]"><span>Grand Total</span><span className="text-primary">4,104</span></div>
          </div>
        );
      case "text_block":
        return (
          <div className="h-full flex items-start">
            <p>{block.content || "Enter your text here..."}</p>
          </div>
        );
      case "terms":
        return (
          <div className="h-full">
            <p className="font-semibold text-[11px] mb-1">Terms & Conditions</p>
            <p className="text-[9px] leading-relaxed text-muted-foreground">
              {block.content || "Payment terms, warranty, delivery conditions..."}
            </p>
          </div>
        );
      case "signature":
        return (
          <div className="h-full flex flex-col justify-end">
            <div className="border-t border-border/40 pt-1 mt-8">
              <p className="text-[10px] text-muted-foreground">Authorized Signature</p>
              <p className="text-[9px] text-muted-foreground/60">Date: _______________</p>
            </div>
          </div>
        );
      case "divider":
        return <div className="w-full h-full bg-border/40" />;
      case "image":
        return (
          <div className="flex items-center justify-center h-full border-2 border-dashed border-border/40 rounded-lg text-[10px] text-muted-foreground">
            {block.content ? <img src={block.content} alt="" className="max-h-full object-contain" /> : "Image"}
          </div>
        );
      case "spacer":
        return <div className="w-full h-full bg-primary/5 border border-dashed border-primary/20" />;
      default:
        return null;
    }
  }

  return (
    <div style={baseStyle} onClick={onClick}>
      {renderContent()}
    </div>
  );
}

// ─── Property Panel ──────────────────────────────────────

function PropertyPanel({ block, onUpdate, onClose, codeSettings, ar }: {
  block: BlockConfig | null;
  onUpdate: (id: string, patch: Partial<BlockConfig>) => void;
  onClose: () => void;
  codeSettings: CodeSettings;
  ar: boolean;
}) {
  if (!block) return null;

  function updateStyle(patch: Partial<BlockStyle>) {
    onUpdate(block!.id, { style: { ...block!.style, ...patch } });
  }

  return (
    <div className="w-[280px] border-l border-border/40 bg-background overflow-auto">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-medium">{ar ? "خصائص" : "Properties"}</h3>
          <button onClick={onClose} className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted"><X size={12} /></button>
        </div>

        {/* Position */}
        <div>
          <p className="text-[10px] text-muted-foreground mb-2">{ar ? "الموضع والحجم" : "Position & Size"}</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] text-muted-foreground/60">X</label>
              <input type="number" value={block.x} onChange={e => onUpdate(block!.id, { x: parseInt(e.target.value) || 0 })} className="h-7 px-2 rounded-lg border border-border/50 bg-background text-[11px] w-full" />
            </div>
            <div>
              <label className="text-[9px] text-muted-foreground/60">Y</label>
              <input type="number" value={block.y} onChange={e => onUpdate(block!.id, { y: parseInt(e.target.value) || 0 })} className="h-7 px-2 rounded-lg border border-border/50 bg-background text-[11px] w-full" />
            </div>
            <div>
              <label className="text-[9px] text-muted-foreground/60">{ar ? "العرض" : "Width"}</label>
              <input type="number" value={block.width} onChange={e => onUpdate(block!.id, { width: parseInt(e.target.value) || 100 })} className="h-7 px-2 rounded-lg border border-border/50 bg-background text-[11px] w-full" />
            </div>
            <div>
              <label className="text-[9px] text-muted-foreground/60">{ar ? "الارتفاع" : "Height"}</label>
              <input type="number" value={block.height} onChange={e => onUpdate(block!.id, { height: parseInt(e.target.value) || 50 })} className="h-7 px-2 rounded-lg border border-border/50 bg-background text-[11px] w-full" />
            </div>
          </div>
        </div>

        {/* Text Content */}
        {(block.type === "header" || block.type === "text_block" || block.type === "terms") && (
          <div>
            <p className="text-[10px] text-muted-foreground mb-2">{ar ? "المحتوى" : "Content"}</p>
            <textarea
              value={block.content || ""}
              onChange={e => onUpdate(block!.id, { content: e.target.value })}
              className="w-full h-20 px-2.5 py-1.5 rounded-lg border border-border/50 bg-background text-[11px] resize-none focus:outline-none focus:ring-1 focus:ring-primary/20"
              placeholder={ar ? "أدخل النص..." : "Enter text..."}
            />
          </div>
        )}

        {/* Font */}
        <div>
          <p className="text-[10px] text-muted-foreground mb-2">{ar ? "الخط" : "Typography"}</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] text-muted-foreground/60">{ar ? "الحجم" : "Size"}</label>
              <input type="number" value={block.style.fontSize || 13} onChange={e => updateStyle({ fontSize: parseInt(e.target.value) || 13 })} className="h-7 px-2 rounded-lg border border-border/50 bg-background text-[11px] w-full" />
            </div>
            <div>
              <label className="text-[9px] text-muted-foreground/60">{ar ? "الوزن" : "Weight"}</label>
              <select value={block.style.fontWeight || "normal"} onChange={e => updateStyle({ fontWeight: e.target.value })} className="h-7 px-2 rounded-lg border border-border/50 bg-background text-[11px] w-full">
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
                <option value="lighter">Light</option>
              </select>
            </div>
          </div>
          <div className="flex gap-1 mt-2">
            {(["left", "center", "right"] as const).map(align => (
              <button
                key={align}
                onClick={() => updateStyle({ textAlign: align })}
                className={`flex-1 h-7 rounded-lg border text-[10px] flex items-center justify-center transition-colors ${
                  block.style.textAlign === align ? "border-primary bg-primary/10 text-primary" : "border-border/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                {align === "left" ? <AlignLeft size={11} /> : align === "center" ? <AlignCenter size={11} /> : <AlignRight size={11} />}
              </button>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div>
          <p className="text-[10px] text-muted-foreground mb-2">{ar ? "الألوان" : "Colors"}</p>
          <div className="space-y-2">
            <div>
              <label className="text-[9px] text-muted-foreground/60">{ar ? "لون النص" : "Text Color"}</label>
              <div className="flex gap-1 flex-wrap mt-1">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => updateStyle({ color: c })}
                    className={`w-5 h-5 rounded-md border ${block.style.color === c ? "border-primary ring-1 ring-primary" : "border-border/40"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="text-[9px] text-muted-foreground/60">{ar ? "لون الخلفية" : "Background"}</label>
              <div className="flex gap-1 flex-wrap mt-1">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => updateStyle({ bgColor: c })}
                    className={`w-5 h-5 rounded-md border ${block.style.bgColor === c ? "border-primary ring-1 ring-primary" : "border-border/40"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Visibility */}
        <div className="flex items-center justify-between">
          <span className="text-[11px]">{ar ? "مرئي" : "Visible"}</span>
          <button
            onClick={() => onUpdate(block!.id, { visible: !block!.visible })}
            className={`w-10 h-5 rounded-full transition-colors ${block.visible ? "bg-primary" : "bg-muted"}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${block.visible ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────

export default function QuotationDesignerPage() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const canvasRef = useRef<HTMLDivElement>(null);
  const [blocks, setBlocks] = useState<BlockConfig[]>(getDefaultBlocks);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<QuotationTemplate[]>(loadTemplates);
  const [templateName, setTemplateName] = useState("");
  const [saving, setSaving] = useState(false);
  const [showTemplateList, setShowTemplateList] = useState(false);
  const [draggingBlockType, setDraggingBlockType] = useState<BlockType | null>(null);
  const [codeSettings] = useState<CodeSettings>(() => loadCodeSettings());

  const selectedBlock = blocks.find(b => b.id === selectedId) ?? null;

  // ── Drag from palette ──
  function handlePaletteDragStart(e: React.DragEvent, type: BlockType) {
    e.dataTransfer.setData("blockType", type);
    setDraggingBlockType(type);
  }

  function handleCanvasDrop(e: React.DragEvent) {
    e.preventDefault();
    const type = e.dataTransfer.getData("blockType") as BlockType;
    if (!type) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = Math.max(0, Math.round((e.clientX - rect.left) / 10) * 10);
    const y = Math.max(0, Math.round((e.clientY - rect.top) / 10) * 10);

    const blockDef = BLOCK_TYPES.find(b => b.type === type);
    const newBlock: BlockConfig = {
      id: uid(),
      type,
      x,
      y,
      width: blockDef?.defaultW ?? 200,
      height: blockDef?.defaultH ?? 80,
      style: { ...DEFAULT_STYLE },
      content: "",
      visible: true,
    };

    setBlocks(prev => [...prev, newBlock]);
    setSelectedId(newBlock.id);
    setDraggingBlockType(null);
  }

  function handleCanvasDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }

  // ── Block operations ──
  function updateBlock(id: string, patch: Partial<BlockConfig>) {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b));
  }

  function deleteBlock(id: string) {
    setBlocks(prev => prev.filter(b => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function duplicateBlock(id: string) {
    const block = blocks.find(b => b.id === id);
    if (!block) return;
    const newBlock = { ...block, id: uid(), x: block.x + 20, y: block.y + 20 };
    setBlocks(prev => [...prev, newBlock]);
    setSelectedId(newBlock.id);
  }

  function moveBlockUp(id: string) {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }

  function moveBlockDown(id: string) {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }

  // ── Template operations ──
  function saveTemplate() {
    if (!templateName.trim()) return;
    setSaving(true);
    const template: QuotationTemplate = {
      id: `tpl_${Date.now()}`,
      name: templateName,
      nameAr: templateName,
      blocks: [...blocks],
      pageWidth: 560,
      pageHeight: 800,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...templates, template];
    setTemplates(updated);
    saveTemplates(updated);
    setTemplateName("");
    setTimeout(() => setSaving(false), 800);
  }

  function loadTemplate(id: string) {
    const tpl = templates.find(t => t.id === id);
    if (tpl) {
      setBlocks([...tpl.blocks]);
      setShowTemplateList(false);
    }
  }

  function deleteTemplate(id: string) {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    saveTemplates(updated);
  }

  // ── PDF Export (basic print) ──
  function handlePrint() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const blocksHtml = blocks.filter(b => b.visible).map(block => {
      const style: React.CSSProperties = {
        position: "absolute",
        left: block.x,
        top: block.y,
        width: block.width,
        height: block.height,
        fontSize: block.style.fontSize,
        fontWeight: block.style.fontWeight as any,
        color: block.style.color,
        backgroundColor: block.style.bgColor,
        textAlign: block.style.textAlign,
        padding: block.style.padding,
        borderRadius: block.style.borderRadius,
        border: block.style.borderWidth ? `${block.style.borderWidth}px solid ${block.style.borderColor}` : "none",
        boxSizing: "border-box",
        overflow: "hidden",
      };

      let content = "";
      switch (block.type) {
        case "header":
          content = `<div style="display:flex;align-items:center;justify-content:center;height:100%"><span style="font-size:${block.style.fontSize}px;font-weight:bold">${block.content || "QUOTATION"}</span></div>`;
          break;
        case "logo":
          content = block.content ? `<img src="${block.content}" style="max-height:100%;object-fit:contain" />` : "";
          break;
        case "customer_info":
          content = `<div style="font-size:10px;line-height:1.6"><b>Customer Details</b><br/>Name: ____________________<br/>Company: _________________<br/>Phone: ___________________<br/>Email: ___________________<br/>Address: _________________</div>`;
          break;
        case "line_items_table":
          content = `<table style="width:100%;border-collapse:collapse;font-size:10px"><thead><tr style="background:#f5f5f5"><th style="text-align:left;padding:4px;border:1px solid #ddd">#</th><th style="text-align:left;padding:4px;border:1px solid #ddd">Product</th><th style="text-align:center;padding:4px;border:1px solid #ddd">Qty</th><th style="text-align:right;padding:4px;border:1px solid #ddd">Price</th><th style="text-align:right;padding:4px;border:1px solid #ddd">Total</th></tr></thead><tbody><tr><td style="padding:4px;border:1px solid #ddd">1</td><td style="padding:4px;border:1px solid #ddd">Product name</td><td style="text-align:center;padding:4px;border:1px solid #ddd">1</td><td style="text-align:right;padding:4px;border:1px solid #ddd">1,000</td><td style="text-align:right;padding:4px;border:1px solid #ddd">1,000</td></tr></tbody></table>`;
          break;
        case "totals":
          content = `<div style="font-size:11px;line-height:2"><div style="display:flex;justify-content:space-between"><span>Subtotal</span><span>4,000</span></div><div style="display:flex;justify-content:space-between"><span>Discount</span><span>-400</span></div><div style="display:flex;justify-content:space-between"><span>Tax</span><span>504</span></div><hr style="border:none;border-top:1px solid #ddd;margin:4px 0"/><div style="display:flex;justify-content:space-between;font-weight:bold"><span>Grand Total</span><span>4,104</span></div></div>`;
          break;
        case "text_block":
          content = `<div>${block.content || ""}</div>`;
          break;
        case "terms":
          content = `<div><b style="font-size:11px">Terms & Conditions</b><p style="font-size:9px;color:#666;margin-top:4px">${block.content || ""}</p></div>`;
          break;
        case "signature":
          content = `<div style="padding-top:30px"><div style="border-top:1px solid #ccc;padding-top:4px"><p style="font-size:10px;color:#999">Authorized Signature</p><p style="font-size:9px;color:#aaa">Date: _______________</p></div></div>`;
          break;
        case "divider":
          content = `<div style="width:100%;height:100%;background:#e5e5e5"></div>`;
          break;
        case "spacer":
          content = "";
          break;
      }

      return `<div style="${Object.entries(style).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}:${v}`).join(";")}">${content}</div>`;
    }).join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Quotation</title>
        <style>
          @page { margin: 20mm; }
          body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        </style>
      </head>
      <body>
        <div style="position:relative;width:560px;min-height:800px;margin:0 auto">
          ${blocksHtml}
        </div>
        <script>window.onload=function(){window.print();window.close()}</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  return (
    <div className="h-[calc(100dvh-48px)] flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-background shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/quotations" className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-[15px] font-semibold flex items-center gap-2">
              <LayoutTemplate size={15} className="text-primary" />
              {ar ? "مصمم عروض الأسعار" : "Quotation Designer"}
            </h1>
            <p className="text-[11px] text-muted-foreground">{ar ? "اسحب وأفلت الكتل لتصميم القالب" : "Drag & drop blocks to design your template"}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Template name input */}
          <input
            value={templateName}
            onChange={e => setTemplateName(e.target.value)}
            placeholder={ar ? "اسم القالب..." : "Template name..."}
            className="h-8 px-3 rounded-lg border border-border/50 bg-background text-[12px] w-[160px] focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
          <button onClick={saveTemplate} disabled={!templateName.trim() || saving} className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium px-3 py-1.5 hover:opacity-90 disabled:opacity-40">
            {saving ? <CheckCircle2 size={12} /> : <Save size={12} />}
            {saving ? (ar ? "تم" : "Saved") : (ar ? "حفظ" : "Save")}
          </button>
          <button onClick={() => setShowTemplateList(!showTemplateList)} className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 text-[12px] font-medium px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50">
            <FileText size={12} />
            {ar ? "القوالب" : "Templates"}
          </button>
          <button onClick={handlePrint} className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 text-[12px] font-medium px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50">
            <Download size={12} />
            PDF
          </button>
        </div>
      </div>

      {/* Template list dropdown */}
      {showTemplateList && (
        <div className="absolute top-[52px] right-4 z-40 w-[300px] bg-background border border-border/60 rounded-xl shadow-xl max-h-[300px] overflow-auto">
          <div className="p-3 border-b border-border/30">
            <p className="text-[12px] font-medium">{ar ? "القوالب المحفوظة" : "Saved Templates"}</p>
          </div>
          {templates.length === 0 ? (
            <div className="p-6 text-center text-[12px] text-muted-foreground">
              {ar ? "لا توجد قوالب محفوظة" : "No saved templates yet"}
            </div>
          ) : (
            templates.map(tpl => (
              <div key={tpl.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/30 border-b border-border/20 last:border-b-0">
                <button onClick={() => loadTemplate(tpl.id)} className="text-left flex-1">
                  <p className="text-[12px] font-medium">{tpl.name}</p>
                  <p className="text-[10px] text-muted-foreground">{tpl.blocks.length} blocks · {new Date(tpl.updatedAt).toLocaleDateString()}</p>
                </button>
                <button onClick={() => deleteTemplate(tpl.id)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-rose-50 text-muted-foreground hover:text-rose-500">
                  <Trash2 size={11} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Block palette */}
        <div className="w-[200px] border-r border-border/40 bg-background overflow-auto shrink-0">
          <div className="p-3">
            <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider">{ar ? "الكتل" : "Blocks"}</p>
            <div className="space-y-1">
              {BLOCK_TYPES.map(bt => {
                const Icon = bt.icon;
                return (
                  <div
                    key={bt.type}
                    draggable
                    onDragStart={e => handlePaletteDragStart(e, bt.type)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-grab hover:bg-muted/50 transition-colors text-[12px] border border-transparent hover:border-border/30"
                  >
                    <GripVertical size={10} className="text-muted-foreground/40 shrink-0" />
                    <Icon size={13} className="text-muted-foreground/60 shrink-0" />
                    <span>{ar ? bt.labelAr : bt.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto bg-muted/20 p-6" onClick={() => setSelectedId(null)}>
          <div
            ref={canvasRef}
            className="relative bg-background border border-border/40 shadow-lg mx-auto"
            style={{ width: 560, minHeight: 800 }}
            onDrop={handleCanvasDrop}
            onDragOver={handleCanvasDragOver}
            onClick={e => e.stopPropagation()}
          >
            {blocks.map(block => (
              <div
                key={block.id}
                onClick={e => { e.stopPropagation(); setSelectedId(block.id); }}
              >
                <BlockRenderer
                  block={block}
                  isSelected={selectedId === block.id}
                  onClick={() => setSelectedId(block.id)}
                  codeSettings={codeSettings}
                />
              </div>
            ))}
            {blocks.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40 text-[13px]">
                {ar ? "اسحب الكتل من اليسار" : "Drag blocks from the left panel"}
              </div>
            )}
          </div>
        </div>

        {/* Property panel */}
        {selectedBlock && (
          <PropertyPanel
            block={selectedBlock}
            onUpdate={updateBlock}
            onClose={() => setSelectedId(null)}
            codeSettings={codeSettings}
            ar={ar}
          />
        )}
      </div>
    </div>
  );
}
