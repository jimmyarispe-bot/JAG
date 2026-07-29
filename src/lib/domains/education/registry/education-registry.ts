/**
 * Education domain registration helpers — SDK registry + Runtime host.
 * No auto-loading.
 */

import {
  createDomainLifecycle,
  createDomainRegistry,
  createDomainSdk,
  validateDomain,
  type DomainLifecycleController,
  type DomainPackage,
  type DomainRegistry,
  type DomainValidationResult,
} from "@/lib/jag/domain-sdk";
import type { DomainAdapterRegistrationApi } from "@/lib/jag/runtime";
import {
  DOMAIN_SDK_MINIMUM_CORE,
  DOMAIN_SDK_RUNTIME_CONTRACT,
  DOMAIN_SDK_VERSION,
} from "@/lib/jag/domain-sdk";
import { buildEducationDomain } from "../builder";
import { EDUCATION_DOMAIN_ID } from "../types";

export interface EducationRegistrationHost {
  registrationApi: DomainAdapterRegistrationApi;
  runtimeVersion?: string;
  coreVersion?: string;
  sdkVersion?: string;
}

export interface EducationRegistrationResult {
  domain: DomainPackage;
  registry: DomainRegistry;
  lifecycle: DomainLifecycleController;
  validation: DomainValidationResult;
}

/** Create an SDK registry preconfigured for Education host versions. */
export function createEducationDomainRegistry(
  options: {
    runtimeVersion?: string;
    coreVersion?: string;
    sdkVersion?: string;
  } = {}
): DomainRegistry {
  return createDomainRegistry({
    runtimeVersion: options.runtimeVersion ?? DOMAIN_SDK_RUNTIME_CONTRACT,
    coreVersion: options.coreVersion ?? DOMAIN_SDK_MINIMUM_CORE,
    sdkVersion: options.sdkVersion ?? DOMAIN_SDK_VERSION,
  });
}

/**
 * Build, validate, register, enable, install, initialize, and activate
 * the Education domain against a Runtime registration API.
 */
export async function registerEducationDomain(
  host: EducationRegistrationHost
): Promise<EducationRegistrationResult> {
  const sdk = createDomainSdk();
  const domain = buildEducationDomain();

  const runtimeVersion = host.runtimeVersion ?? DOMAIN_SDK_RUNTIME_CONTRACT;
  const coreVersion = host.coreVersion ?? DOMAIN_SDK_MINIMUM_CORE;
  const sdkVersion = host.sdkVersion ?? DOMAIN_SDK_VERSION;

  const validation = validateDomain(domain.manifest, {
    bundle: domain.bundle,
    host: { runtimeVersion, coreVersion, sdkVersion },
  });
  if (!validation.ok) {
    throw new Error(
      `Education domain validation failed: ${validation.errors
        .map((e) => e.message)
        .join("; ")}`
    );
  }

  const registry = sdk.createRegistry({
    runtimeVersion,
    coreVersion,
    sdkVersion,
  });
  registry.register(domain);
  registry.enable(EDUCATION_DOMAIN_ID);

  const lifecycle = createDomainLifecycle({
    registrationApi: host.registrationApi,
    runtimeVersion,
    coreVersion,
    sdkVersion,
  });
  await lifecycle.install(domain);
  await lifecycle.initialize(EDUCATION_DOMAIN_ID);
  await lifecycle.activate(EDUCATION_DOMAIN_ID);

  return { domain, registry, lifecycle, validation };
}
