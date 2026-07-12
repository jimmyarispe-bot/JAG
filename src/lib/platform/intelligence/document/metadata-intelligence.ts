/**
 * Document metadata extraction intelligence.
 */

import type { DocumentMetadataIntelligence as DocumentMetadataIntelligenceContract } from "@/lib/platform/intelligence/document/contracts";
import { clamp } from "@/lib/platform/intelligence/document/models";
import type {
  DocumentBaseline,
  DocumentCatalogResult,
  DocumentMetadataSuite,
} from "@/lib/platform/intelligence/document/types";

const REQUIRED_FIELDS = ["title", "type", "owner", "status", "version", "updatedAt", "expiresAt"];

export class DocumentMetadataIntelligence implements DocumentMetadataIntelligenceContract {
  extract(input: {
    baseline: DocumentBaseline;
    catalog: DocumentCatalogResult;
    now: Date;
  }): DocumentMetadataSuite {
    void input.now;
    const records = input.catalog.documents.map((document) => {
      const hasExpiration = document.expiresAt !== null;
      const completeness = clamp(
        input.baseline.metadataCompleteness +
          (hasExpiration ? 4 : 0) +
          (document.owner === "executive" ? -3 : 2)
      );
      return {
        documentId: document.id,
        fields: {
          title: document.title,
          type: document.type,
          owner: document.owner,
          status: document.status,
          version: document.version,
          updatedAt: document.updatedAt,
          expiresAt: document.expiresAt,
          confidenceLevel: document.confidence.level,
        },
        completeness,
      };
    });
    const completenessScore = clamp(
      records.reduce((sum, record) => sum + record.completeness, 0) / Math.max(1, records.length)
    );
    const weakestField =
      input.baseline.expirationRisk > 0.35 ? "expiresAt" : input.baseline.metadataCompleteness < 60 ? "owner" : "version";

    return {
      records,
      completenessScore,
      weakestField: REQUIRED_FIELDS.includes(weakestField) ? weakestField : "owner",
      narrative: `Metadata completeness ${Math.round(completenessScore)}; weakest field ${weakestField}.`,
    };
  }
}
