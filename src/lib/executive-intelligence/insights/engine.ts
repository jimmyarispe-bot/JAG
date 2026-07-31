/**
 * InsightEngine — evaluates rules and persists insight lifecycle.
 */

import { randomUUID } from "node:crypto";
import { emitJagPlatformEvent } from "@/lib/jag-platform/events";
import { stableInsightId } from "@/lib/executive-intelligence/insights/helpers";
import {
  createInsightRuleRegistry,
  type InsightRuleRegistry,
} from "@/lib/executive-intelligence/insights/registry";
import { DEFAULT_INSIGHT_RULES } from "@/lib/executive-intelligence/insights/rules";
import {
  appendInsightTimeline,
  getInsight,
  listInsightsForOrganization,
  upsertInsight,
} from "@/lib/executive-intelligence/insights/store";
import type {
  ExecutiveInsight,
  InsightRule,
  InsightSeverity,
} from "@/lib/executive-intelligence/insights/types";

export type InsightEngine = {
  readonly registry: InsightRuleRegistry;
  evaluateOrganization(input: {
    organizationId: string;
    actor?: string;
    now?: Date;
  }): {
    readonly active: readonly ExecutiveInsight[];
    readonly created: number;
    readonly severityChanged: number;
    readonly resolved: number;
    readonly evaluatedAt: string;
  };
  resolveInsight(input: {
    organizationId: string;
    insightId: string;
    actor?: string;
  }): ExecutiveInsight | null;
};

function emitInsightEvent(input: {
  organizationId: string;
  insightId: string;
  eventType: string;
  actor: string;
  metadata?: Record<string, string>;
}): void {
  emitJagPlatformEvent({
    organizationId: input.organizationId,
    sourceModule: "executive-intelligence",
    entityType: "ExecutiveInsight",
    entityId: input.insightId,
    eventType: input.eventType,
    actor: input.actor,
    metadata: input.metadata,
  });
}

function recordTimeline(input: {
  organizationId: string;
  insightId: string;
  ruleId: string;
  kind: "created" | "severity_changed" | "resolved";
  message: string;
  fromSeverity: InsightSeverity | null;
  toSeverity: InsightSeverity | null;
  at: string;
}): void {
  appendInsightTimeline({
    id: randomUUID(),
    organizationId: input.organizationId,
    insightId: input.insightId,
    ruleId: input.ruleId,
    kind: input.kind,
    at: input.at,
    message: input.message,
    fromSeverity: input.fromSeverity,
    toSeverity: input.toSeverity,
  });
}

