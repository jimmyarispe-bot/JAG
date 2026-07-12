/**
 * Knowledge Intelligence — scores, health, dashboards, briefs, analyzers (Sprint 040).
 */

import type {
  ExecutiveKnowledgeBriefGenerator as ExecutiveKnowledgeBriefGeneratorContract,
  KnowledgeDashboard as KnowledgeDashboardContract,
  KnowledgeHealth as KnowledgeHealthContract,
  KnowledgeIntelligence as KnowledgeIntelligenceContract,
  KnowledgeOpportunityAnalyzer as KnowledgeOpportunityAnalyzerContract,
  KnowledgeRecommendationComposer as KnowledgeRecommendationComposerContract,
  KnowledgeRiskAnalyzer as KnowledgeRiskAnalyzerContract,
} from "@/lib/platform/intelligence/knowledge/contracts";
import {
  buildConfidence,
  buildLenses,
  clamp,
  defaultCreateId,
  priorityFromRisk,
  priorityFromScore,
  scoreNarrative,
  statusFromScore,
} from "@/lib/platform/intelligence/knowledge/models";
import type {
  ExpertiseMapResult,
  KnowledgeBaseline,
  KnowledgeCatalogResult,
  KnowledgeConfidenceScore,
  KnowledgeDashboardResult,
  DecisionTraceabilityResult,
  KnowledgeEvolutionResult,
  KnowledgeGapResult,
  KnowledgeGraphResult,
  KnowledgeHealthResult,
  KnowledgeOpportunityRecord,
  KnowledgeProvenanceSuite,
  KnowledgeQualitySuite,
  KnowledgeReasoningResult,
  KnowledgeRecommendationRecord,
  KnowledgeRequest,
  KnowledgeRiskRecord,
  KnowledgeScore,
  KnowledgeSearchResult,
  KnowledgeSource,
  OrganizationalMemorySuite,
  ExecutiveKnowledgeBrief,
} from "@/lib/platform/intelligence/knowledge/types";

export function defaultKnowledgeConfidence(
  baseline: KnowledgeBaseline,
  catalog: KnowledgeCatalogResult,
  graph: KnowledgeGraphResult,
  search: KnowledgeSearchResult
): KnowledgeConfidenceScore {
  return buildConfidence([
    {
      key: "coverage",
      label: "Coverage",
      contribution: clamp(baseline.coverageScore / 100),
    },
    {
      key: "catalog",
      label: "Catalog coverage",
      contribution: clamp(catalog.overallCoverage / 100),
    },
    {
      key: "graph",
      label: "Graph connectivity",
      contribution: clamp(graph.connectivityScore / 100),
    },
    {
      key: "search",
      label: "Search coverage",
      contribution: clamp(search.queryCoverage / 100),
    },
  ]);
}

