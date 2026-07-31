import { createAcademyContainer } from "@/applications/academyos/composition/container";
import { setActiveAcademyContainer } from "@/applications/academyos/composition/services";
import { createTestClock } from "@/applications/academyos/composition/testing/clock";
import {
  createFakeAcademicRepository,
  createFakeAdmissionsRepository,
  createFakeAdministrationRepository,
  createFakeAttendanceRepository,
  createFakeCommunicationsRepository,
  createFakeEmployeeRepository,
  createFakeEnrollmentRepository,
  createFakeFinanceRepository,
  createFakeGuardianRepository,
  createFakePlatformAdapters,
  createFakeStudentRepository,
  createFakeWorkflowAdapters,
} from "@/applications/academyos/composition/testing/fakes";
import { createTestIdGenerator } from "@/applications/academyos/composition/testing/ids";
import type {
  AcademyCompositionOverrides,
  AcademyContainer,
} from "@/applications/academyos/composition/types";
import { bootstrapAcademyOS } from "@/applications/academyos/bootstrap";
import { resetAcademyDashboardsForTests } from "@/applications/academyos/dashboards";
import { resetAcademyIntelligenceForTests } from "@/applications/academyos/intelligence";
import { resetAcademyNavigationForTests } from "@/applications/academyos/navigation";
import { resetAcademyPermissionsForTests } from "@/applications/academyos/permissions";
import { resetAcademyReportsForTests } from "@/applications/academyos/reports";
import { resetAcademySeedForTests } from "@/applications/academyos/seed";
import { resetApiFrameworkForTests } from "@/lib/platform/api";
import { resetEntityFrameworkForTests } from "@/lib/platform/entities";
import { resetFormFrameworkForTests } from "@/lib/platform/forms";
import { resetGraphFrameworkForTests } from "@/lib/platform/graph";
import { resetSchemaFrameworkForTests } from "@/lib/platform/schema";
import { resetSdkFrameworkForTests } from "@/lib/platform/sdk";
import { resetWorkflowFrameworkForTests } from "@/lib/platform/workflows/framework";

export type AcademyTestContainerOptions = {
  /** Register platform frameworks (schemas/workflows) before composing. Default true. */
  registerPlatform?: boolean;
  /** Use real workflow/platform adapters instead of fakes. */
  useRealAdapters?: boolean;
  /**
   * When true, bind production repositories (memory DatabaseProvider) instead of fakes.
   * Matches production composition path for integration tests.
   */
  useProductionPersistence?: boolean;
  overrides?: AcademyCompositionOverrides;
};

function resetAcademyAppRegistriesForTests(): void {
  resetAcademyPermissionsForTests();
  resetAcademyNavigationForTests();
  resetAcademyDashboardsForTests();
  resetAcademyReportsForTests();
  resetAcademyIntelligenceForTests();
  resetAcademySeedForTests();
}

export function resetAcademyPlatformForTests(): void {
  resetSdkFrameworkForTests();
  resetSchemaFrameworkForTests();
  resetEntityFrameworkForTests();
  resetFormFrameworkForTests();
  resetWorkflowFrameworkForTests();
  resetApiFrameworkForTests();
  resetGraphFrameworkForTests();
  resetAcademyAppRegistriesForTests();
  setActiveAcademyContainer(null);
}

/**
 * Boot AcademyOS for tests through the same composition process as production.
 * Binds fake repositories (+ optional fake adapters) by default.
 */
export function createAcademyTestContainer(
  options?: AcademyTestContainerOptions
): AcademyContainer {
  const registerPlatform = options?.registerPlatform !== false;
  if (registerPlatform) {
    resetAcademyPlatformForTests();
    bootstrapAcademyOS();
  }

  const fakeRepos = options?.useProductionPersistence
    ? undefined
    : {
        student: createFakeStudentRepository(),
        guardian: createFakeGuardianRepository(),
        enrollment: createFakeEnrollmentRepository(),
        attendance: createFakeAttendanceRepository(),
        finance: createFakeFinanceRepository(),
        employee: createFakeEmployeeRepository(),
        admissions: createFakeAdmissionsRepository(),
        academic: createFakeAcademicRepository(),
        communications: createFakeCommunicationsRepository(),
        administration: createFakeAdministrationRepository(),
      };

  return createAcademyContainer({
    mode: "test",
    registerPlatform: false,
    clock: createTestClock(),
    ids: createTestIdGenerator(),
    infrastructure: {
      config: {
        persistenceDriver: "memory",
        identityDriver: "static",
        emailDriver: "memory",
        ...options?.overrides?.infrastructure?.config,
      },
      ...options?.overrides?.infrastructure,
    },
    repositories: fakeRepos
      ? {
          ...fakeRepos,
          ...options?.overrides?.repositories,
        }
      : options?.overrides?.repositories,
    workflowAdapters: options?.useRealAdapters
      ? options?.overrides?.workflowAdapters
      : {
          ...createFakeWorkflowAdapters(),
          ...options?.overrides?.workflowAdapters,
        },
    platformAdapters: options?.useRealAdapters
      ? options?.overrides?.platformAdapters
      : {
          ...createFakePlatformAdapters(),
          ...options?.overrides?.platformAdapters,
        },
    config: {
      environment: { name: "test", persistenceDriver: "memory" },
      features: options?.overrides?.config?.features,
      defaults: options?.overrides?.config?.defaults,
      ...options?.overrides?.config,
    },
  });
}
