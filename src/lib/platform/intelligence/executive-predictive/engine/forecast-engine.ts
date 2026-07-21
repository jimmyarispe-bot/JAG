/**
 * Organizational forecasting engine (Sprint 065).
 */

import {
  forecastConfidence,
  hasContradictorySignals,
  horizonDays,
  signalAgreement,
} from "@/lib/platform/intelligence/executive-predictive/confidence/confidence";
import { buildExplainability } from "@/lib/platform/intelligence/executive-predictive/explainability/explain";
import { complianceSlope } from "@/lib/platform/intelligence/executive-predictive/forecasting/compliance";
import { enrollmentSlope } from "@/lib/platform/intelligence/executive-predictive/forecasting/enrollment";
import {
  cashSlope,
  revenueSlope,
} from "@/lib/platform/intelligence/executive-predictive/forecasting/finance";
import {
  operationsSlope,
  retentionSlope,
  satisfactionSlope,
} from "@/lib/platform/intelligence/executive-predictive/forecasting/operations";
import {
  directionFor,
  resolveBaseline,
  subjectSignals,
  trendSlope,
} from "@/lib/platform/intelligence/executive-predictive/forecasting/shared";
import { staffingSlope } from "@/lib/platform/intelligence/executive-predictive/forecasting/staffing";
import type {
  BriefingResultLight,
  ForecastHorizon,
  ForecastPoint,
  ForecastSubject,
  HistoricalSignal,
  OrganizationalForecast,
  PredictionEvidence,
} from "@/lib/platform/intelligence/executive-predictive/types";
import { FORECAST_SUBJECTS } from "@/lib/platform/intelligence/executive-predictive/types";

export interface ForecastEngineDeps {
  createId?: (prefix: string) => string;
  now?: () => Date;
}

function slopeFor(subject: ForecastSubject, signals: HistoricalSignal[]): number {
  switch (subject) {
    case "enrollment":
      return enrollmentSlope(signals);
    case "revenue":
      return revenueSlope(signals);
    case "cash":
      return cashSlope(signals);
    case "staffing":
      return staffingSlope(signals);
    case "retention":
      return retentionSlope(signals);
    case "parent_satisfaction":
      return satisfactionSlope(signals);
    case "operations":
      return operationsSlope(signals);
    case "compliance":
      return complianceSlope(signals);
    default:
      return trendSlope(subjectSignals(subject, signals));
  }
}

function currentEvidence(
  subject: ForecastSubject,
  briefing?: BriefingResultLight
): PredictionEvidence[] {
  const out: PredictionEvidence[] = [];
  const risks = briefing?.briefing?.sections?.topRisks ?? [];
  for (const r of risks.slice(0, 3)) {
    const domains = r.domains ?? [];
    if (
      domains.length === 0 ||
      domains.some((d) => d.includes(subject) || subject.includes(d.split(".")[0] ?? ""))
    ) {
      out.push({
        id: `cur-risk-${r.title ?? out.length}`,
        statement: r.summary ?? r.title ?? "Current risk signal",
        source: "current_signal",
        supporting: false,
        weight: (r.severity ?? 50) / 100,
        domain: domains[0],
      });
    }
  }
  const overnight = briefing?.overnight;
  if (overnight?.newRisks?.length) {
    out.push({
      id: "cur-overnight",
      statement: overnight.newRisks[0] ?? overnight.summary ?? "Overnight risk movement",
      source: "current_signal",
      supporting: false,
      weight: 0.55,
    });
  }
  return out;
}

export class ForecastEngine {
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;

  constructor(deps: ForecastEngineDeps = {}) {
    let seq = 0;
    this.createId = deps.createId ?? ((p) => `${p}-${++seq}`);
    this.now = deps.now ?? (() => new Date());
  }

  forecastSubject(input: {
    subject: ForecastSubject;
    horizon: ForecastHorizon;
    signals: HistoricalSignal[];
    briefing?: BriefingResultLight;
  }): OrganizationalForecast {
    const baseline = resolveBaseline(input.subject, input.signals, this.createId);
    const relevant = subjectSignals(input.subject, input.signals);
    const slope = slopeFor(input.subject, input.signals);
    const scale = horizonDays(input.horizon) / 90;
    const delta = baseline.value * slope * scale;
    const projected = baseline.value + delta;

    const points: ForecastPoint[] = (["30d", "90d", "180d", "365d"] as ForecastHorizon[]).map(
      (h) => {
        const s = horizonDays(h) / 90;
        const d = baseline.value * slope * s;
        return {
          horizon: h,
          value: baseline.value + d,
          delta: d,
          unit: baseline.unit,
        };
      }
    );

    const current = currentEvidence(input.subject, input.briefing);
    const confidence = forecastConfidence({
      historyCount: relevant.length,
      horizon: input.horizon,
      signalAgreement: signalAgreement(relevant),
      contradictory: hasContradictorySignals(relevant),
    });

    const explainability = buildExplainability({
      subject: input.subject,
      horizon: input.horizon,
      why: `Extrapolating ${input.subject} over ${input.horizon} from ${relevant.length} historical signal(s) and current organizational context.`,
      historical: relevant,
      current,
      assumptions: baseline.assumptions,
      baseConfidence: confidence,
    });

    return {
      id: this.createId(`forecast-${input.subject}`),
      subject: input.subject,
      horizon: input.horizon,
      baselineValue: baseline.value,
      projectedValue: projected,
      delta,
      unit: baseline.unit,
      direction: directionFor(input.subject, delta),
      confidence,
      assumptions: baseline.assumptions,
      evidence: [...explainability.historicalEvidence, ...current],
      explainability,
      points,
      generatedAt: this.now().toISOString(),
    };
  }

  forecastAll(input: {
    horizon?: ForecastHorizon;
    signals: HistoricalSignal[];
    briefing?: BriefingResultLight;
  }): OrganizationalForecast[] {
    const horizon = input.horizon ?? "90d";
    return FORECAST_SUBJECTS.map((subject) =>
      this.forecastSubject({
        subject,
        horizon,
        signals: input.signals,
        briefing: input.briefing,
      })
    );
  }
}
