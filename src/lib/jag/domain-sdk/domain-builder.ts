/**
 * Fluent Domain Builder — assembles a domain from registered contributors.
 * Infrastructure only; no industry implementations.
 */

import type {
  ActionContributor,
  CognitiveContributor,
  ContextContributor,
  DomainAdapter,
  DomainAdapterRegistrationApi,
  EvidenceContributor,
  ExperienceContributor,
  IdentityContributor,
  IntentContributor,
  MemoryContributor,
  TwinContributor,
} from "@/lib/jag/runtime";
import type { DomainCapability } from "./domain-capabilities";
import {
  createDomainManifest,
  type DomainManifest,
  type DomainManifestInput,
} from "./domain-manifest";
import type {
  DomainContributorBundle,
  DomainContributorDeclaration,
  DomainMetadata,
} from "./domain-metadata";
import { emptyContributorBundle } from "./domain-metadata";
import { validateDomainManifest } from "./domain-validation";

export interface DomainPackage {
  manifest: DomainManifest;
  bundle: DomainContributorBundle;
  metadata: DomainMetadata;
  /** Adapter that registers contributors onto a Runtime host API. */
  adapter: DomainAdapter;
}

export interface DomainBuilder {
  withDisplayName(displayName: string): DomainBuilder;
  withDescription(description: string): DomainBuilder;
  withVersion(version: string): DomainBuilder;
  withOwner(owner: DomainManifest["owner"]): DomainBuilder;
  withCapabilities(...capabilities: DomainCapability[]): DomainBuilder;
  withPermission(
    key: string,
    options?: { description?: string; actionScoped?: boolean }
  ): DomainBuilder;
  withDependency(
    domainId: string,
    versionRange: string,
    optional?: boolean
  ): DomainBuilder;
  withFeatureFlag(key: string, enabled: boolean): DomainBuilder;
  withMetadata(metadata: DomainMetadata): DomainBuilder;
  withRequiredRuntimeVersion(version: string): DomainBuilder;
  withMinimumCoreVersion(version: string): DomainBuilder;
  withRequiredSdkVersion(version: string): DomainBuilder;
  declareContributor(declaration: DomainContributorDeclaration): DomainBuilder;

  registerIdentityContributor(contributor: IdentityContributor): DomainBuilder;
  registerContextContributor(contributor: ContextContributor): DomainBuilder;
  registerIntentContributor(contributor: IntentContributor): DomainBuilder;
  registerCognitiveContributor(contributor: CognitiveContributor): DomainBuilder;
  registerExperienceContributor(
    contributor: ExperienceContributor
  ): DomainBuilder;
  registerActionContributor(contributor: ActionContributor): DomainBuilder;
  registerEvidenceContributor(contributor: EvidenceContributor): DomainBuilder;
  registerMemoryContributor(contributor: MemoryContributor): DomainBuilder;
  registerTwinContributor(contributor: TwinContributor): DomainBuilder;

  /** Build without throwing; returns validation errors when invalid. */
  tryBuild(): { ok: true; domain: DomainPackage } | {
    ok: false;
    errors: string[];
  };
  /** Build or throw on validation failure. */
  build(): DomainPackage;
}

interface MutableBundle {
  identity: IdentityContributor[];
  context: ContextContributor[];
  intent: IntentContributor[];
  cognition: CognitiveContributor[];
  experience: ExperienceContributor[];
  action: ActionContributor[];
  evidence: EvidenceContributor[];
  memory: MemoryContributor[];
  twin: TwinContributor[];
}

export function createDomainBuilder(
  base: DomainManifestInput
): DomainBuilder {
  return new DomainBuilderImpl(base);
}

