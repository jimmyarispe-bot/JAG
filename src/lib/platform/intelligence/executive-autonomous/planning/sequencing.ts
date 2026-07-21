/**
 * Task sequencing / duration estimation (Sprint 066).
 */

import type { PlanTask } from "@/lib/platform/intelligence/executive-autonomous/types";

export function sequenceTasks(
  tasks: Array<Omit<PlanTask, "id">>,
  createId: (prefix: string) => string
): PlanTask[] {
  const sequenced: PlanTask[] = [];
  let previousId: string | null = null;

  for (const task of tasks) {
    const id = createId("task");
    sequenced.push({
      ...task,
      id,
      dependsOn: previousId ? [previousId, ...task.dependsOn] : [...task.dependsOn],
    });
    previousId = id;
  }

  return sequenced;
}

export function estimateDurationDays(tasks: PlanTask[]): number {
  // Sequential critical path (dependsOn chain)
  return tasks.reduce((sum, t) => sum + t.estimatedDays, 0);
}
