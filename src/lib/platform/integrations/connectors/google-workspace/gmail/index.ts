/**
 * Compatibility shim — RC-2.03 implementation lives in
 * `src/lib/platform/integrations/google-workspace/gmail/`.
 */

export {
  GMAIL_OBJECT_TYPES,
  isGmailObjectType,
  gmailEventForRecord,
  gmailThreadEventForRecord,
  eventTypeForGmailCanonical,
  normalizeGmailAttributes,
  normalizeGmailMessageAttributes,
  normalizeGmailThreadAttributes,
  normalizeGmailLabelAttributes,
  normalizeGmailAttachmentAttributes,
  type GmailObjectType,
} from "@/lib/platform/integrations/google-workspace/gmail";
