/**
 * Memory stack registration: institutional-memory → collective.
 */

import {
  createInstitutionalMemoryIntelligence,
  type InstitutionalMemoryStack,
} from "@/lib/platform/intelligence/institutional-memory";
import {
  createCollectiveIntelligence,
  type CollectiveStack,
} from "@/lib/platform/intelligence/collective";
import type {
  CreateIntelligenceServiceOptions,
  DnaOiosWiring,
} from "@/lib/platform/intelligence/registration/options";

export interface MemoryStacks {
  institutionalMemory: InstitutionalMemoryStack;
  collective: CollectiveStack;
}

export function registerMemoryStacks(
  options: CreateIntelligenceServiceOptions,
  wiring: DnaOiosWiring
): MemoryStacks {
  const { organizationDna, oios } = wiring;

  const institutionalMemory =
    options.institutionalMemory ??
    createInstitutionalMemoryIntelligence({
      ...(options.institutionalMemoryOptions ?? {}),
      organizationDna: options.institutionalMemoryOptions?.organizationDna ?? organizationDna,
      oios: options.institutionalMemoryOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const collective =
    options.collective ??
    createCollectiveIntelligence({
      ...(options.collectiveOptions ?? {}),
      organizationDna: options.collectiveOptions?.organizationDna ?? organizationDna,
      oios: options.collectiveOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });

  return {
    institutionalMemory,
    collective,
  };
}
