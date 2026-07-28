/**
 * Security validation — authz, org/school isolation, portal tokens, escalation.
 */

import {
  createApplicantsService,
  createCommunicationsEmployeePortalService,
  createCommunicationsParentPortalService,
  createEmployeePortalService,
  createEmployeeService,
  createParentPortalService,
  createSisStudentsService,
  listEmployees,
} from "../aos";
import { isOk, type HardeningSuiteDefinition } from "../harness";

export const securitySuite: HardeningSuiteDefinition = {
  id: "security",
  name: "Security Validation",
  run(ctx) {
    const [orgA, orgB] = ctx.organizationIds;
    ctx.assert("security.orgs", Boolean(orgA && orgB), undefined, "blocker");
    if (!orgA || !orgB) return;

    const applicantA = createApplicantsService().create({
      organizationId: orgA,
      student: {
        firstName: "SecA",
        lastName: "Student",
        dateOfBirth: "2012-01-01",
        gradeLevel: "8",
      },
      guardian: {
        firstName: "Parent",
        lastName: "A",
        email: `sec.a@${orgA}.test`,
        phone: "555-1111",
        relationship: "Parent",
      },
      schoolName: "Campus A",
      program: "STEM",
      gradeLevel: "8",
      createdBy: "advisorA",
    });
    ctx.assert("security.applicant_a", isOk(applicantA), undefined, "blocker");
    if (!isOk(applicantA)) return;

    // Cross-org get must not return foreign applicant
    const leaked = createApplicantsService().get(orgB, applicantA.id);
    ctx.assert(
      "security.org_isolation_get",
      leaked == null,
      "applicant visible across organizations",
      "blocker"
    );
    ctx.assert(
      "security.org_isolation_list",
      !createApplicantsService().list(orgB).some((a) => a.id === applicantA.id),
      undefined,
      "blocker"
    );

    // Privilege escalation: transition as foreign org actor must not mutate A via B context
    const escalate = createApplicantsService().transition({
      organizationId: orgB,
      applicantId: applicantA.id,
      stage: "Accepted",
      actor: "attacker",
    });
    ctx.assert(
      "security.privilege_escalation_stage",
      escalate == null || ("error" in escalate && escalate !== null),
      "foreign org transition succeeded",
      "blocker"
    );
    const still = createApplicantsService().get(orgA, applicantA.id);
    ctx.assert(
      "security.stage_unchanged",
      still?.stage === applicantA.stage,
      undefined,
      "critical"
    );

    // Portal token must not resolve under wrong token
    const portalOk = createParentPortalService().resolve(
      applicantA.parentAccessToken
    );
    ctx.assert("security.portal_auth_valid", !("error" in portalOk));
    const portalBad = createParentPortalService().resolve("invalid-token-value");
    ctx.assert(
      "security.portal_auth_invalid",
      "error" in portalBad,
      undefined,
      "blocker"
    );

    const studentA = createSisStudentsService().create({
      organizationId: orgA,
      identity: {
        preferredName: "SecStudent",
        legalFirstName: "Sec",
        legalLastName: "Student",
        dateOfBirth: "2012-01-01",
        stateStudentId: null,
      },
      gradeLevel: "8",
      campusId: "campus-a",
      campusName: "Campus A",
      program: "STEM",
      status: "Active",
      createdBy: "uA",
    });
    ctx.assert("security.student_a", isOk(studentA));
    if (isOk(studentA)) {
      ctx.assert(
        "security.school_isolation",
        !createSisStudentsService()
          .list(orgB)
          .some((s) => s.id === studentA.id),
        undefined,
        "blocker"
      );
      ctx.assert(
        "security.cross_campus_list",
        createSisStudentsService()
          .list(orgA)
          .filter((s) => s.id === studentA.id)
          .every((s) => s.campusId === "campus-a")
      );
    }

    const emp = createEmployeeService().create({
      organizationId: orgA,
      displayName: "Sec Employee",
      employmentType: "Full-time",
      createdBy: "hrA",
    });
    ctx.assert("security.employee", isOk(emp));
    if (isOk(emp)) {
      ctx.assert(
        "security.role_workforce_isolation",
        !listEmployees(orgB).some((e) => e.id === emp.id),
        undefined,
        "blocker"
      );
      const empPortal = createEmployeePortalService().resolve(emp.portalToken);
      ctx.assert("security.employee_portal", !("error" in empPortal));
      const empPortalBad = createEmployeePortalService().resolve("bad-emp-token");
      ctx.assert("security.employee_portal_deny", "error" in empPortalBad);

      const commEmp = createCommunicationsEmployeePortalService().resolve(
        emp.portalToken
      );
      ctx.assert("security.comms_employee_portal", !("error" in commEmp));
    }

    const commParent = createCommunicationsParentPortalService().resolve(
      applicantA.parentAccessToken
    );
    ctx.assert("security.comms_parent_portal", !("error" in commParent));
    const commParentBad =
      createCommunicationsParentPortalService().resolve("nope");
    ctx.assert(
      "security.comms_parent_deny",
      "error" in commParentBad,
      undefined,
      "blocker"
    );

    // API authorization model: services require organizationId — wrong org yields empty/null
    ctx.assert(
      "security.api_org_param_enforced",
      createApplicantsService().list("org.nonexistent").length === 0
    );
  },
};
