import { describe, expect, it, vi, beforeEach } from "vitest";
import { createMockSupabase, TEST_UUIDS } from "../../helpers/mock-supabase";
import type { IdentityContext } from "@/lib/platform/identity/context";

vi.mock("@/lib/platform/shared/context", () => ({
  resolveActorUserId: vi.fn(async () => TEST_UUIDS.user),
  resolveSchoolContext: vi.fn(async () => ({
    organizationId: TEST_UUIDS.organization,
    schoolId: TEST_UUIDS.school,
  })),
}));

vi.mock("@/lib/platform/activity", () => ({
  recordActivity: vi.fn(async () => ({ id: TEST_UUIDS.activity })),
}));

import { recordActivity } from "@/lib/platform/activity";
import {
  canDecideFounderIntelligence,
  canManageFounderIntelligence,
  canViewFounderIntelligence,
} from "@/lib/founder-intelligence/access";
import { scoreAllDomains, scoreOverallHealth, scoreDomainHealth } from "@/lib/founder-intelligence/health";
import { detectRisks } from "@/lib/founder-intelligence/risks";
import { detectOpportunities } from "@/lib/founder-intelligence/opportunities";
import { generatePredictions } from "@/lib/founder-intelligence/predictions";
import { generateRecommendations } from "@/lib/founder-intelligence/recommendations";
import { analyzeCrossDomain } from "@/lib/founder-intelligence/correlations";
import { buildExecutiveBrief, buildTodaysPriorities } from "@/lib/founder-intelligence/brief";
import { buildExecutiveTimeline } from "@/lib/founder-intelligence/timeline";
import { applyDecisionAction, createDecisionFromRecommendation } from "@/lib/founder-intelligence/decisions";
import { domainForEvent, type EiEventSignal } from "@/lib/founder-intelligence/events";
import { ACTIVITY_EVENT_CATALOG } from "@/lib/platform/activity/catalog";
import { WORKFLOW_ACTION_LIBRARY } from "@/lib/workflows/actions";
import { WORKFLOW_TRIGGER_LIBRARY } from "@/lib/workflows/triggers";

function identityWithRoles(roles: string[], permissions: string[] = []): IdentityContext {
  return {
    id: TEST_UUIDS.user,
    email: "test@example.com",
    fullName: "Test User",
    roles: roles as IdentityContext["roles"],
    primaryRole: roles[0] as IdentityContext["primaryRole"],
    roleLabel: roles[0] ?? "User",
    effectiveUserId: TEST_UUIDS.user,
    permissions: permissions as IdentityContext["permissions"],
    orgAssignments: [],
    accessibleSchoolIds: [TEST_UUIDS.school],
    hasUnrestrictedSchoolAccess: roles.includes("FOUNDER"),
    isFounder: roles.includes("FOUNDER") || permissions.includes("JAG_ACCESS"),
    isEnterpriseAdmin: false,
    impersonation: null,
    preferences: null,
  };
}

function signal(
  partial: Partial<EiEventSignal> & Pick<EiEventSignal, "eventType" | "moduleKey">
): EiEventSignal {
  return {
    id: partial.id ?? `evt-${Math.random().toString(36).slice(2, 8)}`,
    eventType: partial.eventType,
    moduleKey: partial.moduleKey,
    title: partial.title ?? partial.eventType,
    summary: partial.summary ?? null,
    occurredAt: partial.occurredAt ?? new Date().toISOString(),
    entityType: partial.entityType ?? null,
    entityId: partial.entityId ?? null,
    classification: partial.classification ?? null,
    payload: partial.payload ?? null,
  };
}

const SAMPLE_SIGNALS: EiEventSignal[] = [
  signal({ eventType: "invoice.overdue", moduleKey: "finance", title: "Invoice overdue" }),
  signal({ eventType: "payment.failed", moduleKey: "finance", title: "Payment failed" }),
  signal({ eventType: "employee.certification.expiring", moduleKey: "hr", title: "CPR expiring" }),
  signal({ eventType: "workflow.failed", moduleKey: "workflows", title: "Workflow failed" }),
  signal({ eventType: "employee.terminated", moduleKey: "hr", title: "Employee terminated" }),
  signal({ eventType: "employee.terminated", moduleKey: "hr", title: "Employee terminated 2" }),
  signal({ eventType: "employee.hired", moduleKey: "hr", title: "Hired" }),
  signal({ eventType: "lead.created", moduleKey: "admissions", title: "Lead" }),
  signal({ eventType: "lead.created", moduleKey: "admissions", title: "Lead 2" }),
  signal({ eventType: "lead.created", moduleKey: "admissions", title: "Lead 3" }),
  signal({ eventType: "enrollment.accepted", moduleKey: "admissions", title: "Accepted" }),
  signal({ eventType: "payment.received", moduleKey: "finance", title: "Paid" }),
  signal({ eventType: "student.created", moduleKey: "sis", title: "Student" }),
  signal({ eventType: "attendance.threshold_reached", moduleKey: "sis", title: "Attendance" }),
  signal({ eventType: "attendance.threshold_reached", moduleKey: "sis", title: "Attendance 2" }),
  signal({ eventType: "family.updated", moduleKey: "sis", title: "Family" }),
  signal({ eventType: "document.created", moduleKey: "documents", title: "Doc" }),
  signal({ eventType: "communication.failed", moduleKey: "communications", title: "Bounce" }),
  signal({ eventType: "communication.failed", moduleKey: "communications", title: "Bounce 2" }),
  signal({ eventType: "communication.failed", moduleKey: "communications", title: "Bounce 3" }),
];

