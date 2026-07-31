/** Dependency kinds — representation only (no execution engine). */
export const WORK_DEPENDENCY_KINDS = Object.freeze([
  Object.freeze({ id: "finish_to_start", label: "Finish-to-Start" }),
  Object.freeze({ id: "start_to_start", label: "Start-to-Start" }),
  Object.freeze({ id: "finish_to_finish", label: "Finish-to-Finish" }),
  Object.freeze({ id: "blocks", label: "Blocks" }),
] as const);

export type WorkDependencyKindId =
  (typeof WORK_DEPENDENCY_KINDS)[number]["id"];
