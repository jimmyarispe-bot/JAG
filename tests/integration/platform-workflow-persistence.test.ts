import { describe, expect, it, beforeEach } from "vitest";
import { createMockSupabase, TEST_UUIDS } from "../helpers/mock-supabase";
import {
  getPublishedWorkflowVersion,
  getOrCreateWorkflowInstance,
  persistWorkflowStateChange,
  listWorkflowStateHistory,
  createWorkflowTask,
  createPersistedWorkflowApproval,
  createWorkflowTimer,
  recordEntityWorkflowStateChange,
} from "@/lib/platform/workflow";
import {
  ADMISSIONS_CASE_WORKFLOW_KEY,
  buildAdmissionsCaseWorkflowDefinition,
  resolveAdmissionsPipelineTransitionKey,
} from "@/lib/admissions/workflow/platform-definition";
import "@/lib/admissions/workflow/register-platform";

const DEFINITION_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";
const VERSION_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2";
const INSTANCE_ID = "cccccccc-cccc-4ccc-8ccc-ccccccccccc3";

function createWorkflowMockStore() {
  const definitions = [
    {
      id: DEFINITION_ID,
      workflow_key: ADMISSIONS_CASE_WORKFLOW_KEY,
      domain: "admissions",
      entity_type: "admissions_lead",
      name: "Admissions Case Pipeline",
      description: null,
      school_id: null,
      status: "published",
      sort_order: 10,
      tags: [],
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const versions = [
    {
      id: VERSION_ID,
      definition_id: DEFINITION_ID,
      version_number: 1,
      status: "published",
      definition_snapshot: buildAdmissionsCaseWorkflowDefinition(),
      initial_state_key: "inquiry",
      published_at: new Date().toISOString(),
      archived_at: null,
      created_by: null,
      created_at: new Date().toISOString(),
    },
  ];

  const instances: Record<string, unknown>[] = [];
  const history: Record<string, unknown>[] = [];
  const tasks: Record<string, unknown>[] = [];
  const approvals: Record<string, unknown>[] = [];
  const timers: Record<string, unknown>[] = [];

  const supabase = createMockSupabase(({ table, operation, payload }) => {
    if (table === "platform_workflow_definitions") {
      return { data: definitions, error: null };
    }

    if (table === "platform_workflow_versions") {
      if (operation === "maybeSingle") {
        return { data: versions[0], error: null };
      }
      return { data: versions, error: null };
    }

    if (table === "platform_workflow_instances") {
      if (operation === "insert" || (operation === "single" && payload && !Array.isArray(payload) && "version_id" in payload)) {
        const row = {
          id: INSTANCE_ID,
          ...(payload as Record<string, unknown>),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        instances.push(row);
        return { data: row, error: null };
      }
      if (operation === "maybeSingle") {
        const row = instances.find((i) => i.status === "active");
        return { data: row ?? null, error: null };
      }
      if (operation === "update") {
        const row = instances[0];
        if (row) Object.assign(row, payload);
        return { data: row, error: null };
      }
      return { data: instances[0] ?? null, error: null };
    }

    if (table === "platform_workflow_state_history") {
      if (operation === "insert" || (operation === "single" && payload && "instance_id" in (payload as Record<string, unknown>))) {
        const row = {
          id: "dddddddd-dddd-4ddd-8ddd-ddddddddddd4",
          ...(payload as Record<string, unknown>),
        };
        history.push(row);
        return { data: row, error: null };
      }
      return { data: history, error: null };
    }

    if (table === "platform_workflow_tasks" && (operation === "insert" || operation === "single")) {
      const row = {
        id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee5",
        ...(payload as Record<string, unknown>),
        created_at: new Date().toISOString(),
      };
      tasks.push(row);
      return { data: row, error: null };
    }

    if (table === "platform_workflow_approvals" && (operation === "insert" || operation === "single")) {
      const row = {
        id: "ffffffff-ffff-4fff-8fff-fffffffffff6",
        ...(payload as Record<string, unknown>),
        created_at: new Date().toISOString(),
      };
      approvals.push(row);
      return { data: row, error: null };
    }

    if (table === "platform_workflow_timers" && (operation === "insert" || operation === "single")) {
      const row = {
        id: "11111111-1111-4111-8111-111111111117",
        ...(payload as Record<string, unknown>),
        created_at: new Date().toISOString(),
      };
      timers.push(row);
      return { data: row, error: null };
    }

    return { data: null, error: null };
  });

  return { supabase, instances, history, tasks, approvals, timers };
}

describe("Platform workflow persistence", () => {
  let store: ReturnType<typeof createWorkflowMockStore>;

  beforeEach(() => {
    store = createWorkflowMockStore();
  });

  it("loads published workflow version", async () => {
    const result = await getPublishedWorkflowVersion(
      store.supabase as never,
      ADMISSIONS_CASE_WORKFLOW_KEY,
      null
    );
    expect(result?.version.status).toBe("published");
    expect(result?.version.initial_state_key).toBe("inquiry");
  });

  it("creates and persists workflow instance with state history", async () => {
    const { instance, created } = await getOrCreateWorkflowInstance(store.supabase as never, {
      workflowKey: ADMISSIONS_CASE_WORKFLOW_KEY,
      domain: "admissions",
      entityType: "admissions_lead",
      entityId: TEST_UUIDS.student,
      schoolId: TEST_UUIDS.school,
      currentStateKey: "inquiry",
    });

    expect(created).toBe(true);
    expect(instance.version_id).toBe(VERSION_ID);

    const persistResult = await persistWorkflowStateChange(store.supabase as never, {
      instanceId: instance.id,
      versionId: instance.version_id,
      fromStateKey: "inquiry",
      toStateKey: "application_started",
      transitionKey: "inquiry__application_started",
      eventType: "transition_completed",
      summary: "Inquiry → Application Started",
    });

    expect(persistResult.error).toBeUndefined();
    expect(store.history).toHaveLength(1);
  });

  it("records entity workflow state change end-to-end", async () => {
    const result = await recordEntityWorkflowStateChange(store.supabase as never, {
      workflowKey: ADMISSIONS_CASE_WORKFLOW_KEY,
      domain: "admissions",
      entityType: "admissions_lead",
      entityId: TEST_UUIDS.student,
      schoolId: TEST_UUIDS.school,
      fromStateKey: "inquiry",
      toStateKey: "application_submitted",
      transitionKey: resolveAdmissionsPipelineTransitionKey("inquiry", "application_submitted"),
      summary: "Stage advanced",
      facts: { leadStage: "application_submitted" },
    });

    expect(result.error).toBeUndefined();
    expect(result.instanceId).toBeTruthy();
    expect(store.instances).toHaveLength(1);
    expect(store.history).toHaveLength(1);
  });

  it("persists tasks, approvals, and timers", async () => {
    const { instance } = await getOrCreateWorkflowInstance(store.supabase as never, {
      workflowKey: ADMISSIONS_CASE_WORKFLOW_KEY,
      domain: "admissions",
      entityType: "admissions_lead",
      entityId: TEST_UUIDS.student,
      schoolId: TEST_UUIDS.school,
      currentStateKey: "inquiry",
    });

    await createWorkflowTask(store.supabase as never, {
      instanceId: instance.id,
      taskName: "Follow up",
      stateKey: "inquiry",
    });

    await createPersistedWorkflowApproval(store.supabase as never, {
      instanceId: instance.id,
      transitionKey: "committee_review__accepted",
      gateKey: "committee_gate",
    });

    await createWorkflowTimer(store.supabase as never, {
      instanceId: instance.id,
      timerKey: "follow_up",
      firesAt: new Date(Date.now() + 86400000).toISOString(),
    });

    expect(store.tasks).toHaveLength(1);
    expect(store.approvals).toHaveLength(1);
    expect(store.timers).toHaveLength(1);

    const history = await listWorkflowStateHistory(store.supabase as never, instance.id);
    expect(history).toBeDefined();
  });
});

describe("Admissions case platform workflow definition", () => {
  it("registers admissions case workflow in platform registry", async () => {
    const { validateWorkflowRegistry, getWorkflowDefinition } = await import(
      "@/lib/platform/workflow"
    );
    const definition = getWorkflowDefinition(ADMISSIONS_CASE_WORKFLOW_KEY);
    expect(definition?.domain).toBe("admissions");
    expect(definition?.states.length).toBe(14);

    const validation = validateWorkflowRegistry();
    expect(validation.ok).toBe(true);
  });
});