describe("founder permissions", () => {
  it("allows Founder full access; teachers none; CEO configurable", () => {
    expect(canManageFounderIntelligence(identityWithRoles(["FOUNDER"]))).toBe(true);
    expect(canManageFounderIntelligence(identityWithRoles([], ["JAG_ACCESS"]))).toBe(true);
    expect(canDecideFounderIntelligence(identityWithRoles(["FOUNDER"]))).toBe(true);

    expect(canViewFounderIntelligence(identityWithRoles(["TEACHER"]))).toBe(false);
    expect(canDecideFounderIntelligence(identityWithRoles(["TEACHER"]))).toBe(false);

    expect(
      canViewFounderIntelligence(
        identityWithRoles(["CEO"], ["executive.intelligence"])
      )
    ).toBe(true);
    expect(
      canDecideFounderIntelligence(
        identityWithRoles(["CEO"], ["executive.intelligence"])
      )
    ).toBe(false);

    expect(
      canViewFounderIntelligence(identityWithRoles(["TEACHER"], ["founder.view"]))
    ).toBe(true);
  });
});

describe("health scoring", () => {
  it("scores domains 0–100 with trend and confidence", () => {
    const domains = scoreAllDomains(SAMPLE_SIGNALS);
    expect(domains.length).toBeGreaterThan(5);
    for (const d of domains) {
      expect(d.score).toBeGreaterThanOrEqual(0);
      expect(d.score).toBeLessThanOrEqual(100);
      expect(d.confidence).toBeGreaterThan(0);
      expect(d.factors.length).toBeGreaterThan(0);
    }
    const overall = scoreOverallHealth(domains, SAMPLE_SIGNALS);
    expect(overall.domain).toBe("organization");
    expect(overall.score).toBeGreaterThanOrEqual(0);

    const empty = scoreDomainHealth("calendar", []);
    expect(empty.confidence).toBeLessThan(0.5);
  });
});

describe("risk detection", () => {
  it("detects cash flow, certs, workflows, staffing, attendance", () => {
    const risks = detectRisks(SAMPLE_SIGNALS);
    const ids = risks.map((r) => r.id);
    expect(ids.some((id) => id.includes("cash"))).toBe(true);
    expect(ids.some((id) => id.includes("cert"))).toBe(true);
    expect(ids.some((id) => id.includes("workflow"))).toBe(true);
    expect(risks.every((r) => r.explainability.why.length > 0)).toBe(true);
    expect(risks.every((r) => r.probability > 0 && r.impact > 0)).toBe(true);
  });
});

describe("recommendations + explainability", () => {
  it("builds explainable recommendations from risks/opportunities", () => {
    const risks = detectRisks(SAMPLE_SIGNALS);
    const opps = detectOpportunities(SAMPLE_SIGNALS);
    const preds = generatePredictions(SAMPLE_SIGNALS);
    const recs = generateRecommendations(risks, opps, preds);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0].explainability.why).toBeTruthy();
    expect(recs[0].explainability.confidence).toBeGreaterThan(0);
    expect(recs[0].suggestedActions.length).toBeGreaterThan(0);
  });
});

describe("predictions", () => {
  it("returns confidence intervals and factors", () => {
    const preds = generatePredictions(SAMPLE_SIGNALS);
    expect(preds.some((p) => p.id === "pred-enrollment")).toBe(true);
    expect(preds.some((p) => p.id === "pred-revenue")).toBe(true);
    for (const p of preds) {
      expect(p.low).toBeLessThanOrEqual(p.mid);
      expect(p.mid).toBeLessThanOrEqual(p.high);
      expect(p.factors.length).toBeGreaterThan(0);
    }
  });
});

