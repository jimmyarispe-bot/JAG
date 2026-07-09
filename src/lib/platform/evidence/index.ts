/** Knowledge & Evidence Engine (KEE) — B-09 Phase 1 foundation (Part VIII) */
export {
  EVIDENCE_TYPE_CATALOG,
  getEvidenceTypeDefinition,
  isKnownEvidenceType,
} from "@/lib/platform/evidence/catalog";
export { validateRecordEvidenceInput } from "@/lib/platform/evidence/validate";
export { recordEvidence } from "@/lib/platform/evidence/record";
export {
  getEvidenceRecordById,
  getStudentEvidenceRecords,
  listEvidenceRecords,
  markEvidenceSuperseded,
} from "@/lib/platform/evidence/query";
export type {
  EvidenceArtifactRef,
  EvidenceCaptureRole,
  EvidenceRecordStatus,
  EvidenceRelationship,
  EvidenceRelationshipType,
  EvidenceScore,
  ListEvidenceRecordsFilters,
  PlatformEvidenceRecord,
  RecordEvidenceInput,
} from "@/lib/platform/evidence/types";
