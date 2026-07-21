import type {
  AutonomousResultLight,
  DecisionIntelligenceResultLight,
} from "@/lib/platform/intelligence/executive-copilot/types";

export function recommendAnswer(
  decision?: DecisionIntelligenceResultLight
): { summary: string; topOptionId: string | null; uncertainties: string[] } {
  const ranked = decision?.recommendation?.rankedOptions ?? [];
  if (ranked.length === 0) {
    return {
      summary:
        "No Decision Intelligence recommendations are available yet. Generate options before asking for ROI ranking.",
      topOptionId: null,
      uncertainties: ["Missing decision context"],
    };
  }

  const scored = [...ranked].sort((a, b) => {
    const sa = a.scorecard?.roi ?? a.scorecard?.overall ?? (a.confidence ?? 0) * 100;
    const sb = b.scorecard?.roi ?? b.scorecard?.overall ?? (b.confidence ?? 0) * 100;
    return sb - sa;
  });
  const top = scored[0];
  const roi = top.scorecard?.roi ?? top.scorecard?.overall;
  return {
    summary: `Highest expected ROI / impact option: ${top.title}${roi != null ? ` (score ${roi})` : ""}. ${top.summary ?? ""} Alternatives considered: ${scored
      .slice(1, 3)
      .map((o) => o.title)
      .join(", ") || "none"}.`,
    topOptionId: top.id ?? null,
    uncertainties: [
      "ROI scores are advisory planning signals from Decision Intelligence.",
    ],
  };
}

export function executionPlanRefs(autonomous?: AutonomousResultLight): Array<{
  planId: string;
  optionTitle: string;
  readiness: string;
  humanAuthorizationRequired: true;
  autoExecute: false;
}> {
  return (autonomous?.plans ?? []).map((p) => ({
    planId: p.id ?? "plan-unknown",
    optionTitle: p.optionTitle ?? p.objective ?? "Plan",
    readiness: p.readiness ?? "waiting_approval",
    humanAuthorizationRequired: true as const,
    autoExecute: false as const,
  }));
}
