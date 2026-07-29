import { beforeEach, describe, expect, it } from "vitest";
import {
  ScenarioRegistry,
  ScenarioService,
  clearScenarioObservationsForTests,
  compareScenarios,
  listScenarioObservations,
  type ScenarioBaseline,
} from "@/lib/platform/intelligence/scenarios";

function baseline(partial?: Partial<ScenarioBaseline>): ScenarioBaseline {
  return {
    organizationId: "org-1",
    organizationName: "Test Academy",
    capturedAt: "2026-07-21T12:00:00.000Z",
    signals: [
      {
        id: "s1",
        contributorId: "education.cognition.school_health",
        label: "School Health",
        confidence: 0.8,
        summary: "Watch stance",
        score: 0.62,
        warnings: [],
        blockingIssues: [],
      },
    ],
    openDecisionCount: 2,
    healthScore: 0.62,
    healthStance: "watch",
    ...partial,
  };
}

describe("Scenario Planning Engine (Sprint 202)", () => {
  beforeEach(() => {
    clearScenarioObservationsForTests();
  });

  it("registers eleven scenario kinds including custom", () => {
    expect(ScenarioRegistry.listKinds()).toHaveLength(11);
    expect(ScenarioRegistry.listTemplates().some((t) => t.kind === "custom")).toBe(
      true
    );
  });

  it("returns advisory scenario with inputs, assumptions, impacts, confidence", () => {
    const { results, observationId } = ScenarioService.runTemplate({
      baseline: baseline(),
      kind: "teacher_hiring",
      overrides: { headcount: 5, staffCount: 5, timelineDays: 60 },
    });

    expect(results).toHaveLength(1);
    const r = results[0]!;
    expect(r.advisoryNotice.toLowerCase()).toContain("advisory");
    expect(r.inputs.headcount).toBe(5);
    expect(r.currentState).toBeDefined();
    expect(r.scenarioState).toBeDefined();
    expect(r.projectedDifference.dimensions.length).toBeGreaterThan(0);
    expect(r.assumptions.length).toBeGreaterThan(0);
    expect(r.primaryDrivers.length).toBeGreaterThan(0);
    expect(r.tradeOffs.length).toBeGreaterThan(0);
    expect(r.confidence).toBeGreaterThan(0);
    expect(observationId).toMatch(/^sobs-/);
    expect(listScenarioObservations(1)[0]?.id).toBe(observationId);
  });

  it("compares multiple scenarios side-by-side including current", () => {
    const b = baseline();
    const { results, comparison } = ScenarioService.compare({
      baseline: b,
      specs: [
        {
          kind: "teacher_hiring",
          inputs: {
            organizationId: b.organizationId,
            organizationName: b.organizationName,
            headcount: 5,
            timelineDays: 60,
          },
        },
        {
          kind: "teacher_hiring",
          inputs: {
            organizationId: b.organizationId,
            organizationName: b.organizationName,
            headcount: 10,
            timelineDays: 60,
            customLabel: "Hire 10 Teachers",
          },
        },
        {
          kind: "enrollment_decline",
          inputs: {
            organizationId: b.organizationId,
            organizationName: b.organizationName,
            enrollmentPercent: -10,
            timelineDays: 90,
          },
        },
      ],
    });

    expect(results).toHaveLength(3);
    expect(comparison).not.toBeNull();
    expect(comparison!.rows.some((r) => r.scenarioId === "current")).toBe(true);
    expect(comparison!.mostFavorableId).toBeTruthy();
    expect(comparison!.highestConfidenceId).toBeTruthy();
    expect(comparison!.advisoryNotice.toLowerCase()).toContain("advisory");

    const again = compareScenarios({
      organizationId: b.organizationId,
      results,
    });
    expect(again.rows.length).toBe(4);
  });

  it("supports decision what-if approve / defer / reject", () => {
    const approve = ScenarioService.decisionWhatIf({
      baseline: baseline(),
      decisionId: "d1",
      decisionTitle: "Hire cohort",
      branch: "approve",
      category: "operations",
    });
    const reject = ScenarioService.decisionWhatIf({
      baseline: baseline(),
      decisionId: "d1",
      decisionTitle: "Hire cohort",
      branch: "reject",
      category: "operations",
    });

    expect(approve.statement.toLowerCase()).toContain("approve");
    expect(reject.statement.toLowerCase()).toContain("reject");
    expect(approve.scenario.advisoryNotice.toLowerCase()).toContain("advisory");
  });
});
