import type {
  CommunicationChannelKind,
  CommunicationDefinition,
  CommunicationPreference,
} from "@/jag/communications/contracts/definitions";
import { assertAllowedChannel } from "@/jag/communications/channels";

/**
 * Select channel for a message — definition default, optional preference override.
 */
export function routeCommunicationChannel(input: {
  definition: CommunicationDefinition;
  preferredChannel?: CommunicationChannelKind;
  preference?: CommunicationPreference | null;
}): CommunicationChannelKind {
  if (input.preference && !input.preference.enabled) {
    throw new Error(
      `Channel "${input.preference.channel}" is disabled by preference`
    );
  }

  const channel =
    input.preferredChannel ??
    input.preference?.channel ??
    input.definition.defaultChannel;

  assertAllowedChannel(input.definition, channel);
  return channel;
}
