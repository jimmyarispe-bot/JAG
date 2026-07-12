/**
 * Document Intelligence Engine — Sprint 041 orchestrator.
 */

import type {
  DocumentClassifier as DocumentClassifierContract,
  DocumentDashboard as DocumentDashboardContract,
  DocumentDependencies,
  DocumentEngine as DocumentEngineContract,
  DocumentExpirationIntelligence as DocumentExpirationIntelligenceContract,
  DocumentHealth as DocumentHealthContract,
  DocumentIntelligence as DocumentIntelligenceContract,
  DocumentKnowledgeContributionEngine as DocumentKnowledgeContributionEngineContract,
  DocumentMetadataIntelligence as DocumentMetadataIntelligenceContract,
  DocumentOpportunityAnalyzer as DocumentOpportunityAnalyzerContract,
  DocumentParser as DocumentParserContract,
  DocumentProjection as DocumentProjectionContract,
  DocumentQueries as DocumentQueriesContract,
  DocumentReasoner as DocumentReasonerContract,
  DocumentRecommendationComposer as DocumentRecommendationComposerContract,
  DocumentRegistry as DocumentRegistryContract,
  DocumentRepository as DocumentRepositoryContract,
  DocumentRiskAnalyzer as DocumentRiskAnalyzerContract,
  DocumentRiskComplianceIntelligence as DocumentRiskComplianceIntelligenceContract,
  DocumentSpecializedDashboards as DocumentSpecializedDashboardsContract,
  DocumentSummarizationClauseIntelligence as DocumentSummarizationClauseIntelligenceContract,
  DocumentVersionDuplicateIntelligence as DocumentVersionDuplicateIntelligenceContract,
  DocumentEntityRelationshipIntelligence as DocumentEntityRelationshipIntelligenceContract,
  ExecutiveDocumentBriefGenerator as ExecutiveDocumentBriefGeneratorContract,
} from "@/lib/platform/intelligence/document/contracts";
import { DocumentClassifier } from "@/lib/platform/intelligence/document/document-classifier";
import { DocumentParser } from "@/lib/platform/intelligence/document/document-parser";
import { DocumentEntityRelationshipIntelligence } from "@/lib/platform/intelligence/document/entity-relationship-intelligence";
import { DocumentExpirationIntelligence } from "@/lib/platform/intelligence/document/expiration-intelligence";
import { DocumentKnowledgeContributionEngine } from "@/lib/platform/intelligence/document/knowledge-contribution";
import { DocumentMetadataIntelligence } from "@/lib/platform/intelligence/document/metadata-intelligence";
import { DocumentProjection, DocumentQueries } from "@/lib/platform/intelligence/document/projection";
import { DocumentReasoner } from "@/lib/platform/intelligence/document/document-reasoner";
import { DocumentRegistryStore } from "@/lib/platform/intelligence/document/document-registry";
import { DocumentRepositoryStore } from "@/lib/platform/intelligence/document/repository";
import { DocumentRiskComplianceIntelligence } from "@/lib/platform/intelligence/document/risk-compliance-intelligence";
import { DocumentSummarizationClauseIntelligence } from "@/lib/platform/intelligence/document/summarization-clause-intelligence";
import { DocumentVersionDuplicateIntelligence } from "@/lib/platform/intelligence/document/version-duplicate-intelligence";
import {
  defaultDocumentConfidence,
  DocumentDashboard,
  DocumentHealth,
  DocumentIntelligence,
  DocumentOpportunityAnalyzer,
  DocumentRecommendationComposer,
  DocumentRiskAnalyzer,
  DocumentSpecializedDashboards,
  ExecutiveDocumentBriefGenerator,
} from "@/lib/platform/intelligence/document/document-intelligence";
import {
  defaultCreateId,
  defaultPeriodLabel,
  deriveDocumentBaseline,
  emptyDocumentScope,
} from "@/lib/platform/intelligence/document/models";
import {
  DOCUMENT_INTELLIGENCE_VERSION,
  type DocumentCatalogResult,
  type DecisionResultLight,
  type DocumentRecord,
  type DocumentRequest,
  type DocumentResult,
} from "@/lib/platform/intelligence/document/types";

