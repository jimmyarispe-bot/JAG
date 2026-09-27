"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { hasPermission } from "@/lib/platform/identity/authorization-service";
import type { PermissionKey } from "@/lib/platform/identity/types";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  hashInterestFormDefinition,
  parseInterestFormDefinition,
  validateInterestFormDefinition,
} from "@/lib/admissions/interest-form/definition";
import { openDraftFromPublished } from "@/lib/admissions/interest-form/versioning";
import {
  applyTextEdits,
  onlyTextChanged,
  type TextEdits,
} from "@/lib/admissions/interest-form/text-edits";
import type { InterestFormDefinition } from "@/lib/admissions/interest-form/types";

const FORM_BUILDER_PERMISSION: PermissionKey = "FORM_BUILDER_ACCESS";
const FORMS_PATH = "/dashboard/admin/forms";

type Refusal = { error: string };
type Done = { success: true; message: string };

/**
 * The gate, once, for every action in this file.
 *
 * Reading the form uses the service role because the definition tables are
 * locked to the public submission path - so this check IS the authorization.
 * It is not a convenience; nothing else stands between a request and a
 * change to the words families read.
 */
async function requireFormBuilder() {
  const identity = await getIdentityContext();
  if (!identity) redirect("/login");
  if (!hasPermission(identity, FORM_BUILDER_PERMISSION)) {
    return { identity: null, refusal: { error: "You cannot edit forms." } as Refusal };
  }
  return { identity, refusal: null };
}

type FormRow = {
  id: string;
  organization_id: string;
  draft_version_id: string | null;
  published_version_id: string | null;
};

type VersionRow = {
  id: string;
  version_number: number;
  lifecycle: string;
  definition: unknown;
};

async function readForm(formId: string) {
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("admissions_interest_forms" as never)
    .select("id, organization_id, draft_version_id, published_version_id")
    .eq("id", formId)
    .maybeSingle();
  if (error) return { admin, form: null, error: error.message };
  return { admin, form: (data as FormRow | null) ?? null, error: null as string | null };
}

/**
 * Open a working draft from what is live.
 *
 * ONE DRAFT AT A TIME, which openDraftFromPublished enforces: two people
 * editing two drafts of the same form would each publish over the other and
 * neither would see it happen.
 */
export async function openFormDraftAction(formId: string): Promise<Done | Refusal> {
  const { refusal } = await requireFormBuilder();
  if (refusal) return refusal;

  const { admin, form, error } = await readForm(formId);
  if (error) return { error };
  if (!form) return { error: "That form does not exist." };
  if (form.draft_version_id) {
    return { error: "A working draft is already open. Publish or discard it first." };
  }
  if (!form.published_version_id) {
    return { error: "That form has no published version to draft from." };
  }

  const { data: publishedRow, error: versionError } = await admin
    .from("admissions_interest_form_versions" as never)
    .select("id, version_number, lifecycle, definition")
    .eq("id", form.published_version_id)
    .maybeSingle();

  if (versionError) return { error: versionError.message };
  const published = publishedRow as VersionRow | null;
  if (!published) return { error: "The published version could not be read." };

  const definition = parseInterestFormDefinition(published.definition);
  if (!definition) return { error: "The published version's definition could not be read." };

  /* The rules live in versioning.ts and are already tested. This action is
     persistence around them, not a second copy of the lifecycle. */
  let draft;
  try {
    ({ draft } = openDraftFromPublished({
      form: {
        id: form.id,
        organizationId: form.organization_id,
        title: definition.title,
        draftVersionId: form.draft_version_id,
        publishedVersionId: form.published_version_id,
      },
      published: {
        id: published.id,
        formId: form.id,
        organizationId: form.organization_id,
        versionNumber: published.version_number,
        lifecycle: "published",
        definition,
        contentHash: hashInterestFormDefinition(definition),
      },
    }));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "The draft could not be opened." };
  }

  const identity = await getIdentityContext();

  const { error: insertError } = await admin
    .from("admissions_interest_form_versions" as never)
    .insert({
      id: draft.id,
      form_id: form.id,
      organization_id: form.organization_id,
      version_number: draft.versionNumber,
      lifecycle: "draft",
      schema_version: definition.schemaVersion,
      definition: draft.definition,
      content_hash: draft.contentHash,
      created_by: identity?.effectiveUserId ?? null,
    } as never);

  if (insertError) return { error: insertError.message };

  const { error: pointerError } = await admin
    .from("admissions_interest_forms" as never)
    .update({ draft_version_id: draft.id, updated_at: new Date().toISOString() } as never)
    .eq("id", form.id);

  if (pointerError) return { error: pointerError.message };

  revalidatePath(FORMS_PATH);
  return { success: true, message: `Draft v${draft.versionNumber} opened. Nothing is live yet.` };
}