export class KnowledgeIntelligence implements KnowledgeIntelligenceContract {
  composeScores(input: {
    baseline: KnowledgeBaseline;
    catalog: KnowledgeCatalogResult;
    graph: KnowledgeGraphResult;
    search: KnowledgeSearchResult;
    reasoning: KnowledgeReasoningResult;
    gaps: KnowledgeGapResult;
    expertiseMap: ExpertiseMapResult;
    provenance: KnowledgeProvenanceSuite;
    quality: KnowledgeQualitySuite;
    organizationalMemory: OrganizationalMemorySuite;
    evolution: KnowledgeEvolutionResult;
    decisionTraceability: DecisionTraceabilityResult;
    risks: KnowledgeRiskRecord[];
    opportunities: KnowledgeOpportunityRecord[];
  }): {
    healthScore: KnowledgeScore;
    coverageScore: KnowledgeScore;
    graphScore: KnowledgeScore;
    searchScore: KnowledgeScore;
    gapScore: KnowledgeScore;
    expertiseScore: KnowledgeScore;
    qualityScore: KnowledgeScore;
    provenanceScore: KnowledgeScore;
    memoryScore: KnowledgeScore;
    evolutionScore: KnowledgeScore;
    riskScore: KnowledgeScore;
  } {
    void input.reasoning;
    void input.decisionTraceability;
    const avgRisk =
      input.risks.length > 0
        ? input.risks.reduce((s, r) => s + r.score, 0) / input.risks.length
        : 35;
    const oppLift =
      input.opportunities.length > 0
        ? input.opportunities.reduce((s, o) => s + o.score, 0) /
          input.opportunities.length
        : 50;

    const coverageValue = clamp(input.catalog.overallCoverage);
    const graphValue = clamp(input.graph.connectivityScore);
    const searchValue = clamp(input.search.queryCoverage);
    const gapValue = clamp(100 - input.gaps.overallGapPressure);
    const expertiseValue = clamp(input.expertiseMap.overallCoverage);
    const qualityValue = clamp(input.quality.overallScore);
    const provenanceValue = clamp(input.provenance.overallTrustScore);
    const memoryValue = clamp(input.organizationalMemory.coverageScore);
    const evolutionValue = clamp(100 - input.evolution.overallEvolutionPressure);
    const healthValue = clamp(
      coverageValue * 0.14 +
        graphValue * 0.12 +
        searchValue * 0.1 +
        gapValue * 0.1 +
        expertiseValue * 0.1 +
        qualityValue * 0.14 +
        provenanceValue * 0.12 +
        memoryValue * 0.08 +
        evolutionValue * 0.06 +
        oppLift * 0.04
    );
    const riskValue = clamp(avgRisk);

    return {
      healthScore: {
        key: "knowledge_health",
        label: "Knowledge Health Score",
        value: healthValue,
        status: statusFromScore(healthValue),
        band: priorityFromScore(healthValue),
        narrative: scoreNarrative(
          "Knowledge health",
          healthValue,
          statusFromScore(healthValue)
        ),
      },
      coverageScore: {
        key: "knowledge_coverage",
        label: "Coverage Score",
        value: coverageValue,
        status: statusFromScore(coverageValue),
        band: priorityFromScore(coverageValue),
        narrative: scoreNarrative(
          "Knowledge coverage",
          coverageValue,
          statusFromScore(coverageValue)
        ),
      },
      graphScore: {
        key: "knowledge_graph",
        label: "Graph Score",
        value: graphValue,
        status: statusFromScore(graphValue),
        band: priorityFromScore(graphValue),
        narrative: scoreNarrative(
          "Knowledge graph connectivity",
          graphValue,
          statusFromScore(graphValue)
        ),
      },
      searchScore: {
        key: "knowledge_search",
        label: "Search Score",
        value: searchValue,
        status: statusFromScore(searchValue),
        band: priorityFromScore(searchValue),
        narrative: scoreNarrative(
          "Semantic search readiness",
          searchValue,
          statusFromScore(searchValue)
        ),
      },
      gapScore: {
        key: "knowledge_gaps",
        label: "Gap Resilience Score",
        value: gapValue,
        status: statusFromScore(gapValue),
        band: priorityFromScore(gapValue),
        narrative: scoreNarrative(
          "Knowledge gap resilience",
          gapValue,
          statusFromScore(gapValue)
        ),
      },
      expertiseScore: {
        key: "knowledge_expertise",
        label: "Expertise Score",
        value: expertiseValue,
        status: statusFromScore(expertiseValue),
        band: priorityFromScore(expertiseValue),
        narrative: scoreNarrative(
          "Expertise coverage",
          expertiseValue,
          statusFromScore(expertiseValue)
        ),
      },
      qualityScore: {
        key: "knowledge_quality",
        label: "Quality Score",
        value: qualityValue,
        status: statusFromScore(qualityValue),
        band: priorityFromScore(qualityValue),
        narrative: scoreNarrative(
          "Knowledge quality",
          qualityValue,
          statusFromScore(qualityValue)
        ),
      },
      provenanceScore: {
        key: "knowledge_provenance",
        label: "Provenance Score",
        value: provenanceValue,
        status: statusFromScore(provenanceValue),
        band: priorityFromScore(provenanceValue),
        narrative: scoreNarrative(
          "Knowledge provenance trust",
          provenanceValue,
          statusFromScore(provenanceValue)
        ),
      },
      memoryScore: {
        key: "organizational_memory",
        label: "Organizational Memory Score",
        value: memoryValue,
        status: statusFromScore(memoryValue),
        band: priorityFromScore(memoryValue),
        narrative: scoreNarrative(
          "Organizational memory",
          memoryValue,
          statusFromScore(memoryValue)
        ),
      },
      evolutionScore: {
        key: "knowledge_evolution",
        label: "Evolution Resilience Score",
        value: evolutionValue,
        status: statusFromScore(evolutionValue),
        band: priorityFromScore(evolutionValue),
        narrative: scoreNarrative(
          "Knowledge evolution resilience",
          evolutionValue,
          statusFromScore(evolutionValue)
        ),
      },
      riskScore: {
        key: "knowledge_risk",
        label: "Knowledge Risk Score",
        value: riskValue,
        status: statusFromScore(100 - riskValue),
        band: priorityFromRisk(riskValue / 100),
        narrative: `Knowledge risk is ${priorityFromRisk(riskValue / 100)} at ${Math.round(riskValue)}.`,
      },
    };
  }
}

