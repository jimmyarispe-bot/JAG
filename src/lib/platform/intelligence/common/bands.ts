/**
 * Shared health / priority / confidence band mappers (Stabilization A2).
 *
 * Multiple semantic families exist across domains — use the matching helper.
 * Do not collapse them into one function without an explicit mode.
 */

/** Standard health status bands (0–100). */
export type StandardHealthStatus = "excellent" | "healthy" | "warning" | "critical";

/** Standard priority band labels shared by most domains. */
export type StandardPriorityBand = "critical" | "high" | "medium" | "low" | "monitor";

/** Standard confidence level labels. */
export type StandardConfidenceLevel = "high" | "medium" | "low" | "unknown";

/**
 * Family 1 — low score = urgency (majority of domains).
 * <35 critical, <50 high, <65 medium, <80 low, else monitor.
 */
export function priorityFromScoreLowUrgent(score: number): StandardPriorityBand {
  if (score < 35) return "critical";
  if (score < 50) return "high";
  if (score < 65) return "medium";
  if (score < 80) return "low";
  return "monitor";
}

/**
 * Family 2 — high score = healthy / low urgency
 * (board-governance, organization-dna, revenue, human-capital, funding).
 */
export function priorityFromScoreHighHealthy(score: number): StandardPriorityBand {
  if (score >= 85) return "monitor";
  if (score >= 70) return "low";
  if (score >= 55) return "medium";
  if (score >= 40) return "high";
  return "critical";
}

/**
 * Family 2b — high score = urgency
 * (opportunity, organizational-improvement).
 */
export function priorityFromScoreHighUrgent(score: number): StandardPriorityBand {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 55) return "medium";
  if (score >= 40) return "low";
  return "monitor";
}

/**
 * Family 3 — normalized 0–1, high score = urgency
 * (executive-graph, executive-decision, predictive).
 */
export function priorityBandFromScore01(score: number): StandardPriorityBand {
  if (score >= 0.85) return "critical";
  if (score >= 0.7) return "high";
  if (score >= 0.5) return "medium";
  if (score >= 0.3) return "low";
  return "monitor";
}

/** Risk 0–1 → priority (customer / market / funding pattern). */
export function priorityFromRisk(risk: number): StandardPriorityBand {
  if (risk >= 0.75) return "critical";
  if (risk >= 0.55) return "high";
  if (risk >= 0.35) return "medium";
  if (risk >= 0.2) return "low";
  return "monitor";
}

/** Standard status bands used by ~30 domains. */
export function statusFromScore(score: number): StandardHealthStatus {
  if (score >= 85) return "excellent";
  if (score >= 70) return "healthy";
  if (score >= 50) return "warning";
  return "critical";
}

/**
 * Area-factory signal status (75 / 60 thresholds) used by Sprint 046–060 factories.
 */
export function signalStatusFromScore(
  score: number
): "healthy" | "watch" | "at_risk" {
  if (score >= 75) return "healthy";
  if (score >= 60) return "watch";
  return "at_risk";
}

/** Confidence level — standard 0.8 / 0.55 / 0.3 thresholds. */
export function levelFromValue(value: number): StandardConfidenceLevel {
  if (value >= 0.8) return "high";
  if (value >= 0.55) return "medium";
  if (value >= 0.3) return "low";
  return "unknown";
}

/** Confidence level — funding variant (low band at 0.25). */
export function levelFromValueFunding(value: number): StandardConfidenceLevel {
  if (value >= 0.8) return "high";
  if (value >= 0.55) return "medium";
  if (value >= 0.25) return "low";
  return "unknown";
}

/** Confidence level — graph/decision/predictive (0.75 / 0.45 / >0). */
export function levelFromValue01(value: number): StandardConfidenceLevel {
  if (value >= 0.75) return "high";
  if (value >= 0.45) return "medium";
  if (value > 0) return "low";
  return "unknown";
}

/** Optional outlook band config for domain-specific label maps. */
export interface OutlookBandConfig<T extends string> {
  volatileLabel: T;
  volatilityGate?: number;
  high: { min: number; label: T };
  mid: { min: number; label: T };
  low: { min: number; label: T };
  fallback: T;
}

/**
 * Generic outlook mapper. Domains supply labels + thresholds.
 * Default volatility gate is 25 (late-domain convention).
 */
export function outlookFromScoreConfigured<T extends string>(
  score: number,
  volatility: number,
  config: OutlookBandConfig<T>
): T {
  const gate = config.volatilityGate ?? 25;
  if (volatility >= gate) return config.volatileLabel;
  if (score >= config.high.min) return config.high.label;
  if (score >= config.mid.min) return config.mid.label;
  if (score >= config.low.min) return config.low.label;
  return config.fallback;
}

/** Common late-domain outlook thresholds (78 / 62 / 45). */
export const OUTLOOK_THRESHOLDS_STANDARD = {
  high: 78,
  mid: 62,
  low: 45,
} as const;

/**
 * Elevated outlook thresholds (82 / 68 / 50) used by wisdom / collective /
 * ecosystem / resilience / institutional-memory.
 */
export const OUTLOOK_THRESHOLDS_ELEVATED = {
  high: 82,
  mid: 68,
  low: 50,
} as const;

/** @deprecated Alias — prefer OUTLOOK_THRESHOLDS_ELEVATED. */
export const OUTLOOK_THRESHOLDS_WISDOM = OUTLOOK_THRESHOLDS_ELEVATED;
