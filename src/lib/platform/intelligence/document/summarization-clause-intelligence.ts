/**
 * Document summarization and clause extraction intelligence.
 */

import type { DocumentSummarizationClauseIntelligence as DocumentSummarizationClauseIntelligenceContract } from "@/lib/platform/intelligence/document/contracts";
import { clamp, defaultCreateId } from "@/lib/platform/intelligence/document/models";
import type {
  DocumentBaseline,
  DocumentCatalogResult,
  DocumentClauseRecord,
  DocumentClauseSuite,
  DocumentSummarizationSuite,
} from "@/lib/platform/intelligence/document/types";

const CLAUSE_LABELS = [
  "Term",
  "Renewal",
  "Termination",
  "Confidentiality",
  "Compliance",
  "Payment",
  "Governance",
] as const;

export class DocumentSummarizationClauseIntelligence
  implements DocumentSummarizationClauseIntelligenceContract
{
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  summarize(input: {
    baseline: DocumentBaseline;
    catalog: DocumentCatalogResult;
    now: Date;
  }): DocumentSummarizationSuite {
    void input.now;
    const summaries = input.catalog.documents.map((document) => ({
      documentId: document.id,
      title: document.title,
      summary: `${document.title} is owned by ${document.owner}; ${document.summary}`,
      confidence: clamp(input.baseline.summaryCoverage * 0.7 + document.confidence.value * 30) / 100,
    }));
    const coverageScore = clamp(
      input.baseline.summaryCoverage * 0.75 + input.catalog.overallCoverage * 0.25
    );

    return {
      summaries,
      coverageScore,
      narrative: `Summarization coverage ${Math.round(coverageScore)} across ${summaries.length} document summaries.`,
    };
  }

  extractClauses(input: {
    baseline: DocumentBaseline;
    catalog: DocumentCatalogResult;
    summarization: DocumentSummarizationSuite;
    now: Date;
  }): DocumentClauseSuite {
    void input.now;
    const clauseDocuments = input.catalog.documents.filter((document) =>
      ["contracts", "employment_agreements", "grant_awards", "licenses", "permits", "policies", "compliance_documents"].includes(document.type)
    );
    const clauses: DocumentClauseRecord[] = clauseDocuments.flatMap((document, docIndex) =>
      CLAUSE_LABELS.map((label, index) => {
        const required = index < 5;
        const present = input.baseline.clauseCoverage + docIndex * 2 - index * 4 >= 52;
        return {
          id: this.createId("doc-clause"),
          documentId: document.id,
          label,
          category: clauseCategory(label),
          confidence: clamp(input.baseline.clauseCoverage + input.summarization.coverageScore * 0.1 - index * 2) / 100,
          required,
          present,
        };
      })
    );
    const criticalMissing = clauses
      .filter((clause) => clause.required && !clause.present)
      .map((clause) => `${clause.documentId}:${clause.label}`)
      .slice(0, 12);
    const coverageScore = clamp(
      input.baseline.clauseCoverage * 0.75 +
        (1 - criticalMissing.length / Math.max(1, clauses.length)) * 25
    );

    return {
      clauses,
      coverageScore,
      criticalMissing,
      narrative: `Clause coverage ${Math.round(coverageScore)} with ${criticalMissing.length} critical missing clauses.`,
    };
  }
}

function clauseCategory(label: (typeof CLAUSE_LABELS)[number]): DocumentClauseRecord["category"] {
  switch (label) {
    case "Term":
      return "term";
    case "Renewal":
      return "renewal";
    case "Termination":
      return "termination";
    case "Confidentiality":
      return "confidentiality";
    case "Compliance":
      return "compliance";
    case "Payment":
      return "payment";
    case "Governance":
      return "governance";
  }
}
