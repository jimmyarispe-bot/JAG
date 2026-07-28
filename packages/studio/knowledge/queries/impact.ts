/**
 * Knowledge Graph impact analysis — complete blast-radius reports.
 */

import { buildKnowledgeGraph } from "../graph/builder";
import type { KnowledgeNode } from "../nodes/types";
import {
  findDependents,
  findDocumentation,
  findNeighbors,
  findPERs,
  findTests,
} from "./engine";

export type KnowledgeImpactReport = {
  readonly targetId: string;
  readonly target: KnowledgeNode | null;
  readonly analyzedAt: string;
  readonly affectedApis: readonly KnowledgeNode[];
  readonly affectedProducts: readonly KnowledgeNode[];
  readonly affectedTests: readonly KnowledgeNode[];
  readonly affectedDocs: readonly KnowledgeNode[];
  readonly affectedPers: readonly KnowledgeNode[];
  readonly affectedReleases: readonly KnowledgeNode[];
  readonly affectedModules: readonly KnowledgeNode[];
  readonly affectedServices: readonly KnowledgeNode[];
  readonly summary: string;
};

function collectReachable(
  startId: string,
  root: string | undefined,
  maxDepth: number
): Set<string> {
  const g = buildKnowledgeGraph({ root });
  const seen = new Set<string>([startId]);
  let frontier = [startId];
  for (let d = 0; d < maxDepth && frontier.length; d++) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const n of findNeighbors(id, root, "both")) {
        if (!seen.has(n.node.id)) {
          seen.add(n.node.id);
          next.push(n.node.id);
        }
      }
      for (const dep of findDependents(id, root)) {
        if (!seen.has(dep.id)) {
          seen.add(dep.id);
          next.push(dep.id);
        }
      }
    }
    next.sort();
    frontier = next;
  }
  // ensure graph loaded
  void g;
  return seen;
}

export function analyzeKnowledgeImpact(input: {
  targetId: string;
  root?: string;
  maxDepth?: number;
}): KnowledgeImpactReport {
  const g = buildKnowledgeGraph({ root: input.root });
  const target =
    g.nodes.find((n) => n.id === input.targetId) ??
    g.nodes.find(
      (n) =>
        n.label.toLowerCase() === input.targetId.toLowerCase() ||
        n.id.endsWith(`:${input.targetId}`)
    ) ??
    null;

  const startId = target?.id ?? input.targetId;
  const reachable = collectReachable(startId, input.root, input.maxDepth ?? 3);
  const nodes = g.nodes.filter((n) => reachable.has(n.id));

  const affectedApis = nodes.filter((n) => n.kind === "api");
  const affectedProducts = nodes.filter((n) => n.kind === "product");
  const affectedTests = [
    ...nodes.filter((n) => n.kind === "test" || n.kind === "test_suite"),
    ...findTests(startId, input.root),
  ];
  const affectedDocs = [
    ...nodes.filter((n) => n.kind === "document"),
    ...findDocumentation(startId, input.root),
  ];
  const affectedPers = [
    ...nodes.filter((n) => n.kind === "per"),
    ...findPERs(startId, input.root),
  ];
  const affectedReleases = nodes.filter((n) => n.kind === "release");
  const affectedModules = nodes.filter((n) => n.kind === "module");
  const affectedServices = nodes.filter((n) => n.kind === "service");

  const uniq = (list: KnowledgeNode[]) =>
    Object.freeze(
      [...new Map(list.map((n) => [n.id, n])).values()].sort((a, b) =>
        a.id.localeCompare(b.id)
      )
    );

  const apis = uniq(affectedApis);
  const products = uniq(affectedProducts);
  const tests = uniq(affectedTests);
  const docs = uniq(affectedDocs);
  const pers = uniq(affectedPers);
  const releases = uniq(affectedReleases);

  return {
    targetId: startId,
    target,
    analyzedAt: new Date().toISOString(),
    affectedApis: apis,
    affectedProducts: products,
    affectedTests: tests,
    affectedDocs: docs,
    affectedPers: pers,
    affectedReleases: releases,
    affectedModules: uniq(affectedModules),
    affectedServices: uniq(affectedServices),
    summary: `Impact of ${startId}: ${apis.length} API(s), ${products.length} product(s), ${tests.length} test(s), ${docs.length} doc(s), ${pers.length} PER(s), ${releases.length} release(s).`,
  };
}

export function createKnowledgeImpactService() {
  return {
    analyze: analyzeKnowledgeImpact,
  };
}
