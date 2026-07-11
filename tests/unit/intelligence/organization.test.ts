/**
 * Sprint 014 — Organizational Intelligence & Continuous Monitoring tests.
 */

import { describe, expect, it, vi } from "vitest";
import {
  createOrganizationalIntelligence,
  createPersistentIntelligenceMemory,
  createEmptyExecutiveContextSection,
  createEmptyFinanceContextSection,
  createEmptyOrganizationContextSection,
  createEmptyStudentContextSection,
  ORGANIZATION_FORECAST_DOMAINS,
  ORGANIZATION_MONITOR_KEYS,
  ORGANIZATIONAL_INTELLIGENCE_VERSION,
  OrganizationThresholds,
  OrganizationMonitors,
  OrganizationAnomalies,
  OrganizationAlerts,
  OrganizationForecasts,
  OrganizationHealth,
  OrganizationObserver,
  InMemoryOrganizationScheduleRunner,
  type OrganizationObservationRequest,
  type OrganizationMetricSample,
} from "@/lib/platform/intelligence";

function sample(
  key: string,
  value: number,
  previousValue?: number,
  label = key
): OrganizationMetricSample {
  return {
    key,
    label,
    value,
    previousValue,
    observedAt: "2026-07-11T12:00:00.000Z",
  };
}

function makeRequest(
  overrides: Partial<OrganizationObservationRequest> = {}
): OrganizationObservationRequest {
  const scope = { organizationId: "org-1", schoolId: "school-1" };
  return {
    requestId: "org-obs-1",
    organizationId: "org-1",
    schoolId: "school-1",
    observedAt: "2026-07-11T12:00:00.000Z",
    metrics: [
      sample("days_cash", 40, 55, "Days of cash"),
      sample("attendance_rate", 94, 93, "Attendance"),
      sample("enrollment_count", 560, 480, "Enrollment"),
      sample("vacancy_rate", 10, 7, "Vacancy"),
      sample("open_findings", 6, 3, "Open findings"),
      sample("execution_health", 42, 60, "Execution health"),
      sample("strategic_goal_progress", 48, 52, "Strategic progress"),
      sample("satisfaction_score", 4.1, 3.9, "Satisfaction"),
    ],
    sharedContext: {
      requestId: "shared-org-1",
      scope,
      executive: createEmptyExecutiveContextSection(scope),
      finance: createEmptyFinanceContextSection(scope),
      student: createEmptyStudentContextSection(scope),
      organization: createEmptyOrganizationContextSection(scope),
      errors: [],
      builtAt: "2026-07-11T12:00:00.000Z",
    },
    executionProgress: [
      {
        subjectKind: "goal",
        subjectId: "goal-1",
        completionPercent: 30,
        healthScore: 42,
        healthLabel: "at_risk",
        riskScore: 0.6,
        velocity: 0.4,
        forecastCompletionDate: null,
        calculatedAt: "2026-07-11T12:00:00.000Z",
        notes: ["Behind"],
        metadata: {},
      },
    ],
    ...overrides,
  };
}

describe("OrganizationThresholds & Monitors", () => {
  it("evaluates all monitors with configurable thresholds", () => {
    const thresholds = new OrganizationThresholds();
    const monitors = new OrganizationMonitors({ thresholds });
    const readings = monitors.evaluate(makeRequest());

    expect(readings).toHaveLength(ORGANIZATION_MONITOR_KEYS.length);
    const cash = readings.find((r) => r.monitor === "cash_flow");
    expect(cash?.status).toBe("critical");
    expect(thresholds.listDefaults().length).toBeGreaterThan(0);
  });
});

describe("anomalies / alerts / forecasts / health", () => {
  it("detects anomalies and generates alerts/forecasts/health", () => {
    const thresholds = new OrganizationThresholds();
    const monitors = new OrganizationMonitors({ thresholds });
    const request = makeRequest();
    const readings = monitors.evaluate(request);

    const anomalies = new OrganizationAnomalies({
      createId: (() => {
        let n = 0;
        return () => `a-${++n}`;
      })(),
    }).detect(request, readings);
    expect(anomalies.some((a) => a.kind === "unexpected_change" || a.kind === "trend_reversal")).toBe(
      true
    );
    expect(anomalies.some((a) => a.kind === "high_risk")).toBe(true);
    expect(anomalies.some((a) => a.kind === "opportunity")).toBe(true);

    const alerts = new OrganizationAlerts({
      now: () => new Date("2026-07-11T12:00:00.000Z"),
      createId: (() => {
        let n = 0;
        return () => `al-${++n}`;
      })(),
    }).generate(request, readings, anomalies, []);
    expect(alerts.some((a) => a.severity === "critical")).toBe(true);

    const forecasts = new OrganizationForecasts({
      createId: (() => {
        let n = 0;
        return () => `f-${++n}`;
      })(),
    }).project(request, readings);
    expect(forecasts).toHaveLength(ORGANIZATION_FORECAST_DOMAINS.length);

    const health = new OrganizationHealth({
      now: () => new Date("2026-07-11T12:00:00.000Z"),
    }).calculate(request, readings);
    expect(health.score).toBeGreaterThanOrEqual(0);
    expect(health.score).toBeLessThanOrEqual(100);
    expect(health.band).toBeTruthy();
  });
});

