import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { useLocation } from "wouter";
import { CRM_CUSTOMERS, CRM_TIMELINE, CRM_TASKS, CRM_NOTES, CRM_ALERTS, LOYALTY_REWARDS, CUSTOMER_RELATIONSHIPS, type CRMCustomer, type TimelineEvent, type CustomerRelationship } from "../lib/crm-data";
import {
  ArrowLeft, Phone, MessageSquare, Mail, Star, MapPin, Calendar,
  DollarSign, ShoppingCart, Clock, Tag, AlertTriangle, Gift, Sparkles,
  CheckCircle2, CreditCard, FileText, Truck, Package, Plus, Edit3,
  ChevronDown, ChevronRight, Eye, TrendingUp, Repeat, Send, X,
  Shield, Zap, Heart, Users, ExternalLink, Check, Link2, Building2,
  UserCheck, Briefcase, Handshake, GitBranch, ShoppingBag,
} from "lucide-react";

function formatEGP(n: number) {
  return new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", minimumFractionDigits: 0 }).format(n);
}

const VIP_COLORS: Record<string, string> = {
  platinum: "bg-violet-100 text-violet-700 border-violet-200",
  gold: "bg-amber-100 text-amber-700 border-amber-200",
  silver: "bg-slate-100 text-slate-600 border-slate-200",
  none: "",
};

const TIMELINE_ICONS: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  order: { icon: ShoppingCart, color: "text-emerald-600", bg: "bg-emerald-100" },
  pos_order: { icon: ShoppingCart, color: "text-emerald-600", bg: "bg-emerald-100" },
  shopify_order: { icon: ShoppingCart, color: "text-emerald-600", bg: "bg-emerald-100" },
  invoice: { icon: FileText, color: "text-blue-600", bg: "bg-blue-100" },
  payment: { icon: CreditCard, color: "text-violet-600", bg: "bg-violet-100" },
  quotation: { icon: FileText, color: "text-cyan-600", bg: "bg-cyan-100" },
  whatsapp: { icon: MessageSquare, color: "text-emerald-600", bg: "bg-emerald-100" },
  email: { icon: Mail, color: "text-blue-600", bg: "bg-blue-100" },
  call: { icon: Phone, color: "text-amber-600", bg: "bg-amber-100" },
  note: { icon: Edit3, color: "text-slate-600", bg: "bg-slate-100" },
  loyalty_points: { icon: Gift, color: "text-primary", bg: "bg-primary/10" },
  loyalty_redeem: { icon: Gift, color: "text-rose-600", bg: "bg-rose-100" },
  delivery: { icon: Truck, color: "text-emerald-600", bg: "bg-emerald-100" },
  return: { icon: Repeat, color: "text-rose-600", bg: "bg-rose-100" },
  follow_up: { icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
};

const AI_SUMMARIES: Record<string, string> = {
  c01: "Nora has been a loyal customer since 2022. She purchases every 3-4 months, prefers WhatsApp communication, and is interested in bridal collections. She recently ordered a full bridal package worth 12,000 EGP. She always pays on time and has a high lifetime value of 185,000 EGP. Recommended: Send her the new bridal collection preview.",
  c02: "Layla is a regular online shopper who discovered THOTH through Shopify. She buys evening wear and prefers home delivery. She has an overdue invoice of 4,500 EGP. Recommended: Send a friendly payment reminder via WhatsApp.",
  c03: "Sara manages corporate uniform orders. She places bulk orders every 2-3 months and prefers email communication. She has 2 overdue invoices totaling 28,000 EGP. Recommended: Call her procurement manager to arrange payment.",
  c04: "Khalid is our top international wholesale buyer from Saudi Arabia. He places large orders (85K+) quarterly. He's a platinum VIP with 320K lifetime spend. He prefers WhatsApp and always pays on time. Recommended: Send him the new collection lookbook before public launch.",
  c05: "Fatima is an inactive VIP customer who hasn't ordered in 45 days. She previously complained about a 3-day delivery delay for her bridal fitting. She has high churn risk. Recommended: Call her personally to address the complaint and offer a complimentary alteration.",
  c12: "Tamer is our highest-value customer with 450K lifetime spend. He's a celebrity client who needs fast turnaround and VIP treatment. He orders custom evening wear frequently. Recommended: Assign a personal shopper and ensure priority production.",
  c11: "Dina is one of our most loyal customers with 280K lifetime spend. She's a platinum VIP who orders bridal collections regularly. She just placed a reorder of best-selling pieces. Recommended: Invite her to an exclusive preview event.",
  c18: "Nadia is a media personality who orders luxury items regularly. She spends 210K lifetime and has strong loyalty. She just synced a Shopify order for luxury scarves. Recommended: Send her the new accessories collection.",
};

