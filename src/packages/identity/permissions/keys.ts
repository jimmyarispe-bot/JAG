/**
 * Identity permission keys — catalog only (authorization executed by JAG).
 */

export const IDENTITY_PERMISSION_KEYS = Object.freeze({
  access: "identity.access",
  orgsRead: "identity.organizations.read",
  orgsUpdate: "identity.organizations.update",
  peopleRead: "identity.people.read",
  peopleUpdate: "identity.people.update",
  membersRead: "identity.members.read",
  membersUpdate: "identity.members.update",
  rolesRead: "identity.roles.read",
  rolesAssign: "identity.roles.assign",
  groupsRead: "identity.groups.read",
  groupsUpdate: "identity.groups.update",
  profilesRead: "identity.profiles.read",
  profilesUpdate: "identity.profiles.update",
  bindingsRead: "identity.bindings.read",
  bindingsUpdate: "identity.bindings.update",
} as const);

export const IDENTITY_PERMISSION_PACK_ID = "identity.permission.core" as const;
