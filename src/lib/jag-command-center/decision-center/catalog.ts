/**
 * Map contributors → capability pack / domain / decision group.
 * Metadata only — no invented decisions.
 */

import {
  EDUCATION_DOMAIN_ID,
  EDUCATION_DOMAIN_NAME,
  listCapabilityPacks,
} from "@/lib/domains/education";
import type { JagDecisionGroup } from "./types";

export type ContributorCatalogEntry = {
  readonly contributorId: string;
  readonly contributorLabel: string;
  readonly domainId: string;
  readonly domainName: string;
  readonly capabilityPackId: string;
  readonly capabilityPackName: string;
  readonly group: JagDecisionGroup;
};

const GROUP_LABELS: Record<JagDecisionGroup, string> = {
  students: "Students",
  operations: "Operations",
  funding: "Funding",
  executive: "Executive",
};

let cache: Map<string, ContributorCatalogEntry> | null = null;

export function decisionGroupLabel(group: JagDecisionGroup): string {
  return GROUP_LABELS[group];
}

export function resolveContributorCatalog(
  contributorId: string
): ContributorCatalogEntry {
  const map = getCatalogMap();
  return (
    map.get(contributorId) ?? {
      contributorId,
      contributorLabel: labelForContributor(contributorId),
      domainId: EDUCATION_DOMAIN_ID,
      domainName: titleCase(EDUCATION_DOMAIN_NAME),
      capabilityPackId: "education.capability_pack.unknown",
      capabilityPackName: "Unassigned",
      group: groupForContributor(contributorId),
    }
  );
}

function getCatalogMap(): Map<string, ContributorCatalogEntry> {
  if (cache) return cache;
  const map = new Map<string, ContributorCatalogEntry>();
  for (const pack of listCapabilityPacks()) {
    for (const contributorId of pack.metadata.contributors) {
      map.set(contributorId, {
        contributorId,
        contributorLabel: labelForContributor(contributorId),
        domainId: EDUCATION_DOMAIN_ID,
        domainName: titleCase(EDUCATION_DOMAIN_NAME),
        capabilityPackId: pack.id,
        capabilityPackName: pack.name,
        group: groupForContributor(contributorId),
      });
    }
  }
  cache = map;
  return map;
}

export function resetDecisionCatalogCacheForTests(): void {
  cache = null;
}

export function groupForContributor(contributorId: string): JagDecisionGroup {
  const id = contributorId.toLowerCase();
  if (
    id.includes("funding") ||
    id.includes("scholarship") ||
    id.includes("compliance")
  ) {
    return "funding";
  }
  if (
    id.includes("scheduling") ||
    id.includes("staffing") ||
    id.includes("capacity") ||
    id.includes("operational")
  ) {
    return "operations";
  }
  if (
    id.includes("school_health") ||
    id.includes("campus_performance") ||
    id.includes("executive")
  ) {
    return "executive";
  }
  return "students";
}

function labelForContributor(contributorId: string): string {
  const tail = contributorId.split(".").pop() ?? contributorId;
  return tail
    .split("_")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function titleCase(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}
