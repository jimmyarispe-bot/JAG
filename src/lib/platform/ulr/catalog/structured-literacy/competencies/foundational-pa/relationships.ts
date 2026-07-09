import { buildSlRelationships } from "@/lib/platform/ulr/catalog/structured-literacy/library-framework/build";
import type { UlrCompetencyDefinition } from "@/lib/platform/ulr/types";

/** Build typed ULR relationships from Document 98 PA competency records. */
export function buildPaRelationships(
  competencies: UlrCompetencyDefinition[]
) {
  return buildSlRelationships(competencies);
}

export { buildSlRelationships };
