/**
 * Sprint 206 — Executive Inbox Command Center wiring.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  loadExecutiveInbox,
  recordSchoolHealthResult,
  resetDecisionCatalogCacheForTests,
  resetDecisionExecutionStoreForTests,
  resetDecisionStatusStoreForTests,
  resetJagIntelligenceStoreForTests,
  routeConversationIntent,
  askExecutiveConversation,
} from "@/lib/jag-command-center";
import { SCHOOL_HEALTH_ACTION_PROPOSAL_IDS as PROPOSAL_IDS } from "@/lib/domains/education";
import {
  clearWatcherObservationsForTests,
  resetWatcherServiceForTests,
} from "@/lib/platform/intelligence/watchers/index";
import {
  clearStrategyObservationsForTests,
  resetStrategyServiceForTests,
} from "@/lib/platform/intelligence/strategy/index";
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
      healthScore: 0.55,
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
      confidence: 0.82,
      explanation: "Watch",
      priority: 2,
      blockingIssues: [],
      warnings: ["ops"],
      suggestedActions: [],
      readiness: "conditional",
      analyzedAt: "2026-07-21T12:00:00.000Z",
      attributes: { trend: "declining", riskLevel: "elevated" },
    },
  });
}

describe("Executive Inbox (Sprint 206)", () => {
  beforeEach(() => {
    resetJagIntelligenceStoreForTests();
    resetDecisionStatusStoreForTests();
    resetDecisionExecutionStoreForTests();
    resetDecisionCatalogCacheForTests();
    resetWatcherServiceForTests();
    clearWatcherObservationsForTests();
    resetStrategyServiceForTests();
    clearStrategyObservationsForTests();
    resetMemoryEngineForTests();
    clearMemoryObservationsForTests();
  });

  afterEach(() => {
    resetWatcherServiceForTests();
    clearWatcherObservationsForTests();
    resetStrategyServiceForTests();
    resetMemoryEngineForTests();
  });

  it("loads inbox and evaluates watchers", () => {
    const idle = loadExecutiveInbox(session);
    expect(idle.organizationId).toBeTruthy();
    bind(idle.organizationId!);
    const model = loadExecutiveInbox(session, {
      organizationId: idle.organizationId!,
    });
    expect(model.advisoryNotice).toMatch(/never executes/i);
    expect(model.evaluation.observationId).toBeTruthy();
    // Strategy seed alone should yield goal/initiative findings
    expect(model.alerts.length).toBeGreaterThan(0);
  });

  it("generates morning digest", () => {
    const idle = loadExecutiveInbox(session);
    bind(idle.organizationId!);
    const model = loadExecutiveInbox(session, {
      organizationId: idle.organizationId!,
      digest: "morning",
    });
    expect(model.latestDigest?.kind).toBe("morning");
    expect(model.latestDigest?.highlights.length).toBeGreaterThan(0);
  });

  it("routes executive attention conversation intents", () => {
    expect(
      routeConversationIntent("What deserves my attention?").intent
    ).toBe("executive_attention");
    expect(
      routeConversationIntent("What is our biggest emerging risk?").intent
    ).toBe("executive_attention");
    expect(routeConversationIntent("What's changed today?").intent).toBe(
      "what_changed"
    );
  });

  it("answers attention questions from watcher findings", () => {
    const idle = loadExecutiveInbox(session);
    const orgId = idle.organizationId!;
    bind(orgId);
    const result = askExecutiveConversation({
      session,
      organizationId: orgId,
      question: "What deserves my attention?",
    });
    expect(result.answer.insufficientData).toBe(false);
    expect(result.answer.executiveSummary.toLowerCase()).toMatch(
      /attention|risk|goal|decision|inbox|finding/
    );
    expect(result.answer.advisoryNotice.toLowerCase()).toMatch(
      /never executes|attention|advisory/
    );
  });
});
