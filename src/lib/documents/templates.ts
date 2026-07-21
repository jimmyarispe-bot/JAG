import { resolveActorUserId, resolveSchoolContext } from "@/lib/platform/shared/context";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { recordDocumentActivity } from "./activity";
import { createDocument, type DocumentMutationResult } from "./service";
import type { CreateDocumentInput, DocumentCategory, DocumentTemplateRow } from "./types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function listDocumentTemplates(
  supabase: AuthClient,
  options?: { organizationId?: string | null; schoolId?: string | null; activeOnly?: boolean }
): Promise<DocumentTemplateRow[]> {
  let request = supabase.from("platform_document_templates").select("*").order("name");
  if (options?.organizationId) {
    request = request.eq("organization_id", options.organizationId);
  }
  if (options?.schoolId) {
    request = request.or(`school_id.eq.${options.schoolId},school_id.is.null`);
  }
  if (options?.activeOnly !== false) {
    request = request.eq("is_active", true);
  }
  const { data } = await request;
  return (data ?? []) as DocumentTemplateRow[];
}

export async function getDocumentTemplate(
  supabase: AuthClient,
  templateId: string
): Promise<DocumentTemplateRow | null> {
  const { data } = await supabase
    .from("platform_document_templates")
    .select("*")
    .eq("id", templateId)
    .maybeSingle();
  return (data as DocumentTemplateRow | null) ?? null;
}

export async function duplicateFromTemplate(
  supabase: AuthClient,
  templateId: string,
  overrides?: Partial<CreateDocumentInput> & { title?: string }
): Promise<DocumentMutationResult> {
  const template = await getDocumentTemplate(supabase, templateId);
  if (!template) return { ok: false, error: "Template not found", code: "not_found" };
  if (!template.is_active) {
    return { ok: false, error: "Template is inactive" };
  }

  const schoolId = overrides?.schoolId ?? template.school_id;
  const schoolCtx = schoolId ? await resolveSchoolContext(supabase, schoolId) : null;
  const actorUserId = await resolveActorUserId(supabase);

  const result = await createDocument(supabase, {
    title: overrides?.title ?? `${template.name}`,
    description: overrides?.description ?? template.description,
    category: (overrides?.category ?? template.category) as DocumentCategory,
    documentType: overrides?.documentType ?? "template_instance",
    schoolId,
    organizationId:
      overrides?.organizationId ?? template.organization_id ?? schoolCtx?.organizationId,
    tags: overrides?.tags ?? ["from-template", template.template_key],
    status: overrides?.status ?? "draft",
    fileName: overrides?.fileName ?? null,
    mimeType: overrides?.mimeType ?? template.mime_type,
    fileUrl: overrides?.fileUrl ?? template.file_url,
    templateId: template.id,
    workflowId: overrides?.workflowId ?? null,
    relations: overrides?.relations,
    metadata: {
      ...(overrides?.metadata ?? {}),
      templateKey: template.template_key,
      bodyText: template.body_text,
    },
  });

  if (result.ok) {
    await supabase
      .from("platform_document_templates")
      .update({
        usage_count: template.usage_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", template.id);

    await recordDocumentActivity(supabase, {
      eventType: "template.used",
      title: "Document template used",
      summary: template.name,
      entityId: result.documentId,
      organizationId:
        overrides?.organizationId ?? template.organization_id ?? schoolCtx?.organizationId,
      schoolId,
      actorUserId,
      payload: {
        templateId: template.id,
        templateKey: template.template_key,
        auditId: result.auditId,
      },
    });
  }

  return result;
}
