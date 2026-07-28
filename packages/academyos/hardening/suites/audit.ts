/**
 * Audit & observability — attributable state changes.
 */

import {
  createApplicantsService,
  createWorkflowService,
  listAdmissionsAudit,
  routeAcademyOsDomainEvent,
} from "../aos";
import { listJagPlatformEvents } from "@/lib/jag-platform/events";
import { isOk, type HardeningSuiteDefinition } from "../harness";

export const auditObservabilitySuite: HardeningSuiteDefinition = {
  id: "audit_observability",
  name: "Audit & Observability",
  run(ctx) {
    const org = ctx.organizationId;

    const applicant = createApplicantsService().create({
      organizationId: org,
      student: {
        firstName: "Audit",
        lastName: "Trail",
        dateOfBirth: "2012-01-01",
        gradeLevel: "9",
      },
      guardian: {
        firstName: "Audit",
        lastName: "Parent",
        email: `audit@${org}.test`,
        phone: "555-4040",
        relationship: "Parent",
      },
      schoolName: "Lincoln",
      program: "STEM",
      gradeLevel: "9",
      createdBy: "auditor",
    });
    ctx.assert("audit.applicant", isOk(applicant), undefined, "blocker");
    if (!isOk(applicant)) return;

    createApplicantsService().transition({
      organizationId: org,
      applicantId: applicant.id,
      stage: "Application Started",
      actor: "auditor",
    });

    const audit = listAdmissionsAudit(org, applicant.id);
    ctx.assert("audit.events_recorded", audit.length >= 1, undefined, "critical");
    ctx.assert(
      "audit.actor_attributable",
      audit.some((a) => a.actor === "auditor" || a.actor.includes("auditor"))
    );

    const workflow = createWorkflowService().start({
      organizationId: org,
      recipe: "Admissions Checklist",
      createdBy: "auditor",
    });
    ctx.assert("audit.workflow_history", isOk(workflow));
    if (isOk(workflow)) {
      const advanced = createWorkflowService().advance({
        organizationId: org,
        workflowId: workflow.id,
        stepId: workflow.steps[0]!.id,
        actor: "auditor",
      });
      ctx.assert("audit.workflow_step_reviewable", isOk(advanced));
    }

    routeAcademyOsDomainEvent({
      organizationId: org,
      domain: "admissions",
      eventKey: "application_received",
      recipientType: "staff",
      recipientId: "auditor",
      createdBy: "system",
    });

    const events = listJagPlatformEvents({ organizationId: org });
    ctx.assert(
      "audit.platform_events",
      events.some((e) => e.eventType.includes("academyos")),
      undefined,
      "critical"
    );
    ctx.assert(
      "audit.traceability",
      events.every((e) => Boolean(e.organizationId) && Boolean(e.actor))
    );
  },
};
