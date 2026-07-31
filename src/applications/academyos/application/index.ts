/**
 * AcademyOS Application Layer — sole entry for controllers, APIs, server actions, UI.
 *
 * Resolve concrete services from the composition root:
 *   resolveAcademyService("students")
 *
 * Do not call create*ApplicationService outside composition/providers.
 *
 * UI → Application Facade → Domain Services → Repository Interfaces
 *                         ↘ Workflow / Platform Adapters → JAG
 */

export * from "@/applications/academyos/application/shared";
export * from "@/applications/academyos/application/dto";

export type {
  AdmissionsApplicationService,
  AdmissionsApplicationServiceDeps,
} from "@/applications/academyos/application/admissions/service";

export type {
  StudentApplicationService,
  StudentApplicationServiceDeps,
} from "@/applications/academyos/application/students/service";

export type {
  AcademicApplicationService,
  AcademicApplicationServiceDeps,
} from "@/applications/academyos/application/academics/service";

export type {
  AttendanceApplicationService,
  AttendanceApplicationServiceDeps,
} from "@/applications/academyos/application/attendance/service";

export type {
  FinanceApplicationService,
  FinanceApplicationServiceDeps,
} from "@/applications/academyos/application/finance/service";

export type {
  HRApplicationService,
  HRApplicationServiceDeps,
} from "@/applications/academyos/application/hr/service";

export type {
  CommunicationsApplicationService,
  CommunicationsApplicationServiceDeps,
} from "@/applications/academyos/application/communications/service";

export type {
  AdministrationApplicationService,
  AdministrationApplicationServiceDeps,
} from "@/applications/academyos/application/administration/service";
