export type { PlatformConnector, PlatformConnectorFactory } from "./connector-contract";
export type { AuthAdapter, AuthFramework } from "./auth-contract";
export type { SyncEngine, SyncScheduler, ScheduleEntry } from "./sync-contract";
export type { WebhookEnvelope, WebhookProcessor } from "./webhook-contract";
export type {
  NormalizationContext,
  FieldMapper,
  RecordValidator,
  Deduplicator,
  IdentityResolver,
  NormalizationPipeline,
} from "./normalization-contract";
