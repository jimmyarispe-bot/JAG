/**
 * Document Intelligence — scores, dashboards, briefs, risk/opp/rec analyzers.
 */

import type {
  DocumentDashboard as DocumentDashboardContract,
  DocumentHealth as DocumentHealthContract,
  DocumentIntelligence as DocumentIntelligenceContract,
  DocumentOpportunityAnalyzer as DocumentOpportunityAnalyzerContract,
  DocumentRecommendationComposer as DocumentRecommendationComposerContract,
  DocumentRiskAnalyzer as DocumentRiskAnalyzerContract,
  DocumentSpecializedDashboards as DocumentSpecializedDashboardsContract,
  ExecutiveDocumentBriefGenerator as ExecutiveDocumentBriefGeneratorContract,
} from "@/lib/platform/intelligence/document/contracts";
import {
  buildConfidence,
  buildLenses,
  clamp,
  defaultCreateId,
  priorityFromRisk,
  priorityFromScore,
  scoreNarrative,
  statusFromScore,
} from "@/lib/platform/intelligence/document/models";
import type {
  ComplianceDashboardResult,
  ContractDashboardResult,
  DocumentBaseline,
  DocumentCatalogResult,
  DocumentConfidenceScore,
  DocumentDashboardResult,
  DocumentExpirationSuite,
  DocumentHealthResult,
  DocumentMetadataSuite,
  DocumentOpportunityRecord,
  DocumentRecommendationRecord,
  DocumentRequest,
  DocumentRiskRecord,
  DocumentRiskSuite,
  DocumentScore,
  ExecutiveDocumentBrief,
  GrantDashboardResult,
  PolicyDashboardResult,
} from "@/lib/platform/intelligence/document/types";

type ScoreBundle = ReturnType<DocumentIntelligenceContract["composeScores"]>;

export function defaultDocumentConfidence(input: {
  baseline: DocumentBaseline;
  catalog: DocumentCatalogResult;
  metadata: { completenessScore: number };
  relationships: { densityScore: number };
  compliance: { coverageScore: number };
}): DocumentConfidenceScore {
  return buildConfidence([
    { key: "catalog", label: "Catalog coverage", contribution: input.catalog.overallCoverage / 100 },
    { key: "metadata", label: "Metadata completeness", contribution: input.metadata.completenessScore / 100 },
    { key: "relationships", label: "Relationship density", contribution: input.relationships.densityScore / 100 },
    { key: "compliance", label: "Compliance coverage", contribution: input.compliance.coverageScore / 100 },
    { key: "baseline", label: "Organization health", contribution: input.baseline.organizationHealthScore / 100 },
  ]);
}

export class DocumentIntelligence implements DocumentIntelligenceContract {
  composeScores(input: Parameters<DocumentIntelligenceContract["composeScores"]>[0]): ScoreBundle {
    const catalogValue = clamp(input.catalog.overallCoverage);
    const classificationValue = clamp(input.classification.accuracy);
    const metadataValue = clamp(input.metadata.completenessScore);
    const entityValue = clamp(input.entities.coverageScore);
    const relationshipValue = clamp(input.relationships.densityScore);
    const versionValue = clamp(input.versions.hygieneScore);
    const duplicateValue = clamp(100 - input.duplicates.duplicatePressure);
    const summaryValue = clamp(input.summarization.coverageScore);
    const clauseValue = clamp(input.clauses.coverageScore);
    const riskValue = clamp(input.riskSuite.overallRiskPressure);
    const complianceValue = clamp(input.compliance.coverageScore);
    const expirationValue = clamp(input.expiration.monitoringScore);
    const contributionValue = clamp(input.knowledgeContribution.contributionScore);
    const knowledgeValue = clamp((summaryValue + relationshipValue + contributionValue) / 3);
    const healthValue = clamp(
      catalogValue * 0.1 +
        classificationValue * 0.08 +
        metadataValue * 0.08 +
        entityValue * 0.07 +
        relationshipValue * 0.07 +
        versionValue * 0.08 +
        duplicateValue * 0.06 +
        summaryValue * 0.06 +
        clauseValue * 0.08 +
        (100 - riskValue) * 0.1 +
        complianceValue * 0.1 +
        expirationValue * 0.06 +
        contributionValue * 0.06
    );
    void input.parse;
    void input.reasoning;
    void input.risks;
    void input.opportunities;
    return {
      healthScore: score("document_health", "Document Health Score", healthValue),
      knowledgeScore: score("document_knowledge", "Knowledge Score", knowledgeValue),
      catalogScore: score("document_catalog", "Catalog Score", catalogValue),
      classificationScore: score("document_classification", "Classification Score", classificationValue),
      metadataScore: score("document_metadata", "Metadata Score", metadataValue),
      entityScore: score("document_entities", "Entity Score", entityValue),
      relationshipScore: score("document_relationships", "Relationship Score", relationshipValue),
      versionScore: score("document_versions", "Version Score", versionValue),
      duplicateScore: score("document_duplicates", "Duplicate Resilience Score", duplicateValue),
      summaryScore: score("document_summaries", "Summary Score", summaryValue),
      clauseScore: score("document_clauses", "Clause Score", clauseValue),
      riskScore: riskScore(riskValue),
      complianceScore: score("document_compliance", "Compliance Score", complianceValue),
      expirationScore: score("document_expiration", "Expiration Monitoring Score", expirationValue),
      contributionScore: score("document_contribution", "Knowledge Contribution Score", contributionValue),
    };
  }
}