export function createInsightEngine(deps?: {
  registry?: InsightRuleRegistry;
  rules?: readonly InsightRule[];
}): InsightEngine {
  const registry =
    deps?.registry ??
    createInsightRuleRegistry(deps?.rules ?? DEFAULT_INSIGHT_RULES);

  return {
    registry,

    evaluateOrganization(input) {
      const now = input.now ?? new Date();
      const evaluatedAt = now.toISOString();
      const actor = input.actor ?? "system";
      const ctx = { organizationId: input.organizationId, now };
      const firing = new Map<string, ReturnType<InsightRule["evaluate"]>>();

      for (const rule of registry.list()) {
        firing.set(rule.id, rule.evaluate(ctx));
      }

      let created = 0;
      let severityChanged = 0;
      let resolved = 0;

      for (const rule of registry.list()) {
        const hit = firing.get(rule.id) ?? null;
        const insightId = stableInsightId(input.organizationId, rule.id);
        const existing = getInsight(input.organizationId, insightId);

        if (!hit) {
          if (existing && existing.status === "Active") {
            const updated: ExecutiveInsight = {
              ...existing,
              status: "Resolved",
              resolvedAt: evaluatedAt,
              updatedAt: evaluatedAt,
            };
            upsertInsight(updated);
            recordTimeline({
              organizationId: input.organizationId,
              insightId,
              ruleId: rule.id,
              kind: "resolved",
              message: "Condition cleared — insight auto-resolved.",
              fromSeverity: existing.severity,
              toSeverity: existing.severity,
              at: evaluatedAt,
            });
            emitInsightEvent({
              organizationId: input.organizationId,
              insightId,
              eventType: "insight.resolved",
              actor,
              metadata: { ruleId: rule.id, reason: "condition_cleared" },
            });
            resolved += 1;
          }
          continue;
        }

        if (!existing) {
          const insight: ExecutiveInsight = {
            id: insightId,
            organizationId: input.organizationId,
            ruleId: rule.id,
            domain: rule.domain,
            severity: hit.severity,
            title: hit.title,
            description: hit.description,
            supportingEvidenceIds: Object.freeze([...hit.supportingEvidenceIds]),
            supportingEvidence: Object.freeze([...hit.supportingEvidence]),
            relatedConnectorIds: Object.freeze([...hit.relatedConnectorIds]),
            relatedGraphNodeIds: Object.freeze([...hit.relatedGraphNodeIds]),
            suggestedNextStep: hit.suggestedNextStep,
            status: "Active",
            createdAt: evaluatedAt,
            updatedAt: evaluatedAt,
            resolvedAt: null,
          };
          upsertInsight(insight);
          recordTimeline({
            organizationId: input.organizationId,
            insightId,
            ruleId: rule.id,
            kind: "created",
            message: `Insight created from rule ${rule.id}.`,
            fromSeverity: null,
            toSeverity: hit.severity,
            at: evaluatedAt,
          });
          emitInsightEvent({
            organizationId: input.organizationId,
            insightId,
            eventType: "insight.created",
            actor,
            metadata: {
              ruleId: rule.id,
              severity: hit.severity,
              domain: rule.domain,
            },
          });
          created += 1;
          continue;
        }

        const severityChangedNow = existing.severity !== hit.severity;
        const wasResolved = existing.status === "Resolved";
        const updated: ExecutiveInsight = {
          ...existing,
          domain: rule.domain,
          severity: hit.severity,
          title: hit.title,
          description: hit.description,
          supportingEvidenceIds: Object.freeze([...hit.supportingEvidenceIds]),
          supportingEvidence: Object.freeze([...hit.supportingEvidence]),
          relatedConnectorIds: Object.freeze([...hit.relatedConnectorIds]),
          relatedGraphNodeIds: Object.freeze([...hit.relatedGraphNodeIds]),
          suggestedNextStep: hit.suggestedNextStep,
          status: "Active",
          resolvedAt: null,
          updatedAt: evaluatedAt,
          createdAt: existing.createdAt,
        };
        upsertInsight(updated);

        if (wasResolved) {
          recordTimeline({
            organizationId: input.organizationId,
            insightId,
            ruleId: rule.id,
            kind: "created",
            message: `Insight re-opened from rule ${rule.id}.`,
            fromSeverity: null,
            toSeverity: hit.severity,
            at: evaluatedAt,
          });
          emitInsightEvent({
            organizationId: input.organizationId,
            insightId,
            eventType: "insight.created",
            actor,
            metadata: { ruleId: rule.id, severity: hit.severity, reopened: "true" },
          });
          created += 1;
        } else if (severityChangedNow) {
          recordTimeline({
            organizationId: input.organizationId,
            insightId,
            ruleId: rule.id,
            kind: "severity_changed",
            message: `Severity changed from ${existing.severity} to ${hit.severity}.`,
            fromSeverity: existing.severity,
            toSeverity: hit.severity,
            at: evaluatedAt,
          });
          emitInsightEvent({
            organizationId: input.organizationId,
            insightId,
            eventType: "insight.severity_changed",
            actor,
            metadata: {
              ruleId: rule.id,
              fromSeverity: existing.severity,
              toSeverity: hit.severity,
            },
          });
          severityChanged += 1;
        }
      }

      const active = listInsightsForOrganization(input.organizationId).filter(
        (i) => i.status === "Active"
      );

      return {
        active: Object.freeze(active),
        created,
        severityChanged,
        resolved,
        evaluatedAt,
      };
    },

    resolveInsight(input) {
      const existing = getInsight(input.organizationId, input.insightId);
      if (!existing || existing.status === "Resolved") return existing;
      const at = new Date().toISOString();
      const updated: ExecutiveInsight = {
        ...existing,
        status: "Resolved",
        resolvedAt: at,
        updatedAt: at,
      };
      upsertInsight(updated);
      recordTimeline({
        organizationId: input.organizationId,
        insightId: existing.id,
        ruleId: existing.ruleId,
        kind: "resolved",
        message: "Insight resolved by operator.",
        fromSeverity: existing.severity,
        toSeverity: existing.severity,
        at,
      });
      emitInsightEvent({
        organizationId: input.organizationId,
        insightId: existing.id,
        eventType: "insight.resolved",
        actor: input.actor ?? "operator",
        metadata: { ruleId: existing.ruleId, reason: "manual" },
      });
      return updated;
    },
  };
}

let singleton: InsightEngine | null = null;

export function getInsightEngine(): InsightEngine {
  if (!singleton) singleton = createInsightEngine();
  return singleton;
}

export function resetInsightEngineForTests(): void {
  singleton = null;
}
