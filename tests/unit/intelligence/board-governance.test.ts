/**
 * Board & Governance Intelligence — unit tests (Sprint 029).
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  BOARD_PACKET_KINDS,
  createBoardGovernanceIntelligence,
} from "@/lib/platform/intelligence/board-governance";
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

describe("Board & Governance Intelligence (Sprint 029)", () => {
  beforeEach(() => {
    resetGraphEdgeSeqForTests();
    resetPlatformIdSeqForTests();
  });

  it("generates full board packet suite and executive brief", () => {
    const { service } = createBoardGovernanceIntelligence({
      createId: (prefix) => `${prefix}-test`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
      wireGraphAnalyzer: false,
      wireDecision: false,
      wirePredictive: false,
    });

    const result = service.generate({
      requestId: "gov-test-1",
      question: "What should the board review this month?",
      graphInput: graphInput(),
      scope: { organizationId: "org-1", schoolId: "school-1" },
    });

    expect(result.packets.length).toBe(BOARD_PACKET_KINDS.length);
    expect(result.packets.map((p) => p.kind).sort()).toEqual(
      [...BOARD_PACKET_KINDS].sort()
    );
    expect(result.brief.headline.length).toBeGreaterThan(0);
    expect(result.brief.financialSummary.length).toBeGreaterThan(0);
    expect(result.dashboard.overallGovernanceScore).toBeGreaterThan(0);
    expect(result.kpiDashboard.kpis.length).toBeGreaterThanOrEqual(8);
    expect(result.heatMap.length).toBe(9);
    expect(result.risks.length).toBeGreaterThan(0);
    expect(result.initiatives.length).toBeGreaterThan(0);
    expect(result.compliance.length).toBeGreaterThan(0);
    expect(result.resolutions.length).toBeGreaterThan(0);
    expect(result.committees.length).toBeGreaterThanOrEqual(4);
    expect(result.calendar.length).toBeGreaterThan(0);
    expect(result.scorecards.length).toBeGreaterThanOrEqual(3);
    expect(result.projection.metrics.packetCount).toBe(BOARD_PACKET_KINDS.length);
    expect(result.historyRecord.status).toBe("generated");
    expect(result.confidence.value).toBeGreaterThan(0);
  });

  it("supports single packet generation and board queries", () => {
    const { service } = createBoardGovernanceIntelligence({
      createId: (prefix) => `${prefix}-test`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
      wireGraphAnalyzer: false,
      wireDecision: false,
      wirePredictive: false,
    });

    const packet = service.generatePacket("monthly_board_packet", {
      graphInput: graphInput(),
      scope: { organizationId: "org-1", schoolId: "school-1" },
      periodLabel: "July 2026",
    });

    expect(packet.kind).toBe("monthly_board_packet");
    expect(packet.sections.length).toBeGreaterThan(0);
    expect(packet.periodLabel).toBe("July 2026");

    const result = service.generate({
      requestId: "gov-query-1",
      packetKinds: ["risk_heat_map", "executive_briefing"],
      graphInput: graphInput(),
      scope: { organizationId: "org-1", schoolId: "school-1" },
    });

    const answer = service.query(result, {
      question: "What risks should the board watch?",
      focus: "risk",
    });
    expect(answer.answer.length).toBeGreaterThan(0);
    expect(answer.references.length).toBeGreaterThan(0);
  });

  it("persists packets and history in the repository", () => {
    const { service } = createBoardGovernanceIntelligence({
      createId: (prefix) => `${prefix}-test`,
      now: () => new Date("2026-07-12T15:00:00.000Z"),
      wireGraphAnalyzer: false,
      wireDecision: false,
      wirePredictive: false,
    });

    const result = service.generate({
      requestId: "gov-repo-1",
      packetKinds: ["financial_summary", "mission_scorecard"],
      graphInput: graphInput(),
      scope: { organizationId: "org-1", schoolId: "school-1" },
    });

    expect(service.repository().list().length).toBeGreaterThanOrEqual(2);
    expect(service.repository().get(result.packets[0]!.id)).toBeTruthy();
    expect(service.repository().listHistory().length).toBeGreaterThanOrEqual(1);
  });

  it("wires boardGovernance onto createIntelligenceService", () => {
    const service = createIntelligenceService();
    expect(service.boardGovernance).toBeTruthy();
    expect(service.boardGovernance.service).toBeTruthy();

    const result = service.boardGovernance.service.generate({
      requestId: "wired-gov-1",
      packetKinds: ["executive_kpi_summary", "compliance_summary"],
      scope: { organizationId: "org-1", schoolId: "school-1" },
    });
    expect(result.packets).toHaveLength(2);
  });

  it("runs as the terminal platform module after predictive", async () => {
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
    ]);
    expect(result.results.every((item) => item.ok)).toBe(true);
  });
});
