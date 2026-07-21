/**
 * Credential storage — in-memory for connector CI / local demos.
 * Production vault: https://github.com/jimmyarispe-bot/JAG/issues/3
 * Never returns secrets in logs; only opaque presence checks for UI.
 */

import type { AuthMethod, ConnectorCredentials } from "@/lib/platform/integrations/common/types";

export class CredentialStore {
  private readonly byInstance = new Map<string, ConnectorCredentials>();

  put(credentials: ConnectorCredentials): ConnectorCredentials {
    const next = { ...credentials, updatedAt: new Date().toISOString() };
    this.byInstance.set(credentials.instanceId, next);
    return next;
  }

  get(instanceId: string): ConnectorCredentials | null {
    return this.byInstance.get(instanceId) ?? null;
  }

  remove(instanceId: string): boolean {
    return this.byInstance.delete(instanceId);
  }

  hasValidAccessToken(instanceId: string, now = new Date()): boolean {
    const creds = this.get(instanceId);
    if (!creds?.accessToken) return false;
    if (!creds.expiresAt) return true;
    return new Date(creds.expiresAt).getTime() > now.getTime() + 30_000;
  }

  /** Safe summary for UI / audit (no secret values). */
  summarize(instanceId: string): {
    present: boolean;
    authMethod: AuthMethod | null;
    expiresAt: string | null;
    hasRefreshToken: boolean;
  } {
    const creds = this.get(instanceId);
    if (!creds) {
      return { present: false, authMethod: null, expiresAt: null, hasRefreshToken: false };
    }
    return {
      present: true,
      authMethod: creds.authMethod,
      expiresAt: creds.expiresAt ?? null,
      hasRefreshToken: Boolean(creds.refreshToken),
    };
  }
}
