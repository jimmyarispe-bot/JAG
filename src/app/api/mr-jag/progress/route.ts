import {
  buildMrJagDashboard,
  createMrJagProgressService,
  installMrJag,
  type CoachTrigger,
} from "@mr-jag";
import { jsonOk, requireMrJagOrg, requireMrJagOrgBody } from "../_lib";

export async function GET(request: Request) {
  const gate = await requireMrJagOrg(request);
  if (!gate.ok) return gate.response;
  installMrJag();
  const { searchParams } = new URL(request.url);
  if (searchParams.get("dashboard") === "1") {
    const dashboard = buildMrJagDashboard({
      organizationId: gate.organizationId,
      userId: gate.session.userId,
      persona: searchParams.get("persona"),
    });
    return jsonOk({ dashboard }, { correlationId: gate.correlationId });
  }
  const progress = createMrJagProgressService().ensure({
    organizationId: gate.organizationId,
    userId: gate.session.userId,
    persona: searchParams.get("persona"),
  });
  return jsonOk({ progress }, { correlationId: gate.correlationId });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    persona?: string;
    pageId?: string;
    walkthroughId?: string;
    recentTriggers?: CoachTrigger[];
    dashboard?: boolean;
  };
  const gate = await requireMrJagOrgBody(body);
  if (!gate.ok) return gate.response;
  installMrJag();
  const svc = createMrJagProgressService();
  if (body.pageId) {
    const progress = svc.completePage({
      organizationId: gate.organizationId,
      userId: gate.session.userId,
      pageId: body.pageId,
      persona: body.persona,
    });
    return jsonOk(
      { progress },
      { correlationId: gate.correlationId, status: 201 }
    );
  }
  if (body.walkthroughId) {
    const progress = svc.completeWalkthrough({
      organizationId: gate.organizationId,
      userId: gate.session.userId,
      walkthroughId: body.walkthroughId,
      persona: body.persona,
    });
    return jsonOk(
      { progress },
      { correlationId: gate.correlationId, status: 201 }
    );
  }
  if (body.dashboard) {
    const dashboard = buildMrJagDashboard({
      organizationId: gate.organizationId,
      userId: gate.session.userId,
      persona: body.persona,
      recentTriggers: body.recentTriggers,
    });
    return jsonOk(
      { dashboard },
      { correlationId: gate.correlationId, status: 201 }
    );
  }
  const progress = svc.ensure({
    organizationId: gate.organizationId,
    userId: gate.session.userId,
    persona: body.persona,
  });
  return jsonOk(
    { progress },
    { correlationId: gate.correlationId, status: 201 }
  );
}
