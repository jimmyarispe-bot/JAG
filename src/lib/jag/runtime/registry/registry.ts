import type {
  RuntimeActionProvider,
  RuntimeDomainPackageRegistration,
  RuntimeExperienceProvider,
  RuntimeExtension,
  RuntimePipelineStage,
} from "../contracts";
import { RUNTIME_KERNEL_EVENT_TYPES } from "../contracts/event";
import { RuntimeExtensionError } from "../errors";
import type { RuntimeEventBus } from "../events";
import type { ContextProvider } from "../context/context-provider";
import type { ContextRuntime } from "../context/context-runtime";
import type { IdentityProvider } from "../identity/identity-provider";
import type { IdentityRuntime } from "../identity/identity-runtime";
import type { IntentProvider } from "../intent/intent-provider";
import type { IntentRuntime } from "../intent/intent-runtime";
import type { RuntimePipelineStageId } from "../types/stages";

export interface RuntimeRegistryOptions {
  events?: RuntimeEventBus;
  /** Opaque runtime handle for extension hooks. */
  runtimeRef?: () => unknown;
}

/**
 * Registration hub for domain packages, extensions, stages, and providers.
 * Does not register any industry pack by default.
 */
export class RuntimeRegistry {
  private readonly domainPackages = new Map<
    string,
    RuntimeDomainPackageRegistration
  >();
  private readonly extensions = new Map<string, RuntimeExtension>();
  private readonly stages = new Map<RuntimePipelineStageId, RuntimePipelineStage>();
  private readonly experienceProviders = new Map<string, RuntimeExperienceProvider>();
  private readonly actionProviders = new Map<string, RuntimeActionProvider>();
  private readonly identityProviders = new Map<string, IdentityProvider>();
  private readonly contextProviders = new Map<string, ContextProvider>();
  private readonly intentProviders = new Map<string, IntentProvider>();
  private identityRuntime: IdentityRuntime | null = null;
  private contextRuntime: ContextRuntime | null = null;
  private intentRuntime: IntentRuntime | null = null;
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

  registerExperienceProvider(provider: RuntimeExperienceProvider): void {
    if (this.experienceProviders.has(provider.id)) {
      throw new RuntimeExtensionError(
        `Experience provider already registered: ${provider.id}`,
        { code: "RUNTIME_EXPERIENCE_PROVIDER_EXISTS" }
      );
    }
    this.experienceProviders.set(provider.id, provider);
  }

  unregisterExperienceProvider(id: string): boolean {
    return this.experienceProviders.delete(id);
  }

  listExperienceProviders(): RuntimeExperienceProvider[] {
    return [...this.experienceProviders.values()].sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
    );
  }

  registerActionProvider(provider: RuntimeActionProvider): void {
    if (this.actionProviders.has(provider.id)) {
      throw new RuntimeExtensionError(
        `Action provider already registered: ${provider.id}`,
        { code: "RUNTIME_ACTION_PROVIDER_EXISTS" }
      );
    }
    this.actionProviders.set(provider.id, provider);
  }

  unregisterActionProvider(id: string): boolean {
    return this.actionProviders.delete(id);
  }

  listActionProviders(): RuntimeActionProvider[] {
    return [...this.actionProviders.values()].sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
    );
  }

  findActionProvider(actionId: string): RuntimeActionProvider | undefined {
    return this.listActionProviders().find((p) =>
      p.actionIds.includes(actionId)
    );
  }

  registerIdentityProvider(provider: IdentityProvider): void {
    if (this.identityProviders.has(provider.id)) {
      throw new RuntimeExtensionError(
        `Identity provider already registered: ${provider.id}`,
        { code: "RUNTIME_IDENTITY_PROVIDER_EXISTS" }
      );
    }
    this.identityProviders.set(provider.id, provider);
    void this.events?.publish(RUNTIME_KERNEL_EVENT_TYPES.EXTENSION_REGISTERED, {
      kind: "identity_provider",
      id: provider.id,
    });
  }

  unregisterIdentityProvider(id: string): boolean {
    return this.identityProviders.delete(id);
  }

  listIdentityProviders(): IdentityProvider[] {
    return [...this.identityProviders.values()].sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
    );
  }

  setIdentityRuntime(identity: IdentityRuntime | null): void {
    this.identityRuntime = identity;
  }

  getIdentityRuntime(): IdentityRuntime | null {
    return this.identityRuntime;
  }

  registerContextProvider(provider: ContextProvider): void {
    if (this.contextProviders.has(provider.id)) {
      throw new RuntimeExtensionError(
        `Context provider already registered: ${provider.id}`,
        { code: "RUNTIME_CONTEXT_PROVIDER_EXISTS" }
      );
    }
    this.contextProviders.set(provider.id, provider);
    void this.events?.publish(RUNTIME_KERNEL_EVENT_TYPES.EXTENSION_REGISTERED, {
      kind: "context_provider",
      id: provider.id,
    });
  }

  unregisterContextProvider(id: string): boolean {
    return this.contextProviders.delete(id);
  }

  listContextProviders(): ContextProvider[] {
    return [...this.contextProviders.values()].sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
    );
  }

  setContextRuntime(context: ContextRuntime | null): void {
    this.contextRuntime = context;
  }

  getContextRuntime(): ContextRuntime | null {
    return this.contextRuntime;
  }

  registerIntentProvider(provider: IntentProvider): void {
    if (this.intentProviders.has(provider.id)) {
      throw new RuntimeExtensionError(
        `Intent provider already registered: ${provider.id}`,
        { code: "RUNTIME_INTENT_PROVIDER_EXISTS" }
      );
    }
    this.intentProviders.set(provider.id, provider);
    void this.events?.publish(RUNTIME_KERNEL_EVENT_TYPES.EXTENSION_REGISTERED, {
      kind: "intent_provider",
      id: provider.id,
    });
  }

  unregisterIntentProvider(id: string): boolean {
    return this.intentProviders.delete(id);
  }

  listIntentProviders(): IntentProvider[] {
    return [...this.intentProviders.values()].sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
    );
  }

  setIntentRuntime(intent: IntentRuntime | null): void {
    this.intentRuntime = intent;
  }

  getIntentRuntime(): IntentRuntime | null {
    return this.intentRuntime;
  }

  clear(): void {
    for (const unsub of this.eventUnsubscribers.values()) unsub();
    this.eventUnsubscribers.clear();
    this.domainPackages.clear();
    this.extensions.clear();
    this.stages.clear();
    this.experienceProviders.clear();
    this.actionProviders.clear();
    this.identityProviders.clear();
    this.contextProviders.clear();
    this.intentProviders.clear();
    this.identityRuntime = null;
    this.contextRuntime = null;
    this.intentRuntime = null;
  }
}

export function createRuntimeRegistry(
  options?: RuntimeRegistryOptions
): RuntimeRegistry {
  return new RuntimeRegistry(options);
}
