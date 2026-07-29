/** Executive Briefing Engine — application-layer narrative synthesis. */

export const JAG_BRIEFING_TIMELINES = [
  "today",
  "this_week",
  "this_month",
  "quarter",
  "custom",
] as const;

export type JagBriefingTimeline = (typeof JAG_BRIEFING_TIMELINES)[number];

export const JAG_BRIEFING_SCOPES = [
  "single",
  "multi",
  "enterprise",
] as const;

export type JagBriefingScope = (typeof JAG_BRIEFING_SCOPES)[number];

export const JAG_BRIEFING_KINDS = [
  "morning_brief",
  "weekly_executive_review",
  "monthly_board_report",
  "quarterly_strategic_review",
  "operational_incident_brief",
  "funding_brief",
  "student_success_brief",
  "compliance_brief",
  "risk_brief",
] as const;

export type JagBriefingKind = (typeof JAG_BRIEFING_KINDS)[number];

export const JAG_BRIEFING_SECTION_IDS = [
  "executive_summary",
  "what_happened",
  "why_it_happened",
  "decide_today",
  "if_i_do_nothing",
  "watch_next",
  "todays_priorities",
  "critical_risks",
  "opportunities",
  "decision_queue_summary",
  "completed_outcomes",
  "emerging_trends",
  "forecast",
  "recommended_executive_actions",
  "executive_insights",
  "appendix",
] as const;

export type JagBriefingSectionId = (typeof JAG_BRIEFING_SECTION_IDS)[number];

export const JAG_BRIEFING_SECTION_ACTIONS = [
  "approve_decision",
  "open_decision",
  "assign",
  "create_follow_up",
  "add_executive_note",
  "schedule_review",
] as const;

export type JagBriefingSectionAction =
  (typeof JAG_BRIEFING_SECTION_ACTIONS)[number];

export type JagBriefingEvidenceRef = {
  readonly id: string;
  readonly source: string;
  readonly summary?: string;
  readonly code?: string;
};

export type JagBriefingExplainability = {
  readonly evidence: readonly JagBriefingEvidenceRef[];
  readonly contributors: readonly string[];
  readonly policies: readonly string[];
  readonly confidence: number | null;
  readonly dependencies: readonly string[];
  readonly timeline: readonly {
    readonly at: string;
    readonly message: string;
  }[];
};

export type JagBriefingRecommendation = {
  readonly id: string;
  readonly title: string;
  readonly rationale: string;
  readonly decisionId: string | null;
  readonly decisionHref: string | null;
  readonly organizationId?: string;
  readonly explainability: JagBriefingExplainability;
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
  readonly recommendations: readonly JagBriefingRecommendation[];
  readonly decisionIds: readonly string[];
  readonly availableActions: readonly JagBriefingSectionAction[];
  readonly emptyReason?: string;
};

export type JagBriefingWindow = {
  readonly timeline: JagBriefingTimeline;
  readonly start: string;
  readonly end: string;
  readonly label: string;
};

export const JAG_EXECUTIVE_INSIGHT_KINDS = [
  "largest_improvement",
  "largest_deterioration",
  "highest_confidence",
  "lowest_confidence",
  "fastest_growing_risk",
  "highest_impact_opportunity",
  "most_successful_completed_decision",
  "most_overdue_decision",
] as const;

export type JagExecutiveInsightKind =
  (typeof JAG_EXECUTIVE_INSIGHT_KINDS)[number];

export type JagExecutiveInsight = {
  readonly kind: JagExecutiveInsightKind;
  readonly label: string;
  readonly value: string;
  readonly detail: string;
  readonly decisionId: string | null;
  readonly decisionHref: string | null;
  readonly confidence: number | null;
};

export type JagBriefingNote = {
  readonly id: string;
  readonly at: string;
  readonly actor: string;
  readonly text: string;
  readonly sectionId?: JagBriefingSectionId;
};

export type JagBriefingScheduledReview = {
  readonly at: string;
  readonly note: string;
  readonly scheduledBy: string;
  readonly scheduledAt: string;
};

export type JagExecutiveBriefing = {
  readonly id: string;
  /** Primary org for single scope; first org for multi/enterprise. */
  readonly organizationId: string;
  readonly organizationName: string;
  readonly organizationIds: readonly string[];
  readonly organizationNames: readonly string[];
  readonly scope: JagBriefingScope;
  readonly kind: JagBriefingKind;
  readonly kindLabel: string;
  readonly generatedAt: string;
  readonly generatedBy: string;
  readonly window: JagBriefingWindow;
  readonly title: string;
  readonly overallConfidence: number | null;
  readonly sourceCount: number;
  readonly sections: readonly JagBriefingSection[];
  readonly insights: readonly JagExecutiveInsight[];
  readonly recommendations: readonly JagBriefingRecommendation[];
  readonly notes: readonly JagBriefingNote[];
  readonly scheduledReview: JagBriefingScheduledReview | null;
  readonly shareToken: string | null;
  /** True when at least one primary source contributed content. */
  readonly hasSubstance: boolean;
};

export type JagBriefingListItem = {
  readonly id: string;
  readonly organizationId: string;
  readonly organizationName: string;
  readonly organizationIds: readonly string[];
  readonly scope: JagBriefingScope;
  readonly kind: JagBriefingKind;
  readonly kindLabel: string;
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
  readonly scopes: readonly JagBriefingScope[];
  readonly kinds: readonly JagBriefingKind[];
};

export type GenerateBriefingInput = {
  readonly scope: JagBriefingScope;
  readonly organizationId?: string;
  readonly organizationIds?: readonly string[];
  readonly kind: JagBriefingKind;
  readonly timeline: JagBriefingTimeline;
  readonly customStart?: string;
  readonly customEnd?: string;
};
