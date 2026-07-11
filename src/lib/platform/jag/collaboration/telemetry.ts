/**
 * JAG Collaboration — telemetry.
 */

import type {
  JagCollaborationConfidence,
  JagCollaborationRequest,
  JagCollaborationTelemetry,
  JagConsensusResult,
  JagModeratedCollaboration,
} from "@/lib/platform/jag/collaboration/types";

export interface JagCollaborationTelemetryDependencies {
  now?: () => Date;
}

/**
 * Tracks execution time, agents, confidence, consensus, and disagreements.
 */
export class JagCollaborationTelemetryCollector {
  private readonly now: () => Date;

  constructor(dependencies: JagCollaborationTelemetryDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date());
  }

  collect(input: {
    request: JagCollaborationRequest;
    moderated: JagModeratedCollaboration;
    consensus: JagConsensusResult;
    confidence: JagCollaborationConfidence;
    startedAt: string;
    startedMs: number;
  }): JagCollaborationTelemetry {
    const completedAt = this.now().toISOString();
    const executionTimeMs = Math.max(0, this.now().getTime() - input.startedMs);

    return {
      runId: input.request.requestId,
      startedAt: input.startedAt,
      completedAt,
      executionTimeMs,
      participatingAgents: input.moderated.responses.map((r) => r.agentRole),
      confidence: input.confidence.score.value,
      consensusMode: input.consensus.mode,
      consensusKey: input.consensus.recommendationKey,
      disagreementCount: input.moderated.preservedDisagreements.length,
      metadata: {
        duplicatesRemoved: input.moderated.duplicatesRemoved,
        uncertainty: input.confidence.uncertainty,
      },
    };
  }
}
