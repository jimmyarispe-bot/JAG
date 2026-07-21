/**
 * Authentication framework — strategy adapters for OAuth2, API key,
 * service account, JWT, and basic auth.
 */

import type { AuthAdapter, AuthFramework } from "@/lib/platform/integrations/contracts";
import type { AuthContext, AuthSession, AuthStrategy } from "@/lib/platform/integrations/types";

export class IntegrationAuthFramework implements AuthFramework {
  private readonly adapters = new Map<AuthStrategy, AuthAdapter>();

  registerAdapter(adapter: AuthAdapter): void {
    this.adapters.set(adapter.strategy, adapter);
  }

  getAdapter(strategy: AuthStrategy): AuthAdapter | null {
    return this.adapters.get(strategy) ?? null;
  }

  async authenticate(context: AuthContext): Promise<AuthSession> {
    const adapter = this.requireAdapter(context.strategy);
    return adapter.authenticate(context);
  }

  async refresh(context: AuthContext): Promise<AuthSession> {
    const adapter = this.requireAdapter(context.strategy);
    if (!adapter.refresh) {
      return {
        ok: false,
        strategy: context.strategy,
        error: `Strategy "${context.strategy}" does not support refresh`,
      };
    }
    return adapter.refresh(context);
  }

  async disconnect(context: AuthContext): Promise<void> {
    const adapter = this.getAdapter(context.strategy);
    await adapter?.revoke?.(context);
  }

  private requireAdapter(strategy: AuthStrategy): AuthAdapter {
    const adapter = this.adapters.get(strategy);
    if (!adapter) {
      throw new Error(`No auth adapter registered for strategy "${strategy}"`);
    }
    return adapter;
  }
}

export function createDefaultAuthAdapters(): AuthAdapter[] {
  return [
    createApiKeyAdapter(),
    createBasicAuthAdapter(),
    createJwtAdapter(),
    createServiceAccountAdapter(),
    createOAuth2Adapter(),
  ];
}

export function createApiKeyAdapter(): AuthAdapter {
  return {
    strategy: "api_key",
    async authenticate(context) {
      const key = context.credentials.apiKey ?? context.credentials.key;
      if (!key) {
        return { ok: false, strategy: "api_key", error: "Missing API key" };
      }
      return {
        ok: true,
        strategy: "api_key",
        accessToken: key,
        metadata: { header: "Authorization", scheme: "Bearer" },
      };
    },
    async validate(context) {
      const key = context.credentials.apiKey ?? context.credentials.key;
      return key
        ? { ok: true, issues: [] }
        : { ok: false, issues: ["API key credential is required"] };
    },
  };
}

export function createBasicAuthAdapter(): AuthAdapter {
  return {
    strategy: "basic",
    async authenticate(context) {
      const username = context.credentials.username;
      const password = context.credentials.password;
      if (!username || !password) {
        return { ok: false, strategy: "basic", error: "Missing username or password" };
      }
      const token = Buffer.from(`${username}:${password}`).toString("base64");
      return { ok: true, strategy: "basic", accessToken: token };
    },
  };
}

export function createJwtAdapter(): AuthAdapter {
  return {
    strategy: "jwt",
    async authenticate(context) {
      const token = context.credentials.jwt ?? context.credentials.token;
      if (!token) {
        return { ok: false, strategy: "jwt", error: "Missing JWT" };
      }
      return {
        ok: true,
        strategy: "jwt",
        accessToken: token,
        expiresAt: context.expiresAt,
      };
    },
  };
}

export function createServiceAccountAdapter(): AuthAdapter {
  return {
    strategy: "service_account",
    async authenticate(context) {
      const clientEmail = context.credentials.clientEmail;
      const privateKey = context.credentials.privateKey;
      if (!clientEmail || !privateKey) {
        return {
          ok: false,
          strategy: "service_account",
          error: "Missing service account clientEmail or privateKey",
        };
      }
      return {
        ok: true,
        strategy: "service_account",
        accessToken: `sa:${clientEmail}`,
        metadata: { clientEmail },
      };
    },
  };
}

export function createOAuth2Adapter(): AuthAdapter {
  return {
    strategy: "oauth2",
    async authenticate(context) {
      const accessToken = context.credentials.accessToken;
      if (!accessToken) {
        return { ok: false, strategy: "oauth2", error: "Missing OAuth access token" };
      }
      return {
        ok: true,
        strategy: "oauth2",
        accessToken,
        refreshToken: context.credentials.refreshToken,
        expiresAt: context.expiresAt,
      };
    },
    async refresh(context) {
      const refreshToken = context.credentials.refreshToken;
      if (!refreshToken) {
        return { ok: false, strategy: "oauth2", error: "Missing refresh token" };
      }
      // Connector-specific token exchange happens in the connector; platform refreshes session shape.
      return {
        ok: true,
        strategy: "oauth2",
        accessToken: context.credentials.accessToken ?? `refreshed:${refreshToken.slice(0, 8)}`,
        refreshToken,
        expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      };
    },
    async revoke() {
      /* no-op at platform layer */
    },
  };
}

export function createAuthFramework(
  adapters: AuthAdapter[] = createDefaultAuthAdapters()
): IntegrationAuthFramework {
  const framework = new IntegrationAuthFramework();
  for (const adapter of adapters) {
    framework.registerAdapter(adapter);
  }
  return framework;
}
