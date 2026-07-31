/**
 * ConnectorTokenManager — OAuth/refresh status without vendor knowledge.
 * Inspects encrypted credential presence via installation store only.
 */

import {
  getCredentialForInstallation,
  listInstallationsForOrganization,
} from "@/lib/connectors/store";
import { decryptCredentialPayload } from "@/lib/connectors/credentials";

export type TokenStatus = {
  readonly oauthState: "none" | "connected" | "expired" | "revoked";
  readonly refreshTokenStatus: "ok" | "missing" | "expired" | "revoked";
  readonly expiresAt: string | null;
};

export type ConnectorTokenManager = {
  inspect(organizationId: string, connectorId: string): TokenStatus;
};

export function createConnectorTokenManager(): ConnectorTokenManager {
  return {
    inspect(organizationId, connectorId) {
      const installation = listInstallationsForOrganization(
        organizationId
      ).find((i) => i.connectorId === connectorId);
      if (!installation) {
        return {
          oauthState: "none",
          refreshTokenStatus: "missing",
          expiresAt: null,
        };
      }
      const cred = getCredentialForInstallation(
        organizationId,
        installation.id
      );
      if (!cred) {
        return {
          oauthState: "none",
          refreshTokenStatus: "missing",
          expiresAt: null,
        };
      }
      try {
        const payload = JSON.parse(
          decryptCredentialPayload(cred.encryptedPayload, organizationId)
        ) as {
          revoked?: boolean;
          refreshToken?: string;
          expiresAt?: string;
          accessToken?: string;
        };
        if (payload.revoked) {
          return {
            oauthState: "revoked",
            refreshTokenStatus: "revoked",
            expiresAt: null,
          };
        }
        if (!payload.refreshToken) {
          return {
            oauthState: payload.accessToken ? "connected" : "none",
            refreshTokenStatus: "missing",
            expiresAt: payload.expiresAt ?? null,
          };
        }
        const expired =
          payload.expiresAt != null &&
          Date.parse(payload.expiresAt) <= Date.now();
        return {
          oauthState: expired ? "expired" : "connected",
          refreshTokenStatus: "ok",
          expiresAt: payload.expiresAt ?? null,
        };
      } catch {
        return {
          oauthState: "none",
          refreshTokenStatus: "missing",
          expiresAt: null,
        };
      }
    },
  };
}
