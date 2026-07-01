/**
 * THOTH AI Intelligence Layer — طبقة الذكاء الاصطناعي
 *
 * Predictive analytics, anomaly detection, smart recommendations,
 * sentiment analysis, and document intelligence.
 *
 * All functions are deterministic/mock for demo mode.
 * Architecture ready for LLM integration.
 */

import { CRM_CUSTOMERS, CRM_TIMELINE, CRM_ALERTS } from "./crm-data";
import { HR_EMPLOYEES, HR_ATTENDANCE, HR_TIMELINE } from "./hr-data";
import { HR_PAYROLL } from "./hr-data-full";
import { FIN_INVOICES, FIN_PAYMENTS, FIN_EXPENSES, FIN_METRICS } from "./finance-data";

// ═══════════════════════════════════════════════════════════
// 1. PREDICTIVE FORECASTING
// ═══════════════════════════════════════════════════════════

export interface ForecastResult {
  metric: string;
  metric_ar: string;
  current: number;
  predicted: number;
  confidence: number;
  trend: "up" | "down" | "stable";
  period: string;
  factors: string[];
  factors_ar: string[];
}

export function forecastRevenue(): ForecastResult {
  const monthlyData = FIN_METRICS.monthly_revenue_trend;
  const recent = monthlyData.slice(-3);
  const avg = recent.reduce((s, m) => s + m.revenue, 0) / recent.length;
  const growth = (recent[2].revenue - recent[0].revenue) / recent[0].revenue;

  const predicted = Math.round(avg * (1 + growth));
  const confidence = Math.min(95, Math.max(60, 85 - Math.abs(growth) * 100));

  return {
    metric: "Monthly Revenue", metric_ar: "الإيرادات الشهرية",
    current: recent[2].revenue, predicted, confidence,
    trend: growth > 0.02 ? "up" : growth < -0.02 ? "down" : "stable",
    period: "Next Month",
    factors: [
      "Recent 3-month average",
      `Growth rate: ${(growth * 100).toFixed(1)}%`,
      `${FIN_INVOICES.filter(i => i.status === "overdue").length} overdue invoices may delay collection`,
    ],
    factors_ar: [
      "متوسط آخر ٣ أشهر",
      `معدل النمو: ${(growth * 100).toFixed(1)}٪`,
      `${FIN_INVOICES.filter(i => i.status === "overdue").length} فواتير متأخرة قد تأخر التحصيل`,
    ],
  };
}

export function forecastCustomerGrowth(): ForecastResult {
  const activeCustomers = CRM_CUSTOMERS.filter(c => c.status === "active").length;
  const newCustomers = CRM_CUSTOMERS.filter(c => {
    const daysSinceCreation = (Date.now() - new Date(c.created_at).getTime()) / 86400000;
    return daysSinceCreation < 90;
  }).length;

  const growthRate = newCustomers / Math.max(activeCustomers, 1);
  const predicted = Math.round(activeCustomers * (1 + growthRate));
  const confidence = Math.min(90, Math.max(50, 75 - growthRate * 50));

  return {
    metric: "Customer Base", metric_ar: "قاعدة العملاء",
    current: activeCustomers, predicted, confidence,
    trend: growthRate > 0.05 ? "up" : growthRate < -0.05 ? "down" : "stable",
    period: "Next Quarter",
    factors: [
      `${newCustomers} new customers in last 90 days`,
      `${CRM_CUSTOMERS.filter(c => c.churn_risk === "high").length} high churn risk`,
      `${CRM_CUSTOMERS.filter(c => c.vip_level !== "none").length} VIP customers`,
    ],
    factors_ar: [
      `${newCustomers} عميل جديد في آخر ٩٠ يوم`,
      `${CRM_CUSTOMERS.filter(c => c.churn_risk === "high").length} خطر فقدان عالي`,
      `${CRM_CUSTOMERS.filter(c => c.vip_level !== "none").length} عملاء VIP`,
    ],
  };
}

