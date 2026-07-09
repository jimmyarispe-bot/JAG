import type { JagWorkItem, JagWorkQueue } from "@/lib/platform/jag-work/types";
import type { JagWorkPerspectiveDef } from "@/lib/platform/jag-work/perspectives";

function priorityRank(p: JagWorkItem["priority"]): number {
  return { critical: 0, high: 1, medium: 2, low: 3 }[p];
}

function sortItems(items: JagWorkItem[]): JagWorkItem[] {
  return [...items].sort((a, b) => {
    const pr = priorityRank(a.priority) - priorityRank(b.priority);
    if (pr !== 0) return pr;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return a.title.localeCompare(b.title);
  });
}

export function buildJagWorkQueue(
  workspaceKey: string,
  perspectiveCatalog: JagWorkPerspectiveDef[],
  allItems: JagWorkItem[],
  activePerspective?: string
): JagWorkQueue {
  const perspectiveIds = perspectiveCatalog.map((p) => p.id);
  const resolvedPerspective =
    activePerspective && perspectiveIds.includes(activePerspective)
      ? activePerspective
      : perspectiveIds[0] ?? "today";

  const perspectives = Object.fromEntries(
    perspectiveIds.map((id) => [id, [] as JagWorkItem[]])
  ) as Record<string, JagWorkItem[]>;

  for (const item of allItems) {
    for (const perspective of item.perspectives) {
      if (perspectives[perspective]) {
        perspectives[perspective].push(item);
      }
    }
  }

  for (const id of perspectiveIds) {
    perspectives[id] = sortItems(perspectives[id]);
  }

  const counts = Object.fromEntries(
    perspectiveIds.map((id) => [id, perspectives[id].length])
  ) as Record<string, number>;

  return {
    workspaceKey,
    resolvedAt: new Date().toISOString(),
    activePerspective: resolvedPerspective,
    perspectiveCatalog,
    perspectives,
    allItems: sortItems(allItems),
    counts,
  };
}
