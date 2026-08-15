/**
 * Phase 1 — JAG Evidence durable storage foundation.
 * Static migration contract review + path helper unit tests (no linked DB apply).
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  assertJagEvidencePathForOrganization,
  buildJagEvidenceObjectPath,
  createJagEvidenceSignedDownloadUrl,
  createJagEvidenceSignedUploadUrl,
  JAG_EVIDENCE_ALLOWED_EXTENSIONS,
  JAG_EVIDENCE_ALLOWED_MIME_TYPES,
  JAG_EVIDENCE_DOCUMENTS_BUCKET,
  JAG_EVIDENCE_MAX_BYTES,
  parseJagEvidenceObjectPath,
  rejectArbitraryOrganizationPath,
  sanitizeJagEvidenceFilename,
} from "@/lib/evidence-center/storage";

const ROOT = process.cwd();
const MIGRATION = join(
  ROOT,
  "supabase/migrations/220_jag_evidence_durable_storage.sql"
);

const ORG_A = "11111111-1111-4111-8111-111111111111";
const ORG_B = "22222222-2222-4222-8222-222222222222";
const DOC_A = "33333333-3333-4333-8333-333333333333";
const VER_A = "44444444-4444-4444-8444-444444444444";

function sql(): string {
  return readFileSync(MIGRATION, "utf8");
}

describe("migration 220 — schema", () => {
  it("creates bucket, document, and version tables", () => {
    const body = sql();
    expect(body).toContain("'jag-evidence-documents'");
    expect(body).toContain(
      "create table if not exists public.jag_evidence_documents"
    );
    expect(body).toContain(
      "create table if not exists public.jag_evidence_document_versions"
    );
    expect(body).toContain("organization_id uuid not null");
    expect(body).toMatch(
      /jag_evidence_document_versions[\s\S]*document_id uuid not null/
    );
  });

  it("requires lifecycle and version status checks", () => {
    const body = sql();
    for (const status of [
      "UPLOADING",
      "UPLOADED",
      "AVAILABLE",
      "FAILED",
      "ARCHIVED",
    ]) {
      expect(body).toContain(`'${status}'`);
    }
    expect(body).toContain("lifecycle_status");
    expect(body).toMatch(
      /jag_evidence_document_versions[\s\S]*check \(status in \('UPLOADING'/
    );
  });

  it("does not touch AcademyOS platform_documents or other buckets", () => {
    const body = sql();
    expect(body).not.toMatch(
      /\b(alter|drop|create|update)\b[\s\S]{0,40}\bplatform_documents\b/i
    );
    expect(body).not.toMatch(
      /\b(alter|drop|create|update)\b[\s\S]{0,40}\bplatform_document_versions\b/i
    );
    expect(body).not.toMatch(
      /insert into storage\.buckets[\s\S]*admissions-documents/
    );
    expect(body).not.toMatch(
      /insert into storage\.buckets[\s\S]*student-documents/
    );
    expect(body).not.toMatch(
      /insert into storage\.buckets[\s\S]*jag-learn-media/
    );
    expect(body).not.toContain("school_id is null");
    expect(body).not.toContain("can_access_school");
  });
});

describe("migration 220 — RLS / authorization contracts", () => {
  it("enables RLS and scopes all policies to can_access_organization", () => {
    const body = sql();
    expect(body).toContain(
      "alter table public.jag_evidence_documents enable row level security"
    );
    expect(body).toContain(
      "alter table public.jag_evidence_document_versions enable row level security"
    );

    for (const policy of [
      "jag_evidence_documents_select",
      "jag_evidence_documents_insert",
      "jag_evidence_documents_update",
      "jag_evidence_documents_delete",
      "jag_evidence_versions_select",
      "jag_evidence_versions_insert",
      "jag_evidence_versions_update",
      "jag_evidence_versions_delete",
    ]) {
      expect(body).toContain(policy);
    }

    expect(body).toContain("public.can_access_organization(organization_id)");
    // Must not redefine org access helpers
    expect(body).not.toContain(
      "create or replace function public.can_access_organization"
    );
    expect(body).not.toContain(
      "create or replace function public.user_can_access_organization"
    );
  });

  it("documents isolation intent: org A cannot access org B (policy + trigger)", () => {
    const body = sql();
    // Every mutating/select policy is org-gated
    const orgGates = body.match(
      /can_access_organization\(organization_id\)/g
    );
    expect((orgGates ?? []).length).toBeGreaterThanOrEqual(8);

    // Versions cannot cross organizations
    expect(body).toContain("jag_evidence_version_org_matches_document");
    expect(body).toContain(
      "organization_id must match parent document"
    );
  });

  it("locks down storage.objects — no broad authenticated read/write", () => {
    const body = sql();
    expect(body).toContain("public = false");
    expect(body).toContain("20971520");
    expect(body).toContain(
      "drop policy if exists jag_evidence_documents_authenticated_select"
    );
    expect(body).toContain(
      "drop policy if exists jag_evidence_documents_authenticated_all"
    );
    expect(body).toContain(
      "drop policy if exists jag_evidence_documents_authenticated_insert"
    );
    // Must not CREATE open storage policies
    expect(body).not.toMatch(
      /create policy jag_evidence_documents_authenticated/i
    );
    expect(body).not.toMatch(
      /create policy[\s\S]*on storage\.objects[\s\S]*authenticated/i
    );
  });
});

describe("storage path contract", () => {
  it("builds the canonical org/document/version hierarchy", () => {
    const path = buildJagEvidenceObjectPath({
      organizationId: ORG_A,
      documentId: DOC_A,
      versionId: VER_A,
      filename: "FY2025 P&L.pdf",
    });
    expect(path).toBe(
      `org/${ORG_A}/documents/${DOC_A}/versions/${VER_A}/FY2025_P_L.pdf`
    );
    expect(path.startsWith(`org/${ORG_A}/`)).toBe(true);
    const parsed = parseJagEvidenceObjectPath(path);
    expect(parsed.organizationId).toBe(ORG_A);
    expect(parsed.documentId).toBe(DOC_A);
    expect(parsed.versionId).toBe(VER_A);
    expect(parsed.bucket).toBe(JAG_EVIDENCE_DOCUMENTS_BUCKET);
  });

  it("sanitizes unsafe filenames and rejects unsupported types", () => {
    expect(sanitizeJagEvidenceFilename("../../etc/passwd.pdf")).toBe(
      "passwd.pdf"
    );
    expect(sanitizeJagEvidenceFilename("a\\b\\report.docx")).toBe("report.docx");
    expect(() =>
      buildJagEvidenceObjectPath({
        organizationId: ORG_A,
        documentId: DOC_A,
        versionId: VER_A,
        filename: "malware.exe",
      })
    ).toThrow(/Unsupported/);
  });

  it("rejects arbitrary organization paths for the authorized org", () => {
    const foreign = buildJagEvidenceObjectPath({
      organizationId: ORG_B,
      documentId: DOC_A,
      versionId: VER_A,
      filename: "board.pdf",
    });
    expect(() =>
      assertJagEvidencePathForOrganization(ORG_A, foreign)
    ).toThrow(/organization mismatch/);
    expect(() =>
      rejectArbitraryOrganizationPath(ORG_A, foreign)
    ).toThrow(/organization mismatch/);
    expect(() => parseJagEvidenceObjectPath("org/not-a-uuid/documents/x")).toThrow();
  });

  it("exports Phase 1 constants aligned with the bucket", () => {
    expect(JAG_EVIDENCE_DOCUMENTS_BUCKET).toBe("jag-evidence-documents");
    expect(JAG_EVIDENCE_MAX_BYTES).toBe(20 * 1024 * 1024);
    expect(JAG_EVIDENCE_ALLOWED_EXTENSIONS).toEqual([
      "pdf",
      "docx",
      "xlsx",
      "csv",
      "pptx",
      "txt",
    ]);
    expect(JAG_EVIDENCE_ALLOWED_MIME_TYPES).toContain("application/pdf");
    expect(JAG_EVIDENCE_ALLOWED_MIME_TYPES).toContain("text/csv");
  });

  it("signed URL helpers enforce org binding before calling storage", async () => {
    const foreign = buildJagEvidenceObjectPath({
      organizationId: ORG_B,
      documentId: DOC_A,
      versionId: VER_A,
      filename: "x.pdf",
    });
    await expect(
      createJagEvidenceSignedDownloadUrl({
        organizationId: ORG_A,
        path: foreign,
        client: {
          storage: {
            from: () => ({
              createSignedUrl: async () => ({
                data: { signedUrl: "https://example.test" },
                error: null,
              }),
            }),
          },
        },
      })
    ).rejects.toThrow(/organization mismatch/);

    await expect(
      createJagEvidenceSignedUploadUrl({
        organizationId: ORG_A,
        documentId: DOC_A,
        versionId: VER_A,
        filename: "ok.pdf",
        client: {
          storage: {
            from: () => ({
              createSignedUrl: async () => ({
                data: { signedUrl: "https://example.test" },
                error: null,
              }),
            }),
          },
        },
      })
    ).rejects.toThrow(/not available/);
  });
});
