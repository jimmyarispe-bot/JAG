/**
 * JAG Documents Engine — immutable core contracts.
 * Industry-agnostic: no education/healthcare/domain fields; no storage-driver fields.
 */

export type DocumentDefinitionId = string;
export type DocumentInstanceId = string;
export type DocumentVersionId = string;
export type DocumentTemplateId = string;
export type DocumentCategoryId = string;

/** Universal classification labels — packages must not invent parallel taxonomies here. */
export type DocumentClassification =
  | "public"
  | "internal"
  | "confidential"
  | "restricted"
  | "archival";

export const DOCUMENT_CLASSIFICATIONS: readonly DocumentClassification[] = [
  "public",
  "internal",
  "confidential",
  "restricted",
  "archival",
] as const;

export type DocumentLifecycleStatus =
  | "draft"
  | "active"
  | "archived"
  | "restored";

/** Declared by application packages; executed by JAG. */
export type DocumentDefinition = {
  readonly id: DocumentDefinitionId;
  readonly applicationId: string;
  readonly version: string;
  readonly label: string;
  readonly description?: string;
  readonly categoryId: DocumentCategoryId;
  readonly defaultClassification: DocumentClassification;
  readonly allowedClassifications?: readonly DocumentClassification[];
  readonly templateIds?: readonly DocumentTemplateId[];
  readonly permissions?: readonly DocumentPermission[];
  readonly dependsOn?: readonly DocumentDefinitionId[];
  readonly metadataSchema?: Readonly<Record<string, unknown>>;
  readonly extensions?: Readonly<{
    processDefinitionIds?: readonly string[];
    decisionDefinitionIds?: readonly string[];
    workflowDefinitionIds?: readonly string[];
    entityTypeIds?: readonly string[];
    formDefinitionIds?: readonly string[];
    communicationTemplateIds?: readonly string[];
    intelligencePackIds?: readonly string[];
  }>;
};

export type DocumentCategory = {
  readonly id: DocumentCategoryId;
  readonly label: string;
  readonly description?: string;
};

export type DocumentTemplate = {
  readonly id: DocumentTemplateId;
  readonly definitionId: DocumentDefinitionId;
  readonly label: string;
  readonly description?: string;
  readonly defaultMetadata?: Readonly<Record<string, unknown>>;
};

export type DocumentMetadata = {
  readonly title: string;
  readonly description?: string;
  readonly tags?: readonly string[];
  readonly attributes?: Readonly<Record<string, unknown>>;
};

export type DocumentVersion = {
  readonly id: DocumentVersionId;
  readonly instanceId: DocumentInstanceId;
  readonly versionNumber: number;
  readonly createdAt: string;
  readonly createdByUserId: string;
  readonly classification: DocumentClassification;
  readonly metadata: DocumentMetadata;
  /** Opaque storage key — never a driver-specific URL or bucket field. */
  readonly contentRef?: string;
  readonly contentType?: string;
  readonly byteLength?: number;
  readonly checksum?: string;
  readonly immutable: true;
  readonly audit?: Readonly<{
    readonly reason?: string;
    readonly correlationId?: string;
  }>;
};

export type DocumentInstance = {
  readonly id: DocumentInstanceId;
  readonly definitionId: DocumentDefinitionId;
  readonly definitionVersion: string;
  readonly organizationId: string;
  readonly status: DocumentLifecycleStatus;
  readonly classification: DocumentClassification;
  readonly currentVersionId: DocumentVersionId;
  readonly currentVersionNumber: number;
  readonly metadata: DocumentMetadata;
  readonly createdAt: string;
  readonly createdByUserId: string;
  readonly updatedAt: string;
  readonly archivedAt?: string;
  readonly restoredAt?: string;
  readonly subjectId?: string;
  readonly links: readonly DocumentReference[];
};

export type DocumentReference = {
  readonly kind: "entity" | "process" | "workflow" | "decision" | "document" | "external";
  readonly targetId: string;
  readonly label?: string;
  readonly linkedAt: string;
  readonly linkedByUserId: string;
};

export type DocumentPermissionAction =
  | "create"
  | "read"
  | "update"
  | "version"
  | "archive"
  | "restore"
  | "link"
  | "manage_permissions";

export type DocumentPermission = {
  readonly action: DocumentPermissionAction;
  readonly roles?: readonly string[];
  readonly permissionKey?: string;
};

export type DocumentEventType =
  | "document.created"
  | "document.updated"
  | "document.versioned"
  | "document.archived"
  | "document.restored"
  | "document.linked"
  | "document.accessed"
  | "document.permission_changed"
  | "document.validated";

export type DocumentEvent = {
  readonly id: string;
  readonly type: DocumentEventType;
  readonly instanceId: DocumentInstanceId;
  readonly definitionId: DocumentDefinitionId;
  readonly occurredAt: string;
  readonly actorUserId?: string;
  readonly versionId?: DocumentVersionId;
  readonly data?: Readonly<Record<string, unknown>>;
};

export type DocumentMetrics = {
  readonly instanceId: DocumentInstanceId;
  readonly definitionId: DocumentDefinitionId;
  readonly versionCount: number;
  readonly linkCount: number;
  readonly createdAt: string;
  readonly lastVersionAt: string;
  readonly accessCount: number;
};

export type DocumentResult<T = void> = {
  readonly ok: boolean;
  readonly value?: T;
  readonly error?: { readonly code: string; readonly message: string };
  readonly events?: readonly DocumentEvent[];
};
