import type {
  RuntimeDomainPackageRegistration,
  RuntimeExtension,
  RuntimePipelineStage,
} from "../contracts";
import { RUNTIME_KERNEL_EVENT_TYPES } from "../contracts/event";
import type {
  ActionContributor,
  CognitiveContributor,
  ContextContributor,
  DomainAdapterRegistrationApi,
  EvidenceContributor,
  ExperienceContributor,
  IdentityContributor,
  IntentContributor,
  MemoryContributor,
  TwinContributor,
} from "../adapters";
import { RuntimeExtensionError } from "../errors";
import type { RuntimeEventBus } from "../events";
import type { ContextProvider } from "../context/context-provider";
import type { ContextRuntime } from "../context/context-runtime";
import type { IdentityProvider } from "../identity/identity-provider";
import type { IdentityRuntime } from "../identity/identity-runtime";
import type { ActionProvider } from "../action/action-provider";
import type { ActionRuntime } from "../action/action-runtime";
import type { CognitiveProvider } from "../cognition/cognitive-provider";
import type { CognitiveRuntime } from "../cognition/cognitive-runtime";
import type { ExperienceProvider } from "../experience/experience-provider";
import type { ExperienceRuntime } from "../experience/experience-runtime";
import type { IntentProvider } from "../intent/intent-provider";
import type { IntentRuntime } from "../intent/intent-runtime";
import type { RuntimePipelineStageId } from "../types/stages";

export interface RuntimeRegistryOptions {
  events?: RuntimeEventBus;
  /** Opaque runtime handle for extension hooks. */
  runtimeRef?: () => unknown;
}

/**
 * Registration hub for domain packages, extensions, stages, and contributors.
 * Single extension model: Contributor registration → Contracts → Registry.
 * Does not register any industry pack by default.
 */
export class RuntimeRegistry {
  private readonly domainPackages = new Map<
    string,
    RuntimeDomainPackageRegistration
  >();
  private readonly extensions = new Map<string, RuntimeExtension>();
  private readonly stages = new Map<RuntimePipelineStageId, RuntimePipelineStage>();
  private readonly identityContributors = new Map<string, IdentityContributor>();
  private readonly contextContributors = new Map<string, ContextContributor>();
  private readonly intentContributors = new Map<string, IntentContributor>();
  private readonly experienceContributors = new Map<
    string,
    ExperienceContributor
  >();
  private readonly cognitiveContributors = new Map<
    string,
    CognitiveContributor
  >();
  private readonly actionContributors = new Map<string, ActionContributor>();
  private readonly evidenceContributors = new Map<string, EvidenceContributor>();
  private readonly memoryContributors = new Map<string, MemoryContributor>();
  private readonly twinContributors = new Map<string, TwinContributor>();
  private identityRuntime: IdentityRuntime | null = null;
  private contextRuntime: ContextRuntime | null = null;
  private intentRuntime: IntentRuntime | null = null;
  private experienceRuntime: ExperienceRuntime | null = null;
  private cognitiveRuntime: CognitiveRuntime | null = null;
  private actionRuntime: ActionRuntime | null = null;
  private readonly eventUnsubscribers = new Map<string, () => void>();
  private readonly events?: RuntimeEventBus;
  private readonly runtimeRef?: () => unknown;

  constructor(options: RuntimeRegistryOptions = {}) {
    this.events = options.events;
    this.runtimeRef = options.runtimeRef;
  }

  registerDomainPackage(pack: RuntimeDomainPackageRegistration): void {
    if (this.domainPackages.has(pack.id)) {
      throw new RuntimeExtensionError(
        `Domain package already registered: ${pack.id}`,
        { code: "RUNTIME_DOMAIN_PACKAGE_EXISTS" }
      );
    }
    this.domainPackages.set(pack.id, pack);
    void this.events?.publish(RUNTIME_KERNEL_EVENT_TYPES.EXTENSION_REGISTERED, {
      kind: "domain_package",
      id: pack.id,
    });
  }

