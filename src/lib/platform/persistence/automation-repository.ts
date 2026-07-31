import type { AutomationRun } from "@/lib/platform/automation/operating/types";
import {
  dirtySets,
  markDirty,
  memoryStore,
} from "@/lib/platform/persistence/memory-store";
import type {
  AutomationEvent,
  PersistenceClient,
} from "@/lib/platform/persistence/types";

function eventsForRun(runId: string): AutomationEvent[] {
  return [...memoryStore.automationEvents.values()]
    .filter((e) => e.runId === runId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

const runScope = new Map<
  string,
  { organizationId: string | null; applicationId: string | null }
>();

export function clearAutomationRunScopeForTests(): void {
  runScope.clear();
}

function deriveEvents(run: AutomationRun): AutomationEvent[] {
  const existing = eventsForRun(run.id);
  if (existing.length > 0) return existing;
  return run.actionsExecuted.map((detail, index) => ({
    id: `${run.id}:evt:${index}`,
    runId: run.id,
    eventType: detail.includes(":FAILED:")
      ? "action_failed"
      : detail.startsWith("skip")
        ? "skipped"
        : "action_executed",
    detail,
    createdAt: run.finishedAt,
    payload: {},
  }));
}

export const AutomationRepository = {
  appendRun(
    run: AutomationRun,
    options?: { organizationId?: string | null; applicationId?: string | null }
  ): AutomationRun {
    const stored: AutomationRun = {
      ...run,
      decisionsCreated: [...run.decisionsCreated],
      notificationsCreated: [...run.notificationsCreated],
      actionsExecuted: [...run.actionsExecuted],
    };
    memoryStore.automationRuns.set(stored.id, stored);
    memoryStore.automationRunOrder = [
      stored.id,
      ...memoryStore.automationRunOrder.filter((id) => id !== stored.id),
    ];
    markDirty("automationRuns", stored.id);

    const events = deriveEvents(stored);
    for (const event of events) {
      memoryStore.automationEvents.set(event.id, event);
      markDirty("automationEvents", event.id);
    }

    runScope.set(stored.id, {
      organizationId: options?.organizationId ?? null,
      applicationId: options?.applicationId ?? null,
    });
    return stored;
  },

  listRuns(limit = 50): AutomationRun[] {
    return memoryStore.automationRunOrder
      .slice(0, limit)
      .map((id) => memoryStore.automationRuns.get(id))
      .filter((r): r is AutomationRun => Boolean(r))
      .map((r) => ({
        ...r,
        decisionsCreated: [...r.decisionsCreated],
        notificationsCreated: [...r.notificationsCreated],
        actionsExecuted: [...r.actionsExecuted],
      }));
  },

  listEvents(runId: string): AutomationEvent[] {
    return eventsForRun(runId);
  },

  getRun(id: string): AutomationRun | null {
    const r = memoryStore.automationRuns.get(id);
    return r
      ? {
          ...r,
          decisionsCreated: [...r.decisionsCreated],
          notificationsCreated: [...r.notificationsCreated],
          actionsExecuted: [...r.actionsExecuted],
        }
      : null;
  },

  async hydrate(client: PersistenceClient): Promise<number> {
    const { data: rows, error } = await client
      .from("platform_automation_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(2000);
    if (error || !rows) return 0;

    const { data: eventRows } = await client
      .from("platform_automation_events")
      .select("*")
      .limit(20000);

    for (const e of eventRows ?? []) {
      const event: AutomationEvent = {
        id: String(e.id),
        runId: String(e.run_id),
        eventType: String(e.event_type),
        detail: (e.detail as string | null) ?? null,
        createdAt: String(e.created_at),
        payload: (e.payload as Record<string, unknown>) ?? {},
      };
      memoryStore.automationEvents.set(event.id, event);
    }

    memoryStore.automationRunOrder = [];
    for (const row of rows) {
      const run: AutomationRun = {
        id: String(row.id),
        ruleId: String(row.rule_id),
        ruleName: String(row.rule_name),
        trigger: row.trigger as AutomationRun["trigger"],
        status: row.status as AutomationRun["status"],
        startedAt: String(row.started_at),
        finishedAt: String(row.finished_at),
        subjectKey: (row.subject_key as string | null) ?? null,
        decisionsCreated: Array.isArray(row.decisions_created)
          ? (row.decisions_created as string[])
          : [],
        notificationsCreated: Array.isArray(row.notifications_created)
          ? (row.notifications_created as string[])
          : [],
        actionsExecuted: Array.isArray(row.actions_executed)
          ? (row.actions_executed as string[])
          : [],
        error: (row.error as string | null) ?? null,
        skippedReason: (row.skipped_reason as string | null) ?? null,
      };
      memoryStore.automationRuns.set(run.id, run);
      memoryStore.automationRunOrder.push(run.id);
    }
    return rows.length;
  },

  async flush(
    client: PersistenceClient,
    context?: { organizationId?: string | null; applicationId?: string | null }
  ): Promise<void> {
    for (const id of dirtySets.automationRuns) {
      const r = memoryStore.automationRuns.get(id);
      if (!r) continue;
      const scope = runScope.get(id);
      const { error } = await client.from("platform_automation_runs").upsert({
        id: r.id,
        rule_id: r.ruleId,
        rule_name: r.ruleName,
        trigger: r.trigger,
        status: r.status,
        started_at: r.startedAt,
        finished_at: r.finishedAt,
        subject_key: r.subjectKey,
        decisions_created: r.decisionsCreated,
        notifications_created: r.notificationsCreated,
        actions_executed: r.actionsExecuted,
        error: r.error,
        skipped_reason: r.skippedReason,
        organization_id:
          scope?.organizationId ?? context?.organizationId ?? null,
        application_id:
          scope?.applicationId ?? context?.applicationId ?? null,
        payload: {},
      });
      if (error) throw new Error(`Automation run flush failed: ${error.message}`);
    }

    for (const id of dirtySets.automationEvents) {
      const e = memoryStore.automationEvents.get(id);
      if (!e) continue;
      const { error } = await client.from("platform_automation_events").upsert({
        id: e.id,
        run_id: e.runId,
        event_type: e.eventType,
        detail: e.detail,
        created_at: e.createdAt,
        payload: e.payload ?? {},
      });
      if (error) {
        throw new Error(`Automation event flush failed: ${error.message}`);
      }
    }
  },
} as const;
