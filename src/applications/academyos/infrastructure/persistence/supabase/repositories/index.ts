import type { DatabaseProvider } from "@/applications/academyos/infrastructure/database";
import type { InfrastructureRepositories } from "@/applications/academyos/infrastructure/repositories/types";
import { SupabaseAcademicRepository } from "@/applications/academyos/infrastructure/persistence/supabase/repositories/academic-repository";
import { SupabaseAdmissionsRepository } from "@/applications/academyos/infrastructure/persistence/supabase/repositories/admissions-repository";
import { SupabaseAdministrationRepository } from "@/applications/academyos/infrastructure/persistence/supabase/repositories/administration-repository";
import { SupabaseAttendanceRepository } from "@/applications/academyos/infrastructure/persistence/supabase/repositories/attendance-repository";
import { SupabaseCommunicationsRepository } from "@/applications/academyos/infrastructure/persistence/supabase/repositories/communications-repository";
import { SupabaseEmployeeRepository } from "@/applications/academyos/infrastructure/persistence/supabase/repositories/employee-repository";
import { SupabaseEnrollmentRepository } from "@/applications/academyos/infrastructure/persistence/supabase/repositories/enrollment-repository";
import { SupabaseFinanceRepository } from "@/applications/academyos/infrastructure/persistence/supabase/repositories/finance-repository";
import { SupabaseGuardianRepository } from "@/applications/academyos/infrastructure/persistence/supabase/repositories/guardian-repository";
import { SupabaseStudentRepository } from "@/applications/academyos/infrastructure/persistence/supabase/repositories/student-repository";

/** Production repository bundle — works with Memory or Supabase DatabaseProvider. */
export function createProductionRepositories(
  db: DatabaseProvider
): InfrastructureRepositories {
  return {
    student: new SupabaseStudentRepository(db),
    guardian: new SupabaseGuardianRepository(db),
    enrollment: new SupabaseEnrollmentRepository(db),
    attendance: new SupabaseAttendanceRepository(db),
    finance: new SupabaseFinanceRepository(db),
    employee: new SupabaseEmployeeRepository(db),
    admissions: new SupabaseAdmissionsRepository(db),
    academic: new SupabaseAcademicRepository(db),
    communications: new SupabaseCommunicationsRepository(db),
    administration: new SupabaseAdministrationRepository(db),
  };
}

export {
  SupabaseStudentRepository,
  SupabaseGuardianRepository,
  SupabaseEnrollmentRepository,
  SupabaseAttendanceRepository,
  SupabaseEmployeeRepository,
  SupabaseAcademicRepository,
  SupabaseFinanceRepository,
  SupabaseCommunicationsRepository,
  SupabaseAdministrationRepository,
  SupabaseAdmissionsRepository,
};
