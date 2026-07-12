/**
 * Board & Governance Intelligence — ResolutionTracker (Sprint 029).
 */

import type { ResolutionTracker as ResolutionTrackerContract } from "@/lib/platform/intelligence/board-governance/contracts";
import { clamp } from "@/lib/platform/intelligence/board-governance/models";
import type {
  BoardResolution,
  GovernanceRequest,
  ResolutionStatus,
  StrategicInitiative,
} from "@/lib/platform/intelligence/board-governance/types";

export interface ResolutionTrackerDependencies {
  createId?: (prefix: string) => string;
}

/**
 * ResolutionTracker — board resolution / action follow-up.
 */
export class ResolutionTrackerEngine implements ResolutionTrackerContract {
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: ResolutionTrackerDependencies = {}) {
    this.createId =
      dependencies.createId ??
      ((prefix) =>
        `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  }

  track(input: {
    request: GovernanceRequest;
    initiatives: StrategicInitiative[];
    now: Date;
  }): BoardResolution[] {
    if (input.request.resolutions && input.request.resolutions.length > 0) {
      return input.request.resolutions;
    }

    const due = new Date(input.now);
    due.setUTCDate(due.getUTCDate() + 45);
    const adopted = new Date(input.now);
    adopted.setUTCDate(adopted.getUTCDate() - 20);

    const linked = input.initiatives[0];
    const statusFor = (pct: number): ResolutionStatus =>
      pct >= 100 ? "completed" : pct >= 40 ? "in_progress" : "adopted";

    return [
      {
        id: this.createId("res-cash"),
        title: "Adopt cash recovery action plan",
        description:
          "Board directs management to execute collections and cash forecast cadence.",
        status: statusFor(55),
        adoptedAt: adopted.toISOString(),
        dueAt: due.toISOString(),
        owner: "CFO",
        committee: "finance",
        relatedInitiativeIds: linked ? [linked.id] : [],
        progressPct: 55,
        narrative: "Resolution in progress with finance committee oversight.",
      },
      {
        id: this.createId("res-enrollment"),
        title: "Approve enrollment growth targets",
        description:
          "Board adopts enrollment targets and retention interventions for the academic year.",
        status: statusFor(40),
        adoptedAt: adopted.toISOString(),
        dueAt: due.toISOString(),
        owner: "Head of School",
        committee: "academic",
        relatedInitiativeIds: input.initiatives
          .filter((i) => i.kpiKeys.includes("enrollment"))
          .map((i) => i.id),
        progressPct: 40,
        narrative: "Enrollment resolution tracked against admissions KPIs.",
      },
      {
        id: this.createId("res-compliance"),
        title: "Close open compliance findings",
        description:
          "Board directs closure of open compliance findings before next packet.",
        status: "in_progress",
        adoptedAt: adopted.toISOString(),
        dueAt: due.toISOString(),
        owner: "Compliance Officer",
        committee: "audit",
        relatedInitiativeIds: [],
        progressPct: clamp(70, 0, 100),
        narrative: "Compliance resolution monitored by audit committee.",
      },
    ];
  }
}

/** Alias matching Sprint 029 naming. */
export { ResolutionTrackerEngine as ResolutionTracker };
