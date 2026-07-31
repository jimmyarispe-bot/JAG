/**
 * MemoryService — create / validate / publish / archive organizational memories.
 */

import { randomUUID } from "node:crypto";
import { emitJagPlatformEvent } from "@/lib/jag-platform/events";
import { createMemoryClassification } from "@/lib/memory/classification";
import { createMemoryMetrics } from "@/lib/memory/metrics";
import {
  getMemory,
  listMemoriesForOrganization,
  upsertMemory,
} from "@/lib/memory/store";
import { createMemoryTimeline } from "@/lib/memory/timeline";
import { createMemoryTwinService } from "@/lib/memory/twin";
import type {
  CreateMemoryInput,
  JagMemory,
  MemoryDashboard,
  MemoryStatus,
  OrganizationalKnowledgeSummary,
  PatchMemoryInput,
} from "@/lib/memory/types";
import { createMemoryValidation } from "@/lib/memory/validation";

function countLinks(memory: JagMemory): number {
  let n = 0;
  if (memory.relatedDecisionId) n += 1;
  if (memory.relatedGoalId) n += 1;
  if (memory.relatedRiskId) n += 1;
  if (memory.relatedProjectId) n += 1;
  if (memory.relatedWorkItemId) n += 1;
  n += memory.relatedEvidenceIds.length;
  n += memory.relatedTwinEntityIds.length;
  n += memory.relatedPersonIds.length;
  n += memory.relatedOrganizationIds.length;
  return n;
}

export type MemoryService = {
  create(input: CreateMemoryInput): JagMemory | { error: string };
  get(organizationId: string, memoryId: string): JagMemory | null;
  list(organizationId: string): readonly JagMemory[];
  patch(input: PatchMemoryInput): JagMemory | { error: string } | null;
  validate(input: {
    organizationId: string;
    memoryId: string;
    actor: string;
  }): JagMemory | { error: string } | null;
  dashboard(organizationId: string): MemoryDashboard;
  summary(organizationId: string): OrganizationalKnowledgeSummary;
  canTransition(from: MemoryStatus, to: MemoryStatus): boolean;
};

