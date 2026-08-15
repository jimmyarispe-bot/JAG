/**
 * Phase 2 — upload/download route authorization.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { JagPlatformSession } from "@/lib/jag-platform/session";

const ORG_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ORG_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

vi.mock("@/lib/jag-platform/server-session", () => ({
  getJagPlatformSession: vi.fn(),
}));

vi.mock("@/lib/evidence-center/upload-deps", () => ({
  createJagEvidenceUploadDeps: vi.fn(() => ({
    db: {},
    storage: {},
  })),
}));

vi.mock("@/lib/evidence-center/upload-service", () => ({
  authorizeEvidenceUpload: vi.fn(),
  completeEvidenceUpload: vi.fn(),
  createEvidenceDownloadUrl: vi.fn(),
}));

vi.mock("@/lib/evidence-center/durable-repository", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/evidence-center/durable-repository")>();
  return {
    ...actual,
    getDurableDocument: vi.fn(),
  };
});

vi.mock("@/lib/jag-platform/org-context", () => ({
  sessionCanAccessOrganization: (
    session: JagPlatformSession,
    organizationId: string
  ) => session.organizationId === organizationId,
}));

import { getJagPlatformSession } from "@/lib/jag-platform/server-session";
import {
  authorizeEvidenceUpload,
  completeEvidenceUpload,
  createEvidenceDownloadUrl,
} from "@/lib/evidence-center/upload-service";
import { getDurableDocument } from "@/lib/evidence-center/durable-repository";
import { POST as authorizePost } from "@/app/api/jag-platform/evidence/uploads/authorize/route";
import { POST as completePost } from "@/app/api/jag-platform/evidence/uploads/complete/route";
import { GET as downloadGet } from "@/app/api/jag-platform/evidence/documents/[documentId]/download/route";

const mockSession = vi.mocked(getJagPlatformSession);
const mockAuthorize = vi.mocked(authorizeEvidenceUpload);
const mockComplete = vi.mocked(completeEvidenceUpload);
const mockDownload = vi.mocked(createEvidenceDownloadUrl);
const mockGetDoc = vi.mocked(getDurableDocument);

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

describe("Phase 2 upload routes — authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("authorize rejects unauthenticated callers", async () => {
    mockSession.mockResolvedValue(null);
    const response = await authorizePost(
      new Request("http://localhost/api", {
        method: "POST",
        body: JSON.stringify({ organizationId: ORG_A, filename: "a.pdf" }),
      })
    );
    expect(response.status).toBe(401);
    expect(mockAuthorize).not.toHaveBeenCalled();
  });

  it("authorize rejects other-organization requests", async () => {
    mockSession.mockResolvedValue(sessionFor(ORG_A));
    const response = await authorizePost(
      new Request("http://localhost/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: ORG_B,
          filename: "a.pdf",
          mimeType: "application/pdf",
          byteSize: 10,
        }),
      })
    );
    expect(response.status).toBe(403);
    expect(mockAuthorize).not.toHaveBeenCalled();
  });

  it("authorize allows same-organization requests", async () => {
    mockSession.mockResolvedValue(sessionFor(ORG_A));
    mockAuthorize.mockResolvedValue({
      ok: true,
      documentId: "d",
      versionId: "v",
      versionNumber: 1,
      path: `org/${ORG_A}/documents/d/versions/v/a.pdf`,
      bucket: "jag-evidence-documents",
      signedUrl: "https://example.test/up",
      mimeType: "application/pdf",
      byteSize: 10,
      safeFilename: "a.pdf",
    });
    const response = await authorizePost(
      new Request("http://localhost/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: ORG_A,
          filename: "a.pdf",
          mimeType: "application/pdf",
          byteSize: 10,
        }),
      })
    );
    expect(response.status).toBe(200);
    expect(mockAuthorize).toHaveBeenCalledOnce();
  });

  it("complete rejects other-organization requests", async () => {
    mockSession.mockResolvedValue(sessionFor(ORG_A));
    const response = await completePost(
      new Request("http://localhost/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: ORG_B,
          documentId: "d",
          versionId: "v",
        }),
      })
    );
    expect(response.status).toBe(403);
    expect(mockComplete).not.toHaveBeenCalled();
  });

  it("download rejects other-organization requests", async () => {
    mockSession.mockResolvedValue(sessionFor(ORG_A));
    const response = await downloadGet(
      new Request(
        `http://localhost/api/jag-platform/evidence/documents/doc/download?organizationId=${ORG_B}`
      ),
      { params: Promise.resolve({ documentId: "doc" }) }
    );
    expect(response.status).toBe(403);
    expect(mockGetDoc).not.toHaveBeenCalled();
    expect(mockDownload).not.toHaveBeenCalled();
  });

  it("download requires document ownership in authorized org", async () => {
    mockSession.mockResolvedValue(sessionFor(ORG_A));
    mockGetDoc.mockResolvedValue(null);
    const response = await downloadGet(
      new Request(
        `http://localhost/api/jag-platform/evidence/documents/doc/download?organizationId=${ORG_A}`,
        { headers: { Accept: "application/json" } }
      ),
      { params: Promise.resolve({ documentId: "doc" }) }
    );
    expect(response.status).toBe(404);
    expect(mockDownload).not.toHaveBeenCalled();
  });
});
