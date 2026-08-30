import { createAnonServerClient } from "@/lib/supabase/server";
import type { RequestedFields } from "@/lib/people/completeness-shared";

/**
 * The parent-facing side of an information request.
 *
 * Uses the anonymous client deliberately — a parent has no account and must not
 * need one. Everything goes through the two SECURITY DEFINER functions in
 * migration 230, which fail closed and never hand back a family id, a school
 * id, or anything that would let a caller go looking for someone else's child.
 */

/**
 * The generated `database.ts` was last refreshed at migration 193 and does not
 * know these functions exist, so the typed client rejects the name. Casting the
 * rpc call is the narrowest way through — the alternative is regenerating types
 * for the whole schema as a side effect of this feature.
 */
type RpcCaller = { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }> };

export type ParentInfoView =
  | { readonly state: "open"; readonly school: string; readonly family: string;
      readonly requested: RequestedFields; readonly expiresAt: string }
  | { readonly state: "completed" }
  | { readonly state: "invalid" }
  | { readonly state: "expired" }
  | { readonly state: "closed" };

/** Postgres error text is for us, not for a parent. */
function classify(error: unknown): ParentInfoView {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (message.includes("parent_info_link_expired")) return { state: "expired" };
  if (message.includes("parent_info_link_closed")) return { state: "closed" };
  return { state: "invalid" };
}

export async function resolveParentInfoRequest(token: string): Promise<ParentInfoView> {
  try {
    const supabase = createAnonServerClient() as unknown as RpcCaller;
    const { data, error } = await supabase.rpc("resolve_parent_info_request", {
      p_token: token,
    });
    if (error) return classify(new Error(error.message));

    const payload = data as Record<string, unknown> | null;
    if (!payload) return { state: "invalid" };
    if (payload.status === "completed") return { state: "completed" };

    return {
      state: "open",
      school: String(payload.school ?? ""),
      family: String(payload.family ?? ""),
      requested: (payload.requested ?? { students: [], family: [] }) as RequestedFields,
      expiresAt: String(payload.expires_at ?? ""),
    };
  } catch (e) {
    return classify(e);
  }
}
