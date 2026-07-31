/**
 * DecisionService — create / read / patch decisions (deterministic).
 */

import { createHash, randomUUID } from "node:crypto";
import {
  defaultDueDateIso,
  INSIGHT_DECISION_MIN_SEVERITY,
  priorityFromSeverity,
  RECOMMENDED_PROCESS_BY_CATEGORY,
} from "@/lib/executive-intelligence/decisions/config";
import { createDecisionAssignmentService } from "@/lib/executive-intelligence/decisions/assignment";
import { createDecisionHistoryService } from "@/lib/executive-intelligence/decisions/history";
import {
  createDecisionMetricsService,
  listOpenDecisions,
} from "@/lib/executive-intelligence/decisions/metrics";
import {
  appendDecisionTimeline,
  findDecisionByExternalKey,
  getDecision,
  listDecisionsForOrganization,
  upsertDecision,
} from "@/lib/executive-intelligence/decisions/store";
import { createDecisionWorkflow } from "@/lib/executive-intelligence/decisions/workflow";
import type {
  CreateDecisionInput,
  DecisionCategory,
  JagDecision,
  PatchDecisionInput,
} from "@/lib/executive-intelligence/decisions/types";
import { evaluateExecutiveInsights } from "@/lib/executive-intelligence/insights/evaluation-service";
import { emitJagPlatformEvent } from "@/lib/jag-platform/events";

const SEVERITY_RANK = { Info: 0, Warning: 1, Critical: 2 } as const;

function decisionIdFromKey(organizationId: string, key: string): string {
  return createHash("sha256")
    .update(`${organizationId}:decision:${key}`)
    .digest("hex")
    .slice(0, 20);
}

export type DecisionService = {
  create(input: CreateDecisionInput): JagDecision;
  get(organizationId: string, decisionId: string): JagDecision | null;
  list(organizationId: string): readonly JagDecision[];
  listOpen(organizationId: string): readonly JagDecision[];
  listAssigned(
    organizationId: string,
    targetId?: string
  ): readonly JagDecision[];
  patch(input: PatchDecisionInput): JagDecision | null;
  syncFromInsights(
    organizationId: string,
    actor?: string
  ): { readonly created: number; readonly updated: number };
};

