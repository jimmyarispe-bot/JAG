/**
 * Sprint 209 — Production readiness validation.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  ProductionReadinessService,
  WORKFLOW_MATRIX,
  WORKFLOW_STAGES,
  clearReadinessObservationsForTests,
  loadReadinessWorkspace,
  validateRegisteredCapabilities,
} from "@/lib/jag-command-center/production-readiness";
import {
  clearCapabilityObservationsForTests,
  resetCapabilitiesForTests,
} from "@/lib/platform/capabilities";

const REQUIRED_STAGES = [
  "Evidence",
  "Knowledge",
  "Policies",
  "Forecasts",
  "Scenarios",
  "Conversation",
  "Decision",
  "Execution",
  "Outcome",
  "Memory",
  "Strategy",
  "Watchers",
  "Explainability",
] as const;

describe("Production readiness (Sprint 209)", () => {
  beforeEach(() => {
    clearReadinessObservationsForTests();
    clearCapabilityObservationsForTests();
    resetCapabilitiesForTests();
  });

  it("workflow matrix has all required consecutive links", () => {
    expect(WORKFLOW_STAGES).toEqual([...REQUIRED_STAGES]);
    expect(WORKFLOW_MATRIX).toHaveLength(REQUIRED_STAGES.length - 1);

    for (let i = 0; i < WORKFLOW_MATRIX.length; i += 1) {
      const link = WORKFLOW_MATRIX[i]!;
      expect(link.from).toBe(REQUIRED_STAGES[i]);
      expect(link.to).toBe(REQUIRED_STAGES[i + 1]);
      expect(link.id).toBeTruthy();
      expect(link.hrefs.length).toBeGreaterThan(0);
      expect(typeof link.validate).toBe("function");
      const result = link.validate();
      expect(typeof result.ok).toBe("boolean");
      expect(result.detail.length).toBeGreaterThan(0);
    }
  });

  it("capability validation returns reports for registered capabilities", () => {
    const reports = validateRegisteredCapabilities();
    expect(reports.length).toBeGreaterThanOrEqual(9);
    for (const report of reports) {
      expect(report.id).toBeTruthy();
      expect(report.name).toBeTruthy();
      expect(report.version).toBeTruthy();
      expect(Array.isArray(report.dependencies)).toBe(true);
      expect(Array.isArray(report.providers)).toBe(true);
      expect(Array.isArray(report.routes)).toBe(true);
      expect(Array.isArray(report.permissions.required)).toBe(true);
      expect(typeof report.healthy).toBe("boolean");
      expect(typeof report.ok).toBe("boolean");
    }
  });

  it("full validation runs without throwing", () => {
    expect(() => ProductionReadinessService.runFullValidation()).not.toThrow();
    const report = ProductionReadinessService.runFullValidation();
    expect(report.generatedAt).toBeTruthy();
    expect(report.checks.length).toBe(
      report.workflow.links.length + report.capabilities.reports.length
    );
    expect(report.passCount + report.failCount).toBe(report.checks.length);
    expect(report.workflow.links.length).toBe(WORKFLOW_MATRIX.length);
    expect(report.capabilities.reports.length).toBeGreaterThanOrEqual(9);
    expect(report.advisoryNotice.toLowerCase()).toContain("readiness");
  });

  it("loadReadinessWorkspace returns report and observations", () => {
    const model = loadReadinessWorkspace();
    expect(model.report.workflow.links.length).toBe(WORKFLOW_MATRIX.length);
    expect(model.observations.length).toBeGreaterThan(0);
  });
});
