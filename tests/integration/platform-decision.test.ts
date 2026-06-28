import { beforeEach, describe, expect, it } from "vitest";
import "@/lib/platform/decision";
import {
  PLATFORM_REFERENCE_DECISION_DEFINITIONS,
  clearDecisionAuditBuffer,
  evaluateAllDecisionConditions,
  executeDecision,
  getActiveDecisionDefinitions,
  getDecisionAuditEntries,
  getDecisionDefinitionsByDomain,
  getDecisionRegistrySnapshot,
  getRegisteredEvidenceCollectors,
  isDecisionRegistryRegistered,
  validateDecisionRegistry,
} from "@/lib/platform/decision";

describe("Platform decision registry validation", () => {
  it("passes build-time integrity checks", () => {
    const result = validateDecisionRegistry();
    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("registers reference definitions on side-effect import", () => {
    expect(isDecisionRegistryRegistered()).toBe(true);
    expect(getActiveDecisionDefinitions().length).toBeGreaterThanOrEqual(3);
  });
});

describe("Platform decision catalog", () => {
  it("defines reference definitions across domains", () => {
    const domains = new Set(PLATFORM_REFERENCE_DECISION_DEFINITIONS.map((d) => d.domain));
    expect(domains.has("platform")).toBe(true);
    expect(domains.has("operations")).toBe(true);
    expect(getDecisionDefinitionsByDomain("platform")).toHaveLength(2);
  });

  it("returns a complete registry snapshot", () => {
    const snapshot = getDecisionRegistrySnapshot();
    expect(snapshot.definitions.length).toBeGreaterThanOrEqual(3);
    expect(snapshot.domains.length).toBeGreaterThanOrEqual(2);
    expect(snapshot.registeredAt).toBeTruthy();
  });

  it("registers default evidence collectors", () => {
    expect(getRegisteredEvidenceCollectors().some((c) => c.key === "input_field")).toBe(true);
  });
});

describe("Platform decision condition evaluator", () => {
  it("evaluates equals and greater_than operators", () => {
    expect(
      evaluateAllDecisionConditions(
        [{ key: "a", field: "severity_score", operator: "greater_than", value: 50 }],
        { severity_score: 75 }
      )
    ).toBe(true);
    expect(
      evaluateAllDecisionConditions(
        [{ key: "b", field: "status", operator: "equals", value: "active" }],
        { status: "inactive" }
      )
    ).toBe(false);
  });
});

describe("Platform decision execution API", () => {
  beforeEach(() => {
    clearDecisionAuditBuffer();
  });

  it("executes rule-based decisions with full result contract", async () => {
    const result = await executeDecision({
      decisionType: "ref_platform_escalation_priority",
      inputs: { severity_score: 85, age_hours: 2 },
      organizationId: "org_1",
      schoolId: "school_1",
    });

    expect(result.decisionType).toBe("ref_platform_escalation_priority");
    expect(result.inputs.severity_score).toBe(85);
    expect(result.collectedEvidence.items.length).toBeGreaterThanOrEqual(1);
    expect(result.rulesApplied.some((rule) => rule.matched)).toBe(true);
    expect(result.recommendation.outcomeKey).toBe("immediate_escalation");
    expect(result.alternativeRecommendations.length).toBeGreaterThan(0);
    expect(result.confidence.value).toBeGreaterThan(0);
    expect(result.explanation.summary).toContain("Escalate Immediately");
    expect(result.executionTimestamp).toBeTruthy();
    expect(result.engineVersion).toBe("1.0.0");
    expect(result.engineMode).toBe("rule");
    expect(result.executionId).toBeTruthy();
  });

  it("executes AI-assisted decisions through the same public API", async () => {
    const result = await executeDecision({
      decisionType: "ref_platform_risk_signal",
      inputs: { signal_strength: 75, historical_pattern: 0.8 },
    });

    expect(result.engineMode).toBe("ai_assisted");
    expect(result.recommendation).toBeDefined();
    expect(result.confidence.level).toMatch(/low|medium|high/);
    expect(result.explanation.keyFactors.length).toBeGreaterThan(0);
  });

  it("executes hybrid decisions combining rules and AI assist", async () => {
    const result = await executeDecision({
      decisionType: "ref_platform_resource_allocation",
      inputs: { demand_index: 80, capacity_remaining: 50 },
    });

    expect(result.engineMode).toBe("hybrid");
    expect(result.rulesApplied.length).toBeGreaterThan(0);
    expect(result.recommendation.score).toBeGreaterThan(0);
  });

  it("records decision audit entries", async () => {
    const result = await executeDecision({
      decisionType: "ref_platform_escalation_priority",
      inputs: { severity_score: 55 },
    });

    const entries = getDecisionAuditEntries(result.executionId);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.result.executionId).toBe(result.executionId);
  });

  it("rejects unknown decision types", async () => {
    await expect(
      executeDecision({ decisionType: "unknown_decision", inputs: {} })
    ).rejects.toThrow('Unknown decision type "unknown_decision"');
  });
});
