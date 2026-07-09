/** Knowledge & Evidence Engine (KEE) — B-09 Phase 1 foundation types (Doc 27) */

export const EVIDENCE_CAPTURE_ROLES = [
  "teacher",
  "student",
  "parent",
  "system",
  "ai",
  "mentor",
] as const;
export type EvidenceCaptureRole = (typeof EVIDENCE_CAPTURE_ROLES)[number];

export const EVIDENCE_RECORD_STATUSES = ["active", "superseded", "expired"] as const;
export type EvidenceRecordStatus = (typeof EVIDENCE_RECORD_STATUSES)[number];

export const EVIDENCE_RELATIONSHIP_TYPES = [
  "bundle_member",
  "supports",
  "contradicts",
  "supersedes",
  "derived_from",
  "translation_of",
  "prerequisite_for",
] as const;
export type EvidenceRelationshipType = (typeof EVIDENCE_RELATIONSHIP_TYPES)[number];

export interface EvidenceArtifactRef {
  refType: string;
  refId: string;
  label?: string;
  metadata?: Record<string, unknown>;
}

export interface EvidenceScore {
  key: string;
  value: number;
  scale?: string;
  metadata?: Record<string, unknown>;
}

export interface EvidenceRelationship {
  type: EvidenceRelationshipType;
  targetEvidenceId: string;
  metadata?: Record<string, unknown>;
}

export interface PlatformEvidenceRecord {
  id: string;
  evidence_type_key: string;
  skill_keys: string[];
  competency_keys: string[];
  student_id: string;
  organization_id: string | null;
  school_id: string | null;
  captured_at: string;
  captured_by_role: EvidenceCaptureRole;
  captured_by_user_id: string | null;
  source_context: Record<string, unknown>;
  locale: string;
  jurisdiction_keys: string[];
  artifact_refs: EvidenceArtifactRef[];
  scores: EvidenceScore[];
  narrative: string | null;
  accommodations_applied: string[];
  evidence_confidence: number;
  evidence_quality: number;
  expires_at: string | null;
  relationships: EvidenceRelationship[];
  supersedes_evidence_id: string | null;
  ai_assisted: boolean;
  ai_validation_status: string | null;
  metadata: Record<string, unknown>;
  status: EvidenceRecordStatus;
  recorded_at: string;
}

export interface RecordEvidenceInput {
  evidenceTypeKey: string;
  skillKeys?: string[];
  competencyKeys?: string[];
  studentId: string;
  organizationId?: string | null;
  schoolId?: string | null;
  capturedAt?: string;
  capturedByRole: EvidenceCaptureRole;
  capturedByUserId?: string | null;
  sourceContext?: Record<string, unknown>;
  locale?: string;
  jurisdictionKeys?: string[];
  artifactRefs?: EvidenceArtifactRef[];
  scores?: EvidenceScore[];
  narrative?: string;
  accommodationsApplied?: string[];
  evidenceConfidence: number;
  evidenceQuality: number;
  expiresAt?: string | null;
  relationships?: EvidenceRelationship[];
  supersedesEvidenceId?: string | null;
  aiAssisted?: boolean;
  aiValidationStatus?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ListEvidenceRecordsFilters {
  studentId?: string;
  evidenceTypeKey?: string;
  competencyKey?: string;
  skillKey?: string;
  schoolId?: string;
  organizationId?: string;
  status?: EvidenceRecordStatus;
  fromTimestamp?: string;
  toTimestamp?: string;
  limit?: number;
}
