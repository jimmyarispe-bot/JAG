/**
 * Executive Copilot — Sprint 067 / 0.1.0
 *
 * Conversational strategic reasoning layer over the Executive Cognitive Stack.
 * Orchestrates existing domains; never duplicates their engines or auto-executes.
 *
 * Module id: executive-copilot
 * Hard DAG predecessor: executive-autonomous
 */

export * from "@/lib/platform/intelligence/executive-copilot/types";
export * from "@/lib/platform/intelligence/executive-copilot/planners/retrieval-plan";
export * from "@/lib/platform/intelligence/executive-copilot/planners/reasoning-plan";
export * from "@/lib/platform/intelligence/executive-copilot/planners/execution-plan";
export * from "@/lib/platform/intelligence/executive-copilot/context/assemble";
export * from "@/lib/platform/intelligence/executive-copilot/prompts/follow-ups";
export * from "@/lib/platform/intelligence/executive-copilot/skills/explain";
export * from "@/lib/platform/intelligence/executive-copilot/skills/summarize";
export * from "@/lib/platform/intelligence/executive-copilot/skills/compare";
export * from "@/lib/platform/intelligence/executive-copilot/skills/investigate";
export * from "@/lib/platform/intelligence/executive-copilot/skills/forecast";
export * from "@/lib/platform/intelligence/executive-copilot/skills/recommend";
export * from "@/lib/platform/intelligence/executive-copilot/engine/context-builder";
export * from "@/lib/platform/intelligence/executive-copilot/engine/conversation-engine";
export * from "@/lib/platform/intelligence/executive-copilot/engine/response-orchestrator";
export * from "@/lib/platform/intelligence/executive-copilot/engine/copilot-engine";
export * from "@/lib/platform/intelligence/executive-copilot/services/copilot-service";

import { CopilotEngine } from "@/lib/platform/intelligence/executive-copilot/engine/copilot-engine";
import {
  ExecutiveCopilotService,
  type CopilotServiceDependencies,
} from "@/lib/platform/intelligence/executive-copilot/services/copilot-service";

export interface ExecutiveCopilotStack {
  service: ExecutiveCopilotService;
  engine: CopilotEngine;
}

export interface CreateExecutiveCopilotOptions extends CopilotServiceDependencies {}

export function createExecutiveCopilotIntelligence(
  options: CreateExecutiveCopilotOptions = {}
): ExecutiveCopilotStack {
  const engine =
    options.engine ??
    new CopilotEngine({
      createId: options.createId,
      now: options.now,
    });
  const service = new ExecutiveCopilotService({ ...options, engine });
  return { service, engine };
}

