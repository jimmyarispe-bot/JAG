import { beforeEach, describe, expect, it } from "vitest";
import { createMockSupabase, TEST_UUIDS } from "../helpers/mock-supabase";
import {
  getEvidenceRecordById,
  getStudentEvidenceRecords,
  isKnownEvidenceType,
  listEvidenceRecords,
  recordEvidence,
  validateRecordEvidenceInput,
} from "@/lib/platform/evidence";

function createEvidenceMockStore() {
  const records: Record<string, unknown>[] = [];

  const supabase = createMockSupabase(({ table, operation, payload, filters }) => {
    if (table !== "platform_evidence_records") {
      return { data: null, error: { message: `Unknown table ${table}` } };
    }

    if (operation === "insert" || operation === "single") {
      const row = {
        id: "cccccccc-cccc-4ccc-8ccc-ccccccccccc3",
        recorded_at: new Date().toISOString(),
        status: "active",
        ...(payload as Record<string, unknown>),
      };
      records.push(row);
      return { data: row, error: null };
    }

    if (operation === "maybeSingle") {
      const row = records.find((record) => record.id === filters.id);
      return { data: row ?? null, error: null };
    }

    let rows = [...records];
    if (filters.student_id) {
      rows = rows.filter((row) => row.student_id === filters.student_id);
    }
    if (filters.evidence_type_key) {
      rows = rows.filter((row) => row.evidence_type_key === filters.evidence_type_key);
    }
    if (filters.school_id) {
      rows = rows.filter((row) => row.school_id === filters.school_id);
    }

    return { data: rows, error: null };
  });

  return { supabase, records };
}

describe("Platform evidence catalog", () => {
  it("registers reference evidence types from Doc 27", () => {
    expect(isKnownEvidenceType("observation.instructional")).toBe(true);
    expect(isKnownEvidenceType("mastery.validation")).toBe(true);
    expect(isKnownEvidenceType("unknown.type")).toBe(false);
  });
});

describe("Platform evidence validation", () => {
  it("requires skill or competency linkage", () => {
    const result = validateRecordEvidenceInput({
      evidenceTypeKey: "measurement.progress",
      studentId: TEST_UUIDS.student,
      schoolId: TEST_UUIDS.school,
      capturedByRole: "teacher",
      evidenceConfidence: 0.85,
      evidenceQuality: 0.8,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("skillKey or competencyKey");
    }
  });
});

describe("Platform evidence persistence", () => {
  beforeEach(() => {
    // no shared buffer — store is per test factory
  });

  it("records canonical evidence with Doc 27 fields", async () => {
    const { supabase, records } = createEvidenceMockStore();

    const result = await recordEvidence(supabase, {
      evidenceTypeKey: "observation.instructional",
      competencyKeys: ["AW-SL-PA-001-v1.0.0"],
      skillKeys: ["AW-SL-PA-001-AS-001-v1.0.0"],
      studentId: TEST_UUIDS.student,
      organizationId: TEST_UUIDS.organization,
      schoolId: TEST_UUIDS.school,
      capturedByRole: "teacher",
      capturedByUserId: TEST_UUIDS.user,
      evidenceConfidence: 0.9,
      evidenceQuality: 0.85,
      narrative: "Student segmented two-syllable words accurately.",
      sourceContext: { session_id: "session_1" },
    });

    expect(result.id).toBeTruthy();
    expect(records).toHaveLength(1);
    expect(records[0]?.evidence_type_key).toBe("observation.instructional");
    expect(records[0]?.competency_keys).toEqual(["AW-SL-PA-001-v1.0.0"]);
    expect(records[0]?.student_id).toBe(TEST_UUIDS.student);

    const loaded = await getEvidenceRecordById(supabase, result.id!);
    expect(loaded?.narrative).toContain("segmented");
  });

  it("lists student evidence records", async () => {
    const { supabase } = createEvidenceMockStore();

    await recordEvidence(supabase, {
      evidenceTypeKey: "measurement.progress",
      competencyKeys: ["AW-SL-PA-002-v1.0.0"],
      studentId: TEST_UUIDS.student,
      schoolId: TEST_UUIDS.school,
      capturedByRole: "teacher",
      evidenceConfidence: 0.8,
      evidenceQuality: 0.75,
    });

    const rows = await getStudentEvidenceRecords(supabase, TEST_UUIDS.student);
    expect(rows).toHaveLength(1);

    const filtered = await listEvidenceRecords(supabase, {
      evidenceTypeKey: "measurement.progress",
      schoolId: TEST_UUIDS.school,
    });
    expect(filtered).toHaveLength(1);
  });
});
