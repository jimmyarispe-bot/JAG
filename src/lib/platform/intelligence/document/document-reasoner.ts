/**
 * Document reasoning intelligence.
 */

import type { DocumentReasoner as DocumentReasonerContract } from "@/lib/platform/intelligence/document/contracts";
import { buildConfidence } from "@/lib/platform/intelligence/document/models";
import type {
  DocumentBaseline,
  DocumentCatalogResult,
  DocumentReasoningResult,
  DocumentRelationshipSuite,
  DocumentRiskSuite,
} from "@/lib/platform/intelligence/document/types";

export class DocumentReasoner implements DocumentReasonerContract {
  reason(input: {
    baseline: DocumentBaseline;
    catalog: DocumentCatalogResult;
    relationships: DocumentRelationshipSuite;
    riskSuite: DocumentRiskSuite;
    question?: string;
    now: Date;
  }): DocumentReasoningResult {
    void input.now;
    const connectedDocuments = input.relationships.relationships
      .flatMap((relationship) => [relationship.fromDocumentId, relationship.toDocumentId])
      .filter((id, index, ids) => ids.indexOf(id) === index)
      .slice(0, 12);
    const risks = Object.values(input.riskSuite.risks)
      .flat()
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
    const missingTopics = [
      ...(input.baseline.catalogCoverage < 60 ? ["catalog coverage"] : []),
      ...(input.baseline.relationshipDensity < 55 ? ["document relationships"] : []),
      ...(input.baseline.complianceCoverage < 60 ? ["compliance evidence"] : []),
      ...(input.baseline.knowledgeContributionScore < 60 ? ["knowledge contribution"] : []),
    ];
    const confidence = buildConfidence([
      { key: "catalog", label: "Catalog", contribution: input.catalog.overallCoverage / 100 },
      { key: "relationships", label: "Relationships", contribution: input.relationships.densityScore / 100 },
      { key: "risk", label: "Risk coverage", contribution: 1 - input.riskSuite.overallRiskPressure / 100 },
    ]);
    const answer =
      input.question ??
      `Document intelligence found ${input.catalog.documents.length} classified document sets, with ${input.riskSuite.hottestCategory} as the hottest risk.`;

    return {
      answer,
      connectedDocuments,
      risks,
      missingTopics,
      confidence,
      narrative: `Document reasoning confidence ${confidence.level}; ${connectedDocuments.length} connected documents and ${risks.length} risks considered.`,
    };
  }
}
