export const DOCUMENTS_PERMISSION_KEYS = Object.freeze({
  access: "documents.access",
  typesRead: "documents.types.read",
  typesUpdate: "documents.types.update",
  templatesRead: "documents.templates.read",
  templatesUpdate: "documents.templates.update",
  documentsRead: "documents.documents.read",
  documentsUpdate: "documents.documents.update",
  versionsRead: "documents.versions.read",
  versionsCreate: "documents.versions.create",
  linksRead: "documents.links.read",
  linksUpdate: "documents.links.update",
  signaturesRead: "documents.signatures.read",
  signaturesUpdate: "documents.signatures.update",
  retentionRead: "documents.retention.read",
  retentionUpdate: "documents.retention.update",
} as const);

export const DOCUMENTS_PERMISSION_PACK_ID = "documents.permission.core" as const;
