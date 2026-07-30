/**
 * Sprint 210 — GA certification package.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  GaCertificationService,
  clearCertificationObservationsForTests,
  listWorkflowInventory,
  runAuthValidation,
  WORKFLOW_INVENTORY,
} from "@/lib/jag-command-center/ga-certification";
import {
  clearCapabilityObservationsForTests,
  resetCapabilitiesForTests,
} from "@/lib/platform/capabilities";
import { clearReadinessObservationsForTests } from "@/lib/jag-command-center/production-readiness";

const REQUIRED_WORKFLOW_NAMES = [
  "Authentication",
  "Authorization",
  "Admissions",
  "Students (SIS)",
  "Families",
  "Employees",
  "HR",
  "Scheduling",
  "Attendance",
  "Communications",
  "Documents",
  "Finance",
  "Scholarships",
  "Calendar",
  "Executive dashboards",
  "Observability",
  "Production Readiness",
  "Explainability",
  "Memory",
  "Strategy",
  "Watchers",
  "Graph",
  "Release Management",
] as const;

describe("GA certification (Sprint 210)", () => {
  beforeEach(() => {
    clearCertificationObservationsForTests();
    clearReadinessObservationsForTests();
    clearCapabilityObservationsForTests();
    resetCapabilitiesForTests();
  });

  it("inventory has required workflow names", () => {
    const names = new Set(WORKFLOW_INVENTORY.map((w) => w.name));
    for (const required of REQUIRED_WORKFLOW_NAMES) {
      expect(names.has(required)).toBe(true);
    }
    expect(listWorkflowInventory().length).toBe(WORKFLOW_INVENTORY.length);
    expect(WORKFLOW_INVENTORY.length).toBeGreaterThanOrEqual(
      REQUIRED_WORKFLOW_NAMES.length
    );
  });

  it("auth checks are non-empty", () => {
    const checks = runAuthValidation();
    expect(checks.length).toBeGreaterThan(0);
    for (const check of checks) {
      expect(check.id).toBeTruthy();
      expect(check.label).toBeTruthy();
      expect(typeof check.ok).toBe("boolean");
      expect(check.detail.length).toBeGreaterThan(0);
    }
  });

  it("runFullCertification returns report with score and recommendation", async () => {
    const report = await GaCertificationService.runFullCertification();
    expect(report.generatedAt).toBeTruthy();
    expect(typeof report.overallScore).toBe("number");
    expect(report.overallScore).toBeGreaterThanOrEqual(0);
    expect(report.overallScore).toBeLessThanOrEqual(100);
    expect(["GO", "GO_WITH_CONDITIONS", "NO_GO"]).toContain(
      report.recommendation
    );
    // Residual persona/RLS/UI findings keep unconditional GO honest.
    expect(report.findings.length).toBeGreaterThan(0);
    expect(report.recommendation).toBe("GO_WITH_CONDITIONS");
    expect(Array.isArray(report.findings)).toBe(true);
    expect(Array.isArray(report.phaseResults)).toBe(true);
    expect(Array.isArray(report.blockers)).toBe(true);
    expect(report.auth.length).toBeGreaterThan(0);
    expect(report.workflowCount).toBe(WORKFLOW_INVENTORY.length);
    expect(report.advisoryNotice.toLowerCase()).toContain("certification");
  });

  it("does not throw", async () => {
    await expect(
      GaCertificationService.runFullCertification()
    ).resolves.toBeTruthy();
  });
});
