/** The JAG™ Platform SDK & Extension Framework™ */

export {
  PLATFORM_SDK_VERSION,
  PLATFORM_SDK_INFO,
  compareSemver,
  satisfiesMinVersion,
} from "@/lib/platform-sdk/versioning";

export type {
  PlatformConnector,
  PlatformConnectorContext,
  PlatformConnectorSyncResult,
  ConnectorCapabilities,
  ConnectorCapabilityFlag,
  TwinEntityMapping,
  SdkConnectorHealth,
} from "@/lib/platform-sdk/connectors/types";
export { SDK_CONNECTOR_HEALTH } from "@/lib/platform-sdk/connectors/types";
export { createQuickBooksPlatformConnector } from "@/lib/platform-sdk/connectors/quickbooks";
export { createGoogleWorkspacePlatformConnector } from "@/lib/platform-sdk/connectors/google-workspace";

export type {
  TwinEntity,
  TwinRelationship,
  TwinLifecycle,
  TwinValidation,
  TwinMetrics,
  TwinEntityDescriptor,
  TwinRelationshipDescriptor,
  TwinMetricsDescriptor,
  TwinValidationResult,
  TwinEntityTypeRegistration,
} from "@/lib/platform-sdk/digital-twin/types";

export type {
  EvidenceProvider,
  EvidenceProcessor,
  EvidenceValidator,
  EvidenceMapper,
  EvidenceDocumentDescriptor,
  EvidenceValidationResult,
} from "@/lib/platform-sdk/evidence/types";

export type {
  InsightProvider,
  InsightRule,
  InsightEvaluator,
  InsightFormatter,
  InsightSeverity,
  InsightDescriptor,
  InsightEvaluationContext,
  InsightRuleHit,
} from "@/lib/platform-sdk/executive/types";

export type {
  DecisionSource,
  DecisionWorkflow,
  DecisionAssignment,
  DecisionPolicy,
  DecisionDescriptor,
  DecisionStatus,
} from "@/lib/platform-sdk/decisions/types";

export type {
  PlatformEvent,
  EventPublisher,
  EventSubscriber,
  EventHandler,
  EventEnvelope,
} from "@/lib/platform-sdk/events/types";
export { createSdkEventPublisher } from "@/lib/platform-sdk/events/bridge";

export type {
  PermissionDefinition,
  PermissionScope,
  PermissionSet,
} from "@/lib/platform-sdk/permissions/types";
export { PERMISSION_SCOPES } from "@/lib/platform-sdk/permissions/types";

export type {
  ExtensionManifest,
  ExtensionRecord,
  ExtensionCategory,
  ExtensionStatus,
  ExtensionLifecycle,
  ExtensionConfigSchema,
} from "@/lib/platform-sdk/extensions/types";
export {
  EXTENSION_CATEGORIES,
  EXTENSION_STATUSES,
} from "@/lib/platform-sdk/extensions/types";

export { createExtensionLifecycle } from "@/lib/platform-sdk/lifecycle/extension-lifecycle";
export { createExtensionRegistry } from "@/lib/platform-sdk/registry/extension-registry";
export { createPlatformSdkRegistry } from "@/lib/platform-sdk/registry/platform-registry";
export {
  createCompatibilityValidator,
  type CompatibilityValidator,
  type CompatibilityResult,
  type CompatibilityIssue,
} from "@/lib/platform-sdk/validation/compatibility";
export {
  validatePlatformConnector,
  validateTwinEntityDescriptor,
  validateEvidenceProvider,
  validateInsightProvider,
  validateInsightRule,
  validateDecisionSource,
  validateDecisionWorkflow,
  createBasicEvidenceValidator,
} from "@/lib/platform-sdk/validation/providers";

export {
  createPlatformSdk,
  getPlatformSdk,
  resetPlatformSdkForTests,
  type PlatformSdk,
} from "@/lib/platform-sdk/service";
export { resetPlatformSdkStoreForTests } from "@/lib/platform-sdk/store";
