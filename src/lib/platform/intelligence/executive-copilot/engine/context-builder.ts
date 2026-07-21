/**
 * Context builder facade (Sprint 067).
 */

import { assembleContext, type AssembledContext } from "@/lib/platform/intelligence/executive-copilot/context/assemble";
import type { CopilotRequest } from "@/lib/platform/intelligence/executive-copilot/types";

export class ContextBuilder {
  build(request: CopilotRequest): AssembledContext {
    return assembleContext(request);
  }
}
