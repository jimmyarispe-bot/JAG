import {
  COMMUNICATION_CHANNEL_KINDS,
  type CommunicationChannel,
  type CommunicationChannelKind,
  type CommunicationDefinition,
} from "@/jag/communications/contracts/definitions";

const CHANNEL_LABELS: Record<CommunicationChannelKind, string> = {
  email: "Email",
  sms: "SMS",
  push: "Push",
  "in-app": "In-app",
  webhook: "Webhook",
  external: "External adapter",
};

export function listCommunicationChannels(): readonly CommunicationChannel[] {
  return COMMUNICATION_CHANNEL_KINDS.map((kind) =>
    Object.freeze({
      kind,
      label: CHANNEL_LABELS[kind],
    })
  );
}

export function isCommunicationChannelKind(
  value: string
): value is CommunicationChannelKind {
  return (COMMUNICATION_CHANNEL_KINDS as readonly string[]).includes(value);
}

export function assertAllowedChannel(
  definition: CommunicationDefinition,
  channel: CommunicationChannelKind
): void {
  if (!isCommunicationChannelKind(channel)) {
    throw new Error(`Unknown communication channel "${String(channel)}"`);
  }
  const allowed = definition.allowedChannels ?? COMMUNICATION_CHANNEL_KINDS;
  if (!allowed.includes(channel)) {
    throw new Error(
      `Channel "${channel}" is not allowed for communication "${definition.id}"`
    );
  }
}
