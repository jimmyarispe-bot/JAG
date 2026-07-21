import type {
  CopilotCompareItem,
  DecisionIntelligenceResultLight,
  ExecutivePredictiveResultLight,
} from "@/lib/platform/intelligence/executive-copilot/types";

export function compareRecommendations(
  decision?: DecisionIntelligenceResultLight
): CopilotCompareItem[] {
  const options = decision?.recommendation?.rankedOptions ?? [];
  return options.slice(0, 4).map((opt, i) => ({
    id: opt.id ?? `opt-${i}`,
    label: opt.title ?? `Option ${i + 1}`,
    summary: opt.summary ?? "No summary",
    score:
      opt.scorecard?.roi ??
      opt.scorecard?.overall ??
      Math.round((opt.confidence ?? 0.5) * 100),
    domains: [opt.category ?? "decision-intelligence"].filter(Boolean),
  }));
}

export function compareScenarios(
  predictive?: ExecutivePredictiveResultLight
): CopilotCompareItem[] {
  return (predictive?.scenarios ?? []).map((s, i) => ({
    id: s.kind ?? `scenario-${i}`,
    label: s.label ?? s.kind ?? `Scenario ${i + 1}`,
    summary: s.narrative ?? "No narrative",
    score: Math.round((s.overallOutlook ?? 0.5) * 100),
    domains: ["executive-predictive"],
  }));
}

export function formatComparison(items: CopilotCompareItem[]): string {
  if (items.length === 0) {
    return "No comparable items were available in the current intelligence context.";
  }
  const ranked = [...items].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const lines = ranked.map(
    (item, i) =>
      `${i + 1}. ${item.label}${item.score != null ? ` (score ${item.score})` : ""} — ${item.summary}`
  );
  const best = ranked[0];
  return `Comparison (${ranked.length} items). Highest ranked: ${best.label}. ${lines.join(" ")}`;
}
