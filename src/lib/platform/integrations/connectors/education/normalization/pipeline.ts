import { createHash } from "crypto";
import type {
  ConnectorConfiguration,
  NormalizedRecord,
  SyncRecord,
} from "@/lib/platform/integrations/common/types";
import type {
  EducationCanonicalEntity,
  EducationObjectType,
  EducationProvider,
} from "@/lib/platform/integrations/connectors/education/entities";
import { educationCanonicalType } from "@/lib/platform/integrations/connectors/education/mapping";

export function toSyncRecords(
  raw: Array<{
    id: string;
    objectType: string;
    updatedAt: string;
    version: number;
    organizationId: string;
    provider: EducationProvider;
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
  delete attributes.provider;
  delete attributes.organizationId;
  delete attributes.version;
  delete attributes.updatedAt;
  return attributes;
}

export function domainAttributes(
  objectType: string,
  payload: Record<string, unknown>
): Record<string, unknown> {
  const base = scrub(payload);
  switch (objectType) {
    case "student":
      return {
        ...base,
        kind: "Student",
        name: base.name ?? null,
        gradeLevel: base.gradeLevel ?? null,
        status: base.status ?? "active",
        email: base.email ?? null,
      };
    case "teacher":
      return {
        ...base,
        kind: "Teacher",
        name: base.name ?? null,
        email: base.email ?? null,
        department: base.department ?? null,
        courseLoad: Number(base.courseLoad ?? 0),
      };
    case "course":
    case "class":
      return {
        ...base,
        kind: "Course",
        name: base.name ?? null,
        teacherId: base.teacherId ?? null,
        teacher: base.teacher ?? null,
        period: base.period ?? null,
        section: base.section ?? null,
      };
    case "assignment":
      return {
        ...base,
        kind: "Assignment",
        name: base.name ?? null,
        courseId: base.courseId ?? base.classId ?? null,
        classId: base.classId ?? base.courseId ?? null,
        teacherId: base.teacherId ?? null,
        dueAt: base.dueAt ?? null,
        points: Number(base.points ?? 0),
      };
    case "grade":
      return {
        ...base,
        kind: "Grade",
        name: base.name ?? null,
        studentId: base.studentId ?? null,
        assignmentId: base.assignmentId ?? null,
        courseId: base.courseId ?? base.classId ?? null,
        classId: base.classId ?? base.courseId ?? null,
        score: Number(base.score ?? 0),
        maxScore: Number(base.maxScore ?? 100),
      };
    case "attendance":
      return {
        ...base,
        kind: "Attendance",
        name: base.name ?? null,
        studentId: base.studentId ?? null,
        courseId: base.courseId ?? base.classId ?? null,
        classId: base.classId ?? base.courseId ?? null,
        status: base.status ?? "unknown",
        on: base.on ?? null,
      };
    case "schedule":
      return {
        ...base,
        kind: "Schedule",
        name: base.name ?? null,
        courseId: base.courseId ?? base.classId ?? null,
        classId: base.classId ?? base.courseId ?? null,
        teacherId: base.teacherId ?? null,
        studentId: base.studentId ?? null,
        dayOfWeek: base.dayOfWeek ?? null,
        startTime: base.startTime ?? null,
        endTime: base.endTime ?? null,
        period: base.period ?? null,
      };
    default:
      return base;
  }
}

export function normalizeEducationRecords(
  records: SyncRecord[],
  config: ConnectorConfiguration,
  provider: EducationProvider,
  syncedAt = new Date().toISOString()
): NormalizedRecord[] {
  return records.map((record) => {
    const version = Number(record.payload.version ?? 1);
    const organizationId =
      (record.payload.organizationId as string | undefined) ??
      config.scope.organizationId;
    const objectType = (
      record.objectType === "class" ? "course" : record.objectType
    ) as EducationObjectType;
    const attributes = domainAttributes(record.objectType, record.payload);
    const internalId = jagInternalId(provider, objectType, record.externalId);

    const data: EducationCanonicalEntity = {
      id: internalId,
      externalId: record.externalId,
      organizationId,
      sourceSystem: provider,
      syncedAt,
      version,
      objectType,
      canonicalType: educationCanonicalType(objectType),
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
    .update(`education:${provider}:${objectType}:${externalId}`)
    .digest("hex")
    .slice(0, 32);
}

function hashPayload(attributes: Record<string, unknown>): string {
  return createHash("sha256").update(JSON.stringify(attributes)).digest("hex").slice(0, 16);
}
