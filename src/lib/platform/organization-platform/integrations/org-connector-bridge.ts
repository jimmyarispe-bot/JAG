/**
 * Organization-aware integration bridge.
 * Calls Integration Platform public APIs only — does not modify integration internals.
 */

import type { IntegrationPlatform } from "@/lib/platform/integrations";
import type { ConnectorConfiguration } from "@/lib/platform/integrations/common/types";
import {
  assertPermission,
  assertSameOrganization,
  type ActorContext,
} from "../rbac";
import { toIntegrationScope } from "../context/executive-context";

export class OrgIntegrationBridge {
  constructor(private readonly integrations: IntegrationPlatform) {}

  scopeForOrganization(organizationId: string): { organizationId: string } {
    return { organizationId };
  }

  listInstances(organizationId: string, actor: ActorContext): ConnectorConfiguration[] {
    assertPermission(actor, "integrations.read");
    assertSameOrganization(organizationId, actor.organizationId, "organization");
    return this.integrations.persistence.listConfigurations(organizationId);
  }

  async ensureConnector(
    organizationId: string,
    connectorId: string,
    actor: ActorContext,
    options?: { locationId?: string | null; settings?: Record<string, unknown> }
  ): Promise<ConnectorConfiguration> {
    assertPermission(actor, "integrations.manage");
    assertSameOrganization(organizationId, actor.organizationId, "organization");
    return this.integrations.ensureInstance({
      connectorId,
      scope: toIntegrationScope({
        organizationId,
        locationId: options?.locationId,
      }),
      settings: options?.settings,
    });
  }

  async connect(instanceId: string, actor: ActorContext): Promise<void> {
    assertPermission(actor, "integrations.manage");
    const config = this.integrations.persistence.getConfiguration(instanceId);
    if (!config) throw new Error(`Connector instance not found: ${instanceId}`);
    assertSameOrganization(config.scope.organizationId, actor.organizationId, "connector");
    await this.integrations.connect(instanceId);
  }

  instanceIdsForOrganization(organizationId: string): string[] {
    return this.integrations.persistence
      .listConfigurations(organizationId)
      .map((c) => c.instanceId);
  }
}
