import { describe, expect, it, beforeEach } from "vitest";
import { SCHOOL_HEALTH_ACTION_PROPOSAL_IDS as PROPOSAL_IDS } from "@/lib/domains/education";
import {
  enableBriefingShare,
  getBriefingByShareToken,
  getBriefingDetail,
  listBriefings,
  loadBriefingList,
  recordExecutiveBriefResult,
  recordSchoolHealthResult,
  resetBriefingStoreForTests,
  resetDecisionCatalogCacheForTests,
  resetDecisionExecutionStoreForTests,
  resetDecisionStatusStoreForTests,
  resetJagIntelligenceStoreForTests,
  resolveBriefingWindow,
  synthesizeExecutiveBriefing,
  saveBriefing,
} from "@/lib/jag-command-center";
import type { JagPlatformSession } from "@/lib/jag-platform/session";

const session: JagPlatformSession = {
  userId: "jag-user-founder",
  email: "founder@jag.platform",
  displayName: "JAG Founder",
  role: "FOUNDER",
  issuedAt: "2026-01-01T00:00:00.000Z",
};

describe("Executive Briefing Engine (JAG-005)", () => {
  beforeEach(() => {
    resetJagIntelligenceStoreForTests();
    resetDecisionStatusStoreForTests();
    resetDecisionExecutionStoreForTests();
    resetDecisionCatalogCacheForTests();
    resetBriefingStoreForTests();
  });

  it("resolves preset and custom timelines", () => {
    const week = resolveBriefingWindow({ timeline: "this_week" });
    expect("error" in week).toBe(false);
    if (!("error" in week)) {
      expect(week.label).toBe("This Week");
    }

    const bad = resolveBriefingWindow({ timeline: "custom" });
    expect("error" in bad).toBe(true);

    const custom = resolveBriefingWindow({
      timeline: "custom",
      customStart: "2026-01-01",
      customEnd: "2026-01-31",
    });
    expect("error" in custom).toBe(false);
  });

  it("returns structured briefing with executive questions when unbound", () => {
    const orgId =
      loadBriefingList(session).selectedOrganizationId ?? "org-brief";
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

    expect(result.sections.length).toBe(18);
    const ids = result.sections.map((s) => s.id);
    expect(ids).toContain("what_happened");
    expect(ids).toContain("forecast");
    expect(ids).toContain("scenario_analysis");
    expect(ids).toContain("historical_context");
    expect(ids).toContain("why_it_happened");
    expect(ids).toContain("decide_today");
    expect(ids).toContain("if_i_do_nothing");
    expect(ids).toContain("watch_next");
    expect(ids).toContain("executive_insights");
    // Morning brief prioritizes decide_today early
    expect(ids.indexOf("decide_today")).toBeLessThan(
      ids.indexOf("critical_risks")
    );

    for (const section of result.sections) {
      expect(section).toHaveProperty("evidenceReferences");
      expect(section).toHaveProperty("confidence");
      expect(section).toHaveProperty("contributorSources");
      expect(section).toHaveProperty("policyReferences");
      expect(section).toHaveProperty("recommendations");
      expect(section).toHaveProperty("availableActions");
    }
  });

  it("supports enterprise scope and share tokens", () => {
    const list = loadBriefingList(session);
    expect(list.scopes).toContain("enterprise");
    expect(list.kinds.length).toBeGreaterThanOrEqual(9);

    const result = synthesizeExecutiveBriefing({
      session,
      scope: "enterprise",
      kind: "risk_brief",
      timeline: "this_month",
      generatedBy: "tester",
    });
    expect("error" in result).toBe(false);
    if ("error" in result) return;

    expect(result.scope).toBe("enterprise");
    expect(result.organizationIds.length).toBeGreaterThanOrEqual(1);
    expect(result.kindLabel).toBe("Risk Brief");

    saveBriefing(result);
    const token = enableBriefingShare(result.id);
    expect(token).toBeTruthy();
    expect(getBriefingByShareToken(token!)?.id).toBe(result.id);
  });

  it("synthesizes evidence-backed sections and decision-linked recommendations", () => {
    const orgId =
      loadBriefingList(session).selectedOrganizationId ?? "org-brief-2";

    recordSchoolHealthResult({
      organizationId: orgId,
      result: {
        subjectId: orgId,
        stance: "watch",
        healthScore: 0.55,
        evidence: [
          {
            source: "education.school_health",
            id: "ev-brief",
            retrievedAt: "2026-07-29T12:00:00.000Z",
            attributes: {
              code: "health_watch",
              summary: "Elevated operational watch posture",
            },
          },
        ],
        recommendations: [
          {
            id: "rec-b",
            kind: "stabilize_organizational_health",
            title: "Stabilize Organizational Health",
            explanation: "Watch drivers",
            confidence: 0.9,
            priority: 1,
            evidenceIds: ["ev-brief"],
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
              laws: ["law.evidence"],
              rationale: "test",
            },
          },
        ],
        confidence: 0.87,
        explanation: "Conditional school health for briefing",
        priority: 2,
        blockingIssues: [],
        warnings: ["capacity pressure"],
        suggestedActions: [],
        readiness: "conditional",
        analyzedAt: new Date().toISOString(),
        attributes: { trend: "deteriorating" },
      },
    });

    recordExecutiveBriefResult({
      organizationId: orgId,
      result: {
        subjectId: orgId,
        stance: "cautionary",
        briefingConfidence: 0.8,
        evidence: [
          {
            source: "education.executive_briefing",
            id: "ev-sum",
            retrievedAt: new Date().toISOString(),
            attributes: {
              code: "executive_summary",
              summary: "Network posture requires focused leadership attention.",
            },
          },
          {
            source: "education.executive_briefing",
            id: "ev-risk",
            retrievedAt: new Date().toISOString(),
            attributes: {
              code: "critical_risks",
              summary: "Funding and staffing alignment risk",
            },
          },
          {
            source: "education.executive_briefing",
            id: "ev-pri",
            retrievedAt: new Date().toISOString(),
            attributes: {
              code: "strategic_priorities",
              summary: "Stabilize campus operations",
            },
          },
        ],
        recommendations: [
          {
            id: "rec-exec",
            kind: "publish_executive_brief",
            title: "Publish Executive Brief",
            explanation: "Share with board",
            confidence: 0.85,
            priority: 1,
            evidenceIds: [],
            suggestedActions: [],
            constitutionalTrace: {
              domainPackageId: "education",
              contributorId: "education.cognition.executive_briefing",
              laws: ["law.evidence"],
              rationale: "t",
            },
          },
        ],
        confidence: 0.8,
        explanation: "Cautionary executive synthesis",
        priority: 1,
        blockingIssues: [],
        warnings: [],
        suggestedActions: [],
        readiness: "conditional",
        analyzedAt: new Date().toISOString(),
      },
    });

    const result = synthesizeExecutiveBriefing({
      session,
      organizationId: orgId,
      scope: "single",
      kind: "weekly_executive_review",
      timeline: "this_week",
      generatedBy: "tester",
    });
    expect("error" in result).toBe(false);
    if ("error" in result) return;

    expect(result.hasSubstance).toBe(true);
    expect(result.overallConfidence).not.toBeNull();
    expect(result.insights.length).toBeGreaterThan(0);

    const summary = result.sections.find((s) => s.id === "executive_summary")!;
    expect(summary.emptyReason).toBeUndefined();
    expect(summary.contributorSources).toContain(
      "education.cognition.school_health"
    );

    const decide = result.sections.find((s) => s.id === "decide_today")!;
    expect(decide).toBeTruthy();

    const actions = result.sections.find(
      (s) => s.id === "recommended_executive_actions"
    )!;
    for (const rec of actions.recommendations) {
      expect(rec.explainability).toHaveProperty("evidence");
      expect(rec.explainability).toHaveProperty("contributors");
      expect(rec.explainability).toHaveProperty("policies");
      expect(rec.explainability).toHaveProperty("confidence");
      expect(rec.explainability).toHaveProperty("dependencies");
      expect(rec.explainability).toHaveProperty("timeline");
      if (rec.decisionId) {
        expect(rec.decisionHref).toBe(`/jag/decisions/${rec.decisionId}`);
      }
    }

    saveBriefing(result);
    expect(listBriefings({ organizationId: orgId }).length).toBe(1);
    expect(getBriefingDetail(session, result.id)?.kind).toBe(
      "weekly_executive_review"
    );
  });
});
