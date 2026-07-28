import type {
  AcademicCalendar,
  AoClass,
  AoTeacher,
  ClassroomNote,
  InstructionalSession,
  StudentClassEnrollment,
  WaitlistEntry,
} from "./types";

type AcademicOpsStore = {
  calendars: Map<string, AcademicCalendar>;
  teachers: Map<string, AoTeacher>;
  classes: Map<string, AoClass>;
  enrollments: Map<string, StudentClassEnrollment>;
  waitlist: Map<string, WaitlistEntry>;
  sessions: Map<string, InstructionalSession>;
  notes: Map<string, ClassroomNote>;
};

const g = globalThis as typeof globalThis & {
  __academyOsAcademicOpsStore?: AcademicOpsStore;
};

function empty(): AcademicOpsStore {
  return {
    calendars: new Map(),
    teachers: new Map(),
    classes: new Map(),
    enrollments: new Map(),
    waitlist: new Map(),
    sessions: new Map(),
    notes: new Map(),
  };
}

function store(): AcademicOpsStore {
  if (!g.__academyOsAcademicOpsStore) {
    g.__academyOsAcademicOpsStore = empty();
  }
  return g.__academyOsAcademicOpsStore;
}

export function resetAcademicOpsStoreForTests(): void {
  g.__academyOsAcademicOpsStore = empty();
}

function key(organizationId: string, id: string): string {
  return `${organizationId}::${id}`;
}

export function upsertCalendar(c: AcademicCalendar): AcademicCalendar {
  store().calendars.set(key(c.organizationId, c.id), c);
  return c;
}

export function getCalendar(
  organizationId: string,
  id: string
): AcademicCalendar | null {
  return store().calendars.get(key(organizationId, id)) ?? null;
}

export function listCalendars(
  organizationId: string,
  campusId?: string | null
): readonly AcademicCalendar[] {
  return Object.freeze(
    [...store().calendars.values()]
      .filter(
        (c) =>
          c.organizationId === organizationId &&
          (campusId == null || c.campusId === campusId || c.campusId == null)
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  );
}

export function upsertTeacher(t: AoTeacher): AoTeacher {
  store().teachers.set(key(t.organizationId, t.id), t);
  return t;
}

export function getTeacher(
  organizationId: string,
  id: string
): AoTeacher | null {
  return store().teachers.get(key(organizationId, id)) ?? null;
}

export function listTeachers(organizationId: string): readonly AoTeacher[] {
  return Object.freeze(
    [...store().teachers.values()]
      .filter((t) => t.organizationId === organizationId)
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
  );
}

export function upsertClass(c: AoClass): AoClass {
  store().classes.set(key(c.organizationId, c.id), c);
  return c;
}

export function getClass(organizationId: string, id: string): AoClass | null {
  return store().classes.get(key(organizationId, id)) ?? null;
}

export function listClasses(organizationId: string): readonly AoClass[] {
  return Object.freeze(
    [...store().classes.values()]
      .filter((c) => c.organizationId === organizationId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  );
}

export function upsertEnrollment(
  e: StudentClassEnrollment
): StudentClassEnrollment {
  store().enrollments.set(key(e.organizationId, e.id), e);
  return e;
}

export function listEnrollments(
  organizationId: string,
  opts?: { studentId?: string; classId?: string }
): readonly StudentClassEnrollment[] {
  return Object.freeze(
    [...store().enrollments.values()].filter(
      (e) =>
        e.organizationId === organizationId &&
        (opts?.studentId == null || e.studentId === opts.studentId) &&
        (opts?.classId == null || e.classId === opts.classId)
    )
  );
}

export function upsertWaitlist(w: WaitlistEntry): WaitlistEntry {
  store().waitlist.set(key(w.organizationId, w.id), w);
  return w;
}

export function listWaitlist(
  organizationId: string,
  classId?: string
): readonly WaitlistEntry[] {
  return Object.freeze(
    [...store().waitlist.values()]
      .filter(
        (w) =>
          w.organizationId === organizationId &&
          (classId == null || w.classId === classId)
      )
      .sort((a, b) => a.position - b.position)
  );
}

export function removeWaitlist(
  organizationId: string,
  id: string
): void {
  store().waitlist.delete(key(organizationId, id));
}

export function upsertSession(s: InstructionalSession): InstructionalSession {
  store().sessions.set(key(s.organizationId, s.id), s);
  return s;
}

export function getSession(
  organizationId: string,
  id: string
): InstructionalSession | null {
  return store().sessions.get(key(organizationId, id)) ?? null;
}

export function listSessions(
  organizationId: string,
  opts?: { classId?: string; teacherId?: string; date?: string }
): readonly InstructionalSession[] {
  return Object.freeze(
    [...store().sessions.values()]
      .filter(
        (s) =>
          s.organizationId === organizationId &&
          (opts?.classId == null || s.classId === opts.classId) &&
          (opts?.teacherId == null ||
            s.teacherId === opts.teacherId ||
            s.substituteTeacherId === opts.teacherId) &&
          (opts?.date == null || s.date === opts.date)
      )
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  );
}

export function upsertNote(n: ClassroomNote): ClassroomNote {
  store().notes.set(key(n.organizationId, n.id), n);
  return n;
}

export function listNotes(
  organizationId: string,
  opts?: { sessionId?: string; studentId?: string; classId?: string }
): readonly ClassroomNote[] {
  return Object.freeze(
    [...store().notes.values()]
      .filter(
        (n) =>
          n.organizationId === organizationId &&
          (opts?.sessionId == null || n.sessionId === opts.sessionId) &&
          (opts?.studentId == null || n.studentId === opts.studentId) &&
          (opts?.classId == null || n.classId === opts.classId)
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
}
