/**
 * MitigationService — mitigation workflow items attached to risks.
 */

import { randomUUID } from "node:crypto";
import { createTwinRegistry } from "@/lib/digital-twin/registry";
import { createRiskAssessment } from "@/lib/risk/assessment";
import {
  getMitigation,
  getRisk,
  listMitigationsForOrganization,
  upsertMitigation,
  upsertRisk,
} from "@/lib/risk/store";
import { createRiskTimeline } from "@/lib/risk/timeline";
import { createRiskTwinService } from "@/lib/risk/twin";
import type { JagMitigation, MitigationStatus } from "@/lib/risk/types";

export type CreateMitigationInput = {
  readonly organizationId: string;
  readonly riskId: string;
  readonly title: string;
  readonly description: string;
  readonly status?: MitigationStatus;
  readonly owner?: string | null;
  readonly dueDate?: string | null;
  readonly createdBy: string;
};

export type MitigationService = {
  create(input: CreateMitigationInput): JagMitigation | { error: string };
  get(organizationId: string, mitigationId: string): JagMitigation | null;
  list(organizationId: string, riskId?: string): readonly JagMitigation[];
  update(input: {
    organizationId: string;
    mitigationId: string;
    actor: string;
    title?: string;
    description?: string;
    status?: MitigationStatus;
    owner?: string | null;
    dueDate?: string | null;
  }): JagMitigation | { error: string } | null;
};

export function createMitigationService(): MitigationService {
  const assessment = createRiskAssessment();
  const timeline = createRiskTimeline();
  const twin = createRiskTwinService();
  const registry = createTwinRegistry();

  function rescore(organizationId: string, riskId: string, actor: string) {
    const risk = getRisk(organizationId, riskId);
    if (!risk) return;
    const scored = assessment.scoreRisk(risk);
    const next = {
      ...risk,
      inherentScore: scored.inherentScore,
      residualScore: scored.residualScore,
      severity: scored.severity,
      updatedAt: new Date().toISOString(),
    };
    upsertRisk(next);
    twin.syncRiskLinks(next, actor);
  }

  return {
    create(input) {
      if (!input.title.trim()) return { error: "Mitigation title is required." };
      const risk = getRisk(input.organizationId, input.riskId);
      if (!risk) return { error: "Risk was not found." };

      const now = new Date().toISOString();
      const mitigation: JagMitigation = {
        id: randomUUID(),
        organizationId: input.organizationId,
        riskId: input.riskId,
        title: input.title.trim(),
        description: input.description.trim(),
        status: input.status ?? "Planned",
        owner: input.owner ?? null,
        dueDate: input.dueDate ?? null,
        completedAt: null,
        createdAt: now,
        updatedAt: now,
        createdBy: input.createdBy,
      };
      upsertMitigation(mitigation);

      registry.register({
        organizationId: input.organizationId,
        entityType: "Asset",
        label: mitigation.title,
        description: mitigation.description,
        externalKey: `mitigation:${mitigation.id}`,
        metadata: {
          mitigationId: mitigation.id,
          riskId: mitigation.riskId,
          kind: "mitigation",
          status: mitigation.status,
        },
        createdBy: input.createdBy,
      });

      const mitigationIds = Object.freeze([
        ...new Set([...risk.mitigationIds, mitigation.id]),
      ]);
      const updatedRisk = { ...risk, mitigationIds, updatedAt: now };
      upsertRisk(updatedRisk);
      rescore(input.organizationId, risk.id, input.createdBy);

      timeline.record({
        organizationId: input.organizationId,
        riskId: risk.id,
        kind: "mitigation_updated",
        actor: input.createdBy,
        message: `Mitigation “${mitigation.title}” created (${mitigation.status}).`,
        metadata: { mitigationId: mitigation.id },
      });

      return mitigation;
    },

    get: getMitigation,
    list: listMitigationsForOrganization,

    update(input) {
      const current = getMitigation(input.organizationId, input.mitigationId);
      if (!current) return null;
      const now = new Date().toISOString();
      const status = input.status ?? current.status;
      const next: JagMitigation = {
        ...current,
        title: input.title?.trim() ?? current.title,
        description: input.description?.trim() ?? current.description,
        status,
        owner: input.owner !== undefined ? input.owner : current.owner,
        dueDate: input.dueDate !== undefined ? input.dueDate : current.dueDate,
        completedAt: status === "Completed" ? now : null,
        updatedAt: now,
      };
      upsertMitigation(next);
      rescore(input.organizationId, next.riskId, input.actor);
      timeline.record({
        organizationId: input.organizationId,
        riskId: next.riskId,
        kind: "mitigation_updated",
        actor: input.actor,
        message: `Mitigation “${next.title}” → ${next.status}.`,
        metadata: { mitigationId: next.id, status: next.status },
      });
      return next;
    },
  };
}
