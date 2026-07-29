/**
 * Canonical Runtime contributor contracts (Ω-7B).
 *
 * Domain packages participate only through these interfaces + registry
 * registration. No alternate execution paths.
 *
 * Implementations live outside Core — this module is contracts only.
 */

import type { ActionProvider } from "../action/action-provider";
import type { CognitiveProvider } from "../cognition/cognitive-provider";
import type { ContextProvider } from "../context/context-provider";
import type {
  EvidenceSet,
  RuntimeEvidenceReference,
} from "../contracts/evidence";
import type { RuntimeIdentity } from "../contracts/identity";
import type { RuntimeIntent } from "../contracts/intent";
import type { RuntimeMemoryReference } from "../contracts/memory";
import type { RuntimeOrganizationalContext } from "../contracts/organizational-context";
import type { RuntimeTwinReference } from "../contracts/twin";
import type { ExperienceProvider } from "../experience/experience-provider";
import type { IdentityProvider } from "../identity/identity-provider";
import type { IntentProvider } from "../intent/intent-provider";

/** Identity resolution contributor. */
export type IdentityContributor = IdentityProvider;

/** Organizational / situational context contributor. */
export type ContextContributor = ContextProvider;

/** Intent resolution contributor. */
export type IntentContributor = IntentProvider;

/** Cognitive reasoning contributor. */
export type CognitiveContributor = CognitiveProvider;

/** Experience composition contributor (widgets / briefing / nav). */
export type ExperienceContributor = ExperienceProvider;

/** Gated action dispatch contributor. */
export type ActionContributor = ActionProvider;

/** Shared input for post-Action publication contributors. */
export interface PublicationContributionInput {
  identity?: RuntimeIdentity;
  organizationalContext?: RuntimeOrganizationalContext;
  intent?: RuntimeIntent;
  actionId?: string;
  attributes?: Readonly<Record<string, unknown>>;
}

/**
 * Evidence publication / collection contributor (contract only).
 * Core does not ship Evidence engines.
 */
export interface EvidenceContributor {
  id: string;
  priority?: number;
  supports?(input: PublicationContributionInput): boolean;
  collect?(
    input: PublicationContributionInput
  ): Promise<EvidenceSet> | EvidenceSet;
  publish?(
    input: PublicationContributionInput
  ):
    | Promise<readonly RuntimeEvidenceReference[]>
    | readonly RuntimeEvidenceReference[];
}

/**
 * Memory publication contributor (contract only).
 * Core does not ship Memory engines.
 */
export interface MemoryContributor {
  id: string;
  priority?: number;
  supports?(input: PublicationContributionInput): boolean;
  publish?(
    input: PublicationContributionInput
  ):
    | Promise<readonly RuntimeMemoryReference[]>
    | readonly RuntimeMemoryReference[];
}

/**
 * Twin publication contributor (contract only).
 * Core does not ship Twin engines.
 */
export interface TwinContributor {
  id: string;
  priority?: number;
  supports?(input: PublicationContributionInput): boolean;
  publish?(
    input: PublicationContributionInput
  ):
    | Promise<readonly RuntimeTwinReference[]>
    | readonly RuntimeTwinReference[];
}
