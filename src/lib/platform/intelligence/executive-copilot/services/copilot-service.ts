/**
 * Executive Copilot service facade (Sprint 067).
 */

import { CopilotEngine } from "@/lib/platform/intelligence/executive-copilot/engine/copilot-engine";
import type {
  CopilotRequest,
  CopilotResult,
} from "@/lib/platform/intelligence/executive-copilot/types";

export interface CopilotServiceDependencies {
  engine?: CopilotEngine;
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export class ExecutiveCopilotService {
  private readonly engine: CopilotEngine;

  constructor(deps: CopilotServiceDependencies = {}) {
    this.engine =
      deps.engine ??
      new CopilotEngine({
        createId: deps.createId,
        now: deps.now,
      });
  }

  build(request: CopilotRequest): CopilotResult {
    return this.engine.answer(request);
  }

  ask(request: CopilotRequest): CopilotResult {
    return this.build(request);
  }
}
