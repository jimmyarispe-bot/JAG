/** Compatibility shim — prefer `@/lib/platform/integrations/connectors/hr`. */
import type { PlaceholderConnectorDeps } from "@/lib/platform/integrations/common/services/placeholder-connector";
import {
  createHrB4Connector,
  gustoMetadata,
} from "@/lib/platform/integrations/connectors/hr";

export { gustoMetadata } from "@/lib/platform/integrations/connectors/hr/providers";

export function createGustoConnector(deps: PlaceholderConnectorDeps) {
  return createHrB4Connector(gustoMetadata, "gusto", deps);
}
