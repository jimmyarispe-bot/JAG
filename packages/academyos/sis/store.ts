import type {
  ClassAssignment,
  FamilyMember,
  SisAttendanceRecord,
  SisStudent,
  StudentAuditEntry,
  StudentTimelineEntry,
  SupportPlan,
} from "./types";

type SisStore = {
  students: Map<string, SisStudent>;
  families: Map<string, FamilyMember>;
  attendance: Map<string, SisAttendanceRecord>;
  classes: Map<string, ClassAssignment>;
  supportPlans: Map<string, SupportPlan>;
  timeline: StudentTimelineEntry[];
  audit: StudentAuditEntry[];
};

const g = globalThis as typeof globalThis & {
  __academyOsSisStore?: SisStore;
};

function store(): SisStore {
  if (!g.__academyOsSisStore) {
    g.__academyOsSisStore = {
      students: new Map(),
      families: new Map(),
      attendance: new Map(),
      classes: new Map(),
      supportPlans: new Map(),
      timeline: [],
      audit: [],
    };
  }
  return g.__academyOsSisStore;
}

export function resetSisStoreForTests(): void {
  g.__academyOsSisStore = {
    students: new Map(),
    families: new Map(),
    attendance: new Map(),
    classes: new Map(),
    supportPlans: new Map(),
    timeline: [],
    audit: [],
  };
}

function key(organizationId: string, id: string): string {
  return `${organizationId}::${id}`;
}

export function upsertStudent(s: SisStudent): SisStudent {
  store().students.set(key(s.organizationId, s.id), s);
  return s;
}

export function getStudent(
  organizationId: string,
  id: string
): SisStudent | null {
  return store().students.get(key(organizationId, id)) ?? null;
}

export function listStudents(organizationId: string): readonly SisStudent[] {
  return Object.freeze(
    [...store().students.values()]
      .filter((s) => s.organizationId === organizationId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  );
}

export function findStudentByApplicant(
  organizationId: string,
  applicantId: string
): SisStudent | null {
  return (
    [...store().students.values()].find(
      (s) =>
        s.organizationId === organizationId && s.applicantId === applicantId
    ) ?? null
  );
}

export function findStudentByParentToken(token: string): SisStudent | null {
  return (
    [...store().students.values()].find((s) => s.parentAccessToken === token) ??
    null
  );
}

export function upsertFamily(m: FamilyMember): FamilyMember {
  store().families.set(key(m.organizationId, m.id), m);
  return m;
}

export function listFamilies(
  organizationId: string,
  studentId?: string
): readonly FamilyMember[] {
  return Object.freeze(
    [...store().families.values()].filter(
      (m) =>
        m.organizationId === organizationId &&
        (studentId == null || m.studentId === studentId)
    )
  );
}

export function upsertAttendance(r: SisAttendanceRecord): SisAttendanceRecord {
  store().attendance.set(key(r.organizationId, r.id), r);
  return r;
}

export function listAttendance(
  organizationId: string,
  studentId?: string
): readonly SisAttendanceRecord[] {
  return Object.freeze(
    [...store().attendance.values()]
      .filter(
        (r) =>
          r.organizationId === organizationId &&
          (studentId == null || r.studentId === studentId)
      )
      .sort((a, b) => b.date.localeCompare(a.date))
  );
}

export function upsertClassAssignment(c: ClassAssignment): ClassAssignment {
  store().classes.set(key(c.organizationId, c.id), c);
  return c;
}

export function listClassAssignments(
  organizationId: string,
  studentId?: string
): readonly ClassAssignment[] {
  return Object.freeze(
    [...store().classes.values()].filter(
      (c) =>
        c.organizationId === organizationId &&
        (studentId == null || c.studentId === studentId)
    )
  );
}

export function upsertSupportPlan(p: SupportPlan): SupportPlan {
  store().supportPlans.set(key(p.organizationId, p.id), p);
  return p;
}

export function getSupportPlan(
  organizationId: string,
  id: string
): SupportPlan | null {
  return store().supportPlans.get(key(organizationId, id)) ?? null;
}

export function listSupportPlans(
  organizationId: string,
  studentId?: string
): readonly SupportPlan[] {
  return Object.freeze(
    [...store().supportPlans.values()]
      .filter(
        (p) =>
          p.organizationId === organizationId &&
          (studentId == null || p.studentId === studentId)
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  );
}

export function appendStudentTimeline(
  e: StudentTimelineEntry
): StudentTimelineEntry {
  store().timeline.push(e);
  return e;
}

export function listStudentTimeline(
  organizationId: string,
  studentId?: string
): readonly StudentTimelineEntry[] {
  return Object.freeze(
    store()
      .timeline.filter(
        (e) =>
          e.organizationId === organizationId &&
          (studentId == null || e.studentId === studentId)
      )
      .sort((a, b) => b.at.localeCompare(a.at))
  );
}

export function appendStudentAudit(e: StudentAuditEntry): StudentAuditEntry {
  store().audit.push(e);
  return e;
}

export function listStudentAudit(
  organizationId: string,
  studentId?: string
): readonly StudentAuditEntry[] {
  return Object.freeze(
    store()
      .audit.filter(
        (e) =>
          e.organizationId === organizationId &&
          (studentId == null || e.studentId === studentId)
      )
      .sort((a, b) => b.at.localeCompare(a.at))
  );
}
