/**
 * GoalTimeline — Created / Updated / Assigned / Progress changed / Completed / Archived.
 */

import { randomUUID } from "node:crypto";
import {
  appendGoalTimeline,
  listGoalTimeline,
} from "@/lib/goals/store";
import type {
  GoalTimelineEntry,
  GoalTimelineKind,
} from "@/lib/goals/types";

export type GoalTimelineService = {
  record(input: {
    organizationId: string;
    goalId: string;
    kind: GoalTimelineKind;
    actor: string;
    message: string;
    metadata?: Record<string, string>;
    at?: string;
  }): GoalTimelineEntry;
  list(organizationId: string, goalId?: string): readonly GoalTimelineEntry[];
};

export function createGoalTimeline(): GoalTimelineService {
  return {
    record(input) {
      return appendGoalTimeline({
        id: randomUUID(),
        organizationId: input.organizationId,
        goalId: input.goalId,
        kind: input.kind,
        at: input.at ?? new Date().toISOString(),
        actor: input.actor,
        message: input.message,
        metadata: Object.freeze(input.metadata ?? {}),
      });
    },
    list: listGoalTimeline,
  };
}
