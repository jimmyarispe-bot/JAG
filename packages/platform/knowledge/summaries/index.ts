import { publishKnowledgeEvent } from "../events";
import { parseDocument } from "../parsing";
import { newId, nowIso } from "../ids";
import { listEvidenceFacts } from "../evidence";
import { createCitation } from "../citations";
import { kstore } from "../store";
import type { KnowledgeSummary, SummaryKind } from "../types";

/**
 * Every summary MUST cite evidence. No evidence → no summary body claims.
 */
export function summarizeDocument(input: {
  organizationId: string;
  userId: string;
  documentId: string;
  kind: SummaryKind;
}): KnowledgeSummary {
  const doc = kstore.getDocument(input.documentId);
  if (!doc || doc.organizationId !== input.organizationId) {
    throw new Error("document not found");
  }
  const facts = listEvidenceFacts(input.organizationId, doc.id);
  if (facts.length === 0) {
    throw new Error(
      "Cannot summarize without supporting evidence. Extract entities or record evidence first."
    );
  }
  const parsed = parseDocument(input);
  const citationIds = facts.slice(0, 10).map((f) => {
    const c = createCitation({
      organizationId: input.organizationId,
      evidenceFactId: f.id,
      documentId: f.documentId,
      versionId: f.versionId,
      location: f.location,
    });
    return c.id;
  });

  const prefix =
    input.kind === "executive"
      ? "Executive"
      : input.kind === "educational"
        ? "Educational"
        : input.kind === "financial"
          ? "Financial"
          : input.kind === "legal"
            ? "Legal"
            : input.kind === "medical"
              ? "Medical"
              : input.kind === "meeting"
                ? "Meeting"
                : "Custom";

  const bullets = facts
    .slice(0, 5)
    .map((f) => `• ${f.statement} [${f.id}]`)
    .join("\n");

  const text = `${prefix} summary of "${doc.title}" (${doc.typeKey}).\n${bullets}\nSource excerpt: ${parsed.text.slice(0, 240)}`;

  const summary = kstore.upsertSummary({
    id: newId("ksum"),
    organizationId: input.organizationId,
    documentId: doc.id,
    kind: input.kind,
    text,
    citationIds: Object.freeze(citationIds),
    createdAt: nowIso(),
    createdBy: input.userId,
  });

  publishKnowledgeEvent({
    type: "knowledge.summary_created",
    organizationId: input.organizationId,
    recordType: "summary",
    recordId: summary.id,
    actorUserId: input.userId,
    payload: {
      kind: summary.kind,
      citationCount: citationIds.length,
      documentId: doc.id,
    },
  });
  return summary;
}

export function listSummaries(organizationId: string) {
  return kstore.listSummaries(organizationId);
}
