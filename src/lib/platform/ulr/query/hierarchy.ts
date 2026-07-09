import {
  getAllUlrDomains,
  getUlrCompetenciesBySubStrand,
  getUlrDomain,
  getUlrStrandsByDomain,
  getUlrSubStrandsByStrand,
} from "@/lib/platform/ulr/registry/registry";
import type { UlrHierarchyNode } from "@/lib/platform/ulr/types";

/** Build hierarchical ULR tree for a learning domain. */
export function getUlrDomainHierarchy(domainKey: string): UlrHierarchyNode | null {
  const domain = getUlrDomain(domainKey);
  if (!domain) return null;

  const strandNodes: UlrHierarchyNode[] = getUlrStrandsByDomain(domainKey).map((strand) => {
    const subStrandNodes: UlrHierarchyNode[] = getUlrSubStrandsByStrand(strand.strandKey).map(
      (subStrand) => {
        const competencyNodes: UlrHierarchyNode[] = getUlrCompetenciesBySubStrand(
          subStrand.subStrandKey
        ).map((competency) => ({
          key: competency.competencyKey,
          kind: "competency",
          title: competency.title,
          status: competency.status,
        }));

        return {
          key: subStrand.subStrandKey,
          kind: "sub_strand",
          title: subStrand.title,
          status: subStrand.status,
          children: competencyNodes,
        };
      }
    );

    return {
      key: strand.strandKey,
      kind: "strand",
      title: strand.title,
      status: strand.status,
      children: subStrandNodes,
    };
  });

  return {
    key: domain.domainKey,
    kind: "domain",
    title: domain.title,
    status: domain.status,
    children: strandNodes,
  };
}

export function listUlrProductionDomains() {
  return getAllUlrDomains();
}
