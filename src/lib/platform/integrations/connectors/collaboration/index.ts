/**
 * Collaboration Platforms — Sprint 076 / RC-3.02
 * Slack, Teams Chat, Zoom, Google Meet metadata + Collaboration Intelligence.
 */

export {
  COLLABORATION_PROVIDERS,
  COLLABORATION_OBJECT_TYPES,
  COLLABORATION_KG_KINDS,
  type CollaborationProvider,
  type CollaborationObjectType,
  type CollaborationKgKind,
  type CollaborationCanonicalEntity,
  type CollaborationRawEntity,
} from "./entities";

export {
  collaborationCanonicalType,
  collaborationKgKind,
  buildCollaborationKnowledgeGraph,
  CANONICAL_TYPE,
} from "./mapping";

export {
  normalizeCollaborationRecords,
  toSyncRecords as toCollaborationSyncRecords,
} from "./normalization";

export {
  createDemoCollaborationClient,
  collaborationStore,
  createCollaborationPlatformConnector,
  reconnectCollaborationConnector,
} from "./services";

export {
  createSlackPlatformConnector,
  createDemoSlackClient,
  reconnectSlack,
  slackMetadata,
} from "./slack";

export {
  createTeamsPlatformConnector,
  createDemoTeamsClient,
  reconnectTeams,
  teamsMetadata,
} from "./teams";

export {
  createZoomPlatformConnector,
  createDemoZoomClient,
  reconnectZoom,
  zoomMetadata,
} from "./zoom";

export {
  createGoogleMeetPlatformConnector,
  createDemoGoogleMeetClient,
  reconnectGoogleMeet,
  googleMeetMetadata,
} from "./google-meet";

export {
  buildCommunicationGraph,
  buildCollaborationEccWidgets,
  buildCollaborationExecutiveAlerts,
  type CommunicationGraph,
  type CollaborationEccWidgets,
  type CollaborationExecutiveAlert,
  type CollaborationHeatmapWidget,
} from "./intelligence";

export { registerCollaborationPlatformConnectors } from "./registry";
export { createCollaborationB4Connector } from "./b4-connector";
