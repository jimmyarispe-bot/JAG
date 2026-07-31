import type {
  AcademicApplicationService,
  AdmissionsApplicationService,
  AdministrationApplicationService,
  AttendanceApplicationService,
  CommunicationsApplicationService,
  FinanceApplicationService,
  HRApplicationService,
  StudentApplicationService,
} from "@/applications/academyos/application";
import type { AcademyConfiguration } from "@/applications/academyos/configuration";
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
  AcademyInfrastructure,
  CreateInfrastructureOptions,
} from "@/applications/academyos/infrastructure";
import type {
  ApiPlatformAdapter,
  EntityPlatformAdapter,
  ForecastingPlatformAdapter,
  FormsPlatformAdapter,
  IntelligencePlatformAdapter,
} from "@/applications/academyos/platform-adapters";
import type {
  AdmissionsWorkflowAdapter,
  FinanceWorkflowAdapter,
  HRWorkflowAdapter,
  StudentWorkflowAdapter,
} from "@/applications/academyos/workflow-adapters";

export type AcademyClock = {
  now(): string;
};

export type AcademyIdGenerator = {
  next(prefix: string): string;
};

export type AcademyRepositories = {
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

export type AcademyWorkflowAdapters = {
  admissions: typeof AdmissionsWorkflowAdapter;
  students: typeof StudentWorkflowAdapter;
  finance: typeof FinanceWorkflowAdapter;
  hr: typeof HRWorkflowAdapter;
};

export type AcademyPlatformAdapters = {
  entity: typeof EntityPlatformAdapter;
  forms: typeof FormsPlatformAdapter;
  api: typeof ApiPlatformAdapter;
  intelligence: typeof IntelligencePlatformAdapter;
  forecasting: typeof ForecastingPlatformAdapter;
};

export type AcademyApplicationServices = {
  admissions: AdmissionsApplicationService;
  students: StudentApplicationService;
  academics: AcademicApplicationService;
  attendance: AttendanceApplicationService;
  finance: FinanceApplicationService;
  hr: HRApplicationService;
  communications: CommunicationsApplicationService;
  administration: AdministrationApplicationService;
};

export type AcademyServiceName = keyof AcademyApplicationServices;

export type AcademyContainer = {
  ready: true;
  mode: "production" | "test";
  config: AcademyConfiguration;
  infrastructure: AcademyInfrastructure;
  clock: AcademyClock;
  ids: AcademyIdGenerator;
  repositories: AcademyRepositories;
  workflowAdapters: AcademyWorkflowAdapters;
  platformAdapters: AcademyPlatformAdapters;
  services: AcademyApplicationServices;
};

export type AcademyCompositionOverrides = {
  mode?: "production" | "test";
  config?: Parameters<
    typeof import("@/applications/academyos/configuration").loadAcademyConfiguration
  >[0];
  infrastructure?: CreateInfrastructureOptions;
  repositories?: Partial<AcademyRepositories>;
  workflowAdapters?: Partial<AcademyWorkflowAdapters>;
  platformAdapters?: Partial<AcademyPlatformAdapters>;
  clock?: AcademyClock;
  ids?: AcademyIdGenerator;
  /** When false, skip SDK/schema/workflow platform registration. */
  registerPlatform?: boolean;
};
