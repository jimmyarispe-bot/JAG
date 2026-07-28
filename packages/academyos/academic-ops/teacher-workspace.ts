import { listSupportPlans } from "../sis/store";
import { getStudent } from "../sis/store";
import { createClassroomNotesService } from "./notes";
import { createSessionsService } from "./sessions";
import {
  getClass,
  getTeacher,
  listClasses,
  listEnrollments,
  listNotes,
  listSessions,
} from "./store";

export type TeacherWorkspaceView = {
  readonly teacherId: string;
  readonly teacherName: string;
  readonly todaySchedule: readonly {
    readonly sessionId: string;
    readonly classId: string;
    readonly className: string;
    readonly startsAt: string;
    readonly endsAt: string;
    readonly status: string;
    readonly studentCount: number;
  }[];
  readonly upcomingSessions: readonly {
    readonly sessionId: string;
    readonly classId: string;
    readonly className: string;
    readonly date: string;
    readonly startsAt: string;
    readonly status: string;
  }[];
  readonly roster: readonly {
    readonly studentId: string;
    readonly preferredName: string;
    readonly gradeLevel: string;
    readonly indicators: {
      readonly iep: boolean;
      readonly plan504: boolean;
      readonly therapy: boolean;
      readonly medicalAlert: boolean;
    };
  }[];
  readonly recentNotes: ReturnType<typeof listNotes>;
};

export function createTeacherWorkspaceService() {
  const sessions = createSessionsService();
  const notes = createClassroomNotesService();

  return {
    get(input: {
      organizationId: string;
      teacherId: string;
      asOf?: Date;
      includeMedicalAlerts?: boolean;
    }): TeacherWorkspaceView | { error: string } {
      const teacher = getTeacher(input.organizationId, input.teacherId);
      if (!teacher) return { error: "Teacher not found." };

      const today = (input.asOf ?? new Date()).toISOString().slice(0, 10);
      const teacherSessions = listSessions(input.organizationId, {
        teacherId: input.teacherId,
      });
      const todaySessions = teacherSessions.filter(
        (s) => s.date === today && s.status !== "Cancelled"
      );
      const upcoming = teacherSessions
        .filter((s) => s.date > today && s.status !== "Cancelled")
        .slice(0, 20);

      const classIds = new Set(
        listClasses(input.organizationId)
          .filter((c) => c.teacherId === input.teacherId)
          .map((c) => c.id)
      );
      const studentIds = new Set<string>();
      for (const classId of classIds) {
        for (const en of listEnrollments(input.organizationId, { classId })) {
          if (en.status === "Active") studentIds.add(en.studentId);
        }
      }

      const includeMedical = input.includeMedicalAlerts !== false;
      const roster = [...studentIds].map((studentId) => {
        const student = getStudent(input.organizationId, studentId);
        const plans = listSupportPlans(input.organizationId, studentId);
        const active = plans.filter(
          (p) => p.status === "Active" || p.status === "Review Due"
        );
        return {
          studentId,
          preferredName: student?.identity.preferredName ?? studentId,
          gradeLevel: student?.gradeLevel ?? "",
          indicators: {
            iep: active.some((p) => p.kind === "IEP"),
            plan504: active.some((p) => p.kind === "504 Plan"),
            therapy: active.some((p) => p.kind === "Therapy Services"),
            medicalAlert: includeMedical
              ? Boolean(student?.medical.medicalAlerts?.trim())
              : false,
          },
        };
      });

      return {
        teacherId: teacher.id,
        teacherName: teacher.displayName,
        todaySchedule: Object.freeze(
          todaySessions.map((s) => ({
            sessionId: s.id,
            classId: s.classId,
            className: getClass(input.organizationId, s.classId)?.name ?? s.classId,
            startsAt: s.startsAt,
            endsAt: s.endsAt,
            status: s.status,
            studentCount: s.studentIds.length,
          }))
        ),
        upcomingSessions: Object.freeze(
          upcoming.map((s) => ({
            sessionId: s.id,
            classId: s.classId,
            className: getClass(input.organizationId, s.classId)?.name ?? s.classId,
            date: s.date,
            startsAt: s.startsAt,
            status: s.status,
          }))
        ),
        roster: Object.freeze(roster),
        recentNotes: listNotes(input.organizationId).filter((n) =>
          classIds.has(n.classId)
        ),
      };
    },

    recordAttendance: sessions.recordAttendance.bind(sessions),
    addNote: notes.create.bind(notes),
    sessions,
    notes,
  };
}
