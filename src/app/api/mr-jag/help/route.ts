import { createMrJagHelpService, installMrJag } from "@mr-jag";
import { jsonOk, requireMrJagOrg, requireMrJagOrgBody } from "../_lib";

export async function GET(request: Request) {
  const gate = await requireMrJagOrg(request);
  if (!gate.ok) return gate.response;
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? searchParams.get("question");
  if (!q) {
    return jsonOk(
      { ready: true, hint: "Pass q= or POST { question }" },
      { correlationId: gate.correlationId }
    );
  }
  installMrJag();
  const help = createMrJagHelpService().answer({
    question: q,
    persona: searchParams.get("persona"),
    userId: gate.session.userId,
    includeGraph: searchParams.get("graph") === "1",
  });
  return jsonOk({ help }, { correlationId: gate.correlationId });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    question?: string;
    persona?: string;
    includeGraph?: boolean;
  };
  const gate = await requireMrJagOrgBody(body);
  if (!gate.ok) return gate.response;
  installMrJag();
  const help = createMrJagHelpService().answer({
    question: body.question ?? "",
    persona: body.persona,
    userId: gate.session.userId,
    includeGraph: body.includeGraph === true,
  });
  return jsonOk({ help }, { correlationId: gate.correlationId, status: 201 });
}
