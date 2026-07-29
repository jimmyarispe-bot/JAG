/**
 * Shared Education cognitive contributor pipeline.
 *
 * Lifecycle: Observe → Validate → Analyze (evidence) → Recommend → Result
 * Never executes Action Runtime. Never queries a database.
 */

import type {
  CognitiveContributor,
  CognitiveEvidenceRef,
  CognitiveFinding,
  CognitiveRecommendationDraft,
  CognitiveThinkRequest,
} from "@/lib/jag/runtime";
import {
  scoreReadinessConfidence,
} from "./EducationConfidence";
import type { EducationAnalysisContext } from "./EducationContributorContext";
import {
  flattenEducationActionProposals,
  type EducationContributorResult,
  type EducationRecommendation,
} from "./EducationContributorResult";
import {
  createEducationEvidenceBuilder,
  type EducationEvidenceBuilder,
  type EducationEvidenceItem,
} from "./EducationEvidenceBuilder";
import {
  createEducationRecommendationBuilder,
  type EducationRecommendFn,
} from "./EducationRecommendationBuilder";
import {
  extractEducationObservation,
  hasEducationDomainHint,
  intentIdMatches,
} from "./EducationObservation";
import { readinessPriorityRank } from "./EducationPriority";

export interface EducationPipelineDefinition<TObservation extends object> {
  contributorId: string;
  evidenceSource: string;
  topicId: string;
  attributeKey: string;
  capabilities?: readonly string[];
  priority?: number;
  /** Subject id extracted from observation for result.subjectId. */
  subjectId: (observation: TObservation) => string;
  supportsIntent?: (intentId: string) => boolean;
  validate: (observation: TObservation) => void;
  collectEvidence: (
    builder: EducationEvidenceBuilder,
    observation: TObservation
  ) => void;
  recommend: EducationRecommendFn<TObservation>;
  explainReadiness?: (input: {
    readiness: EducationContributorResult["readiness"];
    blockingIssues: readonly string[];
    warnings: readonly string[];
    subjectLabel?: string;
  }) => string;
}

export function runEducationIntelligencePipeline<TObservation extends object>(
  definition: EducationPipelineDefinition<TObservation>,
  observation: TObservation,
  options: { now?: string; request?: CognitiveThinkRequest } = {}
): EducationContributorResult {
  definition.validate(observation);

  const evidenceBuilder = createEducationEvidenceBuilder({
    source: definition.evidenceSource,
    scopeId: definition.subjectId(observation),
    now: options.now,
  });
  definition.collectEvidence(evidenceBuilder, observation);
  const evidenceBuild = evidenceBuilder.build();

  const scored = scoreReadinessConfidence({
    blockingCount: evidenceBuild.blockingIssues.length,
    warningCount: evidenceBuild.warnings.length,
  });

  const explanation =
    definition.explainReadiness?.({
      readiness: scored.readiness,
      blockingIssues: evidenceBuild.blockingIssues,
      warnings: evidenceBuild.warnings,
    }) ??
    defaultReadinessExplanation(
      scored.readiness,
      evidenceBuild.blockingIssues,
      evidenceBuild.warnings
    );

  const analysisCtx: EducationAnalysisContext<TObservation> = {
    contributorId: definition.contributorId,
    observation,
    evidenceSource: definition.evidenceSource,
    topicId: definition.topicId,
    request: options.request,
    now: options.now,
    evidence: evidenceBuild.items,
    blockingIssues: evidenceBuild.blockingIssues,
    warnings: evidenceBuild.warnings,
    readiness: scored.readiness,
    confidence: scored.confidence,
  };

  const recommendationBuilder = createEducationRecommendationBuilder(
    definition.contributorId
  );
  definition.recommend(recommendationBuilder, analysisCtx);
  const recommendations = recommendationBuilder.build(evidenceBuild.items);
  const suggestedActions = flattenEducationActionProposals(recommendations);

  return {
    subjectId: definition.subjectId(observation),
    evidence: evidenceBuild.refs,
    recommendations,
    confidence: scored.confidence,
    explanation,
    priority: readinessPriorityRank(scored.readiness),
    blockingIssues: evidenceBuild.blockingIssues,
    warnings: evidenceBuild.warnings,
    suggestedActions,
    readiness: scored.readiness,
    analyzedAt: options.now ?? new Date().toISOString(),
    attributes: {
      topicId: definition.topicId,
      contributorId: definition.contributorId,
    },
  };
}

/**
 * Build a Runtime CognitiveContributor from a shared Education pipeline definition.
 * Named distinctly from the domain placeholder `createEducationCognitiveContributor`.
 */