export class KnowledgeHealth implements KnowledgeHealthContract {
  assess(input: {
    baseline: KnowledgeBaseline;
    scores: {
      healthScore: KnowledgeScore;
      coverageScore: KnowledgeScore;
      graphScore: KnowledgeScore;
      searchScore: KnowledgeScore;
      gapScore: KnowledgeScore;
      expertiseScore: KnowledgeScore;
      qualityScore: KnowledgeScore;
      provenanceScore: KnowledgeScore;
      memoryScore: KnowledgeScore;
      evolutionScore: KnowledgeScore;
      riskScore: KnowledgeScore;
    };
    catalog: KnowledgeCatalogResult;
    graph: KnowledgeGraphResult;
  }): KnowledgeHealthResult {
    const dimensions = {
      coverage: input.scores.coverageScore.value,
      provenance: input.scores.provenanceScore.value,
      ownership: input.baseline.ownershipScore,
      validation: input.baseline.validationScore,
      connectivity: input.scores.graphScore.value,
      expertise: input.scores.expertiseScore.value,
      quality: input.scores.qualityScore.value,
      memory: input.scores.memoryScore.value,
      evolution: input.scores.evolutionScore.value,
    };
    const overallScore = clamp(
      dimensions.coverage * 0.14 +
        dimensions.provenance * 0.14 +
        dimensions.ownership * 0.1 +
        dimensions.validation * 0.12 +
        dimensions.connectivity * 0.12 +
        dimensions.expertise * 0.1 +
        dimensions.quality * 0.14 +
        dimensions.memory * 0.08 +
        dimensions.evolution * 0.06
    );
    const status = statusFromScore(overallScore);
    return {
      overallScore,
      status,
      dimensions,
      lenses: buildLenses({
        coverageCompleteness: `Coverage ${Math.round(dimensions.coverage)}; weakest type ${input.catalog.weakestType}.`,
        provenanceTrust: `Provenance ${Math.round(dimensions.provenance)}.`,
        ownershipClarity: `Ownership ${Math.round(dimensions.ownership)}.`,
        validationCurrency: `Validation ${Math.round(dimensions.validation)}.`,
        dependencyReach: `Connectivity ${Math.round(dimensions.connectivity)}; orphans ${input.graph.orphanCount}.`,
        decisionInfluence: `Decision density ${(input.baseline.decisionDensity * 100).toFixed(0)}%.`,
      }),
      narrative: `Knowledge health ${status} (${Math.round(overallScore)}).`,
    };
  }
}

export class KnowledgeDashboard implements KnowledgeDashboardContract {
  compose(input: {
    scores: {
      healthScore: KnowledgeScore;
      coverageScore: KnowledgeScore;
      graphScore: KnowledgeScore;
      searchScore: KnowledgeScore;
      gapScore: KnowledgeScore;
      expertiseScore: KnowledgeScore;
      qualityScore: KnowledgeScore;
      provenanceScore: KnowledgeScore;
      memoryScore: KnowledgeScore;
      evolutionScore: KnowledgeScore;
    };
    baseline: KnowledgeBaseline;
    risks: KnowledgeRiskRecord[];
    opportunities: KnowledgeOpportunityRecord[];
    now: Date;
  }): KnowledgeDashboardResult {
    void input.baseline;
    return {
      generatedAt: input.now.toISOString(),
      headline: `Knowledge health ${Math.round(input.scores.healthScore.value)} — ${input.scores.healthScore.status}`,
      healthScore: input.scores.healthScore.value,
      coverageScore: input.scores.coverageScore.value,
      graphScore: input.scores.graphScore.value,
      searchScore: input.scores.searchScore.value,
      gapScore: input.scores.gapScore.value,
      expertiseScore: input.scores.expertiseScore.value,
      qualityScore: input.scores.qualityScore.value,
      provenanceScore: input.scores.provenanceScore.value,
      memoryScore: input.scores.memoryScore.value,
      evolutionScore: input.scores.evolutionScore.value,
      topRisks: input.risks.slice(0, 5).map((r) => r.title),
      topOpportunities: input.opportunities.slice(0, 5).map((o) => o.title),
      narrative: `Institutional memory dashboard: coverage ${Math.round(input.scores.coverageScore.value)}, quality ${Math.round(input.scores.qualityScore.value)}, provenance ${Math.round(input.scores.provenanceScore.value)}, memory ${Math.round(input.scores.memoryScore.value)}, evolution ${Math.round(input.scores.evolutionScore.value)}.`,
    };
  }
}

