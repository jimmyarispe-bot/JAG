/**
 * Organizational Digital Twin service facade (Sprint 071).
 */

import { TwinEngine } from "@/lib/platform/intelligence/digital-twin/engine/twin-engine";
import type {
  TwinRequest,
  TwinResult,
} from "@/lib/platform/intelligence/digital-twin/types";

export interface TwinServiceDependencies {
  engine?: TwinEngine;
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export class DigitalTwinService {
  private readonly engine: TwinEngine;

  constructor(deps: TwinServiceDependencies = {}) {
    this.engine =
      deps.engine ??
      new TwinEngine({
        createId: deps.createId,
        now: deps.now,
      });
  }

  build(request: TwinRequest): TwinResult {
    return this.engine.build(request);
  }

  /** Alias — re-run sandbox from latest soft-reads. */
  simulate(request: TwinRequest): TwinResult {
    return this.build(request);
  }
}
