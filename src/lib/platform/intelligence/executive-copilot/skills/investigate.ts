import type {
  BriefingResultLight,
  CopilotInvestigation,
  DecisionIntelligenceResultLight,
  ExecutiveMemoryResultLight,
  ExecutivePredictiveResultLight,
  SynthesisResultLight,
} from "@/lib/platform/intelligence/executive-copilot/types";

export function investigateTopic(input: {
  topic: string;
  synthesis?: SynthesisResultLight;
  briefing?: BriefingResultLight;
  memory?: ExecutiveMemoryResultLight;
  decision?: DecisionIntelligenceResultLight;
  predictive?: ExecutivePredictiveResultLight;
}): CopilotInvestigation {
  const signals: string[] = [];
  for (const c of input.synthesis?.correlations?.slice(0, 3) ?? []) {
    signals.push(c.summary ?? c.title ?? "Correlation signal");
  }
  for (const s of input.predictive?.emergingSignals?.slice(0, 3) ?? []) {
    signals.push(s.narrative ?? s.title ?? "Emerging signal");
  }
  if (input.briefing?.overnight?.newRisks?.length) {
    signals.push(...input.briefing.overnight.newRisks.slice(0, 2));
  }

  const risks = (input.briefing?.briefing?.sections?.topRisks ?? [])
    .slice(0, 4)
    .map((r) => r.summary ?? r.title ?? "Risk");

  const opportunities = (input.briefing?.briefing?.sections?.topOpportunities ?? [])
    .slice(0, 3)
    .map((o) => o.summary ?? o.title ?? "Opportunity");

  const historicalDecisions = (input.memory?.decisions ?? [])
    .slice(0, 4)
    .map(
      (d) =>
        `${d.title ?? "Decision"}${d.actualOutcome ? ` → ${d.actualOutcome}` : d.expectedOutcome ? ` (expected: ${d.expectedOutcome})` : ""}`
    );

  const predictions = [
    ...(input.predictive?.forecasts ?? [])
      .slice(0, 3)
      .map(
        (f) =>
          `${f.subject ?? "forecast"} (${f.horizon ?? "horizon"}): ${f.direction ?? "mixed"}`
      ),
    ...(input.predictive?.scenarios ?? [])
      .slice(0, 2)
      .map((s) => s.narrative ?? s.label ?? "Scenario"),
  ];

  const recommendedNextSteps = (input.decision?.recommendation?.rankedOptions ?? [])
    .slice(0, 3)
    .map((o) => o.title ?? o.summary ?? "Next step");

  if (recommendedNextSteps.length === 0 && input.synthesis?.recommendations?.length) {
    recommendedNextSteps.push(
      ...input.synthesis.recommendations.slice(0, 3).map((r) => r.title ?? r.summary ?? "Step")
    );
  }

  if (signals.length === 0) signals.push("No strong signals attached — broaden context.");
  if (risks.length === 0) risks.push("No top risks in current briefing.");
  if (recommendedNextSteps.length === 0) {
    recommendedNextSteps.push("Request a Decision Intelligence recommendation for this topic.");
  }

  return {
    topic: input.topic,
    signals,
    risks,
    opportunities,
    historicalDecisions,
    predictions,
    recommendedNextSteps,
  };
}

export function formatInvestigation(inv: CopilotInvestigation): string {
  return [
    `Investigation: ${inv.topic}.`,
    `Signals: ${inv.signals.slice(0, 3).join("; ")}.`,
    `Risks: ${inv.risks.slice(0, 3).join("; ")}.`,
    inv.opportunities.length
      ? `Opportunities: ${inv.opportunities.slice(0, 2).join("; ")}.`
      : null,
    inv.historicalDecisions.length
      ? `History: ${inv.historicalDecisions.slice(0, 2).join("; ")}.`
      : null,
    inv.predictions.length
      ? `Outlook: ${inv.predictions.slice(0, 2).join("; ")}.`
      : null,
    `Next steps: ${inv.recommendedNextSteps.slice(0, 3).join("; ")}.`,
  ]
    .filter(Boolean)
    .join(" ");
}
