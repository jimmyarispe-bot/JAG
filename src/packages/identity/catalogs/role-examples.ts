/**
 * Example role catalog — data only.
 * Industry blueprints / Organization Studio decide which roles an org uses.
 * Identity provides the RoleDefinition model; these are illustrative seeds.
 */

export const IDENTITY_ROLE_EXAMPLES = Object.freeze([
  Object.freeze({
    id: "role.ceo",
    label: "CEO",
    category: "leadership",
  }),
  Object.freeze({
    id: "role.manager",
    label: "Manager",
    category: "leadership",
  }),
  Object.freeze({
    id: "role.member",
    label: "Member",
    category: "general",
  }),
  Object.freeze({
    id: "role.contributor",
    label: "Contributor",
    category: "general",
  }),
  // Industry illustrations (not education SoR — example labels for blueprints)
  Object.freeze({
    id: "role.example.instructor",
    label: "Teacher",
    category: "education-example",
  }),
  Object.freeze({
    id: "role.example.guardian",
    label: "Parent",
    category: "education-example",
  }),
  Object.freeze({
    id: "role.example.learner",
    label: "Student",
    category: "education-example",
  }),
  Object.freeze({
    id: "role.example.physician",
    label: "Physician",
    category: "healthcare-example",
  }),
  Object.freeze({
    id: "role.example.nurse",
    label: "Nurse",
    category: "healthcare-example",
  }),
] as const);
