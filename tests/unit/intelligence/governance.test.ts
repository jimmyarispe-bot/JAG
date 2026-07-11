/**
 * Sprint 017 — Enterprise Governance & Accountability unit tests.
 */

import { describe, expect, it } from "vitest";
import {
  createAutonomousExecutiveLoop,
  type AutonomyLoopResult,
} from "@/lib/platform/autonomy";
import {
  ENTERPRISE_GOVERNANCE_VERSION,
  GOVERNANCE_APPROVER_ROLES,
  GOVERNANCE_AUDIT_EVENT_KINDS,
  GOVERNANCE_AUTHORITY_DOMAINS,
  GovernanceApprovals,
  GovernanceAuthority,
  GovernanceAudit,
  GovernanceBoard,
  GovernanceCommittees,
  GovernanceDelegations,
  GovernancePolicies,
  GovernanceVoting,
  createEnterpriseGovernance,
  type GovernanceCycleRequest,
} from "@/lib/platform/governance";
import { createGoalExecutionEngine } from "@/lib/platform/execution";
import {
  createDecisionIntelligenceDomain,
  createOrganizationalIntelligence,
  createPersistentIntelligenceMemory,
  createEmptyExecutiveContextSection,
  createEmptyFinanceContextSection,
  createEmptyOrganizationContextSection,
  createEmptyStudentContextSection,
  type OrganizationMetricSample,
} from "@/lib/platform/intelligence";
import { createJagCollaborationEngine } from "@/lib/platform/jag/collaboration";

function sample(
  key: string,
  value: number,
  previousValue?: number
): OrganizationMetricSample {
  return {
    key,
    label: key,
    value,
    previousValue,
    observedAt: "2026-07-11T16:00:00.000Z",
  };
}

function sharedContext() {
  const scope = { organizationId: "org-1", schoolId: "school-1" };
  return {
    requestId: "shared-gov-1",
    scope,
    executive: createEmptyExecutiveContextSection(scope),
    finance: createEmptyFinanceContextSection(scope),
    student: createEmptyStudentContextSection(scope),
    organization: createEmptyOrganizationContextSection(scope),
    errors: [],
    builtAt: "2026-07-11T16:00:00.000Z",
  };
}

async function buildAutonomy(): Promise<{
  autonomy: AutonomyLoopResult;
  requestBase: Omit<GovernanceCycleRequest, "autonomy">;
}> {
  let id = 0;
  const memory = createPersistentIntelligenceMemory();
  const { observer } = createOrganizationalIntelligence({
    now: () => new Date("2026-07-11T16:00:00.000Z"),
    createId: (prefix) => `${prefix}-${++id}`,
    memory,
  });
  const organization = await observer.observe({
    requestId: "org-gov-1",
    organizationId: "org-1",
    schoolId: "school-1",
    observedAt: "2026-07-11T16:00:00.000Z",
    metrics: [
      sample("days_cash", 20, 50),
      sample("attendance_rate", 86, 92),
      sample("enrollment_count", 480, 510),
      sample("vacancy_rate", 16, 7),
      sample("open_findings", 7, 2),
      sample("execution_health", 30, 55),
      sample("strategic_goal_progress", 35, 50),
      sample("satisfaction_score", 3.5, 4.0),
    ],
    sharedContext: sharedContext(),
  });

  const decision = createDecisionIntelligenceDomain().analyze({
    requestId: "dec-gov-1",
    subject: "Cash recovery decision",
    description: "Board-sensitive financial recovery",
    organizationId: "org-1",
    schoolId: "school-1",
    sharedContext: sharedContext(),
  });

  const collaboration = await createJagCollaborationEngine({
    memory,
    now: () => new Date("2026-07-11T16:00:00.000Z"),
  }).collaborate({
    requestId: "collab-gov-1",
    subject: "Cash recovery collaboration",
    description: "Multi-agent review",
    organizationId: "org-1",
    schoolId: "school-1",
    sharedContext: sharedContext(),
  });

  const goalEngine = createGoalExecutionEngine({
    now: () => new Date("2026-07-11T16:00:00.000Z"),
    createId: () => `g-${++id}`,
  });

  const autonomy = await createAutonomousExecutiveLoop({
    memory,
    goalEngine,
    now: () => new Date("2026-07-11T16:00:00.000Z"),
    createId: (prefix) => `${prefix}-${++id}`,
  }).run({
    requestId: "auto-gov-1",
    organizationId: "org-1",
    schoolId: "school-1",
    subject: "Stabilize cash and compliance",
    organization,
    sharedContext: sharedContext(),
    decision,
    collaboration,
  });

  return {
    autonomy,
    requestBase: {
      requestId: "gov-cycle-1",
      organizationId: "org-1",
      schoolId: "school-1",
      subject: "Stabilize cash and compliance",
      description: "Enterprise governance cycle",
      sharedContext: sharedContext(),
      organization,
      decision,
      collaboration,
      executionGoals: autonomy.execution.goal ? [autonomy.execution.goal] : [],
      executionProgress: autonomy.execution.progress
        ? [autonomy.execution.progress]
        : [],
      workspaceLinks: {
        evidenceIds: decision.evidence.items.map((i) => i.evidenceId),
        memoryIds: [],
        goalIds: autonomy.execution.goal ? [autonomy.execution.goal.id] : [],
        executionIds: autonomy.execution.progress
          ? [autonomy.execution.progress.subjectId]
          : [],
        decisionId: decision.requestId,
        organizationRequestId: organization.requestId,
      },
      actor: "test-secretary",
    },
  };
}

