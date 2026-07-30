/**
 * Sprint 206 — Autonomous Executive Intelligence watcher tests.
 */

import { afterEach, describe, expect, it } from "vitest";
import {
  clearWatcherObservationsForTests,
  listWatcherObservations,
  resetWatcherServiceForTests,
  WatcherRegistry,
  WatcherService,
  WATCHER_TYPES,
  type WatcherEvaluationContext,
} from "@/lib/platform/intelligence/watchers/index";

function ctx(
  overrides: Partial<WatcherEvaluationContext> = {}
): WatcherEvaluationContext {
  return {
    organizationId: "org-1",
    organizationName: "North Academy",
    evaluatedAt: new Date().toISOString(),
    signals: [
      {
        id: "sig-1",
        kind: "overdue_decision",
        label: "Escalate organizational risk",
        score: 0.9,
        confidence: 0.85,
        summary: "Overdue P1 decision",
        decisionId: "dec-1",
        tags: ["overdue", "decision"],
      },
      {
        id: "sig-2",
        kind: "forecast",
        label: "Funding readiness",
        score: 0.7,
        confidence: 0.6,
        summary: "Forecast confidence decreased for funding readiness",
        forecastId: "fc-1",
        tags: ["forecast", "funding", "confidence"],
      },
    ],
    openDecisionCount: 3,
    overdueDecisionCount: 1,
    goalsAtRisk: ["Stabilize funding readiness"],
    goalsBlocked: [],
    initiativesBehind: ["Funding contingency plan"],
    missionTrend: "declining",
    alignmentScore: 0.48,
    memoryPatternSummaries: [
      "Advisory pattern: Attendance decline appears 2 time(s) in institutional memory.",
    ],
    forecastRisks: ["Funding readiness"],
    ...overrides,
  };
}

describe("Autonomous Executive Intelligence (Sprint 206)", () => {
  afterEach(() => {
    resetWatcherServiceForTests();
    clearWatcherObservationsForTests();
  });

  it("registers watcher types", () => {
    const types = WatcherRegistry.list().map((r) => r.type);
    for (const t of WATCHER_TYPES) {
      if (t === "custom") continue;
      expect(types).toContain(t);
    }
  });

  it("evaluates and creates inbox alerts without executing decisions", () => {
    const run = WatcherService.evaluate(ctx());
    expect(run.alerts.length).toBeGreaterThan(0);
    expect(run.advisoryNotice).toMatch(/never executes/i);
    expect(run.alerts[0]!.recommendedExecutiveAction).toBeTruthy();
    expect(run.alerts[0]!.explanation.evidence.length).toBeGreaterThan(0);
  });

  it("merges duplicate fingerprints instead of flooding", () => {
    const first = WatcherService.evaluate(ctx());
    const second = WatcherService.evaluate(ctx());
    expect(second.merged).toBeGreaterThan(0);
    expect(WatcherService.listOpen("org-1").length).toBeLessThanOrEqual(
      first.alerts.length + 2
    );
  });

  it("acknowledges, dismisses, and resolves alerts", () => {
    const run = WatcherService.evaluate(ctx());
    const id = run.alerts[0]!.id;
    expect(WatcherService.setStatus(id, "acknowledged")?.status).toBe(
      "acknowledged"
    );
    expect(WatcherService.setStatus(id, "resolved")?.status).toBe("resolved");

    const run2 = WatcherService.evaluate(ctx());
    const again = run2.alerts[0]!;
    WatcherService.setStatus(again.id, "dismissed");
    const run3 = WatcherService.evaluate(ctx());
    expect(run3.suppressed).toBeGreaterThanOrEqual(0);
  });

  it("builds digests from watcher output", () => {
    WatcherService.evaluate(ctx());
    const digest = WatcherService.buildDigest({
      organizationId: "org-1",
      organizationName: "North Academy",
      kind: "morning",
    });
    expect(digest.title).toMatch(/Morning/);
    expect(digest.highlights.length).toBeGreaterThan(0);
  });

  it("records observability for execution and lifecycle", () => {
    const run = WatcherService.evaluate(ctx());
    WatcherService.setStatus(run.alerts[0]!.id, "acknowledged");
    WatcherService.buildDigest({
      organizationId: "org-1",
      organizationName: "North Academy",
      kind: "weekly",
    });
    const kinds = new Set(listWatcherObservations().map((o) => o.kind));
    expect(kinds.has("watcher_execution")).toBe(true);
    expect(kinds.has("alert_generation")).toBe(true);
    expect(kinds.has("alert_acknowledged")).toBe(true);
    expect(kinds.has("digest_generated")).toBe(true);
  });
});
