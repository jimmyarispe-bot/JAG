/**
 * Recipient kinds — integrate with identity.core by reference
 * (Person, Group, Role, Team, Department, Organization) plus external contacts.
 */
export const COMMUNICATION_RECIPIENT_KINDS = Object.freeze([
  Object.freeze({ id: "person", label: "Person", identityEntityType: "Person" }),
  Object.freeze({ id: "group", label: "Group", identityEntityType: "Group" }),
  Object.freeze({
    id: "role",
    label: "Role",
    identityEntityType: "RoleDefinition",
  }),
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

export type CommunicationRecipientKindId =
  (typeof COMMUNICATION_RECIPIENT_KINDS)[number]["id"];
