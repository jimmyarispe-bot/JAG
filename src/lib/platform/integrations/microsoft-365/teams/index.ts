export {
  TEAMS_OBJECT_TYPES,
  TEAMS_SYNC_TYPES,
  isTeamsObjectType,
  type TeamsObjectType,
} from "./object-types";
export { TeamsClient, createTeamsClient } from "./client";
export { deriveTeamsCanonicalEntities } from "./derive";
export {
  normalizeChatAttributes,
  normalizeMeetAttributes,
} from "@/lib/platform/integrations/connectors/microsoft-365/teams";
