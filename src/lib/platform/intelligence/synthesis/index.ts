/**
 * Executive Synthesis Intelligence — Sprint 061 / 0.1.0
 *
 * Reasoning layer above existing intelligence domains.
 * Soft-reads peer outputs via DomainSignalLight / WisdomResultLight.
 */

export * from "@/lib/platform/intelligence/synthesis/types";
export * from "@/lib/platform/intelligence/synthesis/registry";
export * from "@/lib/platform/intelligence/synthesis/analyzers";
export * from "@/lib/platform/intelligence/synthesis/scoring";
export * from "@/lib/platform/intelligence/synthesis/root-cause/root-cause-engine";
export * from "@/lib/platform/intelligence/synthesis/root-cause/evidence";
export * from "@/lib/platform/intelligence/synthesis/root-cause/confidence";
export * from "@/lib/platform/intelligence/synthesis/recommendations/recommendation-engine";
export * from "@/lib/platform/intelligence/synthesis/recommendations/executive-actions";
export * from "@/lib/platform/intelligence/synthesis/recommendations/impact-estimator";
export * from "@/lib/platform/intelligence/synthesis/briefing/briefing-generator";
export * from "@/lib/platform/intelligence/synthesis/briefing/overnight-summary";
export * from "@/lib/platform/intelligence/synthesis/briefing/executive-brief";
export * from "@/lib/platform/intelligence/synthesis/engine/execution-pipeline";
export * from "@/lib/platform/intelligence/synthesis/engine/synthesis-orchestrator";
export * from "@/lib/platform/intelligence/synthesis/engine/synthesis-engine";
export * from "@/lib/platform/intelligence/synthesis/service";

import { SynthesisEngine } from "@/lib/platform/intelligence/synthesis/engine/synthesis-engine";
import {
  SynthesisIntelligenceService,
  type SynthesisServiceDependencies,
} from "@/lib/platform/intelligence/synthesis/service";

export interface SynthesisStack {
  service: SynthesisIntelligenceService;
  engine: SynthesisEngine;
}

export interface CreateSynthesisOptions extends SynthesisServiceDependencies {}

export function createSynthesisIntelligence(
  options: CreateSynthesisOptions = {}
): SynthesisStack {
  const engine = options.engine ?? new SynthesisEngine(options);
  const service = new SynthesisIntelligenceService({ ...options, engine });
  return { service, engine };
}
