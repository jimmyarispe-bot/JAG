import type { EiEventSignal } from "./events";
import { countByDomain, domainForEvent, severityRank } from "./events";
import {
  FOUNDER_DOMAINS,
  type DomainHealthScore,
  type FounderDomain,
  type TrendDirection,
} from "./types";

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function trendFromDelta(delta: number): TrendDirection {
  if (delta > 2) return "up";
  if (delta < -2) return "down";
  return "stable";
}

/**
 * Domain health scoring from EI event mix.
 * Baseline 78; adverse events subtract, healthy lifecycle events add.
 */
export function scoreDomainHealth(
  domain: FounderDomain,
  signals: EiEventSignal[],
  now = new Date()
): DomainHealthScore {
  const scoped =
    domain === "organization"
      ? signals
      : signals.filter((s) => domainForEvent(s.eventType, s.moduleKey) === domain);

  let score = 78;
  const factors: string[] = [];

  if (scoped.length === 0) {
    factors.push("Limited recent activity — confidence reduced");
    return {
      domain,
      score: 72,
      trend: "stable",
      confidence: 0.45,
      factors,
      lastUpdated: now.toISOString(),
    };
  }

  let adverse = 0;
  let positive = 0;
  for (const s of scoped) {
    const rank = severityRank(s.eventType, s.classification);
    if (rank >= 75) {
      adverse += 1;
      score -= 4;
    } else if (rank <= 40) {
      positive += 1;
      score += 1.5;
    }
  }

  if (adverse > 0) factors.push(`${adverse} elevated-severity signal(s)`);
  if (positive > 0) factors.push(`${positive} healthy lifecycle signal(s)`);
  factors.push(`${scoped.length} events in analysis window`);

  const midpoint = Math.floor(scoped.length / 2) || 1;
  const recentAvg =
    scoped.slice(0, midpoint).reduce((a, s) => a + severityRank(s.eventType, s.classification), 0) /
    midpoint;
  const olderAvg =
    scoped.slice(midpoint).reduce((a, s) => a + severityRank(s.eventType, s.classification), 0) /
    Math.max(1, scoped.length - midpoint);
  // Lower severity rank recently = improving health
  const trend = trendFromDelta(olderAvg - recentAvg);

  const confidence = clamp(40 + scoped.length * 2 + (adverse + positive) * 3, 40, 95) / 100;

  return {
    domain,
    score: clamp(score),
    trend,
    confidence: Math.round(confidence * 100) / 100,
    factors,
    lastUpdated: now.toISOString(),
  };
}

export function scoreAllDomains(signals: EiEventSignal[], now = new Date()): DomainHealthScore[] {
  return FOUNDER_DOMAINS.filter((d) => d !== "organization").map((d) =>
    scoreDomainHealth(d, signals, now)
  );
}

export function scoreOverallHealth(
  domainScores: DomainHealthScore[],
  signals: EiEventSignal[],
  now = new Date()
): DomainHealthScore {
  if (!domainScores.length) {
    return scoreDomainHealth("organization", signals, now);
  }
  const avg =
    domainScores.reduce((a, d) => a + d.score, 0) / domainScores.length;
  const counts = countByDomain(signals);
  const weak = domainScores.filter((d) => d.score < 60).map((d) => d.domain);
  const factors = [
    `Average of ${domainScores.length} domain scores`,
    `${counts.organization} total EI signals analyzed`,
  ];
  if (weak.length) factors.push(`Weak domains: ${weak.join(", ")}`);

  const down = domainScores.filter((d) => d.trend === "down").length;
  const up = domainScores.filter((d) => d.trend === "up").length;
  const trend: TrendDirection =
    down > up + 1 ? "down" : up > down + 1 ? "up" : "stable";

  return {
    domain: "organization",
    score: clamp(avg - weak.length * 3),
    trend,
    confidence: clamp(
      (domainScores.reduce((a, d) => a + d.confidence, 0) / domainScores.length) * 100,
      40,
      95
    ) / 100,
    factors,
    lastUpdated: now.toISOString(),
  };
}
