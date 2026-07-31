import { ACADEMY_TERMINOLOGY_PACK_IDS } from "@/packages/academy/package";

export type AcademyTerminologyPack = {
  readonly id: string;
  readonly label: string;
  readonly terms: Readonly<Record<string, string>>;
};

export const ACADEMY_TERMINOLOGY_PACKS: readonly AcademyTerminologyPack[] = [
  {
    id: ACADEMY_TERMINOLOGY_PACK_IDS[0],
    label: "Academy default terminology",
    terms: {
      learner: "Student",
      guardian: "Parent/Guardian",
      site: "School",
      academicLevel: "Academic Level",
      readingLevel: "Reading Level",
      mathLevel: "Math Level",
      writingLevel: "Writing Level",
      structuredLiteracyLevel: "Structured Literacy Level",
      structuredLiteracyStep: "Structured Literacy Step",
    },
  },
];
