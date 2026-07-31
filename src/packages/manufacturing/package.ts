/**
 * Manufacturing application package identity — Advanced Manufacturing Company.
 * Industry vocabulary lives in the Manufacturing Industry Blueprint.
 * This package contributes organization answers, branding, and pack attachment only.
 */

export const MANUFACTURING_PACKAGE_ID = "manufacturing" as const;
export const MANUFACTURING_APPLICATION_ID = "advanced-manufacturing" as const;
export const MANUFACTURING_PACKAGE_VERSION = "1.0.0" as const;

export const ADVANCED_MANUFACTURING_ORGANIZATION_ID =
  "advanced-manufacturing.organization" as const;

export type ManufacturingPackageDescriptor = {
  packageId: typeof MANUFACTURING_PACKAGE_ID;
  applicationId: typeof MANUFACTURING_APPLICATION_ID;
  displayName: string;
  version: string;
  contributes: readonly string[];
};

export const MANUFACTURING_PACKAGE: ManufacturingPackageDescriptor = {
  packageId: MANUFACTURING_PACKAGE_ID,
  applicationId: MANUFACTURING_APPLICATION_ID,
  displayName: "Advanced Manufacturing Company",
  version: MANUFACTURING_PACKAGE_VERSION,
  contributes: [
    "entities",
    "navigation",
    "permissions",
    "reports",
    "terminology",
  ],
};
