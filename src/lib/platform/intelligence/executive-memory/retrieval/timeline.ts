import type {
  MemoryEntity,
  MemoryTimelineEntry,
} from "@/lib/platform/intelligence/executive-memory/types";

export function buildOrganizationalTimeline(
  entities: MemoryEntity[]
): MemoryTimelineEntry[] {
  return [...entities]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((e) => ({
      id: `tl-${e.id}`,
      at: e.createdAt,
      kind: e.kind,
      entityId: e.id,
      title: e.title,
      summary: e.summary,
      domains: e.domains,
    }));
}
