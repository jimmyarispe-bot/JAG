/**
 * Sprint 210 — emit GA certification JSON for docs/sign-off.
 */
import { writeFileSync } from "node:fs";
import { GaCertificationService } from "../src/lib/jag-command-center/ga-certification/index";

const report = await GaCertificationService.runFullCertification();

const summary = {
  generatedAt: report.generatedAt,
  overallScore: report.overallScore,
  recommendation: report.recommendation,
  workflowCount: report.workflowCount,
  blockers: report.blockers.map((b) => ({
    id: b.id,
    title: b.title,
    detail: b.detail,
  })),
  findings: report.findings.map((f) => ({
    severity: f.severity,
    id: f.id,
    title: f.title,
    detail: f.detail,
    phase: f.phase,
    blocker: f.blocker,
  })),
  phases: report.phaseResults,
  authFail: report.auth.filter((c) => !c.ok).map((c) => c.id),
  roleFail: report.roles.filter((c) => !c.ok).map((c) => c.id),
  securityFail: report.security.filter((c) => !c.ok).map((c) => c.id),
  jagFail: report.jag.filter((c) => !c.ok).map((c) => c.id),
  systemFail: report.system.filter((c) => !c.ok).map((c) => c.id),
};

const out = "ga-certification-report.json";
writeFileSync(out, JSON.stringify(summary, null, 2), "utf8");
console.log(JSON.stringify(summary, null, 2));
console.log(`\nWrote ${out}`);
