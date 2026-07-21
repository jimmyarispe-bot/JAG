export {
  buildCommunicationGraph,
  type CommunicationGraph,
  type CommunicationGraphNode,
  type CommunicationGraphEdge,
  type SiloSignal,
  type LatencySignal,
  type DensitySignal,
  type BottleneckSignal,
  type CollaborationNetworkLink,
  type DepartmentInteraction,
  type MeetingDensitySignal,
  type CommunicationTrendPoint,
} from "./communication-graph";
export {
  buildCollaborationExecutiveAlerts,
  type CollaborationExecutiveAlert,
  type CollaborationExecutiveAlertKind,
} from "./executive-alerts";
export {
  buildCollaborationEccWidgets,
  type CollaborationEccWidgets,
  type CommunicationHealthWidget,
  type ResponseTimeWidget,
  type ActiveTeamsWidget,
  type MeetingLoadWidget,
  type CollaborationHeatmapWidget,
} from "./ecc-widgets";
