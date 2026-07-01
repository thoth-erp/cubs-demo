/**
 * Cross-Module Activity Feed — تغذية النشاط العابرة للوحدات
 *
 * Unified activity feed that aggregates events from all modules.
 */

import { HR_TIMELINE } from "./hr-data";
import { CRM_TIMELINE, CRM_ACTIVITY_FEED } from "./crm-data";
import { HR_PAYROLL } from "./hr-data-full";
import { FIN_INVOICES, FIN_PAYMENTS } from "./finance-data";
import { STUDIO_PAGES, STUDIO_COMMENTS } from "./studio-data";

export interface CrossModuleActivity {
  id: string;
  module: "crm" | "hr" | "finance" | "studio" | "erp";
  type: string;
  user: string;
  user_ar: string;
  user_avatar: string;
  action: string;
  action_ar: string;
  entity_name: string;
  entity_name_ar: string;
  entity_type: string;
  entity_url: string;
  amount: number | null;
  currency: string;
  timestamp: string;
  icon: string;
  color: string;
}

export function generateCrossModuleActivity(): CrossModuleActivity[] {
  const activities: CrossModuleActivity[] = [];

  // HR Timeline Events
  HR_TIMELINE.forEach(event => {
    const emp = event.employee_id;
    activities.push({
      id: `hr-${event.id}`,
      module: "hr",
      type: event.type,
      user: event.staff,
      user_ar: event.staff,
      user_avatar: "#3B82F6",
      action: event.title,
      action_ar: event.title_ar,
      entity_name: emp,
      entity_name_ar: emp,
      entity_type: "employee",
      entity_url: `/hr/employees/${event.employee_id}`,
      amount: null,
      currency: "EGP",
      timestamp: event.timestamp,
      icon: event.type === "joined" ? "👋" : event.type === "promoted" ? "⭐" : event.type === "warning_issued" ? "⚠️" : event.type === "bonus_added" ? "🎁" : event.type === "terminated" ? "🔚" : "📋",
      color: event.type === "joined" ? "emerald" : event.type === "warning_issued" ? "rose" : event.type === "terminated" ? "rose" : "blue",
    });
  });

  // CRM Activity Feed
  CRM_ACTIVITY_FEED.forEach(item => {
    activities.push({
      id: `crm-feed-${item.id}`,
      module: "crm",
      type: item.type,
      user: item.user,
      user_ar: item.user,
      user_avatar: "#E07A5F",
      action: item.action,
      action_ar: item.action_ar,
      entity_name: item.customer_name,
      entity_name_ar: item.customer_name,
      entity_type: "customer",
      entity_url: `/crm/customers/${item.customer_id}`,
      amount: item.amount,
      currency: item.currency,
      timestamp: item.timestamp,
      icon: item.type === "deal" ? "🤝" : item.type === "order" ? "🛒" : item.type === "quotation" ? "📄" : item.type === "invoice" ? "💰" : item.type === "loyalty" ? "🎁" : item.type === "delivery" ? "🚚" : item.type === "shopify" ? "🛍️" : "👤",
      color: item.type === "deal" ? "emerald" : item.type === "invoice" ? "blue" : "slate",
    });
  });

  // Finance: Paid Invoices
  FIN_INVOICES.filter(inv => inv.status === "paid").forEach(inv => {
    activities.push({
      id: `fin-paid-${inv.id}`,
      module: "finance",
      type: "invoice_paid",
      user: inv.salesperson,
      user_ar: inv.salesperson,
      user_avatar: "#10B981",
      action: "Invoice paid",
      action_ar: "تم دفع الفاتورة",
      entity_name: inv.invoice_number,
      entity_name_ar: inv.invoice_number,
      entity_type: "invoice",
      entity_url: `/finance/invoices/${inv.id}`,
      amount: inv.total,
      currency: "EGP",
      timestamp: inv.paid_date || inv.created_at,
      icon: "✅",
      color: "emerald",
    });
  });

  // Finance: Overdue Invoices
  FIN_INVOICES.filter(inv => inv.status === "overdue").forEach(inv => {
    activities.push({
      id: `fin-overdue-${inv.id}`,
      module: "finance",
      type: "invoice_overdue",
      user: inv.salesperson,
      user_ar: inv.salesperson,
      user_avatar: "#EF4444",
      action: "Invoice overdue",
      action_ar: "فاتورة متأخرة",
      entity_name: inv.invoice_number,
      entity_name_ar: inv.invoice_number,
      entity_type: "invoice",
      entity_url: `/finance/invoices/${inv.id}`,
      amount: inv.balance,
      currency: "EGP",
      timestamp: inv.due_date,
      icon: "⚠️",
      color: "rose",
    });
  });

  // Finance: Payments Received
  FIN_PAYMENTS.forEach(pay => {
    activities.push({
      id: `fin-pay-${pay.id}`,
      module: "finance",
      type: "payment_received",
      user: pay.recorded_by,
      user_ar: pay.recorded_by,
      user_avatar: "#10B981",
      action: "Payment received",
      action_ar: "تم استلام الدفعة",
      entity_name: pay.invoice_number,
      entity_name_ar: pay.invoice_number,
      entity_type: "payment",
      entity_url: `/finance`,
      amount: pay.amount,
      currency: "EGP",
      timestamp: pay.date,
      icon: "💵",
      color: "emerald",
    });
  });

  // Studio: Page Edits
  STUDIO_PAGES.forEach(page => {
    activities.push({
      id: `studio-page-${page.id}`,
      module: "studio",
      type: "page_updated",
      user: page.last_edited_by,
      user_ar: page.last_edited_by,
      user_avatar: page.owner_avatar,
      action: `Updated "${page.title}"`,
      action_ar: `حدّث "${page.title_ar}"`,
      entity_name: page.title,
      entity_name_ar: page.title_ar,
      entity_type: "page",
      entity_url: `/studio/${page.id}`,
      amount: null,
      currency: "EGP",
      timestamp: page.updated_at,
      icon: page.icon,
      color: "violet",
    });
  });

  // Studio: Comments
  STUDIO_COMMENTS.forEach(comment => {
    const page = STUDIO_PAGES.find(p => p.id === comment.page_id);
    if (page) {
      activities.push({
        id: `studio-comment-${comment.id}`,
        module: "studio",
        type: "comment",
        user: comment.author,
        user_ar: comment.author_ar,
        user_avatar: comment.author_avatar,
        action: `Commented on "${page.title}"`,
        action_ar: `علّق على "${page.title_ar}"`,
        entity_name: page.title,
        entity_name_ar: page.title_ar,
        entity_type: "comment",
        entity_url: `/studio/${page.id}`,
        amount: null,
        currency: "EGP",
        timestamp: comment.created_at,
        icon: "💬",
        color: "blue",
      });
    }
  });

  // Sort by timestamp (newest first)
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return activities;
}

export function getActivityStats() {
  const all = generateCrossModuleActivity();
  return {
    total: all.length,
    today: all.filter(a => {
      const d = new Date(a.timestamp);
      const today = new Date();
      return d.toDateString() === today.toDateString();
    }).length,
    byModule: {
      crm: all.filter(a => a.module === "crm").length,
      hr: all.filter(a => a.module === "hr").length,
      finance: all.filter(a => a.module === "finance").length,
      studio: all.filter(a => a.module === "studio").length,
    },
  };
}
