/**
 * Thin per-vendor entry — implements shared contract via placeholder factory.
 * Replace sampleRecords / live auth when vendor APIs are connected.
 */

import type { Connector } from "@/lib/platform/integrations/common/contracts";
import {
  createPlaceholderConnector,
  type PlaceholderConnectorDeps,
} from "@/lib/platform/integrations/common/services/placeholder-connector";
import type { ConnectorMetadata } from "@/lib/platform/integrations/common/types";

export function createVendorConnector(
  metadata: ConnectorMetadata,
  deps: PlaceholderConnectorDeps
): Connector {
  return createPlaceholderConnector(metadata, deps);
}
