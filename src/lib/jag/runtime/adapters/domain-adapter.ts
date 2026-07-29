/**
 * Canonical Domain Adapter contract (Ω-7B).
 *
 * Adapters register contributors; they never fork the Kernel or introduce
 * alternate execution paths. Implementations live outside Core.
 */

import type {
  ActionContributor,
  CognitiveContributor,
  ContextContributor,
  EvidenceContributor,
  ExperienceContributor,
  IdentityContributor,
  IntentContributor,
  MemoryContributor,
  TwinContributor,
} from "./contributors";

/**
 * Narrow registration surface passed to {@link DomainAdapter.register}.
 * Maps 1:1 to Runtime Registry contributor APIs.
 */
export interface DomainAdapterRegistrationApi {
  registerIdentityContributor(contributor: IdentityContributor): void;
  registerContextContributor(contributor: ContextContributor): void;
  registerIntentContributor(contributor: IntentContributor): void;
  registerCognitiveContributor(contributor: CognitiveContributor): void;
  registerExperienceContributor(contributor: ExperienceContributor): void;
  registerActionContributor(contributor: ActionContributor): void;
  registerEvidenceContributor(contributor: EvidenceContributor): void;
  registerMemoryContributor(contributor: MemoryContributor): void;
  registerTwinContributor(contributor: TwinContributor): void;
}

/**
 * Domain package entrypoint — contracts only in Core.
 *
 * A domain adapter installs by calling `register` with contributor
 * registrations. No Core business logic; no Education hardcoding.
 */
export interface DomainAdapter {
  id: string;
  name: string;
  version?: string;
  /** Runtime contract version this adapter targets. */
  runtimeContractVersion?: string;
  register(
    api: DomainAdapterRegistrationApi
  ): void | Promise<void>;
  unregister?(
    api: DomainAdapterRegistrationApi
  ): void | Promise<void>;
}
