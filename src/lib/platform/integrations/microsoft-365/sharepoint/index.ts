export {
  SHAREPOINT_OBJECT_TYPES,
  SHAREPOINT_SYNC_TYPES,
  isSharePointObjectType,
  type SharePointObjectType,
} from "./object-types";
export { SharePointClient, createSharePointClient } from "./client";
export { deriveSharePointCanonicalEntities } from "./derive";
export {
  sharepointEventForRecord,
  normalizeSharePointAttributes,
} from "@/lib/platform/integrations/connectors/microsoft-365/sharepoint";
