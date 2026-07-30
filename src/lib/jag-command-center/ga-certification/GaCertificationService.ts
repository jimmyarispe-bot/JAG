/**
 * GaCertificationService — Sprint 210.
 * Application-layer GA certification. Validation + defect detection only.
 */

import { runAuthValidation } from "./auth-validation";
import { runJagValidation } from "./jag-validation";
import { recordCertificationObservation } from "./observability";
import { runRoleValidation } from "./role-validation";
import { runSecurityValidation } from "./security-validation";
import { runSystemValidation } from "./system-validation";
import type {
  AuthCheck,
  CertificationPhase,
  Finding,
  GaCertificationReport,
  GaRecommendation,
  JagSurfaceCheck,
  PhaseResult,
  RoleCheck,
  SecurityCheck,
  Severity,
  SystemCheck,
} from "./types";
import { listWorkflowInventory } from "./workflow-inventory";

const ADVISORY =
  "GA certification — validation and defect detection only. No new product features.";

const SCORE_DELTAS: Record<Severity, number> = {
  critical: 15,
  high: 8,
  medium: 3,
  low: 1,
};

function countOk(items: readonly { ok: boolean }[]): {
  passCount: number;
  failCount: number;
} {
  let passCount = 0;
  let failCount = 0;
  for (const item of items) {
    if (item.ok) passCount += 1;
    else failCount += 1;
  }
  return { passCount, failCount };
}

function severityForAuth(check: AuthCheck): Severity {
  if (
    check.id.includes("login") ||
    check.id.includes("session") ||
    check.id.includes("callback")
  ) {
    return "critical";
  }
  return "high";
}

function severityForRole(check: RoleCheck): Severity {
  if (check.id.startsWith("role.platform.")) {
    if (check.id.endsWith(".EMPLOYEE")) return "medium";
    return "high";
  }
  if (check.id.startsWith("role.middleware.prefix.")) return "critical";
  if (check.id === "role.middleware.exists") return "critical";
  if (check.id === "role.landing-resolver") return "high";
  return "low";
}

function severityForSecurity(check: SecurityCheck): Severity {
  if (
    check.id.includes("middleware") ||
    check.id.includes("api-guard") ||
    check.id.includes("page-guard") ||
    check.id.includes("requireJagApiAdmin")
  ) {
    return "critical";
  }
  if (check.id.includes("health")) return "high";
  return "medium";
}

function severityForJag(check: JagSurfaceCheck): Severity {
  if (check.id === "jag.production-readiness") return "high";
  if (
    check.id.includes("explanation") ||
    check.id.includes("watcher")
  ) {
    return "high";
  }
  return "medium";
}

function severityForSystem(check: SystemCheck): Severity {
  if (check.id === "system.health" || check.id === "system.ready") {
    return "critical";
  }
  if (check.id === "system.env-schema") return "high";
  if (check.id === "system.not-found") return "medium";
  if (check.id === "system.error" || check.id === "system.global-error") {
    return "high";
  }
  if (check.id === "system.jag-error") return "medium";
  return "medium";
}

function findingFromFailure(
  phase: CertificationPhase,
  check: { id: string; label: string; detail: string },
  severity: Severity
): Finding {
  const blocker = severity === "critical";
  return {
    id: `finding.${check.id}`,
    severity,
    phase,
    title: check.label,
    detail: check.detail,
    blocker,
  };
}

function scoreFromFindings(findings: readonly Finding[]): number {
  let score = 100;
  for (const finding of findings) {
    score -= SCORE_DELTAS[finding.severity];
  }
  return Math.max(0, score);
}

function recommendationFrom(
  score: number,
  findings: readonly Finding[]
): GaRecommendation {
  if (findings.some((f) => f.severity === "critical")) return "NO_GO";
  if (score < 85 || findings.some((f) => f.severity === "high")) {
    return "GO_WITH_CONDITIONS";
  }
  return "GO";
}

function phaseResult(
  phase: CertificationPhase,
  items: readonly { ok: boolean }[],
  durationMs: number
): PhaseResult {
  const { passCount, failCount } = countOk(items);
  return {
    phase,
    ok: failCount === 0,
    passCount,
    failCount,
    durationMs,
  };
}