export class DocumentHealth implements DocumentHealthContract {
  assess(input: {
    baseline: DocumentBaseline;
    scores: ScoreBundle;
    catalog: DocumentCatalogResult;
    expiration: DocumentExpirationSuite;
  }): DocumentHealthResult {
    const dimensions: Record<string, number> = {
      catalog: input.scores.catalogScore.value,
      metadata: input.scores.metadataScore.value,
      relationship: input.scores.relationshipScore.value,
      version: input.scores.versionScore.value,
      riskResilience: 100 - input.scores.riskScore.value,
      compliance: input.scores.complianceScore.value,
      expiration: input.scores.expirationScore.value,
      knowledge: input.scores.contributionScore.value,
    };
    const overallScore = clamp(Object.values(dimensions).reduce((sum, value) => sum + value, 0) / Object.values(dimensions).length);
    const status = statusFromScore(overallScore);
    return {
      overallScore,
      status,
      dimensions,
      lenses: buildLenses({
        whatIsIt: `Document health across ${input.catalog.documents.length} document type records.`,
        whyItMatters: `Weakest type ${input.catalog.weakestType} drives document risk.`,
        whoOwnsIt: "executive_operations",
        whenItExpires: input.expiration.nextExpiration ?? "No monitored expiration.",
        knowledgeCreated: `Contribution score ${Math.round(input.scores.contributionScore.value)}.`,
        risksContained: `Risk resilience ${Math.round(dimensions.riskResilience)}.`,
        decisionsDependent: `Dependency density ${(input.baseline.decisionDependencyDensity * 100).toFixed(0)}%.`,
      }),
      narrative: `Document health ${status} (${Math.round(overallScore)}).`,
    };
  }
}

export class DocumentDashboard implements DocumentDashboardContract {
  compose(input: {
    scores: ScoreBundle;
    risks: DocumentRiskRecord[];
    opportunities: DocumentOpportunityRecord[];
    now: Date;
  }): DocumentDashboardResult {
    return {
      generatedAt: input.now.toISOString(),
      headline: `Document health ${Math.round(input.scores.healthScore.value)} - ${input.scores.healthScore.status}`,
      overall: input.scores.healthScore.value,
      healthScore: input.scores.healthScore.value,
      catalogScore: input.scores.catalogScore.value,
      classificationScore: input.scores.classificationScore.value,
      riskScore: input.scores.riskScore.value,
      complianceScore: input.scores.complianceScore.value,
      expirationScore: input.scores.expirationScore.value,
      topRisks: input.risks.slice(0, 5).map((risk) => risk.title),
      topOpportunities: input.opportunities.slice(0, 5).map((opportunity) => opportunity.title),
      narrative: `Document dashboard: catalog ${Math.round(input.scores.catalogScore.value)}, risk ${Math.round(input.scores.riskScore.value)}, compliance ${Math.round(input.scores.complianceScore.value)}.`,
    };
  }
}

export class DocumentSpecializedDashboards implements DocumentSpecializedDashboardsContract {
  contracts(input: Parameters<DocumentSpecializedDashboardsContract["contracts"]>[0]): ContractDashboardResult {
    return {
      generatedAt: input.now.toISOString(),
      contractCount: input.catalog.documents.filter((document) => document.type === "contracts").length,
      hygieneScore: input.versions.hygieneScore,
      missingClauses: input.clauses.criticalMissing,
      expiringSoon: input.expiration.expiringSoon.length,
      narrative: `Contract dashboard: hygiene ${Math.round(input.versions.hygieneScore)}, missing clauses ${input.clauses.criticalMissing.length}.`,
    };
  }