export function forecastCashFlow(): ForecastResult {
  const receivables = FIN_INVOICES.filter(i => i.status !== "paid" && i.status !== "cancelled").reduce((s, i) => s + i.balance, 0);
  const overdueAmount = FIN_INVOICES.filter(i => i.status === "overdue").reduce((s, i) => s + i.balance, 0);
  const currentCash = FIN_METRICS.cash_balance;

  const expectedCollection = receivables * 0.85;
  const predicted = currentCash + expectedCollection - FIN_METRICS.total_expenses / 3;
  const confidence = Math.min(85, Math.max(50, 70 - (overdueAmount / Math.max(receivables, 1)) * 30));

  return {
    metric: "Cash Position", metric_ar: "الموقف النقدي",
    current: currentCash, predicted: Math.round(predicted), confidence,
    trend: predicted > currentCash ? "up" : "down",
    period: "Next Month",
    factors: [
      `${receivables.toLocaleString()} EGP in receivables`,
      `${overdueAmount.toLocaleString()} EGP overdue`,
      `Expected collection rate: 85%`,
    ],
    factors_ar: [
      `${receivables.toLocaleString()} ج.م في المستحقات`,
      `${overdueAmount.toLocaleString()} ج.م متأخرة`,
      `معدل التحصيل المتوقع: ٨٥٪`,
    ],
  };
}

export function getPredictiveForecasts(): ForecastResult[] {
  return [forecastRevenue(), forecastCustomerGrowth(), forecastCashFlow()];
}

// ═══════════════════════════════════════════════════════════
// 2. ANOMALY DETECTION
// ═══════════════════════════════════════════════════════════

export interface Anomaly {
  id: string;
  module: string;
  type: "spike" | "drop" | "unusual_pattern" | "threshold_breach";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  metric: string;
  current_value: number;
  expected_range: [number, number];
  detected_at: string;
}

export function detectAnomalies(): Anomaly[] {
  const anomalies: Anomaly[] = [];

  // Financial anomalies: unusually large invoices
  const avgInvoice = FIN_INVOICES.reduce((s, i) => s + i.total, 0) / FIN_INVOICES.length;
  const largeInvoices = FIN_INVOICES.filter(i => i.total > avgInvoice * 2);
  largeInvoices.forEach(inv => {
    anomalies.push({
      id: `anom-inv-${inv.id}`, module: "finance", type: "spike",
      severity: inv.total > avgInvoice * 3 ? "high" : "medium",
      title: `Unusually large invoice: ${inv.invoice_number}`,
      title_ar: `فاتورة كبيرة بشكل غير معتاد: ${inv.invoice_number}`,
      description: `${inv.total.toLocaleString()} EGP is ${Math.round(inv.total / avgInvoice)}x the average (${avgInvoice.toLocaleString()} EGP)`,
      description_ar: `${inv.total.toLocaleString()} ج.م وهو ${Math.round(inv.total / avgInvoice)} ضعف المتوسط (${avgInvoice.toLocaleString()} ج.م)`,
      metric: "invoice_amount", current_value: inv.total,
      expected_range: [avgInvoice * 0.5, avgInvoice * 2], detected_at: inv.created_at,
    });
  });

  // HR anomalies: employees with many absences
  const highAbsenceEmployees = HR_EMPLOYEES.filter(e => e.attendance_risk === "high" && e.status === "active");
  highAbsenceEmployees.forEach(emp => {
    anomalies.push({
      id: `anom-hr-${emp.id}`, module: "hr", type: "unusual_pattern",
      severity: "high",
      title: `High attendance risk: ${emp.full_name}`,
      title_ar: `خطر حضور عالي: ${emp.full_name_ar}`,
      description: `${emp.full_name} has been flagged for repeated attendance issues`,
      description_ar: `تم تصنيف ${emp.full_name_ar} لمشاكل حضور متكررة`,
      metric: "attendance_risk", current_value: 3,
      expected_range: [0, 1], detected_at: new Date().toISOString(),
    });
  });

  // CRM anomalies: customers with high spend but no recent activity
  const dormantHighSpenders = CRM_CUSTOMERS.filter(c => {
    const daysSinceActivity = (Date.now() - new Date(c.last_activity).getTime()) / 86400000;
    return c.total_spend > 100000 && daysSinceActivity > 30;
  });
  dormantHighSpenders.forEach(cust => {
    anomalies.push({
      id: `anom-crm-${cust.id}`, module: "crm", type: "unusual_pattern",
      severity: "critical",
      title: `High-value customer inactive: ${cust.name}`,
      title_ar: `عميل عالي القيمة غير نشط: ${cust.name_ar}`,
      description: `${cust.name} spent ${cust.total_spend.toLocaleString()} EGP but hasn't been active for ${Math.round((Date.now() - new Date(cust.last_activity).getTime()) / 86400000)} days`,
      description_ar: `${cust.name_ar} أنفق ${cust.total_spend.toLocaleString()} ج.م لكنه لم يكن نشطاً لمدة ${Math.round((Date.now() - new Date(cust.last_activity).getTime()) / 86400000)} يوم`,
      metric: "customer_activity", current_value: 0,
      expected_range: [1, 30], detected_at: new Date().toISOString(),
    });
  });

  // Finance anomalies: expenses exceeding budget
  const expenseByCategory = FIN_EXPENSES.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);
  Object.entries(expenseByCategory).forEach(([cat, total]) => {
    if (total > 200000) {
      anomalies.push({
        id: `anom-exp-${cat}`, module: "finance", type: "threshold_breach",
        severity: "medium",
        title: `High expense category: ${cat}`,
        title_ar: `فئة مصروفات عالية: ${cat}`,
        description: `${cat} expenses total ${total.toLocaleString()} EGP`,
        description_ar: `مصروفات ${cat} الإجمالية ${total.toLocaleString()} ج.م`,
        metric: "expense_category", current_value: total,
        expected_range: [0, 200000], detected_at: new Date().toISOString(),
      });
    }
  });

  return anomalies.sort((a, b) => {
    const sev = { critical: 0, high: 1, medium: 2, low: 3 };
    return sev[a.severity] - sev[b.severity];
  });
}

