/**
 * Work ↔ Digital Twin™ / Knowledge Graph™ integration.
 */

import { createTwinRegistry } from "@/lib/digital-twin/registry";
import { createTwinRelationshipService } from "@/lib/digital-twin/relationships";
import type { TwinRelationshipType } from "@/lib/digital-twin/types";
import {
  listDependenciesForOrganization,
} from "@/lib/work/store";
import type { JagMilestone, JagProject, JagWorkItem } from "@/lib/work/types";

export type WorkTwinService = {
  ensureWorkItemTwin(item: JagWorkItem, actor: string): string | null;
  ensureProjectTwin(project: JagProject, actor: string): string | null;
  ensureMilestoneTwin(milestone: JagMilestone, actor: string): string | null;
  syncWorkItemLinks(item: JagWorkItem, actor: string): number;
};

function connect(
  relationships: ReturnType<typeof createTwinRelationshipService>,
  organizationId: string,
  fromTwinId: string,
  toTwinId: string,
  relationshipType: TwinRelationshipType,
  actor: string
): boolean {
  const rel = relationships.connect({
    organizationId,
    fromTwinId,
    toTwinId,
    relationshipType,
    actor,
  });
  return !("error" in rel);
}

export function createWorkTwinService(): WorkTwinService {
  const registry = createTwinRegistry();
  const relationships = createTwinRelationshipService();

  return {
    ensureWorkItemTwin(item, actor) {
      const result = registry.register({
        organizationId: item.organizationId,
        entityType: "Task",
        label: item.title,
        description: item.description,
        externalKey: `work:${item.id}`,
        metadata: {
          workItemId: item.id,
          type: item.type,
          status: item.status,
          progressPercent: String(item.progressPercent),
        },
        createdBy: actor,
      });
      if ("error" in result) return item.twinEntityId;
      return result.id;
    },

    ensureProjectTwin(project, actor) {
      const result = registry.register({
        organizationId: project.organizationId,
        entityType: "Project",
        label: project.title,
        description: project.description,
        externalKey: `project:${project.id}`,
        metadata: {
          projectId: project.id,
          status: project.status,
          progressPercent: String(project.progressPercent),
        },
        createdBy: actor,
      });
      if ("error" in result) return project.twinEntityId;
      return result.id;
    },

    ensureMilestoneTwin(milestone, actor) {
      const result = registry.register({
        organizationId: milestone.organizationId,
        entityType: "Event",
        label: milestone.title,
        description: milestone.description,
        externalKey: `milestone:${milestone.id}`,
        metadata: {
          milestoneId: milestone.id,
          projectId: milestone.projectId,
          status: milestone.status,
          kind: "milestone",
        },
        createdBy: actor,
      });
      if ("error" in result) return milestone.twinEntityId;
      return result.id;
    },

    syncWorkItemLinks(item, actor) {
      if (!item.twinEntityId) return 0;
      let linked = 0;

      if (item.assignee) {
        const person = registry.findByKey(
          item.organizationId,
          "Person",
          `person:${item.assignee}`
        );
        if (
          person &&
          connect(
            relationships,
            item.organizationId,
            item.twinEntityId,
            person.id,
            "assigned_to",
            actor
          )
        ) {
          linked += 1;
        }
      }

      if (item.owner) {
        const person = registry.findByKey(
          item.organizationId,
          "Person",
          `person:${item.owner}`
        );
        if (
          person &&
          connect(
            relationships,
            item.organizationId,
            item.twinEntityId,
            person.id,
            "owned_by",
            actor
          )
        ) {
          linked += 1;
        }
      }

      if (item.relatedGoalId) {
        const goal = registry.findByKey(
          item.organizationId,
          "Goal",
          `goal:${item.relatedGoalId}`
        );
        if (
          goal &&
          connect(
            relationships,
            item.organizationId,
            item.twinEntityId,
            goal.id,
            "supports",
            actor
          )
        ) {
          linked += 1;
        }
      }

      if (item.relatedDecisionId) {
        const decision = registry.findByKey(
          item.organizationId,
          "Decision",
          `decision:${item.relatedDecisionId}`
        );
        if (
          decision &&
          connect(
            relationships,
            item.organizationId,
            item.twinEntityId,
            decision.id,
            "supports",
            actor
          )
        ) {
          linked += 1;
        }
      }

      if (item.relatedRiskId) {
        const risk = registry.findByKey(
          item.organizationId,
          "Risk",
          `risk:${item.relatedRiskId}`
        );
        if (
          risk &&
          connect(
            relationships,
            item.organizationId,
            item.twinEntityId,
            risk.id,
            "supports",
            actor
          )
        ) {
          linked += 1;
        }
      }

      if (item.projectId) {
        const project = registry.findByKey(
          item.organizationId,
          "Project",
          `project:${item.projectId}`
        );
        if (
          project &&
          connect(
            relationships,
            item.organizationId,
            item.twinEntityId,
            project.id,
            "belongs_to",
            actor
          )
        ) {
          linked += 1;
        }
      }

      for (const twinId of item.relatedTwinEntityIds) {
        if (
          connect(
            relationships,
            item.organizationId,
            item.twinEntityId,
            twinId,
            "produces",
            actor
          )
        ) {
          linked += 1;
        }
      }

      for (const evidenceId of item.relatedEvidenceIds) {
        const doc = registry.findByKey(
          item.organizationId,
          "Document",
          `evidence:${evidenceId}`
        );
        if (
          doc &&
          connect(
            relationships,
            item.organizationId,
            item.twinEntityId,
            doc.id,
            "produces",
            actor
          )
        ) {
          linked += 1;
        }
      }

      for (const dep of listDependenciesForOrganization(
        item.organizationId,
        item.id
      )) {
        if (dep.fromWorkItemId !== item.id) continue;
        const target = registry.findByKey(
          item.organizationId,
          "Task",
          `work:${dep.toWorkItemId}`
        );
        if (!target) continue;
        const relType =
          dep.kind === "blocks"
            ? "blocks"
            : dep.kind === "depends_on" || dep.kind === "parent"
              ? "depends_on"
              : dep.kind === "blocked_by"
                ? "blocked_by"
                : "depends_on";
        if (
          connect(
            relationships,
            item.organizationId,
            item.twinEntityId,
            target.id,
            relType,
            actor
          )
        ) {
          linked += 1;
        }
      }

      return linked;
    },
  };
}
