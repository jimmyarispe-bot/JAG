import {
  createMrJagIntelligentHelpService,
  installMrJag,
} from "@mr-jag";
import { jsonOk, requireMrJagOrg, requireMrJagOrgBody } from "../../_lib";

export async function GET(request: Request) {
  const gate = await requireMrJagOrg(request);
  if (!gate.ok) return gate.response;
  installMrJag();
  const { searchParams } = new URL(request.url);
  const svc = createMrJagIntelligentHelpService();
  if (searchParams.get("dashboard") === "1") {
    return jsonOk(
      { dashboard: svc.dashboard(gate.organizationId) },
      { correlationId: gate.correlationId }
    );
  }
  return jsonOk(
    { incidents: svc.listIncidents(gate.organizationId) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    incidentId?: string;
    resolution?: string;
    verified?: boolean;
  };
  const gate = await requireMrJagOrgBody(body);
  if (!gate.ok) return gate.response;
  installMrJag();
  const captured = createMrJagIntelligentHelpService().resolve({
    incidentId: body.incidentId ?? "",
    resolution: body.resolution,
    verified: body.verified,
  });
  return jsonOk(
    { captured },
    { correlationId: gate.correlationId, status: 201 }
  );
}
