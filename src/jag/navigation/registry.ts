/**
 * JAG Navigation Registry — packages contribute definitions; JAG owns assembly.
 */

export type JagNavItem = {
  id: string;
  label: string;
  href: string;
  icon?: string;
  children?: readonly JagNavItem[];
  requiredPermission?: string;
};

export type JagNavigationDefinition = {
  id: string;
  applicationId: string;
  version: string;
  items: readonly JagNavItem[];
};

const byApplication = new Map<string, JagNavigationDefinition>();

export function registerPackageNavigation(
  definition: JagNavigationDefinition
): void {
  byApplication.set(definition.applicationId, structuredClone(definition));
}

export function getPackageNavigation(
  applicationId: string
): JagNavigationDefinition | null {
  return byApplication.get(applicationId) ?? null;
}

export function listPackageNavigations(): JagNavigationDefinition[] {
  return [...byApplication.values()];
}

/** Assembled staff modules across loaded packages (href order preserved per package). */
export function listJagStaffNavModules(): Array<{
  id: string;
  href: string;
  label: string;
  applicationId: string;
  requiredPermission?: string;
}> {
  return listPackageNavigations().flatMap((nav) =>
    nav.items.map((item) => ({
      id: item.id,
      href: item.href,
      label: item.label,
      applicationId: nav.applicationId,
      requiredPermission: item.requiredPermission,
    }))
  );
}

export function resetJagNavigationForTests(): void {
  byApplication.clear();
}
