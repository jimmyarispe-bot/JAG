export { createPlaceholderConnector } from "./placeholder-connector";
export {
  createIntegrationPlatform,
  type CreateIntegrationPlatformOptions,
  type IntegrationPlatform,
} from "./platform";
export {
  ConnectorRegistry,
  ConnectorRegistryError,
  createConnectorRegistry,
  type ConnectorRegistryEntry,
  type ListCatalogOptions,
  type RegisterConnectorOptions,
} from "@/lib/platform/integrations/common/registry";
