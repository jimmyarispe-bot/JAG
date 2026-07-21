import type {
  BriefingResultLight,
  DecisionIntelligenceResultLight,
  ExecutivePredictiveResultLight,
  SynthesisResultLight,
} from "@/lib/platform/intelligence/executive-copilot/types";

export function summarizeContext(input: {
  periodLabel?: string;
  synthesis?: SynthesisResultLight;
  briefing?: BriefingResultLight;
  decision?: DecisionIntelligenceResultLight;
  predictive?: ExecutivePredictiveResultLight;
}): string {
  const period = input.periodLabel ?? "the current period";
  const lines: string[] = [`Executive summary for ${period}:`];

  const brief =
    input.briefing?.briefing?.sections?.executiveSummary ??
    input.synthesis?.brief?.executiveSummary;
  if (brief) lines.push(brief);

  const health = input.briefing?.healthScore ?? input.predictive?.healthScore;
  if (health?.label) {
    lines.push(`Organizational outlook: ${health.label}${health.value != null ? ` (${health.value})` : ""}.`);
  }

  const topRisk = input.briefing?.briefing?.sections?.topRisks?.[0];
  if (topRisk?.title) {
    lines.push(`Top risk: ${topRisk.title}${topRisk.summary ? ` — ${topRisk.summary}` : ""}.`);
  }

  const rec = input.decision?.recommendation;
  if (rec?.rankedOptions?.[0]) {
    lines.push(
      `Leading recommendation: ${rec.rankedOptions[0].title}${rec.rankedOptions[0].summary ? ` — ${rec.rankedOptions[0].summary}` : ""}.`
    );
  }

  const signal = input.predictive?.emergingSignals?.[0];
  if (signal?.title) {
    lines.push(`Emerging signal: ${signal.title}.`);
  }

  if (lines.length === 1) {
    lines.push("Upstream intelligence context is sparse — no consolidated brief available yet.");
  }

  return lines.join(" ");
}
