/**
 * Executive Briefing Intelligence — Sprint 062 / 0.1.0
 *
 * Transforms Executive Synthesis outputs into actionable executive briefings.
 * Soft-reads synthesis via SynthesisResultLight. Hard DAG predecessor: synthesis.
 */

export * from "@/lib/platform/intelligence/briefing/types";
export * from "@/lib/platform/intelligence/briefing/registry";
export * from "@/lib/platform/intelligence/briefing/cards";
export * from "@/lib/platform/intelligence/briefing/timeline";
export * from "@/lib/platform/intelligence/briefing/personalization";
export * from "@/lib/platform/intelligence/briefing/engine/summary-engine";
export * from "@/lib/platform/intelligence/briefing/engine/briefing-generator";
export * from "@/lib/platform/intelligence/briefing/engine/briefing-engine";
export * from "@/lib/platform/intelligence/briefing/services/briefing-service";

import { BriefingEngine } from "@/lib/platform/intelligence/briefing/engine/briefing-engine";
import {
  BriefingIntelligenceService,
  type BriefingServiceDependencies,
} from "@/lib/platform/intelligence/briefing/services/briefing-service";

export interface BriefingStack {
  service: BriefingIntelligenceService;
  engine: BriefingEngine;
}

export interface CreateBriefingOptions extends BriefingServiceDependencies {}

export function createBriefingIntelligence(
  options: CreateBriefingOptions = {}
): BriefingStack {
  const engine = options.engine ?? new BriefingEngine(options);
  const service = new BriefingIntelligenceService({ ...options, engine });
  return { service, engine };
}