export function createDecisionService(): DecisionService {
  const workflow = createDecisionWorkflow();
  const assignment = createDecisionAssignmentService();

  const service: DecisionService = {
    create(input) {
      const now = new Date().toISOString();
      const severity = input.severity ?? "Info";
      const id = input.externalKey
        ? decisionIdFromKey(input.organizationId, input.externalKey)
        : randomUUID();

      const existing = input.externalKey
        ? findDecisionByExternalKey(input.organizationId, input.externalKey)
        : null;
      if (existing) return existing;

      const decision: JagDecision = {
        id,
        organizationId: input.organizationId,
        category: input.category,
        title: input.title,
        description: input.description,
        severity,
        priority: input.priority ?? priorityFromSeverity(severity),
        status: input.initialStatus ?? "Detected",
        source: input.source ?? "Manual",
        trigger: input.trigger ?? "Manual creation",
        recommendedProcess:
          input.recommendedProcess ??
          RECOMMENDED_PROCESS_BY_CATEGORY[input.category],
        owner: null,
        createdAt: now,
        updatedAt: now,
        dueDate: input.dueDate ?? defaultDueDateIso(severity),
        resolvedAt: null,
        closedAt: null,
        relatedInsightIds: Object.freeze([
          ...(input.relatedInsightIds ?? []),
        ]),
        relatedEvidenceIds: Object.freeze([
          ...(input.relatedEvidenceIds ?? []),
        ]),
        relatedConnectorIds: Object.freeze([
          ...(input.relatedConnectorIds ?? []),
        ]),
        relatedGraphNodeIds: Object.freeze([
          ...(input.relatedGraphNodeIds ?? []),
        ]),
        department: input.department ?? null,
        businessUnit: input.businessUnit ?? null,
        externalKey: input.externalKey ?? null,
        createdBy: input.createdBy,
      };

      upsertDecision(decision);
      appendDecisionTimeline({
        id: randomUUID(),
        organizationId: input.organizationId,
        decisionId: id,
        kind: "created",
        at: now,
        actor: input.createdBy,
        message: `Decision created from ${decision.source}.`,
        fromStatus: null,
        toStatus: decision.status,
        metadata: { source: decision.source, category: decision.category },
      });
      emitJagPlatformEvent({
        organizationId: input.organizationId,
        sourceModule: "decisions",
        entityType: "JagDecision",
        entityId: id,
        eventType: "decision.created",
        actor: input.createdBy,
        metadata: {
          source: decision.source,
          status: decision.status,
          severity: decision.severity,
        },
      });
      return decision;
    },

    get: getDecision,
    list: listDecisionsForOrganization,
    listOpen: listOpenDecisions,

    listAssigned(organizationId, targetId) {
      return Object.freeze(
        listDecisionsForOrganization(organizationId).filter((d) => {
          if (!d.owner) return false;
          if (targetId) return d.owner.targetId === targetId;
          return true;
        })
      );
    },

    patch(input) {
      const current = getDecision(input.organizationId, input.decisionId);
      if (!current) return null;
      const now = new Date().toISOString();

      if (input.assignment) {
        return assignment.assign({
          organizationId: input.organizationId,
          decisionId: input.decisionId,
          actor: input.actor,
          targetType: input.assignment.targetType,
          targetId: input.assignment.targetId,
          targetLabel: input.assignment.targetLabel,
          reason: input.assignment.reason,
        });
      }

      let status = current.status;
      if (input.status && input.status !== current.status) {
        workflow.assertTransition(current.status, input.status);
        status = input.status;
      }

      const updated: JagDecision = {
        ...current,
        title: input.title ?? current.title,
        description: input.description ?? current.description,
        severity: input.severity ?? current.severity,
        priority: input.priority ?? current.priority,
        dueDate:
          input.dueDate !== undefined ? input.dueDate : current.dueDate,
        department:
          input.department !== undefined
            ? input.department
            : current.department,
        businessUnit:
          input.businessUnit !== undefined
            ? input.businessUnit
            : current.businessUnit,
        status,
        updatedAt: now,
        resolvedAt:
          status === "Resolved" || status === "Closed"
            ? (current.resolvedAt ?? now)
            : current.resolvedAt,
        closedAt: status === "Closed" ? (current.closedAt ?? now) : null,
      };
      upsertDecision(updated);

      if (status !== current.status) {
        const kind =
          status === "Resolved"
            ? "resolved"
            : status === "Closed"
              ? "closed"
              : "status_changed";
        appendDecisionTimeline({
          id: randomUUID(),
          organizationId: input.organizationId,
          decisionId: current.id,
          kind,
          at: now,
          actor: input.actor,
          message: `Status changed from ${current.status} to ${status}.`,
          fromStatus: current.status,
          toStatus: status,
          metadata: {},
        });
        emitJagPlatformEvent({
          organizationId: input.organizationId,
          sourceModule: "decisions",
          entityType: "JagDecision",
          entityId: current.id,
          eventType: `decision.${kind === "status_changed" ? "status_changed" : kind}`,
          actor: input.actor,
          metadata: {
            fromStatus: current.status,
            toStatus: status,
          },
        });
      }

      return updated;
    },

    syncFromInsights(organizationId, actor = "system") {
      const section = evaluateExecutiveInsights(organizationId, actor);
      const minRank = SEVERITY_RANK[INSIGHT_DECISION_MIN_SEVERITY];
      let created = 0;
      let updated = 0;

      for (const insight of section.active) {
        if (SEVERITY_RANK[insight.severity] < minRank) continue;

        const externalKey = `insight:${insight.id}`;
        const existing = findDecisionByExternalKey(
          organizationId,
          externalKey
        );
        const domain = insight.domain as DecisionCategory;
        const category: DecisionCategory =
          domain === "Finance" ||
          domain === "Operations" ||
          domain === "Knowledge" ||
          domain === "Organization"
            ? domain
            : "Manual";

        if (!existing) {
          service.create({
            organizationId,
            category,
            title: insight.title,
            description: insight.description,
            severity: insight.severity,
            priority: priorityFromSeverity(insight.severity),
            source: "Insight",
            trigger: `Insight rule ${insight.ruleId}`,
            recommendedProcess: RECOMMENDED_PROCESS_BY_CATEGORY[category],
            dueDate: defaultDueDateIso(insight.severity),
            relatedInsightIds: [insight.id],
            relatedEvidenceIds: insight.supportingEvidenceIds,
            relatedConnectorIds: insight.relatedConnectorIds,
            relatedGraphNodeIds: insight.relatedGraphNodeIds,
            externalKey,
            createdBy: actor,
            initialStatus: "Detected",
          });
          created += 1;
          continue;
        }

        if (existing.status === "Resolved" || existing.status === "Closed") {
          continue;
        }

        upsertDecision({
          ...existing,
          title: insight.title,
          description: insight.description,
          severity: insight.severity,
          priority: priorityFromSeverity(insight.severity),
          relatedEvidenceIds: Object.freeze([
            ...insight.supportingEvidenceIds,
          ]),
          relatedConnectorIds: Object.freeze([
            ...insight.relatedConnectorIds,
          ]),
          relatedGraphNodeIds: Object.freeze([
            ...insight.relatedGraphNodeIds,
          ]),
          updatedAt: new Date().toISOString(),
        });
        updated += 1;
      }

      return { created, updated };
    },
  };

  return service;
}

let singleton: DecisionService | null = null;

export function getDecisionService(): DecisionService {
  if (!singleton) singleton = createDecisionService();
  return singleton;
}

export function resetDecisionServiceForTests(): void {
  singleton = null;
}

export function getDecisionDetail(organizationId: string, decisionId: string) {
  const decision = getDecision(organizationId, decisionId);
  if (!decision) return null;
  const history = createDecisionHistoryService();
  const metrics = createDecisionMetricsService();
  return {
    decision,
    timeline: history.listDecisionEvents(organizationId, decisionId),
    audit: history.listAuditEvents(organizationId, decisionId),
    reassignments: createDecisionAssignmentService().listHistory(decisionId),
    summary: metrics.summarize(organizationId),
  };
}
