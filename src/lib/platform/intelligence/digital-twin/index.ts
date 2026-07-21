/**
 * Organizational Digital Twin — Sprint 071 / 0.1.0
 *
 * Living strategic sandbox for simulating organizational change before execution.
 * Soft-reads Portfolio / Initiative / Predictive intelligence — no production mutation.
 *
 * Distinct from frozen OIOS foundation `OrganizationalDigitalTwin` (Sprint 031).
 *
 * Module id: digital-twin
 * Hard DAG predecessor: portfolio-intelligence
 */

export * from "@/lib/platform/intelligence/digital-twin/types";
export * from "@/lib/platform/intelligence/digital-twin/registry";
export * from "@/lib/platform/intelligence/digital-twin/models/organization-model";
export * from "@/lib/platform/intelligence/digital-twin/models/capacity-model";
export * from "@/lib/platform/intelligence/digital-twin/models/resource-model";
export * from "@/lib/platform/intelligence/digital-twin/models/dependency-model";
export * from "@/lib/platform/intelligence/digital-twin/scenarios/staffing";
export * from "@/lib/platform/intelligence/digital-twin/scenarios/finance";
export * from "@/lib/platform/intelligence/digital-twin/scenarios/enrollment";
export * from "@/lib/platform/intelligence/digital-twin/scenarios/facilities";
export * from "@/lib/platform/intelligence/digital-twin/scenarios/operations";
export * from "@/lib/platform/intelligence/digital-twin/scenarios/custom";
export * from "@/lib/platform/intelligence/digital-twin/engine/state-engine";
export * from "@/lib/platform/intelligence/digital-twin/engine/constraint-engine";
export * from "@/lib/platform/intelligence/digital-twin/engine/impact-engine";
export * from "@/lib/platform/intelligence/digital-twin/engine/simulation-engine";
export * from "@/lib/platform/intelligence/digital-twin/engine/twin-engine";
export * from "@/lib/platform/intelligence/digital-twin/services/twin-service";

import { TwinEngine } from "@/lib/platform/intelligence/digital-twin/engine/twin-engine";
import {
  DigitalTwinService,
  type TwinServiceDependencies,
} from "@/lib/platform/intelligence/digital-twin/services/twin-service";

export interface DigitalTwinStack {
  service: DigitalTwinService;
  engine: TwinEngine;
}

export interface CreateDigitalTwinOptions extends TwinServiceDependencies {}

export function createDigitalTwin(
  options: CreateDigitalTwinOptions = {}
): DigitalTwinStack {
  const engine =
    options.engine ??
    new TwinEngine({
      createId: options.createId,
      now: options.now,
    });
  const service = new DigitalTwinService({ ...options, engine });
  return { service, engine };
}

export const createDigitalTwinIntelligence = createDigitalTwin;
export const createOrganizationalDigitalTwinIntelligence = createDigitalTwin;
