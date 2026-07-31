import {
  assertEntityTypeRegistered,
  entityHasCapability,
} from "@/lib/platform/entities/registry";
import type { EntityTag, EntityTagLink } from "@/lib/platform/entities/types";

const tagStore = new Map<string, EntityTag>();
const linkStore = new Map<string, EntityTagLink>();
let tagSeq = 0;
let linkSeq = 0;

export function resetEntityTagsForTests(): void {
  tagStore.clear();
  linkStore.clear();
  tagSeq = 0;
  linkSeq = 0;
}

function slugify(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function createEntityTag(input: {
  label: string;
  slug?: string;
  organizationId?: string | null;
  now?: string;
}): EntityTag {
  const now = input.now ?? new Date().toISOString();
  tagSeq += 1;
  const slug = input.slug?.trim() || slugify(input.label);
  const tag: EntityTag = {
    id: `ent-tag:${tagSeq}:${slug}`,
    slug,
    label: input.label.trim(),
    organizationId: input.organizationId ?? null,
    createdAt: now,
  };
  tagStore.set(tag.id, tag);
  return { ...tag };
}

export function applyEntityTag(input: {
  entityType: string;
  entityId: string;
  tagId: string;
  now?: string;
}): EntityTagLink {
  assertEntityTypeRegistered(input.entityType);
  if (!entityHasCapability(input.entityType, "tags")) {
    throw new Error(`Entity type "${input.entityType}" does not enable tags`);
  }
  if (!tagStore.has(input.tagId)) {
    throw new Error(`Tag not found: ${input.tagId}`);
  }
  const existing = [...linkStore.values()].find(
    (l) =>
      l.tagId === input.tagId &&
      l.entityType === input.entityType &&
      l.entityId === input.entityId
  );
  if (existing) return { ...existing };

  const now = input.now ?? new Date().toISOString();
  linkSeq += 1;
  const link: EntityTagLink = {
    id: `ent-tag-link:${linkSeq}:${now}`,
    tagId: input.tagId,
    entityType: input.entityType,
    entityId: input.entityId,
    createdAt: now,
  };
  linkStore.set(link.id, link);
  return { ...link };
}

export function removeEntityTag(input: {
  entityType: string;
  entityId: string;
  tagId: string;
}): boolean {
  for (const [id, link] of linkStore) {
    if (
      link.tagId === input.tagId &&
      link.entityType === input.entityType &&
      link.entityId === input.entityId
    ) {
      linkStore.delete(id);
      return true;
    }
  }
  return false;
}

export function listEntityTags(
  entityType: string,
  entityId: string
): EntityTag[] {
  const tagIds = [...linkStore.values()]
    .filter((l) => l.entityType === entityType && l.entityId === entityId)
    .map((l) => l.tagId);
  return tagIds
    .map((id) => tagStore.get(id))
    .filter((t): t is EntityTag => Boolean(t))
    .map((t) => ({ ...t }));
}

export function findEntitiesByTag(tagId: string): EntityTagLink[] {
  return [...linkStore.values()]
    .filter((l) => l.tagId === tagId)
    .map((l) => ({ ...l }));
}
