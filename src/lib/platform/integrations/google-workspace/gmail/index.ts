/**
 * RC-2.03 — Gmail Connector
 * Ingests Gmail metadata and produces canonical Communication / Email / Person /
 * Organization / Attachment / Conversation entities only.
 */

export {
  GMAIL_OBJECT_TYPES,
  isGmailObjectType,
  type GmailObjectType,
} from "@/lib/platform/integrations/google-workspace/gmail/object-types";

export {
  GMAIL_OAUTH_SCOPES,
  GMAIL_ELEVATED_OAUTH_SCOPES,
  type GmailOAuthScope,
} from "@/lib/platform/integrations/google-workspace/gmail/scopes";

export {
  GMAIL_CANONICAL_KINDS,
  type GmailCanonicalKind,
  type GmailParticipant,
  type GmailFetchOptions,
  type GmailListPage,
  type GmailSyncSliceOptions,
  type GmailSyncSliceResult,
} from "@/lib/platform/integrations/google-workspace/gmail/types";

export {
  normalizeGmailAttributes,
  normalizeGmailMessageAttributes,
  normalizeGmailThreadAttributes,
  normalizeGmailLabelAttributes,
  normalizeGmailAttachmentAttributes,
  parseGmailParticipants,
} from "@/lib/platform/integrations/google-workspace/gmail/normalize";

export {
  gmailEventForRecord,
  gmailThreadEventForRecord,
  eventTypeForGmailCanonical,
} from "@/lib/platform/integrations/google-workspace/gmail/events";

export { deriveGmailCanonicalEntities } from "@/lib/platform/integrations/google-workspace/gmail/derive";

export {
  GmailClient,
  createGmailClient,
  type GmailClientOptions,
} from "@/lib/platform/integrations/google-workspace/gmail/client";

export {
  syncGmailSlice,
  gmailSyncObjectTypes,
} from "@/lib/platform/integrations/google-workspace/gmail/sync";
