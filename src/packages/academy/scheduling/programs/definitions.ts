/**
 * Academy program definitions for scheduling — package catalog only.
 */

export type AcademySchedulingProgramDefinition = {
  readonly id: string;
  readonly code: string;
  readonly label: string;
  readonly modality: "virtual" | "in_person" | "hybrid";
  readonly region: "FL" | "GA" | "multi";
  readonly status: "active";
};

/**
 * Canonical Academy program naming for scheduling contributions.
 * Codes align with existing Academy program codes where applicable.
 */
export const ACADEMY_SCHEDULING_PROGRAMS: readonly AcademySchedulingProgramDefinition[] =
  Object.freeze([
    Object.freeze({
      id: "academy.scheduling.program.fl_virtual",
      code: "academy_fl_virtual",
      label: "The Academy FL – Virtual",
      modality: "virtual" as const,
      region: "FL" as const,
      status: "active" as const,
    }),
    Object.freeze({
      id: "academy.scheduling.program.fl_in_person",
      code: "academy_fl_campus",
      label: "The Academy FL – In-Person",
      modality: "in_person" as const,
      region: "FL" as const,
      status: "active" as const,
    }),
    Object.freeze({
      id: "academy.scheduling.program.ga_virtual",
      code: "academy_ga_virtual",
      label: "The Academy GA – Virtual",
      modality: "virtual" as const,
      region: "GA" as const,
      status: "active" as const,
    }),
    Object.freeze({
      id: "academy.scheduling.program.ga_in_person",
      code: "academy_ga_campus",
      label: "The Academy GA – In-Person",
      modality: "in_person" as const,
      region: "GA" as const,
      status: "active" as const,
    }),
    Object.freeze({
      id: "academy.scheduling.program.virtual_full_school",
      code: "academy_virtual",
      label: "The Academy Virtual – Full School Program",
      modality: "virtual" as const,
      region: "multi" as const,
      status: "active" as const,
    }),
    Object.freeze({
      id: "academy.scheduling.program.hs",
      code: "academy_hs",
      label: "The Academy HS",
      modality: "hybrid" as const,
      region: "multi" as const,
      status: "active" as const,
    }),
  ]);

export const ACADEMY_SCHEDULING_PROGRAM_IDS = Object.freeze(
  ACADEMY_SCHEDULING_PROGRAMS.map((p) => p.id)
);

export const ACADEMY_SCHEDULING_PROGRAM_CODES = Object.freeze(
  ACADEMY_SCHEDULING_PROGRAMS.map((p) => p.code)
);
