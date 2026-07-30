/**
 * Executive workflow matrix — Sprint 209.
 * Ordered chain: Evidence → … → Explainability.
 * Lightweight, deterministic probes — no network.
 */

import { searchEvidence } from "@/lib/evidence-center";
import {
  EDUCATION_KNOWLEDGE_MODEL,
  createEducationPolicyEngine,
  validateEducationKnowledgeModel,
} from "@/lib/domains/education";
import { ExplanationService } from "@/lib/platform/intelligence/explain/index";
import { WatcherService } from "@/lib/platform/intelligence/watchers/index";
import { askExecutiveConversation } from "../conversation/engine";
import { loadConversationWorkspace } from "../conversation/query";
import {
  getDecisionOutcome,
  getDecisionExecutionHistory,
} from "../decision-center/execution-store";
import { loadDecisionCenter } from "../decision-center/query";
import { loadMemoryWorkspace } from "../memory/load-memory";
import { loadForecastsView } from "../predictive/load-forecasts";
import { loadScenarioPlanner } from "../scenarios/load-scenarios";
import { loadStrategyWorkspace } from "../strategy/load-strategy";
import type { ValidationCheckResult, WorkflowLink } from "./types";

function ok(detail: string): ValidationCheckResult {
  return { ok: true, detail };
}

function fail(detail: string): ValidationCheckResult {
  return { ok: false, detail };
}

function isFn(value: unknown): boolean {
  return typeof value === "function";
}

function isObj(value: unknown): boolean {
  return typeof value === "object" && value !== null;
}

function probeEvidence(): ValidationCheckResult {
  if (!isFn(searchEvidence)) {
    return fail("Evidence Center searchEvidence is not available.");
  }
  return ok("Evidence Center searchEvidence is callable.");
}

function probeKnowledge(): ValidationCheckResult {
  if (!EDUCATION_KNOWLEDGE_MODEL || !isFn(validateEducationKnowledgeModel)) {
    return fail("Education knowledge model is not available.");
  }
  const result = validateEducationKnowledgeModel(EDUCATION_KNOWLEDGE_MODEL);
  if (!result.ok) {
    return fail(`Knowledge model validation failed (${result.errors?.length ?? 0} error(s)).`);
  }
  return ok(
    `Knowledge model valid — ${EDUCATION_KNOWLEDGE_MODEL.entities.length} entities.`
  );
}

function probePolicies(): ValidationCheckResult {
  if (!isFn(createEducationPolicyEngine)) {
    return fail("Education policy engine factory is not available.");
  }
  const engine = createEducationPolicyEngine();
  const list = engine.registry().list();
  return ok(`Policy engine ready — ${list.length} registered policy definition(s).`);
}

function probeForecasts(): ValidationCheckResult {
  if (!isFn(loadForecastsView)) {
    return fail("loadForecastsView is not available.");
  }
  return ok("Predictive forecasts loader is callable.");
}

function probeScenarios(): ValidationCheckResult {
  if (!isFn(loadScenarioPlanner)) {
    return fail("loadScenarioPlanner is not available.");
  }
  return ok("Scenario planner loader is callable.");
}

function probeConversation(): ValidationCheckResult {
  if (!isFn(askExecutiveConversation) || !isFn(loadConversationWorkspace)) {
    return fail("Conversation engine or workspace loader is missing.");
  }
  return ok("Executive conversation engine and workspace loader are callable.");
}

function probeDecision(): ValidationCheckResult {
  if (!isFn(loadDecisionCenter)) {
    return fail("loadDecisionCenter is not available.");
  }
  return ok("Decision Center loader is callable.");
}

function probeExecution(): ValidationCheckResult {
  if (!isFn(getDecisionExecutionHistory)) {
    return fail("Decision execution history API is not available.");
  }
  return ok("Decision execution history API is callable.");
}

function probeOutcome(): ValidationCheckResult {
  if (!isFn(getDecisionOutcome)) {
    return fail("Decision outcome API is not available.");
  }
  return ok("Decision outcome API is callable.");
}

function probeMemory(): ValidationCheckResult {
  if (!isFn(loadMemoryWorkspace)) {
    return fail("loadMemoryWorkspace is not available.");
  }
  return ok("Organizational memory workspace loader is callable.");
}

function probeStrategy(): ValidationCheckResult {
  if (!isFn(loadStrategyWorkspace)) {
    return fail("loadStrategyWorkspace is not available.");
  }
  return ok("Strategic intelligence workspace loader is callable.");
}

function probeWatchers(): ValidationCheckResult {
  if (!isObj(WatcherService) || !isFn(WatcherService.evaluate)) {
    return fail("WatcherService.evaluate is not available.");
  }
  return ok("WatcherService is available with evaluate().");
}

