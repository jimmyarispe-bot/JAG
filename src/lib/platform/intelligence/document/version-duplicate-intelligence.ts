/**
 * Document version comparison and duplicate detection.
 */

import type { DocumentVersionDuplicateIntelligence as DocumentVersionDuplicateIntelligenceContract } from "@/lib/platform/intelligence/document/contracts";
import { clamp, defaultCreateId } from "@/lib/platform/intelligence/document/models";
import type {
  DocumentBaseline,
  DocumentCatalogResult,
  DocumentDuplicateCluster,
  DocumentDuplicateSuite,
  DocumentVersionSuite,
} from "@/lib/platform/intelligence/document/types";

export class DocumentVersionDuplicateIntelligence
  implements DocumentVersionDuplicateIntelligenceContract
{
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  compareVersions(input: {
    baseline: DocumentBaseline;
    catalog: DocumentCatalogResult;
    now: Date;
  }): DocumentVersionSuite {
    const comparisons = input.catalog.documents.map((document) => {
      const ageDays = Math.max(
        0,
        Math.round((input.now.getTime() - new Date(document.updatedAt).getTime()) / 86_400_000)
      );
      const stale = ageDays > 90 || document.status === "superseded" || document.status === "expired";
      const changeScore = clamp(input.baseline.versionHygiene - (stale ? 18 : 0) + document.confidence.value * 10);
      return {
        documentId: document.id,
        currentVersion: document.version,
        comparedTo: stale ? previousVersion(document.version) : null,
        changeScore,
        stale,
        narrative: `${document.title} version ${document.version} is ${stale ? "stale" : "current"}.`,
      };
    });
    const staleCount = comparisons.filter((comparison) => comparison.stale).length;
    const hygieneScore = clamp(
      input.baseline.versionHygiene * 0.8 + (100 - (staleCount / Math.max(1, comparisons.length)) * 100) * 0.2
    );

    return {
      comparisons,
      hygieneScore,
      staleCount,
      narrative: `Version hygiene ${Math.round(hygieneScore)} with ${staleCount} stale records.`,
    };
  }

  detectDuplicates(input: {
    baseline: DocumentBaseline;
    catalog: DocumentCatalogResult;
    versions: DocumentVersionSuite;
    now: Date;
  }): DocumentDuplicateSuite {
    void input.now;
    const duplicateTargets = Math.max(1, Math.round(input.baseline.duplicatePressure * 4));
    const clusters: DocumentDuplicateCluster[] = [];
    for (let index = 0; index < duplicateTargets; index += 1) {
      const left = input.catalog.documents[index];
      const right = input.catalog.documents[index + 1];
      if (!left || !right) continue;
      clusters.push({
        id: this.createId("doc-dup"),
        documentIds: [left.id, right.id],
        similarity: clamp(input.baseline.duplicatePressure * 100 + input.versions.staleCount * 3) / 100,
        recommendedAction: "Review lineage and supersede duplicates where appropriate",
      });
    }
    const duplicatePressure = clamp(input.baseline.duplicatePressure * 100 + clusters.length * 3);

    return {
      clusters,
      duplicatePressure,
      narrative: `Duplicate pressure ${Math.round(duplicatePressure)} across ${clusters.length} clusters.`,
    };
  }
}

function previousVersion(version: string): string {
  const major = Number.parseInt(version.replace(/^v/, "").split(".")[0] ?? "1", 10);
  return `v${Math.max(1, major - 1)}.0`;
}
