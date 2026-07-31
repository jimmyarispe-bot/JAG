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
import type {
  AcademyPlatformAdapters,
  AcademyWorkflowAdapters,
} from "@/applications/academyos/composition/types";
import type { WorkflowAdapterResult } from "@/applications/academyos/workflow-adapters";

function memoryMap<T extends { id: string }>() {
  const store = new Map<string, T>();
  return {
    async get(id: string) {
      return store.get(id) ?? null;
    },
    async save(record: T) {
      const next = { ...record };
      store.set(next.id, next);
      return { ...next };
    },
    async list(predicate?: (row: T) => boolean) {
      const rows = [...store.values()];
      return predicate ? rows.filter(predicate) : rows;
    },
  };
}

export function createFakeStudentRepository(): StudentRepository {
  const mem = memoryMap<Awaited<ReturnType<StudentRepository["save"]>>>();
  return {
    getById: (id) => mem.get(id),
    listBySchool: (schoolId) => mem.list((r) => r.schoolId === schoolId),
    save: (record) => mem.save(record),
    archive: async (id) => {
      const row = await mem.get(id);
      if (!row) return null;
      return mem.save({
        ...row,
        status: "archived",
        updatedAt: new Date().toISOString(),
      });
    },
  };
}

export function createFakeGuardianRepository(): GuardianRepository {
  const mem = memoryMap<Awaited<ReturnType<GuardianRepository["save"]>>>();
  return {
    getById: (id) => mem.get(id),
    listByFamily: (familyId) => mem.list((r) => r.familyId === familyId),
    save: (record) => mem.save(record),
  };
}

export function createFakeEnrollmentRepository(): EnrollmentRepository {
  const mem = memoryMap<Awaited<ReturnType<EnrollmentRepository["save"]>>>();
  return {
    getById: (id) => mem.get(id),
    listByStudent: (studentId) => mem.list((r) => r.studentId === studentId),
    save: (record) => mem.save(record),
  };
}

export function createFakeAttendanceRepository(): AttendanceRepository {
  const mem = memoryMap<Awaited<ReturnType<AttendanceRepository["save"]>>>();
  return {
    getById: (id) => mem.get(id),
    listByStudent: (studentId) => mem.list((r) => r.studentId === studentId),
    listByDate: (attendanceDate) =>
      mem.list((r) => r.attendanceDate === attendanceDate),
    save: (record) => mem.save(record),
  };
}

export function createFakeFinanceRepository(): FinanceRepository {
  const invoices = memoryMap<
    Awaited<ReturnType<FinanceRepository["saveInvoice"]>>
  >();
  const payments = memoryMap<
    Awaited<ReturnType<FinanceRepository["savePayment"]>>
  >();
  const scholarships = memoryMap<
    Awaited<ReturnType<FinanceRepository["saveScholarship"]>>
  >();
  return {
    getInvoice: (id) => invoices.get(id),
    saveInvoice: (record) => invoices.save(record),
    getPayment: (id) => payments.get(id),
    savePayment: (record) => payments.save(record),
    getScholarship: (id) => scholarships.get(id),
    saveScholarship: (record) => scholarships.save(record),
    listOpenInvoicesByStudent: (studentId) =>
      invoices.list(
        (r) =>
          r.studentId === studentId &&
          !["closed", "cancelled"].includes(r.status)
      ),
  };
}

export function createFakeEmployeeRepository(): EmployeeRepository {
  const mem = memoryMap<Awaited<ReturnType<EmployeeRepository["save"]>>>();
  return {
    getById: (id) => mem.get(id),
    listBySchool: (schoolId) => mem.list((r) => r.schoolId === schoolId),
    save: (record) => mem.save(record),
    archive: async (id) => {
      const row = await mem.get(id);
      if (!row) return null;
      return mem.save({
        ...row,
        status: "archived",
        updatedAt: new Date().toISOString(),
      });
    },
  };
}

export function createFakeAdmissionsRepository(): AdmissionsRepository {
  const inquiries = memoryMap<
    Awaited<ReturnType<AdmissionsRepository["saveInquiry"]>>
  >();
  const applications = memoryMap<
    Awaited<ReturnType<AdmissionsRepository["saveApplication"]>>
  >();
  return {
    getInquiry: (id) => inquiries.get(id),
    saveInquiry: (record) => inquiries.save(record),
    getApplication: (id) => applications.get(id),
    saveApplication: (record) => applications.save(record),
    listApplicationsBySchool: (schoolId) =>
      applications.list((r) => r.schoolId === schoolId),
  };
}