export function defineEducationCognitiveContributor<TObservation extends object>(
  definition: EducationPipelineDefinition<TObservation>
): CognitiveContributor {
  const priority = definition.priority ?? 40;

  return {
    id: definition.contributorId,
    priority,
    capabilities: definition.capabilities ?? ["education"],
    supports(request) {
      if (extractEducationObservation<TObservation>(request, definition.attributeKey)) {
        return true;
      }
      if (definition.supportsIntent) {
        return intentIdMatches(request, definition.supportsIntent);
      }
      return hasEducationDomainHint(request);
    },
    gatherEvidence(request) {
      const observation = extractEducationObservation<TObservation>(
        request,
        definition.attributeKey
      );
      if (!observation) return [];
      return runEducationIntelligencePipeline(definition, observation, {
        now: request.now,
        request,
      }).evidence;
    },
    analyze(request, evidence) {
      const observation = extractEducationObservation<TObservation>(
        request,
        definition.attributeKey
      );
      if (!observation) return [];
      const result = runEducationIntelligencePipeline(definition, observation, {
        now: request.now,
        request,
      });
      return toFindings(definition.contributorId, result, evidence);
    },
    recommend(request, evidence) {
      const observation = extractEducationObservation<TObservation>(
        request,
        definition.attributeKey
      );
      if (!observation) return [];
      const result = runEducationIntelligencePipeline(definition, observation, {
        now: request.now,
        request,
      });
      return toRecommendationDrafts(definition.topicId, result, evidence);
    },
  };
}

function defaultReadinessExplanation(
  readiness: EducationContributorResult["readiness"],
  blockingIssues: readonly string[],
  warnings: readonly string[]
): string {
  if (readiness === "ready") {
    return "Observation satisfies readiness criteria with supporting evidence.";
  }
  if (readiness === "conditional") {
    return `Conditionally ready with warnings: ${warnings.join("; ")}`;
  }
  return `Blocked: ${blockingIssues.join("; ")}`;
}

function toFindings(
  providerId: string,
  result: EducationContributorResult,
  evidence: readonly CognitiveEvidenceRef[]
): CognitiveFinding[] {
  const findings: CognitiveFinding[] = [
    {
      id: `finding.${providerId}.readiness.${result.subjectId}`,
      providerId,
      title: `Readiness: ${result.readiness}`,
      summary: result.explanation,
      confidence: result.confidence,
      evidenceRefs: evidence.length > 0 ? evidence : result.evidence,
      attributes: {
        readiness: result.readiness,
        blockingIssues: result.blockingIssues,
        warnings: result.warnings,
        priority: result.priority,
      },
    },
  ];
  for (const issue of result.blockingIssues) {
    findings.push({
      id: `finding.${providerId}.blocking.${hash(issue)}`,
      providerId,
      title: "Blocking issue",
      summary: issue,
      confidence: 0.95,
      evidenceRefs: result.evidence,
      attributes: { severity: "blocking" },
    });
  }
  return findings;
}

function toRecommendationDrafts(
  topicId: string,
  result: EducationContributorResult,
  evidence: readonly CognitiveEvidenceRef[]
): CognitiveRecommendationDraft[] {
  return result.recommendations.map((rec) =>
    recommendationToDraft(topicId, rec, result, evidence)
  );
}

function recommendationToDraft(
  topicId: string,
  rec: EducationRecommendation,
  result: EducationContributorResult,
  evidence: readonly CognitiveEvidenceRef[]
): CognitiveRecommendationDraft {
  const refs =
    evidence.length > 0
      ? evidence.filter((e) => rec.evidenceIds.includes(e.id))
      : result.evidence.filter((e) => rec.evidenceIds.includes(e.id));
  const typeAttr = rec.attributes?.type;
  const type =
    typeAttr === "warning"
      ? "warning"
      : typeAttr === "informational"
        ? "informational"
        : "actionable";
  return {
    id: rec.id,
    type,
    title: rec.title,
    rationale: rec.explanation,
    priority: rec.priority,
    confidence: rec.confidence,
    evidenceRefs: refs.length > 0 ? refs : result.evidence,
    topicId,
    suggestedNextAction: rec.suggestedActions[0]?.actionId,
    attributes: {
      kind: rec.kind,
      why: rec.explanation,
      supportingEvidenceIds: rec.evidenceIds,
      confidence: rec.confidence,
      priority: rec.priority,
      suggestedActions: rec.suggestedActions,
      constitutionalTrace: rec.constitutionalTrace,
      actionProposalsOnly: true,
      formattedExplanation: rec.attributes?.formattedExplanation,
    },
  };
}

function hash(value: string): string {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

export type { EducationEvidenceItem };
