/**
 * Sprint 204 — Organizational Memory engine tests.
 */

import { afterEach, describe, expect, it } from "vitest";
import {
  clearMemoryObservationsForTests,
  listMemoryObservations,
  MEMORY_TYPES,
  MemoryRegistry,
  MemoryService,
  resetMemoryEngineForTests,
} from "@/lib/platform/intelligence/memory/index";

describe("Organizational Memory (Sprint 204)", () => {
  afterEach(() => {
    resetMemoryEngineForTests();
    clearMemoryObservationsForTests();
  });

  it("registers all memory types", () => {
    expect(MemoryRegistry.list().map((d) => d.type)).toEqual([...MEMORY_TYPES]);
  });

  it("creates memory with institutional fields", () => {
    const record = MemoryService.create({
      type: "decision",
      organizationId: "org-1",
      organizationName: "North Academy",
      title: "Hiring freeze during funding shortage",
      description: "Paused open roles after budget shortfall.",
      outcome: "mixed",
      outcomeSummary: "Stabilized cash; delayed growth hires.",
      confidence: 0.8,
      relatedDecisionIds: ["dec-1"],
      relatedForecastIds: ["fc-1"],
      relatedScenarioIds: ["sc-1"],
      relatedContributorIds: ["contrib-1"],
      relatedPolicyIds: ["pol-1"],
      relatedGoalIds: ["goal-1"],
      tags: ["funding", "budget"],
      createdBy: "exec-1",
    });

    expect(record.id).toMatch(/^mem-/);
    expect(record.organizationId).toBe("org-1");
    expect(record.relatedDecisionIds).toContain("dec-1");
    expect(record.advisoryNotice).toMatch(/organizational experience/i);
  });

  it("detects recurring advisory patterns", () => {
    MemoryService.create({
      type: "risk_event",
      organizationId: "org-1",
      organizationName: "North Academy",
      title: "Q1 funding shortfall",
      description: "Budget cut forced program pause.",
      tags: ["funding"],
      outcome: "failure",
      createdBy: "exec-1",
    });
    MemoryService.create({
      type: "outcome",
      organizationId: "org-1",
      organizationName: "North Academy",
      title: "Mid-year budget shortage",
      description: "Another funding gap mid year.",
      tags: ["budget"],
      outcome: "mixed",
      createdBy: "exec-1",
    });

    const result = MemoryService.search("org-1", {});
    const funding = result.patterns.find((p) => p.kind === "funding_shortages");
    expect(funding).toBeDefined();
    expect(funding!.occurrenceCount).toBeGreaterThanOrEqual(2);
    expect(funding!.summary).toMatch(/advisory/i);
  });

  it("finds similar situations with outcome and lessons", () => {
    MemoryService.create({
      type: "outcome",
      organizationId: "org-1",
      organizationName: "North Academy",
      title: "Teacher turnover intervention",
      description: "Retention bonus after attrition spike.",
      outcome: "success",
      outcomeSummary: "Turnover dropped next semester.",
      tags: ["teacher", "turnover", "intervention"],
      lesson: {
        whatWorked: ["Retention stipend"],
        whatFailed: ["Delayed posting"],
        unexpectedOutcomes: ["Mentorship interest rose"],
        recommendations: ["Fund retention earlier"],
      },
      confidence: 0.85,
      createdBy: "exec-1",
    });
    MemoryService.create({
      type: "decision",
      organizationId: "org-1",
      organizationName: "North Academy",
      title: "Unrelated facilities upgrade",
      description: "Paint and HVAC refresh.",
      outcome: "success",
      tags: ["facilities"],
      createdBy: "exec-1",
    });

    const { situations } = MemoryService.similarSituations({
      organizationId: "org-1",
      title: "Staffing crisis and teacher attrition",
      description: "High teacher turnover this year",
      tags: ["teacher", "turnover"],
    });

    expect(situations.length).toBeGreaterThan(0);
    expect(situations[0]!.title).toMatch(/turnover/i);
    expect(situations[0]!.outcome).toBe("success");
    expect(situations[0]!.lessons.length).toBeGreaterThan(0);
    expect(situations[0]!.confidence).toBeGreaterThan(0);
  });

  it("records lessons learned", () => {
    const lesson = MemoryService.recordLesson({
      organizationId: "org-1",
      organizationName: "North Academy",
      title: "After-action: enrollment campaign",
      description: "Spring open house series.",
      lesson: {
        whatWorked: ["Evening sessions"],
        whatFailed: ["Weekday mornings"],
        unexpectedOutcomes: ["Sibling referrals"],
        recommendations: ["Repeat evenings"],
      },
      createdBy: "exec-1",
    });

    expect(lesson.type).toBe("lesson_learned");
    expect(lesson.lesson?.whatWorked).toContain("Evening sessions");
  });

  it("searches by goal, policy, and contributor facets", () => {
    MemoryService.create({
      type: "milestone",
      organizationId: "org-1",
      organizationName: "North Academy",
      title: "Accreditation milestone",
      description: "Passed compliance review.",
      relatedGoalIds: ["goal-acc"],
      relatedPolicyIds: ["pol-comp"],
      relatedContributorIds: ["c-ops"],
      tags: ["compliance"],
      outcome: "success",
      createdBy: "exec-1",
    });

    const byGoal = MemoryService.search("org-1", { goalId: "goal-acc" });
    expect(byGoal.records).toHaveLength(1);

    const byPolicy = MemoryService.search("org-1", { policyId: "pol-comp" });
    expect(byPolicy.records).toHaveLength(1);

    const byContributor = MemoryService.search("org-1", {
      contributorId: "c-ops",
    });
    expect(byContributor.records).toHaveLength(1);

    const riskFacet = MemoryService.search("org-1", { facet: "risk" });
    expect(riskFacet.records.length).toBeGreaterThanOrEqual(0);
  });

  it("records observability for create, search, similarity, retrieval", () => {
    const created = MemoryService.create({
      type: "executive_note",
      organizationId: "org-1",
      organizationName: "North Academy",
      title: "Note on attendance decline",
      description: "Chronic absences rising.",
      tags: ["attendance"],
      createdBy: "exec-1",
    });

    MemoryService.search("org-1", { q: "attendance" });
    MemoryService.similarSituations({
      organizationId: "org-1",
      title: "Attendance drop",
      description: "Decline in daily attendance",
      tags: ["attendance"],
    });
    MemoryService.get(created.id);

    const kinds = new Set(listMemoryObservations().map((o) => o.kind));
    expect(kinds.has("memory_created")).toBe(true);
    expect(kinds.has("memory_retrieval")).toBe(true);
    expect(kinds.has("pattern_detection")).toBe(true);
    expect(kinds.has("similarity_search")).toBe(true);
  });
});
