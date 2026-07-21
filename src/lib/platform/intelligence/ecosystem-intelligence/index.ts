/**
 * Ecosystem Intelligence — Sprint 072 / 0.1.0 (federated org network)
 *
 * Permission-aware federation across organizations.
 * Soft-reads Digital Twin / Portfolio / Initiative lights — never bypasses tenant isolation.
 *
 * Distinct from Sprint 057 mid-pipeline `ecosystem` domain.
 * Factory is `createEcosystemFederation` (057 owns `createEcosystemIntelligence`).
 *
 * Module id: ecosystem-intelligence
 * Hard DAG predecessor: digital-twin
 */

export * from "@/lib/platform/intelligence/ecosystem-intelligence/types";
export * from "@/lib/platform/intelligence/ecosystem-intelligence/registry";
export * from "@/lib/platform/intelligence/ecosystem-intelligence/models/organization-node";
export * from "@/lib/platform/intelligence/ecosystem-intelligence/models/relationship";
export * from "@/lib/platform/intelligence/ecosystem-intelligence/models/governance";
export * from "@/lib/platform/intelligence/ecosystem-intelligence/models/ecosystem-model";
export * from "@/lib/platform/intelligence/ecosystem-intelligence/federation/permissions";
export * from "@/lib/platform/intelligence/ecosystem-intelligence/federation/summaries";
export * from "@/lib/platform/intelligence/ecosystem-intelligence/federation/tenants";
export * from "@/lib/platform/intelligence/ecosystem-intelligence/federation/synchronization";
export * from "@/lib/platform/intelligence/ecosystem-intelligence/engine/governance-engine";
export * from "@/lib/platform/intelligence/ecosystem-intelligence/engine/relationship-engine";
export * from "@/lib/platform/intelligence/ecosystem-intelligence/engine/aggregation-engine";
export * from "@/lib/platform/intelligence/ecosystem-intelligence/engine/federation-engine";
export * from "@/lib/platform/intelligence/ecosystem-intelligence/engine/ecosystem-engine";
export * from "@/lib/platform/intelligence/ecosystem-intelligence/services/ecosystem-service";

import { EcosystemFederationEngine } from "@/lib/platform/intelligence/ecosystem-intelligence/engine/ecosystem-engine";
import {
  EcosystemFederationService,
  type EcosystemFederationServiceDependencies,
} from "@/lib/platform/intelligence/ecosystem-intelligence/services/ecosystem-service";

export interface EcosystemFederationStack {
  service: EcosystemFederationService;
  engine: EcosystemFederationEngine;
}

export interface CreateEcosystemFederationOptions
  extends EcosystemFederationServiceDependencies {}

export function createEcosystemFederation(
  options: CreateEcosystemFederationOptions = {}
): EcosystemFederationStack {
  const engine =
    options.engine ??
    new EcosystemFederationEngine({
      createId: options.createId,
      now: options.now,
    });
  const service = new EcosystemFederationService({ ...options, engine });
  return { service, engine };
}

/** Alias for DI registration naming. */
export const createEcosystemIntelligenceFederation = createEcosystemFederation;
