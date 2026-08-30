"use server";

import { revalidatePath } from "next/cache";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { canImportStudents } from "@/lib/platform/imports/access";
import {
  archiveStudent,
  canManageStudentLifecycle,
  deleteStudent,
  restoreStudent,
} from "@/lib/students/lifecycle";
import { ADDRESS_FIELDS, type PersonKind, type PersonPatch } from "@/lib/people/directory-shared";

/**
 * Edit, archive and delete from the People directory.
 *
 * Two gates, deliberately different:
 *
 *   editing            canImportStudents -- the same bar as the bulk importer,
 *                      which can already create these records wholesale. Anyone
 *                      who may import may correct.
 *   archive / delete   canManageStudentLifecycle -- CEO, Founder or School
 *                      Leader only. Established for students in RC1; leads now
 *                      follow the same rule rather than inventing a looser one.
 *
 * Students reuse the existing lifecycle service, including its dependency check
 * and its typed-DELETE guard. Leads had no lifecycle at all, so the equivalent
 * is here, built to the same shape.
 */

export type PeopleResult =
  | { ok: true; changed: number; message: string }
  | {
      ok: false;
      error: string;
      code?: "forbidden" | "not_found" | "has_dependencies" | "confirmation_required" | "failed";
      /** Named so the user can act on it, rather than a bare count. */
      blocked?: { id: string; name: string; reason: string }[];
    };

/**
 * `label` is the person's name, carried from the table so a partial failure
 * can say who. Optional because it is display only — the id is what is written
 * against — and it falls back to the id when absent.
 */
type Target = { kind: PersonKind; id: string; label?: string };

const named = (t: Target) => t.label?.trim() || t.id;

function text(value: unknown): string | null {
  const v = typeof value === "string" ? value.trim() : "";
  return v ? v : null;
}

/** "Katie Allen" -> first "Katie", last "Allen". A single word is the surname. */
function splitName(full: string | null): { first: string | null; last: string | null } {
  if (!full) return { first: null, last: null };
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { first: null, last: parts[0] };
  return { first: parts.slice(0, -1).join(" "), last: parts[parts.length - 1] };
}

function revalidate() {
  revalidatePath("/dashboard/people");
  revalidatePath("/dashboard/students");
  revalidatePath("/dashboard/admissions");
}

async function requireEdit() {
  const identity = await getIdentityContext();
  if (!identity) return { ok: false as const, error: "Not signed in" };
  if (!canImportStudents(identity)) {
    return { ok: false as const, error: "You do not have access to change these records" };
  }
  return { ok: true as const, identity };
}

async function requireLifecycle() {
  const identity = await getIdentityContext();
  if (!identity) return { ok: false as const, error: "Not signed in" };
  if (!canManageStudentLifecycle(identity)) {
    return {
      ok: false as const,
      error: "Only a CEO, Founder or School Leader can archive or delete records.",
    };
  }
  return { ok: true as const, identity };
}

/* ------------------------------------------------------------------ edit -- */

/**
 * Parent contact on a student does not live on the student.
 *
 * It goes to `families.billing_email` / `billing_phone` and to the family's
 * primary `guardians` row, creating a family or a guardian if the chain does
 * not reach that far yet. This is the path that finally fills the `guardians`
 * table: the 27 Aug load put contact on families only, so every student still
 * reports its source as "family" until somebody edits them here.
 */