export class KnowledgeRiskAnalyzer implements KnowledgeRiskAnalyzerContract {
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  analyze(input: {
    baseline: KnowledgeBaseline;
    catalog: KnowledgeCatalogResult;
    graph: KnowledgeGraphResult;
    search: KnowledgeSearchResult;
    gaps: KnowledgeGapResult;
    expertiseMap: ExpertiseMapResult;
    now: Date;
  }): KnowledgeRiskRecord[] {
    void input.now;
    const hottest = input.gaps.gaps.find((g) => g.category === input.gaps.hottestGap);
    const risks: KnowledgeRiskRecord[] = [
      {
        id: this.createId("know-risk"),
        title: "Institutional memory coverage gap",
        severity: priorityFromScore(input.catalog.overallCoverage),
        score: clamp(100 - input.catalog.overallCoverage),
        dimension: "coverage",
        mitigation: "Prioritize documenting the weakest knowledge type",
        lenses: buildLenses({
          coverageCompleteness: `Weakest type ${input.catalog.weakestType}.`,
          provenanceTrust: "Sparse coverage weakens provenance trust.",
          ownershipClarity: "Gaps often lack clear owners.",
          validationCurrency: "Undocumented areas cannot be validated.",
          dependencyReach: "Downstream teams lack reusable knowledge.",
          decisionInfluence: "Decisions proceed without institutional memory.",
        }),
        narrative: `Coverage risk concentrated in ${input.catalog.weakestType}.`,
      },
      {
        id: this.createId("know-risk"),
        title: `Knowledge gap: ${hottest?.label ?? input.gaps.hottestGap}`,
        severity: hottest?.severity ?? "high",
        score: clamp(hottest?.score ?? input.gaps.overallGapPressure),
        dimension: input.gaps.hottestGap,
        mitigation: "Close the hottest knowledge gap with named owners",
        lenses: buildLenses({
          coverageCompleteness: "Gap closure expands what we know.",
          provenanceTrust: "Documented sources restore trust.",
          ownershipClarity: "Assign owners for gap remediation.",
          validationCurrency: "Validate newly captured knowledge.",
          dependencyReach: "Reduce orphan dependencies.",
          decisionInfluence: "Better knowledge improves decision quality.",
        }),
        narrative: `Gap risk concentrated in ${input.gaps.hottestGap}.`,
      },
      {
        id: this.createId("know-risk"),
        title: "Conflicting knowledge detected",
        severity: priorityFromRisk(input.baseline.conflictPressure),
        score: clamp(input.baseline.conflictPressure * 100),
        dimension: "conflict",
        mitigation: "Reconcile conflicting artifacts and supersede stale versions",
        lenses: buildLenses({
          coverageCompleteness: "Conflicts create false completeness.",
          provenanceTrust: "Conflicting sources erode trust.",
          ownershipClarity: "Owners must resolve conflicts.",
          validationCurrency: "Re-validate after reconciliation.",
          dependencyReach: "Dependents inherit conflicting guidance.",
          decisionInfluence: "Conflicting knowledge misguides decisions.",
        }),
        narrative: `Conflict pressure ${(input.baseline.conflictPressure * 100).toFixed(0)}%.`,
      },
      {
        id: this.createId("know-risk"),
        title: "Stale / unvalidated knowledge",
        severity: priorityFromRisk(input.baseline.staleRatio),
        score: clamp(input.baseline.staleRatio * 100),
        dimension: "validation",
        mitigation: "Establish validation cadence and retire stale artifacts",
        lenses: buildLenses({
          coverageCompleteness: "Stale items inflate coverage falsely.",
          provenanceTrust: "Outdated provenance weakens trust.",
          ownershipClarity: "Owners must refresh validation.",
          validationCurrency: `Stale ratio ${(input.baseline.staleRatio * 100).toFixed(0)}%.`,
          dependencyReach: "Dependents may rely on outdated guidance.",
          decisionInfluence: "Stale knowledge influences decisions poorly.",
        }),
        narrative: "Validation currency risk threatens institutional memory.",
      },
      {
        id: this.createId("know-risk"),
        title: `Expertise gap: ${input.expertiseMap.weakestDomain}`,
        severity: priorityFromScore(input.expertiseMap.overallCoverage),
        score: clamp(100 - input.expertiseMap.overallCoverage),
        dimension: input.expertiseMap.weakestDomain,
        mitigation: "Identify and document experts in the weakest domain",
        lenses: buildLenses({
          coverageCompleteness: "Experts fill undocumented knowledge.",
          provenanceTrust: "Expert confirmation strengthens provenance.",
          ownershipClarity: "Experts become clear owners.",
          validationCurrency: "Experts validate living knowledge.",
          dependencyReach: "Expertise map clarifies who dependents ask.",
          decisionInfluence: "Expert input improves decision quality.",
        }),
        narrative: `Expertise risk in ${input.expertiseMap.weakestDomain}.`,
      },
    ];
    void input.search;
    void input.graph;
    return risks.sort((a, c) => c.score - a.score);
  }
}