export interface DocumentEngineDependencies extends DocumentDependencies {}

export class DocumentIntelligenceEngineImpl implements DocumentEngineContract {
  private readonly documentParser: DocumentParserContract;
  private readonly documentClassifier: DocumentClassifierContract;
  private readonly metadataIntelligence: DocumentMetadataIntelligenceContract;
  private readonly entityRelationshipIntelligence: DocumentEntityRelationshipIntelligenceContract;
  private readonly versionDuplicateIntelligence: DocumentVersionDuplicateIntelligenceContract;
  private readonly summarizationClauseIntelligence: DocumentSummarizationClauseIntelligenceContract;
  private readonly riskComplianceIntelligence: DocumentRiskComplianceIntelligenceContract;
  private readonly expirationIntelligence: DocumentExpirationIntelligenceContract;
  private readonly knowledgeContributionEngine: DocumentKnowledgeContributionEngineContract;
  private readonly documentReasoner: DocumentReasonerContract;
  private readonly documentIntelligence: DocumentIntelligenceContract;
  private readonly documentHealth: DocumentHealthContract;
  private readonly documentDashboard: DocumentDashboardContract;
  private readonly specializedDashboards: DocumentSpecializedDashboardsContract;
  private readonly documentRiskAnalyzer: DocumentRiskAnalyzerContract;
  private readonly documentOpportunityAnalyzer: DocumentOpportunityAnalyzerContract;
  private readonly documentRecommendationComposer: DocumentRecommendationComposerContract;
  private readonly briefGenerator: ExecutiveDocumentBriefGeneratorContract;
  private readonly projectionEngine: DocumentProjectionContract;
  readonly queries: DocumentQueriesContract;
  readonly registry: DocumentRegistryContract;
  readonly repository: DocumentRepositoryContract;
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;

  constructor(d: DocumentEngineDependencies = {}) {
    this.createId = d.createId ?? defaultCreateId;
    this.now = d.now ?? (() => new Date());
    this.documentParser = d.documentParser ?? new DocumentParser();
    this.documentClassifier = d.documentClassifier ?? new DocumentClassifier();
    this.metadataIntelligence = d.metadataIntelligence ?? new DocumentMetadataIntelligence();
    this.entityRelationshipIntelligence =
      d.entityRelationshipIntelligence ?? new DocumentEntityRelationshipIntelligence(this.createId);
    this.versionDuplicateIntelligence =
      d.versionDuplicateIntelligence ?? new DocumentVersionDuplicateIntelligence(this.createId);
    this.summarizationClauseIntelligence =
      d.summarizationClauseIntelligence ?? new DocumentSummarizationClauseIntelligence(this.createId);
    this.riskComplianceIntelligence =
      d.riskComplianceIntelligence ?? new DocumentRiskComplianceIntelligence(this.createId);
    this.expirationIntelligence = d.expirationIntelligence ?? new DocumentExpirationIntelligence();
    this.knowledgeContributionEngine =
      d.knowledgeContributionEngine ?? new DocumentKnowledgeContributionEngine(this.createId);
    this.documentReasoner = d.documentReasoner ?? new DocumentReasoner();
    this.documentIntelligence = d.documentIntelligence ?? new DocumentIntelligence();
    this.documentHealth = d.documentHealth ?? new DocumentHealth();
    this.documentDashboard = d.documentDashboard ?? new DocumentDashboard();
    this.specializedDashboards = d.specializedDashboards ?? new DocumentSpecializedDashboards();
    this.documentRiskAnalyzer = d.documentRiskAnalyzer ?? new DocumentRiskAnalyzer(this.createId);
    this.documentOpportunityAnalyzer =
      d.documentOpportunityAnalyzer ?? new DocumentOpportunityAnalyzer(this.createId);
    this.documentRecommendationComposer =
      d.documentRecommendationComposer ?? new DocumentRecommendationComposer(this.createId);
    this.briefGenerator = d.briefGenerator ?? new ExecutiveDocumentBriefGenerator();
    this.projectionEngine = d.projection ?? new DocumentProjection();
    this.queries = d.queries ?? new DocumentQueries();
    this.registry = d.registry ?? new DocumentRegistryStore();
    this.repository = d.repository ?? new DocumentRepositoryStore();
  }

