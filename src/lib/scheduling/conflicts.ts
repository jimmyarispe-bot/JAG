import type { createAuthClient } from "@/lib/supabase/server-auth";
import { createMissionControlItem } from "@/lib/platform/automation/mission-control";
import { validateSectionAgainstAcademyWay, loadAcademyWayConfig, type AcademySubject, effectiveSectionCapacity, canOpenNewSection } from "@/lib/scheduling/academy-way";
import { findBestSectionForStudent } from "@/lib/scheduling/placement";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface ScheduleConflict {
  conflictType: string;
  severity: string;
  title: string;
  description: string;
  recommendation?: string;
  entityType: string;
  entityId: string;
}

export async function detectSchedulingConflicts(
  supabase: AuthClient,
  schoolId: string
): Promise<ScheduleConflict[]> {
  const config = await loadAcademyWayConfig(supabase, schoolId);
  const conflicts: ScheduleConflict[] = [];

  const { data: sessions } = await supabase
    .from("instructional_sessions")
    .select(
      "id, scheduled_start, scheduled_end, instructor_employee_id, room_id, course_section_id, course_sections(max_capacity, min_capacity, delivery_mode, courses(school_id, academy_subject))"
    )
    .gte("scheduled_start", new Date().toISOString())
    .eq("session_status", "scheduled")
    .limit(200);

  const schoolSessions = (sessions ?? []).filter((s) => {
    const cs = Array.isArray(s.course_sections) ? s.course_sections[0] : s.course_sections;
    const c = cs?.courses;
    const course = Array.isArray(c) ? c[0] : c;
    return (course as { school_id?: string })?.school_id === schoolId;
  });

  // Teacher double-booking
  const byTeacher = new Map<string, typeof schoolSessions>();
  for (const s of schoolSessions) {
    const key = s.instructor_employee_id;
    if (!byTeacher.has(key)) byTeacher.set(key, []);
    byTeacher.get(key)!.push(s);
  }
  for (const [empId, list] of byTeacher) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        if (timesOverlap(list[i], list[j])) {
          conflicts.push({
            conflictType: "teacher",
            severity: "critical",
            title: "Teacher scheduling conflict",
            description: "Instructor assigned to overlapping sessions",
            recommendation: "Reschedule one session or assign a substitute",
            entityType: "employee",
            entityId: empId,
          });
        }
      }
    }
  }

  // Room double-booking
  const byRoom = new Map<string, typeof schoolSessions>();
  for (const s of schoolSessions.filter((x) => x.room_id)) {
    const key = s.room_id as string;
    if (!byRoom.has(key)) byRoom.set(key, []);
    byRoom.get(key)!.push(s);
  }
  for (const [roomId, list] of byRoom) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        if (timesOverlap(list[i], list[j])) {
          conflicts.push({
            conflictType: "room",
            severity: "critical",
            title: "Room scheduling conflict",
            description: "Room double-booked",
            recommendation: "Assign a different room or reschedule",
            entityType: "schedule_rooms",
            entityId: roomId,
          });
        }
      }
    }
  }

  // Student double-booking across sessions
  const { data: enrollments } = await supabase
    .from("student_enrollments")
    .select("student_id, course_section_id")
    .eq("enrollment_status", "enrolled");

  const studentSessions = new Map<string, typeof schoolSessions>();
  for (const enr of enrollments ?? []) {
    const sectionSessions = schoolSessions.filter((s) => s.course_section_id === enr.course_section_id);
    if (!studentSessions.has(enr.student_id)) studentSessions.set(enr.student_id, []);
    studentSessions.get(enr.student_id)!.push(...sectionSessions);
  }

  for (const [studentId, list] of studentSessions) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        if (timesOverlap(list[i], list[j])) {
          conflicts.push({
            conflictType: "student",
            severity: "critical",
            title: "Student scheduling conflict",
            description: "Student enrolled in overlapping sessions",
            recommendation: "Adjust enrollment or reschedule a session",
            entityType: "students",
            entityId: studentId,
          });
        }
      }
    }
  }

  // Teacher availability mismatches
  for (const s of schoolSessions) {
    if (!s.instructor_employee_id) continue;
    const sessionDay = new Date(s.scheduled_start).getDay();
    const sessionStart = new Date(s.scheduled_start).toTimeString().slice(0, 8);
    const sessionEnd = new Date(s.scheduled_end).toTimeString().slice(0, 8);

    const { data: availability } = await supabase
      .from("employee_availability")
      .select("start_time, end_time")
      .eq("employee_id", s.instructor_employee_id)
      .eq("day_of_week", sessionDay)
      .eq("is_available", true);

    if ((availability ?? []).length === 0) continue;

    const inWindow = (availability ?? []).some(
      (a) => String(a.start_time) <= sessionStart && String(a.end_time) >= sessionEnd
    );

    if (!inWindow) {
      conflicts.push({
        conflictType: "teacher",
        severity: "warning",
        title: "Teacher outside submitted availability",
        description: "Session scheduled outside teacher availability window",
        recommendation: "Reschedule session or update availability submission",
        entityType: "employee",
        entityId: s.instructor_employee_id,
      });
    }
  }

  // Academy Way capacity
  const { data: sections } = await supabase
    .from("course_sections")
    .select("id, min_capacity, max_capacity, delivery_mode, courses(academy_subject, school_id)")
    .limit(100);

  for (const section of sections ?? []) {
    const course = Array.isArray(section.courses) ? section.courses[0] : section.courses;
    if ((course as { school_id?: string })?.school_id !== schoolId) continue;

    const { count } = await supabase
      .from("student_enrollments")
      .select("id", { count: "exact", head: true })
      .eq("course_section_id", section.id)
      .eq("enrollment_status", "enrolled");

    const validation = validateSectionAgainstAcademyWay({
      academySubject: (course as { academy_subject?: AcademySubject })?.academy_subject,
      deliveryMode: section.delivery_mode,
      minCapacity: section.min_capacity,
      maxCapacity: section.max_capacity,
      enrolledCount: count ?? 0,
    });

    if (!validation.valid) {
      conflicts.push({
        conflictType: "academy_way",
        severity: "warning",
        title: "Academy Way rule violation",
        description: validation.errors.join("; "),
        recommendation: "Adjust enrollment or section configuration",
        entityType: "course_sections",
        entityId: section.id,
      });
    }

    const enrolled = count ?? 0;
    const max = section.max_capacity ?? 30;
    const subject = (course as { academy_subject?: string })?.academy_subject;
    if (subject === "structured_literacy" && enrolled > effectiveSectionCapacity("structured_literacy", max, config)) {
      conflicts.push({
        conflictType: "capacity",
        severity: "critical",
        title: "Structured Literacy section over capacity",
        description: `${enrolled} enrolled exceeds JAG Virtual max (2–3 students)`,
        recommendation: "Move students or open a new section when existing reaches capacity",
        entityType: "course_sections",
        entityId: section.id,
      });
    }

    if (enrolled >= max && !canOpenNewSection(null, enrolled, max, config)) {
      conflicts.push({
        conflictType: "capacity",
        severity: "info",
        title: `Section ${section.id} at capacity`,
        description: "Section full — eligible to open a new section per JAG rules",
        recommendation: "Create new section for incoming placements",
        entityType: "course_sections",
        entityId: section.id,
      });
    }
  }

  // Students without section placement
  const { data: unplacedStudents } = await supabase
    .from("students")
    .select("id, first_name, last_name, program")
    .eq("school_id", schoolId)
    .eq("status", "active")
    .eq("enrollment_status", "enrolled");

  for (const student of unplacedStudents ?? []) {
    const { count: enrCount } = await supabase
      .from("student_enrollments")
      .select("id", { count: "exact", head: true })
      .eq("student_id", student.id)
      .eq("enrollment_status", "enrolled");

    if ((enrCount ?? 0) > 0) continue;

    const placement = await findBestSectionForStudent(supabase, {
      studentId: student.id,
      schoolId,
      program: student.program,
      academySubject: "structured_literacy",
    });

    if (!placement.sectionId) {
      conflicts.push({
        conflictType: "student",
        severity: "warning",
        title: `Placement needed — ${student.first_name} ${student.last_name}`,
        description: placement.reason ?? "No section match found",
        recommendation: "Run placement intelligence or create a new section",
        entityType: "students",
        entityId: student.id,
      });
    }
  }

  // Persist unresolved conflicts (skip duplicates from recent scans)
  for (const c of conflicts) {
    const { data: existing } = await supabase
      .from("schedule_conflicts")
      .select("id")
      .eq("school_id", schoolId)
      .eq("entity_type", c.entityType)
      .eq("entity_id", c.entityId)
      .eq("conflict_type", c.conflictType)
      .eq("is_resolved", false)
      .maybeSingle();

    if (existing) continue;

    await supabase.from("schedule_conflicts").insert({
      school_id: schoolId,
      conflict_type: c.conflictType,
      severity: c.severity,
      entity_type: c.entityType,
      entity_id: c.entityId,
      title: c.title,
      description: c.description,
      recommendation: c.recommendation ?? null,
    });
  }

  return conflicts;
}

function timesOverlap(
  a: { scheduled_start: string; scheduled_end: string },
  b: { scheduled_start: string; scheduled_end: string }
): boolean {
  const aStart = new Date(a.scheduled_start).getTime();
  const aEnd = new Date(a.scheduled_end).getTime();
  const bStart = new Date(b.scheduled_start).getTime();
  const bEnd = new Date(b.scheduled_end).getTime();
  return aStart < bEnd && bStart < aEnd;
}

export async function syncConflictsToMissionControl(supabase: AuthClient, schoolId: string) {
  const { data: open } = await supabase
    .from("schedule_conflicts")
    .select("*")
    .eq("school_id", schoolId)
    .eq("is_resolved", false)
    .eq("severity", "critical")
    .limit(10);

  for (const c of open ?? []) {
    await createMissionControlItem(supabase, {
      schoolId,
      module: "scheduling",
      itemType: "scheduling_alert",
      title: c.title,
      body: c.description ?? "",
      entityType: c.entity_type,
      entityId: c.entity_id,
      href: "/dashboard/scheduling?view=intelligence",
      severity: "high",
    });
  }
}
