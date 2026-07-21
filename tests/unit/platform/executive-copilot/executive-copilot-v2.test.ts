/** RC-5 — Executive Copilot 2.0 unit tests. */
import { beforeEach, describe, expect, it } from "vitest";
import {
  createIntegrationPlatformCore,
  registerCrmPlatformConnectors,
  registerHrPlatformConnectors,
  registerFinancePlatformConnectors,
  registerCollaborationPlatformConnectors,
  crmStore,
  hrStore,
  financeStore,
} from "@/lib/platform/integrations";
import {
  rebuildUnifiedKnowledgeGraph,
  unifiedGraphStore,
} from "@/lib/platform/knowledge-graph";
import {
  EXECUTIVE_COPILOT_V2_VERSION,
  COPILOT_V2_CAPABILITIES,
  answerExecutiveCopilotV2,
  detectCopilotV2Intent,
  shouldRouteToCopilotV2,
} from "@/lib/platform/executive-copilot";
import { createExecutiveCopilotIntelligence } from "@/lib/platform/intelligence/executive-copilot";

describe("RC-5 — Executive Copilot 2.0", () => {
  beforeEach(() => {
    crmStore.clear();
    hrStore.clear();
    financeStore.clear();
    unifiedGraphStore.clear();
  });

  async function seedOrg(org = "org-copilot-v2-demo") {
    const platform = createIntegrationPlatformCore();
    registerCrmPlatformConnectors(platform);
    registerHrPlatformConnectors(platform);
    registerFinancePlatformConnectors(platform);
    try {
      registerCollaborationPlatformConnectors(platform);
    } catch {
      /* optional if collaboration registration naming differs */
    }

    for (const id of [
      `hubspot-${org}`,
      `gusto-${org}`,
      `stripe-${org}`,
    ]) {
      platform.lifecycle.seed(id, "connected");
    }

    await platform.syncNow("hubspot", `hubspot-${org}`, "full");
    await platform.syncNow("gusto", `gusto-${org}`, "full");
    await platform.syncNow("stripe", `stripe-${org}`, "full");
    rebuildUnifiedKnowledgeGraph(org);
    return org;
  }

  it("exports version and capability catalog", () => {
    expect(EXECUTIVE_COPILOT_V2_VERSION).toBe("2.0.0");
    expect(COPILOT_V2_CAPABILITIES).toEqual(
      expect.arrayContaining([
        "cross_domain_reasoning",
        "organizational_investigation",
        "root_cause_analysis",
        "decision_support",
        "executive_narratives",
        "board_preparation",
        "digital_twin_reasoning",
        "timeline_reasoning",
        "memory_reasoning",
      ])
    );
  });

  it("detects example capability intents", () => {
    expect(detectCopilotV2Intent("Why is revenue declining?")).toBe("revenue_decline");
    expect(detectCopilotV2Intent("Which departments are disconnected?")).toBe(
      "disconnected_departments"
    );
    expect(detectCopilotV2Intent("Summarize everything affecting Initiative Alpha.")).toBe(
      "initiative_impact"
    );
    expect(detectCopilotV2Intent("Who are the key decision makers?")).toBe("decision_makers");
    expect(detectCopilotV2Intent("Show organizational risks this month.")).toBe(
      "organizational_risks"
    );
    expect(shouldRouteToCopilotV2("Why is revenue declining?")).toBe(true);
    expect(shouldRouteToCopilotV2("Why did enrollment decline in Florida?")).toBe(false);
  });

  it("answers revenue decline with root-cause + cross-domain soft-reads", async () => {
    const org = await seedOrg();
    const result = answerExecutiveCopilotV2({
      organizationId: org,
      question: "Why is revenue declining?",
    });
    expect(result.version).toBe("2.0.0");
    expect(result.intent).toBe("revenue_decline");
    expect(result.capabilitiesUsed).toContain("root_cause_analysis");
    expect(result.answer.length).toBeGreaterThan(20);
    expect(result.rootCauses?.length).toBeGreaterThan(0);
    expect(result.contributingDomains.length).toBeGreaterThan(1);
  });

  it("investigates disconnected departments", async () => {
    const org = await seedOrg();
    const result = answerExecutiveCopilotV2({
      organizationId: org,
      question: "Which departments are disconnected?",
    });
    expect(result.intent).toBe("disconnected_departments");
    expect(result.investigation).toBeTruthy();
    expect(result.investigation!.findings.length).toBeGreaterThan(0);
  });

  it("summarizes initiative impact", async () => {
    const org = await seedOrg();
    const result = answerExecutiveCopilotV2({
      organizationId: org,
      question: "Summarize everything affecting Initiative Alpha.",
    });
    expect(result.intent).toBe("initiative_impact");
    expect(result.answer).toMatch(/Initiative impact/i);
  });

  it("identifies decision makers from graph people soft-search", async () => {
    const org = await seedOrg();
    const result = answerExecutiveCopilotV2({
      organizationId: org,
      question: "Who are the key decision makers?",
    });
    expect(result.intent).toBe("decision_makers");
    expect(result.capabilitiesUsed).toContain("decision_support");
    expect(result.answer.length).toBeGreaterThan(10);
  });

  it("surfaces organizational risks this month", async () => {
    const org = await seedOrg();
    const result = answerExecutiveCopilotV2({
      organizationId: org,
      question: "Show organizational risks this month.",
    });
    expect(result.intent).toBe("organizational_risks");
    expect(result.answer).toMatch(/risk/i);
  });

  it("prepares board package and digital twin reasoning", async () => {
    const org = await seedOrg();
    const board = answerExecutiveCopilotV2({
      organizationId: org,
      question: "Prepare the board package",
    });
    expect(board.intent).toBe("board_prep");
    expect(board.boardPrep?.briefingSummary.length).toBeGreaterThan(10);

    const twin = answerExecutiveCopilotV2({
      organizationId: org,
      question: "Run a digital twin scenario on runway",
    });
    expect(twin.intent).toBe("digital_twin");
    expect(twin.capabilitiesUsed).toContain("digital_twin_reasoning");
  });

  it("bridges into Sprint 067 orchestrator for RC-5 questions", async () => {
    const org = await seedOrg();
    const { service } = createExecutiveCopilotIntelligence({
      createId: (p) => `${p}-v2`,
      now: () => new Date("2026-07-19T12:00:00.000Z"),
    });
    const result = service.ask({
      requestId: "copilot-v2-bridge",
      question: "Why is revenue declining?",
      scope: { organizationId: org, schoolId: null },
    });
    expect(result.metadata.copilotV2).toBe(true);
    expect(result.intent).toBe("investigate");
    expect(result.answer.length).toBeGreaterThan(20);
    expect(result.governance.mayAutoExecute).toBe(false);
  });
});
