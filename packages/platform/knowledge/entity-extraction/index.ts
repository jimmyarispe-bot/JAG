import { publishKnowledgeEvent } from "../events";
import { parseDocument } from "../parsing";
import { newId, nowIso } from "../ids";
import { upsertNode } from "../knowledge-graph";
import { kstore } from "../store";
import type { ExtractedEntity, GraphNodeKind } from "../types";
import { recordEvidenceFact } from "../evidence";

const PATTERNS: {
  kind: ExtractedEntity["kind"];
  re: RegExp;
  graphKind?: GraphNodeKind;
}[] = [
  { kind: "person", re: /\b(?:Mr|Mrs|Ms|Dr)\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g, graphKind: "person" },
  { kind: "student", re: /\bstudent\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi, graphKind: "student" },
  { kind: "teacher", re: /\bteacher\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi, graphKind: "teacher" },
  { kind: "organization", re: /\b(?:Inc|LLC|Corp|School|Academy)\b[\w\s-]{0,40}/gi, graphKind: "organization" },
  { kind: "date", re: /\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4})\b/g },
  { kind: "vendor", re: /\bvendor\s*:?\s*([A-Za-z0-9 &.-]+)/gi, graphKind: "vendor" },
  { kind: "program", re: /\bprogram\s*:?\s*([A-Za-z0-9 &.-]+)/gi, graphKind: "program" },
  {
    kind: "diagnosis",
    re: /\bdiagnosis\s*:?\s*([A-Za-z0-9 ,.-]+)/gi,
  },
  {
    kind: "accommodation",
    re: /\baccommodation(?:s)?\s*:?\s*([A-Za-z0-9 ,.-]+)/gi,
  },
  {
    kind: "goal",
    re: /\bgoal\s*:?\s*([A-Za-z0-9 ,.-]+)/gi,
    graphKind: "goal",
  },
];

export function extractEntities(input: {
  organizationId: string;
  userId: string;
  documentId: string;
}): readonly ExtractedEntity[] {
  const doc = kstore.getDocument(input.documentId);
  if (!doc || doc.organizationId !== input.organizationId) {
    throw new Error("document not found");
  }
  const parsed = parseDocument(input);
  const out: ExtractedEntity[] = [];

  for (const p of PATTERNS) {
    // Diagnoses ONLY if explicitly documented (pattern requires "diagnosis:")
    const re = new RegExp(p.re.source, p.re.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(parsed.text)) !== null) {
      const value = (m[1] ?? m[0]).trim().slice(0, 120);
      if (!value) continue;
      const entity = kstore.upsertEntity({
        id: newId("kent"),
        organizationId: input.organizationId,
        documentId: doc.id,
        versionId: doc.currentVersionId,
        kind: p.kind,
        label: p.kind,
        value,
        confidence: 0.7,
        method: "ner",
        location: `offset:${m.index}`,
        createdAt: nowIso(),
      });
      out.push(entity);
      recordEvidenceFact({
        organizationId: input.organizationId,
        userId: input.userId,
        documentId: doc.id,
        versionId: doc.currentVersionId,
        location: entity.location,
        statement: `${p.kind}: ${value}`,
        confidence: entity.confidence,
        method: "ner",
      });
      if (p.graphKind) {
        upsertNode({
          organizationId: input.organizationId,
          kind: p.graphKind,
          label: value,
          properties: { fromDocumentId: doc.id },
        });
      }
    }
  }

  publishKnowledgeEvent({
    type: "knowledge.entities_extracted",
    organizationId: input.organizationId,
    recordType: "document",
    recordId: doc.id,
    actorUserId: input.userId,
    payload: { count: out.length },
  });
  return Object.freeze(out);
}

export function listEntities(organizationId: string, documentId?: string) {
  return kstore.listEntities(organizationId, documentId);
}
