/**
 * Sprint 205 — Strategic Intelligence engine tests.
 */

import { afterEach, describe, expect, it } from "vitest";
import {
  clearStrategyObservationsForTests,
  listStrategyObservations,
  MissionRegistry,
  resetStrategyServiceForTests,
  StrategyService,
  STRATEGIC_PILLAR_KINDS,
} from "@/lib/platform/intelligence/strategy/index";

describe("Strategic Intelligence (Sprint 205)", () => {
  afterEach(() => {
    resetStrategyServiceForTests();
    clearStrategyObservationsForTests();
  });

  it("seeds mission, pillars, goals, and initiatives", () => {
    const ws = StrategyService.workspace("org-1", "North Academy");
    expect(ws.mission?.mission).toMatch(/North Academy/);
    expect(ws.pillars.length).toBe(
      STRATEGIC_PILLAR_KINDS.filter((k) => k !== "custom").length
    );
    expect(ws.goals.length).toBeGreaterThan(0);
    expect(ws.initiatives.length).toBeGreaterThan(0);
    expect(ws.alignmentScore).toBeGreaterThan(0);
  });

  it("evaluates goal health and forecasts achievement", () => {
    StrategyService.ensureOrganization("org-1", "North Academy");
    const evaluations = StrategyService.evaluateGoals("org-1");
    expect(evaluations.length).toBeGreaterThan(0);
    expect(evaluations[0]!.health).toBeTruthy();

    const forecast = StrategyService.forecast("org-1");
    expect(forecast.goalForecasts.length).toBeGreaterThan(0);
    expect(forecast.goalForecasts[0]!.achievementProbability).toBeGreaterThan(0);
    expect(forecast.advisoryNotice).toMatch(/advisory/i);
  });

  it("aligns decisions to pillars and goals", () => {
    StrategyService.ensureOrganization("org-1", "North Academy");
    const alignment = StrategyService.alignDecision({
      organizationId: "org-1",
      decisionId: "dec-1",
      title: "Hire teachers to reduce turnover",
      description: "Staffing investment after attrition spike.",
      tags: ["teacher", "staffing"],
    });
    expect(alignment.missionAlignment).toBeGreaterThan(0);
    expect(alignment.impact).toMatch(/positive|negative|unknown/);
    expect(alignment.pillarIds.length + alignment.goalIds.length).toBeGreaterThan(0);
  });

  it("builds scorecard with improving and at-risk goals", () => {
    const card = StrategyService.scorecard("org-1", "North Academy");
    expect(card.missionSummary).toBeTruthy();
    expect(card.pillarSummaries.length).toBeGreaterThan(0);
    expect(card.advisoryNotice).toMatch(/advisory/i);
  });

  it("records observability for mission, evaluation, alignment, scorecard", () => {
    StrategyService.ensureOrganization("org-1", "North Academy");
    const mission = StrategyService.getMission("org-1")!;
    StrategyService.updateMission({
      ...mission,
      mission: "Custom mission",
      updatedBy: "tester",
      updatedAt: new Date().toISOString(),
    });
    StrategyService.evaluateGoals("org-1");
    StrategyService.alignDecision({
      organizationId: "org-1",
      decisionId: "dec-obs",
      title: "Budget contingency for funding shortage",
      description: "Funding readiness plan",
      tags: ["funding", "budget"],
    });
    StrategyService.scorecard("org-1", "North Academy");

    const kinds = new Set(listStrategyObservations().map((o) => o.kind));
    expect(kinds.has("mission_update")).toBe(true);
    expect(kinds.has("goal_evaluation")).toBe(true);
    expect(kinds.has("alignment_calculation")).toBe(true);
    expect(kinds.has("scorecard_generation")).toBe(true);
  });

  it("updates mission via MissionRegistry", () => {
    StrategyService.ensureOrganization("org-1", "North Academy");
    const m = MissionRegistry.get("org-1")!;
    StrategyService.updateMission({
      ...m,
      mission: "Updated mission statement",
      updatedBy: "exec",
      updatedAt: new Date().toISOString(),
    });
    expect(StrategyService.getMission("org-1")?.mission).toBe(
      "Updated mission statement"
    );
  });
});
