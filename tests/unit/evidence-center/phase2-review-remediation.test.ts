/**
 * Phase 2 review remediation — memory fallback gate + storage size integrity.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isJagEvidenceMemoryFallbackEnabled } from "@/lib/evidence-center/memory-fallback";
import { verifyDurableStorageObject } from "@/lib/evidence-center/durable-repository";
import { buildJagEvidenceObjectPath } from "@/lib/evidence-center/storage";

const ROOT = process.cwd();
const ORG_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const DOC = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const VER = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

describe("memory fallback gate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is disabled in production NODE_ENV", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("JAG_EVIDENCE_ALLOW_MEMORY_FALLBACK", "true");
    expect(isJagEvidenceMemoryFallbackEnabled()).toBe(false);
  });

  it("is disabled on Vercel production even if opt-in is set", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("JAG_EVIDENCE_ALLOW_MEMORY_FALLBACK", "true");
    expect(isJagEvidenceMemoryFallbackEnabled()).toBe(false);
  });

  it("is enabled under test by default", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("JAG_EVIDENCE_ALLOW_MEMORY_FALLBACK", "");
    expect(isJagEvidenceMemoryFallbackEnabled()).toBe(true);
  });
});

describe("storage verification integrity", () => {
  const path = buildJagEvidenceObjectPath({
    organizationId: ORG_A,
    documentId: DOC,
    versionId: VER,
    filename: "a.pdf",
  });

  it("fails when object is present but size metadata is missing", async () => {
    const client = {
      from: () => ({}),
      storage: {
        from: () => ({
          list: async () => ({
            data: [{ name: "a.pdf" }],
            error: null,
          }),
        }),
      },
    };
    const result = await verifyDurableStorageObject(client as never, {
      bucket: "jag-evidence-documents",
      path,
      expectedByteSize: 10,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/size metadata is unavailable/i);
    }
  });

  it("uses info() size when list omits size", async () => {
    const client = {
      from: () => ({}),
      storage: {
        from: () => ({
          info: async () => ({
            data: { size: 10 },
            error: null,
          }),
          list: async () => ({
            data: [{ name: "a.pdf" }],
            error: null,
          }),
        }),
      },
    };
    const result = await verifyDurableStorageObject(client as never, {
      bucket: "jag-evidence-documents",
      path,
      expectedByteSize: 10,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.size).toBe(10);
  });

  it("fails on size mismatch", async () => {
    const client = {
      from: () => ({}),
      storage: {
        from: () => ({
          list: async () => ({
            data: [{ name: "a.pdf", metadata: { size: 99 } }],
            error: null,
          }),
        }),
      },
    };
    const result = await verifyDurableStorageObject(client as never, {
      bucket: "jag-evidence-documents",
      path,
      expectedByteSize: 10,
    });
    expect(result.ok).toBe(false);
  });
});

describe("migration 222 — authenticated read-only", () => {
  it("drops authenticated write policies and keeps no storage/grant changes", () => {
    const sql = readFileSync(
      join(ROOT, "supabase/migrations/222_jag_evidence_authenticated_read_only.sql"),
      "utf8"
    );
    expect(sql).toContain("drop policy if exists jag_evidence_documents_update");
    expect(sql).toContain("drop policy if exists jag_evidence_versions_update");
    expect(sql).toContain("drop policy if exists jag_evidence_documents_insert");
    expect(sql).toContain("drop policy if exists jag_evidence_versions_insert");
    expect(sql).toContain("drop policy if exists jag_evidence_documents_delete");
    expect(sql).toContain("drop policy if exists jag_evidence_versions_delete");
    expect(sql).not.toContain("create policy");
    expect(sql).not.toContain("storage.buckets");
    expect(sql).not.toContain("grant ");
    expect(sql).not.toContain("platform_documents");
  });
});
