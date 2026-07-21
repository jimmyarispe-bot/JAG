/**
 * Autonomous Intelligence service facade (Sprint 066).
 */

import { AutonomousEngine } from "@/lib/platform/intelligence/executive-autonomous/engine/autonomous-engine";
import type {
  AutonomousRequest,
  AutonomousResult,
} from "@/lib/platform/intelligence/executive-autonomous/types";

export interface AutonomousServiceDependencies {
  engine?: AutonomousEngine;
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export class ExecutiveAutonomousService {
  private readonly engine: AutonomousEngine;

  constructor(deps: AutonomousServiceDependencies = {}) {
    this.engine =
      deps.engine ??
      new AutonomousEngine({
        createId: deps.createId,
        now: deps.now,
      });
  }

  build(request: AutonomousRequest): AutonomousResult {
    return this.engine.prepare(request);
  }

  /** Alias for pipeline / DI callers. */
  prepare(request: AutonomousRequest): AutonomousResult {
    return this.build(request);
  }
}
