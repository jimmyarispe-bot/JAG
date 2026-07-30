/**
 * ReasoningChain builder — Sprint 208.
 */

import type { ReasoningStep } from "./types";
import type { ExplanationSubject } from "./ExplainabilityRegistry";

export function buildReasoningChain(
  subject: ExplanationSubject,
  relatedNodeIds: readonly string[]
): readonly ReasoningStep[] {
  const steps: ReasoningStep[] = [];
  let order = 1;

  steps.push({
    id: `step-${order}`,
    order: order++,
    title: "Subject identified",
    detail: `${subject.kind}: ${subject.title}`,
    nodeIds: [subject.id],
  });

  if (subject.evidence?.length) {
    steps.push({
      id: `step-${order}`,
      order: order++,
      title: "Evidence collected",
      detail: `${subject.evidence.length} evidence reference(s) bound to this finding.`,
      nodeIds: subject.evidence.map((e) => e.id).slice(0, 6),
    });
  }

  if (subject.forecasts?.length) {
    steps.push({
      id: `step-${order}`,
      order: order++,
      title: "Forecast inputs considered",
      detail: subject.forecasts.slice(0, 4).join("; "),
      nodeIds: relatedNodeIds.filter((id) => id.includes("forecast")).slice(0, 4),
    });
  }

  if (subject.scenarios?.length) {
    steps.push({
      id: `step-${order}`,
      order: order++,
      title: "Scenario assumptions reviewed",
      detail: subject.scenarios.slice(0, 4).join("; "),
      nodeIds: relatedNodeIds.filter((id) => id.includes("scenario")).slice(0, 4),
    });
  }

  if (subject.memory?.length) {
    steps.push({
      id: `step-${order}`,
      order: order++,
      title: "Institutional memory referenced",
      detail: subject.memory.slice(0, 4).join("; "),
      nodeIds: relatedNodeIds.filter((id) => id.includes("memory")).slice(0, 4),
    });
  }

  if (subject.goals?.length || subject.decisions?.length) {
    steps.push({
      id: `step-${order}`,
      order: order++,
      title: "Strategic / decision context linked",
      detail: [
        ...(subject.goals ?? []).slice(0, 2).map((g) => `Goal: ${g}`),
        ...(subject.decisions ?? []).slice(0, 2).map((d) => `Decision: ${d}`),
      ].join("; "),
      nodeIds: relatedNodeIds.slice(0, 6),
    });
  }

  if (subject.assumptions?.length) {
    steps.push({
      id: `step-${order}`,
      order: order++,
      title: "Assumptions stated",
      detail: subject.assumptions.slice(0, 4).join("; "),
      nodeIds: [],
    });
  }

  steps.push({
    id: `step-${order}`,
    order: order++,
    title: "Conclusion surfaced for executive attention",
    detail: subject.summary,
    nodeIds: [subject.id],
  });

  return steps;
}
