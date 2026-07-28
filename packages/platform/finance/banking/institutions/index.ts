import { randomUUID } from "node:crypto";
import { recordFinanceAudit } from "../../audit";
import { requireFinancePermission } from "../../permissions";
import { listInstitutions, upsertInstitution } from "../store";
import type { BankInstitution, ConnectionProvider } from "../types";

export function registerInstitution(input: {
  organizationId: string;
  userId: string;
  name: string;
  provider: ConnectionProvider;
  country?: string | null;
}): BankInstitution | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;

  const institution = upsertInstitution({
    id: `inst:${randomUUID()}`,
    organizationId: input.organizationId,
    name: input.name,
    provider: input.provider,
    country: input.country ?? null,
    createdAt: new Date().toISOString(),
  });
  recordFinanceAudit({
    organizationId: input.organizationId,
    action: "banking.institution_register",
    recordType: "bank_institution",
    recordId: institution.id,
    userId: input.userId,
    newValue: institution,
  });
  return institution;
}

export { listInstitutions };
