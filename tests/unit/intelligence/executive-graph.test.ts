/**
 * Executive Graph Analyzer — unit tests (Sprint 025).
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  createExecutiveGraphAnalyzer,
  resetGraphEdgeSeqForTests,
  type GraphBuildInput,
} from "@/lib/platform/intelligence/executive-graph";

function decliningInput(): GraphBuildInput {
  return {
    scope: { organizationId: "org-1", schoolId: "school-1" },
    builtAt: "2026-07-12T12:00:00.000Z",
    executive: {
      enrollment: 90,
      admissions: 6,
      revenue: 40000,
      outstanding: 18000,
      staff: 38,
      studentAttendance: 84,
      teacherAttendance: 91,
    },
    organizationHealth: {
      overallScore: 68,
      enrollmentScore: 62,
      financialScore: 70,
      workforceScore: 65,
      operationsScore: 66,
      complianceScore: 80,
      academicScore: 72,
    },
    founder: {
      healthScore: 68,
      healthStatus: "warning",
      priorities: [
        {
          id: "collections",
          title: "Improve collections",
          severity: "high",
          confidence: 0.85,
        },
      ],
      risks: [
        {
          id: "cash-risk",
          title: "Cash pressure",
          severity: "high",
          probability: 0.7,
          impact: 0.8,
        },
      ],
      opportunities: [
        {
          id: "pipeline",
          title: "Expand admissions outreach",
          estimatedValue: 25000,
          confidence: 0.7,
        },
      ],
    },
    signals: [
      {
        key: "hr.vacancies",
        label: "Vacancies",
        domain: "hr",
        kind: "signal",
        value: 4,
        status: "warning",
        severity: "high",
        confidence: 0.8,
      },
    ],
  };
}

describe("Executive Graph Analyzer (Sprint 025)", () => {
  beforeEach(() => {
    resetGraphEdgeSeqForTests();
  });

  it("builds a multi-domain graph with catalog nodes and relations", () => {
    const { builder } = createExecutiveGraphAnalyzer({
      createId: (prefix) => `${prefix}-test`,
      now: () => new Date("2026-07-12T12:00:00.000Z"),
    });

    const graph = builder.build(decliningInput());

    expect(graph.nodes.length).toBeGreaterThan(15);
    expect(graph.edges.length).toBeGreaterThan(8);
    expect(graph.nodes.some((n) => n.domain === "admissions")).toBe(true);
    expect(graph.nodes.some((n) => n.domain === "finance")).toBe(true);
    expect(graph.nodes.some((n) => n.domain === "hr")).toBe(true);
    expect(graph.nodes.some((n) => n.domain === "operations")).toBe(true);
    expect(graph.nodes.some((n) => n.domain === "executive")).toBe(true);
    expect(graph.nodes.some((n) => n.domain === "founder")).toBe(true);
  });

  it("analyzes root causes, cascades, priorities, and dashboard projection", () => {
    const stack = createExecutiveGraphAnalyzer({
      createId: (prefix) => `${prefix}-test`,
      now: () => new Date("2026-07-12T12:00:00.000Z"),
    });

    const { graph, analysis } = stack.buildAndAnalyze(decliningInput());

    expect(stack.repository.get(graph.id)?.id).toBe(graph.id);
    expect(analysis.graphId).toBe(graph.id);
    expect(analysis.criticality.length).toBeGreaterThan(0);
    expect(analysis.dependencies.length).toBe(graph.nodes.length);
    expect(analysis.dashboard.metrics.nodeCount).toBe(graph.nodes.length);
    expect(analysis.dashboard.metrics.edgeCount).toBe(graph.edges.length);
    expect(analysis.dashboard.headline.length).toBeGreaterThan(0);
    expect(analysis.priorities.length).toBeGreaterThan(0);
    expect(analysis.findings.length).toBeGreaterThan(0);
    expect(analysis.recommendations.length).toBeGreaterThan(0);
  });

  it("supports queries and graph search", () => {
    const stack = createExecutiveGraphAnalyzer({
      createId: (prefix) => `${prefix}-test`,
    });
    const { graph, analysis } = stack.buildAndAnalyze(decliningInput());

    const why = stack.analyzer.queries.ask(graph, analysis, {
      question: "Why are we at risk?",
    });
    expect(why.answer.length).toBeGreaterThan(0);

    const hits = stack.analyzer.search.search(graph, { query: "cash", limit: 5 });
    expect(hits.length).toBeGreaterThan(0);

    const financeRoot = graph.nodes.find((n) => n.key === "finance.root");
    const cash = graph.nodes.find((n) => n.key === "finance.cash");
    expect(financeRoot && cash).toBeTruthy();
    if (financeRoot && cash) {
      const neighborhood = stack.analyzer.search.neighborhood(graph, cash.id, 1);
      expect(neighborhood.nodes.length).toBeGreaterThan(0);
    }
  });

  it("detects vacancy constraints and opportunities", () => {
    const { analysis } = createExecutiveGraphAnalyzer({
      createId: (prefix) => `${prefix}-test`,
    }).buildAndAnalyze(decliningInput());

    expect(analysis.constraints.some((c) => c.kind === "staffing" || c.kind === "blocks")).toBe(
      true
    );
    expect(analysis.opportunities.length).toBeGreaterThan(0);
  });
});
