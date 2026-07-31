/**
 * AcademyOS feature flags — centralized toggles for runtime capabilities.
 */
export type AcademyFeatureFlags = {
  admissions: boolean;
  students: boolean;
  academics: boolean;
  attendance: boolean;
  finance: boolean;
  hr: boolean;
  communications: boolean;
  administration: boolean;
  /** Mirror domain writes into Entity Framework via platform adapter. */
  entityMirroring: boolean;
  /** Start workflow instances on application use-cases. */
  workflowOrchestration: boolean;
  /** Expose intelligence snapshots from administration facade. */
  intelligenceSnapshots: boolean;
};

export const DEFAULT_ACADEMY_FEATURES: AcademyFeatureFlags = {
  admissions: true,
  students: true,
  academics: true,
  attendance: true,
  finance: true,
  hr: true,
  communications: true,
  administration: true,
  entityMirroring: true,
  workflowOrchestration: true,
  intelligenceSnapshots: true,
};

export function loadAcademyFeatures(
  overrides?: Partial<AcademyFeatureFlags>
): AcademyFeatureFlags {
  return { ...DEFAULT_ACADEMY_FEATURES, ...overrides };
}
