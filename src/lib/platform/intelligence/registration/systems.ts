/**
 * Systems stack registration: systems → resilience → ecosystem.
 */

import {
  createSystemsIntelligence,
  type SystemsStack,
} from "@/lib/platform/intelligence/systems";
import {
  createResilienceIntelligence,
  type ResilienceStack,
} from "@/lib/platform/intelligence/resilience";
import {
  createEcosystemIntelligence,
  type EcosystemStack,
} from "@/lib/platform/intelligence/ecosystem";
import type {
  CreateIntelligenceServiceOptions,
  DnaOiosWiring,
} from "@/lib/platform/intelligence/registration/options";

export interface SystemsStacks {
  systems: SystemsStack;
  resilience: ResilienceStack;
  ecosystem: EcosystemStack;
}

export function registerSystemsStacks(
  options: CreateIntelligenceServiceOptions,
  wiring: DnaOiosWiring
): SystemsStacks {
  const { organizationDna, oios } = wiring;

  const systems =
    options.systems ??
    createSystemsIntelligence({
      ...(options.systemsOptions ?? {}),
      organizationDna: options.systemsOptions?.organizationDna ?? organizationDna,
      oios: options.systemsOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const resilience =
    options.resilience ??
    createResilienceIntelligence({
      ...(options.resilienceOptions ?? {}),
      organizationDna: options.resilienceOptions?.organizationDna ?? organizationDna,
      oios: options.resilienceOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const ecosystem =
    options.ecosystem ??
    createEcosystemIntelligence({
      ...(options.ecosystemOptions ?? {}),
      organizationDna: options.ecosystemOptions?.organizationDna ?? organizationDna,
      oios: options.ecosystemOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });

  return {
    systems,
    resilience,
    ecosystem,
  };
}