export function createFakeAcademicRepository(): AcademicRepository {
  const courses = memoryMap<
    Awaited<ReturnType<AcademicRepository["saveCourse"]>>
  >();
  const sections = memoryMap<
    Awaited<ReturnType<AcademicRepository["saveSection"]>>
  >();
  const assessments = memoryMap<
    Awaited<ReturnType<AcademicRepository["saveAssessment"]>>
  >();
  return {
    getCourse: (id) => courses.get(id),
    saveCourse: (record) => courses.save(record),
    getSection: (id) => sections.get(id),
    saveSection: (record) => sections.save(record),
    getAssessment: (id) => assessments.get(id),
    saveAssessment: (record) => assessments.save(record),
  };
}

export function createFakeCommunicationsRepository(): CommunicationsRepository {
  const messages = memoryMap<
    Awaited<ReturnType<CommunicationsRepository["saveMessage"]>>
  >();
  const announcements = memoryMap<
    Awaited<ReturnType<CommunicationsRepository["saveAnnouncement"]>>
  >();
  return {
    saveMessage: (record) => messages.save(record),
    getMessage: (id) => messages.get(id),
    saveAnnouncement: (record) => announcements.save(record),
    getAnnouncement: (id) => announcements.get(id),
  };
}

export function createFakeAdministrationRepository(): AdministrationRepository {
  const schools = memoryMap<
    Awaited<ReturnType<AdministrationRepository["saveSchool"]>>
  >();
  const programs = memoryMap<
    Awaited<ReturnType<AdministrationRepository["saveProgram"]>>
  >();
  return {
    getSchool: (id) => schools.get(id),
    saveSchool: (record) => schools.save(record),
    getProgram: (id) => programs.get(id),
    saveProgram: (record) => programs.save(record),
    listSchoolsByOrganization: (organizationId) =>
      schools.list((r) => r.organizationId === organizationId),
  };
}

function fakeWorkflowResult(
  definitionId: string,
  currentState: string
): WorkflowAdapterResult {
  return {
    instanceId: `wf_fake_${definitionId}`,
    definitionId,
    currentState,
    status: "active",
  };
}

/** No-op workflow adapters — composition testing without Workflow Framework. */
export function createFakeWorkflowAdapters(): AcademyWorkflowAdapters {
  return {
    admissions: {
      startInquiry: () => fakeWorkflowResult("academyos.admissions", "inquiry"),
      startApplication: () =>
        fakeWorkflowResult("academyos.admissions", "application"),
      transition: (input) =>
        fakeWorkflowResult("academyos.admissions", input.transitionKey),
    },
    students: {
      startLifecycle: () =>
        fakeWorkflowResult("academyos.student-lifecycle", "enroll"),
      startEnrollment: () => fakeWorkflowResult("academyos.enrollment", "draft"),
      transition: (input) =>
        fakeWorkflowResult("academyos.enrollment", input.transitionKey),
    },
    finance: {
      startBilling: () => fakeWorkflowResult("academyos.finance", "invoice"),
      startScholarship: () =>
        fakeWorkflowResult("academyos.scholarship", "application"),
      transition: (input) =>
        fakeWorkflowResult("academyos.finance", input.transitionKey),
    },
    hr: {
      startHiring: () => fakeWorkflowResult("academyos.hiring", "applicant"),
      transition: (input) =>
        fakeWorkflowResult("academyos.hiring", input.transitionKey),
    },
  };
}

/** Minimal platform adapter fakes for isolated application tests. */
export function createFakePlatformAdapters(): AcademyPlatformAdapters {
  return {
    entity: {
      mirror: () => null,
      get: () => null,
      timeline: () => [],
      recordActivity: () => ({
        id: "act_fake",
        entityType: "Student",
        entityId: "x",
        source: "activity",
        eventType: "test",
        title: "test",
        summary: null,
        occurredAt: "2026-08-01T12:00:00.000Z",
        actorUserId: null,
        refId: null,
        metadata: {},
      }),
    },
    forms: {
      getDefinition: () => null,
      listForEntity: () => [],
      validate: () => ({ valid: true, issues: [] }),
      applyDefaults: (_formId: string, values: Record<string, unknown>) => values,
    },
    api: {
      listRegistered: () => [],
      get: () => null,
      catalog: () => [],
      describe: () => null,
      inventoryCount: () => ({ registered: 0, planned: 0 }),
    },
    intelligence: {
      listPacks: () => [],
      getPack: () => null,
      snapshot: () => [],
    },
    forecasting: {
      listScenarios: () => [],
      analyzeFromMetrics: () => {
        throw new Error("Forecasting fake does not analyze");
      },
    },
  } as unknown as AcademyPlatformAdapters;
}
