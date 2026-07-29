/**
 * JAG Domain SDK — facade for the universal domain framework.
 *
 * Domains plug into JAG through this SDK without modifying Core.
 * Education is only one future consumer among many industries.
 */

import { createDomainBuilder, type DomainBuilder } from "./domain-builder";
import type { DomainManifestInput } from "./domain-manifest";
import {
  createDomainLifecycle,
  type DomainLifecycleController,
  type DomainLifecycleHost,
} from "./domain-lifecycle";
import {
  createDomainRegistry,
  type DomainRegistry,
  type DomainRegistryOptions,
} from "./domain-registry";
import {
  validateDomain,
  type DomainValidationOptions,
  type DomainValidationResult,
} from "./domain-validation";
import type { DomainManifest } from "./domain-manifest";
import {
  DOMAIN_SDK_MINIMUM_CORE,
  DOMAIN_SDK_RUNTIME_CONTRACT,
  DOMAIN_SDK_VERSION,
  checkVersionCompatibility,
  type VersionCompatibilityInput,
  type VersionCompatibilityResult,
} from "./domain-version";

export interface DomainSdk {
  readonly version: typeof DOMAIN_SDK_VERSION;
  readonly runtimeContract: typeof DOMAIN_SDK_RUNTIME_CONTRACT;
  readonly minimumCore: typeof DOMAIN_SDK_MINIMUM_CORE;
  createBuilder(base: DomainManifestInput): DomainBuilder;
  createRegistry(options?: DomainRegistryOptions): DomainRegistry;
  createLifecycle(host: DomainLifecycleHost): DomainLifecycleController;
  validateManifest(
    manifest: DomainManifest,
    options?: DomainValidationOptions
  ): DomainValidationResult;
  checkCompatibility(
    input: VersionCompatibilityInput
  ): VersionCompatibilityResult;
}

export interface CreateDomainSdkOptions {
  /** Reserved for future host defaults — unused today. */
  defaults?: DomainRegistryOptions;
}

export function createDomainSdk(
  options: CreateDomainSdkOptions = {}
): DomainSdk {
  return {
    version: DOMAIN_SDK_VERSION,
    runtimeContract: DOMAIN_SDK_RUNTIME_CONTRACT,
    minimumCore: DOMAIN_SDK_MINIMUM_CORE,
    createBuilder(base) {
      return createDomainBuilder(base);
    },
    createRegistry(registryOptions) {
      return createDomainRegistry({
        ...options.defaults,
        ...registryOptions,
      });
    },
    createLifecycle(host) {
      return createDomainLifecycle(host);
    },
    validateManifest(manifest, validationOptions) {
      return validateDomain(manifest, validationOptions);
    },
    checkCompatibility(input) {
      return checkVersionCompatibility(input);
    },
  };
}

/** Singleton convenience accessor — still no auto-loading of domains. */
let defaultSdk: DomainSdk | null = null;

export function getDomainSdk(): DomainSdk {
  if (!defaultSdk) defaultSdk = createDomainSdk();
  return defaultSdk;
}
