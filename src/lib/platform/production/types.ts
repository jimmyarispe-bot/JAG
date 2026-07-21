/**
 * RC-10 — Production GA readiness types.
 * No product features — verification, gates, and sign-off only.
 */

export const PRODUCTION_GA_VERSION = "1.0.0";

/** Product release candidates that must be present for GA. */
export const GA_PRODUCT_RC_PACKAGES = [
  "rc4_knowledge_graph",
  "rc5_executive_copilot",
  "rc6_executive_command_center",
  "rc7_workflows",
  "rc8_marketplace",
  "rc9_enterprise",
] as const;

export type GaProductRcPackage = (typeof GA_PRODUCT_RC_PACKAGES)[number];

/** RC-10 readiness domains (no new features). */
export const GA_READINESS_DOMAINS = [
  "performance",
  "load_testing",
  "pen_testing",
  "security_review",
  "disaster_recovery",
  "backup_validation",
  "monitoring",
  "logging",
  "observability",
  "accessibility",
  "documentation",
  "cicd",
  "end_to_end_tests",
  "deployment_verification",
  "release_documentation",
  "ga_sign_off",
] as const;

export type GaReadinessDomain = (typeof GA_READINESS_DOMAINS)[number];

export type GateStatus =
  | "pass"
  | "fail"
  | "conditional"
  | "pending"
  | "waived"
  | "not_executed";

export type GaGateResult = {
  id: string;
  domain: GaReadinessDomain;
  title: string;
  status: GateStatus;
  evidence: string[];
  detail: string;
  blocking: boolean;
};

export type GaPackageMatrixRow = {
  id: GaProductRcPackage;
  packagePath: string;
  testPath: string;
  exportSmoke: string[];
  present: boolean;
  testPresent: boolean;
  importOk: boolean;
  detail: string;
};

export type GaCharacteristicsCheck = {
  id: string;
  statement: string;
  satisfied: boolean;
  evidence: string[];
};

export type GaSignOffDecision = "go" | "no_go" | "conditional_go";

export type GaSignOffRecord = {
  version: string;
  generatedAt: string;
  decision: GaSignOffDecision;
  blockingFailures: string[];
  conditionalItems: string[];
  packageMatrix: GaPackageMatrixRow[];
  gates: GaGateResult[];
  characteristics: GaCharacteristicsCheck[];
  summary: string;
  governance: {
    noNewFeatures: true;
    readinessOnly: true;
  };
};

export type ProductionReadinessReport = {
  version: string;
  generatedAt: string;
  signOff: GaSignOffRecord;
  contributingDomains: string[];
};
