import {
  createMrJagIntelligentHelpService,
  installMrJag,
} from "@mr-jag";
import { jsonOk, requireMrJagOrg, requireMrJagOrgBody } from "../../_lib";

export async function GET(request: Request) {
  const gate = await requireMrJagOrg(request);
  if (!gate.ok) return gate.response;
  installMrJag();
  const dashboard = createMrJagIntelligentHelpService().dashboard(
    gate.organizationId
  );
  return jsonOk({ dashboard }, { correlationId: gate.correlationId });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    question?: string;
    persona?: string;
    role?: string;
    includeGraph?: boolean;
  };
  const gate = await requireMrJagOrgBody(body);
  if (!gate.ok) return gate.response;
  installMrJag();
  const result = createMrJagIntelligentHelpService().diagnose({
    question: body.question ?? "",
    organizationId: gate.organizationId,
    userId: gate.session.userId,
    persona: body.persona,
    role: body.role,
    includeGraph: body.includeGraph === true,
  });
  return jsonOk(
    { result },
    { correlationId: gate.correlationId, status: 201 }
  );
}
