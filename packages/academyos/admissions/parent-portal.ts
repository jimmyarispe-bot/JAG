/**
 * Parent portal operations — token-scoped, no platform auth changes.
 */

import { createAcademicOpsParentPortalService } from "../academic-ops/parent-portal";
import { createFinanceParentPortalService } from "../finance/parent-portal";
import { createLearningParentPortalService } from "../learning/parent-portal";
import { createSisParentPortalService } from "../sis/parent-portal";
import { createApplicantsService } from "./applicants";
import { createDocumentsService } from "./documents";
import { createEnrollmentWizardService } from "./enrollment-wizard";
import {
  findApplicantByParentToken,
  listDocuments,
  listNotifications,
  listTimeline,
} from "./store";
import { buildAdmissionsDashboard } from "./dashboard";

export function createParentPortalService() {
  const documents = createDocumentsService();
  const wizard = createEnrollmentWizardService();
  const applicants = createApplicantsService();
  const sisPortal = createSisParentPortalService();
  const academicPortal = createAcademicOpsParentPortalService();
  const financePortal = createFinanceParentPortalService();
  const learningPortal = createLearningParentPortalService();

  return {
    resolve(token: string) {
      const applicant = findApplicantByParentToken(token);
      const sis = sisPortal.resolve(token);
      const academic = academicPortal.resolve(token);
      const finance = financePortal.resolve(token);
      const learning = learningPortal.resolve(token);
      if (!applicant && "error" in sis) {
        return { error: "Invalid parent access token." as const };
      }
      return {
        applicant: applicant ?? null,
        documents: applicant
          ? listDocuments(applicant.organizationId, applicant.id)
          : Object.freeze([]),
        notifications: applicant
          ? listNotifications(applicant.organizationId, applicant.id)
          : Object.freeze([]),
        timeline: applicant
          ? listTimeline(applicant.organizationId, applicant.id)
          : Object.freeze([]),
        outstanding: applicant
          ? documents.outstanding(applicant.organizationId, applicant.id)
          : Object.freeze([]),
        sis: "error" in sis ? null : sis,
        academic: "error" in academic ? null : academic,
        finance: "error" in finance ? null : finance,
        learning: "error" in learning ? null : learning,
      };
    },

    payInvoice(input: {
      token: string;
      invoiceId: string;
      amount: number;
      method?: "Online" | "Manual" | "AutoPay";
    }) {
      return financePortal.pay(input);
    },

    setAutoPay(input: { token: string; enabled: boolean }) {
      return financePortal.setAutoPay(input);
    },

    addPaymentMethod(input: {
      token: string;
      label: string;
      kind?: "Online" | "Manual";
      lastFour?: string;
    }) {
      return financePortal.addPaymentMethod(input);
    },

    downloadStatement(input: { token: string }) {
      return financePortal.statement(input);
    },

    uploadDocument(input: {
      token: string;
      documentId: string;
      fileName: string;
      expiresAt?: string | null;
    }) {
      const applicant = findApplicantByParentToken(input.token);
      if (!applicant) return { error: "Invalid parent access token." };
      const doc = documents.upload({
        organizationId: applicant.organizationId,
        documentId: input.documentId,
        fileName: input.fileName,
        actor: `parent:${applicant.guardian.email}`,
        expiresAt: input.expiresAt,
      });
      return doc;
    },

    scheduleAssessment(input: {
      token: string;
      scheduledAt: string;
      enabled?: boolean;
    }) {
      if (input.enabled === false) {
        return { error: "Assessment scheduling is disabled." };
      }
      const applicant = findApplicantByParentToken(input.token);
      if (!applicant) return { error: "Invalid parent access token." };
      return applicants.scheduleAssessment({
        organizationId: applicant.organizationId,
        applicantId: applicant.id,
        scheduledAt: input.scheduledAt,
        actor: `parent:${applicant.guardian.email}`,
      });
    },

    acceptOffer(input: { token: string }) {
      const applicant = findApplicantByParentToken(input.token);
      if (!applicant) return { error: "Invalid parent access token." };
      if (
        applicant.stage !== "Accepted" &&
        applicant.stage !== "Enrollment Pending"
      ) {
        return {
          error: `No acceptance offer to confirm (stage: ${applicant.stage}).`,
        };
      }
      return wizard.start({
        organizationId: applicant.organizationId,
        applicantId: applicant.id,
        actor: `parent:${applicant.guardian.email}`,
      });
    },

    saveEnrollment(input: {
      token: string;
      wizardId: string;
      section?: Parameters<
        ReturnType<typeof createEnrollmentWizardService>["save"]
      >[0]["section"];
      data?: Record<string, string>;
      completeSection?: boolean;
    }) {
      const applicant = findApplicantByParentToken(input.token);
      if (!applicant) return { error: "Invalid parent access token." };
      return wizard.save({
        organizationId: applicant.organizationId,
        wizardId: input.wizardId,
        actor: `parent:${applicant.guardian.email}`,
        section: input.section,
        data: input.data,
        completeSection: input.completeSection,
      });
    },

    submitEnrollment(input: { token: string; wizardId: string }) {
      const applicant = findApplicantByParentToken(input.token);
      if (!applicant) return { error: "Invalid parent access token." };
      return wizard.submit({
        organizationId: applicant.organizationId,
        wizardId: input.wizardId,
        actor: `parent:${applicant.guardian.email}`,
      });
    },

    /** Staff helper — not parent-facing. */
    staffDashboard: buildAdmissionsDashboard,
  };
}
