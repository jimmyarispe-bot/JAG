"use server";

import { redirect } from "next/navigation";

import {
  isApplicationCallAction,
  recordApplicationCallDecision,
} from "@/lib/admissions/automation/application-call";

/**
 * One action, one decision, and a redirect so a refresh cannot do it twice.
 *
 * THE REDIRECT MATTERS MORE HERE THAN IT DOES ON /call/<token>. There, a
 * double submit files a telephone call that did not happen. Here it mails a
 * family the same invitation twice, which is the kind of thing a parent
 * notices and a school leader is blamed for.
 *
 * THE TOKEN COMES FROM THE FORM AND IS VALIDATED AGAIN on the other side. It
 * arrived in the page's URL so it is not a new secret, but it is still input,
 * and the 64-hex check happens before any column is queried with it.
 */
export async function recordApplicationCallAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const action = String(formData.get("action") ?? "");
  const notes = String(formData.get("notes") ?? "");

  if (!isApplicationCallAction(action)) {
    redirect(`/application-call/${encodeURIComponent(token)}?problem=choose`);
  }

  const result = await recordApplicationCallDecision({ token, action, notes });

  if ("error" in result) {
    redirect(`/application-call/${encodeURIComponent(token)}?problem=save`);
  }

  redirect(
    `/application-call/${encodeURIComponent(token)}?done=${encodeURIComponent(result.action)}`
  );
}
