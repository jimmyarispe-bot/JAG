/**
 * Scheduling Capability Pack — Universal Organizational Scheduling.
 */

export {
  SCHEDULING_APPLICATION_ID,
  SCHEDULING_PACKAGE_ID,
  SCHEDULING_PACKAGE_VERSION,
  SCHEDULING_PACK_ID,
} from "@/packages/scheduling/package";

export {
  buildSchedulingCapabilityPacks,
  buildSchedulingCorePack,
  describeSchedulingCorePack,
  assembleSchedulingContributionBundle,
  schedulingPackCatalogPayload,
} from "@/packages/scheduling/capability-packs";

export {
  SCHEDULING_ENTITY_DEFINITIONS,
  AvailabilityBlockEntity,
  ScheduleConflictEntity,
  ScheduleInvitationEntity,
  ScheduleItemEntity,
  ScheduleParticipantEntity,
  ScheduleResourceEntity,
  ScheduleAttachmentRefEntity,
} from "@/packages/scheduling/entities";
export {
  SCHEDULING_PERMISSION_KEYS,
  SCHEDULING_PERMISSION_PACK,
  SCHEDULING_PERMISSION_PACK_ID,
  SCHEDULING_PERMISSION_PACKS,
} from "@/packages/scheduling/permissions";
export { SCHEDULING_NAVIGATION } from "@/packages/scheduling/navigation";
export {
  SCHEDULABLE_TYPE_EXAMPLES,
  RESOURCE_TYPE_EXAMPLES,
  AVAILABILITY_STATES,
  RECURRENCE_FREQUENCIES,
  CONFLICT_KINDS,
  SCHEDULE_INVITATION_KINDS,
  SCHEDULE_PARTICIPANT_KINDS,
  SCHEDULE_STATUS_STATES,
} from "@/packages/scheduling/catalogs";

export {
  buildSchedulingProofOrganizationBlueprint,
  compileSchedulingProofRuntime,
  generateSchedulingProofRuntime,
  registerSchedulingHandwrittenBaseline,
  resetSchedulingProofPortsForTests,
  listSchedulingProofPermissionPacks,
} from "@/packages/scheduling/proof";
