/** Funding Intelligence unit tests (Sprint 034). */
import { beforeEach, describe, expect, it } from "vitest";
import { createFundingIntelligence } from "@/lib/platform/intelligence/funding";
import { createIntelligenceService } from "@/lib/platform/intelligence";
import { resetGraphEdgeSeqForTests } from "@/lib/platform/intelligence/executive-graph";
import { createIntelligencePlatform, resetPlatformIdSeqForTests } from "@/lib/platform/intelligence/infrastructure";

function graphInput() {
  return {
    scope: { organizationId: "org-1", schoolId: "school-1" },
    builtAt: "2026-07-12T12:00:00.000Z",
    executive: { enrollment: 120, admissions: 18, revenue: 5_400_000, outstanding: 120_000, staff: 42, studentAttendance: 91, teacherAttendance: 96 },
    organizationHealth: { overallScore: 78, enrollmentScore: 72, financialScore: 81, workforceScore: 70, operationsScore: 75, complianceScore: 88, academicScore: 80 },
    founder: { healthScore: 78, healthStatus: "warning" as const, priorities: [], risks: [{ id: "cash-risk", title: "Cash pressure", severity: "high" as const, probability: 0.7, impact: 0.8 }], opportunities: [{ id: "grant", title: "Expand grant pipeline", estimatedValue: 750_000, confidence: 0.75 }] },
  };
}

describe("Funding Intelligence (Sprint 034)", () => {
  beforeEach(() => { resetGraphEdgeSeqForTests(); resetPlatformIdSeqForTests(); });
  it("builds the complete funding intelligence result", () => {
    const { service } = createFundingIntelligence({ createId: (prefix) => `${prefix}-test`, now: () => new Date("2026-07-12T15:00:00.000Z"), wireOrganizationDna: false, wireOios: false });
    const result = service.build({ requestId: "fund-test-1", graphInput: graphInput(), scope: { organizationId: "org-1", schoolId: "school-1" }, financialSignal: { revenue: 5_400_000, expenses: 6_000_000, marginPct: -11, cash: 1_200_000 } });
    expect(result.healthScore.value).toBeGreaterThan(0); expect(result.opportunityScore.value).toBeGreaterThan(0); expect(result.riskScore.value).toBeGreaterThanOrEqual(0);
    expect(result.federalFunding.length).toBeGreaterThan(0); expect(result.stateFunding.length).toBeGreaterThan(0); expect(result.grantPipeline.opportunities.length).toBeGreaterThan(0);
    expect(result.governmentContracts.length).toBeGreaterThan(0); expect(result.foundationMatches.length).toBeGreaterThan(0); expect(result.angelInvestors.length).toBeGreaterThan(0); expect(result.crowdfunding.length).toBeGreaterThan(0);
    expect(result.mix.length).toBeGreaterThan(0); expect(result.risks.length).toBeGreaterThan(0); expect(result.topOpportunities.length).toBeGreaterThan(0); expect(result.proposalPriorities.length).toBeGreaterThan(0);
    expect(result.dashboard.headline.length).toBeGreaterThan(0); expect(result.grantPipelineDashboard.narrative.length).toBeGreaterThan(0); expect(result.capitalStrategyDashboard.narrative.length).toBeGreaterThan(0);
    expect(result.brief.headline.length).toBeGreaterThan(0); expect(result.projection.metrics.annualFundingNeed).toBeGreaterThan(0); expect(result.historyRecord.status).toBe("generated");
    for (const opportunity of result.topOpportunities) expect(Object.keys(opportunity.lenses).sort()).toEqual(["availableFunding", "diversification", "fundingRisk", "missionImpact", "sustainability"].sort());
  });
  it("supports focused queries and repository persistence", () => {
    const { service } = createFundingIntelligence({ createId: (prefix) => `${prefix}-test`, wireOrganizationDna: false, wireOios: false });
    const result = service.build({ requestId: "fund-query-1", graphInput: graphInput(), scope: { organizationId: "org-1", schoolId: "school-1" } });
    const answer = service.query(result, { question: "Which grants should we pursue?", focus: "grants" });
    expect(answer.answer.length).toBeGreaterThan(0); expect(answer.references.length).toBeGreaterThan(0); expect(service.repository().get("fund-query-1")).toBeTruthy(); expect(service.repository().listHistory().length).toBeGreaterThan(0);
  });
  it("wires funding onto createIntelligenceService", () => {
    const service = createIntelligenceService();
    expect(service.funding).toBeTruthy(); expect(service.funding.service).toBeTruthy();
    expect(service.funding.service.build({ requestId: "wired-fund-1", scope: { organizationId: "org-1", schoolId: "school-1" } }).brief.id.length).toBeGreaterThan(0);
  });
  it("runs after revenue before opportunity and organizational-improvement", async () => {
    const platform = createIntelligencePlatform({ clock: { now: () => new Date("2026-07-12T16:00:00.000Z"), createId: (prefix) => `${prefix}-test` } });
    const result = await platform.run({ scope: { organizationId: "org-1", schoolId: "school-1" }, bypassCache: true });
    expect(result.status).toBe("completed");
    expect(result.moduleOrder).toEqual(["organization-dna", "oios-core", "organization-health", "financial", "founder", "executive", "executive-graph", "executive-decision", "predictive", "board-governance", "human-capital", "revenue", "funding", "opportunity", "organizational-improvement", "business-model", "operations", "customer", "knowledge"]);
    expect(result.results.every((item) => item.ok)).toBe(true);
  });
});
