export type AcademyDashboardWidget = {
  id: string;
  type: string;
  title: string;
  dataSource: string;
  requiredPermission?: string;
  metadata?: Record<string, unknown>;
};

export type AcademyDashboardDefinition = {
  id: string;
  applicationId: string;
  title: string;
  version: string;
  widgets: AcademyDashboardWidget[];
};

const registry = new Map<string, AcademyDashboardDefinition>();

export function resetAcademyDashboardsForTests(): void {
  registry.clear();
}

export const ACADEMYOS_DASHBOARDS: AcademyDashboardDefinition[] = [
  {
    id: "academyos.dashboard.executive",
    applicationId: "academyos",
    title: "Academy Executive Dashboard",
    version: "1.1.0",
    widgets: [
      {
        id: "admissions-kpi",
        type: "kpi",
        title: "Admissions",
        dataSource: "academyos.intelligence.admissions",
        requiredPermission: "academyos.admissions.read",
      },
      {
        id: "enrollment-kpi",
        type: "kpi",
        title: "Enrollment",
        dataSource: "academyos.intelligence.enrollment",
        requiredPermission: "academyos.reports.read",
      },
      {
        id: "attendance-kpi",
        type: "kpi",
        title: "Attendance",
        dataSource: "academyos.intelligence.attendance",
        requiredPermission: "academyos.attendance.read",
      },
      {
        id: "staffing-kpi",
        type: "kpi",
        title: "Staffing",
        dataSource: "academyos.intelligence.staffing",
        requiredPermission: "academyos.hr.read",
      },
      {
        id: "finance-kpi",
        type: "kpi",
        title: "Finance",
        dataSource: "academyos.intelligence.finance",
        requiredPermission: "academyos.finance.read",
      },
      {
        id: "academics-kpi",
        type: "kpi",
        title: "Academics",
        dataSource: "academyos.intelligence.academics",
        requiredPermission: "academyos.learning.read",
      },
    ],
  },
  {
    id: "academyos.dashboard.school",
    applicationId: "academyos",
    title: "School Leader Dashboard",
    version: "1.1.0",
    widgets: [
      {
        id: "school-enrollment",
        type: "chart",
        title: "School enrollment",
        dataSource: "academyos.intelligence.enrollment",
      },
      {
        id: "school-attendance",
        type: "chart",
        title: "Daily attendance",
        dataSource: "academyos.intelligence.attendance",
      },
      {
        id: "school-behavior",
        type: "chart",
        title: "Behavior trends",
        dataSource: "academyos.intelligence.behavior",
      },
      {
        id: "school-compliance",
        type: "chart",
        title: "Compliance readiness",
        dataSource: "academyos.intelligence.compliance",
      },
    ],
  },
];

export function registerAcademyDashboards(): AcademyDashboardDefinition[] {
  registry.clear();
  for (const dash of ACADEMYOS_DASHBOARDS) {
    registry.set(dash.id, structuredClone(dash));
  }
  return listAcademyDashboards();
}

export function listAcademyDashboards(): AcademyDashboardDefinition[] {
  return [...registry.values()].sort((a, b) => a.id.localeCompare(b.id));
}
