import { beforeEach, describe, expect, it } from "vitest";
import {
  archiveConversation,
  askExecutiveConversation,
  clearConversationObservationsForTests,
  listConversationObservations,
  listConversations,
  loadConversationWorkspace,
  pinConversation,
  renameConversation,
  resetJagConversationStoreForTests,
  routeConversationIntent,
} from "@/lib/jag-command-center/conversation";
import {
  recordSchoolHealthResult,
  resetDecisionCatalogCacheForTests,
  resetDecisionExecutionStoreForTests,
  resetDecisionStatusStoreForTests,
  resetJagIntelligenceStoreForTests,
} from "@/lib/jag-command-center";
import { SCHOOL_HEALTH_ACTION_PROPOSAL_IDS as PROPOSAL_IDS } from "@/lib/domains/education";
import type { JagPlatformSession } from "@/lib/jag-platform/session";

const session: JagPlatformSession = {
  userId: "jag-user-founder",
  email: "founder@jag.platform",
  displayName: "JAG Founder",
  role: "FOUNDER",
  issuedAt: "2026-01-01T00:00:00.000Z",
};

function bind(orgId: string) {
  recordSchoolHealthResult({
    organizationId: orgId,
    result: {
      subjectId: orgId,
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
              rationale: "Escalate risk",
            },
          ],
          constitutionalTrace: {
            domainPackageId: "education",
            contributorId: "education.cognition.school_health",
            laws: ["law.evidence"],
            rationale: "test",
          },
        },
      ],
      confidence: 0.82,
      explanation: "Health watch with declining operational pressure.",
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

describe("Executive Conversation (Sprint 203)", () => {
  beforeEach(() => {
    resetJagIntelligenceStoreForTests();
    resetDecisionStatusStoreForTests();
    resetDecisionExecutionStoreForTests();
    resetDecisionCatalogCacheForTests();
    resetJagConversationStoreForTests();
    clearConversationObservationsForTests();
  });

  it("routes suggested prompts to grounded intents", () => {
    expect(routeConversationIntent("What should I decide today?").intent).toBe(
      "decide_today"
    );
    expect(
      routeConversationIntent("Which decisions are overdue?").intent
    ).toBe("overdue_decisions");
    expect(
      routeConversationIntent("Which forecasts deserve attention?").intent
    ).toBe("forecasts_attention");
    expect(
      routeConversationIntent("What happens if we delay this decision?").intent
    ).toBe("delay_decision");
    expect(
      routeConversationIntent("Have we seen this before?").intent
    ).toBe("historical_memory");
    expect(
      routeConversationIntent("What happened last time?").intent
    ).toBe("historical_memory");
    expect(
      routeConversationIntent("Which intervention worked best?").intent
    ).toBe("historical_memory");
    expect(
      routeConversationIntent("How often has this occurred?").intent
    ).toBe("historical_memory");
    expect(
      routeConversationIntent("Are we accomplishing our mission?").intent
    ).toBe("strategic_alignment");
    expect(
      routeConversationIntent("What deserves my attention?").intent
    ).toBe("executive_attention");
  });

  it("does not fabricate health when unbound", () => {
    const result = askExecutiveConversation({
      session,
      question: "Why is organization health declining?",
    });
    expect(result.answer.insufficientData).toBe(true);
    expect(result.answer.executiveSummary.toLowerCase()).toMatch(
      /unbound|no |empty|bind/
    );
    expect(result.answer.advisoryNotice.toLowerCase()).toContain("evidence");
  });

  it("answers decide-today from bound decision proposals", () => {
    const workspace = loadConversationWorkspace(session);
    const orgId = workspace.organizationId ?? "org-chat";
    bind(orgId);

    const result = askExecutiveConversation({
      session,
      organizationId: orgId,
      question: "What should I decide today?",
    });

    expect(result.answer.insufficientData).toBe(false);
    expect(result.answer.relatedDecisions.length).toBeGreaterThan(0);
    expect(result.answer.evidence.length).toBeGreaterThan(0);
    expect(result.answer.confidence).toBeGreaterThan(0);
    expect(result.answer.reasoningChain.length).toBeGreaterThan(0);
    expect(listConversationObservations(1)[0]?.question).toContain("decide");
  });

  it("retains topic memory for follow-up questions", () => {
    const workspace = loadConversationWorkspace(session);
    const orgId = workspace.organizationId ?? "org-chat-2";
    bind(orgId);

    const first = askExecutiveConversation({
      session,
      organizationId: orgId,
      question: "Why is funding declining?",
    });
    expect(first.conversation.memoryTopics).toContain("funding");

    const second = askExecutiveConversation({
      session,
      conversationId: first.conversation.id,
      organizationId: orgId,
      question: "How does that affect student success?",
    });
    expect(second.intent === "follow_up" || second.intent === "student_success").toBe(
      true
    );
    expect(second.answer.reasoningChain.join(" ").toLowerCase()).toMatch(
      /funding|follow|student/
    );
  });

  it("supports pin rename archive and search list", () => {
    const first = askExecutiveConversation({
      session,
      question: "What should I decide today?",
    });

    renameConversation(first.conversation.id, "Morning triage");
    pinConversation(first.conversation.id, true);
    const listed = listConversations({ query: "Morning" });
    expect(listed.some((c) => c.title === "Morning triage" && c.pinned)).toBe(
      true
    );
    archiveConversation(first.conversation.id, true);
    expect(listConversations().some((c) => c.id === first.conversation.id)).toBe(
      false
    );
  });

  it("loads workspace with suggested prompts", () => {
    const model = loadConversationWorkspace(session);
    expect(model.suggestedPrompts.length).toBeGreaterThanOrEqual(8);
    expect(model.advisoryNotice.toLowerCase()).toContain("chatbot");
  });
});
