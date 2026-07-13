/** Knowledge Intelligence unit tests (Sprint 040 / 0.2.0). */
import { beforeEach, describe, expect, it } from "vitest";
import {
  createKnowledgeIntelligence,
  KNOWLEDGE_TYPES,
  KNOWLEDGE_GAP_CATEGORIES,
  KNOWLEDGE_QUALITY_DIMENSIONS,
  KNOWLEDGE_EVOLUTION_ACTIONS,
  ORGANIZATIONAL_MEMORY_KINDS,
  EXPERTISE_DOMAINS,
  KNOWLEDGE_RELATION_KINDS,
  KNOWLEDGE_INTELLIGENCE_VERSION,
} from "@/lib/platform/intelligence/knowledge";
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
          id: "know-risk",
          title: "Undocumented decisions",
          severity: "high" as const,
          probability: 0.6,
          impact: 0.7,
        },
      ],
      opportunities: [
        {
          id: "memory",
          title: "Strengthen institutional memory",
          estimatedValue: 220_000,
          confidence: 0.7,
        },
      ],
    },
  };
}

const LENS_KEYS = [
  "coverageCompleteness",
  "provenanceTrust",
  "ownershipClarity",
  "validationCurrency",
  "dependencyReach",
  "decisionInfluence",
].sort();

const PROVENANCE_KEYS = [
  "source",
  "sourceType",
  "originalAuthor",
  "currentOwner",
  "creationDate",
  "lastModifiedDate",
  "lastValidationDate",
  "confidenceScore",
  "trustScore",
  "versionHistory",
  "approvalStatus",
  "relatedPolicies",
  "relatedDecisions",
  "relatedGoals",
  "relatedOrganizationalDna",
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
  "competitive",
  "political", "environmental", "stakeholder", "reputation", "behavioral", "cultural", "ethical", "systems", "resilience", "ecosystem", "institutional-memory", "collective", "wisdom",
];

