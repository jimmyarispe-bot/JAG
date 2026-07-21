import type { MemoryEntity, MemoryEntityKind } from "@/lib/platform/intelligence/executive-memory/types";

export class MemoryIndex {
  private readonly byId = new Map<string, MemoryEntity>();
  private readonly byKind = new Map<MemoryEntityKind, Set<string>>();
  private readonly byDomain = new Map<string, Set<string>>();
  private readonly byTag = new Map<string, Set<string>>();
  private readonly bySource = new Map<string, Set<string>>();

  upsert(entity: MemoryEntity): void {
    this.byId.set(entity.id, entity);
    addTo(this.byKind, entity.kind, entity.id);
    for (const d of entity.domains) addTo(this.byDomain, d, entity.id);
    for (const t of entity.tags) addTo(this.byTag, t, entity.id);
    for (const s of entity.sourceIds) addTo(this.bySource, s, entity.id);
  }

  get(id: string): MemoryEntity | undefined {
    return this.byId.get(id);
  }

  all(): MemoryEntity[] {
    return [...this.byId.values()];
  }

  idsByKind(kind: MemoryEntityKind): string[] {
    return [...(this.byKind.get(kind) ?? [])];
  }

  idsByDomain(domain: string): string[] {
    return [...(this.byDomain.get(domain) ?? [])];
  }

  idsByTag(tag: string): string[] {
    return [...(this.byTag.get(tag) ?? [])];
  }

  idsBySource(sourceId: string): string[] {
    return [...(this.bySource.get(sourceId) ?? [])];
  }

  findBySourceFingerprint(sourceIds: string[], kind: MemoryEntityKind): MemoryEntity | undefined {
    if (!sourceIds.length) return undefined;
    for (const id of this.idsByKind(kind)) {
      const entity = this.byId.get(id);
      if (!entity) continue;
      if (sourceIds.every((s) => entity.sourceIds.includes(s))) return entity;
    }
    return undefined;
  }
}

function addTo(map: Map<string, Set<string>>, key: string, id: string): void {
  let set = map.get(key);
  if (!set) {
    set = new Set();
    map.set(key, set);
  }
  set.add(id);
}
