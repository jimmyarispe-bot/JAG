import {
  createMrJagCoachEngine,
  installMrJag,
  type CoachEventKind,
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
      catalog: engine.listEventCatalog(),
      events: engine.listEvents({
        organizationId: gate.organizationId,
        userId: gate.session.userId,
        kind: searchParams.get("kind") ?? undefined,
        limit: Number(searchParams.get("limit") ?? 50) || 50,
      }),
      milestones: engine.milestones({
        organizationId: gate.organizationId,
        userId: gate.session.userId,
      }),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    kind?: CoachEventKind;
    kinds?: CoachEventKind[];
    persona?: string;
    metadata?: Record<string, string | number | boolean>;
    custom?: {
      kind: string;
      title: string;
      description: string;
      personas?: string[];
      coachingType?: string;
    };
    syncHelp?: boolean;
  };
  const gate = await requireMrJagOrgBody(body);
  if (!gate.ok) return gate.response;
  installMrJag();
  const engine = createMrJagCoachEngine();

  if (body.custom) {
    const registered = engine.registerCustomEvent({
      kind: body.custom.kind,
      title: body.custom.title,
      description: body.custom.description,
      personas: Object.freeze(
        (body.custom.personas ?? ["Executive"]) as never
      ),
      coachingType: (body.custom.coachingType as never) ?? "behavior",
    });
    return jsonOk(
      { registered },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  if (body.syncHelp) {
    const synced = engine.syncFromHelpCenter({
      organizationId: gate.organizationId,
      userId: gate.session.userId,
    });
    return jsonOk(
      { synced },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  if (body.kinds?.length) {
    const result = engine.observeMany({
      kinds: body.kinds,
      organizationId: gate.organizationId,
      userId: gate.session.userId,
      persona: body.persona,
    });
    return jsonOk(
      { result },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  const result = engine.observe({
    kind: body.kind ?? "first_login",
    organizationId: gate.organizationId,
    userId: gate.session.userId,
    persona: body.persona,
    metadata: body.metadata,
  });
  return jsonOk(
    { result },
    { correlationId: gate.correlationId, status: 201 }
  );
}