  unregisterDomainPackage(id: string): boolean {
    const removed = this.domainPackages.delete(id);
    if (removed) {
      void this.events?.publish(
        RUNTIME_KERNEL_EVENT_TYPES.EXTENSION_UNREGISTERED,
        { kind: "domain_package", id }
      );
    }
    return removed;
  }

  getDomainPackage(id: string): RuntimeDomainPackageRegistration | undefined {
    return this.domainPackages.get(id);
  }

  listDomainPackages(): RuntimeDomainPackageRegistration[] {
    return [...this.domainPackages.values()];
  }

  async registerExtension(extension: RuntimeExtension): Promise<void> {
    if (this.extensions.has(extension.id)) {
      throw new RuntimeExtensionError(
        `Extension already registered: ${extension.id}`,
        { code: "RUNTIME_EXTENSION_EXISTS" }
      );
    }
    this.extensions.set(extension.id, { enabled: true, ...extension });
    if (extension.onRegister) {
      await extension.onRegister({
        extensionId: extension.id,
        runtime: this.runtimeRef?.() ?? null,
      });
    }
    void this.events?.publish(RUNTIME_KERNEL_EVENT_TYPES.EXTENSION_REGISTERED, {
      kind: extension.kind,
      id: extension.id,
    });
  }

  async unregisterExtension(id: string): Promise<boolean> {
    const extension = this.extensions.get(id);
    if (!extension) return false;
    if (extension.onUnregister) {
      await extension.onUnregister({
        extensionId: extension.id,
        runtime: this.runtimeRef?.() ?? null,
      });
    }
    this.extensions.delete(id);
    const unsub = this.eventUnsubscribers.get(`ext:${id}`);
    unsub?.();
    this.eventUnsubscribers.delete(`ext:${id}`);
    void this.events?.publish(
      RUNTIME_KERNEL_EVENT_TYPES.EXTENSION_UNREGISTERED,
      { kind: extension.kind, id }
    );
    return true;
  }

  getExtension(id: string): RuntimeExtension | undefined {
    return this.extensions.get(id);
  }

  listExtensions(): RuntimeExtension[] {
    return [...this.extensions.values()];
  }

  registerPipelineStage(stage: RuntimePipelineStage): void {
    this.stages.set(stage.id, stage);
    void this.events?.publish(RUNTIME_KERNEL_EVENT_TYPES.EXTENSION_REGISTERED, {
      kind: "pipeline_stage",
      id: stage.id,
    });
  }

  unregisterPipelineStage(id: RuntimePipelineStageId): boolean {
    return this.stages.delete(id);
  }

  getPipelineStage(id: RuntimePipelineStageId): RuntimePipelineStage | undefined {
    return this.stages.get(id);
  }

  listPipelineStages(): RuntimePipelineStage[] {
    return [...this.stages.values()];
  }

  registerEventListener(
    id: string,
    eventType: string | "*",
    handler: (event: unknown) => void | Promise<void>,
    options: { priority?: number } = {}
  ): void {
    if (!this.events) {
      throw new RuntimeExtensionError(
        "Event bus not available on registry",
        { code: "RUNTIME_EVENTS_UNAVAILABLE" }
      );
    }
    if (this.eventUnsubscribers.has(id)) {
      throw new RuntimeExtensionError(
        `Event listener already registered: ${id}`,
        { code: "RUNTIME_LISTENER_EXISTS" }
      );
    }
    const unsub = this.events.subscribe(eventType, handler, options);
    this.eventUnsubscribers.set(id, unsub);
    void this.events.publish(RUNTIME_KERNEL_EVENT_TYPES.EXTENSION_REGISTERED, {
      kind: "event_listener",
      id,
      eventType,
    });
  }

  unregisterEventListener(id: string): boolean {
    const unsub = this.eventUnsubscribers.get(id);
    if (!unsub) return false;
    unsub();
    this.eventUnsubscribers.delete(id);
    return true;
  }

  // ── Identity ──────────────────────────────────────────────────────────

