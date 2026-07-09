import type { UlrSubStrand } from "@/lib/platform/ulr/types";
import {
  PA_DOMAIN_KEY,
  PA_STRAND_KEY,
} from "@/lib/platform/ulr/catalog/structured-literacy/shared-defaults";

/** Document 98 — Phonological Awareness sub-strands (Doc 51 progression stages). */
export const SL_PA_SUB_STRANDS: UlrSubStrand[] = [
  {
    subStrandKey: "domain.structured_literacy.sub_strand.sentence_awareness",
    strandKey: PA_STRAND_KEY,
    domainKey: PA_DOMAIN_KEY,
    title: "Sentence Awareness",
    description: "Word boundary identification within spoken sentences (Doc 98 · Stage 1)",
    version: "1.0.0",
    status: "published",
    sortOrder: 10,
    metadata: { competencyGroupKeys: ["pa.competency.sentence_segmentation"] },
  },
  {
    subStrandKey: "domain.structured_literacy.sub_strand.syllable_awareness",
    strandKey: PA_STRAND_KEY,
    domainKey: PA_DOMAIN_KEY,
    title: "Syllable Awareness",
    description: "Syllable blend, segment, count, and manipulation (Doc 98 · Stages 2–4)",
    version: "1.0.0",
    status: "published",
    sortOrder: 20,
    metadata: {
      competencyGroupKeys: [
        "pa.competency.syllable_blend",
        "pa.competency.syllable_segment",
        "pa.competency.syllable_manipulate",
      ],
    },
  },
  {
    subStrandKey: "domain.structured_literacy.sub_strand.rhyme_alliteration",
    strandKey: PA_STRAND_KEY,
    domainKey: PA_DOMAIN_KEY,
    title: "Rhyme & Alliteration",
    description: "Rhyme recognition, production, discrimination, alliteration (Doc 98 · Stage 5)",
    version: "1.0.0",
    status: "published",
    sortOrder: 30,
    metadata: { competencyGroupKeys: ["pa.competency.rhyme_recognition"] },
  },
  {
    subStrandKey: "domain.structured_literacy.sub_strand.onset_rime_awareness",
    strandKey: PA_STRAND_KEY,
    domainKey: PA_DOMAIN_KEY,
    title: "Onset-Rime Awareness",
    description: "Onset-rime blend, segment, and manipulation (Doc 98 · Stages 6–7)",
    version: "1.0.0",
    status: "published",
    sortOrder: 40,
    metadata: {
      competencyGroupKeys: [
        "pa.competency.onset_rime_blend",
        "pa.competency.onset_rime_segment",
      ],
    },
  },
  {
    subStrandKey: "domain.structured_literacy.sub_strand.phoneme_readiness_bridge",
    strandKey: PA_STRAND_KEY,
    domainKey: PA_DOMAIN_KEY,
    title: "Phoneme Readiness Bridge",
    description: "Capstone PA competencies bridging to Phonemic Awareness library (Doc 98 · Stage 8)",
    version: "1.0.0",
    status: "published",
    sortOrder: 50,
    metadata: { competencyGroupKeys: ["pa.competency.phoneme_readiness"] },
  },
  {
    subStrandKey:
      "domain.structured_literacy.strand.phonological_awareness.sub_strand.foundational",
    strandKey: PA_STRAND_KEY,
    domainKey: PA_DOMAIN_KEY,
    title: "Foundational Phonological Awareness",
    description: "Legacy migration 149 tier — superseded by Doc 98 sub-strand taxonomy",
    version: "1.0.0",
    status: "deprecated",
    sortOrder: 99,
    metadata: { deprecatedBy: "Doc 98 sub-strand keys" },
  },
];
