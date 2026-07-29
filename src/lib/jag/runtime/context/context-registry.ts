import { RuntimeExtensionError } from "../errors";
import type { ContextProvider } from "./context-provider";
import { sortContextProviders } from "./context-provider";

export class ContextRegistry {
  private readonly providers = new Map<string, ContextProvider>();

  register(provider: ContextProvider): void {
    if (this.providers.has(provider.id)) {
      throw new RuntimeExtensionError(
        `Context provider already registered: ${provider.id}`,
        { code: "CONTEXT_PROVIDER_EXISTS" }
      );
    }
    this.providers.set(provider.id, provider);
  }

  unregister(id: string): boolean {
    return this.providers.delete(id);
  }

  get(id: string): ContextProvider | undefined {
    return this.providers.get(id);
  }

  list(): ContextProvider[] {
    return sortContextProviders([...this.providers.values()]);
  }

  clear(): void {
    this.providers.clear();
  }
}

export function createContextRegistry(): ContextRegistry {
  return new ContextRegistry();
}
