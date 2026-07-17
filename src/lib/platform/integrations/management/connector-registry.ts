/**
 * Management-facing Connector Registry facade.
 * Delegates to the platform's canonical ConnectorRegistry (Sprint 020).
 */

import type { Connector } from "@/lib/platform/integrations/common/contracts";
import type {
  ListCatalogOptions,
  RegisterConnectorOptions,
} from "@/lib/platform/integrations/common/registry";
import type { ConnectorMetadata } from "@/lib/platform/integrations/common/types";
import type { IntegrationPlatform } from "@/lib/platform/integrations/common/services/platform";

export class ConnectorRegistryService {
  constructor(private readonly platform: IntegrationPlatform) {}

  register(connector: Connector, options?: RegisterConnectorOptions): void {
    this.platform.register(connector, options);
  }

  get(connectorId: string): Connector | null {
    return this.platform.getConnector(connectorId);
  }

  list(options?: ListCatalogOptions): ConnectorMetadata[] {
    return this.platform.listCatalog(options);
  }

  has(connectorId: string): boolean {
    return Boolean(this.platform.getConnector(connectorId));
  }

  enable(connectorId: string): void {
    this.platform.enableConnector(connectorId);
  }

  disable(connectorId: string): void {
    this.platform.disableConnector(connectorId);
  }

  isEnabled(connectorId: string): boolean {
    return this.platform.isConnectorEnabled(connectorId);
  }

  getVersion(connectorId: string): string | null {
    return this.platform.getConnectorVersion(connectorId);
  }
}
