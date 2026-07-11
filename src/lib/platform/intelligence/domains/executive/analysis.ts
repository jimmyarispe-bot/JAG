/**
 * Executive Intelligence — classification and findings analysis.
 *
 * Classifies executive requests and turns diagnostics into findings.
 * Tenant-agnostic; no external calls.
 */

import type { ExecutiveDiagnostics } from "@/lib/platform/intelligence/domains/executive/diagnostics";
import type {
  ExecutiveAnalysisResult,
  ExecutiveCategory,
  ExecutiveClassification,
  ExecutiveDiagnosticSignal,
  ExecutiveDiagnosticsResult,
  ExecutiveFinding,
  ExecutiveRequest,
  ExecutiveSeverity,
} from "@/lib/platform/intelligence/domains/executive/types";
import { EXECUTIVE_CATEGORIES } from "@/lib/platform/intelligence/domains/executive/types";
import type { IntelligenceConfidenceScore } from "@/lib/platform/intelligence/types";

const CATEGORY_CUES: ReadonlyArray<{ category: ExecutiveCategory; cues: readonly string[] }> = [
  { category: "strategic", cues: ["strategy", "strategic", "goal", "initiative", "vision"] },
  { category: "risk", cues: ["risk", "threat", "exposure", "alert", "decline"] },
  { category: "opportunity", cues: ["opportunity", "growth", "expand", "upside"] },
  { category: "forecast", cues: ["forecast", "projection", "predict", "outlook"] },
  { category: "scenario", cues: ["scenario", "what if", "sensitivity", "simulation"] },
  { category: "summary", cues: ["summary", "brief", "morning brief", "overview"] },
  { category: "board", cues: ["board", "trustee", "board pack", "board report"] },
  { category: "enrollment", cues: ["enrollment", "admissions", "funnel", "retention"] },
  {
    category: "financial_health",
    cues: ["cash", "revenue", "collections", "ebitda", "budget", "financial"],
  },
  { category: "operations", cues: ["operations", "staffing", "productivity", "bottleneck"] },
  { category: "compliance", cues: ["compliance", "audit", "policy", "licensure", "accreditation"] },
];

/** Optional analysis tuning (tenant-agnostic). */
export interface ExecutiveAnalysisOptions {
  minCueHits?: number;
}

/** Dependencies for analysis when diagnose-then-analyze is composed. */
export interface ExecutiveAnalysisDependencies {
  diagnostics?: ExecutiveDiagnostics;
}

/**
 * Classifies executive requests and generates findings.
 */
export class ExecutiveAnalysis {
  private readonly minCueHits: number;
  private readonly diagnostics: ExecutiveDiagnostics | null;

  constructor(
    options: ExecutiveAnalysisOptions = {},
    dependencies: ExecutiveAnalysisDependencies = {}
  ) {
    this.minCueHits = options.minCueHits ?? 1;
    this.diagnostics = dependencies.diagnostics ?? null;
  }

  /**
   * Classify an executive request into a reusable category.
   */
  classify(request: ExecutiveRequest): ExecutiveClassification {
    const corpus = this.buildCorpus(request);
    const scores = this.scoreCategories(corpus, request.signals ?? []);
    const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
    const top = ranked[0];
    const category: ExecutiveCategory =
      top && top[1] >= this.minCueHits ? top[0] : "general";

    const secondaryCategories = ranked
      .filter(([cat, score]) => cat !== category && score >= this.minCueHits)
      .slice(0, 3)
      .map(([cat]) => cat);

    const matchedSignals = this.collectMatchedCues(corpus, category);
    const severity = this.inferSeverity(corpus, category);
    const confidence = this.buildConfidence(top?.[1] ?? 0, matchedSignals.length);

    return {
      requestId: request.requestId,
      category,
      secondaryCategories,
      severity,
      priority: severity,
      confidence,
      matchedSignals,
      rationale:
        category === "general"
          ? ["No strong executive category cues matched; defaulted to general"]
          : [`Primary category "${category}" selected from cue scoring`],
      metadata: request.metadata,
    };
  }

