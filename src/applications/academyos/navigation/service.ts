/**
 * AcademyOS Navigation Service — sole consumer API for UI surfaces.
 *
 * Registry → Navigation Service → Sidebar / breadcrumbs / future command palette
 */

import {
  ACADEMYOS_NAVIGATION,
  resolveAcademyNavigation,
  type AcademyNavItem,
  type AcademyNavigationDefinition,
} from "@/applications/academyos/navigation/definition";

export type AcademyStaffNavModule = {
  id: string;
  href: string;
  label: string;
  requiredPermission?: string;
};

export type AcademyNavigationService = {
  getDefinition(): AcademyNavigationDefinition;
  listStaffModules(): AcademyStaffNavModule[];
  findByHref(pathname: string): AcademyNavItem | null;
  findById(id: string): AcademyNavItem | null;
};

function toStaffModule(item: AcademyNavItem): AcademyStaffNavModule {
  return {
    id: item.id,
    href: item.href,
    label: item.label,
    requiredPermission: item.requiredPermission,
  };
}

export function createAcademyNavigationService(
  definition?: AcademyNavigationDefinition
): AcademyNavigationService {
  const resolved = definition ?? resolveAcademyNavigation();

  return {
    getDefinition() {
      return resolved;
    },

    listStaffModules() {
      return resolved.items.map(toStaffModule);
    },

    findByHref(pathname: string) {
      if (pathname === "/dashboard") {
        return resolved.items.find((item) => item.href === "/dashboard") ?? null;
      }
      const matches = resolved.items
        .filter(
          (item) =>
            item.href !== "/dashboard" && pathname.startsWith(item.href)
        )
        .sort((a, b) => b.href.length - a.href.length);
      return matches[0] ?? null;
    },

    findById(id: string) {
      return resolved.items.find((item) => item.id === id) ?? null;
    },
  };
}

/** Process-wide helper — uses registered nav when available, else static definition. */
export function getAcademyNavigationService(): AcademyNavigationService {
  return createAcademyNavigationService();
}

/** Static definition accessor for client bundles (no registry dependency). */
export function getStaticAcademyNavigation(): AcademyNavigationDefinition {
  return ACADEMYOS_NAVIGATION;
}
