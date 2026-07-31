/**
 * Government application package identity — City Government reference org.
 * Industry vocabulary lives in the Government Industry Blueprint.
 * This package contributes organization answers, branding, and pack attachment only.
 */

export const GOVERNMENT_PACKAGE_ID = "government" as const;
export const GOVERNMENT_APPLICATION_ID = "city-government" as const;
export const GOVERNMENT_PACKAGE_VERSION = "1.0.0" as const;

export const CITY_GOVERNMENT_ORGANIZATION_ID =
  "city-government.organization" as const;

export type GovernmentPackageDescriptor = {
  packageId: typeof GOVERNMENT_PACKAGE_ID;
  applicationId: typeof GOVERNMENT_APPLICATION_ID;
  displayName: string;
  version: string;
  contributes: readonly string[];
};

export const GOVERNMENT_PACKAGE: GovernmentPackageDescriptor = {
  packageId: GOVERNMENT_PACKAGE_ID,
  applicationId: GOVERNMENT_APPLICATION_ID,
  displayName: "City Government",
  version: GOVERNMENT_PACKAGE_VERSION,
  contributes: [
    "entities",
    "navigation",
    "permissions",
    "reports",
    "terminology",
  ],
};
