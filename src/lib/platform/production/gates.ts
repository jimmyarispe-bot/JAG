/**
 * RC-10 readiness gates — evidence from repo artifacts / prior harnesses.
 * Does not invent product features; marks domains pass/conditional/pending.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import type { GaGateResult, GaReadinessDomain } from "@/lib/platform/production/types";

type GateDef = {
  id: string;
  domain: GaReadinessDomain;
  title: string;
  blocking: boolean;
  evidencePaths: string[];
  /** Optional npm script name documented as evidence. */
  scripts?: string[];
  /** If true, presence of any evidencePath → pass; else conditional. */
  requireAllEvidence?: boolean;
};

const GATE_DEFS: GateDef[] = [
  {
    id: "perf",
    domain: "performance",
    title: "Performance regression harness",
    blocking: true,
    evidencePaths: ["scripts/perf-regression.mts"],
    scripts: ["perf:regression"],
  },
  {
    id: "load",
    domain: "load_testing",
    title: "Load / resilience suite",
    blocking: true,
    evidencePaths: ["scripts/load/suite.mts"],
    scripts: ["load:suite"],
  },
  {
    id: "pentest",
    domain: "pen_testing",
    title: "Penetration test plan",
    blocking: false,
    evidencePaths: ["docs/security/phase-b/14_PENETRATION_TEST_PLAN.md"],
    scripts: [],
  },
  {
    id: "sec-review",
    domain: "security_review",
    title: "Security review harnesses",
    blocking: true,
    evidencePaths: [
      "scripts/security/authz-inventory.mts",
      "docs/security/phase-b1/07_PRODUCTION_SECURITY_CHECKLIST.md",
    ],
    scripts: ["security:audit-deps", "security:authz-inventory", "security:recovery"],
    requireAllEvidence: true,
  },
  {
    id: "dr",
    domain: "disaster_recovery",
    title: "Disaster recovery plan + restore rehearsal",
    blocking: true,
    evidencePaths: [
      "docs/operations/phase-f/10_DISASTER_RECOVERY_PLAN.md",
      "scripts/rc5/restore-rehearsal.mts",
    ],
    scripts: ["rc5:restore"],
    requireAllEvidence: true,
  },
  {
    id: "backup",
    domain: "backup_validation",
    title: "Backup / restore validation docs",
    blocking: true,
    evidencePaths: [
      "docs/operations/rc3/04_BACKUP_RESTORE_VALIDATION.md",
      "docs/operations/phase-f/runbooks/13_DATABASE_BACKUP_RESTORE.md",
    ],
    requireAllEvidence: true,
  },
  {
    id: "monitoring",
    domain: "monitoring",
    title: "Health / ready monitoring endpoints",
    blocking: true,
    evidencePaths: [
      "src/app/api/health/route.ts",
      "src/app/api/ready/route.ts",
      "src/lib/observability",
    ],
    requireAllEvidence: true,
  },
  {
    id: "logging",
    domain: "logging",
    title: "Structured logging surface",
    blocking: true,
    evidencePaths: ["src/lib/observability"],
  },
  {
    id: "otel",
    domain: "observability",
    title: "Observability metrics / RUM / alerts",
    blocking: true,
    evidencePaths: [
      "src/app/api/observability/metrics/route.ts",
      "src/app/api/observability/alerts/route.ts",
      "src/app/api/observability/rum/route.ts",
    ],
    requireAllEvidence: true,
  },
  {
    id: "a11y",
    domain: "accessibility",
    title: "Accessibility (axe) suite",
    blocking: true,
    evidencePaths: ["tests/a11y/critical-routes.spec.ts"],
    scripts: ["test:a11y"],
  },
  {
    id: "docs",
    domain: "documentation",
    title: "Operations + launch documentation",
    blocking: false,
    evidencePaths: ["docs/launch/README.md", "docs/operations/rc5"],
    requireAllEvidence: true,
  },
  {
    id: "cicd",
    domain: "cicd",
    title: "CI/CD workflow",
    blocking: true,
    evidencePaths: [".github/workflows/ci.yml"],
  },
  {
    id: "e2e",
    domain: "end_to_end_tests",
    title: "Playwright smoke / acceptance / a11y",
    blocking: true,
    evidencePaths: [
      "playwright.config.ts",
      "tests/smoke/app.spec.ts",
      "tests/acceptance/role-gates.spec.ts",
    ],
    scripts: ["test:e2e"],
    requireAllEvidence: true,
  },
  {
    id: "deploy",
    domain: "deployment_verification",
    title: "Deploy / rollback rehearsal harnesses",
    blocking: true,
    evidencePaths: [
      "scripts/rc5/deploy-rehearsal.mts",
      "scripts/rc5/rollback-rehearsal.mts",
    ],
    scripts: ["rc5:deploy", "rc5:rollback"],
    requireAllEvidence: true,
  },
  {
    id: "release-docs",
    domain: "release_documentation",
    title: "GA / go-live release documentation",
    blocking: false,
    evidencePaths: [
      "docs/launch/phase-h/00_EXECUTIVE_GA_DECISION.md",
      "docs/launch/phase-h/05_GO_LIVE_CHECKLIST.md",
      "docs/operations/rc10/README.md",
    ],
  },
  {
    id: "signoff",
    domain: "ga_sign_off",
    title: "GA sign-off framework",
    blocking: true,
    evidencePaths: ["src/lib/platform/production/sign-off.ts"],
  },
];

function pathExists(root: string, rel: string): boolean {
  return existsSync(join(root, rel));
}

export function evaluateReadinessGates(root = process.cwd()): GaGateResult[] {
  return GATE_DEFS.map((def) => {
    const found = def.evidencePaths.filter((p) => pathExists(root, p));
    const missing = def.evidencePaths.filter((p) => !pathExists(root, p));
    const allOk = missing.length === 0;
    const anyOk = found.length > 0;
    const requireAll = def.requireAllEvidence ?? false;

    let status: GaGateResult["status"];
    let detail: string;

    if (requireAll ? allOk : anyOk) {
      status = allOk ? "pass" : "conditional";
      detail = allOk
        ? `Evidence present (${found.length}/${def.evidencePaths.length})`
        : `Partial evidence (${found.length}/${def.evidencePaths.length}); missing: ${missing.join(", ")}`;
    } else if (def.domain === "pen_testing" && anyOk) {
      status = "conditional";
      detail = "Pen-test plan present — external engagement evidence still required for full close";
    } else if (def.domain === "release_documentation" && found.length > 0) {
      status = "conditional";
      detail = `Partial release docs; missing: ${missing.join(", ")}`;
    } else {
      status = "fail";
      detail = `Missing evidence: ${missing.join(", ") || "none"}`;
    }

    // Pen-test: plan-only is conditional, never hard-fail the suite on missing engagement report
    if (def.domain === "pen_testing" && anyOk) {
      status = "conditional";
      detail =
        "Plan documented; schedule external pen-test engagement before customer production onboarding";
    }

    return {
      id: def.id,
      domain: def.domain,
      title: def.title,
      status,
      evidence: found,
      detail: def.scripts?.length
        ? `${detail} · scripts: ${def.scripts.join(", ")}`
        : detail,
      blocking: def.blocking,
    };
  });
}
