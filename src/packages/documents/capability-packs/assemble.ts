import type { BlueprintContributionBundle } from "@/jag/blueprints";
import {
  DOCUMENT_CLASSIFICATIONS,
  DOCUMENT_LIFECYCLE_STATES,
  DOCUMENT_RELATIONSHIP_KINDS,
  DOCUMENT_TYPE_EXAMPLES,
} from "@/packages/documents/catalogs";
import { DOCUMENTS_ENTITY_DEFINITIONS } from "@/packages/documents/entities";
import { DOCUMENTS_NAVIGATION } from "@/packages/documents/navigation";
import { DOCUMENTS_PERMISSION_PACKS } from "@/packages/documents/permissions";

export function assembleDocumentsContributionBundle(): BlueprintContributionBundle {
  return Object.freeze({
    entities: DOCUMENTS_ENTITY_DEFINITIONS,
    permissions: DOCUMENTS_PERMISSION_PACKS,
    navigation: Object.freeze([DOCUMENTS_NAVIGATION]),
    processes: Object.freeze([]),
    decisions: Object.freeze([]),
    forms: Object.freeze([]),
    reports: Object.freeze([]),
    workflows: Object.freeze([]),
    terminology: Object.freeze([
      Object.freeze({
        id: "documents.terminology.default",
        label: "Documents default terminology",
        terms: Object.freeze({
          document: "Document",
          template: "Template",
          version: "Version",
          retention: "Retention",
        }),
      }),
    ]),
    integrations: Object.freeze([]),
  });
}

export function documentsPackCatalogPayload() {
  return Object.freeze({
    documentTypeExamples: DOCUMENT_TYPE_EXAMPLES,
    lifecycleStates: DOCUMENT_LIFECYCLE_STATES,
    classifications: DOCUMENT_CLASSIFICATIONS,
    relationshipKinds: DOCUMENT_RELATIONSHIP_KINDS,
  });
}
