/**
 * Memory ↔ Digital Twin™ integration (documents / explains / resulted_from / supports / references).
 */

import { createTwinRegistry } from "@/lib/digital-twin/registry";
import { createTwinRelationshipService } from "@/lib/digital-twin/relationships";
import type { JagMemory } from "@/lib/memory/types";

export type MemoryTwinService = {
  ensureMemoryTwin(memory: JagMemory, actor: string): string | null;
  syncMemoryLinks(memory: JagMemory, actor: string): number;
};

export function createMemoryTwinService(): MemoryTwinService {
  const registry = createTwinRegistry();
  const relationships = createTwinRelationshipService();

  return {
    ensureMemoryTwin(memory, actor) {
      const result = registry.register({
        organizationId: memory.organizationId,
        entityType: "Document",
        label: memory.title,
        description: memory.summary,
        externalKey: `memory:${memory.id}`,
        metadata: {
          memoryId: memory.id,
          category: memory.category,
          source: memory.source,
          status: memory.status,
          confidence: memory.confidence,
          kind: "organizational_memory",
        },
        createdBy: actor,
      });
      if ("error" in result) return memory.twinEntityId;
      return result.id;
    },

    syncMemoryLinks(memory, actor) {
      if (!memory.twinEntityId) return 0;
      let linked = 0;

      if (memory.owner) {
        const person = registry.findByKey(
          memory.organizationId,
          "Person",
          `person:${memory.owner}`
        );
        if (person) {
          const rel = relationships.connect({
            organizationId: memory.organizationId,
            fromTwinId: memory.twinEntityId,
            toTwinId: person.id,
            relationshipType: "owned_by",
            actor,
          });
          if (!("error" in rel)) linked += 1;
        }
      }

      if (memory.relatedDecisionId) {
        const decision = registry.findByKey(
          memory.organizationId,
          "Decision",
          `decision:${memory.relatedDecisionId}`
        );
        if (decision) {
          const rel = relationships.connect({
            organizationId: memory.organizationId,
            fromTwinId: memory.twinEntityId,
            toTwinId: decision.id,
            relationshipType: "resulted_from",
            actor,
          });
          if (!("error" in rel)) linked += 1;
          const docs = relationships.connect({
            organizationId: memory.organizationId,
            fromTwinId: memory.twinEntityId,
            toTwinId: decision.id,
            relationshipType: "documents",
            actor,
          });
          if (!("error" in docs)) linked += 1;
        }
      }

      if (memory.relatedGoalId) {
        const goal = registry.findByKey(
          memory.organizationId,
          "Goal",
          `goal:${memory.relatedGoalId}`
        );
        if (goal) {
          const rel = relationships.connect({
            organizationId: memory.organizationId,
            fromTwinId: memory.twinEntityId,
            toTwinId: goal.id,
            relationshipType: "supports",
            actor,
          });
          if (!("error" in rel)) linked += 1;
          const explains = relationships.connect({
            organizationId: memory.organizationId,
            fromTwinId: memory.twinEntityId,
            toTwinId: goal.id,
            relationshipType: "explains",
            actor,
          });
          if (!("error" in explains)) linked += 1;
        }
      }

      if (memory.relatedRiskId) {
        const risk = registry.findByKey(
          memory.organizationId,
          "Risk",
          `risk:${memory.relatedRiskId}`
        );
        if (risk) {
          const rel = relationships.connect({
            organizationId: memory.organizationId,
            fromTwinId: memory.twinEntityId,
            toTwinId: risk.id,
            relationshipType: "explains",
            actor,
          });
          if (!("error" in rel)) linked += 1;
        }
      }

      if (memory.relatedProjectId) {
        const project = registry.findByKey(
          memory.organizationId,
          "Project",
          `project:${memory.relatedProjectId}`
        );
        if (project) {
          const rel = relationships.connect({
            organizationId: memory.organizationId,
            fromTwinId: memory.twinEntityId,
            toTwinId: project.id,
            relationshipType: "documents",
            actor,
          });
          if (!("error" in rel)) linked += 1;
        }
      }

      if (memory.relatedWorkItemId) {
        const work = registry.findByKey(
          memory.organizationId,
          "Task",
          `work:${memory.relatedWorkItemId}`
        );
        if (work) {
          const rel = relationships.connect({
            organizationId: memory.organizationId,
            fromTwinId: memory.twinEntityId,
            toTwinId: work.id,
            relationshipType: "resulted_from",
            actor,
          });
          if (!("error" in rel)) linked += 1;
        }
      }

      for (const evidenceId of memory.relatedEvidenceIds) {
        const doc = registry.findByKey(
          memory.organizationId,
          "Document",
          `evidence:${evidenceId}`
        );
        if (!doc) continue;
        const rel = relationships.connect({
          organizationId: memory.organizationId,
          fromTwinId: memory.twinEntityId,
          toTwinId: doc.id,
          relationshipType: "references",
          actor,
        });
        if (!("error" in rel)) linked += 1;
      }

      for (const twinId of memory.relatedTwinEntityIds) {
        const rel = relationships.connect({
          organizationId: memory.organizationId,
          fromTwinId: memory.twinEntityId,
          toTwinId: twinId,
          relationshipType: "references",
          actor,
        });
        if (!("error" in rel)) linked += 1;
      }

      for (const personId of memory.relatedPersonIds) {
        const person = registry.findByKey(
          memory.organizationId,
          "Person",
          `person:${personId}`
        );
        if (!person) continue;
        const rel = relationships.connect({
          organizationId: memory.organizationId,
          fromTwinId: memory.twinEntityId,
          toTwinId: person.id,
          relationshipType: "references",
          actor,
        });
        if (!("error" in rel)) linked += 1;
      }

      for (const orgId of memory.relatedOrganizationIds) {
        const orgTwin = registry.findByKey(
          memory.organizationId,
          "Organization",
          orgId
        );
        if (!orgTwin) continue;
        const rel = relationships.connect({
          organizationId: memory.organizationId,
          fromTwinId: memory.twinEntityId,
          toTwinId: orgTwin.id,
          relationshipType: "references",
          actor,
        });
        if (!("error" in rel)) linked += 1;
      }

      return linked;
    },
  };
}
