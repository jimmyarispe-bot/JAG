/**
 * RiskService — create / read / patch risks with scoring, twin, workflow.
 */

import { randomUUID } from "node:crypto";
import { createRiskAssessment } from "@/lib/risk/assessment";
import { createRiskMetrics } from "@/lib/risk/metrics";
import {
  getRisk,
  listRisksForOrganization,
  upsertRisk,
} from "@/lib/risk/store";
import { createRiskTimeline } from "@/lib/risk/timeline";
import { createRiskTwinService } from "@/lib/risk/twin";
import type {
  CreateRiskInput,
  JagRisk,
  PatchRiskInput,
  RiskDashboard,
  RiskStatus,
  RiskSummary,
} from "@/lib/risk/types";
import { emitJagPlatformEvent } from "@/lib/jag-platform/events";

const STATUS_ORDER: readonly RiskStatus[] = [
  "Identified",
  "Assessing",
  "Mitigating",
  "Monitoring",
  "Resolved",
  "Closed",
];

export type RiskService = {
  create(input: CreateRiskInput): JagRisk | { error: string };
  get(organizationId: string, riskId: string): JagRisk | null;
  list(organizationId: string): readonly JagRisk[];
  patch(input: PatchRiskInput): JagRisk | { error: string } | null;
  dashboard(organizationId: string): RiskDashboard;
  summary(organizationId: string): RiskSummary;
  canTransition(from: RiskStatus, to: RiskStatus): boolean;
};

