"use server";

import { redirect } from "next/navigation";

import {
  isPostCallAction,
  recordPostCallDecision,
} from "@/lib/admissions/automation/post-call";

/**
 * One action, one decision, and a redirect so a refresh cannot do it twice.
 *
 * THE DOUBLE-SUBMIT GUARD MATTERS HERE for the same reason as on
 * /application-call/<token>: one of these buttons mails a family. Sending a
 * parent the same "come and see the school" letter twice in a minute is the
 * kind of thing they notice and a school leader is blamed for.
 *
 * THE FAILURE IS CARRIED, NOT FLATTENED. The other two button pages redirect
 * to ?problem=save and print one fixed sentence, which is fine when the only
 * way to fail is a database refusal. This page has a second way: the campus
 * has no tour link, and the message says which campus and where to set it.
 * Throwing that away and printing "that did not save" would leave a school
 * leader with no idea what to do next.
 */
export async function recordPostCallAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const action = String(formData.get("action") ?? "");
  const notes = String(formData.get("notes") ?? "");

  if (!isPostCallAction(action)) {
    redirect(`/post-call/${encodeURIComponent(token)}?problem=choose`);
  }

  const result = await recordPostCallDecision({ token, action, notes });

  if ("error" in result) {
    redirect(
      `/post-call/${encodeURIComponent(token)}?problem=save&why=${encodeURIComponent(result.error)}`
    );
  }

  /*
   * THE WARNING TRAVELS WITH THE SUCCESS. Added 14 October 2026.
   *
   * An acceptance can succeed and still leave no enrollment packet - no
   * application row to build one from, or a generator that failed. The decision
   * is real either way, so this is a `done`, not a `problem`; but the page has
   * to be able to say what is missing instead of printing "the enrollment
   * packet has been built" at a school leader who has nothing to send.
   *
   * Carried in the query string for the same reason `why` already is: these
   * pages are a redirect away from their own result and hold no state.
   */
  const warning = "warning" in result && result.warning ? result.warning : null;

  redirect(
    `/post-call/${encodeURIComponent(token)}?done=${encodeURIComponent(result.action)}` +
      (warning ? `&warning=${encodeURIComponent(warning)}` : "")
  );
}
