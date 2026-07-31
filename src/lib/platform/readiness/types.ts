/**
 * Platform Hardening & Readiness (Sprint 078).
 * Contracts for operating events, versioning, and baselines — not a new framework.
 */

export type PlatformOperatingEventType =
  | "registration"
  | "validation"
  | "workflow.execution"
  | "decision.created"
  | "notification.dispatch"
  | "automation.execution"
  | "graph.rebuild";

export type PlatformOperatingEvent = {
  id: string;
  type: PlatformOperatingEventType;
  occurredAt: string;
  source: string;
  applicationId: string | null;
  entityType: string | null;
  refId: string | null;
  summary: string;
  metadata: Record<string, unknown>;
};

export type PlatformBaselineMetric = {
  name: string;
  /** Elapsed milliseconds for the measured operation. */
  elapsedMs: number;
  iterations: number;
  measuredAt: string;
  notes?: string;
};

export type PlatformBaselineReport = {
  platformVersion: string;
  measuredAt: string;
  metrics: PlatformBaselineMetric[];
};
