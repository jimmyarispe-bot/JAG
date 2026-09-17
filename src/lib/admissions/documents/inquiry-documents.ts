"use server";

/**
 * Opening a document a family uploaded with their inquiry.
 *
 * These files live in a private bucket under a quarantine prefix and a
 * server-generated name, put there by /api/apply/upload before the family had
 * an account. The row that says whose they are is in application_documents,
 * carrying lead_id and a null application_id - see migration 326 and
 * attachInquiryDocuments in interest-form/submit.ts.
 *
 * The link is minted per click rather than rendered into the page, which is the
 * same rule person_documents follows and for the same reason: these are
 * children's scholarship records, and revoking someone's access should actually
 * revoke it rather than leave working URLs in already-served HTML.
 */

import { createServiceRoleClient } from "@/lib/supabase/server";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { hasPermission } from "@/lib/platform/identity/authorization-service";

const BUCKET = "admissions-documents";

/** Short on purpose. Long enough to open a PDF, short enough not to be a link. */
const SIGNED_URL_TTL_SECONDS = 300;

const VIEW_PERMISSIONS = ["admissions.view", "admissions.manage", "admissions.accept"];

export async function getAdmissionsDocumentUrl(
  documentId: string
): Promise<{ url: string } | { error: string }> {
  const identity = await getIdentityContext();
  if (!identity) return { error: "Not signed in." };

  if (!VIEW_PERMISSIONS.some((permission) => hasPermission(identity, permission))) {
    // Name the permission. A bare "not allowed" sends the operator off to guess
    // at their own roles, which has cost hours before.
    return {
      error: `This needs one of ${VIEW_PERMISSIONS.join(", ")}. Your roles: ${
        identity.roles?.length ? identity.roles.join(", ") : "none"
      }.`,
    };
  }

  const admin = createServiceRoleClient();
  const { data: row, error } = await admin
    .from("application_documents")
    .select("storage_path, file_name")
    .eq("id", documentId)
    .maybeSingle();

  if (error) return { error: error.message };
  if (!row) return { error: "That document could not be found." };

  const storagePath = (row as { storage_path?: string | null }).storage_path;
  if (!storagePath) return { error: "That record has no file attached." };

  const { data: signed, error: signError } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

  if (signError || !signed) {
    return { error: signError?.message ?? "Could not create a link to that file." };
  }

  return { url: signed.signedUrl };
}