// ═══════════════════════════════════════════════════════════
// 3. SMART RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════

export interface Recommendation {
  id: string;
  module: string;
  type: "upsell" | "retention" | "efficiency" | "pricing" | "inventory" | "cross_sell";
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  priority: "high" | "medium" | "low";
  estimated_impact: string;
  estimated_impact_ar: string;
  target_entity: string;
  target_entity_ar: string;
}

export function getSmartRecommendations(): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Upsell: VIP customers who buy frequently
  CRM_CUSTOMERS.filter(c => c.vip_level === "platinum" && c.total_orders > 20).forEach(c => {
    recommendations.push({
      id: `rec-upsell-${c.id}`, module: "crm", type: "upsell",
      title: `Upsell premium collection to ${c.name}`,
      title_ar: `بيع مجموعة فاخرة لـ ${c.name_ar}`,
      description: `${c.name} has ${c.total_orders} orders and high spend. Suggest exclusive collection.`, description_ar: `${c.name_ar} لديه ${c.total_orders} طلبات وإنفاق عالي. اقترح مجموعة حصرية.`,
      priority: "high", estimated_impact: `+${Math.round(c.total_spend * 0.15).toLocaleString()} EGP`, estimated_impact_ar: `+${Math.round(c.total_spend * 0.15).toLocaleString()} ج.م`,
      target_entity: c.id, target_entity_ar: c.name_ar,
    });
  });

  // Retention: customers at risk of churning
  CRM_CUSTOMERS.filter(c => c.churn_risk === "high").forEach(c => {
    recommendations.push({
      id: `rec-retention-${c.id}`, module: "crm", type: "retention",
      title: `Re-engage ${c.name} with personalized offer`,
      title_ar: `إعادة تفاعل ${c.name_ar} بعرض مخصص`,
      description: `Send personalized WhatsApp with exclusive discount to prevent churn`, description_ar: "إرسال رسالة واتساب شخصية بخصم حصري لمنع فقدان العميل",
      priority: "high", estimated_impact: `Retain ${c.total_spend.toLocaleString()} EGP lifetime value`, estimated_impact_ar: `الاحتفاظ بقيمة ${c.total_spend.toLocaleString()} ج.م`,
      target_entity: c.id, target_entity_ar: c.name_ar,
    });
  });

  // Cross-sell: customers who buy one category
  CRM_CUSTOMERS.filter(c => c.tags.includes("Bridal") && !c.tags.includes("Evening Wear")).forEach(c => {
    recommendations.push({
      id: `rec-cross-${c.id}`, module: "crm", type: "cross_sell",
      title: `Cross-sell evening wear to ${c.name}`,
      title_ar: `بيع ملابس سهرة لـ ${c.name_ar}`,
      description: `${c.name} buys bridal but not evening wear. Suggest evening collection.`, description_ar: `${c.name_ar} يشتري عروس لكن لا يشتري سهرة. اقترح مجموعة السهرة.`,
      priority: "medium", estimated_impact: `+${Math.round(c.average_order * 0.5).toLocaleString()} EGP potential`, estimated_impact_ar: `+${Math.round(c.average_order * 0.5).toLocaleString()} ج.م محتمل`,
      target_entity: c.id, target_entity_ar: c.name_ar,
    });
  });

  // Efficiency: employees with high overtime
  const highOvertimeEmployees = HR_PAYROLL.filter(p => p.overtime_pay > p.basic_salary * 0.1);
  highOvertimeEmployees.forEach(p => {
    const emp = HR_EMPLOYEES.find(e => e.id === p.employee_id);
    if (emp) {
      recommendations.push({
        id: `rec-eff-${emp.id}`, module: "hr", type: "efficiency",
        title: `Review workload for ${emp.full_name}`,
        title_ar: `مراجعة عبء العمل لـ ${emp.full_name_ar}`,
        description: `Overtime is ${Math.round(p.overtime_pay / p.basic_salary * 100)}% of salary. Consider hiring or redistribution.`, description_ar: `الوقت الإضافي ${Math.round(p.overtime_pay / p.basic_salary * 100)}٪ من الراتب. فكر في التوظيف أو إعادة التوزيع.`,
        priority: "medium", estimated_impact: `Save ${p.overtime_pay.toLocaleString()} EGP/month`, estimated_impact_ar: `توفير ${p.overtime_pay.toLocaleString()} ج.م/شهر`,
        target_entity: emp.id, target_entity_ar: emp.full_name_ar,
      });
    }
  });

  return recommendations.sort((a, b) => {
    const pri = { high: 0, medium: 1, low: 2 };
    return pri[a.priority] - pri[b.priority];
  });
}