  policies(input: Parameters<DocumentSpecializedDashboardsContract["policies"]>[0]): PolicyDashboardResult {
    return {
      generatedAt: input.now.toISOString(),
      policyCount: input.catalog.documents.filter((document) => document.type === "policies").length,
      coverageScore: input.catalog.overallCoverage,
      staleCount: input.versions.staleCount,
      ownerGaps: input.metadata.records.filter((record) => record.fields.owner === "executive").length,
      narrative: `Policy dashboard: coverage ${Math.round(input.catalog.overallCoverage)}, stale ${input.versions.staleCount}.`,
    };
  }

  grants(input: Parameters<DocumentSpecializedDashboardsContract["grants"]>[0]): GrantDashboardResult {
    return {
      generatedAt: input.now.toISOString(),
      grantDocumentCount: input.catalog.documents.filter((document) => document.type.includes("grant")).length,
      complianceScore: input.compliance.coverageScore,
      expirationRisk: input.expiration.expired.length + input.expiration.expiringSoon.length,
      narrative: `Grant dashboard: compliance ${Math.round(input.compliance.coverageScore)}.`,
    };
  }

  compliance(input: Parameters<DocumentSpecializedDashboardsContract["compliance"]>[0]): ComplianceDashboardResult {
    return {
      generatedAt: input.now.toISOString(),
      complianceCoverage: input.compliance.coverageScore,
      tags: input.compliance.byTag,
      hottestRisk: input.riskSuite.hottestCategory,
      narrative: `Compliance dashboard: coverage ${Math.round(input.compliance.coverageScore)}, hottest risk ${input.riskSuite.hottestCategory}.`,
    };
  }
}

export class DocumentRiskAnalyzer implements DocumentRiskAnalyzerContract {
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  analyze(input: Parameters<DocumentRiskAnalyzerContract["analyze"]>[0]): DocumentRiskRecord[] {
    return Object.values(input.riskSuite.risks)
      .flat()
      .map((flag) => ({
        id: this.createId("doc-risk"),
        title: `${flag.category} document risk`,
        category: flag.category,
        severity: flag.severity,
        score: flag.score,
        mitigation: mitigationFor(flag.category),
        lenses: buildLenses({
          whatIsIt: `A ${flag.category} risk in the document estate.`,
          whyItMatters: "Document weaknesses create compliance, execution, or decision risk.",
          whoOwnsIt: input.catalog.documents.find((document) => document.id === flag.documentId)?.owner ?? "executive",
          whenItExpires: input.expiration.nextExpiration ?? "No expiration attached.",
          knowledgeCreated: "Creates a remediation knowledge artifact.",
          risksContained: flag.narrative,
          decisionsDependent: `Dependency density ${(input.baseline.decisionDependencyDensity * 100).toFixed(0)}%.`,
        }),
        narrative: flag.narrative,
      }))
      .sort((left, right) => right.score - left.score);
  }
}

export class DocumentOpportunityAnalyzer implements DocumentOpportunityAnalyzerContract {
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  analyze(input: Parameters<DocumentOpportunityAnalyzerContract["analyze"]>[0]): DocumentOpportunityRecord[] {
    const weakest = input.catalog.documents.find((document) => document.type === input.catalog.weakestType) ?? input.catalog.documents[0]!;
    return [
      opportunity(this.createId, `Strengthen ${input.catalog.weakestType} coverage`, priorityFromScore(weakest.confidence.value * 100), clamp(100 - weakest.confidence.value * 100 + 45), weakest.owner, weakest.expiresAt),
      opportunity(this.createId, "Improve compliance tagging coverage", priorityFromScore(input.compliance.coverageScore), clamp(100 - input.compliance.coverageScore + 50), "compliance", "Review quarterly."),
      opportunity(this.createId, "Publish document-derived knowledge drafts", priorityFromScore(input.knowledgeContribution.contributionScore), clamp(100 - input.knowledgeContribution.contributionScore + 48), "knowledge", "Validate each review cycle."),
    ].sort((left, right) => right.score - left.score);
  }
}

