import type {
  AssessmentRecord,
  Curriculum,
  Intervention,
  MasteryHistoryEntry,
  MasteryRecord,
  MasteryScaleConfig,
  ProgressSnapshot,
  TeacherObservation,
} from "./types";
import { DEFAULT_MASTERY_SCALE } from "./mastery-scales";

type LearningStore = {
  scales: Map<string, MasteryScaleConfig>;
  curricula: Map<string, Curriculum>;
  assessments: Map<string, AssessmentRecord>;
  mastery: Map<string, MasteryRecord>;
  history: MasteryHistoryEntry[];
  interventions: Map<string, Intervention>;
  observations: Map<string, TeacherObservation>;
  snapshots: Map<string, ProgressSnapshot>;
};

const g = globalThis as typeof globalThis & {
  __academyOsLearningStore?: LearningStore;
};

function empty(): LearningStore {
  return {
    scales: new Map(),
    curricula: new Map(),
    assessments: new Map(),
    mastery: new Map(),
    history: [],
    interventions: new Map(),
    observations: new Map(),
    snapshots: new Map(),
  };
}

function store(): LearningStore {
  if (!g.__academyOsLearningStore) g.__academyOsLearningStore = empty();
  return g.__academyOsLearningStore;
}

export function resetLearningStoreForTests(): void {
  g.__academyOsLearningStore = empty();
}

function key(organizationId: string, id: string): string {
  return `${organizationId}::${id}`;
}

export function getMasteryScale(organizationId: string): MasteryScaleConfig {
  return store().scales.get(organizationId) ?? DEFAULT_MASTERY_SCALE;
}

export function setMasteryScale(
  organizationId: string,
  config: MasteryScaleConfig
): MasteryScaleConfig {
  store().scales.set(organizationId, config);
  return config;
}

export function upsertCurriculum(c: Curriculum): Curriculum {
  store().curricula.set(key(c.organizationId, c.id), c);
  return c;
}

export function getCurriculum(
  organizationId: string,
  id: string
): Curriculum | null {
  return store().curricula.get(key(organizationId, id)) ?? null;
}

export function listCurricula(organizationId: string): readonly Curriculum[] {
  return Object.freeze(
    [...store().curricula.values()]
      .filter((c) => c.organizationId === organizationId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  );
}

export function upsertAssessment(a: AssessmentRecord): AssessmentRecord {
  store().assessments.set(key(a.organizationId, a.id), a);
  return a;
}

export function listAssessments(
  organizationId: string,
  opts?: { studentId?: string; kind?: string; curriculumId?: string }
): readonly AssessmentRecord[] {
  return Object.freeze(
    [...store().assessments.values()]
      .filter(
        (a) =>
          a.organizationId === organizationId &&
          (opts?.studentId == null || a.studentId === opts.studentId) &&
          (opts?.kind == null || a.kind === opts.kind) &&
          (opts?.curriculumId == null || a.curriculumId === opts.curriculumId)
      )
      .sort((a, b) => b.assessedOn.localeCompare(a.assessedOn))
  );
}

function masteryKey(
  organizationId: string,
  studentId: string,
  objectiveId: string
): string {
  return `${organizationId}::${studentId}::${objectiveId}`;
}

export function upsertMastery(m: MasteryRecord): MasteryRecord {
  store().mastery.set(
    masteryKey(m.organizationId, m.studentId, m.objectiveId),
    m
  );
  return m;
}

export function getMastery(
  organizationId: string,
  studentId: string,
  objectiveId: string
): MasteryRecord | null {
  return (
    store().mastery.get(masteryKey(organizationId, studentId, objectiveId)) ??
    null
  );
}

export function listMastery(
  organizationId: string,
  studentId?: string
): readonly MasteryRecord[] {
  return Object.freeze(
    [...store().mastery.values()].filter(
      (m) =>
        m.organizationId === organizationId &&
        (studentId == null || m.studentId === studentId)
    )
  );
}

export function appendMasteryHistory(entry: MasteryHistoryEntry): void {
  store().history.push(entry);
}

export function listMasteryHistory(
  organizationId: string,
  studentId?: string
): readonly MasteryHistoryEntry[] {
  return Object.freeze(
    store()
      .history.filter(
        (h) =>
          h.organizationId === organizationId &&
          (studentId == null || h.studentId === studentId)
      )
      .slice()
      .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
  );
}

export function upsertIntervention(i: Intervention): Intervention {
  store().interventions.set(key(i.organizationId, i.id), i);
  return i;
}

export function getIntervention(
  organizationId: string,
  id: string
): Intervention | null {
  return store().interventions.get(key(organizationId, id)) ?? null;
}

export function listInterventions(
  organizationId: string,
  opts?: { studentId?: string; status?: string; kind?: string }
): readonly Intervention[] {
  return Object.freeze(
    [...store().interventions.values()]
      .filter(
        (i) =>
          i.organizationId === organizationId &&
          (opts?.studentId == null || i.studentId === opts.studentId) &&
          (opts?.status == null || i.status === opts.status) &&
          (opts?.kind == null || i.kind === opts.kind)
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  );
}

export function upsertObservation(o: TeacherObservation): TeacherObservation {
  store().observations.set(key(o.organizationId, o.id), o);
  return o;
}

export function listObservations(
  organizationId: string,
  studentId?: string
): readonly TeacherObservation[] {
  return Object.freeze(
    [...store().observations.values()]
      .filter(
        (o) =>
          o.organizationId === organizationId &&
          (studentId == null || o.studentId === studentId)
      )
      .sort((a, b) => b.assessedOn.localeCompare(a.assessedOn))
  );
}

export function upsertSnapshot(s: ProgressSnapshot): ProgressSnapshot {
  store().snapshots.set(key(s.organizationId, s.id), s);
  return s;
}

export function listSnapshots(
  organizationId: string,
  studentId?: string
): readonly ProgressSnapshot[] {
  return Object.freeze(
    [...store().snapshots.values()]
      .filter(
        (s) =>
          s.organizationId === organizationId &&
          (studentId == null || s.studentId === studentId)
      )
      .sort((a, b) => b.asOf.localeCompare(a.asOf))
  );
}
