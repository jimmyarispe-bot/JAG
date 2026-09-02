/**
 * The three scheduling pages created a lead and then told the family it failed.
 *
 * /admissions/schedule-tour, /discovery-call and /assessment all funnel into
 * submitPublicInquiry. The RPC that creates the lead is SECURITY DEFINER, so it
 * succeeded; the two calls after it ran as the anonymous visitor, RLS hid the new
 * row, and the merge-context loader threw "Lead not found". The parent saw that.
 *
 * These tests pin the two properties that make that impossible to reintroduce:
 * the post-RPC work runs as the service role, and a notification failure never
 * turns a successful submission into a reported error.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

const recordInitialStage = vi.fn();
const onInquirySubmitted = vi.fn();
const createServiceRoleClient = vi.fn();
const createAuthClient = vi.fn();
const rpc = vi.fn();

const ANON = { __kind: "anon" } as const;
const ADMIN = { __kind: "service-role" } as const;

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ headers: async () => new Map() }));

vi.mock("@/lib/supabase/server-auth", () => ({
  createAuthClient: () => createAuthClient(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createServiceRoleClient: () => createServiceRoleClient(),
}));
vi.mock("@/lib/admissions/workflow", () => ({
  recordInitialStage: (...args: unknown[]) => recordInitialStage(...args),
}));
vi.mock("@/lib/admissions/communications/triggers", () => ({
  onInquirySubmitted: (...args: unknown[]) => onInquirySubmitted(...args),
  onApplicationStarted: vi.fn(),
  onApplicationSubmitted: vi.fn(),
  onDocumentUploaded: vi.fn(),
  onFinancialAidSubmitted: vi.fn(),
  onFundingVerificationDecision: vi.fn(),
}));
vi.mock("@/lib/platform/api-rate-limit", () => ({
  checkRateLimitAsync: async () => ({ ok: true }),
  getClientIpFromHeaders: () => "127.0.0.1",
}));
vi.mock("@/lib/funding/helpers", () => ({ parseFundingSourcesFromForm: () => [] }));

async function loadAction() {
  const mod = await import("@/lib/admissions/portal/actions");
  return mod.submitPublicInquiry;
}

function inquiryForm(): FormData {
  const fd = new FormData();
  fd.set("school_id", "school-1");
  fd.set("first_name", "Konnor");
  fd.set("last_name", "Broyld");
  fd.set("guardian_email", "dennisjbroyldjr@gmail.com");
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  rpc.mockResolvedValue({ data: "lead-123", error: null });
  createAuthClient.mockResolvedValue({ ...ANON, rpc });
  createServiceRoleClient.mockReturnValue(ADMIN);
  recordInitialStage.mockResolvedValue(undefined);
  onInquirySubmitted.mockResolvedValue(undefined);
});

describe("submitPublicInquiry", () => {
  it("runs the post-RPC work as the service role, not as the anonymous visitor", async () => {
    const submitPublicInquiry = await loadAction();
    const result = await submitPublicInquiry(inquiryForm());

    expect(result).toEqual({ leadId: "lead-123" });

    // The whole defect in one assertion: these used to receive the anon client,
    // which cannot see the row the RPC just created.
    expect(recordInitialStage).toHaveBeenCalledWith(ADMIN, "lead-123", null);
    expect(onInquirySubmitted).toHaveBeenCalledWith(ADMIN, "lead-123");
  });

  it("still returns the lead when notification fails — the family did submit", async () => {
    onInquirySubmitted.mockRejectedValue(new Error("Lead not found"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const submitPublicInquiry = await loadAction();
    const result = await submitPublicInquiry(inquiryForm());

    // Previously this threw and the parent was told their request failed, after
    // it had already been recorded.
    expect(result).toEqual({ leadId: "lead-123" });
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("still reports a real failure when the lead itself was not created", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "school_id does not exist" } });

    const submitPublicInquiry = await loadAction();
    const result = await submitPublicInquiry(inquiryForm());

    expect(result).toEqual({ error: "school_id does not exist" });
    expect(onInquirySubmitted).not.toHaveBeenCalled();
  });

  it("rejects a honeypot submission without creating anything", async () => {
    const fd = inquiryForm();
    fd.set("company_website", "http://spam.example");

    const submitPublicInquiry = await loadAction();
    const result = await submitPublicInquiry(fd);

    expect(result).toEqual({ error: "Unable to submit inquiry." });
    expect(rpc).not.toHaveBeenCalled();
  });
});