class DomainBuilderImpl implements DomainBuilder {
  private readonly base: DomainManifestInput;
  private readonly bundle: MutableBundle = {
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
  private capabilities: DomainCapability[];
  private contributorDeclarations: DomainContributorDeclaration[];
  private permissions: DomainManifest["permissions"][number][];
  private dependencies: DomainManifest["dependencies"][number][];
  private featureFlags: Record<string, boolean>;
  private metadata: DomainMetadata;
  private displayName: string;
  private description: string;
  private version: string;
  private owner: DomainManifest["owner"];
  private requiredRuntimeVersion: string;
  private minimumCoreVersion: string;
  private requiredSdkVersion?: string;

  constructor(base: DomainManifestInput) {
    this.base = base;
    this.capabilities = [...(base.supportedCapabilities ?? [])];
    this.contributorDeclarations = [...(base.contributors ?? [])];
    this.permissions = [...(base.permissions ?? [])];
    this.dependencies = [...(base.dependencies ?? [])];
    this.featureFlags = { ...(base.featureFlags ?? {}) };
    this.metadata = { ...(base.metadata ?? {}) };
    this.displayName = base.displayName;
    this.description = base.description;
    this.version = base.version;
    this.owner = base.owner;
    this.requiredRuntimeVersion = base.requiredRuntimeVersion;
    this.minimumCoreVersion = base.minimumCoreVersion;
    this.requiredSdkVersion = base.requiredSdkVersion;
  }

  withDisplayName(displayName: string): DomainBuilder {
    this.displayName = displayName;
    return this;
  }

  withDescription(description: string): DomainBuilder {
    this.description = description;
    return this;
  }

  withVersion(version: string): DomainBuilder {
    this.version = version;
    return this;
  }

  withOwner(owner: DomainManifest["owner"]): DomainBuilder {
    this.owner = owner;
    return this;
  }

  withCapabilities(...capabilities: DomainCapability[]): DomainBuilder {
    for (const c of capabilities) {
      if (!this.capabilities.includes(c)) this.capabilities.push(c);
    }
    return this;
  }

  withPermission(
    key: string,
    options?: { description?: string; actionScoped?: boolean }
  ): DomainBuilder {
    this.permissions.push({
      key,
      description: options?.description,
      actionScoped: options?.actionScoped,
    });
    return this;
  }

  withDependency(
    domainId: string,
    versionRange: string,
    optional?: boolean
  ): DomainBuilder {
    this.dependencies.push({ domainId, versionRange, optional });
    return this;
  }

  withFeatureFlag(key: string, enabled: boolean): DomainBuilder {
    this.featureFlags[key] = enabled;
    return this;
  }

  withMetadata(metadata: DomainMetadata): DomainBuilder {
    this.metadata = { ...this.metadata, ...metadata };
    return this;
  }

  withRequiredRuntimeVersion(version: string): DomainBuilder {
    this.requiredRuntimeVersion = version;
    return this;
  }

  withMinimumCoreVersion(version: string): DomainBuilder {
    this.minimumCoreVersion = version;
    return this;
  }

  withRequiredSdkVersion(version: string): DomainBuilder {
    this.requiredSdkVersion = version;
    return this;
  }

  declareContributor(declaration: DomainContributorDeclaration): DomainBuilder {
    this.contributorDeclarations.push(declaration);
    return this;
  }

  registerIdentityContributor(contributor: IdentityContributor): DomainBuilder {
    this.bundle.identity.push(contributor);
    this.ensureDeclaration(contributor.id, "identity");
    return this;
  }

  registerContextContributor(contributor: ContextContributor): DomainBuilder {
    this.bundle.context.push(contributor);
    this.ensureDeclaration(contributor.id, "context");
    this.withCapabilities("context");
    return this;
  }

  registerIntentContributor(contributor: IntentContributor): DomainBuilder {
    this.bundle.intent.push(contributor);
    this.ensureDeclaration(contributor.id, "intent");
    this.withCapabilities("intent");
    return this;
  }

  registerCognitiveContributor(
    contributor: CognitiveContributor
  ): DomainBuilder {
    this.bundle.cognition.push(contributor);
    this.ensureDeclaration(contributor.id, "cognition");
    this.withCapabilities("cognition");
    return this;
  }

  registerExperienceContributor(
    contributor: ExperienceContributor
  ): DomainBuilder {
    this.bundle.experience.push(contributor);
    this.ensureDeclaration(contributor.id, "experience");
    this.withCapabilities("experience");
    return this;
  }

  registerActionContributor(contributor: ActionContributor): DomainBuilder {
    this.bundle.action.push(contributor);
    this.ensureDeclaration(contributor.id, "action");
    this.withCapabilities("action");
    return this;
  }

  registerEvidenceContributor(
    contributor: EvidenceContributor
  ): DomainBuilder {
    this.bundle.evidence.push(contributor);
    this.ensureDeclaration(contributor.id, "evidence");
    this.withCapabilities("evidence");
    return this;
  }

  registerMemoryContributor(contributor: MemoryContributor): DomainBuilder {
    this.bundle.memory.push(contributor);
    this.ensureDeclaration(contributor.id, "memory");
    this.withCapabilities("memory");
    return this;
  }

  registerTwinContributor(contributor: TwinContributor): DomainBuilder {
    this.bundle.twin.push(contributor);
    this.ensureDeclaration(contributor.id, "twin");
    this.withCapabilities("twin");
    return this;
  }

  tryBuild(): { ok: true; domain: DomainPackage } | { ok: false; errors: string[] } {
    const domain = this.assemble();
    const result = validateDomainManifest(domain.manifest, {
      bundle: domain.bundle,
    });
    if (!result.ok) {
      return {
        ok: false,
        errors: result.errors.map((e) => e.message),
      };
    }
    return { ok: true, domain };
  }

  build(): DomainPackage {
    const result = this.tryBuild();
    if (!result.ok) {
      throw new Error(
        `Domain build failed:\n- ${result.errors.join("\n- ")}`
      );
    }
    return result.domain;
  }

  private ensureDeclaration(id: string, kind: DomainCapability): void {
    if (!this.contributorDeclarations.some((d) => d.id === id)) {
      this.contributorDeclarations.push({ id, kind });
    }
  }

  private assemble(): DomainPackage {
    const manifest = createDomainManifest({
      ...this.base,
      displayName: this.displayName,
      description: this.description,
      version: this.version,
      owner: this.owner,
      requiredRuntimeVersion: this.requiredRuntimeVersion,
      minimumCoreVersion: this.minimumCoreVersion,
      requiredSdkVersion: this.requiredSdkVersion,
      supportedCapabilities: this.capabilities,
      contributors: this.contributorDeclarations,
      permissions: this.permissions,
      dependencies: this.dependencies,
      featureFlags: this.featureFlags,
      metadata: this.metadata,
    });

    const bundle: DomainContributorBundle = {
      identity: [...this.bundle.identity],
      context: [...this.bundle.context],
      intent: [...this.bundle.intent],
      cognition: [...this.bundle.cognition],
      experience: [...this.bundle.experience],
      action: [...this.bundle.action],
      evidence: [...this.bundle.evidence],
      memory: [...this.bundle.memory],
      twin: [...this.bundle.twin],
    };

    return {
      manifest,
      bundle,
      metadata: this.metadata,
      adapter: createAdapterFromBundle(manifest, bundle),
    };
  }
}

function createAdapterFromBundle(
  manifest: DomainManifest,
  bundle: DomainContributorBundle
): DomainAdapter {
  return {
    id: manifest.id,
    name: manifest.name,
    version: manifest.version,
    runtimeContractVersion: manifest.requiredRuntimeVersion,
    async register(api: DomainAdapterRegistrationApi) {
      for (const c of bundle.identity) api.registerIdentityContributor(c);
      for (const c of bundle.context) api.registerContextContributor(c);
      for (const c of bundle.intent) api.registerIntentContributor(c);
      for (const c of bundle.cognition) api.registerCognitiveContributor(c);
      for (const c of bundle.experience) api.registerExperienceContributor(c);
      for (const c of bundle.action) api.registerActionContributor(c);
      for (const c of bundle.evidence) api.registerEvidenceContributor(c);
      for (const c of bundle.memory) api.registerMemoryContributor(c);
      for (const c of bundle.twin) api.registerTwinContributor(c);
    },
  };
}

export { emptyContributorBundle };
