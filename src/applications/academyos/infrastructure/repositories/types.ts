import type {
  AcademicRepository,
  AdmissionsRepository,
  AdministrationRepository,
  AttendanceRepository,
  CommunicationsRepository,
  EmployeeRepository,
  EnrollmentRepository,
  FinanceRepository,
  GuardianRepository,
  StudentRepository,
} from "@/applications/academyos/domain/repositories";

/** Concrete repository bundle — mirrors composition AcademyRepositories. */
export type InfrastructureRepositories = {
  student: StudentRepository;
  guardian: GuardianRepository;
  enrollment: EnrollmentRepository;
  attendance: AttendanceRepository;
  finance: FinanceRepository;
  employee: EmployeeRepository;
  admissions: AdmissionsRepository;
  academic: AcademicRepository;
  communications: CommunicationsRepository;
  administration: AdministrationRepository;
};
