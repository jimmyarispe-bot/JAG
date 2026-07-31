export { EntityService, resetEntityFrameworkForTests } from "@/lib/platform/entities/service";
export type { EntityServiceApi } from "@/lib/platform/entities/service";

export {
  registerEntityType,
  unregisterEntityType,
  getEntityType,
  listEntityTypes,
  isEntityTypeRegistered,
  assertEntityTypeRegistered,
  entityHasCapability,
  resetEntityRegistryForTests,
} from "@/lib/platform/entities/registry";

export {
  createPlatformEntity,
  upsertPlatformEntity,
  getPlatformEntity,
  listPlatformEntities,
  toEntityRef,
  resetEntityStoreForTests,
} from "@/lib/platform/entities/entity";

export {
  createEntityRelationship,
  endEntityRelationship,
  listEntityRelationships,
  listRelationshipsFrom,
  listRelationshipsTo,
  resetEntityRelationshipsForTests,
} from "@/lib/platform/entities/relationships";

export { getEntityTimeline } from "@/lib/platform/entities/timeline";
export {
  recordEntityActivity,
  listEntityActivity,
  resetEntityActivityForTests,
} from "@/lib/platform/entities/activity";

export {
  addEntityNote,
  listEntityNotes,
  pinEntityNote,
  extractMentionUserIds,
  resetEntityNotesForTests,
} from "@/lib/platform/entities/notes";

export {
  createEntityTag,
  applyEntityTag,
  removeEntityTag,
  listEntityTags,
  findEntitiesByTag,
  resetEntityTagsForTests,
} from "@/lib/platform/entities/tags";

export {
  attachEntityDocument,
  bumpEntityDocumentVersion,
  listEntityDocuments,
  getEntityDocument,
  resetEntityDocumentsForTests,
} from "@/lib/platform/entities/documents";

export {
  addEntityAttachment,
  listEntityAttachments,
  resetEntityAttachmentsForTests,
} from "@/lib/platform/entities/attachments";

export {
  getEntitySearchContract,
  searchEntities,
} from "@/lib/platform/entities/search";

export {
  canTransitionEntityStatus,
  setEntityStatus,
} from "@/lib/platform/entities/status";

export {
  assignEntityOwner,
  clearEntityOwner,
  buildEntityOwner,
  ownerLabel,
} from "@/lib/platform/entities/ownership";

export {
  listEntityPermissionRules,
  resolveEntityPermission,
  canPerformEntityAction,
  assertEntityActionAllowed,
} from "@/lib/platform/entities/permissions";

export type {
  EntityAttachment,
  EntityCapability,
  EntityDocument,
  EntityNote,
  EntityOwner,
  EntityPermissionRule,
  EntityRef,
  EntityRelationship,
  EntitySearchContract,
  EntitySearchHit,
  EntitySearchQuery,
  EntityStatus,
  EntityTag,
  EntityTagLink,
  EntityTimelineEntry,
  EntityTimelineSource,
  EntityTypeDefinition,
  PlatformEntity,
  SearchableField,
} from "@/lib/platform/entities/types";
