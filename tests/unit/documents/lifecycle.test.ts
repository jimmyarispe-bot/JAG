import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabase, TEST_UUIDS } from "../../helpers/mock-supabase";
import type { IdentityContext } from "@/lib/platform/identity/context";

vi.mock("@/lib/platform/shared/context", () => ({
  resolveActorUserId: vi.fn(async () => TEST_UUIDS.user),
  resolveSchoolContext: vi.fn(async () => ({
    organizationId: TEST_UUIDS.organization,
    schoolId: TEST_UUIDS.school,
  })),
}));

vi.mock("@/lib/platform/activity", () => ({
  recordActivity: vi.fn(async () => ({ id: TEST_UUIDS.activity })),
}));

import { recordActivity } from "@/lib/platform/activity";
import {
  canEditDocuments,
  canManageAllDocuments,
  canManageFinanceDocuments,
  canManageHrDocuments,
  canManageSchoolDocuments,
  canViewDocuments,
} from "@/lib/documents/access";
import { compareVersions } from "@/lib/documents/compare";
import { detectPreviewKind, canInlinePreview } from "@/lib/documents/preview";
import { isAllowedUploadMime } from "@/lib/documents/service";
import {
  archiveDocument,
  createDocument,
  deleteDocument,
  restoreDocument,
  updateDocument,
} from "@/lib/documents/service";
import { duplicateFromTemplate } from "@/lib/documents/templates";
import {
  ensureEsignExtensionsRegistered,
  requestSignature,
} from "@/lib/documents/esign";
import { getExtension } from "@/lib/workflows/extension";
import { ACTIVITY_EVENT_CATALOG } from "@/lib/platform/activity/catalog";
import { WORKFLOW_ACTION_LIBRARY } from "@/lib/workflows/actions";
import type { DocumentVersionRow } from "@/lib/documents/types";

const DOC_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const TEMPLATE_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const AUDIT_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

function identityWithRoles(roles: string[], permissions: string[] = []): IdentityContext {
  return {
    id: TEST_UUIDS.user,
    email: "test@example.com",
    fullName: "Test User",
    roles: roles as IdentityContext["roles"],
    primaryRole: roles[0] as IdentityContext["primaryRole"],
    roleLabel: roles[0] ?? "User",
    effectiveUserId: TEST_UUIDS.user,
    permissions: permissions as IdentityContext["permissions"],
    orgAssignments: [],
    accessibleSchoolIds: [TEST_UUIDS.school],
    hasUnrestrictedSchoolAccess: roles.includes("CEO") || roles.includes("FOUNDER"),
    isFounder: roles.includes("FOUNDER"),
    isEnterpriseAdmin: false,
    impersonation: null,
    preferences: null,
  };
}

function baseDoc(overrides: Record<string, unknown> = {}) {
  return {
    id: DOC_ID,
    audit_id: AUDIT_ID,
    organization_id: TEST_UUIDS.organization,
    school_id: TEST_UUIDS.school,
    title: "Enrollment Packet",
    description: "Test",
    category: "enrollment",
    document_type: "file",
    status: "active",
    current_version: 1,
    mime_type: "application/pdf",
    file_name: "packet.pdf",
    storage_path: null,
    file_url: "https://example.com/packet.pdf",
    file_size_bytes: 1024,
    tags: [],
    owner_user_id: TEST_UUIDS.user,
    uploaded_by: TEST_UUIDS.user,
    template_id: null,
    workflow_id: null,
    requires_signature: false,
    signature_status: null,
    signature_provider: null,
    signature_external_id: null,
    policy_locked: false,
    metadata: {},
    created_at: "2026-07-01T00:00:00.000Z",
    updated_at: "2026-07-01T00:00:00.000Z",
    archived_at: null,
    ...overrides,
  };
}

describe("document permissions", () => {
  it("gives CEO/Founder full access; school leaders school management", () => {
    expect(canManageAllDocuments(identityWithRoles(["CEO"]))).toBe(true);
    expect(canManageAllDocuments(identityWithRoles(["FOUNDER"]))).toBe(true);
    expect(canManageSchoolDocuments(identityWithRoles(["SCHOOL_LEADER"]))).toBe(true);
    expect(canManageSchoolDocuments(identityWithRoles(["TEACHER"]))).toBe(false);
  });

  it("allows teachers/HR/finance edit paths; parents view only", () => {
    expect(canEditDocuments(identityWithRoles(["TEACHER"]))).toBe(true);
    expect(canManageHrDocuments(identityWithRoles(["HR"]))).toBe(true);
    expect(canManageFinanceDocuments(identityWithRoles(["CEO"], ["finance.view"]))).toBe(true);
    expect(canEditDocuments(identityWithRoles(["PARENT"]))).toBe(false);
    expect(canViewDocuments(identityWithRoles(["PARENT"]))).toBe(true);
    expect(canViewDocuments(identityWithRoles(["STUDENT"]))).toBe(true);
  });
});

