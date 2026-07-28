import { randomUUID } from "node:crypto";
import { requireFinancePermission } from "../../permissions";
import { recordFinanceAudit } from "../../audit";
import { listCustomers } from "../../store";
import { getFunding, listContracts, upsertContract } from "../store";
import type { ContractKind, RecognitionBasis, RevenueContract } from "../types";
import { publishOperationalFinanceEvent } from "../../operations/events";

export function createContract(input: {
  organizationId: string;
  userId: string;
  customerId: string;
  name: string;
  kind: ContractKind;
  amount: number;
  startAt: string;
  endAt?: string | null;
  fundingSourceId?: string | null;
  recognitionBasis?: RecognitionBasis;
  currency?: string;
}): RevenueContract | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;
  if (
    !listCustomers(input.organizationId).some((c) => c.id === input.customerId)
  ) {
    return { error: "Customer not found." };
  }
  if (input.fundingSourceId && !getFunding(input.fundingSourceId)) {
    return { error: "Funding source not found." };
  }
  if (input.amount < 0) return { error: "Amount cannot be negative." };

  const contract = upsertContract({
    id: `rcon:${randomUUID()}`,
    organizationId: input.organizationId,
    customerId: input.customerId,
    kind: input.kind,
    name: input.name,
    amount: input.amount,
    currency: (input.currency as RevenueContract["currency"]) ?? "USD",
    startAt: input.startAt,
    endAt: input.endAt ?? null,
    fundingSourceId: input.fundingSourceId ?? null,
    recognitionBasis: input.recognitionBasis ?? "accrual",
    status: "active",
    createdAt: new Date().toISOString(),
  });
  recordFinanceAudit({
    organizationId: input.organizationId,
    action: "revenue.contract_create",
    recordType: "contract",
    recordId: contract.id,
    userId: input.userId,
    newValue: contract,
  });
  publishOperationalFinanceEvent({
    type: "finance.contract_created",
    organizationId: input.organizationId,
    recordType: "contract",
    recordId: contract.id,
    actorUserId: input.userId,
    payload: {
      kind: contract.kind,
      amount: contract.amount,
      fundingSourceId: contract.fundingSourceId,
    },
  });
  return contract;
}

export { listContracts };
