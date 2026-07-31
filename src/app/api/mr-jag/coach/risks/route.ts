import {
  createMrJagCoachEngine,
  installMrJag,
} from "@mr-jag";
import { jsonOk, requireMrJagOrg, requireMrJagOrgBody } from "../../_lib";

export async function GET(request: Request) {
  const gate = await requireMrJagOrg(request);
  if (!gate.ok) return gate.response;
  installMrJag();
  const { searchParams } = new URL(request.url);
  const engine = createMrJagCoachEngine();
  return jsonOk(
    {
      risks: engine.detectRisks({
        organizationId: gate.organizationId,
        userId: gate.session.userId,
        persona: searchParams.get("persona"),
      }),
      open: engine.listRisks({
        organizationId: gate.organizationId,
        userId: gate.session.userId,
        openOnly: true,
      }),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    persona?: string;
    action?: "detect" | "close";
    riskId?: string;
    signals?: {
      missingBackups?: boolean;
      unusedFeatureIds?: string[];
      configurationIssue?: boolean;
      inactiveWorkflowIds?: string[];
      unapprovedPayroll?: boolean;
      connectorFailure?: boolean;
      expiredCertificationIds?: string[];
    };
  };
  const gate = await requireMrJagOrgBody(body);
  if (!gate.ok) return gate.response;
  installMrJag();
  const engine = createMrJagCoachEngine();

  if (body.action === "close" && body.riskId) {
    return jsonOk(
      { risk: engine.closeRisk(body.riskId) },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  return jsonOk(
    {
      risks: engine.detectRisks({
        organizationId: gate.organizationId,
        userId: gate.session.userId,
        persona: body.persona,
        signals: body.signals,
      }),
    },
    { correlationId: gate.correlationId, status: 201 }
  );
}
