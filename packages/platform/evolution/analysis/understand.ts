/**
 * Understanding — extract intent, outcome, problem, workflow, priority hints.
 */

import type { EvolutionCaptureRequest, EvolutionUnderstanding } from "../types";

function priorityHint(
  text: string
): EvolutionUnderstanding["priorityHint"] {
  const t = text.toLowerCase();
  if (/\b(critical|urgent|blocking|broken|outage)\b/.test(t)) return "critical";
  if (/\b(asap|high priority|must|need urgently)\b/.test(t)) return "high";
  if (/\b(nice to have|someday|optional|low)\b/.test(t)) return "low";
  return "medium";
}

function categoryHint(text: string): string {
  const t = text.toLowerCase();
  if (/\b(bug|broken|error|fail|crash)\b/.test(t)) return "defect";
  if (/\b(doc|documentation|readme|guide)\b/.test(t)) return "documentation";
  if (/\b(train|tutorial|lesson|academy|teach me)\b/.test(t)) return "training";
  if (/\b(automat|workflow|trigger|schedule)\b/.test(t)) return "automation";
  if (/\b(config|setting|preference|toggle)\b/.test(t)) return "configuration";
  if (/\b(platform|foundation|sdk|shared)\b/.test(t)) return "platform";
  if (/\b(innov|ai|new product|breakthrough)\b/.test(t)) return "innovation";
  return "enhancement";
}

function extractWorkflow(
  text: string,
  page: string | null,
  workflow: string | null
): string {
  if (workflow) return workflow;
  if (page) return `page:${page}`;
  const m = text.match(
    /\b(attendance|payroll|invoice|enrollment|invite|backup|report|connector|onboarding)\b/i
  );
  return m ? m[1]!.toLowerCase() : "general";
}

export function analyzeUnderstanding(
  request: EvolutionCaptureRequest
): EvolutionUnderstanding {
  const text = `${request.title}. ${request.description}`;
  const intent = request.title;
  const desiredOutcome = request.description
    .replace(/^(i wish you could|i wish jag|it would help if|i need)\s*/i, "")
    .trim();
  const businessProblem = `Users in role ${request.persona} want: ${desiredOutcome}`;
  const category = categoryHint(text);
  const priority = priorityHint(text);
  const confidenceBase =
    request.description.length > 40 ? 72 : request.description.length > 20 ? 58 : 42;
  const confidence = Math.min(
    95,
    confidenceBase + (request.page ? 8 : 0) + (request.workflow ? 6 : 0)
  );

  return {
    requestId: request.requestId,
    intent,
    desiredOutcome: desiredOutcome || request.title,
    businessProblem,
    affectedWorkflow: extractWorkflow(
      text,
      request.page,
      request.workflow
    ),
    priorityHint: priority,
    categoryHint: category,
    confidence,
  };
}
