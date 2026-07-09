/**
 * Scheduling Intelligence™ — authoritative placement decisions.
 * Reuses PAJ placements, ULR competency keys, and course_sections capacity rules.
 */
import type { createAuthClient } from "@/lib/supabase/server-auth";
import {
  canOpenNewSection,
  effectiveSectionCapacity,
  loadAcademyWayConfig,
  type JagProgramKey,
} from "@/lib/scheduling/academy-way";
import { getPajJourneyByStudent } from "@/lib/platform/paj/persistence/records";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface WilsonPlacementInput {
  verifiedPriorWilson?: boolean;
  documentedExitLevel?: number | null;
  documentedExitStep?: number | null;
}

/** Wilson™ placement: new students at Step 1.3; prior instruction one step below exit. */
export function resolveWilsonPlacementLevel(input: WilsonPlacementInput): {
  level: number;
  step: number;
} {
  if (
    input.verifiedPriorWilson &&
    input.documentedExitLevel != null &&
    input.documentedExitStep != null
  ) {
    let level = input.documentedExitLevel;
    let step = input.documentedExitStep - 1;
    if (step < 1) {
      step = 10;
      level = Math.max(1, level - 1);
    }
    return { level, step };
  }
  return { level: 1, step: 3 };
}

export interface SectionCandidate {
  id: string;
  sectionCode: string;
  enrolledCount: number;
  maxCapacity: number;
  effectiveMax: number;
  structuredLiteracyLevel: number | null;
  structuredLiteracyStep: number | null;
  academySubject: string | null;
  programKey: JagProgramKey | null;
  openSeats: number;
  score: number;
}

type SectionRow = {
  id: string;
  section_code: string;
  max_capacity: number | null;
  min_capacity: number | null;
  structured_literacy_level: number | null;
  structured_literacy_step: number | null;
  status: string;
  courses: {
    school_id?: string;
    program?: string;
    academy_subject?: string;
    name?: string;
  } | { school_id?: string; program?: string; academy_subject?: string; name?: string }[] | null;
};

function resolveProgramKey(course: SectionRow["courses"]): JagProgramKey | null {
  const c = Array.isArray(course) ? course[0] : course;
  if (!c) return null;
  const subject = c.academy_subject ?? "";
  const name = (c.name ?? "").toLowerCase();
  if (subject === "structured_literacy" || name.includes("wilson")) return "structured_literacy";
  if (name.includes("real-life math") || name.includes("real life math")) return "real_life_math";
  if (name.includes("litlab")) return "litlab";
  if (name.includes("earthology")) return "earthology";
  if (name.includes("life lab")) return "life_lab";
  if (name.includes("venture lab a") || name.includes("ai venture a")) return "ai_venture_lab_a";
  if (name.includes("venture lab b") || name.includes("ai venture b")) return "ai_venture_lab_b";
  if (subject === "math") return "real_life_math";
  if (subject === "reading") return "structured_literacy";
  return null;
}

async function countEnrolled(supabase: AuthClient, sectionId: string): Promise<number> {
  const { count } = await supabase
    .from("student_enrollments")
    .select("id", { count: "exact", head: true })
    .eq("course_section_id", sectionId)
    .eq("enrollment_status", "enrolled");
  return count ?? 0;
}

/** Find the best open section for a student using PAJ placement + JAG capacity rules. */
export async function findBestSectionForStudent(
  supabase: AuthClient,
  input: {
    studentId: string;
    schoolId: string;
    program?: string | null;
    wilson?: WilsonPlacementInput;
    academySubject?: string | null;
  }
): Promise<{ sectionId: string | null; candidate: SectionCandidate | null; reason?: string }> {
  const config = await loadAcademyWayConfig(supabase, input.schoolId);

  let targetLevel: number | null = null;
  let targetStep: number | null = null;

  if (input.wilson) {
    const wp = resolveWilsonPlacementLevel(input.wilson);
    targetLevel = wp.level;
    targetStep = wp.step;
  } else {
    const journey = await getPajJourneyByStudent(supabase, input.studentId);
    if (journey) {
      const { data: placement } = await supabase
        .from("platform_paj_placements")
        .select("placed_competency_key, metadata")
        .eq("journey_id", journey.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const meta = (placement?.metadata ?? {}) as {
        structuredLiteracyLevel?: number;
        structuredLiteracyStep?: number;
        wilsonLevel?: number;
        wilsonStep?: number;
      };
      targetLevel = meta.structuredLiteracyLevel ?? meta.wilsonLevel ?? null;
      targetStep = meta.structuredLiteracyStep ?? meta.wilsonStep ?? null;
    }
  }

  if (targetLevel == null && input.academySubject !== "structured_literacy") {
    const wp = resolveWilsonPlacementLevel({});
    targetLevel = wp.level;
    targetStep = wp.step;
  }

  const { data: sections } = await supabase
    .from("course_sections")
    .select(
      "id, section_code, max_capacity, min_capacity, structured_literacy_level, structured_literacy_step, status, courses(school_id, program, academy_subject, name)"
    )
    .eq("status", "open");

  const schoolSections = ((sections ?? []) as SectionRow[]).filter((s) => {
    const course = Array.isArray(s.courses) ? s.courses[0] : s.courses;
    return course?.school_id === input.schoolId;
  });

  const candidates: SectionCandidate[] = [];

  for (const section of schoolSections) {
    const course = Array.isArray(section.courses) ? section.courses[0] : section.courses;
    const programKey = resolveProgramKey(section.courses);
    const enrolledCount = await countEnrolled(supabase, section.id);
    const maxCapacity = section.max_capacity ?? 30;
    const effectiveMax = effectiveSectionCapacity(programKey, maxCapacity, config);
    const openSeats = effectiveMax - enrolledCount;

    if (openSeats <= 0) continue;

    if (input.program && course?.program && course.program !== input.program) continue;

    if (
      input.academySubject &&
      course?.academy_subject &&
      course.academy_subject !== input.academySubject
    ) {
      continue;
    }

    let score = openSeats;

    if (targetLevel != null && section.structured_literacy_level != null) {
      if (
        section.structured_literacy_level === targetLevel &&
        (targetStep == null ||
          section.structured_literacy_step == null ||
          section.structured_literacy_step === targetStep)
      ) {
        score += 100;
      } else {
        score -= 50;
      }
    }

    // Prefer fuller sections per JAG rule (fill before opening new)
    score += enrolledCount * 2;

    candidates.push({
      id: section.id,
      sectionCode: section.section_code,
      enrolledCount,
      maxCapacity,
      effectiveMax,
      structuredLiteracyLevel: section.structured_literacy_level,
      structuredLiteracyStep: section.structured_literacy_step,
      academySubject: course?.academy_subject ?? null,
      programKey,
      openSeats,
      score,
    });
  }

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0] ?? null;

  if (!best) {
    const canOpen = schoolSections.every((s) => {
      const pk = resolveProgramKey(s.courses);
      const enrolled = 0; // conservative — recommend new section only when none fit
      return canOpenNewSection(pk, enrolled, s.max_capacity ?? 30, config);
    });
    return {
      sectionId: null,
      candidate: null,
      reason: canOpen
        ? "No open section with capacity — recommend creating a new section"
        : "Existing sections must reach capacity before opening a new section",
    };
  }

  return { sectionId: best.id, candidate: best };
}

