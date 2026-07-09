import doc98Import from "@/lib/platform/ulr/catalog/structured-literacy/competencies/foundational-pa/doc98-import.json";
import {
  buildPaCompetencyFromImport,
  type Doc98CompetencyImport,
} from "@/lib/platform/ulr/catalog/structured-literacy/shared-defaults";
import type { UlrCompetencyDefinition } from "@/lib/platform/ulr/types";

/** All 24 Document 98 Foundational Phonological Awareness competencies. */
export const SL_PA_COMPETENCIES: UlrCompetencyDefinition[] = (
  doc98Import.competencies as Doc98CompetencyImport[]
).map(buildPaCompetencyFromImport);

export const SL_PA_LIBRARY_KEY = doc98Import.libraryKey;
