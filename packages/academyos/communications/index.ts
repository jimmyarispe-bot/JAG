export {
  COMMUNICATION_CHANNELS,
  COMMUNICATION_DOMAINS,
  WORKFLOW_RECIPES,
  ANNOUNCEMENT_SCOPES,
  type Announcement,
  type AnnouncementScope,
  type CommunicationChannel,
  type CommunicationDomain,
  type CommunicationTemplate,
  type CommunicationsSummary,
  type Message,
  type MessageThread,
  type Notification,
  type NotificationStatus,
  type TemplateStatus,
  type WorkflowInstance,
  type WorkflowRecipe,
  type WorkflowStatus,
} from "./types";
export {
  DEFAULT_CHANNEL_ROUTING,
  DOMAIN_EVENT_CATALOG,
  WORKFLOW_RECIPE_STEPS,
} from "./config";
export {
  resetCommunicationsStoreForTests,
  getChannelRouting,
  setChannelRouting,
  listNotifications,
  listWorkflows,
  listAnnouncements,
  listTemplates,
} from "./store";
export { emitCommunicationsEvent } from "./events";
export { createTemplateService, renderTemplate } from "./templates";
export { createNotificationService } from "./notifications";
export { createMessagingService } from "./messaging";
export { createAnnouncementService } from "./announcements";
export { createWorkflowService } from "./workflows";
export { createReminderService } from "./reminders";
export { createCommunicationCenterService } from "./communication-center";
export {
  createNotificationEngine,
  routeAcademyOsDomainEvent,
} from "./engine";
export { buildCommunicationsSummary } from "./dashboard";
export {
  createCommunicationsReportingService,
  type CommunicationsReport,
  type CommunicationsReportKind,
} from "./reporting";
export { createCommunicationsParentPortalService } from "./parent-portal";
export { createCommunicationsEmployeePortalService } from "./employee-portal";
