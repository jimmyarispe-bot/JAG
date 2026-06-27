import { describe, expect, it, beforeEach } from "vitest";
import "@/lib/platform/workflow";
import {
  WORKFLOW_ACTION_CATALOG,
  WORKFLOW_TRIGGER_CATALOG,
  PLATFORM_REFERENCE_WORKFLOW_DEFINITIONS,
  approvalFactsFromDecision,
  canExecuteTransition,
  clearSkeletonAuditBuffer,
  clearWorkflowApprovalBuffer,
  createWorkflowApprovalRequest,
  createWorkflowInstanceContext,
  decideWorkflowApproval,
  evaluateAllWorkflowConditions,
  executeWorkflowTransition,
  getActiveWorkflowDefinitions,
  getAvailableTransitions,
  getPendingWorkflowApprovals,
  getWorkflowDefinition,
  getWorkflowDefinitionsByDomain,
  getWorkflowRegistrySnapshot,
  isWorkflowRegistryRegistered,
  registerWorkflowActionHandler,
  validateWorkflowRegistry,
} from "@/lib/platform/workflow";

describe("Platform workflow registry validation", () => {
  it("passes build-time integrity checks", () => {
    const result = validateWorkflowRegistry();
    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("registers reference definitions on side-effect import", () => {
    expect(isWorkflowRegistryRegistered()).toBe(true);
    expect(getActiveWorkflowDefinitions().length).toBeGreaterThanOrEqual(5);
  });
});

describe("Platform workflow catalog", () => {
  it("defines action and trigger catalogs", () => {
    expect(WORKFLOW_ACTION_CATALOG.length).toBeGreaterThanOrEqual(8);
    expect(WORKFLOW_TRIGGER_CATALOG.length).toBeGreaterThanOrEqual(7);
  });

  it("registers reference definitions across domains", () => {
    const domains = new Set(PLATFORM_REFERENCE_WORKFLOW_DEFINITIONS.map((d) => d.domain));
    expect(domains.has("hr")).toBe(true);
    expect(domains.has("compliance")).toBe(true);
    expect(domains.has("scholarships")).toBe(true);
    expect(domains.has("executive")).toBe(true);
    expect(getWorkflowDefinitionsByDomain("hr")).toHaveLength(1);
  });

  it("returns a complete registry snapshot", () => {
    const snapshot = getWorkflowRegistrySnapshot();
    expect(snapshot.definitions.length).toBeGreaterThanOrEqual(5);
    expect(snapshot.domains.length).toBeGreaterThanOrEqual(4);
    expect(snapshot.registeredAt).toBeTruthy();
  });
});

describe("Platform workflow condition evaluator", () => {
  it("evaluates equals and exists operators", () => {
    expect(
      evaluateAllWorkflowConditions(
        [{ key: "a", field: "status", operator: "equals", value: "active" }],
        { status: "active" }
      )
    ).toBe(true);
    expect(
      evaluateAllWorkflowConditions(
        [{ key: "b", field: "score", operator: "greater_than", value: 10 }],
        { score: 15 }
      )
    ).toBe(true);
    expect(
      evaluateAllWorkflowConditions(
        [{ key: "c", field: "missing", operator: "not_exists" }],
        {}
      )
    ).toBe(true);
  });
});

describe("Platform workflow execution skeleton", () => {
  beforeEach(() => {
    clearSkeletonAuditBuffer();
    clearWorkflowApprovalBuffer();
    registerWorkflowActionHandler("record_audit", async () => ({
      success: true,
      auditSummary: "Audit recorded",
    }));
    registerWorkflowActionHandler("create_task", async () => ({
      success: true,
      auditSummary: "Task created",
    }));
    registerWorkflowActionHandler("send_notification", async () => ({
      success: true,
      auditSummary: "Notification sent",
    }));
  });

  it("lists available transitions from current state", () => {
    const definition = getWorkflowDefinition("ref_hr_onboarding")!;
    const context = createWorkflowInstanceContext(definition, {
      instanceId: "test_instance_1",
      entityId: "emp_1",
    });
    const available = getAvailableTransitions(context);
    expect(available.map((t) => t.key)).toContain("start_paperwork");
  });

  it("blocks gated transitions until approval is provided", async () => {
    const definition = getWorkflowDefinition("ref_hr_onboarding")!;
    let context = createWorkflowInstanceContext(definition, {
      instanceId: "test_instance_2",
      entityId: "emp_2",
      facts: { paperworkComplete: true },
    });
    context = { ...context, currentStateKey: "background_check" };

    const blocked = await executeWorkflowTransition(context, "request_hr_approval");
    expect(blocked.success).toBe(false);
    expect(blocked.blockedBy).toBe("approval");
    expect(blocked.approvalRequestId).toBeTruthy();

    const approved = await executeWorkflowTransition(context, "request_hr_approval", {
      additionalFacts: approvalFactsFromDecision("approved"),
    });
    expect(approved.success).toBe(true);
    expect(approved.toStateKey).toBe("approval_pending");
  });

  it("blocks transitions when conditions fail", () => {
    const definition = getWorkflowDefinition("ref_hr_onboarding")!;
    const context = createWorkflowInstanceContext(definition, {
      instanceId: "test_instance_3",
      entityId: "emp_3",
      facts: { paperworkComplete: false },
    });
    context.currentStateKey = "paperwork_pending";

    const check = canExecuteTransition(context, "submit_background");
    expect(check.allowed).toBe(false);
    expect(check.errors).toContain("Transition conditions not satisfied");
  });

  it("completes incident report workflow through approval", async () => {
    const definition = getWorkflowDefinition("ref_incident_report")!;
    let context = createWorkflowInstanceContext(definition, {
      instanceId: "test_instance_4",
      entityId: "inc_1",
    });

    const step1 = await executeWorkflowTransition(context, "begin_investigation");
    expect(step1.success).toBe(true);
    context = { ...context, currentStateKey: step1.toStateKey! };

    const blocked = await executeWorkflowTransition(context, "submit_review");
    expect(blocked.blockedBy).toBe("approval");

    const approved = await executeWorkflowTransition(context, "submit_review", {
      additionalFacts: approvalFactsFromDecision("approved"),
    });
    expect(approved.success).toBe(true);
    context = { ...context, currentStateKey: approved.toStateKey! };

    const closed = await executeWorkflowTransition(context, "close_incident", {
      additionalFacts: approvalFactsFromDecision("approved"),
    });
    expect(closed.success).toBe(true);
    expect(closed.toStateKey).toBe("closed");
  });
});

describe("Platform workflow approval framework", () => {
  beforeEach(() => {
    clearWorkflowApprovalBuffer();
  });

  it("creates and resolves approval requests", () => {
    const definition = getWorkflowDefinition("ref_board_approval")!;
    const context = createWorkflowInstanceContext(definition, {
      instanceId: "test_instance_5",
      entityId: "board_1",
    });
    const transition = definition.transitions.find((t) => t.key === "submit_to_board")!;

    const request = createWorkflowApprovalRequest({ context, transition });
    expect(request.status).toBe("pending");
    expect(getPendingWorkflowApprovals(context.instanceId)).toHaveLength(1);

    const decision = decideWorkflowApproval({
      requestId: request.requestId,
      decision: "approved",
      decidedBy: "user_1",
    });
    expect(decision.success).toBe(true);
    expect(decision.request?.status).toBe("approved");
    expect(getPendingWorkflowApprovals(context.instanceId)).toHaveLength(0);
  });
});
