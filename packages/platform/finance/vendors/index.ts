import { randomUUID } from "node:crypto";
import { recordFinanceAudit } from "../audit";
import { requireFinancePermission } from "../permissions";
import { listVendors, upsertVendor } from "../store";
import type { Vendor } from "../types";

export function createVendor(input: {
  organizationId: string;
  userId: string;
  name: string;
  paymentTerms?: string | null;
  is1099?: boolean;
  category?: string | null;
  contacts?: readonly { name: string; email: string | null }[];
  addresses?: readonly string[];
}): Vendor | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;

  const vendor = upsertVendor({
    id: `vend:${randomUUID()}`,
    organizationId: input.organizationId,
    name: input.name,
    paymentTerms: input.paymentTerms ?? "Net 30",
    is1099: input.is1099 === true,
    category: input.category ?? null,
    contacts: Object.freeze([...(input.contacts ?? [])]),
    addresses: Object.freeze([...(input.addresses ?? [])]),
    attachmentIds: Object.freeze([]),
    active: true,
  });
  recordFinanceAudit({
    organizationId: input.organizationId,
    action: "vendor.create",
    recordType: "vendor",
    recordId: vendor.id,
    userId: input.userId,
    newValue: vendor,
  });
  return vendor;
}

export { listVendors };
