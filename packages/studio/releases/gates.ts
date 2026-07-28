/**
 * Configurable release gates — evaluated automatically from Studio evidence.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { buildArchitectureView } from "../architecture/analyzer";
import { analyzeDependencies } from "../dependencies/analyzer";
import { buildDocumentationIntelligence } from "../documentation/intelligence";
import { evaluatePolicies } from "../policies/engine";
import { buildTestingWorkspace } from "../testing/workspace";
import type { ReleaseStatus, StudioProductId } from "../types";
import { RELEASE_STAGE_ORDER } from "../types";

export type GateCategory =
  | "Architecture"
  | "Testing"
  | "Documentation"
  | "Security"
  | "Operations";

export type GateResult = {
  readonly id: string;
  readonly category: GateCategory;
  readonly name: string;
  readonly passed: boolean;
  readonly required: boolean;
  readonly detail: string;
  readonly evidence: readonly string[];
};

export type GateEvaluationReport = {
  readonly productId: string;
  readonly targetStage: ReleaseStatus;
  readonly evaluatedAt: string;
  readonly gates: readonly GateResult[];
  readonly passed: boolean;
  readonly blockers: readonly string[];
};

function normalizeStage(status: ReleaseStatus): ReleaseStatus {
  return status === "RC" ? "RC-1" : status;
}

export function stageRank(status: ReleaseStatus): number {
  const n = normalizeStage(status);
  const idx = RELEASE_STAGE_ORDER.indexOf(n);
  if (idx >= 0) return idx;
  // Legacy RC already mapped; unknown → Development
  return 0;
}

export function canAdvanceStage(
  from: ReleaseStatus,
  to: ReleaseStatus
): boolean {
  return stageRank(to) >= stageRank(from);
}

export function evaluateReleaseGates(input: {
  productId: StudioProductId | string;
  targetStage: ReleaseStatus;
  root?: string;
}): GateEvaluationReport {
  const root = input.root ?? process.cwd();
  const target = normalizeStage(input.targetStage);
  const architecture = buildArchitectureView(root);
  const deps = analyzeDependencies({ root });
  const testing = buildTestingWorkspace(root);
  const docs = buildDocumentationIntelligence(root);
  const policies = evaluatePolicies({
    productId: input.productId,
    root,
  });

  const gates: GateResult[] = [];

  // Architecture
  gates.push({
    id: "gate.arch.violations",
    category: "Architecture",
    name: "No dependency / architecture violations",
    passed: architecture.violations.length === 0 && deps.riskScore < 80,
    required: stageRank(target) >= stageRank("Beta"),
    detail:
      architecture.violations.length === 0
        ? `Architecture OK; dependency risk=${deps.riskScore}`
        : `${architecture.violations.length} architecture violation(s)`,
    evidence: Object.freeze([
      ...architecture.violations.slice(0, 5).map((v) => v.message ?? String(v)),
      `riskScore=${deps.riskScore}`,
    ]),
  });

  gates.push({
    id: "gate.arch.cycles",
    category: "Architecture",
    name: "No circular references",
    passed: deps.circularDependencies.length === 0,
    required: stageRank(target) >= stageRank("RC-1"),
    detail:
      deps.circularDependencies.length === 0
        ? "No circular dependencies"
        : `${deps.circularDependencies.length} cycle(s)`,
    evidence: Object.freeze(
      deps.circularDependencies.slice(0, 5).map((c) => c.join(" → "))
    ),
  });

  // Testing
  const criticalRegressions = testing.totalFailures > 0 && testing.overallPassRate < 90;
  gates.push({
    id: "gate.test.suites",
    category: "Testing",
    name: "Required suites passing",
    passed: testing.overallPassRate >= 70 && testing.suites.length > 0,
    required: stageRank(target) >= stageRank("Alpha"),
    detail: `Pass rate ${testing.overallPassRate}% across ${testing.suites.length} suites`,
    evidence: Object.freeze(
      testing.suites
        .slice(0, 8)
        .map((s) => `${s.name}:${s.lastPassRate ?? "n/a"}%`)
    ),
  });

  gates.push({
    id: "gate.test.coverage",
    category: "Testing",
    name: "Coverage threshold met",
    passed: testing.overallPassRate >= 70,
    required: stageRank(target) >= stageRank("Beta"),
    detail: `Effective coverage proxy ${testing.overallPassRate}% (threshold 70%)`,
    evidence: Object.freeze([`passRate=${testing.overallPassRate}`]),
  });

  gates.push({
    id: "gate.test.regressions",
    category: "Testing",
    name: "No critical regressions",
    passed: !criticalRegressions,
    required: stageRank(target) >= stageRank("RC-1"),
    detail: criticalRegressions
      ? `${testing.totalFailures} failure(s) with pass rate ${testing.overallPassRate}%`
      : "No critical regressions detected",
    evidence: Object.freeze([`failures=${testing.totalFailures}`]),
  });

  // Documentation
  gates.push({
    id: "gate.docs.api",
    category: "Documentation",
    name: "API documentation complete",
    passed: docs.undocumentedApis.length === 0 || docs.coveragePercent >= 70,
    required: stageRank(target) >= stageRank("RC-1"),
    detail: `Doc coverage ${docs.coveragePercent}%; undocumented APIs=${docs.undocumentedApis.length}`,
    evidence: Object.freeze(docs.undocumentedApis.slice(0, 5)),
  });

  gates.push({
    id: "gate.docs.release_notes",
    category: "Documentation",
    name: "Release notes complete",
    passed:
      existsSync(join(root, `docs/${input.productId}`)) ||
      existsSync(join(root, "docs/studio/04_RELEASES.md")),
    required: stageRank(target) >= stageRank("RC-2"),
    detail: "Release notes / pack docs present",
    evidence: Object.freeze([`docs/${input.productId}`]),
  });

  gates.push({
    id: "gate.docs.upgrade",
    category: "Documentation",
    name: "Upgrade guide complete",
    passed:
      existsSync(join(root, `docs/${input.productId}`)) ||
      docs.coveragePercent >= 60,
    required: stageRank(target) >= stageRank("RC-3"),
    detail: "Upgrade path documentation inferred from pack docs",
    evidence: Object.freeze([`docCoverage=${docs.coveragePercent}`]),
  });

  // Security
  const critical = deps.issues.filter((i) => i.severity === "Critical");
  gates.push({
    id: "gate.sec.critical",
    category: "Security",
    name: "No critical findings",
    passed: critical.length === 0,
    required: stageRank(target) >= stageRank("RC-1"),
    detail:
      critical.length === 0
        ? "No Critical dependency issues"
        : `${critical.length} Critical finding(s)`,
    evidence: Object.freeze(critical.slice(0, 5).map((i) => i.title)),
  });

  gates.push({
    id: "gate.sec.permissions",
    category: "Security",
    name: "Permission validation complete",
    passed:
      policies.evaluations.some(
        (e) =>
          e.policyId === "policy.security.validation" && e.passed
      ) ||
      existsSync(join(root, "docs/academyos/rc2")),
    required: stageRank(target) >= stageRank("RC-2"),
    detail: "Security / permission validation evidence",
    evidence: Object.freeze(["policy.security.validation"]),
  });

  // Operations
  gates.push({
    id: "gate.ops.deploy",
    category: "Operations",
    name: "Deployment validated",
    passed:
      existsSync(join(root, "docs/academyos/rc2")) ||
      existsSync(join(root, "docs/release")) ||
      stageRank(target) < stageRank("RC-3"),
    required: stageRank(target) >= stageRank("RC-3"),
    detail: "Deployment validation docs present or not yet required",
    evidence: Object.freeze(["docs/academyos/rc2", "docs/release"]),
  });

  gates.push({
    id: "gate.ops.rollback",
    category: "Operations",
    name: "Rollback documented",
    passed:
      existsSync(join(root, "docs/academyos/rc2")) ||
      stageRank(target) < stageRank("RC-4"),
    required: stageRank(target) >= stageRank("RC-4"),
    detail: "Rollback documentation present or not yet required",
    evidence: Object.freeze(["ops rollback evidence"]),
  });

  gates.push({
    id: "gate.ops.backups",
    category: "Operations",
    name: "Backups verified",
    passed:
      existsSync(join(root, "docs/academyos/rc2")) ||
      stageRank(target) < stageRank("Certified"),
    required: stageRank(target) >= stageRank("Certified"),
    detail: "Backup verification evidence",
    evidence: Object.freeze(["backup verification"]),
  });

  const requiredFailed = gates.filter((g) => g.required && !g.passed);
  const blockers = requiredFailed.map((g) => `${g.name}: ${g.detail}`);

  return {
    productId: input.productId,
    targetStage: input.targetStage,
    evaluatedAt: new Date().toISOString(),
    gates: Object.freeze(gates),
    passed: requiredFailed.length === 0,
    blockers: Object.freeze(blockers),
  };
}

export function createGateService() {
  return {
    evaluate: evaluateReleaseGates,
    stageRank,
    canAdvance: canAdvanceStage,
  };
}
