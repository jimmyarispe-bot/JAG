import { describe, expect, it, beforeEach } from "vitest";
import { SCHOOL_HEALTH_ACTION_PROPOSAL_IDS as PROPOSAL_IDS } from "@/lib/domains/education";
import {
  getDecisionCenterDetail,
  loadDecisionCenter,
  projectDecisionId,
  recordSchoolHealthResult,
  resetDecisionCatalogCacheForTests,
  resetDecisionExecutionStoreForTests,
  resetDecisionStatusStoreForTests,
  resetJagIntelligenceStoreForTests,
  setDecisionStatus,
} from "@/lib/jag-command-center";
import type { JagPlatformSession } from "@/lib/jag-platform/session";

const session: JagPlatformSession = {
  userId: "jag-user-founder",
  email: "founder@jag.platform",
  displayName: "JAG Founder",
  role: "FOUNDER",
  issuedAt: "2026-01-01T00:00:00.000Z",
};

describe("Decision Center (JAG-003)", () => {
  beforeEach(() => {
    resetJagIntelligenceStoreForTests();
    resetDecisionStatusStoreForTests();
    resetDecisionExecutionStoreForTests();
    resetDecisionCatalogCacheForTests();
  });

  it("returns an empty queue when no proposals are bound", () => {
    const model = loadDecisionCenter(session);
    expect(model.counts.total).toBe(0);
    expect(model.decisions).toEqual([]);
  });

  it("projects action proposals into decision cards without inventing extras", () => {
    const orgId = "org-decision-1";
    recordSchoolHealthResult({
      organizationId: orgId,
      result: {
        subjectId: orgId,
        stance: "watch",
        healthScore: 0.6,
        evidence: [
          {
            source: "education.school_health",
            id: "ev-1",
            retrievedAt: "2026-07-29T12:00:00.000Z",
            attributes: {
              code: "health_watch",
              summary: "Watch posture from upstream warnings",
            },
          },
        ],
        recommendations: [
          {
            id: "rec-1",
            kind: "stabilize_organizational_health",
            title: "Stabilize Organizational Health",
            explanation: "Upstream risk",
            confidence: 0.9,
            priority: 1,
            evidenceIds: ["ev-1"],
            suggestedActions: [
              {
                kind: "EscalateOrganizationalRisk",
                actionId: PROPOSAL_IDS.EscalateOrganizationalRisk,
                label: "Escalate Organizational Risk",
                priority: 1,
                rationale: "Propose escalating organizational health risk",
              },
              {
                kind: "ScheduleLeadershipReview",
                actionId: PROPOSAL_IDS.ScheduleLeadershipReview,
                label: "Schedule Leadership Review",
                priority: 2,
                rationale: "Propose executive health review",
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
        analyzedAt: "2026-07-29T12:00:00.000Z",
      },
    });

    // Founder session may not include org-decision-1 — bind via org names map
    // by also recording under a session org when present.
    const sessionModel = loadDecisionCenter(session);
    const orgFromSession = sessionModel.filterOptions.organizations[0]?.id;

    if (orgFromSession) {
      recordSchoolHealthResult({
        organizationId: orgFromSession,
        result: {
          subjectId: orgFromSession,
          evidence: [
            {
              source: "education.school_health",
              id: "ev-2",
              retrievedAt: "2026-07-29T12:00:00.000Z",
              attributes: {
                code: "health_watch",
                summary: "Watch posture",
              },
            },
          ],
          recommendations: [
            {
              id: "rec-2",
              kind: "publish_health_brief",
              title: "Publish School Health Brief",
              explanation: "x",
              confidence: 0.9,
              priority: 1,
              evidenceIds: [],
              suggestedActions: [
                {
                  kind: "PublishSchoolHealthBrief",
                  actionId: PROPOSAL_IDS.PublishSchoolHealthBrief,
                  label: "Publish School Health Brief",
                  priority: 1,
                  rationale: "Propose publishing school health brief",
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
          confidence: 0.9,
          explanation: "School health ready",
          priority: 2,
          blockingIssues: [],
          warnings: [],
          suggestedActions: [],
          readiness: "ready",
          analyzedAt: "2026-07-29T13:00:00.000Z",
        },
      });
    }

    const model = loadDecisionCenter(session);
    expect(model.counts.total).toBeGreaterThanOrEqual(1);
    expect(
      model.decisions.every((d) => d.actionId && d.contributorId)
    ).toBe(true);
    expect(model.decisions.every((d) => d.status === "New")).toBe(true);

    const first = model.decisions[0]!;
    expect(first.capabilityPackName.length).toBeGreaterThan(0);
    expect(first.domainName.toLowerCase()).toContain("education");

    const detail = getDecisionCenterDetail(session, first.id);
    expect(detail).not.toBeNull();
    expect(detail!.evidence.length).toBeGreaterThan(0);
    expect(detail!.observability.confidence).toBe(first.confidence);

    setDecisionStatus({
      decisionId: first.id,
      status: "Reviewing",
      actor: "tester",
    });
    const after = loadDecisionCenter(session);
    expect(after.decisions.find((d) => d.id === first.id)?.status).toBe(
      "Reviewing"
    );
  });

  it("builds stable decision ids from proposal identity", () => {
    const a = projectDecisionId({
      organizationId: "org-1",
      executionId: "exec-1",
      actionId: "education.school_health.publish_brief",
    });
    const b = projectDecisionId({
      organizationId: "org-1",
      executionId: "exec-1",
      actionId: "education.school_health.publish_brief",
    });
    expect(a).toBe(b);
  });

  it("filters by group and search", () => {
    const orgId =
      loadDecisionCenter(session).filterOptions.organizations[0]?.id ??
      "org-filter";
    recordSchoolHealthResult({
      organizationId: orgId,
      result: {
        subjectId: orgId,
        evidence: [
          {
            source: "education.school_health",
            id: "ev-s",
            retrievedAt: "2026-07-29T12:00:00.000Z",
            attributes: { code: "health_risks", summary: "funding gap signal" },
          },
        ],
        recommendations: [
          {
            id: "r",
            kind: "prioritize_health_actions",
            title: "Prioritize Health Actions",
            explanation: "x",
            confidence: 0.8,
            priority: 1,
            evidenceIds: [],
            suggestedActions: [
              {
                kind: "ScheduleLeadershipReview",
                actionId: PROPOSAL_IDS.ScheduleLeadershipReview,
                label: "Schedule Leadership Review",
                priority: 1,
                rationale: "Board review for network health",
              },
            ],
            constitutionalTrace: {
              domainPackageId: "education",
              contributorId: "education.cognition.school_health",
              laws: [],
              rationale: "t",
            },
          },
        ],
        confidence: 0.8,
        explanation: "x",
        priority: 1,
        blockingIssues: [],
        warnings: [],
        suggestedActions: [],
        readiness: "conditional",
        analyzedAt: "2026-07-29T14:00:00.000Z",
      },
    });

    const executive = loadDecisionCenter(session, { group: "executive" });
    expect(executive.decisions.every((d) => d.category === "executive")).toBe(
      true
    );

    const searched = loadDecisionCenter(session, { q: "funding gap" });
    expect(searched.decisions.length).toBeGreaterThan(0);
  });
});
