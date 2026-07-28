/** RC-1 — End-to-End Operational Validation types. */

export const VALIDATION_SCENARIO_IDS = [
  "student_journey",
  "family_financial",
  "employee_lifecycle",
  "teacher_daily",
  "parent_experience",
  "executive_workflow",
  "cross_domain_events",
  "organization_isolation",
] as const;
export type ValidationScenarioId = (typeof VALIDATION_SCENARIO_IDS)[number];

export const VALIDATION_DOMAINS = [
  "admissions",
  "sis",
  "academic_ops",
  "learning",
  "finance",
  "workforce",
  "communications",
  "executive",
  "cross_domain",
  "isolation",
  "performance",
] as const;
export type ValidationDomain = (typeof VALIDATION_DOMAINS)[number];

export type AssertionSeverity = "blocker" | "critical" | "major" | "minor";

export type ValidationAssertion = {
  readonly name: string;
  readonly ok: boolean;
  readonly detail?: string;
  readonly severity: AssertionSeverity;
};

export type PerformanceSample = {
  readonly name: string;
  readonly durationMs: number;
  readonly organizationId: string;
};

export type ValidationScenarioResult = {
  readonly id: ValidationScenarioId;
  readonly name: string;
  readonly domains: readonly ValidationDomain[];
  readonly organizationIds: readonly string[];
  readonly passed: boolean;
  readonly assertions: readonly ValidationAssertion[];
  readonly durationMs: number;
  readonly performance: readonly PerformanceSample[];
  readonly blockers: readonly string[];
  readonly ranAt: string;
};

export type DomainCoverage = {
  readonly domain: ValidationDomain;
  readonly scenarios: number;
  readonly passed: number;
  readonly failed: number;
  readonly coveragePercent: number;
};

export type ReleaseRecommendation =
  | "Ready for RC-2"
  | "Ready for RC-3"
  | "Ready with known issues"
  | "Blocked — remediation required";

export type ReleaseReadinessDashboard = {
  readonly organizationId: string | null;
  readonly generatedAt: string;
  readonly scenariosPassed: number;
  readonly scenariosFailed: number;
  readonly totalScenarios: number;
  readonly passRate: number;
  readonly coverageByDomain: readonly DomainCoverage[];
  readonly openBlockers: readonly {
    readonly scenarioId: string;
    readonly detail: string;
    readonly severity: AssertionSeverity;
  }[];
  readonly criticalDefects: readonly string[];
  readonly performanceBaselines: readonly PerformanceSample[];
  readonly recommendation: ReleaseRecommendation;
  readonly results: readonly ValidationScenarioResult[];
};

export type ValidationRunOptions = {
  readonly organizationId?: string;
  readonly organizationIds?: readonly string[];
  readonly scenarioIds?: readonly ValidationScenarioId[];
  readonly freshSdk?: boolean;
};
