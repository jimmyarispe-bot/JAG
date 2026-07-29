/** Decision Center — projections of real contributor action proposals. */

export const JAG_DECISION_STATUSES = [
  "New",
  "Reviewing",
  "Approved",
  "Deferred",
  "Completed",
  "Dismissed",
] as const;

export type JagDecisionStatus = (typeof JAG_DECISION_STATUSES)[number];

export const JAG_DECISION_GROUPS = [
  "students",
  "operations",
  "funding",
  "executive",
] as const;

export type JagDecisionGroup = (typeof JAG_DECISION_GROUPS)[number];

export type JagDecisionPriorityLabel = "P1" | "P2" | "P3";

export type JagDecisionCard = {
  readonly id: string;
  readonly title: string;
  readonly category: JagDecisionGroup;
  readonly categoryLabel: string;
  readonly organizationId: string;
  readonly organizationName: string;
  readonly domainId: string;
  readonly domainName: string;
  readonly capabilityPackId: string;
  readonly capabilityPackName: string;
  readonly contributorId: string;
  readonly contributorLabel: string;
  readonly priority: JagDecisionPriorityLabel;
  readonly priorityRank: number;
  readonly confidence: number;
  readonly evidenceCount: number;
  readonly recommendedAction: string;
  readonly status: JagDecisionStatus;
  readonly actionId: string;
  readonly actionKind: string;
  readonly executionId: string;
  readonly analyzedAt: string;
  readonly rationale: string;
};

export type JagDecisionTimelineEntry = {
  readonly id: string;
  readonly at: string;
  readonly actor: string;
  readonly message: string;
  readonly fromStatus: JagDecisionStatus | null;
  readonly toStatus: JagDecisionStatus | null;
};

export type JagDecisionDetail = {
  readonly card: JagDecisionCard;
  readonly evidence: readonly {
    readonly id: string;
    readonly source: string;
    readonly code?: string;
    readonly summary?: string;
  }[];
  readonly recommendations: readonly {
    readonly id: string;
    readonly title: string;
    readonly explanation: string;
    readonly confidence: number;
    readonly priority: number;
  }[];
  readonly policyTrace: readonly string[];
  readonly knowledgeReferences: readonly string[];
  readonly contributorTrace: {
    readonly contributorId: string;
    readonly readiness: string;
    readonly explanation: string;
    readonly blockingIssues: readonly string[];
    readonly warnings: readonly string[];
    readonly laws: readonly string[];
    readonly rationale: string;
  };
  readonly dependencies: readonly string[];
  readonly timeline: readonly JagDecisionTimelineEntry[];
  readonly observability: {
    readonly analyzedAt: string;
    readonly durationMs?: number;
    readonly evidenceCount: number;
    readonly recommendationCount: number;
    readonly confidence: number;
  };
};

export type JagDecisionFilters = {
  readonly priority?: JagDecisionPriorityLabel | "all";
  readonly organizationId?: string | "all";
  readonly domainId?: string | "all";
  readonly capabilityPackId?: string | "all";
  readonly status?: JagDecisionStatus | "all";
  readonly contributorId?: string | "all";
  readonly group?: JagDecisionGroup | "all";
  readonly q?: string;
};

export type JagDecisionCenterModel = {
  readonly decisions: readonly JagDecisionCard[];
  readonly grouped: Readonly<Record<JagDecisionGroup, readonly JagDecisionCard[]>>;
  readonly filters: JagDecisionFilters;
  readonly filterOptions: {
    readonly organizations: readonly { id: string; label: string }[];
    readonly domains: readonly { id: string; label: string }[];
    readonly packs: readonly { id: string; label: string }[];
    readonly contributors: readonly { id: string; label: string }[];
    readonly statuses: readonly JagDecisionStatus[];
    readonly priorities: readonly JagDecisionPriorityLabel[];
  };
  readonly counts: {
    readonly total: number;
    readonly byStatus: Readonly<Record<JagDecisionStatus, number>>;
    readonly byGroup: Readonly<Record<JagDecisionGroup, number>>;
  };
};
