/**
 * Participant resolution — via extension ports; local fallback for explicit addresses.
 */

import type {
  CommunicationChannelKind,
  CommunicationParticipant,
  CommunicationRecipient,
} from "@/jag/communications/contracts/definitions";
import { getCommunicationExtensions } from "@/jag/communications/contracts/extensions";
import { getCommunicationPreference } from "@/jag/communications/registry";

export async function resolveCommunicationRecipients(input: {
  organizationId: string;
  channel: CommunicationChannelKind;
  participants: readonly CommunicationParticipant[];
}): Promise<CommunicationRecipient[]> {
  const ports = getCommunicationExtensions();
  const recipients: CommunicationRecipient[] = [];

  if (ports.identity?.resolveParticipants) {
    const res = await ports.identity.resolveParticipants({
      participants: input.participants,
      organizationId: input.organizationId,
    });
    if (res.ok && res.value?.recipients?.length) {
      return [...res.value.recipients];
    }
  }

  for (const participant of input.participants) {
    if (participant.role === "sender") continue;

    if (participant.role === "org_role" && participant.orgRoleId) {
      if (ports.organization?.resolveOrgRoleRecipients) {
        const res = await ports.organization.resolveOrgRoleRecipients({
          orgRoleId: participant.orgRoleId,
          organizationId: input.organizationId,
          channel: input.channel,
        });
        if (res.ok && res.value?.recipients?.length) {
          recipients.push(...res.value.recipients);
          continue;
        }
      }
    }

    const pref = participant.userId
      ? getCommunicationPreference({
          organizationId: input.organizationId,
          userId: participant.userId,
          channel: input.channel,
        })
      : null;

    if (pref && !pref.enabled) {
      continue;
    }

    recipients.push(
      Object.freeze({
        participant: Object.freeze({ ...participant }),
        channel: input.channel,
        resolvedAddress: participant.addressHint,
        resolved: Boolean(participant.addressHint || participant.userId),
      })
    );
  }

  return recipients;
}
