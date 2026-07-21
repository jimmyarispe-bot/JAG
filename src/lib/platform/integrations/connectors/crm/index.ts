/**
 * RC-3.04 — CRM Connectors
 * HubSpot · Salesforce → canonical Lead / Contact / Company / Deal /
 * Opportunity / Activity / Pipeline + sales intelligence.
 */

export {
  CRM_PROVIDERS,
  CRM_OBJECT_TYPES,
  CRM_KG_KINDS,
  type CrmProvider,
  type CrmObjectType,
  type CrmKgKind,
  type CrmCanonicalEntity,
  type CrmRawEntity,
} from "./entities";

export {
  crmCanonicalType,
  crmKgKind,
  buildCrmKnowledgeGraph,
  CANONICAL_TYPE,
} from "./mapping";

export {
  normalizeCrmRecords,
  toSyncRecords as toCrmSyncRecords,
  domainAttributes,
} from "./normalization";

export {
  createDemoCrmClient,
  crmStore,
  createCrmPlatformConnector,
  reconnectCrmConnector,
  crmCatalogForProvider,
  objectTypesForCrmProvider,
} from "./services";

export {
  hubspotMetadata,
  salesforceMetadata,
  CRM_B4_METADATA,
  createCrmProviderPlatformConnector,
  createHubspotPlatformConnector,
  createSalesforcePlatformConnector,
  createDemoCrmProviderClient,
} from "./providers";

export {
  computeCrmSignals,
  buildCrmEccWidgets,
  buildCrmExecutiveFeed,
  getCrmExecutiveFeed,
  buildExecutiveRelationshipGraph,
  type CrmEccWidgets,
  type CrmIntelligenceSignals,
  type CrmExecutiveFeed,
  type ExecutiveRelationshipGraph,
} from "./intelligence";

export { registerCrmPlatformConnectors } from "./registry";
export { createCrmB4Connector } from "./b4-connector";
