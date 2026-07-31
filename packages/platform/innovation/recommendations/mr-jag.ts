/**
 * Mr. JAG innovation highlight phrases (lives in Innovation; does not modify Mr. JAG).
 */

import type { InnovationCandidate, InnovationPattern } from "../types";

export function formatInnovationMrJagMessage(
  candidate: Pick<
    InnovationCandidate,
    "executiveSummary" | "financial" | "themes" | "problem"
  >,
  pattern?: InnovationPattern
): string {
  if (pattern?.kind === "workflow_bottleneck") {
    return `I found a recurring workflow bottleneck. ${candidate.executiveSummary}`;
  }
  if (
    pattern?.theme.includes("onboarding") ||
    candidate.themes.some((t) => t.includes("onboarding"))
  ) {
    return `I found opportunities to reduce onboarding time. ${candidate.executiveSummary}`;
  }
  if (candidate.financial.productivityGainHours >= 200) {
    return `I estimate a new automation could save ${candidate.financial.productivityGainHours} staff hours annually. ${candidate.executiveSummary}`;
  }
  return `I discovered a strategic opportunity: ${candidate.executiveSummary}`;
}

export function buildMrJagHighlights(
  candidates: readonly InnovationCandidate[],
  patterns: readonly InnovationPattern[]
): readonly string[] {
  const lines: string[] = [];
  const onboarding = patterns.filter((p) =>
    p.theme.toLowerCase().includes("onboarding")
  );
  if (onboarding.length > 0) {
    lines.push(
      `I found ${Math.min(3, onboarding.length)} opportunities to reduce onboarding time.`
    );
  }
  const bottlenecks = patterns.filter((p) => p.kind === "workflow_bottleneck");
  if (bottlenecks.length > 0) {
    lines.push("I found a recurring workflow bottleneck.");
  }
  const topHours = [...candidates].sort(
    (a, b) =>
      b.financial.productivityGainHours - a.financial.productivityGainHours
  )[0];
  if (topHours && topHours.financial.productivityGainHours >= 100) {
    lines.push(
      `I estimate a new automation could save ${topHours.financial.productivityGainHours} staff hours annually.`
    );
  }
  if (lines.length === 0 && candidates[0]) {
    lines.push(
      `I discovered ${candidates.length} evidence-backed innovation opportunities.`
    );
  }
  return Object.freeze(lines.slice(0, 5));
}
