import { randomUUID } from "node:crypto";
import { recordFinanceAudit } from "../audit";
import { requireFinancePermission } from "../permissions";
import { listCustomers, upsertCustomer } from "../store";
import type { CustomerKind, FinanceCustomer } from "../types";

export function createFinanceCustomer(input: {
  organizationId: string;
  userId: string;
  name: string;
  kind: CustomerKind;
  paymentTerms?: string | null;
  contacts?: readonly { name: string; email: string | null }[];
  addresses?: readonly string[];
}): FinanceCustomer | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;

  const customer = upsertCustomer({
    id: `fcust:${randomUUID()}`,
    organizationId: input.organizationId,
    name: input.name,
    kind: input.kind,
    paymentTerms: input.paymentTerms ?? "Net 30",
    contacts: Object.freeze([...(input.contacts ?? [])]),
    addresses: Object.freeze([...(input.addresses ?? [])]),
    active: true,
  });
  recordFinanceAudit({
    organizationId: input.organizationId,
    action: "customer.create",
    recordType: "customer",
    recordId: customer.id,
    userId: input.userId,
    newValue: customer,
  });
  return customer;
}

export { listCustomers };