  registerIdentityContributor(contributor: IdentityContributor): void {
    if (this.identityContributors.has(contributor.id)) {
      throw new RuntimeExtensionError(
        `Identity contributor already registered: ${contributor.id}`,
        { code: "RUNTIME_IDENTITY_CONTRIBUTOR_EXISTS" }
      );
    }
    this.identityContributors.set(contributor.id, contributor);
    void this.events?.publish(RUNTIME_KERNEL_EVENT_TYPES.EXTENSION_REGISTERED, {
      kind: "identity_contributor",
      id: contributor.id,
    });
  }

  /** @deprecated Use {@link registerIdentityContributor}. */
  registerIdentityProvider(provider: IdentityProvider): void {
    this.registerIdentityContributor(provider);
  }

  unregisterIdentityContributor(id: string): boolean {
    return this.identityContributors.delete(id);
  }

  /** @deprecated Use {@link unregisterIdentityContributor}. */
  unregisterIdentityProvider(id: string): boolean {
    return this.unregisterIdentityContributor(id);
  }

  listIdentityContributors(): IdentityContributor[] {
    return [...this.identityContributors.values()].sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
    );
  }

  /** @deprecated Use {@link listIdentityContributors}. */
  listIdentityProviders(): IdentityProvider[] {
    return this.listIdentityContributors();
  }

  setIdentityRuntime(identity: IdentityRuntime | null): void {
    this.identityRuntime = identity;
  }

  getIdentityRuntime(): IdentityRuntime | null {
    return this.identityRuntime;
  }

  // ── Context ───────────────────────────────────────────────────────────

  registerContextContributor(contributor: ContextContributor): void {
    if (this.contextContributors.has(contributor.id)) {
      throw new RuntimeExtensionError(
        `Context contributor already registered: ${contributor.id}`,
        { code: "RUNTIME_CONTEXT_CONTRIBUTOR_EXISTS" }
      );
    }
    this.contextContributors.set(contributor.id, contributor);
    void this.events?.publish(RUNTIME_KERNEL_EVENT_TYPES.EXTENSION_REGISTERED, {
      kind: "context_contributor",
      id: contributor.id,
    });
  }

  /** @deprecated Use {@link registerContextContributor}. */
  registerContextProvider(provider: ContextProvider): void {
    this.registerContextContributor(provider);
  }

  unregisterContextContributor(id: string): boolean {
    return this.contextContributors.delete(id);
  }

  /** @deprecated Use {@link unregisterContextContributor}. */
  unregisterContextProvider(id: string): boolean {
    return this.unregisterContextContributor(id);
  }

  listContextContributors(): ContextContributor[] {
    return [...this.contextContributors.values()].sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
    );
  }

  /** @deprecated Use {@link listContextContributors}. */
  listContextProviders(): ContextProvider[] {
    return this.listContextContributors();
  }

  setContextRuntime(context: ContextRuntime | null): void {
    this.contextRuntime = context;
  }

  getContextRuntime(): ContextRuntime | null {
    return this.contextRuntime;
  }

  // ── Intent ────────────────────────────────────────────────────────────

  registerIntentContributor(contributor: IntentContributor): void {
    if (this.intentContributors.has(contributor.id)) {
      throw new RuntimeExtensionError(
        `Intent contributor already registered: ${contributor.id}`,
        { code: "RUNTIME_INTENT_CONTRIBUTOR_EXISTS" }
      );
    }
    this.intentContributors.set(contributor.id, contributor);
    void this.events?.publish(RUNTIME_KERNEL_EVENT_TYPES.EXTENSION_REGISTERED, {
      kind: "intent_contributor",
      id: contributor.id,
    });
  }

  /** @deprecated Use {@link registerIntentContributor}. */
  registerIntentProvider(provider: IntentProvider): void {
    this.registerIntentContributor(provider);
  }

  unregisterIntentContributor(id: string): boolean {
    return this.intentContributors.delete(id);
  }

  /** @deprecated Use {@link unregisterIntentContributor}. */
  unregisterIntentProvider(id: string): boolean {
    return this.unregisterIntentContributor(id);
  }

  listIntentContributors(): IntentContributor[] {
    return [...this.intentContributors.values()].sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
    );
  }

  /** @deprecated Use {@link listIntentContributors}. */
  listIntentProviders(): IntentProvider[] {
    return this.listIntentContributors();
  }

  setIntentRuntime(intent: IntentRuntime | null): void {
    this.intentRuntime = intent;
  }

  getIntentRuntime(): IntentRuntime | null {
    return this.intentRuntime;
  }

  // ── Experience ────────────────────────────────────────────────────────

  registerExperienceContributor(contributor: ExperienceContributor): void {
    if (this.experienceContributors.has(contributor.id)) {
      throw new RuntimeExtensionError(
        `Experience contributor already registered: ${contributor.id}`,
        { code: "RUNTIME_EXPERIENCE_CONTRIBUTOR_EXISTS" }
      );
    }
    this.experienceContributors.set(contributor.id, contributor);
    void this.events?.publish(RUNTIME_KERNEL_EVENT_TYPES.EXTENSION_REGISTERED, {
      kind: "experience_contributor",
      id: contributor.id,
    });
  }

  unregisterExperienceContributor(id: string): boolean {
    return this.experienceContributors.delete(id);
  }

  listExperienceContributors(): ExperienceContributor[] {
    return [...this.experienceContributors.values()].sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
    );
  }

  setExperienceRuntime(experience: ExperienceRuntime | null): void {
    this.experienceRuntime = experience;
  }

  getExperienceRuntime(): ExperienceRuntime | null {
    return this.experienceRuntime;
  }

  // ── Cognition ─────────────────────────────────────────────────────────

  registerCognitiveContributor(contributor: CognitiveContributor): void {
    if (this.cognitiveContributors.has(contributor.id)) {
      throw new RuntimeExtensionError(
        `Cognitive contributor already registered: ${contributor.id}`,
        { code: "RUNTIME_COGNITIVE_CONTRIBUTOR_EXISTS" }
      );
    }
    this.cognitiveContributors.set(contributor.id, contributor);
    void this.events?.publish(RUNTIME_KERNEL_EVENT_TYPES.EXTENSION_REGISTERED, {
      kind: "cognitive_contributor",
      id: contributor.id,
    });
  }

  /** @deprecated Use {@link registerCognitiveContributor}. */
  registerCognitiveProvider(provider: CognitiveProvider): void {
    this.registerCognitiveContributor(provider);
  }

  unregisterCognitiveContributor(id: string): boolean {
    return this.cognitiveContributors.delete(id);
  }

  /** @deprecated Use {@link unregisterCognitiveContributor}. */
  unregisterCognitiveProvider(id: string): boolean {
    return this.unregisterCognitiveContributor(id);
  }

  listCognitiveContributors(): CognitiveContributor[] {
    return [...this.cognitiveContributors.values()].sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
    );
  }

  /** @deprecated Use {@link listCognitiveContributors}. */
  listCognitiveProviders(): CognitiveProvider[] {
    return this.listCognitiveContributors();
  }

  setCognitiveRuntime(cognition: CognitiveRuntime | null): void {
    this.cognitiveRuntime = cognition;
  }

  getCognitiveRuntime(): CognitiveRuntime | null {
    return this.cognitiveRuntime;
  }

  // ── Action ────────────────────────────────────────────────────────────

  registerActionContributor(contributor: ActionContributor): void {
    if (this.actionContributors.has(contributor.id)) {
      throw new RuntimeExtensionError(
        `Action contributor already registered: ${contributor.id}`,
        { code: "RUNTIME_ACTION_CONTRIBUTOR_EXISTS" }
      );
    }
    this.actionContributors.set(contributor.id, contributor);
    void this.events?.publish(RUNTIME_KERNEL_EVENT_TYPES.EXTENSION_REGISTERED, {
      kind: "action_contributor",
      id: contributor.id,
    });
  }

  unregisterActionContributor(id: string): boolean {
    return this.actionContributors.delete(id);
  }

  listActionContributors(): ActionContributor[] {
    return [...this.actionContributors.values()].sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
    );
  }

  setActionRuntime(action: ActionRuntime | null): void {
    this.actionRuntime = action;
  }

  getActionRuntime(): ActionRuntime | null {
    return this.actionRuntime;
  }

  // ── Evidence / Memory / Twin (registration only — no Core engines) ────

  registerEvidenceContributor(contributor: EvidenceContributor): void {
    if (this.evidenceContributors.has(contributor.id)) {
      throw new RuntimeExtensionError(
        `Evidence contributor already registered: ${contributor.id}`,
        { code: "RUNTIME_EVIDENCE_CONTRIBUTOR_EXISTS" }
      );
    }
    this.evidenceContributors.set(contributor.id, contributor);
    void this.events?.publish(RUNTIME_KERNEL_EVENT_TYPES.EXTENSION_REGISTERED, {
      kind: "evidence_contributor",
      id: contributor.id,
    });
  }

  unregisterEvidenceContributor(id: string): boolean {
    return this.evidenceContributors.delete(id);
  }

  listEvidenceContributors(): EvidenceContributor[] {
    return [...this.evidenceContributors.values()].sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
    );
  }

  registerMemoryContributor(contributor: MemoryContributor): void {
    if (this.memoryContributors.has(contributor.id)) {
      throw new RuntimeExtensionError(
        `Memory contributor already registered: ${contributor.id}`,
        { code: "RUNTIME_MEMORY_CONTRIBUTOR_EXISTS" }
      );
    }
    this.memoryContributors.set(contributor.id, contributor);
    void this.events?.publish(RUNTIME_KERNEL_EVENT_TYPES.EXTENSION_REGISTERED, {
      kind: "memory_contributor",
      id: contributor.id,
    });
  }

  unregisterMemoryContributor(id: string): boolean {
    return this.memoryContributors.delete(id);
  }

  listMemoryContributors(): MemoryContributor[] {
    return [...this.memoryContributors.values()].sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
    );
  }

  registerTwinContributor(contributor: TwinContributor): void {
    if (this.twinContributors.has(contributor.id)) {
      throw new RuntimeExtensionError(
        `Twin contributor already registered: ${contributor.id}`,
        { code: "RUNTIME_TWIN_CONTRIBUTOR_EXISTS" }
      );
    }
    this.twinContributors.set(contributor.id, contributor);
    void this.events?.publish(RUNTIME_KERNEL_EVENT_TYPES.EXTENSION_REGISTERED, {
      kind: "twin_contributor",
      id: contributor.id,
    });
  }

  unregisterTwinContributor(id: string): boolean {
    return this.twinContributors.delete(id);
  }

  listTwinContributors(): TwinContributor[] {
    return [...this.twinContributors.values()].sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
    );
  }

  /**
   * Narrow contributor registration surface for {@link DomainAdapter.register}.
   */
  asDomainAdapterApi(): DomainAdapterRegistrationApi {
    return {
      registerIdentityContributor: (c) => this.registerIdentityContributor(c),
      registerContextContributor: (c) => this.registerContextContributor(c),
      registerIntentContributor: (c) => this.registerIntentContributor(c),
      registerCognitiveContributor: (c) => this.registerCognitiveContributor(c),
      registerExperienceContributor: (c) =>
        this.registerExperienceContributor(c),
      registerActionContributor: (c) => this.registerActionContributor(c),
      registerEvidenceContributor: (c) => this.registerEvidenceContributor(c),
      registerMemoryContributor: (c) => this.registerMemoryContributor(c),
      registerTwinContributor: (c) => this.registerTwinContributor(c),
    };
  }

  clear(): void {
    for (const unsub of this.eventUnsubscribers.values()) unsub();
    this.eventUnsubscribers.clear();
    this.domainPackages.clear();
    this.extensions.clear();
    this.stages.clear();
    this.identityContributors.clear();
    this.contextContributors.clear();
    this.intentContributors.clear();
    this.experienceContributors.clear();
    this.cognitiveContributors.clear();
    this.actionContributors.clear();
    this.evidenceContributors.clear();
    this.memoryContributors.clear();
    this.twinContributors.clear();
    this.identityRuntime = null;
    this.contextRuntime = null;
    this.intentRuntime = null;
    this.experienceRuntime = null;
    this.cognitiveRuntime = null;
    this.actionRuntime = null;
  }
}

export function createRuntimeRegistry(
  options?: RuntimeRegistryOptions
): RuntimeRegistry {
  return new RuntimeRegistry(options);
}
