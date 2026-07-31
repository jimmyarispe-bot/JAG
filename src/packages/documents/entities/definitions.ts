/**
 * Documents domain entities — business documents (not file storage).
 */

import type { EntityModel } from "@/jag/modeling";
import { documentsEntity } from "@/packages/documents/_helpers";

export const DocumentTypeEntity = documentsEntity({
  entityType: "DocumentType",
  label: "Document Type",
  metadataKeys: [
    "displayName",
    "typeKey",
    "category",
    "description",
    "status",
    "externalId",
  ],
});

export const DocumentTemplateEntity = documentsEntity({
  entityType: "DocumentTemplate",
  label: "Document Template",
  metadataKeys: [
    "displayName",
    "documentTypeId",
    "status",
    "currentVersionId",
    "brandingPlaceholders",
    "externalId",
  ],
});

export const DocumentTemplateVersionEntity = documentsEntity({
  entityType: "DocumentTemplateVersion",
  label: "Document Template Version",
  metadataKeys: [
    "displayName",
    "templateId",
    "versionNumber",
    "requiredFields",
    "mergeVariables",
    "sections",
    "changeSummary",
    "status",
    "externalId",
  ],
});

export const DocumentEntity = documentsEntity({
  entityType: "BusinessDocument",
  label: "Document",
  metadataKeys: [
    "displayName",
    "title",
    "description",
    "documentTypeId",
    "templateId",
    "ownerId",
    "createdById",
    "effectiveDate",
    "expirationDate",
    "tags",
    "classification",
    "language",
    "jurisdiction",
    "lifecycleState",
    "currentVersionId",
    "retentionPolicyId",
    "status",
    "externalId",
  ],
  searchableFields: [
    {
      key: "title",
      label: "Title",
      type: "string",
      filterable: true,
      sortable: true,
    },
    {
      key: "displayName",
      label: "Name",
      type: "string",
      filterable: true,
      sortable: true,
    },
  ],
});

/**
 * Immutable document version — new revision = new version record.
 * supersedes / supersededBy express lineage without mutating prior versions.
 */
export const DocumentVersionEntity = documentsEntity({
  entityType: "DocumentVersion",
  label: "Document Version",
  metadataKeys: [
    "displayName",
    "documentId",
    "versionNumber",
    "revisionNumber",
    "changeSummary",
    "supersedesVersionId",
    "supersededByVersionId",
    "lifecycleState",
    "createdById",
    "createdAt",
    "status",
    "externalId",
  ],
});

export const DocumentLinkEntity = documentsEntity({
  entityType: "DocumentLink",
  label: "Document Link",
  metadataKeys: [
    "displayName",
    "fromDocumentId",
    "toDocumentId",
    "relationshipKind",
    "relatedRecordType",
    "relatedRecordId",
    "status",
    "externalId",
  ],
});

/** Attachment metadata — opaque storage ref only; infrastructure owns files. */
export const DocumentAttachmentRefEntity = documentsEntity({
  entityType: "DocumentAttachmentRef",
  label: "Document Attachment Ref",
  metadataKeys: [
    "displayName",
    "documentId",
    "documentVersionId",
    "fileName",
    "mimeType",
    "byteSize",
    "storageProviderRef",
    "storageObjectKey",
    "status",
    "externalId",
  ],
});

export const DocumentSignatureRequirementEntity = documentsEntity({
  entityType: "DocumentSignatureRequirement",
  label: "Document Signature Requirement",
  metadataKeys: [
    "displayName",
    "documentId",
    "documentVersionId",
    "signerRole",
    "signerMemberId",
    "required",
    "dueAt",
    "status",
    "externalId",
  ],
});

export const DocumentSignatureEntity = documentsEntity({
  entityType: "DocumentSignature",
  label: "Document Signature",
  metadataKeys: [
    "displayName",
    "requirementId",
    "documentId",
    "documentVersionId",
    "signerMemberId",
    "signatureStatus",
    "signedAt",
    "externalId",
  ],
});

export const RetentionPolicyEntity = documentsEntity({
  entityType: "RetentionPolicy",
  label: "Retention Policy",
  metadataKeys: [
    "displayName",
    "policyKey",
    "retentionPeriodDays",
    "destructionDateRule",
    "archivePolicy",
    "description",
    "status",
    "externalId",
  ],
});

export const DOCUMENTS_ENTITY_DEFINITIONS: readonly EntityModel[] =
  Object.freeze(
    [
      DocumentAttachmentRefEntity,
      DocumentEntity,
      DocumentLinkEntity,
      DocumentSignatureEntity,
      DocumentSignatureRequirementEntity,
      DocumentTemplateEntity,
      DocumentTemplateVersionEntity,
      DocumentTypeEntity,
      DocumentVersionEntity,
      RetentionPolicyEntity,
    ].sort((a, b) => a.entityType.localeCompare(b.entityType))
  );
