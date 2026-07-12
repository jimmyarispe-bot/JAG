/**
 * JAG OIOS Core Architecture — unit tests (Sprint 031).
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  OIOS_INTELLIGENCE_DOMAINS,
  createOiosOperatingSystem,
} from "@/lib/platform/oios";
import { createIntelligenceService } from "@/lib/platform/intelligence";
import {
  createIntelligencePlatform,
  resetPlatformIdSeqForTests,
} from "@/lib/platform/intelligence/infrastructure";
import { resetGraphEdgeSeqForTests } from "@/lib/platform/intelligence/executive-graph";

describe("JAG OIOS Core Architecture (Sprint 031)", () => {
  beforeEach(() => {
    resetGraphEdgeSeqForTests();
    resetPlatformIdSeqForTests();
  });

  it("bootstraps domains and builds a full operating-system snapshot", () => {
    let seq = 0;
    const stack = createOiosOperatingSystem({
      createId: (prefix) => `${prefix}-${++seq}`,
      now: () => new Date("2026-07-12T17:00:00.000Z"),
      wireOrganizationDna: false,
    });

    stack.operatingSystem.bootstrap({
      organizationId: "org-1",
      schoolId: "school-1",
    });

    expect(stack.registry.list().length).toBe(OIOS_INTELLIGENCE_DOMAINS.length);
    expect(stack.registry.get("human-capital")?.status).toBe("active");
    expect(stack.registry.get("revenue")?.status).toBe("active");
    expect(stack.registry.get("funding")?.status).toBe("active");
    expect(stack.registry.get("opportunity")?.status).toBe("active");
    expect(stack.registry.get("organizational-improvement")?.status).toBe("active");
    expect(stack.registry.get("business-model")?.status).toBe("active");
    expect(stack.registry.get("organization-dna")?.status).toBe("active");

    const result = stack.service.build({
      requestId: "oios-test-1",
      scope: { organizationId: "org-1", schoolId: "school-1" },
      dnaSeed: {
        name: "Northstar Academy",
        stageHint: "startup",
        missionHint: "Operate with clarity",
      },
      baselineOverrides: {
        healthScore: 78,
        financialScore: 74,
        executionScore: 71,
      },
    });

    expect(result.version).toBe("0.1.0");
    expect(result.twin.state.lifecycle).toBeTruthy();
    expect(result.health.score).toBeGreaterThan(0);
    expect(result.maturity.level).toBeTruthy();
    expect(result.scorecard.overall).toBeGreaterThan(0);
    expect(result.capabilities.length).toBeGreaterThanOrEqual(5);
    expect(result.opportunities.length).toBeGreaterThan(0);
    expect(result.improvementCycle.stages).toEqual([
      "assess",
      "prioritize",
      "plan",
      "execute",
      "measure",
      "learn",
    ]);
    expect(result.strategy.objectives.length).toBeGreaterThan(0);
    expect(result.execution.cadence.length).toBeGreaterThan(0);
    expect(result.operatingModel.processes.length).toBeGreaterThan(0);
    expect(result.governance.policies.length).toBeGreaterThan(0);
    expect(result.governance.standards.length).toBeGreaterThan(0);
    expect(result.benchmarks.length).toBeGreaterThan(0);
    expect(result.memory.length).toBeGreaterThan(0);
    expect(result.knowledge.nodes.length).toBeGreaterThanOrEqual(2);
    expect(result.domains.length).toBe(OIOS_INTELLIGENCE_DOMAINS.length);

    const answer = stack.service.query(result, {
      question: "How healthy are we?",
      focus: "health",
    });
    expect(answer.answer.toLowerCase()).toContain("health");
  });

  it("enriches from Organizational DNA when wired", () => {
    const stack = createOiosOperatingSystem({
      createId: (prefix) => `${prefix}-dna`,
      now: () => new Date("2026-07-12T17:00:00.000Z"),
      wireOrganizationDna: true,
      organizationDnaOptions: {
        wireGraphAnalyzer: false,
        wireDecision: false,
        wirePredictive: false,
        wireBoardGovernance: false,
        createId: (prefix) => `${prefix}-dna-inner`,
        now: () => new Date("2026-07-12T17:00:00.000Z"),
      },
    });

    const result = stack.service.build({
      requestId: "oios-dna-1",
      scope: { organizationId: "org-1", schoolId: "school-1" },
      dnaSeed: {
        name: "DNA Wired Org",
        stageHint: "growth",
        ideaSummary: "Scale with operating intelligence",
      },
    });

    expect(stack.organizationDna).toBeTruthy();
    expect(result.dna).toBeTruthy();
    expect(result.dna?.stage).toBe("growth");
    expect(result.twin.state.lifecycle).toBe("growth");
  });

  it("wires oios onto createIntelligenceService", () => {
    const service = createIntelligenceService();
    expect(service.oios).toBeTruthy();
    expect(service.oios.service).toBeTruthy();
    expect(service.oios.organizationDna).toBe(service.organizationDna);

    const result = service.oios.service.build({
      requestId: "wired-oios-1",
      scope: { organizationId: "org-1", schoolId: "school-1" },
      baselineOverrides: { healthScore: 82 },
    });
    expect(result.health.score).toBeGreaterThan(0);
  });

  it("runs as platform module after organization-dna", async () => {
    const platform = createIntelligencePlatform({
      clock: {
        now: () => new Date("2026-07-12T17:00:00.000Z"),
        createId: (prefix) => `${prefix}-test`,
      },
    });

    const result = await platform.run({
      scope: { organizationId: "org-1", schoolId: "school-1" },
      bypassCache: true,
      input: {
        seed: {
          name: "Platform OIOS Org",
          stageHint: "startup",
        },
      },
    });

    expect(result.status).toBe("completed");
    expect(result.moduleOrder).toEqual([
      "organization-dna",
      "oios-core",
      "organization-health",
      "financial",
      "founder",
      "executive",
      "executive-graph",
      "executive-decision",
      "predictive",
      "board-governance",
      "human-capital",
      "revenue",
      "funding",
      "opportunity",
      "organizational-improvement",
      "business-model",
    ]);
    expect(result.results.every((item) => item.ok)).toBe(true);
  });
});
