export {
  canManageCommunications,
  canComposeCommunications,
  canViewCommunications,
  canAnnounceSchoolWide,
  assertCanCompose,
  assertCanView,
  requireComposeAccess,
  requireViewAccess,
} from "./access";

export {
  composeCommunication,
  saveDraft,
  scheduleCommunication,
  sendCommunication,
  composeAndSend,
  markCommunicationRead,
  archiveCommunication,
  restoreCommunication,
  duplicateCommunication,
  deleteCommunication,
  loadCommunication,
} from "./service";

export {
  listCommunications,
  getCommunicationById,
  listTemplates,
  getTemplateById,
  normalizeCommunicationFilter,
} from "./queries";

export { renderTemplate, renderTemplateString, extractTemplateVariables } from "./templates";
export {
  createAnnouncement,
  listAnnouncements,
  archiveAnnouncement,
  duplicateAnnouncement,
} from "./announcements";
export { logPhoneCall } from "./phone-calls";
export { logMeeting } from "./meetings";
export {
  createInAppNotification,
  listInAppNotifications,
  markInAppNotificationRead,
  toNavNotificationShape,
} from "./notifications";
export {
  getFamilyCommunicationTimeline,
  getStudentCommunicationTimeline,
} from "./timeline";
export {
  listCommunicationAdapters,
  getAdapterForChannel,
  channelForCommunicationType,
} from "./providers";

export type * from "./types";
