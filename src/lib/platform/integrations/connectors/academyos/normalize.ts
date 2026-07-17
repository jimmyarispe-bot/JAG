/**
 * AcademyOS → JAG canonical normalization.
 */

import { createHash } from "crypto";
import type {
  ConnectorConfiguration,
  NormalizedRecord,
  SyncRecord,
} from "@/lib/platform/integrations/common/types";
import type { AcademyOsCanonicalEntity, AcademyOsObjectType } from "./entities";

const CANONICAL_TYPE: Record<AcademyOsObjectType, string> = {
  organization: "org.organization",
  campus: "org.campus",
  program: "education.program",
  student: "education.student",
  guardian: "education.guardian",
  employee: "person.employee",
  teacher: "person.teacher",
  class: "education.class",
  enrollment: "education.enrollment",
  attendance: "operations.attendance",
  session: "education.session",
  tuition: "finance.tuition",
  scholarship: "finance.scholarship",
  payroll_summary: "finance.payroll_summary",
  financial_summary: "finance.summary",
  document: "document.file",
  task: "ops.task",
  communication: "comms.message",
};

export function academyOsCanonicalType(objectType: string): string {
  return CANONICAL_TYPE[objectType as AcademyOsObjectType] ?? `academyos.${objectType}`;
}

export function toSyncRecords(raw: Array<{
  id: string;
  objectType: string;
  updatedAt: string;
  version: number;
  organizationId: string;
  campusId?: string | null;
  payload: Record<string, unknown>;
}>): SyncRecord[] {
  return raw.map((row) => ({
    externalId: row.id,
    objectType: row.objectType,
    updatedAt: row.updatedAt,
    payload: {
      ...row.payload,
      organizationId: row.organizationId,
      campusId: row.campusId ?? null,
      version: row.version,
      updatedAt: row.updatedAt,
    },
  }));
}

export function normalizeAcademyOsRecords(
  records: SyncRecord[],
  config: ConnectorConfiguration,
  syncedAt = new Date().toISOString()
): NormalizedRecord[] {
  return records.map((record) => {
    const version = Number(record.payload.version ?? 1);
    const campusId =
      (record.payload.campusId as string | null | undefined) ??
      (config.scope.schoolId ?? null);
    const organizationId =
      (record.payload.organizationId as string | undefined) ??
      config.scope.organizationId;
    const internalId = jagInternalId("academyos", record.objectType, record.externalId);

    const data: AcademyOsCanonicalEntity = {
      id: internalId,
      externalId: record.externalId,
      sourceSystem: "academyos",
      syncedAt,
      version,
      organizationId,
      campusId: campusId ? String(campusId) : null,
      objectType: record.objectType as AcademyOsObjectType,
      canonicalType: academyOsCanonicalType(record.objectType),
      attributes: { ...record.payload },
    };

    return {
      canonicalType: data.canonicalType,
      externalId: record.externalId,
      sourceSystem: "academyos",
      scope: {
        organizationId,
        schoolId: campusId,
      },
      data: data as unknown as Record<string, unknown>,
      lineage: {
        connectorId: "academyos",
        instanceId: config.instanceId,
        syncedAt,
        rawHash: hashPayload(record.payload),
      },
    };
  });
}

export function jagInternalId(source: string, objectType: string, externalId: string): string {
  const digest = createHash("sha1")
    .update(`${source}:${objectType}:${externalId}`)
    .digest("hex")
    .slice(0, 16);
  return `jag_${objectType}_${digest}`;
}

function hashPayload(payload: Record<string, unknown>): string {
  return createHash("sha1").update(JSON.stringify(payload)).digest("hex").slice(0, 12);
}

export { CANONICAL_TYPE };
