import type {
  DomainSignalLight,
  SynthesisHorizon,
  SynthesisPriority,
  SynthesisScores,
} from "@/lib/platform/intelligence/synthesis/types";

export function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

export function average(values: number[], fallback = 50): number {
  if (!values.length) return fallback;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function priorityFromScores(severity: number, urgency: number, impact: number): SynthesisPriority {
  const composite = average([severity, urgency, impact]);
  if (composite >= 85 || (severity >= 90 && urgency >= 80)) return "critical";
  if (composite >= 70) return "high";
  if (composite >= 50) return "medium";
  if (composite >= 30) return "low";
  return "informational";
}

export function horizonFromUrgency(urgency: number): SynthesisHorizon {
  if (urgency >= 80) return "immediate";
  if (urgency >= 60) return "near_term";
  if (urgency >= 40) return "medium_term";
  return "long_term";
}

export function scoreSignals(signals: DomainSignalLight[]): SynthesisScores {
  const scores = signals.map((s) => clamp(s.score ?? s.healthScore?.value ?? 50));
  const down = signals.filter((s) => s.direction === "down").length;
  const up = signals.filter((s) => s.direction === "up").length;
  const severity = clamp(down > 0 ? 55 + down * 12 : average(scores.map((v) => 100 - v), 40));
  const urgency = clamp(40 + down * 15 - up * 5);
  const confidence = clamp(signals.length ? 45 + Math.min(signals.length, 8) * 6 : 35);
  const financialImpact = clamp(
    average(
      signals
        .filter((s) => /finance|revenue|funding|accounting|cash/i.test(s.domain))
        .map((s) => 100 - (s.score ?? 50)),
      severity * 0.7
    )
  );
  const operationalImpact = clamp(
    average(
      signals
        .filter((s) => /operations|human-capital|staff|teacher|resilience|systems/i.test(s.domain))
        .map((s) => 100 - (s.score ?? 50)),
      severity * 0.65
    )
  );
  const businessImpact = clamp(average([financialImpact, operationalImpact, severity]));
  const strategicAlignment = clamp(
    55 + (signals.some((s) => /wisdom|executive|strategy/i.test(s.domain)) ? 15 : 0)
  );

  return {
    severity: Math.round(severity),
    urgency: Math.round(urgency),
    confidence: Math.round(confidence),
    businessImpact: Math.round(businessImpact),
    financialImpact: Math.round(financialImpact),
    operationalImpact: Math.round(operationalImpact),
    strategicAlignment: Math.round(strategicAlignment),
    priority: priorityFromScores(severity, urgency, businessImpact),
    timeHorizon: horizonFromUrgency(urgency),
  };
}