function probeExplainability(): ValidationCheckResult {
  if (
    !isObj(ExplanationService) ||
    !isFn(ExplanationService.explainSubject) ||
    !isFn(ExplanationService.queryGraph)
  ) {
    return fail(
      "ExplanationService explainSubject/queryGraph is not available."
    );
  }
  return ok(
    "ExplanationService is available with explainSubject() and queryGraph()."
  );
}

function combine(
  fromLabel: string,
  toLabel: string,
  a: ValidationCheckResult,
  b: ValidationCheckResult
): ValidationCheckResult {
  if (!a.ok) return fail(`${fromLabel}: ${a.detail}`);
  if (!b.ok) return fail(`${toLabel}: ${b.detail}`);
  return ok(`${fromLabel} → ${toLabel}: both sides available.`);
}

/**
 * Ordered executive workflow links (consecutive stages).
 */
export const WORKFLOW_MATRIX: readonly WorkflowLink[] = [
  {
    id: "evidence-to-knowledge",
    from: "Evidence",
    to: "Knowledge",
    hrefs: ["/jag/evidence", "/jag/knowledge"],
    validate: () =>
      combine("Evidence", "Knowledge", probeEvidence(), probeKnowledge()),
  },
  {
    id: "knowledge-to-policies",
    from: "Knowledge",
    to: "Policies",
    hrefs: ["/jag/knowledge", "/jag/policies"],
    validate: () =>
      combine("Knowledge", "Policies", probeKnowledge(), probePolicies()),
  },
  {
    id: "policies-to-forecasts",
    from: "Policies",
    to: "Forecasts",
    hrefs: ["/jag/policies", "/jag"],
    validate: () =>
      combine("Policies", "Forecasts", probePolicies(), probeForecasts()),
  },
  {
    id: "forecasts-to-scenarios",
    from: "Forecasts",
    to: "Scenarios",
    hrefs: ["/jag", "/jag/scenarios"],
    validate: () =>
      combine("Forecasts", "Scenarios", probeForecasts(), probeScenarios()),
  },
  {
    id: "scenarios-to-conversation",
    from: "Scenarios",
    to: "Conversation",
    hrefs: ["/jag/scenarios", "/jag/chat"],
    validate: () =>
      combine(
        "Scenarios",
        "Conversation",
        probeScenarios(),
        probeConversation()
      ),
  },
  {
    id: "conversation-to-decision",
    from: "Conversation",
    to: "Decision",
    hrefs: ["/jag/chat", "/jag/decisions"],
    validate: () =>
      combine(
        "Conversation",
        "Decision",
        probeConversation(),
        probeDecision()
      ),
  },
  {
    id: "decision-to-execution",
    from: "Decision",
    to: "Execution",
    hrefs: ["/jag/decisions"],
    validate: () =>
      combine("Decision", "Execution", probeDecision(), probeExecution()),
  },
  {
    id: "execution-to-outcome",
    from: "Execution",
    to: "Outcome",
    hrefs: ["/jag/decisions"],
    validate: () =>
      combine("Execution", "Outcome", probeExecution(), probeOutcome()),
  },
  {
    id: "outcome-to-memory",
    from: "Outcome",
    to: "Memory",
    hrefs: ["/jag/decisions", "/jag/memory"],
    validate: () =>
      combine("Outcome", "Memory", probeOutcome(), probeMemory()),
  },
  {
    id: "memory-to-strategy",
    from: "Memory",
    to: "Strategy",
    hrefs: ["/jag/memory", "/jag/strategy"],
    validate: () =>
      combine("Memory", "Strategy", probeMemory(), probeStrategy()),
  },
  {
    id: "strategy-to-watchers",
    from: "Strategy",
    to: "Watchers",
    hrefs: ["/jag/strategy", "/jag/inbox"],
    validate: () =>
      combine("Strategy", "Watchers", probeStrategy(), probeWatchers()),
  },
  {
    id: "watchers-to-explainability",
    from: "Watchers",
    to: "Explainability",
    hrefs: ["/jag/inbox", "/jag/graph"],
    validate: () =>
      combine(
        "Watchers",
        "Explainability",
        probeWatchers(),
        probeExplainability()
      ),
  },
] as const;

/** Stage labels in executive order (for docs / UI). */
export const WORKFLOW_STAGES: readonly string[] = [
  "Evidence",
  "Knowledge",
  "Policies",
  "Forecasts",
  "Scenarios",
  "Conversation",
  "Decision",
  "Execution",
  "Outcome",
  "Memory",
  "Strategy",
  "Watchers",
  "Explainability",
] as const;

export function runWorkflowMatrix(): readonly {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly hrefs: readonly string[];
  readonly ok: boolean;
  readonly detail: string;
}[] {
  return WORKFLOW_MATRIX.map((link) => {
    const result = link.validate();
    return {
      id: link.id,
      from: link.from,
      to: link.to,
      hrefs: link.hrefs,
      ok: result.ok,
      detail: result.detail,
    };
  });
}
