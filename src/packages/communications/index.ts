/**
 * Communications Capability Pack — Universal Organizational Communications.
 */

export {
  COMMUNICATIONS_APPLICATION_ID,
  COMMUNICATIONS_PACKAGE_ID,
  COMMUNICATIONS_PACKAGE_VERSION,
  COMMUNICATIONS_PACK_ID,
} from "@/packages/communications/package";

export {
  buildCommunicationsCapabilityPacks,
  buildCommunicationsCorePack,
  describeCommunicationsCorePack,
  assembleCommunicationsContributionBundle,
  communicationsPackCatalogPayload,
} from "@/packages/communications/capability-packs";

export {
  COMMUNICATIONS_ENTITY_DEFINITIONS,
  CampaignEntity,
  CommunicationAttachmentRefEntity,
  CommunicationMessageEntity,
  CommunicationNotificationEntity,
  ConversationEntity,
  ConversationParticipantEntity,
} from "@/packages/communications/entities";
export {
  COMMUNICATIONS_PERMISSION_KEYS,
  COMMUNICATIONS_PERMISSION_PACK,
  COMMUNICATIONS_PERMISSION_PACK_ID,
  COMMUNICATIONS_PERMISSION_PACKS,
} from "@/packages/communications/permissions";
export { COMMUNICATIONS_NAVIGATION } from "@/packages/communications/navigation";
export {
  COMMUNICATION_TYPE_EXAMPLES,
  COMMUNICATION_CHANNEL_KINDS,
  COMMUNICATION_RECIPIENT_KINDS,
  COMMUNICATION_STATUS_STATES,
  DELIVERY_POLICY_MODES,
} from "@/packages/communications/catalogs";

export {
  buildCommunicationsProofOrganizationBlueprint,
  compileCommunicationsProofRuntime,
  generateCommunicationsProofRuntime,
  registerCommunicationsHandwrittenBaseline,
  resetCommunicationsProofPortsForTests,
  listCommunicationsProofPermissionPacks,
} from "@/packages/communications/proof";
