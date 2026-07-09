import { describe, expect, it } from "vitest";
import type { ExecutiveAlert } from "@/lib/platform/executive-alerts";
import {
  acknowledgeDecision,
  adaptExecutiveAlerts,
  adaptJagWorkDecisions,
  adaptKpiSnapshotDecisions,
  adaptMissionControlDecisions,
  adaptWorkflowApprovals,
  buildDecisionMergeKey,
  buildExecutiveDecisionQueue,
  collectDecisionDrafts,
  delegateDecision,
  mergeDecisionSources,
  scheduleFollowUp,
  scoreDecision,
  type ExecutiveDecisionDraft,
  type ExecutiveDecisionSourceBundle,
  type ExecutiveDecisionsScope,
} from "@/lib/platform/executive-decisions";
import type { JagWorkItem } from "@/lib/platform/jag-work/types";
import type { KpiSnapshotRecord } from "@/lib/platform/kpi-snapshots";

const scope: ExecutiveDecisionsScope = {
  networkId: null,
  regionId: "region-1",
  campusId: "campus-1",
  programId: null,
  program: null,
  organizationId: "org-1",
  schoolId: "school-1",
};

function draft(
  partial: Partial<ExecutiveDecisionDraft> &
    Pick<
      ExecutiveDecisionDraft,
      "signalKey" | "title" | "decisionType" | "severity" | "source"
    >
): ExecutiveDecisionDraft {
  return {
    summary: partial.summary ?? partial.title,
    confidence: partial.confidence ?? "High",
    organization: partial.organization ?? "org-1",
    region: partial.region ?? "region-1",
    campus: partial.campus ?? "school-1",
    program: partial.program ?? null,
    createdAt: partial.createdAt ?? "2026-07-09T12:00:00.000Z",
    ...partial,
  };
}

describe("scoreDecision", () => {
  it("scores Critical blocking financial higher than Low review", () => {
    const high = scoreDecision({
      severity: "Critical",
      decisionType: "Financial",
      confidence: "High",
      blocking: true,
      financialImpact: true,
      sourceCount: 3,
    });
    const low = scoreDecision({
      severity: "Low",
      decisionType: "Review",
      confidence: "Unknown",
    });
    expect(high).toBeGreaterThan(low);
    expect(high).toBeLessThanOrEqual(100);
    expect(low).toBeGreaterThanOrEqual(1);
  });

  it("boosts overdue due dates", () => {
    const overdue = scoreDecision({
      severity: "High",
      decisionType: "Approval",
      confidence: "High",
      dueDate: "2026-07-01T00:00:00.000Z",
      now: new Date("2026-07-09T00:00:00.000Z"),
    });
    const future = scoreDecision({
      severity: "High",
      decisionType: "Approval",
      confidence: "High",
      dueDate: "2026-07-20T00:00:00.000Z",
      now: new Date("2026-07-09T00:00:00.000Z"),
    });
    expect(overdue).toBeGreaterThan(future);
  });
});

describe("buildDecisionMergeKey", () => {
  it("prefers Mission Control identity when present", () => {
    const withMc = buildDecisionMergeKey({
      schoolId: "school-1",
      decisionType: "Financial",
      signalKey: "fi.cash",
      missionControlId: "mc-1",
    });
    const without = buildDecisionMergeKey({
      schoolId: "school-1",
      decisionType: "Financial",
      signalKey: "fi.cash",
    });
    expect(withMc.startsWith("ed_mc_")).toBe(true);
    expect(without.startsWith("ed_")).toBe(true);
    expect(withMc).not.toBe(without);
  });
});

