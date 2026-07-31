/**
 * Deterministic platform health score for Executive Intelligence™.
 * Weighted rules only — no AI.
 */

import { createConnectorHealthService } from "@/lib/connectors";
import { listInstallationsForOrganization } from "@/lib/connectors/store";
import {
  listJobsForOrganization,
  queueSummary,
} from "@/lib/evidence-center";
import { listRecentJagPlatformLogs } from "@/lib/jag-platform/logging";
import type { ExecutiveHealthScore } from "@/lib/executive-intelligence/types";

/** Weights sum conceptually to 100 contribution points. */
export const EXECUTIVE_HEALTH_WEIGHTS = Object.freeze({
  failedJobs: 25,
  connectorHealth: 25,
  pendingEvidence: 20,
  recentErrors: 15,
  processingQueue: 15,
});

const THRESHOLDS = Object.freeze({
  failedJobsMax: 5,
  pendingEvidenceMax: 20,
  recentErrorsMax: 10,
  processingQueueMax: 15,
});

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

function labelFor(score: number): ExecutiveHealthScore["label"] {
  if (score >= 85) return "healthy";
  if (score >= 70) return "watch";
  if (score >= 50) return "degraded";
  return "critical";
}

export function calculateExecutiveHealthScore(
  organizationId: string
): ExecutiveHealthScore {
  const jobs = listJobsForOrganization(organizationId);
  const failedJobs = jobs.filter((j) => j.status === "Failed").length;
  const queue = queueSummary(organizationId);
  const pendingEvidence = queue.queued + queue.awaiting_review;
  const processingQueue =
    jobs.filter((j) => j.status === "Pending" || j.status === "Queued" || j.status === "Running")
      .length;

  const installations = listInstallationsForOrganization(organizationId);
  const health = createConnectorHealthService().summarize(organizationId);
  const healthyConnectors = health.healthy;
  const totalConnectors = installations.length;

  const recentErrors = listRecentJagPlatformLogs(100).filter(
    (l) =>
      (l.level === "error" || l.level === "security") &&
      (!l.organizationId || l.organizationId === organizationId)
  ).length;

  const failedPenalty =
    (Math.min(failedJobs, THRESHOLDS.failedJobsMax) / THRESHOLDS.failedJobsMax) *
    EXECUTIVE_HEALTH_WEIGHTS.failedJobs;

  const connectorRatio =
    totalConnectors === 0 ? 1 : healthyConnectors / totalConnectors;
  const connectorPenalty =
    (1 - connectorRatio) * EXECUTIVE_HEALTH_WEIGHTS.connectorHealth;

  const pendingPenalty =
    (Math.min(pendingEvidence, THRESHOLDS.pendingEvidenceMax) /
      THRESHOLDS.pendingEvidenceMax) *
    EXECUTIVE_HEALTH_WEIGHTS.pendingEvidence;

  const errorPenalty =
    (Math.min(recentErrors, THRESHOLDS.recentErrorsMax) /
      THRESHOLDS.recentErrorsMax) *
    EXECUTIVE_HEALTH_WEIGHTS.recentErrors;

  const queuePenalty =
    (Math.min(processingQueue, THRESHOLDS.processingQueueMax) /
      THRESHOLDS.processingQueueMax) *
    EXECUTIVE_HEALTH_WEIGHTS.processingQueue;

  const score = Math.round(
    clamp(
      100 -
        failedPenalty -
        connectorPenalty -
        pendingPenalty -
        errorPenalty -
        queuePenalty
    )
  );

  return {
    score,
    label: labelFor(score),
    inputs: {
      failedJobs,
      healthyConnectors,
      totalConnectors,
      pendingEvidence,
      recentErrors,
      processingQueue,
    },
    weights: EXECUTIVE_HEALTH_WEIGHTS,
  };
}
