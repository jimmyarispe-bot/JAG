/**
 * Sprint 204 — Command Center Organizational Memory wiring.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  loadMemoryWorkspace,
  recordDecisionOutcomeMemory,
  recordLessonLearnedMemory,
} from "@/lib/jag-command-center/memory";
import {
  loadBriefingList,
  recordSchoolHealthResult,
  resetBriefingStoreForTests,
  resetDecisionCatalogCacheForTests,
  resetDecisionExecutionStoreForTests,
  resetDecisionStatusStoreForTests,
  resetJagIntelligenceStoreForTests,
  synthesizeExecutiveBriefing,
} from "@/lib/jag-command-center";
import { SCHOOL_HEALTH_ACTION_PROPOSAL_IDS as PROPOSAL_IDS } from "@/lib/domains/education";
import {
  clearMemoryObservationsForTests,
  resetMemoryEngineForTests,
} from "@/lib/platform/intelligence/memory/index";
import type { JagPlatformSession } from "@/lib/jag-platform/session";

const session: JagPlatformSession = {
  userId: "jag-user-founder",
  email: "founder@jag.platform",
  displayName: "JAG Founder",
  role: "FOUNDER",
  issuedAt: "2026-01-01T00:00:00.000Z",
};

function bind(organizationId: string) {
  recordSchoolHealthResult({
    organizationId,
    result: {
      subjectId: organizationId,
      stance: "watch",
      healthScore: 0.6,
      evidence: [],
      recommendations: [
        {
          id: "rec-1",
          kind: "stabilize_organizational_health",
          title: "Stabilize",
          explanation: "test",
          confidence: 0.9,
          priority: 1,
          evidenceIds: [],
          suggestedActions: [
            {
              kind: "EscalateOrganizationalRisk",
              actionId: PROPOSAL_IDS.EscalateOrganizationalRisk,
              label: "Escalate Organizational Risk",
              priority: 1,
              rationale: "Escalate",
            },
          ],
          constitutionalTrace: {
            domainPackageId: "education",
            contributorId: "education.cognition.school_health",
            laws: [],
            rationale: "test",
          },
        },
      ],
      confidence: 0.85,
      explanation: "Watch",
      priority: 2,
      blockingIssues: [],
      warnings: [],
      suggestedActions: [],
      readiness: "conditional",
      analyzedAt: "2026-07-21T12:00:00.000Z",
    },
  });
}

describe("Organizational Memory Command Center (Sprint 204)", () => {
  beforeEach(() => {
    resetJagIntelligenceStoreForTests();
    resetDecisionStatusStoreForTests();
    resetDecisionExecutionStoreForTests();
    resetDecisionCatalogCacheForTests();
    resetBriefingStoreForTests();
    resetMemoryEngineForTests();
    clearMemoryObservationsForTests();
  });

  afterEach(() => {
    resetMemoryEngineForTests();
    clearMemoryObservationsForTests();
  });

  it("loads workspace and records lessons", () => {
    const idle = loadMemoryWorkspace(session);
    const orgId = idle.organizationId;
    expect(orgId).toBeTruthy();
    bind(orgId!);

    recordLessonLearnedMemory({
      session,
      organizationId: orgId!,
      organizationName: idle.organizationName ?? "Org",
      title: "Lesson: attendance outreach",
      description: "Called families after attendance decline.",
      lesson: {
        whatWorked: ["Personal calls"],
        whatFailed: ["Generic email"],
        unexpectedOutcomes: ["Teachers volunteered"],
        recommendations: ["Script the call"],
      },
    });

    const model = loadMemoryWorkspace(session, { organizationId: orgId! });
    expect(model.records.length).toBeGreaterThan(0);
    expect(model.records.some((r) => r.type === "lesson_learned")).toBe(true);
    expect(model.advisoryNotice).toMatch(/institutional|organizational/i);
  });

  it("records decision outcome into institutional memory", () => {
    const idle = loadMemoryWorkspace(session);
    const orgId = idle.organizationId!;
    bind(orgId);

    const record = recordDecisionOutcomeMemory({
      session,
      organizationId: orgId,
      organizationName: idle.organizationName ?? "Org",
      decisionId: "dec-test-1",
      decisionTitle: "Escalate organizational risk",
      result: "success",
      expectedOutcome: "Leadership aligned",
      actualOutcome: "Leadership aligned on remediation.",
      lessonsLearned: "Escalate early when health is watch.",
      confidence: 0.8,
    });

    expect(record.type).toBe("outcome");
    expect(record.relatedDecisionIds).toContain("dec-test-1");
  });

  it("includes Historical Context in executive briefings", () => {
    const orgId =
      loadBriefingList(session).selectedOrganizationId ??
      loadMemoryWorkspace(session).organizationId!;
    bind(orgId);

    recordDecisionOutcomeMemory({
      session,
      organizationId: orgId,
      organizationName: "Org",
      decisionId: "dec-brief-1",
      decisionTitle: "Teacher turnover response",
      result: "success",
      expectedOutcome: "Turnover improved",
      actualOutcome: "Turnover improved next semester.",
      lessonsLearned: "Retention stipend worked.",
      confidence: 0.85,
    });

    const result = synthesizeExecutiveBriefing({
      session,
      organizationId: orgId,
      scope: "single",
      kind: "morning_brief",
      timeline: "this_week",
      generatedBy: "tester",
    });

    expect("error" in result).toBe(false);
    if ("error" in result) return;

    const historical = result.sections.find(
      (s) => s.id === "historical_context"
    );
    expect(historical).toBeDefined();
    expect(historical!.title).toMatch(/historical/i);
  });
});
