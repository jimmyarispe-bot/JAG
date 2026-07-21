import type { SynthesizedInsight } from "@/lib/platform/intelligence/synthesis/types";

export function buildOvernightSummary(insights: SynthesizedInsight[]): string {
  if (!insights.length) {
    return "Overnight synthesis found no actionable cross-domain clusters. Monitoring continues.";
  }
  const top = insights[0];
  return `Overnight synthesis: ${top.title}. Priority ${top.scores.priority}. ${top.summary}`;
}
