/**
 * Platform infrastructure registration.
 *
 * Integrations is a peer of Intelligence, Security, Identity, and Observability.
 * It is NOT an intelligence domain and is NOT part of the intelligence DAG.
 */

import {
  INTEGRATION_PLATFORM_VERSION,
  type PlatformInfrastructurePillar,
} from "@/lib/platform/integrations/types";

export const PLATFORM_INFRASTRUCTURE_PILLARS: readonly PlatformInfrastructurePillar[] = [
  {
    id: "intelligence",
    name: "Intelligence",
    version: "1.0.0",
    description: "Organizational intelligence operating system and domain modules",
    intelligenceDag: true,
  },
  {
    id: "integrations",
    name: "Integrations",
    version: INTEGRATION_PLATFORM_VERSION,
    description:
      "Integration Platform Core — connector contract, auth, sync, normalization, events",
    intelligenceDag: false,
  },
  {
    id: "security",
    name: "Security",
    version: "1.0.0",
    description: "Security policies, authorization boundaries, and audit controls",
    intelligenceDag: false,
  },
  {
    id: "identity",
    name: "Identity",
    version: "1.0.0",
    description: "Identity, IAM, and tenant isolation",
    intelligenceDag: false,
  },
  {
    id: "observability",
    name: "Observability",
    version: "1.0.0",
    description: "Metrics, tracing, RUM, and operational telemetry",
    intelligenceDag: false,
  },
] as const;

export class PlatformInfrastructureRegistry {
  private readonly pillars = new Map<
    PlatformInfrastructurePillar["id"],
    PlatformInfrastructurePillar
  >();

  constructor(initial: readonly PlatformInfrastructurePillar[] = PLATFORM_INFRASTRUCTURE_PILLARS) {
    for (const pillar of initial) {
      this.register(pillar);
    }
  }

  register(pillar: PlatformInfrastructurePillar): void {
    this.pillars.set(pillar.id, pillar);
  }

  get(id: PlatformInfrastructurePillar["id"]): PlatformInfrastructurePillar | null {
    return this.pillars.get(id) ?? null;
  }

  list(): PlatformInfrastructurePillar[] {
    return [...this.pillars.values()];
  }

  /** Integrations must never appear as an intelligence DAG module. */
  assertIntegrationsIndependent(): void {
    const integrations = this.require("integrations");
    if (integrations.intelligenceDag) {
      throw new Error("Integrations must not be registered on the intelligence DAG");
    }
  }

  require(id: PlatformInfrastructurePillar["id"]): PlatformInfrastructurePillar {
    const pillar = this.get(id);
    if (!pillar) {
      throw new Error(`Unknown platform infrastructure pillar: ${id}`);
    }
    return pillar;
  }
}

export function createPlatformInfrastructureRegistry(): PlatformInfrastructureRegistry {
  return new PlatformInfrastructureRegistry();
}

/** Descriptor used when attaching Integrations to the OIOS platform shell. */
export const INTEGRATIONS_PLATFORM_DESCRIPTOR = {
  pillarId: "integrations" as const,
  packageId: "integration-platform-core",
  version: INTEGRATION_PLATFORM_VERSION,
  intelligenceDag: false,
  path: "src/lib/platform/integrations",
};
