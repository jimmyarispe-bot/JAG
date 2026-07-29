export type AcademyNavItem = {
  id: string;
  label: string;
  href: string;
  icon?: string;
  children?: AcademyNavItem[];
  requiredPermission?: string;
};

export type AcademyNavigationDefinition = {
  id: string;
  applicationId: string;
  version: string;
  items: AcademyNavItem[];
};

const registry = new Map<string, AcademyNavigationDefinition>();

export function resetAcademyNavigationForTests(): void {
  registry.clear();
}

/**
 * Staff module navigation — live `/dashboard/*` routes (Wave 1).
 * Source of truth for Sidebar modules; presentation labels may be branded in UI.
 *
 * IDs align with `ModuleId` in `lib/dashboard/navigation` for icon continuity.
 */
export const ACADEMYOS_NAVIGATION: AcademyNavigationDefinition = {
  id: "academyos.main",
  applicationId: "academyos",
  version: "1.1.0",
  items: [
    {
      id: "executive",
      label: "Home",
      href: "/dashboard",
      requiredPermission: "academyos.access",
    },
    {
      id: "admissions",
      label: "Admissions",
      href: "/dashboard/admissions",
      requiredPermission: "academyos.admissions.read",
    },
    {
      id: "students",
      label: "Students",
      href: "/dashboard/students",
      requiredPermission: "academyos.students.read",
    },
    {
      id: "families",
      label: "Families",
      href: "/dashboard/families",
      requiredPermission: "academyos.students.read",
    },
    {
      id: "communications",
      label: "Communications",
      href: "/dashboard/communications",
      requiredPermission: "academyos.communications.read",
    },
    {
      id: "workflows",
      label: "Workflows",
      href: "/dashboard/workflows",
      requiredPermission: "academyos.access",
    },
    {
      id: "calendar",
      label: "Calendar",
      href: "/dashboard/calendar",
      requiredPermission: "academyos.learning.read",
    },
    {
      id: "documents",
      label: "Documents",
      href: "/dashboard/documents",
      requiredPermission: "academyos.access",
    },
    {
      id: "scheduling",
      label: "Scheduling",
      href: "/dashboard/scheduling",
      requiredPermission: "academyos.learning.read",
    },
    {
      id: "teacher",
      label: "Teacher Studio",
      href: "/dashboard/teacher",
      requiredPermission: "academyos.learning.read",
    },
    {
      id: "school-leader",
      label: "School Leader",
      href: "/dashboard/school-leader",
      requiredPermission: "academyos.operations.read",
    },
    {
      id: "scholarships",
      label: "Scholarships",
      href: "/dashboard/scholarships",
      requiredPermission: "academyos.scholarships.read",
    },
    {
      id: "finance",
      label: "Finance",
      href: "/dashboard/finance",
      requiredPermission: "academyos.finance.read",
    },
    {
      id: "hr",
      label: "Workforce",
      href: "/dashboard/hr",
      requiredPermission: "academyos.hr.read",
    },
  ],
};

export function registerAcademyNavigation(): AcademyNavigationDefinition {
  registry.set(ACADEMYOS_NAVIGATION.id, structuredClone(ACADEMYOS_NAVIGATION));
  return getAcademyNavigation()!;
}

export function getAcademyNavigation(): AcademyNavigationDefinition | null {
  return registry.get("academyos.main") ?? null;
}

export function listAcademyNavigation(): AcademyNavigationDefinition[] {
  return [...registry.values()];
}

/** Prefer registered nav; fall back to the static definition (client-safe). */
export function resolveAcademyNavigation(): AcademyNavigationDefinition {
  return getAcademyNavigation() ?? ACADEMYOS_NAVIGATION;
}
