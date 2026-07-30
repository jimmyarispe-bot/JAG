/**
 * DependencyExplorer — related node ids with cycle protection — Sprint 208.
 */

import type { ExplanationSubject } from "./ExplainabilityRegistry";
import { recordExplainObservation } from "./ExplainabilityObservability";

const visitedGlobal = new Set<string>();

export function resetDependencyTraversalForTests(): void {
  visitedGlobal.clear();
}

export function exploreDependencies(
  subject: ExplanationSubject,
  options?: { readonly maxDepth?: number }
): {
  readonly relatedNodeIds: readonly string[];
  readonly relatedLabels: Readonly<Record<string, string>>;
} {
  const started = Date.now();
  const maxDepth = options?.maxDepth ?? 2;
  const related = new Map<string, string>();
  const stack: { id: string; label: string; depth: number }[] = [
    { id: subject.id, label: subject.title, depth: 0 },
  ];
  const localVisited = new Set<string>();

  const push = (
    id: string | undefined,
    label: string,
    depth: number
  ) => {
    if (!id || localVisited.has(id) || depth > maxDepth) return;
    if (visitedGlobal.has(id) && depth > 0) return;
    localVisited.add(id);
    related.set(id, label);
    stack.push({ id, label, depth });
  };

  while (stack.length > 0) {
    const cur = stack.pop()!;
    if (cur.depth >= maxDepth) continue;
    visitedGlobal.add(cur.id);

    for (const d of subject.decisions ?? []) {
      push(`decision:${d}`, d, cur.depth + 1);
    }
    for (const g of subject.goals ?? []) {
      push(`goal:${g}`, g, cur.depth + 1);
    }
    for (const f of subject.forecasts ?? []) {
      push(`forecast:${f}`, f, cur.depth + 1);
    }
    for (const s of subject.scenarios ?? []) {
      push(`scenario:${s}`, s, cur.depth + 1);
    }
    for (const m of subject.memory ?? []) {
      push(`memory:${m}`, m, cur.depth + 1);
    }
    for (const o of subject.outcomes ?? []) {
      push(`outcome:${o}`, o, cur.depth + 1);
    }
    for (const p of subject.policies ?? []) {
      push(`policy:${p}`, p, cur.depth + 1);
    }
    for (const c of subject.contributors ?? []) {
      push(`contributor:${c}`, c, cur.depth + 1);
    }
  }

  // Prevent unbounded growth across calls
  if (visitedGlobal.size > 500) {
    const keep = [...visitedGlobal].slice(0, 200);
    visitedGlobal.clear();
    for (const id of keep) visitedGlobal.add(id);
  }

  recordExplainObservation({
    kind: "dependency_resolution",
    organizationId: subject.organizationId,
    durationMs: Date.now() - started,
    detail: `Resolved ${related.size} related node(s) for ${subject.id}`,
    subjectId: subject.id,
  });

  return {
    relatedNodeIds: [...related.keys()],
    relatedLabels: Object.fromEntries(related),
  };
}
