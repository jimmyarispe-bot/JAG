"use server";

import { createAnonServerClient } from "@/lib/supabase/server";

/**
 * The generated `database.ts` was last refreshed at migration 193 and does not
 * know these functions exist, so the typed client rejects the name. Casting the
 * rpc call is the narrowest way through — the alternative is regenerating types
 * for the whole schema as a side effect of this feature.
 */
type RpcCaller = { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }> };

/**
 * A parent submitting their answers. No session, by design.
 *
 * The database function decides what is acceptable: it applies only the fields
 * the request asked for, and only to children in that family. Nothing here is
 * trusted to get that right, because this runs for anyone holding the link.
 */
export async function submitParentInfo(input: {
  token: string;
  answers: { studentId?: string | null; field: string; value: string }[];
}): Promise<{ ok: true; applied: number } | { ok: false; error: string }> {
  const answers = input.answers
    .filter((a) => a.value && a.value.trim())
    .map((a) => ({
      student_id: a.studentId ?? null,
      field: a.field,
      value: a.value.trim(),
    }));

  if (!answers.length) {
    return { ok: false, error: "Nothing filled in yet." };
  }

  const supabase = createAnonServerClient() as unknown as RpcCaller;
  const { data, error } = await supabase.rpc("submit_parent_info", {
    p_token: input.token,
    p_answers: answers,
  });

  if (error) {
    const message = error.message ?? "";
    if (message.includes("parent_info_link_expired")) {
      return { ok: false, error: "This link has expired. Please contact the school." };
    }
    if (message.includes("parent_info_link_closed")) {
      return { ok: false, error: "These details have already been sent in. Thank you." };
    }
    if (message.includes("parent_info_token_invalid")) {
      return { ok: false, error: "This link is not valid. Please check the email again." };
    }
    return { ok: false, error: "Something went wrong saving that. Please try again." };
  }

  const applied = Number((data as Record<string, unknown> | null)?.applied ?? 0);
  return { ok: true, applied };
}
