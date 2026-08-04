/**
 * Foundation II — blocking IDOR remediations
 * (briefing approve, search catalog, notifications, inbox alertId).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SCHOOL_HEALTH_ACTION_PROPOSAL_IDS as PROPOSAL_IDS } from "@/lib/domains/education";
import {
  resetJagBusinessStoreForTests,
  saveProvisionedOrganization,
} from "@/lib/jag-business/store";
import type { ProvisionedOrganization } from "@/lib/jag-business/types";
import {
  approveBriefingDecision,
  createBriefingShareLink,
  addExecutiveBriefingNote,
} from "@/lib/jag-command-center/briefing-engine/actions";
import {
  resetBriefingStoreForTests,
  saveBriefing,
} from "@/lib/jag-command-center/briefing-engine/store";
import type { JagExecutiveBriefing } from "@/lib/jag-command-center/briefing-engine/types";
import { recordSchoolHealthResult } from "@/lib/jag-command-center/intelligence-store";
import { resetJagIntelligenceStoreForTests } from "@/lib/jag-command-center/intelligence-store";
import {
  getDecisionStatus,
  resetDecisionStatusStoreForTests,
} from "@/lib/jag-command-center/decision-center/status-store";
import {
  loadDecisionCenter,
  projectDecisionId,
  resetDecisionCatalogCacheForTests,
  resetDecisionExecutionStoreForTests,
  updateDecisionCenterStatus,
} from "@/lib/jag-command-center/decision-center";
import {
  askExecutiveConversation,
  createConversation,
  getAccessibleConversation,
  jagRenameConversationAction,
  loadConversationWorkspace,
  resetJagConversationStoreForTests,
  saveConversation,
} from "@/lib/jag-command-center/conversation";
import { gatherConversationContext } from "@/lib/jag-command-center/conversation/context";
import {
  countUnreadJagNotifications,
  getJagNotification,
  listJagNotifications,
  markNotificationReadAction,
  pushJagNotification,
  resetJagNotificationStoreForTests,
} from "@/lib/jag-command-center/notifications";
import { loadJagSearchCatalog } from "@/lib/jag-command-center/search-catalog";
import {
  getAccessibleWatcherAlert,
  loadExecutiveInbox,
} from "@/lib/jag-command-center/watchers";
import {
  resetWatcherServiceForTests,
  seedWatcherAlertForTests,
  type WatcherAlert,
} from "@/lib/platform/intelligence/watchers/index";
import type { JagPlatformSession } from "@/lib/jag-platform/session";

const ACADEMY_ORG = "org.the-academy-way";
const ORG_B = "org-b-pilot";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/jag-platform/server-session", () => ({
  getJagPlatformSession: vi.fn(),
}));

import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

const mockGetSession = vi.mocked(getJagPlatformSession);

function orgSession(
  organizationId: string,
  email = "admin@pilot.example"
): JagPlatformSession {
  return {
    userId: "u-org-b",
    email,
    displayName: "Pilot Admin",
    role: "ORG_OWNER",
    authority: "organization",
    organizationId,
    issuedAt: new Date().toISOString(),
  };
}

function provisioned(
  organizationId: string,
  email: string,
  name: string
): ProvisionedOrganization {
  return {
    organizationId,
    organizationName: name,
    industry: "education",
    country: "US",
    timeZone: "America/New_York",
    createdAt: new Date().toISOString(),
    founder: {
      userId: `user.${organizationId}`,
      firstName: "Pilot",
      lastName: "Admin",
      email,
      password: "x",
    },
    subscription: {
      planId: "pilot",
      planName: "Pilot",
      status: "pilot",
    },
    workspace: {
      workspaceId: `ws.${organizationId}`,
      name: `${name} Workspace`,
    },
    settings: {
      locale: "en-US",
      productAvailability: "academyos_only",
    },
  };
}

function seedHealthDecision(organizationId: string) {
  const analyzedAt = "2026-08-01T12:00:00.000Z";
  recordSchoolHealthResult({
    organizationId,
    result: {
      subjectId: organizationId,
      stance: "watch",
      healthScore: 0.6,
      evidence: [
        {
          source: "education.school_health",
          id: `ev-${organizationId}`,
          retrievedAt: analyzedAt,
          attributes: {
            code: "health_watch",
            summary: "Watch posture",
          },
        },
      ],
      recommendations: [
        {
          id: `rec-${organizationId}`,
          kind: "stabilize_organizational_health",
          title: "Stabilize Organizational Health",
          explanation: "Upstream risk",
          confidence: 0.9,
          priority: 1,
          evidenceIds: [`ev-${organizationId}`],
          suggestedActions: [
            {
              kind: "EscalateOrganizationalRisk",
              actionId: PROPOSAL_IDS.EscalateOrganizationalRisk,
              label: "Escalate Organizational Risk",
              priority: 1,
              rationale: "Propose escalating organizational health risk",
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
      confidence: 0.88,
      explanation: "Conditional school health",
      priority: 2,
      blockingIssues: [],
      warnings: ["ops"],
      suggestedActions: [],
      readiness: "conditional",
      analyzedAt,
    },
  });

  const session = orgSession(organizationId);
  const model = loadDecisionCenter(session, {});
  const card = model.decisions[0];
  expect(card).toBeTruthy();
  return card!;
}

function minimalBriefing(input: {
  id: string;
  organizationId: string;
  organizationName: string;
  decisionIds: readonly string[];
}): JagExecutiveBriefing {
  const now = "2026-08-01T15:00:00.000Z";
  return {
    id: input.id,
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    organizationIds: [input.organizationId],
    organizationNames: [input.organizationName],
    scope: "single",
    kind: "weekly_executive_review",
    kindLabel: "Weekly Executive Review",
    generatedAt: now,
    generatedBy: "test",
    window: {
      timeline: "this_week",
      start: "2026-07-25T00:00:00.000Z",
      end: now,
      label: "This week",
    },
    title: `${input.organizationName} briefing`,
    overallConfidence: 0.7,
    sourceCount: 1,
    sections: [
      {
        id: "recommended_executive_actions",
        title: "Actions",
        narrative: "Test",
        bullets: [],
        confidence: 0.7,
        evidenceReferences: [],
        contributorSources: [],
        policyReferences: [],
        recommendations: input.decisionIds.map((decisionId, i) => ({
          id: `rec-${i}`,
          title: "Act",
          rationale: "test",
          decisionId,
          decisionHref: `/jag/decisions/${decisionId}`,
          explainability: {
            evidence: [],
            contributors: [],
            policies: [],
            confidence: 0.7,
            dependencies: [],
            timeline: [],
          },
        })),
        decisionIds: [...input.decisionIds],
        availableActions: ["approve_decision"],
      },
    ],
    insights: [],
    recommendations: [],
    notes: [],
    scheduledReview: null,
    shareToken: null,
    hasSubstance: true,
  };
}

describe("FIX 1 — approveBriefingDecision IDOR", () => {
  beforeEach(() => {
    resetJagBusinessStoreForTests();
    resetBriefingStoreForTests();
    resetJagIntelligenceStoreForTests();
    resetDecisionStatusStoreForTests();
    resetDecisionExecutionStoreForTests();
    resetDecisionCatalogCacheForTests();
    saveProvisionedOrganization(
      provisioned(ORG_B, "admin@pilot.example", "Pilot B")
    );
    mockGetSession.mockReset();
  });

  afterEach(() => {
    mockGetSession.mockReset();
  });

  it("1/2/3. Org B cannot approve Academy decision via Org B briefing; status unchanged", async () => {
    // Seed Academy decision (visible only to platform / Academy session)
    saveProvisionedOrganization(
      provisioned(ACADEMY_ORG, "founder@academy.example", "The Academy Way")
    );
    const academySession = orgSession(ACADEMY_ORG, "founder@academy.example");
    // Temporarily use platform seed path: record under academy org and load as that org
    recordSchoolHealthResult({
      organizationId: ACADEMY_ORG,
      result: {
        subjectId: ACADEMY_ORG,
        stance: "watch",
        healthScore: 0.5,
        evidence: [
          {
            source: "education.school_health",
            id: "ev-academy",
            retrievedAt: "2026-08-01T12:00:00.000Z",
            attributes: { code: "health_watch", summary: "Academy watch" },
          },
        ],
        recommendations: [
          {
            id: "rec-academy",
            kind: "stabilize_organizational_health",
            title: "Stabilize",
            explanation: "x",
            confidence: 0.9,
            priority: 1,
            evidenceIds: ["ev-academy"],
            suggestedActions: [
              {
                kind: "EscalateOrganizationalRisk",
                actionId: PROPOSAL_IDS.EscalateOrganizationalRisk,
                label: "Escalate",
                priority: 1,
                rationale: "r",
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
        confidence: 0.8,
        explanation: "x",
        priority: 2,
        blockingIssues: [],
        warnings: [],
        suggestedActions: [],
        readiness: "conditional",
        analyzedAt: "2026-08-01T12:00:00.000Z",
      },
    });
    const academyDecision = loadDecisionCenter(academySession, {}).decisions[0];
    expect(academyDecision).toBeTruthy();
    const academyDecisionId = academyDecision!.id;
    expect(getDecisionStatus(academyDecisionId)).toBe("New");

    // Org B briefing that even references the Academy decision id (hostile payload)
    const orgBBriefing = minimalBriefing({
      id: "brief-org-b",
      organizationId: ORG_B,
      organizationName: "Pilot B",
      decisionIds: [academyDecisionId],
    });
    saveBriefing(orgBBriefing);

    const sessionB = orgSession(ORG_B);
    mockGetSession.mockResolvedValue(sessionB);

    const result = await approveBriefingDecision({
      briefingId: orgBBriefing.id,
      decisionId: academyDecisionId,
    });

    expect(result.ok).toBe(false);
    expect(getDecisionStatus(academyDecisionId)).toBe("New");
  });

  it("2. Spoofed organizationId does not authorize Academy decision mutation", async () => {
    saveProvisionedOrganization(
      provisioned(ACADEMY_ORG, "founder@academy.example", "The Academy Way")
    );
    const academySession = orgSession(ACADEMY_ORG, "founder@academy.example");
    recordSchoolHealthResult({
      organizationId: ACADEMY_ORG,
      result: {
        subjectId: ACADEMY_ORG,
        stance: "watch",
        healthScore: 0.5,
        evidence: [
          {
            source: "education.school_health",
            id: "ev-a2",
            retrievedAt: "2026-08-01T12:00:00.000Z",
            attributes: { code: "health_watch", summary: "Academy" },
          },
        ],
        recommendations: [
          {
            id: "rec-a2",
            kind: "stabilize_organizational_health",
            title: "Stabilize",
            explanation: "x",
            confidence: 0.9,
            priority: 1,
            evidenceIds: ["ev-a2"],
            suggestedActions: [
              {
                kind: "EscalateOrganizationalRisk",
                actionId: PROPOSAL_IDS.EscalateOrganizationalRisk,
                label: "Escalate",
                priority: 1,
                rationale: "r",
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
        confidence: 0.8,
        explanation: "x",
        priority: 2,
        blockingIssues: [],
        warnings: [],
        suggestedActions: [],
        readiness: "conditional",
        analyzedAt: "2026-08-01T12:00:00.000Z",
      },
    });
    const academyDecisionId =
      loadDecisionCenter(academySession, {}).decisions[0]!.id;

    const sessionB = orgSession(ORG_B);
    mockGetSession.mockResolvedValue(sessionB);

    const result = await updateDecisionCenterStatus({
      decisionId: academyDecisionId,
      status: "Approved",
      organizationId: ORG_B, // spoof
    });

    expect(result.ok).toBe(false);
    expect(getDecisionStatus(academyDecisionId)).toBe("New");
  });

  it("4. Same-org briefing decision approval succeeds", async () => {
    const decision = seedHealthDecision(ORG_B);
    const briefing = minimalBriefing({
      id: "brief-same",
      organizationId: ORG_B,
      organizationName: "Pilot B",
      decisionIds: [decision.id],
    });
    saveBriefing(briefing);

    mockGetSession.mockResolvedValue(orgSession(ORG_B));
    const result = await approveBriefingDecision({
      briefingId: briefing.id,
      decisionId: decision.id,
    });

    expect(result).toEqual({ ok: true });
    expect(getDecisionStatus(decision.id)).toBe("Approved");
  });
});

describe("FIX 2 — search catalog + grounding tenant leak", () => {
  beforeEach(() => {
    resetJagBusinessStoreForTests();
    resetBriefingStoreForTests();
    saveProvisionedOrganization(
      provisioned(ORG_B, "admin@pilot.example", "Pilot B")
    );
  });

  it("5/6. Org B search catalog and chat grounding exclude Academy briefing", () => {
    saveBriefing(
      minimalBriefing({
        id: "brief-academy",
        organizationId: ACADEMY_ORG,
        organizationName: "The Academy Way",
        decisionIds: [],
      })
    );
    saveBriefing(
      minimalBriefing({
        id: "brief-b",
        organizationId: ORG_B,
        organizationName: "Pilot B",
        decisionIds: [],
      })
    );

    const sessionB = orgSession(ORG_B);
    const catalog = loadJagSearchCatalog(sessionB);
    const briefingItems = catalog.filter((i) => i.kind === "briefing");
    expect(briefingItems.some((i) => i.id === "briefing:brief-academy")).toBe(
      false
    );
    expect(briefingItems.some((i) => i.id === "briefing:brief-b")).toBe(true);

    const grounding = gatherConversationContext(sessionB, ORG_B);
    expect(
      grounding.searchCatalog.some((i) => i.id === "briefing:brief-academy")
    ).toBe(false);
    expect(
      grounding.briefingTitles.some((b) => b.id === "brief-academy")
    ).toBe(false);
  });
});

describe("conversation + briefing mutation ACL", () => {
  beforeEach(() => {
    resetJagBusinessStoreForTests();
    resetJagConversationStoreForTests();
    resetBriefingStoreForTests();
    saveProvisionedOrganization(
      provisioned(ORG_B, "admin@pilot.example", "Pilot B")
    );
    mockGetSession.mockReset();
  });

  it("7. Foreign conversation mutation is denied", async () => {
    const foreign = createConversation({
      organizationId: ACADEMY_ORG,
      organizationName: "The Academy Way",
      title: "Academy chat",
    });
    mockGetSession.mockResolvedValue(orgSession(ORG_B));
    const result = await jagRenameConversationAction({
      id: foreign.id,
      title: "Hijacked",
    });
    expect(result).toEqual({ error: "Not found" });
    expect(getAccessibleConversation(orgSession(ORG_B), foreign.id)).toBeNull();
  });

  it("8. Foreign conversation cannot enter Org B AI context", () => {
    const foreign = createConversation({
      organizationId: ACADEMY_ORG,
      organizationName: "The Academy Way",
      title: "Academy secret",
    });
    saveConversation({
      ...foreign,
      turns: [
        {
          id: "t1",
          role: "executive",
          content: "SECRET_ACADEMY_TURN",
          at: new Date().toISOString(),
        },
      ],
    });

    const sessionB = orgSession(ORG_B);
    const workspace = loadConversationWorkspace(sessionB, {
      conversationId: foreign.id,
    });
    expect(workspace.active).toBeNull();

    const asked = askExecutiveConversation({
      session: sessionB,
      conversationId: foreign.id,
      organizationId: ORG_B,
      question: "What should I prioritize?",
    });
    expect(asked.conversation.id).not.toBe(foreign.id);
    expect(asked.conversation.organizationId).toBe(ORG_B);
    const hay = asked.conversation.turns.map((t) => t.content).join(" ");
    expect(hay).not.toContain("SECRET_ACADEMY_TURN");
  });

  it("9/10. Foreign briefing mutation and share-link creation denied", async () => {
    const academyBriefing = minimalBriefing({
      id: "brief-foreign",
      organizationId: ACADEMY_ORG,
      organizationName: "The Academy Way",
      decisionIds: [],
    });
    saveBriefing(academyBriefing);
    mockGetSession.mockResolvedValue(orgSession(ORG_B));

    const note = await addExecutiveBriefingNote({
      briefingId: academyBriefing.id,
      text: "cross-tenant note",
    });
    expect(note.ok).toBe(false);

    const share = await createBriefingShareLink({
      briefingId: academyBriefing.id,
    });
    expect(share.ok).toBe(false);
    expect(share).not.toHaveProperty("token");
  });
});

describe("projected decision id stability", () => {
  it("projectDecisionId remains deterministic for fixtures", () => {
    const a = projectDecisionId({
      organizationId: ORG_B,
      executionId: "exec-1",
      actionId: PROPOSAL_IDS.EscalateOrganizationalRisk,
    });
    const b = projectDecisionId({
      organizationId: ORG_B,
      executionId: "exec-1",
      actionId: PROPOSAL_IDS.EscalateOrganizationalRisk,
    });
    expect(a).toBe(b);
  });
});

function minimalAlert(input: {
  id: string;
  organizationId: string;
  organizationName: string;
  title: string;
}): WatcherAlert {
  const at = new Date().toISOString();
  return {
    id: input.id,
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    watcherId: "watcher.test",
    type: "strategic_risk",
    title: input.title,
    summary: `${input.title} summary`,
    severity: "high",
    confidence: 0.8,
    evidence: [],
    primaryDrivers: ["test"],
    supportingContributors: [],
    recommendedExecutiveAction: "Review",
    relatedDecisionIds: [],
    relatedGoalIds: [],
    relatedMemoryIds: [],
    explanation: {
      evidence: [],
      policies: [],
      forecasts: [],
      scenarios: [],
      memory: [],
      contributors: [],
      timeline: [{ at: at.slice(0, 10), message: input.title }],
    },
    status: "open",
    fingerprint: `fp:${input.id}`,
    createdAt: at,
    updatedAt: at,
    advisoryNotice: "advisory",
  };
}

describe("FIX 3 — notification tenant isolation", () => {
  beforeEach(() => {
    resetJagNotificationStoreForTests();
    mockGetSession.mockReset();
  });

  it("1/2. Org B list and unread count exclude Academy notification", () => {
    const academy = pushJagNotification({
      kind: "brief_ready",
      title: "ACADEMY_SECRET_NOTE",
      body: "Academy only",
      organizationId: ACADEMY_ORG,
    });
    const own = pushJagNotification({
      kind: "decision_assigned",
      title: "Pilot B note",
      body: "Org B only",
      organizationId: ORG_B,
    });

    const sessionB = orgSession(ORG_B);
    const listed = listJagNotifications(sessionB, 20);
    expect(listed.some((n) => n.id === academy.id)).toBe(false);
    expect(listed.some((n) => n.title === "ACADEMY_SECRET_NOTE")).toBe(false);
    expect(listed.some((n) => n.id === own.id)).toBe(true);
    expect(countUnreadJagNotifications(sessionB)).toBe(1);
  });

  it("3/4. Org B cannot mark Academy notification read; remains unread", async () => {
    const academy = pushJagNotification({
      kind: "brief_ready",
      title: "Academy unread",
      body: "secret",
      organizationId: ACADEMY_ORG,
    });
    mockGetSession.mockResolvedValue(orgSession(ORG_B));

    const result = await markNotificationReadAction(academy.id);
    expect(result.ok).toBe(false);
    expect(getJagNotification(academy.id)?.read).toBe(false);
  });

  it("5. Legitimate Org B notification mark-read succeeds", async () => {
    const own = pushJagNotification({
      kind: "decision_assigned",
      title: "Pilot B unread",
      body: "mine",
      organizationId: ORG_B,
    });
    mockGetSession.mockResolvedValue(orgSession(ORG_B));

    const result = await markNotificationReadAction(own.id);
    expect(result).toEqual({ ok: true });
    expect(getJagNotification(own.id)?.read).toBe(true);
  });
});

describe("FIX 4 — inbox alertId WatcherService IDOR", () => {
  beforeEach(() => {
    resetJagBusinessStoreForTests();
    resetWatcherServiceForTests();
    saveProvisionedOrganization(
      provisioned(ORG_B, "admin@pilot.example", "Pilot B")
    );
  });

  it("6/7/8. Org B cannot retrieve Academy alert; spoofed org does not authorize", () => {
    const academyAlert = minimalAlert({
      id: "alert-academy-secret",
      organizationId: ACADEMY_ORG,
      organizationName: "The Academy Way",
      title: "ACADEMY_ALERT_SECRET",
    });
    const orgBAlert = minimalAlert({
      id: "alert-org-b",
      organizationId: ORG_B,
      organizationName: "Pilot B",
      title: "Pilot B alert",
    });
    seedWatcherAlertForTests(academyAlert);
    seedWatcherAlertForTests(orgBAlert);

    const sessionB = orgSession(ORG_B);
    expect(getAccessibleWatcherAlert(sessionB, academyAlert.id)).toBeNull();

    const inbox = loadExecutiveInbox(sessionB, {
      organizationId: ORG_B, // spoof / preferred — not authorization
      alertId: academyAlert.id,
    });
    expect(inbox.selected).toBeNull();
    expect(inbox.selected?.title).not.toBe("ACADEMY_ALERT_SECRET");
    expect(
      inbox.alerts.some((a) => a.id === academyAlert.id || a.title === "ACADEMY_ALERT_SECRET")
    ).toBe(false);
  });

  it("9. Academy alert titles cannot enter Org B AI grounding catalog path", () => {
    seedWatcherAlertForTests(
      minimalAlert({
        id: "alert-academy-ground",
        organizationId: ACADEMY_ORG,
        organizationName: "The Academy Way",
        title: "ACADEMY_ALERT_GROUND",
      })
    );
    const sessionB = orgSession(ORG_B);
    const grounding = gatherConversationContext(sessionB, ORG_B);
    const hay = JSON.stringify(grounding);
    expect(hay).not.toContain("ACADEMY_ALERT_GROUND");
    expect(hay).not.toContain("alert-academy-ground");
  });

  it("10. Legitimate same-org alert retrieval succeeds", () => {
    const orgBAlert = minimalAlert({
      id: "alert-org-b-ok",
      organizationId: ORG_B,
      organizationName: "Pilot B",
      title: "Pilot B alert ok",
    });
    seedWatcherAlertForTests(orgBAlert);

    const sessionB = orgSession(ORG_B);
    expect(getAccessibleWatcherAlert(sessionB, orgBAlert.id)?.id).toBe(
      orgBAlert.id
    );

    const inbox = loadExecutiveInbox(sessionB, {
      organizationId: ORG_B,
      alertId: orgBAlert.id,
    });
    expect(inbox.selected?.id).toBe(orgBAlert.id);
    expect(inbox.selected?.organizationId).toBe(ORG_B);
  });
});
