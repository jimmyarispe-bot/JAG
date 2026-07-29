import { RuntimeAuthorizationError } from "../errors";
import type {
  DelegationContract,
  DelegationResolver,
} from "./identity-types";

/**
 * In-memory delegation store for Runtime-local contracts.
 * Hosts may replace with a persistent DelegationResolver.
 */
export class MemoryDelegationResolver implements DelegationResolver {
  private readonly contracts = new Map<string, DelegationContract>();

  get(id: string): DelegationContract | null {
    return this.contracts.get(id) ?? null;
  }

  grant(
    contract: Omit<DelegationContract, "grantedAt" | "revokedAt"> & {
      grantedAt?: string;
    }
  ): DelegationContract {
    if (this.contracts.has(contract.id) && !this.contracts.get(contract.id)?.revokedAt) {
      throw new RuntimeAuthorizationError(
        `Delegation already exists: ${contract.id}`,
        { code: "DELEGATION_EXISTS", stageId: "identity" }
      );
    }
    const stored: DelegationContract = {
      ...contract,
      grantedAt: contract.grantedAt ?? new Date().toISOString(),
      revokedAt: undefined,
    };
    this.contracts.set(stored.id, stored);
    return stored;
  }

  revoke(id: string, _reason?: string): DelegationContract | null {
    const existing = this.contracts.get(id);
    if (!existing) return null;
    const revoked: DelegationContract = {
      ...existing,
      revokedAt: new Date().toISOString(),
    };
    this.contracts.set(id, revoked);
    return revoked;
  }

  listActiveForUser(userId: string, nowIso: string): readonly DelegationContract[] {
    const now = Date.parse(nowIso);
    return [...this.contracts.values()].filter((c) => {
      if (c.revokedAt) return false;
      if (Date.parse(c.expiresAt) <= now) return false;
      return (
        c.toUserId === userId ||
        c.fromUserId === userId ||
        c.targetUserId === userId
      );
    });
  }
}

export function createMemoryDelegationResolver(): DelegationResolver {
  return new MemoryDelegationResolver();
}

export function assertDelegationActive(
  contract: DelegationContract,
  nowIso: string
): void {
  if (contract.revokedAt) {
    throw new RuntimeAuthorizationError("Delegation has been revoked", {
      code: "DELEGATION_REVOKED",
      stageId: "identity",
      details: { delegationId: contract.id },
    });
  }
  if (Date.parse(contract.expiresAt) <= Date.parse(nowIso)) {
    throw new RuntimeAuthorizationError("Delegation has expired", {
      code: "DELEGATION_EXPIRED",
      stageId: "identity",
      details: { delegationId: contract.id },
    });
  }
}

export function isImpersonationContract(contract: DelegationContract): boolean {
  return contract.kind === "impersonation";
}
