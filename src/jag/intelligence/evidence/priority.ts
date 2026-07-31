/**
 * Evidence priority model — deterministic defaults by organizational kind.
 */

import type { OrganizationalEvidenceKind } from "@/jag/intelligence/evidence/reference-kinds";

export const EVIDENCE_PRIORITIES = Object.freeze([
  "critical",
  "high",
  "medium",
  "low",
  "background",
] as const);

export type EvidencePriority = (typeof EVIDENCE_PRIORITIES)[number];

const PRIORITY_RANK: Record<EvidencePriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  background: 4,
};

const DEFAULT_KIND_PRIORITY: Record<OrganizationalEvidenceKind, EvidencePriority> =
  {
    policy: "high",
    decision: "high",
    work: "medium",
    report: "medium",
    analytics: "medium",
    document: "low",
    schedule: "medium",
    identity: "low",
    organization_blueprint: "high",
    capability_pack: "medium",
    runtime_state: "medium",
    communication: "low",
  };

export function defaultPriorityForKind(
  kind: OrganizationalEvidenceKind
): EvidencePriority {
  return DEFAULT_KIND_PRIORITY[kind];
}

export function evidencePriorityRank(priority: EvidencePriority): number {
  return PRIORITY_RANK[priority];
}

export function compareEvidencePriority(
  a: EvidencePriority,
  b: EvidencePriority
): number {
  return evidencePriorityRank(a) - evidencePriorityRank(b);
}
