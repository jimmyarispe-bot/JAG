"use server";

import { redirect } from "next/navigation";

import {
  readAcknowledgement,
  readSubmission,
  submitBackgroundCheck,
} from "@/lib/employees/background-check";

/**
 * One form, one submission, one redirect.
 *
 * THE PROBLEMS GO IN THE URL AND THE ANSWERS DO NOT. A new hire's SSN must
 * never reach a query string - it would be in their browser history, in any
 * proxy log, and in the Referer header of the next request. So a failed
 * submission redirects with the MESSAGES only and the form comes back empty.
 *
 * That costs them retyping, and it is the right trade. The alternative is a
 * social security number sitting in a URL.
 *
 * `redirect()` is called outside any try/catch on purpose: inside one, the
 * NEXT_REDIRECT it throws is swallowed and the button appears to do nothing -
 * which is exactly the fault we spent 5 October chasing on the admissions
 * send-interest-link page.
 */
export async function submitBackgroundCheckAction(formData: FormData) {
  const input = readSubmission(formData);
  const acknowledgement = readAcknowledgement(formData);
  const result = await submitBackgroundCheck(input, acknowledgement);

  if ("problems" in result) {
    const params = new URLSearchParams();
    for (const problem of result.problems) params.append("problem", problem);
    redirect(`/background-check?${params.toString()}`);
  }

  redirect("/background-check?done=1");
}
