/**
 * Knowledge Intelligence — provenance suite (Sprint 040 / 0.2.0).
 *
 * Every knowledge artifact retains source, source type, original author,
 * current owner, dates, confidence/trust, version history, approval status,
 * and related policies / decisions / goals / organizational DNA.
 */

import type { KnowledgeProvenanceEngine as KnowledgeProvenanceEngineContract } from "@/lib/platform/intelligence/knowledge/contracts";
import {
  clamp,
  statusFromScore,
} from "@/lib/platform/intelligence/knowledge/models";
import type {
  KnowledgeBaseline,
  KnowledgeCatalogResult,
  KnowledgeProvenanceSuite,
} from "@/lib/platform/intelligence/knowledge/types";

export class KnowledgeProvenanceEngine
  implements KnowledgeProvenanceEngineContract
{
  assess(input: {
    baseline: KnowledgeBaseline;
    catalog: KnowledgeCatalogResult;
    now: Date;
  }): KnowledgeProvenanceSuite {
    void input.now;
    const records = input.catalog.artifacts.map((a) => a.provenance);
    const overallTrustScore = clamp(
      records.reduce((s, r) => s + r.trustScore, 0) / Math.max(1, records.length)
    );
    const overallConfidenceScore = clamp(
      records.reduce((s, r) => s + r.confidenceScore, 0) /
        Math.max(1, records.length)
    );
    const approvedRatio =
      records.filter((r) => r.approvalStatus === "approved").length /
      Math.max(1, records.length);
    const unvalidatedCount = records.filter(
      (r) => r.lastValidationDate === null
    ).length;

    const ownershipClarity =
      records.filter((r) => r.currentOwner.length > 0).length /
      Math.max(1, records.length);
    const candidates: Array<{
      key: KnowledgeProvenanceSuite["weakestDimension"];
      value: number;
    }> = [
      { key: "trust", value: overallTrustScore },
      { key: "confidence", value: overallConfidenceScore },
      {
        key: "validation",
        value: clamp((1 - unvalidatedCount / Math.max(1, records.length)) * 100),
      },
      { key: "ownership", value: clamp(ownershipClarity * 100) },
      { key: "approval", value: clamp(approvedRatio * 100) },
    ];
    const weakest = [...candidates].sort((a, c) => a.value - c.value)[0]!;

    return {
      records,
      overallTrustScore,
      overallConfidenceScore,
      approvedRatio,
      unvalidatedCount,
      weakestDimension: weakest.key,
      narrative: `Provenance ${statusFromScore(overallTrustScore)} — trust ${Math.round(overallTrustScore)}, confidence ${Math.round(overallConfidenceScore)}, approved ${(approvedRatio * 100).toFixed(0)}%; weakest ${weakest.key}. Baseline provenance ${Math.round(input.baseline.provenanceScore)}.`,
    };
  }
}
