/**
 * Scheduling domain entities — organizational time coordination (not calendars).
 * Cross-pack refs to identity / documents / communications are string metadata only.
 */

import type { EntityModel } from "@/jag/modeling";
import { schedulingEntity } from "@/packages/scheduling/_helpers";

export const SchedulableTypeEntity = schedulingEntity({
  entityType: "SchedulableType",
  label: "Schedulable Type",
  metadataKeys: [
    "displayName",
    "typeKey",
    "category",
    "description",
    "status",
    "externalId",
  ],
});

/**
 * Core schedule item — time model fields live here.
 * No scheduling engine; recurrenceRule / exceptionDates are representations.
 */
export const ScheduleItemEntity = schedulingEntity({
  entityType: "ScheduleItem",
  label: "Schedule Item",
  metadataKeys: [
    "displayName",
    "title",
    "description",
    "schedulableTypeId",
    "startAt",
    "endAt",
    "durationMinutes",
    "timezone",
    "recurrenceFrequency",
    "recurrenceRule",
    "exceptionDates",
    "scheduleStatus",
    "ownerPersonId",
    "organizationId",
    "status",
    "externalId",
  ],
  searchableFields: [
    {
      key: "title",
      label: "Title",
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

/** Participant — identity.core subject refs only. */
export const ScheduleParticipantEntity = schedulingEntity({
  entityType: "ScheduleParticipant",
  label: "Schedule Participant",
  metadataKeys: [
    "displayName",
    "scheduleItemId",
    "participantKind",
    "personId",
    "teamId",
    "departmentId",
    "organizationId",
    "externalContactId",
    "participationRole",
    "rsvpStatus",
    "status",
    "externalId",
  ],
});

/** Reservable resource definition. */
export const ScheduleResourceEntity = schedulingEntity({
  entityType: "ScheduleResource",
  label: "Schedule Resource",
  metadataKeys: [
    "displayName",
    "resourceType",
    "capacity",
    "locationHint",
    "organizationId",
    "status",
    "externalId",
  ],
});

export const ResourceReservationEntity = schedulingEntity({
  entityType: "ResourceReservation",
  label: "Resource Reservation",
  metadataKeys: [
    "displayName",
    "scheduleItemId",
    "resourceId",
    "startAt",
    "endAt",
    "reservationStatus",
    "status",
    "externalId",
  ],
});

/** Availability representation — no Google/Outlook sync. */
export const AvailabilityBlockEntity = schedulingEntity({
  entityType: "AvailabilityBlock",
  label: "Availability Block",
  metadataKeys: [
    "displayName",
    "subjectKind",
    "personId",
    "teamId",
    "resourceId",
    "availabilityState",
    "startAt",
    "endAt",
    "timezone",
    "recurrenceRule",
    "status",
    "externalId",
  ],
});

/** Conflict representation — no resolution algorithm. */
export const ScheduleConflictEntity = schedulingEntity({
  entityType: "ScheduleConflict",
  label: "Schedule Conflict",
  metadataKeys: [
    "displayName",
    "conflictKind",
    "scheduleItemId",
    "conflictingScheduleItemId",
    "participantId",
    "resourceId",
    "policyKey",
    "description",
    "status",
    "externalId",
  ],
});

/**
 * Invitation / RSVP / reminder / cancellation / update —
 * references communications.core for transport intent.
 */
export const ScheduleInvitationEntity = schedulingEntity({
  entityType: "ScheduleInvitation",
  label: "Schedule Invitation",
  metadataKeys: [
    "displayName",
    "scheduleItemId",
    "invitationKind",
    "participantId",
    "communicationNotificationId",
    "communicationMessageId",
    "communicationTemplateId",
    "rsvpResponse",
    "status",
    "externalId",
  ],
});

/** Attachment refs — documents.core owns documents. */
export const ScheduleAttachmentRefEntity = schedulingEntity({
  entityType: "ScheduleAttachmentRef",
  label: "Schedule Attachment Ref",
  metadataKeys: [
    "displayName",
    "scheduleItemId",
    "documentId",
    "documentVersionId",
    "attachmentRole",
    "status",
    "externalId",
  ],
});

export const SCHEDULING_ENTITY_DEFINITIONS: readonly EntityModel[] =
  Object.freeze(
    [
      AvailabilityBlockEntity,
      ResourceReservationEntity,
      SchedulableTypeEntity,
      ScheduleAttachmentRefEntity,
      ScheduleConflictEntity,
      ScheduleInvitationEntity,
      ScheduleItemEntity,
      ScheduleParticipantEntity,
      ScheduleResourceEntity,
    ].sort((a, b) => a.entityType.localeCompare(b.entityType))
  );
