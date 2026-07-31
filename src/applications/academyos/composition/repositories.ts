import type {
  AcademyCompositionOverrides,
  AcademyRepositories,
} from "@/applications/academyos/composition/types";
import type { AcademyConfiguration } from "@/applications/academyos/configuration";
import type { AcademyInfrastructure } from "@/applications/academyos/infrastructure";
import { createProductionRepositories } from "@/applications/academyos/infrastructure/persistence";
import {
  createNullAcademicRepository,
  createNullAdmissionsRepository,
  createNullAdministrationRepository,
  createNullAttendanceRepository,
  createNullCommunicationsRepository,
  createNullEmployeeRepository,
  createNullEnrollmentRepository,
  createNullFinanceRepository,
  createNullGuardianRepository,
  createNullStudentRepository,
} from "@/applications/academyos/composition/null/repositories";

function createNullRepositories(): AcademyRepositories {
  return {
    student: createNullStudentRepository(),
    guardian: createNullGuardianRepository(),
    enrollment: createNullEnrollmentRepository(),
    attendance: createNullAttendanceRepository(),
    finance: createNullFinanceRepository(),
    employee: createNullEmployeeRepository(),
    admissions: createNullAdmissionsRepository(),
    academic: createNullAcademicRepository(),
    communications: createNullCommunicationsRepository(),
    administration: createNullAdministrationRepository(),
  };
}

/**
 * Sole implementation switch for repositories.
 *
 * NullStudentRepository → SupabaseStudentRepository (production classes)
 * selected by infrastructure.config.persistenceDriver only.
 */
export function bindAcademyRepositories(input: {
  config: AcademyConfiguration;
  infrastructure: AcademyInfrastructure;
  overrides?: AcademyCompositionOverrides["repositories"];
}): AcademyRepositories {
  const driver = input.infrastructure.config.persistenceDriver;

  // Production implementations for memory + supabase drivers.
  // Explicit "null" remains available for dry-run / boundary tests only.
  const defaults =
    driver === "null"
      ? createNullRepositories()
      : createProductionRepositories(input.infrastructure.database);

  return {
    ...defaults,
    ...input.overrides,
  };
}