export default function CRMCustomerProfile() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [location] = useLocation();
  const customerId = location.split("/").pop();

  const customer = CRM_CUSTOMERS.find(c => c.id === customerId);
  const timeline = CRM_TIMELINE.filter(e => e.customer_id === customerId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const tasks = CRM_TASKS.filter(t => t.customer_id === customerId);
  const notes = CRM_NOTES.filter(n => n.customer_id === customerId);
  const alerts = CRM_ALERTS.filter(a => a.customer_id === customerId && !a.dismissed);
  const relationships = CUSTOMER_RELATIONSHIPS.filter(r => r.customer_id === customerId);

  const [activeTab, setActiveTab] = useState<"timeline" | "notes" | "tasks" | "loyalty" | "ai" | "relationships">("timeline");
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [showLogModal, setShowLogModal] = useState<"call" | "email" | "whatsapp" | null>(null);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [logNotes, setLogNotes] = useState("");
  const [logDuration, setLogDuration] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpNote, setFollowUpNote] = useState("");
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  if (!customer) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <p className="text-[13px] text-muted-foreground">{ar ? "العميل غير موجود" : "Customer not found"}</p>
      </div>
    );
  }

  const aiSummary = AI_SUMMARIES[customer.id] || `${customer.name} has been a customer since ${new Date(customer.created_at).getFullYear()}. Total spend: ${formatEGP(customer.total_spend)} across ${customer.total_orders} orders.`;

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="px-6 md:px-8 py-5 border-b border-border/40" style={{ background: "linear-gradient(160deg, hsl(var(--muted)/0.2) 0%, hsl(var(--background)) 60%)" }}>
        <div className="flex items-center gap-4">
          <button onClick={() => history.back()} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
            <ArrowLeft size={16} />
          </button>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-[16px] font-bold text-white shrink-0" style={{ backgroundColor: customer.avatar_color }}>
            {customer.name.split(" ").map(w => w[0]).join("")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-[18px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>{customer.name}</h1>
              {customer.vip_level !== "none" && <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold uppercase border ${VIP_COLORS[customer.vip_level]}`}>{customer.vip_level}</span>}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
              <span className="flex items-center gap-1"><Phone size={10} />{customer.phone}</span>
              <span className="flex items-center gap-1"><Mail size={10} />{customer.email}</span>
              <span className="flex items-center gap-1"><MapPin size={10} />{customer.city}</span>
              <span className="flex items-center gap-1"><Calendar size={10} />{ar ? "عميل منذ" : "Since"} {new Date(customer.created_at).getFullYear()}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={() => setShowLogModal("call")} className="h-8 px-3 rounded-lg bg-emerald-500 text-white text-[11px] font-medium flex items-center gap-1.5 hover:bg-emerald-600 transition-colors"><Phone size={11} />{ar ? "اتصال" : "Call"}</button>
            <button onClick={() => setShowLogModal("whatsapp")} className="h-8 px-3 rounded-lg bg-emerald-600 text-white text-[11px] font-medium flex items-center gap-1.5 hover:bg-emerald-700 transition-colors"><MessageSquare size={11} />WhatsApp</button>
            <button onClick={() => setShowLogModal("email")} className="h-8 px-3 rounded-lg bg-blue-500 text-white text-[11px] font-medium flex items-center gap-1.5 hover:bg-blue-600 transition-colors"><Mail size={11} />{ar ? "بريد" : "Email"}</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 overflow-x-auto no-scrollbar">
          {([
            { id: "timeline" as const, en: "Timeline", ar: "الجدول الزمني", icon: Clock },
            { id: "notes" as const, en: "Notes", ar: "الملاحظات", icon: Edit3 },
            { id: "tasks" as const, en: "Tasks", ar: "المهام", icon: CheckCircle2 },
            { id: "loyalty" as const, en: "Loyalty", ar: "الولاء", icon: Gift },
            { id: "relationships" as const, en: "Relationships", ar: "العلاقات", icon: Link2 },
            { id: "ai" as const, en: "AI Summary", ar: "ملخص ذكي", icon: Sparkles },
          ]).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/50"
              }`}>
              <tab.icon size={12} />{ar ? tab.ar : tab.en}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 md:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 max-w-[1200px]">
          {/* Main Content */}
          <div>
            {/* Timeline Tab */}
            {activeTab === "timeline" && (
              <div className="space-y-0">
                {timeline.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock size={24} className="mx-auto text-muted-foreground/20 mb-2" />
                    <p className="text-[12px] text-muted-foreground">{ar ? "لا يوجد نشاط" : "No activity yet"}</p>
                  </div>
                ) : (
                  timeline.map((event, i) => {
                    const meta = TIMELINE_ICONS[event.type] || TIMELINE_ICONS.note;
                    const Icon = meta.icon;
                    return (
                      <div key={event.id} className="flex gap-3 relative">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full ${meta.bg} flex items-center justify-center ${meta.color} shrink-0`}>
                            <Icon size={14} />
                          </div>
                          {i < timeline.length - 1 && <div className="w-px flex-1 bg-border/40 my-1" />}
                        </div>
                        <div className="pb-5 flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="text-[12px] font-medium text-foreground">{ar ? event.title_ar : event.title}</p>
                            <span className="text-[9px] text-muted-foreground shrink-0">{event.timestamp}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">{ar ? event.details_ar : event.details}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] text-muted-foreground/60">{event.staff}</span>
                            {event.amount && <span className="text-[10px] font-medium text-foreground">{formatEGP(event.amount)}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === "notes" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[13px] font-semibold">{ar ? "الملاحظات" : "Notes"}</h3>
                  <button onClick={() => setShowAddNote(true)} className="h-7 px-3 rounded-lg bg-primary/10 text-primary text-[11px] font-medium flex items-center gap-1 hover:bg-primary/20 transition-colors">
                    <Plus size={11} /> {ar ? "إضافة" : "Add"}
                  </button>
                </div>
                {showAddNote && (
                  <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
                    <textarea value={newNote} onChange={e => setNewNote(e.target.value)} rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-[12px] focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
                      placeholder={ar ? "اكتب ملاحظة..." : "Write a note..."} autoFocus />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setShowAddNote(false); setNewNote(""); }} className="h-7 px-3 rounded-lg border border-border text-[11px] hover:bg-muted transition-colors">{ar ? "إلغاء" : "Cancel"}</button>
                      <button className="h-7 px-3 rounded-lg bg-primary text-primary-foreground text-[11px] font-medium hover:opacity-90 transition-opacity">{ar ? "حفظ" : "Save"}</button>
                    </div>
                  </div>
                )}
                {notes.map(note => (
                  <div key={note.id} className="p-3.5 rounded-xl border border-border/40 bg-background">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-primary">{note.author}</span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${note.type === "internal" ? "bg-amber-100 text-amber-700" : note.type === "call_log" ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-700"}`}>
                          {note.type === "internal" ? (ar ? "داخلي" : "Internal") : note.type === "call_log" ? (ar ? "مكالمة" : "Call") : (ar ? "للعميل" : "Customer")}
                        </span>
                        {note.priority === "high" && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600">{ar ? "مهم" : "High"}</span>
                        )}
                      </div>
                      <span className="text-[9px] text-muted-foreground">{note.created_at}</span>
                    </div>
                    <p className="text-[12px] text-foreground leading-relaxed">{ar ? note.content_ar : note.content}</p>
                    
                    {/* Mentions */}
                    {note.mentions && note.mentions.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className="text-[9px] text-muted-foreground">{ar ? "إشارة إلى:" : "Mentions:"}</span>
                        {note.mentions.map(mention => (
                          <span key={mention} className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">@{mention}</span>
                        ))}
                      </div>
                    )}
                    
                    {/* Attachments */}
                    {note.attachments && note.attachments.length > 0 && (
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {note.attachments.map((att, i) => {
                          const attIcons: Record<string, React.ElementType> = {
                            image: Eye, pdf: FileText, voice: Phone, document: FileText,
                          };
                          const AttIcon = attIcons[att.type] || FileText;
                          return (
                            <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/50 border border-border/30">
                              <AttIcon size={10} className="text-muted-foreground" />
                              <span className="text-[9px] text-foreground font-medium">{att.name}</span>
                              <span className="text-[8px] text-muted-foreground">{att.size}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Follow-up date */}
                    {note.follow_up_date && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <Clock size={10} className={note.is_completed ? "text-emerald-500" : "text-amber-500"} />
                        <span className={`text-[9px] font-medium ${note.is_completed ? "text-emerald-500" : "text-amber-500"}`}>
                          {ar ? "متابعة:" : "Follow-up:"} {note.follow_up_date}
                          {note.is_completed && (ar ? " (مكتمل)" : " (Completed)")}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Tasks Tab */}
            {activeTab === "tasks" && (
              <div className="space-y-2">
                {tasks.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle2 size={24} className="mx-auto text-muted-foreground/20 mb-2" />
                    <p className="text-[12px] text-muted-foreground">{ar ? "لا توجد مهام" : "No tasks"}</p>
                  </div>
                ) : tasks.map(task => (
                  <div key={task.id} className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${task.status === "overdue" ? "border-rose-200 bg-rose-50/30" : "border-border/40"}`}>
                    <button className="w-5 h-5 rounded-full border-2 border-border/60 hover:border-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium">{ar ? task.title_ar : task.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${task.priority === "urgent" ? "bg-rose-100 text-rose-600" : task.priority === "high" ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"}`}>{task.priority}</span>
                        <span className="text-[9px] text-muted-foreground">{task.due_date}</span>
                        {task.status === "overdue" && <span className="text-[9px] text-rose-500 font-medium">{ar ? "متأخر" : "Overdue"}</span>}
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{task.assigned_to}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Loyalty Tab */}
            {activeTab === "loyalty" && (
              <div className="space-y-5">
                {/* Loyalty Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-center">
                    <p className="text-[22px] font-bold text-primary" style={{ fontFamily: "var(--app-font-serif)" }}>{customer.loyalty_points.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{ar ? "نقاط متاحة" : "Available Points"}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border/40 text-center">
                    <p className="text-[22px] font-bold text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>{customer.lifetime_points.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{ar ? "إجمالي النقاط" : "Lifetime Points"}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border/40 text-center">
                    <p className="text-[22px] font-bold text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>{formatEGP(customer.total_spend * 0.01)}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{ar ? "قيمة النقاط" : "Points Value"}</p>
                  </div>
                </div>

                {/* Available Rewards */}
                <div>
                  <h4 className="text-[12px] font-semibold mb-2">{ar ? "المكافآت المتاحة" : "Available Rewards"}</h4>
                  <div className="space-y-2">
                    {LOYALTY_REWARDS.filter(r => r.active && customer.loyalty_points >= r.points_cost).map(reward => (
                      <div key={reward.id} className="flex items-center gap-3 p-3 rounded-xl border border-primary/20 bg-primary/5">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Gift size={16} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium">{ar ? reward.name_ar : reward.name}</p>
                          <p className="text-[10px] text-muted-foreground">{ar ? reward.description_ar : reward.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[11px] font-medium text-primary">{reward.points_cost} {ar ? "نقطة" : "pts"}</p>
                          <button className="text-[9px] text-primary hover:underline mt-0.5">{ar ? "استبدال" : "Redeem"}</button>
                        </div>
                      </div>
                    ))}
                    {LOYALTY_REWARDS.filter(r => r.active && customer.loyalty_points >= r.points_cost).length === 0 && (
                      <p className="text-[11px] text-muted-foreground text-center py-4">{ar ? "لا توجد مكافآت متاحة بعد" : "No rewards available yet"}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Relationships Tab */}
            {activeTab === "relationships" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[13px] font-semibold">{ar ? "العلاقات" : "Relationships"}</h3>
                  <button className="h-7 px-3 rounded-lg bg-primary/10 text-primary text-[11px] font-medium flex items-center gap-1 hover:bg-primary/20 transition-colors">
                    <Plus size={11} /> {ar ? "إضافة" : "Add"}
                  </button>
                </div>

                {relationships.length === 0 ? (
                  <div className="text-center py-12">
                    <Link2 size={24} className="mx-auto text-muted-foreground/20 mb-2" />
                    <p className="text-[12px] text-muted-foreground">{ar ? "لا توجد علاقات" : "No relationships yet"}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {relationships.map(rel => {
                      const relTypeIcons: Record<string, React.ElementType> = {
                        family: Users, spouse: Heart, company: Building2,
                        designer: Briefcase, contractor: Handshake, referral: GitBranch,
                        related: Link2, parent: Users, child: Users, sibling: Users,
                      };
                      const relTypeLabels: Record<string, { en: string; ar: string }> = {
                        family: { en: "Family", ar: "عائلية" },
                        spouse: { en: "Spouse", ar: "زوج/زوجة" },
                        company: { en: "Company", ar: "شركة" },
                        designer: { en: "Designer", ar: "مصمم" },
                        contractor: { en: "Contractor", ar: "مقاول" },
                        referral: { en: "Referral", ar: "إحالة" },
                        related: { en: "Related", ar: "مرتبط" },
                        parent: { en: "Parent", ar: "والد/والدة" },
                        child: { en: "Child", ar: "ابن/ابنة" },
                        sibling: { en: "Sibling", ar: "أخ/أخت" },
                      };
                      const Icon = relTypeIcons[rel.relationship_type] || Link2;
                      const typeLabel = relTypeLabels[rel.relationship_type] || { en: rel.relationship_type, ar: rel.relationship_type };

                      return (
                        <div key={rel.id} className="p-4 rounded-xl border border-border/40 bg-background hover:shadow-sm transition-shadow">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                              <Icon size={16} className="text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-[12px] font-medium text-foreground">{ar ? rel.related_name_ar : rel.related_name}</p>
                                <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                  {ar ? typeLabel.ar : typeLabel.en}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-1.5">
                                {rel.related_phone && (
                                  <span className="flex items-center gap-1"><Phone size={9} />{rel.related_phone}</span>
                                )}
                                {rel.related_email && (
                                  <span className="flex items-center gap-1"><Mail size={9} />{rel.related_email}</span>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground">{ar ? rel.notes_ar : rel.notes}</p>
                              {rel.related_customer_id && (
                                <button className="text-[10px] text-primary hover:underline mt-1.5 flex items-center gap-1">
                                  <ExternalLink size={9} /> {ar ? "عرض ملف العميل" : "View Customer Profile"}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Relationship Graph Preview */}
                {relationships.length > 0 && (
                  <div className="p-4 rounded-xl border border-border/40 bg-muted/20">
                    <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">{ar ? "الشبكة" : "Network"}</h4>
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-[11px] font-bold text-white border-2 border-primary" style={{ backgroundColor: customer.avatar_color }}>
                        {customer.name.split(" ").map(w => w[0]).join("")}
                      </div>
                      {relationships.slice(0, 4).map((rel, i) => (
                        <div key={rel.id} className="flex items-center gap-2">
                          <div className="w-px h-4 bg-border/60" />
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground border border-border/40">
                            {rel.related_name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                          </div>
                        </div>
                      ))}
                      {relationships.length > 4 && (
                        <span className="text-[10px] text-muted-foreground">+{relationships.length - 4}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI Summary Tab */}
            {activeTab === "ai" && (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-primary" />
                    <h3 className="text-[13px] font-semibold text-primary">{ar ? "ملخص ذكي" : "AI Summary"}</h3>
                  </div>
                  <p className="text-[12px] text-foreground leading-relaxed">{aiSummary}</p>
                </div>

                {/* AI Actions */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: Zap, labelEn: "Suggest Next Action", labelAr: "اقتراح الخطوة التالية", color: "text-amber-600 bg-amber-50" },
                    { icon: MessageSquare, labelEn: "Write WhatsApp Follow-up", labelAr: "كتابة متابعة واتساب", color: "text-emerald-600 bg-emerald-50" },
                    { icon: Mail, labelEn: "Write Email Follow-up", labelAr: "كتابة متابعة بريد", color: "text-blue-600 bg-blue-50" },
                    { icon: AlertTriangle, labelEn: "Predict Churn Risk", labelAr: "تحليل خطر الفقد", color: "text-rose-600 bg-rose-50" },
                    { icon: TrendingUp, labelEn: "Recommend Product", labelAr: "توصية منتج", color: "text-violet-600 bg-violet-50" },
                    { icon: Eye, labelEn: "Explain Customer History", labelAr: "شرح تاريخ العميل", color: "text-cyan-600 bg-cyan-50" },
                  ].map((action, i) => (
                    <button key={i} className={`p-3.5 rounded-xl border border-border/40 text-left hover:shadow-sm transition-all ${action.color.split(" ")[1]}`}>
                      <action.icon size={14} className={action.color.split(" ")[0]} />
                      <p className="text-[11px] font-medium mt-2">{ar ? action.labelAr : action.labelEn}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Key Metrics */}
            <div className="p-4 rounded-xl border border-border/40 space-y-3">
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{ar ? "المؤشرات" : "Key Metrics"}</h4>
              {[
                { label: ar ? "إجمالي المشتريات" : "Lifetime Spend", value: formatEGP(customer.total_spend), icon: DollarSign },
                { label: ar ? "عدد الطلبات" : "Total Orders", value: customer.total_orders.toString(), icon: ShoppingCart },
                { label: ar ? "متوسط الطلب" : "Avg Order", value: formatEGP(customer.average_order), icon: TrendingUp },
                { label: ar ? "نقاط الولاء" : "Loyalty Points", value: customer.loyalty_points.toLocaleString(), icon: Gift },
                { label: ar ? "invoices مفتوحة" : "Open Invoices", value: customer.open_invoices.toString(), icon: FileText },
                { label: ar ? "عروض أسعار مفتوحة" : "Open Quotations", value: customer.open_quotations.toString(), icon: FileText },
              ].map((m, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <m.icon size={12} className="text-muted-foreground/50" />
                    <span className="text-[11px] text-muted-foreground">{m.label}</span>
                  </div>
                  <span className="text-[12px] font-medium text-foreground">{m.value}</span>
                </div>
              ))}
            </div>

            {/* Risk & Likelihood */}
            <div className="p-4 rounded-xl border border-border/40 space-y-3">
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{ar ? "تحليل المخاطر" : "Risk Analysis"}</h4>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">{ar ? "خطر الفقد" : "Churn Risk"}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${customer.churn_risk === "high" ? "bg-rose-100 text-rose-600" : customer.churn_risk === "medium" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                  {customer.churn_risk}
                </span>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-muted-foreground">{ar ? "احتمال الشراء" : "Likelihood to Buy"}</span>
                  <span className="text-[11px] font-medium">{customer.likelihood_to_buy}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${customer.likelihood_to_buy}%` }} />
                </div>
              </div>
            </div>

            {/* Integration Status */}
            <div className="p-4 rounded-xl border border-border/40 space-y-3">
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{ar ? "حالة التكامل" : "Integration Status"}</h4>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart size={12} className="text-muted-foreground/50" />
                    <span className="text-[11px] text-muted-foreground">Shopify</span>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${customer.source === "shopify" ? "bg-emerald-100 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                    {customer.source === "shopify" ? (ar ? "متصل" : "Connected") : (ar ? "غير متصل" : "Not connected")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag size={12} className="text-muted-foreground/50" />
                    <span className="text-[11px] text-muted-foreground">POS</span>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${customer.source === "pos" ? "bg-emerald-100 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                    {customer.source === "pos" ? (ar ? "متصل" : "Connected") : (ar ? "غير متصل" : "Not connected")}
                  </span>
                </div>
                {customer.source === "shopify" && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">{ar ? "آخر مزامنة" : "Last synced"}</span>
                    <span className="text-[10px] text-foreground font-medium">{ar ? "منذ يوم" : "1 day ago"}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/30 space-y-2">
                <h4 className="text-[11px] font-semibold text-rose-600 flex items-center gap-1.5"><AlertTriangle size={11} /> {ar ? "تنبيهات" : "Alerts"}</h4>
                {alerts.map(alert => (
                  <div key={alert.id} className="text-[11px] text-foreground">
                    <p className="font-medium">{ar ? alert.title_ar : alert.title}</p>
                    <p className="text-muted-foreground text-[10px] mt-0.5">{ar ? alert.suggested_action_ar : alert.suggested_action}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Actions */}
            <div className="p-4 rounded-xl border border-border/40 space-y-2">
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{ar ? "إجراءات سريعة" : "Quick Actions"}</h4>
              {[
                { icon: ShoppingCart, labelEn: "Create Order", labelAr: "إنشاء طلب", action: () => {} },
                { icon: FileText, labelEn: "Create Quotation", labelAr: "إنشاء عرض سعر", action: () => {} },
                { icon: CreditCard, labelEn: "Create Invoice", labelAr: "إنشاء فاتورة", action: () => {} },
                { icon: Clock, labelEn: "Schedule Follow-up", labelAr: "جدولة متابعة", action: () => setShowFollowUp(true) },
                { icon: Gift, labelEn: "Add Loyalty Points", labelAr: "إضافة نقاط ولاء", action: () => {} },
                { icon: Repeat, labelEn: "Issue Refund", labelAr: "إصدار استرداد", action: () => {} },
              ].map((action, i) => (
                <button key={i} onClick={action.action} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] text-foreground hover:bg-muted/50 transition-colors text-left">
                  <action.icon size={12} className="text-muted-foreground/50" />
                  {ar ? action.labelAr : action.labelEn}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Communication Log Modal ─── */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => { setShowLogModal(null); setLogNotes(""); setLogDuration(""); }} />
          <div className="relative w-full max-w-md bg-background rounded-2xl border border-border shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
              <h3 className="text-[15px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>
                {showLogModal === "call" ? (ar ? "تسجيل مكالمة" : "Log Call") : showLogModal === "email" ? (ar ? "تسجيل بريد" : "Log Email") : (ar ? "تسجيل واتساب" : "Log WhatsApp")}
              </h3>
              <button onClick={() => { setShowLogModal(null); setLogNotes(""); setLogDuration(""); }} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"><X size={14} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ backgroundColor: customer.avatar_color }}>
                  {customer.name.split(" ").map(w => w[0]).join("")}
                </div>
                <div>
                  <p className="text-[12px] font-medium">{customer.name}</p>
                  <p className="text-[10px] text-muted-foreground">{customer.phone}</p>
                </div>
              </div>
              {showLogModal === "call" && (
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">{ar ? "المدة (دقائق)" : "Duration (minutes)"}</label>
                  <input type="number" value={logDuration} onChange={e => setLogDuration(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="5" />
                </div>
              )}
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">{ar ? "ملاحظات" : "Notes"}</label>
                <textarea value={logNotes} onChange={e => setLogNotes(e.target.value)} rows={4} className="w-full px-3 py-2 rounded-xl border border-border/60 bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" placeholder={ar ? "اكتب ملاحظات المكالمة..." : "Write call notes..."} />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => { setShowLogModal(null); setLogNotes(""); setLogDuration(""); }} className="flex-1 h-10 rounded-xl border border-border/60 text-[12px] font-medium hover:bg-muted transition-colors">{ar ? "إلغاء" : "Cancel"}</button>
                <button onClick={() => { setShowLogModal(null); setLogNotes(""); setLogDuration(""); }} className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5">
                  <Check size={13} /> {ar ? "حفظ" : "Save Log"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Follow-up Scheduling Modal ─── */}
      {showFollowUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => { setShowFollowUp(false); setFollowUpDate(""); setFollowUpNote(""); }} />
          <div className="relative w-full max-w-md bg-background rounded-2xl border border-border shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
              <h3 className="text-[15px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>
                {ar ? "جدولة متابعة" : "Schedule Follow-up"}
              </h3>
              <button onClick={() => { setShowFollowUp(false); setFollowUpDate(""); setFollowUpNote(""); }} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"><X size={14} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ backgroundColor: customer.avatar_color }}>
                  {customer.name.split(" ").map(w => w[0]).join("")}
                </div>
                <div>
                  <p className="text-[12px] font-medium">{customer.name}</p>
                  <p className="text-[10px] text-muted-foreground">{customer.phone}</p>
                </div>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">{ar ? "التاريخ" : "Date"}</label>
                <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">{ar ? "نوع المتابعة" : "Follow-up Type"}</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "call", icon: Phone, labelEn: "Call", labelAr: "اتصال" },
                    { id: "email", icon: Mail, labelEn: "Email", labelAr: "بريد" },
                    { id: "whatsapp", icon: MessageSquare, labelEn: "WhatsApp", labelAr: "واتساب" },
                    { id: "meeting", icon: Users, labelEn: "Meeting", labelAr: "اجتماع" },
                  ].map(t => (
                    <button key={t.id} className="p-2.5 rounded-xl border-2 border-border/30 text-center hover:border-primary/40 transition-all">
                      <t.icon size={16} className="mx-auto mb-1 text-muted-foreground" />
                      <p className="text-[9px] font-medium">{ar ? t.labelAr : t.labelEn}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">{ar ? "ملاحظات" : "Notes"}</label>
                <textarea value={followUpNote} onChange={e => setFollowUpNote(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-xl border border-border/60 bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" placeholder={ar ? "موضوع المتابعة..." : "Follow-up topic..."} />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => { setShowFollowUp(false); setFollowUpDate(""); setFollowUpNote(""); }} className="flex-1 h-10 rounded-xl border border-border/60 text-[12px] font-medium hover:bg-muted transition-colors">{ar ? "إلغاء" : "Cancel"}</button>
                <button onClick={() => { setShowFollowUp(false); setFollowUpDate(""); setFollowUpNote(""); }} className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5">
                  <Clock size={13} /> {ar ? "جدولة" : "Schedule"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
