export { plaidMetadata } from "./metadata";
export { createPlaidConnector } from "./connector";
export { createDemoPlaidClient, type PlaidClient, type PlaidListPage } from "./client";
export { plaidStore } from "./store";
export {
  buildPlaidIntelligenceFeed,
  getPlaidFeed,
  type PlaidIntelligenceFeed,
} from "./intelligence-feed";
export {
  plaidCanonicalType,
  normalizePlaidRecords,
  toSyncRecords,
} from "./normalize";
export {
  PLAID_OBJECT_TYPES,
  type PlaidObjectType,
  type PlaidEnvironment,
} from "./entities";
export {
  plaidLinkConfig,
  PLAID_LINK_PRODUCTS,
  type PlaidInstitution,
  type PlaidAuthSession,
} from "./auth";
export {
  reconcilePlaidCash,
  type PlaidCashReconciliation,
  type CashReconciliationDiscrepancy,
} from "./reconciliation";
