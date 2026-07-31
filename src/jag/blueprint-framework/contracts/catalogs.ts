/**
 * Blueprint Framework v1 — catalog entry contracts (data shapes only).
 */

export type CatalogEntry = {
  readonly id: string;
  readonly label: string;
};

export type DocumentTypeCatalogEntry = CatalogEntry & {
  readonly family?: string;
};

export type CommunicationTypeCatalogEntry = CatalogEntry;

export type SchedulingConventionCatalogEntry = CatalogEntry & {
  readonly schedulableTypeHint?: string;
  readonly resourceTypeHint?: string;
};

export type WorkClassificationCatalogEntry = CatalogEntry & {
  readonly workType?: string;
};

export type DecisionCategoryCatalogEntry = CatalogEntry & {
  readonly category?: string;
};

export type PolicyDefaultCatalogEntry = CatalogEntry & {
  readonly family?: string;
};

export type ReportingDefaultCatalogEntry = CatalogEntry & {
  readonly reportType?: string;
};

export type AnalyticsDefaultCatalogEntry = CatalogEntry & {
  readonly metricHint?: string;
};

/**
 * Standard industry catalog payload shape.
 * Required catalogs must be non-empty arrays on conforming blueprints.
 */
export type IndustryCatalogPayload = {
  readonly foundationModules: readonly string[];
  readonly verticalModules: readonly string[];
  /** Identity vocabulary (identity area). */
  readonly identityVocabulary: readonly CatalogEntry[];
  readonly documentTypes: readonly DocumentTypeCatalogEntry[];
  readonly communicationTypes: readonly CommunicationTypeCatalogEntry[];
  readonly schedulingConventions: readonly SchedulingConventionCatalogEntry[];
  readonly workClassifications: readonly WorkClassificationCatalogEntry[];
  readonly decisionCategories: readonly DecisionCategoryCatalogEntry[];
  readonly policyDefaults: readonly PolicyDefaultCatalogEntry[];
  readonly reportingDefaults: readonly ReportingDefaultCatalogEntry[];
  readonly analyticsDefaults: readonly AnalyticsDefaultCatalogEntry[];
};

/** Catalog keys required by Blueprint Framework v1. */
export const REQUIRED_INDUSTRY_CATALOG_KEYS = Object.freeze([
  "identityVocabulary",
  "documentTypes",
  "communicationTypes",
  "schedulingConventions",
  "workClassifications",
  "decisionCategories",
  "policyDefaults",
  "reportingDefaults",
  "analyticsDefaults",
] as const);

export type RequiredIndustryCatalogKey =
  (typeof REQUIRED_INDUSTRY_CATALOG_KEYS)[number];

/** Optional structural keys (may be empty but should be present). */
export const OPTIONAL_INDUSTRY_CATALOG_KEYS = Object.freeze([
  "foundationModules",
  "verticalModules",
] as const);
