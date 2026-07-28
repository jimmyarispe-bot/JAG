/**
 * AcademyOS domain services — education behavior lives in the pack, not Platform Core.
 */

import { getEntity, listEntities, upsertEntity } from "../store";
import { projectAcademyEntityToTwin, linkAcademyEnrollment } from "../twin/project";
import { baseEntity } from "./factory";
import type {
  AcademyAdmission,
  AcademyAttendance,
  AcademyClassroom,
  AcademyCourse,
  AcademyEnrollment,
  AcademyGrade,
  AcademyGuardian,
  AcademyIep,
  AcademyInvoice,
  AcademyScholarship,
  AcademySchool,
  AcademySession,
  AcademyStaff,
  AcademyStudent,
  AcademyTranscript,
} from "./types";

function requireNonEmpty(value: string, label: string): string | { error: string } {
  const v = value.trim();
  if (!v) return { error: `${label} is required.` };
  return v;
}

export function createSchoolsService() {
  return {
    create(input: {
      organizationId: string;
      name: string;
      code: string;
      createdBy: string;
    }): AcademySchool | { error: string } {
      const name = requireNonEmpty(input.name, "School name");
      if (typeof name !== "string") return name;
      const code = requireNonEmpty(input.code, "School code");
      if (typeof code !== "string") return code;
      const base = baseEntity(input.organizationId, input.createdBy);
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "School",
        twinEntityType: "Organization",
        id: base.id,
        label: name,
        kind: "school",
        actor: input.createdBy,
        metadata: { code },
      });
      return upsertEntity("schools", { ...base, name, code, twinEntityId: twinId });
    },
    list: (organizationId: string) =>
      listEntities<AcademySchool>("schools", organizationId),
    get: (organizationId: string, id: string) =>
      getEntity<AcademySchool>("schools", organizationId, id),
  };
}

export function createStudentsService() {
  return {
    create(input: {
      organizationId: string;
      firstName: string;
      lastName: string;
      schoolId?: string | null;
      gradeLevel?: string | null;
      createdBy: string;
    }): AcademyStudent | { error: string } {
      const firstName = requireNonEmpty(input.firstName, "First name");
      if (typeof firstName !== "string") return firstName;
      const lastName = requireNonEmpty(input.lastName, "Last name");
      if (typeof lastName !== "string") return lastName;
      const base = baseEntity(input.organizationId, input.createdBy);
      const label = `${firstName} ${lastName}`;
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Student",
        twinEntityType: "Person",
        id: base.id,
        label,
        kind: "student",
        actor: input.createdBy,
        metadata: {
          gradeLevel: input.gradeLevel ?? "",
          schoolId: input.schoolId ?? "",
        },
      });
      return upsertEntity("students", {
        ...base,
        firstName,
        lastName,
        schoolId: input.schoolId ?? null,
        gradeLevel: input.gradeLevel ?? null,
        status: "Active",
        twinEntityId: twinId,
      });
    },
    list: (organizationId: string) =>
      listEntities<AcademyStudent>("students", organizationId),
    get: (organizationId: string, id: string) =>
      getEntity<AcademyStudent>("students", organizationId, id),
  };
}

export function createGuardiansService() {
  return {
    create(input: {
      organizationId: string;
      firstName: string;
      lastName: string;
      studentIds?: readonly string[];
      createdBy: string;
    }): AcademyGuardian | { error: string } {
      const firstName = requireNonEmpty(input.firstName, "First name");
      if (typeof firstName !== "string") return firstName;
      const lastName = requireNonEmpty(input.lastName, "Last name");
      if (typeof lastName !== "string") return lastName;
      const base = baseEntity(input.organizationId, input.createdBy);
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Parent/Guardian",
        twinEntityType: "Person",
        id: base.id,
        label: `${firstName} ${lastName}`,
        kind: "guardian",
        actor: input.createdBy,
      });
      return upsertEntity("guardians", {
        ...base,
        firstName,
        lastName,
        studentIds: Object.freeze([...(input.studentIds ?? [])]),
        twinEntityId: twinId,
      });
    },
    list: (organizationId: string) =>
      listEntities<AcademyGuardian>("guardians", organizationId),
  };
}