/** Best full section for waitlist when no seats remain. */
async function findWaitlistSection(
  supabase: AuthClient,
  input: {
    schoolId: string;
    program?: string | null;
    academySubject?: string | null;
  }
): Promise<string | null> {
  const config = await loadAcademyWayConfig(supabase, input.schoolId);
  const { data: sections } = await supabase
    .from("course_sections")
    .select("id, max_capacity, courses(school_id, program, academy_subject, name)")
    .eq("status", "open");

  for (const section of (sections ?? []) as SectionRow[]) {
    const course = Array.isArray(section.courses) ? section.courses[0] : section.courses;
    if (course?.school_id !== input.schoolId) continue;
    if (input.program && course?.program && course.program !== input.program) continue;
    if (
      input.academySubject &&
      course?.academy_subject &&
      course.academy_subject !== input.academySubject
    ) {
      continue;
    }

    const programKey = resolveProgramKey(section.courses);
    const enrolledCount = await countEnrolled(supabase, section.id);
    const maxCapacity = section.max_capacity ?? 30;
    const effectiveMax = effectiveSectionCapacity(programKey, maxCapacity, config);
    if (enrolledCount >= effectiveMax) return section.id;
  }

  return null;
}

/** Enroll student in best-matched section (used by admissions activation + intelligence). */
export async function enrollStudentInBestSection(
  supabase: AuthClient,
  input: {
    studentId: string;
    schoolId: string;
    schoolYearId: string;
    program?: string | null;
    wilson?: WilsonPlacementInput;
  }
): Promise<{ courseSectionId: string | null; enrollmentStatus?: string; reason?: string }> {
  const { sectionId, reason } = await findBestSectionForStudent(supabase, {
    studentId: input.studentId,
    schoolId: input.schoolId,
    program: input.program,
    wilson: input.wilson,
    academySubject: "structured_literacy",
  });

  let targetSectionId = sectionId;
  let enrollmentStatus: "enrolled" | "waitlisted" = "enrolled";

  if (!targetSectionId) {
    targetSectionId = await findWaitlistSection(supabase, {
      schoolId: input.schoolId,
      program: input.program,
      academySubject: "structured_literacy",
    });
    if (!targetSectionId) return { courseSectionId: null, reason };
    enrollmentStatus = "waitlisted";
  }

  const { data: existing } = await supabase
    .from("student_enrollments")
    .select("id, enrollment_status")
    .eq("student_id", input.studentId)
    .eq("course_section_id", targetSectionId)
    .maybeSingle();

  if (existing) {
    return { courseSectionId: targetSectionId, enrollmentStatus: existing.enrollment_status };
  }

  const { error } = await supabase.from("student_enrollments").insert({
    student_id: input.studentId,
    course_section_id: targetSectionId,
    school_year_id: input.schoolYearId,
    enrollment_status: enrollmentStatus,
    enrolled_at: new Date().toISOString(),
  });

  if (error) return { courseSectionId: null, reason: error.message };

  const { fireOperationalLoopTransition } = await import("@/lib/platform/operational-loop");
  await fireOperationalLoopTransition(supabase, {
    studentId: input.studentId,
    schoolId: input.schoolId,
    transitionKey: "scheduling_to_instruction",
    relatedEntityType: "course_sections",
    relatedEntityId: targetSectionId,
    facts: { enrollmentStatus, courseSectionId: targetSectionId },
  });

  return {
    courseSectionId: targetSectionId,
    enrollmentStatus,
    reason: enrollmentStatus === "waitlisted" ? "Placed on waitlist — section at capacity" : undefined,
  };
}
