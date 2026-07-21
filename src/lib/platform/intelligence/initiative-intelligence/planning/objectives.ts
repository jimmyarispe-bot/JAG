/**
 * Objective & outcome builders for initiatives.
 */

import type {
  InitiativeObjective,
  InitiativeOutcome,
} from "@/lib/platform/intelligence/initiative-intelligence/types";

export function buildObjective(
  createId: (prefix: string) => string,
  input: { title: string; summary: string; strategicTheme?: string }
): InitiativeObjective {
  return {
    id: createId("obj"),
    title: input.title,
    summary: input.summary,
    strategicTheme: input.strategicTheme,
  };
}

export function buildExpectedOutcomes(
  createId: (prefix: string) => string,
  summaries: string[]
): InitiativeOutcome[] {
  return summaries.map((summary, i) => ({
    id: createId(`outcome-${i}`),
    title: `Outcome ${i + 1}`,
    description: summary,
    successCriteria: [`Achieve: ${summary}`],
  }));
}