describe("GovernancePolicies & Authority", () => {
  it("seeds domain policies and authority grants", () => {
    const policies = new GovernancePolicies({
      now: () => new Date("2026-07-11T16:00:00.000Z"),
    });
    expect(policies.list().length).toBeGreaterThanOrEqual(
      GOVERNANCE_AUTHORITY_DOMAINS.length
    );
    expect(policies.list("financial").length).toBeGreaterThan(0);

    const authority = new GovernanceAuthority();
    expect(authority.domains()).toEqual([...GOVERNANCE_AUTHORITY_DOMAINS]);
    expect(authority.canApprove("ceo", "financial", 100000)).toBe(true);
    expect(authority.canApprove("ceo", "financial", 9999999)).toBe(false);
    expect(authority.canApprove("board", "financial", 9999999)).toBe(true);
  });
});

describe("Approvals, Board, Voting, Delegations, Committees", () => {
  it("supports multi-role approval chains and board artifacts", () => {
    let id = 0;
    const createId = (prefix: string) => `${prefix}-${++id}`;
    const approvals = new GovernanceApprovals({
      now: () => new Date("2026-07-11T16:00:00.000Z"),
      createId,
    });
    const approval = approvals.create({
      subject: "Capital outlay",
      description: "Facility upgrade",
      domain: "financial",
      roles: ["executive_team", "ceo", "board"],
    });
    expect(approval.chain).toHaveLength(3);
    expect(GOVERNANCE_APPROVER_ROLES).toContain(approval.chain[0]!.role);

    const afterExec = approvals.decideStep(
      approval.approvalId,
      1,
      "approved",
      "COO",
      "Supported"
    );
    expect(afterExec.currentStepOrder).toBe(2);
    expect(afterExec.status).toBe("pending");

    const board = new GovernanceBoard({
      now: () => new Date("2026-07-11T16:00:00.000Z"),
      createId,
    });
    const motion = board.proposeMotion({
      title: "Approve capital plan",
      text: "Move to approve facility upgrade",
      movedBy: "Chair",
    });
    board.secondMotion(motion.motionId, "Vice Chair");
    const resolution = board.draftResolution({
      title: "Capital resolution",
      text: "Resolved to approve",
      motionId: motion.motionId,
    });
    board.adoptResolution(resolution.resolutionId);
    expect(board.listResolutions()[0]?.status).toBe("passed");

    const voting = new GovernanceVoting({
      now: () => new Date("2026-07-11T16:00:00.000Z"),
      createId,
    });
    const vote = voting.open({ subjectId: motion.motionId, subjectKind: "motion" });
    voting.cast(vote.voteId, "Member A", "aye");
    voting.cast(vote.voteId, "Member B", "aye");
    voting.cast(vote.voteId, "Member C", "nay");
    const closed = voting.close(vote.voteId);
    expect(closed.passed).toBe(true);
    expect(closed.aye).toBe(2);

    const delegations = new GovernanceDelegations({
      now: () => new Date("2026-07-11T16:00:00.000Z"),
      createId,
    });
    const delegation = delegations.grant({
      fromRole: "ceo",
      toRole: "president",
      domain: "operational",
      scope: "Campus operations under $25k",
      rationale: "Travel coverage",
    });
    expect(delegations.listActive()).toHaveLength(1);
    delegations.revoke(delegation.delegationId);
    expect(delegations.listActive()).toHaveLength(0);

    const committees = new GovernanceCommittees({ createId });
    expect(committees.list("finance").length).toBeGreaterThan(0);
  });
});

