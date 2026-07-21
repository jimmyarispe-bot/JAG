/**
 * Compatibility shim — RC-2.05 implementation lives in
 * `src/lib/platform/integrations/google-workspace/drive/`.
 */

export {
  DRIVE_OBJECT_TYPES,
  isDriveObjectType,
  driveEventForRecord,
  eventTypeForDriveCanonical,
  normalizeDriveFileAttributes,
  normalizeDriveFolderAttributes,
  type DriveObjectType,
} from "@/lib/platform/integrations/google-workspace/drive";

import { normalizeDriveFileAttributes } from "@/lib/platform/integrations/google-workspace/drive";

/** Legacy single-arg normalizer used by older call sites. */
export function normalizeDriveAttributes(
  payload: Record<string, unknown>
): Record<string, unknown> {
  return normalizeDriveFileAttributes(payload);
}
