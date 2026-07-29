import { RuntimeExtensionError } from "../errors";
import type { CognitiveProvider } from "./cognitive-provider";
import { sortCognitiveProviders } from "./cognitive-provider";

export class CognitiveRegistry {
  private readonly providers = new Map<string, CognitiveProvider>();

  register(provider: CognitiveProvider): void {
    if (this.providers.has(provider.id)) {
      throw new RuntimeExtensionError(
        `Cognitive provider already registered: ${provider.id}`,
        { code: "COGNITIVE_PROVIDER_EXISTS" }
      );
    }
    this.providers.set(provider.id, provider);
  }

  unregister(id: string): boolean {
    return this.providers.delete(id);
  }

  get(id: string): CognitiveProvider | undefined {
    return this.providers.get(id);
  }

  list(): CognitiveProvider[] {
    return sortCognitiveProviders([...this.providers.values()]);
  }

  clear(): void {
    this.providers.clear();
  }
}

export function createCognitiveRegistry(): CognitiveRegistry {
  return new CognitiveRegistry();
}
