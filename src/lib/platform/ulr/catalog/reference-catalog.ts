import { OTHER_DOMAIN_STRANDS, OTHER_DOMAIN_SUB_STRANDS } from "@/lib/platform/ulr/catalog/other-domains";
import {
  SL_ALL_COMPETENCIES,
  SL_ALL_RELATIONSHIPS,
  SL_LIBRARY_MANIFEST,
  SL_TOTAL_COMPETENCY_COUNT,
} from "@/lib/platform/ulr/catalog/structured-literacy/competencies/all-libraries";
import { SL_ALL_ATOMIC_SKILLS } from "@/lib/platform/ulr/catalog/structured-literacy/atomic-skills";
import { SL_STRANDS } from "@/lib/platform/ulr/catalog/structured-literacy/strands";
import { SL_ALL_SUB_STRANDS } from "@/lib/platform/ulr/catalog/structured-literacy/sub-strands";
import type {
  UlrAtomicSkillDefinition,
  UlrCompetencyDefinition,
  UlrLearningDomain,
  UlrRelationship,
  UlrStrand,
  UlrSubStrand,
} from "@/lib/platform/ulr/types";
import { ULR_PRODUCTION_DOMAIN_KEYS } from "@/lib/platform/ulr/types";

export const ULR_REFERENCE_DOMAINS: UlrLearningDomain[] = ULR_PRODUCTION_DOMAIN_KEYS.map(
  (domainKey, index) => ({
    domainKey,
    domainCode: domainKey.split(".")[1]?.toUpperCase().slice(0, 3) ?? "UNK",
    title: domainKey
      .replace("domain.", "")
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" "),
    description: `Production learning domain: ${domainKey}`,
    version: "1.0.0",
    status: "published",
    sortOrder: (index + 1) * 10,
  })
);

const DOMAIN_OVERRIDES: Partial<Record<string, Partial<UlrLearningDomain>>> = {
  "domain.structured_literacy": {
    domainCode: "SL",
    title: "Structured Literacy",
    description: "Wilson-aligned structured literacy — gold standard reference domain (Doc 13)",
    metadata: {
      documentRef: "DOCUMENT-13",
      knowledgePopulationPhase: 1,
      goldStandardComplete: true,
      competencyLibraries: SL_LIBRARY_MANIFEST.length,
      totalCompetencies: SL_TOTAL_COMPETENCY_COUNT,
    },
  },
  "domain.real_life_math": {
    domainCode: "RLM",
    title: "Real-Life Math",
    description: "Applied mathematics for authentic life contexts",
  },
  "domain.litlab": { domainCode: "LL", title: "LitLab" },
  "domain.earthology": { domainCode: "EO", title: "Earthology" },
  "domain.life_lab": { domainCode: "LLB", title: "Life Lab" },
  "domain.ai_venture_lab": { domainCode: "AVL", title: "AI Venture Lab" },
};

export const ULR_PRODUCTION_DOMAINS: UlrLearningDomain[] = ULR_REFERENCE_DOMAINS.map((domain) => ({
  ...domain,
  ...(DOMAIN_OVERRIDES[domain.domainKey] ?? {}),
}));

export const ULR_REFERENCE_STRANDS: UlrStrand[] = [...SL_STRANDS, ...OTHER_DOMAIN_STRANDS];

export const ULR_REFERENCE_SUB_STRANDS: UlrSubStrand[] = [
  ...SL_ALL_SUB_STRANDS,
  ...OTHER_DOMAIN_SUB_STRANDS,
];

export const ULR_REFERENCE_COMPETENCIES: UlrCompetencyDefinition[] = SL_ALL_COMPETENCIES;

export const ULR_REFERENCE_ATOMIC_SKILLS: UlrAtomicSkillDefinition[] = SL_ALL_ATOMIC_SKILLS;

export const ULR_REFERENCE_RELATIONSHIPS: UlrRelationship[] = SL_ALL_RELATIONSHIPS;

export {
  SL_ALL_COMPETENCIES,
  SL_ALL_RELATIONSHIPS,
  SL_LIBRARY_MANIFEST,
  SL_TOTAL_COMPETENCY_COUNT,
} from "@/lib/platform/ulr/catalog/structured-literacy/competencies/all-libraries";
export {
  SL_ALL_ATOMIC_SKILLS,
  SL_PA_ATOMIC_SKILLS,
  SL_PA_COMPETENCIES,
  SL_PA_LIBRARY_KEY,
  SL_ALL_SUB_STRANDS,
  SL_STRANDS,
} from "@/lib/platform/ulr/catalog/structured-literacy";
