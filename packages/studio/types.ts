/** JAG Studio Foundation™ — shared types. */

export const STUDIO_PRODUCT_IDS = [
  "academyos",
  "healthcareos",
  "governmentos",
  "manufacturingos",
] as const;
export type StudioProductId = (typeof STUDIO_PRODUCT_IDS)[number];

/** Legacy `"RC"` kept for compatibility; prefer RC-1…RC-4. */
export const RELEASE_STATUSES = [
  "Development",
  "Alpha",
  "Beta",
  "RC",
  "RC-1",
  "RC-2",
  "RC-3",
  "RC-4",
  "Certified",
  "Released",
] as const;
export type ReleaseStatus = (typeof RELEASE_STATUSES)[number];

export const RELEASE_STAGE_ORDER: readonly ReleaseStatus[] = Object.freeze([
  "Development",
  "Alpha",
  "Beta",
  "RC-1",
  "RC-2",
  "RC-3",
  "RC-4",
  "Certified",
  "Released",
]);

export const APPROVAL_ROLES = [
  "Engineering",
  "Architecture",
  "QA",
  "Executive",
  "Release",
] as const;
export type ApprovalRole = (typeof APPROVAL_ROLES)[number];

export const APPROVAL_DECISIONS = ["Pending", "Approved", "Rejected"] as const;
export type ApprovalDecision = (typeof APPROVAL_DECISIONS)[number];

export const PER_STATUSES = [
  "Open",
  "Accepted",
  "Promoted",
  "Implemented",
  "Declined",
  "Deferred",
] as const;
export type PerStatus = (typeof PER_STATUSES)[number];

export const ARCHITECTURE_LAYERS = [
  "Platform Foundation",
  "Industry Packs",
  "SDK",
  "Connectors",
  "Digital Twin",
  "Executive Intelligence",
  "Organizational Memory",
  "Studio",
] as const;
export type ArchitectureLayer = (typeof ARCHITECTURE_LAYERS)[number];

export type StudioProduct = {
  readonly id: StudioProductId;
  readonly name: string;
  readonly version: string;
  readonly completionPercent: number;
  readonly releaseStatus: ReleaseStatus;
  readonly dependencies: readonly string[];
  readonly certification: "None" | "Pending" | "Certified";
  readonly openPerIds: readonly string[];
  readonly description: string;
  readonly updatedAt: string;
};

export type StudioRelease = {
  readonly id: string;
  readonly productId: StudioProductId;
  readonly version: string;
  readonly status: ReleaseStatus;
  readonly releaseNotes: string;
  readonly migrationHistory: readonly string[];
  readonly upgradePath: readonly string[];
  readonly compatibilityMatrix: Readonly<Record<string, string>>;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly certifiedAt: string | null;
  readonly releasedAt: string | null;
};

