/**
 * Board & Governance Intelligence — GovernanceCalendar (Sprint 029).
 */

import type { GovernanceCalendar as GovernanceCalendarContract } from "@/lib/platform/intelligence/board-governance/contracts";
import type {
  BoardResolution,
  GovernanceCalendarEvent,
  GovernanceRequest,
} from "@/lib/platform/intelligence/board-governance/types";

export interface GovernanceCalendarDependencies {
  createId?: (prefix: string) => string;
}

/**
 * GovernanceCalendar — upcoming board / committee / deadline events.
 */
export class GovernanceCalendarEngine implements GovernanceCalendarContract {
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: GovernanceCalendarDependencies = {}) {
    this.createId =
      dependencies.createId ??
      ((prefix) =>
        `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  }

  build(input: {
    request: GovernanceRequest;
    resolutions: BoardResolution[];
    now: Date;
  }): GovernanceCalendarEvent[] {
    if (
      input.request.calendarEvents &&
      input.request.calendarEvents.length > 0
    ) {
      return input.request.calendarEvents;
    }

    const offset = (days: number) => {
      const d = new Date(input.now);
      d.setUTCDate(d.getUTCDate() + days);
      return d.toISOString();
    };

    const events: GovernanceCalendarEvent[] = [
      {
        id: this.createId("cal-board"),
        kind: "board_meeting",
        title: "Full Board Meeting",
        scheduledAt: offset(14),
        committee: "full_board",
        relatedArtifactIds: [],
        narrative: "Monthly full board meeting for packet review and votes.",
      },
      {
        id: this.createId("cal-finance"),
        kind: "committee_meeting",
        title: "Finance Committee",
        scheduledAt: offset(7),
        committee: "finance",
        relatedArtifactIds: [],
        narrative: "Pre-board finance review of cash, revenue, and controls.",
      },
      {
        id: this.createId("cal-packet"),
        kind: "packet_deadline",
        title: "Board packet distribution deadline",
        scheduledAt: offset(10),
        committee: "governance",
        relatedArtifactIds: [],
        narrative: "Deadline to distribute monthly board packet materials.",
      },
      {
        id: this.createId("cal-strategic"),
        kind: "strategic_review",
        title: "Quarterly Strategic Review",
        scheduledAt: offset(45),
        committee: "full_board",
        relatedArtifactIds: [],
        narrative: "Quarterly strategic initiative and mission scorecard review.",
      },
    ];

    for (const resolution of input.resolutions.slice(0, 3)) {
      if (!resolution.dueAt) continue;
      events.push({
        id: this.createId(`cal-res-${resolution.id}`),
        kind: "resolution_follow_up",
        title: `Follow-up: ${resolution.title}`,
        scheduledAt: resolution.dueAt,
        committee: resolution.committee,
        relatedArtifactIds: [resolution.id],
        narrative: `Resolution follow-up for ${resolution.owner}.`,
      });
    }

    return events.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  }
}

/** Alias matching Sprint 029 naming. */
export { GovernanceCalendarEngine as GovernanceCalendar };
