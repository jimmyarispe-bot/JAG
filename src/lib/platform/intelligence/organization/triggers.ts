/**
 * Organizational Intelligence — triggers.
 */

import type {
  OrganizationMonitorReading,
  OrganizationObservationRequest,
  OrganizationTriggerHit,
} from "@/lib/platform/intelligence/organization/types";

export interface OrganizationTriggerDefinition {
  readonly triggerId: string;
  readonly name: string;
  readonly monitor: OrganizationTriggerHit["monitor"];
  readonly condition: string;
  readonly severity: OrganizationTriggerHit["severity"];
  readonly matches: (reading: OrganizationMonitorReading) => boolean;
}

export interface OrganizationTriggersDependencies {
  definitions?: readonly OrganizationTriggerDefinition[];
  now?: () => Date;
}

const DEFAULT_TRIGGERS: readonly OrganizationTriggerDefinition[] = [
  {
    triggerId: "cash-critical",
    name: "Cash critical",
    monitor: "cash_flow",
    condition: "cash_flow status is critical",
    severity: "critical",
    matches: (reading) =>
      reading.monitor === "cash_flow" && reading.status === "critical",
  },
  {
    triggerId: "execution-at-risk",
    name: "Goal execution at risk",
    monitor: "goal_execution",
    condition: "goal_execution score < 50",
    severity: "high",
    matches: (reading) =>
      reading.monitor === "goal_execution" && reading.score < 50,
  },
  {
    triggerId: "compliance-open",
    name: "Compliance findings elevated",
    monitor: "compliance",
    condition: "compliance status high or critical",
    severity: "high",
    matches: (reading) =>
      reading.monitor === "compliance" &&
      (reading.status === "high" || reading.status === "critical"),
  },
];

/**
 * Evaluates configurable monitoring triggers.
 */
export class OrganizationTriggers {
  private readonly definitions: readonly OrganizationTriggerDefinition[];
  private readonly now: () => Date;

  constructor(dependencies: OrganizationTriggersDependencies = {}) {
    this.definitions = dependencies.definitions ?? DEFAULT_TRIGGERS;
    this.now = dependencies.now ?? (() => new Date());
  }

  evaluate(
    request: OrganizationObservationRequest,
    readings: readonly OrganizationMonitorReading[]
  ): OrganizationTriggerHit[] {
    const firedAt = request.observedAt ?? this.now().toISOString();
    const hits: OrganizationTriggerHit[] = [];

    for (const definition of this.definitions) {
      const reading = readings.find((r) => r.monitor === definition.monitor);
      if (!reading) continue;
      if (!definition.matches(reading)) continue;
      hits.push({
        triggerId: definition.triggerId,
        name: definition.name,
        monitor: definition.monitor,
        condition: definition.condition,
        severity: definition.severity,
        firedAt,
      });
    }

    return hits;
  }
}
