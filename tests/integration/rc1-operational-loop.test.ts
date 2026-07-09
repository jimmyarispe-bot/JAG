import { describe, expect, it } from "vitest";
import "@/lib/platform/operational-loop/register";
import {
  LOOP_TRANSITION_REGISTRY,
} from "@/lib/platform/operational-loop/registry";
import {
  OPERATIONAL_LOOP_STAGES,
  OPERATIONAL_LOOP_TRANSITION_KEYS,
} from "@/lib/platform/operational-loop/types";
import { processCanonicalLearningProgress } from "@/lib/instruction/canonical-progress";
import {
  deliverParentCommunication,
  resolveFamilyPortalUserIds,
} from "@/lib/platform/parent-communication/deliver";
import { buildRc1StabilizationReport } from "@/lib/certification/rc1-stabilization-report";

describe("RC1 Operational Loop — lifecycle registry", () => {
  it("defines the full inquiry → billing → repeat chain", () => {
    expect(OPERATIONAL_LOOP_STAGES).toEqual([
      "admissions",
      "enrollment",
      "scheduling",
      "instruction",
      "evidence",
      "progress",
      "parent_communication",
      "billing",
    ]);
    expect(OPERATIONAL_LOOP_TRANSITION_KEYS).toHaveLength(8);
  });

  it("links each transition fromStage to toStage without gaps in the primary path", () => {
    const primaryPath = [
      "admissions_to_enrollment",
      "enrollment_to_scheduling",
      "scheduling_to_instruction",
      "instruction_to_evidence",
      "evidence_to_progress",
      "progress_to_parent_communication",
      "parent_communication_to_billing",
      "billing_to_scheduling_cycle",
    ] as const;

    for (const key of primaryPath) {
      const def = LOOP_TRANSITION_REGISTRY[key];
      expect(def.transitionKey).toBe(key);
      expect(def.eventType).toBe("jag.operational_loop.transitioned");
      expect(def.capabilityKey).toBeTruthy();
    }

    expect(LOOP_TRANSITION_REGISTRY.admissions_to_enrollment.fromStage).toBe("admissions");
    expect(LOOP_TRANSITION_REGISTRY.admissions_to_enrollment.toStage).toBe("enrollment");
    expect(LOOP_TRANSITION_REGISTRY.billing_to_scheduling_cycle.fromStage).toBe("billing");
    expect(LOOP_TRANSITION_REGISTRY.billing_to_scheduling_cycle.toStage).toBe("scheduling");
  });

  it("assigns next work for every transition", () => {
    for (const key of OPERATIONAL_LOOP_TRANSITION_KEYS) {
      const def = LOOP_TRANSITION_REGISTRY[key];
      expect(def.nextWorkModule).toBeTruthy();
      expect(def.nextWorkTitle).toBeTruthy();
      expect(def.nextWorkHref).toBeTruthy();
    }
  });
});

describe("RC1 Canonical Learning Progress", () => {
  it("exports the authoritative pipeline entry point", () => {
    expect(typeof processCanonicalLearningProgress).toBe("function");
  });
});

describe("RC1 Parent Communication", () => {
  it("exports portal delivery helpers", () => {
    expect(typeof deliverParentCommunication).toBe("function");
    expect(typeof resolveFamilyPortalUserIds).toBe("function");
  });
});

describe("RC1 Production Certification Report", () => {
  it("builds stabilization report with score and findings tiers", () => {
    const report = buildRc1StabilizationReport({
      generatedAt: new Date().toISOString(),
      overallScore: 82,
      p1ItemsResolved: 12,
      findings: [
        { findingKey: "a", category: "critical", domain: "comms", title: "Test", description: "d" },
        { findingKey: "b", category: "medium", domain: "ui", title: "Test2", description: "d2" },
      ],
    });

    expect(report.markdown).toContain("P1 Release Stabilization Report");
    expect(report.overallScore).toBe(82);
    expect(report.pilotReady).toBe(false);
    expect(report.remainingCritical).toBe(1);
    expect(report.remainingMedium).toBe(1);
  });
});
