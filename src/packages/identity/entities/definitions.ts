/**
 * Identity domain entities — universal organizational identity (definitions only).
 */

import type { EntityModel } from "@/jag/modeling";
import { identityEntity } from "@/packages/identity/_helpers";

export const IdentityOrganizationEntity = identityEntity({
  entityType: "Organization",
  label: "Organization",
  metadataKeys: [
    "displayName",
    "legalName",
    "status",
    "timezone",
    "primaryLanguage",
    "externalId",
  ],
});

export const IdentityDivisionEntity = identityEntity({
  entityType: "Division",
  label: "Division",
  metadataKeys: [
    "displayName",
    "organizationId",
    "status",
    "code",
    "externalId",
  ],
});

export const IdentityDepartmentEntity = identityEntity({
  entityType: "Department",
  label: "Department",
  metadataKeys: [
    "displayName",
    "organizationId",
    "divisionId",
    "status",
    "code",
    "externalId",
  ],
});

export const IdentityTeamEntity = identityEntity({
  entityType: "Team",
  label: "Team",
  metadataKeys: [
    "displayName",
    "organizationId",
    "departmentId",
    "status",
    "code",
    "externalId",
  ],
});

export const IdentityUnitEntity = identityEntity({
  entityType: "Unit",
  label: "Unit",
  metadataKeys: [
    "displayName",
    "organizationId",
    "parentUnitId",
    "status",
    "code",
    "externalId",
  ],
});

export const IdentityPersonEntity = identityEntity({
  entityType: "Person",
  label: "Person",
  metadataKeys: [
    "displayName",
    "legalName",
    "preferredName",
    "status",
    "lifecycleState",
    "primaryEmail",
    "primaryPhone",
    "externalId",
    "timezone",
    "preferredLanguage",
  ],
  searchableFields: [
    {
      key: "displayName",
      label: "Name",
      type: "string",
      filterable: true,
      sortable: true,
    },
    {
      key: "primaryEmail",
      label: "Email",
      type: "string",
      filterable: true,
      sortable: true,
    },
  ],
});

export const IdentityUserEntity = identityEntity({
  entityType: "User",
  label: "User",
  metadataKeys: [
    "displayName",
    "personId",
    "status",
    "lifecycleState",
    "username",
    "externalId",
  ],
});

export const IdentityMemberEntity = identityEntity({
  entityType: "Member",
  label: "Member",
  metadataKeys: [
    "displayName",
    "personId",
    "organizationId",
    "status",
    "lifecycleState",
    "memberType",
    "externalId",
  ],
});

export const IdentityExternalContactEntity = identityEntity({
  entityType: "ExternalContact",
  label: "External Contact",
  metadataKeys: [
    "displayName",
    "organizationId",
    "status",
    "email",
    "phone",
    "relationship",
    "externalId",
  ],
});

export const IdentityMembershipEntity = identityEntity({
  entityType: "Membership",
  label: "Membership",
  metadataKeys: [
    "displayName",
    "memberId",
    "organizationId",
    "unitId",
    "status",
    "lifecycleState",
    "startAt",
    "endAt",
    "externalId",
  ],
});

export const IdentityAssignmentEntity = identityEntity({
  entityType: "Assignment",
  label: "Assignment",
  metadataKeys: [
    "displayName",
    "memberId",
    "scopeType",
    "scopeId",
    "status",
    "startAt",
    "endAt",
    "externalId",
  ],
});

export const IdentityAffiliationEntity = identityEntity({
  entityType: "Affiliation",
  label: "Affiliation",
  metadataKeys: [
    "displayName",
    "personId",
    "organizationId",
    "affiliationType",
    "status",
    "externalId",
  ],
});

export const IdentityRoleDefinitionEntity = identityEntity({
  entityType: "RoleDefinition",
  label: "Role Definition",
  metadataKeys: [
    "displayName",
    "roleKey",
    "category",
    "description",
    "status",
    "externalId",
  ],
});

export const IdentityRoleAssignmentEntity = identityEntity({
  entityType: "RoleAssignment",
  label: "Role Assignment",
  metadataKeys: [
    "displayName",
    "memberId",
    "roleDefinitionId",
    "scopeType",
    "scopeId",
    "bindingKind",
    "status",
    "delegatedFromMemberId",
    "externalId",
  ],
});

export const IdentityGroupEntity = identityEntity({
  entityType: "Group",
  label: "Group",
  metadataKeys: [
    "displayName",
    "organizationId",
    "groupKind",
    "status",
    "ruleExpression",
    "externalId",
  ],
});

export const IdentityProfileEntity = identityEntity({
  entityType: "IdentityProfile",
  label: "Identity Profile",
  metadataKeys: [
    "displayName",
    "personId",
    "legalName",
    "preferredName",
    "emails",
    "phones",
    "identifiers",
    "preferredLanguage",
    "timezone",
    "status",
  ],
});

/** All Identity pack entity contributions (deterministic order by entityType). */
export const IDENTITY_ENTITY_DEFINITIONS: readonly EntityModel[] = Object.freeze(
  [
    IdentityAffiliationEntity,
    IdentityAssignmentEntity,
    IdentityDepartmentEntity,
    IdentityDivisionEntity,
    IdentityExternalContactEntity,
    IdentityGroupEntity,
    IdentityMemberEntity,
    IdentityMembershipEntity,
    IdentityOrganizationEntity,
    IdentityPersonEntity,
    IdentityProfileEntity,
    IdentityRoleAssignmentEntity,
    IdentityRoleDefinitionEntity,
    IdentityTeamEntity,
    IdentityUnitEntity,
    IdentityUserEntity,
  ].sort((a, b) => a.entityType.localeCompare(b.entityType))
);
