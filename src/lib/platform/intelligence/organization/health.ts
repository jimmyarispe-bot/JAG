/**
 * Organizational Intelligence — health score.
 */

import type {
  OrganizationHealthBand,
  OrganizationHealthScore,
  OrganizationMonitorKey,
  OrganizationMonitorReading,
  OrganizationObservationRequest,
} from "@/lib/platform/intelligence/organization/types";

export interface OrganizationHealthDependencies {
  now?: () => Date;
}

/**
 * Calculates organization-wide health from monitor readings.
 */
export class OrganizationHealth {
  private readonly now: () => Date;

  constructor(dependencies: OrganizationHealthDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date());
  }

  calculate(
    request: OrganizationObservationRequest,
    readings: readonly OrganizationMonitorReading[]
  ): OrganizationHealthScore {
    const monitorScores: Partial<Record<OrganizationMonitorKey, number>> = {};
    let total = 0;
    for (const reading of readings) {
      monitorScores[reading.monitor] = reading.score;
      total += reading.score;
    }
    const average =
      readings.length === 0 ? 70 : Math.round(total / readings.length);

    let adjusted = average;
    if ((request.executionProgress ?? []).some((p) => p.healthLabel === "critical")) {
      adjusted -= 8;
    }
    if (request.collaboration && request.collaboration.confidence.uncertainty > 0.5) {
      adjusted -= 4;
    }
    if ((request.memories?.length ?? 0) > 0) {
      adjusted += 2;
    }

    const score = Math.max(0, Math.min(100, adjusted));
    const band = bandFor(score);

    return {
      score,
      band,
      monitorScores,
      summary: `Organization health ${score}/100 (${band}) across ${readings.length} monitor(s).`,
      calculatedAt: request.observedAt ?? this.now().toISOString(),
    };
  }
}

function bandFor(score: number): OrganizationHealthBand {
  if (score >= 90) return "excellent";
  if (score >= 75) return "healthy";
  if (score >= 60) return "watch";
  if (score >= 40) return "at_risk";
  return "critical";
}
