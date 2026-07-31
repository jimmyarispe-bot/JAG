import { AcademyRepositoryNotBoundError } from "@/applications/academyos/composition/errors";
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

function notBound(name: string): never {
  throw new AcademyRepositoryNotBoundError(name);
}

/** Swappable null bindings — replace in composition/repositories.ts later. */
export function createNullStudentRepository(): StudentRepository {
  return {
    getById: async () => null,
    listBySchool: async () => [],
    save: async () => notBound("StudentRepository"),
    archive: async () => notBound("StudentRepository"),
  };
}

export function createNullGuardianRepository(): GuardianRepository {
  return {
    getById: async () => null,
    listByFamily: async () => [],
    save: async () => notBound("GuardianRepository"),
  };
}

export function createNullEnrollmentRepository(): EnrollmentRepository {
  return {
    getById: async () => null,
    listByStudent: async () => [],
    save: async () => notBound("EnrollmentRepository"),
  };
}

export function createNullAttendanceRepository(): AttendanceRepository {
  return {
    getById: async () => null,
    listByStudent: async () => [],
    listByDate: async () => [],
    save: async () => notBound("AttendanceRepository"),
  };
}

export function createNullFinanceRepository(): FinanceRepository {
  return {
    getInvoice: async () => null,
    saveInvoice: async () => notBound("FinanceRepository"),
    getPayment: async () => null,
    savePayment: async () => notBound("FinanceRepository"),
    getScholarship: async () => null,
    saveScholarship: async () => notBound("FinanceRepository"),
    listOpenInvoicesByStudent: async () => [],
  };
}

export function createNullEmployeeRepository(): EmployeeRepository {
  return {
    getById: async () => null,
    listBySchool: async () => [],
    save: async () => notBound("EmployeeRepository"),
    archive: async () => notBound("EmployeeRepository"),
  };
}

export function createNullAdmissionsRepository(): AdmissionsRepository {
  return {
    getInquiry: async () => null,
    saveInquiry: async () => notBound("AdmissionsRepository"),
    getApplication: async () => null,
    saveApplication: async () => notBound("AdmissionsRepository"),
    listApplicationsBySchool: async () => [],
  };
}

export function createNullAcademicRepository(): AcademicRepository {
  return {
    getCourse: async () => null,
    saveCourse: async () => notBound("AcademicRepository"),
    getSection: async () => null,
    saveSection: async () => notBound("AcademicRepository"),
    getAssessment: async () => null,
    saveAssessment: async () => notBound("AcademicRepository"),
  };
}

export function createNullCommunicationsRepository(): CommunicationsRepository {
  return {
    saveMessage: async () => notBound("CommunicationsRepository"),
    getMessage: async () => null,
    saveAnnouncement: async () => notBound("CommunicationsRepository"),
    getAnnouncement: async () => null,
  };
}

export function createNullAdministrationRepository(): AdministrationRepository {
  return {
    getSchool: async () => null,
    saveSchool: async () => notBound("AdministrationRepository"),
    getProgram: async () => null,
    saveProgram: async () => notBound("AdministrationRepository"),
    listSchoolsByOrganization: async () => [],
  };
}
