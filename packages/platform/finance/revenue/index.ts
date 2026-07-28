/**
 * JAG Revenue™ — contracts, billing, AR, collections, recognition (P-011).
 */

export { REVENUE_GUARDS, EDUCATION_FUNDING_PRESETS } from "./types";
export type {
  BillingMode,
  CollectionStatus,
  ContractKind,
  FundingSource,
  FundingSourceKind,
  RecognitionBasis,
  RevenueContract,
  Subscription,
} from "./types";
export { resetRevenueStoreForTests } from "./store";
export { RevenueEngine, createRevenueEngine } from "./engine";
