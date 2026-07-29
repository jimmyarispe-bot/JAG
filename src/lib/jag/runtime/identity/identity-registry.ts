import { RuntimeExtensionError } from "../errors";
import type { IdentityProvider } from "./identity-provider";
import { sortIdentityProviders } from "./identity-provider";

/**
 * Registration of IdentityProviders.
 * Prefer registering through RuntimeRegistry when installed on a Kernel;
 * this registry can also stand alone for unit tests.
 */
export class IdentityRegistry {
  private readonly providers = new Map<string, IdentityProvider>();

  register(provider: IdentityProvider): void {
    if (this.providers.has(provider.id)) {
      throw new RuntimeExtensionError(
        `Identity provider already registered: ${provider.id}`,
        { code: "IDENTITY_PROVIDER_EXISTS" }
      );
    }
    this.providers.set(provider.id, provider);
  }

  unregister(id: string): boolean {
    return this.providers.delete(id);
  }

  get(id: string): IdentityProvider | undefined {
    return this.providers.get(id);
  }

  list(): IdentityProvider[] {
    return sortIdentityProviders([...this.providers.values()]);
  }

  clear(): void {
    this.providers.clear();
  }
}

export function createIdentityRegistry(): IdentityRegistry {
  return new IdentityRegistry();
}
