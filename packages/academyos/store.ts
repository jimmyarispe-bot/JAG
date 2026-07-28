/** Org-scoped in-pack store — no platform core persistence. */

import { resetAcademicOpsStoreForTests } from "./academic-ops/store";
import { resetAdmissionsStoreForTests } from "./admissions/store";
import { resetFinanceStoreForTests } from "./finance/store";
import { resetLearningStoreForTests } from "./learning/store";
import { resetSisStoreForTests } from "./sis/store";
import { resetCommunicationsStoreForTests } from "./communications/store";
import { resetHardeningStoreForTests } from "./hardening/store";
import { resetOperationsStoreForTests } from "./operations/store";
import { resetValidationStoreForTests } from "./validation/store";
import { resetWorkforceStoreForTests } from "./workforce/store";

export type AcademyOsEntityBase = {
  readonly id: string;
  readonly organizationId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
  readonly twinEntityId: string | null;
};

type Bucket = Map<string, AcademyOsEntityBase & Record<string, unknown>>;

type AcademyOsStore = {
  schools: Bucket;
  students: Bucket;
  guardians: Bucket;
  staff: Bucket;
  classrooms: Bucket;
  courses: Bucket;
  enrollments: Bucket;
  admissions: Bucket;
  sessions: Bucket;
  attendance: Bucket;
  grades: Bucket;
  transcripts: Bucket;
  ieps: Bucket;
  scholarships: Bucket;
  invoices: Bucket;
};

const g = globalThis as typeof globalThis & {
  __academyOsPackStore?: AcademyOsStore;
};

function emptyBucket(): Bucket {
  return new Map();
}

function store(): AcademyOsStore {
  if (!g.__academyOsPackStore) {
    g.__academyOsPackStore = {
      schools: emptyBucket(),
      students: emptyBucket(),
      guardians: emptyBucket(),
      staff: emptyBucket(),
      classrooms: emptyBucket(),
      courses: emptyBucket(),
      enrollments: emptyBucket(),
      admissions: emptyBucket(),
      sessions: emptyBucket(),
      attendance: emptyBucket(),
      grades: emptyBucket(),
      transcripts: emptyBucket(),
      ieps: emptyBucket(),
      scholarships: emptyBucket(),
      invoices: emptyBucket(),
    };
  }
  return g.__academyOsPackStore;
}

export function resetAcademyOsStoreForTests(): void {
  g.__academyOsPackStore = undefined;
  resetAdmissionsStoreForTests();
  resetSisStoreForTests();
  resetAcademicOpsStoreForTests();
  resetFinanceStoreForTests();
  resetLearningStoreForTests();
  resetWorkforceStoreForTests();
  resetCommunicationsStoreForTests();
  resetValidationStoreForTests();
  resetHardeningStoreForTests();
  resetOperationsStoreForTests();
}

function key(organizationId: string, id: string): string {
  return `${organizationId}::${id}`;
}

export function upsertEntity<T extends AcademyOsEntityBase>(
  bucket: keyof AcademyOsStore,
  entity: T
): T {
  store()[bucket].set(key(entity.organizationId, entity.id), entity as never);
  return entity;
}

export function getEntity<T extends AcademyOsEntityBase>(
  bucket: keyof AcademyOsStore,
  organizationId: string,
  id: string
): T | null {
  return (store()[bucket].get(key(organizationId, id)) as T | undefined) ?? null;
}

export function listEntities<T extends AcademyOsEntityBase>(
  bucket: keyof AcademyOsStore,
  organizationId: string
): readonly T[] {
  return Object.freeze(
    [...store()[bucket].values()]
      .filter((e) => e.organizationId === organizationId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) as T[]
  );
}
