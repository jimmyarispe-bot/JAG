import { listEvidenceFacts } from "../evidence";
import { newId, nowIso } from "../ids";
import { kstore } from "../store";
import type { KnowledgeRecommendation } from "../types";

/**
 * Recommendations MUST reference supporting documents + evidence.
 */
export function generateRecommendations(input: {
  organizationId: string;
}): readonly KnowledgeRecommendation[] {
  const docs = kstore
    .listDocuments(input.organizationId)
    .filter((d) => d.status === "active");
  const facts = listEvidenceFacts(input.organizationId);
  const out: KnowledgeRecommendation[] = [];

  const unindexed = docs.filter(
    (d) => !kstore.listIndex(input.organizationId).some((i) => i.documentId === d.id)
  );
  if (unindexed.length > 0) {
    out.push(
      kstore.upsertRecommendation({
        id: newId("krec"),
        organizationId: input.organizationId,
        title: "Index documents for semantic retrieval",
        summary: `${unindexed.length} active documents lack AI-ready index entries.`,
        documentIds: Object.freeze(unindexed.slice(0, 10).map((d) => d.id)),
        evidenceFactIds: Object.freeze(facts.slice(0, 3).map((f) => f.id)),
        confidence: 0.8,
        createdAt: nowIso(),
      })
    );
  }

  const withoutEvidence = docs.filter(
    (d) => !facts.some((f) => f.documentId === d.id)
  );
  if (withoutEvidence.length > 0) {
    out.push(
      kstore.upsertRecommendation({
        id: newId("krec"),
        organizationId: input.organizationId,
        title: "Extract evidence from documents",
        summary: `${withoutEvidence.length} documents have no evidence facts yet.`,
        documentIds: Object.freeze(withoutEvidence.slice(0, 10).map((d) => d.id)),
        evidenceFactIds: Object.freeze([]),
        confidence: 0.75,
        createdAt: nowIso(),
      })
    );
  }

  if (out.length === 0 && docs.length > 0) {
    out.push(
      kstore.upsertRecommendation({
        id: newId("krec"),
        organizationId: input.organizationId,
        title: "Knowledge base healthy",
        summary: "Documents are indexed with evidence coverage.",
        documentIds: Object.freeze(docs.slice(0, 5).map((d) => d.id)),
        evidenceFactIds: Object.freeze(facts.slice(0, 5).map((f) => f.id)),
        confidence: 0.6,
        createdAt: nowIso(),
      })
    );
  }

  return Object.freeze(out);
}

export function listRecommendations(organizationId: string) {
  return kstore.listRecommendations(organizationId);
}