describe("mergeDecisionSources", () => {
  it("merges alert + MC drafts that share Mission Control id into one decision", () => {
    const { decisions, rawDraftCount, mergedAway } = mergeDecisionSources([
      draft({
        signalKey: "fi.below_breakeven",
        title: "Program below break-even",
        decisionType: "Financial",
        severity: "High",
        relatedMissionControlItem: "mc-1",
        relatedAlerts: ["alert-1"],
        financialImpact: true,
        source: { source: "executive_alerts", sourceId: "alert-1" },
      }),
      draft({
        signalKey: "mc.fi_financial_alerts",
        title: "Program below break-even (MC)",
        decisionType: "Financial",
        severity: "Critical",
        relatedMissionControlItem: "mc-1",
        relatedJagWorkItem: "jag-9",
        source: { source: "mission_control", sourceId: "mc-1" },
      }),
    ]);

    expect(rawDraftCount).toBe(2);
    expect(mergedAway).toBe(1);
    expect(decisions).toHaveLength(1);
    expect(decisions[0].relatedMissionControlItem).toBe("mc-1");
    expect(decisions[0].relatedJagWorkItem).toBe("jag-9");
    expect(decisions[0].relatedAlerts).toContain("alert-1");
    expect(decisions[0].severity).toBe("Critical");
    expect(decisions[0].sources.length).toBe(2);
  });

  it("merges workflow + jag work via shared workflow instance", () => {
    const { decisions } = mergeDecisionSources([
      draft({
        signalKey: "workflow.approve_hire",
        title: "Approve hire",
        decisionType: "Approval",
        severity: "High",
        relatedWorkflow: "wf-1",
        blocking: true,
        source: { source: "workflow", sourceId: "appr-1" },
      }),
      draft({
        signalKey: "jag.hr_application",
        title: "Hire decision",
        decisionType: "Staffing",
        severity: "High",
        relatedWorkflow: "wf-1",
        relatedJagWorkItem: "jag-hr-1",
        source: { source: "jag_work", sourceId: "jag-hr-1" },
      }),
    ]);

    expect(decisions).toHaveLength(1);
    expect(decisions[0].relatedWorkflow).toBe("wf-1");
    expect(decisions[0].relatedJagWorkItem).toBe("jag-hr-1");
    expect(decisions[0].decisionType).toBe("Staffing");
  });

  it("does not duplicate identical signal drafts without links", () => {
    const { decisions } = mergeDecisionSources([
      draft({
        signalKey: "kpi.finance.collection_rate",
        title: "Collection decision",
        decisionType: "Financial",
        severity: "High",
        source: { source: "kpi_snapshots", sourceId: "kpi-1" },
      }),
      draft({
        signalKey: "kpi.finance.collection_rate",
        title: "Collection decision (alert)",
        decisionType: "Financial",
        severity: "Critical",
        source: { source: "executive_alerts", sourceId: "a-1" },
      }),
    ]);

    expect(decisions).toHaveLength(1);
    expect(decisions[0].sources.length).toBe(2);
  });
});

describe("buildExecutiveDecisionQueue", () => {
  it("excludes Completed/Dismissed by default and counts statuses", () => {
    const queue = buildExecutiveDecisionQueue({
      scope,
      drafts: [
        draft({
          signalKey: "a",
          title: "Open",
          decisionType: "Approval",
          severity: "High",
          source: { source: "jag_work", sourceId: "1" },
        }),
        draft({
          signalKey: "b",
          title: "Done",
          decisionType: "Review",
          severity: "Low",
          status: "Completed",
          source: { source: "activity", sourceId: "2" },
        }),
      ],
      builtAt: "2026-07-09T12:00:00.000Z",
    });

    expect(queue.decisions).toHaveLength(1);
    expect(queue.counts.Open).toBe(1);
    expect(queue.counts.Completed).toBe(0);
  });
});

describe("lifecycle", () => {
  it("supports acknowledge, delegate, follow-up with history", () => {
    const { decisions } = mergeDecisionSources([
      draft({
        signalKey: "compliance.overdue",
        title: "Compliance decision",
        decisionType: "Compliance",
        severity: "Critical",
        complianceRisk: true,
        blocking: true,
        source: { source: "executive_alerts", sourceId: "c1" },
      }),
    ]);

    let d = decisions[0];
    d = acknowledgeDecision(d, {
      at: "2026-07-09T13:00:00.000Z",
      actorUserId: "user-1",
    });
    expect(d.status).toBe("Acknowledged");

    d = delegateDecision(d, {
      toOwner: "COMPLIANCE_LEAD",
      dueDate: "2026-07-12T00:00:00.000Z",
      at: "2026-07-09T13:30:00.000Z",
    });
    expect(d.status).toBe("Delegated");
    expect(d.recommendedOwner).toBe("COMPLIANCE_LEAD");
    expect(d.dueDate).toBe("2026-07-12T00:00:00.000Z");

    d = scheduleFollowUp(d, {
      dueDate: "2026-07-15T00:00:00.000Z",
      note: "Board check-in",
    });
    expect(d.dueDate).toBe("2026-07-15T00:00:00.000Z");
    expect(d.history.some((h) => h.action === "delegated")).toBe(true);
    expect(d.history.some((h) => h.action === "follow_up")).toBe(true);
  });
});

