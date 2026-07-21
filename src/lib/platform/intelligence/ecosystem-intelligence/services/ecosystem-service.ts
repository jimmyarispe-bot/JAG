import { EcosystemFederationEngine } from "@/lib/platform/intelligence/ecosystem-intelligence/engine/ecosystem-engine";
import type {
  EcosystemFederationRequest,
  EcosystemFederationResult,
} from "@/lib/platform/intelligence/ecosystem-intelligence/types";

export interface EcosystemFederationServiceDependencies {
  engine?: EcosystemFederationEngine;
  createId?: (prefix: string) => string;
  now?: () => Date;
}

/** Facade — name avoids Sprint 057 `EcosystemIntelligenceService`. */
export class EcosystemFederationService {
  private readonly engine: EcosystemFederationEngine;

  constructor(deps: EcosystemFederationServiceDependencies = {}) {
    this.engine =
      deps.engine ??
      new EcosystemFederationEngine({
        createId: deps.createId,
        now: deps.now,
      });
  }

  build(request: EcosystemFederationRequest): EcosystemFederationResult {
    return this.engine.build(request);
  }

  federate(request: EcosystemFederationRequest): EcosystemFederationResult {
    return this.build(request);
  }
}
