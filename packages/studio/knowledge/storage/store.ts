/**
 * In-process Knowledge Graph storage — Studio-local persistence.
 */

import type { KnowledgeGraph } from "../graph/types";

const g = globalThis as typeof globalThis & {
  __jagStudioKnowledgeGraph?: KnowledgeGraph | null;
};

export function getKnowledgeGraph(): KnowledgeGraph | null {
  return g.__jagStudioKnowledgeGraph ?? null;
}

export function setKnowledgeGraph(graph: KnowledgeGraph): KnowledgeGraph {
  g.__jagStudioKnowledgeGraph = graph;
  return graph;
}

export function clearKnowledgeGraph(): void {
  g.__jagStudioKnowledgeGraph = null;
}
