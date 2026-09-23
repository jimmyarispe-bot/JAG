"use server";

/**
 * The two things a family can do from their application link.
 *
 * No permission check, and no session: the token IS the authority, and it is
 * checked inside token-access.ts where the lead is resolved. A second check
 * here would be a second answer to the same question, and the two would
 * eventually disagree.
 *
 * Neither action accepts a lead id, an application id or a school id. Both
 * take the token and the posted fields, and the fields are filtered to the
 * parent-writable list inside token-access.ts rather than trusted here.
 */

import {
  saveApplicationByToken,
  submitApplicationByToken,
} from "@/lib/admissions/apply-link/token-access";

function fieldsFrom(formData: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (key === "token") continue;
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

export async function saveApplicationDraftAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  return saveApplicationByToken(token, fieldsFrom(formData));
}

export async function submitApplicationAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  return submitApplicationByToken(token, fieldsFrom(formData));
}
