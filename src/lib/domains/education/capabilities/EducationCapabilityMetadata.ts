/**
 * Capability Pack metadata — discoverable, versioned, introspectable.
 * Domain object contracts only; not Runtime registration.
 */

/** Maturity of a registered Education capability pack. */
export type EducationCapabilityPackMaturity =
  | "planned"
  | "building"
  | "feature-complete"
  | "stable"
  | "deprecated";

/**
 * Pack-level metadata declaration.
 * Contributors listed here are references — packs do not own or mutate them.
 */
export interface EducationCapabilityPackMetadata {
  /** Stable pack id, e.g. education.capability_pack.student_lifecycle */
  id: string;
  name: string;
  /** Semver-like pack version string. */
  version: string;
  description: string;
  /** Cognitive contributor ids owned/exposed by this pack. */
  contributors: readonly string[];
  /** Planner intent ids / labels this pack serves. */
  plannerIntents: readonly string[];
  /** Knowledge capability / entity / classification extension ids. */
  knowledgeExtensions: readonly string[];
  /** Policy definition ids extended or relied on by this pack. */
  policyExtensions: readonly string[];
  /** Documentation paths relative to docs/domains/education/. */
  documentation: readonly string[];
  /** Other capability pack ids this pack depends on. */
  dependencies: readonly string[];
  maturity: EducationCapabilityPackMaturity;
  /** Optional human tags for discovery. */
  tags?: readonly string[];
}

export const EDUCATION_CAPABILITY_PACK_IDS = {
  studentLifecycle: "education.capability_pack.student_lifecycle",
  studentSupport: "education.capability_pack.student_support",
  academicOperations: "education.capability_pack.academic_operations",
} as const;

export type EducationCapabilityPackId =
  (typeof EDUCATION_CAPABILITY_PACK_IDS)[keyof typeof EDUCATION_CAPABILITY_PACK_IDS];
