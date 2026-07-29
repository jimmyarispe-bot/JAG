/**
 * Parent portal documents → KnowledgeEngine (canonical ownership).
 */

import { createKnowledgeEngine } from "@knowledge";
import { publishParentExperienceEvent } from "./events";

export function searchParentDocumentsInKnowledge(input: {
  organizationId: string;
  query: string;
  studentId?: string | null;
}): {
  results: readonly {
    id: string;
    title: string;
    typeKey: string;
    snippet: string;
  }[];
} {
  const engine = createKnowledgeEngine();
  const hits = engine.search({
    organizationId: input.organizationId,
    query: input.query,
    limit: 25,
  });
  const filtered = hits.filter((h) => {
    if (!input.studentId) return true;
    return (
      h.snippet.includes(input.studentId!) ||
      h.title.includes(input.studentId!)
    );
  });
  return {
    results: filtered.map((h) => ({
      id: h.documentId,
      title: h.title,
      typeKey: String(h.facets?.typeKey ?? "general"),
      snippet: h.snippet,
    })),
  };
}

export function listKnowledgeDocumentVersions(input: { documentId: string }) {
  const engine = createKnowledgeEngine();
  return engine.listVersions(input.documentId);
}

export function publishDocumentViewed(input: {
  organizationId: string;
  documentId: string;
  actorUserId?: string | null;
  studentId?: string | null;
}) {
  return publishParentExperienceEvent({
    type: "parent.document_viewed",
    organizationId: input.organizationId,
    recordType: "document",
    recordId: input.documentId,
    actorUserId: input.actorUserId,
    payload: {
      studentId: input.studentId ?? "",
      knowledgeEngine: "KnowledgeEngine",
    },
  });
}