describe("Audit records every recommendation", () => {
  it("records recommendation events from org/decision/collaboration/autonomy", async () => {
    const { autonomy, requestBase } = await buildAutonomy();
    const audit = new GovernanceAudit({
      now: () => new Date("2026-07-11T16:00:00.000Z"),
    });
    const events = audit.recordCycle(
      { ...requestBase, autonomy },
      { approvals: [], motions: [], resolutions: [] }
    );
    const recommendations = events.filter((e) => e.kind === "recommendation");
    expect(recommendations.length).toBeGreaterThan(0);
    expect(GOVERNANCE_AUDIT_EVENT_KINDS).toContain("recommendation");
    expect(events.some((e) => e.kind === "decision")).toBe(true);
  });
});

describe("EnterpriseGovernanceEngine orchestration", () => {
  it("runs a full governance cycle integrated with autonomy and intelligence", async () => {
    const { autonomy, requestBase } = await buildAutonomy();
    let id = 0;
    const engine = createEnterpriseGovernance({
      now: () => new Date("2026-07-11T16:00:00.000Z"),
      createId: (prefix) => `${prefix}-${++id}`,
    });

    const result = engine.run({ ...requestBase, autonomy });
    expect(result.domainVersion).toBe(ENTERPRISE_GOVERNANCE_VERSION);
    expect(result.policies.length).toBeGreaterThan(0);
    expect(result.approvals.length).toBeGreaterThan(0);
    expect(result.committees.length).toBeGreaterThan(0);
    expect(result.authority.length).toBeGreaterThan(0);
    expect(result.accountability.length).toBeGreaterThan(0);
    expect(result.evidence.length).toBeGreaterThan(0);
    expect(result.compliance.length).toBeGreaterThan(0);
    expect(result.oversight.length).toBe(1);
    expect(result.notifications.length).toBeGreaterThan(0);
    expect(result.history.length).toBeGreaterThan(0);
    expect(result.metrics.length).toBeGreaterThan(0);
    expect(result.scorecard.band).toBeTruthy();
    expect(result.report.narrative).toContain("recommendation");
    expect(
      result.auditEvents.filter((e) => e.kind === "recommendation").length
    ).toBeGreaterThan(0);
    expect(result.summary).toBeTruthy();
  });

  it("creates board motions when autonomy requires board approval", async () => {
    const { autonomy, requestBase } = await buildAutonomy();
    // Force board path if not already
    const boardAutonomy: AutonomyLoopResult = {
      ...autonomy,
      decision: {
        ...autonomy.decision,
        approvalMode: "board_approval",
        requiresHuman: true,
        approvedForExecution: false,
      },
    };
    const engine = createEnterpriseGovernance({
      now: () => new Date("2026-07-11T16:00:00.000Z"),
    });
    const result = engine.run({ ...requestBase, autonomy: boardAutonomy });
    expect(result.motions.length).toBeGreaterThan(0);
    expect(result.resolutions.length).toBeGreaterThan(0);
    expect(result.votes.length).toBe(result.motions.length);
    expect(result.approvals.some((a) => a.chain.some((s) => s.role === "board"))).toBe(
      true
    );
  });
});
