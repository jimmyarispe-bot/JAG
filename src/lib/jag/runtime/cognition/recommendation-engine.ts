import type { RuntimeEventBus } from "../events";
import {
  COGNITION_EVENT_TYPES,
  type RecommendationGeneratedPayload,
} from "./cognition-events";
import { clampConfidence, scoreWithEvidence } from "./confidence";
import type { CognitiveRecommendationDraft } from "./cognitive-provider";
import type {
  CognitiveRecommendation,
  CognitiveRecommendationType,
} from "./cognition-types";

export class RecommendationEngine {
  constructor(private readonly events?: RuntimeEventBus) {}

  async normalize(
    drafts: readonly (CognitiveRecommendationDraft & {
      sourceProviderId: string;
    })[]
  ): Promise<CognitiveRecommendation[]> {
    const byKey = new Map<string, CognitiveRecommendation>();

    for (const draft of drafts) {
      const evidenceRefs = draft.evidenceRefs ?? [];
      const unsupported = evidenceRefs.length === 0;
      const confidence = unsupported
        ? clampConfidence(draft.confidence * 0.5)
        : scoreWithEvidence(draft.confidence, evidenceRefs.length);

      const type: CognitiveRecommendationType =
        draft.type ??
        (unsupported
          ? "informational"
          : draft.suggestedNextAction
            ? "actionable"
            : "informational");

      const id =
        draft.id ??
        `${draft.sourceProviderId}_${draft.topicId ?? draft.title ?? "rec"}`;

      const recommendation: CognitiveRecommendation = {
        id,
        type: unsupported && type === "actionable" ? "informational" : type,
        title: draft.title,
        rationale: draft.rationale,
        priority: draft.priority ?? 50,
        confidence,
        evidenceRefs,
        reasoningNodeIds: [],
        sourceProviderId: draft.sourceProviderId,
        suggestedNextAction: unsupported
          ? undefined
          : draft.suggestedNextAction,
        topicId: draft.topicId,
        conflictFlags: [],
        unsupported,
        attributes: draft.attributes,
      };

      const key = `${recommendation.topicId ?? recommendation.id}|${recommendation.suggestedNextAction ?? ""}`;
      const existing = byKey.get(key);
      if (
        !existing ||
        recommendation.confidence > existing.confidence ||
        (recommendation.confidence === existing.confidence &&
          recommendation.evidenceRefs.length > existing.evidenceRefs.length)
      ) {
        byKey.set(key, recommendation);
      }

      const payload: RecommendationGeneratedPayload = {
        recommendationId: recommendation.id,
        providerId: recommendation.sourceProviderId,
        confidence: recommendation.confidence,
      };
      await this.events?.publish(
        COGNITION_EVENT_TYPES.RECOMMENDATION_GENERATED,
        payload
      );
    }

    return [...byKey.values()];
  }
}

export function createRecommendationEngine(
  events?: RuntimeEventBus
): RecommendationEngine {
  return new RecommendationEngine(events);
}
