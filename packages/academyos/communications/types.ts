/** Communications & Workflow™ — notifications, messaging, workflows. */

export const COMMUNICATION_CHANNELS = [
  "in_app",
  "email",
  "sms",
  "push",
  "announcement",
] as const;
export type CommunicationChannel = (typeof COMMUNICATION_CHANNELS)[number];

export const NOTIFICATION_STATUSES = [
  "Queued",
  "Sent",
  "Delivered",
  "Failed",
  "Read",
] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

export const TEMPLATE_STATUSES = ["Draft", "Published"] as const;
export type TemplateStatus = (typeof TEMPLATE_STATUSES)[number];

export const WORKFLOW_STATUSES = [
  "Draft",
  "Active",
  "Waiting",
  "Completed",
  "Cancelled",
] as const;
export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];

export const ANNOUNCEMENT_SCOPES = [
  "Organization",
  "Campus",
  "Program",
  "Grade",
  "Class",
  "Employee Group",
  "Family Group",
] as const;
export type AnnouncementScope = (typeof ANNOUNCEMENT_SCOPES)[number];

export const COMMUNICATION_DOMAINS = [
  "admissions",
  "sis",
  "academic_ops",
  "learning",
  "finance",
  "workforce",
  "communications",
] as const;
export type CommunicationDomain = (typeof COMMUNICATION_DOMAINS)[number];

export const WORKFLOW_RECIPES = [
  "Admissions Checklist",
  "Enrollment Checklist",
  "Student Withdrawal",
  "Employee Onboarding",
  "Employee Offboarding",
  "Scholarship Renewal",
  "Tuition Collection",
  "Annual Enrollment",
] as const;
export type WorkflowRecipe = (typeof WORKFLOW_RECIPES)[number];

export const TEMPLATE_VARIABLES = [
  "student",
  "parent",
  "teacher",
  "campus",
  "program",
  "date",
  "amount",
  "link",
] as const;
export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number];

export type ChannelRoutingConfig = {
  readonly enabledChannels: readonly CommunicationChannel[];
  /** Preferred order when multiple channels apply */
  readonly defaultChannels: readonly CommunicationChannel[];
};

export type NotificationPreference = {
  readonly id: string;
  readonly organizationId: string;
  readonly subjectType: "parent" | "employee" | "family";
  readonly subjectId: string;
  readonly channels: readonly CommunicationChannel[];
  readonly mutedDomains: readonly CommunicationDomain[];
  readonly updatedAt: string;
};

export type CommunicationTemplate = {
  readonly id: string;
  readonly organizationId: string;
  readonly key: string;
  readonly name: string;
  readonly domain: CommunicationDomain;
  readonly channel: CommunicationChannel;
  readonly subject: string;
  readonly body: string;
  readonly status: TemplateStatus;
  readonly version: number;
  readonly versions: readonly {
    readonly version: number;
    readonly subject: string;
    readonly body: string;
    readonly publishedAt: string;
    readonly publishedBy: string;
  }[];
  readonly twinEntityId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
};

export type Notification = {
  readonly id: string;
  readonly organizationId: string;
  readonly domain: CommunicationDomain;
  readonly eventKey: string;
  readonly channel: CommunicationChannel;
  readonly status: NotificationStatus;
  readonly title: string;
  readonly body: string;
  readonly templateId: string | null;
  readonly recipientType: "parent" | "employee" | "family" | "staff" | "system";
  readonly recipientId: string;
  readonly studentId: string | null;
  readonly familyId: string | null;
  readonly employeeId: string | null;
  readonly campusId: string | null;
  readonly programId: string | null;
  readonly metadata: Readonly<Record<string, string>>;
  readonly deliveredAt: string | null;
  readonly readAt: string | null;
  readonly failedReason: string | null;
  readonly twinEntityId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
};

export type MessageThread = {
  readonly id: string;
  readonly organizationId: string;
  readonly subject: string;
  readonly participantType: "parent" | "employee" | "family" | "staff";
  readonly participantIds: readonly string[];
  readonly studentId: string | null;
  readonly familyId: string | null;
  readonly employeeId: string | null;
  readonly secure: boolean;
  readonly twinEntityId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
};

export type Message = {
  readonly id: string;
  readonly organizationId: string;
  readonly threadId: string;
  readonly body: string;
  readonly senderType: "parent" | "employee" | "staff" | "system";
  readonly senderId: string;
  readonly readBy: readonly string[];
  readonly twinEntityId: string | null;
  readonly createdAt: string;
};

export type Announcement = {
  readonly id: string;
  readonly organizationId: string;
  readonly title: string;
  readonly body: string;
  readonly scope: AnnouncementScope;
  readonly scopeTargetId: string | null;
  readonly publishedAt: string | null;
  readonly expiresAt: string | null;
  readonly readBy: readonly string[];
  readonly twinEntityId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
};

export type WorkflowStep = {
  readonly id: string;
  readonly title: string;
  readonly status: "Pending" | "Completed" | "Skipped";
  readonly assigneeType: "parent" | "employee" | "staff" | "system" | null;
  readonly assigneeId: string | null;
  readonly completedAt: string | null;
};

export type WorkflowInstance = {
  readonly id: string;
  readonly organizationId: string;
  readonly recipe: WorkflowRecipe;
  readonly name: string;
  readonly status: WorkflowStatus;
  readonly domain: CommunicationDomain;
  readonly studentId: string | null;
  readonly familyId: string | null;
  readonly employeeId: string | null;
  readonly campusId: string | null;
  readonly programId: string | null;
  readonly steps: readonly WorkflowStep[];
  readonly twinEntityId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
  readonly completedAt: string | null;
};

export type Reminder = {
  readonly id: string;
  readonly organizationId: string;
  readonly title: string;
  readonly dueAt: string;
  readonly channel: CommunicationChannel;
  readonly recipientType: "parent" | "employee" | "staff";
  readonly recipientId: string;
  readonly relatedType: "notification" | "workflow" | "announcement" | null;
  readonly relatedId: string | null;
  readonly status: "Scheduled" | "Sent" | "Cancelled";
  readonly createdAt: string;
  readonly createdBy: string;
};

export type CommunicationCenterItem = {
  readonly id: string;
  readonly organizationId: string;
  readonly kind:
    | "message"
    | "notification"
    | "email"
    | "sms"
    | "announcement"
    | "workflow";
  readonly title: string;
  readonly body: string;
  readonly occurredAt: string;
  readonly studentId: string | null;
  readonly familyId: string | null;
  readonly employeeId: string | null;
  readonly campusId: string | null;
  readonly programId: string | null;
  readonly status: string;
};

export type CommunicationsSummary = {
  readonly organizationId: string;
  readonly deliveryRate: number;
  readonly openRate: number;
  readonly responseRate: number;
  readonly outstandingWorkflows: number;
  readonly failedNotifications: number;
  readonly trends: {
    readonly notificationsCreated: number;
    readonly messagesSent: number;
    readonly announcementsPublished: number;
    readonly workflowsCompleted: number;
  };
};
