/**
 * Participant kinds — identity.core references only (never duplicate Identity).
 */
export const SCHEDULE_PARTICIPANT_KINDS = Object.freeze([
  Object.freeze({ id: "person", label: "Person", identityEntityType: "Person" }),
  Object.freeze({ id: "team", label: "Team", identityEntityType: "Team" }),
  Object.freeze({
    id: "department",
    label: "Department",
    identityEntityType: "Department",
  }),
  Object.freeze({
    id: "organization",
    label: "Organization",
    identityEntityType: "Organization",
  }),
  Object.freeze({
    id: "external_contact",
    label: "External Contact",
    identityEntityType: "ExternalContact",
  }),
] as const);