  build(request: DocumentRequest): DocumentResult {
    const now = this.now();
    const scope = request.scope ?? emptyDocumentScope();
    const dna = request.dna ?? request.dnaResult?.dna ?? null;

    const baseline = deriveDocumentBaseline(
      dna,
      request.oiosResult,
      request.analysis,
      request.graphInput,
      request.predictionResult,
      request.knowledgeResult,
      request.operationsResult,
      request.customerResult,
      request.humanCapitalResult,
      request.revenueResult,
      request.fundingResult,
      request.boardGovernanceResult,
      toDecisionLight(request.decisionResult),
      request.baselineOverrides
    );

    const parse = this.documentParser.parse({ baseline, now });
    const classification = this.documentClassifier.classify({ baseline, parse, now });
    const rawCatalog = this.documentClassifier.catalog({
      baseline,
      classification,
      now,
      createId: this.createId,
    });
    const metadata = this.metadataIntelligence.extract({ baseline, catalog: rawCatalog, now });
    const entities = this.entityRelationshipIntelligence.extractEntities({ baseline, catalog: rawCatalog, now });
    const relationships = this.entityRelationshipIntelligence.extractRelationships({
      baseline,
      catalog: rawCatalog,
      entities,
      now,
    });
    const versions = this.versionDuplicateIntelligence.compareVersions({ baseline, catalog: rawCatalog, now });
    const duplicates = this.versionDuplicateIntelligence.detectDuplicates({
      baseline,
      catalog: rawCatalog,
      versions,
      now,
    });
    const summarization = this.summarizationClauseIntelligence.summarize({ baseline, catalog: rawCatalog, now });
    const clauses = this.summarizationClauseIntelligence.extractClauses({
      baseline,
      catalog: rawCatalog,
      summarization,
      now,
    });
    const riskSuite = this.riskComplianceIntelligence.identifyRisks({
      baseline,
      catalog: rawCatalog,
      clauses,
      duplicates,
      versions,
      now,
    });
    const compliance = this.riskComplianceIntelligence.tagCompliance({
      baseline,
      catalog: rawCatalog,
      riskSuite,
      now,
    });
    const expiration = this.expirationIntelligence.monitor({ baseline, catalog: rawCatalog, now });
    const knowledgeContribution = this.knowledgeContributionEngine.contribute({
      baseline,
      catalog: rawCatalog,
      summarization,
      compliance,
      now,
    });
    const reasoning = this.documentReasoner.reason({
      baseline,
      catalog: rawCatalog,
      relationships,
      riskSuite,
      question: request.question,
      now,
    });
    const catalog = enrichCatalog(rawCatalog, {
      entities: entities.entities,
      relationships: relationships.relationships,
      clauses: clauses.clauses,
      risks: Object.values(riskSuite.risks).flat(),
      knowledgeIds: knowledgeContribution.artifacts.map((artifact) => artifact.id),
    });
    const risks = this.documentRiskAnalyzer.analyze({ baseline, catalog, riskSuite, expiration, now });
    const opportunities = this.documentOpportunityAnalyzer.analyze({
      baseline,
      catalog,
      compliance,
      knowledgeContribution,
      now,
    });
    const recommendations = this.documentRecommendationComposer.compose({
      risks,
      opportunities,
      catalog,
      knowledgeContribution,
      now,
    });
    const scores = this.documentIntelligence.composeScores({
      baseline,
      catalog,
      parse,
      classification,
      metadata,
      entities,
      relationships,
      versions,
      duplicates,
      summarization,
      clauses,
      riskSuite,
      compliance,
      expiration,
      knowledgeContribution,
      reasoning,
      risks,
      opportunities,
    });
    const documentHealth = this.documentHealth.assess({ baseline, scores, catalog, expiration });
    const dashboard = this.documentDashboard.compose({ scores, risks, opportunities, now });
    const contractDashboard = this.specializedDashboards.contracts({ catalog, versions, clauses, expiration, now });
    const policyDashboard = this.specializedDashboards.policies({ catalog, versions, metadata, now });
    const grantDashboard = this.specializedDashboards.grants({ catalog, compliance, expiration, now });
    const complianceDashboard = this.specializedDashboards.compliance({ compliance, riskSuite, now });
    const confidence = defaultDocumentConfidence({ baseline, catalog, metadata, relationships, compliance });
    const brief = this.briefGenerator.generate({
      request,
      scores,
      risks,
      opportunities,
      catalog,
      recommendations,
      confidence,
      now,
    });
    const projection = this.projectionEngine.project({
      request,
      scores,
      catalog,
      dashboard,
      brief,
      confidence,
      baseline,
    });
    const historyRecord = {
      id: this.createId("doc-history"),
      requestId: request.requestId,
      scope,
      status: "classified" as const,
      healthScore: scores.healthScore.value,
      generatedAt: now.toISOString(),
      summary: brief.headline,
      metadata: request.metadata ?? {},
    };

    const result: DocumentResult = {
      requestId: request.requestId,
      version: DOCUMENT_INTELLIGENCE_VERSION,
      generatedAt: now.toISOString(),
      periodLabel: request.periodLabel ?? defaultPeriodLabel(now),
      scope,
      baseline,
      healthScore: scores.healthScore,
      knowledgeScore: scores.knowledgeScore,
      catalogScore: scores.catalogScore,
      classificationScore: scores.classificationScore,
      metadataScore: scores.metadataScore,
      entityScore: scores.entityScore,
      relationshipScore: scores.relationshipScore,
      versionScore: scores.versionScore,
      duplicateScore: scores.duplicateScore,
      summaryScore: scores.summaryScore,
      clauseScore: scores.clauseScore,
      riskScore: scores.riskScore,
      complianceScore: scores.complianceScore,
      expirationScore: scores.expirationScore,
      contributionScore: scores.contributionScore,
      documentHealth,
      brief,
      projection,
      confidence,
      dashboard,
      contractDashboard,
      policyDashboard,
      grantDashboard,
      complianceDashboard,
      recommendations,
      risks,
      opportunities,
      historyRecord,
      catalog,
      parse,
      classification,
      metadata,
      entities,
      relationships,
      versions,
      duplicates,
      summarization,
      clauses,
      riskSuite,
      compliance,
      expiration,
      knowledgeContribution,
      reasoning,
      requestMetadata: {
        ...(request.metadata ?? {}),
        registryPublishers: this.registry.list().length,
        graphAligned: Boolean(request.graph),
        knowledgeAligned: Boolean(request.knowledgeResult),
      },
    };

    this.repository.save(result);
    this.repository.saveHistory(historyRecord);
    return result;
  }
}

