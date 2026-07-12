/**
 * Knowledge Intelligence — reasoner, gaps, expertise map (Sprint 040).
 */

import type {
  ExpertiseMapEngine as ExpertiseMapEngineContract,
  KnowledgeGapEngine as KnowledgeGapEngineContract,
  KnowledgeReasoner as KnowledgeReasonerContract,
} from "@/lib/platform/intelligence/knowledge/contracts";
import {
  buildConfidence,
  clamp,
  defaultCreateId,
  priorityFromRisk,
  statusFromScore,
} from "@/lib/platform/intelligence/knowledge/models";
import type {
  ExpertiseDomain,
  ExpertiseDomainRecord,
  ExpertiseMapResult,
  KnowledgeBaseline,
  KnowledgeCatalogResult,
  KnowledgeConflictRecord,
  KnowledgeGapCategory,
  KnowledgeGapRecord,
  KnowledgeGapResult,
  KnowledgeGraphResult,
  KnowledgeReasoningResult,
  KnowledgeSearchResult,
} from "@/lib/platform/intelligence/knowledge/types";
import {
  EXPERTISE_DOMAINS,
  KNOWLEDGE_GAP_CATEGORIES,
} from "@/lib/platform/intelligence/knowledge/types";

const GAP_LABELS: Record<KnowledgeGapCategory, string> = {
  missing_policy: "Missing Policy",
  stale_procedure: "Stale Procedure",
  undocumented_decision: "Undocumented Decision",
  unowned_artifact: "Unowned Artifact",
  unvalidated_insight: "Unvalidated Insight",
  orphan_dependency: "Orphan Dependency",
};

const EXPERTISE_LABELS: Record<ExpertiseDomain, string> = {
  academic: "Academic",
  operations: "Operations",
  finance: "Finance",
  governance: "Governance",
  people: "People",
  customer_experience: "Customer Experience",
};

export class KnowledgeReasoner implements KnowledgeReasonerContract {
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  reason(input: {
    baseline: KnowledgeBaseline;
    catalog: KnowledgeCatalogResult;
    graph: KnowledgeGraphResult;
    search: KnowledgeSearchResult;
    question?: string;
    now: Date;
  }): KnowledgeReasoningResult {
    void input.now;
    const b = input.baseline;
    const top = input.search.hits.slice(0, 5);
    const connectedArtifacts = top.map((h) => h.artifactId);

    const conflicts: KnowledgeConflictRecord[] = input.graph.edges
      .filter((e) => e.kind === "conflicts_with")
      .slice(0, 3)
      .map((e) => ({
        id: this.createId("know-conflict"),
        leftArtifactId: e.fromId,
        rightArtifactId: e.toId,
        severity: priorityFromRisk(b.conflictPressure),
        narrative: e.narrative,
      }));

    if (conflicts.length === 0 && b.conflictPressure > 0.2) {
      const left = input.catalog.artifacts[0];
      const right = input.catalog.artifacts[1];
      if (left && right) {
        conflicts.push({
          id: this.createId("know-conflict"),
          leftArtifactId: left.id,
          rightArtifactId: right.id,
          severity: priorityFromRisk(b.conflictPressure),
          narrative: `${left.title} may conflict with ${right.title}.`,
        });
      }
    }

    const missingTopics = [
      input.catalog.weakestType.replace(/_/g, " "),
      b.staleRatio > 0.35 ? "validation refresh cadence" : null,
      b.gapPressure > 0.35 ? "ownership assignments" : null,
      b.expertCoverage < 65 ? "expert coverage map" : null,
    ].filter((item): item is string => Boolean(item));

    const answer =
      input.question ??
      `Institutional memory coverage is ${Math.round(input.catalog.overallCoverage)} with ${conflicts.length} conflict(s) and weakest type ${input.catalog.weakestType}.`;

    const confidence = buildConfidence([
      {
        key: "catalog",
        label: "Catalog coverage",
        contribution: clamp(input.catalog.overallCoverage / 100),
      },
      {
        key: "graph",
        label: "Graph connectivity",
        contribution: clamp(input.graph.connectivityScore / 100),
      },
      {
        key: "search",
        label: "Search coverage",
        contribution: clamp(input.search.queryCoverage / 100),
      },
      {
        key: "conflict",
        label: "Conflict clarity",
        contribution: clamp01Inverse(b.conflictPressure),
      },
    ]);

    return {
      answer,
      connectedArtifacts,
      conflicts,
      missingTopics,
      confidence,
      narrative: `Reasoning over ${connectedArtifacts.length} artifacts; ${conflicts.length} conflicts; ${missingTopics.length} missing topics.`,
    };
  }
}

