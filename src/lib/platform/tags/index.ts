export { SYSTEM_TAG_SLUGS, TAG_CATEGORY_LABELS } from "@/lib/platform/tags/catalog";
export type { SystemTagSlug } from "@/lib/platform/tags/catalog";
export { applyTags, applyTagsBySlug, createTag, removeTag } from "@/lib/platform/tags/actions";
export {
  assertTagApplyPermission,
  assertTagCreatePermission,
  assertTagRemovePermission,
  canApplyTags,
  canCreateTag,
  canRemoveTags,
  requireTagWriteForAction,
} from "@/lib/platform/tags/permissions";
export { findEntitiesByTags, getEntityTags, getTagBySlug, getTags } from "@/lib/platform/tags/query";
export type {
  ApplyTagsInput,
  CreateTagInput,
  PlatformEntityTag,
  PlatformTag,
  TagCategory,
  TagSource,
} from "@/lib/platform/tags/types";
