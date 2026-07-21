/**
 * Executive Memory Intelligence — Sprint 063 / 0.1.0
 *
 * Structured, queryable memory of organizational reasoning.
 * Soft-reads briefing lights. Hard DAG predecessor: briefing.
 *
 * Path is `executive-memory` (not `memory/`) — Sprint 009 persistent
 * intelligence memory at `intelligence/memory` remains frozen.
 */

export * from "@/lib/platform/intelligence/executive-memory/types";
export * from "@/lib/platform/intelligence/executive-memory/registry";
export * from "@/lib/platform/intelligence/executive-memory/entities";
export * from "@/lib/platform/intelligence/executive-memory/graph/memory-graph";
export * from "@/lib/platform/intelligence/executive-memory/graph/relationships";
export * from "@/lib/platform/intelligence/executive-memory/graph/indexing";
export * from "@/lib/platform/intelligence/executive-memory/retrieval";
export * from "@/lib/platform/intelligence/executive-memory/retention/policies";
export * from "@/lib/platform/intelligence/executive-memory/engine/retrieval-engine";
export * from "@/lib/platform/intelligence/executive-memory/engine/memory-engine";
export * from "@/lib/platform/intelligence/executive-memory/engine/memory-service";

import { ExecutiveMemoryEngine } from "@/lib/platform/intelligence/executive-memory/engine/memory-engine";
import {
  ExecutiveMemoryIntelligenceService,
  type MemoryServiceDependencies,
} from "@/lib/platform/intelligence/executive-memory/engine/memory-service";

export interface ExecutiveMemoryStack {
  service: ExecutiveMemoryIntelligenceService;
  engine: ExecutiveMemoryEngine;
}

export interface CreateExecutiveMemoryOptions extends MemoryServiceDependencies {}

export function createExecutiveMemoryIntelligence(
  options: CreateExecutiveMemoryOptions = {}
): ExecutiveMemoryStack {
  const engine = options.engine ?? new ExecutiveMemoryEngine(options);
  const service = new ExecutiveMemoryIntelligenceService({ ...options, engine });
  return { service, engine };
}
