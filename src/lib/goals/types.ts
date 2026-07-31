/** Goals & Strategy™ — deterministic OKR / strategy model (no AI). */

export const GOAL_TYPES = [
  "Strategic Goal",
  "Objective",
  "Key Result",
  "Initiative",
  "Project Goal",
  "Compliance Goal",
] as const;
export type GoalType = (typeof GOAL_TYPES)[number];

/** Hierarchy levels used for Vision → … → Tasks linking. */
export const GOAL_HIERARCHY_LEVELS = [
  "Vision",
  "Strategic Goal",
  "Objective",
  "Key Result",
  "Initiative",
  "Project",
  "Task",
] as const;
export type GoalHierarchyLevel = (typeof GOAL_HIERARCHY_LEVELS)[number];

export const GOAL_STATUSES = [
  "Draft",
  "Active",
  "On Hold",
  "Completed",
  "Archived",
  "Cancelled",
] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];

export const GOAL_PRIORITIES = ["P1", "P2", "P3"] as const;
export type GoalPriority = (typeof GOAL_PRIORITIES)[number];

export const GOAL_CATEGORIES = [
  "Finance",
  "Operations",
  "Growth",
  "People",
  "Product",
  "Compliance",
  "Customer",
  "Technology",
  "General",
] as const;
export type GoalCategory = (typeof GOAL_CATEGORIES)[number];

export const GOAL_VISIBILITIES = [
  "Organization",
  "Business Unit",
  "Department",
  "Private",
] as const;
export type GoalVisibility = (typeof GOAL_VISIBILITIES)[number];

export const GOAL_HEALTH = [
  "On Track",
  "Watch",
  "At Risk",
  "Off Track",
  "Completed",
] as const;
export type GoalHealth = (typeof GOAL_HEALTH)[number];

export const GOAL_RELATIONSHIP_KINDS = [
  "decision",
  "evidence",
  "kpi",
  "risk",
  "opportunity",
  "project",
  "business_unit",
  "twin",
] as const;
export type GoalRelationshipKind = (typeof GOAL_RELATIONSHIP_KINDS)[number];

export const GOAL_TIMELINE_KINDS = [
  "created",
  "updated",
  "assigned",
  "progress_changed",
  "completed",
  "archived",
] as const;
export type GoalTimelineKind = (typeof GOAL_TIMELINE_KINDS)[number];

export type GoalLink = {
  readonly kind: GoalRelationshipKind;
  readonly targetId: string;
  readonly label: string;
};

export type JagGoal = {
  readonly id: string;
  readonly organizationId: string;
  readonly title: string;
  readonly description: string;
  readonly category: GoalCategory;
  readonly owner: string | null;
  readonly businessUnit: string | null;
  readonly department: string | null;
  readonly status: GoalStatus;
  readonly priority: GoalPriority;
  readonly targetDate: string | null;
  readonly startDate: string | null;
  /** 0–100; may be overridden by progress engine. */
  readonly progressPercent: number;
  readonly parentGoalId: string | null;
  readonly goalType: GoalType;
  readonly hierarchyLevel: GoalHierarchyLevel;
  readonly visibility: GoalVisibility;
  readonly health: GoalHealth;
  readonly links: readonly GoalLink[];
  readonly twinEntityId: string | null;
  readonly manualProgressPercent: number | null;
  readonly completedTaskIds: readonly string[];
  readonly completedDecisionIds: readonly string[];
  readonly kpiUpdateCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly completedAt: string | null;
  readonly archivedAt: string | null;
  readonly createdBy: string;
};

export type GoalTimelineEntry = {
  readonly id: string;
  readonly organizationId: string;
  readonly goalId: string;
  readonly kind: GoalTimelineKind;
  readonly at: string;
  readonly actor: string;
  readonly message: string;
  readonly metadata: Readonly<Record<string, string>>;
};

export type CreateGoalInput = {
  readonly organizationId: string;
  readonly title: string;
  readonly description: string;
  readonly category?: GoalCategory;
  readonly owner?: string | null;
  readonly businessUnit?: string | null;
  readonly department?: string | null;
  readonly status?: GoalStatus;
  readonly priority?: GoalPriority;
  readonly targetDate?: string | null;
  readonly startDate?: string | null;
  readonly parentGoalId?: string | null;
  readonly goalType?: GoalType;
  readonly hierarchyLevel?: GoalHierarchyLevel;
  readonly visibility?: GoalVisibility;
  readonly links?: readonly GoalLink[];
  readonly manualProgressPercent?: number | null;
  readonly createdBy: string;
};

export type PatchGoalInput = {
  readonly organizationId: string;
  readonly goalId: string;
  readonly actor: string;
  readonly title?: string;
  readonly description?: string;
  readonly category?: GoalCategory;
  readonly owner?: string | null;
  readonly businessUnit?: string | null;
  readonly department?: string | null;
  readonly status?: GoalStatus;
  readonly priority?: GoalPriority;
  readonly targetDate?: string | null;
  readonly startDate?: string | null;
  readonly parentGoalId?: string | null;
  readonly goalType?: GoalType;
  readonly hierarchyLevel?: GoalHierarchyLevel;
  readonly visibility?: GoalVisibility;
  readonly links?: readonly GoalLink[];
  readonly manualProgressPercent?: number | null;
  readonly completedTaskIds?: readonly string[];
  readonly completedDecisionIds?: readonly string[];
  readonly kpiUpdateCount?: number;
};

export type StrategySummary = {
  readonly activeGoals: number;
  readonly completedGoals: number;
  readonly goalsAtRisk: number;
  readonly goalsBehindSchedule: number;
  readonly averageProgress: number;
  readonly byGoalType: Readonly<Record<string, number>>;
  readonly byHealth: Readonly<Record<GoalHealth, number>>;
  readonly progressByBusinessUnit: Readonly<Record<string, number>>;
  readonly progressByDepartment: Readonly<Record<string, number>>;
};

export type GoalDashboard = {
  readonly strategicGoals: readonly JagGoal[];
  readonly objectives: readonly JagGoal[];
  readonly keyResults: readonly JagGoal[];
  readonly atRisk: readonly JagGoal[];
  readonly behindSchedule: readonly JagGoal[];
  readonly completed: readonly JagGoal[];
  readonly summary: StrategySummary;
};
