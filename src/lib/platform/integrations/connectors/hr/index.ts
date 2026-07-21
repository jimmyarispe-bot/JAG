/**
 * RC-3.05 — HR Connectors
 * ADP · Gusto · Paylocity · BambooHR → canonical Employee / Payroll / Benefits /
 * Time Off / Department / Manager + workforce intelligence.
 */

export {
  HR_PROVIDERS,
  HR_OBJECT_TYPES,
  HR_KG_KINDS,
  type HrProvider,
  type HrObjectType,
  type HrKgKind,
  type HrCanonicalEntity,
  type HrRawEntity,
} from "./entities";

export {
  hrCanonicalType,
  hrKgKind,
  buildHrKnowledgeGraph,
  CANONICAL_TYPE,
} from "./mapping";

export {
  normalizeHrRecords,
  toSyncRecords as toHrSyncRecords,
  domainAttributes,
} from "./normalization";

export {
  createDemoHrClient,
  hrStore,
  createHrPlatformConnector,
  reconnectHrConnector,
  hrCatalogForProvider,
  objectTypesForHrProvider,
} from "./services";

export {
  adpMetadata,
  gustoMetadata,
  paylocityMetadata,
  bambooHrMetadata,
  HR_B4_METADATA,
  createHrProviderPlatformConnector,
  createAdpPlatformConnector,
  createGustoPlatformConnector,
  createPaylocityPlatformConnector,
  createBambooHrPlatformConnector,
  createDemoHrProviderClient,
} from "./providers";

export {
  computeHrSignals,
  buildHrEccWidgets,
  buildHrExecutiveFeed,
  getHrExecutiveFeed,
  type HrEccWidgets,
  type HrIntelligenceSignals,
  type HrExecutiveFeed,
} from "./intelligence";

export { registerHrPlatformConnectors } from "./registry";
export { createHrB4Connector } from "./b4-connector";
