export {
  createDemoGoogleWorkspaceClient,
  allGoogleWorkspaceObjectTypes,
  type GoogleWorkspaceClient,
  type GoogleWorkspaceListPage,
} from "./demo-client";
export { googleWorkspaceStore, type GoogleWorkspaceStoreSnapshot } from "./store";
export {
  buildGoogleWorkspaceIntelligenceFeed,
  getGoogleWorkspaceFeed,
  type GoogleWorkspaceIntelligenceFeed,
} from "./intelligence-feed";
export {
  correlateGoogleWorkspace,
  type GoogleWorkspaceCorrelation,
  type WorkspaceCorrelationLink,
} from "./correlation";
export {
  eventTypeForGoogleRecord,
  publishGoogleWorkspaceEvents,
} from "./events";
export {
  buildGoogleWorkspaceEccWidgets,
  projectEccWidgets,
  type GoogleWorkspaceEccWidgets,
  type RecentMeetingsWidget,
  type CalendarSummaryWidget,
  type CommunicationPulseWidget,
  type SharedDocumentsWidget,
  type CollaborationActivityWidget,
} from "./ecc-widgets";
