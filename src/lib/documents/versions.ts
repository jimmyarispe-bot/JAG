import type { createAuthClient } from "@/lib/supabase/server-auth";
import type { DocumentVersionRow } from "./types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function listDocumentVersions(
  supabase: AuthClient,
  documentId: string
): Promise<DocumentVersionRow[]> {
  const { data } = await supabase
    .from("platform_document_versions")
    .select("*")
    .eq("document_id", documentId)
    .order("version_number", { ascending: false });
  return (data ?? []) as DocumentVersionRow[];
}

export async function getDocumentVersion(
  supabase: AuthClient,
  documentId: string,
  versionNumber: number
): Promise<DocumentVersionRow | null> {
  const { data } = await supabase
    .from("platform_document_versions")
    .select("*")
    .eq("document_id", documentId)
    .eq("version_number", versionNumber)
    .maybeSingle();
  return (data as DocumentVersionRow | null) ?? null;
}

export { compareVersions } from "./compare";
