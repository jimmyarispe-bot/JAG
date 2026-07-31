/**
 * Work domain entities — organizational effort (not BPM, PM, or payroll).
 * Cross-pack refs are string metadata only.
 */

import type { EntityModel } from "@/jag/modeling";
import { workEntity } from "@/packages/work/_helpers";

export const WorkItemTypeEntity = workEntity({
  entityType: "WorkItemType",
  label: "Work Item Type",
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
 * Core work item — effort representation.
 * Scheduling remains authoritative for time (via WorkScheduleLink).
 */
export const WorkItemEntity = workEntity({
  entityType: "WorkItem",
  label: "Work Item",
  metadataKeys: [
    "displayName",
    "title",
    "description",
    "workItemTypeId",
    "priority",
    "workStatus",
    "outcome",
    "parentWorkItemId",
    "organizationId",
    "workflowRepresentationKey",
    "percentComplete",
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

/** Assignment — identity.core person refs only. */
export const WorkAssignmentEntity = workEntity({
  entityType: "WorkAssignment",
  label: "Work Assignment",
  metadataKeys: [
    "displayName",
    "workItemId",
    "assignmentRole",
    "personId",
    "teamId",
    "assignedAt",
    "status",
    "externalId",
  ],
});

/**
 * Scheduling link — planned/actual windows + schedule dependency.
 * scheduling.core owns time; these are effort-side references.
 */
export const WorkScheduleLinkEntity = workEntity({
  entityType: "WorkScheduleLink",
  label: "Work Schedule Link",
  metadataKeys: [
    "displayName",
    "workItemId",
    "scheduleItemId",
    "plannedStartAt",
    "plannedFinishAt",
    "actualStartAt",
    "actualFinishAt",
    "scheduleDependencyKind",
    "status",
    "externalId",
  ],
});

/** Document refs — documents.core owns documents. */
export const WorkDocumentRefEntity = workEntity({
  entityType: "WorkDocumentRef",
  label: "Work Document Ref",
  metadataKeys: [
    "displayName",
    "workItemId",
    "documentId",
    "documentVersionId",
    "documentRole",
    "status",
    "externalId",
  ],
});

/** Communication refs — communications.core owns intent/transport models. */
export const WorkCommunicationRefEntity = workEntity({
  entityType: "WorkCommunicationRef",
  label: "Work Communication Ref",
  metadataKeys: [
    "displayName",
    "workItemId",
    "communicationKind",
    "conversationId",
    "communicationMessageId",
    "communicationNotificationId",
    "status",
    "externalId",
  ],
});

/** Dependency representation — no execution engine. */
export const WorkDependencyEntity = workEntity({
  entityType: "WorkDependency",
  label: "Work Dependency",
  metadataKeys: [
    "displayName",
    "fromWorkItemId",
    "toWorkItemId",
    "dependencyKind",
    "description",
    "status",
    "externalId",
  ],
});

/**
 * Workflow representation only — not a BPM engine binding.
 * Captures named steps / stage labels for organizational work patterns.
 */
export const WorkWorkflowRepresentationEntity = workEntity({
  entityType: "WorkWorkflowRepresentation",
  label: "Work Workflow Representation",
  metadataKeys: [
    "displayName",
    "workflowKey",
    "stageLabels",
    "description",
    "status",
    "externalId",
  ],
});

export const WORK_ENTITY_DEFINITIONS: readonly EntityModel[] = Object.freeze(
  [
    WorkAssignmentEntity,
    WorkCommunicationRefEntity,
    WorkDependencyEntity,
    WorkDocumentRefEntity,
    WorkItemEntity,
    WorkItemTypeEntity,
    WorkScheduleLinkEntity,
    WorkWorkflowRepresentationEntity,
  ].sort((a, b) => a.entityType.localeCompare(b.entityType))
);
