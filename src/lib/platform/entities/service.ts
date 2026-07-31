import {
  listAllEntityActivity,
  listEntityActivity,
  recordEntityActivity,
  resetEntityActivityForTests,
} from "@/lib/platform/entities/activity";
import {
  addEntityAttachment,
  listEntityAttachments,
  resetEntityAttachmentsForTests,
} from "@/lib/platform/entities/attachments";
import {
  attachEntityDocument,
  bumpEntityDocumentVersion,
  getEntityDocument,
  listEntityDocuments,
  resetEntityDocumentsForTests,
} from "@/lib/platform/entities/documents";
import {
  createPlatformEntity,
  getPlatformEntity,
  listPlatformEntities,
  resetEntityStoreForTests,
  toEntityRef,
  upsertPlatformEntity,
} from "@/lib/platform/entities/entity";
import {
  addEntityNote,
  extractMentionUserIds,
  listEntityNotes,
  pinEntityNote,
  resetEntityNotesForTests,
} from "@/lib/platform/entities/notes";
import {
  assignEntityOwner,
  buildEntityOwner,
  clearEntityOwner,
  ownerLabel,
} from "@/lib/platform/entities/ownership";
import {
  assertEntityActionAllowed,
  canPerformEntityAction,
  listEntityPermissionRules,
  resolveEntityPermission,
} from "@/lib/platform/entities/permissions";
import {
  assertEntityTypeRegistered,
  entityHasCapability,
  getEntityType,
  isEntityTypeRegistered,
  listEntityTypes,
  registerEntityType,
  resetEntityRegistryForTests,
  unregisterEntityType,
} from "@/lib/platform/entities/registry";
import {
  createEntityRelationship,
  endEntityRelationship,
  listEntityRelationships,
  listRelationshipsFrom,
  listRelationshipsTo,
  resetEntityRelationshipsForTests,
} from "@/lib/platform/entities/relationships";
import {
  getEntitySearchContract,
  searchEntities,
} from "@/lib/platform/entities/search";
import {
  canTransitionEntityStatus,
  setEntityStatus,
} from "@/lib/platform/entities/status";
import {
  applyEntityTag,
  createEntityTag,
  findEntitiesByTag,
  listEntityTags,
  removeEntityTag,
  resetEntityTagsForTests,
} from "@/lib/platform/entities/tags";
import { getEntityTimeline } from "@/lib/platform/entities/timeline";

export function resetEntityFrameworkForTests(): void {
  resetEntityRegistryForTests();
  resetEntityStoreForTests();
  resetEntityRelationshipsForTests();
  resetEntityNotesForTests();
  resetEntityTagsForTests();
  resetEntityDocumentsForTests();
  resetEntityAttachmentsForTests();
  resetEntityActivityForTests();
}

/**
 * Universal Entity Framework service.
 * Applications register types; platform provides shared capabilities.
 */
export const EntityService = {
  // Registry
  registerType: registerEntityType,
  unregisterType: unregisterEntityType,
  getType: getEntityType,
  listTypes: listEntityTypes,
  isRegistered: isEntityTypeRegistered,
  assertRegistered: assertEntityTypeRegistered,
  hasCapability: entityHasCapability,

  // Entity working set (framework — not application table replacement)
  create: createPlatformEntity,
  upsert: upsertPlatformEntity,
  get: getPlatformEntity,
  list: listPlatformEntities,
  toRef: toEntityRef,

  // Status / ownership / permissions
  setStatus: setEntityStatus,
  canTransitionStatus: canTransitionEntityStatus,
  assignOwner: assignEntityOwner,
  clearOwner: clearEntityOwner,
  buildOwner: buildEntityOwner,
  ownerLabel,
  listPermissionRules: listEntityPermissionRules,
  resolvePermission: resolveEntityPermission,
  canPerform: canPerformEntityAction,
  assertAction: assertEntityActionAllowed,

  // Relationships
  relate: createEntityRelationship,
  endRelationship: endEntityRelationship,
  relationships: listEntityRelationships,
  relationshipsFrom: listRelationshipsFrom,
  relationshipsTo: listRelationshipsTo,

  // Timeline / activity
  recordActivity: recordEntityActivity,
  listActivity: listEntityActivity,
  listAllActivity: listAllEntityActivity,
  timeline: getEntityTimeline,

  // Notes / tags
  addNote: addEntityNote,
  listNotes: listEntityNotes,
  pinNote: pinEntityNote,
  extractMentions: extractMentionUserIds,
  createTag: createEntityTag,
  applyTag: applyEntityTag,
  removeTag: removeEntityTag,
  listTags: listEntityTags,
  findByTag: findEntitiesByTag,

  // Documents / attachments
  attachDocument: attachEntityDocument,
  bumpDocumentVersion: bumpEntityDocumentVersion,
  getDocument: getEntityDocument,
  listDocuments: listEntityDocuments,
  addAttachment: addEntityAttachment,
  listAttachments: listEntityAttachments,

  // Search contract
  searchContract: getEntitySearchContract,
  search: searchEntities,

  resetForTests: resetEntityFrameworkForTests,
} as const;

export type EntityServiceApi = typeof EntityService;
