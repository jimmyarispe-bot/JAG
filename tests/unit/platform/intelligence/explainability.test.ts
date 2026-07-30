/**
 * Sprint 208 — Explainability & Intelligence Graph Explorer.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  ExplanationService,
  listExplainObservations,
  resetExplainabilityForTests,
} from "@/lib/platform/intelligence/explain/index";
import { resetCapabilitiesForTests } from "@/lib/platform/capabilities";
import { StrategyService } from "@/lib/platform/intelligence/strategy/index";

describe("Explainability (Sprint 208)", () => {
  beforeEach(() => {
    resetExplainabilityForTests();
    resetCapabilitiesForTests();
  });

  it("builds an organization graph seed with goals and capabilities", () => {
    StrategyService.ensureOrganization("org-a", "Academy A");
    const seed = ExplanationService.queryGraph("org-a", "Academy A", {
      limit: 80,
      depth: 2,
    });
    expect(seed.nodes.length).toBeGreaterThan(0);
    expect(seed.nodes.some((n) => n.kind === "organization")).toBe(true);
    expect(seed.nodes.some((n) => n.kind === "goal" || n.kind === "capability")).toBe(
      true
    );
    expect(seed.advisoryNotice.toLowerCase()).toContain("reasoning");
  });

  it("explains a decision with confidence and reasoning chain", () => {
    const expl = ExplanationService.explainDecision({
      organizationId: "org-a",
      decisionId: "dec-1",
      title: "Escalate risk",
      rationale: "Ops pressure elevated.",
      confidence: 0.82,
      contributorId: "education.cognition.school_health",
      goalTitles: ["Stabilize campus health"],
    });
    expect(expl.reasoningChain.length).toBeGreaterThan(0);
    expect(expl.confidence.score).toBeGreaterThan(0);
    expect(expl.confidence.band).not.toBe("none");
    expect(expl.evidence.length).toBeGreaterThan(0);
    expect(expl.assumptions.length).toBeGreaterThan(0);
    expect(listExplainObservations().length).toBeGreaterThan(0);
  });

  it("caches explanations and marks cache hits", () => {
    const a = ExplanationService.explainDecision({
      organizationId: "org-a",
      decisionId: "dec-cache",
      title: "Cache check",
      rationale: "Same subject twice.",
      confidence: 0.7,
    });
    const b = ExplanationService.explainDecision({
      organizationId: "org-a",
      decisionId: "dec-cache",
      title: "Cache check",
      rationale: "Same subject twice.",
      confidence: 0.7,
    });
    expect(a.cached).toBe(false);
    expect(b.cached).toBe(true);
    expect(b.subjectId).toBe(a.subjectId);
  });

  it("limits graph traversal and records observations", () => {
    StrategyService.ensureOrganization("org-a", "Academy A");
    const graph = ExplanationService.queryGraph("org-a", "Academy A", {
      depth: 1,
      limit: 15,
    });
    expect(graph.nodes.length).toBeLessThanOrEqual(15);
    const obs = listExplainObservations();
    expect(obs.some((o) => o.kind === "graph_query")).toBe(true);
  });
});
