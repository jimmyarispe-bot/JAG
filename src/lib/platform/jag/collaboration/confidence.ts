/**
 * JAG Collaboration — confidence & uncertainty.
 */

import type {
  JagCollaborationConfidence,
  JagCollaborationRequest,
  JagConsensusResult,
  JagModeratedCollaboration,
} from "@/lib/platform/jag/collaboration/types";
import type { IntelligenceConfidenceScore } from "@/lib/platform/intelligence/types";

/**
 * Calculates collaboration confidence and uncertainty scores.
 */
export class JagCollaborationConfidenceCalculator {
  calculate(
    request: JagCollaborationRequest,
    moderated: JagModeratedCollaboration,
    consensus: JagConsensusResult
  ): JagCollaborationConfidence {
    const agreement =
      consensus.totalAgents === 0
        ? 0
        : Number((consensus.supportCount / consensus.totalAgents).toFixed(4));

    const historicalAccuracy = this.historicalAccuracy(request);
    const evidenceQuality = this.evidenceQuality(moderated);
    const memorySimilarity = this.memorySimilarity(request);
    const sharedContextCompleteness = this.sharedContextCompleteness(request);

    const value = Number(
      (
        agreement * 0.3 +
        historicalAccuracy * 0.15 +
        evidenceQuality * 0.2 +
        memorySimilarity * 0.15 +
        sharedContextCompleteness * 0.2
      ).toFixed(4)
    );

    const uncertainty = Number(
      Math.max(
        0,
        Math.min(
          1,
          1 -
            value +
            moderated.preservedDisagreements.length * 0.08 +
            (consensus.overridden ? 0.05 : 0)
        )
      ).toFixed(4)
    );

    const score: IntelligenceConfidenceScore = {
      value,
      level: value >= 0.75 ? "high" : value >= 0.45 ? "medium" : value > 0 ? "low" : "unknown",
      factors: [
        { key: "agreement", label: "Agent Agreement", contribution: agreement },
        {
          key: "historical_accuracy",
          label: "Historical Accuracy",
          contribution: historicalAccuracy,
        },
        {
          key: "evidence_quality",
          label: "Evidence Quality",
          contribution: evidenceQuality,
        },
        {
          key: "memory_similarity",
          label: "Memory Similarity",
          contribution: memorySimilarity,
        },
        {
          key: "shared_context",
          label: "Shared Context Completeness",
          contribution: sharedContextCompleteness,
        },
      ],
    };

    return {
      score,
      agreement,
      historicalAccuracy,
      evidenceQuality,
      memorySimilarity,
      sharedContextCompleteness,
      uncertainty,
      summary: `Confidence ${value} (uncertainty ${uncertainty}); agreement ${agreement}.`,
    };
  }

  private historicalAccuracy(request: JagCollaborationRequest): number {
    const memories = request.memories ?? [];
    if (memories.length === 0) return 0.5;
    const avg =
      memories.reduce((sum, m) => sum + m.confidence.value, 0) / memories.length;
    return Number(avg.toFixed(4));
  }

  private evidenceQuality(moderated: JagModeratedCollaboration): number {
    const refs = moderated.mergedRecommendations.flatMap((r) => r.evidenceRefs);
    if (refs.length === 0) {
      const avgConf =
        moderated.responses.reduce((sum, r) => sum + r.confidence.value, 0) /
        Math.max(1, moderated.responses.length);
      return Number((avgConf * 0.7).toFixed(4));
    }
    const weighted =
      refs.reduce((sum, ref) => sum + (ref.weight ?? 0.6), 0) / refs.length;
    return Number(Math.min(1, weighted).toFixed(4));
  }

  private memorySimilarity(request: JagCollaborationRequest): number {
    const memories = request.memories ?? [];
    if (memories.length === 0) return 0.35;
    const corpus = `${request.subject} ${request.description ?? ""}`.toLowerCase();
    let best = 0;
    for (const memory of memories) {
      const text = [...memory.observations, ...memory.recommendations]
        .join(" ")
        .toLowerCase();
      const tokens = new Set(corpus.split(/[^a-z0-9]+/).filter((t) => t.length > 2));
      const memTokens = new Set(text.split(/[^a-z0-9]+/).filter((t) => t.length > 2));
      let intersection = 0;
      for (const t of tokens) if (memTokens.has(t)) intersection += 1;
      const union = tokens.size + memTokens.size - intersection;
      const score = union === 0 ? 0 : intersection / union;
      if (score > best) best = score;
    }
    return Number(Math.min(1, best + 0.2).toFixed(4));
  }

  private sharedContextCompleteness(request: JagCollaborationRequest): number {
    const ctx = request.sharedContext;
    if (!ctx) return 0.25;
    let score = 0.4;
    if (ctx.scope.organizationId) score += 0.15;
    if (ctx.scope.schoolId) score += 0.1;
    if (ctx.executive) score += 0.1;
    if (ctx.finance) score += 0.1;
    if (ctx.organization) score += 0.1;
    if (ctx.student) score += 0.05;
    return Number(Math.min(1, score).toFixed(4));
  }
}
