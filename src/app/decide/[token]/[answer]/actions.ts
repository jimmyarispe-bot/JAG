"use server";

import { redirect } from "next/navigation";

import { answerDecisionByLink } from "@/lib/admissions/gates/answer-by-link";

/**
 * One press, and a redirect so a refresh cannot press it again. The gate is
 * claimed before anything is sent, so even a second press that got through
 * would send nothing - but a refresh that resubmits is the commonest double
 * press there is.
 */
export async function answerDecisionAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const answer = String(formData.get("answer") ?? "");
  const base = `/decide/${encodeURIComponent(token)}/${encodeURIComponent(answer)}`;

  const result = await answerDecisionByLink({ token, answer });

  if ("error" in result) {
    redirect(`${base}?problem=1&why=${encodeURIComponent(result.error)}`);
  }
  redirect(
    `${base}?done=1` + (result.warning ? `&warning=${encodeURIComponent(result.warning)}` : "")
  );
}
