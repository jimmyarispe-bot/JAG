import { executeAction } from "@/lib/platform/automation/operating/actions";
import { evaluateConditions } from "@/lib/platform/automation/operating/conditions";
import { listAutomationRules } from "@/lib/platform/automation/operating/registry";
import { ensureDefaultAutomationRules } from "@/lib/platform/automation/operating/rules";
import { expandTriggerSubjects } from "@/lib/platform/automation/operating/triggers";
import type {
  AutomationBatchResult,
  AutomationRule,
  AutomationRun,
  AutomationScheduleCadence,
  AutomationTriggerKind,
  OperationalFacts,
  RunAutomationInput,
} from "@/lib/platform/automation/operating/types";
import {
  AutomationRepository,
  dirtySets,
  memoryStore,
} from "@/lib/platform/persistence";

let runSeq = 0;

export function resetAutomationRunStoreForTests(): void {
  memoryStore.automationRuns.clear();
  memoryStore.automationEvents.clear();
  memoryStore.automationRunOrder = [];
  dirtySets.automationRuns.clear();
  dirtySets.automationEvents.clear();
  runSeq = 0;
}

export function listAutomationRuns(limit = 50): AutomationRun[] {
  return AutomationRepository.listRuns(limit);
}

function persistRuns(
  runs: AutomationRun[],
  facts: OperationalFacts
): void {
  for (const run of runs) {
    AutomationRepository.appendRun(run, {
      organizationId: facts.organizationId,
      applicationId: facts.applicationId ?? null,
    });
  }
}

function ruleMatchesScope(rule: AutomationRule, facts: OperationalFacts): boolean {
  if (
    rule.organizationScope != null &&
    facts.organizationId != null &&
    rule.organizationScope !== facts.organizationId
  ) {
    return false;
  }
  if (
    rule.applicationScope != null &&
    facts.applicationId != null &&
    rule.applicationScope !== facts.applicationId
  ) {
    return false;
  }
  return true;
}

function selectRules(input: {
  trigger?: AutomationTriggerKind;
  cadence?: AutomationScheduleCadence;
}): AutomationRule[] {
  ensureDefaultAutomationRules();
  return listAutomationRules().filter((rule) => {
    if (!rule.enabled) return false;
    if (input.trigger && rule.trigger !== input.trigger) return false;
    if (input.cadence && input.cadence !== "manual" && rule.schedule !== input.cadence) {
      // manual cadence runs all enabled matching trigger (or all)
      return false;
    }
    return true;
  });
}

function createRunId(ruleId: string, subjectKey: string, now: string): string {
  runSeq += 1;
  return `auto-run:${ruleId}:${subjectKey}:${now}:${runSeq}`;
}

function runRuleForSubject(input: {
  rule: AutomationRule;
  facts: OperationalFacts;
  subjectKey: string;
  subject: Record<string, unknown>;
  actorUserId?: string | null;
  now: string;
}): AutomationRun {
  const startedAt = input.now;
  const facts: OperationalFacts = {
    ...input.facts,
    subject: input.subject,
  };

  if (!ruleMatchesScope(input.rule, facts)) {
    return {
      id: createRunId(input.rule.id, input.subjectKey, startedAt),
      ruleId: input.rule.id,
      ruleName: input.rule.name,
      trigger: input.rule.trigger,
      status: "skipped",
      startedAt,
      finishedAt: startedAt,
      subjectKey: input.subjectKey,
      decisionsCreated: [],
      notificationsCreated: [],
      actionsExecuted: [],
      error: null,
      skippedReason: "Outside organization/application scope",
    };
  }

  if (!evaluateConditions(input.rule.conditions, facts)) {
    return {
      id: createRunId(input.rule.id, input.subjectKey, startedAt),
      ruleId: input.rule.id,
      ruleName: input.rule.name,
      trigger: input.rule.trigger,
      status: "skipped",
      startedAt,
      finishedAt: startedAt,
      subjectKey: input.subjectKey,
      decisionsCreated: [],
      notificationsCreated: [],
      actionsExecuted: [],
      error: null,
      skippedReason: "Conditions not met",
    };
  }

  const decisionsCreated: string[] = [];
  const notificationsCreated: string[] = [];
  const actionsExecuted: string[] = [];
  let lastDecisionId: string | null = null;
  let error: string | null = null;
  let actionFailures = 0;

  for (const action of input.rule.actions) {
    try {
      const result = executeAction(action, {
        rule: input.rule,
        facts,
        subjectKey: input.subjectKey,
        actorUserId: input.actorUserId,
        now: input.now,
        lastDecisionId,
      });
      actionsExecuted.push(`${action.type}:${result.detail}`);
      if (result.decisionId) lastDecisionId = result.decisionId;
      if (result.createdDecision && result.decisionId) {
        decisionsCreated.push(result.decisionId);
      }
      if (result.notificationId) {
        notificationsCreated.push(result.notificationId);
      }
    } catch (err) {
      actionFailures += 1;
      error = err instanceof Error ? err.message : String(err);
      actionsExecuted.push(`${action.type}:FAILED:${error}`);
      break;
    }
  }

  const status =
    error == null
      ? "success"
      : actionsExecuted.some((a) => !a.includes(":FAILED:"))
        ? "partial"
        : "failed";

  return {
    id: createRunId(input.rule.id, input.subjectKey, startedAt),
    ruleId: input.rule.id,
    ruleName: input.rule.name,
    trigger: input.rule.trigger,
    status: actionFailures > 0 ? status : "success",
    startedAt,
    finishedAt: input.now,
    subjectKey: input.subjectKey,
    decisionsCreated,
    notificationsCreated,
    actionsExecuted,
    error,
    skippedReason: null,
  };
}

/** Core deterministic engine — reproducible given the same facts + registry. */
export function runAutomationEngine(
  input: RunAutomationInput
): AutomationBatchResult {
  const now = input.now ?? input.facts.observedAt ?? new Date().toISOString();
  const rules = selectRules({
    trigger: input.trigger,
    cadence: input.cadence,
  });

  const runs: AutomationRun[] = [];

  for (const rule of rules) {
    const subjects = expandTriggerSubjects(rule.trigger, input.facts);
    if (subjects.length === 0) {
      runs.push({
        id: createRunId(rule.id, "none", now),
        ruleId: rule.id,
        ruleName: rule.name,
        trigger: rule.trigger,
        status: "skipped",
        startedAt: now,
        finishedAt: now,
        subjectKey: null,
        decisionsCreated: [],
        notificationsCreated: [],
        actionsExecuted: [],
        error: null,
        skippedReason: "No trigger subjects in facts",
      });
      continue;
    }

    for (const subject of subjects) {
      runs.push(
        runRuleForSubject({
          rule,
          facts: input.facts,
          subjectKey: subject.key,
          subject: subject.subject,
          actorUserId: input.actorUserId,
          now,
        })
      );
    }
  }

  persistRuns(runs, input.facts);
  // retainRuns kept for API compat — listing is still limited by callers.
  void input.retainRuns;

  const decisionsCreated = runs.flatMap((r) => r.decisionsCreated);
  const notificationsCreated = runs.flatMap((r) => r.notificationsCreated);
  const failures = runs.filter(
    (r) => r.status === "failed" || r.status === "partial"
  ).length;

  return {
    trigger: input.trigger ?? (input.cadence ? "schedule" : "all"),
    cadence: input.cadence ?? null,
    ranAt: now,
    runs,
    decisionsCreated,
    notificationsCreated,
    failures,
  };
}
