import { beforeEach, describe, expect, it } from "vitest";
import "@/lib/platform/automation";
import {
  AUTOMATION_ENGINE_VERSION,
  PLATFORM_AUTOMATION_CATALOG,
  PLATFORM_REFERENCE_AUTOMATION_DEFINITIONS,
  clearAutomationAuditBuffer,
  computeRetryDelay,
  dispatchAutomationTrigger,
  executeAutomation,
  executeWithRetry,
  getAutomationAuditEntries,
  getAutomationRegistrySnapshot,
  isAutomationRegistryRegistered,
  resetAutomationAuditSequence,
  resetAutomationExecutionSequence,
  validateAutomationRegistry,
} from "@/lib/platform/automation";
import { createMockSupabase, TEST_UUIDS } from "../helpers/mock-supabase";

describe("Platform automation registry validation", () => {
  it("passes build-time integrity checks", () => {
    const result = validateAutomationRegistry();
    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("registers reference definitions and handlers on side-effect import", () => {
    expect(isAutomationRegistryRegistered()).toBe(true);
    const snapshot = getAutomationRegistrySnapshot();
    expect(snapshot.automations.length).toBeGreaterThanOrEqual(4);
    expect(snapshot.triggers.length).toBeGreaterThanOrEqual(7);
    expect(snapshot.actions.length).toBeGreaterThanOrEqual(10);
    expect(snapshot.conditions.length).toBeGreaterThanOrEqual(7);
  });
});

describe("Platform automation catalog", () => {
  it("defines reference automations across trigger types", () => {
    expect(PLATFORM_AUTOMATION_CATALOG.length).toBeGreaterThanOrEqual(4);
    expect(PLATFORM_REFERENCE_AUTOMATION_DEFINITIONS.some((d) => d.triggerKeys.includes("manual.invoke"))).toBe(true);
    expect(PLATFORM_REFERENCE_AUTOMATION_DEFINITIONS.some((d) => d.triggerKeys.includes("event.entity.created"))).toBe(true);
  });

  it("returns a complete registry snapshot", () => {
    const snapshot = getAutomationRegistrySnapshot();
    expect(snapshot.domains.length).toBeGreaterThanOrEqual(1);
    expect(snapshot.registeredAt).toBeTruthy();
  });
});

describe("Platform automation execution engine", () => {
  beforeEach(() => {
    clearAutomationAuditBuffer();
    resetAutomationAuditSequence();
    resetAutomationExecutionSequence();
  });

  it("executes manual note automation in skeleton mode", async () => {
    const result = await executeAutomation({
      automationKey: "ref_platform_manual_note",
      triggerKey: "manual.invoke",
      triggerType: "manual",
      organizationId: TEST_UUIDS.organization,
      schoolId: TEST_UUIDS.school,
      entityType: "student",
      entityId: TEST_UUIDS.student,
      actorId: TEST_UUIDS.user,
    });

    expect(result.status).toBe("completed");
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0]?.actionType).toBe("create_note");
    expect(result.actions[0]?.success).toBe(true);
  });

  it("skips automation when conditions are not satisfied", async () => {
    const result = await executeAutomation({
      automationKey: "ref_platform_entity_created_activity",
      triggerKey: "event.entity.created",
      triggerType: "event",
      organizationId: TEST_UUIDS.organization,
      entityType: "student",
      entityId: TEST_UUIDS.student,
      facts: { hasPermission: false, permissions: [] },
    });

    expect(result.status).toBe("skipped");
    expect(result.conditionsPassed).toBe(false);
  });

  it("executes automation when conditions pass", async () => {
    const result = await executeAutomation({
      automationKey: "ref_platform_entity_created_activity",
      triggerKey: "event.entity.created",
      triggerType: "event",
      organizationId: TEST_UUIDS.organization,
      entityType: "student",
      entityId: TEST_UUIDS.student,
      facts: { hasPermission: true, permissions: ["platform.automation.execute"] },
    });

    expect(result.conditionsPassed).toBe(true);
    expect(result.actions[0]?.actionType).toBe("create_activity");
  });

  it("supports dry run mode", async () => {
    const result = await executeAutomation({
      automationKey: "ref_platform_manual_note",
      triggerKey: "manual.invoke",
      triggerType: "manual",
      organizationId: TEST_UUIDS.organization,
      entityType: "student",
      entityId: TEST_UUIDS.student,
      dryRun: true,
    });

    expect(result.actions[0]?.skipped).toBe(true);
    expect(result.actions[0]?.success).toBe(true);
  });

  it("records audit entries on execution", async () => {
    await executeAutomation({
      automationKey: "ref_platform_manual_note",
      triggerKey: "manual.invoke",
      triggerType: "manual",
      organizationId: TEST_UUIDS.organization,
      entityType: "student",
      entityId: TEST_UUIDS.student,
    });

    expect(getAutomationAuditEntries().length).toBeGreaterThanOrEqual(1);
  });
});

