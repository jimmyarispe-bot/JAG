import { getDocumentContent } from "../documents";
import { kstore } from "../store";
import { runOcr } from "../ocr";

export function parseDocument(input: {
  organizationId: string;
  userId: string;
  documentId: string;
}): {
  readonly text: string;
  readonly mimeType: string;
  readonly usedOcr: boolean;
} {
  const doc = kstore.getDocument(input.documentId);
  if (!doc || doc.organizationId !== input.organizationId) {
    throw new Error("document not found");
  }
  const needsOcr =
    /pdf|image|png|jpg|jpeg|tiff|scan/i.test(doc.mimeType) ||
    (getDocumentContent(doc.currentVersionId) ?? "").includes("[scanned]");
  if (needsOcr) {
    const ocr = runOcr(input);
    return Object.freeze({
      text: ocr.text,
      mimeType: doc.mimeType,
      usedOcr: true,
    });
  }
  return Object.freeze({
    text: getDocumentContent(doc.currentVersionId) ?? "",
    mimeType: doc.mimeType,
    usedOcr: false,
  });
}
