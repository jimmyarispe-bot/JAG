/**
 * RiskMetrics — Risk Summary aggregates for dashboards.
 */

import {
  listComplianceRequirements,
  listMitigationsForOrganization,
  listRisksForOrganization,
} from "@/lib/risk/store";
import type {
  ComplianceStatus,
  RiskDashboard,
  RiskSeverity,
  RiskSummary,
} from "@/lib/risk/types";

function bump(map: Record<string, number>, key: string): void {
  const k = key.trim() || "Unassigned";
  map[k] = (map[k] ?? 0) + 1;
}

function overallCompliance(
  statuses: readonly ComplianceStatus[]
): ComplianceStatus {
  if (statuses.length === 0) return "Not Assessed";
  if (statuses.some((s) => s === "Non-Compliant" || s === "Overdue")) {
    return statuses.some((s) => s === "Overdue") ? "Overdue" : "Non-Compliant";
  }
  if (statuses.every((s) => s === "Compliant")) return "Compliant";
  if (statuses.some((s) => s === "Partial" || s === "Compliant")) {
    return "Partial";
  }
  return "Not Assessed";
}

export type RiskMetricsService = {
  summarize(organizationId: string, now?: Date): RiskSummary;
  dashboard(organizationId: string, now?: Date): RiskDashboard;
};

export function createRiskMetrics(): RiskMetricsService {
  return {
    summarize(organizationId, now = new Date()) {
      const risks = listRisksForOrganization(organizationId).filter(
        (r) => r.status !== "Closed"
      );
      const open = risks.filter((r) => r.status !== "Resolved");
      const critical = open.filter((r) => r.severity === "Critical");
      const high = open.filter((r) => r.severity === "High");
      const overdueReviews = open.filter(
        (r) =>
          r.reviewDate != null && Date.parse(r.reviewDate) < now.getTime()
      );
      const openMitigations = listMitigationsForOrganization(
        organizationId
      ).filter(
        (m) =>
          m.status === "Planned" ||
          m.status === "In Progress" ||
          m.status === "Blocked"
      );

      const requirements = listComplianceRequirements(organizationId);
      const compliantRequirements = requirements.filter(
        (r) => r.status === "Compliant"
      ).length;

      const byCategory: Record<string, number> = {};
      const byBusinessUnit: Record<string, number> = {};
      const bySeverity: Record<RiskSeverity, number> = {
        Low: 0,
        Medium: 0,
        High: 0,
        Critical: 0,
      };
      for (const r of open) {
        bump(byCategory, r.category);
        bump(byBusinessUnit, r.businessUnit ?? "Unassigned");
        bySeverity[r.severity] += 1;
      }

      const avg =
        open.length === 0
          ? 0
          : Math.round(
              open.reduce((a, r) => a + r.residualScore, 0) / open.length
            );

      return {
        criticalRisks: critical.length,
        highRisks: high.length,
        openRisks: open.length,
        overdueReviews: overdueReviews.length,
        openMitigations: openMitigations.length,
        complianceStatus: overallCompliance(requirements.map((r) => r.status)),
        compliantRequirements,
        totalRequirements: requirements.length,
        byCategory: Object.freeze(byCategory),
        byBusinessUnit: Object.freeze(byBusinessUnit),
        bySeverity: Object.freeze(bySeverity),
        averageResidualScore: avg,
      };
    },

    dashboard(organizationId, now = new Date()) {
      const risks = listRisksForOrganization(organizationId);
      const summary = this.summarize(organizationId, now);
      return {
        critical: Object.freeze(
          risks.filter(
            (r) => r.severity === "Critical" && r.status !== "Closed"
          )
        ),
        high: Object.freeze(
          risks.filter((r) => r.severity === "High" && r.status !== "Closed")
        ),
        overdueReviews: Object.freeze(
          risks.filter(
            (r) =>
              r.status !== "Closed" &&
              r.reviewDate != null &&
              Date.parse(r.reviewDate) < now.getTime()
          )
        ),
        openMitigations: Object.freeze(
          listMitigationsForOrganization(organizationId).filter(
            (m) =>
              m.status === "Planned" ||
              m.status === "In Progress" ||
              m.status === "Blocked"
          )
        ),
        compliance: listComplianceRequirements(organizationId),
        summary,
      };
    },
  };
}

export function getRiskSummary(
  organizationId: string,
  now?: Date
): RiskSummary {
  return createRiskMetrics().summarize(organizationId, now);
}