export type StudioPer = {
  readonly id: string;
  readonly description: string;
  readonly originatingPack: string;
  readonly affectedServices: readonly string[];
  readonly status: PerStatus;
  readonly recommendation: string;
  readonly workaround: string;
  readonly implementationHistory: readonly {
    readonly at: string;
    readonly note: string;
    readonly actor: string;
  }[];
  readonly packsMentioning: readonly string[];
  readonly promoteToFoundation: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type RepositoryIndexKind =
  | "service"
  | "api"
  | "entity"
  | "event"
  | "permission"
  | "test"
  | "doc"
  | "dependency"
  | "connector"
  | "migration"
  | "sdk"
  | "package"
  | "other";

export type RepositoryIndexEntry = {
  readonly id: string;
  readonly kind: RepositoryIndexKind;
  readonly path: string;
  readonly name: string;
  readonly packageId: string | null;
  readonly layer: ArchitectureLayer | null;
  readonly metadata: Readonly<Record<string, string>>;
};

export type RepositoryScanResult = {
  readonly root: string;
  readonly scannedAt: string;
  readonly entries: readonly RepositoryIndexEntry[];
  readonly counts: Readonly<Record<RepositoryIndexKind, number>>;
  readonly rootsFound: readonly string[];
};

export type ArchitectureNode = {
  readonly id: string;
  readonly label: string;
  readonly layer: ArchitectureLayer;
  readonly packagePath: string | null;
  readonly healthy: boolean;
};

export type ArchitectureEdge = {
  readonly from: string;
  readonly to: string;
  readonly kind: "depends_on" | "consumes" | "extends";
};

export type ArchitectureViolation = {
  readonly id: string;
  readonly severity: "Info" | "Warning" | "Error";
  readonly rule: string;
  readonly message: string;
  readonly nodes: readonly string[];
};

export type ArchitectureView = {
  readonly nodes: readonly ArchitectureNode[];
  readonly edges: readonly ArchitectureEdge[];
  readonly violations: readonly ArchitectureViolation[];
  readonly circularDependencies: readonly string[][];
  readonly orphanedModules: readonly string[];
  readonly packageHealth: Readonly<
    Record<string, { healthy: boolean; issues: number }>
  >;
  readonly healthScore: number;
};

export type TestSuiteSummary = {
  readonly id: string;
  readonly name: string;
  readonly domain:
    | "Foundation"
    | "AcademyOS"
    | "SDK"
    | "Connectors"
    | "Studio"
    | "Other";
  readonly fileCount: number;
  readonly lastPassRate: number | null;
  readonly lastFailures: number;
  readonly lastRunAt: string | null;
};

export type TestRunRecord = {
  readonly id: string;
  readonly suiteId: string;
  readonly passed: number;
  readonly failed: number;
  readonly skipped: number;
  readonly coveragePercent: number | null;
  readonly ranAt: string;
  readonly actor: string;
};

export type TestingWorkspaceView = {
  readonly suites: readonly TestSuiteSummary[];
  readonly overallPassRate: number;
  readonly totalFailures: number;
  readonly coverageAverage: number | null;
  readonly trends: readonly { readonly at: string; readonly passRate: number }[];
  readonly executionHistory: readonly TestRunRecord[];
};

export type DocIndexEntry = {
  readonly id: string;
  readonly path: string;
  readonly title: string;
  readonly category:
    | "Architecture"
    | "SDK"
    | "Pack"
    | "API"
    | "PER"
    | "Release"
    | "Studio"
    | "Other";
  readonly updatedHint: string | null;
};

export type DocumentationIntelligence = {
  readonly docs: readonly DocIndexEntry[];
  readonly missingDocumentation: readonly string[];
  readonly outdatedDocumentation: readonly string[];
  readonly undocumentedApis: readonly string[];
  readonly coveragePercent: number;
};

export type StudioInsightsSummary = {
  readonly architectureHealth: number;
  readonly productCompletion: number;
  readonly releaseReadiness: number;
  readonly testHealth: number;
  readonly technicalDebt: number;
  readonly documentationCoverage: number;
  readonly perGrowth: number;
  readonly sdkAdoption: number;
  readonly connectorHealth: number;
  readonly openPers: number;
  readonly recommendedWork: readonly string[];
  /** JS-002 — Architecture graph / dependency intelligence */
  readonly dependencyRisk: number;
  readonly apiReuse: number;
  readonly connectorReuse: number;
  readonly technicalDebtTrend: number;
  readonly recommendationCountBySeverity: Readonly<
    Record<"Info" | "Warning" | "Error" | "Critical", number>
  >;
  readonly testCoverageByPackage: Readonly<
    Record<string, { tests: number; services: number; coverageRatio: number }>
  >;
  /** JS-003 — Release intelligence & governance */
  readonly productQualityScore: number;
  readonly policyCompliancePercent: number;
  readonly blockedReleaseCount: number;
  readonly awaitingApprovalCount: number;
};

export type StudioDashboard = {
  readonly platformHealth: number;
  readonly products: readonly StudioProduct[];
  readonly releaseStatus: Readonly<Record<string, ReleaseStatus>>;
  readonly architecture: ArchitectureView;
  readonly openPers: readonly StudioPer[];
  readonly testing: TestingWorkspaceView;
  readonly recommendedWork: readonly string[];
  readonly insights: StudioInsightsSummary;
  readonly generatedAt: string;
};
