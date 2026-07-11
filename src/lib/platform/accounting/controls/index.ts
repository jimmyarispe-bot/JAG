/**
 * Accounting Intelligence — Posting Controls & Separation of Duties.
 */

import { createAccountingId } from "@/lib/platform/accounting/ids";
import type {
  AccountingMetadata,
  AccountingPostingPermission,
  AccountingSeparationOfDutiesRule,
} from "@/lib/platform/accounting/types";

export interface AccountingControlsDependencies {
  createId?: (prefix: string) => string;
}

export interface GrantPermissionInput {
  actorId: string;
  canDraft?: boolean;
  canPost?: boolean;
  canReverse?: boolean;
  canClose?: boolean;
  canReopen?: boolean;
  canApprove?: boolean;
}

export class AccountingControls {
  private readonly permissions = new Map<string, AccountingPostingPermission>();
  private readonly rules = new Map<string, AccountingSeparationOfDutiesRule>();
  private readonly createId: (prefix: string) => string;

  constructor(deps?: AccountingControlsDependencies) {
    this.createId = deps?.createId ?? ((prefix) => createAccountingId(prefix));
    this.seedDefaultRule();
  }

  private seedDefaultRule(): void {
    this.addSeparationRule({
      name: "Default separation of duties",
      description: "Preparer cannot approve their own journal; poster cannot self-approve.",
      preparerCannotApprove: true,
      posterCannotApprove: true,
    });
  }

  grantPermission(input: GrantPermissionInput): AccountingPostingPermission {
    const permission: AccountingPostingPermission = {
      actorId: input.actorId,
      canDraft: input.canDraft ?? true,
      canPost: input.canPost ?? false,
      canReverse: input.canReverse ?? false,
      canClose: input.canClose ?? false,
      canReopen: input.canReopen ?? false,
      canApprove: input.canApprove ?? false,
    };
    this.permissions.set(input.actorId, permission);
    return permission;
  }

  getPermission(actorId: string): AccountingPostingPermission | undefined {
    return this.permissions.get(actorId);
  }

  assertCanDraft(actorId: string | null | undefined): void {
    if (!actorId) return;
    const p = this.permissions.get(actorId);
    if (p && !p.canDraft) {
      throw new Error(`Actor ${actorId} does not have draft permission`);
    }
  }

  assertCanPost(actorId: string | null | undefined): void {
    if (!actorId) return;
    const p = this.permissions.get(actorId);
    if (p && !p.canPost) {
      throw new Error(`Actor ${actorId} does not have post permission`);
    }
  }

  assertCanReverse(actorId: string | null | undefined): void {
    if (!actorId) return;
    const p = this.permissions.get(actorId);
    if (p && !p.canReverse) {
      throw new Error(`Actor ${actorId} does not have reverse permission`);
    }
  }

  assertCanClose(actorId: string | null | undefined): void {
    if (!actorId) return;
    const p = this.permissions.get(actorId);
    if (p && !p.canClose) {
      throw new Error(`Actor ${actorId} does not have close permission`);
    }
  }

  assertCanReopen(actorId: string | null | undefined): void {
    if (!actorId) return;
    const p = this.permissions.get(actorId);
    if (p && !p.canReopen) {
      throw new Error(`Actor ${actorId} does not have reopen permission`);
    }
  }

  addSeparationRule(input: {
    name: string;
    description: string;
    preparerCannotApprove?: boolean;
    posterCannotApprove?: boolean;
    metadata?: AccountingMetadata;
  }): AccountingSeparationOfDutiesRule {
    const rule: AccountingSeparationOfDutiesRule = {
      id: this.createId("sod"),
      name: input.name,
      description: input.description,
      preparerCannotApprove: input.preparerCannotApprove ?? true,
      posterCannotApprove: input.posterCannotApprove ?? true,
      active: true,
    };
    this.rules.set(rule.id, rule);
    return rule;
  }

  listSeparationRules(): AccountingSeparationOfDutiesRule[] {
    return [...this.rules.values()].filter((r) => r.active);
  }

  /**
   * Enforce separation of duties for approval.
   * Throws when the same actor prepared/posted and is attempting to approve.
   */
  assertSeparationOfDuties(input: {
    approverId: string;
    preparerId: string | null;
    posterId: string | null;
  }): void {
    for (const rule of this.listSeparationRules()) {
      if (
        rule.preparerCannotApprove &&
        input.preparerId &&
        input.approverId === input.preparerId
      ) {
        throw new Error(
          `Separation of duties: preparer ${input.preparerId} cannot approve`
        );
      }
      if (
        rule.posterCannotApprove &&
        input.posterId &&
        input.approverId === input.posterId
      ) {
        throw new Error(
          `Separation of duties: poster ${input.posterId} cannot approve`
        );
      }
    }
  }
}

export function createAccountingControls(
  deps?: AccountingControlsDependencies
): AccountingControls {
  return new AccountingControls(deps);
}
