import { SL_LIBRARY_SPECS } from "@/lib/platform/ulr/catalog/structured-literacy/library-specs";
import type { UlrSubStrand } from "@/lib/platform/ulr/types";
import { SL_PA_SUB_STRANDS } from "@/lib/platform/ulr/catalog/structured-literacy/sub-strands/pa";

/** All SL sub-strands derived from competency library specs + PA (Doc 98). */
export function buildSlSubStrandsFromSpecs(): UlrSubStrand[] {
  const seen = new Set<string>();
  const subStrands: UlrSubStrand[] = [];

  for (const spec of SL_LIBRARY_SPECS) {
    for (const group of spec.groups) {
      if (seen.has(group.subStrandKey)) continue;
      seen.add(group.subStrandKey);
      subStrands.push({
        subStrandKey: group.subStrandKey,
        strandKey: spec.strandKey,
        domainKey: "domain.structured_literacy",
        title: group.groupKey.split(".").pop()?.replace(/_/g, " ") ?? group.groupKey,
        description: `${spec.documentRef} sub-strand — ${spec.conceptKey}`,
        version: "1.0.0",
        status: "published",
        sortOrder: subStrands.length + 1,
        metadata: {
          competencyGroupKey: group.groupKey,
          libraryKey: spec.libraryKey,
        },
      });
    }
  }

  return subStrands;
}

export const SL_GENERATED_SUB_STRANDS = buildSlSubStrandsFromSpecs();

export const SL_ALL_SUB_STRANDS: UlrSubStrand[] = [
  ...SL_PA_SUB_STRANDS,
  ...SL_GENERATED_SUB_STRANDS.filter(
    (ss) => !SL_PA_SUB_STRANDS.some((pa) => pa.subStrandKey === ss.subStrandKey)
  ),
];