export const GaCertificationService = {
  async runFullCertification(): Promise<GaCertificationReport> {
    const started = Date.now();
    const findings: Finding[] = [];
    const phaseResults: PhaseResult[] = [];

    const inventory = listWorkflowInventory();
    phaseResults.push({
      phase: "workflow_inventory",
      ok: inventory.length > 0,
      passCount: inventory.length,
      failCount: inventory.length === 0 ? 1 : 0,
      durationMs: 0,
    });
    if (inventory.length === 0) {
      findings.push({
        id: "finding.workflow_inventory.empty",
        severity: "critical",
        phase: "workflow_inventory",
        title: "Workflow inventory empty",
        detail: "WORKFLOW_INVENTORY has no entries.",
        blocker: true,
      });
    }

    const authStarted = Date.now();
    const auth = runAuthValidation();
    phaseResults.push(
      phaseResult("auth", auth, Date.now() - authStarted)
    );
    for (const check of auth) {
      if (!check.ok) {
        findings.push(
          findingFromFailure("auth", check, severityForAuth(check))
        );
      }
    }

    const roleStarted = Date.now();
    const roles = runRoleValidation();
    phaseResults.push(
      phaseResult("roles", roles, Date.now() - roleStarted)
    );
    for (const check of roles) {
      if (!check.ok) {
        findings.push(
          findingFromFailure("roles", check, severityForRole(check))
        );
      }
    }

    const securityStarted = Date.now();
    const security = await runSecurityValidation();
    phaseResults.push(
      phaseResult("security", security, Date.now() - securityStarted)
    );
    for (const check of security) {
      if (!check.ok) {
        findings.push(
          findingFromFailure("security", check, severityForSecurity(check))
        );
      }
    }

    const jagStarted = Date.now();
    const jag = runJagValidation();
    phaseResults.push(phaseResult("jag", jag, Date.now() - jagStarted));
    for (const check of jag) {
      if (!check.ok) {
        findings.push(
          findingFromFailure("jag", check, severityForJag(check))
        );
      }
    }

    const systemStarted = Date.now();
    const system = runSystemValidation();
    phaseResults.push(
      phaseResult("system", system, Date.now() - systemStarted)
    );
    for (const check of system) {
      if (!check.ok) {
        findings.push(
          findingFromFailure("system", check, severityForSystem(check))
        );
      }
    }

    // Residual GA risks — structural suite cannot replace live persona / RLS E2E.
    findings.push(
      {
        id: "finding.residual.authenticated-persona-e2e",
        severity: "high",
        phase: "roles",
        title: "Authenticated persona E2E not executed by this suite",
        detail:
          "Role-gate acceptance covers unauthenticated redirects only. Full Founder / ED / School Leader / Teacher / Parent / Student / Employee / Org Admin journeys require staged personas (RC4_E2E_COOKIE) before unconditional GA.",
        blocker: false,
      },
      {
        id: "finding.residual.rls-penetration",
        severity: "medium",
        phase: "security",
        title: "Live Supabase RLS penetration not in structural suite",
        detail:
          "Security validation confirms guard modules and middleware wiring. Tenant isolation should be re-confirmed with live RLS tests in staging before GA cutover.",
        blocker: false,
      },
      {
        id: "finding.residual.ui-visual-signoff",
        severity: "medium",
        phase: "system",
        title: "Visual UI polish sign-off pending",
        detail:
          "Structural empty/error boundaries are present. Viewport clipping, branding, and keyboard flows on authenticated dashboards need operator visual sign-off.",
        blocker: false,
      }
    );

    const overallScore = scoreFromFindings(findings);
    const recommendation = recommendationFrom(overallScore, findings);
    const blockers = findings.filter((f) => f.blocker);
    const durationMs = Date.now() - started;

    recordCertificationObservation({
      kind: "full_certification",
      durationMs,
      ok: recommendation === "GO",
      overallScore,
      recommendation,
      findingCount: findings.length,
      blockerCount: blockers.length,
      detail: `GA certification — score ${overallScore}, ${recommendation}, ${findings.length} finding(s), ${blockers.length} blocker(s).`,
    });

    return {
      generatedAt: new Date().toISOString(),
      overallScore,
      recommendation,
      findings,
      phaseResults,
      blockers,
      auth,
      roles,
      security,
      jag,
      system,
      workflowCount: inventory.length,
      advisoryNotice: ADVISORY,
    };
  },
} as const;
