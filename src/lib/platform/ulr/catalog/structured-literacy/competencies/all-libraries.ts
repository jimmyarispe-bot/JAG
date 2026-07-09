import { SL_PA_COMPETENCIES } from "@/lib/platform/ulr/catalog/structured-literacy/competencies/foundational-pa";
import { buildPaRelationships } from "@/lib/platform/ulr/catalog/structured-literacy/competencies/foundational-pa/relationships";
import {
  buildSlLibrary,
  mergeSlLibraries,
} from "@/lib/platform/ulr/catalog/structured-literacy/library-framework/build";
import { SL_LIBRARY_SPECS } from "@/lib/platform/ulr/catalog/structured-literacy/library-specs";
import type { SlGeneratedLibrary } from "@/lib/platform/ulr/catalog/structured-literacy/library-framework/build";

/** Generated SL competency libraries (Docs 62, 84–97). */
export const SL_GENERATED_LIBRARIES: SlGeneratedLibrary[] = SL_LIBRARY_SPECS.map(buildSlLibrary);

export const SL_GENERATED_COMPETENCIES = SL_GENERATED_LIBRARIES.flatMap((l) => l.competencies);
export const SL_GENERATED_ATOMIC_SKILLS = SL_GENERATED_LIBRARIES.flatMap((l) => l.atomicSkills);
export const SL_GENERATED_RELATIONSHIPS = SL_GENERATED_LIBRARIES.flatMap((l) => l.relationships);

const merged = mergeSlLibraries(SL_GENERATED_LIBRARIES);

/** All Structured Literacy competencies: Doc 98 PA + 15 generated libraries. */
export const SL_ALL_COMPETENCIES = [...SL_PA_COMPETENCIES, ...merged.competencies];

export const SL_ALL_RELATIONSHIPS = [
  ...buildPaRelationships(SL_PA_COMPETENCIES),
  ...merged.relationships,
];

export const SL_LIBRARY_MANIFEST = [
  {
    libraryKey: "competency_library.foundational_phonological_awareness",
    documentRef: "DOCUMENT-98",
    competencyCount: SL_PA_COMPETENCIES.length,
  },
  ...SL_GENERATED_LIBRARIES.map((lib) => ({
    libraryKey: lib.libraryKey,
    documentRef: lib.documentRef,
    competencyCount: lib.competencyCount,
  })),
];

export const SL_TOTAL_COMPETENCY_COUNT = SL_ALL_COMPETENCIES.length;
