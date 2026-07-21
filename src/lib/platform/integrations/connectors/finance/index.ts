/**
 * Financial Intelligence Connectors — Sprint 077
 * QuickBooks, Stripe, Square, Plaid + Financial KG + ECC widgets.
 */

export {
  FINANCE_PROVIDERS,
  FINANCE_OBJECT_TYPES,
  FINANCE_KG_KINDS,
  type FinanceProvider,
  type FinanceObjectType,
  type FinanceKgKind,
  type FinanceCanonicalEntity,
  type FinanceRawEntity,
} from "./entities";

export {
  financeCanonicalType,
  financeKgKind,
  buildFinanceKnowledgeGraph,
  CANONICAL_TYPE,
} from "./mapping";

export {
  normalizeFinanceRecords,
  toSyncRecords as toFinanceSyncRecords,
} from "./normalization";

export {
  createDemoFinanceClient,
  financeStore,
  createFinancePlatformConnector,
  reconnectFinanceConnector,
} from "./services";

export {
  createFinanceQuickBooksPlatformConnector,
  createDemoFinanceQuickBooksClient,
  reconnectFinanceQuickBooks,
  financeQuickBooksMetadata,
} from "./quickbooks";

export {
  createStripePlatformConnector,
  createDemoStripeClient,
  reconnectStripe,
  stripeMetadata,
} from "./stripe";

export {
  createFinanceSquarePlatformConnector,
  createDemoFinanceSquareClient,
  reconnectFinanceSquare,
  financeSquareMetadata,
} from "./square";

export {
  createFinancePlaidPlatformConnector,
  createDemoFinancePlaidClient,
  reconnectFinancePlaid,
  financePlaidMetadata,
} from "./plaid";

export {
  buildFinancialGraph,
  buildFinanceEccWidgets,
  buildFinanceExecutiveFeed,
  getFinanceExecutiveFeed,
  type FinancialGraph,
  type FinanceEccWidgets,
  type FinanceExecutiveFeed,
} from "./intelligence";

export { registerFinancePlatformConnectors } from "./registry";
export { createFinanceB4Connector } from "./b4-connector";
