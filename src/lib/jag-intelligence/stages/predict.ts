import type { EiEventSignal } from "@/lib/founder-intelligence/events";
import { generatePredictions } from "@/lib/founder-intelligence/predictions";

/** Stage 7 — Prediction */
export function stagePrediction(signals: EiEventSignal[], now = new Date()) {
  return generatePredictions(signals, now).map((p) => ({
    id: p.id,
    title: p.title,
    domain: p.domain as string,
    low: p.low,
    mid: p.mid,
    high: p.high,
    unit: p.unit,
    confidence: p.confidence,
    factors: p.factors,
  }));
}
