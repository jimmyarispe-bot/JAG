/**
 * Documents Capability Pack — Universal Organizational Documents.
 */

export {
  DOCUMENTS_APPLICATION_ID,
  DOCUMENTS_PACKAGE_ID,
  DOCUMENTS_PACKAGE_VERSION,
  DOCUMENTS_PACK_ID,
} from "@/packages/documents/package";

export {
  buildDocumentsCapabilityPacks,
  buildDocumentsCorePack,
  describeDocumentsCorePack,
  assembleDocumentsContributionBundle,
  documentsPackCatalogPayload,
} from "@/packages/documents/capability-packs";

export {
  DOCUMENTS_ENTITY_DEFINITIONS,
  DocumentLinkEntity,
  DocumentVersionEntity,
  DocumentEntity,
} from "@/packages/documents/entities";
export {
  DOCUMENTS_PERMISSION_KEYS,
  DOCUMENTS_PERMISSION_PACK,
  DOCUMENTS_PERMISSION_PACK_ID,
  DOCUMENTS_PERMISSION_PACKS,
} from "@/packages/documents/permissions";
export { DOCUMENTS_NAVIGATION } from "@/packages/documents/navigation";
export {
  DOCUMENT_TYPE_EXAMPLES,
  DOCUMENT_LIFECYCLE_STATES,
  DOCUMENT_CLASSIFICATIONS,
  DOCUMENT_RELATIONSHIP_KINDS,
} from "@/packages/documents/catalogs";

export {
  buildDocumentsProofOrganizationBlueprint,
  compileDocumentsProofRuntime,
  generateDocumentsProofRuntime,
  registerDocumentsHandwrittenBaseline,
  resetDocumentsProofPortsForTests,
  listDocumentsProofPermissionPacks,
} from "@/packages/documents/proof";
