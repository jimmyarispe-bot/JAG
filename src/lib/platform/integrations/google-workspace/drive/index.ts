/**
 * RC-2.05 — Drive Connector
 * Ingests Drive metadata (documents, folders, ownership, sharing, activity)
 * and produces canonical Document / Folder / Owner / Permission / Revision only.
 */

export {
  DRIVE_OBJECT_TYPES,
  isDriveObjectType,
  type DriveObjectType,
} from "@/lib/platform/integrations/google-workspace/drive/object-types";

export {
  DRIVE_OAUTH_SCOPES,
  type DriveOAuthScope,
} from "@/lib/platform/integrations/google-workspace/drive/scopes";

export {
  DRIVE_CANONICAL_KINDS,
  type DriveCanonicalKind,
  type DrivePermissionRef,
  type DriveFetchOptions,
  type DriveListPage,
  type DriveSyncSliceOptions,
  type DriveSyncSliceResult,
} from "@/lib/platform/integrations/google-workspace/drive/types";

export {
  normalizeDriveAttributes,
  normalizeDriveFileAttributes,
  normalizeDriveFolderAttributes,
  parseDrivePermissions,
} from "@/lib/platform/integrations/google-workspace/drive/normalize";

export {
  driveEventForRecord,
  eventTypeForDriveCanonical,
} from "@/lib/platform/integrations/google-workspace/drive/events";

export { deriveDriveCanonicalEntities } from "@/lib/platform/integrations/google-workspace/drive/derive";

export {
  DriveClient,
  createDriveClient,
  type DriveClientOptions,
} from "@/lib/platform/integrations/google-workspace/drive/client";

export {
  syncDriveSlice,
  driveSyncObjectTypes,
} from "@/lib/platform/integrations/google-workspace/drive/sync";
