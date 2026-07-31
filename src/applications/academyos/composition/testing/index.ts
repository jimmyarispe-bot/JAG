export { createTestClock } from "@/applications/academyos/composition/testing/clock";
export { createTestIdGenerator } from "@/applications/academyos/composition/testing/ids";
export {
  createAcademyTestContainer,
  resetAcademyPlatformForTests,
  type AcademyTestContainerOptions,
} from "@/applications/academyos/composition/testing/container";
export {
  createFakeStudentRepository,
  createFakeGuardianRepository,
  createFakeEnrollmentRepository,
  createFakeAttendanceRepository,
  createFakeFinanceRepository,
  createFakeEmployeeRepository,
  createFakeAdmissionsRepository,
  createFakeAcademicRepository,
  createFakeCommunicationsRepository,
  createFakeAdministrationRepository,
  createFakeWorkflowAdapters,
  createFakePlatformAdapters,
} from "@/applications/academyos/composition/testing/fakes";
