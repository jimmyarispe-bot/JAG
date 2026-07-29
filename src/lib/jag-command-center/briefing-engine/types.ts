/** Executive Briefing Engine — application-layer narrative synthesis. */

export const JAG_BRIEFING_TIMELINES = [
  "today",
  "this_week",
  "this_month",
  "quarter",
  "custom",
] as const;

export type JagBriefingTimeline = (typeof JAG_BRIEFING_TIMELINES)[number];

export const JAG_BRIEFING_SECTION_IDS = [
  "executive_summary",
  "todays_priorities",
  "critical_risks",
  "opportunities",
  "decision_queue_summary",
  "completed_outcomes",
  "emerging_trends",
  "recommended_executive_actions",
  "appendix",
] as const;

export type JagBriefingSectionId = (typeof JAG_BRIEFING_SECTION_IDS)[number];

export type JagBriefingEvidenceRef = {
  readonly id: string;
  readonly source: string;
  readonly summary?: string;
  readonly code?: string;
};

export type JagBriefingSection = {
  readonly id: JagBriefingSectionId;
  readonly title: string;
  readonly narrative: string;
  readonly bullets: readonly string[];
  readonly confidence: number | null;
  readonly evidenceReferences: readonly JagBriefingEvidenceRef[];
  readonly contributorSources: readonly string[];
  readonly policyReferences: readonly string[];
  readonly emptyReason?: string;
};

export type JagBriefingWindow = {
  readonly timeline: JagBriefingTimeline;
  readonly start: string;
  readonly end: string;
  readonly label: string;
};

export type JagExecutiveBriefing = {
  readonly id: string;
  readonly organizationId: string;
  readonly organizationName: string;
  readonly generatedAt: string;
  readonly generatedBy: string;
  readonly window: JagBriefingWindow;
  readonly title: string;
  readonly overallConfidence: number | null;
  readonly sourceCount: number;
  readonly sections: readonly JagBriefingSection[];
  /** True when at least one primary source contributed content. */
  readonly hasSubstance: boolean;
};

export type JagBriefingListItem = {
  readonly id: string;
  readonly organizationId: string;
  readonly organizationName: string;
  readonly title: string;
  readonly generatedAt: string;
  readonly timeline: JagBriefingTimeline;
  readonly windowLabel: string;
  readonly overallConfidence: number | null;
  readonly hasSubstance: boolean;
};

export type JagBriefingListModel = {
  readonly briefings: readonly JagBriefingListItem[];
  readonly organizations: readonly { id: string; label: string }[];
  readonly selectedOrganizationId: string | null;
  readonly timelines: readonly JagBriefingTimeline[];
};

export type GenerateBriefingInput = {
  readonly organizationId: string;
  readonly timeline: JagBriefingTimeline;
  readonly customStart?: string;
  readonly customEnd?: string;
};