describe("OrganizationObserver orchestration", () => {
  it("produces a full observation result including brief and timeline", async () => {
    let id = 0;
    const observer = new OrganizationObserver({
      now: () => new Date("2026-07-11T12:00:00.000Z"),
      createId: (prefix) => `${prefix}-${++id}`,
    });

    const result = await observer.observe(makeRequest());
    expect(result.domainVersion).toBe(ORGANIZATIONAL_INTELLIGENCE_VERSION);
    expect(result.readings.length).toBe(ORGANIZATION_MONITOR_KEYS.length);
    expect(result.events.length).toBeGreaterThan(0);
    expect(result.alerts.length).toBeGreaterThan(0);
    expect(result.risks.length).toBeGreaterThan(0);
    expect(result.forecasts.length).toBe(ORGANIZATION_FORECAST_DOMAINS.length);
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.brief.narrative).toContain("Headline:");
    expect(result.timeline.length).toBeGreaterThan(0);
    expect(result.health.summary.length).toBeGreaterThan(0);
  });

  it("persists to Persistent Memory when injected", async () => {
    const memory = createPersistentIntelligenceMemory({
      createId: () => "mem-org-1",
      now: () => new Date("2026-07-11T12:00:00.000Z"),
    });
    const saveSpy = vi.spyOn(memory, "saveMemory");
    const observer = new OrganizationObserver({
      memory,
      now: () => new Date("2026-07-11T12:00:00.000Z"),
      createId: (prefix) => `${prefix}-x`,
    });
    await observer.observe(makeRequest());
    expect(saveSpy).toHaveBeenCalled();
  });
});

describe("scheduler DI", () => {
  it("schedules and runs observations through injected runner", async () => {
    const runner = new InMemoryOrganizationScheduleRunner();
    const { observer, scheduler } = createOrganizationalIntelligence({
      runner,
      now: () => new Date("2026-07-11T13:00:00.000Z"),
      createId: (prefix) => `${prefix}-s`,
    });

    const { jobId } = await scheduler.schedule(makeRequest({ requestId: "sched-1" }));
    expect(jobId).toContain("sched-1");
    expect(runner.listJobs()).toContain(jobId);

    const result = await scheduler.runScheduled(jobId);
    expect(result.requestId).toBe("sched-1");
    expect(result.brief.requestId).toBe("sched-1");
    expect(observer).toBeInstanceOf(OrganizationObserver);
  });
});

describe("integration signals", () => {
  it("consumes execution and collaboration-like inputs", async () => {
    const observer = new OrganizationObserver({
      now: () => new Date("2026-07-11T14:00:00.000Z"),
      createId: (prefix) => `${prefix}-i`,
    });

    const result = await observer.observe(
      makeRequest({
        collaboration: {
          requestId: "collab-org",
          moderated: {
            responses: [],
            mergedRecommendations: [],
            preservedDisagreements: [],
            duplicatesRemoved: 0,
            summary: "n/a",
          },
          consensus: {
            mode: "weighted",
            recommendationKey: "cash-plan",
            title: "Cash recovery plan",
            summary: "Advance cash recovery",
            supportCount: 2,
            totalAgents: 2,
            supportWeight: 2,
            totalWeight: 2,
            unanimous: true,
            overridden: false,
            rationale: [],
          },
          confidence: {
            score: { value: 0.7, level: "medium", factors: [] },
            agreement: 1,
            historicalAccuracy: 0.5,
            evidenceQuality: 0.6,
            memorySimilarity: 0.4,
            sharedContextCompleteness: 0.7,
            uncertainty: 0.3,
            summary: "ok",
          },
          conflicts: { conflicts: [], allowsMultipleStrategies: false, summary: "none" },
          debate: { challenges: [], summary: "none" },
          priorities: { ranked: [], summary: "none" },
          plan: {
            planId: "plan-1",
            steps: [
              {
                stepId: "s1",
                order: 1,
                title: "Confirm",
                instruction: "Confirm cash plan",
                ownerRole: "executive",
                dependsOn: [],
              },
            ],
            summary: "plan",
          },
          execution: {
            packageId: "pkg",
            goal: {
              title: "g",
              description: "d",
              targetDate: "2026-10-01T00:00:00.000Z",
              expectedValue: "v",
            },
            objectives: [],
            initiatives: [],
            tasks: [],
            summary: "exec",
          },
          learning: {
            memoryId: null,
            observations: [],
            recommendations: [],
            trackedForAccuracy: false,
            summary: "n/a",
          },
          telemetry: {
            runId: "collab-org",
            startedAt: "2026-07-11T14:00:00.000Z",
            completedAt: "2026-07-11T14:00:01.000Z",
            executionTimeMs: 1,
            participatingAgents: ["executive"],
            confidence: 0.7,
            consensusMode: "weighted",
            consensusKey: "cash-plan",
            disagreementCount: 0,
          },
          domainVersion: "0.1.0",
          completedAt: "2026-07-11T14:00:01.000Z",
        },
      })
    );

    expect(result.recommendations.some((r) => r.title.includes("collaboration"))).toBe(
      true
    );
    expect(result.opportunities.some((o) => o.title.includes("Cash recovery"))).toBe(
      true
    );
  });
});
