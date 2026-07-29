/**
 * Contributor dependency graph for plan ordering / validation.
 */

import type { EducationGraphNodeKind } from "../graph";

export interface EducationDependencyEdge {
  /** Prerequisite contributor id. */
  from: string;
  /** Dependent contributor id. */
  to: string;
  /** Semantic dependency kind. */
  kind: "requires" | "prefers";
  rationale?: string;
}

export interface EducationContributorDescriptor {
  contributorId: string;
  nodeKind: EducationGraphNodeKind;
  capabilities: readonly string[];
  /** Contributor ids this one depends on. */
  dependsOn: readonly string[];
  expectedOutputs: readonly string[];
  /** Intent ids / substrings this contributor can serve. */
  intentMatchers: readonly string[];
  /** True when contributor is registered/available in the host pack. */
  available: boolean;
  label?: string;
}

export function buildDependencyEdges(
  descriptors: readonly EducationContributorDescriptor[]
): EducationDependencyEdge[] {
  const known = new Set(descriptors.map((d) => d.contributorId));
  const edges: EducationDependencyEdge[] = [];
  for (const d of descriptors) {
    for (const dep of d.dependsOn) {
      edges.push({
        from: dep,
        to: d.contributorId,
        kind: "requires",
        rationale: known.has(dep)
          ? `${d.contributorId} depends on ${dep}`
          : `${d.contributorId} depends on missing ${dep}`,
      });
    }
  }
  return edges;
}

/**
 * Topological stages for included contributor ids.
 * Throws if a cycle is detected among included nodes.
 */
export function orderContributorsByDependencies(
  includedIds: readonly string[],
  edges: readonly EducationDependencyEdge[]
): {
  ordered: string[];
  stages: Array<{ stage: number; contributorIds: string[] }>;
} {
  const included = new Set(includedIds);
  const indegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const id of includedIds) {
    indegree.set(id, 0);
    adjacency.set(id, []);
  }

  for (const edge of edges) {
    if (!included.has(edge.from) || !included.has(edge.to)) continue;
    adjacency.get(edge.from)!.push(edge.to);
    indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1);
  }

  const stages: Array<{ stage: number; contributorIds: string[] }> = [];
  const remaining = new Set(includedIds);
  let stage = 0;

  while (remaining.size > 0) {
    const ready = [...remaining]
      .filter((id) => (indegree.get(id) ?? 0) === 0)
      .sort();
    if (ready.length === 0) {
      throw new Error(
        `Dependency cycle detected among: ${[...remaining].join(", ")}`
      );
    }
    stages.push({ stage, contributorIds: ready });
    for (const id of ready) {
      remaining.delete(id);
      for (const next of adjacency.get(id) ?? []) {
        indegree.set(next, (indegree.get(next) ?? 0) - 1);
      }
    }
    stage += 1;
  }

  return { ordered: stages.flatMap((s) => s.contributorIds), stages };
}
