import type { IntegrationPlatform } from "@/lib/platform/integrations/common/services/platform";
import type { AuthMethod, AuthResult } from "@/lib/platform/integrations/common/types";

export class CredentialManager {
  constructor(private readonly platform: IntegrationPlatform) {}

  summarize(instanceId: string) {
    return this.platform.credentials.summarize(instanceId);
  }

  hasValidAccessToken(instanceId: string): boolean {
    return this.platform.credentials.hasValidAccessToken(instanceId);
  }

  async authenticate(instanceId: string, actor = "system"): Promise<AuthResult> {
    const config = this.platform.persistence.getConfiguration(instanceId);
    if (!config) throw new Error(`Unknown instance: ${instanceId}`);
    const connector = this.platform.getConnector(config.connectorId);
    if (!connector) throw new Error(`Unknown connector: ${config.connectorId}`);

    const result = await connector.authenticate(instanceId);
    this.platform.persistence.appendAudit({
      instanceId,
      connectorId: config.connectorId,
      action: "credentials_updated",
      actor,
      detail: { ok: result.ok, method: result.method },
    });
    await this.platform.events.publish({
      type: "CredentialsUpdated",
      instanceId,
      connectorId: config.connectorId,
      scope: config.scope,
      payload: { ok: result.ok, method: result.method },
    });
    if (!result.ok) {
      await this.platform.events.publish({
        type: "AuthenticationExpired",
        instanceId,
        connectorId: config.connectorId,
        payload: { error: result.error ?? "Authentication failed" },
      });
    }
    return result;
  }

  async refresh(instanceId: string, actor = "system"): Promise<AuthResult> {
    const config = this.platform.persistence.getConfiguration(instanceId);
    if (!config) throw new Error(`Unknown instance: ${instanceId}`);
    const connector = this.platform.getConnector(config.connectorId);
    if (!connector) throw new Error(`Unknown connector: ${config.connectorId}`);
    const result = await connector.refreshToken(instanceId);
    this.platform.persistence.appendAudit({
      instanceId,
      connectorId: config.connectorId,
      action: "credentials_refreshed",
      actor,
      detail: { ok: result.ok },
    });
    if (!result.ok) {
      await this.platform.events.publish({
        type: "AuthenticationExpired",
        instanceId,
        connectorId: config.connectorId,
        payload: { error: result.error ?? "Refresh failed" },
      });
    }
    return result;
  }

  remove(instanceId: string): void {
    this.platform.credentials.remove(instanceId);
  }

  preferredMethod(connectorId: string): AuthMethod {
    const connector = this.platform.getConnector(connectorId);
    return connector?.metadata.authMethods[0] ?? "none";
  }
}
