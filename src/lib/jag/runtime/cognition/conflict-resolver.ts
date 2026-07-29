import type { RuntimeEventBus } from "../events";
import {
  COGNITION_EVENT_TYPES,
  type ConflictDetectedPayload,
} from "./cognition-events";
import type { ReasoningGraph } from "./reasoning-graph";
import type {
  CognitiveConflict,
  CognitiveRecommendation,
} from "./cognition-types";

export class CognitiveConflictResolver {
  constructor(private readonly events?: RuntimeEventBus) {}

  async detect(
    recommendations: readonly CognitiveRecommendation[],
    graph: ReasoningGraph
  ): Promise<{
    conflicts: CognitiveConflict[];
    recommendations: CognitiveRecommendation[];
  }> {
    const conflicts: CognitiveConflict[] = [];
    const flagged = new Map<string, Set<string>>();

    // Same topicId from different providers with divergent actions.
    const byTopic = new Map<string, CognitiveRecommendation[]>();
    for (const rec of recommendations) {
      if (!rec.topicId) continue;
      const list = byTopic.get(rec.topicId) ?? [];
      list.push(rec);
      byTopic.set(rec.topicId, list);
    }

    let conflictSeq = 0;
    for (const [topicId, group] of byTopic) {
      if (group.length < 2) continue;
      const actions = new Set(
        group.map((g) => g.suggestedNextAction ?? g.title ?? g.id)
      );
      if (actions.size < 2) continue;
      const id = `conflict_${++conflictSeq}_${topicId}`;
      const recommendationIds = group.map((g) => g.id);
      const providerIds = [...new Set(group.map((g) => g.sourceProviderId))];
      conflicts.push({
        id,
        kind: "provider_disagreement",
        recommendationIds,
        providerIds,
        summary: `Conflicting recommendations on topic ${topicId}`,
      });
      for (const recId of recommendationIds) {
        const set = flagged.get(recId) ?? new Set();
        set.add(id);
        flagged.set(recId, set);
      }
      // Graph edges between first two recommendations.
      if (group[0] && group[1]) {
        graph.addEdge(
          `rec_${group[0].id}`,
          `rec_${group[1].id}`,
          "contradicts",
          1
        );
      }
      const payload: ConflictDetectedPayload = {
        conflictId: id,
        recommendationIds,
      };
      await this.events?.publish(
        COGNITION_EVENT_TYPES.CONFLICT_DETECTED,
        payload
      );
    }

    // Graph-native contradictions.
    for (const edge of graph.contradictions()) {
      const id = `conflict_graph_${edge.id}`;
      if (conflicts.some((c) => c.id === id)) continue;
      conflicts.push({
        id,
        kind: "graph_contradiction",
        recommendationIds: [edge.from, edge.to],
        providerIds: [],
        summary: "Reasoning graph contradiction",
      });
    }

    const updated = recommendations.map((rec) => {
      const flags = flagged.get(rec.id);
      if (!flags?.size) return rec;
      return {
        ...rec,
        conflictFlags: [...new Set([...rec.conflictFlags, ...flags])],
      };
    });

    return { conflicts, recommendations: updated };
  }
}

export function createConflictResolver(
  events?: RuntimeEventBus
): CognitiveConflictResolver {
  return new CognitiveConflictResolver(events);
}
