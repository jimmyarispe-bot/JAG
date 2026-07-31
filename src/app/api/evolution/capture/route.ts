import { createEvolutionEngine } from "@evolution";
import { installMrJag } from "@mr-jag";
import { jsonOk, requireEvolutionOrg, requireEvolutionOrgBody } from "../_lib";

export async function GET(request: Request) {
  const gate = await requireEvolutionOrg(request);
  if (!gate.ok) return gate.response;
  installMrJag();
  const engine = createEvolutionEngine();
  return jsonOk(
    {
      requests: engine.listRequests({
        organizationId: gate.organizationId,
        limit: 50,
      }),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    text?: string;
    persona?: string;
    product?: string;
    page?: string;
    workflow?: string;
    title?: string;
    analyze?: boolean;
  };
  const gate = await requireEvolutionOrgBody(body);
  if (!gate.ok) return gate.response;
  installMrJag();
  const engine = createEvolutionEngine();
  const text = body.text ?? "";

  if (body.analyze !== false) {
    const result = engine.teach({
      text,
      organizationId: gate.organizationId,
      userId: gate.session.userId,
      persona: body.persona,
      product: body.product,
      page: body.page,
      workflow: body.workflow,
      title: body.title,
      includeGraph: false,
    });
    return jsonOk(
      {
        request: result.request,
        proposal: result.proposal,
        mrJagMessage: result.mrJagMessage,
        generatesProductionCode: false,
        requiresStudioApproval: true,
      },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  const captured = engine.capture({
    text,
    organizationId: gate.organizationId,
    userId: gate.session.userId,
    persona: body.persona,
    product: body.product,
    page: body.page,
    workflow: body.workflow,
    title: body.title,
  });
  return jsonOk(
    { request: captured },
    { correlationId: gate.correlationId, status: 201 }
  );
}
