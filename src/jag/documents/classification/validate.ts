import {
  DOCUMENT_CLASSIFICATIONS,
  type DocumentClassification,
  type DocumentDefinition,
} from "@/jag/documents/contracts/definitions";

export function isDocumentClassification(
  value: string
): value is DocumentClassification {
  return (DOCUMENT_CLASSIFICATIONS as readonly string[]).includes(value);
}

export function assertUniversalClassification(
  classification: DocumentClassification
): void {
  if (!isDocumentClassification(classification)) {
    throw new Error(
      `Classification "${String(classification)}" is not a universal document classification`
    );
  }
}

export function assertAllowedClassification(
  definition: DocumentDefinition,
  classification: DocumentClassification
): void {
  assertUniversalClassification(classification);
  const allowed =
    definition.allowedClassifications ?? DOCUMENT_CLASSIFICATIONS;
  if (!allowed.includes(classification)) {
    throw new Error(
      `Classification "${classification}" is not allowed for document "${definition.id}"`
    );
  }
}

export function listUniversalClassifications(): readonly DocumentClassification[] {
  return DOCUMENT_CLASSIFICATIONS;
}
