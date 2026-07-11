/**
 * JAG Intelligence — memory lifecycle (Sprint 009).
 *
 * create / update / archive / delete / expire for persistent memory records.
 * Persistence is delegated to {@link IntelligenceMemoryStore}.
 */

import type { IntelligenceMemoryStore } from "@/lib/platform/intelligence/memory/store";
import {
  DEFAULT_MEMORY_CONFIDENCE,
  type CreateIntelligenceMemoryInput,
  type IntelligencePersistentMemoryRecord,
  type UpdateIntelligenceMemoryInput,
} from "@/lib/platform/intelligence/memory/types";

/** Dependencies for {@link IntelligenceMemoryLifecycle}. */
export interface IntelligenceMemoryLifecycleDependencies {
  store: IntelligenceMemoryStore;
  /** Optional clock for tests. */
  now?: () => Date;
  /** Optional id generator for tests. */
  createId?: () => string;
}

function defaultId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `mem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Lifecycle operations for persistent intelligence memory.
 */
export class IntelligenceMemoryLifecycle {
  private readonly store: IntelligenceMemoryStore;
  private readonly now: () => Date;
  private readonly createId: () => string;

  constructor(dependencies: IntelligenceMemoryLifecycleDependencies) {
    this.store = dependencies.store;
    this.now = dependencies.now ?? (() => new Date());
    this.createId = dependencies.createId ?? defaultId;
  }

  /** Create an in-memory record (not yet persisted). */
  create(input: CreateIntelligenceMemoryInput): IntelligencePersistentMemoryRecord {
    const timestamp = input.timestamp ?? this.now().toISOString();
    return {
      id: input.id ?? this.createId(),
      timestamp,
      domain: input.domain,
      request: { ...(input.request ?? {}) },
      contextSnapshot: { ...(input.contextSnapshot ?? {}) },
      observations: Object.freeze([...(input.observations ?? [])]),
      evidence: Object.freeze([...(input.evidence ?? [])]),
      assumptions: Object.freeze([...(input.assumptions ?? [])]),
      recommendations: Object.freeze([...(input.recommendations ?? [])]),
      confidence: input.confidence ?? { ...DEFAULT_MEMORY_CONFIDENCE, factors: [] },
      metadata: { ...(input.metadata ?? {}) },
      executionId: input.executionId,
      organizationId: input.organizationId ?? null,
      schoolId: input.schoolId ?? null,
      status: "active",
      updatedAt: timestamp,
      expiresAt: input.expiresAt ?? null,
    };
  }

  /** Persist a newly created or mutated record. */
  async save(
    record: IntelligencePersistentMemoryRecord
  ): Promise<IntelligencePersistentMemoryRecord> {
    return this.store.save(record);
  }

  /** Load a record by id. */
  async load(id: string): Promise<IntelligencePersistentMemoryRecord | null> {
    return this.store.load(id);
  }

  /** Update fields on an existing record and persist. */
  async update(
    id: string,
    patch: UpdateIntelligenceMemoryInput
  ): Promise<IntelligencePersistentMemoryRecord> {
    const existing = await this.store.load(id);
    if (!existing) {
      throw new Error(`Intelligence memory not found: ${id}`);
    }
    if (existing.status === "deleted") {
      throw new Error(`Intelligence memory is deleted and cannot be updated: ${id}`);
    }

    const updatedAt = this.now().toISOString();
    const next: IntelligencePersistentMemoryRecord = {
      ...existing,
      observations:
        patch.observations !== undefined
          ? Object.freeze([...patch.observations])
          : existing.observations,
      evidence:
        patch.evidence !== undefined
          ? Object.freeze([...patch.evidence])
          : existing.evidence,
      assumptions:
        patch.assumptions !== undefined
          ? Object.freeze([...patch.assumptions])
          : existing.assumptions,
      recommendations:
        patch.recommendations !== undefined
          ? Object.freeze([...patch.recommendations])
          : existing.recommendations,
      confidence: patch.confidence ?? existing.confidence,
      metadata: patch.metadata !== undefined ? { ...patch.metadata } : existing.metadata,
      contextSnapshot:
        patch.contextSnapshot !== undefined
          ? { ...patch.contextSnapshot }
          : existing.contextSnapshot,
      request: patch.request !== undefined ? { ...patch.request } : existing.request,
      expiresAt: patch.expiresAt !== undefined ? patch.expiresAt : existing.expiresAt,
      status: patch.status ?? existing.status,
      updatedAt,
    };

    return this.store.save(next);
  }

  /** Soft-archive a memory (status → archived). */
  async archive(id: string): Promise<IntelligencePersistentMemoryRecord> {
    return this.update(id, { status: "archived" });
  }

  /**
   * Soft-delete a memory (status → deleted) and optionally hard-delete.
   * Default: soft-delete only.
   */
  async delete(
    id: string,
    options: { hard?: boolean } = {}
  ): Promise<boolean> {
    if (options.hard) {
      return this.store.remove(id);
    }
    const existing = await this.store.load(id);
    if (!existing) {
      return false;
    }
    await this.update(id, { status: "deleted" });
    return true;
  }

  /**
   * Mark a single memory as expired, or expire all active memories
   * whose `expiresAt` is at or before `asOf`.
   */
  async expire(
    target: string | { asOf?: string }
  ): Promise<IntelligencePersistentMemoryRecord[]> {
    if (typeof target === "string") {
      const updated = await this.update(target, { status: "expired" });
      return [updated];
    }

    const asOf = target.asOf ?? this.now().toISOString();
    const candidates = await this.store.find({
      statuses: ["active"],
      includeDeleted: false,
    });

    const expired: IntelligencePersistentMemoryRecord[] = [];
    for (const record of candidates) {
      if (record.expiresAt && record.expiresAt <= asOf) {
        expired.push(await this.update(record.id, { status: "expired" }));
      }
    }
    return expired;
  }
}
