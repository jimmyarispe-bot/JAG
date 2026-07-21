/**
 * Scenario analysis engine (Sprint 065).
 */

import { clamp01 } from "@/lib/platform/intelligence/executive-predictive/confidence/confidence";
import {
  BEST_CASE_KIND,
  BEST_CASE_LABEL,
  BEST_CASE_MAGNITUDE,
  bestCaseNarrative,
} from "@/lib/platform/intelligence/executive-predictive/scenarios/best-case";
import {
  customCaseNarrative,
  CUSTOM_CASE_KIND,
} from "@/lib/platform/intelligence/executive-predictive/scenarios/custom";
import {
  EXPECTED_CASE_KIND,
  EXPECTED_CASE_LABEL,
  EXPECTED_CASE_MAGNITUDE,
  expectedCaseNarrative,
} from "@/lib/platform/intelligence/executive-predictive/scenarios/expected";
import {
  WORST_CASE_KIND,
  WORST_CASE_LABEL,
  WORST_CASE_MAGNITUDE,
  worstCaseNarrative,
} from "@/lib/platform/intelligence/executive-predictive/scenarios/worst-case";
import type {
  OrganizationalForecast,
  ScenarioKind,
  ScenarioProjection,
} from "@/lib/platform/intelligence/executive-predictive/types";

export interface ScenarioEngineDeps {
  createId?: (prefix: string) => string;
}

function applyMagnitude(
  forecasts: OrganizationalForecast[],
  magnitude: number
): ScenarioProjection["forecasts"] {
  return forecasts.map((f) => {
    const adj = f.baselineValue * magnitude;
    // Operations: higher workload is worse — invert magnitude sign for outlook later
    const projectedValue = f.projectedValue + adj;
    return {
      subject: f.subject,
      projectedValue,
      delta: projectedValue - f.baselineValue,
    };
  });
}

function outlookScore(
  kind: ScenarioKind,
  forecasts: ScenarioProjection["forecasts"]
): number {
  const enrollment = forecasts.find((f) => f.subject === "enrollment");
  const cash = forecasts.find((f) => f.subject === "cash");
  const ops = forecasts.find((f) => f.subject === "operations");
  let score = 0.5;
  if (enrollment) score += Math.sign(enrollment.delta) * 0.12;
  if (cash) score += Math.sign(cash.delta) * 0.12;
  if (ops) score -= Math.sign(ops.delta) * 0.08;
  if (kind === "best") score += 0.15;
  if (kind === "worst") score -= 0.15;
  return clamp01(score);
}

export class ScenarioEngine {
  private readonly createId: (prefix: string) => string;

  constructor(deps: ScenarioEngineDeps = {}) {
    let seq = 0;
    this.createId = deps.createId ?? ((p) => `${p}-${++seq}`);
  }

  buildScenarios(input: {
    forecasts: OrganizationalForecast[];
    periodLabel?: string;
    custom?: { label: string; magnitude?: number; narrative?: string };
    baseConfidence?: number;
  }): ScenarioProjection[] {
    const period = input.periodLabel ?? "the planning horizon";
    const conf = input.baseConfidence ?? 0.55;
    const defs: Array<{
      kind: ScenarioKind;
      label: string;
      magnitude: number;
      narrative: string;
      probability: number;
    }> = [
      {
        kind: BEST_CASE_KIND,
        label: BEST_CASE_LABEL,
        magnitude: BEST_CASE_MAGNITUDE,
        narrative: bestCaseNarrative(period),
        probability: 0.2,
      },
      {
        kind: EXPECTED_CASE_KIND,
        label: EXPECTED_CASE_LABEL,
        magnitude: EXPECTED_CASE_MAGNITUDE,
        narrative: expectedCaseNarrative(period),
        probability: 0.55,
      },
      {
        kind: WORST_CASE_KIND,
        label: WORST_CASE_LABEL,
        magnitude: WORST_CASE_MAGNITUDE,
        narrative: worstCaseNarrative(period),
        probability: 0.25,
      },
    ];

    if (input.custom) {
      defs.push({
        kind: CUSTOM_CASE_KIND,
        label: input.custom.label,
        magnitude: input.custom.magnitude ?? 0.05,
        narrative: customCaseNarrative(
          input.custom.label,
          period,
          input.custom.narrative
        ),
        probability: 0.15,
      });
    }

    return defs.map((d) => {
      const forecasts = applyMagnitude(input.forecasts, d.magnitude);
      return {
        id: this.createId(`scenario-${d.kind}`),
        kind: d.kind,
        label: d.label,
        narrative: d.narrative,
        probability: d.probability,
        forecasts,
        overallOutlook: outlookScore(d.kind, forecasts),
        confidence: clamp01(
          conf * (d.kind === "expected" ? 1 : d.kind === "custom" ? 0.85 : 0.9)
        ),
      };
    });
  }
}
