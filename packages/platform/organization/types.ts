/**
 * Universal Organization Model™ — canonical org facets (P-007).
 *
 * One model; many governance profiles. No per-structure codebases.
 */

/** Legal / operating forms — governance differs, code does not. */
export const GOVERNANCE_PROFILE_IDS = [
  "sole_proprietorship",
  "single_member_llc",
  "multi_member_llc",
  "partnership",
  "llp",
  "s_corp",
  "c_corp",
  "holding_company",
  "family_office",
  "esop",
  "venture_backed_startup",
  "private_company",
  "public_company",
  "franchise",
  "cooperative",
  "nonprofit",
  "foundation",
  "association",
  "university",
  "school_system",
  "hospital",
  "healthcare_network",
  "government_agency",
  "municipality",
  "tribal_government",
  "religious_organization",
] as const;

export type GovernanceProfileId = (typeof GOVERNANCE_PROFILE_IDS)[number];

export type StrategyMode = "goals_only" | "strategy_assisted" | "strategy_driven";

export type GoalLevel =
  | "organizational"
  | "department"
  | "team"
  | "individual";

export type OrgIdentity = {
  readonly organizationId: string;
  readonly legalName: string;
  readonly displayName: string;
  readonly slug: string | null;
  readonly governanceProfileId: GovernanceProfileId;
  /** Existing tenant orgType (education-skewed) — preserved, not replaced. */
  readonly tenantOrgType: string | null;
  readonly industry: string | null;
  readonly sector: string | null;
  readonly foundedAt: string | null;
  readonly timezone: string;
  readonly locale: string;
  readonly currency: string;
};

export type OwnershipModel = {
  readonly ownershipType: string;
  readonly owners: readonly {
    readonly name: string;
    readonly sharePercent: number | null;
    readonly role: string | null;
  }[];
  readonly notes: string | null;
};

export type MissionBlock = {
  readonly mission: string | null;
  readonly vision: string | null;
  readonly values: readonly string[];
};

export type BoardSeat = {
  readonly id: string;
  readonly title: string;
  readonly personRef: string | null;
};

export type Committee = {
  readonly id: string;
  readonly name: string;
  readonly purpose: string;
  readonly memberRefs: readonly string[];
};

export type ApprovalThreshold = {
  readonly id: string;
  readonly domain: string;
  readonly description: string;
  readonly amount: number | null;
  readonly currency: string | null;
  readonly requiresBoard: boolean;
  readonly requiresCommitteeId: string | null;
};

/** Organizational Constitution™ — operating rules Mr. JAG must respect. */
export type OrganizationalConstitution = {
  readonly organizationId: string;
  readonly version: string;
  readonly legalStructure: GovernanceProfileId;
  readonly governanceModel: string;
  readonly ownership: OwnershipModel;
  readonly board: readonly BoardSeat[];
  readonly committees: readonly Committee[];
  readonly delegationOfAuthority: readonly string[];
  readonly approvalThresholds: readonly ApprovalThreshold[];
  readonly spendingAuthority: readonly string[];
  readonly hiringAuthority: readonly string[];
  readonly strategicPlanningFramework: string | null;
  readonly riskTolerance: "conservative" | "moderate" | "aggressive";
  readonly financialPolicies: readonly string[];
  readonly complianceObligations: readonly string[];
  readonly decisionMakingRules: readonly string[];
  readonly strategyMode: StrategyMode;
  readonly updatedAt: string;
};

export type GovernanceProfile = {
  readonly id: GovernanceProfileId;
  readonly title: string;
  readonly description: string;
  readonly defaultGovernanceModel: string;
  readonly defaultRiskTolerance: OrganizationalConstitution["riskTolerance"];
  readonly defaultStrategyMode: StrategyMode;
  readonly typicalCompliance: readonly string[];
  readonly typicalDecisionRules: readonly string[];
  readonly allowsBoard: boolean;
  readonly allowsEquity: boolean;
  readonly publicReporting: boolean;
};

export type OrgDepartment = {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly parentDepartmentId: string | null;
  readonly leaderPersonRef: string | null;
};

export type OrgTeam = {
  readonly id: string;
  readonly organizationId: string;
  readonly departmentId: string | null;
  readonly name: string;
  readonly leadPersonRef: string | null;
};

export type OrgPersonRef = {
  readonly id: string;
  readonly organizationId: string;
  readonly displayName: string;
  readonly roleTitle: string | null;
  readonly departmentId: string | null;
  readonly teamId: string | null;
  readonly stakeholderKind:
    | "employee"
    | "contractor"
    | "board"
    | "customer"
    | "member"
    | "student"
    | "client"
    | "volunteer"
    | "other";
};

export type StrategicObjective = {
  readonly id: string;
  readonly organizationId: string;
  readonly title: string;
  readonly description: string;
  readonly order: number;
};

export type StrategicInitiative = {
  readonly id: string;
  readonly organizationId: string;
  readonly objectiveId: string | null;
  readonly title: string;
  readonly description: string;
};

export type StrategicPlan = {
  readonly id: string;
  readonly organizationId: string;
  readonly title: string;
  readonly horizonStart: string | null;
  readonly horizonEnd: string | null;
  readonly objectives: readonly StrategicObjective[];
  readonly initiatives: readonly StrategicInitiative[];
  readonly active: boolean;
};

