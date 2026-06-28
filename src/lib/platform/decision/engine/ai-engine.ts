import type { RuleEngineContext, RuleEngineResult } from "@/lib/platform/decision/engine/rule-engine";
import type { ScoringResult } from "@/lib/platform/decision/types";

export interface AiAssistEngineContext extends RuleEngineContext {
  ruleResult: RuleEngineResult;
  scoringPreview?: ScoringResult;
}

export interface AiAssistEngineResult {
  suggestedOutcomeKey: string;
  reasoning: string[];
  outcomeAdjustments: Record<string, number>;
  confidenceAdjustment: number;
}

export interface AiAssistEngine {
  assist(context: AiAssistEngineContext): AiAssistEngineResult | Promise<AiAssistEngineResult | null>;
}

/**
 * Default AI-assisted engine — heuristic scoring without LLM integration.
 * Modules replace this with provider-backed implementations in later phases.
 */
export const defaultAiAssistEngine: AiAssistEngine = {
  assist(context) {
    const reasoning: string[] = [];
    const outcomeAdjustments: Record<string, number> = {};
    const facts = context.ruleResult.facts;

    for (const item of context.evidence.items) {
      if (typeof item.value === "number" && item.confidence != null && item.confidence < 0.7) {
        reasoning.push(`Low-confidence evidence for "${item.key}" — dampening aggressive outcomes`);
        for (const option of context.definition.recommendationOptions) {
          if (option.defaultPriority === "critical" || option.defaultPriority === "high") {
            outcomeAdjustments[option.outcomeKey] = (outcomeAdjustments[option.outcomeKey] ?? 0) - 5;
          }
        }
      }
    }

    const numericKeys = Object.keys(facts).filter((key) => typeof facts[key] === "number");
    if (numericKeys.length > 0) {
      const avg =
        numericKeys.reduce((sum, key) => sum + (facts[key] as number), 0) / numericKeys.length;
      reasoning.push(`Composite signal average: ${avg.toFixed(1)}`);

      const sortedOptions = [...context.definition.recommendationOptions];
      if (avg > 70) {
        const aggressive = sortedOptions.find((o) => o.defaultPriority === "high" || o.defaultPriority === "critical");
        if (aggressive) {
          outcomeAdjustments[aggressive.outcomeKey] = (outcomeAdjustments[aggressive.outcomeKey] ?? 0) + 15;
          reasoning.push(`Elevated composite signal favors "${aggressive.label}"`);
        }
      } else if (avg < 30) {
        const conservative = sortedOptions.find((o) => o.defaultPriority === "low" || o.defaultPriority === "medium");
        if (conservative) {
          outcomeAdjustments[conservative.outcomeKey] = (outcomeAdjustments[conservative.outcomeKey] ?? 0) + 10;
          reasoning.push(`Low composite signal favors "${conservative.label}"`);
        }
      }
    }

    const preview = context.scoringPreview;
    const suggestedOutcomeKey =
      preview?.primaryOutcomeKey ??
      context.definition.recommendationOptions[0]?.outcomeKey ??
      "unknown";

    const confidenceAdjustment = reasoning.length > 0 ? 0.05 : 0;

    return {
      suggestedOutcomeKey,
      reasoning,
      outcomeAdjustments,
      confidenceAdjustment,
    };
  },
};

const AI_ASSIST_ENGINES = new Map<string, AiAssistEngine>();

export function registerAiAssistEngine(key: string, engine: AiAssistEngine): void {
  AI_ASSIST_ENGINES.set(key, engine);
}

export function getAiAssistEngine(key = "default"): AiAssistEngine {
  return AI_ASSIST_ENGINES.get(key) ?? defaultAiAssistEngine;
}

export function assistDecision(
  context: AiAssistEngineContext,
  engineKey = "default"
): AiAssistEngineResult | Promise<AiAssistEngineResult | null> {
  return getAiAssistEngine(engineKey).assist(context);
}
