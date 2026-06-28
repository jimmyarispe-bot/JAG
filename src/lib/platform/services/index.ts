/** AcademyOS Platform Services — Phase 2 foundation */
export * from "@/lib/platform/activity";
export * from "@/lib/platform/relationships";
export * from "@/lib/platform/tags";
export * from "@/lib/platform/notes";
export * from "@/lib/platform/profile";
export * from "@/lib/platform/workflow";
export * from "@/lib/platform/decision";
export * from "@/lib/platform/events";
export * from "@/lib/platform/intelligence-graph";
export * from "@/lib/platform/automation";
export * from "@/lib/platform/shared/entity-types";
export { extractSchoolOrganizationId, resolveActorUserId, resolveSchoolContext, resolveStudentContext } from "@/lib/platform/shared/context";
export {
  applyPlatformTagsAction,
  createPlatformNoteAction,
  createPlatformTagAction,
  deletePlatformNoteAction,
  pinPlatformNoteAction,
  removePlatformTagAction,
  updatePlatformNoteAction,
} from "@/lib/platform/services/server-actions";
