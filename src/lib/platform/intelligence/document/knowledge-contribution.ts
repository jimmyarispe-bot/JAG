/**
 * Document-to-knowledge contribution intelligence.
 */

import type { DocumentKnowledgeContributionEngine as DocumentKnowledgeContributionEngineContract } from "@/lib/platform/intelligence/document/contracts";
import { clamp, defaultCreateId } from "@/lib/platform/intelligence/document/models";
import type {
  DocumentBaseline,
  DocumentCatalogResult,
  DocumentComplianceSuite,
  DocumentKnowledgeContribution,
  DocumentKnowledgeDraft,
  DocumentSummarizationSuite,
  DocumentType,
} from "@/lib/platform/intelligence/document/types";

const MAJOR_GROUPS: Array<{ group: string; types: DocumentType[]; artifactType: string }> = [
  { group: "governance", types: ["policies", "board_packets", "meeting_minutes"], artifactType: "governance_memory" },
  { group: "operations", types: ["procedures", "sops"], artifactType: "operational_playbook" },
  { group: "legal", types: ["contracts", "licenses", "permits"], artifactType: "contractual_knowledge" },
  { group: "people", types: ["employment_agreements", "training_materials"], artifactType: "people_knowledge" },
  { group: "finance", types: ["financial_statements", "budgets", "invoices", "purchase_orders"], artifactType: "financial_knowledge" },
  { group: "funding", types: ["grant_applications", "grant_awards"], artifactType: "grant_knowledge" },
  { group: "compliance", types: ["compliance_documents"], artifactType: "compliance_knowledge" },
  { group: "market", types: ["strategic_plans", "marketing_materials", "emails", "research"], artifactType: "market_knowledge" },
];

export class DocumentKnowledgeContributionEngine
  implements DocumentKnowledgeContributionEngineContract
{
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  contribute(input: {
    baseline: DocumentBaseline;
    catalog: DocumentCatalogResult;
    summarization: DocumentSummarizationSuite;
    compliance: DocumentComplianceSuite;
    now: Date;
  }): DocumentKnowledgeContribution {
    void input.now;
    const artifacts: DocumentKnowledgeDraft[] = MAJOR_GROUPS.map((group) => {
      const source = input.catalog.documents.find((document) => group.types.includes(document.type)) ?? input.catalog.documents[0]!;
      const summary = input.summarization.summaries.find((item) => item.documentId === source.id);
      const confidence = clamp(
        input.baseline.knowledgeContributionScore * 0.55 +
          input.summarization.coverageScore * 0.25 +
          input.compliance.coverageScore * 0.2
      );
      return {
        id: this.createId("doc-knowledge"),
        type: group.artifactType,
        title: `${group.group} knowledge from ${source.title}`,
        confidence,
        sourceDocumentId: source.id,
        validated: confidence >= 60,
        metadata: {
          documentType: source.type,
          owner: source.owner,
          summary: summary?.summary ?? source.summary,
          complianceTags: source.complianceTags,
        },
      };
    });
    const validatedCount = artifacts.filter((artifact) => artifact.validated).length;
    const contributionScore = clamp(
      input.baseline.knowledgeContributionScore * 0.7 +
        (validatedCount / Math.max(1, artifacts.length)) * 30
    );

    return {
      artifacts,
      contributionScore,
      validatedCount,
      narrative: `Document knowledge contribution ${Math.round(contributionScore)} with ${validatedCount} validated drafts.`,
    };
  }
}
