/**
 * Strategic Intelligence — analysis.
 *
 * Converts intelligence findings into strategic opportunities.
 */

import type {
  StrategicAnalysisResult,
  StrategicFindingInput,
  StrategicGoalPriority,
  StrategicOpportunity,
  StrategicOpportunityKind,
  StrategicRequest,
} from "@/lib/platform/intelligence/domains/strategic/types";
import type { IntelligenceConfidenceScore } from "@/lib/platform/intelligence/types";

const KIND_CUES: ReadonlyArray<{
  kind: StrategicOpportunityKind;
  cues: readonly string[];
}> = [
  {
    kind: "organizational_risk",
    cues: ["org risk", "organizational risk", "governance", "reputation", "crisis"],
  },
  {
    kind: "growth_opportunity",
    cues: ["growth", "expand", "enrollment growth", "market", "pipeline", "opportunity"],
  },
  {
    kind: "mission_opportunity",
    cues: ["mission", "impact", "equity", "community mission", "purpose"],
  },
  {
    kind: "operational_weakness",
    cues: ["operations", "bottleneck", "process", "productivity", "throughput", "inefficien"],
  },
  {
    kind: "financial_weakness",
    cues: ["cash", "revenue", "budget", "deficit", "collections", "financial", "cost"],
  },
  {
    kind: "compliance_risk",
    cues: ["compliance", "audit", "policy", "accreditation", "licensure", "regulation"],
  },
  {
    kind: "staffing_issue",
    cues: ["staffing", "hiring", "retention", "teacher", "vacancy", "workforce", "turnover"],
  },
  {
    kind: "customer_experience_issue",
    cues: ["parent", "family", "customer", "experience", "satisfaction", "nps", "service"],
  },
];

/** Optional analysis tuning. */
export interface StrategicAnalysisOptions {
  defaultPriority?: StrategicGoalPriority;
}

/**
 * Transforms findings into ranked strategic opportunities.
 */
export class StrategicAnalysis {
  private readonly defaultPriority: StrategicGoalPriority;

  constructor(options: StrategicAnalysisOptions = {}) {
    this.defaultPriority = options.defaultPriority ?? "medium";
  }

  /**
   * Analyze a strategic request and derive opportunities from findings.
   */
  analyze(request: StrategicRequest): StrategicAnalysisResult {
    const findings = request.findings ?? [];
    const opportunities =
      findings.length > 0
        ? findings.map((finding, index) => this.fromFinding(request.requestId, finding, index))
        : [this.fromSubject(request)];

    const ranked = [...opportunities].sort(
      (a, b) => priorityRank(b.priority) - priorityRank(a.priority) || b.confidence.value - a.confidence.value
    );

    const primaryOpportunity = ranked[0] ?? null;
    const summary = primaryOpportunity
      ? `Identified ${ranked.length} strategic opportunit${ranked.length === 1 ? "y" : "ies"}; primary: ${primaryOpportunity.title} (${primaryOpportunity.kind}).`
      : "No strategic opportunities identified.";

    return {
      requestId: request.requestId,
      opportunities: ranked,
      primaryOpportunity,
      summary,
      metadata: request.metadata,
    };
  }

  private fromFinding(
    requestId: string,
    finding: StrategicFindingInput,
    index: number
  ): StrategicOpportunity {
    const corpus = [
      finding.title,
      finding.summary,
      ...(finding.signals ?? []),
      ...(finding.kindHints ?? []),
    ]
      .join(" ")
      .toLowerCase();

    const kind =
      finding.kindHints?.[0] ?? this.inferKind(corpus) ?? "organizational_risk";
    const priority = finding.severity ?? this.inferPriority(corpus, kind);
    const confidence =
      finding.confidence ?? this.buildConfidence(corpus, kind, finding.kindHints?.length ?? 0);

    return {
      opportunityId: `${requestId}:opportunity:${index}`,
      kind,
      title: finding.title,
      description: finding.summary,
      priority,
      sourceFindingId: finding.findingId,
      confidence,
      evidenceRefs: finding.evidenceRefs ?? [],
      metadata: finding.metadata,
    };
  }

  private fromSubject(request: StrategicRequest): StrategicOpportunity {
    const corpus = `${request.subject} ${request.description ?? ""}`.toLowerCase();
    const kind = this.inferKind(corpus) ?? "growth_opportunity";
    const priority = this.inferPriority(corpus, kind);

    return {
      opportunityId: `${request.requestId}:opportunity:0`,
      kind,
      title: request.subject,
      description: request.description ?? request.subject,
      priority,
      sourceFindingId: `${request.requestId}:finding:synthetic`,
      confidence: this.buildConfidence(corpus, kind, 0),
      evidenceRefs: [],
      metadata: request.metadata,
    };
  }

  private inferKind(corpus: string): StrategicOpportunityKind | null {
    let best: StrategicOpportunityKind | null = null;
    let bestHits = 0;
    for (const entry of KIND_CUES) {
      let hits = 0;
      for (const cue of entry.cues) {
        if (corpus.includes(cue)) hits += 1;
      }
      if (hits > bestHits) {
        bestHits = hits;
        best = entry.kind;
      }
    }
    return bestHits > 0 ? best : null;
  }

  private inferPriority(
    corpus: string,
    kind: StrategicOpportunityKind
  ): StrategicGoalPriority {
    if (corpus.includes("critical") || corpus.includes("urgent") || corpus.includes("crisis")) {
      return "critical";
    }
    if (
      kind === "compliance_risk" ||
      kind === "financial_weakness" ||
      kind === "organizational_risk"
    ) {
      return "high";
    }
    if (kind === "growth_opportunity" || kind === "mission_opportunity") {
      return "medium";
    }
    return this.defaultPriority;
  }

  private buildConfidence(
    corpus: string,
    kind: StrategicOpportunityKind,
    hintCount: number
  ): IntelligenceConfidenceScore {
    const cueHits = KIND_CUES.find((e) => e.kind === kind)?.cues.filter((c) =>
      corpus.includes(c)
    ).length ?? 0;
    const value = Math.min(1, Math.max(0.2, cueHits * 0.18 + hintCount * 0.15 + 0.25));
    const level =
      value >= 0.75 ? "high" : value >= 0.45 ? "medium" : value > 0 ? "low" : "unknown";
    return {
      value: Number(value.toFixed(4)),
      level,
      factors: [
        {
          key: "kind_cues",
          label: "Opportunity Kind Cues",
          contribution: Math.min(1, cueHits * 0.18),
        },
        {
          key: "kind_hints",
          label: "Explicit Kind Hints",
          contribution: Math.min(1, hintCount * 0.15),
        },
      ],
    };
  }
}

function priorityRank(priority: StrategicGoalPriority): number {
  switch (priority) {
    case "critical":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
    default: {
      const _exhaustive: never = priority;
      return _exhaustive;
    }
  }
}