export class KnowledgeOpportunityAnalyzer
  implements KnowledgeOpportunityAnalyzerContract
{
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  analyze(input: {
    baseline: KnowledgeBaseline;
    catalog: KnowledgeCatalogResult;
    graph: KnowledgeGraphResult;
    gaps: KnowledgeGapResult;
    expertiseMap: ExpertiseMapResult;
    now: Date;
  }): KnowledgeOpportunityRecord[] {
    void input.now;
    const opportunities: KnowledgeOpportunityRecord[] = [
      {
        id: this.createId("know-opp"),
        title: `Strengthen ${input.catalog.weakestType} knowledge corpus`,
        priority: priorityFromScore(
          input.catalog.artifacts.find((a) => a.type === input.catalog.weakestType)
            ?.confidence ?? 55
        ),
        score: clamp(
          60 +
            (100 -
              (input.catalog.artifacts.find(
                (a) => a.type === input.catalog.weakestType
              )?.confidence ?? 50)) *
              0.35
        ),
        expectedValue: Math.round(input.baseline.artifactCount * 4 + 40),
        lenses: buildLenses({
          coverageCompleteness: `Directly expands ${input.catalog.weakestType}.`,
          provenanceTrust: "New artifacts with clear sources.",
          ownershipClarity: "Assign owners during capture.",
          validationCurrency: "Validate on intake.",
          dependencyReach: "Creates reusable nodes for dependents.",
          decisionInfluence: "Richer corpus informs decisions.",
        }),
        narrative: `Coverage opportunity on ${input.catalog.weakestType}.`,
      },
      {
        id: this.createId("know-opp"),
        title: "Improve knowledge graph connectivity",
        priority: priorityFromScore(input.graph.connectivityScore),
        score: clamp(100 - input.graph.connectivityScore + 48),
        expectedValue: Math.round(input.graph.nodes.length * 3 + 30),
        lenses: buildLenses({
          coverageCompleteness: "Links reveal related known knowledge.",
          provenanceTrust: "Lineage edges strengthen provenance.",
          ownershipClarity: "Ownership edges clarify accountability.",
          validationCurrency: "Version edges track currency.",
          dependencyReach: `Reduce orphans (${input.graph.orphanCount}).`,
          decisionInfluence: "Connected knowledge guides decisions.",
        }),
        narrative: "Graph connectivity is a high-leverage institutional memory lever.",
      },
      {
        id: this.createId("know-opp"),
        title: `Close ${input.gaps.hottestGap} gap`,
        priority: priorityFromRisk(input.gaps.overallGapPressure / 100),
        score: clamp(input.gaps.overallGapPressure + 45),
        expectedValue: Math.round(input.baseline.gapPressure * 100 + 50),
        lenses: buildLenses({
          coverageCompleteness: "Gap closure expands completeness.",
          provenanceTrust: "Documented sources restore trust.",
          ownershipClarity: "Assign owners for remediation.",
          validationCurrency: "Validate after documentation.",
          dependencyReach: "Dependents gain reliable references.",
          decisionInfluence: "Fewer knowledge gaps in decisions.",
        }),
        narrative: `Gap opportunity on ${input.gaps.hottestGap}.`,
      },
      {
        id: this.createId("know-opp"),
        title: `Grow ${input.expertiseMap.weakestDomain} expertise coverage`,
        priority: priorityFromScore(input.expertiseMap.overallCoverage),
        score: clamp(100 - input.expertiseMap.overallCoverage + 50),
        expectedValue: Math.round(input.baseline.expertCoverage + 40),
        lenses: buildLenses({
          coverageCompleteness: "Experts accelerate capture.",
          provenanceTrust: "Expert review raises trust.",
          ownershipClarity: "Experts become durable owners.",
          validationCurrency: "Experts keep knowledge current.",
          dependencyReach: "Clear ask-paths for dependents.",
          decisionInfluence: "Expert counsel improves decisions.",
        }),
        narrative: `Expertise opportunity on ${input.expertiseMap.weakestDomain}.`,
      },
    ];
    return opportunities.sort((a, c) => c.score - a.score);
  }
}

