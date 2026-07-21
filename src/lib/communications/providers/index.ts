import {
  gmailAdapter,
  outlookAdapter,
  parentPortalAdapter,
  pushNotificationAdapter,
  twilioAdapter,
} from "./stubs";
import type { CommunicationProviderAdapter, ProviderChannel } from "./types";

export type {
  CommunicationProviderAdapter,
  ProviderChannel,
  ProviderSendInput,
  ProviderSendResult,
} from "./types";

const ADAPTERS: CommunicationProviderAdapter[] = [
  gmailAdapter,
  outlookAdapter,
  twilioAdapter,
  parentPortalAdapter,
  pushNotificationAdapter,
];

export function listCommunicationAdapters(): CommunicationProviderAdapter[] {
  return [...ADAPTERS];
}

export function getAdapterForChannel(channel: ProviderChannel): CommunicationProviderAdapter {
  if (channel === "sms") return twilioAdapter;
  if (channel === "portal") return parentPortalAdapter;
  if (channel === "push") return pushNotificationAdapter;
  // Prefer configured email adapters later; default Gmail stub for abstraction
  return gmailAdapter;
}

export function channelForCommunicationType(
  type: string
): ProviderChannel | null {
  if (type === "email") return "email";
  if (type === "sms") return "sms";
  if (type === "portal" || type === "announcement" || type === "notification") {
    return "portal";
  }
  return null;
}
