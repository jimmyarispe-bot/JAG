/**
 * Executive Command Center service facade (Sprint 068).
 */

import { CommandCenterEngine } from "@/lib/platform/intelligence/executive-command-center/engine/command-center-engine";
import type {
  CommandCenterRequest,
  CommandCenterResult,
} from "@/lib/platform/intelligence/executive-command-center/types";

export interface CommandCenterServiceDependencies {
  engine?: CommandCenterEngine;
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export class ExecutiveCommandCenterService {
  private readonly engine: CommandCenterEngine;

  constructor(deps: CommandCenterServiceDependencies = {}) {
    this.engine =
      deps.engine ??
      new CommandCenterEngine({
        createId: deps.createId,
        now: deps.now,
      });
  }

  build(request: CommandCenterRequest): CommandCenterResult {
    return this.engine.build(request);
  }

  /** Alias — refresh workspace from latest pipeline soft-reads. */
  refresh(request: CommandCenterRequest): CommandCenterResult {
    return this.build(request);
  }
}
