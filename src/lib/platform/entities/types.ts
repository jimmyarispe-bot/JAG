/**
 * JAG Universal Entity Framework (Sprint 071).
 * Applications register entity types; the platform never hardcodes domain meaning.
 */

export type EntityStatus =
  | "active"
  | "inactive"
  | "archived"
  | "draft"
  | "pending"
  | "closed";

export type EntityOwner = {
  userId: string | null;
  displayName: string | null;
  role: string | null;
};

/** Universal entity contract — every application entity extends this shape. */
export type PlatformEntity = {
  id: string;
  entityType: string;
  applicationId: string | null;
  organizationId: string | null;
  displayName: string;
  status: EntityStatus;
  owner: EntityOwner | null;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
};

export type EntityRef = {
  entityType: string;
  entityId: string;
};

export type EntityCapability =
  | "timeline"
  | "notes"
  | "documents"
  | "attachments"
  | "tags"
  | "relationships"
  | "search"
  | "ownership"
  | "permissions";

export type SearchableField = {
  key: string;
  label: string;
  type: "string" | "number" | "date" | "enum" | "boolean";
  filterable?: boolean;
  sortable?: boolean;
};

export type EntitySearchContract = {
  fields: SearchableField[];
  defaultSort?: { field: string; direction: "asc" | "desc" };
};

export type EntityPermissionRule = {
  action: string;
  /** Permission key evaluated by the existing identity model (e.g. students.view). */
  permission: string;
  description?: string;
};

/** Application-supplied registration — platform stores definitions only. */
export type EntityTypeDefinition = {
  entityType: string;
  label: string;
  applicationId: string | null;
  capabilities: EntityCapability[];
  searchable: EntitySearchContract;
  permissions: EntityPermissionRule[];
  /** Optional schema hints for metadata keys (not enforced DB). */
  metadataKeys?: string[];
};

export type EntityRelationship = {
  id: string;
  from: EntityRef;
  to: EntityRef;
  /** Opaque relationship kind — platform does not interpret business meaning. */
  relationshipType: string;
  organizationId: string | null;
  primary: boolean;
  status: "active" | "ended";
  createdAt: string;
  endedAt: string | null;
  metadata: Record<string, unknown>;
};

export type EntityTimelineSource =
  | "activity"
  | "decision"
  | "notification"
  | "automation"
  | "intelligence"
  | "forecast"
  | "note"
  | "document"
  | "system";

export type EntityTimelineEntry = {
  id: string;
  entityType: string;
  entityId: string;
  source: EntityTimelineSource;
  eventType: string;
  title: string;
  summary: string | null;
  occurredAt: string;
  actorUserId: string | null;
  refId: string | null;
  metadata: Record<string, unknown>;
};

export type EntityNote = {
  id: string;
  entityType: string;
  entityId: string;
  organizationId: string | null;
  body: string;
  authorUserId: string | null;
  /** Future-ready mention placeholders: `@user:id` tokens in body. */
  mentionUserIds: string[];
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
  metadata: Record<string, unknown>;
};

export type EntityTag = {
  id: string;
  slug: string;
  label: string;
  organizationId: string | null;
  createdAt: string;
};

export type EntityTagLink = {
  id: string;
  tagId: string;
  entityType: string;
  entityId: string;
  createdAt: string;
};

export type EntityDocument = {
  id: string;
  entityType: string;
  entityId: string;
  organizationId: string | null;
  title: string;
  mimeType: string | null;
  /** Storage key / URI hook — no storage backend changes in this sprint. */
  storageRef: string | null;
  version: number;
  ownerUserId: string | null;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
};

export type EntityAttachment = {
  id: string;
  entityType: string;
  entityId: string;
  documentId: string | null;
  fileName: string;
  mimeType: string | null;
  storageRef: string | null;
  sizeBytes: number | null;
  createdAt: string;
  metadata: Record<string, unknown>;
};

export type EntitySearchQuery = {
  entityType?: string;
  organizationId?: string | null;
  applicationId?: string | null;
  text?: string;
  filters?: Record<string, unknown>;
  sort?: { field: string; direction: "asc" | "desc" };
  limit?: number;
};

export type EntitySearchHit = {
  entity: PlatformEntity;
  score: number;
  matchedFields: string[];
};
