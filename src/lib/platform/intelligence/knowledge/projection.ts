/**
 * Knowledge Intelligence — projection + queries (Sprint 040 / 0.2.0).
 */

import type {
  KnowledgeProjection as KnowledgeProjectionContract,
  KnowledgeQueries as KnowledgeQueriesContract,
} from "@/lib/platform/intelligence/knowledge/contracts";
import { buildConfidence } from "@/lib/platform/intelligence/knowledge/models";
import type {
  KnowledgeProjectionResult,
  KnowledgeQueryRequest,
  KnowledgeQueryResult,
  KnowledgeResult,
} from "@/lib/platform/intelligence/knowledge/types";

export class KnowledgeProjection implements KnowledgeProjectionContract {
  project(input: {
    request: Parameters<KnowledgeProjectionContract["project"]>[0]["request"];
    healthScore: Parameters<KnowledgeProjectionContract["project"]>[0]["healthScore"];
    coverageScore: Parameters<
      KnowledgeProjectionContract["project"]
    >[0]["coverageScore"];
    graphScore: Parameters<KnowledgeProjectionContract["project"]>[0]["graphScore"];
    searchScore: Parameters<
      KnowledgeProjectionContract["project"]
    >[0]["searchScore"];
    gapScore: Parameters<KnowledgeProjectionContract["project"]>[0]["gapScore"];
    expertiseScore: Parameters<
      KnowledgeProjectionContract["project"]
    >[0]["expertiseScore"];
    qualityScore: Parameters<
      KnowledgeProjectionContract["project"]
    >[0]["qualityScore"];
    provenanceScore: Parameters<
      KnowledgeProjectionContract["project"]
    >[0]["provenanceScore"];
    memoryScore: Parameters<
      KnowledgeProjectionContract["project"]
    >[0]["memoryScore"];
    evolutionScore: Parameters<
      KnowledgeProjectionContract["project"]
    >[0]["evolutionScore"];
    catalog: Parameters<KnowledgeProjectionContract["project"]>[0]["catalog"];
    graph: Parameters<KnowledgeProjectionContract["project"]>[0]["graph"];
    search: Parameters<KnowledgeProjectionContract["project"]>[0]["search"];
    reasoning: Parameters<KnowledgeProjectionContract["project"]>[0]["reasoning"];
    gaps: Parameters<KnowledgeProjectionContract["project"]>[0]["gaps"];
    expertiseMap: Parameters<
      KnowledgeProjectionContract["project"]
    >[0]["expertiseMap"];
    provenance: Parameters<
      KnowledgeProjectionContract["project"]
    >[0]["provenance"];
    quality: Parameters<KnowledgeProjectionContract["project"]>[0]["quality"];
    organizationalMemory: Parameters<
      KnowledgeProjectionContract["project"]
    >[0]["organizationalMemory"];
    evolution: Parameters<
      KnowledgeProjectionContract["project"]
    >[0]["evolution"];
    decisionTraceability: Parameters<
      KnowledgeProjectionContract["project"]
    >[0]["decisionTraceability"];
    brief: Parameters<KnowledgeProjectionContract["project"]>[0]["brief"];
    confidence: Parameters<KnowledgeProjectionContract["project"]>[0]["confidence"];
    dashboard: Parameters<KnowledgeProjectionContract["project"]>[0]["dashboard"];
    baseline: Parameters<KnowledgeProjectionContract["project"]>[0]["baseline"];
  }): KnowledgeProjectionResult {
    return {
      generatedAt: input.brief.generatedAt,
      headline: input.brief.headline,
      healthScore: input.healthScore.value,
      coverageScore: input.coverageScore.value,
      graphScore: input.graphScore.value,
      searchScore: input.searchScore.value,
      gapScore: input.gapScore.value,
      expertiseScore: input.expertiseScore.value,
      qualityScore: input.qualityScore.value,
      provenanceScore: input.provenanceScore.value,
      memoryScore: input.memoryScore.value,
      evolutionScore: input.evolutionScore.value,
      catalog: input.catalog,
      graph: input.graph,
      search: input.search,
      reasoning: input.reasoning,
      gaps: input.gaps,
      expertiseMap: input.expertiseMap,
      provenance: input.provenance,
      quality: input.quality,
      organizationalMemory: input.organizationalMemory,
      evolution: input.evolution,
      decisionTraceability: input.decisionTraceability,
      brief: input.brief,
      dashboard: input.dashboard,
      metrics: {
        artifactCount: input.baseline.artifactCount,
        validatedRatio: input.baseline.validatedRatio,
        conflictPressure: input.baseline.conflictPressure,
        duplicatePressure: input.baseline.duplicatePressure,
        staleRatio: input.baseline.staleRatio,
        gapPressure: input.baseline.gapPressure,
        expertCoverage: input.baseline.expertCoverage,
        trustScore: input.provenance.overallTrustScore,
        qualityScore: input.quality.overallScore,
        memoryCoverage: input.organizationalMemory.coverageScore,
        evolutionPressure: input.evolution.overallEvolutionPressure,
        tracedRecommendations:
          input.decisionTraceability.tracedRecommendationCount,
      },
      overallConfidence: input.confidence,
    };
  }
}

