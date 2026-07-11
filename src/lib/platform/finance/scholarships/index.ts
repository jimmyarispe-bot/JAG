/**
 * Enterprise Financial Intelligence Engine — Scholarships.
 *
 * Funding sources, scholarship funds, awards, balance tracking, utilization.
 */

import { createFinanceId } from "@/lib/platform/finance/ids";
import type {
  FinanceDimensionalContext,
  FinanceMetadata,
  FinanceScholarship,
  FinanceScholarshipAward,
  FinanceScholarshipStatus,
} from "@/lib/platform/finance/types";
import { emptyDimensions } from "@/lib/platform/finance/types";

export interface AddScholarshipInput {
  name: string;
  fundingSourceId: string;
  totalFunding: number;
  currency?: string;
  dimensions?: FinanceDimensionalContext;
  metadata?: FinanceMetadata;
}

export interface AwardScholarshipInput {
  scholarshipId: string;
  studentId: string;
  awardAmount: number;
  academicPeriod: string;
  invoiceId?: string | null;
  memo: string;
  currency?: string;
  dimensions?: FinanceDimensionalContext;
  metadata?: FinanceMetadata;
}

export interface ScholarshipUtilization {
  scholarshipId: string;
  totalFunding: number;
  awardedAmount: number;
  remainingBalance: number;
  percent: number;
}

export interface FinanceScholarshipsDependencies {
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export class FinanceScholarships {
  private readonly scholarships = new Map<string, FinanceScholarship>();
  private readonly awards = new Map<string, FinanceScholarshipAward>();
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;

  constructor(deps?: FinanceScholarshipsDependencies) {
    this.createId = deps?.createId ?? ((prefix) => createFinanceId(prefix));
    this.now = deps?.now ?? (() => new Date());
  }

  addScholarship(input: AddScholarshipInput): FinanceScholarship {
    const id = this.createId("schol");
    const scholarship: FinanceScholarship = {
      id,
      name: input.name,
      fundingSourceId: input.fundingSourceId,
      totalFunding: input.totalFunding,
      awardedAmount: 0,
      remainingBalance: input.totalFunding,
      status: "active",
      dimensions: input.dimensions ?? emptyDimensions(),
      createdAt: this.now().toISOString(),
      metadata: input.metadata,
    };
    this.scholarships.set(id, scholarship);
    return scholarship;
  }

  getScholarship(id: string): FinanceScholarship | undefined {
    return this.scholarships.get(id);
  }

  listScholarships(): FinanceScholarship[] {
    return [...this.scholarships.values()].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt)
    );
  }

  listByStatus(status: FinanceScholarshipStatus): FinanceScholarship[] {
    return this.listScholarships().filter((s) => s.status === status);
  }

  /** Award scholarship funds to a student. Updates remaining balance. */
  awardScholarship(input: AwardScholarshipInput): FinanceScholarshipAward {
    const scholarship = this.getScholarshipOrThrow(input.scholarshipId);
    if (input.awardAmount > scholarship.remainingBalance + 0.005) {
      throw new Error(
        `Award amount ${input.awardAmount} exceeds remaining balance ${scholarship.remainingBalance} for scholarship ${input.scholarshipId}`
      );
    }

    const id = this.createId("award");
    const currency = input.currency ?? "USD";

    const award: FinanceScholarshipAward = {
      id,
      scholarshipId: input.scholarshipId,
      studentId: input.studentId,
      awardAmount: input.awardAmount,
      academicPeriod: input.academicPeriod,
      invoiceId: input.invoiceId ?? null,
      timestamp: this.now().toISOString(),
      dimensions: input.dimensions ?? scholarship.dimensions,
      amount: { amount: input.awardAmount, currency },
      memo: input.memo,
      reversedById: null,
      reversesId: null,
      currency,
      metadata: input.metadata,
    };
    this.awards.set(id, award);

    // Update scholarship balance
    const newAwarded = scholarship.awardedAmount + input.awardAmount;
    const newRemaining = scholarship.totalFunding - newAwarded;
    const newStatus: FinanceScholarshipStatus =
      newRemaining <= 0.005 ? "exhausted" : scholarship.status;

    const updated: FinanceScholarship = {
      ...scholarship,
      awardedAmount: newAwarded,
      remainingBalance: Math.max(newRemaining, 0),
      status: newStatus,
    };
    this.scholarships.set(input.scholarshipId, updated);

    return award;
  }

  getAward(id: string): FinanceScholarshipAward | undefined {
    return this.awards.get(id);
  }

  listAwards(scholarshipId?: string): FinanceScholarshipAward[] {
    const all = [...this.awards.values()].sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp)
    );
    return scholarshipId
      ? all.filter((a) => a.scholarshipId === scholarshipId)
      : all;
  }

  listAwardsByStudent(studentId: string): FinanceScholarshipAward[] {
    return [...this.awards.values()].filter((a) => a.studentId === studentId);
  }

  getUtilization(scholarshipId: string): ScholarshipUtilization {
    const s = this.getScholarshipOrThrow(scholarshipId);
    const percent =
      s.totalFunding > 0 ? (s.awardedAmount / s.totalFunding) * 100 : 0;
    return {
      scholarshipId,
      totalFunding: s.totalFunding,
      awardedAmount: s.awardedAmount,
      remainingBalance: s.remainingBalance,
      percent,
    };
  }

  updateStatus(
    scholarshipId: string,
    status: FinanceScholarshipStatus
  ): FinanceScholarship {
    const s = this.getScholarshipOrThrow(scholarshipId);
    const updated: FinanceScholarship = { ...s, status };
    this.scholarships.set(scholarshipId, updated);
    return updated;
  }

  private getScholarshipOrThrow(id: string): FinanceScholarship {
    const s = this.scholarships.get(id);
    if (!s) throw new Error(`Scholarship not found: ${id}`);
    return s;
  }
}

export function createFinanceScholarships(
  deps?: FinanceScholarshipsDependencies
): FinanceScholarships {
  return new FinanceScholarships(deps);
}
