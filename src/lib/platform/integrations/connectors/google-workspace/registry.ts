/**
 * Register Google Workspace with Integration Platform Core (Sprint 073/074).
 */

import type { IntegrationPlatformCore } from "@/lib/platform/integrations/services/create-integration-platform-core";
import {
  createGoogleWorkspacePlatformConnector,
  type CreateGoogleWorkspacePlatformConnectorOptions,
} from "@/lib/platform/integrations/connectors/google-workspace/platform-connector";

export function registerGoogleWorkspacePlatformConnector(
  platform: IntegrationPlatformCore,
  options: CreateGoogleWorkspacePlatformConnectorOptions = {}
): void {
  const connector = createGoogleWorkspacePlatformConnector({
    ...options,
    publisher: options.publisher ?? platform.publisher,
  });
  if (platform.registry.has(connector.id)) {
    platform.registry.register(connector, { replace: true });
    return;
  }
  platform.registerConnector(connector);
}
