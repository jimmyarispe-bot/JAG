import doc98Import from "@/lib/platform/ulr/catalog/structured-literacy/competencies/foundational-pa/doc98-import.json";
import {
  buildPaAiMetadata,
  buildPaCompetencyFromImport,
  PA_DOMAIN_KEY,
  PA_STRAND_KEY,
  type Doc98CompetencyImport,
} from "@/lib/platform/ulr/catalog/structured-literacy/shared-defaults";
import { SL_GENERATED_ATOMIC_SKILLS } from "@/lib/platform/ulr/catalog/structured-literacy/competencies/all-libraries";
import type { UlrAtomicSkillDefinition } from "@/lib/platform/ulr/types";

/** Document 98 §7 — PA atomic skill placeholders. */
export function buildSlPaAtomicSkillsFromDoc98(): UlrAtomicSkillDefinition[] {
  const records = doc98Import.competencies as Doc98CompetencyImport[];
  const skills: UlrAtomicSkillDefinition[] = [];

  for (const record of records) {
    for (const ref of record.futureAtomicSkillRefs) {
      skills.push({
        skillKey: ref.key,
        competencyKey: record.competencyKey,
        learningDomainKey: PA_DOMAIN_KEY,
        strandKey: PA_STRAND_KEY,
        subStrandKey: record.subStrandKey,
        title: ref.title,
        description: `Doc 98 placeholder atomic skill for ${record.title}`,
        version: "1.0.0",
        status: "draft",
        prerequisites: [],
        relatedSkills: [],
        nextSkills: [],
        crossDomainLinks: [],
        difficulty: "foundational",
        masteryCriteria: "≥ 4/5 trials per Doc 51 probe threshold (placeholder)",
        evidenceTypes: record.evidenceTypes.slice(0, 2),
        minimumEvidenceCount: 2,
        assessmentMethods: record.assessmentMethods.slice(0, 1),
        aiMetadata: buildPaAiMetadata(),
        portfolioEligible: false,
        transcriptEligible: false,
        metadata: {
          placeholder: true,
          documentRef: "DOCUMENT-98",
          libraryKey: doc98Import.libraryKey,
        },
      });
    }
  }

  return skills;
}

export const SL_PA_ATOMIC_SKILLS = buildSlPaAtomicSkillsFromDoc98();

/** All SL atomic skills — Doc 98 PA placeholders + generated library placeholders. */
export const SL_ALL_ATOMIC_SKILLS: UlrAtomicSkillDefinition[] = [
  ...SL_PA_ATOMIC_SKILLS,
  ...SL_GENERATED_ATOMIC_SKILLS,
];
