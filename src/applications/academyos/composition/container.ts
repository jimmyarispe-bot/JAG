import {
  bindAcademyPlatformAdapters,
  bindAcademyWorkflowAdapters,
} from "@/applications/academyos/composition/adapters";
import { createSystemIdGenerator } from "@/applications/academyos/composition/defaults";
import { registerAcademyProviders } from "@/applications/academyos/composition/providers";
import { bindAcademyRepositories } from "@/applications/academyos/composition/repositories";
import { setActiveAcademyContainer } from "@/applications/academyos/composition/services";
import type {
  AcademyCompositionOverrides,
  AcademyContainer,
} from "@/applications/academyos/composition/types";
import { loadAcademyConfiguration } from "@/applications/academyos/configuration";
import { createAcademyInfrastructure } from "@/applications/academyos/infrastructure";

/**
 * Build the AcademyOS application container.
 * This is the only place concrete dependencies are wired.
 */
export function createAcademyContainer(
  overrides?: AcademyCompositionOverrides
): AcademyContainer {
  const mode = overrides?.mode ?? "production";
  const config = loadAcademyConfiguration(overrides?.config);

  const infrastructure = createAcademyInfrastructure({
    ...overrides?.infrastructure,
    config: {
      persistenceDriver:
        overrides?.infrastructure?.config?.persistenceDriver ??
        config.environment.persistenceDriver ??
        "memory",
      ...overrides?.infrastructure?.config,
    },
  });

  const repositories = bindAcademyRepositories({
    config,
    infrastructure,
    overrides: overrides?.repositories,
  });
  const workflowAdapters = bindAcademyWorkflowAdapters(
    overrides?.workflowAdapters
  );
  const platformAdapters = bindAcademyPlatformAdapters(
    overrides?.platformAdapters
  );
  const services = registerAcademyProviders({
    repositories,
    workflowAdapters,
    platformAdapters,
  });

  const container: AcademyContainer = {
    ready: true,
    mode,
    config,
    infrastructure,
    clock: overrides?.clock ?? {
      now: () => infrastructure.clock.now(),
    },
    ids: overrides?.ids ?? createSystemIdGenerator(),
    repositories,
    workflowAdapters,
    platformAdapters,
    services,
  };

  setActiveAcademyContainer(container);
  return container;
}
