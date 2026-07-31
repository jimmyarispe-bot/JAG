/**
 * Risk ↔ Digital Twin™ / Knowledge Graph™ integration.
 */

import { createTwinRegistry } from "@/lib/digital-twin/registry";
import { createTwinRelationshipService } from "@/lib/digital-twin/relationships";
import type { JagControl, JagRisk } from "@/lib/risk/types";

export type RiskTwinService = {
  ensureRiskTwin(risk: JagRisk, actor: string): string | null;
  syncRiskLinks(risk: JagRisk, actor: string): number;
  ensureControlTwin(control: JagControl, actor: string): string | null;
};

export function createRiskTwinService(): RiskTwinService {
  const registry = createTwinRegistry();
  const relationships = createTwinRelationshipService();

  return {
    ensureRiskTwin(risk, actor) {
      const result = registry.register({
        organizationId: risk.organizationId,
        entityType: "Risk",
        label: risk.title,
        description: risk.description,
        externalKey: `risk:${risk.id}`,
        metadata: {
          riskId: risk.id,
          category: risk.category,
          severity: risk.severity,
          status: risk.status,
          residualScore: String(risk.residualScore),
        },
        createdBy: actor,
      });
      if ("error" in result) return risk.twinEntityId;
      return result.id;
    },

    ensureControlTwin(control, actor) {
      const result = registry.register({
        organizationId: control.organizationId,
        entityType: "Asset",
        label: control.name,
        description: control.description,
        externalKey: `control:${control.id}`,
        metadata: {
          controlId: control.id,
          controlType: control.controlType,
          effectiveness: control.effectiveness,
          kind: "control",
        },
        createdBy: actor,
      });
      if ("error" in result) return control.twinEntityId;
      return result.id;
    },

    syncRiskLinks(risk, actor) {
      if (!risk.twinEntityId) return 0;
      let linked = 0;

      if (risk.owner) {
        const person = registry.findByKey(
          risk.organizationId,
          "Person",
          `person:${risk.owner}`
        );
        if (person) {
          const rel = relationships.connect({
            organizationId: risk.organizationId,
            fromTwinId: risk.twinEntityId,
            toTwinId: person.id,
            relationshipType: "owned_by",
            actor,
          });
          if (!("error" in rel)) linked += 1;
        }
      }

      if (risk.relatedGoalId) {
        const goal = registry.findByKey(
          risk.organizationId,
          "Goal",
          `goal:${risk.relatedGoalId}`
        );
        if (goal) {
          const rel = relationships.connect({
            organizationId: risk.organizationId,
            fromTwinId: risk.twinEntityId,
            toTwinId: goal.id,
            relationshipType: "threatens",
            actor,
          });
          if (!("error" in rel)) linked += 1;
        }
      }

      if (risk.relatedDecisionId) {
        const decision = registry.findByKey(
          risk.organizationId,
          "Decision",
          `decision:${risk.relatedDecisionId}`
        );
        if (decision) {
          const rel = relationships.connect({
            organizationId: risk.organizationId,
            fromTwinId: risk.twinEntityId,
            toTwinId: decision.id,
            relationshipType: "impacts",
            actor,
          });
          if (!("error" in rel)) linked += 1;
        }
      }

      if (risk.relatedTwinEntityId) {
        const rel = relationships.connect({
          organizationId: risk.organizationId,
          fromTwinId: risk.twinEntityId,
          toTwinId: risk.relatedTwinEntityId,
          relationshipType: "impacts",
          actor,
        });
        if (!("error" in rel)) linked += 1;
      }

      for (const evidenceId of risk.relatedEvidenceIds) {
        const doc = registry.findByKey(
          risk.organizationId,
          "Document",
          `evidence:${evidenceId}`
        );
        if (!doc) continue;
        const rel = relationships.connect({
          organizationId: risk.organizationId,
          fromTwinId: risk.twinEntityId,
          toTwinId: doc.id,
          relationshipType: "references",
          actor,
        });
        if (!("error" in rel)) linked += 1;
      }

      for (const controlId of risk.controlIds) {
        const controlTwin = registry.findByKey(
          risk.organizationId,
          "Asset",
          `control:${controlId}`
        );
        if (!controlTwin) continue;
        const rel = relationships.connect({
          organizationId: risk.organizationId,
          fromTwinId: risk.twinEntityId,
          toTwinId: controlTwin.id,
          relationshipType: "controlled_by",
          actor,
        });
        if (!("error" in rel)) linked += 1;
      }

      for (const mitigationId of risk.mitigationIds) {
        // Mitigations mirror as metadata-linked Asset nodes when registered
        const mitigationTwin = registry.findByKey(
          risk.organizationId,
          "Asset",
          `mitigation:${mitigationId}`
        );
        if (!mitigationTwin) continue;
        const rel = relationships.connect({
          organizationId: risk.organizationId,
          fromTwinId: risk.twinEntityId,
          toTwinId: mitigationTwin.id,
          relationshipType: "mitigated_by",
          actor,
        });
        if (!("error" in rel)) linked += 1;
      }

      if (risk.department) {
        const dept = registry.findByKey(
          risk.organizationId,
          "Department",
          risk.department
        );
        if (dept) {
          const rel = relationships.connect({
            organizationId: risk.organizationId,
            fromTwinId: risk.twinEntityId,
            toTwinId: dept.id,
            relationshipType: "monitored_by",
            actor,
          });
          if (!("error" in rel)) linked += 1;
        }
      }

      return linked;
    },
  };
}
