/**
 * GA certification types — Sprint 210.
 * Validation + defect detection only. No new product features.
 */

export type Severity = "critical" | "high" | "medium" | "low";

export type GaRecommendation = "GO" | "GO_WITH_CONDITIONS" | "NO_GO";

export type CertificationPhase =
  | "workflow_inventory"
  | "auth"
  | "roles"
  | "security"
  | "jag"
  | "system";

export type Finding = {
  readonly id: string;
  readonly severity: Severity;
  readonly phase: CertificationPhase;
  readonly title: string;
  readonly detail: string;
  readonly blocker: boolean;
};

export type AuthCheck = {
  readonly id: string;
  readonly label: string;
  readonly ok: boolean;
  readonly detail: string;
  readonly path: string;
};

export type RoleCheck = {
  readonly id: string;
  readonly label: string;
  readonly ok: boolean;
  readonly detail: string;
};

export type SecurityCheck = {
  readonly id: string;
  readonly label: string;
  readonly ok: boolean;
  readonly detail: string;
};

export type JagSurfaceCheck = {
  readonly id: string;
  readonly label: string;
  readonly ok: boolean;
  readonly detail: string;
  readonly href?: string;
};

export type SystemCheck = {
  readonly id: string;
  readonly label: string;
  readonly ok: boolean;
  readonly detail: string;
  readonly path: string;
};

export type PhaseResult = {
  readonly phase: CertificationPhase;
  readonly ok: boolean;
  readonly passCount: number;
  readonly failCount: number;
  readonly durationMs: number;
};

export type GaCertificationReport = {
  readonly generatedAt: string;
  readonly overallScore: number;
  readonly recommendation: GaRecommendation;
  readonly findings: readonly Finding[];
  readonly phaseResults: readonly PhaseResult[];
  readonly blockers: readonly Finding[];
  readonly auth: readonly AuthCheck[];
  readonly roles: readonly RoleCheck[];
  readonly security: readonly SecurityCheck[];
  readonly jag: readonly JagSurfaceCheck[];
  readonly system: readonly SystemCheck[];
  readonly workflowCount: number;
  readonly advisoryNotice: string;
};

export type WorkflowDomain = "academyos" | "jag" | "platform";

export type ValidationDimension =
  | "happy_path"
  | "permission_failure"
  | "missing_data"
  | "deep_links"
  | "empty_states"
  | "a11y"
  | "mobile";

export type WorkflowInventoryItem = {
  readonly id: string;
  readonly name: string;
  readonly domain: WorkflowDomain;
  readonly primaryRoutes: readonly string[];
  readonly keyModules: readonly string[];
  readonly validationDimensions: readonly ValidationDimension[];
};
