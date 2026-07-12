import type { ImpactKnowledgeContribution, OutcomeSuite } from "@/lib/platform/intelligence/impact/types";
export class ImpactKnowledgeContributionEngine {
  contribute(input: { outcomes: OutcomeSuite; now: Date; createId: (prefix: string) => string }): ImpactKnowledgeContribution {
    const artifacts = input.outcomes.outcomes.slice(0, 6).map(outcome => ({ id: input.createId("imp-knowledge"), type: "impact_outcome", title: outcome.title, confidence: outcome.attribution, sourceRef: outcome.id, validated: outcome.achieved, metadata: { area: outcome.area, capturedAt: input.now.toISOString() } }));
    return { artifacts, contributionScore: artifacts.reduce((s, a) => s + a.confidence, 0) / Math.max(1, artifacts.length) * 100, validatedCount: artifacts.filter(a => a.validated).length, narrative: `${artifacts.length} impact learning drafts prepared for Knowledge Intelligence.` };
  }
}
