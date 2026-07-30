/**
 * ProductionReadinessService — Sprint 209.
 * Application-layer GA validation. No Core / Runtime changes.
 */

import { validateRegisteredCapabilities } from "./capability-validation";
import { recordReadinessObservation } from "./observability";
import type { ValidationCheck, ValidationReport } from "./types";
import { runWorkflowMatrix } from "./workflow-matrix";

const ADVISORY =
  "Production readiness — application-layer validation of the executive workflow and Capability SDK. Not a new intelligence capability.";

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

export const ProductionReadinessService = {
  runWorkflowValidation(): ValidationReport["workflow"] & {
    readonly checks: readonly ValidationCheck[];
    readonly durationMs: number;
  } {
    const started = Date.now();
    const links = runWorkflowMatrix();
    const { passCount, failCount } = countOk(links);
    const checks: ValidationCheck[] = links.map((link) => ({
      id: `workflow:${link.id}`,
      label: `${link.from} → ${link.to}`,
      category: "workflow",
      ok: link.ok,
      detail: link.detail,
    }));
    const durationMs = Date.now() - started;
    recordReadinessObservation({
      kind: "workflow_validation",
      durationMs,
      ok: failCount === 0,
      passCount,
      failCount,
      detail: `Workflow matrix — ${passCount} pass, ${failCount} fail across ${links.length} link(s).`,
    });
    return { links, passCount, failCount, checks, durationMs };
  },

  runCapabilityValidation(): ValidationReport["capabilities"] & {
    readonly checks: readonly ValidationCheck[];
    readonly durationMs: number;
  } {
    const started = Date.now();
    const reports = validateRegisteredCapabilities();
    const { passCount, failCount } = countOk(reports);
    const checks: ValidationCheck[] = reports.map((r) => ({
      id: `capability:${r.id}`,
      label: r.name,
      category: "capability",
      ok: r.ok,
      detail: r.detail,
    }));
    const durationMs = Date.now() - started;
    recordReadinessObservation({
      kind: "capability_validation",
      durationMs,
      ok: failCount === 0,
      passCount,
      failCount,
      detail: `Capability validation — ${passCount} pass, ${failCount} fail across ${reports.length} capability(ies).`,
    });
    return { reports, passCount, failCount, checks, durationMs };
  },

  runFullValidation(): ValidationReport {
    const started = Date.now();
    const workflow = this.runWorkflowValidation();
    const capabilities = this.runCapabilityValidation();
    const checks = [...workflow.checks, ...capabilities.checks];
    const passCount = workflow.passCount + capabilities.passCount;
    const failCount = workflow.failCount + capabilities.failCount;
    const durationMs = Date.now() - started;

    recordReadinessObservation({
      kind: "full_validation",
      durationMs,
      ok: failCount === 0,
      passCount,
      failCount,
      detail: `Full readiness — ${passCount} pass, ${failCount} fail (${workflow.links.length} workflow · ${capabilities.reports.length} capabilities).`,
    });

    return {
      generatedAt: new Date().toISOString(),
      ok: failCount === 0,
      passCount,
      failCount,
      checks,
      workflow: {
        links: workflow.links,
        passCount: workflow.passCount,
        failCount: workflow.failCount,
      },
      capabilities: {
        reports: capabilities.reports,
        passCount: capabilities.passCount,
        failCount: capabilities.failCount,
      },
      advisoryNotice: ADVISORY,
    };
  },
} as const;
