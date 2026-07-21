/**
 * Sprint 063 — in-memory relationship graph (no duplicate entities).
 */

import { MemoryIndex } from "@/lib/platform/intelligence/executive-memory/graph/indexing";
import type {
  MemoryEntity,
  MemoryRelationship,
  RiskMemory,
} from "@/lib/platform/intelligence/executive-memory/types";

export class MemoryGraph {
  readonly index = new MemoryIndex();
  private readonly relationships = new Map<string, MemoryRelationship>();

  upsertEntity(entity: MemoryEntity): MemoryEntity {
    // Risk recurrence by title (before source-fingerprint merge)
    if (entity.kind === "risk") {
      const risk = entity as RiskMemory;
      const prior = this.index
        .all()
        .find(
          (e): e is RiskMemory =>
            e.kind === "risk" &&
            e.title.toLowerCase() === risk.title.toLowerCase() &&
            e.scope.organizationId === risk.scope.organizationId
        );
      if (prior) {
        const updated: RiskMemory = {
          ...prior,
          lastSeenAt: risk.lastSeenAt,
          updatedAt: risk.updatedAt,
          recurrenceCount: prior.recurrenceCount + 1,
          severity: Math.max(prior.severity, risk.severity),
          urgency: Math.max(prior.urgency, risk.urgency),
          status: risk.status === "resolved" ? "resolved" : prior.status,
          summary: risk.summary,
          sourceIds: [...new Set([...prior.sourceIds, ...risk.sourceIds])],
          tags: [...new Set([...prior.tags, ...risk.tags])],
          domains: [...new Set([...prior.domains, ...risk.domains])],
        };
        this.index.upsert(updated);
        return updated;
      }
    }

    // Deduplicate by source fingerprint + kind
    const existing = this.index.findBySourceFingerprint(entity.sourceIds, entity.kind);
    if (existing && entity.sourceIds.length) {
      const merged = mergeEntities(existing, entity);
      this.index.upsert(merged);
      return merged;
    }

    this.index.upsert(entity);
    return entity;
  }

  addRelationship(rel: MemoryRelationship): MemoryRelationship {
    const key = `${rel.fromId}|${rel.kind}|${rel.toId}`;
    const existing = [...this.relationships.values()].find(
      (r) => `${r.fromId}|${r.kind}|${r.toId}` === key
    );
    if (existing) return existing;
    this.relationships.set(rel.id, rel);
    return rel;
  }

  listEntities(): MemoryEntity[] {
    return this.index.all();
  }

  listRelationships(): MemoryRelationship[] {
    return [...this.relationships.values()];
  }

  neighbors(entityId: string): { entity: MemoryEntity; via: MemoryRelationship }[] {
    const out: { entity: MemoryEntity; via: MemoryRelationship }[] = [];
    for (const rel of this.relationships.values()) {
      if (rel.fromId === entityId) {
        const entity = this.index.get(rel.toId);
        if (entity) out.push({ entity, via: rel });
      } else if (rel.toId === entityId) {
        const entity = this.index.get(rel.fromId);
        if (entity) out.push({ entity, via: rel });
      }
    }
    return out;
  }

  traverse(startId: string, maxDepth = 3): MemoryEntity[] {
    const seen = new Set<string>();
    const queue: Array<{ id: string; depth: number }> = [{ id: startId, depth: 0 }];
    const result: MemoryEntity[] = [];

    while (queue.length) {
      const { id, depth } = queue.shift()!;
      if (seen.has(id) || depth > maxDepth) continue;
      seen.add(id);
      const entity = this.index.get(id);
      if (entity) result.push(entity);
      if (depth === maxDepth) continue;
      for (const n of this.neighbors(id)) {
        if (!seen.has(n.entity.id)) queue.push({ id: n.entity.id, depth: depth + 1 });
      }
    }
    return result;
  }
}

function mergeEntities(existing: MemoryEntity, incoming: MemoryEntity): MemoryEntity {
  return {
    ...existing,
    ...incoming,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: incoming.updatedAt,
    tags: [...new Set([...existing.tags, ...incoming.tags])],
    domains: [...new Set([...existing.domains, ...incoming.domains])],
    sourceIds: [...new Set([...existing.sourceIds, ...incoming.sourceIds])],
    evidence: [...existing.evidence, ...incoming.evidence],
    confidence: Math.max(existing.confidence, incoming.confidence),
  } as MemoryEntity;
}
