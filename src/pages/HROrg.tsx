/**
 * Organization Structure — هيكل المؤسسة
 *
 * Departments, branches, org chart, and reporting lines
 */

import { useState, useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { useLocation } from "wouter";
import {
  HR_EMPLOYEES, HR_DEPARTMENTS, HR_BRANCHES,
  type HREmployee,
} from "../lib/hr-data";
import {
  Building2, MapPin, Users, ChevronRight, Phone, Mail, Briefcase,
  Star, Shield, Target, TrendingUp, Eye, Search,
} from "lucide-react";

const cardV: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.3, ease: [0.22, 1, 0.36, 1] } }),
};

const DEPT_COLORS: Record<string, string> = {
  management: "#1E3A5F", sales: "#E07A5F", production: "#3B82F6",
  design: "#EC4899", warehouse: "#F59E0B", delivery: "#F97316", admin: "#10B981",
};

export default function HROrg() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [, navigate] = useLocation();
  const [view, setView] = useState<"departments" | "branches" | "chart">("departments");
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

  const deptEmployees = useMemo(() => {
    if (!selectedDept) return [];
    return HR_EMPLOYEES.filter(e => e.department === selectedDept && e.status === "active");
  }, [selectedDept]);

  const branchEmployees = useMemo(() => {
    if (!selectedBranch) return [];
    return HR_EMPLOYEES.filter(e => e.branch === selectedBranch && e.status === "active");
  }, [selectedBranch]);

  const orgChart = useMemo(() => {
    const gm = HR_EMPLOYEES.find(e => e.id === "e01");
    const managers = HR_EMPLOYEES.filter(e => e.manager_id === "e01" && e.status === "active");
    return { gm, managers };
  }, []);

  return (
    <div className="min-h-full px-6 md:px-8 py-6 max-w-[1400px] mx-auto space-y-5">
      {/* Header */}
      <motion.div variants={cardV} custom={0} initial="hidden" animate="visible" className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>
            {ar ? "هيكل المؤسسة" : "Organization Structure"}
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            {ar ? "الأقسام والفروع وخطوط التقارير" : "Departments, branches, and reporting lines"}
          </p>
        </div>
      </motion.div>

      {/* View Tabs */}
      <motion.div variants={cardV} custom={1} initial="hidden" animate="visible" className="flex gap-2">
        {[
          { id: "departments" as const, en: "Departments", ar: "الأقسام", icon: Building2 },
          { id: "branches" as const, en: "Branches", ar: "الفروع", icon: MapPin },
          { id: "chart" as const, en: "Org Chart", ar: "المخطط التنظيمي", icon: Users },
        ].map(t => (
          <button key={t.id} onClick={() => { setView(t.id); setSelectedDept(null); setSelectedBranch(null); }}
            className={`px-4 py-2.5 rounded-xl text-[13px] font-medium transition-colors flex items-center gap-2
              ${view === t.id ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}>
            <t.icon size={15} />{ar ? t.ar : t.en}
          </button>
        ))}
      </motion.div>

      {/* Departments View */}
      {view === "departments" && (
        <motion.div variants={cardV} custom={2} initial="hidden" animate="visible" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {HR_DEPARTMENTS.map((dept, i) => (
              <div key={dept.id} onClick={() => setSelectedDept(selectedDept === dept.id ? null : dept.id)}
                className={`p-5 rounded-xl border transition-all cursor-pointer hover:shadow-md ${selectedDept === dept.id ? "border-primary bg-primary/5" : "border-border/40 bg-background"}`}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: (DEPT_COLORS[dept.id.replace("d0", "").replace("d", "")] || "#6B7280") + "15" }}>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: DEPT_COLORS[dept.id.replace("d0", "").replace("d", "")] || "#6B7280" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-semibold">{ar ? dept.name_ar : dept.name}</h3>
                    <p className="text-[11px] text-muted-foreground">{ar ? dept.head_ar : dept.head}</p>
                  </div>
                  <ChevronRight size={14} className={`text-muted-foreground/30 transition-transform ${selectedDept === dept.id ? "rotate-90" : ""}`} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Users size={11} />{dept.employee_count} {ar ? "موظف" : "employees"}</span>
                  <span className="font-medium text-foreground">{dept.budget.toLocaleString()} EGP</span>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Department Employees */}
          {selectedDept && deptEmployees.length > 0 && (
            <div className="p-5 rounded-xl border border-border/40 bg-background">
              <h3 className="text-[13px] font-semibold mb-3">{ar ? "موظفو القسم" : "Department Members"}</h3>
              <div className="space-y-2">
                {deptEmployees.map(emp => (
                  <div key={emp.id} onClick={() => navigate(`/hr/employees/${emp.id}`)}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: emp.avatar_color }}>
                      {emp.full_name.split(" ").map(w => w[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium">{ar && emp.full_name_ar ? emp.full_name_ar : emp.full_name}</p>
                      <p className="text-[10px] text-muted-foreground">{ar && emp.job_title_ar ? emp.job_title_ar : emp.job_title}</p>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">{emp.employee_number}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Branches View */}
      {view === "branches" && (
        <motion.div variants={cardV} custom={2} initial="hidden" animate="visible" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {HR_BRANCHES.map((branch, i) => (
              <div key={branch.id} onClick={() => setSelectedBranch(selectedBranch === branch.id ? null : branch.id)}
                className={`p-6 rounded-xl border transition-all cursor-pointer hover:shadow-md ${selectedBranch === branch.id ? "border-primary bg-primary/5" : "border-border/40 bg-background"}`}>
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin size={20} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[16px] font-semibold" style={{ fontFamily: "var(--app-font-serif)" }}>{ar ? branch.name_ar : branch.name}</h3>
                    <p className="text-[12px] text-muted-foreground mt-0.5">{branch.address}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-muted/30 text-center">
                    <p className="text-[18px] font-bold text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>{branch.employee_count}</p>
                    <p className="text-[10px] text-muted-foreground">{ar ? "موظف" : "Employees"}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30 text-center">
                    <p className="text-[12px] font-medium text-foreground">{branch.manager}</p>
                    <p className="text-[10px] text-muted-foreground">{ar ? "المدير" : "Manager"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Branch Employees */}
          {selectedBranch && branchEmployees.length > 0 && (
            <div className="p-5 rounded-xl border border-border/40 bg-background">
              <h3 className="text-[13px] font-semibold mb-3">{ar ? "موظفو الفرع" : "Branch Employees"}</h3>
              <div className="space-y-2">
                {branchEmployees.map(emp => (
                  <div key={emp.id} onClick={() => navigate(`/hr/employees/${emp.id}`)}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: emp.avatar_color }}>
                      {emp.full_name.split(" ").map(w => w[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium">{ar && emp.full_name_ar ? emp.full_name_ar : emp.full_name}</p>
                      <p className="text-[10px] text-muted-foreground">{ar && emp.job_title_ar ? emp.job_title_ar : emp.job_title}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{emp.department}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Org Chart View */}
      {view === "chart" && (
        <motion.div variants={cardV} custom={2} initial="hidden" animate="visible" className="space-y-4">
          {/* GM Level */}
          <div className="flex justify-center">
            {orgChart.gm && (
              <div onClick={() => navigate(`/hr/employees/${orgChart.gm?.id}`)}
                className="p-4 rounded-xl border-2 border-primary bg-primary/5 cursor-pointer hover:shadow-md transition-all text-center w-[220px]">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-[16px] font-bold text-white mx-auto mb-2" style={{ backgroundColor: orgChart.gm.avatar_color }}>
                  {orgChart.gm.full_name.split(" ").map(w => w[0]).join("")}
                </div>
                <p className="text-[14px] font-semibold">{ar && orgChart.gm.full_name_ar ? orgChart.gm.full_name_ar : orgChart.gm.full_name}</p>
                <p className="text-[11px] text-primary font-medium">{ar && orgChart.gm.job_title_ar ? orgChart.gm.job_title_ar : orgChart.gm.job_title}</p>
              </div>
            )}
          </div>

          {/* Connector */}
          <div className="flex justify-center">
            <div className="w-px h-8 bg-border/60" />
          </div>

          {/* Horizontal Line */}
          <div className="flex justify-center">
            <div className="h-px bg-border/60" style={{ width: `${Math.min(orgChart.managers.length * 240, 100)}%` }} />
          </div>

          {/* Manager Level */}
          <div className="flex justify-center gap-4 flex-wrap">
            {orgChart.managers.map(mgr => (
              <div key={mgr.id} className="flex flex-col items-center">
                <div className="w-px h-6 bg-border/60" />
                <div onClick={() => navigate(`/hr/employees/${mgr.id}`)}
                  className="p-3 rounded-xl border border-border/40 bg-background cursor-pointer hover:shadow-md transition-all text-center w-[200px]">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[12px] font-bold text-white mx-auto mb-2" style={{ backgroundColor: mgr.avatar_color }}>
                    {mgr.full_name.split(" ").map(w => w[0]).join("")}
                  </div>
                  <p className="text-[12px] font-medium">{ar && mgr.full_name_ar ? mgr.full_name_ar : mgr.full_name}</p>
                  <p className="text-[10px] text-primary">{ar && mgr.job_title_ar ? mgr.job_title_ar : mgr.job_title}</p>
                  <p className="text-[9px] text-muted-foreground mt-1">{mgr.department}</p>
                </div>

                {/* Report Count */}
                {(() => {
                  const reports = HR_EMPLOYEES.filter(e => e.manager_id === mgr.id && e.status === "active").length;
                  return reports > 0 ? (
                    <div className="mt-2 text-center">
                      <div className="w-px h-4 bg-border/40 mx-auto" />
                      <span className="text-[9px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{reports} {ar ? "تقارير" : "reports"}</span>
                    </div>
                  ) : null;
                })()}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
