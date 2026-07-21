import type { GoogleWorkspaceRawEntity } from "@/lib/platform/integrations/connectors/google-workspace/entities";
import type { DriveObjectType } from "@/lib/platform/integrations/google-workspace/drive/object-types";

/** Canonical kinds produced by the Drive connector (never raw Drive API). */
export const DRIVE_CANONICAL_KINDS = [
  "Document",
  "Folder",
  "Owner",
  "Permission",
  "Revision",
] as const;

export type DriveCanonicalKind = (typeof DRIVE_CANONICAL_KINDS)[number];

export type DrivePermissionRef = {
  id: string;
  email: string | null;
  role: string;
  type: string;
  domain: string | null;
};

export type DriveListPage = {
  records: GoogleWorkspaceRawEntity[];
  nextCursor: string | null;
};

export type DriveFetchOptions = {
  organizationId: string;
  objectType: DriveObjectType;
  since?: string | null;
  cursor?: string | null;
};

export type DriveSyncSliceOptions = {
  organizationId: string;
  connectionId: string;
  accessToken: string;
  forceFull?: boolean;
  objectTypes?: readonly DriveObjectType[];
};

export type DriveSyncSliceResult = {
  objectType: DriveObjectType;
  fetched: number;
  normalized: number;
  derived: number;
  cursor: string | null;
  records: GoogleWorkspaceRawEntity[];
};
