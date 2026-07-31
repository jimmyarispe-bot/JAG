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
  const persona = searchParams.get("persona");
  return jsonOk(
    {
      recommendations: engine.recommend({
        organizationId: gate.organizationId,
        userId: gate.session.userId,
        persona,
      }),
      dashboard: engine.dashboard({
        organizationId: gate.organizationId,
        userId: gate.session.userId,
        persona,
      }),
      insights: engine.insights({
        organizationId: gate.organizationId,
        userId: gate.session.userId,
        persona,
      }),
      analytics: engine.analytics(
        gate.organizationId,
        gate.session.userId
      ),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    persona?: string;
    action?: "accept" | "dismiss" | "refresh";
    recommendationId?: string;
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
  const action = body.action ?? "refresh";

  if (action === "accept" && body.recommendationId) {
    return jsonOk(
      {
        result: engine.acceptRecommendation({
          organizationId: gate.organizationId,
          userId: gate.session.userId,
          recommendationId: body.recommendationId,
        }),
      },
      { correlationId: gate.correlationId, status: 201 }
    );
  }
  if (action === "dismiss" && body.recommendationId) {
    return jsonOk(
      {
        result: engine.dismissRecommendation({
          organizationId: gate.organizationId,
          userId: gate.session.userId,
          recommendationId: body.recommendationId,
        }),
      },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  return jsonOk(
    {
      recommendations: engine.recommend({
        organizationId: gate.organizationId,
        userId: gate.session.userId,
        persona: body.persona,
        signals: body.signals,
      }),
    },
    { correlationId: gate.correlationId, status: 201 }
  );
}
