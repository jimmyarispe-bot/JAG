/**
 * Deterministic HR demo SoR — ADP / Gusto / Paylocity / BambooHR.
 */

import type {
  HrObjectType,
  HrProvider,
  HrRawEntity,
} from "@/lib/platform/integrations/connectors/hr/entities";

function entity(
  provider: HrProvider,
  objectType: HrObjectType,
  id: string,
  organizationId: string,
  version: number,
  payload: Record<string, unknown>,
  updatedAt: string
): HrRawEntity {
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
const LAST_YEAR = "2025-09-01T00:00:00.000Z";

export function hrCatalogForProvider(
  provider: HrProvider,
  organizationId = "org-hr-demo"
): HrRawEntity[] {
  const p = provider === "bamboohr" ? "bb" : provider.slice(0, 3);
  const deptFinance = `${p}-dept-finance`;
  const deptOps = `${p}-dept-ops`;
  const empCfo = `${p}-emp-1`;
  const empOps = `${p}-emp-2`;
  const empTeacher = `${p}-emp-3`;
  const empLeft = `${p}-emp-4`;
  const mgrCfo = `${p}-mgr-1`;
  const mgrOps = `${p}-mgr-2`;

  return [
    entity(provider, "department", deptFinance, organizationId, 1, {
      name: "Finance",
      headcount: 4,
      managerId: empCfo,
    }, EARLIER),
    entity(provider, "department", deptOps, organizationId, 1, {
      name: "Operations",
      headcount: 6,
      managerId: empOps,
    }, EARLIER),

    entity(provider, "employee", empCfo, organizationId, 1, {
      name: "Casey Finance",
      title: "CFO",
      department: "Finance",
      departmentId: deptFinance,
      managerId: null,
      status: "active",
      hireDate: "2021-08-01",
      email: "cfo@jag-demo.edu",
      compensation: 185000,
    }, EARLIER),
    entity(provider, "employee", empOps, organizationId, 1, {
      name: "Riley Ops",
      title: "Operations Manager",
      department: "Operations",
      departmentId: deptOps,
      managerId: empCfo,
      status: "active",
      hireDate: "2022-01-15",
      email: "ops@jag-demo.edu",
      compensation: 112000,
    }, EARLIER),
    entity(provider, "employee", empTeacher, organizationId, 1, {
      name: "Morgan Teacher",
      title: "Lead Teacher",
      department: "Operations",
      departmentId: deptOps,
      managerId: empOps,
      status: "active",
      hireDate: "2023-06-01",
      email: "morgan@jag-demo.edu",
      compensation: 72000,
    }, NOW),
    entity(provider, "employee", empLeft, organizationId, 1, {
      name: "Former Analyst",
      title: "Financial Analyst",
      department: "Finance",
      departmentId: deptFinance,
      managerId: empCfo,
      status: "terminated",
      hireDate: "2020-03-01",
      terminationDate: "2026-05-15",
      email: "alumni@example.com",
      compensation: 78000,
    }, LAST_YEAR),

    entity(provider, "manager", mgrCfo, organizationId, 1, {
      name: "Casey Finance",
      employeeId: empCfo,
      departmentId: deptFinance,
      directReports: 2,
      successionReady: true,
    }, EARLIER),
    entity(provider, "manager", mgrOps, organizationId, 1, {
      name: "Riley Ops",
      employeeId: empOps,
      departmentId: deptOps,
      directReports: 1,
      successionReady: false,
    }, EARLIER),

    entity(provider, "payroll", `${p}-pay-1`, organizationId, 1, {
      name: "July payroll",
      employeeId: empCfo,
      totalAmt: 15416,
      period: "2026-07",
      currency: "USD",
    }, NOW),
    entity(provider, "payroll", `${p}-pay-2`, organizationId, 1, {
      name: "July payroll",
      employeeId: empOps,
      totalAmt: 9333,
      period: "2026-07",
      currency: "USD",
    }, NOW),
    entity(provider, "payroll", `${p}-pay-3`, organizationId, 1, {
      name: "June payroll",
      employeeId: empCfo,
      totalAmt: 15416,
      period: "2026-06",
      currency: "USD",
    }, EARLIER),
    entity(provider, "payroll", `${p}-pay-4`, organizationId, 1, {
      name: "July payroll",
      employeeId: empTeacher,
      totalAmt: 6000,
      period: "2026-07",
      currency: "USD",
    }, NOW),

    entity(provider, "benefit", `${p}-ben-1`, organizationId, 1, {
      name: "Health plan",
      employeeId: empCfo,
      plan: "PPO",
      employerContribution: 620,
    }, EARLIER),
    entity(provider, "benefit", `${p}-ben-2`, organizationId, 1, {
      name: "401(k) match",
      employeeId: empOps,
      plan: "Retirement",
      employerContribution: 400,
    }, EARLIER),

    entity(provider, "time_off", `${p}-pto-1`, organizationId, 1, {
      name: "PTO balance",
      employeeId: empOps,
      balanceHours: 64,
      pendingHours: 8,
      type: "pto",
    }, NOW),
    entity(provider, "time_off", `${p}-pto-2`, organizationId, 1, {
      name: "PTO balance",
      employeeId: empTeacher,
      balanceHours: 40,
      pendingHours: 16,
      type: "pto",
    }, NOW),

    entity(provider, "hiring", `${p}-hire-1`, organizationId, 1, {
      name: "Math teacher opening",
      role: "Teacher",
      status: "open",
      requisitions: 1,
      departmentId: deptOps,
    }, EARLIER),
    entity(provider, "hiring", `${p}-hire-2`, organizationId, 1, {
      name: "Controller opening",
      role: "Controller",
      status: "open",
      requisitions: 1,
      departmentId: deptFinance,
    }, NOW),
  ];
}

export function objectTypesForHrProvider(_provider: HrProvider): HrObjectType[] {
  return [
    "employee",
    "payroll",
    "benefit",
    "time_off",
    "department",
    "manager",
    "hiring",
  ];
}
