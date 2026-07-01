/**
 * Cross-Module Notifications — إشعارات عرض الوحدات
 *
 * Aggregates alerts from CRM, HR, Finance, and Studio into a unified notification feed.
 * Works in demo mode (no Supabase required).
 */

import { HR_ALERTS } from "./hr-data";
import { HR_PAYROLL } from "./hr-data-full";
import { CRM_ALERTS } from "./crm-data";
import { FIN_INVOICES, FIN_EXPENSES } from "./finance-data";
import { STUDIO_PAGES, STUDIO_COMMENTS } from "./studio-data";

export interface CrossModuleNotification {
  id: string;
  module: "crm" | "hr" | "finance" | "studio";
  type: string;
  severity: "info" | "warning" | "critical";
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  action_url: string;
  action_label: string;
  action_label_ar: string;
  timestamp: string;
  dismissed: boolean;
  icon: string;
  color: string;
}

export function generateCrossModuleNotifications(): CrossModuleNotification[] {
  const notifications: CrossModuleNotification[] = [];

  // CRM Alerts
  CRM_ALERTS.forEach(alert => {
    if (!alert.dismissed) {
      notifications.push({
        id: `crm-${alert.id}`,
        module: "crm",
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        title_ar: alert.title_ar,
        description: alert.description,
        description_ar: alert.description_ar,
        action_url: `/crm/customers/${alert.customer_id}`,
        action_label: "View Customer",
        action_label_ar: "عرض العميل",
        timestamp: alert.created_at,
        dismissed: false,
        icon: alert.severity === "critical" ? "🚨" : alert.severity === "warning" ? "⚠️" : "ℹ️",
        color: alert.severity === "critical" ? "rose" : alert.severity === "warning" ? "amber" : "blue",
      });
    }
  });

  // HR Alerts
  HR_ALERTS.forEach(alert => {
    if (!alert.dismissed) {
      notifications.push({
        id: `hr-${alert.id}`,
        module: "hr",
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        title_ar: alert.title_ar,
        description: alert.description,
        description_ar: alert.description_ar,
        action_url: alert.employee_id ? `/hr/employees/${alert.employee_id}` : "/hr/dashboard",
        action_label: alert.employee_id ? "View Employee" : "View Dashboard",
        action_label_ar: alert.employee_id ? "عرض الموظف" : "عرض لوحة التحكم",
        timestamp: alert.created_at,
        dismissed: false,
        icon: alert.severity === "critical" ? "🚨" : alert.severity === "warning" ? "⚠️" : "ℹ️",
        color: alert.severity === "critical" ? "rose" : alert.severity === "warning" ? "amber" : "blue",
      });
    }
  });

  // Finance: Overdue Invoices
  FIN_INVOICES.filter(inv => inv.status === "overdue").forEach(inv => {
    notifications.push({
      id: `fin-overdue-${inv.id}`,
      module: "finance",
      type: "overdue_invoice",
      severity: "critical",
      title: `Overdue: ${inv.invoice_number}`,
      title_ar: `متأخر: ${inv.invoice_number}`,
      description: `${inv.customer_name} — ${inv.balance.toLocaleString()} EGP overdue`,
      description_ar: `${inv.customer_name_ar} — ${inv.balance.toLocaleString()} ج.م متأخرة`,
      action_url: `/finance/invoices/${inv.id}`,
      action_label: "View Invoice",
      action_label_ar: "عرض الفاتورة",
      timestamp: inv.created_at,
      dismissed: false,
      icon: "💸",
      color: "rose",
    });
  });

  // Finance: Pending Payroll
  const pendingPayroll = HR_PAYROLL.filter(p => p.status === "pending" || p.status === "draft");
  if (pendingPayroll.length > 0) {
    const totalPending = pendingPayroll.reduce((s, p) => s + p.net_salary, 0);
    notifications.push({
      id: "fin-payroll-pending",
      module: "finance",
      type: "pending_payroll",
      severity: "warning",
      title: `${pendingPayroll.length} payroll records pending approval`,
      title_ar: `${pendingPayroll.length} سجل رواتب بانتظار الموافقة`,
      description: `Total: ${totalPending.toLocaleString()} EGP`,
      description_ar: `الإجمالي: ${totalPending.toLocaleString()} ج.م`,
      action_url: "/finance/expenses",
      action_label: "Review Payroll",
      action_label_ar: "مراجعة الرواتب",
      timestamp: new Date().toISOString(),
      dismissed: false,
      icon: "💰",
      color: "amber",
    });
  }

  // Studio: Recent Comments
  STUDIO_COMMENTS.filter(c => !c.resolved).forEach(comment => {
    const page = STUDIO_PAGES.find(p => p.id === comment.page_id);
    if (page) {
      notifications.push({
        id: `studio-comment-${comment.id}`,
        module: "studio",
        type: "new_comment",
        severity: "info",
        title: `${comment.author} commented on "${page.title}"`,
        title_ar: `${comment.author_ar} علّق على "${page.title_ar}"`,
        description: comment.content.slice(0, 80) + (comment.content.length > 80 ? "..." : ""),
        description_ar: comment.content_ar.slice(0, 80) + (comment.content_ar.length > 80 ? "..." : ""),
        action_url: `/studio/${page.id}`,
        action_label: "View Page",
        action_label_ar: "عرض الصفحة",
        timestamp: comment.created_at,
        dismissed: false,
        icon: "💬",
        color: "blue",
      });
    }
  });

  // Sort by timestamp (newest first)
  notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return notifications;
}

export function getNotificationStats() {
  const all = generateCrossModuleNotifications();
  return {
    total: all.length,
    unread: all.filter(n => !n.dismissed).length,
    critical: all.filter(n => n.severity === "critical").length,
    byModule: {
      crm: all.filter(n => n.module === "crm").length,
      hr: all.filter(n => n.module === "hr").length,
      finance: all.filter(n => n.module === "finance").length,
      studio: all.filter(n => n.module === "studio").length,
    },
  };
}
