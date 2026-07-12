/**
 * Document Intelligence — projection and queries.
 */

import type {
  DocumentProjection as DocumentProjectionContract,
  DocumentQueries as DocumentQueriesContract,
} from "@/lib/platform/intelligence/document/contracts";
import { buildConfidence } from "@/lib/platform/intelligence/document/models";
import type {
  DocumentProjectionResult,
  DocumentQueryRequest,
  DocumentQueryResult,
  DocumentResult,
} from "@/lib/platform/intelligence/document/types";

export class DocumentProjection implements DocumentProjectionContract {
  project(input: Parameters<DocumentProjectionContract["project"]>[0]): DocumentProjectionResult {
    return {
      generatedAt: input.brief.generatedAt,
      headline: input.brief.headline,
      healthScore: input.scores.healthScore.value,
      catalogScore: input.scores.catalogScore.value,
      classificationScore: input.scores.classificationScore.value,
      metadataScore: input.scores.metadataScore.value,
      entityScore: input.scores.entityScore.value,
      relationshipScore: input.scores.relationshipScore.value,
      versionScore: input.scores.versionScore.value,
      duplicateScore: input.scores.duplicateScore.value,
      summaryScore: input.scores.summaryScore.value,
      clauseScore: input.scores.clauseScore.value,
      riskScore: input.scores.riskScore.value,
      complianceScore: input.scores.complianceScore.value,
      expirationScore: input.scores.expirationScore.value,
      contributionScore: input.scores.contributionScore.value,
      catalog: input.catalog,
      dashboard: input.dashboard,
      brief: input.brief,
      metrics: {
        documentCount: input.baseline.documentCount,
        expiredRatio: input.baseline.expiredRatio,
        duplicatePressure: input.baseline.duplicatePressure,
        riskPressure: input.baseline.riskPressure,
        complianceCoverage: input.baseline.complianceCoverage,
        knowledgeContributionScore: input.baseline.knowledgeContributionScore,
      },
      overallConfidence: input.confidence,
    };
  }
}

export class DocumentQueries implements DocumentQueriesContract {
  ask(result: DocumentResult, request: DocumentQueryRequest): DocumentQueryResult {
    const focus = request.focus ?? "general";
    const max = request.maxResults ?? 5;
    let answer: string;
    let references: string[];

    switch (focus) {
      case "catalog":
        answer = result.catalog.narrative;
        references = result.catalog.documents.slice(0, max).map((document) => document.narrative);
        break;
      case "parse":
        answer = result.parse.narrative;
        references = [`Parsed ${result.parse.parsedCount}`, `OCR readiness ${Math.round(result.parse.ocrReady)}`];
        break;
      case "classification":
        answer = result.classification.narrative;
        references = Object.entries(result.classification.byType).slice(0, max).map(([type, count]) => `${type}: ${count}`);
        break;
      case "metadata":
        answer = result.metadata.narrative;
        references = result.metadata.records.slice(0, max).map((record) => `${record.documentId}: ${Math.round(record.completeness)}`);
        break;
      case "entities":
        answer = result.entities.narrative;
        references = result.entities.entities.slice(0, max).map((entity) => `${entity.label} (${entity.kind})`);
        break;
      case "relationships":
        answer = result.relationships.narrative;
        references = result.relationships.relationships.slice(0, max).map((relationship) => relationship.narrative);
        break;
      case "risk":
        answer = result.riskSuite.narrative;
        references = result.risks.slice(0, max).map((risk) => risk.narrative);
        break;
      case "compliance":
        answer = result.compliance.narrative;
        references = Object.entries(result.compliance.byTag).map(([tag, count]) => `${tag}: ${count}`);
        break;
      case "expiration":
        answer = result.expiration.narrative;
        references = result.expiration.expiringSoon.slice(0, max).map((document) => document.title);
        break;
      case "knowledge":
        answer = result.knowledgeContribution.narrative;
        references = result.knowledgeContribution.artifacts.slice(0, max).map((artifact) => artifact.title);
        break;
      case "reasoning":
        answer = result.reasoning.answer;
        references = result.reasoning.connectedDocuments.slice(0, max);
        break;
      default:
        answer = result.brief.headline;
        references = result.recommendations.slice(0, max).map((recommendation) => recommendation.title);
    }

    return {
      question: request.question,
      focus,
      answer,
      references,
      confidence: buildConfidence([
        { key: "result", label: "Result confidence", contribution: result.confidence.value },
        { key: "focus", label: "Focus specificity", contribution: focus === "general" ? 0.55 : 0.82 },
      ]),
    };
  }
}
