import { randomUUID } from "node:crypto";
import { recordFinanceAudit } from "../../audit";
import { requireFinancePermission } from "../../permissions";
import {
  getConnection,
  getInstitution,
  listConnections,
  upsertConnection,
} from "../store";
import type {
  BankConnection,
  ConnectionProvider,
  ConnectionStatus,
} from "../types";
import { notifyBanking } from "../notifications";

export function connectInstitution(input: {
  organizationId: string;
  userId: string;
  institutionId: string;
  entityId?: string | null;
  provider?: ConnectionProvider;
  externalItemId?: string | null;
}): BankConnection | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;

  const institution = getInstitution(input.institutionId);
  if (!institution || institution.organizationId !== input.organizationId) {
    return { error: "Institution not found." };
  }
  if (institution.provider === "open_banking") {
    // Future adapter — connection may be created in pending state.
  }

  const connection = upsertConnection({
    id: `conn:${randomUUID()}`,
    organizationId: input.organizationId,
    institutionId: input.institutionId,
    entityId: input.entityId ?? null,
    provider: input.provider ?? institution.provider,
    status: institution.provider === "open_banking" ? "pending" : "active",
    externalItemId: input.externalItemId ?? null,
    lastSyncedAt: null,
    credentialRotationDueAt: new Date(
      Date.now() + 90 * 24 * 60 * 60 * 1000
    ).toISOString(),
    createdAt: new Date().toISOString(),
    createdBy: input.userId,
  });
  recordFinanceAudit({
    organizationId: input.organizationId,
    action: "banking.connection_create",
    recordType: "bank_connection",
    recordId: connection.id,
    userId: input.userId,
    newValue: connection,
  });
  return connection;
}

export function markConnectionStatus(input: {
  organizationId: string;
  userId: string;
  connectionId: string;
  status: ConnectionStatus;
}): BankConnection | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;
  const existing = getConnection(input.connectionId);
  if (!existing || existing.organizationId !== input.organizationId) {
    return { error: "Connection not found." };
  }
  const updated = upsertConnection({ ...existing, status: input.status });
  if (input.status === "error" || input.status === "needs_reauth") {
    notifyBanking({
      organizationId: input.organizationId,
      kind: "connection_failure",
      message: `Bank connection ${existing.id} status: ${input.status}`,
    });
  }
  recordFinanceAudit({
    organizationId: input.organizationId,
    action: "banking.connection_status",
    recordType: "bank_connection",
    recordId: updated.id,
    userId: input.userId,
    previousValue: existing,
    newValue: updated,
  });
  return updated;
}

/** Credential rotation hook — schedules re-auth; does not store secrets. */
export function rotateConnectionCredentials(input: {
  organizationId: string;
  userId: string;
  connectionId: string;
  dueInDays?: number;
}): BankConnection | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "financial_administrator",
  });
  if ("error" in gate) return gate;
  const existing = getConnection(input.connectionId);
  if (!existing || existing.organizationId !== input.organizationId) {
    return { error: "Connection not found." };
  }
  const days = input.dueInDays ?? 30;
  const updated = upsertConnection({
    ...existing,
    status: "needs_reauth",
    credentialRotationDueAt: new Date(
      Date.now() + days * 24 * 60 * 60 * 1000
    ).toISOString(),
  });
  recordFinanceAudit({
    organizationId: input.organizationId,
    action: "banking.credential_rotation",
    recordType: "bank_connection",
    recordId: updated.id,
    userId: input.userId,
    newValue: { dueAt: updated.credentialRotationDueAt },
  });
  return updated;
}

export function describeConnectionProviders(): {
  readonly plaid: true;
  readonly openBanking: "future";
  readonly manual: true;
  readonly sandbox: true;
  readonly multiInstitution: true;
  readonly multiEntity: true;
  readonly multiCurrency: true;
} {
  return Object.freeze({
    plaid: true,
    openBanking: "future",
    manual: true,
    sandbox: true,
    multiInstitution: true,
    multiEntity: true,
    multiCurrency: true,
  });
}

export { listConnections, getConnection };