export function createMemoryService(): MemoryService {
  const classification = createMemoryClassification();
  const validation = createMemoryValidation();
  const timeline = createMemoryTimeline();
  const twin = createMemoryTwinService();
  const metrics = createMemoryMetrics();

  const service: MemoryService = {
    canTransition: validation.canTransition,

    create(input) {
      const title = input.title.trim();
      const summary = input.summary.trim();
      if (!title) return { error: "Title is required." };
      if (!summary) return { error: "Summary is required." };

      const source = input.source ?? "Manual entry";
      if (!classification.isValidSource(source)) {
        return { error: "Invalid memory source." };
      }
      const category =
        input.category ?? classification.defaultCategoryForSource(source);
      if (!classification.isValidCategory(category)) {
        return { error: "Invalid memory category." };
      }

      const now = new Date().toISOString();
      const id = randomUUID();
      let memory: JagMemory = {
        id,
        organizationId: input.organizationId,
        title,
        summary,
        category,
        source,
        confidence: input.confidence ?? "manual",
        status: input.status ?? "Draft",
        owner: input.owner ?? null,
        relatedDecisionId: input.relatedDecisionId ?? null,
        relatedGoalId: input.relatedGoalId ?? null,
        relatedRiskId: input.relatedRiskId ?? null,
        relatedProjectId: input.relatedProjectId ?? null,
        relatedWorkItemId: input.relatedWorkItemId ?? null,
        relatedEvidenceIds: Object.freeze([
          ...(input.relatedEvidenceIds ?? []),
        ]),
        relatedTwinEntityIds: Object.freeze([
          ...(input.relatedTwinEntityIds ?? []),
        ]),
        relatedPersonIds: Object.freeze([...(input.relatedPersonIds ?? [])]),
        relatedOrganizationIds: Object.freeze([
          ...(input.relatedOrganizationIds ?? []),
        ]),
        referenceCount: 0,
        twinEntityId: null,
        createdAt: now,
        updatedAt: now,
        lastReviewedAt: null,
        validatedAt: null,
        publishedAt: null,
        archivedAt: null,
        createdBy: input.createdBy,
      };
      memory = { ...memory, referenceCount: countLinks(memory) };

      upsertMemory(memory);
      const twinId = twin.ensureMemoryTwin(memory, input.createdBy);
      memory = { ...memory, twinEntityId: twinId };
      upsertMemory(memory);
      const linked = twin.syncMemoryLinks(memory, input.createdBy);

      timeline.record({
        organizationId: input.organizationId,
        memoryId: id,
        kind: "created",
        actor: input.createdBy,
        message: `Memory created (${memory.category} · ${memory.source}).`,
        metadata: { status: memory.status },
      });
      if (linked > 0) {
        timeline.record({
          organizationId: input.organizationId,
          memoryId: id,
          kind: "linked",
          actor: input.createdBy,
          message: `Linked to ${linked} twin relationship(s).`,
          metadata: { linked: String(linked) },
        });
      }

      emitJagPlatformEvent({
        organizationId: input.organizationId,
        sourceModule: "memory",
        entityType: "JagMemory",
        entityId: id,
        eventType: "memory.created",
        actor: input.createdBy,
        metadata: {
          category: memory.category,
          source: memory.source,
          status: memory.status,
          twinEntityId: memory.twinEntityId ?? "",
        },
      });

      return memory;
    },

    get: getMemory,
    list: listMemoriesForOrganization,

    patch(input) {
      const current = getMemory(input.organizationId, input.memoryId);
      if (!current) return null;

      if (input.status && !service.canTransition(current.status, input.status)) {
        return {
          error: `Cannot transition from ${current.status} to ${input.status}.`,
        };
      }

      if (input.status === "Published") {
        const pubErr = validation.validateForPublish({
          title: input.title ?? current.title,
          summary: input.summary ?? current.summary,
          owner:
            input.owner !== undefined ? input.owner : current.owner,
        });
        if (pubErr) return { error: pubErr };
      }

      if (
        input.status === "Validated" &&
        validation.requiresOwner(input.status)
      ) {
        const owner =
          input.owner !== undefined ? input.owner : current.owner;
        if (!owner?.trim()) {
          return { error: "Owner is required to validate." };
        }
      }

      const now = new Date().toISOString();
      let next: JagMemory = {
        ...current,
        title: input.title?.trim() ?? current.title,
        summary: input.summary?.trim() ?? current.summary,
        category: input.category ?? current.category,
        source: input.source ?? current.source,
        confidence: input.confidence ?? current.confidence,
        status: input.status ?? current.status,
        owner: input.owner !== undefined ? input.owner : current.owner,
        relatedDecisionId:
          input.relatedDecisionId !== undefined
            ? input.relatedDecisionId
            : current.relatedDecisionId,
        relatedGoalId:
          input.relatedGoalId !== undefined
            ? input.relatedGoalId
            : current.relatedGoalId,
        relatedRiskId:
          input.relatedRiskId !== undefined
            ? input.relatedRiskId
            : current.relatedRiskId,
        relatedProjectId:
          input.relatedProjectId !== undefined
            ? input.relatedProjectId
            : current.relatedProjectId,
        relatedWorkItemId:
          input.relatedWorkItemId !== undefined
            ? input.relatedWorkItemId
            : current.relatedWorkItemId,
        relatedEvidenceIds:
          input.relatedEvidenceIds !== undefined
            ? Object.freeze([...input.relatedEvidenceIds])
            : current.relatedEvidenceIds,
        relatedTwinEntityIds:
          input.relatedTwinEntityIds !== undefined
            ? Object.freeze([...input.relatedTwinEntityIds])
            : current.relatedTwinEntityIds,
        relatedPersonIds:
          input.relatedPersonIds !== undefined
            ? Object.freeze([...input.relatedPersonIds])
            : current.relatedPersonIds,
        relatedOrganizationIds:
          input.relatedOrganizationIds !== undefined
            ? Object.freeze([...input.relatedOrganizationIds])
            : current.relatedOrganizationIds,
        updatedAt: now,
        lastReviewedAt: input.reviewed
          ? now
          : current.lastReviewedAt,
        validatedAt:
          input.status === "Validated" ? now : current.validatedAt,
        publishedAt:
          input.status === "Published" ? now : current.publishedAt,
        archivedAt:
          input.status === "Archived" ? now : current.archivedAt,
      };
      next = { ...next, referenceCount: countLinks(next) };

      const twinId = twin.ensureMemoryTwin(next, input.actor);
      next = { ...next, twinEntityId: twinId ?? next.twinEntityId };
      upsertMemory(next);
      const linked = twin.syncMemoryLinks(next, input.actor);

      if (input.status && input.status !== current.status) {
        const kind =
          input.status === "Validated"
            ? "validated"
            : input.status === "Published"
              ? "published"
              : input.status === "Archived"
                ? "archived"
                : "status_changed";
        timeline.record({
          organizationId: input.organizationId,
          memoryId: next.id,
          kind,
          actor: input.actor,
          message: `Status ${current.status} → ${input.status}.`,
          metadata: { from: current.status, to: input.status },
        });
        emitJagPlatformEvent({
          organizationId: input.organizationId,
          sourceModule: "memory",
          entityType: "JagMemory",
          entityId: next.id,
          eventType: "memory.status_changed",
          actor: input.actor,
          metadata: { from: current.status, to: input.status },
        });
      } else {
        timeline.record({
          organizationId: input.organizationId,
          memoryId: next.id,
          kind: "updated",
          actor: input.actor,
          message: "Memory updated.",
        });
      }

      if (input.reviewed) {
        timeline.record({
          organizationId: input.organizationId,
          memoryId: next.id,
          kind: "reviewed",
          actor: input.actor,
          message: "Memory reviewed.",
        });
      }

      if (linked > 0) {
        timeline.record({
          organizationId: input.organizationId,
          memoryId: next.id,
          kind: "linked",
          actor: input.actor,
          message: `Synced ${linked} twin relationship(s).`,
          metadata: { linked: String(linked) },
        });
      }

      return next;
    },

    validate(input) {
      return service.patch({
        organizationId: input.organizationId,
        memoryId: input.memoryId,
        actor: input.actor,
        status: "Validated",
      });
    },

    dashboard: (organizationId) => metrics.dashboard(organizationId),
    summary: (organizationId) => metrics.summarize(organizationId),
  };

  return service;
}

let singleton: MemoryService | null = null;

export function getMemoryService(): MemoryService {
  if (!singleton) singleton = createMemoryService();
  return singleton;
}

export function resetMemoryServiceForTests(): void {
  singleton = null;
}
