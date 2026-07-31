/**
 * ControlService — preventive / detective / corrective controls.
 */

import { randomUUID } from "node:crypto";
import {
  getControl,
  getRisk,
  listControlsForOrganization,
  upsertControl,
  upsertRisk,
} from "@/lib/risk/store";
import { createRiskTimeline } from "@/lib/risk/timeline";
import { createRiskTwinService } from "@/lib/risk/twin";
import type {
  ControlEffectiveness,
  ControlType,
  JagControl,
} from "@/lib/risk/types";
import { createRiskAssessment } from "@/lib/risk/assessment";

export type CreateControlInput = {
  readonly organizationId: string;
  readonly riskId?: string | null;
  readonly name: string;
  readonly description: string;
  readonly controlType: ControlType;
  readonly owner?: string | null;
  readonly frequency?: string;
  readonly effectiveness?: ControlEffectiveness;
  readonly lastReviewAt?: string | null;
  readonly createdBy: string;
};

export type ControlService = {
  create(input: CreateControlInput): JagControl | { error: string };
  get(organizationId: string, controlId: string): JagControl | null;
  list(organizationId: string, riskId?: string): readonly JagControl[];
  update(input: {
    organizationId: string;
    controlId: string;
    actor: string;
    name?: string;
    description?: string;
    controlType?: ControlType;
    owner?: string | null;
    frequency?: string;
    effectiveness?: ControlEffectiveness;
    lastReviewAt?: string | null;
  }): JagControl | null;
};

export function createControlService(): ControlService {
  const twin = createRiskTwinService();
  const timeline = createRiskTimeline();
  const assessment = createRiskAssessment();

  return {
    create(input) {
      if (!input.name.trim()) return { error: "Control name is required." };
      const now = new Date().toISOString();
      let control: JagControl = {
        id: randomUUID(),
        organizationId: input.organizationId,
        riskId: input.riskId ?? null,
        name: input.name.trim(),
        description: input.description.trim(),
        controlType: input.controlType,
        owner: input.owner ?? null,
        frequency: input.frequency ?? "Quarterly",
        lastReviewAt: input.lastReviewAt ?? null,
        effectiveness: input.effectiveness ?? "Not Assessed",
        twinEntityId: null,
        createdAt: now,
        updatedAt: now,
        createdBy: input.createdBy,
      };
      upsertControl(control);
      const twinId = twin.ensureControlTwin(control, input.createdBy);
      control = { ...control, twinEntityId: twinId };
      upsertControl(control);

      if (control.riskId) {
        const risk = getRisk(input.organizationId, control.riskId);
        if (risk) {
          const controlIds = Object.freeze([
            ...new Set([...risk.controlIds, control.id]),
          ]);
          const scored = assessment.scoreRisk({ ...risk, controlIds });
          const next = {
            ...risk,
            controlIds,
            inherentScore: scored.inherentScore,
            residualScore: scored.residualScore,
            severity: scored.severity,
            updatedAt: now,
          };
          upsertRisk(next);
          twin.syncRiskLinks(next, input.createdBy);
          timeline.record({
            organizationId: input.organizationId,
            riskId: risk.id,
            kind: "control_linked",
            actor: input.createdBy,
            message: `Control “${control.name}” linked (${control.controlType}).`,
            metadata: { controlId: control.id },
          });
        }
      }

      return control;
    },

    get: getControl,
    list: listControlsForOrganization,

    update(input) {
      const current = getControl(input.organizationId, input.controlId);
      if (!current) return null;
      const now = new Date().toISOString();
      const next: JagControl = {
        ...current,
        name: input.name?.trim() ?? current.name,
        description: input.description?.trim() ?? current.description,
        controlType: input.controlType ?? current.controlType,
        owner: input.owner !== undefined ? input.owner : current.owner,
        frequency: input.frequency ?? current.frequency,
        effectiveness: input.effectiveness ?? current.effectiveness,
        lastReviewAt:
          input.lastReviewAt !== undefined
            ? input.lastReviewAt
            : current.lastReviewAt,
        updatedAt: now,
      };
      upsertControl(next);
      twin.ensureControlTwin(next, input.actor);

      if (next.riskId) {
        const risk = getRisk(input.organizationId, next.riskId);
        if (risk) {
          const scored = assessment.scoreRisk(risk);
          upsertRisk({
            ...risk,
            inherentScore: scored.inherentScore,
            residualScore: scored.residualScore,
            severity: scored.severity,
            updatedAt: now,
          });
        }
      }
      return next;
    },
  };
}
