/**
 * Organizational Intelligence — forecasts.
 */

import {
  ORGANIZATION_FORECAST_DOMAINS,
  type OrganizationForecast,
  type OrganizationForecastDomain,
  type OrganizationMonitorReading,
  type OrganizationObservationRequest,
} from "@/lib/platform/intelligence/organization/types";

export interface OrganizationForecastsDependencies {
  createId?: (prefix: string) => string;
  horizonDays?: number;
}

/**
 * Predicts financial, academic, operational, staffing, capacity, and mission trends.
 */
export class OrganizationForecasts {
  private readonly createId: (prefix: string) => string;
  private readonly horizonDays: number;

  constructor(dependencies: OrganizationForecastsDependencies = {}) {
    this.createId =
      dependencies.createId ??
      ((prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
    this.horizonDays = dependencies.horizonDays ?? 90;
  }

  project(
    request: OrganizationObservationRequest,
    readings: readonly OrganizationMonitorReading[]
  ): OrganizationForecast[] {
    return ORGANIZATION_FORECAST_DOMAINS.map((domain) =>
      this.projectDomain(domain, request, readings)
    );
  }

  private projectDomain(
    domain: OrganizationForecastDomain,
    request: OrganizationObservationRequest,
    readings: readonly OrganizationMonitorReading[]
  ): OrganizationForecast {
    const monitor = domainToMonitor(domain);
    const reading = readings.find((r) => r.monitor === monitor);
    const currentValue = reading?.score ?? 70;
    const trend = inferTrend(reading);
    const projectedValue = Number(
      Math.max(
        0,
        Math.min(100, currentValue + trend * (this.horizonDays / 90) * 8)
      ).toFixed(2)
    );
    const direction =
      projectedValue > currentValue + 1
        ? "up"
        : projectedValue < currentValue - 1
          ? "down"
          : "flat";

    const memoryBoost = (request.memories?.length ?? 0) > 0 ? 0.05 : 0;
    const confidenceValue = Math.min(
      1,
      0.45 + (reading?.metrics.length ?? 0) * 0.08 + memoryBoost
    );

    return {
      forecastId: this.createId("forecast"),
      domain,
      horizonDays: this.horizonDays,
      projectedValue,
      currentValue,
      direction,
      confidence: {
        value: Number(confidenceValue.toFixed(4)),
        level:
          confidenceValue >= 0.75
            ? "high"
            : confidenceValue >= 0.45
              ? "medium"
              : "low",
        factors: [
          {
            key: "monitor_score",
            label: "Monitor Score",
            contribution: currentValue / 100,
          },
        ],
      },
      narrative: `${domain} forecast over ${this.horizonDays}d: ${currentValue} → ${projectedValue} (${direction}).`,
    };
  }
}

function domainToMonitor(
  domain: OrganizationForecastDomain
): OrganizationMonitorReading["monitor"] {
  switch (domain) {
    case "financial":
      return "finance";
    case "academic":
      return "academics";
    case "operational":
      return "operations";
    case "staffing":
      return "hr";
    case "capacity":
      return "enrollment";
    case "mission":
      return "mission";
    default: {
      const _exhaustive: never = domain;
      return _exhaustive;
    }
  }
}

function inferTrend(reading: OrganizationMonitorReading | undefined): number {
  if (!reading || reading.metrics.length === 0) return 0;
  let sum = 0;
  let count = 0;
  for (const metric of reading.metrics) {
    if (metric.previousValue === undefined) continue;
    sum += metric.value - metric.previousValue;
    count += 1;
  }
  if (count === 0) {
    return reading.score >= 75 ? 0.3 : reading.score < 50 ? -0.5 : 0;
  }
  return sum / count > 0 ? 1 : sum / count < 0 ? -1 : 0;
}