export function createStaffService() {
  return {
    create(input: {
      organizationId: string;
      firstName: string;
      lastName: string;
      role?: AcademyStaff["role"];
      schoolId?: string | null;
      createdBy: string;
    }): AcademyStaff | { error: string } {
      const firstName = requireNonEmpty(input.firstName, "First name");
      if (typeof firstName !== "string") return firstName;
      const lastName = requireNonEmpty(input.lastName, "Last name");
      if (typeof lastName !== "string") return lastName;
      const role = input.role ?? "Teacher";
      const base = baseEntity(input.organizationId, input.createdBy);
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Teacher",
        twinEntityType: "Person",
        id: base.id,
        label: `${firstName} ${lastName}`,
        kind: role === "Teacher" ? "teacher" : role.toLowerCase(),
        actor: input.createdBy,
      });
      return upsertEntity("staff", {
        ...base,
        firstName,
        lastName,
        role,
        schoolId: input.schoolId ?? null,
        twinEntityId: twinId,
      });
    },
    list: (organizationId: string) =>
      listEntities<AcademyStaff>("staff", organizationId),
  };
}

export function createClassroomsService() {
  return {
    create(input: {
      organizationId: string;
      name: string;
      schoolId: string;
      capacity?: number;
      createdBy: string;
    }): AcademyClassroom | { error: string } {
      const name = requireNonEmpty(input.name, "Classroom name");
      if (typeof name !== "string") return name;
      if (!input.schoolId) return { error: "schoolId is required." };
      const base = baseEntity(input.organizationId, input.createdBy);
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Classroom",
        twinEntityType: "Location",
        id: base.id,
        label: name,
        kind: "classroom",
        actor: input.createdBy,
        metadata: { schoolId: input.schoolId },
      });
      return upsertEntity("classrooms", {
        ...base,
        name,
        schoolId: input.schoolId,
        capacity: input.capacity ?? 30,
        twinEntityId: twinId,
      });
    },
    list: (organizationId: string) =>
      listEntities<AcademyClassroom>("classrooms", organizationId),
  };
}

export function createCoursesService() {
  return {
    create(input: {
      organizationId: string;
      title: string;
      code: string;
      schoolId?: string | null;
      createdBy: string;
    }): AcademyCourse | { error: string } {
      const title = requireNonEmpty(input.title, "Course title");
      if (typeof title !== "string") return title;
      const code = requireNonEmpty(input.code, "Course code");
      if (typeof code !== "string") return code;
      const base = baseEntity(input.organizationId, input.createdBy);
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Course",
        twinEntityType: "Product / Service",
        id: base.id,
        label: title,
        kind: "course",
        actor: input.createdBy,
        metadata: { code },
      });
      return upsertEntity("courses", {
        ...base,
        title,
        code,
        schoolId: input.schoolId ?? null,
        twinEntityId: twinId,
      });
    },
    list: (organizationId: string) =>
      listEntities<AcademyCourse>("courses", organizationId),
    get: (organizationId: string, id: string) =>
      getEntity<AcademyCourse>("courses", organizationId, id),
  };
}

export function createEnrollmentService() {
  const students = createStudentsService();
  const courses = createCoursesService();
  return {
    create(input: {
      organizationId: string;
      studentId: string;
      courseId: string;
      schoolYear: string;
      createdBy: string;
    }): AcademyEnrollment | { error: string } {
      const student = students.get(input.organizationId, input.studentId);
      const course = courses.get(input.organizationId, input.courseId);
      if (!student) return { error: "Student not found." };
      if (!course) return { error: "Course not found." };
      const base = baseEntity(input.organizationId, input.createdBy);
      if (student.twinEntityId && course.twinEntityId) {
        linkAcademyEnrollment({
          organizationId: input.organizationId,
          studentTwinId: student.twinEntityId,
          courseTwinId: course.twinEntityId,
          actor: input.createdBy,
        });
      }
      return upsertEntity("enrollments", {
        ...base,
        studentId: input.studentId,
        courseId: input.courseId,
        status: "Enrolled",
        schoolYear: input.schoolYear.trim() || "2026-2027",
        twinEntityId: null,
      });
    },
    list: (organizationId: string) =>
      listEntities<AcademyEnrollment>("enrollments", organizationId),
  };
}

