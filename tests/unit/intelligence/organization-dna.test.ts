/**
 * Organizational DNA & Company Builder — unit tests (Sprint 030).
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  COMPANY_BUILDER_ARTIFACT_KINDS,
  createOrganizationDnaIntelligence,
  ORGANIZATION_STAGES,
} from "@/lib/platform/intelligence/organization-dna";
import { resetGraphEdgeSeqForTests } from "@/lib/platform/intelligence/executive-graph";
import { createIntelligenceService } from "@/lib/platform/intelligence";
import {
  createIntelligencePlatform,
  resetPlatformIdSeqForTests,
} from "@/lib/platform/intelligence/infrastructure";

function graphInput() {
  return {
    scope: { organizationId: "org-1", schoolId: "school-1" },
    builtAt: "2026-07-12T12:00:00.000Z",
    executive: {
      enrollment: 120,
      admissions: 18,
      revenue: 54000,
      outstanding: 12000,
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
  };
}

describe("Organizational DNA & Company Builder (Sprint 030)", () => {
  beforeEach(() => {
    resetGraphEdgeSeqForTests();
    resetPlatformIdSeqForTests();
  });

  it("builds full DNA and Company Builder artifact suite from seed", () => {
    const { service } = createOrganizationDnaIntelligence({
      createId: (prefix) => `${prefix}-test`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
      wireGraphAnalyzer: false,
      wireDecision: false,
      wirePredictive: false,
      wireBoardGovernance: false,
    });

    const result = service.build({
      requestId: "dna-test-1",
      question: "What is our organizational DNA?",
      seed: {
        name: "Northstar Academy",
        industry: "education",
        sector: "schools",
        geography: "regional",
        ideaSummary: "School OS for clarity and growth",
        problemStatement: "Leaders lack shared organizational genotype",
        targetCustomer: "School founders and heads of school",
        solutionSummary: "Organizational DNA + operating intelligence",
        stageHint: "startup",
        missionHint: "Enable schools to operate with clarity",
        valuesHints: ["Clarity", "Courage", "Care"],
      },
      scope: { organizationId: "org-1", schoolId: "school-1" },
      graphInput: graphInput(),
    });

    expect(result.dna.stage).toBe("startup");
    expect(ORGANIZATION_STAGES).toContain(result.dna.stage);
    expect(result.dna.profile.name).toBe("Northstar Academy");
    expect(result.dna.profile.mission.statement.length).toBeGreaterThan(0);
    expect(result.dna.profile.vision.statement.length).toBeGreaterThan(0);
    expect(result.dna.profile.values.values.length).toBeGreaterThanOrEqual(3);
    expect(result.dna.businessModel.archetype).toBeTruthy();
    expect(result.dna.leanCanvas.uniqueValueProposition.length).toBeGreaterThan(0);
    expect(result.dna.swot.strengths.length).toBeGreaterThan(0);
    expect(result.dna.valueProposition.statement.length).toBeGreaterThan(0);
    expect(result.dna.profile.personas.length).toBeGreaterThanOrEqual(2);
    expect(result.dna.readiness.overallScore).toBeGreaterThan(0);
    expect(result.dna.scoring.weightedScores.length).toBeGreaterThan(0);
    expect(result.dna.blueprint.title).toContain("Northstar");
    expect(result.dna.roadmap.milestones.length).toBeGreaterThanOrEqual(3);
    expect(result.dna.priorities.length).toBeGreaterThan(0);
    expect(result.dna.score.overall).toBeGreaterThan(0);
    expect(result.dna.kpiRecommendations.length).toBeGreaterThan(0);
    expect(result.artifacts.length).toBe(COMPANY_BUILDER_ARTIFACT_KINDS.length);
    expect(result.artifacts.map((a) => a.kind).sort()).toEqual(
      [...COMPANY_BUILDER_ARTIFACT_KINDS].sort()
    );
    expect(result.projection.metrics.artifactCount).toBe(
      COMPANY_BUILDER_ARTIFACT_KINDS.length
    );
    expect(result.historyRecord.status).toBe("generated");
    expect(result.confidence.value).toBeGreaterThan(0);
  });

  it("detects idea stage and supports queries", () => {
    const { service } = createOrganizationDnaIntelligence({
      createId: (prefix) => `${prefix}-test`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
      wireGraphAnalyzer: false,
      wireDecision: false,
      wirePredictive: false,
      wireBoardGovernance: false,
    });

    const result = service.buildFromSeed(
      {
        name: "Spark Idea Co",
        stageHint: "idea",
        ideaSummary: "A new concept",
      },
      { scope: { organizationId: "org-1", schoolId: null } }
    );

    expect(result.dna.stage).toBe("idea");
    expect(result.dna.nextStage).toBe("startup");

    const answer = service.query(result, {
      question: "What stage are we in?",
      focus: "stage",
    });
    expect(answer.answer).toContain("idea");
    expect(answer.references.length).toBeGreaterThan(0);
  });

  it("persists DNA and artifacts in the repository", () => {
    const { service } = createOrganizationDnaIntelligence({
      createId: (prefix) => `${prefix}-test`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
      wireGraphAnalyzer: false,
      wireDecision: false,
      wirePredictive: false,
      wireBoardGovernance: false,
    });

    const result = service.build({
      requestId: "dna-repo-1",
      artifactKinds: ["organizational_dna", "lean_canvas", "swot"],
      seed: { name: "Repo Org", stageHint: "operating" },
      scope: { organizationId: "org-1", schoolId: "school-1" },
    });

    expect(service.repository().get(result.dna.id)).toBeTruthy();
    expect(service.repository().listArtifacts().length).toBe(3);
    expect(service.repository().listHistory().length).toBeGreaterThanOrEqual(1);
  });

  it("wires organizationDna onto createIntelligenceService", () => {
    const service = createIntelligenceService();
    expect(service.organizationDna).toBeTruthy();
    expect(service.organizationDna.service).toBeTruthy();

    const result = service.organizationDna.service.build({
      requestId: "wired-dna-1",
      seed: { name: "Wired Org", stageHint: "growth" },
      artifactKinds: ["organizational_score", "kpi_recommendations"],
      scope: { organizationId: "org-1", schoolId: "school-1" },
    });
    expect(result.artifacts).toHaveLength(2);
    expect(result.dna.stage).toBe("growth");
  });

  it("runs as the foundational platform module before organization-health", async () => {
    const platform = createIntelligencePlatform({
      clock: {
        now: () => new Date("2026-07-12T16:00:00.000Z"),
        createId: (prefix) => `${prefix}-test`,
      },
    });

    const result = await platform.run({
      scope: { organizationId: "org-1", schoolId: "school-1" },
      bypassCache: true,
      input: {
        seed: {
          name: "Platform Org",
          stageHint: "startup",
        },
      },
    });

    expect(result.status).toBe("completed");
    expect(result.moduleOrder).toEqual([
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
    ]);
    expect(result.results.every((item) => item.ok)).toBe(true);
  });
});
