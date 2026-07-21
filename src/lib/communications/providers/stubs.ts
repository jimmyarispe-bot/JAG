import type {
  CommunicationProviderAdapter,
  ProviderSendInput,
  ProviderSendResult,
} from "./types";

function deferredResult(provider: string, reason: string): ProviderSendResult {
  return {
    ok: true,
    provider,
    deferred: true,
    message: reason,
    externalId: null,
  };
}

function createStubAdapter(
  id: string,
  channel: CommunicationProviderAdapter["channel"],
  reason: string
): CommunicationProviderAdapter {
  return {
    id,
    channel,
    isConfigured: () => false,
    async send(_input: ProviderSendInput): Promise<ProviderSendResult> {
      return deferredResult(id, reason);
    },
  };
}

/** Abstraction only — Gmail integration sprint will replace this stub. */
export const gmailAdapter = createStubAdapter(
  "gmail",
  "email",
  "Gmail adapter prepared; external send deferred until integration sprint."
);

/** Abstraction only — Outlook integration sprint will replace this stub. */
export const outlookAdapter = createStubAdapter(
  "outlook",
  "email",
  "Outlook adapter prepared; external send deferred until integration sprint."
);

/** Abstraction only — Twilio integration sprint will replace this stub. */
export const twilioAdapter = createStubAdapter(
  "twilio",
  "sms",
  "Twilio adapter prepared; SMS send deferred until integration sprint."
);

/** Portal delivery stays in-app; adapter marks portal channel as available. */
export const parentPortalAdapter: CommunicationProviderAdapter = {
  id: "parent_portal",
  channel: "portal",
  isConfigured: () => true,
  async send(): Promise<ProviderSendResult> {
    return {
      ok: true,
      provider: "parent_portal",
      deferred: false,
      message: "Portal delivery recorded in AcademyOS.",
      externalId: null,
    };
  },
};

/** Abstraction only — push notifications deferred. */
export const pushNotificationAdapter = createStubAdapter(
  "push",
  "push",
  "Push notification adapter prepared; delivery deferred until integration sprint."
);