export function createAdmissionsService() {
  return {
    create(input: {
      organizationId: string;
      applicantName: string;
      schoolId?: string | null;
      createdBy: string;
    }): AcademyAdmission | { error: string } {
      const applicantName = requireNonEmpty(input.applicantName, "Applicant name");
      if (typeof applicantName !== "string") return applicantName;
      const base = baseEntity(input.organizationId, input.createdBy);
      return upsertEntity("admissions", {
        ...base,
        applicantName,
        status: "Submitted",
        schoolId: input.schoolId ?? null,
        twinEntityId: null,
      });
    },
    list: (organizationId: string) =>
      listEntities<AcademyAdmission>("admissions", organizationId),
  };
}

export function createSchedulingService() {
  return {
    createSession(input: {
      organizationId: string;
      courseId: string;
      classroomId?: string | null;
      title: string;
      startsAt: string;
      endsAt: string;
      createdBy: string;
    }): AcademySession | { error: string } {
      const title = requireNonEmpty(input.title, "Session title");
      if (typeof title !== "string") return title;
      const base = baseEntity(input.organizationId, input.createdBy);
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Session",
        twinEntityType: "Event",
        id: base.id,
        label: title,
        kind: "session",
        actor: input.createdBy,
        metadata: { courseId: input.courseId },
      });
      return upsertEntity("sessions", {
        ...base,
        courseId: input.courseId,
        classroomId: input.classroomId ?? null,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        title,
        twinEntityId: twinId,
      });
    },
    listSessions: (organizationId: string) =>
      listEntities<AcademySession>("sessions", organizationId),
  };
}

export function createAttendanceService() {
  return {
    record(input: {
      organizationId: string;
      studentId: string;
      sessionId: string;
      status: AcademyAttendance["status"];
      createdBy: string;
    }): AcademyAttendance | { error: string } {
      if (!input.studentId || !input.sessionId) {
        return { error: "studentId and sessionId are required." };
      }
      const base = baseEntity(input.organizationId, input.createdBy);
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Attendance",
        twinEntityType: "Event",
        id: base.id,
        label: `Attendance ${input.status}`,
        kind: "attendance",
        actor: input.createdBy,
        metadata: {
          studentId: input.studentId,
          sessionId: input.sessionId,
          status: input.status,
        },
      });
      return upsertEntity("attendance", {
        ...base,
        studentId: input.studentId,
        sessionId: input.sessionId,
        status: input.status,
        twinEntityId: twinId,
      });
    },
    list: (organizationId: string) =>
      listEntities<AcademyAttendance>("attendance", organizationId),
  };
}

export function createGradingService() {
  return {
    record(input: {
      organizationId: string;
      studentId: string;
      courseId: string;
      mark: string;
      term: string;
      createdBy: string;
    }): AcademyGrade | { error: string } {
      const mark = requireNonEmpty(input.mark, "Mark");
      if (typeof mark !== "string") return mark;
      const base = baseEntity(input.organizationId, input.createdBy);
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Grade",
        twinEntityType: "Document",
        id: base.id,
        label: `Grade ${mark}`,
        kind: "grade",
        actor: input.createdBy,
        metadata: {
          studentId: input.studentId,
          courseId: input.courseId,
          term: input.term,
        },
      });
      return upsertEntity("grades", {
        ...base,
        studentId: input.studentId,
        courseId: input.courseId,
        mark,
        term: input.term,
        twinEntityId: twinId,
      });
    },
    list: (organizationId: string) =>
      listEntities<AcademyGrade>("grades", organizationId),
  };
}

