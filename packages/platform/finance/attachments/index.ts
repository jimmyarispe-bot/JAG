import { randomUUID } from "node:crypto";
import { recordFinanceAudit } from "../audit";
import { requireFinancePermission } from "../permissions";
import { listAttachments, upsertAttachment } from "../store";
import type { FinanceAttachment } from "../types";

export function attachFinanceDocument(input: {
  organizationId: string;
  userId: string;
  kind: FinanceAttachment["kind"];
  fileName: string;
  contentType?: string;
  linkedRecordType?: string | null;
  linkedRecordId?: string | null;
}): FinanceAttachment | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;

  const attachment = upsertAttachment({
    id: `fatt:${randomUUID()}`,
    organizationId: input.organizationId,
    kind: input.kind,
    fileName: input.fileName,
    contentType: input.contentType ?? "application/octet-stream",
    linkedRecordType: input.linkedRecordType ?? null,
    linkedRecordId: input.linkedRecordId ?? null,
    createdAt: new Date().toISOString(),
    createdBy: input.userId,
  });
  recordFinanceAudit({
    organizationId: input.organizationId,
    action: "attachment.create",
    recordType: "attachment",
    recordId: attachment.id,
    userId: input.userId,
    newValue: attachment,
  });
  return attachment;
}

export { listAttachments };
