/**
 * Analytical data-source pack references — definitions only.
 * Preferred path is reporting.core; operational packs are optional refs.
 */
export const ANALYTIC_DATA_SOURCE_PACKS = Object.freeze([
  Object.freeze({
    id: "reporting.core",
    label: "Reporting",
    module: "reporting",
    preferred: true,
  }),
  Object.freeze({ id: "work.core", label: "Work", module: "work", preferred: false }),
  Object.freeze({
    id: "decision.core",
    label: "Decision",
    module: "decision",
    preferred: false,
  }),
  Object.freeze({
    id: "policy.core",
    label: "Policy",
    module: "policy",
    preferred: false,
  }),
  Object.freeze({
    id: "scheduling.core",
    label: "Scheduling",
    module: "scheduling",
    preferred: false,
  }),
] as const);
