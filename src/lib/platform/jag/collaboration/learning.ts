/**
 * JAG Collaboration — learning / memory persistence.
 */

import type {
  JagCollaborationConfidence,
  JagCollaborationLearningResult,
  JagCollaborationRequest,
  JagConsensusResult,
  JagModeratedCollaboration,
} from "@/lib/platform/jag/collaboration/types";
import type { PersistentIntelligenceMemory } from "@/lib/platform/intelligence/memory/index";

export interface JagCollaborationLearningDependencies {
  memory?: PersistentIntelligenceMemory;
}

/**
 * Persists collaboration outcomes into Persistent Memory for future accuracy.
 */
export class JagCollaborationLearning {
  private readonly memory: PersistentIntelligenceMemory | null;

  constructor(dependencies: JagCollaborationLearningDependencies = {}) {
    this.memory = dependencies.memory ?? null;
  }

  async persist(
    request: JagCollaborationRequest,
    moderated: JagModeratedCollaboration,
    consensus: JagConsensusResult,
    confidence: JagCollaborationConfidence
  ): Promise<JagCollaborationLearningResult> {
    const observations = [
      `Collaboration on "${request.subject}" reached ${consensus.mode} consensus: ${consensus.title}`,
      `Agreement ${confidence.agreement}; uncertainty ${confidence.uncertainty}`,
      ...moderated.preservedDisagreements.map((d) => d.explanation),
    ];

    const recommendations = [
      consensus.title,
      ...moderated.mergedRecommendations.slice(0, 3).map((r) => r.title),
    ];

    if (!this.memory) {
      return {
        memoryId: null,
        observations,
        recommendations,
        trackedForAccuracy: false,
        summary: "Memory service not injected; learning outcome not persisted.",
      };
    }

    const record = this.memory.createMemory({
      domain: "decision",
      executionId: request.requestId,
      organizationId:
        request.organizationId ?? request.sharedContext?.scope.organizationId ?? null,
      schoolId: request.schoolId ?? request.sharedContext?.scope.schoolId ?? null,
      observations,
      recommendations,
      assumptions: [
        "Multi-agent collaboration outcome is provisional until measured",
      ],
      evidence: (request.evidenceRefs ?? []).map((ref) => ({ ...ref })),
      confidence: confidence.score,
      contextSnapshot: {
        sharedContextRequestId: request.sharedContext?.requestId ?? null,
        participatingAgents: moderated.responses.map((r) => r.agentRole),
        consensusMode: consensus.mode,
      },
      request: {
        subject: request.subject,
        description: request.description ?? null,
      },
      metadata: {
        source: "jag_collaboration",
        trackedForAccuracy: true,
        disagreementCount: moderated.preservedDisagreements.length,
      },
    });

    const saved = await this.memory.saveMemory(record);

    return {
      memoryId: saved.id,
      observations,
      recommendations,
      trackedForAccuracy: true,
      summary: `Persisted collaboration outcome to memory ${saved.id} for future accuracy tracking.`,
    };
  }
}