export class DocumentRecommendationComposer implements DocumentRecommendationComposerContract {
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  compose(input: Parameters<DocumentRecommendationComposerContract["compose"]>[0]): DocumentRecommendationRecord[] {
    const sourceDocuments = input.catalog.documents.slice(0, 4).map((document) => document.id);
    const knowledgeArtifacts = input.knowledgeContribution.artifacts.slice(0, 4).map((artifact) => artifact.id);
    const recommendations = input.opportunities.slice(0, 3).map((opportunityRecord) => ({
      id: this.createId("doc-rec"),
      title: opportunityRecord.title,
      priority: opportunityRecord.priority,
      score: opportunityRecord.score,
      rationale: opportunityRecord.narrative,
      lenses: opportunityRecord.lenses,
      narrative: opportunityRecord.narrative,
      expectedLift: `Expected value ${opportunityRecord.expectedValue}`,
      riskReduction: "Reduces document intelligence risk pressure",
      sourceDocumentIds: sourceDocuments,
      knowledgeArtifactIds: knowledgeArtifacts,
    }));
    const topRisk = input.risks[0];
    if (topRisk) {
      recommendations.push({
        id: this.createId("doc-rec"),
        title: `Mitigate ${topRisk.category} exposure`,
        priority: topRisk.severity,
        score: topRisk.score,
        rationale: topRisk.narrative,
        lenses: topRisk.lenses,
        narrative: `Prioritize ${topRisk.category} remediation.`,
        expectedLift: "Lower risk and better review readiness",
        riskReduction: topRisk.mitigation,
        sourceDocumentIds: sourceDocuments,
        knowledgeArtifactIds: knowledgeArtifacts,
      });
    }
    return recommendations.sort((left, right) => right.score - left.score).slice(0, 8);
  }
}

export class ExecutiveDocumentBriefGenerator implements ExecutiveDocumentBriefGeneratorContract {
  generate(input: Parameters<ExecutiveDocumentBriefGeneratorContract["generate"]>[0]): ExecutiveDocumentBrief {
    return {
      generatedAt: input.now.toISOString(),
      headline: `Document health ${Math.round(input.scores.healthScore.value)} - weakest ${input.catalog.weakestType}`,
      summary:
        input.request.question ??
        "How healthy is the document estate, and where should leadership improve document intelligence?",
      healthScore: input.scores.healthScore.value,
      catalogScore: input.scores.catalogScore.value,
      riskScore: input.scores.riskScore.value,
      complianceScore: input.scores.complianceScore.value,
      expirationScore: input.scores.expirationScore.value,
      topRecommendations: input.recommendations.slice(0, 5).map((recommendation) => recommendation.title),
      topRisks: input.risks.slice(0, 5).map((risk) => risk.title),
      topOpportunities: input.opportunities.slice(0, 5).map((opportunityRecord) => opportunityRecord.title),
      weakestDocumentType: input.catalog.weakestType,
      lenses: buildLenses({
        whatIsIt: "Executive document intelligence brief.",
        whyItMatters: `Weakest document type is ${input.catalog.weakestType}.`,
        whoOwnsIt: "executive_operations",
        whenItExpires: "Refresh each reporting period.",
        knowledgeCreated: `Confidence ${input.confidence.level}.`,
        risksContained: `${input.risks.length} risks prioritized.`,
        decisionsDependent: `${input.recommendations.length} recommendations ready for decisioning.`,
      }),
      narrative: `Executive document brief: health ${Math.round(input.scores.healthScore.value)} and confidence ${input.confidence.level}.`,
    };
  }
}

function score(key: string, label: string, value: number): DocumentScore {
  const normalized = clamp(value);
  const status = statusFromScore(normalized);
  return {
    key,
    label,
    value: normalized,
    status,
    band: priorityFromScore(normalized),
    narrative: scoreNarrative(label, normalized, status),
  };
}

function riskScore(value: number): DocumentScore {
  const normalized = clamp(value);
  return {
    key: "document_risk",
    label: "Document Risk Score",
    value: normalized,
    status: statusFromScore(100 - normalized),
    band: priorityFromRisk(normalized / 100),
    narrative: `Document risk is ${priorityFromRisk(normalized / 100)} at ${Math.round(normalized)}.`,
  };
}

function mitigationFor(category: DocumentRiskRecord["category"]): string {
  return `Assign owner and remediation plan for ${category}.`;
}

function opportunity(
  createId: (prefix: string) => string,
  title: string,
  priority: DocumentOpportunityRecord["priority"],
  scoreValue: number,
  owner: string,
  expires: string | null
): DocumentOpportunityRecord {
  return {
    id: createId("doc-opp"),
    title,
    priority,
    score: scoreValue,
    expectedValue: Math.round(scoreValue * 2),
    lenses: buildLenses({
      whatIsIt: title,
      whyItMatters: "Improves document intelligence reliability.",
      whoOwnsIt: owner,
      whenItExpires: expires ?? "No explicit expiration.",
      knowledgeCreated: "Creates reusable document knowledge.",
      risksContained: "Reduces catalog, compliance, or knowledge gaps.",
      decisionsDependent: "Improves evidence for dependent decisions.",
    }),
    narrative: title,
  };
}
