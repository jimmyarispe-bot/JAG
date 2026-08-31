"use server";

import { revalidatePath } from "next/cache";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { canManageStudentLifecycle } from "@/lib/students/lifecycle";
import {
  validateSchoolContact,
  type SchoolContactPatch,
} from "@/lib/admissions/school-contacts-shared";

/**
 * Set a school's admissions contact and booking link.
 *
 * Gated to CEO / Founder / School Leader — the same bar as archiving a student.
 * This decides who receives prospective families' details and what address a
 * parent's reply reaches, so it is not an ordinary edit.
 */

export type ContactSaveResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

function text(value: unknown): string | null {
  const v = typeof value === "string" ? value.trim() : "";
  return v ? v : null;
}

export async function updateSchoolAdmissionsContact(input: {
  schoolId: string;
  patch: SchoolContactPatch;
}): Promise<ContactSaveResult> {
  const identity = await getIdentityContext();
  if (!identity) return { ok: false, error: "Not signed in" };
  if (!canManageStudentLifecycle(identity)) {
    return {
      ok: false,
      error: "Only a CEO, Founder or School Leader can change an admissions contact.",
    };
  }
  if (!input.schoolId) return { ok: false, error: "No school given" };

  const patch: SchoolContactPatch = {
    contactName: text(input.patch.contactName),
    contactEmail: text(input.patch.contactEmail)?.toLowerCase() ?? null,
    bookingUrl: text(input.patch.bookingUrl),
    publicInquiries: input.patch.publicInquiries === true,
  };

  // The same function the editor runs. A hand-made request gets the same answer
  // as the form, which is the point of sharing it.
  const issues = validateSchoolContact(patch);
  // The "public but no email" case is a warning in the editor and must not
  // block a deliberate save; anything else is a refusal.
  const blocking = issues.filter(
    (i) => !(i.field === "contactEmail" && patch.publicInquiries && !patch.contactEmail)
  );
  if (blocking.length) {
    return { ok: false, error: blocking.map((i) => i.message).join(" ") };
  }

  const supabase = await createAuthClient();

  // .select() so a row filtered out by RLS reads as a failure rather than a
  // success that wrote nothing — this codebase's most repeated bug.
  const { data, error } = await supabase
    .from("schools")
    .update({
      admissions_contact_name: patch.contactName,
      admissions_contact_email: patch.contactEmail,
      admissions_booking_url: patch.bookingUrl,
      admissions_interest_public: patch.publicInquiries,
    })
    .eq("id", input.schoolId)
    .select("id, name");

  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) {
    return {
      ok: false,
      error: "Nothing was saved — that school is not visible to you, or no longer exists.",
    };
  }

  revalidatePath("/dashboard/admin/admissions-contacts");
  revalidatePath("/apply");

  const name = (data[0] as Record<string, unknown>).name ?? "School";
  return { ok: true, message: `${name} saved.` };
}
