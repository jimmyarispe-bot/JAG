"use server";

import { redirect } from "next/navigation";

import { sendInterestMeetingLink } from "@/lib/admissions/send-interest-link";

/**
 * One button, one letter, and a redirect so a refresh cannot send it twice.
 *
 * The double-send guard is also on the other side, because two people can
 * open the same notice at the same moment and a family receiving the same
 * letter twice is the kind of thing they mention to the leader.
 */
export async function sendInterestLinkAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");

  const result = await sendInterestMeetingLink(token);

  if ("error" in result) {
    redirect(`/send-interest-link/${encodeURIComponent(token)}?problem=1`);
  }

  redirect(`/send-interest-link/${encodeURIComponent(token)}?sent=1`);
}
