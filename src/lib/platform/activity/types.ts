export type ActivityClassification = "operational" | "communication" | "audit" | "system";
export type ActivityVisibility = "staff" | "parent" | "student" | "internal";
export type ActivitySeverity = "info" | "warning" | "critical";
export type ActivityActorType = "user" | "system" | "automation" | "integration";

export interface PlatformActivityEvent {
  id: string;
  organization_id: string | null;
  school_id: string | null;
  campus_id: string | null;
  module_key: string;
  event_type: string;
  event_version: string;
  entity_type: string;
  entity_id: string;
  title: string;
  summary: string;
  body: string;
  actor_user_id: string | null;
  actor_type: ActivityActorType;
  occurred_at: string;
  student_id: string | null;
  family_id: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  classification: ActivityClassification;
  visibility: ActivityVisibility;
  severity: ActivitySeverity | null;
  payload: Record<string, unknown>;
  correlation_id: string | null;
  source_table: string | null;
  source_id: string | null;
  searchable_text: string;
  created_at: string;
}

export interface RecordActivityInput {
  eventType: string;
  moduleKey?: string;
  entityType: string;
  entityId: string;
  title: string;
  summary?: string;
  body?: string;
  organizationId?: string | null;
  schoolId?: string | null;
  campusId?: string | null;
  studentId?: string | null;
  familyId?: string | null;
  actorUserId?: string | null;
  actorType?: ActivityActorType;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  classification?: ActivityClassification;
  visibility?: ActivityVisibility;
  severity?: ActivitySeverity | null;
  payload?: Record<string, unknown>;
  correlationId?: string | null;
  sourceTable?: string | null;
  sourceId?: string | null;
  occurredAt?: string;
}

export interface ActivityFeedFilters {
  classification?: ActivityClassification | ActivityClassification[];
  visibility?: ActivityVisibility | ActivityVisibility[];
  moduleKey?: string;
  eventType?: string;
  cursor?: string;
  limit?: number;
}
