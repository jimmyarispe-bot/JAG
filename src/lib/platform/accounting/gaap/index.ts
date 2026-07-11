/**
 * Accounting Intelligence — GAAP Controls.
 *
 * Double-entry validation, balanced journal enforcement, required dimensions,
 * evidence, approvals, and period locks.
 */

import type {
  AccountingDimensionalContext,
  AccountingGaapValidationResult,
  AccountingJournal,
  AccountingJournalLine,
  AccountingPeriod,
} from "@/lib/platform/accounting/types";

export interface AccountingGaapDependencies {
  requireOrganizationId?: boolean;
  requireEvidenceOnPost?: boolean;
  requireApprovalOnPost?: boolean;
  requireReasonOnReclass?: boolean;
}

const BALANCE_TOLERANCE = 0.005;

export class AccountingGaap {
  private readonly requireOrganizationId: boolean;
  private readonly requireEvidenceOnPost: boolean;
  private readonly requireApprovalOnPost: boolean;
  private readonly requireReasonOnReclass: boolean;

  constructor(deps?: AccountingGaapDependencies) {
    this.requireOrganizationId = deps?.requireOrganizationId ?? true;
    this.requireEvidenceOnPost = deps?.requireEvidenceOnPost ?? false;
    this.requireApprovalOnPost = deps?.requireApprovalOnPost ?? false;
    this.requireReasonOnReclass = deps?.requireReasonOnReclass ?? true;
  }

  validateBalancedLines(
    lines: readonly Pick<AccountingJournalLine, "debit" | "credit">[]
  ): AccountingGaapValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (lines.length < 2) {
      errors.push("Journal must have at least two lines");
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.debit < 0 || line.credit < 0) {
        errors.push(`Line ${i + 1}: debit and credit must be non-negative`);
      }
      if (line.debit > 0 && line.credit > 0) {
        errors.push(`Line ${i + 1}: cannot have both debit and credit`);
      }
      if (line.debit === 0 && line.credit === 0) {
        errors.push(`Line ${i + 1}: must have a debit or credit`);
      }
    }

    const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
    if (Math.abs(totalDebit - totalCredit) > BALANCE_TOLERANCE) {
      errors.push(
        `Journal does not balance: debits=${totalDebit} credits=${totalCredit}`
      );
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  validateDimensions(
    dimensions: AccountingDimensionalContext
  ): AccountingGaapValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (this.requireOrganizationId && !dimensions.organizationId) {
      errors.push("organizationId is required on accounting dimensions");
    }
    return { valid: errors.length === 0, errors, warnings };
  }

  validatePeriodForPosting(
    period: AccountingPeriod | undefined,
    options?: { allowHardCloseAdjustment?: boolean }
  ): AccountingGaapValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!period) {
      errors.push("Period is required for posting");
      return { valid: false, errors, warnings };
    }
    switch (period.status) {
      case "open":
      case "reopened":
        break;
      case "soft_close":
        warnings.push("Period is soft-closed; posting with elevated controls");
        break;
      case "hard_close":
        if (!options?.allowHardCloseAdjustment) {
          errors.push(
            `Period ${period.id} is hard-closed; posting requires adjustment override`
          );
        } else {
          warnings.push("Hard-close adjustment override in effect");
        }
        break;
      case "locked":
      case "year_end":
        errors.push(
          `Period ${period.id} is ${period.status}; posting is not allowed`
        );
        break;
      default: {
        const _exhaustive: never = period.status;
        errors.push(`Unknown period status: ${_exhaustive}`);
      }
    }
    return { valid: errors.length === 0, errors, warnings };
  }

  validateJournalForPost(
    journal: AccountingJournal,
    period: AccountingPeriod | undefined,
    options?: { allowHardCloseAdjustment?: boolean }
  ): AccountingGaapValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const balanced = this.validateBalancedLines(journal.lines);
    errors.push(...balanced.errors);
    warnings.push(...balanced.warnings);

    const dims = this.validateDimensions(journal.dimensions);
    errors.push(...dims.errors);
    warnings.push(...dims.warnings);

    const periodCheck = this.validatePeriodForPosting(period, options);
    errors.push(...periodCheck.errors);
    warnings.push(...periodCheck.warnings);

    if (this.requireEvidenceOnPost && !journal.evidenceRef) {
      errors.push("Evidence reference is required before posting");
    }
    if (this.requireApprovalOnPost && !journal.approvalRef) {
      errors.push("Approval reference is required before posting");
    }
    if (
      journal.journalType === "reclassification" &&
      this.requireReasonOnReclass &&
      !journal.reason
    ) {
      errors.push("Reason is required for reclassification journals");
    }
    if (journal.status === "posted") {
      errors.push("Journal is already posted");
    }
    if (journal.status === "reversed") {
      errors.push("Journal is reversed and cannot be posted");
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  merge(
    ...results: AccountingGaapValidationResult[]
  ): AccountingGaapValidationResult {
    const errors = results.flatMap((r) => r.errors);
    const warnings = results.flatMap((r) => r.warnings);
    return { valid: errors.length === 0, errors, warnings };
  }
}

export function createAccountingGaap(
  deps?: AccountingGaapDependencies
): AccountingGaap {
  return new AccountingGaap(deps);
}
