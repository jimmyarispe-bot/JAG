/** RC-2 — Production Hardening types. */

import type {
  AssertionSeverity,
  PerformanceSample,
  ReleaseReadinessDashboard,
  ValidationAssertion,
} from "../validation/types";

export type GateStatus = "Pass" | "Pass with issues" | "Fail" | "Not run";

export const HARDENING_SUITE_IDS = [
  "security",
  "resilience",
  "performance",
  "accessibility",
  "audit_observability",
  "deployment",
  "backup_recovery",
  "multi_tenant_isolation",
] as const;
export type HardeningSuiteId = (typeof HARDENING_SUITE_IDS)[number];

export type HardeningSuiteResult = {
  readonly id: HardeningSuiteId;
  readonly name: string;
  readonly passed: boolean;
  readonly assertions: readonly ValidationAssertion[];
  readonly durationMs: number;
  readonly performance: readonly PerformanceSample[];
  readonly blockers: readonly string[];
  readonly ranAt: string;
};

export type Rc2HardeningSummary = {
  readonly securityStatus: GateStatus;
  readonly performanceStatus: GateStatus;
  readonly accessibilityStatus: GateStatus;
  readonly operationalReadiness: GateStatus;
  readonly deploymentReadiness: GateStatus;
  readonly outstandingBlockers: readonly {
    readonly suiteId: string;
    readonly detail: string;
    readonly severity: AssertionSeverity;
  }[];
  readonly rcRecommendation:
    | "Ready for RC-3"
    | "Ready with known issues"
    | "Blocked — remediation required";
  readonly suitesPassed: number;
  readonly suitesFailed: number;
  readonly totalSuites: number;
  readonly results: readonly HardeningSuiteResult[];
};

export type Rc2ReleaseReadinessDashboard = ReleaseReadinessDashboard & {
  readonly rc2: Rc2HardeningSummary;
};

export type HardeningRunOptions = {
  readonly organizationId?: string;
  readonly organizationIds?: readonly string[];
  readonly suiteIds?: readonly HardeningSuiteId[];
  readonly includeRc1?: boolean;
  readonly freshSdk?: boolean;
  readonly repositoryRoot?: string;
};
