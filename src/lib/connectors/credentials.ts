/**
 * Organization-scoped credential storage.
 * Payload is encrypted at rest in the process store; never log secrets.
 */

import { createHash, randomBytes } from "node:crypto";
import type {
  AuthenticationType,
  ConnectorCredentialRecord,
} from "@/lib/connectors/types";

/** Simple reversible obfuscation for Phase 1 — replace with KMS later. */
export function encryptCredentialPayload(
  plaintext: string,
  organizationId: string
): string {
  const key = createHash("sha256").update(`jag.connectors.${organizationId}`).digest();
  const nonce = randomBytes(8).toString("hex");
  const encoded = Buffer.from(`${nonce}:${plaintext}`, "utf8");
  const mixed = Buffer.alloc(encoded.length);
  for (let i = 0; i < encoded.length; i++) {
    mixed[i] = encoded[i]! ^ key[i % key.length]!;
  }
  return `enc:v1:${mixed.toString("base64")}`;
}

export function decryptCredentialPayload(
  encryptedPayload: string,
  organizationId: string
): string {
  if (!encryptedPayload.startsWith("enc:v1:")) {
    throw new Error("Unsupported credential payload format.");
  }
  const key = createHash("sha256").update(`jag.connectors.${organizationId}`).digest();
  const mixed = Buffer.from(encryptedPayload.slice("enc:v1:".length), "base64");
  const decoded = Buffer.alloc(mixed.length);
  for (let i = 0; i < mixed.length; i++) {
    decoded[i] = mixed[i]! ^ key[i % key.length]!;
  }
  const text = decoded.toString("utf8");
  const sep = text.indexOf(":");
  return sep >= 0 ? text.slice(sep + 1) : text;
}

/** Safe summary for APIs/logs — never includes secret material. */
export function credentialAuditSummary(
  record: ConnectorCredentialRecord
): {
  readonly id: string;
  readonly organizationId: string;
  readonly installationId: string;
  readonly authenticationType: AuthenticationType;
  readonly hasSecret: boolean;
} {
  return {
    id: record.id,
    organizationId: record.organizationId,
    installationId: record.installationId,
    authenticationType: record.authenticationType,
    hasSecret: Boolean(record.encryptedPayload),
  };
}
