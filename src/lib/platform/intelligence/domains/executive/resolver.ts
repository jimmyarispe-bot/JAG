/**
 * Executive Intelligence — resolver.
 *
 * Classifies, diagnoses, generates findings and recommendations,
 * and produces follow-up actions for executive requests.
 */

import type { ExecutiveAnalysis } from "@/lib/platform/intelligence/domains/executive/analysis";
import type { ExecutiveDiagnostics } from "@/lib/platform/intelligence/domains/executive/diagnostics";
import type { ExecutiveFollowups } from "@/lib/platform/intelligence/domains/executive/followups";
import type { ExecutiveRecommendations } from "@/lib/platform/intelligence/domains/executive/recommendations";
import type {
  ExecutiveBriefing,
  ExecutiveIntelligenceResult,
  ExecutiveRequest,
} from "@/lib/platform/intelligence/domains/executive/types";
import { EXECUTIVE_INTELLIGENCE_VERSION } from "@/lib/platform/intelligence/domains/executive/types";

/** Injected collaborators for the executive resolver. */
export interface ExecutiveResolverDependencies {
  analysis: ExecutiveAnalysis;
  diagnostics: ExecutiveDiagnostics;
  recommendations: ExecutiveRecommendations;
  followups: ExecutiveFollowups;
}

/**
 * Builds executive briefings from classified requests.
 */
export class ExecutiveResolver {
  private readonly analysis: ExecutiveAnalysis;
  private readonly diagnostics: ExecutiveDiagnostics;
  private readonly recommendations: ExecutiveRecommendations;
  private readonly followups: ExecutiveFollowups;

  constructor(dependencies: ExecutiveResolverDependencies) {
    this.analysis = dependencies.analysis;
    this.diagnostics = dependencies.diagnostics;
    this.recommendations = dependencies.recommendations;
    this.followups = dependencies.followups;
  }

  /**
   * Classify, diagnose, analyze findings, recommend, and schedule follow-ups.
   */
  analyze(request: ExecutiveRequest): ExecutiveIntelligenceResult {
    const classification = this.analysis.classify(request);
    const diagnosticsResult = this.diagnostics.diagnose(request, classification);
    const analysisResult = this.analysis.generateFindings(
      request,
      classification,
      diagnosticsResult
    );
    const recommendationSet = this.recommendations.getRecommendations(classification.category);
    const briefingId = `${request.requestId}:briefing`;
    const followup = this.followups.schedule(
      request.requestId,
      briefingId,
      analysisResult,
      recommendationSet
    );

    const summary = analysisResult.primaryFinding
      ? `${analysisResult.summary}. Recommendations: ${recommendationSet.title}.`
      : `Category "${classification.category}". ${recommendationSet.summary}`;

    const briefing: ExecutiveBriefing = {
      briefingId,
      requestId: request.requestId,
      status: "ready",
      classification,
      diagnostics: diagnosticsResult,
      analysis: analysisResult,
      recommendations: recommendationSet,
      followup,
      summary,
      createdAt: new Date().toISOString(),
      metadata: request.metadata,
    };

    return {
      requestId: request.requestId,
      classification,
      diagnostics: diagnosticsResult,
      analysis: analysisResult,
      recommendations: recommendationSet,
      followup,
      briefing,
      domainVersion: EXECUTIVE_INTELLIGENCE_VERSION,
      completedAt: new Date().toISOString(),
      metadata: request.metadata,
    };
  }
}
