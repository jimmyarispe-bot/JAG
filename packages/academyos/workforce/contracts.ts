import { randomUUID } from "node:crypto";
import { projectAcademyEntityToTwin } from "../twin/project";
import { emitWorkforceEvent } from "./events";
import { getEmployee, listContracts, upsertContract } from "./store";
import type { ContractKind, EmploymentContract } from "./types";
import { CONTRACT_KINDS } from "./types";

export function createContractService() {
  return {
    create(input: {
      organizationId: string;
      employeeId: string;
      kind: ContractKind;
      startsOn: string;
      endsOn?: string | null;
      renewalDate?: string | null;
      compensationAmount: number;
      compensationUnit?: EmploymentContract["compensationUnit"];
      benefitsEligible?: boolean;
      documentUrls?: readonly string[];
      createdBy: string;
    }): EmploymentContract | { error: string } {
      if (!getEmployee(input.organizationId, input.employeeId)) {
        return { error: "Employee not found." };
      }
      if (!(CONTRACT_KINDS as readonly string[]).includes(input.kind)) {
        return { error: "Invalid contract kind." };
      }
      if (input.compensationAmount < 0) {
        return { error: "compensationAmount must be >= 0." };
      }

      const now = new Date().toISOString();
      const id = randomUUID();
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Contract",
        twinEntityType: "Document",
        id,
        label: `${input.kind} contract`,
        kind: "employment_contract",
        actor: input.createdBy,
      });

      const contract = upsertContract({
        id,
        organizationId: input.organizationId,
        employeeId: input.employeeId,
        kind: input.kind,
        startsOn: input.startsOn.slice(0, 10),
        endsOn: input.endsOn?.slice(0, 10) ?? null,
        renewalDate: input.renewalDate?.slice(0, 10) ?? null,
        compensationAmount: input.compensationAmount,
        compensationUnit: input.compensationUnit ?? "annual",
        benefitsEligible: input.benefitsEligible ?? false,
        documentUrls: Object.freeze([...(input.documentUrls ?? [])]),
        status: "Active",
        twinEntityId: twinId,
        createdAt: now,
        updatedAt: now,
        createdBy: input.createdBy,
      });

      emitWorkforceEvent({
        organizationId: input.organizationId,
        entityType: "EmploymentContract",
        entityId: id,
        eventType: "contract_created",
        actor: input.createdBy,
      });
      return contract;
    },

    list: listContracts,

    patch(input: {
      organizationId: string;
      contractId: string;
      status?: EmploymentContract["status"];
      endsOn?: string | null;
      renewalDate?: string | null;
      compensationAmount?: number;
      documentUrls?: readonly string[];
      actor: string;
    }): EmploymentContract | null {
      const current = listContracts(input.organizationId).find(
        (c) => c.id === input.contractId
      );
      if (!current) return null;
      const next = upsertContract({
        ...current,
        status: input.status ?? current.status,
        endsOn:
          input.endsOn !== undefined
            ? input.endsOn?.slice(0, 10) ?? null
            : current.endsOn,
        renewalDate:
          input.renewalDate !== undefined
            ? input.renewalDate?.slice(0, 10) ?? null
            : current.renewalDate,
        compensationAmount:
          input.compensationAmount ?? current.compensationAmount,
        documentUrls: input.documentUrls
          ? Object.freeze([...input.documentUrls])
          : current.documentUrls,
        updatedAt: new Date().toISOString(),
      });
      emitWorkforceEvent({
        organizationId: input.organizationId,
        entityType: "EmploymentContract",
        entityId: next.id,
        eventType: "contract_updated",
        actor: input.actor,
        metadata: { status: next.status },
      });
      return next;
    },
  };
}
