/**
 * Intelligence Platform Infrastructure - Executive Synthesis module adapter (Sprint 061).
 *
 * Wraps createSynthesisIntelligence — reasoning layer after wisdom;
 * briefing (062) soft-reads this module's context output.
 * Soft-reads wisdom and upstream domain lights. Does not modify
 * wisdom/ or other prior intelligence packages.
 */

import {
  createSynthesisIntelligence,
  SYNTHESIS_INTELLIGENCE_VERSION,
  type CreateSynthesisOptions,
  type SynthesisStack,
  type DomainSignalLight,
  type WisdomResultLight,
} from "@/lib/platform/intelligence/synthesis";
import type {
  IntelligenceExecutionContext,
  IntelligenceModule,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import { createModuleResult } from "@/lib/platform/intelligence/infrastructure/module-result";

const CONTEXT_KEYS: Array<{ key: string; domain: string }> = [
  { key: "executive", domain: "executive" },
  { key: "financial", domain: "finance" },
  { key: "revenue", domain: "revenue" },
  { key: "funding", domain: "funding" },
  { key: "humanCapital", domain: "human-capital" },
  { key: "operations", domain: "operations" },
  { key: "customer", domain: "customer" },
  { key: "knowledge", domain: "knowledge" },
  { key: "innovation", domain: "innovation" },
  { key: "economic", domain: "economic" },
  { key: "competitive", domain: "competitive" },
  { key: "political", domain: "political" },
  { key: "environmental", domain: "environmental" },
  { key: "behavioral", domain: "behavioral" },
  { key: "cultural", domain: "cultural" },
  { key: "ethical", domain: "ethical" },
  { key: "reputation", domain: "reputation" },
  { key: "stakeholder", domain: "stakeholder" },
  { key: "systems", domain: "systems" },
  { key: "resilience", domain: "resilience" },
  { key: "wisdom", domain: "wisdom" },
];

export function createSynthesisModule(
  options: CreateSynthesisOptions = {},
  stack?: SynthesisStack
): IntelligenceModule {
  const synthesis =
    stack ??
    createSynthesisIntelligence({
      ...options,
    });

  return {
    id: "synthesis",
    name: "Executive Synthesis Intelligence",
    version: SYNTHESIS_INTELLIGENCE_VERSION,
    dependencies: ["wisdom"],
    capabilities: [
      { key: "synthesis.correlation", description: "Cross-domain signal correlation" },
      { key: "synthesis.root_cause", description: "Multi-domain root-cause analysis" },
      { key: "synthesis.prioritization", description: "Executive priority scoring" },
      { key: "synthesis.opportunities", description: "Opportunity detection across domains" },
      { key: "synthesis.recommendations", description: "Executive recommendations with impact" },
      { key: "synthesis.contradictions", description: "Conflicting intelligence detection" },
      { key: "synthesis.brief", description: "Reusable Executive Brief generation" },
      { key: "synthesis.explainability", description: "Why / evidence / confidence on every insight" },
    ],
    async execute(context: IntelligenceExecutionContext) {
      const startedAt = new Date().toISOString();
      try {
        const input = context.input as
          | { question?: string; periodLabel?: string; signals?: DomainSignalLight[] }
          | undefined;

        const signals: DomainSignalLight[] = [...(input?.signals ?? [])];
        for (const { key, domain } of CONTEXT_KEYS) {
          if (signals.some((s) => s.domain === domain)) continue;
          const light = toSignalLight(context.get<Record<string, unknown>>(key), domain);
          if (light) signals.push(light);
        }

        const wisdomRaw = context.get<{
          healthScore?: { value?: number };
          wisdomScore?: { value?: number };
          outlook?: string;
          headline?: string;
          requestId?: string;
        }>("wisdom");
        const wisdomResult: WisdomResultLight | undefined = wisdomRaw
          ? {
              requestId: wisdomRaw.requestId,
              healthScore: wisdomRaw.healthScore,
              wisdomScore: wisdomRaw.wisdomScore,
              outlook: wisdomRaw.outlook,
              headline: wisdomRaw.headline,
            }
          : undefined;

        const result = synthesis.service.build({
          requestId: context.runId,
          question:
            input?.question ??
            "What does the organization mean across finance, people, operations, and customer signals?",
          periodLabel: input?.periodLabel,
          scope: {
            organizationId: context.scope.organizationId ?? null,
            schoolId: context.scope.schoolId ?? null,
          },
          signals,
          wisdomResult,
        });

        context.set("synthesis", result);
        return createModuleResult({
          moduleId: "synthesis",
          context,
          startedAt,
          ok: true,
          data: result,
        });
      } catch (error) {
        return createModuleResult({
          moduleId: "synthesis",
          context,
          startedAt,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}

function toSignalLight(
  raw: Record<string, unknown> | undefined,
  domain: string
): DomainSignalLight | undefined {
  if (!raw) return undefined;
  const healthScore = raw.healthScore as { value?: number } | undefined;
  const score =
    healthScore?.value ??
    (typeof raw.score === "number" ? raw.score : undefined) ??
    (typeof (raw as { value?: number }).value === "number"
      ? (raw as { value?: number }).value
      : undefined);
  if (score == null && !raw.baseline) return undefined;
  const value = score ?? 50;
  return {
    domain,
    score: value,
    direction: value < 55 ? "down" : value > 70 ? "up" : "flat",
    healthScore: healthScore ?? { value },
    narrative:
      typeof raw.headline === "string"
        ? raw.headline
        : typeof raw.outlook === "string"
          ? raw.outlook
          : undefined,
  };
}
