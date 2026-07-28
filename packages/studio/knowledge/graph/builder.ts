/**
 * buildKnowledgeGraph() — unified Knowledge Graph from Studio evidence.
 */

import { hashGraphVersion, ingestKnowledgeSources } from "../ingestion/sources";
import type { KnowledgeNodeKind } from "../nodes/types";
import type { KnowledgeEdgeKind } from "../edges/types";
import { getKnowledgeGraph, setKnowledgeGraph } from "../storage/store";
import type { KnowledgeGraph } from "./types";
import { KNOWLEDGE_NODE_KINDS } from "../nodes/types";

function emptyCounts(): Record<KnowledgeNodeKind, number> {
  const out = {} as Record<KnowledgeNodeKind, number>;
  for (const k of KNOWLEDGE_NODE_KINDS) out[k] = 0;
  return out;
}

export function buildKnowledgeGraph(input?: {
  root?: string;
  force?: boolean;
}): KnowledgeGraph {
  const root = input?.root ?? process.cwd();
  const existing = getKnowledgeGraph();
  if (
    existing &&
    existing.root === root &&
    !input?.force
  ) {
    return existing;
  }

  const ingested = ingestKnowledgeSources({
    root,
    force: input?.force,
  });

  const countsByKind = emptyCounts();
  for (const n of ingested.nodes) countsByKind[n.kind] += 1;

  const edgeCountsByKind: Partial<Record<KnowledgeEdgeKind, number>> = {};
  for (const e of ingested.edges) {
    edgeCountsByKind[e.kind] = (edgeCountsByKind[e.kind] ?? 0) + 1;
  }

  const graph: KnowledgeGraph = {
    root: ingested.root,
    builtAt: new Date().toISOString(),
    version: hashGraphVersion(
      ingested.nodes.length,
      ingested.edges.length,
      ingested.catalogVersion
    ),
    catalogVersion: ingested.catalogVersion,
    nodes: Object.freeze(
      [...ingested.nodes].sort((a, b) => a.id.localeCompare(b.id))
    ),
    edges: Object.freeze(
      [...ingested.edges].sort((a, b) => a.id.localeCompare(b.id))
    ),
    countsByKind: Object.freeze(countsByKind),
    edgeCountsByKind: Object.freeze(edgeCountsByKind),
  };

  return setKnowledgeGraph(graph);
}

export function createKnowledgeGraphService() {
  return {
    build: buildKnowledgeGraph,
    get: getKnowledgeGraph,
    ensure(root?: string) {
      return getKnowledgeGraph() ?? buildKnowledgeGraph({ root });
    },
  };
}
