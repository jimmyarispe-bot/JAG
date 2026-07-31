import type { BlueprintContributionBundle } from "@/jag/blueprints";
import {
  COMMUNICATION_CHANNEL_KINDS,
  COMMUNICATION_RECIPIENT_KINDS,
  COMMUNICATION_STATUS_STATES,
  COMMUNICATION_TYPE_EXAMPLES,
  DELIVERY_POLICY_MODES,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_SEVERITIES,
} from "@/packages/communications/catalogs";
import { COMMUNICATIONS_ENTITY_DEFINITIONS } from "@/packages/communications/entities";
import { COMMUNICATIONS_NAVIGATION } from "@/packages/communications/navigation";
import { COMMUNICATIONS_PERMISSION_PACKS } from "@/packages/communications/permissions";

export function assembleCommunicationsContributionBundle(): BlueprintContributionBundle {
  return Object.freeze({
    entities: COMMUNICATIONS_ENTITY_DEFINITIONS,
    permissions: COMMUNICATIONS_PERMISSION_PACKS,
    navigation: Object.freeze([COMMUNICATIONS_NAVIGATION]),
    processes: Object.freeze([]),
    decisions: Object.freeze([]),
    forms: Object.freeze([]),
    reports: Object.freeze([]),
    workflows: Object.freeze([]),
    terminology: Object.freeze([
      Object.freeze({
        id: "communications.terminology.default",
        label: "Communications default terminology",
        terms: Object.freeze({
          conversation: "Conversation",
          notification: "Notification",
          campaign: "Campaign",
          channel: "Channel",
        }),
      }),
    ]),
    integrations: Object.freeze([]),
  });
}

export function communicationsPackCatalogPayload() {
  return Object.freeze({
    communicationTypeExamples: COMMUNICATION_TYPE_EXAMPLES,
    channelKinds: COMMUNICATION_CHANNEL_KINDS,
    recipientKinds: COMMUNICATION_RECIPIENT_KINDS,
    statusStates: COMMUNICATION_STATUS_STATES,
    deliveryPolicyModes: DELIVERY_POLICY_MODES,
    notificationPriorities: NOTIFICATION_PRIORITIES,
    notificationSeverities: NOTIFICATION_SEVERITIES,
  });
}
