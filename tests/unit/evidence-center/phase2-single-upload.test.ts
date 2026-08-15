/**
 * Phase 2 — JAG Evidence single-upload security + validation tests.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { validateJagEvidenceFileInput } from "@/lib/evidence-center/validate-file";
import {
  assertJagEvidencePathForOrganization,
  buildJagEvidenceObjectPath,
  JAG_EVIDENCE_MAX_BYTES,
} from "@/lib/evidence-center/storage";
import {
  authorizeEvidenceUpload,
  completeEvidenceUpload,
  createEvidenceDownloadUrl,
} from "@/lib/evidence-center/upload-service";

const ROOT = process.cwd();
const ORG_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ORG_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const DOC = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const VER = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

describe("migration 221 — organization immutability", () => {
  it("adds immutable organization_id trigger", () => {
    const sql = readFileSync(
      join(ROOT, "supabase/migrations/221_jag_evidence_org_immutable.sql"),
      "utf8"
    );
    expect(sql).toContain("jag_evidence_document_organization_immutable");
    expect(sql).toContain("organization_id is immutable after creation");
    expect(sql).toContain("before update of organization_id");
    expect(sql).not.toContain("platform_documents");
    expect(sql).not.toContain("create policy");
  });
});

describe("file validation", () => {
  it("accepts allowed files", () => {
    const ok = validateJagEvidenceFileInput({
      filename: "report.pdf",
      mimeType: "application/pdf",
      byteSize: 1024,
    });
    expect(ok.ok).toBe(true);
  });

  it("rejects unsupported extension, MIME mismatch, oversized, and empty", () => {
    expect(
      validateJagEvidenceFileInput({
        filename: "x.exe",
        mimeType: "application/octet-stream",
        byteSize: 10,
      }).ok
    ).toBe(false);
    expect(
      validateJagEvidenceFileInput({
        filename: "x.pdf",
        mimeType: "text/plain",
        byteSize: 10,
      }).ok
    ).toBe(false);
    expect(
      validateJagEvidenceFileInput({
        filename: "x.pdf",
        mimeType: "application/pdf",
        byteSize: JAG_EVIDENCE_MAX_BYTES + 1,
      }).ok
    ).toBe(false);
    expect(
      validateJagEvidenceFileInput({
        filename: "x.pdf",
        mimeType: "application/pdf",
        byteSize: 0,
      }).ok
    ).toBe(false);
  });
});

describe("upload authorization service", () => {
  it("authorized create mints path under org and stores UPLOADING rows", async () => {
    const inserts: Record<string, unknown>[] = [];
    const db = {
      from: (table: string) => ({
        insert: (row: Record<string, unknown>) => {
          inserts.push({ table, ...row });
          return {
            select: () => ({
              single: async () => ({ data: row, error: null }),
            }),
          };
        },
        update: () => ({
          eq: () => ({
            eq: async () => ({ error: null }),
          }),
        }),
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
              order: async () => ({ data: [], error: null }),
            }),
            order: async () => ({ data: [], error: null }),
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      }),
      storage: { from: () => ({ list: async () => ({ data: [], error: null }) }) },
    };

    const storage = {
      storage: {
        from: () => ({
          createSignedUrl: async () => ({
            data: { signedUrl: "https://example.test/dl" },
            error: null,
          }),
          createSignedUploadUrl: async () => ({
            data: {
              signedUrl: "https://example.test/up",
              token: "tok",
              path: "unused",
            },
            error: null,
          }),
        }),
      },
    };

    const result = await authorizeEvidenceUpload(
      { db: db as never, storage },
      {
        mode: "create",
        organizationId: ORG_A,
        organizationName: "Org A",
        actorUserId: "user-a",
        actorDisplayName: "Alice",
        filename: "board.pdf",
        mimeType: "application/pdf",
        byteSize: 2048,
        name: "Board Pack",
        reportingPeriodLabel: "FY2026",
      }
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.path.startsWith(`org/${ORG_A}/documents/`)).toBe(true);
    expect(result.signedUrl).toContain("https://");
    expect(inserts.some((r) => r.table === "jag_evidence_documents")).toBe(true);
    expect(inserts.some((r) => r.lifecycle_status === "UPLOADING")).toBe(true);
    expect(() =>
      assertJagEvidencePathForOrganization(ORG_B, result.path)
    ).toThrow(/mismatch/);
  });

  it("rejects authorize for invalid file before minting", async () => {
    const result = await authorizeEvidenceUpload(
      {
        db: { from: () => ({}), storage: { from: () => ({}) } } as never,
        storage: { storage: { from: () => ({}) } },
      },
      {
        mode: "create",
        organizationId: ORG_A,
        organizationName: "Org A",
        actorUserId: "u",
        actorDisplayName: "U",
        filename: "x.exe",
        mimeType: "application/octet-stream",
        byteSize: 10,
      }
    );
    expect(result.ok).toBe(false);
  });

  it("complete marks FAILED when object missing and AVAILABLE when present", async () => {
    const path = buildJagEvidenceObjectPath({
      organizationId: ORG_A,
      documentId: DOC,
      versionId: VER,
      filename: "a.pdf",
    });

    const doc = {
      id: DOC,
      organization_id: ORG_A,
      lifecycle_status: "UPLOADING",
      storage_path: path,
      byte_size: 10,
      original_filename: "a.pdf",
      mime_type: "application/pdf",
      current_version: 1,
      name: "A",
      domain: "General",
      evidence_type: "Other",
      description: "",
      tags: [],
      reporting_period_kind: "Custom",
      reporting_period_label: "X",
      business_unit: "Corporate",
      department: "",
      location: "",
      owner: "",
      source: "Uploaded",
      confidentiality: "Internal",
      created_by: "u",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const version = {
      id: VER,
      document_id: DOC,
      organization_id: ORG_A,
      version_number: 1,
      storage_path: path,
      original_filename: "a.pdf",
      mime_type: "application/pdf",
      byte_size: 10,
      status: "UPLOADING",
      uploaded_by: "u",
      created_at: new Date().toISOString(),
    };

    let listData: { name: string; metadata?: { size: number } }[] = [];
    const updates: string[] = [];

    function chainEq(final: () => Promise<{ data?: unknown; error: null }>) {
      const node: {
        eq: () => unknown;
        maybeSingle: () => Promise<{ data?: unknown; error: null }>;
        order: () => Promise<{ data?: unknown; error: null }>;
        then?: typeof Promise.prototype.then;
      } = {
        eq: () => chainEq(final),
        maybeSingle: () => final(),
        order: () => final(),
      };
      return node;
    }

    const db = {
      from: (table: string) => ({
        select: () =>
          chainEq(async () =>
            table === "jag_evidence_documents"
              ? { data: doc, error: null }
              : { data: version, error: null }
          ),
        update: (patch: { lifecycle_status?: string; status?: string }) => {
          updates.push(patch.lifecycle_status ?? patch.status ?? "");
          return chainEq(async () => ({ error: null }));
        },
      }),
      storage: {
        from: () => ({
          list: async () => ({ data: listData, error: null }),
        }),
      },
    };

    const failed = await completeEvidenceUpload(
      { db: db as never },
      { organizationId: ORG_A, documentId: DOC, versionId: VER }
    );
    expect(failed.ok).toBe(false);
    expect(updates).toContain("FAILED");

    listData = [{ name: "a.pdf", metadata: { size: 10 } }];
    updates.length = 0;
    const ok = await completeEvidenceUpload(
      { db: db as never },
      { organizationId: ORG_A, documentId: DOC, versionId: VER }
    );
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.lifecycleStatus).toBe("AVAILABLE");
    expect(updates).toContain("AVAILABLE");
  });

  it("download denies other organization documents", async () => {
    const db = {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        }),
      }),
      storage: { from: () => ({ list: async () => ({ data: [], error: null }) }) },
    };
    const result = await createEvidenceDownloadUrl(
      {
        db: db as never,
        storage: {
          storage: {
            from: () => ({
              createSignedUrl: async () => ({
                data: { signedUrl: "https://x" },
                error: null,
              }),
            }),
          },
        },
      },
      { organizationId: ORG_B, documentId: DOC }
    );
    expect(result.ok).toBe(false);
  });
});

describe("path contract regression", () => {
  it("client cannot override organization in path builder", () => {
    const path = buildJagEvidenceObjectPath({
      organizationId: ORG_A,
      documentId: DOC,
      versionId: VER,
      filename: "x.pdf",
    });
    expect(path.includes(ORG_A)).toBe(true);
    expect(path.includes(ORG_B)).toBe(false);
    vi.stubGlobal("crypto", crypto);
  });
});

describe("cross-organization isolation (service)", () => {
  it("complete fails when document is not in requested organization", async () => {
    const db = {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        }),
      }),
      storage: { from: () => ({ list: async () => ({ data: [], error: null }) }) },
    };
    const result = await completeEvidenceUpload(
      { db: db as never },
      { organizationId: ORG_B, documentId: DOC, versionId: VER }
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(404);
  });

  it("version authorize cannot target another org's document", async () => {
    const db = {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
              order: async () => ({ data: [], error: null }),
            }),
            order: async () => ({ data: [], error: null }),
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
        insert: () => ({
          select: () => ({
            single: async () => ({ data: null, error: { message: "nope" } }),
          }),
        }),
        update: () => ({
          eq: () => ({
            eq: async () => ({ error: null }),
          }),
        }),
      }),
      storage: { from: () => ({ list: async () => ({ data: [], error: null }) }) },
    };
    const result = await authorizeEvidenceUpload(
      {
        db: db as never,
        storage: {
          storage: {
            from: () => ({
              createSignedUploadUrl: async () => ({
                data: { signedUrl: "https://x", token: "t", path: "p" },
                error: null,
              }),
            }),
          },
        },
      },
      {
        mode: "version",
        organizationId: ORG_B,
        organizationName: "B",
        actorUserId: "u",
        actorDisplayName: "U",
        documentId: DOC,
        filename: "a.pdf",
        mimeType: "application/pdf",
        byteSize: 10,
      }
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(404);
  });
});
