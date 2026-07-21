import type { MetricCard, SynthesisResultLight } from "@/lib/platform/intelligence/briefing/types";
import { cardActions } from "@/lib/platform/intelligence/briefing/cards/actions";
import { computePriorityScore } from "@/lib/platform/intelligence/briefing/cards/priority";

export function buildOrganizationHealthMetric(
  synthesis: SynthesisResultLight | undefined,
  createId: (prefix: string) => string
): MetricCard | null {
  const value = synthesis?.healthScore?.value ?? synthesis?.brief?.confidenceSummary?.overall;
  if (value == null) return null;

  const label = synthesis?.healthScore?.label ?? (value >= 70 ? "stable" : value >= 45 ? "watch" : "elevated_risk");
  const direction = value >= 70 ? "up" : value < 50 ? "down" : "flat";
  const severity = Math.round(100 - value);
  const urgency = severity;
  const confidence = synthesis?.brief?.confidenceSummary?.overall ?? 55;

  return {
    id: createId("metric-health"),
    kind: "metric",
    metricKey: "organization_health",
    title: "Organization Health",
    summary: `Organization health is ${label} at ${Math.round(value)}/100.`,
    value: Math.round(value),
    label,
    direction,
    priorityScore: computePriorityScore({
      severity,
      urgency,
      confidence,
      businessImpact: severity,
      strategicAlignment: 70,
    }),
    severity,
    urgency,
    confidence,
    businessImpact: severity,
    strategicAlignment: 70,
    domains: synthesis?.contributingDomains ?? ["synthesis"],
    explainability: {
      why: "Organization health is derived from Executive Synthesis health scoring across contributing domains.",
      contributingDomains: synthesis?.contributingDomains ?? ["synthesis"],
      confidence,
      supportingEvidence: [
        {
          id: createId("metric-ev"),
          domain: "synthesis",
          statement: `Health score ${Math.round(value)} (${label})`,
          weight: 0.9,
          supporting: true,
        },
      ],
    },
    actions: cardActions("metric"),
  };
}
