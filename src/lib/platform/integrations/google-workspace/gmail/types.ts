import type { GoogleWorkspaceRawEntity } from "@/lib/platform/integrations/connectors/google-workspace/entities";
import type { GmailObjectType } from "@/lib/platform/integrations/google-workspace/gmail/object-types";

/** Canonical kinds produced by the Gmail connector (never raw Gmail). */
export const GMAIL_CANONICAL_KINDS = [
  "Communication",
  "Email",
  "Person",
  "Organization",
  "Attachment",
  "Conversation",
] as const;

export type GmailCanonicalKind = (typeof GMAIL_CANONICAL_KINDS)[number];

export type GmailParticipant = {
  email: string;
  displayName: string | null;
  role: "from" | "to" | "cc" | "bcc";
  domain: string;
  isInternal: boolean;
};

export type GmailListPage = {
  records: GoogleWorkspaceRawEntity[];
  nextCursor: string | null;
};

export type GmailFetchOptions = {
  organizationId: string;
  objectType: GmailObjectType;
  /** Incremental checkpoint (ISO updatedAt watermark). */
  since?: string | null;
  /** Pagination cursor from prior page. */
  cursor?: string | null;
};

export type GmailSyncSliceOptions = {
  organizationId: string;
  connectionId: string;
  accessToken: string;
  /** When true, ignore checkpoints and pull full history for Gmail types. */
  forceFull?: boolean;
  objectTypes?: readonly GmailObjectType[];
};

export type GmailSyncSliceResult = {
  objectType: GmailObjectType;
  fetched: number;
  normalized: number;
  derived: number;
  cursor: string | null;
  records: GoogleWorkspaceRawEntity[];
};
