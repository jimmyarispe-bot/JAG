import type {
  AbsenceRequest,
  Certification,
  Employee,
  EmploymentContract,
  PayrollPreparation,
  PerformanceReview,
  Position,
  StaffAssignment,
  Timesheet,
  WorkforceCompensationConfig,
  WorkforceTimekeepingConfig,
} from "./types";
import {
  DEFAULT_COMPENSATION_CONFIG,
  DEFAULT_TIMEKEEPING_CONFIG,
} from "./config";

type WorkforceStore = {
  timekeeping: Map<string, WorkforceTimekeepingConfig>;
  compensation: Map<string, WorkforceCompensationConfig>;
  positions: Map<string, Position>;
  employees: Map<string, Employee>;
  assignments: Map<string, StaffAssignment>;
  certifications: Map<string, Certification>;
  contracts: Map<string, EmploymentContract>;
  timesheets: Map<string, Timesheet>;
  payroll: Map<string, PayrollPreparation>;
  absences: Map<string, AbsenceRequest>;
  performance: Map<string, PerformanceReview>;
};

const g = globalThis as typeof globalThis & {
  __academyOsWorkforceStore?: WorkforceStore;
};

function empty(): WorkforceStore {
  return {
    timekeeping: new Map(),
    compensation: new Map(),
    positions: new Map(),
    employees: new Map(),
    assignments: new Map(),
    certifications: new Map(),
    contracts: new Map(),
    timesheets: new Map(),
    payroll: new Map(),
    absences: new Map(),
    performance: new Map(),
  };
}

function store(): WorkforceStore {
  if (!g.__academyOsWorkforceStore) g.__academyOsWorkforceStore = empty();
  return g.__academyOsWorkforceStore;
}

export function resetWorkforceStoreForTests(): void {
  g.__academyOsWorkforceStore = empty();
}

function key(organizationId: string, id: string): string {
  return `${organizationId}::${id}`;
}

export function getTimekeepingConfig(
  organizationId: string
): WorkforceTimekeepingConfig {
  return store().timekeeping.get(organizationId) ?? DEFAULT_TIMEKEEPING_CONFIG;
}

export function setTimekeepingConfig(
  organizationId: string,
  config: WorkforceTimekeepingConfig
): WorkforceTimekeepingConfig {
  store().timekeeping.set(organizationId, config);
  return config;
}

export function getCompensationConfig(
  organizationId: string
): WorkforceCompensationConfig {
  return store().compensation.get(organizationId) ?? DEFAULT_COMPENSATION_CONFIG;
}

export function setCompensationConfig(
  organizationId: string,
  config: WorkforceCompensationConfig
): WorkforceCompensationConfig {
  store().compensation.set(organizationId, config);
  return config;
}

export function upsertPosition(p: Position): Position {
  store().positions.set(key(p.organizationId, p.id), p);
  return p;
}

export function getPosition(
  organizationId: string,
  id: string
): Position | null {
  return store().positions.get(key(organizationId, id)) ?? null;
}

export function listPositions(organizationId: string): readonly Position[] {
  return Object.freeze(
    [...store().positions.values()]
      .filter((p) => p.organizationId === organizationId)
      .sort((a, b) => a.title.localeCompare(b.title))
  );
}

export function upsertEmployee(e: Employee): Employee {
  store().employees.set(key(e.organizationId, e.id), e);
  return e;
}

export function getEmployee(
  organizationId: string,
  id: string
): Employee | null {
  return store().employees.get(key(organizationId, id)) ?? null;
}

export function listEmployees(organizationId: string): readonly Employee[] {
  return Object.freeze(
    [...store().employees.values()]
      .filter((e) => e.organizationId === organizationId)
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
  );
}

export function findEmployeeByPortalToken(token: string): Employee | null {
  return (
    [...store().employees.values()].find((e) => e.portalToken === token) ?? null
  );
}

export function upsertAssignment(a: StaffAssignment): StaffAssignment {
  store().assignments.set(key(a.organizationId, a.id), a);
  return a;
}

export function listAssignments(
  organizationId: string,
  employeeId?: string
): readonly StaffAssignment[] {
  return Object.freeze(
    [...store().assignments.values()]
      .filter(
        (a) =>
          a.organizationId === organizationId &&
          (employeeId == null || a.employeeId === employeeId)
      )
      .sort((a, b) => b.startsOn.localeCompare(a.startsOn))
  );
}

export function upsertCertification(c: Certification): Certification {
  store().certifications.set(key(c.organizationId, c.id), c);
  return c;
}

export function listCertifications(
  organizationId: string,
  employeeId?: string
): readonly Certification[] {
  return Object.freeze(
    [...store().certifications.values()].filter(
      (c) =>
        c.organizationId === organizationId &&
        (employeeId == null || c.employeeId === employeeId)
    )
  );
}

export function upsertContract(c: EmploymentContract): EmploymentContract {
  store().contracts.set(key(c.organizationId, c.id), c);
  return c;
}

export function listContracts(
  organizationId: string,
  employeeId?: string
): readonly EmploymentContract[] {
  return Object.freeze(
    [...store().contracts.values()].filter(
      (c) =>
        c.organizationId === organizationId &&
        (employeeId == null || c.employeeId === employeeId)
    )
  );
}

export function upsertTimesheet(t: Timesheet): Timesheet {
  store().timesheets.set(key(t.organizationId, t.id), t);
  return t;
}

export function getTimesheet(
  organizationId: string,
  id: string
): Timesheet | null {
  return store().timesheets.get(key(organizationId, id)) ?? null;
}

export function listTimesheets(
  organizationId: string,
  employeeId?: string
): readonly Timesheet[] {
  return Object.freeze(
    [...store().timesheets.values()]
      .filter(
        (t) =>
          t.organizationId === organizationId &&
          (employeeId == null || t.employeeId === employeeId)
      )
      .sort((a, b) => b.weekStarting.localeCompare(a.weekStarting))
  );
}

export function upsertPayroll(p: PayrollPreparation): PayrollPreparation {
  store().payroll.set(key(p.organizationId, p.id), p);
  return p;
}

export function listPayroll(
  organizationId: string
): readonly PayrollPreparation[] {
  return Object.freeze(
    [...store().payroll.values()]
      .filter((p) => p.organizationId === organizationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
}

export function upsertAbsence(a: AbsenceRequest): AbsenceRequest {
  store().absences.set(key(a.organizationId, a.id), a);
  return a;
}

export function listAbsences(
  organizationId: string
): readonly AbsenceRequest[] {
  return Object.freeze(
    [...store().absences.values()]
      .filter((a) => a.organizationId === organizationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
}

export function upsertPerformance(p: PerformanceReview): PerformanceReview {
  store().performance.set(key(p.organizationId, p.id), p);
  return p;
}

export function listPerformance(
  organizationId: string,
  employeeId?: string
): readonly PerformanceReview[] {
  return Object.freeze(
    [...store().performance.values()]
      .filter(
        (p) =>
          p.organizationId === organizationId &&
          (employeeId == null || p.employeeId === employeeId)
      )
      .sort((a, b) => b.reviewedOn.localeCompare(a.reviewedOn))
  );
}