  /**
   * Generate findings from diagnostics and classification.
   */
  generateFindings(
    request: ExecutiveRequest,
    classification: ExecutiveClassification,
    diagnostics: ExecutiveDiagnosticsResult
  ): ExecutiveAnalysisResult {
    const findings: ExecutiveFinding[] = diagnostics.hypotheses.map((hypothesis, index) => ({
      findingId: `${request.requestId}:finding:${index}`,
      category: hypothesis.category,
      title: hypothesis.label,
      summary: hypothesis.description ?? hypothesis.label,
      severity: this.findingSeverity(hypothesis.confidence.value, classification.severity),
      confidence: hypothesis.confidence,
      evidenceRefs: hypothesis.evidenceRefs,
    }));

    const primaryFinding = findings[0] ?? null;
    const summary = primaryFinding
      ? `Primary finding: ${primaryFinding.title}`
      : `No specialized findings for category "${classification.category}"`;

    return {
      requestId: request.requestId,
      classification,
      findings,
      primaryFinding,
      summary,
      metadata: request.metadata,
    };
  }

  /**
   * Classify, diagnose (if diagnostics injected), and generate findings.
   */
  analyze(request: ExecutiveRequest): ExecutiveAnalysisResult {
    const classification = this.classify(request);
    if (!this.diagnostics) {
      return {
        requestId: request.requestId,
        classification,
        findings: [],
        primaryFinding: null,
        summary: "Diagnostics service not injected; classification only",
        metadata: request.metadata,
      };
    }
    const diagnostics = this.diagnostics.diagnose(request, classification);
    return this.generateFindings(request, classification, diagnostics);
  }

  listCategories(): readonly ExecutiveCategory[] {
    return EXECUTIVE_CATEGORIES;
  }

  private buildCorpus(request: ExecutiveRequest): string {
    return [request.subject, request.description ?? "", request.workspace ?? ""]
      .join(" ")
      .toLowerCase();
  }

  private scoreCategories(
    corpus: string,
    signals: ExecutiveDiagnosticSignal[]
  ): Map<ExecutiveCategory, number> {
    const scores = new Map<ExecutiveCategory, number>();
    for (const category of EXECUTIVE_CATEGORIES) {
      scores.set(category, 0);
    }
    for (const entry of CATEGORY_CUES) {
      let hits = 0;
      for (const cue of entry.cues) {
        if (corpus.includes(cue)) hits += 1;
      }
      scores.set(entry.category, (scores.get(entry.category) ?? 0) + hits);
    }
    for (const signal of signals) {
      const text = `${signal.key} ${signal.label} ${String(signal.value)}`.toLowerCase();
      for (const entry of CATEGORY_CUES) {
        for (const cue of entry.cues) {
          if (text.includes(cue)) {
            scores.set(entry.category, (scores.get(entry.category) ?? 0) + 1);
          }
        }
      }
    }
    return scores;
  }

  private collectMatchedCues(corpus: string, category: ExecutiveCategory): string[] {
    const entry = CATEGORY_CUES.find((item) => item.category === category);
    if (!entry) return [];
    return entry.cues.filter((cue) => corpus.includes(cue));
  }

  private inferSeverity(corpus: string, category: ExecutiveCategory): ExecutiveSeverity {
    if (corpus.includes("critical") || corpus.includes("urgent") || corpus.includes("crisis")) {
      return "critical";
    }
    if (category === "risk" || category === "financial_health" || category === "compliance") {
      return "high";
    }
    if (category === "general") return "low";
    return "medium";
  }

  private buildConfidence(score: number, matchedCueCount: number): IntelligenceConfidenceScore {
    const value = Math.min(1, Math.max(0, score * 0.15 + matchedCueCount * 0.05));
    const level =
      value >= 0.75 ? "high" : value >= 0.45 ? "medium" : value > 0 ? "low" : "unknown";
    return {
      value,
      level,
      factors: [
        {
          key: "cue_score",
          label: "Category Cue Score",
          contribution: Math.min(1, score * 0.15),
        },
        {
          key: "matched_cues",
          label: "Matched Cues",
          contribution: Math.min(1, matchedCueCount * 0.05),
        },
      ],
    };
  }

  private findingSeverity(
    confidenceValue: number,
    classificationSeverity: ExecutiveSeverity
  ): ExecutiveSeverity {
    if (confidenceValue >= 0.75 && classificationSeverity === "critical") return "critical";
    if (confidenceValue >= 0.6) return classificationSeverity;
    if (classificationSeverity === "critical") return "high";
    return classificationSeverity;
  }
}
