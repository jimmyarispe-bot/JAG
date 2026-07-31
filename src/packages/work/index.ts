/**
 * Work Capability Pack — Universal Organizational Work.
 */

export {
  WORK_APPLICATION_ID,
  WORK_PACKAGE_ID,
  WORK_PACKAGE_VERSION,
  WORK_PACK_ID,
} from "@/packages/work/package";

export {
  buildWorkCapabilityPacks,
  buildWorkCorePack,
  describeWorkCorePack,
  assembleWorkContributionBundle,
  workPackCatalogPayload,
} from "@/packages/work/capability-packs";

export {
  WORK_ENTITY_DEFINITIONS,
  WorkAssignmentEntity,
  WorkCommunicationRefEntity,
  WorkDependencyEntity,
  WorkDocumentRefEntity,
  WorkItemEntity,
  WorkScheduleLinkEntity,
} from "@/packages/work/entities";
export {
  WORK_PERMISSION_KEYS,
  WORK_PERMISSION_PACK,
  WORK_PERMISSION_PACK_ID,
  WORK_PERMISSION_PACKS,
} from "@/packages/work/permissions";
export { WORK_NAVIGATION } from "@/packages/work/navigation";
export {
  WORK_ITEM_TYPE_EXAMPLES,
  WORK_STATUS_STATES,
  WORK_PRIORITIES,
  WORK_DEPENDENCY_KINDS,
  WORK_OUTCOMES,
  WORK_ASSIGNMENT_ROLES,
} from "@/packages/work/catalogs";

export {
  buildWorkProofOrganizationBlueprint,
  compileWorkProofRuntime,
  generateWorkProofRuntime,
  registerWorkHandwrittenBaseline,
  resetWorkProofPortsForTests,
  listWorkProofPermissionPacks,
} from "@/packages/work/proof";
