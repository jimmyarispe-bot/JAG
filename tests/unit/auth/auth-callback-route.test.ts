import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";
import { PASSWORD_RESET_PATH } from "@/lib/auth/must-reset-password";

const exchangeCodeForSession = vi.fn();
const verifyOtp = vi.fn();
const cookieSets: Array<{ name: string; value: string }> = [];

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      exchangeCodeForSession,
      verifyOtp,
    },
  }),
}));

import { GET } from "@/app/auth/callback/route";

function inviteUser(): User {
  return {
    id: "invitee",
    user_metadata: { must_reset_password: true },
  } as User;
}

describe("GET /auth/callback", () => {
  beforeEach(() => {
    cookieSets.length = 0;
    exchangeCodeForSession.mockReset();
    verifyOtp.mockReset();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  it("exchanges invite token_hash and redirects to password creation", async () => {
    verifyOtp.mockResolvedValue({
      data: { user: inviteUser() },
      error: null,
    });

    const request = new Request(
      "https://app.example.com/auth/callback?token_hash=tok&type=invite"
    ) as unknown as import("next/server").NextRequest;
    Object.defineProperty(request, "cookies", {
      value: {
        getAll: () => [],
        set: (name: string, value: string) => {
          cookieSets.push({ name, value });
        },
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(307);
    const location = response.headers.get("location") ?? "";
    expect(location).toContain(PASSWORD_RESET_PATH);
    expect(location).toContain("next=%2Fdashboard");
    expect(verifyOtp).toHaveBeenCalledWith({
      type: "invite",
      token_hash: "tok",
    });
  });

  it("redirects to login when auth params are missing", async () => {
    const request = new Request(
      "https://app.example.com/auth/callback"
    ) as unknown as import("next/server").NextRequest;
    Object.defineProperty(request, "cookies", {
      value: { getAll: () => [], set: vi.fn() },
    });

    const response = await GET(request);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain(
      "/login?error=auth_callback_failed"
    );
  });
});
