import { createHash } from "node:crypto";
import type { InsightEvidenceRef } from "@/lib/executive-intelligence/insights/types";
import type { EvidenceDocument } from "@/lib/evidence-center";

export function stableInsightId(
  organizationId: string,
  ruleId: string
): string {
  return createHash("sha256")
    .update(`${organizationId}:${ruleId}`)
    .digest("hex")
    .slice(0, 20);
}

export function evidenceRef(doc: EvidenceDocument): InsightEvidenceRef {
  return {
    id: doc.id,
    label: doc.name,
    href: `/jag/evidence?org=${encodeURIComponent(doc.organizationId)}&doc=${encodeURIComponent(doc.id)}`,
  };
}

export function refsFromDocs(
  docs: readonly EvidenceDocument[],
  limit = 8
): {
  ids: string[];
  refs: InsightEvidenceRef[];
} {
  const slice = docs.slice(0, limit);
  return {
    ids: slice.map((d) => d.id),
    refs: slice.map(evidenceRef),
  };
}

export function connectorLink(
  organizationId: string,
  connectorId: string,
  label: string
): InsightEvidenceRef {
  return {
    id: `connector:${connectorId}`,
    label,
    href: `/jag/connectors?org=${encodeURIComponent(organizationId)}`,
  };
}
