import { gatherDiagnostics, installMrJag } from "@mr-jag";
import { jsonOk, requireMrJagOrg, requireMrJagOrgBody } from "../../_lib";

export async function GET(request: Request) {
  const gate = await requireMrJagOrg(request);
  if (!gate.ok) return gate.response;
  installMrJag();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? searchParams.get("question") ?? "";
  const diagnostics = gatherDiagnostics({
    question: q,
    persona: searchParams.get("persona"),
    organizationId: gate.organizationId,
    role: gate.session.role,
    includeGraph: searchParams.get("graph") === "1",
  });
  return jsonOk({ diagnostics }, { correlationId: gate.correlationId });
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
  const diagnostics = gatherDiagnostics({
    question: body.question ?? "",
    persona: body.persona,
    organizationId: gate.organizationId,
    role: gate.session.role,
    includeGraph: body.includeGraph === true,
  });
  return jsonOk(
    { diagnostics },
    { correlationId: gate.correlationId, status: 201 }
  );
}
