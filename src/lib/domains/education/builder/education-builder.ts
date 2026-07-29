/**
 * Education Domain Builder — wires placeholder contributors via Domain SDK.
 */

import {
  DOMAIN_SDK_MINIMUM_CORE,
  DOMAIN_SDK_RUNTIME_CONTRACT,
  DOMAIN_SDK_VERSION,
  createDomainBuilder,
  type DomainBuilder,
  type DomainPackage,
} from "@/lib/jag/domain-sdk";
import { createEducationContributors } from "../contributors";
import { createEducationManifest } from "../manifest";
import {
  EDUCATION_DOMAIN_ID,
  EDUCATION_DOMAIN_NAME,
  EDUCATION_DOMAIN_VERSION,
} from "../types";

export function createEducationDomainBuilder(): DomainBuilder {
  const manifest = createEducationManifest();
  const contributors = createEducationContributors();

  return createDomainBuilder({
    id: EDUCATION_DOMAIN_ID,
    name: EDUCATION_DOMAIN_NAME,
    displayName: manifest.displayName,
    version: EDUCATION_DOMAIN_VERSION,
    description: manifest.description,
    owner: manifest.owner,
    requiredRuntimeVersion: DOMAIN_SDK_RUNTIME_CONTRACT,
    minimumCoreVersion: DOMAIN_SDK_MINIMUM_CORE,
    requiredSdkVersion: DOMAIN_SDK_VERSION,
    supportedCapabilities: manifest.supportedCapabilities,
    permissions: manifest.permissions,
    featureFlags: manifest.featureFlags,
    metadata: manifest.metadata,
    contributors: manifest.contributors,
  })
    .registerContextContributor(contributors.context)
    .registerIntentContributor(contributors.intent)
    .registerCognitiveContributor(contributors.cognition)
    .registerCognitiveContributor(contributors.enrollmentCognition)
    .registerExperienceContributor(contributors.experience)
    .registerActionContributor(contributors.action)
    .registerEvidenceContributor(contributors.evidence)
    .registerMemoryContributor(contributors.memory)
    .registerTwinContributor(contributors.twin);
}

/** Build the Education DomainPackage (validated). */
export function buildEducationDomain(): DomainPackage {
  return createEducationDomainBuilder().build();
}
