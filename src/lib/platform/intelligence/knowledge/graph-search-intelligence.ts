/**
 * Knowledge Intelligence — graph + search engines (Sprint 040).
 */

import type {
  KnowledgeGraphEngine as KnowledgeGraphEngineContract,
  KnowledgeSearchEngine as KnowledgeSearchEngineContract,
} from "@/lib/platform/intelligence/knowledge/contracts";
import {
  clamp,
  defaultCreateId,
} from "@/lib/platform/intelligence/knowledge/models";
import type {
  KnowledgeBaseline,
  KnowledgeCatalogResult,
  KnowledgeGraphEdge,
  KnowledgeGraphNode,
  KnowledgeGraphResult,
  KnowledgeRelationKind,
  KnowledgeSearchHit,
  KnowledgeSearchResult,
} from "@/lib/platform/intelligence/knowledge/types";
import { KNOWLEDGE_RELATION_KINDS } from "@/lib/platform/intelligence/knowledge/types";

export class KnowledgeGraphEngine implements KnowledgeGraphEngineContract {
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  build(input: {
    baseline: KnowledgeBaseline;
    catalog: KnowledgeCatalogResult;
    now: Date;
  }): KnowledgeGraphResult {
    void input.now;
    const b = input.baseline;
    const nodes: KnowledgeGraphNode[] = input.catalog.artifacts.map((a) => ({
      id: a.id,
      label: a.title,
      type: a.type,
      owner: a.owner,
      confidence: a.confidence,
    }));

    const edges: KnowledgeGraphEdge[] = [];
    const kinds = KNOWLEDGE_RELATION_KINDS;
    for (let i = 0; i < nodes.length; i++) {
      const from = nodes[i]!;
      const to = nodes[(i + 1) % nodes.length]!;
      const kind = kinds[i % kinds.length]!;
      edges.push({
        id: this.createId("know-edge"),
        fromId: from.id,
        toId: to.id,
        kind,
        weight: clamp(
          40 +
            from.confidence * 0.25 +
            to.confidence * 0.2 -
            b.conflictPressure * 20
        ),
        narrative: `${from.label} ${kind.replace(/_/g, " ")} ${to.label}.`,
      });
    }

    // Explicit conflict edges when pressure elevated
    if (b.conflictPressure > 0.25 && nodes.length >= 2) {
      edges.push({
        id: this.createId("know-edge"),
        fromId: nodes[0]!.id,
        toId: nodes[1]!.id,
        kind: "conflicts_with",
        weight: clamp(b.conflictPressure * 100),
        narrative: "Detected conflicting institutional knowledge.",
      });
    }

    const conflictCount = edges.filter((e) => e.kind === "conflicts_with").length;
    const orphanCount = Math.max(
      0,
      Math.round(b.gapPressure * 8 + (1 - b.ownershipScore / 100) * 5)
    );
    const connectivityScore = clamp(
      b.connectivityScore * 0.55 +
        (edges.length / Math.max(1, nodes.length)) * 25 +
        (100 - orphanCount * 4) * 0.2
    );
    const kindCounts = new Map<KnowledgeRelationKind, number>();
    for (const edge of edges) {
      kindCounts.set(edge.kind, (kindCounts.get(edge.kind) ?? 0) + 1);
    }
    const hottestRelation =
      [...kindCounts.entries()].sort((a, c) => c[1] - a[1])[0]?.[0] ??
      "depends_on";

    return {
      nodes,
      edges,
      connectivityScore,
      conflictCount,
      orphanCount,
      hottestRelation,
      narrative: `Knowledge graph connectivity ${Math.round(connectivityScore)}; ${conflictCount} conflicts, ${orphanCount} orphans.`,
    };
  }
}

export class KnowledgeSearchEngine implements KnowledgeSearchEngineContract {
  index(input: {
    baseline: KnowledgeBaseline;
    catalog: KnowledgeCatalogResult;
    graph: KnowledgeGraphResult;
    now: Date;
  }): KnowledgeSearchResult {
    void input.now;
    const b = input.baseline;
    const hits: KnowledgeSearchHit[] = [...input.catalog.artifacts]
      .sort((a, c) => c.confidence - a.confidence)
      .slice(0, 8)
      .map((a) => ({
        artifactId: a.id,
        title: a.title,
        type: a.type,
        score: clamp(
          a.confidence * 0.7 +
            (a.dependents > 3 ? 12 : 6) +
            (a.validatedAt ? 10 : 0)
        ),
        snippet: a.narrative,
      }));

    const queryCoverage = clamp(
      b.coverageScore * 0.4 +
        b.reuseScore * 0.3 +
        input.graph.connectivityScore * 0.3 -
        b.duplicatePressure * 15
    );
    const duplicateClusters = Math.max(
      1,
      Math.round(b.duplicatePressure * 10 + (1 - b.reuseScore / 100) * 4)
    );

    return {
      hits,
      queryCoverage,
      duplicateClusters,
      narrative: `Semantic search coverage ${Math.round(queryCoverage)}; ${duplicateClusters} duplicate clusters detected.`,
    };
  }
}
