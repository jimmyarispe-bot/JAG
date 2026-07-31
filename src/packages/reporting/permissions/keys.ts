export const REPORTING_PERMISSION_KEYS = Object.freeze({
  access: "reporting.access",
  typesRead: "reporting.types.read",
  typesUpdate: "reporting.types.update",
  definitionsRead: "reporting.definitions.read",
  definitionsUpdate: "reporting.definitions.update",
  metricsRead: "reporting.metrics.read",
  metricsUpdate: "reporting.metrics.update",
  filtersRead: "reporting.filters.read",
  filtersUpdate: "reporting.filters.update",
  distributionRead: "reporting.distribution.read",
  distributionUpdate: "reporting.distribution.update",
} as const);

export const REPORTING_PERMISSION_PACK_ID =
  "reporting.permission.core" as const;
