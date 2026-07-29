/**
 * Evidence origin audit — diagnostic only.
 */

import type { CognitiveEvidenceRef } from "@/lib/jag/runtime";
import type { EducationGraphEvidenceItem } from "../graph";
import type { EducationContributorResult } from "../framework";

export interface EducationEvidenceAuditEntry {
  evidenceId: string;
  source: string;
  originContributorIds: readonly string[];
  /** Phase where the evidence was observed. */
  phase: "contributor" | "graph";
  confidence?: number;
  attributes?: Readonly<Record<string, unknown>>;
  retrievedAt?: string;
}

export interface EducationEvidenceAudit {
  entries: readonly EducationEvidenceAuditEntry[];
}

export function buildEducationEvidenceAudit(input: {
  contributorResults: ReadonlyArray<{
    contributorId: string;
    result: EducationContributorResult;
  }>;
  graphEvidence: readonly EducationGraphEvidenceItem[];
}): EducationEvidenceAudit {
  const entries: EducationEvidenceAuditEntry[] = [];

  for (const { contributorId, result } of input.contributorResults) {
    for (const ref of result.evidence) {
      entries.push(fromRef(ref, [contributorId], "contributor"));
    }
  }

  for (const item of input.graphEvidence) {
    entries.push(
      fromRef(item.ref, item.originContributorIds, "graph")
    );
  }

  return { entries };
}

function fromRef(
  ref: CognitiveEvidenceRef,
  originContributorIds: readonly string[],
  phase: "contributor" | "graph"
): EducationEvidenceAuditEntry {
  return {
    evidenceId: ref.id,
    source: ref.source,
    originContributorIds: [...originContributorIds],
    phase,
    confidence:
      typeof ref.attributes?.confidence === "number"
        ? ref.attributes.confidence
        : undefined,
    attributes: ref.attributes,
    retrievedAt: ref.retrievedAt,
  };
}
