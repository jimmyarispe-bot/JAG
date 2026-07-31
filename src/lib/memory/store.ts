import type { JagMemory, MemoryTimelineEntry } from "@/lib/memory/types";

type MemoryStore = {
  memories: Map<string, JagMemory>;
  timeline: MemoryTimelineEntry[];
};

const g = globalThis as typeof globalThis & {
  __jagMemoryStore?: MemoryStore;
};

function store(): MemoryStore {
  if (!g.__jagMemoryStore) {
    g.__jagMemoryStore = {
      memories: new Map(),
      timeline: [],
    };
  }
  return g.__jagMemoryStore;
}

export function resetMemoryStoreForTests(): void {
  g.__jagMemoryStore = {
    memories: new Map(),
    timeline: [],
  };
}

function key(organizationId: string, id: string): string {
  return `${organizationId}::${id}`;
}

export function upsertMemory(memory: JagMemory): JagMemory {
  store().memories.set(key(memory.organizationId, memory.id), memory);
  return memory;
}

export function getMemory(
  organizationId: string,
  memoryId: string
): JagMemory | null {
  return store().memories.get(key(organizationId, memoryId)) ?? null;
}

export function listMemoriesForOrganization(
  organizationId: string
): readonly JagMemory[] {
  return Object.freeze(
    [...store().memories.values()]
      .filter((m) => m.organizationId === organizationId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  );
}

export function appendMemoryTimeline(
  entry: MemoryTimelineEntry
): MemoryTimelineEntry {
  store().timeline.push(entry);
  return entry;
}

export function listMemoryTimeline(
  organizationId: string,
  memoryId?: string
): readonly MemoryTimelineEntry[] {
  return Object.freeze(
    store()
      .timeline.filter(
        (e) =>
          e.organizationId === organizationId &&
          (memoryId == null || e.memoryId === memoryId)
      )
      .sort((a, b) => b.at.localeCompare(a.at))
  );
}
