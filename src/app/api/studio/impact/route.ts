import {
  createImpactService,
  type ImpactChangeKind,
} from "@studio";
import { JagErrors, jsonError, jsonOk, requireStudioOrg } from "../_lib";

export async function GET(request: Request) {
  const gate = await requireStudioOrg(request);
  if (!gate.ok) return gate.response;
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("target")?.trim();
  if (!target) {
    return jsonError(JagErrors.validation("target is required."));
  }
  const changeKind =
    (searchParams.get("changeKind") as ImpactChangeKind | null) ?? "generic";
  const report = createImpactService().analyze({ target, changeKind });
  return jsonOk({ impact: report }, { correlationId: gate.correlationId });
}

export async function POST(request: Request) {
  const gate = await requireStudioOrg(request);
  if (!gate.ok) return gate.response;
  let body: {
    target?: string;
    changeKind?: ImpactChangeKind;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError(JagErrors.validation("Invalid JSON body."));
  }
  if (!body.target?.trim()) {
    return jsonError(JagErrors.validation("target is required."));
  }
  const report = createImpactService().analyze({
    target: body.target.trim(),
    changeKind: body.changeKind ?? "generic",
  });
  return jsonOk({ impact: report }, { correlationId: gate.correlationId });
}
