import { RuntimeExtensionError } from "../errors";
import type { IntentProvider } from "./intent-provider";
import { sortIntentProviders } from "./intent-provider";
import type { IntentCatalogEntry } from "./intent-types";

export class IntentRegistry {
  private readonly providers = new Map<string, IntentProvider>();
  private readonly catalog = new Map<string, IntentCatalogEntry>();

  register(provider: IntentProvider): void {
    if (this.providers.has(provider.id)) {
      throw new RuntimeExtensionError(
        `Intent provider already registered: ${provider.id}`,
        { code: "INTENT_PROVIDER_EXISTS" }
      );
    }
    this.providers.set(provider.id, provider);
    if (provider.catalog) {
      for (const entry of provider.catalog) {
        this.catalog.set(entry.intentId, entry);
      }
    }
  }

  unregister(id: string): boolean {
    const provider = this.providers.get(id);
    if (!provider) return false;
    this.providers.delete(id);
    if (provider.catalog) {
      for (const entry of provider.catalog) {
        const current = this.catalog.get(entry.intentId);
        if (current === entry) this.catalog.delete(entry.intentId);
      }
    }
    return true;
  }

  registerCatalogEntry(entry: IntentCatalogEntry): void {
    this.catalog.set(entry.intentId, entry);
  }

  getCatalogEntry(intentId: string): IntentCatalogEntry | undefined {
    return this.catalog.get(intentId);
  }

  listCatalog(): IntentCatalogEntry[] {
    return [...this.catalog.values()];
  }

  list(): IntentProvider[] {
    return sortIntentProviders([...this.providers.values()]);
  }

  clear(): void {
    this.providers.clear();
    this.catalog.clear();
  }
}

export function createIntentRegistry(): IntentRegistry {
  return new IntentRegistry();
}
