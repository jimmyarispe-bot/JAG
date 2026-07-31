/**
 * Deterministic executive alerts — rule-based only.
 */

import { createHash } from "node:crypto";
import {
  getQuickBooksInstallation,
  listInstallationsForOrganization,
} from "@/lib/connectors";
import {
  listJobsForOrganization,
  queueSummary,
} from "@/lib/evidence-center";
import { calculateExecutiveHealthScore } from "@/lib/executive-intelligence/health-service";
import type { ExecutiveAlert } from "@/lib/executive-intelligence/types";

const QUEUE_THRESHOLD = 10;
const QBO_STALE_MS = 7 * 24 * 60 * 60 * 1000;

function alertId(code: string, organizationId: string): string {
  return createHash("sha256")
    .update(`${organizationId}:${code}`)
    .digest("hex")
    .slice(0, 16);
}

export function generateExecutiveAlerts(
  organizationId: string
): readonly ExecutiveAlert[] {
  const now = new Date().toISOString();
  const alerts: ExecutiveAlert[] = [];
  const jobs = listJobsForOrganization(organizationId);
  const waiting = jobs.filter(
    (j) => j.status === "Pending" || j.status === "Queued" || j.status === "Running"
  ).length;
  const queue = queueSummary(organizationId);
  const health = calculateExecutiveHealthScore(organizationId);

  if (waiting > QUEUE_THRESHOLD) {
    alerts.push({
      id: alertId("QUEUE_THRESHOLD", organizationId),
      code: "QUEUE_THRESHOLD",
      severity: "warning",
      title: "Processing queue exceeds threshold",
      message: `${waiting} jobs are waiting or running (threshold ${QUEUE_THRESHOLD}).`,
      organizationId,
      createdAt: now,
    });
  }

  const disconnected = listInstallationsForOrganization(organizationId).filter(
    (i) =>
      i.status === "Disconnected" ||
      i.status === "Error" ||
      (!i.enabled && i.status !== "Not Installed")
  );
  if (disconnected.length > 0) {
    alerts.push({
      id: alertId("CONNECTOR_DISCONNECTED", organizationId),
      code: "CONNECTOR_DISCONNECTED",
      severity: "critical",
      title: "Connector disconnected",
      message: `${disconnected.length} connector installation(s) are disconnected, disabled, or in error.`,
      organizationId,
      createdAt: now,
    });
  }

  if (queue.awaiting_review > 0) {
    alerts.push({
      id: alertId("EVIDENCE_AWAITING_REVIEW", organizationId),
      code: "EVIDENCE_AWAITING_REVIEW",
      severity: "info",
      title: "Evidence awaiting review",
      message: `${queue.awaiting_review} evidence record(s) await review.`,
      organizationId,
      createdAt: now,
    });
  }

  const qbo = getQuickBooksInstallation(organizationId);
  if (qbo && qbo.status === "Connected") {
    const last = qbo.lastSyncAt ? Date.parse(qbo.lastSyncAt) : 0;
    if (!last || Date.now() - last > QBO_STALE_MS) {
      alerts.push({
        id: alertId("QBO_SYNC_STALE", organizationId),
        code: "QBO_SYNC_STALE",
        severity: "warning",
        title: "QuickBooks has not synchronized recently",
        message: qbo.lastSyncAt
          ? `Last sync was ${qbo.lastSyncAt}.`
          : "QuickBooks is connected but has never synchronized.",
        organizationId,
        createdAt: now,
      });
    }
  }

  if (health.label === "degraded" || health.label === "critical") {
    alerts.push({
      id: alertId("PLATFORM_HEALTH_DEGRADED", organizationId),
      code: "PLATFORM_HEALTH_DEGRADED",
      severity: health.label === "critical" ? "critical" : "warning",
      title: "Platform health degraded",
      message: `Executive health score is ${health.score} (${health.label}).`,
      organizationId,
      createdAt: now,
    });
  }

  return Object.freeze(alerts);
}
