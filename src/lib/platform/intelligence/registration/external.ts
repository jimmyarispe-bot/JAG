/**
 * External environment stack registration: market → … → environmental.
 */

import {
  createMarketIntelligence,
  type MarketStack,
} from "@/lib/platform/intelligence/market";
import {
  createInnovationIntelligence,
  type InnovationStack,
} from "@/lib/platform/intelligence/innovation";
import {
  createImpactIntelligence,
  type ImpactStack,
} from "@/lib/platform/intelligence/impact";
import {
  createEconomicIntelligence,
  type EconomicStack,
} from "@/lib/platform/intelligence/economic";
import {
  createCompetitiveIntelligence,
  type CompetitiveStack,
} from "@/lib/platform/intelligence/competitive";
import {
  createPoliticalIntelligence,
  type PoliticalStack,
} from "@/lib/platform/intelligence/political";
import {
  createEnvironmentalIntelligence,
  type EnvironmentalStack,
} from "@/lib/platform/intelligence/environmental";
import type {
  CreateIntelligenceServiceOptions,
  DnaOiosWiring,
} from "@/lib/platform/intelligence/registration/options";

export interface ExternalStacks {
  market: MarketStack;
  innovation: InnovationStack;
  impact: ImpactStack;
  economic: EconomicStack;
  competitive: CompetitiveStack;
  political: PoliticalStack;
  environmental: EnvironmentalStack;
}

export function registerExternalStacks(
  options: CreateIntelligenceServiceOptions,
  wiring: DnaOiosWiring
): ExternalStacks {
  const { organizationDna, oios } = wiring;

  const market =
    options.market ??
    createMarketIntelligence({
      ...(options.marketOptions ?? {}),
      organizationDna: options.marketOptions?.organizationDna ?? organizationDna,
      oios: options.marketOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const innovation =
    options.innovation ??
    createInnovationIntelligence({
      ...(options.innovationOptions ?? {}),
      organizationDna: options.innovationOptions?.organizationDna ?? organizationDna,
      oios: options.innovationOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const impact =
    options.impact ??
    createImpactIntelligence({
      ...(options.impactOptions ?? {}),
      organizationDna: options.impactOptions?.organizationDna ?? organizationDna,
      oios: options.impactOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const economic =
    options.economic ??
    createEconomicIntelligence({
      ...(options.economicOptions ?? {}),
      organizationDna: options.economicOptions?.organizationDna ?? organizationDna,
      oios: options.economicOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const competitive =
    options.competitive ??
    createCompetitiveIntelligence({
      ...(options.competitiveOptions ?? {}),
      organizationDna: options.competitiveOptions?.organizationDna ?? organizationDna,
      oios: options.competitiveOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const political =
    options.political ??
    createPoliticalIntelligence({
      ...(options.politicalOptions ?? {}),
      organizationDna: options.politicalOptions?.organizationDna ?? organizationDna,
      oios: options.politicalOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const environmental =
    options.environmental ??
    createEnvironmentalIntelligence({
      ...(options.environmentalOptions ?? {}),
      organizationDna: options.environmentalOptions?.organizationDna ?? organizationDna,
      oios: options.environmentalOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });

  return {
    market,
    innovation,
    impact,
    economic,
    competitive,
    political,
    environmental,
  };
}
