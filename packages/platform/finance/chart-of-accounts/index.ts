/**
 * Chart of accounts — templates, user accounts, subaccounts.
 */

import { randomUUID } from "node:crypto";
import { recordFinanceAudit } from "../audit";
import { requireFinancePermission } from "../permissions";
import { listAccounts, upsertAccount } from "../store";
import type { AccountType, CoaTemplateId, LedgerAccount } from "../types";
import { accountsForTemplate } from "./templates";
import { COA_TEMPLATES } from "../types";

export function listCoaTemplates(): readonly CoaTemplateId[] {
  return COA_TEMPLATES;
}

export function seedChartOfAccounts(input: {
  organizationId: string;
  userId: string;
  templateId: CoaTemplateId;
  entityId?: string | null;
}): readonly LedgerAccount[] | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;

  const seeded: LedgerAccount[] = [];
  for (const seed of accountsForTemplate(input.templateId)) {
    const account = upsertAccount({
      id: `acct:${randomUUID()}`,
      organizationId: input.organizationId,
      entityId: input.entityId ?? null,
      number: seed.number,
      name: seed.name,
      type: seed.type,
      parentAccountId: null,
      templateId: input.templateId,
      active: true,
      currency: null,
    });
    seeded.push(account);
  }
  recordFinanceAudit({
    organizationId: input.organizationId,
    action: "coa.seed",
    recordType: "chart_of_accounts",
    recordId: input.templateId,
    userId: input.userId,
    newValue: { count: seeded.length, templateId: input.templateId },
  });
  return Object.freeze(seeded);
}

export function createAccount(input: {
  organizationId: string;
  userId: string;
  number: string;
  name: string;
  type: AccountType;
  parentAccountId?: string | null;
  entityId?: string | null;
  currency?: string | null;
}): LedgerAccount | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;

  const dup = listAccounts(input.organizationId).find(
    (a) => a.number === input.number && a.active
  );
  if (dup) return { error: `Account number ${input.number} already exists.` };

  const account = upsertAccount({
    id: `acct:${randomUUID()}`,
    organizationId: input.organizationId,
    entityId: input.entityId ?? null,
    number: input.number,
    name: input.name,
    type: input.type,
    parentAccountId: input.parentAccountId ?? null,
    templateId: "custom",
    active: true,
    currency: input.currency ?? null,
  });
  recordFinanceAudit({
    organizationId: input.organizationId,
    action: "account.create",
    recordType: "account",
    recordId: account.id,
    userId: input.userId,
    newValue: account,
  });
  return account;
}

export function setAccountActive(input: {
  organizationId: string;
  userId: string;
  accountId: string;
  active: boolean;
}): LedgerAccount | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;
  const existing = listAccounts(input.organizationId).find(
    (a) => a.id === input.accountId
  );
  if (!existing) return { error: "Account not found." };
  const next = upsertAccount({ ...existing, active: input.active });
  recordFinanceAudit({
    organizationId: input.organizationId,
    action: input.active ? "account.activate" : "account.deactivate",
    recordType: "account",
    recordId: next.id,
    userId: input.userId,
    previousValue: existing,
    newValue: next,
  });
  return next;
}

export { listAccounts };