export class KnowledgeQueries implements KnowledgeQueriesContract {
  ask(
    result: KnowledgeResult,
    request: KnowledgeQueryRequest
  ): KnowledgeQueryResult {
    const focus = request.focus ?? "general";
    const max = request.maxResults ?? 5;

    let answer: string;
    let references: string[] = [];

    switch (focus) {
      case "catalog":
        answer = result.catalog.narrative;
        references = result.catalog.artifacts
          .slice(0, max)
          .map((a) => a.narrative);
        break;
      case "graph":
        answer = result.graph.narrative;
        references = result.graph.edges.slice(0, max).map((e) => e.narrative);
        break;
      case "search":
        answer = result.search.narrative;
        references = result.search.hits.slice(0, max).map((h) => h.snippet);
        break;
      case "reasoning":
        answer = result.reasoning.answer;
        references = result.reasoning.connectedArtifacts.slice(0, max);
        break;
      case "gaps":
        answer = result.gaps.narrative;
        references = result.gaps.gaps.slice(0, max).map((g) => g.narrative);
        break;
      case "expertise":
        answer = result.expertiseMap.narrative;
        references = result.expertiseMap.domains
          .slice(0, max)
          .map((d) => d.narrative);
        break;
      case "provenance":
        answer = result.provenance.narrative;
        references = result.catalog.artifacts
          .slice(0, max)
          .map(
            (a) =>
              `${a.title}: source ${a.provenance.source}, owner ${a.provenance.currentOwner}, trust ${Math.round(a.provenance.trustScore)}`
          );
        break;
      case "quality":
        answer = result.quality.narrative;
        references = result.quality.dimensions
          .slice(0, max)
          .map((d) => d.narrative);
        break;
      case "memory":
        answer = result.organizationalMemory.narrative;
        references = result.organizationalMemory.records
          .slice(0, max)
          .map((r) => r.narrative);
        break;
      case "evolution":
        answer = result.evolution.narrative;
        references = result.evolution.actions
          .slice(0, max)
          .map((a) => a.narrative);
        break;
      case "traceability":
        answer = result.decisionTraceability.narrative;
        references = result.decisionTraceability.traces
          .slice(0, max)
          .map((t) => t.narrative);
        break;
      case "risk":
        answer = result.riskScore.narrative;
        references = result.risks.slice(0, max).map((r) => r.narrative);
        break;
      case "opportunity":
        answer = result.opportunities[0]?.narrative ?? result.brief.summary;
        references = result.opportunities.slice(0, max).map((o) => o.narrative);
        break;
      default:
        answer = result.brief.headline;
        references = result.recommendations.slice(0, max).map((r) => r.title);
    }

    return {
      question: request.question,
      focus,
      answer,
      references,
      confidence: buildConfidence([
        {
          key: "result",
          label: "Result coverage",
          contribution: result.confidence.value,
        },
        {
          key: "focus",
          label: "Focus specificity",
          contribution: focus === "general" ? 0.55 : 0.8,
        },
      ]),
    };
  }
}
