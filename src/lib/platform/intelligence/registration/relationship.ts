/**
 * Relationship stack registration: stakeholder → … → ethical.
 */

import {
  createStakeholderIntelligence,
  type StakeholderStack,
} from "@/lib/platform/intelligence/stakeholder";
import {
  createReputationIntelligence,
  type ReputationStack,
} from "@/lib/platform/intelligence/reputation";
import {
  createBehavioralIntelligence,
  type BehavioralStack,
} from "@/lib/platform/intelligence/behavioral";
import {
  createCulturalIntelligence,
  type CulturalStack,
} from "@/lib/platform/intelligence/cultural";
import {
  createEthicalIntelligence,
  type EthicalStack,
} from "@/lib/platform/intelligence/ethical";
import type {
  CreateIntelligenceServiceOptions,
  DnaOiosWiring,
} from "@/lib/platform/intelligence/registration/options";

export interface RelationshipStacks {
  stakeholder: StakeholderStack;
  reputation: ReputationStack;
  behavioral: BehavioralStack;
  cultural: CulturalStack;
  ethical: EthicalStack;
}

export function registerRelationshipStacks(
  options: CreateIntelligenceServiceOptions,
  wiring: DnaOiosWiring
): RelationshipStacks {
  const { organizationDna, oios } = wiring;

  const stakeholder =
    options.stakeholder ??
    createStakeholderIntelligence({
      ...(options.stakeholderOptions ?? {}),
      organizationDna: options.stakeholderOptions?.organizationDna ?? organizationDna,
      oios: options.stakeholderOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const reputation =
    options.reputation ??
    createReputationIntelligence({
      ...(options.reputationOptions ?? {}),
      organizationDna: options.reputationOptions?.organizationDna ?? organizationDna,
      oios: options.reputationOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const behavioral =
    options.behavioral ??
    createBehavioralIntelligence({
      ...(options.behavioralOptions ?? {}),
      organizationDna: options.behavioralOptions?.organizationDna ?? organizationDna,
      oios: options.behavioralOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const cultural =
    options.cultural ??
    createCulturalIntelligence({
      ...(options.culturalOptions ?? {}),
      organizationDna: options.culturalOptions?.organizationDna ?? organizationDna,
      oios: options.culturalOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const ethical =
    options.ethical ??
    createEthicalIntelligence({
      ...(options.ethicalOptions ?? {}),
      organizationDna: options.ethicalOptions?.organizationDna ?? organizationDna,
      oios: options.ethicalOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });

  return {
    stakeholder,
    reputation,
    behavioral,
    cultural,
    ethical,
  };
}
