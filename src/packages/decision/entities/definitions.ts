/**
 * Decision domain entities — organizational choice (not Decision Engine / BPM / AI).
 * Entity type BusinessDecision avoids clashing with JAG Decision Engine naming.
 * Cross-pack refs are string metadata only.
 */

import type { EntityModel } from "@/jag/modeling";
import { decisionEntity } from "@/packages/decision/_helpers";

export const DecisionTypeEntity = decisionEntity({
  entityType: "DecisionType",
  label: "Decision Type",
  metadataKeys: [
    "displayName",
    "typeKey",
    "category",
    "description",
    "status",
    "externalId",
  ],
});

export const DecisionCategoryEntity = decisionEntity({
  entityType: "DecisionCategory",
  label: "Decision Category",
  metadataKeys: [
    "displayName",
    "categoryKey",
    "description",
    "status",
    "externalId",
  ],
});

/** Core organizational decision record. */
export const BusinessDecisionEntity = decisionEntity({
  entityType: "BusinessDecision",
  label: "Decision",
  metadataKeys: [
    "displayName",
    "title",
    "summary",
    "decisionTypeId",
    "decisionCategoryId",
    "decisionStatus",
    "outcome",
    "selectedOptionId",
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

/** Option / alternative / recommendation — no scoring engine. */
export const DecisionOptionEntity = decisionEntity({
  entityType: "DecisionOption",
  label: "Decision Option",
  metadataKeys: [
    "displayName",
    "decisionId",
    "optionKind",
    "description",
    "isRecommended",
    "sortOrder",
    "status",
    "externalId",
  ],
});

/** Rationale — justification, assumptions, risks, benefits, trade-offs. */
export const DecisionRationaleEntity = decisionEntity({
  entityType: "DecisionRationale",
  label: "Decision Rationale",
  metadataKeys: [
    "displayName",
    "decisionId",
    "justification",
    "assumptions",
    "risks",
    "benefits",
    "tradeOffs",
    "status",
    "externalId",
  ],
});

/** Evidence — documents.core references only. */
export const DecisionEvidenceRefEntity = decisionEntity({
  entityType: "DecisionEvidenceRef",
  label: "Decision Evidence Ref",
  metadataKeys: [
    "displayName",
    "decisionId",
    "documentId",
    "documentVersionId",
    "evidenceRole",
    "linkedRecordType",
    "linkedRecordId",
    "status",
    "externalId",
  ],
});

/** Participants — identity.core refs; no authorization logic. */
export const DecisionParticipantEntity = decisionEntity({
  entityType: "DecisionParticipant",
  label: "Decision Participant",
  metadataKeys: [
    "displayName",
    "decisionId",
    "participantRole",
    "personId",
    "teamId",
    "status",
    "externalId",
  ],
});

/** Related work — work.core refs. */
export const DecisionWorkLinkEntity = decisionEntity({
  entityType: "DecisionWorkLink",
  label: "Decision Work Link",
  metadataKeys: [
    "displayName",
    "decisionId",
    "workItemId",
    "linkRole",
    "status",
    "externalId",
  ],
});

/** Communications — communications.core refs; no transport. */
export const DecisionCommunicationRefEntity = decisionEntity({
  entityType: "DecisionCommunicationRef",
  label: "Decision Communication Ref",
  metadataKeys: [
    "displayName",
    "decisionId",
    "conversationId",
    "communicationNotificationId",
    "communicationMessageId",
    "communicationKind",
    "status",
    "externalId",
  ],
});

/** Schedule anchors — scheduling.core authoritative for time. */
export const DecisionScheduleLinkEntity = decisionEntity({
  entityType: "DecisionScheduleLink",
  label: "Decision Schedule Link",
  metadataKeys: [
    "displayName",
    "decisionId",
    "scheduleItemId",
    "deadlineAt",
    "reviewAt",
    "effectiveAt",
    "status",
    "externalId",
  ],
});

/** Approval representation only — not a policy/workflow engine. */
export const DecisionApprovalRepresentationEntity = decisionEntity({
  entityType: "DecisionApprovalRepresentation",
  label: "Decision Approval Representation",
  metadataKeys: [
    "displayName",
    "decisionId",
    "approverPersonId",
    "approvalStatus",
    "decidedAt",
    "comment",
    "status",
    "externalId",
  ],
});

export const DECISION_ENTITY_DEFINITIONS: readonly EntityModel[] =
  Object.freeze(
    [
      BusinessDecisionEntity,
      DecisionApprovalRepresentationEntity,
      DecisionCategoryEntity,
      DecisionCommunicationRefEntity,
      DecisionEvidenceRefEntity,
      DecisionOptionEntity,
      DecisionParticipantEntity,
      DecisionRationaleEntity,
      DecisionScheduleLinkEntity,
      DecisionTypeEntity,
      DecisionWorkLinkEntity,
    ].sort((a, b) => a.entityType.localeCompare(b.entityType))
  );
