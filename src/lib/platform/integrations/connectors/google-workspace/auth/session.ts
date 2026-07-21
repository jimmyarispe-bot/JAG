/**
 * Install / refresh / disconnect / reconnect session helpers.
 */

import type { AuthSession } from "@/lib/platform/integrations/types";
import type { GoogleWorkspaceAuthSession } from "@/lib/platform/integrations/connectors/google-workspace/auth/oauth";

export type StoredGoogleSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  domain: string;
  consentType: "admin" | "user";
  installedAt: string;
  disconnectedAt?: string | null;
};

export class GoogleWorkspaceSessionStore {
  private readonly sessions = new Map<string, StoredGoogleSession>();

  install(instanceId: string, session: GoogleWorkspaceAuthSession): StoredGoogleSession {
    const stored: StoredGoogleSession = {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
      domain: session.domain,
      consentType: session.consentType,
      installedAt: new Date().toISOString(),
      disconnectedAt: null,
    };
    this.sessions.set(instanceId, stored);
    return stored;
  }

  get(instanceId: string): StoredGoogleSession | null {
    return this.sessions.get(instanceId) ?? null;
  }

  refresh(
    instanceId: string,
    tokens: { accessToken: string; refreshToken?: string; expiresAt?: string }
  ): StoredGoogleSession | null {
    const existing = this.sessions.get(instanceId);
    if (!existing) return null;
    const next: StoredGoogleSession = {
      ...existing,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken ?? existing.refreshToken,
      expiresAt: tokens.expiresAt ?? existing.expiresAt,
      disconnectedAt: null,
    };
    this.sessions.set(instanceId, next);
    return next;
  }

  disconnect(instanceId: string): void {
    const existing = this.sessions.get(instanceId);
    if (!existing) {
      this.sessions.delete(instanceId);
      return;
    }
    this.sessions.set(instanceId, {
      ...existing,
      accessToken: "",
      disconnectedAt: new Date().toISOString(),
    });
  }

  /** Clear disconnected flag so authenticate can reconnect. */
  reconnect(instanceId: string): StoredGoogleSession | null {
    const existing = this.sessions.get(instanceId);
    if (!existing) return null;
    const next = { ...existing, disconnectedAt: null };
    this.sessions.set(instanceId, next);
    return next;
  }

  toAuthSession(stored: StoredGoogleSession): AuthSession {
    if (!stored.accessToken || stored.disconnectedAt) {
      return { ok: false, strategy: "oauth2", error: "Disconnected" };
    }
    return {
      ok: true,
      strategy: "oauth2",
      accessToken: stored.accessToken,
      refreshToken: stored.refreshToken,
      expiresAt: stored.expiresAt,
      metadata: {
        domain: stored.domain,
        consentType: stored.consentType,
      },
    };
  }
}
