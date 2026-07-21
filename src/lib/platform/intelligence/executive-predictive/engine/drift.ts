/**
 * Forecast drift / calibration feedback (Sprint 065).
 */

import { clamp01 } from "@/lib/platform/intelligence/executive-predictive/confidence/confidence";
import type {
  DriftObservation,
  DriftReport,
  ForecastSubject,
  OrganizationalForecast,
} from "@/lib/platform/intelligence/executive-predictive/types";

export interface DriftEngineDeps {
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export class DriftEngine {
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;

  constructor(deps: DriftEngineDeps = {}) {
    let seq = 0;
    this.createId = deps.createId ?? ((p) => `${p}-${++seq}`);
    this.now = deps.now ?? (() => new Date());
  }

  evaluate(input: {
    forecasts: OrganizationalForecast[];
    actuals?: Array<{ subject: ForecastSubject | string; value: number; at?: string }>;
  }): DriftReport {
    const actuals = input.actuals ?? [];
    const observations: DriftObservation[] = [];

    for (const actual of actuals) {
      const forecast = input.forecasts.find((f) => f.subject === actual.subject);
      if (!forecast) continue;
      const error = forecast.projectedValue - actual.value;
      observations.push({
        id: this.createId("drift"),
        subject: actual.subject,
        forecastValue: forecast.projectedValue,
        actualValue: actual.value,
        error,
        absoluteError: Math.abs(error),
        at: actual.at ?? this.now().toISOString(),
        confidenceWas: forecast.confidence,
      });
    }

    if (observations.length === 0) {
      return {
        observations: [],
        meanAbsoluteError: 0,
        bias: 0,
        calibrationNote:
          "No actuals supplied — drift monitoring idle. Attach outcomes to calibrate confidence.",
        degrading: false,
      };
    }

    const mae =
      observations.reduce((s, o) => s + o.absoluteError, 0) / observations.length;
    const bias =
      observations.reduce((s, o) => s + o.error, 0) / observations.length;
    const avgConf =
      observations.reduce((s, o) => s + o.confidenceWas, 0) / observations.length;
    const relativeMae =
      observations.reduce((s, o) => {
        const denom = Math.abs(o.actualValue) || 1;
        return s + o.absoluteError / denom;
      }, 0) / observations.length;

    const overconfident = avgConf > 0.65 && relativeMae > 0.12;
    const degrading = relativeMae > 0.15 || overconfident;

    return {
      observations,
      meanAbsoluteError: mae,
      bias,
      calibrationNote: overconfident
        ? "Forecasts were overconfident relative to realized error — reduce confidence or widen scenario bands."
        : relativeMae < 0.08
          ? "Forecast error is within a tight band — confidence appears reasonably calibrated."
          : "Moderate forecast error — continue monitoring and refresh historical series.",
      degrading,
    };
  }

  /** Helper for tests / callers that only need relative error score. */
  relativeErrorScore(mae: number, scale: number): number {
    return clamp01(mae / (Math.abs(scale) || 1));
  }
}
