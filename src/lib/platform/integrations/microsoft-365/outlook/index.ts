/**
 * RC-3.01 — Outlook (Mail) domain package.
 * Ingests Outlook metadata and produces canonical Communication / Email / Person.
 */

export {
  OUTLOOK_OBJECT_TYPES,
  OUTLOOK_SYNC_TYPES,
  isOutlookObjectType,
  type OutlookObjectType,
} from "./object-types";
export { OutlookClient, createOutlookClient, type OutlookFetchOptions } from "./client";
export { deriveOutlookCanonicalEntities } from "./derive";
export {
  outlookEventForRecord,
  normalizeOutlookAttributes,
} from "@/lib/platform/integrations/connectors/microsoft-365/outlook";
