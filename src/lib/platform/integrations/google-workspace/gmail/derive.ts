/**
 * Derive Person / Organization / Communication canonical records from Gmail Emails.
 * Downstream consumers only see these canonical entities — never raw Gmail.
 */

import { createHash } from "crypto";
import type {
  GoogleWorkspaceCanonicalEntity,
  GoogleWorkspaceObjectType,
} from "@/lib/platform/integrations/connectors/google-workspace/entities";
import type { GmailParticipant } from "@/lib/platform/integrations/google-workspace/gmail/types";
import { parseGmailParticipants } from "@/lib/platform/integrations/google-workspace/gmail/normalize";

function digestId(kind: string, key: string): string {
  const hash = createHash("sha1").update(`${kind}:${key}`).digest("hex").slice(0, 16);
  return `jag_${kind}_${hash}`;
}

function asParticipants(attrs: Record<string, unknown>): GmailParticipant[] {
  if (Array.isArray(attrs.participants) && attrs.participants.length) {
    return attrs.participants as GmailParticipant[];
  }
  return parseGmailParticipants(attrs, String(attrs.workspaceDomain ?? ""));
}

/**
 * Expand normalized Gmail records into Person + Organization + Communication links.
 * Email / Conversation / Attachment primaries remain; derived entities are appended.
 */
export function deriveGmailCanonicalEntities(
  records: readonly GoogleWorkspaceCanonicalEntity[]
): GoogleWorkspaceCanonicalEntity[] {
  const derived: GoogleWorkspaceCanonicalEntity[] = [];
  const seenPerson = new Set<string>();
  const seenOrg = new Set<string>();

  for (const record of records) {
    if (record.objectType !== "message") continue;

    const participants = asParticipants({
      ...record.attributes,
      workspaceDomain: record.workspaceDomain,
    });

    for (const participant of participants) {
      if (!seenPerson.has(participant.email)) {
        seenPerson.add(participant.email);
        derived.push({
          id: digestId("person", participant.email),
          externalId: `person:${participant.email}`,
          organizationId: record.organizationId,
          sourceSystem: "google-workspace",
          syncedAt: record.syncedAt,
          version: 1,
          workspaceDomain: record.workspaceDomain,
          userId: null,
          objectType: "contact" as GoogleWorkspaceObjectType,
          canonicalType: "person.contact",
          attributes: {
            kind: "Person",
            name: participant.displayName ?? participant.email,
            email: participant.email,
            domain: participant.domain,
            organization: participant.domain || null,
            isInternal: participant.isInternal,
            source: "gmail.participant",
          },
        });
      }

      if (
        participant.domain &&
        !participant.isInternal &&
        !seenOrg.has(participant.domain)
      ) {
        seenOrg.add(participant.domain);
        derived.push({
          id: digestId("org", participant.domain),
          externalId: `org:${participant.domain}`,
          organizationId: record.organizationId,
          sourceSystem: "google-workspace",
          syncedAt: record.syncedAt,
          version: 1,
          workspaceDomain: record.workspaceDomain,
          userId: null,
          objectType: "directory_group" as GoogleWorkspaceObjectType,
          canonicalType: "person.group",
          attributes: {
            kind: "Organization",
            name: participant.domain,
            domain: participant.domain,
            organization: participant.domain,
            source: "gmail.external_domain",
            partnerSignal: true,
          },
        });
      }
    }

    // Umbrella Communication entity for executive-graph queries
    derived.push({
      id: digestId("communication", record.externalId),
      externalId: `communication:${record.externalId}`,
      organizationId: record.organizationId,
      sourceSystem: "google-workspace",
      syncedAt: record.syncedAt,
      version: record.version,
      workspaceDomain: record.workspaceDomain,
      userId: record.userId,
      objectType: "message",
      canonicalType: "comms.communication",
      attributes: {
        kind: "Communication",
        communicationKind: "email",
        emailId: record.externalId,
        threadId: record.attributes.threadId ?? null,
        subject: record.attributes.subject ?? record.attributes.name ?? null,
        direction: record.attributes.direction ?? "received",
        participantEmails: record.attributes.participantEmails ?? [],
        occurredAt: record.attributes.occurredAt ?? null,
        name: record.attributes.subject ?? record.attributes.name ?? record.externalId,
      },
    });
  }

  return [...records, ...derived];
}
