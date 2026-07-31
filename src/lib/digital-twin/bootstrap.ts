/**
 * Seed Digital Twin™ from existing platform facts (deterministic projection).
 */

import { listInstallationsForOrganization } from "@/lib/connectors";
import {
  listEvidenceForOrganization,
  listBusinessUnitsForOrganization,
} from "@/lib/evidence-center";
import { listDecisionsForOrganization } from "@/lib/executive-intelligence/decisions";
import { listGoalsForOrganization } from "@/lib/goals";
import { listRisksForOrganization } from "@/lib/risk";
import { listMemoriesForOrganization } from "@/lib/memory";
import {
  listProjectsForOrganization,
  listWorkItemsForOrganization,
} from "@/lib/work";
import { createTwinRegistry } from "@/lib/digital-twin/registry";
import { createTwinRelationshipService } from "@/lib/digital-twin/relationships";
import type { TwinEntity } from "@/lib/digital-twin/types";

function asEntity(result: TwinEntity | { error: string }): TwinEntity | null {
  return "error" in result ? null : result;
}

export function bootstrapDigitalTwin(input: {
  organizationId: string;
  organizationName: string;
  actor?: string;
}): {
  readonly createdOrUpdated: number;
  readonly relationships: number;
} {
  const actor = input.actor ?? "system";
  const registry = createTwinRegistry();
  const relationships = createTwinRelationshipService();
  let createdOrUpdated = 0;
  let relCount = 0;

  const org = asEntity(
    registry.register({
      organizationId: input.organizationId,
      entityType: "Organization",
      label: input.organizationName,
      externalKey: input.organizationId,
      description: "Canonical organization twin",
      createdBy: actor,
    })
  );
  if (org) createdOrUpdated += 1;

  for (const bu of listBusinessUnitsForOrganization(input.organizationId)) {
    const entity = asEntity(
      registry.register({
        organizationId: input.organizationId,
        entityType: "Business Unit",
        label: bu,
        externalKey: `bu:${bu}`,
        createdBy: actor,
      })
    );
    if (!entity || !org) continue;
    createdOrUpdated += 1;
    const rel = relationships.connect({
      organizationId: input.organizationId,
      fromTwinId: entity.id,
      toTwinId: org.id,
      relationshipType: "belongs_to",
      actor,
    });
    if (!("error" in rel)) relCount += 1;
  }

  const departments = new Set(
    listEvidenceForOrganization(input.organizationId)
      .map((d) => d.department)
      .filter(Boolean)
  );
  for (const dept of departments) {
    const entity = asEntity(
      registry.register({
        organizationId: input.organizationId,
        entityType: "Department",
        label: dept,
        externalKey: `dept:${dept}`,
        createdBy: actor,
      })
    );
    if (!entity || !org) continue;
    createdOrUpdated += 1;
    const rel = relationships.connect({
      organizationId: input.organizationId,
      fromTwinId: entity.id,
      toTwinId: org.id,
      relationshipType: "belongs_to",
      actor,
    });
    if (!("error" in rel)) relCount += 1;
  }

  for (const doc of listEvidenceForOrganization(input.organizationId)) {
    const entity = asEntity(
      registry.register({
        organizationId: input.organizationId,
        entityType: "Document",
        label: doc.name,
        externalKey: `evidence:${doc.id}`,
        description: doc.description,
        metadata: {
          evidenceId: doc.id,
          source: doc.source,
          domain: doc.domain,
        },
        createdBy: actor,
      })
    );
    if (!entity || !org) continue;
    createdOrUpdated += 1;
    const rel = relationships.connect({
      organizationId: input.organizationId,
      fromTwinId: entity.id,
      toTwinId: org.id,
      relationshipType: "belongs_to",
      actor,
    });
    if (!("error" in rel)) relCount += 1;

    if (doc.businessUnit) {
      const bu = registry.findByKey(
        input.organizationId,
        "Business Unit",
        `bu:${doc.businessUnit}`
      );
      if (bu) {
        const owned = relationships.connect({
          organizationId: input.organizationId,
          fromTwinId: bu.id,
          toTwinId: entity.id,
          relationshipType: "owns",
          actor,
        });
        if (!("error" in owned)) relCount += 1;
      }
    }
  }

  for (const decision of listDecisionsForOrganization(input.organizationId)) {
    const entity = asEntity(
      registry.register({
        organizationId: input.organizationId,
        entityType: "Decision",
        label: decision.title,
        externalKey: `decision:${decision.id}`,
        description: decision.description,
        metadata: {
          decisionId: decision.id,
          status: decision.status,
          severity: decision.severity,
        },
        createdBy: actor,
      })
    );
    if (!entity || !org) continue;
    createdOrUpdated += 1;
    const rel = relationships.connect({
      organizationId: input.organizationId,
      fromTwinId: entity.id,
      toTwinId: org.id,
      relationshipType: "belongs_to",
      actor,
    });
    if (!("error" in rel)) relCount += 1;
  }

  for (const goal of listGoalsForOrganization(input.organizationId)) {
    const entity = asEntity(
      registry.register({
        organizationId: input.organizationId,
        entityType: "Goal",
        label: goal.title,
        externalKey: `goal:${goal.id}`,
        description: goal.description,
        metadata: {
          goalId: goal.id,
          goalType: goal.goalType,
          status: goal.status,
          health: goal.health,
          progressPercent: String(goal.progressPercent),
        },
        createdBy: actor,
      })
    );
    if (!entity || !org) continue;
    createdOrUpdated += 1;
    const belongs = relationships.connect({
      organizationId: input.organizationId,
      fromTwinId: entity.id,
      toTwinId: org.id,
      relationshipType: "belongs_to",
      actor,
    });
    if (!("error" in belongs)) relCount += 1;
    if (goal.parentGoalId) {
      const parent = registry.findByKey(
        input.organizationId,
        "Goal",
        `goal:${goal.parentGoalId}`
      );
      if (parent) {
        const supports = relationships.connect({
          organizationId: input.organizationId,
          fromTwinId: entity.id,
          toTwinId: parent.id,
          relationshipType: "supports",
          actor,
        });
        if (!("error" in supports)) relCount += 1;
      }
    }
  }

  for (const risk of listRisksForOrganization(input.organizationId)) {
    const entity = asEntity(
      registry.register({
        organizationId: input.organizationId,
        entityType: "Risk",
        label: risk.title,
        externalKey: `risk:${risk.id}`,
        description: risk.description,
        metadata: {
          riskId: risk.id,
          category: risk.category,
          severity: risk.severity,
          status: risk.status,
          residualScore: String(risk.residualScore),
        },
        createdBy: actor,
      })
    );
    if (!entity || !org) continue;
    createdOrUpdated += 1;
    const belongs = relationships.connect({
      organizationId: input.organizationId,
      fromTwinId: entity.id,
      toTwinId: org.id,
      relationshipType: "belongs_to",
      actor,
    });
    if (!("error" in belongs)) relCount += 1;
    if (risk.relatedGoalId) {
      const goal = registry.findByKey(
        input.organizationId,
        "Goal",
        `goal:${risk.relatedGoalId}`
      );
      if (goal) {
        const threatens = relationships.connect({
          organizationId: input.organizationId,
          fromTwinId: entity.id,
          toTwinId: goal.id,
          relationshipType: "threatens",
          actor,
        });
        if (!("error" in threatens)) relCount += 1;
      }
    }
  }

  for (const project of listProjectsForOrganization(input.organizationId)) {
    const entity = asEntity(
      registry.register({
        organizationId: input.organizationId,
        entityType: "Project",
        label: project.title,
        externalKey: `project:${project.id}`,
        description: project.description,
        metadata: {
          projectId: project.id,
          status: project.status,
          progressPercent: String(project.progressPercent),
        },
        createdBy: actor,
      })
    );
    if (!entity || !org) continue;
    createdOrUpdated += 1;
    const belongs = relationships.connect({
      organizationId: input.organizationId,
      fromTwinId: entity.id,
      toTwinId: org.id,
      relationshipType: "belongs_to",
      actor,
    });
    if (!("error" in belongs)) relCount += 1;
  }

  for (const work of listWorkItemsForOrganization(input.organizationId)) {
    const entity = asEntity(
      registry.register({
        organizationId: input.organizationId,
        entityType: "Task",
        label: work.title,
        externalKey: `work:${work.id}`,
        description: work.description,
        metadata: {
          workItemId: work.id,
          type: work.type,
          status: work.status,
          progressPercent: String(work.progressPercent),
        },
        createdBy: actor,
      })
    );
    if (!entity || !org) continue;
    createdOrUpdated += 1;
    const belongs = relationships.connect({
      organizationId: input.organizationId,
      fromTwinId: entity.id,
      toTwinId: org.id,
      relationshipType: "belongs_to",
      actor,
    });
    if (!("error" in belongs)) relCount += 1;
    if (work.projectId) {
      const project = registry.findByKey(
        input.organizationId,
        "Project",
        `project:${work.projectId}`
      );
      if (project) {
        const link = relationships.connect({
          organizationId: input.organizationId,
          fromTwinId: entity.id,
          toTwinId: project.id,
          relationshipType: "belongs_to",
          actor,
        });
        if (!("error" in link)) relCount += 1;
      }
    }
    if (work.relatedGoalId) {
      const goal = registry.findByKey(
        input.organizationId,
        "Goal",
        `goal:${work.relatedGoalId}`
      );
      if (goal) {
        const supports = relationships.connect({
          organizationId: input.organizationId,
          fromTwinId: entity.id,
          toTwinId: goal.id,
          relationshipType: "supports",
          actor,
        });
        if (!("error" in supports)) relCount += 1;
      }
    }
  }

  for (const memory of listMemoriesForOrganization(input.organizationId)) {
    const entity = asEntity(
      registry.register({
        organizationId: input.organizationId,
        entityType: "Document",
        label: memory.title,
        externalKey: `memory:${memory.id}`,
        description: memory.summary,
        metadata: {
          memoryId: memory.id,
          category: memory.category,
          source: memory.source,
          status: memory.status,
          kind: "organizational_memory",
        },
        createdBy: actor,
      })
    );
    if (!entity || !org) continue;
    createdOrUpdated += 1;
    const belongs = relationships.connect({
      organizationId: input.organizationId,
      fromTwinId: entity.id,
      toTwinId: org.id,
      relationshipType: "belongs_to",
      actor,
    });
    if (!("error" in belongs)) relCount += 1;
    if (memory.relatedGoalId) {
      const goal = registry.findByKey(
        input.organizationId,
        "Goal",
        `goal:${memory.relatedGoalId}`
      );
      if (goal) {
        const supports = relationships.connect({
          organizationId: input.organizationId,
          fromTwinId: entity.id,
          toTwinId: goal.id,
          relationshipType: "supports",
          actor,
        });
        if (!("error" in supports)) relCount += 1;
      }
    }
  }

  for (const install of listInstallationsForOrganization(
    input.organizationId
  )) {
    const entity = asEntity(
      registry.register({
        organizationId: input.organizationId,
        entityType: "Asset",
        label: install.connectorId,
        externalKey: `connector:${install.id}`,
        description: `Connector installation (${install.status})`,
        metadata: {
          connectorId: install.connectorId,
          health: install.health,
          status: install.status,
          kind: "connector",
        },
        createdBy: actor,
      })
    );
    if (!entity || !org) continue;
    createdOrUpdated += 1;
    const rel = relationships.connect({
      organizationId: input.organizationId,
      fromTwinId: org.id,
      toTwinId: entity.id,
      relationshipType: "owns",
      actor,
    });
    if (!("error" in rel)) relCount += 1;
  }

  return { createdOrUpdated, relationships: relCount };
}
