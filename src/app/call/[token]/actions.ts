"use server";

import { redirect } from "next/navigation";

import {
  isCallOutcome,
  recordCallOutcome,
} from "@/lib/admissions/chase/call-token";

/**
 * One action, one row, and a redirect so a refresh cannot file the call twice.
 *
 * THE TOKEN COMES FROM THE FORM AND IS VALIDATED AGAIN IN recordCallOutcome.
 * It arrived in the page's URL, so it is not a secret the browser is being
 * trusted with for the first time - but it is still input, and the 64-hex
 * check happens on this side of the wire before any column is queried.
 */
export async function recordCallAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const outcome = String(formData.get("outcome") ?? "");
  const notes = String(formData.get("notes") ?? "");

  if (!isCallOutcome(outcome)) {
    redirect(`/call/${encodeURIComponent(token)}?problem=choose`);
  }

  const result = await recordCallOutcome({ token, outcome, notes });

  if ("error" in result) {
    redirect(`/call/${encodeURIComponent(token)}?problem=save`);
  }

  /*
   * POST then redirect. Without it, a school leader who refreshes the page -
   * or whose phone restores the tab an hour later - files a second call that
   * never happened, and the next person to read the record believes the
   * family was telephoned twice.
   */
  redirect(`/call/${encodeURIComponent(token)}?recorded=1`);
}
