import { publishKnowledgeEvent } from "../events";
import { newId, nowIso } from "../ids";
import { createCitation } from "../citations";
import { appendTimeline } from "../timeline";
import { kstore } from "../store";
import type { EvidenceFact, ExtractionMethod, VerificationStatus } from "../types";

/**
 * Evidence Engine — every extracted fact retains source + location + confidence.
 * Evidence NEVER disappears (tombstoned is always false).
 */
export function recordEvidenceFact(input: {
  organizationId: string;
  userId?: string | null;
  documentId: string;
  versionId: string;
  location: string;
  statement: string;
  confidence: number;
  method: ExtractionMethod;
  authorUserId?: string | null;
  verificationStatus?: VerificationStatus;
}): EvidenceFact {
  const fact = kstore.upsertEvidence({
    id: newId("kef"),
    organizationId: input.organizationId,
    documentId: input.documentId,
    versionId: input.versionId,
    location: input.location,
    statement: input.statement,
    confidence: Math.max(0, Math.min(1, input.confidence)),
    method: input.method,
    extractedAt: nowIso(),
    authorUserId: input.authorUserId ?? input.userId ?? null,
    verificationStatus: input.verificationStatus ?? "auto_extracted",
    tombstoned: false,
  });

  createCitation({
    organizationId: input.organizationId,
    evidenceFactId: fact.id,
    documentId: fact.documentId,
    versionId: fact.versionId,
    location: fact.location,
  });

  publishKnowledgeEvent({
    type: "knowledge.evidence_recorded",
    organizationId: input.organizationId,
    recordType: "evidence_fact",
    recordId: fact.id,
    actorUserId: input.userId,
    payload: {
      documentId: fact.documentId,
      confidence: fact.confidence,
      method: fact.method,
    },
  });

  appendTimeline({
    organizationId: input.organizationId,
    kind: "evidence_recorded",
    title: fact.statement.slice(0, 80),
    documentId: fact.documentId,
    evidenceFactId: fact.id,
    occurredAt: fact.extractedAt,
  });

  return fact;
}

export function verifyEvidence(input: {
  organizationId: string;
  evidenceFactId: string;
  status: VerificationStatus;
}): EvidenceFact {
  const fact = kstore.getEvidence(input.evidenceFactId);
  if (!fact || fact.organizationId !== input.organizationId) {
    throw new Error("evidence not found");
  }
  return kstore.upsertEvidence({
    ...fact,
    verificationStatus: input.status,
  });
}

export function listEvidenceFacts(
  organizationId: string,
  documentId?: string
) {
  return kstore.listEvidence(organizationId, documentId);
}

export function getEvidenceFact(id: string) {
  return kstore.getEvidence(id);
}