export function createRiskService(): RiskService {
  const assessment = createRiskAssessment();
  const timeline = createRiskTimeline();
  const twin = createRiskTwinService();
  const metrics = createRiskMetrics();

  const service: RiskService = {
    canTransition(from, to) {
      if (from === to) return true;
      const fi = STATUS_ORDER.indexOf(from);
      const ti = STATUS_ORDER.indexOf(to);
      if (fi < 0 || ti < 0) return false;
      // Allow forward, one-step back, or jump to Closed/Resolved from Monitoring+
      if (ti >= fi) return true;
      if (ti === fi - 1) return true;
      if (to === "Closed" || to === "Resolved") return true;
      return false;
    },

    create(input) {
      const title = input.title.trim();
      const description = input.description.trim();
      if (!title) return { error: "Title is required." };
      if (!description) return { error: "Description is required." };

      const likelihood = input.likelihood ?? 3;
      const impact = input.impact ?? 3;
      const inherentScore = assessment.inherentScore(likelihood, impact);
      const residualScore = inherentScore;
      const severity =
        input.severity ?? assessment.severityFromScore(residualScore);
      const now = new Date().toISOString();
      const id = randomUUID();

      let risk: JagRisk = {
        id,
        organizationId: input.organizationId,
        category: input.category,
        title,
        description,
        severity,
        likelihood,
        impact,
        inherentScore,
        residualScore,
        status: input.status ?? "Identified",
        owner: input.owner ?? null,
        businessUnit: input.businessUnit ?? null,
        department: input.department ?? null,
        relatedGoalId: input.relatedGoalId ?? null,
        relatedDecisionId: input.relatedDecisionId ?? null,
        relatedEvidenceIds: Object.freeze([
          ...(input.relatedEvidenceIds ?? []),
        ]),
        relatedTwinEntityId: input.relatedTwinEntityId ?? null,
        mitigationPlan: input.mitigationPlan ?? "",
        reviewDate: input.reviewDate ?? null,
        controlIds: Object.freeze([]),
        mitigationIds: Object.freeze([]),
        complianceRequirementIds: Object.freeze([]),
        twinEntityId: null,
        createdAt: now,
        updatedAt: now,
        resolvedAt: null,
        closedAt: null,
        createdBy: input.createdBy,
      };

      upsertRisk(risk);
      const twinId = twin.ensureRiskTwin(risk, input.createdBy);
      const scored = assessment.scoreRisk({ ...risk, twinEntityId: twinId });
      risk = {
        ...risk,
        twinEntityId: twinId,
        inherentScore: scored.inherentScore,
        residualScore: scored.residualScore,
        severity: scored.severity,
      };
      upsertRisk(risk);
      twin.syncRiskLinks(risk, input.createdBy);

      timeline.record({
        organizationId: input.organizationId,
        riskId: id,
        kind: "created",
        actor: input.createdBy,
        message: `Risk created (${risk.category}).`,
        metadata: {
          severity: risk.severity,
          residualScore: String(risk.residualScore),
        },
      });
      timeline.record({
        organizationId: input.organizationId,
        riskId: id,
        kind: "scored",
        actor: input.createdBy,
        message: `Inherent ${risk.inherentScore} → residual ${risk.residualScore}.`,
      });

      emitJagPlatformEvent({
        organizationId: input.organizationId,
        sourceModule: "risk",
        entityType: "JagRisk",
        entityId: id,
        eventType: "risk.created",
        actor: input.createdBy,
        metadata: {
          category: risk.category,
          severity: risk.severity,
          status: risk.status,
          twinEntityId: risk.twinEntityId ?? "",
        },
      });

      return risk;
    },

    get: getRisk,
    list: listRisksForOrganization,

    patch(input) {
      const current = getRisk(input.organizationId, input.riskId);
      if (!current) return null;

      if (input.status && !service.canTransition(current.status, input.status)) {
        return {
          error: `Cannot transition from ${current.status} to ${input.status}.`,
        };
      }

      const now = new Date().toISOString();
      let next: JagRisk = {
        ...current,
        category: input.category ?? current.category,
        title: input.title?.trim() ?? current.title,
        description: input.description?.trim() ?? current.description,
        likelihood: input.likelihood ?? current.likelihood,
        impact: input.impact ?? current.impact,
        status: input.status ?? current.status,
        owner: input.owner !== undefined ? input.owner : current.owner,
        businessUnit:
          input.businessUnit !== undefined
            ? input.businessUnit
            : current.businessUnit,
        department:
          input.department !== undefined
            ? input.department
            : current.department,
        relatedGoalId:
          input.relatedGoalId !== undefined
            ? input.relatedGoalId
            : current.relatedGoalId,
        relatedDecisionId:
          input.relatedDecisionId !== undefined
            ? input.relatedDecisionId
            : current.relatedDecisionId,
        relatedEvidenceIds:
          input.relatedEvidenceIds !== undefined
            ? Object.freeze([...input.relatedEvidenceIds])
            : current.relatedEvidenceIds,
        relatedTwinEntityId:
          input.relatedTwinEntityId !== undefined
            ? input.relatedTwinEntityId
            : current.relatedTwinEntityId,
        mitigationPlan: input.mitigationPlan ?? current.mitigationPlan,
        reviewDate:
          input.reviewDate !== undefined
            ? input.reviewDate
            : current.reviewDate,
        controlIds:
          input.controlIds !== undefined
            ? Object.freeze([...input.controlIds])
            : current.controlIds,
        mitigationIds:
          input.mitigationIds !== undefined
            ? Object.freeze([...input.mitigationIds])
            : current.mitigationIds,
        complianceRequirementIds:
          input.complianceRequirementIds !== undefined
            ? Object.freeze([...input.complianceRequirementIds])
            : current.complianceRequirementIds,
        updatedAt: now,
        resolvedAt:
          input.status === undefined
            ? current.resolvedAt
            : input.status === "Resolved"
              ? now
              : null,
        closedAt:
          input.status === undefined
            ? current.closedAt
            : input.status === "Closed"
              ? now
              : current.closedAt,
      };

      upsertRisk(next);
      const twinId = twin.ensureRiskTwin(next, input.actor);
      const scored = assessment.scoreRisk({
        ...next,
        twinEntityId: twinId ?? next.twinEntityId,
        severity: input.severity ?? next.severity,
      });
      next = {
        ...next,
        twinEntityId: twinId ?? next.twinEntityId,
        inherentScore: scored.inherentScore,
        residualScore: scored.residualScore,
        severity: input.severity ?? scored.severity,
      };
      upsertRisk(next);
      twin.syncRiskLinks(next, input.actor);

      timeline.record({
        organizationId: input.organizationId,
        riskId: next.id,
        kind: "updated",
        actor: input.actor,
        message: "Risk updated.",
        metadata: { status: next.status },
      });

      if (input.status && input.status !== current.status) {
        timeline.record({
          organizationId: input.organizationId,
          riskId: next.id,
          kind: "status_changed",
          actor: input.actor,
          message: `${current.status} → ${input.status}.`,
          metadata: { from: current.status, to: input.status },
        });
      }

      if (
        input.likelihood !== undefined ||
        input.impact !== undefined ||
        input.controlIds !== undefined
      ) {
        timeline.record({
          organizationId: input.organizationId,
          riskId: next.id,
          kind: "scored",
          actor: input.actor,
          message: `Rescored: residual ${next.residualScore} (${next.severity}).`,
        });
      }

      if (input.reviewDate !== undefined) {
        timeline.record({
          organizationId: input.organizationId,
          riskId: next.id,
          kind: "review_scheduled",
          actor: input.actor,
          message: `Review date set to ${input.reviewDate ?? "none"}.`,
        });
      }

      if (next.status === "Closed" && current.status !== "Closed") {
        timeline.record({
          organizationId: input.organizationId,
          riskId: next.id,
          kind: "closed",
          actor: input.actor,
          message: "Risk closed.",
        });
      }

      emitJagPlatformEvent({
        organizationId: input.organizationId,
        sourceModule: "risk",
        entityType: "JagRisk",
        entityId: next.id,
        eventType: "risk.updated",
        actor: input.actor,
        metadata: {
          status: next.status,
          severity: next.severity,
          residualScore: String(next.residualScore),
        },
      });

      return getRisk(input.organizationId, next.id);
    },

    dashboard(organizationId) {
      return metrics.dashboard(organizationId);
    },

    summary(organizationId) {
      return metrics.summarize(organizationId);
    },
  };

  return service;
}

let singleton: RiskService | null = null;

export function getRiskService(): RiskService {
  if (!singleton) singleton = createRiskService();
  return singleton;
}

export function resetRiskServiceForTests(): void {
  singleton = null;
}
