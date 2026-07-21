export type CommunicationType =
  | "email"
  | "sms"
  | "portal"
  | "call"
  | "meeting"
  | "announcement"
  | "notification"
  | "reminder";

export type CommunicationDirection = "inbound" | "outbound";

export type CommunicationStatus =
  | "draft"
  | "scheduled"
  | "queued"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "archived";

export type CommunicationPriority = "low" | "normal" | "high" | "urgent";

export type AudienceScope =
  | "student"
  | "guardian"
  | "family"
  | "teacher"
  | "employee"
  | "class"
  | "program"
  | "school"
  | "organization"
  | "custom";

export type RecipientType =
  | "student"
  | "guardian"
  | "family"
  | "teacher"
  | "employee"
  | "class"
  | "program"
  | "school"
  | "custom";

export interface CommunicationRecipientInput {
  recipientType: RecipientType;
  recipientId?: string | null;
  displayName?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface CommunicationAttachmentInput {
  fileName: string;
  fileUrl: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
  version?: number;
}

export interface ComposeCommunicationInput {
  type: CommunicationType;
  direction?: CommunicationDirection;
  priority?: CommunicationPriority;
  subject?: string | null;
  bodyText?: string | null;
  bodyHtml?: string | null;
  schoolId?: string | null;
  organizationId?: string | null;
  studentId?: string | null;
  familyId?: string | null;
  templateId?: string | null;
  audienceScope?: AudienceScope | null;
  recipients?: CommunicationRecipientInput[];
  attachments?: CommunicationAttachmentInput[];
  tags?: string[];
  scheduledFor?: string | null;
  scheduleRrule?: string | null;
  metadata?: Record<string, unknown>;
  status?: "draft" | "scheduled" | "queued";
}

export interface CommunicationRow {
  id: string;
  audit_id: string;
  organization_id: string | null;
  school_id: string | null;
  type: CommunicationType;
  direction: CommunicationDirection;
  priority: CommunicationPriority;
  status: CommunicationStatus;
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  sender_user_id: string | null;
  sender_display_name: string | null;
  student_id: string | null;
  family_id: string | null;
  template_id: string | null;
  audience_scope: AudienceScope | null;
  scheduled_for: string | null;
  schedule_rrule: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  tags: string[] | null;
  metadata: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface CommunicationListRow extends CommunicationRow {
  schoolName: string | null;
  studentName: string | null;
  familyName: string | null;
  recipientSummary: string;
}

export type CommunicationFilter =
  | "all"
  | "today"
  | "unread"
  | "scheduled"
  | "failed"
  | "sent"
  | "draft";

export interface TemplateMergeContext {
  StudentName?: string;
  GuardianName?: string;
  School?: string;
  Teacher?: string;
  Program?: string;
  [key: string]: string | undefined;
}

export interface CommunicationTemplateRow {
  id: string;
  organization_id: string | null;
  school_id: string | null;
  template_key: string;
  name: string;
  category: string;
  subject: string;
  body_text: string;
  body_html: string | null;
  variables: string[] | null;
  is_active: boolean;
  usage_count: number;
}

export type AnnouncementAudience =
  | "organization"
  | "school"
  | "program"
  | "class"
  | "staff"
  | "parents"
  | "students";

export interface InAppNotificationRow {
  id: string;
  user_id: string;
  title: string;
  body: string;
  category: string;
  href: string | null;
  related_student_id: string | null;
  related_family_id: string | null;
  related_communication_id: string | null;
  read_at: string | null;
  created_at: string;
}
