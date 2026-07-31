/**
 * Healthcare application package identity — Regional Health System reference org.
 * Industry vocabulary lives in the Healthcare Industry Blueprint.
 * This package contributes organization answers, branding, and pack attachment only.
 */

export const HEALTHCARE_PACKAGE_ID = "healthcare" as const;
export const HEALTHCARE_APPLICATION_ID = "regional-health" as const;
export const HEALTHCARE_PACKAGE_VERSION = "1.0.0" as const;

export const REGIONAL_HEALTH_ORGANIZATION_ID =
  "regional-health.organization" as const;

export type HealthcarePackageDescriptor = {
  packageId: typeof HEALTHCARE_PACKAGE_ID;
  applicationId: typeof HEALTHCARE_APPLICATION_ID;
  displayName: string;
  version: string;
  contributes: readonly string[];
};

export const HEALTHCARE_PACKAGE: HealthcarePackageDescriptor = {
  packageId: HEALTHCARE_PACKAGE_ID,
  applicationId: HEALTHCARE_APPLICATION_ID,
  displayName: "Regional Health System",
  version: HEALTHCARE_PACKAGE_VERSION,
  contributes: [
    "entities",
    "navigation",
    "permissions",
    "reports",
    "terminology",
  ],
};