export class KnowledgeGapEngine implements KnowledgeGapEngineContract {
  analyze(input: {
    baseline: KnowledgeBaseline;
    catalog: KnowledgeCatalogResult;
    graph: KnowledgeGraphResult;
    reasoning: KnowledgeReasoningResult;
    now: Date;
  }): KnowledgeGapResult {
    void input.now;
    const b = input.baseline;

    const gaps: KnowledgeGapRecord[] = KNOWLEDGE_GAP_CATEGORIES.map((category) => {
      const { score, signals } = resolveGap(
        category,
        b,
        input.catalog,
        input.graph,
        input.reasoning
      );
      return {
        category,
        label: GAP_LABELS[category],
        severity: priorityFromRisk(score / 100),
        score,
        signals,
        narrative: `${GAP_LABELS[category]} pressure ${Math.round(score)}.`,
      };
    });

    const overallGapPressure = clamp(
      gaps.reduce((sum, g) => sum + g.score, 0) / gaps.length
    );
    const hottest = [...gaps].sort((a, c) => c.score - a.score)[0]!;

    return {
      gaps,
      overallGapPressure,
      hottestGap: hottest.category,
      narrative: `Knowledge gap pressure ${Math.round(overallGapPressure)}; hottest gap ${GAP_LABELS[hottest.category]}.`,
    };
  }
}

export class ExpertiseMapEngine implements ExpertiseMapEngineContract {
  map(input: {
    baseline: KnowledgeBaseline;
    catalog: KnowledgeCatalogResult;
    now: Date;
  }): ExpertiseMapResult {
    void input.now;
    const b = input.baseline;

    const domains: ExpertiseDomainRecord[] = EXPERTISE_DOMAINS.map((domain) => {
      const coverage = resolveExpertise(domain, b, input.catalog);
      return {
        domain,
        label: EXPERTISE_LABELS[domain],
        coverage,
        experts: expertsFor(domain),
        status: statusFromScore(coverage),
        narrative: `${EXPERTISE_LABELS[domain]} expertise ${statusFromScore(coverage)} at ${Math.round(coverage)}.`,
      };
    });

    const overallCoverage = clamp(
      domains.reduce((sum, d) => sum + d.coverage, 0) / domains.length
    );
    const weakest = [...domains].sort((a, c) => a.coverage - c.coverage)[0]!;

    return {
      domains,
      overallCoverage,
      weakestDomain: weakest.domain,
      narrative: `Expertise map coverage ${Math.round(overallCoverage)}; weakest domain ${EXPERTISE_LABELS[weakest.domain]}.`,
    };
  }
}

function clamp01Inverse(pressure: number): number {
  return clamp(1 - pressure);
}

function resolveGap(
  category: KnowledgeGapCategory,
  b: KnowledgeBaseline,
  catalog: KnowledgeCatalogResult,
  graph: KnowledgeGraphResult,
  reasoning: KnowledgeReasoningResult
): { score: number; signals: string[] } {
  switch (category) {
    case "missing_policy":
      return {
        score: clamp(100 - b.policyCoverage),
        signals: [`Policy coverage ${Math.round(b.policyCoverage)}`],
      };
    case "stale_procedure":
      return {
        score: clamp(b.staleRatio * 100),
        signals: [
          `Stale ratio ${(b.staleRatio * 100).toFixed(0)}%`,
          `Procedure coverage ${Math.round(b.procedureCoverage)}`,
        ],
      };
    case "undocumented_decision":
      return {
        score: clamp((1 - b.decisionDensity) * 80 + reasoning.conflicts.length * 5),
        signals: [
          `Decision density ${(b.decisionDensity * 100).toFixed(0)}%`,
          `Conflicts ${reasoning.conflicts.length}`,
        ],
      };
    case "unowned_artifact":
      return {
        score: clamp(100 - b.ownershipScore),
        signals: [`Ownership score ${Math.round(b.ownershipScore)}`],
      };
    case "unvalidated_insight":
      return {
        score: clamp((1 - b.validatedRatio) * 100),
        signals: [
          `Validated ratio ${(b.validatedRatio * 100).toFixed(0)}%`,
          `Weakest type ${catalog.weakestType}`,
        ],
      };
    case "orphan_dependency":
      return {
        score: clamp(graph.orphanCount * 8 + b.gapPressure * 40),
        signals: [
          `Orphans ${graph.orphanCount}`,
          `Gap pressure ${(b.gapPressure * 100).toFixed(0)}%`,
        ],
      };
  }
}

function resolveExpertise(
  domain: ExpertiseDomain,
  b: KnowledgeBaseline,
  catalog: KnowledgeCatalogResult
): number {
  switch (domain) {
    case "academic":
      return clamp(b.organizationHealthScore * 0.55 + catalog.overallCoverage * 0.45);
    case "operations":
      return clamp(b.operationsProcessDensity * 0.6 + b.procedureCoverage * 0.4);
    case "finance":
      return clamp(b.executionScore * 0.5 + b.provenanceScore * 0.5);
    case "governance":
      return clamp(b.policyCoverage * 0.55 + b.ownershipScore * 0.45);
    case "people":
      return clamp(b.expertCoverage * 0.55 + b.humanCapitalTransferScore * 0.45);
    case "customer_experience":
      return clamp(b.customerInsightDensity * 0.65 + b.reuseScore * 0.35);
  }
}

function expertsFor(domain: ExpertiseDomain): string[] {
  switch (domain) {
    case "academic":
      return ["academic-lead", "curriculum-owner"];
    case "operations":
      return ["ops-director", "process-owner"];
    case "finance":
      return ["cfo-proxy", "controller"];
    case "governance":
      return ["board-secretary", "compliance-lead"];
    case "people":
      return ["people-ops", "learning-lead"];
    case "customer_experience":
      return ["family-success", "enrollment-lead"];
  }
}
