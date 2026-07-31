import {
  createTemplateService,
  type CommunicationChannel,
  type CommunicationDomain,
  type TemplateStatus,
} from "@academyos";
import { paginate, parsePage } from "@academyos/api/pagination";
import {
  JagErrors,
  jsonError,
  jsonOk,
  requireAcademyOsOrg,
  requireAcademyOsOrgBody,
} from "@/app/api/academyos/_lib";

export async function GET(request: Request) {
  const gate = await requireAcademyOsOrg(request);
  if (!gate.ok) return gate.response;
  const { searchParams } = new URL(request.url);
  const service = createTemplateService();
  const templateId = searchParams.get("templateId");
  if (templateId) {
    return jsonOk(
      { template: service.get(gate.organizationId, templateId) },
      { correlationId: gate.correlationId }
    );
  }
  const items = service.search({
    organizationId: gate.organizationId,
    q: searchParams.get("q") ?? undefined,
    domain: (searchParams.get("domain") as CommunicationDomain) || undefined,
    status: (searchParams.get("status") as TemplateStatus) || undefined,
  });
  return jsonOk(
    { ...paginate(items, parsePage(searchParams)) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    key?: string;
    name?: string;
    domain?: CommunicationDomain;
    channel?: CommunicationChannel;
    subject?: string;
    body?: string;
    status?: "Draft" | "Published";
    action?: "render";
    templateId?: string;
    variables?: Record<string, string>;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  const service = createTemplateService();

  if (body.action === "render" && body.templateId) {
    const rendered = service.render({
      organizationId: gate.organizationId,
      templateId: body.templateId,
      variables: body.variables ?? {},
    });
    if (!rendered) return jsonError(JagErrors.notFound("Template not found."));
    if ("error" in rendered)
      return jsonError(JagErrors.validation(rendered.error));
    return jsonOk({ rendered }, { correlationId: gate.correlationId });
  }

  if (
    !body.key ||
    !body.name ||
    !body.domain ||
    !body.channel ||
    body.subject == null ||
    body.body == null
  ) {
    return jsonError(
      JagErrors.validation(
        "key, name, domain, channel, subject, and body are required."
      )
    );
  }
  const created = service.create({
    organizationId: gate.organizationId,
    key: body.key,
    name: body.name,
    domain: body.domain,
    channel: body.channel,
    subject: body.subject,
    body: body.body,
    status: body.status,
    createdBy: gate.session.userId,
  });
  if ("error" in created) return jsonError(JagErrors.validation(created.error));
  return jsonOk(
    { template: created },
    { correlationId: gate.correlationId, status: 201 }
  );
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    templateId?: string;
    action?: "publish";
    subject?: string;
    body?: string;
    name?: string;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.templateId) {
    return jsonError(JagErrors.validation("templateId is required."));
  }
  const service = createTemplateService();
  if (body.action === "publish") {
    const published = service.publish({
      organizationId: gate.organizationId,
      templateId: body.templateId,
      actor: gate.session.userId,
    });
    if (!published) return jsonError(JagErrors.notFound("Template not found."));
    if ("error" in published)
      return jsonError(JagErrors.validation(published.error));
    return jsonOk(
      { template: published },
      { correlationId: gate.correlationId }
    );
  }
  const patched = service.patch({
    organizationId: gate.organizationId,
    templateId: body.templateId,
    subject: body.subject,
    body: body.body,
    name: body.name,
    actor: gate.session.userId,
  });
  if (!patched) return jsonError(JagErrors.notFound("Template not found."));
  if ("error" in patched) return jsonError(JagErrors.validation(patched.error));
  return jsonOk({ template: patched }, { correlationId: gate.correlationId });
}