describe("cross-domain + brief + timeline", () => {
  it("correlates domains and builds brief/timeline", () => {
    const correlations = analyzeCrossDomain(SAMPLE_SIGNALS);
    expect(correlations.length).toBeGreaterThan(0);
    expect(correlations[0].domains.length).toBeGreaterThanOrEqual(2);

    const risks = detectRisks(SAMPLE_SIGNALS);
    const opps = detectOpportunities(SAMPLE_SIGNALS);
    const domains = scoreAllDomains(SAMPLE_SIGNALS);
    const overall = scoreOverallHealth(domains, SAMPLE_SIGNALS);
    const brief = buildExecutiveBrief(SAMPLE_SIGNALS, risks, opps, overall);
    expect(brief.length).toBeGreaterThan(0);
    expect(brief[0].priority).toBeGreaterThanOrEqual(brief[brief.length - 1]?.priority ?? 0);

    const priorities = buildTodaysPriorities(brief);
    expect(priorities.length).toBeGreaterThan(0);

    const timeline = buildExecutiveTimeline(SAMPLE_SIGNALS, [], []);
    expect(timeline.length).toBeGreaterThan(0);
    expect(timeline[0].source).toBe("ei");
  });
});

describe("decision lifecycle", () => {
  beforeEach(() => {
    vi.mocked(recordActivity).mockClear();
  });

  it("creates and approves decisions with EI audit events", async () => {
    const supabase = createMockSupabase((ctx) => {
      if (ctx.table === "founder_decisions") {
        const payload = (ctx.payload ?? {}) as Record<string, unknown>;
        return {
          data: {
            id: "dec-1",
            audit_id: "audit-d",
            organization_id: TEST_UUIDS.organization,
            school_id: TEST_UUIDS.school,
            title: "Escalate overdue invoices",
            description: "Cash flow risk",
            status: payload.status ?? "pending",
            priority: 80,
            impact: "high",
            confidence: 0.8,
            related_entities: [],
            suggested_actions: ["Escalate"],
            history: payload.history ?? [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        };
      }
      if (ctx.table === "platform_communications") {
        return { data: { id: "comm" }, error: null };
      }
      return { data: { id: "x" }, error: null };
    });

    const created = await createDecisionFromRecommendation(supabase, {
      organizationId: TEST_UUIDS.organization,
      recommendation: {
        id: "rec-1",
        title: "Escalate overdue invoices",
        summary: "Cash flow risk",
        domain: "finance",
        priority: 80,
        impact: "high",
        confidence: 0.8,
        relatedEntities: [],
        suggestedActions: ["Escalate"],
        explainability: {
          why: "test",
          evidence: [],
          relatedEventIds: [],
          confidence: 0.8,
          lastUpdated: new Date().toISOString(),
        },
      },
    });
    expect(created.ok).toBe(true);

    const approved = await applyDecisionAction(supabase, {
      decisionId: "dec-1",
      action: "approve",
      triggerWorkflow: true,
    });
    expect(approved.ok).toBe(true);
    if (approved.ok) expect(approved.decision.status).toBe("approved");
    expect(recordActivity).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ eventType: "founder.decision.approved" })
    );
  });
});

describe("event mapping + workflow + EI wiring", () => {
  it("maps activity events to founder domains", () => {
    expect(domainForEvent("invoice.paid", "finance")).toBe("finance");
    expect(domainForEvent("employee.hired", "hr")).toBe("human_capital");
    expect(domainForEvent("document.created", "documents")).toBe("documents");
  });

  it("registers founder EI events", () => {
    for (const key of [
      "founder.insight.created",
      "founder.recommendation.created",
      "founder.decision.approved",
      "founder.decision.dismissed",
      "founder.decision.delegated",
      "founder.decision.scheduled",
      "founder.decision.resolved",
      "founder.brief.generated",
      "founder.health.scored",
    ]) {
      expect(ACTIVITY_EVENT_CATALOG[key]).toBeTruthy();
    }
  });

  it("exposes founder workflow actions and triggers", () => {
    const types = WORKFLOW_ACTION_LIBRARY.map((a) => a.type);
    expect(types).toContain("open_founder_investigation");
    expect(types).toContain("schedule_founder_review");
    expect(types).toContain("generate_founder_report");

    const events = new Set(
      WORKFLOW_TRIGGER_LIBRARY.flatMap((t) => t.activityEventTypes ?? [])
    );
    expect(events.has("founder.decision.approved")).toBe(true);
    expect(events.has("founder.brief.generated")).toBe(true);
  });
});
