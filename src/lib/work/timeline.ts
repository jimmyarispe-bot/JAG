import { randomUUID } from "node:crypto";
import { appendWorkTimeline, listWorkTimeline } from "@/lib/work/store";
import type { WorkTimelineEntry, WorkTimelineKind } from "@/lib/work/types";

export type ExecutionTimelineService = {
  record(input: {
    organizationId: string;
    entityType: WorkTimelineEntry["entityType"];
    entityId: string;
    kind: WorkTimelineKind;
    actor: string;
    message: string;
    metadata?: Record<string, string>;
  }): WorkTimelineEntry;
  list(organizationId: string, entityId?: string): readonly WorkTimelineEntry[];
};

export function createExecutionTimeline(): ExecutionTimelineService {
  return {
    record(input) {
      return appendWorkTimeline({
        id: randomUUID(),
        organizationId: input.organizationId,
        entityType: input.entityType,
        entityId: input.entityId,
        kind: input.kind,
        at: new Date().toISOString(),
        actor: input.actor,
        message: input.message,
        metadata: Object.freeze(input.metadata ?? {}),
      });
    },
    list: listWorkTimeline,
  };
}
