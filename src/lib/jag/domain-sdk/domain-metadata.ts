/**
 * Optional domain metadata — not required for Runtime participation.
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
} from "@/lib/jag/runtime";
import type { DomainCapability } from "./domain-capabilities";

export interface DomainOwner {
  name: string;
  email?: string;
  organization?: string;
  url?: string;
}

export interface DomainDependency {
  /** Dependent domain id (another domain pack), not Core. */
  domainId: string;
  /** Semver range (e.g. ^1.0.0, >=0.2.0). */
  versionRange: string;
  optional?: boolean;
}

export interface DomainContributorDeclaration {
  id: string;
  kind: DomainCapability;
  description?: string;
}

export interface DomainMetadata {
  tags?: readonly string[];
  industries?: readonly string[];
  homepage?: string;
  repository?: string;
  license?: string;
  /** Opaque pack attributes — never interpreted by Core. */
  attributes?: Readonly<Record<string, unknown>>;
}

export interface DomainPermissionDeclaration {
  key: string;
  description?: string;
  /** When true, Action catalog entries may require this permission. */
  actionScoped?: boolean;
}

/** Collected contributor instances for a domain package (no industry logic). */
export interface DomainContributorBundle {
  identity: readonly IdentityContributor[];
  context: readonly ContextContributor[];
  intent: readonly IntentContributor[];
  cognition: readonly CognitiveContributor[];
  experience: readonly ExperienceContributor[];
  action: readonly ActionContributor[];
  evidence: readonly EvidenceContributor[];
  memory: readonly MemoryContributor[];
  twin: readonly TwinContributor[];
}

export function emptyContributorBundle(): DomainContributorBundle {
  return {
    identity: [],
    context: [],
    intent: [],
    cognition: [],
    experience: [],
    action: [],
    evidence: [],
    memory: [],
    twin: [],
  };
}
