/**
 * RC-4 — role acceptance catalog (critical workflows + URLs).
 */

export type RoleId =
  | "founder"
  | "ceo"
  | "school_leader"
  | "teacher"
  | "parent"
  | "student"
  | "employee";

export type WorkflowStep = {
  id: string;
  name: string;
  path: string;
  /** When true, unauthenticated access must redirect to /login */
  requiresAuth: boolean;
};

export type RoleAcceptanceDef = {
  id: RoleId;
  label: string;
  home: string;
  workflows: WorkflowStep[];
};

export const ROLE_ACCEPTANCE: RoleAcceptanceDef[] = [
  {
    id: "founder",
    label: "Founder",
    home: "/dashboard",
    workflows: [
      { id: "f.brief", name: "Founder Morning Brief", path: "/dashboard", requiresAuth: true },
      { id: "f.mission", name: "Mission Control", path: "/dashboard/mission-control", requiresAuth: true },
      { id: "f.exec", name: "Executive Intelligence", path: "/dashboard/executive", requiresAuth: true },
      { id: "f.strategic", name: "Strategic planning", path: "/dashboard/executive/strategic", requiresAuth: true },
      { id: "f.fi", name: "Financial Intelligence", path: "/dashboard/finance/intelligence", requiresAuth: true },
      { id: "f.admin", name: "System settings / admin", path: "/dashboard/admin", requiresAuth: true },
      { id: "f.integrations", name: "Integrations", path: "/dashboard/integrations", requiresAuth: true },
      { id: "f.security", name: "Audit / security admin", path: "/dashboard/admin/security", requiresAuth: true },
      { id: "f.ecc", name: "Executive Command Center", path: "/exec", requiresAuth: true },
    ],
  },
  {
    id: "ceo",
    label: "CEO",
    home: "/exec",
    workflows: [
      { id: "c.ecc", name: "ECC home", path: "/exec", requiresAuth: true },
      { id: "c.brief", name: "Executive brief", path: "/exec/brief", requiresAuth: true },
      { id: "c.health", name: "Organization health", path: "/exec/health", requiresAuth: true },
      { id: "c.kpis", name: "KPI dashboards", path: "/dashboard/executive/kpis", requiresAuth: true },
      { id: "c.admissions", name: "Admissions oversight", path: "/dashboard/admissions", requiresAuth: true },
      { id: "c.finance", name: "Finance", path: "/dashboard/finance", requiresAuth: true },
      { id: "c.hr", name: "HR", path: "/dashboard/hr", requiresAuth: true },
      { id: "c.compliance", name: "Compliance", path: "/dashboard/compliance", requiresAuth: true },
      { id: "c.reports", name: "Executive reporting", path: "/dashboard/executive/reports", requiresAuth: true },
    ],
  },
  {
    id: "school_leader",
    label: "School Leader",
    home: "/dashboard",
    workflows: [
      { id: "sl.admissions", name: "Admissions pipeline", path: "/dashboard/admissions", requiresAuth: true },
      { id: "sl.students", name: "Student management", path: "/dashboard/students", requiresAuth: true },
      { id: "sl.scheduling", name: "Scheduling / class ops", path: "/dashboard/scheduling", requiresAuth: true },
      { id: "sl.teacher", name: "Teacher assignment surface", path: "/dashboard/teacher", requiresAuth: true },
      { id: "sl.finance", name: "Campus finance", path: "/dashboard/finance", requiresAuth: true },
      { id: "sl.hr", name: "Staff / HR", path: "/dashboard/hr", requiresAuth: true },
    ],
  },
  {
    id: "teacher",
    label: "Teacher",
    home: "/dashboard/teacher",
    workflows: [
      { id: "t.home", name: "Teacher dashboard", path: "/dashboard/teacher", requiresAuth: true },
      { id: "t.scheduling", name: "Schedule context", path: "/dashboard/scheduling", requiresAuth: true },
      { id: "t.students", name: "Student success", path: "/dashboard/students", requiresAuth: true },
    ],
  },
  {
    id: "parent",
    label: "Parent",
    home: "/portal",
    workflows: [
      { id: "p.home", name: "Parent dashboard", path: "/portal", requiresAuth: true },
      { id: "p.progress", name: "Progress", path: "/portal/progress", requiresAuth: true },
      { id: "p.attendance", name: "Attendance (via progress/calendar)", path: "/portal/calendar", requiresAuth: true },
      { id: "p.finance", name: "Tuition / payments", path: "/portal/finance", requiresAuth: true },
      { id: "p.documents", name: "Documents", path: "/portal/documents", requiresAuth: true },
      { id: "p.messages", name: "Messaging", path: "/portal/messages", requiresAuth: true },
      { id: "p.apply", name: "Admissions portal entry", path: "/apply/portal", requiresAuth: false },
    ],
  },
  {
    id: "student",
    label: "Student",
    home: "/portal/student",
    workflows: [
      { id: "s.home", name: "Student dashboard", path: "/portal/student", requiresAuth: true },
      { id: "s.schedule", name: "Schedule", path: "/portal/student/schedule", requiresAuth: true },
      { id: "s.goals", name: "Goals / progress", path: "/portal/student/goals", requiresAuth: true },
      { id: "s.messages", name: "Messaging", path: "/portal/messages", requiresAuth: true },
    ],
  },
  {
    id: "employee",
    label: "Employee / HR self-service",
    home: "/dashboard/employee",
    workflows: [
      { id: "e.home", name: "Employee profile portal", path: "/dashboard/employee", requiresAuth: true },
      { id: "e.hr", name: "HR module (staff)", path: "/dashboard/hr", requiresAuth: true },
    ],
  },
];

/** Cross-role end-to-end business processes (acceptance checklist). */
export const CROSS_ROLE_SCENARIOS = [
  {
    id: "xr.lead_to_billing",
    name: "Lead → Admission → Enrollment → Scheduling → Attendance → Progress → Billing",
    paths: [
      "/dashboard/admissions",
      "/dashboard/students",
      "/dashboard/scheduling",
      "/dashboard/teacher",
      "/portal/progress",
      "/portal/finance",
      "/dashboard/finance",
    ],
  },
  {
    id: "xr.teacher_parent_exec",
    name: "Teacher progress → Parent views → Executive dashboard",
    paths: ["/dashboard/teacher", "/portal/progress", "/dashboard/executive", "/exec"],
  },
  {
    id: "xr.finance_exec",
    name: "Financial transaction → Reporting → Executive metrics",
    paths: ["/dashboard/finance", "/dashboard/finance/intelligence", "/dashboard/executive/kpis", "/exec/brief"],
  },
  {
    id: "xr.integration_audit",
    name: "Integration sync → Ops → Audit logging",
    paths: ["/dashboard/integrations", "/exec/integrations", "/dashboard/admin/security"],
  },
] as const;

/** Public routes that must remain reachable without auth. */
export const PUBLIC_ACCEPTANCE_PATHS = [
  "/login",
  "/api/health",
  "/api/ready",
  "/apply",
] as const;