describe("upload mime types", () => {
  it("allows PDF, DOCX, images, CSV, TXT; future media", () => {
    expect(isAllowedUploadMime("application/pdf")).toBe(true);
    expect(
      isAllowedUploadMime(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      )
    ).toBe(true);
    expect(isAllowedUploadMime("image/png")).toBe(true);
    expect(isAllowedUploadMime("text/csv")).toBe(true);
    expect(isAllowedUploadMime("video/mp4")).toBe(true);
    expect(isAllowedUploadMime("application/x-msdownload")).toBe(false);
  });
});

describe("preview", () => {
  it("detects inline preview kinds", () => {
    expect(detectPreviewKind("application/pdf")).toBe("pdf");
    expect(detectPreviewKind("image/jpeg")).toBe("image");
    expect(detectPreviewKind("text/plain")).toBe("text");
    expect(
      detectPreviewKind(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      )
    ).toBe("office");
    expect(canInlinePreview("application/pdf")).toBe(true);
    expect(canInlinePreview("application/msword")).toBe(false);
  });
});

describe("version compare", () => {
  it("flags title and file changes", () => {
    const a: DocumentVersionRow = {
      id: "1",
      document_id: DOC_ID,
      version_number: 1,
      title: "A",
      description: "d",
      mime_type: "application/pdf",
      file_name: "a.pdf",
      storage_path: null,
      file_url: "https://a",
      file_size_bytes: 1,
      change_summary: null,
      created_by: null,
      created_at: "2026-07-01T00:00:00.000Z",
    };
    const b = { ...a, id: "2", version_number: 2, title: "B", file_url: "https://b" };
    const diff = compareVersions(a, b);
    expect(diff.titleChanged).toBe(true);
    expect(diff.fileChanged).toBe(true);
    expect(diff.descriptionChanged).toBe(false);
  });
});

