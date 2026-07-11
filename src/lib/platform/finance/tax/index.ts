/**
 * Enterprise Financial Intelligence Engine — Tax.
 *
 * Tax record generation for 1099-NEC, W2, sales tax, payroll tax.
 * NO external filing — record generation only.
 */

import { createFinanceId } from "@/lib/platform/finance/ids";
import type {
  FinanceDimensionalContext,
  FinanceMetadata,
  FinanceTaxRecord,
  FinanceTaxRecordType,
} from "@/lib/platform/finance/types";
import { emptyDimensions } from "@/lib/platform/finance/types";

export interface Generate1099Input {
  taxYear: number;
  recipientId: string;
  recipientName: string;
  recipientTaxId?: string | null;
  nonemployeeCompensation: number;
  otherIncome?: number;
  currency?: string;
  dimensions?: FinanceDimensionalContext;
  metadata?: FinanceMetadata;
}

export interface GenerateW2Input {
  taxYear: number;
  employeeId: string;
  employeeName: string;
  employeeTaxId?: string | null;
  grossWages: number;
  federalWithholding: number;
  stateWithholding?: number;
  socialSecurityWages?: number;
  medicareWages?: number;
  currency?: string;
  dimensions?: FinanceDimensionalContext;
  metadata?: FinanceMetadata;
}

export interface GenerateSalesTaxInput {
  taxYear: number;
  periodStart: string;
  periodEnd: string;
  taxableAmount: number;
  taxRate: number;
  taxAmount: number;
  currency?: string;
  dimensions?: FinanceDimensionalContext;
  metadata?: FinanceMetadata;
}

export interface GeneratePayrollTaxInput {
  taxYear: number;
  quarter: number;
  totalWages: number;
  federalTax: number;
  stateTax?: number;
  ficaTax?: number;
  currency?: string;
  dimensions?: FinanceDimensionalContext;
  metadata?: FinanceMetadata;
}

export interface FinanceTaxDependencies {
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export class FinanceTax {
  private readonly taxRecords = new Map<string, FinanceTaxRecord>();
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;

  constructor(deps?: FinanceTaxDependencies) {
    this.createId = deps?.createId ?? ((prefix) => createFinanceId(prefix));
    this.now = deps?.now ?? (() => new Date());
  }

  /** Generate a 1099-NEC record for a contractor/vendor. */
  generate1099(input: Generate1099Input): FinanceTaxRecord {
    const id = this.createId("tax");
    const record: FinanceTaxRecord = {
      id,
      type: "form_1099",
      taxYear: input.taxYear,
      recipientId: input.recipientId,
      recipientName: input.recipientName,
      recipientTaxId: input.recipientTaxId ?? null,
      amounts: {
        nonemployeeCompensation: input.nonemployeeCompensation,
        otherIncome: input.otherIncome ?? 0,
      },
      currency: input.currency ?? "USD",
      dimensions: input.dimensions ?? emptyDimensions(),
      generatedAt: this.now().toISOString(),
      metadata: input.metadata,
    };
    this.taxRecords.set(id, record);
    return record;
  }

  /** Generate a W-2 record for an employee. */
  generateW2(input: GenerateW2Input): FinanceTaxRecord {
    const id = this.createId("tax");
    const record: FinanceTaxRecord = {
      id,
      type: "form_w2",
      taxYear: input.taxYear,
      recipientId: input.employeeId,
      recipientName: input.employeeName,
      recipientTaxId: input.employeeTaxId ?? null,
      amounts: {
        grossWages: input.grossWages,
        federalWithholding: input.federalWithholding,
        stateWithholding: input.stateWithholding ?? 0,
        socialSecurityWages: input.socialSecurityWages ?? input.grossWages,
        medicareWages: input.medicareWages ?? input.grossWages,
      },
      currency: input.currency ?? "USD",
      dimensions: input.dimensions ?? emptyDimensions(),
      generatedAt: this.now().toISOString(),
      metadata: input.metadata,
    };
    this.taxRecords.set(id, record);
    return record;
  }

  /** Generate a sales tax record. */
  generateSalesTaxRecord(input: GenerateSalesTaxInput): FinanceTaxRecord {
    const id = this.createId("tax");
    const record: FinanceTaxRecord = {
      id,
      type: "sales_tax",
      taxYear: input.taxYear,
      recipientId: "state-tax-authority",
      recipientName: "State Tax Authority",
      recipientTaxId: null,
      amounts: {
        taxableAmount: input.taxableAmount,
        taxRate: input.taxRate,
        taxAmount: input.taxAmount,
      },
      currency: input.currency ?? "USD",
      dimensions: input.dimensions ?? emptyDimensions(),
      generatedAt: this.now().toISOString(),
      metadata: {
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        ...input.metadata,
      },
    };
    this.taxRecords.set(id, record);
    return record;
  }

  /** Generate a payroll tax summary (940/941). */
  generatePayrollTaxRecord(input: GeneratePayrollTaxInput): FinanceTaxRecord {
    const id = this.createId("tax");
    const record: FinanceTaxRecord = {
      id,
      type: "payroll_tax",
      taxYear: input.taxYear,
      recipientId: "irs",
      recipientName: "IRS",
      recipientTaxId: null,
      amounts: {
        totalWages: input.totalWages,
        federalTax: input.federalTax,
        stateTax: input.stateTax ?? 0,
        ficaTax: input.ficaTax ?? 0,
      },
      currency: input.currency ?? "USD",
      dimensions: input.dimensions ?? emptyDimensions(),
      generatedAt: this.now().toISOString(),
      metadata: {
        quarter: input.quarter,
        ...input.metadata,
      },
    };
    this.taxRecords.set(id, record);
    return record;
  }

  getTaxRecord(id: string): FinanceTaxRecord | undefined {
    return this.taxRecords.get(id);
  }

  listTaxRecords(taxYear?: number): FinanceTaxRecord[] {
    const all = [...this.taxRecords.values()].sort((a, b) =>
      a.generatedAt.localeCompare(b.generatedAt)
    );
    return taxYear !== undefined
      ? all.filter((r) => r.taxYear === taxYear)
      : all;
  }

  listByType(type: FinanceTaxRecordType): FinanceTaxRecord[] {
    return [...this.taxRecords.values()].filter((r) => r.type === type);
  }

  /** List all 1099 records for a given tax year. */
  list1099s(taxYear: number): FinanceTaxRecord[] {
    return this.listByType("form_1099").filter((r) => r.taxYear === taxYear);
  }

  /** List all W2 records for a given tax year. */
  listW2s(taxYear: number): FinanceTaxRecord[] {
    return this.listByType("form_w2").filter((r) => r.taxYear === taxYear);
  }

  /** Total 1099 compensation for a given tax year. */
  getTotal1099Compensation(taxYear: number): number {
    return this.list1099s(taxYear).reduce(
      (s, r) => s + (r.amounts["nonemployeeCompensation"] ?? 0),
      0
    );
  }

  /** Total W2 gross wages for a given tax year. */
  getTotalW2Wages(taxYear: number): number {
    return this.listW2s(taxYear).reduce(
      (s, r) => s + (r.amounts["grossWages"] ?? 0),
      0
    );
  }
}

export function createFinanceTax(deps?: FinanceTaxDependencies): FinanceTax {
  return new FinanceTax(deps);
}
