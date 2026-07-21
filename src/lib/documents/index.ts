export {
  canManageAllDocuments,
  canManageSchoolDocuments,
  canEditDocuments,
  canViewDocuments,
  canManageHrDocuments,
  canManageFinanceDocuments,
  assertCanView,
  assertCanEdit,
  requireDocumentsViewAccess,
  requireDocumentsEditAccess,
} from "./access";

export {
  createDocument,
  updateDocument,
  restoreDocumentVersion,
  archiveDocument,
  restoreDocument,
  deleteDocument,
  approveDocument,
  rejectDocument,
  routeDocumentForReview,
  requestDocumentSignature,
  getDocument,
  isAllowedUploadMime,
} from "./service";

export { listDocuments, searchDocumentsMetadata, normalizeDocumentFilter } from "./queries";
export { listDocumentVersions, getDocumentVersion } from "./versions";
export { compareVersions } from "./compare";
export { listDocumentTemplates, getDocumentTemplate, duplicateFromTemplate } from "./templates";
export {
  requestSignature,
  ensureEsignExtensionsRegistered,
} from "./esign";
export { detectPreviewKind, canInlinePreview } from "./preview";
export { DOCUMENT_CATEGORIES, ALLOWED_UPLOAD_MIME_TYPES } from "./types";

export type * from "./types";