describe("document lifecycle", () => {
  beforeEach(() => {
    vi.mocked(recordActivity).mockClear();
  });

  it("creates a document with initial version and EI event", async () => {
    const supabase = createMockSupabase(({ table, operation }) => {
      if (
        table === "platform_documents" &&
        (operation === "insert" || operation === "single")
      ) {
        return {
          data: { id: DOC_ID, audit_id: AUDIT_ID, current_version: 1, status: "active" },
          error: null,
        };
      }
      if (table === "platform_documents" && (operation === "maybeSingle" || operation === "select")) {
        return { data: baseDoc(), error: null };
      }
      if (table === "platform_document_versions") {
        return { data: { id: "v1" }, error: null };
      }
      if (table === "platform_document_relations") {
        return { data: [], error: null };
      }
      return { data: null, error: null };
    });

    const result = await createDocument(supabase as never, {
      title: "Enrollment Packet",
      category: "enrollment",
      schoolId: TEST_UUIDS.school,
      fileUrl: "https://example.com/packet.pdf",
      mimeType: "application/pdf",
      relations: [{ entityType: "student", entityId: TEST_UUIDS.student, isPrimary: true }],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.documentId).toBe(DOC_ID);
      expect(result.version).toBe(1);
    }
    const events = vi.mocked(recordActivity).mock.calls.map((c) => c[1]?.eventType);
    expect(events).toContain("document.created");
    expect(events).toContain("document.uploaded");
  });

  it("versions on update", async () => {
    let loads = 0;
    const supabase = createMockSupabase(({ table, operation }) => {
      if (table === "platform_documents" && operation === "maybeSingle") {
        loads += 1;
        return {
          data:
            loads === 1
              ? baseDoc()
              : baseDoc({ current_version: 2, title: "Enrollment Packet v2" }),
          error: null,
        };
      }
      if (table === "platform_documents" && operation === "update") {
        return { data: null, error: null };
      }
      if (table === "platform_document_versions") {
        return { data: { id: "v2" }, error: null };
      }
      if (table === "platform_document_relations") {
        return { data: [], error: null };
      }
      return { data: null, error: null };
    });

    const result = await updateDocument(supabase as never, DOC_ID, {
      title: "Enrollment Packet v2",
      changeSummary: "Revised",
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.version).toBe(2);
    const events = vi.mocked(recordActivity).mock.calls.map((c) => c[1]?.eventType);
    expect(events).toContain("document.versioned");
  });

  it("archives and restores with EI events", async () => {
    let status = "active";
    const supabase = createMockSupabase(({ table, operation }) => {
      if (table === "platform_documents" && operation === "maybeSingle") {
        return {
          data: baseDoc({
            status,
            archived_at: status === "archived" ? "2026-07-02T00:00:00.000Z" : null,
          }),
          error: null,
        };
      }
      if (table === "platform_documents" && operation === "update") {
        status = status === "archived" ? "active" : "archived";
        return { data: null, error: null };
      }
      if (table === "platform_document_relations") {
        return { data: [], error: null };
      }
      return { data: null, error: null };
    });

    const archiveResult = await archiveDocument(supabase as never, DOC_ID);
    expect(archiveResult.ok).toBe(true);
    expect(
      vi.mocked(recordActivity).mock.calls.some((c) => c[1]?.eventType === "document.archived")
    ).toBe(true);

    const restoreResult = await restoreDocument(supabase as never, DOC_ID);
    expect(restoreResult.ok).toBe(true);
    expect(
      vi.mocked(recordActivity).mock.calls.some((c) => c[1]?.eventType === "document.restored")
    ).toBe(true);
  });

  it("blocks delete when policy_locked", async () => {
    const supabase = createMockSupabase(({ table, operation }) => {
      if (table === "platform_documents" && operation === "maybeSingle") {
        return { data: baseDoc({ policy_locked: true }), error: null };
      }
      return { data: null, error: null };
    });

    const result = await deleteDocument(supabase as never, {
      documentId: DOC_ID,
      confirmationText: "DELETE",
      acknowledged: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("policy_locked");
      expect(result.suggestArchive).toBe(true);
    }
  });

  it("deletes when confirmed and not policy-locked", async () => {
    const supabase = createMockSupabase(({ table, operation }) => {
      if (table === "platform_documents" && operation === "maybeSingle") {
        return { data: baseDoc(), error: null };
      }
      if (
        table === "platform_documents" ||
        table === "platform_document_relations" ||
        table === "platform_document_versions"
      ) {
        return { data: null, error: null };
      }
      return { data: null, error: null };
    });

    const result = await deleteDocument(supabase as never, {
      documentId: DOC_ID,
      confirmationText: "DELETE",
      acknowledged: true,
    });
    expect(result.ok).toBe(true);
    expect(
      vi.mocked(recordActivity).mock.calls.some((c) => c[1]?.eventType === "document.deleted")
    ).toBe(true);
  });
});

describe("templates", () => {
  beforeEach(() => {
    vi.mocked(recordActivity).mockClear();
  });

  it("duplicates from template and emits template.used", async () => {
    const template = {
      id: TEMPLATE_ID,
      audit_id: AUDIT_ID,
      organization_id: TEST_UUIDS.organization,
      school_id: TEST_UUIDS.school,
      name: "Enrollment Agreement",
      description: "Standard",
      category: "enrollment",
      template_key: "enrollment_agreement",
      body_text: "Agreement body",
      file_url: null,
      mime_type: "text/plain",
      is_active: true,
      usage_count: 0,
    };

    const supabase = createMockSupabase(({ table, operation }) => {
      if (table === "platform_document_templates" && operation === "maybeSingle") {
        return { data: template, error: null };
      }
      if (table === "platform_document_templates" && operation === "update") {
        return { data: null, error: null };
      }
      if (
        table === "platform_documents" &&
        (operation === "insert" || operation === "single")
      ) {
        return {
          data: { id: DOC_ID, audit_id: AUDIT_ID, current_version: 1, status: "draft" },
          error: null,
        };
      }
      if (table === "platform_documents" && operation === "maybeSingle") {
        return {
          data: baseDoc({ template_id: TEMPLATE_ID, status: "draft" }),
          error: null,
        };
      }
      if (table === "platform_document_versions") {
        return { data: {}, error: null };
      }
      if (table === "platform_document_relations") {
        return { data: [], error: null };
      }
      return { data: null, error: null };
    });

    const result = await duplicateFromTemplate(supabase as never, TEMPLATE_ID, {
      schoolId: TEST_UUIDS.school,
    });
    expect(result.ok).toBe(true);
    expect(
      vi.mocked(recordActivity).mock.calls.some((c) => c[1]?.eventType === "template.used")
    ).toBe(true);
  });
});

describe("e-signature extension", () => {
  it("registers deferred providers and returns deferred result", async () => {
    ensureEsignExtensionsRegistered();
    expect(getExtension("docusign")).toBeTruthy();
    expect(getExtension("dropbox_sign")).toBeTruthy();
    expect(getExtension("adobe_sign")).toBeTruthy();

    const result = await requestSignature({
      documentId: DOC_ID,
      title: "Contract",
      organizationId: TEST_UUIDS.organization,
      schoolId: TEST_UUIDS.school,
    });
    expect(result.ok).toBe(true);
    expect(result.deferred).toBe(true);
  });
});

describe("workflow + EI catalog wiring", () => {
  it("registers required document EI events", () => {
    for (const key of [
      "document.created",
      "document.updated",
      "document.versioned",
      "document.archived",
      "document.deleted",
      "document.restored",
      "document.uploaded",
      "template.used",
      "signature.requested",
    ]) {
      expect(ACTIVITY_EVENT_CATALOG[key]).toBeTruthy();
    }
  });

  it("exposes document workflow actions", () => {
    const types = WORKFLOW_ACTION_LIBRARY.map((a) => a.type);
    expect(types).toContain("create_document");
    expect(types).toContain("generate_document");
    expect(types).toContain("request_document_upload");
    expect(types).toContain("approve_document");
    expect(types).toContain("reject_document");
    expect(types).toContain("archive_document");
    expect(types).toContain("route_document_for_review");
  });
});
