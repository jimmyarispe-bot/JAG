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
  const status = searchParams.get("status") as
    | "active"
    | "accepted"
    | "dismissed"
    | "completed"
    | null;
  return jsonOk(
    {
      timeline: engine.timeline({
        organizationId: gate.organizationId,
        userId: gate.session.userId,
        status: status ?? undefined,
        limit: Number(searchParams.get("limit") ?? 100) || 100,
      }),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: "complete" | "accept" | "dismiss";
    timelineId?: string;
    recommendationId?: string;
  };
  const gate = await requireMrJagOrgBody(body);
  if (!gate.ok) return gate.response;
  installMrJag();
  const engine = createMrJagCoachEngine();

  if (body.action === "complete" && body.timelineId) {
    return jsonOk(
      {
        entry: engine.completeGuidance({
          organizationId: gate.organizationId,
          userId: gate.session.userId,
          timelineId: body.timelineId,
        }),
      },
      { correlationId: gate.correlationId, status: 201 }
    );
  }
  if (body.action === "accept" && body.recommendationId) {
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
  if (body.action === "dismiss" && body.recommendationId) {
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
      timeline: engine.timeline({
        organizationId: gate.organizationId,
        userId: gate.session.userId,
      }),
    },
    { correlationId: gate.correlationId, status: 201 }
  );
}
