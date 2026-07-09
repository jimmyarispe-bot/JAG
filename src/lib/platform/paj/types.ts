/** Personal Learning Journey (PAJ) runtime — Doc 3 */

export const PAJ_ENGINE_VERSION = "1.0.0";

export const PAJ_JOURNEY_STATUSES = ["active", "paused", "completed", "transitioning"] as const;
export type PajJourneyStatus = (typeof PAJ_JOURNEY_STATUSES)[number];

export const PAJ_PROGRAM_TRACKS = ["virtual", "hs", "hybrid"] as const;
export type PajProgramTrack = (typeof PAJ_PROGRAM_TRACKS)[number];

/** Universal mastery levels 0–4 (Doc 98 · Doc 105 §4.1). */
export const PAJ_MASTERY_LEVELS = {
  NOT_STARTED: 0,
  EMERGING: 1,
  DEVELOPING: 2,
  PROFICIENT: 3,
  ADVANCED: 4,
} as const;

export type PajMasteryLevel = (typeof PAJ_MASTERY_LEVELS)[keyof typeof PAJ_MASTERY_LEVELS];

export const PAJ_SL_DOMAIN_KEY = "domain.structured_literacy";
export const PAJ_SL_PA_LIBRARY_KEY = "competency_library.foundational_phonological_awareness";
export const PAJ_SL_PA_PATHWAY_KEY = "pathway.structured_literacy.foundational_pa";
export const PAJ_SL_ENTRY_COMPETENCY_KEY = "AW-SL-PA-001-v1.0.0";

export interface PajJourneyRecord {
  id: string;
  student_id: string;
  organization_id: string | null;
  school_id: string | null;
  program_track: PajProgramTrack;
  status: PajJourneyStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PajDomainEnrollmentRecord {
  id: string;
  journey_id: string;
  domain_key: string;
  pathway_key: string;
  library_key: string;
  status: string;
  active_competency_key: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PajPlacementRecord {
  id: string;
  journey_id: string;
  domain_key: string;
  recommended_competency_key: string;
  placed_competency_key: string;
  placement_evidence_ids: string[];
  placed_by_user_id: string | null;
  review_date: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface PajCompetencyProgressRecord {
  id: string;
  journey_id: string;
  domain_key: string;
  competency_key: string;
  mastery_level: PajMasteryLevel;
  evidence_count: number;
  evidence_type_keys: string[];
  last_evidence_id: string | null;
  educator_confirmed_at: string | null;
  educator_confirmed_by: string | null;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PajSkillProgressRecord {
  id: string;
  journey_id: string;
  competency_key: string;
  skill_key: string;
  mastery_level: PajMasteryLevel;
  evidence_count: number;
  last_evidence_id: string | null;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateLearningJourneyInput {
  studentId: string;
  organizationId?: string;
  schoolId?: string;
  programTrack?: PajProgramTrack;
  actorUserId?: string;
  /** Optional placement override — defaults to SL PA entry competency. */
  placedCompetencyKey?: string;
  placementEvidenceIds?: string[];
}

export interface ProcessJourneyEvidenceInput {
  journeyId: string;
  evidenceId: string;
  studentId: string;
  competencyKeys: string[];
  skillKeys?: string[];
  evidenceTypeKey: string;
  evidenceConfidence: number;
  capturedByRole: string;
}

export interface ConfirmCompetencyAdvanceInput {
  journeyId: string;
  competencyKey: string;
  educatorUserId: string;
  domainKey?: string;
}

export interface PajJourneySnapshot {
  journey: PajJourneyRecord;
  enrollments: PajDomainEnrollmentRecord[];
  competencyProgress: PajCompetencyProgressRecord[];
  skillProgress: PajSkillProgressRecord[];
  activeCompetencyKey: string | null;
}

export interface PajEvidenceBundleResult {
  ok: boolean;
  suggestedLevel: PajMasteryLevel;
  educatorRequired: boolean;
  minTypesMet: boolean;
  confidenceMet: boolean;
  parentOnly: boolean;
  issues: string[];
}

export interface PajGuidanceSnapshot {
  competencyKey: string;
  parentActivities: string[];
  instructionalStrategies: string[];
  interventionStrategies: string[];
  schedulingRuleKeys: string[];
  aiRuleKeys: string[];
}

export interface PajRecommendationSnapshot {
  learningRecommendation?: { outcomeKey: string; label: string; score?: number };
  interventionRecommendation?: { outcomeKey: string; label: string; score?: number };
  ruleEvaluationId?: string;
  decisionExecutionId?: string;
}
