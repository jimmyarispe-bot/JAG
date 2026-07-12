/** Organizational Improvement Engine unit tests (Sprint 036). */
import { beforeEach, describe, expect, it } from "vitest";
import {
  createOrganizationalImprovementIntelligence,
  IMPROVEMENT_SOURCE_DOMAINS,
  IMPROVEMENT_LOOP_STAGES,
} from "@/lib/platform/intelligence/organizational-improvement";
import { createIntelligenceService } from "@/lib/platform/intelligence";
import { resetGraphEdgeSeqForTests } from "@/lib/platform/intelligence/executive-graph";
import { createIntelligencePlatform, resetPlatformIdSeqForTests } from "@/lib/platform/intelligence/infrastructure";

function graphInput() {
  return {
    scope: { organizationId: "org-1", schoolId: "school-1" },
    builtAt: "2026-07-12T12:00:00.000Z",
    executive: {
      enrollment: 120,
      admissions: 18,
      revenue: 5_400_000,
      outstanding: 120_000,
      staff: 42,
      studentAttendance: 91,
      teacherAttendance: 96,
    },
    organizationHealth: {
      overallScore: 78,
      enrollmentScore: 72,
      financialScore: 81,
      workforceScore: 70,
      operationsScore: 75,
      complianceScore: 88,
      academicScore: 80,
    },
    founder: {
      healthScore: 78,
      healthStatus: "warning" as const,
      priorities: [],
      risks: [
        {
          id: "cash-risk",
          title: "Cash pressure",
          severity: "high" as const,
          probability: 0.7,
          impact: 0.8,
        },
      ],
      opportunities: [
        {
          id: "grant",
          title: "Expand grant pipeline",
          estimatedValue: 750_000,
          confidence: 0.75,
        },
      ],
    },
  };
}

const LENS_KEYS = [
  "whyNow",
  "expectedRoi",
  "missionImpact",
  "financialImpact",
  "peopleImpact",
  "implementationEffort",
  "risk",
  "confidence",
  "dependencies",
  "timeToValue",
].sort();

const PIPELINE_ORDER = [
  "organization-dna",
  "oios-core",
  "organization-health",
  "financial",
  "founder",
  "executive",
  "executive-graph",
  "executive-decision",
  "predictive",
  "board-governance",
  "human-capital",
  "revenue",
  "funding",
  "opportunity",
  "organizational-improvement",
  "business-model",
  "operations",
  "customer",
  "knowledge",
  "document",
  "legal-compliance-risk",
];

describe("Organizational Improvement Engine (Sprint 036)", () => {
  beforeEach(() => {
    resetGraphEdgeSeqForTests();
    resetPlatformIdSeqForTests();
  });

  it("builds the complete organizational improvement result", () => {
    const { service } = createOrganizationalImprovementIntelligence({
      createId: (prefix) => `${prefix}-test`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({
      requestId: "imp-test-1",
      graphInput: graphInput(),
      scope: { organizationId: "org-1", schoolId: "school-1" },
      financialSignal: {
        revenue: 5_400_000,
        expenses: 6_000_000,
        marginPct: -11,
        cash: 1_200_000,
      },
    });

    expect(result.healthScore.value).toBeGreaterThan(0);
    expect(result.improvementScore.value).toBeGreaterThan(0);
    expect(result.riskScore.value).toBeGreaterThanOrEqual(0);
    expect(Object.keys(result.sources).sort()).toEqual([...IMPROVEMENT_SOURCE_DOMAINS].sort());
    for (const domain of IMPROVEMENT_SOURCE_DOMAINS) {
      expect(result.sources[domain].length).toBeGreaterThan(0);
    }
    expect(result.improvements.length).toBeGreaterThan(0);
    expect(result.analysis.scored.length).toBeGreaterThan(0);
    expect(result.analysis.priority.length).toBeGreaterThan(0);
    expect(result.planning.quickWins.items.length).toBeGreaterThan(0);
    expect(result.planning.weekly.items.length).toBeGreaterThan(0);
    expect(result.planning.quarterly.items.length).toBeGreaterThan(0);
    expect(result.planning.annual.items.length).toBeGreaterThan(0);
    expect(result.loop.stages).toEqual([...IMPROVEMENT_LOOP_STAGES]);
    expect(result.dashboard.headline.length).toBeGreaterThan(0);
    expect(result.missionDashboard.narrative.length).toBeGreaterThan(0);
    expect(result.financialDashboard.narrative.length).toBeGreaterThan(0);
    expect(result.peopleDashboard.narrative.length).toBeGreaterThan(0);
    expect(result.todaysPriorities.priorities.length).toBeGreaterThan(0);
    expect(result.todaysPriorities.priorities.length).toBeLessThanOrEqual(5);
    expect(result.heatMap.cells.length).toBeGreaterThan(0);
    expect(result.dailyBrief.topFive.length).toBeGreaterThan(0);
    expect(result.dailyBrief.topFive.length).toBeLessThanOrEqual(5);
    expect(result.brief.headline.length).toBeGreaterThan(0);
    expect(result.projection.metrics.plannedValue).toBeGreaterThanOrEqual(0);
    expect(result.historyRecord.status).toBe("generated");
    for (const improvement of result.todaysPriorities.priorities) {
      expect(Object.keys(improvement.lenses).sort()).toEqual(LENS_KEYS);
      expect(improvement.title.length).toBeGreaterThan(0);
      expect(improvement.sourceDomain.length).toBeGreaterThan(0);
    }
  });

  it("supports focused queries and repository persistence", () => {
    const { service } = createOrganizationalImprovementIntelligence({
      createId: (prefix) => `${prefix}-test`,
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({
      requestId: "imp-query-1",
      graphInput: graphInput(),
      scope: { organizationId: "org-1", schoolId: "school-1" },
    });
    const answer = service.query(result, {
      question: "Which quick wins should we pursue?",
      focus: "quick_wins",
    });
    expect(answer.answer.length).toBeGreaterThan(0);
    expect(answer.references.length).toBeGreaterThan(0);
    expect(service.repository().get("imp-query-1")).toBeTruthy();
    expect(service.repository().listHistory().length).toBeGreaterThan(0);
  });

  it("wires organizational improvement onto createIntelligenceService", () => {
    const service = createIntelligenceService();
    expect(service.organizationalImprovement).toBeTruthy();
    expect(service.organizationalImprovement.service).toBeTruthy();
    expect(
      service.organizationalImprovement.service.build({
        requestId: "wired-imp-1",
        scope: { organizationId: "org-1", schoolId: "school-1" },
      }).brief.id.length
    ).toBeGreaterThan(0);
  });

  it("runs after opportunity before business-model", async () => {
    const platform = createIntelligencePlatform({
      clock: {
        now: () => new Date("2026-07-12T16:00:00.000Z"),
        createId: (prefix) => `${prefix}-test`,
      },
    });
    const result = await platform.run({
      scope: { organizationId: "org-1", schoolId: "school-1" },
      bypassCache: true,
    });
    expect(result.status).toBe("completed");
    expect(result.moduleOrder).toEqual(PIPELINE_ORDER);
    expect(result.results.every((item) => item.ok)).toBe(true);
  });
});
