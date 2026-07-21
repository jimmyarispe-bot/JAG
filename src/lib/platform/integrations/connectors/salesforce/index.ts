/** Compatibility shim — prefer `@/lib/platform/integrations/connectors/crm`. */
import type { PlaceholderConnectorDeps } from "@/lib/platform/integrations/common/services/placeholder-connector";
import {
  createCrmB4Connector,
  salesforceMetadata,
} from "@/lib/platform/integrations/connectors/crm";

export {
  salesforceMetadata,
  createSalesforcePlatformConnector,
} from "@/lib/platform/integrations/connectors/crm";

export function createSalesforceConnector(deps: PlaceholderConnectorDeps) {
  return createCrmB4Connector(salesforceMetadata, "salesforce", deps);
}
