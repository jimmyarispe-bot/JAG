/**
 * Deterministic demo SoR catalogs for Canvas, PowerSchool, and Google Classroom.
 */

import type {
  EducationObjectType,
  EducationProvider,
  EducationRawEntity,
} from "@/lib/platform/integrations/connectors/education/entities";

function entity(
  provider: EducationProvider,
  objectType: EducationObjectType,
  id: string,
  organizationId: string,
  version: number,
  payload: Record<string, unknown>,
  updatedAt: string
): EducationRawEntity {
  return {
    id,
    objectType,
    provider,
    organizationId,
    updatedAt,
    version,
    payload: { ...payload, name: payload.name ?? payload.title ?? payload.displayName ?? id },
  };
}

const NOW = "2026-07-13T16:00:00.000Z";
const EARLIER = "2026-07-12T14:00:00.000Z";

export function buildEducationCatalog(
  provider: EducationProvider,
  organizationId = "org-education-demo"
): EducationRawEntity[] {
  const p =
    provider === "canvas" ? "cv" : provider === "powerschool" ? "ps" : "gc";
  return [
    entity(provider, "teacher", `${p}-tch-1`, organizationId, 1, {
      name: "Ms. Rivera",
      email: "rivera@example.edu",
      department: "Math",
      courseLoad: 3,
    }, EARLIER),
    entity(provider, "teacher", `${p}-tch-2`, organizationId, 1, {
      name: "Mr. Chen",
      email: "chen@example.edu",
      department: "History",
      courseLoad: 2,
    }, EARLIER),
    entity(provider, "student", `${p}-stu-1`, organizationId, 1, {
      name: "Sam Student",
      gradeLevel: 10,
      status: "active",
      email: "sam@example.edu",
    }, EARLIER),
    entity(provider, "student", `${p}-stu-2`, organizationId, 1, {
      name: "Taylor Learner",
      gradeLevel: 11,
      status: "active",
      email: "taylor@example.edu",
    }, EARLIER),
    entity(provider, "student", `${p}-stu-3`, organizationId, 1, {
      name: "Jordan AtRisk",
      gradeLevel: 10,
      status: "active",
      email: "jordan@example.edu",
    }, EARLIER),
    entity(provider, "course", `${p}-course-1`, organizationId, 1, {
      name: "Algebra II",
      teacherId: `${p}-tch-1`,
      teacher: "Ms. Rivera",
      period: 3,
      section: "A",
    }, EARLIER),
    entity(provider, "course", `${p}-course-2`, organizationId, 1, {
      name: "US History",
      teacherId: `${p}-tch-2`,
      teacher: "Mr. Chen",
      period: 5,
      section: "B",
    }, EARLIER),
    entity(provider, "assignment", `${p}-asg-1`, organizationId, 1, {
      name: "Quadratic review",
      courseId: `${p}-course-1`,
      teacherId: `${p}-tch-1`,
      dueAt: "2026-07-15T23:59:00.000Z",
      points: 100,
    }, NOW),
    entity(provider, "assignment", `${p}-asg-2`, organizationId, 1, {
      name: "Chapter 4 essay",
      courseId: `${p}-course-2`,
      teacherId: `${p}-tch-2`,
      dueAt: "2026-07-16T23:59:00.000Z",
      points: 50,
    }, EARLIER),
    entity(provider, "grade", `${p}-grd-1`, organizationId, 1, {
      name: "Quiz 4",
      studentId: `${p}-stu-1`,
      courseId: `${p}-course-1`,
      assignmentId: `${p}-asg-1`,
      score: 92,
      maxScore: 100,
    }, NOW),
    entity(provider, "grade", `${p}-grd-2`, organizationId, 1, {
      name: "Essay draft",
      studentId: `${p}-stu-2`,
      courseId: `${p}-course-2`,
      assignmentId: `${p}-asg-2`,
      score: 44,
      maxScore: 50,
    }, NOW),
    entity(provider, "grade", `${p}-grd-3`, organizationId, 1, {
      name: "Quiz 4",
      studentId: `${p}-stu-3`,
      courseId: `${p}-course-1`,
      assignmentId: `${p}-asg-1`,
      score: 58,
      maxScore: 100,
    }, NOW),
    entity(provider, "attendance", `${p}-att-1`, organizationId, 1, {
      name: "Attendance 2026-07-13",
      studentId: `${p}-stu-1`,
      courseId: `${p}-course-1`,
      status: "present",
      on: "2026-07-13",
    }, NOW),
    entity(provider, "attendance", `${p}-att-2`, organizationId, 1, {
      name: "Attendance 2026-07-13",
      studentId: `${p}-stu-2`,
      courseId: `${p}-course-2`,
      status: "present",
      on: "2026-07-13",
    }, NOW),
    entity(provider, "attendance", `${p}-att-3`, organizationId, 1, {
      name: "Attendance 2026-07-13",
      studentId: `${p}-stu-3`,
      courseId: `${p}-course-1`,
      status: "absent",
      on: "2026-07-13",
    }, NOW),
    entity(provider, "attendance", `${p}-att-4`, organizationId, 1, {
      name: "Attendance 2026-07-12",
      studentId: `${p}-stu-3`,
      courseId: `${p}-course-1`,
      status: "absent",
      on: "2026-07-12",
    }, EARLIER),
    entity(provider, "schedule", `${p}-sch-1`, organizationId, 1, {
      name: "Algebra II period 3",
      courseId: `${p}-course-1`,
      teacherId: `${p}-tch-1`,
      dayOfWeek: "Monday",
      startTime: "10:00",
      endTime: "10:50",
      period: 3,
    }, EARLIER),
    entity(provider, "schedule", `${p}-sch-2`, organizationId, 1, {
      name: "US History period 5",
      courseId: `${p}-course-2`,
      teacherId: `${p}-tch-2`,
      dayOfWeek: "Tuesday",
      startTime: "13:00",
      endTime: "13:50",
      period: 5,
    }, EARLIER),
  ];
}

export function educationCatalogForProvider(
  provider: EducationProvider,
  organizationId?: string
): EducationRawEntity[] {
  return buildEducationCatalog(provider, organizationId);
}

export function objectTypesForEducationProvider(
  _provider: EducationProvider
): EducationObjectType[] {
  return ["student", "teacher", "course", "assignment", "grade", "attendance", "schedule"];
}