describe("adapters", () => {
  it("adapts critical alerts into decisions", () => {
    const alert: ExecutiveAlert = {
      id: "alert_1",
      title: "Cash risk",
      description: "Cash position declining",
      category: "Financial",
      severity: "Critical",
      priority: 90,
      confidence: "High",
      organization: "org-1",
      region: null,
      campus: "school-1",
      program: null,
      relatedEntity: null,
      activityReferences: ["act-1"],
      workflowReference: null,
      jagWorkReference: null,
      missionControlReference: "mc-cash",
      recommendedAction: "Review FI",
      createdAt: "2026-07-09T10:00:00.000Z",
      status: "open",
      acknowledgedAt: null,
      dismissedAt: null,
      dedupeKey: "ea_x",
      signalKey: "fi.cash_risk",
      sources: [{ source: "financial_intelligence", sourceId: "fi-1" }],
    };

    const drafts = adaptExecutiveAlerts([alert], scope);
    expect(drafts).toHaveLength(1);
    expect(drafts[0].decisionType).toBe("Financial");
    expect(drafts[0].relatedMissionControlItem).toBe("mc-cash");
    expect(drafts[0].blocking).toBe(true);
  });

  it("adapts MC + JAG + workflow + KPI", () => {
    const mc = adaptMissionControlDecisions(
      [
        {
          id: "mc-1",
          title: "Critical ops exception",
          severity: "critical",
          module: "operations",
          created_at: "2026-07-09T11:00:00.000Z",
        },
        {
          id: "mc-low",
          title: "Noise",
          severity: "low",
          module: "operations",
        },
      ],
      scope
    );
    expect(mc).toHaveLength(1);

    const jagItem: JagWorkItem = {
      id: "jag-1",
      title: "Needs human decision",
      workType: "executive_insight",
      perspectives: ["needs_human_decision"],
      priority: "critical",
      status: "awaiting_review",
      requiredKnowledgeKeys: [],
      requiredEvidenceTypes: [],
      recommendedNextAction: "Decide",
      blockingDependencies: ["Blocked on board"],
      completionCriteria: [],
      href: "/dashboard/executive",
      source: "executive",
      entityType: "executive_insights",
      entityId: "ins-1",
    };
    const jag = adaptJagWorkDecisions([jagItem], scope);
    expect(jag).toHaveLength(1);
    expect(jag[0].blocking).toBe(true);

    const wf = adaptWorkflowApprovals(
      [
        {
          id: "appr-1",
          instance_id: "wf-1",
          transition_key: "approve",
          gate_key: "leader_approval",
          status: "pending",
          domain: "admissions",
          created_at: "2026-07-09T09:00:00.000Z",
        },
      ],
      scope
    );
    expect(wf).toHaveLength(1);
    expect(wf[0].decisionType).toBe("Admissions");

    const kpi: KpiSnapshotRecord = {
      organizationId: "org-1",
      regionId: null,
      schoolId: "school-1",
      campusId: null,
      program: null,
      metricId: "compliance.critical_count",
      metricName: "Critical Compliance",
      metricValue: 3,
      status: "critical",
      trendDirection: "up",
      trendPct: 10,
      confidence: "High",
      source: "test",
      capturedAt: "2026-07-09T08:00:00.000Z",
      snapshotDate: "2026-07-09",
      captureMode: "daily",
      domain: "compliance",
    };
    const kpiDrafts = adaptKpiSnapshotDecisions([kpi], scope);
    expect(kpiDrafts[0].decisionType).toBe("Compliance");
  });
});

describe("collectDecisionDrafts", () => {
  it("fans out across sources and merges corroborating MC + alert", () => {
    const alert: ExecutiveAlert = {
      id: "alert_mc",
      title: "Shared issue",
      description: "Same underlying fact",
      category: "Compliance",
      severity: "High",
      priority: 70,
      confidence: "High",
      organization: "org-1",
      region: null,
      campus: "school-1",
      program: null,
      relatedEntity: { type: "compliance_obligations", id: "obl-1" },
      activityReferences: [],
      workflowReference: null,
      jagWorkReference: null,
      missionControlReference: "mc-shared",
      recommendedAction: "Fix",
      createdAt: "2026-07-09T10:00:00.000Z",
      status: "open",
      acknowledgedAt: null,
      dismissedAt: null,
      dedupeKey: "ea_y",
      signalKey: "compliance.overdue_obligations",
      sources: [{ source: "compliance", sourceId: "c1" }],
    };

    const sources: ExecutiveDecisionSourceBundle = {
      loadedAt: "2026-07-09T12:00:00.000Z",
      scope,
      schoolId: "school-1",
      alerts: [alert],
      missionControl: [
        {
          id: "mc-shared",
          title: "Shared issue",
          severity: "critical",
          module: "compliance",
          entity_type: "compliance_obligations",
          entity_id: "obl-1",
          created_at: "2026-07-09T10:05:00.000Z",
        },
      ],
      jagWork: [],
      workflowApprovals: [],
      activity: [],
      kpiSnapshots: [],
    };

    const drafts = collectDecisionDrafts(sources);
    const queue = buildExecutiveDecisionQueue({ scope, drafts });
    expect(queue.decisions).toHaveLength(1);
    expect(queue.decisions[0].relatedMissionControlItem).toBe("mc-shared");
    expect(queue.decisions[0].relatedAlerts).toContain("alert_mc");
    expect(queue.decisions[0].sources.length).toBeGreaterThanOrEqual(2);
  });
});
