export type {
  CommunicationChannel,
  CommunicationChannelKind,
  CommunicationDefinition,
  CommunicationDefinitionId,
  CommunicationDelivery,
  CommunicationDeliveryId,
  CommunicationEvent,
  CommunicationEventType,
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
} from "@/jag/communications/contracts/definitions";

export { COMMUNICATION_CHANNEL_KINDS } from "@/jag/communications/contracts/definitions";

export type {
  CommunicationExtensionCallResult,
  CommunicationExtensionPorts,
  DecisionCommunicationPort,
  DocumentCommunicationPort,
  EntityCommunicationPort,
  IdentityCommunicationPort,
  OrganizationCommunicationPort,
  ProcessCommunicationPort,
  WorkflowCommunicationPort,
} from "@/jag/communications/contracts/extensions";

export {
  bindCommunicationExtensions,
  getCommunicationExtensions,
  resetCommunicationExtensionsForTests,
} from "@/jag/communications/contracts/extensions";
