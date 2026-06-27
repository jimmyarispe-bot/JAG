export { ACTIVITY_EVENT_CATALOG, getActivityEventDefinition, isKnownActivityEventType } from "@/lib/platform/activity/catalog";
export { validateRecordActivityInput } from "@/lib/platform/activity/validate";
export { getActivityFeed, getAuditActivity, getEntityActivity, getEmployeeActivityFeed, getStudentActivityFeed, countActivityAlerts } from "@/lib/platform/activity/query";
export { recordActivity } from "@/lib/platform/activity/record";
export type {
  ActivityActorType,
  ActivityClassification,
  ActivityFeedFilters,
  ActivitySeverity,
  ActivityVisibility,
  PlatformActivityEvent,
  RecordActivityInput,
} from "@/lib/platform/activity/types";
