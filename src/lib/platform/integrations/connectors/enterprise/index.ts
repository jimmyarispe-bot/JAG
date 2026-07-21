/**
 * Enterprise Connectors — Sprint 078
 * CRM, HR, Education, Government adapters → shared canonical Knowledge Graph.
 */

export {
  ENTERPRISE_PROVIDERS,
  ENTERPRISE_OBJECT_TYPES,
  ENTERPRISE_KG_KINDS,
  ENTERPRISE_DOMAINS,
  PROVIDER_DOMAIN,
  type EnterpriseProvider,
  type EnterpriseObjectType,
  type EnterpriseKgKind,
  type EnterpriseDomain,
  type EnterpriseCanonicalEntity,
  type EnterpriseRawEntity,
} from "./entities";

export {
  enterpriseCanonicalType,
  enterpriseKgKind,
  buildEnterpriseKnowledgeGraph,
  CANONICAL_TYPE,
} from "./mapping";

export {
  normalizeEnterpriseRecords,
  toSyncRecords as toEnterpriseSyncRecords,
} from "./normalization";

export {
  createDemoEnterpriseClient,
  enterpriseStore,
  createEnterprisePlatformConnector,
  reconnectEnterpriseConnector,
} from "./services";

export {
  hubspotMetadata,
  salesforceMetadata,
  adpMetadata,
  gustoMetadata,
  paylocityMetadata,
  canvasMetadata,
  powerschoolMetadata,
  googleClassroomMetadata,
  stateEducationMetadata,
  scholarshipMetadata,
  medicaidMetadata,
  grantMetadata,
  ENTERPRISE_B4_METADATA,
  createEnterpriseProviderPlatformConnector,
  createHubspotPlatformConnector,
  createSalesforcePlatformConnector,
  createGustoPlatformConnector,
  createDemoEnterpriseProviderClient,
} from "./providers";

/** RC-3.05 — HR providers moved to connectors/hr (re-exported above for compat). */

export {
  buildEnterpriseGraph,
  buildEnterpriseEccWidgets,
  buildEnterpriseExecutiveFeed,
  getEnterpriseExecutiveFeed,
  type EnterpriseGraph,
  type EnterpriseEccWidgets,
  type EnterpriseExecutiveFeed,
} from "./intelligence";

export { registerEnterprisePlatformConnectors } from "./registry";
export { createEnterpriseB4Connector } from "./b4-connector";
