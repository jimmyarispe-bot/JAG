/** Legal, Compliance & Risk Intelligence unit tests (Sprint 042 / 0.1.0). */
import { beforeEach, describe, expect, it } from "vitest";
import {
  createLegalComplianceRiskIntelligence,
  RISK_CATEGORIES,
  COMPLIANCE_SCOPES,
  LEGAL_COMPLIANCE_RISK_CAPABILITIES,
  LEGAL_COMPLIANCE_RISK_INTELLIGENCE_VERSION,
} from "@/lib/platform/intelligence/legal-compliance-risk";
import { createIntelligenceService } from "@/lib/platform/intelligence";
import { resetGraphEdgeSeqForTests } from "@/lib/platform/intelligence/executive-graph";
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
          id: "lcr-risk",
          title: "Unmanaged compliance obligations",
          severity: "high" as const,
          probability: 0.6,
          impact: 0.7,
        },
      ],
      opportunities: [
        {
          id: "legal-compliance-risk",
          title: "Strengthen legal, compliance & risk intelligence",
          estimatedValue: 260_000,
          confidence: 0.7,
        },
      ],
    },
  };
}

const LENS_KEYS = [
  "regulationOrPolicyApplies",
  "evidenceSupports",
  "confidence",
  "organizationalRisk",
  "ifNoActionTaken",
  "correctiveActionRecommended",
  "whoOwnsAction",
  "whenShouldComplete",
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
  "market",
  "innovation",
  "impact",
  "economic",
];

function buildResult(seed: string) {
  const { service } = createLegalComplianceRiskIntelligence({
    createId: (prefix) => `${prefix}-${seed}`,
    now: () => new Date("2026-07-12T15:00:00.000Z"),
    wireOrganizationDna: false,
    wireOios: false,
  });
  return service.build({
    requestId: `lcr-${seed}`,
    graphInput: graphInput(),
    scope: { organizationId: "org-1", schoolId: "school-1" },
    knowledgeResult: {
      healthScore: { value: 76 },
      coverageScore: { value: 74 },
      contributionScore: { value: 72 },
      baseline: { coverageScore: 74, validatedRatio: 0.68, gapPressure: 0.24 },
    },
    documentResult: {
      healthScore: { value: 75 },
      complianceScore: { value: 80 },
      riskScore: { value: 70 },
      baseline: {
        complianceCoverage: 78,
        riskPressure: 0.3,
        contractDensity: 12,
        grantDensity: 6,
        policyDensity: 9,
        expirationRisk: 0.25,
        documentCount: 48,
      },
    },
    boardGovernanceResult: {
      healthScore: { value: 72 },
      baseline: {
        policyGovernance: 70,
        minutesCoverage: 68,
        decisionTraceability: 66,
      },
    },
    humanCapitalResult: {
      healthScore: { value: 71 },
      baseline: {
        policyCoverage: 66,
        trainingCoverage: 68,
        successionReadiness: 62,
      },
    },
    fundingResult: {
      healthScore: { value: 69 },
      baseline: { grantReadiness: 65, awardCompliance: 67 },
    },
    operationsResult: {
      healthScore: { value: 72 },
      workflowScore: { value: 70 },
      baseline: { operationsScore: 75, backlogPressure: 0.35 },
    },
    customerResult: {
      healthScore: { value: 74 },
      baseline: {
        familyExperienceScore: 72,
        complaintBurden: 0.28,
        communicationCoverage: 73,
      },
    },
    improvementResult: {
      healthScore: { value: 73 },
      baseline: { executionScore: 70, capacityScore: 68 },
    },
  });
}

