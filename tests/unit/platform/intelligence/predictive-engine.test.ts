import { beforeEach, describe, expect, it } from "vitest";
import {
  PredictionRegistry,
  PredictionService,
  clearPredictionObservationsForTests,
  horizonToDays,
  listPredictionObservations,
  type PredictionContext,
} from "@/lib/platform/intelligence/predictive";

function context(partial?: Partial<PredictionContext>): PredictionContext {
  return {
    organizationId: "org-1",
    organizationName: "Test Academy",
    capturedAt: "2026-07-21T12:00:00.000Z",
    signals: [
      {
        id: "ex-1",
        contributorId: "education.cognition.school_health",
        label: "School Health",
        confidence: 0.8,
        summary: "Health watch with operational pressure.",
        warnings: ["capacity strain"],
        blockingIssues: [],
        analyzedAt: "2026-07-21T11:00:00.000Z",
        score: 0.62,
        readiness: "partial",
      },
      {
        id: "ex-2",
        contributorId: "education.cognition.operational_readiness",
        label: "Operational Readiness",
        confidence: 0.75,
        summary: "Ops readiness partial.",
        warnings: ["staffing"],
        blockingIssues: ["schedule gap"],
        analyzedAt: "2026-07-21T11:30:00.000Z",
        readiness: "partial",
      },
    ],
    openDecisionCount: 4,
    overdueDecisionCount: 1,
    p1DecisionCount: 1,
    completedDecisionCount: 2,
    ...partial,
  };
}

describe("Predictive Intelligence Engine (Sprint 201)", () => {
  beforeEach(() => {
    clearPredictionObservationsForTests();
  });

  it("registers eight prediction kinds and standard horizons", () => {
    expect(PredictionRegistry.listKinds()).toHaveLength(8);
    expect(PredictionRegistry.listHorizons()).toEqual([
      "7_days",
      "30_days",
      "90_days",
      "6_months",
      "1_year",
    ]);
    expect(horizonToDays("30_days")).toBe(30);
    expect(horizonToDays({ kind: "custom", days: 14, label: "2 Weeks" })).toBe(
      14
    );
  });

  it("returns advisory forecasts with evidence, assumptions, and confidence", () => {
    const { predictions, observationId, contributorsUsed } =
      PredictionService.forecast({
        context: context(),
        kinds: ["organization_health", "operational_readiness"],
        horizon: "30_days",
      });

    expect(predictions).toHaveLength(2);
    expect(observationId).toMatch(/^pobs-/);
    expect(contributorsUsed.length).toBeGreaterThan(0);

    for (const p of predictions) {
      expect(p.advisoryNotice.toLowerCase()).toContain("advisory");
      expect(p.currentState).toBeDefined();
      expect(p.predictedState).toBeDefined();
      expect(p.confidence).toBeGreaterThanOrEqual(0);
      expect(p.confidence).toBeLessThanOrEqual(1);
      expect(p.primaryDrivers.length).toBeGreaterThan(0);
      expect(p.evidence.length).toBeGreaterThan(0);
      expect(p.assumptions.length).toBeGreaterThan(0);
      expect(p.recommendedPreventiveActions.length).toBeGreaterThan(0);
      expect(p.insufficientData).toBe(false);
    }

    const obs = listPredictionObservations(1)[0];
    expect(obs?.id).toBe(observationId);
    expect(obs?.durationMs).toBeGreaterThanOrEqual(0);
    expect(obs?.inputSummary.signalCount).toBe(2);
  });

  it("withholds invented metrics when unbound", () => {
    const { predictions } = PredictionService.forecast({
      context: context({
        signals: [],
        openDecisionCount: 0,
        overdueDecisionCount: 0,
        p1DecisionCount: 0,
        completedDecisionCount: 0,
      }),
      kinds: ["student_success"],
      horizon: "90_days",
    });

    expect(predictions[0]?.insufficientData).toBe(true);
    expect(predictions[0]?.confidence).toBe(0);
    expect(predictions[0]?.trend).toBe("unknown");
  });

  it("states predicted consequence if a decision remains open", () => {
    const consequence = PredictionService.consequenceIfNoAction({
      context: context(),
      decisionId: "dec-1",
      decisionTitle: "Close staffing gap",
      horizon: "30_days",
      relatedKind: "operational_readiness",
    });

    expect(consequence.statement.toLowerCase()).toContain("remains open");
    expect(consequence.statement.toLowerCase()).toContain("30 days");
    expect(consequence.advisoryNotice.toLowerCase()).toContain("advisory");
    expect(consequence.assumptions.length).toBeGreaterThan(0);
  });
});
