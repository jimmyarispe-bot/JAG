/**
 * AcademyOS Module Completion Standard (v2)
 */

export type ModuleId =
  | "students"
  | "families"
  | "admissions"
  | "communications"
  | "workflows"
  | "calendar"
  | "hr"
  | "billing"
  | "scholarships"
  | "scheduling"
  | "documents"
  | "founder"
  | "jag"
  | "settings";

/** Progressive readiness — replaces binary complete/partial. */
export type ModuleReadinessStatus =
  | "planned"
  | "building"
  | "feature-complete"
  | "crud-complete"
  | "workflow-complete"
  | "ei-complete"
  | "tested"
  | "production-ready"
  | "released";

export type GateId =
  | "crud"
  | "security"
  | "workflow"
  | "ei"
  | "audit"
  | "communications"
  | "docs"
  | "tests"
  | "accessibility"
  | "mobile"
  | "performance"
  | "extension"
  | "ux"
  | "production";

export type GateVerdict = "pass" | "warn" | "fail" | "na" | "pending";

export interface GateResult {
  gate: GateId;
  verdict: GateVerdict;
  score: number; // 0–100
  summary: string;
  issues: string[];
}

export interface ModuleReleaseDefinition {
  id: ModuleId;
  label: string;
  /** Declared readiness — validators may downgrade effective status */
  status: ModuleReadinessStatus;
  /** Primary entities owned by this module */
  entityKeys: string[];
  /** Required activity / EI event types */
  requiredEvents: string[];
  /** Feature doc relative to repo root */
  docsPath: string;
  /** Expected unit test glob fragments */
  testPaths: string[];
  /** Whether communications fan-out is expected */
  communicationsRelevant: boolean;
  /** Whether third-party extension points are required */
  extensionRelevant: boolean;
  notes?: string;
}

export interface ModuleReleaseSnapshot {
  definition: ModuleReleaseDefinition;
  /** Effective status after gate evaluation */
  effectiveStatus: ModuleReadinessStatus;
  gates: GateResult[];
  overallVerdict: GateVerdict;
  overallScore: number;
}

export interface ReleaseValidationReport {
  ok: boolean;
  generatedAt: string;
  modules: ModuleReleaseSnapshot[];
  blockingIssues: Array<{ moduleId: ModuleId; gate: GateId; message: string }>;
}

export const GATE_LABELS: Record<GateId, string> = {
  crud: "CRUD",
  security: "Security",
  workflow: "Workflow",
  ei: "Executive Intelligence",
  audit: "Audit",
  communications: "Communications",
  docs: "Documentation",
  tests: "Testing",
  accessibility: "Accessibility",
  mobile: "Mobile",
  performance: "Performance",
  extension: "Extension",
  ux: "UX Consistency",
  production: "Production",
};

export const READINESS_ORDER: ModuleReadinessStatus[] = [
  "planned",
  "building",
  "feature-complete",
  "crud-complete",
  "workflow-complete",
  "ei-complete",
  "tested",
  "production-ready",
  "released",
];
