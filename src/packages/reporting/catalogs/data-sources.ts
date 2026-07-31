/**
 * Data source pack references — no query execution.
 * Maps to foundation capability packs by id.
 */
export const REPORT_DATA_SOURCE_PACKS = Object.freeze([
  Object.freeze({ id: "identity.core", label: "Identity", module: "identity" }),
  Object.freeze({
    id: "documents.core",
    label: "Documents",
    module: "documents",
  }),
  Object.freeze({
    id: "communications.core",
    label: "Communications",
    module: "communications",
  }),
  Object.freeze({
    id: "scheduling.core",
    label: "Scheduling",
    module: "scheduling",
  }),
  Object.freeze({ id: "work.core", label: "Work", module: "work" }),
  Object.freeze({ id: "decision.core", label: "Decision", module: "decision" }),
] as const);
