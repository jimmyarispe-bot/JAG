"use server";

import { revalidatePath } from "next/cache";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { canImportStudents } from "@/lib/platform/imports/access";
import { PERSON_GROUPS, type PersonGroup, type PersonKind } from "@/lib/people/directory-shared";

/**
 * Set or clear one person's directory category.
 *
 * Passing null clears the override and returns the person to whatever their
 * status implies. Nothing here changes the underlying record — a withdrawn
 * student stays withdrawn; only how they are filed in the directory changes.
 */
export async function setPersonGroup(input: {
  kind: PersonKind;
  personId: string;
  group: PersonGroup | null;
}) {
  const identity = await getIdentityContext();
  if (!identity) return { ok: false as const, error: "Not signed in" };
  if (!canImportStudents(identity)) {
    return { ok: false as const, error: "You do not have access to change this" };
  }

  if (input.kind !== "student" && input.kind !== "prospect") {
    return { ok: false as const, error: "Unknown person type" };
  }
  if (input.group !== null && !PERSON_GROUPS.includes(input.group)) {
    return { ok: false as const, error: "Unknown category" };
  }

  const supabase = await createAuthClient();

  if (input.group === null) {
    const { error } = await supabase
      .from("person_directory_overrides")
      .delete()
      .eq("person_kind", input.kind)
      .eq("person_id", input.personId);
    if (error) return { ok: false as const, error: error.message };
    revalidatePath("/dashboard/people");
    return { ok: true as const, cleared: true };
  }

  const { data: session } = await supabase.auth.getUser();

  const { error } = await supabase.from("person_directory_overrides").upsert(
    {
      person_kind: input.kind,
      person_id: input.personId,
      group_key: input.group,
      set_by: session.user?.id ?? null,
      set_at: new Date().toISOString(),
    },
    { onConflict: "person_kind,person_id" }
  );

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/dashboard/people");
  return { ok: true as const, cleared: false };
}
