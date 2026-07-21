/**
 * RC-6 — Executive Command Center 2.0 (Mission Control)
 *
 * Organization timeline · Alert Center · Approval Center
 * Investigation Workspace · AI Workspace · Digital Twin controls
 * Scenario Simulator · Risk Center · Initiative Monitor
 * Portfolio Health · Organization Graph Viewer
 *
 * Soft-reads knowledge-graph, domain feeds, and Copilot 2.0.
 * Does not call connector vendor APIs or invent domain engines.
 */

export {
  EXECUTIVE_COMMAND_CENTER_V2_VERSION,
  MISSION_CONTROL_PANELS,
  type MissionControlPanelId,
  type MissionControlCard,
  type MissionControlPanel,
  type MissionControlWorkspace,
  type MissionControlLights,
} from "./types";

export {
  buildMissionControl,
  type BuildMissionControlInput,
} from "./engine/mission-control";
