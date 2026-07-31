/**
 * JAG OS — Universal Communications Engine (public API).
 * Orchestration only — delivery providers are adapters.
 */

export const JAG_COMMUNICATIONS_NAMESPACE = "jag.communications" as const;

export type {
  CommunicationChannel,
  CommunicationChannelKind,
  CommunicationDefinition,
  CommunicationDefinitionId,
  CommunicationDelivery,
  CommunicationDeliveryId,
  CommunicationEvent,
  CommunicationEventType,
  CommunicationExtensionCallResult,
  CommunicationExtensionPorts,
  CommunicationMessage,
  CommunicationMessageId,
  CommunicationMetrics,
  CommunicationParticipant,
  CommunicationParticipantRole,
  CommunicationPreference,
  CommunicationRecipient,
  CommunicationResult,
  CommunicationStatus,
  CommunicationTemplate,
  CommunicationTemplateId,
  DecisionCommunicationPort,
  DocumentCommunicationPort,
  EntityCommunicationPort,
  IdentityCommunicationPort,
  OrganizationCommunicationPort,
  ProcessCommunicationPort,
  WorkflowCommunicationPort,
} from "@/jag/communications/contracts";

export {
  COMMUNICATION_CHANNEL_KINDS,
  bindCommunicationExtensions,
  getCommunicationExtensions,
  resetCommunicationExtensionsForTests,
} from "@/jag/communications/contracts";

export {
  CommunicationRegistry,
  assertCommunicationRegistered,
  getCommunicationDefinition,
  getCommunicationPreference,
  getCommunicationTemplate,
  listCommunicationDefinitions,
  listCommunicationTemplates,
  registerCommunication,
  registerCommunicationTemplate,
  resetCommunicationRegistryForTests,
  upsertCommunicationPreference,
  validateCommunicationRegistryDependencies,
} from "@/jag/communications/registry";

export {
  CommunicationRuntime,
  archiveCommunication,
  cancelCommunication,
  communicationNow,
  completeCommunication,
  createCommunicationMessage,
  getCommunicationDelivery,
  getCommunicationMessage,
  getCommunicationMetrics,
  listCommunicationDeliveries,
  listCommunicationMessages,
  queueCommunicationDispatch,
  renderCommunicationMessage,
  resetCommunicationClockForTests,
  resetCommunicationIdsForTests,
  resetCommunicationMessageStoreForTests,
  resolveCommunicationRecipientsForMessage,
  retryCommunication,
  scheduleCommunicationDelivery,
  setCommunicationClockForTests,
  setCommunicationIdPrefixForTests,
} from "@/jag/communications/runtime";

export {
  assertAllowedChannel,
  isCommunicationChannelKind,
  listCommunicationChannels,
} from "@/jag/communications/channels";

export { renderCommunicationTemplate } from "@/jag/communications/templates";
export { resolveCommunicationRecipients } from "@/jag/communications/participants";
export { routeCommunicationChannel } from "@/jag/communications/routing";

export type {
  CommunicationDeliveryProvider,
  CommunicationPersistencePorts,
  CommunicationQueueRepository,
  CommunicationRepository,
  CommunicationTemplateRepository,
} from "@/jag/communications/delivery";

export {
  bindCommunicationPersistence,
  getCommunicationPersistence,
  resetCommunicationPersistenceForTests,
} from "@/jag/communications/delivery";

export {
  emitCommunicationEvent,
  listCommunicationEvents,
  resetCommunicationEventsForTests,
  subscribeCommunicationEvents,
} from "@/jag/communications/events";

export type { CommunicationTelemetryEvent } from "@/jag/communications/telemetry";
export {
  resetCommunicationTelemetryForTests,
  subscribeCommunicationTelemetry,
  trackCommunicationTelemetry,
} from "@/jag/communications/telemetry";

export {
  createTestCommunicationDefinition,
  freezeCommunicationEngineForTests,
  registerTestCommunication,
  resetCommunicationEngineForTests,
} from "@/jag/communications/testing";
