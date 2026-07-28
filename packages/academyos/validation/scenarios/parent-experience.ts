/**
 * Scenario 5 — Parent Experience
 */

import {
  createAnnouncementService,
  createApplicantsService,
  createCommunicationsParentPortalService,
  createEnrollmentWizardService,
  createFamilyAccountsService,
  createFinanceBillingService,
  createParentPortalService,
  createPaymentsService,
  createSisStudentsService,
  createTuitionService,
  createWorkflowService,
  routeAcademyOsDomainEvent,
} from "../aos";
import { isOk, type ScenarioDefinition } from "../harness";

export const parentExperienceScenario: ScenarioDefinition = {
  id: "parent_experience",
  name: "Parent Experience",
  domains: [
    "admissions",
    "sis",
    "finance",
    "communications",
    "learning",
  ],
  run(ctx) {
    const org = ctx.organizationId;
    const email = `parent.${org}@example.com`;

    const applicant = createApplicantsService().create({
      organizationId: org,
      student: {
        firstName: "Casey",
        lastName: "Ng",
        dateOfBirth: "2013-04-04",
        gradeLevel: "6",
      },
      guardian: {
        firstName: "Riley",
        lastName: "Ng",
        email,
        phone: "555-0200",
        relationship: "Parent",
      },
      schoolName: "Lincoln",
      program: "General",
      gradeLevel: "6",
      createdBy: "advisor1",
    });
    ctx.assert("parent.applicant", isOk(applicant), undefined, "blocker");
    if (!isOk(applicant)) return;

    for (const stage of [
      "Application Started",
      "Application Submitted",
      "Document Review",
      "Admissions Review",
      "Accepted",
    ] as const) {
      const t = createApplicantsService().transition({
        organizationId: org,
        applicantId: applicant.id,
        stage,
        actor: "advisor1",
      });
      if (!isOk(t)) {
        ctx.assert(`parent.stage.${stage}`, false, t?.error, "blocker");
        return;
      }
    }

    const token = createApplicantsService().get(org, applicant.id)!
      .parentAccessToken;

    const portalLogin = ctx.measure("parent_experience.portal_resolve", () =>
      createParentPortalService().resolve(token)
    );
    ctx.assert("parent.portal_login", !("error" in portalLogin), undefined, "blocker");
    if ("error" in portalLogin) return;
    ctx.assert("parent.view_applicant", portalLogin.applicant != null);

    const wizardStart = createParentPortalService().acceptOffer({ token });
    ctx.assert("parent.accept_offer", isOk(wizardStart), undefined, "blocker");
    if (!isOk(wizardStart)) return;

    const wizardSvc = createEnrollmentWizardService();
    let wizard = wizardStart;
    for (const section of [
      "Student Information",
      "Parent/Guardian",
      "Emergency Contacts",
      "Medical Information",
      "Educational History",
      "Scholarships",
      "Tuition Plan",
      "Agreements & Policies",
    ] as const) {
      const saved = wizardSvc.save({
        organizationId: org,
        wizardId: wizard.id,
        actor: `parent:${email}`,
        section,
        data: { [section]: "ok" },
        completeSection: true,
      });
      if (!isOk(saved)) {
        ctx.assert("parent.enrollment_section", false, saved?.error, "blocker");
        return;
      }
      wizard = saved;
    }
    wizardSvc.submit({
      organizationId: org,
      wizardId: wizard.id,
      actor: `parent:${email}`,
    });

    const students = createSisStudentsService().list(org);
    ctx.assert("parent.view_student", students.length >= 1);
    const student = students[0]!;

    const announcement = createAnnouncementService().create({
      organizationId: org,
      title: "Welcome families",
      body: "School year kicks off next week.",
      scope: "Organization",
      createdBy: "admin",
    });
    if (isOk(announcement)) {
      createAnnouncementService().publish({
        organizationId: org,
        announcementId: announcement.id,
        actor: "admin",
      });
    }

    const plan = createTuitionService().createPlan({
      organizationId: org,
      name: "Monthly General",
      frequency: "Monthly",
      baseAmount: 500,
      program: "General",
      campusId: "c1",
      effectiveFrom: "2026-01-01",
      createdBy: "u1",
    });
    ctx.assert("parent.tuition_plan", isOk(plan), undefined, "blocker");
    if (!isOk(plan)) return;

    const account = createFamilyAccountsService().create({
      organizationId: org,
      displayName: "Ng Family",
      responsibleParties: [{ name: "Riley Ng", email, sharePercent: 100 }],
      studentIds: [student.id],
      createdBy: "u1",
    });
    ctx.assert("parent.family_account", isOk(account), undefined, "blocker");
    if (!isOk(account)) return;

    createTuitionService().assignSchedule({
      organizationId: org,
      tuitionPlanId: plan.id,
      familyAccountId: account.id,
      studentId: student.id,
      startsOn: "2026-01-01",
      createdBy: "u1",
    });

    const invoice = createFinanceBillingService().generateTuitionInvoice({
      organizationId: org,
      familyAccountId: account.id,
      studentId: student.id,
      periodMonth: "2026-07",
      createdBy: "u1",
    });
    ctx.assert("parent.invoice", isOk(invoice), undefined, "blocker");
    if (!isOk(invoice)) return;

    const payment = createPaymentsService().record({
      organizationId: org,
      familyAccountId: account.id,
      invoiceId: invoice.id,
      amount: invoice.totalAmount,
      method: "Online",
      createdBy: `parent:${email}`,
    });
    ctx.assert("parent.payment", isOk(payment));

    createWorkflowService().start({
      organizationId: org,
      recipe: "Annual Enrollment",
      familyId: account.id,
      studentId: student.id,
      createdBy: "admin",
    });

    routeAcademyOsDomainEvent({
      organizationId: org,
      domain: "learning",
      eventKey: "mastery_milestone",
      recipientType: "parent",
      recipientId: email,
      studentId: student.id,
      createdBy: "system",
    });

    const prefs = createCommunicationsParentPortalService().setPreferences({
      token,
      channels: ["in_app", "email"],
      mutedDomains: [],
    });
    ctx.assert("parent.notification_preferences", isOk(prefs));

    const commPortal = createCommunicationsParentPortalService().resolve(token);
    ctx.assert("parent.messages_feed", !("error" in commPortal));
    if (!("error" in commPortal)) {
      ctx.assert(
        "parent.announcements",
        commPortal.announcementFeed.length >= 1
      );
      ctx.assert("parent.workflow_tasks", Array.isArray(commPortal.workflowTasks));
      ctx.assert("parent.timeline", commPortal.timeline.length >= 0);
    }

    const refreshed = createParentPortalService().resolve(token);
    ctx.assert("parent.portal_permissions", !("error" in refreshed));
  },
};
