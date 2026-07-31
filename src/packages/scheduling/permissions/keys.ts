export const SCHEDULING_PERMISSION_KEYS = Object.freeze({
  access: "scheduling.access",
  typesRead: "scheduling.types.read",
  typesUpdate: "scheduling.types.update",
  itemsRead: "scheduling.items.read",
  itemsUpdate: "scheduling.items.update",
  participantsRead: "scheduling.participants.read",
  participantsUpdate: "scheduling.participants.update",
  resourcesRead: "scheduling.resources.read",
  resourcesUpdate: "scheduling.resources.update",
  availabilityRead: "scheduling.availability.read",
  availabilityUpdate: "scheduling.availability.update",
  conflictsRead: "scheduling.conflicts.read",
  invitationsRead: "scheduling.invitations.read",
  invitationsUpdate: "scheduling.invitations.update",
} as const);

export const SCHEDULING_PERMISSION_PACK_ID =
  "scheduling.permission.core" as const;