export class KnowledgeRecommendationComposer
  implements KnowledgeRecommendationComposerContract
{
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  compose(input: {
    opportunities: KnowledgeOpportunityRecord[];
    risks: KnowledgeRiskRecord[];
    catalog: KnowledgeCatalogResult;
    gaps: KnowledgeGapResult;
    provenance: KnowledgeProvenanceSuite;
    now: Date;
  }): KnowledgeRecommendationRecord[] {
    void input.now;
    const primaryArtifact =
      input.catalog.artifacts.find((a) => a.type === input.catalog.weakestType) ??
      input.catalog.artifacts[0]!;
    const decisionArtifacts = input.catalog.artifacts.filter(
      (a) => a.type === "decisions" || a.provenance.relatedDecisions.length > 0
    );

    const attachTrace = (
      rec: Omit<
        KnowledgeRecommendationRecord,
        | "knowledgeUsed"
        | "knowledgeConfidence"
        | "knowledgeSource"
        | "lastValidationDate"
        | "relatedOrganizationalDecisions"
      >,
      artifacts = [primaryArtifact]
    ): KnowledgeRecommendationRecord => {
      const knowledgeUsed = artifacts.map((a) => a.id);
      const knowledgeConfidence =
        artifacts.reduce((s, a) => s + a.confidence, 0) /
        Math.max(1, artifacts.length) /
        100;
      const knowledgeSource: KnowledgeSource | null =
        artifacts[0]?.source ?? null;
      const lastValidationDate =
        artifacts
          .map((a) => a.provenance.lastValidationDate)
          .filter((d): d is string => Boolean(d))
          .sort()
          .at(-1) ?? null;
      const relatedOrganizationalDecisions = [
        ...new Set(
          artifacts.flatMap((a) => a.provenance.relatedDecisions).concat(
            decisionArtifacts.flatMap((a) => a.provenance.relatedDecisions)
          )
        ),
      ].slice(0, 6);

      return {
        ...rec,
        knowledgeUsed,
        knowledgeConfidence,
        knowledgeSource,
        lastValidationDate,
        relatedOrganizationalDecisions,
      };
    };

    const fromOpps = input.opportunities.slice(0, 3).map((o) =>
      attachTrace({
        id: this.createId("know-rec"),
        title: o.title,
        priority: o.priority,
        score: o.score,
        rationale: o.narrative,
        lenses: o.lenses,
        narrative: o.narrative,
        expectedLift: `Expected value ~${o.expectedValue}`,
        riskReduction: "Improves institutional memory resilience",
      })
    );

    const coverageRec = attachTrace({
      id: this.createId("know-rec"),
      title: `Own documentation for ${input.catalog.weakestType}`,
      priority: "high",
      score: clamp(
        100 -
          (input.catalog.artifacts.find((a) => a.type === input.catalog.weakestType)
            ?.confidence ?? 55)
      ),
      rationale: input.catalog.narrative,
      lenses: buildLenses({
        coverageCompleteness: `Assign capture owners for ${input.catalog.weakestType}.`,
        provenanceTrust: `Capture source and evidence on intake (trust ${Math.round(input.provenance.overallTrustScore)}).`,
        ownershipClarity: "Name a durable owner per artifact.",
        validationCurrency: "Set validation dates at creation.",
        dependencyReach: "Publish for dependent teams.",
        decisionInfluence: "Surface in executive knowledge briefs.",
      }),
      narrative: `Establish clear ownership for ${input.catalog.weakestType} documentation.`,
      expectedLift: "Higher coverage and reusable institutional memory",
      riskReduction: "Reduces unmanaged knowledge gaps",
    });

    const gapRec = attachTrace(
      {
        id: this.createId("know-rec"),
        title: `Mitigate ${input.gaps.hottestGap}`,
        priority: "high",
        score: clamp(input.gaps.overallGapPressure),
        rationale: input.gaps.narrative,
        lenses: buildLenses({
          coverageCompleteness: "Closes a concrete completeness hole.",
          provenanceTrust: "Documents how we know it.",
          ownershipClarity: "Assigns remediation owners.",
          validationCurrency: "Schedules re-validation.",
          dependencyReach: "Clears orphan dependencies.",
          decisionInfluence: "Reduces decision blind spots.",
        }),
        narrative: `Prioritize remediation for ${input.gaps.hottestGap}.`,
        expectedLift: "Lower institutional memory risk",
        riskReduction: input.risks[0]
          ? `Helps mitigate ${input.risks[0].title}`
          : "Reduces knowledge gap pressure",
      },
      input.catalog.artifacts.slice(0, 3)
    );

    return [...fromOpps, coverageRec, gapRec]
      .sort((a, c) => c.score - a.score)
      .slice(0, 8);
  }
}

