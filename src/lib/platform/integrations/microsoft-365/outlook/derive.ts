/**
 * Derive Person / Organization / Communication from Outlook messages.
 * Downstream consumers only see canonical entities — never raw Graph payloads.
 */

import { createHash } from "crypto";
import type {
  Microsoft365CanonicalEntity,
  Microsoft365ObjectType,
} from "@/lib/platform/integrations/connectors/microsoft-365/entities";

function digestId(kind: string, key: string): string {
  const hash = createHash("sha1").update(`${kind}:${key}`).digest("hex").slice(0, 16);
  return `jag_${kind}_${hash}`;
}

function emailsFrom(attrs: Record<string, unknown>): string[] {
  const out = new Set<string>();
  const from = attrs.from;
  if (typeof from === "string" && from.includes("@")) out.add(from.toLowerCase());
  for (const key of ["to", "cc", "participantEmails"] as const) {
    const list = attrs[key];
    if (Array.isArray(list)) {
      for (const item of list) {
        if (typeof item === "string" && item.includes("@")) out.add(item.toLowerCase());
      }
    }
  }
  return [...out];
}

export function deriveOutlookCanonicalEntities(
  records: readonly Microsoft365CanonicalEntity[]
): Microsoft365CanonicalEntity[] {
  const derived: Microsoft365CanonicalEntity[] = [];
  const seenPerson = new Set<string>();
  const seenOrg = new Set<string>();

  for (const record of records) {
    if (record.objectType !== "message") continue;

    const emails = emailsFrom(record.attributes);
    const tenantDomain = record.tenantDomain;

    for (const email of emails) {
      if (!seenPerson.has(email)) {
        seenPerson.add(email);
        const domain = email.split("@")[1] ?? "";
        derived.push({
          id: digestId("person", email),
          externalId: `person:${email}`,
          organizationId: record.organizationId,
          sourceSystem: "microsoft-365",
          syncedAt: record.syncedAt,
          version: 1,
          tenantDomain,
          userId: null,
          objectType: "contact" as Microsoft365ObjectType,
          canonicalType: "person.contact",
          attributes: {
            kind: "Person",
            name: email,
            email,
            domain,
            organization: domain || null,
            isInternal: domain === tenantDomain,
            source: "outlook.participant",
          },
        });
      }

      const domain = email.split("@")[1] ?? "";
      if (domain && domain !== tenantDomain && !seenOrg.has(domain)) {
        seenOrg.add(domain);
        derived.push({
          id: digestId("org", domain),
          externalId: `org:${domain}`,
          organizationId: record.organizationId,
          sourceSystem: "microsoft-365",
          syncedAt: record.syncedAt,
          version: 1,
          tenantDomain,
          userId: null,
          objectType: "directory_group" as Microsoft365ObjectType,
          canonicalType: "person.group",
          attributes: {
            kind: "Organization",
            name: domain,
            domain,
            organization: domain,
            source: "outlook.external_domain",
            partnerSignal: true,
          },
        });
      }
    }

    derived.push({
      id: digestId("communication", record.externalId),
      externalId: `communication:${record.externalId}`,
      organizationId: record.organizationId,
      sourceSystem: "microsoft-365",
      syncedAt: record.syncedAt,
      version: record.version,
      tenantDomain: record.tenantDomain,
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
        participantEmails: emails,
        occurredAt:
          record.attributes.receivedAt ??
          record.attributes.sentAt ??
          record.attributes.occurredAt ??
          null,
        name: record.attributes.subject ?? record.attributes.name ?? record.externalId,
      },
    });
  }

  return [...records, ...derived];
}
