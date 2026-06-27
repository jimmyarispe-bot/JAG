import type { PlatformEntityTag, PlatformTag, TagCategory } from "@/lib/platform/tags/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function getTags(
  supabase: AuthClient,
  organizationId: string,
  options?: { category?: TagCategory; query?: string; activeOnly?: boolean }
): Promise<PlatformTag[]> {
  let q = supabase
    .from("platform_tags")
    .select("*")
    .eq("organization_id", organizationId)
    .order("sort_order")
    .order("label");

  if (options?.category) q = q.eq("category", options.category);
  if (options?.activeOnly !== false) q = q.eq("is_active", true);

  const { data } = await q;
  let tags = (data ?? []) as PlatformTag[];

  if (options?.query) {
    const needle = options.query.toLowerCase();
    tags = tags.filter(
      (t) => t.label.toLowerCase().includes(needle) || t.slug.toLowerCase().includes(needle)
    );
  }

  return tags;
}

export async function getEntityTags(
  supabase: AuthClient,
  entityType: string,
  entityId: string,
  options?: { includeExpired?: boolean }
): Promise<PlatformEntityTag[]> {
  let q = supabase
    .from("platform_entity_tags")
    .select("*, platform_tags(*)")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("applied_at", { ascending: false });

  if (options?.includeExpired !== true) {
    q = q.or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
  }

  const { data } = await q;

  return (data ?? []) as PlatformEntityTag[];
}

export async function getTagBySlug(
  supabase: AuthClient,
  organizationId: string,
  slug: string
): Promise<PlatformTag | null> {
  const { data } = await supabase
    .from("platform_tags")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("slug", slug)
    .maybeSingle();

  return (data as PlatformTag | null) ?? null;
}

export async function findEntitiesByTags(
  supabase: AuthClient,
  organizationId: string,
  input: {
    entityType: string;
    tagSlugs: string[];
    match?: "any" | "all";
  }
): Promise<string[]> {
  const tags = await Promise.all(
    input.tagSlugs.map((slug) => getTagBySlug(supabase, organizationId, slug))
  );
  const tagIds = tags.filter(Boolean).map((t) => t!.id);
  if (!tagIds.length) return [];

  const { data } = await supabase
    .from("platform_entity_tags")
    .select("entity_id, tag_id")
    .eq("organization_id", organizationId)
    .eq("entity_type", input.entityType)
    .in("tag_id", tagIds);

  const rows = data ?? [];
  if (input.match === "all") {
    const byEntity = new Map<string, Set<string>>();
    for (const row of rows) {
      const set = byEntity.get(row.entity_id) ?? new Set();
      set.add(row.tag_id);
      byEntity.set(row.entity_id, set);
    }
    return [...byEntity.entries()]
      .filter(([, set]) => tagIds.every((id) => set.has(id)))
      .map(([id]) => id);
  }

  return [...new Set(rows.map((r) => r.entity_id))];
}
