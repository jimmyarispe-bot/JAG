/**
 * Board & Governance Intelligence — GovernanceDashboard + BoardKPIDashboard (Sprint 029).
 */

import type {
  BoardKPIDashboard as BoardKPIDashboardContract,
  GovernanceDashboard as GovernanceDashboardContract,
} from "@/lib/platform/intelligence/board-governance/contracts";
import {
  clamp,
  priorityFromScore,
} from "@/lib/platform/intelligence/board-governance/models";
import type {
  BoardKpi,
  BoardKpiDashboardView,
  BoardResolution,
  ComplianceItem,
  GovernanceBaseline,
  GovernanceCalendarEvent,
  GovernanceDashboardView,
  RiskRegisterEntry,
  StrategicInitiative,
} from "@/lib/platform/intelligence/board-governance/types";

/**
 * GovernanceDashboard — executive governance overview.
 */
export class GovernanceDashboardEngine implements GovernanceDashboardContract {
  build(input: {
    baseline: GovernanceBaseline;
    kpis: BoardKpi[];
    risks: RiskRegisterEntry[];
    initiatives: StrategicInitiative[];
    compliance: ComplianceItem[];
    resolutions: BoardResolution[];
    calendar: GovernanceCalendarEvent[];
    now: Date;
  }): GovernanceDashboardView {
    const criticalRisks = input.risks.filter(
      (r) => r.heat === "critical" || r.heat === "high"
    ).length;
    const openResolutions = input.resolutions.filter(
      (r) => r.status !== "completed" && r.status !== "rescinded"
    ).length;
    const complianceScore =
      input.compliance.length > 0
        ? Math.round(
            input.compliance.reduce((s, c) => s + c.score, 0) /
              input.compliance.length
          )
        : input.baseline.complianceScore;
    const initiativeHealth =
      input.initiatives.length > 0
        ? Math.round(
            input.initiatives.reduce((s, i) => s + i.progressPct, 0) /
              input.initiatives.length
          )
        : input.baseline.initiativeProgress;
    const riskScore = Math.round(
      (1 - input.baseline.riskScore) * 100
    );
    const overall = Math.round(
      (input.baseline.missionScore +
        complianceScore +
        riskScore +
        initiativeHealth +
        input.baseline.executiveKpi) /
        5
    );

    const alerts: string[] = [];
    if (criticalRisks > 0) {
      alerts.push(`${criticalRisks} high/critical risks on the register`);
    }
    if (openResolutions > 0) {
      alerts.push(`${openResolutions} open board resolutions`);
    }
    if (complianceScore < 85) {
      alerts.push("Compliance score below board target");
    }

    return {
      generatedAt: input.now.toISOString(),
      headline:
        alerts[0] != null
          ? `Governance attention: ${alerts[0]}`
          : `Governance posture healthy at ${overall}`,
      overallGovernanceScore: overall,
      status: priorityFromScore(overall),
      missionScore: input.baseline.missionScore,
      complianceScore,
      riskScore,
      initiativeHealth,
      openResolutions,
      criticalRisks,
      upcomingEvents: input.calendar.slice(0, 5),
      topKpis: input.kpis.slice(0, 6),
      alerts,
    };
  }
}

/**
 * BoardKPIDashboard — KPI rollup for board packets.
 */
export class BoardKPIDashboardEngine implements BoardKPIDashboardContract {
  build(input: {
    kpis: BoardKpi[];
    periodLabel: string;
    now: Date;
  }): BoardKpiDashboardView {
    const byDomainMap = new Map<string, BoardKpi[]>();
    for (const kpi of input.kpis) {
      const list = byDomainMap.get(kpi.domain) ?? [];
      list.push(kpi);
      byDomainMap.set(kpi.domain, list);
    }

    const byDomain = [...byDomainMap.entries()].map(([domain, list]) => ({
      domain,
      averageScore: Math.round(
        list.reduce((s, k) => s + k.value, 0) / Math.max(list.length, 1)
      ),
      count: list.length,
    }));

    const overallScore =
      input.kpis.length > 0
        ? Math.round(
            input.kpis.reduce((s, k) => {
              if (k.key === "risk") return s + clamp(100 - k.value, 0, 100);
              return s + k.value;
            }, 0) / input.kpis.length
          )
        : 0;

    return {
      generatedAt: input.now.toISOString(),
      periodLabel: input.periodLabel,
      overallScore,
      kpis: input.kpis,
      byDomain,
      trendingUp: input.kpis.filter((k) => k.trend === "up").map((k) => k.label),
      trendingDown: input.kpis
        .filter((k) => k.trend === "down")
        .map((k) => k.label),
    };
  }
}

/** Aliases matching Sprint 029 naming. */
export { GovernanceDashboardEngine as GovernanceDashboard };
export { BoardKPIDashboardEngine as BoardKPIDashboard };
