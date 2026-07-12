/**
 * Document risk and compliance intelligence.
 */

import type { DocumentRiskComplianceIntelligence as DocumentRiskComplianceIntelligenceContract } from "@/lib/platform/intelligence/document/contracts";
import { clamp, defaultCreateId, priorityFromRisk } from "@/lib/platform/intelligence/document/models";
import {
  DOCUMENT_COMPLIANCE_TAGS,
  DOCUMENT_RISK_CATEGORIES,
  type DocumentBaseline,
  type DocumentCatalogResult,
  type DocumentComplianceSuite,
  type DocumentComplianceTag,
  type DocumentRiskCategory,
  type DocumentRiskFlag,
  type DocumentRiskSuite,
  type DocumentClauseSuite,
  type DocumentDuplicateSuite,
  type DocumentVersionSuite,
} from "@/lib/platform/intelligence/document/types";

export class DocumentRiskComplianceIntelligence
  implements DocumentRiskComplianceIntelligenceContract
{
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  identifyRisks(input: {
    baseline: DocumentBaseline;
    catalog: DocumentCatalogResult;
    clauses: DocumentClauseSuite;
    duplicates: DocumentDuplicateSuite;
    versions: DocumentVersionSuite;
    now: Date;
  }): DocumentRiskSuite {
    void input.now;
    const risks = Object.fromEntries(
      DOCUMENT_RISK_CATEGORIES.map((category) => [category, buildRiskFlags(category, input, this.createId)])
    ) as Record<DocumentRiskCategory, DocumentRiskFlag[]>;
    const pressures = DOCUMENT_RISK_CATEGORIES.map((category) => ({
      category,
      score: categoryPressure(category, input),
    }));
    const hottestCategory = [...pressures].sort((a, b) => b.score - a.score)[0]?.category ?? "knowledge_gap";
    const overallRiskPressure = clamp(
      input.baseline.riskPressure * 100 +
        input.clauses.criticalMissing.length * 1.5 +
        input.duplicates.clusters.length * 2 +
        input.versions.staleCount
    );

    return {
      risks,
      overallRiskPressure,
      hottestCategory,
      narrative: `Document risk pressure ${Math.round(overallRiskPressure)}; hottest category ${hottestCategory}.`,
    };
  }

  tagCompliance(input: {
    baseline: DocumentBaseline;
    catalog: DocumentCatalogResult;
    riskSuite: DocumentRiskSuite;
    now: Date;
  }): DocumentComplianceSuite {
    void input.now;
    const byTag = Object.fromEntries(
      DOCUMENT_COMPLIANCE_TAGS.map((tag) => [
        tag,
        input.catalog.documents.filter((document) => document.complianceTags.includes(tag)).length,
      ])
    ) as Record<DocumentComplianceTag, number>;
    const coverageScore = clamp(
      input.baseline.complianceCoverage * 0.75 +
        (DOCUMENT_COMPLIANCE_TAGS.filter((tag) => byTag[tag] > 0).length / DOCUMENT_COMPLIANCE_TAGS.length) * 25 -
        input.riskSuite.overallRiskPressure * 0.05
    );

    return {
      tags: [...DOCUMENT_COMPLIANCE_TAGS],
      coverageScore,
      byTag,
      narrative: `Compliance coverage ${Math.round(coverageScore)} across all ${DOCUMENT_COMPLIANCE_TAGS.length} tag families.`,
    };
  }
}

function buildRiskFlags(
  category: DocumentRiskCategory,
  input: {
    baseline: DocumentBaseline;
    catalog: DocumentCatalogResult;
    clauses: DocumentClauseSuite;
    duplicates: DocumentDuplicateSuite;
    versions: DocumentVersionSuite;
  },
  createId: (prefix: string) => string
): DocumentRiskFlag[] {
  const document = riskDocument(category, input.catalog);
  const score = categoryPressure(category, input);
  return [
    {
      id: createId("doc-risk-flag"),
      documentId: document.id,
      category,
      severity: priorityFromRisk(score / 100),
      score,
      narrative: `${category} risk on ${document.title} at ${Math.round(score)}.`,
    },
  ];
}

function categoryPressure(
  category: DocumentRiskCategory,
  input: {
    baseline: DocumentBaseline;
    clauses: DocumentClauseSuite;
    duplicates: DocumentDuplicateSuite;
    versions: DocumentVersionSuite;
  }
): number {
  switch (category) {
    case "expiration":
      return clamp(input.baseline.expirationRisk * 100);
    case "compliance_gap":
      return clamp(100 - input.baseline.complianceCoverage);
    case "missing_clause":
      return clamp(100 - input.clauses.coverageScore + input.clauses.criticalMissing.length);
    case "duplicate":
      return clamp(input.duplicates.duplicatePressure);
    case "stale_version":
      return clamp(100 - input.versions.hygieneScore + input.versions.staleCount * 3);
    case "ownership_gap":
      return clamp(100 - input.baseline.metadataCompleteness + 10);
    case "decision_orphan":
      return clamp((1 - input.baseline.decisionDependencyDensity) * 70);
    case "knowledge_gap":
      return clamp(100 - input.baseline.knowledgeContributionScore);
  }
}

function riskDocument(category: DocumentRiskCategory, catalog: DocumentCatalogResult) {
  const preferred = catalog.documents.find((document) => {
    if (category === "missing_clause") return document.type === "contracts";
    if (category === "expiration") return document.expiresAt !== null;
    if (category === "compliance_gap") return document.type === "compliance_documents";
    if (category === "decision_orphan") return document.type === "meeting_minutes";
    return document.type === catalog.weakestType;
  });
  return preferred ?? catalog.documents[0]!;
}