/**
 * Save wording into the working draft.
 *
 * NOTHING A FAMILY SEES CHANGES HERE. The draft is not the published version;
 * the public form keeps serving the live one until somebody publishes.
 *
 * The guard runs on the result, not on the intention: applyTextEdits only
 * touches text by construction, and onlyTextChanged proves it before the row
 * is written. If that ever disagrees, the save refuses and says which
 * structural thing moved.
 */
export async function saveFormDraftTextAction(
  formId: string,
  edits: TextEdits
): Promise<Done | Refusal> {
  const { refusal } = await requireFormBuilder();
  if (refusal) return refusal;

  const { admin, form, error } = await readForm(formId);
  if (error) return { error };
  if (!form?.draft_version_id) {
    return { error: "There is no working draft to save into. Open one first." };
  }

  const { data: draftRow, error: draftError } = await admin
    .from("admissions_interest_form_versions" as never)
    .select("id, version_number, lifecycle, definition")
    .eq("id", form.draft_version_id)
    .maybeSingle();

  if (draftError) return { error: draftError.message };
  const draft = draftRow as VersionRow | null;
  if (!draft) return { error: "The working draft could not be read." };
  if (draft.lifecycle !== "draft") {
    return { error: `That version is ${draft.lifecycle}, not a draft, so it cannot be edited.` };
  }

  const current = parseInterestFormDefinition(draft.definition);
  if (!current) return { error: "The draft's definition could not be read." };

  const next: InterestFormDefinition = applyTextEdits(current, edits);

  /* Wording, plus whether a family must answer - and nothing else. The
     allowance is explicit here rather than assumed inside the guard, so a
     future caller that has no checkbox behind it still gets the strict rule. */
  const structural = onlyTextChanged(current, next, { allowRequiredChanges: true });
  if (structural.length > 0) {
    return {
      error:
        "This would change more than the wording, so nothing has been saved: " +
        structural.join("; ") +
        ". Tell Jimmy - this is a bug in the editor, not something you did.",
    };
  }

  const invalid = validateInterestFormDefinition(next);
  if (invalid.length > 0) {
    return { error: `The form would not be valid: ${invalid.join("; ")}. Nothing has been saved.` };
  }

  const { error: writeError } = await admin
    .from("admissions_interest_form_versions" as never)
    .update({
      definition: next,
      content_hash: hashInterestFormDefinition(next),
    } as never)
    .eq("id", draft.id)
    .eq("lifecycle", "draft");

  if (writeError) return { error: writeError.message };

  revalidatePath(FORMS_PATH);
  return {
    success: true,
    message: `Saved to draft v${draft.version_number}. Families still see the live version.`,
  };
}

/**
 * Make the draft the live form.
 *
 * The swap is one database transaction (migration 432) because the unique
 * index allows one published version per form - doing it in three statements
 * from here would leave a window where the public form has none.
 */
export async function publishFormDraftAction(formId: string): Promise<Done | Refusal> {
  const { refusal } = await requireFormBuilder();
  if (refusal) return refusal;

  const admin = createServiceRoleClient();
  const { data, error } = await admin.rpc(
    "publish_interest_form_draft" as never,
    { p_form_id: formId } as never
  );

  if (error) return { error: error.message };

  revalidatePath(FORMS_PATH);
  revalidatePath("/apply");
  return {
    success: true,
    message: `Published. Families now see v${String(data)}, and the version before it is archived and still readable.`,
  };
}

/**
 * Throw the draft away.
 *
 * DELETED, NOT ARCHIVED. An archived version is one families once answered;
 * a discarded draft was never in front of anybody, and keeping it in the same
 * history would make the archive mean two different things. The version
 * number it used is left unused, which is honest - somebody started a change
 * and abandoned it.
 */
export async function discardFormDraftAction(formId: string): Promise<Done | Refusal> {
  const { refusal } = await requireFormBuilder();
  if (refusal) return refusal;

  const { admin, form, error } = await readForm(formId);
  if (error) return { error };
  if (!form?.draft_version_id) return { error: "There is no working draft to discard." };

  const draftId = form.draft_version_id;

  const { error: pointerError } = await admin
    .from("admissions_interest_forms" as never)
    .update({ draft_version_id: null, updated_at: new Date().toISOString() } as never)
    .eq("id", form.id);

  if (pointerError) return { error: pointerError.message };

  /* The pointer is cleared first. If this delete fails the row is orphaned
     rather than referenced, which is recoverable and invisible; the reverse
     order would leave the form pointing at a version that no longer exists. */
  const { error: deleteError } = await admin
    .from("admissions_interest_form_versions" as never)
    .delete()
    .eq("id", draftId)
    .eq("lifecycle", "draft");

  if (deleteError) {
    return {
      error: `The draft was closed but its row could not be removed: ${deleteError.message}`,
    };
  }

  revalidatePath(FORMS_PATH);
  return { success: true, message: "Draft discarded. The live form is unchanged." };
}
