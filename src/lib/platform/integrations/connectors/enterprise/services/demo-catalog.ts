/**
 * Deterministic demo SoR catalogs for enterprise CRM / HR / Education / Government.
 */

import type {
  EnterpriseObjectType,
  EnterpriseProvider,
  EnterpriseRawEntity,
} from "@/lib/platform/integrations/connectors/enterprise/entities";

function entity(
  provider: EnterpriseProvider,
  objectType: EnterpriseObjectType,
  id: string,
  organizationId: string,
  version: number,
  payload: Record<string, unknown>,
  updatedAt: string
): EnterpriseRawEntity {
  return {
    id,
    objectType,
    provider,
    organizationId,
    updatedAt,
    version,
    payload: { ...payload, name: payload.name ?? payload.title ?? payload.displayName ?? id },
  };
}

const NOW = "2026-07-13T16:00:00.000Z";
const EARLIER = "2026-07-12T14:00:00.000Z";

function governmentCatalog(
  provider: "state_education" | "scholarship" | "medicaid" | "grant",
  organizationId: string
): EnterpriseRawEntity[] {
  if (provider === "state_education") {
    return [
      entity(provider, "program", "se-prog-1", organizationId, 1, {
        name: "State reporting FY26",
        agency: "DOE",
      }, EARLIER),
      entity(provider, "compliance", "se-comp-1", organizationId, 1, {
        name: "Chronic absenteeism report",
        programId: "se-prog-1",
        status: "due",
        severity: "medium",
      }, NOW),
      entity(provider, "student", "se-stu-1", organizationId, 1, {
        name: "State ID roster student",
        gradeLevel: 9,
        status: "active",
      }, EARLIER),
      entity(provider, "attendance", "se-att-1", organizationId, 1, {
        name: "State attendance export",
        studentId: "se-stu-1",
        status: "present",
        on: "2026-07-13",
      }, NOW),
    ];
  }
  if (provider === "scholarship") {
    return [
      entity(provider, "program", "sch-prog-1", organizationId, 1, {
        name: "Merit Scholarship",
        fund: "Endowment A",
      }, EARLIER),
      entity(provider, "application", "sch-app-1", organizationId, 1, {
        name: "Jordan Parent application",
        programId: "sch-prog-1",
        contactId: "hs-contact-1",
        status: "review",
      }, NOW),
      entity(provider, "award", "sch-awd-1", organizationId, 1, {
        name: "Merit award",
        programId: "sch-prog-1",
        totalAmt: 5000,
        status: "approved",
      }, EARLIER),
      entity(provider, "student", "sch-stu-1", organizationId, 1, {
        name: "Award recipient",
        gradeLevel: 12,
        status: "active",
      }, EARLIER),
    ];
  }
  if (provider === "medicaid") {
    return [
      entity(provider, "program", "md-prog-1", organizationId, 1, {
        name: "School-based Medicaid",
        agency: "HHS",
      }, EARLIER),
      entity(provider, "claim", "md-claim-1", organizationId, 1, {
        name: "OT services claim",
        programId: "md-prog-1",
        totalAmt: 1240,
        status: "submitted",
      }, NOW),
      entity(provider, "claim", "md-claim-2", organizationId, 1, {
        name: "Speech services claim",
        programId: "md-prog-1",
        totalAmt: 880,
        status: "paid",
      }, EARLIER),
      entity(provider, "compliance", "md-comp-1", organizationId, 1, {
        name: "Consent documentation",
        programId: "md-prog-1",
        status: "open",
        severity: "high",
      }, NOW),
    ];
  }
  return [
    entity(provider, "program", "gr-prog-1", organizationId, 1, {
      name: "Title I Grant",
      agency: "USDOE",
    }, EARLIER),
    entity(provider, "application", "gr-app-1", organizationId, 1, {
      name: "FY27 Title I application",
      programId: "gr-prog-1",
      status: "draft",
    }, NOW),
    entity(provider, "award", "gr-awd-1", organizationId, 1, {
      name: "Title I award",
      programId: "gr-prog-1",
      totalAmt: 240000,
      status: "active",
    }, EARLIER),
    entity(provider, "compliance", "gr-comp-1", organizationId, 1, {
      name: "Quarterly expenditure report",
      programId: "gr-prog-1",
      status: "due",
      severity: "medium",
    }, NOW),
  ];
}

export function catalogForProvider(
  provider: EnterpriseProvider,
  organizationId = "org-enterprise-demo"
): EnterpriseRawEntity[] {
  return governmentCatalog(provider, organizationId);
}

export function objectTypesForProvider(
  provider: EnterpriseProvider
): EnterpriseObjectType[] {
  if (provider === "state_education") {
    return ["program", "compliance", "student", "attendance"];
  }
  if (provider === "scholarship") {
    return ["program", "application", "award", "student"];
  }
  if (provider === "medicaid") {
    return ["program", "claim", "compliance"];
  }
  return ["program", "application", "award", "compliance"];
}
