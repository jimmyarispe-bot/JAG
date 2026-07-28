import { listEvidenceFacts } from "../evidence";
import { newId, nowIso } from "../ids";
import { kstore } from "../store";
import type { KnowledgeInsight } from "../types";

export function generateInsights(input: {
  organizationId: string;
}): readonly KnowledgeInsight[] {
  const facts = listEvidenceFacts(input.organizationId);
  const docs = kstore.listDocuments(input.organizationId);
  const out: KnowledgeInsight[] = [];

  if (docs.length > 0) {
    const insight = kstore.upsertInsight({
      id: newId("kins"),
      organizationId: input.organizationId,
      title: "Document corpus active",
      detail: `${docs.length} documents under KnowledgeEngine ownership.`,
      evidenceFactIds: Object.freeze(facts.slice(0, 3).map((f) => f.id)),
      createdAt: nowIso(),
    });
    out.push(insight);
  }

  const education = docs.filter((d) => d.domain === "education");
  if (education.length > 0) {
    out.push(
      kstore.upsertInsight({
        id: newId("kins"),
        organizationId: input.organizationId,
        title: "Education documents present",
        detail: `${education.length} education-domain documents. Pedagogical interpretation deferred to Learning Intelligence (P-015).`,
        evidenceFactIds: Object.freeze(
          facts
            .filter((f) => education.some((d) => d.id === f.documentId))
            .slice(0, 3)
            .map((f) => f.id)
        ),
        createdAt: nowIso(),
      })
    );
  }

  return Object.freeze(out);
}

export function listInsights(organizationId: string) {
  return kstore.listInsights(organizationId);
}