describe("Platform automation trigger dispatch", () => {
  beforeEach(() => {
    clearAutomationAuditBuffer();
    resetAutomationAuditSequence();
    resetAutomationExecutionSequence();
  });

  it("dispatches manual trigger to matching automations", async () => {
    const result = await dispatchAutomationTrigger({
      triggerKey: "manual.invoke",
      triggerType: "manual",
      organizationId: TEST_UUIDS.organization,
      entityType: "student",
      entityId: TEST_UUIDS.student,
      payload: { automationKey: "ref_platform_manual_note" },
    });

    expect(result.matchedAutomations).toContain("ref_platform_manual_note");
    expect(result.results.length).toBeGreaterThanOrEqual(1);
  });

  it("dispatches event trigger by event type", async () => {
    const result = await dispatchAutomationTrigger({
      triggerKey: "event.entity.created",
      triggerType: "event",
      organizationId: TEST_UUIDS.organization,
      entityType: "student",
      entityId: TEST_UUIDS.student,
      payload: { eventType: "platform.entity.created" },
      facts: { hasPermission: true },
    });

    expect(result.matchedAutomations.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Platform automation retry policy", () => {
  it("computes exponential backoff delay", () => {
    expect(computeRetryDelay({ maxAttempts: 3, initialDelayMs: 100, backoffMultiplier: 2 }, 1)).toBe(100);
    expect(computeRetryDelay({ maxAttempts: 3, initialDelayMs: 100, backoffMultiplier: 2 }, 2)).toBe(200);
  });

  it("retries failed operations up to max attempts", async () => {
    let calls = 0;
    const result = await executeWithRetry(
      { maxAttempts: 3, initialDelayMs: 1 },
      async () => {
        calls += 1;
        if (calls < 3) throw new Error("transient failure");
        return "ok";
      }
    );

    expect(result.success).toBe(true);
    expect(result.attempts).toBe(3);
    expect(result.result).toBe("ok");
  });
});

describe("Platform automation action handlers with supabase", () => {
  beforeEach(() => {
    clearAutomationAuditBuffer();
    resetAutomationExecutionSequence();
  });

  it("creates activity via Activity Engine when supabase is provided", async () => {
    const supabase = createMockSupabase(({ table }) => {
      if (table === "platform_activity_events") {
        return { data: { id: TEST_UUIDS.activity }, error: null };
      }
      if (table === "platform_timeline_events") {
        return { data: null, error: null };
      }
      return { data: null, error: null };
    });

    const result = await executeAutomation({
      automationKey: "ref_platform_entity_created_activity",
      triggerKey: "event.entity.created",
      triggerType: "event",
      organizationId: TEST_UUIDS.organization,
      schoolId: TEST_UUIDS.school,
      entityType: "student",
      entityId: TEST_UUIDS.student,
      supabase: supabase as never,
      facts: { hasPermission: true },
    });

    expect(result.status).toBe("completed");
    expect(result.actions[0]?.output?.activityId).toBe(TEST_UUIDS.activity);
  });
});

describe("Platform automation engine version", () => {
  it("exports semantic version", () => {
    expect(AUTOMATION_ENGINE_VERSION).toBe("1.0.0");
  });
});
