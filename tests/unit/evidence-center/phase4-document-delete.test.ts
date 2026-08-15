/**
 * Phase 4 — durable Evidence document delete (service, routes, security).
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { JagPlatformSession } from "@/lib/jag-platform/session";
import {
  assertJagEvidencePathForOrganization,
  buildJagEvidenceObjectPath,
  JAG_EVIDENCE_DOCUMENTS_BUCKET,
  removeJagEvidenceStorageObject,
} from "@/lib/evidence-center/storage";
import { deleteDurableEvidenceDocument } from "@/lib/evidence-center/upload-service";
import type {
  DurableEvidenceDocumentRow,
  DurableEvidenceVersionRow,
} from "@/lib/evidence-center/durable-repository";

const ROOT = process.cwd();
const ORG_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ORG_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const DOC = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const VER1 = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const VER2 = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

vi.mock("@/lib/jag-platform/server-session", () => ({
  getJagPlatformSession: vi.fn(),
}));

vi.mock("@/lib/evidence-center/upload-deps", () => ({
  createJagEvidenceUploadDeps: vi.fn(),
}));

vi.mock("@/lib/jag-platform/org-context", () => ({
  sessionCanAccessOrganization: (
    session: JagPlatformSession,
    organizationId: string
  ) => session.organizationId === organizationId,
}));

import { getJagPlatformSession } from "@/lib/jag-platform/server-session";
import { createJagEvidenceUploadDeps } from "@/lib/evidence-center/upload-deps";
import { DELETE as deleteDocumentRoute } from "@/app/api/jag-platform/evidence/documents/[documentId]/route";

const mockSession = vi.mocked(getJagPlatformSession);
const mockDeps = vi.mocked(createJagEvidenceUploadDeps);

function sessionFor(orgId: string): JagPlatformSession {
  return {
    userId: "user-1",
    email: "user@example.com",
    displayName: "User",
    role: "ORG_OWNER",
    authority: "organization",
    organizationId: orgId,
    issuedAt: new Date().toISOString(),
  };
}

function docRow(
  overrides: Partial<DurableEvidenceDocumentRow> = {}
): DurableEvidenceDocumentRow {
  const path = buildJagEvidenceObjectPath({
    organizationId: ORG_A,
    documentId: DOC,
    versionId: VER1,
    filename: "report.pdf",
  });
  return {
    id: DOC,
    organization_id: ORG_A,
    name: "Report",
    original_filename: "report.pdf",
    mime_type: "application/pdf",
    byte_size: 100,
    storage_path: path,
    created_by: "user-1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    lifecycle_status: "AVAILABLE",
    current_version: 1,
    domain: "General",
    evidence_type: "Other",
    description: "",
    tags: [],
    reporting_period_kind: "Custom",
    reporting_period_label: "Unspecified",
    business_unit: "Corporate",
    department: "",
    location: "",
    owner: "User",
    source: "Uploaded",
    confidentiality: "Internal",
    ...overrides,
  };
}

function verRow(
  id: string,
  versionNumber: number,
  orgId = ORG_A
): DurableEvidenceVersionRow {
  return {
    id,
    document_id: DOC,
    organization_id: orgId,
    version_number: versionNumber,
    storage_path: buildJagEvidenceObjectPath({
      organizationId: orgId,
      documentId: DOC,
      versionId: id,
      filename: `v${versionNumber}.pdf`,
    }),
    original_filename: `v${versionNumber}.pdf`,
    mime_type: "application/pdf",
    byte_size: 100,
    uploaded_by: "user-1",
    created_at: new Date().toISOString(),
    status: "AVAILABLE",
  };
}

type FakeState = {
  documents: DurableEvidenceDocumentRow[];
  versions: DurableEvidenceVersionRow[];
  removedPaths: string[];
  removeError?: { message: string; status?: number } | null;
  versionDeleteError?: string | null;
  documentDeleteError?: string | null;
};

function createFakeDeps(state: FakeState) {
  const db = {
    from: (table: string) => {
      if (table === "jag_evidence_documents") {
        return {
          select: () => ({
            eq: (col: string, val: string) => ({
              eq: (col2: string, val2: string) => ({
                maybeSingle: async () => {
                  const row = state.documents.find(
                    (d) =>
                      d.id === (col === "id" ? val : val2) &&
                      d.organization_id === (col === "organization_id" ? val : val2)
                  );
                  return { data: row ?? null, error: null };
                },
              }),
              maybeSingle: async () => {
                const row = state.documents.find((d) => d.id === val);
                return { data: row ?? null, error: null };
              },
            }),
          }),
          delete: () => ({
            eq: (col: string, val: string) => ({
              eq: async (_col2: string, _val2: string) => {
                if (state.documentDeleteError) {
                  return { error: { message: state.documentDeleteError } };
                }
                state.documents = state.documents.filter(
                  (d) => !(d.id === val || d.organization_id === val)
                );
                // After first eq(id), second eq(org) — simplify: delete matching both later
                return { error: null };
              },
            }),
          }),
        };
      }
      if (table === "jag_evidence_document_versions") {
        return {
          select: () => ({
            eq: (col: string, val: string) => ({
              eq: (col2: string, val2: string) => ({
                order: async () => {
                  const rows = state.versions.filter((v) => {
                    const orgOk =
                      col === "organization_id"
                        ? v.organization_id === val
                        : v.organization_id === val2;
                    const docOk =
                      col2 === "document_id"
                        ? v.document_id === val2
                        : v.document_id === val;
                    return orgOk && docOk;
                  });
                  return { data: rows, error: null };
                },
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          }),
          delete: () => ({
            eq: (col: string, val: string) => ({
              eq: (col2: string, val2: string) => ({
                select: async () => {
                  if (state.versionDeleteError) {
                    return { data: null, error: { message: state.versionDeleteError } };
                  }
                  const before = state.versions.length;
                  state.versions = state.versions.filter((v) => {
                    const org = col === "organization_id" ? val : val2;
                    const doc = col2 === "document_id" ? val2 : val;
                    return !(v.organization_id === org && v.document_id === doc);
                  });
                  const deleted = before - state.versions.length;
                  return {
                    data: Array.from({ length: deleted }, (_, i) => ({ id: `gone-${i}` })),
                    error: null,
                  };
                },
              }),
            }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
    storage: {
      from: () => ({
        list: async () => ({ data: [], error: null }),
        remove: async (paths: string[]) => {
          if (state.removeError) {
            return { data: null, error: state.removeError };
          }
          state.removedPaths.push(...paths);
          return { data: paths, error: null };
        },
      }),
    },
  };

  // Fix document delete to filter by both id and organization_id
  const originalFrom = db.from;
  db.from = (table: string) => {
    if (table !== "jag_evidence_documents") return originalFrom(table);
    return {
      select: () => ({
        eq: (col: string, val: string) => {
          const chain: {
            eq: (col2: string, val2: string) => {
              maybeSingle: () => Promise<{ data: DurableEvidenceDocumentRow | null; error: null }>;
            };
            maybeSingle: () => Promise<{ data: DurableEvidenceDocumentRow | null; error: null }>;
          } = {
            eq: (col2: string, val2: string) => ({
              maybeSingle: async () => {
                const row = state.documents.find((d) => {
                  const map: Record<string, string> = { [col]: val, [col2]: val2 };
                  return (
                    d.id === (map.id ?? d.id) &&
                    d.organization_id === (map.organization_id ?? d.organization_id)
                  );
                });
                // simpler matching
                const id = col === "id" ? val : val2;
                const org = col === "organization_id" ? val : val2;
                const found = state.documents.find(
                  (d) => d.id === id && d.organization_id === org
                );
                return { data: found ?? null, error: null };
              },
            }),
            maybeSingle: async () => {
              const found = state.documents.find((d) => d.id === val);
              return { data: found ?? null, error: null };
            },
          };
          return chain;
        },
      }),
      delete: () => {
        let idFilter: string | null = null;
        return {
          eq: (col: string, val: string) => {
            if (col === "id") idFilter = val;
            return {
              eq: async (col2: string, val2: string) => {
                if (state.documentDeleteError) {
                  return { error: { message: state.documentDeleteError } };
                }
                const org = col2 === "organization_id" ? val2 : val;
                const id = idFilter ?? (col === "id" ? val : val2);
                state.documents = state.documents.filter(
                  (d) => !(d.id === id && d.organization_id === org)
                );
                return { error: null };
              },
            };
          },
        };
      },
    };
  };

  return {
    db: db as never,
    storage: {
      storage: {
        from: (bucket: string) => {
          expect(bucket).toBe(JAG_EVIDENCE_DOCUMENTS_BUCKET);
          return {
            remove: async (paths: string[]) => {
              if (state.removeError) {
                return { data: null, error: state.removeError };
              }
              state.removedPaths.push(...paths);
              return { data: paths, error: null };
            },
          };
        },
      },
    },
  };
}

describe("phase 4 — storage path delete guards", () => {
  it("rejects cross-org and malformed paths before remove", async () => {
    const client = {
      storage: {
        from: () => ({
          remove: async () => {
            throw new Error("should not remove");
          },
        }),
      },
    };
    const cross = await removeJagEvidenceStorageObject({
      client,
      organizationId: ORG_A,
      documentId: DOC,
      versionId: VER1,
      path: buildJagEvidenceObjectPath({
        organizationId: ORG_B,
        documentId: DOC,
        versionId: VER1,
        filename: "x.pdf",
      }),
    });
    expect(cross.ok).toBe(false);

    const bad = await removeJagEvidenceStorageObject({
      client,
      organizationId: ORG_A,
      documentId: DOC,
      versionId: VER1,
      path: "org/not-a-uuid/documents/x/versions/y/z.pdf",
    });
    expect(bad.ok).toBe(false);
  });

  it("treats missing Storage objects as safely absent", async () => {
    const client = {
      storage: {
        from: () => ({
          remove: async () => ({
            data: null,
            error: { message: "Object not found", status: 404 },
          }),
        }),
      },
    };
    const path = buildJagEvidenceObjectPath({
      organizationId: ORG_A,
      documentId: DOC,
      versionId: VER1,
      filename: "gone.pdf",
    });
    const result = await removeJagEvidenceStorageObject({
      client,
      organizationId: ORG_A,
      documentId: DOC,
      versionId: VER1,
      path,
    });
    expect(result).toEqual({ ok: true, absent: true });
  });
});

describe("phase 4 — deleteDurableEvidenceDocument", () => {
  it("deletes one-version document, storage, versions, and document row", async () => {
    const state: FakeState = {
      documents: [docRow()],
      versions: [verRow(VER1, 1)],
      removedPaths: [],
    };
    const deps = createFakeDeps(state);
    const result = await deleteDurableEvidenceDocument(deps, {
      organizationId: ORG_A,
      documentId: DOC,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.deletedVersionCount).toBe(1);
    expect(result.deletedStorageObjectCount).toBe(1);
    expect(state.removedPaths).toHaveLength(1);
    expect(state.versions).toHaveLength(0);
    expect(state.documents).toHaveLength(0);
    assertJagEvidencePathForOrganization(ORG_A, state.removedPaths[0]!);
  });

  it("deletes multi-version document and all storage objects", async () => {
    const state: FakeState = {
      documents: [docRow({ current_version: 2 })],
      versions: [verRow(VER2, 2), verRow(VER1, 1)],
      removedPaths: [],
    };
    const deps = createFakeDeps(state);
    const result = await deleteDurableEvidenceDocument(deps, {
      organizationId: ORG_A,
      documentId: DOC,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.deletedVersionCount).toBe(2);
    expect(result.deletedStorageObjectCount).toBe(2);
    expect(state.removedPaths).toHaveLength(2);
    expect(state.versions).toHaveLength(0);
    expect(state.documents).toHaveLength(0);
  });

  it("leaves DB intact when Storage deletion fails", async () => {
    const state: FakeState = {
      documents: [docRow()],
      versions: [verRow(VER1, 1)],
      removedPaths: [],
      removeError: { message: "storage unavailable", status: 500 },
    };
    const deps = createFakeDeps(state);
    const result = await deleteDurableEvidenceDocument(deps, {
      organizationId: ORG_A,
      documentId: DOC,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/Storage cleanup failed/);
    expect(result.error).toMatch(/left intact/);
    expect(state.documents).toHaveLength(1);
    expect(state.versions).toHaveLength(1);
  });

  it("continues when a Storage object is already missing", async () => {
    const state: FakeState = {
      documents: [docRow()],
      versions: [verRow(VER1, 1)],
      removedPaths: [],
      removeError: { message: "Object not found", status: 404 },
    };
    const deps = createFakeDeps(state);
    const result = await deleteDurableEvidenceDocument(deps, {
      organizationId: ORG_A,
      documentId: DOC,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.absentStorageObjectCount).toBe(1);
    expect(state.documents).toHaveLength(0);
    expect(state.versions).toHaveLength(0);
  });

  it("refuses cross-org version path / org mismatch", async () => {
    const state: FakeState = {
      documents: [docRow()],
      versions: [verRow(VER1, 1, ORG_B)],
      removedPaths: [],
    };
    // Force version org B while listing under org A lookup — list filters by org so empty;
    // inject mismatch by putting org A filter-visible version with wrong org id field.
    state.versions = [
      {
        ...verRow(VER1, 1, ORG_A),
        organization_id: ORG_B,
        storage_path: buildJagEvidenceObjectPath({
          organizationId: ORG_B,
          documentId: DOC,
          versionId: VER1,
          filename: "x.pdf",
        }),
      },
    ];
    // listDurableVersions filters organization_id === ORG_A, so this won't appear.
    // Instead: version with ORG_A id but path for ORG_B
    state.versions = [
      {
        ...verRow(VER1, 1, ORG_A),
        storage_path: buildJagEvidenceObjectPath({
          organizationId: ORG_B,
          documentId: DOC,
          versionId: VER1,
          filename: "x.pdf",
        }),
      },
    ];
    const deps = createFakeDeps(state);
    const result = await deleteDurableEvidenceDocument(deps, {
      organizationId: ORG_A,
      documentId: DOC,
    });
    expect(result.ok).toBe(false);
    expect(state.documents).toHaveLength(1);
    expect(state.removedPaths).toHaveLength(0);
  });

  it("does not accept client storage_path — only DB version paths are used", async () => {
    const state: FakeState = {
      documents: [docRow()],
      versions: [verRow(VER1, 1)],
      removedPaths: [],
    };
    const deps = createFakeDeps(state);
    const attackerPath = buildJagEvidenceObjectPath({
      organizationId: ORG_B,
      documentId: DOC,
      versionId: VER1,
      filename: "secret.pdf",
    });
    await deleteDurableEvidenceDocument(deps, {
      organizationId: ORG_A,
      documentId: DOC,
      // @ts-expect-error — client must not be able to pass storage_path
      storage_path: attackerPath,
    });
    expect(state.removedPaths.every((p) => p.includes(ORG_A))).toBe(true);
    expect(state.removedPaths.some((p) => p.includes(ORG_B))).toBe(false);
  });
});

describe("phase 4 — DELETE API authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires authentication", async () => {
    mockSession.mockResolvedValue(null);
    const response = await deleteDocumentRoute(
      new Request("http://localhost/api", { method: "DELETE" }),
      { params: Promise.resolve({ documentId: DOC }) }
    );
    expect(response.status).toBe(401);
    expect(mockDeps).not.toHaveBeenCalled();
  });

  it("denies cross-organization document deletion", async () => {
    mockSession.mockResolvedValue(sessionFor(ORG_A));
    const state: FakeState = {
      documents: [docRow({ organization_id: ORG_B })],
      versions: [],
      removedPaths: [],
    };
    const deps = createFakeDeps(state);
    mockDeps.mockReturnValue(deps as never);
    const response = await deleteDocumentRoute(
      new Request("http://localhost/api", { method: "DELETE" }),
      { params: Promise.resolve({ documentId: DOC }) }
    );
    expect(response.status).toBe(403);
    expect(state.documents).toHaveLength(1);
  });

  it("ignores client organizationId / storage_path body and authorizes from DB org", async () => {
    mockSession.mockResolvedValue(sessionFor(ORG_A));
    const state: FakeState = {
      documents: [docRow()],
      versions: [verRow(VER1, 1)],
      removedPaths: [],
    };
    const deps = createFakeDeps(state);
    mockDeps.mockReturnValue(deps as never);
    const response = await deleteDocumentRoute(
      new Request("http://localhost/api", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: ORG_B,
          storage_path: "evil/path",
          versionId: VER2,
        }),
      }),
      { params: Promise.resolve({ documentId: DOC }) }
    );
    expect(response.status).toBe(200);
    const payload = (await response.json()) as { ok: boolean };
    expect(payload.ok).toBe(true);
    expect(state.documents).toHaveLength(0);
    expect(state.removedPaths.every((p) => p.includes(`/documents/${DOC}/`))).toBe(
      true
    );
  });

  it("allows authorized same-org deletion", async () => {
    mockSession.mockResolvedValue(sessionFor(ORG_A));
    const state: FakeState = {
      documents: [docRow()],
      versions: [verRow(VER1, 1)],
      removedPaths: [],
    };
    mockDeps.mockReturnValue(createFakeDeps(state) as never);
    const response = await deleteDocumentRoute(
      new Request("http://localhost/api", { method: "DELETE" }),
      { params: Promise.resolve({ documentId: DOC }) }
    );
    expect(response.status).toBe(200);
  });

  it("does not expose a version-only delete API surface", () => {
    const route = readFileSync(
      join(
        ROOT,
        "src/app/api/jag-platform/evidence/documents/[documentId]/route.ts"
      ),
      "utf8"
    );
    expect(route).toContain("export async function DELETE");
    expect(route).toContain("documentId only");
    expect(route).not.toMatch(/searchParams\.get\(["']versionId["']\)/);
    expect(route).not.toMatch(/body\.storage_path|body\.storagePath|body\.versionId/);
    expect(route).not.toMatch(/await _request\.(json|formData)/);
  });
});

describe("phase 4 — migration 222 / policy contracts unchanged", () => {
  it("keeps authenticated DELETE policies absent", () => {
    const sql = readFileSync(
      join(ROOT, "supabase/migrations/222_jag_evidence_authenticated_read_only.sql"),
      "utf8"
    );
    expect(sql).toContain("drop policy if exists jag_evidence_documents_delete");
    expect(sql).toContain("drop policy if exists jag_evidence_versions_delete");
    expect(sql).not.toContain("create policy jag_evidence_documents_delete");
    expect(sql).not.toContain("create policy jag_evidence_versions_delete");
  });

  it("bucket remains private in migration 220", () => {
    const sql = readFileSync(
      join(ROOT, "supabase/migrations/220_jag_evidence_durable_storage.sql"),
      "utf8"
    );
    expect(sql).toMatch(/public\s*=\s*false/);
    expect(sql).toContain("jag-evidence-documents");
  });
});

describe("phase 4 — UI contracts", () => {
  const detail = readFileSync(
    join(ROOT, "src/components/jag-platform/JagEvidenceDetail.tsx"),
    "utf8"
  );

  it("requires an explicit Delete confirmation showing the document name", () => {
    expect(detail).toContain("Delete Evidence?");
    expect(detail).toContain("documentName");
    expect(detail).toContain("This permanently deletes");
    expect(detail).toContain("all versions");
    expect(detail).toContain("stored files");
    expect(detail).toContain("This cannot be undone");
    expect(detail).toContain('{busy ? "Deleting…" : "Delete"}');
    expect(detail).toContain("Cancel");
    expect(detail).toContain("cancelRef.current?.focus()");
  });

  it("calls DELETE with documentId only and redirects to catalog on success", () => {
    expect(detail).toContain('method: "DELETE"');
    expect(detail).toContain(
      "`/api/jag-platform/evidence/documents/${encodeURIComponent(document.id)}`"
    );
    expect(detail).toContain('router.push(`/jag/evidence?org=${encodeURIComponent(organizationId)}`)');
    expect(detail).toContain("router.refresh()");
  });

  it("keeps the document visible on failure (error set, no redirect)", () => {
    expect(detail).toContain("Could not delete evidence document.");
    expect(detail).toMatch(/setDeleteOpen\(false\);\s*setError/s);
  });
});
