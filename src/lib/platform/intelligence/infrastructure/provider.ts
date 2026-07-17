/**
 * Intelligence Platform Infrastructure — IntelligenceProvider (Sprint 027).
 *
 * Providers supply one or more modules for automatic registration.
 */

import type {
  IntelligenceModule,
  IntelligenceProvider as IntelligenceProviderContract,
  IntelligenceRegistry,
  IntelligenceTelemetry,
  IntelligenceVersioning,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import type { IntelligenceModuleId } from "@/lib/platform/intelligence/infrastructure/types";

export class IntelligenceProviderImpl implements IntelligenceProviderContract {
  readonly id: string;
  readonly moduleIds: readonly IntelligenceModuleId[];
  private readonly modules: IntelligenceModule[];

  constructor(id: string, modules: IntelligenceModule[]) {
    this.id = id;
    this.modules = modules;
    this.moduleIds = modules.map((domainModule) => domainModule.id);
  }

  provide(): IntelligenceModule[] {
    return [...this.modules];
  }
}

/** Alias matching Sprint 027 naming. */
export { IntelligenceProviderImpl as IntelligenceProvider };

export function createIntelligenceProvider(
  id: string,
  modules: IntelligenceModule[]
): IntelligenceProviderImpl {
  return new IntelligenceProviderImpl(id, modules);
}

/**
 * Register all modules from providers into the registry.
 * Skips duplicates silently when `skipDuplicates` is true.
 */
export function registerProviders(
  registry: IntelligenceRegistry,
  providers: IntelligenceProviderContract[],
  options: {
    versioning?: IntelligenceVersioning;
    telemetry?: IntelligenceTelemetry;
    skipDuplicates?: boolean;
  } = {}
): IntelligenceModuleId[] {
  const registered: IntelligenceModuleId[] = [];
  for (const provider of providers) {
    for (const domainModule of provider.provide()) {
      if (registry.has(domainModule.id)) {
        if (options.skipDuplicates) continue;
      }
      try {
        registry.register(domainModule);
        options.versioning?.record(domainModule);
        options.telemetry?.emit("module.registered", {
          moduleId: domainModule.id,
          payload: { providerId: provider.id, version: domainModule.version },
        });
        registered.push(domainModule.id);
      } catch (error) {
        if (options.skipDuplicates) continue;
        throw error;
      }
    }
  }
  return registered;
}