describe("Knowledge Intelligence (Sprint 040)", () => {
  beforeEach(() => {
    resetGraphEdgeSeqForTests();
    resetPlatformIdSeqForTests();
  });

  it("builds the complete knowledge result", () => {
    const { service } = createKnowledgeIntelligence({
      createId: (prefix) => `${prefix}-test`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({
      requestId: "know-test-1",
      graphInput: graphInput(),
      scope: { organizationId: "org-1", schoolId: "school-1" },
      customerResult: {
        healthScore: { value: 74 },
        engagementScore: { value: 76 },
        baseline: {
          familyExperienceScore: 72,
          belongingIndex: 70,
          complaintBurden: 0.28,
        },
      },
      operationsResult: {
        healthScore: { value: 72 },
        workflowScore: { value: 70 },
        baseline: {
          operationsScore: 75,
          slaRisk: 0.3,
          backlogPressure: 0.35,
        },
      },
      humanCapitalResult: {
        healthScore: { value: 71 },
        baseline: {
          successionReadiness: 62,
          skillsCoverage: 68,
          engagementScore: 70,
        },
        knowledgeTransfer: { overallScore: 64, criticalGaps: 3 },
      },
    });

    expect(result.version).toBe(KNOWLEDGE_INTELLIGENCE_VERSION);
    expect(result.healthScore.value).toBeGreaterThan(0);
    expect(result.coverageScore.value).toBeGreaterThan(0);
    expect(result.graphScore.value).toBeGreaterThan(0);
    expect(result.searchScore.value).toBeGreaterThan(0);
    expect(result.gapScore.value).toBeGreaterThan(0);
    expect(result.expertiseScore.value).toBeGreaterThan(0);
    expect(result.qualityScore.value).toBeGreaterThan(0);
    expect(result.provenanceScore.value).toBeGreaterThan(0);
    expect(result.memoryScore.value).toBeGreaterThan(0);
    expect(result.evolutionScore.value).toBeGreaterThanOrEqual(0);
    expect(result.riskScore.value).toBeGreaterThanOrEqual(0);
    expect(result.catalog.artifacts.map((a) => a.type).sort()).toEqual(
      [...KNOWLEDGE_TYPES].sort()
    );
    expect(result.gaps.gaps.map((g) => g.category).sort()).toEqual(
      [...KNOWLEDGE_GAP_CATEGORIES].sort()
    );
    expect(result.expertiseMap.domains.map((d) => d.domain).sort()).toEqual(
      [...EXPERTISE_DOMAINS].sort()
    );
    expect(
      result.graph.edges.every((e) =>
        (KNOWLEDGE_RELATION_KINDS as readonly string[]).includes(e.kind)
      )
    ).toBe(true);
    expect(result.dashboard.headline.length).toBeGreaterThan(0);
    expect(result.risks.length).toBeGreaterThan(0);
    expect(result.opportunities.length).toBeGreaterThan(0);
    expect(result.brief.headline.length).toBeGreaterThan(0);
    expect(result.projection.headline.length).toBeGreaterThan(0);
    expect(result.reasoning.answer.length).toBeGreaterThan(0);
    expect(result.historyRecord.status).toBe("generated");
    for (const rec of result.recommendations) {
      expect(Object.keys(rec.lenses).sort()).toEqual(LENS_KEYS);
      expect(rec.title.length).toBeGreaterThan(0);
    }
  });

  it("retains full provenance on every knowledge artifact", () => {
    const { service } = createKnowledgeIntelligence({
      createId: (prefix) => `${prefix}-prov`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({
      requestId: "know-prov-1",
      graphInput: graphInput(),
      scope: { organizationId: "org-1", schoolId: "school-1" },
    });

    expect(result.provenance.records.length).toBe(result.catalog.artifacts.length);
    for (const artifact of result.catalog.artifacts) {
      expect(Object.keys(artifact.provenance).sort()).toEqual(PROVENANCE_KEYS);
      expect(artifact.provenance.versionHistory.length).toBeGreaterThan(0);
      expect(artifact.provenance.source).toBe(artifact.source);
      expect(artifact.provenance.currentOwner).toBe(artifact.owner);
    }
    expect(result.provenance.overallTrustScore).toBeGreaterThan(0);
  });

  it("runs knowledge quality intelligence across all dimensions", () => {
    const { service } = createKnowledgeIntelligence({
      createId: (prefix) => `${prefix}-qual`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({
      requestId: "know-qual-1",
      graphInput: graphInput(),
      scope: { organizationId: "org-1", schoolId: "school-1" },
    });

    expect(result.quality.dimensions.map((d) => d.dimension).sort()).toEqual(
      [...KNOWLEDGE_QUALITY_DIMENSIONS].sort()
    );
    expect(result.quality.validation.validatedRatio).toBeGreaterThanOrEqual(0);
    expect(result.quality.freshness.staleRatio).toBeGreaterThanOrEqual(0);
    expect(result.quality.completeness.completenessScore).toBeGreaterThan(0);
    expect(result.quality.accuracy.accuracyScore).toBeGreaterThan(0);
    expect(result.quality.consistency.consistencyScore).toBeGreaterThan(0);
    expect(result.quality.conflictDetection.conflicts).toBeDefined();
    expect(
      result.quality.redundancyDetection.redundantClusters
    ).toBeGreaterThanOrEqual(0);
    expect(result.quality.coverageAnalysis.weakestType).toBeTruthy();
    expect(result.quality.lifecycleManagement.activeRatio).toBeGreaterThanOrEqual(
      0
    );
    expect(result.quality.overallScore).toBeGreaterThan(0);
  });

  it("captures organizational memory across all memory kinds", () => {
    const { service } = createKnowledgeIntelligence({
      createId: (prefix) => `${prefix}-mem`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({
      requestId: "know-mem-1",
      graphInput: graphInput(),
      scope: { organizationId: "org-1", schoolId: "school-1" },
    });

    expect(
      result.organizationalMemory.records.map((r) => r.kind).sort()
    ).toEqual([...ORGANIZATIONAL_MEMORY_KINDS].sort());
    expect(result.organizationalMemory.coverageScore).toBeGreaterThan(0);
    expect(
      result.organizationalMemory.leadershipTransitionReadiness
    ).toBeGreaterThan(0);
  });

  it("evolves knowledge continuously across all evolution actions", () => {
    const { service } = createKnowledgeIntelligence({
      createId: (prefix) => `${prefix}-evo`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({
      requestId: "know-evo-1",
      graphInput: graphInput(),
      scope: { organizationId: "org-1", schoolId: "school-1" },
    });

    expect(result.evolution.actions.map((a) => a.action).sort()).toEqual(
      [...KNOWLEDGE_EVOLUTION_ACTIONS].sort()
    );
    expect(result.evolution.updateRecommendations.length).toBeGreaterThan(0);
    expect(result.evolution.documentationSuggestions.length).toBeGreaterThan(0);
    expect(result.evolution.transitionPreservationScore).toBeGreaterThan(0);
  });

  it("traces every recommendation back to knowledge provenance", () => {
    const { service } = createKnowledgeIntelligence({
      createId: (prefix) => `${prefix}-trace`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({
      requestId: "know-trace-1",
      graphInput: graphInput(),
      scope: { organizationId: "org-1", schoolId: "school-1" },
    });

    expect(result.decisionTraceability.traces.length).toBe(
      result.recommendations.length
    );
    expect(
      result.decisionTraceability.tracedRecommendationCount
    ).toBeGreaterThan(0);
    for (const rec of result.recommendations) {
      expect(rec.knowledgeUsed.length).toBeGreaterThan(0);
      expect(rec.knowledgeConfidence).toBeGreaterThanOrEqual(0);
      expect(rec.knowledgeSource).toBeTruthy();
    }
    for (const trace of result.decisionTraceability.traces) {
      expect(trace.knowledgeUsed.length).toBeGreaterThan(0);
      for (const k of trace.knowledgeUsed) {
        expect(k.source).toBeTruthy();
        expect(k.confidence).toBeGreaterThanOrEqual(0);
        expect(k.trustScore).toBeGreaterThan(0);
      }
    }
  });

  it("supports focused queries and repository persistence", () => {
    const { service } = createKnowledgeIntelligence({
      createId: (prefix) => `${prefix}-q`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
      wireOrganizationDna: false,
      wireOios: false,
    });
    const result = service.build({
      requestId: "know-query-1",
      graphInput: graphInput(),
      scope: { organizationId: "org-1", schoolId: "school-1" },
    });
    const query = service.query(result, {
      question: "What knowledge gaps do we have?",
      focus: "gaps",
    });
    expect(query.answer.length).toBeGreaterThan(0);
    expect(query.references.length).toBeGreaterThan(0);

    const qualityQuery = service.query(result, {
      question: "How is knowledge quality?",
      focus: "quality",
    });
    expect(qualityQuery.answer.length).toBeGreaterThan(0);

    const traceQuery = service.query(result, {
      question: "What underpins recommendations?",
      focus: "traceability",
    });
    expect(traceQuery.answer.length).toBeGreaterThan(0);

    expect(service.repository().get("know-query-1")).toBeTruthy();
    expect(service.repository().listHistory().length).toBeGreaterThan(0);
  });

  it("wires through createIntelligenceService", () => {
    const service = createIntelligenceService();
    expect(service.knowledge).toBeTruthy();
    const result = service.knowledge.service.build({
      requestId: "know-di-1",
      graphInput: graphInput(),
      scope: { organizationId: "org-1", schoolId: "school-1" },
    });
    expect(result.healthScore.value).toBeGreaterThan(0);
    expect(result.quality.overallScore).toBeGreaterThan(0);
  });

  it("runs before the terminal document platform module", async () => {
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
    expect(result.results.every((item) => item.ok)).toBe(true);
  });
});

