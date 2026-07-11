/**
 * JAG Collaboration — moderator.
 *
 * Normalizes responses, detects duplicates, merges similar recommendations,
 * and preserves disagreements.
 */

import type {
  JagAgentRecommendation,
  JagAgentResponse,
  JagCollaborationAgentRole,
  JagDisagreement,
  JagModeratedCollaboration,
  JagModeratedRecommendation,
} from "@/lib/platform/jag/collaboration/types";
import type { IntelligenceConfidenceScore } from "@/lib/platform/intelligence/types";

function normalizeKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, "-");
}

function tokenSet(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 2)
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const t of a) if (b.has(t)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function averageConfidence(
  scores: readonly IntelligenceConfidenceScore[]
): IntelligenceConfidenceScore {
  if (scores.length === 0) {
    return { value: 0, level: "unknown", factors: [] };
  }
  const value = Number(
    (scores.reduce((sum, s) => sum + s.value, 0) / scores.length).toFixed(4)
  );
  const level =
    value >= 0.75 ? "high" : value >= 0.45 ? "medium" : value > 0 ? "low" : "unknown";
  return {
    value,
    level,
    factors: [
      {
        key: "merged_agents",
        label: "Merged Agent Confidence",
        contribution: value,
      },
    ],
  };
}

/**
 * Normalizes and merges multi-agent responses.
 */
export class JagCollaborationModerator {
  moderate(responses: readonly JagAgentResponse[]): JagModeratedCollaboration {
    const normalized = responses.map((response) => this.normalizeResponse(response));
    const { merged, duplicatesRemoved } = this.mergeRecommendations(normalized);
    const preservedDisagreements = this.detectDisagreements(normalized, merged);

    return {
      responses: normalized,
      mergedRecommendations: merged,
      preservedDisagreements,
      duplicatesRemoved,
      summary: `Moderated ${normalized.length} agent response(s); ${merged.length} unique recommendation(s); removed ${duplicatesRemoved} duplicate(s); preserved ${preservedDisagreements.length} disagreement(s).`,
    };
  }

  private normalizeResponse(response: JagAgentResponse): JagAgentResponse {
    return {
      ...response,
      summary: response.summary.trim(),
      concerns: response.concerns.map((c) => c.trim()).filter(Boolean),
      recommendations: response.recommendations.map((rec) => ({
        ...rec,
        recommendationKey: normalizeKey(rec.recommendationKey || rec.title),
        title: rec.title.trim(),
        summary: rec.summary.trim(),
        actions: rec.actions.map((a) => a.trim()).filter(Boolean),
      })),
    };
  }

  private mergeRecommendations(
    responses: readonly JagAgentResponse[]
  ): {
    merged: JagModeratedRecommendation[];
    duplicatesRemoved: number;
  } {
    type Bucket = {
      key: string;
      title: string;
      summary: string;
      actions: string[];
      agents: JagCollaborationAgentRole[];
      items: JagAgentRecommendation[];
    };

    const buckets: Bucket[] = [];
    let duplicatesRemoved = 0;

    for (const response of responses) {
      for (const rec of response.recommendations) {
        const tokens = tokenSet(rec.title);
        let matched: Bucket | null = null;
        for (const bucket of buckets) {
          const similarity = jaccard(tokens, tokenSet(bucket.title));
          if (
            rec.recommendationKey === bucket.key ||
            similarity >= 0.55
          ) {
            matched = bucket;
            break;
          }
        }

        if (matched) {
          duplicatesRemoved += 1;
          if (!matched.agents.includes(response.agentRole)) {
            matched.agents.push(response.agentRole);
          }
          matched.items.push(rec);
          for (const action of rec.actions) {
            if (!matched.actions.includes(action)) matched.actions.push(action);
          }
        } else {
          buckets.push({
            key: rec.recommendationKey,
            title: rec.title,
            summary: rec.summary,
            actions: [...rec.actions],
            agents: [response.agentRole],
            items: [rec],
          });
        }
      }
    }

    const merged: JagModeratedRecommendation[] = buckets.map((bucket) => {
      const n = bucket.items.length;
      const avg = (picker: (r: JagAgentRecommendation) => number) =>
        Number(
          (bucket.items.reduce((sum, item) => sum + picker(item), 0) / Math.max(1, n)).toFixed(4)
        );

      return {
        recommendationKey: bucket.key,
        title: bucket.title,
        summary: bucket.summary,
        actions: bucket.actions,
        supportingAgents: bucket.agents,
        risk: avg((r) => r.risk),
        urgency: avg((r) => r.urgency),
        impact: avg((r) => r.impact),
        cost: avg((r) => r.cost),
        missionAlignment: avg((r) => r.missionAlignment),
        confidence: averageConfidence(bucket.items.map((i) => i.confidence)),
        evidenceRefs: bucket.items.flatMap((i) => i.evidenceRefs),
      };
    });

    return { merged, duplicatesRemoved };
  }

  private detectDisagreements(
    responses: readonly JagAgentResponse[],
    merged: readonly JagModeratedRecommendation[]
  ): JagDisagreement[] {
    if (merged.length <= 1) return [];

    const topKeys = new Set(merged.slice(0, 3).map((m) => m.recommendationKey));
    const positions: JagDisagreement["positions"][number][] = [];

    for (const response of responses) {
      const primary = response.recommendations[0];
      if (!primary) continue;
      if (!topKeys.has(primary.recommendationKey) && merged.length > 1) {
        positions.push({
          agentRole: response.agentRole,
          recommendationKey: primary.recommendationKey,
          stance: primary.title,
        });
      }
    }

    // Also capture when different agents support different top merged keys.
    const byAgentTop = new Map<JagCollaborationAgentRole, string>();
    for (const response of responses) {
      const primary = response.recommendations[0];
      if (primary) byAgentTop.set(response.agentRole, primary.recommendationKey);
    }
    const uniqueTops = new Set(byAgentTop.values());
    if (uniqueTops.size <= 1 && positions.length === 0) return [];

    const disagreementPositions =
      positions.length > 0
        ? positions
        : Array.from(byAgentTop.entries()).map(([agentRole, recommendationKey]) => ({
            agentRole,
            recommendationKey,
            stance:
              merged.find((m) => m.recommendationKey === recommendationKey)?.title ??
              recommendationKey,
          }));

    return [
      {
        topic: "Primary recommendation",
        positions: disagreementPositions,
        explanation:
          "Agents preferred different primary recommendations after moderation; disagreements are preserved for executive review.",
      },
    ];
  }
}
