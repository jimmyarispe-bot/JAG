/**
 * Canonical Education vocabulary — stable identifiers and preferred terms.
 * Knowledge only; no execution logic.
 */

export interface EducationVocabularyTerm {
  /** Stable id, e.g. education.term.student */
  id: string;
  /** Preferred display / documentation term. */
  term: string;
  /** Short definition. */
  definition: string;
  /** Optional aliases (non-canonical). */
  aliases?: readonly string[];
  /** Entity / classification / capability / policy / relationship. */
  kind:
    | "entity"
    | "relationship"
    | "classification"
    | "policy"
    | "capability"
    | "state"
    | "general";
}

/** Namespace prefix for all Education knowledge identifiers. */
export const EDUCATION_KNOWLEDGE_NS = "education.knowledge" as const;

export const EDUCATION_VOCABULARY: readonly EducationVocabularyTerm[] = [
  {
    id: "education.term.student",
    term: "Student",
    definition: "A learner enrolled or seeking enrollment in an Education program.",
    aliases: ["learner", "pupil"],
    kind: "entity",
  },
  {
    id: "education.term.family",
    term: "Family",
    definition: "Household or guardians supporting one or more students.",
    aliases: ["guardian household", "parent"],
    kind: "entity",
  },
  {
    id: "education.term.teacher",
    term: "Teacher",
    definition: "Instructional staff member responsible for teaching a class or course.",
    aliases: ["instructor", "educator"],
    kind: "entity",
  },
  {
    id: "education.term.campus",
    term: "Campus",
    definition: "Physical or virtual site where education is delivered.",
    aliases: ["site", "location"],
    kind: "entity",
  },
  {
    id: "education.term.program",
    term: "Program",
    definition: "Structured educational offering students enroll into.",
    kind: "entity",
  },
  {
    id: "education.term.course",
    term: "Course",
    definition: "Subject or curriculum unit within a program.",
    kind: "entity",
  },
  {
    id: "education.term.class",
    term: "Class",
    definition: "Scheduled instructional grouping of students for a course.",
    aliases: ["section"],
    kind: "entity",
  },
  {
    id: "education.term.session",
    term: "Session",
    definition: "A single meeting occurrence of a class.",
    aliases: ["meeting", "period"],
    kind: "entity",
  },
  {
    id: "education.term.assessment",
    term: "Assessment",
    definition: "Instrument or event that measures learning against a goal or standard.",
    aliases: ["test", "evaluation"],
    kind: "entity",
  },
  {
    id: "education.term.intervention",
    term: "Intervention",
    definition: "Support action targeting a student to improve outcomes.",
    kind: "entity",
  },
  {
    id: "education.term.scholarship",
    term: "Scholarship",
    definition: "Financial award that may fund or condition enrollment.",
    kind: "entity",
  },
  {
    id: "education.term.attendance_record",
    term: "Attendance Record",
    definition: "Recorded attendance state for a student at a session.",
    kind: "entity",
  },
  {
    id: "education.term.progress_record",
    term: "Progress Record",
    definition: "Recorded academic progress observation for a student.",
    kind: "entity",
  },
  {
    id: "education.term.goal",
    term: "Goal",
    definition: "Intended learning or outcome target for a student or program.",
    kind: "entity",
  },
  {
    id: "education.term.enrollment",
    term: "Enrollment",
    definition: "Relationship or process placing a student into a program.",
    kind: "general",
  },
  {
    id: "education.term.classroom",
    term: "Classroom",
    definition: "Physical or virtual space where instruction occurs.",
    kind: "entity",
  },
  {
    id: "education.term.section",
    term: "Section",
    definition: "Scheduled offering of a course with capacity and staffing.",
    kind: "entity",
  },
  {
    id: "education.term.instructional_block",
    term: "Instructional Block",
    definition: "Timed block of instruction within a bell schedule.",
    kind: "entity",
  },
  {
    id: "education.term.bell_schedule",
    term: "Bell Schedule",
    definition: "Campus or program daily period structure.",
    kind: "entity",
  },
  {
    id: "education.term.teaching_assignment",
    term: "Teaching Assignment",
    definition: "Assignment of a teacher to a section or class.",
    kind: "entity",
  },
  {
    id: "education.term.capacity_unit",
    term: "Capacity Unit",
    definition: "Unit of instructional capacity such as seats or virtual slots.",
    kind: "entity",
  },
  {
    id: "education.term.instructional_load",
    term: "Instructional Load",
    definition: "Measured teaching load for a staff member.",
    kind: "entity",
  },
  {
    id: "education.term.funding_source",
    term: "Funding Source",
    definition: "Source of educational funding such as scholarship or grant.",
    kind: "entity",
  },
  {
    id: "education.term.scholarship_award",
    term: "Scholarship Award",
    definition: "Awarded scholarship instance for a student or enrollment.",
    kind: "entity",
  },
  {
    id: "education.term.eligibility_rule",
    term: "Eligibility Rule",
    definition: "Rule concept governing funding or scholarship eligibility.",
    kind: "entity",
  },
  {
    id: "education.term.compliance_requirement",
    term: "Compliance Requirement",
    definition: "Required compliance obligation for a student or program.",
    kind: "entity",
  },
  {
    id: "education.term.renewal_cycle",
    term: "Renewal Cycle",
    definition: "Cycle for renewing scholarships or funding awards.",
    kind: "entity",
  },
  {
    id: "education.term.supporting_documentation",
    term: "Supporting Documentation",
    definition: "Documentation required to support funding or compliance.",
    kind: "entity",
  },
  {
    id: "education.term.funding_period",
    term: "Funding Period",
    definition: "Time window during which funding applies.",
    kind: "entity",
  },
  {
    id: "education.term.capability.enrollment",
    term: "Enrollment Intelligence",
    definition: "Domain capability to reason about enrollment readiness and requirements.",
    kind: "capability",
  },
  {
    id: "education.term.capability.attendance",
    term: "Attendance Intelligence",
    definition: "Domain capability to reason about attendance patterns and risk.",
    kind: "capability",
  },
] as const;

export function vocabularyById(): ReadonlyMap<string, EducationVocabularyTerm> {
  return new Map(EDUCATION_VOCABULARY.map((t) => [t.id, t]));
}

export function vocabularyByTerm(): ReadonlyMap<string, EducationVocabularyTerm> {
  const map = new Map<string, EducationVocabularyTerm>();
  for (const t of EDUCATION_VOCABULARY) {
    map.set(t.term.toLowerCase(), t);
    for (const alias of t.aliases ?? []) {
      map.set(alias.toLowerCase(), t);
    }
  }
  return map;
}
