/**
 * Initiative Intelligence service facade (Sprint 069).
 */

import { InitiativeEngine } from "@/lib/platform/intelligence/initiative-intelligence/engine/initiative-engine";
import type {
  Initiative,
  InitiativeLifecycleState,
  InitiativeOwnershipRole,
  InitiativeRequest,
  InitiativeResult,
} from "@/lib/platform/intelligence/initiative-intelligence/types";

export interface InitiativeServiceDependencies {
  engine?: InitiativeEngine;
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export class InitiativeIntelligenceService {
  private readonly engine: InitiativeEngine;

  constructor(deps: InitiativeServiceDependencies = {}) {
    this.engine =
      deps.engine ??
      new InitiativeEngine({
        createId: deps.createId,
        now: deps.now,
      });
  }

  build(request: InitiativeRequest): InitiativeResult {
    return this.engine.build(request);
  }

  transition(
    initiative: Initiative,
    to: InitiativeLifecycleState,
    actorRole: InitiativeOwnershipRole | "system" = "system",
    rationale?: string
  ): Initiative {
    return this.engine.transition(initiative, to, actorRole, rationale);
  }
}
