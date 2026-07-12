/**
 * Board & Governance Intelligence — ComplianceMonitor (Sprint 029).
 */

import type { ComplianceMonitor as ComplianceMonitorContract } from "@/lib/platform/intelligence/board-governance/contracts";
import { clamp } from "@/lib/platform/intelligence/board-governance/models";
import type {
  ComplianceItem,
  ComplianceStatus,
  GovernanceBaseline,
  GovernanceRequest,
} from "@/lib/platform/intelligence/board-governance/types";

export interface ComplianceMonitorDependencies {
  createId?: (prefix: string) => string;
}

function statusFromScore(score: number): ComplianceStatus {
  if (score >= 90) return "compliant";
  if (score >= 70) return "at_risk";
  if (score > 0) return "non_compliant";
  return "unknown";
}

/**
 * ComplianceMonitor — board compliance summary builder.
 */
export class ComplianceMonitorEngine implements ComplianceMonitorContract {
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: ComplianceMonitorDependencies = {}) {
    this.createId =
      dependencies.createId ??
      ((prefix) =>
        `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  }

  monitor(input: {
    request: GovernanceRequest;
    baseline: GovernanceBaseline;
    now: Date;
  }): ComplianceItem[] {
    if (
      input.request.complianceItems &&
      input.request.complianceItems.length > 0
    ) {
      return input.request.complianceItems;
    }

    const score = clamp(input.baseline.complianceScore, 0, 100);
    const due = new Date(input.now);
    due.setUTCDate(due.getUTCDate() + 30);

    return [
      {
        id: this.createId("comp-regulatory"),
        area: "Regulatory",
        requirement: "State / authorizer reporting cadence",
        status: statusFromScore(score),
        score,
        dueAt: due.toISOString(),
        owner: "Compliance Officer",
        findings:
          score < 90
            ? ["Reporting pack completeness below target"]
            : ["No material findings"],
        actions:
          score < 90
            ? ["Close open findings before next board packet"]
            : ["Maintain monthly evidence refresh"],
        narrative: `Regulatory compliance scored ${score}.`,
      },
      {
        id: this.createId("comp-financial"),
        area: "Financial Controls",
        requirement: "Board financial oversight controls",
        status: statusFromScore(
          clamp(input.baseline.financialHealthScore + 5, 0, 100)
        ),
        score: clamp(input.baseline.financialHealthScore + 5, 0, 100),
        dueAt: null,
        owner: "Finance Committee",
        findings: [],
        actions: ["Review cash and collections controls quarterly"],
        narrative: "Financial control monitoring for board oversight.",
      },
      {
        id: this.createId("comp-mission"),
        area: "Mission / Academic",
        requirement: "Mission outcome evidence for board review",
        status: statusFromScore(input.baseline.missionScore),
        score: input.baseline.missionScore,
        dueAt: null,
        owner: "Academic Committee",
        findings:
          input.baseline.missionScore < 80
            ? ["Mission score below board target"]
            : [],
        actions: ["Include mission scorecard in quarterly strategic review"],
        narrative: `Mission compliance posture at ${input.baseline.missionScore}.`,
      },
    ];
  }
}

/** Alias matching Sprint 029 naming. */
export { ComplianceMonitorEngine as ComplianceMonitor };
