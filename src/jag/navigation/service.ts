import {
  getPackageNavigation,
  listJagStaffNavModules,
  listPackageNavigations,
  type JagNavItem,
  type JagNavigationDefinition,
} from "@/jag/navigation/registry";

export type JagNavigationService = {
  listDefinitions(): JagNavigationDefinition[];
  getForApplication(applicationId: string): JagNavigationDefinition | null;
  listStaffModules(): ReturnType<typeof listJagStaffNavModules>;
  findByHref(pathname: string): (JagNavItem & { applicationId: string }) | null;
};

/**
 * JAG Navigation Service — sole owner of sidebar assembly.
 * Application packages register definitions; they do not own chrome behavior.
 */
export function getJagNavigationService(): JagNavigationService {
  return {
    listDefinitions: listPackageNavigations,
    getForApplication: getPackageNavigation,
    listStaffModules: listJagStaffNavModules,
    findByHref(pathname: string) {
      const modules = listJagStaffNavModules();
      if (pathname === "/dashboard") {
        const home = modules.find((m) => m.href === "/dashboard");
        return home
          ? {
              id: home.id,
              label: home.label,
              href: home.href,
              requiredPermission: home.requiredPermission,
              applicationId: home.applicationId,
            }
          : null;
      }
      const matches = modules
        .filter((m) => m.href !== "/dashboard" && pathname.startsWith(m.href))
        .sort((a, b) => b.href.length - a.href.length);
      const hit = matches[0];
      if (!hit) return null;
      return {
        id: hit.id,
        label: hit.label,
        href: hit.href,
        requiredPermission: hit.requiredPermission,
        applicationId: hit.applicationId,
      };
    },
  };
}
