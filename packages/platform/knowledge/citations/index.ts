import { publishKnowledgeEvent } from "../events";
import { newId } from "../ids";
import { kstore } from "../store";
import type { Citation } from "../types";

export function createCitation(input: {
  organizationId: string;
  evidenceFactId: string;
  documentId: string;
  versionId: string;
  location: string;
}): Citation {
  const existing = kstore
    .listCitations(input.organizationId)
    .find(
      (c) =>
        c.evidenceFactId === input.evidenceFactId &&
        c.location === input.location
    );
  if (existing) return existing;
  const citation = kstore.upsertCitation({
    id: newId("kcit"),
    organizationId: input.organizationId,
    evidenceFactId: input.evidenceFactId,
    documentId: input.documentId,
    versionId: input.versionId,
    location: input.location,
  });
  publishKnowledgeEvent({
    type: "knowledge.citation_created",
    organizationId: input.organizationId,
    recordType: "citation",
    recordId: citation.id,
    payload: {
      evidenceFactId: citation.evidenceFactId,
      documentId: citation.documentId,
    },
  });
  return citation;
}

export function listCitations(organizationId: string) {
  return kstore.listCitations(organizationId);
}