// ═══════════════════════════════════════════════════════════
// 4. SENTIMENT ANALYSIS (Mock)
// ═══════════════════════════════════════════════════════════

export interface SentimentResult {
  text: string;
  text_ar: string;
  sentiment: "positive" | "neutral" | "negative";
  confidence: number;
  keywords: string[];
  keywords_ar: string[];
}

export function analyzeSentiment(text: string): SentimentResult {
  const positiveWords = ["great", "excellent", "amazing", "love", "perfect", "beautiful", "happy", "wonderful", "best", "fantastic", "ممتاز", "رائع", "جميل", "سعيد", "أفضل"];
  const negativeWords = ["bad", "terrible", "awful", "hate", "worst", "ugly", "angry", "disappointed", "complaint", "problem", "سيء", "مشكلة", "شكوى", "غاضب", "خيبة"];
  const words = text.toLowerCase().split(/\s+/);
  const posCount = words.filter(w => positiveWords.some(pw => w.includes(pw))).length;
  const negCount = words.filter(w => negativeWords.some(nw => w.includes(nw))).length;

  const sentiment = posCount > negCount ? "positive" : negCount > posCount ? "negative" : "neutral";
  const confidence = Math.min(95, 70 + Math.abs(posCount - negCount) * 10);

  return { text, text_ar: text, sentiment, confidence, keywords: words.slice(0, 3), keywords_ar: words.slice(0, 3) };
}

// ═══════════════════════════════════════════════════════════
// 5. DOCUMENT INTELLIGENCE (Mock)
// ═══════════════════════════════════════════════════════════

