/**
 * Production readiness validation types — Sprint 209.
 * Application-layer GA checks only. No new intelligence capabilities.
 */

export type ValidationCheckResult = {
  readonly ok: boolean;
  readonly detail: string;
};

export type ValidationCheck = {
  readonly id: string;
  readonly label: string;
  readonly category: "workflow" | "capability" | "system";
  readonly ok: boolean;
  readonly detail: string;
};

export type WorkflowLink = {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly hrefs: readonly string[];
  readonly validate: () => ValidationCheckResult;
};

export type CapabilityHealthReport = {
  readonly id: string;
  readonly name: string;
  readonly healthy: boolean;
  readonly healthStatus: string;
  readonly healthSummary: string;
  readonly version: string;
  readonly enabled: boolean;
  readonly lifecycle: string;
  readonly dependencies: readonly string[];
  readonly providers: readonly string[];
  readonly routes: readonly { path: string; label: string }[];
  readonly permissions: {
    readonly required: readonly string[];
    readonly optional: readonly string[];
  };
  readonly observability: string | null;
  readonly dependencyIssues: readonly string[];
  readonly ok: boolean;
  readonly detail: string;
};

export type ValidationReport = {
  readonly generatedAt: string;
  readonly ok: boolean;
  readonly passCount: number;
  readonly failCount: number;
  readonly checks: readonly ValidationCheck[];
  readonly workflow: {
    readonly links: readonly {
      readonly id: string;
      readonly from: string;
      readonly to: string;
      readonly hrefs: readonly string[];
      readonly ok: boolean;
      readonly detail: string;
    }[];
    readonly passCount: number;
    readonly failCount: number;
  };
  readonly capabilities: {
    readonly reports: readonly CapabilityHealthReport[];
    readonly passCount: number;
    readonly failCount: number;
  };
  readonly advisoryNotice: string;
};
