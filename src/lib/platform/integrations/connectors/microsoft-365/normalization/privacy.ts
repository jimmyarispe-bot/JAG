import {
  DEFAULT_MICROSOFT_365_PRIVACY,
  type Microsoft365PrivacyPolicy,
} from "@/lib/platform/integrations/connectors/microsoft-365/entities";

export function resolvePrivacyPolicy(
  settings: Record<string, unknown>
): Microsoft365PrivacyPolicy {
  return {
    storeEmailBodies:
      settings.storeEmailBodies === true
        ? true
        : DEFAULT_MICROSOFT_365_PRIVACY.storeEmailBodies,
    storeDocumentContents:
      settings.storeDocumentContents === true
        ? true
        : DEFAULT_MICROSOFT_365_PRIVACY.storeDocumentContents,
    storeChatBodies:
      settings.storeChatBodies === true
        ? true
        : DEFAULT_MICROSOFT_365_PRIVACY.storeChatBodies,
  };
}

export function scrubPayloadForPrivacy(
  objectType: string,
  payload: Record<string, unknown>,
  privacy: Microsoft365PrivacyPolicy
): Record<string, unknown> {
  const next = { ...payload };
  if ((objectType === "message" || objectType === "attachment") && !privacy.storeEmailBodies) {
    delete next.body;
    delete next.bodyHtml;
    delete next.snippet;
    delete next.raw;
  }
  if (objectType === "chat" && !privacy.storeChatBodies) {
    delete next.body;
    delete next.content;
    delete next.raw;
  }
  if (
    (objectType === "onedrive_file" || objectType === "sharepoint_file") &&
    !privacy.storeDocumentContents
  ) {
    delete next.content;
    delete next.body;
    delete next.rawContent;
  }
  return next;
}
