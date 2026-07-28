/**
 * Configurable Academy mastery / progression scales.
 * Defaults match Academy educational model; orgs may override.
 */

import type { MasteryLevel, MasteryScaleConfig } from "./types";
import { MASTERY_LEVELS } from "./types";

export const DEFAULT_MASTERY_SCALE: MasteryScaleConfig = Object.freeze({
  levels: MASTERY_LEVELS,
  progressions: Object.freeze([
    {
      domain: "Reading" as const,
      levels: Object.freeze([1, 2, 3]),
      label: "Reading Levels 1–3",
    },
    {
      domain: "Writing" as const,
      levels: Object.freeze([1, 2, 3]),
      label: "Writing Levels 1–3",
    },
    {
      domain: "Math" as const,
      levels: Object.freeze([1, 2, 3]),
      label: "Math Levels 1–3",
    },
    {
      domain: "Structured Literacy" as const,
      levels: Object.freeze([1, 2, 3, 4, 5]),
      steps: Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
      label: "Structured Literacy Levels 1–5 / Steps 1–10",
    },
  ]),
});

export function masteryRank(level: MasteryLevel): number {
  return MASTERY_LEVELS.indexOf(level);
}

export function isMasteryLevel(value: string): value is MasteryLevel {
  return (MASTERY_LEVELS as readonly string[]).includes(value);
}

export function validateProgression(
  config: MasteryScaleConfig,
  domain: string,
  level: number | null,
  step: number | null
): string | null {
  const prog = config.progressions.find((p) => p.domain === domain);
  if (!prog) return `Unknown progression domain: ${domain}`;
  if (level != null && !prog.levels.includes(level)) {
    return `${domain} level must be one of ${prog.levels.join(", ")}.`;
  }
  if (step != null) {
    if (!prog.steps) return `${domain} does not use steps.`;
    if (!prog.steps.includes(step)) {
      return `${domain} step must be one of ${prog.steps.join(", ")}.`;
    }
  }
  return null;
}
