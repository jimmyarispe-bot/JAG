export { ACTIVITY_EVENT_CATALOG, getActivityEventDefinition, isKnownActivityEventType } from "@/lib/platform/activity/catalog";
export { getActivityFeed, getAuditActivity, getEntityActivity, getStudentActivityFeed, countActivityAlerts } from "@/lib/platform/activity/query";
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
