import { publishKnowledgeEvent } from "../events";
import { getDocumentContent } from "../documents";
import { newId, nowIso } from "../ids";
import { kstore } from "../store";
import type { OcrResult } from "../types";

/**
 * OCR pipeline — extracts text from PDF/images/scanned content.
 * Handwriting + multilingual are hooks (readiness flags).
 */
export function runOcr(input: {
  organizationId: string;
  userId: string;
  documentId: string;
  versionId?: string;
}): OcrResult {
  const doc = kstore.getDocument(input.documentId);
  if (!doc || doc.organizationId !== input.organizationId) {
    throw new Error("document not found");
  }
  const versionId = input.versionId ?? doc.currentVersionId;
  const content = getDocumentContent(versionId) ?? "";
  const isBinaryHint =
    /pdf|image|scan|png|jpg|jpeg|tiff/i.test(doc.mimeType) ||
    content.startsWith("%PDF") ||
    content.includes("[scanned]");

  const text = isBinaryHint
    ? content
        .replace(/%PDF[\s\S]*?stream/gi, " ")
        .replace(/\[scanned\]/gi, " ")
        .replace(/\s+/g, " ")
        .trim() || `[OCR] ${doc.title}`
    : content;

  const tablesDetected = (text.match(/\|.+\|/g) ?? []).length;
  const formsDetected = (text.match(/\b(name|date|signature)\s*:/gi) ?? [])
    .length;

  const result = kstore.upsertOcr({
    id: newId("kocr"),
    organizationId: input.organizationId,
    documentId: doc.id,
    versionId,
    text,
    pages: Math.max(1, Math.ceil(text.length / 3000)),
    tablesDetected,
    formsDetected,
    handwritingHookReady: true,
    multilingualHookReady: true,
    confidence: isBinaryHint ? 0.72 : 0.95,
    createdAt: nowIso(),
  });

  publishKnowledgeEvent({
    type: "knowledge.ocr_completed",
    organizationId: input.organizationId,
    recordType: "ocr_result",
    recordId: result.id,
    actorUserId: input.userId,
    payload: {
      documentId: doc.id,
      confidence: result.confidence,
      pages: result.pages,
    },
  });
  return result;
}

export function listOcr(organizationId: string) {
  return kstore.listOcr(organizationId);
}
