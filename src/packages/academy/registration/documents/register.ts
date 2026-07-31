import {
  DocumentRegistry,
  registerDocument,
  registerDocumentCategory,
} from "@/jag/documents";
import {
  ACADEMY_ADMISSIONS_DOCUMENT_CATEGORY,
  ACADEMY_ADMISSIONS_DOCUMENT_DEFINITIONS,
} from "@/packages/academy/documents/admissions";

/** Register Academy admissions document category + definitions. */
export function registerAcademyPackageDocuments(): void {
  if (!DocumentRegistry.getCategory(ACADEMY_ADMISSIONS_DOCUMENT_CATEGORY.id)) {
    registerDocumentCategory(ACADEMY_ADMISSIONS_DOCUMENT_CATEGORY);
  }
  for (const definition of ACADEMY_ADMISSIONS_DOCUMENT_DEFINITIONS) {
    if (!DocumentRegistry.get(definition.id)) {
      registerDocument(definition);
    }
  }
}