export interface DocumentInsight {
  document_type: string;
  document_type_ar: string;
  key_fields: { label: string; label_ar: string; value: string }[];
  summary: string;
  summary_ar: string;
  action_items: string[];
  action_items_ar: string[];
  risk_level: "low" | "medium" | "high";
}

export function analyzeDocument(type: string, content: string): DocumentInsight {
  if (type === "invoice") {
    return {
      document_type: "Invoice", document_type_ar: "فاتورة",
      key_fields: [
        { label: "Amount", label_ar: "المبلغ", value: "Extracted from content" },
        { label: "Due Date", label_ar: "تاريخ الاستحقاق", value: "Extracted from content" },
        { label: "Customer", label_ar: "العميل", value: "Extracted from content" },
      ],
      summary: "Invoice document analyzed. Key financial data extracted.", summary_ar: "تم تحليل مستند الفاتورة. تم استخراج البيانات المالية الرئيسية.",
      action_items: ["Verify amount matches order", "Check payment terms", "Confirm customer details"],
      action_items_ar: ["التحقق من المبلغ يطابق الطلب", "فحص شروط الدفع", "تأكيد بيانات العميل"],
      risk_level: "low",
    };
  }
  if (type === "contract") {
    return {
      document_type: "Contract", document_type_ar: "عقد",
      key_fields: [
        { label: "Party A", label_ar: "الطرف أول", value: "Extracted from content" },
        { label: "Party B", label_ar: "الطرف الثاني", value: "Extracted from content" },
        { label: "Duration", label_ar: "المدة", value: "Extracted from content" },
      ],
      summary: "Contract document analyzed. Key terms identified.", summary_ar: "تم تحليل مستند العقد. تم تحديد الشروط الرئيسية.",
      action_items: ["Review payment terms", "Check termination clauses", "Verify signatures"],
      action_items_ar: ["مراجعة شروط الدفع", "فحص شروط الإنهاء", "التحقق من التوقيعات"],
      risk_level: "medium",
    };
  }
  return {
    document_type: "Document", document_type_ar: "مستند",
    key_fields: [], summary: "Document analyzed.", summary_ar: "تم تحليل المستند.",
    action_items: [], action_items_ar: [], risk_level: "low",
  };
}

// ═══════════════════════════════════════════════════════════
// 6. UNIFIED AI DASHBOARD
// ═══════════════════════════════════════════════════════════

export interface AIDashboard {
  forecasts: ForecastResult[];
  anomalies: Anomaly[];
  recommendations: Recommendation[];
  summary: string;
  summary_ar: string;
  health_score: number;
  health_label: string;
  health_label_ar: string;
}

export function getAIDashboard(): AIDashboard {
  const forecasts = getPredictiveForecasts();
  const anomalies = detectAnomalies();
  const recommendations = getSmartRecommendations();

  const criticalAnomalies = anomalies.filter(a => a.severity === "critical").length;
  const highRecommendations = recommendations.filter(r => r.priority === "high").length;

  const healthScore = Math.max(0, Math.min(100, 85 - criticalAnomalies * 10 - highRecommendations * 5));
  const healthLabel = healthScore >= 80 ? "Excellent" : healthScore >= 60 ? "Good" : healthScore >= 40 ? "Needs Attention" : "At Risk";
  const healthLabelAr = healthScore >= 80 ? "ممتاز" : healthScore >= 60 ? "جيد" : healthScore >= 40 ? "يحتاج انتباه" : "في خطر";

  return {
    forecasts, anomalies, recommendations,
    summary: `System health: ${healthScore}/100. ${criticalAnomalies} critical anomalies detected. ${highRecommendations} high-priority recommendations. Revenue forecast: ${forecasts[0]?.trend || "stable"}.`,
    summary_ar: `صحة النظام: ${healthScore}/١٠٠. تم اكتشاف ${criticalAnomalies} حالات شاذة حرجة. ${highRecommendations} توصيات عالية الأولوية. توقع الإيرادات: ${forecasts[0]?.trend === "up" ? "صاعد" : forecasts[0]?.trend === "down" ? "هابط" : "مستقر"}.`,
    health_score: healthScore, health_label: healthLabel, health_label_ar: healthLabelAr,
  };
}
