import { listDocumentTypes, resolveDocumentType } from "../core";
import { publishKnowledgeEvent } from "../events";
import { parseDocument } from "../parsing";
import { nowIso } from "../ids";
import { kstore } from "../store";
import type { DocumentRecord } from "../types";

const HINTS: { pattern: RegExp; typeKey: string }[] = [
  { pattern: /\biep\b/i, typeKey: "iep" },
  { pattern: /\b504\b/, typeKey: "504" },
  { pattern: /\binvoice\b/i, typeKey: "invoice" },
  { pattern: /\bbill\b/i, typeKey: "bill" },
  { pattern: /\bminutes\b/i, typeKey: "minutes" },
  { pattern: /\bpolicy\b/i, typeKey: "policy" },
  { pattern: /\bcontract\b/i, typeKey: "contract_legal" },
  { pattern: /\bpayroll\b/i, typeKey: "payroll" },
  { pattern: /\btranscript\b/i, typeKey: "transcript" },
  { pattern: /\bassessment\b/i, typeKey: "assessment" },
];

export function classifyDocument(input: {
  organizationId: string;
  userId: string;
  documentId: string;
}): DocumentRecord {
  const doc = kstore.getDocument(input.documentId);
  if (!doc || doc.organizationId !== input.organizationId) {
    throw new Error("document not found");
  }
  const parsed = parseDocument(input);
  const blob = `${doc.title}\n${parsed.text}`;
  let typeKey = doc.typeKey;
  for (const h of HINTS) {
    if (h.pattern.test(blob)) {
      typeKey = h.typeKey;
      break;
    }
  }
  const type = resolveDocumentType(input.organizationId, typeKey);
  void listDocumentTypes;
  const updated = kstore.upsertDocument({
    ...doc,
    typeKey: type.key,
    domain: type.domain,
    metadata: Object.freeze({
      ...doc.metadata,
      classifiedAt: nowIso(),
      classificationConfidence: typeKey === doc.typeKey ? 0.6 : 0.85,
    }),
    updatedAt: nowIso(),
  });
  publishKnowledgeEvent({
    type: "knowledge.classified",
    organizationId: input.organizationId,
    recordType: "document",
    recordId: updated.id,
    actorUserId: input.userId,
    payload: { typeKey: updated.typeKey, domain: updated.domain },
  });
  return updated;
}
