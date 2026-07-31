/** Organizational Memory™ — institutional knowledge (no AI / no vectors). */

export const MEMORY_CATEGORIES = [
  "Decision",
  "Lesson Learned",
  "Best Practice",
  "Policy",
  "Standard Operating Procedure",
  "Meeting Outcome",
  "Customer Knowledge",
  "Vendor Knowledge",
  "Compliance",
  "Incident",
  "Risk",
  "Strategy",
  "Operational",
] as const;
export type MemoryCategory = (typeof MEMORY_CATEGORIES)[number];

export const MEMORY_SOURCES = [
  "Decisions",
  "Goals",
  "Risks",
  "Work",
  "Evidence",
  "Connectors",
  "Manual entry",
] as const;
export type MemorySource = (typeof MEMORY_SOURCES)[number];

export const MEMORY_CONFIDENCE = ["manual", "system"] as const;
export type MemoryConfidence = (typeof MEMORY_CONFIDENCE)[number];

export const MEMORY_STATUSES = [
  "Draft",
  "Validated",
  "Published",
  "Archived",
] as const;
export type MemoryStatus = (typeof MEMORY_STATUSES)[number];

export const MEMORY_TIMELINE_KINDS = [
  "created",
  "validated",
  "linked",
  "reviewed",
  "archived",
  "updated",
  "status_changed",
  "published",
] as const;
export type MemoryTimelineKind = (typeof MEMORY_TIMELINE_KINDS)[number];

export type JagMemory = {
  readonly id: string;
  readonly organizationId: string;
  readonly title: string;
  readonly summary: string;
  readonly category: MemoryCategory;
  readonly source: MemorySource;
  readonly confidence: MemoryConfidence;
  readonly status: MemoryStatus;
  readonly owner: string | null;
  readonly relatedDecisionId: string | null;
  readonly relatedGoalId: string | null;
  readonly relatedRiskId: string | null;
  readonly relatedProjectId: string | null;
  readonly relatedWorkItemId: string | null;
  readonly relatedEvidenceIds: readonly string[];
  readonly relatedTwinEntityIds: readonly string[];
  readonly relatedPersonIds: readonly string[];
  readonly relatedOrganizationIds: readonly string[];
  /** How many times this memory has been linked / referenced. */
  readonly referenceCount: number;
  readonly twinEntityId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastReviewedAt: string | null;
  readonly validatedAt: string | null;
  readonly publishedAt: string | null;
  readonly archivedAt: string | null;
  readonly createdBy: string;
};

export type MemoryTimelineEntry = {
  readonly id: string;
  readonly organizationId: string;
  readonly memoryId: string;
  readonly kind: MemoryTimelineKind;
  readonly at: string;
  readonly actor: string;
  readonly message: string;
  readonly metadata: Readonly<Record<string, string>>;
};

export type CreateMemoryInput = {
  organizationId: string;
  title: string;
  summary: string;
  category?: MemoryCategory;
  source?: MemorySource;
  confidence?: MemoryConfidence;
  status?: MemoryStatus;
  owner?: string | null;
  relatedDecisionId?: string | null;
  relatedGoalId?: string | null;
  relatedRiskId?: string | null;
  relatedProjectId?: string | null;
  relatedWorkItemId?: string | null;
  relatedEvidenceIds?: readonly string[];
  relatedTwinEntityIds?: readonly string[];
  relatedPersonIds?: readonly string[];
  relatedOrganizationIds?: readonly string[];
  createdBy: string;
};

export type PatchMemoryInput = {
  organizationId: string;
  memoryId: string;
  actor: string;
  title?: string;
  summary?: string;
  category?: MemoryCategory;
  source?: MemorySource;
  confidence?: MemoryConfidence;
  status?: MemoryStatus;
  owner?: string | null;
  relatedDecisionId?: string | null;
  relatedGoalId?: string | null;
  relatedRiskId?: string | null;
  relatedProjectId?: string | null;
  relatedWorkItemId?: string | null;
  relatedEvidenceIds?: readonly string[];
  relatedTwinEntityIds?: readonly string[];
  relatedPersonIds?: readonly string[];
  relatedOrganizationIds?: readonly string[];
  reviewed?: boolean;
};

export type OrganizationalKnowledgeSummary = {
  readonly newMemories: number;
  readonly recentlyUpdated: number;
  readonly pendingValidation: number;
  readonly published: number;
  readonly archived: number;
  readonly byCategory: Readonly<Record<string, number>>;
  readonly mostReferenced: readonly {
    readonly id: string;
    readonly title: string;
    readonly referenceCount: number;
    readonly category: MemoryCategory;
  }[];
};

export type MemoryDashboard = {
  readonly memories: readonly JagMemory[];
  readonly pendingValidation: readonly JagMemory[];
  readonly recentlyUpdated: readonly JagMemory[];
  readonly mostReferenced: readonly JagMemory[];
  readonly summary: OrganizationalKnowledgeSummary;
};
