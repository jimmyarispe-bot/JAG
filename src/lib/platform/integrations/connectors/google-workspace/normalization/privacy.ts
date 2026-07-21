/**
 * Privacy scrubbing — metadata-only by default.
 */

import {
  DEFAULT_GOOGLE_WORKSPACE_PRIVACY,
  type GoogleWorkspacePrivacyPolicy,
} from "@/lib/platform/integrations/connectors/google-workspace/entities";

export function resolvePrivacyPolicy(
  settings: Record<string, unknown>
): GoogleWorkspacePrivacyPolicy {
  return {
    storeEmailBodies:
      settings.storeEmailBodies === true
        ? true
        : DEFAULT_GOOGLE_WORKSPACE_PRIVACY.storeEmailBodies,
    storeDocumentContents:
      settings.storeDocumentContents === true
        ? true
        : DEFAULT_GOOGLE_WORKSPACE_PRIVACY.storeDocumentContents,
  };
}

/** Strip bodies / contents unless policy allows — defense in depth at normalize. */
export function scrubPayloadForPrivacy(
  objectType: string,
  payload: Record<string, unknown>,
  privacy: GoogleWorkspacePrivacyPolicy
): Record<string, unknown> {
  const next = { ...payload };
  if ((objectType === "message" || objectType === "attachment") && !privacy.storeEmailBodies) {
    delete next.body;
    delete next.bodyHtml;
    delete next.snippet;
    delete next.raw;
    delete next.bytes;
  }
  if (
    (objectType === "doc" ||
      objectType === "sheet" ||
      objectType === "slide" ||
      objectType === "drive_file") &&
    !privacy.storeDocumentContents
  ) {
    delete next.content;
    delete next.body;
    delete next.cells;
    delete next.rawContent;
    delete next.slidesContent;
  }
  return next;
}
