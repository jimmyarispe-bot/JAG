/**
 * Policy domain entities — organizational governance (not rule/auth engines).
 * Cross-pack refs are string metadata only.
 */

import type { EntityModel } from "@/jag/modeling";
import { policyEntity } from "@/packages/policy/_helpers";

export const PolicyFamilyEntity = policyEntity({
  entityType: "PolicyFamily",
  label: "Policy Family",
  metadataKeys: [
    "displayName",
    "familyKey",
    "description",
    "status",
    "externalId",
  ],
});

/** Core policy / standard / procedure / guideline / control record. */
export const OrgPolicyEntity = policyEntity({
  entityType: "OrgPolicy",
  label: "Policy",
  metadataKeys: [
    "displayName",
    "title",
    "summary",
    "policyFamilyId",
    "lifecycleState",
    "currentVersionId",
    "organizationId",
    "ownerPersonId",
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

/**
 * Immutable policy version — new revision = new version record.
 * supersedes / supersededBy express lineage without mutating prior versions.
 */
export const PolicyVersionEntity = policyEntity({
  entityType: "PolicyVersion",
  label: "Policy Version",
  metadataKeys: [
    "displayName",
    "policyId",
    "versionNumber",
    "effectiveDate",
    "supersedesVersionId",
    "supersededByVersionId",
    "changeSummary",
    "lifecycleState",
    "createdByPersonId",
    "status",
    "externalId",
  ],
});

/** Scope applicability — no enforcement. */
export const PolicyScopeEntity = policyEntity({
  entityType: "PolicyScope",
  label: "Policy Scope",
  metadataKeys: [
    "displayName",
    "policyId",
    "policyVersionId",
    "scopeKind",
    "organizationId",
    "divisionId",
    "departmentId",
    "teamId",
    "roleDefinitionId",
    "locationHint",
    "capabilityPackId",
    "status",
    "externalId",
  ],
});

/** Obligation definitions only. */
export const PolicyObligationEntity = policyEntity({
  entityType: "PolicyObligation",
  label: "Policy Obligation",
  metadataKeys: [
    "displayName",
    "policyId",
    "policyVersionId",
    "requiredAction",
    "requiredAcknowledgement",
    "renewalIntervalDays",
    "reviewIntervalDays",
    "description",
    "status",
    "externalId",
  ],
});

/** Exception representation — no workflow. */
export const PolicyExceptionEntity = policyEntity({
  entityType: "PolicyException",
  label: "Policy Exception",
  metadataKeys: [
    "displayName",
    "policyId",
    "policyVersionId",
    "exceptionRequestSummary",
    "approvalDecisionId",
    "expirationAt",
    "rationale",
    "requesterPersonId",
    "status",
    "externalId",
  ],
});

/** Acknowledgement — identity.core refs; no notification engine. */
export const PolicyAcknowledgementEntity = policyEntity({
  entityType: "PolicyAcknowledgement",
  label: "Policy Acknowledgement",
  metadataKeys: [
    "displayName",
    "policyId",
    "policyVersionId",
    "acknowledgedByPersonId",
    "acknowledgedOn",
    "acknowledgementStatus",
    "status",
    "externalId",
  ],
});

/** Supporting documents — documents.core refs. */
export const PolicyDocumentRefEntity = policyEntity({
  entityType: "PolicyDocumentRef",
  label: "Policy Document Ref",
  metadataKeys: [
    "displayName",
    "policyId",
    "policyVersionId",
    "documentId",
    "documentVersionId",
    "documentRole",
    "status",
    "externalId",
  ],
});

/** Communications — communications.core refs; no transport. */
export const PolicyCommunicationRefEntity = policyEntity({
  entityType: "PolicyCommunicationRef",
  label: "Policy Communication Ref",
  metadataKeys: [
    "displayName",
    "policyId",
    "communicationKind",
    "communicationNotificationId",
    "communicationMessageId",
    "status",
    "externalId",
  ],
});

/** Related decisions — decision.core refs. */
export const PolicyDecisionLinkEntity = policyEntity({
  entityType: "PolicyDecisionLink",
  label: "Policy Decision Link",
  metadataKeys: [
    "displayName",
    "policyId",
    "decisionId",
    "linkRole",
    "status",
    "externalId",
  ],
});

/** Related work — work.core refs. */
export const PolicyWorkLinkEntity = policyEntity({
  entityType: "PolicyWorkLink",
  label: "Policy Work Link",
  metadataKeys: [
    "displayName",
    "policyId",
    "workItemId",
    "linkRole",
    "status",
    "externalId",
  ],
});

/** Review schedule — scheduling.core authoritative for time. */
export const PolicyScheduleLinkEntity = policyEntity({
  entityType: "PolicyScheduleLink",
  label: "Policy Schedule Link",
  metadataKeys: [
    "displayName",
    "policyId",
    "policyVersionId",
    "scheduleItemId",
    "effectiveAt",
    "reviewAt",
    "expirationAt",
    "status",
    "externalId",
  ],
});

export const POLICY_ENTITY_DEFINITIONS: readonly EntityModel[] = Object.freeze(
  [
    OrgPolicyEntity,
    PolicyAcknowledgementEntity,
    PolicyCommunicationRefEntity,
    PolicyDecisionLinkEntity,
    PolicyDocumentRefEntity,
    PolicyExceptionEntity,
    PolicyFamilyEntity,
    PolicyObligationEntity,
    PolicyScheduleLinkEntity,
    PolicyScopeEntity,
    PolicyVersionEntity,
    PolicyWorkLinkEntity,
  ].sort((a, b) => a.entityType.localeCompare(b.entityType))
);
