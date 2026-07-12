/** Document Intelligence unit tests (Sprint 041 / 0.1.0). */
import { beforeEach, describe, expect, it } from "vitest";
import {
  createDocumentIntelligence,
  DOCUMENT_TYPES,
  DOCUMENT_RISK_CATEGORIES,
  DOCUMENT_COMPLIANCE_TAGS,
  DOCUMENT_CAPABILITIES,
  DOCUMENT_RELATION_KINDS,
  DOCUMENT_INTELLIGENCE_VERSION,
} from "@/lib/platform/intelligence/document";
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
          id: "doc-risk",
          title: "Unmanaged document estate",
          severity: "high" as const,
          probability: 0.6,
          impact: 0.7,
        },
      ],
      opportunities: [
        {
          id: "document",
          title: "Strengthen document intelligence",
          estimatedValue: 220_000,
          confidence: 0.7,
        },
      ],
    },
  };
}

const LENS_KEYS = [
  "whatIsIt",
  "whyItMatters",
  "whoOwnsIt",
  "whenItExpires",
  "knowledgeCreated",
  "risksContained",
  "decisionsDependent",
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
];

describe("Document Intelligence (Sprint 041)", () => {
  beforeEach(() => {
    resetGraphEdgeSeqForTests();
    resetPlatformIdSeqForTests();
  });

  it("builds complete document result", () => {
    const { service } = createDocumentIntelligence({
      createId: (prefix) => `${prefix}-test`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({
      requestId: "doc-test-1",
      graphInput: graphInput(),
      scope: { organizationId: "org-1", schoolId: "school-1" },
      knowledgeResult: {
        healthScore: { value: 76 },
        coverageScore: { value: 74 },
        contributionScore: { value: 72 },
        baseline: {
          coverageScore: 74,
          validatedRatio: 0.68,
          gapPressure: 0.24,
        },
      },
      operationsResult: {
        healthScore: { value: 72 },
        workflowScore: { value: 70 },
        baseline: {
          operationsScore: 75,
          processCoverage: 68,
          backlogPressure: 0.35,
        },
      },
      customerResult: {
        healthScore: { value: 74 },
        engagementScore: { value: 76 },
        baseline: {
          familyExperienceScore: 72,
          complaintBurden: 0.28,
          communicationCoverage: 73,
        },
      },
      humanCapitalResult: {
        healthScore: { value: 71 },
        baseline: {
          policyCoverage: 66,
          trainingCoverage: 68,
          successionReadiness: 62,
        },
        knowledgeTransfer: { overallScore: 64, criticalGaps: 3 },
      },
      revenueResult: {
        healthScore: { value: 73 },
        baseline: {
          revenueReliability: 70,
          billingAccuracy: 71,
          contractCoverage: 69,
        },
      },
      fundingResult: {
        healthScore: { value: 69 },
        baseline: {
          grantReadiness: 65,
          awardCompliance: 67,
          pipelineCoverage: 63,
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
    });

    expect(result.version).toBe(DOCUMENT_INTELLIGENCE_VERSION);
    expect(result.healthScore.value).toBeGreaterThan(0);
    expect(result.knowledgeScore.value).toBeGreaterThan(0);
    expect(result.catalogScore.value).toBeGreaterThan(0);
    expect(result.classificationScore.value).toBeGreaterThan(0);
    expect(result.metadataScore.value).toBeGreaterThan(0);
    expect(result.entityScore.value).toBeGreaterThan(0);
    expect(result.relationshipScore.value).toBeGreaterThan(0);
    expect(result.versionScore.value).toBeGreaterThan(0);
    expect(result.duplicateScore.value).toBeGreaterThan(0);
    expect(result.summaryScore.value).toBeGreaterThan(0);
    expect(result.clauseScore.value).toBeGreaterThan(0);
    expect(result.riskScore.value).toBeGreaterThan(0);
    expect(result.complianceScore.value).toBeGreaterThan(0);
    expect(result.expirationScore.value).toBeGreaterThan(0);
    expect(result.contributionScore.value).toBeGreaterThan(0);
    expect(result.catalog.documents.map((d) => d.type).sort()).toEqual(
      [...DOCUMENT_TYPES].sort()
    );
    expect(result.dashboard.headline.length).toBeGreaterThan(0);
    expect(result.contractDashboard.narrative.length).toBeGreaterThan(0);
    expect(result.policyDashboard.narrative.length).toBeGreaterThan(0);
    expect(result.grantDashboard.narrative.length).toBeGreaterThan(0);
    expect(result.complianceDashboard.narrative.length).toBeGreaterThan(0);
    expect(result.brief.headline.length).toBeGreaterThan(0);
    expect(result.projection.headline.length).toBeGreaterThan(0);
    expect(result.reasoning.answer.length).toBeGreaterThan(0);
    expect(result.historyRecord.status).toBe("classified");
    expect(DOCUMENT_CAPABILITIES).toContain("knowledge_contribution");
    expect(
      result.relationships.relationships.every((relationship) =>
        (DOCUMENT_RELATION_KINDS as readonly string[]).includes(relationship.kind)
      )
    ).toBe(true);
    for (const rec of result.recommendations) {
      expect(Object.keys(rec.lenses).sort()).toEqual(LENS_KEYS);
      expect(rec.title.length).toBeGreaterThan(0);
      expect(rec.sourceDocumentIds.length).toBeGreaterThan(0);
      expect(rec.knowledgeArtifactIds.length).toBeGreaterThan(0);
    }
  });

  it("covers all risk categories and compliance tags", () => {
    const { service } = createDocumentIntelligence({
      createId: (prefix) => `${prefix}-risk`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({
      requestId: "doc-risk-1",
      graphInput: graphInput(),
      scope: { organizationId: "org-1", schoolId: "school-1" },
    });

    expect(Object.keys(result.riskSuite.risks).sort()).toEqual(
      [...DOCUMENT_RISK_CATEGORIES].sort()
    );
    for (const category of DOCUMENT_RISK_CATEGORIES) {
      expect(result.riskSuite.risks[category].length).toBeGreaterThan(0);
    }
    expect(result.compliance.tags.sort()).toEqual([...DOCUMENT_COMPLIANCE_TAGS].sort());
    expect(Object.keys(result.compliance.byTag).sort()).toEqual(
      [...DOCUMENT_COMPLIANCE_TAGS].sort()
    );
  });

  it("contributes knowledge drafts", () => {
    const { service } = createDocumentIntelligence({
      createId: (prefix) => `${prefix}-knowledge`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({
      requestId: "doc-knowledge-1",
      graphInput: graphInput(),
      scope: { organizationId: "org-1", schoolId: "school-1" },
    });

    expect(result.knowledgeContribution.artifacts.length).toBeGreaterThan(0);
    expect(result.knowledgeContribution.contributionScore).toBeGreaterThan(0);
    expect(result.knowledgeContribution.validatedCount).toBeGreaterThanOrEqual(0);
    for (const artifact of result.knowledgeContribution.artifacts) {
      expect(artifact.title.length).toBeGreaterThan(0);
      expect(artifact.sourceDocumentId.length).toBeGreaterThan(0);
      expect(artifact.confidence).toBeGreaterThan(0);
    }
  });

  it("monitors expiration", () => {
    const { service } = createDocumentIntelligence({
      createId: (prefix) => `${prefix}-expiration`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({
      requestId: "doc-expiration-1",
      graphInput: graphInput(),
      scope: { organizationId: "org-1", schoolId: "school-1" },
    });

    expect(result.expiration.monitoringScore).toBeGreaterThan(0);
    expect(result.expiration.nextExpiration).toBeTruthy();
    expect(
      result.expiration.expiringSoon.length + result.expiration.expired.length
    ).toBeGreaterThan(0);
    expect(result.expiration.narrative.length).toBeGreaterThan(0);
  });

  it("supports focused queries and repository persistence", () => {
    const { service } = createDocumentIntelligence({
      createId: (prefix) => `${prefix}-q`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({
      requestId: "doc-query-1",
      graphInput: graphInput(),
      scope: { organizationId: "org-1", schoolId: "school-1" },
    });
    const catalogQuery = service.query(result, {
      question: "What documents do we have?",
      focus: "catalog",
    });
    expect(catalogQuery.answer.length).toBeGreaterThan(0);
    expect(catalogQuery.references.length).toBeGreaterThan(0);

    const riskQuery = service.query(result, {
      question: "Where is document risk?",
      focus: "risk",
    });
    expect(riskQuery.answer.length).toBeGreaterThan(0);

    const knowledgeQuery = service.query(result, {
      question: "What knowledge is created?",
      focus: "knowledge",
    });
    expect(knowledgeQuery.answer.length).toBeGreaterThan(0);

    const expirationQuery = service.query(result, {
      question: "What expires next?",
      focus: "expiration",
    });
    expect(expirationQuery.answer.length).toBeGreaterThan(0);

    expect(service.repository().get("doc-query-1")).toBeTruthy();
    expect(service.repository().listHistory().length).toBeGreaterThan(0);
  });

  it("wires through createIntelligenceService().document", () => {
    const service = createIntelligenceService();
    expect(service.document).toBeTruthy();
    const result = service.document.service.build({
      requestId: "doc-di-1",
      graphInput: graphInput(),
      scope: { organizationId: "org-1", schoolId: "school-1" },
    });
    expect(result.healthScore.value).toBeGreaterThan(0);
    expect(result.knowledgeContribution.contributionScore).toBeGreaterThan(0);
  });

  it("runs as terminal platform module after knowledge", async () => {
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
    expect(result.moduleOrder.at(-2)).toBe("market");
    expect(result.moduleOrder.at(-1)).toBe("innovation");
    expect(result.results.every((item) => item.ok)).toBe(true);
  });
});
