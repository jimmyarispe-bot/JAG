import { beforeEach, describe, expect, it, vi } from "vitest";
import "@/lib/platform/rules";
import {
  PLATFORM_REFERENCE_RULE_SETS,
  RULE_ENGINE_DOMAINS,
  clearRuleAuditBuffer,
  evaluateRuleConditions,
  evaluateRuleSet,
  getActiveRuleSets,
  getRegisteredRuleDomains,
  getRuleAuditEntries,
  getRuleRegistrySnapshot,
  getRuleSetsByDomain,
  isRuleRegistryRegistered,
  mergeEvidenceIntoFacts,
  validateRuleRegistry,
} from "@/lib/platform/rules";

describe("Platform rules registry validation", () => {
  it("passes build-time integrity checks", () => {
    const result = validateRuleRegistry();
    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("registers reference rule sets on side-effect import", () => {
    expect(isRuleRegistryRegistered()).toBe(true);
    expect(getActiveRuleSets().length).toBeGreaterThanOrEqual(12);
  });

  it("covers all declared rule engine domains", () => {
    const registeredDomains = new Set(getRegisteredRuleDomains());
    for (const domain of RULE_ENGINE_DOMAINS) {
      expect(registeredDomains.has(domain)).toBe(true);
    }
  });
});

describe("Platform rules catalog", () => {
  it("organizes rule sets by domain", () => {
    expect(getRuleSetsByDomain("scholarships").some((set) => set.ruleSetKey === "ref_scholarship_eligibility")).toBe(true);
    expect(getRuleSetsByDomain("graduation_readiness").length).toBeGreaterThan(0);
    expect(PLATFORM_REFERENCE_RULE_SETS.length).toBeGreaterThanOrEqual(12);
  });

  it("returns a complete registry snapshot", () => {
    const snapshot = getRuleRegistrySnapshot();
    expect(snapshot.ruleSets.length).toBeGreaterThanOrEqual(12);
    expect(snapshot.domains.length).toBeGreaterThanOrEqual(12);
    expect(snapshot.registeredAt).toBeTruthy();
  });
});

describe("Platform rules condition evaluator", () => {
  it("evaluates equals and greater_than operators deterministically", () => {
    expect(
      evaluateRuleConditions(
        [{ key: "a", field: "score", operator: "greater_than", value: 70 }],
        { score: 85 }
      )
    ).toBe(true);
    expect(
      evaluateRuleConditions(
        [{ key: "b", field: "role", operator: "in", value: ["admin"] }],
        { role: "teacher" }
      )
    ).toBe(false);
  });
});

describe("Platform rules evaluation API", () => {
  beforeEach(() => {
    clearRuleAuditBuffer();
  });

  it("evaluates first_match rule sets with explainable results", async () => {
    const result = await evaluateRuleSet({
      ruleSetKey: "ref_platform_access_gate",
      facts: { role: "admin" },
      organizationId: "11111111-1111-4111-8111-111111111111",
    });

    expect(result.ruleSetKey).toBe("ref_platform_access_gate");
    expect(result.evaluationMode).toBe("first_match");
    expect(result.primaryOutcome?.outcomeKey).toBe("grant_access");
    expect(result.matchedRules.some((rule) => rule.ruleKey === "admin_role")).toBe(true);
    expect(result.explanation.summary).toContain("Grant Access");
    expect(result.explanation.matchedRuleSummary.length).toBeGreaterThan(0);
    expect(result.explanation.primaryReason).toContain("grant_access");
    expect(result.engineVersion).toBe("1.0.0");
  });

  it("falls through to default deny when no rules match", async () => {
    const result = await evaluateRuleSet({
      ruleSetKey: "ref_platform_access_gate",
      facts: { role: "guest", has_permission: false },
    });

    expect(result.primaryOutcome?.outcomeKey).toBe("deny_access");
    expect(result.explanation.unmatchedRuleSummary.length).toBeGreaterThan(0);
  });

  it("records rule audit entries in memory", async () => {
    const result = await evaluateRuleSet({
      ruleSetKey: "ref_scholarship_eligibility",
      facts: { eligibility_score: 90 },
    });

    const entries = getRuleAuditEntries(result.evaluationId);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.result.evaluationId).toBe(result.evaluationId);
  });

  it("merges KEE evidence into evaluation facts", async () => {
    const facts = mergeEvidenceIntoFacts(
      { placement_score: 80 },
      [
        {
          id: "ev_1",
          evidence_type_key: "measurement.progress",
          skill_keys: ["AW-SL-PA-001-S01-v1.0.0"],
          competency_keys: ["AW-SL-PA-001-v1.0.0"],
          student_id: "33333333-3333-4333-8333-333333333333",
          organization_id: null,
          school_id: null,
          captured_at: new Date().toISOString(),
          captured_by_role: "teacher",
          captured_by_user_id: null,
          source_context: {},
          locale: "en",
          jurisdiction_keys: [],
          artifact_refs: [],
          scores: [],
          narrative: null,
          accommodations_applied: [],
          evidence_confidence: 0.9,
          evidence_quality: 0.85,
          expires_at: null,
          relationships: [],
          supersedes_evidence_id: null,
          ai_assisted: false,
          ai_validation_status: null,
          metadata: {},
          status: "active",
          recorded_at: new Date().toISOString(),
        },
      ]
    );

    expect(facts.evidence_count).toBe(1);
    expect(facts.competency_keys).toContain("AW-SL-PA-001-v1.0.0");

    const result = await evaluateRuleSet({
      ruleSetKey: "ref_student_placement",
      facts,
    });

    expect(result.primaryOutcome?.outcomeKey).toBe("place_advanced");
  });

  it("rejects unknown rule sets", async () => {
    await expect(
      evaluateRuleSet({ ruleSetKey: "unknown_rule_set", facts: {} })
    ).rejects.toThrow('Unknown rule set "unknown_rule_set"');
  });
});