function enrichCatalog(
  catalog: DocumentCatalogResult,
  input: {
    entities: DocumentRecord["entities"];
    relationships: DocumentRecord["relationships"];
    clauses: DocumentRecord["clauses"];
    risks: DocumentRecord["riskFlags"];
    knowledgeIds: string[];
  }
): DocumentCatalogResult {
  return {
    ...catalog,
    documents: catalog.documents.map((document) => ({
      ...document,
      entities: input.entities.filter((entity) => entity.documentId === document.id),
      relationships: input.relationships.filter(
        (relationship) => relationship.fromDocumentId === document.id || relationship.toDocumentId === document.id
      ),
      clauses: input.clauses.filter((clause) => clause.documentId === document.id),
      riskFlags: input.risks.filter((risk) => risk.documentId === document.id),
      knowledgeArtifactIds: input.knowledgeIds.filter((_, index) => index % catalog.documents.length === catalog.documents.indexOf(document) % input.knowledgeIds.length),
    })),
  };
}

export { DocumentIntelligenceEngineImpl as DocumentIntelligenceEngine };
export { DocumentIntelligenceEngineImpl as DocumentEngine };
export { DocumentIntelligenceEngineImpl as DocumentEngineImpl };

function toDecisionLight(value: DocumentRequest["decisionResult"]): DecisionResultLight | null {
  if (!value) return null;
  const candidate = value as DecisionResultLight;
  return {
    requestId: candidate.requestId,
    healthScore: candidate.healthScore,
    decisionScore: candidate.decisionScore,
    baseline: candidate.baseline,
    recommendations: candidate.recommendations,
  };
}
