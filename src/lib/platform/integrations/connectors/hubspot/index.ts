/** Compatibility shim — prefer `@/lib/platform/integrations/connectors/crm`. */
import type { PlaceholderConnectorDeps } from "@/lib/platform/integrations/common/services/placeholder-connector";
import {
  createCrmB4Connector,
  hubspotMetadata,
} from "@/lib/platform/integrations/connectors/crm";

export { hubspotMetadata, createHubspotPlatformConnector } from "@/lib/platform/integrations/connectors/crm";
export { createDemoCrmClient as createDemoHubspotClient } from "@/lib/platform/integrations/connectors/crm";

export function createHubspotConnector(deps: PlaceholderConnectorDeps) {
  return createCrmB4Connector(hubspotMetadata, "hubspot", deps);
}
