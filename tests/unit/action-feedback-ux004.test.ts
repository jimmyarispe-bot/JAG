import { describe, expect, it } from "vitest";
import {
  DEFAULT_PROCESSING_THRESHOLD_MS,
  DEFAULT_SUCCESS_DURATION_MS,
  IMMEDIATE_FEEDBACK_MS,
  resolveActionLabels,
} from "@/components/experience-system/feedback/action-labels";

describe("UX-004 action feedback defaults", () => {
  it("keeps success flash in the 500–1000ms band", () => {
    expect(DEFAULT_SUCCESS_DURATION_MS).toBeGreaterThanOrEqual(500);
    expect(DEFAULT_SUCCESS_DURATION_MS).toBeLessThanOrEqual(1000);
  });

  it("escalates long ops at 2 seconds", () => {
    expect(DEFAULT_PROCESSING_THRESHOLD_MS).toBe(2000);
  });

  it("targets immediate feedback under 100ms", () => {
    expect(IMMEDIATE_FEEDBACK_MS).toBeLessThanOrEqual(100);
  });

  it("resolves open / export / retry verbs", () => {
    expect(resolveActionLabels("open").loading).toMatch(/Opening/);
    expect(resolveActionLabels("export").loading).toMatch(/export/i);
    expect(resolveActionLabels("retry").idle).toBe("Retry");
  });
});
