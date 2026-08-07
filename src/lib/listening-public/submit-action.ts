"use server";

import { createAnonServerClient } from "@/lib/supabase/server";
import {
  classifyListeningPublicError,
  submitPublicListeningResponse,
  type ListeningSubmitAnswerInput,
} from "@/lib/platform/listening";

export type SubmitListeningActionResult =
  | { readonly ok: true; readonly submittedAt: string }
  | { readonly ok: false; readonly error: string; readonly kind: string };

/**
 * Public submit — anon client + SECURITY DEFINER RPC.
 * Never returns response_id to the client UI.
 */
export async function submitListeningResponseAction(input: {
  readonly token: string;
  readonly answers: readonly ListeningSubmitAnswerInput[];
}): Promise<SubmitListeningActionResult> {
  try {
    const supabase = createAnonServerClient();
    const result = await submitPublicListeningResponse(
      supabase,
      input.token,
      input.answers
    );
    return {
      ok: true,
      submittedAt: result.submitted_at,
    };
  } catch (e) {
    const view = classifyListeningPublicError(e);
    return { ok: false, error: view.description, kind: view.kind };
  }
}
