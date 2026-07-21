/** RC-7 — Workflow Automation Studio unit tests. */
import { describe, expect, it, beforeEach } from "vitest";
import {
  WORKFLOW_STUDIO_VERSION,
  STUDIO_NODE_TYPES,
  EXAMPLE_WORKFLOW_KEYS,
  createWorkflowStudioEngine,
  listExampleWorkflows,
  getExampleWorkflow,
  validateStudioWorkflow,
  executeStudioWorkflow,
  getStudioNodeCatalog,
  resetStudioIdSeqForTests,
  employeeOnboardingWorkflow,
  budgetApprovalWorkflow,
} from "@/lib/platform/workflows";
import {
  createIntegrationPlatformCore,
  registerCrmPlatformConnectors,
  registerHrPlatformConnectors,
  registerFinancePlatformConnectors,
  crmStore,
  hrStore,
  financeStore,
} from "@/lib/platform/integrations";
import {
  rebuildUnifiedKnowledgeGraph,
  unifiedGraphStore,
} from "@/lib/platform/knowledge-graph";

describe("RC-7 — Workflow Automation Studio", () => {
  beforeEach(() => {
    resetStudioIdSeqForTests();
    crmStore.clear();
    hrStore.clear();
    financeStore.clear();
    unifiedGraphStore.clear();
  });

  async function seedOrg(org = "org-wf-studio-demo") {
    const platform = createIntegrationPlatformCore();
    registerCrmPlatformConnectors(platform);
    registerHrPlatformConnectors(platform);
    registerFinancePlatformConnectors(platform);
    for (const id of [`hubspot-${org}`, `gusto-${org}`, `stripe-${org}`]) {
      platform.lifecycle.seed(id, "connected");
    }
    await platform.syncNow("hubspot", `hubspot-${org}`, "full");
    await platform.syncNow("gusto", `gusto-${org}`, "full");
    await platform.syncNow("stripe", `stripe-${org}`, "full");
    rebuildUnifiedKnowledgeGraph(org);
    return org;
  }

  it("exports version, node types, and nine example keys", () => {
    expect(WORKFLOW_STUDIO_VERSION).toBe("1.0.0");
    expect(STUDIO_NODE_TYPES).toEqual([
      "trigger",
      "condition",
      "action",
      "approval",
      "delay",
      "notification",
      "integration",
      "ai_step",
      "graph_update",
    ]);
    expect(EXAMPLE_WORKFLOW_KEYS).toHaveLength(9);
    expect(getStudioNodeCatalog()).toHaveLength(9);
  });

  it("lists all example workflows with required node coverage", () => {
    const examples = listExampleWorkflows();
    expect(examples).toHaveLength(9);
    expect(examples.map((e) => e.key).sort()).toEqual([...EXAMPLE_WORKFLOW_KEYS].sort());

    const allTypes = new Set(examples.flatMap((wf) => wf.nodes.map((n) => n.type)));
    for (const type of STUDIO_NODE_TYPES) {
      expect(allTypes.has(type)).toBe(true);
    }
  });

  it("validates example graphs", () => {
    for (const key of EXAMPLE_WORKFLOW_KEYS) {
      const wf = getExampleWorkflow(key);
      const result = validateStudioWorkflow(wf);
      expect(result.valid, `${key}: ${result.issues.map((i) => i.message).join("; ")}`).toBe(
        true
      );
    }
  });

  it("dry-runs employee onboarding until human approval", async () => {
    const org = await seedOrg();
    const result = executeStudioWorkflow({
      workflow: employeeOnboardingWorkflow(),
      organizationId: org,
      dryRun: true,
      vars: { needsEquipment: true },
      now: () => new Date("2026-07-19T12:00:00.000Z"),
    });

    expect(result.governance.mayAutoExecute).toBe(false);
    expect(result.governance.approvalsRequireHuman).toBe(true);
    expect(result.status).toBe("waiting_approval");
    expect(result.steps.some((s) => s.type === "trigger")).toBe(true);
    expect(result.steps.some((s) => s.type === "integration")).toBe(true);
    expect(result.steps.some((s) => s.type === "delay")).toBe(true);
    expect(result.steps.at(-1)?.type).toBe("approval");
    expect(result.steps.at(-1)?.status).toBe("waiting");
  });

  it("completes budget approval when human approves", async () => {
    const org = await seedOrg();
    const wf = budgetApprovalWorkflow();
    const cfoId = wf.nodes.find((n) => n.id === "ba-cfo")!.id;

    const result = executeStudioWorkflow({
      workflow: wf,
      organizationId: org,
      dryRun: true,
      vars: { amount: 25000 },
      approvals: { [cfoId]: "approved" },
    });

    expect(result.status).toBe("completed");
    expect(result.steps.some((s) => s.type === "integration")).toBe(true);
    expect(result.steps.some((s) => s.type === "notification")).toBe(true);
    expect(result.steps.some((s) => s.nodeId === "ba-cfo")).toBe(true);
  });

  it("engine facade runs examples and exposes catalog", async () => {
    const org = await seedOrg();
    const engine = createWorkflowStudioEngine();
    expect(engine.version).toBe("1.0.0");
    expect(engine.listNodeCatalog()).toHaveLength(9);
    expect(engine.listExamples()).toHaveLength(9);

    const run = engine.runExample("lead_follow_up", org, {
      dryRun: true,
      vars: { leadContacted: true },
    });
    expect(run.workflowKey).toBe("lead_follow_up");
    expect(run.steps.length).toBeGreaterThan(3);
    expect(["completed", "waiting_delay", "waiting_approval"]).toContain(run.status);
  });

  it("rejects invalid workflows missing a trigger", () => {
    const bad = getExampleWorkflow("vendor_approval");
    bad.nodes = bad.nodes.filter((n) => n.type !== "trigger");
    bad.entryNodeId = bad.nodes[0]!.id;
    const validation = validateStudioWorkflow(bad);
    expect(validation.valid).toBe(false);
    expect(validation.issues.some((i) => i.code === "missing_trigger")).toBe(true);
  });
});