async function writeStudentContact(
  supabase: Awaited<ReturnType<typeof createAuthClient>>,
  studentId: string,
  patch: PersonPatch
): Promise<string | null> {
  /**
   * The address lives on the family too, so it takes the same path: it needs
   * the same "create the household if the chain does not reach that far"
   * handling, and splitting it into a second function would mean two writes
   * racing for the same family row.
   *
   * `state` and `zip_code` keep their column names; the labels are
   * "State / Province / Region" and "Postal code" because the roster is not
   * only American.
   */
  const addressColumns: Record<string, string> = {
    address: "primary_address",
    city: "city",
    region: "state",
    postalCode: "zip_code",
    country: "country",
  };

  const addressPatch: Record<string, unknown> = {};
  for (const field of ADDRESS_FIELDS) {
    if (patch[field] !== undefined) addressPatch[addressColumns[field]] = text(patch[field]);
  }

  const touchesContact =
    patch.guardianName !== undefined ||
    patch.guardianEmail !== undefined ||
    patch.guardianPhone !== undefined ||
    Object.keys(addressPatch).length > 0;
  if (!touchesContact) return null;

  const { data: student, error: readError } = await supabase
    .from("students")
    .select("id, school_id, last_name, family_id")
    .eq("id", studentId)
    .maybeSingle();
  if (readError) return readError.message;
  if (!student) return "Student not found";

  const name = splitName(patch.guardianName === undefined ? null : text(patch.guardianName));

  let familyId = student.family_id as string | null;
  if (!familyId) {
    const { data: created, error } = await supabase
      .from("families")
      .insert({
        school_id: student.school_id,
        family_name: name.last ? `${name.last} Family` : `${student.last_name} Family`,
        billing_email: patch.guardianEmail === undefined ? null : text(patch.guardianEmail),
        billing_phone: patch.guardianPhone === undefined ? null : text(patch.guardianPhone),
        ...addressPatch,
      })
      .select("id")
      .single();
    if (error) return error.message;
    familyId = created.id as string;

    const { error: linkError } = await supabase
      .from("students")
      .update({ family_id: familyId })
      .eq("id", studentId);
    if (linkError) return linkError.message;
  } else {
    const familyPatch: Record<string, unknown> = { ...addressPatch };
    if (patch.guardianEmail !== undefined) familyPatch.billing_email = text(patch.guardianEmail);
    if (patch.guardianPhone !== undefined) familyPatch.billing_phone = text(patch.guardianPhone);
    if (Object.keys(familyPatch).length) {
      // .select() so an RLS refusal reads as a failure rather than a success
      // that wrote nothing — the same trap this file already guards elsewhere.
      const { data, error } = await supabase
        .from("families")
        .update(familyPatch)
        .eq("id", familyId)
        .select("id");
      if (error) return error.message;
      if (!data || data.length === 0) {
        return "The household record could not be updated, or is not visible to you";
      }
    }
  }

  // One guardian per household is enough to be reachable. Prefer the row
  // already marked primary; otherwise take the first, otherwise create one.
  const { data: guardians, error: guardianReadError } = await supabase
    .from("guardians")
    .select("id, is_primary")
    .eq("family_id", familyId);
  if (guardianReadError) return guardianReadError.message;

  const existing =
    (guardians ?? []).find((g) => (g as Record<string, unknown>).is_primary === true) ??
    (guardians ?? [])[0];

  const guardianPatch: Record<string, unknown> = {};
  if (patch.guardianName !== undefined) {
    guardianPatch.first_name = name.first ?? "Guardian";
    guardianPatch.last_name = name.last ?? student.last_name;
  }
  if (patch.guardianEmail !== undefined) guardianPatch.email = text(patch.guardianEmail);
  if (patch.guardianPhone !== undefined) guardianPatch.phone = text(patch.guardianPhone);

  if (existing) {
    if (!Object.keys(guardianPatch).length) return null;
    const { error } = await supabase
      .from("guardians")
      .update(guardianPatch)
      .eq("id", (existing as Record<string, unknown>).id as string);
    return error ? error.message : null;
  }

  // Nothing to build a guardian out of yet -- the family row carries the
  // contact and a nameless guardian would only be noise.
  if (!guardianPatch.first_name && !guardianPatch.email && !guardianPatch.phone) return null;

  const { error } = await supabase.from("guardians").insert({
    family_id: familyId,
    first_name: (guardianPatch.first_name as string) ?? "Guardian",
    last_name: (guardianPatch.last_name as string) ?? student.last_name,
    email: (guardianPatch.email as string) ?? null,
    phone: (guardianPatch.phone as string) ?? null,
    relationship_to_student: "parent",
    is_primary: true,
    receives_billing: true,
    receives_communications: true,
  });
  return error ? error.message : null;
}

/**
 * Apply one patch to one or many people.
 *
 * Absent keys are left alone, which is what lets the bulk dialog send only the
 * fields the user deliberately set. Every row is attempted: one failure is
 * reported by name and does not abandon the rest, because stopping halfway
 * through a bulk edit leaves the user guessing which half landed.
 */
