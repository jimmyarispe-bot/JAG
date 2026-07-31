/**
 * AcademyOS Composition Root — sole place concrete dependencies are wired.
 *
 * Consumers resolve services via resolveAcademyService() / getActiveAcademyContainer().
 * Do not construct application services or repositories outside this package.
 */

export {
  startAcademyOS,
  composeAcademyOS,
  type AcademyStartupResult,
} from "@/applications/academyos/composition/bootstrap";
export {
  validateAcademyStartup,
  assertAcademyStartupHealthy,
  type AcademyHealthReport,
  type AcademyHealthIssue,
} from "@/applications/academyos/composition/startup-health";
export { createAcademyContainer } from "@/applications/academyos/composition/container";
export {
  resolveAcademyService,
  requireAcademyContainer,
  getActiveAcademyContainer,
  setActiveAcademyContainer,
  listAcademyServiceNames,
} from "@/applications/academyos/composition/services";
export { bindAcademyRepositories } from "@/applications/academyos/composition/repositories";
export {
  bindAcademyWorkflowAdapters,
  bindAcademyPlatformAdapters,
} from "@/applications/academyos/composition/adapters";
export { registerAcademyProviders } from "@/applications/academyos/composition/providers";
export type {
  AcademyContainer,
  AcademyCompositionOverrides,
  AcademyRepositories,
  AcademyApplicationServices,
  AcademyServiceName,
  AcademyWorkflowAdapters,
  AcademyPlatformAdapters,
  AcademyClock,
  AcademyIdGenerator,
} from "@/applications/academyos/composition/types";
export {
  AcademyCompositionError,
  AcademyRepositoryNotBoundError,
  AcademyContainerNotReadyError,
} from "@/applications/academyos/composition/errors";

export * from "@/applications/academyos/composition/testing";
