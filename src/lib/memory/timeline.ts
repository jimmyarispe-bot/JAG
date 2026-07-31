import { randomUUID } from "node:crypto";
import { appendMemoryTimeline, listMemoryTimeline } from "@/lib/memory/store";
import type {
  MemoryTimelineEntry,
  MemoryTimelineKind,
} from "@/lib/memory/types";

export type MemoryTimelineService = {
  record(input: {
    organizationId: string;
    memoryId: string;
    kind: MemoryTimelineKind;
    actor: string;
    message: string;
    metadata?: Record<string, string>;
  }): MemoryTimelineEntry;
  list(organizationId: string, memoryId?: string): readonly MemoryTimelineEntry[];
};

/** MemoryTimeline — lifecycle event log for Organizational Memory™. */
export function createMemoryTimeline(): MemoryTimelineService {
  return {
    record(input) {
      return appendMemoryTimeline({
        id: randomUUID(),
        organizationId: input.organizationId,
        memoryId: input.memoryId,
        kind: input.kind,
        at: new Date().toISOString(),
        actor: input.actor,
        message: input.message,
        metadata: Object.freeze(input.metadata ?? {}),
      });
    },
    list: listMemoryTimeline,
  };
}

/** MemoryHistory — read facade over the memory timeline. */
export function createMemoryHistory(): {
  list(
    organizationId: string,
    memoryId?: string
  ): readonly MemoryTimelineEntry[];
} {
  return {
    list: listMemoryTimeline,
  };
}
