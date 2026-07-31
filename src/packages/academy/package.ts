/**
 * Academy application package identity — configuration package for The JAG OS.
 * Engines live in `@/jag`; this package registers industry definitions only.
 */

export const ACADEMY_PACKAGE_ID = "academy" as const;
export const ACADEMY_APPLICATION_ID = "academyos" as const;
export const ACADEMY_PACKAGE_VERSION = "1.3.0" as const;

/** Phase 1 terminology packs (declarative ids). */
export const ACADEMY_TERMINOLOGY_PACK_IDS = [
  "academy.terminology.default",
] as const;

/** Phase 1 localization packs (declarative ids). */
export const ACADEMY_LOCALIZATION_PACK_IDS = [
  "academy.localization.en-US",
] as const;

export type AcademyPackageDescriptor = {
  packageId: typeof ACADEMY_PACKAGE_ID;
  applicationId: typeof ACADEMY_APPLICATION_ID;
  displayName: string;
  version: string;
  /** Package Runtime contribution kinds declared in AcademyPackageManifest. */
  contributes: readonly string[];
};

export const ACADEMY_PACKAGE: AcademyPackageDescriptor = {
  packageId: ACADEMY_PACKAGE_ID,
  applicationId: ACADEMY_APPLICATION_ID,
  displayName: "Academy",
  version: ACADEMY_PACKAGE_VERSION,
  contributes: [
    "entities",
    "forms",
    "workflows",
    "navigation",
    "permissions",
    "reports",
    "terminology",
    "localization",
    "processes",
    "documents",
    "communications",
    "decisions",
  ],
};
