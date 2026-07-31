/**
 * Goals ↔ Digital Twin™ / Knowledge Graph™ integration.
 */

import { createTwinRegistry } from "@/lib/digital-twin/registry";
import { createTwinRelationshipService } from "@/lib/digital-twin/relationships";
import type { TwinRelationshipType } from "@/lib/digital-twin/types";
import type { GoalLink, JagGoal } from "@/lib/goals/types";

const LINK_TO_REL: Readonly<
  Record<GoalLink["kind"], TwinRelationshipType | null>
> = {
  decision: "supports",
  evidence: "references",
  kpi: "measured_by",
  risk: "blocked_by",
  opportunity: "supports",
  project: "depends_on",
  business_unit: "belongs_to",
  twin: "supports",
};

export type GoalTwinService = {
  ensureGoalTwin(goal: JagGoal, actor: string): string | null;
  syncLinks(goal: JagGoal, actor: string): number;
};

export function createGoalTwinService(): GoalTwinService {
  const registry = createTwinRegistry();
  const relationships = createTwinRelationshipService();

  return {
    ensureGoalTwin(goal, actor) {
      const result = registry.register({
        organizationId: goal.organizationId,
        entityType: "Goal",
        label: goal.title,
        description: goal.description,
        externalKey: `goal:${goal.id}`,
        metadata: {
          goalId: goal.id,
          goalType: goal.goalType,
          hierarchyLevel: goal.hierarchyLevel,
          status: goal.status,
          progressPercent: String(goal.progressPercent),
          health: goal.health,
        },
        createdBy: actor,
      });
      if ("error" in result) return goal.twinEntityId;
      return result.id;
    },

    syncLinks(goal, actor) {
      if (!goal.twinEntityId) return 0;
      let linked = 0;

      // Parent hierarchy → supports (child supports parent)
      if (goal.parentGoalId) {
        const parentTwin = registry.findByKey(
          goal.organizationId,
          "Goal",
          `goal:${goal.parentGoalId}`
        );
        if (parentTwin) {
          const rel = relationships.connect({
            organizationId: goal.organizationId,
            fromTwinId: goal.twinEntityId,
            toTwinId: parentTwin.id,
            relationshipType: "supports",
            actor,
            metadata: { goalId: goal.id, parentGoalId: goal.parentGoalId },
          });
          if (!("error" in rel)) linked += 1;
        }
      }

      // Owner
      if (goal.owner) {
        const person = registry.findByKey(
          goal.organizationId,
          "Person",
          `person:${goal.owner}`
        );
        if (person) {
          const rel = relationships.connect({
            organizationId: goal.organizationId,
            fromTwinId: goal.twinEntityId,
            toTwinId: person.id,
            relationshipType: "owned_by",
            actor,
            metadata: { owner: goal.owner },
          });
          if (!("error" in rel)) linked += 1;
        }
      }

      for (const link of goal.links) {
        const relType = LINK_TO_REL[link.kind];
        if (!relType) continue;

        let targetTwinId: string | null = null;
        if (link.kind === "twin") {
          targetTwinId = link.targetId;
        } else if (link.kind === "decision") {
          targetTwinId =
            registry.findByKey(
              goal.organizationId,
              "Decision",
              `decision:${link.targetId}`
            )?.id ?? null;
        } else if (link.kind === "kpi") {
          targetTwinId =
            registry.findByKey(
              goal.organizationId,
              "Metric (KPI)",
              link.targetId.startsWith("kpi:")
                ? link.targetId
                : `kpi:${link.targetId}`
            )?.id ?? null;
        } else if (link.kind === "risk") {
          targetTwinId =
            registry.findByKey(
              goal.organizationId,
              "Risk",
              link.targetId.startsWith("risk:")
                ? link.targetId
                : `risk:${link.targetId}`
            )?.id ?? null;
        } else if (link.kind === "opportunity") {
          targetTwinId =
            registry.findByKey(
              goal.organizationId,
              "Opportunity",
              link.targetId.startsWith("opportunity:")
                ? link.targetId
                : `opportunity:${link.targetId}`
            )?.id ?? null;
        } else if (link.kind === "project") {
          targetTwinId =
            registry.findByKey(
              goal.organizationId,
              "Project",
              link.targetId.startsWith("project:")
                ? link.targetId
                : `project:${link.targetId}`
            )?.id ?? null;
        } else if (link.kind === "business_unit") {
          targetTwinId =
            registry.findByKey(
              goal.organizationId,
              "Business Unit",
              link.targetId
            )?.id ?? null;
        } else if (link.kind === "evidence") {
          targetTwinId =
            registry.findByKey(
              goal.organizationId,
              "Document",
              `evidence:${link.targetId}`
            )?.id ?? null;
        }

        if (!targetTwinId) continue;
        const rel = relationships.connect({
          organizationId: goal.organizationId,
          fromTwinId: goal.twinEntityId,
          toTwinId: targetTwinId,
          relationshipType: relType,
          actor,
          metadata: { linkKind: link.kind, targetId: link.targetId },
        });
        if (!("error" in rel)) linked += 1;
      }

      return linked;
    },
  };
}
