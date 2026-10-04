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

  redirect(
    `/post-call/${encodeURIComponent(token)}?done=${encodeURIComponent(result.action)}`
  );
}
