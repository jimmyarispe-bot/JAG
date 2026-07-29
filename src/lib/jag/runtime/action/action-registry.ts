import { RuntimeExtensionError } from "../errors";
import type { ActionProvider } from "./action-provider";
import { sortActionProviders } from "./action-provider";
import type { ActionCatalogEntry } from "./action-types";

export class ActionRegistry {
  private readonly providers = new Map<string, ActionProvider>();
  private readonly catalog = new Map<string, ActionCatalogEntry>();

  register(provider: ActionProvider): void {
    if (this.providers.has(provider.id)) {
      throw new RuntimeExtensionError(
        `Action provider already registered: ${provider.id}`,
        { code: "ACTION_PROVIDER_EXISTS" }
      );
    }
    this.providers.set(provider.id, provider);
    if (provider.catalog) {
      for (const entry of provider.catalog) {
        this.catalog.set(entry.actionId, entry);
      }
    }
  }

  unregister(id: string): boolean {
    const provider = this.providers.get(id);
    if (!provider) return false;
    this.providers.delete(id);
    if (provider.catalog) {
      for (const entry of provider.catalog) {
        if (this.catalog.get(entry.actionId) === entry) {
          this.catalog.delete(entry.actionId);
        }
      }
    }
    return true;
  }

  registerCatalogEntry(entry: ActionCatalogEntry): void {
    this.catalog.set(entry.actionId, entry);
  }

  getCatalogEntry(actionId: string): ActionCatalogEntry | undefined {
    return this.catalog.get(actionId);
  }

  describe(actionId: string): ActionCatalogEntry | undefined {
    return this.getCatalogEntry(actionId);
  }

  listCatalog(): ActionCatalogEntry[] {
    return [...this.catalog.values()];
  }

  list(): ActionProvider[] {
    return sortActionProviders([...this.providers.values()]);
  }

  findProvider(actionId: string): ActionProvider | undefined {
    return this.list().find((p) => p.actionIds.includes(actionId));
  }

  clear(): void {
    this.providers.clear();
    this.catalog.clear();
  }
}

export function createActionRegistry(): ActionRegistry {
  return new ActionRegistry();
}

/** Default catalog stub when provider omits entry — still requires evidence. */
export function defaultCatalogEntry(actionId: string): ActionCatalogEntry {
  return {
    actionId,
    kind: "custom",
    permission: `action.${actionId}`,
    requiresEvidence: true,
    requiresCognition: true,
  };
}