export async function updatePeople(input: {
  targets: Target[];
  patch: PersonPatch;
}): Promise<PeopleResult> {
  const gate = await requireEdit();
  if (!gate.ok) return { ok: false, error: gate.error, code: "forbidden" };
  if (!input.targets.length) return { ok: false, error: "Nobody selected", code: "not_found" };

  const supabase = await createAuthClient();
  const patch = input.patch;
  const blocked: { id: string; name: string; reason: string }[] = [];
  let changed = 0;

  const touchesAddress = ADDRESS_FIELDS.some((field) => patch[field] !== undefined);

  for (const target of input.targets) {
    // A lead has no household record, and admissions_leads has no address
    // columns. Refusing loudly beats writing the rest of the patch and leaving
    // the user to notice on their own that the address never landed.
    if (touchesAddress && target.kind !== "student") {
      blocked.push({
        id: target.id,
        name: named(target),
        reason:
          "An address belongs to a household, and a prospect has none yet. Convert them to a student first.",
      });
      continue;
    }

    const row: Record<string, unknown> = {};
    if (patch.firstName !== undefined) row.first_name = patch.firstName.trim();
    if (patch.lastName !== undefined) row.last_name = patch.lastName.trim();
    if (patch.schoolId !== undefined) row.school_id = patch.schoolId;
    if (patch.dateOfBirth !== undefined) row.date_of_birth = text(patch.dateOfBirth);

    if (target.kind === "student") {
      if (patch.grade !== undefined) row.grade_level = text(patch.grade);
      if (patch.status !== undefined) row.enrollment_status = patch.status;
    } else {
      if (patch.grade !== undefined) row.current_grade = text(patch.grade);
      if (patch.status !== undefined) row.lead_stage = patch.status;
      if (patch.guardianEmail !== undefined) row.guardian_email = text(patch.guardianEmail);
      if (patch.guardianPhone !== undefined) row.guardian_phone = text(patch.guardianPhone);
      if (patch.guardianName !== undefined) {
        const name = splitName(text(patch.guardianName));
        row.guardian_first_name = name.first;
        row.guardian_last_name = name.last;
      }
    }

    const table = target.kind === "student" ? "students" : "admissions_leads";
    let failure: string | null = null;

    if (Object.keys(row).length) {
      // .select() so a row silently filtered out by RLS reads as a failure
      // rather than a success that wrote nothing.
      const { data, error } = await supabase
        .from(table)
        .update(row)
        .eq("id", target.id)
        .select("id");
      if (error) failure = error.message;
      else if (!data || data.length === 0) failure = "No matching record, or not visible to you";
    }

    if (!failure && target.kind === "student") {
      failure = await writeStudentContact(supabase, target.id, patch);
    }

    if (failure) blocked.push({ id: target.id, name: named(target), reason: failure });
    else changed += 1;
  }

  revalidate();

  if (blocked.length) {
    return {
      ok: false,
      error:
        changed > 0
          ? `${changed} updated, ${blocked.length} could not be`
          : "Nothing could be updated",
      code: "failed",
      blocked,
    };
  }

  return { ok: true, changed, message: `${changed} record${changed === 1 ? "" : "s"} updated` };
}

/* -------------------------------------------------------------- lifecycle -- */

async function archiveLead(
  supabase: Awaited<ReturnType<typeof createAuthClient>>,
  leadId: string,
  actorId: string | null,
  reason: string | null
): Promise<string | null> {
  const { data, error } = await supabase
    .from("admissions_leads")
    .update({
      archived_at: new Date().toISOString(),
      archived_by: actorId,
      archived_reason: reason,
    })
    .eq("id", leadId)
    .is("archived_at", null)
    .select("id");
  if (error) return error.message;
  if (!data || data.length === 0) return "Already archived, or not visible to you";
  return null;
}

/** Archive, or put back. Nothing here erases anything. */
export async function setPeopleArchived(input: {
  targets: Target[];
  archived: boolean;
  reason?: string | null;
}): Promise<PeopleResult> {
  const gate = await requireLifecycle();
  if (!gate.ok) return { ok: false, error: gate.error, code: "forbidden" };
  if (!input.targets.length) return { ok: false, error: "Nobody selected", code: "not_found" };

  const supabase = await createAuthClient();
  const actorId = gate.identity.effectiveUserId ?? null;
  const blocked: { id: string; name: string; reason: string }[] = [];
  let changed = 0;

  for (const target of input.targets) {
    let failure: string | null = null;

    if (target.kind === "student") {
      const result = input.archived
        ? await archiveStudent(supabase, { studentId: target.id, reason: input.reason ?? null })
        : await restoreStudent(supabase, { studentId: target.id });
      if (!result.ok) failure = result.error;
    } else if (input.archived) {
      failure = await archiveLead(supabase, target.id, actorId, input.reason ?? null);
    } else {
      const { data, error } = await supabase
        .from("admissions_leads")
        .update({ archived_at: null, archived_by: null, archived_reason: null })
        .eq("id", target.id)
        .select("id");
      if (error) failure = error.message;
      else if (!data || data.length === 0) failure = "Not visible to you";
    }

    if (failure) blocked.push({ id: target.id, name: named(target), reason: failure });
    else changed += 1;
  }

  revalidate();

  if (blocked.length) {
    return {
      ok: false,
      error: `${changed} done, ${blocked.length} could not be`,
      code: "failed",
      blocked,
    };
  }

  const verb = input.archived ? "archived" : "restored";
  return { ok: true, changed, message: `${changed} record${changed === 1 ? "" : "s"} ${verb}` };
}

/**
 * What actually stops a lead being deleted.
 *
 * Only one thing does: a student converted from it. That student's record
 * points back here, and a child's admissions history is not a stray row.
 *
 * Notes, tasks and the application deliberately do NOT block. All three are
 * declared `on delete cascade` against the lead (migration 050), so the
 * database is built to remove them with it -- they are parts of the lead, not
 * separate records that outlive it. An earlier version of this function
 * blocked on them, which refused 57 deletions out of 57: a single
 * automatically-generated follow-up task was enough to stop one. Being
 * stricter than the schema is not caution, it is a broken button.
 */