export function createTranscriptsService() {
  return {
    issue(input: {
      organizationId: string;
      studentId: string;
      title: string;
      createdBy: string;
    }): AcademyTranscript | { error: string } {
      const title = requireNonEmpty(input.title, "Title");
      if (typeof title !== "string") return title;
      const base = baseEntity(input.organizationId, input.createdBy);
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Grade",
        twinEntityType: "Document",
        id: base.id,
        label: title,
        kind: "transcript",
        actor: input.createdBy,
        metadata: { studentId: input.studentId },
      });
      return upsertEntity("transcripts", {
        ...base,
        studentId: input.studentId,
        title,
        issuedAt: base.createdAt,
        twinEntityId: twinId,
      });
    },
    list: (organizationId: string) =>
      listEntities<AcademyTranscript>("transcripts", organizationId),
  };
}

export function createIepService() {
  return {
    create(input: {
      organizationId: string;
      studentId: string;
      title: string;
      createdBy: string;
    }): AcademyIep | { error: string } {
      const title = requireNonEmpty(input.title, "IEP title");
      if (typeof title !== "string") return title;
      const base = baseEntity(input.organizationId, input.createdBy);
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "IEP",
        twinEntityType: "Document",
        id: base.id,
        label: title,
        kind: "iep",
        actor: input.createdBy,
        metadata: { studentId: input.studentId },
      });
      return upsertEntity("ieps", {
        ...base,
        studentId: input.studentId,
        title,
        status: "Active",
        twinEntityId: twinId,
      });
    },
    list: (organizationId: string) =>
      listEntities<AcademyIep>("ieps", organizationId),
  };
}

export function createScholarshipsService() {
  return {
    create(input: {
      organizationId: string;
      name: string;
      amount: number;
      studentId?: string | null;
      createdBy: string;
    }): AcademyScholarship | { error: string } {
      const name = requireNonEmpty(input.name, "Scholarship name");
      if (typeof name !== "string") return name;
      if (!(input.amount >= 0)) return { error: "Amount must be >= 0." };
      const base = baseEntity(input.organizationId, input.createdBy);
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Scholarship",
        twinEntityType: "Asset",
        id: base.id,
        label: name,
        kind: "scholarship",
        actor: input.createdBy,
        metadata: { amount: String(input.amount) },
      });
      return upsertEntity("scholarships", {
        ...base,
        name,
        amount: input.amount,
        studentId: input.studentId ?? null,
        status: input.studentId ? "Awarded" : "Open",
        twinEntityId: twinId,
      });
    },
    list: (organizationId: string) =>
      listEntities<AcademyScholarship>("scholarships", organizationId),
  };
}

export function createBillingService() {
  return {
    createInvoice(input: {
      organizationId: string;
      studentId: string;
      amount: number;
      dueDate?: string | null;
      createdBy: string;
    }): AcademyInvoice | { error: string } {
      if (!(input.amount >= 0)) return { error: "Amount must be >= 0." };
      const base = baseEntity(input.organizationId, input.createdBy);
      return upsertEntity("invoices", {
        ...base,
        studentId: input.studentId,
        amount: input.amount,
        status: "Open",
        dueDate: input.dueDate ?? null,
        twinEntityId: null,
      });
    },
    list: (organizationId: string) =>
      listEntities<AcademyInvoice>("invoices", organizationId),
  };
}

export function createReportingService() {
  return {
    snapshot(organizationId: string) {
      return {
        schools: listEntities("schools", organizationId).length,
        students: listEntities("students", organizationId).length,
        enrollments: listEntities("enrollments", organizationId).length,
        attendance: listEntities("attendance", organizationId).length,
        ieps: listEntities("ieps", organizationId).length,
        scholarships: listEntities("scholarships", organizationId).length,
        openInvoices: listEntities<AcademyInvoice>("invoices", organizationId).filter(
          (i) => i.status === "Open"
        ).length,
      };
    },
  };
}
