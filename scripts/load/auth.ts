/**
 * RC-2 — optional authenticated session for load tests.
 * Uses password grant against Supabase when credentials are provided.
 */

import type { AuthHeaders } from "./http";

export type LoadAuthConfig = {
  configured: boolean;
  headers: AuthHeaders;
  notes: string[];
};

/**
 * Resolve auth for protected routes.
 * Env:
 *  - LOAD_TEST_COOKIE — raw Cookie header (preferred for staging)
 *  - LOAD_TEST_EMAIL + LOAD_TEST_PASSWORD + NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
export async function resolveLoadAuth(): Promise<LoadAuthConfig> {
  const notes: string[] = [];
  const cookie = process.env.LOAD_TEST_COOKIE?.trim();
  if (cookie) {
    return { configured: true, headers: { cookie }, notes: ["Using LOAD_TEST_COOKIE"] };
  }

  const email = process.env.LOAD_TEST_EMAIL?.trim();
  const password = process.env.LOAD_TEST_PASSWORD?.trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!email || !password || !url || !anon) {
    notes.push(
      "No LOAD_TEST_COOKIE / LOAD_TEST_EMAIL credentials — protected routes measured as auth-gate (302/401)."
    );
    return { configured: false, headers: {}, notes };
  }

  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        apikey: anon,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      notes.push(`Supabase password grant failed HTTP ${res.status}`);
      return { configured: false, headers: {}, notes };
    }
    const json = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
    };
    if (!json.access_token) {
      notes.push("Password grant returned no access_token");
      return { configured: false, headers: {}, notes };
    }
    // Next/Supabase SSR typically uses chunked cookies; bearer works for some APIs.
    // For pages, set sb access token cookie best-effort.
    const cookieHeader = [
      `sb-access-token=${json.access_token}`,
      json.refresh_token ? `sb-refresh-token=${json.refresh_token}` : null,
    ]
      .filter(Boolean)
      .join("; ");
    notes.push("Authenticated via Supabase password grant (best-effort cookies)");
    return {
      configured: true,
      headers: {
        cookie: cookieHeader,
        authorization: `Bearer ${json.access_token}`,
      },
      notes,
    };
  } catch (error) {
    notes.push(
      `Auth setup error: ${error instanceof Error ? error.message : String(error)}`
    );
    return { configured: false, headers: {}, notes };
  }
}
