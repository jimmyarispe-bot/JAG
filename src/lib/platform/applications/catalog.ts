import type { PlatformApplication, PlatformApplicationKey } from "@/lib/platform/applications/types";

/** Platform brand — not an application. */
export const PLATFORM_NAME = "JAG" as const;

/** Application #1 key — soft default for every tenant when enablement rows are missing. */
export const DEFAULT_APPLICATION_KEY: PlatformApplicationKey = "academyos";

export const ACADEMYOS_APPLICATION_KEY: PlatformApplicationKey = "academyos";

/** Tenant #1 slug (The Academy Way). */
export const TENANT_ONE_SLUG = "the-academy-way";

/**
 * Static catalog mirror of `platform_applications`.
 * Prefer DB loaders when available; this exists for compile-time / offline defaults.
 */
export const PLATFORM_APPLICATION_CATALOG: ReadonlyArray<
  Omit<PlatformApplication, "id"> & { id?: string }
> = [
  {
    key: ACADEMYOS_APPLICATION_KEY,
    name: "AcademyOS",
    description: "School / education operations application on the JAG platform.",
    status: "active",
    sortOrder: 10,
    homeRoute: "/dashboard",
    permissionPackKey: "ACADEMYOS_ACCESS",
    metadata: {
      application_number: 1,
      vertical: "education",
      sprint: "059",
    },
  },
];

export function getCatalogApplication(
  key: PlatformApplicationKey
): (typeof PLATFORM_APPLICATION_CATALOG)[number] | undefined {
  return PLATFORM_APPLICATION_CATALOG.find((app) => app.key === key);
}