describe("Legal, Compliance & Risk Intelligence (Sprint 042)", () => {
  beforeEach(() => {
    resetGraphEdgeSeqForTests();
    resetPlatformIdSeqForTests();
  });

  it("builds a complete legal-compliance-risk result", () => {
    const result = buildResult("complete");

    expect(result.version).toBe(LEGAL_COMPLIANCE_RISK_INTELLIGENCE_VERSION);
    expect(result.healthScore.value).toBeGreaterThan(0);
    expect(result.complianceHealthScore.value).toBeGreaterThan(0);
    expect(result.riskScore.value).toBeGreaterThan(0);
    expect(result.contractScore.value).toBeGreaterThan(0);
    expect(result.regulatoryScore.value).toBeGreaterThan(0);
    expect(result.policyScore.value).toBeGreaterThan(0);
    expect(result.auditScore.value).toBeGreaterThan(0);
    expect(result.licensePermitScore.value).toBeGreaterThan(0);
    expect(result.insuranceScore.value).toBeGreaterThan(0);
    expect(result.litigationScore.value).toBeGreaterThan(0);
    expect(result.vendorRiskScore.value).toBeGreaterThan(0);
    expect(result.cyberGovernanceScore.value).toBeGreaterThan(0);
    expect(result.knowledgeScore.value).toBeGreaterThan(0);

    expect(result.dashboard.headline.length).toBeGreaterThan(0);
    expect(result.enterpriseRiskDashboard.narrative.length).toBeGreaterThan(0);
    expect(result.complianceDashboard.narrative.length).toBeGreaterThan(0);
    expect(result.contractDashboard.narrative.length).toBeGreaterThan(0);
    expect(result.auditDashboard.narrative.length).toBeGreaterThan(0);
    expect(result.brief.headline.length).toBeGreaterThan(0);
    expect(result.boardBrief.headline.length).toBeGreaterThan(0);
    expect(result.projection.headline.length).toBeGreaterThan(0);
    expect(result.reasoning.answer.length).toBeGreaterThan(0);
    expect(result.correctiveActions.length).toBeGreaterThan(0);
    expect(
      result.correctiveActionPlan.correctiveActions.length
    ).toBeGreaterThanOrEqual(0);
  });

  it("covers all enterprise risk categories", () => {
    const result = buildResult("risk");

    expect(Object.keys(result.enterpriseRisk.risks).sort()).toEqual(
      [...RISK_CATEGORIES].sort()
    );
    expect(Object.keys(result.enterpriseRisk.byCategory).sort()).toEqual(
      [...RISK_CATEGORIES].sort()
    );
    for (const category of RISK_CATEGORIES) {
      expect(result.enterpriseRisk.risks[category].length).toBeGreaterThan(0);
    }
    expect((RISK_CATEGORIES as readonly string[])).toContain(
      result.enterpriseRisk.hottestCategory
    );
  });

  it("covers all compliance scopes", () => {
    const result = buildResult("scope");

    expect(result.compliance.scopes.sort()).toEqual([...COMPLIANCE_SCOPES].sort());
    expect(Object.keys(result.compliance.byScope).sort()).toEqual(
      [...COMPLIANCE_SCOPES].sort()
    );
    expect((COMPLIANCE_SCOPES as readonly string[])).toContain(
      result.compliance.weakestScope
    );
  });

  it("emits recommendations with the full 8-field lens", () => {
    const result = buildResult("rec");

    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(LEGAL_COMPLIANCE_RISK_CAPABILITIES).toContain("corrective_action_planning");
    for (const rec of [...result.recommendations, ...result.correctiveActions]) {
      expect(Object.keys(rec.lenses).sort()).toEqual(LENS_KEYS);
      expect(rec.title.length).toBeGreaterThan(0);
      expect(rec.regulationOrPolicyRef.length).toBeGreaterThan(0);
      expect(Array.isArray(rec.evidenceRefs)).toBe(true);
      expect(rec.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(rec.riskScore).toBeGreaterThanOrEqual(0);
      expect(rec.owner.length).toBeGreaterThan(0);
      expect(rec.dueDate.length).toBeGreaterThan(0);
      expect((["critical", "high", "medium", "low", "monitor"] as string[])).toContain(
        rec.priority
      );
    }
  });

  it("contributes knowledge drafts", () => {
    const result = buildResult("knowledge");

    expect(result.knowledgeContribution.artifacts.length).toBeGreaterThan(0);
    expect(result.knowledgeContribution.contributionScore).toBeGreaterThan(0);
    expect(result.knowledgeContribution.validatedCount).toBeGreaterThanOrEqual(0);
  });

  it("supports focused queries and repository persistence", () => {
    const { service } = createLegalComplianceRiskIntelligence({
      createId: (prefix) => `${prefix}-q`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({
      requestId: "lcr-query-1",
      graphInput: graphInput(),
      scope: { organizationId: "org-1", schoolId: "school-1" },
    });

    for (const focus of [
      "contracts",
      "regulatory",
      "compliance",
      "risk",
      "audit",
      "corrective",
    ] as const) {
      const answer = service.query(result, {
        question: `What about ${focus}?`,
        focus,
      });
      expect(answer.answer.length).toBeGreaterThan(0);
    }

    expect(service.repository().get("lcr-query-1")).toBeTruthy();
    expect(service.repository().listHistory().length).toBeGreaterThan(0);
  });

  it("wires through createIntelligenceService().legalComplianceRisk", () => {
    const service = createIntelligenceService();
    expect(service.legalComplianceRisk).toBeTruthy();
    const result = service.legalComplianceRisk.service.build({
      requestId: "lcr-di-1",
      graphInput: graphInput(),
      scope: { organizationId: "org-1", schoolId: "school-1" },
    });
    expect(result.healthScore.value).toBeGreaterThan(0);
    expect(result.correctiveActions.length).toBeGreaterThanOrEqual(0);
  });

  it("runs before market in the platform pipeline", async () => {
    const platform = createIntelligencePlatform({
      clock: {
        now: () => new Date("2026-07-12T15:00:00.000Z"),
        createId: (prefix) => `${prefix}-test`,
      },
    });
    const result = await platform.run({
      scope: { organizationId: "org-1", schoolId: "school-1" },
      bypassCache: true,
    });
    expect(result.status).toBe("completed");
    expect(result.moduleOrder).toEqual(PIPELINE_ORDER);
    expect(result.moduleOrder.at(-5)).toBe("legal-compliance-risk");
    expect(result.moduleOrder.at(-4)).toBe("market");
    expect(result.moduleOrder.at(-3)).toBe("innovation");
    expect(result.moduleOrder.at(-2)).toBe("impact");
    expect(result.moduleOrder.at(-1)).toBe("economic");
    expect(result.results.every((item) => item.ok)).toBe(true);
  });
});