async function leadDependencies(
  supabase: Awaited<ReturnType<typeof createAuthClient>>,
  leadId: string
): Promise<string[]> {
  const { count, error } = await supabase
    .from("students")
    .select("id", { count: "exact", head: true })
    .eq("admissions_lead_id", leadId);

  // A read this role cannot perform is not evidence that nothing depends on
  // the lead, so it does not clear the way.
  if (error) return ["could not check for a linked student record"];
  if ((count ?? 0) > 0) {
    return [count === 1 ? "an enrolled student record" : `${count} enrolled student records`];
  }
  return [];
}

/**
 * Why did a delete affect no rows?
 *
 * PostgREST reports an RLS-refused delete as success with zero rows, which is
 * indistinguishable from "already gone" unless you look. Reading the row back
 * separates the two, and the difference matters: one is nothing to do, the
 * other is a permission that needs granting.
 */
async function explainZeroRowDelete(
  supabase: Awaited<ReturnType<typeof createAuthClient>>,
  table: "students" | "admissions_leads",
  id: string
): Promise<string> {
  const { data } = await supabase.from(table).select("id").eq("id", id).maybeSingle();
  if (data) {
    return table === "admissions_leads"
      ? "The database refused the delete. You can see this lead but your role cannot delete it — that needs admissions.manage or admissions.accept."
      : "The database refused the delete. You can see this student but your role cannot delete it.";
  }
  return "Already gone, or not visible to you.";
}

/**
 * Permanent deletion. Requires the typed token and the acknowledgement, refuses
 * anyone with dependencies, and reports who was refused and why.
 */
export async function deletePeople(input: {
  targets: Target[];
  confirmationText: string;
  acknowledged: boolean;
}): Promise<PeopleResult> {
  const gate = await requireLifecycle();
  if (!gate.ok) return { ok: false, error: gate.error, code: "forbidden" };
  if (!input.acknowledged || input.confirmationText !== "DELETE") {
    return {
      ok: false,
      error: 'Tick the box and type DELETE to continue.',
      code: "confirmation_required",
    };
  }
  if (!input.targets.length) return { ok: false, error: "Nobody selected", code: "not_found" };

  const supabase = await createAuthClient();
  const blocked: { id: string; name: string; reason: string }[] = [];
  let changed = 0;

  for (const target of input.targets) {
    if (target.kind === "student") {
      const result = await deleteStudent(supabase, {
        studentId: target.id,
        confirmationText: "DELETE",
        acknowledged: true,
      });
      if (result.ok) {
        changed += 1;
      } else if (result.code === "has_dependencies") {
        // Name what is holding it, not just that something is. "Has 3
        // invoices, attendance" is actionable; "has records attached" is not.
        const names = (result.dependencies?.blocking ?? [])
          .map((hit) => (hit.count > 1 ? `${hit.count} ${hit.label}` : hit.label))
          .filter(Boolean)
          .slice(0, 3);
        blocked.push({
          id: target.id,
          name: named(target),
          reason: names.length
            ? `Has ${names.join(", ")} — archive instead`
            : "Has records attached — archive instead",
        });
      } else if (result.code === "delete_failed") {
        blocked.push({
          id: target.id,
          name: named(target),
          reason: await explainZeroRowDelete(supabase, "students", target.id),
        });
      } else {
        blocked.push({ id: target.id, name: named(target), reason: result.error });
      }
      continue;
    }

    const dependencies = await leadDependencies(supabase, target.id);
    if (dependencies.length) {
      blocked.push({
        id: target.id,
        name: named(target),
        reason: `Has ${dependencies.join(", ")} — archive instead`,
      });
      continue;
    }

    const { data, error } = await supabase
      .from("admissions_leads")
      .delete()
      .eq("id", target.id)
      .select("id");
    if (error) {
      blocked.push({ id: target.id, name: named(target), reason: error.message });
    } else if (!data || data.length !== 1) {
      blocked.push({
        id: target.id,
        name: named(target),
        reason: await explainZeroRowDelete(supabase, "admissions_leads", target.id),
      });
    } else {
      changed += 1;
    }
  }

  revalidate();

  if (blocked.length) {
    return {
      ok: false,
      error:
        changed > 0
          ? `${changed} deleted. ${blocked.length} refused — see below.`
          : `Nothing was deleted. ${blocked.length} refused — see below.`,
      code: "has_dependencies",
      blocked,
    };
  }

  return { ok: true, changed, message: `${changed} record${changed === 1 ? "" : "s"} deleted` };
}
