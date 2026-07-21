import {
  ADMISSIONS_WORK_PERSPECTIVES,
  EXECUTIVE_WORK_PERSPECTIVES,
  FINANCE_WORK_PERSPECTIVES,
  HR_WORK_PERSPECTIVES,
  SCHEDULING_WORK_PERSPECTIVES,
  STUDENTS_WORK_PERSPECTIVES,
  TEACHER_WORK_PERSPECTIVES,
  type EnterpriseWorkspaceKey,
  WORKSPACE_WORK_PERSPECTIVES,
} from "@/lib/platform/jag-work/perspectives";

const WORKSPACE_META: Record<
  EnterpriseWorkspaceKey,
  { title: string; subtitle: string; hrefBase: string }
> = {
  teacher: {
    title: "Teacher Workspace",
    subtitle: "Daily instructional workflow",
    hrefBase: "/dashboard/teacher",
  },
  admissions: {
    title: "Admissions & Enrollment",
    subtitle: "Enrollment funnel",
    hrefBase: "/dashboard/admissions",
  },
  students: {
    title: "Student Information",
    subtitle: "Student Success (SSIS)",
    hrefBase: "/dashboard/students",
  },
  scheduling: {
    title: "Scheduling Intelligence",
    subtitle: "Sections, conflicts, and coverage",
    hrefBase: "/dashboard/scheduling",
  },
  finance: {
    title: "Finance",
    subtitle: "Billing and collections",
    hrefBase: "/dashboard/finance",
  },
  hr: {
    title: "Human Resources",
    subtitle: "Workforce operations",
    hrefBase: "/dashboard/hr",
  },
  executive: {
    title: "Executive Intelligence",
    subtitle: "Strategic oversight",
    hrefBase: "/dashboard/executive",
  },
};

/** Static sidebar items for immediate shell render (no data). */
export function staticWorkspaceSidebar(
  workspace: EnterpriseWorkspaceKey,
  activeId = "today"
): { id: string; label: string; active?: boolean }[] {
  return WORKSPACE_WORK_PERSPECTIVES[workspace].map((p) => ({
    id: p.id,
    label: p.label,
    active: p.id === activeId,
  }));
}

export function progressiveShellProps(workspace: EnterpriseWorkspaceKey) {
  const meta = WORKSPACE_META[workspace];
  return {
    title: meta.title,
    subtitle: meta.subtitle,
    breadcrumbs: [{ label: meta.title }],
    sidebarItems: staticWorkspaceSidebar(workspace),
    label: `Loading ${meta.title}…`,
  };
}

export {
  ADMISSIONS_WORK_PERSPECTIVES,
  EXECUTIVE_WORK_PERSPECTIVES,
  FINANCE_WORK_PERSPECTIVES,
  HR_WORK_PERSPECTIVES,
  SCHEDULING_WORK_PERSPECTIVES,
  STUDENTS_WORK_PERSPECTIVES,
  TEACHER_WORK_PERSPECTIVES,
};