export class ExecutiveKnowledgeBriefGenerator
  implements ExecutiveKnowledgeBriefGeneratorContract
{
  generate(input: {
    request: KnowledgeRequest;
    baseline: KnowledgeBaseline;
    scores: {
      healthScore: KnowledgeScore;
      coverageScore: KnowledgeScore;
      graphScore: KnowledgeScore;
      searchScore: KnowledgeScore;
      gapScore: KnowledgeScore;
      expertiseScore: KnowledgeScore;
      qualityScore: KnowledgeScore;
      provenanceScore: KnowledgeScore;
      memoryScore: KnowledgeScore;
      evolutionScore: KnowledgeScore;
    };
    risks: KnowledgeRiskRecord[];
    opportunities: KnowledgeOpportunityRecord[];
    catalog: KnowledgeCatalogResult;
    recommendations: KnowledgeRecommendationRecord[];
    confidence: KnowledgeConfidenceScore;
    now: Date;
  }): ExecutiveKnowledgeBrief {
    return {
      generatedAt: input.now.toISOString(),
      headline: `Knowledge health ${Math.round(input.scores.healthScore.value)} — weakest type ${input.catalog.weakestType}`,
      summary:
        input.request.question ??
        "How healthy is our institutional memory, and where should we improve knowledge capture and reuse?",
      healthScore: input.scores.healthScore.value,
      coverageScore: input.scores.coverageScore.value,
      graphScore: input.scores.graphScore.value,
      searchScore: input.scores.searchScore.value,
      gapScore: input.scores.gapScore.value,
      expertiseScore: input.scores.expertiseScore.value,
      qualityScore: input.scores.qualityScore.value,
      provenanceScore: input.scores.provenanceScore.value,
      memoryScore: input.scores.memoryScore.value,
      topRecommendations: input.recommendations.slice(0, 5).map((r) => r.title),
      topRisks: input.risks.slice(0, 5).map((r) => r.title),
      topOpportunities: input.opportunities.slice(0, 5).map((o) => o.title),
      weakestKnowledgeType: input.catalog.weakestType,
      lenses: buildLenses({
        coverageCompleteness: `Coverage ${Math.round(input.scores.coverageScore.value)}; weakest ${input.catalog.weakestType}.`,
        provenanceTrust: `Provenance ${Math.round(input.scores.provenanceScore.value)}.`,
        ownershipClarity: `Ownership ${Math.round(input.baseline.ownershipScore)}.`,
        validationCurrency: `Validation ${Math.round(input.baseline.validationScore)}; quality ${Math.round(input.scores.qualityScore.value)}.`,
        dependencyReach: `Graph ${Math.round(input.scores.graphScore.value)}; memory ${Math.round(input.scores.memoryScore.value)}.`,
        decisionInfluence: `Decision density ${(input.baseline.decisionDensity * 100).toFixed(0)}% (confidence ${input.confidence.level}); evolution resilience ${Math.round(input.scores.evolutionScore.value)}.`,
      }),
      narrative: `Executive knowledge brief: institutional memory health ${Math.round(input.scores.healthScore.value)}; weakest type ${input.catalog.weakestType}.`,
    };
  }
}
