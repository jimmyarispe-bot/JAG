/**
 * Communications domain entities — organizational communications (not transport).
 * Cross-pack refs to identity.core / documents.core are string metadata only.
 */

import type { EntityModel } from "@/jag/modeling";
import { communicationsEntity } from "@/packages/communications/_helpers";

export const CommunicationTypeEntity = communicationsEntity({
  entityType: "CommunicationType",
  label: "Communication Type",
  metadataKeys: [
    "displayName",
    "typeKey",
    "category",
    "description",
    "status",
    "externalId",
  ],
});

/** Channel definition — no provider binding. */
export const CommunicationChannelEntity = communicationsEntity({
  entityType: "CommunicationChannel",
  label: "Communication Channel",
  metadataKeys: [
    "displayName",
    "channelKind",
    "description",
    "status",
    "externalId",
  ],
});

/**
 * Recipient representation — subjectId points at identity.core entities
 * or an ExternalContact record when recipientKind = external_contact.
 */
export const CommunicationRecipientEntity = communicationsEntity({
  entityType: "CommunicationRecipient",
  label: "Communication Recipient",
  metadataKeys: [
    "displayName",
    "recipientKind",
    "subjectId",
    "externalContactId",
    "channelKind",
    "addressHint",
    "status",
    "externalId",
  ],
});

export const CommunicationTemplateEntity = communicationsEntity({
  entityType: "CommunicationTemplate",
  label: "Communication Template",
  metadataKeys: [
    "displayName",
    "communicationTypeId",
    "subject",
    "body",
    "mergeVariables",
    "localization",
    "brandingPlaceholders",
    "channelVariants",
    "status",
    "externalId",
  ],
});

export const ConversationEntity = communicationsEntity({
  entityType: "Conversation",
  label: "Conversation",
  metadataKeys: [
    "displayName",
    "communicationTypeId",
    "subject",
    "communicationStatus",
    "createdByPersonId",
    "status",
    "externalId",
  ],
  searchableFields: [
    {
      key: "subject",
      label: "Subject",
      type: "string",
      filterable: true,
      sortable: true,
    },
    {
      key: "displayName",
      label: "Name",
      type: "string",
      filterable: true,
      sortable: true,
    },
  ],
});

export const ConversationParticipantEntity = communicationsEntity({
  entityType: "ConversationParticipant",
  label: "Conversation Participant",
  metadataKeys: [
    "displayName",
    "conversationId",
    "recipientKind",
    "personId",
    "groupId",
    "roleId",
    "teamId",
    "departmentId",
    "organizationId",
    "externalContactId",
    "participationRole",
    "status",
    "externalId",
  ],
});

/** Message within a conversation; parentMessageId expresses replies. */
export const CommunicationMessageEntity = communicationsEntity({
  entityType: "CommunicationMessage",
  label: "Communication Message",
  metadataKeys: [
    "displayName",
    "conversationId",
    "parentMessageId",
    "authorPersonId",
    "body",
    "channelKind",
    "communicationStatus",
    "sentAt",
    "status",
    "externalId",
  ],
});

/**
 * Attachment reference — opaque pointer to documents.core
 * (BusinessDocument / DocumentAttachmentRef), not file storage.
 */
export const CommunicationAttachmentRefEntity = communicationsEntity({
  entityType: "CommunicationAttachmentRef",
  label: "Communication Attachment Ref",
  metadataKeys: [
    "displayName",
    "conversationId",
    "messageId",
    "documentId",
    "documentVersionId",
    "documentAttachmentRefId",
    "templateDocumentId",
    "status",
    "externalId",
  ],
});

export const CommunicationNotificationEntity = communicationsEntity({
  entityType: "CommunicationNotification",
  label: "Notification",
  metadataKeys: [
    "displayName",
    "communicationTypeId",
    "templateId",
    "priority",
    "severity",
    "expirationAt",
    "acknowledgementRequired",
    "deliveryPolicyId",
    "recipientKind",
    "subjectId",
    "communicationStatus",
    "status",
    "externalId",
  ],
});

export const CampaignEntity = communicationsEntity({
  entityType: "Campaign",
  label: "Campaign",
  metadataKeys: [
    "displayName",
    "communicationTypeId",
    "templateId",
    "audienceDescription",
    "audienceRecipientKind",
    "audienceSubjectId",
    "scheduleAt",
    "recurrenceRule",
    "completionStatus",
    "communicationStatus",
    "status",
    "externalId",
  ],
});

export const CommunicationSubscriptionEntity = communicationsEntity({
  entityType: "CommunicationSubscription",
  label: "Communication Subscription",
  metadataKeys: [
    "displayName",
    "personId",
    "category",
    "channelKind",
    "optedIn",
    "status",
    "externalId",
  ],
});

export const CommunicationPreferenceEntity = communicationsEntity({
  entityType: "CommunicationPreference",
  label: "Communication Preference",
  metadataKeys: [
    "displayName",
    "personId",
    "preferredChannels",
    "language",
    "quietHoursStart",
    "quietHoursEnd",
    "optInCategories",
    "optOutCategories",
    "status",
    "externalId",
  ],
});

/** Delivery policy — representation only; no transport or scheduler. */
export const DeliveryPolicyEntity = communicationsEntity({
  entityType: "DeliveryPolicy",
  label: "Delivery Policy",
  metadataKeys: [
    "displayName",
    "policyKey",
    "deliveryMode",
    "retryPolicy",
    "escalationPolicy",
    "batchWindowMinutes",
    "description",
    "status",
    "externalId",
  ],
});

export const COMMUNICATIONS_ENTITY_DEFINITIONS: readonly EntityModel[] =
  Object.freeze(
    [
      CampaignEntity,
      CommunicationAttachmentRefEntity,
      CommunicationChannelEntity,
      CommunicationMessageEntity,
      CommunicationNotificationEntity,
      CommunicationPreferenceEntity,
      CommunicationRecipientEntity,
      CommunicationSubscriptionEntity,
      CommunicationTemplateEntity,
      CommunicationTypeEntity,
      ConversationEntity,
      ConversationParticipantEntity,
      DeliveryPolicyEntity,
    ].sort((a, b) => a.entityType.localeCompare(b.entityType))
  );
