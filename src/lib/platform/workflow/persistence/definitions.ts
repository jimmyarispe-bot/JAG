import type { createAuthClient } from "@/lib/supabase/server-auth";
import type {
  PlatformWorkflowDefinitionRow,
  PlatformWorkflowVersionRow,
} from "@/lib/platform/workflow/persistence/types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/** Load the published version for a workflow key (platform-wide or school-scoped). */
export async function getPublishedWorkflowVersion(
  supabase: AuthClient,
  workflowKey: string,
  schoolId?: string | null
): Promise<{ definition: PlatformWorkflowDefinitionRow; version: PlatformWorkflowVersionRow } | null> {
  let defQuery = supabase
    .from("platform_workflow_definitions")
    .select("*")
    .eq("workflow_key", workflowKey)
    .eq("status", "published");

  if (schoolId) {
    defQuery = defQuery.or(`school_id.is.null,school_id.eq.${schoolId}`);
  } else {
    defQuery = defQuery.is("school_id", null);
  }

  const { data: definitions } = await defQuery;
  const definition = (definitions ?? [])[0] as PlatformWorkflowDefinitionRow | undefined;
  if (!definition) return null;

  const { data: version } = await supabase
    .from("platform_workflow_versions")
    .select("*")
    .eq("definition_id", definition.id)
    .eq("status", "published")
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!version) return null;

  return {
    definition,
    version: version as PlatformWorkflowVersionRow,
  };
}

/** Load a workflow version by id. */
export async function getWorkflowVersionById(
  supabase: AuthClient,
  versionId: string
): Promise<PlatformWorkflowVersionRow | null> {
  const { data } = await supabase
    .from("platform_workflow_versions")
    .select("*")
    .eq("id", versionId)
    .maybeSingle();

  return (data as PlatformWorkflowVersionRow | null) ?? null;
}

/** List versions for a definition — instances stay pinned to their version. */
export async function listWorkflowVersions(
  supabase: AuthClient,
  definitionId: string
): Promise<PlatformWorkflowVersionRow[]> {
  const { data } = await supabase
    .from("platform_workflow_versions")
    .select("*")
    .eq("definition_id", definitionId)
    .order("version_number", { ascending: false });

  return (data ?? []) as PlatformWorkflowVersionRow[];
}
