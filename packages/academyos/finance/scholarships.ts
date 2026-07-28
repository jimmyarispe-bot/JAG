import { randomUUID } from "node:crypto";
import { createScholarshipsService } from "../domain/services";
import { projectAcademyEntityToTwin } from "../twin/project";
import { emitFinanceEvent } from "./events";
import {
  getFamilyAccount,
  getScholarshipAward,
  listScholarshipAwards,
  upsertFamilyAccount,
  upsertScholarshipAward,
} from "./store";
import type { ScholarshipAward } from "./types";

export function createFinanceScholarshipService() {
  const domain = createScholarshipsService();

  return {
    award(input: {
      organizationId: string;
      fundingSource: string;
      awardAmount: number;
      familyAccountId?: string | null;
      studentId?: string | null;
      applicantId?: string | null;
      documentationComplete?: boolean;
      renewalDate?: string | null;
      expiresOn?: string | null;
      createdBy: string;
    }): ScholarshipAward | { error: string } {
      if (!input.fundingSource.trim()) {
        return { error: "fundingSource is required." };
      }
      if (input.awardAmount <= 0) return { error: "awardAmount must be > 0." };
      if (input.familyAccountId) {
        const acct = getFamilyAccount(
          input.organizationId,
          input.familyAccountId
        );
        if (!acct) return { error: "Family account not found." };
      }

      const domainAward = domain.create({
        organizationId: input.organizationId,
        name: input.fundingSource.trim(),
        amount: input.awardAmount,
        studentId: input.studentId ?? null,
        createdBy: input.createdBy,
      });
      if ("error" in domainAward) return domainAward;

      const now = new Date().toISOString();
      const id = randomUUID();
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Scholarship Award",
        twinEntityType: "Document",
        id,
        label: input.fundingSource.trim(),
        kind: "scholarship_award",
        actor: input.createdBy,
        metadata: {
          domainScholarshipId: domainAward.id,
          amount: String(input.awardAmount),
        },
      });

      const award = upsertScholarshipAward({
        id,
        organizationId: input.organizationId,
        familyAccountId: input.familyAccountId ?? null,
        studentId: input.studentId ?? null,
        applicantId: input.applicantId ?? null,
        domainScholarshipId: domainAward.id,
        fundingSource: input.fundingSource.trim(),
        awardAmount: input.awardAmount,
        remainingBalance: input.awardAmount,
        documentationComplete: input.documentationComplete ?? false,
        renewalDate: input.renewalDate?.slice(0, 10) ?? null,
        expiresOn: input.expiresOn?.slice(0, 10) ?? null,
        status: "Active",
        twinEntityId: twinId,
        createdAt: now,
        updatedAt: now,
        createdBy: input.createdBy,
      });

      if (input.familyAccountId) {
        const acct = getFamilyAccount(
          input.organizationId,
          input.familyAccountId
        )!;
        upsertFamilyAccount({
          ...acct,
          scholarshipAwardIds: Object.freeze([
            ...acct.scholarshipAwardIds,
            award.id,
          ]),
          updatedAt: now,
        });
      }

      emitFinanceEvent({
        organizationId: input.organizationId,
        entityType: "ScholarshipAward",
        entityId: id,
        eventType: "scholarship_awarded",
        actor: input.createdBy,
        metadata: { amount: String(input.awardAmount) },
      });
      return award;
    },

    get: getScholarshipAward,
    list: listScholarshipAwards,

    patch(input: {
      organizationId: string;
      awardId: string;
      documentationComplete?: boolean;
      renewalDate?: string | null;
      expiresOn?: string | null;
      status?: ScholarshipAward["status"];
      actor: string;
    }): ScholarshipAward | null {
      const current = getScholarshipAward(input.organizationId, input.awardId);
      if (!current) return null;
      const next = upsertScholarshipAward({
        ...current,
        documentationComplete:
          input.documentationComplete ?? current.documentationComplete,
        renewalDate:
          input.renewalDate !== undefined
            ? input.renewalDate?.slice(0, 10) ?? null
            : current.renewalDate,
        expiresOn:
          input.expiresOn !== undefined
            ? input.expiresOn?.slice(0, 10) ?? null
            : current.expiresOn,
        status: input.status ?? current.status,
        updatedAt: new Date().toISOString(),
      });
      emitFinanceEvent({
        organizationId: input.organizationId,
        entityType: "ScholarshipAward",
        entityId: next.id,
        eventType: "scholarship_updated",
        actor: input.actor,
      });
      return next;
    },
  };
}
