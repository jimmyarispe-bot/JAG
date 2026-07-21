import { createHash } from "crypto";
import type {
  ConnectorConfiguration,
  NormalizedRecord,
  SyncRecord,
} from "@/lib/platform/integrations/common/types";
import type {
  HrCanonicalEntity,
  HrObjectType,
  HrProvider,
} from "@/lib/platform/integrations/connectors/hr/entities";
import { hrCanonicalType } from "@/lib/platform/integrations/connectors/hr/mapping";

export function toSyncRecords(
  raw: Array<{
    id: string;
    objectType: string;
    updatedAt: string;
    version: number;
    organizationId: string;
    provider: HrProvider;
    payload: Record<string, unknown>;
  }>
): SyncRecord[] {
  return raw.map((row) => ({
    externalId: row.id,
    objectType: row.objectType,
    updatedAt: row.updatedAt,
    payload: {
      ...row.payload,
      organizationId: row.organizationId,
      provider: row.provider,
      version: row.version,
      updatedAt: row.updatedAt,
    },
  }));
}

function scrub(payload: Record<string, unknown>): Record<string, unknown> {
  const attributes = { ...payload };
  delete attributes.ssn;
  delete attributes.taxId;
  delete attributes.bankAccount;
  delete attributes.medicalNotes;
  delete attributes.provider;
  delete attributes.organizationId;
  delete attributes.version;
  delete attributes.updatedAt;
  return attributes;
}

/** Normalize every provider object into canonical HR entities with kind tags. */
export function domainAttributes(
  objectType: string,
  payload: Record<string, unknown>
): Record<string, unknown> {
  const base = scrub(payload);
  switch (objectType) {
    case "employee":
      return {
        ...base,
        kind: "Employee",
        name: base.name ?? null,
        title: base.title ?? null,
        department: base.department ?? null,
        departmentId: base.departmentId ?? null,
        managerId: base.managerId ?? null,
        status: base.status ?? "active",
        hireDate: base.hireDate ?? null,
        terminationDate: base.terminationDate ?? null,
        compensation: base.compensation ?? null,
        email: base.email ?? null,
      };
    case "payroll":
      return {
        ...base,
        kind: "Payroll",
        name: base.name ?? "Payroll",
        employeeId: base.employeeId ?? null,
        totalAmt: Number(base.totalAmt ?? 0),
        period: base.period ?? null,
        currency: base.currency ?? "USD",
      };
    case "benefit":
      return {
        ...base,
        kind: "Benefits",
        name: base.name ?? "Benefit",
        employeeId: base.employeeId ?? null,
        plan: base.plan ?? null,
        employerContribution: Number(base.employerContribution ?? 0),
      };
    case "time_off":
    case "pto":
      return {
        ...base,
        kind: "Time Off",
        name: base.name ?? "Time off",
        employeeId: base.employeeId ?? null,
        balanceHours: Number(base.balanceHours ?? 0),
        pendingHours: Number(base.pendingHours ?? 0),
        type: base.type ?? "pto",
      };
    case "department":
      return {
        ...base,
        kind: "Department",
        name: base.name ?? null,
        headcount: Number(base.headcount ?? 0),
        managerId: base.managerId ?? null,
      };
    case "manager":
      return {
        ...base,
        kind: "Manager",
        name: base.name ?? null,
        employeeId: base.employeeId ?? null,
        departmentId: base.departmentId ?? null,
        directReports: Number(base.directReports ?? 0),
        successionReady: Boolean(base.successionReady),
      };
    case "hiring":
      return {
        ...base,
        kind: "Hiring",
        name: base.name ?? null,
        role: base.role ?? null,
        status: base.status ?? "open",
        requisitions: Number(base.requisitions ?? 1),
        departmentId: base.departmentId ?? null,
      };
    default:
      return base;
  }
}

export function normalizeHrRecords(
  records: SyncRecord[],
  config: ConnectorConfiguration,
  provider: HrProvider,
  syncedAt = new Date().toISOString()
): NormalizedRecord[] {
  return records.map((record) => {
    const version = Number(record.payload.version ?? 1);
    const organizationId =
      (record.payload.organizationId as string | undefined) ??
      config.scope.organizationId;
    const attributes = domainAttributes(record.objectType, record.payload);
    const objectType = (
      record.objectType === "pto" ? "time_off" : record.objectType
    ) as HrObjectType;
    const internalId = jagInternalId(provider, objectType, record.externalId);

    const data: HrCanonicalEntity = {
      id: internalId,
      externalId: record.externalId,
      organizationId,
      sourceSystem: provider,
      syncedAt,
      version,
      objectType,
      canonicalType: hrCanonicalType(objectType),
      attributes,
    };

    return {
      canonicalType: data.canonicalType,
      externalId: record.externalId,
      sourceSystem: provider,
      scope: {
        organizationId,
        schoolId: config.scope.schoolId ?? null,
      },
      data: data as unknown as Record<string, unknown>,
      lineage: {
        connectorId: provider,
        instanceId: config.instanceId,
        syncedAt,
        rawHash: hashPayload(attributes),
      },
    };
  });
}

function jagInternalId(provider: string, objectType: string, externalId: string): string {
  return createHash("sha256")
    .update(`hr:${provider}:${objectType}:${externalId}`)
    .digest("hex")
    .slice(0, 32);
}

function hashPayload(attributes: Record<string, unknown>): string {
  return createHash("sha256").update(JSON.stringify(attributes)).digest("hex").slice(0, 16);
}