export type OrgGoal = {
  readonly id: string;
  readonly organizationId: string;
  readonly title: string;
  readonly description: string;
  readonly level: GoalLevel;
  readonly ownerPersonRef: string | null;
  readonly departmentId: string | null;
  readonly teamId: string | null;
  /** Optional cascade — never required. */
  readonly parentGoalId: string | null;
  readonly strategicObjectiveId: string | null;
  readonly kpiIds: readonly string[];
  readonly milestoneIds: readonly string[];
  readonly dependencyGoalIds: readonly string[];
  readonly status: "draft" | "active" | "at_risk" | "completed" | "cancelled";
  readonly progressPercent: number;
  readonly dueAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type OrgKpi = {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly target: number | null;
  readonly current: number | null;
  readonly unit: string | null;
  readonly goalId: string | null;
};

export type OrgMilestone = {
  readonly id: string;
  readonly organizationId: string;
  readonly goalId: string;
  readonly title: string;
  readonly dueAt: string | null;
  readonly completed: boolean;
};

export type OrgProject = {
  readonly id: string;
  readonly organizationId: string;
  readonly title: string;
  readonly goalId: string | null;
  readonly initiativeId: string | null;
  readonly status: "planned" | "active" | "blocked" | "done";
};

export type OrgTask = {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId: string | null;
  readonly goalId: string | null;
  readonly title: string;
  readonly assigneePersonRef: string | null;
  readonly status: "todo" | "doing" | "done";
};

export type PerformanceReview = {
  readonly id: string;
  readonly organizationId: string;
  readonly personRef: string;
  readonly periodLabel: string;
  readonly summary: string;
  readonly rating: number | null;
  readonly createdAt: string;
};

export type OneOnOneRecord = {
  readonly id: string;
  readonly organizationId: string;
  readonly managerRef: string;
  readonly reportRef: string;
  readonly notes: string;
  readonly occurredAt: string;
};

export type OrgPolicy = {
  readonly id: string;
  readonly organizationId: string;
  readonly title: string;
  readonly category: string;
  readonly body: string;
};

export type ComplianceObligation = {
  readonly id: string;
  readonly organizationId: string;
  readonly title: string;
  readonly authority: string;
  readonly dueAt: string | null;
  readonly status: "open" | "met" | "overdue";
};

export type OrgRiskItem = {
  readonly id: string;
  readonly organizationId: string;
  readonly title: string;
  readonly severity: "low" | "medium" | "high" | "critical";
  readonly mitigation: string | null;
  readonly open: boolean;
};

/** Lightweight finance hooks — full JAG Finance™ is a later multi-sprint. */
export type FinanceHooks = {
  readonly multiEntity: boolean;
  readonly fiscalYearStartMonth: number;
  readonly chartOfAccountsReady: boolean;
  readonly bankingConnected: boolean;
  readonly notes: string | null;
};

export type OrgKnowledgeEntry = {
  readonly id: string;
  readonly organizationId: string;
  readonly title: string;
  readonly body: string;
  readonly tags: readonly string[];
};

export type OrgMemoryEntry = {
  readonly id: string;
  readonly organizationId: string;
  readonly kind: string;
  readonly summary: string;
  readonly occurredAt: string;
};

export type OrgTwinLink = {
  readonly organizationId: string;
  readonly twinEntityId: string | null;
  readonly lastProjectedAt: string | null;
  readonly notes: string;
};

export type UniversalOrganization = {
  readonly identity: OrgIdentity;
  readonly mission: MissionBlock;
  readonly constitution: OrganizationalConstitution;
  readonly leadershipPersonRefs: readonly string[];
  readonly departments: readonly OrgDepartment[];
  readonly teams: readonly OrgTeam[];
  readonly people: readonly OrgPersonRef[];
  readonly strategicPlan: StrategicPlan | null;
  readonly goals: readonly OrgGoal[];
  readonly kpis: readonly OrgKpi[];
  readonly projects: readonly OrgProject[];
  readonly tasks: readonly OrgTask[];
  readonly policies: readonly OrgPolicy[];
  readonly compliance: readonly ComplianceObligation[];
  readonly risks: readonly OrgRiskItem[];
  readonly finance: FinanceHooks;
  readonly knowledge: readonly OrgKnowledgeEntry[];
  readonly memory: readonly OrgMemoryEntry[];
  readonly twin: OrgTwinLink;
  readonly assets: readonly { id: string; name: string; kind: string }[];
  readonly technology: readonly { id: string; name: string; kind: string }[];
  readonly customers: readonly OrgPersonRef[];
  readonly updatedAt: string;
};

export type ConstitutionAdvice = {
  readonly organizationId: string;
  readonly allowed: boolean;
  readonly reasons: readonly string[];
  readonly mrJagMessage: string;
  readonly applicableRules: readonly string[];
};

export type OrganizationDashboard = {
  readonly generatedAt: string;
  readonly identity: OrgIdentity;
  readonly strategyMode: StrategyMode;
  readonly constitutionVersion: string;
  readonly goalCounts: Readonly<Record<GoalLevel, number>>;
  readonly activeGoals: number;
  readonly atRiskGoals: number;
  readonly openRisks: number;
  readonly openCompliance: number;
  readonly departmentCount: number;
  readonly teamCount: number;
  readonly peopleCount: number;
  readonly hasStrategicPlan: boolean;
  readonly financeHooks: FinanceHooks;
  readonly mrJagGuidance: string;
};
