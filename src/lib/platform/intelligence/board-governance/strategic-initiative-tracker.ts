/**
 * Board & Governance Intelligence — StrategicInitiativeTracker (Sprint 029).
 */

import type { StrategicInitiativeTracker as StrategicInitiativeTrackerContract } from "@/lib/platform/intelligence/board-governance/contracts";
import {
  clamp,
  priorityFromScore,
} from "@/lib/platform/intelligence/board-governance/models";
import type {
  GovernanceBaseline,
  GovernanceRequest,
  StrategicInitiative,
  StrategicInitiativeStatus,
} from "@/lib/platform/intelligence/board-governance/types";

export interface StrategicInitiativeTrackerDependencies {
  createId?: (prefix: string) => string;
}

/**
 * StrategicInitiativeTracker — board initiative status tracker.
 */
export class StrategicInitiativeTrackerEngine
  implements StrategicInitiativeTrackerContract
{
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: StrategicInitiativeTrackerDependencies = {}) {
    this.createId =
      dependencies.createId ??
      ((prefix) =>
        `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  }

  track(input: {
    request: GovernanceRequest;
    baseline: GovernanceBaseline;
    now: Date;
  }): StrategicInitiative[] {
    if (input.request.initiatives && input.request.initiatives.length > 0) {
      return input.request.initiatives.slice(
        0,
        input.request.maxInitiatives ?? 10
      );
    }

    const progress = clamp(input.baseline.initiativeProgress, 0, 100);
    const target = new Date(input.now);
    target.setUTCMonth(target.getUTCMonth() + 6);

    const decisionInitiatives =
      input.request.decisionResult?.recommendations?.slice(0, 3) ?? [];

    const fromDecisions: StrategicInitiative[] = decisionInitiatives.map(
      (rec, index) => {
        const pct = clamp(progress - index * 8, 20, 95);
        const status: StrategicInitiativeStatus =
          pct < 40 ? "at_risk" : pct >= 90 ? "completed" : "active";
        const priority =
          rec.priority === "critical" ||
          rec.priority === "high" ||
          rec.priority === "medium" ||
          rec.priority === "low" ||
          rec.priority === "monitor"
            ? rec.priority
            : priorityFromScore(pct);
        return {
          id: this.createId(`init-dec-${rec.id}`),
          title: rec.title,
          description: rec.action || rec.executiveSummary || rec.title,
          owner: "Executive Team",
          status,
          progressPct: pct,
          targetDate: target.toISOString(),
          priority,
          budgetImpact: rec.financialImpact?.netDelta ?? null,
          kpiKeys: ["executive_kpi", "initiative_progress"],
          blockers: status === "at_risk" ? ["Resource contention"] : [],
          nextMilestone: "Board progress checkpoint",
          narrative: `Decision recommendation tracked as strategic initiative (${pct}% complete).`,
        };
      }
    );

    if (fromDecisions.length > 0) {
      return fromDecisions.slice(0, input.request.maxInitiatives ?? 10);
    }

    const defaults: StrategicInitiative[] = [
      {
        id: this.createId("init-enrollment"),
        title: "Enrollment growth & retention",
        description: "Stabilize enrollment and improve retention outcomes.",
        owner: "Admissions Lead",
        status: progress < 50 ? "at_risk" : "active",
        progressPct: progress,
        targetDate: target.toISOString(),
        priority: priorityFromScore(progress),
        budgetImpact: Math.round(input.baseline.revenue * 0.04),
        kpiKeys: ["enrollment", "revenue"],
        blockers: progress < 50 ? ["Pipeline conversion lag"] : [],
        nextMilestone: "Quarterly enrollment review",
        narrative: `Enrollment initiative at ${progress}% of board target.`,
      },
      {
        id: this.createId("init-cash"),
        title: "Cash & collections recovery",
        description: "Improve collections and protect operating cash.",
        owner: "Finance Lead",
        status: input.baseline.cashFlow < 10000 ? "at_risk" : "active",
        progressPct: clamp(progress + 5, 0, 100),
        targetDate: target.toISOString(),
        priority: "high",
        budgetImpact: Math.round(input.baseline.cashFlow * 0.2),
        kpiKeys: ["cash_flow", "revenue"],
        blockers: [],
        nextMilestone: "Finance committee collections deep-dive",
        narrative: "Cash recovery remains a standing strategic initiative.",
      },
      {
        id: this.createId("init-mission"),
        title: "Mission outcome acceleration",
        description: "Raise mission / academic outcomes to board targets.",
        owner: "Academic Lead",
        status: "active",
        progressPct: clamp(input.baseline.missionScore - 10, 0, 100),
        targetDate: target.toISOString(),
        priority: priorityFromScore(input.baseline.missionScore),
        budgetImpact: null,
        kpiKeys: ["mission", "organization_health"],
        blockers: [],
        nextMilestone: "Mission scorecard review",
        narrative: "Mission acceleration tracked for quarterly strategic review.",
      },
    ];

    return defaults.slice(0, input.request.maxInitiatives ?? 10);
  }
}

/** Alias matching Sprint 029 naming. */
export { StrategicInitiativeTrackerEngine as StrategicInitiativeTracker };
